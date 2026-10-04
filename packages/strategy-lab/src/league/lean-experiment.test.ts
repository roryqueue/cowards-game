import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, expect, it } from "vitest"
import { labRoot, LAB_ADMITTED_ROOTS } from "../contracts.js"
import { beginLeanInterval, closeLeanInterval, readLeanTimeAccounting, LEAN_FAILED_PREFIX, LEAN_DISK_APPROVAL, LEAN_PROSPECTIVE_WRITABLE_PATHS, LEAN_SUCCESSOR_WRITABLE_PATHS, LEAN_V4_WRITABLE_PATHS, LEAN_V5_WRITABLE_PATHS, LEAN_CLOSED_V2, LEAN_CLOSED_V3, LEAN_CLOSED_V4, createLeanProspectiveDiskBasis, verifyLeanProspectiveDiskBasis, createLeanClosedV2Predecessor, verifyLeanClosedV2Predecessor, createLeanClosedV3Predecessor, verifyLeanClosedV3Predecessor, createLeanClosedV4Predecessor, verifyLeanClosedV4Predecessor, leanWritablePaths, verifyLeanFailedPrefix, verifyLeanFailedWriteInventory, deriveLeanChildTerminal, readLeanChildTerminal, readLeanCumulativeAccounting, leanBytesRoot, leanCanonicalBytes, type LeanExperimentAllocationV2, type LeanExperimentAllocationV3, type LeanExperimentAllocationV4, type LeanExperimentAllocationV5, type LeanExperimentLedger } from "./lean-experiment.js"
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
const inertClosedV2 = () => {
  const c = LEAN_CLOSED_V2
  return {
    raw: { allocation: c.allocationBytesRoot, canonical: c.allocationBytesRoot, request: c.requestBytesRoot, entry: c.entryBytesRoot, terminal: c.terminalBytesRoot, time: c.timeBytesRoot, charge: c.emptyChargeBytesRoot, report: c.terminalReportBytesRoot },
    storeFiles: ["allocation.json", "child-terminal.json", "entry.json", "ledger.ndjson", "time.ndjson"], allocationRoot: c.allocationRoot, sourceRoot: c.sourceRoot, heldHead: c.heldHead,
    entry: { allocationRoot: c.allocationRoot, sourceRoot: c.sourceRoot, requestBytesRoot: c.requestBytesRoot, head: c.heldHead, parentPid: 86485, childPid: 86519 },
    terminal: { entryBytesRoot: c.entryBytesRoot, allocationRoot: c.allocationRoot, sourceRoot: c.sourceRoot, head: c.heldHead, parentPid: 86485, childPid: 86519, elapsedUpperBoundMs: c.terminalElapsedUpperBoundMs, physicalBytes: c.terminalPhysicalBytes, status: "child_failed", signal: "SIGTERM", exitCode: null },
    timeElapsedMs: c.elapsedUpperBoundMs, timeStarts: 1, timeCloses: 1, chargedMatches: 0, resultExists: false,
    v1DiskBasisRoot: c.v1DiskBasisRoot, v1SurvivingAllocatedBytes: c.v1SurvivingAllocatedBytes,
    v2Survivors: [
      { identity: c.storeIdentity, allocatedBytes: 0 },
      { identity: `${c.storeIdentity}/allocation.json`, allocatedBytes: 8192 },
      { identity: `${c.storeIdentity}/child-terminal.json`, allocatedBytes: 4096 },
      { identity: `${c.storeIdentity}/entry.json`, allocatedBytes: 4096 },
      { identity: `${c.storeIdentity}/ledger.ndjson`, allocatedBytes: 0 },
      { identity: `${c.storeIdentity}/time.ndjson`, allocatedBytes: 4096 },
      { identity: c.requestIdentity, allocatedBytes: 4096 },
      { identity: c.canonicalIdentity, allocatedBytes: 8192 },
      { identity: LEAN_PROSPECTIVE_WRITABLE_PATHS[0], allocatedBytes: 0 },
    ],
  }
}
const inertClosedV3 = () => {
  const c = LEAN_CLOSED_V3
  return {
    raw: { allocation: c.allocationBytesRoot, canonical: c.allocationBytesRoot, request: c.requestBytesRoot, entry: c.entryBytesRoot, receipt: c.receiptBytesRoot, terminal: c.terminalBytesRoot, time: c.timeBytesRoot, charge: c.emptyChargeBytesRoot, report: c.terminalReportBytesRoot },
    storeFiles: ["allocation.json", "child-terminal.json", "entry-failure.json", "entry.json", "ledger.ndjson", "time.ndjson"], allocationRoot: c.allocationRoot, sourceRoot: c.sourceRoot, heldHead: c.heldHead,
    entry: { allocationRoot: c.allocationRoot, sourceRoot: c.sourceRoot, requestBytesRoot: c.requestBytesRoot, head: c.heldHead, parentPid: 13322, childPid: 13351 },
    terminal: { entryBytesRoot: c.entryBytesRoot, allocationRoot: c.allocationRoot, sourceRoot: c.sourceRoot, head: c.heldHead, parentPid: 13322, childPid: 13351, elapsedUpperBoundMs: c.terminalElapsedUpperBoundMs, physicalBytes: c.terminalPhysicalBytes, status: "child_failed", signal: null, exitCode: 1 },
    receipt: { type: "lean-child-failure", schemaVersion: "lean-child-failure-v1", code: "UNKNOWN_INTERNAL_FAILURE", stage: "unknown" },
    timeElapsedMs: c.elapsedUpperBoundMs, timeStarts: 1, timeCloses: 1, chargedMatches: 0, resultExists: false,
    priorPredecessorRoot: c.priorPredecessorRoot, priorMeasuredSurvivingAllocatedBytes: c.priorMeasuredSurvivingAllocatedBytes, priorConservativeAllocatedBytes: c.priorConservativeAllocatedBytes,
    v3Survivors: [
      { identity: c.storeIdentity, allocatedBytes: 0 },
      { identity: `${c.storeIdentity}/allocation.json`, allocatedBytes: 8192 },
      { identity: `${c.storeIdentity}/child-terminal.json`, allocatedBytes: 4096 },
      { identity: `${c.storeIdentity}/entry-failure.json`, allocatedBytes: 4096 },
      { identity: `${c.storeIdentity}/entry.json`, allocatedBytes: 4096 },
      { identity: `${c.storeIdentity}/ledger.ndjson`, allocatedBytes: 0 },
      { identity: `${c.storeIdentity}/time.ndjson`, allocatedBytes: 4096 },
      { identity: c.requestIdentity, allocatedBytes: 4096 },
      { identity: c.canonicalIdentity, allocatedBytes: 8192 },
      { identity: LEAN_SUCCESSOR_WRITABLE_PATHS[0], allocatedBytes: 0 },
    ],
  }
}
const inertClosedV4 = () => {
  const c = LEAN_CLOSED_V4
  return {
    raw: { allocation: c.allocationBytesRoot, canonical: c.allocationBytesRoot, request: c.requestBytesRoot, entry: c.entryBytesRoot, receipt: c.receiptBytesRoot, terminal: c.terminalBytesRoot, time: c.timeBytesRoot, charge: c.emptyChargeBytesRoot, report: c.terminalReportBytesRoot },
    storeFiles: ["allocation.json", "child-terminal.json", "entry-failure.json", "entry.json", "ledger.ndjson", "time.ndjson"], allocationRoot: c.allocationRoot, sourceRoot: c.sourceRoot, heldHead: c.heldHead,
    entry: { allocationRoot: c.allocationRoot, sourceRoot: c.sourceRoot, requestBytesRoot: c.requestBytesRoot, head: c.heldHead, parentPid: 19433, childPid: 19465 },
    terminal: { entryBytesRoot: c.entryBytesRoot, allocationRoot: c.allocationRoot, sourceRoot: c.sourceRoot, head: c.heldHead, parentPid: 19433, childPid: 19465, elapsedUpperBoundMs: c.terminalElapsedUpperBoundMs, physicalBytes: c.terminalPhysicalBytes, status: "child_failed", signal: null, exitCode: 1 },
    receipt: { type: "lean-child-failure", schemaVersion: "lean-child-failure-v1", code: "FACTORY_ASSESSMENT_IMPORT_PROJECTION_LIMIT", stage: "unknown" },
    timeElapsedMs: c.elapsedUpperBoundMs, timeStarts: 1, timeCloses: 1, chargedMatches: 0, resultExists: false,
    priorPredecessorRoot: c.priorPredecessorRoot, priorMeasuredSurvivingAllocatedBytes: c.priorMeasuredSurvivingAllocatedBytes, priorConservativeAllocatedBytes: c.priorConservativeAllocatedBytes,
    v4Survivors: [
      { identity: c.storeIdentity, allocatedBytes: 0 },
      { identity: `${c.storeIdentity}/allocation.json`, allocatedBytes: 8192 },
      { identity: `${c.storeIdentity}/child-terminal.json`, allocatedBytes: 4096 },
      { identity: `${c.storeIdentity}/entry-failure.json`, allocatedBytes: 4096 },
      { identity: `${c.storeIdentity}/entry.json`, allocatedBytes: 4096 },
      { identity: `${c.storeIdentity}/ledger.ndjson`, allocatedBytes: 0 },
      { identity: `${c.storeIdentity}/time.ndjson`, allocatedBytes: 4096 },
      { identity: c.requestIdentity, allocatedBytes: 4096 },
      { identity: c.canonicalIdentity, allocatedBytes: 8192 },
      { identity: LEAN_V4_WRITABLE_PATHS[0], allocatedBytes: 0 },
    ],
  }
}
it("binds closed v4 projection-limit receipt and carries all prior cost once", () => {
  const observed = inertClosedV4(), p = createLeanClosedV4Predecessor(observed)
  expect(p).toMatchObject({ elapsedUpperBoundMs: 1_402_442, chargedMatches: 0, historicalPeakDiskBytes: "unknown", priorMeasuredSurvivingAllocatedBytes: 90_112, priorConservativeAllocatedBytes: 212_992, v4SurvivingAllocatedBytes: 36_864, measuredSurvivingAllocatedBytes: 126_976, cumulativeConservativeFloorBytes: 249_856, terminalPhysicalBytes: 311_296, allocatedDiskBytes: 311_296 })
  expect(verifyLeanClosedV4Predecessor(p, observed).root).toBe(p.root)
  for (const changed of [
    { ...observed, raw: { ...observed.raw, report: pin } },
    { ...observed, raw: { ...observed.raw, receipt: pin } },
    { ...observed, receipt: { ...observed.receipt, code: "UNKNOWN_INTERNAL_FAILURE" } },
    { ...observed, heldHead: "b".repeat(40) },
    { ...observed, entry: { ...observed.entry, requestBytesRoot: pin } },
    { ...observed, terminal: { ...observed.terminal, childPid: 1 } },
    { ...observed, terminal: { ...observed.terminal, elapsedUpperBoundMs: 0 } },
    { ...observed, timeElapsedMs: 1_362_476 },
    { ...observed, chargedMatches: 1 },
    { ...observed, priorPredecessorRoot: pin },
    { ...observed, priorConservativeAllocatedBytes: 0 },
    { ...observed, storeFiles: observed.storeFiles.slice(1) },
    { ...observed, resultExists: true },
    { ...observed, v4Survivors: [...observed.v4Survivors.slice(0, 9), observed.v4Survivors[8]!] },
  ]) expect(() => createLeanClosedV4Predecessor(changed)).toThrow("SUCCESSOR_PREDECESSOR")
  const drift = { ...observed, v4Survivors: observed.v4Survivors.map((item, i) => i === 3 ? { ...item, allocatedBytes: 8192 } : item) }
  expect(() => verifyLeanClosedV4Predecessor(p, drift)).toThrow("SUCCESSOR_PREDECESSOR")
  expect(() => verifyLeanClosedV4Predecessor({ ...p, allocatedDiskBytes: 249_856 }, observed)).toThrow("SUCCESSOR_PREDECESSOR")
})
it("binds closed v3 failure receipt and report without resetting time or double-counting old floors", () => {
  const observed = inertClosedV3(), p = createLeanClosedV3Predecessor(observed)
  expect(p).toMatchObject({ elapsedUpperBoundMs: 1_362_476, chargedMatches: 0, historicalPeakDiskBytes: "unknown", priorMeasuredSurvivingAllocatedBytes: 53_248, priorConservativeAllocatedBytes: 114_688, v3SurvivingAllocatedBytes: 36_864, measuredSurvivingAllocatedBytes: 90_112, terminalPhysicalBytes: 212_992, allocatedDiskBytes: 212_992 })
  expect(verifyLeanClosedV3Predecessor(p, observed).root).toBe(p.root)
  for (const changed of [
    { ...observed, raw: { ...observed.raw, report: pin } },
    { ...observed, raw: { ...observed.raw, receipt: pin } },
    { ...observed, receipt: { ...observed.receipt, code: "ALLOCATION" } },
    { ...observed, heldHead: "b".repeat(40) },
    { ...observed, entry: { ...observed.entry, requestBytesRoot: pin } },
    { ...observed, terminal: { ...observed.terminal, childPid: 1 } },
    { ...observed, terminal: { ...observed.terminal, elapsedUpperBoundMs: 0 } },
    { ...observed, timeElapsedMs: 1_323_030 },
    { ...observed, chargedMatches: 1 },
    { ...observed, priorPredecessorRoot: pin },
    { ...observed, priorConservativeAllocatedBytes: 0 },
    { ...observed, storeFiles: observed.storeFiles.slice(1) },
    { ...observed, resultExists: true },
    { ...observed, v3Survivors: [...observed.v3Survivors.slice(0, 9), observed.v3Survivors[8]!] },
  ]) expect(() => createLeanClosedV3Predecessor(changed)).toThrow("SUCCESSOR_PREDECESSOR")
  const drift = { ...observed, v3Survivors: observed.v3Survivors.map((item, i) => i === 3 ? { ...item, allocatedBytes: 8192 } : item) }
  expect(() => verifyLeanClosedV3Predecessor(p, drift)).toThrow("SUCCESSOR_PREDECESSOR")
  expect(() => verifyLeanClosedV3Predecessor({ ...p, allocatedDiskBytes: 151_552 }, observed)).toThrow("SUCCESSOR_PREDECESSOR")
})
it("binds closed v2 lineage and carries its time and conservative disk snapshot exactly once", () => {
  const observed = inertClosedV2(), p = createLeanClosedV2Predecessor(observed)
  expect(p).toMatchObject({ elapsedUpperBoundMs: 1_323_030, chargedMatches: 0, historicalPeakDiskBytes: "unknown", v1SurvivingAllocatedBytes: 20_480, v2SurvivingAllocatedBytes: 32_768, measuredSurvivingAllocatedBytes: 53_248, terminalPhysicalBytes: 114_688, allocatedDiskBytes: 114_688 })
  expect(verifyLeanClosedV2Predecessor(p, observed).root).toBe(p.root)
  for (const changed of [
    { ...observed, raw: { ...observed.raw, report: pin } },
    { ...observed, heldHead: "b".repeat(40) },
    { ...observed, entry: { ...observed.entry, requestBytesRoot: pin } },
    { ...observed, terminal: { ...observed.terminal, parentPid: 1 } },
    { ...observed, terminal: { ...observed.terminal, elapsedUpperBoundMs: 0 } },
    { ...observed, timeElapsedMs: 565_459 },
    { ...observed, chargedMatches: 1 },
    { ...observed, v1DiskBasisRoot: pin },
    { ...observed, storeFiles: [...observed.storeFiles, "result.json"] },
    { ...observed, v2Survivors: [...observed.v2Survivors.slice(0, 8), observed.v2Survivors[7]!] },
  ]) expect(() => createLeanClosedV2Predecessor(changed)).toThrow("SUCCESSOR_PREDECESSOR")
  const drift = { ...observed, v2Survivors: observed.v2Survivors.map((item, i) => i === 2 ? { ...item, allocatedBytes: 8192 } : item) }
  expect(() => verifyLeanClosedV2Predecessor(p, drift)).toThrow("SUCCESSOR_PREDECESSOR")
  expect(() => verifyLeanClosedV2Predecessor({ ...p, allocatedDiskBytes: 53_248 }, observed)).toThrow("SUCCESSOR_PREDECESSOR")
})
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
const v3Ledger = (): LeanExperimentLedger => {
  const p = realpathSync(mkdtempSync(join(tmpdir(), "lean-v3-test-"))); dirs.push(p)
  const { root: _v1Root, schemaVersion: _v1Version, ...base } = allocation()
  const predecessor = createLeanClosedV2Predecessor(inertClosedV2())
  const body = { ...base, schemaVersion: "lean-experiment-allocation-v3" as const, predecessor }
  const a: LeanExperimentAllocationV3 = { ...body, root: labRoot("lean-experiment-allocation-v3", body) }
  const directory = join(p, "evidence"); mkdirSync(directory, { mode: 0o700 })
  writeFileSync(join(directory, "allocation.json"), leanCanonicalBytes(a))
  writeFileSync(join(directory, "ledger.ndjson"), "")
  writeFileSync(join(directory, "time.ndjson"), "")
  return { directory, allocation: a }
}
const v4Ledger = (): LeanExperimentLedger => {
  const p = realpathSync(mkdtempSync(join(tmpdir(), "lean-v4-test-"))); dirs.push(p)
  const { root: _v1Root, schemaVersion: _v1Version, ...base } = allocation()
  const predecessor = createLeanClosedV3Predecessor(inertClosedV3())
  const body = { ...base, schemaVersion: "lean-experiment-allocation-v4" as const, predecessor }
  const a: LeanExperimentAllocationV4 = { ...body, root: labRoot("lean-experiment-allocation-v4", body) }
  const directory = join(p, "evidence"); mkdirSync(directory, { mode: 0o700 })
  writeFileSync(join(directory, "allocation.json"), leanCanonicalBytes(a))
  writeFileSync(join(directory, "ledger.ndjson"), "")
  writeFileSync(join(directory, "time.ndjson"), "")
  return { directory, allocation: a }
}
const v5Ledger = (): LeanExperimentLedger => {
  const p = realpathSync(mkdtempSync(join(tmpdir(), "lean-v5-test-"))); dirs.push(p)
  const { root: _v1Root, schemaVersion: _v1Version, ...base } = allocation()
  const predecessor = createLeanClosedV4Predecessor(inertClosedV4())
  const body = { ...base, schemaVersion: "lean-experiment-allocation-v5" as const, predecessor }
  const a: LeanExperimentAllocationV5 = { ...body, root: labRoot("lean-experiment-allocation-v5", body) }
  const directory = join(p, "evidence"); mkdirSync(directory, { mode: 0o700 })
  writeFileSync(join(directory, "allocation.json"), leanCanonicalBytes(a))
  writeFileSync(join(directory, "ledger.ndjson"), "")
  writeFileSync(join(directory, "time.ndjson"), "")
  return { directory, allocation: a }
}
it("routes future disk strictly by allocation version and never refunds closed predecessor budgets", () => {
  const old = ledger(), middle = v2Ledger(), successor = v3Ledger(), next = v4Ledger(), fifth = v5Ledger()
  expect(leanWritablePaths(old.allocation)).toEqual([])
  expect(leanWritablePaths(middle.allocation)).toEqual(LEAN_PROSPECTIVE_WRITABLE_PATHS)
  expect(leanWritablePaths(successor.allocation)).toEqual(LEAN_SUCCESSOR_WRITABLE_PATHS)
  expect(leanWritablePaths(next.allocation)).toEqual(LEAN_V4_WRITABLE_PATHS)
  expect(leanWritablePaths(fifth.allocation)).toEqual(LEAN_V5_WRITABLE_PATHS)
  expect(new Set([...LEAN_PROSPECTIVE_WRITABLE_PATHS, ...LEAN_SUCCESSOR_WRITABLE_PATHS, ...LEAN_V4_WRITABLE_PATHS, ...LEAN_V5_WRITABLE_PATHS]).size).toBe(12)
  expect(readLeanTimeAccounting(successor).elapsedMs).toBe(1_323_030)
  expect(readLeanTimeAccounting(next).elapsedMs).toBe(1_362_476)
  expect(readLeanTimeAccounting(fifth).elapsedMs).toBe(1_402_442)
  expect(() => assertLeanPublicationCapacity(successor, 8192, 12_000_000_000 - 114_688 - 4096)).toThrow("RESOURCE")
  expect(() => assertLeanPublicationCapacity(next, 8192, 12_000_000_000 - 212_992 - 4096)).toThrow("RESOURCE")
  expect(() => assertLeanPublicationCapacity(fifth, 8192, 12_000_000_000 - 311_296 - 4096)).toThrow("RESOURCE")
  beginLeanInterval(successor, "pilot-entry", 1_791_065_426_248)
  expect(readLeanTimeAccounting(successor).elapsedMs).toBe(28_800_000)
  beginLeanInterval(next, "pilot-entry", 1_791_068_676_374)
  expect(readLeanTimeAccounting(next).elapsedMs).toBe(28_800_000)
  beginLeanInterval(fifth, "pilot-entry", 1_791_107_663_980)
  expect(readLeanTimeAccounting(fifth).elapsedMs).toBe(28_800_000)
})
it("rejects a near-cap v5 store before any write or predecessor reader", () => {
  const fixture = v5Ledger(), destination = join(dirname(fixture.directory), "denied-v5")
  const a = fixture.allocation as LeanExperimentAllocationV5
  const nearCap = { ...a, predecessor: { ...a.predecessor, allocatedDiskBytes: 12_000_000_000 - 4096 } }
  expect(() => createLeanLedger(destination, nearCap)).toThrow("RESOURCE")
  expect(existsSync(destination)).toBe(false)
})
it("rejects a near-cap v4 store before any write or predecessor reader", () => {
  const fixture = v4Ledger(), destination = join(dirname(fixture.directory), "denied-v4")
  const a = fixture.allocation as LeanExperimentAllocationV4
  const nearCap = { ...a, predecessor: { ...a.predecessor, allocatedDiskBytes: 12_000_000_000 - 4096 } }
  expect(() => createLeanLedger(destination, nearCap)).toThrow("RESOURCE")
  expect(existsSync(destination)).toBe(false)
})
it("rejects a near-cap successor store before writing and without opening predecessor records", () => {
  const fixture = v3Ledger(), destination = join(dirname(fixture.directory), "denied-successor")
  const a = fixture.allocation as LeanExperimentAllocationV3
  const nearCap = { ...a, predecessor: { ...a.predecessor, allocatedDiskBytes: 12_000_000_000 - 4096 } }
  expect(() => createLeanLedger(destination, nearCap)).toThrow("RESOURCE")
  expect(existsSync(destination)).toBe(false)
})
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
