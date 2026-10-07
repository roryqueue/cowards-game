/** Inert prospective metadata only; no historical reader/provider/Strategy/Match. */
import { describe, expect, it } from "vitest"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import * as lean from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as correction from "../run-v1-38-lean-correction.js"

const r = (label: string) => labRoot("bookkeeping-continuation-fixture", label)
const binding = () => lean.LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION
const input = (route: "diagnostic" | "baseline" = "diagnostic", ordinal: 1 | 2 | 3 = 2, charged = route === "diagnostic" ? 30 : 31) => {
  const p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: charged, elapsedUpperBoundMs: 62_024_083, allocatedDiskBytes: 12_894_208, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r("history"), survivors: [{ identity: ".strategy-lab/inert-continuation-survivor", allocatedBytes: 4096 }] }
  return { sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: lean.LEAN_RETRY_V8_PLAN_ROOT, supervisorDecisionRoot: lean.LEAN_RETRY_V8_APPROVAL_ROOT, candidateRoots: [r("a"), r("b")], requestRoots: Array.from({ length: route === "baseline" ? 36 : 1 }, (_, i) => r(`request-${i}`)), seed: "inert-continuation", route, reuseGrantRoot: r("reuse"), acceptedCheckRoot: route === "diagnostic" ? null : r("new-accepted"), requestBytesRoot: r("bytes"), dataReviewRoot: r("data"), setupAccountingRoot: r("setup"), predecessor: { ...p, root: labRoot(p.schemaVersion, p) }, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, attemptOrdinal: ordinal, priorClosureRoot: binding()?.diagnosticClosureRoot, continuationRoot: r("continuation"), acceptedReaderCloseRoot: route === "diagnostic" ? null : r("new-final"), timeboxExtension: binding() }
}
const custody = () => ({ allocationRoot: binding().baselineAllocationRoot, sourceRoot: binding().baselineSourceRoot, head: binding().baselineHead, rawRoots: binding().baselineRawRoots, charged: 30, currentCharges: 0, currentTerminals: 0, active: false, resultExists: false, checkExists: false, terminalStatus: "child_failed", exitCode: null, signal: "SIGKILL", closedIntervals: ["correction-preparation", "pilot-entry", "correction-run-finalization"], intervalTimes: [1791330138520, 1791330177618, 1791330177618, 1791330306049, 1791330306049, 1791330306250] })

describe("exact prospective bookkeeping continuation", () => {
  it("admits only the new exact binding and preserves the old singleton", () => {
    const old = lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION
    expect(lean.admitLeanRetryTimeboxExtension(binding())).toEqual(binding())
    expect(lean.admitLeanRetryTimeboxExtension(old)).toBe(old)
    expect(old).toMatchObject({ priorElapsedMs: 56_000_917, startedAtMs: 1791326194166, charged: 29 })
    expect(binding()).toMatchObject({ priorElapsedMs: 62_024_083, startedAtMs: 1791335391279, charged: 30, elapsedMs: 72_000_000, excludedIdleMs: 3_173_947 })
  })
  it.each(["approvalRoot", "planRoot", "root", "diagnosticClosureRoot", "baselineAllocationRoot"])("rejects changed %s", key => {
    expect(() => lean.admitLeanRetryTimeboxExtension({ ...binding(), [key]: r("forged") })).toThrow()
  })
  it.each(["diagnostic", "baseline"] as const)("admits fresh ordinal2 %s with unchanged caps", route => {
    const a = lean.createLeanSupervisorCorrectionAllocation(input(route), 8)
    expect(lean.admitLeanAllocation(a)).toEqual(a)
    expect(lean.leanCapsForAllocation(a)).toEqual(lean.LEAN_RETRY_V8_TIMEBOX_CAPS)
    expect(a.predecessor.chargedMatches).toBe(route === "diagnostic" ? 30 : 31)
  })
  it.each([1, 3] as const)("does not authorize ordinal%s", n => {
    expect(() => lean.createLeanSupervisorCorrectionAllocation(input("diagnostic", n), 8)).toThrow()
  })
  it("refuses historical charge refund and unrelated prior diagnostic root", () => {
    expect(() => lean.createLeanSupervisorCorrectionAllocation(input("diagnostic", 2, 29), 8)).toThrow()
    expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...input(), priorClosureRoot: r("other-diagnostic") }, 8)).toThrow()
  })
  it("counts every current task millisecond and excludes only the approved human idle", () => {
    const b = binding()
    expect(lean.leanRetryRootElapsedFloorV8(b.startedAtMs, b)).toBe(62_024_083)
    expect(lean.leanRetryRootElapsedFloorV8(b.startedAtMs + 1234, b)).toBe(62_025_317)
    expect(b.startedAtMs - b.previousCompletedAtMs).toBe(3_173_947)
    expect(b.priorElapsedMs).toBe(lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION.priorElapsedMs + 6_023_166)
  })
  it("binds actual new approval/source bytes without changing old source inventories", () => {
    const manifest = correction.leanCorrectionSourceManifest("v8-2", binding())
    expect(manifest.entries).toContainEqual({ path: correction.LEAN_RETRY_V8_BOOKKEEPING_DECISION, root: binding().approvalRoot })
    expect(manifest.entries).toContainEqual({ path: correction.LEAN_RETRY_V8_BOOKKEEPING_PLAN, root: binding().planRoot })
    expect(() => correction.leanCorrectionSourceManifest("v8-3", binding())).toThrow()
  })
  it("accepts only the pinned closed failed baseline with no charge", () => {
    expect(() => lean.validateLeanBookkeepingBaselineCustodyV8(custody())).not.toThrow()
  })
  it.each([{ charged: 29 }, { currentCharges: 1 }, { currentTerminals: 1 }, { active: true }, { resultExists: true }, { checkExists: true }, { terminalStatus: "child_exited" }, { signal: null }, { head: "0".repeat(40) }, { allocationRoot: r("other") }, { closedIntervals: ["pilot-entry"] }, { intervalTimes: [] }, { rawRoots: {} }])("refuses unsafe failed-baseline custody %j", patch => {
    expect(() => lean.validateLeanBookkeepingBaselineCustodyV8({ ...custody(), ...patch })).toThrow()
  })
})
