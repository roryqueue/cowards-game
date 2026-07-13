import { once } from "node:events"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import type { AddressInfo } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"
import {
  DEFAULT_RUNTIME_LIMITS,
  INITIAL_BOUNDS,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  type ExecutableLaneIdentity,
  type RuntimeExecutionServiceRequest,
} from "@cowards/spec"
import { buildStrategyRevision } from "@cowards/runtime-js"
import {
  executeRuntimeServiceRequest,
  type RuntimeExecutionServiceDependencies,
} from "./execute-match.js"
import {
  createFixtureDeploymentLaneIdentity,
  createFixtureRuntimeExecutionAuthorityContext,
  type FixtureRuntimeExecutionAuthorityContext,
} from "./runtime-execution-evidence.test-support.js"
import {
  RuntimeEvidenceAuthorityLoadError,
  type RuntimeEvidenceAuthorityLoader,
  type VerifiedMountedRuntimeEvidenceAuthority,
} from "./runtime-evidence-authority.js"
import { createRuntimeServiceConfig } from "./runtime-config.js"
import {
  DEPLOYMENT_LANE_REGISTRY_SCHEMA_VERSION,
  type DeploymentLaneProfile,
} from "./deployment-lane-registry.js"
import { runtimeServiceConfigFromEnvironment } from "./production-runtime-config.js"
import { createRuntimeExecutionHttpServer } from "./server.js"

