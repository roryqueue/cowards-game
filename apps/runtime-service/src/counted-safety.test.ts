import { describe, expect, it, vi } from "vitest"
import {
  DEFAULT_RUNTIME_LIMITS,
  INITIAL_BOUNDS,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  type RuntimeExecutionServiceRequest,
} from "@cowards/spec"
import { buildStrategyRevision } from "@cowards/runtime-js"
import { buildChronicleFromMatch } from "@cowards/replay"
import {
  executeRuntimeServiceRequest,
  type RuntimeExecutionServiceDependencies,
} from "./execute-match.js"
import {
  createFixtureRuntimeExecutionAuthorityContext,
  type FixtureRuntimeExecutionAuthorityContext,
} from "./runtime-execution-evidence.test-support.js"
import {
  RuntimeEvidenceAuthorityLoadError,
  type RuntimeEvidenceAuthorityLoader,
  type VerifiedMountedRuntimeEvidenceAuthority,
} from "./runtime-evidence-authority.js"
import { createRuntimeServiceConfig } from "./runtime-config.js"

const runtimeConfig = createRuntimeServiceConfig({
  strategyExecutionAdapter: "worker-thread",
})

const source = `
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: null }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: null }
  },
}
`

const requestContext = (
  status: "exhibition_only" | "counted" = "exhibition_only",
): {
  request: RuntimeExecutionServiceRequest
  context: FixtureRuntimeExecutionAuthorityContext
} => {
  const bottom = buildStrategyRevision({
    source,
    strategyId: `strategy:counted-safety:${status}:bottom`,
  })
  const top = buildStrategyRevision({
    source,
    strategyId: `strategy:counted-safety:${status}:top`,
  })
  const context = createFixtureRuntimeExecutionAuthorityContext({
    fixtureId: `counted-safety:${status}`,
    bottom,
    top,
    effectiveStatus: status,
  })
  return {
    context,
    request: {
      contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
      kind: "executeMatch",
      requestId: `runtime-request:counted-safety:${status}`,
      match: {
        matchId: `match:counted-safety:${status}`,
        seed: "seed:counted-safety",
        arenaVariant: {
          id: "arena:counted-safety",
          name: "Counted Safety Arena",
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
      evidenceSnapshot: context.evidenceSnapshot,
    },
  }
}

const sequencedLoader = (
  values: readonly (
    | Readonly<VerifiedMountedRuntimeEvidenceAuthority>
    | Error
  )[],
): RuntimeEvidenceAuthorityLoader => {
  let index = 0
  let current: Readonly<VerifiedMountedRuntimeEvidenceAuthority> | undefined
  return {
    load: vi.fn(() => {
      const value = values[Math.min(index, values.length - 1)]
      index += 1
      if (value instanceof Error) throw value
      current = value
      return value
    }),
    current: () => current,
  }
}

const authorityWith = (
  authority: Readonly<VerifiedMountedRuntimeEvidenceAuthority>,
  overrides: Partial<VerifiedMountedRuntimeEvidenceAuthority> & {
    payload?: Partial<VerifiedMountedRuntimeEvidenceAuthority["payload"]>
  },
): Readonly<VerifiedMountedRuntimeEvidenceAuthority> =>
  Object.freeze({
    ...authority,
    ...overrides,
    payload: Object.freeze({
      ...authority.payload,
      ...overrides.payload,
    }),
  })

const executeWith = (
  request: RuntimeExecutionServiceRequest,
  authorityLoader: RuntimeEvidenceAuthorityLoader,
  dependencies: Partial<RuntimeExecutionServiceDependencies> = {},
) =>
  executeRuntimeServiceRequest(request, runtimeConfig, {
    ...dependencies,
    authorityLoader,
  })

const expectEvidenceFailure = (
  response: ReturnType<typeof executeRuntimeServiceRequest>,
  code:
    | "EVIDENCE_IDENTITY_MISMATCH"
    | "EVIDENCE_REGISTRY_DRIFT"
    | "EVIDENCE_REVOKED"
    | "EVIDENCE_UNVERIFIABLE",
): void => {
  expect(response.ok).toBe(false)
  if (response.ok) throw new Error("expected evidence failure")
  expect(response.systemFailure.code).toBe(code)
  expect(response.systemFailure.retryable).toBe(true)
  const serialized = JSON.stringify(response)
  expect(serialized).not.toContain("chronicle")
  expect(serialized).not.toContain("finalState")
  expect(serialized).not.toContain(source.trim())
  expect(serialized).not.toContain("/Users/")
}

describe("runtime-service counted safety", () => {
  it.each(["exhibition_only", "counted"] as const)(
    "accepts exact current %s authority and independently reloads acceptance, pre-invocation, and post-execution",
    (status) => {
      const { request, context } = requestContext(status)
      const build = vi.fn(buildChronicleFromMatch)
      const response = executeWith(request, context.authorityLoader, {
        buildChronicleFromMatch: build,
      })

      expect(response.ok).toBe(true)
      expect(context.authorityLoader.load).toHaveBeenCalledTimes(3)
      expect(build).toHaveBeenCalledTimes(1)
      for (const entrant of Object.values(request.evidenceSnapshot.entrants)) {
        expect(entrant.effectiveStatus).toBe(status)
        expect(entrant.containmentCertificateId).toBeDefined()
        expect(entrant.conformanceCertificateId === undefined).toBe(
          status === "exhibition_only",
        )
      }
    },
  )

  it.each([
    {
      name: "tuple",
      mutate: (request: RuntimeExecutionServiceRequest) => ({
        ...request,
        evidenceSnapshot: {
          ...request.evidenceSnapshot,
          compatibility: {
            ...request.evidenceSnapshot.compatibility,
            tupleId: `sha256:${"9".repeat(64)}`,
          },
        },
      }),
    },
    {
      name: "registry generation",
      mutate: (request: RuntimeExecutionServiceRequest) => ({
        ...request,
        evidenceSnapshot: {
          ...request.evidenceSnapshot,
          registryGeneration: "8",
        },
      }),
    },
    {
      name: "lane identity",
      mutate: (request: RuntimeExecutionServiceRequest) => ({
        ...request,
        evidenceSnapshot: {
          ...request.evidenceSnapshot,
          entrants: {
            ...request.evidenceSnapshot.entrants,
            bottom: {
              ...request.evidenceSnapshot.entrants.bottom,
              laneIdentityHash: `sha256:${"8".repeat(64)}`,
            },
          },
        },
      }),
    },
    {
      name: "scheduling decision hash",
      mutate: (request: RuntimeExecutionServiceRequest) => ({
        ...request,
        evidenceSnapshot: {
          ...request.evidenceSnapshot,
          entrants: {
            ...request.evidenceSnapshot.entrants,
            bottom: {
              ...request.evidenceSnapshot.entrants.bottom,
              schedulingDecisionHash: `sha256:${"7".repeat(64)}`,
            },
          },
        },
      }),
    },
    {
      name: "containment certificate",
      mutate: (request: RuntimeExecutionServiceRequest) => ({
        ...request,
        evidenceSnapshot: {
          ...request.evidenceSnapshot,
          entrants: {
            ...request.evidenceSnapshot.entrants,
            top: {
              ...request.evidenceSnapshot.entrants.top,
              containmentCertificateHash: `sha256:${"6".repeat(64)}`,
            },
          },
        },
      }),
    },
  ])("rejects exact $name mismatch before runtime creation", ({ mutate }) => {
    const { request, context } = requestContext()
    const runtimeFactory = vi.fn(() => {
      throw new Error("runtime factory must not run")
    })
    const response = executeWith(
      mutate(request) as RuntimeExecutionServiceRequest,
      context.authorityLoader,
      { createRuntimeForRevision: runtimeFactory },
    )

    expectEvidenceFailure(response, "EVIDENCE_IDENTITY_MISMATCH")
    expect(runtimeFactory).not.toHaveBeenCalled()
  })

  it("rejects an operator-disabled lane and a revoked certificate before runtime creation", () => {
    const { request, context } = requestContext()
    const bottom = request.evidenceSnapshot.entrants.bottom
    const containment = context.authority.payload.certificates.find(
      (certificate) =>
        certificate.certificateId === bottom.containmentCertificateId,
    )!
    const disabled = authorityWith(context.authority, {
      payload: {
        operatorLaneDisables: [
          {
            laneIdentityHash: bottom.laneIdentityHash,
            disabledAt: "2026-07-13T00:00:00.000Z",
            reasonCode: "fixture-kill-switch",
          },
        ],
      },
    })
    const revoked = authorityWith(context.authority, {
      payload: {
        revocations: [
          {
            certificateId: containment.certificateId,
            certificateRecordHash: containment.certificateRecordHash,
            revokedAt: "2026-07-13T00:00:00.000Z",
            reasonCode: "fixture-revocation",
          },
        ],
      },
    })

    expectEvidenceFailure(
      executeWith(request, sequencedLoader([disabled])),
      "EVIDENCE_REVOKED",
    )
    expectEvidenceFailure(
      executeWith(request, sequencedLoader([revoked])),
      "EVIDENCE_REVOKED",
    )
  })

  it("rejects authority replacement immediately before invocation without constructing a runtime result", () => {
    const { request, context } = requestContext()
    const drifted = authorityWith(context.authority, {
      authorityBundleHash: `sha256:${"5".repeat(64)}`,
      registryGeneration: "8",
      payload: { registryGeneration: "8" },
    })
    const build = vi.fn(buildChronicleFromMatch)
    const response = executeWith(
      request,
      sequencedLoader([context.authority, drifted]),
      { buildChronicleFromMatch: build },
    )

    expectEvidenceFailure(response, "EVIDENCE_REGISTRY_DRIFT")
    expect(build).not.toHaveBeenCalled()
  })

  it("discards the complete in-memory result when authority drifts after execution", () => {
    const { request, context } = requestContext()
    const drifted = authorityWith(context.authority, {
      authorityBundleHash: `sha256:${"4".repeat(64)}`,
      registryGeneration: "8",
      payload: { registryGeneration: "8" },
    })
    const build = vi.fn(buildChronicleFromMatch)
    const response = executeWith(
      request,
      sequencedLoader([context.authority, context.authority, drifted]),
      { buildChronicleFromMatch: build },
    )

    expectEvidenceFailure(response, "EVIDENCE_REGISTRY_DRIFT")
    expect(build).toHaveBeenCalledTimes(1)
  })

  it("maps unavailable or unverifiable mounted authority to one redacted retryable system failure", () => {
    const { request } = requestContext()
    const response = executeWith(
      request,
      sequencedLoader([new RuntimeEvidenceAuthorityLoadError("ANCHOR_IO")]),
    )

    expectEvidenceFailure(response, "EVIDENCE_UNVERIFIABLE")
    expect(JSON.stringify(response)).not.toContain("ANCHOR_IO")
  })
})
