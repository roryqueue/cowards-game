import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  COMPATIBILITY_VERSIONS,
  type Chronicle,
  type ExecutableLaneIdentity,
  type RuntimeEntrantExecutionEvidence,
} from "@cowards/spec"
import {
  ChronicleValidationSystemFailure,
  createChronicleMetadata,
  createMemoryChronicleStoreForTests,
  createPostgresChronicleStore,
} from "./chronicle-store.js"
import {
  createMatchExecutionEvidencePair,
  createMatchSetIntegrityIdentity,
} from "./integrity-evidence.js"

const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex")

const lane = (side: "bottom" | "top"): ExecutableLaneIdentity => ({
  providerId: `fixture:provider:${side}`,
  languageId: side === "bottom" ? "typescript" : "python",
  runtimeId: `fixture:runtime:${side}`,
  runtimeVersion: "1",
  toolchainId: `fixture:toolchain:${side}`,
  toolchainVersion: "1",
  adapterId: `fixture:adapter:${side}`,
  adapterVersion: "1",
  policyId: "fixture:policy",
  policyVersion: "1",
  corpusId: "fixture:corpus",
  corpusVersion: "1",
  artifactId: `fixture:artifact:${side}`,
  artifactSha256: sha256(`artifact:${side}`),
  implementationId: `fixture:implementation:${side}`,
  buildId: `fixture:build:${side}`,
  semanticTupleId: tuple.tupleId,
  semanticTuple: { ...tuple.tuple },
})

const entrant = (side: "bottom" | "top"): RuntimeEntrantExecutionEvidence => ({
  entrantKey: `entrant:${side}`,
  strategyRevisionId: `strategy-revision:${side}`,
  laneIdentity: lane(side),
  containmentCertificateRef: {
    kind: "containment",
    certificateId: `certificate:containment:${side}`,
    certificateVersion: "runtime-certificate-v1",
    certificateRecordHash: sha256(`containment:${side}`),
    registryGeneration: "fixture:generation:1",
  },
  conformanceCertificateRef: {
    kind: "conformance",
    certificateId: `certificate:conformance:${side}`,
    certificateVersion: "runtime-certificate-v1",
    certificateRecordHash: sha256(`conformance:${side}`),
    registryGeneration: "fixture:generation:1",
  },
  schedulingDecision: {
    status: "counted",
    reasonCode: "EVIDENCE_CURRENT",
    evaluatedAt: "2026-07-12T12:00:00.000Z",
    freshUntil: "2099-08-12T12:00:00.000Z",
    registryGeneration: "fixture:generation:1",
  },
})

const currentIntegrityIdentity = () => {
  const entrants = [entrant("bottom"), entrant("top")]
  const identity = createMatchSetIntegrityIdentity({
    compatibility: {
      tupleId: tuple.tupleId,
      tuple: { ...tuple.tuple },
    },
    authorityBundleHash: sha256("fixture:bundle"),
    registryGeneration: "fixture:generation:1",
    expectedEntrants: entrants.map((entry) => ({
      entrantKey: entry.entrantKey,
      strategyRevisionId: entry.strategyRevisionId,
    })),
    entrants,
  })
  return {
    matchSetId: "match-set:chronicle:integrity",
    identity,
    evidencePair: createMatchExecutionEvidencePair(identity, {
      bottomEntrantKey: "entrant:bottom",
      topEntrantKey: "entrant:top",
      bottomStrategyRevisionId: "strategy-revision:bottom",
      topStrategyRevisionId: "strategy-revision:top",
    }),
  }
}

const board = {
  bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
  soldiers: [],
  terrainStones: [],
}

