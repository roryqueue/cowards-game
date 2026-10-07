/** Inert prospective metadata only; no historical reader/provider/Strategy/Match. */
import { afterEach, describe, expect, it, vi } from "vitest"
import * as fs from "node:fs"
import { join, resolve } from "node:path"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import * as contracts from "../../packages/strategy-lab/src/contracts.js"
import * as lean from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as correction from "../run-v1-38-lean-correction.js"
import * as retained from "./v1-38-lean-correction-retained.js"
import * as parent from "../run-v1-38-lean-baseline.js"
import { assertLeanRetryBaselineJoinV8 } from "./v1-38-lean-baseline-retained.js"
vi.mock("node:fs", async original => ({ ...await original<typeof import("node:fs")>() }))
afterEach(() => vi.restoreAllMocks())

const r = (label: string) => labRoot("bookkeeping-continuation-fixture", label)
const binding = () => lean.LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION
const input = (route: "diagnostic" | "baseline" = "diagnostic", ordinal: 1 | 2 | 3 = 2, charged = route === "diagnostic" ? 30 : 31) => {
  const p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: charged, elapsedUpperBoundMs: 62_024_083, allocatedDiskBytes: 12_894_208, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r("history"), survivors: [{ identity: ".strategy-lab/inert-continuation-survivor", allocatedBytes: 4096 }] }
  return { sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: lean.LEAN_RETRY_V8_PLAN_ROOT, supervisorDecisionRoot: lean.LEAN_RETRY_V8_APPROVAL_ROOT, candidateRoots: [r("a"), r("b")], requestRoots: Array.from({ length: route === "baseline" ? 36 : 1 }, (_, i) => r(`request-${i}`)), seed: "inert-continuation", route, reuseGrantRoot: r("reuse"), acceptedCheckRoot: route === "diagnostic" ? null : r("new-accepted"), requestBytesRoot: r("bytes"), dataReviewRoot: r("data"), setupAccountingRoot: r("setup"), predecessor: { ...p, root: labRoot(p.schemaVersion, p) }, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, attemptOrdinal: ordinal, priorClosureRoot: binding()?.diagnosticClosureRoot, continuationRoot: r("continuation"), acceptedReaderCloseRoot: route === "diagnostic" ? null : r("new-final"), timeboxExtension: binding() }
}
const custody = () => ({ allocationRoot: binding().baselineAllocationRoot, sourceRoot: binding().baselineSourceRoot, head: binding().baselineHead, rawRoots: binding().baselineRawRoots, charged: 30, currentCharges: 0, currentTerminals: 0, active: false, resultExists: false, checkExists: false, terminalStatus: "child_failed", exitCode: null, signal: "SIGKILL", closedIntervals: ["correction-preparation", "pilot-entry", "correction-run-finalization"], intervalTimes: [1791330138520, 1791330177618, 1791330177618, 1791330306049, 1791330306049, 1791330306250] })

