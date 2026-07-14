import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { isDeepStrictEqual } from "node:util"
import {
  RUNTIME_INVOCATION_V1_17_CANDIDATE,
  RuntimeExecutionServiceRequestSchema,
  RuntimeExecutionServiceResponseSchema,
  RuntimeExecutionFinalStateSchema,
  ChronicleSchema,
  STRATEGY_RUNTIME_ABI_VERSION,
  findRuntimeBrokerRegistryEntry,
  createRuntimeInvocationTraceV117,
  hashExecutableLaneIdentity,
  serializeRuntimeInvocationRequestV117,
  validateStrategyLanguageProviderRuntimeCompatibility,
  verifyRuntimeInvocationRequestV117,
  verifyRuntimeInvocationResponseV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type JsonValue,
  type MatchId,
  type PlayerId,
  type RuntimeExecutionServiceRequest,
  type RuntimeExecutionServiceResponse,
  type RuntimeExecutionServiceSystemFailureCode,
  type RuntimeInvocationResultV117,
  type RuntimeInvocationResponseAccountingV117,
  type RuntimeInvocationSigningIdentityV117,
  type RuntimeInvocationTraceV117,
  type RuntimeEntrantAuthorityReference,
  type Chronicle,
  type StrategyRevision,
} from "@cowards/spec"
import { hashStrategySource } from "@cowards/runtime-js"
import { createRuntimeFromRevision } from "@cowards/runtime-js/worker"
import { createPythonRuntimeFromRevision } from "@cowards/runtime-python"
import { createWasmWasiRuntimeFromRevision } from "@cowards/runtime-wasm-wasi"
import {
  createCurrentReplay,
  recordChronicleFromExecution,
  validateCurrentChronicle,
  validateCurrentReplayReconstruction,
  type ReplayState,
} from "@cowards/replay"
import {
  MatchExecutionFailure,
  runMatch,
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
import { issueRuntimeSemanticReceipt } from "./semantic-receipt.js"

export interface CandidateRuntimeInvocationInputV117<
  TValue = JsonValue,
  TExecution = unknown,
> {
  readonly request: AuthenticatedRuntimeInvocationRequestV117
  readonly identity: RuntimeInvocationSigningIdentityV117
  readonly invoke: (requestBytes: Uint8Array) => Uint8Array
  readonly executeOutcome: (
    outcome: RuntimeInvocationResultV117<TValue>,
    request: AuthenticatedRuntimeInvocationRequestV117,
  ) => TExecution
}

export interface CandidateRuntimeInvocationPublicResultV117 {
  readonly contractVersion: typeof RUNTIME_INVOCATION_V1_17_CANDIDATE.contractVersion
  readonly candidateStatus: typeof RUNTIME_INVOCATION_V1_17_CANDIDATE.lifecycle
  readonly current: false
  readonly requestId: string
  readonly invocationId: string
  readonly kernelRequestId: string
  readonly method: AuthenticatedRuntimeInvocationRequestV117["method"]
  readonly classification: RuntimeInvocationResultV117["kind"]
  readonly code?: string | undefined
  readonly retryable?: boolean | undefined
}

export interface CandidateRuntimeInvocationExecutionV117<TExecution> {
  /** Private engine material. Never serialize this field on a public route. */
  readonly internalExecution: TExecution
  /** Verified private accounting from an authenticated adapter response. */
  readonly authenticatedAccounting?: RuntimeInvocationResponseAccountingV117
  readonly publicResult: CandidateRuntimeInvocationPublicResultV117
}

const candidateRequestTrace = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  safeCode: string,
): RuntimeInvocationTraceV117 =>
  createRuntimeInvocationTraceV117(request, [safeCode])

const candidatePublicResult = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  outcome: RuntimeInvocationResultV117,
): CandidateRuntimeInvocationPublicResultV117 => ({
  contractVersion: RUNTIME_INVOCATION_V1_17_CANDIDATE.contractVersion,
  candidateStatus: RUNTIME_INVOCATION_V1_17_CANDIDATE.lifecycle,
  current: false,
  requestId: request.requestId,
  invocationId: request.invocationId,
  kernelRequestId: request.kernelRequestId,
  method: request.method,
  classification: outcome.kind,
  ...(outcome.kind === "player_violation"
    ? { code: outcome.violation.code }
    : outcome.kind === "system_failure"
      ? { code: outcome.failure.code, retryable: outcome.failure.retryable }
      : {}),
})

/**
 * Inactive v1.17 candidate bridge. It performs exactly one adapter attempt,
 * verifies the complete authenticated response binding, and delegates every
 * gameplay consequence or rollback to the canonical engine driver. Retry is
 * deliberately absent: the Go authority may call this bridge again only with
 * the same signed request and prestate.
 */
export const executeCandidateRuntimeInvocationV117 = <
  TValue = JsonValue,
  TExecution = unknown,
