import { randomUUID } from "node:crypto"
import {
  classifyCompetitionCountedState,
  competitionGovernanceActionPolicy,
  normalizeCompetitionReportDetail,
  type CompetitionGovernanceAction,
  type CompetitionGovernanceCategory,
  type CompetitionReportCategory,
  type CompetitionReportSubmissionType,
  type LadderMatchSetCountedStatus,
  type LadderNonCountedReason,
  type UserId,
} from "@cowards/spec"
import type { Pool, PoolClient, QueryResultRow } from "pg"
import { withTransaction } from "./db.js"
import type { MatchSetStatus } from "./schema.js"

type Queryable = Pick<Pool | PoolClient, "query">

export class GovernanceInputError extends Error {
  readonly status: number
  readonly retryAfterSeconds?: number | undefined

  constructor(
    message: string,
    options: { status?: number; retryAfterSeconds?: number } = {},
  ) {
    super(message)
    this.name = "GovernanceInputError"
    this.status = options.status ?? 400
    this.retryAfterSeconds = options.retryAfterSeconds
  }
}

export interface CompetitionReportReceipt {
  submissionId: string
  disposition: "created" | "already_open"
  publicMessage: string
}

const reportMessage = (type: CompetitionReportSubmissionType): string =>
  type === "dispute"
    ? "Dispute received. This result is held out of standings while reviewed."
    : "Report received. Reports are reviewed without changing standings automatically."

const executionStatus = (
  status: MatchSetStatus,
): "queued" | "running" | "complete" | "degraded" | "failed" => {
  if (status === "pending") return "queued"
  if (status === "running") return "running"
  if (status === "complete") return "complete"
  if (status === "degraded") return "degraded"
  return "failed"
}

export const submitCompetitionReport = async (
  pool: Pool,
  input: {
    matchSetId: string
    reporterUserId: UserId
    submissionType: CompetitionReportSubmissionType
    category: CompetitionReportCategory
    privateDetail?: unknown
    now?: Date | undefined
  },
): Promise<CompetitionReportReceipt> => {
  const privateDetail = normalizeCompetitionReportDetail(input.privateDetail)
  const now = input.now ?? new Date()
  return withTransaction(pool, async (client) => {
    const reporter = await client.query<{ id: string }>(
      "select id from users where id = $1 for update",
      [input.reporterUserId],
    )
    if (!reporter.rows[0]) {
      throw new GovernanceInputError("Sign in is required.", { status: 401 })
    }

    const target = await client.query<{
      id: string
      status: MatchSetStatus
      ladder_season_id: string | null
      is_entrant: boolean
    }>(
      `
        select ms.id, ms.status, ms.ladder_season_id,
          exists (
            select 1 from competition_entrants ce
            where ce.match_set_id = ms.id and ce.owner_user_id = $2
          ) as is_entrant
        from match_sets ms
        where ms.id = $1
        for update of ms
      `,
      [input.matchSetId, input.reporterUserId],
    )
    const matchSet = target.rows[0]
    if (!matchSet || !matchSet.ladder_season_id) {
      throw new GovernanceInputError("Competition result not found.", {
        status: 404,
      })
    }
    if (
      !["complete", "degraded", "failed_system", "blocked"].includes(
        matchSet.status,
      )
    ) {
      throw new GovernanceInputError(
        "Wait for the MatchSet to reach a result before reporting it.",
        { status: 409 },
      )
    }
    if (input.submissionType === "dispute" && !matchSet.is_entrant) {
      throw new GovernanceInputError(
        "Only an entrant owner can dispute this result.",
        { status: 403 },
      )
    }

    const existing = await client.query<{ id: string }>(
      `
        select id from competition_reports
        where match_set_id = $1 and reporter_user_id = $2
          and submission_type = $3 and category = $4 and status = 'open'
      `,
      [
        input.matchSetId,
        input.reporterUserId,
        input.submissionType,
        input.category,
      ],
    )
    if (existing.rows[0]) {
      return {
        submissionId: existing.rows[0].id,
        disposition: "already_open",
        publicMessage: "An open report already exists for this category.",
      }
    }

    const recent = await client.query<{ count: number }>(
      `
        select count(*)::integer as count from competition_reports
        where reporter_user_id = $1 and created_at >= $2::timestamptz - interval '10 minutes'
      `,
      [input.reporterUserId, now],
    )
    if ((recent.rows[0]?.count ?? 0) >= 5) {
      throw new GovernanceInputError(
        "Report intake is temporarily limited. Please try again shortly.",
        { status: 429, retryAfterSeconds: 600 },
      )
    }

    const submissionId = `competition-report:${randomUUID()}`
    const inserted = await client.query<{ id: string }>(
      `
        insert into competition_reports (
          id, match_set_id, reporter_user_id, submission_type,
          category, private_detail, created_at
        ) values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (match_set_id, reporter_user_id, submission_type, category)
          where status = 'open' do nothing
        returning id
      `,
      [
        submissionId,
        input.matchSetId,
        input.reporterUserId,
        input.submissionType,
        input.category,
        privateDetail ?? null,
        now,
      ],
    )
    const acceptedId = inserted.rows[0]?.id
    if (!acceptedId) {
      const raced = await client.query<{ id: string }>(
        `select id from competition_reports
         where match_set_id = $1 and reporter_user_id = $2
           and submission_type = $3 and category = $4 and status = 'open'`,
        [
          input.matchSetId,
          input.reporterUserId,
          input.submissionType,
          input.category,
        ],
      )
      return {
        submissionId: raced.rows[0]?.id ?? submissionId,
        disposition: "already_open",
        publicMessage: "An open report already exists for this category.",
      }
    }

    if (input.submissionType === "dispute") {
      const policy = competitionGovernanceActionPolicy(
        "under_review",
        "entrant_dispute",
      )
      await client.query(
        `
          update match_sets set
            counted_status = 'disputed', review_status = 'disputed',
            public_counted_reason = 'disputed',
            public_counted_explanation = $2,
            governance_changed_at = $3
          where id = $1
        `,
        [input.matchSetId, policy.publicExplanation, now],
      )
      await writeCompetitionAuditEvent(client, {
        actorUserId: input.reporterUserId,
        action: "entrant_dispute_opened",
        targetType: "match_set",
        targetId: input.matchSetId,
        beforeState: {},
        afterState: { countedStatus: "disputed", reviewStatus: "disputed" },
        reason: "Entrant submitted a result dispute.",
        publicExplanation: policy.publicExplanation,
        privateNote: privateDetail,
      })
    }

    return {
      submissionId: acceptedId,
      disposition: "created",
      publicMessage: reportMessage(input.submissionType),
    }
  })
}

