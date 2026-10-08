import { constants, readFileSync } from "node:fs"
import * as fileIO from "node:fs"
import * as childIO from "node:child_process"
import { join, resolve } from "node:path"
import ts from "typescript"
import { afterEach, describe, expect, it, vi } from "vitest"
import * as accounting from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as correction from "./run-v1-38-lean-correction.js"
import * as contracts from "../packages/strategy-lab/src/contracts.js"
import * as baseline from "./run-v1-38-lean-baseline.js"
import * as retained from "./lib/v1-38-lean-correction-retained.js"
import * as reuseIO from "./lib/v1-38-lean-baseline-reuse.js"
import * as sourceIO from "./lib/v1-38-lean-baseline-source.js"
import { buildPlannerCandidate } from "../packages/strategy-lab/src/planner/emit.js"
import { LEAN_COLD_REUSE_HISTORY } from "./lib/v1-38-lean-baseline-reuse.js"

vi.mock("node:fs", async importOriginal => {
  const original = await importOriginal<typeof import("node:fs")>()
  return { ...original, existsSync: vi.fn(original.existsSync), readdirSync: vi.fn(original.readdirSync) }
})
vi.mock("node:child_process", async importOriginal => {
  const original = await importOriginal<typeof import("node:child_process")>()
  return { ...original, execFileSync: vi.fn(original.execFileSync) }
})
afterEach(() => vi.restoreAllMocks())
const labRoot = contracts.labRoot

// Fresh v13 adaptation of the existing closed-world full-audit fixture.
const acceptedV13Fixture = () => {
  const r = (n: number) => labRoot("v13-complete-synthetic-lifecycle", n), mode = "v13-1" as const
  const extension = accounting.LEAN_PREPARATION_CONTINUATION_V13_EXTENSION, at = extension.startedAtMs
  const paths = accounting.leanCorrectionRoutePaths("diagnostic", mode), sourceRoot = r(1)
  const request = correction.createLeanPreparationContinuationRequestDraftV13(mode, "diagnostic", { sourceRoot, reviewRoot: r(2), dataReviewRoot: r(3), helperReviewRoot: r(4), helperPath: correction.leanPreparationContinuationDocumentsV13("diagnostic").helper, helperBytesRoot: r(5), setupAccountingRoot: r(6), reuseGrantRoot: r(7), authorizationRoot: r(8), priorClosureRoot: r(9), continuationRoot: r(10), acceptedCheckRoot: null, acceptedReaderCloseRoot: null })
  const predecessorBody = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 34, elapsedUpperBoundMs: 108000000, allocatedDiskBytes: extension.physicalFloorBytes, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r(11), survivors: Array.from({ length: 695 }, (_, ordinal) => ({ identity: `.strategy-lab/v13-only-mocked-survivor-${ordinal}`, allocatedBytes: 4096 })) }
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

