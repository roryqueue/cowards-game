/** Source-only synthetic v9 contracts. No historical reader or live dispatch. */
import { afterEach, describe, it, expect, vi } from "vitest"
import { readFileSync, existsSync, lstatSync } from "node:fs"
import * as fs from "node:fs"
import { resolve, join } from "node:path"
import { tmpdir } from "node:os"
import * as retained from "./v1-38-lean-correction-retained.js"
import * as reuseIO from "./v1-38-lean-baseline-reuse.js"
import { deriveLeanSupervisorCorrectionRequestRoots } from "../run-v1-38-lean-correction.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import * as lean from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as correction from "../run-v1-38-lean-correction.js"
import { assertLeanRetryBaselineJoinV8 } from "./v1-38-lean-baseline-retained.js"
import { validateLeanRemainingPreparationCustodyV9, LEAN_REMAINING_V9_PREPARATION_PINS, LEAN_REMAINING_V9_AUTHOR_REFUSAL_PINS, validateLeanRemainingAuthorRefusalCustodyV9, authenticateLeanRemainingClosedPrefixV9, leanRemainingAuthorRefusalAbsentPathsV9 } from "./v1-38-lean-correction-retained.js"

const r = (label: string) => labRoot("remaining-budget-inert", label)
const envelope = () => lean.LEAN_REMAINING_V9_EXTENSION
const envelopeV10 = () => lean.LEAN_TWENTY_SIX_V10_EXTENSION
const input = (route: "diagnostic" | "baseline" = "diagnostic", ordinal: lean.LeanRetryOrdinal = 1, charges = route === "diagnostic" ? 30 : 31) => {
  const b = envelope()
  const survivors = Array.from({ length: 367 }, (_, i) => ({ identity: `.strategy-lab/inert-v9-history-${i}`, allocatedBytes: i === 0 ? 13_365_248 : 4096 }))
  const p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: charges, elapsedUpperBoundMs: 64_594_435, allocatedDiskBytes: 14_864_384, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r("history"), survivors }
  return { timeboxExtension: b, sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: b?.planRoot, supervisorDecisionRoot: b?.approvalRoot, candidateRoots: [r("a"), r("b")], requestRoots: Array.from({ length: route === "diagnostic" ? 1 : 36 }, (_, i) => r(`request-${i}`)), seed: "inert-v9", route, reuseGrantRoot: r("reuse"), acceptedCheckRoot: route === "diagnostic" ? null : r("new-check"), requestBytesRoot: r("bytes"), dataReviewRoot: r("data"), setupAccountingRoot: r("setup"), predecessor: { ...p, root: labRoot(p.schemaVersion, p) }, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, attemptOrdinal: ordinal, priorClosureRoot: ordinal === 1 ? null : r("new-spent-closure"), continuationRoot: ordinal === 1 ? null : r("new-continuation"), acceptedReaderCloseRoot: route === "diagnostic" ? null : r("new-final") }
}
const inputV10 = (route: "diagnostic" | "baseline" = "diagnostic") => {
  const b = envelopeV10(), f = input(route), survivors = Array.from({ length: 407 }, (_, i) => ({ identity: `.strategy-lab/inert-v10-history-${i}`, allocatedBytes: i === 0 ? 9_134_080 : 4096 }))
  const p = { ...f.predecessor, chargedMatches: route === "diagnostic" ? 31 : 32, elapsedUpperBoundMs: b.priorElapsedMs, allocatedDiskBytes: b.physicalFloorBytes, survivors }
  const { root: _root, ...pb } = p
  return { ...f, seed: "inert-v10", timeboxExtension: b, planRoot: b.planRoot, supervisorDecisionRoot: b.approvalRoot, predecessor: { ...pb, root: labRoot(pb.schemaVersion, pb) } }
}
describe("approved additive v10-1 twenty-six-hour envelope", () => {
  it("admits only the approved binding and routes every CLI and child identity", () => {
    const b = envelopeV10()
    expect(b).toMatchObject({ priorElapsedMs: 71_508_287, startedAtMs: 1791379126859, previousCompletedAtMs: 1791353471340, elapsedMs: 93_600_000, charged: 31, excludedIdleMs: 25_655_519, maximumDiagnostics: 1, maximumBaselines: 1, reserveMs: 1_860_000 })
    expect(lean.admitLeanRetryTimeboxExtension(b)).toBe(b)
    expect(lean.leanRetryRootElapsedFloorV8(b.startedAtMs + 123, b)).toBe(71_508_410)
    for (const route of ["diagnostic", "baseline"] as const) {
      const paths = lean.leanCorrectionRoutePaths(route, "v10-1")
      expect(paths.store).toContain(`20261007-v10-1`)
      expect(paths).not.toEqual(lean.leanCorrectionRoutePaths(route, "v9-1"))
      for (const verb of ["prepare", "run", "verify", "verify-terminal"]) {
        expect(correction.parseLeanCorrectionCommand([`${verb}-supervisor-${route}-v10-1`, "--request", paths.request])).toMatchObject({ supervisor: "v10-1", route })
        expect(readFileSync("scripts/run-v1-38-lean-correction.sh", "utf8")).toContain(`${verb}-supervisor-${route}-v10-1`)
      }
      expect(correction.leanCorrectionChildMode(route, "v10-1")).toBe(`child-supervisor-${route}-v10-1`)
      expect(correction.leanCorrectionChildSupervisor(correction.leanCorrectionChildMode(route, "v10-1"))).toBe("v10-1")
    }
    expect(() => correction.parseLeanCorrectionCommand(["prepare-supervisor-diagnostic-v10-2", "--request", "inert"])).toThrow()
    for (const key of ["approvalRoot", "planRoot", "charged", "startedAtMs", "root", "elapsedMs", "excludedIdleMs"]) expect(() => lean.admitLeanRetryTimeboxExtension({ ...b, [key]: r("forged") })).toThrow()
  })
  it.each(["diagnostic", "baseline"] as const)("routes admitted %s allocation, cap cache, preflight, elapsed floor and FINAL join", route => {
    const f = inputV10(route), allocation = lean.createLeanSupervisorCorrectionAllocation(f, 8), admitted = lean.admitLeanAllocation(allocation)
    expect(lean.leanSupervisorAllocationMode(admitted)).toBe("v10-1")
    expect(lean.leanCapsForAllocation(admitted)).toBe(lean.LEAN_TWENTY_SIX_V10_CAPS)
    expect(lean.leanCapsForAllocation(allocation)).toEqual(lean.LEAN_TWENTY_SIX_V10_CAPS)
    expect(lean.leanCapsForAllocation(JSON.parse(JSON.stringify(allocation)))).toEqual(lean.LEAN_TWENTY_SIX_V10_CAPS)
    expect(retained.leanCapsForAllocationModeV8(envelopeV10())).toBe(93_600_000)
    expect(retained.leanCapsForAllocationModeV8(envelope())).toBe(72_000_000)
    const start = { wallStartMs: envelopeV10().startedAtMs, monotonicStartNs: "0" }, now = { wallStartMs: start.wallStartMs + 123, monotonicStartNs: "123000000" }
    expect(correction.assertLeanCorrectionAdmissionTime(f.predecessor.elapsedUpperBoundMs, start, now, admitted)).toBe(envelopeV10().priorElapsedMs + 123)
    const m = { elapsedMs: 73_000_000, charged: route === "diagnostic" ? 31 : 32, physicalBytes: f.predecessor.allocatedDiskBytes, childRss: 1, parentRss: 1, freeBytes: lean.LEAN_CAPS.totalBytes, availableMemoryBytes: 2_000_000_000 }
    expect(() => correction.assertLeanCorrectionResources(m, admitted)).not.toThrow()
    expect(() => correction.assertLeanCorrectionResources({ ...m, elapsedMs: 91_740_000 }, admitted)).toThrow()
    expect(() => correction.assertLeanCorrectionResources({ ...m, charged: 300 }, admitted)).toThrow()
    expect(() => correction.assertLeanCorrectionResources({ ...m, availableMemoryBytes: 0 }, admitted)).toThrow()
    expect(lean.leanWritablePaths(admitted)).toContain(lean.leanRetrySetupPath("v10-1"))
    for (const patch of [{ attemptOrdinal: 2 }, { timeboxExtension: envelope() }, { planRoot: envelope().planRoot }]) expect(() => lean.admitLeanAllocation({ ...allocation, ...patch })).toThrow()
    if (route === "baseline") {
      const check = { root: allocation.acceptedCheckRoot!, allocationRoot: r("fresh-diag"), readerCloseMs: envelopeV10().startedAtMs + 1 }
      const closure = { timeboxExtension: envelopeV10(), attemptOrdinal: 1, closureClass: "accepted", finalReaderClose: true, acceptedCheckAbsent: false, checkRoot: check.root, allocationRoot: check.allocationRoot, root: allocation.acceptedReaderCloseRoot!, readerCloseMs: check.readerCloseMs, sourceRoot: allocation.sourceRoot, head: "1".repeat(40) }
      expect(() => assertLeanRetryBaselineJoinV8(allocation, check, closure, "2".repeat(40))).not.toThrow()
      for (const patch of [{ timeboxExtension: envelope() }, { finalReaderClose: false }, { sourceRoot: r("old-source") }, { checkRoot: r("old-check") }]) expect(() => assertLeanRetryBaselineJoinV8(allocation, check, { ...closure, ...patch }, "2".repeat(40))).toThrow()
    }
  })
  it("uses 93.6M at actual inert ledger interval, resource, capacity and charge boundaries", () => {
    const directory = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "lean-v10-inert-"))), allocation = lean.createLeanSupervisorCorrectionAllocation(inputV10(), 8)
    try {
      const ledger = lean.createLeanLedger(join(directory, "store"), allocation), start = envelopeV10().startedAtMs
      vi.spyOn(Date, "now").mockReturnValue(start)
      lean.publishLeanChildEntry(ledger, { schemaVersion: "lean-child-entry-v2", allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot: allocation.requestBytesRoot!, head: "1".repeat(40), parentPid: process.ppid, childPid: process.pid, handshakeRoot: r("inert-handshake"), wallStartMs: start + 2_000_000, monotonicStartNs: process.hrtime.bigint().toString() })
      lean.beginLeanInterval(ledger, "inert-cost", start)
      lean.closeLeanInterval(ledger, "inert-cost", start + 2_000_000)
      expect(lean.readLeanTimeAccounting(ledger).closedElapsedMs).toBe(73_508_287)
      expect(lean.currentLeanElapsedMs(ledger)).toBe(73_508_287)
      lean.checkpointLeanResources(ledger, 73_508_287, 1, 1)
      expect(lean.readLeanLedger(ledger).elapsedMs).toBe(73_508_287)
      vi.spyOn(Date, "now").mockReturnValue(start + 2_000_000)
      lean.beginLeanInterval(ledger, "pilot-entry", start + 2_000_000)
      const capacity = { freeBytes: lean.LEAN_CAPS.totalBytes, availableMemoryBytes: 2_000_000_000 }
      expect(() => lean.chargeLeanSlot(ledger, allocation.slots[0]!, { ...capacity, availableMemoryBytes: 0 })).toThrow("CAPACITY")
      const charged = lean.chargeLeanSlot(ledger, allocation.slots[0]!, capacity)
      expect(charged.ordinal).toBe(0)
      expect(lean.readLeanLedger(ledger).charged).toBe(32)
      expect(() => lean.checkpointLeanResources(ledger, 93_600_001, 1, 1)).toThrow("RESOURCE")
    } finally { fs.rmSync(directory, { recursive: true, force: true }) }
  })
  it("authenticates only the finite pinned old-v9 custody, never emitting accepted authority", () => {
    const raw = new Map(Object.keys(retained.LEAN_TWENTY_SIX_V10_HISTORY_PINS).map(path => [path, fs.readFileSync(path)])), history = retained.validateLeanTwentySixHistoricalCustodyV10(raw, [])
    expect(history).toMatchObject({ authorizing: false, cumulativeCharged: 31, priorElapsedMs: 71_508_287, reserveBytes: 4_288_512 })
    expect(history.predecessor.survivors).toHaveLength(407)
    for (const key of ["accepted", "checkRoot", "finalReaderClose", "readerCloseMs"]) expect(history).not.toHaveProperty(key)
    for (const path of raw.keys()) {
      const missing = new Map(raw); missing.delete(path); expect(() => retained.validateLeanTwentySixHistoricalCustodyV10(missing, [])).toThrow()
      const changed = new Map(raw); changed.set(path, Buffer.concat([raw.get(path)!, Buffer.from(" ")])); expect(() => retained.validateLeanTwentySixHistoricalCustodyV10(changed, [])).toThrow()
    }
    for (const path of retained.leanTwentySixHistoricalAbsentPathsV10()) expect(() => retained.validateLeanTwentySixHistoricalCustodyV10(raw, [path])).toThrow()
    expect(retained.authenticateLeanTwentySixHistoricalCustodyV10()).toMatchObject({ authorizing: false, cumulativeCharged: 31, refusalRoot: expect.any(String) })
  })
  it("keeps every exact new report physically debited but outside functional source", () => {
    const names = ["RESEARCH-v1.md", "APPROVAL-20261007.md", "PLAN-v1.md", "PLAN-CHECK-v1.md", "PLAN-CHECK-v2.md", "SOURCE-REVIEW-v1.md", "SOURCE-REVIEW-v2.md", "SOURCE-SUMMARY-v1.md", "REVIEW-FIX-v1.md", "VALIDATION-v1.md", "SOURCE-VERIFICATION-v1.md", "BASELINE-DATA-REVIEW-v1.md", "BASELINE-HELPER-REVIEW-v1.md", "BASELINE-ALLOCATION-v1.json", "BASELINE-PREPARATION-v1.md", "DIAGNOSTIC-REQUEST-v1.json", "DIAGNOSTIC-SETUP-v1.json", "DIAGNOSTIC-CONTINUATION-v1.json", "DIAGNOSTIC-AUTHORIZATION-v1.json", "BASELINE-REQUEST-v1.json", "BASELINE-SETUP-v1.json", "BASELINE-CONTINUATION-v1.json", "BASELINE-AUTHORIZATION-v1.json"]
    const manifest = correction.leanCorrectionSourceManifest("v10-1", envelopeV10())
    for (const name of names) {
      const path = `${lean.LEAN_REMAINING_V9_PHASE}NEW265-16-TWENTY-SIX-HOUR-${name}`
      expect(lean.LEAN_TWENTY_SIX_V10_REPORT_PATHS.filter(p => p === path)).toEqual([path])
      expect(manifest.entries.some(entry => entry.path === path)).toBe(false)
    }
    const f = inputV10(), extant = lean.LEAN_TWENTY_SIX_V10_REPORT_PATHS.filter(path => existsSync(path)), rows = correction.inventoryLeanSupervisorSurvivors(extant)
    const { root: _root, ...p } = f.predecessor, body = { ...p, survivors: [...p.survivors, ...rows], allocatedDiskBytes: p.allocatedDiskBytes + rows.reduce((n, row) => n + row.allocatedBytes, 0) }
    expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...f, predecessor: { ...body, root: labRoot(body.schemaVersion, body) } }, 8)).not.toThrow()
    for (const row of rows) expect(row.allocatedBytes).toBe(fs.lstatSync(row.identity).blocks * 512)
    const wrong = { ...body, survivors: [...body.survivors, { identity: `${lean.LEAN_REMAINING_V9_PHASE}UNRELATED.md`, allocatedBytes: 0 }] }
    expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...f, predecessor: { ...wrong, root: labRoot(wrong.schemaVersion, wrong) } }, 8)).toThrow()
    expect(() => correction.leanCorrectionSourceManifest("v10-1", envelope())).toThrow()
    expect(() => correction.leanCorrectionSourceManifest("v9-1", envelopeV10())).toThrow()
  })
})
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
  it("carries the actual 387-row v9-1 vector below the conservative floor without refunding reserve", () => {
    const f = input(), { root: _root, ...p } = f.predecessor
    // Actual diagnosis: all 287 old rows intact, 100 additions, inherited reserve unchanged.
    const survivors = Array.from({ length: 387 }, (_, i) => ({ identity: `.strategy-lab/inert-actual-v9-${i}`, allocatedBytes: i === 0 ? 9_117_696 : 4096 }))
    expect(survivors.reduce((sum, row) => sum + row.allocatedBytes, 0)).toBe(10_698_752)
    const body = { ...p, survivors, allocatedDiskBytes: 10_698_752 + 4_288_512 }
    const predecessor = { ...body, root: labRoot(body.schemaVersion, body) }
    expect(lean.createLeanSupervisorCorrectionAllocation({ ...f, predecessor }, 8).predecessor).toEqual(predecessor)
    for (const patch of [{ allocatedDiskBytes: 10_698_751 }, { allocatedDiskBytes: envelope().physicalFloorBytes - 1 }, { survivors: survivors.slice(0, 366) }, { survivors: [...survivors, survivors[0]!] }, { survivors: [...survivors, { identity: `${lean.LEAN_REMAINING_V9_PHASE}UNRELATED.md`, allocatedBytes: 4096 }] }]) {
      const changed = { ...body, ...patch }
      expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...f, predecessor: { ...changed, root: labRoot(changed.schemaVersion, changed) } }, 8)).toThrow()
    }
  })
  it("validates every exact old/new report row with its full physical debit", () => {
    const f = input(), reports = lean.LEAN_REMAINING_V9_REVIEW_PATHS.map(identity => ({ identity, allocatedBytes: 4096 }))
    const { root: _root, ...p } = f.predecessor
    const body = { ...p, survivors: [...p.survivors, ...reports], allocatedDiskBytes: p.allocatedDiskBytes + reports.length * 4096 }
    const predecessor = { ...body, root: labRoot(body.schemaVersion, body) }
    expect(lean.createLeanSupervisorCorrectionAllocation({ ...f, predecessor }, 8).predecessor).toEqual(predecessor)
    for (const patch of [{ allocatedDiskBytes: p.allocatedDiskBytes }, { survivors: [...body.survivors, reports[0]!] }, { survivors: [...body.survivors.slice(0, -1), { ...reports.at(-1)!, allocatedBytes: -1 }] }]) {
      const changed = { ...body, ...patch }
      expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...f, predecessor: { ...changed, root: labRoot(body.schemaVersion, changed) } }, 8)).toThrow()
    }
  })
  it("debits every exact file-basis gate report once, including the measured current source review", () => {
    const names = ["V9-1-AUTHOR-FINALIZATION-TERMINAL-VERIFICATION-v1", "V9-1-FILE-ACCOUNTING-DIAGNOSIS-v1", "V9-FILE-BASIS-REPAIR-PLAN-v1", "V9-FILE-BASIS-PLAN-CHECK-v1", "V9-FILE-BASIS-SOURCE-SUMMARY-v1", "V9-FILE-BASIS-SOURCE-REVIEW-v1", "V9-FILE-BASIS-SOURCE-REVIEW-v2", "V9-FILE-BASIS-REVIEW-FIX-v1", "V9-FILE-BASIS-SOURCE-VALIDATION-v1", "V9-FILE-BASIS-SOURCE-VERIFICATION-v1", "V9-2-SOURCE-REVIEW-v1", "V9-2-DATA-REVIEW-v1"]
    const expected = [
      ...names.map(name => `${lean.LEAN_REMAINING_V9_PHASE}NEW265-16-${name}.md`),
      ".planning/debug/v9-baseline-prepare.md",
      `${lean.LEAN_REMAINING_V9_PHASE}NEW265-16-V9-BASELINE-FOR-2-PREPARATION-TERMINAL-VERIFICATION-v1.md`,
      ...["REPAIR-PLAN-v1", "PLAN-CHECK-v1", "PLAN-CHECK-v2", "SOURCE-SUMMARY-v1", "SOURCE-REVIEW-v1", "SOURCE-REVIEW-v2", "REVIEW-FIX-v1", "SOURCE-VALIDATION-v1", "SOURCE-VERIFICATION-v1"].map(name => `${lean.LEAN_REMAINING_V9_PHASE}NEW265-16-V9-BASELINE-LINEAGE-${name}.md`),
    ]
    for (const path of expected) expect(lean.LEAN_REMAINING_V9_REVIEW_PATHS.filter(identity => identity === path)).toEqual([path])
    const extant = expected.filter(path => existsSync(path)), measured = correction.inventoryLeanSupervisorSurvivors(extant)
    expect(measured).toHaveLength(extant.length)
    for (const row of measured) expect(row.allocatedBytes).toBe(lstatSync(row.identity).blocks * 512)
    expect(measured).toContainEqual({ identity: `${lean.LEAN_REMAINING_V9_PHASE}NEW265-16-V9-FILE-BASIS-SOURCE-REVIEW-v1.md`, allocatedBytes: lstatSync(`${lean.LEAN_REMAINING_V9_PHASE}NEW265-16-V9-FILE-BASIS-SOURCE-REVIEW-v1.md`).blocks * 512 })
    const f = input(), { root: _root, ...p } = f.predecessor, reserve = 4_288_512
    const body = { ...p, survivors: [...p.survivors, ...measured], allocatedDiskBytes: p.allocatedDiskBytes + reserve + measured.reduce((sum, row) => sum + row.allocatedBytes, 0) }
    const predecessor = { ...body, root: labRoot(body.schemaVersion, body) }
    expect(lean.createLeanSupervisorCorrectionAllocation({ ...f, predecessor }, 8).predecessor).toEqual(predecessor)
    const manifest = correction.leanCorrectionSourceManifest("v9-2", envelope())
    expect(manifest.entries.some(entry => expected.includes(entry.path))).toBe(false)
    const source = readFileSync("scripts/run-v1-38-lean-correction.ts", "utf8")
    expect(source).toContain('identities.push(...LEAN_REMAINING_V9_REVIEW_PATHS.filter(path => existsSync(path)))')
    expect(source).toContain('const survivors = inventoryLeanSupervisorSurvivors([...new Set(identities)])')
    expect(source).toContain('bytesRoot: leanBytesRoot(readFileSync(row.identity))')
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
    expect(correction.leanCorrectionSourceManifest("v9-2", envelope()).root).toBe(manifest.root)
    expect(correction.leanCorrectionSourceManifest("v9-3", envelope()).root).toBe(manifest.root)
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
  it("pinned old preparation is finite, spent, terminal-only and cannot become FINAL", () => {
    const dir = lean.LEAN_REMAINING_V9_PHASE
    const request: correction.LeanCorrectionRequest = { planRoot: r("plan"), amendmentRoot: r("amendment"), reviewRoot: r("review"), dataReviewRoot: r("data"), coldRoot: r("cold"), seed: "inert-old", reuseGrantRoot: r("reuse"), candidateRoots: [r("a"), r("b")], requestRoots: [r("request")], diagnosis: null, schemaVersion: "lean-correction-supervisor-request-v8", attemptOrdinal: 2, route: "diagnostic", reviewPath: `${dir}NEW265-16-BOOKKEEPING-CONTINUATION-SOURCE-ADMISSION-REVIEW-v1.md`, dataReviewPath: `${dir}NEW265-16-BOOKKEEPING-CONTINUATION-DIAGNOSTIC-2-DATA-REVIEW-v1.md`, authorizationPath: ".strategy-lab/lean-retry-authorization-diagnostic-v8-2.json", setupAccountingPath: ".strategy-lab/lean-retry-envelope-setup-20261006-v8-2.json", timeboxExtension: lean.LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION, sourceRoot: "sha256:8cf180adcfd731c1b47de02b380bd86d913a1f00ec30ac74a8409f04d6923b1c" }
    const failure = { root: "sha256:84add3c8424b3d85b9b4c0c901ba8a6679939e74a8df6627bfd4bdadff528d77", sourceRoot: request.sourceRoot, head: "888ca6032a20a9ddbb59f11373ed1234706a6f8d", requestBytesRoot: LEAN_REMAINING_V9_PREPARATION_PINS[".strategy-lab/lean-correction-supervisor-diagnostic-request-20261006-v8-2.json"], admissionMode: "prepare", currentCharges: 0, cumulativeCharged: null, storeAbsent: true, childSpawned: false, cleanup: null, allocationRoot: null, ledgerBytesRoot: null, timeBytesRoot: null, entryAbsent: true, terminalAbsent: true, resultAbsent: true, acceptedCheckAbsent: true }
    expect(() => validateLeanRemainingPreparationCustodyV9(request, failure)).not.toThrow()
    for (const patch of [{ root: r("replaced") }, { currentCharges: 1 }, { allocationRoot: r("fabricated") }, { childSpawned: true }, { resultAbsent: false }, { head: "2".repeat(40) }]) expect(() => validateLeanRemainingPreparationCustodyV9(request, { ...failure, ...patch })).toThrow()
    expect(() => validateLeanRemainingPreparationCustodyV9({ ...request, reviewPath: `${dir}UNRELATED.md` }, failure)).toThrow()
  })
  it("pure MAIN authoring APIs preserve exact report/request/setup identities", () => {
    for (const n of [1, 2, 3] as const) {
      const mode = `v9-${n}` as lean.LeanRetryMode, docs = correction.leanRemainingDocumentsV9("diagnostic", mode), setup = correction.createLeanRemainingSetupWitnessV9(mode, envelope().startedAtMs + 1), f = input("diagnostic", n)
      const request = correction.createLeanRemainingRequestDraftV9(mode, "diagnostic", { sourceRoot: f.sourceRoot, reviewRoot: f.reviewRoot, dataReviewRoot: f.dataReviewRoot, setupAccountingRoot: setup.root, reuseGrantRoot: f.reuseGrantRoot, authorizationRoot: r("auth"), priorClosureRoot: f.priorClosureRoot, continuationRoot: f.continuationRoot, acceptedCheckRoot: null, acceptedReaderCloseRoot: null })
      expect(request).toMatchObject({ timeboxExtension: envelope(), attemptOrdinal: n, reviewPath: docs.review, dataReviewPath: docs.dataReview, setupAccountingPath: docs.setup, authorizationPath: docs.authorization, setupAccountingRoot: setup.root })
      expect(request.requestRoots).toHaveLength(1)
      expect(correction.leanCorrectionRequestDataRoot(request)).toBe(correction.leanCorrectionRequestDataRoot({ ...request, authorizationRoot: r("final-auth") }))
    }
  })
  it("authenticates only the exact spent v9-1 author refusal, without invented reader/FINAL fields", () => {
    // Finite immutable metadata only; no ordinary historical reader or admission.
    const raw = new Map(Object.keys(LEAN_REMAINING_V9_AUTHOR_REFUSAL_PINS).map(path => [path, readFileSync(path)]))
    const prior = validateLeanRemainingAuthorRefusalCustodyV9(raw, [])
    expect(prior).toMatchObject({ custodyClass: "author_finalization_refusal", closureClass: "refused", closedAtMs: 1791349668689, currentCharges: 0, cumulativeCharged: 30, finalReaderClose: false, accepted: false, authorizing: false })
    expect(prior.closedElapsedMs).toBe(lean.leanRetryRootElapsedFloorV8(prior.closedAtMs, envelope()))
    for (const field of ["readerStartMs", "readerCloseMs", "readerInterval", "allocationRoot", "entryBytesRoot", "terminalBytesRoot", "timeBytesRoot", "checkRoot"]) expect(prior).not.toHaveProperty(field)
    expect(prior.identities).toEqual(Object.keys(LEAN_REMAINING_V9_AUTHOR_REFUSAL_PINS))
    expect(authenticateLeanRemainingClosedPrefixV9("v9-1")).toEqual(prior)
    for (const path of raw.keys()) {
      const missing = new Map(raw); missing.delete(path)
      expect(() => validateLeanRemainingAuthorRefusalCustodyV9(missing, [])).toThrow()
      const tampered = new Map(raw); tampered.set(path, Buffer.concat([raw.get(path)!, Buffer.from(" ")]))
      expect(() => validateLeanRemainingAuthorRefusalCustodyV9(tampered, [])).toThrow()
    }
    for (const path of leanRemainingAuthorRefusalAbsentPathsV9()) expect(() => validateLeanRemainingAuthorRefusalCustodyV9(raw, [path])).toThrow()
    const observationPath = ".strategy-lab/lean-correction-supervisor-diagnostic-20261007-v9-1-tmp/author-finalization-terminal-observation-v1.json"
    const observation = JSON.parse(raw.get(observationPath)!.toString())
    for (const patch of [{ finalReaderClose: true }, { accepted: true }, { authorizing: true }, { readerCloseMs: prior.closedAtMs }, { head: "2".repeat(40) }, { currentCharges: 1 }, { observedAtMs: prior.closedAtMs + 1 }]) {
      const forged = new Map(raw); forged.set(observationPath, Buffer.from(JSON.stringify({ ...observation, ...patch })))
      expect(() => validateLeanRemainingAuthorRefusalCustodyV9(forged, [])).toThrow()
    }
    const a = lean.createLeanSupervisorCorrectionAllocation(input("baseline"), 8)
    // @ts-expect-error Deliberate hostile input: refusal custody is not a reader FINAL, even structurally.
    expect(() => assertLeanRetryBaselineJoinV8(a, { root: a.acceptedCheckRoot!, allocationRoot: r("new-diag"), readerCloseMs: prior.closedAtMs }, prior, "2".repeat(40))).toThrow()
    expect(() => authenticateLeanRemainingClosedPrefixV9("v8-1")).toThrow()
  })
  it("uses the custody anchor only for v9 continuation while retaining actual accepted FINAL joins", () => {
    const source = readFileSync("scripts/run-v1-38-lean-correction.ts", "utf8")
    expect(source).toContain('const previous = authenticateLeanRemainingClosedPrefixV9(`v9-${n - 1}`')
    expect(source).toContain('closed.closedElapsedMs + atMs - closed.closedAtMs')
    expect(source).toContain('const accepted = authenticateLeanSupervisorDiagnosticCheck(mode), closure = authenticateLeanRetryClosureV8(mode)')
  })
  it("keeps accepted-diagnostic lineage read-only and inaccessible to forged fresh-admission purposes", () => {
    const source = readFileSync("scripts/lib/v1-38-lean-correction-retained.ts", "utf8")
    expect(source).toContain("readLeanRemainingAcceptedDiagnosticLineageV9(purpose)")
    expect(source).toContain("remainingAcceptedLineagePurposesV9.delete(purpose)")
    const requestSource = readFileSync("scripts/run-v1-38-lean-correction.ts", "utf8")
    expect(requestSource).toContain("inspectLeanRemainingPredecessorWithPurposeV9(route, Date.now(), mode, purpose)")
  })
})

