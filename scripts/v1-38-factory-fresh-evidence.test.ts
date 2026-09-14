import { describe, expect, it } from "vitest"
import { remainingFreshWorkloadLifetime } from "./v1-38-factory-fresh-evidence.js"

describe("approved factory workload window", () => {
  it("caps lifetime to remaining ninety-minute wall clock without extending frozen per-workload limits", () => {
    expect(remainingFreshWorkloadLifetime(1000, 1000)).toBe(120_000)
    expect(remainingFreshWorkloadLifetime(1000, 1000 + 5_400_000 - 30_000)).toBe(25_000)
    expect(remainingFreshWorkloadLifetime(1000, 1000 + 5_400_000 - 5000)).toBe(0)
    expect(remainingFreshWorkloadLifetime(1000, 1000 + 5_400_000)).toBe(0)
  })
  it("rejects time reversal and invalid clocks rather than extending the envelope", () => {
    expect(() => remainingFreshWorkloadLifetime(1000, 999)).toThrow("CLOCK")
    expect(() => remainingFreshWorkloadLifetime(0, Number.NaN)).toThrow("CLOCK")
  })
})
