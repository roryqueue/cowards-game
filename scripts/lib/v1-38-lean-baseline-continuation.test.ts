/** Inert continuation contracts; never touches canonical empirical paths. */
import { describe, expect, it, vi } from "vitest"
import { mkdtempSync, writeFileSync, symlinkSync, rmSync, realpathSync } from "node:fs"
import * as childProcess from "node:child_process"
import * as fs from "node:fs"
import { resolve } from "node:path"
import * as baseline from "../run-v1-38-lean-baseline.js"
import { readLeanBaselineContinuationGit } from "./v1-38-lean-container-match-session.js"
import { createHash } from "node:crypto"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import * as ledger from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as continuation from "./v1-38-lean-baseline-continuation.js"

vi.mock("node:child_process", async importOriginal => ({ ...await importOriginal<typeof import("node:child_process")>(), execFileSync: vi.fn() }))
vi.mock("node:fs", async original => ({ ...await original<typeof import("node:fs")>(), lstatSync: vi.fn((await original<typeof import("node:fs")>()).lstatSync) }))

describe("complete fresh identity guard", () => {
  it("merges normalized paths within one call, retaining both roles and every other identity", () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "continuation-guard-")))
    try {
      const path = join(dir, "pin"), other = join(dir, "other")
      writeFileSync(path, "pin"); writeFileSync(other, "other")
      const row = (path: string): continuation.LeanContinuationInventoryRow => { const s = fs.lstatSync(path); return { path, kind: s.isDirectory() ? "directory" : "file", bytes: s.size, allocatedBytes: s.blocks * 512, dev: s.dev, ino: s.ino, mode: s.mode & 0o777, mtimeMs: s.mtimeMs, ctimeMs: s.ctimeMs, rawRoot: null } }
      const pin = { path, stat: fs.lstatSync(path) }, survivor = row(path)
      const guard = continuation.createLeanContinuationIdentityGuard([pin], [{ ...survivor, path: `${dir}/./pin` }, row(other), row(dir)])
      vi.mocked(fs.lstatSync).mockClear()
      guard(); expect(vi.mocked(fs.lstatSync).mock.calls.map(c => c[0])).toEqual([path, other, dir].map(p => resolve(p)))
      guard(); expect(fs.lstatSync).toHaveBeenCalledTimes(6)
      const incompatible = continuation.createLeanContinuationIdentityGuard([pin], [{ ...survivor, allocatedBytes: survivor.allocatedBytes + 512 }])
      expect(incompatible).toThrow(/SURVIVOR_CHANGED/)
      writeFileSync(other, "other grows")
      expect(guard).toThrow(/SURVIVOR_CHANGED/)
      writeFileSync(path, "PIN")
      expect(guard).toThrow(/PIN_CHANGED/)
    } finally { rmSync(dir, { recursive: true }) }
  })
  it("reobserves directory membership and replacement on the next callback", () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "continuation-directory-")))
    try {
      const s = fs.lstatSync(dir)
      const row: continuation.LeanContinuationInventoryRow = { path: dir, kind: "directory", bytes: s.size, allocatedBytes: s.blocks * 512, dev: s.dev, ino: s.ino, mode: s.mode & 0o777, mtimeMs: s.mtimeMs, ctimeMs: s.ctimeMs, rawRoot: null }
      const guard = continuation.createLeanContinuationIdentityGuard([], [row])
      guard(); writeFileSync(join(dir, "new"), "new"); expect(guard).toThrow(/SURVIVOR_CHANGED/)
    } finally { rmSync(dir, { recursive: true }) }
  })
})

