import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import {
  hashExecutableLaneIdentity,
  parseExecutableLaneIdentity,
} from "./runtime-evidence-attestation.js"
import { getVerifiedRuntimeConformanceEvidenceBindingV117 } from "./runtime-evidence-attestation-v1-17.js"
import { RUNTIME_BUDGET_PROFILE_V1_18_SHA256 } from "./runtime-budget-profile-v1-18.js"
import type { ExecutableLaneIdentity } from "./runtime-evidence.js"
import {
  RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17,
  RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17,
  RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17,
  isCanonicalSafeRegistryGenerationV117,
  type RuntimeConformanceEvidenceBindingV117,
  type RuntimeEvidenceExactPinNameV117,
} from "./runtime-evidence-v1-17.js"
import type { JsonValue } from "./types.js"

export const RUNTIME_EVIDENCE_AUTHORITY_ENVELOPE_SCHEMA_VERSION =
  "v1.37-runtime-evidence-authority-envelope-v1" as const
export const RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION =
  "v1.37-runtime-evidence-authority-payload-v1" as const
export const RUNTIME_EVIDENCE_AUTHORITY_BOOTSTRAP_SCHEMA_VERSION =
  "v1.37-runtime-evidence-authority-bootstrap-v1" as const
export const RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_SCHEMA_VERSION =
  "v1.37-runtime-evidence-authority-high-water-v1" as const
export const RUNTIME_EVIDENCE_AUTHORITY_SIGNATURE_DOMAIN =
  "cowards-game:runtime-evidence-authority-signature:v1" as const

export const RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS = Object.freeze({
  production: "cowards-game:runtime-evidence-authority:production:v1",
  fixture: "cowards-game:runtime-evidence-authority:fixture:v1",
})

export const RUNTIME_EVIDENCE_AUTHORITY_LIMITS = Object.freeze({
  envelopeBytes: 1_500_000,
  payloadBytes: 1_000_000,
  recordsPerCollection: 4_096,
  referencesPerRecord: 256,
  identifierBytes: 512,
})

export const RUNTIME_EVIDENCE_AUTHORITY_ATOMIC_REFRESH_CONTRACT = Object.freeze(
  {
    schemaVersion: "v1.37-runtime-evidence-authority-refresh-v1" as const,
    writerSteps: Object.freeze([
      "write-complete-envelope-to-same-filesystem-temporary-file",
      "fsync-temporary-file",
      "close-temporary-file",
      "atomic-rename-over-authority-file",
      "fsync-parent-directory",
    ] as const),
    readerSteps: Object.freeze([
      "open-authority-file-once-per-check",
      "read-to-eof-from-one-file-descriptor",
      "close-file-descriptor",
    ] as const),
  },
)

export interface RuntimeEvidenceAuthorityAttestation {
  attestationId: string
  attestationHash: string
  verified: boolean
  imports: readonly string[]
}

export interface RuntimeEvidenceAuthorityCertificate {
  kind: "containment" | "conformance"
  certificateId: string
  certificateVersion: string
  certificateRecordHash: string
  laneIdentityHash: string
  laneIdentity: ExecutableLaneIdentity
  issuedAt: string
  freshUntil: string
  attestationIds: readonly string[]
}

export interface RuntimeEvidenceAuthorityRevocation {
  certificateId: string
  certificateRecordHash: string
  revokedAt: string
  reasonCode: string
}

export interface RuntimeEvidenceAuthoritySupersession {
  certificateId: string
  supersededByCertificateId: string
}

export interface RuntimeEvidenceAuthorityLaneDisable {
  laneIdentityHash: string
  disabledAt: string
  reasonCode: string
}

export interface RuntimeEvidenceAuthorityPayload {
  schemaVersion: typeof RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION
  bundleVersion: string
  registryGeneration: string
  issuedAt: string
  validFrom: string
  validUntil: string
  semanticTupleManifestHash: string
  attestations: readonly RuntimeEvidenceAuthorityAttestation[]
  certificates: readonly RuntimeEvidenceAuthorityCertificate[]
  revocations: readonly RuntimeEvidenceAuthorityRevocation[]
  supersessions: readonly RuntimeEvidenceAuthoritySupersession[]
  operatorLaneDisables: readonly RuntimeEvidenceAuthorityLaneDisable[]
}

export interface RuntimeEvidenceAuthorityEnvelope {
  schemaVersion: typeof RUNTIME_EVIDENCE_AUTHORITY_ENVELOPE_SCHEMA_VERSION
  trustDomain: string
  keyId: string
  algorithm: "Ed25519"
  payloadBase64: string
  payloadSha256: string
  signatureBase64: string
}

export interface RuntimeEvidenceAuthorityBootstrapPin {
  schemaVersion: typeof RUNTIME_EVIDENCE_AUTHORITY_BOOTSTRAP_SCHEMA_VERSION
  minimumRegistryGeneration: string
  minimumPayloadSha256: string
}

export interface RuntimeEvidenceAuthorityHighWaterRecord {
  schemaVersion: typeof RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_SCHEMA_VERSION
  registryGeneration: string
  payloadSha256: string
}

export interface RuntimeEvidenceAuthorityAntiRollbackDecision {
  executable: boolean
  durableInstallRequired: boolean
  nextHighWater: Readonly<RuntimeEvidenceAuthorityHighWaterRecord>
}

export class RuntimeEvidenceAuthorityBundleError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = "RuntimeEvidenceAuthorityBundleError"
  }
}

export type RuntimeEvidenceAuthorityExactPinV117 = readonly [
  RuntimeEvidenceExactPinNameV117,
  string,
]

export interface RuntimeEvidenceAuthorityBindingV117 {
  graphSchemaVersion: typeof RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17
  graphProfile: typeof RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17
  identityManifestRoot: string
  evidenceGraphRoot: string
  exactPins: readonly RuntimeEvidenceAuthorityExactPinV117[]
}

export const RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION_V1_17 =
  "v1.37-runtime-evidence-authority-payload-v1.17" as const

export interface RuntimeEvidenceAuthorityAttestationV117 {
  attestationId: string
  attestationHash: string
  producerId: string
  producerKeyId: string
  trustDomain: "production" | "fixture"
  managedIdentity: true
  imports: readonly string[]
  binding: RuntimeEvidenceAuthorityBindingV117
}

export interface RuntimeEvidenceAuthorityCertificateV117 {
  certificateId: string
  certificateVersion: string
  certificateRecordHash: string
  certificateKind: "containment" | "conformance"
  attestationId: string
  binding: RuntimeEvidenceAuthorityBindingV117
  conformanceSource?: RuntimeEvidenceAuthorityConformanceSourceV117 | undefined
}

export interface RuntimeEvidenceAuthorityConformanceSourceV117 {
  schemaVersion: "runtime-evidence-authority-conformance-source-v1.17"
  certificateId: string
  certificateVersion: "runtime-conformance-certificate-v1.17"
  certificateSha256: string
  attestationSha256: string
  conformanceBindingSha256: string
  languageId: "typescript" | "python" | "rust" | "zig"
  laneId: string
  corpusRootSha256: string
  caseInventorySha256: string
  identityManifestRoot: string
  evidenceGraphRoot: string
  runtimeAbiVersion: "strategy-runtime-abi-v1.18"
  runtimeAbiEnvelopeSha256: string
  additiveBudgetProfileSha256: string
  supervisorIdentityRootSha256: string
  resultRootSha256: string
  evidenceRootSha256: string
  runReceiptRootSha256: string
  registryGeneration: string
  freshUntil: string
}

export interface RuntimeEvidenceAuthorityConformanceSourceResolverV117 {
  resolveConformanceSource(input: {
    certificateId: string
    certificateVersion: "runtime-conformance-certificate-v1.17"
    attestationId: string
  }): Readonly<RuntimeEvidenceAuthorityConformanceSourceV117> | undefined
}

export interface RuntimeEvidenceAuthorityPayloadV117 {
  schemaVersion: typeof RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION_V1_17
  bundleVersion: string
  registryGeneration: string
  issuedAt: string
  validFrom: string
  validUntil: string
  semanticTupleManifestHash: string
  sourceManifestHash: string
  attestations: readonly RuntimeEvidenceAuthorityAttestationV117[]
  certificates: readonly RuntimeEvidenceAuthorityCertificateV117[]
}