export const assertAdminUser = async (
  pool: Queryable,
  userId: UserId,
): Promise<void> => {
  const result = await pool.query<{ is_admin: boolean }>(
    "select is_admin from users where id = $1",
    [userId],
  )
  if (result.rows[0]?.is_admin !== true) {
    throw new GovernanceInputError("Admin authorization is required.", {
      status: 403,
    })
  }
}

interface GovernanceTarget extends QueryResultRow {
  id: string
  status: MatchSetStatus
  ladder_season_id: string | null
  counted_status: LadderMatchSetCountedStatus
  review_status: "none" | "under_review" | "disputed" | "resolved"
  scoring_available: boolean
  match_count: number
  chronicle_count: number
}

export const applyCompetitionGovernanceAction = async (
  pool: Pool,
  input: {
    matchSetIds: string[]
    adminUserId: UserId
    action: CompetitionGovernanceAction
    category: CompetitionGovernanceCategory
    privateReason: string
    now?: Date | undefined
  },
): Promise<void> => {
  const ids = [...new Set(input.matchSetIds)].sort()
  if (
    !ids.length ||
    ids.length > 100 ||
    ids.length !== input.matchSetIds.length
  ) {
    throw new GovernanceInputError("Provide 1-100 unique MatchSet ids.")
  }
  const privateReason = input.privateReason.trim()
  if (privateReason.length < 3 || privateReason.length > 1000) {
    throw new GovernanceInputError(
      "A private reason of 3-1000 characters is required.",
    )
  }
  const policy = competitionGovernanceActionPolicy(input.action, input.category)
  const now = input.now ?? new Date()

  await withTransaction(pool, async (client) => {
    await assertAdminUser(client, input.adminUserId)
    const targets: GovernanceTarget[] = []
    for (const id of ids) {
      const result = await client.query<GovernanceTarget>(
        `
          select ms.id, ms.status, ms.ladder_season_id, ms.counted_status,
            ms.review_status, (ms.scoring is not null) as scoring_available,
            (select count(*)::integer from match_set_matches msm where msm.match_set_id = ms.id) as match_count,
            (select count(*)::integer from match_set_matches msm join chronicles c on c.match_id = msm.match_id where msm.match_set_id = ms.id) as chronicle_count
          from match_sets ms where ms.id = $1 for update of ms
        `,
        [id],
      )
      const target = result.rows[0]
      if (!target || !target.ladder_season_id) {
        throw new GovernanceInputError(
          "Every target must be a trial MatchSet.",
          {
            status: 404,
          },
        )
      }
      if (input.action === "counted") {
        const counted = classifyCompetitionCountedState({
          executionStatus: executionStatus(target.status),
          storedState: "counted",
          reviewState: "resolved",
          origin: "trial",
          expectedMatchCount: target.match_count,
          chronicleMatchCount: target.chronicle_count,
          scoringAvailable: target.scoring_available,
        })
        if (counted.state !== "counted") {
          throw new GovernanceInputError(
            "Complete scoring and replay evidence are required before counting this result.",
            { status: 409 },
          )
        }
      }
      targets.push(target)
    }

    for (const target of targets) {
      const reviewStatus =
        input.action === "under_review" ? "under_review" : "resolved"
      await client.query(
        `
          update match_sets set counted_status = $2, review_status = $3,
            public_counted_reason = $4, public_counted_explanation = $5,
            governance_changed_at = $6 where id = $1
        `,
        [
          target.id,
          input.action,
          reviewStatus,
          policy.publicReason ?? null,
          policy.publicExplanation,
          now,
        ],
      )
      await writeCompetitionAuditEvent(client, {
        actorUserId: input.adminUserId,
        action: "match_set_governance_changed",
        targetType: "match_set",
        targetId: target.id,
        beforeState: {
          countedStatus: target.counted_status,
          reviewStatus: target.review_status,
        },
        afterState: { countedStatus: input.action, reviewStatus },
        reason: privateReason,
        publicExplanation: policy.publicExplanation,
        privateNote: privateReason,
      })
    }
  })
}

