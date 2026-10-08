/** Diagnosis-only trusted HOST fixture. No real fork, store, Strategy or Match. */
import { afterEach, describe, expect, it, vi } from "vitest"
import { EventEmitter } from "node:events"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as parent from "./run-v1-38-lean-baseline.js"

type Mode = "clean" | "queued-exit-rss" | "observed-exit-rss" | "live-rss" | "parent-rss" | "accounting" | "reserve" | "threshold-kill"
const host = vi.hoisted(() => ({ child: null as any, allocation: null as any, entry: null as any, terminal: null as any, files: new Map<string, Uint8Array>(), order: [] as string[], mode: "clean" as Mode, samples: 0, elapsed: 0, thrown: false, gone: false }))
const syntheticError = () => new Error("SYNTHETIC_PRIVATE_SENTINEL")

vi.mock("node:child_process", async original => {
  const actual = await original<typeof import("node:child_process")>()
  return { ...actual, fork: () => { if (!host.child) throw syntheticError(); return host.child }, execFileSync: (command: string, args: string[]) => {
    if (command === "git") return args[0] === "show" ? lean.leanCanonicalBytes(host.allocation) : "a".repeat(40)
    if (command !== "ps") throw syntheticError()
    host.samples++; host.order.push("child_rss")
    if (host.samples > 1 && (host.mode === "queued-exit-rss" || host.mode === "observed-exit-rss" || host.mode === "live-rss")) {
      if (host.mode === "queued-exit-rss") {
        host.gone = true; host.order.push("os_clean_exit_queued")
        Promise.resolve().then(() => { host.child.exitCode = 0; host.order.push("exit_event"); host.child.emit("exit", 0, null) })
      }
      if (host.mode === "observed-exit-rss") { host.child.exitCode = 0; host.order.push("exit_event"); host.child.emit("exit", 0, null) }
      throw syntheticError()
    }
    return "100"
  } }
})
vi.mock("node:fs", async original => {
  const actual = await original<typeof import("node:fs")>()
  return { ...actual, readdirSync: () => [], statfsSync: () => ({ bavail: 100000000000n, bsize: 1n }), openSync: (path: string) => {
    const name = path.split("/").at(-1)!; host.files.set(name, new Uint8Array()); return name
  }, fsyncSync: () => undefined, closeSync: () => undefined }
})
vi.mock("./run-v1-38-lean-experiment.js", async original => {
  const actual = await original<typeof import("./run-v1-38-lean-experiment.js")>()
  return { ...actual, readLeanSafeFile: (path: string) => path.endsWith("allocation.json") ? lean.leanCanonicalBytes(host.allocation) : path.endsWith("entry.json") ? lean.leanCanonicalBytes(host.entry) : Buffer.from("synthetic-request") }
})
vi.mock("../packages/strategy-lab/src/league/lean-experiment.js", async original => {
  const actual = await original<typeof import("../packages/strategy-lab/src/league/lean-experiment.js")>()
  return { ...actual, readLeanLedger: () => ({ events: [] }), readLeanTimeAccounting: () => ({ active: false, starts: new Map() }), cumulativeLeanPhysicalBytes: () => 100,
    currentLeanElapsedMs: () => { host.order.push("accounting"); if (host.mode === "accounting" && host.samples > 1) throw syntheticError(); return host.elapsed },
    assertLeanPublicationCapacity: () => undefined, writeLeanAll: (fd: string, bytes: Uint8Array) => host.files.set(fd, bytes),
    publishLeanChildEntry: (_ledger: unknown, entry: unknown) => { host.entry = entry }, beginLeanInterval: () => undefined,
    deriveLeanChildTerminal: (_ledger: unknown, _entry: unknown, observation: unknown) => observation,
    publishLeanChildTerminal: (_ledger: unknown, terminal: unknown) => { host.terminal = terminal },
  }
})

