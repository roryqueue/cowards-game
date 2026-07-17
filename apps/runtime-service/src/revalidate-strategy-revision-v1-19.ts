import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
  encodeCanonicalJson,
  type JsonValue,
} from "@cowards/spec"
import {
  admitCandidateObservationTransportV119,
  type AdmittedCandidateObservationV119,
  type CandidateObservationTransportRequestV119,
  type CandidateObservationTransportResultV119,
} from "@cowards/runtime-js"
import { dispatchRuntimeObservationV119 } from "./execute-match.js"

type Sha256 = `sha256:${string}`
type LanguageId = "typescript" | "python" | "rust" | "zig"
type CandidateObservationMethodV119 =
  CandidateObservationTransportRequestV119["method"]

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const SOURCE_SHA256 = /^[0-9a-f]{64}$/u
const PUBLIC_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u

export const REQUIRED_REVISION_REVALIDATION_PROBES_V1_19 = Object.freeze([
  "select-initial-false-round-false",
  "select-initial-false-round-true",
  "select-initial-true-round-false",
  "select-initial-true-round-true",
  "brain-advanced-false",
  "brain-advanced-true",
] as const)

export type RevisionRevalidationProbeIdV119 =
  (typeof REQUIRED_REVISION_REVALIDATION_PROBES_V1_19)[number]

export interface RevisionRevalidationCandidatePinsV119 {
  readonly candidateStatus: "inactive-candidate"
  readonly current: false
  readonly pinSource: "explicit-candidate-pins"
  readonly resolvedFromCurrentRegistry: false
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly semanticRuntimeVersion: "runtime-v1.19"
  readonly semanticTupleId: string
  readonly corpusVersion: "v3"
  readonly corpusRootSha256: Sha256
  readonly corpusPinSha256: Sha256
  readonly traceVersion: "v4"
  readonly traceRootSha256: Sha256
  readonly tracePinSha256: Sha256
  readonly workshopVersion: "v1.19"
  readonly workshopRootSha256: Sha256
  readonly workshopPinSha256: Sha256
  readonly certificateVersion: "runtime-conformance-certificate-v1.19"
  readonly certificateId: string
  readonly certificateSha256: Sha256
  readonly certificateStatus: "reviewed-inactive-candidate"
  readonly certificateLanguageId: LanguageId
  readonly certificateProviderId: string
  readonly certificateLaneId: string
  readonly runtimeIdentityRoot: Sha256
  readonly toolchainIdentityRoot: Sha256
  readonly adapterIdentityRoot: Sha256
  readonly containmentEvidenceRoot: Sha256
}

export interface ImmutableStrategyRevisionRevalidationInputV119 {
  readonly strategyRevisionId: string
  readonly lockedAt: string
  /** Restricted original bytes. They never appear in the returned result. */
  readonly sourceBytes: Uint8Array
  /** Historical persistence spelling intentionally omits the sha256 prefix. */
  readonly sourceHash: string
  /** Restricted exact provider artifact bytes. */
  readonly artifactBytes: Uint8Array
  readonly artifactSha256: Sha256
  readonly languageId: LanguageId
  readonly providerId: string
  readonly laneId: string
}

export interface RevisionRevalidationProbeV119 {
  readonly probeId: RevisionRevalidationProbeIdV119
  readonly request: CandidateObservationTransportRequestV119
}

export interface RealProviderRevalidationEvidenceV119 {
  readonly schemaVersion: "runtime-provider-revalidation-evidence-v1.19"
  readonly executionKind: "real_service_execution"
  readonly syntheticEvidence: false
  readonly strategyRevisionId: string
  readonly sourceHash: string
  readonly artifactSha256: Sha256
  readonly languageId: LanguageId
  readonly providerId: string
  readonly laneId: string
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly semanticRuntimeVersion: "runtime-v1.19"
  readonly semanticTupleId: string
  readonly candidatePinsRoot: Sha256
  readonly probeId: RevisionRevalidationProbeIdV119
  readonly method: CandidateObservationMethodV119
  readonly inputSha256: Sha256
  readonly guestStarted: true
  readonly guestCompleted: true
  readonly resultRoot: Sha256
  readonly evidenceRoot: Sha256
}