const runtimeConfig = createRuntimeServiceConfig({
  strategyExecutionAdapter: "worker-thread",
  semanticReceiptSecret: "fixture-semantic-receipt-secret-v1",
  resolveDeploymentLaneIdentity: createFixtureDeploymentLaneIdentity,
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

const requestWithProviderIdentity = (
  request: RuntimeExecutionServiceRequest,
): RuntimeExecutionServiceRequest => ({
  ...request,
  strategies: Object.fromEntries(
    Object.entries(request.strategies).map(([side, revision]) => {
      const artifact =
        revision.metadata.sourceArtifact ?? revision.metadata.compiledArtifact
      return [
        side,
        {
          ...revision,
          metadata: {
            ...revision.metadata,
            providerValidation: {
              providerId: `fixture-provider:${revision.runtime.language.id}`,
              contractVersion: "fixture-provider-contract-v1",
              sourceHash: revision.sourceHash,
              sourceBytes: revision.sourceBytes,
              ...(artifact === undefined
                ? {}
                : {
                    artifactHash: artifact.hash,
                    artifactBytes: artifact.bytes,
                  }),
              proof: "fixture-only-provider-proof",
            },
          },
        },
      ]
    }),
  ) as unknown as RuntimeExecutionServiceRequest["strategies"],
})

const registryForRequest = (request: RuntimeExecutionServiceRequest) => {
  const revision = request.strategies.bottom
  const identity = createFixtureDeploymentLaneIdentity(revision)
  const profile: DeploymentLaneProfile = {
    providerId: identity.providerId,
    languageId: identity.languageId,
    languageVersion: revision.runtime.language.version,
    runtimeId: identity.runtimeId,
    runtimeVersion: identity.runtimeVersion,
    toolchainId: identity.toolchainId,
    toolchainVersion: identity.toolchainVersion,
    adapterId: identity.adapterId,
    adapterVersion: identity.adapterVersion,
    policyId: identity.policyId,
    policyVersion: identity.policyVersion,
    corpusId: identity.corpusId,
    corpusVersion: identity.corpusVersion,
    artifactKind: "source",
    artifactIdPrefix: identity.artifactId.slice(0, -revision.id.length),
    implementationId: identity.implementationId,
    buildId: identity.buildId,
    semanticTupleId: identity.semanticTupleId,
    semanticTuple: { ...identity.semanticTuple },
  }
  return {
    schemaVersion: DEPLOYMENT_LANE_REGISTRY_SCHEMA_VERSION,
    registryId: "fixture-only:deployment-lanes",
    lanes: [profile],
  }
}

const executeOverProductionConfiguredHttp = async (input: {
  request: RuntimeExecutionServiceRequest
  authorityLoader: RuntimeEvidenceAuthorityLoader
  registry: ReturnType<typeof registryForRequest>
}): Promise<{ status: number; body: Record<string, unknown> }> => {
  const directory = mkdtempSync(join(tmpdir(), "cowards-deployment-lanes-"))
  const registryPath = join(directory, "registry.json")
  writeFileSync(registryPath, JSON.stringify(input.registry), "utf8")
  const runtimeConfig = runtimeServiceConfigFromEnvironment({
    STRATEGY_EXECUTION_ADAPTER: "worker-thread",
    COWARDS_RUNTIME_DEPLOYMENT_LANE_REGISTRY: registryPath,
    COWARDS_RUNTIME_SERVICE_SEMANTIC_RECEIPT_SECRET:
      "fixture-semantic-receipt-secret-v1",
  })
  const server = createRuntimeExecutionHttpServer({
    runtimeConfig,
    authorityLoader: input.authorityLoader,
  })
  try {
    server.listen(0, "127.0.0.1")
    await once(server, "listening")
    const address = server.address() as AddressInfo
    const response = await fetch(
      `http://127.0.0.1:${address.port}/execute-match`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input.request),
      },
    )
    return {
      status: response.status,
      body: (await response.json()) as Record<string, unknown>,
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
    rmSync(directory, { recursive: true, force: true })
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
      const value = values[Math.min(index, values.length - 1)]!
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
  overrides: Omit<
    Partial<VerifiedMountedRuntimeEvidenceAuthority>,
    "payload"
  > & {
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
  it("uses the production startup registry path for exact HTTP execution and rejects every identity component", async () => {
    expect(() =>
      runtimeServiceConfigFromEnvironment({
        STRATEGY_EXECUTION_ADAPTER: "worker-thread",
      }),
    ).toThrow(/deployment.lane.registry/iu)

    const exactContext = requestContext("counted")
    const exactRequest = requestWithProviderIdentity(exactContext.request)
    const exact = await executeOverProductionConfiguredHttp({
      request: exactRequest,
      authorityLoader: exactContext.context.authorityLoader,
      registry: registryForRequest(exactRequest),
    })
    expect(exact.status).toBe(200)
    expect(exact.body.ok).toBe(true)

    const profileMutations: Array<
      [
        string,
        keyof Omit<
          DeploymentLaneProfile,
          | "artifactKind"
          | "languageVersion"
          | "semanticTupleId"
          | "semanticTuple"
        >,
      ]
    > = [
      ["provider", "providerId"],
      ["language", "languageId"],
      ["runtime", "runtimeId"],
      ["runtime version", "runtimeVersion"],
      ["toolchain", "toolchainId"],
      ["toolchain version", "toolchainVersion"],
      ["adapter", "adapterId"],
      ["adapter version", "adapterVersion"],
      ["policy", "policyId"],
      ["policy version", "policyVersion"],
      ["corpus", "corpusId"],
      ["corpus version", "corpusVersion"],
      ["artifact id", "artifactIdPrefix"],
      ["implementation", "implementationId"],
      ["build", "buildId"],
    ]
    for (const [name, field] of profileMutations) {
      const context = requestContext("counted")
      const request = requestWithProviderIdentity(context.request)
      const registry = registryForRequest(request)
      registry.lanes[0]![field] = `drifted:${name}`
      const result = await executeOverProductionConfiguredHttp({
        request,
        authorityLoader: context.context.authorityLoader,
        registry,
      })
      expect(result.status, name).toBe(422)
      expect(result.body.ok, name).toBe(false)
    }

    const artifactContext = requestContext("counted")
    const artifactRequest = requestWithProviderIdentity(artifactContext.request)
    const sourceArtifact =
      artifactRequest.strategies.bottom.metadata.sourceArtifact!
    artifactRequest.strategies.bottom.metadata.sourceArtifact = {
      ...sourceArtifact,
      hash: "7".repeat(64),
    }
    const artifactResult = await executeOverProductionConfiguredHttp({
      request: artifactRequest,
      authorityLoader: artifactContext.context.authorityLoader,
      registry: registryForRequest(
        requestWithProviderIdentity(artifactContext.request),
      ),
    })
    expect(artifactResult.status, "artifact sha256").toBe(422)
    expect(artifactResult.body.ok, "artifact sha256").toBe(false)
  })

  it.each(["exhibition_only", "counted"] as const)(
    "accepts exact current %s authority and independently reloads acceptance, pre-invocation, and post-execution",
    (status) => {
      const { request, context } = requestContext(status)
      const response = executeWith(request, context.authorityLoader)

      expect(response.ok).toBe(true)
      expect(context.authorityLoader.load).toHaveBeenCalledTimes(3)
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

  it("binds every deployed lane component before runtime construction", () => {
    const mutations: Partial<ExecutableLaneIdentity>[] = [
      { providerId: "other-provider" },
      { languageId: "other-language" },
      { runtimeId: "other-runtime" },
      { runtimeVersion: "other-runtime-version" },
      { toolchainId: "other-toolchain" },
      { toolchainVersion: "other-toolchain-version" },
      { adapterId: "other-adapter" },
      { adapterVersion: "other-adapter-version" },
      { policyId: "other-policy" },
      { policyVersion: "other-policy-version" },
      { corpusId: "other-corpus" },
      { corpusVersion: "other-corpus-version" },
      { artifactId: "other-artifact" },
      { artifactSha256: "7".repeat(64) },
      { implementationId: "other-implementation" },
      { buildId: "other-build" },
    ]
    for (const mutation of mutations) {
      const { request, context } = requestContext()
      const runtimeFactory = vi.fn(() => {
        throw new Error("runtime factory must not run")
      })
      const mismatchedConfig = createRuntimeServiceConfig({
        strategyExecutionAdapter: "worker-thread",
        semanticReceiptSecret: "fixture-semantic-receipt-secret-v1",
        resolveDeploymentLaneIdentity: (revision) => ({
          ...createFixtureDeploymentLaneIdentity(revision),
          ...mutation,
        }),
      })
      const response = executeRuntimeServiceRequest(request, mismatchedConfig, {
        authorityLoader: context.authorityLoader,
        createRuntimeForRevision: runtimeFactory,
      })
      expectEvidenceFailure(response, "EVIDENCE_IDENTITY_MISMATCH")
      expect(runtimeFactory).not.toHaveBeenCalled()
    }
  })

  it("rejects a mounted semantic tuple mismatch before runtime creation", () => {
    const { request, context } = requestContext()
    const runtimeFactory = vi.fn(() => {
      throw new Error("runtime factory must not run")
    })
    const tupleMismatch = authorityWith(context.authority, {
      semanticTupleManifestHash: `sha256:${"9".repeat(64)}`,
      payload: {
        semanticTupleManifestHash: `sha256:${"9".repeat(64)}`,
      },
    })
    const response = executeWith(request, sequencedLoader([tupleMismatch]), {
      createRuntimeForRevision: runtimeFactory,
    })

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
    const runtimeFactory = vi.fn(() => {
      throw new Error("runtime factory must not run")
    })
    const response = executeWith(
      request,
      sequencedLoader([context.authority, drifted]),
      { createRuntimeForRevision: runtimeFactory },
    )

    expectEvidenceFailure(response, "EVIDENCE_REGISTRY_DRIFT")
    expect(runtimeFactory).not.toHaveBeenCalled()
  })

  it("discards the complete in-memory result when authority drifts after execution", () => {
    const { request, context } = requestContext()
    const drifted = authorityWith(context.authority, {
      authorityBundleHash: `sha256:${"4".repeat(64)}`,
      registryGeneration: "8",
      payload: { registryGeneration: "8" },
    })
    const response = executeWith(
      request,
      sequencedLoader([context.authority, context.authority, drifted]),
    )

    expectEvidenceFailure(response, "EVIDENCE_REGISTRY_DRIFT")
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
