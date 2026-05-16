import { randomUUID } from "node:crypto"
import type { JsonValue, MatchId } from "@cowards/spec"
import type { Pool } from "pg"
import { withTransaction } from "./db.js"

export interface ClaimMatchJobInput {
  workerId: string
  leaseMs?: number
  now?: Date
}

export interface ClaimedMatchJob {
  jobId: string
  matchId: MatchId
  attemptNumber: number
  leaseToken: string
  leaseExpiresAt: Date
}

export const DEFAULT_LEASE_MS = 30_000

export const CLAIM_NEXT_MATCH_JOB_SQL = `
  select id, match_id, attempts
  from match_jobs
  where
    (status = 'queued' and run_after <= $1)
    or (status = 'running' and lease_expires_at < $1)
  order by run_after asc, created_at asc
  for update skip locked
  limit 1
`

export const createLeaseToken = (): string => randomUUID()

export const shouldExhaustRetries = (input: {
  attempts: number
  maxAttempts: number
  retryable: boolean
}): boolean => !input.retryable || input.attempts >= input.maxAttempts

export const claimNextMatchJob = async (
  pool: Pool,
  input: ClaimMatchJobInput,
): Promise<ClaimedMatchJob | null> => {
  const now = input.now ?? new Date()
  const leaseMs = input.leaseMs ?? DEFAULT_LEASE_MS
  const leaseToken = createLeaseToken()
  const leaseExpiresAt = new Date(now.getTime() + leaseMs)

  return withTransaction(pool, async (client) => {
    const claim = await client.query<{
      id: string
      match_id: MatchId
      attempts: number
    }>(CLAIM_NEXT_MATCH_JOB_SQL, [now])
    const row = claim.rows[0]
    if (!row) {
      return null
    }
    const attemptNumber = row.attempts + 1
    await client.query(
      `
        update match_jobs
        set status = 'running',
            worker_id = $1,
            lease_token = $2,
            lease_expires_at = $3,
            attempts = $4,
            updated_at = now()
        where id = $5
      `,
      [input.workerId, leaseToken, leaseExpiresAt, attemptNumber, row.id],
    )
    await client.query("update matches set status = 'running' where id = $1", [
      row.match_id,
    ])
    await client.query(
      `
        insert into match_job_attempts (
          id, job_id, attempt_number, worker_id, status
        )
        values ($1, $2, $3, $4, 'running')
      `,
      [
        `match-job-attempt:${row.id}:${attemptNumber}`,
        row.id,
        attemptNumber,
        input.workerId,
      ],
    )
    return {
      jobId: row.id,
      matchId: row.match_id,
      attemptNumber,
      leaseToken,
      leaseExpiresAt,
    }
  })
}

export const heartbeatMatchJob = async (
  pool: Pool,
  input: { jobId: string; leaseToken: string; leaseMs?: number },
): Promise<boolean> => {
  const leaseExpiresAt = new Date(
    Date.now() + (input.leaseMs ?? DEFAULT_LEASE_MS),
  )
  const result = await pool.query(
    `
      update match_jobs
      set lease_expires_at = $1,
          updated_at = now()
      where id = $2 and lease_token = $3 and status = 'running'
    `,
    [leaseExpiresAt, input.jobId, input.leaseToken],
  )
  return (result.rowCount ?? 0) > 0
}

export const recordAttemptFailure = async (
  pool: Pool,
  input: {
    jobId: string
    leaseToken: string
    errorClass: string
    errorMessage: string
    retryable: boolean
    details?: JsonValue
  },
): Promise<"retry_queued" | "failed_system"> =>
  withTransaction(pool, async (client) => {
    const job = await client.query<{
      attempts: number
      max_attempts: number
      match_id: MatchId
    }>(
      `
        select attempts, max_attempts, match_id
        from match_jobs
        where id = $1 and lease_token = $2
        for update
      `,
      [input.jobId, input.leaseToken],
    )
    const row = job.rows[0]
    if (!row) {
      throw new Error("Cannot record failure for unclaimed job")
    }
    const exhausted = shouldExhaustRetries({
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      retryable: input.retryable,
    })
    await client.query(
      `
        update match_job_attempts
        set finished_at = now(),
            status = 'failed_system',
            error_class = $1,
            error_message = $2,
            retryable = $3,
            details = $4
        where job_id = $5 and attempt_number = $6
      `,
      [
        input.errorClass,
        input.errorMessage,
        input.retryable,
        input.details ?? {},
        input.jobId,
        row.attempts,
      ],
    )
    if (exhausted) {
      await client.query(
        `
          update match_jobs
          set status = 'failed_system',
              updated_at = now()
          where id = $1
        `,
        [input.jobId],
      )
      await client.query(
        `
          update matches
          set status = 'failed_system',
              failure_category = 'SYSTEM',
              failure_message = $1,
              completed_at = now()
          where id = $2
        `,
        [input.errorMessage, row.match_id],
      )
      return "failed_system"
    }
    await client.query(
      `
        update match_jobs
        set status = 'queued',
            worker_id = null,
            lease_token = null,
            lease_expires_at = null,
            updated_at = now()
        where id = $1
      `,
      [input.jobId],
    )
    return "retry_queued"
  })