const validChronicle = (): Chronicle => ({
  schemaVersion: "chronicle-v1.4",
  reproducibility: {
    matchId: "match:chronicle:001",
    seed: "seed:chronicle:001",
    arenaVariantId: "arena:smoke:v1",
    arenaVariantVersion: "arena-v1",
    strategyRevisionIds: ["strategy-revision:bottom", "strategy-revision:top"],
    versions: COMPATIBILITY_VERSIONS,
  },
  events: [
    {
      type: "MATCH_STARTED",
      sequence: 0,
      context: {},
      privacy: "public",
      payload: { matchId: "match:chronicle:001", seed: "seed:chronicle:001" },
    },
    {
      type: "ROUND_STARTED",
      sequence: 1,
      context: { roundNumber: 1 },
      privacy: "public",
      payload: { roundNumber: 1 },
    },
    {
      type: "STRATEGY_EVALUATED",
      sequence: 2,
      context: { roundNumber: 1, actingPlayerId: "player:bottom" },
      privacy: "private",
      privateRef: "private:event:2",
      payload: { playerId: "player:bottom" },
    },
    {
      type: "STRATEGY_EVALUATED",
      sequence: 3,
      context: { roundNumber: 1, actingPlayerId: "player:top" },
      privacy: "private",
      privateRef: "private:event:3",
      payload: { playerId: "player:top" },
    },
    {
      type: "ACTIVATION_STARTED",
      sequence: 4,
      context: {
        roundNumber: 1,
        activationId: "1:1:0",
        activationIndex: 0,
        actingPlayerId: "player:bottom",
        soldierId: "soldier:1",
      },
      privacy: "public",
      payload: { soldierId: "soldier:1" },
    },
    {
      type: "AWARENESS_GRID_OBSERVED",
      sequence: 5,
      context: {
        roundNumber: 1,
        activationId: "1:1:0",
        activationIndex: 0,
        actingPlayerId: "player:bottom",
        soldierId: "soldier:1",
        cycleIndex: 0,
      },
      privacy: "owner",
      payload: { soldierId: "soldier:1", cycleIndex: 0 },
    },
    {
      type: "ACTION_EMITTED",
      sequence: 6,
      context: {
        roundNumber: 1,
        activationId: "1:1:0",
        activationIndex: 0,
        actingPlayerId: "player:bottom",
        soldierId: "soldier:1",
        cycleIndex: 0,
      },
      privacy: "public",
      payload: {
        soldierId: "soldier:1",
        action: { type: "TURN_TO_STONE" },
      },
    },
    {
      type: "MATCH_ENDED",
      sequence: 7,
      context: {},
      privacy: "public",
      payload: { type: "DRAW" },
    },
  ],
  snapshots: [
    { kind: "MATCH_START", sequence: 0, context: {}, board },
    { kind: "ROUND_START", sequence: 1, context: { roundNumber: 1 }, board },
    {
      kind: "ACTIVATION_START",
      sequence: 4,
      context: {
        roundNumber: 1,
        activationId: "1:1:0",
        activationIndex: 0,
        actingPlayerId: "player:bottom",
        soldierId: "soldier:1",
      },
      board,
    },
    {
      kind: "ACTIVATION_END",
      sequence: 6,
      context: {
        roundNumber: 1,
        activationId: "1:1:0",
        activationIndex: 0,
        actingPlayerId: "player:bottom",
        soldierId: "soldier:1",
      },
      board,
    },
    { kind: "ROUND_END", sequence: 6, context: { roundNumber: 1 }, board },
    {
      kind: "MATCH_END",
      sequence: 7,
      context: {},
      board,
      outcome: { type: "DRAW" },
    },
    {
      kind: "TERMINAL",
      sequence: 7,
      context: {},
      board,
      outcome: { type: "DRAW" },
    },
  ],
  private: {
    byPlayerId: {
      "player:bottom": {
        "private:event:2": { plan: "hidden" },
      },
    },
  },
})

