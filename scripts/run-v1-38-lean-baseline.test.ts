import { afterEach, describe, expect, it, vi } from "vitest"
import { EventEmitter } from "node:events"
import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { currentBaselineSlotKind, createLeanCorrectionAllocation, createLeanCurrentBaselineAllocation, leanCanonicalBytes, leanBytesRoot, LEAN_CAPS, LEAN_CLOSED_V7, type LeanExperimentLedger } from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as parentApi from "./run-v1-38-lean-baseline.js"
import { admitsLeanBaselineReviewAgents, assertLeanBaselineWritableScope, deriveLeanBaselineCandidateRoots, deriveLeanBaselineRequestRoots, leanBaselinePair, leanBaselineSourceManifest, parseLeanBaselineCommand } from "./run-v1-38-lean-baseline.js"
import { leanBaselineMatchSeed } from "./lib/v1-38-lean-baseline-match.js"

const root = (name: string) => labRoot("baseline-cli-test", name)

const host = vi.hoisted(() => ({ active: false, child: null as any, files: new Map<string, Uint8Array>(), order: [] as string[], entry: null as any, terminal: null as any, allocation: null as any, headCalls: 0, finalDrift: false, finalThrow: false, sampleThrow: false, resourceHigh: false, elapsed: 0, publishFailure: "", terminalFailure: false, capacityFailure: false }))
vi.mock("node:child_process", async original => {
  const actual = await original<typeof import("node:child_process")>()
  return { ...actual, fork: (...args: any[]) => host.active ? host.child : (actual.fork as any)(...args), execFileSync: (...args: any[]) => {
    if (!host.active) return (actual.execFileSync as any)(...args)
    if (args[0] === "ps") { if (host.sampleThrow) throw new Error("PRIVATE sample details"); return host.resourceHigh ? String(Math.ceil(LEAN_CAPS.scratchBytes / 1024)) : "100" }
    if (args[1][0] === "show") return leanCanonicalBytes(host.allocation)
    if (++host.headCalls > 1 && host.finalThrow) throw new Error("PRIVATE identity details")
    return (host.finalDrift && host.headCalls > 1 ? "b" : "a").repeat(40)
  } }
})
vi.mock("node:fs", async original => {
  const actual = await original<typeof import("node:fs")>()
  return { ...actual, readdirSync: (...args: any[]) => host.active ? [] : (actual.readdirSync as any)(...args), statfsSync: (...args: any[]) => host.active ? { bavail: host.capacityFailure ? 0n : 100000000000n, bsize: 1n } : (actual.statfsSync as any)(...args), openSync: (...args: any[]) => {
    if (!host.active) return (actual.openSync as any)(...args)
    const name = args[0].split("/").at(-1)
    host.order.push(name)
    if (name === host.publishFailure) throw new Error("PRIVATE publication details")
    host.files.set(name, new Uint8Array())
    return name
  }, fsyncSync: (...args: any[]) => host.active ? undefined : (actual.fsyncSync as any)(...args), closeSync: (...args: any[]) => host.active ? undefined : (actual.closeSync as any)(...args) }
})
vi.mock("./run-v1-38-lean-experiment.js", async original => {
  const actual = await original<typeof import("./run-v1-38-lean-experiment.js")>()
  return { ...actual, readLeanSafeFile: (...args: any[]) => host.active ? (args[0].endsWith("allocation.json") ? leanCanonicalBytes(host.allocation) : args[0].endsWith("entry.json") ? leanCanonicalBytes(host.entry) : Buffer.from("request")) : (actual.readLeanSafeFile as any)(...args) }
})
vi.mock("../packages/strategy-lab/src/league/lean-experiment.js", async original => {
  const actual = await original<typeof import("../packages/strategy-lab/src/league/lean-experiment.js")>()
  const call = (fn: (...args: any[]) => any, mock: (...args: any[]) => any) => (...args: any[]) => host.active ? mock(...args) : fn(...args)
  return { ...actual, readLeanLedger: call(actual.readLeanLedger, () => ({ events: [] })), readLeanTimeAccounting: call(actual.readLeanTimeAccounting, () => ({ active: false, starts: new Map() })), cumulativeLeanPhysicalBytes: call(actual.cumulativeLeanPhysicalBytes, () => 100), currentLeanElapsedMs: call(actual.currentLeanElapsedMs, () => host.elapsed), assertLeanPublicationCapacity: call(actual.assertLeanPublicationCapacity, (_ledger, bytes) => { host.order.push(`capacity:${bytes}`) }), writeLeanAll: call(actual.writeLeanAll, (fd, bytes) => host.files.set(fd, bytes)), publishLeanChildEntry: call(actual.publishLeanChildEntry, (_ledger, entry) => { host.entry = entry; host.order.push("entry") }), beginLeanInterval: call(actual.beginLeanInterval, () => host.order.push("interval")), deriveLeanChildTerminal: call(actual.deriveLeanChildTerminal, (_ledger, _entry, observation) => { host.order.push("derive-terminal"); return observation }), publishLeanChildTerminal: call(actual.publishLeanChildTerminal, (_ledger, terminal) => { host.order.push("terminal"); host.terminal = terminal; if (host.terminalFailure) throw new Error("PRIVATE terminal details") }) }
})

