import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { isDeepStrictEqual } from "node:util"
import {
  COMPATIBILITY_VERSIONS,
  DEFAULT_RUNTIME_LIMITS,
  RuntimeExecutionMatchInputSchema,
  RuntimeExecutionServiceRequestSchema,
  RuntimeExecutionServiceResponseSchema,
  StrategyRuntimeLimitsSchema,
  StrategyRevisionSchema,
  STRATEGY_RUNTIME_ABI_VERSION,
  findRuntimeBrokerRegistryEntry,
  hashExecutableLaneIdentity,
  runtimeCompatibilityKey,
  validateCanonicalGameState,
  validateStrategyLanguageProviderRuntimeCompatibility,
  type MatchId,
  type PlayerId,
  type RuntimeExecutionServiceRequest,
  type RuntimeExecutionServiceResponse,
  type RuntimeExecutionServiceSystemFailureCode,
  type RuntimeEntrantAuthorityReference,
  type CanonicalCompatibilityTuple,
  type Chronicle,
  type MatchOutcome,
  type StrategyRevision,
  type StrategyRevisionValidationReport,
} from "@cowards/spec"
import {
  buildTypeScriptSourceArtifact,
  createStrategyRevisionId,
  hashStrategySource,
  validateStrategySource,
} from "@cowards/runtime-js"
import { createRuntimeFromRevision } from "@cowards/runtime-js/worker"
import {
  buildPythonSourceArtifact,
  createPythonRuntimeFromRevision,
  validatePythonStrategySource,
} from "@cowards/runtime-python"
import {
  createWasmWasiRuntimeFromRevision,
  validateRustStrategySource,
  validateZigStrategySource,
} from "@cowards/runtime-wasm-wasi"
import {
  INACTIVE_V1_37_REPLAY_TUPLE,
  buildChronicleFromMatch,
  createCandidateReplay,
  recordChronicleFromExecution,
  validateCandidateReplaySemantics,
} from "@cowards/replay"
import {
  CANDIDATE_MATCH_KERNEL,
  violation,
  type GameState,
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

type CandidateCompatibilityIdentity = Readonly<{
  tupleId: string
  tuple: Readonly<CanonicalCompatibilityTuple>
}>

interface CandidateExhibitionAuthorityEntrant {
  readonly entrantKey: string
  readonly strategyRevisionId: string
  readonly laneIdentityHash: string
  readonly containmentCertificateId: string
  readonly containmentCertificateHash: string
}

interface CandidateExhibitionRuntimeAuthority {
  readonly authorityBundleHash: string
  readonly registryGeneration: string
  readonly entrants: Readonly<{
    bottom: CandidateExhibitionAuthorityEntrant
    top: CandidateExhibitionAuthorityEntrant
  }>
}

/** @internal Test-only candidate staging input. Never parse this as HTTP. */
export interface CandidateExhibitionExecutionRequest {
  readonly profile: "candidate_exhibition"
  readonly counted: false
  readonly requestId: string
  readonly compatibility: CandidateCompatibilityIdentity
  readonly match: RuntimeExecutionServiceRequest["match"]
  readonly strategies: RuntimeExecutionServiceRequest["strategies"]
  readonly limits: RuntimeExecutionServiceRequest["limits"]
  readonly runtimeAuthority: CandidateExhibitionRuntimeAuthority
}

export type CandidateExhibitionFailureCode =
  | "CANDIDATE_REQUEST_INVALID"
  | AuthorityFailureCode
  | "CANDIDATE_REVISION_INCOMPATIBLE"
  | "UNSUPPORTED_RUNTIME_ADAPTER"
  | "CANDIDATE_DRIVER_FAILURE"
  | "CANDIDATE_FINAL_STATE_INVALID"
  | "CANDIDATE_RECORDER_FAILURE"
  | "CANDIDATE_REPLAY_INVALID"
  | "EXECUTION_EXCEPTION"

export type CandidateExhibitionExecutionResult =
  | {
      readonly ok: true
      readonly profile: "candidate_exhibition"
      readonly counted: false
      readonly publishable: false
      readonly privacy: "internal_candidate_exhibition"
      readonly requestId: string
      readonly matchId: string
      readonly compatibility: CandidateCompatibilityIdentity
      readonly result: Readonly<{
        chronicle: Chronicle
        finalState: GameState
        terminalStateHash: string
        outcome: MatchOutcome
        runtimeViolationEventCount: number
      }>
    }
  | {
      readonly ok: false
      readonly profile: "candidate_exhibition"
      readonly counted: false
      readonly publishable: false
      readonly privacy: "internal_candidate_exhibition"
      readonly failure: Readonly<{
        classification: "system_failure"
        ownership: "system_integrity" | "runtime_system" | "authority_system"
        code: CandidateExhibitionFailureCode
        retryable: boolean
        playerPenalty: false
      }>
    }

export interface CandidateExhibitionExecutionDependencies {
  readonly authorityLoader?: RuntimeEvidenceAuthorityLoader | undefined
  readonly createRuntimeForRevision: typeof createRuntimeForRevision
  readonly runCandidateMatch: typeof CANDIDATE_MATCH_KERNEL.runMatch
  readonly validateFinalState: typeof validateCanonicalGameState
  readonly recordCandidateExecution: typeof recordChronicleFromExecution
  readonly validateCandidateReplay: typeof validateCandidateReplaySemantics
  readonly reconstructCandidateReplay: typeof createCandidateReplay
}

const defaultCandidateDependencies: CandidateExhibitionExecutionDependencies = {
  createRuntimeForRevision,
  runCandidateMatch: CANDIDATE_MATCH_KERNEL.runMatch,
  validateFinalState: validateCanonicalGameState,
  recordCandidateExecution: recordChronicleFromExecution,
  validateCandidateReplay: validateCandidateReplaySemantics,
  reconstructCandidateReplay: createCandidateReplay,
}

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value)
  return (
    keys.length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  )
}

