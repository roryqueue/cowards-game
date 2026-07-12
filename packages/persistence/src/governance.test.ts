import { describe, expect, it } from "vitest"
import type { Pool } from "pg"
import {
  GovernanceInputError,
  applyCompetitionGovernanceAction,
  submitCompetitionReport,
} from "./governance.js"

const createPool = (input: {
  entrant?: boolean
  admin?: boolean
  existingId?: string
  recentCount?: number
  completeEvidence?: boolean
}) => {
  const calls: string[] = []
  const client = {
    async query(sql: string) {
      const normalized = sql.replace(/\s+/g, " ").trim()
      calls.push(normalized)
      if (
        normalized === "begin" ||
        normalized === "commit" ||
        normalized === "rollback"
      ) {
        return { rows: [] }
      }
      if (normalized.includes("select id from users"))
        return { rows: [{ id: "user:1" }] }
      if (normalized.includes("select is_admin from users")) {
        return { rows: [{ is_admin: input.admin ?? false }] }
      }
      if (
        normalized.includes("exists (") &&
        normalized.includes("from match_sets ms")
      ) {
        return {
          rows: [
            {
              id: "matchset:1",
              status: "complete",
              ladder_season_id: "season:1",
              is_entrant: input.entrant ?? false,
            },
          ],
        }
      }
      if (normalized.includes("select id from competition_reports")) {
        return { rows: input.existingId ? [{ id: input.existingId }] : [] }
      }
      if (
        normalized.includes(
          "count(*)::integer as count from competition_reports",
        )
      ) {
        return { rows: [{ count: input.recentCount ?? 0 }] }
      }
      if (normalized.includes("insert into competition_reports")) {
        return { rows: [{ id: "competition-report:new" }] }
      }
      if (normalized.includes("from match_sets ms where ms.id")) {
        return {
          rows: [
            {
              id: "matchset:1",
              status: "complete",
              ladder_season_id: "season:1",
              counted_status: "under_review",
              review_status: "under_review",
              scoring_available: true,
              match_count: 2,
              chronicle_count: input.completeEvidence === false ? 1 : 2,
            },
          ],
        }
      }
      return { rows: [] }
    },
    release() {},
  }
  return {
    pool: { connect: async () => client } as unknown as Pool,
    calls,
  }
}

describe("competition governance persistence", () => {
  it("records a general report without changing standings state", async () => {
    const { pool, calls } = createPool({})
    await expect(
      submitCompetitionReport(pool, {
        matchSetId: "matchset:1",
        reporterUserId: "user:1",
        submissionType: "report",
        category: "result_integrity",
        privateDetail: "Please review this result.",
      }),
    ).resolves.toMatchObject({ disposition: "created" })
    expect(calls.some((sql) => sql.startsWith("update match_sets"))).toBe(false)
    expect(calls).toContain("commit")
  })

  it("holds an entrant dispute and writes an audit event atomically", async () => {
    const { pool, calls } = createPool({ entrant: true })
    await submitCompetitionReport(pool, {
      matchSetId: "matchset:1",
      reporterUserId: "user:1",
      submissionType: "dispute",
      category: "result_integrity",
    })
    expect(
      calls.some((sql) => sql.includes("counted_status = 'disputed'")),
    ).toBe(true)
    expect(
      calls.some((sql) => sql.includes("insert into competition_audit_events")),
    ).toBe(true)
    expect(calls).toContain("commit")
  })

  it("rejects a non-entrant dispute and returns open duplicates idempotently", async () => {
    await expect(
      submitCompetitionReport(createPool({ entrant: false }).pool, {
        matchSetId: "matchset:1",
        reporterUserId: "user:1",
        submissionType: "dispute",
        category: "other",
      }),
    ).rejects.toMatchObject({ status: 403 })

    await expect(
      submitCompetitionReport(
        createPool({ existingId: "report:existing" }).pool,
        {
          matchSetId: "matchset:1",
          reporterUserId: "user:1",
          submissionType: "report",
          category: "other",
        },
      ),
    ).resolves.toMatchObject({
      submissionId: "report:existing",
      disposition: "already_open",
    })
  })

  it("gates counted restoration on complete replay evidence", async () => {
    await expect(
      applyCompetitionGovernanceAction(
        createPool({ admin: true, completeEvidence: false }).pool,
        {
          matchSetIds: ["matchset:1"],
          adminUserId: "admin:1",
          action: "counted",
          category: "review_resolved_counted",
          privateReason: "Evidence review complete.",
        },
      ),
    ).rejects.toBeInstanceOf(GovernanceInputError)
  })
})
