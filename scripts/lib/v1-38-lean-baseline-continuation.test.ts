/** Inert continuation contracts; never touches canonical empirical paths. */
import { describe, expect, it, vi } from "vitest"
import { mkdtempSync, writeFileSync, symlinkSync, rmSync, realpathSync } from "node:fs"
import * as childProcess from "node:child_process"
import * as fs from "node:fs"
import { resolve } from "node:path"
import * as baseline from "../run-v1-38-lean-baseline.js"
import { readLeanBaselineContinuationGit } from "./v1-38-lean-container-match-session.js"
import { createHash } from "node:crypto"
import * as crypto from "node:crypto"
import * as host from "../run-v1-38-serious-league.js"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import * as ledger from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as continuation from "./v1-38-lean-baseline-continuation.js"

describe("continuation-boundary-v8-P", () => {
  it("continuation-boundary-v8-P-cost real disjoint sampler includes each public synthetic stat/member debit once and refuses aliases/shrink", () => {
    // Public finite observations only: no historical file is opened or read.
    const rows = new Map<string, { size: number; allocated: number; mode: number; members?: string[]; ino: number }>()
    const add = (path: string, size: number, allocated: number, mode = 0o600, members?: string[]) => rows.set(resolve(path), { size, allocated, mode, ...(members === undefined ? {} : { members }), ino: rows.size + 1 })
    for (const [p, sizes] of [[ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2, [935, 4041]], [ledger.LEAN_BASELINE_CONTINUATION_PATHS_V6, [929, 4047]]] as const) { add(p.window, sizes[0], 4096); add(p.request, sizes[1], 4096) }
    for (const [p, sizes] of [[ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4, [935, 4056, 17366, 746080, 146345, 208491, 1002]], [ledger.LEAN_BASELINE_CONTINUATION_PATHS_V5, [929, 4051, 17360, 749813, 146600, 208495, 1234]], [ledger.LEAN_BASELINE_CONTINUATION_PATHS_V7, [929, 4040, 17352, 754167, 146961, 208476, 1002]]] as const) {
      add(p.window, sizes[0], 4096); add(p.request, sizes[1], 4096); add(p.allocation, sizes[2], 20480, 0o644)
      for (const [name, size, allocated] of [["allocation.json", sizes[2], 20480], ["carry.json", sizes[3], Math.ceil(sizes[3] / 4096) * 4096], ["source-hold.json", sizes[4], Math.ceil(sizes[4] / 4096) * 4096], ["source-manifest.json", sizes[5], Math.ceil(sizes[5] / 4096) * 4096], ["ledger.ndjson", 0, 0], ["time.ndjson", 0, 0]] as const) add(join(p.store, name), size, allocated)
      add(p.claim, sizes[6], 4096); add(p.store, 0, 4096, 0o700, ["allocation.json", "carry.json", "ledger.ndjson", "source-hold.json", "source-manifest.json", "time.ndjson"]); add(p.temp, 0, 4096, 0o700, ["window-claim.json"])
    }
    const stat = vi.spyOn(fs, "lstatSync").mockImplementation((path => { const r = rows.get(String(path)); if (!r) throw new Error("UNEXPECTED_STAT"); return { size: r.size, blocks: r.allocated / 512, mode: r.mode, uid: process.getuid?.(), nlink: 1, dev: 1, ino: r.ino, isFile: () => !r.members, isDirectory: () => !!r.members, isSymbolicLink: () => false } as fs.Stats }) as typeof fs.lstatSync)
    const real = vi.spyOn(fs, "realpathSync").mockImplementation((path => String(path)) as typeof fs.realpathSync), members = vi.spyOn(fs, "readdirSync").mockImplementation((path => rows.get(String(path))!.members!.slice()) as typeof fs.readdirSync), open = vi.spyOn(fs, "openSync"), read = vi.spyOn(fs, "readFileSync")
    read.mockClear()
    try {
      const total = [...rows.values()].reduce((n, row) => n + row.allocated, 0), known = continuation.LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V8
      expect(continuation.measureLeanContinuationKnownDisjointBytesV8()).toBe(total - 1167360)
      expect(known + continuation.measureLeanContinuationKnownDisjointBytesV8()).toBe(88924160 + total)
      const target = rows.get(resolve(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V7.window))!, directory = rows.get(resolve(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V7.store))!
      target.allocated += 4096; directory.allocated += 8192
      expect(continuation.measureLeanContinuationKnownDisjointBytesV8()).toBe(total - 1167360 + 12288)
      target.allocated = 0; expect(() => continuation.measureLeanContinuationKnownDisjointBytesV8()).toThrow(/V8_KNOWN_COST/)
      target.allocated = 4096; target.ino = 1; expect(() => continuation.measureLeanContinuationKnownDisjointBytesV8()).toThrow(/V8_KNOWN_COST/)
      expect(open).not.toHaveBeenCalled(); expect(read).not.toHaveBeenCalled()
    } finally { for (const spy of [stat, real, members, open, read]) spy.mockRestore() }
  })
  it("selects only the approved prospective route and preserves the legacy floor", () => {
    const anchorMs = 1792093334001, { root: _, ...old } = continuationWindowFixtureV2()
    const body = { ...old, routeNamespace: "20261015-v8", approvedAtMs: 1792093334000, approvalEvidence: { ...old.approvalEvidence, humanDecisionId: "human-approval-observed-20261015T194214Z" }, anchorMs, carryMs: ledger.leanContinuationGlobalFloorV2(anchorMs), capMs: ledger.leanContinuationGlobalFloorV2(anchorMs) + 28800000, deadlineMs: anchorMs + 28800000 }
    const w = ledger.validateLeanBaselineContinuationWindowV2({ ...body, root: labRoot(body.schemaVersion, body) })
    expect(ledger.leanBaselineContinuationPathsForWindowV2(w)).toBe(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V8)
    expect(ledger.LEAN_BASELINE_CONTINUATION_POLICY_V2.physicalFloorBytes).toBe(88924160)
    expect(continuation.LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V8).toBe(90091520)
    for (const delta of [{ approvedAtMs: body.approvedAtMs + 1 }, { anchorMs: body.approvedAtMs - 1 }, { carryMs: body.carryMs + 1, capMs: body.capMs + 1 }, { approvalEvidence: { ...body.approvalEvidence, humanDecisionId: "wrong" } }]) {
      const changed = { ...body, ...delta }; expect(() => ledger.validateLeanBaselineContinuationWindowV2({ ...changed, root: labRoot(body.schemaVersion, changed) })).toThrow()
    }
  })
  it("pairs full boundaries but never invokes full current for interior reservations; denial is permanent", async () => {
    const context = Object.freeze({}), full = vi.fn(), reserve = vi.fn()
    const c = continuation.createLeanContinuationBoundaryControllerV8([], [], [], context, full, reserve)
    c.withStage(context, "source", () => { for (let i = 0; i < 100; i++) c.reserve(context, i) })
    expect(full).toHaveBeenCalledTimes(3); expect(reserve).toHaveBeenCalledTimes(100)
    await c.withStageAsync(context, "archive", async () => { c.reserve(context, 1); await Promise.resolve() })
    full.mockImplementationOnce(() => { throw new Error("denied") })
    expect(() => c.withStage(context, "charge", () => {})).toThrow()
    expect(() => c.reserve(context, 0)).toThrow()
  })
  it("rejects near-cap known costs before importer or allocation and keeps outstanding writes until measured", () => {
    const state = continuation.createLeanContinuationReservationAccountingV8(100, 10)
    expect(state.required(0, 0)).toBe(110)
    expect(state.reserve(20, 0)).toBe(130)
    expect(state.reserve(30, 0)).toBe(160)
    expect(state.required(0, 16)).toBe(160)
    expect(state.required(0, 50)).toBe(160)
    expect(state.required(0, 60)).toBe(170)
    expect(() => state.required(0, 59)).toThrow()
    const importer = vi.fn(), allocate = vi.fn(), known = continuation.LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V8
    expect(() => { const retained = continuation.createLeanContinuationReservationAccountingV8(known, 4096).reserve(100, 0); if (retained > 88924160 + 4096 + 100) throw new Error("capacity"); importer(); allocate() }).toThrow()
    expect(importer).not.toHaveBeenCalled(); expect(allocate).not.toHaveBeenCalled()
  })
  it.each(["source", "archive", "bootstrap", "prepare", "claim", "import", "charge", "dispatch", "post_match", "terminal", "reader", "publication"] as const)("permanently refuses %s closing without accepting its value", stage => {
    let calls = 0, effect = 0
    const context = Object.freeze({}), c = continuation.createLeanContinuationBoundaryControllerV8([], [], [], context, () => { if (++calls === 2) throw new Error("closing") }, () => {})
    expect(() => c.withStage(context, stage, () => ++effect)).toThrow("closing")
    expect(effect).toBe(1); expect(() => c.reserve(context, 0)).toThrow(); expect(() => c.withStage(context, "charge", () => ++effect)).toThrow(); expect(effect).toBe(1)
  })
  it("actual importer reservation refuses the known V8 debit before any allocation or historical file read", () => {
    const context = Object.freeze({}), allocate = vi.fn(), git = vi.fn(), diskLimit = 88924160 + 1167360 - 1
    const account = continuation.createLeanContinuationReservationAccountingV8(continuation.LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V8, 8192)
    const c = continuation.createLeanContinuationBoundaryControllerV8([], [], [], context, () => {}, bytes => { if (account.required(bytes, 0) > diskLimit) throw new Error("capacity") })
    const read = vi.spyOn(fs, "openSync")
    expect(() => continuation.authenticateLeanBaselineContinuationCarryV2(git, [], bytes => c.reserve(context, bytes ?? 0))).toThrow("capacity")
    expect(read).not.toHaveBeenCalled(); expect(git).not.toHaveBeenCalled(); expect(allocate).not.toHaveBeenCalled(); read.mockRestore()
  })
  it.each(["unknown", "disappearance"] as const)("measures real selected owned paths, refuses %s masked by growth without source or ledger parsing", mutation => {
    const anchorMs = 1792093334001, { root: _, ...old } = continuationWindowFixtureV2(), body = { ...old, routeNamespace: "20261015-v8", approvedAtMs: 1792093334000, approvalEvidence: { ...old.approvalEvidence, humanDecisionId: "human-approval-observed-20261015T194214Z" }, anchorMs, carryMs: ledger.leanContinuationGlobalFloorV2(anchorMs), capMs: ledger.leanContinuationGlobalFloorV2(anchorMs) + 28800000, deadlineMs: anchorMs + 28800000 }
    const w = ledger.validateLeanBaselineContinuationWindowV2({ ...body, root: labRoot(body.schemaVersion, body) }), p = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V8
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "boundary-v8-owned-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir)
    try {
      fs.mkdirSync(resolve(".strategy-lab"), { mode: 0o700 }); fs.mkdirSync(resolve(".planning/artifacts"), { recursive: true })
      fs.mkdirSync(resolve(p.store), { mode: 0o700 }); fs.mkdirSync(resolve(p.temp), { mode: 0o700 })
      writeFileSync(resolve(p.window), "window", { mode: 0o600 }); writeFileSync(resolve(p.request), "request", { mode: 0o600 })
      const observe = continuation.createLeanContinuationOwnedMeasurementV8(w), first = observe()
      writeFileSync(resolve(p.store, "ledger.ndjson"), "not parsed by measurement", { mode: 0o600 })
      expect(observe().retainedBytes).toBeGreaterThanOrEqual(first.retainedBytes)
      if (mutation === "disappearance") {
        writeFileSync(resolve(p.store, "initial-analysis.json"), Buffer.alloc(4096), { mode: 0o600 }); const before = observe()
        fs.unlinkSync(resolve(p.store, "initial-analysis.json"))
        writeFileSync(resolve(p.store, "current-analysis.json"), Buffer.alloc(16384), { mode: 0o600 })
        expect(fs.lstatSync(resolve(p.store, "current-analysis.json")).blocks * 512).toBeGreaterThan(4096)
        const reserve = vi.fn(), charge = vi.fn()
        expect(() => { const after = observe(); reserve(after.retainedBytes - before.retainedBytes); charge() }).toThrow(/OWNED_CHANGED/)
        expect(reserve).not.toHaveBeenCalled(); expect(charge).not.toHaveBeenCalled()
      } else {
        writeFileSync(resolve(p.store, "unknown.json"), "no", { mode: 0o600 })
        expect(observe).toThrow(/MEMBERS/)
      }
    } finally { cwd.mockRestore(); rmSync(dir, { recursive: true }) }
  })
})