const r = (value: unknown) => labRoot("inert-continuation-fixture", value)
export const continuationWindowFixtureV2 = () => {
  const body = { schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const, grantId: "synthetic-unit-grant", approvalEvidence: { humanDecisionId: "synthetic-unit-decision", recordedBy: "synthetic-root" }, approvedAtMs: 1791820000000, anchorMs: 1791820000000, deadlineMs: 1791848800000, carryMs: 472058903, capMs: 500858903, durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace: "20261012-v3" as const, reviewedSourceHead: "a".repeat(40), sourceRoot: r("source"), sourceGateRoot: r("source-gate"), planRoot: r("plan"), runOperator: "synthetic-runner", readerOperator: "synthetic-reader" }
  return { ...body, root: labRoot(body.schemaVersion, body) }
}
export const continuationAllocationFixtureV2 = () => {
  const window = continuationWindowFixtureV2()
  const body = { schemaVersion: "lean-baseline-continuation-carry-v2" as const, chargedMatches: 50 as const, elapsedUpperBoundMs: 465187899, allocatedDiskBytes: 88924160, residualDiskBytes: 4096, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, originalCarryRoot: r("original-carry"), closedCapsuleRoot: r("closed-capsule"), custodyRoot: r("custody"), inventoryRoot: r("inventory"), qualifiedReaderAuthority: "cost_only" as const }
  return ledger.createLeanBaselineContinuationAllocationV2({ sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: r("plan"), candidateRoots: [r("a"), r("b")], requestRoots: Array.from({ length: 36 }, (_, n) => r(n)), seed: "inert-continuation-v2", sourceHead: "b".repeat(40), planningRoot: r("planning"), manifestRoot: r("manifest"), requestBytesRoot: r("request"), window, windowBytesRoot: ledger.leanBytesRoot(ledger.leanCanonicalBytes(window)), sourceGateRoot: window.sourceGateRoot, dataReviewRoot: r("data-review"), predecessor: { ...body, root: labRoot(body.schemaVersion, body) } })
}
describe("[continuation-v2] pure policy and ledger admission", () => {
  it("preserves the V1 window and constructor while admitting a distinct fifty-cost schema", () => {
    const old = continuationAllocationFixture(), bytes = ledger.leanCanonicalBytes(old)
    const a = continuationAllocationFixtureV2()
    expect(ledger.admitLeanAllocation(a)).toEqual(a)
    expect(a.predecessor.chargedMatches).toBe(50)
    expect(a.slots).toHaveLength(36); expect(a.holdoutReservations).toHaveLength(4)
    expect(ledger.leanCapsForAllocation(a).elapsedMs).toBe(a.window.capMs)
    expect(ledger.leanMemoryLimitForAllocation(a)).toBe(3000000000)
    expect(ledger.leanWritablePaths(a)).toEqual([ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.temp, ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.allocation, ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.request, ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.window])
    expect(ledger.leanCanonicalBytes(continuationAllocationFixture())).toEqual(bytes)
    expect(old.predecessor.chargedMatches).toBe(43)
    expect(ledger.LEAN_BASELINE_CONTINUATION_WINDOW).toEqual({ anchorMs: 1791807317000, deadlineMs: 1791836117000, carryMs: 459375903, capMs: 488175903, reserveMs: 1860000, memoryBytes: 3000000000 })
  })
  it("refuses pending, extra-key, wrong-namespace and recomputed arithmetic claims", () => {
    const w = continuationWindowFixtureV2()
    for (const changes of [{ status: "pending" }, { routeNamespace: "20261012-v2" }, { carryMs: 465187899 }, { deadlineMs: w.deadlineMs + 1 }, { durationMs: 1 }, { approvedAtMs: w.anchorMs - 1 }, { capMs: Number.MAX_SAFE_INTEGER }, { readerOperator: w.runOperator }, { extra: true }]) {
      const { root: _, ...body } = { ...w, ...changes }
      expect(() => ledger.validateLeanBaselineContinuationWindowV2({ ...body, root: labRoot(body.schemaVersion, body) })).toThrow()
    }
    expect(() => ledger.validateLeanBaselineContinuationWindowV2(undefined)).toThrow()
  })
  it.each([43, 49, 51])("rejects rerooted prior count %i", chargedMatches => {
    const a = continuationAllocationFixtureV2(), { root: _, ...body } = { ...a.predecessor, chargedMatches }
    expect(() => ledger.validateLeanBaselineContinuationAllocationV2({ ...a, predecessor: { ...body, root: labRoot(body.schemaVersion, body) } })).toThrow()
  })
  it("requires the complete frontier and preserves global, grant and monotonic floors", () => {
    const a = continuationAllocationFixtureV2(), w = a.window
    const s = { nowMs: w.anchorMs + 1000, monotonicElapsedMs: 2000, remainingSlots: 36, charged: 50, retainedBytes: 88924160, scratchBytes: 0, parentRssBytes: 100000000, childRssBytes: 0, arrayBuffersBytes: 0, availableMemoryBytes: 4000000000, freeBytes: 16000000000, live: true }
    expect(continuation.assertLeanBaselineContinuationFrontierV2(a, s)).toBe(w.carryMs + 2000)
    for (const changes of [{ remainingSlots: 37 }, { charged: 49 }, { nowMs: w.deadlineMs - 1 }, { remainingClosureMs: 0 }, { freeBytes: 0 }, { live: false }]) expect(() => continuation.assertLeanBaselineContinuationFrontierV2(a, { ...s, ...changes })).toThrow()
    const required = ["nowMs", "monotonicElapsedMs", "remainingSlots", "charged", "retainedBytes", "scratchBytes", "parentRssBytes", "childRssBytes", "arrayBuffersBytes", "availableMemoryBytes", "freeBytes", "live"] as const
    for (const key of required) { const incomplete = { ...s } as Record<string, unknown>; delete incomplete[key]; expect(() => continuation.assertLeanBaselineContinuationFrontierV2(a, incomplete as never)).toThrow(/V2_FRONTIER/) }
    expect(() => continuation.assertLeanBaselineContinuationFrontierV2(a, { ...s, extra: 1 } as never)).toThrow(/V2_FRONTIER/)
    expect(() => continuation.assertLeanBaselineContinuationFrontierV2(a, { ...s, remainingClosureMs: 10 } as never)).toThrow(/V2_FRONTIER/)
  })
  it("reserves bounded descriptor bytes before allocation and reobserves mutations", () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "continuation-v2-inert-"))), path = join(dir, "fixture.json")
    try {
      writeFileSync(path, "{}", { mode: 0o600 })
      const guard = vi.fn((additional?: number) => { if (additional) throw new Error("reservation-denied") })
      expect(() => continuation.readLeanContinuationBoundedBytesV2(path, 65536, 0o600, guard)).toThrow("reservation-denied")
      expect(guard).toHaveBeenCalledWith(2)
      expect(continuation.readLeanContinuationBoundedBytesV2(path, 65536, 0o600, () => {}).toString()).toBe("{}")
      let calls = 0
      expect(() => continuation.readLeanContinuationBoundedBytesV2(path, 65536, 0o600, () => { if (++calls === 3) writeFileSync(path, "[]") })).toThrow(/CHANGED/)
    } finally { rmSync(dir, { recursive: true }) }
  })
})
describe("[continuation-v2] exact reviewed transitions and bounded metadata", () => {
  const old: continuation.LeanContinuationInventoryRow = { path: "scripts/unit.ts", kind: "file", bytes: 10, allocatedBytes: 4096, dev: 1, ino: 2, mode: 0o644, mtimeMs: 1, ctimeMs: 1, rawRoot: r("old") }
  const reviewed: continuation.LeanContinuationReviewedRowV2 = { path: old.path, root: r("reviewed"), commit: "a".repeat(40), kind: "reviewed_source" }
  it("admits only exact reviewed bytes with preserved debit; consumed v2 stays in inventory", () => {
    const current = { ...old, ino: 3, bytes: 20, mtimeMs: 2, ctimeMs: 2, rawRoot: reviewed.root }
    expect(() => continuation.reconcileLeanContinuationInventoryV2([old], [current], [reviewed])).not.toThrow()
    for (const change of [{ rawRoot: r("unreviewed") }, { allocatedBytes: 0 }, { mode: 0o600 }]) expect(() => continuation.reconcileLeanContinuationInventoryV2([old], [{ ...current, ...change }], [reviewed])).toThrow()
    expect(() => continuation.reconcileLeanContinuationInventoryV2([old], [], [reviewed])).toThrow()
    expect(() => continuation.reconcileLeanContinuationInventoryV2([old], [current, current], [reviewed])).toThrow()
    const consumed = { ...old, path: `${ledger.LEAN_BASELINE_CONTINUATION_PATHS.store}/result.json` }
    expect(() => continuation.reconcileLeanContinuationInventoryV2([consumed], [consumed], [])).not.toThrow()
    expect(() => continuation.reconcileLeanContinuationInventoryV2([consumed], [{ ...consumed, ino: 8 }], [])).toThrow(/IMMUTABLE/)
    expect(() => continuation.reconcileLeanContinuationInventoryV2([consumed], [], [])).toThrow()
    expect(() => continuation.reconcileLeanContinuationInventoryV2([], [{ ...old, path: ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.request }], [])).toThrow()
  })
  it("bounds ancestor membership instead of exempting directories", () => {
    const directory: continuation.LeanContinuationInventoryRow = { ...old, path: "scripts", kind: "directory", ino: 5, rawRoot: null }
    const current = { ...old, rawRoot: reviewed.root }
    expect(() => continuation.reconcileLeanContinuationInventoryV2([directory, old], [{ ...directory, mtimeMs: 2, members: ["unit.ts"] }, current], [reviewed])).not.toThrow()
    expect(() => continuation.reconcileLeanContinuationInventoryV2([directory, old], [{ ...directory, mtimeMs: 2, members: ["unit.ts", "unknown"] }, current], [reviewed])).toThrow(/MEMBERS/)
  })
  it("does not cache exact Git scope or mutable HEAD observations", async () => {
    const { readLeanBaselineContinuationGitV2, enableLeanContinuationExecutorOriginsV2 } = await import("./v1-38-lean-container-match-session.js")
    const exec = vi.mocked(childProcess.execFileSync).mockReturnValue(Buffer.from(`${"b".repeat(40)}\n`)), manifest = [{ path: "scripts/unit.ts", root: r("unit") }]
    try {
      readLeanBaselineContinuationGitV2(["rev-parse", "HEAD"], manifest)
      readLeanBaselineContinuationGitV2(["rev-parse", "HEAD"], manifest)
      expect(exec).toHaveBeenCalledTimes(2)
      expect(() => readLeanBaselineContinuationGitV2(["show", `${"a".repeat(40)}:scripts/unit.ts`], [])).toThrow()
      for (const args of [["status"], ["show", "HEAD:scripts/unit.ts"], ["show", `${"a".repeat(40)}:scripts/other.ts`], ["merge-base", "--is-ancestor", "HEAD", "a".repeat(40)]]) expect(() => readLeanBaselineContinuationGitV2(args, manifest)).toThrow()
      expect(() => enableLeanContinuationExecutorOriginsV2({} as never, continuationAllocationFixtureV2())).toThrow()
    } finally { exec.mockReset() }
  })
})
describe("[continuation-v2] closed seven-charge cost capsule", () => {
  const rooted = (body: Record<string, any>, domain = body.schemaVersion): any => { const { root: _, ...value } = body; return { ...value, root: labRoot(domain, value) } }
  const capsule = () => {
    const original = continuationAllocationFixture(), inventory: unknown[] = [], custody = { inert: true }
    const predecessor = rooted({ ...original.predecessor, inventoryRoot: labRoot("lean-baseline-continuation-inventory-v1", inventory), custodyRoot: labRoot("lean-baseline-continuation-custody-v1", custody) })
    const a = rooted({ ...original, predecessor }) as ledger.LeanBaselineContinuationAllocation
    const events: Record<string, any>[] = [], charges: Record<string, any>[] = [], terminals: Record<string, any>[] = []
    for (let ordinal = 0; ordinal < 7; ordinal++) {
      const slot = a.slots[ordinal]!, charge = rooted({ schemaVersion: "lean-slot-charge-v1", allocationRoot: a.root, slotRoot: slot.root, ordinal })
      const terminal = { kind: "terminal", chargeRoot: charge.root, record: { classification: ordinal === 6 ? "system_failure" : "success", code: ordinal === 6 ? "SUPERVISOR_FAILURE" : "OK", cleanupComplete: true, outcome: ordinal === 6 ? null : "DRAW" }, replay: null }
      charges.push(charge); terminals.push(terminal); events.push({ kind: "charge", charge }, terminal)
    }
    events.push({ kind: "stop", reason: "failure" })
    const evidenceRecords = a.slots.map((slot, i) => ({ slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: charges[i]?.root ?? null, terminal: terminals[i] ?? null, status: charges[i] ? terminals[i]!.record.classification : "unused" }))
    const evidenceRoot = labRoot("lean-evidence-v1", { allocationRoot: a.root, events, records: evidenceRecords }), unusedOrdinals = Array.from({ length: 29 }, (_, i) => i + 7), head = "b".repeat(40)
    const pipeline = rooted({ schemaVersion: "lean-baseline-continuation-pipeline-v1", unusedOrdinals })
    const entry = { allocationRoot: a.root, sourceRoot: a.sourceRoot, requestBytesRoot: a.requestBytesRoot, head, parentPid: 1, childPid: 2, wallStartMs: a.window.anchorMs + 200 }
    const terminal = { allocationRoot: a.root, sourceRoot: a.sourceRoot, head, entryBytesRoot: ledger.leanBytesRoot(ledger.leanCanonicalBytes(entry)), parentPid: 1, childPid: 2, status: "child_exited", exitCode: 0, signal: null, elapsedUpperBoundMs: 100, wallObservedMs: a.window.anchorMs + 300, physicalBytes: 88924160 }
    const parent = rooted({ schemaVersion: "lean-parent-supervisor-reasons-v1", allocationRoot: a.root, head, entryBytesRoot: terminal.entryBytesRoot, parentPid: 1, childPid: 2, exitCode: 0, signal: null, uncertain: false })
    const result = { schemaVersion: "lean-baseline-continuation-result-v1", allocationRoot: a.root, sourceRoot: a.sourceRoot, planningRoot: a.planningRoot, requestBytesRoot: a.requestBytesRoot, head, charged: 50, successful: 6, failure: null, status: "partial_or_failed_baseline", holdoutOpened: false, formationMaterialized: false, sourceAuthor: "author", runOperator: "runner", evidenceRoot, pipeline, unusedOrdinals, holdoutReservations: a.holdoutReservations, elapsedMs: 465187800 }
    const report = rooted({ schemaVersion: "lean-baseline-continuation-retained-v1", allocationRoot: a.root, head, charged: 50, currentCharged: 7, successful: 6, complete: false, evidenceRoot, pipelineRoot: pipeline.root, sourceAuthor: "author", runOperator: "runner", unusedOrdinals })
    const check = rooted({ schemaVersion: "lean-baseline-continuation-retained-check-v1", allocationRoot: a.root, disposition: "gaps_found", failure: null, sourceHoldFailure: null, report, charged: 50, currentCharged: 7, unusedOrdinals, elapsedMs: 465187899, physicalBytes: 88924160 })
    const intervals = ["continuation-run-admission", "pilot-entry", "continuation-retained-verifier"].flatMap((id, i) => [{ kind: "start", id, atMs: a.window.anchorMs + i * 200 }, { kind: "close", id, atMs: a.window.anchorMs + i * 200 + 100 }])
    return { a, value: { carry: { carry: predecessor, inventory, custody }, result, check, entry, terminal, parent, events, intervals } }
  }
  it("joins all fifty cost charges without promoting the old gaps or reconstructing a replay", () => {
    const f = capsule()
    expect(continuation.validateLeanContinuationClosedCapsuleV2(f.a, f.value)).toEqual({ elapsedMs: 465187899, allocatedDiskBytes: 88924160 })
  })
  it("denies extra terminals, reordered or open time, promoted checks and changed event roots", () => {
    for (const change of [(v: any) => v.events.push(v.events[1]), (v: any) => v.events.splice(1, 1), (v: any) => v.intervals.pop(), (v: any) => v.intervals.reverse(), (v: any) => { v.check = rooted({ ...v.check, disposition: "passed" }) }, (v: any) => { v.events[1].record.outcome = "top" }, (v: any) => { v.entry.head = "c".repeat(40) }, (v: any) => { v.carry.inventory.push({ path: "forged" }) }]) {
      const f = capsule(); change(f.value); expect(() => continuation.validateLeanContinuationClosedCapsuleV2(f.a, f.value)).toThrow()
    }
  })
})
export const continuationAllocationFixture = () => {
  const predecessorBody = { schemaVersion: "lean-baseline-continuation-carry-v1" as const, chargedMatches: 43 as const, elapsedUpperBoundMs: 459375903 as const, allocatedDiskBytes: 4096, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, custodyRoot: r("custody"), inventoryRoot: r("inventory"), qualifiedReaderAuthority: "cost_only" as const }
  return ledger.createLeanBaselineContinuationAllocation({ sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: r("plan"), candidateRoots: [r("a"), r("b")], requestRoots: Array.from({ length: 36 }, (_, n) => r(n)), seed: "inert-continuation", sourceHead: "a".repeat(40), planningRoot: r("planning"), requestBytesRoot: r("request"), offlineOverheadMs: 60000, predecessor: { ...predecessorBody, root: labRoot(predecessorBody.schemaVersion, predecessorBody) } })
}

