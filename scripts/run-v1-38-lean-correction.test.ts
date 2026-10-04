import { describe, expect, it } from "vitest"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { LEAN_CAPS, createLeanCorrectionAllocation, admitLeanAllocation, leanWritablePaths, type LeanCorrectionPredecessor } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { LEAN_CORRECTION_ROUTES, assertLeanCorrectionResources, parseLeanCorrectionCommand, validateLeanCorrectionDiagnosis, deriveLeanCorrectionRequestRoots } from "./run-v1-38-lean-correction.js"
import { deriveLeanBaselineCandidateRoots } from "./run-v1-38-lean-baseline.js"
import { LEAN_COLD_REUSE_HISTORY } from "./lib/v1-38-lean-baseline-reuse.js"

export const correctionAllocationFixture = (route: "diagnostic" | "baseline" = "diagnostic") => {
  const sourceRoot = labRoot("source-mock-only", {}), planRoot = labRoot("plan-mock-only", {})
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: route === "diagnostic" ? 10 : 11, elapsedUpperBoundMs: route === "diagnostic" ? 3319046 : 3400000, allocatedDiskBytes: 8192, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: labRoot("history-mock-only", {}), survivors: [{ identity: ".strategy-lab/mock-survivor", allocatedBytes: 4096 }] }
  const predecessor: LeanCorrectionPredecessor = { ...body, root: labRoot(body.schemaVersion, body) }
  return createLeanCorrectionAllocation({ route, sourceRoot, reviewRoot: labRoot("review-mock-only", {}), planRoot, coldRoot: LEAN_COLD_REUSE_HISTORY.coldRoot, seed: LEAN_COLD_REUSE_HISTORY.seed, candidateRoots: deriveLeanBaselineCandidateRoots(LEAN_COLD_REUSE_HISTORY.coldRoot), requestRoots: deriveLeanCorrectionRequestRoots({ route, sourceRoot, planRoot, coldRoot: LEAN_COLD_REUSE_HISTORY.coldRoot, seed: LEAN_COLD_REUSE_HISTORY.seed }), reuseGrantRoot: labRoot("reuse-mock-only", {}), diagnosisRoot: route === "baseline" ? labRoot("diagnosis-mock-only", {}) : null, predecessor })
}

describe("bounded correction source admission", () => {
  it("has two distinct fixed routes and never accepts a spent command", () => {
    expect(new Set(Object.values(LEAN_CORRECTION_ROUTES).flatMap(r => [r.store, r.request, r.allocation, r.check])).size).toBe(8)
    expect(parseLeanCorrectionCommand(["prepare-diagnostic", "--request", LEAN_CORRECTION_ROUTES.diagnostic.request]).route).toBe("diagnostic")
    expect(() => parseLeanCorrectionCommand(["run-current", "--request", ".strategy-lab/lean-baseline-request-20261004-v1.json"])).toThrow()
  })
  it("reserves cleanup, terminal and check time before charge", () => {
    const base = { elapsedMs: 3319046, charged: 10, physicalBytes: 1000, childRss: 1000, parentRss: 1000, freeBytes: LEAN_CAPS.totalBytes, availableMemoryBytes: 2 ** 31 }
    expect(assertLeanCorrectionResources(base)).toBeGreaterThan(0)
    expect(() => assertLeanCorrectionResources({ ...base, elapsedMs: LEAN_CAPS.elapsedMs - LEAN_CAPS.matchMs })).toThrow()
    expect(() => assertLeanCorrectionResources({ ...base, charged: 300 })).toThrow()
    expect(() => assertLeanCorrectionResources({ ...base, childRss: NaN })).toThrow()
  })
  it("unknown, unclean or merely synthetic signal denies baseline", () => {
    const root = labRoot("fixture", {})
    for (const cause of ["unknown", "broker_synthetic_sigkill", "observed_native_sigkill"]) expect(() => validateLeanCorrectionDiagnosis({ cause, cleanupComplete: true, diagnosticCheckRoot: root }, root)).toThrow()
  })
  it("keeps one diagnostic / 36 baseline slots, exact condition0 Smoke and carry", () => {
    const diagnostic = correctionAllocationFixture(), baseline = correctionAllocationFixture("baseline")
    expect(diagnostic.slots).toHaveLength(1); expect(baseline.slots).toHaveLength(36)
    expect(diagnostic.slots[0]!.arenaHash).toEqual(baseline.slots[0]!.arenaHash)
    expect(diagnostic.slots[0]!.requestRoot).not.toBe(baseline.slots[0]!.requestRoot)
    expect(diagnostic.slots[0]!.condition).toBe(0)
    expect(diagnostic.predecessor.chargedMatches).toBe(10)
    expect(baseline.predecessor.chargedMatches).toBe(11)
    expect(admitLeanAllocation(diagnostic)).toEqual(diagnostic)
    expect(leanWritablePaths(diagnostic)).toEqual([LEAN_CORRECTION_ROUTES.diagnostic.temp, LEAN_CORRECTION_ROUTES.diagnostic.allocation, LEAN_CORRECTION_ROUTES.diagnostic.request])
  })
  it.each(["caps", "slot", "carry", "schema", "grant"])("refuses changed %s before any provider", kind => {
    const fixture = structuredClone(correctionAllocationFixture())
    if (kind === "caps") (fixture.caps as { matches: number }).matches = 301
    if (kind === "slot") (fixture as unknown as { slots: unknown[] }).slots = []
    if (kind === "carry") fixture.predecessor.chargedMatches = 0
    if (kind === "schema") (fixture as { schemaVersion: string }).schemaVersion = "lean-current-baseline-allocation-v1"
    if (kind === "grant") (fixture as { reuseGrantRoot: string }).reuseGrantRoot = labRoot("forged", {})
    expect(() => admitLeanAllocation(fixture)).toThrow()
  })
  it("requires rooted independent actionable diagnosis and complete cleanup", () => {
    const checkRoot = labRoot("check-mock-only", {})
    const body = { schemaVersion: "lean-correction-diagnosis-v1" as const, diagnosticCheckRoot: checkRoot, originRoot: labRoot("origin-mock-only", {}), cause: "legacy_deadline_observed" as const, cleanupComplete: true as const, actionable: true as const, authorAgent: "/root", reviewerAgent: "/root/source_review", independentlyReviewed: true as const }
    const diagnosis = { ...body, root: labRoot(body.schemaVersion, body) }
    expect(validateLeanCorrectionDiagnosis(diagnosis, checkRoot)).toEqual(diagnosis)
    for (const mutation of [{ cleanupComplete: false }, { actionable: false }, { reviewerAgent: "/root" }, { diagnosticCheckRoot: labRoot("wrong", {}) }, { rawStack: "private" }]) expect(() => validateLeanCorrectionDiagnosis({ ...diagnosis, ...mutation }, checkRoot)).toThrow()
  })
})