describe("[continuation-ready-v7-L] delayed initialization policy (synthetic A only)", () => {
  const approval = 1792017187000, decision = "human-approval-observed-20261014T223307Z"
  const window = (anchor = approval + 12345, delta: Record<string, unknown> = {}) => {
    const { root: _, ...old } = continuationWindowFixtureV2(), carry = 459375903 + (anchor - 1791807317000)
    const body = { ...old, routeNamespace: "20261014-v7", approvalEvidence: { ...old.approvalEvidence, humanDecisionId: decision }, approvedAtMs: approval, anchorMs: anchor, carryMs: carry, capMs: carry + 28800000, deadlineMs: anchor + 28800000, ...delta }
    return { ...body, root: labRoot(body.schemaVersion, body) }
  }
  it.each([0, 1, 12345, 100000000])("accepts finite synthetic delay %i without minting actual A", delay => {
    const w = window(approval + delay), admitted = ledger.validateLeanBaselineContinuationWindowV2(w)
    expect(admitted).toEqual(w); expect(Object.isFrozen(admitted)).toBe(true)
    expect(ledger.leanBaselineContinuationElapsedFloorV2(admitted, admitted.anchorMs + 3)).toBe(admitted.carryMs + 3)
    expect(ledger.leanBaselineContinuationElapsedFloorV2(admitted, admitted.anchorMs + 3, 0, 17)).toBe(admitted.carryMs + 17)
    expect(() => ledger.leanBaselineContinuationElapsedFloorV2(admitted, admitted.anchorMs - 1)).toThrow(/CLOCK/)
  })
  it("joins exact frozen paths and admitted allocation policy without changing defaults", () => {
    const p = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V7, w = ledger.validateLeanBaselineContinuationWindowV2(window())
    expect(p).toEqual({ request: ".strategy-lab/lean-baseline-continuation-request-20261014-v7.json", allocation: ".planning/artifacts/v1.38-lean-baseline-continuation-allocation-20261014-v7.json", store: ".strategy-lab/lean-baseline-continuation-20261014-v7", temp: ".strategy-lab/lean-baseline-continuation-20261014-v7-tmp", window: ".strategy-lab/lean-baseline-continuation-window-20261014-v7.json", claim: ".strategy-lab/lean-baseline-continuation-20261014-v7-tmp/window-claim.json", gates: ledger.LEAN_BASELINE_CONTINUATION_PATHS.gates })
    expect(Object.isFrozen(p)).toBe(true); expect(ledger.leanBaselineContinuationPathsForRequestV2(p.request)).toBe(p); expect(ledger.leanBaselineContinuationPathsForWindowV2(w)).toBe(p)
    const prior = continuationAllocationFixtureV2(), { root: _, ...body } = { ...prior, window: w, windowBytesRoot: ledger.leanBytesRoot(ledger.leanCanonicalBytes(w)), caps: { ...prior.caps, elapsedMs: w.capMs } }
    const allocation = ledger.validateLeanBaselineContinuationAllocationV2({ ...body, root: labRoot(body.schemaVersion, body) })
    expect(ledger.leanWritablePaths(allocation)).toEqual([p.temp, p.allocation, p.request, p.window])
    expect(allocation.window.routeNamespace).toBe("20261014-v7")
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "ready-v7-policy-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir)
    try {
      const l = ledger.createLeanLedger(join(dir, "store"), allocation)
      expect(ledger.readLeanAdmittedContinuationAllocationV2(l)).toBe(l.allocation)
      vi.mocked(fs.lstatSync).mockClear(); ledger.cumulativeLeanPhysicalBytes(l)
      for (const path of [p.temp, p.allocation, p.request, p.window]) expect(vi.mocked(fs.lstatSync).mock.calls.map(([name]) => name)).toContain(resolve(path))
    } finally { cwd.mockRestore(); rmSync(dir, { recursive: true }) }
    expect(ledger.leanBaselineContinuationPathsForRequestV2(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.request)).toBe(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2)
    for (const path of [p.request + ".other", p.request + "/extra", p.request.replace("v7", "v8")]) expect(() => ledger.leanBaselineContinuationPathsForRequestV2(path)).toThrow()
  })
  it("denies changed decision, early A, overflow, coherent carry inflation and changed bounds", () => {
    const original = window(), deltas = [
      { approvedAtMs: approval + 1 }, { approvalEvidence: { ...original.approvalEvidence, humanDecisionId: decision + "-other" } },
      { carryMs: original.carryMs + 1, capMs: original.capMs + 1 }, { carryMs: original.carryMs - 1, capMs: original.capMs - 1 },
      { capMs: original.capMs + 1 }, { deadlineMs: original.deadlineMs + 1 }, { durationMs: 28800001 }, { closureMs: 1860001 }, { offlineOverheadMs: 600001 },
      { routeNamespace: "20261014-v8" }, { routeNamespace: "20261014-v7.other" }, { anchorMs: original.anchorMs + 0.5 },
    ]
    for (const delta of deltas) expect(() => ledger.validateLeanBaselineContinuationWindowV2(window(undefined, delta))).toThrow()
    expect(() => ledger.validateLeanBaselineContinuationWindowV2(window(approval - 1))).toThrow()
    expect(() => ledger.validateLeanBaselineContinuationWindowV2(window(Number.MAX_SAFE_INTEGER))).toThrow()
  })
  it("keeps V3-V5 equality and the exact V6 golden tuple", () => {
    for (const routeNamespace of ["20261012-v3", "20261012-v4", "20261013-v5"] as const) {
      const { root: _, ...old } = continuationWindowFixtureV2(), body = { ...old, routeNamespace }, good = { ...body, root: labRoot(body.schemaVersion, body) }
      expect(ledger.validateLeanBaselineContinuationWindowV2(good)).toEqual(good)
      const delayed = { ...body, anchorMs: body.anchorMs + 1, deadlineMs: body.deadlineMs + 1 }
      expect(() => ledger.validateLeanBaselineContinuationWindowV2({ ...delayed, root: labRoot(body.schemaVersion, delayed) })).toThrow()
    }
    const { root: _, ...old } = continuationWindowFixtureV2(), body = { ...old, routeNamespace: "20261014-v6" as const, approvedAtMs: 1792002607000, anchorMs: 1792002607000, carryMs: 654665903, capMs: 683465903, deadlineMs: 1792031407000 }
    expect(ledger.validateLeanBaselineContinuationWindowV2({ ...body, root: labRoot(body.schemaVersion, body) }).anchorMs).toBe(1792002607000)
    const shifted = { ...body, approvedAtMs: body.approvedAtMs + 1, anchorMs: body.anchorMs + 1, carryMs: body.carryMs + 1, capMs: body.capMs + 1, deadlineMs: body.deadlineMs + 1 }
    expect(() => ledger.validateLeanBaselineContinuationWindowV2({ ...shifted, root: labRoot(body.schemaVersion, shifted) })).toThrow()
  })
})

describe("[continuation-ready-v7-M] spent metadata refusals, never historical success", () => {
  const window = () => {
    const { root: _, ...old } = continuationWindowFixtureV2(), anchor = 1792017187001, carry = 459375903 + (anchor - 1791807317000)
    const body = { ...old, routeNamespace: "20261014-v7" as const, approvalEvidence: { ...old.approvalEvidence, humanDecisionId: "human-approval-observed-20261014T223307Z" }, approvedAtMs: 1792017187000, anchorMs: anchor, carryMs: carry, capMs: carry + 28800000, deadlineMs: anchor + 28800000 }
    return { ...body, root: labRoot(body.schemaVersion, body) }
  }
  const fixture = (run: (f: { dir: string; p: typeof ledger.LEAN_BASELINE_CONTINUATION_PATHS_V6; inventory: () => unknown; guard: ReturnType<typeof vi.fn> }) => void) => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "ready-v7-spent-denial-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir), p = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V6, guard = vi.fn()
    try {
      fs.mkdirSync(resolve(".strategy-lab")); fs.mkdirSync(resolve(".planning/artifacts"), { recursive: true })
      writeFileSync(resolve(p.window), Buffer.alloc(929, 65), { mode: 0o600 }); writeFileSync(resolve(p.request), Buffer.alloc(4047, 66), { mode: 0o600 })
      run({ dir, p, guard, inventory: () => continuation.inventoryLeanContinuationSurvivorsV2([], [], () => { throw new Error("UNEXPECTED_GIT") }, guard, window()) })
    } finally { cwd.mockRestore(); rmSync(dir, { recursive: true }) }
  }
  it("binds ONLY the two supplied raw roots/sizes; synthetic bytes actually refuse, no digest substitution", () => fixture(f => {
    const source = fs.readFileSync(resolve(import.meta.dirname, "v1-38-lean-baseline-continuation.ts"), "utf8"), anchors = source.match(/const spentV6Metadata = freezeLabValue\(\[([\s\S]*?)\n\]\)/u)?.[1]
    expect(anchors).toContain("bytes: 929"); expect(anchors).toContain("bytes: 4047")
    expect(anchors).toContain("sha256:1311fadb75d16b9e6eaa299f7e961034cc941ecbb8db4dbe28121724b98459ec")
    expect(anchors).toContain("sha256:0c9c7559f42a08901ede3627d257cdf0efcfd6a98e8893dbf5df4c7c52f4361d")
    expect(anchors?.match(/rawRoot:/gu)).toHaveLength(2)
    expect(() => f.inventory()).toThrow(/V6_SPENT_METADATA/); expect(f.guard).toHaveBeenCalledWith(929)
  }))
  it.each(["missing", "size", "mode", "symlink", "hardlink", "owner"] as const)("denies actual V6 %s before historical cost use", mutation => fixture(f => {
    const path = resolve(f.p.window), stat = vi.mocked(fs.lstatSync), actual = stat.getMockImplementation()!
    try {
      if (mutation === "missing") fs.unlinkSync(path)
      if (mutation === "size") writeFileSync(path, "short")
      if (mutation === "mode") fs.chmodSync(path, 0o644)
      if (mutation === "symlink" || mutation === "hardlink") { fs.renameSync(path, path + ".old"); if (mutation === "symlink") symlinkSync(path + ".old", path); else fs.linkSync(path + ".old", path) }
      if (mutation === "owner") stat.mockImplementation((...args) => { const s = actual(...args); return String(args[0]) === path ? Object.assign(Object.create(Object.getPrototypeOf(s)), s, { uid: Number(s!.uid) + 1 }) : s })
      expect(() => f.inventory()).toThrow(mutation === "missing" ? /ENOENT/ : mutation === "size" || mutation === "mode" ? /V6_SPENT_METADATA/ : /ALIAS/)
    } finally { stat.mockImplementation(actual) }
  }))
  it.each(["allocation", "store", "temp"] as const)("denies invented V6 %s", key => fixture(f => {
    if (key === "allocation") writeFileSync(resolve(f.p[key]), "{}"); else fs.mkdirSync(resolve(f.p[key]))
    expect(() => f.inventory()).toThrow(/V6_SPENT_ABSENCE/)
  }))
  it.each(["request", "window", "allocation", "store", "temp"] as const)("excludes selected future V7 %s from carried inventory", key => fixture(f => {
    const p = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V7
    const row = { path: p[key], kind: "file" as const, bytes: 1, allocatedBytes: 4096, dev: 1, ino: 1, mode: 0o600, mtimeMs: 1, ctimeMs: 1, rawRoot: r("future") }
    expect(() => continuation.reconcileLeanContinuationInventoryV2([], [row], [], window())).toThrow(/TRANSITION_SCOPE/)
    expect(() => continuation.reconcileLeanContinuationV2DiskDebit(0, [], 0, [row], window())).toThrow(/DISK_SCOPE/)
    expect(f.guard).not.toHaveBeenCalled()
  }))
  it("preserves all V3-V6 synthetic inventory identities and debit floor, without treating them as authenticated", () => {
    const old = ledger.LEAN_BASELINE_CONTINUATION_PATHS, paths = [ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2, ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4, ledger.LEAN_BASELINE_CONTINUATION_PATHS_V5, ledger.LEAN_BASELINE_CONTINUATION_PATHS_V6]
    const rows = paths.flatMap(p => [p.request, p.window]).map((path, i) => ({ path, kind: "file" as const, bytes: 1, allocatedBytes: 4096, dev: 1, ino: i + 1, mode: 0o600, mtimeMs: 1, ctimeMs: 1, rawRoot: r(path) }))
    expect(() => continuation.reconcileLeanContinuationInventoryV2(rows, rows, [], window())).not.toThrow()
    for (const changed of [rows.slice(1), rows.map((row, i) => i ? row : { ...row, allocatedBytes: 0 }), rows.map((row, i) => i ? row : { ...row, rawRoot: r("mutation") })]) expect(() => continuation.reconcileLeanContinuationInventoryV2(rows, changed, [], window())).toThrow()
    const consumed = [old.request, old.allocation, old.store, old.temp].map(path => ({ path, allocatedBytes: 4096 })), debit = continuation.reconcileLeanContinuationV2DiskDebit(49152, rows, 81920, [...rows, ...consumed], window())
    expect(debit.allocatedDiskBytes).toBe(81920); expect(debit.residualDiskBytes).toBe(32768)
    expect(() => continuation.reconcileLeanContinuationV2DiskDebit(49152, rows, 81920, [...rows, ...consumed, { path: ledger.LEAN_BASELINE_CONTINUATION_PATHS_V7.window, allocatedBytes: 4096 }], window())).toThrow(/SCOPE/)
  })
})

