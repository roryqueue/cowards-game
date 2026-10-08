import { describe, expect, it } from "vitest"
import * as accounting from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as correction from "../run-v1-38-lean-correction.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"

describe("fresh v12 supervisor source-only admission", () => {
  it("selects the exact one-pair route and full conservative clock", () => {
    expect(accounting.isLeanSupervisorRetestMode("v12-1")).toBe(true)
    expect(accounting.isLeanSupervisorRetestMode("v12-2")).toBe(false)
    const e = accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION
    expect(e).toMatchObject({ priorElapsedMs: 108000000, startedAtMs: 1791455941097, elapsedMs: 136800000, charged: 34, excludedIdleMs: 0, maximumDiagnostics: 1, maximumBaselines: 1, reserveMs: 1860000 })
    expect(accounting.leanRetryRootElapsedFloorV8(e.startedAtMs + 99, e)).toBe(108000099)
    expect(accounting.leanCorrectionRoutePaths("diagnostic", "v12-1").request).toBe(".strategy-lab/lean-correction-supervisor-diagnostic-request-20261008-v12-1.json")
    for (const route of ["diagnostic", "baseline"] as const) for (const verb of ["prepare", "run", "verify", "verify-terminal"]) {
      const paths = accounting.leanCorrectionRoutePaths(route, "v12-1")
      expect(correction.parseLeanCorrectionCommand([`${verb}-supervisor-${route}-v12-1`, "--request", paths.request]).supervisor).toBe("v12-1")
      expect(() => correction.parseLeanCorrectionCommand([`${verb}-supervisor-${route}-v12-2`, "--request", paths.request])).toThrow()
    }
  })
  it("the actual semantic root excludes exactly five downstream review and authorization fields", () => {
    const r = (n: number) => labRoot("v12-synthetic-only", n)
    const draft = { schemaVersion: "lean-correction-supervisor-request-v12", route: "diagnostic", sourceRoot: r(1), candidateRoots: [r(2)], helperPath: "test-owned-helper.mts", helperBytesRoot: r(3), authorizationRoot: null, dataReviewPath: "pending", dataReviewRoot: null, helperReviewPath: "pending", helperReviewRoot: null }
    const finalized = { ...draft, authorizationRoot: r(4), dataReviewPath: "actual-data-review", dataReviewRoot: r(5), helperReviewPath: "actual-helper-review", helperReviewRoot: r(6) }
    expect(correction.leanCorrectionRequestDataRoot(finalized as never)).toBe(correction.leanCorrectionRequestDataRoot(draft as never))
    for (const changed of [{ helperBytesRoot: r(7) }, { sourceRoot: r(8) }, { route: "baseline" }, { candidateRoots: [r(9)] }]) expect(correction.leanCorrectionRequestDataRoot({ ...draft, ...changed } as never)).not.toBe(correction.leanCorrectionRequestDataRoot(draft as never))
  })
})
