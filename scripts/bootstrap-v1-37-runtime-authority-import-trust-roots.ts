#!/usr/bin/env -S pnpm exec tsx
import { readFile, stat, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import {
  bootstrapRuntimeEvidenceAuthorityImportTrustRoots,
  createDatabasePool,
  type BootstrapRuntimeEvidenceAuthorityImportTrustRootsInput,
  type RuntimeEvidenceAuthorityImportTrustRootBootstrapReceipt,
} from "../packages/persistence/src/index.js"
import type { Pool } from "pg"

type Bootstrap = (
  pool: Pool,
  input: BootstrapRuntimeEvidenceAuthorityImportTrustRootsInput,
) => Promise<Readonly<RuntimeEvidenceAuthorityImportTrustRootBootstrapReceipt>>

export interface RuntimeAuthorityImportTrustRootBootstrapCliDependencies {
  env?: Record<string, string | undefined>
  pool?: Pool
  bootstrap?: Bootstrap
  stdout?(line: string): void
  stderr?(line: string): void
}

const RECEIPT_SCHEMA_VERSION =
  "v1.37-runtime-authority-import-trust-roots-bootstrap-receipt-v1" as const

const required = (
  env: Record<string, string | undefined>,
  name: string,
): string => {
  const value = env[name]
  if (!value)
    throw new Error("missing protected import trust-root configuration")
  return value
}

const readProtectedDescriptor = async (descriptorPath: string) => {
  const metadata = await stat(descriptorPath, { bigint: false })
  if (
    !metadata.isFile() ||
    metadata.size < 2 ||
    metadata.size > 64 * 1024 ||
    (metadata.mode & 0o022) !== 0 ||
    (typeof process.getuid === "function" && metadata.uid !== process.getuid())
  ) {
    throw new Error("unsafe import trust-root descriptor")
  }
  const bytes = await readFile(descriptorPath)
  if (bytes.byteLength !== metadata.size) {
    throw new Error("import trust-root descriptor changed while reading")
  }
  return new Uint8Array(bytes)
}

const parseArgs = (args: readonly string[]) => {
  let check = false
  let receiptPath: string | undefined
  for (const arg of args) {
    if (arg === "--check" && !check) {
      check = true
      continue
    }
    if (
      arg.startsWith("--write-safe-receipt=") &&
      receiptPath === undefined &&
      arg.length > "--write-safe-receipt=".length
    ) {
      receiptPath = arg.slice("--write-safe-receipt=".length)
      continue
    }
    throw new Error("invalid bootstrap arguments")
  }
  if (!check) throw new Error("bootstrap requires --check")
  return { check, receiptPath }
}

const safeReceipt = (
  receipt: Readonly<RuntimeEvidenceAuthorityImportTrustRootBootstrapReceipt>,
) => ({
  schemaVersion: RECEIPT_SCHEMA_VERSION,
  status: receipt.status,
  descriptorSha256: receipt.descriptorSha256,
  producerId: receipt.producerId,
  keyId: receipt.keyId,
  trustDomain: receipt.trustDomain,
  publicKeyFingerprint: receipt.publicKeyFingerprint,
  generation: receipt.generation,
})

export const runRuntimeAuthorityImportTrustRootBootstrapCli = async (
  args: readonly string[],
  dependencies: RuntimeAuthorityImportTrustRootBootstrapCliDependencies = {},
): Promise<number> => {
  const env = dependencies.env ?? process.env
  const stdout = dependencies.stdout ?? console.log
  const stderr = dependencies.stderr ?? console.error
  const bootstrap =
    dependencies.bootstrap ?? bootstrapRuntimeEvidenceAuthorityImportTrustRoots
  let ownedPool: Pool | undefined
  try {
    const { receiptPath } = parseArgs(args)
    const databaseUrl = required(env, "DATABASE_URL")
    const descriptorPath = required(
      env,
      "COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_ROOTS_PATH",
    )
    const expectedDescriptorSha256 = required(
      env,
      "COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_ROOTS_EXPECTED_SHA256",
    )
    const producerId = required(
      env,
      "COWARDS_RUNTIME_AUTHORITY_IMPORT_PRODUCER_ID",
    )
    const keyId = required(env, "COWARDS_RUNTIME_AUTHORITY_IMPORT_KEY_ID")
    const trustDomain = required(
      env,
      "COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_DOMAIN",
    )
    await readProtectedDescriptor(descriptorPath)
    const pool =
      dependencies.pool ??
      (ownedPool = createDatabasePool({ connectionString: databaseUrl }))
    const receipt = await bootstrap(pool, {
      expectedDescriptorSha256,
      producerId,
      keyId,
      trustDomain,
      readDescriptorBytes: () => readProtectedDescriptor(descriptorPath),
    })
    const projected = safeReceipt(receipt)
    const encoded = Buffer.from(JSON.stringify(projected))
    if (receiptPath !== undefined) {
      let written: Buffer
      try {
        written = await readFile(receiptPath)
        const existing = JSON.parse(written.toString("utf8")) as Record<
          string,
          unknown
        >
        if (
          (existing.status !== "installed" &&
            existing.status !== "idempotent") ||
          JSON.stringify({ ...existing, status: projected.status }) !==
            encoded.toString("utf8")
        ) {
          throw new Error("safe receipt identity conflict")
        }
      } catch (error) {
        if (
          typeof error !== "object" ||
          error === null ||
          !("code" in error) ||
          error.code !== "ENOENT"
        ) {
          throw error
        }
        await writeFile(receiptPath, encoded, { mode: 0o644, flag: "wx" })
        written = await readFile(receiptPath)
      }
      const verified = JSON.parse(written.toString("utf8")) as Record<
        string,
        unknown
      >
      if (
        JSON.stringify({ ...verified, status: projected.status }) !==
        encoded.toString("utf8")
      ) {
        throw new Error("safe receipt verification failed")
      }
    }
    stdout(encoded.toString("utf8"))
    return 0
  } catch {
    stderr(
      JSON.stringify({
        status: "failed",
        code: "IMPORT_TRUST_ROOT_BOOTSTRAP_FAILED",
      }),
    )
    return 1
  } finally {
    await ownedPool?.end()
  }
}

const main = async (): Promise<void> => {
  process.exitCode = await runRuntimeAuthorityImportTrustRootBootstrapCli(
    process.argv.slice(2),
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) void main()
