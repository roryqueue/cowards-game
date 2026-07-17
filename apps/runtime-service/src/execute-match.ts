import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { isDeepStrictEqual } from "node:util"
import {
  RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256,
  RUNTIME_INVOCATION_V1_17_INITIAL_EXECUTION_LEDGER_ROOT,
  HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16,
  HistoricalRuntimeExecutionServiceRequestV116Schema,
  HistoricalRuntimeExecutionServiceResponseV116Schema,
  isExactCommittedRuntimeExecutionServiceRequestV116,
  RuntimeExecutionServiceRequestSchema,
  RuntimeExecutionServiceResponseSchema,
  HISTORICAL_RUNTIME_EXECUTION_SERVICE_VERSION_V1_16,
  RuntimeExecutionServiceRequestV117Schema,
  RuntimeExecutionServiceResponseV117Schema,
  RuntimeExecutionServiceRequestV118Schema,
  RuntimeExecutionServiceResponseV118Schema,
  RuntimeExecutionFinalStateSchema,
  ChronicleSchema,
  STRATEGY_RUNTIME_ABI_VERSION,
  findRuntimeBrokerRegistryEntry,
  createRuntimeInvocationTraceV117,
  encodeCanonicalJson,
  createSelectedRuntimeInvocationRequestV117,
  createRuntimeAbiV117ExecutionLedger,
  createRuntimeInvocationBudgetV117,
  hashExecutableLaneIdentity,
  hashCanonicalIdentity,
  hashRuntimeIdentityManifest,
  runtimeInvocationExecutionLedgerPoststateRootV117,
  serializeRuntimeInvocationRequestV117,
  validateStrategyLanguageProviderRuntimeCompatibility,
  verifySelectedRuntimeInvocationRequestV117,
  verifyRuntimeInvocationResponseV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type JsonValue,
  type MatchId,
  type PlayerId,
  type RuntimeExecutionServiceRequest,
  type RuntimeExecutionServiceResponse,
  type RuntimeExecutionServiceSystemFailureCode,
  type RuntimeExecutionServiceResponseV117,
  type RuntimeExecutionServiceRequestV118,
  type RuntimeExecutionServiceResponseV118,
  type RuntimeCertificateReferenceV118,
  type RuntimeExecutionEntrantV117,
  type RuntimeEvidenceAuthorityExactPinV117,
  type RuntimeInvocationResultV117,
  type RuntimeInvocationResponseAccountingV117,
  type RuntimeInvocationSigningIdentityV117,
  type RuntimeAbiV117ExecutionLedger,
  type RuntimeInvocationTraceV117,
  type RuntimeEntrantAuthorityReference,
  type Chronicle,
  type ExecutableLaneIdentity,
  type SoldierBrainResult,
  type StrategyResult,
  type StrategyRevision,
} from "@cowards/spec"
import {
  executeCandidateObservationTransportV119,
  hashStrategySource,
  type AdmittedCandidateObservationV119,
  type CandidateObservationTransportRequestV119,
  type CandidateObservationTransportResultV119,
} from "@cowards/runtime-js"
import { createRuntimeFromRevision } from "@cowards/runtime-js/worker"
import { createPythonRuntimeFromRevision } from "@cowards/runtime-python"
import { createWasmWasiRuntimeFromRevision } from "@cowards/runtime-wasm-wasi"
import {
  createCurrentReplay,
  recordChronicleFromExecution,
  validateCurrentChronicle,
  validateCurrentReplayReconstruction,
  type ChronicleBoundaryAnchor,
  type ChronicleRecorderExecution,
  type ReplayState,
} from "@cowards/replay"
import {
  MatchExecutionFailure,
  runMatch,
  type GameState,
  type CanonicalStrategyRuntime,
  type RunMatchInput,
  type StrategyRuntime,
} from "@cowards/engine"
import type { RuntimeServiceConfig } from "./runtime-config.js"
import { publicSystemFailureMessage, redactedDiagnostics } from "./redaction.js"
import type {
  RuntimeEvidenceAuthorityLoader,
  RuntimeEvidenceAuthorityLoaderV117,
  VerifiedMountedRuntimeEvidenceAuthority,
} from "./runtime-evidence-authority.js"
import { issueRuntimeSemanticReceipt } from "./semantic-receipt.js"
import { issueRuntimeSemanticReceiptV117 } from "./semantic-receipt-v1-17.js"
import {
  issueRuntimeSemanticReceiptV118,
  type RuntimeSemanticReceiptSignerV118,
} from "./semantic-receipt-v1-18-issuer.js"
import {
  composeSuccessorRuntimeIdentityV117,
  type SuccessorRuntimeIdentityTemplateV117,
} from "./successor-runtime-identity.js"

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
  readonly contractVersion: AuthenticatedRuntimeInvocationRequestV117["contractVersion"]
  readonly candidateStatus: AuthenticatedRuntimeInvocationRequestV117["candidateStatus"]
  readonly current: AuthenticatedRuntimeInvocationRequestV117["current"]
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
  /** Exact immutable request selected for execution; verifier-normalized on success. */
  readonly admittedRequest: AuthenticatedRuntimeInvocationRequestV117
  /** Verified private accounting from an authenticated adapter response. */
  readonly authenticatedAccounting?: RuntimeInvocationResponseAccountingV117
  readonly publicResult: CandidateRuntimeInvocationPublicResultV117
}

export interface RuntimeObservationDispatchInputV119<
  TCurrent,
  TCandidate = unknown,
> {
  /** Omitted means the generated current/default route remains authoritative. */
  readonly candidateRequest?: CandidateObservationTransportRequestV119 | undefined
  readonly executeCurrent: () => TCurrent
  readonly executeCandidate: (
    observation: AdmittedCandidateObservationV119,
  ) => CandidateObservationTransportResultV119<TCandidate>
}

/**
 * Additive candidate-only provider dispatch. A request must carry the complete
 * v1.19 candidate envelope; otherwise the existing Phase-259 current callback
 * is the only route. Admission happens before any provider process is started.
 */
export const dispatchRuntimeObservationV119 = <TCurrent, TCandidate = unknown>(
  input: RuntimeObservationDispatchInputV119<TCurrent, TCandidate>,
): TCurrent | CandidateObservationTransportResultV119<TCandidate> =>
  input.candidateRequest === undefined
    ? input.executeCurrent()
    : executeCandidateObservationTransportV119(
        input.candidateRequest,
        input.executeCandidate,
      )