const sameJson = (left: unknown, right: unknown): boolean =>
  isDeepStrictEqual(left, right)

const candidateLimitFields = [
  "timeoutMs",
  "stdoutBytes",
  "stderrBytes",
  "sourceBytes",
  "strategyMemoryBytes",
  "soldierMemoryBytes",
  "objectivePayloadBytes",
] as const

const CandidateRuntimeLimitsSchema = StrategyRuntimeLimitsSchema.superRefine(
  (limits, context) => {
    for (const field of candidateLimitFields) {
      if (limits[field] > DEFAULT_RUNTIME_LIMITS[field]) {
        context.addIssue({
          code: "too_big",
          maximum: DEFAULT_RUNTIME_LIMITS[field],
          inclusive: true,
          origin: "number",
          path: [field],
          message: `${field} exceeds candidate runtime service maximum`,
        })
      }
    }
  },
)

const candidateMatchAndLimitsAreExact = (
  request: Record<string, unknown>,
): boolean => {
  const match = RuntimeExecutionMatchInputSchema.safeParse(request.match)
  const limits = CandidateRuntimeLimitsSchema.safeParse(request.limits)
  return (
    match.success &&
    limits.success &&
    sameJson(match.data, request.match) &&
    sameJson(limits.data, request.limits)
  )
}

const candidateAuthorityEntrantIsExact = (value: unknown): boolean => {
  const entrant = readRecord(value)
  return (
    entrant !== undefined &&
    hasExactKeys(entrant, [
      "entrantKey",
      "strategyRevisionId",
      "laneIdentityHash",
      "containmentCertificateId",
      "containmentCertificateHash",
    ]) &&
    [
      entrant.entrantKey,
      entrant.strategyRevisionId,
      entrant.laneIdentityHash,
      entrant.containmentCertificateId,
      entrant.containmentCertificateHash,
    ].every((entry) => typeof entry === "string" && entry.length > 0)
  )
}

