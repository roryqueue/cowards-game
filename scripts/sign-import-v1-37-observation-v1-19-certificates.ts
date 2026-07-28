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
// eslint-disable-next-line no-restricted-imports -- operator script executes from the workspace root.
import {
  encodeCanonicalJson,
  encodeRuntimeConformanceCertificatePayloadV119,
  RUNTIME_CONFORMANCE_LANGUAGES_V1_17,
  RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY,
  RUNTIME_CONFORMANCE_V119_REVIEWED_PAYLOAD_SHA256,
  verifyRuntimeConformanceCertificateV119,
  type JsonValue,
  type RuntimeConformanceCertificateV119,
  type RuntimeConformanceExpectedRunBindingV119,
  type RuntimeConformanceLanguageIdV117,
  type RuntimeConformanceTrustedProducerV119,
} from "../packages/spec/src/index.js"
// eslint-disable-next-line no-restricted-imports -- operator script executes from the workspace root.
import {
  createDatabasePool,
  encodeRuntimeEvidenceAuthorityImportPayload,
  importRuntimeConformanceCertificateV119Inactive,
  RUNTIME_EVIDENCE_AUTHORITY_IMPORT_SCHEMA_VERSION,
  type ImportedRuntimeConformanceCertificateV119,
  type RuntimeEvidenceAuthorityImportPayload,
  type RuntimeEvidenceAuthorityImportTrustRoot,
  type RuntimeEvidenceAuthorityImportTrustRootBootstrapReceipt,
} from "../packages/persistence/src/index.js"
import type { Pool } from "pg"

const RECEIPT_SCHEMA =
  "v1.37-observation-v1.19-language-conformance-import-receipts-v1" as const
const DEFAULT_RECEIPT_PATH =
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-import-receipts.json"
const REVIEWED_SCHEMA =
  "v1.37-observation-v1.19-reviewed-language-candidate-v1" as const
const SHA256 = /^sha256:[0-9a-f]{64}$/u
const HEX256 = /^[0-9a-f]{64}$/u

interface ReviewedCandidate {
  schemaVersion: typeof REVIEWED_SCHEMA
  status: "reviewed_unsigned_candidate"
  languageId: RuntimeConformanceLanguageIdV117
  candidatePayload: RuntimeConformanceCertificateV119["candidatePayload"]
  candidatePayloadSha256: string
  expectedRunBinding: RuntimeConformanceExpectedRunBindingV119
}

export interface ObservationV119ImportReceipt {
  languageId: RuntimeConformanceLanguageIdV117
  laneId: string
  candidatePayloadSha256: string
  certificateId: string
  certificateSha256: string
  candidateAuthority: {
    corpusVersion: string
    corpusRootSha256: string
    corpusPinSha256: string
    traceVersion: string
    traceRootSha256: string
    tracePinSha256: string
    workshopVersion: string
    workshopRootSha256: string
    workshopPinSha256: string
    runtimeAbiVersion: string
    arenaCatalogVersion: string
    setPolicyVersion: string
    semanticTupleId: string
  }
  runRoots: {
    resultRootSha256: string
    evidenceRootSha256: string
    runIds: string[]
  }
  ledgerIdentity: {
    registryGeneration: "candidate-0"
    importEnvelopeHash: string
  }
  status: "installed_inactive"
}

export interface ObservationV119ImportReceiptManifest {
  schemaVersion: typeof RECEIPT_SCHEMA
  receipts: ObservationV119ImportReceipt[]
}

type ImportCertificate = typeof importRuntimeConformanceCertificateV119Inactive

export interface ObservationV119CertificateSignerDependencies {
  workspaceRoot?: string
  receiptPath?: string
  pool?: Pool
  producerPrivateKey?: KeyObject
  importPrivateKey?: KeyObject
  trustedImportAuthorities?: readonly RuntimeEvidenceAuthorityImportTrustRoot[]
  requiredTrustRootBootstrap?: RuntimeEvidenceAuthorityImportTrustRootBootstrapReceipt
  importCertificate?: ImportCertificate
  env?: Record<string, string | undefined>
  debugError?(error: unknown): void
  stdout?(line: string): void
  stderr?(line: string): void
}

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) throw new TypeError("noncanonical observation receipt")
  return encoded.bytes
}

