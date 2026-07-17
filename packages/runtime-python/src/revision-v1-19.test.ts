import { describe, expect, it } from "vitest"
import { createPythonRuntimeFromRevision } from "./python-subprocess-adapter.js"
import { buildPythonStrategyRevision } from "./validation.js"
import {
  createCandidateObservationTransportRequestV119,
  executeCandidateObservationTransportV119,
} from "../../runtime-js/src/revision-v1-19.js"

const context = {
  entrantPlayerIds: ["player:bottom", "player:top"] as const,
  observingPlayerId: "player:bottom",
}

const strategyInput = {
  phaseNumber: 1,
  roundNumber: 2,
  activationCount: 1,
  board: { bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 }, soldiers: [], terrainStones: [] },
  mySoldiers: [],
  enemySoldiers: [],
  strategyMemory: null,
  initialInitiativePlayerId: "player:bottom",
  hasInitialInitiative: true,
  roundInitiativePlayerId: "player:top",
  hasRoundInitiative: false,
} as const

const brainInput = {
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

const source = `
def select_activations(input):
    return {
        "activationOrders": [],
        "strategyMemory": {
            "initialInitiativePlayerId": input["initialInitiativePlayerId"],
            "hasInitialInitiative": input["hasInitialInitiative"],
            "roundInitiativePlayerId": input["roundInitiativePlayerId"],
            "hasRoundInitiative": input["hasRoundInitiative"],
        },
    }

def soldier_brain(input):
    return {
        "action": {"type": "TURN_TO_STONE"},
        "soldierMemory": {
            "hasAdvancedThisActivation": input["hasAdvancedThisActivation"],
        },
    }
`

describe("Python v1.19 observation transport", () => {
  it("consumes every candidate field through the real Python provider", () => {
    const runtime = createPythonRuntimeFromRevision(
      buildPythonStrategyRevision({ source }),
    )
    const selectionRequest = createCandidateObservationTransportRequestV119({
      method: "selectActivations",
      kernelRequestId: "effect:v1.19:python-selection",
      semanticTupleId: "tuple:v1.19:candidate",
      input: strategyInput,
      ...context,
    })
    const selection = executeCandidateObservationTransportV119(
      selectionRequest,
      ({ input, signedInputBytes }) => {
        expect(signedInputBytes).toEqual(selectionRequest.signedInputBytes)
        const result = runtime.selectActivations(input as never)
        if (!result.ok) throw new Error("Python selection fixture failed")
        return { kind: "success" as const, value: result.value }
      },
    )
    expect(selection).toMatchObject({
      kind: "success",
      value: { strategyMemory: strategyInput },
    })

    const brainRequest = createCandidateObservationTransportRequestV119({
      method: "soldierBrain",
      kernelRequestId: "effect:v1.19:python-brain",
      semanticTupleId: "tuple:v1.19:candidate",
      input: brainInput,
      ...context,
    })
    const brain = executeCandidateObservationTransportV119(
      brainRequest,
      ({ input, signedInputBytes }) => {
        expect(signedInputBytes).toEqual(brainRequest.signedInputBytes)
        const result = runtime.runSoldierBrain(input as never)
        if (!result.ok) throw new Error("Python brain fixture failed")
        return { kind: "success" as const, value: result.value }
      },
    )
    expect(brain).toMatchObject({
      kind: "success",
      value: { soldierMemory: { hasAdvancedThisActivation: true } },
    })
  })
})