const candidateRequestIsExact = (
  value: unknown,
): value is CandidateExhibitionExecutionRequest => {
  const request = readRecord(value)
  if (
    request === undefined ||
    !hasExactKeys(request, [
      "profile",
      "counted",
      "requestId",
      "compatibility",
      "match",
      "strategies",
      "limits",
      "runtimeAuthority",
    ]) ||
    request.profile !== "candidate_exhibition" ||
    request.counted !== false ||
    typeof request.requestId !== "string" ||
    request.requestId.length === 0
  ) {
    return false
  }
  const compatibility = readRecord(request.compatibility)
  if (
    compatibility === undefined ||
    !hasExactKeys(compatibility, ["tupleId", "tuple"]) ||
    compatibility.tupleId !== INACTIVE_V1_37_REPLAY_TUPLE.tupleId ||
    !sameJson(compatibility.tuple, INACTIVE_V1_37_REPLAY_TUPLE.tuple)
  ) {
    return false
  }
  const match = readRecord(request.match)
  const strategies = readRecord(request.strategies)
  const runtimeAuthority = readRecord(request.runtimeAuthority)
  const entrants = readRecord(runtimeAuthority?.entrants)
  const bottomRevision = StrategyRevisionSchema.safeParse(strategies?.bottom)
  const topRevision = StrategyRevisionSchema.safeParse(strategies?.top)
  if (
    match === undefined ||
    strategies === undefined ||
    runtimeAuthority === undefined ||
    entrants === undefined ||
    !hasExactKeys(strategies, ["bottom", "top"]) ||
    !hasExactKeys(runtimeAuthority, [
      "authorityBundleHash",
      "registryGeneration",
      "entrants",
    ]) ||
    !hasExactKeys(entrants, ["bottom", "top"]) ||
    !candidateAuthorityEntrantIsExact(entrants.bottom) ||
    !candidateAuthorityEntrantIsExact(entrants.top) ||
    !bottomRevision.success ||
    !topRevision.success ||
    !sameJson(bottomRevision.data, strategies.bottom) ||
    !sameJson(topRevision.data, strategies.top) ||
    !candidateMatchAndLimitsAreExact(request)
  ) {
    return false
  }
  const bottom = strategies.bottom as StrategyRevision
  const top = strategies.top as StrategyRevision
  return (
    match.bottomStrategyRevisionId === bottom.id &&
    match.topStrategyRevisionId === top.id &&
    (entrants.bottom as Record<string, unknown>).strategyRevisionId ===
      bottom.id &&
    (entrants.top as Record<string, unknown>).strategyRevisionId === top.id &&
    typeof runtimeAuthority.authorityBundleHash === "string" &&
    typeof runtimeAuthority.registryGeneration === "string"
  )
}

const normalizeCandidateSource = (source: string): string =>
  source.replace(/\r\n?/g, "\n")

const candidatePackageEntrypoint = (
  languageId: StrategyRevision["runtime"]["language"]["id"],
): string | undefined => {
  switch (languageId) {
    case "typescript":
      return "default"
    case "python":
      return "module"
    case "rust":
    case "zig":
      return "_start"
    default:
      return undefined
  }
}

const candidateRuntimeMetadataIsCanonical = (
  revision: StrategyRevision,
): boolean => {
  const broker = findRuntimeBrokerRegistryEntry(revision.runtime)
  const entrypoint = candidatePackageEntrypoint(revision.runtime.language.id)
  return (
    broker !== null &&
    entrypoint !== undefined &&
    revision.runtime.abiVersion ===
      INACTIVE_V1_37_REPLAY_TUPLE.tuple.runtimeAbi &&
    validateStrategyLanguageProviderRuntimeCompatibility(revision.runtime)
      .length === 0 &&
    sameJson(revision.runtime.package, { mode: "none", entrypoint }) &&
    revision.runtime.requiredCapabilities.length === 0 &&
    sameJson(revision.runtime.limits, broker.limits)
  )
}

