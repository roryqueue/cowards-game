#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  type KeyObject,
} from "node:crypto"
import { constants } from "node:fs"
import { open, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
// eslint-disable-next-line no-restricted-imports -- Operator script executes from the workspace root.
import {
  encodeCanonicalJson,
  encodeRuntimeConformanceCertificatePayloadV117,
  RUNTIME_CONFORMANCE_LANGUAGES_V1_17,
  RUNTIME_CONFORMANCE_MANAGED_PRODUCER_ID_V1_17,
  RUNTIME_CONFORMANCE_MANAGED_PRODUCER_KEY_ID_V1_17,
  RUNTIME_CONFORMANCE_TRUSTED_PRODUCERS_V1_17,
  verifyRuntimeConformanceCertificateV117,
  type JsonValue,
  type RuntimeConformanceCertificatePayloadV117,
  type RuntimeConformanceCertificateV117,
  type RuntimeConformanceExpectedRunBindingV117,
  type RuntimeConformanceLanguageIdV117,
} from "../packages/spec/src/index.js"
// eslint-disable-next-line no-restricted-imports -- Operator script executes from the workspace root.
import {
  createDatabasePool,
  encodeRuntimeEvidenceAuthorityImportPayload,
  importRuntimeConformanceCertificateV117,
  RUNTIME_EVIDENCE_AUTHORITY_IMPORT_SCHEMA_VERSION,
  type ImportedRuntimeConformanceCertificateV117,
  type RuntimeEvidenceAuthorityImportPayload,
  type RuntimeEvidenceAuthorityImportTrustRoot,
  type RuntimeEvidenceAuthorityImportTrustRootBootstrapReceipt,
} from "../packages/persistence/src/index.js"
import type { Pool } from "pg"

const CANDIDATE_SCHEMA = "v1.37-reviewed-language-candidate-v1" as const
const RECEIPT_SCHEMA =
  "v1.37-language-conformance-import-receipts-v1" as const
const SHA256 = /^sha256:[0-9a-f]{64}$/u
const BOOTSTRAP_KEYS = Object.freeze([
  "schemaVersion",
  "status",
  "descriptorSha256",
  "producerId",
  "keyId",
  "trustDomain",
  "publicKeyFingerprint",
  "generation",
] as const)
const ROOT_KEYS = Object.freeze([
  "keyId",
  "producerId",
  "publicKeyPem",
  "trustDomain",
] as const)
const CANDIDATE_KEYS = Object.freeze([
  "candidatePayload",
  "candidatePayloadSha256",
  "expectedRunBinding",
  "languageId",
  "schemaVersion",
  "status",
] as const)
const REVIEWED_CANDIDATE_PAYLOAD_SHA256 = Object.freeze({
  typescript:
    "sha256:91979a243358f81a606b1a4b0a3b473c341e6a31fbb8d1f09d458b300ed644a9",
  python:
    "sha256:05967088ab10f8d5384970cc99f4358929e6d404622264422f5cfbe827babbf7",
  rust: "sha256:d0c73473015bd556e2e51d24182a50024d4bcb0f0d9d6f8c4b6773fa8ceeb6c4",
  zig: "sha256:b85b122fe68e9d6242e2ca2a81859cfa90c4d00ea54ac21ff3147bd19d23e5ae",
} as const)

interface ReviewedCandidate {
  schemaVersion: typeof CANDIDATE_SCHEMA
  status: "reviewed_unsigned_candidate"
  languageId: RuntimeConformanceLanguageIdV117
  candidatePayload: RuntimeConformanceCertificatePayloadV117
  candidatePayloadSha256: string
  expectedRunBinding: RuntimeConformanceExpectedRunBindingV117
}

export interface SafeLanguageConformanceImportReceipt {
  languageId: RuntimeConformanceLanguageIdV117
  laneId: string
  candidatePayloadSha256: string
  certificateId: string
  certificateSha256: string
  authorityGeneration: string
  status: "installed"
  reasonCode: "SIGNED_VERIFIED_IMPORTED"
}

export interface SafeLanguageConformanceImportReceiptManifest {
  schemaVersion: typeof RECEIPT_SCHEMA
  receipts: SafeLanguageConformanceImportReceipt[]
}

type ImportCertificate = typeof importRuntimeConformanceCertificateV117

export interface LanguageConformanceSignerCliDependencies {
  env?: Record<string, string | undefined>
  pool?: Pool
  importCertificate?: ImportCertificate
  workspaceRoot?: string
  stdout?(line: string): void
  stderr?(line: string): void
}

const exactKeys = (
  value: unknown,
  keys: readonly string[],
): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key))

