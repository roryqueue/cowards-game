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
): ReplayTimelineEntryDto => ({
  sequence,
  type,
  round: sequence === 0 ? undefined : 1,
  activation: sequence <= 1 ? undefined : 0,
  cycle: sequence >= 2 && sequence <= 4 ? sequence - 2 : undefined,
  label,
  privacy,
  context: {
    ...(sequence === 0 ? {} : { roundNumber: 1 as const }),
    ...(sequence <= 1 ? {} : { activationIndex: 0 }),
    ...(sequence >= 2
      ? {
          soldierId: "soldier:bottom:1",
          actingPlayerId: "player:bottom",
        }
      : {}),
  },
  payload,
})

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

const board0 = {
  bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
  terrainStones: [
    { x: 4, y: 5 },
    { x: 7, y: 6 },
  ],
  soldiers: [
    ...createSideSoldiers("player:bottom", "bottom", 11, "UP"),
    ...createSideSoldiers("player:top", "top", 0, "DOWN"),
  ],
}

const board1 = board0
const board2 = board1
const board3 = {
  ...board2,
  soldiers: board2.soldiers.map((soldier) =>
    soldier.id === "soldier:bottom:1"
      ? { ...soldier, facing: "RIGHT" as const }
      : soldier,
  ),
}
const board4 = {
  ...board3,
  soldiers: board3.soldiers.map((soldier) =>
    soldier.id === "soldier:bottom:1"
      ? {
          ...soldier,
          position: { x: 3, y: 11 },
          facing: "RIGHT" as const,
          lastSuccessfulMoveDirection: "RIGHT" as const,
        }
      : soldier.id === "soldier:bottom:2"
        ? { ...soldier, position: { x: 4, y: 11 } }
        : soldier,
  ),
}
const board5 = {
  ...board4,
  soldiers: board4.soldiers.map((soldier) =>
    soldier.id === "soldier:top:1"
      ? {
          ...soldier,
          position: { x: 2, y: 1 },
          lastSuccessfulMoveDirection: "DOWN" as const,
        }
      : soldier,
  ),
}
const board6 = {
  ...board5,
  soldiers: board5.soldiers.map((soldier) =>
    soldier.id === "soldier:bottom:8"
      ? { ...soldier, status: "FALLEN" as const, position: null }
      : soldier,
  ),
}
const board7 = {
  ...board6,
  soldiers: board6.soldiers.map((soldier) =>
    soldier.id === "soldier:top:2"
      ? { ...soldier, status: "STONE" as const }
      : soldier,
  ),
}
const board8 = {
  ...board7,
}
const board9 = {
  ...board8,
  bounds: { minX: 1, maxX: 10, minY: 1, maxY: 10 },
  terrainStones: board8.terrainStones.filter(
    (stone) => stone.x >= 1 && stone.x <= 10 && stone.y >= 1 && stone.y <= 10,
  ),
}
const board10 = {
  ...board9,
  soldiers: board9.soldiers.map((soldier) =>
    soldier.id === "soldier:top:3"
      ? { ...soldier, status: "STONE" as const }
      : soldier,
  ),
}
const board11 = board10
const board12 = board11
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
]

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
      eventCount: 13,
      snapshotCount: 13,
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
    timeline: [
      event(0, "MATCH_STARTED", "Match start"),
      event(1, "ROUND_STARTED", "Round start"),
      event(
        2,
        "AWARENESS_GRID_OBSERVED",
        "Awareness",
        { soldierId: "soldier:bottom:1", cycleIndex: 0 },
        "owner",
      ),
      event(3, "TURN_RESOLVED", "Turn", {
        soldierId: "soldier:bottom:1",
        direction: "RIGHT",
      }),
      event(4, "PUSH_RESOLVED", "Push", {
        soldierId: "soldier:bottom:1",
        targetSoldierId: "soldier:bottom:2",
        pushedOffBoard: false,
      }),
      event(5, "MOVE_ADVANCED", "Move", {
        soldierId: "soldier:top:1",
        direction: "DOWN",
      }),
      event(6, "SOLDIER_FELL", "Fall", {
        soldierId: "soldier:bottom:8",
        reason: "PUSHED_OFF_BOARD",
      }),
      event(7, "SOLDIER_STONED", "Stone", {
        soldierId: "soldier:top:2",
        reason: "TURN_TO_STONE",
      }),
      event(8, "MOVE_BLOCKED", "Blocked", {
        soldierId: "soldier:bottom:1",
        reason: "TERRAIN_STONE",
      }),
      event(9, "CONTRACTION_RESOLVED", "Contraction", {
        bounds: board9.bounds,
      }),
      event(10, "BACKSTAB_RESOLVED", "Backstab", {
        boundary: "activation-end",
        pairs: [{ attackerId: "soldier:bottom:1", victimId: "soldier:top:3" }],
      }),
      event(11, "RUNTIME_VIOLATION", "Runtime violation", {
        soldierId: "soldier:bottom:1",
      }),
      event(12, "MATCH_ENDED", "Outcome"),
    ],
    states: Array.from({ length: 13 }, (_, sequence) => ({
      sequence,
      board: boards[sequence] ?? board0,
      ...(sequence === 12 ? { outcome: { type: "DRAW" as const } } : {}),
    })),
    initialSequence: 0,
    ...(mode === "owner" && options.ownerPlayerId
      ? { ownerPlayerId: options.ownerPlayerId }
      : {}),
  }
}