export interface RealProviderRevalidationSuccessV119 {
  readonly output: JsonValue
  readonly evidence: RealProviderRevalidationEvidenceV119
}

export interface RealProviderRevalidationExecutionInputV119 {
  readonly revision: ImmutableStrategyRevisionRevalidationInputV119
  readonly pins: RevisionRevalidationCandidatePinsV119
  readonly candidatePinsRoot: Sha256
  readonly probeId: RevisionRevalidationProbeIdV119
  readonly inputSha256: Sha256
  readonly observation: AdmittedCandidateObservationV119 & {
    readonly method: CandidateObservationMethodV119
  }
}

export type RealProviderRevalidationExecutionV119 = (
  input: RealProviderRevalidationExecutionInputV119,
) => CandidateObservationTransportResultV119<RealProviderRevalidationSuccessV119>

export interface RevalidateStrategyRevisionV119Input {
  readonly revision: ImmutableStrategyRevisionRevalidationInputV119
  readonly pins: RevisionRevalidationCandidatePinsV119
  readonly probes: readonly RevisionRevalidationProbeV119[]
  /** Trusted runtime-service dependency which owns the hostile provider lane. */
  readonly executeProvider: RealProviderRevalidationExecutionV119
}

export interface StrategyRevisionRevalidationReceiptV119 {
  readonly schemaVersion: "runtime-semantic-receipt-v1.19"
  readonly outcome: "success"
  readonly admissible: true
  readonly executionKind: "real_service_execution"
  readonly syntheticEvidence: false
  readonly strategyRevisionId: string
  readonly sourceHash: string
  readonly sourceBytes: number
  readonly artifactSha256: Sha256
  readonly artifactBytes: number
  readonly languageId: LanguageId
  readonly providerId: string
  readonly laneId: string
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly semanticRuntimeVersion: "runtime-v1.19"
  readonly semanticTupleId: string
  readonly corpusVersion: "v3"
  readonly corpusRootSha256: Sha256
  readonly corpusPinSha256: Sha256
  readonly traceVersion: "v4"
  readonly traceRootSha256: Sha256
  readonly tracePinSha256: Sha256
  readonly workshopVersion: "v1.19"
  readonly workshopRootSha256: Sha256
  readonly workshopPinSha256: Sha256
  readonly certificateVersion: "runtime-conformance-certificate-v1.19"
  readonly certificateId: string
  readonly certificateSha256: Sha256
  readonly certificateLanguageId: LanguageId
  readonly certificateProviderId: string
  readonly certificateLaneId: string
  readonly runtimeIdentityRoot: Sha256
  readonly toolchainIdentityRoot: Sha256
  readonly adapterIdentityRoot: Sha256
  readonly containmentEvidenceRoot: Sha256
  readonly candidatePinsRoot: Sha256
  readonly probeCount: 6
  readonly probeIds: readonly RevisionRevalidationProbeIdV119[]
  readonly executionRequestRoot: Sha256
  readonly executionResultRoot: Sha256
  readonly executionEvidenceRoot: Sha256
  readonly executionReceiptRoot: Sha256
}

export type StrategyRevisionRevalidationResultV119 =
  | Readonly<{
      kind: "success"
      receipt: Readonly<StrategyRevisionRevalidationReceiptV119>
    }>
  | Readonly<{
      kind: "player_violation"
      strategyRevisionId: string
      violation: Readonly<{ code: string; publicMessage: string }>
    }>
  | Readonly<{
      kind: "system_failure"
      strategyRevisionId: string
      failure: Readonly<{
        code:
          | "REVALIDATION_REJECTED"
          | "REVALIDATION_EVIDENCE_MISMATCH"
          | "PROVIDER_SYSTEM_FAILURE"
        publicMessage: "Runtime system failure."
        retryable: boolean
      }>
    }>