describe("prospective baseline continuation allocation", () => {
  it("reads private cost fixtures only with exact 0600 permissions", () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "continuation-private-cost-")))
    try {
      const bytes = Buffer.from(ledger.leanCanonicalBytes({ schemaVersion: "inert-private-cost-v1" }))
      const privatePath = join(dir, "private-cost.json"), publicPath = join(dir, "public-cost.json")
      writeFileSync(privatePath, bytes, { mode: 0o600 })
      writeFileSync(publicPath, bytes, { mode: 0o644 })
      expect(continuation.readLeanContinuationBytes(privatePath, 262144, continuation.LEAN_CONTINUATION_PRIVATE_COST_MODE)).toEqual(bytes)
      expect(() => continuation.readLeanContinuationBytes(publicPath, 262144, continuation.LEAN_CONTINUATION_PRIVATE_COST_MODE)).toThrow(/LEAN_BASELINE_CONTINUATION_FILE/)
    } finally { rmSync(dir, { recursive: true }) }
  })
  it("preserves the authenticated debit and adds each survivor increment once", () => {
    const prior = { allocatedDiskBytes: 20000, survivors: [{ identity: "old", allocatedBytes: 4096 }] }
    expect(continuation.reconcileLeanContinuationDiskDebit(prior, [{ path: "old", allocatedBytes: 4096 }])).toBe(20000)
    expect(continuation.reconcileLeanContinuationDiskDebit(prior, [{ path: "old", allocatedBytes: 8192 }, { path: "new", allocatedBytes: 4096 }])).toBe(28192)
    for (const rows of [[], [{ path: "old", allocatedBytes: 2048 }], [{ path: "old", allocatedBytes: 4096 }, { path: "old", allocatedBytes: 4096 }]]) expect(() => continuation.reconcileLeanContinuationDiskDebit(prior, rows)).toThrow(/OLD_COST/)
  })
  it("requires the closed unique run admission before entry, preserving the legacy empty journal", () => {
    const time = { active: false, starts: new Map([["continuation-run-admission", 1]]), closed: new Set(["continuation-run-admission"]) }
    expect(ledger.admitsLeanBaselineContinuationPreEntryTime(time)).toBe(true)
    expect(ledger.admitsLeanPreEntryTime(false, time)).toBe(false)
    for (const invalid of [{ ...time, active: true }, { ...time, closed: new Set<string>() }, { ...time, starts: new Map<string, number>() }, { ...time, starts: new Map([...time.starts, ["pilot-entry", 2]]) }]) expect(ledger.admitsLeanBaselineContinuationPreEntryTime(invalid)).toBe(false)
  })
  it("refuses non-direct parents and mismatched committed custody bytes", () => {
    const commit = "a".repeat(40), source = "b".repeat(40), bytes = Buffer.from("inert")
    expect(() => continuation.assertLeanContinuationDirectParent(commit, source, [commit, source], bytes, bytes)).not.toThrow()
    for (const parents of [[source, commit], [commit, source, "c".repeat(40)], [commit, "c".repeat(40)]]) expect(() => continuation.assertLeanContinuationDirectParent(commit, source, parents, bytes, bytes)).toThrow()
    expect(() => continuation.assertLeanContinuationDirectParent(commit, source, [commit, source], bytes, Buffer.from("changed"))).toThrow()
  })
  it("bounded reads deny oversized, aliased and sealed data before opening", () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "continuation-inert-")))
    try {
      const path = join(dir, "record.json")
      writeFileSync(path, "{}", { mode: 0o600 }); symlinkSync(path, join(dir, "alias.json"))
      expect(continuation.readLeanContinuationBytes(path, 2, 0o600).toString()).toBe("{}")
      expect(() => continuation.readLeanContinuationBytes(path, 1)).toThrow()
      expect(() => continuation.readLeanContinuationBytes(join(dir, "alias.json"), 2)).toThrow()
      expect(() => continuation.readLeanContinuationBytes(join(dir, "PREIMAGE"), 2)).toThrow(/READ_SCOPE/)
    } finally { rmSync(dir, { recursive: true }) }
  })
  it("binds 36 canonical cells, four unopened reservations, 43 carried charges and its own window", () => {
    const a = continuationAllocationFixture()
    expect(ledger.admitLeanAllocation(a)).toEqual(a)
    expect(a.slots).toHaveLength(36)
    expect(a.holdoutReservations).toHaveLength(4)
    expect(a.predecessor.chargedMatches).toBe(43)
    expect(ledger.leanCapsForAllocation(a).elapsedMs).toBe(488175903)
    expect(ledger.LEAN_CAPS.elapsedMs).toBe(28800000)
    expect(ledger.leanMemoryLimitForAllocation(a)).toBe(3000000000)
    expect(ledger.leanWritablePaths(a)).toContain(continuation.LEAN_BASELINE_CONTINUATION_PATHS.request)
  })
  it.each([42, 44])("rejects %i carried charges, including re-rooted claims", chargedMatches => {
    const a = continuationAllocationFixture(), p = { ...a.predecessor, chargedMatches }
    const { root: _root, ...body } = p
    expect(() => ledger.validateLeanBaselineContinuationAllocation({ ...a, predecessor: { ...body, root: labRoot(body.schemaVersion, body) } })).toThrow()
  })
  it("rejects missing reservations, extra cells, cost-only promotion and old caps", () => {
    const a = continuationAllocationFixture()
    for (const changes of [{ holdoutReservations: [] }, { slots: [...a.slots, a.slots[0]] }, { caps: ledger.LEAN_CAPS }, { predecessor: { ...a.predecessor, qualifiedReaderAuthority: "accepted" } }]) expect(() => ledger.validateLeanBaselineContinuationAllocation({ ...a, ...changes })).toThrow()
  })
  it("requires all remaining maximum durations, closure and offline overhead, without a clock rollback", () => {
    const a = continuationAllocationFixture(), w = ledger.LEAN_BASELINE_CONTINUATION_WINDOW
    const sample = { nowMs: w.anchorMs + 1000, monotonicElapsedMs: 1000, remainingSlots: 36, charged: 43, retainedBytes: 4096, scratchBytes: 0, parentRssBytes: 100000000, childRssBytes: 100000000, arrayBuffersBytes: 1000, availableMemoryBytes: 4000000000, freeBytes: 16000000000, live: true }
    expect(continuation.assertLeanBaselineContinuationFrontier(a, sample)).toBe(459376903)
    expect(continuation.assertLeanBaselineContinuationFrontier(a, { ...sample, remainingSlots: 0, charged: 44 })).toBe(459376903)
    // Closure consumes its already reserved budget instead of reserving a new
    // 31 minutes at every reader checkpoint near the hard stop.
    expect(continuation.assertLeanBaselineContinuationFrontier(a, { ...sample, nowMs: w.deadlineMs - 1000, monotonicElapsedMs: w.deadlineMs - w.anchorMs - 1000, remainingSlots: 0, charged: 79, remainingClosureMs: 500, remainingOfflineMs: 0 })).toBe(w.capMs - 1000)
    expect(() => continuation.assertLeanBaselineContinuationFrontier(a, { ...sample, remainingSlots: 36, remainingClosureMs: 0 })).toThrow()
    expect(() => continuation.assertLeanBaselineContinuationFrontier(a, { ...sample, nowMs: w.deadlineMs - 36 * 600000 - w.reserveMs })).toThrow()
    expect(() => continuation.assertLeanBaselineContinuationFrontier(a, { ...sample, nowMs: w.anchorMs - 1 })).toThrow()
    expect(() => continuation.assertLeanBaselineContinuationFrontier(a, { ...sample, remainingSlots: 37 })).toThrow()
    for (const changes of [{ live: false }, { freeBytes: 1 }, { availableMemoryBytes: 0 }, { parentRssBytes: 3000000000 }, { retainedBytes: 12000000001 }, { scratchBytes: 2000000001 }, { charged: 42 }]) expect(() => continuation.assertLeanBaselineContinuationFrontier(a, { ...sample, ...changes })).toThrow()
  })
})