const candidateValidationReportFor = (
  revision: StrategyRevision,
  normalizedSource: string,
): StrategyRevisionValidationReport | undefined => {
  let activeReport: StrategyRevisionValidationReport
  switch (revision.runtime.language.id) {
    case "typescript":
      activeReport = validateStrategySource(normalizedSource, {
        runtime: revision.runtime,
      })
      break
    case "python":
      activeReport = validatePythonStrategySource(normalizedSource)
      break
    case "rust":
      activeReport = validateRustStrategySource(normalizedSource)
      break
    case "zig":
      activeReport = validateZigStrategySource(normalizedSource)
      break
    default:
      return undefined
  }
  return {
    ...activeReport,
    engineCompatibility: {
      spec: INACTIVE_V1_37_REPLAY_TUPLE.tuple.rules,
      engine: INACTIVE_V1_37_REPLAY_TUPLE.tuple.engine,
    },
  }
}

const candidateRevisionIdentity = (
  revision: StrategyRevision,
  sourceHash: string,
): string => {
  const artifact =
    revision.metadata.sourceArtifact ?? revision.metadata.compiledArtifact
  const runtimeCompatibility = runtimeCompatibilityKey({
    runtime: revision.runtime,
    sourceHash,
    ...(artifact === undefined ? {} : { artifactHash: artifact.hash }),
    ...(revision.metadata.compiledArtifact === undefined
      ? {}
      : {
          artifactTargetTriple: revision.metadata.compiledArtifact.targetTriple,
          artifactWasiProfile: revision.metadata.compiledArtifact.wasiProfile,
        }),
    specVersion: INACTIVE_V1_37_REPLAY_TUPLE.tuple.rules,
    engineVersion: INACTIVE_V1_37_REPLAY_TUPLE.tuple.engine,
  })
  return createStrategyRevisionId({
    sourceHash,
    runtimeVersion: revision.runtime.adapter.version,
    specVersion: INACTIVE_V1_37_REPLAY_TUPLE.tuple.rules,
    engineVersion: INACTIVE_V1_37_REPLAY_TUPLE.tuple.engine,
    strategyRevisionVersion: COMPATIBILITY_VERSIONS.strategyRevision,
    ...(revision.strategyId === undefined
      ? {}
      : { strategyId: revision.strategyId }),
    runtimeCompatibility,
  })
}

const candidateSourceArtifactIsCanonical = (
  revision: StrategyRevision,
  validation: StrategyRevisionValidationReport,
): boolean => {
  if (revision.runtime.language.id === "typescript") {
    const expected = buildTypeScriptSourceArtifact({
      source: revision.source,
      validation,
      runtime: revision.runtime,
    })
    return (
      expected !== null && sameJson(revision.metadata.sourceArtifact, expected)
    )
  }
  if (revision.runtime.language.id === "python") {
    return sameJson(
      revision.metadata.sourceArtifact,
      buildPythonSourceArtifact({ source: revision.source, validation }),
    )
  }
  return true
}

const candidateRevisionIsCompatible = (revision: StrategyRevision): boolean => {
  const normalizedSource = normalizeCandidateSource(revision.source)
  const sourceHash = hashStrategySource(normalizedSource)
  const sourceBytes = new TextEncoder().encode(normalizedSource).byteLength
  const validation = candidateValidationReportFor(revision, normalizedSource)
  const source = validateRevisionSource("bottom", revision)
  const artifact = validateRevisionArtifact("bottom", revision)
  return (
    revision.source === normalizedSource &&
    revision.sourceHash === sourceHash &&
    revision.sourceBytes === sourceBytes &&
    candidateRuntimeMetadataIsCanonical(revision) &&
    validation !== undefined &&
    validation.valid &&
    validation.runtimeVersion === revision.runtime.adapter.version &&
    sameJson(revision.validation, validation) &&
    revision.engineCompatibility.spec ===
      INACTIVE_V1_37_REPLAY_TUPLE.tuple.rules &&
    revision.engineCompatibility.engine ===
      INACTIVE_V1_37_REPLAY_TUPLE.tuple.engine &&
    revision.id === candidateRevisionIdentity(revision, sourceHash) &&
    source.ok &&
    artifact.ok &&
    candidateSourceArtifactIsCanonical(revision, validation)
  )
}