const candidateRequestTrace = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  safeCode: string,
): RuntimeInvocationTraceV117 =>
  createRuntimeInvocationTraceV117(request, [safeCode])

const candidatePublicResult = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  outcome: RuntimeInvocationResultV117,
): CandidateRuntimeInvocationPublicResultV117 => ({
  contractVersion: request.contractVersion,
  candidateStatus: request.candidateStatus,
  current: request.current,
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
 * Selected v1.17 authenticated bridge. It performs exactly one adapter attempt,
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
  const admittedRequest = verifySelectedRuntimeInvocationRequestV117(
    requestBytes,
    input.identity,
  )
  const expectedRequest =
    admittedRequest.kind === "success" ? admittedRequest.value : input.request
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
    admittedRequest: expectedRequest,
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

const historicalRuntimeV116Request = (rawRequest: unknown): boolean =>
  String(STRATEGY_RUNTIME_ABI_VERSION) !==
    HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeAbiVersion &&
  isExactCommittedRuntimeExecutionServiceRequestV116(rawRequest)

const runtimeAbiForResponse = (rawRequest: unknown): string =>
  historicalRuntimeV116Request(rawRequest)
    ? HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeAbiVersion
    : STRATEGY_RUNTIME_ABI_VERSION

const parseRuntimeServiceResponse = (
  response: unknown,
  rawRequest: unknown,
): RuntimeExecutionServiceResponse =>
  (historicalRuntimeV116Request(rawRequest)
    ? HistoricalRuntimeExecutionServiceResponseV116Schema
    : RuntimeExecutionServiceResponseSchema
  ).parse(response) as RuntimeExecutionServiceResponse

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
    runtimeAbiVersion: runtimeAbiForResponse(input.rawRequest),
    systemFailure: {
      code: input.code,
      message: input.message,
      publicMessage: publicSystemFailureMessage(input.code),
      retryable: input.retryable,
      ...(input.diagnostics === undefined
        ? {}
        : { diagnostics: redactedDiagnostics(input.diagnostics) }),
    },
  }

  return parseRuntimeServiceResponse(response, input.rawRequest)
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
  expectedRuntimeAbi: string,
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
      artifact.abiVersion !== expectedRuntimeAbi ||
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
    artifact.abiVersion !== expectedRuntimeAbi ||
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
  expectedRuntimeAbi: string = STRATEGY_RUNTIME_ABI_VERSION,
):
  | { ok: true; runtime: StrategyRuntime }
  | {
      ok: false
      diagnostics: Record<string, unknown>
    } => {
  const historicalRuntime =
    expectedRuntimeAbi ===
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeAbiVersion &&
    String(expectedRuntimeAbi) !== String(STRATEGY_RUNTIME_ABI_VERSION)
  if (historicalRuntime) {
    return {
      ok: false,
      diagnostics: {
        reason: "historical-runtime-evidence-is-verification-only",
        revisionId: revision.id,
        languageId: revision.runtime.language.id,
      },
    }
  }
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

/**
 * Test-support admission for the nested Match-shaped executor. It reuses every
 * production provider, registry, artifact, and service-adapter check while
 * discarding the guarded runtime instance itself.
 */
export const validateNestedMatchRuntimeRevisionTestSupport = (
  revision: StrategyRevision,
  runtimeConfig: RuntimeServiceConfig,
  limits: RuntimeExecutionServiceRequest["limits"],
): { ok: true } | { ok: false; diagnostics: Record<string, unknown> } => {
  const admitted = createRuntimeForRevision(revision, runtimeConfig, limits)
  return admitted.ok ? { ok: true } : admitted
}

export interface RuntimeExecutionServiceDependencies {
  runMatch: typeof runMatch
  recordChronicle: typeof recordChronicleFromExecution
  validateChronicle: typeof validateCurrentChronicle
  reconstructChronicle: typeof validateCurrentReplayReconstruction
  createReplay: typeof createCurrentReplay
  createRuntimeForRevision: typeof createRuntimeForRevision
  createCanonicalRuntimeForRevision?:
    | ((
        revision: StrategyRevision,
        runtimeConfig: RuntimeServiceConfig,
        limits: RuntimeExecutionServiceRequest["limits"],
        expectedRuntimeAbi?: string,
      ) =>
        | { ok: true; runtime: CanonicalStrategyRuntime }
        | { ok: false; diagnostics: Record<string, unknown> })
    | undefined
  adaptRuntimeForCurrentMatch?:
    | ((runtime: StrategyRuntime) => CanonicalStrategyRuntime)
    | undefined
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
  bottomRuntime: CanonicalStrategyRuntime,
  topRuntime: CanonicalStrategyRuntime,
  playerIds: { bottomPlayerId: PlayerId; topPlayerId: PlayerId },
): CanonicalStrategyRuntime => ({
  selectActivations(input, kernelRequest) {
    const playerId = input.mySoldiers[0]?.ownerPlayerId
    if (playerId === playerIds.bottomPlayerId) {
      return bottomRuntime.selectActivations(input, kernelRequest)
    }
    if (playerId === playerIds.topPlayerId) {
      return topRuntime.selectActivations(input, kernelRequest)
    }
    throw new Error("Cannot resolve player runtime")
  },

  runSoldierBrain(input, kernelRequest) {
    const playerId = input.self.ownerPlayerId
    if (playerId === playerIds.bottomPlayerId) {
      return bottomRuntime.runSoldierBrain(input, kernelRequest)
    }
    if (playerId === playerIds.topPlayerId) {
      return topRuntime.runSoldierBrain(input, kernelRequest)
    }
    throw new Error("Cannot resolve soldier runtime")
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
  historicalV116: boolean,
): RuntimeExecutionServiceResponse => {
  const expectedRuntimeAbi = historicalV116
    ? HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeAbiVersion
    : STRATEGY_RUNTIME_ABI_VERSION
  const acceptedAuthority = loadAndVerifyRequestAuthority({
    request,
    runtimeConfig,
    loader: dependencies.authorityLoader,
  })
  if (!acceptedAuthority.ok) {
    return authorityFailureResponse(request, acceptedAuthority.code)
  }
  if (historicalV116) {
    return systemFailureResponse({
      rawRequest: request,
      code: "UNSUPPORTED_RUNTIME_ADAPTER",
      message:
        "Historical v1.16 evidence is verification-only and cannot start new gameplay execution.",
      retryable: false,
    })
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
      expectedRuntimeAbi,
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

  const createAdmittedCurrentRuntime = (revision: StrategyRevision) => {
    if (dependencies.createCanonicalRuntimeForRevision !== undefined) {
      return dependencies.createCanonicalRuntimeForRevision(
        revision,
        runtimeConfig,
        request.limits,
        expectedRuntimeAbi,
      )
    }
    const created = dependencies.createRuntimeForRevision(
      revision,
      runtimeConfig,
      request.limits,
      expectedRuntimeAbi,
    )
    if (!created.ok) return created
    if (dependencies.adaptRuntimeForCurrentMatch === undefined) {
      return {
        ok: false as const,
        diagnostics: {
          reason: "authenticated-current-runtime-adapter-missing",
        },
      }
    }
    return {
      ok: true as const,
      runtime: dependencies.adaptRuntimeForCurrentMatch(created.runtime),
    }
  }

  const bottomRuntime = createAdmittedCurrentRuntime(request.strategies.bottom)
  if (!bottomRuntime.ok) {
    return systemFailureResponse({
      rawRequest: request,
      code: "UNSUPPORTED_RUNTIME_ADAPTER",
      message: "Runtime broker could not select a bottom Strategy runtime.",
      retryable: false,
      diagnostics: bottomRuntime.diagnostics,
    })
  }
  const topRuntime = createAdmittedCurrentRuntime(request.strategies.top)
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
    runtimeAbiVersion: expectedRuntimeAbi,
    result: {
      privacy: "internal_runtime_result",
      chronicle: responseChronicleData,
      finalState: responseFinalState.data,
      runtimeViolationEventCount: violationCount,
      semanticReceipt,
    },
  }

  const parsed = (
    historicalV116
      ? HistoricalRuntimeExecutionServiceResponseV116Schema
      : RuntimeExecutionServiceResponseSchema
  ).safeParse(response)
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

const executeRuntimeServiceRequestInternal = (
  rawRequest: unknown,
  runtimeConfig: RuntimeServiceConfig,
  dependencyOverrides: Partial<RuntimeExecutionServiceDependencies> = {},
  allowSelectedV117NestedMatch = false,
): RuntimeExecutionServiceResponse => {
  const selectedRequest =
    RuntimeExecutionServiceRequestSchema.safeParse(rawRequest)
  const historicalV116 =
    !selectedRequest.success && historicalRuntimeV116Request(rawRequest)
  const parsedRequest = selectedRequest.success
    ? selectedRequest
    : historicalV116
      ? HistoricalRuntimeExecutionServiceRequestV116Schema.safeParse(rawRequest)
      : selectedRequest
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

  if (
    selectedRequest.success &&
    runtimeConfig.contractSelection.runtimeServiceVersion !==
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_VERSION_V1_16 &&
    !allowSelectedV117NestedMatch
  ) {
    return systemFailureResponse({
      rawRequest: parsedRequest.data,
      code: "UNSUPPORTED_RUNTIME_ADAPTER",
      message:
        "The v1.16 Match envelope is not a selected gameplay service route.",
      retryable: false,
    })
  }

  try {
    return executeParsedRequest(
      parsedRequest.data,
      runtimeConfig,
      {
        ...defaultDependencies,
        ...dependencyOverrides,
      },
      historicalV116,
    )
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

export const executeRuntimeServiceRequest = (
  rawRequest: unknown,
  runtimeConfig: RuntimeServiceConfig,
  dependencyOverrides: Partial<RuntimeExecutionServiceDependencies> = {},
): RuntimeExecutionServiceResponse =>
  executeRuntimeServiceRequestInternal(
    rawRequest,
    runtimeConfig,
    dependencyOverrides,
    false,
  )

/**
 * Test-support seam for the selected service's nested v1.16-shaped Match
 * executor. This is not historical v1.14/v1.16 evidence. The symbol is
 * consumed only by the adjacent `.test-support.ts` module and is never
 * re-exported from a package or production barrel.
 */
export const executeNestedMatchServiceFixtureOnly = (
  rawRequest: unknown,
  runtimeConfig: RuntimeServiceConfig,
  dependencyOverrides: Partial<RuntimeExecutionServiceDependencies> = {},
): RuntimeExecutionServiceResponse =>
  executeRuntimeServiceRequestInternal(
    rawRequest,
    runtimeConfig,
    dependencyOverrides,
    true,
  )

type Sha256IdentityV117 = `sha256:${string}`

export interface PreparedRuntimeServiceExecutionV117 {
  response: RuntimeExecutionServiceResponse
  accounting: {
    budgetProfileSha256: Sha256IdentityV117
    ledgerPrestateRoot: Sha256IdentityV117
    ledgerPoststateRoot: Sha256IdentityV117
  }
}

export interface PreparedRuntimeServiceDependenciesV117 {
  authorityLoader: {
    load(): PreparedMountedRuntimeEvidenceAuthorityV117
  }
  executeCurrentMatchWithAccounting(
    request: RuntimeExecutionServiceRequest,
  ): PreparedRuntimeServiceExecutionV117
}

export interface PreparedRuntimeInvocationAdapterInputV117 {
  readonly request: AuthenticatedRuntimeInvocationRequestV117
  readonly requestBytes: Uint8Array
  readonly executableSource: string
  readonly revision: StrategyRevision
  readonly signingIdentity: RuntimeInvocationSigningIdentityV117
}

export type PreparedRuntimeInvocationAdapterV117 = (
  input: PreparedRuntimeInvocationAdapterInputV117,
) => Uint8Array

export interface PreparedRuntimeServiceFactoryInputV117 {
  readonly runtimeConfig: RuntimeServiceConfig
  readonly authorityLoader: RuntimeEvidenceAuthorityLoaderV117
  readonly currentAuthorityLoader?: RuntimeEvidenceAuthorityLoader | undefined
  readonly signingIdentity?: RuntimeInvocationSigningIdentityV117 | undefined
  readonly candidateInvocationAdapter?:
    | PreparedRuntimeInvocationAdapterV117
    | undefined
}

export interface PreparedRuntimeEvidenceBindingV117 {
  identityManifestRoot: string
  evidenceGraphRoot: string
  exactPins?: readonly RuntimeEvidenceAuthorityExactPinV117[] | undefined
}

export interface PreparedMountedRuntimeEvidenceAuthorityV117 {
  authorityBundleHash: string
  registryGeneration: string
  semanticTupleManifestHash: string
  sourceManifestHash: string
  payload: {
    attestations: readonly {
      attestationId: string
      binding: PreparedRuntimeEvidenceBindingV117
    }[]
    certificates: readonly {
      certificateId: string
      certificateKind: "containment" | "conformance"
      attestationId: string
      binding: PreparedRuntimeEvidenceBindingV117
    }[]
  }
}

const preparedV117Failure = (input: {
  rawRequest: unknown
  code: string
  ownership: "runtime_system" | "system_integrity" | "system_operation"
  retryable: boolean
}): RuntimeExecutionServiceResponseV117 => {
  const root = readRecord(input.rawRequest)
  const requestId = readString(root?.requestId) ?? "runtime-request:unknown"
  const matchId = readString(root?.matchId)
  return RuntimeExecutionServiceResponseV117Schema.parse({
    contractVersion: "runtime-execution-service-v1.17",
    ok: false,
    kind: "systemFailure",
    requestId,
    ...(matchId === undefined ? {} : { matchId }),
    systemFailure: {
      classification: "system_failure",
      ownership: input.ownership,
      code: input.code,
      publicMessage: "Runtime execution failed before completion.",
      retryable: input.retryable,
      playerPenalty: false,
    },
  }) as RuntimeExecutionServiceResponseV117
}

export const failPreparedRuntimeServiceRequestV117 = (input: {
  rawRequest: unknown
  code: string
  ownership: "runtime_system" | "system_integrity" | "system_operation"
  retryable: boolean
}): RuntimeExecutionServiceResponseV117 => preparedV117Failure(input)

const rootsMatch = (
  binding: PreparedRuntimeEvidenceBindingV117,
  expected: RuntimeExecutionEntrantV117,
): boolean =>
  binding.identityManifestRoot === expected.identityManifestRoot &&
  binding.evidenceGraphRoot === expected.evidenceGraphRoot &&
  isDeepStrictEqual(binding.exactPins ?? [], expected.exactPins)

const actualEntrantBindingMatchesV117 = (input: {
  requested: RuntimeExecutionEntrantV117
  revision: StrategyRevision
  deployed: ExecutableLaneIdentity
  template: SuccessorRuntimeIdentityTemplateV117 | undefined
}): boolean => {
  const { requested, revision, deployed, template } = input
  if (
    requested.strategyRevisionId !== revision.id ||
    requested.laneIdentityHash !==
      `sha256:${hashExecutableLaneIdentity(deployed)}` ||
    template === undefined ||
    !isDeepStrictEqual(requested.exactPins, template.exactPins)
  ) {
    return false
  }
  try {
    const composed = composeSuccessorRuntimeIdentityV117({
      revision,
      deployed,
      template,
    })
    return (
      composed !== undefined &&
      isDeepStrictEqual(requested.sourceIdentity, composed.sourceIdentity) &&
      requested.identityManifestRoot ===
        `sha256:${hashRuntimeIdentityManifest(composed.identityManifest)}`
    )
  } catch {
    return false
  }
}

/**
 * Selected current v1.17 full-service path. The injected execution must
 * be the accounting-aware adapter around the actual current Match service;
 * no success can be minted from a caller-provided Chronicle or ledger root.
 */
export const executePreparedRuntimeServiceRequestV117 = (
  rawRequest: unknown,
  runtimeConfig: RuntimeServiceConfig,
  dependencies: PreparedRuntimeServiceDependenciesV117,
): RuntimeExecutionServiceResponseV117 => {
  const parsed = RuntimeExecutionServiceRequestV117Schema.safeParse(rawRequest)
  if (!parsed.success) {
    return preparedV117Failure({
      rawRequest,
      code: "MALFORMED_REQUEST",
      ownership: "system_integrity",
      retryable: false,
    })
  }
  const request = parsed.data
  const nested = RuntimeExecutionServiceRequestSchema.safeParse(request.match)
  if (!nested.success) {
    return preparedV117Failure({
      rawRequest: request,
      code: "MATCH_ENVELOPE_INVALID",
      ownership: "system_integrity",
      retryable: false,
    })
  }
  const nestedRequest = nested.data
  if (
    request.accounting.budgetProfileSha256 !==
      RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256 ||
    request.accounting.ledgerPrestateRoot !==
      RUNTIME_INVOCATION_V1_17_INITIAL_EXECUTION_LEDGER_ROOT
  ) {
    return preparedV117Failure({
      rawRequest: request,
      code: "ACCOUNTING_BINDING_MISMATCH",
      ownership: "system_integrity",
      retryable: false,
    })
  }
  if (
    request.matchId !== nestedRequest.match.matchId ||
    request.compatibilityTupleId !==
      nestedRequest.evidenceSnapshot.compatibility.tupleId ||
    request.legacyAuthority.bundleHash !==
      nestedRequest.evidenceSnapshot.authorityBundleHash ||
    request.legacyAuthority.sourceManifestHash !==
      nestedRequest.evidenceSnapshot.publication.sourceManifestHash ||
    request.legacyAuthority.registryGeneration !==
      nestedRequest.evidenceSnapshot.registryGeneration
  ) {
    return preparedV117Failure({
      rawRequest: request,
      code: "REQUEST_BINDING_MISMATCH",
      ownership: "system_integrity",
      retryable: false,
    })
  }

  let mounted: PreparedMountedRuntimeEvidenceAuthorityV117
  try {
    mounted = dependencies.authorityLoader.load()
  } catch {
    return preparedV117Failure({
      rawRequest: request,
      code: "AUTHORITY_UNAVAILABLE",
      ownership: "system_integrity",
      retryable: true,
    })
  }
  const authorityMatches =
    mounted.authorityBundleHash === request.authority.bundleHash &&
    mounted.sourceManifestHash === request.authority.sourceManifestHash &&
    mounted.registryGeneration === request.authority.registryGeneration &&
    mounted.semanticTupleManifestHash === request.compatibilityTupleId
  const rootsCertified = (["bottom", "top"] as const).every((side) => {
    const entrant = nestedRequest.evidenceSnapshot.entrants[side]
    const revision = nestedRequest.strategies[side]
    const deployed = runtimeConfig.resolveDeploymentLaneIdentity(revision)
    if (
      entrant.strategyRevisionId !== revision.id ||
      deployed === undefined ||
      `sha256:${hashExecutableLaneIdentity(deployed)}` !==
        entrant.laneIdentityHash ||
      !actualEntrantBindingMatchesV117({
        requested: request.entrants[side],
        revision,
        deployed,
        template:
          runtimeConfig.resolveSuccessorRuntimeIdentityTemplate(revision),
      })
    ) {
      return false
    }
    const binding = request.entrants[side]
    const certificate = (
      kind: "containment" | "conformance",
      certificateId: string | undefined,
    ) =>
      certificateId === undefined
        ? undefined
        : mounted.payload.certificates.find(
            (candidate) =>
              candidate.certificateId === certificateId &&
              candidate.certificateKind === kind &&
              rootsMatch(candidate.binding, binding),
          )
    const containment = certificate(
      "containment",
      entrant.containmentCertificateId,
    )
    if (containment === undefined) return false
    const attestation = mounted.payload.attestations.find(
      (candidate) =>
        candidate.attestationId === containment.attestationId &&
        rootsMatch(candidate.binding, binding),
    )
    if (attestation === undefined) return false
    const conformance = certificate(
      "conformance",
      entrant.conformanceCertificateId,
    )
    if (entrant.effectiveStatus === "counted") {
      return (
        conformance !== undefined &&
        conformance.attestationId === attestation.attestationId
      )
    }
    return (
      entrant.effectiveStatus === "exhibition_only" &&
      conformance === undefined &&
      !mounted.payload.certificates.some(
        (candidate) =>
          candidate.certificateKind === "conformance" &&
          candidate.attestationId === attestation.attestationId &&
          rootsMatch(candidate.binding, binding),
      )
    )
  })
  if (!authorityMatches || !rootsCertified) {
    return preparedV117Failure({
      rawRequest: request,
      code: "AUTHORITY_BINDING_MISMATCH",
      ownership: "system_integrity",
      retryable: false,
    })
  }

  let executed: PreparedRuntimeServiceExecutionV117
  try {
    executed = dependencies.executeCurrentMatchWithAccounting(nestedRequest)
  } catch {
    return preparedV117Failure({
      rawRequest: request,
      code: "EXECUTION_EXCEPTION",
      ownership: "runtime_system",
      retryable: true,
    })
  }
  if (!executed.response.ok) {
    return preparedV117Failure({
      rawRequest: request,
      code: "CURRENT_MATCH_EXECUTION_FAILED",
      ownership: "runtime_system",
      retryable: executed.response.systemFailure.retryable,
    })
  }
  if (
    executed.accounting.budgetProfileSha256 !==
      request.accounting.budgetProfileSha256 ||
    executed.accounting.ledgerPrestateRoot !==
      request.accounting.ledgerPrestateRoot
  ) {
    return preparedV117Failure({
      rawRequest: request,
      code: "ACCOUNTING_BINDING_MISMATCH",
      ownership: "system_integrity",
      retryable: false,
    })
  }
  const finalState = executed.response.result.finalState
  const outcome = finalState.outcome
  if (outcome === undefined) {
    return preparedV117Failure({
      rawRequest: request,
      code: "TERMINAL_OUTCOME_MISSING",
      ownership: "system_integrity",
      retryable: false,
    })
  }
  try {
    const chronicle = executed.response.result.chronicle as unknown as JsonValue
    const canonicalFinalState = finalState as unknown as JsonValue
    const canonicalOutcome = outcome as unknown as JsonValue
    const runtimeViolationEventCount =
      executed.response.result.runtimeViolationEventCount
    const semanticReceipt = issueRuntimeSemanticReceiptV117({
      request,
      chronicle,
      finalState: canonicalFinalState,
      outcome: canonicalOutcome,
      ledgerPoststateRoot: executed.accounting.ledgerPoststateRoot,
      reconstructedTerminalStateHash: executed.response.result.semanticReceipt
        .reconstructedTerminalStateHash as Sha256IdentityV117,
      runtimeViolationEventCount,
      secret: runtimeConfig.semanticReceiptSecret,
    })
    return RuntimeExecutionServiceResponseV117Schema.parse({
      contractVersion: "runtime-execution-service-v1.17",
      ok: true,
      kind: "executionResult",
      requestId: request.requestId,
      matchId: request.matchId,
      result: {
        privacy: "internal_runtime_result",
        chronicle,
        finalState: canonicalFinalState,
        outcome: canonicalOutcome,
        ledgerPoststateRoot: executed.accounting.ledgerPoststateRoot,
        runtimeViolationEventCount,
        semanticReceipt,
      },
    }) as RuntimeExecutionServiceResponseV117
  } catch {
    return preparedV117Failure({
      rawRequest: request,
      code: "RESPONSE_SCHEMA_INVALID",
      ownership: "system_integrity",
      retryable: false,
    })
  }
}

type Sha256IdentityV118 = `sha256:${string}`

export interface PreparedRuntimeCertificateAdmissionV118 {
  readonly certificateRecordHash: Sha256IdentityV118
  readonly commonSupervisorEvidenceRoot: Sha256IdentityV118
  readonly sourceIdentity: RuntimeCertificateReferenceV118["sourceIdentity"]
}

export interface PreparedRuntimeServiceExecutionV118 {
  readonly response: RuntimeExecutionServiceResponse
  readonly execution: ChronicleRecorderExecution
  readonly boundaryAnchors: readonly ChronicleBoundaryAnchor[]
  readonly transitionTraceRoot: Sha256IdentityV118
  readonly accounting: {
    readonly budgetProfileRoot: Sha256IdentityV118
    readonly ledgerPrestateRoot: Sha256IdentityV118
    readonly ledgerPoststateRoot: Sha256IdentityV118
  }
  readonly commonSupervisorEvidenceRoots: {
    readonly bottom: Sha256IdentityV118
    readonly top: Sha256IdentityV118
  }
}

export interface PreparedRuntimeServiceDependenciesV118 {
  readonly signer: RuntimeSemanticReceiptSignerV118
  admitCertificateReference(input: {
    readonly side: "bottom" | "top"
    readonly reference: RuntimeCertificateReferenceV118
    readonly nestedRequest: RuntimeExecutionServiceRequest
  }): PreparedRuntimeCertificateAdmissionV118 | undefined
  executeCurrentMatchWithAccounting(
    request: RuntimeExecutionServiceRequest,
  ): PreparedRuntimeServiceExecutionV118
}

const preparedV118Failure = (input: {
  readonly rawRequest: unknown
  readonly code: string
  readonly ownership: "runtime_system" | "system_integrity" | "system_operation"
  readonly retryable: boolean
}): RuntimeExecutionServiceResponseV118 => {
  const root = readRecord(input.rawRequest)
  const requestId = readString(root?.requestId) ?? "runtime-request:unknown"
  const matchId = readString(root?.matchId)
  return RuntimeExecutionServiceResponseV118Schema.parse({
    contractVersion: "runtime-execution-service-v1.18",
    ok: false,
    kind: "systemFailure",
    requestId,
    ...(matchId === undefined ? {} : { matchId }),
    systemFailure: {
      classification: "system_failure",
      ownership: input.ownership,
      code: input.code,
      publicMessage: "Runtime execution failed before completion.",
      retryable: input.retryable,
      playerPenalty: false,
      mutationStatus: "none",
    },
  })
}

const canonicalSha256V118 = (value: JsonValue): Sha256IdentityV118 => {
  const encoded = encodeCanonicalJson(value, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) {
    throw new TypeError("Runtime semantic value is not canonical")
  }
  return `sha256:${createHash("sha256").update(encoded.bytes).digest("hex")}`
}

const sourceIdentityMatchesV118 = (input: {
  readonly side: "bottom" | "top"
  readonly reference: RuntimeCertificateReferenceV118
  readonly nestedRequest: RuntimeExecutionServiceRequest
}): boolean => {
  const revision = input.nestedRequest.strategies[input.side]
  const sourceIdentity = input.reference.sourceIdentity
  const originalBytes = new TextEncoder().encode(revision.source)
  const normalizedBytes = new TextEncoder().encode(
    revision.source.replaceAll("\r\n", "\n").replaceAll("\r", "\n"),
  )
  const artifact =
    revision.metadata.sourceArtifact ?? revision.metadata.compiledArtifact
  const artifactHash =
    artifact === undefined
      ? undefined
      : (`sha256:${artifact.hash.replace(/^sha256:/u, "")}` as const)
  return (
    sourceIdentity.side === input.side &&
    sourceIdentity.strategyRevisionId === revision.id &&
    sourceIdentity.originalSourceSha256 ===
      `sha256:${createHash("sha256").update(originalBytes).digest("hex")}` &&
    sourceIdentity.normalizedSourceSha256 ===
      `sha256:${createHash("sha256").update(normalizedBytes).digest("hex")}` &&
    artifactHash !== undefined &&
    sourceIdentity.artifactSha256 === artifactHash
  )
}

const semanticTupleMatchesV118 = (
  request: RuntimeExecutionServiceRequestV118,
  nestedRequest: RuntimeExecutionServiceRequest,
): boolean =>
  request.semanticTuple.tupleId ===
    nestedRequest.evidenceSnapshot.compatibility.tupleId &&
  isDeepStrictEqual(
    request.semanticTuple.components,
    nestedRequest.evidenceSnapshot.compatibility.tuple,
  )

const terminalV118 = (
  outcome: NonNullable<GameState["outcome"]>,
): { status: string; reason: string } => ({
  status: "complete",
  reason:
    outcome.type === "WIN"
      ? "win"
      : outcome.type === "DRAW"
        ? "draw"
        : "failed",
})

/**
 * Additive v1.18 service admission. The injected execution is private engine
 * material; only exact canonical hashes and the self-verified Ed25519 receipt
 * cross the public response boundary.
 */
export const executePreparedRuntimeServiceRequestV118 = (
  rawRequest: unknown,
  dependencies: PreparedRuntimeServiceDependenciesV118,
): RuntimeExecutionServiceResponseV118 => {
  const parsed = RuntimeExecutionServiceRequestV118Schema.safeParse(rawRequest)
  if (!parsed.success) {
    return preparedV118Failure({
      rawRequest,
      code: "MALFORMED_REQUEST",
      ownership: "system_integrity",
      retryable: false,
    })
  }
  const request = parsed.data
  const nested = RuntimeExecutionServiceRequestSchema.safeParse(request.match)
  if (!nested.success) {
    return preparedV118Failure({
      rawRequest: request,
      code: "MATCH_ENVELOPE_INVALID",
      ownership: "system_integrity",
      retryable: false,
    })
  }
  const nestedRequest = nested.data
  if (
    request.matchId !== nestedRequest.match.matchId ||
    request.authorityGeneration !==
      nestedRequest.evidenceSnapshot.registryGeneration ||
    !semanticTupleMatchesV118(request, nestedRequest)
  ) {
    return preparedV118Failure({
      rawRequest: request,
      code: "REQUEST_BINDING_MISMATCH",
      ownership: "system_integrity",
      retryable: false,
    })
  }
  const certificateAdmissions = {
    bottom: dependencies.admitCertificateReference({
      side: "bottom",
      reference: request.certificateReferences.bottom,
      nestedRequest,
    }),
    top: dependencies.admitCertificateReference({
      side: "top",
      reference: request.certificateReferences.top,
      nestedRequest,
    }),
  }
  if (
    !sourceIdentityMatchesV118({
      side: "bottom",
      reference: request.certificateReferences.bottom,
      nestedRequest,
    }) ||
    !sourceIdentityMatchesV118({
      side: "top",
      reference: request.certificateReferences.top,
      nestedRequest,
    }) ||
    certificateAdmissions.bottom === undefined ||
    certificateAdmissions.top === undefined ||
    certificateAdmissions.bottom.certificateRecordHash !==
      request.certificateReferences.bottom.certificateRecordHash ||
    certificateAdmissions.top.certificateRecordHash !==
      request.certificateReferences.top.certificateRecordHash ||
    !isDeepStrictEqual(
      certificateAdmissions.bottom.sourceIdentity,
      request.certificateReferences.bottom.sourceIdentity,
    ) ||
    !isDeepStrictEqual(
      certificateAdmissions.top.sourceIdentity,
      request.certificateReferences.top.sourceIdentity,
    )
  ) {
    return preparedV118Failure({
      rawRequest: request,
      code: "CERTIFICATE_BINDING_MISMATCH",
      ownership: "system_integrity",
      retryable: false,
    })
  }

  let executed: PreparedRuntimeServiceExecutionV118
  try {
    executed = dependencies.executeCurrentMatchWithAccounting(nestedRequest)
  } catch {
    return preparedV118Failure({
      rawRequest: request,
      code: "EXECUTION_EXCEPTION",
      ownership: "runtime_system",
      retryable: true,
    })
  }
  if (!executed.response.ok) {
    return preparedV118Failure({
      rawRequest: request,
      code: "CURRENT_MATCH_EXECUTION_FAILED",
      ownership: "runtime_system",
      retryable: executed.response.systemFailure.retryable,
    })
  }
  if (
    executed.accounting.budgetProfileRoot !==
      request.accounting.budgetProfileRoot ||
    executed.accounting.ledgerPrestateRoot !==
      request.accounting.ledgerPrestateRoot ||
    executed.commonSupervisorEvidenceRoots.bottom !==
      certificateAdmissions.bottom.commonSupervisorEvidenceRoot ||
    executed.commonSupervisorEvidenceRoots.top !==
      certificateAdmissions.top.commonSupervisorEvidenceRoot
  ) {
    return preparedV118Failure({
      rawRequest: request,
      code: "EVIDENCE_BINDING_MISMATCH",
      ownership: "system_integrity",
      retryable: false,
    })
  }

  const chronicle = executed.response.result.chronicle
  const finalState = executed.response.result.finalState
  const outcome = finalState.outcome
  const semanticEnvelope = {
    profile: "current-exact" as const,
    compatibility: nestedRequest.evidenceSnapshot.compatibility,
    chronicle,
    execution: executed.execution,
    boundaryAnchors: executed.boundaryAnchors,
  }
  const validation = validateCurrentChronicle(semanticEnvelope)
  const reconstruction = validateCurrentReplayReconstruction({
    chronicle,
    execution: executed.execution,
    transitionTraceRoot: executed.transitionTraceRoot,
  })
  const terminalAnchor = executed.boundaryAnchors.at(-1)
  if (
    executed.execution.kind !== "completed" ||
    !validation.ok ||
    !reconstruction.ok ||
    outcome === undefined ||
    terminalAnchor?.kind !== "TERMINAL" ||
    terminalAnchor.stateHash !== reconstruction.terminalStateHash ||
    !isDeepStrictEqual(executed.execution.result.state, finalState) ||
    !isDeepStrictEqual(
      executed.execution.recorderMaterial.finalState,
      finalState,
    ) ||
    !isDeepStrictEqual(reconstruction.outcome, outcome)
  ) {
    return preparedV118Failure({
      rawRequest: request,
      code: "CHRONICLE_INTEGRITY_FAILED",
      ownership: "system_integrity",
      retryable: false,
    })
  }

  try {
    const anchors = {
      chronicleCanonicalHash: canonicalSha256V118(
        chronicle as unknown as JsonValue,
      ),
      transitionTraceRoot: executed.transitionTraceRoot,
      finalStateCanonicalHash: canonicalSha256V118(
        finalState as unknown as JsonValue,
      ),
      outcomeCanonicalHash: canonicalSha256V118(
        outcome as unknown as JsonValue,
      ),
      terminal: terminalV118(outcome),
      accounting: executed.accounting,
    }
    const issued = issueRuntimeSemanticReceiptV118({
      admission: {
        request,
        ...anchors,
      },
      signer: dependencies.signer,
    })
    return RuntimeExecutionServiceResponseV118Schema.parse({
      contractVersion: "runtime-execution-service-v1.18",
      ok: true,
      kind: "executionResult",
      requestId: request.requestId,
      matchId: request.matchId,
      result: {
        privacy: "public_receipt",
        ...anchors,
        resultClass: "success",
        ownership: "gameplay",
        retryable: false,
        mutationStatus: "committed",
        semanticReceipt: issued.receipt,
      },
    })
  } catch {
    return preparedV118Failure({
      rawRequest: request,
      code: "SEMANTIC_RECEIPT_INVALID",
      ownership: "system_integrity",
      retryable: false,
    })
  }
}

const sha256IdentityV117 = (bytes: Uint8Array): Sha256IdentityV117 =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const normalizeSourceV117 = (source: string): string =>
  source.replaceAll("\r\n", "\n").replaceAll("\r", "\n")

const productionInvocationIdentityV117 = (
  runtimeConfig: RuntimeServiceConfig,
): RuntimeInvocationSigningIdentityV117 => ({
  keyId: "runtime-service:v1.17:host",
  secret: `runtime-invocation-v1.17\0${runtimeConfig.semanticReceiptSecret}`,
})

const invocationPublicIdV117 = (
  kind: "request" | "invocation" | "retry" | "kernel-request",
  values: readonly string[],
): string => {
  const digest = createHash("sha256")
    .update(values.join("\0"), "utf8")
    .digest("hex")
  return `${kind}:v1.17:${digest}`
}

const createPreparedTypeScriptRuntimeV117 = (input: {
  request: RuntimeExecutionServiceRequest
  revision: StrategyRevision
  runtimeConfig: RuntimeServiceConfig
  signingIdentity: RuntimeInvocationSigningIdentityV117
  ledger: {
    current: RuntimeAbiV117ExecutionLedger
    sequence: number
  }
  candidateInvocationAdapter?: PreparedRuntimeInvocationAdapterV117 | undefined
}):
  | { ok: true; runtime: CanonicalStrategyRuntime }
  | { ok: false; diagnostics: Record<string, unknown> } => {
  if (input.revision.runtime.language.id !== "typescript") {
    return {
      ok: false,
      diagnostics: { reason: "v1.17-runtime-lane-not-production-capable" },
    }
  }
  const artifact = input.revision.metadata.sourceArtifact
  if (
    artifact?.format !== "transpiled-javascript" ||
    artifact.bytesBase64 === undefined
  ) {
    return {
      ok: false,
      diagnostics: { reason: "v1.17-executable-artifact-missing" },
    }
  }
  let executableSource: string
  try {
    executableSource = new TextDecoder("utf-8", { fatal: true }).decode(
      Buffer.from(artifact.bytesBase64, "base64"),
    )
  } catch {
    return {
      ok: false,
      diagnostics: { reason: "v1.17-executable-artifact-invalid" },
    }
  }
  const originalBytes = new TextEncoder().encode(input.revision.source)
  const normalizedBytes = new TextEncoder().encode(
    normalizeSourceV117(input.revision.source),
  )
  const executableBytes = new TextEncoder().encode(executableSource)
  const sourceIdentity = {
    strategyRevisionId: input.revision.id,
    originalSourceSha256: sha256IdentityV117(originalBytes),
    normalizedSourceSha256: sha256IdentityV117(normalizedBytes),
    artifactSha256: sha256IdentityV117(executableBytes),
  } as const
  const declaredArtifactSourceIdentity = artifact.sourceIdentity
  const expectedArtifactOriginalSourceSha256 = `sha256:${hashCanonicalIdentity("originalSource", [originalBytes])}`
  const expectedArtifactNormalizedSourceSha256 = `sha256:${hashCanonicalIdentity("normalizedSource", [normalizedBytes])}`
  if (
    sourceIdentity.artifactSha256 !== `sha256:${artifact.hash}` ||
    (declaredArtifactSourceIdentity !== undefined &&
      (declaredArtifactSourceIdentity.originalSourceSha256 !==
        expectedArtifactOriginalSourceSha256 ||
        declaredArtifactSourceIdentity.normalizedSourceSha256 !==
          expectedArtifactNormalizedSourceSha256))
  ) {
    return {
      ok: false,
      diagnostics: { reason: "v1.17-source-artifact-identity-mismatch" },
    }
  }

  const invoke = <TOutput>(
    method: "selectActivations" | "soldierBrain",
    value: JsonValue,
    kernelRequest?: { readonly requestId: string } | undefined,
  ) => {
    const sequence = input.ledger.sequence
    input.ledger.sequence += 1
    const identityValues = [
      input.request.match.matchId,
      input.revision.id,
      method,
      String(sequence),
    ]
    const request = createSelectedRuntimeInvocationRequestV117(
      {
        requestId: invocationPublicIdV117("request", identityValues),
        invocationId: invocationPublicIdV117("invocation", identityValues),
        kernelRequestId:
          kernelRequest?.requestId ??
          invocationPublicIdV117("kernel-request", identityValues),
        method,
        semanticTuple: {
          rules: "cowards-rules-v1.4",
          engine: "engine-kernel-v1.37-candidate-1",
          runtimeAbi: "strategy-runtime-abi-v1.17",
          chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
          arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
          setPolicy: "canonical-set-policy-v1.4",
        },
        sourceIdentity,
        budget: createRuntimeInvocationBudgetV117(method),
        accounting: { prestate: input.ledger.current },
        input: { value },
        retry: {
          retryId: invocationPublicIdV117("retry", identityValues),
          attempt: 0,
          previousRequestSha256: null,
        },
      },
      input.signingIdentity,
    )
    const executed = executeCandidateRuntimeInvocationV117<
      TOutput,
      RuntimeInvocationResultV117<TOutput>
    >({
      request,
      identity: input.signingIdentity,
      invoke: (requestBytes) => {
        if (input.candidateInvocationAdapter !== undefined) {
          return input.candidateInvocationAdapter({
            request,
            requestBytes,
            executableSource,
            revision: input.revision,
            signingIdentity: input.signingIdentity,
          })
        }
        const adapter = input.runtimeConfig
          .adapter as typeof input.runtimeConfig.adapter & {
          executeV117?:
            | ((adapterInput: {
                requestBytes: Uint8Array
                executableSource: string
                signingIdentity: RuntimeInvocationSigningIdentityV117
              }) => Uint8Array)
            | undefined
        }
        if (adapter.executeV117 === undefined) {
          throw new Error("v1.17 runtime adapter is unavailable")
        }
        return adapter.executeV117({
          requestBytes,
          executableSource,
          signingIdentity: input.signingIdentity,
        })
      },
      executeOutcome: (outcome) => outcome,
    })
    let outcome = executed.internalExecution
    const accounting = executed.authenticatedAccounting
    const accountingValid =
      outcome.kind === "system_failure"
        ? accounting === undefined || accounting.disposition === "no_commit"
        : accounting?.disposition === "commit"
    if (!accountingValid) {
      outcome = {
        kind: "system_failure",
        failure: {
          code: "AMBIGUOUS_ATTRIBUTION",
          publicMessage: "Runtime system failure.",
          retryable: false,
        },
        trace: candidateRequestTrace(request, "AMBIGUOUS_ATTRIBUTION"),
      }
    } else if (accounting?.disposition === "commit") {
      input.ledger.current = accounting.poststate
    }
    return {
      kind: "v1_17_bound" as const,
      request: executed.admittedRequest,
      outcome,
    }
  }

  const runtime: CanonicalStrategyRuntime = {
    selectActivations: (value, kernelRequest) =>
      invoke<StrategyResult>(
        "selectActivations",
        value as unknown as JsonValue,
        kernelRequest,
      ),
    runSoldierBrain: (value, kernelRequest) =>
      invoke<SoldierBrainResult>(
        "soldierBrain",
        value as unknown as JsonValue,
        kernelRequest,
      ),
  }
  return { ok: true, runtime }
}

/**
 * Production dependency authority for the selected v1.17 service route. The
 * Match owns one fresh ledger; HTTP callers can neither provide nor reset it.
 */
export const createPreparedRuntimeServiceDependenciesV117 = (
  input: PreparedRuntimeServiceFactoryInputV117,
): PreparedRuntimeServiceDependenciesV117 => ({
  authorityLoader: input.authorityLoader,
  executeCurrentMatchWithAccounting: (request) => {
    const ledger = {
      current: createRuntimeAbiV117ExecutionLedger(),
      sequence: 0,
    }
    const response = executeRuntimeServiceRequestInternal(
      request,
      input.runtimeConfig,
      {
        authorityLoader: input.currentAuthorityLoader,
        createCanonicalRuntimeForRevision: (revision) =>
          createPreparedTypeScriptRuntimeV117({
            request,
            revision,
            runtimeConfig: input.runtimeConfig,
            signingIdentity:
              input.signingIdentity ??
              productionInvocationIdentityV117(input.runtimeConfig),
            ledger,
            candidateInvocationAdapter: input.candidateInvocationAdapter,
          }),
      },
      true,
    )
    return {
      response,
      accounting: {
        budgetProfileSha256: RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256,
        ledgerPrestateRoot:
          RUNTIME_INVOCATION_V1_17_INITIAL_EXECUTION_LEDGER_ROOT,
        ledgerPoststateRoot: runtimeInvocationExecutionLedgerPoststateRootV117(
          ledger.current,
        ),
      },
    }
  },
})
