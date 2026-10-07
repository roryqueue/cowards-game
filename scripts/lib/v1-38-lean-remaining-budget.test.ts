/** Source-only synthetic v9 contracts. No historical reader or live dispatch. */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import * as lean from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as correction from "../run-v1-38-lean-correction.js"
import { assertLeanRetryBaselineJoinV8 } from "./v1-38-lean-baseline-retained.js"

const r = (label: string) => labRoot("remaining-budget-inert", label)
const envelope = () => lean.LEAN_REMAINING_V9_EXTENSION
const input = (route: "diagnostic" | "baseline" = "diagnostic", ordinal: lean.LeanRetryOrdinal = 1, charges = route === "diagnostic" ? 30 : 31) => {
  const b = envelope()
  const survivors = Array.from({ length: 367 }, (_, i) => ({ identity: `.strategy-lab/inert-v9-history-${i}`, allocatedBytes: i === 0 ? 13_365_248 : 4096 }))
  const p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: charges, elapsedUpperBoundMs: 64_594_435, allocatedDiskBytes: 14_864_384, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r("history"), survivors }
  return { timeboxExtension: b, sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: b?.planRoot, supervisorDecisionRoot: b?.approvalRoot, candidateRoots: [r("a"), r("b")], requestRoots: Array.from({ length: route === "diagnostic" ? 1 : 36 }, (_, i) => r(`request-${i}`)), seed: "inert-v9", route, reuseGrantRoot: r("reuse"), acceptedCheckRoot: route === "diagnostic" ? null : r("new-check"), requestBytesRoot: r("bytes"), dataReviewRoot: r("data"), setupAccountingRoot: r("setup"), predecessor: { ...p, root: labRoot(p.schemaVersion, p) }, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, attemptOrdinal: ordinal, priorClosureRoot: ordinal === 1 ? null : r("new-spent-closure"), continuationRoot: ordinal === 1 ? null : r("new-continuation"), acceptedReaderCloseRoot: route === "diagnostic" ? null : r("new-final") }
}
describe("approved additive v9 remaining-budget envelope", () => {
  it("binds the exact carry and unchanged caps without modifying v8", () => {
    expect(envelope()).toMatchObject({ schemaVersion: "lean-remaining-budget-envelope-v9", priorElapsedMs: 64_594_435, startedAtMs: 1791346557488, elapsedMs: 72_000_000, charged: 30, excludedIdleMs: 8_595_857, maximumDiagnostics: 3, maximumBaselines: 1 })
    expect(lean.LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION).toMatchObject({ priorElapsedMs: 62_024_083, attemptOrdinal: 2 })
    expect(lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION).toMatchObject({ priorElapsedMs: 56_000_917, charged: 29 })
    expect(lean.admitLeanRetryTimeboxExtension(envelope())).toBe(envelope())
    expect(lean.leanRetryRootElapsedFloorV8(1791346557488 + 1234, envelope())).toBe(64_595_669)
  })
  it.each([1, 2, 3] as const)("preserves v9-%s through parser, child, allocation and writable identities", n => {
    const mode = `v9-${n}` as lean.LeanRetryMode
    const a = lean.createLeanSupervisorCorrectionAllocation(input("diagnostic", n), 8)
    expect(lean.admitLeanAllocation(a)).toEqual(a)
    expect(lean.leanSupervisorAllocationMode(a)).toBe(mode)
    expect(lean.leanCapsForAllocation(a)).toEqual(lean.LEAN_RETRY_V8_TIMEBOX_CAPS)
    const paths = lean.leanCorrectionRoutePaths("diagnostic", mode)
    expect(paths.store).toContain(`20261007-${mode}`)
    expect(paths).not.toEqual(lean.leanCorrectionRoutePaths("diagnostic", `v8-${n}`))
    for (const verb of ["prepare", "run", "verify", "verify-terminal"]) expect(correction.parseLeanCorrectionCommand([`${verb}-supervisor-diagnostic-${mode}`, "--request", paths.request])).toMatchObject({ supervisor: mode })
    expect(correction.leanCorrectionChildMode("diagnostic", mode)).toBe(`child-supervisor-diagnostic-${mode}`)
    expect(lean.leanWritablePaths(a)).toContain(lean.leanRetrySetupPath(mode))
    expect(readFileSync("scripts/run-v1-38-lean-correction.sh", "utf8")).toContain(`run-supervisor-diagnostic-${mode}`)
  })
  it("all fresh route destinations are distinct and ordinals are exhausted at three", () => {
    const destinations = [1, 2, 3].flatMap(n => ["diagnostic", "baseline"].flatMap(route => {
      const p = lean.leanCorrectionRoutePaths(route as "diagnostic" | "baseline", `v9-${n}` as lean.LeanRetryMode)
      return [p.store, p.request, p.allocation, p.temp]
    }))
    expect(new Set(destinations).size).toBe(24)
    expect(() => correction.parseLeanCorrectionCommand(["prepare-supervisor-diagnostic-v9-4", "--request", "inert"])).toThrow()
  })
  it.each(["approvalRoot", "planRoot", "charged", "startedAtMs", "root"])("rejects tampered binding %s", key => {
    expect(() => lean.admitLeanRetryTimeboxExtension({ ...envelope(), [key]: r("forged") })).toThrow()
  })
  it("retains the complete synthetic 367-row debit before schedule filtering", () => {
    const f = input(), a = lean.createLeanSupervisorCorrectionAllocation(f, 8)
    expect(a.predecessor).toEqual(f.predecessor)
    expect(a.predecessor.survivors.reduce((n, row) => n + row.allocatedBytes, 0)).toBe(14_864_384)
    const body = { ...f.predecessor, survivors: [...f.predecessor.survivors, { identity: ".planning/phases/265-serious-current-rules-league-and-development-red-team/UNRELATED.md", allocatedBytes: 4096 }] }
    const { root: _root, ...p } = body
    expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...f, predecessor: { ...p, root: labRoot(p.schemaVersion, p) } }, 8)).toThrow()
  })
  it("a zero-charge failed earlier route can precede each distinct next route, never refund", () => {
    expect(() => lean.createLeanSupervisorCorrectionAllocation(input("diagnostic", 2, 30), 8)).not.toThrow()
    expect(() => lean.createLeanSupervisorCorrectionAllocation(input("diagnostic", 3, 30), 8)).not.toThrow()
    expect(() => lean.createLeanSupervisorCorrectionAllocation(input("diagnostic", 2, 29), 8)).toThrow()
  })
  it("requires the new accepted check plus actual FINAL same-source lineage for baseline", () => {
    const a = lean.createLeanSupervisorCorrectionAllocation(input("baseline"), 8), check = { root: a.acceptedCheckRoot!, allocationRoot: r("new-diag"), readerCloseMs: 1791346557588 }
    const closure = { timeboxExtension: envelope(), attemptOrdinal: 1, closureClass: "accepted", finalReaderClose: true, acceptedCheckAbsent: false, checkRoot: check.root, allocationRoot: check.allocationRoot, root: a.acceptedReaderCloseRoot!, readerCloseMs: check.readerCloseMs, sourceRoot: a.sourceRoot, head: "1".repeat(40) }
    expect(() => assertLeanRetryBaselineJoinV8(a, check, closure, "2".repeat(40))).not.toThrow()
    for (const patch of [{ timeboxExtension: lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION }, { closureClass: "absent" }, { finalReaderClose: false }, { sourceRoot: r("old") }, { checkRoot: lean.LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION.diagnosticCheckRoot }]) expect(() => assertLeanRetryBaselineJoinV8(a, check, { ...closure, ...patch }, "2".repeat(40))).toThrow()
  })
  it("source closure excludes all source/data reports and includes exact approved source", () => {
    const manifest = correction.leanCorrectionSourceManifest("v9-1", envelope())
    expect(manifest.entries).toContainEqual({ path: correction.LEAN_REMAINING_V9_APPROVAL, root: envelope().approvalRoot })
    expect(manifest.entries).toContainEqual({ path: correction.LEAN_REMAINING_V9_PLAN, root: envelope().planRoot })
    expect(manifest.entries.some(e => /(?:SOURCE|DATA)-REVIEW/u.test(e.path))).toBe(false)
    expect(manifest.entries.some(e => e.path === "scripts/lib/v1-38-lean-remaining-budget.test.ts")).toBe(true)
    expect(() => correction.leanCorrectionSourceManifest("v8-1", envelope())).toThrow()
    expect(() => correction.leanCorrectionSourceManifest("v9-1", lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION)).toThrow()
  })
  it("insufficient reserve or SAME-PROCESS capacity refuses before dispatch", () => {
    const a = lean.createLeanSupervisorCorrectionAllocation(input(), 8)
    const m = { elapsedMs: 65_000_000, charged: 30, physicalBytes: 14_864_384, childRss: 1, parentRss: 1, freeBytes: lean.LEAN_CAPS.totalBytes, availableMemoryBytes: 2_000_000_000 }
    expect(() => correction.assertLeanCorrectionResources(m, a)).not.toThrow()
    expect(() => correction.assertLeanCorrectionResources({ ...m, elapsedMs: 70_140_000 }, a)).toThrow()
    expect(() => correction.assertLeanCorrectionResources({ ...m, availableMemoryBytes: 0 }, a)).toThrow()
  })
})
