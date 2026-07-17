import { Buffer } from "node:buffer"
import { createHash, verify as verifySignature } from "node:crypto"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import {
  RUNTIME_CONFORMANCE_LANGUAGES_V1_17,
  type RuntimeConformanceIdentityBindingsV117,
  type RuntimeConformanceLanguageIdV117,
} from "./runtime-conformance-certificate-v1-17.js"
import type { JsonValue } from "./types.js"

export const RUNTIME_CONFORMANCE_V119_REVIEWED_PAYLOAD_SHA256 = Object.freeze({
  typescript:
    "sha256:a57e12d3dab77b907f66b52b2aaf2832ac49c7ce80cf67ba7a907aa23f62eb27",
  python:
    "sha256:a0f36923245d0c35e0a5a70c48769541fba77c29b5eb7249a29dc291e718a136",
  rust: "sha256:4825ac137eb0be575b3df3d608d6deecbdb2a7529225992af9cf580c8f78ad62",
  zig: "sha256:8559683ae8013bec24d84ad3efe8bfbd99374dfe054621322540f44bc2a93d3c",
} as const)

export const RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY = deepFreeze({
  schemaVersion: "v1.37-observation-v1.19-candidate-bindings-v1",
  corpus: {
    version: "v3",
    rootSha256:
      "sha256:06d0717a16047cace0364c94a15353e2d53b53da5e8bebef6912f9f30f3d681d",
    fileSha256:
      "sha256:ec92ba7506907e65a032083a2c68005022c7ad8d8873a9ddbc59338db2d8d5d0",
    pinFileSha256:
      "sha256:bd40526e92122be0e7b00e0c57fdc21f14374e19c18ff90c927215c1e2bcc9c6",
    current: false,
  },
  trace: {
    version: "v1.37-observation-trace-v4",
    rootSha256:
      "sha256:f9821fd2b3a5a3cb17a01b4a8050ea70c2274df04601f314a25adac6da4f428a",
    bundleRootSha256:
      "sha256:11fee531edf255b80c2c9780b13c9daf9598581f3218fe5d4d38e38b879a04bd",
    pinFileSha256:
      "sha256:6dd4cd7cf9bdf2de46a3517062a5eac8f15301e87723fc39c98226a400a1d059",
    current: false,
  },
  workshop: {
    version: "workshop-contract-v1.19",
    rootSha256:
      "sha256:b455b4e44ccae14cb724c6d3e8f41e3fb8dfcdb36976d35058f859dcfc7a385d",
    observationSemanticsSha256:
      "sha256:9848ba17da56661e0192373c2e655fb0d7c0644815a4c377a2f427249389790c",
    pinFileSha256:
      "sha256:2ad1c0be0b79beb67308fe1c089c8223d93ed4f33130dbf9c7b88fb4dffca57b",
    current: false,
  },
  semanticTuple: {
    runtimeAbiVersion: "strategy-runtime-abi-v1.19",
    arenaCatalogVersion: "canonical-arena-catalog-v1.37",
    setPolicyVersion: "canonical-set-policy-v1.37-four-condition-v1",
    tupleId:
      "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
    tupleSha256:
      "37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
    current: false,
  },
} as const)

type DeepMutable<T> = T extends readonly (infer U)[]
  ? DeepMutable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
    : T

export type RuntimeConformanceCandidateBindingsV119 = DeepMutable<
  typeof RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY
>

export interface RuntimeConformanceRunV119 {
  schemaVersion: "v1.37-observation-v1.19-fresh-language-run-v1"
  languageId: RuntimeConformanceLanguageIdV117
  runId: string
  workspaceId: string
  processId: string
  status: "passed"
  complete: true
  freshWorkspace: true
  freshProcess: true
  skippedCaseCount: number
  unsupportedCaseCount: number
  fallbackUsed: boolean
  syntheticEvidence: boolean
  caseCount: number
  caseInventorySha256: string
  startedAt: string
  completedAt: string
  validUntil: string
  identity: RuntimeConformanceIdentityBindingsV117
  resultRootSha256: string
  evidenceRootSha256: string
  candidateBindings: RuntimeConformanceCandidateBindingsV119
}

export interface RuntimeConformanceCertificatePayloadV119 {
  schemaVersion: "runtime-conformance-certificate-candidate-v1.19"
  certificateVersion: "runtime-conformance-certificate-v1.19"
  certificateId: string
  producerId: string
  producerKeyId: string
  registryGeneration: string
  issuedAt: string
  requestedValidUntil: string
  freshUntil: string
  status: "inactive-candidate"
  identity: RuntimeConformanceIdentityBindingsV117
  candidateBindings: RuntimeConformanceCandidateBindingsV119
  runs: RuntimeConformanceRunV119[]
}

