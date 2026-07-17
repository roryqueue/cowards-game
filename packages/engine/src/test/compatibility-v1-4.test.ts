import { describe, expect, it } from "vitest"
import type { SoldierBrainInputV117, SoldierBrainInputV119 } from "@cowards/spec"
import { captureV14CompatibilityCorpus, findLockedCompatibilityDrift } from "../fixtures/v1-4-compatibility.js"
import {
  createCandidateInitialGameState,
  createCandidateInitialGameStateV119,
  getInitialInitiativePlayerId,
} from "../kernel/create-initial-state.js"
import { MATCH_KERNEL } from "../kernel/driver.js"
import type { TransitionEventSummary } from "../types.js"
import { adaptRuntimeForCurrentKernel } from "./current-kernel-runtime.js"

const matchInput = {
  matchId: "phase-260-v1-4-preservation",
  seed: "phase-260-v1-4-preservation-seed",
  arenaVariant: {
    id: "phase-260-v1-4-preservation-arena",
    name: "Phase 260 v1.4 preservation arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [],
  },
  bottomPlayerId: "player:bottom",
  topPlayerId: "player:top",
  bottomStrategyRevisionId: "revision:bottom",
  topStrategyRevisionId: "revision:top",
}

const withoutInitialInitiative = <T extends object>(value: T) => {
  const clone = globalThis.structuredClone(value) as T & {
    initialInitiativePlayerId?: string
  }
  delete clone.initialInitiativePlayerId
  return clone
}

const gameplayTransitions = (
  transitions: readonly {
    transitionKind: string
    coordinates: unknown
    classification: string
    events: unknown
    terminalStatus: unknown
    failureStatus: unknown
  }[],
) =>
  transitions.map(
    ({
      transitionKind,
      coordinates,
      classification,
      events,
      terminalStatus,
      failureStatus,
    }) => ({
      transitionKind,
      coordinates,
      classification,
      events,
      terminalStatus,
      failureStatus,
    }),
  )

const ownerEventsWithoutSuccessorObservation = (
  events: readonly TransitionEventSummary[],
) =>
  events.map((event) => {
    if (
      event.privatePayload === null ||
      typeof event.privatePayload !== "object" ||
      Array.isArray(event.privatePayload)
    ) {
      return event
    }
    const privatePayload = {
      ...(event.privatePayload as Record<string, unknown>),
    }
    delete privatePayload.hasAdvancedThisActivation
    return { ...event, privatePayload }
  })

describe("v1.19 observation-only v1.4 preservation", () => {
  it("changes only successor observations while state, legality, events, cleanup, terminal reason, and outcome stay exact", () => {
    const lockedBefore = captureV14CompatibilityCorpus()
    const historicalState = createCandidateInitialGameState(matchInput)
    const initialInitiativePlayerId = getInitialInitiativePlayerId(
      matchInput.seed,
      matchInput.bottomPlayerId,
      matchInput.topPlayerId,
    )
    const successorState = createCandidateInitialGameStateV119({
      ...matchInput,
      initialInitiativePlayerId,
    })
    expect(historicalState.ok).toBe(true)
    expect(successorState.ok).toBe(true)
    if (!historicalState.ok || !successorState.ok) return

    const historicalInputs: SoldierBrainInputV117[] = []
    const successorInputs: SoldierBrainInputV119[] = []
    const actionForCycle = (cycleIndex: number) =>
      cycleIndex === 0
        ? ({ type: "MOVE", direction: "UP" } as const)
        : ({ type: "TURN_TO_STONE" } as const)
    const historical = MATCH_KERNEL.runActivationFromStateV117({
      state: historicalState.state,
      soldierId: "bottom-soldier-1",
      runtime: adaptRuntimeForCurrentKernel({
        selectActivations() {
          throw new Error("Selection is not used by this fixture.")
        },
        runSoldierBrain(input) {
          historicalInputs.push(input)
          return {
            ok: true,
            value: {
              action: actionForCycle(input.cycleIndex),
              soldierMemory: {},
            },
          }
        },
      }),
    })
    const successor = MATCH_KERNEL.runActivationFromStateV119({
      state: successorState.state,
      soldierId: "bottom-soldier-1",
      runtime: {
        selectActivations() {
          throw new Error("Selection is not used by this fixture.")
        },
        runSoldierBrain(input) {
          const successorInput = input as SoldierBrainInputV119
          successorInputs.push(successorInput)
          return {
            ok: true as const,
            value: {
              action: actionForCycle(successorInput.cycleIndex),
              soldierMemory: {},
            },
          }
        },
      },
    })

    expect(historical.kind).toBe("completed")
    expect(successor.kind).toBe("completed")
    if (historical.kind !== "completed" || successor.kind !== "completed") {
      return
    }
    expect(withoutInitialInitiative(successor.result!.state)).toEqual(
      historical.result!.state,
    )
    expect(successor.result!.events).toEqual(historical.result!.events)
    expect(gameplayTransitions(successor.transitions)).toEqual(
      gameplayTransitions(historical.transitions),
    )
    expect(
      ownerEventsWithoutSuccessorObservation(
        successor.recorderMaterial!.events,
      ),
    ).toEqual(historical.recorderMaterial!.events)
    expect(
      successorInputs.map((input) => input.hasAdvancedThisActivation),
    ).toEqual([false, true])
    expect(historicalInputs).toHaveLength(2)
    expect(
      historicalInputs.every(
        (input) => !("hasAdvancedThisActivation" in input),
      ),
    ).toBe(true)
    expect(successor.result!.state.outcome).toEqual(
      historical.result!.state.outcome,
    )

    const lockedAfter = captureV14CompatibilityCorpus()
    expect(lockedAfter).toEqual(lockedBefore)
    expect(findLockedCompatibilityDrift(lockedAfter)).toEqual([])
    expect(JSON.stringify(successor.result!.events)).not.toContain("HOLD")
    expect(JSON.stringify(successor.result!.events)).not.toContain(
      "END_ACTIVATION",
    )
  })
})
