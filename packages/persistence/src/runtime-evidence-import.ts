import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  getVerifiedRuntimeEvidenceAttestationSnapshot,
  verifyRuntimeEvidenceAttestation,
  type ExecutableLaneCertificateReference,
  type RuntimeEvidenceAttestation,
  type RuntimeEvidenceBytes,
  type RuntimeEvidenceTrustedProducer,
  type RuntimeEvidenceVerificationMode,
  type RuntimeEvidenceVerifiedSnapshot,
  type VerifyRuntimeEvidenceAttestationInput,
} from "@cowards/spec"
import type { Pool, PoolClient, QueryResultRow } from "pg"
import { withTransaction } from "./db.js"

const CERTIFICATE_RECORD_DOMAIN =
  "cowards-game:runtime-evidence-certificate-record:v1"

export interface ImportRuntimeEvidenceAttestationInput {
  mode: RuntimeEvidenceVerificationMode
  attestation: RuntimeEvidenceAttestation
  evidenceBytes: RuntimeEvidenceBytes
  verificationInstant: string
  trustedProducers?: readonly RuntimeEvidenceTrustedProducer[]
}

export interface ImportedRuntimeEvidenceAttestation {
  attestationId: string
  attestationSha256: string
  certificate: Readonly<ExecutableLaneCertificateReference>
}

export class RuntimeEvidenceImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RuntimeEvidenceImportError"
  }
}

const certificateRecordHash = (
  snapshot: RuntimeEvidenceVerifiedSnapshot,
): string =>
  createHash("sha256")
    .update(
      [
        CERTIFICATE_RECORD_DOMAIN,
        snapshot.kind,
        snapshot.attestationSha256,
        snapshot.derivedCertificateVersion,
        snapshot.producerId,
        snapshot.schemaVersion,
        snapshot.commandId,
        snapshot.commandSha256,
        snapshot.corpusId,
        snapshot.corpusSha256,
        snapshot.policyId,
        snapshot.policySha256,
        snapshot.laneIdentitySha256,
        snapshot.resultGraphSha256,
        snapshot.registryGeneration,
        snapshot.issuedAt,
        snapshot.validUntil,
      ]
        .map((part) => `${Buffer.byteLength(part, "utf8")}\0${part}\0`)
        .join(""),
      "utf8",
    )
    .digest("hex")

const deriveRuntimeEvidenceCertificateReference = (
  snapshot: RuntimeEvidenceVerifiedSnapshot,
): Readonly<ExecutableLaneCertificateReference> => {
  const recordHash = certificateRecordHash(snapshot)
  return Object.freeze({
    kind: snapshot.kind,
    certificateId: `certificate:${snapshot.kind}:${snapshot.attestationSha256}`,
    certificateVersion: snapshot.derivedCertificateVersion,
    certificateRecordHash: recordHash,
    registryGeneration: snapshot.registryGeneration,
  })
}

const cloneInput = (
  input: ImportRuntimeEvidenceAttestationInput,
): VerifyRuntimeEvidenceAttestationInput => ({
  mode: input.mode,
  attestation: globalThis.structuredClone(input.attestation),
  evidenceBytes: Object.freeze(
    Object.fromEntries(
      Object.entries(input.evidenceBytes).map(([nodeId, bytes]) => [
        nodeId,
        new Uint8Array(bytes),
      ]),
    ),
  ),
  verificationInstant: input.verificationInstant,
  ...(input.trustedProducers === undefined
    ? {}
    : {
        trustedProducers: input.trustedProducers.map((producer) => ({
          ...producer,
          requiredGateIds: [...producer.requiredGateIds],
        })),
      }),
})

const attestationRowValues = (
  snapshot: RuntimeEvidenceVerifiedSnapshot,
  attestationId: string,
  certificate: ExecutableLaneCertificateReference,
): readonly unknown[] => [
  attestationId,
  snapshot.attestationSha256,
  "passed",
  snapshot.kind,
  snapshot.producerId,
  snapshot.producerKeyId,
  snapshot.trustDomain,
  snapshot.schemaVersion,
  snapshot.commandId,
  snapshot.commandSha256,
  snapshot.corpusId,
  snapshot.corpusSha256,
  snapshot.policyId,
  snapshot.policySha256,
  snapshot.laneIdentity.runtimeId,
  snapshot.laneIdentity.runtimeVersion,
  snapshot.laneIdentity.toolchainId,
  snapshot.laneIdentity.toolchainVersion,
  snapshot.laneIdentity.adapterId,
  snapshot.laneIdentity.adapterVersion,
  snapshot.laneIdentity.artifactId,
  snapshot.laneIdentity.artifactSha256,
  snapshot.laneIdentitySha256,
  snapshot.laneIdentity.semanticTupleId,
  snapshot.resultManifestSha256,
  snapshot.resultGraphSha256,
  snapshot.originalEvidenceSha256,
  snapshot.derivedCertificateVersion,
  certificate.certificateRecordHash,
  snapshot.registryGeneration,
  snapshot.laneIdentity,
  snapshot.issuedAt,
  snapshot.validUntil,
]

const ATTESTATION_COLUMNS = [
  "id",
  "attestation_sha256",
  "verification_status",
  "certificate_kind",
  "producer_id",
  "producer_key_id",
  "trust_domain",
  "schema_version",
  "command_id",
  "command_digest",
  "corpus_id",
  "corpus_hash",
  "policy_id",
  "policy_hash",
  "runtime_id",
  "runtime_version",
  "toolchain_id",
  "toolchain_version",
  "adapter_id",
  "adapter_version",
  "artifact_id",
  "artifact_hash",
  "lane_identity_hash",
  "semantic_tuple_id",
  "result_manifest_hash",
  "result_graph_hash",
  "original_evidence_hash",
  "derived_certificate_version",
  "derived_certificate_record_hash",
  "registry_generation",
  "lane_identity",
  "issued_at",
  "valid_until",
] as const