export interface RuntimeConformanceCertificateV119 {
  schemaVersion: "runtime-conformance-certificate-envelope-v1.19"
  trustDomain: "production" | "fixture"
  managedIdentity: true
  candidatePayload: RuntimeConformanceCertificatePayloadV119
  candidatePayloadSha256: string
  signatureBase64: string
}

export interface RuntimeConformanceTrustedProducerV119 {
  producerId: string
  keyId: string
  trustDomain: "production" | "fixture"
  managedIdentity: true
  publicKeyPem: string
}

export interface RuntimeConformanceExpectedRunBindingV119 {
  caseInventorySha256: string
  requiredCaseCount: number
  resultRootSha256: string
  evidenceRootSha256: string
}

export interface RuntimeConformanceVerifiedSnapshotV119 {
  schemaVersion: "runtime-conformance-certificate-verified-v1.19"
  certificateId: string
  certificateSha256: string
  certificateVersion: "runtime-conformance-certificate-v1.19"
  candidatePayloadSha256: string
  producerId: string
  producerKeyId: string
  trustDomain: "production" | "fixture"
  registryGeneration: string
  issuedAt: string
  freshUntil: string
  status: "inactive"
  languageId: RuntimeConformanceLanguageIdV117
  identity: RuntimeConformanceIdentityBindingsV117
  candidateBindings: RuntimeConformanceCandidateBindingsV119
  runIds: string[]
  runCount: 3
  resultRootSha256: string
  evidenceRootSha256: string
}

export interface VerifyRuntimeConformanceCertificateInputV119 {
  mode: "production" | "fixture"
  certificate: RuntimeConformanceCertificateV119
  expectedIdentity: RuntimeConformanceIdentityBindingsV117
  expectedRunBinding: RuntimeConformanceExpectedRunBindingV119
  verificationInstant: string
  trustedProducers: readonly RuntimeConformanceTrustedProducerV119[]
}

export class RuntimeConformanceCertificateV119Error extends Error {
  constructor(readonly code: string) {
    super(`Runtime conformance certificate v1.19 rejected: ${code}.`)
    this.name = "RuntimeConformanceCertificateV119Error"
  }
}

const fail = (code: string): never => {
  throw new RuntimeConformanceCertificateV119Error(code)
}

const CERTIFICATE_DOMAIN =
  "cowards-game:runtime-conformance-certificate:v1.19" as const
const SHA256 = /^sha256:[0-9a-f]{64}$/u
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/u
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u

const certificateKeys = [
  "schemaVersion",
  "trustDomain",
  "managedIdentity",
  "candidatePayload",
  "candidatePayloadSha256",
  "signatureBase64",
] as const
const payloadKeys = [
  "schemaVersion",
  "certificateVersion",
  "certificateId",
  "producerId",
  "producerKeyId",
  "registryGeneration",
  "issuedAt",
  "requestedValidUntil",
  "freshUntil",
  "status",
  "identity",
  "candidateBindings",
  "runs",
] as const
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
const identityHashKeys = identityKeys.filter(
  (key) => key.endsWith("Sha256") || key.endsWith("Root"),
)
const runKeys = [
  "schemaVersion",
  "languageId",
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
  "caseInventorySha256",
  "startedAt",
  "completedAt",
  "validUntil",
  "identity",
  "resultRootSha256",
  "evidenceRootSha256",
  "candidateBindings",
] as const

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const exactKeys = (
  value: unknown,
  keys: readonly string[],
  code: string,
): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return fail(code)
  const record = value as Record<string, unknown>
  if (
    Object.keys(record).length !== keys.length ||
    keys.some((key) => !Object.hasOwn(record, key))
  )
    fail(code)
  return record
}

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) return fail("CANONICAL_JSON")
  return encoded.bytes
}

const canonicalSha256 = (value: JsonValue): string =>
  `sha256:${createHash("sha256").update(canonicalBytes(value)).digest("hex")}`

const sameCanonical = (left: unknown, right: unknown): boolean =>
  canonicalSha256(left as JsonValue) === canonicalSha256(right as JsonValue)

const requireInstant = (value: unknown, code = "FRESHNESS"): number => {
  if (typeof value !== "string" || !INSTANT.test(value)) return fail(code)
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value)
    return fail(code)
  return parsed
}

const requireIdentifier = (value: unknown, code: string): string => {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) return fail(code)
  return value
}

