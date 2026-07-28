import { createHash, randomUUID } from "node:crypto"
import { classifyCompetitionCountedState } from "@cowards/spec"
import { Pool } from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
  GovernanceInputError,
  applyIntegrityCohortClassification,
  applyCompetitionGovernanceAction,
  compensateIntegrityCohortClassification,
  createIntegrityCohortPreview,
  foldEffectiveIntegrityClassifications,
  previewIntegrityCohortClassification,
  submitCompetitionReport,
} from "./governance.js"
import { resolveHistoricalIntegrityEvidence } from "./integrity-evidence.js"
import { migrate } from "./migrations.js"

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

  it("rejects mutable integrity correction in favor of append-only cohorts", async () => {
    const { pool, calls } = createPool({ admin: true })
    await expect(
      applyCompetitionGovernanceAction(pool, {
        matchSetIds: ["matchset:1"],
        adminUserId: "admin:1",
        action: "invalidated",
        category: "result_invalidated",
        privateReason: "Exact integrity finding.",
      }),
    ).rejects.toMatchObject({ status: 409 })
    expect(calls).toEqual([])
  })
})

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex")

const cohortPredicate = Object.freeze({
  version: "integrity-cohort-predicate-v1" as const,
  operator: "match_set_ids" as const,
  matchSetIds: ["matchset:b", "matchset:a"],
})

const cohortSources = [
  {
    matchSetId: "matchset:a",
    originalClassification: "counted" as const,
    compatibilityTupleId: "tuple:a",
    executionEvidenceSetHash: sha256("evidence:a"),
  },
  {
    matchSetId: "matchset:b",
    originalClassification: "counted" as const,
    compatibilityTupleId: "tuple:b",
    executionEvidenceSetHash: sha256("evidence:b"),
  },
]

describe("append-only integrity cohort governance", () => {
  it("previews a deterministic exact cohort independent of input order", () => {
    const first = createIntegrityCohortPreview(cohortSources, cohortPredicate)
    const repeated = createIntegrityCohortPreview(
      [...cohortSources].reverse(),
      { ...cohortPredicate, matchSetIds: [...cohortPredicate.matchSetIds].reverse() },
    )
    expect(repeated).toEqual(first)
    expect(first).toMatchObject({
      count: 2,
      sampleMatchSetIds: ["matchset:a", "matchset:b"],
    })
    expect(first.previewHash).toMatch(/^[0-9a-f]{64}$/u)
  })

  it("folds classification and compensation in monotonic sequence without rewriting", () => {
    const classification = {
      eventId: "integrity-classification:00000000000000000001:a",
      sequence: 1,
      predicate: cohortPredicate,
      classification: "invalidated" as const,
    }
    const restoration = {
      eventId: "integrity-classification:00000000000000000002:b",
      sequence: 2,
      predicate: cohortPredicate,
      classification: "counted" as const,
    }
    const events = [classification, restoration]
    const compensations = [{
      compensationEventId: "integrity-compensation:00000000000000000002:b",
      classificationEventId: restoration.eventId,
      compensatesEventId: classification.eventId,
    }]
    expect(foldEffectiveIntegrityClassifications([classification], [])).toEqual({
      "matchset:a": "invalidated",
      "matchset:b": "invalidated",
    })
    expect(foldEffectiveIntegrityClassifications(events, compensations)).toEqual({
      "matchset:a": "counted",
      "matchset:b": "counted",
    })
    expect(events).toEqual([classification, restoration])
  })

  it("rejects documentation-only invalidation before opening a transaction", async () => {
    const calls: string[] = []
    const pool = {
      connect: async () => {
        calls.push("connect")
        throw new Error("must not connect")
      },
    } as unknown as Pool
    await expect(
      applyIntegrityCohortClassification(pool, {
        preview: createIntegrityCohortPreview(cohortSources, cohortPredicate),
        adminUserId: "admin:1",
        classification: "invalidated",
        reason: "Newer documentation now exists.",
        evidenceReferences: [{
          kind: "documentation",
          referenceId: "doc:new-standard",
          sha256: sha256("doc:new-standard"),
        }],
        standingsInput: { entrants: [], matchSets: [] },
      }),
    ).rejects.toThrow(/reproducible|documentation/iu)
    expect(calls).toEqual([])
  })
})

const databaseUrl = process.env.DATABASE_URL
const describePostgres = databaseUrl ? describe : describe.skip

