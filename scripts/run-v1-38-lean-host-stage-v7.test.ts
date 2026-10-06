import { afterEach, describe, it, expect, vi } from "vitest"
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
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
import { join } from "node:path"
import { runLeanBaselineMatch } from "./lib/v1-38-lean-baseline-match.js"
import { retainLeanMatch } from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import { parseLeanCorrectionCommand, authenticateLeanCorrectionReview } from "./run-v1-38-lean-correction.js"
import { leanBaselineSourceManifest, leanBaselinePair, leanParentFailureReceiptHandler, LEAN_SUPERVISOR_REASON_FILE } from "./run-v1-38-lean-baseline.js"
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
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { leanBaselineSourcePublicationBindingV6, leanBaselineSourcePublicationBindingV7 } from "./lib/v1-38-lean-baseline-source.js"
import { buildLeanContainerBrokerSourceV6, buildLeanContainerBrokerSourceV7, buildLeanStartupWorkerHarnessV5, validateLeanStartupOriginV6, validateLeanStartupOriginV7 } from "./lib/v1-38-lean-container-match-session.js"
import { claimLeanRuntimeAuthority } from "./lib/v1-38-lean-experiment-authority.js"
import { captureLeanHostFailureV7, readLeanTrustedHostFailureStageV7 } from "./lib/v1-38-lean-host-stage-v7.js"
import { isLeanChildFailureReceipt, isLeanChildFailureReceiptV7, publishChildTerminalAfterOptionalReceipt, resolveLeanChildCliTerminal } from "./lib/v1-38-lean-child-cli-terminal.js"