afterEach(() => { host.active = false; vi.useRealTimers() })
const beginParent = (enabled: boolean, configure?: () => void) => {
  vi.useFakeTimers()
  const input = { seed: "inert-parent-fixture", sourceRoot: root("source"), planRoot: root("plan"), coldRoot: root("cold") }
  const prior = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 11, elapsedUpperBoundMs: 3_319_046, allocatedDiskBytes: 0, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: root("history"), survivors: [{ identity: ".strategy-lab/inert-parent-survivor", allocatedBytes: 0 }] }
  const allocation = createLeanCorrectionAllocation({ ...input, reviewRoot: root("review"), candidateRoots: deriveLeanBaselineCandidateRoots(input.coldRoot), requestRoots: deriveLeanBaselineRequestRoots(input), route: "baseline", reuseGrantRoot: root("reuse"), diagnosisRoot: root("diagnosis"), predecessor: { ...prior, root: labRoot(prior.schemaVersion, prior) } })
  Object.assign(host, { active: true, files: new Map(), order: [], entry: null, terminal: null, allocation, headCalls: 0, finalDrift: false, finalThrow: false, sampleThrow: false, resourceHigh: false, elapsed: 0, publishFailure: "", terminalFailure: false, capacityFailure: false })
  const child = Object.assign(new EventEmitter(), { pid: process.pid + 1000, exitCode: null as number | null, signalCode: null as string | null, kills: [] as string[], kill(signal: string) { this.kills.push(signal); return true }, send: () => true })
  host.child = child
  configure?.()
  const action = parentApi.runLeanBoundedParent({ ledger: { allocation: host.allocation } as LeanExperimentLedger, store: "/mock", requestPath: "/mock/request.json", allocationPath: "/mock/allocation.json", sourceRoot: root("source"), manifestRoot: () => root("source"), childMode: "mock-inert", ...(enabled ? { supervisorObservation: true } : {}) })
  const settled = action.then(value => ({ value, error: null }), error => ({ value: null, error }))
  return { child, settled }
}
const readyParent = async (child: ReturnType<typeof beginParent>["child"]) => { child.emit("message", { ready: child.pid }); await Promise.resolve(); await Promise.resolve() }
const exitParent = (child: ReturnType<typeof beginParent>["child"]) => { child.exitCode = 0; child.emit("exit", 0, null) }

