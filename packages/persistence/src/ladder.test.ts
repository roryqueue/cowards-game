import { describe, expect, it } from "vitest"
import { createHash, createHmac } from "node:crypto"
import { defaultRuntimeMetadata } from "@cowards/spec"
import {
  assertLadderEligibleRuntime,
  DEFAULT_LADDER_MINIMUM_ENTRIES,
  DEFAULT_LADDER_TARGET_POD_SIZE,
  trialLadderStatusLabel,
} from "./ladder.js"

const TEST_PROVIDER_VALIDATION_SECRET =
  "cowards-provider-validation-test-secret-v1.32"

process.env.COWARDS_PROVIDER_VALIDATION_SECRET = TEST_PROVIDER_VALIDATION_SECRET

const pythonProviderProof = (sourceHash: string, sourceBytes: number): string =>
  `hmac-sha256:${createHmac("sha256", TEST_PROVIDER_VALIDATION_SECRET)
    .update(
      [
        "strategy-language-provider-python",
        "strategy-language-provider-contract-v1.32",
        sourceHash,
        String(sourceBytes),
        "",
        "",
      ].join("\n"),
    )
    .digest("hex")}`

const rustProviderProof = (
  sourceHash: string,
  sourceBytes: number,
  artifactHash: string,
  artifactBytes: number,
  providerId = "strategy-language-provider-rust-wasi",
): string =>
  `hmac-sha256:${createHmac("sha256", TEST_PROVIDER_VALIDATION_SECRET)
    .update(
      [
        providerId,
        "strategy-language-provider-contract-v1.32",
        sourceHash,
        String(sourceBytes),
        artifactHash,
        String(artifactBytes),
      ].join("\n"),
    )
    .digest("hex")}`

describe("trial ladder contracts", () => {
  it("uses resettable beta lifecycle labels without permanent rating language", () => {
    expect(trialLadderStatusLabel("draft")).toBe("Preparing")
    expect(trialLadderStatusLabel("open")).toBe("Open for entries")
    expect(trialLadderStatusLabel("scheduling")).toBe("Scheduling matches")
    expect(trialLadderStatusLabel("active")).toBe("Matches running")
    expect(trialLadderStatusLabel("completed")).toBe("Complete")
    expect(trialLadderStatusLabel("archived")).toBe("Archived")
  })

  it("defaults to four-entry deterministic pods", () => {
    expect(DEFAULT_LADDER_MINIMUM_ENTRIES).toBe(4)
    expect(DEFAULT_LADDER_TARGET_POD_SIZE).toBe(4)
  })

  it("requires artifact provenance before counted Zig trial ladder entry", () => {
    const sourceHash = "zig-source-hash"
    const sourceBytes = 192

    expect(() =>
      assertLadderEligibleRuntime({
        ...defaultRuntimeMetadata(),
        language: { id: "zig", version: "0.16.0-wasm32-wasi" },
        adapter: {
          id: "runtime-wasm-wasi-wasmtime-preview1",
          version: "0.1.0-alpha",
        },
      }),
    ).toThrow("provider-validated artifact provenance")

    const artifactPayload = Buffer.from("zig-artifact")
    const artifactHash = createHash("sha256")
      .update(artifactPayload)
      .digest("hex")
    const artifactBytes = artifactPayload.byteLength
    expect(
      assertLadderEligibleRuntime(
        {
          ...defaultRuntimeMetadata(),
          language: { id: "zig", version: "0.16.0-wasm32-wasi" },
          adapter: {
            id: "runtime-wasm-wasi-wasmtime-preview1",
            version: "0.1.0-alpha",
          },
        },
        {
          sourceHash,
          sourceBytes,
          metadata: {
            compiledArtifact: {
              hash: artifactHash,
              bytes: artifactBytes,
              bytesBase64: artifactPayload.toString("base64"),
              sourceHash,
              targetTriple: "wasm32-wasi",
              wasiProfile: "preview1",
              abiEnvelope: "stdin-stdout-json",
              abiVersion: "strategy-runtime-abi-v1.14",
              validationStatus: "valid",
            },
            providerValidation: {
              providerId: "strategy-language-provider-zig-wasi",
              contractVersion: "strategy-language-provider-contract-v1.32",
              sourceHash,
              sourceBytes,
              artifactHash,
              artifactBytes,
              proof: rustProviderProof(
                sourceHash,
                sourceBytes,
                artifactHash,
                artifactBytes,
                "strategy-language-provider-zig-wasi",
              ),
            },
          },
        },
      ).language.id,
    ).toBe("zig")
  })

  it("requires provider provenance before counted Python trial ladder entry", () => {
    const runtime = {
      ...defaultRuntimeMetadata(),
      language: { id: "python", version: "3.9" },
      adapter: {
        id: "runtime-python-subprocess-experimental",
        version: "0.1.0-experimental",
      },
    }
    const sourceHash = "python-source-hash"
    const sourceBytes = 128

    expect(() => assertLadderEligibleRuntime(runtime)).toThrow(
      "provider-validated revision provenance",
    )
    expect(
      assertLadderEligibleRuntime(runtime, {
        sourceHash,
        sourceBytes,
        metadata: {
          providerValidation: {
            providerId: "strategy-language-provider-python",
            contractVersion: "strategy-language-provider-contract-v1.32",
            sourceHash,
            sourceBytes,
            proof: pythonProviderProof(sourceHash, sourceBytes),
          },
        },
      }).language.id,
    ).toBe("python")
  })

  it("requires artifact provenance before counted Rust trial ladder entry", () => {
    const runtime = {
      ...defaultRuntimeMetadata(),
      language: { id: "rust", version: "1.95.0-wasm32-wasip1" },
      adapter: {
        id: "runtime-wasm-wasi-wasmtime-preview1",
        version: "0.1.0-alpha",
      },
    }
    const sourceHash = "rust-source-hash"
    const sourceBytes = 256
    const artifactPayload = Buffer.from("rust-artifact")
    const artifactHash = createHash("sha256")
      .update(artifactPayload)
      .digest("hex")
    const artifactBytes = artifactPayload.byteLength

    expect(() => assertLadderEligibleRuntime(runtime)).toThrow(
      "provider-validated artifact provenance",
    )
    expect(
      assertLadderEligibleRuntime(runtime, {
        sourceHash,
        sourceBytes,
        metadata: {
          compiledArtifact: {
            hash: artifactHash,
            bytes: artifactBytes,
            bytesBase64: artifactPayload.toString("base64"),
            sourceHash,
            targetTriple: "wasm32-wasip1",
            wasiProfile: "preview1",
            abiEnvelope: "stdin-stdout-json",
            abiVersion: "strategy-runtime-abi-v1.14",
            validationStatus: "valid",
          },
          providerValidation: {
            providerId: "strategy-language-provider-rust-wasi",
            contractVersion: "strategy-language-provider-contract-v1.32",
            sourceHash,
            sourceBytes,
            artifactHash,
            artifactBytes,
            proof: rustProviderProof(
              sourceHash,
              sourceBytes,
              artifactHash,
              artifactBytes,
            ),
          },
        },
      }).language.id,
    ).toBe("rust")
  })
})
