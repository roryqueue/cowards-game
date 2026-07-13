import { Buffer } from "node:buffer"
import {
  createHash,
  createPublicKey,
  randomUUID,
  verify as verifySignature,
  type KeyObject,
} from "node:crypto"
import { open as openFile, readFile, rename, unlink } from "node:fs/promises"
import path from "node:path"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  CANONICAL_COMPATIBILITY_TUPLE_FIELDS,
  RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  buildRuntimeEvidenceAuthorityEnvelope,
  encodeRuntimeEvidenceAuthorityPayload,
  encodeRuntimeEvidenceAuthoritySignatureMessage,
  hashRuntimeEvidenceAuthorityPayload,
  inspectRuntimeEvidenceAuthorityBundle,
  parseExecutableLaneIdentity,
  type ExecutableLaneIdentity,
  type RuntimeEvidenceAuthorityPayload,
} from "@cowards/spec"
import type { Pool, PoolClient, QueryResultRow } from "pg"

export const RUNTIME_EVIDENCE_AUTHORITY_IMPORT_SCHEMA_VERSION =
  "v1.37-runtime-evidence-authority-import-v1" as const

const IMPORT_PAYLOAD_KEYS = [
  "schemaVersion",
  "domain",
  "eventId",
  "producerId",
  "producerKeyId",
  "trustDomain",
  "issuedAt",
  "validUntil",
  "action",
  "laneIdentityHash",
  "reasonCode",
  "evidenceReferenceHash",
  "compensatesEventId",
  "targetCertificateId",
  "targetCertificateRecordHash",
  "replacementCertificateId",
  "replacementCertificateRecordHash",
] as const

type ImportDomain =
  | "lane-control"
  | "certificate-revocation"
  | "certificate-supersession"

export interface RuntimeEvidenceAuthorityImportPayload {
  schemaVersion: typeof RUNTIME_EVIDENCE_AUTHORITY_IMPORT_SCHEMA_VERSION
  domain: ImportDomain
  eventId: string
  producerId: string
  producerKeyId: string
  trustDomain: string
  issuedAt: string
  validUntil: string
  action: "disable" | "enable" | null
  laneIdentityHash: string | null
  reasonCode: string
  evidenceReferenceHash: string
  compensatesEventId: string | null
  targetCertificateId: string | null
  targetCertificateRecordHash: string | null
  replacementCertificateId: string | null
  replacementCertificateRecordHash: string | null
}

export interface RuntimeEvidenceAuthorityImportEnvelope {
  payload: RuntimeEvidenceAuthorityImportPayload
  signatureBase64: string
}

export interface RuntimeEvidenceAuthorityImportTrustRoot {
  producerId: string
  keyId: string
  trustDomain: string
  publicKeyPem: string
}

export class RuntimeEvidenceAuthorityPublisherError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = "RuntimeEvidenceAuthorityPublisherError"
  }
}

const fail = (code: string, message: string): never => {
  throw new RuntimeEvidenceAuthorityPublisherError(code, message)
}

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u
const BASE64 =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u

const assertString = (value: unknown, label: string): string => {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > 512
  ) {
    fail("INVALID_IMPORT", `${label} must be a bounded non-empty string.`)
  }
  return value as string
}

const assertHash = (value: unknown, label: string): string => {
  const hash = assertString(value, label)
  if (!SHA256.test(hash))
    fail("INVALID_IMPORT", `${label} must be sha256 identity.`)
  return hash
}

const assertInstant = (value: unknown, label: string): string => {
  const instant = assertString(value, label)
  const parsed = Date.parse(instant)
  if (
    !INSTANT.test(instant) ||
    !Number.isFinite(parsed) ||
    new Date(parsed).toISOString() !== instant
  ) {
    fail("INVALID_IMPORT", `${label} must be an exact UTC millisecond instant.`)
  }
  return instant
}

const nullableString = (value: unknown, label: string): string | null =>
  value === null ? null : assertString(value, label)

const nullableHash = (value: unknown, label: string): string | null =>
  value === null ? null : assertHash(value, label)

const exactPayload = (
  value: unknown,
): Readonly<RuntimeEvidenceAuthorityImportPayload> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail("INVALID_IMPORT", "Signed import payload must be an object.")
  }
  const record = value as Record<string, unknown>
  const actual = Object.keys(record)
  if (
    actual.length !== IMPORT_PAYLOAD_KEYS.length ||
    IMPORT_PAYLOAD_KEYS.some((key) => !Object.hasOwn(record, key))
  ) {
    fail(
      "STRICT_SHAPE",
      "Signed import payload has an unknown or missing field.",
    )
  }
  if (
    record.schemaVersion !== RUNTIME_EVIDENCE_AUTHORITY_IMPORT_SCHEMA_VERSION
  ) {
    fail("SCHEMA_VERSION", "Signed import schema version is unknown.")
  }
  if (
    record.domain !== "lane-control" &&
    record.domain !== "certificate-revocation" &&
    record.domain !== "certificate-supersession"
  ) {
    fail("DOMAIN", "Signed import domain is unknown.")
  }
  const payload: RuntimeEvidenceAuthorityImportPayload = {
    schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_IMPORT_SCHEMA_VERSION,
    domain: record.domain as ImportDomain,
    eventId: assertString(record.eventId, "eventId"),
    producerId: assertString(record.producerId, "producerId"),
    producerKeyId: assertString(record.producerKeyId, "producerKeyId"),
    trustDomain: assertString(record.trustDomain, "trustDomain"),
    issuedAt: assertInstant(record.issuedAt, "issuedAt"),
    validUntil: assertInstant(record.validUntil, "validUntil"),
    action:
      record.action === null ||
      record.action === "disable" ||
      record.action === "enable"
        ? record.action
        : fail("INVALID_IMPORT", "action is invalid."),
    laneIdentityHash: nullableHash(record.laneIdentityHash, "laneIdentityHash"),
    reasonCode: assertString(record.reasonCode, "reasonCode"),
    evidenceReferenceHash: assertHash(
      record.evidenceReferenceHash,
      "evidenceReferenceHash",
    ),
    compensatesEventId: nullableString(
      record.compensatesEventId,
      "compensatesEventId",
    ),
    targetCertificateId: nullableString(
      record.targetCertificateId,
      "targetCertificateId",
    ),
    targetCertificateRecordHash: nullableHash(
      record.targetCertificateRecordHash,
      "targetCertificateRecordHash",
    ),
    replacementCertificateId: nullableString(
      record.replacementCertificateId,
      "replacementCertificateId",
    ),
    replacementCertificateRecordHash: nullableHash(
      record.replacementCertificateRecordHash,
      "replacementCertificateRecordHash",
    ),
  }
  if (Date.parse(payload.issuedAt) > Date.parse(payload.validUntil)) {
    fail("VALIDITY", "Signed import validity is incoherent.")
  }
  if (payload.domain === "lane-control") {
    if (
      payload.laneIdentityHash === null ||
      payload.targetCertificateId !== null ||
      payload.targetCertificateRecordHash !== null ||
      payload.replacementCertificateId !== null ||
      payload.replacementCertificateRecordHash !== null ||
      (payload.action === "disable" && payload.compensatesEventId !== null) ||
      (payload.action === "enable" && payload.compensatesEventId === null) ||
      payload.action === null
    ) {
      fail("DOMAIN", "Lane-control payload fields do not match their domain.")
    }
  } else {
    if (
      payload.action !== null ||
      payload.laneIdentityHash !== null ||
      payload.compensatesEventId !== null ||
      payload.targetCertificateId === null ||
      payload.targetCertificateRecordHash === null
    ) {
      fail("DOMAIN", "Certificate-status fields do not match their domain.")
    }
    if (
      payload.domain === "certificate-revocation" &&
      (payload.replacementCertificateId !== null ||
        payload.replacementCertificateRecordHash !== null)
    ) {
      fail("DOMAIN", "Revocation cannot contain a replacement certificate.")
    }
    if (
      payload.domain === "certificate-supersession" &&
      (payload.replacementCertificateId === null ||
        payload.replacementCertificateRecordHash === null)
    ) {
      fail("DOMAIN", "Supersession requires an exact replacement certificate.")
    }
  }
  return Object.freeze(payload)
}

