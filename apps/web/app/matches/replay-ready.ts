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
import {
  BOTTOM_STARTING_POSITIONS,
  INITIAL_BOUNDS,
  TOP_STARTING_POSITIONS,
} from "@cowards/spec"
import type {
  GetMatchReplayOptions,
  ReplayFocusDto,
  ReplayFocusRequest,
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

const isInsideBounds = (
  position: { x: number; y: number },
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
): boolean =>
  position.x >= bounds.minX &&
  position.x <= bounds.maxX &&
  position.y >= bounds.minY &&
  position.y <= bounds.maxY

const canonicalArenaVariantIds = new Set([
  "arena:smoke:v1",
  "arena:standard-cross:v1",
  "arena:open-field:v1",
])

const samePosition = (
  left: { x: number; y: number } | null | undefined,
  right: { x: number; y: number },
): boolean => left?.x === right.x && left.y === right.y

const canonicalStartError = (
  state: ReplayReadyDto["states"][number] | undefined,
  arenaVariantId: string,
): string | null => {
  if (!state || !canonicalArenaVariantIds.has(arenaVariantId)) {
    return null
  }
  const { bounds, soldiers } = state.board
  if (
    bounds.minX !== INITIAL_BOUNDS.minX ||
    bounds.maxX !== INITIAL_BOUNDS.maxX ||
    bounds.minY !== INITIAL_BOUNDS.minY ||
    bounds.maxY !== INITIAL_BOUNDS.maxY
  ) {
    return "Replay board canonical Match start has non-canonical bounds."
  }
  const bottom = soldiers.filter((soldier) => soldier.ownerPlayerId === "bottom")
  const top = soldiers.filter((soldier) => soldier.ownerPlayerId === "top")
  if (bottom.length !== 8 || top.length !== 8 || soldiers.length !== 16) {
    return "Replay board canonical Match start must contain 16 Soldiers."
  }
  for (const [index, position] of BOTTOM_STARTING_POSITIONS.entries()) {
    const soldier = bottom.find(
      (candidate) => candidate.id === `bottom-soldier-${index + 1}`,
    )
    if (
      !soldier ||
      soldier.status !== "ACTIVE" ||
      soldier.facing !== "UP" ||
      !samePosition(soldier.position, position)
    ) {
      return "Replay board canonical starting position mismatch."
    }
  }
  for (const [index, position] of TOP_STARTING_POSITIONS.entries()) {
    const soldier = top.find(
      (candidate) => candidate.id === `top-soldier-${index + 1}`,
    )
    if (
      !soldier ||
      soldier.status !== "ACTIVE" ||
      soldier.facing !== "DOWN" ||
      !samePosition(soldier.position, position)
    ) {
      return "Replay board canonical starting position mismatch."
    }
  }
  return null
}

const replayBoardRealismError = (
  states: ReplayReadyDto["states"],
  arenaVariantId: string,
): string | null => {
  const startError = canonicalStartError(states[0], arenaVariantId)
  if (startError) {
    return startError
  }
  for (const state of states) {
    if (
      state.board.bounds.minX > state.board.bounds.maxX ||
      state.board.bounds.minY > state.board.bounds.maxY
    ) {
      return `Replay board has invalid bounds at sequence ${state.sequence}.`
    }
    const visibleCells = new Map<string, string>()
    for (const soldier of state.board.soldiers) {
      if (soldier.status === "FALLEN" && soldier.position) {
        return `Replay board contains a visible fallen Soldier at sequence ${state.sequence}.`
      }
      if (soldier.status !== "FALLEN" && !soldier.position) {
        return `Replay board contains a visible Soldier without a position at sequence ${state.sequence}.`
      }
      if (
        soldier.position &&
        !isInsideBounds(soldier.position, state.board.bounds)
      ) {
        return `Replay board contains an out-of-bounds Soldier at sequence ${state.sequence}.`
      }
      if (soldier.position) {
        const cellKey = `${soldier.position.x}:${soldier.position.y}`
        const previous = visibleCells.get(cellKey)
        if (previous) {
          return `Replay board contains overlapping visible pieces at sequence ${state.sequence}.`
        }
        visibleCells.set(cellKey, soldier.id)
      }
    }
    for (const terrainStone of state.board.terrainStones) {
      if (!isInsideBounds(terrainStone, state.board.bounds)) {
        return `Replay board contains out-of-bounds terrain at sequence ${state.sequence}.`
      }
      if (visibleCells.has(`${terrainStone.x}:${terrainStone.y}`)) {
        return `Replay board contains overlapping terrain and Soldier at sequence ${state.sequence}.`
      }
    }
  }
  return null
}

const momentEventTypes = {
  BACKSTAB: ["BACKSTAB_RESOLVED"],
  CONTRACTION: ["CONTRACTION_RESOLVED"],
  NO_ADVANCE_CLEANUP: ["MOVE_BLOCKED"],
  FALL: ["SOLDIER_FELL"],
  DECISIVE_PUSH: ["PUSH_RESOLVED"],
  LATE_CYCLE_STABILIZATION: ["CYCLE_ENDED"],
} satisfies Record<
  NonNullable<ReplayFocusRequest["moment"]>,
  ChronicleEventType[]
>

const entryMatchesMoment = (
  entry: ReplayTimelineEntryDto,
  moment: ReplayFocusRequest["moment"],
): boolean => {
  if (!moment) {
    return true
  }
  const targetTypes: readonly ChronicleEventType[] = momentEventTypes[moment]
  if (!targetTypes.includes(entry.type)) {
    return false
  }
  if (moment === "NO_ADVANCE_CLEANUP") {
    return JSON.stringify(entry.payload).includes("IMMEDIATE_REVERSAL")
  }
  if (moment === "LATE_CYCLE_STABILIZATION") {
    return entry.cycle !== undefined && entry.cycle >= 10
  }
  return true
}

const latestTimelineSequence = (
  timeline: readonly ReplayTimelineEntryDto[],
): number => timeline.at(-1)?.sequence ?? 0

const resolveReplayFocus = (
  timeline: readonly ReplayTimelineEntryDto[],
  focus: ReplayFocusRequest | undefined,
): { initialSequence: number; focus?: ReplayFocusDto | undefined } => {
  if (!focus) {
    return { initialSequence: 0 }
  }
  const exactEntry =
    focus.sequence === undefined
      ? undefined
      : timeline.find((entry) => entry.sequence === focus.sequence)
  if (
    focus.sequence !== undefined &&
    exactEntry &&
    entryMatchesMoment(exactEntry, focus.moment)
  ) {
    return {
      initialSequence: focus.sequence,
      focus: {
        requestedMoment: focus.moment,
        requestedSequence: focus.sequence,
        resolvedSequence: focus.sequence,
        label: focus.moment
          ? `Focused ${focus.moment}`
          : `Focused sequence ${focus.sequence}`,
        fallback: "none",
      },
    }
  }
  if (focus.sequence !== undefined && !focus.moment) {
    return {
      initialSequence: 0,
      focus: {
        requestedSequence: focus.sequence,
        resolvedSequence: 0,
        label: "Requested sequence unavailable; showing Match start.",
        fallback: "match_start",
      },
    }
  }
  const matching = timeline.find((entry) => {
    if (!entryMatchesMoment(entry, focus.moment)) return false
    if (focus.moment === "NO_ADVANCE_CLEANUP") {
      return JSON.stringify(entry.payload).includes("IMMEDIATE_REVERSAL")
    }
    if (focus.moment === "LATE_CYCLE_STABILIZATION") {
      return (
        entry.cycle !== undefined &&
        entry.cycle >= 10 &&
        entry.sequence >= latestTimelineSequence(timeline) - 12
      )
    }
    return true
  })
  if (matching) {
    return {
      initialSequence: matching.sequence,
      focus: {
        requestedMoment: focus.moment,
        requestedSequence: focus.sequence,
        resolvedSequence: matching.sequence,
        label: `Focused ${focus.moment ?? "moment"}`,
        fallback: focus.sequence === undefined ? "none" : "moment_not_found",
      },
    }
  }
  return {
    initialSequence: 0,
    focus: {
      requestedMoment: focus.moment,
      requestedSequence: focus.sequence,
      resolvedSequence: 0,
      label: "Requested moment unavailable; showing Match start.",
      fallback: "match_start",
    },
  }
}

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
    const boardRealismError = replayBoardRealismError(
      states,
      metadata.arenaVariantId,
    )
    if (boardRealismError) {
      return projectionFailure(
        metadata.matchId,
        boardRealismError,
        "validation",
      )
    }
    const ownerDebug =
      mode === "owner" && options.ownerPlayerId
        ? {
            soldierInactivityExplanations: buildSoldierInactivityExplanations({
              chronicle,
              ownerPlayerId: options.ownerPlayerId,
            }),
          }
        : undefined

    const timeline = buildTimeline(projection.events, chronicle.events)
    const focus = resolveReplayFocus(timeline, options.focus)

    return {
      status: "ready",
      mode,
      metadata,
      projection,
      timeline,
      states,
      initialSequence: focus.initialSequence,
      ...(focus.focus === undefined ? {} : { focus: focus.focus }),
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
