/** Connected inert v8 envelope callers. No native/Worker/Docker/provider/Match dispatch. */
import { afterEach, describe, it, expect, vi } from "vitest"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { EventEmitter } from "node:events"
import { createHash } from "node:crypto"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { buildStrategyRevision } from "../packages/runtime-js/src/revision.js"
import { admitFactory, authorizeFactorySupervision } from "../packages/strategy-lab/src/factory/admission.js"
import { prospectiveLeagueRuntimeBinding } from "./lib/v1-38-league-prospective-lifetime.js"
import * as sessionIO from "./lib/v1-38-lean-container-match-session.js"
import { LAB_ADMITTED_ROOTS } from "../packages/strategy-lab/src/contracts.js"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { runLeanBaselineMatch } from "./lib/v1-38-lean-baseline-match.js"
import { retainLeanMatch } from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import { parseLeanCorrectionCommand, authenticateLeanCorrectionReview } from "./run-v1-38-lean-correction.js"
import { deriveLeanBaselineCandidateRoots, leanBaselineSourceManifest, leanBaselinePair, leanParentFailureReceiptHandler, LEAN_SUPERVISOR_REASON_FILE } from "./run-v1-38-lean-baseline.js"
import * as correction from "./run-v1-38-lean-correction.js"
import * as sourceIO from "./lib/v1-38-lean-baseline-source.js"
import * as reuseIO from "./lib/v1-38-lean-baseline-reuse.js"
import * as nativeIO from "./lib/v1-38-factory-supervised-runtime.js"
import * as authorityIO from "./lib/v1-38-lean-experiment-authority.js"
import * as bridgeIO from "../packages/strategy-lab/src/runtime-bridge.js"
import { buildPlannerCandidate } from "../packages/strategy-lab/src/planner/emit.js"
import { collectLeanBaselineMetrics } from "./lib/v1-38-lean-baseline-metrics.js"
import { validateLeanReplaySetupWitnessV7, leanReplayCarryElapsedV7 } from "./run-v1-38-lean-correction.js"
import { LEAN_HOST_STAGE_V7_SOURCE_INVENTORY, leanCorrectionSourceManifest } from "./run-v1-38-lean-correction.js"
import * as retained from "./lib/v1-38-lean-correction-retained.js"
import * as baselineRetained from "./lib/v1-38-lean-baseline-retained.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { leanBaselineSourcePublicationBindingV6, leanBaselineSourcePublicationBindingV7 } from "./lib/v1-38-lean-baseline-source.js"
import { buildLeanContainerBrokerSourceV6, buildLeanContainerBrokerSourceV7, buildLeanStartupWorkerHarnessV5, validateLeanStartupOriginV6, validateLeanStartupOriginV7 } from "./lib/v1-38-lean-container-match-session.js"
import { claimLeanRuntimeAuthority } from "./lib/v1-38-lean-experiment-authority.js"
import { captureLeanHostFailureV7, readLeanTrustedHostFailureStageV7 } from "./lib/v1-38-lean-host-stage-v7.js"
import { isLeanChildFailureReceipt, isLeanChildFailureReceiptV7, publishChildTerminalAfterOptionalReceipt, resolveLeanChildCliTerminal } from "./lib/v1-38-lean-child-cli-terminal.js"

