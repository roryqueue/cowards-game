import { afterEach, describe, it, expect, vi } from "vitest"
import { chmodSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { runLeanBaselineMatch } from "./lib/v1-38-lean-baseline-match.js"
import { retainLeanMatch } from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import { parseLeanCorrectionCommand } from "./run-v1-38-lean-correction.js"
import { validateLeanReplaySetupWitnessV7, leanReplayCarryElapsedV7 } from "./run-v1-38-lean-correction.js"
import { LEAN_HOST_STAGE_V7_SOURCE_INVENTORY, leanCorrectionSourceManifest } from "./run-v1-38-lean-correction.js"
import * as retained from "./lib/v1-38-lean-correction-retained.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { leanBaselineSourcePublicationBindingV6, leanBaselineSourcePublicationBindingV7 } from "./lib/v1-38-lean-baseline-source.js"
import { buildLeanContainerBrokerSourceV6, buildLeanContainerBrokerSourceV7, buildLeanStartupWorkerHarnessV5, validateLeanStartupOriginV6, validateLeanStartupOriginV7 } from "./lib/v1-38-lean-container-match-session.js"
import { claimLeanRuntimeAuthority } from "./lib/v1-38-lean-experiment-authority.js"
import { captureLeanHostFailureV7, readLeanTrustedHostFailureStageV7 } from "./lib/v1-38-lean-host-stage-v7.js"
import { isLeanChildFailureReceipt, isLeanChildFailureReceiptV7, publishChildTerminalAfterOptionalReceipt, resolveLeanChildCliTerminal } from "./lib/v1-38-lean-child-cli-terminal.js"

vi.mock("node:child_process", async original => { const deny = () => { throw new Error("SYNTHETIC_ONLY") }; return { ...await original<typeof import("node:child_process")>(), spawn: deny, spawnSync: deny, fork: deny, exec: deny, execSync: deny, execFile: deny, execFileSync: deny } })
vi.mock("node:worker_threads", async original => ({ ...await original<typeof import("node:worker_threads")>(), Worker: function() { throw new Error("SYNTHETIC_ONLY") } }))

const root = `sha256:${"a".repeat(64)}`
const binding = { route: "diagnostic" as const, allocationRoot: root, chargeRoot: root, slotRoot: root }
const stages = ["match_preparation", "match_composition_postprocessing", "compact_replay_retention_publication", "terminal_result_publication"] as const
const r = (label: string) => labRoot("host-stage-v7-fixture", label)
const syntheticDirectories = new Set<string>()
afterEach(() => { for (const directory of syntheticDirectories) rmSync(directory, { recursive: true }); syntheticDirectories.clear() })
const allocationInput = () => {
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 28, elapsedUpperBoundMs: 41_943_494, allocatedDiskBytes: 12_894_208, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r("history"), survivors: [{ identity: ".strategy-lab/synthetic-history", allocatedBytes: 4096 }] }
  return { sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: lean.LEAN_REPLAY_V7_SUPPLEMENT_ROOT, candidateRoots: [r("a"), r("b")], requestRoots: [r("request")], seed: "synthetic-v7", route: "diagnostic" as const, reuseGrantRoot: r("reuse"), supervisorDecisionRoot: lean.LEAN_REPLAY_V7_APPROVAL_ROOT, acceptedCheckRoot: null, requestBytesRoot: r("request-bytes"), dataReviewRoot: r("data"), setupAccountingRoot: r("setup"), startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, predecessor: { ...body, root: labRoot(body.schemaVersion, body) } }
}
describe("additive v7 identity", () => {
  it("closes exactly the checked target union and pins actual source bytes", () => {
    const plan = readFileSync(".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-HOST-STAGE-V7-PLAN-v1.md", "utf8")
    const inventory = [...new Set([...plan.matchAll(/<target file="([^"]+)"/gu)].map(match => match[1]!))]
    inventory.push(".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-HOST-STAGE-APPROVAL-20261006.md", ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-HOST-STAGE-V7-PLAN-v1.md", lean.LEAN_REPLAY_V7_POLICY.identity)
    expect([...LEAN_HOST_STAGE_V7_SOURCE_INVENTORY].sort()).toEqual([...new Set(inventory)].sort())
    const manifest = leanCorrectionSourceManifest("v7")
    expect(manifest.entries).toEqual([...LEAN_HOST_STAGE_V7_SOURCE_INVENTORY].sort().map(path => ({ path, root: lean.leanBytesRoot(readFileSync(path)) })))
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
    const entry: lean.LeanChildEntryV2 = { schemaVersion: "lean-child-entry-v2", allocationRoot: a.root, sourceRoot: a.sourceRoot, requestBytesRoot: a.requestBytesRoot, head: "1".repeat(40), parentPid: 1, childPid: 2, handshakeRoot: r("handshake"), wallStartMs: 1000, monotonicStartNs: "0" }
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
