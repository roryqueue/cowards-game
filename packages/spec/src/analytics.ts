import type {
  JsonValue,
  MatchId,
  MatchSetId,
  PlayerId,
  StrategyRevisionId,
  UserId,
} from "./types.js"
import {
  PUBLIC_OUTPUT_FORBIDDEN_FIELDS,
  assertPublicOutputLeakSafe,
} from "./public-output-privacy.js"

export const ANALYTICS_PROFILE_SCHEMA_VERSION = "analytics-profile-v1.6"
export const ANALYTICS_RUN_SCHEMA_VERSION = "analytics-run-v1.6"
export const ANALYTICS_SUMMARY_SCHEMA_VERSION = "analytics-summary-v1.6"

export const ANALYTICS_EVIDENCE_BANDS = [
  "strong",
  "thin",
  "degraded_non_counted",
  "system_failed",
] as const

export type AnalyticsEvidenceBand = (typeof ANALYTICS_EVIDENCE_BANDS)[number]

export const ANALYTICS_REPLAY_MOMENT_TYPES = [
  "BACKSTAB",
  "CONTRACTION",
  "NO_ADVANCE_CLEANUP",
  "FALL",
  "DECISIVE_PUSH",
  "LATE_CYCLE_STABILIZATION",
] as const

export type AnalyticsReplayMomentType =
  (typeof ANALYTICS_REPLAY_MOMENT_TYPES)[number]

export const ANALYTICS_REPLAY_FALLBACK_STATES = [
  "available",
  "match_start_fallback",
  "replay_unavailable",
  "moment_not_found",
] as const

export type AnalyticsReplayFallbackState =
  (typeof ANALYTICS_REPLAY_FALLBACK_STATES)[number]

export const ANALYTICS_COMPATIBILITY_MISMATCH_CODES = [
  "profile_schema_version",
  "candidate_revision",
  "opponent_revision",
  "preset",
  "seed_order",
  "mirror_policy",
  "scoring_policy",
  "rule_version",
  "chronicle_version",
  "runtime_adapter",
  "runtime_version",
  "matrix_order",
] as const

export type AnalyticsCompatibilityMismatchCode =
  (typeof ANALYTICS_COMPATIBILITY_MISMATCH_CODES)[number]

export const ANALYTICS_FORBIDDEN_PUBLIC_KEYS = PUBLIC_OUTPUT_FORBIDDEN_FIELDS

export interface AnalyticsStrategySnapshot {
  revisionId: StrategyRevisionId
  label: string
  sourceHash: string
  tags: string[]
}

export interface AnalyticsOpponentSnapshot extends AnalyticsStrategySnapshot {
  opponentId: string
  tier: "starter" | "advanced" | "workshop"
  archetypeTags: string[]
}

export interface AnalyticsCompatibilityKey {
  profileSchemaVersion: typeof ANALYTICS_PROFILE_SCHEMA_VERSION
  candidateRevisionIds: StrategyRevisionId[]
  opponentRevisionIds: StrategyRevisionId[]
  presetId: string
  seeds: string[]
  mirrorSides: boolean
  scoringPolicyVersion: string
  ruleVersion: string
  chronicleVersion: string
  runtimeAdapter: string
  runtimeVersion: string
  matrixOrder: string[]
}

export interface AnalyticsCompatibilitySummary {
  hash: string
  key: AnalyticsCompatibilityKey
  equivalent: boolean
  mismatches: AnalyticsCompatibilityMismatchCode[]
}

export interface AnalyticsReplayReference {
  matchId: MatchId
  momentType: AnalyticsReplayMomentType
  sequence: number
  label: string
  side: "bottom" | "top" | "neutral"
  fallbackState: AnalyticsReplayFallbackState
  href: string
}

export interface AnalyticsEvidenceSummary {
  band: AnalyticsEvidenceBand
  counted: boolean
  completedCount: number
  replayBackedCount: number
  totalCount: number
  failureCount: number
  systemFailureCount: number
  notes: string[]
}