const parseStoredLaneIdentity = (
  value: unknown,
): Readonly<ExecutableLaneIdentity> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail("CLOSED_GRAPH", "Stored lane identity must be an object.")
  }
  const record = value as Record<string, unknown>
  const tuple = record.semanticTuple
  if (tuple === null || typeof tuple !== "object" || Array.isArray(tuple)) {
    fail("CLOSED_GRAPH", "Stored lane semantic tuple must be an object.")
  }
  const tupleRecord = tuple as Record<string, unknown>
  const tupleKeys = Object.keys(tupleRecord)
  if (
    tupleKeys.length !== CANONICAL_COMPATIBILITY_TUPLE_FIELDS.length ||
    CANONICAL_COMPATIBILITY_TUPLE_FIELDS.some(
      (field) => !Object.hasOwn(tupleRecord, field),
    )
  ) {
    fail(
      "CLOSED_GRAPH",
      "Stored lane semantic tuple has an unknown or missing field.",
    )
  }
  try {
    return parseExecutableLaneIdentity({
      ...record,
      semanticTuple: Object.fromEntries(
        CANONICAL_COMPATIBILITY_TUPLE_FIELDS.map((field) => [
          field,
          tupleRecord[field],
        ]),
      ),
    } as unknown as ExecutableLaneIdentity)
  } catch {
    return fail("CLOSED_GRAPH", "Stored lane identity is not canonical.")
  }
}

export const encodeRuntimeEvidenceAuthorityImportPayload = (
  payload: RuntimeEvidenceAuthorityImportPayload,
): Uint8Array => new TextEncoder().encode(JSON.stringify(exactPayload(payload)))

interface VerifiedImport {
  payload: Readonly<RuntimeEvidenceAuthorityImportPayload>
  payloadBytes: Uint8Array
  signatureBase64: string
  envelopeHash: string
}

const verifyImport = (
  envelope: RuntimeEvidenceAuthorityImportEnvelope,
  expectedDomain: ImportDomain,
  verificationInstant: string,
  trustRoots: readonly RuntimeEvidenceAuthorityImportTrustRoot[],
): VerifiedImport => {
  const payload = exactPayload(globalThis.structuredClone(envelope.payload))
  if (payload.domain !== expectedDomain) {
    fail("DOMAIN", `Expected ${expectedDomain} signed import domain.`)
  }
  const instant = assertInstant(verificationInstant, "verificationInstant")
  if (
    Date.parse(instant) < Date.parse(payload.issuedAt) ||
    Date.parse(instant) > Date.parse(payload.validUntil)
  ) {
    fail("VALIDITY", "Signed import is not current at verification time.")
  }
  const root = trustRoots.find(
    (candidate) =>
      candidate.producerId === payload.producerId &&
      candidate.keyId === payload.producerKeyId &&
      candidate.trustDomain === payload.trustDomain,
  )
  if (!root)
    return fail(
      "UNKNOWN_KEY",
      "Signed import producer/key/domain is not trusted.",
    )
  const signature = assertString(envelope.signatureBase64, "signatureBase64")
  if (!BASE64.test(signature) || signature.length % 4 !== 0) {
    fail("SIGNATURE", "Signed import signature is not canonical base64.")
  }
  const signatureBytes = Buffer.from(signature, "base64")
  if (
    signatureBytes.length !== 64 ||
    signatureBytes.toString("base64") !== signature
  ) {
    fail(
      "SIGNATURE",
      "Signed import signature must be an exact Ed25519 signature.",
    )
  }
  const payloadBytes = encodeRuntimeEvidenceAuthorityImportPayload(payload)
  let publicKey: KeyObject
  try {
    publicKey = createPublicKey(root.publicKeyPem)
  } catch {
    return fail("UNKNOWN_KEY", "Configured authority public key is invalid.")
  }
  if (!verifySignature(null, payloadBytes, publicKey, signatureBytes)) {
    fail("SIGNATURE", "Signed import signature verification failed.")
  }
  const envelopeHash = createHash("sha256")
    .update("cowards-game:runtime-evidence-authority-import-envelope:v1\0")
    .update(payloadBytes)
    .update("\0")
    .update(signatureBytes)
    .digest("hex")
  return { payload, payloadBytes, signatureBase64: signature, envelopeHash }
}

const withSerializableTransaction = async <T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const client = await pool.connect()
    try {
      await client.query("begin isolation level serializable")
      const result = await fn(client)
      await client.query("commit")
      return result
    } catch (error) {
      await client.query("rollback")
      if (
        attempt < 3 &&
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "40001"
      ) {
        continue
      }
      throw error
    } finally {
      client.release()
    }
  }
  return fail(
    "SERIALIZATION_FAILURE",
    "Serializable transaction retry exhausted.",
  )
}

const storedHash = (hash: string): string => hash.slice("sha256:".length)

const assertExactImportedRow = (
  row: QueryResultRow,
  verified: VerifiedImport,
): void => {
  if (
    row.id !== verified.payload.eventId ||
    row.signed_payload !==
      Buffer.from(verified.payloadBytes).toString("utf8") ||
    row.signature_base64 !== verified.signatureBase64 ||
    row.envelope_hash !== verified.envelopeHash
  ) {
    fail(
      "IMPORT_CONFLICT",
      "Existing signed import conflicts with exact envelope.",
    )
  }
}

export interface ImportedRuntimeLaneControl {
  controlId: string
  envelopeHash: string
  effectiveDisabled: boolean
}

