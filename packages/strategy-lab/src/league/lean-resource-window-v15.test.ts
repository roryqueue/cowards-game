/** Portable NON-AUTHORIZING resource contracts; no routes, provider or Match. */
import { expect, it, vi } from "vitest"
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { labRoot } from "../contracts.js"
import * as lean from "./lean-experiment.js"

const r = (n: number) => labRoot("NON_AUTHORIZING_v15_contract", n)
const input = () => {
  const p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 36, elapsedUpperBoundMs: 208771903, allocatedDiskBytes: 24780800, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r(1), survivors: Array.from({ length: 854 }, (_, n) => ({ identity: `.strategy-lab/NON_AUTHORIZING-metadata-${n}`, allocatedBytes: 0 })) }
  const b = lean.LEAN_RESOURCE_WINDOW_V15_POLICY
  return { sourceRoot: r(2), reviewRoot: r(3), coldRoot: r(4), planRoot: b.planRoot, candidateRoots: [r(5), r(6)], requestRoots: [r(7)], seed: "non-authorizing-v15", route: "diagnostic" as const, reuseGrantRoot: r(8), supervisorDecisionRoot: b.approvalRoot, acceptedCheckRoot: null, requestBytesRoot: r(9), dataReviewRoot: r(10), setupAccountingRoot: r(11), predecessor: { ...p, root: labRoot(p.schemaVersion, p) }, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, timeboxExtension: b, attemptOrdinal: 2 as const, priorClosureRoot: r(12), continuationRoot: r(13), acceptedReaderCloseRoot: null }
}

it("reconstructs allocation policy without caching mutable caller values or widening disk", () => {
  const a = lean.createLeanSupervisorCorrectionAllocation(input(), 8)
  expect(lean.leanSupervisorAllocationMode(a)).toBe("v15-2")
  expect(lean.leanResourcePolicyForAllocationV15(a)).toBe(lean.LEAN_RESOURCE_WINDOW_V15_POLICY)
  expect(lean.leanCapsForAllocation(a)).toEqual({ ...lean.LEAN_CAPS, elapsedMs: 223171903 })
  for (const fields of [{ attemptOrdinal: 1 }, { attemptOrdinal: 6 }, { caps: { ...a.caps, scratchBytes: 3000000000 } }, { sourceRoot: r(99) }, { extra: true }, { timeboxExtension: { ...a.timeboxExtension, reserveMs: 0 } }]) expect(() => lean.leanResourcePolicyForAllocationV15({ ...a, ...fields })).toThrow()
  const mutable = JSON.parse(JSON.stringify(a))
  expect(lean.leanResourcePolicyForAllocationV15(mutable)).toBe(lean.LEAN_RESOURCE_WINDOW_V15_POLICY)
  mutable.caps.totalBytes++
  expect(() => lean.leanResourcePolicyForAllocationV15(mutable)).toThrow()
  expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...input(), attemptOrdinal: 1 }, 8)).toThrow()
})

it("enumerates only four unused global resource-window ordinals", () => {
  for (const mode of ["v15-2", "v15-3", "v15-4", "v15-5"]) expect(lean.isLeanResourceWindowModeV15(mode)).toBe(true)
  for (const mode of ["v15-1", "v15-6", "v15-02", "v14-2", null, {}]) expect(lean.isLeanResourceWindowModeV15(mode)).toBe(false)
})

it("roots the approved continuous window and separates memory from unchanged disk", () => {
  const p = lean.LEAN_RESOURCE_WINDOW_V15_POLICY, { root, ...body } = p
  expect(root).toBe(labRoot(p.schemaVersion, body))
  expect(p).toMatchObject({ memoryBytes: 3000000000, externalReserveBytes: 512000000, guardBytes: 335544320, priorElapsedMs: 108000000, startedAtMs: 1791455941097, elapsedMs: 223171903, absoluteDeadlineMs: 1791571113000, reserveMs: 1860000, excludedIdleMs: 0, charged: 36 })
  expect(lean.admitLeanRetryTimeboxExtension(p)).toBe(p)
  expect(() => lean.admitLeanRetryTimeboxExtension({ ...p, memoryBytes: 3000000001 })).toThrow()
  expect(() => lean.admitLeanRetryTimeboxExtension({ ...p, undocumented: true })).toThrow()
  expect(lean.leanRetryRootElapsedFloorV8(1791556713000, p)).toBe(208771903)
  expect(lean.leanRetryRootElapsedFloorV8(1791571113000, p)).toBe(223171903)
  expect(lean.LEAN_CAPS.scratchBytes).toBe(2000000000)
  expect(lean.LEAN_POST_V13_FIVE_PAIR_V14_CAPS.elapsedMs).toBe(165600000)
})