const exactBindingKeys = [
  "graphSchemaVersion",
  "graphProfile",
  "identityManifestRoot",
  "evidenceGraphRoot",
  "exactPins",
] as const

export const parseRuntimeEvidenceAuthorityBindingV117 = (
  value: RuntimeEvidenceAuthorityBindingV117,
): Readonly<RuntimeEvidenceAuthorityBindingV117> => {
  const record = requireRecord(
    value,
    "V117_BINDING",
    "Runtime evidence binding is invalid.",
  )
  assertExactKeys(record, exactBindingKeys, "Runtime evidence binding")
  const identityManifestRoot = record.identityManifestRoot
  const evidenceGraphRoot = record.evidenceGraphRoot
  const exactPinsValue = record.exactPins
  if (
    record.graphSchemaVersion !== RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17 ||
    record.graphProfile !== RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17 ||
    typeof identityManifestRoot !== "string" ||
    typeof evidenceGraphRoot !== "string" ||
    !SHA256.test(identityManifestRoot) ||
    !SHA256.test(evidenceGraphRoot) ||
    !Array.isArray(exactPinsValue) ||
    exactPinsValue.length !== RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17.length
  ) {
    fail("V117_BINDING", "Runtime evidence binding is invalid.")
  }
  if (!Array.isArray(exactPinsValue)) {
    return fail("V117_BINDING", "Runtime evidence binding is invalid.")
  }
  const exactPins = exactPinsValue.map((candidate: unknown, index: number) => {
    if (!Array.isArray(candidate) || candidate.length !== 2) {
      return fail("V117_BINDING", "Runtime evidence binding is invalid.")
    }
    const expected = RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17[index]!
    const pinValue = candidate[1]
    if (
      candidate[0] !== expected ||
      typeof pinValue !== "string" ||
      pinValue.length === 0 ||
      textEncoder.encode(pinValue).byteLength >
        RUNTIME_EVIDENCE_AUTHORITY_LIMITS.identifierBytes ||
      V117_FLOATING_PIN.test(pinValue) ||
      (V117_HASH_PINS.has(expected) && !SHA256.test(pinValue))
    ) {
      return fail("V117_BINDING", "Runtime evidence binding is invalid.")
    }
    return Object.freeze([expected, pinValue] as const)
  })
  return Object.freeze({
    graphSchemaVersion: RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17,
    graphProfile: RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17,
    identityManifestRoot: identityManifestRoot as string,
    evidenceGraphRoot: evidenceGraphRoot as string,
    exactPins: Object.freeze(exactPins),
  })
}

const frameV117 = (parts: readonly string[]): Uint8Array => {
  const encoded = parts.map((part) => textEncoder.encode(part))
  const output = Buffer.alloc(
    encoded.reduce((total, part) => total + 8 + part.byteLength, 0),
  )
  let offset = 0
  for (const part of encoded) {
    output.writeBigUInt64BE(BigInt(part.byteLength), offset)
    offset += 8
    output.set(part, offset)
    offset += part.byteLength
  }
  return output
}

const hashCanonicalAuthoritySourceV117 = (
  domain: string,
  value: JsonValue,
): string => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) {
    return fail(
      "V117_CONFORMANCE_SOURCE",
      "Runtime conformance authority source is not canonical.",
    )
  }
  const domainBytes = textEncoder.encode(domain)
  const output = Buffer.alloc(
    16 + domainBytes.byteLength + encoded.bytes.byteLength,
  )
  output.writeBigUInt64BE(BigInt(domainBytes.byteLength), 0)
  output.set(domainBytes, 8)
  const valueOffset = 8 + domainBytes.byteLength
  output.writeBigUInt64BE(BigInt(encoded.bytes.byteLength), valueOffset)
  output.set(encoded.bytes, valueOffset + 8)
  return `sha256:${createHash("sha256").update(output).digest("hex")}`
}

const verifiedAuthorityConformanceSourcesV117 = new WeakSet<object>()

const requireVerifiedAuthorityConformanceSourceV117 = (
  value: Readonly<RuntimeEvidenceAuthorityConformanceSourceV117>,
): Readonly<RuntimeEvidenceAuthorityConformanceSourceV117> => {
  if (!verifiedAuthorityConformanceSourcesV117.has(value as object)) {
    return fail(
      "V117_CONFORMANCE_SOURCE",
      "Runtime conformance authority source is not verifier-derived.",
    )
  }
  return value
}

export const createRuntimeEvidenceAuthorityConformanceSourceV117 = (
  value: Readonly<RuntimeConformanceEvidenceBindingV117>,
): Readonly<RuntimeEvidenceAuthorityConformanceSourceV117> => {
  const binding = getVerifiedRuntimeConformanceEvidenceBindingV117(value)
  const supervisorIdentityRootSha256 = hashCanonicalAuthoritySourceV117(
    "cowards-game:runtime-evidence-authority-supervisor-source:v1.17",
    {
      supervisorOperatingSystemSha256: binding.supervisorOperatingSystemSha256,
      supervisorSettingsSha256: binding.supervisorSettingsSha256,
      aggregateReceiptSchemaSha256: binding.aggregateReceiptSchemaSha256,
      supervisorIdentity: binding.supervisorIdentity,
    } as unknown as JsonValue,
  )
  const runReceiptRootSha256 = hashCanonicalAuthoritySourceV117(
    "cowards-game:runtime-evidence-authority-run-receipts:v1.17",
    {
      runIds: binding.runIds,
      runReceiptSha256s: binding.runReceiptSha256s,
      resultRootSha256: binding.resultRootSha256,
      evidenceRootSha256: binding.evidenceRootSha256,
    } as unknown as JsonValue,
  )
  const conformanceBindingSha256 = hashCanonicalAuthoritySourceV117(
    "cowards-game:runtime-evidence-authority-conformance-binding:v1.17",
    binding as unknown as JsonValue,
  )
  const source = Object.freeze({
    schemaVersion: "runtime-evidence-authority-conformance-source-v1.17",
    certificateId: binding.certificateId,
    certificateVersion: binding.certificateVersion,
    certificateSha256: binding.certificateSha256,
    attestationSha256: `sha256:${binding.attestationSha256}`,
    conformanceBindingSha256,
    languageId: binding.languageId,
    laneId: binding.laneId,
    corpusRootSha256: binding.corpusRootSha256,
    caseInventorySha256: binding.caseInventorySha256,
    identityManifestRoot: binding.identityManifestRoot,
    evidenceGraphRoot: binding.evidenceGraphRoot,
    runtimeAbiVersion: binding.runtimeAbiVersion,
    runtimeAbiEnvelopeSha256: binding.runtimeAbiEnvelopeSha256,
    additiveBudgetProfileSha256: binding.additiveBudgetProfileSha256,
    supervisorIdentityRootSha256,
    resultRootSha256: binding.resultRootSha256,
    evidenceRootSha256: binding.evidenceRootSha256,
    runReceiptRootSha256,
    registryGeneration: binding.registryGeneration,
    freshUntil: binding.freshUntil,
  })
  verifiedAuthorityConformanceSourcesV117.add(source)
  return source
}

const CONFORMANCE_SOURCE_KEYS_V1_17 = [
  "schemaVersion",
  "certificateId",
  "certificateVersion",
  "certificateSha256",
  "attestationSha256",
  "conformanceBindingSha256",
  "languageId",
  "laneId",
  "corpusRootSha256",
  "caseInventorySha256",
  "identityManifestRoot",
  "evidenceGraphRoot",
  "runtimeAbiVersion",
  "runtimeAbiEnvelopeSha256",
  "additiveBudgetProfileSha256",
  "supervisorIdentityRootSha256",
  "resultRootSha256",
  "evidenceRootSha256",
  "runReceiptRootSha256",
  "registryGeneration",
  "freshUntil",
] as const