describe("bounded pinned source authentication", () => {
  it("streams >4MiB through bounded OID metadata and denies raw/OID/ref/file changes", () => {
    const dir = mkdtempSync(".continuation-inert-"), path = `${dir}/source.json`, bytes = Buffer.alloc(4194305, 97), head = "a".repeat(40)
    const root = ledger.leanBytesRoot(bytes), oid = createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex")
    const calls: string[][] = []
    const git = (args: readonly string[]) => { calls.push([...args]); return Buffer.from(`${oid}\n`) }
    try {
      writeFileSync(path, bytes)
      let checks = 0
      const run = (raw = root, read = git, revision = head, guard = () => { checks++ }) => continuation.authenticateLeanContinuationPinnedSource({ path, root: raw }, revision, [path], read, guard)
      run(); expect(calls).toEqual([["rev-parse", `${head}:${path}`]]); expect(checks).toBeGreaterThan(64)
      expect(() => run(r("wrong"))).toThrow(/SOURCE/)
      expect(() => run(root, () => Buffer.from("b".repeat(40)))).toThrow(/SOURCE/)
      for (const output of ["x".repeat(40), "a".repeat(129), `${oid} extra`, `${oid}\n\n`]) expect(() => run(root, () => Buffer.from(output))).toThrow(/OID/)
      for (const ref of ["HEAD", "a".repeat(39), `${head}:other`]) expect(() => run(root, git, ref)).toThrow(/SCOPE/)
      expect(() => continuation.authenticateLeanContinuationPinnedSource({ path, root }, head, [], git, () => {})).toThrow(/SCOPE/)
      for (const bad of ["../source", "secret.json", "preimage.json"]) expect(() => continuation.authenticateLeanContinuationPinnedSource({ path: bad, root }, head, [bad], git, () => {})).toThrow(/SCOPE/)
      let n = 0
      expect(() => run(root, git, head, () => { if (++n === 5) writeFileSync(path, bytes) })).toThrow(/CHANGED/)
      writeFileSync(path, bytes)
      expect(() => run(root, git, head, () => { if (++n > 8) throw new Error("deadline") })).toThrow(/deadline/)
      writeFileSync(path, "small")
      const small = ledger.leanBytesRoot(Buffer.from("small"))
      continuation.authenticateLeanContinuationPinnedSource({ path, root: small }, head, [path], args => { expect(args).toEqual(["show", `${head}:${path}`]); return Buffer.from("small") }, () => {})
    } finally { rmSync(dir, { recursive: true }) }
  })
})


