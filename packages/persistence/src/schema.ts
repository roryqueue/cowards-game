export const MATCH_STATUSES = [
  "pending",
  "running",
  "complete",
  "failed_system",
  "blocked",
] as const

export const MATCH_SET_STATUSES = [
  "pending",
  "running",
  "complete",
  "failed_system",
  "blocked",
  "degraded",
] as const

export const MATCH_JOB_STATUSES = [
  "queued",
  "running",
  "complete",
  "failed_system",
] as const

export type MatchStatus = (typeof MATCH_STATUSES)[number]
export type MatchSetStatus = (typeof MATCH_SET_STATUSES)[number]
export type MatchJobStatus = (typeof MATCH_JOB_STATUSES)[number]

export const DEFAULT_MAX_JOB_ATTEMPTS = 3
