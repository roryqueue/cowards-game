import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import type { GameState } from "@cowards/engine"
import {
  RuntimeExecutionFinalStateSchema,
  type Chronicle,
  type RuntimeExecutionResolvedEvidenceSnapshot,
} from "@cowards/spec"
import { Pool } from "pg"
import { describe, expect, it } from "vitest"
import { completeMatch } from "./complete-match.js"
import { migrate } from "./migrations.js"

type SemanticCorpus = {
  valid: { state: unknown }
}

const corpus = JSON.parse(
  readFileSync(
    new URL(
      "../../spec/src/fixtures/semantic-integrity-vectors.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as SemanticCorpus

const snapshotCounts = async (pool: Pool) => {
  const result = await pool.query<{
    matches: number
    jobs: number
    attempts: number
    chronicles: number
    results: number
    standings: number
  }>(`
    select
      (select count(*)::integer from matches) as matches,
      (select count(*)::integer from match_jobs) as jobs,
      (select count(*)::integer from match_job_attempts) as attempts,
      (select count(*)::integer from chronicles) as chronicles,
      (select count(*)::integer from result_flags) as results,
      (select count(*)::integer from trial_ladder_entries) as standings
  `)
  return result.rows[0]
}

describe("persistence semantic integrity", () => {
  it("missing-semantic-enforcement: persistence rejects before mutation", async () => {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for semantic persistence RED")
    }
    const schema = `semantic_${randomUUID().replaceAll("-", "")}`
    const admin = new Pool({ connectionString: databaseUrl })
    const pool = new Pool({
      connectionString: databaseUrl,
      options: `-c search_path=${schema}`,
      max: 1,
    })
    try {
      await admin.query(`create schema ${schema}`)
      await migrate(pool)
      const parsed = RuntimeExecutionFinalStateSchema.parse(corpus.valid.state)
      const invalidState: GameState = {
        ...parsed,
        soldiers: parsed.soldiers.map((soldier, index) => ({
          ...soldier,
          position:
            index === 1 ? parsed.soldiers[0]!.position : soldier.position,
        })),
      }
      expect(RuntimeExecutionFinalStateSchema.safeParse(invalidState).success).toBe(
        true,
      )
      const before = await snapshotCounts(pool)
      const chronicle: Chronicle = {
        schemaVersion: "chronicle-v1.4",
        reproducibility: {
          matchId: invalidState.matchId,
          seed: invalidState.seed,
          arenaVariantId: invalidState.arenaVariant.id,
          arenaVariantVersion: invalidState.versions.arenaVariant,
          strategyRevisionIds: ["revision:bottom", "revision:top"],
          versions: invalidState.versions,
        },
        events: [],
        snapshots: [],
      }

      let failure: unknown
      try {
        await completeMatch(pool, {
          jobId: "job:semantic-red",
          leaseToken: "lease:semantic-red",
          chronicle,
          finalState: invalidState,
          integrityIdentity: {} as RuntimeExecutionResolvedEvidenceSnapshot,
        })
      } catch (error) {
        failure = error
      }
      const after = await snapshotCounts(pool)
      expect(after).toEqual(before)
      expect(after).toEqual({
        matches: 0,
        jobs: 0,
        attempts: 0,
        chronicles: 0,
        results: 0,
        standings: 0,
      })
      if (String(failure).includes("POSITION_OCCUPANCY_DUPLICATE")) {
        expect(failure).toMatchObject({
          failureCategory: "system_failure",
          playerPenalty: false,
        })
        return
      }

      throw new Error("[EXPECTED_RED:MISSING_SEMANTIC_ENFORCEMENT:PERSISTENCE]")
    } finally {
      await pool.end()
      await admin.query(`drop schema if exists ${schema} cascade`)
      await admin.end()
    }
  }, 30_000)
})
