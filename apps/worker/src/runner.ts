import { buildChronicleFromMatch } from "@cowards/replay"
import { setTimeout as sleep } from "node:timers/promises"
import {
  createRepositories,
  claimNextMatchJob,
  completeMatch,
  recordAttemptFailure,
  type ClaimedMatchJob,
} from "@cowards/persistence"
import {
  createRuntimeFromRevision,
  SubprocessSystemFailure,
} from "@cowards/runtime-js/worker"
import {
  violation,
  type RunMatchInput,
  type StrategyRuntime,
} from "@cowards/engine"
import type { JsonValue, MatchId, PlayerId } from "@cowards/spec"
import type { Pool } from "pg"
import {
  createWorkerRuntimeConfig,
  type WorkerRuntimeConfig,
} from "./runtime-config.js"

export interface WorkerRunnerOptions {
  workerId: string
  once?: boolean
  matchIds?: readonly MatchId[] | undefined
  pollMs?: number
  leaseMs?: number | undefined
  runtimeConfig?: WorkerRuntimeConfig | undefined
  jobOwnership?: TypeScriptWorkerJobOwnershipConfig | undefined
}

export interface WorkerRunnerDependencies {
  claimNextMatchJob: typeof claimNextMatchJob
  loadRunMatchInput: (
    pool: Pool,
    matchId: string,
    runtimeConfig?: WorkerRuntimeConfig | undefined,
  ) => Promise<RunMatchInput>
  buildChronicleFromMatch: typeof buildChronicleFromMatch
  completeMatch: typeof completeMatch
  recordAttemptFailure: typeof recordAttemptFailure
}

export interface TypeScriptWorkerJobOwnershipConfig {
  lifecycleOwner: "typescript" | "go" | "unspecified"
  workerPurpose: "normal" | "rollback" | "test" | "parity"
}

export class TypeScriptWorkerOwnershipError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TypeScriptWorkerOwnershipError"
  }
}

export const createSideDispatchRuntime = (
  bottomRuntime: StrategyRuntime,
  topRuntime: StrategyRuntime,
  playerIds: { bottomPlayerId: PlayerId; topPlayerId: PlayerId },
): StrategyRuntime => ({
  selectActivations(input) {
    const playerId = input.mySoldiers[0]?.ownerPlayerId
    if (playerId === playerIds.bottomPlayerId) {
      return bottomRuntime.selectActivations(input)
    }
    if (playerId === playerIds.topPlayerId) {
      return topRuntime.selectActivations(input)
    }
    return violation("INVALID_OUTPUT", "Cannot resolve player runtime")
  },

  runSoldierBrain(input) {
    const playerId = input.self.ownerPlayerId
    if (playerId === playerIds.bottomPlayerId) {
      return bottomRuntime.runSoldierBrain(input)
    }
    if (playerId === playerIds.topPlayerId) {
      return topRuntime.runSoldierBrain(input)
    }
    return violation("INVALID_OUTPUT", "Cannot resolve soldier runtime")
  },
})

export const loadRunMatchInput = async (
  pool: Pool,
  matchId: string,
  runtimeConfig: WorkerRuntimeConfig = createWorkerRuntimeConfig(),
): Promise<RunMatchInput> => {
  const repositories = createRepositories(pool)
  const match = await repositories.getMatch(matchId)
  if (!match) {
    throw new Error(`Match not found: ${matchId}`)
  }
  const bottomStrategyRevisionId = String(match.bottom_strategy_revision_id)
  const topStrategyRevisionId = String(match.top_strategy_revision_id)
  const bottomRevision = await repositories.getStrategyRevision(
    bottomStrategyRevisionId,
  )
  const topRevision = await repositories.getStrategyRevision(
    topStrategyRevisionId,
  )
  const arenaVariant = await repositories.getArenaVariant(
    String(match.arena_variant_id),
  )
  if (!bottomRevision || !topRevision || !arenaVariant) {
    throw new Error(`Match inputs are incomplete: ${matchId}`)
  }

  return {
    matchId,
    seed: String(match.seed),
    arenaVariant,
    bottomPlayerId: String(match.bottom_player_id),
    topPlayerId: String(match.top_player_id),
    bottomStrategyRevisionId,
    topStrategyRevisionId,
    runtime: createSideDispatchRuntime(
      createRuntimeFromRevision(bottomRevision, {
        adapter: runtimeConfig.adapter,
      }),
      createRuntimeFromRevision(topRevision, {
        adapter: runtimeConfig.adapter,
      }),
      {
        bottomPlayerId: String(match.bottom_player_id),
        topPlayerId: String(match.top_player_id),
      },
    ),
  }
}

const defaultDependencies: WorkerRunnerDependencies = {
  claimNextMatchJob,
  loadRunMatchInput,
  buildChronicleFromMatch,
  completeMatch,
  recordAttemptFailure,
}

