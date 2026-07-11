import { describe, expect, it } from "vitest"
import {
  assertCompetitionCountedStatePublicLeakSafe,
  classifyCompetitionCountedState,
  type CompetitionCountedStateInput,
} from "./competition-counted-state.js"

const complete: CompetitionCountedStateInput = {
  executionStatus: "complete",
  origin: "trial",
  expectedMatchCount: 2,
  chronicleMatchCount: 2,
  scoringAvailable: true,
  reviewState: "none",
}

describe("competition counted-state classifier", () => {
  it.each([
    ["counted", complete],
    ["pending", { ...complete, chronicleMatchCount: 1 }],
    ["retrying", { ...complete, executionStatus: "running" }],
    ["degraded_system_failure", { ...complete, executionStatus: "degraded" }],
    ["non_counted", { ...complete, storedState: "non_counted" }],
    ["non_competitive", { ...complete, origin: "non_competitive" }],
    ["under_review", { ...complete, reviewState: "under_review" }],
    ["disputed", { ...complete, reviewState: "disputed" }],
    ["invalid", { ...complete, storedState: "invalid" }],
    ["invalidated", { ...complete, storedState: "invalidated" }],
  ] as const)("classifies %s", (expected, input) => {
    const projection = classifyCompetitionCountedState(input)
    expect(projection.state).toBe(expected)
    expect(projection.publicLabel).not.toHaveLength(0)
    expect(projection.publicExplanation).not.toHaveLength(0)
    expect(projection.standingsEffect).not.toHaveLength(0)
    expect(() =>
      assertCompetitionCountedStatePublicLeakSafe(projection),
    ).not.toThrow()
  })

  it("does not trust stored counted without complete evidence", () => {
    expect(
      classifyCompetitionCountedState({
        ...complete,
        storedState: "counted",
        scoringAvailable: false,
        chronicleMatchCount: 0,
      }),
    ).toMatchObject({ state: "pending", evidenceAvailability: "unavailable" })
  })

  it("applies exclusion precedence over complete evidence", () => {
    expect(
      classifyCompetitionCountedState({
        ...complete,
        storedState: "invalidated",
        reviewState: "under_review",
      }).state,
    ).toBe("invalidated")
    expect(
      classifyCompetitionCountedState({
        ...complete,
        storedState: "invalid",
        reviewState: "disputed",
      }).state,
    ).toBe("invalid")
  })

  it("is deterministic for identical canonical input", () => {
    expect(classifyCompetitionCountedState(complete)).toEqual(
      classifyCompetitionCountedState({ ...complete }),
    )
  })
})
