import { Buffer } from "node:buffer"
import { createHash, verify as verifySignature } from "node:crypto"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import { isCanonicalSafeRegistryGenerationV117 } from "./runtime-evidence-v1-17.js"
import type { JsonValue } from "./types.js"

export const RUNTIME_CONFORMANCE_LANGUAGES_V1_17 = Object.freeze([
  "typescript",
  "python",
  "rust",
  "zig",
] as const)

export type RuntimeConformanceLanguageIdV117 =
  (typeof RUNTIME_CONFORMANCE_LANGUAGES_V1_17)[number]

export interface RuntimeConformanceIdentityBindingsV117 {
  languageId: RuntimeConformanceLanguageIdV117
  laneId: string
  corpusRootSha256: string
  caseInventorySha256: string
  fixtureSourceSha256: string
  artifactSha256: string
  adapterBuildSha256: string
  runtimeExecutableSha256: string
  toolchainSha256: string
  sysrootStdlibSha256: string
  runtimeAbiVersion: string
  canonicalJsonProfileId: string
  budgetPolicySha256: string
  containmentPolicySha256: string
  semanticTupleSha256: string
  identityManifestRoot: string
  evidenceGraphRoot: string
  behaviorSettingsSha256: string
}

export interface RuntimeConformanceRunV117 {
  runId: string
  workspaceId: string
  processId: string
  status: "passed" | "system_failure"
  complete: boolean
  freshWorkspace: boolean
  freshProcess: boolean
  skippedCaseCount: number
  unsupportedCaseCount: number
  fallbackUsed: boolean
  syntheticEvidence: boolean
  caseCount: number
  startedAt: string
  completedAt: string
  validUntil: string
  identity: RuntimeConformanceIdentityBindingsV117
  resultRootSha256: string
  evidenceRootSha256: string
}

export interface RuntimeConformanceCertificatePayloadV117 {
  schemaVersion: "runtime-conformance-certificate-v1.17"
  certificateId: string
  certificateVersion: "runtime-conformance-certificate-v1.17"
  producerId: string
  producerKeyId: string
  trustDomain: "production" | "fixture"
  managedIdentity: true
  registryGeneration: string
  issuedAt: string
  requestedValidUntil: string
  freshUntil: string
  identity: RuntimeConformanceIdentityBindingsV117
  runs: RuntimeConformanceRunV117[]
}

export interface RuntimeConformanceCertificateV117 extends RuntimeConformanceCertificatePayloadV117 {
  signatureBase64: string
}

export interface RuntimeConformanceTrustedProducerV117 {
  producerId: string
  keyId: string
  trustDomain: "production" | "fixture"
  managedIdentity: true
  publicKeyPem: string
}

export interface RuntimeConformanceVerifiedSnapshotV117 {
  schemaVersion: "runtime-conformance-certificate-v1.17"
  certificateId: string
  certificateSha256: string
  certificateVersion: "runtime-conformance-certificate-v1.17"
  producerId: string
  producerKeyId: string
  trustDomain: "production" | "fixture"
  registryGeneration: string
  issuedAt: string
  freshUntil: string
  identity: RuntimeConformanceIdentityBindingsV117
  runIds: string[]
  resultRootSha256: string
  evidenceRootSha256: string
}

export interface VerifyRuntimeConformanceCertificateInputV117 {
  mode: "production" | "fixture"
  certificate: RuntimeConformanceCertificateV117
  currentIdentity: RuntimeConformanceIdentityBindingsV117
  expectedRunBinding: RuntimeConformanceExpectedRunBindingV117
  verificationInstant: string
  trustedProducers?: readonly RuntimeConformanceTrustedProducerV117[]
}

export interface RuntimeConformanceExpectedRunBindingV117 {
  caseInventorySha256: string
  requiredCaseCount: number
  resultRootSha256: string
}

export interface RuntimeConformanceFreshnessDecisionV117 {
  status: "current" | "stale"
  reasonCode: "CURRENT" | "IDENTITY_CHANGED" | "NOT_YET_VALID" | "EXPIRED"
  freshUntil: string
}

