import { describe, expect, it } from "vitest"
import {
  V138_PLAN132_PUBLICATION_SCOPE,
  V138_PLAN132_SUMMARY_SCOPE,
  assertV138Plan132ExactScopeForReview,
  assertV138Plan132StrictSummaryDescendantForReview,
  authenticateV138Plan132V4InvalidHistoryForReview,
} from "./check-v1-38-plan-262-132-live-v13-custody-v5.js"

const ROOT = new URL("..", import.meta.url).pathname

describe("Plan 262-132 strict descendant custody v5", () => {
  it("accepts tracking, review, planning, and current strict descendants", () => {
    for (const head of [
      "ca21e28b8dc7c9de4c1691d03601c95ef473ffe3",
      "f45ee38d529ba79d63e0b54995ed90d947811dd4",
      "823bc2ccf20b5efcf9d248ad7f48d832d0766f1b",
      "HEAD",
    ]) expect(authenticateV138Plan132V4InvalidHistoryForReview(ROOT, head)).toMatchObject({
      publicationCommit: "b80782214eeb323023287b4589049f0139befdd5",
      summaryCommit: "6a82901a8e73a4c2b8be92ba1b8d606919678784",
      reviewCommit: "f45ee38d529ba79d63e0b54995ed90d947811dd4",
      storedPlan110Eligible: true,
      currentPlan110Eligible: false,
      disposition: "process_invalid_descendant_and_observation_validation",
    })
  })

  it("rejects summary equality and non-descendants", () => {
    expect(() => assertV138Plan132StrictSummaryDescendantForReview(
      "a".repeat(40), "a".repeat(40), true,
    )).toThrow("V138_PLAN132_HEAD_NOT_STRICT_SUMMARY_DESCENDANT")
    expect(() => assertV138Plan132StrictSummaryDescendantForReview(
      "a".repeat(40), "b".repeat(40), false,
    )).toThrow("V138_PLAN132_HEAD_NOT_STRICT_SUMMARY_DESCENDANT")
    expect(() => authenticateV138Plan132V4InvalidHistoryForReview(ROOT,
      "6a82901a8e73a4c2b8be92ba1b8d606919678784"))
      .toThrow("V138_PLAN132_HEAD_NOT_STRICT_SUMMARY_DESCENDANT")
    expect(() => authenticateV138Plan132V4InvalidHistoryForReview(ROOT,
      "6515ea1a2e372a71d9f9d161e395276cf163db76"))
      .toThrow("V138_PLAN132_HEAD_NOT_STRICT_SUMMARY_DESCENDANT")
  })

  it("requires exact publication and summary scopes", () => {
    expect(assertV138Plan132ExactScopeForReview(V138_PLAN132_PUBLICATION_SCOPE,
      V138_PLAN132_PUBLICATION_SCOPE, "PUBLICATION")).toEqual(V138_PLAN132_PUBLICATION_SCOPE)
    expect(assertV138Plan132ExactScopeForReview(V138_PLAN132_SUMMARY_SCOPE,
      V138_PLAN132_SUMMARY_SCOPE, "SUMMARY")).toEqual(V138_PLAN132_SUMMARY_SCOPE)
    for (const [actual, label] of [
      [V138_PLAN132_PUBLICATION_SCOPE.slice(1), "PUBLICATION"],
      [[...V138_PLAN132_PUBLICATION_SCOPE, "A\textra"], "PUBLICATION"],
      [[V138_PLAN132_SUMMARY_SCOPE[0]!.replace(/^A/u, "M")], "SUMMARY"],
    ] as const) expect(() => assertV138Plan132ExactScopeForReview(actual,
      label === "SUMMARY" ? V138_PLAN132_SUMMARY_SCOPE : V138_PLAN132_PUBLICATION_SCOPE, label))
      .toThrow(`V138_PLAN132_${label}_SCOPE_INVALID`)
  })
})
