import { buildChronicleFromMatch } from "@cowards/replay"
import {
  createRepositories,
  claimNextMatchJob,
  completeMatch,
  recordAttemptFailure,
  type ClaimedMatchJob,
} from "@cowards/persistence"
import { createRuntimeFromRevision } from "@cowards/runtime-js/worker"
import {
  violation,
  type RunMatchInput,
  type StrategyRuntime,
} from "@cowards/engine"
import type { Pool } from "pg"

export interface WorkerRunnerOptions {
  workerId: string
  once?: boolean
  pollMs?: number
}

export interface WorkerRunnerDependencies {
  claimNextMatchJob: typeof claimNextMatchJob
  loadRunMatchInput: (
    pool: Pool,
    matchId: string,
  ) => Promise<RunMatchInput>
  buildChronicleFromMatch: typeof buildChronicleFromMatch
  completeMatch: typeof completeMatch
  recordAttemptFailure: typeof recordAttemptFailure
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const createSideDispatchRuntime = (
  bottomRuntime: StrategyRuntime,
  topRuntime: StrategyRuntime,
): StrategyRuntime => ({
  selectActivations(input) {
    const playerId = input.mySoldiers[0]?.ownerPlayerId
    if (playerId === "player:bottom") {
      return bottomRuntime.selectActivations(input)
    }
    if (playerId === "player:top") {
      return topRuntime.selectActivations(input)
    }
    return violation("INVALID_OUTPUT", "Cannot resolve player runtime")
  },

  runSoldierBrain(input) {
    const playerId = input.self.ownerPlayerId
    if (playerId === "player:bottom") {
      return bottomRuntime.runSoldierBrain(input)
    }
    if (playerId === "player:top") {
      return topRuntime.runSoldierBrain(input)
    }
    return violation("INVALID_OUTPUT", "Cannot resolve soldier runtime")
  },
})

export const loadRunMatchInput = async (
  pool: Pool,
  matchId: string,
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
      createRuntimeFromRevision(bottomRevision),
      createRuntimeFromRevision(topRevision),
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

export const runWorkerOnce = async (
  pool: Pool,
  options: WorkerRunnerOptions,
  dependencies: WorkerRunnerDependencies = defaultDependencies,
): Promise<"completed" | "failed_system" | "idle"> => {
  const claimed = await dependencies.claimNextMatchJob(pool, {
    workerId: options.workerId,
  })
  if (!claimed) {
    return "idle"
  }

  try {
    const input = await dependencies.loadRunMatchInput(pool, claimed.matchId)
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
      details: {
        workerId: options.workerId,
        matchId: claimed.matchId,
      },
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
  do {
    await runWorkerOnce(pool, options, dependencies)
    if (options.once) {
      break
    }
    await sleep(pollMs)
  } while (true)
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
