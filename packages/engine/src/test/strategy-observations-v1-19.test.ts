import { describe, expect, it } from "vitest"
import type { StrategyInputV117, StrategyInputV119 } from "@cowards/spec"
import { MATCH_KERNEL } from "../index.js"
import {
  createCandidateInitialGameStateV119,
} from "../kernel/create-initial-state.js"
import { createStrategyInputV119 } from "../runtime-inputs.js"
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
    expect(result.kind === "completed" && result.result.state).not.toHaveProperty(
      "initialInitiativePlayerId",
    )
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