export const importAuthenticatedRuntimeLaneControl = async (
  pool: Pool,
  input: {
    envelope: RuntimeEvidenceAuthorityImportEnvelope
    verificationInstant: string
    expectedLaneIdentityHash: string
    trustedOperators: readonly RuntimeEvidenceAuthorityImportTrustRoot[]
  },
): Promise<Readonly<ImportedRuntimeLaneControl>> => {
  const expectedLane = assertHash(
    input.expectedLaneIdentityHash,
    "expectedLaneIdentityHash",
  )
  const immutable = globalThis.structuredClone(input.envelope)
  const preflight = verifyImport(
    immutable,
    "lane-control",
    input.verificationInstant,
    input.trustedOperators,
  )
  if (preflight.payload.laneIdentityHash !== expectedLane) {
    fail(
      "LANE_MISMATCH",
      "Signed control does not match the exact lane identity.",
    )
  }
  return withSerializableTransaction(pool, async (client) => {
    const verified = verifyImport(
      immutable,
      "lane-control",
      input.verificationInstant,
      input.trustedOperators,
    )
    const payload = verified.payload
    if (payload.laneIdentityHash !== expectedLane) {
      fail(
        "LANE_MISMATCH",
        "Signed control does not match the exact lane identity.",
      )
    }
    await client.query("select pg_advisory_xact_lock(hashtext($1))", [
      expectedLane,
    ])
    const existing = await client.query(
      `select id, signed_payload, signature_base64, envelope_hash
         from runtime_evidence_lane_controls where envelope_hash = $1`,
      [verified.envelopeHash],
    )
    if (existing.rows[0]) {
      assertExactImportedRow(existing.rows[0], verified)
    } else {
      if (payload.action === "enable") {
        const compensated = await client.query(
          `select id, action, lane_identity_hash
             from runtime_evidence_lane_controls where id = $1 for update`,
          [payload.compensatesEventId],
        )
        if (
          compensated.rows[0]?.action !== "disable" ||
          compensated.rows[0]?.lane_identity_hash !== expectedLane
        ) {
          fail(
            "CONTROL_COMPENSATION",
            "Enable does not compensate an exact disable.",
          )
        }
      }
      await client.query(
        `insert into runtime_evidence_lane_controls
          (id, action, lane_identity_hash, reason_code, evidence_reference_hash,
           compensates_control_id, producer_id, producer_key_id, trust_domain,
           schema_version, signed_payload, signature_base64, envelope_hash,
           issued_at, valid_until)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          payload.eventId,
          payload.action,
          expectedLane,
          payload.reasonCode,
          payload.evidenceReferenceHash,
          payload.compensatesEventId,
          payload.producerId,
          payload.producerKeyId,
          payload.trustDomain,
          payload.schemaVersion,
          Buffer.from(verified.payloadBytes).toString("utf8"),
          verified.signatureBase64,
          verified.envelopeHash,
          payload.issuedAt,
          payload.validUntil,
        ],
      )
    }
    const active = await client.query(
      `select exists (
         select 1 from runtime_evidence_lane_controls disabled
          where disabled.lane_identity_hash = $1 and disabled.action = 'disable'
            and not exists (
              select 1 from runtime_evidence_lane_controls enabled
               where enabled.compensates_control_id = disabled.id
            )
       ) as disabled`,
      [expectedLane],
    )
    return Object.freeze({
      controlId: payload.eventId,
      envelopeHash: verified.envelopeHash,
      effectiveDisabled: active.rows[0]?.disabled === true,
    })
  })
}

interface CertificateEvidenceRow extends QueryResultRow {
  id: string
  certificate_record_hash: string
  verified_attestation_id: string
  result_graph_hash: string
}

const loadExactCertificate = async (
  client: PoolClient,
  certificateId: string,
  signedRecordHash: string,
): Promise<CertificateEvidenceRow> => {
  const result = await client.query<CertificateEvidenceRow>(
    `select c.id, c.certificate_record_hash, c.verified_attestation_id,
            a.result_graph_hash
       from runtime_evidence_certificates c
       join runtime_evidence_verified_attestations a
         on a.id = c.verified_attestation_id
        and a.verification_status = 'passed'
        and a.result_graph_hash = c.result_graph_hash
      where c.id = $1 and c.certificate_status = 'passed'`,
    [certificateId],
  )
  const row = result.rows[0]
  if (!row || row.certificate_record_hash !== storedHash(signedRecordHash)) {
    fail(
      "UNKNOWN_CERTIFICATE",
      "Signed status target lacks exact verified evidence.",
    )
  }
  return row as CertificateEvidenceRow
}

interface ImportedCertificateStatus {
  statusId: string
  envelopeHash: string
}

type StatusInput = {
  envelope: RuntimeEvidenceAuthorityImportEnvelope
  verificationInstant: string
  trustedAuthorities: readonly RuntimeEvidenceAuthorityImportTrustRoot[]
}

const importCertificateStatus = async (
  pool: Pool,
  input: StatusInput,
  domain: "certificate-revocation" | "certificate-supersession",
): Promise<Readonly<ImportedCertificateStatus>> => {
  const immutable = globalThis.structuredClone(input.envelope)
  verifyImport(
    immutable,
    domain,
    input.verificationInstant,
    input.trustedAuthorities,
  )
  return withSerializableTransaction(pool, async (client) => {
    const verified = verifyImport(
      immutable,
      domain,
      input.verificationInstant,
      input.trustedAuthorities,
    )
    const payload = verified.payload
    await client.query(
      "select pg_advisory_xact_lock(hashtext('runtime-evidence-certificate-status-v1'))",
    )
    const table =
      domain === "certificate-revocation"
        ? "runtime_evidence_certificate_revocations"
        : "runtime_evidence_certificate_supersessions"
    const existing = await client.query(
      `select id, signed_payload, signature_base64, envelope_hash
         from ${table} where envelope_hash = $1`,
      [verified.envelopeHash],
    )
    if (existing.rows[0]) {
      assertExactImportedRow(existing.rows[0], verified)
      return Object.freeze({
        statusId: payload.eventId,
        envelopeHash: verified.envelopeHash,
      })
    }
    const target = await loadExactCertificate(
      client,
      payload.targetCertificateId!,
      payload.targetCertificateRecordHash!,
    )
    if (domain === "certificate-revocation") {
      await client.query(
        `insert into runtime_evidence_certificate_revocations
          (id, target_certificate_id, target_certificate_record_hash,
           verified_attestation_id, evidence_graph_hash, reason_code,
           evidence_reference_hash, producer_id, producer_key_id, trust_domain,
           schema_version, signed_payload, signature_base64, envelope_hash,
           issued_at, valid_until)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          payload.eventId,
          target.id,
          target.certificate_record_hash,
          target.verified_attestation_id,
          target.result_graph_hash,
          payload.reasonCode,
          payload.evidenceReferenceHash,
          payload.producerId,
          payload.producerKeyId,
          payload.trustDomain,
          payload.schemaVersion,
          Buffer.from(verified.payloadBytes).toString("utf8"),
          verified.signatureBase64,
          verified.envelopeHash,
          payload.issuedAt,
          payload.validUntil,
        ],
      )
    } else {
      if (payload.targetCertificateId === payload.replacementCertificateId) {
        fail("SUPERSESSION_CYCLE", "Certificate cannot supersede itself.")
      }
      const replacement = await loadExactCertificate(
        client,
        payload.replacementCertificateId!,
        payload.replacementCertificateRecordHash!,
      )
      const cycle = await client.query(
        `with recursive chain(certificate_id) as (
           select $1::text
           union all
           select s.replacement_certificate_id
             from runtime_evidence_certificate_supersessions s
             join chain c on s.target_certificate_id = c.certificate_id
         )
         select exists (select 1 from chain where certificate_id = $2) as cycle`,
        [replacement.id, target.id],
      )
      if (cycle.rows[0]?.cycle === true) {
        fail(
          "SUPERSESSION_CYCLE",
          "Certificate supersession graph contains a cycle.",
        )
      }
      await client.query(
        `insert into runtime_evidence_certificate_supersessions
          (id, target_certificate_id, target_certificate_record_hash,
           target_verified_attestation_id, target_evidence_graph_hash,
           replacement_certificate_id, replacement_certificate_record_hash,
           replacement_verified_attestation_id, replacement_evidence_graph_hash,
           reason_code, evidence_reference_hash, producer_id, producer_key_id,
           trust_domain, schema_version, signed_payload, signature_base64,
           envelope_hash, issued_at, valid_until)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          payload.eventId,
          target.id,
          target.certificate_record_hash,
          target.verified_attestation_id,
          target.result_graph_hash,
          replacement.id,
          replacement.certificate_record_hash,
          replacement.verified_attestation_id,
          replacement.result_graph_hash,
          payload.reasonCode,
          payload.evidenceReferenceHash,
          payload.producerId,
          payload.producerKeyId,
          payload.trustDomain,
          payload.schemaVersion,
          Buffer.from(verified.payloadBytes).toString("utf8"),
          verified.signatureBase64,
          verified.envelopeHash,
          payload.issuedAt,
          payload.validUntil,
        ],
      )
    }
    return Object.freeze({
      statusId: payload.eventId,
      envelopeHash: verified.envelopeHash,
    })
  })
}

export const importAuthenticatedCertificateRevocation = (
  pool: Pool,
  input: StatusInput,
): Promise<Readonly<ImportedCertificateStatus>> =>
  importCertificateStatus(pool, input, "certificate-revocation")

export const importAuthenticatedCertificateSupersession = (
  pool: Pool,
  input: StatusInput,
): Promise<Readonly<ImportedCertificateStatus>> =>
  importCertificateStatus(pool, input, "certificate-supersession")

const PUBLICATION_BUNDLE_VERSION = "v1.37-runtime-evidence-authority-v1"
const PUBLICATION_SOURCE_DOMAIN =
  "cowards-game:runtime-evidence-authority-publication-sources:v1"
const PUBLICATION_ENVELOPE_DOMAIN =
  "cowards-game:runtime-evidence-authority-publication-envelope:v1"

type PublicationSourceType =
  | "attestation"
  | "certificate"
  | "revocation"
  | "supersession"
  | "lane-control"

interface PublicationSource {
  type: PublicationSourceType
  id: string
  recordHash: string
}

interface SnapshotAttestationRow extends QueryResultRow {
  id: string
  attestation_sha256: string
  trust_domain: string
  producer_id: string
  result_graph_hash: string
}

interface SnapshotCertificateRow extends QueryResultRow {
  id: string
  certificate_kind: "containment" | "conformance"
  certificate_version: string
  certificate_record_hash: string
  lane_identity_hash: string
  lane_identity: ExecutableLaneIdentity
  verified_attestation_id: string
  result_graph_hash: string
  issued_at: Date | string
  fresh_until: Date | string
}

interface SnapshotControlRow extends QueryResultRow {
  id: string
  sequence: string | number
  action: "disable" | "enable"
  lane_identity_hash: string
  reason_code: string
  compensates_control_id: string | null
  producer_id: string
  producer_key_id: string
  trust_domain: string
  schema_version: string
  signed_payload: string
  signature_base64: string
  envelope_hash: string
  issued_at: Date | string
  valid_until: Date | string
  verification_status: "passed"
}

interface SnapshotRevocationRow extends QueryResultRow {
  id: string
  target_certificate_id: string
  target_certificate_record_hash: string
  verified_attestation_id: string
  evidence_graph_hash: string
  reason_code: string
  producer_id: string
  producer_key_id: string
  trust_domain: string
  schema_version: string
  signed_payload: string
  signature_base64: string
  envelope_hash: string
  issued_at: Date | string
  valid_until: Date | string
  verification_status: "passed"
}

interface SnapshotSupersessionRow extends QueryResultRow {
  id: string
  target_certificate_id: string
  target_certificate_record_hash: string
  target_verified_attestation_id: string
  target_evidence_graph_hash: string
  replacement_certificate_id: string
  replacement_certificate_record_hash: string
  replacement_verified_attestation_id: string
  replacement_evidence_graph_hash: string
  reason_code: string
  producer_id: string
  producer_key_id: string
  trust_domain: string
  schema_version: string
  signed_payload: string
  signature_base64: string
  envelope_hash: string
  issued_at: Date | string
  valid_until: Date | string
  verification_status: "passed"
}

export interface PrepareRuntimeEvidenceAuthorityPublicationInput {
  bundleVersion?: string
  issuedAt: string
  validFrom: string
  validUntil: string
  trustDomain: string
  signerKeyId: string
  trustedImportAuthorities: readonly RuntimeEvidenceAuthorityImportTrustRoot[]
  signMessage(
    messageBytes: Uint8Array,
  ): Uint8Array | Buffer | Promise<Uint8Array | Buffer>
}

export interface PreparedRuntimeEvidenceAuthorityPublication {
  publicationId: string
  generation: string
  payloadSha256: string
  envelopeSha256: string
  sourceManifestHash: string
  envelopeBytes: Uint8Array
  sourceIds: Readonly<{
    attestationIds: readonly string[]
    certificateIds: readonly string[]
    revocationIds: readonly string[]
    supersessionIds: readonly string[]
    laneControlIds: readonly string[]
  }>
}

const prefixedHash = (value: string, label: string): string => {
  const prefixed = value.startsWith("sha256:") ? value : `sha256:${value}`
  return assertHash(prefixed, label)
}

const isoInstant = (value: Date | string, label: string): string =>
  assertInstant(value instanceof Date ? value.toISOString() : value, label)

const hashPublicationBytes = (domain: string, bytes: Uint8Array): string =>
  `sha256:${createHash("sha256")
    .update(domain)
    .update("\0")
    .update(bytes)
    .digest("hex")}`

const parsePersistedImport = (
  row: {
    id: string
    signed_payload: string
    signature_base64: string
    envelope_hash: string
  },
  domain: ImportDomain,
  verificationInstant: string,
  trustRoots: readonly RuntimeEvidenceAuthorityImportTrustRoot[],
): VerifiedImport => {
  let payload: unknown
  try {
    payload = JSON.parse(row.signed_payload)
  } catch {
    return fail(
      "UNVERIFIED_SOURCE",
      "Persisted authority source payload is invalid.",
    )
  }
  const verified = verifyImport(
    {
      payload: payload as RuntimeEvidenceAuthorityImportPayload,
      signatureBase64: row.signature_base64,
    },
    domain,
    verificationInstant,
    trustRoots,
  )
  assertExactImportedRow(row as QueryResultRow, verified)
  return verified
}

const assertStatusRowMatchesPayload = (
  row: SnapshotRevocationRow | SnapshotSupersessionRow,
  verified: VerifiedImport,
): void => {
  const payload = verified.payload
  if (
    payload.targetCertificateId !== row.target_certificate_id ||
    storedHash(payload.targetCertificateRecordHash!) !==
      row.target_certificate_record_hash ||
    payload.reasonCode !== row.reason_code ||
    payload.producerId !== row.producer_id ||
    payload.producerKeyId !== row.producer_key_id ||
    payload.trustDomain !== row.trust_domain ||
    payload.schemaVersion !== row.schema_version
  ) {
    fail(
      "UNVERIFIED_SOURCE",
      "Certificate status source does not match its signed payload.",
    )
  }
  if (
    "replacement_certificate_id" in row &&
    (payload.replacementCertificateId !== row.replacement_certificate_id ||
      storedHash(payload.replacementCertificateRecordHash!) !==
        row.replacement_certificate_record_hash)
  ) {
    fail(
      "UNVERIFIED_SOURCE",
      "Supersession replacement does not match its signed payload.",
    )
  }
}

const loadPublicationSnapshot = async (
  client: PoolClient,
  input: PrepareRuntimeEvidenceAuthorityPublicationInput,
): Promise<{
  payload: Omit<RuntimeEvidenceAuthorityPayload, "registryGeneration">
  sources: readonly PublicationSource[]
  sourceIds: PreparedRuntimeEvidenceAuthorityPublication["sourceIds"]
}> => {
  const certificatesResult = await client.query<SnapshotCertificateRow>(
    `select c.id, c.certificate_kind, c.certificate_version,
            c.certificate_record_hash, c.lane_identity_hash, c.lane_identity,
            c.verified_attestation_id, c.result_graph_hash,
            c.issued_at, c.fresh_until
       from runtime_evidence_certificates c
       join runtime_evidence_verified_attestations a
         on a.id = c.verified_attestation_id
        and a.verification_status = 'passed'
        and a.result_graph_hash = c.result_graph_hash
      where c.certificate_status = 'passed'
        and c.issued_at <= $1::timestamptz
        and c.fresh_until >= $2::timestamptz
      order by c.id`,
    [input.validFrom, input.validUntil],
  )
  const certificates = certificatesResult.rows
  const certificateIds = certificates.map((row) => row.id)
  const attestationIds = [
    ...new Set(certificates.map((row) => row.verified_attestation_id)),
  ].sort((left, right) => left.localeCompare(right))
  const attestationsResult =
    attestationIds.length === 0
      ? { rows: [] as SnapshotAttestationRow[] }
      : await client.query<SnapshotAttestationRow>(
          `select id, attestation_sha256, trust_domain, producer_id,
                  result_graph_hash
             from runtime_evidence_verified_attestations
            where id = any($1::text[]) and verification_status = 'passed'
            order by id`,
          [attestationIds],
        )
  if (attestationsResult.rows.length !== attestationIds.length) {
    fail("CLOSED_GRAPH", "Certificate snapshot has a dangling attestation.")
  }

  const controlsResult = await client.query<SnapshotControlRow>(
    `select id, sequence, action, lane_identity_hash, reason_code,
            compensates_control_id, producer_id, producer_key_id, trust_domain,
            schema_version, signed_payload, signature_base64, envelope_hash,
            issued_at, valid_until, verification_status
       from runtime_evidence_lane_controls
      where verification_status = 'passed' order by sequence, id`,
  )
  for (const row of controlsResult.rows) {
    const verified = parsePersistedImport(
      row,
      "lane-control",
      input.validFrom,
      input.trustedImportAuthorities,
    )
    if (
      verified.payload.laneIdentityHash !== row.lane_identity_hash ||
      verified.payload.action !== row.action ||
      verified.payload.compensatesEventId !== row.compensates_control_id ||
      verified.payload.reasonCode !== row.reason_code
    ) {
      fail(
        "UNVERIFIED_SOURCE",
        "Lane control does not match its signed payload.",
      )
    }
  }

  const revocationsResult = await client.query<SnapshotRevocationRow>(
    `select r.* from runtime_evidence_certificate_revocations r
       join runtime_evidence_certificates c
         on c.id = r.target_certificate_id
        and c.certificate_record_hash = r.target_certificate_record_hash
        and c.verified_attestation_id = r.verified_attestation_id
        and c.result_graph_hash = r.evidence_graph_hash
      where r.verification_status = 'passed'
        and r.target_certificate_id = any($1::text[])
      order by r.id`,
    [certificateIds],
  )
  for (const row of revocationsResult.rows) {
    const verified = parsePersistedImport(
      row,
      "certificate-revocation",
      input.validFrom,
      input.trustedImportAuthorities,
    )
    assertStatusRowMatchesPayload(row, verified)
  }

  const supersessionsResult = await client.query<SnapshotSupersessionRow>(
    `select s.* from runtime_evidence_certificate_supersessions s
       join runtime_evidence_certificates target
         on target.id = s.target_certificate_id
        and target.certificate_record_hash = s.target_certificate_record_hash
        and target.verified_attestation_id = s.target_verified_attestation_id
        and target.result_graph_hash = s.target_evidence_graph_hash
       join runtime_evidence_certificates replacement
         on replacement.id = s.replacement_certificate_id
        and replacement.certificate_record_hash = s.replacement_certificate_record_hash
        and replacement.verified_attestation_id = s.replacement_verified_attestation_id
        and replacement.result_graph_hash = s.replacement_evidence_graph_hash
      where s.verification_status = 'passed'
        and s.target_certificate_id = any($1::text[])
        and s.replacement_certificate_id = any($1::text[])
      order by s.id`,
    [certificateIds],
  )
  for (const row of supersessionsResult.rows) {
    const verified = parsePersistedImport(
      row,
      "certificate-supersession",
      input.validFrom,
      input.trustedImportAuthorities,
    )
    assertStatusRowMatchesPayload(row, verified)
  }

  const certificateIdSet = new Set(certificateIds)
  for (const row of revocationsResult.rows) {
    if (!certificateIdSet.has(row.target_certificate_id)) {
      fail("CLOSED_GRAPH", "Revocation target is absent from the snapshot.")
    }
  }
  const supersededBy = new Map<string, string>()
  for (const row of supersessionsResult.rows) {
    if (
      !certificateIdSet.has(row.target_certificate_id) ||
      !certificateIdSet.has(row.replacement_certificate_id)
    ) {
      fail("CLOSED_GRAPH", "Supersession target is absent from the snapshot.")
    }
    supersededBy.set(row.target_certificate_id, row.replacement_certificate_id)
  }
  for (const origin of supersededBy.keys()) {
    const visited = new Set<string>()
    let cursor: string | undefined = origin
    while (cursor !== undefined) {
      if (visited.has(cursor))
        fail(
          "SUPERSESSION_CYCLE",
          "Snapshot supersession graph contains a cycle.",
        )
      visited.add(cursor)
      cursor = supersededBy.get(cursor)
    }
  }

  if (
    input.trustDomain === RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production
  ) {
    if (
      attestationsResult.rows.some(
        (row) =>
          row.trust_domain.toLowerCase().includes("fixture") ||
          row.producer_id.toLowerCase().includes("fixture"),
      ) ||
      controlsResult.rows.some(
        (row) =>
          row.trust_domain.toLowerCase().includes("fixture") ||
          row.producer_id.toLowerCase().includes("fixture"),
      ) ||
      revocationsResult.rows.some(
        (row) =>
          row.trust_domain.toLowerCase().includes("fixture") ||
          row.producer_id.toLowerCase().includes("fixture"),
      ) ||
      supersessionsResult.rows.some(
        (row) =>
          row.trust_domain.toLowerCase().includes("fixture") ||
          row.producer_id.toLowerCase().includes("fixture"),
      )
    ) {
      fail(
        "PRODUCTION_FIXTURE",
        "Fixture-domain evidence cannot enter production authority.",
      )
    }
    if (certificates.some((row) => row.certificate_kind === "conformance")) {
      fail(
        "CONFORMANCE_NOT_ENABLED",
        "Production conformance authority is unavailable until Phase 259.",
      )
    }
  }

  const uncompensated = new Map<string, SnapshotControlRow>()
  for (const row of controlsResult.rows) {
    if (row.action === "disable") {
      uncompensated.set(row.id, row)
    } else if (!uncompensated.delete(row.compensates_control_id!)) {
      fail("CLOSED_GRAPH", "Lane enable has no selected disable.")
    }
  }
  const activeDisableByLane = new Map<string, SnapshotControlRow>()
  for (const row of uncompensated.values()) {
    activeDisableByLane.set(row.lane_identity_hash, row)
  }

  const sources: PublicationSource[] = [
    ...attestationsResult.rows.map((row) => ({
      type: "attestation" as const,
      id: row.id,
      recordHash: prefixedHash(row.attestation_sha256, "attestation hash"),
    })),
    ...certificates.map((row) => ({
      type: "certificate" as const,
      id: row.id,
      recordHash: prefixedHash(row.certificate_record_hash, "certificate hash"),
    })),
    ...revocationsResult.rows.map((row) => ({
      type: "revocation" as const,
      id: row.id,
      recordHash: prefixedHash(row.envelope_hash, "revocation hash"),
    })),
    ...supersessionsResult.rows.map((row) => ({
      type: "supersession" as const,
      id: row.id,
      recordHash: prefixedHash(row.envelope_hash, "supersession hash"),
    })),
    ...controlsResult.rows.map((row) => ({
      type: "lane-control" as const,
      id: row.id,
      recordHash: prefixedHash(row.envelope_hash, "control hash"),
    })),
  ].sort((left, right) =>
    left.type === right.type
      ? left.id.localeCompare(right.id)
      : left.type.localeCompare(right.type),
  )

  return {
    payload: {
      schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
      bundleVersion: assertString(
        input.bundleVersion ?? PUBLICATION_BUNDLE_VERSION,
        "bundleVersion",
      ),
      issuedAt: assertInstant(input.issuedAt, "issuedAt"),
      validFrom: assertInstant(input.validFrom, "validFrom"),
      validUntil: assertInstant(input.validUntil, "validUntil"),
      semanticTupleManifestHash: CANONICAL_COMPATIBILITY_TUPLES[0]!.tupleId,
      attestations: Object.freeze(
        attestationsResult.rows.map((row) =>
          Object.freeze({
            attestationId: row.id,
            attestationHash: prefixedHash(
              row.attestation_sha256,
              "attestation hash",
            ),
            verified: true as const,
            imports: Object.freeze([] as string[]),
          }),
        ),
      ),
      certificates: Object.freeze(
        certificates.map((row) =>
          Object.freeze({
            kind: row.certificate_kind,
            certificateId: row.id,
            certificateVersion: row.certificate_version,
            certificateRecordHash: prefixedHash(
              row.certificate_record_hash,
              "certificate record hash",
            ),
            laneIdentityHash: assertHash(
              row.lane_identity_hash,
              "lane identity hash",
            ),
            laneIdentity: parseStoredLaneIdentity(row.lane_identity),
            issuedAt: isoInstant(row.issued_at, "certificate issuedAt"),
            freshUntil: isoInstant(row.fresh_until, "certificate freshUntil"),
            attestationIds: Object.freeze([row.verified_attestation_id]),
          }),
        ),
      ),
      revocations: Object.freeze(
        revocationsResult.rows.map((row) =>
          Object.freeze({
            certificateId: row.target_certificate_id,
            certificateRecordHash: prefixedHash(
              row.target_certificate_record_hash,
              "revocation certificate hash",
            ),
            revokedAt: isoInstant(row.issued_at, "revokedAt"),
            reasonCode: row.reason_code,
          }),
        ),
      ),
      supersessions: Object.freeze(
        supersessionsResult.rows.map((row) =>
          Object.freeze({
            certificateId: row.target_certificate_id,
            supersededByCertificateId: row.replacement_certificate_id,
          }),
        ),
      ),
      operatorLaneDisables: Object.freeze(
        [...activeDisableByLane.values()]
          .sort((left, right) =>
            left.lane_identity_hash.localeCompare(right.lane_identity_hash),
          )
          .map((row) =>
            Object.freeze({
              laneIdentityHash: row.lane_identity_hash,
              disabledAt: isoInstant(row.issued_at, "disabledAt"),
              reasonCode: row.reason_code,
            }),
          ),
      ),
    },
    sources: Object.freeze(sources),
    sourceIds: Object.freeze({
      attestationIds: Object.freeze(attestationIds),
      certificateIds: Object.freeze(certificateIds),
      revocationIds: Object.freeze(revocationsResult.rows.map((row) => row.id)),
      supersessionIds: Object.freeze(
        supersessionsResult.rows.map((row) => row.id),
      ),
      laneControlIds: Object.freeze(controlsResult.rows.map((row) => row.id)),
    }),
  }
}

const sourceReferenceColumn = (sourceType: PublicationSourceType): string =>
  ({
    attestation: "attestation_id",
    certificate: "certificate_id",
    revocation: "revocation_id",
    supersession: "supersession_id",
    "lane-control": "lane_control_id",
  })[sourceType]

export const prepareRuntimeEvidenceAuthorityPublication = async (
  pool: Pool,
  input: PrepareRuntimeEvidenceAuthorityPublicationInput,
): Promise<Readonly<PreparedRuntimeEvidenceAuthorityPublication>> => {
  assertString(input.trustDomain, "trustDomain")
  assertString(input.signerKeyId, "signerKeyId")
  assertInstant(input.issuedAt, "issuedAt")
  assertInstant(input.validFrom, "validFrom")
  assertInstant(input.validUntil, "validUntil")
  return withSerializableTransaction(pool, async (client) => {
    await client.query(
      "select pg_advisory_xact_lock(hashtext('runtime-evidence-authority-publication-v1'))",
    )
    const head = await client.query<{ next_generation: string | number }>(
      `select next_generation from runtime_evidence_authority_publication_head
        where singleton = true for update`,
    )
    const generation = String(head.rows[0]?.next_generation ?? "")
    if (!/^(?:0|[1-9][0-9]{0,15})$/u.test(generation)) {
      fail("PUBLICATION_HEAD", "Authority publication head is invalid.")
    }
    const snapshot = await loadPublicationSnapshot(client, input)
    const payload: RuntimeEvidenceAuthorityPayload = {
      ...snapshot.payload,
      registryGeneration: generation,
    }
    const payloadBytes = encodeRuntimeEvidenceAuthorityPayload(payload)
    const signatureMessage = encodeRuntimeEvidenceAuthoritySignatureMessage({
      trustDomain: input.trustDomain,
      keyId: input.signerKeyId,
      payloadBytes,
    })
    let signature: Uint8Array
    try {
      signature = new Uint8Array(
        await input.signMessage(new Uint8Array(signatureMessage)),
      )
    } catch {
      return fail("SIGNER_FAILURE", "External authority signer failed.")
    }
    const envelope = buildRuntimeEvidenceAuthorityEnvelope({
      trustDomain: input.trustDomain,
      keyId: input.signerKeyId,
      payloadBytes,
      signature,
    })
    const envelopeBytes = new TextEncoder().encode(JSON.stringify(envelope))
    const payloadSha256 = hashRuntimeEvidenceAuthorityPayload(payloadBytes)
    const envelopeSha256 = hashPublicationBytes(
      PUBLICATION_ENVELOPE_DOMAIN,
      envelopeBytes,
    )
    const sourceManifestHash = hashPublicationBytes(
      PUBLICATION_SOURCE_DOMAIN,
      new TextEncoder().encode(JSON.stringify(snapshot.sources)),
    )
    const publicationId = `runtime-evidence-authority:${generation}:${payloadSha256.slice("sha256:".length)}`
    await client.query(
      `insert into runtime_evidence_authority_publications
        (id, generation, semantic_tuple_manifest_hash, source_manifest_hash,
         payload_sha256, envelope_sha256, signer_key_id, trust_domain,
         issued_at, valid_from, valid_until, payload_bytes, envelope_bytes,
         attestation_ids, certificate_ids, revocation_ids, supersession_ids,
         lane_control_ids)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        publicationId,
        generation,
        payload.semanticTupleManifestHash,
        sourceManifestHash,
        payloadSha256,
        envelopeSha256,
        input.signerKeyId,
        input.trustDomain,
        payload.issuedAt,
        payload.validFrom,
        payload.validUntil,
        Buffer.from(payloadBytes),
        Buffer.from(envelopeBytes),
        JSON.stringify(snapshot.sourceIds.attestationIds),
        JSON.stringify(snapshot.sourceIds.certificateIds),
        JSON.stringify(snapshot.sourceIds.revocationIds),
        JSON.stringify(snapshot.sourceIds.supersessionIds),
        JSON.stringify(snapshot.sourceIds.laneControlIds),
      ],
    )
    for (const source of snapshot.sources) {
      const referenceColumn = sourceReferenceColumn(source.type)
      await client.query(
        `insert into runtime_evidence_authority_publication_sources
          (publication_id, source_type, source_id, source_record_hash, ${referenceColumn})
         values ($1,$2,$3,$4,$3)`,
        [publicationId, source.type, source.id, source.recordHash],
      )
    }
    await client.query(
      `insert into runtime_evidence_authority_publication_events
        (id, publication_id, event_kind, attempt_id, envelope_sha256, receipt)
       values ($1,$2,'prepared',$3,$4,$5)`,
      [
        `${publicationId}:prepared`,
        publicationId,
        `prepare:${generation}`,
        envelopeSha256,
        JSON.stringify({
          schemaVersion:
            "v1.37-runtime-evidence-authority-publication-receipt-v1",
          generation,
          payloadSha256,
          sourceManifestHash,
        }),
      ],
    )
    await client.query(
      `update runtime_evidence_authority_publication_head
          set next_generation = next_generation + 1 where singleton = true`,
    )
    return Object.freeze({
      publicationId,
      generation,
      payloadSha256,
      envelopeSha256,
      sourceManifestHash,
      envelopeBytes: new Uint8Array(envelopeBytes),
      sourceIds: snapshot.sourceIds,
    })
  })
}