const required = (
  env: Record<string, string | undefined>,
  name: string,
): string => {
  const value = env[name]
  if (!value) throw new Error("missing protected signing configuration")
  return value
}

const sha256 = (bytes: Uint8Array): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) throw new Error("noncanonical reviewed candidate")
  return encoded.bytes
}

const readStableFile = async (
  filePath: string,
  options: { privateFile: boolean; maxBytes: number },
): Promise<Buffer> => {
  const handle = await open(filePath, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const before = await handle.stat({ bigint: false })
    const forbiddenMode = options.privateFile ? 0o077 : 0o022
    if (
      !before.isFile() ||
      before.size < 2 ||
      before.size > options.maxBytes ||
      (before.mode & forbiddenMode) !== 0 ||
      (typeof process.getuid === "function" && before.uid !== process.getuid())
    ) {
      throw new Error("unsafe protected signing file")
    }
    const bytes = await handle.readFile()
    const after = await handle.stat({ bigint: false })
    if (
      bytes.byteLength !== before.size ||
      after.size !== before.size ||
      after.ino !== before.ino ||
      after.dev !== before.dev
    ) {
      throw new Error("protected signing file changed while reading")
    }
    return bytes
  } finally {
    await handle.close()
  }
}

const parseArgs = (args: readonly string[]) => {
  let allReviewedLanes = false
  let check = false
  let bootstrapPath: string | undefined
  let receiptPath: string | undefined
  for (const arg of args) {
    if (arg === "--all-reviewed-lanes" && !allReviewedLanes) {
      allReviewedLanes = true
    } else if (arg === "--check" && !check) {
      check = true
    } else if (
      arg.startsWith("--require-bootstrap=") &&
      bootstrapPath === undefined
    ) {
      bootstrapPath = arg.slice("--require-bootstrap=".length)
    } else if (
      arg.startsWith("--write-safe-receipts=") &&
      receiptPath === undefined
    ) {
      receiptPath = arg.slice("--write-safe-receipts=".length)
    } else {
      throw new Error("invalid conformance signer arguments")
    }
  }
  if (!allReviewedLanes || !check || !bootstrapPath || !receiptPath) {
    throw new Error("incomplete conformance signer arguments")
  }
  return { bootstrapPath, receiptPath }
}

const parseBootstrapReceipt = (
  value: unknown,
): RuntimeEvidenceAuthorityImportTrustRootBootstrapReceipt => {
  if (
    !exactKeys(value, BOOTSTRAP_KEYS) ||
    value.schemaVersion !==
      "v1.37-runtime-authority-import-trust-roots-bootstrap-receipt-v1" ||
    (value.status !== "installed" && value.status !== "idempotent") ||
    typeof value.descriptorSha256 !== "string" ||
    !SHA256.test(value.descriptorSha256) ||
    typeof value.publicKeyFingerprint !== "string" ||
    !SHA256.test(value.publicKeyFingerprint) ||
    typeof value.producerId !== "string" ||
    typeof value.keyId !== "string" ||
    typeof value.trustDomain !== "string" ||
    typeof value.generation !== "string" ||
    !/^(0|[1-9][0-9]*)$/u.test(value.generation)
  ) {
    throw new Error("invalid bootstrap receipt")
  }
  return {
    status: value.status,
    descriptorSha256: value.descriptorSha256,
    producerId: value.producerId,
    keyId: value.keyId,
    trustDomain: value.trustDomain,
    publicKeyFingerprint: value.publicKeyFingerprint,
    generation: value.generation,
  }
}

