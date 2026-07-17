import { describe, expect, it } from "vitest"
import { Buffer } from "node:buffer"
import { createHash, createHmac } from "node:crypto"
import { readFileSync } from "node:fs"
import {
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE,
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
  defaultRuntimeMetadata,
  describeStrategyRuntimeProductSemantics,
  type RuntimeEntrantExecutionEvidence,
} from "@cowards/spec"
import {
  buildExhibitionDuplicateKey,
  createManualExhibitionMatchSet,
  evaluateRateLimit,
  generateCompetitionPairwiseMatrix,
  TYPESCRIPT_COMPETITION_PERSISTENCE_ROLE,
  runtimeAllowsCountedPlay,
  validateManualExhibitionRevisionIds,
} from "./competition.js"
import type { Pool } from "pg"
import {
  createFixtureMatchSetEvidenceResolver,
  createMatchSetService,
  resolveMatchSetExecutionEvidence,
  type IntegritySchedulingIdentity,
  type MatchSetExecutionEvidenceResolver,
} from "./matchset-service.js"

const TEST_PROVIDER_VALIDATION_SECRET =
  "cowards-provider-validation-test-secret-v1.33"

process.env.COWARDS_PROVIDER_VALIDATION_SECRET = TEST_PROVIDER_VALIDATION_SECRET

