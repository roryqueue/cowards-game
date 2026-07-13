import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { Pool } from "pg"
import { migrate } from "./migrations.js"
import {
  CLAIM_NEXT_MATCH_JOB_SQL,
  DEFAULT_LEASE_MS,
  claimNextMatchJob,
  shouldExhaustRetries,
} from "./jobs.js"

describe("job claiming", () => {
  it("uses lease-based skip-locked claiming", () => {
    expect(DEFAULT_LEASE_MS).toBe(30_000)
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain("for update of job skip locked")
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain("lease_expires_at < $1")
  })

  it("binds candidates to the exact installed authority, ordered evidence, and current per-side certificates", () => {
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "runtime_evidence_authority_publication_events",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain("event_kind = 'installed'")
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "runtime_evidence_authority_publication_sources",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "bottom_execution_evidence = bottom_entrant.execution_snapshot",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "top_execution_evidence = top_entrant.execution_snapshot",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "runtime_evidence_certificate_revocations",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "runtime_evidence_certificate_supersessions",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain("runtime_evidence_lane_controls")
  })

  it("returns null without lifecycle mutation when no exact current candidate exists", async () => {
    const calls: string[] = []
    const client = {
      async query(sql: string) {
        calls.push(sql.trim())
        return { rows: [] }
      },
      release() {},
    }
    const pool = {
      async connect() {
        return client
      },
    } as unknown as Pool

    await expect(
      claimNextMatchJob(pool, {
        workerId: "worker:exact",
        now: new Date("2026-07-13T00:00:00.000Z"),
      }),
    ).resolves.toBeNull()

    expect(calls.some((sql) => /^update\s/iu.test(sql))).toBe(false)
    expect(calls.some((sql) => /match_job_attempts/iu.test(sql))).toBe(false)
    expect(calls).toContain("commit")
  })

  it("returns the locked semantic tuple and ordered entrant evidence on a valid claim", async () => {
    const bottom = {
      entrantKey: "bottom",
      strategyRevisionId: "revision:bottom",
    }
    const top = { entrantKey: "top", strategyRevisionId: "revision:top" }
    const client = {
      async query(sql: string) {
        if (sql.includes("with current_authority")) {
          return {
            rows: [
              {
                id: "job:exact",
                match_id: "match:exact",
                attempts: 0,
                compatibility_tuple_id: `sha256:${"a".repeat(64)}`,
                compatibility_rules_version: "rules-v1",
                compatibility_engine_version: "engine-v1",
                compatibility_runtime_abi_version: "abi-v1",
                compatibility_chronicle_version: "chronicle-v1",
                compatibility_arena_catalog_version: "arenas-v1",
                compatibility_set_policy_version: "set-v1",
                authority_bundle_hash: "b".repeat(64),
                authority_registry_generation: "7",
                bottom_execution_evidence: bottom,
                top_execution_evidence: top,
              },
            ],
          }
        }
        return { rows: [] }
      },
      release() {},
    }
    const pool = {
      async connect() {
        return client
      },
    } as unknown as Pool

    const claimed = await claimNextMatchJob(pool, {
      workerId: "worker:exact",
      now: new Date("2026-07-13T00:00:00.000Z"),
    })
    expect(claimed?.evidenceSnapshot).toEqual({
      compatibility: {
        tupleId: `sha256:${"a".repeat(64)}`,
        tuple: {
          rules: "rules-v1",
          engine: "engine-v1",
          runtimeAbi: "abi-v1",
          chronicle: "chronicle-v1",
          arenaCatalog: "arenas-v1",
          setPolicy: "set-v1",
        },
      },
      authorityBundleHash: "b".repeat(64),
      registryGeneration: "7",
      entrants: { bottom, top },
    })
  })

  it("exhausts retries at the fixed system failure limit", () => {
    expect(
      shouldExhaustRetries({
        attempts: 2,
        maxAttempts: 3,
        retryable: true,
      }),
    ).toBe(false)
    expect(
      shouldExhaustRetries({
        attempts: 3,
        maxAttempts: 3,
        retryable: true,
      }),
    ).toBe(true)
    expect(
      shouldExhaustRetries({
        attempts: 1,
        maxAttempts: 3,
        retryable: false,
      }),
    ).toBe(true)
  })
})