export interface RuntimeConformanceFourLaneClosureV117 {
  schemaVersion: "runtime-conformance-four-lane-closure-v1.17"
  languageIds: RuntimeConformanceLanguageIdV117[]
  certificateIds: string[]
  freshUntil: string
  corpusRootSha256: string
  caseInventorySha256: string
  runtimeAbiVersion: string
  canonicalJsonProfileId: string
  budgetPolicySha256: string
  containmentPolicySha256: string
  semanticTupleSha256: string
}

export class RuntimeConformanceCertificateV117Error extends Error {
  constructor(readonly code: string) {
    super(`Runtime conformance certificate rejected: ${code}.`)
    this.name = "RuntimeConformanceCertificateV117Error"
  }
}

const fail = (code: string): never => {
  throw new RuntimeConformanceCertificateV117Error(code)
}

/** Production stays empty until later Phase-259 plans install reviewed producer trust. */
export const RUNTIME_CONFORMANCE_TRUSTED_PRODUCERS_V1_17: readonly RuntimeConformanceTrustedProducerV117[] =
  Object.freeze([])

const CERTIFICATE_DOMAIN =
  "cowards-game:runtime-conformance-certificate:v1.17" as const
const MAX_VALIDITY_MILLISECONDS = 30 * 24 * 60 * 60 * 1_000
const SHA256 = /^sha256:[0-9a-f]{64}$/u
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/u
const FLOATING =
  /(?:^|[-_.:])(latest|current|default|any|stable|head)(?:$|[-_.:])|[*^~<>]/iu
const textEncoder = new TextEncoder()

const payloadKeys = [
  "schemaVersion",
  "certificateId",
  "certificateVersion",
  "producerId",
  "producerKeyId",
  "trustDomain",
  "managedIdentity",
  "registryGeneration",
  "issuedAt",
  "requestedValidUntil",
  "freshUntil",
  "identity",
  "runs",
] as const

const certificateKeys = [...payloadKeys, "signatureBase64"] as const

const identityKeys = [
  "languageId",
  "laneId",
  "corpusRootSha256",
  "caseInventorySha256",
  "fixtureSourceSha256",
  "artifactSha256",
  "adapterBuildSha256",
  "runtimeExecutableSha256",
  "toolchainSha256",
  "sysrootStdlibSha256",
  "runtimeAbiVersion",
  "canonicalJsonProfileId",
  "budgetPolicySha256",
  "containmentPolicySha256",
  "semanticTupleSha256",
  "identityManifestRoot",
  "evidenceGraphRoot",
  "behaviorSettingsSha256",
] as const

const identityHashKeys = [
  "corpusRootSha256",
  "caseInventorySha256",
  "fixtureSourceSha256",
  "artifactSha256",
  "adapterBuildSha256",
  "runtimeExecutableSha256",
  "toolchainSha256",
  "sysrootStdlibSha256",
  "budgetPolicySha256",
  "containmentPolicySha256",
  "semanticTupleSha256",
  "identityManifestRoot",
  "evidenceGraphRoot",
  "behaviorSettingsSha256",
] as const

const runKeys = [
  "runId",
  "workspaceId",
  "processId",
  "status",
  "complete",
  "freshWorkspace",
  "freshProcess",
  "skippedCaseCount",
  "unsupportedCaseCount",
  "fallbackUsed",
  "syntheticEvidence",
  "caseCount",
  "startedAt",
  "completedAt",
  "validUntil",
  "identity",
  "resultRootSha256",
  "evidenceRootSha256",
] as const

const expectedRunBindingKeys = [
  "caseInventorySha256",
  "requiredCaseCount",
  "resultRootSha256",
] as const

const exactKeys = (
  value: unknown,
  expected: readonly string[],
  code = "STRICT_SHAPE",
): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return fail(code)
  }
  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  if (
    keys.length !== expected.length ||
    expected.some((key) => !Object.hasOwn(record, key))
  ) {
    fail(code)
  }
  return record
}

