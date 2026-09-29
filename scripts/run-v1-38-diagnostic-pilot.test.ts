import { describe, expect, it } from "vitest"
import {
  DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS,
  computeDiagnosticPilotDeadlines,
  canStartDiagnosticPilotCell,
  checkDiagnosticPilotGate,
} from "./run-v1-38-diagnostic-pilot.js"

describe("diagnostic pilot source-only watchdog and gate", () => {
  it("places a preemptive kill before both hard deadlines with independent cleanup reserve", () => {
    const schedule = computeDiagnosticPilotDeadlines({ overallStartedAt: 1000, cellStartedAt: 2000 })
    expect(schedule.cellHardAt).toBe(242_000)
    expect(schedule.overallHardAt).toBe(1_801_000)
    expect(schedule.killAt).toBeLessThan(schedule.cellHardAt)
    expect(schedule.cellHardAt - schedule.killAt).toBeGreaterThanOrEqual(DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS)
    expect(canStartDiagnosticPilotCell(1_801_000 - 240_000 - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS + 1, 1000)).toBe(false)
  })

  it("rejects an absent or unreviewed source gate before any allocation read", () => {
    expect(() => checkDiagnosticPilotGate({ gatePath: "missing-gate.json", sourceFiles: {} })).toThrow()
  })
})
