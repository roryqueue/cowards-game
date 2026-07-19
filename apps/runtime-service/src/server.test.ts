import { Buffer } from "node:buffer"
import { once } from "node:events"
import type { AddressInfo } from "node:net"
import { Readable } from "node:stream"
import { afterEach, describe, expect, it } from "vitest"
import {
  DEFAULT_RUNTIME_LIMITS,
  INITIAL_BOUNDS,
  RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  RUNTIME_INVOCATION_V1_17_INITIAL_EXECUTION_LEDGER_ROOT,
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
  STRATEGY_RUNTIME_ABI_VERSION,
  VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
  RuntimeExecutionServiceResponseV117Schema,
  RuntimeExecutionServiceResponseV118Schema,
  admitCanonicalJsonBytes,
  createAuthenticatedRuntimeInvocationResponseV117,
  createRuntimeInvocationExecutionReceiptV117,
  createRuntimeInvocationTraceV117,
  encodeCanonicalJson,
  hashCanonicalIdentity,
  hashExecutableLaneIdentity,
  hashRuntimeIdentityManifest,
  hashStrategyProviderValidationV117,
  runtimeInvocationExecutionLedgerPoststateRootV117,
  serializeRuntimeInvocationResponseV117,
  type JsonValue,
  type RuntimeInvocationExecutionReceiptEvidenceV117,
  type RuntimeInvocationResultV117,
  type StrategyRevision,
} from "@cowards/spec"
import { buildStrategyRevisionV117 } from "@cowards/runtime-js"
import {
  createRuntimeServiceConfig,
  selectedRuntimeServiceContract,
} from "./runtime-config.js"
import {
  createFixtureDeploymentLaneIdentity,
  createFixtureRuntimeEvidenceAuthorityLoader,
  createFixtureRuntimeExecutionEvidenceSnapshot,
} from "./runtime-execution-evidence.test-support.js"
import {
  admitRuntimeInvocationRequestBytesV117,
  admitStrategyPayloadBytesV117,
  createRuntimeExecutionHttpServer,
  readBody,
  readBodyBytes,
} from "./server.js"
import { verifyRuntimeSemanticReceiptV117 } from "./semantic-receipt-v1-17.js"
import {
  SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_DOMAINS_V117,
  SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_PROFILE_V117,
  SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_SCHEMA_V117,
  composeSuccessorRuntimeIdentityV117,
} from "./successor-runtime-identity.js"

process.env.COWARDS_PROVIDER_VALIDATION_SECRET =
  "cowards-provider-validation-test-secret-v1.33"

const PRIVATE_ARTIFACT_TOKEN = "cowards-private-artifact-test-token-v1.35"

const selectedProviderProofPattern = new RegExp(
  `^${String(STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION).startsWith("runtime-provider-validation-") ? "sha256" : "hmac-sha256"}:[0-9a-f]{64}$`,
)

const expectExactSelectedProviderProof = (
  body: Record<string, unknown>,
): void => {
  if (
    !String(STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION).startsWith(
      "runtime-provider-validation-",
    )
  ) {
    return
  }
  const metadata = body.metadata as Record<string, unknown>
  const validation = metadata.providerValidation as Record<string, unknown>
  expect(validation.proof).toBe(
    hashStrategyProviderValidationV117({
      providerId: String(validation.providerId),
      contractVersion: "runtime-provider-validation-v1.17",
      sourceHash: String(validation.sourceHash),
      sourceBytes: Number(validation.sourceBytes),
      artifactHash: String(validation.artifactHash),
      artifactBytes: Number(validation.artifactBytes),
    }),
  )
}

const expectSelectedProviderAuthority = (
  body: Record<string, unknown>,
): void => {
  const provider = body.provider as Record<string, unknown>
  const runtime = body.runtime as Record<string, unknown>
  const metadata = body.metadata as Record<string, unknown>
  const validation = metadata.providerValidation as Record<string, unknown>
  const artifact = (metadata.sourceArtifact ??
    metadata.compiledArtifact) as Record<string, unknown>
  expect(provider.contractVersion).toBe(
    STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
  )
  expect(provider.runtimeAbiVersion).toBe(STRATEGY_RUNTIME_ABI_VERSION)
  expect(runtime.abiVersion).toBe(STRATEGY_RUNTIME_ABI_VERSION)
  expect(validation.contractVersion).toBe(
    STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
  )
  expect(artifact.abiVersion).toBe(STRATEGY_RUNTIME_ABI_VERSION)
  const sourceFormat = String(body.sourceFormat)
  const expectedAbiPosture =
    sourceFormat === "typescript"
      ? "runtime-js-source-artifact"
      : sourceFormat === "python"
        ? "python-source-provenance-json"
        : String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.17"
          ? "wasi-preview1-stdin-canonical-request-stdout-raw-canonical-payload"
          : "wasi-preview1-stdin-stdout-json"
  expect(provider.abiPosture).toBe(expectedAbiPosture)
  if (metadata.compiledArtifact !== undefined) {
    expect(artifact.abiEnvelope).toBe(
      String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.17"
        ? "stdin-canonical-request-stdout-raw-canonical-payload"
        : "stdin-stdout-json",
    )
  }
}