describe("[continuation-stage-cadence-G] invocation stages", () => {
  const fixture = () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "cadence-g-")))
    const archive = join(dir, "archive"), live = join(dir, "live")
    writeFileSync(archive, "archive"); writeFileSync(live, "live")
    const pins = [archive, live].map(path => ({ path, stat: fs.lstatSync(path) }))
    const context = Object.freeze({ head: "a".repeat(40) })
    const roles = [{ path: archive, role: "closed_history" }, { path: live, role: "active_input" }]
    return { dir, archive, live, pins, context, roles }
  }
  it("observes TWO union passes only at barriers and TWO live passes at every callback", () => {
    const f = fixture()
    try {
      const c = continuation.createLeanContinuationStageControllerV6(f.pins, [], f.roles, f.context, () => {})
      vi.mocked(fs.lstatSync).mockClear()
      c.withStage(f.context, "archive", () => { for (let i = 0; i < 3; i++) c.live(f.context, () => {}) })
      expect(vi.mocked(fs.lstatSync).mock.calls.filter(row => row[0] === f.archive)).toHaveLength(2)
      expect(vi.mocked(fs.lstatSync).mock.calls.filter(row => row[0] === f.live)).toHaveLength(8)
    } finally { rmSync(f.dir, { recursive: true }) }
  })
  it("retains ALL alias predicates and promotes overlapping historical roles to live", () => {
    const f = fixture()
    try {
      const c = continuation.createLeanContinuationStageControllerV6(f.pins, [], [...f.roles, { path: join(f.dir, ".", "archive"), role: "active_input" }], f.context, () => {})
      writeFileSync(f.archive, "changed")
      expect(() => c.live(f.context, () => {})).toThrow()
      expect(() => c.withStage(f.context, "terminal", () => {})).toThrow()
    } finally { rmSync(f.dir, { recursive: true }) }
  })
  it("closing drift irreversibly denies dependent effects, foreign contexts and reentrancy", () => {
    for (const kind of ["closing", "foreign", "nested", "callback"] as const) {
      const f = fixture()
      try {
        const c = continuation.createLeanContinuationStageControllerV6(f.pins, [], f.roles, f.context, () => {})
        expect(() => c.withStage(f.context, "archive", () => {
          if (kind === "closing") writeFileSync(f.archive, "replacement")
          if (kind === "foreign") c.live({ ...f.context }, () => {})
          if (kind === "nested") c.withStage(f.context, "source", () => {})
          if (kind === "callback") c.live(f.context, () => c.withStage(f.context, "source", () => {}))
        })).toThrow()
        expect(() => c.live(f.context, () => {})).toThrow()
      } finally { rmSync(f.dir, { recursive: true }) }
    }
  })
  it("rejects unknown, omitted and hostile role capture without calling hooks", () => {
    const f = fixture(), hook = vi.fn()
    try {
      const create = (roles: unknown) => continuation.createLeanContinuationStageControllerV6(f.pins, [], roles as typeof f.roles, f.context, () => {})
      expect(() => create([{ path: f.archive, role: "unknown" }, f.roles[1]])).toThrow()
      expect(() => create([f.roles[0]])).toThrow()
      expect(() => create(new Proxy(f.roles, { get: hook }))).toThrow()
      const hostile = { path: f.archive, get role() { hook(); return "closed_history" } }
      expect(() => create([hostile, f.roles[1]])).toThrow(); expect(hook).not.toHaveBeenCalled()
    } finally { rmSync(f.dir, { recursive: true }) }
  })
  it("selects exact finite V6 only without changing old selectors", () => {
    const p = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V6
    expect(p.request).toBe(".strategy-lab/lean-baseline-continuation-request-20261014-v6.json")
    expect(ledger.leanBaselineContinuationPathsForRequestV2(p.request)).toBe(p)
    expect(ledger.leanBaselineContinuationPathsForRequestV2(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V5.request)).toBe(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V5)
    expect(() => ledger.leanBaselineContinuationPathsForRequestV2(p.request + ".other")).toThrow()
    const { root: _, ...body } = { ...continuationWindowFixtureV2(), routeNamespace: "20261014-v6" as const, approvedAtMs: 1792002607000, anchorMs: 1792002607000, carryMs: 654665903, capMs: 683465903, deadlineMs: 1792031407000 }
    const window = { ...body, root: labRoot(body.schemaVersion, body) }
    expect(ledger.leanBaselineContinuationPathsForWindowV2(window)).toBe(p)
    const prior = continuationAllocationFixtureV2()
    const { root: __, ...allocationBody } = { ...prior, caps: { ...prior.caps, elapsedMs: window.capMs }, window, windowBytesRoot: ledger.leanBytesRoot(ledger.leanCanonicalBytes(window)) }
    const allocation = ledger.validateLeanBaselineContinuationAllocationV2({ ...allocationBody, root: labRoot(allocationBody.schemaVersion, allocationBody) })
    expect(ledger.leanWritablePaths(allocation)).toEqual([p.temp, p.allocation, p.request, p.window])
    for (const delta of [{ carryMs: 654665904, capMs: 683465904 }, { anchorMs: 1792002607001, approvedAtMs: 1792002607001, deadlineMs: 1792031407001 }]) {
      const changed = { ...body, ...delta }; expect(() => ledger.validateLeanBaselineContinuationWindowV2({ ...changed, root: labRoot(changed.schemaVersion, changed) })).toThrow()
    }
  })
  it("[continuation-v6-time-binding] admits the exact newly approved rerooted V6 tuple", () => {
    const { root: _, ...body } = { ...continuationWindowFixtureV2(), routeNamespace: "20261014-v6" as const, approvedAtMs: 1792002607000, anchorMs: 1792002607000, carryMs: 654665903, capMs: 683465903, deadlineMs: 1792031407000 }
    const window = { ...body, root: labRoot(body.schemaVersion, body) }
    expect(ledger.validateLeanBaselineContinuationWindowV2(window)).toEqual(window)
  })
  it("[continuation-v6-time-binding] denies rerooted expired and internally coherent shifted V6 tuples", () => {
    const { root: _, ...body } = { ...continuationWindowFixtureV2(), routeNamespace: "20261014-v6" as const, approvedAtMs: 1792002607000, anchorMs: 1792002607000, carryMs: 654665903, capMs: 683465903, deadlineMs: 1792031407000 }
    for (const delta of [
      { approvedAtMs: 1791978643000, anchorMs: 1791978643000, carryMs: 630701903, capMs: 659501903, deadlineMs: 1792007443000 },
      { approvedAtMs: 1792002607001, anchorMs: 1792002607001, carryMs: 654665904, capMs: 683465904, deadlineMs: 1792031407001 },
      { carryMs: 654665904, capMs: 683465904 },
      { capMs: 683465904 }, { deadlineMs: 1792031407001 },
    ]) {
      const changed = { ...body, ...delta }
      expect(() => ledger.validateLeanBaselineContinuationWindowV2({ ...changed, root: labRoot(changed.schemaVersion, changed) })).toThrow(/CONTINUATION_V2_WINDOW/)
    }
  })
  it("[continuation-v6-time-binding] preserves the continuous floor and exact full36 admission frontier", () => {
    const { root: _, ...body } = { ...continuationWindowFixtureV2(), routeNamespace: "20261014-v6" as const, approvedAtMs: 1792002607000, anchorMs: 1792002607000, carryMs: 654665903, capMs: 683465903, deadlineMs: 1792031407000 }
    const window = { ...body, root: labRoot(body.schemaVersion, body) }, prior = continuationAllocationFixtureV2()
    const { root: __, ...allocationBody } = { ...prior, caps: { ...prior.caps, elapsedMs: window.capMs }, window, windowBytesRoot: ledger.leanBytesRoot(ledger.leanCanonicalBytes(window)) }
    const allocation = ledger.validateLeanBaselineContinuationAllocationV2({ ...allocationBody, root: labRoot(allocationBody.schemaVersion, allocationBody) })
    expect(ledger.leanContinuationGlobalFloorV2(window.anchorMs)).toBe(654665903)
    expect(ledger.leanBaselineContinuationElapsedFloorV2(window, window.anchorMs)).toBe(654665903)
    const reserve = 36 * ledger.LEAN_CAPS.matchMs + window.closureMs + window.offlineOverheadMs
    expect(reserve).toBe(24060000)
    const frontier = window.deadlineMs - reserve
    expect(frontier).toBe(1792007347000)
    const sample = { nowMs: frontier, monotonicElapsedMs: frontier - window.anchorMs, remainingSlots: 36, charged: 50, retainedBytes: 88924160, scratchBytes: 0, parentRssBytes: 100000000, childRssBytes: 0, arrayBuffersBytes: 0, availableMemoryBytes: 4000000000, freeBytes: 16000000000, live: true }
    expect(continuation.assertLeanBaselineContinuationFrontierV2(allocation, sample)).toBe(window.capMs - reserve)
    expect(() => continuation.assertLeanBaselineContinuationFrontierV2(allocation, { ...sample, nowMs: frontier + 1, monotonicElapsedMs: sample.monotonicElapsedMs + 1 })).toThrow(/V2_CAPACITY/)
    expect(ledger.leanBaselineContinuationElapsedFloorV2(window, frontier + 1)).toBe(654665903 + sample.monotonicElapsedMs + 1)
    for (const delta of [{ freeBytes: 0 }, { availableMemoryBytes: 0 }, { live: false }]) expect(() => continuation.assertLeanBaselineContinuationFrontierV2(allocation, { ...sample, ...delta })).toThrow()
  })
  it("allows only approved active-directory growth, preserving stable identity and baseline members", () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "cadence-directory-"))), context = {}
    writeFileSync(join(dir, "anchor"), "x")
    const s = fs.lstatSync(dir), row: continuation.LeanContinuationInventoryRowV2 = { path: dir, kind: "directory", bytes: s.size, allocatedBytes: s.blocks * 512, dev: s.dev, ino: s.ino, mode: s.mode & 0o7777, mtimeMs: s.mtimeMs, ctimeMs: s.ctimeMs, rawRoot: null, members: ["anchor"] }
    try {
      const c = continuation.createLeanContinuationStageControllerV6([], [row], [{ path: dir, role: "active_directory" }], context, () => {}, (_path, members) => { if (members.some(name => !["anchor", "lawful"].includes(name))) throw new Error("DENIED_MEMBER") })
      c.withStage(context, "prepare", () => writeFileSync(join(dir, "lawful"), "x"))
      c.live(context, () => {})
      writeFileSync(join(dir, "unknown"), "x")
      expect(() => c.live(context, () => {})).toThrow()
      expect(() => c.withStage(context, "terminal", () => {})).toThrow()
    } finally { rmSync(dir, { recursive: true }) }
  })
})

