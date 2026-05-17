import type { ReplayReadyDto, ReplayTimelineEntryDto } from "./types.js"

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
): ReplayTimelineEntryDto => ({
  sequence,
  type,
  round: sequence === 0 ? undefined : 1,
  activation: sequence <= 1 ? undefined : 0,
  cycle: sequence >= 2 && sequence <= 4 ? sequence - 2 : undefined,
  label,
  privacy: "public",
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

const board = {
  bounds: { minX: 1, maxX: 10, minY: 1, maxY: 10 },
  terrainStones: [
    { x: 4, y: 4 },
    { x: 7, y: 6 },
  ],
  soldiers: [
    {
      id: "soldier:bottom:1",
      ownerPlayerId: "player:bottom",
      status: "ACTIVE" as const,
      position: { x: 2, y: 8 },
      facing: "UP" as const,
      lastSuccessfulMoveDirection: "UP" as const,
    },
    {
      id: "soldier:bottom:2",
      ownerPlayerId: "player:bottom",
      status: "FALLEN" as const,
      position: null,
      facing: null,
      lastSuccessfulMoveDirection: "LEFT" as const,
    },
    {
      id: "soldier:top:1",
      ownerPlayerId: "player:top",
      status: "STONE" as const,
      position: { x: 6, y: 3 },
      facing: "DOWN" as const,
      lastSuccessfulMoveDirection: "DOWN" as const,
    },
  ],
}

export const createReplayFixtureData = (): ReplayReadyDto => ({
  status: "ready",
  mode: "public",
  metadata: {
    matchId: replayFixtureMatchId,
    chronicleId: "chronicle:e2e-replay-fixture",
    hash: "fixture-hash",
    schemaVersion: "chronicle-v1",
    eventCount: 10,
    snapshotCount: 10,
    outcome: { type: "DRAW" },
    bottomPlayerId: "player:bottom",
    topPlayerId: "player:top",
    arenaVariantId: "arena:e2e-replay-fixture",
  },
  projection: {
    schemaVersion: "chronicle-v1",
    viewer: { access: "public" },
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
  },
  timeline: [
    event(0, "MATCH_STARTED", "Match start"),
    event(1, "ROUND_STARTED", "Round start"),
    event(2, "MOVE_ADVANCED", "Advance", {
      from: { x: 2, y: 9 },
      to: { x: 2, y: 8 },
    }),
    event(3, "BACKSTAB_RESOLVED", "Backstab", {
      from: { x: 2, y: 8 },
      to: { x: 2, y: 7 },
    }),
    event(4, "PUSH_RESOLVED", "Push", {
      from: { x: 2, y: 7 },
      to: { x: 2, y: 6 },
    }),
    event(5, "SOLDIER_FELL", "Fall", { position: { x: 1, y: 10 } }),
    event(6, "SOLDIER_STONED", "Stone", { position: { x: 6, y: 3 } }),
    event(7, "MOVE_BLOCKED", "Blocked", { position: { x: 4, y: 4 } }),
    event(8, "CONTRACTION_RESOLVED", "Contraction"),
    event(9, "RUNTIME_VIOLATION", "Runtime violation"),
    event(10, "MATCH_ENDED", "Outcome"),
  ],
  states: Array.from({ length: 11 }, (_, sequence) => ({
    sequence,
    board,
    ...(sequence === 10 ? { outcome: { type: "DRAW" as const } } : {}),
  })),
  initialSequence: 0,
})
