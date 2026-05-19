import { randomUUID } from "node:crypto"
import type {
  LadderMatchSetCountedStatus,
  LadderNonCountedReason,
  UserId,
} from "@cowards/spec"
import type { Pool } from "pg"

export class GovernanceInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GovernanceInputError"
  }
}

export const flagMatchSetResult = async (
  pool: Pool,
  input: {
    matchSetId: string
    userId: UserId
    note: string
  },
): Promise<string> => {
  const note = input.note.trim()
  if (note.length < 3 || note.length > 500) {
    throw new GovernanceInputError("Dispute note must be 3-500 characters.")
  }
  const authorization = await pool.query<{
    is_admin: boolean | null
    is_entrant: boolean
  }>(
    `
      select
        (select is_admin from users where id = $2) as is_admin,
        exists (
          select 1
          from competition_entrants
          where match_set_id = $1
            and owner_user_id = $2
        ) as is_entrant
    `,
    [input.matchSetId, input.userId],
  )
  const authorized = authorization.rows[0]
  if (!authorized?.is_admin && !authorized?.is_entrant) {
    throw new GovernanceInputError(
      "Only entrants or admins can flag this result.",
    )
  }
  const flagId = `result-flag:${randomUUID()}`
  const result = await pool.query<{ id: string }>(
    `
      insert into result_flags (id, match_set_id, user_id, note)
      values ($1, $2, $3, $4)
      on conflict (match_set_id, user_id) do update
      set note = excluded.note,
          status = 'open'
      returning id
    `,
    [flagId, input.matchSetId, input.userId, note],
  )
  await pool.query(
    `
      update match_sets
      set review_status = 'under_review',
          public_counted_reason = 'governance_hold',
          public_counted_explanation = 'Result has been flagged for review.'
      where id = $1
    `,
    [input.matchSetId],
  )
  await writeCompetitionAuditEvent(pool, {
    actorUserId: input.userId,
    action: "result_flagged",
    targetType: "match_set",
    targetId: input.matchSetId,
    beforeState: {},
    afterState: { reviewStatus: "under_review" },
    reason: "User flagged result.",
    publicExplanation: "Result has been flagged for review.",
    privateNote: note,
  })
  return result.rows[0]?.id ?? flagId
}

export const assertAdminUser = async (
  pool: Pool,
  userId: UserId,
): Promise<void> => {
  const result = await pool.query<{ is_admin: boolean }>(
    "select is_admin from users where id = $1",
    [userId],
  )
  if (result.rows[0]?.is_admin !== true) {
    throw new GovernanceInputError("Admin authorization is required.")
  }
}

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
  await assertAdminUser(pool, input.adminUserId)
  if (!input.reason.trim() || !input.publicExplanation.trim()) {
    throw new GovernanceInputError(
      "Reason and public explanation are required.",
    )
  }
  const before = await pool.query<{
    counted_status: LadderMatchSetCountedStatus
    public_counted_reason: LadderNonCountedReason | null
    public_counted_explanation: string | null
  }>(
    `
      select counted_status, public_counted_reason, public_counted_explanation
      from match_sets
      where id = $1
    `,
    [input.matchSetId],
  )
  const beforeRow = before.rows[0]
  if (!beforeRow) {
    throw new GovernanceInputError(`MatchSet not found: ${input.matchSetId}`)
  }
  await pool.query(
    `
      update match_sets
      set counted_status = $2,
          public_counted_reason = $3,
          public_counted_explanation = $4,
          review_status = case when $2 = 'counted' then 'resolved' else review_status end
      where id = $1
    `,
    [
      input.matchSetId,
      input.countedStatus,
      input.publicReason ?? null,
      input.publicExplanation,
    ],
  )
  await writeCompetitionAuditEvent(pool, {
    actorUserId: input.adminUserId,
    action: "match_set_governance_changed",
    targetType: "match_set",
    targetId: input.matchSetId,
    beforeState: {
      countedStatus: beforeRow.counted_status,
      publicReason: beforeRow.public_counted_reason,
      publicExplanation: beforeRow.public_counted_explanation,
    },
    afterState: {
      countedStatus: input.countedStatus,
      publicReason: input.publicReason ?? null,
      publicExplanation: input.publicExplanation,
    },
    reason: input.reason,
    publicExplanation: input.publicExplanation,
    privateNote: input.privateNote,
  })
}

export const writeCompetitionAuditEvent = async (
  pool: Pool,
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
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
