import type {
  FullBoardSnapshot,
  PlayerId,
  SoldierId,
  SoldierSnapshot,
} from "@cowards/spec"
import type {
  ReplayReadyDto,
  ReplayTimelineEntryDto,
  ReplayViewMode,
} from "./types.js"
import type { GetMatchReplayOptions } from "./server.js"

export const replayFixtureMatchId = "match:e2e-replay-fixture"

export const isReplayFixtureEnabled = (): boolean =>
  process.env.PLAYWRIGHT_TEST === "1" ||
  process.env.NODE_ENV === "test" ||
  process.env.NODE_ENV === "development"

const safeDecodeURIComponent = (value: string): string | null => {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

export const isReplayFixtureMatch = (matchId: string): boolean =>
  isReplayFixtureEnabled() &&
  (matchId === replayFixtureMatchId ||
    safeDecodeURIComponent(matchId) === replayFixtureMatchId)

const event = (
  sequence: number,
  type: ReplayTimelineEntryDto["type"],
  label: string,
  payload: ReplayTimelineEntryDto["payload"] = {},
  privacy: ReplayTimelineEntryDto["privacy"] = "public",
  contextOverride: Partial<ReplayTimelineEntryDto["context"]> = {},
): ReplayTimelineEntryDto => {
  const payloadRecord =
    payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {}
  const payloadSoldierId =
    typeof payloadRecord.soldierId === "string"
      ? payloadRecord.soldierId
      : undefined
  const actingPlayerId =
    payloadSoldierId === undefined
      ? undefined
      : inferPlayerIdFromSoldier(payloadSoldierId)
  const context: ReplayTimelineEntryDto["context"] = {
    ...(sequence === 0 ? {} : { roundNumber: 1 as const }),
    ...(payloadSoldierId === undefined ? {} : { soldierId: payloadSoldierId }),
    ...(actingPlayerId === undefined ? {} : { actingPlayerId }),
    ...contextOverride,
  }

  return {
    sequence,
    type,
    round: context.roundNumber,
    activation: context.activationIndex,
    cycle: context.cycleIndex,
    label,
    privacy,
    context,
    payload,
  }
}

const inferPlayerIdFromSoldier = (
  soldierId: SoldierId,
): PlayerId | undefined => {
  if (soldierId.includes(":bottom:")) {
    return "player:bottom"
  }
  if (soldierId.includes(":top:")) {
    return "player:top"
  }
  return undefined
}

const awarenessGrid = {
  cells: Array.from({ length: 25 }, (_, index) => {
    const dx = (index % 5) - 2
    const dy = Math.floor(index / 5) - 2
    return {
      dx,
      dy,
      contents:
        dx === 0 && dy === 0
          ? ("FRIENDLY_ACTIVE" as const)
          : ("EMPTY" as const),
      ...(dx === 0 && dy === 0 ? { facing: "UP" as const } : {}),
    }
  }),
}

const startingXs = [2, 3, 4, 5, 6, 7, 8, 9] as const

const createSideSoldiers = (
  ownerPlayerId: string,
  side: "bottom" | "top",
  y: number,
  facing: "UP" | "DOWN",
) =>
  startingXs.map((x, index) => ({
    id: `soldier:${side}:${index + 1}`,
    ownerPlayerId,
    status: "ACTIVE" as const,
    position: { x, y },
    facing,
    lastSuccessfulMoveDirection: null,
  }))

const board0: FullBoardSnapshot = {
  bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
  terrainStones: [
    { x: 5, y: 10 },
    { x: 7, y: 6 },
  ],
  soldiers: [
    ...createSideSoldiers("player:bottom", "bottom", 11, "UP"),
    ...createSideSoldiers("player:top", "top", 0, "DOWN"),
  ],
}

const updateSoldier = (
  board: FullBoardSnapshot,
  soldierId: SoldierId,
  patch: Partial<SoldierSnapshot>,
): FullBoardSnapshot => ({
  ...board,
  soldiers: board.soldiers.map((soldier) =>
    soldier.id === soldierId ? { ...soldier, ...patch } : soldier,
  ),
})

const isInsideBounds = (
  position: NonNullable<SoldierSnapshot["position"]>,
  bounds: FullBoardSnapshot["bounds"],
): boolean =>
  position.x >= bounds.minX &&
  position.x <= bounds.maxX &&
  position.y >= bounds.minY &&
  position.y <= bounds.maxY

const contractBoard = (
  board: FullBoardSnapshot,
  bounds: FullBoardSnapshot["bounds"],
): FullBoardSnapshot => ({
  ...board,
  bounds,
  terrainStones: board.terrainStones.filter((stone) =>
    isInsideBounds(stone, bounds),
  ),
  soldiers: board.soldiers.map((soldier) =>
    soldier.status !== "FALLEN" &&
    soldier.position !== null &&
    !isInsideBounds(soldier.position, bounds)
      ? { ...soldier, status: "FALLEN" as const, position: null }
      : soldier,
  ),
})

const board1 = board0
const board2 = board1
const board3 = updateSoldier(board2, "soldier:bottom:3", {
  position: { x: 4, y: 10 },
  facing: "UP",
  lastSuccessfulMoveDirection: "UP",
})
const board4 = updateSoldier(board3, "soldier:bottom:1", {
  facing: "RIGHT",
})
const board5 = updateSoldier(board4, "soldier:bottom:2", {
  position: { x: 4, y: 11 },
})
const board6 = updateSoldier(board5, "soldier:bottom:1", {
  position: { x: 3, y: 11 },
  facing: "RIGHT",
  lastSuccessfulMoveDirection: "RIGHT",
})
const board7 = updateSoldier(board6, "soldier:top:1", {
  position: { x: 2, y: 1 },
  facing: "DOWN",
  lastSuccessfulMoveDirection: "DOWN",
})
const board8 = updateSoldier(board7, "soldier:top:8", {
  status: "FALLEN",
  position: null,
})
const board9 = updateSoldier(board8, "soldier:top:2", {
  status: "STONE",
})
const board10 = board9
const board11 = contractBoard(board10, {
  minX: 1,
  maxX: 10,
  minY: 1,
  maxY: 10,
})
const board12 = board11
const board13 = board12
const boards = [
  board0,
  board1,
  board2,
  board3,
  board4,
  board5,
  board6,
  board7,
  board8,
  board9,
  board10,
  board11,
  board12,
  board13,
]

const timeline = [
  event(0, "MATCH_STARTED", "Match start"),
  event(1, "ROUND_STARTED", "Round start"),
  event(
    2,
    "AWARENESS_GRID_OBSERVED",
    "Awareness",
    { soldierId: "soldier:bottom:3", cycleIndex: 0 },
    "owner",
    { activationIndex: 0, cycleIndex: 0 },
  ),
  event(
    3,
    "MOVE_ADVANCED",
    "Move",
    { soldierId: "soldier:bottom:3", direction: "UP" },
    "public",
    { activationIndex: 0, cycleIndex: 0 },
  ),
  event(
    4,
    "TURN_RESOLVED",
    "Turn",
    { soldierId: "soldier:bottom:1", direction: "RIGHT" },
    "public",
    { activationIndex: 1, cycleIndex: 0 },
  ),
  event(
    5,
    "PUSH_RESOLVED",
    "Push",
    {
      soldierId: "soldier:bottom:1",
      targetSoldierId: "soldier:bottom:2",
      pushedOffBoard: false,
    },
    "public",
    { activationIndex: 1, cycleIndex: 1 },
  ),
  event(
    6,
    "MOVE_ADVANCED",
    "Move",
    { soldierId: "soldier:bottom:1", direction: "RIGHT" },
    "public",
    { activationIndex: 1, cycleIndex: 1 },
  ),
  event(
    7,
    "MOVE_ADVANCED",
    "Move",
    { soldierId: "soldier:top:1", direction: "DOWN" },
    "public",
    {
      activationIndex: 2,
      cycleIndex: 0,
    },
  ),
  event(
    8,
    "SOLDIER_FELL",
    "Fall",
    { soldierId: "soldier:top:8", reason: "MOVED_OFF_BOARD" },
    "public",
    {
      activationIndex: 3,
      cycleIndex: 0,
    },
  ),
  event(
    9,
    "SOLDIER_STONED",
    "Stone",
    { soldierId: "soldier:top:2", reason: "TURN_TO_STONE" },
    "public",
    {
      activationIndex: 4,
      cycleIndex: 0,
    },
  ),
  event(
    10,
    "MOVE_BLOCKED",
    "Blocked",
    { soldierId: "soldier:bottom:4", reason: "TERRAIN_STONE" },
    "public",
    { activationIndex: 5, cycleIndex: 0 },
  ),
  event(11, "CONTRACTION_RESOLVED", "Contraction", {
    bounds: board11.bounds,
  }),
  event(
    12,
    "RUNTIME_VIOLATION",
    "Runtime violation",
    {
      soldierId: "soldier:bottom:3",
    },
    "public",
    { activationIndex: 6 },
  ),
  event(13, "MATCH_ENDED", "Outcome"),
]

const states = boards.map((board, sequence) => ({
  sequence,
  board,
  ...(sequence === boards.length - 1
    ? { outcome: { type: "DRAW" as const } }
    : {}),
}))

export const createReplayFixtureData = (
  options: GetMatchReplayOptions = {},
): ReplayReadyDto => {
  const mode: ReplayViewMode =
    options.allowOwnerDebug === true &&
    options.mode === "owner" &&
    options.ownerPlayerId
      ? "owner"
      : "public"

  return {
    status: "ready",
    mode,
    metadata: {
      matchId: replayFixtureMatchId,
      chronicleId: "chronicle:e2e-replay-fixture",
      hash: "fixture-hash",
      schemaVersion: "chronicle-v1",
      eventCount: timeline.length,
      snapshotCount: states.length,
      outcome: { type: "DRAW" },
      bottomPlayerId: "player:bottom",
      topPlayerId: "player:top",
      arenaVariantId: "arena:e2e-replay-fixture",
    },
    projection: {
      schemaVersion: "chronicle-v1",
      viewer:
        mode === "owner" && options.ownerPlayerId
          ? { access: "owner", playerId: options.ownerPlayerId }
          : { access: "public" },
      reproducibility: {
        matchId: replayFixtureMatchId,
        seed: "seed:e2e-replay-fixture",
        arenaVariantId: "arena:e2e-replay-fixture",
        arenaVariantVersion: "arena-variant-v1",
        strategyRevisionIds: ["revision:bottom", "revision:top"],
        versions: {
          spec: "spec-v1",
          engine: "engine-v1",
          runtimeJs: "runtime-js-v1",
          chronicle: "chronicle-v1",
          strategyRevision: "strategy-revision-v1",
          arenaVariant: "arena-variant-v1",
        },
      },
      events: [],
      snapshots: [],
      ...(mode === "owner" && options.ownerPlayerId
        ? {
            ownerPrivate: {
              playerId: options.ownerPlayerId,
              data: {
                "private:event:2": {
                  awarenessGrid,
                },
              },
            },
          }
        : {}),
    },
    timeline,
    states,
    initialSequence: 0,
    ...(mode === "owner" && options.ownerPlayerId
      ? { ownerPlayerId: options.ownerPlayerId }
      : {}),
  }
}