export const parseRuntimeEvidenceAuthorityConformanceSourceV117 = (
  value: RuntimeEvidenceAuthorityConformanceSourceV117,
): Readonly<RuntimeEvidenceAuthorityConformanceSourceV117> => {
  const record = requireRecord(
    value,
    "V117_CONFORMANCE_SOURCE",
    "Runtime conformance authority source is invalid.",
  )
  assertExactKeys(
    record,
    CONFORMANCE_SOURCE_KEYS_V1_17,
    "Runtime conformance authority source",
  )
  const languageId = record.languageId
  if (
    languageId !== "typescript" &&
    languageId !== "python" &&
    languageId !== "rust" &&
    languageId !== "zig"
  ) {
    fail(
      "V117_CONFORMANCE_SOURCE",
      "Runtime conformance authority source is invalid.",
    )
  }
  if (
    record.schemaVersion !==
      "runtime-evidence-authority-conformance-source-v1.17" ||
    record.certificateVersion !== "runtime-conformance-certificate-v1.17" ||
    record.runtimeAbiVersion !== "strategy-runtime-abi-v1.18" ||
    record.additiveBudgetProfileSha256 !==
      RUNTIME_BUDGET_PROFILE_V1_18_SHA256 ||
    record.laneId !== `lane:${String(languageId)}:linux-cgroup-v2`
  ) {
    fail(
      "V117_CONFORMANCE_SOURCE",
      "Runtime conformance authority source is invalid.",
    )
  }
  const hashes = Object.fromEntries(
    [
      "certificateSha256",
      "attestationSha256",
      "conformanceBindingSha256",
      "corpusRootSha256",
      "caseInventorySha256",
      "identityManifestRoot",
      "evidenceGraphRoot",
      "runtimeAbiEnvelopeSha256",
      "additiveBudgetProfileSha256",
      "supervisorIdentityRootSha256",
      "resultRootSha256",
      "evidenceRootSha256",
      "runReceiptRootSha256",
    ].map((key) => [key, assertHash(record[key], key)]),
  ) as Record<string, string>
  return Object.freeze({
    schemaVersion: "runtime-evidence-authority-conformance-source-v1.17",
    certificateId: assertString(record.certificateId, "certificateId"),
    certificateVersion: "runtime-conformance-certificate-v1.17",
    certificateSha256: hashes.certificateSha256!,
    attestationSha256: hashes.attestationSha256!,
    conformanceBindingSha256: hashes.conformanceBindingSha256!,
    languageId: languageId as "typescript" | "python" | "rust" | "zig",
    laneId: assertString(record.laneId, "laneId"),
    corpusRootSha256: hashes.corpusRootSha256!,
    caseInventorySha256: hashes.caseInventorySha256!,
    identityManifestRoot: hashes.identityManifestRoot!,
    evidenceGraphRoot: hashes.evidenceGraphRoot!,
    runtimeAbiVersion: "strategy-runtime-abi-v1.18",
    runtimeAbiEnvelopeSha256: hashes.runtimeAbiEnvelopeSha256!,
    additiveBudgetProfileSha256: hashes.additiveBudgetProfileSha256!,
    supervisorIdentityRootSha256: hashes.supervisorIdentityRootSha256!,
    resultRootSha256: hashes.resultRootSha256!,
    evidenceRootSha256: hashes.evidenceRootSha256!,
    runReceiptRootSha256: hashes.runReceiptRootSha256!,
    registryGeneration: assertGeneration(
      record.registryGeneration,
      "registryGeneration",
    ),
    freshUntil: parseInstant(record.freshUntil, "freshUntil"),
  })
}

export const hashRuntimeEvidenceCertificateRecordV117 = (input: {
  certificateKind: "containment" | "conformance"
  certificateId: string
  certificateVersion: string
  attestationId: string
  binding: RuntimeEvidenceAuthorityBindingV117
  conformanceSource?: RuntimeEvidenceAuthorityConformanceSourceV117 | undefined
}): string => {
  const binding = parseRuntimeEvidenceAuthorityBindingV117(input.binding)
  const conformanceSource =
    input.conformanceSource === undefined
      ? undefined
      : parseRuntimeEvidenceAuthorityConformanceSourceV117(
          input.conformanceSource,
        )
  if (
    input.certificateKind === "containment" &&
    conformanceSource !== undefined
  ) {
    fail("V117_CERTIFICATE", "Runtime evidence certificate is invalid.")
  }
  if (
    input.certificateKind === "conformance" &&
    input.certificateVersion === "runtime-conformance-certificate-v1.17" &&
    conformanceSource === undefined
  ) {
    fail("V117_CERTIFICATE", "Runtime evidence certificate is invalid.")
  }
  for (const value of [
    input.certificateId,
    input.certificateVersion,
    input.attestationId,
  ]) {
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.includes("\0")
    ) {
      fail("V117_CERTIFICATE", "Runtime evidence certificate is invalid.")
    }
  }
  return `sha256:${createHash("sha256")
    .update(
      frameV117([
        "cowards-game:runtime-evidence-certificate-record:v1.17",
        input.certificateKind,
        input.certificateId,
        input.certificateVersion,
        input.attestationId,
        binding.graphSchemaVersion,
        binding.graphProfile,
        binding.identityManifestRoot,
        binding.evidenceGraphRoot,
        ...binding.exactPins.flatMap(([name, value]) => [name, value]),
        ...(conformanceSource === undefined
          ? []
          : CONFORMANCE_SOURCE_KEYS_V1_17.map((key) =>
              String(conformanceSource[key]),
            )),
      ]),
    )
    .digest("hex")}`
}

const fail = (code: string, message: string): never => {
  throw new RuntimeEvidenceAuthorityBundleError(code, message)
}

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const V117_FLOATING_PIN =
  /(?:^|[-_.:])(latest|current|default|any|stable|head)(?:$|[-_.:])|[*^~<>]/iu
const V117_HASH_PINS = new Set<RuntimeEvidenceExactPinNameV117>([
  "runtimeExecutableDigest",
  "compilerFlags",
  "adapterBuildDigest",
  "standardLibraryOrSysrootDigest",
  "budgetProfileSha256",
  "behaviorSettingsHash",
])
const BASE64 =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u
const textEncoder = new TextEncoder()
const strictTextDecoder = new TextDecoder("utf-8", { fatal: true })

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const requireRecord = (
  value: unknown,
  code: string,
  message: string,
): Record<string, unknown> => {
  if (!isRecord(value)) fail(code, message)
  return value as Record<string, unknown>
}

const assertExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void => {
  const actual = Object.keys(value)
  if (
    actual.length !== expected.length ||
    expected.some((key) => !Object.hasOwn(value, key))
  ) {
    fail(
      "STRICT_SHAPE",
      `${label} must contain exactly: ${expected.join(", ")}.`,
    )
  }
}

const assertString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    return fail("INVALID_STRING", `${label} must be a non-empty string.`)
  }
  if (
    textEncoder.encode(value).byteLength >
    RUNTIME_EVIDENCE_AUTHORITY_LIMITS.identifierBytes
  ) {
    return fail("STRING_LIMIT", `${label} exceeds the authority string limit.`)
  }
  return value
}

const assertHash = (value: unknown, label: string): string => {
  const hash = assertString(value, label)
  if (!SHA256.test(hash))
    fail("INVALID_HASH", `${label} must be a sha256 identity.`)
  return hash
}

const assertGeneration = (value: unknown, label: string): string => {
  const generation = assertString(value, label)
  if (!isCanonicalSafeRegistryGenerationV117(generation)) {
    fail("INVALID_GENERATION", `${label} must be a canonical safe generation.`)
  }
  return generation
}

const parseInstant = (value: unknown, label: string): string => {
  const instant = assertString(value, label)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(instant)) {
    fail(
      "INVALID_INSTANT",
      `${label} must be an exact UTC millisecond instant.`,
    )
  }
  const parsed = Date.parse(instant)
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== instant) {
    fail("INVALID_INSTANT", `${label} is not a valid instant.`)
  }
  return instant
}

const assertCollection = (
  value: unknown,
  label: string,
): readonly unknown[] => {
  if (!Array.isArray(value))
    fail("INVALID_COLLECTION", `${label} must be an array.`)
  const collection = value as unknown[]
  if (
    collection.length > RUNTIME_EVIDENCE_AUTHORITY_LIMITS.recordsPerCollection
  ) {
    fail("COLLECTION_LIMIT", `${label} exceeds the record limit.`)
  }
  return collection
}

const assertReferences = (value: unknown, label: string): readonly string[] => {
  const values = assertCollection(value, label)
  if (values.length > RUNTIME_EVIDENCE_AUTHORITY_LIMITS.referencesPerRecord) {
    fail("REFERENCE_LIMIT", `${label} exceeds the reference limit.`)
  }
  const references = values.map((entry, index) =>
    assertString(entry, `${label}[${index}]`),
  )
  if (new Set(references).size !== references.length) {
    fail("DUPLICATE_REFERENCE", `${label} contains a duplicate reference.`)
  }
  return Object.freeze(references)
}

