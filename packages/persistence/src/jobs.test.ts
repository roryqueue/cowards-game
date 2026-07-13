import { describe, expect, it } from "vitest"
import type { Pool } from "pg"
import {
  CLAIM_NEXT_MATCH_JOB_SQL,
  DEFAULT_LEASE_MS,
  claimNextMatchJob,
  shouldExhaustRetries,
} from "./jobs.js"

describe("job claiming", () => {
  it("uses lease-based skip-locked claiming", () => {
    expect(DEFAULT_LEASE_MS).toBe(30_000)
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain("for update skip locked")
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
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "runtime_evidence_lane_controls",
    )
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
