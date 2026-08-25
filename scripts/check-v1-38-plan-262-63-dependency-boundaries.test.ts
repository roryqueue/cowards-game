import { describe, expect, it } from "vitest"
import { checkV138Plan26263DependencyBoundaries } from "./check-v1-38-plan-262-63-dependency-boundaries.js"

describe("Plan 262-63 dependency denials", () => {
  it("binds lifecycle reconciliation to all authority denials", () => {
    expect(checkV138Plan26263DependencyBoundaries()).toMatchObject({ status: "passed",
      authority: "denied", lifecycle: { state: "plan_262_63_summary_committed", activePlans: 48, summaries: 45 } })
  })
})