const parseIdentity = (
  value: unknown,
): RuntimeConformanceIdentityBindingsV117 => {
  const identity = exactKeys(value, identityKeys, "IDENTITY")
  if (
    typeof identity.languageId !== "string" ||
    !RUNTIME_CONFORMANCE_LANGUAGES_V1_17.includes(
      identity.languageId as RuntimeConformanceLanguageIdV117,
    )
  )
    return fail("IDENTITY")
  requireIdentifier(identity.laneId, "IDENTITY")
  requireIdentifier(identity.runtimeAbiVersion, "IDENTITY")
  requireIdentifier(identity.canonicalJsonProfileId, "IDENTITY")
  for (const key of identityHashKeys) {
    if (typeof identity[key] !== "string" || !SHA256.test(identity[key]))
      fail("IDENTITY")
  }
  return globalThis.structuredClone(
    identity as unknown as RuntimeConformanceIdentityBindingsV117,
  )
}

const u64be = (value: number): Uint8Array => {
  const output = new Uint8Array(8)
  new DataView(output.buffer).setBigUint64(0, BigInt(value), false)
  return output
}

const frame = (domain: string, value: Uint8Array): Uint8Array => {
  const encoder = new TextEncoder()
  const domainBytes = encoder.encode(domain)
  const output = new Uint8Array(16 + domainBytes.length + value.length)
  output.set(u64be(domainBytes.length), 0)
  output.set(domainBytes, 8)
  const valueOffset = 8 + domainBytes.length
  output.set(u64be(value.length), valueOffset)
  output.set(value, valueOffset + 8)
  return output
}

export const encodeRuntimeConformanceCertificatePayloadV119 = (
  payload: RuntimeConformanceCertificatePayloadV119,
): Uint8Array =>
  frame(CERTIFICATE_DOMAIN, canonicalBytes(payload as unknown as JsonValue))

