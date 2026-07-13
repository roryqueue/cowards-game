#!/usr/bin/env -S pnpm exec tsx
import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto"
import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
// eslint-disable-next-line no-restricted-imports -- Operator script executes from the workspace root.
import {
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  inspectRuntimeEvidenceAuthorityBundle,
} from "../packages/spec/src/index.js"
// eslint-disable-next-line no-restricted-imports -- Operator script executes from the workspace root.
import {
  createDatabasePool,
  installRuntimeEvidenceAuthorityPublication,
  prepareRuntimeEvidenceAuthorityPublication,
  type InstallRuntimeEvidenceAuthorityPublicationInput,
  type InstalledRuntimeEvidenceAuthorityPublication,
  type PrepareRuntimeEvidenceAuthorityPublicationInput,
  type PreparedRuntimeEvidenceAuthorityPublication,
  type RuntimeEvidenceAuthorityImportTrustRoot,
} from "../packages/persistence/src/index.js"
import type { Pool } from "pg"

type PreparePublication = (
  pool: Pool,
  input: PrepareRuntimeEvidenceAuthorityPublicationInput,
) => Promise<Readonly<PreparedRuntimeEvidenceAuthorityPublication>>

type InstallPublication = (
  pool: Pool,
  input: InstallRuntimeEvidenceAuthorityPublicationInput,
) => Promise<Readonly<InstalledRuntimeEvidenceAuthorityPublication>>

export interface RuntimeEvidenceAuthorityPublisherCliDependencies {
  env?: Record<string, string | undefined>
  stdout?(line: string): void
  stderr?(line: string): void
  pool?: Pool
  preparePublication?: PreparePublication
  installPublication?: InstallPublication
}

const required = (
  env: Record<string, string | undefined>,
  name: string,
): string => {
  const value = env[name]
  if (!value) throw new Error("missing protected authority configuration")
  return value
}

const loadImportTrustRoots = async (
  env: Record<string, string | undefined>,
): Promise<readonly RuntimeEvidenceAuthorityImportTrustRoot[]> => {
  const trustRootsPath = env.COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_ROOTS_PATH
  if (!trustRootsPath) return Object.freeze([])
  const parsed: unknown = JSON.parse(await readFile(trustRootsPath, "utf8"))
  if (!Array.isArray(parsed)) throw new Error("invalid authority trust roots")
  return Object.freeze(
    parsed.map((entry) => {
      if (
        entry === null ||
        typeof entry !== "object" ||
        typeof entry.producerId !== "string" ||
        typeof entry.keyId !== "string" ||
        typeof entry.trustDomain !== "string" ||
        typeof entry.publicKeyPem !== "string"
      ) {
        throw new Error("invalid authority trust root")
      }
      return Object.freeze({
        producerId: entry.producerId,
        keyId: entry.keyId,
        trustDomain: entry.trustDomain,
        publicKeyPem: entry.publicKeyPem,
      })
    }),
  )
}

export const runRuntimeEvidenceAuthorityPublisherCli = async (
  dependencies: RuntimeEvidenceAuthorityPublisherCliDependencies = {},
): Promise<number> => {
  const env = dependencies.env ?? process.env
  const stdout = dependencies.stdout ?? console.log
  const stderr = dependencies.stderr ?? console.error
  const preparePublication =
    dependencies.preparePublication ??
    prepareRuntimeEvidenceAuthorityPublication
  const installPublication =
    dependencies.installPublication ??
    installRuntimeEvidenceAuthorityPublication
  let ownedPool: Pool | undefined
  try {
    const databaseUrl = required(env, "DATABASE_URL")
    const privateKeyPath = required(
      env,
      "COWARDS_RUNTIME_AUTHORITY_PRIVATE_KEY_PATH",
    )
    const publicKeyPath = required(
      env,
      "COWARDS_RUNTIME_AUTHORITY_PUBLIC_KEY_PATH",
    )
    const targetPath = required(env, "COWARDS_RUNTIME_AUTHORITY_TARGET_PATH")
    const signerKeyId = required(env, "COWARDS_RUNTIME_AUTHORITY_SIGNER_KEY_ID")
    const issuedAt = required(env, "COWARDS_RUNTIME_AUTHORITY_ISSUED_AT")
    const validFrom = required(env, "COWARDS_RUNTIME_AUTHORITY_VALID_FROM")
    const validUntil = required(env, "COWARDS_RUNTIME_AUTHORITY_VALID_UNTIL")
    const privateKeyMetadata = await stat(privateKeyPath)
    if ((privateKeyMetadata.mode & 0o077) !== 0) {
      throw new Error("authority private key permissions are not restrictive")
    }
    const [privateKeyBytes, publicKeyBytes, trustedImportAuthorities] =
      await Promise.all([
        readFile(privateKeyPath),
        readFile(publicKeyPath),
        loadImportTrustRoots(env),
      ])
    const privateKey = createPrivateKey(privateKeyBytes)
    const publicKey = createPublicKey(publicKeyBytes)
    const pool =
      dependencies.pool ??
      (ownedPool = createDatabasePool({ connectionString: databaseUrl }))
    const prepared = await preparePublication(pool, {
      issuedAt,
      validFrom,
      validUntil,
      trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
      signerKeyId,
      trustedImportAuthorities,
      signPayload: (payloadBytes) => sign(null, payloadBytes, privateKey),
    })

    inspectRuntimeEvidenceAuthorityBundle(prepared.envelopeBytes, {
      expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
      evaluationInstant: validFrom,
      trustedKeyIds: [signerKeyId],
      verifySignature: ({ payloadBytes, signature }) =>
        verify(null, payloadBytes, publicKey, signature),
    })
    const installed = await installPublication(pool, {
      publicationId: prepared.publicationId,
      targetPath,
      evaluationInstant: validFrom,
      expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
      signerKeyId,
      publicKeyPem: publicKeyBytes.toString("utf8"),
    })
    stdout(
      JSON.stringify({
        status: "installed",
        publicationId: installed.publicationId,
        generation: installed.generation,
        payloadSha256: prepared.payloadSha256,
        envelopeSha256: installed.envelopeSha256,
        reconciled: installed.reconciled,
      }),
    )
    return 0
  } catch {
    stderr(
      JSON.stringify({
        status: "failed",
        code: "AUTHORITY_PUBLICATION_FAILED",
      }),
    )
    return 1
  } finally {
    await ownedPool?.end()
  }
}

const main = async (): Promise<void> => {
  process.exitCode = await runRuntimeEvidenceAuthorityPublisherCli()
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  void main()
}