const parseAttestation = (
  value: unknown,
  index: number,
): Readonly<RuntimeEvidenceAuthorityAttestation> => {
  const record = requireRecord(
    value,
    "INVALID_ATTESTATION",
    `attestations[${index}] must be an object.`,
  )
  assertExactKeys(
    record,
    ["attestationId", "attestationHash", "verified", "imports"],
    `attestations[${index}]`,
  )
  if (record.verified !== true) {
    fail("UNVERIFIED_ATTESTATION", `attestations[${index}] must be verified.`)
  }
  return Object.freeze({
    attestationId: assertString(
      record.attestationId,
      `attestations[${index}].attestationId`,
    ),
    attestationHash: assertHash(
      record.attestationHash,
      `attestations[${index}].attestationHash`,
    ),
    verified: true,
    imports: assertReferences(record.imports, `attestations[${index}].imports`),
  })
}

const parseCertificate = (
  value: unknown,
  index: number,
): Readonly<RuntimeEvidenceAuthorityCertificate> => {
  const record = requireRecord(
    value,
    "INVALID_CERTIFICATE",
    `certificates[${index}] must be an object.`,
  )
  assertExactKeys(
    record,
    [
      "kind",
      "certificateId",
      "certificateVersion",
      "certificateRecordHash",
      "laneIdentityHash",
      "laneIdentity",
      "issuedAt",
      "freshUntil",
      "attestationIds",
    ],
    `certificates[${index}]`,
  )
  if (record.kind !== "containment" && record.kind !== "conformance") {
    fail("INVALID_CERTIFICATE_KIND", `certificates[${index}].kind is invalid.`)
  }
  const attestationIds = assertReferences(
    record.attestationIds,
    `certificates[${index}].attestationIds`,
  )
  if (attestationIds.length === 0) {
    fail(
      "EMPTY_EVIDENCE_GRAPH",
      `certificates[${index}] requires an attestation.`,
    )
  }
  const issuedAt = parseInstant(
    record.issuedAt,
    `certificates[${index}].issuedAt`,
  )
  const freshUntil = parseInstant(
    record.freshUntil,
    `certificates[${index}].freshUntil`,
  )
  if (Date.parse(issuedAt) > Date.parse(freshUntil)) {
    fail(
      "INVALID_CERTIFICATE_VALIDITY",
      `certificates[${index}] has an incoherent validity interval.`,
    )
  }
  let laneIdentity: Readonly<ExecutableLaneIdentity>
  try {
    laneIdentity = parseExecutableLaneIdentity(
      record.laneIdentity as ExecutableLaneIdentity,
    )
  } catch {
    return fail(
      "CERTIFICATE_LANE_IDENTITY",
      `certificates[${index}] lane identity expansion is invalid.`,
    )
  }
  const laneIdentityHash = assertHash(
    record.laneIdentityHash,
    `certificates[${index}].laneIdentityHash`,
  )
  if (
    `sha256:${hashExecutableLaneIdentity(laneIdentity)}` !== laneIdentityHash
  ) {
    fail(
      "CERTIFICATE_LANE_IDENTITY",
      `certificates[${index}] lane identity hash does not match its expansion.`,
    )
  }
  return Object.freeze({
    kind: record.kind as "containment" | "conformance",
    certificateId: assertString(
      record.certificateId,
      `certificates[${index}].certificateId`,
    ),
    certificateVersion: assertString(
      record.certificateVersion,
      `certificates[${index}].certificateVersion`,
    ),
    certificateRecordHash: assertHash(
      record.certificateRecordHash,
      `certificates[${index}].certificateRecordHash`,
    ),
    laneIdentityHash,
    laneIdentity,
    issuedAt,
    freshUntil,
    attestationIds,
  })
}

const parseRevocation = (
  value: unknown,
  index: number,
): Readonly<RuntimeEvidenceAuthorityRevocation> => {
  const record = requireRecord(
    value,
    "INVALID_REVOCATION",
    `revocations[${index}] must be an object.`,
  )
  assertExactKeys(
    record,
    ["certificateId", "certificateRecordHash", "revokedAt", "reasonCode"],
    `revocations[${index}]`,
  )
  return Object.freeze({
    certificateId: assertString(
      record.certificateId,
      `revocations[${index}].certificateId`,
    ),
    certificateRecordHash: assertHash(
      record.certificateRecordHash,
      `revocations[${index}].certificateRecordHash`,
    ),
    revokedAt: parseInstant(
      record.revokedAt,
      `revocations[${index}].revokedAt`,
    ),
    reasonCode: assertString(
      record.reasonCode,
      `revocations[${index}].reasonCode`,
    ),
  })
}

const parseSupersession = (
  value: unknown,
  index: number,
): Readonly<RuntimeEvidenceAuthoritySupersession> => {
  const record = requireRecord(
    value,
    "INVALID_SUPERSESSION",
    `supersessions[${index}] must be an object.`,
  )
  assertExactKeys(
    record,
    ["certificateId", "supersededByCertificateId"],
    `supersessions[${index}]`,
  )
  return Object.freeze({
    certificateId: assertString(
      record.certificateId,
      `supersessions[${index}].certificateId`,
    ),
    supersededByCertificateId: assertString(
      record.supersededByCertificateId,
      `supersessions[${index}].supersededByCertificateId`,
    ),
  })
}

const parseLaneDisable = (
  value: unknown,
  index: number,
): Readonly<RuntimeEvidenceAuthorityLaneDisable> => {
  const record = requireRecord(
    value,
    "INVALID_LANE_DISABLE",
    `operatorLaneDisables[${index}] must be an object.`,
  )
  assertExactKeys(
    record,
    ["laneIdentityHash", "disabledAt", "reasonCode"],
    `operatorLaneDisables[${index}]`,
  )
  return Object.freeze({
    laneIdentityHash: assertHash(
      record.laneIdentityHash,
      `operatorLaneDisables[${index}].laneIdentityHash`,
    ),
    disabledAt: parseInstant(
      record.disabledAt,
      `operatorLaneDisables[${index}].disabledAt`,
    ),
    reasonCode: assertString(
      record.reasonCode,
      `operatorLaneDisables[${index}].reasonCode`,
    ),
  })
}

const assertUnique = (values: readonly string[], label: string): void => {
  if (new Set(values).size !== values.length) {
    fail("DUPLICATE_ID", `${label} contains a duplicate ID.`)
  }
}

const validateClosedGraph = (
  payload: RuntimeEvidenceAuthorityPayload,
): void => {
  assertUnique(
    payload.attestations.map((entry) => entry.attestationId),
    "attestations",
  )
  assertUnique(
    payload.certificates.map((entry) => entry.certificateId),
    "certificates",
  )
  const attestations = new Map(
    payload.attestations.map((entry) => [entry.attestationId, entry]),
  )
  const certificates = new Map(
    payload.certificates.map((entry) => [entry.certificateId, entry]),
  )
  assertUnique(
    payload.revocations.map(
      (entry) => `${entry.certificateId}\0${entry.certificateRecordHash}`,
    ),
    "revocations",
  )
  assertUnique(
    payload.supersessions.map((entry) => entry.certificateId),
    "supersessions",
  )
  assertUnique(
    payload.operatorLaneDisables.map((entry) => entry.laneIdentityHash),
    "operator lane disables",
  )

  for (const attestation of payload.attestations) {
    for (const importedId of attestation.imports) {
      if (!attestations.has(importedId)) {
        fail(
          "DANGLING_GRAPH",
          `Attestation ${attestation.attestationId} has dangling import ${importedId}.`,
        )
      }
    }
  }
  for (const certificate of payload.certificates) {
    if (
      Date.parse(certificate.issuedAt) > Date.parse(payload.validFrom) ||
      Date.parse(certificate.freshUntil) < Date.parse(payload.validUntil)
    ) {
      fail(
        "CERTIFICATE_VALIDITY",
        `Certificate ${certificate.certificateId} does not cover the authority validity interval.`,
      )
    }
    for (const attestationId of certificate.attestationIds) {
      if (!attestations.has(attestationId)) {
        fail(
          "DANGLING_GRAPH",
          `Certificate ${certificate.certificateId} has dangling attestation ${attestationId}.`,
        )
      }
    }
  }
  for (const revocation of payload.revocations) {
    const certificate = certificates.get(revocation.certificateId)
    if (
      !certificate ||
      certificate.certificateRecordHash !== revocation.certificateRecordHash
    ) {
      fail(
        "DANGLING_GRAPH",
        `Revocation has dangling certificate ${revocation.certificateId}.`,
      )
    }
  }
  const supersededBy = new Map<string, string>()
  for (const supersession of payload.supersessions) {
    if (
      !certificates.has(supersession.certificateId) ||
      !certificates.has(supersession.supersededByCertificateId)
    ) {
      fail("DANGLING_GRAPH", "Supersession references an unknown certificate.")
    }
    if (supersession.certificateId === supersession.supersededByCertificateId) {
      fail("SUPERSESSION_CYCLE", "A certificate cannot supersede itself.")
    }
    supersededBy.set(
      supersession.certificateId,
      supersession.supersededByCertificateId,
    )
  }
  for (const origin of supersededBy.keys()) {
    const seen = new Set<string>()
    let cursor: string | undefined = origin
    while (cursor !== undefined) {
      if (seen.has(cursor))
        fail("SUPERSESSION_CYCLE", "Supersession graph contains a cycle.")
      seen.add(cursor)
      cursor = supersededBy.get(cursor)
    }
  }
}