const processControl = vi.hoisted(() => ({ head: "", git: undefined as undefined | ((args: readonly string[]) => unknown), control: undefined as undefined | ((command: string, args: readonly string[]) => unknown), worker: undefined as undefined | ((source: string, options: unknown) => unknown) }))
vi.mock("node:child_process", async original => { const deny = () => { throw new Error("SYNTHETIC_ONLY") }; return { ...await original<typeof import("node:child_process")>(), spawn: deny, spawnSync: (command: string, args: readonly string[]) => processControl.control ? processControl.control(command, args) : deny(), fork: deny, exec: deny, execSync: deny, execFile: deny, execFileSync: (command: string, args: string[]) => command === "git" && args.join("|") === "rev-parse|HEAD" && processControl.head ? processControl.head : command === "git" && processControl.git ? processControl.git(args) : deny() } })
vi.mock("node:worker_threads", async original => ({ ...await original<typeof import("node:worker_threads")>(), Worker: function(source: string, options: unknown) { if (processControl.worker) return processControl.worker(source, options); throw new Error("SYNTHETIC_ONLY") } }))
const virtualSource = vi.hoisted(() => ({ changed: "", review: "", reviewPath: "", failWrite: "", reviews: {} as Record<string, string> }))
vi.mock("node:fs", async original => {
  const fs = await original<typeof import("node:fs")>()
  return { ...fs, openSync: (...args: Parameters<typeof fs.openSync>) => {
    if (virtualSource.failWrite && String(args[0]).endsWith(virtualSource.failWrite) && typeof args[1] === "number" && (args[1] & (fs.constants.O_WRONLY | fs.constants.O_RDWR))) throw new Error("SYNTHETIC_PUBLICATION_FAULT")
    return fs.openSync(...args)
  }, readFileSync: (...args: Parameters<typeof fs.readFileSync>) => {
    if (typeof args[0] === "string" && /(?:^|\/)\.strategy-lab\//u.test(args[0])) throw new Error("CONSUMED_STORE_FORBIDDEN")
    if (String(args[0]) === virtualSource.reviewPath) return Buffer.from(virtualSource.review)
    if (virtualSource.reviews[String(args[0])]) return Buffer.from(virtualSource.reviews[String(args[0])])
    const bytes = fs.readFileSync(...args)
    return virtualSource.changed && String(args[0]).endsWith(virtualSource.changed) ? Buffer.concat([Buffer.from(bytes), Buffer.from("\n// synthetic source drift\n")]) : bytes
  } }
})

const root = `sha256:${"a".repeat(64)}`
const binding = { route: "diagnostic" as const, allocationRoot: root, chargeRoot: root, slotRoot: root }
const stages = ["match_preparation", "match_composition_postprocessing", "compact_replay_retention_publication", "terminal_result_publication"] as const
const r = (label: string) => labRoot("host-stage-v7-fixture", label)
const syntheticDirectories = new Set<string>()
const syntheticPrivateFiles = new Set<string>()
afterEach(() => { for (const path of syntheticPrivateFiles) rmSync(path); syntheticPrivateFiles.clear(); virtualSource.reviews = {}; virtualSource.changed = ""; virtualSource.reviewPath = ""; virtualSource.failWrite = ""; processControl.head = ""; processControl.git = undefined; processControl.control = undefined; processControl.worker = undefined; vi.restoreAllMocks(); for (const directory of syntheticDirectories) rmSync(directory, { recursive: true }); syntheticDirectories.clear() })
const allocationInput = (version: 5 | 6 | 7 | 8 = 8) => {
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: version === 8 ? 29 : version === 7 ? 28 : version === 6 ? 24 : 23, elapsedUpperBoundMs: 49_150_573, allocatedDiskBytes: 12_894_208, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r("history"), survivors: [{ identity: ".strategy-lab/synthetic-history", allocatedBytes: 4096 }] }
  return { ...(version === 8 ? { attemptOrdinal: 1 as const, priorClosureRoot: null, continuationRoot: null, acceptedReaderCloseRoot: null } : {}), sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: version === 8 ? lean.LEAN_RETRY_V8_PLAN_ROOT : version === 7 ? lean.LEAN_REPLAY_V7_SUPPLEMENT_ROOT : version === 6 ? lean.LEAN_REPLAY_V6_SUPPLEMENT_ROOT : lean.LEAN_STARTUP_SUPPLEMENT_ROOT, candidateRoots: [r("a"), r("b")], requestRoots: [r("request")], seed: "synthetic-v7", route: "diagnostic" as const, reuseGrantRoot: r("reuse"), supervisorDecisionRoot: version === 8 ? lean.LEAN_RETRY_V8_APPROVAL_ROOT : version === 7 ? lean.LEAN_REPLAY_V7_APPROVAL_ROOT : version === 6 ? lean.LEAN_REPLAY_V6_APPROVAL_ROOT : lean.LEAN_STARTUP_APPROVAL_ROOT, acceptedCheckRoot: null, requestBytesRoot: r("request-bytes"), dataReviewRoot: r("data"), setupAccountingRoot: r("setup"), startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, predecessor: { ...body, root: labRoot(body.schemaVersion, body) } }
}
describe("prospective twenty-hour allocation binding", () => {
  it.each([false, true])("retained refusal/absence=%s keeps new floor after the old cap", absent => {
    const extension = lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION
    const f = readerFixture(!absent, absent, extension.startedAtMs, 60_000_000 - extension.priorElapsedMs - 2, extension)
    if (absent) expect(retained.verifyLeanRetryTerminalOnlyV8(f.paths.request, "v8-1").closedElapsedMs).toBeGreaterThanOrEqual(60_000_000)
    else expect(() => retained.verifyLeanCorrectionRetained(f.paths.request, "diagnostic", "v8-1")).toThrow("DIAGNOSTIC_NOT_ACCEPTED")
    expect(retained.authenticateLeanRetryClosureV8("v8-1")).toMatchObject({ timeboxExtension: extension, closureClass: absent ? "absent" : "refused", cumulativeCharged: 30 })
    expect(lean.currentLeanElapsedMs(f.ledger)).toBeGreaterThanOrEqual(60_000_000)
    expect(sourceIO.leanBaselineSourcePublicationBindingV8(f.ledger.allocation, f.entry.head, f.sources[0]!.root, f.sources[0]!.sourceRoot)).toMatchObject({ timeboxExtension: extension })
  })
  it("authenticates the additive binding without extending legacy v8", () => {
    const legacy = lean.createLeanSupervisorCorrectionAllocation(allocationInput(), 8)
    expect(lean.leanCapsForAllocation(legacy).elapsedMs).toBe(57_600_000)
    const extension = lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION
    expect(extension).toMatchObject({ priorElapsedMs: 56_000_917, startedAtMs: 1791326194166, elapsedMs: 72_000_000 })
    const { root: _root, ...prior } = legacy.predecessor
    const p = { ...prior, elapsedUpperBoundMs: 60_000_000 }
    const input = { ...allocationInput(), timeboxExtension: extension, predecessor: { ...p, root: labRoot(p.schemaVersion, p) } }
    const allocation = lean.createLeanSupervisorCorrectionAllocation(input, 8)
    expect(lean.leanCapsForAllocation(allocation).elapsedMs).toBe(72_000_000)
    expect(lean.admitLeanAllocation(allocation)).toEqual(allocation)
    expect(lean.leanRetryRootElapsedFloorV8(extension.startedAtMs - 1, extension)).toBe(56_000_917)
    expect(lean.leanRetryRootElapsedFloorV8(extension.startedAtMs + 123, extension)).toBe(56_001_040)
    for (const patch of [{ root: r("wrong") }, { startedAtMs: extension.startedAtMs - 1 }, { approvalRoot: lean.LEAN_RETRY_V8_APPROVAL_ROOT }, { planRoot: lean.LEAN_RETRY_V8_PLAN_ROOT }, { priorElapsedMs: 0 }]) {
      expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...input, timeboxExtension: { ...extension, ...patch } }, 8)).toThrow()
      expect(() => lean.leanCapsForAllocation({ ...allocation, timeboxExtension: { ...extension, ...patch } })).toThrow()
    }
    expect(() => lean.leanCapsForAllocation({ ...allocation, timeboxExtension: undefined })).toThrow()
    expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...input, timeboxExtension: extension }, 7)).toThrow()
    expect(() => correction.assertLeanCorrectionResources({ elapsedMs: 70_140_000, charged: 29, physicalBytes: 13_000_000, childRss: 1, parentRss: 1, freeBytes: lean.LEAN_CAPS.totalBytes, availableMemoryBytes: 2_000_000_000 }, allocation)).toThrow()
  })
})
// Tiny new store only. No historical payload, native runtime or gameplay runs.
const producerFixture = (version: 5 | 6 | 7 | 8 = 8, wall = 1000, extension?: lean.LeanRetryTimeboxExtension) => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-v7-connected-synthetic-")))
  syntheticDirectories.add(directory); chmodSync(directory, 0o700)
  const store = join(directory, "store"), temp = join(directory, "scratch")
  mkdirSync(store, { mode: 0o700 }); mkdirSync(temp, { mode: 0o700 })
  const paths = { ...lean.leanCorrectionRoutePaths("diagnostic", version === 8 ? "v8-1" : "v7"), store, temp, request: join(directory, "request.json"), allocation: join(directory, "allocation.json") }
  const base = allocationInput(version), { root: _priorRoot, ...priorBody } = base.predecessor
  const prior = { ...priorBody, elapsedUpperBoundMs: extension?.priorElapsedMs ?? priorBody.elapsedUpperBoundMs }
  const initial = { ...base, ...(extension ? { timeboxExtension: extension } : {}), predecessor: { ...prior, root: labRoot(prior.schemaVersion, prior) }, sourceRoot: leanCorrectionSourceManifest(version === 8 ? "v8-1" : "v7", extension).root }
  const request = { ...(extension ? { timeboxExtension: extension } : {}), ...(version === 8 ? { attemptOrdinal: 1 as const, priorClosureRoot: null, continuationRoot: null, acceptedReaderCloseRoot: null } : {}), schemaVersion: version === 8 ? "lean-correction-supervisor-request-v8" as const : "lean-correction-supervisor-request-v7" as const, route: "diagnostic" as const, sourceRoot: initial.sourceRoot, planRoot: initial.planRoot, amendmentRoot: r("amendment"), reviewPath: "synthetic", reviewRoot: initial.reviewRoot, dataReviewPath: "synthetic", dataReviewRoot: initial.dataReviewRoot, coldRoot: initial.coldRoot, seed: initial.seed, reuseGrantRoot: initial.reuseGrantRoot, candidateRoots: initial.candidateRoots, requestRoots: initial.requestRoots, diagnosis: null, supervisorDecisionRoot: initial.supervisorDecisionRoot, acceptedCheckRoot: null, setupAccountingPath: "synthetic", setupAccountingRoot: initial.setupAccountingRoot, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, authorizationPath: "synthetic", authorizationRoot: r("authorization") }
  const allocation = lean.createLeanSupervisorCorrectionAllocation({ ...initial, requestBytesRoot: lean.leanBytesRoot(lean.leanCanonicalBytes(request)) }, version)
  const ledger = { directory: store, allocation }
  const write = (name: string, value: unknown, target = store) => writeFileSync(join(target, name), lean.leanCanonicalBytes(value), { mode: 0o600 })
  write("allocation.json", allocation); writeFileSync(join(store, "ledger.ndjson"), "", { mode: 0o600 }); writeFileSync(join(store, "time.ndjson"), "", { mode: 0o600 })
  write("request.json", request, directory); write("allocation.json", allocation, directory)
  const entry: lean.LeanChildEntryV2 = { schemaVersion: "lean-child-entry-v2", allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot: allocation.requestBytesRoot!, head: "1".repeat(40), parentPid: process.ppid, childPid: process.pid, handshakeRoot: r("handshake"), wallStartMs: wall, monotonicStartNs: "1000000000" }
  lean.publishLeanChildEntry(ledger, entry); lean.beginLeanInterval(ledger, "pilot-entry", wall, 1_000_000_000n)
  const source = buildPlannerCandidate().source
  const sources = ["tactical-0", "cold-opponent"].map((role, index) => sourceIO.buildLeanBaselineSource({ role, source: source + `\n// synthetic seat ${index}\n`, coldRoot: allocation.coldRoot!, implementationRoot: allocation.sourceRoot }))
  const reuse = { grant: { root: allocation.reuseGrantRoot!, coldRoot: allocation.coldRoot, seed: allocation.seed }, sources } as unknown as reuseIO.LeanColdReuse
  // Only inherited sealed-cold admission is replaced: no historical store opens.
  vi.spyOn(reuseIO, "validateLeanColdReuse").mockImplementation(value => { expect(value).toEqual(reuse); return reuse })
  for (const snapshot of sources) sourceIO.publishLeanReusedBaselineSource(ledger, snapshot, reuse)
  correction.publishLeanCorrection(join(store, "cold-reuse.json"), reuse, ledger)
  const slot = allocation.slots[0]!
  const pair = leanBaselinePair({ ordinal: 0, slot, priorLedgerBytesRoot: lean.leanBytesRoot(Buffer.alloc(0)), priorLedgerByteLength: 0, priorCharged: allocation.predecessor.chargedMatches, bottom: sources[0]!, top: sources[1]! })
  correction.publishLeanCorrection(join(store, "pair-0.json"), pair, ledger)
  vi.spyOn(Date, "now").mockReturnValue(wall); vi.spyOn(process.hrtime, "bigint").mockReturnValue(1_000_000_000n)
  const charge = lean.chargeLeanSlot(ledger, slot, { freeBytes: lean.LEAN_CAPS.totalBytes, availableMemoryBytes: 2_000_000_000 })
  const compact: lean.LeanCompactMatchRecord = { classification: "success", code: "OK", outcome: "DRAW", elapsedMs: 1, cleanupComplete: true, invocationCount: 0, accountingRoot: r("accounting"), executionRoot: r("execution"), telemetry: { transitions: 0, events: 0 } }
  const metrics = collectLeanBaselineMetrics({ kind: "failure", privacy: "private_offline", unchangedState: null, transitions: [], accounting: [], failure: { classification: "system_failure", code: "SYNTHETIC_NO_TRACE" } }, compact)
  const execution = { compact, replayFrames: (function* () { yield { frame: "synthetic" } })(), brainInputs: [], strategyInputs: [], trainingHalfPoints: 1 as const, semanticRoot: r("semantic"), metrics, decisionRoot: r("decisions"), diagnostic: null }
  const hostBinding = { route: "diagnostic" as const, allocationRoot: allocation.root, chargeRoot: charge.root, slotRoot: slot.root }
  return { ledger, entry, paths, request, reuse, pair, charge, execution, sources, slot, hostBinding, write }
}

