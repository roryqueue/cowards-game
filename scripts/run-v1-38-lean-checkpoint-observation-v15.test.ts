import { expect, it, vi } from "vitest"
import { checkpointLeanObservationV15 } from "./lib/v1-38-lean-checkpoint-observation-v15.js"
import * as correction from "./run-v1-38-lean-correction.js"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const allocation = () => {
  const r = (n: number) => labRoot("NON_AUTHORIZING_checkpoint", n), b = lean.LEAN_RESOURCE_WINDOW_V15_POLICY
  const p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 36, elapsedUpperBoundMs: 208771903, allocatedDiskBytes: 24780800, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r(1), survivors: Array.from({ length: 854 }, (_, n) => ({ identity: `.strategy-lab/NON_AUTHORIZING-history-${n}`, allocatedBytes: 0 })) }
  return lean.createLeanSupervisorCorrectionAllocation({ sourceRoot: r(2), reviewRoot: r(3), coldRoot: r(4), planRoot: b.planRoot, candidateRoots: [r(5), r(6)], requestRoots: [r(7)], seed: "non-authorizing-host", route: "diagnostic", reuseGrantRoot: r(8), supervisorDecisionRoot: b.approvalRoot, acceptedCheckRoot: null, requestBytesRoot: r(9), dataReviewRoot: r(10), setupAccountingRoot: r(11), predecessor: { ...p, root: labRoot(p.schemaVersion, p) }, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, timeboxExtension: b, attemptOrdinal: 2, priorClosureRoot: r(12), continuationRoot: r(13), acceptedReaderCloseRoot: null }, 8)
}