export interface RuntimeEvidenceAuthorityInstallFileHandle {
  writeFile(bytes: Uint8Array): Promise<unknown>
  sync(): Promise<unknown>
  close(): Promise<unknown>
}

export interface RuntimeEvidenceAuthorityInstallFileSystem {
  readFile(filePath: string): Promise<Uint8Array>
  open(
    filePath: string,
    flags: "wx" | "r",
    mode?: number,
  ): Promise<RuntimeEvidenceAuthorityInstallFileHandle>
  rename(fromPath: string, toPath: string): Promise<unknown>
  unlink(filePath: string): Promise<unknown>
}

const nodeInstallFileSystem: RuntimeEvidenceAuthorityInstallFileSystem = {
  readFile,
  open: (filePath, flags, mode) => openFile(filePath, flags, mode),
  rename,
  unlink,
}

export interface InstallRuntimeEvidenceAuthorityPublicationInput {
  publicationId: string
  targetPath: string
  attemptId?: string
  evaluationInstant: string
  expectedTrustDomain: string
  signerKeyId: string
  publicKeyPem: string
  fileSystem?: RuntimeEvidenceAuthorityInstallFileSystem
}

export interface InstalledRuntimeEvidenceAuthorityPublication {
  publicationId: string
  generation: string
  envelopeSha256: string
  reconciled: boolean
}

