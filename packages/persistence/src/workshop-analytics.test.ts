import { describe, expect, it } from "vitest"
import {
  createAnalyticsCompatibilityHash,
  createWorkshopAnalyticsDemoSnapshot,
  createWorkshopAnalyticsExport,
  escapeAnalyticsCsvCell,
} from "./workshop-analytics.js"

describe("Workshop analytics", () => {
  it("creates deterministic owner-safe demo summaries", () => {
    const first = createWorkshopAnalyticsDemoSnapshot()
    const second = createWorkshopAnalyticsDemoSnapshot()

    expect(first).toEqual(second)
    expect(first.runs[0]?.summary.matchupRecords.length).toBeGreaterThan(10)
    expect(
      first.runs[0]?.summary.matchupRecords.map(
        (matchup) => matchup.evidence.band,
      ),
    ).toEqual(
      expect.arrayContaining([
        "strong",
        "thin",
        "degraded_non_counted",
        "system_failed",
      ]),
    )
    expect(JSON.stringify(first)).not.toContain("\"strategyMemory\":")
    expect(JSON.stringify(first)).not.toContain("\"soldierMemory\":")
    expect(JSON.stringify(first)).not.toContain("\"objectivePayload\":")
  })

  it("keeps compatibility hashes independent of display metadata", () => {
    const snapshot = createWorkshopAnalyticsDemoSnapshot()
    const key = snapshot.profiles[0]!.compatibility.key

    expect(createAnalyticsCompatibilityHash(key)).toBe(
      snapshot.profiles[0]!.compatibility.hash,
    )
    const renamed = {
      ...snapshot.profiles[0]!,
      name: "Renamed profile",
      notes: "Notes do not affect compatibility",
    }
    expect(createAnalyticsCompatibilityHash(renamed.compatibility.key)).toBe(
      snapshot.profiles[0]!.compatibility.hash,
    )
  })

  it("exports JSON envelopes and CSV matchup records without formula hazards", () => {
    const snapshot = createWorkshopAnalyticsDemoSnapshot()
    const json = createWorkshopAnalyticsExport(snapshot, "json")
    const csv = createWorkshopAnalyticsExport(snapshot, "csv")

    expect(typeof json).toBe("object")
    expect(typeof csv).toBe("string")
    expect(csv).toContain("profile_id")
    expect(escapeAnalyticsCsvCell("=SUM(1,1)")).toBe("\"'=SUM(1,1)\"")
    expect(escapeAnalyticsCsvCell("  =SUM(1,1)")).toBe("\"'  =SUM(1,1)\"")
    expect(escapeAnalyticsCsvCell("quoted \"value\"")).toBe(
      "\"quoted \"\"value\"\"\"",
    )
  })
})