describe("continuation OID metadata predicate", () => {
  it("only allows exact pinned paths and 40hex revisions with bounded valid output", () => {
    const path = "packages/inert-source.json", head = "a".repeat(40), oid = "b".repeat(40)
    const manifest = vi.spyOn(baseline, "leanBaselineContinuationSourceManifest").mockReturnValue({ entries: [{ path, root: r("source") }], implementationEntries: [], planningEntries: [], root: r("root"), planningRoot: r("planning"), manifestRoot: r("manifest") })
    const exec = vi.mocked(childProcess.execFileSync).mockReturnValue(Buffer.from(`${oid}\n`))
    try {
      expect(readLeanBaselineContinuationGit(["rev-parse", `${head}:${path}`]).toString()).toBe(`${oid}\n`)
      expect(exec).toHaveBeenCalledWith("git", ["rev-parse", `${head}:${path}`], { stdio: ["ignore", "pipe", "ignore"], timeout: 1500, maxBuffer: 128 })
      for (const target of [`HEAD:${path}`, `${head}:packages/other.json`, `${head}:packages/../inert-source.json`, `${head}:packages/secret.json`, `${head}:packages/preimage.json`]) {
        exec.mockClear(); expect(() => readLeanBaselineContinuationGit(["rev-parse", target])).toThrow(/GIT_METADATA/); expect(exec).not.toHaveBeenCalled()
      }
      for (const invalid of ["c".repeat(129), "no-oid", `${oid} extra`, `${oid}\n\n`]) { exec.mockReturnValue(Buffer.from(invalid)); expect(() => readLeanBaselineContinuationGit(["rev-parse", `${head}:${path}`])).toThrow(/GIT_METADATA/) }
    } finally { exec.mockReset(); manifest.mockRestore() }
  })
})