interface PublicationInstallRow extends QueryResultRow {
  id: string
  generation: string | number
  semantic_tuple_manifest_hash: string
  source_manifest_hash: string
  payload_sha256: string
  envelope_sha256: string
  signer_key_id: string
  trust_domain: string
  envelope_bytes: Buffer
  attestation_ids: readonly string[]
  certificate_ids: readonly string[]
  revocation_ids: readonly string[]
  supersession_ids: readonly string[]
  lane_control_ids: readonly string[]
}

const readIfPresent = async (
  fileSystem: RuntimeEvidenceAuthorityInstallFileSystem,
  filePath: string,
): Promise<Uint8Array | undefined> => {
  try {
    return new Uint8Array(await fileSystem.readFile(filePath))
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return undefined
    }
    throw error
  }
}

const bytesEqual = (left: Uint8Array, right: Uint8Array): boolean =>
  left.byteLength === right.byteLength && Buffer.from(left).equals(right)

const eventId = (
  publicationId: string,
  eventKind: "installed" | "failed" | "uncertain",
  attemptId: string,
): string =>
  `${publicationId}:${eventKind}:${createHash("sha256")
    .update(attemptId)
    .digest("hex")}`

const normalizeJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeJson)
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeJson(entry)]),
    )
  }
  return value
}