const root = (name: string) => labRoot("synthetic-supervisor-repro", name)
const retryAllocation = () => {
  const extension = lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION
  const predecessor = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 30, elapsedUpperBoundMs: extension.priorElapsedMs, allocatedDiskBytes: 13_000_000, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: root("history"), survivors: [{ identity: ".strategy-lab/synthetic-not-created", allocatedBytes: 4096 }] }
  return lean.createLeanSupervisorCorrectionAllocation({ timeboxExtension: extension, sourceRoot: root("source"), reviewRoot: root("review"), coldRoot: root("cold"), planRoot: lean.LEAN_RETRY_V8_PLAN_ROOT, seed: "synthetic-timebox", candidateRoots: [root("a"), root("b")], requestRoots: Array.from({ length: 36 }, (_, n) => root(`request-${n}`)), route: "baseline", reuseGrantRoot: root("reuse"), supervisorDecisionRoot: lean.LEAN_RETRY_V8_APPROVAL_ROOT, acceptedCheckRoot: root("check"), acceptedReaderCloseRoot: root("final"), requestBytesRoot: root("request"), dataReviewRoot: root("data"), setupAccountingRoot: root("setup"), startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, attemptOrdinal: 1, priorClosureRoot: null, continuationRoot: null, predecessor: { ...predecessor, root: labRoot(predecessor.schemaVersion, predecessor) } }, 8)
}
const retestAllocation = () => {
  const extension = lean.LEAN_SUPERVISOR_RETEST_V12_EXTENSION
  const p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 35, elapsedUpperBoundMs: extension.priorElapsedMs, allocatedDiskBytes: extension.physicalFloorBytes, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: root("history"), survivors: Array.from({ length: 661 }, (_, n) => ({ identity: `.strategy-lab/synthetic-v12-not-created-${n}`, allocatedBytes: n === 0 ? extension.physicalFloorBytes : 0 })) }
  return lean.createLeanSupervisorCorrectionAllocation({ timeboxExtension: extension, sourceRoot: root("source"), reviewRoot: root("review"), coldRoot: root("cold"), planRoot: extension.planRoot, seed: "synthetic-v12", candidateRoots: [root("a"), root("b")], requestRoots: Array.from({ length: 36 }, (_, n) => root(`v12-request-${n}`)), route: "baseline", reuseGrantRoot: root("reuse"), supervisorDecisionRoot: extension.approvalRoot, acceptedCheckRoot: root("check"), acceptedReaderCloseRoot: root("final"), requestBytesRoot: root("request"), dataReviewRoot: root("data"), setupAccountingRoot: root("setup"), startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, attemptOrdinal: 1, priorClosureRoot: root("history-carry"), continuationRoot: root("continuation"), predecessor: { ...p, root: labRoot(p.schemaVersion, p) } }, 8)
}
const begin = async (mode: Mode, v12 = false, deadlineFixture = false) => {
  vi.useFakeTimers()
  const timers = deadlineFixture ? vi.spyOn(globalThis, "setTimeout") : null
  const input = { seed: "synthetic-parent", sourceRoot: root("source"), planRoot: root("plan"), coldRoot: root("cold") }
  const predecessor = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 11, elapsedUpperBoundMs: 3_319_046, allocatedDiskBytes: 0, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: root("history"), survivors: [{ identity: ".strategy-lab/synthetic-not-created", allocatedBytes: 0 }] }
  const allocation = v12 ? retestAllocation() : mode === "reserve" ? retryAllocation() : lean.createLeanCorrectionAllocation({ ...input, reviewRoot: root("review"), candidateRoots: parent.deriveLeanBaselineCandidateRoots(input.coldRoot), requestRoots: parent.deriveLeanBaselineRequestRoots(input), route: "baseline", reuseGrantRoot: root("reuse"), diagnosisRoot: root("diagnosis"), predecessor: { ...predecessor, root: labRoot(predecessor.schemaVersion, predecessor) } })
  Object.assign(host, { allocation, entry: null, terminal: null, files: new Map(), order: [], mode, samples: 0, elapsed: mode === "reserve" ? 60_000_000 : 0, thrown: false, gone: false })
  const child = Object.assign(new EventEmitter(), { pid: process.pid + 1000, exitCode: null as number | null, signalCode: null as string | null, kills: [] as string[], send: () => true,
    kill(signal: string) {
      this.kills.push(signal); host.order.push("kill")
      if (mode === "threshold-kill" && !host.thrown) { host.thrown = true; throw syntheticError() }
      return !host.gone
    },
  })
  host.child = child
  vi.spyOn(process, "memoryUsage").mockImplementation(() => {
    host.order.push("parent_rss")
    if (mode === "parent-rss" && host.samples > 1 && !host.thrown) { host.thrown = true; throw syntheticError() }
    return { rss: mode === "threshold-kill" && host.samples > 1 ? lean.LEAN_CAPS.scratchBytes : 10_000_000, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 }
  })
  const settled = parent.runLeanBoundedParent({ ledger: { allocation } as lean.LeanExperimentLedger, store: "/synthetic-no-store", requestPath: "/synthetic/request.json", allocationPath: "/synthetic/allocation.json", sourceRoot: root("source"), manifestRoot: () => root("source"), childMode: "synthetic-never-forked", ...(v12 ? {} : { supervisorObservation: true as const }) }).then(value => ({ value, rejected: false }), () => ({ value: null, rejected: true }))
  child.emit("message", { ready: child.pid })
  await Promise.resolve(); await Promise.resolve()
  expect(host.entry).not.toBeNull()
  return { child, settled, timers }
}
const exit = () => { host.child.exitCode = 0; host.order.push("exit_event"); host.child.emit("exit", 0, null) }
const reason = () => parent.validateLeanSupervisorReasonBytes(host.files.get(parent.LEAN_SUPERVISOR_REASON_FILE)!)
const failure = async (mode: Exclude<Mode, "clean">) => {
  const run = await begin(mode)
  if (mode === "reserve") host.elapsed = 70_140_000
  await vi.advanceTimersByTimeAsync(250)
  if (mode !== "queued-exit-rss") exit()
  expect((await run.settled).rejected).toBe(true)
  expect(host.terminal).toMatchObject({ status: "child_failed", exitCode: 0, signal: null })
  const retained = reason()
  expect(retained.uncertain).toBe(true)
  expect(retained.reasons).toContain("resource_sampling_exception")
  expect(retained.observations).toMatchObject({ resourceSampling: "exception", initiatingCause: "unknown", terminalization: "unobserved" })
  expect(Buffer.from(host.files.get(parent.LEAN_SUPERVISOR_REASON_FILE)!).toString()).not.toContain("SYNTHETIC_PRIVATE_SENTINEL")
  return retained
}
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

