import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  assertV138Plan130ExactB331ScopeForReview,
  executeV138Plan130DisposableCustodyForReview,
  V138_PLAN130_B331_SCOPE,
} from "./check-v1-38-plan-262-130-live-v13-custody-v4.js"

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")

describe("Plan 262-130 authentic disposable custody v4", () => {
  it("rejects missing, extra, and status-changed b331 paths", () => {
    expect(assertV138Plan130ExactB331ScopeForReview(V138_PLAN130_B331_SCOPE))
      .toEqual(V138_PLAN130_B331_SCOPE)
    expect(() => assertV138Plan130ExactB331ScopeForReview(V138_PLAN130_B331_SCOPE.slice(1)))
      .toThrow("V138_PLAN130_B331_SCOPE_INVALID")
    expect(() => assertV138Plan130ExactB331ScopeForReview([
      ...V138_PLAN130_B331_SCOPE,
      "A\textra-path",
    ])).toThrow("V138_PLAN130_B331_SCOPE_INVALID")
    expect(() => assertV138Plan130ExactB331ScopeForReview([
      V138_PLAN130_B331_SCOPE[0]!.replace(/^A/u, "M"),
      ...V138_PLAN130_B331_SCOPE.slice(1),
    ])).toThrow("V138_PLAN130_B331_SCOPE_INVALID")
  })

  it("derives each observation inside its disposable worktree without mode salting", () => {
    const result = executeV138Plan130DisposableCustodyForReview(ROOT)
    expect(result).toMatchObject({
      actualModesPassed: 6,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      findings: [],
    })
    expect(result.observations).toHaveLength(6)
    expect(result.canonicalBefore).toEqual(result.canonicalAfter)
    for (const observation of result.observations) {
      expect(observation.disposableReviewedClosureRoot).toBe(result.canonicalBefore.reviewedClosureRoot)
      expect(observation.disposableLocalExecutionClosureRoot).not.toBe(
        result.canonicalBefore.localExecutionClosureRoot,
      )
      expect(observation.observationRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(observation.producerGuardCount).toBe(0)
    }
  }, 240_000)
})
