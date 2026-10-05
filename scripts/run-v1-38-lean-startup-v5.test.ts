import { afterEach, describe, expect, it, vi } from "vitest"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import { parseLeanCorrectionCommand, assertLeanCorrectionResources } from "./run-v1-38-lean-correction.js"
import { assessLeanPrefixCapacity } from "./run-v1-38-lean-experiment.js"
import * as session from "./lib/v1-38-lean-container-match-session.js"
import { superviseLeanStartupV5 as checkedStartupSupervisorV5 } from "./lib/v1-38-lean-startup-supervisor.mjs"
import { mkdtempSync, writeFileSync, readFileSync, rmSync, realpathSync, mkdirSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { defaultRuntimeMetadata, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { MATCH_KERNEL, createInitialGameState, createStrategyInputV119 } from "../packages/engine/src/index.js"
import { buildStrategyRevision } from "../packages/runtime-js/src/revision.js"
import { LAB_ADMITTED_ROOTS } from "../packages/strategy-lab/src/contracts.js"
import { buildPlannerCandidate } from "../packages/strategy-lab/src/planner/emit.js"
import { admitFactory, authorizeFactorySupervision } from "../packages/strategy-lab/src/factory/admission.js"
import * as sources from "./lib/v1-38-lean-baseline-source.js"
import * as authority from "./lib/v1-38-lean-experiment-authority.js"
import * as reuseIO from "./lib/v1-38-lean-baseline-reuse.js"
import type { LeanColdReuse } from "./lib/v1-38-lean-baseline-reuse.js"
import { prospectiveLeagueRuntimeBinding } from "./lib/v1-38-league-prospective-lifetime.js"
import { createFactorySupervisedRuntime } from "./lib/v1-38-factory-supervised-runtime.js"
import { createPlannerSupervisedRuntime } from "./lib/v1-38-planner-supervised-runtime.js"
import * as retained from "./lib/v1-38-lean-correction-retained.js"
import { leanCorrectionSourceManifest, leanStartupCarryElapsedV5, validateLeanStartupSetupWitnessV5, LEAN_STARTUP_CARRY_V5 } from "./run-v1-38-lean-correction.js"
import ts from "typescript"
import { EventEmitter } from "node:events"
import * as correctionIO from "./run-v1-38-lean-correction.js"
import { runLeanBoundedParent, deriveLeanBaselineCandidateRoots } from "./run-v1-38-lean-baseline.js"

const native = vi.hoisted(() => ({
  deny: () => { throw new Error("NO_NATIVE_STARTUP_V5_FIXTURE") },
  worker: undefined as undefined | ((source: string, options: unknown) => unknown),
  control: undefined as undefined | ((command: string, args: readonly string[]) => unknown),
  exec: undefined as undefined | ((command: string, args: readonly string[]) => unknown),
  fork: undefined as undefined | (() => unknown),
  space: undefined as undefined | (() => unknown),
  root: undefined as string | undefined,
}))
vi.mock("node:worker_threads", async original => ({ ...await original<typeof import("node:worker_threads")>(), Worker: function(source: string, options: unknown) { return native.worker ? native.worker(source, options) : native.deny() } }))
vi.mock("node:child_process", async original => ({ ...await original<typeof import("node:child_process")>(), fork: () => native.fork ? native.fork() : native.deny(), spawn: native.deny, spawnSync: (command: string, args: readonly string[]) => native.control ? native.control(command, args) : native.deny(), execFile: native.deny, execFileSync: (command: string, args: readonly string[]) => native.exec ? native.exec(command, args) : native.deny(), exec: native.deny, execSync: native.deny }))
vi.mock("node:fs", async original => {
  const fs = await original<typeof import("node:fs")>()
  return { ...fs, readFileSync: (path: any, ...args: any[]) => (fs.readFileSync as any)(native.root && typeof path === "string" && !path.startsWith("/") ? native.root + "/" + path : path, ...args), statfsSync: () => native.space ? native.space() : native.deny() }
})
const r = (name: string) => labRoot("startup-v5-test", name)
const predecessor = (elapsedUpperBoundMs = 28_800_001, chargedMatches = 23) => {
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches, elapsedUpperBoundMs, allocatedDiskBytes: 9_617_408, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r("history"), survivors: [{ identity: ".strategy-lab/synthetic-history", allocatedBytes: 4096 }] }
  return { ...body, root: labRoot(body.schemaVersion, body) }
}
const input = () => ({ sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: lean.LEAN_STARTUP_SUPPLEMENT_ROOT, candidateRoots: [r("a"), r("b")], requestRoots: [r("request")], seed: "synthetic-v5", route: "diagnostic" as const, reuseGrantRoot: r("reuse"), supervisorDecisionRoot: lean.LEAN_STARTUP_APPROVAL_ROOT, acceptedCheckRoot: null, requestBytesRoot: r("bytes"), dataReviewRoot: r("data"), setupAccountingRoot: r("setup"), predecessor: predecessor(), startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root })
const dirs: string[] = []
afterEach(() => { native.worker = undefined; native.control = undefined; native.exec = undefined; native.fork = undefined; native.space = undefined; native.root = undefined; vi.restoreAllMocks(); for (const directory of dirs.splice(0)) rmSync(directory, { recursive: true, force: true }) })
describe("contracts", () => {
  it("selects twelve hours only for strictly admitted prospective v5", () => {
    expect(lean.LEAN_CAPS.elapsedMs).toBe(28_800_000)
    const a = lean.createLeanSupervisorCorrectionAllocation(input(), 5)
    expect(lean.leanCapsForAllocation(a).elapsedMs).toBe(43_200_000)
    expect(lean.admitLeanAllocation(a).root).toBe(a.root)
    expect(() => lean.leanCapsForAllocation({ ...a, caps: lean.LEAN_CAPS })).toThrow()
    expect(() => lean.leanCapsForAllocation({ ...a, schemaVersion: "unknown" })).toThrow()
    expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...input(), supervisorDecisionRoot: r("foreign") }, 5)).toThrow()
    expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...input(), predecessor: predecessor(43_200_000) }, 5)).toThrow()
    expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...input(), predecessor: predecessor(28_800_001, 22) }, 5)).toThrow()
  })
  it("keeps v5 paths and CLI explicit and separate from consumed versions", () => {
    const p = lean.leanCorrectionRoutePaths("diagnostic", "v5")
    expect(p.store).toContain("-v5")
    expect(p.store).not.toBe(lean.leanCorrectionRoutePaths("diagnostic", "v4").store)
    expect(parseLeanCorrectionCommand(["run-supervisor-diagnostic-v5", "--request", p.request]).supervisor).toBe("v5")
    expect(() => parseLeanCorrectionCommand(["run-supervisor-diagnostic-v5", "--request", lean.leanCorrectionRoutePaths("diagnostic", "v4").request])).toThrow()
  })
  it("actual resource predicates use admitted caps without widening old defaults", () => {
    const a = lean.createLeanSupervisorCorrectionAllocation(input(), 5)
    const m = { childRss: 1000, parentRss: 1000, freeBytes: 20_000_000_000, allocatedBytes: 1000, elapsedMs: 28_800_001 }
    expect(() => assessLeanPrefixCapacity(m)).toThrow()
    expect(assessLeanPrefixCapacity(m, undefined, a)).toBe(2000)
    const c = { elapsedMs: m.elapsedMs, charged: 23, physicalBytes: 1000, childRss: 1000, parentRss: 1000, freeBytes: m.freeBytes, availableMemoryBytes: 2_000_000_000 }
    expect(() => assertLeanCorrectionResources(c)).toThrow()
    expect(assertLeanCorrectionResources(c, a)).toBeGreaterThan(0)
    expect(() => assessLeanPrefixCapacity({ ...m, elapsedMs: 43_200_000 }, undefined, a)).toThrow()
  })
})
describe("runtime", () => {
  it("denies native execution by default", () => expect(native.deny).toThrow("NO_NATIVE"))
  it("gates original hostile evaluation behind trusted READY and GO", () => {
    const source = session.buildLeanStartupWorkerHarnessV5()
    expect(source.indexOf("trustedPublishReadyV5()")).toBeLessThan(source.indexOf("const runStrategy ="))
    expect(source.indexOf("trustedWaitGoV5()")).toBeLessThan(source.indexOf("const runStrategy ="))
    expect(session.buildLeanContainerBrokerSourceV5()).toContain("superviseLeanStartupV5")
  })
})
const bindingV5 = (): session.LeanStartupBindingV5 => ({ allocationRoot: r("allocation"), chargeRoot: r("charge"), seat: "bottom", policyRoot: lean.LEAN_STARTUP_POLICY_V5.root, harnessRoot: lean.leanBytesRoot(Buffer.from(session.buildLeanStartupWorkerHarnessV5())), requestOrdinal: 1, requestRoot: r("request"), method: "soldierBrain", inputRoot: r("input"), sourceRoot: r("source"), executableRoot: r("executable") })
const fakeHost = (startupMs: number, guestMs: number, receiptMs = 0, terminateFails = false) => {
  let now = 0, state = 0, wakes = 0, executed = false
  const waits: number[] = [], cancellations: number[] = []
  const host: session.LeanStartupSupervisorHostV5 = {
    now: () => now, construct() {}, load: () => state,
    compareExchange(before, after) { const previous = state; if (state === before) state = after; return previous },
    notify() { executed = true },
    wait(expected, ms) {
      waits.push(ms)
      if (wakes++ === 0 && expected === 0) { now += Math.min(ms, 1); return "ok" } // spurious wake
      const duration = expected === 0 ? Math.max(0, startupMs - now) : guestMs
      if (duration >= ms) { now += ms; return "timed-out" }
      now += duration; state = expected === 0 ? 1 : 3; return "ok"
    },
    async reconcile() { now += receiptMs; return { ok: true, value: "synthetic" } },
    async terminate(ms) { cancellations.push(ms); if (terminateFails) throw new Error("SYNTHETIC_TERMINATE"); now += 1 },
    close() {},
  }
  return { host, waits, cancellations, executed: () => executed, now: () => now, state: (n: number) => { state = n } }
}
describe("runtime control", () => {
  it("statically shares exact checked JavaScript without host dynamic compilation", () => {
    expect(session.superviseLeanStartupV5).toBe(checkedStartupSupervisorV5)
    const checked = readFileSync("scripts/lib/v1-38-lean-startup-supervisor.mjs", "utf8")
    expect(session.buildLeanContainerBrokerSourceV5()).toContain(checked)
    const host = ts.createSourceFile("host.ts", readFileSync("scripts/lib/v1-38-lean-container-match-session.ts", "utf8"), ts.ScriptTarget.Latest, true)
    const dynamic: string[] = []
    const visit = (node: ts.Node) => {
      if ((ts.isCallExpression(node) || ts.isNewExpression(node)) && ts.isIdentifier(node.expression) && ["Function", "eval"].includes(node.expression.text)) dynamic.push(node.expression.text)
      ts.forEachChild(node, visit)
    }
    visit(host); expect(dynamic).toEqual([])
    const manifest = leanCorrectionSourceManifest("v5")
    for (const path of ["scripts/lib/v1-38-lean-startup-supervisor.mjs", "scripts/lib/v1-38-lean-startup-supervisor.d.mts"]) expect(manifest.entries.find(entry => entry.path === path)?.root).toBe(lean.leanBytesRoot(readFileSync(path)))
  })
  it("constructs closure-free broker bytes under the actual inert tsx loader", async () => {
    // This one known trusted Node import builds strings only: no broker, guest,
    // Worker, transport, provider or CLI entry is evaluated in the subprocess.
    const trusted = await vi.importActual<typeof import("node:child_process")>("node:child_process")
    const script = 'const m=await import("./scripts/lib/v1-38-lean-container-match-session.ts");const s=m.buildLeanContainerBrokerSourceV5();console.log(JSON.stringify({helper:s.includes("__name("),source:s}));'
    const built = JSON.parse(trusted.execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script], { encoding: "utf8", maxBuffer: 262144 }))
    expect(built.helper).toBe(false)
    expect(built.source).toContain("superviseLeanStartupV5")
  })
  it.each([[2499, 999, true, "complete"], [2500, 0, false, "startup_expired"], [0, 1000, false, "guest_expired"], [0, 999, true, "complete"]])("bounds startup %ims and guest %ims without resetting host time", async (start, guest, ok, branch) => {
    const f = fakeHost(Number(start), Number(guest)), b = bindingV5()
    const result = await session.superviseLeanStartupV5(b, 5000, f.host)
    expect(result.ok).toBe(ok); expect(result.origin.branch).toBe(branch)
    expect(session.validateLeanStartupOriginV5(result.origin, b)).toEqual(result.origin)
    expect(f.waits.every(ms => ms > 0 && ms <= 2500)).toBe(true)
    expect(f.cancellations.every(ms => ms > 0 && ms <= 100)).toBe(true)
    expect(f.now()).toBeLessThanOrEqual(5000)
  })
  it("refuses GO when host residual cannot cover guest, cancellation and receipt", async () => {
    const f = fakeHost(2000, 0)
    const result = await session.superviseLeanStartupV5(bindingV5(), 4000, f.host)
    expect(result.origin.branch).toBe("go_refused"); expect(f.executed()).toBe(false)
  })
  it.each([4999, 5000])("admits only a completed receipt strictly before host %ims", async end => {
    const f = fakeHost(0, 1, end - 2)
    const result = await session.superviseLeanStartupV5(bindingV5(), 5000, f.host)
    expect(result.ok).toBe(end === 4999)
  })
  it("keeps failed termination unknown and rejects forged/cross-request provenance", async () => {
    const b = bindingV5(), f = fakeHost(2500, 0, 0, true)
    const result = await session.superviseLeanStartupV5(b, 5000, f.host)
    expect(result.origin.termination).toBe("failed"); expect(result.origin.unknown).toBe(true)
    expect(() => session.validateLeanStartupOriginV5({ ...result.origin, requestOrdinal: 2 }, b)).toThrow()
    expect(() => session.validateLeanStartupOriginV5({ ...result.origin, source: "PRIVATE_CANARY" }, b)).toThrow()
    expect(() => session.validateLeanStartupOriginV5({ ...result.origin, go: true, ready: false }, b)).toThrow()
  })
  it("rejects early exit, invalid READY/DONE and absent receipt", async () => {
    for (const state of [-1, 2, 3, 4]) {
      const f = fakeHost(0, 1); f.host.construct = () => f.state(state)
      const result = await session.superviseLeanStartupV5(bindingV5(), 5000, f.host)
      expect(result.ok).toBe(false); expect(result.origin.branch).toBe("inconsistent_state"); expect(f.executed()).toBe(false)
    }
    const f = fakeHost(0, 1); f.host.reconcile = async () => { throw new Error("NO_RECEIPT") }
    expect((await session.superviseLeanStartupV5(bindingV5(), 5000, f.host)).origin.branch).toBe("lifecycle_failure")
  })
  it("builds syntactically valid distinct inert broker and harness bytes", () => {
    for (const text of [session.buildLeanStartupWorkerHarnessV5(), session.buildLeanContainerBrokerSourceV5()]) {
      const parsed = ts.createSourceFile("inert.mjs", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
      expect((parsed as unknown as { parseDiagnostics: unknown[] }).parseDiagnostics).toEqual([])
      expect(text).not.toContain("__name(")
    }
  })
})
let fixtureIndex = 0
const verticalFixture = (route: "diagnostic" | "baseline" = "diagnostic") => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-startup-v5-"))); dirs.push(directory)
  const p = input(), prior = predecessor(28_800_001, route === "baseline" ? 24 : 23)
  const a = lean.createLeanSupervisorCorrectionAllocation({ ...p, requestRoots: route === "baseline" ? Array.from({ length: 36 }, (_, n) => r("baseline-" + n)) : p.requestRoots, route, seed: "synthetic-" + fixtureIndex++, predecessor: prior, acceptedCheckRoot: route === "baseline" ? r("accepted") : null }, 5)
  const ledger = { directory, allocation: a }
  for (const [name, bytes] of [["allocation.json", lean.leanCanonicalBytes(a)], ["ledger.ndjson", Buffer.alloc(0)], ["time.ndjson", Buffer.alloc(0)]] as const) writeFileSync(join(directory, name), bytes, { mode: 0o600, flag: "wx" })
  const source = sources.buildLeanBaselineSource({ coldRoot: a.coldRoot!, implementationRoot: a.sourceRoot, role: "final-response", source: buildPlannerCandidate().source })
  const reuse = { grant: { root: a.reuseGrantRoot, coldRoot: a.coldRoot, seed: a.seed }, sources: [source] } as unknown as LeanColdReuse
  vi.spyOn(reuseIO, "validateLeanColdReuse").mockImplementation((value, root) => { if (value !== reuse || root !== a.sourceRoot) throw new Error("SYNTHETIC_REUSE_JOIN"); return reuse })
  // Only the OS resource sample is synthetic. Publisher schema/bytes and issuer custody remain real.
  const capacity = vi.spyOn(lean, "assertLeanPublicationCapacity").mockImplementation(() => {})
  return { a, ledger, source, reuse, capacity }
}
const issueFixture = (f: ReturnType<typeof verticalFixture>, seat: "bottom" | "top" = "bottom") => {
  const slot = f.a.slots[0]!
  const body = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: f.a.root, slotRoot: slot.root, ordinal: 0 }
  const charge = { ...body, root: labRoot(body.schemaVersion, body) }
  const pairBody = { schemaVersion: "lean-baseline-pair-v1" as const, ordinal: 0, slotRoot: slot.root, requestRoot: slot.requestRoot, priorLedgerBytesRoot: lean.leanBytesRoot(Buffer.alloc(0)), priorLedgerByteLength: 0, priorCharged: f.a.predecessor.chargedMatches, bottomRole: f.source.role, bottomSourceRoot: f.source.sourceRoot, bottomSnapshotRoot: f.source.root, topRole: f.source.role, topSourceRoot: f.source.sourceRoot, topSnapshotRoot: f.source.root }
  writeFileSync(join(f.ledger.directory, "pair-0.json"), lean.leanCanonicalBytes({ ...pairBody, root: labRoot(pairBody.schemaVersion, pairBody) }), { mode: 0o600 })
  writeFileSync(join(f.ledger.directory, "ledger.ndjson"), Buffer.concat([lean.leanCanonicalBytes({ kind: "charge", charge }), Buffer.from("\n")]))
  const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: f.source.packet, proposal: f.source.proposal, sourceBytes: Buffer.from(f.source.source) }), validation: f.source.validation })
  const defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: f.source.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  const runtime = prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot: f.source.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image })
  const binding = { budgetRoot: f.a.root, attemptRoot: charge.root, matchId: `lean-${charge.root.slice(7, 31)}`, containerName: `lean-${charge.root.slice(7, 25)}-${seat}`, ownershipLabel: `lean-${f.a.root.slice(7, 25)}`, seat, runtime }
  return { charge, admission, revision, binding, token: authority.issueLeanCorrectionRuntimeAuthority(f.ledger, charge, f.source, binding, f.reuse) }
}
const acceptedSnapshot = (exactRequest?: correctionIO.LeanCorrectionRequest, admitted?: ReturnType<typeof lean.createLeanSupervisorCorrectionAllocation>) => {
    const f = verticalFixture(), base = admitted ?? f.a
    const bottom = sources.buildLeanBaselineSource({ coldRoot: base.coldRoot!, implementationRoot: base.sourceRoot, role: "tactical-0", source: f.source.source })
    const top = sources.buildLeanBaselineSource({ coldRoot: base.coldRoot!, implementationRoot: base.sourceRoot, role: "cold-opponent", source: f.source.source })
    const request = exactRequest ?? { schemaVersion: "lean-correction-supervisor-request-v5", route: "diagnostic", sourceRoot: base.sourceRoot, planRoot: base.planRoot, coldRoot: base.coldRoot, seed: base.seed, candidateRoots: base.candidateRoots, requestRoots: base.requestRoots, diagnosis: null, supervisorDecisionRoot: base.supervisorDecisionRoot, acceptedCheckRoot: null, setupAccountingRoot: base.setupAccountingRoot, dataReviewRoot: base.dataReviewRoot, reuseGrantRoot: base.reuseGrantRoot, startupPolicyRoot: base.startupPolicyRoot, authorizationRoot: r("authorization") }
    const a = admitted ?? lean.createLeanSupervisorCorrectionAllocation({ ...input(), seed: base.seed, requestBytesRoot: lean.leanBytesRoot(lean.leanCanonicalBytes(request)) }, 5), slot = a.slots[0]!
    const chargeBody = { schemaVersion: "lean-slot-charge-v1", allocationRoot: a.root, slotRoot: slot.root, ordinal: 0 }, charge = { ...chargeBody, root: labRoot(chargeBody.schemaVersion, chargeBody) }
    const compact = { classification: "success", code: "OK", outcome: "DRAW", elapsedMs: 5, cleanupComplete: true, invocationCount: 1, accountingRoot: r("accounting"), executionRoot: r("execution"), telemetry: { transitions: 0, events: 0 } }
    const replay = lean.encodeLeanReplay([])
    const events = [{ kind: "charge", charge }, { kind: "terminal", chargeRoot: charge.root, record: compact, replay: replay.container }, { kind: "stop", reason: "complete" }]
    const records = [{ slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: charge.root, terminal: events[1], status: "success" }]
    const evidence = { records, charged: 24, elapsedMs: 28_800_101, physicalHighWaterBytes: 9_617_408, scratchHighWaterBytes: 1, root: labRoot("lean-evidence-v1", { allocationRoot: a.root, events, records }) }
    const pairBody = { schemaVersion: "lean-baseline-pair-v1", ordinal: 0, slotRoot: slot.root, requestRoot: slot.requestRoot, priorLedgerBytesRoot: lean.leanBytesRoot(Buffer.alloc(0)), priorLedgerByteLength: 0, priorCharged: 23, bottomRole: bottom.role, bottomSourceRoot: bottom.sourceRoot, bottomSnapshotRoot: bottom.root, topRole: top.role, topSourceRoot: top.sourceRoot, topSnapshotRoot: top.root }, pair = { ...pairBody, root: labRoot(pairBody.schemaVersion, pairBody) }
    const metricBody = { executionRoot: compact.executionRoot, formationComparison: "inconclusive" }, metrics = { ...metricBody, root: labRoot("lean-baseline-match-metrics-v1", metricBody) }
    const cell = { ordinal: 0, slotRoot: slot.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot, compact, brainInputs: [], strategyInputs: [], trainingHalfPoints: null, semanticRoot: r("semantic"), metrics, decisionRoot: r("decision"), diagnostic: null }
    const obsBody = { schemaVersion: "lean-baseline-observation-v1", pairRoot: pair.root, cell }, observation = { ...obsBody, root: labRoot(obsBody.schemaVersion, obsBody) }
    const head = "a".repeat(40), entry = { schemaVersion: "lean-child-entry-v2", allocationRoot: a.root, sourceRoot: a.sourceRoot, requestBytesRoot: a.requestBytesRoot, head, parentPid: 123, childPid: 124, handshakeRoot: r("handshake"), wallStartMs: 1000, monotonicStartNs: "1000000000" }
    const terminal = { schemaVersion: "lean-child-terminal-v2", entryBytesRoot: lean.leanBytesRoot(lean.leanCanonicalBytes(entry)), allocationRoot: a.root, sourceRoot: a.sourceRoot, head, parentPid: 123, childPid: 124, status: "child_exited", exitCode: 0, signal: null, wallObservedMs: 1050, monotonicObservedNs: "1050000000", elapsedUpperBoundMs: 50, parentRssBytes: 1000, childRssObservedBytes: 1000, physicalBytes: a.predecessor.allocatedDiskBytes, freeBytes: 20000000000 }
    const originBody = { schemaVersion: "lean-startup-origin-envelope-v5", allocationRoot: a.root, sourceRoot: a.sourceRoot, pairRoot: pair.root, chargeRoot: charge.root, origins: [] }, origin = { ...originBody, root: labRoot(originBody.schemaVersion, originBody) }
    const pipeline = { status: "diagnostic_only", cells: [{ ordinal: 0, slotRoot: slot.root, compact }], training: null, holdoutOpened: false, formationMaterialized: false }
    const resultBody = { schemaVersion: "lean-correction-supervisor-result-v5", privacy: "private_offline", issued: false, route: "diagnostic", allocationRoot: a.root, sourceRoot: a.sourceRoot, requestBytesRoot: a.requestBytesRoot, head, reuseGrantRoot: a.reuseGrantRoot, pipeline, evidenceRoot: evidence.root, cumulativeCharged: 24, holdoutOpened: false, formationMaterialized: false, phaseComplete: false }
    const reasonBody = { schemaVersion: "lean-parent-supervisor-reasons-v1", allocationRoot: a.root, sourceRoot: a.sourceRoot, requestBytesRoot: a.requestBytesRoot, entryBytesRoot: terminal.entryBytesRoot, head, parentPid: 123, childPid: 124, exitCode: 0, signal: null, uncertain: false, reasons: [], observations: { entry: "published", childReady: "observed", resourceSampling: "observed", finalIdentity: "matched", failureReceipt: "absent", cleanup: "child_exit_observed", terminalization: "unobserved", initiatingCause: "unknown" } }
    const snapshot = { schemaVersion: "lean-correction-supervisor-retained-snapshot-v5", allocation: a, request, entry, terminal, evidence, time: { active: false, elapsedMs: 28_800_101, closed: new Set(["pilot-entry"]) }, result: { ...resultBody, root: labRoot(resultBody.schemaVersion, resultBody) }, reuse: f.reuse, pairs: [pair], observations: [observation], sources: [bottom, top], artifacts: {}, origin, journalBytes: Buffer.concat(events.flatMap(e => [lean.leanCanonicalBytes(e), Buffer.from("\n")])), supervisorReasonBytes: lean.leanCanonicalBytes({ ...reasonBody, root: labRoot(reasonBody.schemaVersion, reasonBody) }) }
    return { f, a, request, bottom, top, terminal, entry, snapshot, replay, charge }
}
const publishAcceptedSnapshot = (s: ReturnType<typeof acceptedSnapshot>) => {
  const ledger = { ...s.f.ledger, allocation: s.a }
  const put = (name: string, value: unknown) => writeFileSync(join(ledger.directory, name), lean.leanCanonicalBytes(value), { mode: 0o600 })
  for (const [name, value] of Object.entries({ "allocation.json": s.a, "entry.json": s.entry, "child-terminal.json": s.terminal, "result.json": s.snapshot.result, "cold-reuse.json": s.snapshot.reuse, "pair-0.json": s.snapshot.pairs[0], "observation-0.json": s.snapshot.observations[0], "correction-origin.json": s.snapshot.origin, "source-tactical-0.json": s.bottom, "source-cold-opponent.json": s.top })) put(name, value)
  writeFileSync(join(ledger.directory, "ledger.ndjson"), s.snapshot.journalBytes)
  writeFileSync(join(ledger.directory, "parent-supervisor-reasons.json"), s.snapshot.supervisorReasonBytes, { mode: 0o600 })
  writeFileSync(join(ledger.directory, `${s.charge.root.slice(7)}.gz`), s.replay.bytes, { mode: 0o600 })
  return { ledger, put }
}
const closeAcceptedReader = (s: ReturnType<typeof acceptedSnapshot>, wall = 1100) => {
  const { ledger, put } = publishAcceptedSnapshot(s)
  const paths = { ...lean.leanCorrectionRoutePaths("diagnostic", "v5"), store: ledger.directory, temp: join(ledger.directory, "..", "admission-" + fixtureIndex++) }
  mkdirSync(paths.temp, { mode: 0o700 }); dirs.push(paths.temp)
  vi.spyOn(lean, "leanCorrectionRoutePaths").mockReturnValue(paths as ReturnType<typeof lean.leanCorrectionRoutePaths>)
  vi.spyOn(reuseIO, "validateLeanColdReuse").mockImplementation((value, sourceRoot) => {
    if (sourceRoot !== s.a.sourceRoot || labRoot("synthetic-reuse", value) !== labRoot("synthetic-reuse", s.f.reuse)) throw new Error("SYNTHETIC_REUSE_JOIN")
    return s.f.reuse
  })
  let mono = 0n
  vi.spyOn(process.hrtime, "bigint").mockImplementation(() => mono)
  const carrier = correctionIO.beginLeanCorrectionAdmission("diagnostic", "run", paths.temp, { wallStartMs: 1000, monotonicStartNs: "1000000000" }, "v5")
  lean.beginLeanInterval(ledger, "pilot-entry", 1000); lean.closeLeanInterval(ledger, "pilot-entry", 1050)
  // Force rounding at finalization independently from the raw receipt clock.
  vi.mocked(process.hrtime.bigint).mockImplementation(() => mono++)
  const admission = correctionIO.closeLeanCorrectionAdmission(carrier, ledger, { wallStartMs: 1050, monotonicStartNs: "1050000000" })
  expect("ledgerCloseMs" in admission && admission.ledgerCloseMs).toBe(1051)
  vi.mocked(process.hrtime.bigint).mockImplementation(() => mono)
  lean.beginLeanInterval(ledger, "correction-supervisor-diagnostic-v5-verifier", 1100)
  const gap = retained.readLeanFreshSupervisorReaderGap(ledger, "diagnostic", 1100, paths.temp, 5)
  mono += 1n
  retained.closeLeanFreshSupervisorReader(ledger, "diagnostic", gap, () => wall, 5)
  const time = lean.readLeanTimeAccounting(ledger), audited = retained.auditLeanCorrectionRetained({ ...s.snapshot, time })
  const { root: _root, ...body } = audited
  const checked = { ...body, cumulativeElapsedMs: time.elapsedMs, cumulativePhysicalBytes: 9617408, readerScratchHighWaterBytes: 1000, readerInterval: "correction-supervisor-diagnostic-v5-verifier", readerStartMs: 1100, readerObservedMs: 1100 }
  put(paths.check, { ...checked, root: labRoot(checked.schemaVersion, checked) })
  // Real filesystem reopen below; only the old cold-reuse grant is synthetic.
  return { ledger, paths, time, put }
}
describe("closure", () => {
  it("joins v5 terminal publication to its authenticated observation rather than a later clock sample", () => {
    const s = acceptedSnapshot(), { ledger } = publishAcceptedSnapshot(s)
    rmSync(join(ledger.directory, "child-terminal.json"))
    let mono = 1000000000n
    vi.spyOn(process.hrtime, "bigint").mockImplementation(() => mono)
    lean.beginLeanInterval(ledger, "pilot-entry", 1000)
    const { schemaVersion: _schema, entryBytesRoot: _bytes, allocationRoot: _allocation, sourceRoot: _source, head: _head, parentPid: _parent, childPid: _child, elapsedUpperBoundMs: _elapsed, ...observed } = s.terminal
    const terminal = lean.deriveLeanChildTerminal(ledger, lean.readLeanChildEntry(ledger), { ...observed, status: "child_exited", wallObservedMs: 1000, monotonicObservedNs: "1000000001" })
    mono += 2000000n
    lean.publishLeanChildTerminal(ledger, terminal)
    expect(lean.readLeanChildTerminal(ledger).elapsedUpperBoundMs).toBe(1)
    expect(lean.readLeanTimeAccounting(ledger).closes.get("pilot-entry")).toBe(1001)
  })
  it("reads exact filesystem authorization then authenticates one complete diagnostic and rejects individual mutations", () => {
    const workspace = process.cwd(), root = realpathSync(mkdtempSync(join(tmpdir(), "lean-v5-request-"))); dirs.push(root)
    const phase = ".planning/phases/265-serious-current-rules-league-and-development-red-team"
    mkdirSync(join(root, phase), { recursive: true, mode: 0o700 }); mkdirSync(join(root, ".strategy-lab"), { mode: 0o700 })
    for (const path of [correctionIO.LEAN_STARTUP_V5_DECISION, correctionIO.LEAN_STARTUP_V5_PLAN, phase + "/265-16-CONTINUATION-DECISION-v1.md"]) writeFileSync(join(root, path), readFileSync(path), { mode: 0o600 })
    for (const path of ["packages", "scripts", "apps", "node_modules"]) symlinkSync(join(workspace, path), join(root, path))
    for (const path of ["tsconfig.base.json", "package.json", "pnpm-lock.yaml"]) symlinkSync(join(workspace, path), join(root, path))
    native.root = root
    vi.spyOn(process, "cwd").mockReturnValue(root)
    const sourceRoot = correctionIO.leanCorrectionSourceManifest("v5").root
    const history = reuseIO.LEAN_COLD_REUSE_HISTORY
    const put = (path: string, value: unknown) => writeFileSync(join(root, path), lean.leanCanonicalBytes(value), { mode: 0o600 })
    const witnessBody = { schemaVersion: "lean-startup-setup-witness-v5", approvalRoot: lean.LEAN_STARTUP_APPROVAL_ROOT, supplementRoot: lean.LEAN_STARTUP_SUPPLEMENT_ROOT, policyRoot: lean.LEAN_STARTUP_POLICY_V5.root, priorElapsedMs: 26634447, charged: 23, segments: [{ startMs: LEAN_STARTUP_CARRY_V5.startedAtMs, closeMs: null }], consumedTimeBytesRoot: r("synthetic-consumed-time") }
    const witness = { ...witnessBody, root: labRoot(witnessBody.schemaVersion, witnessBody) }; put(lean.LEAN_STARTUP_V5_SETUP_PATH, witness)
    const reviewPath = phase + "/synthetic-source-review.md", dataReviewPath = phase + "/synthetic-data-review.md"
    const reviewBytes = (dataRoot?: string) => Buffer.from(`---\nstatus: clean\nsource_root: ${sourceRoot}\nsource_commit: ${"a".repeat(40)}\nindependently_reviewed: true\nauthor_agent: /root/source\nreviewer_agent: /root/reviewer\n${dataRoot ? "request_root: " + dataRoot + "\n" : ""}---\n`)
    const sourceReview = reviewBytes(); writeFileSync(join(root, reviewPath), sourceReview, { mode: 0o600 })
    const request: correctionIO.LeanCorrectionRequest = { schemaVersion: "lean-correction-supervisor-request-v5", route: "diagnostic", sourceRoot, planRoot: lean.LEAN_STARTUP_SUPPLEMENT_ROOT, amendmentRoot: history.amendmentRoot, reviewPath, reviewRoot: lean.leanBytesRoot(sourceReview), dataReviewPath, dataReviewRoot: r("pending"), coldRoot: history.coldRoot, seed: history.seed, reuseGrantRoot: r("reuse"), candidateRoots: deriveLeanBaselineCandidateRoots(history.coldRoot), requestRoots: correctionIO.deriveLeanSupervisorCorrectionRequestRoots({ route: "diagnostic", seed: history.seed, coldRoot: history.coldRoot, planRoot: lean.LEAN_STARTUP_SUPPLEMENT_ROOT, sourceRoot }, lean.LEAN_STARTUP_APPROVAL_ROOT, "v5"), diagnosis: null, supervisorDecisionRoot: lean.LEAN_STARTUP_APPROVAL_ROOT, acceptedCheckRoot: null, setupAccountingPath: lean.LEAN_STARTUP_V5_SETUP_PATH, setupAccountingRoot: witness.root, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, authorizationPath: ".strategy-lab/lean-startup-v5-synthetic-authorization.json", authorizationRoot: r("pending") }
    const dataRoot = correctionIO.leanCorrectionRequestDataRoot(request), dataReview = reviewBytes(dataRoot)
    writeFileSync(join(root, dataReviewPath), dataReview, { mode: 0o600 }); request.dataReviewRoot = lean.leanBytesRoot(dataReview)
    const authBody = { schemaVersion: "lean-startup-execution-authorization-v5", approved: true, executionAuthorized: true, route: "diagnostic", sourceRoot, approvalRoot: lean.LEAN_STARTUP_APPROVAL_ROOT, supplementRoot: lean.LEAN_STARTUP_SUPPLEMENT_ROOT, policyRoot: lean.LEAN_STARTUP_POLICY_V5.root, requestDataRoot: dataRoot }
    const authorization = { ...authBody, root: labRoot(authBody.schemaVersion, authBody) }; request.authorizationRoot = lean.leanBytesRoot(lean.leanCanonicalBytes(authorization)); put(request.authorizationPath!, authorization)
    const allocation = lean.createLeanSupervisorCorrectionAllocation({ ...input(), sourceRoot, coldRoot: history.coldRoot, seed: history.seed, candidateRoots: request.candidateRoots, requestRoots: request.requestRoots, reviewRoot: request.reviewRoot, dataReviewRoot: request.dataReviewRoot, setupAccountingRoot: witness.root, requestBytesRoot: lean.leanBytesRoot(lean.leanCanonicalBytes(request)) }, 5)
    const s = acceptedSnapshot(request, allocation), paths = lean.leanCorrectionRoutePaths("diagnostic", "v5")
    put(paths.request, request)
    vi.spyOn(reuseIO, "authenticateLeanColdReuse").mockImplementation(({ newSourceRoot }) => { if (newSourceRoot !== sourceRoot) return native.deny(); return s.f.reuse })
    native.exec = (command, args) => command === "git" && args[0] === "diff" && args[1] === "--exit-code" && args[2] === "a".repeat(40) ? Buffer.alloc(0) : native.deny()
    expect(correctionIO.readLeanCorrectionRequest(paths.request, "diagnostic", "v5").request).toEqual(request)
    const closed = closeAcceptedReader(s)
    expect(retained.authenticateLeanSupervisorDiagnosticCheck("v5").closedElapsedMs).toBe(closed.time.elapsedMs)
    for (const patch of [{ authorizationRoot: r("foreign") }, { sourceRoot: r("foreign") }, { startupPolicyRoot: r("foreign") }, { reviewRoot: r("foreign") }]) {
      put(paths.request, { ...request, ...patch }); expect(() => retained.authenticateLeanSupervisorDiagnosticCheck("v5")).toThrow(); put(paths.request, request)
    }
    put(request.authorizationPath!, { ...authorization, requestDataRoot: r("foreign") }); expect(() => correctionIO.readLeanCorrectionRequest(paths.request, "diagnostic", "v5")).toThrow(); put(request.authorizationPath!, authorization)
    for (const [name, good, bad] of [["allocation.json", allocation, { ...allocation, caps: lean.LEAN_CAPS }], ["entry.json", s.entry, { ...s.entry, head: "b".repeat(40) }], ["child-terminal.json", s.terminal, { ...s.terminal, allocationRoot: r("foreign") }]] as const) { closed.put(name, bad); expect(() => retained.authenticateLeanSupervisorDiagnosticCheck("v5")).toThrow(); closed.put(name, good) }
    const journal = readFileSync(join(closed.ledger.directory, "ledger.ndjson")), time = readFileSync(join(closed.ledger.directory, "time.ndjson"))
    writeFileSync(join(closed.ledger.directory, "ledger.ndjson"), journal.toString().replace('"ordinal":0', '"ordinal":1')); expect(() => retained.authenticateLeanSupervisorDiagnosticCheck("v5")).toThrow(); writeFileSync(join(closed.ledger.directory, "ledger.ndjson"), journal)
    const timeEvents = time.toString().trimEnd().split("\n").map(line => JSON.parse(line) as { kind: string; id: string; atMs: number })
    const close = timeEvents.find(event => event.kind === "close" && event.id === "correction-supervisor-diagnostic-v5-verifier")!
    expect(close.atMs).toBe(1101); close.atMs = 1100
    writeFileSync(join(closed.ledger.directory, "time.ndjson"), Buffer.concat(timeEvents.flatMap(event => [lean.leanCanonicalBytes(event), Buffer.from("\n")]))); expect(() => retained.authenticateLeanSupervisorDiagnosticCheck("v5")).toThrow("ACCEPTED_READER_CLOSURE"); writeFileSync(join(closed.ledger.directory, "time.ndjson"), time)
    expect(retained.authenticateLeanSupervisorDiagnosticCheck("v5").readerCloseMs).toBe(1101)
  }, 20000)
  it.each([1100, 1099])("authenticates the complete rounded diagnostic once with wall %i", wall => {
    const s = acceptedSnapshot(), closed = closeAcceptedReader(s, wall)
    vi.spyOn(correctionIO, "readLeanCorrectionRequest").mockReturnValue({ request: s.request as correctionIO.LeanCorrectionRequest, reuse: s.f.reuse })
    expect(retained.authenticateLeanSupervisorDiagnosticCheck("v5").closedElapsedMs).toBe(closed.time.elapsedMs)
    expect(closed.time.starts.get("correction-supervisor-diagnostic-v5-reader-close")).toBe(closed.time.closes.get("correction-supervisor-diagnostic-v5-verifier"))
  }, 20000)
  it.each([[1000, 1n, 1001], [1001, 2000000n, 1002], [999, 2000000n, 1002]])("joins effective reader close for wall %i and monotonic %s", (wall, ns, expected) => {
    const f = verticalFixture()
    let mono = 0n
    vi.spyOn(process.hrtime, "bigint").mockImplementation(() => mono)
    lean.beginLeanInterval(f.ledger, "correction-supervisor-diagnostic-v5-verifier", 1000)
    mono = ns
    retained.closeLeanFreshSupervisorReader(f.ledger, "diagnostic", null, () => wall, 5)
    const time = lean.readLeanTimeAccounting(f.ledger)
    expect(time.closes.get("correction-supervisor-diagnostic-v5-verifier")).toBe(expected)
    expect(time.starts.get("correction-supervisor-diagnostic-v5-reader-close")).toBe(expected)
    expect(time.active).toBe(false)
    expect(time.closedElapsedMs).toBe(f.a.predecessor.elapsedUpperBoundMs + expected - 1000)
  })
  it("reaches actual bounded parent timer with admitted twelve-hour residual and mocked child", async () => {
    const f = verticalFixture(), requestPath = join(f.ledger.directory, "synthetic-request.json")
    writeFileSync(requestPath, lean.leanCanonicalBytes({ sourceRoot: f.a.sourceRoot }), { mode: 0o600 })
    vi.spyOn(lean, "cumulativeLeanPhysicalBytes").mockReturnValue(9_617_408)
    native.space = () => ({ bavail: 20_000_000_000n, bsize: 1n })
    native.exec = (command, args) => {
      if (command === "git" && args[0] === "show") return Buffer.from(lean.leanCanonicalBytes(f.a))
      if (command === "git" && args[0] === "rev-parse") return "a".repeat(40) + "\n"
      if (command === "ps" && args[0] === "-o") return "1\n"
      return native.deny()
    }
    const child = Object.assign(new EventEmitter(), { pid: process.pid + 100000, exitCode: null as number | null, signalCode: null, send() { queueMicrotask(() => { child.exitCode = 0; child.emit("exit", 0, null) }) }, kill() { queueMicrotask(() => { child.exitCode = 1; child.emit("exit", 1, "SIGKILL") }); return true } })
    native.fork = () => { queueMicrotask(() => child.emit("message", { ready: child.pid })); return child }
    const timer = vi.spyOn(globalThis, "setTimeout"), release = vi.fn()
    await runLeanBoundedParent({ ledger: f.ledger, requestPath, allocationPath: join(f.ledger.directory, "allocation.json"), store: f.ledger.directory, sourceRoot: f.a.sourceRoot, manifestRoot: () => f.a.sourceRoot, childMode: "synthetic", beforeRelease: release, terminalReserveMs: 1000 })
    expect(release).toHaveBeenCalledTimes(2)
    const deadlines = timer.mock.calls.map(row => Number(row[1])).filter(ms => ms > 1_000_000)
    expect(deadlines).toHaveLength(1); expect(deadlines[0]).toBeGreaterThan(14_000_000); expect(deadlines[0]).toBeLessThanOrEqual(43_200_000 - f.a.predecessor.elapsedUpperBoundMs - 1000)
    expect(lean.readLeanTimeAccounting(f.ledger).active).toBe(false)
  })
  it("reaches actual retained reader refusal and closes spent accounting without acceptance", () => {
    const f = verticalFixture()
    vi.spyOn(lean, "openLeanLedger").mockReturnValue(f.ledger)
    vi.spyOn(process, "uptime").mockReturnValue(0)
    vi.spyOn(lean, "readLeanChildTerminal").mockImplementation(() => { throw new TypeError("SYNTHETIC_TERMINAL_REFUSAL") })
    // Missing producer gap custody is a finite refusal; the actual finally path closes its identity.
    expect(() => retained.verifyLeanCorrectionRetained(lean.leanCorrectionRoutePaths("diagnostic", "v5").request, "diagnostic", "v5")).toThrow("READER_GAP_CUSTODY")
    const time = lean.readLeanTimeAccounting(f.ledger)
    expect(time.active).toBe(false); expect(time.closed.has("correction-supervisor-diagnostic-v5-verifier")).toBe(true)
    expect(time.closed.has("correction-supervisor-diagnostic-v5-reader-close")).toBe(true)
    expect(() => retained.authenticateLeanSupervisorDiagnosticCheck("v5")).toThrow()
    expect(lean.readLeanLedger(f.ledger).charged).toBe(23)
  })
  it("fully audits an exact synthetic v5 diagnostic above eight hours and rejects changed custody/caps", () => {
    const { snapshot, a, request, terminal } = acceptedSnapshot()
    const { evidence, origin } = snapshot
    const report = retained.auditLeanCorrectionRetained(snapshot)
    expect(report.cumulativeCharged).toBe(24); expect(report.startupPolicyRoot).toBe(lean.LEAN_STARTUP_POLICY_V5.root)
    expect(report.accepted).toBe(true); expect(report.complete).toBe(false)
    expect(report.publicAuthorized).toBe(false); expect(report.phaseComplete).toBe(false)
    for (const patch of [{ request: { ...request, startupPolicyRoot: r("foreign") } }, { allocation: { ...a, caps: lean.LEAN_CAPS } }, { terminal: { ...terminal, head: "b".repeat(40) } }, { time: { ...snapshot.time, elapsedMs: 43_200_001 } }, { evidence: { ...evidence, charged: 23 } }, { origin: { ...origin, source: "PRIVATE_CANARY" } }]) expect(() => retained.auditLeanCorrectionRetained({ ...snapshot, ...patch })).toThrow()
    expect(JSON.stringify(report)).not.toContain("PRIVATE_CANARY")
  }, 20000)
  it("preserves the pre-edit legacy builder/harness source bytes and strict origin-v1", () => {
    const text = readFileSync("scripts/lib/v1-38-lean-container-match-session.ts", "utf8"), parsed = ts.createSourceFile("legacy.ts", text, ts.ScriptTarget.Latest, true)
    const roots: Record<string, string> = { LEAN_CONTAINER_BROKER_SOURCE: "sha256:8e33ab083275694184a76b2e1325046994d50f55264ba47e82d419176c81f700", buildLeanCorrectionOriginBrokerSource: "sha256:b69866e265990f05e8a9ab0e4bedfc0fae8916d264bb4a54db152de83cdecea9", buildLeanAuthenticatedHarnessSource: "sha256:3d9d1728c6d3efcab8ff99530e54f8d5b2f7f273e565bf0ad2d540fb7bc1e8c7" }
    for (const statement of parsed.statements) if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) if (roots[declaration.name.getText(parsed)]) expect(lean.leanBytesRoot(Buffer.from(declaration.initializer!.getText(parsed)))).toBe(roots[declaration.name.getText(parsed)])
    expect(lean.leanBytesRoot(readFileSync("packages/runtime-js/src/worker-harness.ts"))).toBe("sha256:10d3d6a5b78870492f3ff36a044455808e1fbcd7eda4502d918bfa6489f438da")
    const old = { schemaVersion: "v1.38-lean-correction-origin-v1", requestOrdinal: 1, requestRoot: r("legacy"), transportMethod: "docker_exec_stream", brokerMode: "legacy", brokerBranch: "legacy_deadline", signalBufferState: "not_done", waitDisposition: "timed_out", workerLifecycle: "unknown", transportSignal: "broker_synthetic_sigkill", terminationDisposition: "worker_terminate_completed", elapsedBucket: "unknown" }
    expect(session.validateLeanCorrectionOriginMetadata(old)).toEqual(old)
    expect(() => session.validateLeanCorrectionOriginMetadata({ ...old, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root })).toThrow()
  })
  it.each(["complete", "foreign", "termination_failed", "late_parse"])("reaches real issuer/factory/planner/session with only fake OS surfaces: %s", async fault => {
    const f = verticalFixture(); sources.publishLeanReusedBaselineSource(f.ledger, f.source, f.reuse)
    const issued = issueFixture(f), frames: Record<string, any>[] = [], origins: session.LeanStartupOriginV5[] = []
    let owned = false
    native.control = (_command, args) => {
      if (!["inspect", "create", "start", "rm"].includes(args[0]!)) return native.deny()
      if (args[0] === "inspect") return owned ? { status: 0, signal: null, stdout: Buffer.from(issued.binding.ownershipLabel + "\n"), stderr: Buffer.alloc(0) } : { status: 1, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.from("Error: No such object: " + issued.binding.containerName + "\n") }
      if (args[0] === "create") owned = true
      if (args[0] === "rm") owned = false
      return { status: 0, signal: null, stdout: Buffer.from(args[0] === "create" ? "synthetic-container\n" : ""), stderr: Buffer.alloc(0) }
    }
    const originalNow = process.hrtime.bigint
    let late = false
    if (fault === "late_parse") vi.spyOn(process.hrtime, "bigint").mockImplementation(() => originalNow() + (late ? 5_000_000_000n : 0n))
    native.worker = (source, options) => {
      if (!source.includes('const { parentPort, workerData } = require("node:worker_threads")')) return native.deny()
      const opts = options as { workerData: { start: SharedArrayBuffer; args: string[] } }
      expect(opts.workerData.args.at(-1)).toBe(session.buildLeanContainerBrokerSourceV5())
      Atomics.store(new Int32Array(opts.workerData.start), 0, 1)
      return {
        terminate: async () => 0,
        postMessage(message: any) {
          let bytes = Buffer.alloc(0)
          if (message.type === "exchange") {
            const q = JSON.parse(Buffer.from(message.request).toString("utf8")); frames.push(q)
            const request = JSON.parse(Buffer.from(q.payloadBase64, "base64").toString("utf8"))
            const metadata = { ...q.startup.binding, schemaVersion: "v1.38-lean-startup-origin-v5", stage: fault === "termination_failed" ? "startup" : "receipt", branch: fault === "termination_failed" ? "startup_expired" : "complete", ready: fault !== "termination_failed", go: fault !== "termination_failed", wait: fault === "termination_failed" ? "timed_out" : "changed", termination: fault === "termination_failed" ? "failed" : "not_required", unknown: fault === "termination_failed" }
            if (fault === "foreign") metadata.requestRoot = r("cross-request")
            const inner = { ok: true, value: { activationOrders: [], strategyMemory: request.input.strategyMemory } }
            bytes = Buffer.from(JSON.stringify({ requestId: q.requestId, status: fault === "termination_failed" ? 70 : 0, signal: null, stdoutBase64: fault === "termination_failed" ? "" : Buffer.from(JSON.stringify(inner)).toString("base64"), stderrBase64: "", startupOrigin: metadata }) + "\n")
            if (fault === "late_parse") late = true
          }
          new Uint8Array(message.response).set(bytes); const control = new Int32Array(message.control); Atomics.store(control, 1, bytes.length); Atomics.store(control, 0, 1)
        },
      }
    }
    const provider = createFactorySupervisedRuntime({ admission: issued.admission, sourceBytes: Buffer.from(f.source.source), ...issued.binding, leanExperimentAuthority: issued.token, factoryLifetimeMs: 600000, startupOriginObserver: { observe: value => origins.push(value) } })
    expect(provider.identity.harnessRoot).toBe(bindingV5().harnessRoot)
    const state = createInitialGameState({ matchId: "synthetic", seed: "synthetic", arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.id === "arena:smoke:v1")!, bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "synthetic-bottom", topStrategyRevisionId: "synthetic-top" })
    const request = { kind: "selectActivations" as const, requestId: "synthetic:0", semanticTupleId: MATCH_KERNEL.tupleId, coordinates: { phaseNumber: 1, roundNumber: 1, stage: "select_bottom", ordinal: 0 }, input: createStrategyInputV119(state, "bottom") }
    const evidence = await provider.invoke(request as Parameters<typeof provider.invoke>[0], provider.identity)
    expect(evidence.result.ok).toBe(fault === "complete")
    expect(frames).toHaveLength(1); expect(frames[0]!.startup.binding.allocationRoot).toBe(f.a.root)
    expect(frames[0]!.startup.hostBudgetMs).toBeLessThanOrEqual(5000)
    expect(frames[0]!.timeoutMilliseconds).toBe(1000)
    expect(provider.verify(evidence)).toBe(true)
    const closed = provider.close()
    expect(closed.cleanupComplete).toBe(fault !== "termination_failed")
    expect(origins.length).toBe(fault === "termination_failed" ? 1 : 0)
    expect(() => createFactorySupervisedRuntime({ admission: issued.admission, sourceBytes: Buffer.from(f.source.source), ...issued.binding, leanExperimentAuthority: issued.token, factoryLifetimeMs: 600000 })).toThrow()
  }, 20000)
  it("refuses public startup scalar/serialized authority at actual constructors", () => {
    for (const construct of [createFactorySupervisedRuntime, createPlannerSupervisedRuntime, session.createLeanContainerMatchSession]) expect(() => construct({ startupMs: 2500 } as never)).toThrow()
  })
  it("closes actual v5 reader/gap/closure accounting once and rejects cross-version custody", () => {
    const f = verticalFixture(), startBody = { schemaVersion: "lean-correction-supervisor-admission-v5", route: "diagnostic", mode: "run", parentPid: 1, wallStartMs: 1000, monotonicStartNs: "0" }
    const start = { ...startBody, root: labRoot(startBody.schemaVersion, startBody) }
    const closeBody = { schemaVersion: "lean-correction-supervisor-admission-close-v5", startRoot: start.root, route: "diagnostic", mode: "run", elapsedUpperBoundMs: 100, monotonicObservedNs: "100000000", wallObservedMs: 1100, allocationRoot: f.a.root, ledgerInterval: "correction-run-finalization", importedMs: 50, ledgerCloseMs: 1100 }
    const close = { ...closeBody, root: labRoot(closeBody.schemaVersion, closeBody) }
    for (const [id, from, to] of [["pilot-entry", 1000, 1050], ["correction-run-finalization", 1050, 1100]] as const) { lean.beginLeanInterval(f.ledger, id, from); lean.closeLeanInterval(f.ledger, id, to) }
    lean.beginLeanInterval(f.ledger, "correction-supervisor-diagnostic-v5-verifier", 1200)
    const gap = retained.validateLeanFreshSupervisorReaderGap(start, close, f.a.root, "diagnostic", lean.readLeanTimeAccounting(f.ledger), 1200, 5)
    expect(gap.gapMs).toBe(100)
    expect(() => retained.validateLeanFreshSupervisorReaderGap(start, close, f.a.root, "diagnostic", lean.readLeanTimeAccounting(f.ledger), 1200, 4)).toThrow()
    let now = 1250
    retained.closeLeanFreshSupervisorReader(f.ledger, "diagnostic", gap, () => now++, 5)
    const time = lean.readLeanTimeAccounting(f.ledger)
    expect(time.active).toBe(false); expect(time.closedElapsedMs).toBeGreaterThanOrEqual(f.a.predecessor.elapsedUpperBoundMs + 251)
    expect(time.closed.has("correction-supervisor-diagnostic-v5-reader-close")).toBe(true)
    expect(() => retained.closeLeanFreshSupervisorReader(f.ledger, "diagnostic", gap, () => now++, 5)).toThrow()
  })
  it("publishes exact v5 baseline and reused diagnostic bytes through real consumers", () => {
    const f = verticalFixture("baseline")
    sources.publishLeanBaselineSource(f.ledger, f.source)
    expect(readFileSync(join(f.ledger.directory, "source-final-response.json"))).toEqual(Buffer.from(lean.leanCanonicalBytes(f.source)))
    expect(f.capacity).toHaveBeenCalledOnce()
    const d = verticalFixture()
    sources.publishLeanReusedBaselineSource(d.ledger, d.source, d.reuse)
    expect(readFileSync(join(d.ledger.directory, "source-final-response.json"))).toEqual(Buffer.from(lean.leanCanonicalBytes(d.source)))
    expect(lean.readLeanLedger(d.ledger).charged).toBe(23)
    const issued = issueFixture(d)
    expect(lean.readLeanLedger(d.ledger).charged).toBe(24)
    expect(authority.leanStartupAuthorityDescriptorV5(issued.token)?.policyRoot).toBe(lean.LEAN_STARTUP_POLICY_V5.root)
    expect(() => JSON.stringify(issued.token)).toThrow()
    expect(() => authority.claimLeanRuntimeAuthority({ ...issued.token }, issued.binding, "factory")).toThrow()
    expect(() => authority.claimLeanRuntimeAuthority(issued.token, issued.binding, "session")).toThrow()
    for (const layer of ["factory", "planner", "session"] as const) expect(authority.claimLeanRuntimeAuthority(issued.token, issued.binding, layer).startup?.allocationRoot).toBe(d.a.root)
    expect(() => authority.claimLeanRuntimeAuthority(issued.token, issued.binding, "session")).toThrow()
    expect(() => authority.issueLeanCorrectionRuntimeAuthority(d.ledger, issued.charge, d.source, issued.binding, d.reuse)).toThrow()
  }, 20000)
  it("carries every active segment without refund and rejects roots/order/reset", () => {
    const start = LEAN_STARTUP_CARRY_V5.startedAtMs
    const body = { schemaVersion: "lean-startup-setup-witness-v5", approvalRoot: lean.LEAN_STARTUP_APPROVAL_ROOT, supplementRoot: lean.LEAN_STARTUP_SUPPLEMENT_ROOT, policyRoot: lean.LEAN_STARTUP_POLICY_V5.root, priorElapsedMs: 26_634_447, charged: 23, segments: [{ startMs: start, closeMs: start + 1000 }, { startMs: start + 2000, closeMs: null }], consumedTimeBytesRoot: r("time") }
    const witness = { ...body, root: labRoot(body.schemaVersion, body) }
    expect(leanStartupCarryElapsedV5(witness, start + 3000)).toBe(26_636_447)
    for (const patch of [{ charged: 22 }, { priorElapsedMs: 0 }, { policyRoot: r("foreign") }, { segments: [{ startMs: start, closeMs: start - 1 }] }]) expect(() => validateLeanStartupSetupWitnessV5({ ...witness, ...patch })).toThrow()
  })
  it("includes every owned consumer in the actual source manifest", () => {
    const manifest = leanCorrectionSourceManifest("v5")
    console.info("STARTUP_V5_SOURCE_CLOSURE", manifest.root, "HARNESS", lean.leanBytesRoot(Buffer.from(session.buildLeanStartupWorkerHarnessV5())), "BROKER", lean.leanBytesRoot(Buffer.from(session.buildLeanContainerBrokerSourceV5())))
    for (const path of ["scripts/run-v1-38-lean-startup-v5.test.ts", "scripts/run-v1-38-lean-experiment.ts", "scripts/lib/v1-38-factory-supervised-runtime.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-correction-retained.ts"]) expect(manifest.entries.some(entry => entry.path === path)).toBe(true)
    expect(manifest.root).not.toBe(leanCorrectionSourceManifest("v4").root)
    expect(lean.LEAN_CAPS.matches).toBe(300)
  })
})
