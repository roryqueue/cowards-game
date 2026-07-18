import { describe, expect, it } from "vitest"
import type {
  Action,
  SoldierBrainInputV119,
  StrategyInputV117,
  StrategyInputV119,
} from "@cowards/spec"
import { MATCH_KERNEL } from "../index.js"
import { createCandidateInitialGameStateV119 } from "../kernel/create-initial-state.js"
import {
  createSoldierBrainInput,
  createStrategyInput,
  createStrategyInputV119,
} from "../runtime-inputs.js"
import { adaptRuntimeForCurrentKernel } from "./current-kernel-runtime.js"

const matchInput = {
  matchId: "phase-260-observation-v1-19",
  seed: "phase-260-observation-v1-19-seed",
  arenaVariant: {
    id: "phase-260-observation-arena",
    name: "Phase 260 observation arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [],
  },
  bottomPlayerId: "player:bottom",
  topPlayerId: "player:top",
  bottomStrategyRevisionId: "revision:bottom",
  topStrategyRevisionId: "revision:top",
}

describe("successor Strategy observations", () => {
  it("requires an entrant-owned explicit initial initiative", () => {
    const bottomFirst = createCandidateInitialGameStateV119({
      ...matchInput,
      initialInitiativePlayerId: matchInput.bottomPlayerId,
    })
    expect(bottomFirst).toMatchObject({
      ok: true,
      state: {
        initialInitiativePlayerId: matchInput.bottomPlayerId,
        initiativePlayerId: matchInput.bottomPlayerId,
      },
    })

    expect(
      createCandidateInitialGameStateV119({
        ...matchInput,
        initialInitiativePlayerId: "player:not-an-entrant",
      }),
    ).toMatchObject({ ok: false })
    expect(
      createCandidateInitialGameStateV119(matchInput as never),
    ).toMatchObject({ ok: false })
  })

  it("derives absolute and observer-relative initiative from canonical state", () => {
    const created = createCandidateInitialGameStateV119({
      ...matchInput,
      initialInitiativePlayerId: matchInput.bottomPlayerId,
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return

    expect(
      createStrategyInputV119(created.state, matchInput.bottomPlayerId),
    ).toMatchObject({
      initialInitiativePlayerId: matchInput.bottomPlayerId,
      hasInitialInitiative: true,
      roundInitiativePlayerId: matchInput.bottomPlayerId,
      hasRoundInitiative: true,
    })
    expect(
      createStrategyInputV119(created.state, matchInput.topPlayerId),
    ).toMatchObject({
      initialInitiativePlayerId: matchInput.bottomPlayerId,
      hasInitialInitiative: false,
      roundInitiativePlayerId: matchInput.bottomPlayerId,
      hasRoundInitiative: false,
    })
  })

  it("projects observations through the explicitly addressed runtime ABI", () => {
    const created = createCandidateInitialGameStateV119({
      ...matchInput,
      initialInitiativePlayerId: matchInput.bottomPlayerId,
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const historicalStrategy = createStrategyInput(
      created.state,
      matchInput.bottomPlayerId,
      "strategy-runtime-abi-v1.17",
    )
    expect(historicalStrategy).not.toHaveProperty("initialInitiativePlayerId")
    expect(historicalStrategy).not.toHaveProperty("roundInitiativePlayerId")
    expect(
      createStrategyInput(
        created.state,
        matchInput.bottomPlayerId,
        "strategy-runtime-abi-v1.14",
      ),
    ).toEqual(historicalStrategy)

    const successorStrategy = createStrategyInput(
      created.state,
      matchInput.bottomPlayerId,
      "strategy-runtime-abi-v1.19",
    ) as StrategyInputV119
    expect(successorStrategy).toMatchObject({
      initialInitiativePlayerId: matchInput.bottomPlayerId,
      hasInitialInitiative: true,
      roundInitiativePlayerId: matchInput.bottomPlayerId,
      hasRoundInitiative: true,
    })

    const historicalSoldier = createSoldierBrainInput(
      created.state,
      "bottom-soldier-1",
      0,
      undefined,
      true,
      "strategy-runtime-abi-v1.17",
    )
    expect(historicalSoldier).not.toHaveProperty("hasAdvancedThisActivation")
    expect(
      createSoldierBrainInput(
        created.state,
        "bottom-soldier-1",
        0,
        undefined,
        true,
        "strategy-runtime-abi-v1.14",
      ),
    ).toEqual(historicalSoldier)

    const successorSoldier = createSoldierBrainInput(
      created.state,
      "bottom-soldier-1",
      0,
      undefined,
      true,
      "strategy-runtime-abi-v1.19",
    ) as SoldierBrainInputV119
    expect(successorSoldier.hasAdvancedThisActivation).toBe(true)
  })

  it("fails closed for unsupported explicit Strategy and SoldierBrain ABIs", () => {
    const created = createCandidateInitialGameStateV119({
      ...matchInput,
      initialInitiativePlayerId: matchInput.bottomPlayerId,
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return

    expect(() =>
      createStrategyInput(
        created.state,
        matchInput.bottomPlayerId,
        "strategy-runtime-abi-v9.99",
      ),
    ).toThrow("Unsupported explicit StrategyInput runtime ABI selection.")
    expect(() =>
      createSoldierBrainInput(
        created.state,
        "bottom-soldier-1",
        0,
        undefined,
        false,
        "strategy-runtime-abi-v9.99",
      ),
    ).toThrow("Unsupported explicit SoldierBrainInput runtime ABI selection.")
  })

  it("keeps initial initiative immutable while current initiative flips each Round", () => {
    const observations: StrategyInputV119[] = []
    const result = MATCH_KERNEL.runMatchV119({
      ...matchInput,
      initialInitiativePlayerId: matchInput.bottomPlayerId,
      maxPhases: 1,
      runtime: {
        selectActivations(input: StrategyInputV119) {
          observations.push(input)
          return {
            ok: true as const,
            value: { activationOrders: [], strategyMemory: {} },
          }
        },
        runSoldierBrain() {
          throw new Error("No Soldier should be selected in this fixture.")
        },
      },
    })

    expect(result.kind).toBe("completed")
    expect(observations).toHaveLength(8)
    for (const [index, input] of observations.entries()) {
      const roundIndex = Math.floor(index / 2)
      const observerIsBottom = index % 2 === 0
      const roundOwner =
        roundIndex % 2 === 0
          ? matchInput.bottomPlayerId
          : matchInput.topPlayerId
      expect(input.initialInitiativePlayerId).toBe(matchInput.bottomPlayerId)
      expect(input.hasInitialInitiative).toBe(observerIsBottom)
      expect(input.roundInitiativePlayerId).toBe(roundOwner)
      expect(input.hasRoundInitiative).toBe(
        observerIsBottom
          ? roundOwner === matchInput.bottomPlayerId
          : roundOwner === matchInput.topPlayerId,
      )
    }
  })

  it("rejects malformed successor state before yielding an effect request", () => {
    const machine = MATCH_KERNEL.createMachineV119({
      ...matchInput,
      initialInitiativePlayerId: matchInput.bottomPlayerId,
    })
    const forged = {
      ...machine,
      state: {
        ...machine.state,
        initialInitiativePlayerId: "player:not-an-entrant",
      },
    }
    expect(MATCH_KERNEL.stepMatch(forged, { kind: "advance" })).toMatchObject({
      kind: "failure",
      failure: { code: "KERNEL_INITIAL_INITIATIVE_INVALID" },
    })
  })

  it("keeps seed-derived construction and old observations behind v1.17 dispatch", () => {
    const observations: StrategyInputV117[] = []
    const historicalRuntime = adaptRuntimeForCurrentKernel({
      selectActivations(input) {
        observations.push(input)
        return {
          ok: true as const,
          value: { activationOrders: [], strategyMemory: {} },
        }
      },
      runSoldierBrain() {
        throw new Error("No Soldier should be selected in this fixture.")
      },
    })
    const result = MATCH_KERNEL.runMatchV117({
      ...matchInput,
      maxPhases: 1,
      runtime: historicalRuntime,
    })

    expect(result.kind).toBe("completed")
    expect(observations.length).toBeGreaterThan(0)
    expect(observations[0]).not.toHaveProperty("initialInitiativePlayerId")
    expect(observations[0]).not.toHaveProperty("roundInitiativePlayerId")
    expect(
      result.kind === "completed" && result.result.state,
    ).not.toHaveProperty("initialInitiativePlayerId")
  })

  it("rejects an old initial-state tuple at the v1.19 entry point", () => {
    let runtimeStarted = false
    const result = MATCH_KERNEL.runMatchV119({
      ...matchInput,
      maxPhases: 1,
      runtime: {
        selectActivations() {
          runtimeStarted = true
          return {
            ok: true as const,
            value: { activationOrders: [], strategyMemory: {} },
          }
        },
        runSoldierBrain() {
          runtimeStarted = true
          throw new Error("Unexpected SoldierBrain call.")
        },
      },
    } as never)
    expect(result).toMatchObject({
      kind: "failure",
      failure: { code: "CANDIDATE_V119_MATCH_ADMISSION_FAILED" },
    })
    expect(runtimeStarted).toBe(false)
  })
})

const successorState = () => {
  const created = createCandidateInitialGameStateV119({
    ...matchInput,
    initialInitiativePlayerId: matchInput.bottomPlayerId,
  })
  if (!created.ok) throw new Error("Successor fixture state was rejected.")
  return created.state
}

const actionRuntime = (
  actions: readonly Action[],
  observations: SoldierBrainInputV119[],
) => {
  let actionIndex = 0
  return {
    selectActivations() {
      throw new Error("Selection is not used by activation-only fixtures.")
    },
    runSoldierBrain(input: unknown) {
      observations.push(input as SoldierBrainInputV119)
      const action = actions[actionIndex]
      actionIndex += 1
      if (action === undefined) {
        throw new Error("Activation requested an unexpected extra Action.")
      }
      return { ok: true as const, value: { action, soldierMemory: {} } }
    },
  }
}

describe("successor SoldierBrain observations", () => {
  it("reports false before Action, remains false after TURN, then stays true after self Advance", () => {
    const observations: SoldierBrainInputV119[] = []
    const execution = MATCH_KERNEL.runActivationFromStateV119({
      state: successorState(),
      soldierId: "bottom-soldier-1",
      runtime: actionRuntime(
        [
          { type: "TURN", direction: "RIGHT" },
          { type: "MOVE", direction: "UP" },
          { type: "TURN", direction: "LEFT" },
          { type: "TURN_TO_STONE" },
        ],
        observations,
      ),
    })

    expect(execution.kind).toBe("completed")
    expect(
      observations.map((input) => input.hasAdvancedThisActivation),
    ).toEqual([false, false, true, true])
    if (execution.kind !== "completed") return
    const recorded = execution
      .recorderMaterial!.events.filter(
        (event) => event.type === "AWARENESS_GRID_OBSERVED",
      )
      .map(
        (event) =>
          (event.privatePayload as { hasAdvancedThisActivation?: boolean })
            .hasAdvancedThisActivation,
      )
    expect(recorded).toEqual([false, false, true, true])
  })

  it("keeps blocked MOVE and PUSH false", () => {
    const state = successorState()
    const observations: SoldierBrainInputV119[] = []
    const execution = MATCH_KERNEL.runActivationFromStateV119({
      state,
      soldierId: "bottom-soldier-1",
      runtime: actionRuntime(
        [{ type: "MOVE", direction: "RIGHT" }, { type: "TURN_TO_STONE" }],
        observations,
      ),
    })

    expect(execution.kind).toBe("completed")
    expect(
      observations.map((input) => input.hasAdvancedThisActivation),
    ).toEqual([false, false])

    const headToHeadState = successorState()
    headToHeadState.soldiers = headToHeadState.soldiers.map((soldier) =>
      soldier.id === "bottom-soldier-2"
        ? { ...soldier, facing: "LEFT" }
        : soldier,
    )
    const blockedMoveObservations: SoldierBrainInputV119[] = []
    const blockedMove = MATCH_KERNEL.runActivationFromStateV119({
      state: headToHeadState,
      soldierId: "bottom-soldier-1",
      runtime: actionRuntime(
        [{ type: "MOVE", direction: "RIGHT" }, { type: "TURN_TO_STONE" }],
        blockedMoveObservations,
      ),
    })
    expect(blockedMove.kind).toBe("completed")
    expect(
      blockedMoveObservations.map((input) => input.hasAdvancedThisActivation),
    ).toEqual([false, false])
  })

  it("counts successful push for the actor but not the pushed Soldier", () => {
    const state = successorState()
    state.soldiers = state.soldiers.map((soldier) => {
      if (soldier.id === "bottom-soldier-1") {
        return { ...soldier, position: { x: 4, y: 5 }, facing: "RIGHT" }
      }
      if (soldier.id === "top-soldier-1") {
        return { ...soldier, position: { x: 5, y: 5 }, facing: "UP" }
      }
      return soldier
    })
    const actorObservations: SoldierBrainInputV119[] = []
    const pushed = MATCH_KERNEL.runActivationFromStateV119({
      state,
      soldierId: "bottom-soldier-1",
      runtime: actionRuntime(
        [{ type: "MOVE", direction: "RIGHT" }, { type: "TURN_TO_STONE" }],
        actorObservations,
      ),
    })
    expect(pushed.kind).toBe("completed")
    expect(
      actorObservations.map((input) => input.hasAdvancedThisActivation),
    ).toEqual([false, true])
    if (pushed.kind !== "completed") return

    const targetObservations: SoldierBrainInputV119[] = []
    const target = MATCH_KERNEL.runActivationFromStateV119({
      state: pushed.result!.state,
      soldierId: "top-soldier-1",
      runtime: actionRuntime([{ type: "TURN_TO_STONE" }], targetObservations),
    })
    expect(target.kind).toBe("completed")
    expect(targetObservations[0]?.hasAdvancedThisActivation).toBe(false)
  })

  it("resets to false in a new slot for the same Soldier", () => {
    const firstObservations: SoldierBrainInputV119[] = []
    const first = MATCH_KERNEL.runActivationFromStateV119({
      state: successorState(),
      soldierId: "bottom-soldier-1",
      runtime: actionRuntime(
        [
          { type: "MOVE", direction: "UP" },
          ...Array.from(
            { length: 11 },
            (): Action => ({ type: "TURN", direction: "LEFT" }),
          ),
        ],
        firstObservations,
      ),
    })
    expect(first.kind).toBe("completed")
    expect(firstObservations[0]?.hasAdvancedThisActivation).toBe(false)
    expect(
      firstObservations
        .slice(1)
        .every((input) => input.hasAdvancedThisActivation),
    ).toBe(true)
    if (first.kind !== "completed") return

    const secondObservations: SoldierBrainInputV119[] = []
    const second = MATCH_KERNEL.runActivationFromStateV119({
      state: first.result!.state,
      soldierId: "bottom-soldier-1",
      runtime: actionRuntime([{ type: "TURN_TO_STONE" }], secondObservations),
    })
    expect(second.kind).toBe("completed")
    expect(secondObservations[0]?.hasAdvancedThisActivation).toBe(false)
  })
})
