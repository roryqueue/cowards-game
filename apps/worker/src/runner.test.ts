import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Pool } from "pg"
import type { StrategyRuntime } from "@cowards/engine"
import { createRepositories } from "@cowards/persistence"
import {
  SubprocessSystemFailure,
  type StrategyExecutionRequest,
} from "@cowards/runtime-js/worker"
import { fixtures } from "@cowards/spec"
import type { ArenaVariant, StrategyRevision } from "@cowards/spec"
import type { WorkerRunnerDependencies } from "./runner.js"
import {
  createClaimedMatchJobForTest,
  createSideDispatchRuntime,
  loadRunMatchInput,
  runWorkerOnce,
} from "./runner.js"
import {
  createWorkerRuntimeConfig,
  formatWorkerRuntimeConfigLogLines,
  WorkerRuntimeConfigError,
  type WorkerRuntimeConfig,
} from "./runtime-config.js"

vi.mock("@cowards/persistence", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@cowards/persistence")>()
  return {
    ...actual,
    createRepositories: vi.fn(),
  }
})

const pool = {} as Pool

const baseDependencies = (): WorkerRunnerDependencies => ({
  claimNextMatchJob: vi.fn().mockResolvedValue(createClaimedMatchJobForTest()),
  loadRunMatchInput: vi.fn().mockResolvedValue({}),
  buildChronicleFromMatch: vi.fn().mockReturnValue({
    chronicle: {
      events: [{ type: "RUNTIME_VIOLATION" }],
    },
    finalState: {},
  }),
  completeMatch: vi.fn().mockResolvedValue({
    status: "complete",
    matchId: "match:test",
    chronicleId: "chronicle:test",
  }),
  recordAttemptFailure: vi.fn().mockResolvedValue("retry_queued"),
})

const executableStrategySource = (label: string): string => `
export default {
  selectActivations() {
    throw new Error("${label} default adapter executed")
  },
  soldierBrain() {
    throw new Error("${label} default adapter executed")
  },
}
`

const strategyRevision = (
  id: string,
  source: string = executableStrategySource(id),
): StrategyRevision => ({
  id,
  source,
  sourceHash: `${id}:hash`,
  sourceBytes: source.length,
  runtime: { name: "runtime-js", version: "test" },
  engineCompatibility: { spec: "test", engine: "test" },
  validation: {
    valid: true,
    errors: [],
    warnings: [],
    sourceBytes: source.length,
    forbiddenPatterns: [],
    sourceHash: `${id}:hash`,
    runtimeVersion: "test",
    engineCompatibility: { spec: "test", engine: "test" },
  },
  metadata: {},
})

const createCapturingRuntimeConfig = (): WorkerRuntimeConfig => {
  const metadata = createWorkerRuntimeConfig().metadata
  return {
    metadata,
    adapter: {
      metadata,
      execute: vi
        .fn()
        .mockImplementation((request: StrategyExecutionRequest) => {
          if (request.methodName === "soldierBrain") {
            return {
              ok: true,
              value: {
                action: { type: "TURN_TO_STONE" },
                soldierMemory: {},
              },
            }
          }

          return {
            ok: true,
            value: {
              activationOrders: [],
              strategyMemory: {},
            },
          }
        }),
    },
  }
}

const stubRepositories = (
  input: {
    bottomRevision?: StrategyRevision
    topRevision?: StrategyRevision
    arenaVariant?: ArenaVariant
  } = {},
) => {
  const bottomRevision =
    input.bottomRevision ?? strategyRevision("strategy-revision:bottom")
  const topRevision =
    input.topRevision ?? strategyRevision("strategy-revision:top")
  const arenaVariant = input.arenaVariant ?? fixtures.valid.standardArenaVariant
  const repositories = {
    getMatch: vi.fn().mockResolvedValue({
      seed: "seed:test",
      bottom_player_id: "player:bottom",
      top_player_id: "player:top",
      bottom_strategy_revision_id: bottomRevision.id,
      top_strategy_revision_id: topRevision.id,
      arena_variant_id: arenaVariant.id,
    }),
    getStrategyRevision: vi.fn().mockImplementation((id: string) => {
      if (id === bottomRevision.id) {
        return Promise.resolve(bottomRevision)
      }
      if (id === topRevision.id) {
        return Promise.resolve(topRevision)
      }
      return Promise.resolve(null)
    }),
    getArenaVariant: vi.fn().mockResolvedValue(arenaVariant),
  }
  vi.mocked(createRepositories).mockReturnValue(repositories as never)
  return repositories
}