export const flagMatchSetResult = async (
  pool: Pool,
  input: { matchSetId: string; userId: UserId; note: string },
): Promise<string> =>
  (
    await submitCompetitionReport(pool, {
      matchSetId: input.matchSetId,
      reporterUserId: input.userId,
      submissionType: "dispute",
      category: "result_integrity",
      privateDetail: input.note,
    })
  ).submissionId

export const markMatchSetGovernanceStatus = async (
  pool: Pool,
  input: {
    matchSetId: string
    adminUserId: UserId
    countedStatus: Extract<
      LadderMatchSetCountedStatus,
      "counted" | "invalid" | "non_competitive" | "non_counted"
    >
    publicReason?: LadderNonCountedReason | undefined
    reason: string
    publicExplanation: string
    privateNote?: string | undefined
  },
): Promise<void> => {
  const category: CompetitionGovernanceCategory =
    input.countedStatus === "counted"
      ? "review_resolved_counted"
      : input.countedStatus === "invalid"
        ? "result_invalid"
        : input.countedStatus === "non_competitive"
          ? "competition_policy"
          : "evidence_incomplete"
  await applyCompetitionGovernanceAction(pool, {
    matchSetIds: [input.matchSetId],
    adminUserId: input.adminUserId,
    action: input.countedStatus,
    category,
    privateReason: input.privateNote ?? input.reason,
  })
}

export const writeCompetitionAuditEvent = async (
  pool: Queryable,
  input: {
    actorUserId?: UserId | undefined
    action: string
    targetType: string
    targetId: string
    beforeState: unknown
    afterState: unknown
    reason: string
    publicExplanation?: string | undefined
    privateNote?: string | undefined
  },
): Promise<void> => {
  await pool.query(
    `
      insert into competition_audit_events (
        id, actor_user_id, action, target_type, target_id,
        before_state, after_state, reason, public_explanation, private_note
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      `audit:${randomUUID()}`,
      input.actorUserId ?? null,
      input.action,
      input.targetType,
      input.targetId,
      input.beforeState,
      input.afterState,
      input.reason,
      input.publicExplanation ?? null,
      input.privateNote ?? null,
    ],
  )
}
