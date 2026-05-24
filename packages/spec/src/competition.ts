import type {
  ArenaVariantId,
  JsonValue,
  MatchId,
  MatchSetId,
  StrategyRevisionId,
  UserId,
} from "./types.js"
import type { StrategyRuntimeMetadata } from "./runtime.js"
import { assertPublicOutputLeakSafe } from "./public-output-privacy.js"

export const COMPETITION_PRESET_IDS = [
  "smoke-exhibition-v1",
  "standard-exhibition-v1",
] as const

export type CompetitionPresetId = (typeof COMPETITION_PRESET_IDS)[number]

export type CompetitionVisibility = "public"

export type CompetitionStatus =
  | "accepted"
  | "queued"
  | "running"
  | "complete"
  | "degraded"
  | "failed"

export const TRIAL_LADDER_SEASON_STATUSES = [
  "draft",
  "open",
  "scheduling",
  "active",
  "completed",
  "archived",
] as const

export type TrialLadderSeasonStatus =
  (typeof TRIAL_LADDER_SEASON_STATUSES)[number]

export const TRIAL_LADDER_ENTRY_STATUSES = [
  "active",
  "withdrawn",
  "suspended",
  "invalidated",
  "stale",
] as const

export type TrialLadderEntryStatus =
  (typeof TRIAL_LADDER_ENTRY_STATUSES)[number]

export type LadderMatchSetCountedStatus =
  | "pending"
  | "counted"
  | "retrying"
  | "under_review"
  | "invalid"
  | "non_competitive"
  | "non_counted"

export type LadderNonCountedReason =
  | "system_failure"
  | "incomplete_evidence"
  | "invalid_result"
  | "governance_hold"
  | "non_counted"

export interface TrialLadderPolicyDto {
  oneEntryPerUser: true
  replacementPolicy: "next-season-only"
  staleRevisionPolicy: string
  standingsReset: true
  noPermanentRatings: true
  minimumEntries: number
  targetPodSize: number
}

export interface TrialLadderEntrySnapshot extends CompetitionEntrantSnapshot {
  seasonId: string
  entryId: string
  status: TrialLadderEntryStatus
  strategyName: string
  strategyDescription?: string | undefined
  tags: string[]
}

export interface PublicTrialLadderSeasonDto {
  seasonId: string
  slug: string
  name: string
  status: TrialLadderSeasonStatus
  statusLabel: string
  description?: string | undefined
  seasonSeed: string
  openedAt?: string | undefined
  closedAt?: string | undefined
  scheduledAt?: string | undefined
  completedAt?: string | undefined
  archivedAt?: string | undefined
  policy: TrialLadderPolicyDto
  entries: TrialLadderEntrySnapshot[]
  standings: PublicStandingDto[]
  matchSets: PublicLadderMatchSetSummaryDto[]
  publication: {
    publicEntries: true
    publicStandings: true
    publicReplayEvidence: true
    privateFieldsExcluded: string[]
  }
}

export interface PublicLadderMatchSetSummaryDto {
  matchSetId: MatchSetId
  seasonId: string
  scheduleRunId?: string | undefined
  podIndex?: number | undefined
  status: CompetitionStatus
  countedStatus: LadderMatchSetCountedStatus
  publicReason?: LadderNonCountedReason | undefined
  publicExplanation?: string | undefined
  entrantIds: string[]
  replayHref?: string | undefined
  resultHref: string
}

export interface PublicPlayerProfileDto {
  handle: string
  displayName: string
  strategies: PublicStrategyCardDto[]
  ladderHistory: Array<{
    seasonId: string
    seasonName: string
    entryStatus: TrialLadderEntryStatus
    points: number
    rank?: number | undefined
  }>
  results: PublicLadderMatchSetSummaryDto[]
}

export interface PublicStrategyCardDto {
  strategyId: string
  strategyRevisionId: StrategyRevisionId
  name: string
  description?: string | undefined
  tags: string[]
  authorHandle: string
  sourceHash: string
  sourceBytes: number
  runtime: PublicStrategyRuntimeMetadata
  engineCompatibility: CompetitionEntrantSnapshot["engineCompatibility"]
  validationStatus: "valid" | "invalid"
  starterLineage?: {
    starterId: string
    starterName: string
    starterVersion: string
    sourceHash: string
  }
  advancedLineage?: {
    advancedId: string
    advancedName: string
    advancedVersion: string
    archetype: string
    sourceHash: string
  }
  record: {
    wins: number
    losses: number
    draws: number
    points: number
  }
  resultLinks: string[]
  replayLinks: string[]
}

export type PublicStrategyRuntimeMetadata = Omit<
  StrategyRuntimeMetadata,
  "limits"
>