const processControl = vi.hoisted(() => ({ head: "", control: undefined as undefined | ((command: string, args: readonly string[]) => unknown), worker: undefined as undefined | ((source: string, options: unknown) => unknown) }))
vi.mock("node:child_process", async original => { const deny = () => { throw new Error("SYNTHETIC_ONLY") }; return { ...await original<typeof import("node:child_process")>(), spawn: deny, spawnSync: (command: string, args: readonly string[]) => processControl.control ? processControl.control(command, args) : deny(), fork: deny, exec: deny, execSync: deny, execFile: deny, execFileSync: (command: string, args: string[]) => command === "git" && args.join("|") === "rev-parse|HEAD" && processControl.head ? processControl.head : deny() } })
vi.mock("node:worker_threads", async original => ({ ...await original<typeof import("node:worker_threads")>(), Worker: function(source: string, options: unknown) { if (processControl.worker) return processControl.worker(source, options); throw new Error("SYNTHETIC_ONLY") } }))
const virtualSource = vi.hoisted(() => ({ changed: "", review: "", reviewPath: "", failWrite: "" }))
vi.mock("node:fs", async original => {
  const fs = await original<typeof import("node:fs")>()
  return { ...fs, openSync: (...args: Parameters<typeof fs.openSync>) => {
    if (virtualSource.failWrite && String(args[0]).endsWith(virtualSource.failWrite) && typeof args[1] === "number" && (args[1] & (fs.constants.O_WRONLY | fs.constants.O_RDWR))) throw new Error("SYNTHETIC_PUBLICATION_FAULT")
    return fs.openSync(...args)
  }, readFileSync: (...args: Parameters<typeof fs.readFileSync>) => {
    if (typeof args[0] === "string" && /(?:^|\/)\.strategy-lab\//u.test(args[0])) throw new Error("CONSUMED_STORE_FORBIDDEN")
    if (String(args[0]) === virtualSource.reviewPath) return Buffer.from(virtualSource.review)
    const bytes = fs.readFileSync(...args)
    return virtualSource.changed && String(args[0]).endsWith(virtualSource.changed) ? Buffer.concat([Buffer.from(bytes), Buffer.from("\n// synthetic source drift\n")]) : bytes
  } }
})

const root = `sha256:${"a".repeat(64)}`
const binding = { route: "diagnostic" as const, allocationRoot: root, chargeRoot: root, slotRoot: root }
const stages = ["match_preparation", "match_composition_postprocessing", "compact_replay_retention_publication", "terminal_result_publication"] as const
const r = (label: string) => labRoot("host-stage-v7-fixture", label)
const syntheticDirectories = new Set<string>()
afterEach(() => { virtualSource.changed = ""; virtualSource.reviewPath = ""; virtualSource.failWrite = ""; processControl.head = ""; processControl.control = undefined; processControl.worker = undefined; vi.restoreAllMocks(); for (const directory of syntheticDirectories) rmSync(directory, { recursive: true }); syntheticDirectories.clear() })
const allocationInput = (version: 5 | 6 | 7 = 7) => {
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: version === 7 ? 28 : version === 6 ? 24 : 23, elapsedUpperBoundMs: 41_943_494, allocatedDiskBytes: 12_894_208, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r("history"), survivors: [{ identity: ".strategy-lab/synthetic-history", allocatedBytes: 4096 }] }
  return { sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: version === 7 ? lean.LEAN_REPLAY_V7_SUPPLEMENT_ROOT : version === 6 ? lean.LEAN_REPLAY_V6_SUPPLEMENT_ROOT : lean.LEAN_STARTUP_SUPPLEMENT_ROOT, candidateRoots: [r("a"), r("b")], requestRoots: [r("request")], seed: "synthetic-v7", route: "diagnostic" as const, reuseGrantRoot: r("reuse"), supervisorDecisionRoot: version === 7 ? lean.LEAN_REPLAY_V7_APPROVAL_ROOT : version === 6 ? lean.LEAN_REPLAY_V6_APPROVAL_ROOT : lean.LEAN_STARTUP_APPROVAL_ROOT, acceptedCheckRoot: null, requestBytesRoot: r("request-bytes"), dataReviewRoot: r("data"), setupAccountingRoot: r("setup"), startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, predecessor: { ...body, root: labRoot(body.schemaVersion, body) } }
}
// Tiny new store only. No historical payload, native runtime or gameplay runs.
const producerFixture = (version: 5 | 6 | 7 = 7) => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-v7-connected-synthetic-")))
  syntheticDirectories.add(directory); chmodSync(directory, 0o700)
  const store = join(directory, "store"), temp = join(directory, "scratch")
  mkdirSync(store, { mode: 0o700 }); mkdirSync(temp, { mode: 0o700 })
  const paths = { ...lean.LEAN_REPLAY_V7_ROUTES.diagnostic, store, temp, request: join(directory, "request.json"), allocation: join(directory, "allocation.json") }
  const initial = { ...allocationInput(version), sourceRoot: leanCorrectionSourceManifest("v7").root }
  const request = { schemaVersion: "lean-correction-supervisor-request-v7" as const, route: "diagnostic" as const, sourceRoot: initial.sourceRoot, planRoot: initial.planRoot, amendmentRoot: r("amendment"), reviewPath: "synthetic", reviewRoot: initial.reviewRoot, dataReviewPath: "synthetic", dataReviewRoot: initial.dataReviewRoot, coldRoot: initial.coldRoot, seed: initial.seed, reuseGrantRoot: initial.reuseGrantRoot, candidateRoots: initial.candidateRoots, requestRoots: initial.requestRoots, diagnosis: null, supervisorDecisionRoot: initial.supervisorDecisionRoot, acceptedCheckRoot: null, setupAccountingPath: "synthetic", setupAccountingRoot: initial.setupAccountingRoot, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, authorizationPath: "synthetic", authorizationRoot: r("authorization") }
  const allocation = lean.createLeanSupervisorCorrectionAllocation({ ...initial, requestBytesRoot: lean.leanBytesRoot(lean.leanCanonicalBytes(request)) }, version)
  const ledger = { directory: store, allocation }
  const write = (name: string, value: unknown, target = store) => writeFileSync(join(target, name), lean.leanCanonicalBytes(value), { mode: 0o600 })
  write("allocation.json", allocation); writeFileSync(join(store, "ledger.ndjson"), "", { mode: 0o600 }); writeFileSync(join(store, "time.ndjson"), "", { mode: 0o600 })
  write("request.json", request, directory); write("allocation.json", allocation, directory)
  const entry: lean.LeanChildEntryV2 = { schemaVersion: "lean-child-entry-v2", allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot: allocation.requestBytesRoot!, head: "1".repeat(40), parentPid: process.ppid, childPid: process.pid, handshakeRoot: r("handshake"), wallStartMs: 1000, monotonicStartNs: "1000000000" }
  lean.publishLeanChildEntry(ledger, entry); lean.beginLeanInterval(ledger, "pilot-entry", 1000, 1_000_000_000n)
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
  vi.spyOn(Date, "now").mockReturnValue(1000); vi.spyOn(process.hrtime, "bigint").mockReturnValue(1_000_000_000n)
  const charge = lean.chargeLeanSlot(ledger, slot, { freeBytes: lean.LEAN_CAPS.totalBytes, availableMemoryBytes: 2_000_000_000 })
  const compact: lean.LeanCompactMatchRecord = { classification: "success", code: "OK", outcome: "DRAW", elapsedMs: 1, cleanupComplete: true, invocationCount: 0, accountingRoot: r("accounting"), executionRoot: r("execution"), telemetry: { transitions: 0, events: 0 } }
  const metrics = collectLeanBaselineMetrics({ kind: "failure", privacy: "private_offline", unchangedState: null, transitions: [], accounting: [], failure: { classification: "system_failure", code: "SYNTHETIC_NO_TRACE" } }, compact)
  const execution = { compact, replayFrames: (function* () { yield { frame: "synthetic" } })(), brainInputs: [], strategyInputs: [], trainingHalfPoints: 1 as const, semanticRoot: r("semantic"), metrics, decisionRoot: r("decisions"), diagnostic: null }
  const hostBinding = { route: "diagnostic" as const, allocationRoot: allocation.root, chargeRoot: charge.root, slotRoot: slot.root }
  return { ledger, entry, paths, request, reuse, pair, charge, execution, sources, slot, hostBinding, write }
}