const sha256 = (bytes: Uint8Array): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const sameCanonical = (left: unknown, right: unknown): boolean =>
  sha256(canonicalBytes(left as JsonValue)) ===
  sha256(canonicalBytes(right as JsonValue))

const exactKeys = (value: unknown, keys: readonly string[]): boolean =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key))

const readStable = async (
  filePath: string,
  privateFile: boolean,
): Promise<Buffer> => {
  const handle = await open(filePath, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const before = await handle.stat()
    if (
      !before.isFile() ||
      before.size < 2 ||
      before.size > 1024 * 1024 ||
      (before.mode & (privateFile ? 0o077 : 0o022)) !== 0 ||
      (typeof process.getuid === "function" && before.uid !== process.getuid())
    )
      throw new TypeError("unsafe protected operator input")
    const bytes = await handle.readFile()
    const after = await handle.stat()
    if (
      bytes.length !== before.size ||
      after.size !== before.size ||
      after.dev !== before.dev ||
      after.ino !== before.ino
    )
      throw new TypeError("protected operator input changed")
    return bytes
  } finally {
    await handle.close()
  }
}

const required = (
  env: Record<string, string | undefined>,
  name: string,
): string => {
  const value = env[name]
  if (!value) throw new TypeError("missing protected operator input")
  return value
}

const candidatePath = (
  root: string,
  languageId: RuntimeConformanceLanguageIdV117,
): string =>
  path.join(
    root,
    `.planning/artifacts/v1.37-observation-v1.19-language-conformance-${languageId}.json`,
  )

const parseCandidate = (
  value: unknown,
  languageId: RuntimeConformanceLanguageIdV117,
): ReviewedCandidate => {
  const keys = [
    "candidateBindings",
    "candidatePayload",
    "candidatePayloadSha256",
    "expectedRunBinding",
    "languageId",
    "schemaVersion",
    "status",
  ] as const
  if (
    !exactKeys(value, keys) ||
    (value as { schemaVersion?: unknown }).schemaVersion !== REVIEWED_SCHEMA ||
    (value as { status?: unknown }).status !== "reviewed_unsigned_candidate" ||
    (value as { languageId?: unknown }).languageId !== languageId
  )
    throw new TypeError("reviewed candidate is incomplete")
  const candidate = value as ReviewedCandidate & { candidateBindings: unknown }
  if (
    candidate.candidatePayload.identity.languageId !== languageId ||
    candidate.candidatePayloadSha256 !==
      RUNTIME_CONFORMANCE_V119_REVIEWED_PAYLOAD_SHA256[languageId] ||
    sha256(
      canonicalBytes(candidate.candidatePayload as unknown as JsonValue),
    ) !== candidate.candidatePayloadSha256 ||
    sha256(canonicalBytes(candidate.candidateBindings as JsonValue)) !==
      sha256(
        canonicalBytes(
          RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY as unknown as JsonValue,
        ),
      )
  )
    throw new TypeError("reviewed candidate identity mismatch")
  return globalThis.structuredClone(candidate)
}

const loadCandidates = async (root: string): Promise<ReviewedCandidate[]> =>
  Promise.all(
    RUNTIME_CONFORMANCE_LANGUAGES_V1_17.map(async (languageId) =>
      parseCandidate(
        JSON.parse(
          await readFile(candidatePath(root, languageId), "utf8"),
        ) as unknown,
        languageId,
      ),
    ),
  )

const authorityReceipt = () => ({
  corpusVersion: RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.corpus.version,
  corpusRootSha256:
    RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.corpus.rootSha256,
  corpusPinSha256:
    RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.corpus.pinFileSha256,
  traceVersion: RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.trace.version,
  traceRootSha256:
    RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.trace.rootSha256,
  tracePinSha256:
    RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.trace.pinFileSha256,
  workshopVersion:
    RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.workshop.version,
  workshopRootSha256:
    RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.workshop.rootSha256,
  workshopPinSha256:
    RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.workshop.pinFileSha256,
  runtimeAbiVersion:
    RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.semanticTuple
      .runtimeAbiVersion,
  arenaCatalogVersion:
    RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.semanticTuple
      .arenaCatalogVersion,
  setPolicyVersion:
    RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.semanticTuple.setPolicyVersion,
  semanticTupleId:
    RUNTIME_CONFORMANCE_V119_CANDIDATE_AUTHORITY.semanticTuple.tupleId,
})