/** Composed read-only lineage fixture; no publication or execution. */
const virtual = vi.hoisted(() => ({ bytes: new Map<string, Buffer>(), fds: new Map<number, string>(), present: new Set<string>(), anchors: new Map<string, string>() }))
vi.mock("node:fs", async original => {
  const real = await original<typeof import("node:fs")>()
  const adjusted = (stat: fs.Stats, path: string) => virtual.bytes.has(path) ? Object.assign(Object.create(Object.getPrototypeOf(stat)), stat, { size: virtual.bytes.get(path)!.length, ...(virtual.anchors.has(path) ? { ino: 1_000_000_000 + [...virtual.anchors.keys()].indexOf(path) } : {}) }) : stat
  return { ...real,
    existsSync: (path: fs.PathLike) => virtual.bytes.has(resolve(String(path))) || virtual.present.has(resolve(String(path))) || real.existsSync(path),
    realpathSync: (path: fs.PathLike) => virtual.anchors.has(resolve(String(path))) ? resolve(String(path)) : real.realpathSync(path),
    lstatSync: (path: fs.PathLike) => adjusted(real.lstatSync(virtual.anchors.get(resolve(String(path))) ?? path), resolve(String(path))),
    openSync: (...args: Parameters<typeof real.openSync>) => { const path = resolve(String(args[0])); const fd = real.openSync(virtual.anchors.get(path) ?? args[0], args[1], args[2]); virtual.fds.set(fd, path); return fd },
    fstatSync: (fd: number) => adjusted(real.fstatSync(fd), virtual.fds.get(fd) ?? ""),
    closeSync: (fd: number) => { virtual.fds.delete(fd); real.closeSync(fd) },
    readFileSync: (...args: Parameters<typeof real.readFileSync>) => {
      const path = typeof args[0] === "number" ? virtual.fds.get(args[0]) : resolve(String(args[0])), bytes = path && virtual.bytes.get(path)
      return bytes ? typeof args[1] === "string" ? bytes.toString(args[1] as BufferEncoding) : bytes : real.readFileSync(...args)
    },
  }
})
vi.mock("node:child_process", async original => ({ ...await original<typeof import("node:child_process")>(), execFileSync: (command: string) => { if (command !== "git") throw new Error("NO_PROCESS_AUTHORITY"); return "" } }))
afterEach(() => { virtual.bytes.clear(); virtual.present.clear(); virtual.fds.clear(); virtual.anchors.clear(); vi.restoreAllMocks() })
const put = (path: string, value: unknown) => virtual.bytes.set(resolve(path), Buffer.from(lean.leanCanonicalBytes(value)))
const fixture = () => {
  const mode = "v9-2" as const, paths = lean.leanCorrectionRoutePaths("diagnostic", mode), docs = correction.leanRemainingDocumentsV9("diagnostic", mode)
  // Only finite metadata is copied as an inert template. It is re-bound in memory;
  // the old request is never admitted or modified at its historical source.
  const ledger = lean.openLeanLedger(paths.store), time = lean.readLeanTimeAccounting(ledger), originalEntry = lean.readLeanChildEntry(ledger), originalTerminal = lean.readLeanChildTerminal(ledger)
  const request = JSON.parse(fs.readFileSync(paths.request, "utf8")) as correction.LeanCorrectionRequest
  const sourceRoot = correction.leanCorrectionSourceManifest(mode, lean.LEAN_REMAINING_V9_EXTENSION).root
  request.sourceRoot = sourceRoot
  request.requestRoots = deriveLeanSupervisorCorrectionRequestRoots({ route: "diagnostic", seed: request.seed, coldRoot: request.coldRoot, planRoot: request.planRoot, sourceRoot }, lean.LEAN_REMAINING_V9_EXTENSION.approvalRoot, mode)
  const sourceReview = fs.readFileSync(docs.review, "utf8").replaceAll(originalEntry.sourceRoot, sourceRoot)
  request.reviewRoot = lean.leanBytesRoot(Buffer.from(sourceReview)); virtual.bytes.set(resolve(docs.review), Buffer.from(sourceReview))
  const dataRoot = correction.leanCorrectionRequestDataRoot(request)
  const oldData = fs.readFileSync(docs.dataReview, "utf8"), oldRequestData = /request_root: (sha256:[a-f0-9]{64})/u.exec(oldData)![1]!
  const dataReview = oldData.replaceAll(originalEntry.sourceRoot, sourceRoot).replaceAll(oldRequestData, dataRoot)
  request.dataReviewRoot = lean.leanBytesRoot(Buffer.from(dataReview)); virtual.bytes.set(resolve(docs.dataReview), Buffer.from(dataReview))
  const continuation = JSON.parse(fs.readFileSync(docs.continuation, "utf8")), { root: _cr, ...cb } = { ...continuation, sourceRoot, reviewRoot: request.reviewRoot }
  const newContinuation = { ...cb, root: labRoot(cb.schemaVersion, cb) }; request.continuationRoot = newContinuation.root; put(docs.continuation, newContinuation)
  // Request data excludes review/data/authorization roots, but includes continuation.
  const finalDataRoot = correction.leanCorrectionRequestDataRoot(request)
  const finalDataReview = dataReview.replaceAll(dataRoot, finalDataRoot); request.dataReviewRoot = lean.leanBytesRoot(Buffer.from(finalDataReview)); virtual.bytes.set(resolve(docs.dataReview), Buffer.from(finalDataReview))
  const authorization = JSON.parse(fs.readFileSync(docs.authorization, "utf8")), { root: _ar, ...ab } = { ...authorization, sourceRoot, requestDataRoot: finalDataRoot }
  const newAuthorization = { ...ab, root: labRoot(ab.schemaVersion, ab) }; request.authorizationRoot = lean.leanBytesRoot(lean.leanCanonicalBytes(newAuthorization)); put(docs.authorization, newAuthorization); put(paths.request, request)
  const requestBytesRoot = lean.leanBytesRoot(lean.leanCanonicalBytes(request)), allocation = { ...ledger.allocation, sourceRoot, requestBytesRoot }
  const entry = { ...originalEntry, sourceRoot, requestBytesRoot }, terminal = { ...originalTerminal, sourceRoot, entryBytesRoot: lean.leanBytesRoot(lean.leanCanonicalBytes(entry)) }
  put(join(paths.store, "entry.json"), entry); put(join(paths.store, "child-terminal.json"), terminal)
  const check = JSON.parse(fs.readFileSync(join(paths.store, paths.check), "utf8")), { root: _check, ...body } = { ...check, sourceRoot, requestBytesRoot }
  put(join(paths.store, paths.check), { ...body, root: labRoot(body.schemaVersion, body) })
  const originalOpen = lean.openLeanLedger, originalTime = lean.readLeanTimeAccounting, originalReadEntry = lean.readLeanChildEntry, originalReadTerminal = lean.readLeanChildTerminal
  vi.spyOn(lean, "openLeanLedger").mockImplementation(path => path === paths.store ? { ...ledger, allocation } : originalOpen(path))
  vi.spyOn(lean, "readLeanTimeAccounting").mockImplementation(value => resolve(value.directory) === resolve(paths.store) ? time : originalTime(value))
  vi.spyOn(lean, "readLeanChildEntry").mockImplementation(value => resolve(value.directory) === resolve(paths.store) ? entry : originalReadEntry(value))
  vi.spyOn(lean, "readLeanChildTerminal").mockImplementation(value => resolve(value.directory) === resolve(paths.store) ? terminal : originalReadTerminal(value))
  vi.spyOn(reuseIO, "authenticateLeanColdReuse").mockReturnValue({ grant: { root: request.reuseGrantRoot } } as never)
  // Stop immediately AFTER the real accepted-auth -> request -> predecessor chain.
  // No result/source payload audit or ordinary reader is run on historical evidence.
  const evidence = vi.spyOn(lean, "verifyLeanEvidence").mockReturnValue({} as never)
  const originalState = lean.readLeanLedger
  vi.spyOn(lean, "readLeanLedger").mockImplementation(value => resolve(value.directory) === resolve(paths.store) ? { stopped: false, charges: new Map(), charged: 31 } as never : originalState(value))
  vi.spyOn(Date, "now").mockReturnValue(time.closes.get("correction-supervisor-diagnostic-v8-reader-close")! + 1)
  const originalLineage = correction.readLeanRemainingAcceptedDiagnosticLineageV9
  let capturedPurpose: unknown
  vi.spyOn(correction, "readLeanRemainingAcceptedDiagnosticLineageV9").mockImplementation(purpose => { capturedPurpose = purpose; return originalLineage(purpose) })
  return { mode, paths, docs, time, check: { ...body, root: labRoot(body.schemaVersion, body) }, evidence, capturedPurpose: () => capturedPurpose }
}
describe("composed v9 accepted diagnostic lineage, not fresh execution", () => {
  it("crosses real request/predecessor validation for every own-baseline lifecycle state, never issuing acceptance", () => {
    const f = fixture(), baseline = lean.leanCorrectionRoutePaths("baseline", f.mode)
    for (const path of [join(baseline.temp, "admission-prepare-start.json"), baseline.allocation, baseline.store, join(baseline.temp, "admission-run-start.json"), join(baseline.store, "child-terminal.json"), join(baseline.store, "result.json")]) {
      virtual.present.add(resolve(path)); f.evidence.mockClear()
      try { retained.authenticateLeanSupervisorDiagnosticCheck(f.mode); throw new Error("NO_ACCEPTANCE_EXPECTED") } catch (error) { if (!(error instanceof Error) || !error.message.includes("ACCEPTED_CHARGE")) throw error }
      expect(f.evidence).toHaveBeenCalledOnce()
      expect(f.capturedPurpose()).toBeDefined()
      expect(() => retained.readLeanRemainingAcceptedLineagePurposeV9(f.capturedPurpose())).toThrow("CUSTODY")
      expect(() => correction.readLeanRemainingAcceptedDiagnosticLineageV9(f.capturedPurpose())).toThrow("CUSTODY")
      expect(() => correction.readLeanRemainingRequestV9(f.paths.request, "diagnostic", f.mode)).toThrow("SPENT_DESTINATION")
      virtual.present.delete(resolve(path))
    }
    for (const path of [lean.leanCorrectionRoutePaths("baseline", "v9-1").store, lean.leanCorrectionRoutePaths("baseline", "v9-3").allocation, lean.leanCorrectionRoutePaths("diagnostic", "v9-3").store]) {
      virtual.present.add(resolve(path)); f.evidence.mockClear()
      expect(() => retained.authenticateLeanSupervisorDiagnosticCheck(f.mode)).toThrow("SPENT_DESTINATION")
      expect(f.evidence).not.toHaveBeenCalled(); virtual.present.delete(resolve(path))
    }
    expect(() => correction.readLeanRemainingAcceptedDiagnosticLineageV9({ mode: f.mode })).toThrow("CUSTODY")
    for (const patch of [{ accepted: false }, { attemptOrdinal: 3 }, { sourceRoot: labRoot("wrong", {}) }, { allocationRoot: labRoot("wrong", {}) }]) {
      const { root: _r, ...body } = { ...f.check, ...patch }; put(join(f.paths.store, f.paths.check), { ...body, root: labRoot(body.schemaVersion, body) })
      f.evidence.mockClear(); expect(() => retained.authenticateLeanSupervisorDiagnosticCheck(f.mode)).toThrow(); expect(f.evidence).not.toHaveBeenCalled()
    }
    put(join(f.paths.store, f.paths.check), f.check); f.time.closed.delete("correction-supervisor-diagnostic-v8-reader-close")
    expect(() => retained.authenticateLeanSupervisorDiagnosticCheck(f.mode)).toThrow("ACCEPTED_READER_CLOSURE")
  }, 30_000)
})

