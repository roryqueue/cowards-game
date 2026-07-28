#!/usr/bin/env -S pnpm exec tsx
import path from "node:path"
import { realpathSync } from "node:fs"
import { fileURLToPath } from "node:url"
import {
  checkV137RollbackProof,
  writeV137RollbackProof,
} from "./run-v1-37-rollback-proof.js"

const fail = (code: string): never => {
  throw new TypeError(code)
}

const main = async (): Promise<void> => {
  const args = process.argv.slice(2)
  if (args.length !== 1 || !["--write", "--check"].includes(args[0]!))
    fail("V137_ROLLBACK_MODE_INVALID")
  const mode = args[0]!
  const restrictedRoot = process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT
  if (!restrictedRoot) fail("V137_RESTRICTED_EVIDENCE_ROOT_REQUIRED")
  const repoRoot = path.resolve(import.meta.dirname, "..")
  const receipt =
    mode === "--write"
      ? (await writeV137RollbackProof(repoRoot, restrictedRoot)).receipt
      : checkV137RollbackProof(repoRoot, restrictedRoot)
  process.stdout.write(
    `${JSON.stringify({ status: receipt.status, scenarioCount: receipt.scenarios.length, aggregateRootSha256: receipt.aggregateRootSha256 })}\n`,
  )
}

const isDirectRun = (): boolean => { try { return !!process.argv[1] && realpathSync(path.resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url)) } catch { return false } }
if (isDirectRun()) void main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "V137_ROLLBACK_FAILED"}\n`,
  )
  process.exitCode = 1
})