const candidateFailure = (
  code: CandidateExhibitionFailureCode,
  retryable: boolean,
  ownership:
    | "system_integrity"
    | "runtime_system"
    | "authority_system" = "system_integrity",
): CandidateExhibitionExecutionResult =>
  Object.freeze({
    ok: false,
    profile: "candidate_exhibition",
    counted: false,
    publishable: false,
    privacy: "internal_candidate_exhibition",
    failure: Object.freeze({
      classification: "system_failure",
      ownership,
      code,
      retryable,
      playerPenalty: false,
    }),
  })

type CandidateAuthorityCheck =
  | {
      readonly ok: true
      readonly authority: Readonly<VerifiedMountedRuntimeEvidenceAuthority>
    }
  | { readonly ok: false; readonly code: AuthorityFailureCode }

const verifyCandidateAuthorityEntrant = (input: {
  request: CandidateExhibitionExecutionRequest
  authority: Readonly<VerifiedMountedRuntimeEvidenceAuthority>
  runtimeConfig: RuntimeServiceConfig
  side: "bottom" | "top"
}): { ok: true } | { ok: false; code: AuthorityFailureCode } => {
  const entrant = input.request.runtimeAuthority.entrants[input.side]
  if (
    input.authority.payload.operatorLaneDisables.some(
      ({ laneIdentityHash }) => laneIdentityHash === entrant.laneIdentityHash,
    )
  ) {
    return { ok: false, code: "EVIDENCE_REVOKED" }
  }
  const certificate = input.authority.payload.certificates.find(
    ({ certificateId }) => certificateId === entrant.containmentCertificateId,
  )
  if (
    certificate === undefined ||
    certificate.kind !== "containment" ||
    certificate.certificateRecordHash !== entrant.containmentCertificateHash ||
    certificate.laneIdentityHash !== entrant.laneIdentityHash
  ) {
    return { ok: false, code: "EVIDENCE_IDENTITY_MISMATCH" }
  }
  if (certificateIsInactive(input.authority, certificate)) {
    return { ok: false, code: "EVIDENCE_REVOKED" }
  }
  if (hasCurrentConformanceForLane(input.authority, entrant.laneIdentityHash)) {
    return { ok: false, code: "EVIDENCE_IDENTITY_MISMATCH" }
  }
  const deployed = input.runtimeConfig.resolveDeploymentLaneIdentity(
    input.request.strategies[input.side],
  )
  if (deployed === undefined) {
    return { ok: false, code: "EVIDENCE_UNVERIFIABLE" }
  }
  let deployedHash: string
  try {
    deployedHash = `sha256:${hashExecutableLaneIdentity(deployed)}`
  } catch {
    return { ok: false, code: "EVIDENCE_UNVERIFIABLE" }
  }
  return deployedHash === entrant.laneIdentityHash
    ? { ok: true }
    : { ok: false, code: "EVIDENCE_IDENTITY_MISMATCH" }
}

const loadAndVerifyCandidateAuthority = (input: {
  request: CandidateExhibitionExecutionRequest
  runtimeConfig: RuntimeServiceConfig
  loader: RuntimeEvidenceAuthorityLoader | undefined
  baseline?: Readonly<VerifiedMountedRuntimeEvidenceAuthority> | undefined
}): CandidateAuthorityCheck => {
  if (input.loader === undefined) {
    return { ok: false, code: "EVIDENCE_UNVERIFIABLE" }
  }
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
      input.request.runtimeAuthority.authorityBundleHash ||
    authority.registryGeneration !==
      input.request.runtimeAuthority.registryGeneration ||
    authority.payload.registryGeneration !== authority.registryGeneration ||
    authority.semanticTupleManifestHash !==
      authority.payload.semanticTupleManifestHash ||
    authority.semanticTupleManifestHash === INACTIVE_V1_37_REPLAY_TUPLE.tupleId
  ) {
    return { ok: false, code: "EVIDENCE_IDENTITY_MISMATCH" }
  }
  for (const side of ["bottom", "top"] as const) {
    const verified = verifyCandidateAuthorityEntrant({
      request: input.request,
      authority,
      runtimeConfig: input.runtimeConfig,
      side,
    })
    if (!verified.ok) return verified
  }
  return { ok: true, authority }
}

