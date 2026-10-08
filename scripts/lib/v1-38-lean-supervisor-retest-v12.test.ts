import { describe, expect, it, vi } from "vitest"
import * as accounting from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as correction from "../run-v1-38-lean-correction.js"
import * as retained from "./v1-38-lean-correction-retained.js"
import * as baselineRetained from "./v1-38-lean-baseline-retained.js"
import * as reuseIO from "./v1-38-lean-baseline-reuse.js"
import * as sourceIO from "./v1-38-lean-baseline-source.js"
import * as fileIO from "node:fs"
import * as childIO from "node:child_process"
import { buildPlannerCandidate } from "../../packages/strategy-lab/src/planner/emit.js"
import { LEAN_COLD_REUSE_HISTORY } from "./v1-38-lean-baseline-reuse.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

vi.mock("node:fs", async importOriginal => {
  const original = await importOriginal<typeof import("node:fs")>()
  return { ...original, existsSync: vi.fn(original.existsSync), readdirSync: vi.fn(original.readdirSync) }
})
vi.mock("node:child_process", async importOriginal => {
  const original = await importOriginal<typeof import("node:child_process")>()
  return { ...original, execFileSync: vi.fn(original.execFileSync) }
})

/** All host IO is virtual and closed-world. The actual allocation, reason-v2,
 * full retained audit, closure publisher/reauthenticator and baseline join run;
 * only inherited cold custody and host loading are mocked. No empirical paths
 * are opened, created, removed or read, and no old reader is invoked. */