describe("v8 connected route admission", () => {
  it("selects three physically distinct authenticated CLI routes without changing v7", () => {
    const paths = [1, 2, 3].map(n => lean.leanCorrectionRoutePaths("diagnostic", `v8-${n}` as never))
    expect(new Set(paths.map(p => p.store)).size).toBe(3)
    for (const [index, path] of paths.entries()) {
      const n = index + 1
      expect(correction.parseLeanCorrectionCommand([`run-supervisor-diagnostic-v8-${n}`, "--request", path.request]).supervisor).toBe(`v8-${n}`)
      expect(() => correction.parseLeanCorrectionCommand([`run-supervisor-diagnostic-v8-${n}`, "--request", paths[(index + 1) % 3]!.request])).toThrow()
    }
    expect(() => correction.parseLeanCorrectionCommand(["run-supervisor-diagnostic-v8-4", "--request", paths[0]!.request])).toThrow()
    expect(lean.leanSupervisorVersion("v7")).toBe(7)
  })
  it("binds ordinal at actual allocation admission, caps and writable identities", () => {
    const predecessorBody = { schemaVersion: "lean-correction-predecessor-v1", chargedMatches: 29, elapsedUpperBoundMs: 49150573, allocatedDiskBytes: 15000000, historicalPeakDiskBytes: "unknown", historicalPeakRssBytes: "unknown", historyRoot: r("history"), survivors: [{ identity: ".strategy-lab/synthetic-history", allocatedBytes: 4096 }] }
    const input = { sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: lean.LEAN_RETRY_V8_PLAN_ROOT, candidateRoots: [r("a"), r("b")], requestRoots: [r("request")], seed: "synthetic-v8", route: "diagnostic", reuseGrantRoot: r("reuse"), supervisorDecisionRoot: lean.LEAN_RETRY_V8_APPROVAL_ROOT, acceptedCheckRoot: null, requestBytesRoot: r("request-bytes"), dataReviewRoot: r("data"), setupAccountingRoot: r("setup"), startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, predecessor: { ...predecessorBody, root: labRoot(predecessorBody.schemaVersion, predecessorBody) }, attemptOrdinal: 1, priorClosureRoot: null, continuationRoot: null, acceptedReaderCloseRoot: null }
    const allocation = lean.createLeanSupervisorCorrectionAllocation(input as never, 8 as never)
    expect(lean.admitLeanAllocation(allocation)).toEqual(allocation)
    expect(lean.leanSupervisorAllocationMode(allocation)).toBe("v8-1")
    expect(lean.leanCapsForAllocation(allocation)).toEqual(lean.LEAN_REPLAY_V7_CAPS)
    expect(lean.leanWritablePaths(allocation)).toContain(lean.leanCorrectionRoutePaths("diagnostic", "v8-1" as never).request)
    for (const attemptOrdinal of [undefined, 0, 2, 4]) expect(() => lean.admitLeanAllocation({ ...allocation, attemptOrdinal })).toThrow()
  })
  it("provides separate result-present refusal and result-absent terminal validators", () => {
    expect(typeof retained.authenticateLeanRetryClosureV8).toBe("function")
    expect(typeof retained.verifyLeanRetryTerminalOnlyV8).toBe("function")
  })
})

