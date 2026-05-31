import { describe, expect, it } from "vitest"
import { createHash, createHmac } from "node:crypto"
import { defaultRuntimeMetadata } from "@cowards/spec"
import {
  buildExhibitionDuplicateKey,
  evaluateRateLimit,
  generateCompetitionPairwiseMatrix,
  TYPESCRIPT_COMPETITION_PERSISTENCE_ROLE,
  runtimeAllowsCountedPlay,
  validateManualExhibitionRevisionIds,
} from "./competition.js"

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

const entrants = [
  {
    entrantId: "entrant:0",
    entrantIndex: 0,
    strategyRevisionId: "strategy-revision:a",
    ownerUserId: "user:alpha",
    ownerHandle: "alpha",
    displayLabel: "@alpha / A / hash-a",
    sourceHash: "hash-a",
    sourceBytes: 120,
    runtime: defaultRuntimeMetadata(),
    engineCompatibility: { spec: "spec-v1", engine: "engine-v1" },
    lockedAt: "2026-05-19T00:00:00.000Z",
  },
  {
    entrantId: "entrant:1",
    entrantIndex: 1,
    strategyRevisionId: "strategy-revision:b",
    ownerUserId: "user:alpha",
    ownerHandle: "alpha",
    displayLabel: "@alpha / B / hash-b",
    sourceHash: "hash-b",
    sourceBytes: 128,
    runtime: defaultRuntimeMetadata(),
    engineCompatibility: { spec: "spec-v1", engine: "engine-v1" },
    lockedAt: "2026-05-19T00:00:00.000Z",
  },
  {
    entrantId: "entrant:2",
    entrantIndex: 2,
    strategyRevisionId: "strategy-revision:c",
    ownerUserId: "user:alpha",
    ownerHandle: "alpha",
    displayLabel: "@alpha / C / hash-c",
    sourceHash: "hash-c",
    sourceBytes: 136,
    runtime: defaultRuntimeMetadata(),
    engineCompatibility: { spec: "spec-v1", engine: "engine-v1" },
    lockedAt: "2026-05-19T00:00:00.000Z",
  },
]

describe("competition helpers", () => {
  it("keeps lifecycle and selected-normal creation helpers out of the normal persistence root export", async () => {
    const root = await import("@cowards/persistence")
    for (const symbol of [
      "claimNextMatchJob",
      "completeMatch",
      "recordAttemptFailure",
      "refreshMatchSetStatus",
      "createMatchSetService",
      "createManualExhibitionMatchSet",
    ]) {
      expect(root).not.toHaveProperty(symbol)
    }
  })

  it("exposes TypeScript lifecycle helpers only through an explicit quarantine subpath", async () => {
    const quarantine = await import("@cowards/persistence/quarantine-lifecycle")

    expect(quarantine.TYPE_SCRIPT_LIFECYCLE_QUARANTINE.allowedPurposes).toEqual(
      ["rollback", "test", "parity"],
    )
    expect(quarantine.TYPE_SCRIPT_LIFECYCLE_QUARANTINE.normalBackend).toBe(
      false,
    )
    expect(quarantine).toHaveProperty("claimNextMatchJob")
    expect(quarantine).toHaveProperty("completeMatch")
    expect(quarantine).toHaveProperty("refreshMatchSetStatus")
    expect(quarantine).toHaveProperty("createManualExhibitionMatchSet")
  })

  it("labels TypeScript competition MatchSet creation and public DTO refresh as non-normal support", () => {
    expect(TYPESCRIPT_COMPETITION_PERSISTENCE_ROLE.normalBackend).toBe(false)
    expect(TYPESCRIPT_COMPETITION_PERSISTENCE_ROLE.selectedNormalBackend).toBe(
      false,
    )
    expect(TYPESCRIPT_COMPETITION_PERSISTENCE_ROLE.allowedRoles).toEqual([
      "rollback",
      "test",
      "parity",
      "fixture",
      "deferred",
    ])
    expect(
      TYPESCRIPT_COMPETITION_PERSISTENCE_ROLE.quarantinedFunctions,
    ).toEqual(
      expect.arrayContaining([
        "createManualExhibitionMatchSet",
        "buildPublicMatchSetResultDto",
      ]),
    )
  })

  it("allows 2-8 distinct owned revisions for manual exhibitions", () => {
    expect(() =>
      validateManualExhibitionRevisionIds([
        "strategy-revision:a",
        "strategy-revision:b",
      ]),
    ).not.toThrow()
    expect(() =>
      validateManualExhibitionRevisionIds(["strategy-revision:a"]),
    ).toThrow(/2-8/)
    expect(() =>
      validateManualExhibitionRevisionIds([
        "strategy-revision:a",
        "strategy-revision:a",
      ]),
    ).toThrow(/distinct/)
  })

  it("builds duplicate keys independent of selected revision order", () => {
    expect(
      buildExhibitionDuplicateKey({
        creatorUserId: "user:alpha",
        presetId: "smoke-exhibition-v1",
        revisionIds: ["strategy-revision:b", "strategy-revision:a"],
      }),
    ).toBe(
      buildExhibitionDuplicateKey({
        creatorUserId: "user:alpha",
        presetId: "smoke-exhibition-v1",
        revisionIds: ["strategy-revision:a", "strategy-revision:b"],
      }),
    )
  })

  it("generates mirrored pairwise Match matrices without collapsing same-user entrants", () => {
    const matches = generateCompetitionPairwiseMatrix({
      matchSetId: "match-set:exhibition:test",
      presetId: "smoke-exhibition-v1",
      entrants,
    })

    expect(matches).toHaveLength(6)
    expect(
      matches.map((match) => [
        match.bottomStrategyRevisionId,
        match.topStrategyRevisionId,
      ]),
    ).toEqual([
      ["strategy-revision:a", "strategy-revision:b"],
      ["strategy-revision:b", "strategy-revision:a"],
      ["strategy-revision:a", "strategy-revision:c"],
      ["strategy-revision:c", "strategy-revision:a"],
      ["strategy-revision:b", "strategy-revision:c"],
      ["strategy-revision:c", "strategy-revision:b"],
    ])
  })

  it("returns retry-after information once exhibition create limits are exceeded", () => {
    const now = new Date("2026-05-19T00:10:00.000Z")
    expect(
      evaluateRateLimit({
        count: 4,
        now,
        policy: { limit: 5, windowSeconds: 600 },
      }),
    ).toEqual({ allowed: true })
    expect(
      evaluateRateLimit({
        count: 5,
        oldestEventAt: new Date("2026-05-19T00:05:00.000Z"),
        now,
        policy: { limit: 5, windowSeconds: 600 },
      }),
    ).toEqual({ allowed: false, retryAfterSeconds: 300 })
  })

  it("requires artifact provenance before counted Zig exhibition entry", () => {
    const sourceHash = "zig-source-hash"
    const sourceBytes = 192

    expect(() =>
      runtimeAllowsCountedPlay({
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
      runtimeAllowsCountedPlay(
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

  it("requires provider provenance before counted Python exhibition entry", () => {
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

    expect(() => runtimeAllowsCountedPlay(runtime)).toThrow(
      "provider-validated revision provenance",
    )
    expect(
      runtimeAllowsCountedPlay(runtime, {
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

  it("requires artifact provenance before counted Rust exhibition entry", () => {
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

    expect(() => runtimeAllowsCountedPlay(runtime)).toThrow(
      "provider-validated artifact provenance",
    )
    expect(
      runtimeAllowsCountedPlay(runtime, {
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