describe("worker runner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("resolves worker-thread as the default Strategy execution adapter", () => {
    const runtimeConfig = createWorkerRuntimeConfig()

    expect(runtimeConfig.metadata.id).toBe("worker-thread")
    expect(runtimeConfig.metadata.default).toBe(true)
  })

  it("resolves explicit subprocess Strategy execution adapter config", () => {
    const runtimeConfig = createWorkerRuntimeConfig({
      strategyExecutionAdapter: "subprocess",
    })

    expect(runtimeConfig.metadata.id).toBe("subprocess")
    expect(runtimeConfig.metadata.default).toBe(false)
  })

  it("fails closed for unknown Strategy execution adapter ids", () => {
    expect(() =>
      createWorkerRuntimeConfig({
        strategyExecutionAdapter: "surprise-process",
      }),
    ).toThrow(WorkerRuntimeConfigError)
  })

  it("exposes active adapter id, label, and isolation boundary metadata", () => {
    const runtimeConfig = createWorkerRuntimeConfig()

    expect(runtimeConfig.metadata.id).toBeTruthy()
    expect(runtimeConfig.metadata.label).toBeTruthy()
    expect(runtimeConfig.metadata.isolationBoundary).toContain(
      "Strategy execution",
    )
  })

  it("formats startup logs with active adapter id and isolation boundary", () => {
    const runtimeConfig = createWorkerRuntimeConfig({
      strategyExecutionAdapter: "subprocess",
    })

    expect(formatWorkerRuntimeConfigLogLines(runtimeConfig)).toEqual([
      expect.stringContaining("subprocess"),
      expect.stringContaining(runtimeConfig.metadata.isolationBoundary),
    ])
  })

  it("routes strategy calls using persisted Match player IDs", () => {
    const bottomRuntime: StrategyRuntime = {
      selectActivations: vi.fn().mockReturnValue({ ok: true, value: {} }),
      runSoldierBrain: vi.fn().mockReturnValue({ ok: true, value: {} }),
    }
    const topRuntime: StrategyRuntime = {
      selectActivations: vi.fn().mockReturnValue({ ok: true, value: {} }),
      runSoldierBrain: vi.fn().mockReturnValue({ ok: true, value: {} }),
    }
    const runtime = createSideDispatchRuntime(bottomRuntime, topRuntime, {
      bottomPlayerId: "player:a",
      topPlayerId: "player:b",
    })

    runtime.selectActivations({
      mySoldiers: [{ ownerPlayerId: "player:a" }],
    } as never)
    runtime.runSoldierBrain({
      self: { ownerPlayerId: "player:b" },
    } as never)

    expect(bottomRuntime.selectActivations).toHaveBeenCalledOnce()
    expect(topRuntime.runSoldierBrain).toHaveBeenCalledOnce()
  })

  it("passes the selected adapter into bottom and top Strategy runtimes", async () => {
    stubRepositories()
    const runtimeConfig = createCapturingRuntimeConfig()

    const input = await loadRunMatchInput(pool, "match:test", runtimeConfig)

    expect(
      input.runtime.selectActivations({
        mySoldiers: [{ ownerPlayerId: "player:bottom" }],
      } as never),
    ).toEqual({
      ok: true,
      value: {
        activationOrders: [],
        strategyMemory: {},
      },
    })
    expect(
      input.runtime.selectActivations({
        mySoldiers: [{ ownerPlayerId: "player:top" }],
      } as never),
    ).toEqual({
      ok: true,
      value: {
        activationOrders: [],
        strategyMemory: {},
      },
    })
    expect(runtimeConfig.adapter.execute).toHaveBeenCalledTimes(2)
    expect(runtimeConfig.adapter.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        methodName: "selectActivations",
      }),
    )
  })

  it("completes Matches whose Chronicle includes RUNTIME_VIOLATION gameplay events", async () => {
    const dependencies = baseDependencies()

    await expect(
      runWorkerOnce(pool, { workerId: "worker:test" }, dependencies),
    ).resolves.toBe("completed")
    expect(dependencies.completeMatch).toHaveBeenCalledOnce()
    expect(dependencies.recordAttemptFailure).not.toHaveBeenCalled()
    expect(
      dependencies.buildChronicleFromMatch({} as never).chronicle.events[0]
        ?.type,
    ).toBe("RUNTIME_VIOLATION")
  })

  it("keeps RuntimeResult validation violations on the completion path", async () => {
    const dependencies = baseDependencies()
    vi.mocked(dependencies.loadRunMatchInput).mockResolvedValue({
      runtime: {
        selectActivations: vi.fn().mockReturnValue({
          ok: false,
          violation: {
            type: "INVALID_OUTPUT",
            message: "Strategy method must return a plain synchronous object",
          },
        }),
        runSoldierBrain: vi.fn(),
      },
    } as never)

    await expect(
      runWorkerOnce(pool, { workerId: "worker:test" }, dependencies),
    ).resolves.toBe("completed")
    expect(dependencies.completeMatch).toHaveBeenCalledOnce()
    expect(dependencies.recordAttemptFailure).not.toHaveBeenCalled()
  })

  it("records unexpected orchestration errors as system failures", async () => {
    const dependencies = baseDependencies()
    vi.mocked(dependencies.buildChronicleFromMatch).mockImplementation(() => {
      throw new Error("database write unavailable")
    })

    await expect(
      runWorkerOnce(pool, { workerId: "worker:test" }, dependencies),
    ).resolves.toBe("idle")
    expect(dependencies.recordAttemptFailure).toHaveBeenCalledWith(
      pool,
      expect.objectContaining({
        errorClass: "Error",
        errorMessage: "database write unavailable",
        retryable: true,
        details: expect.objectContaining({
          strategyExecutionAdapterId: "worker-thread",
        }),
      }),
    )
  })

  it("records malformed subprocess IPC as retryable system failure details", async () => {
    const dependencies = baseDependencies()
    const runtimeConfig = createWorkerRuntimeConfig({
      strategyExecutionAdapter: "subprocess",
    })
    vi.mocked(dependencies.buildChronicleFromMatch).mockImplementation(() => {
      throw new SubprocessSystemFailure(
        "MALFORMED_IPC",
        "Subprocess stdout was not valid JSON",
        {
          cause: "Unexpected token",
          stderr: "do not persist Strategy source",
        },
      )
    })

    await expect(
      runWorkerOnce(
        pool,
        { workerId: "worker:test", runtimeConfig },
        dependencies,
      ),
    ).resolves.toBe("idle")

    expect(dependencies.recordAttemptFailure).toHaveBeenCalledWith(
      pool,
      expect.objectContaining({
        errorClass: "SubprocessSystemFailure",
        errorMessage: "Subprocess stdout was not valid JSON",
        retryable: true,
        details: expect.objectContaining({
          strategyExecutionAdapterId: "subprocess",
          strategyExecutionSystemFailureCode: "MALFORMED_IPC",
          strategyExecutionSystemFailureDetails: {
            cause: "Unexpected token",
          },
        }),
      }),
    )
    expect(
      JSON.stringify(
        vi.mocked(dependencies.recordAttemptFailure).mock.calls[0]?.[1].details,
      ),
    ).not.toContain("Strategy source")
  })

  it("records subprocess signal failures and returns failed_system after retry exhaustion", async () => {
    const dependencies = baseDependencies()
    const runtimeConfig = createWorkerRuntimeConfig({
      strategyExecutionAdapter: "subprocess",
    })
    vi.mocked(dependencies.buildChronicleFromMatch).mockImplementation(() => {
      throw new SubprocessSystemFailure(
        "SUBPROCESS_SIGNAL",
        "Subprocess terminated by signal SIGKILL",
        { signal: "SIGKILL" },
      )
    })
    vi.mocked(dependencies.recordAttemptFailure).mockResolvedValue(
      "failed_system",
    )

    await expect(
      runWorkerOnce(
        pool,
        { workerId: "worker:test", runtimeConfig },
        dependencies,
      ),
    ).resolves.toBe("failed_system")
    expect(dependencies.recordAttemptFailure).toHaveBeenCalledWith(
      pool,
      expect.objectContaining({
        details: expect.objectContaining({
          strategyExecutionAdapterId: "subprocess",
          strategyExecutionSystemFailureCode: "SUBPROCESS_SIGNAL",
        }),
      }),
    )
  })

  it("returns failed_system when retry exhaustion marks the Match failed_system", async () => {
    const dependencies = baseDependencies()
    vi.mocked(dependencies.buildChronicleFromMatch).mockImplementation(() => {
      throw new Error("chronicle validation failed")
    })
    vi.mocked(dependencies.recordAttemptFailure).mockResolvedValue(
      "failed_system",
    )

    await expect(
      runWorkerOnce(pool, { workerId: "worker:test" }, dependencies),
    ).resolves.toBe("failed_system")
  })

  it("can receive a reclaimed expired running job from the claim dependency", async () => {
    const dependencies = baseDependencies()
    vi.mocked(dependencies.claimNextMatchJob).mockResolvedValue(
      createClaimedMatchJobForTest({
        jobId: "match-job:expired",
        leaseToken: "lease:reclaimed",
      }),
    )

    await runWorkerOnce(pool, { workerId: "worker:next" }, dependencies)
    expect(dependencies.claimNextMatchJob).toHaveBeenCalledWith(pool, {
      workerId: "worker:next",
    })
    expect(dependencies.completeMatch).toHaveBeenCalledWith(
      pool,
      expect.objectContaining({
        jobId: "match-job:expired",
        leaseToken: "lease:reclaimed",
      }),
    )
  })
})
