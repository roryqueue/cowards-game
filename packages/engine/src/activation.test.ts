import { describe, expect, it } from "vitest"
import type { Soldier } from "@cowards/spec"
import {
  getRoundPlayerOrder,
  resolveActivation,
  resolveActivationSelection,
} from "./activation.js"
import { createInitialGameState } from "./state.js"
import {
  createStrategyInput,
  createSoldierBrainInput,
} from "./runtime-inputs.js"
import { createFakeRuntime } from "./test/fake-runtime.js"
import { violation, type GameState, type StrategyRuntime } from "./types.js"

const baseInput = {
  matchId: "match-activation",
  seed: "activation-seed",
  arenaVariant: {
    id: "arena",
    name: "Arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [],
  },
  bottomPlayerId: "bottom-player",
  topPlayerId: "top-player",
  bottomStrategyRevisionId: "bottom-rev",
  topStrategyRevisionId: "top-rev",
}

const stateWithSoldiers = (soldiers: Soldier[]): GameState => ({
  ...createInitialGameState(baseInput),
  soldiers,
})

describe("activation selection and runtime inputs", () => {
  it("uses the A B B A snake pattern for Round 2", () => {
    expect(getRoundPlayerOrder("A", "B", 2)).toEqual(["A", "B", "B", "A"])
  })

  it("filters duplicate, STONE, FALLEN, and excess activation orders", () => {
    const state = createInitialGameState(baseInput)
    const [first, second, third] = state.soldiers
    const runtime = createFakeRuntime({
      selectActivations: () => [
        { soldierId: first!.id },
        { soldierId: first!.id },
        { soldierId: second!.id },
        { soldierId: third!.id },
      ],
    })
    const withStatuses = {
      ...state,
      roundNumber: 2 as const,
      activationCount: 2 as const,
      soldiers: state.soldiers.map((soldier) =>
        soldier.id === second!.id
          ? { ...soldier, status: "STONE" as const }
          : soldier.id === third!.id
            ? { ...soldier, status: "FALLEN" as const, position: null }
            : soldier,
      ),
    }
    const result = resolveActivationSelection(
      withStatuses,
      runtime,
      "bottom-player",
    )
    expect(result.state.orders).toEqual([{ soldierId: first!.id }])
  })

  it("builds StrategyInput and SoldierBrainInput with limited visibility", () => {
    const state = createInitialGameState(baseInput)
    const strategyInput = createStrategyInput(state, "bottom-player")
    expect(strategyInput.board.soldiers).toHaveLength(16)
    expect(strategyInput.mySoldiers).toHaveLength(8)

    const brainInput = createSoldierBrainInput(
      state,
      state.soldiers[0]!.id,
      0,
      { role: "advance" },
    )
    expect(brainInput.maxCycles).toBe(12)
    expect(brainInput.awarenessGrid.cells).toHaveLength(25)
    expect(brainInput.self.id).toBe(state.soldiers[0]!.id)
  })

  it("stones a Soldier after a RuntimeViolation with no-advance", () => {
    const state = createInitialGameState(baseInput)
    const runtime: StrategyRuntime = {
      selectActivations: createFakeRuntime().selectActivations,
      runSoldierBrain: () => violation("TIMEOUT", "RuntimeViolation timeout"),
    }
    const result = resolveActivation(state, runtime, state.soldiers[0]!.id)
    expect(
      result.events.some((summary) => summary.type === "RUNTIME_VIOLATION"),
    ).toBe(true)
    expect(
      result.state.soldiers.find(
        (soldier) => soldier.id === state.soldiers[0]!.id,
      )?.status,
    ).toBe("STONE")
  })

  it("does not stone a Soldier when an earlier Advance protects from no-advance cleanup", () => {
    const [mover] = createInitialGameState(baseInput).soldiers
    const state = stateWithSoldiers([{ ...mover!, position: { x: 5, y: 5 } }])
    let calls = 0
    const runtime = createFakeRuntime({
      action: () => {
        calls += 1
        return calls === 1
          ? { type: "MOVE", direction: "UP" }
          : { type: "MOVE", direction: "DOWN" }
      },
    })
    const result = resolveActivation(state, runtime, mover!.id)
    expect(result.state.soldiers[0]!.status).toBe("ACTIVE")
  })

  it("keeps blocked movement non-terminal and allows a later Cycle", () => {
    const [mover, , , , , , , , opponent] =
      createInitialGameState(baseInput).soldiers
    const state = stateWithSoldiers([
      {
        ...mover!,
        id: "mover",
        position: { x: 5, y: 5 },
        facing: "UP",
      },
      {
        ...opponent!,
        id: "opponent",
        ownerPlayerId: "top-player",
        position: { x: 9, y: 9 },
      },
    ])
    let calls = 0
    const runtime = createFakeRuntime({
      action: () => {
        calls += 1
        return calls === 1
          ? { type: "MOVE", direction: "UP" }
          : { type: "TURN_TO_STONE" }
      },
    })

    const result = resolveActivation(
      { ...state, terrainStones: [{ x: 5, y: 4 }] },
      runtime,
      "mover",
    )

    expect(calls).toBe(2)
    expect(result.events.map((summary) => summary.type)).toEqual(
      expect.arrayContaining(["MOVE_BLOCKED", "CYCLE_ENDED"]),
    )
  })

  it("ends immediately when a push off-board eliminates a player", () => {
    const state = {
      ...stateWithSoldiers([
        {
          ...createInitialGameState(baseInput).soldiers[0]!,
          id: "mover",
          ownerPlayerId: "bottom-player",
          position: { x: 4, y: 5 },
          facing: "RIGHT",
        },
        {
          ...createInitialGameState(baseInput).soldiers[8]!,
          id: "target",
          ownerPlayerId: "top-player",
          position: { x: 5, y: 5 },
          facing: "UP",
        },
      ]),
      bounds: { minX: 0, maxX: 5, minY: 0, maxY: 11 },
    }
    let calls = 0
    const runtime = createFakeRuntime({
      action: () => {
        calls += 1
        return calls === 1
          ? { type: "MOVE", direction: "RIGHT" }
          : { type: "TURN_TO_STONE" }
      },
    })

    const result = resolveActivation(state, runtime, "mover")

    expect(calls).toBe(1)
    expect(result.state.outcome).toEqual({
      type: "WIN",
      winnerPlayerId: "bottom-player",
    })
    expect(result.events.map((summary) => summary.type)).toContain(
      "MATCH_ENDED",
    )
  })
})
