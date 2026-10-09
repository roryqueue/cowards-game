/** Portable NON-AUTHORIZING resource contracts; no routes, provider or Match. */
import { expect, it, vi } from "vitest"
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
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

const successorInput = () => {
  const old = input(), b = lean.LEAN_RESOURCE_WINDOW_V15_SUCCESSOR_POLICY
  const { root: _root, ...prior } = old.predecessor
  const body = { ...prior, chargedMatches: 37, elapsedUpperBoundMs: 221730903 }
  return { ...old, planRoot: b.planRoot, supervisorDecisionRoot: b.approvalRoot, timeboxExtension: b, attemptOrdinal: 3 as const, predecessor: { ...body, root: labRoot(body.schemaVersion, body) } }
}
it("successor envelope preserves consumed bytes and selects only approved mode3 without reanchor or doubled floor", () => {
  expect(typeof lean.leanResourceWindowPolicyForModeV15).toBe("function")
  const old = lean.LEAN_RESOURCE_WINDOW_V15_POLICY, b = lean.LEAN_RESOURCE_WINDOW_V15_SUCCESSOR_POLICY
  expect(lean.leanBytesRoot(lean.leanCanonicalBytes(old))).toBe("sha256:f5b30f535a0f9b9cd3dc0a7c5cf60066689cae80365aa2bf300b3dd71b16a741")
  expect(old.root).toBe("sha256:6be6d3c607613c407a11dd24d89bd3bfec22f5abf013171eed6e1d284bb47c89")
  expect(lean.leanResourceWindowPolicyForModeV15("v15-2")).toBe(old)
  expect(lean.leanResourceWindowPolicyForModeV15("v15-3")).toBe(b)
  expect(b).toMatchObject({ schemaVersion: "lean-resource-window-successor-envelope-v15-3-v1", predecessorExtensionRoot: old.root, elapsedMs: 250530903, absoluteDeadlineMs: 1791598472000, actualResumeMs: 1791569672000, startedAtMs: 1791455941097, priorElapsedMs: 108000000, charged: 37, attemptOrdinals: [3], maximumDiagnostics: 1, maximumBaselines: 1, reserveMs: 1860000, memoryApprovalRoot: old.memoryApprovalRoot })
  expect(b.approvalRoot).toBe(lean.leanBytesRoot(readFileSync(lean.LEAN_REMAINING_V9_PHASE + "265-16-POST-V15-TIMING-APPROVAL-20261009.md")))
  expect(b.planRoot).toBe(lean.leanBytesRoot(readFileSync(lean.LEAN_REMAINING_V9_PHASE + "265-16-POST-V15-ARCHIVED-PREFIX-PLAN-v3.md")))
  const { root: br, ...body } = b
  expect(br).toBe(labRoot(b.schemaVersion, body))
  expect(lean.admitLeanRetryTimeboxExtension(b)).toBe(b)
  for (const mode of ["v15-4", "v15-5"] as const) expect(() => lean.leanResourceWindowPolicyForModeV15(mode)).toThrow()
  for (const patch of [{ priorElapsedMs: 221730903 }, { startedAtMs: b.actualResumeMs }, { elapsedMs: old.elapsedMs + 28800000 }, { memoryBytes: 3000000001 }]) {
    const wrong = { ...body, ...patch }
    expect(() => lean.admitLeanRetryTimeboxExtension({ ...wrong, root: labRoot(b.schemaVersion, wrong) })).toThrow()
  }
  expect(lean.leanRetryRootElapsedFloorV8(b.actualResumeMs, b)).toBe(221730903)
  expect(lean.leanRetryRootElapsedFloorV8(b.actualResumeMs + 17, b)).toBe(221730920)
  expect(lean.leanRetryRootElapsedFloorV8(b.absoluteDeadlineMs, b)).toBe(250530903)
  expect(lean.LEAN_RESOURCE_WINDOW_V15_SUCCESSOR_CAPS).toEqual({ ...lean.LEAN_CAPS, elapsedMs: 250530903 })
})
it("successor envelope reconstructs actual allocation caps and memory and refuses wrong ordinal/policy", () => {
  expect(lean.LEAN_RESOURCE_WINDOW_V15_SUCCESSOR_POLICY).toBeDefined()
  const b = lean.LEAN_RESOURCE_WINDOW_V15_SUCCESSOR_POLICY, a = lean.createLeanSupervisorCorrectionAllocation(successorInput(), 8)
  expect(lean.leanSupervisorAllocationMode(a)).toBe("v15-3")
  expect(lean.admitLeanAllocation(JSON.parse(JSON.stringify(a)))).toEqual(a)
  expect(lean.leanResourcePolicyForAllocationV15(a)).toBe(b)
  expect(lean.leanCapsForAllocation(a)).toEqual(lean.LEAN_RESOURCE_WINDOW_V15_SUCCESSOR_CAPS)
  expect(lean.leanMemoryLimitForAllocation(a)).toBe(3000000000)
  expect(lean.assertLeanAggregateMemoryV15({ parentRssBytes: 1000000000, childRssBytes: 1152455680 }, b)).toBe(3000000000)
  expect(lean.assertLeanProcessMemoryV15(2152455680, b)).toBe(3000000000)
  expect(() => lean.assertLeanProcessMemoryV15(2152455681, b)).toThrow("MEMORY_CAP")
  for (const patch of [{ attemptOrdinal: 2 }, { attemptOrdinal: 4 }, { timeboxExtension: lean.LEAN_RESOURCE_WINDOW_V15_POLICY }, { caps: lean.LEAN_RESOURCE_WINDOW_V15_CAPS }]) expect(() => lean.admitLeanAllocation({ ...a, ...patch })).toThrow()
  for (const patch of [{ attemptOrdinal: 4 }, { attemptOrdinal: 5 }, { timeboxExtension: lean.LEAN_RESOURCE_WINDOW_V15_POLICY }]) expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...successorInput(), ...patch }, 8)).toThrow()
  const { root: _root, ...p } = a.predecessor
  expect(() => lean.validateLeanResourceWindowPredecessorV15(a.predecessor, b)).not.toThrow()
  const below = { ...p, chargedMatches: 36 }
  expect(() => lean.validateLeanResourceWindowPredecessorV15({ ...below, root: labRoot(below.schemaVersion, below) }, b)).toThrow()
  const atCutoff = { ...p, elapsedUpperBoundMs: 250530903 - 1860000 - 600000 }
  expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...successorInput(), predecessor: { ...atCutoff, root: labRoot(atCutoff.schemaVersion, atCutoff) } }, 8)).toThrow()
})
it("successor envelope actual inert ledger and evidence carry selected policy root with once-only wall accounting", () => {
  expect(lean.LEAN_RESOURCE_WINDOW_V15_SUCCESSOR_POLICY).toBeDefined()
  const before = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "NON_AUTHORIZING-successor-ledger-"))), b = lean.LEAN_RESOURCE_WINDOW_V15_SUCCESSOR_POLICY
  const clock = vi.spyOn(Date, "now").mockReturnValue(b.actualResumeMs + 19)
  try {
    process.chdir(directory); mkdirSync(".strategy-lab", { mode: 0o700 })
    const a = lean.createLeanSupervisorCorrectionAllocation(successorInput(), 8), paths = lean.leanCorrectionRoutePaths("diagnostic", "v15-3")
    mkdirSync(paths.temp, { mode: 0o700 })
    const ledger = lean.createLeanLedger(paths.store, a)
    expect(lean.currentLeanElapsedMs(ledger)).toBe(221730922)
    lean.checkpointLeanResources(ledger, 221730922, 4096, 0, 3000000000)
    expect(lean.readLeanLedger(ledger)).toMatchObject({ charged: 37, elapsedMs: 221730922, memoryHighWaterBytes: 3000000000 })
    expect(lean.verifyLeanEvidence(ledger, () => {})).toMatchObject({ issued: false, memoryPolicyRoot: b.root, charged: 37 })
    const event = JSON.parse(readFileSync(join(paths.store, "ledger.ndjson"), "utf8"))
    expect(event.memoryPolicyRoot).toBe(b.root)
    expect(() => lean.checkpointLeanResources(ledger, 221730922, 2000000001, 0, 0)).toThrow()
    expect(() => lean.checkpointLeanResources(ledger, 221730922, 0, 0, 3000000001)).toThrow()
  } finally { clock.mockRestore(); process.chdir(before); rmSync(directory, { recursive: true, force: true }) }
})