const acceptedV12Fixture = () => {
  const r = (n: number) => labRoot("v12-complete-synthetic-lifecycle", n), mode = "v12-1" as const
  const extension = accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION, at = extension.startedAtMs
  const paths = accounting.leanCorrectionRoutePaths("diagnostic", mode), sourceRoot = r(1)
  const request = correction.createLeanSupervisorRetestRequestDraftV12(mode, "diagnostic", { sourceRoot, reviewRoot: r(2), dataReviewRoot: r(3), helperReviewRoot: r(4), helperPath: correction.leanSupervisorRetestDocumentsV12("diagnostic").helper, helperBytesRoot: r(5), setupAccountingRoot: r(6), reuseGrantRoot: r(7), authorizationRoot: r(8), priorClosureRoot: r(9), continuationRoot: r(10), acceptedCheckRoot: null, acceptedReaderCloseRoot: null })
  const predecessorBody = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 34, elapsedUpperBoundMs: 108000000, allocatedDiskBytes: extension.physicalFloorBytes, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r(11), survivors: Array.from({ length: 661 }, (_, ordinal) => ({ identity: `.strategy-lab/v12-only-mocked-survivor-${ordinal}`, allocatedBytes: 4096 })) }
  const input = { sourceRoot, reviewRoot: request.reviewRoot, coldRoot: request.coldRoot, planRoot: request.planRoot, candidateRoots: request.candidateRoots, requestRoots: request.requestRoots, seed: request.seed, route: "diagnostic" as const, reuseGrantRoot: request.reuseGrantRoot, supervisorDecisionRoot: extension.approvalRoot, acceptedCheckRoot: null, requestBytesRoot: accounting.leanBytesRoot(accounting.leanCanonicalBytes(request)), dataReviewRoot: request.dataReviewRoot, setupAccountingRoot: request.setupAccountingRoot!, predecessor: { ...predecessorBody, root: labRoot(predecessorBody.schemaVersion, predecessorBody) }, startupPolicyRoot: accounting.LEAN_STARTUP_POLICY_V5.root, timeboxExtension: extension, attemptOrdinal: 1 as const, priorClosureRoot: request.priorClosureRoot!, continuationRoot: request.continuationRoot!, acceptedReaderCloseRoot: null }
  const allocation = accounting.createLeanSupervisorCorrectionAllocation(input, 8), ledger = { directory: paths.store, allocation }, slot = allocation.slots[0]!
  const sources = ["tactical-0", "cold-opponent"].map(role => sourceIO.buildLeanBaselineSource({ role, source: buildPlannerCandidate().source, coldRoot: allocation.coldRoot, implementationRoot: sourceRoot }))
  const reuse = { grant: { root: request.reuseGrantRoot, coldRoot: allocation.coldRoot, seed: allocation.seed, amendmentRoot: LEAN_COLD_REUSE_HISTORY.amendmentRoot }, sources } as unknown as ReturnType<typeof reuseIO.authenticateLeanColdReuse>
  const entry = { schemaVersion: "lean-child-entry-v2", allocationRoot: allocation.root, sourceRoot, requestBytesRoot: input.requestBytesRoot, head: "a".repeat(40), parentPid: 123, childPid: 124, handshakeRoot: r(12), wallStartMs: at + 10, monotonicStartNs: "1000000000" }
  const terminal = { schemaVersion: "lean-child-terminal-v2", entryBytesRoot: accounting.leanBytesRoot(accounting.leanCanonicalBytes(entry)), allocationRoot: allocation.root, sourceRoot, head: entry.head, parentPid: 123, childPid: 124, exitCode: 0, signal: null, status: "child_exited" as const, wallObservedMs: at + 50, monotonicObservedNs: "1040000000", elapsedUpperBoundMs: 40, parentRssBytes: 4096, childRssObservedBytes: 4096, physicalBytes: 8192, freeBytes: 15000000000 }
  const rooted = <T extends { schemaVersion: string }>(body: T) => ({ ...body, root: labRoot(body.schemaVersion, body) })
  const compact = { classification: "success" as const, code: "OK" as const, outcome: "DRAW" as const, elapsedMs: 40, cleanupComplete: true, invocationCount: 0, accountingRoot: r(13), executionRoot: r(14), telemetry: { transitions: 1, events: 1 } }
  const charge = rooted({ schemaVersion: "lean-slot-charge-v1", allocationRoot: allocation.root, slotRoot: slot.root, ordinal: 0 })
  const terminalEvent = { kind: "terminal", chargeRoot: charge.root, record: compact, replay: null }
  const events = [{ kind: "charge", charge }, terminalEvent, { kind: "stop", reason: "complete" }]
  const records = [{ slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: charge.root, terminal: terminalEvent, status: "success" }]
  const evidence = { records, charged: 35, elapsedMs: 108000100, physicalHighWaterBytes: extension.physicalFloorBytes, scratchHighWaterBytes: 1024, root: labRoot("lean-evidence-v1", { allocationRoot: allocation.root, events, records }) }
  const pair = rooted({ schemaVersion: "lean-baseline-pair-v1", ordinal: 0, slotRoot: slot.root, requestRoot: slot.requestRoot, priorLedgerBytesRoot: accounting.leanBytesRoot(Buffer.alloc(0)), priorLedgerByteLength: 0, priorCharged: 34, bottomRole: sources[0]!.role, bottomSourceRoot: sources[0]!.sourceRoot, bottomSnapshotRoot: sources[0]!.root, topRole: sources[1]!.role, topSourceRoot: sources[1]!.sourceRoot, topSnapshotRoot: sources[1]!.root })
  const metricBody = { executionRoot: compact.executionRoot, formationComparison: "inconclusive" }
  const cell = { ordinal: 0, slotRoot: slot.root, bottomRoot: pair.bottomSourceRoot, topRoot: pair.topSourceRoot, compact, brainInputs: [], strategyInputs: [], trainingHalfPoints: null, semanticRoot: r(15), metrics: { ...metricBody, root: labRoot("lean-baseline-match-metrics-v1", metricBody) }, decisionRoot: r(16), diagnostic: null }
  const observation = rooted({ schemaVersion: "lean-baseline-observation-v1", pairRoot: pair.root, cell })
  const origin = rooted({ schemaVersion: "lean-startup-origin-envelope-v7", allocationRoot: allocation.root, sourceRoot, pairRoot: pair.root, chargeRoot: charge.root, origins: [] })
  const pipeline = { status: "diagnostic_only", cells: [{ ordinal: cell.ordinal, slotRoot: cell.slotRoot, compact }], training: null, holdoutOpened: false, formationMaterialized: false }
  const result = rooted({ schemaVersion: "lean-correction-supervisor-result-v8", privacy: "private_offline", issued: false, route: "diagnostic", allocationRoot: allocation.root, sourceRoot, requestBytesRoot: entry.requestBytesRoot, head: entry.head, reuseGrantRoot: request.reuseGrantRoot, pipeline, evidenceRoot: evidence.root, cumulativeCharged: 35, holdoutOpened: false, formationMaterialized: false, phaseComplete: false, attemptOrdinal: 1 })
  const reason = rooted({ schemaVersion: "lean-parent-supervisor-reasons-v2", allocationRoot: allocation.root, sourceRoot, requestBytesRoot: entry.requestBytesRoot, entryBytesRoot: terminal.entryBytesRoot, head: entry.head, parentPid: 123, childPid: 124, exitCode: 0, signal: null, uncertain: false, reasons: [], observations: { entry: "published", childReady: "observed", resourceSampling: "observed", finalIdentity: "matched", failureReceipt: "absent", cleanup: "child_exit_observed", terminalization: "unobserved", initiatingCause: "unknown", resourceSamplingOperation: "none", resourceSamplingSequence: 0, resourceSamplingExitObserved: false } })
  const interval = "correction-supervisor-diagnostic-v8-verifier", closing = "correction-supervisor-diagnostic-v8-reader-close", gap = "correction-supervisor-diagnostic-v8-reader-gap"
  const starts = new Map([["pilot-entry", at + 10], ["correction-run-finalization", at + 50], [gap, at + 55], [interval, at + 60], [closing, at + 90]])
  const closes = new Map([["pilot-entry", at + 50], ["correction-run-finalization", at + 55], [gap, at + 60], [interval, at + 90], [closing, at + 100]])
  const time = { active: false, elapsedMs: 108000100, closedElapsedMs: 108000100, starts, closes, closed: new Set(starts.keys()) }
  const start = rooted({ schemaVersion: "lean-correction-supervisor-admission-v8", attemptOrdinal: 1, route: "diagnostic", mode: "run", parentPid: 123, wallStartMs: at + 10, monotonicStartNs: "1000000000" })
  const close = rooted({ schemaVersion: "lean-correction-supervisor-admission-close-v8", attemptOrdinal: 1, startRoot: start.root, route: "diagnostic", mode: "run", elapsedUpperBoundMs: 40, monotonicObservedNs: "1040000000", wallObservedMs: at + 50, allocationRoot: allocation.root, ledgerInterval: "correction-run-finalization", importedMs: 40, ledgerCloseMs: at + 55 })
  const journalBytes = Buffer.concat(events.map(event => Buffer.concat([accounting.leanCanonicalBytes(event), Buffer.from("\n")])))
  const files = new Map<string, Uint8Array>(), put = (path: string, value: unknown) => files.set(path, accounting.leanCanonicalBytes(value))
  for (const [name, value] of [["allocation.json", allocation], ["entry.json", entry], ["child-terminal.json", terminal], ["result.json", result], ["cold-reuse.json", reuse], ["pair-0.json", pair], ["observation-0.json", observation], ["correction-origin.json", origin], ["parent-supervisor-reasons.json", reason], ...sources.map(source => [`source-${source.role}.json`, source])] as const) put(join(paths.store, String(name)), value)
  for (const source of sources) put(join(paths.store, `publication-${source.role}-v8.json`), { root: r(17) })
  files.set(join(paths.store, "ledger.ndjson"), journalBytes); files.set(join(paths.store, "time.ndjson"), Buffer.from("synthetic-only-host-time"))
  put(paths.request, request); put(join(paths.temp, "admission-run-start.json"), start); put(join(paths.temp, "admission-run-close.json"), close)
  vi.spyOn(accounting, "openLeanLedger").mockReturnValue(ledger)
  vi.spyOn(accounting, "readLeanChildEntry").mockReturnValue(entry as never); vi.spyOn(accounting, "readLeanChildTerminal").mockReturnValue(terminal as never)
  vi.spyOn(accounting, "readLeanTimeAccounting").mockReturnValue(time)
  vi.spyOn(accounting, "readLeanLedger").mockReturnValue({ stopped: true, charged: 35, charges: new Map([[slot.root, charge]]) } as never)
  vi.spyOn(accounting, "verifyLeanEvidence").mockReturnValue(evidence as never)
  vi.spyOn(reuseIO, "validateLeanColdReuse").mockReturnValue(reuse)
  vi.spyOn(sourceIO, "readLeanBaselineSource").mockImplementation((_directory, role) => sources.find(source => source.role === role)!)
  vi.spyOn(correction, "readLeanRemainingAcceptedDiagnosticLineageV9").mockReturnValue({ request, reuse })
  vi.spyOn(correction, "leanCorrectionSourceManifest").mockReturnValue({ root: sourceRoot } as never)
  vi.spyOn(correction, "readLeanCorrectionPrivateBytes").mockImplementation(path => { const bytes = files.get(path); if (!bytes) throw new Error("SYNTHETIC_HOST_FILE_ABSENT"); return bytes })
  vi.spyOn(correction, "readLeanCorrectionJson").mockImplementation(path => { const bytes = files.get(path); if (!bytes) throw new Error("SYNTHETIC_HOST_FILE_ABSENT"); return JSON.parse(Buffer.from(bytes).toString("utf8")) as unknown })
  vi.spyOn(correction, "publishLeanCorrection").mockImplementation((path, value) => { if (files.has(path)) throw new Error("SYNTHETIC_HOST_DUPLICATE"); put(path, value) })
  vi.spyOn(fileIO, "existsSync").mockImplementation(path => files.has(String(path)) || [...files.keys()].some(name => name.startsWith(`${String(path)}/`)))
  vi.spyOn(fileIO, "readdirSync").mockImplementation(path => [...files.keys()].filter(name => name.startsWith(`${String(path)}/`) && !name.slice(String(path).length + 1).includes("/")).map(name => name.slice(String(path).length + 1)) as never)
  vi.spyOn(childIO, "execFileSync").mockImplementation((_file, args) => { if (args?.join(" ") !== "rev-parse HEAD") throw new Error("SYNTHETIC_HOST_GIT_UNEXPECTED"); return entry.head as never })
  const audited = retained.auditLeanCorrectionRetained({ schemaVersion: "lean-correction-supervisor-retained-snapshot-v8", allocation, request, entry, terminal, evidence, time, result, reuse, pairs: [pair], observations: [observation], sources, artifacts: {}, origin, journalBytes, supervisorReasonBytes: accounting.leanCanonicalBytes(reason) })
  const { root: _auditRoot, ...auditBody } = audited
  const check = rooted({ ...auditBody, attemptOrdinal: 1, cumulativeElapsedMs: 108000090, cumulativePhysicalBytes: extension.physicalFloorBytes, readerScratchHighWaterBytes: 512000000, readerInterval: interval, readerStartMs: at + 60, readerObservedMs: at + 80 })
  put(join(paths.store, paths.check), check)
  return { mode, paths, files, put, input, allocation, ledger, request, entry, terminal, reason, result, rooted, time, check }
}