describe("connected startup request digest handshake", () => {
  it.each([5, 6, 7] as const)("real issued v%s host frames match their generated broker and reject wrong domains", version => {
    const f = producerFixture(version), source = f.sources[0]!
    const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: source.packet, proposal: source.proposal, sourceBytes: Buffer.from(source.source) }), validation: source.validation })
    const defaults = defaultRuntimeMetadata("typescript")
    const revision = buildStrategyRevision({ source: source.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
    const runtime = prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot: source.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image })
    const runtimeBinding = { budgetRoot: f.ledger.allocation.root, attemptRoot: f.charge.root, matchId: `lean-${f.charge.root.slice(7, 31)}`, containerName: `lean-${f.charge.root.slice(7, 25)}-bottom`, ownershipLabel: `lean-${f.ledger.allocation.root.slice(7, 25)}`, seat: "bottom" as const, runtime }
    const token = authorityIO.issueLeanCorrectionRuntimeAuthority(f.ledger, f.charge, source, runtimeBinding, f.reuse)
    expect(authorityIO.leanStartupAuthorityDescriptorV5(token)?.version ?? 5).toBe(version)
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
      const broker = version === 7 ? buildLeanContainerBrokerSourceV7() : version === 6 ? buildLeanContainerBrokerSourceV6() : sessionIO.buildLeanContainerBrokerSourceV5()
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
          expect(q.startup.binding.requestRoot).toBe(digest(version))
          expect(q.startup.binding.requestOrdinal).toBe(q.requestId)
          expect(q.timeoutMilliseconds).toBe(1000); expect(q.startup.hostBudgetMs).toBe(5000)
          expect(() => guard(q, request, createHash, exact, () => 0n)).not.toThrow()
          for (const wrong of [5, 6, 7].filter(domain => domain !== version)) expect(() => guard({ ...q, startup: { ...q.startup, binding: { ...q.startup.binding, requestRoot: digest(wrong) } } }, request, createHash, exact, () => 0n)).toThrow("STARTUP_BINDING_V5")
          const inner = { ok: true, value: { activationOrders: [], strategyMemory: request.input.strategyMemory } }
          const metadata = { ...q.startup.binding, schemaVersion: `v1.38-lean-startup-origin-v${version}`, stage: "receipt", branch: "complete", ready: true, go: true, wait: "changed", termination: "not_required", unknown: false }
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