const fixture = () => {
  const ops = {
    assertParent: vi.fn(), authenticateAllocation: vi.fn(),
    childRss: vi.fn(() => ({ current: 100, maximum: 200 })), parentRss: vi.fn(() => 300),
    freeBytes: vi.fn(() => 15000000000), elapsedMs: vi.fn(() => 210000000), physicalBytes: vi.fn(() => 25000000),
    charged: vi.fn(() => 37), availableMemoryBytes: vi.fn(() => 2000000000), disk: vi.fn(() => ({ bufferBytes: 400, scratchBytes: 500 })),
    prefix: vi.fn(() => 500), correction: vi.fn(() => 600), diskGuard: vi.fn(),
  }
  return ops
}
it("observes once per call, admits allocation twice, and forwards identical projected actual guard operands", () => {
  const o = fixture()
  expect(checkpointLeanObservationV15(o, 7)).toBe(600)
  expect(o.prefix).toHaveBeenCalledWith({ childRss: 207, parentRss: 300, freeBytes: 15000000000, allocatedBytes: 25000000, elapsedMs: 210000000 })
  expect(o.correction).toHaveBeenCalledWith({ childRss: 207, parentRss: 300, freeBytes: 15000000000, physicalBytes: 25000000, elapsedMs: 210000000, charged: 37, availableMemoryBytes: 2000000000 })
  expect(o.diskGuard).toHaveBeenCalledWith({ physicalBytes: 25000000, bufferBytes: 407, scratchBytes: 500 })
  for (const k of ["childRss", "parentRss", "freeBytes", "elapsedMs", "physicalBytes", "charged", "availableMemoryBytes", "disk"] as const) expect(o[k]).toHaveBeenCalledTimes(1)
  expect(o.authenticateAllocation).toHaveBeenCalledTimes(2)
  checkpointLeanObservationV15(o)
  expect(o.prefix.mock.calls[1][0].childRss).toBe(200)
  expect(o.authenticateAllocation).toHaveBeenCalledTimes(4)
  expect(o.physicalBytes).toHaveBeenCalledTimes(2)
})
it.each(["assertParent", "authenticateAllocation", "physicalBytes", "charged", "disk", "elapsedMs"] as const)("propagates fresh %s refusal without suppressing it", key => {
  const o = fixture(); o[key].mockImplementation(() => { throw new Error("INERT_DRIFT") })
  expect(() => checkpointLeanObservationV15(o)).toThrow("INERT_DRIFT")
})
it("refuses allocation drift during observation before any guard", () => {
  const o = fixture(); o.authenticateAllocation.mockImplementationOnce(() => {}).mockImplementationOnce(() => { throw new Error("ALLOCATION_DRIFT") })
  expect(() => checkpointLeanObservationV15(o)).toThrow("ALLOCATION_DRIFT")
  expect(o.prefix).not.toHaveBeenCalled()
})
it.each([NaN, Infinity, -1, 0.5, Number.MAX_SAFE_INTEGER + 1])("refuses malformed observations and projections %s", n => {
  const o = fixture(); o.parentRss.mockReturnValue(n)
  expect(() => checkpointLeanObservationV15(o)).toThrow()
  expect(() => checkpointLeanObservationV15(fixture(), n)).toThrow()
})
it("does not reuse time, RSS, survivor, disk, memory or ledger values across calls", () => {
  const o = fixture(); checkpointLeanObservationV15(o)
  o.elapsedMs.mockReturnValue(220000000); o.childRss.mockReturnValue({ current: 900, maximum: 1000 }); o.parentRss.mockReturnValue(1200)
  o.physicalBytes.mockReturnValue(35000000); o.charged.mockReturnValue(38); o.freeBytes.mockReturnValue(14000000000); o.availableMemoryBytes.mockReturnValue(1000000000); o.disk.mockReturnValue({ bufferBytes: 600, scratchBytes: 700 })
  checkpointLeanObservationV15(o, 9)
  expect(o.correction.mock.calls[1][0]).toEqual({ elapsedMs: 220000000, charged: 38, physicalBytes: 35000000, childRss: 1009, parentRss: 1200, freeBytes: 14000000000, availableMemoryBytes: 1000000000 })
  expect(o.diskGuard.mock.calls[1][0]).toEqual({ physicalBytes: 35000000, bufferBytes: 609, scratchBytes: 700 })
})
it("actual selected correction composition enforces projected max RSS, exact RAM and disk/time/reserve boundaries", () => {
  const a = allocation(), o = fixture(), b = lean.LEAN_RESOURCE_WINDOW_V15_POLICY
  o.parentRss.mockReturnValue(1000000000)
  const child = b.memoryBytes - b.externalReserveBytes - b.guardBytes - 1000000000
  o.childRss.mockReturnValue({ current: child - 1, maximum: child })
  expect(correction.assertLeanCorrectionCheckpointV15(a, o)).toBe(b.memoryBytes)
  expect(() => correction.assertLeanCorrectionCheckpointV15(a, o, 1)).toThrow()
  o.childRss.mockReturnValue({ current: 100, maximum: 200 })
  o.disk.mockReturnValue({ bufferBytes: lean.LEAN_CAPS.scratchBytes - 500, scratchBytes: 500 })
  expect(() => correction.assertLeanCorrectionCheckpointV15(a, o)).not.toThrow()
  expect(() => correction.assertLeanCorrectionCheckpointV15(a, o, 1)).toThrow("CAPACITY")
  o.disk.mockReturnValue({ bufferBytes: 400, scratchBytes: 500 })
  o.elapsedMs.mockReturnValue(b.elapsedMs - b.reserveMs - lean.LEAN_CAPS.matchMs - 1)
  expect(() => correction.assertLeanCorrectionCheckpointV15(a, o)).not.toThrow()
  o.elapsedMs.mockReturnValue(b.elapsedMs - b.reserveMs - lean.LEAN_CAPS.matchMs)
  expect(() => correction.assertLeanCorrectionCheckpointV15(a, o)).toThrow()
})
it.each(["parentRss", "availableMemoryBytes", "freeBytes", "charged"] as const)("actual guards reject fresh deteriorated %s on the next call", key => {
  const a = allocation(), o = fixture(); correction.assertLeanCorrectionCheckpointV15(a, o)
  o[key].mockReturnValue(key === "charged" ? 300 : key === "parentRss" ? 3000000000 : 0)
  expect(() => correction.assertLeanCorrectionCheckpointV15(a, o)).toThrow()
})
it("actual allocation admission catches on-disk replacement before entry and during observation; ledger admission stays fresh", () => {
  const before = process.cwd(), dir = realpathSync(mkdtempSync(join(tmpdir(), "NON_AUTHORIZING-checkpoint-")))
  try {
    process.chdir(dir); mkdirSync(".strategy-lab", { mode: 0o700 })
    const a = allocation(), paths = lean.leanCorrectionRoutePaths("diagnostic", "v15-2"), ledger = lean.createLeanLedger(paths.store, a), o = fixture()
    o.authenticateAllocation.mockImplementation(() => correction.authenticateLeanCheckpointAllocationV15(ledger, a))
    o.charged.mockImplementation(() => lean.readLeanLedger(ledger).charged)
    expect(() => correction.assertLeanCorrectionCheckpointV15(a, o)).not.toThrow()
    const changed = { ...a, sourceRoot: labRoot("INERT_DRIFT", 1) }
    o.disk.mockImplementation(() => { writeFileSync(join(ledger.directory, "allocation.json"), lean.leanCanonicalBytes(changed)); return { bufferBytes: 400, scratchBytes: 500 } })
    expect(() => correction.assertLeanCorrectionCheckpointV15(a, o)).toThrow()
    expect(() => correction.authenticateLeanCheckpointAllocationV15(ledger, a)).toThrow()
  } finally { process.chdir(before); rmSync(dir, { recursive: true, force: true }) }
})
