import { randomUUID } from "node:crypto"
import {
  CANDIDATE_MATCH_KERNEL,
  type GameState,
  type StrategyRuntime,
} from "@cowards/engine"
import { recordChronicleFromExecution } from "@cowards/replay"
import type {
  RuntimeExecutionResolvedEvidenceSnapshot,
  SoldierBrainInput,
  StrategyInput,
} from "@cowards/spec"
import { Pool } from "pg"
import { describe, expect, it } from "vitest"
import {
  MatchCompletionOperationalSystemFailure,
  MatchCompletionSemanticSystemFailure,
  completeMatch,
  type CandidateCompleteMatchInput,
} from "./complete-match.js"
import { migrate } from "./migrations.js"

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

  // Plan 16 deliberately does not fabricate a candidate publication or
  // receipt. This response-shaped identity is enough to exercise semantic
  // admission; only Plan 19 can make it schedulable/persistable.
  const integrityIdentity = {
    compatibility: recorded.semanticIdentity,
    authorityBundleHash: "0".repeat(64),
    registryGeneration: "1",
    entrants: {
      bottom: { strategyRevisionId: bottomRevisionId },
      top: { strategyRevisionId: topRevisionId },
    },
  } as unknown as RuntimeExecutionResolvedEvidenceSnapshot

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

  it("valid candidate evidence remains non-authorizing without a real Plan 19 receipt", async () => {
    await withDatabase(async (pool, namespace) => {
      const input = createCandidateInput(namespace)
      const before = await snapshotCanonicalRows(pool)

      await expect(completeMatch(pool, input)).rejects.toMatchObject({
        code: new MatchCompletionOperationalSystemFailure().code,
        failureCategory: "system_failure",
        playerPenalty: false,
      })
      expect(await snapshotCanonicalRows(pool)).toEqual(before)
    })
  }, 30_000)
})
