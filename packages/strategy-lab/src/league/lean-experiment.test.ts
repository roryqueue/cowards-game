import { mkdtempSync, realpathSync, rmSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, it } from "vitest"
import { labRoot, LAB_ADMITTED_ROOTS } from "../contracts.js"
import { beginLeanInterval, closeLeanInterval, readLeanTimeAccounting } from "./lean-experiment.js"
import { writeLeanAll, createLeanAllocation, chargeLeanSlot, createLeanLedger, retainLeanMatch, verifyLeanEvidence, chooseLeanTier, encodeLeanReplay, decodeLeanReplay, leanSchedule, readLeanLedger } from "./lean-experiment.js"

const dirs: string[] = []
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) })
const pin = labRoot("test", 1)
it("finishes short writes and rejects zero progress", () => {
  const positions: number[] = []
  writeLeanAll(0, new Uint8Array(7), ((_fd: number, _bytes: Uint8Array, offset: number) => { positions.push(offset); return Math.min(2, 7 - offset) }) as never)
  expect(positions).toEqual([0, 2, 4, 6])
  expect(() => writeLeanAll(0, new Uint8Array(7), (() => 0) as never)).toThrow("PUBLICATION")
})
const allocation = () => createLeanAllocation({ sourceRoot: pin, reviewRoot: pin, candidateRoots: [pin, labRoot("test", 2)], seed: "lean-pilot-test" })
const ledger = () => { const p = realpathSync(mkdtempSync(join(tmpdir(), "lean-test-"))); dirs.push(p); return createLeanLedger(join(p, "evidence"), allocation()) }
it("charges failed-entry and retained-verifier intervals without mutating outcomes", () => {
  const l = ledger()
  const now = Date.now()
  beginLeanInterval(l, "entry", now)
  chargeLeanSlot(l, l.allocation.slots[0]!, { freeBytes: 20e9, availableMemoryBytes: 2e9 })
  closeLeanInterval(l, "entry", now + 1500)
  beginLeanInterval(l, "verifier", now + 2000); closeLeanInterval(l, "verifier", now + 3200)
  expect(readLeanTimeAccounting(l).elapsedMs).toBe(2700)
  expect(readLeanLedger(l).charged).toBe(1)
  expect(() => beginLeanInterval(l, "entry", 4300)).toThrow("TIME_ACTIVE")
  beginLeanInterval(l, "next-stage", 5000)
  expect(readLeanTimeAccounting(l).elapsedMs).toBe(28_800_000)
  expect(() => beginLeanInterval(l, "replacement", 6000)).toThrow("TIME_ACTIVE")
})
it("enumerates exact balanced200/128 tiers, eight distinct pilot cells and committed hash sample", () => {
  expect(leanSchedule("full")).toHaveLength(200); expect(leanSchedule("reduced")).toHaveLength(128)
  const a = allocation(); expect(a.slots).toHaveLength(8); expect(new Set(a.slots.map(s => s.requestRoot)).size).toBe(8)
  expect(a.sampleSlotRoots).toHaveLength(1); expect(a.tupleRoot).toBe(LAB_ADMITTED_ROOTS.tupleRoot)
  expect(() => createLeanAllocation({ ...a, candidateRoots: [pin, pin] } as never)).toThrow()
})
it("requires same-process capacity before durable unique charge and disallows reset/refund", () => {
  const l = ledger(), a = l.allocation, s = a.slots[0]!
  expect(() => chargeLeanSlot(l, s, { freeBytes: 1, availableMemoryBytes: 2e9 })).toThrow("CAPACITY")
  chargeLeanSlot(l, s, { freeBytes: 20e9, availableMemoryBytes: 2e9 })
  expect(() => chargeLeanSlot(l, s, { freeBytes: 20e9, availableMemoryBytes: 2e9 })).toThrow("CHARGED")
  expect(() => createLeanLedger(l.directory, a)).toThrow()
  expect(readLeanLedger(l).charged).toBe(1)
})
it("authenticates bounded gzip and rejects legacy references, corruption and decoded bombs", () => {
  const p = encodeLeanReplay([{ kind: "safe", value: 3 }])
  expect(decodeLeanReplay(p.container, p.bytes)).toEqual([{ kind: "safe", value: 3 }])
  expect(() => decodeLeanReplay({ schemaVersion: "league-execution-ref-v2" } as never, p.bytes)).toThrow()
  expect(() => decodeLeanReplay(p.container, p.bytes.map(b => b ^ 1))).toThrow()
  expect(() => decodeLeanReplay(p.container, p.bytes, 1)).toThrow()
})
it("retains every failure and exact all-slot accounting without source or memory leakage", () => {
  const l = ledger(), s = l.allocation.slots[0]!
  const charge = chargeLeanSlot(l, s, { freeBytes: 20e9, availableMemoryBytes: 2e9 })
  retainLeanMatch(l, charge, { classification: "system_failure", code: "SUPERVISOR_FAILURE", outcome: null, elapsedMs: 4, cleanupComplete: true, invocationCount: 0, accountingRoot: pin, executionRoot: pin, telemetry: { transitions: 0, events: 0 } }, [])
  expect(verifyLeanEvidence(l).records).toHaveLength(8)
  expect(readLeanLedger(l).charged).toBe(1)
  expect(() => retainLeanMatch(l, charge, { source: "secret" } as never, [])).toThrow()
})
it("chooses tiers from conservative resource maxima only, with no invented speed factor", () => {
  expect(chooseLeanTier({ pilotCells: 8, maximumCellMs: 1000, maximumCellPhysicalBytes: 1000, elapsedMs: 8000, physicalHighWaterBytes: 10000, scratchHighWaterBytes: 1000 })).toBe("full")
  expect(chooseLeanTier({ pilotCells: 8, maximumCellMs: 80000, maximumCellPhysicalBytes: 1000, elapsedMs: 640000, physicalHighWaterBytes: 10000, scratchHighWaterBytes: 1000 })).toBe("reduced")
  expect(chooseLeanTier({ pilotCells: 8, maximumCellMs: 200000, maximumCellPhysicalBytes: 1000, elapsedMs: 1600000, physicalHighWaterBytes: 10000, scratchHighWaterBytes: 1000 })).toBe("feasibility_not_established")
})
it("denies symlink stores", () => {
  const p = mkdtempSync(join(tmpdir(), "lean-symlink-")); dirs.push(p); symlinkSync(p, join(p, "alias"))
  expect(() => createLeanLedger(join(p, "alias"), allocation())).toThrow()
})
