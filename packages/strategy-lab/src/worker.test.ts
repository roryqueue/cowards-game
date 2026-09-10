import { afterEach, expect, it, vi } from "vitest"
import { createLabWorkerDeadline, runLabWorkerPool } from "./worker.js"
import { assignLabTasks, enumerateLabTasks } from "./tasks.js"
import { Worker } from "node:worker_threads"

afterEach(() => vi.useRealTimers())
afterEach(() => vi.restoreAllMocks())
it("resets the admitted per-attempt allowance instead of charging a worker batch", () => {
  vi.useFakeTimers()
  const expire = vi.fn(), deadline = createLabWorkerDeadline(expire)
  for (let attempt = 0; attempt < 2; attempt++) {
    deadline.arm("attempt")
    vi.advanceTimersByTime(70000)
    deadline.clear()
  }
  expect(expire).not.toHaveBeenCalled() // 140 seconds cumulatively
  deadline.arm("attempt")
  vi.advanceTimersByTime(120000)
  expect(expire).toHaveBeenCalledTimes(1)
  deadline.clear()
})
it("bounds idle transport independently and clears completed timers", () => {
  vi.useFakeTimers()
  const expire = vi.fn(), deadline = createLabWorkerDeadline(expire)
  deadline.arm("transport")
  vi.advanceTimersByTime(3599999)
  expect(expire).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(expire).toHaveBeenCalledOnce()
  deadline.arm("attempt"); deadline.clear(); vi.advanceTimersByTime(120001)
  expect(expire).toHaveBeenCalledOnce()
})
it("charges two valid70s relay attempts, but cancels and stops one over120s attempt", async () => {
  const root = `sha256:${"a".repeat(64)}` as const
  const graph = enumerateLabTasks({ admittedRoot: root, algorithm: "hierarchical-planner-v1", candidateRoot: root, opponentRoot: root, inputRoot: root, budgetRoot: root })
  const tasks = assignLabTasks(graph, { workers: 1, shardSize: 1, order: "forward" }).slice(0, 2)
  vi.useFakeTimers()
  const starts = vi.fn(), results = vi.fn(), cancel = vi.fn()
  const valid = await runLabWorkerPool(tasks, 1, "supervised", { onStart: starts, onResult: results, cancel, invoke: async () => { vi.advanceTimersByTime(70000); return {} } })
  expect(valid.failed).toBe(false)
  expect(starts).toHaveBeenCalledTimes(2)
  expect(results).toHaveBeenCalledTimes(2)
  expect(cancel).not.toHaveBeenCalled()
  starts.mockClear(); results.mockClear()
  const expired = await runLabWorkerPool(tasks, 1, "supervised", { onStart: starts, onResult: results, cancel, invoke: async () => { vi.advanceTimersByTime(120001); return new Promise(() => {}) } })
  expect(expired.failed).toBe(true)
  expect(starts).toHaveBeenCalledOnce()
  expect(results).not.toHaveBeenCalled()
  expect(cancel).toHaveBeenCalledExactlyOnceWith(tasks[0])
}, 30000)
it.each(["rejected", "never-settling"])("terminates both owned relays despite %s cancellation and retains incomplete cleanup", async fault => {
  const root = `sha256:${"a".repeat(64)}` as const
  const graph = enumerateLabTasks({ admittedRoot: root, algorithm: "hierarchical-planner-v1", candidateRoot: root, opponentRoot: root, inputRoot: root, budgetRoot: root })
  const tasks = assignLabTasks(graph, { workers: 2, shardSize: 1, order: "forward" }).slice(0, 2)
  const termination = vi.spyOn(Worker.prototype, "terminate")
  let release!: () => void
  const bothStarted = new Promise<void>(resolve => { release = resolve })
  const starts = vi.fn(), results = vi.fn()
  const cancel = vi.fn(async () => { if (fault === "rejected") throw new Error("cleanup failed"); return new Promise<void>(() => {}) })
  const result = await runLabWorkerPool(tasks, 2, "supervised", {
    onStart: starts, onResult: results, cancel, remainingCleanupMs: () => 20,
    invoke: async assignment => {
      if (assignment.worker === 1) { release(); return new Promise(() => {}) }
      await bothStarted
      throw new Error("synthetic transport failure")
    },
  })
  expect(result).toMatchObject({ failed: true, cleanupComplete: false, relaysTerminated: true })
  expect(starts).toHaveBeenCalledTimes(2)
  expect(results).not.toHaveBeenCalled()
  expect(cancel).toHaveBeenCalledTimes(2)
  expect(termination).toHaveBeenCalledTimes(2)
  expect(termination.mock.contexts.every(worker => worker instanceof Worker && worker.threadId === -1)).toBe(true)
}, 30000)
