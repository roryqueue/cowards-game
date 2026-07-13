import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  RuntimeExecutionServiceRequestSchema,
  RuntimeExecutionServiceResponseSchema,
  STRATEGY_RUNTIME_ABI_VERSION,
  findRuntimeBrokerRegistryEntry,
  hashExecutableLaneIdentity,
  validateStrategyLanguageProviderRuntimeCompatibility,
  type MatchId,
  type PlayerId,
  type RuntimeExecutionServiceRequest,
  type RuntimeExecutionServiceResponse,
  type RuntimeExecutionServiceSystemFailureCode,
  type RuntimeEntrantAuthorityReference,
  type StrategyRevision,
} from "@cowards/spec"
import { hashStrategySource } from "@cowards/runtime-js"
import { createRuntimeFromRevision } from "@cowards/runtime-js/worker"
import { createPythonRuntimeFromRevision } from "@cowards/runtime-python"
import { createWasmWasiRuntimeFromRevision } from "@cowards/runtime-wasm-wasi"
import { buildChronicleFromMatch } from "@cowards/replay"
import {
  violation,
  type RunMatchInput,
  type StrategyRuntime,
} from "@cowards/engine"
import type { RuntimeServiceConfig } from "./runtime-config.js"
import { publicSystemFailureMessage, redactedDiagnostics } from "./redaction.js"
import type {
  RuntimeEvidenceAuthorityLoader,
  VerifiedMountedRuntimeEvidenceAuthority,
} from "./runtime-evidence-authority.js"

const readRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined

const requestIdentity = (
  rawRequest: unknown,
): { requestId: string; matchId?: MatchId | undefined } => {
  const root = readRecord(rawRequest)
  const match = readRecord(root?.match)
  return {
    requestId: readString(root?.requestId) ?? "runtime-request:unknown",
    matchId: readString(match?.matchId),
  }
}

const systemFailureResponse = (input: {
  rawRequest: unknown
  code: RuntimeExecutionServiceSystemFailureCode
  message: string
  retryable: boolean
  diagnostics?: Record<string, unknown> | undefined
}): RuntimeExecutionServiceResponse => {
  const identity = requestIdentity(input.rawRequest)
  const response = {
    contractVersion: "runtime-execution-service-v1.15",
    ok: false,
    kind: "systemFailure",
    requestId: identity.requestId,
    ...(identity.matchId === undefined ? {} : { matchId: identity.matchId }),
    runtimeAbiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    systemFailure: {
      code: input.code,
      message: input.message,
      publicMessage: publicSystemFailureMessage(input.code),
      retryable: input.retryable,
      ...(input.diagnostics === undefined
        ? {}
        : { diagnostics: redactedDiagnostics(input.diagnostics) }),
    },
  } satisfies RuntimeExecutionServiceResponse

  return RuntimeExecutionServiceResponseSchema.parse(
    response,
  ) as RuntimeExecutionServiceResponse
}

const framedSha256 = (domain: string, values: readonly string[]): string => {
  const hash = createHash("sha256")
  hash.update(domain, "utf8")
  hash.update("\0", "utf8")
  for (const value of values) {
    const bytes = Buffer.from(value, "utf8")
    hash.update(String(bytes.byteLength), "utf8")
    hash.update("\0", "utf8")
    hash.update(bytes)
    hash.update("\0", "utf8")
  }
  return `sha256:${hash.digest("hex")}`
}

/**
 * Binds an opaque scheduling-decision identifier to the exact signed authority
 * references used for one entrant. The identifier remains a scheduler trace;
 * the hash prevents any field from being changed independently in transit.
 */
