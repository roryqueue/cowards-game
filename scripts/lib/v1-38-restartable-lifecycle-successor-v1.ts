import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { publishV138NoReplaceUnderLockf } from "./v1-38-durable-publication-successor-v1.js"

const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (bytes: string | Buffer): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object") {
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, normalize(child)]),
      )
    }
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}

const safeType = (target: string): "absent" | "regular" | "unsafe" => {
  try {
    const status = lstatSync(target)
    return status.isFile() && !status.isSymbolicLink() ? "regular" : "unsafe"
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "absent"
    throw error
  }
}
const fsyncParent = (target: string): void => {
  const descriptor = openSync(path.dirname(target), constants.O_RDONLY)
  try {
    fsyncSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
}
const writeExclusiveDurable = (target: string, bytes: string): void => {
  const descriptor = openSync(
    target,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  )
  try {
    writeFileSync(descriptor, bytes)
    fsyncSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
}
const currentSha = (target: string): `sha256:${string}` => {
  if (safeType(target) !== "regular") fail("V138_LIFECYCLE_TARGET_UNSAFE")
  return sha256(readFileSync(target))
}

export interface V138LifecycleTransactionStep {
  readonly id: string
  readonly target: string
  readonly beforeSha256: `sha256:${string}`
  readonly afterBytes: string
}
export type V138LifecycleTransactionBoundary =
  | `step:${string}:applied`
  | "lifecycle:published"

/**
 * Applies prederived lifecycle bytes under a durable intent. Restart observes
 * each exact before/after hash, so commands are never replayed and append-like
 * state history cannot duplicate. The immutable lifecycle status is the final
 * no-replace commit point and is published only after all postconditions hold.
 */
export const applyV138RestartableLifecycleTransaction = (input: {
  transactionId: string
  intentPath: string
  lockPath: string
  steps: readonly V138LifecycleTransactionStep[]
  lifecycle: Readonly<{ target: string; bytes: string }>
  crashBoundary?: (boundary: V138LifecycleTransactionBoundary) => void
}): Readonly<{ status: "complete"; stepsApplied: number }> => {
  if (
    !/^[a-z0-9][a-z0-9-]{0,63}$/u.test(input.transactionId) ||
    input.steps.length === 0 ||
    new Set(input.steps.map(({ id }) => id)).size !== input.steps.length ||
    input.steps.some(({ id }) => !/^[a-z0-9][a-z0-9_-]{0,63}$/u.test(id))
  ) {
    return fail("V138_LIFECYCLE_TRANSACTION_INVALID")
  }
  const intentPath = path.resolve(input.intentPath)
  const steps = input.steps.map((step, index) => ({
    ...step,
    target: path.resolve(step.target),
    afterSha256: sha256(step.afterBytes),
    stage: `${path.resolve(step.target)}.lifecycle-${input.transactionId}-${index}`,
  }))
  const lifecycleTarget = path.resolve(input.lifecycle.target)
  if (
    new Set([...steps.map(({ target }) => target), lifecycleTarget]).size !==
    steps.length + 1
  ) {
    return fail("V138_LIFECYCLE_TARGET_DUPLICATE")
  }
  const intent = canonical({
    schemaVersion: "v1.38-restartable-lifecycle-intent-v1",
    transactionId: input.transactionId,
    steps: steps.map(
      ({ id, target, beforeSha256, afterSha256, stage, afterBytes }) => ({
        id,
        target,
        beforeSha256,
        afterSha256,
        stage,
        afterBytesBase64: Buffer.from(afterBytes).toString("base64"),
      }),
    ),
    lifecycle: {
      target: lifecycleTarget,
      sha256: sha256(input.lifecycle.bytes),
      bytesBase64: Buffer.from(input.lifecycle.bytes).toString("base64"),
    },
  })
  const intentType = safeType(intentPath)
  if (intentType === "absent") {
    writeExclusiveDurable(intentPath, intent)
    fsyncParent(intentPath)
  } else if (
    intentType !== "regular" ||
    !readFileSync(intentPath).equals(Buffer.from(intent))
  ) {
    return fail("V138_LIFECYCLE_INTENT_MISMATCH")
  }

  // Validate the entire prefix/suffix state before mutating another target.
  // Restart permits only exact before or exact postcondition bytes.
  for (const step of steps) {
    const digest = currentSha(step.target)
    if (digest !== step.beforeSha256 && digest !== step.afterSha256) {
      return fail("V138_LIFECYCLE_STEP_STATE_INVALID")
    }
  }
  const lifecycleType = safeType(lifecycleTarget)
  if (
    lifecycleType === "unsafe" ||
    (lifecycleType === "regular" &&
      !readFileSync(lifecycleTarget).equals(Buffer.from(input.lifecycle.bytes)))
  ) {
    return fail("V138_LIFECYCLE_STATUS_CONFLICT")
  }

  for (const step of steps) {
    if (currentSha(step.target) === step.beforeSha256) {
      const stageType = safeType(step.stage)
      if (stageType === "absent") writeExclusiveDurable(step.stage, step.afterBytes)
      else if (
        stageType !== "regular" ||
        !readFileSync(step.stage).equals(Buffer.from(step.afterBytes))
      ) {
        return fail("V138_LIFECYCLE_STAGE_MISMATCH")
      }
      if (currentSha(step.target) !== step.beforeSha256) {
        return fail("V138_LIFECYCLE_STEP_RACE")
      }
      renameSync(step.stage, step.target)
      fsyncParent(step.target)
    }
    if (currentSha(step.target) !== step.afterSha256) {
      return fail("V138_LIFECYCLE_POSTCONDITION_INVALID")
    }
    input.crashBoundary?.(`step:${step.id}:applied`)
  }

  if (safeType(lifecycleTarget) === "absent") {
    publishV138NoReplaceUnderLockf({
      transactionId: `${input.transactionId}-status`,
      lockPath: input.lockPath,
      target: lifecycleTarget,
      bytes: input.lifecycle.bytes,
    })
  }
  if (!readFileSync(lifecycleTarget).equals(Buffer.from(input.lifecycle.bytes))) {
    return fail("V138_LIFECYCLE_STATUS_POSTCONDITION_INVALID")
  }
  input.crashBoundary?.("lifecycle:published")

  if (safeType(intentPath) === "regular") unlinkSync(intentPath)
  fsyncParent(intentPath)
  return Object.freeze({
    status: "complete" as const,
    stepsApplied: steps.length,
  })
}
