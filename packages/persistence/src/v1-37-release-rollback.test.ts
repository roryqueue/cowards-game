import { describe, expect, it } from "vitest"

const expectedD11Scenarios = [
  "lane-kill-switch-before-schedule",
  "certificate-stale-before-schedule",
  "lane-kill-switch-after-claim",
  "certificate-stale-after-claim",
  "completion-failure-before-chronicle",
  "completion-failure-after-chronicle",
  "completion-failure-after-match",
  "exact-idempotent-retry",
  "cohort-invalidation",
  "compensating-reversal",
  "standings-governance-recompute",
  "service-runtime-exact-tuple-rollback",
  "mixed-state-tuple-rejection",
] as const

describe("v1.37 D-11 persistence rollback release matrix", () => {
  it("has one closed owner-backed row for every D-11 scenario", () => {
    expect(v137ReleaseRollbackScenarios().map(({ id }) => id)).toEqual(
      expectedD11Scenarios,
    )
  })

  it("executes every database owner suite without a configured skip", () => {
    expect(process.env.DATABASE_URL).toMatch(/^postgresql:\/\//u)
    const receipts = runV137ReleaseRollbackOwnerSuites(process.cwd())
    expect(receipts.every(({ status }) => status === "passed")).toBe(true)
    expect(receipts.map(({ owner }) => owner)).toEqual([
      "job-lifecycle",
      "completion-transaction",
      "cohort-compensation",
      "standings-recompute",
      "semantic-selection-rollback",
    ])
  }, 180_000)
})
