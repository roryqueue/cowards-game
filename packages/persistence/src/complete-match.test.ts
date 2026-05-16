import { describe, expect, it } from "vitest"
import type { GameState } from "@cowards/engine"
import { deriveMatchCompletionFields } from "./complete-match.js"

const finalState = {
  matchId: "match:complete:001",
  seed: "seed:complete:001",
  versions: {
    spec: "1.0.0",
    engine: "0.1.0",
    runtimeJs: "0.1.0",
    chronicle: "0.1.0",
    strategyRevision: "0.1.0",
    arenaVariant: "0.1.0",
  },
  arenaVariant: {
    id: "arena:smoke:v1",
    name: "Smoke",
    initialBounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
    terrainStones: [],
  },
  players: [
    {
      id: "player:bottom",
      side: "bottom",
      strategyRevisionId: "strategy-revision:bottom",
      strategyMemory: {},
    },
    {
      id: "player:top",
      side: "top",
      strategyRevisionId: "strategy-revision:top",
      strategyMemory: {},
    },
  ],
  phase: "COMPLETE",
  phaseNumber: 2,
  roundNumber: 3,
  activationCount: 4,
  initiativePlayerId: "player:bottom",
  bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
  soldiers: [
    {
      id: "soldier:1",
      ownerPlayerId: "player:bottom",
      status: "ACTIVE",
      position: { x: 1, y: 1 },
      facing: "UP",
      lastSuccessfulMoveDirection: null,
      soldierMemory: {},
    },
    {
      id: "soldier:2",
      ownerPlayerId: "player:top",
      status: "FALLEN",
      position: null,
      facing: null,
      lastSuccessfulMoveDirection: null,
      soldierMemory: {},
    },
  ],
  terrainStones: [],
  outcome: { type: "WIN", winnerPlayerId: "player:bottom" },
} satisfies GameState

describe("Match completion fields", () => {
  it("derives outcome, winner, surviving_soldiers, and survival_turns", () => {
    expect(deriveMatchCompletionFields(finalState)).toEqual({
      matchId: "match:complete:001",
      outcome: { type: "WIN", winnerPlayerId: "player:bottom" },
      winnerPlayerId: "player:bottom",
      survivingSoldiers: 1,
      survivalTurns: 48,
    })
  })
})