export const hashRuntimeAuthoritySchedulingDecisionReference = (input: {
  compatibilityTupleId: string
  authorityBundleHash: string
  registryGeneration: string
  publication: RuntimeExecutionServiceRequest["evidenceSnapshot"]["publication"]
  entrant: RuntimeEntrantAuthorityReference
}): string =>
  framedSha256("cowards-game:runtime-authority-decision-reference:v1", [
    input.compatibilityTupleId,
    input.authorityBundleHash,
    input.registryGeneration,
    input.publication.publicationId,
    input.publication.installReceiptId,
    input.publication.payloadSha256,
    input.publication.envelopeSha256,
    input.publication.sourceManifestHash,
    input.entrant.entrantKey,
    input.entrant.strategyRevisionId,
    input.entrant.laneIdentityHash,
    input.entrant.effectiveStatus,
    input.entrant.schedulingDecisionId,
    input.entrant.schedulingDecision.reasonCode,
    input.entrant.schedulingDecision.evaluatedAt,
    input.entrant.schedulingDecision.freshUntil,
    input.entrant.schedulingDecision.registryGeneration,
    input.entrant.containmentCertificateId ?? "",
    input.entrant.containmentCertificateHash ?? "",
    input.entrant.conformanceCertificateId ?? "",
    input.entrant.conformanceCertificateHash ?? "",
  ])

type AuthorityFailureCode = Extract<
  RuntimeExecutionServiceSystemFailureCode,
  | "EVIDENCE_IDENTITY_MISMATCH"
  | "EVIDENCE_REGISTRY_DRIFT"
  | "EVIDENCE_REVOKED"
  | "EVIDENCE_UNVERIFIABLE"
>

type AuthorityCheck =
  | {
      ok: true
      authority: Readonly<VerifiedMountedRuntimeEvidenceAuthority>
    }
  | { ok: false; code: AuthorityFailureCode }

const authorityIdentity = (
  authority: Readonly<VerifiedMountedRuntimeEvidenceAuthority>,
): string =>
  [
    authority.authorityBundleHash,
    authority.registryGeneration,
    authority.semanticTupleManifestHash,
    authority.trustDomain,
    authority.keyId,
  ].join("\0")

const certificateIsInactive = (
  authority: Readonly<VerifiedMountedRuntimeEvidenceAuthority>,
  certificate: Readonly<
    VerifiedMountedRuntimeEvidenceAuthority["payload"]["certificates"][number]
  >,
): boolean =>
  authority.payload.revocations.some(
    (revocation) =>
      revocation.certificateId === certificate.certificateId &&
      revocation.certificateRecordHash === certificate.certificateRecordHash,
  ) ||
  authority.payload.supersessions.some(
    (supersession) => supersession.certificateId === certificate.certificateId,
  )

const exactCertificate = (input: {
  authority: Readonly<VerifiedMountedRuntimeEvidenceAuthority>
  entrant: RuntimeEntrantAuthorityReference
  kind: "containment" | "conformance"
}):
  | {
      ok: true
      certificate: Readonly<
        VerifiedMountedRuntimeEvidenceAuthority["payload"]["certificates"][number]
      >
    }
  | { ok: false; code: AuthorityFailureCode } => {
  const certificateId =
    input.kind === "containment"
      ? input.entrant.containmentCertificateId
      : input.entrant.conformanceCertificateId
  const certificateHash =
    input.kind === "containment"
      ? input.entrant.containmentCertificateHash
      : input.entrant.conformanceCertificateHash
  if (!certificateId || !certificateHash) {
    return { ok: false, code: "EVIDENCE_IDENTITY_MISMATCH" }
  }
  const certificate = input.authority.payload.certificates.find(
    (candidate) => candidate.certificateId === certificateId,
  )
  if (
    !certificate ||
    certificate.kind !== input.kind ||
    certificate.certificateRecordHash !== certificateHash ||
    certificate.laneIdentityHash !== input.entrant.laneIdentityHash
  ) {
    return { ok: false, code: "EVIDENCE_IDENTITY_MISMATCH" }
  }
  if (certificateIsInactive(input.authority, certificate)) {
    return { ok: false, code: "EVIDENCE_REVOKED" }
  }
  return { ok: true, certificate }
}

const hasCurrentConformanceForLane = (
  authority: Readonly<VerifiedMountedRuntimeEvidenceAuthority>,
  laneIdentityHash: string,
): boolean =>
  authority.payload.certificates.some(
    (certificate) =>
      certificate.kind === "conformance" &&
      certificate.laneIdentityHash === laneIdentityHash &&
      !certificateIsInactive(authority, certificate),
  )