const timeboxBaseline = (extended: boolean, bookkeeping = false) => {
  const extension = bookkeeping ? lean.LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION : lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION
  const p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: bookkeeping ? 31 : 30, elapsedUpperBoundMs: extended ? extension.priorElapsedMs : lean.LEAN_RETRY_V8_CARRY.priorElapsedMs, allocatedDiskBytes: 13_000_000, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: root("history"), survivors: [{ identity: ".strategy-lab/inert-parent-survivor", allocatedBytes: 4096 }] }
  return lean.createLeanSupervisorCorrectionAllocation({ ...(extended ? { timeboxExtension: extension } : {}), sourceRoot: root("source"), reviewRoot: root("review"), coldRoot: root("cold"), planRoot: lean.LEAN_RETRY_V8_PLAN_ROOT, seed: "inert-timebox-baseline", candidateRoots: [root("a"), root("b")], requestRoots: Array.from({ length: 36 }, (_, n) => root(`request-${n}`)), route: "baseline", reuseGrantRoot: root("reuse"), supervisorDecisionRoot: lean.LEAN_RETRY_V8_APPROVAL_ROOT, acceptedCheckRoot: root("actual-check-fixture"), acceptedReaderCloseRoot: root("actual-final-fixture"), requestBytesRoot: root("request"), dataReviewRoot: root("data"), setupAccountingRoot: root("setup"), startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, attemptOrdinal: bookkeeping ? 2 : 1, priorClosureRoot: bookkeeping ? lean.LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION.diagnosticClosureRoot : null, continuationRoot: bookkeeping ? root("fresh-continuation") : null, predecessor: { ...p, root: labRoot(p.schemaVersion, p) } }, 8)
}
describe("actual conditional baseline parent timebox consumer", () => {
  it("consumes the new ordinal2 carry continuously with the same parent reserve", async () => {
    const b = lean.LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION
    const { child, settled } = beginParent(true, () => { host.allocation = timeboxBaseline(true, true); host.elapsed = lean.leanRetryRootElapsedFloorV8(b.startedAtMs + 100, b) })
    expect(parentApi.leanBoundedParentTimeBudget({ allocation: host.allocation } as LeanExperimentLedger, 1_260_000)).toEqual({ elapsedMs: 62_024_183, capMs: 72_000_000, timeoutMs: 8_715_817 })
    await readyParent(child)
    await vi.advanceTimersByTimeAsync(250)
    expect(child.kills).toHaveLength(0)
    host.elapsed = 70_140_000
    await vi.advanceTimersByTimeAsync(250)
    expect(child.kills).toContain("SIGKILL")
    exitParent(child); expect((await settled).error).toBeInstanceOf(TypeError)
  })
  it("uses the approved carry/start, cap and child timeout after legacy expiry", async () => {
    const extension = lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION
    const { child, settled } = beginParent(true, () => { host.allocation = timeboxBaseline(true); host.elapsed = lean.leanRetryRootElapsedFloorV8(extension.startedAtMs + 3_999_083, extension) })
    const timers = vi.spyOn(globalThis, "setTimeout")
    expect(host.elapsed).toBe(60_000_000)
    expect(parentApi.leanBoundedParentTimeBudget({ allocation: host.allocation } as LeanExperimentLedger, 1_260_000)).toEqual({ elapsedMs: 60_000_000, capMs: 72_000_000, timeoutMs: 10_740_000 })
    await readyParent(child)
    expect(timers.mock.calls.some(call => call[1] === 12_000_000)).toBe(true)
    await vi.advanceTimersByTimeAsync(250)
    expect(child.kills).toHaveLength(0)
    host.elapsed = 70_140_000
    await vi.advanceTimersByTimeAsync(250)
    expect(child.kills).toContain("SIGKILL")
    exitParent(child); expect((await settled).error).toBeInstanceOf(TypeError)
    timers.mockRestore()
  })
  it.each(["legacy", "missing", "stale", "cross-root"] as const)("%s cannot extend admission or create a child", async variant => {
    const { child, settled } = beginParent(true, () => {
      const allocation = timeboxBaseline(variant !== "legacy")
      if (variant === "missing") { const { timeboxExtension: _extension, ...missing } = allocation; host.allocation = missing }
      else host.allocation = variant === "legacy" ? allocation : { ...allocation, timeboxExtension: { ...allocation.timeboxExtension!, ...(variant === "stale" ? { startedAtMs: 0 } : { root: root("cross-root") }) } }
      host.elapsed = 60_000_000
    })
    expect((await settled).error).toBeInstanceOf(TypeError)
    expect(host.entry).toBeNull(); expect(child.kills).toHaveLength(0)
    expect(() => parentApi.leanBoundedParentTimeBudget({ allocation: host.allocation } as LeanExperimentLedger)).toThrow()
  })
  it("keeps memory and disk refusal ahead of parent release", async () => {
    const { child, settled } = beginParent(true, () => { host.allocation = timeboxBaseline(true); host.elapsed = 60_000_000; host.capacityFailure = true })
    await readyParent(child)
    expect((await settled).error).toBeInstanceOf(TypeError)
    expect(host.entry).toBeNull()
  })
})

