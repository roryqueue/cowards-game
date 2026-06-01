import {
  SoldierBrainResultSchema,
  StrategyResultSchema,
  type RuntimeViolation,
  type SoldierBrainResult,
  type StrategyResult,
  type StrategyRevision,
} from "@cowards/spec"
import {
  success,
  type RuntimeResult,
  type StrategyRuntime,
} from "@cowards/engine"
import { createHash } from "node:crypto"
import { Buffer } from "node:buffer"
import {
  RUNTIME_OUTPUT_BYTES,
  RUNTIME_TIMEOUT_MS,
  toInvalidOutputViolation,
  toOversizedOutputViolation,
} from "./guards.js"
import type { StrategyExecutionAdapter } from "./adapter.js"
import { executeStrategyRuntimeAbiV114 } from "./abi-bridge.js"
import { workerThreadStrategyExecutionAdapter } from "./worker-thread-adapter.js"
import { validateStrategySource } from "./validation.js"

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  Object.getPrototypeOf(value) === Object.prototype

const isPromiseLike = (value: unknown): boolean =>
  value !== null &&
  typeof value === "object" &&
  "then" in value &&
  typeof (value as { then?: unknown }).then === "function"

const schemaFailureIsOversized = (message: string): boolean =>
  /exceeds|too large|bytes/i.test(message)

const invalidPlainOutput = <T>(): RuntimeResult<T> => ({
  ok: false,
  violation: toInvalidOutputViolation(
    "Strategy method must return a plain synchronous object",
  ),
})

const normalizeStrategyOutput = (
  value: unknown,
): RuntimeResult<StrategyResult> => {
  if (!isPlainObject(value) || isPromiseLike(value)) {
    return invalidPlainOutput()
  }

  const parsed = StrategyResultSchema.safeParse(value)
  if (!parsed.success) {
    const message = parsed.error.message
    return {
      ok: false,
      violation: schemaFailureIsOversized(message)
        ? toOversizedOutputViolation(message)
        : toInvalidOutputViolation(message),
    }
  }

  return success(parsed.data as StrategyResult)
}

const normalizeSoldierBrainOutput = (
  value: unknown,
): RuntimeResult<SoldierBrainResult> => {
  if (!isPlainObject(value) || isPromiseLike(value)) {
    return invalidPlainOutput()
  }

  const parsed = SoldierBrainResultSchema.safeParse(value)
  if (!parsed.success) {
    const message = parsed.error.message
    return {
      ok: false,
      violation: schemaFailureIsOversized(message)
        ? toOversizedOutputViolation(message)
        : toInvalidOutputViolation(message),
    }
  }

  return success(parsed.data)
}

const executableSource = (
  revision: StrategyRevision,
):
  | { ok: true; source: string }
  | { ok: false; violation: RuntimeViolation } => {
  const artifact = revision.metadata.sourceArtifact
  const validation = validateStrategySource(revision.source, {
    runtimeVersion: revision.runtime.adapter.version,
    specVersion: revision.engineCompatibility.spec,
    engineVersion: revision.engineCompatibility.engine,
  })

  if (
    !validation.valid ||
    validation.sourceHash !== revision.sourceHash ||
    validation.sourceBytes !== revision.sourceBytes
  ) {
    return {
      ok: false,
      violation: toInvalidOutputViolation(
        "Strategy Revision failed runtime validation",
      ),
    }
  }

  if (
    artifact === undefined ||
    artifact.format !== "transpiled-javascript" ||
    artifact.validationStatus !== "valid" ||
    artifact.sourceHash !== revision.sourceHash ||
    artifact.sourceBytes !== revision.sourceBytes ||
    artifact.abiVersion !== revision.runtime.abiVersion ||
    artifact.toolchain.language !== "typescript" ||
    artifact.bytesBase64 === undefined
  ) {
    return {
      ok: false,
      violation: toInvalidOutputViolation(
        "Strategy Revision failed artifact validation",
      ),
    }
  }

  const artifactBytes = Buffer.from(artifact.bytesBase64, "base64")
  const artifactHash = createHash("sha256").update(artifactBytes).digest("hex")
  if (
    artifactBytes.byteLength !== artifact.bytes ||
    artifactHash !== artifact.hash
  ) {
    return {
      ok: false,
      violation: toInvalidOutputViolation(
        "Strategy Revision failed artifact validation",
      ),
    }
  }

  return { ok: true, source: artifactBytes.toString("utf8") }
}

const WORKER_STARTUP_TIMEOUT_MS = RUNTIME_TIMEOUT_MS * 10

export interface CreateRuntimeFromRevisionOptions {
  adapter?: StrategyExecutionAdapter | undefined
  timeoutMs?: number | undefined
  outputByteLimit?: number | undefined
}

export const createRuntimeFromRevision = (
  revision: StrategyRevision,
  options: CreateRuntimeFromRevisionOptions = {},
): StrategyRuntime => {
  const adapter = options.adapter ?? workerThreadStrategyExecutionAdapter
  const timeoutMs = options.timeoutMs ?? WORKER_STARTUP_TIMEOUT_MS
  const outputByteLimit = options.outputByteLimit ?? RUNTIME_OUTPUT_BYTES

  return {
    selectActivations(input) {
      const source = executableSource(revision)
      if (!source.ok) {
        return source
      }

      const result = executeStrategyRuntimeAbiV114({
        adapter,
        revision,
        executableSource: source.source,
        methodName: "selectActivations",
        input,
        timeoutMs,
        outputByteLimit,
      })
      if (!result.ok) {
        return result
      }

      return normalizeStrategyOutput(result.value)
    },

    runSoldierBrain(input) {
      const source = executableSource(revision)
      if (!source.ok) {
        return source
      }

      const result = executeStrategyRuntimeAbiV114({
        adapter,
        revision,
        executableSource: source.source,
        methodName: "soldierBrain",
        input,
        timeoutMs,
        outputByteLimit,
      })
      if (!result.ok) {
        return result
      }

      return normalizeSoldierBrainOutput(result.value)
    },
  }
}