const reviewDirectory = ".planning/phases/265-serious-current-rules-league-and-development-red-team/"
const historicalReviews = [
  { identity: `${reviewDirectory}NEW265-16-TWENTY-HOUR-BASELINE-DATA-REVIEW-v1.md`, allocatedBytes: 4096 },
  { identity: `${reviewDirectory}NEW265-16-TWENTY-HOUR-DIAGNOSTIC-1-DATA-REVIEW-v1.md`, allocatedBytes: 8192 },
  { identity: `${reviewDirectory}NEW265-16-TWENTY-HOUR-REVIEW-v1.md`, allocatedBytes: 8192 },
]
const survivorInput = (patch: Partial<lean.LeanCorrectionPredecessor> = {}) => {
  const base = input(), { root: _root, ...p } = base.predecessor
  // Inert identities: reproduce the observed367-row/14864384-byte envelope,
  // not a claim that the historical private store was reconstructed or read.
  const survivors = [...Array.from({ length: 364 }, (_, i) => ({ identity: `.strategy-lab/inert-path-survivor-${i}`, allocatedBytes: i === 0 ? 13_357_056 : 4096 })), ...historicalReviews.map(row => ({ ...row }))]
  const body = { ...p, elapsedUpperBoundMs: 63_896_581, allocatedDiskBytes: 14_864_384, survivors, ...patch }
  return { ...base, predecessor: { ...body, root: labRoot(body.schemaVersion, body) } }
}
describe("exact bookkeeping historical review survivor paths", () => {
  it("real v8 constructor and admission retain every original row/root/counter and full debit", () => {
    const f = survivorInput(), a = lean.createLeanSupervisorCorrectionAllocation(f, 8)
    expect(a.predecessor).toEqual(f.predecessor)
    expect(a.predecessor.survivors).toHaveLength(367)
    expect(a.predecessor).toMatchObject({ chargedMatches: 30, elapsedUpperBoundMs: 63_896_581, allocatedDiskBytes: 14_864_384 })
    expect(a.predecessor.survivors.reduce((sum, row) => sum + row.allocatedBytes, 0)).toBe(14_864_384)
    for (const row of historicalReviews) expect(a.predecessor.survivors).toContainEqual(row)
    expect(lean.admitLeanAllocation(a)).toEqual(a)
    expect(lean.leanCapsForAllocation(lean.admitLeanAllocation(a))).toEqual(lean.LEAN_RETRY_V8_TIMEBOX_CAPS)
  })
  it("legacy v7 and old v8 bindings keep rejecting phase review paths", () => {
    const f = survivorInput(), { attemptOrdinal: _ordinal, priorClosureRoot: _prior, continuationRoot: _continuation, acceptedReaderCloseRoot: _close, timeboxExtension: _extension, ...common } = f
    const { root: _root, ...prior } = f.predecessor
    const p7 = { ...prior, chargedMatches: 28, elapsedUpperBoundMs: 49_150_573 }
    expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...common, planRoot: lean.LEAN_REPLAY_V7_SUPPLEMENT_ROOT, supervisorDecisionRoot: lean.LEAN_REPLAY_V7_APPROVAL_ROOT, predecessor: { ...p7, root: labRoot(p7.schemaVersion, p7) } }, 7)).toThrow("SUPERVISOR_PREDECESSOR")
    const p8 = { ...prior, chargedMatches: 29, elapsedUpperBoundMs: 56_000_917 }
    expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...f, attemptOrdinal: 1, priorClosureRoot: null, continuationRoot: null, timeboxExtension: lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION, predecessor: { ...p8, root: labRoot(p8.schemaVersion, p8) } }, 8)).toThrow("SUPERVISOR_PREDECESSOR")
  })
  it.each([
    { identity: `${reviewDirectory}UNRELATED-review.md`, allocatedBytes: 4096 },
    { identity: `${reviewDirectory}../NEW265-16-TWENTY-HOUR-REVIEW-v1.md`, allocatedBytes: 8192 },
    { identity: historicalReviews[0]!.identity, allocatedBytes: -1 },
    { identity: historicalReviews[0]!.identity, allocatedBytes: 1.5 },
    { identity: historicalReviews[0]!.identity, allocatedBytes: Number.MAX_SAFE_INTEGER + 1 },
    { identity: historicalReviews[0]!.identity, allocatedBytes: 4096, extra: true },
    { identity: 17, allocatedBytes: 4096 },
  ])("refuses unapproved or malformed original row %j before filtering", row => {
    const f = survivorInput(), survivors = [...f.predecessor.survivors.slice(0, -3), row, ...historicalReviews.slice(1)]
    expect(() => lean.createLeanSupervisorCorrectionAllocation(survivorInput({ survivors } as never), 8)).toThrow()
  })
  it("refuses duplicate reviews and aggregate hidden review bytes over the full budget", () => {
    const f = survivorInput()
    expect(() => lean.createLeanSupervisorCorrectionAllocation(survivorInput({ survivors: [...f.predecessor.survivors, historicalReviews[0]!] }), 8)).toThrow()
    expect(() => lean.createLeanSupervisorCorrectionAllocation(survivorInput({ allocatedDiskBytes: 14_864_383 }), 8)).toThrow()
  })
})

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
  it("does not re-add human idle from the old prefix but keeps fresh closure floors", () => {
    const b = binding(), now = b.startedAtMs + 100
    expect(lean.leanRetryClosedPrefixFloorV8(59_338_914, 1791329532163, now, 1, b)).toBe(62_024_183)
    expect(lean.leanRetryClosedPrefixFloorV8(62_030_000, b.startedAtMs + 50, now, 2, b)).toBe(62_030_050)
    const old = lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION
    expect(lean.leanRetryClosedPrefixFloorV8(59_338_914, 1791329532163, now, 1, old)).toBe(59_338_914 + now - 1791329532163)
  })
  it("keeps baseline2 own accepted FINAL gate and refuses historical diagnostic1", () => {
    const a = lean.createLeanSupervisorCorrectionAllocation(input("baseline"), 8), check = { root: a.acceptedCheckRoot!, allocationRoot: r("new-diagnostic-allocation"), readerCloseMs: binding().startedAtMs + 500 }
    const closure = { timeboxExtension: binding(), attemptOrdinal: 2, closureClass: "accepted", finalReaderClose: true, acceptedCheckAbsent: false, checkRoot: check.root, allocationRoot: check.allocationRoot, root: a.acceptedReaderCloseRoot!, readerCloseMs: check.readerCloseMs, sourceRoot: a.sourceRoot, head: "1".repeat(40) }
    expect(() => assertLeanRetryBaselineJoinV8(a, check, closure, "2".repeat(40))).not.toThrow()
    for (const patch of [{ attemptOrdinal: 1, root: binding().diagnosticClosureRoot }, { closureClass: "refused" }, { finalReaderClose: false }, { acceptedCheckAbsent: true }, { checkRoot: binding().diagnosticCheckRoot }, { sourceRoot: r("old-source") }]) expect(() => assertLeanRetryBaselineJoinV8(a, check, { ...closure, ...patch }, "2".repeat(40))).toThrow()
  })
  it("keeps the existing next-Match reserve under the unchanged ceiling", () => {
    const a = lean.createLeanSupervisorCorrectionAllocation(input(), 8)
    expect(() => correction.assertLeanCorrectionResources({ elapsedMs: 70_140_000, charged: 30, physicalBytes: 12_894_208, childRss: 1, parentRss: 1, freeBytes: lean.LEAN_CAPS.totalBytes, availableMemoryBytes: 2_000_000_000 }, a)).toThrow()
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
  it("joins finite helper bytes/terminal/time without invoking an old accepted reader", () => {
    const b = binding(), dp = lean.leanCorrectionRoutePaths("diagnostic", "v8-1"), bp = lean.leanCorrectionRoutePaths("baseline", "v8-1")
    const old = { schemaVersion: "lean-retry-closure-v8", privacy: "private_offline", attemptOrdinal: 1, closureClass: "accepted", authorizing: false, finalReaderClose: true, acceptedCheckAbsent: false, checkRoot: b.diagnosticCheckRoot, cumulativeCharged: 30, currentCharges: 1, closedElapsedMs: 59_338_914, readerCloseMs: 1791329532163, timeboxExtension: lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION, timeBytesRoot: r("old-time"), ledgerBytesRoot: r("old-ledger"), entryBytesRoot: r("old-entry"), terminalBytesRoot: r("old-terminal"), requestBytesRoot: r("old-request"), root: b.diagnosticClosureRoot }
    const allocation = { schemaVersion: "lean-correction-supervisor-baseline-allocation-v8", attemptOrdinal: 1, route: "baseline", root: b.baselineAllocationRoot, sourceRoot: b.baselineSourceRoot, timeboxExtension: lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION, requestBytesRoot: b.baselineRawRoots.request, acceptedReaderCloseRoot: old.root, acceptedCheckRoot: old.checkRoot }
    const entry = { allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot: allocation.requestBytesRoot, head: b.baselineHead, parentPid: 100, childPid: 101 }
    const terminal = { ...entry, entryBytesRoot: b.baselineRawRoots["entry.json"], status: "child_failed", exitCode: null, signal: "SIGKILL" }
    const reason = { ...terminal }
    const intervals = custody().closedIntervals, times = custody().intervalTimes
    const time = { active: false, closed: new Set(intervals), starts: new Map(intervals.map((id, i) => [id, times[i * 2]])), closes: new Map(intervals.map((id, i) => [id, times[i * 2 + 1]])) }
    const state = { charged: 30, charges: new Map(), terminals: new Map() }
    const request = { authorizationPath: ".strategy-lab/inert-old-auth", setupAccountingPath: ".strategy-lab/inert-old-setup", reviewPath: ".planning/inert-old-review", dataReviewPath: ".planning/inert-old-data-review" }
    const diagnosticRequest = { ...request, authorizationPath: ".strategy-lab/inert-old-diagnostic-auth", dataReviewPath: ".planning/inert-old-diagnostic-data-review" }
    const files = new Map<string, Uint8Array>(), pins = new Map<string, string>()
    const put = (path: string, bytes: Uint8Array, pin: string) => { files.set(path, bytes); pins.set(Buffer.from(bytes).toString("utf8"), pin) }
    put(join(dp.store, "retry-closure-v8.json"), lean.leanCanonicalBytes(old), b.diagnosticClosureBytesRoot)
    for (const [name, pin] of [["time.ndjson", old.timeBytesRoot], ["ledger.ndjson", old.ledgerBytesRoot], ["entry.json", old.entryBytesRoot], ["child-terminal.json", old.terminalBytesRoot], ["request", old.requestBytesRoot]]) put(name === "request" ? dp.request : join(dp.store, name), name === "request" ? lean.leanCanonicalBytes(diagnosticRequest) : Buffer.from(`inert-diagnostic-${name}`), pin!)
    for (const [name, pin] of Object.entries(b.baselineRawRoots)) put(name === "request" ? bp.request : join(bp.store, name), name === "request" ? lean.leanCanonicalBytes(request) : Buffer.from(`inert-baseline-${name}`), pin)
    files.set(bp.allocation, files.get(join(bp.store, "allocation.json"))!)
    const hash = lean.leanBytesRoot, root = contracts.labRoot
    vi.spyOn(lean, "leanBytesRoot").mockImplementation(bytes => (pins.get(Buffer.from(bytes).toString("utf8")) ?? hash(bytes)) as ReturnType<typeof hash>)
    vi.spyOn(contracts, "labRoot").mockImplementation((domain, value) => domain === "lean-retry-closure-v8" ? b.diagnosticClosureRoot : root(domain, value))
    vi.spyOn(correction, "readLeanCorrectionPrivateBytes").mockImplementation(path => { const bytes = files.get(path); if (!bytes) throw new Error("INERT_MISSING_METADATA"); return bytes })
    vi.spyOn(correction, "readLeanCorrectionJson").mockReturnValue(request)
    vi.spyOn(lean, "openLeanLedger").mockReturnValue({ directory: bp.store, allocation } as never)
    vi.spyOn(lean, "admitLeanAllocation").mockReturnValue(allocation as never)
    vi.spyOn(lean, "readLeanChildEntry").mockReturnValue(entry as never)
    vi.spyOn(lean, "readLeanChildTerminal").mockReturnValue(terminal as never)
    vi.spyOn(lean, "readLeanTimeAccounting").mockReturnValue(time as never)
    vi.spyOn(lean, "readLeanLedger").mockReturnValue(state as never)
    vi.spyOn(parent, "validateLeanSupervisorReasonBytes").mockReturnValue(reason as never)
    let resultExists = false
    vi.spyOn(fs, "existsSync").mockImplementation(path => String(path).endsWith("result.json") ? resultExists : String(path).endsWith(bp.check) ? false : true)
    vi.spyOn(retained, "authenticateLeanRetryClosureV8").mockImplementation(() => { throw new Error("OLD_READER_FORBIDDEN") })
    vi.spyOn(retained, "authenticateLeanSupervisorDiagnosticCheck").mockImplementation(() => { throw new Error("OLD_READER_FORBIDDEN") })
    const authenticated = retained.authenticateLeanBookkeepingPredecessorV8()
    expect(authenticated.baseline.charged).toBe(30)
    expect(authenticated.baseline.currentCharges).toBe(0)
    expect(authenticated.identities).toContain(bp.store)
    expect(authenticated.identities).toContain(bp.temp)
    expect(authenticated.identities).toContain(request.authorizationPath)
    for (const path of [...Object.values(request), ...Object.values(diagnosticRequest)]) expect(authenticated.identities).toContain(path)
    // Same inode identities shared by the two requests debit once. The two
    // diagnostic-only admin survivors debit an additional4096+8192 bytes.
    const unique = [...new Set(authenticated.identities)], inodes = new Map(unique.map((path, i) => [resolve(path), i + 1]))
    vi.spyOn(fs, "realpathSync").mockImplementation(path => resolve(String(path)))
    vi.spyOn(fs, "lstatSync").mockImplementation(path => ({ uid: process.getuid?.(), dev: 1, ino: inodes.get(String(path)), nlink: 1, blocks: String(path) === resolve(diagnosticRequest.dataReviewPath) ? 16 : 8, size: 1, mtimeMs: 1, ctimeMs: 1, isSymbolicLink: () => false, isFile: () => true, isDirectory: () => false }) as never)
    const survivors = correction.inventoryLeanSupervisorSurvivors(unique)
    expect(survivors.reduce((sum, s) => sum + s.allocatedBytes, 0)).toBe(32_768 + 12_288)
    expect(survivors.filter(s => s.identity === request.setupAccountingPath)).toHaveLength(1)
    expect(survivors.find(s => s.identity === diagnosticRequest.authorizationPath)?.allocatedBytes).toBe(4096)
    expect(survivors.find(s => s.identity === diagnosticRequest.dataReviewPath)?.allocatedBytes).toBe(8192)
    time.active = true; expect(() => retained.authenticateLeanBookkeepingPredecessorV8()).toThrow(); time.active = false
    state.charges.set("inert", {}); expect(() => retained.authenticateLeanBookkeepingPredecessorV8()).toThrow(); state.charges.clear()
    resultExists = true; expect(() => retained.authenticateLeanBookkeepingPredecessorV8()).toThrow(); resultExists = false
    entry.head = "0".repeat(40); expect(() => retained.authenticateLeanBookkeepingPredecessorV8()).toThrow(); entry.head = b.baselineHead
    files.set(join(bp.store, "ledger.ndjson"), Buffer.from("changed")); expect(() => retained.authenticateLeanBookkeepingPredecessorV8()).toThrow()
    files.delete(join(bp.store, "ledger.ndjson")); expect(() => retained.authenticateLeanBookkeepingPredecessorV8()).toThrow()
  })
  it.each([{ charged: 29 }, { currentCharges: 1 }, { currentTerminals: 1 }, { active: true }, { resultExists: true }, { checkExists: true }, { terminalStatus: "child_exited" }, { signal: null }, { head: "0".repeat(40) }, { allocationRoot: r("other") }, { closedIntervals: ["pilot-entry"] }, { intervalTimes: [] }, { rawRoots: {} }])("refuses unsafe failed-baseline custody %j", patch => {
    expect(() => lean.validateLeanBookkeepingBaselineCustodyV8({ ...custody(), ...patch })).toThrow()
  })
})
