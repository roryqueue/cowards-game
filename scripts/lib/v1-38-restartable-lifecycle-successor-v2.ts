import { Buffer } from "node:buffer"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  readV138RegularNoFollow,
  resolveV138RelativeNoFollow,
  trustedRootV138,
} from "./v1-38-secure-workspace-path-v2.js"

const fail = (code: string): never => { throw new TypeError(code) }
const sha256 = (bytes: string | Buffer): `sha256:${string}` => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
export const V138_RESTARTABLE_LIFECYCLE_V2_CLI = fileURLToPath(import.meta.url)

export interface V138LifecycleStepV2 {
  readonly id: string
  readonly target: string
  readonly beforeSha256: `sha256:${string}`
  readonly afterBytes: string
}

const type = (target: string): "absent" | "regular" => {
  try {
    const status = lstatSync(target)
    if (!status.isFile() || status.isSymbolicLink()) fail("V138_LIFECYCLE_V2_ENTRY_UNSAFE")
    return "regular"
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "absent"
    throw error
  }
}
const writeExclusive = (target: string, bytes: string): void => {
  const descriptor = openSync(target, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600)
  try { writeFileSync(descriptor, bytes); fsyncSync(descriptor) } finally { closeSync(descriptor) }
}
const fsyncParent = (target: string): void => {
  const descriptor = openSync(path.dirname(target), constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try { fsyncSync(descriptor) } finally { closeSync(descriptor) }
}

const lifecycleWorker = (input: {
  trustedRoot: string
  transactionId: string
  intentPath: string
  steps: readonly V138LifecycleStepV2[]
  lifecycle: Readonly<{ target: string; bytes: string }>
}): void => {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/u.test(input.transactionId) || input.steps.length === 0) fail("V138_LIFECYCLE_V2_TRANSACTION_INVALID")
  const root = trustedRootV138(input.trustedRoot)
  const intent = resolveV138RelativeNoFollow(root, input.intentPath, "absent-or-regular")
  const lifecycle = resolveV138RelativeNoFollow(root, input.lifecycle.target, "absent-or-regular")
  const staging = path.join(root, ".v138-lifecycle-staging")
  mkdirSync(staging, { recursive: true, mode: 0o700 })
  const steps = input.steps.map((step, index) => ({
    ...step,
    target: resolveV138RelativeNoFollow(root, step.target, "absent-or-regular"),
    afterSha256: sha256(step.afterBytes),
    stage: path.join(staging, `${input.transactionId}-${index}.after`),
    backup: path.join(staging, `${input.transactionId}-${index}.before`),
  }))
  if (new Set([...steps.map(({ target }) => target), lifecycle]).size !== steps.length + 1) fail("V138_LIFECYCLE_V2_TARGET_DUPLICATE")
  const intentBytes = `${JSON.stringify({
    schemaVersion: "v1.38-restartable-lifecycle-intent-v2",
    transactionId: input.transactionId,
    steps: steps.map(({ id, target, beforeSha256, afterSha256 }) => ({ id, target: path.relative(root, target), beforeSha256, afterSha256 })),
    lifecycle: { target: path.relative(root, lifecycle), sha256: sha256(input.lifecycle.bytes) },
  })}\n`

  // The kernel lock is held before this first intent/state read and remains
  // held through every CAS, status publication, and parent fsync.
  const readSecure = (target: string) => readV138RegularNoFollow(root, path.relative(root, target))
  if (type(intent) === "regular" && !readSecure(intent).equals(Buffer.from(intentBytes))) fail("V138_LIFECYCLE_V2_INTENT_CONFLICT")
  const lifecyclePresent = type(lifecycle) === "regular"
  if (lifecyclePresent && !readSecure(lifecycle).equals(Buffer.from(input.lifecycle.bytes))) fail("V138_LIFECYCLE_V2_STATUS_CONFLICT")
  const states = steps.map((step) => {
    if (type(step.target) === "absent") {
      if (type(step.backup) === "regular" && sha256(readSecure(step.backup)) === step.beforeSha256) return "interrupted"
      fail("V138_LIFECYCLE_V2_STEP_ABSENT")
    }
    const digest = sha256(readSecure(step.target))
    if (digest === step.beforeSha256) return "before"
    if (digest === step.afterSha256) return "after"
    fail("V138_LIFECYCLE_V2_STEP_STATE_INVALID")
  })
  if (lifecyclePresent && states.some((state) => state !== "after")) fail("V138_LIFECYCLE_V2_PREMATURE_STATUS")
  if (!lifecyclePresent && type(intent) === "absent") { writeExclusive(intent, intentBytes); fsyncParent(intent) }

  for (const [index, step] of steps.entries()) {
    if (states[index] === "after") continue
    if (type(step.stage) === "absent") writeExclusive(step.stage, step.afterBytes)
    else if (!readSecure(step.stage).equals(Buffer.from(step.afterBytes))) fail("V138_LIFECYCLE_V2_STAGE_CONFLICT")
    if (type(step.target) === "regular") {
      if (type(step.backup) === "absent") linkSync(step.target, step.backup)
      if (sha256(readSecure(step.backup)) !== step.beforeSha256 || sha256(readSecure(step.target)) !== step.beforeSha256) fail("V138_LIFECYCLE_V2_CAS_PRECONDITION")
      const beforeTarget = lstatSync(step.target)
      const beforeBackup = lstatSync(step.backup)
      if (beforeTarget.dev !== beforeBackup.dev || beforeTarget.ino !== beforeBackup.ino) fail("V138_LIFECYCLE_V2_CAS_INODE_MISMATCH")
      unlinkSync(step.target)
    }
    try { linkSync(step.stage, step.target) } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error
    }
    if (sha256(readSecure(step.target)) !== step.afterSha256) fail("V138_LIFECYCLE_V2_CAS_CONFLICT")
    fsyncParent(step.target)
  }
  for (const step of steps) if (sha256(readSecure(step.target)) !== step.afterSha256) fail("V138_LIFECYCLE_V2_POSTCONDITION")
  if (type(lifecycle) === "absent") {
    const statusStage = path.join(staging, `${input.transactionId}.status`)
    if (type(statusStage) === "absent") writeExclusive(statusStage, input.lifecycle.bytes)
    try { linkSync(statusStage, lifecycle) } catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error }
  }
  if (!readSecure(lifecycle).equals(Buffer.from(input.lifecycle.bytes))) fail("V138_LIFECYCLE_V2_STATUS_POSTCONDITION")
  fsyncParent(lifecycle)
  if (type(intent) === "regular") unlinkSync(intent)
  fsyncParent(intent)
}