const parseTrustRoots = (
  bytes: Uint8Array,
  receipt: RuntimeEvidenceAuthorityImportTrustRootBootstrapReceipt,
): readonly RuntimeEvidenceAuthorityImportTrustRoot[] => {
  if (sha256(bytes) !== receipt.descriptorSha256) {
    throw new Error("bootstrap descriptor hash mismatch")
  }
  const value: unknown = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
  )
  if (!Array.isArray(value) || value.length < 1 || value.length > 32) {
    throw new Error("invalid plural import trust roots")
  }
  const roots = value.map((entry) => {
    if (
      !exactKeys(entry, ROOT_KEYS) ||
      typeof entry.producerId !== "string" ||
      typeof entry.keyId !== "string" ||
      typeof entry.trustDomain !== "string" ||
      typeof entry.publicKeyPem !== "string"
    ) {
      throw new Error("invalid import trust root")
    }
    return Object.freeze({
      producerId: entry.producerId,
      keyId: entry.keyId,
      trustDomain: entry.trustDomain,
      publicKeyPem: entry.publicKeyPem,
    })
  })
  if (
    !Buffer.from(canonicalBytes(roots as unknown as JsonValue)).equals(
      Buffer.from(bytes),
    )
  ) {
    throw new Error("noncanonical import trust roots")
  }
  const selected = roots.filter(
    (root) =>
      root.producerId === receipt.producerId &&
      root.keyId === receipt.keyId &&
      root.trustDomain === receipt.trustDomain,
  )
  if (selected.length !== 1) throw new Error("bootstrap root identity mismatch")
  const fingerprint = sha256(
    createPublicKey(selected[0]!.publicKeyPem).export({
      type: "spki",
      format: "der",
    }),
  )
  if (fingerprint !== receipt.publicKeyFingerprint) {
    throw new Error("bootstrap root fingerprint mismatch")
  }
  return Object.freeze(roots)
}

const parseCandidate = (
  value: unknown,
  languageId: RuntimeConformanceLanguageIdV117,
): ReviewedCandidate => {
  if (
    !exactKeys(value, CANDIDATE_KEYS) ||
    value.schemaVersion !== CANDIDATE_SCHEMA ||
    value.status !== "reviewed_unsigned_candidate" ||
    value.languageId !== languageId ||
    typeof value.candidatePayloadSha256 !== "string" ||
    !SHA256.test(value.candidatePayloadSha256) ||
    value.candidatePayload === null ||
    typeof value.candidatePayload !== "object" ||
    value.expectedRunBinding === null ||
    typeof value.expectedRunBinding !== "object"
  ) {
    throw new Error("candidate is not complete reviewed evidence")
  }
  const candidate = value as unknown as ReviewedCandidate
  if (
    candidate.candidatePayload.identity.languageId !== languageId ||
    candidate.candidatePayload.producerId !==
      RUNTIME_CONFORMANCE_MANAGED_PRODUCER_ID_V1_17 ||
    candidate.candidatePayload.producerKeyId !==
      RUNTIME_CONFORMANCE_MANAGED_PRODUCER_KEY_ID_V1_17 ||
    candidate.candidatePayload.trustDomain !== "production" ||
    candidate.candidatePayload.managedIdentity !== true ||
    candidate.candidatePayloadSha256 !==
      REVIEWED_CANDIDATE_PAYLOAD_SHA256[languageId] ||
    sha256(
      encodeRuntimeConformanceCertificatePayloadV117(
        candidate.candidatePayload,
      ),
    ) !== candidate.candidatePayloadSha256
  ) {
    throw new Error("reviewed candidate identity mismatch")
  }
  return globalThis.structuredClone(candidate)
}

const loadPrivateKey = async (filePath: string): Promise<KeyObject> => {
  const key = createPrivateKey(
    await readStableFile(filePath, { privateFile: true, maxBytes: 16 * 1024 }),
  )
  if (key.asymmetricKeyType !== "ed25519") {
    throw new Error("signing key must be Ed25519")
  }
  return key
}

const publicKeysEqual = (left: KeyObject, rightPem: string): boolean =>
  Buffer.from(
    createPublicKey(left).export({ type: "spki", format: "der" }),
  ).equals(
    Buffer.from(
      createPublicKey(rightPem).export({ type: "spki", format: "der" }),
    ),
  )

const writeOrCheckManifest = async (
  receiptPath: string,
  manifest: SafeLanguageConformanceImportReceiptManifest,
): Promise<void> => {
  const bytes = Buffer.from(
    canonicalBytes(manifest as unknown as JsonValue),
  )
  try {
    const existing = await readFile(receiptPath)
    if (!existing.equals(bytes)) throw new Error("safe receipt conflict")
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error
    }
    await writeFile(receiptPath, bytes, { flag: "wx", mode: 0o644 })
    if (!(await readFile(receiptPath)).equals(bytes)) {
      throw new Error("safe receipt verification failed")
    }
  }
}