const providerAuthority = Object.freeze({
  typescript: Object.freeze({
    providerId: "strategy-language-provider-js-ts",
    laneId: "lane:typescript:v1.19",
  }),
  python: Object.freeze({
    providerId: "strategy-language-provider-python",
    laneId: "lane:python:v1.19",
  }),
  rust: Object.freeze({
    providerId: "strategy-language-provider-rust-wasi",
    laneId: "lane:rust:v1.19",
  }),
  zig: Object.freeze({
    providerId: "strategy-language-provider-zig-wasi",
    laneId: "lane:zig:v1.19",
  }),
} as const)

const sha256 = (value: Uint8Array | string): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonicalHash = (domain: string, value: JsonValue): Sha256 => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) {
    throw new TypeError("Revision revalidation evidence is not canonical JSON")
  }
  return sha256(
    Buffer.concat([
      Buffer.from(`cowards-game:${domain}:v1.19\0`, "utf8"),
      Buffer.from(encoded.bytes),
    ]),
  )
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const systemFailure = (
  strategyRevisionId: string,
  code:
    | "REVALIDATION_REJECTED"
    | "REVALIDATION_EVIDENCE_MISMATCH"
    | "PROVIDER_SYSTEM_FAILURE",
  retryable = false,
): StrategyRevisionRevalidationResultV119 => ({
  kind: "system_failure",
  strategyRevisionId,
  failure: {
    code,
    publicMessage: "Runtime system failure.",
    retryable,
  },
})

const exactKeys = (value: unknown, keys: readonly string[]): boolean =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key))

const PIN_KEYS = Object.freeze([
  "candidateStatus",
  "current",
  "pinSource",
  "resolvedFromCurrentRegistry",
  "runtimeAbiVersion",
  "semanticRuntimeVersion",
  "semanticTupleId",
  "corpusVersion",
  "corpusRootSha256",
  "corpusPinSha256",
  "traceVersion",
  "traceRootSha256",
  "tracePinSha256",
  "workshopVersion",
  "workshopRootSha256",
  "workshopPinSha256",
  "certificateVersion",
  "certificateId",
  "certificateSha256",
  "certificateStatus",
  "certificateLanguageId",
  "certificateProviderId",
  "certificateLaneId",
  "runtimeIdentityRoot",
  "toolchainIdentityRoot",
  "adapterIdentityRoot",
  "containmentEvidenceRoot",
] as const)

const validPins = (
  pins: RevisionRevalidationCandidatePinsV119,
  revision: ImmutableStrategyRevisionRevalidationInputV119,
): boolean =>
  exactKeys(pins, PIN_KEYS) &&
  pins.candidateStatus === "inactive-candidate" &&
  pins.current === false &&
  pins.pinSource === "explicit-candidate-pins" &&
  pins.resolvedFromCurrentRegistry === false &&
  pins.runtimeAbiVersion === "strategy-runtime-abi-v1.19" &&
  pins.semanticRuntimeVersion === "runtime-v1.19" &&
  pins.semanticTupleId === CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID &&
  pins.corpusVersion === "v3" &&
  pins.traceVersion === "v4" &&
  pins.workshopVersion === "v1.19" &&
  pins.certificateVersion === "runtime-conformance-certificate-v1.19" &&
  PUBLIC_ID.test(pins.certificateId) &&
  pins.certificateStatus === "reviewed-inactive-candidate" &&
  pins.certificateLanguageId === revision.languageId &&
  pins.certificateProviderId === revision.providerId &&
  pins.certificateLaneId === revision.laneId &&
  [
    pins.corpusRootSha256,
    pins.corpusPinSha256,
    pins.traceRootSha256,
    pins.tracePinSha256,
    pins.workshopRootSha256,
    pins.workshopPinSha256,
    pins.certificateSha256,
    pins.runtimeIdentityRoot,
    pins.toolchainIdentityRoot,
    pins.adapterIdentityRoot,
    pins.containmentEvidenceRoot,
  ].every((value) => SHA256.test(value))

const validIsoInstant = (value: string): boolean => {
  const parsed = new Date(value)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value
}

