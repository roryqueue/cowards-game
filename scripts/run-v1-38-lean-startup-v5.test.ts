import { afterEach, describe, expect, it, vi } from "vitest"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import { parseLeanCorrectionCommand, assertLeanCorrectionResources } from "./run-v1-38-lean-correction.js"
import { assessLeanPrefixCapacity } from "./run-v1-38-lean-experiment.js"
import * as session from "./lib/v1-38-lean-container-match-session.js"
import { mkdtempSync, writeFileSync, readFileSync, rmSync, realpathSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
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

const native = vi.hoisted(() => ({
  deny: () => { throw new Error("NO_NATIVE_STARTUP_V5_FIXTURE") },
  worker: undefined as undefined | ((source: string, options: unknown) => unknown),
  control: undefined as undefined | ((command: string, args: readonly string[]) => unknown),
}))
vi.mock("node:worker_threads", async original => ({ ...await original<typeof import("node:worker_threads")>(), Worker: function(source: string, options: unknown) { return native.worker ? native.worker(source, options) : native.deny() } }))
vi.mock("node:child_process", async original => ({ ...await original<typeof import("node:child_process")>(), fork: native.deny, spawn: native.deny, spawnSync: (command: string, args: readonly string[]) => native.control ? native.control(command, args) : native.deny(), execFile: native.deny, execFileSync: native.deny, exec: native.deny, execSync: native.deny }))
const r = (name: string) => labRoot("startup-v5-test", name)
const predecessor = (elapsedUpperBoundMs = 28_800_001, chargedMatches = 23) => {
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches, elapsedUpperBoundMs, allocatedDiskBytes: 9_617_408, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r("history"), survivors: [{ identity: ".strategy-lab/synthetic-history", allocatedBytes: 4096 }] }
  return { ...body, root: labRoot(body.schemaVersion, body) }
}
const input = () => ({ sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: lean.LEAN_STARTUP_SUPPLEMENT_ROOT, candidateRoots: [r("a"), r("b")], requestRoots: [r("request")], seed: "synthetic-v5", route: "diagnostic" as const, reuseGrantRoot: r("reuse"), supervisorDecisionRoot: lean.LEAN_STARTUP_APPROVAL_ROOT, acceptedCheckRoot: null, requestBytesRoot: r("bytes"), dataReviewRoot: r("data"), setupAccountingRoot: r("setup"), predecessor: predecessor(), startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root })
const dirs: string[] = []
afterEach(() => { native.worker = undefined; native.control = undefined; vi.restoreAllMocks(); for (const directory of dirs.splice(0)) rmSync(directory, { recursive: true, force: true }) })
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
  writeFileSync(join(f.ledger.directory, "ledger.ndjson"), Buffer.from(JSON.stringify({ kind: "charge", charge }) + "\n"))
  const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: f.source.packet, proposal: f.source.proposal, sourceBytes: Buffer.from(f.source.source) }), validation: f.source.validation })
  const defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: f.source.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  const runtime = prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot: f.source.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image })
  const binding = { budgetRoot: f.a.root, attemptRoot: charge.root, matchId: `lean-${charge.root.slice(7, 31)}`, containerName: `lean-${charge.root.slice(7, 25)}-${seat}`, ownershipLabel: `lean-${f.a.root.slice(7, 25)}`, seat, runtime }
  return { charge, admission, revision, binding, token: authority.issueLeanCorrectionRuntimeAuthority(f.ledger, charge, f.source, binding, f.reuse) }
}
describe("closure", () => {
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
    for (const path of ["scripts/run-v1-38-lean-startup-v5.test.ts", "scripts/run-v1-38-lean-experiment.ts", "scripts/lib/v1-38-factory-supervised-runtime.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-correction-retained.ts"]) expect(manifest.entries.some(entry => entry.path === path)).toBe(true)
    expect(manifest.root).not.toBe(leanCorrectionSourceManifest("v4").root)
    expect(lean.LEAN_CAPS.matches).toBe(300)
  })
})