const requireIdentifier = (value: unknown, code = "IDENTIFIER"): string => {
  if (
    typeof value !== "string" ||
    !IDENTIFIER.test(value) ||
    textEncoder.encode(value).byteLength > 512
  ) {
    return fail(code)
  }
  return value
}

const requireExactIdentifier = (
  value: unknown,
  code = "IDENTIFIER",
): string => {
  const identifier = requireIdentifier(value, code)
  if (FLOATING.test(identifier)) fail(code)
  return identifier
}

const requireHash = (value: unknown, code = "IDENTITY"): string => {
  if (typeof value !== "string" || !SHA256.test(value)) return fail(code)
  return value
}

const requireSafeInteger = (
  value: unknown,
  minimum: number,
  code: string,
): number => {
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    return fail(code)
  }
  return value as number
}

const requireInstant = (value: unknown, code = "VALIDITY"): number => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)
  ) {
    return fail(code)
  }
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    return fail(code)
  }
  return parsed
}

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (encoded.ok === false) return fail("CANONICAL_JSON")
  return encoded.bytes
}

const u64be = (value: number): Uint8Array => {
  const output = new Uint8Array(8)
  new DataView(output.buffer).setBigUint64(0, BigInt(value), false)
  return output
}

const frame = (domain: string, value: Uint8Array): Uint8Array => {
  const domainBytes = textEncoder.encode(domain)
  const output = new Uint8Array(16 + domainBytes.byteLength + value.byteLength)
  output.set(u64be(domainBytes.byteLength), 0)
  output.set(domainBytes, 8)
  const valueOffset = 8 + domainBytes.byteLength
  output.set(u64be(value.byteLength), valueOffset)
  output.set(value, valueOffset + 8)
  return output
}

const payloadValue = (
  payload: RuntimeConformanceCertificatePayloadV117,
): RuntimeConformanceCertificatePayloadV117 => ({
  schemaVersion: payload.schemaVersion,
  certificateId: payload.certificateId,
  certificateVersion: payload.certificateVersion,
  producerId: payload.producerId,
  producerKeyId: payload.producerKeyId,
  trustDomain: payload.trustDomain,
  managedIdentity: payload.managedIdentity,
  registryGeneration: payload.registryGeneration,
  issuedAt: payload.issuedAt,
  requestedValidUntil: payload.requestedValidUntil,
  freshUntil: payload.freshUntil,
  identity: payload.identity,
  runs: payload.runs,
})

export const encodeRuntimeConformanceCertificatePayloadV117 = (
  payload: RuntimeConformanceCertificatePayloadV117,
): Uint8Array =>
  frame(
    CERTIFICATE_DOMAIN,
    canonicalBytes(payloadValue(payload) as unknown as JsonValue),
  )

const parseIdentity = (
  value: unknown,
): Readonly<RuntimeConformanceIdentityBindingsV117> => {
  const identity = exactKeys(value, identityKeys, "IDENTITY")
  const languageId = identity.languageId
  if (
    typeof languageId !== "string" ||
    !RUNTIME_CONFORMANCE_LANGUAGES_V1_17.includes(
      languageId as RuntimeConformanceLanguageIdV117,
    )
  ) {
    return fail("IDENTITY")
  }
  const parsed: RuntimeConformanceIdentityBindingsV117 = {
    languageId: languageId as RuntimeConformanceLanguageIdV117,
    laneId: requireExactIdentifier(identity.laneId, "IDENTITY"),
    corpusRootSha256: "",
    caseInventorySha256: "",
    fixtureSourceSha256: "",
    artifactSha256: "",
    adapterBuildSha256: "",
    runtimeExecutableSha256: "",
    toolchainSha256: "",
    sysrootStdlibSha256: "",
    runtimeAbiVersion: requireExactIdentifier(
      identity.runtimeAbiVersion,
      "IDENTITY",
    ),
    canonicalJsonProfileId: requireExactIdentifier(
      identity.canonicalJsonProfileId,
      "IDENTITY",
    ),
    budgetPolicySha256: "",
    containmentPolicySha256: "",
    semanticTupleSha256: "",
    identityManifestRoot: "",
    evidenceGraphRoot: "",
    behaviorSettingsSha256: "",
  }
  for (const key of identityHashKeys) {
    parsed[key] = requireHash(identity[key], "IDENTITY")
  }
  return deepFreeze(parsed)
}

