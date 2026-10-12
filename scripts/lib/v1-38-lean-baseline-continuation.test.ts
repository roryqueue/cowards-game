/** Inert continuation contracts; never touches canonical empirical paths. */
import { describe, expect, it, vi } from "vitest"
import { mkdtempSync, writeFileSync, symlinkSync, rmSync, realpathSync } from "node:fs"
import * as childProcess from "node:child_process"
import * as baseline from "../run-v1-38-lean-baseline.js"
import { readLeanBaselineContinuationGit } from "./v1-38-lean-container-match-session.js"
import { createHash } from "node:crypto"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import * as ledger from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as continuation from "./v1-38-lean-baseline-continuation.js"

vi.mock("node:child_process", async importOriginal => ({ ...await importOriginal<typeof import("node:child_process")>(), execFileSync: vi.fn() }))

const r = (value: unknown) => labRoot("inert-continuation-fixture", value)
export const continuationAllocationFixture = () => {
  const predecessorBody = { schemaVersion: "lean-baseline-continuation-carry-v1" as const, chargedMatches: 43 as const, elapsedUpperBoundMs: 415746903 as const, allocatedDiskBytes: 4096, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, custodyRoot: r("custody"), inventoryRoot: r("inventory"), qualifiedReaderAuthority: "cost_only" as const }
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
    expect(ledger.leanCapsForAllocation(a).elapsedMs).toBe(444546903)
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
    expect(continuation.assertLeanBaselineContinuationFrontier(a, sample)).toBe(415747903)
    expect(continuation.assertLeanBaselineContinuationFrontier(a, { ...sample, remainingSlots: 0, charged: 44 })).toBe(415747903)
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
