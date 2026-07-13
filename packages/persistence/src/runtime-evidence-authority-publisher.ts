import {
  createHash,
  createPublicKey,
  verify as verifySignature,
  type KeyObject,
} from "node:crypto"
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
  if (!INSTANT.test(instant) || !Number.isFinite(Date.parse(instant))) {
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
  const payload = exactPayload(structuredClone(envelope.payload))
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
  const client = await pool.connect()
  try {
    await client.query("begin isolation level serializable")
    const result = await fn(client)
    await client.query("commit")
    return result
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    client.release()
  }
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
  const immutable = structuredClone(input.envelope)
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
  const immutable = structuredClone(input.envelope)
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
