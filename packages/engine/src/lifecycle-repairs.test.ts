import { describe, expect, it } from "vitest"
import type { Soldier } from "@cowards/spec"
import {
  resolveActivation,
  resolveActivationCycle,
  resolveActivationSelection,
} from "./activation.js"
import { createInitialGameState } from "./state.js"
import {
  success,
  type ActivationSlotState,
  type GameState,
  type StrategyRuntime,
  type TransitionResult,
} from "./types.js"

const baseInput = {
  matchId: "match-lifecycle-repairs",
  seed: "lifecycle-repairs-seed",
  arenaVariant: {
    id: "lifecycle-repairs-arena",
    name: "Lifecycle Repairs Arena",
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

const publicEventContract = (events: TransitionResult["events"]) =>
  events.map(({ type, payload, context }) => ({
    type,
    payload,
    ...(context === undefined ? {} : { context }),
  }))

describe("staged legacy lifecycle observations before candidate activation", () => {
  it("keeps whole-output validation for malformed excess orders on the legacy path", () => {
    const state = createInitialGameState(baseInput)
    const retainedSoldierId = state.soldiers[0]!.id
    const observations: unknown[] = []
    const runtime: StrategyRuntime = {
      selectActivations: (input) => {
        observations.push(input)
        return success({
          activationOrders: [
            { soldierId: retainedSoldierId },
            { soldierId: 42 as never },
          ],
          strategyMemory: { selection: "retained-prefix" },
        })
      },
      runSoldierBrain: () => {
        throw new Error("selection must not execute SoldierBrain")
      },
    }

    const result = resolveActivationSelection(state, runtime, "bottom")

    expect(result.state.orders).toEqual([])
    expect(result.state.state.players[0].strategyMemory).toEqual({})
    expect(result.events).toMatchObject([
      {
        type: "RUNTIME_VIOLATION",
        payload: { playerId: "bottom", type: "INVALID_OUTPUT" },
        context: { actingPlayerId: "bottom" },
      },
    ])
    expect(
      result.events.filter((event) => event.type === "RUNTIME_VIOLATION"),
    ).toHaveLength(1)
    expect(observations).toHaveLength(1)
  })

  it("stages the legacy no-Advance state without immediate outcome", () => {
    const state = stateWith([
      soldier({
        id: "last-bottom",
        lastSuccessfulMoveDirection: "UP",
      }),
      soldier({
        id: "last-top",
        ownerPlayerId: "top",
        position: { x: 9, y: 9 },
      }),
    ])
    const observedCycles: number[] = []
    const runtime: StrategyRuntime = {
      selectActivations: () =>
        success({ activationOrders: [], strategyMemory: {} }),
      runSoldierBrain: (input) => {
        observedCycles.push(input.cycleIndex)
        return success({
          action: { type: "MOVE", direction: "DOWN" },
          soldierMemory: input.soldierMemory,
        })
      },
    }

    const result = resolveActivation(state, runtime, "last-bottom")
    const activationContext = {
      activationId: "1:1:0",
      activationIndex: 0,
      actingPlayerId: "bottom",
      soldierId: "last-bottom",
    }
    const cycleContext = { ...activationContext, cycleIndex: 0 }

    expect(result.state).toEqual({
      ...state,
      soldiers: [
        { ...state.soldiers[0]!, status: "STONE" },
        state.soldiers[1]!,
      ],
    })
    expect(publicEventContract(result.events)).toEqual([
      {
        type: "ACTIVATION_STARTED",
        payload: { soldierId: "last-bottom" },
        context: activationContext,
      },
      {
        type: "CYCLE_STARTED",
        payload: { soldierId: "last-bottom", cycleIndex: 0 },
        context: cycleContext,
      },
      {
        type: "AWARENESS_GRID_OBSERVED",
        payload: { soldierId: "last-bottom", cycleIndex: 0 },
        context: cycleContext,
      },
      {
        type: "ACTION_EMITTED",
        payload: {
          soldierId: "last-bottom",
          action: { type: "MOVE", direction: "DOWN" },
        },
        context: cycleContext,
      },
      {
        type: "MOVE_BLOCKED",
        payload: { soldierId: "last-bottom", reason: "IMMEDIATE_REVERSAL" },
        context: cycleContext,
      },
      {
        type: "CYCLE_ENDED",
        payload: { soldierId: "last-bottom", cycleIndex: 0 },
        context: cycleContext,
      },
      {
        type: "SOLDIER_STONED",
        payload: { soldierId: "last-bottom", reason: "NO_ADVANCE" },
        context: activationContext,
      },
      {
        type: "ACTIVATION_ENDED",
        payload: { soldierId: "last-bottom", reason: "INVALID_MOVE" },
        context: activationContext,
      },
    ])
    expect(observedCycles).toEqual([0])
    expect(
      result.events.filter((event) => event.type === "MATCH_ENDED"),
    ).toHaveLength(0)
    expect(result.events.at(-1)?.type).toBe("ACTIVATION_ENDED")
    expect(
      result.events.some((event) => event.type === "ACTIVATION_SKIPPED"),
    ).toBe(false)
  })

  it("stages the legacy Cycle-end Backstab MATCH_ENDED slot reason", () => {
    const state = stateWith([
      soldier({ id: "actor", position: { x: 5, y: 5 }, facing: "UP" }),
      soldier({
        id: "enemy",
        ownerPlayerId: "top",
        position: { x: 4, y: 5 },
        facing: "DOWN",
      }),
    ])
    const slot: ActivationSlotState = {
      activationId: "1:1:0",
      activationIndex: 0,
      actingPlayerId: "bottom",
      soldierId: "actor",
      cycleIndex: 0,
      advanced: false,
      ended: false,
    }
    const observedCycles: number[] = []
    const runtime: StrategyRuntime = {
      selectActivations: () =>
        success({ activationOrders: [], strategyMemory: {} }),
      runSoldierBrain: (input) => {
        observedCycles.push(input.cycleIndex)
        return success({
          action: { type: "TURN", direction: "RIGHT" },
          soldierMemory: input.soldierMemory,
        })
      },
    }

    const result = resolveActivationCycle(state, runtime, slot, 0)
    const activationContext = {
      activationId: "1:1:0",
      activationIndex: 0,
      actingPlayerId: "bottom",
      soldierId: "actor",
    }
    const cycleContext = { ...activationContext, cycleIndex: 0 }

    expect(result.state).toEqual({
      ...state,
      phase: "COMPLETE",
      soldiers: [
        { ...state.soldiers[0]!, facing: "RIGHT", status: "STONE" },
        state.soldiers[1]!,
      ],
      outcome: { type: "WIN", winnerPlayerId: "top" },
    })
    expect(result.slot).toEqual({
      ...slot,
      cycleIndex: 1,
      ended: true,
      terminalReason: "MATCH_ENDED",
    })
    expect(publicEventContract(result.events)).toEqual([
      {
        type: "CYCLE_STARTED",
        payload: { soldierId: "actor", cycleIndex: 0 },
        context: cycleContext,
      },
      {
        type: "AWARENESS_GRID_OBSERVED",
        payload: { soldierId: "actor", cycleIndex: 0 },
        context: cycleContext,
      },
      {
        type: "ACTION_EMITTED",
        payload: {
          soldierId: "actor",
          action: { type: "TURN", direction: "RIGHT" },
        },
        context: cycleContext,
      },
      {
        type: "TURN_RESOLVED",
        payload: { soldierId: "actor", direction: "RIGHT" },
        context: cycleContext,
      },
      {
        type: "BACKSTAB_RESOLVED",
        payload: {
          boundary: "cycle-end",
          pairs: [{ attackerId: "enemy", victimId: "actor" }],
        },
        context: cycleContext,
      },
      {
        type: "SOLDIER_STONED",
        payload: { soldierId: "actor", reason: "BACKSTAB" },
        context: cycleContext,
      },
      {
        type: "CYCLE_ENDED",
        payload: { soldierId: "actor", cycleIndex: 0 },
        context: cycleContext,
      },
      {
        type: "MATCH_ENDED",
        payload: { type: "WIN", winnerPlayerId: "top" },
      },
    ])
    expect(observedCycles).toEqual([0])
    expect(
      result.events.filter((event) => event.type === "ACTIVATION_ENDED"),
    ).toHaveLength(0)
    expect(
      result.events.filter((event) => event.type === "MATCH_ENDED"),
    ).toHaveLength(1)
    expect(result.events.at(-1)?.type).toBe("MATCH_ENDED")
  })
})