const sameIdentity = (
  left: RuntimeConformanceIdentityBindingsV117,
  right: RuntimeConformanceIdentityBindingsV117,
): boolean => identityKeys.every((key) => left[key] === right[key])

const parseExpectedRunBinding = (
  value: unknown,
): Readonly<RuntimeConformanceExpectedRunBindingV117> => {
  const binding = exactKeys(
    value,
    expectedRunBindingKeys,
    "RUN_CASE_INVENTORY_MISMATCH",
  )
  return Object.freeze({
    caseInventorySha256: requireHash(
      binding.caseInventorySha256,
      "RUN_CASE_INVENTORY_MISMATCH",
    ),
    requiredCaseCount: requireSafeInteger(
      binding.requiredCaseCount,
      1,
      "RUN_CASE_INVENTORY_MISMATCH",
    ),
    resultRootSha256: requireHash(
      binding.resultRootSha256,
      "RUN_RESULT_ROOT_MISMATCH",
    ),
  })
}

const parseRuns = (
  value: unknown,
  identity: RuntimeConformanceIdentityBindingsV117,
  expectedRunBinding: RuntimeConformanceExpectedRunBindingV117,
  issuedAt: number,
): {
  runs: RuntimeConformanceRunV117[]
  minimumValidUntil: number
  minimumExecutionFreshUntil: number
  resultRootSha256: string
  evidenceRootSha256: string
} => {
  if (!Array.isArray(value) || value.length !== 3) return fail("RUN_COUNT")
  const runIds = new Set<string>()
  const workspaceIds = new Set<string>()
  const processIds = new Set<string>()
  const parsed: RuntimeConformanceRunV117[] = []
  let previousRunId = ""
  let minimumValidUntil = Number.POSITIVE_INFINITY
  let minimumExecutionFreshUntil = Number.POSITIVE_INFINITY
  let expectedResultRoot: string | undefined
  let expectedEvidenceRoot: string | undefined
  let expectedCaseCount: number | undefined
  for (const candidate of value) {
    const run = exactKeys(candidate, runKeys, "RUN_SHAPE")
    const runId = requireIdentifier(run.runId, "RUN_ID")
    const workspaceId = requireIdentifier(run.workspaceId, "RUN_ID")
    const processId = requireIdentifier(run.processId, "RUN_ID")
    if (
      runIds.has(runId) ||
      workspaceIds.has(workspaceId) ||
      processIds.has(processId) ||
      runId <= previousRunId
    ) {
      fail("RUN_INDEPENDENCE")
    }
    previousRunId = runId
    runIds.add(runId)
    workspaceIds.add(workspaceId)
    processIds.add(processId)
    const runIdentity = exactKeys(
      run.identity,
      identityKeys,
      "RUN_IDENTITY_MISMATCH",
    )
    if (identityKeys.some((key) => runIdentity[key] !== identity[key])) {
      fail("RUN_IDENTITY_MISMATCH")
    }
    if (run.status !== "passed") fail("RUN_SYSTEM_FAILURE")
    if (
      run.complete !== true ||
      run.freshWorkspace !== true ||
      run.freshProcess !== true ||
      run.fallbackUsed !== false ||
      run.syntheticEvidence !== false ||
      requireSafeInteger(run.skippedCaseCount, 0, "RUN_INCOMPLETE") !== 0 ||
      requireSafeInteger(run.unsupportedCaseCount, 0, "RUN_INCOMPLETE") !== 0 ||
      requireSafeInteger(run.caseCount, 1, "RUN_INCOMPLETE") < 1
    ) {
      fail("RUN_INCOMPLETE")
    }
    const caseCount = run.caseCount as number
    expectedCaseCount ??= caseCount
    if (caseCount !== expectedCaseCount) fail("RUN_CASE_COUNT_MISMATCH")
    if (caseCount !== expectedRunBinding.requiredCaseCount) {
      fail("RUN_CASE_INVENTORY_MISMATCH")
    }
    const startedAt = requireInstant(run.startedAt, "RUN_VALIDITY")
    const completedAt = requireInstant(run.completedAt, "RUN_VALIDITY")
    const validUntil = requireInstant(run.validUntil, "RUN_VALIDITY")
    if (
      startedAt > completedAt ||
      completedAt > issuedAt ||
      completedAt > validUntil
    ) {
      fail("RUN_VALIDITY")
    }
    const executionFreshUntil = completedAt + MAX_VALIDITY_MILLISECONDS
    if (issuedAt > executionFreshUntil) {
      fail("RUN_STALE_AT_ISSUANCE")
    }
    minimumValidUntil = Math.min(minimumValidUntil, validUntil)
    minimumExecutionFreshUntil = Math.min(
      minimumExecutionFreshUntil,
      executionFreshUntil,
    )
    const resultRootSha256 = requireHash(
      run.resultRootSha256,
      "RUN_ROOT_MISMATCH",
    )
    const evidenceRootSha256 = requireHash(
      run.evidenceRootSha256,
      "RUN_ROOT_MISMATCH",
    )
    expectedResultRoot ??= resultRootSha256
    expectedEvidenceRoot ??= evidenceRootSha256
    if (
      resultRootSha256 !== expectedResultRoot ||
      evidenceRootSha256 !== expectedEvidenceRoot
    ) {
      fail("RUN_ROOT_MISMATCH")
    }
    if (resultRootSha256 !== expectedRunBinding.resultRootSha256) {
      fail("RUN_RESULT_ROOT_MISMATCH")
    }
    parsed.push({
      runId,
      workspaceId,
      processId,
      status: "passed",
      complete: true,
      freshWorkspace: true,
      freshProcess: true,
      skippedCaseCount: 0,
      unsupportedCaseCount: 0,
      fallbackUsed: false,
      syntheticEvidence: false,
      caseCount,
      startedAt: run.startedAt as string,
      completedAt: run.completedAt as string,
      validUntil: run.validUntil as string,
      identity,
      resultRootSha256,
      evidenceRootSha256,
    })
  }
  return {
    runs: deepFreeze(parsed),
    minimumValidUntil,
    minimumExecutionFreshUntil,
    resultRootSha256: expectedResultRoot!,
    evidenceRootSha256: expectedEvidenceRoot!,
  }
}