>(
  input: CandidateRuntimeInvocationInputV117<TValue, TExecution>,
): CandidateRuntimeInvocationExecutionV117<TExecution> => {
  const requestBytes = serializeRuntimeInvocationRequestV117(input.request)
  const admittedRequest = verifyRuntimeInvocationRequestV117(
    requestBytes,
    input.identity,
  )
  const expectedRequest =
    admittedRequest.kind === "success"
      ? admittedRequest.value
      : input.request
  let outcome: RuntimeInvocationResultV117<TValue> | undefined
  let authenticatedAccounting:
    | RuntimeInvocationResponseAccountingV117
    | undefined

  if (admittedRequest.kind !== "success") {
    outcome = admittedRequest as RuntimeInvocationResultV117<TValue>
  } else {
    let responseBytes: Uint8Array | undefined
    try {
      const adapterResponse = input.invoke(Uint8Array.from(requestBytes))
      if (adapterResponse instanceof Uint8Array) {
        responseBytes = adapterResponse
      } else {
        outcome = {
          kind: "system_failure",
          failure: {
            code: "TRANSPORT_CRASH",
            publicMessage: "Runtime system failure.",
            retryable: true,
          },
          trace: candidateRequestTrace(expectedRequest, "TRANSPORT_CRASH"),
        }
      }
    } catch {
      outcome = {
        kind: "system_failure",
        failure: {
          code: "ADAPTER_CRASH",
          publicMessage: "Runtime system failure.",
          retryable: true,
        },
        trace: candidateRequestTrace(expectedRequest, "ADAPTER_CRASH"),
      }
    }
    if (responseBytes !== undefined) {
      const admittedResponse = verifyRuntimeInvocationResponseV117(
        responseBytes,
        expectedRequest,
        input.identity,
      )
      if (admittedResponse.kind === "success") {
        outcome = admittedResponse.value
          .outcome as RuntimeInvocationResultV117<TValue>
        authenticatedAccounting = admittedResponse.value.accounting
      } else {
        outcome = admittedResponse as RuntimeInvocationResultV117<TValue>
      }
    }
  }

  if (outcome === undefined) {
    outcome = {
      kind: "system_failure",
      failure: {
        code: "TRANSPORT_CRASH",
        publicMessage: "Runtime system failure.",
        retryable: true,
      },
      trace: candidateRequestTrace(expectedRequest, "TRANSPORT_CRASH"),
    }
  }

  const internalExecution = input.executeOutcome(outcome, expectedRequest)
  return {
    internalExecution,
    ...(authenticatedAccounting === undefined
      ? {}
      : { authenticatedAccounting }),
    publicResult: candidatePublicResult(
      expectedRequest,
      outcome as RuntimeInvocationResultV117,
    ),
  }
}

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
    contractVersion: "runtime-execution-service-v1.16",
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
  runMatch: typeof runMatch
  recordChronicle: typeof recordChronicleFromExecution
  validateChronicle: typeof validateCurrentChronicle
  reconstructChronicle: typeof validateCurrentReplayReconstruction
  createReplay: typeof createCurrentReplay
  createRuntimeForRevision: typeof createRuntimeForRevision
  authorityLoader?: RuntimeEvidenceAuthorityLoader | undefined
}

