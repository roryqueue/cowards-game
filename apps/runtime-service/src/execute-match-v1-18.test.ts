import { Buffer } from "node:buffer"
import { createHash, generateKeyPairSync, sign } from "node:crypto"
import { once } from "node:events"
import type { AddressInfo } from "node:net"
import { MATCH_KERNEL, type StrategyRuntime } from "@cowards/engine"
import { adaptRuntimeForCurrentKernel } from "@cowards/engine/test/current-kernel-runtime"
import { recordChronicleFromExecution } from "@cowards/replay"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  DEFAULT_RUNTIME_LIMITS,
  INITIAL_BOUNDS,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  createRuntimeSemanticTupleV118,
  encodeCanonicalJson,
  type JsonValue,
  type RuntimeCertificateReferenceV118,
  type RuntimeExecutionCandidateMatchAuthorityV119,
  type RuntimeExecutionServiceRequest,
  type RuntimeExecutionServiceRequestV118,
} from "@cowards/spec"
import { buildStrategyRevision } from "@cowards/runtime-js"
import { describe, expect, it, vi } from "vitest"
import {
  admitRuntimeCertificateReferenceV118,
  executePreparedRuntimeServiceRequestV118,
  type PreparedRuntimeServiceDependenciesV118,
  type PreparedRuntimeServiceExecutionV118,
} from "./execute-match.js"
import {
  bindFixtureCandidateMatchAuthorityV119,
  createFixtureRuntimeEvidenceAuthorityLoader,
  createFixtureRuntimeExecutionEvidenceSnapshot,
} from "./runtime-execution-evidence.test-support.js"
import { createRuntimeServiceConfig } from "./runtime-config.js"
import { createRuntimeExecutionHttpServer } from "./server.js"

const passiveSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter(({ status }) => status === "ACTIVE")
        .slice(0, input.activationCount)
        .map(({ id }) => ({ soldierId: id })),
      strategyMemory: input.strategyMemory,
    }
  },
  soldierBrain(input) {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: input.soldierMemory,
    }
  },
}
`

const bottom = buildStrategyRevision({
  source: passiveSource,
  strategyId: "strategy:v118:bottom",
})
const top = buildStrategyRevision({
  source: passiveSource,
  strategyId: "strategy:v118:top",
})
const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
const nestedRequest: RuntimeExecutionServiceRequest =
  bindFixtureCandidateMatchAuthorityV119({
  contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
  kind: "executeMatch",
  requestId: "request:v118:nested",
  match: {
    matchId: "match:v118",
    seed: "seed:v118",
    arenaVariant: {
      id: "arena:v118",
      name: "v1.18 semantic admission",
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
    fixtureId: "v118-semantic-admission",
    bottom,
    top,
  }),
  })

const sha256 = (value: string | Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const sourceReference = (
  side: "bottom" | "top",
): RuntimeCertificateReferenceV118 => {
  const revision = side === "bottom" ? bottom : top
  const artifact =
    revision.metadata.sourceArtifact ?? revision.metadata.compiledArtifact
  if (artifact === undefined) throw new Error("fixture artifact missing")
  return {
    side,
    certificateId: `certificate:v118:${side}`,
    certificateRecordHash: sha256(`certificate:${side}`),
    registryGeneration: nestedRequest.evidenceSnapshot.registryGeneration,
    lane: `${revision.runtime.language.id}-linux-amd64`,
    freshUntil: "2099-08-01T00:00:00.000Z",
    sourceIdentity: {
      side,
      strategyRevisionId: revision.id,
      originalSourceSha256: sha256(revision.source),
      normalizedSourceSha256: sha256(
        revision.source.replaceAll("\r\n", "\n").replaceAll("\r", "\n"),
      ),
      artifactSha256: `sha256:${artifact.hash.replace(/^sha256:/u, "")}`,
      identityManifestRoot: sha256(`manifest:${side}`),
      evidenceGraphRoot: sha256(`graph:${side}`),
      laneIdentityHash: sha256(`lane:${side}`),
    },
  }
}

const request = (): RuntimeExecutionServiceRequestV118 => ({
  contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  kind: "executeMatch",
  requestId: "request:v118",
  matchId: nestedRequest.match.matchId,
  semanticTuple: createRuntimeSemanticTupleV118(tuple.tuple),
  authorityGeneration: nestedRequest.evidenceSnapshot.registryGeneration,
  evaluationInstant: "2026-07-16T12:00:00.000Z",
  certificateReferences: {
    bottom: sourceReference("bottom"),
    top: sourceReference("top"),
  },
  accounting: {
    budgetProfileRoot: sha256("budget"),
    ledgerPrestateRoot: sha256("prestate"),
  },
  match: nestedRequest as unknown as JsonValue,
})

const runtime: StrategyRuntime = {
  selectActivations(input) {
    return {
      ok: true,
      value: {
        activationOrders: input.mySoldiers
          .filter(({ status }) => status === "ACTIVE")
          .slice(0, input.activationCount)
          .map(({ id }) => ({ soldierId: id })),
        strategyMemory: input.strategyMemory,
      },
    }
  },
  runSoldierBrain(input) {
    return {
      ok: true,
      value: {
        action: { type: "TURN_TO_STONE" },
        soldierMemory: input.soldierMemory,
      },
    }
  },
}

const execution = () => {
  const { candidateMatch, ...match } = nestedRequest.match as typeof nestedRequest.match & {
    readonly candidateMatch?:
      | RuntimeExecutionCandidateMatchAuthorityV119
      | undefined
  }
  const matchExecution =
    candidateMatch === undefined
      ? MATCH_KERNEL.runMatch({
          ...match,
          runtime: adaptRuntimeForCurrentKernel(runtime),
        })
      : MATCH_KERNEL.runMatchV119({
          ...match,
          initialInitiativePlayerId:
            candidateMatch.initialInitiativePlayerId,
          runtime: adaptRuntimeForCurrentKernel(runtime),
        })
  const recorded = recordChronicleFromExecution({
    execution: matchExecution,
    metadata: {
      schemaVersion: "chronicle-v1.4",
      semanticTupleId: tuple.tupleId,
      semanticTuple: tuple.tuple,
    },
    ...(candidateMatch === undefined ? {} : { candidateMatch }),
  })
  if (!recorded.ok) throw new Error(recorded.failure.code)
  const commonRoots = {
    bottom: sha256("common-supervisor:bottom"),
    top: sha256("common-supervisor:top"),
  }
  return {
    response: {
      contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
      ok: true,
      kind: "executionResult",
      requestId: nestedRequest.requestId,
      matchId: nestedRequest.match.matchId,
      runtimeAbiVersion: tuple.tuple.runtimeAbi,
      result: {
        privacy: "internal_runtime_result",
        chronicle: recorded.chronicle,
        finalState: recorded.finalState,
        runtimeViolationEventCount: 0,
        semanticReceipt: {},
      },
    },
    execution: matchExecution,
    boundaryAnchors: recorded.boundaryAnchors,
    transitionTraceRoot: recorded.transitionTraceRoot,
    accounting: {
      budgetProfileRoot: sha256("budget"),
      ledgerPrestateRoot: sha256("prestate"),
      ledgerPoststateRoot: sha256("poststate"),
    },
    commonSupervisorEvidenceRoots: commonRoots,
  } as unknown as PreparedRuntimeServiceExecutionV118
}

const validExecutionFixture = execution()

const dependencies = (): PreparedRuntimeServiceDependenciesV118 => {
  const keys = generateKeyPairSync("ed25519")
  const currentExecution = validExecutionFixture
  return {
    signer: {
      keyId: "runtime-service:semantic-receipt:v1.18",
      publicKeyPem: keys.publicKey.export({
        format: "pem",
        type: "spki",
      }) as string,
      sign: (bytes) => sign(null, bytes, keys.privateKey),
    },
    admitCertificateReference({ side, reference }) {
      return {
        certificateRecordHash: reference.certificateRecordHash,
        sourceIdentity: reference.sourceIdentity,
        commonSupervisorEvidenceRoot:
          currentExecution.commonSupervisorEvidenceRoots[side],
      }
    },
    executeCurrentMatchWithAccounting: vi.fn(() => currentExecution),
  }
}

describe("prepared runtime service v1.18 semantic admission", () => {
  it("joins exact current containment identity and rejects stale or mixed references", () => {
    const authority = createFixtureRuntimeEvidenceAuthorityLoader(
      nestedRequest.evidenceSnapshot,
      nestedRequest.strategies,
    ).load()
    const entrant = nestedRequest.evidenceSnapshot.entrants.bottom
    const certificate = authority.payload.certificates.find(
      (candidate) =>
        candidate.kind === "containment" &&
        candidate.certificateId === entrant.containmentCertificateId,
    )!
    const attestation = authority.payload.attestations.find((candidate) =>
      certificate.attestationIds.includes(candidate.attestationId),
    )!
    const revision = nestedRequest.strategies.bottom
    const artifact =
      revision.metadata.sourceArtifact ?? revision.metadata.compiledArtifact
    if (artifact === undefined) throw new Error("fixture artifact missing")
    const reference: RuntimeCertificateReferenceV118 = {
      side: "bottom",
      certificateId: certificate.certificateId,
      certificateRecordHash:
        certificate.certificateRecordHash as `sha256:${string}`,
      registryGeneration: authority.registryGeneration,
      lane: certificate.laneIdentity.languageId,
      freshUntil: certificate.freshUntil,
      sourceIdentity: {
        side: "bottom",
        strategyRevisionId: revision.id,
        originalSourceSha256: sha256(revision.source),
        normalizedSourceSha256: sha256(
          revision.source.replaceAll("\r\n", "\n").replaceAll("\r", "\n"),
        ),
        artifactSha256: `sha256:${artifact.hash.replace(/^sha256:/u, "")}`,
        identityManifestRoot:
          certificate.laneIdentityHash as `sha256:${string}`,
        evidenceGraphRoot: attestation.attestationHash as `sha256:${string}`,
        laneIdentityHash:
          certificate.laneIdentityHash as `sha256:${string}`,
      },
    }
    expect(
      admitRuntimeCertificateReferenceV118({
        authority,
        side: "bottom",
        reference,
        nestedRequest,
        evaluationInstant: "2026-07-13T00:00:00.000Z",
      }),
    ).toMatchObject({
      certificateRecordHash: reference.certificateRecordHash,
      commonSupervisorEvidenceRoot: reference.sourceIdentity.evidenceGraphRoot,
    })
    expect(
      admitRuntimeCertificateReferenceV118({
        authority,
        side: "bottom",
        reference,
        nestedRequest,
        evaluationInstant: "2026-07-15T00:00:00.000Z",
      }),
    ).toBeUndefined()
    expect(
      admitRuntimeCertificateReferenceV118({
        authority,
        side: "bottom",
        reference: {
          ...reference,
          sourceIdentity: {
            ...reference.sourceIdentity,
            laneIdentityHash: sha256("mixed-lane"),
          },
        },
        nestedRequest,
        evaluationInstant: "2026-07-13T00:00:00.000Z",
      }),
    ).toBeUndefined()
  })

  it("issues only a two-certificate, reconstruction-equivalent public receipt", () => {
    const response = executePreparedRuntimeServiceRequestV118(
      request(),
      dependencies(),
    )
    expect(response).toMatchObject({
      contractVersion: "runtime-execution-service-v1.18",
      ok: true,
      kind: "executionResult",
      result: {
        privacy: "public_receipt",
        resultClass: "success",
        ownership: "gameplay",
        mutationStatus: "committed",
      },
    })
    if (!response.ok) throw new Error(response.systemFailure.code)
    expect(response.result.semanticReceipt.claim.certificateReferences).toEqual(
      request().certificateReferences,
    )
    const serialized = JSON.stringify(response)
    expect(serialized).not.toContain(passiveSource.trim())
    expect(serialized).not.toMatch(
      /strategyMemory|soldierMemory|objective|diagnostics|stderr|privateKey|private-host-poison/iu,
    )
    expect(response.result).not.toHaveProperty("chronicle")
    expect(response.result).not.toHaveProperty("finalState")
  })

  it("keeps completion documents behind the authenticated internal envelope", async () => {
    const baseConfig = createRuntimeServiceConfig({
      strategyExecutionAdapter: "worker-thread",
      semanticReceiptSecret: "unused-v1.18-test-secret",
    })
    const server = createRuntimeExecutionHttpServer({
      runtimeConfig: {
        ...baseConfig,
        contractSelection: {
          ...baseConfig.contractSelection,
          runtimeServiceVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
        },
      },
      privateArtifactToken: "fixture-private-completion-token",
      preparedV118Dependencies: dependencies(),
    })
    server.listen(0, "127.0.0.1")
    await once(server, "listening")
    try {
      const address = server.address() as AddressInfo
      const endpoint = `http://127.0.0.1:${address.port}/execute-match`
      const encoded = encodeCanonicalJson(request() as unknown as JsonValue, {
        context: "authenticated-outer-envelope",
      })
      if (!encoded.ok) throw new Error(encoded.error.code)
      const publicResponse = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: Buffer.from(encoded.bytes),
      })
      const publicBody = (await publicResponse.json()) as Record<
        string,
        unknown
      >
      expect(publicBody).toMatchObject({
        contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
        ok: true,
        kind: "executionResult",
      })
      expect(publicBody).not.toHaveProperty("chronicle")
      expect(publicBody).not.toHaveProperty("finalState")
      expect(JSON.stringify(publicBody)).not.toContain(passiveSource.trim())
      expect(JSON.stringify(publicBody)).not.toMatch(
        /strategyMemory|soldierMemory|objective|diagnostic|hostPath/iu,
      )

      const internalResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-cowards-private-artifact-token":
            "fixture-private-completion-token",
        },
        body: Buffer.from(encoded.bytes),
      })
      const internalBody = (await internalResponse.json()) as Record<
        string,
        unknown
      >
      expect(internalBody).toMatchObject({
        schemaVersion: "runtime-service-completion-envelope-v1.18",
        publicResponse: {
          contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
          ok: true,
        },
      })
      expect(internalBody).toHaveProperty("chronicle")
      expect(internalBody).toHaveProperty("finalState")
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }
  })

  it("fails closed on semantic, certificate, meter, execution, and signer drift", () => {
    const base = request()
    const cases: PreparedRuntimeServiceDependenciesV118[] = []

    const certificate = dependencies()
    certificate.admitCertificateReference = () => undefined
    cases.push(certificate)

    const meter = dependencies()
    const originalAdmission = meter.admitCertificateReference
    meter.admitCertificateReference = (input) => ({
      ...originalAdmission(input)!,
      commonSupervisorEvidenceRoot: sha256("wrong-common-root"),
    })
    cases.push(meter)

    const semantic = dependencies()
    const validExecution =
      semantic.executeCurrentMatchWithAccounting(nestedRequest)
    semantic.executeCurrentMatchWithAccounting = vi.fn(() => ({
      ...validExecution,
      transitionTraceRoot: sha256("wrong-trace"),
    }))
    cases.push(semantic)

    const thrown = dependencies()
    thrown.executeCurrentMatchWithAccounting = vi.fn(() => {
      throw new Error("private-host-poison")
    })
    cases.push(thrown)

    const signer = dependencies()
    signer.signer.sign = () => new Uint8Array(64)
    cases.push(signer)

    for (const candidate of cases) {
      const response = executePreparedRuntimeServiceRequestV118(base, candidate)
      expect(response).toMatchObject({
        ok: false,
        kind: "systemFailure",
        systemFailure: {
          classification: "system_failure",
          playerPenalty: false,
          mutationStatus: "none",
        },
      })
      expect(response).not.toHaveProperty("result")
      expect(JSON.stringify(response)).not.toMatch(
        /private-host-poison|strategyMemory|soldierMemory|objective|diagnostics|stderr|privateKey/iu,
      )
    }
  }, 20_000)

  it("rejects side, source, freshness, generation, and request binding changes before execution", () => {
    const mutations = [
      { ...request(), matchId: "match:wrong" },
      {
        ...request(),
        authorityGeneration: "2",
      },
      {
        ...request(),
        certificateReferences: {
          ...request().certificateReferences,
          bottom: {
            ...request().certificateReferences.bottom,
            sourceIdentity: {
              ...request().certificateReferences.bottom.sourceIdentity,
              artifactSha256: sha256("wrong-artifact"),
            },
          },
        },
      },
      {
        ...request(),
        evaluationInstant: "2099-09-01T00:00:00.000Z",
      },
    ]
    for (const mutation of mutations) {
      const deps = dependencies()
      const response = executePreparedRuntimeServiceRequestV118(mutation, deps)
      expect(response.ok).toBe(false)
      expect(deps.executeCurrentMatchWithAccounting).not.toHaveBeenCalled()
    }
  })
})