const verifyEntrantAgainstAuthority = (input: {
  request: RuntimeExecutionServiceRequest
  authority: Readonly<VerifiedMountedRuntimeEvidenceAuthority>
  side: "bottom" | "top"
  runtimeConfig: RuntimeServiceConfig
}): { ok: true } | { ok: false; code: AuthorityFailureCode } => {
  const entrant = input.request.evidenceSnapshot.entrants[input.side]
  if (
    input.authority.payload.operatorLaneDisables.some(
      (disable) => disable.laneIdentityHash === entrant.laneIdentityHash,
    )
  ) {
    return { ok: false, code: "EVIDENCE_REVOKED" }
  }

  const expectedDecisionHash = hashRuntimeAuthoritySchedulingDecisionReference({
    compatibilityTupleId: input.request.evidenceSnapshot.compatibility.tupleId,
    authorityBundleHash: input.request.evidenceSnapshot.authorityBundleHash,
    registryGeneration: input.request.evidenceSnapshot.registryGeneration,
    publication: input.request.evidenceSnapshot.publication,
    entrant,
  })
  if (entrant.schedulingDecisionHash !== expectedDecisionHash) {
    return { ok: false, code: "EVIDENCE_IDENTITY_MISMATCH" }
  }

  const containment = exactCertificate({
    authority: input.authority,
    entrant,
    kind: "containment",
  })
  if (!containment.ok) return containment

  const deployedIdentity = input.runtimeConfig.resolveDeploymentLaneIdentity(
    input.request.strategies[input.side],
  )
  if (!deployedIdentity) {
    return { ok: false, code: "EVIDENCE_UNVERIFIABLE" }
  }
  let deployedIdentityHash: string
  try {
    deployedIdentityHash = `sha256:${hashExecutableLaneIdentity(deployedIdentity)}`
  } catch {
    return { ok: false, code: "EVIDENCE_UNVERIFIABLE" }
  }
  if (
    deployedIdentityHash !== entrant.laneIdentityHash ||
    deployedIdentityHash !== containment.certificate.laneIdentityHash
  ) {
    return { ok: false, code: "EVIDENCE_IDENTITY_MISMATCH" }
  }

  if (entrant.effectiveStatus === "exhibition_only") {
    if (
      entrant.conformanceCertificateId !== undefined ||
      entrant.conformanceCertificateHash !== undefined ||
      hasCurrentConformanceForLane(input.authority, entrant.laneIdentityHash)
    ) {
      return { ok: false, code: "EVIDENCE_IDENTITY_MISMATCH" }
    }
    return { ok: true }
  }
  if (entrant.effectiveStatus !== "counted") {
    return { ok: false, code: "EVIDENCE_REVOKED" }
  }
  return exactCertificate({
    authority: input.authority,
    entrant,
    kind: "conformance",
  })
}

const loadAndVerifyRequestAuthority = (input: {
  request: RuntimeExecutionServiceRequest
  runtimeConfig: RuntimeServiceConfig
  loader: RuntimeEvidenceAuthorityLoader | undefined
  baseline?: Readonly<VerifiedMountedRuntimeEvidenceAuthority> | undefined
}): AuthorityCheck => {
  if (!input.loader) return { ok: false, code: "EVIDENCE_UNVERIFIABLE" }
  let authority: Readonly<VerifiedMountedRuntimeEvidenceAuthority>
  try {
    authority = input.loader.load()
  } catch {
    return { ok: false, code: "EVIDENCE_UNVERIFIABLE" }
  }
  if (
    input.baseline !== undefined &&
    authorityIdentity(authority) !== authorityIdentity(input.baseline)
  ) {
    return { ok: false, code: "EVIDENCE_REGISTRY_DRIFT" }
  }
  if (
    authority.authorityBundleHash !==
      input.request.evidenceSnapshot.authorityBundleHash ||
    authority.registryGeneration !==
      input.request.evidenceSnapshot.registryGeneration ||
    authority.payload.registryGeneration !== authority.registryGeneration ||
    authority.semanticTupleManifestHash !==
      input.request.evidenceSnapshot.compatibility.tupleId ||
    authority.payload.semanticTupleManifestHash !==
      input.request.evidenceSnapshot.compatibility.tupleId
  ) {
    return { ok: false, code: "EVIDENCE_IDENTITY_MISMATCH" }
  }
  for (const side of ["bottom", "top"] as const) {
    const entrant = verifyEntrantAgainstAuthority({
      request: input.request,
      authority,
      side,
      runtimeConfig: input.runtimeConfig,
    })
    if (!entrant.ok) return entrant
  }
  return { ok: true, authority }
}

