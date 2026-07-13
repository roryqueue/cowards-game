import type { MatchId } from "@cowards/spec"
import type { Pool } from "pg"
import type { WorkerRuntimeConfig } from "./runtime-config.js"

export const TYPESCRIPT_WORKER_RETIRED_ERROR_CODE =
  "TYPESCRIPT_WORKER_RETIRED" as const
export const TYPESCRIPT_WORKER_RETIRED_ERROR_MESSAGE =
  "Direct TypeScript Match worker execution is retired." as const

export interface WorkerRunnerOptions {
  workerId: string
  once?: boolean
  matchIds?: readonly MatchId[] | undefined
  pollMs?: number
  leaseMs?: number | undefined
  runtimeConfig?: WorkerRuntimeConfig | undefined
  jobOwnership?: unknown
}

/**
 * Kept as an injection surface only so retired callers and regression tests can
 * prove that no claim, execution, Chronicle, persistence, or penalty effect is
 * reachable. None of these dependencies has a production default.
 */
export interface WorkerRunnerDependencies {
  claimNextMatchJob?: ((...args: never[]) => unknown) | undefined
  loadRunMatchInput?: ((...args: never[]) => unknown) | undefined
  createRuntimeFromRevision?: ((...args: never[]) => unknown) | undefined
  createRuntimeConfig?: ((...args: never[]) => unknown) | undefined
  buildChronicleFromMatch?: ((...args: never[]) => unknown) | undefined
  completeMatch?: ((...args: never[]) => unknown) | undefined
  recordAttemptFailure?: ((...args: never[]) => unknown) | undefined
  mutateMatchFailure?: ((...args: never[]) => unknown) | undefined
  recordPlayerPenalty?: ((...args: never[]) => unknown) | undefined
}

export class TypeScriptWorkerRetiredError extends Error {
  readonly code = TYPESCRIPT_WORKER_RETIRED_ERROR_CODE

  constructor() {
    super(TYPESCRIPT_WORKER_RETIRED_ERROR_MESSAGE)
    this.name = "TypeScriptWorkerRetiredError"
    Object.defineProperty(this, "stack", { value: undefined })
  }
}

const throwTypeScriptWorkerRetired = (): never => {
  throw new TypeScriptWorkerRetiredError()
}

export const assertTypeScriptWorkerJobOwnershipAllowed = (
  _config?: unknown,
): never => throwTypeScriptWorkerRetired()

export const assertTypeScriptWorkerEntrypointAllowed = (
  _env?: Record<string, string | undefined>,
): never => throwTypeScriptWorkerRetired()

export const runWorkerOnce = async (
  _pool: Pool,
  _options?: WorkerRunnerOptions,
  _dependencies?: WorkerRunnerDependencies,
): Promise<never> => {
  return assertTypeScriptWorkerEntrypointAllowed()
}

export const runWorkerLoop = async (
  _pool: Pool,
  _options?: WorkerRunnerOptions,
  _dependencies?: WorkerRunnerDependencies,
): Promise<never> => {
  return assertTypeScriptWorkerEntrypointAllowed()
}
