import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, expect, it } from "vitest"
import { labRoot, LAB_ADMITTED_ROOTS } from "../contracts.js"
import { beginLeanInterval, closeLeanInterval, readLeanTimeAccounting, LEAN_FAILED_PREFIX, LEAN_DISK_APPROVAL, LEAN_PROSPECTIVE_WRITABLE_PATHS, createLeanProspectiveDiskBasis, verifyLeanProspectiveDiskBasis, verifyLeanFailedPrefix, verifyLeanFailedWriteInventory, deriveLeanChildTerminal, readLeanChildTerminal, readLeanCumulativeAccounting, leanBytesRoot, leanCanonicalBytes, type LeanExperimentAllocationV2, type LeanExperimentLedger } from "./lean-experiment.js"
import { assertLeanPublicationCapacity } from "./lean-experiment.js"
import { writeLeanAll, createLeanAllocation, chargeLeanSlot, createLeanLedger, retainLeanMatch, verifyLeanEvidence, chooseLeanTier, encodeLeanReplay, decodeLeanReplay, leanSchedule, readLeanLedger } from "./lean-experiment.js"

const dirs: string[] = []
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) })
const pin = labRoot("test", 1)
const approvedDiskBytes = readFileSync(LEAN_DISK_APPROVAL.identity)
const inertSurvivors = () => [
  { identity: `${LEAN_FAILED_PREFIX.oldStoreIdentity}/allocation.json`, bytesRoot: LEAN_FAILED_PREFIX.oldAllocationBytesRoot, allocatedBytes: 4096 },
  { identity: `${LEAN_FAILED_PREFIX.oldStoreIdentity}/entry.json`, bytesRoot: LEAN_FAILED_PREFIX.oldEntryBytesRoot, allocatedBytes: 4096 },
  { identity: `${LEAN_FAILED_PREFIX.oldStoreIdentity}/ledger.ndjson`, bytesRoot: LEAN_FAILED_PREFIX.oldChargeBytesRoot, allocatedBytes: 0 },
  { identity: `${LEAN_FAILED_PREFIX.oldStoreIdentity}/time.ndjson`, bytesRoot: LEAN_FAILED_PREFIX.oldTimeBytesRoot, allocatedBytes: 4096 },
  { identity: ".strategy-lab/lean-pilot-request-20261003-v2.json", bytesRoot: LEAN_FAILED_PREFIX.oldRequestBytesRoot, allocatedBytes: 4096 },
  { identity: LEAN_FAILED_PREFIX.oldCanonicalAllocationIdentity, bytesRoot: LEAN_FAILED_PREFIX.oldAllocationBytesRoot, allocatedBytes: 4096 },
]
it("binds only surviving predecessor blocks under the separately approved unknown-peak basis", () => {
  const survivors = inertSurvivors(), basis = createLeanProspectiveDiskBasis(survivors, 0, approvedDiskBytes)
  expect(basis.historicalPeakDiskBytes).toBe("unknown")
  expect(basis.survivingAllocatedBytes).toBe(20_480)
  expect(basis.diskApproval.bytesRoot).toBe(leanBytesRoot(approvedDiskBytes))
  expect(verifyLeanProspectiveDiskBasis(basis, survivors, 0, approvedDiskBytes).root).toBe(basis.root)
  expect(LEAN_PROSPECTIVE_WRITABLE_PATHS).toEqual([".strategy-lab/lean-experiment-20261003-v2-tmp", ".planning/artifacts/v1.38-lean-pilot-allocation-v2.json", ".strategy-lab/lean-pilot-request-20261003-v3.json"])
  for (const bytes of [Buffer.alloc(0), Buffer.from(LEAN_FAILED_PREFIX.approvedDecisionBytesRoot), Buffer.concat([approvedDiskBytes, Buffer.from("tamper")])]) expect(() => createLeanProspectiveDiskBasis(survivors, 0, bytes)).toThrow("DISK_BASIS")
  for (const claim of [{ ...basis, historicalPeakDiskBytes: 0 }, { ...basis, diskApproval: { ...basis.diskApproval, identity: LEAN_FAILED_PREFIX.approvedDecisionIdentity } }, { ...basis, survivors: basis.survivors.slice(1) }, { ...basis, survivingAllocatedBytes: 0 }, { ...basis, root: pin }]) expect(() => verifyLeanProspectiveDiskBasis(claim, survivors, 0, approvedDiskBytes)).toThrow("DISK_BASIS")
  expect(() => verifyLeanProspectiveDiskBasis(basis, survivors.map((item, i) => i === 4 ? { ...item, allocatedBytes: 8192 } : item), 0, approvedDiskBytes)).toThrow("DISK_BASIS")
  expect(() => createLeanProspectiveDiskBasis([...survivors.slice(0, 5), survivors[4]!], 0, approvedDiskBytes)).toThrow("DISK_BASIS")
  expect(() => createLeanProspectiveDiskBasis(survivors.map((item, i) => i === 4 ? { ...item, allocatedBytes: 12_000_000_000 } : item), 0, approvedDiskBytes)).toThrow("DISK_BASIS")
})
it("denies self-asserted historical cache/core bounds even with a reviewer and matching path inventory", () => {
  const inventory = { schemaVersion: "lean-failed-prefix-write-inventory-v1", failedHead: "1da8d11393359ffb23b96e15cc87513e49a0fbea", entryPid: 66239, storeAllocatedBytes: 12_288, sourcePrefixWrites: [".strategy-lab/lean-experiment-20261003", ".strategy-lab/lean-pilot-request-20261003-v2.json", ".planning/artifacts/v1.38-lean-pilot-allocation-v1.json"], otherWritableDestinations: [{ path: ".strategy-lab/lean-pilot-request-20261003-v2.json", kind: "source", allocatedBytes: 4096, upperBoundBytes: 4096, evidenceRoot: pin }, { path: ".planning/artifacts/v1.38-lean-pilot-allocation-v1.json", kind: "source", allocatedBytes: 4096, upperBoundBytes: 4096, evidenceRoot: pin }, { path: "/cores/core.66239", kind: "core", allocatedBytes: 0, upperBoundBytes: 1_000_000, evidenceRoot: pin }, { path: "/tmp/tsx-cache", kind: "runtime-cache", allocatedBytes: 4096, upperBoundBytes: 8192, evidenceRoot: pin }], reviewer: "/root/independent-write-review", completenessEvidenceRoot: pin, scope: "complete_source_runtime_and_crash_destinations" }
  expect(() => verifyLeanFailedWriteInventory(inventory)).toThrow("PREDECESSOR_HISTORICAL_BOUND")
  const assertedZeros = { ...inventory, otherWritableDestinations: inventory.otherWritableDestinations.map(destination => ["core", "runtime-cache"].includes(destination.kind) ? { ...destination, allocatedBytes: 0, upperBoundBytes: 0 } : destination) }
  expect(() => verifyLeanFailedWriteInventory(assertedZeros)).toThrow("PREDECESSOR_HISTORICAL_BOUND")
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
/** Inert file-backed arithmetic fixture, deliberately never passed to the
 * production v2 allocation/ledger constructors. Its synthetic basis is
 * not historical disk proof or preparation authority. */
const v2Ledger = (): LeanExperimentLedger => {
  const p = realpathSync(mkdtempSync(join(tmpdir(), "lean-v2-test-"))); dirs.push(p)
  const { root: _v1Root, schemaVersion: _v1Version, ...base } = allocation()
  const diskBasis = createLeanProspectiveDiskBasis(inertSurvivors(), 0, approvedDiskBytes)
  const body = { ...base, schemaVersion: "lean-experiment-allocation-v2" as const, predecessor: { ...LEAN_FAILED_PREFIX, allocatedDiskBytes: diskBasis.survivingAllocatedBytes, diskBasis } }
  const a: LeanExperimentAllocationV2 = { ...body, root: labRoot("lean-experiment-allocation-v2", body) }
  const directory = join(p, "evidence"); mkdirSync(directory, { mode: 0o700 })
  writeFileSync(join(directory, "allocation.json"), leanCanonicalBytes(a))
  writeFileSync(join(directory, "ledger.ndjson"), "")
  writeFileSync(join(directory, "time.ndjson"), "")
  return { directory, allocation: a }
}
it("rejects a near-cap v2 store before its directory or first file exists", () => {
  const fixture = v2Ledger(), destination = join(dirname(fixture.directory), "denied-store")
  const a = fixture.allocation as LeanExperimentAllocationV2
  const nearCap = { ...a, predecessor: { ...a.predecessor, allocatedDiskBytes: 12_000_000_000 - 4096 } }
  expect(() => createLeanLedger(destination, nearCap)).toThrow("RESOURCE")
  expect(existsSync(destination)).toBe(false)
})
const v2Entry = (l: ReturnType<typeof v2Ledger>) => ({ schemaVersion: "lean-child-entry-v2" as const, allocationRoot: l.allocation.root, sourceRoot: l.allocation.sourceRoot, requestBytesRoot: pin, head: "a".repeat(40), parentPid: 100, childPid: 101, handshakeRoot: pin, wallStartMs: 1_791_100_000_000, monotonicStartNs: "1000000000" })
const timeLine = (kind: "start" | "close", atMs: number) => Buffer.from(leanCanonicalBytes({ kind, id: "pilot-entry", atMs })).toString("utf8") + "\n"
const enterV2 = (l: ReturnType<typeof v2Ledger>) => { const entry = v2Entry(l); writeFileSync(join(l.directory, "entry.json"), leanCanonicalBytes(entry)); writeFileSync(join(l.directory, "time.ndjson"), timeLine("start", entry.wallStartMs)); return entry }
const retainV2Terminal = (l: ReturnType<typeof v2Ledger>, entry: ReturnType<typeof v2Entry>, terminal: ReturnType<typeof deriveLeanChildTerminal>) => { writeFileSync(join(l.directory, "child-terminal.json"), leanCanonicalBytes(terminal)); writeFileSync(join(l.directory, "time.ndjson"), timeLine("start", entry.wallStartMs) + timeLine("close", entry.wallStartMs + terminal.elapsedUpperBoundMs)) }
it("keeps failed-prefix arithmetic inert without claiming real v2 admission", () => {
  const old = ledger(); beginLeanInterval(old, "pilot-entry", 1_791_038_553_541)
  expect(readLeanTimeAccounting(old).elapsedMs).toBe(28_800_000)
  const l = v2Ledger()
  expect(l.allocation.root).not.toBe(old.allocation.root)
  expect(readLeanTimeAccounting(l).elapsedMs).toBe(565_459)
  expect(LEAN_FAILED_PREFIX.oldPeakRss).toBe("unknown")
  expect((l.allocation as LeanExperimentAllocationV2).predecessor.chargedMatches).toBe(0)
  expect((l.allocation as LeanExperimentAllocationV2).predecessor.allocatedDiskBytes).toBe(20_480)
})
it("rejects any omitted, duplicated, downgraded or forged predecessor binding", () => {
  const p = LEAN_FAILED_PREFIX
  const observed = { allocation: p.oldAllocationBytesRoot, canonicalAllocation: p.oldAllocationBytesRoot, request: p.oldRequestBytesRoot, entry: p.oldEntryBytesRoot, time: p.oldTimeBytesRoot, charge: p.oldChargeBytesRoot, report: p.terminalReportBytesRoot, decision: p.approvedDecisionBytesRoot, storeFiles: ["allocation.json", "entry.json", "ledger.ndjson", "time.ndjson"], physicalBytes: p.allocatedDiskBytes, oldResultExists: false }
  expect(verifyLeanFailedPrefix(observed)).toBe(p)
  for (const changed of [{ ...observed, entry: pin }, { ...observed, decision: pin }, { ...observed, physicalBytes: 0 }, { ...observed, storeFiles: [...observed.storeFiles, "result.json"] }, { ...observed, storeFiles: observed.storeFiles.slice(1) }, { ...observed, oldResultExists: true }]) expect(() => verifyLeanFailedPrefix(changed)).toThrow("PREDECESSOR")
})
it("reopens an inert parent-observed failure witness with the conservative larger clock", () => {
  const l = v2Ledger(), e = enterV2(l)
  const terminal = deriveLeanChildTerminal(l, e, { exitCode: 134, signal: null, wallObservedMs: e.wallStartMs + 900, monotonicObservedNs: "2000000001", status: "child_failed", parentRssBytes: 120_000_000, childRssObservedBytes: 300_000_000, physicalBytes: 100_000, freeBytes: 20_000_000_000 })
  expect(terminal.elapsedUpperBoundMs).toBe(1001)
  expect(terminal.entryBytesRoot).toBe(leanBytesRoot(leanCanonicalBytes(e)))
  retainV2Terminal(l, e, terminal)
  expect(readLeanChildTerminal(l)).toEqual(terminal)
  expect(readLeanTimeAccounting(l)).toMatchObject({ elapsedMs: 566_460, active: false })
  writeFileSync(join(l.directory, "child-terminal.json"), leanCanonicalBytes({ ...terminal, elapsedUpperBoundMs: 1000 }))
  expect(() => readLeanChildTerminal(l)).toThrow("TERMINAL")
})
it("fails closed on parent crash, torn terminal, and prospective cap overrun", () => {
  const crashed = v2Ledger(); enterV2(crashed)
  expect(readLeanTimeAccounting(crashed).elapsedMs).toBe(28_800_000)
  expect(() => readLeanChildTerminal(crashed)).toThrow()
  writeFileSync(join(crashed.directory, "child-terminal.json"), "{\"incomplete\":")
  expect(() => readLeanChildTerminal(crashed)).toThrow()
  const exceeded = v2Ledger(), e = enterV2(exceeded)
  const terminal = deriveLeanChildTerminal(exceeded, e, { exitCode: null, signal: "SIGKILL", wallObservedMs: e.wallStartMs + 28_800_000, monotonicObservedNs: "28801000000000", status: "child_failed", parentRssBytes: 100_000_000, childRssObservedBytes: null, physicalBytes: 100_000, freeBytes: null })
  retainV2Terminal(exceeded, e, terminal)
  expect(() => readLeanChildTerminal(exceeded)).toThrow("TERMINAL")
  expect(() => chargeLeanSlot(exceeded, exceeded.allocation.slots[0]!, { freeBytes: 20e9, availableMemoryBytes: 2e9 })).toThrow()
})
