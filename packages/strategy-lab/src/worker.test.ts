import { afterEach, expect, it, vi } from "vitest"
import { createLabWorkerDeadline, runLabWorkerPool } from "./worker.js"
import { assignLabTasks, enumerateLabTasks } from "./tasks.js"

afterEach(() => vi.useRealTimers())
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