/** Fully virtual v10 request/check/authorization/setup/report identities. The old
 * accepted allocation/entry/terminal/time supply inert metadata shapes only. */
const fixtureV10 = () => {
  const mode = "v10-1" as const, b = envelopeV10(), paths = lean.leanCorrectionRoutePaths("diagnostic", mode), docs = correction.leanRemainingDocumentsV9("diagnostic", mode), old = lean.leanCorrectionRoutePaths("diagnostic", "v9-2")
  const originalLedger = lean.openLeanLedger(old.store), originalEntry = lean.readLeanChildEntry(originalLedger), originalTerminal = lean.readLeanChildTerminal(originalLedger), oldTime = lean.readLeanTimeAccounting(originalLedger)
  const sourceRoot = correction.leanCorrectionSourceManifest(mode, b).root, setup = correction.createLeanRemainingSetupWitnessV9(mode, b.startedAtMs + 1), delta = b.startedAtMs + 1000 - Math.max(...oldTime.closes.values())
  const time = { ...oldTime, elapsedMs: b.priorElapsedMs + 1000, closedElapsedMs: b.priorElapsedMs + 1000, starts: new Map([...oldTime.starts].map(([id, at]) => [id, at + delta])), closes: new Map([...oldTime.closes].map(([id, at]) => [id, at + delta])), closed: new Set(oldTime.closed) }
  const putAt = (path: string, value: unknown, anchor = old.request) => { virtual.anchors.set(resolve(path), resolve(anchor)); put(path, value) }
  const putText = (path: string, bytes: Buffer) => { virtual.anchors.set(resolve(path), resolve(correction.leanRemainingDocumentsV9("diagnostic", "v9-2").dataReview)); virtual.bytes.set(resolve(path), bytes) }
  putAt(docs.setup, setup, lean.leanRetrySetupPath("v9-2"))
  const review = Buffer.from(`---\nstatus: clean\nsource_root: ${sourceRoot}\nsource_commit: ${"1".repeat(40)}\nindependently_reviewed: true\nauthor_agent: /root/execute_265_twenty_six\nreviewer_agent: /root/review_v10\n---\n`)
  const request = correction.createLeanRemainingRequestDraftV9(mode, "diagnostic", { sourceRoot, reviewRoot: lean.leanBytesRoot(review), dataReviewRoot: r("temporary-data"), setupAccountingRoot: setup.root, reuseGrantRoot: r("virtual-reuse"), authorizationRoot: r("temporary-auth"), priorClosureRoot: null, continuationRoot: null, acceptedCheckRoot: null, acceptedReaderCloseRoot: null })
  const dataRoot = correction.leanCorrectionRequestDataRoot(request), data = Buffer.from(review.toString().replace("---\nstatus", `---\nrequest_root: ${dataRoot}\nstatus`))
  const authBody = { schemaVersion: "lean-retry-execution-authorization-v8", timeboxExtension: b, approved: true, executionAuthorized: true, route: "diagnostic", attemptOrdinal: 1, sourceRoot, approvalRoot: b.approvalRoot, planRoot: b.planRoot, policyRoot: b.root, requestDataRoot: dataRoot, authorAgent: "/root", reviewerAgent: "/root/review_v10" }, authorization = { ...authBody, root: labRoot(authBody.schemaVersion, authBody) }
  const finalRequest = { ...request, dataReviewRoot: lean.leanBytesRoot(data), authorizationRoot: lean.leanBytesRoot(lean.leanCanonicalBytes(authorization)) }
  putText(docs.review, review); putText(docs.dataReview, data); putAt(docs.authorization, authorization); putAt(paths.request, finalRequest)
  const allocation = lean.createLeanSupervisorCorrectionAllocation({ ...inputV10(), sourceRoot, reviewRoot: finalRequest.reviewRoot, coldRoot: finalRequest.coldRoot, seed: finalRequest.seed, candidateRoots: finalRequest.candidateRoots, requestRoots: finalRequest.requestRoots, reuseGrantRoot: finalRequest.reuseGrantRoot, requestBytesRoot: lean.leanBytesRoot(lean.leanCanonicalBytes(finalRequest)), dataReviewRoot: finalRequest.dataReviewRoot, setupAccountingRoot: setup.root }, 8)
  const ledger = { directory: resolve(paths.store), allocation }, entry = { ...originalEntry, sourceRoot, allocationRoot: allocation.root, requestBytesRoot: allocation.requestBytesRoot! }, terminal = { ...originalTerminal, sourceRoot, allocationRoot: allocation.root, entryBytesRoot: lean.leanBytesRoot(lean.leanCanonicalBytes(entry)) }
  const { root: _runStartRoot, ...runStartBody } = JSON.parse(fs.readFileSync(join(old.temp, "admission-run-start.json"), "utf8")), runStart = { ...runStartBody, attemptOrdinal: 1, wallStartMs: runStartBody.wallStartMs + delta }, runStartValue = { ...runStart, root: labRoot(runStart.schemaVersion, runStart) }
  const { root: _runCloseRoot, ...runCloseBody } = JSON.parse(fs.readFileSync(join(old.temp, "admission-run-close.json"), "utf8")), runClose = { ...runCloseBody, attemptOrdinal: 1, startRoot: runStartValue.root, allocationRoot: allocation.root, wallObservedMs: runCloseBody.wallObservedMs + delta, ledgerCloseMs: runCloseBody.ledgerCloseMs + delta }
  putAt(join(paths.temp, "admission-run-start.json"), runStartValue, join(old.temp, "admission-run-start.json")); putAt(join(paths.temp, "admission-run-close.json"), { ...runClose, root: labRoot(runClose.schemaVersion, runClose) }, join(old.temp, "admission-run-close.json"))
  const checkBody = { schemaVersion: "lean-correction-supervisor-retained-v8", attemptOrdinal: 1, accepted: true, route: "diagnostic", allocationRoot: allocation.root, sourceRoot, head: entry.head, requestBytesRoot: entry.requestBytesRoot, readerInterval: "correction-supervisor-diagnostic-v8-verifier", readerStartMs: time.starts.get("correction-supervisor-diagnostic-v8-verifier")!, readerObservedMs: time.closes.get("correction-supervisor-diagnostic-v8-verifier")! }, check = { ...checkBody, root: labRoot(checkBody.schemaVersion, checkBody) }
  putAt(join(paths.store, paths.check), check, join(old.store, old.check))
  const open = lean.openLeanLedger, readTime = lean.readLeanTimeAccounting, readEntry = lean.readLeanChildEntry, readTerminal = lean.readLeanChildTerminal, readState = lean.readLeanLedger
  vi.spyOn(lean, "openLeanLedger").mockImplementation(path => resolve(path) === resolve(paths.store) ? ledger : open(path))
  vi.spyOn(lean, "readLeanTimeAccounting").mockImplementation(value => value === ledger ? time : readTime(value))
  vi.spyOn(lean, "readLeanChildEntry").mockImplementation(value => value === ledger ? entry : readEntry(value))
  vi.spyOn(lean, "readLeanChildTerminal").mockImplementation(value => value === ledger ? terminal : readTerminal(value))
  vi.spyOn(lean, "readLeanLedger").mockImplementation(value => value === ledger ? { stopped: false, charges: new Map(), charged: 32 } as never : readState(value))
  vi.spyOn(reuseIO, "authenticateLeanColdReuse").mockReturnValue({ grant: { root: finalRequest.reuseGrantRoot } } as never)
  const evidence = vi.spyOn(lean, "verifyLeanEvidence").mockReturnValue({} as never), lineage = correction.readLeanRemainingAcceptedDiagnosticLineageV9
  let captured: unknown
  vi.spyOn(correction, "readLeanRemainingAcceptedDiagnosticLineageV9").mockImplementation(purpose => { captured = purpose; return lineage(purpose) })
  vi.spyOn(Date, "now").mockReturnValue(b.startedAtMs + 1001)
  return { mode, paths, docs, time, check, evidence, captured: () => captured }
}
describe("composed v10 accepted lineage with strict fresh admission", () => {
  it("composes actual request/predecessor custody for own-baseline lifecycle and revokes purpose", () => {
    const f = fixtureV10(), baseline = lean.leanCorrectionRoutePaths("baseline", f.mode)
    for (const path of [join(baseline.temp, "admission-prepare-start.json"), baseline.allocation, baseline.store, join(baseline.temp, "admission-run-start.json"), join(baseline.store, "child-terminal.json"), join(baseline.store, "result.json")]) {
      virtual.present.add(resolve(path)); f.evidence.mockClear()
      expect(() => retained.authenticateLeanSupervisorDiagnosticCheck(f.mode)).toThrow("ACCEPTED_CHARGE")
      expect(f.evidence).toHaveBeenCalledOnce()
      expect(() => retained.readLeanRemainingAcceptedLineagePurposeV9(f.captured())).toThrow("CUSTODY")
      expect(() => correction.readLeanRemainingAcceptedDiagnosticLineageV9(f.captured())).toThrow("CUSTODY")
      expect(() => correction.readLeanRemainingRequestV9(f.paths.request, "diagnostic", f.mode)).toThrow()
      expect(() => correction.inspectLeanRemainingPredecessorV9("diagnostic", envelopeV10().startedAtMs + 1001, f.mode)).toThrow("SPENT_DESTINATION")
      virtual.present.delete(resolve(path))
    }
    for (const path of [lean.leanCorrectionRoutePaths("baseline", "v9-3").store, ".strategy-lab/lean-correction-supervisor-baseline-20261007-v10-2", ".strategy-lab/lean-correction-supervisor-diagnostic-20261007-v10-3"]) {
      virtual.present.add(resolve(path)); f.evidence.mockClear(); expect(() => retained.authenticateLeanSupervisorDiagnosticCheck(f.mode)).toThrow(); expect(f.evidence).not.toHaveBeenCalled(); virtual.present.delete(resolve(path))
    }
    expect(() => correction.readLeanRemainingAcceptedDiagnosticLineageV9({ mode: "v10-1" })).toThrow("CUSTODY")
    for (const patch of [{ accepted: false }, { attemptOrdinal: 2 }, { sourceRoot: r("old-source") }, { allocationRoot: r("wrong-allocation") }]) {
      const { root: _root, ...body } = { ...f.check, ...patch }; put(join(f.paths.store, f.paths.check), { ...body, root: labRoot(body.schemaVersion, body) }); f.evidence.mockClear()
      expect(() => retained.authenticateLeanSupervisorDiagnosticCheck(f.mode)).toThrow(); expect(f.evidence).not.toHaveBeenCalled()
    }
    put(join(f.paths.store, f.paths.check), f.check); f.time.closed.delete("correction-supervisor-diagnostic-v8-reader-close")
    expect(() => retained.authenticateLeanSupervisorDiagnosticCheck(f.mode)).toThrow("ACCEPTED_READER_CLOSURE")
  }, 30_000)
})