export const runLanguageConformanceSignerCli = async (
  args: readonly string[],
  dependencies: LanguageConformanceSignerCliDependencies = {},
): Promise<number> => {
  const env = dependencies.env ?? process.env
  const stdout = dependencies.stdout ?? console.log
  const stderr = dependencies.stderr ?? console.error
  const workspaceRoot = dependencies.workspaceRoot ?? process.cwd()
  const importCertificate =
    dependencies.importCertificate ?? importRuntimeConformanceCertificateV117
  let ownedPool: Pool | undefined
  try {
    const { bootstrapPath, receiptPath } = parseArgs(args)
    for (const forbidden of [
      "COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_ROOT_PATH",
      "COWARDS_RUNTIME_CONFORMANCE_IMPORT_TRUST_ROOT_PATH",
      "COWARDS_RUNTIME_CONFORMANCE_RUNTIME_TRUST_ROOT_PATH",
    ]) {
      if (env[forbidden] !== undefined) {
        throw new Error("singular or substituted trust root is forbidden")
      }
    }
    const databaseUrl = required(env, "DATABASE_URL")
    const producerId = required(
      env,
      "COWARDS_RUNTIME_CONFORMANCE_PRODUCER_ID",
    )
    const producerKeyId = required(
      env,
      "COWARDS_RUNTIME_CONFORMANCE_PRODUCER_KEY_ID",
    )
    if (
      producerId !== RUNTIME_CONFORMANCE_MANAGED_PRODUCER_ID_V1_17 ||
      producerKeyId !== RUNTIME_CONFORMANCE_MANAGED_PRODUCER_KEY_ID_V1_17
    ) {
      throw new Error("conformance producer identity mismatch")
    }
    const producerPrivateKeyPath = required(
      env,
      "COWARDS_RUNTIME_CONFORMANCE_PRODUCER_PRIVATE_KEY_PATH",
    )
    const importPrivateKeyPath = required(
      env,
      "COWARDS_RUNTIME_AUTHORITY_IMPORT_SIGNER_PRIVATE_KEY_PATH",
    )
    if (producerPrivateKeyPath === importPrivateKeyPath) {
      throw new Error("producer and import authority keys must be distinct")
    }
    const descriptorPath = required(
      env,
      "COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_ROOTS_PATH",
    )
    const expectedDescriptorSha256 = required(
      env,
      "COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_ROOTS_EXPECTED_SHA256",
    )
    const bootstrap = parseBootstrapReceipt(
      JSON.parse((await readFile(bootstrapPath)).toString("utf8")) as unknown,
    )
    if (
      bootstrap.descriptorSha256 !== expectedDescriptorSha256 ||
      bootstrap.producerId !==
        required(env, "COWARDS_RUNTIME_AUTHORITY_IMPORT_PRODUCER_ID") ||
      bootstrap.keyId !==
        required(env, "COWARDS_RUNTIME_AUTHORITY_IMPORT_KEY_ID") ||
      bootstrap.trustDomain !==
        required(env, "COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_DOMAIN")
    ) {
      throw new Error("bootstrap configuration mismatch")
    }
    const descriptorBytes = await readStableFile(descriptorPath, {
      privateFile: false,
      maxBytes: 64 * 1024,
    })
    const trustRoots = parseTrustRoots(descriptorBytes, bootstrap)
    const candidates = await Promise.all(
      RUNTIME_CONFORMANCE_LANGUAGES_V1_17.map(async (languageId) => {
        const candidatePath = path.join(
          workspaceRoot,
          `.planning/artifacts/v1.37-language-conformance-${languageId}.json`,
        )
        return parseCandidate(
          JSON.parse(
            (
              await readStableFile(candidatePath, {
                privateFile: false,
                maxBytes: 512 * 1024,
              })
            ).toString("utf8"),
          ) as unknown,
          languageId,
        )
      }),
    )
    const [producerPrivateKey, importPrivateKey] = await Promise.all([
      loadPrivateKey(producerPrivateKeyPath),
      loadPrivateKey(importPrivateKeyPath),
    ])
    const managedProducer = RUNTIME_CONFORMANCE_TRUSTED_PRODUCERS_V1_17[0]
    const selectedImportRoot = trustRoots.find(
      (root) =>
        root.producerId === bootstrap.producerId &&
        root.keyId === bootstrap.keyId &&
        root.trustDomain === bootstrap.trustDomain,
    )
    if (
      managedProducer === undefined ||
      selectedImportRoot === undefined ||
      !publicKeysEqual(producerPrivateKey, managedProducer.publicKeyPem) ||
      !publicKeysEqual(importPrivateKey, selectedImportRoot.publicKeyPem)
    ) {
      throw new Error("protected signer public key mismatch")
    }
    const pool =
      dependencies.pool ??
      (ownedPool = createDatabasePool({ connectionString: databaseUrl }))
    const receipts: SafeLanguageConformanceImportReceipt[] = []
    const verificationInstant = new Date().toISOString()
    for (const candidate of candidates) {
      const signatureBase64 = sign(
        null,
        encodeRuntimeConformanceCertificatePayloadV117(
          candidate.candidatePayload,
        ),
        producerPrivateKey,
      ).toString("base64")
      const certificate: RuntimeConformanceCertificateV117 = {
        ...candidate.candidatePayload,
        signatureBase64,
      }
      const verified = verifyRuntimeConformanceCertificateV117({
        mode: "production",
        certificate,
        currentIdentity: candidate.candidatePayload.identity,
        expectedRunBinding: candidate.expectedRunBinding,
        verificationInstant,
      })
      const importPayload: RuntimeEvidenceAuthorityImportPayload = {
        schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_IMPORT_SCHEMA_VERSION,
        domain: "conformance-certificate",
        eventId: `conformance-import:${verified.certificateSha256.slice(-32)}`,
        producerId: bootstrap.producerId,
        producerKeyId: bootstrap.keyId,
        trustDomain: bootstrap.trustDomain,
        issuedAt: candidate.candidatePayload.issuedAt,
        validUntil: candidate.candidatePayload.freshUntil,
        action: null,
        laneIdentityHash: null,
        reasonCode: "REVIEWED_CONFORMANCE_CERTIFICATE",
        evidenceReferenceHash:
          candidate.candidatePayload.identity.evidenceGraphRoot,
        compensatesEventId: null,
        targetCertificateId: verified.certificateId,
        targetCertificateRecordHash: verified.certificateSha256,
        replacementCertificateId: null,
        replacementCertificateRecordHash: null,
      }
      const imported: Readonly<ImportedRuntimeConformanceCertificateV117> =
        await importCertificate(pool, {
          mode: "production",
          certificate,
          currentIdentity: candidate.candidatePayload.identity,
          expectedRunBinding: candidate.expectedRunBinding,
          verificationInstant,
          importEnvelope: {
            payload: importPayload,
            signatureBase64: sign(
              null,
              encodeRuntimeEvidenceAuthorityImportPayload(importPayload),
              importPrivateKey,
            ).toString("base64"),
          },
          trustedImportAuthorities: trustRoots,
          requiredTrustRootBootstrap: bootstrap,
        })
      if (
        imported.status !== "installed" ||
        imported.certificateId !== verified.certificateId ||
        imported.certificateSha256 !== verified.certificateSha256 ||
        imported.languageId !== candidate.languageId
      ) {
        throw new Error("conformance import receipt mismatch")
      }
      receipts.push({
        languageId: candidate.languageId,
        laneId: candidate.candidatePayload.identity.laneId,
        candidatePayloadSha256: candidate.candidatePayloadSha256,
        certificateId: verified.certificateId,
        certificateSha256: verified.certificateSha256,
        authorityGeneration: bootstrap.generation,
        status: "installed",
        reasonCode: "SIGNED_VERIFIED_IMPORTED",
      })
    }
    const manifest: SafeLanguageConformanceImportReceiptManifest = {
      schemaVersion: RECEIPT_SCHEMA,
      receipts,
    }
    await writeOrCheckManifest(receiptPath, manifest)
    stdout(Buffer.from(canonicalBytes(manifest as unknown as JsonValue)).toString())
    return 0
  } catch {
    stderr(
      JSON.stringify({
        status: "failed",
        reasonCode: "CONFORMANCE_SIGN_VERIFY_IMPORT_FAILED",
      }),
    )
    return 1
  } finally {
    await ownedPool?.end()
  }
}

const main = async (): Promise<void> => {
  process.exitCode = await runLanguageConformanceSignerCli(
    process.argv.slice(2),
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) void main()
