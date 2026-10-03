import { mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, it } from "vitest"
import { labRoot, LAB_ADMITTED_ROOTS } from "../contracts.js"
import { beginLeanInterval, closeLeanInterval, readLeanTimeAccounting, LEAN_FAILED_PREFIX, createLeanAllocationV2, admitLeanAllocation, verifyLeanFailedPrefix, verifyLeanFailedWriteInventory, publishLeanChildEntry, deriveLeanChildTerminal, publishLeanChildTerminal, readLeanChildTerminal, readLeanCumulativeAccounting, leanBytesRoot, leanCanonicalBytes } from "./lean-experiment.js"
import { assertLeanPublicationCapacity } from "./lean-experiment.js"
import { writeLeanAll, createLeanAllocation, chargeLeanSlot, createLeanLedger, retainLeanMatch, verifyLeanEvidence, chooseLeanTier, encodeLeanReplay, decodeLeanReplay, leanSchedule, readLeanLedger } from "./lean-experiment.js"

const dirs: string[] = []
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) })
const pin = labRoot("test", 1)
it("requires a reviewed exact failed-prefix write inventory and debits its conservative upper bound", () => {
  const inventory = { schemaVersion: "lean-failed-prefix-write-inventory-v1", failedHead: "1da8d11393359ffb23b96e15cc87513e49a0fbea", entryPid: 66239, storeAllocatedBytes: 12_288, sourcePrefixWrites: [".strategy-lab/lean-experiment-20261003", ".strategy-lab/lean-pilot-request-20261003-v2.json", ".planning/artifacts/v1.38-lean-pilot-allocation-v1.json"], otherWritableDestinations: [{ path: ".strategy-lab/lean-pilot-request-20261003-v2.json", kind: "source", allocatedBytes: 4096, upperBoundBytes: 4096, evidenceRoot: pin }, { path: ".planning/artifacts/v1.38-lean-pilot-allocation-v1.json", kind: "source", allocatedBytes: 4096, upperBoundBytes: 4096, evidenceRoot: pin }, { path: "/cores/core.66239", kind: "core", allocatedBytes: 0, upperBoundBytes: 1_000_000, evidenceRoot: pin }, { path: "/tmp/tsx-cache", kind: "runtime-cache", allocatedBytes: 4096, upperBoundBytes: 8192, evidenceRoot: pin }], reviewer: "/root/independent-write-review", completenessEvidenceRoot: pin, scope: "complete_source_runtime_and_crash_destinations" }
  const checked = verifyLeanFailedWriteInventory(inventory)
  expect(checked.allocatedDiskBytes).toBe(1_028_672)
  for (const changed of [{ ...inventory, reviewer: "" }, { ...inventory, sourcePrefixWrites: [] }, { ...inventory, otherWritableDestinations: [] }, { ...inventory, otherWritableDestinations: [{ ...inventory.otherWritableDestinations[0], upperBoundBytes: 0 }] }, { ...inventory, scope: "store_only" }]) expect(() => verifyLeanFailedWriteInventory(changed)).toThrow("PREDECESSOR_INVENTORY")
})
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
it("refuses oversized frame streams and near-cap publication before writing", () => {
  const l = ledger(), before = readLeanLedger(l).events.length
  let produced = 0
  function* frames() { for (let i = 0; i < 100; i++) { produced++; yield { value: "x".repeat(500) } } }
  expect(() => encodeLeanReplay(frames(), 4000)).toThrow("REPLAY_LIMIT")
  expect(produced).toBeLessThan(100)
  expect(() => assertLeanPublicationCapacity(l, 8192, 12_000_000_000 - 4096)).toThrow("RESOURCE")
  expect(readLeanLedger(l).events.length).toBe(before)
  const charge = chargeLeanSlot(l, l.allocation.slots.find(s => !l.allocation.sampleSlotRoots.includes(s.root))!, { freeBytes: 20e9, availableMemoryBytes: 2e9 })
  const unsampled = { [Symbol.iterator]() { throw new Error("must not create redacted replay") } }
  retainLeanMatch(l, charge, { classification: "success", code: "OK", outcome: "DRAW", elapsedMs: 4, cleanupComplete: true, invocationCount: 0, accountingRoot: pin, executionRoot: pin, telemetry: { transitions: 0, events: 0 } }, unsampled)
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
const v2Ledger = () => {
  const p = realpathSync(mkdtempSync(join(tmpdir(), "lean-v2-test-"))); dirs.push(p)
  const a = createLeanAllocationV2({ sourceRoot: pin, reviewRoot: pin, candidateRoots: [pin, labRoot("test", 2)], seed: "prospective-test" })
  return createLeanLedger(join(p, "evidence"), a)
}
const v2Entry = (l: ReturnType<typeof v2Ledger>) => ({ schemaVersion: "lean-child-entry-v2" as const, allocationRoot: l.allocation.root, sourceRoot: l.allocation.sourceRoot, requestBytesRoot: pin, head: "a".repeat(40), parentPid: 100, childPid: 101, handshakeRoot: pin, wallStartMs: 1_791_100_000_000, monotonicStartNs: "1000000000" })
const enterV2 = (l: ReturnType<typeof v2Ledger>) => { const entry = v2Entry(l); publishLeanChildEntry(l, entry); beginLeanInterval(l, "pilot-entry", entry.wallStartMs); return entry }
it("carries exact failed prefix without changing v1 open-time burn or inventing RSS", () => {
  const old = ledger(); beginLeanInterval(old, "pilot-entry", 1_791_038_553_541)
  expect(readLeanTimeAccounting(old).elapsedMs).toBe(28_800_000)
  const l = v2Ledger()
  expect(l.allocation.root).not.toBe(old.allocation.root)
  expect(readLeanTimeAccounting(l).elapsedMs).toBe(565_459)
  expect(readLeanLedger(l)).toMatchObject({ charged: 0, elapsedMs: 565_459, physicalHighWaterBytes: 12_288 })
  expect(LEAN_FAILED_PREFIX.oldPeakRss).toBe("unknown")
  expect(() => admitLeanAllocation({ ...l.allocation, predecessor: { ...LEAN_FAILED_PREFIX, chargedMatches: 1 } })).toThrow("ALLOCATION")
})
it("rejects any omitted, duplicated, downgraded or forged predecessor binding", () => {
  const p = LEAN_FAILED_PREFIX
  const observed = { allocation: p.oldAllocationBytesRoot, canonicalAllocation: p.oldAllocationBytesRoot, request: p.oldRequestBytesRoot, entry: p.oldEntryBytesRoot, time: p.oldTimeBytesRoot, charge: p.oldChargeBytesRoot, report: p.terminalReportBytesRoot, decision: p.approvedDecisionBytesRoot, storeFiles: ["allocation.json", "entry.json", "ledger.ndjson", "time.ndjson"], physicalBytes: p.allocatedDiskBytes, oldResultExists: false }
  expect(verifyLeanFailedPrefix(observed)).toBe(p)
  for (const changed of [{ ...observed, entry: pin }, { ...observed, decision: pin }, { ...observed, physicalBytes: 0 }, { ...observed, storeFiles: [...observed.storeFiles, "result.json"] }, { ...observed, storeFiles: observed.storeFiles.slice(1) }, { ...observed, oldResultExists: true }]) expect(() => verifyLeanFailedPrefix(changed)).toThrow("PREDECESSOR")
})
it("parent-observed exit uses the conservative larger clock and publishes one durable failure witness", () => {
  const l = v2Ledger(), e = enterV2(l)
  const terminal = deriveLeanChildTerminal(l, e, { exitCode: 134, signal: null, wallObservedMs: e.wallStartMs + 900, monotonicObservedNs: "2000000001", status: "child_failed", parentRssBytes: 120_000_000, childRssObservedBytes: 300_000_000, physicalBytes: 100_000, freeBytes: 20_000_000_000 })
  expect(terminal.elapsedUpperBoundMs).toBe(1001)
  expect(terminal.entryBytesRoot).toBe(leanBytesRoot(leanCanonicalBytes(e)))
  publishLeanChildTerminal(l, terminal)
  expect(readLeanChildTerminal(l)).toEqual(terminal)
  expect(readLeanCumulativeAccounting(l)).toMatchObject({ elapsedMs: 566_460, charged: 0, active: false })
  expect(() => publishLeanChildTerminal(l, terminal)).toThrow()
})
it("fails closed on parent crash, torn terminal, and prospective cap overrun", () => {
  const crashed = v2Ledger(); enterV2(crashed)
  expect(readLeanTimeAccounting(crashed).elapsedMs).toBe(28_800_000)
  expect(() => readLeanCumulativeAccounting(crashed)).toThrow()
  writeFileSync(join(crashed.directory, "child-terminal.json"), "{\"incomplete\":")
  expect(() => readLeanChildTerminal(crashed)).toThrow()
  const exceeded = v2Ledger(), e = enterV2(exceeded)
  const terminal = deriveLeanChildTerminal(exceeded, e, { exitCode: null, signal: "SIGKILL", wallObservedMs: e.wallStartMs + 28_800_000, monotonicObservedNs: "28801000000000", status: "child_failed", parentRssBytes: 100_000_000, childRssObservedBytes: null, physicalBytes: 100_000, freeBytes: null })
  publishLeanChildTerminal(exceeded, terminal)
  expect(() => readLeanCumulativeAccounting(exceeded)).toThrow("TERMINAL")
  expect(() => chargeLeanSlot(exceeded, exceeded.allocation.slots[0]!, { freeBytes: 20e9, availableMemoryBytes: 2e9 })).toThrow()
})
