import { createHash, randomUUID } from "node:crypto"
import {
  CANDIDATE_MATCH_KERNEL,
  type GameState,
  type StrategyRuntime,
} from "@cowards/engine"
import { recordChronicleFromExecution } from "@cowards/replay"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  type ExecutableLaneIdentity,
  type RuntimeEntrantExecutionEvidence,
  type RuntimeExecutionResolvedEvidenceSnapshot,
  type SoldierBrainInput,
  type StrategyInput,
} from "@cowards/spec"
import { Pool } from "pg"
import { describe, expect, it } from "vitest"
import {
  MatchCompletionSemanticSystemFailure,
  completeMatch,
  type CandidateCompleteMatchInput,
} from "./complete-match.js"
import { migrate } from "./migrations.js"
import {
  createMatchExecutionEvidencePair,
  createMatchSetIntegrityIdentity,
} from "./integrity-evidence.js"

const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex")

const lane = (
  side: "bottom" | "top",
  namespace: string,
): ExecutableLaneIdentity => ({
  providerId: `${namespace}:provider:${side}`,
  languageId: side === "bottom" ? "typescript" : "python",
  runtimeId: `${namespace}:runtime:${side}`,
  runtimeVersion: "1",
  toolchainId: `${namespace}:toolchain:${side}`,
  toolchainVersion: "1",
  adapterId: `${namespace}:adapter:${side}`,
  adapterVersion: "1",
  policyId: `${namespace}:policy`,
  policyVersion: "1",
  corpusId: `${namespace}:corpus`,
  corpusVersion: "1",
  artifactId: `${namespace}:artifact:${side}`,
  artifactSha256: sha256(`${namespace}:artifact:${side}`),
  implementationId: `${namespace}:implementation:${side}`,
  buildId: `${namespace}:build:${side}`,
  semanticTupleId: tuple.tupleId,
  semanticTuple: { ...tuple.tuple },
})

const entrant = (
  side: "bottom" | "top",
  namespace: string,
): RuntimeEntrantExecutionEvidence => ({
  entrantKey: `${namespace}:entrant:${side}`,
  strategyRevisionId: `${namespace}:revision:${side}`,
  laneIdentity: lane(side, namespace),
  containmentCertificateRef: {
    kind: "containment",
    certificateId: `${namespace}:certificate:containment:${side}`,
    certificateVersion: "runtime-certificate-v1",
    certificateRecordHash: sha256(`${namespace}:containment:${side}`),
    registryGeneration: "1",
  },
  conformanceCertificateRef: {
    kind: "conformance",
    certificateId: `${namespace}:certificate:conformance:${side}`,
    certificateVersion: "runtime-certificate-v1",
    certificateRecordHash: sha256(`${namespace}:conformance:${side}`),
    registryGeneration: "1",
  },
  schedulingDecision: {
    status: "counted",
    reasonCode: "EVIDENCE_CURRENT",
    evaluatedAt: "2026-07-12T12:00:00.000Z",
    freshUntil: "2099-08-12T12:00:00.000Z",
    registryGeneration: "1",
  },
})

const activeIntegrityIdentity = (
  namespace: string,
): RuntimeExecutionResolvedEvidenceSnapshot => {
  const entrants = [entrant("bottom", namespace), entrant("top", namespace)]
  const identity = createMatchSetIntegrityIdentity({
    compatibility: { tupleId: tuple.tupleId, tuple: { ...tuple.tuple } },
    authorityBundleHash: sha256(`${namespace}:bundle`),
    registryGeneration: "1",
    expectedEntrants: entrants.map((entry) => ({
      entrantKey: entry.entrantKey,
      strategyRevisionId: entry.strategyRevisionId,
    })),
    entrants,
  })
  const pair = createMatchExecutionEvidencePair(identity, {
    bottomEntrantKey: `${namespace}:entrant:bottom`,
    topEntrantKey: `${namespace}:entrant:top`,
    bottomStrategyRevisionId: `${namespace}:revision:bottom`,
    topStrategyRevisionId: `${namespace}:revision:top`,
  })
  return {
    compatibility: identity.compatibility,
    authorityBundleHash: identity.authorityBundleHash,
    registryGeneration: identity.registryGeneration,
    entrants: { bottom: pair.bottom, top: pair.top },
  }
}

const passiveRuntime: StrategyRuntime = {
  selectActivations(input: StrategyInput) {
    return {
      ok: true,
      value: {
        activationOrders: input.mySoldiers
          .filter((soldier) => soldier.status === "ACTIVE")
          .map((soldier) => ({ soldierId: soldier.id })),
        strategyMemory: {},
      },
    }
  },
  runSoldierBrain(_input: SoldierBrainInput) {
    return {
      ok: true,
      value: { action: { type: "TURN_TO_STONE" }, soldierMemory: {} },
    }
  },
}

