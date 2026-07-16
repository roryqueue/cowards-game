import { describe, expect, it } from "vitest"
import type { Soldier } from "@cowards/spec"
import { MATCH_KERNEL } from "./kernel/driver.js"
import { createInitialGameState } from "./state.js"
import { adaptRuntimeForCurrentKernel } from "./test/current-kernel-runtime.js"
import {
  success,
  type GameState,
  type CanonicalStrategyRuntime,
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

const runActivation = (
  state: GameState,
  runtime: CanonicalStrategyRuntime,
  soldierId: string,
): TransitionResult => {
  const execution = MATCH_KERNEL.runActivationFromState({
    state,
    runtime: adaptRuntimeForCurrentKernel(runtime),
    soldierId,
  })
  expect(execution.kind).toBe("completed")
  if (execution.kind !== "completed" || execution.result === undefined) {
    throw new Error(
      `candidate activation failed: ${execution.failure?.code ?? "missing result"}`,
    )
  }
  return execution.result
}

describe("approved lifecycle behavior through the candidate authority", () => {
  it("ignores a malformed excess order after the retained prefix", () => {
    const initial = MATCH_KERNEL.createMachine(baseInput)
    const matchStarted = MATCH_KERNEL.stepMatch(initial, {
      kind: "advance",
    })
    expect(matchStarted.kind).toBe("transition")
    if (matchStarted.kind !== "transition") return
    const roundStarted = MATCH_KERNEL.stepMatch(
      matchStarted.machine,
      { kind: "advance" },
    )
    expect(roundStarted.kind).toBe("transition")
    if (roundStarted.kind !== "transition") return
    const selectionEffect = MATCH_KERNEL.stepMatch(
      roundStarted.machine,
      { kind: "advance" },
    )
    expect(selectionEffect.kind).toBe("effect")
    if (selectionEffect.kind !== "effect") return

    const retainedSoldierId = initial.state.soldiers[0]!.id
    const resolved = MATCH_KERNEL.stepMatch(selectionEffect.machine, {
      kind: "runtime_resume",
      requestId: selectionEffect.request.requestId,
      effectKind: selectionEffect.request.kind,
      classification: "success",
      value: {
        activationOrders: [{ soldierId: retainedSoldierId }, { soldierId: 42 }],
        strategyMemory: { selection: "retained-prefix" },
      },
    })
    expect(resolved.kind).toBe("transition")
    if (resolved.kind !== "transition") return

    expect(resolved.machine.selections.bottom).toEqual([
      { soldierId: retainedSoldierId },
    ])
    expect(resolved.machine.state.players[0].strategyMemory).toEqual({
      selection: "retained-prefix",
    })
    expect(resolved.record.classification).toBe("success")
    expect(resolved.record.events.map(({ type }) => type)).toEqual([
      "STRATEGY_EVALUATED",
    ])
  })

  it("closes no-Advance cleanup before the immediate outcome", () => {
    const state = stateWith([
      soldier({ id: "last-bottom", lastSuccessfulMoveDirection: "UP" }),
      soldier({
        id: "last-top",
        ownerPlayerId: "top",
        position: { x: 9, y: 9 },
      }),
    ])
    const observedCycles: number[] = []
    const runtime: CanonicalStrategyRuntime = {
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

    const result = runActivation(state, runtime, "last-bottom")
    const activationContext = {
      activationId: "1:1:0",
      activationIndex: 0,
      actingPlayerId: "bottom",
      soldierId: "last-bottom",
    }
    const cycleContext = { ...activationContext, cycleIndex: 0 }

    expect(result.state).toEqual({
      ...state,
      phase: "COMPLETE",
      soldiers: [
        { ...state.soldiers[0]!, status: "STONE" },
        state.soldiers[1]!,
      ],
      outcome: { type: "WIN", winnerPlayerId: "top" },
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
      {
        type: "MATCH_ENDED",
        payload: { type: "WIN", winnerPlayerId: "top" },
      },
    ])
    expect(observedCycles).toEqual([0])
    expect(
      result.events.filter(({ type }) => type === "MATCH_ENDED"),
    ).toHaveLength(1)
    expect(result.events.at(-1)?.type).toBe("MATCH_ENDED")
  })

  it("closes a Cycle-end Backstabbed actor exactly once before outcome", () => {
    const state = stateWith([
      soldier({ id: "actor", position: { x: 5, y: 5 }, facing: "UP" }),
      soldier({
        id: "enemy",
        ownerPlayerId: "top",
        position: { x: 4, y: 5 },
        facing: "DOWN",
      }),
    ])
    const observedCycles: number[] = []
    const runtime: CanonicalStrategyRuntime = {
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

    const result = runActivation(state, runtime, "actor")
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
    expect(publicEventContract(result.events)).toEqual([
      {
        type: "ACTIVATION_STARTED",
        payload: { soldierId: "actor" },
        context: activationContext,
      },
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
        type: "ACTIVATION_ENDED",
        payload: { soldierId: "actor", reason: "BACKSTABBED" },
        context: activationContext,
      },
      {
        type: "MATCH_ENDED",
        payload: { type: "WIN", winnerPlayerId: "top" },
      },
    ])
    expect(observedCycles).toEqual([0])
    expect(
      result.events.filter(({ type }) => type === "ACTIVATION_ENDED"),
    ).toHaveLength(1)
    expect(result.events.at(-2)?.payload).toEqual({
      soldierId: "actor",
      reason: "BACKSTABBED",
    })
  })
})
