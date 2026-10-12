/** Inert continuation contracts; never touches canonical empirical paths. */
import { describe, expect, it } from "vitest"
import { mkdtempSync, writeFileSync, symlinkSync, rmSync, realpathSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import * as ledger from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as continuation from "./v1-38-lean-baseline-continuation.js"

const r = (value: unknown) => labRoot("inert-continuation-fixture", value)
export const continuationAllocationFixture = () => {
  const predecessorBody = { schemaVersion: "lean-baseline-continuation-carry-v1" as const, chargedMatches: 43 as const, elapsedUpperBoundMs: 415746903 as const, allocatedDiskBytes: 4096, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, custodyRoot: r("custody"), inventoryRoot: r("inventory"), qualifiedReaderAuthority: "cost_only" as const }
  return ledger.createLeanBaselineContinuationAllocation({ sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: r("plan"), candidateRoots: [r("a"), r("b")], requestRoots: Array.from({ length: 36 }, (_, n) => r(n)), seed: "inert-continuation", sourceHead: "a".repeat(40), planningRoot: r("planning"), requestBytesRoot: r("request"), offlineOverheadMs: 60000, predecessor: { ...predecessorBody, root: labRoot(predecessorBody.schemaVersion, predecessorBody) } })
}

describe("prospective baseline continuation allocation", () => {
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
