import { describe, expect, it } from "vitest"
import {
  createSelectedRuntimeInvocationRequestV117,
  createRuntimeAbiV117ExecutionLedger,
  createRuntimeInvocationBudgetV117,
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  type JsonValue,
} from "@cowards/spec"
import { runPythonCandidateHostV117 } from "./python-subprocess-adapter.js"
import {
  buildPythonRequestSourceIdentityV117,
  buildPythonSourceIdentityV117,
  buildPythonStrategyRevisionV117,
} from "./validation.js"

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
  awarenessGrid: {
    cells: Array.from({ length: 25 }, (_, index) => ({
      dx: (index % 5) - 2,
      dy: Math.floor(index / 5) - 2,
      absoluteX: index % 5,
      absoluteY: Math.floor(index / 5),
      contents: "EMPTY" as const,
    })),
  },
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
    const revision = buildPythonStrategyRevisionV117({ source })
    const identity = buildPythonRequestSourceIdentityV117(revision.source)
    const artifact = revision.metadata.sourceArtifact!
    const signingIdentity = {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: "fixture-only:python-v1.19-observation-transport",
    } as const
    const invoke = (method: "selectActivations" | "soldierBrain", input: JsonValue) => {
      const request = createSelectedRuntimeInvocationRequestV117(
        {
          requestId: `request:python:v1.19:${method}`,
          invocationId: `invocation:python:v1.19:${method}`,
          kernelRequestId: `kernel-request:python:v1.19:${method}`,
          method,
          semanticTuple: {
            rules: "cowards-rules-v1.4",
            engine: "engine-kernel-v1.37-candidate-1",
            runtimeAbi: "strategy-runtime-abi-v1.17",
            chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
            arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
            setPolicy: "canonical-set-policy-v1.4",
          },
          sourceIdentity: {
            strategyRevisionId: revision.id,
            originalSourceSha256: identity.originalSourceSha256,
            normalizedSourceSha256: identity.normalizedSourceSha256,
            artifactSha256: `sha256:${artifact.hash}`,
          },
          budget: createRuntimeInvocationBudgetV117(method),
          accounting: { prestate: createRuntimeAbiV117ExecutionLedger() },
          input: { value: input },
          retry: {
            retryId: `retry:python:v1.19:${method}`,
            attempt: 0,
            previousRequestSha256: null,
          },
        },
        signingIdentity,
      )
      const host = runPythonCandidateHostV117(
        request,
        buildPythonSourceIdentityV117(source).normalizedSource,
      )
      if (host.observation.kind !== "payload") {
        throw new Error(`Python candidate host failed: ${host.observation.kind}`)
      }
      return JSON.parse(new TextDecoder().decode(host.observation.payloadBytes)) as unknown
    }
    expect(
      invoke("selectActivations", strategyInput as unknown as JsonValue),
    ).toMatchObject({
      strategyMemory: {
        initialInitiativePlayerId: "player:bottom",
        hasInitialInitiative: true,
        roundInitiativePlayerId: "player:top",
        hasRoundInitiative: false,
      },
    })

    expect(
      invoke("soldierBrain", brainInput as unknown as JsonValue),
    ).toMatchObject({
      soldierMemory: { hasAdvancedThisActivation: true },
    })
  })
})
