import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fsyncSync,
  linkSync,
  lstatSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  readV138RegularNoFollow,
  ensureV138TrustedDirectories,
  normalizeV138Relative,
  resolveV138RelativeNoFollow,
  trustedRootV138,
  withV138ExclusiveDirectoryLock,
} from "./v1-38-secure-workspace-path-v2.js"

const fail = (code: string): never => { throw new TypeError(code) }
const sha256 = (bytes: string | Buffer): `sha256:${string}` => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object") {
      return Object.fromEntries(Object.entries(item as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
    }
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}
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
  const intentRelative = normalizeV138Relative(input.intentPath)
  const lifecycleRelative = normalizeV138Relative(input.lifecycle.target)
  const normalizedSteps = input.steps.map((step) => ({ ...step, target: normalizeV138Relative(step.target) }))
  const allTargets = [...normalizedSteps.map(({ target }) => target), lifecycleRelative]
  if (new Set(allTargets).size !== allTargets.length || allTargets.includes(intentRelative)) fail("V138_LIFECYCLE_V2_TARGET_DUPLICATE")
  const intent = resolveV138RelativeNoFollow(root, intentRelative, "absent-or-regular")
  const lifecycle = resolveV138RelativeNoFollow(root, lifecycleRelative, "absent-or-regular")
  const [, staging] = ensureV138TrustedDirectories(root, [".v138-lifecycle-locks", ".v138-lifecycle-staging"])
  const descriptor = {
    schemaVersion: "v1.38-restartable-lifecycle-intent-descriptor-v2" as const,
    trustedRoot: root,
    transactionId: input.transactionId,
    intentPath: intentRelative,
    steps: normalizedSteps.map(({ id, target, beforeSha256, afterBytes }) => ({ id, target, beforeSha256, afterSha256: sha256(afterBytes) })),
    lifecycle: { target: lifecycleRelative, bytesSha256: sha256(input.lifecycle.bytes), bytes: input.lifecycle.bytes },
  }
  const namespace = sha256(`v138-lifecycle-v2\0${canonical(descriptor)}`).slice(7)
  const steps = normalizedSteps.map((step, index) => ({
    ...step,
    target: resolveV138RelativeNoFollow(root, step.target, "absent-or-regular"),
    afterSha256: sha256(step.afterBytes),
    stage: path.join(staging!, `${namespace}-${index}.after`),
    backup: path.join(staging!, `${namespace}-${index}.before`),
  }))
  const statusStage = path.join(staging!, `${namespace}.status`)

  // The kernel lock is held before this first intent/state read and remains
  // held through every CAS, status publication, and parent fsync.
  const readSecure = (target: string) => readV138RegularNoFollow(root, path.relative(root, target))
  const intentDocument = type(intent) === "regular" ? JSON.parse(readSecure(intent).toString("utf8")) as {
    schemaVersion: string
    namespace: string
    descriptor: typeof descriptor
    bindings: readonly { target: string; beforeSha256: `sha256:${string}`; device: string; inode: string }[]
  } : null
  if (intentDocument !== null && (
    intentDocument.schemaVersion !== "v1.38-restartable-lifecycle-intent-v2" ||
    intentDocument.namespace !== namespace ||
    canonical(intentDocument.descriptor) !== canonical(descriptor)
  )) fail("V138_LIFECYCLE_V2_INTENT_CONFLICT")
  const lifecyclePresent = type(lifecycle) === "regular"
  if (lifecyclePresent && !readSecure(lifecycle).equals(Buffer.from(input.lifecycle.bytes))) fail("V138_LIFECYCLE_V2_STATUS_CONFLICT")
  const states = steps.map((step, index) => {
    const binding = intentDocument?.bindings[index]
    if (type(step.target) === "absent") {
      if (binding !== undefined && binding.target === normalizedSteps[index]!.target && binding.beforeSha256 === step.beforeSha256 && type(step.backup) === "regular") {
        const backup = lstatSync(step.backup)
        if (sha256(readSecure(step.backup)) === step.beforeSha256 && String(backup.dev) === binding.device && String(backup.ino) === binding.inode) return "interrupted"
      }
      fail("V138_LIFECYCLE_V2_STEP_ABSENT")
    }
    const digest = sha256(readSecure(step.target))
    if (digest === step.beforeSha256) {
      if (binding !== undefined) {
        const status = lstatSync(step.target)
        if (binding.target !== normalizedSteps[index]!.target || binding.beforeSha256 !== step.beforeSha256 || String(status.dev) !== binding.device || String(status.ino) !== binding.inode) fail("V138_LIFECYCLE_V2_BINDING_CONFLICT")
      }
      return "before"
    }
    if (digest === step.afterSha256) return "after"
    fail("V138_LIFECYCLE_V2_STEP_STATE_INVALID")
  })
  if (lifecyclePresent && states.some((state) => state !== "after")) fail("V138_LIFECYCLE_V2_PREMATURE_STATUS")
  if (!lifecyclePresent && intentDocument === null && states.some((state) => state !== "before")) fail("V138_LIFECYCLE_V2_INTENT_REQUIRED")
  const bindings = intentDocument?.bindings ?? steps.map((step, index) => {
    const status = lstatSync(step.target)
    return { target: normalizedSteps[index]!.target, beforeSha256: step.beforeSha256, device: String(status.dev), inode: String(status.ino) }
  })
  if (bindings.length !== steps.length) fail("V138_LIFECYCLE_V2_BINDING_CONFLICT")
  const intentBytes = canonical({ schemaVersion: "v1.38-restartable-lifecycle-intent-v2", namespace, descriptor, bindings })
  if (intentDocument === null && !lifecyclePresent) { writeExclusive(intent, intentBytes); fsyncParent(intent) }
  else if (intentDocument !== null && !readSecure(intent).equals(Buffer.from(intentBytes))) fail("V138_LIFECYCLE_V2_INTENT_CONFLICT")

  for (const [index, step] of steps.entries()) {
    if (type(step.stage) === "regular" && !readSecure(step.stage).equals(Buffer.from(step.afterBytes))) fail("V138_LIFECYCLE_V2_STAGE_CONFLICT")
    if (type(step.backup) === "regular") {
      const binding = bindings[index]!
      const backup = lstatSync(step.backup)
      if (sha256(readSecure(step.backup)) !== step.beforeSha256 || String(backup.dev) !== binding.device || String(backup.ino) !== binding.inode) fail("V138_LIFECYCLE_V2_BACKUP_CONFLICT")
    }
  }
  if (type(statusStage) === "regular" && !readSecure(statusStage).equals(Buffer.from(input.lifecycle.bytes))) fail("V138_LIFECYCLE_V2_STATUS_STAGE_CONFLICT")

  for (const [index, step] of steps.entries()) {
    if (states[index] === "after") continue
    if (type(step.stage) === "absent") writeExclusive(step.stage, step.afterBytes)
    else if (!readSecure(step.stage).equals(Buffer.from(step.afterBytes))) fail("V138_LIFECYCLE_V2_STAGE_CONFLICT")
    if (type(step.target) === "regular") {
      if (type(step.backup) === "absent") linkSync(step.target, step.backup)
      if (sha256(readSecure(step.backup)) !== step.beforeSha256 || sha256(readSecure(step.target)) !== step.beforeSha256) fail("V138_LIFECYCLE_V2_CAS_PRECONDITION")
      const beforeTarget = lstatSync(step.target)
      const beforeBackup = lstatSync(step.backup)
      const binding = bindings[index]!
      if (beforeTarget.dev !== beforeBackup.dev || beforeTarget.ino !== beforeBackup.ino || String(beforeTarget.dev) !== binding.device || String(beforeTarget.ino) !== binding.inode) fail("V138_LIFECYCLE_V2_CAS_INODE_MISMATCH")
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
    if (type(statusStage) === "absent") writeExclusive(statusStage, input.lifecycle.bytes)
    else if (!readSecure(statusStage).equals(Buffer.from(input.lifecycle.bytes))) fail("V138_LIFECYCLE_V2_STATUS_STAGE_CONFLICT")
    try { linkSync(statusStage, lifecycle) } catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error }
  }
  if (!readSecure(lifecycle).equals(Buffer.from(input.lifecycle.bytes))) fail("V138_LIFECYCLE_V2_STATUS_POSTCONDITION")
  fsyncParent(lifecycle)
}

