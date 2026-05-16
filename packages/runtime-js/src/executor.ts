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
import {
  RUNTIME_TIMEOUT_MS,
  toInvalidOutputViolation,
  toOversizedOutputViolation,
} from "./guards.js"
import { transpileStrategySource } from "./transpile.js"
import { runStrategyMethodInWorker } from "./worker-bridge.js"

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
  if (!revision.validation.valid) {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "Strategy Revision is not valid",
      },
    }
  }

  const transpiled = transpileStrategySource(revision.source)
  if (!transpiled.ok) {
    return {
      ok: false,
      violation: toInvalidOutputViolation(transpiled.message),
    }
  }

  return { ok: true, source: transpiled.code }
}

const WORKER_STARTUP_TIMEOUT_MS = RUNTIME_TIMEOUT_MS * 10

export const createRuntimeFromRevision = (
  revision: StrategyRevision,
): StrategyRuntime => ({
  selectActivations(input) {
    const source = executableSource(revision)
    if (!source.ok) {
      return source
    }

    const result = runStrategyMethodInWorker({
      source: source.source,
      methodName: "selectActivations",
      input,
      timeoutMs: WORKER_STARTUP_TIMEOUT_MS,
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

    const result = runStrategyMethodInWorker({
      source: source.source,
      methodName: "soldierBrain",
      input,
      timeoutMs: WORKER_STARTUP_TIMEOUT_MS,
    })
    if (!result.ok) {
      return result
    }

    return normalizeSoldierBrainOutput(result.value)
  },
})