export const verifyRuntimeConformanceCertificateV119 = (
  input: VerifyRuntimeConformanceCertificateInputV119,
): Readonly<RuntimeConformanceVerifiedSnapshotV119> => {
  const certificate = globalThis.structuredClone(input.certificate)
  exactKeys(certificate, certificateKeys, "STRICT_SHAPE")
  if (
    certificate.schemaVersion !==
      "runtime-conformance-certificate-envelope-v1.19" ||
    certificate.trustDomain !== input.mode ||
    certificate.managedIdentity !== true
  )
    fail("CERTIFICATE")

  const payload = certificate.candidatePayload
  exactKeys(payload, payloadKeys, "PAYLOAD_SHAPE")
  if (
    payload.schemaVersion !==
      "runtime-conformance-certificate-candidate-v1.19" ||
    payload.certificateVersion !== "runtime-conformance-certificate-v1.19" ||
    payload.status !== "inactive-candidate" ||
    payload.registryGeneration !== "candidate-0"
  )
    fail("CERTIFICATE")
  requireIdentifier(payload.certificateId, "CERTIFICATE")
  requireIdentifier(payload.producerId, "CERTIFICATE")
  requireIdentifier(payload.producerKeyId, "CERTIFICATE")

  if (
    !sameCanonical(
      payload.candidateBindings,
      RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY,
    )
  )
    fail("CANDIDATE_AUTHORITY_MISMATCH")

  const identity = parseIdentity(payload.identity)
  const expectedIdentity = parseIdentity(input.expectedIdentity)
  if (
    identity.runtimeAbiVersion !== "strategy-runtime-abi-v1.19" ||
    identity.corpusRootSha256 !==
      RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.corpus.rootSha256 ||
    identity.semanticTupleSha256 !==
      RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.semanticTuple.tupleId
  )
    fail("CANDIDATE_AUTHORITY_MISMATCH")
  if (!sameCanonical(identity, expectedIdentity)) fail("IDENTITY_MISMATCH")

  const expected = input.expectedRunBinding
  if (
    typeof expected.requiredCaseCount !== "number" ||
    !Number.isSafeInteger(expected.requiredCaseCount) ||
    expected.requiredCaseCount !== 30 ||
    !SHA256.test(expected.caseInventorySha256) ||
    !SHA256.test(expected.resultRootSha256) ||
    !SHA256.test(expected.evidenceRootSha256) ||
    expected.caseInventorySha256 !== identity.caseInventorySha256
  )
    fail("RUN_BINDING_MISMATCH")

  const issuedAt = requireInstant(payload.issuedAt)
  const requestedValidUntil = requireInstant(payload.requestedValidUntil)
  const freshUntil = requireInstant(payload.freshUntil)
  const verificationInstant = requireInstant(input.verificationInstant)
  if (
    requestedValidUntil < freshUntil ||
    issuedAt > freshUntil ||
    verificationInstant < issuedAt ||
    verificationInstant > freshUntil
  )
    fail("FRESHNESS")

  if (!Array.isArray(payload.runs) || payload.runs.length !== 3)
    fail("RUN_COUNT")
  const runIds = new Set<string>()
  const workspaceIds = new Set<string>()
  const processIds = new Set<string>()
  let previousRunId = ""
  for (const value of payload.runs) {
    const run = exactKeys(value, runKeys, "RUN_SHAPE")
    if (
      run.languageId !== identity.languageId ||
      !sameCanonical(run.candidateBindings, payload.candidateBindings) ||
      !sameCanonical(run.identity, identity)
    )
      fail("RUN_IDENTITY_MISMATCH")
    if (
      run.schemaVersion !== "v1.37-observation-v1.19-fresh-language-run-v1" ||
      run.status !== "passed" ||
      run.complete !== true ||
      run.freshWorkspace !== true ||
      run.freshProcess !== true ||
      run.skippedCaseCount !== 0 ||
      run.unsupportedCaseCount !== 0 ||
      run.fallbackUsed !== false ||
      run.syntheticEvidence !== false ||
      run.caseCount !== expected.requiredCaseCount ||
      run.caseInventorySha256 !== expected.caseInventorySha256 ||
      run.resultRootSha256 !== expected.resultRootSha256 ||
      run.evidenceRootSha256 !== expected.evidenceRootSha256
    )
      fail("RUN_INCOMPLETE")
    const runId = requireIdentifier(run.runId, "RUN_INDEPENDENCE")
    const workspaceId = requireIdentifier(run.workspaceId, "RUN_INDEPENDENCE")
    const processId = requireIdentifier(run.processId, "RUN_INDEPENDENCE")
    if (
      runIds.has(runId) ||
      workspaceIds.has(workspaceId) ||
      processIds.has(processId) ||
      runId <= previousRunId
    )
      fail("RUN_INDEPENDENCE")
    runIds.add(runId)
    workspaceIds.add(workspaceId)
    processIds.add(processId)
    previousRunId = runId
    const startedAt = requireInstant(run.startedAt, "RUN_FRESHNESS")
    const completedAt = requireInstant(run.completedAt, "RUN_FRESHNESS")
    const validUntil = requireInstant(run.validUntil, "RUN_FRESHNESS")
    if (
      startedAt > completedAt ||
      completedAt > issuedAt ||
      completedAt > validUntil ||
      freshUntil > validUntil ||
      issuedAt - completedAt > 30 * 24 * 60 * 60 * 1_000
    )
      fail("RUN_FRESHNESS")
  }

  const reviewedPayloadSha256 =
    RUNTIME_CONFORMANCE_V119_REVIEWED_PAYLOAD_SHA256[identity.languageId]
  const computedPayloadSha256 = canonicalSha256(payload as unknown as JsonValue)
  if (
    certificate.candidatePayloadSha256 !== reviewedPayloadSha256 ||
    computedPayloadSha256 !== reviewedPayloadSha256
  )
    fail("REVIEWED_PAYLOAD_MISMATCH")

  const selected = input.trustedProducers.filter(
    (producer) =>
      producer.producerId === payload.producerId &&
      producer.keyId === payload.producerKeyId &&
      producer.trustDomain === certificate.trustDomain &&
      producer.managedIdentity === true,
  )
  if (selected.length !== 1) fail("UNTRUSTED_PRODUCER")
  let signatureValid = false
  try {
    const signature = Buffer.from(certificate.signatureBase64, "base64")
    if (
      signature.length !== 64 ||
      signature.toString("base64") !== certificate.signatureBase64
    )
      fail("SIGNATURE")
    signatureValid = verifySignature(
      null,
      encodeRuntimeConformanceCertificatePayloadV119(payload),
      selected[0]!.publicKeyPem,
      signature,
    )
  } catch {
    fail("SIGNATURE")
  }
  if (!signatureValid) fail("SIGNATURE")

  return deepFreeze<RuntimeConformanceVerifiedSnapshotV119>({
    schemaVersion: "runtime-conformance-certificate-verified-v1.19",
    certificateId: payload.certificateId,
    certificateSha256: canonicalSha256(certificate as unknown as JsonValue),
    certificateVersion: "runtime-conformance-certificate-v1.19",
    candidatePayloadSha256: reviewedPayloadSha256,
    producerId: payload.producerId,
    producerKeyId: payload.producerKeyId,
    trustDomain: certificate.trustDomain,
    registryGeneration: payload.registryGeneration,
    issuedAt: payload.issuedAt,
    freshUntil: payload.freshUntil,
    status: "inactive",
    languageId: identity.languageId,
    identity,
    candidateBindings: globalThis.structuredClone(payload.candidateBindings),
    runIds: payload.runs.map(({ runId }) => runId),
    runCount: 3,
    resultRootSha256: expected.resultRootSha256,
    evidenceRootSha256: expected.evidenceRootSha256,
  })
}