const verifiedSnapshots = new WeakSet<object>()

export const verifyRuntimeConformanceCertificateV117 = (
  input: VerifyRuntimeConformanceCertificateInputV117,
): Readonly<RuntimeConformanceVerifiedSnapshotV117> => {
  const certificate = input.certificate
  exactKeys(certificate, certificateKeys)
  if (
    certificate.schemaVersion !== "runtime-conformance-certificate-v1.17" ||
    certificate.certificateVersion !==
      "runtime-conformance-certificate-v1.17" ||
    certificate.managedIdentity !== true ||
    certificate.trustDomain !== input.mode ||
    !isCanonicalSafeRegistryGenerationV117(certificate.registryGeneration)
  ) {
    fail("CERTIFICATE")
  }
  requireIdentifier(certificate.certificateId, "CERTIFICATE")
  requireIdentifier(certificate.producerId, "CERTIFICATE")
  requireIdentifier(certificate.producerKeyId, "CERTIFICATE")
  const issuedAt = requireInstant(certificate.issuedAt)
  const requestedValidUntil = requireInstant(certificate.requestedValidUntil)
  const signedFreshUntil = requireInstant(certificate.freshUntil)
  if (issuedAt >= requestedValidUntil) fail("VALIDITY")
  const identity = parseIdentity(certificate.identity)
  const currentIdentity = parseIdentity(input.currentIdentity)
  const expectedRunBinding = parseExpectedRunBinding(input.expectedRunBinding)
  if (
    expectedRunBinding.caseInventorySha256 !==
      currentIdentity.caseInventorySha256 ||
    expectedRunBinding.caseInventorySha256 !== identity.caseInventorySha256
  ) {
    fail("RUN_CASE_INVENTORY_MISMATCH")
  }
  const runEvidence = parseRuns(
    certificate.runs,
    identity,
    expectedRunBinding,
    issuedAt,
  )
  const computedFreshUntil = Math.min(
    requestedValidUntil,
    issuedAt + MAX_VALIDITY_MILLISECONDS,
    runEvidence.minimumValidUntil,
    runEvidence.minimumExecutionFreshUntil,
  )
  if (signedFreshUntil !== computedFreshUntil || signedFreshUntil < issuedAt) {
    fail("FRESHNESS")
  }
  const instant = requireInstant(input.verificationInstant)
  if (instant < issuedAt || instant > signedFreshUntil) fail("FRESHNESS")
  if (!sameIdentity(identity, currentIdentity)) {
    fail("CURRENT_BINDING_MISMATCH")
  }

  const producers =
    input.mode === "production"
      ? RUNTIME_CONFORMANCE_TRUSTED_PRODUCERS_V1_17
      : (input.trustedProducers ?? [])
  const producer = producers.find(
    (candidate) =>
      candidate.producerId === certificate.producerId &&
      candidate.keyId === certificate.producerKeyId &&
      candidate.trustDomain === certificate.trustDomain &&
      candidate.managedIdentity === true,
  )
  if (producer === undefined) return fail("UNTRUSTED_PRODUCER")

  let signatureValid = false
  try {
    const signature = Buffer.from(certificate.signatureBase64, "base64")
    if (
      signature.byteLength !== 64 ||
      signature.toString("base64") !== certificate.signatureBase64
    ) {
      fail("SIGNATURE")
    }
    signatureValid = verifySignature(
      null,
      encodeRuntimeConformanceCertificatePayloadV117(certificate),
      producer.publicKeyPem,
      signature,
    )
  } catch {
    fail("SIGNATURE")
  }
  if (!signatureValid) fail("SIGNATURE")

  const snapshot = deepFreeze<RuntimeConformanceVerifiedSnapshotV117>({
    schemaVersion: "runtime-conformance-certificate-v1.17",
    certificateId: certificate.certificateId,
    certificateSha256: `sha256:${createHash("sha256")
      .update(canonicalBytes(certificate as unknown as JsonValue))
      .digest("hex")}`,
    certificateVersion: "runtime-conformance-certificate-v1.17",
    producerId: certificate.producerId,
    producerKeyId: certificate.producerKeyId,
    trustDomain: certificate.trustDomain,
    registryGeneration: certificate.registryGeneration,
    issuedAt: certificate.issuedAt,
    freshUntil: certificate.freshUntil,
    identity: globalThis.structuredClone(identity),
    runIds: runEvidence.runs.map(({ runId }) => runId),
    resultRootSha256: runEvidence.resultRootSha256,
    evidenceRootSha256: runEvidence.evidenceRootSha256,
  })
  verifiedSnapshots.add(snapshot)
  return snapshot
}