export const applyV138RestartableLifecycleTransactionV2 = (input: {
  trustedRoot: string
  transactionId: string
  intentPath: string
  steps: readonly V138LifecycleStepV2[]
  lifecycle: Readonly<{ target: string; bytes: string }>
}): Readonly<{ status: "complete"; stepsApplied: number }> => {
  const root = trustedRootV138(input.trustedRoot)
  const intent = normalizeV138Relative(input.intentPath)
  const stepTargets = input.steps.map(({ target }) => normalizeV138Relative(target))
  const lifecycleTarget = normalizeV138Relative(input.lifecycle.target)
  const allTargets = [...stepTargets, lifecycleTarget]
  if (new Set(allTargets).size !== allTargets.length || allTargets.includes(intent)) fail("V138_LIFECYCLE_V2_TARGET_DUPLICATE")
  resolveV138RelativeNoFollow(root, intent, "absent-or-regular")
  for (const target of allTargets) resolveV138RelativeNoFollow(root, target, "absent-or-regular")
  ensureV138TrustedDirectories(root, [".v138-lifecycle-locks", ".v138-lifecycle-staging"])
  const key = sha256([...allTargets].sort().join("\0")).slice(7)
  return withV138ExclusiveDirectoryLock(root, ".v138-lifecycle-locks", `${key}.lock`, () => {
    lifecycleWorker({ ...input, trustedRoot: root })
    return Object.freeze({ status: "complete" as const, stepsApplied: input.steps.length })
  })
}

if (process.argv[1] === V138_RESTARTABLE_LIFECYCLE_V2_CLI) {
  fail("V138_LIFECYCLE_V2_LIBRARY_ONLY")
}
