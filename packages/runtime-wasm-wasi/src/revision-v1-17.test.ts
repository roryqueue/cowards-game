import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  StrategyRevisionSchema,
  StrategyRevisionV117Schema,
} from "@cowards/spec"
import {
  buildRustStrategyRevisionV117,
  buildWasmWasiRequestSourceIdentityV117,
  buildZigStrategyRevisionV117,
  readWasmWasiSourceIdentityAttestationV117,
} from "./validation.js"

const rustSourceLf = `fn main() {
    print!("{}", r#"{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}"#);
}
`

const zigSourceLf = `const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };
extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;
export fn _start() void {
    const bytes = "{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":null}";
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}
`

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const decodeLeb128 = (bytes: Buffer, start: number) => {
  let value = 0
  let shift = 0
  let offset = start
  while (offset < bytes.byteLength) {
    const byte = bytes[offset++]!
    value |= (byte & 0x7f) << shift
    if ((byte & 0x80) === 0) return { value, next: offset }
    shift += 7
  }
  throw new TypeError("truncated unsigned LEB128")
}

const lastWasmSectionOffset = (bytes: Buffer): number => {
  let offset = 8
  let last = offset
  while (offset < bytes.byteLength) {
    last = offset
    const length = decodeLeb128(bytes, offset + 1)
    offset = length.next + length.value
  }
  if (offset !== bytes.byteLength) throw new TypeError("invalid WASM sections")
  return last
}

describe("Rust/Zig Strategy Revision v1.17 producers", () => {
  it.each([
    [
      "rust",
      rustSourceLf.replace(/\n/gu, "\r\n"),
      buildRustStrategyRevisionV117,
    ],
    ["zig", zigSourceLf, buildZigStrategyRevisionV117],
  ] as const)(
    "builds a genuine %s artifact with direct request and framed artifact identities",
    (language, source, build) => {
      const revision = build({ source })
      const artifact = revision.metadata.compiledArtifact
      const requestIdentity = buildWasmWasiRequestSourceIdentityV117(source)
      const normalized = source.replace(/\r\n?/gu, "\n")

      expect(requestIdentity).toEqual({
        originalSourceSha256: `sha256:${createHash("sha256")
          .update(source, "utf8")
          .digest("hex")}`,
        normalizedSourceSha256: `sha256:${createHash("sha256")
          .update(normalized, "utf8")
          .digest("hex")}`,
      })
      expect(revision).not.toHaveProperty("requestSourceIdentity")
      expect(revision).not.toHaveProperty("sourceIdentity")
      expect(artifact.sourceIdentity.originalSourceSha256).not.toBe(
        requestIdentity.originalSourceSha256,
      )
      expect(artifact.sourceIdentity.normalizedSourceSha256).not.toBe(
        requestIdentity.normalizedSourceSha256,
      )
      expect(revision.runtime).toMatchObject({
        abiVersion: "strategy-runtime-abi-v1.17",
        language: { id: language },
        adapter: {
          id: "runtime-wasm-wasi-wasmtime-preview1",
          version: "v1.17-candidate",
        },
        package: { mode: "none", entrypoint: "_start" },
      })
      expect(artifact).toMatchObject({
        abiEnvelope: "stdin-canonical-request-stdout-raw-canonical-payload",
        abiVersion: "strategy-runtime-abi-v1.17",
        sourceHash: artifact.sourceIdentity.normalizedSourceSha256,
        targetTriple: language === "rust" ? "wasm32-wasip1" : "wasm32-wasi",
        toolchain: { language },
      })
      expect(revision.metadata.providerValidation).toMatchObject({
        providerId: `strategy-language-provider-${language}-wasi`,
        contractVersion: "runtime-provider-validation-v1.17",
        sourceHash: revision.sourceHash,
        sourceBytes: revision.sourceBytes,
        artifactHash: artifact.hash,
        artifactBytes: artifact.bytes,
        proof: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      })
      expect(
        readWasmWasiSourceIdentityAttestationV117(
          Buffer.from(artifact.bytesBase64!, "base64"),
        ),
      ).toEqual(artifact.sourceIdentity)
      expect(StrategyRevisionV117Schema.safeParse(revision).success).toBe(true)
      expect(StrategyRevisionSchema.safeParse(revision).success).toBe(false)
      const persistedShape = clone({
        id: revision.id,
        ...(revision.strategyId === undefined
          ? {}
          : { strategyId: revision.strategyId }),
        source: revision.source,
        sourceHash: revision.sourceHash,
        sourceBytes: revision.sourceBytes,
        runtime: revision.runtime,
        engineCompatibility: revision.engineCompatibility,
        validation: revision.validation,
        metadata: revision.metadata,
      })
      expect(StrategyRevisionV117Schema.safeParse(persistedShape).success).toBe(
        true,
      )
    },
    15_000,
  )

  it("rejects missing or duplicated source-identity custom sections", () => {
    const revision = buildRustStrategyRevisionV117({ source: rustSourceLf })
    const bytes = Buffer.from(
      revision.metadata.compiledArtifact.bytesBase64!,
      "base64",
    )
    const nameOffset = bytes.indexOf("cowards.source-identity.v1.17", 0, "utf8")
    expect(nameOffset).toBeGreaterThan(0)
    const missing = Buffer.from(bytes)
    missing[nameOffset] = "C".charCodeAt(0)
    const lastSection = lastWasmSectionOffset(bytes)
    const duplicate = Buffer.concat([bytes, bytes.subarray(lastSection)])

    expect(() => readWasmWasiSourceIdentityAttestationV117(missing)).toThrow(
      /missing or duplicated/u,
    )
    expect(() => readWasmWasiSourceIdentityAttestationV117(duplicate)).toThrow(
      /missing or duplicated/u,
    )
  })

  it("rejects mixed provider, tuple, target, and identity authority", () => {
    const revision = buildRustStrategyRevisionV117({ source: rustSourceLf })
    const candidates = [
      (() => {
        const value = clone(revision)
        value.metadata.providerValidation.providerId =
          "strategy-language-provider-python"
        return value
      })(),
      (() => {
        const value = clone(revision)
        value.engineCompatibility.engine = "engine-v1.33"
        return value
      })(),
      (() => {
        const value = clone(revision)
        value.metadata.compiledArtifact.targetTriple = "wasm32-wasi"
        return value
      })(),
      (() => {
        const value = clone(revision)
        value.metadata.compiledArtifact.sourceHash = value.sourceHash as never
        return value
      })(),
      (() => {
        const value = clone(revision)
        value.metadata.compiledArtifact.sourceIdentity.originalSourceSha256 =
          buildWasmWasiRequestSourceIdentityV117(
            value.source,
          ).originalSourceSha256
        return value
      })(),
    ]

    for (const candidate of candidates) {
      expect(StrategyRevisionV117Schema.safeParse(candidate).success).toBe(
        false,
      )
    }
  })
})