export const evaluateRuntimeConformanceFreshnessV117 = (input: {
  certificate: Readonly<RuntimeConformanceVerifiedSnapshotV117>
  currentIdentity: RuntimeConformanceIdentityBindingsV117
  verificationInstant: string
}): Readonly<RuntimeConformanceFreshnessDecisionV117> => {
  if (!verifiedSnapshots.has(input.certificate as object)) {
    return fail("UNVERIFIED_SNAPSHOT")
  }
  const currentIdentity = parseIdentity(input.currentIdentity)
  if (!sameIdentity(input.certificate.identity, currentIdentity)) {
    return Object.freeze({
      status: "stale",
      reasonCode: "IDENTITY_CHANGED",
      freshUntil: input.certificate.freshUntil,
    })
  }
  const instant = requireInstant(input.verificationInstant)
  if (instant < requireInstant(input.certificate.issuedAt)) {
    return Object.freeze({
      status: "stale",
      reasonCode: "NOT_YET_VALID",
      freshUntil: input.certificate.freshUntil,
    })
  }
  if (instant > requireInstant(input.certificate.freshUntil)) {
    return Object.freeze({
      status: "stale",
      reasonCode: "EXPIRED",
      freshUntil: input.certificate.freshUntil,
    })
  }
  return Object.freeze({
    status: "current",
    reasonCode: "CURRENT",
    freshUntil: input.certificate.freshUntil,
  })
}

