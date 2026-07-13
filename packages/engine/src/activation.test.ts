import { describe, expect, it } from "vitest"
import type { Soldier } from "@cowards/spec"
import { getRoundPlayerOrder } from "./activation.js"
import { CANDIDATE_MATCH_KERNEL } from "./kernel/driver.js"
import type { MatchMachine } from "./kernel/types.js"
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

const runActivation = (
  state: GameState,
  runtime: StrategyRuntime,
  soldierId: string,
) => {
  const execution = CANDIDATE_MATCH_KERNEL.runActivationFromState({
    state,
    runtime,
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

const bottomSelectionEffect = (state: GameState) => {
  const created = CANDIDATE_MATCH_KERNEL.createMachine(baseInput)
  let machine: MatchMachine = {
    ...created,
    state,
    initialState: state,
    cursor: {
      ...created.cursor,
      phaseNumber: state.phaseNumber,
      roundNumber: state.roundNumber,
    },
  }
  const matchStarted = CANDIDATE_MATCH_KERNEL.stepMatch(machine, {
    kind: "advance",
  })
  if (matchStarted.kind !== "transition") {
    throw new Error("candidate match-start transition missing")
  }
  machine = matchStarted.machine
  const roundStarted = CANDIDATE_MATCH_KERNEL.stepMatch(machine, {
    kind: "advance",
  })
  if (roundStarted.kind !== "transition") {
    throw new Error("candidate round-start transition missing")
  }
  const effect = CANDIDATE_MATCH_KERNEL.stepMatch(roundStarted.machine, {
    kind: "advance",
  })
  if (effect.kind !== "effect") {
    throw new Error("candidate selection effect missing")
  }
  return effect
}

describe("activation selection and runtime inputs", () => {
  it("uses the A B B A snake pattern for Round 2", () => {
    expect(getRoundPlayerOrder("A", "B", 2)).toEqual(["A", "B", "B", "A"])
  })

  it("rejects an invalid retained prefix without backfilling from excess orders", () => {
    const state = createInitialGameState(baseInput)
    const [first, second, third] = state.soldiers
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
    const effect = bottomSelectionEffect(withStatuses)
    const result = CANDIDATE_MATCH_KERNEL.stepMatch(effect.machine, {
      kind: "runtime_resume",
      requestId: effect.request.requestId,
      effectKind: effect.request.kind,
      classification: "success",
      value: {
        activationOrders: [
          { soldierId: first!.id },
          { soldierId: first!.id },
          { soldierId: second!.id },
          { soldierId: third!.id },
        ],
        strategyMemory: {},
      },
    })
    expect(result.kind).toBe("transition")
    if (result.kind !== "transition") return
    expect(result.machine.selections.bottom).toEqual([])
    expect(result.record.classification).toBe("player_violation")
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
    const result = runActivation(state, runtime, state.soldiers[0]!.id)
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
    const [mover, , , , , , , , opponent] =
      createInitialGameState(baseInput).soldiers
    const state = stateWithSoldiers([
      { ...mover!, position: { x: 5, y: 5 } },
      { ...opponent!, position: { x: 9, y: 9 } },
    ])
    let calls = 0
    const runtime = createFakeRuntime({
      action: () => {
        calls += 1
        return calls === 1
          ? { type: "MOVE", direction: "UP" }
          : { type: "MOVE", direction: "DOWN" }
      },
    })
    const result = runActivation(state, runtime, mover!.id)
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

    const result = runActivation(
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

    const result = runActivation(state, runtime, "mover")

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

const orderMatrixInitialState = createInitialGameState(baseInput)
const firstBottomId = orderMatrixInitialState.soldiers[0]!.id
const secondBottomId = orderMatrixInitialState.soldiers[1]!.id
const inactiveBottomId = orderMatrixInitialState.soldiers[2]!.id
const firstTopId = orderMatrixInitialState.soldiers[8]!.id

const retainedPrefixCases: Array<{
  classification: string
  position: "inside" | "outside"
  quota: 1 | 2
  rawOrders: unknown[]
  expectedViolation: boolean
  expectedOrderIds: string[]
}> = [
  {
    classification: "valid",
    position: "inside",
    quota: 1,
    rawOrders: [{ soldierId: firstBottomId }],
    expectedViolation: false,
    expectedOrderIds: [firstBottomId],
  },
  {
    classification: "valid",
    position: "outside",
    quota: 1,
    rawOrders: [{ soldierId: firstBottomId }, { soldierId: secondBottomId }],
    expectedViolation: false,
    expectedOrderIds: [firstBottomId],
  },
  {
    classification: "malformed",
    position: "inside",
    quota: 1,
    rawOrders: [{ soldierId: 42 }, { soldierId: firstBottomId }],
    expectedViolation: true,
    expectedOrderIds: [],
  },
  {
    classification: "malformed",
    position: "outside",
    quota: 1,
    rawOrders: [{ soldierId: firstBottomId }, { soldierId: 42 }],
    expectedViolation: false,
    expectedOrderIds: [firstBottomId],
  },
  {
    classification: "duplicate",
    position: "inside",
    quota: 2,
    rawOrders: [
      { soldierId: firstBottomId },
      { soldierId: firstBottomId },
      { soldierId: secondBottomId },
    ],
    expectedViolation: true,
    expectedOrderIds: [],
  },
  {
    classification: "duplicate",
    position: "outside",
    quota: 1,
    rawOrders: [{ soldierId: firstBottomId }, { soldierId: firstBottomId }],
    expectedViolation: false,
    expectedOrderIds: [firstBottomId],
  },
  {
    classification: "unknown",
    position: "inside",
    quota: 1,
    rawOrders: [{ soldierId: "unknown-soldier" }, { soldierId: firstBottomId }],
    expectedViolation: true,
    expectedOrderIds: [],
  },
  {
    classification: "unknown",
    position: "outside",
    quota: 1,
    rawOrders: [{ soldierId: firstBottomId }, { soldierId: "unknown-soldier" }],
    expectedViolation: false,
    expectedOrderIds: [firstBottomId],
  },
  {
    classification: "wrong-owner",
    position: "inside",
    quota: 1,
    rawOrders: [{ soldierId: firstTopId }, { soldierId: firstBottomId }],
    expectedViolation: true,
    expectedOrderIds: [],
  },
  {
    classification: "wrong-owner",
    position: "outside",
    quota: 1,
    rawOrders: [{ soldierId: firstBottomId }, { soldierId: firstTopId }],
    expectedViolation: false,
    expectedOrderIds: [firstBottomId],
  },
  {
    classification: "inactive",
    position: "inside",
    quota: 1,
    rawOrders: [{ soldierId: inactiveBottomId }, { soldierId: firstBottomId }],
    expectedViolation: true,
    expectedOrderIds: [],
  },
  {
    classification: "inactive",
    position: "outside",
    quota: 1,
    rawOrders: [{ soldierId: firstBottomId }, { soldierId: inactiveBottomId }],
    expectedViolation: false,
    expectedOrderIds: [firstBottomId],
  },
]

describe.each(retainedPrefixCases)(
  "retained prefix: $classification order $position the quota",
  ({
    classification,
    position,
    quota,
    rawOrders,
    expectedViolation,
    expectedOrderIds,
  }) => {
    it("caps raw entries before shape and semantic validation", () => {
      const state: GameState = {
        ...orderMatrixInitialState,
        roundNumber: quota === 2 ? 2 : 1,
        activationCount: quota,
        soldiers: orderMatrixInitialState.soldiers.map((candidate) =>
          candidate.id === inactiveBottomId
            ? { ...candidate, status: "STONE" as const }
            : candidate,
        ),
      }
      const caseId = `${classification}-${position}`
      const effect = bottomSelectionEffect(state)
      const result = CANDIDATE_MATCH_KERNEL.stepMatch(effect.machine, {
        kind: "runtime_resume",
        requestId: effect.request.requestId,
        effectKind: effect.request.kind,
        classification: "success",
        value: {
          activationOrders: rawOrders,
          strategyMemory: { caseId },
        },
      })
      expect(result.kind).toBe("transition")
      if (result.kind !== "transition") return
      const expectedState = expectedViolation
        ? state
        : {
            ...state,
            players: state.players.map((player) =>
              player.id === "bottom-player"
                ? { ...player, strategyMemory: { caseId } }
                : player,
            ),
          }

      expect(result.machine.selections.bottom).toEqual(
        expectedOrderIds.map((soldierId) => ({ soldierId })),
      )
      expect(result.machine.state).toEqual(expectedState)
      expect(
        result.record.events.map(({ type, payload, context, privacy }) => ({
          type,
          payload,
          context,
          privacy,
        })),
      ).toEqual([
        expectedViolation
          ? {
              type: "RUNTIME_VIOLATION",
              payload: { playerId: "bottom-player", type: "INVALID_OUTPUT" },
              context: { actingPlayerId: "bottom-player" },
              privacy: "owner",
            }
          : {
              type: "STRATEGY_EVALUATED",
              payload: { playerId: "bottom-player" },
              context: { actingPlayerId: "bottom-player" },
              privacy: "owner",
            },
      ])
    })
  },
)