export const parseRuntimeEvidenceAuthorityPayload = (
  value: unknown,
): Readonly<RuntimeEvidenceAuthorityPayload> => {
  const record = requireRecord(
    value,
    "INVALID_PAYLOAD",
    "Authority payload must be an object.",
  )
  assertExactKeys(
    record,
    [
      "schemaVersion",
      "bundleVersion",
      "registryGeneration",
      "issuedAt",
      "validFrom",
      "validUntil",
      "semanticTupleManifestHash",
      "attestations",
      "certificates",
      "revocations",
      "supersessions",
      "operatorLaneDisables",
    ],
    "Authority payload",
  )
  if (
    record.schemaVersion !== RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION
  ) {
    fail("PAYLOAD_VERSION", "Authority payload schema version is unknown.")
  }
  const payload: RuntimeEvidenceAuthorityPayload = {
    schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
    bundleVersion: assertString(record.bundleVersion, "bundleVersion"),
    registryGeneration: assertGeneration(
      record.registryGeneration,
      "registryGeneration",
    ),
    issuedAt: parseInstant(record.issuedAt, "issuedAt"),
    validFrom: parseInstant(record.validFrom, "validFrom"),
    validUntil: parseInstant(record.validUntil, "validUntil"),
    semanticTupleManifestHash: assertHash(
      record.semanticTupleManifestHash,
      "semanticTupleManifestHash",
    ),
    attestations: Object.freeze(
      assertCollection(record.attestations, "attestations").map(
        parseAttestation,
      ),
    ),
    certificates: Object.freeze(
      assertCollection(record.certificates, "certificates").map(
        parseCertificate,
      ),
    ),
    revocations: Object.freeze(
      assertCollection(record.revocations, "revocations").map(parseRevocation),
    ),
    supersessions: Object.freeze(
      assertCollection(record.supersessions, "supersessions").map(
        parseSupersession,
      ),
    ),
    operatorLaneDisables: Object.freeze(
      assertCollection(record.operatorLaneDisables, "operatorLaneDisables").map(
        parseLaneDisable,
      ),
    ),
  }
  if (
    Date.parse(payload.issuedAt) > Date.parse(payload.validFrom) ||
    Date.parse(payload.validFrom) >= Date.parse(payload.validUntil)
  ) {
    fail(
      "INVALID_VALIDITY",
      "Authority payload validity interval is incoherent.",
    )
  }
  validateClosedGraph(payload)
  return Object.freeze(payload)
}

export const encodeRuntimeEvidenceAuthorityPayload = (
  payload: RuntimeEvidenceAuthorityPayload,
): Uint8Array => {
  const normalized = parseRuntimeEvidenceAuthorityPayload(payload)
  const bytes = textEncoder.encode(JSON.stringify(normalized))
  if (bytes.byteLength > RUNTIME_EVIDENCE_AUTHORITY_LIMITS.payloadBytes) {
    fail("PAYLOAD_LIMIT", "Authority payload exceeds its byte limit.")
  }
  return bytes
}

export const parseRuntimeEvidenceAuthorityPayloadBytes = (
  bytes: Uint8Array,
): Readonly<RuntimeEvidenceAuthorityPayload> => {
  if (
    bytes.byteLength === 0 ||
    bytes.byteLength > RUNTIME_EVIDENCE_AUTHORITY_LIMITS.payloadBytes
  ) {
    fail("PAYLOAD_LIMIT", "Authority payload byte length is invalid.")
  }
  let decoded: string
  try {
    decoded = strictTextDecoder.decode(bytes)
  } catch {
    return fail("PAYLOAD_UTF8", "Authority payload is not valid UTF-8.")
  }
  try {
    return parseRuntimeEvidenceAuthorityPayload(JSON.parse(decoded))
  } catch (error) {
    if (error instanceof RuntimeEvidenceAuthorityBundleError) throw error
    return fail("PAYLOAD_JSON", "Authority payload JSON is malformed.")
  }
}

export const hashRuntimeEvidenceAuthorityPayload = (
  bytes: Uint8Array,
): string => `sha256:${createHash("sha256").update(bytes).digest("hex")}`