it("successor amendment physically charges exact seventeen paths, growth and no refund for excluded outputs", () => {
  expect(lean.LEAN_RESOURCE_WINDOW_V15_ARCHIVED_AMENDMENT_PATHS).toHaveLength(17)
  const paths = lean.LEAN_RESOURCE_WINDOW_V15_ARCHIVED_AMENDMENT_PATHS
  expect(new Set(paths).size).toBe(17)
  for (const path of paths) expect(lean.LEAN_RESOURCE_WINDOW_V15_REPORT_PATHS).toContain(path)
  expect(lean.LEAN_RESOURCE_WINDOW_V15_REPORT_PATHS).not.toContain(lean.LEAN_REMAINING_V9_PHASE + "265-16-POST-V15-ARCHIVED-PREFIX-SOURCE-REVIEW-v99.md")
  const before = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "NON_AUTHORIZING-archived-debit-")))
  try {
    process.chdir(directory); mkdirSync(lean.LEAN_REMAINING_V9_PHASE, { recursive: true, mode: 0o700 })
    const a = lean.createLeanSupervisorCorrectionAllocation(successorInput(), 8)
    for (const path of paths) {
      const prior = lean.leanTwentySixReportDeltaBytes(a)
      writeFileSync(path, "NON_AUTHORIZING".repeat(2000), { mode: 0o600 })
      expect(lean.leanTwentySixReportDeltaBytes(a)).toBe(prior + lstatSync(path).blocks * 512)
    }
    const path = lean.LEAN_RESOURCE_WINDOW_V15_ARCHIVED_SOURCE_EXCLUSIONS[0]!, prior = lean.leanTwentySixReportDeltaBytes(a), blocks = lstatSync(path).blocks * 512
    writeFileSync(path, "NON_AUTHORIZING".repeat(4000)); expect(lean.leanTwentySixReportDeltaBytes(a)).toBeGreaterThan(prior)
    const { root: _root, ...p } = a.predecessor, charged = { ...p, survivors: [...p.survivors, { identity: path, allocatedBytes: lstatSync(path).blocks * 512 }] }
    const tracked = { ...a, predecessor: { ...charged, root: labRoot(charged.schemaVersion, charged) } }
    writeFileSync(path, "INERT"); expect(() => lean.leanTwentySixReportDeltaBytes(tracked)).toThrow()
    rmSync(path); expect(() => lean.leanTwentySixReportDeltaBytes(tracked)).toThrow()
    expect(blocks).toBeGreaterThan(0)
  } finally { process.chdir(before); rmSync(directory, { recursive: true, force: true }) }
})
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
it("charges the exact fresh review and fix report blocks and growth without a broad allowlist or refund", () => {
  const phase = ".planning/phases/265-serious-current-rules-league-and-development-red-team/", prefix = `${phase}265-16-POST-V14-RESOURCE-WINDOW-`
  const reports = ["SOURCE-REVIEW-v2", "REVIEW-FIX-v1", "REVIEW-FIX-v2"].map(role => `${prefix}${role}.md`)
  expect(lean.LEAN_RESOURCE_WINDOW_V15_REPORT_PATHS).toContain(`${prefix}SOURCE-REVIEW-v1.md`)
  for (const path of reports) expect(lean.LEAN_RESOURCE_WINDOW_V15_REPORT_PATHS).toContain(path)
  for (const role of ["SOURCE-REVIEW-v99", "REVIEW-FIX-v99", "SOURCE-REVIEW-v2-extra", "arbitrary-report"]) expect(lean.LEAN_RESOURCE_WINDOW_V15_REPORT_PATHS).not.toContain(`${prefix}${role}.md`)
  const before = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "NON_AUTHORIZING-v15-report-debit-")))
  try {
    process.chdir(directory); mkdirSync(phase, { recursive: true, mode: 0o700 })
    const a = lean.createLeanSupervisorCorrectionAllocation(input(), 8)
    expect(lean.leanTwentySixReportDeltaBytes(a)).toBe(0)
    for (const path of reports) writeFileSync(path, "NON_AUTHORIZING_REPORT\n".repeat(1024), { mode: 0o600 })
    const blocks = () => reports.map(path => lstatSync(path).blocks * 512), prepared = blocks()
    expect(prepared.every(bytes => bytes > 0)).toBe(true)
    expect(lean.leanTwentySixReportDeltaBytes(a)).toBe(prepared.reduce((sum, bytes) => sum + bytes, 0))
    const original = input(), { root: _old, ...body } = original.predecessor
    const survivors = body.survivors.map((row, n) => n < reports.length ? { identity: reports[n]!, allocatedBytes: prepared[n]! } : row)
    const predecessorBody = { ...body, survivors }, snapshot = lean.createLeanSupervisorCorrectionAllocation({ ...original, predecessor: { ...predecessorBody, root: labRoot(predecessorBody.schemaVersion, predecessorBody) } }, 8)
    expect(lean.leanTwentySixReportDeltaBytes(snapshot)).toBe(0)
    writeFileSync(reports[0]!, "NON_AUTHORIZING_GROWTH\n".repeat(8192), { mode: 0o600 })
    const growth = blocks()[0]! - prepared[0]!
    expect(growth).toBeGreaterThan(0)
    expect(lean.leanTwentySixReportDeltaBytes(snapshot)).toBe(growth)
    writeFileSync(reports[0]!, "NON_AUTHORIZING_SHRINK", { mode: 0o600 })
    expect(() => lean.leanTwentySixReportDeltaBytes(snapshot)).toThrow("PREDECESSOR_DRIFT")
    rmSync(reports[0]!)
    expect(() => lean.leanTwentySixReportDeltaBytes(snapshot)).toThrow("PREDECESSOR_DRIFT")
  } finally { process.chdir(before); rmSync(directory, { recursive: true, force: true }) }
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
it("bounds frames with authenticated policy and a required projected callback without widening frame size", () => {
  const a = lean.createLeanSupervisorCorrectionAllocation(input(), 8), usage = process.memoryUsage()
  const spy = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...usage, rss: 2100000000, arrayBuffers: 4096 }), projected: number[] = []
  try {
    expect(() => lean.boundLeanReplayFrame({ kind: "NON_AUTHORIZING" }, a, bytes => projected.push(bytes ?? 0))).not.toThrow()
    expect(projected[0]).toBeGreaterThan(0)
    expect(() => lean.boundLeanReplayFrame({}, a)).toThrow("RESOURCE_GUARD")
    expect(() => lean.boundLeanReplayFrame({ value: "x".repeat(43000000) }, a, () => {})).toThrow("REPLAY_LIMIT")
    expect(() => lean.boundLeanReplayFrame({})).toThrow("BUFFER_CAP")
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