const successorTemplate = (() => {
  const bindings = SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_DOMAINS_V117.map(
    (domain) => ({
      domain,
      publicId:
        domain === "canonicalJsonProfile"
          ? "canonical-json-v1.1"
          : domain === "containmentPolicy"
            ? "fixture-package-none-policy"
            : `fixture.${domain}.v1.17`,
      sha256:
        domain === "budgetProfile"
          ? RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256.slice("sha256:".length)
          : hashCanonicalIdentity(domain, [
              Buffer.from(`fixture:${domain}:v1.17`, "utf8"),
            ]),
    }),
  )
  const binding = (
    domain: (typeof SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_DOMAINS_V117)[number],
  ) => bindings.find((candidate) => candidate.domain === domain)!
  const exactPins = [
    [
      "runtimeExecutableDigest",
      `sha256:${binding("runtimeExecutable").sha256}`,
    ],
    ["reportedVersion", "node-v26.0.0"],
    ["targetAbi", "darwin-arm64"],
    ["compilerFlags", `sha256:${"6".repeat(64)}`],
    ["adapterBuildDigest", `sha256:${binding("adapterBuild").sha256}`],
    [
      "standardLibraryOrSysrootDigest",
      `sha256:${binding("sysrootStdlib").sha256}`,
    ],
    ["containmentPolicyId", binding("containmentPolicy").publicId],
    ["budgetProfileSha256", RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256],
    ["canonicalJsonProfileId", binding("canonicalJsonProfile").publicId],
    ["behaviorSettingsHash", `sha256:${"9".repeat(64)}`],
  ] as const
  return {
    schemaVersion: SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_SCHEMA_V117,
    profile: SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_PROFILE_V117,
    bindings,
    exactPins,
    laneProfileSha256: `sha256:${"7".repeat(64)}` as const,
  }
})()

const successorEntrant = (
  revision: StrategyRevision,
  graphDigit: string,
) => {
  const deployed = createFixtureDeploymentLaneIdentity(
    revision,
    VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
  )
  const composed = composeSuccessorRuntimeIdentityV117({
    revision,
    deployed,
    template: successorTemplate,
  })
  if (composed === undefined) throw new Error("successor identity unavailable")
  return {
    strategyRevisionId: revision.id,
    laneIdentityHash:
      `sha256:${hashExecutableLaneIdentity(deployed)}` as const,
    sourceIdentity: composed.sourceIdentity,
    identityManifestRoot:
      `sha256:${hashRuntimeIdentityManifest(composed.identityManifest)}` as const,
    evidenceGraphRoot: `sha256:${graphDigit.repeat(64)}` as const,
    exactPins: successorTemplate.exactPins,
  }
}

const runtimeConfig = createRuntimeServiceConfig({
  strategyExecutionAdapter: "worker-thread",
  semanticReceiptSecret: "fixture-semantic-receipt-secret-v1",
})

const servers: ReturnType<typeof createRuntimeExecutionHttpServer>[] = []

const withServer = async (
  bodyLimitBytes = 1024,
  privateArtifactToken?: string,
): Promise<{
  url: string
  close: () => Promise<void>
}> => {
  const server = createRuntimeExecutionHttpServer({
    runtimeConfig,
    bodyLimitBytes,
    privateArtifactToken,
  })
  servers.push(server)
  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  const address = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      }),
  }
}

afterEach(async () => {
  await Promise.allSettled(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          if (!server.listening) {
            resolve()
            return
          }
          server.close(() => resolve())
        }),
    ),
  )
})