const validRevision = (
  revision: ImmutableStrategyRevisionRevalidationInputV119,
): boolean => {
  const authority = providerAuthority[revision.languageId]
  return (
    authority !== undefined &&
    PUBLIC_ID.test(revision.strategyRevisionId) &&
    validIsoInstant(revision.lockedAt) &&
    revision.sourceBytes instanceof Uint8Array &&
    revision.sourceBytes.byteLength > 0 &&
    SOURCE_SHA256.test(revision.sourceHash) &&
    revision.sourceHash === sha256(revision.sourceBytes).slice(7) &&
    revision.artifactBytes instanceof Uint8Array &&
    revision.artifactBytes.byteLength > 0 &&
    SHA256.test(revision.artifactSha256) &&
    revision.artifactSha256 === sha256(revision.artifactBytes) &&
    revision.providerId === authority.providerId &&
    revision.laneId === authority.laneId
  )
}

const validProbeSemantics = (
  probeId: RevisionRevalidationProbeIdV119,
  admitted: AdmittedCandidateObservationV119,
): boolean => {
  if (probeId.startsWith("select-")) {
    if (!("hasInitialInitiative" in admitted.input)) return false
    const expectedInitial = probeId.includes("initial-true")
    const expectedRound = probeId.includes("round-true")
    return (
      admitted.input.hasInitialInitiative === expectedInitial &&
      admitted.input.hasRoundInitiative === expectedRound
    )
  }
  if (!("hasAdvancedThisActivation" in admitted.input)) return false
  return (
    admitted.input.hasAdvancedThisActivation ===
    (probeId === "brain-advanced-true")
  )
}

const validProbeInventory = (
  probes: readonly RevisionRevalidationProbeV119[],
): boolean =>
  probes.length === REQUIRED_REVISION_REVALIDATION_PROBES_V1_19.length &&
  probes.every(
    (probe, index) =>
      probe.probeId === REQUIRED_REVISION_REVALIDATION_PROBES_V1_19[index] &&
      probe.request.semanticTupleId ===
        CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID &&
      (probe.probeId.startsWith("select-")
        ? probe.request.method === "selectActivations"
        : probe.request.method === "soldierBrain"),
  )

const executionEvidenceMatches = (
  evidence: RealProviderRevalidationEvidenceV119,
  expected: RealProviderRevalidationExecutionInputV119,
): boolean =>
  evidence.schemaVersion ===
    "runtime-provider-revalidation-evidence-v1.19" &&
  evidence.executionKind === "real_service_execution" &&
  evidence.syntheticEvidence === false &&
  evidence.strategyRevisionId === expected.revision.strategyRevisionId &&
  evidence.sourceHash === expected.revision.sourceHash &&
  evidence.artifactSha256 === expected.revision.artifactSha256 &&
  evidence.languageId === expected.revision.languageId &&
  evidence.providerId === expected.revision.providerId &&
  evidence.laneId === expected.revision.laneId &&
  evidence.runtimeAbiVersion === expected.pins.runtimeAbiVersion &&
  evidence.semanticRuntimeVersion === expected.pins.semanticRuntimeVersion &&
  evidence.semanticTupleId === expected.pins.semanticTupleId &&
  evidence.candidatePinsRoot === expected.candidatePinsRoot &&
  evidence.probeId === expected.probeId &&
  evidence.method === expected.observation.method &&
  evidence.inputSha256 === expected.inputSha256 &&
  evidence.guestStarted === true &&
  evidence.guestCompleted === true &&
  SHA256.test(evidence.resultRoot) &&
  SHA256.test(evidence.evidenceRoot)

const providerRevisionCopy = (
  revision: ImmutableStrategyRevisionRevalidationInputV119,
): ImmutableStrategyRevisionRevalidationInputV119 => ({
  strategyRevisionId: revision.strategyRevisionId,
  lockedAt: revision.lockedAt,
  sourceBytes: Uint8Array.from(revision.sourceBytes),
  sourceHash: revision.sourceHash,
  artifactBytes: Uint8Array.from(revision.artifactBytes),
  artifactSha256: revision.artifactSha256,
  languageId: revision.languageId,
  providerId: revision.providerId,
  laneId: revision.laneId,
})

