import { describe, expect, it } from "vitest"
import { buildStrategyRevision } from "./revision.js"
import { createRuntimeFromRevision } from "./executor.js"
import {
  createCandidateObservationTransportRequestV119,
  executeCandidateObservationTransportV119,
} from "./revision-v1-19.js"

const strategyInput = {
  phaseNumber: 1,
  roundNumber: 2,
  activationCount: 1,
  board: {
    bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    soldiers: [],
    terrainStones: [],
  },
  mySoldiers: [],
  enemySoldiers: [],
  strategyMemory: null,
  initialInitiativePlayerId: "player:bottom",
  hasInitialInitiative: true,
  roundInitiativePlayerId: "player:top",
  hasRoundInitiative: false,
} as const

const soldierBrainInput = {
  self: {
    id: "soldier:bottom:1",
    ownerPlayerId: "player:bottom",
    status: "ACTIVE",
    position: { x: 2, y: 2 },
    facing: "UP",
    lastSuccessfulMoveDirection: null,
  },
  awarenessGrid: { cells: [] },
  cycleIndex: 2,
  maxCycles: 12,
  soldierMemory: null,
  hasAdvancedThisActivation: true,
} as const

const context = {
  entrantPlayerIds: ["player:bottom", "player:top"] as const,
  observingPlayerId: "player:bottom",
}

const source = `
export default {
  selectActivations(input) {
    return {
      activationOrders: [],
      strategyMemory: {
        initialInitiativePlayerId: input.initialInitiativePlayerId,
        hasInitialInitiative: input.hasInitialInitiative,
        roundInitiativePlayerId: input.roundInitiativePlayerId,
        hasRoundInitiative: input.hasRoundInitiative,
      },
    }
  },
  soldierBrain(input) {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: {
        hasAdvancedThisActivation: input.hasAdvancedThisActivation,
      },
    }
  },
}
`

describe("TypeScript v1.19 observation transport", () => {
  it("delivers the exact four initiative facts and slot Advance fact to the real lane", () => {
    const runtime = createRuntimeFromRevision(buildStrategyRevision({ source }))
    const selectionRequest = createCandidateObservationTransportRequestV119({
      method: "selectActivations",
      kernelRequestId: "effect:v1.19:typescript-selection",
      semanticTupleId: "tuple:v1.19:candidate",
      input: strategyInput,
      ...context,
    })
    const selection = executeCandidateObservationTransportV119(
      selectionRequest,
      ({ input, signedInputBytes }) => {
        expect(signedInputBytes).toEqual(selectionRequest.signedInputBytes)
        const result = runtime.selectActivations(input as never)
        if (!result.ok) throw new Error("TypeScript selection fixture failed")
        return { kind: "success" as const, value: result.value }
      },
    )
    expect(selection).toMatchObject({
      kind: "success",
      value: { strategyMemory: strategyInput },
    })

    const brainRequest = createCandidateObservationTransportRequestV119({
      method: "soldierBrain",
      kernelRequestId: "effect:v1.19:typescript-brain",
      semanticTupleId: "tuple:v1.19:candidate",
      input: soldierBrainInput,
      ...context,
    })
    const brain = executeCandidateObservationTransportV119(
      brainRequest,
      ({ input, signedInputBytes }) => {
        expect(signedInputBytes).toEqual(brainRequest.signedInputBytes)
        const result = runtime.runSoldierBrain(input as never)
        if (!result.ok) throw new Error("TypeScript brain fixture failed")
        return { kind: "success" as const, value: result.value }
      },
    )
    expect(brain).toMatchObject({
      kind: "success",
      value: {
        soldierMemory: { hasAdvancedThisActivation: true },
      },
    })
  })

  it.each([
    ["missing", ({ hasInitialInitiative: _removed, ...rest }) => rest],
    ["extra", (value) => ({ ...value, initiativeFromParity: true })],
    ["contradictory", (value) => ({ ...value, hasRoundInitiative: true })],
  ] as const)("rejects %s observation input before guest execution", (_name, mutate) => {
    let guestStarted = false
    const request = createCandidateObservationTransportRequestV119({
      method: "selectActivations",
      kernelRequestId: "effect:v1.19:invalid",
      semanticTupleId: "tuple:v1.19:candidate",
      input: mutate(strategyInput),
      ...context,
    })
    expect(
      executeCandidateObservationTransportV119(request, () => {
        guestStarted = true
        return { kind: "success", value: null }
      }),
    ).toMatchObject({ kind: "system_failure", failure: { retryable: false } })
    expect(guestStarted).toBe(false)
  })

  it("rejects stale signed bytes and mixed runtime selection before guest execution", () => {
    let guestStarts = 0
    const valid = createCandidateObservationTransportRequestV119({
      method: "selectActivations",
      kernelRequestId: "effect:v1.19:binding",
      semanticTupleId: "tuple:v1.19:candidate",
      input: strategyInput,
      ...context,
    })
    const candidates = [
      { ...valid, inputSha256: `sha256:${"0".repeat(64)}` as const },
      { ...valid, runtimeAbiVersion: "strategy-runtime-abi-v1.17" as never },
      { ...valid, semanticAuthorityKey: "runtime-v1.17" as never },
    ]
    for (const candidate of candidates) {
      expect(
        executeCandidateObservationTransportV119(candidate, () => {
          guestStarts += 1
          return { kind: "success", value: null }
        }),
      ).toMatchObject({ kind: "system_failure" })
    }
    expect(guestStarts).toBe(0)
  })
})