vi.mock("node:child_process", async importOriginal => ({ ...await importOriginal<typeof import("node:child_process")>(), execFileSync: vi.fn() }))
// Instrumentation facade only: always call the actual native hash constructor;
// digest/update/streaming computations are never replaced or memoized.
vi.mock("node:crypto", async original => { const actual = await original<typeof import("node:crypto")>(); return { ...actual, createHash: vi.fn(actual.createHash) } })
vi.mock("node:fs", async original => ({ ...await original<typeof import("node:fs")>(), lstatSync: vi.fn((await original<typeof import("node:fs")>()).lstatSync), readFileSync: vi.fn((await original<typeof import("node:fs")>()).readFileSync) }))
vi.mock("../../packages/strategy-lab/src/contracts.js", async original => ({ ...await original<typeof import("../../packages/strategy-lab/src/contracts.js")>(), labRoot: vi.fn((await original<typeof import("../../packages/strategy-lab/src/contracts.js")>()).labRoot) }))

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
describe("[continuation-preledger-carry] separate real default inventory to V6 helper bootstrap", () => {
  const fixture = (n: number, run: (f: { rows: readonly continuation.LeanContinuationInventoryRowV2[]; reviewed: readonly continuation.LeanContinuationReviewedRowV2[]; context: object; controller: ReturnType<typeof continuation.createLeanContinuationStageControllerV6>; current: (additional?: number) => void; counts: Record<string, number>; initialization: Record<string, number>; bootstrap: (callbacks: number, body?: () => void) => void; mutate: (kind: string) => void; deny: () => void }) => void) => {
    const began = performance.now(), byteBound = 4194305 + n * 1024 + 8 * 1024 * 1024
    expect(n).toBeGreaterThanOrEqual(2); expect(n).toBeLessThanOrEqual(64); expect(byteBound).toBeLessThanOrEqual(64 * 1024 * 1024)
    expect(process.memoryUsage().heapUsed + byteBound).toBeLessThan(768 * 1024 * 1024)
    const stopAt = began + 12000, censor = () => { if (performance.now() >= stopAt) throw new Error("SOURCE_FIXTURE_CENSORED") }, dir = realpathSync(mkdtempSync(join(tmpdir(), "preledger-inventory-bootstrap-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir)
    const counts: Record<string, number> = { guardCallbacks: 0, resourceObservations: 0, additionalReservations: 0, heads: 0, rawHashes: 0, sha256Factories: 0, sha1Factories: 0, lstats: 0, realpaths: 0, fstats: 0, chunks: 0, exportedDescriptorReads: 0, fullOpeningVisits: 0, fullClosingVisits: 0, liveOpeningVisits: 0, liveClosingVisits: 0, currentChecks: 0, captures: 0, authenticatedReviewedRows: 0, gitShow: 0, gitOid: 0 }
    let inCurrent = false, frame: { kind: "full" | "live"; phase: "opening" | "body" | "closing" } | undefined, changedOwner = false, changedFd = false
    const originalStat = vi.mocked(fs.lstatSync).getMockImplementation()!, stat = vi.spyOn(fs, "lstatSync").mockImplementation(((...args: Parameters<typeof fs.lstatSync>) => {
      counts.lstats!++; if (frame && !inCurrent && frame.phase !== "body") counts[`${frame.kind}${frame.phase === "opening" ? "Opening" : "Closing"}Visits`]!++
      const value = Reflect.apply(originalStat, fs, args); return changedOwner && value ? Object.assign(Object.create(Object.getPrototypeOf(value)), value, { uid: typeof value.uid === "bigint" ? value.uid + 1n : value.uid + 1 }) : value
    }) as typeof fs.lstatSync)
    const originalRealpath = fs.realpathSync, realpaths = vi.spyOn(fs, "realpathSync").mockImplementation(((...args: Parameters<typeof fs.realpathSync>) => { counts.realpaths!++; return Reflect.apply(originalRealpath, fs, args) }) as typeof fs.realpathSync)
    const originalFstat = fs.fstatSync, fstats = vi.spyOn(fs, "fstatSync").mockImplementation(((...args: Parameters<typeof fs.fstatSync>) => { counts.fstats!++; const value = Reflect.apply(originalFstat, fs, args); return changedFd ? Object.assign(Object.create(Object.getPrototypeOf(value)), value, { ino: typeof value.ino === "bigint" ? value.ino + 1n : value.ino + 1 }) : value }) as typeof fs.fstatSync)
    const originalRead = fs.readSync, chunks = vi.spyOn(fs, "readSync").mockImplementation(((...args: Parameters<typeof fs.readSync>) => { counts.chunks!++; return Reflect.apply(originalRead, fs, args) }) as typeof fs.readSync)
    const originalRaw = ledger.leanBytesRoot, raw = vi.spyOn(ledger, "leanBytesRoot").mockImplementation(bytes => { counts.rawHashes!++; return originalRaw(bytes) })
    const originalHash = vi.mocked(crypto.createHash).getMockImplementation()!, hashes = vi.spyOn(crypto, "createHash").mockImplementation(((...args: Parameters<typeof crypto.createHash>) => { if (args[0] === "sha256") counts.sha256Factories!++; if (args[0] === "sha1") counts.sha1Factories!++; return Reflect.apply(originalHash, crypto, args) }) as typeof crypto.createHash)
    const originalDescriptor = continuation.readLeanContinuationBoundedBytesV2, descriptor = vi.spyOn(continuation, "readLeanContinuationBoundedBytesV2").mockImplementation((...args) => { counts.exportedDescriptorReads!++; return originalDescriptor(...args) })
    const usage = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...process.memoryUsage(), rss: 100000000, arrayBuffers: 0 }), disk = vi.spyOn(fs, "statfsSync").mockReturnValue({ bavail: 100000000000n, bsize: 1n } as never), available = vi.spyOn(host, "observeLeagueAvailableMemoryBytes").mockReturnValue(4000000000), clock = vi.spyOn(Date, "now").mockReturnValue(1000)
    const head = "a".repeat(40), contents = new Map<string, Buffer>(), reviewed: continuation.LeanContinuationReviewedRowV2[] = []
    const plan = ".planning/active.md", input = ".strategy-lab/lean-fixture-input.json", folder = ".strategy-lab/lean-fixture-directory"
    const write = (path: string, bytes: Buffer, mode = 0o644) => { censor(); fs.mkdirSync(resolve(path, ".."), { recursive: true }); writeFileSync(resolve(path), bytes, { mode }); contents.set(path, bytes) }
    const git: continuation.LeanContinuationGit = vi.fn(args => {
      if (args[0] === "rev-parse" && args[1] === "HEAD") { counts.heads!++; return Buffer.from(`${head}\n`) }
      const path = args[1]!.slice(41), bytes = contents.get(path); expect(bytes).toBeDefined()
      if (args[0] === "show") { counts.gitShow!++; return bytes! }
      expect(args[0]).toBe("rev-parse"); counts.gitOid!++; return Buffer.from(createHash("sha1").update(`blob ${bytes!.length}\0`).update(bytes!).digest("hex") + "\n")
    })
    // Explicitly synthetic fresh-resource predicate, NOT the private driver
    // capacity path or a passing live receipt. All filesystem/hash work is real.
    const reserve = (additional = 0) => { censor(); counts.guardCallbacks!++; counts.resourceObservations!++; if (additional) counts.additionalReservations!++; const memory = process.memoryUsage(), free = fs.statfsSync(resolve("."), { bigint: true }); if (!Number.isSafeInteger(additional) || additional < 0 || memory.rss + memory.arrayBuffers + additional > 3000000000 || host.observeLeagueAvailableMemoryBytes() < 1000000000 || free.bavail * free.bsize < 15000000000n) throw new Error("SYNTHETIC_RESOURCE_REFUSAL") }
    try {
      for (const path of ["scripts", ".strategy-lab", ".planning/artifacts"]) fs.mkdirSync(resolve(path), { recursive: true })
      for (let i = 0; i < n; i++) { const path = `scripts/reviewed-${i}.ts`, bytes = Buffer.alloc(i === 0 ? 4194305 : 1024, 97); write(path, bytes); reviewed.push({ path, root: ledger.leanBytesRoot(bytes), commit: head, kind: "reviewed_source" }) }
      write(plan, Buffer.from("active planning")); reviewed.push({ path: plan, root: ledger.leanBytesRoot(contents.get(plan)!), commit: head, kind: "active_planning" }); write(input, Buffer.from("{}"), 0o600); write(`${folder}/closed.txt`, Buffer.from("closed synthetic bytes"), 0o600)
      const inputRoots = [plan, input].map(path => ({ path, root: ledger.leanBytesRoot(contents.get(path)!) })), initialization = { ...counts }
      const rows = continuation.inventoryLeanContinuationSurvivorsV2([], reviewed, git, reserve) // real DEFAULT/V3 branch, no V6 spent anchors
      expect(rows.filter(row => reviewed.some(review => review.path === row.path))).toHaveLength(reviewed.length); expect(counts.gitShow).toBe(n); expect(counts.gitOid).toBe(1); counts.authenticatedReviewedRows = reviewed.length
      for (const review of reviewed) expect(rows.find(row => row.path === review.path)?.rawRoot).toBe(review.root)
      const pins = inputRoots.map(row => ({ path: row.path, stat: fs.lstatSync(resolve(row.path)) })), context = Object.freeze({ pid: process.pid, fixedHead: head, route: "20261014-v6", grant: "synthetic-only", windowRoot: r("synthetic-window") })
      const current = (additional = 0) => { counts.currentChecks!++; inCurrent = true; try { reserve(additional); if (Date.now() >= 2000 || Date.now() < 1000 || git(["rev-parse", "HEAD"]).toString().trim() !== head) throw new Error("SYNTHETIC_CURRENT_REFUSAL"); for (const row of inputRoots) if (ledger.leanBytesRoot(continuation.readLeanContinuationBoundedBytesV2(row.path, 65536, row.path === input ? 0o600 : 0o644, reserve)) !== row.root) throw new Error("SYNTHETIC_INPUT_REFUSAL") } finally { inCurrent = false } }
      const roles = rows.map(row => ({ path: row.path, role: row.path === plan ? "active_planning" : row.path === input ? "active_input" : row.kind === "directory" ? "closed_directory" : "closed_history" }))
      counts.captures!++; const controller = continuation.createLeanContinuationStageControllerV6(pins, rows, roles, context, current)
      const bootstrap = (callbacks: number, body?: () => void) => {
        frame = { kind: "full", phase: "opening" }
        try { controller.withStage(context, "bootstrap", () => {
          frame = { kind: "full", phase: "body" }
          for (let i = 0; i < callbacks; i++) { frame = { kind: "live", phase: "opening" }; controller.live(context, () => { frame = { kind: "live", phase: "body" }; current(); frame = { kind: "live", phase: "closing" } }); frame = { kind: "full", phase: "body" } }
          body?.(); frame = { kind: "full", phase: "closing" }
        }) } finally { frame = undefined }
      }
      const mutate = (kind: string) => {
        if (kind === "mode") fs.chmodSync(resolve(input), 0o644)
        if (kind === "link") { fs.renameSync(resolve(input), resolve(`${input}.old`)); symlinkSync(resolve(`${input}.old`), resolve(input)) }
        if (kind === "membership") write(`${folder}/new.txt`, Buffer.from("added"), 0o600)
        if (kind === "owner") changedOwner = true
        if (kind === "fd") changedFd = true
        if (kind === "resource") usage.mockReturnValue({ ...process.memoryUsage(), rss: 4000000000 })
        if (kind === "deadline") clock.mockReturnValue(2000)
      }
      const deny = () => { expect(() => controller.live(context, () => {})).toThrow(/V6_CONTEXT/); expect(() => controller.withStage(context, "bootstrap", () => {})).toThrow(/V6_CONTEXT/) }
      run({ rows, reviewed, context, controller, current, counts, initialization, bootstrap, mutate, deny })
    } finally { clock.mockRestore(); available.mockRestore(); disk.mockRestore(); usage.mockRestore(); descriptor.mockRestore(); hashes.mockRestore(); raw.mockRestore(); chunks.mockRestore(); fstats.mockRestore(); realpaths.mockRestore(); stat.mockRestore(); cwd.mockRestore(); rmSync(dir, { recursive: true }); expect(performance.now() - began).toBeLessThan(15000) }
  }
  it.each([2, 64])("finite SOURCE sensitivity n=%i authenticates real small/large reviewed rows before actual helper bootstrap", n => fixture(n, f => {
    const before = { ...f.counts }, began = performance.now(); f.bootstrap(n)
    expect(f.counts.captures).toBe(1); expect(f.counts.authenticatedReviewedRows).toBe(n + 1)
    expect(f.counts.fullOpeningVisits).toBe(f.rows.length); expect(f.counts.fullClosingVisits).toBe(f.rows.length)
    expect(f.counts.liveOpeningVisits).toBe(n * 2); expect(f.counts.liveClosingVisits).toBe(n * 2)
    expect(f.counts.currentChecks! - before.currentChecks!).toBe(3 * n + 3)
    process.stdout.write(`FINITE_SYNTHETIC_PRELEDGER_BRANCH2 ${JSON.stringify({ status: "COMPLETE", n, bytesBound: 4194305 + n * 1024 + 8 * 1024 * 1024, sampleMs: Math.ceil(performance.now() - began), initialization: f.initialization, inventoryAndCapture: before, bootstrap: Object.fromEntries(Object.entries(f.counts).map(([key, value]) => [key, value - before[key]!])), authenticatedReviewedRows: n + 1, returnedRows: f.rows.length, inventoryBranch: "real-default-V3", helperController: "real-V6", smallCommittedAndLocalChecksReal: true, largeStreamingAndOidChecksReal: true, rawAndDomainHashesReal: true, gitResourcesClockMocked: true, actualDriverBindArchiveCovered: false, fullHistoricalCapsuleImportCovered: false, exactV6SpentSuccessCovered: false, runtimeFitEstablished: false })}\n`)
  }), 15000)
  it.each(["mode", "link", "membership", "owner", "fd", "resource", "deadline"])("actual helper bootstrap closing %s drift irreversibly denies after authenticated capture", kind => fixture(2, f => {
    expect(() => f.bootstrap(1, () => f.mutate(kind))).toThrow(); f.deny()
  }), 15000)
  it("forged context and additional-byte refusal cannot revive a captured helper controller", () => {
    fixture(2, f => { const effect = vi.fn(); expect(() => f.controller.withStage({ ...f.context }, "bootstrap", effect)).toThrow(/V6_CONTEXT/); expect(effect).not.toHaveBeenCalled(); f.deny() })
    fixture(2, f => { expect(() => f.controller.live(f.context, () => f.current(Number.MAX_SAFE_INTEGER))).toThrow(/SYNTHETIC_RESOURCE_REFUSAL/); f.deny() })
  }, 15000)
})
describe("[continuation-v2-permissions] actual isolated inventory", () => {
  const fixture = (run: (f: { paths: string[]; reviewed: continuation.LeanContinuationReviewedRowV2[]; git: continuation.LeanContinuationGit; inventory: (prior?: readonly continuation.LeanContinuationInventoryRow[], guard?: (additional?: number) => void) => readonly continuation.LeanContinuationInventoryRowV2[] }) => void, modes = [0o755, 0o644, 0o644], large = false) => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "continuation-permissions-")))
    const paths = ["scripts/run-v1-38-lean-baseline.sh", "scripts/unit.ts", ".planning/STATE.md"], head = "a".repeat(40)
    const bytes = paths.map((_, i) => large && i === 0 ? Buffer.alloc(4194305, 97) : Buffer.from(`synthetic committed ${i}`))
    const cwd = vi.spyOn(process, "cwd").mockReturnValue(dir)
    try {
      for (const name of ["scripts", ".strategy-lab", ".planning/artifacts"]) fs.mkdirSync(join(dir, name), { recursive: true })
      paths.forEach((path, i) => { writeFileSync(join(dir, path), bytes[i]!, { mode: modes[i]! }); fs.chmodSync(join(dir, path), modes[i]!); expect(fs.lstatSync(join(dir, path)).mode & 0o7777).toBe(modes[i]) })
      const reviewed = paths.map((path, i): continuation.LeanContinuationReviewedRowV2 => ({ path, root: ledger.leanBytesRoot(bytes[i]!), commit: head, kind: i === 2 ? "active_planning" : "reviewed_source" }))
      const git: continuation.LeanContinuationGit = vi.fn(args => {
        const i = paths.findIndex(path => args[1] === `${head}:${path}`)
        expect(i).toBeGreaterThanOrEqual(0); expect(args).toHaveLength(2)
        expect(args[0]).toBe(bytes[i]!.length > 4194304 ? "rev-parse" : "show")
        return args[0] === "show" ? bytes[i]! : Buffer.from(createHash("sha1").update(`blob ${bytes[i]!.length}\0`).update(bytes[i]!).digest("hex") + "\n")
      })
      run({ paths, reviewed, git, inventory: (prior = [], guard = () => {}) => continuation.inventoryLeanContinuationSurvivorsV2(prior, reviewed, git, guard) })
    } finally { cwd.mockRestore(); rmSync(dir, { recursive: true }) }
  }
  it("admits registered 0755 plus source/planning 0644 with historical modes and no debit refund", () => fixture(f => {
    const rows = f.inventory(); expect(rows.map(row => [row.path, row.mode])).toEqual([[f.paths[2], 0o644], [f.paths[0], 0o755], [f.paths[1], 0o644]])
    expect(f.inventory(rows)).toEqual(rows); expect(f.git).toHaveBeenCalledTimes(6)
    const originalDebit = rows.reduce((n, row) => n + row.allocatedBytes, 0) + 8192
    const consumed = [ledger.LEAN_BASELINE_CONTINUATION_PATHS.request, ledger.LEAN_BASELINE_CONTINUATION_PATHS.allocation, ledger.LEAN_BASELINE_CONTINUATION_PATHS.store, ledger.LEAN_BASELINE_CONTINUATION_PATHS.temp].map(path => ({ path, allocatedBytes: 4096 }))
    const debit = continuation.reconcileLeanContinuationV2DiskDebit(originalDebit, rows, originalDebit + 32768, [...rows, ...consumed])
    expect(debit.allocatedDiskBytes).toBe(originalDebit + 32768)
    const growth = rows.map((row, i) => i === 0 ? { ...row, allocatedBytes: row.allocatedBytes + 4096 } : row)
    expect(continuation.reconcileLeanContinuationV2DiskDebit(originalDebit, rows, debit.allocatedDiskBytes, [...growth, ...consumed]).allocatedDiskBytes).toBe(debit.allocatedDiskBytes + 4096)
    for (const changed of [rows.slice(1), rows.map((row, i) => i === 0 ? { ...row, allocatedBytes: 0 } : row)]) expect(() => continuation.reconcileLeanContinuationV2DiskDebit(originalDebit, rows, debit.allocatedDiskBytes, [...changed, ...consumed])).toThrow(/MISSING_OR_SHRINK/)
    for (const row of rows.filter(row => row.path.startsWith("scripts/"))) expect(() => f.inventory(rows.map(old => old.path === row.path ? { ...old, mode: old.mode === 0o755 ? 0o644 : 0o755 } : old))).toThrow(/SURVIVOR_SHRINK/)
  }))
  it.each([0o600, 0o664, 0o700, 0o775, 0o4755, 0o2644, 0o1644])("denies exact source mode %i including special bits", mode => fixture(f => expect(() => f.inventory()).toThrow(/REVIEWED_FILE/), [mode, 0o644, 0o644]))
  it.each([0o755, 0o600])("denies planning mode %i", mode => fixture(f => expect(() => f.inventory()).toThrow(/REVIEWED_FILE/), [0o644, 0o644, mode]))
  it("streams registered large 0755 content through exact committed OID and fresh guards", () => fixture(f => {
    const guard = vi.fn(); expect(f.inventory([], guard).find(row => row.path === f.paths[0])?.mode).toBe(0o755)
    expect(guard.mock.calls.length).toBeGreaterThan(64); expect(f.git).toHaveBeenCalledWith(["rev-parse", `${"a".repeat(40)}:${f.paths[0]}`])
  }, undefined, true))
  it("denies wrong committed bytes/root/ref/path, duplicate registration and aliases", () => fixture(f => {
    const run = (reviewed = f.reviewed, git = f.git) => continuation.inventoryLeanContinuationSurvivorsV2([], reviewed, git, () => {})
    expect(() => run(f.reviewed, () => Buffer.from("wrong"))).toThrow(/SOURCE_ROOT/)
    for (const change of [{ root: r("wrong") }, { commit: "HEAD" }, { path: "../unit.ts" }, { kind: "unknown" }]) expect(() => run(f.reviewed.map((row, i) => i === 0 ? { ...row, ...change } as continuation.LeanContinuationReviewedRowV2 : row))).toThrow()
    expect(() => run([...f.reviewed, f.reviewed[0]!])).toThrow(/INVENTORY_BOUND/)
    const path = resolve(f.paths[0]!); fs.renameSync(path, `${path}.original`); symlinkSync(`${path}.original`, path)
    expect(() => run()).toThrow(/ALIAS/); fs.unlinkSync(path); fs.linkSync(`${path}.original`, path); expect(() => run()).toThrow(/ALIAS/)
  }, [0o644, 0o644, 0o644]))
  it("denies reservation before allocation and descriptor replacement/mode mutation during read", () => {
    for (const mutation of ["replace", "mode"] as const) fixture(f => {
      let calls = 0
      const guard = () => { if (++calls === 6) { const path = resolve(f.paths[2]!); if (mutation === "mode") fs.chmodSync(path, 0o755); else { fs.renameSync(path, `${path}.old`); writeFileSync(path, "replacement", { mode: 0o644 }) } } }
      expect(() => f.inventory([], guard)).toThrow(/CHANGED/)
    }, [0o644, 0o644, 0o644])
    fixture(f => { const alloc = vi.spyOn(Buffer, "alloc"); try { expect(() => f.inventory([], additional => { if (additional) throw new Error("reservation-denied") })).toThrow("reservation-denied"); expect(alloc).not.toHaveBeenCalled() } finally { alloc.mockRestore() } })
  })
  it("keeps bounded private metadata strictly 0600", () => fixture(f => {
    for (const mode of [0o600, 0o644, 0o755, 0o4600]) {
      const path = resolve(`scripts/private-${mode}.json`); writeFileSync(path, "{}", { mode }); fs.chmodSync(path, mode)
      expect(fs.lstatSync(path).mode & 0o7777).toBe(mode)
      const read = () => continuation.readLeanContinuationBoundedBytesV2(path, 2, 0o600, () => {})
      if (mode === 0o600) expect(read().toString()).toBe("{}"); else expect(read).toThrow(/V2_FILE/)
    }
  }))
  it("denies a foreign owner and reobserves final authenticated mode", () => {
    fixture(f => {
      const stat = vi.mocked(fs.lstatSync), original = stat.getMockImplementation()!
      try {
        stat.mockImplementation((...args) => { const value = original(...args); return value && String(args[0]) === resolve(f.paths[0]!) ? Object.assign(Object.create(Object.getPrototypeOf(value)), value, { uid: Number(value.uid) + 1 }) : value })
        expect(() => f.inventory()).toThrow(/ALIAS/)
      } finally { stat.mockImplementation(original) }
    })
    fixture(f => {
      let calls = 0
      expect(() => f.inventory([], () => { if (++calls === 10) fs.chmodSync(resolve(f.paths[2]!), 0o755) })).toThrow(/INVENTORY_CHANGED/)
    })
  })
})
export const continuationWindowFixtureV2 = () => {
  const body = { schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const, grantId: "synthetic-unit-grant", approvalEvidence: { humanDecisionId: "synthetic-unit-decision", recordedBy: "synthetic-root" }, approvedAtMs: 1791820000000, anchorMs: 1791820000000, deadlineMs: 1791848800000, carryMs: 472058903, capMs: 500858903, durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace: "20261012-v3" as const, reviewedSourceHead: "a".repeat(40), sourceRoot: r("source"), sourceGateRoot: r("source-gate"), planRoot: r("plan"), runOperator: "synthetic-runner", readerOperator: "synthetic-reader" }
  return { ...body, root: labRoot(body.schemaVersion, body) }
}
export const continuationAllocationFixtureV2 = () => {
  const window = continuationWindowFixtureV2()
  const body = { schemaVersion: "lean-baseline-continuation-carry-v2" as const, chargedMatches: 50 as const, elapsedUpperBoundMs: 465187899, allocatedDiskBytes: 88924160, residualDiskBytes: 4096, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, originalCarryRoot: r("original-carry"), closedCapsuleRoot: r("closed-capsule"), custodyRoot: r("custody"), inventoryRoot: r("inventory"), qualifiedReaderAuthority: "cost_only" as const }
  return ledger.createLeanBaselineContinuationAllocationV2({ sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: r("plan"), candidateRoots: [r("a"), r("b")], requestRoots: Array.from({ length: 36 }, (_, n) => r(n)), seed: "inert-continuation-v2", sourceHead: "b".repeat(40), planningRoot: r("planning"), manifestRoot: r("manifest"), requestBytesRoot: r("request"), window, windowBytesRoot: ledger.leanBytesRoot(ledger.leanCanonicalBytes(window)), sourceGateRoot: window.sourceGateRoot, dataReviewRoot: r("data-review"), predecessor: { ...body, root: labRoot(body.schemaVersion, body) } })
}
describe("[continuation-overhead] admitted ledger pure policy", () => {
  const fixture = (run: (l: ledger.LeanExperimentLedger, a: ledger.LeanBaselineContinuationAllocationV2) => void) => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "continuation-policy-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir)
    try {
      fs.mkdirSync(join(dir, ".strategy-lab")); fs.mkdirSync(join(dir, ".planning/artifacts"), { recursive: true })
      const a = continuationAllocationFixtureV2(), l = ledger.createLeanLedger(join(dir, "store"), a)
      run(l, a)
    } finally { cwd.mockRestore(); rmSync(dir, { recursive: true }) }
  }
  const sample = (a: ledger.LeanBaselineContinuationAllocationV2): continuation.LeanContinuationFrontier => ({ nowMs: a.window.anchorMs + 1000, monotonicElapsedMs: 2000, remainingSlots: 36, charged: 50, retainedBytes: a.predecessor.allocatedDiskBytes, scratchBytes: 0, parentRssBytes: 100000000, childRssBytes: 0, arrayBuffersBytes: 0, availableMemoryBytes: 4000000000, freeBytes: 16000000000, live: true })
  it("[continuation-remaining-overhead] reuses admitted window pure work through create/open accounting, frontier and capacity", () => fixture(created => {
    for (const l of [created, ledger.openLeanLedger(created.directory)]) {
      const a = ledger.readLeanAdmittedContinuationAllocationV2(l), clock = vi.spyOn(Date, "now").mockReturnValue(a.window.anchorMs + 1000)
      try {
        vi.mocked(labRoot).mockClear()
        for (let i = 0; i < 3; i++) {
          expect(ledger.currentLeanElapsedMs(l)).toBe(a.window.carryMs + 1000)
          expect(continuation.assertLeanBaselineContinuationFrontierV2(a, sample(a), l)).toBe(a.window.carryMs + 2000)
          expect(ledger.leanAdmittedContinuationCapacityBasisV2(l, a.window, Date.now())).toEqual({ elapsedMs: a.window.carryMs + 1000, tempPath: ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.temp })
        }
        expect(vi.mocked(labRoot).mock.calls.filter(([domain]) => domain === "lean-baseline-continuation-window-v2")).toHaveLength(0)
        for (const args of [[a.window.anchorMs - 1, 0, 0], [NaN, 0, 0], [a.window.anchorMs, -1, 0], [a.window.anchorMs, 0, Number.MAX_SAFE_INTEGER]]) expect(() => ledger.leanAdmittedContinuationElapsedFloorV2(l, ...args as [number, number, number])).toThrow()
        expect(ledger.leanAdmittedContinuationElapsedFloorV2(l, a.window.anchorMs, a.window.carryMs + 20, 10)).toBe(a.window.carryMs + 20)
        clock.mockReturnValue(a.window.anchorMs - 1); expect(() => ledger.currentLeanElapsedMs(l)).toThrow()
      } finally { clock.mockRestore() }
    }
  }))
  it("[continuation-remaining-overhead] refuses transferable context/ledger policies and keeps public fallback strict", () => fixture(l => {
    const a = ledger.readLeanAdmittedContinuationAllocationV2(l), clone = JSON.parse(Buffer.from(ledger.leanCanonicalBytes(a)).toString())
    for (const forged of [{ ...l }, Object.freeze({ ...l }), { directory: `${l.directory}/changed`, allocation: a }, new Proxy(l, { get() { throw new Error("hostile getter") } })]) expect(() => ledger.leanAdmittedContinuationCapacityBasisV2(forged, a.window, a.window.anchorMs)).toThrow()
    for (const w of [clone.window, { ...a.window, approvalEvidence: { ...a.window.approvalEvidence, recordedBy: "mutated" } }, new Proxy(a.window, { get() { throw new Error("hostile window") } })]) expect(() => ledger.leanAdmittedContinuationCapacityBasisV2(l, w, a.window.anchorMs)).toThrow()
    const clock = vi.spyOn(Date, "now").mockReturnValue(a.window.anchorMs)
    try {
      vi.mocked(labRoot).mockClear(); ledger.currentLeanElapsedMs({ directory: l.directory, allocation: clone })
      expect(vi.mocked(labRoot).mock.calls.filter(([domain]) => domain === "lean-baseline-continuation-window-v2").length).toBeGreaterThan(0)
      clone.window.approvalEvidence.recordedBy = "deep-mutation"; expect(() => ledger.currentLeanElapsedMs({ directory: l.directory, allocation: clone })).toThrow()
    } finally { clock.mockRestore() }
  }))
  it("uses the exact recursively frozen admitted allocation through actual accounting, reads and frontier", () => fixture((created, original) => {
    for (const l of [created, ledger.openLeanLedger(created.directory)]) {
      const a = ledger.readLeanAdmittedContinuationAllocationV2(l), before = ledger.leanCanonicalBytes(original)
      expect(a).toBe(l.allocation); expect(a).not.toBe(original); expect(ledger.leanCanonicalBytes(a)).toEqual(before)
      const frozen = (value: unknown): void => { if (value !== null && typeof value === "object") { expect(Object.isFrozen(value)).toBe(true); Object.values(value).forEach(frozen) } }
      frozen(l); expect(a.slots).toHaveLength(36); expect(a.holdoutReservations).toHaveLength(4)
      expect(() => { a.slots[0]!.ordinal = 99 }).toThrow(); expect(() => { a.window.approvalEvidence.recordedBy = "forged" }).toThrow()
      vi.mocked(labRoot).mockClear(); vi.mocked(fs.lstatSync).mockClear(); vi.mocked(fs.readFileSync).mockClear()
      for (let i = 0; i < 3; i++) {
        expect(ledger.cumulativeLeanPhysicalBytes(l)).toBeGreaterThanOrEqual(a.predecessor.allocatedDiskBytes)
        expect(ledger.readLeanLedger(l).charged).toBe(50)
        expect(continuation.assertLeanBaselineContinuationFrontierV2(a, sample(a), l)).toBe(a.window.carryMs + 2000)
      }
      expect(vi.mocked(labRoot).mock.calls.filter(([domain]) => domain === "lean-slot-v1" || domain.includes("allocation") || domain.includes("admission"))).toHaveLength(0)
      expect(vi.mocked(fs.readFileSync).mock.calls).toHaveLength(6)
      expect(vi.mocked(fs.lstatSync).mock.calls.length).toBeGreaterThanOrEqual(21)
      expect(ledger.leanCanonicalBytes(a)).toEqual(before)
    }
  }))
  it("rejects structural, root-matching, mutable and cross-version ledger capabilities", () => fixture((l, original) => {
    const a = ledger.readLeanAdmittedContinuationAllocationV2(l), clone = JSON.parse(Buffer.from(ledger.leanCanonicalBytes(a)).toString()) as ledger.LeanBaselineContinuationAllocationV2
    for (const forged of [{ ...l }, Object.freeze({ ...l }), { directory: l.directory, allocation: clone }, { directory: l.directory, allocation: continuationAllocationFixture() }]) {
      expect(() => ledger.readLeanAdmittedContinuationAllocationV2(forged)).toThrow()
      expect(() => continuation.assertLeanBaselineContinuationFrontierV2(a, sample(a), forged)).toThrow()
    }
    expect(() => continuation.assertLeanBaselineContinuationFrontierV2(clone, sample(a), l)).toThrow()
    vi.mocked(labRoot).mockClear(); ledger.cumulativeLeanPhysicalBytes({ directory: l.directory, allocation: original })
    expect(vi.mocked(labRoot).mock.calls.filter(([domain]) => domain === "lean-slot-v1")).toHaveLength(36)
    expect(continuation.assertLeanBaselineContinuationFrontierV2(clone, sample(a))).toBe(a.window.carryMs + 2000)
    for (const change of [{ sourceRoot: r("wrong") }, { requestBytesRoot: r("wrong") }, { window: { ...clone.window, routeNamespace: "20261012-v4" } }, { schemaVersion: "lean-baseline-continuation-allocation-v1" }]) expect(() => continuation.assertLeanBaselineContinuationFrontierV2({ ...clone, ...change } as never, sample(a))).toThrow()
    const accessor = { ...clone }; Object.defineProperty(accessor, "sourceRoot", { enumerable: true, get: () => clone.sourceRoot })
    for (const hostile of [accessor, Object.assign(Object.create({ extra: true }), clone)]) expect(() => ledger.admitLeanAllocation(hostile)).toThrow()
  }))
  it("freshly refuses canonical allocation drift and journal changes, even after policy issuance", () => fixture((l) => {
    const a = ledger.readLeanAdmittedContinuationAllocationV2(l), path = join(l.directory, "allocation.json"), bytes = fs.readFileSync(path)
    for (const mutation of [Buffer.from(` ${bytes.toString()}`), ledger.leanCanonicalBytes({ ...a, requestBytesRoot: r("wrong") })]) {
      writeFileSync(path, mutation); expect(() => ledger.readLeanLedger(l)).toThrow(); writeFileSync(path, bytes); expect(ledger.readLeanLedger(l).charged).toBe(50)
    }
    fs.renameSync(path, `${path}.old`); writeFileSync(path, ledger.leanCanonicalBytes({ ...a, window: { ...a.window, grantId: "wrong" } }), { mode: 0o600 }); expect(() => ledger.readLeanLedger(l)).toThrow()
    writeFileSync(path, bytes); writeFileSync(join(l.directory, "ledger.ndjson"), "{}"); expect(() => ledger.readLeanLedger(l)).toThrow(/PUBLICATION/)
  }))
  it("reobserves physical growth and preserves every branded frontier resource, time and shape denial", () => fixture(l => {
    const a = ledger.readLeanAdmittedContinuationAllocationV2(l), s = sample(a), before = ledger.cumulativeLeanPhysicalBytes(l)
    writeFileSync(join(l.directory, "synthetic-growth.json"), Buffer.alloc(65536, 97), { mode: 0o600 })
    expect(ledger.cumulativeLeanPhysicalBytes(l)).toBeGreaterThan(before)
    const cases = [{ retainedBytes: a.predecessor.allocatedDiskBytes - 1 }, { retainedBytes: ledger.LEAN_CAPS.retainedBytes + 1 }, { scratchBytes: ledger.LEAN_CAPS.scratchBytes + 1 }, { parentRssBytes: 3000000000 }, { childRssBytes: 3000000000 }, { arrayBuffersBytes: 3000000000 }, { availableMemoryBytes: 0 }, { freeBytes: 0 }, { nowMs: a.window.deadlineMs }, { nowMs: a.window.anchorMs - 1 }, { monotonicElapsedMs: a.window.durationMs }, { live: false }, { charged: 49 }, { charged: 87 }, { remainingSlots: 35 }, { remainingSlots: 37 }, { monotonicElapsedMs: -1 }, { scratchBytes: NaN }, { nowMs: Number.MAX_SAFE_INTEGER }, { remainingClosureMs: 1 }, { extra: 1 }]
    for (const change of cases) expect(() => continuation.assertLeanBaselineContinuationFrontierV2(a, { ...s, ...change } as never, l)).toThrow()
    for (const key of Object.keys(s)) { const missing = { ...s } as Record<string, unknown>; delete missing[key]; expect(() => continuation.assertLeanBaselineContinuationFrontierV2(a, missing as never, l)).toThrow() }
    const closing = { ...s, remainingSlots: 0, remainingClosureMs: 0, remainingOfflineMs: 0 }
    expect(continuation.assertLeanBaselineContinuationFrontierV2(a, closing, l)).toBe(a.window.carryMs + 2000)
    for (const change of [{ remainingClosureMs: a.window.closureMs + 1 }, { remainingOfflineMs: a.window.offlineOverheadMs + 1 }]) expect(() => continuation.assertLeanBaselineContinuationFrontierV2(a, { ...closing, ...change }, l)).toThrow()
  }))
  it("reuses only admitted caps for actual resource-event accounting, preserving fresh bytes and every resource denial", () => fixture(l => {
    const a = ledger.readLeanAdmittedContinuationAllocationV2(l), path = join(l.directory, "ledger.ndjson"), event = { kind: "resource", elapsedMs: a.window.carryMs + 1, physicalBytes: 4096, bufferBytes: 1024, scratchBytes: 0 }
    writeFileSync(path, Buffer.concat([ledger.leanCanonicalBytes(event), Buffer.from("\n")]))
    vi.mocked(labRoot).mockClear(); vi.mocked(fs.readFileSync).mockClear()
    expect(ledger.readLeanLedger(l).elapsedMs).toBe(event.elapsedMs); expect(ledger.readLeanLedger(l).physicalHighWaterBytes).toBe(a.predecessor.allocatedDiskBytes + event.physicalBytes + event.bufferBytes)
    expect(vi.mocked(labRoot).mock.calls.filter(([domain]) => domain === "lean-slot-v1" || domain.includes("allocation") || domain.includes("admission"))).toHaveLength(0)
    expect(vi.mocked(fs.readFileSync).mock.calls).toHaveLength(4)
    for (const change of [{ elapsedMs: a.window.carryMs - 1 }, { elapsedMs: a.caps.elapsedMs + 1 }, { physicalBytes: ledger.LEAN_CAPS.retainedBytes }, { scratchBytes: ledger.LEAN_CAPS.scratchBytes + 1 }, { bufferBytes: ledger.LEAN_CAPS.scratchBytes + 1 }, { physicalBytes: -1 }, { extra: 1 }]) {
      writeFileSync(path, Buffer.concat([ledger.leanCanonicalBytes({ ...event, ...change }), Buffer.from("\n")]))
      expect(() => ledger.readLeanLedger(l)).toThrow(/RESOURCE/)
    }
  }))
})
describe("[continuation-overhead] same-pass V2 identities", () => {
  const fixture = (run: (paths: string[], rows: continuation.LeanContinuationInventoryRowV2[]) => void) => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "continuation-identities-"))), paths = [join(dir, "source"), join(dir, "planning"), join(dir, "private"), dir]
    try {
      for (let i = 0; i < 3; i++) { writeFileSync(paths[i]!, "fixture", { mode: [0o755, 0o644, 0o600][i]! }); fs.chmodSync(paths[i]!, [0o755, 0o644, 0o600][i]!) }
      const rows = paths.map(path => { const s = fs.lstatSync(path); return { path, kind: s.isDirectory() ? "directory" as const : "file" as const, bytes: s.size, allocatedBytes: s.blocks * 512, dev: s.dev, ino: s.ino, mode: s.mode & 0o777, mtimeMs: s.mtimeMs, ctimeMs: s.ctimeMs, rawRoot: null, ...(s.isDirectory() ? { members: fs.readdirSync(path).sort() } : {}) } })
      run(paths, rows)
    } finally { rmSync(dir, { recursive: true }) }
  }
  it("[continuation-remaining-overhead] defensively captures members and compares every fresh observed member", () => fixture((paths, rows) => {
    const directory = paths[3]!, row = rows[3]!, members = [...row.members!], expected = { ...row, members }
    const guard = continuation.createLeanContinuationIdentityGuardV2([], [expected]), before = fs.lstatSync(directory)
    members.push("forged"); expected.mode = 0; guard()
    writeFileSync(join(directory, "forged"), "x")
    const stat = vi.mocked(fs.lstatSync), actual = stat.getMockImplementation()!
    try { stat.mockImplementation((...args) => String(args[0]) === directory ? before as never : actual(...args)); expect(guard).toThrow(/V2_IDENTITY_CHANGED/) } finally { stat.mockImplementation(actual) }
  }))
  it("[continuation-remaining-overhead] rejects malformed, accessor and proxy expected membership without executing traps", () => fixture((_paths, rows) => {
    const row = rows[3]!, trap = vi.fn(() => { throw new Error("trap") }), getter = { ...row }
    Object.defineProperty(getter, "members", { enumerable: true, get: trap })
    for (const hostile of [getter, new Proxy(row, { ownKeys: trap }), { ...row, members: new Proxy([...row.members!], { get: trap }) }, { ...row, members: ["../escape"] }, { ...row, members: ["x", "x"] }, { ...row, members: Array(4097).fill("x") }, { ...row, bytes: NaN }]) expect(() => continuation.createLeanContinuationIdentityGuardV2([], [hostile])).toThrow()
    expect(trap).not.toHaveBeenCalled()
    const stat = fs.lstatSync(rows[0]!.path), pin = { path: rows[0]!.path, stat }
    continuation.createLeanContinuationIdentityGuardV2([pin], []); expect(Object.isFrozen(stat)).toBe(false)
  }))
  it("[continuation-remaining-overhead] [CR-REM-01] rejects custom top-level traversal, sparse arrays and extra methods without invoking them", () => fixture((paths, rows) => {
    const trap = vi.fn(function* () { /* Omits every supplied identity. */ }), stateful = vi.fn(function* () { if (stateful.mock.calls.length === 1) yield rows[0]! })
    const inheritedEmpty = [rows[0]!], inheritedStateful = [rows[0]!], customMethod = [rows[0]!], sparse = new Array<continuation.LeanContinuationInventoryRowV2>(2)
    Object.setPrototypeOf(inheritedEmpty, Object.create(Array.prototype, { [Symbol.iterator]: { value: trap } }))
    Object.setPrototypeOf(inheritedStateful, Object.create(Array.prototype, { [Symbol.iterator]: { value: stateful } }))
    Object.defineProperty(customMethod, "some", { value: trap }); sparse[1] = rows[0]!
    for (const hostile of [inheritedEmpty, inheritedStateful, customMethod, sparse]) expect(() => continuation.createLeanContinuationIdentityGuardV2([], hostile)).toThrow(/V2_EXPECTED/)
    const pins = [{ path: paths[0]!, stat: fs.lstatSync(paths[0]!) }]
    Object.setPrototypeOf(pins, Object.create(Array.prototype, { [Symbol.iterator]: { value: trap } }))
    expect(() => continuation.createLeanContinuationIdentityGuardV2(pins, [])).toThrow(/V2_EXPECTED/)
    expect(trap).not.toHaveBeenCalled(); expect(stateful).not.toHaveBeenCalled()
  }))
  it("[continuation-remaining-overhead] [CR-REM-01] captures optional membership only as own data and never invokes caller methods", () => fixture((_paths, rows) => {
    const trap = vi.fn(() => false), members = [...rows[3]!.members!]
    Object.defineProperty(members, "some", { value: trap })
    expect(() => continuation.createLeanContinuationIdentityGuardV2([], [{ ...rows[3]!, members }])).toThrow(/V2_EXPECTED/)
    expect(trap).not.toHaveBeenCalled()
  }))
  it("[continuation-remaining-overhead] [CR-REM-01] rejects inherited optional members without evaluating its accessor", () => fixture((_paths, rows) => {
    const getter = vi.fn(() => [...rows[3]!.members!]), previous = Object.getOwnPropertyDescriptor(Object.prototype, "members")
    try {
      Object.defineProperty(Object.prototype, "members", { configurable: true, get: getter })
      expect(() => continuation.createLeanContinuationIdentityGuardV2([], [rows[0]!])).toThrow(/V2_EXPECTED/)
      expect(getter).not.toHaveBeenCalled()
    } finally { if (previous) Object.defineProperty(Object.prototype, "members", previous); else Reflect.deleteProperty(Object.prototype, "members") }
  }))
  it("observes one unique absolute stat per pass for all pin/survivor roles, and observes the next pass anew", () => fixture((paths, rows) => {
    const pins = paths.slice(0, 3).map(path => ({ path, stat: fs.lstatSync(path) })), alias = { ...rows[0]!, path: join(paths[3]!, ".", "source") }
    const guard = continuation.createLeanContinuationIdentityGuardV2(pins, [...rows, alias])
    vi.mocked(fs.lstatSync).mockClear(); guard(); expect(vi.mocked(fs.lstatSync).mock.calls.map(([path]) => path)).toEqual(paths)
    guard(); expect(vi.mocked(fs.lstatSync).mock.calls.map(([path]) => path)).toEqual([...paths, ...paths])
    expect(() => continuation.createLeanContinuationIdentityGuardV2(pins, rows.map((row, i) => i ? row : { ...row, allocatedBytes: row.allocatedBytes + 512 }))()).toThrow()
    expect(() => continuation.createLeanContinuationIdentityGuardV2(pins, rows.map((row, i) => i ? row : { ...row, mode: 0o644 }))()).toThrow()
    expect(() => continuation.createLeanContinuationIdentityGuardV2(pins, rows.map((row, i) => i ? row : { ...row, kind: "directory" }))()).toThrow()
  }))
  it("freshly refuses replacement, growth, mode changes and restored bytes without reusing a prior observation", () => fixture((paths, rows) => {
    const guard = continuation.createLeanContinuationIdentityGuardV2([], rows), path = paths[0]!
    guard(); writeFileSync(path, "fixture grows"); expect(guard).toThrow(); writeFileSync(path, "fixture"); expect(guard).toThrow()
    fs.renameSync(path, `${path}.old`); writeFileSync(path, "fixture", { mode: 0o755 }); expect(guard).toThrow()
  }))
  it("retains per-role source0755/planning0644/private0600 and denies special bits, owners, aliases, links and members", () => fixture((paths, rows) => {
    const guard = continuation.createLeanContinuationIdentityGuardV2([], rows), stat = vi.mocked(fs.lstatSync), actual = stat.getMockImplementation()!
    guard()
    try {
      for (const changes of [{ uid: Number(process.getuid?.()) + 1 }, { nlink: 2 }, { mode: fs.lstatSync(paths[0]!).mode | 0o4000 }, { isFile: () => false, isDirectory: () => true }]) {
        stat.mockImplementation((...args) => { const s = actual(...args); return String(args[0]) === paths[0] ? Object.assign(Object.create(Object.getPrototypeOf(s)), s, changes) : s }); expect(guard).toThrow()
      }
    } finally { stat.mockImplementation(actual) }
    for (const [index, mode] of [[0, 0o644], [1, 0o755], [2, 0o644]]) { fs.chmodSync(paths[index!]!, mode!); expect(guard).toThrow(); fs.chmodSync(paths[index!]!, rows[index!]!.mode) }
    const old = fs.lstatSync(paths[0]!), pinnedOnly = continuation.createLeanContinuationIdentityGuardV2([{ path: paths[0]!, stat: old }], [])
    try { stat.mockImplementation((...args) => { const s = actual(...args); return String(args[0]) === paths[0] ? Object.assign(Object.create(Object.getPrototypeOf(s)), s, { uid: Number(s!.uid) + 1 }) : s }); expect(pinnedOnly).toThrow() } finally { stat.mockImplementation(actual) }
    fs.renameSync(paths[2]!, `${paths[2]}.old`); symlinkSync(`${paths[2]}.old`, paths[2]!); expect(guard).toThrow()
    const directoryGuard = continuation.createLeanContinuationIdentityGuardV2([], [rows[3]!]); writeFileSync(join(paths[3]!, "unknown"), "x"); expect(directoryGuard).toThrow()
  }))
  it("reobserves canonical realpath and directory members even with an unchanged synthetic stat", () => fixture((paths, rows) => {
    const guard = continuation.createLeanContinuationIdentityGuardV2([], rows), real = vi.spyOn(fs, "realpathSync").mockReturnValue(`${paths[0]}/alias` as never)
    try { expect(guard).toThrow(/V2_IDENTITY_CHANGED/) } finally { real.mockRestore() }
    const directory = paths[3]!, before = fs.lstatSync(directory), directoryGuard = continuation.createLeanContinuationIdentityGuardV2([], [rows[3]!])
    writeFileSync(join(directory, "unknown"), "x")
    const stat = vi.mocked(fs.lstatSync), actual = stat.getMockImplementation()!
    try { stat.mockImplementation((...args) => String(args[0]) === directory ? before as never : actual(...args)); expect(directoryGuard).toThrow(/V2_IDENTITY_CHANGED/) } finally { stat.mockImplementation(actual) }
  }))
  it("retains the array caller seam and exact denial semantics when precomputed Sets are supplied", () => fixture((paths) => {
    const path = paths[0]!, row = { path, root: ledger.leanBytesRoot(fs.readFileSync(path)) }, git = vi.fn(() => fs.readFileSync(path)), guard = vi.fn()
    // Source scopes are relative, so this absolute fixture must deny identically
    // before any read/guard, irrespective of the membership representation.
    for (const scope of [[path], new Set([path]), [], new Set<string>()]) expect(() => continuation.authenticateLeanContinuationPinnedSource(row, "a".repeat(40), scope, git, guard)).toThrow(/SOURCE_SCOPE/)
    expect(git).not.toHaveBeenCalled(); expect(guard).not.toHaveBeenCalled()
  }))
})
describe("[continuation-v5] finite selection and spent V4 preservation", () => {
  const window = () => { const { root: _, ...body } = { ...continuationWindowFixtureV2(), routeNamespace: "20261013-v5" as const }; return { ...body, root: labRoot(body.schemaVersion, body) } }
  const allocation = () => { const w = window(), { root: _, ...body } = { ...continuationAllocationFixtureV2(), window: w, windowBytesRoot: ledger.leanBytesRoot(ledger.leanCanonicalBytes(w)) }; return ledger.validateLeanBaselineContinuationAllocationV2({ ...body, root: labRoot(body.schemaVersion, body) }) }
  it("selects only six finite V5 paths and compiles exact V5 policy without changing old bytes", () => {
    const old = [continuationAllocationFixture(), continuationAllocationFixtureV2()].map(a => ledger.leanCanonicalBytes(a))
    const paths = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V5
    expect(ledger.leanBaselineContinuationPathsForWindowV2(window())).toBe(paths); expect(ledger.leanBaselineContinuationPathsForRequestV2(paths.request)).toBe(paths)
    expect(paths).toEqual({ request: ".strategy-lab/lean-baseline-continuation-request-20261013-v5.json", window: ".strategy-lab/lean-baseline-continuation-window-20261013-v5.json", allocation: ".planning/artifacts/v1.38-lean-baseline-continuation-allocation-20261013-v5.json", store: ".strategy-lab/lean-baseline-continuation-20261013-v5", temp: ".strategy-lab/lean-baseline-continuation-20261013-v5-tmp", claim: ".strategy-lab/lean-baseline-continuation-20261013-v5-tmp/window-claim.json", gates: ledger.LEAN_BASELINE_CONTINUATION_PATHS.gates })
    for (const change of [{ routeNamespace: "20261013-v6" }, { routeNamespace: "20261012-v4" }]) expect(() => ledger.leanBaselineContinuationPathsForWindowV2({ ...window(), ...change } as never)).toThrow()
    for (const path of [paths.request + "/extra", "future", ".strategy-lab/lean-baseline-continuation-request-20261013-v6.json"]) expect(() => ledger.leanBaselineContinuationPathsForRequestV2(path)).toThrow()
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "continuation-v5-policy-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir)
    try {
      const a = allocation(), l = ledger.createLeanLedger(join(dir, "store"), a), trusted = ledger.readLeanAdmittedContinuationAllocationV2(l)
      expect(ledger.leanWritablePaths(a)).toEqual([paths.temp, paths.allocation, paths.request, paths.window])
      vi.mocked(labRoot).mockClear(); vi.mocked(fs.lstatSync).mockClear(); ledger.cumulativeLeanPhysicalBytes(l)
      for (const path of [paths.temp, paths.allocation, paths.request, paths.window]) expect(vi.mocked(fs.lstatSync).mock.calls.map(([p]) => p)).toContain(resolve(path))
      expect(vi.mocked(labRoot).mock.calls.filter(([d]) => d === "lean-slot-v1" || d.includes("allocation"))).toHaveLength(0); expect(trusted).toBe(l.allocation)
    } finally { cwd.mockRestore(); rmSync(dir, { recursive: true }) }
    expect([continuationAllocationFixture(), continuationAllocationFixtureV2()].map(a => ledger.leanCanonicalBytes(a))).toEqual(old)
  })
  // Fixed historical raw roots cannot be generated from public synthetic bytes.
  // This digest-only fixture mapping is private to the test; all real descriptor,
  // directory, chunk, size/mode and root comparisons remain the production code.
  const fixture = (run: (f: { inventory: (guard?: (additional?: number) => void) => readonly continuation.LeanContinuationInventoryRowV2[]; files: { path: string; size: number; mode: number; raw: string }[]; guard: ReturnType<typeof vi.fn<(additional?: number) => void>>; dir: string }) => void, v6 = false) => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "continuation-v5-spent-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir), p = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4, v3 = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2
    const files = [
      { path: p.window, size: 935, mode: 0o600, raw: "98b0cd906323554e3c0cefb96700c317a9bd2e346135c7560d715b87eb303ba6" }, { path: p.request, size: 4056, mode: 0o600, raw: "bd17509fee8d2138b89b4a114224f1ee1ee009217475e924d6dd7cdfd90466c7" },
      { path: p.allocation, size: 17366, mode: 0o644, raw: "19aeee9f9416849b4e7bb214afa7d470349f36e302b09bda700c7a50e717938f" }, { path: join(p.store, "allocation.json"), size: 17366, mode: 0o600, raw: "19aeee9f9416849b4e7bb214afa7d470349f36e302b09bda700c7a50e717938f" },
      { path: join(p.store, "carry.json"), size: 746080, mode: 0o600, raw: "7bb1e101e0938ab8497311444e81ad30578f41d372a3c7999e61dfddad90f5a7" }, { path: join(p.store, "source-manifest.json"), size: 208491, mode: 0o600, raw: "35c507b2a0fd12b3d131671ba6596f8e4dcfcafa62676fcfa703c672d9dee508" },
      { path: join(p.store, "source-hold.json"), size: 146345, mode: 0o600, raw: "744be76efaaaeca29076208f2da70a5f755569b93c6a47d0622b3aa1f4525911" }, { path: join(p.store, "ledger.ndjson"), size: 0, mode: 0o600, raw: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
      { path: join(p.store, "time.ndjson"), size: 0, mode: 0o600, raw: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }, { path: p.claim, size: 1002, mode: 0o600, raw: "14cc57d66661a98c8f9150842b441310c8a70d29fef5186b5c58a49e62c9e45c" },
      { path: v3.request, size: 4041, mode: 0o600, raw: "900e97e973ac31c596d1f5f1b8b89e1b8e532310e0b2d6e67053fbe9a8321065" }, { path: v3.window, size: 935, mode: 0o600, raw: "2c0c2905fea2e4a264aac99df251e5aa89d0b2c44588453d3c41586f4b3a881d" },
    ]
    const p5 = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V5
    if (v6) files.push(
      { path: p5.window, size: 929, mode: 0o600, raw: "989dc4984483ac4ebcecb154e2c8b9256657d0cbb21258b50fb4cdaa99481faa" },
      { path: p5.request, size: 4051, mode: 0o600, raw: "386e72a26e326d7f09c9c93a6f087c481a7ff0117be284fcb72aeb0aa692e6b1" },
      ...[p5.allocation, join(p5.store, "allocation.json")].map((path, i) => ({ path, size: 17360, mode: i ? 0o600 : 0o644, raw: "439ff997177d812aebc8194b77dd6dcc30353541b0f5061f3eea036f32c7c7c6" })),
      { path: join(p5.store, "carry.json"), size: 749813, mode: 0o600, raw: "a6168503f6bee69d22688a003c7acb1c0d850647cdc447f81d10747150eca348" },
      { path: join(p5.store, "source-manifest.json"), size: 208495, mode: 0o600, raw: "e01c2cc7f6fd49185f92ded151ddc0b4bc6c26347cd3e3b597a76b099943388a" },
      { path: join(p5.store, "source-hold.json"), size: 146600, mode: 0o600, raw: "e0ff6a1879e9cfb90f5303097a2a1e20a130be0ada3f3b42bfe63949ec79cb55" },
      ...["ledger.ndjson", "time.ndjson"].map(name => ({ path: join(p5.store, name), size: 0, mode: 0o600, raw: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" })),
      { path: p5.claim, size: 1011, mode: 0o600, raw: "e2e94f1a122f3c994a09c4ccfb028d630fae52abb0c0aaacce733e4dd57cb13c" },
    )
    const actualDigest = ledger.leanBytesRoot, roots = new Map<string, `sha256:${string}`>(), digest = vi.spyOn(ledger, "leanBytesRoot"), guard = vi.fn<(additional?: number) => void>()
    try {
      fs.mkdirSync(resolve(".planning/artifacts"), { recursive: true }); fs.mkdirSync(resolve(p.store), { recursive: true, mode: 0o700 }); fs.mkdirSync(resolve(p.temp), { mode: 0o700 })
      if (v6) { fs.mkdirSync(resolve(p5.store), { mode: 0o700 }); fs.mkdirSync(resolve(p5.temp), { mode: 0o700 }) }
      files.forEach((row, i) => { const bytes = Buffer.alloc(row.size, 65 + i); writeFileSync(resolve(row.path), bytes, { mode: row.mode }); fs.chmodSync(resolve(row.path), row.mode); roots.set(actualDigest(bytes), `sha256:${row.raw}`) })
      digest.mockImplementation(bytes => roots.get(actualDigest(bytes)) ?? actualDigest(bytes))
      const { root: _, ...body } = { ...window(), routeNamespace: v6 ? "20261014-v6" as const : "20261013-v5" as const, ...(v6 ? { approvedAtMs: 1792002607000, anchorMs: 1792002607000, carryMs: 654665903, capMs: 683465903, deadlineMs: 1792031407000 } : {}) }
      run({ files, dir, guard, inventory: (observe = guard) => continuation.inventoryLeanContinuationSurvivorsV2([], [], () => { throw new Error("unexpected Git/history") }, observe, { ...body, root: labRoot(body.schemaVersion, body) }) })
    } finally { digest.mockRestore(); cwd.mockRestore(); rmSync(dir, { recursive: true }) }
  }
  it("[continuation-stage-cadence-G] preserves V3/V4/V5 once; authenticates UNKNOWN V5 claim size before expected rows", () => fixture(f => {
    const rows = f.inventory(), p = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V5
    expect(rows.find(row => row.path === p.claim)?.bytes).toBe(1011)
    expect(rows.filter(row => row.path === p.allocation)).toHaveLength(1)
    expect(rows.find(row => row.path === ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4.claim)).toBeDefined()
    expect(rows.find(row => row.path === ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.request)).toBeDefined()
    expect(rows.filter(row => row.path.startsWith(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V6.store))).toHaveLength(0)
    writeFileSync(resolve(p.claim), "changed", { mode: 0o600 })
    expect(() => f.inventory()).toThrow(/V5_SPENT_METADATA/)
  }, true))
  it("authenticates ten opaque V4 files/two exact directories once and preserves residual/growth debit", () => fixture(f => {
    const rows = f.inventory(), p = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4
    expect(rows.map(row => row.path)).toEqual([...f.files.map(row => row.path), p.store, p.temp].sort((a, b) => a.localeCompare(b)))
    expect(new Set(rows.map(row => row.path)).size).toBe(rows.length); expect(f.guard.mock.calls.length).toBeGreaterThan(2 * rows.length + 1)
    expect(f.guard).toHaveBeenCalledWith(746080); expect(f.guard).toHaveBeenCalledWith(17366); expect(rows.find(row => row.path === join(p.store, "ledger.ndjson"))?.bytes).toBe(0)
    const sum = rows.reduce((n, row) => n + row.allocatedBytes, 0), old = ledger.LEAN_BASELINE_CONTINUATION_PATHS, consumed = [old.request, old.allocation, old.store, old.temp].map(path => ({ path, allocatedBytes: 0 }))
    const original = rows.filter(row => row.path === ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.request || row.path === ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.window), originalDebit = original.reduce((n, row) => n + row.allocatedBytes, 0) + 4096
    const debit = continuation.reconcileLeanContinuationV2DiskDebit(originalDebit, original, originalDebit, [...rows, ...consumed], window())
    expect(debit.allocatedDiskBytes).toBe(sum + 4096); expect(debit.residualDiskBytes).toBe(4096)
    const growth = rows.map((row, i) => i === 0 ? { ...row, allocatedBytes: row.allocatedBytes + 4096 } : row)
    expect(continuation.reconcileLeanContinuationV2DiskDebit(originalDebit, original, originalDebit, [...growth, ...consumed], window()).allocatedDiskBytes).toBe(sum + 8192)
  }))
  it.each(["missing", "bytes", "mode", "nonempty-journal", "extra-store", "extra-temp", "directory-mode", "symlink", "hardlink"] as const)("denies spent V4 %s before cost use", mutation => fixture(f => {
    const p = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4, path = resolve(p.window)
    if (mutation === "missing") fs.unlinkSync(path)
    if (mutation === "bytes") { const bytes = fs.readFileSync(path); bytes[0] = bytes[0]! ^ 1; writeFileSync(path, bytes) }
    if (mutation === "mode") fs.chmodSync(resolve(p.allocation), 0o600)
    if (mutation === "nonempty-journal") writeFileSync(resolve(join(p.store, "ledger.ndjson")), "x")
    if (mutation === "extra-store") writeFileSync(resolve(join(p.store, "result.json")), "{}")
    if (mutation === "extra-temp") writeFileSync(resolve(join(p.temp, "other.json")), "{}")
    if (mutation === "directory-mode") fs.chmodSync(resolve(p.store), 0o755)
    if (mutation === "symlink" || mutation === "hardlink") { fs.renameSync(path, `${path}.old`); if (mutation === "symlink") symlinkSync(`${path}.old`, path); else fs.linkSync(`${path}.old`, path) }
    expect(() => f.inventory()).toThrow()
  }))
  it("denies foreign owners and in-flight file replacement with all descriptor guards retained", () => {
    fixture(f => { const stat = vi.mocked(fs.lstatSync), actual = stat.getMockImplementation()!; try { stat.mockImplementation((...args) => { const s = actual(...args); return String(args[0]) === resolve(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4.window) ? Object.assign(Object.create(Object.getPrototypeOf(s)), s, { uid: Number(s!.uid) + 1 }) : s }); expect(() => f.inventory()).toThrow() } finally { stat.mockImplementation(actual) } })
    fixture(f => { let changed = false; expect(() => f.inventory(additional => { if (!changed && additional === 746080) { changed = true; const path = resolve(join(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4.store, "carry.json")); fs.renameSync(path, `${path}.old`); writeFileSync(path, Buffer.alloc(746080, 69), { mode: 0o600 }) } })).toThrow() })
  })
  it.each(["replacement", "members-only"] as const)("denies spent directory %s specifically after opening capture at the closing phase", mutation => {
    const probe = (maskClosingMembers = false) => fixture(f => {
      const path = resolve(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4.temp), stat = vi.mocked(fs.lstatSync), actualStat = stat.getMockImplementation()!, actualRead = fs.readdirSync
      const expectedMembers = ["window-claim.json"], phases: string[] = []
      let opening: fs.Stats | undefined, memberReads = 0, guardCalls = 0, lastChildStatGuardCount = 0, closingStat = false, closingMembers = false, changed = false
      const read = vi.spyOn(fs, "readdirSync").mockImplementation(((name: fs.PathLike, ...args: unknown[]) => {
        const result = (actualRead as any)(name, ...args)
        if (String(name) !== path) return result
        if (!closingStat) { expect(result).toEqual(expectedMembers); memberReads++; phases.push("opening.members") }
        else { closingMembers = true; phases.push("closing.members"); if (maskClosingMembers) return expectedMembers }
        return result
      }) as typeof fs.readdirSync)
      stat.mockImplementation((...args) => {
        if (String(args[0]) !== path) { const s = actualStat(...args); if (String(args[0]) === join(path, "window-claim.json")) lastChildStatGuardCount = guardCalls; return s }
        if (!opening) { opening = actualStat(...args) as fs.Stats; phases.push("opening.stat"); return opening as never }
        expect(memberReads).toBe(2); expect(lastChildStatGuardCount).toBeGreaterThan(0); expect(guardCalls).toBeGreaterThan(lastChildStatGuardCount); expect(f.guard).toHaveBeenCalledTimes(guardCalls)
        closingStat = true; phases.push("closing.stat"); changed = true
        if (mutation === "replacement") {
          fs.renameSync(path, `${path}.replaced`); fs.mkdirSync(path, { mode: 0o700 }); fs.copyFileSync(join(`${path}.replaced`, "window-claim.json"), join(path, "window-claim.json"))
          return actualStat(...args)
        }
        writeFileSync(join(path, "extra.json"), "{}")
        // Deliberately stable synthetic metadata isolates the closing member
        // observation: dev/ino/size/blocks/timestamps cannot mask its removal.
        return opening as never
      })
      const observe = (additional?: number) => { guardCalls++; f.guard(additional) }
      try {
        if (maskClosingMembers) expect(() => f.inventory(observe)).not.toThrow()
        else expect(() => f.inventory(observe)).toThrow(mutation === "replacement" ? "LEAN_BASELINE_CONTINUATION_V2_INVENTORY_CHANGED" : "LEAN_BASELINE_CONTINUATION_V4_SPENT_CHANGED")
        expect(changed).toBe(true); expect(phases.slice(0, 3)).toEqual(["opening.stat", "opening.members", "opening.members"])
        expect(phases).toContain("closing.stat"); expect(closingMembers).toBe(mutation === "members-only")
        expect(f.guard).toHaveBeenCalledTimes(guardCalls); expect(guardCalls).toBeGreaterThan(10)
      } finally { read.mockRestore(); stat.mockImplementation(actualStat) }
    })
    probe()
    // Sensitivity witness, not weakened production: masking only this closing
    // observation makes the stable-stat fixture erroneously acceptable, so the
    // real refusal assertion above would fail if the closing check disappeared.
    if (mutation === "members-only") probe(true)
  })
  it("keeps sealed directories metadata-only with the real producer kind and fresh guard", () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "continuation-v5-sealed-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir)
    try {
      fs.mkdirSync(resolve(".planning/artifacts"), { recursive: true }); fs.mkdirSync(resolve(".strategy-lab/sealed-inert"), { recursive: true }); writeFileSync(resolve(".strategy-lab/sealed-inert/payload"), "private fixture")
      vi.mocked(fs.readFileSync).mockClear(); const rows = continuation.inventoryLeanContinuationSurvivorsV2([], [], () => { throw new Error("unexpected Git") }, () => {})
      expect(rows.find(row => row.path === ".strategy-lab/sealed-inert")?.kind).toBe("directory"); expect(vi.mocked(fs.readFileSync)).not.toHaveBeenCalled()
      const guard = continuation.createLeanContinuationIdentityGuardV2([], rows); guard(); writeFileSync(resolve(".strategy-lab/sealed-inert/new"), "unopened fixture"); expect(guard).toThrow(); expect(vi.mocked(fs.readFileSync)).not.toHaveBeenCalled()
    } finally { cwd.mockRestore(); rmSync(dir, { recursive: true }) }
  })
})
describe("[continuation-v4] finite namespace and spent-cost isolation", () => {
  const window = () => { const { root: _, ...body } = { ...continuationWindowFixtureV2(), routeNamespace: "20261012-v4" as const }; return { ...body, root: labRoot(body.schemaVersion, body) } }
  it("selects only exact fixed requests and whole validated windows, preserving V3 bytes", () => {
    const before = ledger.leanCanonicalBytes(continuationWindowFixtureV2())
    expect(ledger.leanBaselineContinuationPathsForWindowV2(window())).toEqual(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4)
    expect(ledger.leanBaselineContinuationPathsForWindowV2(continuationWindowFixtureV2())).toEqual(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2)
    expect(ledger.leanBaselineContinuationPathsForRequestV2(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4.request)).toEqual(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4)
    expect(ledger.leanBaselineContinuationPathsForRequestV2(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.request)).toEqual(ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2)
    for (const path of ["other", `${ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.request}/extra`, ledger.LEAN_BASELINE_CONTINUATION_PATHS.request]) expect(() => ledger.leanBaselineContinuationPathsForRequestV2(path)).toThrow()
    for (const change of [{ routeNamespace: "20261012-v5" }, { status: "pending" }, { capMs: 1 }]) expect(() => ledger.leanBaselineContinuationPathsForWindowV2({ ...window(), ...change } as never)).toThrow()
    const { root: _, ...body } = { ...continuationAllocationFixtureV2(), window: window(), windowBytesRoot: ledger.leanBytesRoot(ledger.leanCanonicalBytes(window())) }
    const allocation = ledger.validateLeanBaselineContinuationAllocationV2({ ...body, root: labRoot(body.schemaVersion, body) })
    const paths = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4
    expect(ledger.leanWritablePaths(allocation)).toEqual([paths.temp, paths.allocation, paths.request, paths.window])
    expect(ledger.leanCanonicalBytes(continuationWindowFixtureV2())).toEqual(before)
  })
  it("selects bounded Git allocation metadata without admitting crossed allocations or refs", async () => {
    const { readLeanBaselineContinuationGitV2 } = await import("./v1-38-lean-container-match-session.js")
    const exec = vi.mocked(childProcess.execFileSync).mockReturnValue(Buffer.from("synthetic")), head = "a".repeat(40)
    try {
      const path = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4.allocation
      readLeanBaselineContinuationGitV2(["show", `${head}:${path}`], [], window())
      expect(exec).toHaveBeenLastCalledWith("git", ["show", `${head}:${path}`], { stdio: ["ignore", "pipe", "ignore"], timeout: 1500, maxBuffer: 262144 })
      readLeanBaselineContinuationGitV2(["show", `${head}:${ledger.LEAN_BASELINE_CONTINUATION_PATHS.allocation}`], [], window())
      for (const path of [ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.allocation, "arbitrary.json"]) expect(() => readLeanBaselineContinuationGitV2(["show", `${head}:${path}`], [], window())).toThrow(/METADATA/)
      const crossed = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2.allocation
      expect(() => readLeanBaselineContinuationGitV2(["show", `${head}:${crossed}`], [{ path: crossed, root: r("crossed") }], window())).toThrow(/METADATA/)
      expect(() => readLeanBaselineContinuationGitV2(["show", `HEAD:${path}`], [], window())).toThrow(/METADATA/)
      expect(() => readLeanBaselineContinuationGitV2(["show", `${head}:${path}`], [])).toThrow(/METADATA/)
    } finally { exec.mockReset() }
  })
  it("keeps synthetic V3 cost rows once under V4 reconciliation, rejecting selected future and shrink", () => {
    const old = ledger.LEAN_BASELINE_CONTINUATION_PATHS, spent = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2
    const rows = [spent.request, spent.window].map(path => ({ path, kind: "file" as const, bytes: 1, allocatedBytes: 4096, dev: 1, ino: path === spent.request ? 1 : 2, mode: 0o600, mtimeMs: 1, ctimeMs: 1, rawRoot: r(path) }))
    expect(() => continuation.reconcileLeanContinuationInventoryV2(rows, rows, [], window())).not.toThrow()
    const consumed = [old.request, old.allocation, old.store, old.temp].map(path => ({ path, allocatedBytes: 4096 }))
    const debit = continuation.reconcileLeanContinuationV2DiskDebit(16384, rows, 49152, [...rows, ...consumed], window())
    expect(debit).toMatchObject({ allocatedDiskBytes: 49152, residualDiskBytes: 24576, newRows: 0 })
    for (const changed of [rows.slice(1), rows.map((row, i) => i ? row : { ...row, mode: 0o644 }), rows.map((row, i) => i ? row : { ...row, allocatedBytes: 0 }), rows.map((row, i) => i ? row : { ...row, rawRoot: r("mutated") })]) expect(() => continuation.reconcileLeanContinuationInventoryV2(rows, changed, [], window())).toThrow()
    expect(() => continuation.reconcileLeanContinuationV2DiskDebit(16384, rows, 49152, [...rows, ...consumed, { path: ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4.request, allocatedBytes: 4096 }], window())).toThrow(/SCOPE/)
  })
  it("does not reanchor the same approved window or admit full36 after its unchanged frontier", () => {
    const { root: _, ...body } = { ...window(), approvedAtMs: 1791840227000, anchorMs: 1791840227000, carryMs: 492285903, capMs: 521085903, deadlineMs: 1791869027000 }
    const w = { ...body, root: labRoot(body.schemaVersion, body) }
    const { root: _allocationRoot, ...allocationBody } = { ...continuationAllocationFixtureV2(), caps: { ...ledger.LEAN_CAPS, elapsedMs: w.capMs }, window: w, windowBytesRoot: ledger.leanBytesRoot(ledger.leanCanonicalBytes(w)) }
    const a = ledger.validateLeanBaselineContinuationAllocationV2({ ...allocationBody, root: labRoot(allocationBody.schemaVersion, allocationBody) })
    const frontier = w.deadlineMs - 36 * ledger.LEAN_CAPS.matchMs - w.closureMs - w.offlineOverheadMs
    expect(frontier).toBe(1791844967000)
    const sample = { nowMs: frontier + 1, monotonicElapsedMs: frontier + 1 - w.anchorMs, remainingSlots: 36, charged: 50, retainedBytes: 88924160, scratchBytes: 0, parentRssBytes: 0, childRssBytes: 0, arrayBuffersBytes: 0, availableMemoryBytes: 4000000000, freeBytes: 16000000000, live: true }
    expect(() => continuation.assertLeanBaselineContinuationFrontierV2(a, sample)).toThrow(/CAPACITY/)
    expect(ledger.leanBaselineContinuationElapsedFloorV2(w, sample.nowMs)).toBe(492285903 + sample.monotonicElapsedMs)
  })
  it("authenticates actual isolated spent metadata and refuses synthetic bytes rather than inventing matching anchors", () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "continuation-v4-inert-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir)
    try {
      fs.mkdirSync(join(dir, ".strategy-lab")); fs.mkdirSync(join(dir, ".planning/artifacts"), { recursive: true })
      const spent = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V2, selected = ledger.LEAN_BASELINE_CONTINUATION_PATHS_V4
      writeFileSync(resolve(selected.request), "ignored active request", { mode: 0o600 })
      writeFileSync(resolve(spent.request), Buffer.alloc(4041, 97), { mode: 0o600 }); writeFileSync(resolve(spent.window), Buffer.alloc(935, 97), { mode: 0o600 })
      const git = vi.fn(() => { throw new Error("unexpected Git") }), guard = vi.fn()
      expect(() => continuation.inventoryLeanContinuationSurvivorsV2([], [], git, guard, window())).toThrow(/V3_SPENT_METADATA/)
      expect(guard).toHaveBeenCalledWith(4041); expect(git).not.toHaveBeenCalled()
      fs.unlinkSync(resolve(spent.request)); expect(() => continuation.inventoryLeanContinuationSurvivorsV2([], [], git, guard, window())).toThrow()
    } finally { cwd.mockRestore(); rmSync(dir, { recursive: true }) }
  })
})
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