const databaseUrl = process.env.DATABASE_URL
const describePostgres = databaseUrl ? describe : describe.skip

describePostgres("PostgreSQL integrity identity before claim", () => {
  let admin: Pool
  let pool: Pool
  const schema = `jobs_${randomUUID().replaceAll("-", "")}`

  beforeAll(async () => {
    admin = new Pool({ connectionString: databaseUrl! })
    await admin.query(`create schema ${schema}`)
    pool = new Pool({
      connectionString: databaseUrl!,
      options: `-c search_path=${schema}`,
      max: 1,
    })
    await migrate(pool)
  })

  afterAll(async () => {
    await pool.end()
    await admin.query(`drop schema ${schema} cascade`)
    await admin.end()
  })

  it("leaves a queued job and Match byte-for-byte lifecycle-equivalent when exact authority is absent", async () => {
    const suffix = randomUUID()
    const userId = `user:${suffix}`
    const strategyId = `strategy:${suffix}`
    const bottomRevisionId = `revision:${suffix}:bottom`
    const topRevisionId = `revision:${suffix}:top`
    const arenaId = `arena:${suffix}`
    const matchId = `match:${suffix}`
    const jobId = `match-job:${suffix}`
    await pool.query(
      "insert into users (id, display_name) values ($1, 'Job proof')",
      [userId],
    )
    await pool.query(
      "insert into strategies (id, owner_user_id, name) values ($1, $2, 'Job proof')",
      [strategyId, userId],
    )
    for (const revisionId of [bottomRevisionId, topRevisionId]) {
      await pool.query(
        `insert into strategy_revisions
          (id, strategy_id, source, source_hash, source_bytes, runtime,
           engine_compatibility, validation)
         values ($1, $2, 'return', $3, 6, '{}'::jsonb, '{}'::jsonb,
                 '{"valid":true}'::jsonb)`,
        [revisionId, strategyId, "a".repeat(64)],
      )
    }
    await pool.query(
      "insert into arena_variants (id, name, config) values ($1, 'Job proof', '{}'::jsonb)",
      [arenaId],
    )
    await pool.query(
      `insert into matches
        (id, bottom_strategy_revision_id, top_strategy_revision_id,
         arena_variant_id, seed, bottom_player_id, top_player_id)
       values ($1,$2,$3,$4,'seed','player:bottom','player:top')`,
      [matchId, bottomRevisionId, topRevisionId, arenaId],
    )
    await pool.query("insert into match_jobs (id, match_id) values ($1, $2)", [
      jobId,
      matchId,
    ])
    const before = await pool.query(
      `select j.status, j.attempts, j.worker_id, j.lease_token,
              j.lease_expires_at, m.status as match_status,
              (select count(*)::integer from match_job_attempts a
                where a.job_id = j.id) as attempt_rows
         from match_jobs j join matches m on m.id = j.match_id
        where j.id = $1`,
      [jobId],
    )

    await expect(
      claimNextMatchJob(pool, {
        workerId: "worker:postgres-proof",
        matchIds: [matchId],
        now: new Date("2026-07-13T00:00:00.000Z"),
      }),
    ).resolves.toBeNull()

    const after = await pool.query(
      `select j.status, j.attempts, j.worker_id, j.lease_token,
              j.lease_expires_at, m.status as match_status,
              (select count(*)::integer from match_job_attempts a
                where a.job_id = j.id) as attempt_rows
         from match_jobs j join matches m on m.id = j.match_id
        where j.id = $1`,
      [jobId],
    )
    expect(after.rows[0]).toEqual(before.rows[0])
  })
})