it("checks all aggregate operands and exact boundary without accepting a caller ceiling", () => {
  const p = lean.LEAN_RESOURCE_WINDOW_V15_POLICY
  expect(lean.assertLeanAggregateMemoryV15({ parentRssBytes: 1000000000, childRssBytes: 1152455680 }, p)).toBe(3000000000)
  expect(() => lean.assertLeanAggregateMemoryV15({ parentRssBytes: 1000000000, childRssBytes: 1152455681 }, p)).toThrow()
  expect(() => lean.assertLeanAggregateMemoryV15({ parentRssBytes: -1, childRssBytes: 0 }, p)).toThrow()
  expect(() => lean.assertLeanAggregateMemoryV15({ parentRssBytes: 1, childRssBytes: 2 }, { ...p, memoryBytes: 9000000000 })).toThrow()
})

it("selects exact dated finite v15 paths without altering consumed v14", () => {
  for (const n of [2, 3, 4, 5] as const) for (const route of ["diagnostic", "baseline"] as const) {
    const mode = `v15-${n}` as const, paths = lean.leanCorrectionRoutePaths(route, mode)
    expect(paths.store).toBe(`.strategy-lab/lean-correction-supervisor-${route}-20261009-${mode}`)
    expect(paths.check).toBe(`correction-supervisor-${route}-check-${mode}.json`)
    expect(lean.leanRetryOrdinal(mode)).toBe(n)
  }
  expect(lean.leanCorrectionRoutePaths("diagnostic", "v14-1").store).toBe(".strategy-lab/lean-correction-supervisor-diagnostic-20261008-v14-1")
})
it("requires the projected child replay callback while RAM does not masquerade as disk", () => {
  const a = lean.createLeanSupervisorCorrectionAllocation(input(), 8), p = lean.LEAN_RESOURCE_WINDOW_V15_POLICY
  const usage = process.memoryUsage(), spy = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...usage, rss: 2100000000, arrayBuffers: 4096 })
  try {
    expect(() => lean.encodeLeanReplay([], 1048576, a)).toThrow("RESOURCE_GUARD")
    const projected: number[] = []
    const replay = lean.encodeLeanReplay([], 1048576, a, (additional = 0) => { projected.push(additional); lean.assertLeanProcessMemoryV15(2100000000 + additional, p) })
    expect(projected.some(value => value > 0)).toBe(true)
    expect(replay.bytes.length).toBeGreaterThan(0)
    expect(() => lean.encodeLeanReplay([], 1048576)).toThrow("BUFFER_CAP")
    spy.mockReturnValue({ ...usage, rss: 2152455681, arrayBuffers: 4096 })
    expect(() => lean.encodeLeanReplay([], 1048576, a, () => lean.assertLeanProcessMemoryV15(2152455681, p))).toThrow("MEMORY_CAP")
  } finally { spy.mockRestore() }
})
it("journals independent v15 memory and measured-disk fields, rejecting overflow before publication", () => {
  // Synthetic store in an owned OS temporary directory: no gate, entry,
  // charge, Match, provider or accepted diagnostic is created by this fixture.
  const before = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "NON_AUTHORIZING-v15-ledger-")))
  try {
    process.chdir(directory); mkdirSync(".strategy-lab", { mode: 0o700 })
    const a = lean.createLeanSupervisorCorrectionAllocation(input(), 8), paths = lean.leanCorrectionRoutePaths("diagnostic", "v15-2")
    mkdirSync(paths.temp, { mode: 0o700 })
    const ledger = lean.createLeanLedger(paths.store, a)
    lean.checkpointLeanResources(ledger, 208771903, 1000000000, 1000000000, 3000000000)
    const bytes = readFileSync(join(paths.store, "ledger.ndjson")), event = JSON.parse(bytes.toString("utf8"))
    expect(event).toMatchObject({ kind: "resource-v15", memoryPolicyRoot: lean.LEAN_RESOURCE_WINDOW_V15_POLICY.root, memoryHighWaterBytes: 3000000000, bufferBytes: 1000000000, scratchBytes: 1000000000 })
    expect(lean.readLeanLedger(ledger)).toMatchObject({ memoryHighWaterBytes: 3000000000, scratchHighWaterBytes: 2000000000, charged: 36 })
    for (const [buffer, scratch, memory] of [[1000000001, 1000000000, 3000000000], [0, 0, 3000000001], [-1, 0, 3000000000]]) expect(() => lean.checkpointLeanResources(ledger, 208771903, buffer!, scratch!, memory!)).toThrow()
    expect(readFileSync(join(paths.store, "ledger.ndjson"))).toEqual(bytes)
    expect(() => lean.verifyLeanEvidence(ledger)).toThrow("RESOURCE_GUARD")
    for (const mutation of [{ memoryPolicyRoot: r(99) }, { kind: "resource" }, { extra: true }, { memoryHighWaterBytes: 3000000001 }]) {
      writeFileSync(join(paths.store, "ledger.ndjson"), `${lean.leanCanonicalBytes({ ...event, ...mutation })}\n`, { mode: 0o600 })
      expect(() => lean.readLeanLedger(ledger)).toThrow()
    }
  } finally { process.chdir(before); rmSync(directory, { recursive: true, force: true }) }
})