const defaultDependencies: RuntimeExecutionServiceDependencies = {
  runMatch,
  recordChronicle: recordChronicleFromExecution,
  validateChronicle: validateCurrentChronicle,
  reconstructChronicle: validateCurrentReplayReconstruction,
  createReplay: createCurrentReplay,
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

const runtimeViolationEventCount = (chronicle: Chronicle): number =>
  chronicle.events.filter((event) => event.type === "RUNTIME_VIOLATION").length

const projectFinalStateForReplay = (state: GameState): ReplayState => ({
  board: {
    bounds: globalThis.structuredClone(state.bounds),
    soldiers: state.soldiers.map(
      ({
        id,
        ownerPlayerId,
        status,
        position,
        facing,
        lastSuccessfulMoveDirection,
      }) => ({
        id,
        ownerPlayerId,
        status,
        position: position === null ? null : { ...position },
        facing,
        lastSuccessfulMoveDirection,
      }),
    ),
    terrainStones: state.terrainStones.map((position) => ({ ...position })),
  },
  ...(state.outcome === undefined ? {} : { outcome: state.outcome }),
})

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
  let result: ReturnType<typeof runMatch>
  try {
    result = dependencies.runMatch(runMatchInput)
  } catch (error) {
    return systemFailureResponse({
      rawRequest: request,
      code: "MATCH_EXECUTION_FAILED",
      message: "Canonical Match execution failed.",
      retryable:
        error instanceof MatchExecutionFailure ? error.failure.retryable : true,
      diagnostics: {
        reason: "match-execution-failed",
        failureCode:
          error instanceof MatchExecutionFailure
            ? error.failure.code
            : "UNEXPECTED_THROW",
      },
    })
  }
  const recorded = dependencies.recordChronicle({
    execution: result.execution,
    metadata: {
      schemaVersion: "chronicle-v1.4",
      semanticTupleId: request.evidenceSnapshot.compatibility.tupleId,
      semanticTuple: request.evidenceSnapshot.compatibility.tuple,
    },
  })
  if (!recorded.ok) {
    return systemFailureResponse({
      rawRequest: request,
      code: "CHRONICLE_INTEGRITY_FAILED",
      message: "Canonical Chronicle recording failed.",
      retryable: false,
      diagnostics: {
        reason: "chronicle-recording-failed",
        failureCode: recorded.failure.code,
      },
    })
  }
  const semanticInput = {
    profile: "current-exact" as const,
    compatibility: recorded.semanticIdentity,
    chronicle: recorded.chronicle,
    boundaryAnchors: recorded.boundaryAnchors,
    execution: result.execution,
  }
  const validated = dependencies.validateChronicle(semanticInput)
  if (!validated.ok) {
    return systemFailureResponse({
      rawRequest: request,
      code: "CHRONICLE_INTEGRITY_FAILED",
      message: "Canonical Chronicle semantic validation failed.",
      retryable: false,
      diagnostics: {
        reason: "chronicle-semantic-validation-failed",
      },
    })
  }
  const reconstructionValidation = dependencies.reconstructChronicle({
    chronicle: recorded.chronicle,
    execution: result.execution,
  })
  if (!reconstructionValidation.ok) {
    return systemFailureResponse({
      rawRequest: request,
      code: "CHRONICLE_INTEGRITY_FAILED",
      message: "Canonical Chronicle reconstruction failed.",
      retryable: false,
      diagnostics: {
        reason: "chronicle-reconstruction-failed",
      },
    })
  }
  const reconstructed = dependencies.createReplay(semanticInput)
  const terminalSequence = recorded.chronicle.events.at(-1)?.sequence
  const reconstructedTerminalState =
    reconstructed.ok && terminalSequence !== undefined
      ? reconstructed.replay.stateAt(terminalSequence)
      : undefined
  const terminalAnchor = recorded.boundaryAnchors.at(-1)
  if (
    result.execution.kind !== "completed" ||
    !reconstructed.ok ||
    reconstructedTerminalState === undefined ||
    !reconstructedTerminalState.ok ||
    !isDeepStrictEqual(
      reconstructedTerminalState.state,
      projectFinalStateForReplay(recorded.finalState),
    ) ||
    !isDeepStrictEqual(recorded.finalState, result.execution.result.state) ||
    !isDeepStrictEqual(
      reconstructionValidation.outcome,
      recorded.finalState.outcome,
    ) ||
    terminalAnchor?.kind !== "TERMINAL" ||
    terminalAnchor.stateHash !== reconstructionValidation.terminalStateHash
  ) {
    return systemFailureResponse({
      rawRequest: request,
      code: "CHRONICLE_INTEGRITY_FAILED",
      message: "Canonical Chronicle terminal binding failed.",
      retryable: false,
      diagnostics: { reason: "chronicle-terminal-binding-failed" },
    })
  }
  const completionAuthority = loadAndVerifyRequestAuthority({
    request,
    runtimeConfig,
    loader: dependencies.authorityLoader,
    baseline: invocationAuthority.authority,
  })
  if (!completionAuthority.ok) {
    return authorityFailureResponse(request, completionAuthority.code)
  }
  const violationCount = runtimeViolationEventCount(recorded.chronicle)
  const responseChronicle = ChronicleSchema.omit({
    integrity: true,
    storageMetadata: true,
  })
    .strict()
    .safeParse(recorded.chronicle)
  const responseFinalState = RuntimeExecutionFinalStateSchema.safeParse(
    recorded.finalState,
  )
  if (!responseChronicle.success || !responseFinalState.success) {
    return systemFailureResponse({
      rawRequest: request,
      code: "RESPONSE_SCHEMA_INVALID",
      message: "Runtime execution service produced an invalid response.",
      retryable: true,
      diagnostics: { reason: "response-wire-payload-invalid" },
    })
  }
  const responseChronicleData = responseChronicle.data as Chronicle & {
    integrity?: never
    storageMetadata?: never
  }
  const semanticReceipt = issueRuntimeSemanticReceipt({
    request,
    chronicle: responseChronicleData,
    finalState: responseFinalState.data,
    reconstructedTerminalStateHash: reconstructionValidation.terminalStateHash,
    runtimeViolationEventCount: violationCount,
    secret: runtimeConfig.semanticReceiptSecret,
  })
  const response = {
    contractVersion: request.contractVersion,
    ok: true,
    kind: "executionResult",
    requestId: request.requestId,
    matchId: request.match.matchId,
    runtimeAbiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    result: {
      privacy: "internal_runtime_result",
      chronicle: responseChronicleData,
      finalState: responseFinalState.data,
      runtimeViolationEventCount: violationCount,
      semanticReceipt,
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