const readerFixture = (failure = false, absent = false, wall = 1000, gapMs = 1, extension?: lean.LeanRetryTimeboxExtension) => {
  const f = producerFixture(8, wall, extension), actualPaths = lean.leanCorrectionRoutePaths
  vi.spyOn(lean, "leanCorrectionRoutePaths").mockImplementation((route, mode) => mode === "v8-1" && route === "diagnostic" ? f.paths : actualPaths(route, mode))
  vi.spyOn(correction, "readLeanCorrectionRequest").mockReturnValue({ request: f.request, reuse: f.reuse })
  vi.spyOn(process, "uptime").mockReturnValue(0)
  processControl.head = f.entry.head
  if (failure) {
    f.execution.compact = { ...f.execution.compact, classification: "system_failure", code: "CLEANUP", outcome: null, cleanupComplete: false }
    f.execution.trainingHalfPoints = null as never; f.execution.semanticRoot = null as never
    f.execution.metrics = collectLeanBaselineMetrics({ kind: "failure", privacy: "private_offline", unchangedState: null, transitions: [], accounting: [], failure: { classification: "system_failure", code: "SYNTHETIC_NO_TRACE" } }, f.execution.compact)
  }
  if (!absent) {
    correction.publishLeanCorrectionMatchEvidence({ ...f, bottom: f.sources[0]!, top: f.sources[1]!, origins: [], route: "diagnostic", supervisor: "v8-1", sourceRoot: f.ledger.allocation.sourceRoot })
    correction.publishLeanCorrectionTerminalResult(f.ledger, "diagnostic", "v8-1", f.request, f.entry, f.reuse, { status: "diagnostic_only", cells: [{ ordinal: 0, slotRoot: f.slot.root, compact: f.execution.compact }], training: null, holdoutOpened: false, formationMaterialized: false })
  }
  vi.spyOn(Date, "now").mockReturnValue(wall + 1); vi.spyOn(process.hrtime, "bigint").mockReturnValue(1001000000n)
  const terminal = lean.deriveLeanChildTerminal(f.ledger, f.entry, { exitCode: absent ? 1 : 0, signal: null, wallObservedMs: wall + 1, monotonicObservedNs: "1001000000", status: absent ? "child_failed" : "child_exited", parentRssBytes: 1, childRssObservedBytes: 1, physicalBytes: f.ledger.allocation.predecessor.allocatedDiskBytes, freeBytes: lean.LEAN_CAPS.totalBytes })
  lean.publishLeanChildTerminal(f.ledger, terminal)
  lean.beginLeanInterval(f.ledger, "correction-run-finalization", wall + 1, 1001000000n)
  vi.spyOn(Date, "now").mockReturnValue(wall + 2); vi.spyOn(process.hrtime, "bigint").mockReturnValue(1002000000n)
  lean.closeLeanInterval(f.ledger, "correction-run-finalization", wall + 2, 1002000000n)
  const startBody = { schemaVersion: "lean-correction-supervisor-admission-v8", attemptOrdinal: 1, route: "diagnostic", mode: "run", parentPid: f.entry.parentPid, wallStartMs: wall, monotonicStartNs: "1000000000" }, start = { ...startBody, root: labRoot(startBody.schemaVersion, startBody) }
  const closeBody = { schemaVersion: "lean-correction-supervisor-admission-close-v8", attemptOrdinal: 1, startRoot: start.root, route: "diagnostic", mode: "run", elapsedUpperBoundMs: 2, monotonicObservedNs: "1002000000", wallObservedMs: wall + 2, allocationRoot: f.ledger.allocation.root, ledgerInterval: "correction-run-finalization", importedMs: 1, ledgerCloseMs: wall + 2 }
  f.write("admission-run-start.json", start, f.paths.temp); f.write("admission-run-close.json", { ...closeBody, root: labRoot(closeBody.schemaVersion, closeBody) }, f.paths.temp)
  const reasonBody = { schemaVersion: "lean-parent-supervisor-reasons-v1", allocationRoot: f.ledger.allocation.root, sourceRoot: f.entry.sourceRoot, requestBytesRoot: f.entry.requestBytesRoot, entryBytesRoot: lean.leanBytesRoot(lean.leanCanonicalBytes(f.entry)), head: f.entry.head, parentPid: f.entry.parentPid, childPid: f.entry.childPid, exitCode: absent ? 1 : 0, signal: null, uncertain: false, reasons: [], observations: { entry: "published", childReady: "observed", resourceSampling: "observed", finalIdentity: "matched", failureReceipt: "absent", cleanup: "child_exit_observed", terminalization: "unobserved", initiatingCause: "unknown" } }
  f.write(LEAN_SUPERVISOR_REASON_FILE, { ...reasonBody, root: labRoot(reasonBody.schemaVersion, reasonBody) })
  vi.spyOn(Date, "now").mockReturnValue(wall + 2 + gapMs); vi.spyOn(process.hrtime, "bigint").mockReturnValue(1003000000n)
  return f
}
describe("actual one-shot reader closures", () => {
  it.each([["refused", false], ["absent", false], ["refused", true], ["absent", true], ["accepted-history", true]] as const)("admits ordinal 2 from real %s closure extension=%s through request owner", (closureClass, extended) => {
    const bookkeeping = closureClass === "accepted-history"
    const extension = bookkeeping ? lean.LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION : extended ? lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION : undefined, carry = extension ?? lean.LEAN_RETRY_V8_CARRY
    const fixtureExtension = bookkeeping ? lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION : extension
    const f = readerFixture(closureClass === "refused", closureClass !== "refused", (fixtureExtension ?? carry).startedAtMs + 100, 1, fixtureExtension)
    if (closureClass === "refused") expect(() => retained.verifyLeanCorrectionRetained(f.paths.request, "diagnostic", "v8-1")).toThrow("DIAGNOSTIC_NOT_ACCEPTED")
    else retained.verifyLeanRetryTerminalOnlyV8(f.paths.request, "v8-1")
    const oldClosure = retained.authenticateLeanRetryClosureV8("v8-1"), mode = "v8-2", n = 2
    const closure = bookkeeping ? { ...oldClosure, root: lean.LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION.diagnosticClosureRoot, closureClass: "accepted" as const, checkRoot: lean.LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION.diagnosticCheckRoot } : oldClosure
    const failedBaselineRoot = r("exact-failed-baseline-custody")
    if (bookkeeping) {
      vi.spyOn(retained, "authenticateLeanBookkeepingPredecessorV8").mockReturnValue({ diagnostic: closure, baseline: { root: failedBaselineRoot }, identities: [] } as never)
      vi.spyOn(retained, "authenticateLeanRetryClosureV8").mockImplementation(() => { throw new Error("OLD_FULL_READER_FORBIDDEN") })
      vi.spyOn(retained, "authenticateLeanSupervisorDiagnosticCheck").mockImplementation(() => { throw new Error("OLD_FULL_READER_FORBIDDEN") })
    }
    const pathsActual = vi.mocked(lean.leanCorrectionRoutePaths).getMockImplementation()!, paths = { ...pathsActual("diagnostic", mode), request: join(f.paths.temp, "successor-request.json") }
    vi.mocked(lean.leanCorrectionRoutePaths).mockImplementation((route, selected) => route === "diagnostic" && selected === mode ? paths : pathsActual(route, selected))
    if (!existsSync(".strategy-lab")) mkdirSync(".strategy-lab", { mode: 0o700 })
    const writePrivate = (path: string, value: unknown) => { writeFileSync(path, lean.leanCanonicalBytes(value), { mode: 0o600, flag: "wx" }); syntheticPrivateFiles.add(path) }
    const sourceRoot = leanCorrectionSourceManifest(mode, extension).root, history = reuseIO.LEAN_COLD_REUSE_HISTORY
    const reviewPath = resolve(".planning/phases/265-serious-current-rules-league-and-development-red-team/SYNTHETIC-source-review.md"), dataReviewPath = resolve(".planning/phases/265-serious-current-rules-league-and-development-red-team/SYNTHETIC-data-review.md")
    const diagnosisRoot = r("useful-independent-diagnosis"), review = `---\nstatus: clean\nsource_root: ${sourceRoot}\nsource_commit: ${f.entry.head}\nindependently_reviewed: true\nauthor_agent: /root\nreviewer_agent: /root/synthetic_review\ndiagnosis_root: ${diagnosisRoot}\nrepair_verified: true\n---\n`
    virtualSource.reviews[reviewPath] = review
    const setupBody = { ...(extension ? { timeboxExtension: extension } : {}), schemaVersion: "lean-retry-setup-witness-v8", attemptOrdinal: n, startedAtMs: carry.startedAtMs, observedAtMs: carry.startedAtMs + 100, priorElapsedMs: carry.priorElapsedMs, consumedTimeBytesRoot: lean.LEAN_RETRY_V8_CARRY.timeBytesRoot, decisionRoot: extension?.approvalRoot ?? lean.LEAN_RETRY_V8_APPROVAL_ROOT, threadId: "019fa652-915a-7183-9af1-3b3c05868d86", turnId: extension?.turnId ?? "01a111c1-6f91-7310-870d-056b2d77194f", source: "codex-task-event-custody" }, setup = { ...setupBody, root: labRoot(setupBody.schemaVersion, setupBody) }
    writePrivate(lean.leanRetrySetupPath(mode), setup)
    const request = { ...f.request, ...(extension ? { timeboxExtension: extension } : {}), attemptOrdinal: n, sourceRoot, coldRoot: history.coldRoot, seed: history.seed, amendmentRoot: history.amendmentRoot, reviewPath, reviewRoot: lean.leanBytesRoot(Buffer.from(review)), dataReviewPath, candidateRoots: deriveLeanBaselineCandidateRoots(history.coldRoot), setupAccountingPath: lean.leanRetrySetupPath(mode), setupAccountingRoot: setup.root, authorizationPath: ".strategy-lab/lean-retry-authorization-diagnostic-v8-2.json", requestRoots: correction.deriveLeanSupervisorCorrectionRequestRoots({ route: "diagnostic", seed: history.seed, coldRoot: history.coldRoot, planRoot: lean.LEAN_RETRY_V8_PLAN_ROOT, sourceRoot }, lean.LEAN_RETRY_V8_APPROVAL_ROOT, mode), priorClosureRoot: closure.root, continuationRoot: r("pending") }
    const continuationBody = { ...(bookkeeping ? { timeboxExtension: extension, failedBaselineRoot } : {}), schemaVersion: "lean-retry-continuation-v8", attemptOrdinal: n, priorClosureRoot: closure.root, sourceRoot, diagnosisRoot, resolvedDefectRoot: r("resolved-defect"), reviewRoot: request.reviewRoot }, continuation = { ...continuationBody, root: labRoot(continuationBody.schemaVersion, continuationBody) }
    writePrivate(".strategy-lab/lean-retry-continuation-v8-2.json", continuation); request.continuationRoot = continuation.root
    const authorizationBody = { ...(extension ? { timeboxExtension: extension } : {}), schemaVersion: "lean-retry-execution-authorization-v8", approved: true, executionAuthorized: true, route: "diagnostic", attemptOrdinal: n, sourceRoot, approvalRoot: lean.LEAN_RETRY_V8_APPROVAL_ROOT, planRoot: lean.LEAN_RETRY_V8_PLAN_ROOT, policyRoot: labRoot(lean.LEAN_RETRY_V8_POLICY.schemaVersion, lean.LEAN_RETRY_V8_POLICY), requestDataRoot: correction.leanCorrectionRequestDataRoot(request as never), authorAgent: "/root", reviewerAgent: "/root/synthetic_data_review" }, authorization = { ...authorizationBody, root: labRoot(authorizationBody.schemaVersion, authorizationBody) }
    writePrivate(request.authorizationPath, authorization); request.authorizationRoot = lean.leanBytesRoot(lean.leanCanonicalBytes(authorization))
    const dataReview = review.replace("---\n", `---\nrequest_root: ${correction.leanCorrectionRequestDataRoot(request as never)}\n`)
    virtualSource.reviews[dataReviewPath] = dataReview; request.dataReviewRoot = lean.leanBytesRoot(Buffer.from(dataReview))
    writeFileSync(paths.request, lean.leanCanonicalBytes(request), { mode: 0o600 })
    vi.spyOn(reuseIO, "authenticateLeanColdReuse").mockReturnValue(f.reuse)
    processControl.git = args => args[0] === "diff" && args[1] === "--exit-code" ? Buffer.alloc(0) : (() => { throw new Error("SYNTHETIC_ONLY") })()
    expect(correction.readLeanRetryRequestV8(paths.request, "diagnostic", mode).request.attemptOrdinal).toBe(2)
    for (const patch of [{ attemptOrdinal: undefined }, { attemptOrdinal: 3 }, { priorClosureRoot: r("missing-or-skipped") }, { continuationRoot: null }, { authorizationRoot: r("spent-authorization") }, ...(extension ? [{ timeboxExtension: undefined }, { timeboxExtension: { ...extension, startedAtMs: extension.startedAtMs - 1 } }, { timeboxExtension: { ...extension, root: r("cross-root") } }] : [])]) {
      const changed = Object.fromEntries(Object.entries({ ...request, ...patch }).filter(([, value]) => value !== undefined))
      writeFileSync(paths.request, lean.leanCanonicalBytes(changed), { mode: 0o600 })
      expect(() => correction.readLeanRetryRequestV8(paths.request, "diagnostic", mode)).toThrow()
    }
  }, 30000)
  it.each([false, true])("authenticates zero-charge pre-child-entry accounting extension=%s", extended => {
    const extension = extended ? lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION : undefined
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-v8-preentry-synthetic-")))
    syntheticDirectories.add(directory); chmodSync(directory, 0o700)
    const actualPaths = lean.leanCorrectionRoutePaths, paths = { ...actualPaths("diagnostic", "v8-1"), temp: directory, store: join(directory, "store"), request: join(directory, "absent-request.json"), allocation: join(directory, "allocation.json") }
    vi.spyOn(lean, "leanCorrectionRoutePaths").mockImplementation((route, mode) => route === "diagnostic" && mode === "v8-1" ? paths : actualPaths(route, mode))
    mkdirSync(paths.store, { mode: 0o700 })
    const input = allocationInput(), { root: _prior, ...pb } = input.predecessor, p = { ...pb, elapsedUpperBoundMs: extension?.priorElapsedMs ?? pb.elapsedUpperBoundMs }
    const allocation = lean.createLeanSupervisorCorrectionAllocation({ ...input, ...(extension ? { timeboxExtension: extension } : {}), predecessor: { ...p, root: labRoot(p.schemaVersion, p) }, sourceRoot: leanCorrectionSourceManifest("v8-1", extension).root }, 8), ledger = { directory: paths.store, allocation }
    if (extension) {
      const setupPath = join(directory, "inert-setup.json")
      vi.spyOn(lean, "leanRetrySetupPath").mockReturnValue(setupPath)
      const body = { schemaVersion: "lean-retry-setup-witness-v8", timeboxExtension: extension, attemptOrdinal: 1, startedAtMs: extension.startedAtMs, observedAtMs: extension.startedAtMs, priorElapsedMs: extension.priorElapsedMs, consumedTimeBytesRoot: lean.LEAN_RETRY_V8_CARRY.timeBytesRoot, decisionRoot: extension.approvalRoot, threadId: "019fa652-915a-7183-9af1-3b3c05868d86", turnId: extension.turnId, source: "codex-task-event-custody" }
      writeFileSync(setupPath, lean.leanCanonicalBytes({ ...body, root: labRoot(body.schemaVersion, body) }), { mode: 0o600 })
    }
    for (const [name, bytes] of [["allocation.json", lean.leanCanonicalBytes(allocation)], ["ledger.ndjson", ""], ["time.ndjson", ""]] as const) writeFileSync(join(paths.store, name), bytes, { mode: 0o600 })
    const now = (extension?.startedAtMs ?? lean.LEAN_RETRY_V8_CARRY.startedAtMs) + 1
    vi.spyOn(Date, "now").mockReturnValue(now); vi.spyOn(process.hrtime, "bigint").mockReturnValue(1_000_000_000n); processControl.head = "1".repeat(40)
    const start = correction.beginLeanCorrectionAdmission("diagnostic", "run", directory, { wallStartMs: now, monotonicStartNs: "1000000000" }, "v8-1")
    correction.closeLeanCorrectionAdmission(start, ledger, { wallStartMs: now, monotonicStartNs: "1000000000" })
    expect(() => correction.publishLeanRetryAdmissionFailureV8("v8-1", "run", true, null)).toThrow("ADMISSION_CUSTODY")
    correction.publishLeanRetryAdmissionFailureV8("v8-1", "run", true, { childPid: 123, exitCode: null, signal: "SIGKILL" })
    expect(retained.verifyLeanRetryTerminalOnlyV8(paths.request, "v8-1")).toMatchObject({ cumulativeCharged: 29, currentCharges: 0, entryBytesRoot: null, terminalBytesRoot: null, checkRoot: null, authorizing: false })
    writeFileSync(join(paths.store, "entry.json"), "corrupt", { mode: 0o600 })
    expect(() => retained.authenticateLeanRetryClosureV8("v8-1")).toThrow()
  }, 20000)
  it("closes the actual run scope refusal with its existing prepared ledger", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-v8-run-scope-synthetic-")))
    syntheticDirectories.add(directory); chmodSync(directory, 0o700)
    const actualPaths = lean.leanCorrectionRoutePaths, paths = { ...actualPaths("diagnostic", "v8-1"), temp: directory, store: join(directory, "store"), request: join(directory, "absent-request.json"), allocation: join(directory, "allocation.json") }
    vi.spyOn(lean, "leanCorrectionRoutePaths").mockImplementation((route, mode) => route === "diagnostic" && mode === "v8-1" ? paths : actualPaths(route, mode))
    mkdirSync(paths.store, { mode: 0o700 })
    const allocation = lean.createLeanSupervisorCorrectionAllocation({ ...allocationInput(), sourceRoot: leanCorrectionSourceManifest("v8-1").root }, 8), ledger = { directory: paths.store, allocation }
    for (const [name, bytes] of [["allocation.json", lean.leanCanonicalBytes(allocation)], ["ledger.ndjson", ""], ["time.ndjson", ""]] as const) writeFileSync(join(paths.store, name), bytes, { mode: 0o600 })
    const now = lean.LEAN_RETRY_V8_CARRY.startedAtMs + 1
    vi.spyOn(Date, "now").mockReturnValue(now); vi.spyOn(process.hrtime, "bigint").mockReturnValue(1_000_000_000n); processControl.head = "1".repeat(40)
    const preparation = correction.beginLeanCorrectionAdmission("diagnostic", "prepare", directory, { wallStartMs: now, monotonicStartNs: "1000000000" }, "v8-1")
    correction.closeLeanCorrectionAdmission(preparation, ledger, { wallStartMs: now, monotonicStartNs: "1000000000" })
    await expect(correction.leanCorrectionMain(["run-supervisor-diagnostic-v8-1", "--request", paths.request])).rejects.toThrow("COORDINATOR_HEAP_BOUND")
    expect(correction.authenticateLeanRetryAdmissionFailureV8("v8-1")).toMatchObject({ storeAbsent: false, currentCharges: 0, allocationRoot: allocation.root, childSpawned: false, cleanup: null })
    expect(retained.verifyLeanRetryTerminalOnlyV8(paths.request, "v8-1")).toMatchObject({ closureClass: "absent", cumulativeCharged: 29, currentCharges: 0, entryBytesRoot: null, terminalBytesRoot: null, authorizing: false })
  }, 20000)
  it("closes an actual inert pre-ledger admission failure without inventing child custody", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-v8-preledger-synthetic-")))
    syntheticDirectories.add(directory); chmodSync(directory, 0o700)
    const actualPaths = lean.leanCorrectionRoutePaths, paths = { ...actualPaths("diagnostic", "v8-1"), temp: directory, store: join(directory, "absent-store"), request: join(directory, "absent-request.json"), allocation: join(directory, "absent-allocation.json") }
    vi.spyOn(lean, "leanCorrectionRoutePaths").mockImplementation((route, mode) => route === "diagnostic" && mode === "v8-1" ? paths : actualPaths(route, mode))
    vi.spyOn(process, "uptime").mockReturnValue(0)
    vi.spyOn(Date, "now").mockReturnValue(lean.LEAN_RETRY_V8_CARRY.startedAtMs + 1)
    vi.spyOn(process.hrtime, "bigint").mockReturnValue(1_000_000_000n)
    processControl.head = "1".repeat(40)
    expect(() => retained.authenticateLeanRetryClosureV8("v8-1")).toThrow()
    // Real admission starts before the scope guard; the fixture deliberately
    // lacks the heap/scope permission and cannot reach preparation or dispatch.
    expect(() => correction.prepareLeanCorrection(paths.request, "diagnostic", "v8-1")).toThrow("COORDINATOR_HEAP_BOUND")
    expect(correction.authenticateLeanRetryAdmissionFailureV8("v8-1")).toMatchObject({ storeAbsent: true, currentCharges: 0, allocationRoot: null, childSpawned: false, cleanup: null })
    expect(() => retained.authenticateLeanRetryClosureV8("v8-1")).toThrow()
    const closure = retained.verifyLeanRetryTerminalOnlyV8(paths.request, "v8-1")
    expect(closure).toMatchObject({ closureClass: "absent", cumulativeCharged: 29, currentCharges: 0, entryBytesRoot: null, terminalBytesRoot: null, authorizing: false })
    expect(retained.authenticateLeanRetryClosureV8("v8-1")).toEqual(closure)
    expect(() => correction.prepareLeanCorrection(paths.request, "diagnostic", "v8-1")).toThrow()
    expect(() => retained.verifyLeanRetryTerminalOnlyV8(paths.request, "v8-1")).toThrow()
    mkdirSync(paths.store, { mode: 0o700 }); writeFileSync(join(paths.store, "entry.json"), "corrupt", { mode: 0o600 })
    expect(() => retained.authenticateLeanRetryClosureV8("v8-1")).toThrow()
  }, 20000)
  it.each([false, true])("allows ordinary/terminal absence=%s with a realistic nonzero gap below cap", absent => {
    const now = lean.LEAN_RETRY_V8_CARRY.startedAtMs + 57_500_000 - lean.LEAN_RETRY_V8_CARRY.priorElapsedMs
    const f = readerFixture(false, absent, lean.LEAN_RETRY_V8_CARRY.startedAtMs, now - lean.LEAN_RETRY_V8_CARRY.startedAtMs - 2)
    if (absent) expect(retained.verifyLeanRetryTerminalOnlyV8(f.paths.request, "v8-1").closedElapsedMs).toBeLessThan(57_600_000)
    else expect(retained.verifyLeanCorrectionRetained(f.paths.request, "diagnostic", "v8-1").cumulativeElapsedMs).toBe(57_500_000)
  }, 20000)
  it("debits a not-yet-imported gap once against the realistic whole-task wall floor", () => {
    const f = readerFixture()
    const now = lean.LEAN_RETRY_V8_CARRY.startedAtMs + 57_500_000 - lean.LEAN_RETRY_V8_CARRY.priorElapsedMs
    vi.mocked(Date.now).mockReturnValue(now)
    expect(lean.currentLeanElapsedMs(f.ledger, 200_000)).toBe(57_500_000)
    vi.mocked(Date.now).mockReturnValue(now + 100_001)
    expect(lean.currentLeanElapsedMs(f.ledger, 200_000)).toBeGreaterThan(lean.LEAN_REPLAY_V7_CAPS.elapsedMs)
  })
  it.each([false, true])("accepts the real diagnostic reader and joins FINAL close with extension=%s", async extended => {
    const extension = extended ? lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION : undefined
    const f = readerFixture(false, false, extension?.startedAtMs ?? 1000, 1, extension)
    const checked = retained.verifyLeanCorrectionRetained(f.paths.request, "diagnostic", "v8-1")
    const accepted = retained.authenticateLeanSupervisorDiagnosticCheck("v8-1"), closure = retained.authenticateLeanRetryClosureV8("v8-1")
    expect(closure).toMatchObject({ attemptOrdinal: 1, closureClass: "accepted", checkRoot: checked.root, acceptedCheckAbsent: false, finalReaderClose: true })
    const { root: _prior, ...priorBody } = f.ledger.allocation.predecessor, baselinePrior = { ...priorBody, chargedMatches: 30 }
    const baseline = lean.createLeanSupervisorCorrectionAllocation({ ...allocationInput(), ...(extension ? { timeboxExtension: extension } : {}), sourceRoot: f.ledger.allocation.sourceRoot, route: "baseline", acceptedCheckRoot: accepted.root, acceptedReaderCloseRoot: closure.root, requestRoots: Array.from({ length: 36 }, (_, n) => r(`baseline-${n}`)), predecessor: { ...baselinePrior, root: labRoot("lean-correction-predecessor-v1", baselinePrior) } } as never, 8)
    expect(() => baselineRetained.assertLeanRetryBaselineJoinV8(baseline, accepted, closure, f.entry.head)).not.toThrow()
    for (const patch of [{ attemptOrdinal: 2 }, { checkRoot: null }, { finalReaderClose: false }, { closureClass: "refused" }]) expect(() => baselineRetained.assertLeanRetryBaselineJoinV8(baseline, accepted, { ...closure, ...patch }, f.entry.head)).toThrow()
    // Selected baseline owner reads real allocation/entry bytes and authenticates
    // the diagnostic's actual accepted check and FINAL close before reader entry.
    const directory = join(f.paths.temp, "selected-baseline")
    mkdirSync(directory, { mode: 0o700 })
    f.write("allocation.json", baseline, directory)
    const baselineHead = "2".repeat(40)
    f.write("entry.json", { ...f.entry, head: baselineHead, allocationRoot: baseline.root, requestBytesRoot: baseline.requestBytesRoot }, directory)
    processControl.head = baselineHead
    const baselinePaths = { ...lean.leanCorrectionRoutePaths("baseline", "v8-1"), store: directory, request: join(directory, "request.json") }
    const paths = vi.mocked(lean.leanCorrectionRoutePaths).getMockImplementation()!
    vi.mocked(lean.leanCorrectionRoutePaths).mockImplementation((route, mode) => route === "baseline" && mode === "v8-1" ? baselinePaths : paths(route, mode))
    const gitCalls: readonly string[][] = []
    processControl.git = args => {
      ;(gitCalls as string[][]).push([...args])
      if (args[0] === "merge-base" && args.join("|") === `merge-base|--is-ancestor|${f.entry.head}|${baselineHead}` || args[0] === "diff" && args[1] === "--exit-code" && [f.entry.head, baselineHead].includes(args[2]!)) return Buffer.alloc(0)
      if (args.join("|") === `show|${f.entry.head}:${f.paths.allocation}`) return lean.leanCanonicalBytes(f.ledger.allocation)
      if (args.join("|") === `show|${baselineHead}:${baselinePaths.allocation}`) return lean.leanCanonicalBytes(baseline)
      throw new Error("SYNTHETIC_ONLY")
    }
    expect(() => baselineRetained.authenticateLeanRetryBaselineAuthorityV8(baseline, baselineHead)).not.toThrow()
    expect(gitCalls.some(args => args[0] === "merge-base")).toBe(true)
    const validGit = processControl.git
    processControl.git = () => { throw new Error("SYNTHETIC_NONLINEAR_OR_SOURCE_DRIFT") }
    expect(() => baselineRetained.authenticateLeanRetryBaselineAuthorityV8(baseline, baselineHead)).toThrow("RETRY_COMMITTED_LINEAGE")
    processControl.git = validGit
    writeFileSync(join(directory, "ledger.ndjson"), "", { mode: 0o600 }); writeFileSync(join(directory, "time.ndjson"), "", { mode: 0o600 })
    const baselineLedger = { directory, allocation: baseline }
    for (const snapshot of f.sources) sourceIO.publishLeanReusedBaselineSource(baselineLedger, snapshot, f.reuse)
    const pair = leanBaselinePair({ ordinal: 0, slot: baseline.slots[0]!, priorLedgerBytesRoot: lean.leanBytesRoot(Buffer.alloc(0)), priorLedgerByteLength: 0, priorCharged: 30, bottom: f.sources[0]!, top: f.sources[1]! })
    f.write("pair-0.json", pair, directory)
    lean.beginLeanInterval(baselineLedger, "pilot-entry", f.entry.wallStartMs, 1_000_000_000n)
    const charge = lean.chargeLeanSlot(baselineLedger, baseline.slots[0]!, { freeBytes: lean.LEAN_CAPS.totalBytes, availableMemoryBytes: 2_000_000_000 })
    const snapshot = f.sources[0]!, admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: snapshot.packet, proposal: snapshot.proposal, sourceBytes: Buffer.from(snapshot.source) }), validation: snapshot.validation })
    const defaults = defaultRuntimeMetadata("typescript"), revision = buildStrategyRevision({ source: snapshot.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
    const runtime = prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot: snapshot.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image })
    const runtimeBinding = { budgetRoot: baseline.root, attemptRoot: charge.root, matchId: `lean-${charge.root.slice(7, 31)}`, containerName: `lean-${charge.root.slice(7, 25)}-bottom`, ownershipLabel: `lean-${baseline.root.slice(7, 25)}`, seat: "bottom" as const, runtime }
    expect(authorityIO.leanStartupAuthorityDescriptorV5(authorityIO.issueLeanCorrectionRuntimeAuthority(baselineLedger, charge, snapshot, runtimeBinding, f.reuse))?.version).toBe(7)
    // Join accepted; the real ordinary owner independently refuses absent result.
    await expect(baselineRetained.verifyLeanRetryBaselineRetainedV8(baselinePaths.request, "v8-1")).rejects.toThrow("TERMINAL_ONLY_REQUIRED")
    for (const patch of [{ acceptedCheckRoot: r("wrong-check") }, { acceptedReaderCloseRoot: r("nonfinal-close") }]) {
      const { root: _root, ...body } = baseline
      const changed = { ...body, ...patch, root: labRoot(body.schemaVersion, { ...body, ...patch }) }
      f.write("allocation.json", changed, directory)
      f.write("entry.json", { ...f.entry, head: baselineHead, allocationRoot: changed.root, requestBytesRoot: changed.requestBytesRoot }, directory)
      await expect(baselineRetained.verifyLeanRetryBaselineRetainedV8(baselinePaths.request, "v8-1")).rejects.toThrow("RETRY_ACCEPTED_FINAL_JOIN")
    }
    expect(() => retained.verifyLeanCorrectionRetained(f.paths.request, "diagnostic", "v8-1")).toThrow()
    expect(() => retained.verifyLeanRetryTerminalOnlyV8(f.paths.request, "v8-1")).toThrow()
  }, 60000)
  it("refuses actual CLEANUP evidence, closes the journal, and emits one nonauthorizing receipt", () => {
    const f = readerFixture(true)
    expect(() => retained.verifyLeanCorrectionRetained(f.paths.request, "diagnostic", "v8-1")).toThrow("DIAGNOSTIC_NOT_ACCEPTED")
    expect(retained.authenticateLeanRetryClosureV8("v8-1")).toMatchObject({ closureClass: "refused", authorizing: false, acceptedCheckAbsent: true, checkRoot: null, attemptOrdinal: 1, finalReaderClose: true })
    expect(() => retained.authenticateLeanSupervisorDiagnosticCheck("v8-1")).toThrow()
    expect(() => retained.verifyLeanCorrectionRetained(f.paths.request, "diagnostic", "v8-1")).toThrow()
    expect(() => retained.verifyLeanRetryTerminalOnlyV8(f.paths.request, "v8-1")).toThrow()
    expect(() => retained.publishLeanRetryClosureV8(f.ledger, "v8-1", "refused")).toThrow()
  }, 20000)
  it("uses only the separate result-absent lifecycle and cannot fabricate reader acceptance", () => {
    const f = readerFixture(false, true)
    expect(() => retained.verifyLeanCorrectionRetained(f.paths.request, "diagnostic", "v8-1")).toThrow("TERMINAL_ONLY_REQUIRED")
    expect(retained.verifyLeanRetryTerminalOnlyV8(f.paths.request, "v8-1")).toMatchObject({ closureClass: "absent", resultAbsent: true, checkRoot: null, authorizing: false })
    expect(retained.authenticateLeanRetryClosureV8("v8-1").resultBytesRoot).toBeNull()
    expect(() => retained.authenticateLeanSupervisorDiagnosticCheck("v8-1")).toThrow()
    expect(() => retained.verifyLeanRetryTerminalOnlyV8(f.paths.request, "v8-1")).toThrow()
  }, 20000)
})

