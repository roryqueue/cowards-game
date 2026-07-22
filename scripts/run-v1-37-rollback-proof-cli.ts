#!/usr/bin/env -S pnpm exec tsx
import {
  checkV137RollbackProof,
  writeV137RollbackProof,
} from "./run-v1-37-rollback-proof.js"

const fail = (code: string): never => {
  throw new TypeError(code)
}

const main = async (): Promise<void> => {
  const mode = process.argv.find((argument) =>
    argument === "--write" || argument === "--check" ? true : false,
  )
  if (mode !== "--write" && mode !== "--check")
    fail("V137_ROLLBACK_MODE_INVALID")
  const restrictedRoot = process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT
  if (!restrictedRoot) fail("V137_RESTRICTED_EVIDENCE_ROOT_REQUIRED")
  const repoRoot = process.cwd()
  const receipt =
    mode === "--write"
      ? (await writeV137RollbackProof(repoRoot, restrictedRoot)).receipt
      : checkV137RollbackProof(repoRoot, restrictedRoot)
  process.stdout.write(
    `${JSON.stringify({ status: receipt.status, scenarioCount: receipt.scenarios.length, aggregateRootSha256: receipt.aggregateRootSha256 })}\n`,
  )
}

const keepAlive = setInterval(() => undefined, 1_000)
void main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "V137_ROLLBACK_FAILED"}\n`,
    )
    process.exitCode = 1
  })
  .finally(() => clearInterval(keepAlive))