/**
 * @internal TEST-ONLY. Candidate staging is deliberately absent from HTTP,
 * public request/response schemas, counted scheduling, and publication paths.
 */
export const executeCandidateExhibitionForTest = (
  rawRequest: unknown,
  runtimeConfig: RuntimeServiceConfig,
  dependencyOverrides: Partial<CandidateExhibitionExecutionDependencies> = {},
): CandidateExhibitionExecutionResult => {
  const dependencies = {
    ...defaultCandidateDependencies,
    ...dependencyOverrides,
  }
  if (!candidateRequestIsExact(rawRequest)) {
    return candidateFailure("CANDIDATE_REQUEST_INVALID", false)
  }
  const request = rawRequest
  try {
    for (const side of ["bottom", "top"] as const) {
      if (!candidateRevisionIsCompatible(request.strategies[side])) {
        return candidateFailure("CANDIDATE_REVISION_INCOMPATIBLE", false)
      }
    }
  } catch {
    return candidateFailure("CANDIDATE_REVISION_INCOMPATIBLE", false)
  }

  let acceptedAuthority: CandidateAuthorityCheck
  try {
    acceptedAuthority = loadAndVerifyCandidateAuthority({
      request,
      runtimeConfig,
      loader: dependencies.authorityLoader,
    })
  } catch {
    return candidateFailure("EVIDENCE_UNVERIFIABLE", true, "authority_system")
  }
  if (!acceptedAuthority.ok) {
    return candidateFailure(acceptedAuthority.code, true, "authority_system")
  }
  let invocationAuthority: CandidateAuthorityCheck
  try {
    invocationAuthority = loadAndVerifyCandidateAuthority({
      request,
      runtimeConfig,
      loader: dependencies.authorityLoader,
      baseline: acceptedAuthority.authority,
    })
  } catch {
    return candidateFailure("EVIDENCE_UNVERIFIABLE", true, "authority_system")
  }
  if (!invocationAuthority.ok) {
    return candidateFailure(invocationAuthority.code, true, "authority_system")
  }

  let bottomRuntime: ReturnType<typeof createRuntimeForRevision>
  try {
    bottomRuntime = dependencies.createRuntimeForRevision(
      request.strategies.bottom,
      runtimeConfig,
      request.limits,
    )
  } catch {
    return candidateFailure("EXECUTION_EXCEPTION", true, "runtime_system")
  }
  if (!bottomRuntime.ok) {
    return candidateFailure(
      "UNSUPPORTED_RUNTIME_ADAPTER",
      false,
      "runtime_system",
    )
  }

  let topRuntime: ReturnType<typeof createRuntimeForRevision>
  try {
    topRuntime = dependencies.createRuntimeForRevision(
      request.strategies.top,
      runtimeConfig,
      request.limits,
    )
  } catch {
    return candidateFailure("EXECUTION_EXCEPTION", true, "runtime_system")
  }
  if (!topRuntime.ok) {
    return candidateFailure(
      "UNSUPPORTED_RUNTIME_ADAPTER",
      false,
      "runtime_system",
    )
  }

  let execution: ReturnType<typeof CANDIDATE_MATCH_KERNEL.runMatch>
  try {
    execution = dependencies.runCandidateMatch({
      ...request.match,
      runtime: createSideDispatchRuntime(
        bottomRuntime.runtime,
        topRuntime.runtime,
        {
          bottomPlayerId: request.match.bottomPlayerId,
          topPlayerId: request.match.topPlayerId,
        },
      ),
    })
  } catch {
    return candidateFailure("EXECUTION_EXCEPTION", true, "runtime_system")
  }
  if (execution.kind !== "completed") {
    return candidateFailure(
      "CANDIDATE_DRIVER_FAILURE",
      execution.failure.retryable,
      execution.failure.ownership === "runtime_system"
        ? "runtime_system"
        : "system_integrity",
    )
  }

  let finalSemantic: ReturnType<typeof validateCanonicalGameState>
  try {
    finalSemantic = dependencies.validateFinalState(execution.result.state)
  } catch {
    return candidateFailure("CANDIDATE_FINAL_STATE_INVALID", false)
  }
  if (!finalSemantic.ok) {
    return candidateFailure("CANDIDATE_FINAL_STATE_INVALID", false)
  }

  let recorded: ReturnType<typeof recordChronicleFromExecution>
  try {
    recorded = dependencies.recordCandidateExecution({
      execution,
      metadata: {
        schemaVersion: "chronicle-v1.4",
        semanticTupleId: INACTIVE_V1_37_REPLAY_TUPLE.tupleId,
        semanticTuple: INACTIVE_V1_37_REPLAY_TUPLE.tuple,
      },
    })
  } catch {
    return candidateFailure("CANDIDATE_RECORDER_FAILURE", false)
  }
  if (!recorded.ok) {
    return candidateFailure("CANDIDATE_RECORDER_FAILURE", false)
  }
  const replayInput = {
    profile: "candidate-v1.37" as const,
    compatibility: recorded.semanticIdentity,
    chronicle: recorded.chronicle,
    boundaryAnchors: recorded.boundaryAnchors,
    execution,
  }
  try {
    const validated = dependencies.validateCandidateReplay(replayInput)
    if (!validated.ok) {
      return candidateFailure("CANDIDATE_REPLAY_INVALID", false)
    }
  } catch {
    return candidateFailure("CANDIDATE_REPLAY_INVALID", false)
  }
  try {
    const reconstructed = dependencies.reconstructCandidateReplay(replayInput)
    if (!reconstructed.ok) {
      return candidateFailure("CANDIDATE_REPLAY_INVALID", false)
    }
  } catch {
    return candidateFailure("CANDIDATE_REPLAY_INVALID", false)
  }
  const terminal = execution.transitions.at(-1)
  const outcome = execution.result.state.outcome
  if (
    terminal === undefined ||
    outcome === undefined ||
    terminal.terminalStatus === null ||
    !sameJson(terminal.terminalStatus, outcome)
  ) {
    return candidateFailure("CANDIDATE_REPLAY_INVALID", false)
  }
  let completionAuthority: CandidateAuthorityCheck
  try {
    completionAuthority = loadAndVerifyCandidateAuthority({
      request,
      runtimeConfig,
      loader: dependencies.authorityLoader,
      baseline: invocationAuthority.authority,
    })
  } catch {
    return candidateFailure("EVIDENCE_UNVERIFIABLE", true, "authority_system")
  }
  if (!completionAuthority.ok) {
    return candidateFailure(completionAuthority.code, true, "authority_system")
  }
  return Object.freeze({
    ok: true,
    profile: "candidate_exhibition",
    counted: false,
    publishable: false,
    privacy: "internal_candidate_exhibition",
    requestId: request.requestId,
    matchId: request.match.matchId,
    compatibility: INACTIVE_V1_37_REPLAY_TUPLE,
    result: Object.freeze({
      chronicle: recorded.chronicle,
      finalState: recorded.finalState,
      terminalStateHash: terminal.afterStateHash,
      outcome,
      runtimeViolationEventCount: recorded.chronicle.events.filter(
        ({ type }) => type === "RUNTIME_VIOLATION",
      ).length,
    }),
  })
}