/** Controlled host reader completion; production wrapper, refusal, carry and
 * hold seal execute unchanged against virtual IO. No ordinary reader is rerun. */
const pendingBaselineV12Fixture = () => {
  const s = acceptedV12Fixture(), paths = accounting.leanCorrectionRoutePaths("baseline", s.mode)
  const request = correction.createLeanSupervisorRetestRequestDraftV12(s.mode, "baseline", { sourceRoot: s.request.sourceRoot, reviewRoot: s.request.reviewRoot, dataReviewRoot: s.request.dataReviewRoot, setupAccountingRoot: s.request.setupAccountingRoot!, reuseGrantRoot: s.request.reuseGrantRoot, authorizationRoot: s.request.authorizationRoot!, priorClosureRoot: s.request.priorClosureRoot!, continuationRoot: s.request.continuationRoot!, helperReviewRoot: s.request.helperReviewRoot!, helperBytesRoot: s.request.helperBytesRoot!, helperPath: correction.leanSupervisorRetestDocumentsV12("baseline").helper, acceptedCheckRoot: s.check.root, acceptedReaderCloseRoot: labRoot("synthetic-own-final", {}) })
  const { root: _oldPredecessorRoot, ...prior } = s.input.predecessor
  const predecessor = { ...prior, chargedMatches: 35, root: labRoot(prior.schemaVersion, { ...prior, chargedMatches: 35 }) }
  const requestBytesRoot = accounting.leanBytesRoot(accounting.leanCanonicalBytes(request))
  const allocation = accounting.createLeanSupervisorCorrectionAllocation({ ...s.input, route: "baseline", requestRoots: request.requestRoots, acceptedCheckRoot: request.acceptedCheckRoot!, acceptedReaderCloseRoot: request.acceptedReaderCloseRoot!, requestBytesRoot, predecessor }, 8)
  const ledger = { directory: paths.store, allocation }, entry = { ...s.entry, allocationRoot: allocation.root, requestBytesRoot }
  const entryBytesRoot = accounting.leanBytesRoot(accounting.leanCanonicalBytes(entry)), terminal = { ...s.terminal, allocationRoot: allocation.root, entryBytesRoot }
  const { root: _oldReasonRoot, ...oldReason } = s.reason
  const reason = s.rooted({ ...oldReason, allocationRoot: allocation.root, requestBytesRoot, entryBytesRoot })
  const { root: _oldResultRoot, ...oldResult } = s.result
  const result = s.rooted({ ...oldResult, route: "baseline", allocationRoot: allocation.root, requestBytesRoot, cumulativeCharged: 36 })
  const check = s.rooted({ schemaVersion: "lean-correction-supervisor-retained-v8", accepted: true, route: "baseline", allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot, head: entry.head, attemptOrdinal: 1, currentCharged: 1, cumulativeCharged: 36, resultRoot: result.root })
  s.put(paths.request, request)
  for (const [name, value] of [["allocation.json", allocation], ["entry.json", entry], ["child-terminal.json", terminal], ["parent-supervisor-reasons.json", reason], ["result.json", result]] as const) s.put(join(paths.store, name), value)
  vi.mocked(accounting.openLeanLedger).mockReturnValue(ledger)
  vi.mocked(accounting.readLeanChildEntry).mockReturnValue(entry as never); vi.mocked(accounting.readLeanChildTerminal).mockReturnValue(terminal as never)
  vi.mocked(accounting.readLeanLedger).mockReturnValue({ stopped: true, charged: 36, charges: new Map([[allocation.slots[0]!.root, {}]]) } as never)
  const time = { ...s.time, active: true, starts: new Map<string, number>(), closes: new Map<string, number>(), closed: new Set<string>() }
  vi.mocked(accounting.readLeanTimeAccounting).mockReturnValue(time)
  vi.spyOn(correction, "inventoryLeanTwoPairNoRefundV11").mockImplementation(prior => ({ survivors: [...prior.survivors], allocatedDiskBytes: prior.allocatedDiskBytes }))
  let fulfill!: (value: typeof check) => void, reject!: (error: Error) => void
  const pending = new Promise<typeof check>((yes, no) => { fulfill = yes; reject = no })
  // Attach immediately even against the pre-fix wrapper, which abandons this
  // promise after its premature carry. The wrapper still must propagate it.
  void pending.catch(() => undefined)
  const reader = vi.spyOn(baselineRetained, "verifyLeanRetryBaselineRetainedV8").mockReturnValue(pending as never)
  const close = () => {
    time.active = false
    const at = accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION.startedAtMs
    for (const [id, start, end] of [["correction-supervisor-baseline-v8-verifier", 60, 90], ["correction-supervisor-baseline-v8-reader-close", 90, 100]] as const) { time.starts.set(id, at + start); time.closes.set(id, at + end); time.closed.add(id) }
  }
  const finish = (success: boolean) => { close(); if (success) { s.put(join(paths.store, paths.check), check); fulfill(check) } else reject(new Error("CONTROLLED_BASELINE_READER_REJECTION")) }
  return { ...s, paths, request, check, reader, finish }
}