describe("runtime execution HTTP boundary", () => {
  it("preserves successor raw bytes before any UTF-8 or host JSON conversion", async () => {
    const raw = Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xc3, 0x28, 0x7d])
    const request = Readable.from([
      raw.subarray(0, 5),
      raw.subarray(5),
    ]) as unknown as Parameters<typeof readBodyBytes>[0]

    await expect(readBodyBytes(request, raw.byteLength)).resolves.toEqual(raw)
  })

  it("admits v1.17 raw bytes before routing and exercises the real current Match path", async () => {
    const source = `export default {
      selectActivations() { return { activationOrders: [], strategyMemory: {} } },
      soldierBrain() { return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} } }
    }`
    const bottom = buildStrategyRevisionV117({
      source: `${source}\n// entrant:bottom`,
      strategyId: "strategy:http-route:bottom",
    })
    const top = buildStrategyRevisionV117({
      source: `${source}\n// entrant:top`,
      strategyId: "strategy:http-route:top",
    })
    const evidenceSnapshot = createFixtureRuntimeExecutionEvidenceSnapshot({
      fixtureId: "server-http-route-v117",
      bottom,
      top,
      compatibility: VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
    })
    const current = {
      contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
      kind: "executeMatch" as const,
      requestId: "runtime-request:http-route:v1.16",
      match: {
        matchId: "match:http-route:v1.16",
        seed: "seed:http-route:v1.16",
        arenaVariant: {
          id: "runtime-service-http-route-arena",
          name: "Runtime Service HTTP Route Arena",
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
      evidenceSnapshot,
    }
    const bottomBinding = successorEntrant(bottom, "2")
    const topBinding = successorEntrant(top, "4")
    const budgetProfileSha256 = RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256
    const ledgerPrestateRoot =
      RUNTIME_INVOCATION_V1_17_INITIAL_EXECUTION_LEDGER_ROOT
    const candidate = {
      contractVersion: "runtime-execution-service-v1.17",
      kind: "executeMatch",
      requestId: "request:http-full-service:v1.17",
      matchId: current.match.matchId,
      compatibilityTupleId: current.evidenceSnapshot.compatibility.tupleId,
      authority: {
        bundleHash: `sha256:${"a".repeat(64)}`,
        sourceManifestHash: `sha256:${"b".repeat(64)}`,
        registryGeneration: "17",
      },
      legacyAuthority: {
        bundleHash: current.evidenceSnapshot.authorityBundleHash,
        sourceManifestHash:
          current.evidenceSnapshot.publication.sourceManifestHash,
        registryGeneration: current.evidenceSnapshot.registryGeneration,
      },
      entrants: { bottom: bottomBinding, top: topBinding },
      accounting: { budgetProfileSha256, ledgerPrestateRoot },
      match: current as unknown as JsonValue,
    } as const
    const bindings = [bottomBinding, topBinding].map((entrant, index) => ({
      attestationId: `attestation:http-route:${String(index)}`,
      binding: {
        identityManifestRoot: entrant.identityManifestRoot,
        evidenceGraphRoot: entrant.evidenceGraphRoot,
        exactPins: entrant.exactPins,
      },
    }))
    const signingIdentityV117 = {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: "fixture-only:runtime-service-production-path:v1.17",
    } as const
    let candidateInvocations = 0
    let forceMissingReceipt = false
    let expectedLedgerPoststateRoot: `sha256:${string}` | undefined
    const routeRuntimeConfig = createRuntimeServiceConfig({
      strategyExecutionAdapter: "worker-thread",
      semanticReceiptSecret: "fixture-semantic-receipt-secret-v1",
      resolveDeploymentLaneIdentity: (revision) =>
        createFixtureDeploymentLaneIdentity(
          revision,
          VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
        ),
      resolveSuccessorRuntimeIdentityTemplate: () => successorTemplate,
    })
    const selectedV117Config =
      routeRuntimeConfig.contractSelection.runtimeServiceVersion ===
      "runtime-execution-service-v1.17"
        ? routeRuntimeConfig
        : {
            ...routeRuntimeConfig,
            contractSelection: {
              runtimeAbiVersion: "strategy-runtime-abi-v1.17",
              runtimeServiceVersion: "runtime-execution-service-v1.17",
              semanticReceiptVersion: "runtime-semantic-receipt-v1.17",
              canonicalJsonVersion: "canonical-json-v1.1",
            },
          }
    expect(selectedV117Config.contractSelection).toEqual({
      runtimeAbiVersion: "strategy-runtime-abi-v1.17",
      runtimeServiceVersion: "runtime-execution-service-v1.17",
      semanticReceiptVersion: "runtime-semantic-receipt-v1.17",
      canonicalJsonVersion: "canonical-json-v1.1",
    })
    const server = createRuntimeExecutionHttpServer({
      runtimeConfig: selectedV117Config,
      authorityLoader: createFixtureRuntimeEvidenceAuthorityLoader(
        current.evidenceSnapshot,
        current.strategies,
      ),
      authorityLoaderV117: {
        load: () => ({
          authorityBundleHash: candidate.authority.bundleHash,
          registryGeneration: candidate.authority.registryGeneration,
          semanticTupleManifestHash: candidate.compatibilityTupleId,
          sourceManifestHash: candidate.authority.sourceManifestHash,
          trustDomain: "fixture",
          keyId: "fixture-v1.17-authority",
          payload: {
            schemaVersion: "v1.37-runtime-evidence-authority-payload-v1.17",
            bundleVersion: "fixture-v1.17-authority",
            registryGeneration: candidate.authority.registryGeneration,
            issuedAt: "2026-07-15T00:00:00.000Z",
            validFrom: "2026-07-15T00:00:00.000Z",
            validUntil: "2026-07-16T00:00:00.000Z",
            semanticTupleManifestHash: candidate.compatibilityTupleId,
            sourceManifestHash: candidate.authority.sourceManifestHash,
            attestations: bindings.map(({ attestationId, binding }) => ({
              attestationId,
              attestationHash: `sha256:${"8".repeat(64)}`,
              producerId: "fixture-managed",
              producerKeyId: "fixture-key",
              trustDomain: "fixture" as const,
              managedIdentity: true as const,
              imports: [],
              binding: {
                graphSchemaVersion: "runtime-evidence-graph-v1.17",
                graphProfile: "runtime-identity-evidence-dag-v1",
                ...binding,
              },
            })),
            certificates: bindings.map(({ attestationId, binding }, index) => ({
              certificateId:
                current.evidenceSnapshot.entrants[
                  index === 0 ? "bottom" : "top"
                ].containmentCertificateId!,
              certificateVersion: "runtime-certificate-v1.17",
              certificateRecordHash: `sha256:${"9".repeat(64)}`,
              certificateKind: "containment" as const,
              attestationId,
              binding: {
                graphSchemaVersion: "runtime-evidence-graph-v1.17",
                graphProfile: "runtime-identity-evidence-dag-v1",
                ...binding,
              },
            })),
          },
        }),
        current: () => undefined,
      },
      signingIdentityV117,
      candidateInvocationAdapterV117: ({ request, signingIdentity }) => {
        candidateInvocations += 1
        if (forceMissingReceipt) return new Uint8Array()
        const value: JsonValue =
          request.method === "selectActivations"
            ? { activationOrders: [], strategyMemory: {} }
            : {
                action: { type: "TURN_TO_STONE" },
                soldierMemory: {},
              }
        const encoded = encodeCanonicalJson(value, {
          context: "authenticated-outer-envelope",
        })
        if (!encoded.ok) throw new Error(encoded.error.code)
        const prestate = request.accounting.prestate
        const evidence: RuntimeInvocationExecutionReceiptEvidenceV117 = {
          attribution: "proven_strategy",
          counters: {
            wallMilliseconds: {
              status: "measured",
              delta: 1,
              cumulative: prestate.cumulative.wallMilliseconds + 1,
            },
            computeFuel: {
              status: "measured",
              delta: 1,
              cumulative: prestate.cumulative.computeFuel + 1,
            },
            payloadBytes: {
              status: "measured",
              delta: encoded.bytes.byteLength,
              cumulative:
                prestate.cumulative.payloadBytes + encoded.bytes.byteLength,
            },
            stdoutBytes: {
              status: "measured",
              delta: encoded.bytes.byteLength + 1,
              cumulative:
                prestate.cumulative.stdoutBytes + encoded.bytes.byteLength + 1,
            },
            stderrBytes: {
              status: "measured",
              delta: 0,
              cumulative: prestate.cumulative.stderrBytes,
            },
          },
          memory: {
            status: "measured",
            peakBytes: 1,
            cumulativePeakBytes: Math.max(prestate.cumulative.memoryBytes, 1),
          },
          process: {
            status: "verified",
            processes: 1,
            threads: 1,
            children: 0,
          },
          capabilities: {
            status: "verified",
            filesystem: "none",
            network: "disabled",
            environment: "empty",
            shell: "disabled",
          },
          cancellation: {
            status: "verified",
            terminationRequired: false,
            receiptPresent: false,
            graceMilliseconds: 0,
          },
          accountingEvidence: {
            status: "verified",
            signatureVerified: true,
            monotonic: true,
          },
        }
        const outcome: RuntimeInvocationResultV117<JsonValue> = {
          kind: "success",
          value,
          trace: createRuntimeInvocationTraceV117(request, [
            "ADAPTER_AUTHENTICATED",
            "PAYLOAD_CANONICAL",
          ]),
        }
        const authenticated = createAuthenticatedRuntimeInvocationResponseV117(
          request,
          outcome,
          createRuntimeInvocationExecutionReceiptV117(request, evidence),
          signingIdentity,
        )
        expectedLedgerPoststateRoot =
          runtimeInvocationExecutionLedgerPoststateRootV117(
            authenticated.accounting.poststate,
          )
        return serializeRuntimeInvocationResponseV117(authenticated)
      },
    })
    servers.push(server)
    server.listen(0, "127.0.0.1")
    await once(server, "listening")
    const address = server.address() as AddressInfo
    const endpoint = `http://127.0.0.1:${address.port}/execute-match`
    const canonical = encodeCanonicalJson(candidate as unknown as JsonValue, {
      context: "authenticated-outer-envelope",
    })
    if (!canonical.ok) throw new Error(canonical.error.code)
    const canonicalText = Buffer.from(canonical.bytes).toString("utf8")
    const duplicated = canonicalText.replace(
      `"matchId":"${candidate.matchId}"`,
      `"matchId":"${candidate.matchId}","matchId":"${candidate.matchId}"`,
    )

    for (const body of [duplicated, JSON.stringify(candidate)]) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      })
      expect(await response.json()).toMatchObject({
        contractVersion: "runtime-execution-service-v1.17",
        ok: false,
        kind: "systemFailure",
        systemFailure: { code: "MALFORMED_REQUEST", playerPenalty: false },
      })
    }
    expect(candidateInvocations).toBe(0)
    const tamperedAccounting = {
      ...candidate,
      accounting: {
        ...candidate.accounting,
        ledgerPrestateRoot: `sha256:${"f".repeat(64)}`,
      },
    }
    const tamperedBytes = encodeCanonicalJson(
      tamperedAccounting as unknown as JsonValue,
      { context: "authenticated-outer-envelope" },
    )
    if (!tamperedBytes.ok) throw new Error(tamperedBytes.error.code)
    const tampered = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: Buffer.from(tamperedBytes.bytes),
    })
    expect(await tampered.json()).toMatchObject({
      ok: false,
      kind: "systemFailure",
      systemFailure: {
        code: "ACCOUNTING_BINDING_MISMATCH",
        playerPenalty: false,
      },
    })
    expect(candidateInvocations).toBe(0)
    const rejectedSuccessorBindings = [
      {
        ...candidate,
        entrants: {
          ...candidate.entrants,
          bottom: {
            ...candidate.entrants.bottom,
            laneIdentityHash: `sha256:${"f".repeat(64)}`,
          },
        },
      },
      {
        ...candidate,
        entrants: {
          ...candidate.entrants,
          bottom: {
            ...candidate.entrants.bottom,
            sourceIdentity: candidate.entrants.top.sourceIdentity,
          },
        },
      },
      {
        ...candidate,
        entrants: {
          ...candidate.entrants,
          bottom: {
            ...candidate.entrants.bottom,
            identityManifestRoot: candidate.entrants.top.identityManifestRoot,
            evidenceGraphRoot: candidate.entrants.top.evidenceGraphRoot,
          },
        },
      },
      {
        ...candidate,
        entrants: {
          ...candidate.entrants,
          bottom: {
            ...candidate.entrants.bottom,
            exactPins: candidate.entrants.bottom.exactPins.map((pin, index) =>
              index === 1 ? ([pin[0], "node-v99.0.0"] as const) : pin,
            ),
          },
        },
      },
    ]
    for (const rejectedCandidate of rejectedSuccessorBindings) {
      const rejectedBytes = encodeCanonicalJson(
        rejectedCandidate as unknown as JsonValue,
        { context: "authenticated-outer-envelope" },
      )
      if (!rejectedBytes.ok) throw new Error(rejectedBytes.error.code)
      const rejected = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: Buffer.from(rejectedBytes.bytes),
      })
      expect(await rejected.json()).toMatchObject({
        ok: false,
        kind: "systemFailure",
        systemFailure: {
          code: "AUTHORITY_BINDING_MISMATCH",
          playerPenalty: false,
        },
      })
      expect(candidateInvocations).toBe(0)
    }
    const successor = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: Buffer.from(canonical.bytes),
    })
    const successorBytes = new Uint8Array(await successor.arrayBuffer())
    expect(
      admitCanonicalJsonBytes(successorBytes, { profile: "service-response" })
        .ok,
    ).toBe(true)
    const successorBody = JSON.parse(
      Buffer.from(successorBytes).toString("utf8"),
    ) as Record<string, unknown>
    if (successorBody.ok !== true) {
      throw new Error(JSON.stringify(successorBody))
    }
    expect(successorBody).toMatchObject({
      contractVersion: "runtime-execution-service-v1.17",
      ok: true,
      kind: "executionResult",
      result: {
        semanticReceipt: {
          budgetProfileSha256,
          ledgerPrestateRoot,
          authorityBundleHash: candidate.authority.bundleHash,
          legacyAuthorityBundleHash: candidate.legacyAuthority.bundleHash,
          bottomLaneIdentityHash: candidate.entrants.bottom.laneIdentityHash,
          bottomOriginalSourceSha256:
            candidate.entrants.bottom.sourceIdentity.originalSourceSha256,
          bottomArtifactSha256:
            candidate.entrants.bottom.sourceIdentity.artifactSha256,
        },
      },
    })
    expect(candidateInvocations).toBe(8)
    expect(successorBody).toMatchObject({
      result: {
        ledgerPoststateRoot: expectedLedgerPoststateRoot,
        semanticReceipt: {
          ledgerPoststateRoot: expectedLedgerPoststateRoot,
        },
      },
    })
    expect(
      verifyRuntimeSemanticReceiptV117({
        request: candidate,
        response: successorBody,
        secret: routeRuntimeConfig.semanticReceiptSecret,
      }),
    ).toMatchObject({
      ledgerPrestateRoot,
      ledgerPoststateRoot: expectedLedgerPoststateRoot,
      authorityBundleHash: candidate.authority.bundleHash,
      legacyAuthorityBundleHash: candidate.legacyAuthority.bundleHash,
      bottomLaneIdentityHash: candidate.entrants.bottom.laneIdentityHash,
    })

    forceMissingReceipt = true
    const failed = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: Buffer.from(canonical.bytes),
    })
    const failedBody = (await failed.json()) as Record<string, unknown>
    expect(failedBody).toMatchObject({
      ok: false,
      kind: "systemFailure",
      systemFailure: {
        code: "CURRENT_MATCH_EXECUTION_FAILED",
        playerPenalty: false,
      },
    })
    expect(candidateInvocations).toBe(9)
    expect(JSON.stringify(failedBody)).not.toMatch(
      /chronicle|finalState|outcome|source|artifact|memory|objective|diagnostics|\/Users\//u,
    )
    forceMissingReceipt = false
    const historical = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(current),
    })
    expect(await historical.json()).toMatchObject({
      contractVersion: "runtime-execution-service-v1.17",
      ok: false,
      kind: "systemFailure",
      systemFailure: {
        code: "CONTRACT_INACTIVE",
        playerPenalty: false,
      },
    })
  })

  it("keeps outer corruption system-owned and redacted", () => {
    const privateMarker = "private Strategy source /Users/owner token=secret"
    const result = admitRuntimeInvocationRequestBytesV117(
      Buffer.from(`{"private":"${privateMarker}","private":"duplicate"}`),
      {
        keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
        secret: "fixture-only:runtime-invocation-v1.17:secret",
      },
    )

    expect(result).toMatchObject({
      kind: "system_failure",
      failure: {
        code: "OUTER_FRAME_UNDECODABLE",
        publicMessage: "Runtime system failure.",
      },
    })
    expect(JSON.stringify(result)).not.toContain(privateMarker)
    expect(JSON.stringify(result)).not.toContain("/Users/")
    expect(JSON.stringify(result)).not.toContain("token=secret")
  })

  it("keeps decoded payload canonical and schema failures player-owned", () => {
    const duplicate = admitStrategyPayloadBytesV117(
      Buffer.from(
        '{"activationOrders":[],"strategyMemory":{},"strategyMemory":null}',
      ),
      "selectActivations",
    )
    const schemaInvalid = admitStrategyPayloadBytesV117(
      Buffer.from('{"activationOrders":[]}'),
      "selectActivations",
    )
    const valid = admitStrategyPayloadBytesV117(
      Buffer.from('{"activationOrders":[],"strategyMemory":{}}'),
      "selectActivations",
    )

    expect(duplicate).toMatchObject({
      kind: "player_violation",
      violation: { code: "INVALID_OUTPUT" },
      canonicalError: { code: "DUPLICATE_KEY", owner: "player_violation" },
    })
    expect(schemaInvalid).toMatchObject({
      kind: "player_violation",
      violation: { code: "INVALID_OUTPUT" },
    })
    expect(valid).toMatchObject({
      kind: "success",
      value: { activationOrders: [], strategyMemory: {} },
    })
  })

  it("decodes bounded UTF-8 independently of transport chunk boundaries", async () => {
    const expected = {
      sourceFormat: "typescript",
      source: "const doctrine = 'é兵';",
      strategyId: "strategy:utf8",
    }
    const encoded = Buffer.from(JSON.stringify(expected), "utf8")

    for (let boundary = 1; boundary < encoded.byteLength; boundary += 1) {
      const request = Readable.from([
        encoded.subarray(0, boundary),
        encoded.subarray(boundary),
      ]) as unknown as Parameters<typeof readBody>[0]
      await expect(readBody(request, encoded.byteLength)).resolves.toBe(
        JSON.stringify(expected),
      )
    }

    const exact = Readable.from([encoded]) as unknown as Parameters<
      typeof readBody
    >[0]
    await expect(readBody(exact, encoded.byteLength)).resolves.toBe(
      JSON.stringify(expected),
    )
    const oversized = Readable.from([encoded]) as unknown as Parameters<
      typeof readBody
    >[0]
    await expect(readBody(oversized, encoded.byteLength - 1)).rejects.toThrow(
      /exceeds service limit/i,
    )
    const invalid = Readable.from([
      Buffer.from([0xc3, 0x28]),
    ]) as unknown as Parameters<typeof readBody>[0]
    await expect(readBody(invalid, 2)).rejects.toThrow(/not valid UTF-8/i)
  })

  it("health labels the current HTTP+JSON isolated JS/TS runtime implementation", async () => {
    const server = await withServer()
    const response = await fetch(`${server.url}/health`)
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      service: selectedRuntimeServiceContract().runtimeServiceVersion,
      boundaryName: "Strategy Execution Service / Runtime Broker",
      implementationLabel: "isolated JS/TS runtime service",
      transportBinding: "HTTP+JSON",
      backendAuthority: false,
    })
  })

  it("fails closed when validation selection drifts from provider authority", async () => {
    const driftedRuntimeAbi =
      String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.17"
        ? "strategy-runtime-abi-v1.14"
        : "strategy-runtime-abi-v1.17"
    const server = createRuntimeExecutionHttpServer({
      runtimeConfig: {
        ...runtimeConfig,
        contractSelection: {
          ...runtimeConfig.contractSelection,
          runtimeAbiVersion: driftedRuntimeAbi,
        },
      },
      bodyLimitBytes: 8 * 1024,
    })
    servers.push(server)
    server.listen(0, "127.0.0.1")
    await once(server, "listening")
    const address = server.address() as AddressInfo
    const source = `export default {
  selectActivations() { return [] },
  soldierBrain() { return { action: { type: "TURN_TO_STONE" }, soldierMemory: null } },
}`
    const response = await fetch(
      `http://127.0.0.1:${address.port}/validate-strategy`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceFormat: "typescript", source }),
      },
    )
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(400)
    expect(body.ok).toBe(false)
    expect(JSON.stringify(body)).not.toContain(source)
    expect(JSON.stringify(body)).not.toContain("bytesBase64")
    expect(JSON.stringify(body)).not.toContain("sourceIdentity")
  })

  it("validates TypeScript through provider proof without exposing private artifacts", async () => {
    const server = await withServer(8 * 1024)
    const source = `
export default {
  selectActivations() {
    return []
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: null }
  },
}
`
    const response = await fetch(`${server.url}/validate-strategy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFormat: "typescript",
        source,
        strategyId: "strategy:typescript",
      }),
    })
    const body = (await response.json()) as Record<string, unknown>
    const serialized = JSON.stringify(body)

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      kind: "strategyValidation",
      sourceFormat: "typescript",
      provider: {
        id: "strategy-language-provider-js-ts",
      },
      metadata: {
        tags: ["typescript", "artifact-proven", "counted", "provider"],
        sourceArtifact: {
          format: "transpiled-javascript",
          sourceHash: expect.any(String),
          sourceBytes: expect.any(Number),
          hash: expect.any(String),
          bytes: expect.any(Number),
        },
        providerValidation: {
          providerId: "strategy-language-provider-js-ts",
          contractVersion: STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
          sourceHash: expect.any(String),
          sourceBytes: expect.any(Number),
          artifactHash: expect.any(String),
          artifactBytes: expect.any(Number),
          proof: expect.stringMatching(selectedProviderProofPattern),
        },
      },
      sourceHash: expect.any(String),
      sourceBytes: expect.any(Number),
    })
    expect(serialized).not.toContain(source)
    expect(serialized).not.toContain("bytesBase64")
    expect(serialized).not.toContain("sourceIdentity")
    expect(serialized).not.toContain("/Users/")
    expect(serialized).not.toContain("process.env")
    expect(serialized).not.toContain("StrategyMemory")
    expect(serialized).not.toContain("SoldierMemory")
    expect(serialized).not.toContain('"objectivePayload":')
    expect(serialized).not.toContain("postgres://")
    expectSelectedProviderAuthority(body)
    expectExactSelectedProviderProof(body)
  })

  it("rejects private TypeScript artifact requests without the internal token", async () => {
    const server = await withServer(8 * 1024)
    const source = `
export default {
  selectActivations() {
    return []
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: null }
  },
}
`
    const response = await fetch(`${server.url}/validate-strategy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFormat: "typescript",
        source,
        strategyId: "strategy:typescript",
        includePrivateArtifact: true,
      }),
    })
    const body = (await response.json()) as Record<string, unknown>
    const serialized = JSON.stringify(body)

    expect(response.status).toBe(403)
    expect(body).toMatchObject({
      ok: false,
      kind: "strategyValidation",
      sourceFormat: "typescript",
      error: "Private artifact validation evidence is not available.",
    })
    expect(serialized).not.toContain(source)
    expect(serialized).not.toContain("bytesBase64")
  })

  it("returns private TypeScript artifact bytes only when account save is internally authorized", async () => {
    const server = await withServer(8 * 1024, PRIVATE_ARTIFACT_TOKEN)
    const source = `
export default {
  selectActivations() {
    return []
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: null }
  },
}
`
    const response = await fetch(`${server.url}/validate-strategy`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-cowards-private-artifact-token": PRIVATE_ARTIFACT_TOKEN,
      },
      body: JSON.stringify({
        sourceFormat: "typescript",
        source,
        strategyId: "strategy:typescript",
        includePrivateArtifact: true,
      }),
    })
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      kind: "strategyValidation",
      sourceFormat: "typescript",
      metadata: {
        sourceArtifact: {
          format: "transpiled-javascript",
          bytesBase64: expect.any(String),
        },
        providerValidation: {
          providerId: "strategy-language-provider-js-ts",
          proof: expect.stringMatching(selectedProviderProofPattern),
        },
      },
    })
    const sourceArtifact = (body.metadata as Record<string, unknown>)
      .sourceArtifact as Record<string, unknown>
    if (String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.17") {
      expect(sourceArtifact.sourceIdentity).toMatchObject({
        identityVersion: "strategy-source-identity-v2",
        normalizationPolicy: "source-line-endings-lf-v1.17",
        originalSourceSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        normalizedSourceSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      })
    }
    expect(JSON.stringify(body)).not.toContain(source)
  })

  it("validates Python through the provider validator instead of backend string scanning", async () => {
    const server = await withServer(8 * 1024)
    const validSource = `
def select_activations(input):
    return {"activationOrders": [], "strategyMemory": input["strategyMemory"]}

def soldier_brain(input):
    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": input["soldierMemory"]}
`
    const valid = await fetch(`${server.url}/validate-strategy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFormat: "python",
        source: validSource,
        strategyId: "strategy:python",
      }),
    })
    const validBody = (await valid.json()) as Record<string, unknown>

    expect(valid.status).toBe(200)
    expect(validBody).toMatchObject({
      ok: true,
      kind: "strategyValidation",
      sourceFormat: "python",
      provider: {
        id: "strategy-language-provider-python",
      },
      metadata: {
        tags: ["python", "counted", "provider"],
        providerValidation: {
          providerId: "strategy-language-provider-python",
          contractVersion: STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
          sourceHash: expect.any(String),
          sourceBytes: expect.any(Number),
          proof: expect.stringMatching(selectedProviderProofPattern),
        },
      },
    })
    expect(JSON.stringify(validBody)).not.toContain("NON_COUNTED_RUNTIME")
    expect(JSON.stringify(validBody)).not.toContain("bytesBase64")
    expect(JSON.stringify(validBody)).not.toContain("sourceIdentity")
    expectSelectedProviderAuthority(validBody)
    expectExactSelectedProviderProof(validBody)

    const invalid = await fetch(`${server.url}/validate-strategy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFormat: "python",
        source: `import os

def soldier_brain(input):
    return {"action": {"type": "TURN", "direction": "UP"}, "soldierMemory": input["soldierMemory"]}
`,
      }),
    })
    const invalidBody = (await invalid.json()) as Record<string, unknown>

    expect(invalid.status).toBe(422)
    expect(invalidBody).toMatchObject({
      ok: false,
      kind: "strategyValidation",
      sourceFormat: "python",
    })
    expect(JSON.stringify(invalidBody)).toContain("IMPORT_NOT_ALLOWED")
    expect(JSON.stringify(invalidBody)).toContain("MISSING_SELECT_ACTIVATIONS")
    expect(JSON.stringify(invalidBody)).not.toContain(
      "python_validation_host.py",
    )
  })

  it("validates Rust through the provider compiler and returns artifact-bound provenance", async () => {
    const server = await withServer(64 * 1024)
    const rustSource = `
use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    let _ = io::stdin().read_to_string(&mut input);
    if input.contains("\\"methodName\\":\\"soldierBrain\\"") {
        println!(r#"{{"ok":true,"abiVersion":"${STRATEGY_RUNTIME_ABI_VERSION}","value":{{"action":{{"type":"TURN_TO_STONE"}},"soldierMemory":null}}}}"#);
    } else {
        println!(r#"{{"ok":true,"abiVersion":"${STRATEGY_RUNTIME_ABI_VERSION}","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
    }
}
`
    const response = await fetch(`${server.url}/validate-strategy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFormat: "rust",
        source: rustSource,
        strategyId: "strategy:rust",
      }),
    })
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      kind: "strategyValidation",
      sourceFormat: "rust",
      provider: {
        id: "strategy-language-provider-rust-wasi",
      },
      metadata: {
        tags: [
          "rust",
          "wasm-wasi",
          "counted",
          "provider",
          ...(String(STRATEGY_RUNTIME_ABI_VERSION) ===
          "strategy-runtime-abi-v1.17"
            ? ["v1.17"]
            : []),
        ],
        providerValidation: {
          providerId: "strategy-language-provider-rust-wasi",
          contractVersion: STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
          sourceHash: expect.any(String),
          sourceBytes: expect.any(Number),
          artifactHash: expect.any(String),
          artifactBytes: expect.any(Number),
          proof: expect.stringMatching(selectedProviderProofPattern),
        },
        compiledArtifact: {
          format: "wasm",
          targetTriple: "wasm32-wasip1",
          abiEnvelope:
            String(STRATEGY_RUNTIME_ABI_VERSION) ===
            "strategy-runtime-abi-v1.17"
              ? "stdin-canonical-request-stdout-raw-canonical-payload"
              : "stdin-stdout-json",
          publicEvidence: {
            nonCounted:
              String(STRATEGY_RUNTIME_ABI_VERSION) ===
              "strategy-runtime-abi-v1.17",
          },
        },
      },
    })
    expect(JSON.stringify(body)).not.toContain("NON_COUNTED_RUNTIME")
    expect(JSON.stringify(body)).not.toContain("bytesBase64")
    expect(JSON.stringify(body)).not.toContain("sourceIdentity")
    expectSelectedProviderAuthority(body)
    expectExactSelectedProviderProof(body)
  })

  it("validates Zig through the provider compiler and returns artifact-bound provenance", async () => {
    const server = await withServer(64 * 1024)
    const zigSource = `
const Iovec = extern struct { buf: [*]u8, buf_len: usize };
const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };

extern "wasi_snapshot_preview1" fn fd_read(u32, *const Iovec, usize, *usize) u16;
extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;

fn contains(haystack: []const u8, needle: []const u8) bool {
    if (needle.len == 0) return true;
    if (haystack.len < needle.len) return false;
    var index: usize = 0;
    while (index <= haystack.len - needle.len) : (index += 1) {
        var matched = true;
        var offset: usize = 0;
        while (offset < needle.len) : (offset += 1) {
            if (haystack[index + offset] != needle[offset]) {
                matched = false;
                break;
            }
        }
        if (matched) return true;
    }
    return false;
}

fn writeAll(bytes: []const u8) void {
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}

export fn _start() void {
    var input_buf: [16384]u8 = undefined;
    var iov = Iovec{ .buf = &input_buf, .buf_len = input_buf.len };
    var nread: usize = 0;
    _ = fd_read(0, &iov, 1, &nread);
    if (contains(input_buf[0..nread], "\\"methodName\\":\\"soldierBrain\\"")) {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"${STRATEGY_RUNTIME_ABI_VERSION}\\",\\"value\\":{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":null}}\\n");
    } else {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"${STRATEGY_RUNTIME_ABI_VERSION}\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":null}}\\n");
    }
}
`
    const response = await fetch(`${server.url}/validate-strategy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFormat: "zig",
        source: zigSource,
        strategyId: "strategy:zig",
      }),
    })
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      kind: "strategyValidation",
      sourceFormat: "zig",
      provider: {
        id: "strategy-language-provider-zig-wasi",
      },
      metadata: {
        tags: [
          "zig",
          "wasm-wasi",
          "counted",
          "provider",
          ...(String(STRATEGY_RUNTIME_ABI_VERSION) ===
          "strategy-runtime-abi-v1.17"
            ? ["v1.17"]
            : []),
        ],
        providerValidation: {
          providerId: "strategy-language-provider-zig-wasi",
          contractVersion: STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
          sourceHash: expect.any(String),
          sourceBytes: expect.any(Number),
          artifactHash: expect.any(String),
          artifactBytes: expect.any(Number),
          proof: expect.stringMatching(selectedProviderProofPattern),
        },
        compiledArtifact: {
          format: "wasm",
          targetTriple: "wasm32-wasi",
          abiEnvelope:
            String(STRATEGY_RUNTIME_ABI_VERSION) ===
            "strategy-runtime-abi-v1.17"
              ? "stdin-canonical-request-stdout-raw-canonical-payload"
              : "stdin-stdout-json",
          publicEvidence: {
            nonCounted:
              String(STRATEGY_RUNTIME_ABI_VERSION) ===
              "strategy-runtime-abi-v1.17",
          },
        },
      },
    })
    expect(JSON.stringify(body)).not.toContain("NON_COUNTED_RUNTIME")
    expect(JSON.stringify(body)).not.toContain("bytesBase64")
    expect(JSON.stringify(body)).not.toContain("sourceIdentity")
    expectSelectedProviderAuthority(body)
    expectExactSelectedProviderProof(body)
  }, 20_000)

  it("exposes no product API routes outside health and execute-match", async () => {
    const server = await withServer()
    for (const route of [
      "/api/matches",
      "/public/strategies/strategy:demo",
      "/matchsets/match-set:demo",
      "/session",
      "/jobs/claim",
    ]) {
      const response = await fetch(`${server.url}${route}`)
      const body = await response.text()
      expect(response.status).toBe(404)
      expect(body).toContain("not_found")
      expect(body).not.toContain("Chronicle")
      expect(body).not.toContain("MatchSet scoring")
    }
  })

  it("returns schema-valid malformed-request envelopes for bad JSON and body limit failures", async () => {
    const server = await withServer(8)
    const badJson = await fetch(`${server.url}/execute-match`, {
      method: "POST",
      body: "{not-json",
    })
    const oversized = await fetch(`${server.url}/execute-match`, {
      method: "POST",
      body: JSON.stringify({ tooLarge: "x".repeat(64) }),
    })

    for (const response of [badJson, oversized]) {
      const body = await response.json()
      expect(response.status).toBe(400)
      const parsed =
        String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.17"
          ? RuntimeExecutionServiceResponseV117Schema.parse(body)
          : RuntimeExecutionServiceResponseV118Schema.parse(body)
      expect(parsed).toMatchObject({
        ok: false,
        kind: "systemFailure",
        systemFailure: {
          code: "MALFORMED_REQUEST",
          retryable: false,
        },
      })
      expect(JSON.stringify(body)).not.toContain("StrategyMemory")
      expect(JSON.stringify(body)).not.toContain("postgres://")
      expect(JSON.stringify(body)).not.toContain("/Users/")
      expect(JSON.stringify(body)).not.toContain("token=")
    }
  })
})