const appendInstallEvent = async (
  client: PoolClient,
  publication: PublicationInstallRow,
  eventKind: "installed" | "failed" | "uncertain",
  attemptId: string,
  reasonCode: string | null,
  reconciled: boolean,
): Promise<void> => {
  const receipt = {
    schemaVersion:
      "v1.37-runtime-evidence-authority-install-receipt-v1" as const,
    generation: String(publication.generation),
    payloadSha256: publication.payload_sha256,
    envelopeSha256: publication.envelope_sha256,
    sourceManifestHash: publication.source_manifest_hash,
    sourceIds: {
      attestationIds: publication.attestation_ids,
      certificateIds: publication.certificate_ids,
      revocationIds: publication.revocation_ids,
      supersessionIds: publication.supersession_ids,
      laneControlIds: publication.lane_control_ids,
    },
    reconciled,
  }
  await client.query(
    `insert into runtime_evidence_authority_publication_events
      (id, publication_id, event_kind, attempt_id, envelope_sha256,
       reason_code, receipt)
     values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (publication_id, event_kind, attempt_id) do nothing`,
    [
      eventId(publication.id, eventKind, attemptId),
      publication.id,
      eventKind,
      attemptId,
      publication.envelope_sha256,
      reasonCode,
      JSON.stringify(receipt),
    ],
  )
  const existing = await client.query<{
    envelope_sha256: string
    reason_code: string | null
    receipt: unknown
  }>(
    `select envelope_sha256, reason_code, receipt
       from runtime_evidence_authority_publication_events
      where publication_id = $1 and event_kind = $2 and attempt_id = $3`,
    [publication.id, eventKind, attemptId],
  )
  if (
    existing.rows[0]?.envelope_sha256 !== publication.envelope_sha256 ||
    existing.rows[0]?.reason_code !== reasonCode ||
    JSON.stringify(normalizeJson(existing.rows[0]?.receipt)) !==
      JSON.stringify(normalizeJson(receipt))
  ) {
    fail("INSTALL_EVENT_CONFLICT", "Install event collision is not exact.")
  }
}