describe("fresh v12 supervisor source-only admission", () => {
  it("the actual v12 source-review consumer selects final v3 and rejects failed, stale, borrowed or uncommitted evidence", () => {
    const mode = "v12-1" as const, e = accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION
    const phase = accounting.LEAN_REMAINING_V9_PHASE, finalPath = `${phase}265-16-SUPERVISOR-RETEST-SOURCE-REVIEW-v3.md`
    // Capture only the inert source-manifest's own reads, including source-only
    // fixtures used to construct intermediate inventories. No private reader.
    const sourceBytes = new Map<string, Buffer>(), originalRead = fileIO.readFileSync
    const preload = vi.spyOn(fileIO, "readFileSync").mockImplementation(path => {
      const bytes = originalRead(path)
      sourceBytes.set(resolve(String(path)), Buffer.from(bytes))
      return bytes as never
    })
    const source = correction.leanCorrectionSourceManifest(mode, e), r = (n: number) => labRoot("v12-synthetic-review-consumer", n)
    preload.mockRestore()
    const commit = "f".repeat(40)
    const clean = Buffer.from(`---\nstatus: clean\nsource_root: ${source.root}\nsource_commit: ${commit}\nindependently_reviewed: true\nauthor_agent: /root/fix_265_correction_reader\nreviewer_agent: /root/review_265_twenty_hour\n---\nSynthetic only: no actual final review is authored.\n`)
    const reports = new Map([[resolve(finalPath), clean]])
    vi.spyOn(fileIO, "readFileSync").mockImplementation(path => {
      const bytes = reports.get(String(path)) ?? sourceBytes.get(resolve(String(path)))
      if (!bytes) throw new Error(`SYNTHETIC_SOURCE_REVIEW_HOST_FILE_ABSENT:${String(path)}`)
      return bytes as never
    })
    const git = vi.spyOn(childIO, "execFileSync").mockImplementation((file, args) => {
      expect(file).toBe("git")
      expect(args?.slice(0, 4)).toEqual(["diff", "--exit-code", commit, "--"])
      expect(args?.slice(4)).toEqual(source.entries.map(entry => entry.path))
      return Buffer.alloc(0) as never
    })
    try {
      for (const route of ["diagnostic", "baseline"] as const) {
        const draft = correction.createLeanSupervisorRetestRequestDraftV12(mode, route, { sourceRoot: source.root, reviewRoot: accounting.leanBytesRoot(clean), dataReviewRoot: r(2), helperReviewRoot: r(3), helperPath: correction.leanSupervisorRetestDocumentsV12(route).helper, helperBytesRoot: r(4), setupAccountingRoot: r(5), reuseGrantRoot: r(6), authorizationRoot: r(7), priorClosureRoot: r(8), continuationRoot: r(9), acceptedCheckRoot: route === "diagnostic" ? null : r(10), acceptedReaderCloseRoot: route === "diagnostic" ? null : r(11) })
        const request = { ...draft, reviewPath: finalPath }
        expect(() => correction.authenticateLeanSupervisorRetestSourceReviewV12(request, route, mode)).not.toThrow()
        expect(draft.reviewPath).toBe(finalPath)
        expect(git).toHaveBeenCalled()
        expect(() => correction.authenticateLeanSupervisorRetestSourceReviewV12({ ...request, reviewPath: `${phase}265-16-SUPERVISOR-RETEST-SOURCE-REVIEW-v1.md` }, route, mode)).toThrow("SUPERVISOR_REQUEST")
        for (const mutation of [clean.toString().replace("status: clean", "status: issues_found"), clean.toString().replace(source.root, r(12)), clean.toString().replace("reviewer_agent: /root/review_265_twenty_hour", "reviewer_agent: /root/fix_265_correction_reader"), clean.toString().replace(commit, "not-a-commit")]) {
          const bytes = Buffer.from(mutation); reports.set(resolve(finalPath), bytes)
          expect(() => correction.authenticateLeanSupervisorRetestSourceReviewV12({ ...request, reviewRoot: accounting.leanBytesRoot(bytes) }, route, mode)).toThrow("LEAN_CORRECTION_REVIEW")
        }
        reports.set(resolve(finalPath), Buffer.concat([clean, Buffer.from("borrowed different raw bytes\n")]))
        expect(() => correction.authenticateLeanSupervisorRetestSourceReviewV12(request, route, mode)).toThrow("LEAN_CORRECTION_REVIEW")
        reports.set(resolve(finalPath), clean)
        expect(() => correction.authenticateLeanSupervisorRetestSourceReviewV12({ ...request, sourceRoot: r(13) }, route, mode)).toThrow("LEAN_CORRECTION_REVIEW")
        git.mockImplementationOnce(() => { throw new Error("SYNTHETIC_COMMITTED_SOURCE_DIFF") })
        expect(() => correction.authenticateLeanSupervisorRetestSourceReviewV12(request, route, mode)).toThrow("REVIEW_SOURCE")
      }
      for (const name of ["SOURCE-REVIEW-v2", "SOURCE-REVIEW-v3", "REVIEW-FIX-v2"]) {
        const path = `${phase}265-16-SUPERVISOR-RETEST-${name}.md`
        expect(accounting.LEAN_SUPERVISOR_RETEST_V12_REPORT_PATHS).toContain(path)
        expect(source.entries.some(entry => entry.path === path)).toBe(false)
      }
      expect(accounting.LEAN_SUPERVISOR_RETEST_V12_REPORT_PATHS).not.toContain(`${phase}265-16-SUPERVISOR-RETEST-SOURCE-REVIEW-v4.md`)
    } finally { vi.restoreAllMocks() }
  }, 30000)
  for (const success of [true, false]) it(`awaits the pending production baseline wrapper before ${success ? "fulfilled carry" : "rejected refusal and carry"}`, async () => {
    const s = pendingBaselineV12Fixture(), carryPath = correction.leanSupervisorRetestDocumentsV12("baseline", s.mode).carry
    const sealPath = join(s.paths.temp, "terminal-hold-complete-v12.json"), refusalPath = join(s.paths.temp, "result-reader-refusal-v12.json")
    let settled = false
    const action = Promise.resolve().then(() => retained.verifyLeanSupervisorRetestRetainedV12(s.paths.request, s.mode, "baseline"))
    const observed = action.then(value => { settled = true; return { value, error: null } }, error => { settled = true; return { value: null, error } })
    try {
      await new Promise<void>(done => setImmediate(done))
      expect(s.reader).toHaveBeenCalledExactlyOnceWith(s.paths.request, s.mode, undefined)
      expect(settled).toBe(false)
      expect([carryPath, sealPath, refusalPath, join(s.paths.temp, "terminal-hold-refusal-v12.json")].some(path => s.files.has(path))).toBe(false)
      s.finish(success)
      const outcome = await observed
      expect(s.reader).toHaveBeenCalledTimes(1)
      if (success) { expect(outcome.error).toBeNull(); expect(outcome.value).toEqual(s.check); expect(s.files.has(refusalPath)).toBe(false) }
      else { expect(outcome.error).toBeInstanceOf(Error); expect(outcome.error.message).toBe("CONTROLLED_BASELINE_READER_REJECTION"); expect(s.files.has(refusalPath)).toBe(true) }
      const carry = correction.readLeanCorrectionJson(carryPath) as retained.LeanSupervisorRetestTerminalCarryV12
      expect(carry).toMatchObject({ authorizing: false, accepted: false, outcome: success ? "closed_result" : "failed_result", currentCharges: 1, cumulativeCharged: 36, allocatedDiskBytes: accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION.physicalFloorBytes, closedAtMs: accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION.startedAtMs + 100, cumulativeElapsedMs: 108000100 })
      expect(s.files.has(sealPath)).toBe(true)
      expect(s.files.has(join(s.paths.temp, "terminal-hold-refusal-v12.json"))).toBe(false)
    } finally { s.finish(success); await observed; vi.restoreAllMocks() }
  }, 30000)
  it("publishes and reauthenticates its saved accepted v12 closure through the full audit before its own baseline join", () => {
    try {
      const s = acceptedV12Fixture()
      const closure = retained.publishLeanRetryClosureV8(s.ledger, s.mode, "accepted")
      expect(s.files.has(join(s.paths.store, "retest-closure-v12.json"))).toBe(true)
      expect(s.files.has(join(s.paths.store, "retry-closure-v8.json"))).toBe(false)
      expect(retained.authenticateLeanRetryClosureV8(s.mode)).toEqual(closure)
      const joined = correction.authenticateLeanSupervisorRetestAcceptedJoinV12(s.mode)
      const { root: _predecessorRoot, ...baselinePredecessor } = s.input.predecessor
      const baseline = accounting.createLeanSupervisorCorrectionAllocation({ ...s.input, route: "baseline", requestRoots: Array.from({ length: 36 }, (_, ordinal) => labRoot("v12-own-baseline-slot", ordinal)), acceptedCheckRoot: joined.accepted.root, acceptedReaderCloseRoot: joined.closure.root, predecessor: { ...baselinePredecessor, chargedMatches: 35, root: labRoot("lean-correction-predecessor-v1", { ...baselinePredecessor, chargedMatches: 35 }) } }, 8)
      expect(() => baselineRetained.assertLeanRetryBaselineJoinV8(baseline, joined.accepted, joined.closure, s.entry.head)).not.toThrow()
      for (const changed of [{ acceptedCheckRoot: labRoot("borrowed-v12-check", {}) }, { acceptedReaderCloseRoot: labRoot("borrowed-v12-final", {}) }, { sourceRoot: labRoot("borrowed-v12-source", {}) }, { attemptOrdinal: 2 }]) expect(() => baselineRetained.assertLeanRetryBaselineJoinV8({ ...baseline, ...changed } as never, joined.accepted, joined.closure, s.entry.head)).toThrow("RETRY_ACCEPTED_FINAL_JOIN")
      s.put(join(s.paths.store, "retry-closure-v8.json"), closure)
      expect(() => retained.authenticateLeanRetryClosureV8(s.mode)).toThrow("ACCEPTED_INVENTORY")
      s.files.delete(join(s.paths.store, "retry-closure-v8.json")); s.put(join(s.paths.store, "unrelated.json"), {})
      expect(() => retained.authenticateLeanRetryClosureV8(s.mode)).toThrow("ACCEPTED_INVENTORY")
    } finally { vi.restoreAllMocks() }
  }, 30000)
  it("selects the exact one-pair route and full conservative clock", () => {
    expect(accounting.isLeanSupervisorRetestMode("v12-1")).toBe(true)
    expect(accounting.isLeanSupervisorRetestMode("v12-2")).toBe(false)
    const e = accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION
    expect(e).toMatchObject({ priorElapsedMs: 108000000, startedAtMs: 1791455941097, elapsedMs: 136800000, charged: 34, excludedIdleMs: 0, maximumDiagnostics: 1, maximumBaselines: 1, reserveMs: 1860000 })
    expect(accounting.leanRetryRootElapsedFloorV8(e.startedAtMs + 99, e)).toBe(108000099)
    expect(accounting.leanCorrectionRoutePaths("diagnostic", "v12-1").request).toBe(".strategy-lab/lean-correction-supervisor-diagnostic-request-20261008-v12-1.json")
    for (const route of ["diagnostic", "baseline"] as const) for (const verb of ["prepare", "run", "verify", "verify-terminal"]) {
      const paths = accounting.leanCorrectionRoutePaths(route, "v12-1")
      expect(correction.parseLeanCorrectionCommand([`${verb}-supervisor-${route}-v12-1`, "--request", paths.request]).supervisor).toBe("v12-1")
      expect(() => correction.parseLeanCorrectionCommand([`${verb}-supervisor-${route}-v12-2`, "--request", paths.request])).toThrow()
    }
  })
  it("the actual semantic root excludes exactly five downstream review and authorization fields", () => {
    const r = (n: number) => labRoot("v12-synthetic-only", n)
    const draft = { schemaVersion: "lean-correction-supervisor-request-v12", route: "diagnostic", sourceRoot: r(1), candidateRoots: [r(2)], helperPath: "test-owned-helper.mts", helperBytesRoot: r(3), authorizationRoot: null, dataReviewPath: "pending", dataReviewRoot: null, helperReviewPath: "pending", helperReviewRoot: null }
    const finalized = { ...draft, authorizationRoot: r(4), dataReviewPath: "actual-data-review", dataReviewRoot: r(5), helperReviewPath: "actual-helper-review", helperReviewRoot: r(6) }
    expect(correction.leanCorrectionRequestDataRoot(finalized as never)).toBe(correction.leanCorrectionRequestDataRoot(draft as never))
    for (const changed of [{ helperBytesRoot: r(7) }, { sourceRoot: r(8) }, { route: "baseline" }, { candidateRoots: [r(9)] }]) expect(correction.leanCorrectionRequestDataRoot({ ...draft, ...changed } as never)).not.toBe(correction.leanCorrectionRequestDataRoot(draft as never))
  })
  it("admits exact v12 allocations through the real schedule, writable, capacity and reopen consumers", () => {
    const r = (n: number) => labRoot("v12-allocation-synthetic-only", n), e = accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION
    for (const route of ["diagnostic", "baseline"] as const) {
      const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: route === "diagnostic" ? 34 : 35, elapsedUpperBoundMs: 108000100, allocatedDiskBytes: e.physicalFloorBytes, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r(1), survivors: Array.from({length:661},(_,n)=>({identity:`.strategy-lab/v12-test-only-synthetic-${n}`,allocatedBytes:4096})) }
      const input = { sourceRoot:r(2), reviewRoot:r(3), coldRoot:LEAN_COLD_REUSE_HISTORY.coldRoot, planRoot:e.planRoot, candidateRoots:[r(4),r(5)], requestRoots:Array.from({length:route === "diagnostic"?1:36},(_,n)=>r(100+n)), seed:LEAN_COLD_REUSE_HISTORY.seed, route, reuseGrantRoot:r(6), supervisorDecisionRoot:e.approvalRoot, acceptedCheckRoot:route === "diagnostic"?null:r(7), requestBytesRoot:r(8), dataReviewRoot:r(9), setupAccountingRoot:r(10), predecessor:{...body,root:labRoot(body.schemaVersion,body)}, startupPolicyRoot:accounting.LEAN_STARTUP_POLICY_V5.root, timeboxExtension:e, attemptOrdinal:1 as const, priorClosureRoot:r(11), continuationRoot:r(12), acceptedReaderCloseRoot:route === "diagnostic"?null:r(13) }
      const a = accounting.createLeanSupervisorCorrectionAllocation(input,8)
      expect(accounting.leanSupervisorAllocationMode(accounting.admitLeanAllocation(JSON.parse(JSON.stringify(a))))).toBe("v12-1")
      expect(accounting.leanCapsForAllocation(a)).toEqual(accounting.LEAN_SUPERVISOR_RETEST_V12_CAPS)
      expect(accounting.leanWritablePaths(a)).toContain(".strategy-lab/lean-retest-envelope-setup-20261008-v12-1.json")
      expect(a.slots).toHaveLength(route === "diagnostic"?1:36)
      for (const change of [{attemptOrdinal:2 as const},{timeboxExtension:accounting.LEAN_TWO_PAIR_V11_EXTENSION},{priorClosureRoot:null},{continuationRoot:null}]) expect(()=>accounting.createLeanSupervisorCorrectionAllocation({...input,...change},8)).toThrow()
      expect(()=>correction.assertLeanCorrectionResources({elapsedMs:e.elapsedMs-e.reserveMs,charged:body.chargedMatches,physicalBytes:e.physicalFloorBytes,childRss:1,parentRss:1,freeBytes:accounting.LEAN_CAPS.totalBytes,availableMemoryBytes:2000000000},a)).toThrow()
    }
  })
  it("authenticates one own accepted full check plus actual FINAL per call, with no cached or duplicate audit", () => {
    const r = (n:number)=>labRoot("v12-synthetic-final",n), e = accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION
    const closure = {timeboxExtension:e, attemptOrdinal:1, closureClass:"accepted", finalReaderClose:true, acceptedCheckAbsent:false,resultAbsent:false,currentCharges:1,cumulativeCharged:35,checkRoot:r(1),checkBytesRoot:r(2),allocationRoot:r(3),sourceRoot:r(4),requestBytesRoot:r(5),head:"a".repeat(40),readerCloseMs:e.startedAtMs+100,root:r(6)}
    const audit = vi.spyOn(retained,"authenticateLeanRetryClosureV8").mockReturnValue(closure as never), duplicate = vi.spyOn(retained,"authenticateLeanSupervisorDiagnosticCheck").mockImplementation(()=>{throw Error("DUPLICATE_AUDIT")})
    try {
      expect(correction.authenticateLeanSupervisorRetestAcceptedJoinV12("v12-1").accepted.root).toBe(r(1))
      expect(audit).toHaveBeenCalledTimes(1);expect(duplicate).not.toHaveBeenCalled()
      correction.authenticateLeanSupervisorRetestAcceptedJoinV12("v12-1");expect(audit).toHaveBeenCalledTimes(2)
      for (const changed of [{timeboxExtension:accounting.LEAN_TWO_PAIR_V11_EXTENSION},{finalReaderClose:false},{closureClass:"refused"},{attemptOrdinal:2},{checkBytesRoot:null},{cumulativeCharged:34}]) {
        audit.mockReturnValue({...closure,...changed} as never)
        expect(()=>correction.authenticateLeanSupervisorRetestAcceptedJoinV12("v12-1")).toThrow()
      }
    } finally {audit.mockRestore();duplicate.mockRestore()}
  })
  it("rejects forged historical raw joins without an old ordinary reader or current manifest", () => {
    expect(()=>retained.validateLeanSupervisorRetestHistoricalCustodyV12(new Map())).toThrow()
    const fake = new Map(Object.keys(retained.LEAN_SUPERVISOR_RETEST_V12_HISTORY_PINS).map(path=>[path,new Uint8Array([0])]))
    expect(()=>retained.validateLeanSupervisorRetestHistoricalCustodyV12(fake)).toThrow()
    expect(()=>retained.validateLeanSupervisorRetestHistoricalCustodyV12(fake,["fabricated-accepted-check"])).toThrow()
  })
  it("the actual authorization consumer binds MAIN, independent reviewer, helper and final canonical bytes", () => {
    const r=(n:number)=>labRoot("v12-byte-custody-only",n), mode="v12-1" as const, route="diagnostic" as const, e=accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION
    const request=correction.createLeanSupervisorRetestRequestDraftV12(mode,route,{sourceRoot:r(1),reviewRoot:r(2),dataReviewRoot:r(3),helperReviewRoot:r(4),helperPath:correction.leanSupervisorRetestDocumentsV12(route).helper,helperBytesRoot:r(5),setupAccountingRoot:r(6),reuseGrantRoot:r(7),authorizationRoot:r(8),priorClosureRoot:r(9),continuationRoot:r(10),acceptedCheckRoot:null,acceptedReaderCloseRoot:null})
    const body={schemaVersion:"lean-supervisor-retest-execution-authorization-v12",timeboxExtension:e,approved:true,executionAuthorized:true,route,attemptOrdinal:1,sourceRoot:request.sourceRoot,approvalRoot:e.approvalRoot,planRoot:e.planRoot,policyRoot:e.root,requestDataRoot:correction.leanCorrectionRequestDataRoot(request),helperPath:request.helperPath,helperBytesRoot:request.helperBytesRoot,helperReviewRoot:request.helperReviewRoot,authorAgent:"/root",reviewerAgent:"/root/synthetic_independent_reviewer"}
    const authorization={...body,root:labRoot(body.schemaVersion,body)}, finalized={...request,authorizationRoot:accounting.leanBytesRoot(accounting.leanCanonicalBytes(authorization))}
    expect(()=>correction.validateLeanSupervisorRetestAuthorizationV12(authorization,finalized,route)).not.toThrow()
    for(const mutation of [{authorAgent:"/root/pretend_main"},{reviewerAgent:"/root"},{helperBytesRoot:r(11)},{helperReviewRoot:r(12)},{requestDataRoot:r(13)},{timeboxExtension:accounting.LEAN_TWO_PAIR_V11_EXTENSION},{rawError:"PRIVATE"}]) {
      const changed={...body,...mutation}, v={...changed,root:labRoot(body.schemaVersion,changed)}
      expect(()=>correction.validateLeanSupervisorRetestAuthorizationV12(v,{...finalized,authorizationRoot:accounting.leanBytesRoot(accounting.leanCanonicalBytes(v))},route)).toThrow()
    }
    expect(()=>correction.validateLeanSupervisorRetestAuthorizationV12(authorization,{...finalized,dataReviewRoot:r(14)},route)).not.toThrow() // excluded downstream DATA is checked by finalized review bytes, not this semantic authorization
    expect(()=>correction.validateLeanSupervisorRetestAuthorizationV12(authorization,{...finalized,helperReviewRoot:r(14)},route)).toThrow()
    expect(()=>correction.validateLeanSupervisorRetestAuthorizationV12({...authorization,root:r(15)},finalized,route)).toThrow()
  })
  it("finalized downstream review bytes stay strict even though review roots are excluded from the semantic input", () => {
    const original = process.cwd(), directory = mkdtempSync(join(tmpdir(), "v12-finalized-review-only-"))
    const phase = ".planning/phases/265-serious-current-rules-league-and-development-red-team", path = `${phase}/test-owned-finalized-review.md`
    const bytes = Buffer.from("---\nstatus: clean\n---\nsynthetic test-owned reviewed bytes\n"), finalizedRoot = accounting.leanBytesRoot(bytes)
    try {
      process.chdir(directory); mkdirSync(phase, { recursive: true })
      writeFileSync(path, Buffer.concat([bytes, Buffer.from("changed after finalization\n")]))
      // This invokes the actual consumer and fails at its canonical byte-custody gate,
      // before any source-manifest read. No actual report destination is involved.
      expect(()=>correction.authenticateLeanCorrectionReview(path, finalizedRoot, labRoot("v12-review-test", 1), null, undefined, "v12-1", accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION)).toThrow("LEAN_CORRECTION_REVIEW")
    } finally { process.chdir(original); rmSync(directory, { recursive: true, force: true }) }
  })
})