const authorityFailureResponse = (
  request: RuntimeExecutionServiceRequest,
  code: AuthorityFailureCode,
): RuntimeExecutionServiceResponse =>
  systemFailureResponse({
    rawRequest: request,
    code,
    message: "Runtime execution authority verification failed.",
    retryable: true,
  })

const validateRevisionSource = (
  slot: "bottom" | "top",
  revision: StrategyRevision,
):
  | { ok: true }
  | {
      ok: false
      code: "SOURCE_HASH_MISMATCH" | "SOURCE_BYTES_MISMATCH"
      diagnostics: Record<string, unknown>
    } => {
  const actualBytes = new TextEncoder().encode(revision.source).length
  if (actualBytes !== revision.sourceBytes) {
    return {
      ok: false,
      code: "SOURCE_BYTES_MISMATCH",
      diagnostics: {
        reason: "source-bytes-mismatch",
        slot,
        revisionId: revision.id,
        declaredBytes: revision.sourceBytes,
        actualBytes,
      },
    }
  }

  const actualHash = hashStrategySource(revision.source)
  if (actualHash !== revision.sourceHash) {
    return {
      ok: false,
      code: "SOURCE_HASH_MISMATCH",
      diagnostics: {
        reason: "source-hash-mismatch",
        slot,
        revisionId: revision.id,
        declaredHash: revision.sourceHash,
        actualHash,
      },
    }
  }

  return { ok: true }
}

const validateRevisionArtifact = (
  slot: "bottom" | "top",
  revision: StrategyRevision,
):
  | { ok: true }
  | {
      ok: false
      diagnostics: Record<string, unknown>
    } => {
  if (
    revision.runtime.language.id === "typescript" ||
    revision.runtime.language.id === "python"
  ) {
    const artifact = revision.metadata.sourceArtifact
    const expectedFormat =
      revision.runtime.language.id === "typescript"
        ? "transpiled-javascript"
        : "python-source-bundle"
    if (!artifact?.bytesBase64) {
      return {
        ok: false,
        diagnostics: {
          reason: "source-artifact-missing",
          slot,
          revisionId: revision.id,
          languageId: revision.runtime.language.id,
        },
      }
    }
    if (
      artifact.format !== expectedFormat ||
      artifact.validationStatus !== "valid" ||
      artifact.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION ||
      artifact.sourceHash !== revision.sourceHash ||
      artifact.sourceBytes !== revision.sourceBytes ||
      artifact.toolchain.language !== revision.runtime.language.id
    ) {
      return {
        ok: false,
        diagnostics: {
          reason: "source-artifact-metadata-invalid",
          slot,
          revisionId: revision.id,
          languageId: revision.runtime.language.id,
          validationStatus: artifact.validationStatus,
          format: artifact.format,
        },
      }
    }
    const bytes = Buffer.from(artifact.bytesBase64, "base64")
    const actualHash = createHash("sha256").update(bytes).digest("hex")
    if (bytes.byteLength !== artifact.bytes || actualHash !== artifact.hash) {
      return {
        ok: false,
        diagnostics: {
          reason: "source-artifact-mismatch",
          slot,
          revisionId: revision.id,
          declaredBytes: artifact.bytes,
          actualBytes: bytes.byteLength,
          declaredHash: artifact.hash,
          actualHash,
        },
      }
    }
    return { ok: true }
  }
  if (revision.runtime.adapter.id !== "runtime-wasm-wasi-wasmtime-preview1") {
    return { ok: true }
  }
  const artifact = revision.metadata.compiledArtifact
  if (!artifact?.bytesBase64) {
    return {
      ok: false,
      diagnostics: {
        reason: "compiled-artifact-missing",
        slot,
        revisionId: revision.id,
        languageId: revision.runtime.language.id,
      },
    }
  }
  const expectedTargetTriple =
    revision.runtime.language.id === "zig" ? "wasm32-wasi" : "wasm32-wasip1"
  if (
    artifact.validationStatus !== "valid" ||
    artifact.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION ||
    artifact.wasiProfile !== "preview1" ||
    artifact.abiEnvelope !== "stdin-stdout-json" ||
    artifact.targetTriple !== expectedTargetTriple
  ) {
    return {
      ok: false,
      diagnostics: {
        reason: "compiled-artifact-metadata-invalid",
        slot,
        revisionId: revision.id,
        languageId: revision.runtime.language.id,
        validationStatus: artifact.validationStatus,
        targetTriple: artifact.targetTriple,
      },
    }
  }
  const bytes = Buffer.from(artifact.bytesBase64, "base64")
  const actualHash = createHash("sha256").update(bytes).digest("hex")
  if (bytes.byteLength !== artifact.bytes || actualHash !== artifact.hash) {
    return {
      ok: false,
      diagnostics: {
        reason: "compiled-artifact-mismatch",
        slot,
        revisionId: revision.id,
        declaredBytes: artifact.bytes,
        actualBytes: bytes.byteLength,
        declaredHash: artifact.hash,
        actualHash,
      },
    }
  }
  if (artifact.sourceHash !== revision.sourceHash) {
    return {
      ok: false,
      diagnostics: {
        reason: "compiled-artifact-source-hash-mismatch",
        slot,
        revisionId: revision.id,
      },
    }
  }
  return { ok: true }
}