const pythonProviderProof = (
  sourceHash: string,
  sourceBytes: number,
  artifactHash: string,
  artifactBytes: number,
): string =>
  `hmac-sha256:${createHmac("sha256", TEST_PROVIDER_VALIDATION_SECRET)
    .update(
      [
        "strategy-language-provider-python",
        "strategy-language-provider-contract-v1.33",
        sourceHash,
        String(sourceBytes),
        artifactHash,
        String(artifactBytes),
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
        "strategy-language-provider-contract-v1.33",
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
    runtimeSemantics: describeStrategyRuntimeProductSemantics(
      defaultRuntimeMetadata(),
    ),
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
    runtimeSemantics: describeStrategyRuntimeProductSemantics(
      defaultRuntimeMetadata(),
    ),
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
    runtimeSemantics: describeStrategyRuntimeProductSemantics(
      defaultRuntimeMetadata(),
    ),
    engineCompatibility: { spec: "spec-v1", engine: "engine-v1" },
    lockedAt: "2026-05-19T00:00:00.000Z",
  },
]

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex")

const candidateIntegrityIdentity = (
  revisionIds: readonly string[],
): IntegritySchedulingIdentity => {
  const registryGeneration = "competition-candidate:generation:1"
  const executionEntrants = Object.fromEntries(
    revisionIds.map((strategyRevisionId, index) => {
      const evidence: RuntimeEntrantExecutionEvidence = {
        entrantKey: strategyRevisionId,
        strategyRevisionId,
        laneIdentity: {
          providerId: `competition-candidate:provider:${index}`,
          languageId: "typescript",
          runtimeId: `competition-candidate:runtime:${index}`,
          runtimeVersion: "1",
          toolchainId: `competition-candidate:toolchain:${index}`,
          toolchainVersion: "1",
          adapterId: `competition-candidate:adapter:${index}`,
          adapterVersion: "1",
          policyId: "competition-candidate:policy",
          policyVersion: "1",
          corpusId: "competition-candidate:corpus",
          corpusVersion: "1",
          artifactId: `competition-candidate:artifact:${index}`,
          artifactSha256: sha256(`candidate-artifact:${strategyRevisionId}`),
          implementationId: `competition-candidate:implementation:${index}`,
          buildId: `competition-candidate:build:${index}`,
          semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
          semanticTuple: { ...CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE },
        },
        containmentCertificateRef: {
          kind: "containment",
          certificateId: `competition-candidate:containment:${index}`,
          certificateVersion: "runtime-certificate-v1",
          certificateRecordHash: sha256(`containment:${strategyRevisionId}`),
          registryGeneration,
        },
        conformanceCertificateRef: {
          kind: "conformance",
          certificateId: `competition-candidate:reviewed:${index}`,
          certificateVersion: "runtime-conformance-certificate-v1.19",
          certificateRecordHash: sha256(`conformance:${strategyRevisionId}`),
          registryGeneration,
        },
        schedulingDecision: {
          status: "exhibition_only",
          reasonCode: "CONFORMANCE_MISSING",
          evaluatedAt: "2026-07-12T12:00:00.000Z",
          freshUntil: "2099-12-31T23:59:59.999Z",
          registryGeneration,
        },
      }
      return [strategyRevisionId, evidence]
    }),
  )
  return {
    compatibility: {
      tupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
      tuple: { ...CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE },
    },
    authorityBundleHash: sha256("competition-candidate:bundle"),
    registryGeneration,
    executionEntrants,
  }
}

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

  it("labels TypeScript competition MatchSet creation and public DTO reads as non-normal support", () => {
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

  it("classifies public result evidence without mutating MatchSet lifecycle", () => {
    const source = readFileSync(
      new URL("./competition.ts", import.meta.url),
      "utf8",
    )
    const publicRead = source.slice(
      source.indexOf("export const buildPublicMatchSetResultDto"),
    )
    expect(publicRead).toContain("classifyCompetitionCountedState")
    expect(publicRead).toContain("countedState")
    expect(publicRead).not.toContain("refreshMatchSetStatus")
    expect(publicRead).not.toContain("countedStatus: derivedCountedStatus")
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
        match.bottomEntrantKey,
        match.topEntrantKey,
      ]),
    ).toEqual([
      [
        "strategy-revision:a",
        "strategy-revision:b",
        "strategy-revision:a",
        "strategy-revision:b",
      ],
      [
        "strategy-revision:b",
        "strategy-revision:a",
        "strategy-revision:b",
        "strategy-revision:a",
      ],
      [
        "strategy-revision:a",
        "strategy-revision:c",
        "strategy-revision:a",
        "strategy-revision:c",
      ],
      [
        "strategy-revision:c",
        "strategy-revision:a",
        "strategy-revision:c",
        "strategy-revision:a",
      ],
      [
        "strategy-revision:b",
        "strategy-revision:c",
        "strategy-revision:b",
        "strategy-revision:c",
      ],
      [
        "strategy-revision:c",
        "strategy-revision:b",
        "strategy-revision:c",
        "strategy-revision:b",
      ],
    ])
  })

  it("generates the explicit runtime-v1.19 Cartesian candidate with stable canonical identities", () => {
    const candidate = generateCompetitionPairwiseMatrix({
      matchSetId: "match-set:exhibition:candidate",
      presetId: "smoke-exhibition-v1",
      entrants,
      semanticAuthorityKey: "runtime-v1.19",
    })

    expect(candidate).toHaveLength(12)
    const byScenario = Map.groupBy(candidate, (match) => {
      if (!("semanticAuthorityKey" in match)) {
        throw new Error("candidate row lost its explicit dispatch")
      }
      return match.scenarioId
    })
    expect(byScenario.size).toBe(3)
    for (const rows of byScenario.values()) {
      expect(rows).toHaveLength(4)
      expect(new Set(rows.map(({ seed }) => seed))).toEqual(
        new Set(["seed:smoke:001"]),
      )
      expect(
        rows.filter(
          (row) =>
            row.bottomEntrantKey === rows[0]!.bottomEntrantKey,
        ),
      ).toHaveLength(2)
      const candidateRows = rows.filter(
        (row) => "semanticAuthorityKey" in row,
      )
      expect(
        candidateRows.filter(
          (row) =>
            row.initialInitiativeEntrantKey ===
            candidateRows[0]!.bottomEntrantKey,
        ),
      ).toHaveLength(2)
      expect(candidateRows.map((row) => row.conditionOrdinal)).toEqual([
        0, 1, 2, 3,
      ])
    }

    const reordered = generateCompetitionPairwiseMatrix({
      matchSetId: "match-set:exhibition:candidate",
      presetId: "smoke-exhibition-v1",
      entrants: [entrants[2]!, entrants[0]!, entrants[1]!],
      semanticAuthorityKey: "runtime-v1.19",
    })
    expect(reordered).toEqual(candidate)

    const pairOnly = generateCompetitionPairwiseMatrix({
      matchSetId: "match-set:exhibition:candidate",
      presetId: "smoke-exhibition-v1",
      entrants: [entrants[0]!, entrants[1]!],
      semanticAuthorityKey: "runtime-v1.19",
    })
    expect(
      candidate.filter((row) => {
        const keys = new Set([
          row.bottomEntrantKey,
          row.topEntrantKey,
        ])
        return (
          keys.has("strategy-revision:a") &&
          keys.has("strategy-revision:b")
        )
      }),
    ).toEqual(pairOnly)
  })

  it("rejects two-row and seed-suffix fairness only on the explicit candidate branch", async () => {
    const matchSetId = "match-set:competition:fairness-boundary"
    const candidate = generateCompetitionPairwiseMatrix({
      matchSetId,
      presetId: "smoke-exhibition-v1",
      entrants: entrants.slice(0, 2),
      semanticAuthorityKey: "runtime-v1.19",
    })
    const pool = {
      async connect() {
        throw new Error("accepted matrix reached database boundary")
      },
    } as unknown as Pool
    const service = createMatchSetService(pool)
    const integrityIdentity = candidateIntegrityIdentity([
      "strategy-revision:a",
      "strategy-revision:b",
    ])

    await expect(
      service.createFromMatrix({
        id: matchSetId,
        semanticAuthorityKey: "runtime-v1.19",
        matches: candidate.slice(0, 2),
        integrityIdentity,
      }),
    ).rejects.toThrow(/exactly four conditions/iu)

    await expect(
      service.createFromMatrix({
        id: matchSetId,
        semanticAuthorityKey: "runtime-v1.19",
        matches: candidate.map((row, index) =>
          index === 0 ? { ...row, seed: `${row.seed}:mirror` } : row,
        ),
        integrityIdentity,
      }),
    ).rejects.toThrow(/identity|membership|mismatch/iu)

    const legacy = generateCompetitionPairwiseMatrix({
      matchSetId,
      presetId: "standard-exhibition-v1",
      entrants: entrants.slice(0, 2),
    })
    expect(legacy.some(({ seed }) => seed.endsWith(":mirror"))).toBe(true)
    const legacyIdentity = await resolveMatchSetExecutionEvidence({
      resolver: createFixtureMatchSetEvidenceResolver(),
      purpose: "exhibition",
      evaluationInstant: "2026-07-12T12:00:00.000Z",
      entrants: [
        {
          entrantKey: "strategy-revision:a",
          strategyRevisionId: "strategy-revision:a",
        },
        {
          entrantKey: "strategy-revision:b",
          strategyRevisionId: "strategy-revision:b",
        },
      ],
    })
    await expect(
      service.createFromMatrix({
        id: matchSetId,
        matches: legacy,
        integrityIdentity: legacyIdentity,
      }),
    ).rejects.toThrow("accepted matrix reached database boundary")
  })

  it("fails closed on empty production authority before any exhibition database access", async () => {
    let calls = 0
    const pool = {
      async query() {
        calls += 1
        throw new Error("database must not be reached")
      },
    } as unknown as Pool

    await expect(
      createManualExhibitionMatchSet(pool, {
        creatorUserId: "user:alpha",
        presetId: "smoke-exhibition-v1",
        revisionIds: ["strategy-revision:a", "strategy-revision:b"],
        now: new Date("2026-07-12T12:00:00.000Z"),
      }),
    ).rejects.toThrow(/containment.*unavailable|production.*empty/iu)
    expect(calls).toBe(0)
  })

  it("resolves every distinct exhibition entrant by stable revision key before database access", async () => {
    let captured: readonly {
      entrantKey: string
      strategyRevisionId: string
    }[] = []
    const resolver: MatchSetExecutionEvidenceResolver = {
      trustDomain: "fixture",
      async resolve(input) {
        captured = input.entrants
        throw new Error("captured fixture resolution")
      },
    }
    const pool = {
      async query() {
        throw new Error("unreachable")
      },
    } as unknown as Pool
    await expect(
      createManualExhibitionMatchSet(pool, {
        creatorUserId: "user:alpha",
        presetId: "smoke-exhibition-v1",
        revisionIds: [
          "strategy-revision:typescript",
          "strategy-revision:python",
          "strategy-revision:rust",
        ],
        now: new Date("2026-07-12T12:00:00.000Z"),
        evidenceResolver: resolver,
      }),
    ).rejects.toThrow("captured fixture resolution")
    expect(captured).toEqual([
      {
        entrantKey: "strategy-revision:typescript",
        strategyRevisionId: "strategy-revision:typescript",
      },
      {
        entrantKey: "strategy-revision:python",
        strategyRevisionId: "strategy-revision:python",
      },
      {
        entrantKey: "strategy-revision:rust",
        strategyRevisionId: "strategy-revision:rust",
      },
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

  it("keeps Zig exhibition entry quarantined even with legacy artifact provenance", () => {
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
    ).toThrow("not counted-play eligible")

    const artifactPayload = Buffer.from("zig-artifact")
    const artifactHash = createHash("sha256")
      .update(artifactPayload)
      .digest("hex")
    const artifactBytes = artifactPayload.byteLength
    expect(() =>
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
              contractVersion: "strategy-language-provider-contract-v1.33",
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
      ),
    ).toThrow("not counted-play eligible")
  })

  it("keeps Python exhibition entry quarantined even with legacy provider provenance", () => {
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
    const artifactPayload = Buffer.from("python-artifact")
    const artifactHash = createHash("sha256")
      .update(artifactPayload)
      .digest("hex")
    const artifactBytes = artifactPayload.byteLength

    expect(() => runtimeAllowsCountedPlay(runtime)).toThrow(
      "not counted-play eligible",
    )
    expect(() =>
      runtimeAllowsCountedPlay(runtime, {
        sourceHash,
        sourceBytes,
        metadata: {
          sourceArtifact: {
            format: "python-source-bundle",
            hash: artifactHash,
            bytes: artifactBytes,
            bytesBase64: artifactPayload.toString("base64"),
            sourceHash,
            sourceBytes,
            abiVersion: "strategy-runtime-abi-v1.14",
            validationStatus: "valid",
            createdAt: "test",
            toolchain: {
              language: "python",
              runtime: "python",
              runtimeVersion: "3.9",
              commandSummary: "test",
              validationPolicy: "test",
            },
            publicEvidence: {
              label: "Python source bundle provenance",
              nonCounted: false,
              sandboxClaim: "provenance-only",
            },
          },
          providerValidation: {
            providerId: "strategy-language-provider-python",
            contractVersion: "strategy-language-provider-contract-v1.33",
            sourceHash,
            sourceBytes,
            artifactHash,
            artifactBytes,
            proof: pythonProviderProof(
              sourceHash,
              sourceBytes,
              artifactHash,
              artifactBytes,
            ),
          },
        },
      }),
    ).toThrow("not counted-play eligible")
  })

  it("keeps TypeScript exhibition entry quarantined regardless of legacy artifact bytes", () => {
    const runtime = {
      ...defaultRuntimeMetadata(),
      language: { id: "typescript", version: "0.1.0" },
      adapter: {
        id: "runtime-js-worker-thread",
        version: "0.1.0",
      },
    }
    const sourceHash = "typescript-source-hash"
    const sourceBytes = 128
    const artifactPayload = Buffer.from("typescript-artifact")
    const artifactHash = createHash("sha256")
      .update(artifactPayload)
      .digest("hex")
    const artifactBytes = artifactPayload.byteLength
    const sourceArtifact = {
      format: "transpiled-javascript",
      hash: artifactHash,
      bytes: artifactBytes,
      bytesBase64: artifactPayload.toString("base64"),
      sourceHash,
      sourceBytes,
      abiVersion: "strategy-runtime-abi-v1.14",
      validationStatus: "valid",
      createdAt: "test",
      toolchain: {
        language: "typescript",
        runtime: "node",
        runtimeVersion: "20",
        commandSummary: "test",
        validationPolicy: "test",
      },
      publicEvidence: {
        label: "TypeScript transpiled artifact provenance",
        nonCounted: false,
        sandboxClaim: "provenance-only",
      },
    }
    const { bytesBase64: _redactedBytesBase64, ...publicSourceArtifact } =
      sourceArtifact
    const providerValidation = {
      providerId: "strategy-language-provider-js-ts",
      contractVersion: "strategy-language-provider-contract-v1.33",
      sourceHash,
      sourceBytes,
      artifactHash,
      artifactBytes,
      proof: rustProviderProof(
        sourceHash,
        sourceBytes,
        artifactHash,
        artifactBytes,
        "strategy-language-provider-js-ts",
      ),
    }

    expect(() =>
      runtimeAllowsCountedPlay(runtime, {
        sourceHash,
        sourceBytes,
        metadata: {
          sourceArtifact,
          providerValidation,
        },
      }),
    ).toThrow("not counted-play eligible")
    expect(() =>
      runtimeAllowsCountedPlay(runtime, {
        sourceHash,
        sourceBytes,
        metadata: {
          sourceArtifact: publicSourceArtifact,
          providerValidation,
        },
      }),
    ).toThrow("not counted-play eligible")
  })

  it("keeps Rust exhibition entry quarantined even with legacy artifact provenance", () => {
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
      "not counted-play eligible",
    )
    expect(() =>
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
            contractVersion: "strategy-language-provider-contract-v1.33",
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
      }),
    ).toThrow("not counted-play eligible")
  })
})
