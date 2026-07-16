import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  DEFAULT_RUNTIME_LIMITS,
  INITIAL_BOUNDS,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  type RuntimeExecutionServiceRequest,
  type SoldierBrainInput,
  type StrategyInput,
} from "@cowards/spec"
import type { StrategyRuntime } from "@cowards/engine"
import { recordChronicleFromExecution } from "@cowards/replay"
import { buildStrategyRevision } from "@cowards/runtime-js"
import { executeCurrentMatchServiceTestSupport as executeRuntimeServiceRequest } from "./runtime-execution-current-match.test-support.js"
import {
  createFixtureDeploymentLaneIdentity,
  createFixtureRuntimeExecutionAuthorityContext,
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
const authority = createFixtureRuntimeExecutionAuthorityContext({
  fixtureId: "semantic-integrity-current",
  bottom,
  top,
})
const request: RuntimeExecutionServiceRequest = {
  contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
  kind: "executeMatch",
  requestId: "request:semantic-current",
  match: {
    matchId: "match:semantic-current",
    seed: "seed:semantic-current",
    arenaVariant: {
      id: "arena:semantic-current",
      name: "Runtime semantic current",
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
  evidenceSnapshot: authority.evidenceSnapshot,
}

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
const semanticReceiptSecret = "fixture-semantic-receipt-secret-v1"

describe("runtime-service semantic integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("binds every successful result to a domain-separated semantic receipt", () => {
    const response = executeRuntimeServiceRequest(
      request,
      createRuntimeServiceConfig({
        strategyExecutionAdapter: "worker-thread",
        resolveDeploymentLaneIdentity: createFixtureDeploymentLaneIdentity,
        semanticReceiptSecret,
      }),
      {
        authorityLoader: authority.authorityLoader,
        createAdmittedRuntimeForRevision: () => ({
          ok: true,
          runtime: passiveRuntime,
        }),
      },
    )

    if (!response.ok) {
      throw new Error(
        `${response.systemFailure.code}:${JSON.stringify(response.systemFailure.diagnostics)}`,
      )
    }
    expect(response.ok).toBe(true)
    expect(response.contractVersion).toBe("runtime-execution-service-v1.16")
    expect(response.result).toHaveProperty("semanticReceipt")
    expect(response.result).toMatchObject({
      semanticReceipt: {
        schemaVersion: "runtime-semantic-receipt-v1",
        profile: "current-exact",
        algorithm: "hmac-sha256",
        keyId: "runtime-service-semantic-receipt:v1",
        requestId: request.requestId,
        matchId: request.match.matchId,
        compatibilityTupleId: request.evidenceSnapshot.compatibility.tupleId,
        authorityBundleHash: request.evidenceSnapshot.authorityBundleHash,
        registryGeneration: request.evidenceSnapshot.registryGeneration,
      },
    })
    expect(
      (response.result as Record<string, unknown>).semanticReceipt,
    ).toMatchObject({
      signature: expect.stringMatching(/^hmac-sha256:[0-9a-f]{64}$/u),
    })
  })

  it("keeps the inactive v1.17 candidate outside historical v1.16 default dispatch", () => {
    const createAdmittedRuntimeForRevision = vi.fn()
    const response = executeRuntimeServiceRequest(
      {
        ...request,
        contractVersion: "runtime-execution-service-v1.17",
      },
      createRuntimeServiceConfig({
        strategyExecutionAdapter: "worker-thread",
        resolveDeploymentLaneIdentity: createFixtureDeploymentLaneIdentity,
        semanticReceiptSecret,
      }),
      {
        authorityLoader: authority.authorityLoader,
        createAdmittedRuntimeForRevision,
      },
    )

    expect(response).toMatchObject({
      contractVersion: "runtime-execution-service-v1.16",
      ok: false,
      kind: "systemFailure",
      systemFailure: { code: "MALFORMED_REQUEST", retryable: false },
    })
    expect(createAdmittedRuntimeForRevision).not.toHaveBeenCalled()
  })

  it("fails closed when the recorded final state differs from canonical reconstruction", () => {
    const response = executeRuntimeServiceRequest(
      request,
      createRuntimeServiceConfig({
        strategyExecutionAdapter: "worker-thread",
        resolveDeploymentLaneIdentity: createFixtureDeploymentLaneIdentity,
        semanticReceiptSecret,
      }),
      {
        authorityLoader: authority.authorityLoader,
        createAdmittedRuntimeForRevision: () => ({
          ok: true,
          runtime: passiveRuntime,
        }),
        recordChronicle(input) {
          const recorded = recordChronicleFromExecution(input)
          if (!recorded.ok) return recorded
          return {
            ...recorded,
            finalState: {
              ...recorded.finalState,
              phaseNumber: recorded.finalState.phaseNumber + 1,
            },
          }
        },
      },
    )

    expect(response).toMatchObject({
      ok: false,
      kind: "systemFailure",
      systemFailure: { code: "CHRONICLE_INTEGRITY_FAILED" },
    })
    expect(response).not.toHaveProperty("result")
  })

  it("fails closed when current semantic admission rejects a recorded Chronicle", () => {
    const recordChronicle = vi.fn(recordChronicleFromExecution)
    const reconstructChronicle = vi.fn()
    const response = executeRuntimeServiceRequest(
      request,
      createRuntimeServiceConfig({
        strategyExecutionAdapter: "worker-thread",
        resolveDeploymentLaneIdentity: createFixtureDeploymentLaneIdentity,
        semanticReceiptSecret,
      }),
      {
        authorityLoader: authority.authorityLoader,
        createAdmittedRuntimeForRevision: () => ({
          ok: true,
          runtime: passiveRuntime,
        }),
        recordChronicle,
        validateChronicle: vi.fn(() => ({
          ok: false as const,
          profile: "current-exact" as const,
          publishable: false as const,
          current: true as const,
          category: "CANONICAL_INTEGRITY_FAILURE" as const,
          ownership: "system_integrity" as const,
          issues: [],
          truncated: false,
        })),
        reconstructChronicle,
      },
    )

    expect(response).toMatchObject({
      ok: false,
      kind: "systemFailure",
      systemFailure: {
        code: "CHRONICLE_INTEGRITY_FAILED",
        retryable: false,
      },
    })
    expect(authority.authorityLoader.load).toHaveBeenCalledTimes(2)
    expect(recordChronicle).toHaveBeenCalledTimes(1)
    expect(reconstructChronicle).not.toHaveBeenCalled()
    expect(response).not.toHaveProperty("result")
    expect(JSON.stringify(response)).not.toContain(passiveSource.trim())
  })
})