const createRuntimeForRevision = (
  revision: StrategyRevision,
  runtimeConfig: RuntimeServiceConfig,
  limits: RuntimeExecutionServiceRequest["limits"],
):
  | { ok: true; runtime: StrategyRuntime }
  | {
      ok: false
      diagnostics: Record<string, unknown>
    } => {
  const providerIssues = validateStrategyLanguageProviderRuntimeCompatibility(
    revision.runtime,
  )
  if (providerIssues.length > 0) {
    return {
      ok: false,
      diagnostics: {
        reason: "language-provider-runtime-mismatch",
        revisionId: revision.id,
        languageId: revision.runtime.language.id,
        adapterId: revision.runtime.adapter.id,
        issues: providerIssues,
      },
    }
  }
  const registryEntry = findRuntimeBrokerRegistryEntry(revision.runtime)
  if (!registryEntry) {
    return {
      ok: false,
      diagnostics: {
        reason: "runtime-registry-mismatch",
        revisionId: revision.id,
        languageId: revision.runtime.language.id,
        adapterId: revision.runtime.adapter.id,
        adapterVersion: revision.runtime.adapter.version,
      },
    }
  }
  if (registryEntry.runtimeTarget === "runtime-python") {
    return {
      ok: true,
      runtime: createPythonRuntimeFromRevision(revision, {
        timeoutMs: Math.min(
          limits.timeoutMs,
          revision.runtime.limits.timeoutMs,
        ),
        stdoutBytes: Math.min(
          limits.stdoutBytes,
          revision.runtime.limits.stdoutBytes,
        ),
        stderrBytes: Math.min(
          limits.stderrBytes,
          revision.runtime.limits.stderrBytes,
        ),
      }),
    }
  }
  if (registryEntry.runtimeTarget === "runtime-wasm-wasi") {
    return {
      ok: true,
      runtime: createWasmWasiRuntimeFromRevision(revision, {
        timeoutMs: Math.min(
          limits.timeoutMs,
          revision.runtime.limits.timeoutMs,
        ),
        stdoutBytes: Math.min(
          limits.stdoutBytes,
          revision.runtime.limits.stdoutBytes,
        ),
        stderrBytes: Math.min(
          limits.stderrBytes,
          revision.runtime.limits.stderrBytes,
        ),
      }),
    }
  }
  const expectedJsAdapterId =
    runtimeConfig.metadata.id === "worker-thread"
      ? "runtime-js-worker-thread"
      : runtimeConfig.metadata.id === "subprocess"
        ? "runtime-js-subprocess"
        : runtimeConfig.metadata.id === "container-subprocess"
          ? "runtime-js-container-subprocess"
          : null
  if (revision.runtime.adapter.id !== expectedJsAdapterId) {
    return {
      ok: false,
      diagnostics: {
        reason: "runtime-js-adapter-mismatch",
        revisionId: revision.id,
        declaredAdapterId: revision.runtime.adapter.id,
        serviceAdapterId: runtimeConfig.metadata.id,
        expectedAdapterId: expectedJsAdapterId,
      },
    }
  }
  return {
    ok: true,
    runtime: createRuntimeFromRevision(revision, {
      adapter: runtimeConfig.adapter,
      timeoutMs: limits.timeoutMs,
      outputByteLimit: limits.stdoutBytes,
    }),
  }
}