describe("opt-in finite parent supervisor observations", () => {
  it("publishes actual custody before terminal without adding default artifacts", async () => {
    for (const enabled of [false, true]) {
      const { child, settled } = beginParent(enabled)
      await readyParent(child); exitParent(child)
      expect((await settled).error).toBeNull()
      const bytes = host.files.get("parent-supervisor-reasons.json")
      if (!enabled) { expect(bytes).toBeUndefined(); continue }
      const reason = parentApi.validateLeanSupervisorReasonBytes(bytes!)
      expect(reason).toMatchObject({ allocationRoot: host.allocation.root, sourceRoot: root("source"), requestBytesRoot: leanBytesRoot(Buffer.from("request")), entryBytesRoot: leanBytesRoot(leanCanonicalBytes(host.entry)), head: "a".repeat(40), parentPid: process.pid, childPid: child.pid, exitCode: 0, signal: null, uncertain: false, reasons: [] })
      expect(reason.observations).toMatchObject({ entry: "published", cleanup: "child_exit_observed", terminalization: "unobserved", initiatingCause: "unknown" })
      expect(host.order.indexOf("parent-supervisor-reasons.json")).toBeLessThan(host.order.indexOf("derive-terminal"))
      expect(bytes!.length).toBeLessThanOrEqual(4096)
      expect(host.order.some(item => item === `capacity:${bytes!.length}`)).toBe(true)
    }
  })

  it.each(["child_error", "malformed_ipc", "duplicate_failure_receipt", "resource_threshold", "resource_sampling_exception", "deadline_timeout", "final_identity_mismatch", "final_identity_exception", "failure_receipt_publication_uncertain"])("retains %s at its actual unchanged setter", async code => {
    const runs: any[] = []
    for (const enabled of [false, true]) {
      const { child, settled } = beginParent(enabled, () => { if (code === "deadline_timeout") host.elapsed = LEAN_CAPS.elapsedMs - 1 })
      await readyParent(child)
      const receipt = { type: "lean-child-failure", schemaVersion: "lean-child-failure-v1", code: "UNKNOWN_INTERNAL_FAILURE", stage: "unknown" }
      if (code === "child_error") { child.emit("error", new Error("PRIVATE ERROR")); child.emit("error", new Error("PRIVATE ERROR")) }
      if (code === "malformed_ipc") child.emit("message", { private: "PRIVATE INPUT" })
      if (code === "duplicate_failure_receipt") { child.emit("message", receipt); child.emit("message", receipt) }
      if (code === "resource_threshold") { host.resourceHigh = true; await vi.advanceTimersByTimeAsync(250) }
      if (code === "resource_sampling_exception") { host.sampleThrow = true; await vi.advanceTimersByTimeAsync(250) }
      if (code === "deadline_timeout") await vi.advanceTimersByTimeAsync(1)
      if (code === "final_identity_mismatch") host.finalDrift = true
      if (code === "final_identity_exception") host.finalThrow = true
      if (code === "failure_receipt_publication_uncertain") { child.emit("message", receipt); host.publishFailure = "entry-failure.json" }
      exitParent(child)
      expect((await settled).error).toBeInstanceOf(TypeError)
      expect(host.terminal.status).toBe("child_failed")
      runs.push({ kills: [...child.kills], status: host.terminal.status, checks: host.order.filter(item => !item.startsWith("capacity:") && item !== "parent-supervisor-reasons.json") })
      if (enabled) {
        const bytes = host.files.get("parent-supervisor-reasons.json")!
        const value = parentApi.validateLeanSupervisorReasonBytes(bytes)
        expect(value.reasons).toContain(code)
        expect(value.reasons.filter(reason => reason === code)).toHaveLength(1)
        expect(value.uncertain).toBe(true)
        expect(Buffer.from(bytes).toString()).not.toContain("PRIVATE")
      }
    }
    expect(runs[1]).toEqual(runs[0])
  })

  it("keeps simultaneous reasons and still fails when reason publication fails", async () => {
    const { child, settled } = beginParent(true)
    await readyParent(child)
    child.emit("error", new Error("PRIVATE")); child.emit("message", null)
    exitParent(child); await settled
    expect(parentApi.validateLeanSupervisorReasonBytes(host.files.get("parent-supervisor-reasons.json")!).reasons).toEqual(["child_error", "malformed_ipc"])
    const second = beginParent(true, () => { host.publishFailure = "parent-supervisor-reasons.json" })
    await readyParent(second.child); exitParent(second.child)
    expect((await second.settled).error).toBeInstanceOf(TypeError)
    expect(host.terminal.status).toBe("child_failed")
    expect(host.order).toContain("terminal")
  })

  it("does not invent a terminal write or future cleanup observation", async () => {
    const { child, settled } = beginParent(true, () => { host.terminalFailure = true })
    await readyParent(child); exitParent(child)
    expect((await settled).error).toBeInstanceOf(Error)
    const value = parentApi.validateLeanSupervisorReasonBytes(host.files.get("parent-supervisor-reasons.json")!)
    expect(value.observations.terminalization).toBe("unobserved")
    expect(value.observations.cleanup).toBe("child_exit_observed")
  })

  it("publishes the failure receipt first without copying its asserted stage or code", async () => {
    const { child, settled } = beginParent(true)
    await readyParent(child)
    child.emit("message", { type: "lean-child-failure", schemaVersion: "lean-child-failure-v1", code: "SOURCE_HOLD", stage: "match" })
    exitParent(child)
    expect((await settled).error).toBeInstanceOf(TypeError)
    const bytes = host.files.get("parent-supervisor-reasons.json")!
    const value = parentApi.validateLeanSupervisorReasonBytes(bytes)
    expect(value.uncertain).toBe(false)
    expect(value.reasons).toEqual([])
    expect(value.observations.failureReceipt).toBe("published")
    expect(Buffer.from(bytes).toString()).not.toMatch(/SOURCE_HOLD|"match"/u)
    expect(host.order.indexOf("entry-failure.json")).toBeLessThan(host.order.indexOf("parent-supervisor-reasons.json"))
    expect(host.terminal.status).toBe("child_failed")
  })

  it("keeps malformed ready and ready-timeout cleanup unchanged without inventing entry custody", async () => {
    for (const mode of ["malformed", "timeout"]) for (const enabled of [false, true]) {
      const { child, settled } = beginParent(enabled)
      if (mode === "malformed") child.emit("message", { ready: -1 })
      else await vi.advanceTimersByTimeAsync(30_000)
      expect((await settled).error).toBeInstanceOf(TypeError)
      expect(child.kills).toEqual(["SIGKILL"])
      expect(host.entry).toBeNull()
      expect(host.files.size).toBe(0)
    }
  })

  it("keeps pre-entry capacity refusal artifact-free and performs unchanged cleanup", async () => {
    for (const enabled of [false, true]) {
      const { child, settled } = beginParent(enabled, () => { host.capacityFailure = true })
      await readyParent(child)
      expect((await settled).error).toBeInstanceOf(TypeError)
      expect(child.kills).toEqual(["SIGKILL"])
      expect(host.files.size).toBe(0)
    }
  })

  it("rejects extra/raw keys, arbitrary enums, malformed roots, nonfinite numbers, duplicate reasons and noncanonical/oversized bytes", async () => {
    const { child, settled } = beginParent(true)
    await readyParent(child); exitParent(child); await settled
    const valid = parentApi.validateLeanSupervisorReasonBytes(host.files.get("parent-supervisor-reasons.json")!)
    const mutate = (change: Record<string, unknown>) => { const { root: _root, ...body } = { ...valid, ...change }; let mutatedRoot = root("invalid"); try { mutatedRoot = labRoot("lean-parent-supervisor-reasons-v1", body) } catch { /* Deliberately noncanonical mutation. */ }; return { ...body, root: mutatedRoot } }
    for (const change of [{ rawError: "PRIVATE" }, { reasons: ["arbitrary"] }, { sourceRoot: "bad" }, { exitCode: Infinity }, { parentPid: NaN }, { parentPid: 0 }, { signal: "PRIVATE" }, { reasons: ["child_error", "child_error"] }, { observations: { ...valid.observations, terminalization: "success" } }, { head: "a".repeat(5000) }]) expect(parentApi.isLeanSupervisorReasonEnvelope(mutate(change))).toBe(false)
    expect(parentApi.isLeanSupervisorReasonEnvelope({ ...valid, root: root("wrong") })).toBe(false)
    expect(() => parentApi.validateLeanSupervisorReasonBytes(Buffer.from(` ${Buffer.from(host.files.get("parent-supervisor-reasons.json")!).toString()}`))).toThrow()
    expect(() => parentApi.validateLeanSupervisorReasonBytes(Buffer.alloc(4097, 32))).toThrow()
  })
})

