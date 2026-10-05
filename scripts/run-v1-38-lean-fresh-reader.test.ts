/** Prospective v4 source-only regressions. No historical private files/provider. */
import { describe, expect, it } from "vitest"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import * as accounting from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as correction from "./run-v1-38-lean-correction.js"
import { correctionAllocationFixture } from "./run-v1-38-lean-correction.test.js"

describe("fresh repaired-reader v4 route", () => {
  it("admits only exact distinct v4 selectors, preserving old identities", () => {
    for (const route of ["diagnostic", "baseline"] as const) {
      const request = `.strategy-lab/lean-correction-supervisor-${route}-request-20261005-v4.json`
      for (const mode of ["prepare", "run", "verify"] as const) expect(correction.parseLeanCorrectionCommand([`${mode}-supervisor-${route}-v4`, "--request", request])).toMatchObject({ route, supervisor: "v4" })
      for (const older of [false, true, "v3"] as const) expect(() => correction.parseLeanCorrectionCommand([`run-supervisor-${route}-v4`, "--request", accounting.leanCorrectionRoutePaths(route, older).request])).toThrow()
      expect(accounting.leanCorrectionRoutePaths(route, "v4" as never).request).toBe(request)
      expect(accounting.leanSupervisorVersion("v4" as never)).toBe(4)
    }
  })
  it.each(["diagnostic", "baseline"] as const)("binds v4 %s to 12/13 charges and exact cumulative floor", route => {
    const old = correctionAllocationFixture(route), { root: _r, ...p } = old.predecessor
    const body = { ...p, chargedMatches: route === "diagnostic" ? 12 : 13, elapsedUpperBoundMs: 20471046, allocatedDiskBytes: 4231168 }
    const input = { sourceRoot: old.sourceRoot, reviewRoot: old.reviewRoot, coldRoot: old.coldRoot, planRoot: old.planRoot, candidateRoots: old.candidateRoots, requestRoots: old.requestRoots, seed: old.seed, route, reuseGrantRoot: old.reuseGrantRoot, supervisorDecisionRoot: labRoot("mock-approved-v4", {}), acceptedCheckRoot: route === "diagnostic" ? null : labRoot("mock-accepted-v4", {}), requestBytesRoot: labRoot("mock-request-v4", {}), dataReviewRoot: labRoot("mock-review-v4", {}), setupAccountingRoot: labRoot("mock-setup-v4", {}), predecessor: { ...body, root: labRoot(p.schemaVersion, body) } }
    const allocation = accounting.createLeanSupervisorCorrectionAllocation(input, 4 as never)
    expect(accounting.admitLeanAllocation(allocation)).toEqual(allocation)
    expect(allocation.schemaVersion).toBe(`lean-correction-supervisor-${route}-allocation-v4`)
    expect(accounting.leanWritablePaths(allocation)).toContain(".strategy-lab/lean-correction-supervisor-setup-20261005-v4.json")
    for (const changed of [{ chargedMatches: body.chargedMatches - 1 }, { elapsedUpperBoundMs: 20471045 }, { allocatedDiskBytes: 4231167 }]) {
      const invalid = { ...body, ...changed }
      expect(() => accounting.createLeanSupervisorCorrectionAllocation({ ...input, predecessor: { ...invalid, root: labRoot(p.schemaVersion, invalid) } }, 4 as never)).toThrow()
    }
    expect(() => accounting.createLeanSupervisorCorrectionAllocation(input, 5 as never)).toThrow()
  })
})
