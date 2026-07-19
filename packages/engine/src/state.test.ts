import { describe, expect, it } from "vitest"
import { createInitialGameState } from "./state.js"
import { getOccupyingSoldier, replaceSoldier } from "./selectors.js"
import {
  BOTTOM_STARTING_POSITIONS,
  COMPATIBILITY_VERSIONS,
  CURRENT_SEMANTIC_AUTHORITY_KEY,
  INITIAL_BOUNDS,
  TOP_STARTING_POSITIONS,
  fixtures,
} from "@cowards/spec"
import { createCandidateInitialGameState } from "./kernel/create-initial-state.js"

const input = {
  matchId: "match-1",
  seed: fixtures.valid.sampleSeed,
  arenaVariant: fixtures.valid.standardArenaVariant,
  bottomPlayerId: "alice",
  topPlayerId: "bob",
  bottomStrategyRevisionId: "alice-rev",
  topStrategyRevisionId: "bob-rev",
}

describe("engine state foundation", () => {
  it("creates the canonical initial 12x12 state with 16 Soldiers total", () => {
    const state = createInitialGameState(input)
    expect(state.bounds).toEqual({ minX: 0, maxX: 11, minY: 0, maxY: 11 })
    expect(state.soldiers).toHaveLength(16)
    expect(
      state.soldiers.filter((soldier) => soldier.ownerPlayerId === "alice"),
    ).toHaveLength(8)
    expect(
      state.soldiers.filter((soldier) => soldier.ownerPlayerId === "bob"),
    ).toHaveLength(8)
  })

  it("uses explicit player IDs with bottom Soldiers facing UP and top Soldiers facing DOWN", () => {
    const state = createInitialGameState(input)
    expect(
      state.soldiers
        .filter((soldier) => soldier.ownerPlayerId === "alice")
        .every((soldier) => soldier.facing === "UP"),
    ).toBe(true)
    expect(
      state.soldiers
        .filter((soldier) => soldier.ownerPlayerId === "bob")
        .every((soldier) => soldier.facing === "DOWN"),
    ).toBe(true)
    expect(state.players.map((player) => player.id)).toEqual(["alice", "bob"])
  })

  it("keeps FALLEN Soldiers in the roster but they do not occupy squares", () => {
    const state = createInitialGameState(input)
    const fallen = {
      ...state.soldiers[0]!,
      status: "FALLEN" as const,
      position: null,
    }
    const nextState = replaceSoldier(state, fallen)
    expect(nextState.soldiers).toHaveLength(16)
    expect(getOccupyingSoldier(nextState, { x: 2, y: 11 })).toBeUndefined()
  })

  it("is deterministic for repeated identical input", () => {
    expect(createInitialGameState(input)).toEqual(createInitialGameState(input))
  })

  it("keeps the inactive candidate clone-equivalent to valid v1.4 initial behavior", () => {
    const active = createInitialGameState(input)
    const candidate = createCandidateInitialGameState(input)
    expect(candidate.ok).toBe(true)
    if (!candidate.ok) return
    if (String(CURRENT_SEMANTIC_AUTHORITY_KEY) === "runtime-v1.19") {
      expect(active.initialInitiativePlayerId).toBe(active.initiativePlayerId)
      const {
        initialInitiativePlayerId: _initialInitiativePlayerId,
        ...gameplayState
      } = active
      expect(candidate.state).toEqual(gameplayState)
    } else {
      expect(candidate.state).toEqual(active)
      expect(active.initialInitiativePlayerId).toBeUndefined()
    }
  })

  it("keeps canonical constant values frozen and unchanged", () => {
    expect(INITIAL_BOUNDS).toEqual({ minX: 0, maxX: 11, minY: 0, maxY: 11 })
    expect(BOTTOM_STARTING_POSITIONS).toHaveLength(8)
    expect(TOP_STARTING_POSITIONS).toHaveLength(8)
    expect(COMPATIBILITY_VERSIONS.spec).toBe("cowards-rules-v1.4")
    expect(Object.isFrozen(INITIAL_BOUNDS)).toBe(true)
    expect(Object.isFrozen(BOTTOM_STARTING_POSITIONS[0])).toBe(true)
    expect(Object.isFrozen(TOP_STARTING_POSITIONS[0])).toBe(true)
    const candidate = createCandidateInitialGameState(input)
    expect(candidate.ok).toBe(true)
    if (candidate.ok) {
      expect(candidate.state.versions).not.toBe(COMPATIBILITY_VERSIONS)
      expect(Object.isFrozen(candidate.state.versions)).toBe(true)
    }
  })
})