describe("current-only baseline CLI source contracts", () => {
  it("allows the real root author only with a distinct subagent reviewer", () => {
    expect(admitsLeanBaselineReviewAgents("/root", "/root/review_265_lean_baseline")).toBe(true)
    expect(admitsLeanBaselineReviewAgents("/root/entry", "/root/review_265_lean_baseline")).toBe(true)
    expect(admitsLeanBaselineReviewAgents("/root", "/root")).toBe(false)
    expect(admitsLeanBaselineReviewAgents("/root/review_265_lean_baseline", "/root/review_265_lean_baseline")).toBe(false)
    expect(admitsLeanBaselineReviewAgents("someone-else", "/root/review_265_lean_baseline")).toBe(false)
  })

  it("admits only the prospective prepare/run/retained-reader surface", () => {
    expect(parseLeanBaselineCommand(["prepare-current", "--request", "a"]).mode).toBe("prepare-current")
    expect(parseLeanBaselineCommand(["run-current", "--request", "a"]).mode).toBe("run-current")
    expect(parseLeanBaselineCommand(["verify-retained", "--request", "a"]).mode).toBe("verify-retained")
    for (const command of ["prepare-pilot", "run-pilot", "child-current", "run-current", "verify-retained"]) {
      expect(() => parseLeanBaselineCommand([command, "a"])).toThrow(/LEAN_BASELINE_ARGUMENTS/u)
    }
    expect(() => parseLeanBaselineCommand(["run-current", "--request", "--unsafe"])).toThrow(/LEAN_BASELINE_ARGUMENTS/u)
  })

  it("freezes 36 distinct current intents, not post-training source roots", () => {
    const input = { seed: "baseline-test", coldRoot: root("cold"), planRoot: root("plan"), sourceRoot: root("source") }
    const requestRoots = deriveLeanBaselineRequestRoots(input)
    expect(requestRoots).toHaveLength(36)
    expect(new Set(requestRoots).size).toBe(36)
    expect(deriveLeanBaselineRequestRoots(input)).toEqual(requestRoots)
    expect(deriveLeanBaselineRequestRoots({ ...input, seed: "other" })).not.toEqual(requestRoots)
    expect(deriveLeanBaselineCandidateRoots(input.coldRoot)).toHaveLength(2)
    expect(new Set(deriveLeanBaselineCandidateRoots(input.coldRoot)).size).toBe(2)
    for (let ordinal = 0; ordinal < 36; ordinal++) expect(currentBaselineSlotKind(ordinal).condition).toBe((ordinal < 8 ? ordinal : ordinal < 12 ? ordinal - 8 : ordinal < 20 ? ordinal - 12 : ordinal < 28 ? ordinal - 20 : ordinal < 32 ? ordinal - 28 : ordinal - 32) % 4)

    const activeArenas = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter(a => a.status === "active" && a.schedulable).sort((a, b) => a.semanticGeometryHash.localeCompare(b.semanticGeometryHash))
    const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.id === "arena:smoke:v1" && a.name === "Smoke" && a.status === "active" && a.schedulable)!
    const predecessor = { schemaVersion: "lean-closed-v7-predecessor-v1", closed: { allocationRoot: LEAN_CLOSED_V7.allocationRoot }, elapsedUpperBoundMs: LEAN_CLOSED_V7.elapsedUpperBoundMs, chargedMatches: LEAN_CLOSED_V7.chargedMatches, allocatedDiskBytes: 0 } as never
    const allocation = createLeanCurrentBaselineAllocation({ ...input, reviewRoot: root("review"), planRoot: input.planRoot, candidateRoots: deriveLeanBaselineCandidateRoots(input.coldRoot), requestRoots, seed: input.seed }, predecessor)
    expect(allocation.slots).toHaveLength(36)
    expect(allocation.slots.every((slot, ordinal) => slot.arenaHash === smoke.semanticGeometryHash && slot.arenaHash === activeArenas[currentBaselineSlotKind(ordinal).arenaIndex]!.semanticGeometryHash && slot.requestRoot === requestRoots[ordinal])).toBe(true)
    for (let start = 0; start < 36; start += 4) {
      const conditions = allocation.slots.slice(start, start + 4).map(slot => slot.condition)
      expect(conditions).toEqual([0, 1, 2, 3])
      expect(new Set(conditions.map(condition => condition < 2 ? "entrant-bottom" : "entrant-top"))).toEqual(new Set(["entrant-bottom", "entrant-top"]))
      expect(new Set(conditions.map(condition => condition % 2 === 0 ? "bottom-initiative" : "top-initiative"))).toEqual(new Set(["bottom-initiative", "top-initiative"]))
    }
    for (let offset = 0; offset < 4; offset++) {
      expect(allocation.slots[32 + offset]).toMatchObject({ arenaHash: allocation.slots[8 + offset]!.arenaHash, condition: allocation.slots[8 + offset]!.condition })
      expect(leanBaselineMatchSeed(input.seed, 32 + offset)).toBe(leanBaselineMatchSeed(input.seed, 8 + offset))
    }
  })

  it("roots the pre-charge byte prefix and frozen pair to each intended slot", () => {
    const slot = { ordinal: 0, condition: 0, arenaHash: root("arena"), requestRoot: root("request"), root: root("slot") }
    const input = { ordinal: 0, slot, priorLedgerBytesRoot: root("ledger"), priorLedgerByteLength: 140, priorCharged: 9, bottom: { role: "initial-tactical", sourceRoot: root("bottom-source"), root: root("bottom-snapshot") }, top: { role: "cold-opponent", sourceRoot: root("top-source"), root: root("top-snapshot") } }
    const pair = leanBaselinePair(input)
    expect(pair.priorCharged).toBe(9)
    expect(pair.priorLedgerByteLength).toBe(140)
    expect(leanBaselinePair(input)).toEqual(pair)
    expect(leanBaselinePair({ ...input, priorLedgerBytesRoot: root("different-prefix") }).root).not.toBe(pair.root)
    expect(leanBaselinePair({ ...input, bottom: { ...input.bottom, sourceRoot: root("different-source") } }).root).not.toBe(pair.root)
  })

  it("binds every new runtime, reader and shell source without mutating the legacy factory manifest", () => {
    const manifest = leanBaselineSourceManifest()
    const paths = new Set(manifest.entries.map(entry => entry.path))
    for (const path of ["scripts/run-v1-38-lean-baseline.ts", "scripts/run-v1-38-lean-baseline.sh", "scripts/lib/v1-38-lean-baseline-pipeline.ts", "scripts/lib/v1-38-lean-baseline-retained.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-experiment-authority.ts", "packages/strategy-lab/src/league/lean-training.ts", "packages/strategy-lab/src/league/lean-experiment.ts"]) expect(paths.has(path)).toBe(true)
    expect(manifest.entries).toEqual([...manifest.entries].sort((a, b) => a.path.localeCompare(b.path)))
  })

  it("requires inherited pre-loader write controls and core suppression", () => {
    const scope = { cacheDisabled: "1", compileDisabled: "1", tempDirectory: resolve(".strategy-lab/lean-baseline-20261004-v1-tmp") }
    expect(() => assertLeanBaselineWritableScope(scope, "0\n")).not.toThrow()
    expect(() => assertLeanBaselineWritableScope({ ...scope, coverage: "/tmp/leak" }, "0")).toThrow(/WRITABLE_SCOPE/u)
    expect(() => assertLeanBaselineWritableScope(scope, "unlimited")).toThrow(/WRITABLE_SCOPE/u)
  })

  it("wrapper reports safe inherited scope without entering preparation or Matches", () => {
    const output = execFileSync("sh", ["scripts/run-v1-38-lean-baseline.sh", "--probe-launch-scope"], { cwd: resolve("."), env: { ...process.env, LEAN_BASELINE_LAUNCH_PROBE: "1", NODE_OPTIONS: "--trace-warnings", NODE_COMPILE_CACHE: "/tmp/leak", NODE_REDIRECT_WARNINGS: "/tmp/leak", NODE_V8_COVERAGE: "/tmp/leak" }, encoding: "utf8", timeout: 10_000 })
    expect(output).toContain("cache=1 compile=1")
    expect(output).toContain("node_options=unset compile_cache=unset warnings=unset coverage=unset core=0")
    expect(output).toContain("lean-baseline-20261004-v1-tmp")
  })
})
