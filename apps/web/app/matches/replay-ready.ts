import {
  buildSoldierInactivityExplanations,
  createReplay,
  projectOwnerChronicle,
  projectPublicChronicle,
} from "@cowards/replay"
import type { StoredChronicle } from "@cowards/persistence/chronicle-store"
import type {
  Chronicle,
  ChronicleEvent,
  ChronicleEventType,
  ChroniclePublicEvent,
} from "@cowards/spec"
import type {
  GetMatchReplayOptions,
  ReplayMetadataDto,
  ReplayPageData,
  ReplayReadyDto,
  ReplayTimelineEntryDto,
  ReplayViewMode,
} from "./types.js"

const eventLabels = {
  MATCH_STARTED: "Match start",
  ROUND_STARTED: "Round",
  STRATEGY_EVALUATED: "Strategy evaluated",
  ACTIVATION_STARTED: "Activation",
  ACTIVATION_SKIPPED: "Slot skipped",
  ACTIVATION_ENDED: "Slot ended",
  CYCLE_STARTED: "Cycle start",
  CYCLE_ENDED: "Cycle end",
  AWARENESS_GRID_OBSERVED: "Awareness",
  ACTION_EMITTED: "Action",
  MOVE_ADVANCED: "Move",
  MOVE_BLOCKED: "Blocked",
  TURN_RESOLVED: "Turn",
  PUSH_ATTEMPTED: "Push",
  PUSH_RESOLVED: "Push",
  PUSH_BLOCKED: "Blocked",
  BACKSTAB_RESOLVED: "Backstab",
  SOLDIER_STONED: "Stone",
  SOLDIER_FELL: "Fall",
  CONTRACTION_RESOLVED: "Contraction",
  MATCH_ENDED: "Outcome",
  RUNTIME_VIOLATION: "Runtime violation",
} satisfies Record<ChronicleEventType, string>

const payloadReason = (event: ChroniclePublicEvent): string | undefined =>
  event.payload !== null &&
  typeof event.payload === "object" &&
  !Array.isArray(event.payload) &&
  typeof event.payload.reason === "string"
    ? event.payload.reason
    : undefined

const eventLabel = (event: ChroniclePublicEvent): string => {
  if (
    event.type === "ROUND_STARTED" &&
    typeof event.context.roundNumber === "number"
  ) {
    return `Round ${event.context.roundNumber}`
  }
  if (event.type === "MOVE_BLOCKED") {
    return payloadReason(event) === "IMMEDIATE_REVERSAL"
      ? "No reverse"
      : "Blocked"
  }
  return eventLabels[event.type]
}

const buildTimeline = (
  projectedEvents: ChroniclePublicEvent[],
  originalEvents: ChronicleEvent[],
): ReplayTimelineEntryDto[] =>
  projectedEvents.map((event) => {
    const original = originalEvents[event.sequence]
    return {
      sequence: event.sequence,
      type: event.type,
      round: event.context.roundNumber,
      activation: event.context.activationIndex,
      cycle: event.context.cycleIndex,
      label: eventLabel(event),
      privacy: original?.privacy === "owner" ? "owner" : "public",
      context: event.context,
      payload: event.payload,
    }
  })

const projectionFailure = (
  matchId: ReplayMetadataDto["matchId"],
  message: string,
  source: "projection" | "validation" = "projection",
): ReplayPageData => ({
  status: "unavailable",
  matchId,
  reason: "invalid-chronicle",
  message: `[${source}] ${message}`,
})

export interface BuildReadyReplayFromChronicleInput {
  chronicle: Chronicle
  metadata: ReplayMetadataDto
  options?: GetMatchReplayOptions | undefined
}

export const trustedOwnerReplayOptions = (
  metadata: ReplayMetadataDto,
  options: GetMatchReplayOptions = {},
  authorizedRequestedOwners: readonly string[] = [],
): GetMatchReplayOptions => {
  if (options.allowOwnerDebug !== true) {
    return options
  }

  if (
    options.mode === "owner" &&
    options.ownerPlayerId &&
    authorizedRequestedOwners.includes(options.ownerPlayerId) &&
    (options.ownerPlayerId === metadata.bottomPlayerId ||
      options.ownerPlayerId === metadata.topPlayerId)
  ) {
    return options
  }

  const requestedOwner = options.requestedOwnerPlayerId
  if (
    requestedOwner &&
    authorizedRequestedOwners.includes(requestedOwner) &&
    (requestedOwner === metadata.bottomPlayerId ||
      requestedOwner === metadata.topPlayerId)
  ) {
    return {
      ...options,
      mode: "owner",
      ownerPlayerId: requestedOwner,
    }
  }

  return {
    ...options,
    mode: "public",
    ownerPlayerId: undefined,
  }
}

export const buildReadyReplayFromChronicle = ({
  chronicle,
  metadata,
  options = {},
}: BuildReadyReplayFromChronicleInput): ReplayPageData => {
  const mode: ReplayViewMode =
    options.allowOwnerDebug === true &&
    options.mode === "owner" &&
    options.ownerPlayerId
      ? "owner"
      : "public"
  const replayResult = createReplay(chronicle)

  if (!replayResult.ok) {
    const firstError = replayResult.errors[0]
    return projectionFailure(
      metadata.matchId,
      firstError === undefined
        ? "Chronicle could not be replayed."
        : `${firstError.code}: ${firstError.message}`,
      "validation",
    )
  }

  try {
    const projection =
      mode === "owner"
        ? projectOwnerChronicle(chronicle, options.ownerPlayerId!)
        : projectPublicChronicle(chronicle)
    const states = [...replayResult.replay.iterateReplay()].map((entry) => ({
      sequence: entry.sequence,
      board: entry.state.board,
      ...(entry.state.outcome === undefined
        ? {}
        : { outcome: entry.state.outcome }),
    }))
    const ownerDebug =
      mode === "owner" && options.ownerPlayerId
        ? {
            soldierInactivityExplanations: buildSoldierInactivityExplanations({
              chronicle,
              ownerPlayerId: options.ownerPlayerId,
            }),
          }
        : undefined

    return {
      status: "ready",
      mode,
      metadata,
      projection,
      timeline: buildTimeline(projection.events, chronicle.events),
      states,
      initialSequence: 0,
      ...(mode === "owner" && options.ownerPlayerId
        ? { ownerPlayerId: options.ownerPlayerId }
        : {}),
      ...(ownerDebug === undefined ? {} : { ownerDebug }),
    } satisfies ReplayReadyDto
  } catch (error) {
    return projectionFailure(
      metadata.matchId,
      error instanceof Error ? error.message : "Chronicle projection failed.",
    )
  }
}

export const buildReadyReplayFromStoredChronicle = (
  stored: StoredChronicle,
  options: GetMatchReplayOptions,
  authorizedRequestedOwners: readonly string[] = [],
): ReplayPageData => {
  const metadata = {
    matchId: stored.metadata.matchId,
    chronicleId: stored.metadata.id,
    hash: stored.metadata.hash,
    schemaVersion: stored.metadata.schemaVersion,
    eventCount: stored.metadata.eventCount,
    snapshotCount: stored.metadata.snapshotCount,
    outcome: stored.metadata.outcome,
    bottomPlayerId: stored.metadata.bottomPlayerId,
    topPlayerId: stored.metadata.topPlayerId,
    arenaVariantId: stored.metadata.arenaVariantId,
  }

  return buildReadyReplayFromChronicle({
    chronicle: stored.artifact,
    metadata,
    options: trustedOwnerReplayOptions(
      metadata,
      options,
      authorizedRequestedOwners,
    ),
  })
}