const publicSafe = (value: unknown): void => {
  const serialized = JSON.stringify(value)
  if (
    /"(?:signature|private|source|sourceBytes|artifact|artifacts|memory|objective|diagnostics|stderr|host|hostData|path|keyMaterial|credentials?)"\s*:/iu.test(
      serialized,
    )
  )
    throw new TypeError("receipt contains prohibited material")
}

const checkManifest = (
  value: unknown,
  candidates: readonly ReviewedCandidate[],
): ObservationV119ImportReceiptManifest => {
  if (
    !exactKeys(value, ["receipts", "schemaVersion"]) ||
    (value as { schemaVersion?: unknown }).schemaVersion !== RECEIPT_SCHEMA ||
    !Array.isArray((value as { receipts?: unknown }).receipts)
  )
    throw new TypeError("invalid observation import receipt manifest")
  const manifest = value as ObservationV119ImportReceiptManifest
  if (manifest.receipts.length !== 4)
    throw new TypeError("missing lane receipt")
  for (const [index, receipt] of manifest.receipts.entries()) {
    const candidate = candidates[index]
    if (
      candidate === undefined ||
      !exactKeys(receipt, [
        "candidateAuthority",
        "candidatePayloadSha256",
        "certificateId",
        "certificateSha256",
        "languageId",
        "laneId",
        "ledgerIdentity",
        "runRoots",
        "status",
      ]) ||
      receipt.languageId !== candidate.languageId ||
      receipt.laneId !== candidate.candidatePayload.identity.laneId ||
      receipt.candidatePayloadSha256 !== candidate.candidatePayloadSha256 ||
      receipt.certificateId !== candidate.candidatePayload.certificateId ||
      !SHA256.test(receipt.certificateSha256) ||
      receipt.status !== "installed_inactive" ||
      receipt.ledgerIdentity.registryGeneration !== "candidate-0" ||
      !HEX256.test(receipt.ledgerIdentity.importEnvelopeHash) ||
      !sameCanonical(receipt.candidateAuthority, authorityReceipt()) ||
      receipt.runRoots.resultRootSha256 !==
        candidate.expectedRunBinding.resultRootSha256 ||
      receipt.runRoots.evidenceRootSha256 !==
        candidate.expectedRunBinding.evidenceRootSha256 ||
      JSON.stringify(receipt.runRoots.runIds) !==
        JSON.stringify(
          candidate.candidatePayload.runs.map(({ runId }) => runId),
        )
    )
      throw new TypeError(
        "observation receipt conflicts with reviewed evidence",
      )
  }
  if (
    new Set(manifest.receipts.map(({ certificateSha256 }) => certificateSha256))
      .size !== 4
  )
    throw new TypeError("duplicate certificate receipt")
  publicSafe(manifest)
  return globalThis.structuredClone(manifest)
}

const parseTrustedRoots = (
  value: unknown,
): RuntimeEvidenceAuthorityImportTrustRoot[] => {
  if (!Array.isArray(value) || value.length === 0)
    throw new TypeError("missing plural roots")
  return value.map((root) => {
    if (
      !exactKeys(root, ["keyId", "producerId", "publicKeyPem", "trustDomain"])
    )
      throw new TypeError("invalid plural root")
    return root as RuntimeEvidenceAuthorityImportTrustRoot
  })
}

const loadDefaultDependencies = async (
  env: Record<string, string | undefined>,
): Promise<{
  producerPrivateKey: KeyObject
  importPrivateKey: KeyObject
  trustedImportAuthorities: readonly RuntimeEvidenceAuthorityImportTrustRoot[]
  bootstrap: RuntimeEvidenceAuthorityImportTrustRootBootstrapReceipt
}> => {
  const producerPrivateKey = createPrivateKey(
    await readStable(
      required(env, "COWARDS_RUNTIME_CONFORMANCE_PRODUCER_PRIVATE_KEY_PATH"),
      true,
    ),
  )
  const importPrivateKey = createPrivateKey(
    await readStable(
      required(env, "COWARDS_RUNTIME_AUTHORITY_IMPORT_SIGNER_PRIVATE_KEY_PATH"),
      true,
    ),
  )
  const roots = parseTrustedRoots(
    JSON.parse(
      (
        await readStable(
          required(env, "COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_ROOTS_PATH"),
          false,
        )
      ).toString("utf8"),
    ) as unknown,
  )
  const bootstrap = JSON.parse(
    await readFile(
      ".planning/artifacts/v1.37-runtime-authority-import-trust-roots-bootstrap.json",
      "utf8",
    ),
  ) as RuntimeEvidenceAuthorityImportTrustRootBootstrapReceipt
  return {
    producerPrivateKey,
    importPrivateKey,
    trustedImportAuthorities: roots,
    bootstrap,
  }
}