export const createTypeScriptWorkerJobOwnershipConfig = (
  env: Record<string, string | undefined> = process.env,
): TypeScriptWorkerJobOwnershipConfig => {
  const lifecycleOwner =
    env.COWARDS_MATCH_JOB_LIFECYCLE_OWNER === "go" ||
    env.COWARDS_BACKEND_OWNER === "go"
      ? "go"
      : env.COWARDS_MATCH_JOB_LIFECYCLE_OWNER === "typescript" ||
          env.COWARDS_BACKEND_OWNER === "typescript"
        ? "typescript"
        : "unspecified"
  const rawPurpose = env.COWARDS_TYPESCRIPT_WORKER_PURPOSE
  const workerPurpose =
    rawPurpose === "rollback" ||
    rawPurpose === "test" ||
    rawPurpose === "parity"
      ? rawPurpose
      : "normal"

  return { lifecycleOwner, workerPurpose }
}

export const assertTypeScriptWorkerJobOwnershipAllowed = (
  config: TypeScriptWorkerJobOwnershipConfig,
): void => {
  if (
    config.workerPurpose === "rollback" ||
    config.workerPurpose === "test" ||
    config.workerPurpose === "parity"
  ) {
    return
  }
  if (config.lifecycleOwner === "typescript") {
    return
  }
  throw new TypeScriptWorkerOwnershipError(
    "TypeScript Match job claiming is disabled unless TypeScript is explicitly selected as lifecycle owner or the worker purpose is rollback, test, or parity.",
  )
}

const isJsonScalar = (value: unknown): value is JsonValue =>
  value === null ||
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean"

const sanitizedSubprocessDetails = (
  details: Readonly<Record<string, unknown>> | undefined,
): JsonValue | undefined => {
  if (!details) {
    return undefined
  }

  const allowedKeys = [
    "cause",
    "signal",
    "status",
    "streamName",
    "actualBytes",
    "capBytes",
  ] as const
  const safeDetails: Record<string, JsonValue> = {}
  for (const key of allowedKeys) {
    const value = details[key]
    if (isJsonScalar(value)) {
      safeDetails[key] = value
    }
  }

  return Object.keys(safeDetails).length > 0 ? safeDetails : undefined
}

const attemptFailureDetails = (input: {
  workerId: string
  matchId: string
  runtimeConfig: WorkerRuntimeConfig
  error: unknown
}): JsonValue => {
  const details: Record<string, JsonValue> = {
    workerId: input.workerId,
    matchId: input.matchId,
    strategyExecutionAdapterId: input.runtimeConfig.metadata.id,
    strategyExecutionAdapterBoundary:
      input.runtimeConfig.metadata.isolationBoundary,
  }

  if (input.error instanceof SubprocessSystemFailure) {
    details.strategyExecutionSystemFailureCode = input.error.code
    const safeDetails = sanitizedSubprocessDetails(input.error.details)
    if (safeDetails) {
      details.strategyExecutionSystemFailureDetails = safeDetails
    }
  }

  return details
}

export const runWorkerOnce = async (
  pool: Pool,
  options: WorkerRunnerOptions,
  dependencies: WorkerRunnerDependencies = defaultDependencies,
): Promise<"completed" | "failed_system" | "idle"> => {
  assertTypeScriptWorkerJobOwnershipAllowed(
    options.jobOwnership ?? createTypeScriptWorkerJobOwnershipConfig(),
  )
  const runtimeConfig = options.runtimeConfig ?? createWorkerRuntimeConfig()
  const claimed = await dependencies.claimNextMatchJob(pool, {
    workerId: options.workerId,
    ...(options.matchIds === undefined ? {} : { matchIds: options.matchIds }),
    ...(options.leaseMs === undefined ? {} : { leaseMs: options.leaseMs }),
  })
  if (!claimed) {
    return "idle"
  }

  try {
    const input = await dependencies.loadRunMatchInput(
      pool,
      claimed.matchId,
      runtimeConfig,
    )
    const result = dependencies.buildChronicleFromMatch(input)
    await dependencies.completeMatch(pool, {
      jobId: claimed.jobId,
      leaseToken: claimed.leaseToken,
      chronicle: result.chronicle,
      finalState: result.finalState,
    })
    return "completed"
  } catch (error) {
    const failureStatus = await dependencies.recordAttemptFailure(pool, {
      jobId: claimed.jobId,
      leaseToken: claimed.leaseToken,
      errorClass: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
      retryable: true,
      details: attemptFailureDetails({
        workerId: options.workerId,
        matchId: claimed.matchId,
        runtimeConfig,
        error,
      }),
    })
    return failureStatus === "failed_system" ? "failed_system" : "idle"
  }
}

export const runWorkerLoop = async (
  pool: Pool,
  options: WorkerRunnerOptions,
  dependencies: WorkerRunnerDependencies = defaultDependencies,
): Promise<void> => {
  const pollMs = options.pollMs ?? 1_000
  let shouldContinue = true
  while (shouldContinue) {
    await runWorkerOnce(pool, options, dependencies)
    shouldContinue = options.once !== true
    await sleep(pollMs)
  }
}

export const createClaimedMatchJobForTest = (
  overrides: Partial<ClaimedMatchJob> = {},
): ClaimedMatchJob => ({
  jobId: "match-job:test",
  matchId: "match:test",
  attemptNumber: 1,
  leaseToken: "lease:test",
  leaseExpiresAt: new Date("2026-05-16T00:00:00.000Z"),
  ...overrides,
})