describe("current synthetic supervisor failure mechanism", () => {
  it("clean control remains pending independent verification, not accepted", async () => {
    const run = await begin("clean"); await vi.advanceTimersByTimeAsync(250); exit()
    expect((await run.settled).value).toMatchObject({ issued: false, status: "child_exited_pending_independent_verification" })
    expect(host.terminal.status).toBe("child_exited"); expect(reason().reasons).toEqual([])
    expect(run.child.kills).toEqual([])
  })
  it("queued clean exit during synchronous RSS failure produces sticky child_failed", async () => {
    await failure("queued-exit-rss")
    expect(host.order.indexOf("os_clean_exit_queued")).toBeLessThan(host.order.indexOf("kill"))
    expect(host.order.indexOf("kill")).toBeLessThan(host.order.indexOf("exit_event"))
    expect(host.child.kills).toEqual(["SIGKILL"])
    expect(host.terminal.childRssObservedBytes).toBe(102400)
  })
  it.each(["live-rss", "parent-rss", "accounting", "reserve", "threshold-kill"] as const)("%s remains failed after later clean exit", async mode => {
    await failure(mode)
    expect(host.child.kills).toEqual(mode === "threshold-kill" ? ["SIGKILL", "SIGKILL"] : ["SIGKILL"])
    if (mode === "threshold-kill") expect(reason().reasons).toEqual(["resource_threshold", "resource_sampling_exception"])
    else expect(reason().reasons).toEqual(["resource_sampling_exception"])
  })
  it("legacy opt-in stays reason-v1 with no attribution fields", async () => {
    const retained = await failure("queued-exit-rss")
    expect(retained.schemaVersion).toBe("lean-parent-supervisor-reasons-v1")
    expect(retained.observations).not.toHaveProperty("resourceSamplingOperation")
  })
  it.each([
    ["queued-exit-rss", "child_rss", 1], ["live-rss", "child_rss", 1],
    ["parent-rss", "parent_rss", 2], ["accounting", "time_budget", 3],
    ["reserve", "time_budget", 3], ["threshold-kill", "threshold_kill", 3],
  ] as const)("v12 %s records first finite operation without success exemption", async (mode, operation, sequence) => {
    const run = await begin(mode, true)
    if (mode === "reserve") host.elapsed = lean.LEAN_SUPERVISOR_RETEST_V12_EXTENSION.elapsedMs - 1_860_000
    await vi.advanceTimersByTimeAsync(250)
    // Repeated throws must never replace first provenance.
    if (mode === "live-rss") await vi.advanceTimersByTimeAsync(250)
    if (mode !== "queued-exit-rss") exit()
    expect((await run.settled).rejected).toBe(true)
    expect(host.terminal).toMatchObject({ status: "child_failed", exitCode: 0 })
    const bytes = host.files.get(parent.LEAN_SUPERVISOR_REASON_FILE)!
    const retained = parent.validateLeanSupervisorReasonBytesV2(bytes)
    expect(retained.observations).toMatchObject({ resourceSampling: "exception", resourceSamplingOperation: operation, resourceSamplingSequence: sequence, resourceSamplingExitObserved: false, initiatingCause: "unknown" })
    expect(retained.uncertain).toBe(true)
    expect(() => parent.validateLeanSupervisorReasonBytes(bytes)).toThrow()
    expect(Buffer.from(bytes).toString()).not.toContain("SYNTHETIC_PRIVATE_SENTINEL")
  })
  it("v12 clean control and deadline keep zero/none attribution", async () => {
    for (const deadline of [false, true]) {
      const run = await begin("clean", true, deadline)
      if (deadline) (run.timers!.mock.calls.find(call => call[1] === lean.LEAN_SUPERVISOR_RETEST_V12_EXTENSION.elapsedMs)![0] as () => void)()
      else await vi.advanceTimersByTimeAsync(250)
      exit()
      expect((await run.settled).rejected).toBe(deadline)
      const retained = parent.validateLeanSupervisorReasonBytesV2(host.files.get(parent.LEAN_SUPERVISOR_REASON_FILE)!)
      expect(retained.observations).toMatchObject({ resourceSamplingOperation: "none", resourceSamplingSequence: 0, resourceSamplingExitObserved: false })
      expect(retained.reasons).toEqual(deadline ? ["deadline_timeout"] : [])
      run.timers?.mockRestore()
    }
  })
  it("v12 records an actually delivered exit event without clearing failure", async () => {
    const run = await begin("observed-exit-rss", true)
    await vi.advanceTimersByTimeAsync(250)
    expect((await run.settled).rejected).toBe(true)
    expect(host.terminal.status).toBe("child_failed")
    expect(parent.validateLeanSupervisorReasonBytesV2(host.files.get(parent.LEAN_SUPERVISOR_REASON_FILE)!).observations).toMatchObject({ resourceSamplingOperation: "child_rss", resourceSamplingSequence: 1, resourceSamplingExitObserved: true })
  })
})