export const runObservationV119CertificateSignerCli = async (
  args: readonly string[],
  dependencies: ObservationV119CertificateSignerDependencies = {},
): Promise<number> => {
  const stdout = dependencies.stdout ?? console.log
  const stderr = dependencies.stderr ?? console.error
  const root = dependencies.workspaceRoot ?? process.cwd()
  const receiptPath =
    dependencies.receiptPath ?? path.join(root, DEFAULT_RECEIPT_PATH)
  let ownedPool: Pool | undefined
  try {
    if (args.length !== 1 || (args[0] !== "--write" && args[0] !== "--check"))
      throw new TypeError("invalid signer command")
    const candidates = await loadCandidates(root)
    if (args[0] === "--check") {
      const manifest = checkManifest(
        JSON.parse(await readFile(receiptPath, "utf8")) as unknown,
        candidates,
      )
      stdout(
        JSON.stringify({
          status: "passed",
          receipts: manifest.receipts.length,
        }),
      )
      return 0
    }

    const env = dependencies.env ?? process.env
    const loaded =
      dependencies.producerPrivateKey !== undefined &&
      dependencies.importPrivateKey !== undefined &&
      dependencies.trustedImportAuthorities !== undefined
        ? {
            producerPrivateKey: dependencies.producerPrivateKey,
            importPrivateKey: dependencies.importPrivateKey,
            trustedImportAuthorities: dependencies.trustedImportAuthorities,
            bootstrap: dependencies.requiredTrustRootBootstrap,
          }
        : await loadDefaultDependencies(env)
    if (
      loaded.producerPrivateKey.asymmetricKeyType !== "ed25519" ||
      loaded.importPrivateKey.asymmetricKeyType !== "ed25519" ||
      Buffer.from(
        createPublicKey(loaded.producerPrivateKey).export({
          type: "spki",
          format: "der",
        }),
      ).equals(
        Buffer.from(
          createPublicKey(loaded.importPrivateKey).export({
            type: "spki",
            format: "der",
          }),
        ),
      )
    )
      throw new TypeError("producer and operator roots must be distinct")
    const operator = loaded.trustedImportAuthorities.find((rootEntry) =>
      createPublicKey(rootEntry.publicKeyPem)
        .export({ type: "spki", format: "der" })
        .equals(
          createPublicKey(loaded.importPrivateKey).export({
            type: "spki",
            format: "der",
          }),
        ),
    )
    if (operator === undefined) throw new TypeError("operator root mismatch")
    const mode = operator.trustDomain.includes("fixture")
      ? "fixture"
      : "production"
    const pool =
      dependencies.pool ??
      (ownedPool = createDatabasePool({
        connectionString: required(env, "DATABASE_URL"),
      }))
    const importCertificate =
      dependencies.importCertificate ??
      importRuntimeConformanceCertificateV119Inactive
    const receipts: ObservationV119ImportReceipt[] = []
    for (const candidate of candidates) {
      const trustedProducer: RuntimeConformanceTrustedProducerV119 = {
        producerId: candidate.candidatePayload.producerId,
        keyId: candidate.candidatePayload.producerKeyId,
        trustDomain: mode,
        managedIdentity: true,
        publicKeyPem: createPublicKey(loaded.producerPrivateKey)
          .export({ type: "spki", format: "pem" })
          .toString(),
      }
      const certificate: RuntimeConformanceCertificateV119 = {
        schemaVersion: "runtime-conformance-certificate-envelope-v1.19",
        trustDomain: mode,
        managedIdentity: true,
        candidatePayload: globalThis.structuredClone(
          candidate.candidatePayload,
        ),
        candidatePayloadSha256: candidate.candidatePayloadSha256,
        signatureBase64: sign(
          null,
          encodeRuntimeConformanceCertificatePayloadV119(
            candidate.candidatePayload,
          ),
          loaded.producerPrivateKey,
        ).toString("base64"),
      }
      const verified = verifyRuntimeConformanceCertificateV119({
        mode,
        certificate,
        expectedIdentity: candidate.candidatePayload.identity,
        expectedRunBinding: candidate.expectedRunBinding,
        verificationInstant: candidate.candidatePayload.issuedAt,
        trustedProducers: [trustedProducer],
      })
      const importPayload: RuntimeEvidenceAuthorityImportPayload = {
        schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_IMPORT_SCHEMA_VERSION,
        domain: "conformance-certificate",
        eventId: `observation-v1.19-import:${verified.certificateSha256.slice(-32)}`,
        producerId: operator.producerId,
        producerKeyId: operator.keyId,
        trustDomain: operator.trustDomain,
        issuedAt: candidate.candidatePayload.issuedAt,
        validUntil: candidate.candidatePayload.freshUntil,
        action: null,
        laneIdentityHash: null,
        reasonCode: "REVIEWED_INACTIVE_OBSERVATION_CERTIFICATE",
        evidenceReferenceHash:
          candidate.candidatePayload.identity.evidenceGraphRoot,
        compensatesEventId: null,
        targetCertificateId: verified.certificateId,
        targetCertificateRecordHash: verified.certificateSha256,
        replacementCertificateId: null,
        replacementCertificateRecordHash: null,
      }
      const imported: Readonly<ImportedRuntimeConformanceCertificateV119> =
        await importCertificate(pool, {
          mode,
          certificate,
          expectedIdentity: candidate.candidatePayload.identity,
          expectedRunBinding: candidate.expectedRunBinding,
          verificationInstant: candidate.candidatePayload.issuedAt,
          trustedProducers: [trustedProducer],
          importEnvelope: {
            payload: importPayload,
            signatureBase64: sign(
              null,
              encodeRuntimeEvidenceAuthorityImportPayload(importPayload),
              loaded.importPrivateKey,
            ).toString("base64"),
          },
          trustedImportAuthorities: loaded.trustedImportAuthorities,
          ...(loaded.bootstrap === undefined
            ? {}
            : { requiredTrustRootBootstrap: loaded.bootstrap }),
        })
      if (
        imported.status !== "installed_inactive" ||
        imported.certificateId !== verified.certificateId ||
        imported.certificateSha256 !== verified.certificateSha256 ||
        imported.candidatePayloadSha256 !== candidate.candidatePayloadSha256 ||
        imported.languageId !== candidate.languageId
      )
        throw new TypeError("inactive observation import receipt mismatch")
      receipts.push({
        languageId: candidate.languageId,
        laneId: candidate.candidatePayload.identity.laneId,
        candidatePayloadSha256: candidate.candidatePayloadSha256,
        certificateId: verified.certificateId,
        certificateSha256: imported.certificateSha256,
        candidateAuthority: authorityReceipt(),
        runRoots: {
          resultRootSha256: candidate.expectedRunBinding.resultRootSha256,
          evidenceRootSha256: candidate.expectedRunBinding.evidenceRootSha256,
          runIds: candidate.candidatePayload.runs.map(({ runId }) => runId),
        },
        ledgerIdentity: {
          registryGeneration: "candidate-0",
          importEnvelopeHash: imported.importEnvelopeHash,
        },
        status: "installed_inactive",
      })
    }
    const manifest: ObservationV119ImportReceiptManifest = {
      schemaVersion: RECEIPT_SCHEMA,
      receipts,
    }
    publicSafe(manifest)
    const bytes = Buffer.from(canonicalBytes(manifest as unknown as JsonValue))
    await writeFile(receiptPath, bytes, { mode: 0o644 })
    checkManifest(JSON.parse(bytes.toString("utf8")) as unknown, candidates)
    stdout(JSON.stringify({ status: "passed", receipts: receipts.length }))
    return 0
  } catch (error) {
    dependencies.debugError?.(error)
    stderr(
      JSON.stringify({
        status: "failed",
        reasonCode: "OBSERVATION_V1_19_SIGN_IMPORT_FAILED",
      }),
    )
    return 1
  } finally {
    await ownedPool?.end()
  }
}

const main = async (): Promise<void> => {
  process.exitCode = await runObservationV119CertificateSignerCli(
    process.argv.slice(2),
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) void main()