const verifyInstallPublication = (
  publication: PublicationInstallRow,
  input: InstallRuntimeEvidenceAuthorityPublicationInput,
): void => {
  if (
    publication.signer_key_id !== input.signerKeyId ||
    publication.trust_domain !== input.expectedTrustDomain
  ) {
    fail(
      "INSTALL_IDENTITY",
      "Publication signer identity does not match install trust.",
    )
  }
  let publicKey: KeyObject
  try {
    publicKey = createPublicKey(input.publicKeyPem)
  } catch {
    return fail("INSTALL_KEY", "Configured authority public key is invalid.")
  }
  const inspected = inspectRuntimeEvidenceAuthorityBundle(
    publication.envelope_bytes,
    {
      expectedTrustDomain: input.expectedTrustDomain,
      evaluationInstant: input.evaluationInstant,
      trustedKeyIds: [input.signerKeyId],
      verifySignature: ({ signedMessageBytes, signature }) =>
        verifySignature(null, signedMessageBytes, publicKey, signature),
    },
  )
  if (
    inspected.envelope.keyId !== publication.signer_key_id ||
    inspected.payload.registryGeneration !== String(publication.generation) ||
    inspected.payload.semanticTupleManifestHash !==
      publication.semantic_tuple_manifest_hash ||
    inspected.payloadSha256 !== publication.payload_sha256 ||
    hashPublicationBytes(
      PUBLICATION_ENVELOPE_DOMAIN,
      publication.envelope_bytes,
    ) !== publication.envelope_sha256
  ) {
    fail(
      "INSTALL_PROVENANCE",
      "Publication bytes do not match persisted provenance.",
    )
  }
}