describe("connected startup request digest handshake", () => {
  it.each([8] as const)("real issued v%s host frames match their generated broker and reject wrong domains", version => {
    const f = producerFixture(version), wireVersion = 7, source = f.sources[0]!
    const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: source.packet, proposal: source.proposal, sourceBytes: Buffer.from(source.source) }), validation: source.validation })
    const defaults = defaultRuntimeMetadata("typescript")
    const revision = buildStrategyRevision({ source: source.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
    const runtime = prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot: source.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image })
    const runtimeBinding = { budgetRoot: f.ledger.allocation.root, attemptRoot: f.charge.root, matchId: `lean-${f.charge.root.slice(7, 31)}`, containerName: `lean-${f.charge.root.slice(7, 25)}-bottom`, ownershipLabel: `lean-${f.ledger.allocation.root.slice(7, 25)}`, seat: "bottom" as const, runtime }
    const token = authorityIO.issueLeanCorrectionRuntimeAuthority(f.ledger, f.charge, source, runtimeBinding, f.reuse)
    expect(authorityIO.leanStartupAuthorityDescriptorV5(token)?.version ?? 5).toBe(wireVersion)
    claimLeanRuntimeAuthority(token, runtimeBinding, "factory"); claimLeanRuntimeAuthority(token, runtimeBinding, "planner")
    const options = { ...runtimeBinding, image: runtime.image, infrastructureProfile: "closeout" as const, leanExperimentAuthority: token, leanExperimentBinding: runtimeBinding }
    for (const key of ["transport", "streamFactory"] as const) expect(() => sessionIO.createLeanContainerMatchSession({ ...options, [key]: () => { throw new Error("MUST_NOT_CALL") } })).toThrow("LEAN_EXPERIMENT_SESSION_BINDING")
    let owned = false
    processControl.control = (command, args) => {
      if (command !== "docker" || !["inspect", "create", "start", "rm"].includes(args[0]!)) throw new Error("SYNTHETIC_ONLY")
      if (args[0] === "inspect") return owned ? { status: 0, signal: null, stdout: Buffer.from(runtimeBinding.ownershipLabel + "\n"), stderr: Buffer.alloc(0) } : { status: 1, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.from("Error: No such object: " + runtimeBinding.containerName + "\n") }
      if (args[0] === "create") owned = true
      if (args[0] === "rm") owned = false
      return { status: 0, signal: null, stdout: Buffer.from(args[0] === "create" ? "synthetic-container\n" : ""), stderr: Buffer.alloc(0) }
    }
    const frames: Record<string, any>[] = []
    processControl.worker = (workerSource, options) => {
      if (!workerSource.includes('const { parentPort, workerData } = require("node:worker_threads")')) throw new Error("SYNTHETIC_ONLY")
      const data = (options as { workerData: { start: SharedArrayBuffer; command: string; args: string[] } }).workerData
      const broker = version === 8 ? buildLeanContainerBrokerSourceV7() : version === 7 ? buildLeanContainerBrokerSourceV7() : version === 6 ? buildLeanContainerBrokerSourceV6() : sessionIO.buildLeanContainerBrokerSourceV5()
      expect(data.command).toBe("docker"); expect(data.args.at(-1)).toBe(broker)
      // Execute ONLY the generated trusted binding guard, ending before the
      // supervisor/Worker construction. No guest source or broker imports run.
      const begin = broker.indexOf("const binding=q.startup.binding;"), end = broker.indexOf("const result=await superviseLeanStartupV5(binding,q.startup.hostBudgetMs", begin)
      expect(begin).toBeGreaterThan(0); expect(end).toBeGreaterThan(begin)
      const guard = new Function("q", "request", "startupHashV5", "exact", "now", broker.slice(begin, end))
      const exact = (value: object, keys: string[]) => Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key))
      Atomics.store(new Int32Array(data.start), 0, 1)
      return { terminate: async () => 0, postMessage(message: any) {
        let bytes = Buffer.alloc(0)
        if (message.type === "exchange") {
          const q = JSON.parse(Buffer.from(message.request).toString("utf8")); frames.push(q)
          const payload = Buffer.from(q.payloadBase64, "base64"), request = JSON.parse(payload.toString("utf8"))
          const digest = (domain: number) => `sha256:${createHash("sha256").update(`v1.38-lean-startup-v${domain}:${q.requestId}:`).update(payload).digest("hex")}`
          expect(q.startup.binding.requestRoot).toBe(digest(wireVersion))
          expect(q.startup.binding.requestOrdinal).toBe(q.requestId)
          expect(q.timeoutMilliseconds).toBe(1000); expect(q.startup.hostBudgetMs).toBe(5000)
          expect(() => guard(q, request, createHash, exact, () => 0n)).not.toThrow()
          for (const wrong of [5, 6, 7].filter(domain => domain !== wireVersion)) expect(() => guard({ ...q, startup: { ...q.startup, binding: { ...q.startup.binding, requestRoot: digest(wrong) } } }, request, createHash, exact, () => 0n)).toThrow("STARTUP_BINDING_V5")
          const inner = { ok: true, value: { activationOrders: [], strategyMemory: request.input.strategyMemory } }
          const metadata = { ...q.startup.binding, schemaVersion: `v1.38-lean-startup-origin-v${wireVersion}`, stage: "receipt", branch: "complete", ready: true, go: true, wait: "changed", termination: "not_required", unknown: false }
          bytes = Buffer.from(JSON.stringify({ requestId: q.requestId, status: 0, signal: null, stdoutBase64: Buffer.from(JSON.stringify(inner)).toString("base64"), stderrBase64: "", startupOrigin: metadata }) + "\n")
        }
        new Uint8Array(message.response).set(bytes); const control = new Int32Array(message.control); Atomics.store(control, 1, bytes.length); Atomics.store(control, 0, 1)
      } }
    }
    const session = sessionIO.createLeanContainerMatchSession(options)
    try {
      for (let ordinal = 1; ordinal <= 2; ordinal++) expect(session.adapter.execute({ source: Buffer.from(revision.metadata.sourceArtifact!.bytesBase64!, "base64").toString("utf8"), methodName: "selectActivations", input: { strategyMemory: null }, timeoutMs: 1000 }).ok).toBe(true)
      expect(frames).toHaveLength(2)
      expect(frames[0]!.payloadBase64).toBe(frames[1]!.payloadBase64)
    } finally { expect(session.close()).toEqual({ cleanupComplete: true, orphanedChild: false }) }
  })
})

