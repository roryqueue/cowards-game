import type {
  AnalyticsReplayMomentType,
  ChronicleEventContext,
  ChronicleEventType,
  ChronicleProjection,
  FullBoardSnapshot,
  JsonValue,
  MatchId,
  MatchExecutionReplayEvidenceV1,
  MatchOutcome,
  PlayerId,
  SoldierInactivityExplanationDto,
} from "@cowards/spec"

export type ReplayViewMode = "public" | "owner"

export interface GetMatchReplayOptions {
  mode?: ReplayViewMode | undefined
  ownerPlayerId?: PlayerId | undefined
  requestedOwnerPlayerId?: PlayerId | undefined
  currentRequesterPlayerId?: PlayerId | undefined
  allowOwnerDebug?: boolean | undefined
  focus?: ReplayFocusRequest | undefined
}

export type ReplayUnavailableReason = "missing-chronicle" | "invalid-chronicle"
export type ReplayStatus = "ready" | "unavailable"

export interface ReplayTimelineEntryDto {
  sequence: number
  type: ChronicleEventType
  round?: number | undefined
  activation?: number | undefined
  cycle?: number | undefined
  label: string
  privacy: "public" | "owner"
  context: ChronicleEventContext
  payload: JsonValue
}

export interface ReplayStateDto {
  sequence: number
  board: FullBoardSnapshot
  outcome?: MatchOutcome | undefined
}

export interface ReplayMetadataDto {
  matchId: MatchId
  chronicleId: string
  hash: string
  schemaVersion: string
  eventCount: number
  snapshotCount: number
  outcome: JsonValue
  bottomPlayerId: PlayerId
  topPlayerId: PlayerId
  arenaVariantId: string
}

export interface ReplayFocusRequest {
  moment?: AnalyticsReplayMomentType | undefined
  sequence?: number | undefined
}

export interface ReplayFocusDto {
  requestedMoment?: AnalyticsReplayMomentType | undefined
  requestedSequence?: number | undefined
  resolvedSequence: number
  label: string
  fallback: "none" | "match_start" | "moment_not_found"
}

export interface ReplayReadyDto {
  status: "ready"
  mode: ReplayViewMode
  metadata: ReplayMetadataDto
  contract?:
    | Pick<
        MatchExecutionReplayEvidenceV1,
        "contractVersion" | "kind" | "matchId" | "lifecycle"
      >
    | undefined
  projection: ChronicleProjection
  timeline: ReplayTimelineEntryDto[]
  states: ReplayStateDto[]
  initialSequence: number
  focus?: ReplayFocusDto | undefined
  ownerPlayerId?: PlayerId | undefined
  ownerDebug?:
    | {
        soldierInactivityExplanations: SoldierInactivityExplanationDto[]
      }
    | undefined
}

export interface ReplayUnavailableDto {
  status: "unavailable"
  matchId: MatchId
  reason: ReplayUnavailableReason
  message: string
}

export type ReplayPageData = ReplayReadyDto | ReplayUnavailableDto
