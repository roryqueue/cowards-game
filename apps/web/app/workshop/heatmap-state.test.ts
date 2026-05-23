import { describe, expect, it } from "vitest"
import { createWorkshopAnalyticsStateTestSnapshot } from "./analytics-test-fixture.js"
import {
  bandLabel,
  formatHeatmapCell,
  getRepresentativeReplayHref,
  sortMatchupsForWeakness,
  summarizeRun,
} from "./heatmap-state.js"

describe("Workshop heatmap state", () => {
  it("sorts weak archetypes first and labels exceptional evidence", () => {
    const snapshot = createWorkshopAnalyticsStateTestSnapshot()
    const run = snapshot.runs[0]!
    const sorted = sortMatchupsForWeakness(run.summary.matchupRecords)

    expect(summarizeRun(run)).toContain("matchups")
    expect(sorted[0]?.points).toBe(0)
    expect(
      sorted.some((matchup) => matchup.evidence.band === "system_failed"),
    ).toBe(true)
    expect(bandLabel("degraded_non_counted")).toBe("Degraded")
    expect(formatHeatmapCell(sorted[0]!)).toMatch(/System failed|degraded|pts/)
    expect(
      run.summary.matchupRecords.some(
        (matchup) => getRepresentativeReplayHref(matchup) !== null,
      ),
    ).toBe(true)
  })
})