export interface CompetitionScoringPolicy {
  id: "exhibition-points-v1"
  version: "v1"
  winPoints: 3
  drawPoints: 1
  lossPoints: 0
  strategyFailurePenaltyPoints: -1
}

export const EXHIBITION_SCORING_POLICY_V1 = {
  id: "exhibition-points-v1",
  version: "v1",
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  strategyFailurePenaltyPoints: -1,
} as const satisfies CompetitionScoringPolicy

export interface CompetitionPreset {
  id: CompetitionPresetId
  version: "v1"
  label: string
  matchSetPresetId: "smoke-v1" | "standard-v1"
  entrantCount: {
    min: 2
    max: 8
  }
  visibility: CompetitionVisibility
  mirroredPairwise: boolean
  scoringPolicy: CompetitionScoringPolicy
}

export const COMPETITION_PRESETS = [
  {
    id: "smoke-exhibition-v1",
    version: "v1",
    label: "Smoke Exhibition",
    matchSetPresetId: "smoke-v1",
    entrantCount: { min: 2, max: 8 },
    visibility: "public",
    mirroredPairwise: true,
    scoringPolicy: EXHIBITION_SCORING_POLICY_V1,
  },
  {
    id: "standard-exhibition-v1",
    version: "v1",
    label: "Standard Exhibition",
    matchSetPresetId: "standard-v1",
    entrantCount: { min: 2, max: 8 },
    visibility: "public",
    mirroredPairwise: true,
    scoringPolicy: EXHIBITION_SCORING_POLICY_V1,
  },
] as const satisfies readonly CompetitionPreset[]

export const getCompetitionPreset = (
  presetId: CompetitionPresetId,
): CompetitionPreset => {
  const preset = COMPETITION_PRESETS.find(
    (candidate) => candidate.id === presetId,
  )
  if (!preset) {
    throw new Error(`Unknown Competition preset: ${presetId}`)
  }
  return {
    id: preset.id,
    version: preset.version,
    label: preset.label,
    matchSetPresetId: preset.matchSetPresetId,
    entrantCount: { ...preset.entrantCount },
    visibility: preset.visibility,
    mirroredPairwise: preset.mirroredPairwise,
    scoringPolicy: { ...preset.scoringPolicy },
  }
}

export interface CompetitionEntrantSnapshot {
  entrantId: string
  entrantIndex: number
  strategyRevisionId: StrategyRevisionId
  ownerUserId: UserId
  ownerHandle: string
  displayLabel: string
  sourceHash: string
  sourceBytes: number
  runtime: StrategyRuntimeMetadata
  engineCompatibility: {
    spec: string
    engine: string
  }
  lockedAt: string
}

export interface PublicCompetitionEntrantSnapshot extends Omit<
  CompetitionEntrantSnapshot,
  "runtime"
> {
  runtime: PublicStrategyRuntimeMetadata
}

export type PublicPenaltyReason =
  | "strategy_failure"
  | "system_failure"
  | "invalid_result"
  | "no_result"

export interface PublicScorePenaltyDto {
  matchId?: MatchId | undefined
  reason: PublicPenaltyReason
  points: number
}

export interface PublicStandingDto {
  rank: number
  entrantId: string
  strategyRevisionId: StrategyRevisionId
  ownerHandle: string
  displayLabel: string
  sourceHash: string
  points: number
  wins: number
  draws: number
  losses: number
  penalties: PublicScorePenaltyDto[]
  survivingSoldiers: number
  survivalTurns: number
  tieBreakerPath: string[]
}

export interface PublicMatchEvidenceDto {
  matchId: MatchId
  entrants: {
    bottom: string
    top: string
  }
  status: "pending" | "running" | "complete" | "failed_system" | "blocked"
  replayAvailable: boolean
  chronicleHash?: string | undefined
  publicReason?: PublicPenaltyReason | undefined
  arenaVariantId?: ArenaVariantId | undefined
}

export interface PublicMatchSetResultDto {
  matchSetId: MatchSetId
  preset: {
    id: CompetitionPresetId
    version: "v1"
    label: string
  }
  status: CompetitionStatus
  visibility: CompetitionVisibility
  scoringPolicy: CompetitionScoringPolicy
  entrants: PublicCompetitionEntrantSnapshot[]
  standings: PublicStandingDto[]
  matches: PublicMatchEvidenceDto[]
  provenance: {
    matchSetId: MatchSetId
    presetId: CompetitionPresetId
    scoringPolicyVersion: string
    entrantSnapshotIds: string[]
    chronicleHashes: string[]
  }
  publication: {
    publicResults: true
    publicReplayEvidence: true
    privateFieldsExcluded: string[]
  }
  metadata?: JsonValue | undefined
}

export const assertPublicMatchSetResultLeakSafe = (value: unknown): void => {
  assertPublicOutputLeakSafe(value, "Public MatchSet result")
}