describePostgres("PostgreSQL append-only integrity cohort governance", () => {
  const schema = `integrity_governance_${randomUUID().replaceAll("-", "")}`
  let admin: Pool
  let pool: Pool
  const adminId = "user:integrity-admin"

  beforeAll(async () => {
    admin = new Pool({ connectionString: databaseUrl! })
    await admin.query(`create schema ${schema}`)
    pool = new Pool({
      connectionString: databaseUrl!,
      options: `-c search_path=${schema}`,
      max: 1,
    })
    await migrate(pool)
    await pool.query(
      "insert into users (id, display_name, is_admin) values ($1, 'Integrity admin', true)",
      [adminId],
    )
    await pool.query(
      `insert into match_sets (id, matrix, counted_status)
       values ('matchset:a', '[]'::jsonb, 'counted'), ('matchset:b', '[]'::jsonb, 'counted')`,
    )
  }, 30_000)

  afterAll(async () => {
    await pool.end()
    await admin.query(`drop schema ${schema} cascade`)
    await admin.end()
  })

  const standingsInput = () => {
    const historical = resolveHistoricalIntegrityEvidence({
      source: {
        matchSetId: "matchset:a",
        rulesVersion: "cowards-rules-v1.4",
        engineVersion: null,
        runtimeAbiVersion: null,
        chronicleVersion: "chronicle-v1.4",
        arenaCatalogVersion: null,
        setPolicyVersion: null,
        originalCounted: true,
        originalOutcome: { winnerId: "bottom" },
      },
      releaseManifests: [{
        manifestId: "release:v1.4",
        manifestHash: sha256("release:v1.4"),
        compatibility: {
          tupleId:
            "sha256:be54eb5317af0a87190433f649f9beef4490493d8c2a8815a323b082651b514c",
          tuple: {
            rules: "cowards-rules-v1.4",
            engine: "0.1.4",
            runtimeAbi: "strategy-runtime-abi-v1.14",
            chronicle: "chronicle-v1.4",
            arenaCatalog: "canonical-arena-catalog-v1.4",
            setPolicy: "canonical-set-policy-v1.4",
          },
        },
      }],
    })
    return {
      entrants: [{
        entrantId: "entry:a",
        strategyRevisionId: "revision:a",
        ownerHandle: "alpha",
        displayLabel: "Alpha",
        sourceHash: "source:a",
      }],
      matchSets: [{
        matchSetId: "matchset:a",
        strategyRevisionIds: ["revision:a"],
        countedState: classifyCompetitionCountedState({
          executionStatus: "complete",
          origin: "trial",
          expectedMatchCount: 1,
          chronicleMatchCount: 1,
          scoringAvailable: true,
          reviewState: "none",
          storedState: "counted",
        }),
        scoring: { rankings: [{
          strategyRevisionId: "revision:a",
          wins: 1,
          losses: 0,
          draws: 0,
          points: 3,
          penaltyPoints: 0,
          penalties: [],
          failedSystemMatches: 0,
          survivingSoldiers: 1,
          survivalTurns: 1,
        }] },
        resultHref: "/matchsets/matchset:a",
        integrityResolution: historical,
      }],
    }
  }

  it("rechecks preview, appends invalidation and compensation, and never mutates source rows", async () => {
    const before = await pool.query("select id, counted_status, matrix from match_sets order by id")
    const beforeHash = sha256(JSON.stringify(before.rows))
    const preview = await previewIntegrityCohortClassification(pool, cohortPredicate)
    const applied = await applyIntegrityCohortClassification(pool, {
      preview,
      adminUserId: adminId,
      classification: "invalidated",
      reason: "Exact execution trace does not match persisted evidence.",
      evidenceReferences: [{
        kind: "match_execution",
        referenceId: "trace:reproduction:1",
        sha256: sha256("trace:reproduction:1"),
      }],
      standingsInput: standingsInput(),
    })
    expect(applied.event.sequence).toBe(1)
    expect(applied.standings[0]?.points).toBe(0)

    const compensated = await compensateIntegrityCohortClassification(pool, {
      preview,
      adminUserId: adminId,
      compensatesEventId: applied.event.eventId,
      restoredClassification: "counted",
      reason: "Independent trace proved the original result reliable.",
      evidenceReferences: [{
        kind: "match_execution",
        referenceId: "trace:independent:2",
        sha256: sha256("trace:independent:2"),
      }],
      standingsInput: standingsInput(),
    })
    expect(compensated.event.sequence).toBe(2)
    expect(compensated.standings[0]?.points).toBe(3)

    const after = await pool.query("select id, counted_status, matrix from match_sets order by id")
    expect(sha256(JSON.stringify(after.rows))).toBe(beforeHash)
    await expect(
      pool.query(
        "update integrity_cohort_classification_events set reason = 'rewritten' where id = $1",
        [applied.event.eventId],
      ),
    ).rejects.toThrow(/append-only/iu)
  })

  it("rejects preview drift with no appended event", async () => {
    const preview = await previewIntegrityCohortClassification(pool, cohortPredicate)
    await pool.query("update match_sets set counted_status = 'under_review' where id = 'matchset:b'")
    const before = await pool.query("select count(*)::integer as count from integrity_cohort_classification_events")
    await expect(
      applyIntegrityCohortClassification(pool, {
        preview,
        adminUserId: adminId,
        classification: "invalid",
        reason: "Exact evidence finding.",
        evidenceReferences: [{
          kind: "identity_proof",
          referenceId: "identity:proof:1",
          sha256: sha256("identity:proof:1"),
        }],
        standingsInput: standingsInput(),
      }),
    ).rejects.toThrow(/preview drift/iu)
    const after = await pool.query("select count(*)::integer as count from integrity_cohort_classification_events")
    expect(after.rows[0]?.count).toBe(before.rows[0]?.count)
  })
})