export interface RuntimeExecutionServiceDependencies {
  buildChronicleFromMatch: typeof buildChronicleFromMatch
  createRuntimeForRevision: typeof createRuntimeForRevision
  authorityLoader?: RuntimeEvidenceAuthorityLoader | undefined
}

const defaultDependencies: RuntimeExecutionServiceDependencies = {
  buildChronicleFromMatch,
  createRuntimeForRevision,
}

export const createSideDispatchRuntime = (
  bottomRuntime: StrategyRuntime,
  topRuntime: StrategyRuntime,
  playerIds: { bottomPlayerId: PlayerId; topPlayerId: PlayerId },
): StrategyRuntime => ({
  selectActivations(input) {
    const playerId = input.mySoldiers[0]?.ownerPlayerId
    if (playerId === playerIds.bottomPlayerId) {
      return bottomRuntime.selectActivations(input)
    }
    if (playerId === playerIds.topPlayerId) {
      return topRuntime.selectActivations(input)
    }
    return violation("INVALID_OUTPUT", "Cannot resolve player runtime")
  },

  runSoldierBrain(input) {
    const playerId = input.self.ownerPlayerId
    if (playerId === playerIds.bottomPlayerId) {
      return bottomRuntime.runSoldierBrain(input)
    }
    if (playerId === playerIds.topPlayerId) {
      return topRuntime.runSoldierBrain(input)
    }
    return violation("INVALID_OUTPUT", "Cannot resolve soldier runtime")
  },
})

const runtimeViolationEventCount = (
  result: ReturnType<typeof buildChronicleFromMatch>,
): number =>
  result.chronicle.events.filter((event) => event.type === "RUNTIME_VIOLATION")
    .length