const bestEffortInstallEvent = async (
  client: PoolClient,
  publication: PublicationInstallRow,
  eventKind: "failed" | "uncertain",
  attemptId: string,
  reasonCode: string,
): Promise<void> => {
  try {
    await appendInstallEvent(
      client,
      publication,
      eventKind,
      attemptId,
      reasonCode,
      false,
    )
  } catch {
    // A failed event is supplementary evidence. Never mask the install failure.
  }
}

export const installRuntimeEvidenceAuthorityPublication = async (
  pool: Pool,
  input: InstallRuntimeEvidenceAuthorityPublicationInput,
): Promise<Readonly<InstalledRuntimeEvidenceAuthorityPublication>> => {
  const publicationId = assertString(input.publicationId, "publicationId")
  const targetPath = assertString(input.targetPath, "targetPath")
  const attemptId = assertString(
    input.attemptId ?? `install:${randomUUID()}`,
    "attemptId",
  )
  assertInstant(input.evaluationInstant, "evaluationInstant")
  assertString(input.expectedTrustDomain, "expectedTrustDomain")
  assertString(input.signerKeyId, "signerKeyId")
  const fileSystem = input.fileSystem ?? nodeInstallFileSystem
  const client = await pool.connect()
  const lockIdentity = createHash("sha256")
    .update("cowards-game:runtime-evidence-authority-install-lock:v1\0")
    .update(targetPath)
    .digest("hex")
  let locked = false
  try {
    await client.query("select pg_advisory_lock(hashtext($1))", [lockIdentity])
    locked = true
    const publicationResult = await client.query<PublicationInstallRow>(
      `select id, generation, semantic_tuple_manifest_hash, source_manifest_hash,
              payload_sha256, envelope_sha256, signer_key_id, trust_domain,
              envelope_bytes, attestation_ids, certificate_ids, revocation_ids,
              supersession_ids, lane_control_ids
         from runtime_evidence_authority_publications where id = $1`,
      [publicationId],
    )
    const publication = publicationResult.rows[0]
    if (publication === undefined) {
      throw new RuntimeEvidenceAuthorityPublisherError(
        "UNKNOWN_PUBLICATION",
        "Authority publication does not exist.",
      )
    }
    verifyInstallPublication(publication, input)
    const expectedBytes = new Uint8Array(publication.envelope_bytes)
    const existingBytes = await readIfPresent(fileSystem, targetPath)
    if (existingBytes && bytesEqual(existingBytes, expectedBytes)) {
      let directoryHandle: RuntimeEvidenceAuthorityInstallFileHandle | undefined
      try {
        directoryHandle = await fileSystem.open(path.dirname(targetPath), "r")
        await directoryHandle.sync()
        await directoryHandle.close()
        directoryHandle = undefined
      } catch {
        try {
          await directoryHandle?.close()
        } catch {
          // Preserve the primary durability uncertainty.
        }
        await bestEffortInstallEvent(
          client,
          publication,
          "uncertain",
          attemptId,
          "directory-fsync-uncertain",
        )
        return fail(
          "INSTALL_UNCERTAIN",
          "Authority installation remains uncertain until reconciliation.",
        )
      }
      try {
        await appendInstallEvent(
          client,
          publication,
          "installed",
          attemptId,
          null,
          true,
        )
      } catch {
        return fail(
          "INSTALL_RECEIPT_FAILURE",
          "Durable authority requires receipt reconciliation.",
        )
      }
      return Object.freeze({
        publicationId,
        generation: String(publication.generation),
        envelopeSha256: publication.envelope_sha256,
        reconciled: true,
      })
    }

    const temporaryPath = path.join(
      path.dirname(targetPath),
      `.${path.basename(targetPath)}.tmp-${process.pid}-${randomUUID()}`,
    )
    let temporaryHandle: RuntimeEvidenceAuthorityInstallFileHandle | undefined
    let renamed = false
    try {
      temporaryHandle = await fileSystem.open(temporaryPath, "wx", 0o600)
      await temporaryHandle.writeFile(expectedBytes)
      await temporaryHandle.sync()
      await temporaryHandle.close()
      temporaryHandle = undefined
      await fileSystem.rename(temporaryPath, targetPath)
      renamed = true
    } catch {
      try {
        await temporaryHandle?.close()
      } catch {
        // Preserve the primary pre-rename failure.
      }
      if (!renamed) {
        try {
          await fileSystem.unlink(temporaryPath)
        } catch {
          // The temp file may not have been created or may already be gone.
        }
        await bestEffortInstallEvent(
          client,
          publication,
          "failed",
          attemptId,
          "pre-rename-failure",
        )
        return fail(
          "INSTALL_PRE_RENAME_FAILURE",
          "Authority installation failed before replacement.",
        )
      }
      throw new Error("unreachable post-rename failure")
    }

    let directoryHandle: RuntimeEvidenceAuthorityInstallFileHandle | undefined
    try {
      directoryHandle = await fileSystem.open(path.dirname(targetPath), "r")
      await directoryHandle.sync()
      await directoryHandle.close()
      directoryHandle = undefined
    } catch {
      try {
        await directoryHandle?.close()
      } catch {
        // Preserve the primary durability uncertainty.
      }
      await bestEffortInstallEvent(
        client,
        publication,
        "uncertain",
        attemptId,
        "directory-fsync-uncertain",
      )
      return fail(
        "INSTALL_UNCERTAIN",
        "Authority installation remains uncertain until reconciliation.",
      )
    }

    try {
      await appendInstallEvent(
        client,
        publication,
        "installed",
        attemptId,
        null,
        false,
      )
    } catch {
      await bestEffortInstallEvent(
        client,
        publication,
        "failed",
        attemptId,
        "install-receipt-failed",
      )
      return fail(
        "INSTALL_RECEIPT_FAILURE",
        "Durable authority requires receipt reconciliation.",
      )
    }
    return Object.freeze({
      publicationId,
      generation: String(publication.generation),
      envelopeSha256: publication.envelope_sha256,
      reconciled: false,
    })
  } finally {
    if (locked) {
      try {
        await client.query("select pg_advisory_unlock(hashtext($1))", [
          lockIdentity,
        ])
      } catch {
        // Releasing the connection also releases a session advisory lock.
      }
    }
    client.release()
  }
}