describe("Chronicle storage", () => {
  it("stores metadata and preserves unified private artifact sections", async () => {
    const store = createMemoryChronicleStoreForTests()
    const stored = await store.put({
      chronicle: validChronicle(),
      integrityIdentity: currentIntegrityIdentity(),
    })

    expect(stored.metadata.schemaVersion).toBe("chronicle-v1.4")
    expect(stored.metadata.hash).toMatch(/^[a-f0-9]{64}$/)
    expect(stored.metadata.eventCount).toBe(8)
    expect(stored.metadata.snapshotCount).toBe(7)
    expect(stored.metadata.bottomPlayerId).toBe("player:bottom")
    expect(stored.metadata.topPlayerId).toBe("player:top")
    expect(stored.metadata.bottomStrategyRevisionId).toBe(
      "strategy-revision:bottom",
    )
    expect(stored.metadata.arenaVariantId).toBe("arena:smoke:v1")
    expect(stored.artifact.events).toHaveLength(8)
    expect(stored.artifact.private?.byPlayerId["player:bottom"]).toBeDefined()
  })

  it("does not create a duplicate Chronicle for one Match", async () => {
    const store = createMemoryChronicleStoreForTests()
    const integrityIdentity = currentIntegrityIdentity()
    await store.put({ chronicle: validChronicle(), integrityIdentity })
    await store.put({ chronicle: validChronicle(), integrityIdentity })

    expect(store.size()).toBe(1)
  })

  it("rejects a conflicting artifact for an already stored Match", async () => {
    const store = createMemoryChronicleStoreForTests()
    const integrityIdentity = currentIntegrityIdentity()
    await store.put({ chronicle: validChronicle(), integrityIdentity })
    const conflicting = validChronicle()
    const bottomPrivate = conflicting.private!.byPlayerId[
      "player:bottom"
    ] as Record<string, unknown>
    bottomPrivate["private:event:2"] = {
      plan: "conflicting-hidden-plan",
    }

    await expect(
      store.put({ chronicle: conflicting, integrityIdentity }),
    ).rejects.toBeInstanceOf(ChronicleValidationSystemFailure)
    expect(store.size()).toBe(1)
  })

  it("rejects a serializable candidate-shaped object without the admission brand", async () => {
    const store = createMemoryChronicleStoreForTests()
    await expect(
      store.put({
        candidateAdmission: {
          profile: "candidate-v1.37",
          chronicle: validChronicle(),
        },
        integrityIdentity: currentIntegrityIdentity(),
      } as never),
    ).rejects.toThrow(/trusted semantic admission/iu)
    expect(store.size()).toBe(0)
  })

  it("throws a system failure for invalid Chronicle validation", async () => {
    const store = createMemoryChronicleStoreForTests()
    const invalid = {
      ...validChronicle(),
      events: [],
    }

    await expect(
      store.put({
        chronicle: invalid,
        integrityIdentity: currentIntegrityIdentity(),
      }),
    ).rejects.toBeInstanceOf(ChronicleValidationSystemFailure)
  })

  it("rejects partial, swapped, singular, wrong-revision, and independently supplied identity without a row", async () => {
    const valid = currentIntegrityIdentity()
    const cases: unknown[] = [
      { chronicle: validChronicle() },
      {
        chronicle: validChronicle(),
        integrityIdentity: {
          ...valid,
          evidencePair: {
            ...valid.evidencePair,
            bottom: valid.evidencePair.top,
            top: valid.evidencePair.bottom,
          },
        },
      },
      {
        chronicle: validChronicle(),
        integrityIdentity: {
          ...valid,
          evidencePair: {
            ...valid.evidencePair,
            top: valid.evidencePair.bottom,
          },
        },
      },
      {
        chronicle: validChronicle(),
        integrityIdentity: {
          ...valid,
          evidencePair: {
            ...valid.evidencePair,
            bottom: {
              ...valid.evidencePair.bottom,
              strategyRevisionId: "strategy-revision:wrong",
            },
          },
        },
      },
      {
        chronicle: validChronicle(),
        integrityIdentity: {
          ...valid,
          evidencePair: {
            ...valid.evidencePair,
            bottom: { ...valid.evidencePair.bottom },
            top: { ...valid.evidencePair.top },
          },
        },
      },
    ]

    for (const input of cases) {
      const store = createMemoryChronicleStoreForTests()
      await expect(store.put(input as never)).rejects.toThrow(/identity|pair/iu)
      expect(store.size()).toBe(0)
    }
  })

  it("persists the semantic tuple and exact ordered evidence relationship for new rows", async () => {
    const calls: Array<{ sql: string; values: readonly unknown[] }> = []
    const pool = {
      async query(sql: string, values: readonly unknown[] = []) {
        calls.push({ sql: sql.replace(/\s+/gu, " ").trim(), values })
        return { rows: [], rowCount: 1 }
      },
    }
    const integrityIdentity = currentIntegrityIdentity()

    await createPostgresChronicleStore(pool as never).put({
      chronicle: validChronicle(),
      integrityIdentity,
    })

    expect(calls).toHaveLength(1)
    expect(calls[0]!.sql).toContain("integrity_match_set_id")
    expect(calls[0]!.sql).toContain("compatibility_tuple_id")
    expect(calls[0]!.sql).toContain("authority_bundle_hash")
    expect(calls[0]!.sql).toContain("authority_registry_generation")
    expect(calls[0]!.sql).toContain("bottom_execution_evidence")
    expect(calls[0]!.sql).toContain("top_execution_evidence")
    expect(calls[0]!.values).toContain(integrityIdentity.matchSetId)
    expect(calls[0]!.values).toContain(tuple.tupleId)
    expect(calls[0]!.values).toContain(
      integrityIdentity.identity.authorityBundleHash,
    )
    expect(calls[0]!.values).toContain(
      integrityIdentity.identity.registryGeneration,
    )
  })

  it("keeps tuple-less v1.4 Chronicle bytes and content hashes unchanged", () => {
    const historical = validChronicle()
    const before = JSON.stringify(historical)
    const hash = createChronicleMetadata(historical).hash

    expect(JSON.stringify(historical)).toBe(before)
    expect(createChronicleMetadata(historical).hash).toBe(hash)
    expect(hash).toMatchInlineSnapshot(
      `"346826ba49aec61740499b1bcf0aea8dc6860ef04b865f72101a01b604d83aaa"`,
    )
  })
})
