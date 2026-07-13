import { describe, expect, it } from "vitest"
import type { Soldier } from "@cowards/spec"
import { createFakeRuntime } from "../test/fake-runtime.js"
import type { GameState, TransitionEventSummary } from "../types.js"
import {
  createCandidateActivationMachine,
  createCandidateMatchMachine,
  runCandidateActivationFromState,
} from "./driver.js"
import { stepCandidateMatch } from "./step.js"
import type {
  CandidateActivationExecution,
  KernelRecorderMaterial,
  KernelStepResult,
  MatchMachine,
} from "./types.js"

const baseInput = {
  matchId: "candidate-lifecycle-repairs",
  seed: "candidate-lifecycle-repairs-seed",
  arenaVariant: {
    id: "candidate-lifecycle-repairs-arena",
    name: "Candidate lifecycle repairs arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [],
  },
  bottomPlayerId: "bottom",
  topPlayerId: "top",
  bottomStrategyRevisionId: "bottom-revision",
  topStrategyRevisionId: "top-revision",
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

const publicEvents = (events: readonly TransitionEventSummary[]) =>
  events.map(({ type, payload, context }) => ({
    type,
    payload,
    ...(context === undefined ? {} : { context }),
  }))

const requireCompleted = (
  execution: CandidateActivationExecution,
): {
  result: NonNullable<CandidateActivationExecution["result"]>
  recorderMaterial: KernelRecorderMaterial
} => {
  expect(execution.kind).toBe("completed")
  if (
    execution.kind !== "completed" ||
    execution.result === undefined ||
    execution.recorderMaterial === undefined
  ) {
    throw new Error(
      `candidate execution failed: ${execution.failure?.code ?? "missing result"}`,
    )
  }
  return {
    result: execution.result,
    recorderMaterial: execution.recorderMaterial,
  }
}

const advance = (machine: MatchMachine): MatchMachine => {
  const result = stepCandidateMatch(machine, { kind: "advance" })
  expect(result.kind).toBe("transition")
  if (result.kind !== "transition") {
    throw new Error(`expected transition, received ${result.kind}`)
  }
  return result.machine
}

const bottomSelectionEffect = (
  quota: 1 | 2,
  inactiveSoldierId: string,
): Extract<KernelStepResult, { kind: "effect" }> => {
  const created = createCandidateMatchMachine(baseInput)
  const state: GameState = {
    ...created.state,
    roundNumber: quota === 2 ? 2 : 1,
    activationCount: quota,
    soldiers: created.state.soldiers.map((candidate) =>
      candidate.id === inactiveSoldierId
        ? { ...candidate, status: "STONE" as const }
        : candidate,
    ),
  }
  let machine: MatchMachine = {
    ...created,
    state,
    initialState: state,
    cursor: {
      ...created.cursor,
      roundNumber: state.roundNumber,
    },
  }
  machine = advance(machine)
  machine = advance(machine)
  const effect = stepCandidateMatch(machine, { kind: "advance" })
  expect(effect.kind).toBe("effect")
  if (effect.kind !== "effect") {
    throw new Error(`expected selection effect, received ${effect.kind}`)
  }
  return effect
}

const retainedPrefixCases: Array<{
  classification: string
  position: "inside" | "outside"
  quota: 1 | 2
  rawOrders: (ids: {
    first: string
    second: string
    inactive: string
    opponent: string
  }) => unknown[]
  expectedViolation: boolean
  expectedOrder: "first" | "none"
}> = [
  {
    classification: "valid",
    position: "inside",
    quota: 1,
    rawOrders: ({ first }) => [{ soldierId: first }],
    expectedViolation: false,
    expectedOrder: "first",
  },
  {
    classification: "valid",
    position: "outside",
    quota: 1,
    rawOrders: ({ first, second }) => [
      { soldierId: first },
      { soldierId: second },
    ],
    expectedViolation: false,
    expectedOrder: "first",
  },
  {
    classification: "malformed",
    position: "inside",
    quota: 1,
    rawOrders: ({ first }) => [{ soldierId: 42 }, { soldierId: first }],
    expectedViolation: true,
    expectedOrder: "none",
  },
  {
    classification: "malformed",
    position: "outside",
    quota: 1,
    rawOrders: ({ first }) => [{ soldierId: first }, { soldierId: 42 }],
    expectedViolation: false,
    expectedOrder: "first",
  },
  {
    classification: "duplicate",
    position: "inside",
    quota: 2,
    rawOrders: ({ first, second }) => [
      { soldierId: first },
      { soldierId: first },
      { soldierId: second },
    ],
    expectedViolation: true,
    expectedOrder: "none",
  },
  {
    classification: "duplicate",
    position: "outside",
    quota: 1,
    rawOrders: ({ first }) => [{ soldierId: first }, { soldierId: first }],
    expectedViolation: false,
    expectedOrder: "first",
  },
  {
    classification: "unknown",
    position: "inside",
    quota: 1,
    rawOrders: ({ first }) => [
      { soldierId: "unknown-soldier" },
      { soldierId: first },
    ],
    expectedViolation: true,
    expectedOrder: "none",
  },
  {
    classification: "unknown",
    position: "outside",
    quota: 1,
    rawOrders: ({ first }) => [
      { soldierId: first },
      { soldierId: "unknown-soldier" },
    ],
    expectedViolation: false,
    expectedOrder: "first",
  },
  {
    classification: "wrong-owner",
    position: "inside",
    quota: 1,
    rawOrders: ({ first, opponent }) => [
      { soldierId: opponent },
      { soldierId: first },
    ],
    expectedViolation: true,
    expectedOrder: "none",
  },
  {
    classification: "wrong-owner",
    position: "outside",
    quota: 1,
    rawOrders: ({ first, opponent }) => [
      { soldierId: first },
      { soldierId: opponent },
    ],
    expectedViolation: false,
    expectedOrder: "first",
  },
  {
    classification: "inactive",
    position: "inside",
    quota: 1,
    rawOrders: ({ first, inactive }) => [
      { soldierId: inactive },
      { soldierId: first },
    ],
    expectedViolation: true,
    expectedOrder: "none",
  },
  {
    classification: "inactive",
    position: "outside",
    quota: 1,
    rawOrders: ({ first, inactive }) => [
      { soldierId: first },
      { soldierId: inactive },
    ],
    expectedViolation: false,
    expectedOrder: "first",
  },
]

describe("candidate-only approved lifecycle repairs", () => {
  describe.each(retainedPrefixCases)(
    "retained prefix: $classification order $position the quota",
    ({ quota, rawOrders, expectedViolation, expectedOrder }) => {
      it("caps raw activation orders before validating every retained entry", () => {
        const inactive = "bottom-soldier-3"
        const yielded = bottomSelectionEffect(quota, inactive)
        const ids = {
          first: "bottom-soldier-1",
          second: "bottom-soldier-2",
          inactive,
          opponent: "top-soldier-1",
        }
        const resumed = stepCandidateMatch(yielded.machine, {
          kind: "runtime_resume",
          requestId: yielded.request.requestId,
          effectKind: yielded.request.kind,
          classification: "success",
          value: {
            activationOrders: rawOrders(ids),
            strategyMemory: { case: "retained-prefix" },
          },
        })
        expect(resumed.kind).toBe("transition")
        if (resumed.kind !== "transition") return

        expect(resumed.machine.selections.bottom).toEqual(
          expectedOrder === "first" ? [{ soldierId: ids.first }] : [],
        )
        expect(resumed.record.classification).toBe(
          expectedViolation ? "player_violation" : "success",
        )
        expect(resumed.record.events.map((entry) => entry.type)).toEqual([
          expectedViolation ? "RUNTIME_VIOLATION" : "STRATEGY_EVALUATED",
        ])
        expect(resumed.machine.state.players[0].strategyMemory).toEqual(
          expectedViolation ? {} : { case: "retained-prefix" },
        )
      })
    },
  )

  it("ends immediately after a violation stones the final active Soldier", () => {
    const seedMachine = createCandidateMatchMachine(baseInput)
    const state: GameState = {
      ...seedMachine.state,
      soldiers: [
        soldier({ id: "last-bottom" }),
        soldier({
          id: "last-top",
          ownerPlayerId: "top",
          position: { x: 9, y: 9 },
          facing: "DOWN",
        }),
      ],
    }
    const completed = requireCompleted(
      runCandidateActivationFromState({
        state,
        soldierId: "last-bottom",
        runtime: {
          selectActivations: () => ({
            ok: true,
            value: { activationOrders: [], strategyMemory: {} },
          }),
          runSoldierBrain: () => ({
            ok: false,
            violation: { type: "TIMEOUT", message: "fixture timeout" },
          }),
        },
      }),
    )

    expect(completed.result.state).toMatchObject({
      phase: "COMPLETE",
      outcome: { type: "WIN", winnerPlayerId: "top" },
    })
    expect(completed.recorderMaterial.events.map(({ type }) => type)).toEqual([
      "ACTIVATION_STARTED",
      "CYCLE_STARTED",
      "AWARENESS_GRID_OBSERVED",
      "RUNTIME_VIOLATION",
      "SOLDIER_STONED",
      "ACTIVATION_ENDED",
      "MATCH_ENDED",
    ])
    expect(
      completed.recorderMaterial.events.find(
        ({ type }) => type === "ACTIVATION_ENDED",
      )?.payload,
    ).toEqual({ soldierId: "last-bottom", reason: "RUNTIME_VIOLATION" })
    expect(
      completed.recorderMaterial.boundaries.find(
        ({ classification }) => classification === "player_violation",
      ),
    ).toMatchObject({
      terminalStatus: { type: "WIN", winnerPlayerId: "top" },
    })
  })

  it("closes a no-Advance invalid move before evaluating the immediate outcome", () => {
    const seedMachine = createCandidateMatchMachine(baseInput)
    const state: GameState = {
      ...seedMachine.state,
      soldiers: [
        soldier({ id: "last-bottom", lastSuccessfulMoveDirection: "UP" }),
        soldier({
          id: "last-top",
          ownerPlayerId: "top",
          position: { x: 9, y: 9 },
        }),
      ],
    }
    const completed = requireCompleted(
      runCandidateActivationFromState({
        state,
        soldierId: "last-bottom",
        runtime: createFakeRuntime({
          action: { type: "MOVE", direction: "DOWN" },
        }),
      }),
    )
    const activationContext = {
      activationId: "1:1:0",
      activationIndex: 0,
      actingPlayerId: "bottom",
      soldierId: "last-bottom",
    }
    const cycleContext = { ...activationContext, cycleIndex: 0 }

    expect(completed.result.state).toEqual({
      ...state,
      phase: "COMPLETE",
      soldiers: [
        { ...state.soldiers[0]!, status: "STONE" },
        state.soldiers[1]!,
      ],
      outcome: { type: "WIN", winnerPlayerId: "top" },
    })
    expect(publicEvents(completed.recorderMaterial.events)).toEqual([
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
  })

  it("closes a no-Advance cycle exhaustion before evaluating the immediate outcome", () => {
    const seedMachine = createCandidateMatchMachine(baseInput)
    const state: GameState = {
      ...seedMachine.state,
      soldiers: [
        soldier({ id: "last-bottom" }),
        soldier({
          id: "last-top",
          ownerPlayerId: "top",
          position: { x: 9, y: 9 },
        }),
      ],
    }
    const completed = requireCompleted(
      runCandidateActivationFromState({
        state,
        soldierId: "last-bottom",
        runtime: createFakeRuntime({
          action: { type: "TURN", direction: "UP" },
        }),
      }),
    )

    expect(completed.result.state).toEqual({
      ...state,
      phase: "COMPLETE",
      soldiers: [
        { ...state.soldiers[0]!, status: "STONE" },
        state.soldiers[1]!,
      ],
      outcome: { type: "WIN", winnerPlayerId: "top" },
    })
    expect(
      publicEvents(completed.recorderMaterial.events).slice(-3),
    ).toEqual([
      {
        type: "SOLDIER_STONED",
        payload: { soldierId: "last-bottom", reason: "NO_ADVANCE" },
        context: {
          activationId: "1:1:0",
          activationIndex: 0,
          actingPlayerId: "bottom",
          soldierId: "last-bottom",
        },
      },
      {
        type: "ACTIVATION_ENDED",
        payload: { soldierId: "last-bottom", reason: "CYCLE_EXHAUSTED" },
        context: {
          activationId: "1:1:0",
          activationIndex: 0,
          actingPlayerId: "bottom",
          soldierId: "last-bottom",
        },
      },
      {
        type: "MATCH_ENDED",
        payload: { type: "WIN", winnerPlayerId: "top" },
      },
    ])
  })

  it("closes a Cycle-end Backstabbed actor after the simultaneous scan and before outcome", () => {
    const machine = createCandidateMatchMachine(baseInput)
    const state: GameState = {
      ...machine.state,
      soldiers: [
        soldier({ id: "actor", position: { x: 5, y: 5 }, facing: "UP" }),
        soldier({
          id: "enemy",
          ownerPlayerId: "top",
          position: { x: 4, y: 5 },
          facing: "DOWN",
        }),
      ],
    }
    const completed = requireCompleted(
      runCandidateActivationFromState({
        state,
        soldierId: "actor",
        runtime: createFakeRuntime({
          action: { type: "TURN", direction: "RIGHT" },
        }),
      }),
    )
    const activationContext = {
      activationId: "1:1:0",
      activationIndex: 0,
      actingPlayerId: "bottom",
      soldierId: "actor",
    }
    const cycleContext = { ...activationContext, cycleIndex: 0 }

    expect(completed.result.state).toEqual({
      ...state,
      phase: "COMPLETE",
      soldiers: [
        { ...state.soldiers[0]!, facing: "RIGHT", status: "STONE" },
        state.soldiers[1]!,
      ],
      outcome: { type: "WIN", winnerPlayerId: "top" },
    })
    expect(publicEvents(completed.recorderMaterial.events)).toEqual([
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
  })

  it("emits every simultaneous Cycle-end Backstab effect before closing the actor", () => {
    const seedMachine = createCandidateMatchMachine(baseInput)
    const state: GameState = {
      ...seedMachine.state,
      soldiers: [
        soldier({ id: "actor", position: { x: 5, y: 5 }, facing: "UP" }),
        soldier({
          id: "enemy-attacker",
          ownerPlayerId: "top",
          position: { x: 4, y: 5 },
          facing: "DOWN",
        }),
        soldier({
          id: "friendly-attacker",
          position: { x: 8, y: 6 },
          facing: "UP",
        }),
        soldier({
          id: "enemy-victim",
          ownerPlayerId: "top",
          position: { x: 8, y: 5 },
          facing: "UP",
        }),
      ],
    }
    const machine = createCandidateActivationMachine({
      state,
      soldierId: "actor",
    })
    const ready: MatchMachine = {
      ...machine,
      cursor: { ...machine.cursor, stage: "soldier_effect" },
    }
    const yielded = stepCandidateMatch(ready, { kind: "advance" })
    expect(yielded.kind).toBe("effect")
    if (yielded.kind !== "effect") return
    const resolved = stepCandidateMatch(yielded.machine, {
      kind: "runtime_resume",
      requestId: yielded.request.requestId,
      effectKind: yielded.request.kind,
      classification: "success",
      value: {
        action: { type: "TURN", direction: "RIGHT" },
        soldierMemory: {},
      },
    })
    expect(resolved.kind).toBe("transition")
    if (resolved.kind !== "transition") return

    expect(resolved.record.events.map(({ type }) => type)).toEqual([
      "ACTION_EMITTED",
      "TURN_RESOLVED",
      "BACKSTAB_RESOLVED",
      "SOLDIER_STONED",
      "SOLDIER_STONED",
      "CYCLE_ENDED",
      "ACTIVATION_ENDED",
    ])
    expect(resolved.record.events[2]?.payload).toEqual({
      boundary: "cycle-end",
      pairs: [
        { attackerId: "enemy-attacker", victimId: "actor" },
        { attackerId: "friendly-attacker", victimId: "enemy-victim" },
      ],
    })
    expect(resolved.record.events.at(-1)?.payload).toEqual({
      soldierId: "actor",
      reason: "BACKSTABBED",
    })
    expect(resolved.machine.state.outcome).toBeUndefined()
  })
})
