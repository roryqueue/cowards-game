import { createWorkshopAnalyticsDemoSnapshot } from "@cowards/persistence/workshop-analytics"
import { describe, expect, it } from "vitest"
import {
  defaultEvidenceFilters,
  filterEvidenceMatchups,
} from "./evidence-state.js"

describe("Evidence Explorer state", () => {
  it("filters by band, counted status, tier, and replay availability", () => {
    const run = createWorkshopAnalyticsDemoSnapshot().runs[0]!

    expect(filterEvidenceMatchups(run, defaultEvidenceFilters)[0]?.points).toBe(
      0,
    )
    expect(
      filterEvidenceMatchups(run, {
        ...defaultEvidenceFilters,
        band: "thin",
      }).every((matchup) => matchup.evidence.band === "thin"),
    ).toBe(true)
    expect(
      filterEvidenceMatchups(run, {
        ...defaultEvidenceFilters,
        tier: "advanced",
        counted: "not-counted",
      }).every(
        (matchup) =>
          matchup.opponent.tier === "advanced" && !matchup.evidence.counted,
      ),
    ).toBe(true)
    expect(
      filterEvidenceMatchups(run, {
        ...defaultEvidenceFilters,
        replay: "without-replay",
      }).every((matchup) => matchup.replayReferences.length === 0),
    ).toBe(true)
  })
})
