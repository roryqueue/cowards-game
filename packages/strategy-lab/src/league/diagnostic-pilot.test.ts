import { describe, expect, it } from "vitest"
import { labRoot } from "../contracts.js"
import {
  admitDiagnosticPilotAllocation,
  createDiagnosticPilotAllocation,
  createDiagnosticPilotCell,
  createDiagnosticPilotStart,
  verifyDiagnosticPilotLedger,
} from "./diagnostic-pilot.js"

const allocation = () => createDiagnosticPilotAllocation({
  implementationRoot: labRoot("pilot-test", "implementation"),
  sourceClosureRoot: labRoot("pilot-test", "source"),
  gateRoot: labRoot("pilot-test", "gate"),
})

describe("diagnostic-only pilot identity and precharge", () => {
  it("admits exactly four canonical S01/S03 Smoke conditions under a distinct root", () => {
    const admitted = admitDiagnosticPilotAllocation(allocation())
    expect(admitted.evidenceClass).toBe("diagnostic_only")
    expect(admitted.cells).toHaveLength(4)
    expect(admitted.cells.map((cell) => cell.conditionId)).toEqual([
      "set-condition:sha256:8c78a3488ff1b3bfe21231e8183fabdfb1428b3c40e8be0466cca17e51036bad",
      "set-condition:sha256:51ded4d1bb28d7de00b00059b3fc0b66598785037ac907bb772f6aeecaf49aa5",
      "set-condition:sha256:6da20d83323911acf4891eb6736ebd372138364762905268e340852f364cbf68",
      "set-condition:sha256:bbec91404c09ac50622b0bc25b09fd8d20dbcd037d62e2fdd2c07f7ff17be7af",
    ])
    expect(admitted.perMatchMilliseconds).toBe(240_000)
    expect(admitted.overallMilliseconds).toBe(1_800_000)
    expect(admitted.retryCount).toBe(0)
    expect(admitted.leagueRequirementsEvidence).toBe(false)
    expect(() => admitDiagnosticPilotAllocation({ ...admitted, public: true })).toThrow()
    expect(() => admitDiagnosticPilotAllocation({ ...admitted, cells: admitted.cells.slice(0, 3) })).toThrow()
    expect(() => admitDiagnosticPilotAllocation({ schemaVersion: "league-prospective-execution-allocation-v1", root: admitted.root })).toThrow()
  })

  it("treats an unpersisted start as uncertain, not provider authority", () => {
    const admitted = allocation()
    const cell = createDiagnosticPilotCell(admitted, 0)
    const start = createDiagnosticPilotStart(admitted, cell)
    expect(() => verifyDiagnosticPilotLedger({ readStart: () => null, readTerminal: () => null }, admitted, cell, start)).toThrow()
  })
})