const executeParsedRequest = (
  request: RuntimeExecutionServiceRequest,
  runtimeConfig: RuntimeServiceConfig,
  dependencies: RuntimeExecutionServiceDependencies,
): RuntimeExecutionServiceResponse => {
  const acceptedAuthority = loadAndVerifyRequestAuthority({
    request,
    runtimeConfig,
    loader: dependencies.authorityLoader,
  })
  if (!acceptedAuthority.ok) {
    return authorityFailureResponse(request, acceptedAuthority.code)
  }

  for (const slot of ["bottom", "top"] as const) {
    const validation = validateRevisionSource(slot, request.strategies[slot])
    if (!validation.ok) {
      return systemFailureResponse({
        rawRequest: request,
        code: validation.code,
        message: "Runtime execution request failed source validation.",
        retryable: false,
        diagnostics: validation.diagnostics,
      })
    }
    const artifactValidation = validateRevisionArtifact(
      slot,
      request.strategies[slot],
    )
    if (!artifactValidation.ok) {
      return systemFailureResponse({
        rawRequest: request,
        code: "SOURCE_HASH_MISMATCH",
        message:
          "Runtime execution request failed immutable artifact validation.",
        retryable: false,
        diagnostics: artifactValidation.diagnostics,
      })
    }
  }

  const invocationAuthority = loadAndVerifyRequestAuthority({
    request,
    runtimeConfig,
    loader: dependencies.authorityLoader,
    baseline: acceptedAuthority.authority,
  })
  if (!invocationAuthority.ok) {
    return authorityFailureResponse(request, invocationAuthority.code)
  }

  const bottomRuntime = dependencies.createRuntimeForRevision(
    request.strategies.bottom,
    runtimeConfig,
    request.limits,
  )
  if (!bottomRuntime.ok) {
    return systemFailureResponse({
      rawRequest: request,
      code: "UNSUPPORTED_RUNTIME_ADAPTER",
      message: "Runtime broker could not select a bottom Strategy runtime.",
      retryable: false,
      diagnostics: bottomRuntime.diagnostics,
    })
  }
  const topRuntime = dependencies.createRuntimeForRevision(
    request.strategies.top,
    runtimeConfig,
    request.limits,
  )
  if (!topRuntime.ok) {
    return systemFailureResponse({
      rawRequest: request,
      code: "UNSUPPORTED_RUNTIME_ADAPTER",
      message: "Runtime broker could not select a top Strategy runtime.",
      retryable: false,
      diagnostics: topRuntime.diagnostics,
    })
  }
  const runMatchInput: RunMatchInput = {
    ...request.match,
    runtime: createSideDispatchRuntime(
      bottomRuntime.runtime,
      topRuntime.runtime,
      {
        bottomPlayerId: request.match.bottomPlayerId,
        topPlayerId: request.match.topPlayerId,
      },
    ),
  }
  const result = dependencies.buildChronicleFromMatch(runMatchInput)
  const completionAuthority = loadAndVerifyRequestAuthority({
    request,
    runtimeConfig,
    loader: dependencies.authorityLoader,
    baseline: invocationAuthority.authority,
  })
  if (!completionAuthority.ok) {
    return authorityFailureResponse(request, completionAuthority.code)
  }
  const response = {
    contractVersion: request.contractVersion,
    ok: true,
    kind: "executionResult",
    requestId: request.requestId,
    matchId: request.match.matchId,
    runtimeAbiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    result: {
      privacy: "internal_runtime_result",
      chronicle: result.chronicle,
      finalState: result.finalState,
      runtimeViolationEventCount: runtimeViolationEventCount(result),
    },
  } satisfies RuntimeExecutionServiceResponse

  const parsed = RuntimeExecutionServiceResponseSchema.safeParse(response)
  if (!parsed.success) {
    return systemFailureResponse({
      rawRequest: request,
      code: "RESPONSE_SCHEMA_INVALID",
      message: "Runtime execution service produced an invalid response.",
      retryable: true,
      diagnostics: {
        reason: "response-schema-invalid",
        issueCount: parsed.error.issues.length,
      },
    })
  }

  return parsed.data as RuntimeExecutionServiceResponse
}

export const executeRuntimeServiceRequest = (
  rawRequest: unknown,
  runtimeConfig: RuntimeServiceConfig,
  dependencyOverrides: Partial<RuntimeExecutionServiceDependencies> = {},
): RuntimeExecutionServiceResponse => {
  const parsedRequest =
    RuntimeExecutionServiceRequestSchema.safeParse(rawRequest)
  if (!parsedRequest.success) {
    return systemFailureResponse({
      rawRequest,
      code: "MALFORMED_REQUEST",
      message: "Runtime execution request failed schema validation.",
      retryable: false,
      diagnostics: {
        reason: "request-schema-invalid",
        issueCount: parsedRequest.error.issues.length,
      },
    })
  }

  try {
    return executeParsedRequest(parsedRequest.data, runtimeConfig, {
      ...defaultDependencies,
      ...dependencyOverrides,
    })
  } catch (error) {
    return systemFailureResponse({
      rawRequest: parsedRequest.data,
      code: "EXECUTION_EXCEPTION",
      message: "Runtime execution service raised an execution exception.",
      retryable: true,
      diagnostics: {
        reason: "execution-exception",
        errorName: error instanceof Error ? error.name : "UnknownError",
      },
    })
  }
}
