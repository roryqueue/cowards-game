import { createHash } from "node:crypto"
import { normalizeV138Relative } from "./v1-38-secure-workspace-path-v2.js"

const fail = (code: string): never => { throw new TypeError(code) }
const sha256 = (bytes: string): `sha256:${string}` => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object") return Object.fromEntries(Object.entries(item as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}

/** Pure public descriptions. The controller is the only mutation owner. */
export interface V138LifecycleStepV2 {
  readonly id: string
  readonly target: string
  readonly beforeSha256: `sha256:${string}`
  readonly afterBytes: string
}
export interface V138LifecycleTransactionV2 {
  readonly transactionId: string
  readonly intentPath: string
  readonly steps: readonly V138LifecycleStepV2[]
  readonly lifecycle: Readonly<{ target: string; bytes: string }>
}

export const deriveV138LifecycleIntentV2 = (
  trustedRootIdentity: Readonly<{ path: string; device: string; inode: string }>,
  input: V138LifecycleTransactionV2,
): Readonly<{
  namespace: string
  intentBytes: string
  intentPath: string
  steps: readonly V138LifecycleStepV2[]
  lifecycle: Readonly<{ target: string; bytes: string }>
}> => {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/u.test(input.transactionId) || input.steps.length === 0) fail("V138_LIFECYCLE_V2_TRANSACTION_INVALID")
  const intentPath = normalizeV138Relative(input.intentPath)
  const steps = Object.freeze(input.steps.map((step) => Object.freeze({ ...step, target: normalizeV138Relative(step.target) })))
  const lifecycle = Object.freeze({ ...input.lifecycle, target: normalizeV138Relative(input.lifecycle.target) })
  const targets = [...steps.map(({ target }) => target), lifecycle.target]
  if (new Set(targets).size !== targets.length || targets.includes(intentPath)) fail("V138_LIFECYCLE_V2_TARGET_DUPLICATE")
  const descriptor = Object.freeze({
    schemaVersion: "v1.38-restartable-lifecycle-intent-descriptor-v2" as const,
    trustedRoot: Object.freeze({ ...trustedRootIdentity }),
    transactionId: input.transactionId,
    intentPath,
    steps: Object.freeze(steps.map(({ id, target, beforeSha256, afterBytes }) => Object.freeze({ id, target, beforeSha256, afterSha256: sha256(afterBytes) }))),
    lifecycle: Object.freeze({ target: lifecycle.target, bytesSha256: sha256(lifecycle.bytes) }),
  })
  const descriptorBytes = canonical(descriptor)
  const namespace = sha256(`v138-lifecycle-v2\0${descriptorBytes}`).slice(7)
  return Object.freeze({ namespace, intentBytes: canonical({ schemaVersion: "v1.38-restartable-lifecycle-intent-v2", namespace, descriptor }), intentPath, steps, lifecycle })
}