const commonCriteria = (identity: RuntimeConformanceIdentityBindingsV117) => ({
  corpusRootSha256: identity.corpusRootSha256,
  caseInventorySha256: identity.caseInventorySha256,
  runtimeAbiVersion: identity.runtimeAbiVersion,
  canonicalJsonProfileId: identity.canonicalJsonProfileId,
  budgetPolicySha256: identity.budgetPolicySha256,
  containmentPolicySha256: identity.containmentPolicySha256,
  semanticTupleSha256: identity.semanticTupleSha256,
})

export const requireAllFourConformanceLanesV117 = (input: {
  certificates: readonly Readonly<RuntimeConformanceVerifiedSnapshotV117>[]
  currentIdentities: readonly RuntimeConformanceIdentityBindingsV117[]
  verificationInstant: string
}): Readonly<RuntimeConformanceFourLaneClosureV117> => {
  if (input.certificates.length !== 4 || input.currentIdentities.length !== 4) {
    return fail("ALL_FOUR_REQUIRED")
  }
  const certificates = new Map<
    RuntimeConformanceLanguageIdV117,
    Readonly<RuntimeConformanceVerifiedSnapshotV117>
  >()
  for (const certificate of input.certificates) {
    if (!verifiedSnapshots.has(certificate as object)) {
      return fail("UNVERIFIED_SNAPSHOT")
    }
    if (certificates.has(certificate.identity.languageId)) {
      return fail("ALL_FOUR_REQUIRED")
    }
    certificates.set(certificate.identity.languageId, certificate)
  }
  const currentIdentities = new Map<
    RuntimeConformanceLanguageIdV117,
    RuntimeConformanceIdentityBindingsV117
  >()
  for (const candidate of input.currentIdentities) {
    const identity = parseIdentity(candidate)
    if (currentIdentities.has(identity.languageId)) {
      return fail("ALL_FOUR_REQUIRED")
    }
    currentIdentities.set(identity.languageId, identity)
  }
  if (
    RUNTIME_CONFORMANCE_LANGUAGES_V1_17.some(
      (languageId) =>
        !certificates.has(languageId) || !currentIdentities.has(languageId),
    )
  ) {
    return fail("ALL_FOUR_REQUIRED")
  }
  const ordered = RUNTIME_CONFORMANCE_LANGUAGES_V1_17.map((languageId) => {
    const certificate = certificates.get(languageId)!
    const currentIdentity = currentIdentities.get(languageId)!
    const freshness = evaluateRuntimeConformanceFreshnessV117({
      certificate,
      currentIdentity,
      verificationInstant: input.verificationInstant,
    })
    if (freshness.status !== "current") fail("LANE_STALE")
    return certificate
  })
  const common = commonCriteria(ordered[0]!.identity)
  if (
    ordered
      .slice(1)
      .some(
        (certificate) =>
          JSON.stringify(commonCriteria(certificate.identity)) !==
          JSON.stringify(common),
      )
  ) {
    fail("COMMON_CRITERIA_MISMATCH")
  }
  const freshUntil = new Date(
    Math.min(
      ...ordered.map((certificate) => requireInstant(certificate.freshUntil)),
    ),
  ).toISOString()
  return deepFreeze({
    schemaVersion: "runtime-conformance-four-lane-closure-v1.17",
    languageIds: [...RUNTIME_CONFORMANCE_LANGUAGES_V1_17],
    certificateIds: ordered.map(({ certificateId }) => certificateId),
    freshUntil,
    ...common,
  })
}