const certificateRowValues = (
  snapshot: RuntimeEvidenceVerifiedSnapshot,
  attestationId: string,
  certificate: ExecutableLaneCertificateReference,
): readonly unknown[] => [
  certificate.certificateId,
  snapshot.kind,
  certificate.certificateVersion,
  certificate.certificateRecordHash,
  "passed",
  attestationId,
  "passed",
  snapshot.producerId,
  snapshot.schemaVersion,
  snapshot.commandId,
  snapshot.commandSha256,
  snapshot.corpusId,
  snapshot.corpusSha256,
  snapshot.policyId,
  snapshot.policySha256,
  snapshot.laneIdentity.toolchainId,
  snapshot.laneIdentity.toolchainVersion,
  snapshot.laneIdentity.artifactId,
  snapshot.laneIdentity.artifactSha256,
  snapshot.laneIdentitySha256,
  snapshot.laneIdentity,
  snapshot.resultGraphSha256,
  snapshot.registryGeneration,
  snapshot.issuedAt,
  snapshot.validUntil,
]

const CERTIFICATE_COLUMNS = [
  "id",
  "certificate_kind",
  "certificate_version",
  "certificate_record_hash",
  "certificate_status",
  "verified_attestation_id",
  "verified_attestation_status",
  "producer_id",
  "schema_version",
  "command_id",
  "command_digest",
  "corpus_id",
  "corpus_hash",
  "policy_id",
  "policy_hash",
  "toolchain_id",
  "toolchain_version",
  "artifact_id",
  "artifact_hash",
  "lane_identity_hash",
  "lane_identity",
  "result_graph_hash",
  "registry_generation",
  "issued_at",
  "fresh_until",
] as const

const insertImmutableRow = async (
  client: PoolClient,
  table: string,
  columns: readonly string[],
  values: readonly unknown[],
  conflictColumn: string,
): Promise<void> => {
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ")
  await client.query(
    `insert into ${table} (${columns.join(", ")})
     values (${placeholders})
     on conflict (${conflictColumn}) do nothing`,
    [...values],
  )
}

const normalizeComparable = (value: unknown): unknown => {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(normalizeComparable)
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeComparable(entry)]),
    )
  }
  return value
}

const comparable = (value: unknown): string =>
  JSON.stringify(normalizeComparable(value))

const assertExactPersistedRow = (
  row: QueryResultRow | undefined,
  columns: readonly string[],
  values: readonly unknown[],
  label: string,
): void => {
  if (!row) throw new RuntimeEvidenceImportError(`${label} was not persisted.`)
  for (const [index, column] of columns.entries()) {
    if (comparable(row[column]) !== comparable(values[index])) {
      throw new RuntimeEvidenceImportError(
        `${label} collision does not match verified field ${column}.`,
      )
    }
  }
}

const persistVerified = async (
  client: PoolClient,
  snapshot: RuntimeEvidenceVerifiedSnapshot,
): Promise<ImportedRuntimeEvidenceAttestation> => {
  const attestationId = `attestation:${snapshot.attestationSha256}`
  const certificate = deriveRuntimeEvidenceCertificateReference(snapshot)
  const attestationValues = attestationRowValues(
    snapshot,
    attestationId,
    certificate,
  )
  await insertImmutableRow(
    client,
    "runtime_evidence_verified_attestations",
    ATTESTATION_COLUMNS,
    attestationValues,
    "attestation_sha256",
  )
  const persistedAttestation = await client.query(
    `select ${ATTESTATION_COLUMNS.join(",")}
       from runtime_evidence_verified_attestations
      where attestation_sha256 = $1`,
    [snapshot.attestationSha256],
  )
  assertExactPersistedRow(
    persistedAttestation.rows[0],
    ATTESTATION_COLUMNS,
    attestationValues,
    "Verified attestation",
  )

  const certificateValues = certificateRowValues(
    snapshot,
    attestationId,
    certificate,
  )
  await insertImmutableRow(
    client,
    "runtime_evidence_certificates",
    CERTIFICATE_COLUMNS,
    certificateValues,
    "certificate_record_hash",
  )
  const persistedCertificate = await client.query(
    `select ${CERTIFICATE_COLUMNS.join(",")}
       from runtime_evidence_certificates
      where certificate_record_hash = $1`,
    [certificate.certificateRecordHash],
  )
  assertExactPersistedRow(
    persistedCertificate.rows[0],
    CERTIFICATE_COLUMNS,
    certificateValues,
    "Derived certificate",
  )
  return Object.freeze({
    attestationId,
    attestationSha256: snapshot.attestationSha256,
    certificate,
  })
}

/**
 * Sole application-level certificate writer. Verification occurs once before
 * acquiring SQL state and again inside the transaction. No certificate field
 * is accepted from the caller; every field is derived from the branded result.
 */
export const importVerifiedRuntimeEvidenceAttestation = async (
  pool: Pool,
  input: ImportRuntimeEvidenceAttestationInput,
): Promise<ImportedRuntimeEvidenceAttestation> => {
  const immutableInput = cloneInput(input)
  getVerifiedRuntimeEvidenceAttestationSnapshot(
    verifyRuntimeEvidenceAttestation(immutableInput),
  )
  return withTransaction(pool, async (client) => {
    const verified = verifyRuntimeEvidenceAttestation(immutableInput)
    const snapshot = getVerifiedRuntimeEvidenceAttestationSnapshot(verified)
    return persistVerified(client, snapshot)
  })
}
