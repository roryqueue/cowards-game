import { afterEach, expect, it, vi } from "vitest"
import { createLabWorkerDeadline } from "./worker.js"

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
