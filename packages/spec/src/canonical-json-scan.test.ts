import { Buffer } from "node:buffer"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  scanCanonicalJson,
  type CanonicalJsonLimits,
  type CanonicalJsonScanOptions,
} from "./canonical-json-scan.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const corpus = JSON.parse(
  readFileSync(
    path.join(repoRoot, "packages/spec/src/fixtures/canonical-json-v1-1-vectors.json"),
    "utf8",
  ),
) as {
  vectors: readonly {
    id: string
    operation: CanonicalJsonScanOptions["operation"] | "host-encode"
    context: CanonicalJsonScanOptions["context"]
    rawPath: string
    rawSha256: string
    limits: CanonicalJsonLimits
    expectation:
      | { kind: "success" }
      | {
          kind: "error"
          code: string
          path: readonly (string | number)[]
          byteOffset: number
          owner: "player_violation" | "system_failure"
        }
  }[]
}

const scannerVectors = corpus.vectors.filter(
  (
    vector,
  ): vector is typeof vector & {
    operation: CanonicalJsonScanOptions["operation"]
  } => vector.operation !== "host-encode",
)

describe("canonical JSON v1.1 iterative raw-byte scanner", () => {
  it("matches every scanner-owned raw corpus classification exactly", () => {
    expect(scannerVectors).toHaveLength(67)
    expect(scannerVectors.filter((vector) => vector.expectation.kind === "success")).toHaveLength(40)
    expect(scannerVectors.filter((vector) => vector.expectation.kind === "error")).toHaveLength(27)

    for (const vector of scannerVectors) {
      const raw = readFileSync(path.join(repoRoot, vector.rawPath))
      const result = scanCanonicalJson(raw, {
        context: vector.context,
        operation: vector.operation,
        limits: vector.limits,
      })
      if (vector.expectation.kind === "error") {
        const { kind: _kind, ...expectedError } = vector.expectation
        expect(result, vector.id).toEqual({ ok: false, error: expectedError })
      } else {
        expect(result.ok, vector.id).toBe(true)
        if (result.ok) {
          expect(result.receipt.inputSha256, vector.id).toBe(vector.rawSha256)
          expect(result.receipt.rawByteLength, vector.id).toBe(raw.byteLength)
          expect(result.receipt.tokens.length, vector.id).toBeGreaterThan(0)
        }
      }
    }
  })

  it("compares decoded object keys by unsigned UTF-8 bytes when canonical input is required", () => {
    const result = scanCanonicalJson(Buffer.from('{"z":1,"a":2}'), {
      context: "canonical-manifest",
      operation: "require-canonical",
    })
    expect(result).toEqual({
      ok: false,
      error: {
        code: "NON_CANONICAL_KEY_ORDER",
        path: ["a"],
        byteOffset: 7,
        owner: "system_failure",
      },
    })
  })

  it("applies deterministic pre-allocation precedence", () => {
    const limits: CanonicalJsonLimits = {
      rawUtf8Bytes: 3,
      depth: 1,
      nodes: 1,
      decodedStringUtf8Bytes: 1,
      arrayEntries: 1,
      objectEntries: 1,
    }
    const result = scanCanonicalJson(Uint8Array.from([0x22, 0xc0, 0xaf, 0x22]), {
      context: "decoded-strategy-payload",
      operation: "parse-and-canonicalize",
      limits,
    })
    expect(result).toEqual({
      ok: false,
      error: {
        code: "MAX_RAW_UTF8_BYTES_EXCEEDED",
        path: [],
        byteOffset: 3,
        owner: "player_violation",
      },
    })
  })

  it("classifies malformed UTF-8 before grammar even outside a string", () => {
    expect(
      scanCanonicalJson(Uint8Array.from([0xff]), {
        context: "decoded-strategy-payload",
        operation: "parse-and-canonicalize",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_UTF8",
        path: [],
        byteOffset: 0,
        owner: "player_violation",
      },
    })
  })

  it("returns one typed depth error for depth 3,000 without throwing", () => {
    const raw = readFileSync(
      path.join(
        repoRoot,
        "packages/spec/src/fixtures/canonical-json-v1-1-raw/hostile-depth-3000.raw",
      ),
    )
    expect(() =>
      scanCanonicalJson(raw, {
        context: "canonical-manifest",
        operation: "parse-and-canonicalize",
      }),
    ).not.toThrow()
    expect(
      scanCanonicalJson(raw, {
        context: "canonical-manifest",
        operation: "parse-and-canonicalize",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "MAX_DEPTH_EXCEEDED",
        path: [],
        byteOffset: 64,
        owner: "system_failure",
      },
    })
  })

  it("does not delegate first admission to a host JSON parser", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./canonical-json-scan.ts", import.meta.url)),
      "utf8",
    )
    expect(source).not.toContain("JSON.parse")
    expect(source).not.toContain("JsonValueSchema")
  })
})