// Exact trusted declarations only; no production dependency injection and no
// Strategy code. Host effects are a closed-world map, never an empirical path.
const declarationHarness = (path: string, names: readonly string[], dependencies: Record<string, unknown>) => {
  const source = readFileSync(new URL(path, import.meta.url), "utf8"), ast = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true)
  const statements = names.map(name => {
    const found = ast.statements.filter(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === name))
    if (found.length !== 1) throw new Error(`HOST_DECLARATION_NOT_UNIQUE:${name}`)
    return found[0]!.getText(ast)
  })
  const compiled = ts.transpileModule(statements.join("\n"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
  const exports: Record<string, (...args: any[]) => any> = {}
  new Function(...Object.keys(dependencies), "exports", compiled)(...Object.values(dependencies), exports)
  return exports
}
// CR-01 reproduces the actual final publisher at the reviewer's physical cap.
// Its already-authenticated carry is synthetic; only publication HOST effects
// are substituted, so an absent resource guard cannot hide behind admission.
const heldPublicationHost = (allocatedDiskBytes: number) => {
  const paths = accounting.leanCorrectionRoutePaths("diagnostic", "v13-1"), docs = correction.leanPreparationContinuationDocumentsV13("diagnostic")
  const writes = new Map<string, unknown>(), carry = { verificationRoot: r(1), verificationBytesRoot: r(2), root: r(3), allocatedDiskBytes, survivors: Array.from({ length: 695 }, (_, i) => ({ identity: `synthetic-${i}`, allocatedBytes: 4096 })) }
  let physical = allocatedDiskBytes
  const dependencies = { ...accounting, ...contracts, ...correction, join, process: { memoryUsage: () => ({ rss: 4096 }) }, Date: { now: () => b.startedAtMs + 100 }, existsSync: (p: string) => writes.has(p), openLeanLedger: () => { throw new Error("NO_LEDGER") }, readLeanCorrectionJson: () => ({ wallStartMs: b.startedAtMs }), inspectLeanPreparationContinuationPredecessorV13: () => ({ ...carry, chargedMatches: 34 }), inventoryLeanTwoPairNoRefundV11: () => ({ survivors: carry.survivors, allocatedDiskBytes: physical }), deriveLeanPreparationContinuationTerminalCarryV13: () => carry, fail: () => { throw new Error("HOLD_OR_CAPACITY") }, publishLeanCorrection: (p: string, v: unknown) => { if (writes.has(p)) throw new Error("EXCLUSIVE"); writes.set(p, v); physical += Math.ceil(accounting.leanCanonicalBytes(v).length / 4096) * 4096 } }
  const source = readFileSync(new URL("./lib/v1-38-lean-correction-retained.ts", import.meta.url), "utf8")
  const names = ["publishPreparationContinuationHeldCarry", ...(source.includes("const preparationContinuationPublicationGuard =") ? ["preparationContinuationPublicationGuard", "publishPreparationContinuationGuarded"] : [])]
  const ast = ts.createSourceFile("retained", source, ts.ScriptTarget.ES2022, true), statements = names.map(name => ast.statements.find(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === name))!.getText(ast)).join("\n")
  const compiled = ts.transpileModule(statements + "\nexports.publish = publishPreparationContinuationHeldCarry;", { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, exported: any = {}
  new Function(...Object.keys(dependencies), "exports", compiled)(...Object.values(dependencies), exported)
  return { writes, docs, paths, publish: () => exported.publish("v13-1", "diagnostic", { guard: () => {}, binding: { sourceRoot: r(4), head: "b".repeat(40), requestBytesRoot: r(5), entryBytesRoot: null } }), physical: () => physical }
}
const r = (n: number) => contracts.labRoot("synthetic-v13-host", n)
const rooted = <T extends { schemaVersion: string }>(body: T) => ({ ...body, root: contracts.labRoot(body.schemaVersion, body) })
const b = accounting.LEAN_PREPARATION_CONTINUATION_V13_EXTENSION
const oldTemp = accounting.leanCorrectionRoutePaths("diagnostic", "v12-1").temp

function historyFixture(change?: (objects: Record<string, any>) => void) {
  const sourceRoot = r(900), requestBytesRoot = r(901), head = "a".repeat(40)
  const start = rooted({ schemaVersion: "lean-correction-supervisor-admission-v8", route: "diagnostic", mode: "prepare" })
  const close = rooted({ schemaVersion: "lean-correction-supervisor-admission-close-v8", route: "diagnostic", mode: "prepare", startRoot: start.root, allocationRoot: null, ledgerInterval: null, importedMs: 0 })
  const failure = rooted({ schemaVersion: "lean-retry-admission-failure-v8", authorizing: false, startRoot: start.root, closeRoot: close.root, currentCharges: 0, cumulativeCharged: null, storeAbsent: true, childSpawned: false, entryAbsent: true, resultAbsent: true, acceptedCheckAbsent: true, sourceRoot, requestBytesRoot, head })
  const readerStart = rooted({ schemaVersion: "lean-supervisor-retest-terminal-verifier-start-v12", mode: "v12-1", route: "diagnostic", head, sourceRoot })
  const readerClose = rooted({ schemaVersion: "lean-supervisor-retest-terminal-verifier-close-v12", startRoot: readerStart.root })
  const report = rooted({ schemaVersion: "lean-supervisor-retest-terminal-verification-v12", readerStartRoot: readerStart.root, readerCloseRoot: readerClose.root, failureRoot: failure.root, accepted: false, authorizing: false, finalReaderClose: false, resultAbsent: true, checkAbsent: true, currentCharges: 0, cumulativeCharged: 34, entryHead: null, allocationRoot: null, entryBytesRoot: null, terminalBytesRoot: null, sourceRoot, requestBytesRoot })
  const survivors = Array.from({ length: 695 }, (_, i) => ({ identity: `.strategy-lab/synthetic-old-survivor-${i}`, allocatedBytes: 4096 }))
  const carry = rooted({ schemaVersion: "lean-supervisor-retest-terminal-carry-v12", outcome: "refused_before_entry", accepted: false, authorizing: false, route: "diagnostic", attemptOrdinal: 1, currentCharges: 0, cumulativeCharged: 34, closedAtMs: 1791462838439, cumulativeElapsedMs: 114897342, allocatedDiskBytes: 21020672, survivors, verificationRoot: report.root, closureRoot: report.root, verificationBytesRoot: accounting.leanBytesRoot(accounting.leanCanonicalBytes(report)), entryHead: null, entryBytesRoot: null, terminalBytesRoot: null, resultBytesRoot: null, allocationRoot: null, timeboxExtension: accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION, sourceRoot, requestBytesRoot })
  const seal = rooted({ schemaVersion: "lean-supervisor-retest-terminal-hold-complete-v12", mode: "v12-1", route: "diagnostic", carryRoot: carry.root, carryBytesRoot: accounting.leanBytesRoot(accounting.leanCanonicalBytes(carry)), verificationRoot: report.root, verificationBytesRoot: carry.verificationBytesRoot, entryBytesRoot: null, head, sourceRoot, requestBytesRoot })
  const objects: Record<string, any> = { "admission-prepare-start.json": start, "admission-prepare-close.json": close, "admission-failure-v8.json": failure, "terminal-verifier-start-v12.json": readerStart, "terminal-verifier-close-v12.json": readerClose, "terminal-verification-v12.json": report, "terminal-carry-v12.json": carry, "terminal-hold-complete-v12.json": seal }
  change?.(objects)
  // Synthetic pins replace only the immutable fixture policy in this trusted
  // AST harness; the production eight-pin policy is never modified or read.
  const pins = Object.fromEntries(Object.entries(objects).map(([name, value]) => {
    const { root: _root, ...body } = value
    value.root = contracts.labRoot(value.schemaVersion, body)
    return [name, [accounting.leanBytesRoot(accounting.leanCanonicalBytes(value)).slice(7), value.root.slice(7)]]
  }))
  const paths = Object.keys(objects).map(name => `${oldTemp}/${name}`)
  const raw = new Map(Object.entries(objects).map(([name, value]) => [`${oldTemp}/${name}`, accounting.leanCanonicalBytes(value)]))
  const exported = declarationHarness("./lib/v1-38-lean-preparation-continuation-v13.ts", ["validateLeanPreparationHistoryV13"], { ...accounting, ...contracts, Buffer, oldTemp, LEAN_PREPARATION_V13_HISTORY_PATHS: paths, LEAN_PREPARATION_V13_HISTORY_PINS: pins, fail: () => { throw new TypeError("LEAN_PREPARATION_V13_HISTORY_CUSTODY") } })
  return { objects, raw, paths, validate: (input = raw, forbidden: string[] = []) => exported.validateLeanPreparationHistoryV13!(input, forbidden) }
}

function composedHost(route: "diagnostic" | "baseline" = "diagnostic", asCli = false) {
  const mode = "v13-1", paths = accounting.leanCorrectionRoutePaths(route, mode), docs = correction.leanPreparationContinuationDocumentsV13(route)
  const history = historyFixture(), files = new Map<string, Buffer>([...history.raw].map(([path, bytes]) => [resolve(path), Buffer.from(bytes)])), descriptors = new Map<number, string>()
  const sourceRoot = r(1), events: string[] = [], atMs = 1791463000000, opens: { path: string; flags: number; mode?: number }[] = []
  let resolveCli!: (value: unknown) => void, rejectCli!: (error: Error) => void
  const cliCompletion = asCli ? new Promise((yes, no) => { resolveCli = yes; rejectCli = no }) : undefined
  let nextFd = 1, dispatches = 0, publicationFailure: unknown, effectRefusal: unknown, allocationPublicationRefusal: unknown, ledger: any, closure: any
  const put = (path: string, value: any) => { files.set(resolve(path), Buffer.isBuffer(value) ? value : Buffer.from(accounting.leanCanonicalBytes(value))) }
  const json = (path: string) => JSON.parse(Buffer.from(files.get(resolve(path))!).toString("utf8"))
  const read = (path: string) => { const bytes = files.get(resolve(path)); if (!bytes) throw new Error("HOST_UNDECLARED_READ"); return bytes }
  for (const path of [correction.LEAN_PREPARATION_CONTINUATION_V13_APPROVAL, correction.LEAN_PREPARATION_CONTINUATION_V13_PLAN, `${accounting.LEAN_REMAINING_V9_PHASE}265-16-PREPARATION-CONTINUATION-APPROVAL-20261008.md`, `${accounting.LEAN_REMAINING_V9_PHASE}265-16-CONTINUATION-DECISION-v1.md`]) put(path, readFileSync(path))
  const setup = rooted({ schemaVersion: "lean-preparation-setup-witness-v13", timeboxExtension: b, attemptOrdinal: 1, startedAtMs: b.startedAtMs, observedAtMs: 1791462838439, priorElapsedMs: b.priorElapsedMs, consumedTimeBytesRoot: "sha256:565e95a5a6383c6e7207c1d896db53abd6459f4a8027aa15375d39fd397c0589", decisionRoot: b.approvalRoot, threadId: "019fa652-915a-7183-9af1-3b3c05868d86", turnId: b.turnId, source: "codex-task-event-custody" })
  put(docs.setup, setup); put(docs.helper, Buffer.from("synthetic reviewed helper bytes"))
  const historical = history.validate()
  const continuation = rooted({ schemaVersion: "lean-preparation-continuation-continuation-v13", timeboxExtension: b, attemptOrdinal: 1, priorClosureRoot: historical.carryRoot, sourceRoot, reviewRoot: r(2), cumulativeCharged: 34, cumulativeElapsedMs: historical.predecessor.elapsedUpperBoundMs, allocatedDiskBytes: historical.predecessor.allocatedDiskBytes })
  put(docs.continuation, continuation)
  closure = rooted({ schemaVersion: "lean-preparation-closure-v13", timeboxExtension: b, attemptOrdinal: 1, cumulativeCharged: 35, closureClass: "accepted", finalReaderClose: true, acceptedCheckAbsent: false, resultAbsent: false, currentCharges: 1, checkRoot: r(20), checkBytesRoot: r(21), allocationRoot: r(22), sourceRoot, requestBytesRoot: r(23), head: "b".repeat(40), readerCloseMs: atMs - 1 })
  let request = correction.createLeanPreparationContinuationRequestDraftV13(mode, route, { sourceRoot, reviewRoot: r(2), dataReviewRoot: r(3), helperReviewRoot: r(4), helperPath: docs.helper, helperBytesRoot: accounting.leanBytesRoot(read(docs.helper)), setupAccountingRoot: setup.root, reuseGrantRoot: r(5), authorizationRoot: r(6), priorClosureRoot: historical.carryRoot, continuationRoot: continuation.root, acceptedCheckRoot: route === "baseline" ? closure.checkRoot : null, acceptedReaderCloseRoot: route === "baseline" ? closure.root : null })
  const reviewBytes = (data?: contracts.LabRoot) => Buffer.from(`---\nstatus: clean\nsource_root: ${sourceRoot}\nindependently_reviewed: true\nauthor_agent: /root\nreviewer_agent: /root/synthetic_review\nsource_commit: ${"b".repeat(40)}\n${data ? `request_root: ${data}\n` : ""}---\n`)
  put(docs.review, reviewBytes()); request = { ...request, reviewRoot: accounting.leanBytesRoot(read(docs.review)) }
  const { root: _cr, ...cb } = continuation
  const cleanContinuation = rooted({ ...cb, reviewRoot: request.reviewRoot }); put(docs.continuation, cleanContinuation); request = { ...request, continuationRoot: cleanContinuation.root }
  const dataRoot = correction.leanCorrectionRequestDataRoot(request)
  put(docs.dataReview, reviewBytes(dataRoot)); put(docs.helperReview, reviewBytes(dataRoot))
  request = { ...request, dataReviewRoot: accounting.leanBytesRoot(read(docs.dataReview)), helperReviewRoot: accounting.leanBytesRoot(read(docs.helperReview)) }
  const authorize = (value = request, changes: Record<string, unknown> = {}) => rooted({ schemaVersion: "lean-preparation-continuation-execution-authorization-v13", timeboxExtension: b, approved: true, executionAuthorized: true, route, attemptOrdinal: 1, sourceRoot, approvalRoot: b.approvalRoot, planRoot: b.planRoot, policyRoot: b.root, requestDataRoot: correction.leanCorrectionRequestDataRoot(value), helperPath: value.helperPath, helperBytesRoot: value.helperBytesRoot, helperReviewRoot: value.helperReviewRoot, authorAgent: "/root", reviewerAgent: "/root/synthetic_review", ...changes })
  const authorization = authorize(); put(docs.authorization, authorization); request = { ...request, authorizationRoot: accounting.leanBytesRoot(read(docs.authorization)) }; put(paths.request, request)
  const diagnostic = accounting.leanCorrectionRoutePaths("diagnostic", mode)
  if (route === "baseline") put(join(diagnostic.store, "allocation.json"), Buffer.from("synthetic committed own allocation"))
  const time = { active: null, starts: new Map<string, number>(), closes: new Map<string, number>() }
  const selected = ["trustedGuardCodes", "trustedGuardErrors", "leanCorrectionTrustedGuardError", "fail", "root", "same", "leanRetryExtensionDocumentsV8", "assertLeanRetryExtensionDocumentsV8", "publishLeanCorrection", "beginLeanCorrectionAdmission", "leanCorrectionAdmissionElapsed", "assertLeanCorrectionAdmissionTime", "closeLeanCorrectionAdmission", "authenticateLeanCorrectionReview", "readReview", "authenticateLeanPreparationContinuationHistoricalCustodyV13", "readLeanPreparationContinuationSetupV13", "authenticateLeanPreparationContinuationAcceptedJoinV13", "validateLeanPreparationContinuationAuthorizationV13", "authenticateLeanPreparationContinuationSourceReviewV13", "readLeanPreparationContinuationRequestWithPurposeV13", "readLeanPreparationContinuationRequestV13", "readLeanPreparationContinuationPredecessorLineageV13", "inspectLeanPreparationContinuationPredecessorWithJoinV13", "inspectLeanPreparationContinuationPredecessorV13", "inventoryLeanTwoPairNoRefundV11", "publishLeanRetryAdmissionFailureV8", "prepareLeanCorrection", "leanCorrectionMain"]
  const dependencies: Record<string, unknown> = {
    ...accounting, ...contracts, ...baseline, ...correction, constants, join, resolve, Buffer, Date: { now: () => atMs }, process: { pid: 123, getuid: () => 123, argv: ["synthetic-node", "/synthetic-cli", `prepare-supervisor-${route}-v13-1`, "--request", paths.request], stdout: { write: (value: string) => resolveCli(JSON.parse(value)) }, stderr: { write: () => rejectCli(new Error("HOST_DIRECT_CLI_REFUSAL")) } }, pathToFileURL: () => ({ href: "file://synthetic-cli" }), LEAN_COLD_REUSE_HISTORY,
    AMENDMENT: ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-CONTINUATION-DECISION-v1.md", LEAN_PREPARATION_V13_HISTORY_PATHS: history.paths,
    validateLeanPreparationHistoryV13: history.validate,
    readFileSync: read,
    readLeanCorrectionPrivateBytes: read, readLeanCorrectionJson: json,
    leanCorrectionSourceManifest: () => ({ root: sourceRoot, entries: [{ path: "synthetic-functional-source.ts" }] }),
    execFileSync: (_exe: string, args: string[]) => args[0] === "rev-parse" ? "b".repeat(40) : args[0] === "show" ? read(join(diagnostic.store, "allocation.json")) : Buffer.alloc(0),
    existsSync: (path: string) => files.has(resolve(path)) || history.objects["terminal-carry-v12.json"].survivors.some((row: any) => resolve(row.identity) === resolve(path)),
    lstatSync: () => ({ isFile: () => true, isDirectory: () => true, isSymbolicLink: () => false, mode: 0o700, uid: 123 }), realpathSync: (path: string) => resolve(path),
    inventoryLeanSupervisorSurvivors: (identities: string[]) => [...new Set(identities)].sort().map(identity => ({ identity, allocatedBytes: 4096 })),
    authenticateLeanColdReuse: () => ({ grant: { root: request.reuseGrantRoot } }),
    authenticateLeanRetryClosureV8: (actualMode: string) => { expect(actualMode).toBe(mode); events.push("own-FINAL"); return closure },
    authenticateLeanPreparationContinuationTerminalCarryV13: () => ({ ...historical.predecessor, cumulativeElapsedMs: historical.predecessor.elapsedUpperBoundMs }),
    readLeanRemainingAcceptedLineagePurposeV9: () => { throw new Error("HOST_OLD_LINEAGE_FORBIDDEN") },
    scope: () => { events.push("scope"); if (effectRefusal !== undefined) throw effectRefusal },
    processAdmissionClock: () => ({ wallStartMs: atMs, monotonicStartNs: "1000000" }), admissionClock: () => ({ wallStartMs: atMs + 2, monotonicStartNs: "3000000" }),
    openSync: (path: string, flags: number, permissions?: number) => {
      const absolute = resolve(path); opens.push({ path: absolute, flags, mode: permissions })
      if (absolute === resolve(paths.allocation) && flags & constants.O_CREAT && allocationPublicationRefusal !== undefined) throw allocationPublicationRefusal
      if (path.endsWith("preparation-failure-v13.json") && publicationFailure !== undefined) throw publicationFailure
      if (flags & constants.O_CREAT) { if (files.has(absolute) && flags & constants.O_EXCL) throw new Error("HOST_EXCLUSIVE"); files.set(absolute, Buffer.alloc(0)) }
      const fd = nextFd++; descriptors.set(fd, absolute); return fd
    }, writeLeanAll: (fd: number, bytes: Uint8Array) => files.set(descriptors.get(fd)!, Buffer.from(bytes)), fsyncSync: () => {}, closeSync: (fd: number) => descriptors.delete(fd),
    assertLeanPublicationCapacity: () => {},
    createLeanLedger: (directory: string, allocation: accounting.LeanCorrectionAllocation) => { events.push("ledger"); ledger = { directory, allocation }; put(directory, Buffer.alloc(0)); put(join(directory, "ledger.ndjson"), Buffer.alloc(0)); put(join(directory, "time.ndjson"), Buffer.alloc(0)); return ledger },
    openLeanLedger: () => ledger, readLeanTimeAccounting: () => time, readLeanLedger: () => ({ charges: new Map(), charged: ledger.allocation.predecessor.chargedMatches }),
    beginLeanInterval: (_ledger: unknown, name: string, at: number) => { time.starts.set(name, at); time.active = name as any; return time },
    closeLeanInterval: (_ledger: unknown, name: string, at: number) => { time.closes.set(name, at); time.active = null; return time },
    runLeanBoundedParent: () => { dispatches++; throw new Error("HOST_MATCH_FORBIDDEN") },
    require: () => ({ verifyLeanPreparationContinuationTerminalOnlyV13: (...args: any[]) => { events.push(`terminal:${args[2]}`); return "terminal" }, verifyLeanPreparationContinuationRetainedV13: (...args: any[]) => { events.push(`retained:${args[2]}`); return "retained" } }),
  }
  // Bind recursive consumers to extracted declarations rather than export spies.
  const aliases = "\nconst readLeanRetrySetupWitnessV8 = () => readLeanPreparationContinuationSetupV13(); const readLeanCorrectionRequest = (p,r,m) => readLeanPreparationContinuationRequestV13(p,r,m); const inspectLeanSupervisorCorrectionPredecessor = (r,a,m) => inspectLeanPreparationContinuationPredecessorV13(r,a,m);"
  const source = readFileSync(new URL("./run-v1-38-lean-correction.ts", import.meta.url), "utf8"), ast = ts.createSourceFile("correction", source, ts.ScriptTarget.ES2022, true)
  const statements = ast.statements.filter(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(d => ts.isIdentifier(d.name) && selected.includes(d.name.text)) || asCli && ts.isIfStatement(node) && node.getText(ast).startsWith("if (process.argv[1]")).map(node => node.getText(ast)).join("\n").replace("import.meta.url", '"file://synthetic-cli"')
  for (const name of [...selected, "readLeanRetrySetupWitnessV8", "readLeanCorrectionRequest", "inspectLeanSupervisorCorrectionPredecessor"]) delete dependencies[name]
  const compiled = ts.transpileModule(statements + aliases, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
  const exports: Record<string, (...args: any[]) => any> = {}
  new Function(...Object.keys(dependencies), "exports", compiled)(...Object.values(dependencies), exports)
  return { files, events, opens, docs, paths, request, setup, history, sourceRoot, put, json, authorize, exports, cliCompletion, prepare: () => exports.prepareLeanCorrection!(paths.request, route, mode), refusal: (value: unknown) => { effectRefusal = value }, sidecarFailure: (value: unknown) => { publicationFailure = value }, allocationFailure: (value: unknown) => { allocationPublicationRefusal = value }, getClosure: () => closure, setClosure: (value: unknown) => { closure = value }, observation: () => ({ dispatches, ledger, descriptors: descriptors.size, time }) }
}

describe("first prospective v13-1 continuation (source-only HOST)", () => {
  it("CR-01 refuses actual final carry/hold publication before crossing the retained cap", () => {
    const h = heldPublicationHost(11999995904)
    expect(h.publish).toThrow()
    expect(h.writes.has(h.docs.carry)).toBe(false)
    expect(h.writes.has(join(h.paths.temp, "terminal-hold-complete-v13.json"))).toBe(false)
    expect(h.physical()).toBe(11999995904)
  })
  it("selects a distinct first route and rejects unused preparation ordinals", () => {
    const request = ".strategy-lab/lean-correction-supervisor-diagnostic-request-20261008-v13-1.json"
    expect(correction.parseLeanCorrectionCommand(["prepare-supervisor-diagnostic-v13-1", "--request", request])).toMatchObject({ supervisor: "v13-1", route: "diagnostic", request })
    expect(correction.leanCorrectionChildSupervisor("child-supervisor-diagnostic-v13-1")).toBe("v13-1")
    for (const ordinal of [2, 3, 4, 5]) expect(() => correction.parseLeanCorrectionCommand([`prepare-supervisor-diagnostic-v13-${ordinal}`, "--request", request])).toThrow()
    expect(accounting.leanCorrectionRoutePaths("diagnostic", "v12-1").request).not.toBe(request)
  })
  it("does not reset or reinterpret the old time envelope", () => {
    const extension = (accounting as unknown as Record<string, accounting.LeanRetryTimeboxExtension>).LEAN_PREPARATION_CONTINUATION_V13_EXTENSION!
    expect(extension).toMatchObject({ priorElapsedMs: 108000000, startedAtMs: 1791455941097, elapsedMs: 165600000, excludedIdleMs: 0, charged: 34, reserveMs: 1860000, maximumDiagnostics: 1, maximumBaselines: 1 })
    expect(accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION.elapsedMs).toBe(136800000)
    expect(accounting.leanRetryRootElapsedFloorV8(1791455941097 + 12345, extension)).toBe(108012345)
  })
  it("composes actual request/setup/reviews/history/predecessor/allocation/admission into zero-charge preparation", () => {
    const h = composedHost(), result = h.prepare()
    expect(result).toMatchObject({ issued: false, evidenceClass: "preparation_only", plannedCells: 1, charged: 0 })
    const allocation = h.json(h.paths.allocation)
    expect(accounting.leanSupervisorAllocationMode(allocation)).toBe("v13-1")
    expect(accounting.leanCapsForAllocation(allocation)).toEqual(accounting.LEAN_PREPARATION_CONTINUATION_V13_CAPS)
    expect(allocation.predecessor.chargedMatches).toBe(34)
    expect(allocation.predecessor.elapsedUpperBoundMs).toBe(108000000 + 1791463000000 - 1791455941097)
    expect(allocation.predecessor.allocatedDiskBytes).toBeGreaterThanOrEqual(21020672)
    expect(h.json(join(h.paths.temp, "admission-prepare-close.json"))).toMatchObject({ allocationRoot: allocation.root, ledgerInterval: "correction-preparation", elapsedUpperBoundMs: 2 })
    expect(h.observation()).toMatchObject({ dispatches: 0, descriptors: 0 })
    expect(h.files.has(resolve(join(h.paths.temp, "preparation-failure-v13.json")))).toBe(false)
    expect(h.files.has(resolve(join(h.paths.temp, "admission-failure-v8.json")))).toBe(false)
  })
  it("direct fresh CLI initializes actual family declarations before zero-charge admission", async () => {
    const h = composedHost("diagnostic", true)
    expect(await h.cliCompletion).toMatchObject({ issued: false, evidenceClass: "preparation_only", charged: 0, plannedCells: 1 })
    expect(h.observation()).toMatchObject({ dispatches: 0, descriptors: 0 })
  })
  it.each([
    ["source", { sourceRoot: r(999) }, "SUPERVISOR_REQUEST"],
    ["legacy schema", { schemaVersion: "lean-correction-supervisor-request-v12" }, "SUPERVISOR_REQUEST"],
    ["old carry", { priorClosureRoot: r(999) }, "DIAGNOSTIC_CUSTODY"],
    ["authority", { acceptedCheckRoot: r(999) }, "SUPERVISOR_REQUEST"],
    ["unsupported ordinal", { attemptOrdinal: 2 }, "SUPERVISOR_REQUEST"],
  ])("refuses %s before any allocation or dispatch, closes actual failure custody", (_name, changes, code) => {
    const h = composedHost(); let request = { ...h.request, ...changes }
    if (_name === "old carry") { const auth = h.authorize(request as correction.LeanCorrectionRequest); h.put(h.docs.authorization, auth); request = { ...request, authorizationRoot: accounting.leanBytesRoot(accounting.leanCanonicalBytes(auth)) } }
    h.put(h.paths.request, request)
    expect(h.prepare).toThrow(`LEAN_CORRECTION_${code}`)
    const sidecar = h.json(join(h.paths.temp, "preparation-failure-v13.json")), failure = h.json(join(h.paths.temp, "admission-failure-v8.json")), close = h.json(join(h.paths.temp, "admission-prepare-close.json"))
    expect(sidecar).toMatchObject({ stage: "request", guardCode: `LEAN_CORRECTION_${code}`, issued: false, authorizing: false, startRoot: failure.startRoot, supervisorMode: "v13-1" })
    expect(failure).toMatchObject({ currentCharges: 0, cumulativeCharged: null, storeAbsent: true, childSpawned: false, entryAbsent: true, resultAbsent: true, acceptedCheckAbsent: true, closeRoot: close.root })
    expect(h.observation()).toMatchObject({ ledger: undefined, dispatches: 0, descriptors: 0 })
  })
  it.each(["startedAtMs", "priorElapsedMs", "elapsedMs", "excludedIdleMs"])("rejects time reset/extension mutation of %s", key => {
    const extension = { ...b, [key]: key === "excludedIdleMs" ? 1 : 0 }
    expect(() => accounting.admitLeanRetryTimeboxExtension(extension)).toThrow()
    const h = composedHost(); h.put(h.docs.setup, rooted({ ...h.setup, startedAtMs: 1791463000000 } as any))
    expect(h.prepare).toThrow("LEAN_CORRECTION_SETUP_WITNESS")
    expect(h.json(join(h.paths.temp, "preparation-failure-v13.json"))).toMatchObject({ stage: "request", guardCode: "LEAN_CORRECTION_SETUP_WITNESS" })
  })
  it("authenticates source-review bytes and independent agents through the actual gate", () => {
    const h = composedHost(), review = Buffer.from(`---\nstatus: clean\nsource_root: ${h.sourceRoot}\nindependently_reviewed: true\nauthor_agent: /root\nreviewer_agent: /root\nsource_commit: ${"b".repeat(40)}\n---\n`)
    h.put(h.docs.review, review); h.put(h.paths.request, { ...h.request, reviewRoot: accounting.leanBytesRoot(review) })
    expect(h.prepare).toThrow() // continuation/auth bind the original reviewed request
    expect(() => h.exports.authenticateLeanPreparationContinuationSourceReviewV13!({ ...h.request, reviewRoot: accounting.leanBytesRoot(review) }, "diagnostic", "v13-1")).toThrow("LEAN_CORRECTION_REVIEW")
    expect(() => h.exports.authenticateLeanPreparationContinuationSourceReviewV13!({ ...h.request, reviewPath: correction.leanSupervisorRetestDocumentsV12("diagnostic").review }, "diagnostic", "v13-1")).toThrow("LEAN_CORRECTION_SUPERVISOR_REQUEST")
    for (const changes of [{ approved: false }, { executionAuthorized: false }, { policyRoot: accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION.root }, { reviewerAgent: "/root" }]) {
      const auth = h.authorize(h.request, changes), request = { ...h.request, authorizationRoot: accounting.leanBytesRoot(accounting.leanCanonicalBytes(auth)) }
      expect(() => h.exports.validateLeanPreparationContinuationAuthorizationV13!(auth, request, "diagnostic")).toThrow("LEAN_CORRECTION_SUPERVISOR_REQUEST")
    }
  })
  it("saved failed history is non-authorizing, pinned twice and rejects invalid semantic carry joins", () => {
    const fixture = historyFixture(), history = fixture.validate()
    expect(history).toMatchObject({ accepted: false, authorizing: false, cumulativeCharged: 34, predecessor: { elapsedUpperBoundMs: 114897342, allocatedDiskBytes: 21020672 } })
    const corrupted = new Map(fixture.raw); corrupted.set(fixture.paths[0]!, Buffer.from("{}"))
    expect(() => fixture.validate(corrupted)).toThrow("LEAN_PREPARATION_V13_HISTORY_CUSTODY")
    expect(() => fixture.validate(fixture.raw, ["synthetic-forbidden-entry"])).toThrow("LEAN_PREPARATION_V13_HISTORY_CUSTODY")
    for (const mutate of [
      (o: Record<string, any>) => { o["terminal-carry-v12.json"].cumulativeCharged = 0 },
      (o: Record<string, any>) => { o["terminal-carry-v12.json"].accepted = true },
      (o: Record<string, any>) => { o["terminal-carry-v12.json"].cumulativeElapsedMs = 108000000 },
      (o: Record<string, any>) => { o["terminal-carry-v12.json"].timeboxExtension = b },
      (o: Record<string, any>) => { o["admission-failure-v8.json"].closeRoot = r(999) },
      (o: Record<string, any>) => { o["terminal-hold-complete-v12.json"].carryBytesRoot = r(999) },
    ]) expect(() => historyFixture(mutate).validate()).toThrow("LEAN_PREPARATION_V13_HISTORY_CUSTODY")
  })
  it("new terminal-only schemas remain finite, non-authorizing and cannot substitute old/accepted carry", () => {
    const closedAtMs = 1791463000000, history = historyFixture().validate()
    const body = { schemaVersion: "lean-preparation-continuation-terminal-carry-v13" as const, timeboxExtension: b, authorizing: false, accepted: false, attemptOrdinal: 1, route: "diagnostic", outcome: "refused_before_entry", sourceRoot: r(1), requestBytesRoot: r(2), allocationRoot: null, entryHead: null, entryBytesRoot: null, terminalBytesRoot: null, resultBytesRoot: null, verificationRoot: r(3), verificationBytesRoot: r(4), closureRoot: r(3), closedAtMs, cumulativeElapsedMs: accounting.leanRetryRootElapsedFloorV8(closedAtMs, b), currentCharges: 0, cumulativeCharged: 34, allocatedDiskBytes: 21020672, survivors: history.predecessor.survivors }
    expect(retained.validateLeanPreparationContinuationTerminalCarryV13(rooted(body), "v13-1", "diagnostic")).toMatchObject({ accepted: false, authorizing: false })
    for (const changes of [{ accepted: true }, { authorizing: true }, { schemaVersion: "lean-supervisor-retest-terminal-carry-v12" }, { timeboxExtension: accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION }, { cumulativeElapsedMs: 108000000 }, { currentCharges: 1 }, { allocatedDiskBytes: 0 }]) expect(() => retained.validateLeanPreparationContinuationTerminalCarryV13(rooted({ ...body, ...changes }), "v13-1", "diagnostic")).toThrow()
    const report = { schemaVersion: "lean-preparation-continuation-terminal-verification-v13", accepted: false, authorizing: false, finalReaderClose: false, readerStartRoot: r(5), readerCloseRoot: r(6), currentCharges: 0, cumulativeCharged: 34 }
    expect(retained.validateLeanPreparationContinuationTerminalVerificationV13(rooted(report), report)).toEqual(rooted(report))
    expect(() => retained.validateLeanPreparationContinuationTerminalVerificationV13(rooted({ ...report, finalReaderClose: true }), report)).toThrow()
  })
  it("never inspects unknown errors or masks original refusal on duplicate/arbitrary sidecar failures", () => {
    const unknown = new Proxy({}, { get: () => { throw new Error("HOST_ERROR_INSPECTION_FORBIDDEN") } })
    for (const publication of ["normal", "duplicate", "arbitrary"]) {
      const h = composedHost(); h.refusal(unknown)
      const sidecarPath = join(h.paths.temp, "preparation-failure-v13.json")
      if (publication === "duplicate") h.put(sidecarPath, Buffer.from("immutable prior bytes"))
      if (publication === "arbitrary") h.sidecarFailure(unknown)
      let caught: unknown; try { h.prepare() } catch (error) { caught = error }
      expect(caught).toBe(unknown)
      expect(h.observation()).toMatchObject({ dispatches: 0, ledger: undefined, descriptors: 0 })
      expect(h.json(join(h.paths.temp, "admission-failure-v8.json"))).toMatchObject({ currentCharges: 0, childSpawned: false })
      if (publication === "normal") expect(h.json(sidecarPath)).toMatchObject({ guardCode: "unknown", stage: "scope" })
      if (publication === "duplicate") expect(h.files.get(resolve(sidecarPath))!.toString()).toBe("immutable prior bytes")
      expect(h.opens.find(row => row.path === resolve(sidecarPath))).toMatchObject({ mode: 0o600 })
    }
  })
  it.each(["diagnostic", "baseline"] as const)("retains original %s allocation-publication refusal, closes ledger and zero-charge custody", route => {
    const h = composedHost(route), refusal = h.exports.leanCorrectionTrustedGuardError!("LEAN_CORRECTION_CAPACITY")
    h.allocationFailure(refusal)
    let caught: unknown; try { h.prepare() } catch (error) { caught = error }
    expect(caught).toBe(refusal)
    const sidecar = h.json(join(h.paths.temp, "preparation-failure-v13.json")), failure = h.json(join(h.paths.temp, "admission-failure-v8.json")), close = h.json(join(h.paths.temp, "admission-prepare-close.json"))
    expect(sidecar).toMatchObject({ route, stage: "allocation_publication", guardCode: "LEAN_CORRECTION_CAPACITY", startRoot: failure.startRoot, admissionMode: "prepare", issued: false, authorizing: false })
    expect(failure).toMatchObject({ currentCharges: 0, cumulativeCharged: route === "diagnostic" ? 34 : 35, storeAbsent: false, childSpawned: false, closeRoot: close.root })
    expect(close.ledgerInterval).toBe("correction-preparation")
    expect(h.observation()).toMatchObject({ dispatches: 0, descriptors: 0 })
  })
  it("spends fresh admission, does not reuse old destinations, and enforces all-wall deadline reserve", () => {
    const h = composedHost(); h.put(h.paths.allocation, Buffer.alloc(0))
    expect(h.prepare).toThrow("LEAN_CORRECTION_SPENT_DESTINATION")
    expect(h.json(join(h.paths.temp, "preparation-failure-v13.json"))).toMatchObject({ stage: "destination" })
    const successful = composedHost(); successful.prepare(); expect(successful.prepare).toThrow()
    const allocation = successful.json(successful.paths.allocation)
    expect(() => successful.exports.assertLeanCorrectionAdmissionTime!(114897342, { wallStartMs: b.startedAtMs, monotonicStartNs: "1000000" }, { wallStartMs: b.startedAtMs + b.elapsedMs - b.priorElapsedMs - b.reserveMs, monotonicStartNs: "3000000" }, allocation)).toThrow("LEAN_CORRECTION_ADMISSION_TIME")
    expect(accounting.leanCorrectionRoutePaths("diagnostic", "v12-1").store).not.toBe(h.paths.store)
  })
  it("requires its own accepted FINAL closure for exactly 36 baseline cells", async () => {
    const h = composedHost("baseline"), prepared = h.prepare()
    expect(prepared).toMatchObject({ plannedCells: 36, charged: 0 })
    expect(h.json(h.paths.allocation).predecessor.chargedMatches).toBe(35)
    expect(h.events).toContain("own-FINAL")
    const accepted = h.getClosure()
    for (const field of ["finalReaderClose", "acceptedCheckAbsent", "resultAbsent", "cumulativeCharged"]) {
      h.setClosure({ ...accepted, [field]: field === "cumulativeCharged" ? 34 : field !== "finalReaderClose" })
      expect(() => h.exports.authenticateLeanPreparationContinuationAcceptedJoinV13!("v13-1")).toThrow("LEAN_CORRECTION_ACCEPTED_CHECK")
    }
    for (const route of ["diagnostic", "baseline"] as const) for (const kind of ["verify", "verify-terminal"]) {
      const path = accounting.leanCorrectionRoutePaths(route, "v13-1").request
      expect(await h.exports.leanCorrectionMain!([`${kind}-supervisor-${route}-v13-1`, "--request", path])).toBe(kind === "verify" ? "retained" : "terminal")
      expect(h.events.at(-1)).toBe(`${kind === "verify" ? "retained" : "terminal"}:${route}`)
    }
    expect(h.observation().dispatches).toBe(0)
  })
  it("publishes and reauthenticates fresh v13 own FINAL through the actual full retained audit", () => {
    const fixture = acceptedV13Fixture()
    const closure = retained.publishLeanRetryClosureV8(fixture.ledger, fixture.mode, "accepted")
    expect(closure).toMatchObject({ schemaVersion: "lean-preparation-closure-v13", currentCharges: 1, cumulativeCharged: 35, finalReaderClose: true, acceptedCheckAbsent: false, resultAbsent: false, timeboxExtension: b })
    expect(fixture.files.has(join(fixture.paths.store, "preparation-closure-v13.json"))).toBe(true)
    expect(fixture.files.has(join(fixture.paths.store, "retest-closure-v12.json"))).toBe(false)
    expect(retained.authenticateLeanRetryClosureV8(fixture.mode)).toEqual(closure)
    expect(correction.authenticateLeanPreparationContinuationAcceptedJoinV13(fixture.mode)).toMatchObject({ closure, accepted: { root: fixture.check.root, readerCloseMs: closure.readerCloseMs } })
    fixture.put(join(fixture.paths.store, "preparation-closure-v13.json"), fixture.rooted({ ...closure, schemaVersion: "lean-retry-closure-v8" } as any))
    expect(() => retained.authenticateLeanRetryClosureV8(fixture.mode)).toThrow()
  })
})
