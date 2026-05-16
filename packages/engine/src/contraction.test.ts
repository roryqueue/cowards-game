import { describe, expect, it } from "vitest"
import type { Soldier } from "@cowards/spec"
import { resolveContraction } from "./contraction.js"
import { checkImmediateMatchEnd } from "./match.js"
import { createInitialGameState } from "./state.js"
import type { GameState } from "./types.js"

const baseInput = {
  matchId: "match-contraction",
  seed: "contraction-seed",
  arenaVariant: {
    id: "arena",
    name: "Arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [],
  },
  bottomPlayerId: "bottom",
  topPlayerId: "top",
  bottomStrategyRevisionId: "bottom-rev",
  topStrategyRevisionId: "top-rev",
}

const soldier = (overrides: Partial<Soldier> & { id: string }): Soldier => ({
  ownerPlayerId: "bottom",
  status: "ACTIVE",
  position: { x: 5, y: 5 },
  facing: "UP",
  lastSuccessfulMoveDirection: null,
  soldierMemory: {},
  ...overrides,
})

const stateWith = (state: Partial<GameState>): GameState => ({
  ...createInitialGameState(baseInput),
  ...state,
})

describe("contraction and match ending", () => {
  it("detects zero ACTIVE immediate win and draw", () => {
    expect(
      checkImmediateMatchEnd(
        stateWith({
          soldiers: [
            soldier({ id: "bottom-active" }),
            soldier({ id: "top-stone", ownerPlayerId: "top", status: "STONE" }),
          ],
        }),
      ),
    ).toEqual({ type: "WIN", winnerPlayerId: "bottom" })

    expect(
      checkImmediateMatchEnd(
        stateWith({
          soldiers: [
            soldier({ id: "bottom-stone", status: "STONE" }),
            soldier({ id: "top-stone", ownerPlayerId: "top", status: "STONE" }),
          ],
        }),
      ),
    ).toEqual({ type: "DRAW" })
  })

  it("shrinks bounds, drops out-of-bounds Soldiers, and removes TerrainStones", () => {
    const result = resolveContraction(
      stateWith({
        terrainStones: [
          { x: 0, y: 5 },
          { x: 5, y: 5 },
        ],
        soldiers: [
          soldier({ id: "edge", position: { x: 0, y: 5 } }),
          soldier({ id: "safe", position: { x: 5, y: 5 } }),
          soldier({
            id: "enemy",
            ownerPlayerId: "top",
            position: { x: 6, y: 6 },
          }),
        ],
      }),
    )
    expect(result.state.bounds).toEqual({
      minX: 1,
      maxX: 10,
      minY: 1,
      maxY: 10,
    })
    expect(
      result.state.soldiers.find((entry) => entry.id === "edge")?.status,
    ).toBe("FALLEN")
    expect(result.state.terrainStones).toEqual([{ x: 5, y: 5 }])
  })

  it("resolves final 2x2 outcome after contraction", () => {
    const result = resolveContraction(
      stateWith({
        bounds: { minX: 0, maxX: 3, minY: 0, maxY: 3 },
        soldiers: [
          soldier({ id: "bottom-one", position: { x: 1, y: 1 } }),
          soldier({ id: "bottom-two", position: { x: 2, y: 1 } }),
          soldier({
            id: "top-one",
            ownerPlayerId: "top",
            position: { x: 1, y: 2 },
          }),
        ],
      }),
    )
    expect(result.state.bounds).toEqual({ minX: 1, maxX: 2, minY: 1, maxY: 2 })
    expect(result.state.outcome).toEqual({
      type: "WIN",
      winnerPlayerId: "bottom",
    })
  })

  it("runs after Round 4 in the match loop contract", () => {
    const result = resolveContraction(
      stateWith({
        roundNumber: 4,
        soldiers: [
          soldier({ id: "bottom-active" }),
          soldier({ id: "top-active", ownerPlayerId: "top" }),
        ],
      }),
    )
    expect(
      result.events.some((summary) => summary.type === "CONTRACTION_RESOLVED"),
    ).toBe(true)
  })
})