export const parseRuntimeEvidenceAuthorityPayloadV117 = (
  value: unknown,
  options: Partial<RuntimeEvidenceAuthorityConformanceSourceResolverV117> = {},
): Readonly<RuntimeEvidenceAuthorityPayloadV117> => {
  const record = requireRecord(
    value,
    "V117_PAYLOAD",
    "v1.17 authority payload is invalid.",
  )
  assertExactKeys(
    record,
    [
      "schemaVersion",
      "bundleVersion",
      "registryGeneration",
      "issuedAt",
      "validFrom",
      "validUntil",
      "semanticTupleManifestHash",
      "sourceManifestHash",
      "attestations",
      "certificates",
    ],
    "v1.17 authority payload",
  )
  if (
    record.schemaVersion !==
    RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION_V1_17
  ) {
    fail("PAYLOAD_VERSION", "v1.17 authority payload version is unknown.")
  }
  const attestationValues = assertCollection(
    record.attestations,
    "attestations",
  )
  const attestations = attestationValues.map((value) => {
    const candidate = requireRecord(
      value,
      "V117_ATTESTATION",
      "v1.17 attestation is invalid.",
    )
    assertExactKeys(
      candidate,
      [
        "attestationId",
        "attestationHash",
        "producerId",
        "producerKeyId",
        "trustDomain",
        "managedIdentity",
        "imports",
        "binding",
      ],
      "v1.17 attestation",
    )
    if (candidate.managedIdentity !== true) {
      return fail("V117_ATTESTATION", "v1.17 attestation is invalid.")
    }
    const trustDomain: "fixture" | "production" =
      candidate.trustDomain === "fixture" ||
      candidate.trustDomain === "production"
        ? candidate.trustDomain
        : fail("V117_ATTESTATION", "v1.17 attestation is invalid.")
    return Object.freeze({
      attestationId: assertString(candidate.attestationId, "attestationId"),
      attestationHash: assertHash(candidate.attestationHash, "attestationHash"),
      producerId: assertString(candidate.producerId, "producerId"),
      producerKeyId: assertString(candidate.producerKeyId, "producerKeyId"),
      trustDomain,
      managedIdentity: true as const,
      imports: assertReferences(candidate.imports, "imports"),
      binding: parseRuntimeEvidenceAuthorityBindingV117(
        candidate.binding as RuntimeEvidenceAuthorityBindingV117,
      ),
    })
  })
  const byAttestation = new Map(
    attestations.map((value) => [value.attestationId, value]),
  )
  if (byAttestation.size !== attestations.length)
    fail("DUPLICATE_ATTESTATION", "v1.17 authority graph is invalid.")
  for (const attestation of attestations) {
    if (attestation.imports.some((id) => !byAttestation.has(id))) {
      fail("DANGLING_ATTESTATION", "v1.17 authority graph is invalid.")
    }
    const visiting = new Set<string>()
    const visited = new Set<string>()
    const visit = (id: string): void => {
      if (visiting.has(id))
        fail("ATTESTATION_CYCLE", "v1.17 authority graph is invalid.")
      if (visited.has(id)) return
      visiting.add(id)
      for (const dependency of byAttestation.get(id)?.imports ?? [])
        visit(dependency)
      visiting.delete(id)
      visited.add(id)
    }
    visit(attestation.attestationId)
  }
  const certificates = assertCollection(
    record.certificates,
    "certificates",
  ).map((value) => {
    const candidate = requireRecord(
      value,
      "V117_CERTIFICATE",
      "v1.17 certificate is invalid.",
    )
    const certificateKeys = [
      "certificateId",
      "certificateVersion",
      "certificateRecordHash",
      "certificateKind",
      "attestationId",
      "binding",
    ] as const
    const hasConformanceSource = Object.hasOwn(candidate, "conformanceSource")
    assertExactKeys(
      candidate,
      hasConformanceSource
        ? [...certificateKeys, "conformanceSource"]
        : certificateKeys,
      "v1.17 certificate",
    )
    const certificateKind: "containment" | "conformance" =
      candidate.certificateKind === "containment" ||
      candidate.certificateKind === "conformance"
        ? candidate.certificateKind
        : fail("V117_CERTIFICATE", "v1.17 certificate is invalid.")
    const attestationId = assertString(candidate.attestationId, "attestationId")
    const attestation = byAttestation.get(attestationId)
    if (!attestation)
      return fail("DANGLING_CERTIFICATE", "v1.17 authority graph is invalid.")
    const binding = parseRuntimeEvidenceAuthorityBindingV117(
      candidate.binding as RuntimeEvidenceAuthorityBindingV117,
    )
    if (JSON.stringify(binding) !== JSON.stringify(attestation.binding)) {
      fail("BINDING_MISMATCH", "v1.17 authority graph is invalid.")
    }
    const certificateId = assertString(candidate.certificateId, "certificateId")
    const certificateVersion = assertString(
      candidate.certificateVersion,
      "certificateVersion",
    )
    const sourceCandidate = hasConformanceSource
      ? (candidate.conformanceSource as RuntimeEvidenceAuthorityConformanceSourceV117)
      : undefined
    const conformanceSource = sourceCandidate
      ? parseRuntimeEvidenceAuthorityConformanceSourceV117(sourceCandidate)
      : undefined
    const currentConformance =
      certificateKind === "conformance" &&
      certificateVersion === "runtime-conformance-certificate-v1.17"
    if (
      (certificateKind === "containment" && conformanceSource !== undefined) ||
      (certificateKind === "conformance" &&
        certificateVersion !== "runtime-conformance-certificate-v1.17" &&
        conformanceSource !== undefined) ||
      (currentConformance && conformanceSource === undefined) ||
      (conformanceSource !== undefined &&
        (conformanceSource.certificateId !== certificateId ||
          conformanceSource.certificateVersion !== certificateVersion ||
          conformanceSource.identityManifestRoot !==
            binding.identityManifestRoot ||
          conformanceSource.evidenceGraphRoot !== binding.evidenceGraphRoot ||
          conformanceSource.attestationSha256 !== attestation.attestationHash ||
          conformanceSource.registryGeneration !==
            assertGeneration(record.registryGeneration, "registryGeneration") ||
          Date.parse(conformanceSource.freshUntil) <
            Date.parse(parseInstant(record.validUntil, "validUntil"))))
    ) {
      fail("V117_CONFORMANCE_SOURCE", "v1.17 certificate source is invalid.")
    }
    if (currentConformance && conformanceSource !== undefined) {
      const resolved =
        sourceCandidate !== undefined &&
        verifiedAuthorityConformanceSourcesV117.has(sourceCandidate as object)
          ? sourceCandidate
          : options.resolveConformanceSource?.({
              certificateId,
              certificateVersion,
              attestationId,
            })
      const verifiedResolved =
        resolved ??
        fail(
          "V117_CONFORMANCE_SOURCE",
          "v1.17 certificate source cannot be independently resolved.",
        )
      const expected = parseRuntimeEvidenceAuthorityConformanceSourceV117(
        requireVerifiedAuthorityConformanceSourceV117(verifiedResolved),
      )
      if (
        CONFORMANCE_SOURCE_KEYS_V1_17.some(
          (key) => expected[key] !== conformanceSource[key],
        )
      ) {
        fail(
          "V117_CONFORMANCE_SOURCE",
          "v1.17 certificate source does not match verified evidence.",
        )
      }
    }
    const certificateRecordHash = assertHash(
      candidate.certificateRecordHash,
      "certificateRecordHash",
    )
    if (
      hashRuntimeEvidenceCertificateRecordV117({
        certificateKind,
        certificateId,
        certificateVersion,
        attestationId,
        binding,
        ...(conformanceSource === undefined ? {} : { conformanceSource }),
      }) !== certificateRecordHash
    )
      fail("CERTIFICATE_HASH", "v1.17 authority graph is invalid.")
    return Object.freeze({
      certificateId,
      certificateVersion,
      certificateRecordHash,
      certificateKind,
      attestationId,
      binding,
      ...(conformanceSource === undefined ? {} : { conformanceSource }),
    })
  })
  if (
    new Set(certificates.map((value) => value.certificateId)).size !==
    certificates.length
  ) {
    fail("DUPLICATE_CERTIFICATE", "v1.17 authority graph is invalid.")
  }
  const payload: RuntimeEvidenceAuthorityPayloadV117 = {
    schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION_V1_17,
    bundleVersion: assertString(record.bundleVersion, "bundleVersion"),
    registryGeneration: assertGeneration(
      record.registryGeneration,
      "registryGeneration",
    ),
    issuedAt: parseInstant(record.issuedAt, "issuedAt"),
    validFrom: parseInstant(record.validFrom, "validFrom"),
    validUntil: parseInstant(record.validUntil, "validUntil"),
    semanticTupleManifestHash: assertHash(
      record.semanticTupleManifestHash,
      "semanticTupleManifestHash",
    ),
    sourceManifestHash: assertHash(
      record.sourceManifestHash,
      "sourceManifestHash",
    ),
    attestations: Object.freeze(attestations),
    certificates: Object.freeze(certificates),
  }
  if (
    Date.parse(payload.issuedAt) > Date.parse(payload.validFrom) ||
    Date.parse(payload.validFrom) >= Date.parse(payload.validUntil)
  )
    fail("INVALID_VALIDITY", "v1.17 authority validity is incoherent.")
  return Object.freeze(payload)
}

export const encodeRuntimeEvidenceAuthorityPayloadV117 = (
  payload: RuntimeEvidenceAuthorityPayloadV117,
): Uint8Array => {
  const bytes = textEncoder.encode(
    JSON.stringify(parseRuntimeEvidenceAuthorityPayloadV117(payload)),
  )
  if (bytes.byteLength > RUNTIME_EVIDENCE_AUTHORITY_LIMITS.payloadBytes) {
    fail("PAYLOAD_LIMIT", "v1.17 authority payload exceeds its limit.")
  }
  return bytes
}

export const parseRuntimeEvidenceAuthorityPayloadBytesV117 = (
  bytes: Uint8Array,
  options: Partial<RuntimeEvidenceAuthorityConformanceSourceResolverV117> = {},
): Readonly<RuntimeEvidenceAuthorityPayloadV117> => {
  if (
    bytes.byteLength === 0 ||
    bytes.byteLength > RUNTIME_EVIDENCE_AUTHORITY_LIMITS.payloadBytes
  ) {
    fail("PAYLOAD_LIMIT", "v1.17 authority payload byte length is invalid.")
  }
  try {
    return parseRuntimeEvidenceAuthorityPayloadV117(
      JSON.parse(strictTextDecoder.decode(bytes)),
      options,
    )
  } catch (error) {
    if (error instanceof RuntimeEvidenceAuthorityBundleError) throw error
    return fail("PAYLOAD_JSON", "v1.17 authority payload is malformed.")
  }
}

