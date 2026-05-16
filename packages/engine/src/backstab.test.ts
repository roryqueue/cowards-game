import { describe, expect, it } from "vitest"
import type { Soldier } from "@cowards/spec"
import { resolveActivation } from "./activation.js"
import { findBackstabPairs, resolveBackstabBoundary } from "./backstab.js"
import { checkImmediateMatchEnd } from "./match.js"
import { resolveAction } from "./movement.js"
import { createInitialGameState } from "./state.js"
import { createFakeRuntime } from "./test/fake-runtime.js"
import type { GameState } from "./types.js"

const baseInput = {
  matchId: "match-backstab",
  seed: "backstab-seed",
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

const stateWith = (soldiers: Soldier[]): GameState => ({
  ...createInitialGameState(baseInput),
  soldiers,
})

describe("activation-boundary Backstab", () => {
  it("finds all ACTIVE Soldiers behind enemy ACTIVE Soldiers", () => {
    const state = stateWith([
      soldier({ id: "attacker", position: { x: 5, y: 6 } }),
      soldier({
        id: "victim",
        ownerPlayerId: "top",
        position: { x: 5, y: 5 },
        facing: "UP",
      }),
    ])
    expect(findBackstabPairs(state)).toEqual([
      { attackerId: "attacker", victimId: "victim" },
    ])
  })

  it("resolves activation-start Backstab before any SoldierBrain cycle", () => {
    const state = stateWith([
      soldier({ id: "attacker", position: { x: 5, y: 6 } }),
      soldier({
        id: "victim",
        ownerPlayerId: "top",
        position: { x: 5, y: 5 },
        facing: "UP",
      }),
    ])
    const result = resolveActivation(
      state,
      createFakeRuntime({ action: { type: "TURN", direction: "LEFT" } }),
      "attacker",
    )
    expect(
      result.state.soldiers.find((entry) => entry.id === "victim")?.status,
    ).toBe("STONE")
    expect(
      result.events.some((summary) => summary.type === "BACKSTAB_RESOLVED"),
    ).toBe(true)
  })

  it("resolves activation-end Backstab and all ACTIVE Soldiers are checked", () => {
    const state = stateWith([
      soldier({ id: "active", position: { x: 1, y: 1 } }),
      soldier({ id: "attacker", position: { x: 5, y: 6 } }),
      soldier({
        id: "victim",
        ownerPlayerId: "top",
        position: { x: 5, y: 5 },
        facing: "UP",
      }),
    ])
    const result = resolveActivation(
      state,
      createFakeRuntime({ action: { type: "MOVE", direction: "RIGHT" } }),
      "active",
    )
    expect(
      result.state.soldiers.find((entry) => entry.id === "victim")?.status,
    ).toBe("STONE")
  })

  it("uses simultaneous resolution for multi-victim Backstab", () => {
    const state = stateWith([
      soldier({
        id: "a",
        ownerPlayerId: "bottom",
        position: { x: 5, y: 6 },
        facing: "UP",
      }),
      soldier({
        id: "b",
        ownerPlayerId: "top",
        position: { x: 5, y: 5 },
        facing: "UP",
      }),
      soldier({
        id: "c",
        ownerPlayerId: "top",
        position: { x: 6, y: 6 },
        facing: "RIGHT",
      }),
    ])
    const result = resolveBackstabBoundary(state, "activation-end")
    expect(
      result.state.soldiers.find((entry) => entry.id === "b")?.status,
    ).toBe("STONE")
    expect(
      result.state.soldiers.find((entry) => entry.id === "c")?.status,
    ).toBe("STONE")
  })

  it("resolves mutual Backstab from a simultaneous snapshot", () => {
    const state = stateWith([
      soldier({
        id: "a",
        ownerPlayerId: "bottom",
        position: { x: 5, y: 5 },
        facing: "UP",
      }),
      soldier({
        id: "b",
        ownerPlayerId: "top",
        position: { x: 5, y: 6 },
        facing: "DOWN",
      }),
    ])
    const result = resolveBackstabBoundary(state, "activation-end")
    expect(
      result.state.soldiers.find((entry) => entry.id === "a")?.status,
    ).toBe("STONE")
    expect(
      result.state.soldiers.find((entry) => entry.id === "b")?.status,
    ).toBe("STONE")
  })

  it("allows pushed Soldier to cause Backstab and match-end can follow", () => {
    const state = stateWith([
      soldier({ id: "mover", position: { x: 4, y: 6 }, facing: "RIGHT" }),
      soldier({ id: "pushed Soldier", position: { x: 5, y: 6 }, facing: "UP" }),
      soldier({
        id: "victim",
        ownerPlayerId: "top",
        position: { x: 6, y: 5 },
        facing: "UP",
      }),
    ])
    const pushed = resolveAction(
      state,
      "mover",
      { type: "MOVE", direction: "RIGHT" },
      { advanced: false },
    )
    const backstab = resolveBackstabBoundary(pushed.state, "activation-end")
    expect(
      backstab.state.soldiers.find((entry) => entry.id === "victim")?.status,
    ).toBe("STONE")
    expect(checkImmediateMatchEnd(backstab.state)).toEqual({
      type: "WIN",
      winnerPlayerId: "bottom",
    })
  })

  it("ends immediately after a post-advance Backstab eliminates a player", () => {
    const state = stateWith([
      soldier({ id: "mover", position: { x: 5, y: 7 }, facing: "UP" }),
      soldier({
        id: "victim",
        ownerPlayerId: "top",
        position: { x: 5, y: 5 },
        facing: "UP",
      }),
    ])
    let calls = 0
    const result = resolveActivation(
      state,
      createFakeRuntime({
        action: () => {
          calls += 1
          return calls === 1
            ? { type: "MOVE", direction: "UP" }
            : { type: "TURN_TO_STONE" }
        },
      }),
      "mover",
    )
    expect(calls).toBe(1)
    expect(result.state.outcome).toEqual({
      type: "WIN",
      winnerPlayerId: "bottom",
    })
    expect(result.events.map((summary) => summary.type)).toContain(
      "MATCH_ENDED",
    )
  })
})
