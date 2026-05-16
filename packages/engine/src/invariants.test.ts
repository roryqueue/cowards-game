import { describe, expect, it } from "vitest"
import type { Soldier } from "@cowards/spec"
import { resolveContraction } from "./contraction.js"
import { resolveAction } from "./movement.js"
import { getOccupyingSoldier, positionKey } from "./selectors.js"
import { createInitialGameState } from "./state.js"
import type { GameState } from "./types.js"

const baseInput = {
  matchId: "match-invariants",
  seed: "invariant-seed",
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

const assertOccupancyUniqueness = (state: GameState) => {
  const occupied = state.soldiers
    .filter((entry) => entry.status !== "FALLEN" && entry.position !== null)
    .map((entry) => positionKey(entry.position!))
  expect(new Set(occupied).size, "occupancy uniqueness").toBe(occupied.length)
}

describe("deterministic invariant matrix", () => {
  it("preserves occupancy uniqueness across movement and contraction", () => {
    const state: GameState = {
      ...createInitialGameState(baseInput),
      soldiers: [
        soldier({ id: "mover", position: { x: 4, y: 5 }, facing: "RIGHT" }),
        soldier({
          id: "target",
          ownerPlayerId: "top",
          position: { x: 5, y: 5 },
          facing: "UP",
        }),
      ],
    }
    const moved = resolveAction(
      state,
      "mover",
      { type: "MOVE", direction: "RIGHT" },
      { advanced: false },
    ).state
    assertOccupancyUniqueness(moved)
    assertOccupancyUniqueness(resolveContraction(moved).state)
  })

  it("keeps FALLEN Soldiers never occupy a square", () => {
    const state: GameState = {
      ...createInitialGameState(baseInput),
      soldiers: [soldier({ id: "fallen", status: "FALLEN", position: null })],
    }
    expect(getOccupyingSoldier(state, { x: 5, y: 5 })).toBeUndefined()
  })

  it("produces deterministic transition output for repeated identical inputs", () => {
    const state: GameState = {
      ...createInitialGameState(baseInput),
      soldiers: [soldier({ id: "mover" })],
    }
    const first = resolveAction(
      state,
      "mover",
      { type: "MOVE", direction: "UP" },
      { advanced: false },
    )
    const second = resolveAction(
      state,
      "mover",
      { type: "MOVE", direction: "UP" },
      { advanced: false },
    )
    expect(first).toEqual(second)
  })
})