describe("complete source closure and immutable failed prefix", () => {
  it("retains all inherited owners and ordinal-specific exact source roots", () => {
    const old = correction.leanCorrectionSourceManifest("v7"), manifests = ([1, 2, 3] as const).map(n => correction.leanCorrectionSourceManifest(`v8-${n}`))
    expect(old.entries.length).toBeGreaterThanOrEqual(888)
    for (const manifest of manifests) {
      for (const entry of old.entries) expect(manifest.entries).toContainEqual(entry)
      for (const path of correction.LEAN_RETRY_V8_SOURCE_INVENTORY) expect(manifest.entries.some(e => e.path === path)).toBe(true)
      expect(manifest.entries.some(e => e.path === "scripts/lib/v1-38-lean-baseline-match.ts")).toBe(true)
    }
    expect(new Set(manifests.map(m => m.root)).size).toBe(3)
    virtualSource.changed = "scripts/lib/v1-38-lean-baseline-retained.ts"
    expect(correction.leanCorrectionSourceManifest("v8-1").root).not.toBe(manifests[0]!.root)
  }, 20000)
  it("imports exact approved old finite records with no old reader or success retrocredit", () => {
    const prefix = correction.readLeanRetryFailedV7PrefixV8()
    expect(prefix.state.charged).toBe(29); expect(prefix.state.stopped).toBe(true)
    expect([...prefix.state.terminals.values()][0]!.record).toMatchObject({ code: "CLEANUP", classification: "system_failure", cleanupComplete: false })
    expect(prefix.time).toMatchObject({ active: false, elapsedMs: 47361631 })
    expect(prefix.time.closes.get("correction-supervisor-diagnostic-v7-reader-close")).toBe(1791295466715)
    expect(prefix.old.allocation.predecessor.survivors.length).toBeGreaterThan(0)
    expect(lean.leanRetryRootElapsedFloorV8(lean.LEAN_RETRY_V8_CARRY.startedAtMs + 123)).toBe(49150573 + 123)
  })
  it("maps only exact CLI ordinals to disjoint shell scratch paths", () => {
    const shell = readFileSync("scripts/run-v1-38-lean-correction.sh", "utf8")
    for (const n of [1, 2, 3] as const) for (const route of ["diagnostic", "baseline"] as const) {
      const mode = `v8-${n}` as const, paths = lean.leanCorrectionRoutePaths(route, mode)
      expect(shell).toContain(`prepare-supervisor-${route}-${mode}|run-supervisor-${route}-${mode}|verify-supervisor-${route}-${mode}`)
      expect(shell).toContain(paths.temp)
      expect(parseLeanCorrectionCommand([`verify-supervisor-${route}-${mode}`, "--request", paths.request])).toMatchObject({ route, supervisor: mode, request: paths.request })
      expect(correction.leanCorrectionChildMode(route, mode)).toBe(`child-supervisor-${route}-${mode}`)
    }
    for (const suffix of ["v8", "v8-0", "v8-4", "v8-01", "v8-1-extra"]) expect(() => parseLeanCorrectionCommand([`run-supervisor-diagnostic-${suffix}`])).toThrow()
  })
})
