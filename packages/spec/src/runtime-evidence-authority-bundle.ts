import { createHash } from "node:crypto"
import {
  hashExecutableLaneIdentity,
  parseExecutableLaneIdentity,
} from "./runtime-evidence-attestation.js"
import type { ExecutableLaneIdentity } from "./runtime-evidence.js"

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

const fail = (code: string, message: string): never => {
  throw new RuntimeEvidenceAuthorityBundleError(code, message)
}

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const GENERATION = /^(?:0|[1-9][0-9]{0,15})$/u
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
  if (
    !GENERATION.test(generation) ||
    !Number.isSafeInteger(Number(generation))
  ) {
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