export const encodeRuntimeEvidenceAuthoritySignatureMessage = (input: {
  schemaVersion?: typeof RUNTIME_EVIDENCE_AUTHORITY_ENVELOPE_SCHEMA_VERSION
  trustDomain: string
  keyId: string
  algorithm?: "Ed25519"
  payloadBytes: Uint8Array
}): Uint8Array => {
  if (
    input.payloadBytes.byteLength === 0 ||
    input.payloadBytes.byteLength >
      RUNTIME_EVIDENCE_AUTHORITY_LIMITS.payloadBytes
  ) {
    fail("PAYLOAD_LIMIT", "Authority payload byte length is invalid.")
  }
  const fields = [
    textEncoder.encode(RUNTIME_EVIDENCE_AUTHORITY_SIGNATURE_DOMAIN),
    textEncoder.encode(
      input.schemaVersion ?? RUNTIME_EVIDENCE_AUTHORITY_ENVELOPE_SCHEMA_VERSION,
    ),
    textEncoder.encode(assertString(input.trustDomain, "trustDomain")),
    textEncoder.encode(assertString(input.keyId, "keyId")),
    textEncoder.encode(input.algorithm ?? "Ed25519"),
    textEncoder.encode(hashRuntimeEvidenceAuthorityPayload(input.payloadBytes)),
    input.payloadBytes,
  ]
  const framed = new Uint8Array(
    fields.reduce((total, field) => total + 4 + field.byteLength, 0),
  )
  const view = new DataView(framed.buffer)
  let offset = 0
  for (const field of fields) {
    view.setUint32(offset, field.byteLength, false)
    offset += 4
    framed.set(field, offset)
    offset += field.byteLength
  }
  return framed
}

const encodeBase64 = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString("base64")

const decodeBase64 = (value: unknown, label: string): Uint8Array => {
  if (typeof value !== "string" || value.length === 0) {
    fail("INVALID_BASE64", `${label} must be non-empty canonical base64.`)
  }
  const encoded = value as string
  if (!BASE64.test(encoded) || encoded.length % 4 !== 0) {
    fail("INVALID_BASE64", `${label} is not canonical base64.`)
  }
  const decoded = Buffer.from(encoded, "base64")
  if (decoded.toString("base64") !== encoded) {
    fail("INVALID_BASE64", `${label} is not canonical base64.`)
  }
  return new Uint8Array(decoded)
}

export const buildRuntimeEvidenceAuthorityEnvelope = (input: {
  trustDomain: string
  keyId: string
  payloadBytes: Uint8Array
  signature: Uint8Array
}): Readonly<RuntimeEvidenceAuthorityEnvelope> => {
  if (
    input.payloadBytes.byteLength === 0 ||
    input.payloadBytes.byteLength >
      RUNTIME_EVIDENCE_AUTHORITY_LIMITS.payloadBytes
  ) {
    fail("PAYLOAD_LIMIT", "Authority payload byte length is invalid.")
  }
  if (input.signature.byteLength !== 64) {
    fail("SIGNATURE_LENGTH", "Ed25519 signatures must be exactly 64 bytes.")
  }
  return Object.freeze({
    schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_ENVELOPE_SCHEMA_VERSION,
    trustDomain: assertString(input.trustDomain, "trustDomain"),
    keyId: assertString(input.keyId, "keyId"),
    algorithm: "Ed25519" as const,
    payloadBase64: encodeBase64(input.payloadBytes),
    payloadSha256: hashRuntimeEvidenceAuthorityPayload(input.payloadBytes),
    signatureBase64: encodeBase64(input.signature),
  })
}

export const parseRuntimeEvidenceAuthorityEnvelope = (
  serialized: string | Uint8Array,
): Readonly<RuntimeEvidenceAuthorityEnvelope> => {
  const bytes =
    typeof serialized === "string" ? textEncoder.encode(serialized) : serialized
  if (
    bytes.byteLength === 0 ||
    bytes.byteLength > RUNTIME_EVIDENCE_AUTHORITY_LIMITS.envelopeBytes
  ) {
    fail("ENVELOPE_LIMIT", "Authority envelope byte length is invalid.")
  }
  let value: unknown
  try {
    value = JSON.parse(strictTextDecoder.decode(bytes))
  } catch {
    return fail("ENVELOPE_JSON", "Authority envelope JSON is malformed.")
  }
  const record = requireRecord(
    value,
    "INVALID_ENVELOPE",
    "Authority envelope must be an object.",
  )
  assertExactKeys(
    record,
    [
      "schemaVersion",
      "trustDomain",
      "keyId",
      "algorithm",
      "payloadBase64",
      "payloadSha256",
      "signatureBase64",
    ],
    "Authority envelope",
  )
  if (
    record.schemaVersion !== RUNTIME_EVIDENCE_AUTHORITY_ENVELOPE_SCHEMA_VERSION
  ) {
    fail("ENVELOPE_VERSION", "Authority envelope schema version is unknown.")
  }
  if (record.algorithm !== "Ed25519") {
    fail("SIGNATURE_ALGORITHM", "Authority envelope algorithm must be Ed25519.")
  }
  const payload = decodeBase64(record.payloadBase64, "payloadBase64")
  if (payload.byteLength > RUNTIME_EVIDENCE_AUTHORITY_LIMITS.payloadBytes) {
    fail("PAYLOAD_LIMIT", "Authority payload exceeds its byte limit.")
  }
  const signature = decodeBase64(record.signatureBase64, "signatureBase64")
  if (signature.byteLength !== 64) {
    fail("SIGNATURE_LENGTH", "Ed25519 signatures must be exactly 64 bytes.")
  }
  return Object.freeze({
    schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_ENVELOPE_SCHEMA_VERSION,
    trustDomain: assertString(record.trustDomain, "trustDomain"),
    keyId: assertString(record.keyId, "keyId"),
    algorithm: "Ed25519",
    payloadBase64: encodeBase64(payload),
    payloadSha256: assertHash(record.payloadSha256, "payloadSha256"),
    signatureBase64: encodeBase64(signature),
  })
}

export const inspectRuntimeEvidenceAuthorityBundle = (
  serialized: string | Uint8Array,
  options: {
    expectedTrustDomain: string
    evaluationInstant: string
    trustedKeyIds: readonly string[]
    verifySignature(input: {
      algorithm: "Ed25519"
      keyId: string
      signedMessageBytes: Uint8Array
      signature: Uint8Array
    }): boolean
  },
) => {
  const envelope = parseRuntimeEvidenceAuthorityEnvelope(serialized)
  if (envelope.trustDomain !== options.expectedTrustDomain) {
    fail(
      "TRUST_DOMAIN",
      "Authority bundle trust domain does not match the consumer mode.",
    )
  }
  if (!options.trustedKeyIds.includes(envelope.keyId)) {
    fail("UNKNOWN_KEY", "Authority bundle uses an unknown key ID.")
  }
  const payloadBytes = decodeBase64(envelope.payloadBase64, "payloadBase64")
  const signature = decodeBase64(envelope.signatureBase64, "signatureBase64")
  const payloadSha256 = hashRuntimeEvidenceAuthorityPayload(payloadBytes)
  if (payloadSha256 !== envelope.payloadSha256) {
    fail(
      "PAYLOAD_HASH",
      "Authority bundle payload hash does not match exact bytes.",
    )
  }
  let signatureValid = false
  try {
    signatureValid = options.verifySignature({
      algorithm: "Ed25519",
      keyId: envelope.keyId,
      signedMessageBytes: encodeRuntimeEvidenceAuthoritySignatureMessage({
        schemaVersion: envelope.schemaVersion,
        trustDomain: envelope.trustDomain,
        keyId: envelope.keyId,
        algorithm: envelope.algorithm,
        payloadBytes,
      }),
      signature,
    })
  } catch {
    signatureValid = false
  }
  if (!signatureValid)
    fail("SIGNATURE", "Authority bundle signature is invalid.")
  const payload = parseRuntimeEvidenceAuthorityPayloadBytes(payloadBytes)
  const evaluationInstant = parseInstant(
    options.evaluationInstant,
    "evaluationInstant",
  )
  const evaluation = Date.parse(evaluationInstant)
  if (
    evaluation < Date.parse(payload.issuedAt) ||
    evaluation < Date.parse(payload.validFrom) ||
    evaluation > Date.parse(payload.validUntil)
  ) {
    fail("VALIDITY", "Authority bundle is outside its validity interval.")
  }
  if (
    options.expectedTrustDomain ===
      RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production &&
    payload.certificates.some(
      (certificate) => certificate.kind === "conformance",
    )
  ) {
    fail(
      "CONFORMANCE_NOT_ENABLED",
      "Production conformance authority is unavailable until Phase 259.",
    )
  }
  return Object.freeze({
    envelope,
    payload,
    payloadBytes,
    payloadSha256,
  })
}

