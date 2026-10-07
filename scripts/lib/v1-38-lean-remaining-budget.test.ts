/** Source-only synthetic v9 contracts. No historical reader or live dispatch. */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import * as lean from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as correction from "../run-v1-38-lean-correction.js"
import { assertLeanRetryBaselineJoinV8 } from "./v1-38-lean-baseline-retained.js"
import { validateLeanRemainingPreparationCustodyV9, LEAN_REMAINING_V9_PREPARATION_PINS, LEAN_REMAINING_V9_AUTHOR_REFUSAL_PINS, validateLeanRemainingAuthorRefusalCustodyV9, authenticateLeanRemainingClosedPrefixV9, leanRemainingAuthorRefusalAbsentPathsV9 } from "./v1-38-lean-correction-retained.js"

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
})