export interface AnalyticsMatchupRecord {
  candidate: AnalyticsStrategySnapshot
  opponent: AnalyticsOpponentSnapshot
  matchSetId: MatchSetId
  matchIds: MatchId[]
  wins: number
  losses: number
  draws: number
  points: number
  failureCount: number
  sideBias: "bottom" | "top" | "balanced" | "insufficient"
  evidence: AnalyticsEvidenceSummary
  replayReferences: AnalyticsReplayReference[]
}

export interface AnalyticsGauntletProfileDefinition {
  profileSchemaVersion: typeof ANALYTICS_PROFILE_SCHEMA_VERSION
  candidates: AnalyticsStrategySnapshot[]
  opponents: AnalyticsOpponentSnapshot[]
  presetId: string
  seeds: string[]
  mirrorSides: boolean
  scoringPolicyVersion: string
  ruleVersion: string
  chronicleVersion: string
  runtimeAdapter: string
  runtimeVersion: string
  matrixOrder: string[]
}

export interface AnalyticsGauntletProfile {
  id: string
  ownerUserId: UserId
  name: string
  notes?: string | undefined
  status: "active" | "archived"
  createdAt: string
  updatedAt: string
  definition: AnalyticsGauntletProfileDefinition
  compatibility: AnalyticsCompatibilitySummary
}

export interface AnalyticsGauntletRunSummary {
  summarySchemaVersion: typeof ANALYTICS_SUMMARY_SCHEMA_VERSION
  profileId: string
  runId: string
  ownerUserId: UserId
  lifecycleStatus: "queued" | "running" | "complete" | "blocked_preflight"
  compatibility: AnalyticsCompatibilitySummary
  totals: {
    wins: number
    losses: number
    draws: number
    points: number
    matchups: number
    completedMatches: number
    failedMatches: number
  }
  matchupRecords: AnalyticsMatchupRecord[]
  provenance: {
    matchSetIds: MatchSetId[]
    generatedAt: string
    runSchemaVersion: typeof ANALYTICS_RUN_SCHEMA_VERSION
  }
  privacy: {
    ownerSafe: true
    publicFieldsExcluded: string[]
  }
  metadata?: JsonValue | undefined
}

export interface AnalyticsGauntletProfileRun {
  id: string
  profileId: string
  ownerUserId: UserId
  runIndex: number
  createdAt: string
  completedAt?: string | undefined
  notes?: string | undefined
  summary: AnalyticsGauntletRunSummary
}

export interface WorkshopAnalyticsSnapshot {
  profiles: AnalyticsGauntletProfile[]
  runs: AnalyticsGauntletProfileRun[]
  selectedProfileId: string
  selectedRunId: string
}

export interface AnalyticsExportEnvelope {
  exportedBy: UserId | PlayerId
  exportedAt: string
  format: "json" | "csv"
  summarySchemaVersion: typeof ANALYTICS_SUMMARY_SCHEMA_VERSION
  profile: AnalyticsGauntletProfile
  runs: AnalyticsGauntletProfileRun[]
}

export const evidenceBandRank = (
  band: AnalyticsEvidenceBand,
): 0 | 1 | 2 | 3 => {
  switch (band) {
    case "strong":
      return 0
    case "thin":
      return 1
    case "degraded_non_counted":
      return 2
    case "system_failed":
      return 3
  }
}

export const deriveAnalyticsEvidenceBand = (input: {
  counted: boolean
  completedCount: number
  replayBackedCount: number
  totalCount: number
  systemFailureCount: number
  degraded: boolean
  strongEvidenceThreshold: number
}): AnalyticsEvidenceBand => {
  if (input.systemFailureCount > 0) {
    return "system_failed"
  }
  if (input.degraded || !input.counted) {
    return "degraded_non_counted"
  }
  if (
    input.completedCount >= input.strongEvidenceThreshold &&
    input.replayBackedCount >= input.strongEvidenceThreshold &&
    input.totalCount >= input.strongEvidenceThreshold
  ) {
    return "strong"
  }
  return "thin"
}

export const assertAnalyticsPublicSummaryLeakSafe = (value: unknown): void => {
  assertPublicOutputLeakSafe(value, "Analytics summary")
}
