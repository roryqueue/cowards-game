import { describe, expect, it } from "vitest"
import {
  DEFAULT_RUNTIME_LIMITS,
  INITIAL_BOUNDS,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  RuntimeExecutionServiceRequestSchema,
  type RuntimeExecutionServiceRequest,
  type SoldierBrainInput,
  type StrategyInput,
} from "@cowards/spec"
import type { StrategyRuntime } from "@cowards/engine"
import { buildChronicleFromMatch } from "@cowards/replay"
import { buildStrategyRevision } from "@cowards/runtime-js"
import {
  executeRuntimeServiceRequest,
  type RuntimeExecutionServiceDependencies,
} from "./execute-match.js"
import {
  createFixtureRuntimeEvidenceAuthorityLoader,
  createFixtureDeploymentLaneIdentity,
  createFixtureRuntimeExecutionEvidenceSnapshot,
} from "./runtime-execution-evidence.test-support.js"
import { createRuntimeServiceConfig } from "./runtime-config.js"

const passiveSource = `
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`

const bottom = buildStrategyRevision({
  source: passiveSource,
  strategyId: "strategy:semantic-bottom",
})
const top = buildStrategyRevision({
  source: passiveSource,
  strategyId: "strategy:semantic-top",
})
const request = RuntimeExecutionServiceRequestSchema.parse({
  contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
  kind: "executeMatch",
  requestId: "request:semantic-red",
  match: {
    matchId: "match:semantic-red",
    seed: "seed:semantic-red",
    arenaVariant: {
      id: "arena:semantic-red",
      name: "Runtime semantic RED",
      initialBounds: INITIAL_BOUNDS,
      terrainStones: [],
    },
    bottomPlayerId: "player:bottom",
    topPlayerId: "player:top",
    bottomStrategyRevisionId: bottom.id,
    topStrategyRevisionId: top.id,
    maxPhases: 1,
  },
  strategies: { bottom, top },
  limits: DEFAULT_RUNTIME_LIMITS,
  evidenceSnapshot: createFixtureRuntimeExecutionEvidenceSnapshot({
    fixtureId: "semantic-integrity",
    bottom,
    top,
  }),
}) as RuntimeExecutionServiceRequest

const passiveRuntime: StrategyRuntime = {
  selectActivations(_input: StrategyInput) {
    return { ok: true, value: { activationOrders: [], strategyMemory: {} } }
  },
  runSoldierBrain(_input: SoldierBrainInput) {
    return {
      ok: true,
      value: { action: { type: "TURN_TO_STONE" }, soldierMemory: {} },
    }
  },
}

describe("runtime-service semantic integrity", () => {
  it("missing-semantic-enforcement: runtime final becomes system failure without Chronicle", () => {
    let recorderCalls = 0
    const dependencies: Partial<RuntimeExecutionServiceDependencies> = {
      authorityLoader: createFixtureRuntimeEvidenceAuthorityLoader(
        request.evidenceSnapshot,
        request.strategies,
      ),
      createRuntimeForRevision: () => ({ ok: true, runtime: passiveRuntime }),
      buildChronicleFromMatch(input) {
        recorderCalls += 1
        const built = buildChronicleFromMatch(input)
        const ownerPlayerId = built.finalState.players[0].id
        const duplicateOccupants = ["a", "b"].map((suffix) => ({
          id: `soldier:semantic-duplicate:${suffix}`,
          ownerPlayerId,
          status: "ACTIVE" as const,
          position: { x: 5, y: 5 },
          facing: "UP" as const,
          lastSuccessfulMoveDirection: null,
          soldierMemory: {},
        }))
        return {
          ...built,
          finalState: {
            ...built.finalState,
            soldiers: [...built.finalState.soldiers, ...duplicateOccupants],
          },
        }
      },
    }
    const response = executeRuntimeServiceRequest(
      request,
      createRuntimeServiceConfig({
        strategyExecutionAdapter: "worker-thread",
        resolveDeploymentLaneIdentity: createFixtureDeploymentLaneIdentity,
      }),
      dependencies,
    )

    expect(recorderCalls).toBe(1)
    if (!response.ok) {
      expect(response.kind).toBe("systemFailure")
      expect(response.systemFailure.retryable).toBe(true)
      expect(response).not.toHaveProperty("result")
      return
    }
    const occupied = response.result.finalState.soldiers
      .filter((soldier) => soldier.position !== null)
      .map((soldier) => `${soldier.position!.x},${soldier.position!.y}`)
    expect(new Set(occupied).size).toBeLessThan(occupied.length)
    expect(response.result.chronicle.events.length).toBeGreaterThan(0)

    throw new Error("[EXPECTED_RED:MISSING_SEMANTIC_ENFORCEMENT:RUNTIME]")
  })
})