describe("[continuation-v2] no-refund closed-debit reconciliation", () => {
  const old = ledger.LEAN_BASELINE_CONTINUATION_PATHS
  const fixture = () => {
    const original = [{ path: "scripts/old-a.ts", allocatedBytes: 60 }, { path: "scripts/old-b.ts", allocatedBytes: 30 }]
    const current = [
      { path: "scripts/old-a.ts", allocatedBytes: 65 }, { path: "scripts/old-b.ts", allocatedBytes: 30 },
      { path: old.request, allocatedBytes: 8 }, { path: old.allocation, allocatedBytes: 8 },
      { path: old.store, allocatedBytes: 8 }, { path: `${old.store}/result.json`, allocatedBytes: 8 },
      { path: old.temp, allocatedBytes: 8 },
    ]
    return { original, current }
  }
  it("keeps original residual and closed excess, adds reviewed growth once, and excludes consumed-v2 overlap", () => {
    const { original, current } = fixture()
    const first = continuation.reconcileLeanContinuationV2DiskDebit(100, original, 150, current)
    expect(first).toMatchObject({ base: 150, consumedBytes: 40, originalGrowth: 5, newRows: 0, allocatedDiskBytes: 155, residualDiskBytes: 20 })
    const withNew = continuation.reconcileLeanContinuationV2DiskDebit(100, original, 150, [...current, { path: "scripts/reviewed-new.ts", allocatedBytes: 7 }])
    expect(withNew).toMatchObject({ allocatedDiskBytes: 162, residualDiskBytes: 20, newRows: 7 })
    expect(continuation.reconcileLeanContinuationV2DiskDebit(100, original, 120, current).allocatedDiskBytes).toBe(145)
  })
  it("denies shrink, missing or overlapping identities, duplicates, future-v3 scope, and arithmetic overflow", () => {
    const { original, current } = fixture()
    const rejected = [
      () => continuation.reconcileLeanContinuationV2DiskDebit(100, original, 150, current.slice(0, -1)),
      () => continuation.reconcileLeanContinuationV2DiskDebit(100, original, 150, current.map(row => row.path === "scripts/old-a.ts" ? { ...row, allocatedBytes: 59 } : row)),
      () => continuation.reconcileLeanContinuationV2DiskDebit(100, original, 150, [...current, current[0]!]),
      () => continuation.reconcileLeanContinuationV2DiskDebit(100, [...original, original[0]!], 150, current),
      () => continuation.reconcileLeanContinuationV2DiskDebit(100, original, 150, [...current, { path: ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.store, allocatedBytes: 1 }]),
      () => continuation.reconcileLeanContinuationV2DiskDebit(Number.MAX_SAFE_INTEGER, [{ path: "scripts/a.ts", allocatedBytes: Number.MAX_SAFE_INTEGER }], 1, [...current, { path: "scripts/a.ts", allocatedBytes: Number.MAX_SAFE_INTEGER }]),
    ]
    for (const run of rejected) expect(run).toThrow(/V2_DISK/)
  })
})

