import { createReplay, projectOwnerChronicle, projectPublicChronicle } from "@cowards/replay"
import { createDatabasePool } from "@cowards/persistence/db"
import {
  createPostgresChronicleStore,
  type ChronicleStore,
  type StoredChronicle,
  type Queryable,
} from "@cowards/persistence"
import type {
  ChronicleEvent,
  ChronicleEventType,
  ChroniclePublicEvent,
  MatchId,
  PlayerId,
} from "@cowards/spec"
import type {
  ReplayPageData,
  ReplayReadyDto,
  ReplayTimelineEntryDto,
  ReplayViewMode,
} from "./types.js"

type WithPool = <T>(fn: (pool: Queryable) => Promise<T>) => Promise<T>

export interface MatchReplayServerDeps {
  withPool?: WithPool | undefined
  createChronicleStore?:
    | ((pool: Queryable) => Pick<ChronicleStore, "getByMatchId">)
    | undefined
}

export interface GetMatchReplayOptions {
  mode?: ReplayViewMode | undefined
  ownerPlayerId?: PlayerId | undefined
}

const withDatabasePool: WithPool = async (fn) => {
  const pool = createDatabasePool()
  try {
    return await fn(pool)
  } finally {
    await pool.end()
  }
}

const eventLabels = {
  MATCH_STARTED: "Match start",
  ROUND_STARTED: "Round",
  STRATEGY_EVALUATED: "Strategy evaluated",
  ACTIVATION_STARTED: "Activation",
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

const eventLabel = (event: ChroniclePublicEvent): string => {
  if (
    event.type === "ROUND_STARTED" &&
    typeof event.context.roundNumber === "number"
  ) {
    return `Round ${event.context.roundNumber}`
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

const buildReadyReplay = (
  stored: StoredChronicle,
  options: GetMatchReplayOptions,
): ReplayPageData => {
  const mode: ReplayViewMode =
    options.mode === "owner" && options.ownerPlayerId ? "owner" : "public"
  const projection =
    mode === "owner"
      ? projectOwnerChronicle(stored.artifact, options.ownerPlayerId!)
      : projectPublicChronicle(stored.artifact)
  const replayResult = createReplay(stored.artifact)

  if (!replayResult.ok) {
    return {
      status: "unavailable",
      matchId: stored.metadata.matchId,
      reason: "invalid-chronicle",
      message:
        replayResult.errors[0]?.message ?? "Chronicle could not be replayed.",
    }
  }

  const states = [...replayResult.replay.iterateReplay()].map((entry) => ({
    sequence: entry.sequence,
    board: entry.state.board,
    ...(entry.state.outcome === undefined
      ? {}
      : { outcome: entry.state.outcome }),
  }))

  return {
    status: "ready",
    mode,
    metadata: {
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
    },
    projection,
    timeline: buildTimeline(projection.events, stored.artifact.events),
    states,
    initialSequence: 0,
    ...(mode === "owner" && options.ownerPlayerId
      ? { ownerPlayerId: options.ownerPlayerId }
      : {}),
  } satisfies ReplayReadyDto
}

export const createMatchReplayServer = (
  deps: MatchReplayServerDeps = {},
) => {
  const withPool = deps.withPool ?? withDatabasePool
  const createStore = deps.createChronicleStore ?? createPostgresChronicleStore

  return {
    async getMatchReplay(
      matchId: MatchId,
      options: GetMatchReplayOptions = {},
    ): Promise<ReplayPageData> {
      const stored = await withPool((pool) =>
        createStore(pool).getByMatchId(matchId),
      )

      if (!stored) {
        return {
          status: "unavailable",
          matchId,
          reason: "missing-chronicle",
          message: "Replay unavailable: no Chronicle is stored for this Match.",
        }
      }

      return buildReadyReplay(stored, options)
    },
  }
}

export const matchReplayServer = createMatchReplayServer()

export const getMatchReplay = (
  matchId: MatchId,
  options?: GetMatchReplayOptions,
) => matchReplayServer.getMatchReplay(matchId, options)

export type MatchReplayServer = ReturnType<typeof createMatchReplayServer>

