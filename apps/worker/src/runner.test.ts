import { describe, expect, it, vi } from "vitest"
import type { Pool } from "pg"
import type { WorkerRunnerDependencies } from "./runner.js"
import { createClaimedMatchJobForTest, runWorkerOnce } from "./runner.js"

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

describe("worker runner", () => {
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