export const applyV138RestartableLifecycleTransactionV2 = (input: {
  trustedRoot: string
  transactionId: string
  intentPath: string
  steps: readonly V138LifecycleStepV2[]
  lifecycle: Readonly<{ target: string; bytes: string }>
}): Readonly<{ status: "complete"; stepsApplied: number }> => {
  const root = trustedRootV138(input.trustedRoot)
  const key = sha256([...input.steps.map(({ target }) => target), input.lifecycle.target].sort().join("\0")).slice(7)
  const lockDirectory = path.join(root, ".v138-lifecycle-locks")
  mkdirSync(lockDirectory, { recursive: true, mode: 0o700 })
  execFileSync("/usr/bin/lockf", ["-t", "10", path.join(lockDirectory, `${key}.lock`), process.execPath, "--import", "tsx", V138_RESTARTABLE_LIFECYCLE_V2_CLI, "--lifecycle-worker", Buffer.from(JSON.stringify(input)).toString("base64")], { stdio: "pipe" })
  return Object.freeze({ status: "complete", stepsApplied: input.steps.length })
}

if (process.argv[1] === V138_RESTARTABLE_LIFECYCLE_V2_CLI) {
  const payload = process.argv[3]
  if ((process.argv[2] !== "--lifecycle-worker" && process.argv[2] !== "--synthetic-lifecycle") || payload === undefined) fail("V138_LIFECYCLE_V2_SOURCE_ONLY")
  const input = JSON.parse(Buffer.from(payload, "base64").toString("utf8"))
  if (process.argv[2] === "--lifecycle-worker") lifecycleWorker(input)
  else applyV138RestartableLifecycleTransactionV2(input)
}