describe("connected v7 producer and parent boundaries", () => {
  it.each(["composition", "cleanup", "provider"] as const)("captures real %s catch while denying native execution", async fault => {
    const f = producerFixture(), closed: string[] = [], receipts: unknown[] = []
    let getterReads = 0
    const hostile = new Proxy({}, { get() { getterReads++; throw new Error("STRATEGY_PRIVATE_GETTER") } })
    vi.spyOn(authorityIO, "issueLeanBaselineRuntimeAuthority").mockReturnValue({} as never)
    vi.spyOn(nativeIO, "createFactorySupervisedRuntime").mockImplementation(options => {
      if (fault === "provider") throw new Error("synthetic provider preparation")
      return { identity: { sourceRoot: options.sourceBytes ? lean.leanBytesRoot(options.sourceBytes) : r("identity"), revisionId: "synthetic" }, close: () => { closed.push(options.containerName!); if (fault === "cleanup") throw new Error("synthetic cleanup") }, verify: () => false, invoke: () => { throw new Error("NATIVE_FORBIDDEN") } } as never
    })
    vi.spyOn(bridgeIO, "runCanonicalLabMatch").mockImplementation(async () => { if (fault === "composition") throw hostile; return { kind: "failure", accounting: [], transitions: [], failure: { classification: "system_failure", code: "SYNTHETIC" } } as never })
    const thrown = await runLeanBaselineMatch({ ledger: f.ledger, charge: f.charge, slot: f.slot, seed: f.request.seed, bottom: f.sources[0]!, top: f.sources[1]!, checkpoint() {}, register() {}, unregister() {} }).catch(error => error)
    expect(readLeanTrustedHostFailureStageV7(thrown, f.hostBinding)).toBe(fault === "provider" ? "match_preparation" : "match_composition_postprocessing")
    await resolveLeanChildCliTerminal(Promise.reject(thrown), { connected: true, disconnect() {}, send(message, callback) { receipts.push(message); callback?.(null); return true } }, f.hostBinding)
    expect(isLeanChildFailureReceiptV7(receipts[0], f.hostBinding)).toBe(true); expect(getterReads).toBe(0)
    expect(JSON.stringify(receipts)).not.toMatch(/STRATEGY_PRIVATE_GETTER|stack|message|memory|objective/)
    if (fault !== "provider") expect(closed).toHaveLength(2)
  })
  it.each([".gz", "ledger.ndjson", "observation-0.json", "correction-origin.json", "result.json"])("reaches actual %s publication catch and connected parent terminal", async suffix => {
    const f = producerFixture(), stagesObserved: unknown[] = []
    expect(correction.publishLeanCorrectionMatchEvidence).toBeTypeOf("function")
    virtualSource.failWrite = suffix
    let error: unknown
    try {
      const cell = correction.publishLeanCorrectionMatchEvidence({ ledger: f.ledger, charge: f.charge, execution: f.execution, pair: f.pair, bottom: f.sources[0]!, top: f.sources[1]!, origins: [], route: "diagnostic", supervisor: "v7", sourceRoot: f.request.sourceRoot, hostBinding: f.hostBinding })
      correction.publishLeanCorrectionTerminalResult(f.ledger, "diagnostic", "v7", f.request, f.entry, f.reuse, { status: "diagnostic_only", cells: [{ ordinal: cell.ordinal, slotRoot: cell.slotRoot, compact: cell.compact }], training: null, holdoutOpened: false, formationMaterialized: false }, f.hostBinding)
    } catch (caught) { error = caught }
    virtualSource.failWrite = ""
    const expected = suffix === "ledger.ndjson" || suffix === "result.json" ? "terminal_result_publication" : "compact_replay_retention_publication"
    expect(readLeanTrustedHostFailureStageV7(error, f.hostBinding)).toBe(expected)
    const emitter = new EventEmitter(), reasons: string[] = []
    emitter.on("message", leanParentFailureReceiptHandler(f.ledger, 2, receipt => stagesObserved.push(receipt), reason => reasons.push(reason)))
    await resolveLeanChildCliTerminal(Promise.reject(error), { connected: true, disconnect() {}, send(message, callback) { emitter.emit("message", message); callback?.(null); return true } }, f.hostBinding)
    expect(stagesObserved).toHaveLength(1); expect(stagesObserved[0]).toMatchObject({ stage: expected, ...f.hostBinding }); expect(reasons).toEqual([])
    const receipt = stagesObserved[0] as Parameters<typeof publishChildTerminalAfterOptionalReceipt>[0]
    publishChildTerminalAfterOptionalReceipt(receipt, () => { throw new Error("optional publication") }, uncertain => {
      expect(uncertain).toBe(true)
      lean.publishLeanChildTerminal(f.ledger, lean.deriveLeanChildTerminal(f.ledger, f.entry, { exitCode: 1, signal: null, wallObservedMs: 1100, monotonicObservedNs: "1100000000", status: "child_failed", parentRssBytes: 1, childRssObservedBytes: 1, physicalBytes: f.ledger.allocation.predecessor.allocatedDiskBytes, freeBytes: 1 }))
    })
    expect(lean.readLeanChildTerminal(f.ledger).status).toBe("child_failed")
  })
  it("parent rejects stale, duplicate, legacy and partial custody using actual last charge", () => {
    const f = producerFixture(), accepted: unknown[] = [], reasons: string[] = [], emitter = new EventEmitter()
    emitter.on("message", leanParentFailureReceiptHandler(f.ledger, 2, receipt => accepted.push(receipt), reason => reasons.push(reason)))
    const receipt = { type: "lean-child-failure", schemaVersion: "lean-child-failure-v7", ...f.hostBinding, stage: stages[0], category: "host_boundary_observed" }
    emitter.emit("message", { ready: 2 })
    for (const patch of [{ chargeRoot: r("stale") }, { slotRoot: r("foreign") }, { schemaVersion: "lean-child-failure-v1" }, { stack: "private" }]) emitter.emit("message", { ...receipt, ...patch })
    emitter.emit("message", receipt); emitter.emit("message", receipt)
    writeFileSync(join(f.ledger.directory, "ledger.ndjson"), "{", { mode: 0o600 }); emitter.emit("message", receipt)
    expect(accepted).toEqual([receipt]); expect(reasons).toEqual(["malformed_ipc", "malformed_ipc", "malformed_ipc", "malformed_ipc", "duplicate_failure_receipt", "malformed_ipc"])
  })
  it("ordinary new diagnostic reader authenticates 29 charges and carries final reader-close only", () => {
    const f = producerFixture()
    expect(correction.publishLeanCorrectionMatchEvidence).toBeTypeOf("function")
    const cell = correction.publishLeanCorrectionMatchEvidence({ ledger: f.ledger, charge: f.charge, execution: f.execution, pair: f.pair, bottom: f.sources[0]!, top: f.sources[1]!, origins: [], route: "diagnostic", supervisor: "v7", sourceRoot: f.request.sourceRoot, hostBinding: f.hostBinding })
    correction.publishLeanCorrectionTerminalResult(f.ledger, "diagnostic", "v7", f.request, f.entry, f.reuse, { status: "diagnostic_only", cells: [{ ordinal: cell.ordinal, slotRoot: cell.slotRoot, compact: cell.compact }], training: null, holdoutOpened: false, formationMaterialized: false }, f.hostBinding)
    const terminal = lean.deriveLeanChildTerminal(f.ledger, f.entry, { exitCode: 0, signal: null, wallObservedMs: 1100, monotonicObservedNs: "1100000000", status: "child_exited", parentRssBytes: 1, childRssObservedBytes: 1, physicalBytes: f.ledger.allocation.predecessor.allocatedDiskBytes, freeBytes: 1 })
    lean.publishLeanChildTerminal(f.ledger, terminal)
    lean.beginLeanInterval(f.ledger, "correction-run-finalization", 1100, 1_100_000_000n); lean.closeLeanInterval(f.ledger, "correction-run-finalization", 1100, 1_100_000_000n)
    const startBody = { schemaVersion: "lean-correction-supervisor-admission-v7", route: "diagnostic", mode: "run", parentPid: f.entry.parentPid, wallStartMs: 1000, monotonicStartNs: "1000000000" }, start = { ...startBody, root: labRoot(startBody.schemaVersion, startBody) }
    const closeBody = { schemaVersion: "lean-correction-supervisor-admission-close-v7", startRoot: start.root, route: "diagnostic", mode: "run", elapsedUpperBoundMs: 100, monotonicObservedNs: "1100000000", wallObservedMs: 1100, allocationRoot: f.ledger.allocation.root, ledgerInterval: "correction-run-finalization", importedMs: 100, ledgerCloseMs: 1100 }
    f.write("admission-run-start.json", start, f.paths.temp); f.write("admission-run-close.json", { ...closeBody, root: labRoot(closeBody.schemaVersion, closeBody) }, f.paths.temp)
    const reasonsBody = { schemaVersion: "lean-parent-supervisor-reasons-v1", allocationRoot: f.ledger.allocation.root, sourceRoot: f.request.sourceRoot, requestBytesRoot: f.entry.requestBytesRoot, entryBytesRoot: terminal.entryBytesRoot, head: f.entry.head, parentPid: f.entry.parentPid, childPid: f.entry.childPid, exitCode: 0, signal: null, uncertain: false, reasons: [], observations: { entry: "published", childReady: "observed", resourceSampling: "observed", finalIdentity: "matched", failureReceipt: "absent", cleanup: "child_exit_observed", terminalization: "unobserved", initiatingCause: "unknown" } }
    f.write(LEAN_SUPERVISOR_REASON_FILE, { ...reasonsBody, root: labRoot(reasonsBody.schemaVersion, reasonsBody) })
    const originalPaths = lean.leanCorrectionRoutePaths
    vi.spyOn(lean, "leanCorrectionRoutePaths").mockImplementation((route, mode) => { if (route !== "diagnostic" || mode !== "v7") throw new Error("OLD_ROUTE_FORBIDDEN"); return f.paths as ReturnType<typeof originalPaths> })
    // Inherited sealed source/data admission only; ordinary v7 reader/audit,
    // retained bytes, publications, accounting and acceptance remain real.
    vi.spyOn(correction, "readLeanCorrectionRequest").mockReturnValue({ request: f.request, reuse: f.reuse })
    processControl.head = f.entry.head
    let clock = 1200
    vi.spyOn(Date, "now").mockImplementation(() => clock++)
    vi.spyOn(process.hrtime, "bigint").mockImplementation(() => BigInt(clock) * 1_000_000n)
    vi.spyOn(process, "uptime").mockReturnValue(0)
    const check = retained.verifyLeanCorrectionRetained(f.paths.request, "diagnostic", "v7")
    expect(check).toMatchObject({ accepted: true, successful: 1, cumulativeCharged: 29, phaseComplete: false })
    const accepted = retained.authenticateLeanSupervisorDiagnosticCheck("v7")
    expect(accepted.readerCloseMs).toBeGreaterThan(Number(check.readerObservedMs))
    expect(correction.leanReplayDiagnosticCarryV7(accepted, f.ledger, accepted.readerCloseMs + 25)).toEqual({ charged: 29, elapsedMs: accepted.closedElapsedMs + 25 })
    expect(() => correction.leanReplayDiagnosticCarryV7(accepted, f.ledger, Number(check.readerObservedMs))).toThrow("DIAGNOSTIC_UNCLOSED")
    expect(() => correction.leanReplayDiagnosticCarryV7({ ...accepted, allocationRoot: r("foreign") }, f.ledger, accepted.readerCloseMs + 25)).toThrow()
    const originalTime = readFileSync(join(f.ledger.directory, "time.ndjson"))
    writeFileSync(join(f.ledger.directory, "time.ndjson"), Buffer.from(originalTime).toString("utf8").split("\n").filter(line => !line.includes('"kind":"close"') || !line.includes("v7-reader-close")).join("\n"), { mode: 0o600 })
    expect(() => retained.authenticateLeanSupervisorDiagnosticCheck("v7")).toThrow()
    writeFileSync(join(f.ledger.directory, "time.ndjson"), originalTime, { mode: 0o600 })
    const checkPath = join(f.ledger.directory, f.paths.check), actualCheck = readFileSync(checkPath)
    for (const patch of [{ sourceRoot: r("foreign") }, { schemaVersion: "lean-correction-supervisor-retained-v6" }, { accepted: false }, { cumulativeCharged: 28 }]) { const { root: _root, ...body } = { ...check, ...patch }; writeFileSync(checkPath, lean.leanCanonicalBytes({ ...body, root: labRoot(body.schemaVersion, body) }), { mode: 0o600 }); expect(() => retained.authenticateLeanSupervisorDiagnosticCheck("v7")).toThrow() }
    writeFileSync(checkPath, actualCheck, { mode: 0o600 })
  })
})
describe("additive v7 identity", () => {
  it("closes exactly the checked target union and pins actual source bytes", () => {
    const plan = readFileSync(".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-HOST-STAGE-V7-PLAN-v1.md", "utf8")
    const inventory = [...new Set([...plan.matchAll(/<target file="([^"]+)"/gu)].map(match => match[1]!))]
    inventory.push(".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-HOST-STAGE-APPROVAL-20261006.md", ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-HOST-STAGE-V7-PLAN-v1.md", lean.LEAN_REPLAY_V7_POLICY.identity)
    expect([...LEAN_HOST_STAGE_V7_SOURCE_INVENTORY].sort()).toEqual([...new Set(inventory)].sort())
    const manifest = leanCorrectionSourceManifest("v7")
    for (const entry of [...leanBaselineSourceManifest().entries, ...LEAN_HOST_STAGE_V7_SOURCE_INVENTORY.map(path => ({ path, root: lean.leanBytesRoot(readFileSync(path)) }))]) expect(manifest.entries).toContainEqual(entry)
    expect(new Set(manifest.entries.map(entry => entry.path)).size).toBe(manifest.entries.length)
  })
  it.each(["packages/engine/src/backstab.ts", "packages/strategy-lab/src/runtime-bridge.ts", "packages/runtime-js/src/subprocess-ipc.ts", "scripts/lib/v1-38-lean-baseline-reuse.ts"])("refuses stale reviewed v7 authority after virtual mutation of %s with unchanged HEAD", dependency => {
    const manifest = leanCorrectionSourceManifest("v7"), fixedHead = "1".repeat(40)
    virtualSource.reviewPath = join(process.cwd(), ".planning/phases/265-serious-current-rules-league-and-development-red-team/SYNTHETIC-REVIEW.md")
    virtualSource.review = `---\nstatus: clean\nsource_root: ${manifest.root}\nsource_commit: ${fixedHead}\nindependently_reviewed: true\nauthor_agent: /root/synthetic_author\nreviewer_agent: /root/synthetic_reviewer\n---\n`
    const bytesRoot = lean.leanBytesRoot(Buffer.from(virtualSource.review))
    virtualSource.changed = dependency
    expect(leanCorrectionSourceManifest("v7").root).not.toBe(manifest.root)
    expect(() => authenticateLeanCorrectionReview(virtualSource.reviewPath, bytesRoot, manifest.root, null, undefined, "v7")).toThrow("REVIEW_SOURCE")
    expect(fixedHead).toBe("1".repeat(40))
  })
  it("joins the actual retained failed parent terminal to its last charge without admitting a result", () => {
    const validate = (retained as any).validateLeanHostStageTerminalOnlyV7
    expect(validate).toBeTypeOf("function")
    const a = lean.createLeanSupervisorCorrectionAllocation(allocationInput(), 7)
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-host-stage-v7-synthetic-")))
    syntheticDirectories.add(directory); chmodSync(directory, 0o700)
    const write = (name: string, value: unknown) => writeFileSync(join(directory, name), lean.leanCanonicalBytes(value), { mode: 0o600 })
    write("allocation.json", a)
    const chargeBody = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: a.root, slotRoot: a.slots[0]!.root, ordinal: 0 }
    const charge = { ...chargeBody, root: labRoot(chargeBody.schemaVersion, chargeBody) }
    writeFileSync(join(directory, "ledger.ndjson"), Buffer.concat([lean.leanCanonicalBytes({ kind: "charge", charge }), Buffer.from("\n")]), { mode: 0o600 })
    writeFileSync(join(directory, "time.ndjson"), Buffer.concat([{ kind: "start", id: "pilot-entry", atMs: 1000 }, { kind: "close", id: "pilot-entry", atMs: 1001 }].map(event => Buffer.concat([lean.leanCanonicalBytes(event), Buffer.from("\n")]))), { mode: 0o600 })
    const entry: lean.LeanChildEntryV2 = { schemaVersion: "lean-child-entry-v2", allocationRoot: a.root, sourceRoot: a.sourceRoot, requestBytesRoot: a.requestBytesRoot!, head: "1".repeat(40), parentPid: 1, childPid: 2, handshakeRoot: r("handshake"), wallStartMs: 1000, monotonicStartNs: "0" }
    write("entry.json", entry)
    const ledger = { directory, allocation: a }
    const terminal = lean.deriveLeanChildTerminal(ledger, entry, { exitCode: 1, signal: null, wallObservedMs: 1001, monotonicObservedNs: "1000000", status: "child_failed", parentRssBytes: 1, childRssObservedBytes: 1, physicalBytes: a.predecessor.allocatedDiskBytes, freeBytes: 1 })
    write("child-terminal.json", terminal)
    const receipt = { type: "lean-child-failure", schemaVersion: "lean-child-failure-v7", route: a.route, allocationRoot: a.root, chargeRoot: charge.root, slotRoot: charge.slotRoot, stage: stages[2], category: "host_boundary_observed" }
    expect(validate(ledger, receipt)).toMatchObject({ accepting: false, stage: stages[2], cumulativeCharged: 29, stopped: false, resultExists: false })
    for (const patch of [{ chargeRoot: r("stale") }, { slotRoot: r("stale") }, { route: "baseline" }, { schemaVersion: "lean-child-failure-v1" }, { stage: "private error" }]) expect(() => validate(ledger, { ...receipt, ...patch })).toThrow()
    expect(() => validate(ledger, null)).toThrow()
    write("result.json", { unexpected: true }); expect(() => validate(ledger, receipt)).toThrow()
  })
  it("reconstructs exact v7 caps and source-publication joins, rejecting legacy substitutions", () => {
    const a = lean.createLeanSupervisorCorrectionAllocation(allocationInput(), 7)
    expect(lean.admitLeanAllocation(a)).toEqual(a)
    expect(lean.leanReplayV7CapsForAllocation(a).elapsedMs).toBe(57_600_000)
    for (const patch of [{ caps: lean.LEAN_SUPERVISOR_V5_CAPS }, { schemaVersion: "lean-correction-supervisor-diagnostic-allocation-v6" }, { planRoot: lean.LEAN_REPLAY_V6_SUPPLEMENT_ROOT }, { supervisorDecisionRoot: lean.LEAN_REPLAY_V6_APPROVAL_ROOT }]) expect(() => lean.leanCapsForAllocation({ ...a, ...patch })).toThrow()
    const proof = leanBaselineSourcePublicationBindingV7(a, "1".repeat(40), r("snapshot"), r("snapshot-source"))
    expect(proof).toMatchObject({ schemaVersion: "lean-baseline-source-publication-v7", allocationRoot: a.root, sourceRoot: a.sourceRoot })
    expect(() => leanBaselineSourcePublicationBindingV6(a, "1".repeat(40), r("snapshot"), r("snapshot-source"))).toThrow()
    expect(() => leanBaselineSourcePublicationBindingV7(a, "bad", r("snapshot"), r("snapshot-source"))).toThrow()
    expect(() => claimLeanRuntimeAuthority({ schemaVersion: "lean-runtime-authority-v1", version: 7 } as never, {} as never, "factory")).toThrow()
  })
  it("authenticates precisely the finite failed v6 prefix without a reader or invented stop", () => {
    const c = lean.LEAN_REPLAY_V7_CARRY
    const custody = { allocationRoot: c.allocationRoot, rawRoots: c.roots, charged: 28, currentCharges: 3, currentTerminals: 2, nonterminalOrdinal: 2, stopped: false, resultExists: false, closedElapsedMs: c.closedElapsedMs, effectiveCloseMs: c.effectiveCloseMs, active: false }
    expect(lean.validateLeanReplayV7PredecessorCustody(custody)).toBeUndefined()
    for (const patch of [{ charged: 27 }, { currentTerminals: 3 }, { stopped: true }, { resultExists: true }, { nonterminalOrdinal: null }, { active: true }, { rawRoots: { ...c.roots, time: r("wrong") } }]) expect(() => lean.validateLeanReplayV7PredecessorCustody({ ...custody, ...patch })).toThrow()
  })
  it("counts one contiguous current interval with no caller-created gap or reset", () => {
    const c = lean.LEAN_REPLAY_V7_CARRY
    const body = { schemaVersion: "lean-replay-setup-witness-v7", approvalRoot: lean.LEAN_REPLAY_V7_APPROVAL_ROOT, supplementRoot: lean.LEAN_REPLAY_V7_SUPPLEMENT_ROOT, policyRoot: lean.LEAN_REPLAY_V7_POLICY.bytesRoot, priorElapsedMs: c.priorElapsedMs, charged: 28, segments: [{ startMs: c.startedAtMs, closeMs: null }], consumedTimeBytesRoot: c.roots.time }
    const witness = { ...body, root: labRoot(body.schemaVersion, body) }
    expect(leanReplayCarryElapsedV7(witness, c.startedAtMs + 1234)).toBe(41_944_728)
    for (const patch of [{ priorElapsedMs: 0 }, { charged: 27 }, { segments: [{ startMs: c.startedAtMs + 1, closeMs: null }] }, { segments: [...body.segments, ...body.segments] }, { consumedTimeBytesRoot: r("foreign") }]) expect(() => validateLeanReplaySetupWitnessV7({ ...witness, ...patch })).toThrow()
    expect(() => leanReplayCarryElapsedV7(witness, c.startedAtMs + 57_600_000 - c.priorElapsedMs)).toThrow()
  })
  it("keeps the startup control bytes and versioned broker/origin fences", () => {
    expect(buildLeanContainerBrokerSourceV7()).toBe(buildLeanContainerBrokerSourceV6().replaceAll("-v6", "-v7"))
    const origin = { allocationRoot: r("allocation"), chargeRoot: r("charge"), seat: "bottom", policyRoot: lean.LEAN_STARTUP_POLICY_V5.root, harnessRoot: lean.leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV5())), requestOrdinal: 1, requestRoot: r("request"), method: "selectActivations", inputRoot: r("input"), sourceRoot: r("source"), executableRoot: r("executable"), schemaVersion: "v1.38-lean-startup-origin-v7", stage: "receipt", branch: "complete", ready: true, go: true, wait: "changed", termination: "not_required", unknown: false }
    expect(validateLeanStartupOriginV7(origin)).toEqual(origin)
    expect(() => validateLeanStartupOriginV6(origin)).toThrow()
    expect(() => validateLeanStartupOriginV7({ ...origin, schemaVersion: "v1.38-lean-startup-origin-v6" })).toThrow()
  })
  it("has disjoint routes and the exact approved elapsed-only cap delta", () => {
    const v7 = (lean as any).LEAN_REPLAY_V7_ROUTES
    expect(v7).toBeDefined()
    for (const route of ["diagnostic", "baseline"] as const) {
      expect(lean.leanCorrectionRoutePaths(route, "v7" as never)).toBe(v7[route])
      expect(v7[route].store).not.toBe(lean.LEAN_REPLAY_V6_ROUTES[route].store)
      expect(parseLeanCorrectionCommand([`run-supervisor-${route}-v7`, "--request", v7[route].request])).toMatchObject({ supervisor: "v7", route })
      expect(() => parseLeanCorrectionCommand([`run-supervisor-${route}-v7`, "--request", lean.LEAN_REPLAY_V6_ROUTES[route].request])).toThrow()
    }
    expect((lean as any).LEAN_REPLAY_V7_CAPS).toEqual({ ...lean.LEAN_SUPERVISOR_V5_CAPS, elapsedMs: 57_600_000 })
  })
})
describe("v7 host-only stage custody", () => {
  it("captures actual source/scenario preparation before a provider can open", async () => {
    const input = { ledger: { allocation: { schemaVersion: "lean-correction-supervisor-diagnostic-allocation-v7", route: "diagnostic", root } }, charge: { root }, slot: { root }, bottom: {}, top: {} }
    const thrown = await runLeanBaselineMatch(input as never).catch(error => error)
    expect(readLeanTrustedHostFailureStageV7(thrown, binding)).toBe("match_preparation")
  })
  it("captures actual compact admission and never fabricates terminal publication", () => {
    const observed: string[] = []
    expect(() => retainLeanMatch({} as never, {} as never, {} as never, [], (stage, error) => { observed.push(stage); throw captureLeanHostFailureV7(stage, binding, error) })).toThrow()
    expect(observed).toEqual(["compact_replay_retention_publication"])
  })
  it("attempts terminal publication even when optional receipt publication fails", () => {
    const receipt = { type: "lean-child-failure" as const, schemaVersion: "lean-child-failure-v7" as const, ...binding, stage: stages[0], category: "host_boundary_observed" as const }
    expect(publishChildTerminalAfterOptionalReceipt(receipt, () => { throw new Error("write failed") }, uncertain => uncertain)).toBe(true)
    expect(() => publishChildTerminalAfterOptionalReceipt(receipt, () => {}, () => { throw new Error("mandatory terminal failed") })).toThrow("mandatory terminal failed")
  })
  it.each(stages)("classifies the trusted %s catch without reading the thrown object", async stage => {
    const hostile = new Proxy({}, { get() { throw new Error("private getter") } })
    expect(readLeanTrustedHostFailureStageV7(hostile)).toBe("unknown")
    const error = captureLeanHostFailureV7(stage, binding)
    const messages: unknown[] = []
    const child = { connected: true, exitCode: null as number | null, disconnect() { this.connected = false }, send(value: unknown, callback?: (error: Error | null) => void) { messages.push(value); callback?.(null); return true } }
    await resolveLeanChildCliTerminal(Promise.reject(error), child, binding)
    expect(child.exitCode).toBe(1)
    expect(messages).toHaveLength(1)
    expect(isLeanChildFailureReceiptV7(messages[0], binding)).toBe(true)
    expect(isLeanChildFailureReceipt(messages[0])).toBe(false)
    expect(messages[0]).toMatchObject({ stage, category: "host_boundary_observed", ...binding })
    expect(JSON.stringify(messages)).not.toMatch(/private getter|stack|message|source|memory|objective/)
  })
  it("refuses Strategy-controlled brands, cross-charge joins and arbitrary fields", async () => {
    const forged = { stage: stages[0], name: "LeanTrustedHostFailureV7", code: "LEAN_PILOT_FACTORY", stack: "secret" }
    expect(readLeanTrustedHostFailureStageV7(forged)).toBe("unknown")
    const messages: unknown[] = []
    await resolveLeanChildCliTerminal(Promise.reject(forged), { connected: true, disconnect() {}, send(v, cb) { messages.push(v); cb?.(null); return true } }, binding)
    expect(messages[0]).toMatchObject({ stage: "unknown", category: "stage_not_observed" })
    expect(isLeanChildFailureReceiptV7(messages[0], { ...binding, slotRoot: `sha256:${"b".repeat(64)}` })).toBe(false)
    expect(isLeanChildFailureReceiptV7({ ...(messages[0] as object), stack: "secret" }, binding)).toBe(false)
  })
})
