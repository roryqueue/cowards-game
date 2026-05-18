import type {
  ChronicleEventContext,
  ChronicleEventType,
  ChronicleProjection,
  FullBoardSnapshot,
  JsonValue,
  MatchId,
  MatchOutcome,
  PlayerId,
  SoldierInactivityExplanationDto,
} from "@cowards/spec"

export type ReplayViewMode = "public" | "owner"

export interface GetMatchReplayOptions {
  mode?: ReplayViewMode | undefined
  ownerPlayerId?: PlayerId | undefined
  allowOwnerDebug?: boolean | undefined
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

export interface ReplayReadyDto {
  status: "ready"
  mode: ReplayViewMode
  metadata: ReplayMetadataDto
  projection: ChronicleProjection
  timeline: ReplayTimelineEntryDto[]
  states: ReplayStateDto[]
  initialSequence: 0
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