const createCandidateInput = (
  namespace: string,
): CandidateCompleteMatchInput => {
  const bottomRevisionId = `${namespace}:revision:bottom`
  const topRevisionId = `${namespace}:revision:top`
  const execution = CANDIDATE_MATCH_KERNEL.runMatch({
    matchId: `${namespace}:match`,
    seed: `${namespace}:seed`,
    arenaVariant: {
      id: `${namespace}:arena`,
      name: "Candidate persistence semantic admission",
      initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      terrainStones: [],
    },
    bottomPlayerId: `${namespace}:player:bottom`,
    topPlayerId: `${namespace}:player:top`,
    bottomStrategyRevisionId: bottomRevisionId,
    topStrategyRevisionId: topRevisionId,
    runtime: passiveRuntime,
  })
  const recorded = recordChronicleFromExecution({
    execution,
    metadata: {
      schemaVersion: "chronicle-v1.4",
      semanticTupleId: CANDIDATE_MATCH_KERNEL.tupleId,
      semanticTuple: CANDIDATE_MATCH_KERNEL.tuple,
    },
  })
  if (!recorded.ok) throw new Error(recorded.failure.code)
  if (execution.kind !== "completed" || execution.transitions.length === 0) {
    throw new Error("candidate execution did not complete")
  }
  const terminalStateHash = execution.transitions.at(-1)!.afterStateHash
  const outcome = execution.recorderMaterial.finalState.outcome
  if (!outcome) throw new Error("candidate execution has no outcome")

  // The snapshot is fully schema-valid. Its active-current tuple deliberately
  // cannot authorize candidate execution provenance.
  const integrityIdentity = activeIntegrityIdentity(namespace)

  return {
    profile: "candidate-v1.37",
    compatibility: recorded.semanticIdentity,
    chronicle: recorded.chronicle,
    boundaryAnchors: recorded.boundaryAnchors,
    execution,
    jobId: `${namespace}:job`,
    leaseToken: `${namespace}:lease`,
    finalState: recorded.finalState,
    terminalStateHash,
    outcome,
    integrityIdentity,
  }
}

const canonicalTables = [
  "matches",
  "match_jobs",
  "match_job_attempts",
  "chronicles",
  "result_flags",
  "trial_ladder_entries",
] as const

const snapshotCanonicalRows = async (
  pool: Pool,
): Promise<Record<string, readonly unknown[]>> => {
  const snapshot: Record<string, readonly unknown[]> = {}
  for (const table of canonicalTables) {
    const result = await pool.query<{ rows: readonly unknown[] }>(
      `select coalesce(
         jsonb_agg(to_jsonb(row_data) order by to_jsonb(row_data)::text),
         '[]'::jsonb
       ) as rows
       from (select * from ${table}) row_data`,
    )
    snapshot[table] = result.rows[0]!.rows
  }
  return snapshot
}

const databaseUrl = process.env.DATABASE_URL
const describePostgres = databaseUrl ? describe : describe.skip

describePostgres("candidate persistence semantic integrity", () => {
  const withDatabase = async (
    run: (pool: Pool, namespace: string) => Promise<void>,
  ): Promise<void> => {
    const schema = `semantic_${randomUUID().replaceAll("-", "")}`
    const namespace = `semantic:${randomUUID()}`
    const admin = new Pool({ connectionString: databaseUrl! })
    const pool = new Pool({
      connectionString: databaseUrl!,
      options: `-c search_path=${schema}`,
      max: 1,
    })
    try {
      await admin.query(`create schema ${schema}`)
      await migrate(pool)
      await run(pool, namespace)
    } finally {
      await pool.end()
      await admin.query(`drop schema if exists ${schema} cascade`)
      await admin.end()
    }
  }

  it("semantic invalid candidate state fails before derivation or row mutation", async () => {
    await withDatabase(async (pool, namespace) => {
      const input = createCandidateInput(namespace)
      const positioned = input.finalState.soldiers
        .map((soldier, index) => ({ soldier, index }))
        .filter(({ soldier }) => soldier.position !== null)
      const invalidState: GameState = {
        ...input.finalState,
        soldiers: input.finalState.soldiers.map((soldier, index) =>
          index === positioned[1]!.index
            ? {
                ...soldier,
                position: globalThis.structuredClone(
                  positioned[0]!.soldier.position,
                ),
              }
            : soldier,
        ),
      }
      const before = await snapshotCanonicalRows(pool)

      await expect(
        completeMatch(pool, { ...input, finalState: invalidState }),
      ).rejects.toMatchObject({
        code: "POSITION_OCCUPANCY_DUPLICATE",
        failureCategory: "system_failure",
        ownership: "system_integrity",
        playerPenalty: false,
        retryable: false,
      })

      expect(await snapshotCanonicalRows(pool)).toEqual(before)
      expect(before).toEqual(
        Object.fromEntries(canonicalTables.map((table) => [table, []])),
      )
    })
  }, 30_000)

  it("reconstruction mismatch fails before any canonical row mutation", async () => {
    await withDatabase(async (pool, namespace) => {
      const input = createCandidateInput(namespace)
      const before = await snapshotCanonicalRows(pool)
      const boundaryAnchors = input.boundaryAnchors.map((anchor, index) =>
        index === 0
          ? { ...anchor, stateHash: `sha256:${"f".repeat(64)}` }
          : anchor,
      )

      await expect(
        completeMatch(pool, { ...input, boundaryAnchors }),
      ).rejects.toBeInstanceOf(MatchCompletionSemanticSystemFailure)
      expect(await snapshotCanonicalRows(pool)).toEqual(before)
    })
  }, 30_000)

  it("candidate execution cannot be relabeled with active-current evidence", async () => {
    await withDatabase(async (pool, namespace) => {
      const input = createCandidateInput(namespace)
      const before = await snapshotCanonicalRows(pool)

      await expect(completeMatch(pool, input)).rejects.toMatchObject({
        code: "CANDIDATE_CROSS_DOCUMENT_IDENTITY_INVALID",
        failureCategory: "system_failure",
        ownership: "system_integrity",
        playerPenalty: false,
      })
      expect(await snapshotCanonicalRows(pool)).toEqual(before)
    })
  }, 30_000)
})