export const inspectRuntimeEvidenceAuthorityBundleV117 = (
  serialized: string | Uint8Array,
  options: {
    expectedTrustDomain: string
    evaluationInstant: string
    trustedKeyIds: readonly string[]
    resolveConformanceSource?:
      | RuntimeEvidenceAuthorityConformanceSourceResolverV117["resolveConformanceSource"]
      | undefined
    verifySignature(input: {
      algorithm: "Ed25519"
      keyId: string
      signedMessageBytes: Uint8Array
      signature: Uint8Array
    }): boolean
  },
) => {
  const envelope = parseRuntimeEvidenceAuthorityEnvelope(serialized)
  if (envelope.trustDomain !== options.expectedTrustDomain) {
    fail(
      "TRUST_DOMAIN",
      "Authority bundle trust domain does not match the consumer mode.",
    )
  }
  if (!options.trustedKeyIds.includes(envelope.keyId)) {
    fail("UNKNOWN_KEY", "Authority bundle uses an unknown key ID.")
  }
  const payloadBytes = decodeBase64(envelope.payloadBase64, "payloadBase64")
  const signature = decodeBase64(envelope.signatureBase64, "signatureBase64")
  const payloadSha256 = hashRuntimeEvidenceAuthorityPayload(payloadBytes)
  if (payloadSha256 !== envelope.payloadSha256) {
    fail(
      "PAYLOAD_HASH",
      "Authority bundle payload hash does not match exact bytes.",
    )
  }
  let signatureValid = false
  try {
    signatureValid = options.verifySignature({
      algorithm: "Ed25519",
      keyId: envelope.keyId,
      signedMessageBytes: encodeRuntimeEvidenceAuthoritySignatureMessage({
        schemaVersion: envelope.schemaVersion,
        trustDomain: envelope.trustDomain,
        keyId: envelope.keyId,
        algorithm: envelope.algorithm,
        payloadBytes,
      }),
      signature,
    })
  } catch {
    signatureValid = false
  }
  if (!signatureValid)
    fail("SIGNATURE", "Authority bundle signature is invalid.")
  const payload = parseRuntimeEvidenceAuthorityPayloadBytesV117(payloadBytes, {
    ...(options.resolveConformanceSource === undefined
      ? {}
      : { resolveConformanceSource: options.resolveConformanceSource }),
  })
  const recordTrustDomain =
    options.expectedTrustDomain ===
    RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture
      ? "fixture"
      : options.expectedTrustDomain ===
          RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production
        ? "production"
        : fail("TRUST_DOMAIN", "Authority bundle trust domain is unknown.")
  if (
    payload.attestations.some(
      (attestation) => attestation.trustDomain !== recordTrustDomain,
    )
  ) {
    fail(
      "TRUST_DOMAIN",
      "Authority record trust domain does not match its envelope.",
    )
  }
  const evaluation = Date.parse(
    parseInstant(options.evaluationInstant, "evaluationInstant"),
  )
  if (
    evaluation < Date.parse(payload.issuedAt) ||
    evaluation < Date.parse(payload.validFrom) ||
    evaluation > Date.parse(payload.validUntil)
  )
    fail("VALIDITY", "Authority bundle is outside its validity interval.")
  if (
    options.expectedTrustDomain ===
      RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production &&
    payload.certificates.length > 0
  ) {
    fail(
      "V117_PRODUCTION_UNAVAILABLE",
      "Production v1.17 evidence authority is unavailable.",
    )
  }
  return Object.freeze({ envelope, payload, payloadBytes, payloadSha256 })
}

const generationNumber = (value: string): number =>
  Number(assertGeneration(value, "registryGeneration"))

const parseHighWaterObject = (
  value: unknown,
): Readonly<RuntimeEvidenceAuthorityHighWaterRecord> => {
  const record = requireRecord(
    value,
    "HIGH_WATER",
    "High-water record must be an object.",
  )
  assertExactKeys(
    record,
    ["schemaVersion", "registryGeneration", "payloadSha256"],
    "High-water record",
  )
  if (
    record.schemaVersion !==
    RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_SCHEMA_VERSION
  ) {
    fail("HIGH_WATER", "High-water record schema version is unknown.")
  }
  return Object.freeze({
    schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_SCHEMA_VERSION,
    registryGeneration: assertGeneration(
      record.registryGeneration,
      "registryGeneration",
    ),
    payloadSha256: assertHash(record.payloadSha256, "payloadSha256"),
  })
}

export const parseRuntimeEvidenceAuthorityHighWaterRecord = (
  serialized: string | Uint8Array,
): Readonly<RuntimeEvidenceAuthorityHighWaterRecord> => {
  try {
    const bytes =
      typeof serialized === "string"
        ? textEncoder.encode(serialized)
        : serialized
    if (bytes.byteLength === 0 || bytes.byteLength > 4_096) {
      return fail("HIGH_WATER", "High-water record byte length is invalid.")
    }
    return parseHighWaterObject(JSON.parse(strictTextDecoder.decode(bytes)))
  } catch (error) {
    if (error instanceof RuntimeEvidenceAuthorityBundleError) throw error
    return fail("HIGH_WATER", "High-water record is corrupt.")
  }
}

export const evaluateRuntimeEvidenceAuthorityAntiRollback = (input: {
  candidate: { registryGeneration: string; payloadSha256: string }
  bootstrapMode: boolean
  deploymentPin: RuntimeEvidenceAuthorityBootstrapPin
  durableHighWater?: RuntimeEvidenceAuthorityHighWaterRecord | undefined
}): Readonly<RuntimeEvidenceAuthorityAntiRollbackDecision> => {
  if (
    input.deploymentPin.schemaVersion !==
    RUNTIME_EVIDENCE_AUTHORITY_BOOTSTRAP_SCHEMA_VERSION
  ) {
    fail("BOOTSTRAP_PIN", "Deployment bootstrap pin schema is invalid.")
  }
  const candidateGeneration = generationNumber(
    input.candidate.registryGeneration,
  )
  const candidateHash = assertHash(
    input.candidate.payloadSha256,
    "candidate.payloadSha256",
  )
  const pinGeneration = generationNumber(
    input.deploymentPin.minimumRegistryGeneration,
  )
  const pinHash = assertHash(
    input.deploymentPin.minimumPayloadSha256,
    "deploymentPin.minimumPayloadSha256",
  )
  if (candidateGeneration < pinGeneration) {
    fail(
      "ROLLBACK",
      "Authority bundle is below the deployment-pinned generation.",
    )
  }
  if (candidateGeneration === pinGeneration && candidateHash !== pinHash) {
    fail("PIN_FORK", "Authority bundle conflicts with the deployment pin.")
  }

  const nextHighWater = Object.freeze({
    schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_SCHEMA_VERSION,
    registryGeneration: input.candidate.registryGeneration,
    payloadSha256: candidateHash,
  })
  const highWater = input.durableHighWater
  if (!highWater) {
    if (!input.bootstrapMode) {
      fail(
        "HIGH_WATER_MISSING",
        "Normal startup requires a durable high-water record.",
      )
    }
    if (candidateGeneration !== pinGeneration || candidateHash !== pinHash) {
      fail(
        "BOOTSTRAP_PIN",
        "Initial bootstrap requires the exact deployment-pinned bundle.",
      )
    }
    return Object.freeze({
      executable: false,
      durableInstallRequired: true,
      nextHighWater,
    })
  }
  const highWaterRecord = parseHighWaterObject(highWater)
  const highGeneration = generationNumber(highWaterRecord.registryGeneration)
  if (candidateGeneration < highGeneration) {
    fail(
      "ROLLBACK",
      "Authority bundle is below the durable high-water generation.",
    )
  }
  if (
    candidateGeneration === highGeneration &&
    candidateHash !== highWaterRecord.payloadSha256
  ) {
    fail("GENERATION_FORK", "Authority bundle has a same-generation hash fork.")
  }
  if (candidateGeneration === highGeneration) {
    return Object.freeze({
      executable: true,
      durableInstallRequired: false,
      nextHighWater: highWaterRecord,
    })
  }
  return Object.freeze({
    executable: false,
    durableInstallRequired: true,
    nextHighWater,
  })
}

export const assertRuntimeEvidenceAuthorityAnchorInstalled = (
  decision: RuntimeEvidenceAuthorityAntiRollbackDecision,
): void => {
  if (!decision.executable || decision.durableInstallRequired) {
    fail(
      "ANCHOR_NOT_INSTALLED",
      "The accepted authority high-water anchor must be durably installed before execution.",
    )
  }
}
