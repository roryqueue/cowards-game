import { describe, expect, it } from "vitest"
import * as accounting from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as correction from "./run-v1-38-lean-correction.js"

describe("first prospective v13-1 continuation (source-only HOST)", () => {
  it("selects a distinct first route and rejects unused preparation ordinals", () => {
    const request = ".strategy-lab/lean-correction-supervisor-diagnostic-request-20261008-v13-1.json"
    expect(correction.parseLeanCorrectionCommand(["prepare-supervisor-diagnostic-v13-1", "--request", request])).toMatchObject({ supervisor: "v13-1", route: "diagnostic", request })
    expect(correction.leanCorrectionChildSupervisor("child-supervisor-diagnostic-v13-1")).toBe("v13-1")
    for (const ordinal of [2, 3, 4, 5]) expect(() => correction.parseLeanCorrectionCommand([`prepare-supervisor-diagnostic-v13-${ordinal}`, "--request", request])).toThrow()
    expect(accounting.leanCorrectionRoutePaths("diagnostic", "v12-1").request).not.toBe(request)
  })
  it("does not reset or reinterpret the old time envelope", () => {
    const extension = (accounting as unknown as Record<string, accounting.LeanRetryTimeboxExtension>).LEAN_PREPARATION_CONTINUATION_V13_EXTENSION!
    expect(extension).toMatchObject({ priorElapsedMs: 108000000, startedAtMs: 1791455941097, elapsedMs: 165600000, excludedIdleMs: 0, charged: 34, reserveMs: 1860000, maximumDiagnostics: 1, maximumBaselines: 1 })
    expect(accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION.elapsedMs).toBe(136800000)
    expect(accounting.leanRetryRootElapsedFloorV8(1791455941097 + 12345, extension)).toBe(108012345)
  })
})