describe("authenticated historical cost scope", () => {
  const paths = [".planning/debug/supervisor-sampling-repair.md", ".planning/debug/v9-baseline-prepare.md"]
  it("accepts only the two exact historical debug identities", () => {
    for (const path of paths) expect(continuation.isLeanContinuationAuthenticatedCostPath(path)).toBe(true)
    for (const path of [".planning/debug/third.md", ".planning/debug", ".planning/debug/", ...paths.flatMap(path => [`/${path}`, `../${path}`, `${path}/extra`, path.replace("debug/", "debug/../debug/"), path.replace("debug/", "debug/./"), path.replace("debug/", "debug//")]), "unrelated/file.md", ".planning/STATE.md"])
      expect(continuation.isLeanContinuationAuthenticatedCostPath(path)).toBe(false)
  })
  it("preserves existing authenticated cost scope", () => {
    for (const path of ["package.json", "scripts/inert.ts", "packages/inert.ts", ".strategy-lab/sealed-inert/file", ".planning/artifacts/inert.json"])
      expect(continuation.isLeanContinuationAuthenticatedCostPath(path)).toBe(true)
    for (const path of ["scripts/../other", "/scripts/inert.ts"])
      expect(continuation.isLeanContinuationAuthenticatedCostPath(path)).toBe(false)
  })
  it("counts both survivors without refunding their existing debit", () => {
    const survivors = paths.map((identity, i) => ({ identity, allocatedBytes: [12288, 8192][i]! }))
    const prior = { allocatedDiskBytes: 24576, survivors }
    const current = survivors.map(row => ({ path: row.identity, allocatedBytes: row.allocatedBytes }))
    expect(continuation.reconcileLeanContinuationDiskDebit(prior, current)).toBe(24576)
    for (const rows of [current.slice(0, 1), current.map(row => ({ ...row, allocatedBytes: row.allocatedBytes - 4096 }))])
      expect(() => continuation.reconcileLeanContinuationDiskDebit(prior, rows)).toThrow(/OLD_COST/)
  })
})