const revalidateExactStrategyRevisionV119 = (
  input: RevalidateStrategyRevisionV119Input,
): StrategyRevisionRevalidationResultV119 => {
  const revisionId =
    typeof input.revision?.strategyRevisionId === "string" &&
    PUBLIC_ID.test(input.revision.strategyRevisionId)
      ? input.revision.strategyRevisionId
      : "revision:unknown"
  if (
    !validRevision(input.revision) ||
    !validPins(input.pins, input.revision) ||
    !validProbeInventory(input.probes) ||
    typeof input.executeProvider !== "function"
  ) {
    return systemFailure(revisionId, "REVALIDATION_REJECTED")
  }

  const pinsJson = { ...input.pins } as unknown as JsonValue
  const candidatePinsRoot = canonicalHash(
    "revision-revalidation-candidate-pins",
    pinsJson,
  )
  const executionRequestRoot = canonicalHash(
    "revision-revalidation-request",
    {
      strategyRevisionId: input.revision.strategyRevisionId,
      sourceHash: input.revision.sourceHash,
      sourceBytes: input.revision.sourceBytes.byteLength,
      artifactSha256: input.revision.artifactSha256,
      artifactBytes: input.revision.artifactBytes.byteLength,
      languageId: input.revision.languageId,
      providerId: input.revision.providerId,
      laneId: input.revision.laneId,
      candidatePinsRoot,
      probes: input.probes.map(({ probeId, request }) => ({
        probeId,
        method: request.method,
        kernelRequestId: request.kernelRequestId,
        inputSha256: request.inputSha256,
      })),
    },
  )

  const results: Array<{
    probeId: RevisionRevalidationProbeIdV119
    resultRoot: Sha256
    evidenceRoot: Sha256
  }> = []

  for (const probe of input.probes) {
    const admitted = admitCandidateObservationTransportV119(probe.request)
    if (
      admitted.kind !== "success" ||
      !validProbeSemantics(probe.probeId, admitted.value)
    ) {
      return systemFailure(revisionId, "REVALIDATION_REJECTED")
    }
    const providerInput: RealProviderRevalidationExecutionInputV119 = {
      revision: providerRevisionCopy(input.revision),
      pins: { ...input.pins },
      candidatePinsRoot,
      probeId: probe.probeId,
      inputSha256: probe.request.inputSha256,
      observation: {
        ...admitted.value,
        method: probe.request.method,
      },
    }
    const providerResult = dispatchRuntimeObservationV119({
      candidateRequest: probe.request,
      executeCurrent: () => {
        throw new Error("Revision revalidation cannot execute a current lane")
      },
      executeCandidate: () => input.executeProvider(providerInput),
    })
    if (providerResult.kind === "player_violation") {
      if (
        providerResult.violation === null ||
        typeof providerResult.violation !== "object" ||
        typeof providerResult.violation.code !== "string"
      ) {
        return systemFailure(
          revisionId,
          "REVALIDATION_EVIDENCE_MISMATCH",
        )
      }
      const code = /^[A-Z][A-Z0-9_]{0,63}$/u.test(providerResult.violation.code)
        ? providerResult.violation.code
        : "PLAYER_VIOLATION"
      return {
        kind: "player_violation",
        strategyRevisionId: revisionId,
        violation: {
          code,
          publicMessage:
            "Strategy revision did not pass candidate revalidation.",
        },
      }
    }
    if (providerResult.kind === "system_failure") {
      if (
        providerResult.failure === null ||
        typeof providerResult.failure !== "object" ||
        typeof providerResult.failure.retryable !== "boolean"
      ) {
        return systemFailure(
          revisionId,
          "REVALIDATION_EVIDENCE_MISMATCH",
        )
      }
      return systemFailure(
        revisionId,
        "PROVIDER_SYSTEM_FAILURE",
        providerResult.failure.retryable,
      )
    }
    if (!executionEvidenceMatches(providerResult.value.evidence, providerInput)) {
      return systemFailure(revisionId, "REVALIDATION_EVIDENCE_MISMATCH")
    }
    results.push({
      probeId: probe.probeId,
      resultRoot: providerResult.value.evidence.resultRoot,
      evidenceRoot: providerResult.value.evidence.evidenceRoot,
    })
  }

  const executionResultRoot = canonicalHash(
    "revision-revalidation-results",
    results.map(({ probeId, resultRoot }) => ({ probeId, resultRoot })),
  )
  const executionEvidenceRoot = canonicalHash(
    "revision-revalidation-evidence",
    results.map(({ probeId, evidenceRoot }) => ({ probeId, evidenceRoot })),
  )
  const receiptPayload = {
    schemaVersion: "runtime-semantic-receipt-v1.19" as const,
    outcome: "success" as const,
    admissible: true as const,
    executionKind: "real_service_execution" as const,
    syntheticEvidence: false as const,
    strategyRevisionId: input.revision.strategyRevisionId,
    sourceHash: input.revision.sourceHash,
    sourceBytes: input.revision.sourceBytes.byteLength,
    artifactSha256: input.revision.artifactSha256,
    artifactBytes: input.revision.artifactBytes.byteLength,
    languageId: input.revision.languageId,
    providerId: input.revision.providerId,
    laneId: input.revision.laneId,
    runtimeAbiVersion: input.pins.runtimeAbiVersion,
    semanticRuntimeVersion: input.pins.semanticRuntimeVersion,
    semanticTupleId: input.pins.semanticTupleId,
    corpusVersion: input.pins.corpusVersion,
    corpusRootSha256: input.pins.corpusRootSha256,
    corpusPinSha256: input.pins.corpusPinSha256,
    traceVersion: input.pins.traceVersion,
    traceRootSha256: input.pins.traceRootSha256,
    tracePinSha256: input.pins.tracePinSha256,
    workshopVersion: input.pins.workshopVersion,
    workshopRootSha256: input.pins.workshopRootSha256,
    workshopPinSha256: input.pins.workshopPinSha256,
    certificateVersion: input.pins.certificateVersion,
    certificateId: input.pins.certificateId,
    certificateSha256: input.pins.certificateSha256,
    certificateLanguageId: input.pins.certificateLanguageId,
    certificateProviderId: input.pins.certificateProviderId,
    certificateLaneId: input.pins.certificateLaneId,
    runtimeIdentityRoot: input.pins.runtimeIdentityRoot,
    toolchainIdentityRoot: input.pins.toolchainIdentityRoot,
    adapterIdentityRoot: input.pins.adapterIdentityRoot,
    containmentEvidenceRoot: input.pins.containmentEvidenceRoot,
    candidatePinsRoot,
    probeCount: 6 as const,
    probeIds: [...REQUIRED_REVISION_REVALIDATION_PROBES_V1_19],
    executionRequestRoot,
    executionResultRoot,
    executionEvidenceRoot,
  }
  const receipt: StrategyRevisionRevalidationReceiptV119 = {
    ...receiptPayload,
    executionReceiptRoot: canonicalHash(
      "revision-revalidation-receipt",
      receiptPayload,
    ),
  }
  return deepFreeze({ kind: "success", receipt })
}

/**
 * Fail-closed public service boundary. Provider output is hostile even though
 * the provider executor itself is a runtime-service-owned dependency.
 */
export const revalidateStrategyRevisionV119 = (
  input: RevalidateStrategyRevisionV119Input,
): StrategyRevisionRevalidationResultV119 => {
  let revisionId = "revision:unknown"
  try {
    const candidate = (input as unknown as { revision?: unknown })?.revision
    if (candidate !== null && typeof candidate === "object") {
      const id = (candidate as { strategyRevisionId?: unknown })
        .strategyRevisionId
      if (typeof id === "string" && PUBLIC_ID.test(id)) {
        revisionId = id
      }
    }
    return revalidateExactStrategyRevisionV119(input)
  } catch {
    return systemFailure(
      revisionId,
      "REVALIDATION_EVIDENCE_MISMATCH",
      false,
    )
  }
}
