import { afterEach, describe, expect, it, vi } from "vitest"
import { EventEmitter } from "node:events"
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { currentBaselineSlotKind, createLeanCorrectionAllocation, createLeanCurrentBaselineAllocation, leanCanonicalBytes, leanBytesRoot, LEAN_CAPS, LEAN_CLOSED_V7, type LeanExperimentLedger } from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as parentApi from "./run-v1-38-lean-baseline.js"
import { admitsLeanBaselineReviewAgents, assertLeanBaselineWritableScope, deriveLeanBaselineCandidateRoots, deriveLeanBaselineRequestRoots, leanBaselinePair, leanBaselineSourceManifest, parseLeanBaselineCommand } from "./run-v1-38-lean-baseline.js"
import { leanBaselineMatchSeed } from "./lib/v1-38-lean-baseline-match.js"
import * as continuationMatch from "./lib/v1-38-lean-baseline-match.js"
import { validateLeanPreparationContinuationReasonJoinV13 } from "./lib/v1-38-lean-correction-retained.js"
import { assertLeanSupervisorReasonCustodyV2 } from "./lib/v1-38-lean-baseline-retained.js"
import * as continuationRetainedReader from "./lib/v1-38-lean-baseline-retained.js"
import * as childTerminal from "./lib/v1-38-lean-child-cli-terminal.js"

const root = (name: string) => labRoot("baseline-cli-test", name)
const ownMessageKind = (value: unknown) => value && typeof value === "object" && "armRelease" in value ? "armRelease" : "release"
it.each(["wrongPID", "wrongnonce", "unsolicited"] as const)("continuation-startup-repair-A-parent-negative rejects real parent acknowledgement: %s", async mode => {
  // Actual parent coordinator and child wait state machines. Only transport,
  // PID observations and the timer clock are inert; no subprocess or authority.
  vi.useFakeTimers()
  const deadline = Date.now() + 60000, fullGuard = vi.fn(), provider = vi.fn()
  let nonce: string | undefined
  const host = Object.assign(new EventEmitter(), { pid: 123, ppid: 122, connected: true, send: vi.fn((value: unknown) => {
    if (value && typeof value === "object" && "releaseArmed" in value && "nonce" in value) {
      nonce = String(value.nonce)
      child.emit("message", { releaseArmed: mode === "wrongPID" ? 124 : 123, nonce: mode === "wrongnonce" ? `${nonce[0] === "0" ? "1" : "0"}${nonce.slice(1)}` : nonce })
    } else child.emit("message", value)
    return true
  }) })
  const child = Object.assign(new EventEmitter(), { pid: 123, connected: true, exitCode: null as number | null, signalCode: null as NodeJS.Signals | null,
    send: vi.fn((value: unknown) => { if (ownMessageKind(value) === "release") provider(); host.emit("message", value); return true }),
    kill: vi.fn(() => { child.connected = false; child.signalCode = "SIGKILL"; host.connected = false; host.emit("disconnect"); child.emit("exit", null, "SIGKILL"); return true }),
  })
  const parent = parentApi.coordinateLeanContinuationParentV8(child as unknown as ReturnType<typeof childProcess.fork>, deadline, fullGuard)
  const token = parentApi.waitLeanContinuationReleaseV8(() => {}, host)
  void token.catch(() => {})
  try {
    await parent.ready
    if (mode === "unsolicited") child.emit("message", { releaseArmed: child.pid, nonce: "a".repeat(64) })
    const release = parent.arm().then(() => child.send({ release: "c".repeat(64) }))
    await expect(release).rejects.toThrow(/HANDSHAKE|PARENT_LOST/)
    await expect(token).rejects.toThrow(/HANDSHAKE|PARENT_LOST/)
    expect(child.kill).toHaveBeenCalledWith("SIGKILL"); expect(provider).not.toHaveBeenCalled()
    expect(child.send.mock.calls.some(([message]) => ownMessageKind(message) === "release")).toBe(false)
    expect(child.send).toHaveBeenCalledTimes(mode === "unsolicited" ? 0 : 1)
    if (mode !== "unsolicited") { expect(nonce).toMatch(/^[a-f0-9]{64}$/u); expect(fullGuard).toHaveBeenCalled() }
    const late = { releaseArmed: child.pid, nonce: nonce ?? "a".repeat(64) }
    child.emit("message", late)
    expect(parent.acceptsControl(late)).toBe(false)
    expect(() => parent.check(false)).toThrow(/HANDSHAKE|PARENT_LOST/)
    expect(provider).not.toHaveBeenCalled()
  } finally {
    parent.close(); host.emit("disconnect"); await token.catch(() => {})
    for (const event of ["message", "exit", "error", "disconnect"]) expect(child.listenerCount(event)).toBe(0)
    for (const event of ["message", "disconnect"]) expect(host.listenerCount(event)).toBe(0)
    expect(vi.getTimerCount()).toBe(0); vi.useRealTimers()
  }
})
it.each(["release", "disconnect", "absolute-expiry"] as const)("continuation-startup-repair-A-CR01 delayed acknowledgement crosses real poll without full armed guards: %s", async mode => {
  // Real coordinator timers and control parsing; only transport/PIDs and the
  // absolute wall clock are synthetic. No subprocess, provider or private data.
  const anchor = 1_800_000_000_000, deadline = anchor + 60000
  let now = anchor, armed = false, released = false, armedGuards = 0
  const clock = vi.spyOn(Date, "now").mockImplementation(() => now), fullGuard = vi.fn(() => { if (armed && !released) armedGuards++ })
  const timers: ReturnType<typeof setTimeout>[] = []
  const host = Object.assign(new EventEmitter(), { pid: 123, ppid: 122, connected: true, send: vi.fn((value: unknown) => {
    if (value && typeof value === "object" && "releaseArmed" in value) timers.push(setTimeout(() => child.emit("message", value), 350))
    else child.emit("message", value)
    return true
  }) })
  const child = Object.assign(new EventEmitter(), { pid: 123, connected: true, exitCode: null, signalCode: null, send: vi.fn((value: unknown) => {
    if (ownMessageKind(value) === "armRelease") armed = true
    else released = true
    host.emit("message", value); return true
  }), kill: vi.fn(() => { host.connected = false; host.emit("disconnect"); return true }) })
  const parent = parentApi.coordinateLeanContinuationParentV8(child as unknown as ReturnType<typeof childProcess.fork>, deadline, fullGuard)
  const token = parentApi.waitLeanContinuationReleaseV8(() => { if (now >= deadline) throw new Error("SYNTHETIC_ABSOLUTE_EXPIRY") }, host)
  void token.catch(() => {})
  try {
    await parent.ready
    const stagingGuards = fullGuard.mock.calls.length, action = parent.arm()
    void action.catch(() => {})
    expect(fullGuard).toHaveBeenCalledTimes(stagingGuards + 1)
    if (mode !== "release") timers.push(setTimeout(() => {
      if (mode === "absolute-expiry") now = deadline
      else { child.connected = false; child.emit("disconnect") }
    }, 275))
    if (mode === "release") {
      await action
      expect(armedGuards).toBe(0)
      expect(fullGuard).toHaveBeenCalledTimes(stagingGuards + 1)
      child.send({ release: "c".repeat(64) })
      await expect(token).resolves.toBe("c".repeat(64))
      // Post-release periodic full supervision remains active.
      await new Promise<void>(done => timers.push(setTimeout(done, 275)))
      expect(fullGuard.mock.calls.length).toBeGreaterThan(stagingGuards + 1)
      expect(child.kill).not.toHaveBeenCalled()
    } else {
      await expect(action).rejects.toThrow(/HANDSHAKE|PARENT_LOST/)
      await expect(token).rejects.toThrow(/HANDSHAKE|PARENT_LOST/)
      expect(armedGuards).toBe(0)
      expect(child.kill).toHaveBeenCalledWith("SIGKILL")
      expect(released).toBe(false)
    }
  } finally { parent.close(); for (const timer of timers) clearTimeout(timer); host.emit("disconnect"); await token.catch(() => {}); clock.mockRestore() }
})
it.each(["continuation-startup-repair-A", "continuation-route-v9-driver-startup"])("%s child arms once after slow staging and expires at exactly 30000ms", async () => {
  vi.useFakeTimers()
  const host = Object.assign(new EventEmitter(), { pid: 123, ppid: 122, connected: true, send: vi.fn() })
  const check = vi.fn()
  try {
    const action = parentApi.waitLeanContinuationReleaseV8(check, host)
    const refusal = expect(action).rejects.toThrow(/HANDSHAKE/)
    await vi.advanceTimersByTimeAsync(45000)
    expect(host.send).toHaveBeenCalledExactlyOnceWith({ ready: 123 })
    host.emit("message", { armRelease: "a".repeat(64) })
    expect(host.send).toHaveBeenLastCalledWith({ releaseArmed: 123, nonce: "a".repeat(64) })
    await vi.advanceTimersByTimeAsync(29999)
    expect(host.listenerCount("message")).toBe(1)
    await vi.advanceTimersByTimeAsync(1)
    await refusal
    expect(host.listenerCount("message")).toBe(0); expect(host.listenerCount("disconnect")).toBe(0)
  } finally { vi.useRealTimers() }
})
it.each(["duplicate", "release-before-arm", "extra", "getter", "proxy", "disconnect", "expired", "valid"].flatMap(mode => ["continuation-startup-repair-A", "continuation-route-v9-driver-startup"].map(tag => ({ mode, tag }))))("$tag finite control state and absolute frontier: $mode", async ({ mode }) => {
  vi.useFakeTimers()
  const host = Object.assign(new EventEmitter(), { pid: 123, ppid: 122, connected: true, send: vi.fn() }), getter = vi.fn(() => "secret"), trap = vi.fn(), nonce = "b".repeat(64)
  let expired = false
  try {
    const action = parentApi.waitLeanContinuationReleaseV8(() => { if (expired) throw new Error("DO_NOT_PUBLISH") }, host)
    const outcome = mode === "valid" ? expect(action).resolves.toBe("c".repeat(64)) : expect(action).rejects.toThrow(/HANDSHAKE|PARENT_LOST/)
    if (mode === "release-before-arm") host.emit("message", { release: "c".repeat(64) })
    else if (mode === "extra") host.emit("message", { armRelease: nonce, extra: true })
    else if (mode === "getter") host.emit("message", Object.defineProperty({}, "armRelease", { get: getter }))
    else if (mode === "proxy") host.emit("message", new Proxy({}, { ownKeys: trap }))
    else if (mode === "disconnect") { host.connected = false; host.emit("disconnect") }
    else if (mode === "expired") { expired = true; await vi.advanceTimersByTimeAsync(250) }
    else { host.emit("message", { armRelease: nonce }); host.emit("message", mode === "duplicate" ? { armRelease: nonce } : { release: "c".repeat(64) }) }
    await outcome
    expect(getter).not.toHaveBeenCalled(); expect(trap).not.toHaveBeenCalled(); expect(host.listenerCount("message")).toBe(0); expect(vi.getTimerCount()).toBe(0)
  } finally { vi.useRealTimers() }
})
it.each(["timeout", "disconnect", "spoof", "getter", "proxy", "success", "send-throw", "send-hang"] as const)("continuation-startup-repair-B owned terminal provenance and bounded cleanup: %s", async mode => {
  vi.useFakeTimers()
  const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true), getter = vi.fn(() => "LEAN_CONTINUATION_HANDSHAKE"), trap = vi.fn()
  const host = Object.assign(new EventEmitter(), { pid: 123, ppid: 122, connected: true, send: vi.fn() })
  const child = { connected: true, exitCode: undefined as number | undefined, disconnect: vi.fn(() => { child.connected = false }), send: vi.fn((_: unknown, done?: (error: Error | null) => void) => { if (mode === "send-throw") throw new Error("secret"); if (mode !== "send-hang") done?.(null); return true }) }
  try {
    let action: Promise<unknown>
    if (mode === "timeout" || mode === "disconnect") {
      action = parentApi.waitLeanContinuationReleaseV8(() => {}, host)
    } else if (mode === "success") action = Promise.resolve()
    else action = Promise.reject(mode === "getter" ? Object.defineProperty({}, "message", { get: getter }) : mode === "proxy" ? new Proxy({}, { ownKeys: trap, get: trap }) : new TypeError("LEAN_CONTINUATION_HANDSHAKE"))
    void action.catch(() => {})
    const terminal = parentApi.resolveLeanContinuationChildCliTerminalV2(action, child)
    if (mode === "disconnect") { host.connected = false; host.emit("disconnect") }
    if (mode === "timeout") { host.emit("message", { armRelease: "a".repeat(64) }); await vi.advanceTimersByTimeAsync(30000) }
    await vi.advanceTimersByTimeAsync(251); await terminal
    expect(child.exitCode).toBe(mode === "success" ? 0 : 1); expect(child.disconnect).toHaveBeenCalledTimes(1)
    if (mode !== "success") { expect(child.send.mock.calls[0]![0]).toEqual({ type: "lean-child-failure", schemaVersion: "lean-child-failure-v1", code: mode === "timeout" ? "HANDSHAKE" : mode === "disconnect" ? "PARENT_LOST" : "UNKNOWN_INTERNAL_FAILURE", stage: mode === "timeout" || mode === "disconnect" ? "handshake" : "unknown" }); expect(childTerminal.isLeanChildFailureReceipt(child.send.mock.calls[0]![0])).toBe(true) }
    expect(getter).not.toHaveBeenCalled(); expect(trap).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0)
  } finally { stderr.mockRestore(); vi.useRealTimers() }
})
it("continuation-startup-repair-B trusted errors are one-use; clones and legacy stay distinct", async () => {
  const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true), host = Object.assign(new EventEmitter(), { pid: 123, ppid: 122, connected: true, send: vi.fn() })
  try {
    const action = parentApi.waitLeanContinuationReleaseV8(() => {}, host), captured = action.catch(error => error)
    host.emit("disconnect"); const error: unknown = await captured
    for (const [value, expected] of [[error, "PARENT_LOST"], [error, "UNKNOWN_INTERNAL_FAILURE"], [new TypeError("LEAN_CONTINUATION_PARENT_LOST"), "UNKNOWN_INTERNAL_FAILURE"], ["LEAN_CONTINUATION_PARENT_LOST", "UNKNOWN_INTERNAL_FAILURE"]] as const) {
      const child = { connected: true, exitCode: 0, disconnect: vi.fn(), send: vi.fn((_: unknown, done?: (e: Error | null) => void) => { done?.(null); return true }) }
      await parentApi.resolveLeanContinuationChildCliTerminalV2(Promise.reject(value), child)
      expect(child.send.mock.calls[0]![0]).toMatchObject({ code: expected })
    }
    const legacy = { connected: true, exitCode: 0, disconnect: vi.fn(), send: vi.fn((_: unknown, done?: (e: Error | null) => void) => { done?.(null); return true }) }
    await childTerminal.resolveLeanChildCliTerminal(Promise.reject(new TypeError("LEAN_PILOT_HANDSHAKE")), legacy)
    expect(legacy.send.mock.calls[0]![0]).toMatchObject({ code: "HANDSHAKE", stage: "unknown" })
  } finally { stderr.mockRestore() }
})
import * as continuationGit from "./lib/v1-38-lean-container-match-session.js"
import * as fs from "node:fs"
import * as childProcess from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as leagueHost from "./run-v1-38-serious-league.js"
import * as continuationHelper from "./lib/v1-38-lean-baseline-continuation.js"
import * as factoryImplementation from "./v1-38-factory-implementation.js"
import * as contracts from "../packages/strategy-lab/src/contracts.js"
import * as continuationAuthority from "./lib/v1-38-lean-experiment-authority.js"
import * as continuationSource from "./lib/v1-38-lean-baseline-source.js"
import { leanColdProcedureRoot } from "./lib/v1-38-lean-baseline-pipeline.js"
import { checkFactoryBoundaries } from "./check-v1-38-factory-boundaries.js"

it.each(["unrelated", "A", "B"] as const)("continuation-boundary-v8-P-cost real sampler/local two-target reservations near cap: %s (public zero bytes; external clock/resources mocked)", point => {
  const dir = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "v8-public-cost-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir), p = lean.LEAN_BASELINE_CONTINUATION_PATHS_V8
  const anchor = 1792093334001, carryMs = lean.leanContinuationGlobalFloorV2(anchor), body = { schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const, grantId: "synthetic-cost-only", approvalEvidence: { humanDecisionId: "human-approval-observed-20261015T194214Z", recordedBy: "synthetic-root" }, approvedAtMs: 1792093334000, anchorMs: anchor, deadlineMs: anchor + 28800000, carryMs, capMs: carryMs + 28800000, durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace: "20261015-v8" as const, reviewedSourceHead: "a".repeat(40), sourceRoot: root("synthetic-cost-source"), sourceGateRoot: root("synthetic-cost-gate"), planRoot: root("synthetic-cost-plan"), runOperator: "synthetic-runner", readerOperator: "synthetic-reader" }, window = lean.validateLeanBaselineContinuationWindowV2({ ...body, root: labRoot(body.schemaVersion, body) })
  const clock = vi.spyOn(Date, "now").mockReturnValue(anchor), disk = vi.spyOn(fs, "statfsSync").mockReturnValue({ bavail: 100000000000n, bsize: 1n } as never), usage = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...process.memoryUsage(), rss: 100000000, arrayBuffers: 0 }), available = vi.spyOn(leagueHost, "observeLeagueAvailableMemoryBytes").mockReturnValue(4000000000)
  const ipc = { send: Object.getOwnPropertyDescriptor(process, "send"), connected: Object.getOwnPropertyDescriptor(process, "connected") }
  Object.defineProperty(process, "send", { value: undefined, configurable: true }); Object.defineProperty(process, "connected", { value: false, configurable: true })
  try {
    fs.mkdirSync(resolve(".strategy-lab"), { mode: 0o700 }); fs.mkdirSync(resolve(".planning/artifacts"), { recursive: true })
    const write = (path: string, size: number, mode = 0o600) => fs.writeFileSync(resolve(path), Buffer.alloc(size), { mode })
    for (const [old, sizes] of [[lean.LEAN_BASELINE_CONTINUATION_PATHS_V2, [935, 4041]], [lean.LEAN_BASELINE_CONTINUATION_PATHS_V6, [929, 4047]]] as const) { write(old.window, sizes[0]); write(old.request, sizes[1]) }
    for (const [old, sizes] of [[lean.LEAN_BASELINE_CONTINUATION_PATHS_V4, [935, 4056, 17366, 746080, 146345, 208491, 1002]], [lean.LEAN_BASELINE_CONTINUATION_PATHS_V5, [929, 4051, 17360, 749813, 146600, 208495, 1234]], [lean.LEAN_BASELINE_CONTINUATION_PATHS_V7, [929, 4040, 17352, 754167, 146961, 208476, 1002]]] as const) {
      fs.mkdirSync(resolve(old.store), { mode: 0o700 }); fs.mkdirSync(resolve(old.temp), { mode: 0o700 }); write(old.window, sizes[0]); write(old.request, sizes[1]); write(old.allocation, sizes[2], 0o644); write(old.claim, sizes[6])
      for (const [name, size] of [["allocation.json", sizes[2]], ["carry.json", sizes[3]], ["source-hold.json", sizes[4]], ["source-manifest.json", sizes[5]], ["ledger.ndjson", 0], ["time.ndjson", 0]] as const) write(join(old.store, name), size)
    }
    fs.mkdirSync(resolve(p.store), { mode: 0o700 }); fs.mkdirSync(resolve(p.temp), { mode: 0o700 })
    const sampler = vi.spyOn(continuationHelper, "measureLeanContinuationKnownDisjointBytesV8"), floor = continuationHelper.LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V8 + continuationHelper.measureLeanContinuationKnownDisjointBytesV8(), owned = continuationHelper.createLeanContinuationOwnedMeasurementV8(window), initialOwned = owned().retainedBytes
    try {
      const local = parentApi.createLeanContinuationLocalReservationV8(window), metadata = 2 * 7 * 4194304 + 4 * 3 * 262144, baseline = floor + metadata + initialOwned, a = join(p.store, "initial-analysis.json"), b = join(p.store, "current-analysis.json"), unrelated = join(p.store, "response-work.json")
      expect(local.reserve().retainedBytes).toBe(baseline)
      local.reserveWrite(65536, a); expect(local.reserveWrite(98304, b).retainedBytes).toBe(baseline + 163840)
      write(unrelated, 32768); const unrelatedBlocks = fs.lstatSync(resolve(unrelated)).blocks * 512
      let expected = baseline + 163840 + unrelatedBlocks
      expect(local.reserve().retainedBytes).toBe(expected) // unrelated growth discharges NEITHER target
      if (point !== "unrelated") {
        write(a, 4096); expect(local.reserve().retainedBytes).toBe(expected) // only A's measured blocks overlap A
        local.completeWrite(a); expected -= 65536 - fs.lstatSync(resolve(a)).blocks * 512
        expect(local.reserve().retainedBytes).toBe(expected) // B remains fully outstanding
      }
      if (point === "B") {
        write(b, 8192); expect(local.reserve().retainedBytes).toBe(expected)
        local.completeWrite(b); expected -= 98304 - fs.lstatSync(resolve(b)).blocks * 512
        expect(local.reserve().retainedBytes).toBe(expected)
      }
      const effect = vi.fn()
      local.observeGrowth(LEAN_CAPS.retainedBytes - expected + 1)
      expect(() => { local.reserve(); effect() }).toThrow(/V8_RESERVATION_CAPACITY/)
      expect(effect).not.toHaveBeenCalled(); expect(() => local.reserve()).toThrow(/V8_RESERVATION_SCOPE/)
      expect(sampler).toHaveBeenCalledTimes(2)
    } finally { sampler.mockRestore() }
  } finally { for (const spy of [clock, disk, usage, available]) spy.mockRestore(); for (const [key, descriptor] of Object.entries(ipc)) { if (descriptor) Object.defineProperty(process, key, descriptor); else Reflect.deleteProperty(process, key) }; cwd.mockRestore(); fs.rmSync(dir, { recursive: true }) }
}, 15000)

describe("continuation-boundary-v8-Q", () => {
  it.each(["pass", "pin", "closing"] as const)("continuation-boundary-v8-Q post-match actual child callback retains before closing: %s (synthetic context/resources and inert Match, not custody)", async mode => {
    let window!: lean.LeanBaselineContinuationWindowV2
    preledgerFixtureV6(f => { window = f.window }, 0, false, "20261015-v8")
    const dir = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "v8-post-match-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir), clock = vi.spyOn(Date, "now").mockReturnValue(window.anchorMs), monotonic = vi.spyOn(process.hrtime, "bigint").mockReturnValue(process.hrtime.bigint())
    const disk = vi.spyOn(fs, "statfsSync").mockReturnValue({ bavail: 100000000000n, bsize: 1n } as never), usage = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...process.memoryUsage(), rss: 100000000, arrayBuffers: 0 }), available = vi.spyOn(leagueHost, "observeLeagueAvailableMemoryBytes").mockReturnValue(4000000000), known = vi.spyOn(continuationHelper, "measureLeanContinuationKnownDisjointBytesV8").mockReturnValue(4096)
    const provider = vi.spyOn(continuationMatch, "runLeanBaselineContinuationMatchV2")
    try {
      const pb = { schemaVersion: "lean-baseline-continuation-carry-v2" as const, chargedMatches: 50 as const, elapsedUpperBoundMs: 465187899, allocatedDiskBytes: 88924160, residualDiskBytes: 4096, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, originalCarryRoot: root("synthetic-original"), closedCapsuleRoot: root("synthetic-capsule"), custodyRoot: root("synthetic-custody"), inventoryRoot: root("synthetic-inventory"), qualifiedReaderAuthority: "cost_only" as const }
      const allocation = lean.createLeanBaselineContinuationAllocationV2({ sourceRoot: window.sourceRoot, reviewRoot: root("synthetic-review"), coldRoot: root("synthetic-cold"), planRoot: window.planRoot, candidateRoots: [root("a"), root("b")], requestRoots: Array.from({ length: 36 }, (_, i) => root(String(i))), seed: "synthetic-post-match", sourceHead: "b".repeat(40), planningRoot: root("synthetic-planning"), manifestRoot: root("synthetic-manifest"), requestBytesRoot: root("synthetic-request"), window, windowBytesRoot: leanBytesRoot(leanCanonicalBytes(window)), sourceGateRoot: window.sourceGateRoot, dataReviewRoot: root("synthetic-data"), predecessor: { ...pb, root: labRoot(pb.schemaVersion, pb) } })
      const paths = lean.LEAN_BASELINE_CONTINUATION_PATHS_V8
      fs.mkdirSync(resolve(".strategy-lab"), { mode: 0o700 }); fs.mkdirSync(resolve(paths.temp), { mode: 0o700 })
      const ledger = lean.createLeanLedger(resolve(paths.store), allocation), pin = join(dir, "fixed-source"), binding = Object.freeze({ synthetic: true }), order: string[] = []
      fs.writeFileSync(pin, "fixed source")
      const entry = { schemaVersion: "lean-child-entry-v2", allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot: allocation.requestBytesRoot, head: allocation.sourceHead, parentPid: process.ppid, childPid: process.pid, handshakeRoot: root("synthetic-handshake"), wallStartMs: window.anchorMs, monotonicStartNs: process.hrtime.bigint().toString() }
      fs.writeFileSync(join(ledger.directory, "entry.json"), leanCanonicalBytes(entry), { mode: 0o600 })
      lean.beginLeanInterval(ledger, "pilot-entry", window.anchorMs)
      const localReservation = parentApi.createLeanContinuationLocalReservationV8(window); localReservation.bindProgress(ledger)
      let finished = false, postBody = false
      const controller = continuationHelper.createLeanContinuationBoundaryControllerV8([{ path: pin, stat: fs.lstatSync(pin) }], [], [{ path: pin, role: "fixed_source" }], binding, () => { if (mode === "closing" && postBody) throw new Error("SYNTHETIC_POST_MATCH_CLOSING") }, bytes => { localReservation.reserve(bytes) })
      const checkpoint = (bytes = 0) => controller.reserve(binding, bytes)
      const assertRetained = () => {
        const state = lean.readLeanLedger(ledger), charge = state.charges.get(allocation.slots[0]!.root)!
        expect(state.charged).toBe(51); expect(state.terminals.has(charge.root)).toBe(true)
        expect(fs.existsSync(join(ledger.directory, `${charge.root.slice(7)}.gz`))).toBe(true)
        const observation = JSON.parse(fs.readFileSync(join(ledger.directory, "observation-0.json"), "utf8"))
        expect(observation.cell.slotRoot).toBe(allocation.slots[0]!.root)
        expect(JSON.parse(fs.readFileSync(join(ledger.directory, `diagnostic-${charge.root.slice(7)}.json`), "utf8"))).toEqual({ synthetic: "inert retained diagnostic" })
        expect(state.events.at(-1)?.kind).toBe("resource")
      }
      const fullSample = () => { if (finished) { assertRetained(); order.push("post-match-body"); postBody = true; if (mode === "pin") fs.writeFileSync(pin, "changed source") }; return { synthetic: "external full sample" } as unknown as ReturnType<ReturnType<typeof parentApi.openLeanBaselineContinuationContextV2>["fullSample"]> }
      const c = { allocation, paths, localReservation, fullSample, stage: <T>(kind: continuationHelper.LeanContinuationStageV6, body: () => T): T => { if (kind === "post_match") { assertRetained(); expect(finished).toBe(true); order.push("post-match-opening") }; return controller.withStage(binding, kind, body) }, startCell() { order.push("start-cell") }, finishCell() { assertRetained(); order.push("finish-cell"); finished = true } }
      const compact = { classification: "success" as const, code: "OK" as const, outcome: "DRAW" as const, elapsedMs: 10, cleanupComplete: true, invocationCount: 0, accountingRoot: root("accounting"), executionRoot: root("execution"), telemetry: { transitions: 0, events: 0 } }
      provider.mockImplementation(async input => { expect(lean.readLeanLedger(ledger).charges.get(input.slot.root)?.root).toBe(input.charge.root); order.push("inert-provider"); return { compact, replayFrames: [{ synthetic: "inert replay" }], diagnostic: { synthetic: "inert retained diagnostic" }, brainInputs: [], strategyInputs: [], trainingHalfPoints: 1, semanticRoot: root("semantic"), metrics: {}, decisionRoot: root("decision") } as never })
      const receipts: Parameters<typeof parentApi.createLeanContinuationChildDispatchV2>[5] = [], register = vi.fn(), unregister = vi.fn(), dispatch = parentApi.createLeanContinuationChildDispatchV2(ledger, c, { register, unregister }, paths, checkpoint, receipts)
      const source = { role: "synthetic", sourceRoot: root("source"), root: root("snapshot") } as Parameters<typeof dispatch>[1]
      const accepted = vi.fn(), action = dispatch(allocation.slots[0]!, source, source).then(accepted)
      if (mode === "pass") { await action; expect(accepted).toHaveBeenCalledOnce(); expect(receipts).toHaveLength(1) }
      else {
        await expect(action).rejects.toThrow(); expect(accepted).not.toHaveBeenCalled(); expect(receipts).toEqual([])
        const spent = fs.readFileSync(join(ledger.directory, "ledger.ndjson"))
        fs.writeFileSync(pin, "fixed source") // Restoring bytes cannot revive a failed controller.
        await expect(dispatch(allocation.slots[1]!, source, source)).rejects.toThrow(/V8_CONTEXT/)
        expect(() => checkpoint()).toThrow(/V8_CONTEXT/); expect(() => c.stage("charge", () => {})).toThrow(/V8_CONTEXT/)
        expect(fs.readFileSync(join(ledger.directory, "ledger.ndjson"))).toEqual(spent)
        expect(fs.existsSync(join(ledger.directory, "pair-1.json"))).toBe(false)
      }
      expect(provider).toHaveBeenCalledOnce(); expect(lean.readLeanLedger(ledger).charged).toBe(51); expect(lean.readLeanLedger(ledger).charges.size).toBe(1)
      expect(order).toEqual(["start-cell", "inert-provider", "finish-cell", "post-match-opening", "post-match-body"])
      expect(register).not.toHaveBeenCalled(); expect(unregister).not.toHaveBeenCalled()
      expect(fs.existsSync(join(ledger.directory, "result.json"))).toBe(false)
    } finally { for (const spy of [provider, known, available, usage, disk, monotonic, clock, cwd]) spy.mockRestore(); fs.rmSync(dir, { recursive: true }) }
  }, 15000)
  it("actual V8 strict preflight reaches real immutable-history anchor refusal with no setup (public cost observations mocked, not custody)", () => {
    const known = vi.spyOn(continuationHelper, "measureLeanContinuationKnownDisjointBytesV8").mockReturnValue(4096), send = Object.getOwnPropertyDescriptor(process, "send")
    Object.defineProperty(process, "send", { value: undefined, configurable: true })
    try { preledgerFixtureV6(f => { expect(() => parentApi.prepareLeanBaselineContinuationV2(lean.LEAN_BASELINE_CONTINUATION_PATHS_V8.request)).toThrow(/V2_ALLOCATION_ANCHOR/); expect(f.detail.physicalScans).toBe(0); expect(f.detail.journalReads).toBe(0); f.absent() }, 0, false, "20261015-v8") }
    finally { known.mockRestore(); if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send") }
  }, 15000)
  it("selects the exact approved CLI only and refuses unselected allocation even when manifest listed", () => {
    const p = lean.LEAN_BASELINE_CONTINUATION_PATHS_V8
    for (const mode of ["prepare-continuation-v2", "run-continuation-v2", "verify-continuation-v2"]) expect(parseLeanBaselineCommand([mode, "--request", p.request])).toEqual({ mode, request: p.request })
    expect(() => parseLeanBaselineCommand(["prepare-continuation-v2", "--request", p.request + ".other"])).toThrow()
    expect(() => continuationGit.readLeanBaselineContinuationGitV2(["show", "a".repeat(40) + ":" + p.allocation], [{ path: p.allocation, root: root("opaque") }])).toThrow(/METADATA/)
  })
  it("real closing charge refusal preserves durable charge and prevents provider entry", async () => {
    const charged: number[] = [], provider = vi.fn(), binding = Object.freeze({}); let failClosing = false
    const c = continuationHelper.createLeanContinuationBoundaryControllerV8([], [], [], binding, () => { if (failClosing) throw new Error("closing") }, () => {})
    await expect(parentApi.dispatchLeanContinuationChargedCellV6((stage, body) => c.withStage(binding, stage, body), () => { charged.push(1); failClosing = true; return 1 }, () => {}, provider)).rejects.toThrow("closing")
    expect(charged).toEqual([1]); expect(provider).not.toHaveBeenCalled(); expect(() => c.reserve(binding, 0)).toThrow()
  })
  it("reserves fresh local resources without re-entering source or admitted-ledger evidence", () => {
    expect(typeof parentApi.createLeanContinuationLocalReservationV8).toBe("function")
  })
  it("reserves fresh remaining reader closure from a bounded journal leaf before dependent effects", () => preledgerFixtureV6(f => {
    const p = lean.LEAN_BASELINE_CONTINUATION_PATHS_V8, known = vi.spyOn(continuationHelper, "measureLeanContinuationKnownDisjointBytesV8").mockReturnValue(4096), send = Object.getOwnPropertyDescriptor(process, "send")
    Object.defineProperty(process, "send", { value: undefined, configurable: true })
    try {
      fs.mkdirSync(resolve(p.store), { mode: 0o700 }); fs.mkdirSync(resolve(p.temp), { mode: 0o700 })
      const close = f.window.deadlineMs - 20 * 60000, rows = [{ kind: "start", id: "continuation-run-admission", atMs: f.window.anchorMs }, { kind: "close", id: "continuation-run-admission", atMs: f.window.anchorMs + 1 }, { kind: "start", id: "pilot-entry", atMs: close - 10 }, { kind: "close", id: "pilot-entry", atMs: close }]
      fs.writeFileSync(resolve(p.store, "time.ndjson"), rows.map(row => Buffer.from(leanCanonicalBytes(row)).toString() + "\n").join(""), { mode: 0o600 })
      vi.mocked(Date.now).mockReturnValue(close + 60000)
      const local = parentApi.createLeanContinuationLocalReservationV8(f.window, true)
      expect(() => local.reserve()).toThrow(/V8_RESERVATION_CAPACITY/)
      expect(() => local.reserve()).toThrow(/V8_RESERVATION_SCOPE/)
      fs.unlinkSync(resolve(p.store, "time.ndjson")); fs.rmdirSync(resolve(p.store)); fs.rmdirSync(resolve(p.temp))
    } finally { known.mockRestore(); if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send") }
  }, 0, false, "20261015-v8"), 15000)
})
it("continuation-boundary-v8-assay public construction, real inventory/controller/local reservation, streaming and cleanup", () => {
  const began = performance.now(), deadline = began + 15000, reports: Record<string, unknown>[] = []
  let aggregateBytes = 0, status = "COMPLETE", lastStage = "construction", cleanup = true
  const bounded = (bytes = 0) => { aggregateBytes += bytes; if (performance.now() >= deadline || aggregateBytes > 64 * 1024 * 1024) throw new Error("V8_ASSAY_CENSORED") }
  const send = Object.getOwnPropertyDescriptor(process, "send"), connected = Object.getOwnPropertyDescriptor(process, "connected")
  Object.defineProperty(process, "send", { value: undefined, configurable: true }); Object.defineProperty(process, "connected", { value: false, configurable: true })
  const known = vi.spyOn(continuationHelper, "measureLeanContinuationKnownDisjointBytesV8").mockReturnValue(4096)
  const usage = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...process.memoryUsage(), rss: 100000000, arrayBuffers: 0 }), available = vi.spyOn(leagueHost, "observeLeagueAvailableMemoryBytes").mockReturnValue(4000000000)
  let resources = 0, localChecks = 0
  const disk = vi.spyOn(fs, "statfsSync").mockImplementation(() => { resources++; return { bavail: 100000000000n, bsize: 1n } as never })
  const actualFstat = fs.fstatSync, descriptorChecks = vi.spyOn(fs, "fstatSync").mockImplementation(((...args: Parameters<typeof fs.fstatSync>) => { bounded(); localChecks++; return Reflect.apply(actualFstat, fs, args) }) as typeof fs.fstatSync)
  const physical = vi.spyOn(lean, "cumulativeLeanPhysicalBytes"), basis = vi.spyOn(lean, "leanAdmittedContinuationCapacityBasisV2")
  try {
    for (const scale of [2, 8]) {
      bounded(); const dir = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "public-continuation-boundary-v8-assay-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir)
      const anchor = 1792093334001, p = lean.LEAN_BASELINE_CONTINUATION_PATHS_V8, carryMs = lean.leanContinuationGlobalFloorV2(anchor)
      const body = { schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const, grantId: "public-synthetic-assay-not-authority", approvalEvidence: { humanDecisionId: "human-approval-observed-20261015T194214Z", recordedBy: "synthetic-root" }, approvedAtMs: 1792093334000, anchorMs: anchor, deadlineMs: anchor + 28800000, carryMs, capMs: carryMs + 28800000, durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace: "20261015-v8" as const, reviewedSourceHead: "a".repeat(40), sourceRoot: root("synthetic-assay"), sourceGateRoot: root("synthetic-gate"), planRoot: root("synthetic-plan"), runOperator: "synthetic-runner", readerOperator: "synthetic-reader" }, window = lean.validateLeanBaselineContinuationWindowV2({ ...body, root: labRoot(body.schemaVersion, body) })
      const clock = vi.spyOn(Date, "now").mockReturnValue(anchor), rows: continuationHelper.LeanContinuationReviewedRowV2[] = [], oid = new Map<string, string>()
      const beforeResources = resources, beforeLocal = localChecks; let fullChecks = 0, reserves = 0, openings = 0, closings = 0
      try {
        fs.mkdirSync(resolve(".strategy-lab"), { mode: 0o700 }); fs.mkdirSync(resolve(".planning/artifacts"), { recursive: true }); fs.mkdirSync(resolve("scripts"))
        for (let i = 0; i < scale; i++) {
          bounded(); const size = scale === 8 && i === 0 ? 4259840 : 65536; bounded(size)
          const bytes = Buffer.alloc(size, 65 + i), path = `scripts/public-synthetic-${i}.txt`
          fs.writeFileSync(resolve(path), bytes, { mode: 0o644 }); rows.push({ path, root: leanBytesRoot(bytes), commit: body.reviewedSourceHead, kind: "reviewed_source" }); oid.set(path, createHash("sha1").update(`blob ${size}\0`).update(bytes).digest("hex"))
        }
        const git = (args: readonly string[]) => { bounded(); const path = args[1]!.slice(41); return args[0] === "show" ? fs.readFileSync(resolve(path)) : Buffer.from(oid.get(path)!) }
        // Real default inventory importer, not the impossible fixed historical
        // capsule. Its synthetic reviewed roots are real, never digest-mapped.
        const inventory = continuationHelper.inventoryLeanContinuationSurvivorsV2([], rows, git, () => bounded())
        for (const path of [p.store, p.temp]) fs.mkdirSync(resolve(path), { mode: 0o700 })
        for (const [path, bytes] of [[p.window, leanCanonicalBytes(window)], [p.request, Buffer.from("public inert request")], [join(p.store, "time.ndjson"), Buffer.alloc(0)], [join(p.store, "initial-analysis.json"), leanCanonicalBytes({ publicSynthetic: true })]] as const) { bounded(bytes.length); fs.writeFileSync(resolve(path), bytes, { mode: 0o600 }) }
        const local = parentApi.createLeanContinuationLocalReservationV8(window), binding = Object.freeze({ publicSynthetic: true, scale }), paths = new Set(rows.map(row => row.path))
        const reserve = (bytes = 0) => { bounded(); reserves++; local.reserve(bytes) }
        const current = () => { bounded(); fullChecks++; for (const row of rows) { reserve(65536); continuationHelper.authenticateLeanContinuationPinnedSource(row, row.commit, paths, git, reserve) } }
        const controller = continuationHelper.createLeanContinuationBoundaryControllerV8(rows.map(row => ({ path: row.path, stat: fs.lstatSync(resolve(row.path)) })), inventory, rows.map(row => ({ path: row.path, role: "fixed_source" })), binding, current, reserve)
        for (const stage of ["bootstrap", "source", "archive"] as const) {
          lastStage = `${scale}:${stage}`; openings++
          controller.withStage(binding, stage, () => { for (let i = 0; i < scale * 2; i++) { bounded(); continuationHelper.readLeanContinuationJsonV2(join(p.store, "initial-analysis.json"), 65536, 0o600, bytes => controller.reserve(binding, bytes ?? 0)) } })
          closings++
        }
        const target = join(p.store, "current-analysis.json"); local.reserveWrite(65536, target); fs.writeFileSync(resolve(target), leanCanonicalBytes({ completed: true }), { mode: 0o600 }); bounded(fs.statSync(resolve(target)).size); local.completeWrite(target)
        expect(fullChecks).toBe(9); expect(openings).toBe(3); expect(closings).toBe(3); expect(inventory).toHaveLength(scale)
        reports.push({ scale, openings, closings, fullChecks, fullSourceAuthenticationPasses: fullChecks, reserves, localDescriptorChecks: localChecks - beforeLocal, freshResourceChecks: resources - beforeResources, defaultInventoryRows: inventory.length })
      } finally { clock.mockRestore(); cwd.mockRestore(); fs.rmSync(dir, { recursive: true }); cleanup &&= !fs.existsSync(dir); bounded() }
    }
    expect(physical).not.toHaveBeenCalled(); expect(basis).not.toHaveBeenCalled()
    expect(reports[0]!.fullChecks).toBe(reports[1]!.fullChecks); expect(Number(reports[1]!.reserves)).toBeGreaterThan(Number(reports[0]!.reserves))
  } catch (error) { if ((error as Error).message === "V8_ASSAY_CENSORED") status = "CENSORED"; else throw error }
  finally {
    for (const spy of [known, usage, available, disk, descriptorChecks, physical, basis]) spy.mockRestore()
    if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send"); if (connected) Object.defineProperty(process, "connected", connected); else Reflect.deleteProperty(process, "connected")
    process.stdout.write(`FINITE_PUBLIC_V8_ASSAY ${JSON.stringify({ status, elapsedMs: Math.ceil(performance.now() - began), aggregateBytes, lastStage, cleanup, reports, externalClockResourcePidAndDisjointCostObservationMocked: true, importerControllerLocalFdHashSchemaReal: true, historyCustodyOrCapacityFitProven: false })}\n`)
  }
  expect(cleanup).toBe(true)
}, 15000)
// Separate unconsumed PREPARE fixture. Git/resources/clock are inert; source,
// raw/domain hashes, descriptors, controller and CARRY importer remain real.
const preledgerDetailV6 = () => ({ currents: 0, sourceClosed: 0, archiveOpened: 0, archiveClosed: 0, fullVisits: 0, liveVisits: 0, fullOpeningVisits: 0, fullClosingVisits: 0, liveOpeningVisits: 0, liveClosingVisits: 0, union: 0, liveUnion: 0, capturedSurvivors: 0, exportedDescriptorReads: 0, reserveCallbacks: 0, chunks: 0, opens: 0, lstats: 0, realpaths: 0, fstats: 0, rawHashes: 0, inputRawHashes: 0, liveInputRawHashes: 0, sourceRawHashes: 0, carryRawHashes: 0, manifestScopes: 0, physicalScans: 0, journalReads: 0 })
const preledgerFixtureV6 = (run: (f: { window: lean.LeanBaselineContinuationWindowV2; counts: { windowHashes: number; heads: number; capacities: number; inputReads: number; liveCompleted: number }; detail: ReturnType<typeof preledgerDetailV6>; initialization: ReturnType<typeof preledgerDetailV6> & { windowHashes: number; heads: number; capacities: number; inputReads: number; liveCompleted: number }; callbacks: { windowHashes: number; heads: number; capacities: number; inputReads: number }[]; onCurrent: { value?: () => void }; absent: () => void; assertInvalid: () => void; moveCwd: () => void }) => void, sourceExtra = 0, ancestorContainsSealed = false, routeNamespace: "20261014-v6" | "20261014-v7" | "20261015-v8" | "20261017-v9" | "20261017-v10" = "20261014-v6") => {
  const began = performance.now(), dir = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), ancestorContainsSealed ? "continuation-preledger-sealed-" : "continuation-preledger-"))), originalArgs = process.execArgv, connected = Object.getOwnPropertyDescriptor(process, "connected"), p = routeNamespace === "20261017-v10" ? lean.LEAN_BASELINE_CONTINUATION_PATHS_V10 : routeNamespace === "20261017-v9" ? lean.LEAN_BASELINE_CONTINUATION_PATHS_V9 : routeNamespace === "20261015-v8" ? lean.LEAN_BASELINE_CONTINUATION_PATHS_V8 : routeNamespace === "20261014-v7" ? lean.LEAN_BASELINE_CONTINUATION_PATHS_V7 : lean.LEAN_BASELINE_CONTINUATION_PATHS_V6
  const cwd = vi.spyOn(process, "cwd").mockReturnValue(dir), actualExists = fs.existsSync, exists = vi.spyOn(fs, "existsSync").mockImplementation(path => actualExists(resolve(String(path))))
  const counts = { windowHashes: 0, heads: 0, capacities: 0, inputReads: 0, liveCompleted: 0 }, callbacks: { windowHashes: number; heads: number; capacities: number; inputReads: number }[] = [], onCurrent: { value?: () => void } = {}
  expect(sourceExtra * 1024 + 8 * 1024 * 1024).toBeLessThanOrEqual(64 * 1024 * 1024)
  const detail = preledgerDetailV6(), frames: { kind: "full" | "live"; phase: "opening" | "body" | "closing"; current: boolean }[] = [], deadline = began + 12000
  const bounded = () => { if (performance.now() >= deadline) throw new Error("SOURCE_FIXTURE_CENSORED") }
  const originalStat = fs.lstatSync, stats = vi.spyOn(fs, "lstatSync").mockImplementation(((...args: Parameters<typeof fs.lstatSync>) => {
    detail.lstats++; const frame = frames.at(-1)
    if (frame && !frame.current && frame.phase !== "body") { detail[frame.kind === "full" ? "fullVisits" : "liveVisits"]++; detail[frame.kind === "full" ? frame.phase === "opening" ? "fullOpeningVisits" : "fullClosingVisits" : frame.phase === "opening" ? "liveOpeningVisits" : "liveClosingVisits"]++ }
    return Reflect.apply(originalStat, fs, args)
  }) as typeof fs.lstatSync)
  const originalRealpath = fs.realpathSync, realpaths = vi.spyOn(fs, "realpathSync").mockImplementation(((...args: Parameters<typeof fs.realpathSync>) => { detail.realpaths++; return Reflect.apply(originalRealpath, fs, args) }) as typeof fs.realpathSync)
  const originalFstat = fs.fstatSync, fstats = vi.spyOn(fs, "fstatSync").mockImplementation(((...args: Parameters<typeof fs.fstatSync>) => { detail.fstats++; return Reflect.apply(originalFstat, fs, args) }) as typeof fs.fstatSync)
  const rawOwners = new WeakMap<Uint8Array, string>(), descriptorsByFd = new Map<number, string>(), originalOpen = fs.openSync, opens = vi.spyOn(fs, "openSync").mockImplementation(((...args: Parameters<typeof fs.openSync>) => { detail.opens++; const fd = Reflect.apply(originalOpen, fs, args); descriptorsByFd.set(fd, resolve(String(args[0]))); return fd }) as typeof fs.openSync)
  const originalChunk = fs.readSync, chunks = vi.spyOn(fs, "readSync").mockImplementation(((...args: Parameters<typeof fs.readSync>) => {
    detail.chunks++; const owner = descriptorsByFd.get(args[0]), buffer = args[1]
    if (owner === resolve(lean.LEAN_BASELINE_CONTINUATION_PATHS.allocation) && buffer instanceof Uint8Array) rawOwners.set(buffer, "carry")
    return Reflect.apply(originalChunk, fs, args)
  }) as typeof fs.readSync)
  const originalRaw = lean.leanBytesRoot, raw = vi.spyOn(lean, "leanBytesRoot").mockImplementation(bytes => { detail.rawHashes++; const owner = rawOwners.get(bytes); if (owner === "input") detail.inputRawHashes++; if (owner === "source") detail.sourceRawHashes++; if (owner === "carry") detail.carryRawHashes++; return originalRaw(bytes) })
  const originalScope = continuationGit.readLeanBaselineContinuationGitV2, scopes = vi.spyOn(continuationGit, "readLeanBaselineContinuationGitV2").mockImplementation((...args) => { detail.manifestScopes++; return originalScope(...args) })
  const originalPhysical = lean.cumulativeLeanPhysicalBytes, physical = vi.spyOn(lean, "cumulativeLeanPhysicalBytes").mockImplementation(l => { detail.physicalScans++; return originalPhysical(l) })
  const write = (path: string, bytes: string | Uint8Array, mode = 0o644) => { fs.mkdirSync(resolve(path, ".."), { recursive: true }); fs.writeFileSync(resolve(path), bytes, { mode }); fs.chmodSync(resolve(path), mode) }
  const extraEntries = Array.from({ length: sourceExtra }, (_, i) => ({ path: `scripts/preledger-synthetic-${i}.ts`, root: originalRaw(Buffer.alloc(1024, 97)) }))
  const factory = vi.spyOn(factoryImplementation, "factoryAssessmentImplementationManifest").mockReturnValue({ entries: extraEntries, root: root("inert-factory") })
  const usage = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...process.memoryUsage(), rss: 100000000, arrayBuffers: 0 }), available = vi.spyOn(leagueHost, "observeLeagueAvailableMemoryBytes").mockReturnValue(4000000000)
  const disk = vi.spyOn(fs, "statfsSync").mockImplementation(() => { counts.capacities++; return { bavail: 100000000000n, bsize: 1n } as never })
  const actualHash = contracts.labRoot, hashes = vi.spyOn(contracts, "labRoot").mockImplementation((domain, value) => { if (domain === "lean-baseline-continuation-window-v2") counts.windowHashes++; return actualHash(domain, value) })
  const actualRead = continuationHelper.readLeanContinuationBoundedBytesV2, descriptors = vi.spyOn(continuationHelper, "readLeanContinuationBoundedBytesV2").mockImplementation((path, maximum, mode, guard) => {
    detail.exportedDescriptorReads++; const input = resolve(path) === join(dir, p.window) || resolve(path) === join(dir, p.request)
    if (input) counts.inputReads++; if (path.endsWith("/ledger.ndjson") || path.endsWith("/time.ndjson")) detail.journalReads++
    const bytes = actualRead(path, maximum, mode, additional => { bounded(); detail.reserveCallbacks++; guard(additional) })
    rawOwners.set(bytes, input ? "input" : path === lean.LEAN_BASELINE_CONTINUATION_PATHS.allocation ? "carry" : "other"); return bytes
  })
  const head = "b".repeat(40), git = vi.spyOn(childProcess, "execFileSync").mockImplementation(((command: string, args: readonly string[], options: unknown) => {
    if (command !== "git") return "0\n"
    if (args[0] === "rev-parse" && args[1] === "HEAD") { counts.heads++; expect(options).toEqual({ stdio: ["ignore", "pipe", "ignore"], timeout: 1500, maxBuffer: 128 }); return Buffer.from(`${head}\n`) }
    if (args[0] === "merge-base") return Buffer.alloc(0)
    if (args[0] === "show") { const bytes = fs.readFileSync(resolve(args[1]!.slice(41))); rawOwners.set(bytes, "source"); return bytes }
    throw new Error("UNEXPECTED_INERT_GIT")
  }) as typeof childProcess.execFileSync)
  let assertInvalid: () => void = () => { throw new Error("CONTROLLER_NOT_REACHED") }
  const actualController = continuationHelper.createLeanContinuationStageControllerV6, controllers = vi.spyOn(continuationHelper, "createLeanContinuationStageControllerV6").mockImplementation((pins, rows, roles, binding, current, policy) => {
    expect(rows).toEqual([])
    detail.capturedSurvivors += rows.length; detail.union = new Set(pins.map(row => resolve(row.path))).size; detail.liveUnion = new Set(roles.filter(row => row.role !== "fixed_source").map(row => resolve(row.path))).size
    const c = actualController(pins, rows, roles, binding, () => { bounded(); detail.currents++; const frame = frames.at(-1); if (frame) frame.current = true; try { onCurrent.value?.(); current() } finally { if (frame) frame.current = false } }, policy)
    assertInvalid = () => { expect(() => c.live(binding, () => {})).toThrow(/V6_CONTEXT/); expect(() => c.withStage(binding, "bootstrap", () => {})).toThrow(/V6_CONTEXT/) }
    return Object.freeze({ ...c,
      live<T>(candidate: object, body: () => T): T {
        const frame = { kind: "live" as const, phase: "opening" as "opening" | "body" | "closing", current: false }, before = { ...counts }, rawBefore = detail.inputRawHashes, scopesBefore = detail.manifestScopes; frames.push(frame)
        try { const result = c.live(candidate, () => { frame.phase = "body"; detail.currents++; frame.current = true; try { return body() } finally { frame.current = false; frame.phase = "closing" } }); callbacks.push({ windowHashes: counts.windowHashes - before.windowHashes, heads: counts.heads - before.heads, capacities: counts.capacities - before.capacities, inputReads: counts.inputReads - before.inputReads }); expect(detail.inputRawHashes - rawBefore).toBe(6); expect(detail.manifestScopes - scopesBefore).toBe(0); detail.liveInputRawHashes += detail.inputRawHashes - rawBefore; counts.liveCompleted++; return result } finally { frames.pop() }
      },
      withStage<T>(candidate: object, stage: continuationHelper.LeanContinuationStageV6, body: () => T): T {
        const frame = { kind: "full" as const, phase: "opening" as "opening" | "body" | "closing", current: false }; frames.push(frame); if (stage === "archive") detail.archiveOpened++
        try { const result = c.withStage(candidate, stage, () => { frame.phase = "body"; try { return body() } finally { frame.phase = "closing" } }); if (stage === "source") detail.sourceClosed++; if (stage === "archive") detail.archiveClosed++; return result } finally { frames.pop() }
      },
    })
  })
  const actualBoundary = continuationHelper.createLeanContinuationBoundaryControllerV8, boundary = vi.spyOn(continuationHelper, "createLeanContinuationBoundaryControllerV8").mockImplementation((pins, rows, roles, binding, current, reserve, policy) => {
    const c = actualBoundary(pins, rows, roles, binding, () => { bounded(); onCurrent.value?.(); current() }, reserve, policy)
    assertInvalid = () => { expect(() => c.reserve(binding)).toThrow(/V8_CONTEXT/); expect(() => c.withStage(binding, "bootstrap", () => {})).toThrow(/V8_CONTEXT/) }
    return c
  })
  let clock: ReturnType<typeof vi.spyOn> | undefined
  try {
    Object.defineProperty(process, "connected", { value: false, configurable: true }); process.execArgv = ["--import", "tsx"]
    vi.stubEnv("TSX_DISABLE_CACHE", "1"); vi.stubEnv("NODE_DISABLE_COMPILE_CACHE", "1"); vi.stubEnv("TMPDIR", resolve(p.temp)); for (const key of ["NODE_OPTIONS", "NODE_COMPILE_CACHE", "NODE_REDIRECT_WARNINGS", "NODE_V8_COVERAGE"]) vi.stubEnv(key, undefined)
    const sourcePaths = [...parentApi.LEAN_BASELINE_CONTINUATION_OWNED_PATHS, "scripts/run-v1-38-lean-baseline.sh", "scripts/lib/v1-38-lean-baseline-analysis.ts", "scripts/lib/v1-38-lean-baseline-metrics.ts", "scripts/lib/v1-38-lean-cold-corpus.ts", "scripts/lib/v1-38-lean-seal-metadata.ts", "scripts/lib/v1-38-lean-training-adapter.ts", "scripts/lib/v1-38-lean-baseline.ts", "packages/strategy-lab/src/league/lean-training.ts", "scripts/run-v1-38-lean-experiment.ts", "scripts/lib/v1-38-lean-child-cli-terminal.ts", "scripts/lib/v1-38-factory-supervised-runtime.ts", "scripts/lib/v1-38-league-prospective-lifetime.ts", "packages/strategy-lab/src/league/lean-training.test.ts", "scripts/lib/v1-38-lean-baseline-analysis.test.ts", "scripts/lib/v1-38-lean-baseline-source.test.ts", "scripts/lib/v1-38-lean-startup-supervisor-v8.mjs", "AGENTS.md"]
    for (const path of new Set([...sourcePaths, ...parentApi.LEAN_BASELINE_CONTINUATION_PLANNING_PATHS])) { bounded(); write(path, "inert source", path.endsWith(".sh") ? 0o755 : 0o644) }
    for (const entry of extraEntries) { bounded(); write(entry.path, Buffer.alloc(1024, 97)) }
    const base = parentApi.leanBaselineContinuationSourceManifestV2(), planRoot = base.planningEntries.find(row => row.path.endsWith("265-16-BASELINE-CONTINUATION-PLAN-20261012.md"))!.root
    const sg: parentApi.LeanContinuationSourceGateV2 = { schemaVersion: "lean-baseline-continuation-source-gate-v2", plan_check: "passed", source_review: "passed", root_validation: "passed", source_verification: "passed", commands_closed: true, reviewedSourceHead: "a".repeat(40), sourceRoot: base.root, sourceAuthor: "inert-author", sourceReviewer: "inert-reviewer", sourceVerifier: "inert-verifier" }
    const syntheticA = (routeNamespace === "20261017-v10" ? 1792241199000 : routeNamespace === "20261017-v9" ? 1792198286000 : routeNamespace === "20261015-v8" ? 1792093334000 : 1792017187000) + 12345, syntheticCarry = 459375903 + (syntheticA - 1791807317000)
    const wb = { schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const, grantId: "inert-preledger", approvalEvidence: { humanDecisionId: routeNamespace === "20261017-v10" ? "human-approval-observed-20261017T124639Z" : routeNamespace === "20261017-v9" ? "human-approval-observed-20261017T005126Z" : routeNamespace === "20261015-v8" ? "human-approval-observed-20261015T194214Z" : routeNamespace === "20261014-v7" ? "human-approval-observed-20261014T223307Z" : "inert-human", recordedBy: "inert-root" }, approvedAtMs: 1792002607000, anchorMs: 1792002607000, carryMs: 654665903, capMs: 683465903, deadlineMs: 1792031407000, ...(routeNamespace !== "20261014-v6" ? { approvedAtMs: routeNamespace === "20261017-v10" ? 1792241199000 : routeNamespace === "20261017-v9" ? 1792198286000 : routeNamespace === "20261015-v8" ? 1792093334000 : 1792017187000, anchorMs: syntheticA, carryMs: syntheticCarry, capMs: syntheticCarry + 28800000, deadlineMs: syntheticA + 28800000 } : {}), durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace, reviewedSourceHead: sg.reviewedSourceHead, sourceRoot: base.root, sourceGateRoot: labRoot(sg.schemaVersion, sg), planRoot, runOperator: "inert-runner", readerOperator: "inert-reader" }, window = { ...wb, root: labRoot(wb.schemaVersion, wb) }
    const dg: parentApi.LeanContinuationDataGateV2 = { schemaVersion: "lean-baseline-continuation-data-gate-v2", status: "passed", grantId: window.grantId, windowRoot: window.root, windowBytesRoot: leanBytesRoot(leanCanonicalBytes(window)), reviewedSourceHead: sg.reviewedSourceHead, sourceRoot: base.root, sourceGateRoot: window.sourceGateRoot, planRoot, approvalEvidence: window.approvalEvidence, runOperator: window.runOperator, readerOperator: window.readerOperator, dataReviewer: "inert-data", commands_closed: true }
    write(p.gates, `\`\`\`json\n${Buffer.from(leanCanonicalBytes(sg))}\n\`\`\`\n\`\`\`json\n${Buffer.from(leanCanonicalBytes(dg))}\n\`\`\`\n`); write(p.window, leanCanonicalBytes(window), 0o600)
    clock = vi.spyOn(Date, "now").mockReturnValue(window.anchorMs)
    const manifest = parentApi.leanBaselineContinuationDataManifestV2(window, parentApi.leanBaselineContinuationSourceManifestV2()), seed = "inert-preledger", coldRoot = leanColdProcedureRoot(seed)
    const request: parentApi.LeanBaselineContinuationRequestV2 = { schemaVersion: "lean-baseline-continuation-request-v2", seed, sourceHead: head, sourceRoot: base.root, planningRoot: manifest.planningRoot, planRoot, reviewRoot: window.sourceGateRoot, coldRoot, candidateRoots: parentApi.deriveLeanBaselineCandidateRoots(coldRoot), requestRoots: parentApi.deriveLeanBaselineRequestRoots({ seed, coldRoot, planRoot, sourceRoot: base.root }), offlineOverheadMs: window.offlineOverheadMs, sourceAuthor: sg.sourceAuthor, runOperator: window.runOperator, readerOperator: window.readerOperator, windowRoot: window.root, windowBytesRoot: manifest.windowBytesRoot, sourceGateRoot: window.sourceGateRoot, dataReviewRoot: manifest.dataReviewRoot, manifestRoot: manifest.manifestRoot }
    write(p.request, leanCanonicalBytes(request), 0o600); write(lean.LEAN_BASELINE_CONTINUATION_PATHS.allocation, "{}")
    const absent = () => { for (const path of [p.temp, p.store, p.claim, p.allocation]) expect(fs.existsSync(join(dir, path))).toBe(false) }
    const moveCwd = () => { const nested = join(dir, "nested-repository-directory"); fs.mkdirSync(nested, { recursive: true }); cwd.mockReturnValue(nested) }
    const initialization = { ...detail, ...counts }
    run({ window, counts, detail, initialization, callbacks, onCurrent, absent, assertInvalid: () => assertInvalid(), moveCwd }); absent()
  } finally { clock?.mockRestore(); boundary.mockRestore(); controllers.mockRestore(); git.mockRestore(); descriptors.mockRestore(); hashes.mockRestore(); disk.mockRestore(); available.mockRestore(); usage.mockRestore(); factory.mockRestore(); physical.mockRestore(); scopes.mockRestore(); raw.mockRestore(); chunks.mockRestore(); opens.mockRestore(); fstats.mockRestore(); realpaths.mockRestore(); stats.mockRestore(); exists.mockRestore(); vi.unstubAllEnvs(); process.execArgv = originalArgs; if (connected) Object.defineProperty(process, "connected", connected); else Reflect.deleteProperty(process, "connected"); cwd.mockRestore(); fs.rmSync(dir, { recursive: true }); expect(performance.now() - began).toBeLessThan(15000) }
}
it("continuation-device-v11-driver selects only the finite route and withholds foreign diagnostic text", () => {
  const request = ".strategy-lab/lean-baseline-continuation-request-20261017-v11.json"
  expect(parentApi.parseLeanBaselineCommand(["prepare-continuation-v2", "--request", request])).toEqual({ mode: "prepare-continuation-v2", request })
  expect(() => parentApi.parseLeanBaselineCommand(["prepare-continuation-v2", "--request", request + ".other"])).toThrow()
  expect(parentApi.leanContinuationPreparationCodeV4(new TypeError("LEAN_BASELINE_CONTINUATION_V11_CONTINUITY_HASH"))).toBe("CONTINUITY_HASH")
  expect(parentApi.leanContinuationPreparationCodeV4(new TypeError("LEAN_BASELINE_CONTINUATION_V11_CONTINUITY_MEMBERS"))).toBe("CONTINUITY_MEMBERS")
  expect(parentApi.leanContinuationPreparationCodeV4(new TypeError("private/content/path"))).toBe("DETAILS_WITHHELD")
  const getter = new TypeError(); Object.defineProperty(getter, "message", { get() { throw new Error("must not inspect") } })
  expect(parentApi.leanContinuationPreparationCodeV4(getter)).toBe("DETAILS_WITHHELD")
  expect(parentApi.leanContinuationPreparationCodeV4(new Proxy({}, { getPrototypeOf() { throw new Error("no traps") } }))).toBe("DETAILS_WITHHELD")
})
describe("continuation-next-v10-driver-preflight", () => {
  it("real bounded progress reserves active cells through terminal, then retains zero-cell closure and hard deadline", () => {
    const known = vi.spyOn(continuationHelper, "measureLeanContinuationKnownDisjointBytesV8").mockReturnValue(4096), send = Object.getOwnPropertyDescriptor(process, "send")
    Object.defineProperty(process, "send", { value: undefined, configurable: true })
    try { preledgerFixtureV6(f => {
      const p = lean.LEAN_BASELINE_CONTINUATION_PATHS_V10, w = f.window, cutoff = w.deadlineMs - 3060000
      const pb = { schemaVersion: "lean-baseline-continuation-carry-v2" as const, chargedMatches: 50 as const, elapsedUpperBoundMs: 465187899, allocatedDiskBytes: 88924160, residualDiskBytes: 4096, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, originalCarryRoot: root("original"), closedCapsuleRoot: root("capsule"), custodyRoot: root("custody"), inventoryRoot: root("inventory"), qualifiedReaderAuthority: "cost_only" as const }
      const allocation = lean.createLeanBaselineContinuationAllocationV2({ sourceRoot: w.sourceRoot, reviewRoot: root("review"), coldRoot: root("cold"), planRoot: w.planRoot, candidateRoots: [root("a"), root("b")], requestRoots: Array.from({ length: 36 }, (_, i) => root(`progress-${i}`)), seed: "synthetic-next-progress", sourceHead: "b".repeat(40), planningRoot: root("planning"), manifestRoot: root("manifest"), requestBytesRoot: root("request"), window: w, windowBytesRoot: leanBytesRoot(leanCanonicalBytes(w)), sourceGateRoot: w.sourceGateRoot, dataReviewRoot: root("data"), predecessor: { ...pb, root: labRoot(pb.schemaVersion, pb) } })
      fs.mkdirSync(resolve(p.temp), { mode: 0o700 }); const ledger = lean.createLeanLedger(resolve(p.store), allocation)
      const mono = vi.spyOn(process.hrtime, "bigint").mockReturnValue(1000000n)
      try {
        vi.mocked(Date.now).mockReturnValue(cutoff)
        fs.writeFileSync(join(ledger.directory, "entry.json"), leanCanonicalBytes({ schemaVersion: "lean-child-entry-v2", allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot: allocation.requestBytesRoot, head: allocation.sourceHead, parentPid: process.ppid, childPid: process.pid, handshakeRoot: root("handshake"), wallStartMs: cutoff, monotonicStartNs: "1000000" }), { mode: 0o600 })
        lean.beginLeanInterval(ledger, "pilot-entry", cutoff)
        const local = parentApi.createLeanContinuationLocalReservationV8(w); local.bindProgress(ledger); local.reserve()
        const rejectNext = () => {
          const candidate = parentApi.createLeanContinuationLocalReservationV8(w); candidate.bindProgress(ledger)
          vi.mocked(Date.now).mockReturnValue(cutoff + 1); expect(() => candidate.reserve()).toThrow(/CAPACITY/)
          vi.mocked(Date.now).mockReturnValue(cutoff)
        }
        const charge = lean.chargeLeanSlot(ledger, allocation.slots[0]!, { freeBytes: 100000000000, availableMemoryBytes: 4000000000 })
        local.reserve(); expect(lean.readLeanLedger(ledger).terminals.size).toBe(0); rejectNext()
        // Provider return / finishCell cannot change this authenticated ledger frontier.
        local.setRemainingSlots(35); local.reserve(); rejectNext()
        const compact = { classification: "success" as const, code: "OK" as const, outcome: "DRAW" as const, elapsedMs: 10, cleanupComplete: true, invocationCount: 0, accountingRoot: root("accounting"), executionRoot: root("execution"), telemetry: { transitions: 0, events: 0 } }
        lean.retainLeanMatch(ledger, charge, compact, [], undefined, () => {}); local.reserve(); expect(lean.readLeanLedger(ledger).terminals.size).toBe(1); rejectNext()
        const provider = vi.fn(); vi.mocked(Date.now).mockReturnValue(cutoff + 1)
        expect(() => { lean.chargeLeanSlot(ledger, allocation.slots[1]!, { freeBytes: 100000000000, availableMemoryBytes: 4000000000 }); provider() }).toThrow(/FRONTIER/); expect(provider).not.toHaveBeenCalled(); expect(lean.readLeanLedger(ledger).charged).toBe(51)
        vi.mocked(Date.now).mockReturnValue(cutoff)
        for (const slot of allocation.slots.slice(1)) { const c = lean.chargeLeanSlot(ledger, slot, { freeBytes: 100000000000, availableMemoryBytes: 4000000000 }); lean.retainLeanMatch(ledger, c, compact, [], undefined, () => {}) }
        expect(lean.readLeanLedger(ledger).terminals.size).toBe(36)
        vi.mocked(Date.now).mockReturnValue(w.deadlineMs - 2460000); local.reserve()
        vi.mocked(Date.now).mockReturnValue(w.deadlineMs - 2460000 + 1); expect(() => local.reserve()).toThrow(/CAPACITY/)
        vi.mocked(Date.now).mockReturnValue(w.deadlineMs - 1)
        const zero = parentApi.createLeanContinuationLocalReservationV8(w, true); zero.bindProgress(ledger); zero.reserve()
        vi.mocked(Date.now).mockReturnValue(w.deadlineMs); expect(() => zero.reserve()).toThrow(/CAPACITY/)
      } finally { mono.mockRestore(); fs.rmSync(resolve(p.store), { recursive: true }); fs.rmSync(resolve(p.temp), { recursive: true }) }
    }, 0, false, "20261017-v10") } finally { known.mockRestore(); if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send") }
  }, 15000)
  it.each([0, 1])("real privately compiled preflight at next-cell equality +%i", delta => {
    const known = vi.spyOn(continuationHelper, "measureLeanContinuationKnownDisjointBytesV8").mockReturnValue(4096), send = Object.getOwnPropertyDescriptor(process, "send"); Object.defineProperty(process, "send", { value: undefined, configurable: true })
    try { preledgerFixtureV6(f => {
      const cutoff = f.window.deadlineMs - 3060000; f.onCurrent.value = () => vi.mocked(Date.now).mockReturnValue(cutoff + delta)
      expect(() => parentApi.prepareLeanBaselineContinuationV2(lean.LEAN_BASELINE_CONTINUATION_PATHS_V10.request)).toThrow(delta ? /V2_WINDOW_EXPIRED|RESERVATION_CAPACITY/ : /V2_ALLOCATION_ANCHOR/)
      if (delta) expect(f.counts.heads).toBe(1); else expect(f.counts.heads).toBeGreaterThan(3)
      f.absent()
    }, 0, false, "20261017-v10") } finally { known.mockRestore(); if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send") }
  }, 15000)
  it("finite CLI and known-unselected Git denial remain exact", () => {
    const p = lean.LEAN_BASELINE_CONTINUATION_PATHS_V10
    for (const mode of ["prepare-continuation-v2", "run-continuation-v2", "verify-continuation-v2"]) expect(parentApi.parseLeanBaselineCommand([mode, "--request", p.request])).toEqual({ mode, request: p.request })
    expect(() => continuationGit.readLeanBaselineContinuationGitV2(["show", "a".repeat(40) + ":" + p.allocation], [{ path: p.allocation, root: root("unselected") }])).toThrow(/METADATA/)
  })
})
describe("continuation-route-v9-driver-preflight", () => {
  const p = lean.LEAN_BASELINE_CONTINUATION_PATHS_V9
  it("connects finite CLI discovery and known-unselected allocation denial", () => {
    for (const mode of ["prepare-continuation-v2", "run-continuation-v2", "verify-continuation-v2"]) expect(parentApi.parseLeanBaselineCommand([mode, "--request", p.request])).toEqual({ mode, request: p.request })
    expect(() => parentApi.parseLeanBaselineCommand(["run-continuation-v2", "--request", p.request + ".other"])).toThrow()
    // A manifest-listed V9 allocation cannot become a legacy selected route.
    expect(() => continuationGit.readLeanBaselineContinuationGitV2(["show", `${"a".repeat(40)}:${p.allocation}`], [{ path: p.allocation, root: root("wrong-route") }])).toThrow(/METADATA/)
  })
  it.each(["head", "window", "request", "source", "resource"] as const)("real current %s drift invalidates before importer/write", mode => {
    const known = vi.spyOn(continuationHelper, "measureLeanContinuationKnownDisjointBytesV8").mockReturnValue(4096), send = Object.getOwnPropertyDescriptor(process, "send")
    Object.defineProperty(process, "send", { value: undefined, configurable: true })
    try { preledgerFixtureV6(f => {
    let injected = false
    f.onCurrent.value = () => {
      if (injected) return; injected = true
      if (mode === "head") { const original = vi.mocked(childProcess.execFileSync).getMockImplementation()!; vi.mocked(childProcess.execFileSync).mockImplementation(((...args: Parameters<typeof childProcess.execFileSync>) => args[0] === "git" && (args[1] as readonly string[])[0] === "rev-parse" ? Buffer.from("c".repeat(40)) : Reflect.apply(original, childProcess, args)) as typeof childProcess.execFileSync) }
      if (mode === "window" || mode === "request") fs.writeFileSync(resolve(p[mode]), "{}")
      if (mode === "source") fs.writeFileSync(resolve("scripts/run-v1-38-lean-baseline.ts"), "changed")
      if (mode === "resource") vi.mocked(process.memoryUsage).mockReturnValue({ ...process.memoryUsage(), rss: 3000000001 })
    }
    let error: unknown; try { parentApi.prepareLeanBaselineContinuationV2(p.request) } catch (e) { error = e }
    expect(error).toBeInstanceOf(Error); expect(injected, String(error)).toBe(true); f.assertInvalid(); f.absent()
    }, 0, false, "20261017-v9") } finally { known.mockRestore(); if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send") }
  })
  it("selected local reservation uses the 3GB current-memory edge, not generic 2GB", () => {
    const known = vi.spyOn(continuationHelper, "measureLeanContinuationKnownDisjointBytesV8").mockReturnValue(4096), send = Object.getOwnPropertyDescriptor(process, "send")
    Object.defineProperty(process, "send", { value: undefined, configurable: true })
    try { preledgerFixtureV6(f => {
      const local = parentApi.createLeanContinuationLocalReservationV8(f.window), parseReserve = 2 * 7 * 4194304 + 4 * 3 * 262144 + 2 * 268435456 + 512000000 + 335544320
      vi.mocked(process.memoryUsage).mockReturnValue({ ...process.memoryUsage(), rss: 3000000000 - parseReserve, arrayBuffers: 0 })
      expect(() => local.reserve()).not.toThrow()
      vi.mocked(process.memoryUsage).mockReturnValue({ ...process.memoryUsage(), rss: 3000000001 - parseReserve, arrayBuffers: 0 })
      expect(() => local.reserve()).toThrow(/CAPACITY/); expect(() => local.reserve()).toThrow(/SCOPE/)
    }, 0, false, "20261017-v9") } finally { known.mockRestore(); if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send") }
  })
})
describe("[continuation-ready-v7-N] actual V7 callers (synthetic A / Git resources clock catalog mocked)", () => {
  const p = lean.LEAN_BASELINE_CONTINUATION_PATHS_V7
  it.each([0, 32])("real prepare→source→real CARRY immutable anchor refusal; bounded sample %i", extra => preledgerFixtureV6(f => {
    const began = performance.now(); let refusal: unknown
    try { parentApi.prepareLeanBaselineContinuationV2(p.request) } catch (error) { refusal = error }
    expect(refusal).toBeInstanceOf(TypeError); expect((refusal as Error).message).toMatch(/V2_ALLOCATION_ANCHOR/)
    expect(parentApi.leanBaselineContinuationPreparationFailureV4(refusal)).toBe("LEAN_BASELINE_PREPARATION_V4 stage=CARRY code=DETAILS_WITHHELD\n")
    expect(f.detail.sourceClosed).toBe(1); expect(f.detail.archiveOpened).toBe(1); expect(f.detail.archiveClosed).toBe(0); expect(f.detail.capturedSurvivors).toBe(0)
    expect(f.detail.fullOpeningVisits).toBe(2 * f.detail.union); expect(f.detail.fullClosingVisits).toBe(f.detail.union)
    expect(f.callbacks.length).toBeGreaterThan(0)
    for (const callback of f.callbacks) expect(callback).toEqual({ windowHashes: 0, heads: 3, capacities: 33, inputReads: 6 })
    expect(f.detail.physicalScans).toBe(0); expect(f.detail.journalReads).toBe(0); f.absent()
    process.stdout.write(`FINITE_SYNTHETIC_V7_PRELEDGER ${JSON.stringify({ status: "COMPLETE", extra, sampleMs: Math.ceil(performance.now() - began), bytesBound: extra * 1024 + 8 * 1024 * 1024, initialization: f.initialization, total: f.detail, callbacks: f.callbacks.length, callback: f.callbacks[0], reached: ["SOURCE", "CARRY_OPEN", "FIXED_ANCHOR_REFUSAL"], custodyComplete: false, archiveClosingAccepted: false, setupCapturePublication: false, actualDriverBindArchiveCovered: false, historicalSuccessCovered: false, hashesDescriptorsControllerImporterReal: true, gitResourcesClockFactoryCatalogMocked: true, runtimeFitEstablished: false })}\n`)
  }, extra, false, "20261014-v7"), 15000)
  it.each(["head", "head-format", "head-length", "window", "request", "resource", "deadline", "backward", "unsafe", "cwd", "source"] as const)("fresh %s drift refuses and invalidates without setup", mode => preledgerFixtureV6(f => {
    let injected = false
    f.onCurrent.value = () => {
      if (injected) return; injected = true
      if (mode.startsWith("head")) { const original = vi.mocked(childProcess.execFileSync).getMockImplementation()!; vi.mocked(childProcess.execFileSync).mockImplementation(((...args: Parameters<typeof childProcess.execFileSync>) => args[0] === "git" && (args[1] as readonly string[])[0] === "rev-parse" ? Buffer.from(mode === "head" ? "c".repeat(40) : mode === "head-length" ? "b".repeat(129) : "b".repeat(40) + "\n\n") : Reflect.apply(original, childProcess, args)) as typeof childProcess.execFileSync) }
      if (mode === "window" || mode === "request") fs.writeFileSync(resolve(p[mode]), "{}")
      if (mode === "source") fs.writeFileSync(resolve("scripts/run-v1-38-lean-baseline.ts"), "changed source")
      if (mode === "resource") vi.mocked(process.memoryUsage).mockReturnValue({ ...process.memoryUsage(), rss: 4000000000 })
      if (mode === "deadline") vi.mocked(Date.now).mockReturnValue(f.window.deadlineMs - 36 * LEAN_CAPS.matchMs - f.window.closureMs - f.window.offlineOverheadMs + 1)
      if (mode === "backward") vi.mocked(Date.now).mockReturnValue(f.window.anchorMs - 1)
      if (mode === "unsafe") vi.mocked(Date.now).mockReturnValue(Number.MAX_SAFE_INTEGER + 1)
      if (mode === "cwd") f.moveCwd()
    }
    expect(() => parentApi.prepareLeanBaselineContinuationV2(p.request)).toThrow(mode === "head" ? /V2_HEAD_CHANGED/ : mode.startsWith("head-") ? /GIT_V2_METADATA/ : mode === "window" || mode === "request" ? /V6_CONTEXT_BYTES/ : mode === "resource" ? /V2_CAPACITY/ : mode === "deadline" ? /V2_WINDOW_EXPIRED/ : mode === "backward" || mode === "unsafe" ? /CONTINUATION_V2_CLOCK/ : mode === "source" ? /CONTINUATION_PIN_CHANGED/ : /V6_CONTEXT/)
    expect(injected).toBe(true); f.assertInvalid(); f.absent()
  }, 0, false, "20261014-v7"), 15000)
  it("registered relative input privacy survives sealed-named checkout ancestors", () => preledgerFixtureV6(f => {
    expect(() => parentApi.prepareLeanBaselineContinuationV2(p.request)).toThrow(/V2_ALLOCATION_ANCHOR/); expect(f.callbacks.length).toBeGreaterThan(0)
    for (const callback of f.callbacks) expect(callback).toEqual({ windowHashes: 0, heads: 3, capacities: 33, inputReads: 6 }); f.absent()
  }, 0, true, "20261014-v7"), 15000)
  it.each(["mutable", "deep-mutable"] as const)("private issuer rejects %s strict-window output (only validator-output seam mocked)", mode => preledgerFixtureV6(f => {
    const actual = lean.validateLeanBaselineContinuationWindowV2, validate = vi.spyOn(lean, "validateLeanBaselineContinuationWindowV2").mockImplementation(value => { const w = actual(value), copy = { ...w, approvalEvidence: { ...w.approvalEvidence } }; return mode === "mutable" ? copy : Object.freeze(copy) })
    try { expect(() => parentApi.prepareLeanBaselineContinuationV2(p.request)).toThrow(/V6_PREFLIGHT_EXPECTATIONS/); expect(f.callbacks).toEqual([]); f.absent() } finally { validate.mockRestore() }
  }, 0, false, "20261014-v7"), 15000)
  it.each(["temp", "store", "allocation", "claim"] as const)("actual unconsumed %s precreation refuses before source/controller", key => preledgerFixtureV6(f => {
    const path = resolve(p[key]); fs.mkdirSync(resolve(path, ".."), { recursive: true }); fs.writeFileSync(path, "{}")
    try { expect(() => parentApi.prepareLeanBaselineContinuationV2(p.request)).toThrow(/GRANT_CLAIMED/); expect(f.callbacks).toEqual([]) } finally { fs.unlinkSync(path); if (key === "claim") fs.rmdirSync(resolve(p.temp)) }
    f.absent()
  }, 0, false, "20261014-v7"), 15000)
  it("all finite CLI modes and selected/unselected allocation Git predicates are connected", () => preledgerFixtureV6(f => {
    for (const mode of ["prepare-continuation-v2", "run-continuation-v2", "verify-continuation-v2"]) expect(parentApi.parseLeanBaselineCommand([mode, "--request", p.request])).toEqual({ mode, request: p.request })
    for (const path of [p.request + "/extra", p.request.replace("v7", "v8")]) expect(() => parentApi.parseLeanBaselineCommand(["prepare-continuation-v2", "--request", path])).toThrow()
    const head = "b".repeat(40), scoped = [{ path: p.allocation, root: root("allocation") }], actual = vi.mocked(childProcess.execFileSync).getMockImplementation()!
    vi.mocked(childProcess.execFileSync).mockImplementation(((...args: Parameters<typeof childProcess.execFileSync>) => args[0] === "git" && (args[1] as string[])[0] === "show" ? Buffer.from("{}") : Reflect.apply(actual, childProcess, args)) as typeof childProcess.execFileSync)
    expect(() => continuationGit.readLeanBaselineContinuationGitV2(["show", `${head}:${p.allocation}`], [], f.window)).not.toThrow()
    expect(() => continuationGit.readLeanBaselineContinuationGitV2(["show", `${head}:${p.allocation}`], scoped)).toThrow(/METADATA/)
    for (const old of [lean.LEAN_BASELINE_CONTINUATION_PATHS_V2, lean.LEAN_BASELINE_CONTINUATION_PATHS_V4, lean.LEAN_BASELINE_CONTINUATION_PATHS_V5, lean.LEAN_BASELINE_CONTINUATION_PATHS_V6]) expect(() => continuationGit.readLeanBaselineContinuationGitV2(["show", `${head}:${old.allocation}`], [{ path: old.allocation, root: root("old") }], f.window)).toThrow(/METADATA/)
  }, 0, false, "20261014-v7"), 15000)
  it.each(["pass", "closing", "after-charge"] as const)("real V7 ledger+stage dispatcher keeps durable spent charge before inert provider: %s (not custody/Match)", async mode => {
    let window!: lean.LeanBaselineContinuationWindowV2
    preledgerFixtureV6(f => { window = f.window }, 0, false, "20261014-v7")
    const dir = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "ready-v7-charge-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir), clock = vi.spyOn(Date, "now").mockReturnValue(window.anchorMs)
    try {
      const pb = { schemaVersion: "lean-baseline-continuation-carry-v2" as const, chargedMatches: 50 as const, elapsedUpperBoundMs: 465187899, allocatedDiskBytes: 88924160, residualDiskBytes: 4096, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, originalCarryRoot: root("synthetic-original"), closedCapsuleRoot: root("synthetic-capsule"), custodyRoot: root("synthetic-custody"), inventoryRoot: root("synthetic-inventory"), qualifiedReaderAuthority: "cost_only" as const }
      const allocation = lean.createLeanBaselineContinuationAllocationV2({ sourceRoot: window.sourceRoot, reviewRoot: root("synthetic-review"), coldRoot: root("synthetic-cold"), planRoot: window.planRoot, candidateRoots: [root("a"), root("b")], requestRoots: Array.from({ length: 36 }, (_, i) => root(String(i))), seed: "synthetic-ready-v7-charge", sourceHead: "b".repeat(40), planningRoot: root("synthetic-planning"), manifestRoot: root("synthetic-manifest"), requestBytesRoot: root("synthetic-request"), window, windowBytesRoot: leanBytesRoot(leanCanonicalBytes(window)), sourceGateRoot: window.sourceGateRoot, dataReviewRoot: root("synthetic-data"), predecessor: { ...pb, root: labRoot(pb.schemaVersion, pb) } })
      const ledger = lean.createLeanLedger(join(dir, "store"), allocation), path = join(dir, "history"), binding = Object.freeze({ route: window.routeNamespace })
      fs.writeFileSync(path, "fixed history")
      const controller = continuationHelper.createLeanContinuationStageControllerV6([{ path, stat: fs.lstatSync(path) }], [], [{ path, role: "closed_history" }], binding, () => {})
      const stage = <T>(kind: continuationHelper.LeanContinuationStageV6, body: () => T) => controller.withStage(binding, kind, body)
      const entry = { schemaVersion: "lean-child-entry-v2", allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot: allocation.requestBytesRoot, head: allocation.sourceHead, parentPid: process.ppid, childPid: process.pid, handshakeRoot: root("synthetic-handshake"), wallStartMs: window.anchorMs, monotonicStartNs: process.hrtime.bigint().toString() }
      fs.writeFileSync(join(ledger.directory, "entry.json"), leanCanonicalBytes(entry), { mode: 0o600 }); lean.beginLeanInterval(ledger, "pilot-entry", window.anchorMs)
      const slot = allocation.slots[0]!, order: string[] = [], provider = vi.fn(async (charge: lean.LeanCharge) => { expect(lean.readLeanLedger(ledger).charges.get(slot.root)?.root).toBe(charge.root); order.push("inert-provider"); return "inert-no-Match" })
      const charge = () => { const value = lean.chargeLeanSlot(ledger, slot, { freeBytes: 100000000000, availableMemoryBytes: 4000000000 }); order.push("durable-charge"); if (mode === "closing") fs.writeFileSync(path, "drift"); return value }
      const start = () => { if (mode === "after-charge") fs.writeFileSync(path, "drift") }
      const action = parentApi.dispatchLeanContinuationChargedCellV6(stage, charge, start, provider)
      if (mode === "pass") { await expect(action).resolves.toMatchObject({ execution: "inert-no-Match" }); expect(order).toEqual(["durable-charge", "inert-provider"]) }
      else { await expect(action).rejects.toThrow(); expect(provider).not.toHaveBeenCalled(); expect(order).toEqual(["durable-charge"]); expect(() => controller.live(binding, () => {})).toThrow(/V6_CONTEXT/) }
      expect(lean.readLeanLedger(ledger)).toMatchObject({ charged: 51 }); expect(lean.readLeanLedger(ledger).charges.size).toBe(1)
      expect(() => lean.chargeLeanSlot(ledger, slot, { freeBytes: 100000000000, availableMemoryBytes: 4000000000 })).toThrow(/CHARGED/)
    } finally { clock.mockRestore(); cwd.mockRestore(); fs.rmSync(dir, { recursive: true }) }
  }, 15000)
})
describe("[continuation-ready-v7-N-parent] tiny real parent/failure custody (inert IPC/Git/resource/clock/PID observations)", () => {
  it.each(["v7", "v8", "v9", "v10", "v11"].flatMap(route => ((route === "v10" || route === "v11") ? ["source", "charge-closing", "progress", "dispatch-closing"] as const : route !== "v7" ? ["source", "resource", "fork-closing", "charge-closing", "progress", "slow-staging", "dispatch-closing"] as const : ["source", "resource", "fork-closing"] as const).map(mode => ({ v11: route === "v11", v8: route !== "v7", v10: (route === "v10" || route === "v11"), v9: route === "v9", mode, tag: route === "v11" ? "continuation-device-v11-driver-parent" : (route === "v10" || route === "v11") ? "continuation-next-v10-driver-parent" : route === "v9" ? "continuation-route-v9-driver-parent" : route !== "v7" && (mode === "slow-staging" || mode === "dispatch-closing") ? "continuation-startup-repair-A" : route !== "v7" ? "continuation-boundary-v8-Q" : "continuation-ready-v7-N-parent" }))))("$tag preserves spent bytes and nonaccepting observed-exit handling: $mode", async ({ mode, v8, v9, v10, v11 }) => {
    const began = performance.now(), dir = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "ready-v7-parent-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir)
    const p = v11 ? lean.LEAN_BASELINE_CONTINUATION_PATHS_V11 : v10 ? lean.LEAN_BASELINE_CONTINUATION_PATHS_V10 : v9 ? lean.LEAN_BASELINE_CONTINUATION_PATHS_V9 : v8 ? lean.LEAN_BASELINE_CONTINUATION_PATHS_V8 : lean.LEAN_BASELINE_CONTINUATION_PATHS_V7, fixedHead = "b".repeat(40), sourcePath = join(dir, "fixed-source"), stages: string[] = [], seen: string[] = []
    const syntheticApproval = v10 ? 1792241199000 : v9 ? 1792198286000 : v8 ? 1792093334000 : 1792017187000, syntheticA = v11 ? 1792242843861 : syntheticApproval + 12345, carryMs = 459375903 + (syntheticA - 1791807317000)
    const wb = { schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const, grantId: "synthetic-parent-no-custody", approvalEvidence: { humanDecisionId: v10 ? "human-approval-observed-20261017T124639Z" : v9 ? "human-approval-observed-20261017T005126Z" : v8 ? "human-approval-observed-20261015T194214Z" : "human-approval-observed-20261014T223307Z", recordedBy: "inert-root" }, approvedAtMs: syntheticApproval, anchorMs: syntheticA, deadlineMs: syntheticA + 28800000, carryMs, capMs: carryMs + 28800000, durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace: v11 ? "20261017-v11" as const : v10 ? "20261017-v10" as const : v9 ? "20261017-v9" as const : v8 ? "20261015-v8" as const : "20261014-v7" as const, reviewedSourceHead: "a".repeat(40), sourceRoot: root("tiny-parent-source"), sourceGateRoot: root("tiny-parent-source-gate"), planRoot: root("tiny-parent-plan"), runOperator: "inert-parent", readerOperator: "inert-reader" }, window = { ...wb, root: labRoot(wb.schemaVersion, wb) }
    const pb = { schemaVersion: "lean-baseline-continuation-carry-v2" as const, chargedMatches: 50 as const, elapsedUpperBoundMs: 465187899, allocatedDiskBytes: 88924160, residualDiskBytes: 4096, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, originalCarryRoot: root("synthetic-original"), closedCapsuleRoot: root("synthetic-capsule"), custodyRoot: root("synthetic-custody"), inventoryRoot: labRoot("lean-baseline-continuation-inventory-v2", []), qualifiedReaderAuthority: "cost_only" as const }
    const requestBytes = Buffer.from("synthetic parent request, not an empirical request"), requestRoot = leanBytesRoot(requestBytes)
    const allocation = lean.createLeanBaselineContinuationAllocationV2({ sourceRoot: window.sourceRoot, reviewRoot: root("tiny-review"), coldRoot: root("tiny-cold"), planRoot: window.planRoot, candidateRoots: [root("a"), root("b")], requestRoots: Array.from({ length: 36 }, (_, i) => root(`tiny-${i}`)), seed: "synthetic-tiny-parent", sourceHead: fixedHead, planningRoot: root("tiny-planning"), manifestRoot: root("tiny-manifest"), requestBytesRoot: requestRoot, window, windowBytesRoot: leanBytesRoot(leanCanonicalBytes(window)), sourceGateRoot: window.sourceGateRoot, dataReviewRoot: root("tiny-data"), predecessor: { ...pb, root: labRoot(pb.schemaVersion, pb) } })
    const actualPid = process.pid, pidDescriptor = Object.getOwnPropertyDescriptor(process, "pid")!, ppidDescriptor = Object.getOwnPropertyDescriptor(process, "ppid")!
    const clock = vi.spyOn(Date, "now").mockReturnValue(syntheticA + 100), usage = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...process.memoryUsage(), rss: 100000000, arrayBuffers: 0 }), resource = vi.spyOn(process, "resourceUsage").mockReturnValue({ ...process.resourceUsage(), maxRSS: 100000 }), available = vi.spyOn(leagueHost, "observeLeagueAvailableMemoryBytes").mockReturnValue(4000000000), disk = vi.spyOn(fs, "statfsSync").mockReturnValue({ bavail: 100000000000n, bsize: 1n } as never)
    let ledger!: LeanExperimentLedger, spentBytes: Buffer | undefined, currentCalls = 0, resourceCalls = 0, chargeClosingRefused = false
    const deniedProvider = vi.fn()
    let local: ReturnType<typeof parentApi.createLeanContinuationLocalReservationV8> | undefined, poll: (() => void) | undefined
    const actualInterval = globalThis.setInterval, interval = vi.spyOn(globalThis, "setInterval").mockImplementation(((callback: () => void, ms: number) => { poll = callback; return actualInterval(callback, ms) }) as typeof setInterval)
    const known = vi.spyOn(continuationHelper, "measureLeanContinuationKnownDisjointBytesV8").mockReturnValue(4096)
    const failureGuardReads: string[] = [], actualRead = continuationHelper.readLeanContinuationBoundedBytesV2
    const descriptorReads = vi.spyOn(continuationHelper, "readLeanContinuationBoundedBytesV2").mockImplementation((...args) => { failureGuardReads.push(args[0]); return actualRead(...args) })
    // The helper's JSON reader calls its own lexical descriptor function, so
    // count that real forwarding seam separately, without replacing either body.
    const failureGuardJsonReads: string[] = [], actualJsonRead = continuationHelper.readLeanContinuationJsonV2
    const jsonReads = vi.spyOn(continuationHelper, "readLeanContinuationJsonV2").mockImplementation((...args) => { failureGuardJsonReads.push(args[0]); return actualJsonRead(...args) })
    const actualUsage = usage.getMockImplementation()!; usage.mockImplementation(() => { resourceCalls++; return actualUsage() })
    let controller: ReturnType<typeof continuationHelper.createLeanContinuationStageControllerV6> | ReturnType<typeof continuationHelper.createLeanContinuationBoundaryControllerV8> | undefined
    const binding = Object.freeze({ namespace: window.routeNamespace, synthetic: true })
    const child = Object.assign(new EventEmitter(), { pid: actualPid + 1000, connected: true, exitCode: null as number | null, signalCode: null as NodeJS.Signals | null,
      kill: vi.fn((signal: NodeJS.Signals) => { seen.push("kill"); queueMicrotask(() => { if (child.exitCode !== null || child.signalCode !== null) return; child.signalCode = signal; seen.push("observed-exit"); child.emit("exit", null, signal) }); return true }),
      send: vi.fn(() => {
        // Only the inert IPC callback observes child PID/PPID. Actual entry,
        // admitted ledger, charge validation and durable append remain real.
        Object.defineProperty(process, "pid", { ...pidDescriptor, value: child.pid }); Object.defineProperty(process, "ppid", { ...ppidDescriptor, value: actualPid })
        try {
          if (mode === "charge-closing") {
            let charged = false; const childBinding = Object.freeze({ child: true }), childController = continuationHelper.createLeanContinuationBoundaryControllerV8([], [], [], childBinding, () => { if (charged) throw new Error("SYNTHETIC_CHARGE_CLOSING") }, () => {})
            void parentApi.dispatchLeanContinuationChargedCellV6((kind, body) => childController.withStage(childBinding, kind, body), () => { const charge = lean.chargeLeanSlot(ledger, allocation.slots[0]!, { freeBytes: 100000000000, availableMemoryBytes: 4000000000 }); charged = true; return charge }, () => {}, deniedProvider).catch(error => { expect((error as Error).message).toBe("SYNTHETIC_CHARGE_CLOSING"); chargeClosingRefused = true })
          } else {
            const charge = lean.chargeLeanSlot(ledger, allocation.slots[0]!, { freeBytes: 100000000000, availableMemoryBytes: 4000000000 })
            if (mode === "progress") {
              lean.retainLeanMatch(ledger, charge, { classification: "success", code: "OK", outcome: "DRAW", elapsedMs: 10, cleanupComplete: true, invocationCount: 0, accountingRoot: root("accounting"), executionRoot: root("execution"), telemetry: { transitions: 0, events: 0 } }, [], undefined, () => {})
              lean.chargeLeanSlot(ledger, allocation.slots[1]!, { freeBytes: 100000000000, availableMemoryBytes: 4000000000 })
            }
          }
        }
        finally { Object.defineProperty(process, "pid", pidDescriptor); Object.defineProperty(process, "ppid", ppidDescriptor) }
        spentBytes = fs.readFileSync(join(ledger.directory, "ledger.ndjson")); seen.push("durable-charge")
        // A real child runs after release returns. Mutate only in the inert
        // child-exit microtask, AFTER the parent's closing claim pass accepts.
        queueMicrotask(() => {
          if (mode === "progress") {
            // Real parent polling at a time where stale36 fails but35 fits.
            clock.mockReturnValue(window.deadlineMs - (v10 ? 1 : 36) * LEAN_CAPS.matchMs - window.closureMs - window.offlineOverheadMs + (v10 ? -1000 : 1))
            poll!(); expect(child.kill).not.toHaveBeenCalled(); seen.push("progress-poll-accepted")
            const path = join(ledger.directory, "ledger.ndjson"), original = fs.readFileSync(path), events = original.toString().trimEnd().split("\n").map(line => JSON.parse(line))
            const resourceRow = { kind: "resource", elapsedMs: window.carryMs + Date.now() - window.anchorMs, physicalBytes: 4096, bufferBytes: 0, scratchBytes: 0 }
            const mutations = {
              shrink: original.subarray(0, original.indexOf(10) + 1),
              rewrite: Buffer.from(original.toString().replace('"elapsedMs":10', '"elapsedMs":11')),
              malformed: Buffer.concat([original, Buffer.from('{"kind":')]),
              allocation: Buffer.concat([original, leanCanonicalBytes({ kind: "charge", charge: { ...events[0].charge, allocationRoot: root("foreign"), ordinal: 2 } }), Buffer.from("\n")]),
              terminal: Buffer.concat([original, leanCanonicalBytes({ ...events[1], chargeRoot: root("foreign-charge") }), Buffer.from("\n")]),
              future: Buffer.concat([original, leanCanonicalBytes({ ...resourceRow, elapsedMs: window.capMs + 1 }), Buffer.from("\n")]),
              debit: Buffer.concat([original, leanCanonicalBytes({ ...resourceRow, physicalBytes: LEAN_CAPS.retainedBytes }), Buffer.from("\n")]),
            }
            for (const [name, bytes] of Object.entries(mutations)) {
              const candidate = parentApi.createLeanContinuationLocalReservationV8(window); candidate.bindProgress(ledger); candidate.reserve()
              try { fs.writeFileSync(path, bytes); expect(() => candidate.reserve(), name).toThrow(/PROGRESS_CHANGED/); expect(() => candidate.reserve(), name).toThrow(/RESERVATION_SCOPE/) }
              finally { fs.writeFileSync(path, original) }
            }
            const foreign = parentApi.createLeanContinuationLocalReservationV8(window)
            expect(() => foreign.bindProgress({ ...ledger, directory: ledger.directory + "-foreign" })).toThrow(/PROGRESS_SCOPE/)
            seen.push("seven-progress-integrity-refusals")
            // Truthful unfinished count is35; V10 reserves ONE cell, legacy35.
            const priorPollMs = Date.now(), exhaustedMs = window.deadlineMs - (v10 ? 1 : 35) * LEAN_CAPS.matchMs - window.closureMs - window.offlineOverheadMs + 1
            expect(exhaustedMs).toBeGreaterThanOrEqual(priorPollMs)
            clock.mockReturnValue(exhaustedMs)
            poll!(); expect(localRefusal).toBeInstanceOf(TypeError); expect((localRefusal as Error).message).toMatch(/V8_RESERVATION_CAPACITY/)
            expect(child.kill).toHaveBeenCalledWith("SIGKILL"); seen.push("inflight-reserve-refused"); return
          }
          fs.writeFileSync(sourcePath, "changed source"); if (mode === "resource") usage.mockReturnValue({ ...actualUsage(), rss: 3000000001 }); child.exitCode = 0; seen.push("observed-exit"); child.emit("exit", 0, null)
        }); return true
      }),
    })
    const releaseEffect = child.send
    const childHost = Object.assign(new EventEmitter(), { pid: child.pid, ppid: actualPid, connected: true, send: vi.fn((message: unknown) => { seen.push("child-control"); child.emit("message", message) }) })
    let childWait: Promise<unknown> | undefined
    if (v8) child.send = vi.fn((...args: unknown[]) => { seen.push(ownMessageKind(args[0])); childHost.emit("message", args[0]); return true })
    const fork = vi.spyOn(childProcess, "fork").mockImplementation(() => { seen.push("fork"); if (mode === "fork-closing") fs.writeFileSync(sourcePath, "changed source"); else queueMicrotask(() => { if (!v8) { child.emit("message", { ready: child.pid }); return }; childWait = parentApi.waitLeanContinuationReleaseV8(() => { if (Date.now() >= window.deadlineMs) throw new Error("SYNTHETIC_WINDOW") }, childHost).then(token => { expect(token).toMatch(/^[a-f0-9]{64}$/); seen.push("child-token-accepted"); releaseEffect() }).catch(() => { seen.push("child-refused") }) }); return child as never })
    const git = vi.spyOn(childProcess, "execFileSync").mockImplementation(((command: string, args: readonly string[]) => {
      if (command === "ps") return "100\n"
      if (command === "git" && args[0] === "rev-parse" && args[1] === "HEAD") return fixedHead
      if (command === "git" && args[0] === "show" && args[1] === `HEAD:${p.allocation}`) return Buffer.from(leanCanonicalBytes(allocation))
      throw new Error("UNEXPECTED_TINY_PARENT_EXTERNAL_CALL")
    }) as typeof childProcess.execFileSync)
    let localRefusal: unknown
    const invalidated = vi.fn(() => { controller!.invalidate(); local?.invalidate() }), beforeTerminal = vi.fn(() => local?.closeRun())
    try {
      fs.mkdirSync(resolve(".planning/artifacts"), { recursive: true }); fs.mkdirSync(resolve(p.temp), { recursive: true, mode: 0o700 }); fs.writeFileSync(resolve(p.request), requestBytes, { mode: 0o600 }); fs.writeFileSync(resolve(p.window), leanCanonicalBytes(window), { mode: 0o600 }); fs.writeFileSync(sourcePath, "fixed source")
      ledger = lean.createLeanLedger(resolve(p.store), allocation); fs.writeFileSync(resolve(p.allocation), leanCanonicalBytes(allocation), { mode: 0o644 }); fs.chmodSync(resolve(p.allocation), 0o644)
      fs.writeFileSync(join(ledger.directory, "carry.json"), leanCanonicalBytes({ inventory: [] }), { mode: 0o600 })
      lean.beginLeanInterval(ledger, "continuation-run-admission"); lean.closeLeanInterval(ledger, "continuation-run-admission")
      // The real monotonic close rounds up; start the later pilot beyond that
      // synthetic admission close, rather than fabricating a backward journal.
      clock.mockReturnValue(v10 ? window.deadlineMs - 3061000 : syntheticA + 1000)
      if (mode === "progress") { local = parentApi.createLeanContinuationLocalReservationV8(window); local.bindProgress(ledger) }
      const pins = [{ path: sourcePath, stat: fs.lstatSync(sourcePath) }], roles = [{ path: sourcePath, role: "fixed_source" }], current = () => { currentCalls++; if (performance.now() - began > 12000) throw new Error("TINY_PARENT_CENSORED") }
      controller = v8 ? continuationHelper.createLeanContinuationBoundaryControllerV8(pins, [], roles, binding, current, () => { if (local) { try { local.reserve() } catch (error) { localRefusal = error; throw error }; return }; const usage = process.memoryUsage(); if (usage.rss > 3000000000) throw new Error("RESOURCE_DENIED") }) : continuationHelper.createLeanContinuationStageControllerV6(pins, [], roles, binding, current)
      const stage = <T>(kind: continuationHelper.LeanContinuationStageV6, body: () => T): T => { stages.push(kind); const value = controller!.withStage(binding, kind, body); if (mode === "slow-staging" && ["import", "claim", "dispatch"].includes(kind)) { clock.mockReturnValue(Date.now() + 45000); expect(seen).not.toContain("armRelease"); expect(lean.readLeanLedger(ledger).charges.size).toBe(0) }; if (mode === "dispatch-closing" && kind === "dispatch") throw new Error("SYNTHETIC_DISPATCH_CLOSING"); return value }
      const action = parentApi.runLeanBoundedParent({ ledger, requestPath: p.request, allocationPath: p.allocation, store: ledger.directory, sourceRoot: allocation.sourceRoot, manifestRoot: () => allocation.sourceRoot, childMode: "child-continuation-v2", prospectiveStart: { wallStartMs: syntheticA + 1000, monotonicStartNs: process.hrtime.bigint().toString() }, stage, beforeRelease: () => controller!.live(binding, () => {}), beforeTerminal, onFailure: invalidated, terminalReserveMs: window.closureMs, supervisorObservation: true })
      await expect(action).rejects.toThrow(mode === "dispatch-closing" ? /SYNTHETIC_DISPATCH_CLOSING/ : mode === "source" || mode === "charge-closing" || mode === "progress" || mode === "slow-staging" ? /CHILD_FAILED/ : mode === "resource" ? /V2_CAPACITY/ : /PIN_CHANGED/)
      expect(fork).toHaveBeenCalledTimes(1); expect(seen).toContain("observed-exit"); expect(currentCalls).toBeGreaterThan(0)
      expect(() => controller!.live(binding, () => {})).toThrow(/V[68]_CONTEXT/)
      if (mode === "fork-closing") {
        expect(child.kill).toHaveBeenCalledWith("SIGKILL"); expect(child.send).not.toHaveBeenCalled(); expect(lean.readLeanLedger(ledger).charged).toBe(50); expect(lean.readLeanTimeAccounting(ledger).starts.has("pilot-entry")).toBe(false)
      } else if (mode === "dispatch-closing") {
        expect(seen).not.toContain("armRelease"); expect(seen).not.toContain("release"); expect(lean.readLeanLedger(ledger).charges.size).toBe(0); expect(lean.readLeanTimeAccounting(ledger).closed.has("pilot-entry")).toBe(true)
      } else {
        expect(seen.indexOf("durable-charge")).toBeLessThan(seen.indexOf("observed-exit")); expect(fs.readFileSync(join(ledger.directory, "ledger.ndjson"))).toEqual(spentBytes)
        expect(lean.readLeanLedger(ledger).charged).toBe(mode === "progress" ? 52 : 51); expect(lean.readLeanLedger(ledger).charges.size).toBe(mode === "progress" ? 2 : 1); expect(invalidated).toHaveBeenCalledTimes(1); expect(beforeTerminal).toHaveBeenCalledTimes(1)
        if (mode === "source" || mode === "charge-closing" || mode === "progress" || mode === "slow-staging") {
          const terminal = lean.readLeanChildTerminal(ledger), time = lean.readLeanTimeAccounting(ledger), reason = JSON.parse(fs.readFileSync(join(ledger.directory, "parent-supervisor-reasons.json"), "utf8"))
          expect(terminal.status).toBe("child_failed"); expect(time.closed.has("pilot-entry")).toBe(true); expect(time.active).toBe(false)
          expect(reason).toMatchObject({ uncertain: true, observations: { cleanup: "child_exit_observed", finalIdentity: mode === "progress" ? "matched" : "exception", initiatingCause: "unknown" } }); expect(resourceCalls).toBeGreaterThan(4)
          expect(failureGuardJsonReads.filter(path => path === join(ledger.directory, "carry.json"))).toHaveLength(2)
        } else {
          expect(fs.existsSync(join(ledger.directory, "child-terminal.json"))).toBe(false); expect(fs.existsSync(join(ledger.directory, "parent-supervisor-reasons.json"))).toBe(false); expect(lean.readLeanTimeAccounting(ledger).closed.has("pilot-entry")).toBe(false)
        }
      }
      expect(fs.existsSync(join(ledger.directory, "retained-check.json"))).toBe(false); expect(fs.existsSync(join(ledger.directory, "result.json"))).toBe(false)
      const bytes = fs.readdirSync(ledger.directory).reduce((n, name) => n + fs.statSync(join(ledger.directory, name)).size, 0)
      expect(bytes).toBeLessThan(64 * 1024 * 1024)
      expect(seen.filter(event => event === "observed-exit")).toHaveLength(1)
      if (mode === "charge-closing") { expect(chargeClosingRefused).toBe(true); expect(deniedProvider).not.toHaveBeenCalled(); expect(lean.readLeanLedger(ledger).charged).toBe(51) }
      if (mode === "slow-staging") { expect(seen.filter(x => x === "armRelease")).toHaveLength(1); expect(seen.indexOf("child-token-accepted")).toBeLessThan(seen.indexOf("durable-charge")); expect(Date.now()).toBeGreaterThan(syntheticA + 90000) }
      process.stdout.write(`FINITE_SYNTHETIC_${v8 ? "V8" : "V7"}_PARENT ${JSON.stringify({ mode, status: "COMPLETE", sampleMs: Math.ceil(performance.now() - began), actualFileBytes: bytes, stages, seen, charged: lean.readLeanLedger(ledger).charged, resourceCalls, currentCalls, failureGuardDescriptorReads: failureGuardReads.length, failureGuardCarryReads: failureGuardJsonReads.length, realParentLedgerController: true, realDurableChargeAndFailureGuardReached: mode !== "fork-closing", gitResourceClockIpcPidObservationsMocked: true, historicalAuthenticationCovered: false, runtimeFitEstablished: false })}\n`)
    } finally {
      childHost.connected = false; childHost.emit("disconnect"); await childWait
      Object.defineProperty(process, "pid", pidDescriptor); Object.defineProperty(process, "ppid", ppidDescriptor)
      const cleanupBegan = performance.now()
      for (const spy of [git, fork, clock, usage, resource, available, disk, descriptorReads, jsonReads, interval, known]) spy.mockRestore(); cwd.mockRestore(); fs.rmSync(dir, { recursive: true }); expect(performance.now() - began).toBeLessThan(15000)
      process.stdout.write(`FINITE_SYNTHETIC_${v8 ? "V8" : "V7"}_PARENT_CLOSED ${JSON.stringify({ mode, endToEndMs: Math.ceil(performance.now() - began), cleanupMs: Math.ceil(performance.now() - cleanupBegan), constructionSampleCleanupBoundMs: 15000 })}\n`)
    }
  }, 15000)
})
describe("[continuation-preledger-policy] actual unconsumed V6 caller", () => {
  it.each(["source", "archive"] as const)("[CR-PRE-01] rejects fresh CWD drift in actual %s callback before resource/Git/input effects (CWD/HEAD seams inert)", stage => preledgerFixtureV6(f => {
    let before: typeof f.counts | undefined
    f.onCurrent.value = () => {
      if (before || stage === "archive" && f.detail.archiveOpened === 0) return
      before = { ...f.counts }; f.moveCwd()
    }
    expect(() => parentApi.prepareLeanBaselineContinuationV2(lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request)).toThrow(/V6_CONTEXT/)
    expect(before).toBeDefined(); expect(f.counts).toEqual(before)
    f.assertInvalid(); f.absent()
  }), 15000)
  it("[CR-PRE-02] retains relative-name privacy semantics when fixture checkout ancestor contains sealed", () => preledgerFixtureV6(f => {
    expect(() => parentApi.prepareLeanBaselineContinuationV2(lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request)).toThrow(/V2_ALLOCATION_ANCHOR/)
    for (const callback of f.callbacks) expect(callback).toEqual({ windowHashes: 0, heads: 3, capacities: 33, inputReads: 6 })
    f.absent()
  }, 0, true), 15000)
  it("captures pure scope/window once while every completed callback keeps THREE current/33capacity/3HEAD/6input reads", () => preledgerFixtureV6(f => {
    expect(() => parentApi.prepareLeanBaselineContinuationV2(lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request)).toThrow(/V2_ALLOCATION_ANCHOR/)
    expect(f.callbacks.length).toBeGreaterThan(0)
    for (const callback of f.callbacks) expect(callback).toEqual({ windowHashes: 0, heads: 3, capacities: 33, inputReads: 6 })
    f.absent()
  }), 15000)
  it.each(["head", "head-format", "head-length", "window", "request", "resource", "deadline", "backward", "unsafe"] as const)("refuses fresh %s drift before setup, retaining real caller execution", mode => preledgerFixtureV6(f => {
    let injected = false
    f.onCurrent.value = () => {
      if (injected) return
      injected = true
      if (mode.startsWith("head")) {
        const original = vi.mocked(childProcess.execFileSync).getMockImplementation()!
        vi.mocked(childProcess.execFileSync).mockImplementation(((...args: Parameters<typeof childProcess.execFileSync>) => args[0] === "git" && (args[1] as readonly string[])[0] === "rev-parse" ? Buffer.from(mode === "head" ? "c".repeat(40) : mode === "head-length" ? "b".repeat(129) : "b".repeat(40) + "\n\n") : Reflect.apply(original, childProcess, args)) as typeof childProcess.execFileSync)
      }
      if (mode === "window" || mode === "request") fs.writeFileSync(resolve(lean.LEAN_BASELINE_CONTINUATION_PATHS_V6[mode]), "{}")
      if (mode === "resource") vi.mocked(process.memoryUsage).mockReturnValue({ ...process.memoryUsage(), rss: 4000000000 })
      if (mode === "deadline") vi.mocked(Date.now).mockReturnValue(f.window.deadlineMs - 36 * LEAN_CAPS.matchMs - f.window.closureMs - f.window.offlineOverheadMs + 1)
      if (mode === "backward") vi.mocked(Date.now).mockReturnValue(f.window.anchorMs - 1)
      if (mode === "unsafe") vi.mocked(Date.now).mockReturnValue(Number.MAX_SAFE_INTEGER + 1)
    }
    const error = mode === "head" ? /V2_HEAD_CHANGED/ : mode.startsWith("head-") ? /GIT_V2_METADATA/ : mode === "window" || mode === "request" ? /V6_CONTEXT_BYTES/ : mode === "resource" ? /V2_CAPACITY/ : mode === "deadline" ? /V2_WINDOW_EXPIRED/ : /LEAN_EXPERIMENT_CONTINUATION_V2_CLOCK/
    expect(() => parentApi.prepareLeanBaselineContinuationV2(lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request)).toThrow(error)
    expect(injected).toBe(true); f.absent()
  }), 15000)
  it.each(["forged", "deep-mutation", "cross-window", "approval-array"] as const)("strict real window caller rejects %s before policy issuance", mode => preledgerFixtureV6(f => {
    const w = JSON.parse(Buffer.from(leanCanonicalBytes(f.window)).toString()) as lean.LeanBaselineContinuationWindowV2
    if (mode === "forged") w.root = root("forged")
    if (mode === "deep-mutation") w.approvalEvidence.recordedBy = "changed"
    if (mode === "cross-window") { w.routeNamespace = "20261013-v5"; const { root: _root, ...body } = w; w.root = labRoot(body.schemaVersion, body) }
    if (mode === "approval-array") w.approvalEvidence = [] as never
    fs.writeFileSync(resolve(lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.window), leanCanonicalBytes(w))
    expect(() => parentApi.prepareLeanBaselineContinuationV2(lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request)).toThrow(/WINDOW/)
    expect(f.callbacks).toEqual([]); f.absent()
  }), 15000)
  it.each(["mutable", "deep-mutable"] as const)("rejects a %s strict-validator output at private issuance (validator-output seam explicitly mocked)", mode => preledgerFixtureV6(f => {
    const actual = lean.validateLeanBaselineContinuationWindowV2, validate = vi.spyOn(lean, "validateLeanBaselineContinuationWindowV2").mockImplementation(value => {
      const w = actual(value), copy = { ...w, approvalEvidence: { ...w.approvalEvidence } }
      return mode === "mutable" ? copy : Object.freeze(copy)
    })
    try { expect(() => parentApi.prepareLeanBaselineContinuationV2(lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request)).toThrow(/V6_PREFLIGHT_EXPECTATIONS/); expect(f.callbacks).toEqual([]); f.absent() }
    finally { validate.mockRestore() }
  }), 15000)
  it("actual default-zero caller admits exactly the whole36 cutoff and accepts fresh 40hex without newline", () => preledgerFixtureV6(f => {
    const cutoff = f.window.deadlineMs - 36 * LEAN_CAPS.matchMs - f.window.closureMs - f.window.offlineOverheadMs
    expect(lean.leanBaselineContinuationElapsedFloorV2(f.window, cutoff) + 36 * LEAN_CAPS.matchMs + f.window.closureMs + f.window.offlineOverheadMs).toBe(f.window.capMs)
    const original = vi.mocked(childProcess.execFileSync).getMockImplementation()!
    let heads = 0
    vi.mocked(childProcess.execFileSync).mockImplementation(((...args: Parameters<typeof childProcess.execFileSync>) => {
      const bytes = Reflect.apply(original, childProcess, args)
      if (args[0] === "git" && (args[1] as readonly string[])[0] === "rev-parse") { heads++; return Buffer.from(String(bytes).trim()) }
      return bytes
    }) as typeof childProcess.execFileSync)
    f.onCurrent.value = () => { vi.mocked(Date.now).mockReturnValue(cutoff) }
    expect(() => parentApi.prepareLeanBaselineContinuationV2(lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request)).toThrow(/V2_ALLOCATION_ANCHOR/)
    expect(heads).toBeGreaterThan(3); expect(f.callbacks.length).toBeGreaterThan(0); f.absent()
  }), 15000)
  it("SOURCE-EXTRACTED synthetic arithmetic parity only: journal/monotonic inputs are not actual preflight branch coverage", () => {
    // No exported policy/test mint. This executes only the isolated exact pure
    // arithmetic source body, never the module/compiler or hostile Strategy.
    const source = fs.readFileSync(resolve("scripts/run-v1-38-lean-baseline.ts"), "utf8"), match = source.match(/const continuationPreflightElapsedV6 = [^\n]+=> \{\n([\s\S]*?)\n\}/u)
    expect(match).not.toBeNull()
    const arithmetic = new Function("w", "nowMs", "journalMs", "monotonicSinceAnchorMs", "leanContinuationGlobalFloorV2", match![1]!.replace("(n: number)", "(n)")) as (w: lean.LeanBaselineContinuationWindowV2, now: number, journal: number, monotonic: number, global: typeof lean.leanContinuationGlobalFloorV2) => number
    preledgerFixtureV6(f => {
      const result = (body: () => number) => { try { return body() } catch (error) { return (error as Error).message } }
      for (const [now, journal, monotonic] of [[f.window.anchorMs, 0, 0], [f.window.anchorMs + 1, 0, 0], [f.window.deadlineMs, f.window.capMs, 1], [f.window.anchorMs + 10, f.window.carryMs + 100, 20], [f.window.anchorMs - 1, 0, 0], [Number.MAX_SAFE_INTEGER + 1, 0, 0], [f.window.anchorMs, -1, 0], [f.window.anchorMs, 0, -1], [f.window.anchorMs, 0, Number.MAX_SAFE_INTEGER], [f.window.anchorMs, Number.MAX_SAFE_INTEGER, 0]]) {
        expect(result(() => arithmetic(f.window, now!, journal!, monotonic!, lean.leanContinuationGlobalFloorV2))).toEqual(result(() => lean.leanBaselineContinuationElapsedFloorV2(f.window, now!, journal!, monotonic!)))
      }
    })
    expect(source).not.toMatch(/export (?:const|function) (?:compileContinuationPreflight|captureContinuationPreflight|continuationPreflightElapsed)/u)
  })
})
describe("[continuation-preledger-carry] actual V6 PREPARE to immutable anchor refusal only", () => {
  it("reports actual source/full/live observations separately; no archive closing/capture is credited", () => preledgerFixtureV6(f => {
    expect(() => parentApi.prepareLeanBaselineContinuationV2(lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request)).toThrow(/V2_ALLOCATION_ANCHOR/)
    const observed = f.detail
    expect(observed, "connected observation accounting must exist").toBeDefined()
    expect(observed!.sourceClosed).toBe(1); expect(observed!.archiveOpened).toBe(1); expect(observed!.archiveClosed).toBe(0)
    expect(observed!.fullVisits).toBeGreaterThan(0); expect(observed!.liveVisits).toBeGreaterThan(0)
    f.absent()
  }), 15000)
  it.each([0, 32])("finite SOURCE sensitivity sample extra=%i is anchor-refusal coverage, not completed custody", extra => preledgerFixtureV6(f => {
    const before = { ...f.detail, ...f.counts }, began = performance.now(); let status = "COMPLETE", refusal = ""
    try { parentApi.prepareLeanBaselineContinuationV2(lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request) } catch (error) { refusal = (error as Error).message; if (refusal === "SOURCE_FIXTURE_CENSORED") status = "CENSORED" }
    expect(refusal).toBe(status === "COMPLETE" ? "LEAN_BASELINE_CONTINUATION_V2_ALLOCATION_ANCHOR" : "SOURCE_FIXTURE_CENSORED")
    const sample = Object.fromEntries(Object.entries({ ...f.detail, ...f.counts }).map(([key, value]) => [key, value - before[key as keyof typeof before]]))
    for (const callback of f.callbacks) expect(callback).toEqual({ windowHashes: 0, heads: 3, capacities: 33, inputReads: 6 })
    expect(f.detail.capturedSurvivors).toBe(0); expect(f.detail.liveUnion).toBe(17); expect(f.detail.physicalScans).toBe(0); expect(f.detail.journalReads).toBe(0); expect(f.detail.archiveClosed).toBe(0)
    if (status === "COMPLETE") {
      expect(f.detail.sourceClosed).toBe(1); expect(f.detail.archiveOpened).toBe(1)
      expect(f.detail.fullOpeningVisits).toBe(2 * f.detail.union); expect(f.detail.fullClosingVisits).toBe(f.detail.union)
      expect(f.detail.liveOpeningVisits).toBe(f.callbacks.length * f.detail.liveUnion); expect(f.detail.liveClosingVisits).toBe(f.callbacks.length * f.detail.liveUnion)
      expect(f.detail.liveInputRawHashes).toBe(6 * f.callbacks.length)
      expect(f.detail.inputRawHashes - before.inputRawHashes).toBe(6 * f.callbacks.length + 11) // four stage currents*2, plus strict manifest*2 and initial request*1
    }
    f.assertInvalid(); f.absent()
    process.stdout.write(`FINITE_SYNTHETIC_PRELEDGER_BRANCH1 ${JSON.stringify({ status, extra, sampleMs: Math.ceil(performance.now() - began), initialization: f.initialization, sample, callbacksCompleted: f.callbacks.length, union: f.detail.union, liveUnion: f.detail.liveUnion, refusal, custodyComplete: false, archiveClosingAccepted: false, actualDriverBindArchiveCovered: false, fullHistoricalCapsuleImportCovered: false, exactV6SpentSuccessCovered: false, rawAndDomainHashesReal: true, gitResourcesClockFactoryCatalogMocked: true, runtimeFitEstablished: false })}\n`)
  }, extra), 15000)
})
it("[continuation-remaining-overhead] [VF-REM-BUILTIN-01] preserves the actual audited factory reachability boundary without direct consumer util imports", () => {
  const result = checkFactoryBoundaries()
  expect(result).toMatchObject({ ok: true, violations: [] }); expect(result.scannedFiles).toBeGreaterThan(1000)
  for (const path of ["scripts/lib/v1-38-lean-baseline-continuation.ts", "scripts/run-v1-38-lean-baseline.ts"]) expect(fs.readFileSync(resolve(path), "utf8")).not.toMatch(/from ["']node:util["']/u)
  const trap = vi.fn(() => { throw new Error("HOSTILE_INSPECTION") }), proxy = new Proxy({}, { get: trap, getPrototypeOf: trap, ownKeys: trap }), revoked = Proxy.revocable({}, {})
  revoked.revoke()
  expect(lean.leanHostIsProxy(proxy)).toBe(true); expect(lean.leanHostIsProxy(revoked.proxy)).toBe(true); expect(lean.leanHostIsProxy({})).toBe(false)
  expect(lean.leanHostIsNativeError(new Error("inert"))).toBe(true); expect(lean.leanHostIsNativeError(proxy)).toBe(false); expect(lean.leanHostIsNativeError(revoked.proxy)).toBe(false)
  expect(trap).not.toHaveBeenCalled()
  process.stdout.write(`AUDITED_FACTORY_BOUNDARY_REGRESSION ${JSON.stringify(result)}\n`)
}, 30000)
describe("[continuation-overhead] actual V2 context complete guard", () => {
  const constructionCensored = Symbol("bounded-construction-censor")
  const cadenceCounts = () => ({ fullVisits: 0, liveVisits: 0, fullPasses: 0, livePasses: 0, rawHashes: 0, windowRawHashes: 0, journalBytesRawHashes: 0, sourceRawHashes: 0, domainHashes: 0, windowDomainHashes: 0, physicalSamples: 0, chunks: 0, headChecks: 0, descriptorReads: 0, reservations: 0, memberships: 0 })
  const invokeRun = async (request: string) => {
    const send = Object.getOwnPropertyDescriptor(process, "send")
    Object.defineProperty(process, "send", { value: undefined, configurable: true, writable: true })
    try { return await parentApi.runLeanBaselineContinuationV2(request) }
    finally { if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send") }
  }
  it.each([{ n: 26, u: 128 }, { n: 2280, u: 2352 }])("[continuation-stage-cadence-scale] bounded actual V6 visitor N$n/U$u with TWO full barrier passes or construction censor", async ({ n, u }) => {
    const totalStart = performance.now()
    let report: Record<string, any> = {}
    try { await fixture((c, f) => {
      const setupMs = performance.now() - f.fixtureStartMs, stopAt = totalStart + 8000, censored = Symbol("bounded-source-assay")
      let callbacks = 0, rowsCompleted = 0, maximumGuardMs = 0, status: "COMPLETE" | "CENSORED" = "COMPLETE", guardMs = 0
      f.clearObservations(); f.hashes.mockClear()
      const callback = () => {
        if (performance.now() + Math.max(800, maximumGuardMs * 3) >= stopAt) throw censored
        const began = performance.now(); c.guard(); const elapsed = performance.now() - began
        guardMs += elapsed; maximumGuardMs = Math.max(maximumGuardMs, elapsed); callbacks++
      }
      c.stage("archive", () => {
        try {
          // Exercise a real source chunk owner with the same active caller,
          // followed by the ACTUAL selected-V6 inventory visitor, not a loop.
          const source = c.manifest.implementationEntries[0]!
          const sourceBytes = continuationHelper.readLeanContinuationBoundedBytesV2(source.path, 4194304, 0o644, callback)
          lean.leanBytesRoot(sourceBytes)
          f.visitor.active = true
          const rows = continuationHelper.inventoryLeanContinuationSurvivorsV2(f.assayRows, [], () => { throw new Error("NO_GIT_FOR_SYNTHETIC_CLOSED_ROWS") }, callback, c.window)
          rowsCompleted = rows.length; expect(rows).toHaveLength(n)
        } catch (error) { if (error !== censored) throw error; status = "CENSORED" }
        finally { f.visitor.active = false }
      })
      const counts = { ...f.cadence }
      if (n === 26) { expect(status).toBe("COMPLETE"); expect(f.visitor.completed).toBe(n); expect(rowsCompleted).toBe(n) }
      expect(counts.fullPasses).toBe(2); expect(counts.fullVisits).toBe(2 * u)
      expect(counts.livePasses).toBeGreaterThan(0); expect(counts.liveVisits).toBeGreaterThan(0)
      for (const key of ["rawHashes", "windowRawHashes", "journalBytesRawHashes", "sourceRawHashes", "physicalSamples", "chunks", "headChecks", "descriptorReads", "reservations", "memberships"] as const) expect(counts[key], key).toBeGreaterThan(0)
      expect(performance.now() - totalStart).toBeLessThan(8000)
      report = { n, u, status, rowsCompleted: f.visitor.completed, callbacks, counts, setupMs: Math.ceil(setupMs), sampleMs: Math.ceil(performance.now() - f.fixtureStartMs - setupMs), guardMs: Math.ceil(guardMs), overlappingControllerMs: Math.ceil(f.timing.identityMs), overlappingPhysicalMs: Math.ceil(f.timing.physicalMs), overlappingReadMs: Math.ceil(f.timing.readMs), timingsOverlap: true, addedFixtureBytesBound: f.fixtureExtraBound, contextAuthenticated: false, sourceAndCustodyInputsMocked: true, resourceInputsMocked: true, sourceManifestProjected: false, legacyInventoryOnlyFullVisitAlgebra: 2 * u * (2 * n + 1), assuranceEquivalent: false, staticEditAndRestoreBetweenBarriersMayEvade: true, runtimeFitEstablished: false }
    }, "20261014-v6", { n, u, constructionStopAt: totalStart + 6500, onConstructionCensor: (counts, setupMs) => { report = { n, u, status: "CENSORED-before-visitor", rowsCompleted: 0, callbacks: 0, counts, setupMs: Math.ceil(setupMs), sampleMs: 0, inventoryCoverage: 0, fullBarrierCoverage: 0, addedFixtureBytesBound: u * 16384 + n * 1024, contextAuthenticated: false, sourceAndCustodyInputsMocked: true, resourceInputsMocked: true, sourceManifestProjected: false, runtimeFitEstablished: false, assuranceEquivalent: false, staticEditAndRestoreBetweenBarriersMayEvade: true } } }) }
    catch (error) { if (error !== constructionCensored) throw error }
    report.totalMs = Math.ceil(performance.now() - totalStart); report.cleanupIncluded = true
    report.cleanupMs = Math.max(0, report.totalMs - report.setupMs - report.sampleMs)
    report.pureWindowDomainHashInputsMocked = true
    report.journalRawCategoryIncludesEmptySyntheticBuffers = true
    report.addedFixtureBytesBound = u * 16384 + n * 1024 + 3 * 1024 * 1024
    expect(report.totalMs).toBeLessThan(8000); expect(report.addedFixtureBytesBound).toBeLessThanOrEqual(67108864)
    process.stdout.write(`FINITE_SYNTHETIC_STAGE_CADENCE_ASSAY ${JSON.stringify(report)}\n`)
  }, 15000)
  const fixture = async (run: (c: ReturnType<typeof parentApi.openLeanBaselineContinuationContextV2>, f: { passes: string[][]; reservations: number[]; hashes: { mockClear: () => unknown; mock: { calls: Parameters<typeof contracts.labRoot>[] } }; head: { value: string }; w: lean.LeanBaselineContinuationWindowV2; clearObservations: () => void; observationCounts: () => { physical: number; chunks: number }; timing: { identityMs: number; physicalMs: number; readMs: number; realpathMs: number }; assayRows: continuationHelper.LeanContinuationInventoryRowV2[]; fixtureStartMs: number; fixtureExtraBound: number; authBoundary: { guard?: (additional?: number) => continuationHelper.LeanContinuationFrontier; error?: unknown; attempts: number; completed: number }; realpaths: ReturnType<typeof vi.spyOn>; cadence: ReturnType<typeof cadenceCounts>; visitor: { active: boolean; completed: number } }) => void | Promise<void>, namespace: lean.LeanBaselineContinuationWindowV2["routeNamespace"] = "20261012-v3", assay?: { n: number; u: number; constructionStopAt?: number; onConstructionCensor?: (counts: ReturnType<typeof cadenceCounts>, setupMs: number) => void }) => {
    const fixtureStartMs = performance.now()
    const cadence = cadenceCounts()
    const constructionDeadline = () => { if (assay?.constructionStopAt !== undefined && performance.now() >= assay.constructionStopAt) { assay.onConstructionCensor?.({ ...cadence }, performance.now() - fixtureStartMs); throw constructionCensored } }
    const frames: { mode: "full" | "live"; body: boolean; current: boolean }[] = []
    const visitor = { active: false, completed: 0, observations: new Map<string, number>(), terminalObservation: new Map<string, number>() }
    // Bounded SOURCE fixture only: no statfs/capacity probe before construction.
    const fixtureExtraBound = assay ? assay.u * 16384 + assay.n * 1024 + 3 * 1024 * 1024 : 0
    expect(fixtureExtraBound).toBeLessThanOrEqual(64 * 1024 * 1024)
    expect(process.memoryUsage().heapUsed + fixtureExtraBound).toBeLessThan(768 * 1024 * 1024)
    const dir = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "continuation-context-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir), p = namespace === "20261014-v6" ? lean.LEAN_BASELINE_CONTINUATION_PATHS_V6 : namespace === "20261013-v5" ? lean.LEAN_BASELINE_CONTINUATION_PATHS_V5 : lean.LEAN_BASELINE_CONTINUATION_PATHS_V2, head = { value: "c".repeat(40) }, sourceHead = "b".repeat(40), reviewedHead = "a".repeat(40)
    const sourcePaths = [...parentApi.LEAN_BASELINE_CONTINUATION_OWNED_PATHS, "scripts/run-v1-38-lean-baseline.sh", "scripts/lib/v1-38-lean-baseline-analysis.ts", "scripts/lib/v1-38-lean-baseline-metrics.ts", "scripts/lib/v1-38-lean-cold-corpus.ts", "scripts/lib/v1-38-lean-seal-metadata.ts", "scripts/lib/v1-38-lean-training-adapter.ts", "scripts/lib/v1-38-lean-baseline.ts", "packages/strategy-lab/src/league/lean-training.ts", "scripts/run-v1-38-lean-experiment.ts", "scripts/lib/v1-38-lean-child-cli-terminal.ts", "scripts/lib/v1-38-factory-supervised-runtime.ts", "scripts/lib/v1-38-league-prospective-lifetime.ts", "packages/strategy-lab/src/league/lean-training.test.ts", "scripts/lib/v1-38-lean-baseline-analysis.test.ts", "scripts/lib/v1-38-lean-baseline-source.test.ts", "scripts/lib/v1-38-lean-startup-supervisor-v8.mjs", "AGENTS.md"]
    const write = (path: string, bytes: string | Uint8Array, mode = 0o644) => { const absolute = resolve(path); fs.mkdirSync(resolve(absolute, ".."), { recursive: true }); fs.writeFileSync(absolute, bytes, { mode }); fs.chmodSync(absolute, mode) }
    const actualStat = fs.lstatSync, actualExists = fs.existsSync, stat = vi.spyOn(fs, "lstatSync").mockImplementation(((path: string, ...args: unknown[]) => { const frame = frames.at(-1), absolute = resolve(String(path)); if (frame && !frame.body && !frame.current) cadence[frame.mode === "full" ? "fullVisits" : "liveVisits"]++; const result = (actualStat as any)(absolute, ...args); if (visitor.active && frame?.mode === "full" && frame.body && !frame.current && visitor.terminalObservation.has(absolute)) { const count = (visitor.observations.get(absolute) ?? 0) + 1; visitor.observations.set(absolute, count); if (count === visitor.terminalObservation.get(absolute)) visitor.completed++ } return result }) as typeof fs.lstatSync), exists = vi.spyOn(fs, "existsSync").mockImplementation(path => actualExists(resolve(String(path))))
    const factory = vi.spyOn(factoryImplementation, "factoryAssessmentImplementationManifest").mockReturnValue({ entries: [], root: root("bounded-factory") })
    const disk = vi.spyOn(fs, "statfsSync").mockReturnValue({ bavail: 100000000000n, bsize: 1n } as never), usage = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...process.memoryUsage(), rss: 100000000, arrayBuffers: 0 }), available = vi.spyOn(leagueHost, "observeLeagueAvailableMemoryBytes").mockReturnValue(4000000000)
    const timing = { identityMs: 0, physicalMs: 0, readMs: 0, realpathMs: 0 }
    const actualPhysical = lean.cumulativeLeanPhysicalBytes, actualRead = fs.readSync, actualRealpath = fs.realpathSync
    const physical = vi.spyOn(lean, "cumulativeLeanPhysicalBytes").mockImplementation(l => { cadence.physicalSamples++; const at = performance.now(); try { return namespace === "20261014-v6" ? 88924160 : actualPhysical(l) } finally { timing.physicalMs += performance.now() - at } })
    const scratch = namespace === "20261014-v6" && assay ? vi.spyOn(lean, "measureLeanPhysicalBytes").mockReturnValue(0) : undefined
    let compactV6Spies = () => {}
    const chunks = vi.spyOn(fs, "readSync").mockImplementation(((...args: any[]) => { cadence.chunks++; const at = performance.now(); try { return Reflect.apply(actualRead, fs, args) } finally { timing.readMs += performance.now() - at; compactV6Spies() } }) as typeof fs.readSync)
    const realpaths = vi.spyOn(fs, "realpathSync").mockImplementation(((...args: any[]) => { const at = performance.now(); try { return Reflect.apply(actualRealpath, fs, args) } finally { timing.realpathMs += performance.now() - at } }) as typeof fs.realpathSync)
    const core = vi.spyOn(childProcess, "execFileSync").mockImplementation(((command: string) => command === "ps" ? "100\n" : "0\n") as typeof childProcess.execFileSync), originalArgs = process.execArgv, connected = Object.getOwnPropertyDescriptor(process, "connected")
    Object.defineProperty(process, "connected", { value: false, writable: true, configurable: true })
    const passes: string[][] = [], reservations: number[] = [], actualIdentity = continuationHelper.createLeanContinuationIdentityGuardV2, identity = vi.spyOn(continuationHelper, "createLeanContinuationIdentityGuardV2")
    identity.mockImplementation((pins, rows) => { const guard = actualIdentity(pins, rows); return () => { const before = stat.mock.calls.length, at = performance.now(); try { guard(); passes.push(stat.mock.calls.slice(before).map(([path]) => String(path))) } finally { timing.identityMs += performance.now() - at } } })
    let carried: any
    const authBoundary: { guard?: (additional?: number) => continuationHelper.LeanContinuationFrontier; error?: unknown; attempts: number; completed: number } = { attempts: 0, completed: 0 }
    const actualCarry = continuationHelper.authenticateLeanBaselineContinuationCarryV2
    const carry = vi.spyOn(continuationHelper, "authenticateLeanBaselineContinuationCarryV2").mockImplementation((git, rows, guard, window) => {
      if (assay && namespace !== "20261014-v6") {
        authBoundary.guard = guard as (additional?: number) => continuationHelper.LeanContinuationFrontier; authBoundary.attempts++
        // Execute the REAL authenticator, denying at an absent old descriptor
        // resolved inside this fixture. No historical content is read, and no
        // context/authentication is represented as completed or admitted.
        expect(fs.existsSync(resolve(lean.LEAN_BASELINE_CONTINUATION_PATHS.allocation))).toBe(false)
        try { const result = actualCarry(git, rows, guard, window); authBoundary.completed++; return result } catch (error) { authBoundary.error = error; throw error }
      }
      // Older isolated context unit fixture: mocked closed-history seam only.
      for (const additional of [0, 65536, 0]) { reservations.push(additional); guard(additional) }; return carried
    })
    const actualDomain = contracts.labRoot
    const hashes = vi.spyOn(contracts, "labRoot"), git = vi.spyOn(continuationGit, "readLeanBaselineContinuationGitV2").mockImplementation(args => {
      if (args[0] === "rev-parse" && args[1] === "HEAD") cadence.headChecks++
      if (args[0] === "rev-parse") return Buffer.from(`${head.value}\n`)
      if (args[0] === "merge-base") return Buffer.alloc(0)
      if (args[0] === "rev-list") return Buffer.from(`${head.value} ${sourceHead}\n`)
      if (args[0] === "diff") return Buffer.from(`${p.allocation}\n`)
      if (args[0] === "show") { const colon = args[1]!.indexOf(":"); expect([reviewedHead, sourceHead, head.value]).toContain(args[1]!.slice(0, colon)); return fs.readFileSync(resolve(args[1]!.slice(colon + 1))) }
      throw new Error("unexpected inert Git operation")
    })
    // Capture only finite counters; clearing Vitest call history cannot erase
    // the measured visits/hashes/resources. No production hooks are suppressed.
    const originalDomain = hashes.getMockImplementation() ?? actualDomain
    const fixtureWindowDomainRoots = new Map<string, ReturnType<typeof contracts.labRoot>>()
    hashes.mockImplementation((domain, value) => { cadence.domainHashes++; if (domain === "lean-baseline-continuation-window-v2") { cadence.windowDomainHashes++; if (assay && namespace === "20261014-v6") { const key = JSON.stringify(value), previous = fixtureWindowDomainRoots.get(key); if (previous) return previous; const result = originalDomain(domain, value); if (fixtureWindowDomainRoots.size < 8) fixtureWindowDomainRoots.set(key, result); return result } } return originalDomain(domain, value) })
    const rawOwners = new WeakMap<Uint8Array, string>()
    const actualRaw = lean.leanBytesRoot, mappedRoots = new Map<string, `sha256:${string}`>(), raw = namespace === "20261014-v6" ? vi.spyOn(lean, "leanBytesRoot").mockImplementation(bytes => { cadence.rawHashes++; const owner = rawOwners.get(bytes); if (owner === p.window) cadence.windowRawHashes++; if (owner?.endsWith("/ledger.ndjson") || owner?.endsWith("/time.ndjson") || bytes.byteLength === 0) cadence.journalBytesRawHashes++; if (owner && sourcePaths.includes(owner)) cadence.sourceRawHashes++; const digest = actualRaw(bytes); return mappedRoots.get(digest) ?? digest }) : undefined
    const actualController = continuationHelper.createLeanContinuationStageControllerV6, controllers = namespace === "20261014-v6" ? vi.spyOn(continuationHelper, "createLeanContinuationStageControllerV6").mockImplementation((pins, rows, roles, binding, current, policy) => {
      const c = actualController(pins, rows, roles, binding, () => { constructionDeadline(); const frame = frames.at(-1); if (frame) frame.current = true; try { current() } finally { if (frame) frame.current = false } }, policy)
      return Object.freeze({ ...c,
        live<T>(context: object, body: () => T): T { const frame = { mode: "live" as const, body: false, current: false }; frames.push(frame); const at = performance.now(); try { const result = c.live(context, () => { frame.body = true; try { return body() } finally { frame.body = false } }); cadence.livePasses += 2; return result } finally { frames.pop(); timing.identityMs += performance.now() - at } },
        withStage<T>(context: object, kind: continuationHelper.LeanContinuationStageV6, body: () => T): T { const frame = { mode: "full" as const, body: false, current: false }; frames.push(frame); const at = performance.now(); try { const result = c.withStage(context, kind, () => { frame.body = true; try { return body() } finally { frame.body = false } }); cadence.fullPasses += 2; return result } finally { frames.pop(); timing.identityMs += performance.now() - at } },
      })
    }) : undefined
    const actualDescriptor = continuationHelper.readLeanContinuationBoundedBytesV2, descriptors = namespace === "20261014-v6" ? vi.spyOn(continuationHelper, "readLeanContinuationBoundedBytesV2").mockImplementation((path, maximum, mode, guard) => { cadence.descriptorReads++; const bytes = actualDescriptor(path, maximum, mode, bytes => { cadence.reservations++; guard(bytes) }); rawOwners.set(bytes, path); return bytes }) : undefined
    const actualMembers = fs.readdirSync, members = namespace === "20261014-v6" ? vi.spyOn(fs, "readdirSync").mockImplementation(((...args: any[]) => { cadence.memberships++; return Reflect.apply(actualMembers, fs, args) }) as typeof fs.readdirSync) : undefined
    // V6 does more always-fresh raw checks, not fewer. Bound mock call custody
    // rather than retaining every large resource/root argument during setup.
    compactV6Spies = () => { if (namespace === "20261014-v6") { stat.mockClear(); realpaths.mockClear(); physical.mockClear(); chunks.mockClear(); hashes.mockClear(); usage.mockClear(); disk.mockClear(); available.mockClear(); core.mockClear(); git.mockClear(); raw?.mockClear(); descriptors?.mockClear(); members?.mockClear(); controllers?.mockClear() } }
    let clock: ReturnType<typeof vi.spyOn> | undefined
    try {
      for (const path of new Set([...sourcePaths, ...parentApi.LEAN_BASELINE_CONTINUATION_PLANNING_PATHS])) write(path, assay && namespace === "20261014-v6" && sourcePaths.includes(path) && path !== "AGENTS.md" && !parentApi.LEAN_BASELINE_CONTINUATION_PLANNING_PATHS.includes(path) ? "" : "synthetic public fixture", path.endsWith(".sh") ? 0o755 : 0o644)
      const base = parentApi.leanBaselineContinuationSourceManifestV2(), planRoot = base.planningEntries.find(row => row.path.endsWith("265-16-BASELINE-CONTINUATION-PLAN-20261012.md"))!.root
      const sg: parentApi.LeanContinuationSourceGateV2 = { schemaVersion: "lean-baseline-continuation-source-gate-v2", plan_check: "passed", source_review: "passed", root_validation: "passed", source_verification: "passed", commands_closed: true, reviewedSourceHead: reviewedHead, sourceRoot: base.root, sourceAuthor: "inert-author", sourceReviewer: "inert-reviewer", sourceVerifier: "inert-verifier" }
      const wb = { schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const, grantId: "inert-overhead", approvalEvidence: { humanDecisionId: "inert-human", recordedBy: "inert-root" }, approvedAtMs: 1791840227000, anchorMs: 1791840227000, carryMs: 492285903, capMs: 521085903, deadlineMs: 1791869027000, durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace: namespace, ...(namespace === "20261014-v6" ? { approvedAtMs: 1792002607000, anchorMs: 1792002607000, carryMs: 654665903, capMs: 683465903, deadlineMs: 1792031407000 } : {}), reviewedSourceHead: reviewedHead, sourceRoot: base.root, sourceGateRoot: labRoot(sg.schemaVersion, sg), planRoot, runOperator: "inert-runner", readerOperator: "inert-reader" }, w = { ...wb, root: labRoot(wb.schemaVersion, wb) }
      const dg: parentApi.LeanContinuationDataGateV2 = { schemaVersion: "lean-baseline-continuation-data-gate-v2", status: "passed", grantId: w.grantId, windowRoot: w.root, windowBytesRoot: leanBytesRoot(leanCanonicalBytes(w)), reviewedSourceHead: reviewedHead, sourceRoot: base.root, sourceGateRoot: w.sourceGateRoot, planRoot, approvalEvidence: w.approvalEvidence, runOperator: w.runOperator, readerOperator: w.readerOperator, dataReviewer: "inert-data-reviewer", commands_closed: true }
      write(p.gates, `\`\`\`json\n${Buffer.from(leanCanonicalBytes(sg))}\n\`\`\`\n\`\`\`json\n${Buffer.from(leanCanonicalBytes(dg))}\n\`\`\`\n`); write(p.window, leanCanonicalBytes(w), 0o600)
      clock = vi.spyOn(Date, "now").mockReturnValue(w.anchorMs); process.execArgv = ["--import", "tsx"]
      vi.stubEnv("TSX_DISABLE_CACHE", "1"); vi.stubEnv("NODE_DISABLE_COMPILE_CACHE", "1"); vi.stubEnv("TMPDIR", resolve(p.temp)); for (const key of ["NODE_OPTIONS", "NODE_COMPILE_CACHE", "NODE_REDIRECT_WARNINGS", "NODE_V8_COVERAGE"]) vi.stubEnv(key, undefined)
      const manifest = parentApi.leanBaselineContinuationDataManifestV2(w, parentApi.leanBaselineContinuationSourceManifestV2()), seed = "inert-overhead", coldRoot = leanColdProcedureRoot(seed)
      const request: parentApi.LeanBaselineContinuationRequestV2 = { schemaVersion: "lean-baseline-continuation-request-v2", seed, sourceHead, sourceRoot: base.root, planningRoot: manifest.planningRoot, planRoot, reviewRoot: w.sourceGateRoot, coldRoot, candidateRoots: parentApi.deriveLeanBaselineCandidateRoots(coldRoot), requestRoots: parentApi.deriveLeanBaselineRequestRoots({ seed, coldRoot, planRoot, sourceRoot: base.root }), offlineOverheadMs: w.offlineOverheadMs, sourceAuthor: sg.sourceAuthor, runOperator: w.runOperator, readerOperator: w.readerOperator, windowRoot: w.root, windowBytesRoot: manifest.windowBytesRoot, sourceGateRoot: w.sourceGateRoot, dataReviewRoot: manifest.dataReviewRoot, manifestRoot: manifest.manifestRoot }
      write(p.request, leanCanonicalBytes(request), 0o600); fs.mkdirSync(resolve(p.temp), { mode: 0o700 })
      const spentNames: string[] = [], spentRoots = new Map<string, `sha256:${string}`>()
      if (assay && namespace === "20261014-v6") {
        // Public synthetic opaque bytes, digest-mapped ONLY in this fixture.
        // G independently tests preservation; this measures real visitor cadence,
        // never authenticates private history or supplies real custody.
        const v3 = lean.LEAN_BASELINE_CONTINUATION_PATHS_V2, v4 = lean.LEAN_BASELINE_CONTINUATION_PATHS_V4, v5 = lean.LEAN_BASELINE_CONTINUATION_PATHS_V5
        const opaque: [string, number, number, string][] = [
          [v3.request, 4041, 0o600, "900e97e973ac31c596d1f5f1b8b89e1b8e532310e0b2d6e67053fbe9a8321065"], [v3.window, 935, 0o600, "2c0c2905fea2e4a264aac99df251e5aa89d0b2c44588453d3c41586f4b3a881d"],
          [v4.window, 935, 0o600, "98b0cd906323554e3c0cefb96700c317a9bd2e346135c7560d715b87eb303ba6"], [v4.request, 4056, 0o600, "bd17509fee8d2138b89b4a114224f1ee1ee009217475e924d6dd7cdfd90466c7"],
          [v4.allocation, 17366, 0o644, "19aeee9f9416849b4e7bb214afa7d470349f36e302b09bda700c7a50e717938f"], [join(v4.store, "allocation.json"), 17366, 0o600, "19aeee9f9416849b4e7bb214afa7d470349f36e302b09bda700c7a50e717938f"],
          [join(v4.store, "carry.json"), 746080, 0o600, "7bb1e101e0938ab8497311444e81ad30578f41d372a3c7999e61dfddad90f5a7"], [join(v4.store, "source-manifest.json"), 208491, 0o600, "35c507b2a0fd12b3d131671ba6596f8e4dcfcafa62676fcfa703c672d9dee508"], [join(v4.store, "source-hold.json"), 146345, 0o600, "744be76efaaaeca29076208f2da70a5f755569b93c6a47d0622b3aa1f4525911"], [v4.claim, 1002, 0o600, "14cc57d66661a98c8f9150842b441310c8a70d29fef5186b5c58a49e62c9e45c"],
          [v5.window, 929, 0o600, "989dc4984483ac4ebcecb154e2c8b9256657d0cbb21258b50fb4cdaa99481faa"], [v5.request, 4051, 0o600, "386e72a26e326d7f09c9c93a6f087c481a7ff0117be284fcb72aeb0aa692e6b1"], [v5.allocation, 17360, 0o644, "439ff997177d812aebc8194b77dd6dcc30353541b0f5061f3eea036f32c7c7c6"], [join(v5.store, "allocation.json"), 17360, 0o600, "439ff997177d812aebc8194b77dd6dcc30353541b0f5061f3eea036f32c7c7c6"],
          [join(v5.store, "carry.json"), 749813, 0o600, "a6168503f6bee69d22688a003c7acb1c0d850647cdc447f81d10747150eca348"], [join(v5.store, "source-manifest.json"), 208495, 0o600, "e01c2cc7f6fd49185f92ded151ddc0b4bc6c26347cd3e3b597a76b099943388a"], [join(v5.store, "source-hold.json"), 146600, 0o600, "e0ff6a1879e9cfb90f5303097a2a1e20a130be0ada3f3b42bfe63949ec79cb55"], [v5.claim, 1011, 0o600, "e2e94f1a122f3c994a09c4ccfb028d630fae52abb0c0aaacce733e4dd57cb13c"],
          ...[v4, v5].flatMap(paths => ["ledger.ndjson", "time.ndjson"].map(name => [join(paths.store, name), 0, 0o600, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"] as [string, number, number, string])),
        ]
        for (const paths of [v4, v5]) for (const path of [paths.store, paths.temp]) { fs.mkdirSync(resolve(path), { recursive: true, mode: 0o700 }); fs.chmodSync(resolve(path), 0o700); spentNames.push(path) }
        opaque.forEach(([path, size, mode, expected], i) => { const bytes = Buffer.alloc(size, 65 + i); write(path, bytes, mode); const root = `sha256:${expected}` as const; mappedRoots.set(actualRaw(bytes), root); spentRoots.set(path, root); spentNames.push(path) })
      }
      const row = (path: string): continuationHelper.LeanContinuationInventoryRowV2 => { const s = fs.lstatSync(resolve(path)); return { path, kind: s.isDirectory() ? "directory" : "file", bytes: s.size, allocatedBytes: s.blocks * 512, dev: s.dev, ino: s.ino, mode: s.mode & 0o7777, mtimeMs: s.mtimeMs, ctimeMs: s.ctimeMs, rawRoot: spentRoots.get(path) ?? null, ...(s.isDirectory() ? { members: fs.readdirSync(resolve(path)).sort() } : {}) } }
      const watched = sourcePaths[0]!, inventory: continuationHelper.LeanContinuationInventoryRowV2[] = [row(watched)], assayRows: continuationHelper.LeanContinuationInventoryRowV2[] = [], custody = { synthetic: true }
      if (namespace === "20261014-v6") { write("scripts/closed-cost.txt", "closed history"); inventory.push(row("scripts/closed-cost.txt")) }
      if (assay) {
        const pinnedPaths = new Set([...manifest.entries.map(row => row.path), p.request, p.claim, p.allocation, ...["allocation.json", "carry.json", "source-manifest.json", "source-hold.json"].map(name => join(resolve(p.store), name))].map(path => resolve(path)))
        const available = [...new Set([...spentNames, ...sourcePaths])].slice(0, assay.n)
        while (available.length < assay.n) { const path = `scripts/sensitivity-row-${available.length}.txt`; write(path, "x"); available.push(path) }
        assayRows.push(...available.map(row))
        // Each unchanged ordinary/directory row ends at its second outer stat.
        // Opaque spent files additionally execute the real bounded descriptor's
        // initial stat + hold + TWO per chunk + final hold before the outer close.
        for (const row of assayRows) visitor.terminalObservation.set(resolve(row.path), spentRoots.has(row.path) ? 5 + 2 * Math.ceil(row.bytes / 65536) : 2)
        inventory.splice(0, inventory.length, ...assayRows)
        for (const item of inventory) pinnedPaths.add(resolve(item.path))
        for (let i = 0; pinnedPaths.size < assay.u; i++) { const path = `scripts/sensitivity-identity-${i}.txt`; write(path, "x"); inventory.push(row(path)); pinnedPaths.add(resolve(path)) }
        expect(pinnedPaths.size).toBe(assay.u)
      }
      const pb = { schemaVersion: "lean-baseline-continuation-carry-v2" as const, chargedMatches: 50 as const, elapsedUpperBoundMs: 465187899, allocatedDiskBytes: 88924160, residualDiskBytes: 4096, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, originalCarryRoot: root("old-cost"), closedCapsuleRoot: labRoot("lean-baseline-continuation-closed-capsule-v2", custody), custodyRoot: labRoot("lean-baseline-continuation-custody-v2", custody), inventoryRoot: labRoot("lean-baseline-continuation-inventory-v2", inventory), qualifiedReaderAuthority: "cost_only" as const }, predecessor = { ...pb, root: labRoot(pb.schemaVersion, pb) }
      carried = { carry: predecessor, inventory, custody }
      const allocation = lean.createLeanBaselineContinuationAllocationV2({ ...Object.fromEntries(["sourceRoot", "reviewRoot", "coldRoot", "planRoot", "candidateRoots", "requestRoots", "seed", "sourceHead", "planningRoot", "manifestRoot", "sourceGateRoot", "dataReviewRoot", "windowBytesRoot"].map(key => [key, (request as any)[key]])) as lean.LeanBaselineContinuationInputV2, requestBytesRoot: leanBytesRoot(leanCanonicalBytes(request)), predecessor, window: w })
      const l = lean.createLeanLedger(resolve(p.store), allocation)
      write(p.allocation, leanCanonicalBytes(allocation)); write(join(p.store, "carry.json"), leanCanonicalBytes(carried), 0o600); write(join(p.store, "source-manifest.json"), leanCanonicalBytes(manifest), 0o600)
      const cb = { schemaVersion: "lean-baseline-continuation-window-claim-v2", grantId: w.grantId, routeNamespace: w.routeNamespace, windowRoot: w.root, windowBytesRoot: request.windowBytesRoot, requestBytesRoot: allocation.requestBytesRoot, sourceHead, sourceRoot: request.sourceRoot, sourceGateRoot: request.sourceGateRoot, dataReviewRoot: request.dataReviewRoot, planningRoot: request.planningRoot, manifestRoot: request.manifestRoot }, claim = { ...cb, root: labRoot(cb.schemaVersion, cb) }
      write(p.claim, leanCanonicalBytes(claim), 0o600)
      const hb = { schemaVersion: "lean-baseline-continuation-source-hold-v2", allocationRoot: allocation.root, sourceHead, manifestRoot: allocation.manifestRoot, claimRoot: claim.root, rows: assay || namespace === "20261014-v6" ? inventory.slice(0, 1) : inventory }, hold = { ...hb, root: labRoot(hb.schemaVersion, hb) }
      write(join(l.directory, "source-hold.json"), leanCanonicalBytes(hold), 0o600)
      let c: ReturnType<typeof parentApi.openLeanBaselineContinuationContextV2>
      if (assay && namespace !== "20261014-v6") {
        expect(() => parentApi.openLeanBaselineContinuationContextV2(p.request)).toThrow(/ENOENT/)
        expect(authBoundary.completed).toBe(0); expect(authBoundary.guard).toBeTypeOf("function")
        // Test handle to the actual production guard captured at denial; NOT a
        // successfully opened/authenticated context or a reusable capability.
        c = { paths: p, window: w, ledger: l, allocation, manifest, fixedHead: head.value, guard: authBoundary.guard! } as typeof c
      } else c = parentApi.openLeanBaselineContinuationContextV2(p.request)
      // Construction censoring ends once the independently opened context is
      // available; the sample owns its separate remaining-budget censor.
      if (assay) delete assay.constructionStopAt
      await run(c, { passes, reservations, hashes, head, w, timing, assayRows, fixtureStartMs, fixtureExtraBound, authBoundary, realpaths, cadence, visitor, clearObservations: () => { physical.mockClear(); chunks.mockClear(); realpaths.mockClear(); stat.mockClear(); for (const key of Object.keys(cadence) as (keyof typeof cadence)[]) cadence[key] = 0; for (const key of Object.keys(timing) as (keyof typeof timing)[]) timing[key] = 0 }, observationCounts: () => ({ physical: physical.mock.calls.length, chunks: chunks.mock.calls.length }) })
    } finally { if (connected) Object.defineProperty(process, "connected", connected); else Reflect.deleteProperty(process, "connected"); clock?.mockRestore(); scratch?.mockRestore(); controllers?.mockRestore(); descriptors?.mockRestore(); members?.mockRestore(); raw?.mockRestore(); git.mockRestore(); hashes.mockRestore(); carry.mockRestore(); identity.mockRestore(); realpaths.mockRestore(); chunks.mockRestore(); physical.mockRestore(); process.execArgv = originalArgs; vi.unstubAllEnvs(); core.mockRestore(); available.mockRestore(); usage.mockRestore(); disk.mockRestore(); factory.mockRestore(); exists.mockRestore(); stat.mockRestore(); cwd.mockRestore(); fs.rmSync(dir, { recursive: true }) }
  }
  it("[continuation-stage-cadence-H] actual V6 context observes live callbacks and full source/history stage barriers", () => fixture((c, f) => {
    expect(c.paths).toBe(lean.LEAN_BASELINE_CONTINUATION_PATHS_V6)
    c.stage("source", () => c.guard())
    fs.writeFileSync(resolve("scripts/closed-cost.txt"), "changed history")
    c.guard() // Closed history is checked at barriers, not at every callback.
    expect(() => c.stage("charge", () => {})).toThrow()
    expect(() => c.guard()).toThrow() // Denial permanently invalidates invocation.
    expect(f.reservations).toEqual([0, 65536, 0])
  }, "20261014-v6"), 30000)
  it.each(["closing", "planning", "request", "head", "capacity"] as const)("[continuation-stage-cadence-H] actual V6 refuses %s before dependent effects", mode => fixture((c, f) => {
    const effect = vi.fn()
    if (mode === "closing") expect(() => c.stage("archive", () => fs.writeFileSync(resolve("scripts/closed-cost.txt"), "changed history"))).toThrow()
    if (mode === "planning") fs.writeFileSync(resolve(c.paths.gates), "changed")
    if (mode === "request") fs.writeFileSync(resolve(c.paths.request), "changed", { mode: 0o600 })
    if (mode === "head") f.head.value = "d".repeat(40)
    if (mode === "capacity") vi.mocked(process.memoryUsage).mockReturnValue({ ...process.memoryUsage(), rss: 3000000001 })
    expect(() => c.stage("charge", effect)).toThrow(); expect(effect).not.toHaveBeenCalled()
    expect(() => c.guard()).toThrow()
  }, "20261014-v6"), 30000)
  it("[continuation-stage-cadence-H] CLI selects V6 explicitly and rejects nonfinite variants", () => {
    for (const mode of ["prepare-continuation-v2", "run-continuation-v2", "verify-continuation-v2"]) expect(parentApi.parseLeanBaselineCommand([mode, "--request", lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request])).toEqual({ mode, request: lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request })
    expect(() => parentApi.parseLeanBaselineCommand(["run-continuation-v2", "--request", lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request + "/extra"])).toThrow()
  })
  it.each(["live", "final", "resource", "claim", "claim-resource", "timing", "before-terminal", "fork-closing"] as const)("[CR-CAD-01-R2] [CR-CAD-01] actual V6 parent preserves spent charges and closes failed pilot after %s source denial", mode => fixture(async (c, f) => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] })
    lean.beginLeanInterval(c.ledger, "continuation-run-admission"); lean.closeLeanInterval(c.ledger, "continuation-run-admission")
    vi.mocked(Date.now).mockReturnValue(c.window.anchorMs + 1000)
    // The Vitest worker's IPC remains connected across asynchronous yields.
    // Only synchronous host observations simulate a top-level operator process.
    Object.defineProperty(process, "connected", { value: true, configurable: true, writable: true })
    const hostObservation = <T>(body: () => T): T => { Object.defineProperty(process, "connected", { value: false, configurable: true, writable: true }); try { return body() } finally { Object.defineProperty(process, "connected", { value: true, configurable: true, writable: true }) } }
    const child = Object.assign(new EventEmitter(), { pid: process.pid + 1000, exitCode: null as number | null, signalCode: null as NodeJS.Signals | null,
      kill: vi.fn((signal: NodeJS.Signals) => { queueMicrotask(() => { if (mode === "resource" || mode === "claim-resource") vi.mocked(process.memoryUsage).mockReturnValue({ ...process.memoryUsage(), rss: 3000000001 }); child.signalCode = signal; child.emit("exit", null, signal) }); return true }),
      send: () => { const slot = c.allocation.slots[0]!, body = { schemaVersion: "lean-slot-charge-v1", allocationRoot: c.allocation.root, slotRoot: slot.root, ordinal: slot.ordinal }; fs.appendFileSync(join(c.ledger.directory, "ledger.ndjson"), Buffer.concat([leanCanonicalBytes({ kind: "charge", charge: { ...body, root: labRoot(body.schemaVersion, body) } }), Buffer.from("\n")])); if (mode === "claim" || mode === "claim-resource") f.head.value = "d".repeat(40); return true },
    })
    const fork = vi.spyOn(childProcess, "fork").mockImplementation(() => { if (mode === "fork-closing") f.head.value = "d".repeat(40); return child as never }), core = vi.spyOn(childProcess, "execFileSync").mockImplementation(((command: string, args: string[]) => command === "ps" ? "100\n" : args[0] === "show" ? leanCanonicalBytes(c.allocation) : `${c.fixedHead}\n`) as typeof childProcess.execFileSync)
    const actualTimeout = globalThis.setTimeout, timeout = mode === "timing" ? vi.spyOn(globalThis, "setTimeout").mockImplementation(((...args: Parameters<typeof setTimeout>) => { if (typeof args[1] === "number" && args[1] > 30000) throw new Error("INERT_TIMING_SETUP"); return actualTimeout(...args) }) as typeof setTimeout) : undefined
    let manifests = 0
    const action = parentApi.runLeanBoundedParent({ ledger: c.ledger, requestPath: c.paths.request, allocationPath: c.paths.allocation, store: c.ledger.directory, sourceRoot: c.allocation.sourceRoot, manifestRoot: () => ++manifests === 1 ? c.allocation.sourceRoot : hostObservation(c.authenticateSource), childMode: "inert", prospectiveStart: { wallStartMs: Date.now(), monotonicStartNs: process.hrtime.bigint().toString() }, beforeRelease: () => hostObservation(c.guard), stage: (kind, body) => hostObservation(() => c.stage(kind, body)), beforeTerminal: () => { c.closeRun(); if (mode === "before-terminal") throw new Error("INERT_BEFORE_TERMINAL") }, onFailure: c.invalidate, supervisorObservation: true })
    const settled = action.then(value => ({ value, error: null }), error => ({ value: null, error }))
    try {
      child.emit("message", { ready: child.pid }); await vi.advanceTimersByTimeAsync(0)
      if (mode === "fork-closing") { expect((await settled).value).toBeNull(); expect(child.kill).toHaveBeenCalledWith("SIGKILL"); expect(child.signalCode).toBe("SIGKILL"); expect(fs.existsSync(join(c.ledger.directory, "entry.json"))).toBe(false); expect(lean.readLeanLedger(c.ledger).charged).toBe(50); expect(() => hostObservation(c.guard)).toThrow(); return }
      if (lean.readLeanLedger(c.ledger).charged === 50) throw (await settled).error ?? new Error("INERT_PARENT_DID_NOT_ENTER")
      const charged = fs.readFileSync(join(c.ledger.directory, "ledger.ndjson"))
      expect(lean.readLeanLedger(c.ledger).charged).toBe(51)
      if (mode !== "final" && mode !== "before-terminal") { f.head.value = "d".repeat(40); await vi.advanceTimersByTimeAsync(250); expect(child.kill).toHaveBeenCalledWith("SIGKILL") }
      else { if (mode === "final") fs.writeFileSync(resolve("scripts/closed-cost.txt"), "changed history"); child.exitCode = 0; child.emit("exit", 0, null) }
      expect((await settled).value).toBeNull()
      expect(fs.readFileSync(join(c.ledger.directory, "ledger.ndjson"))).toEqual(charged)
      if (mode === "resource" || mode === "claim-resource") { expect(fs.existsSync(join(c.ledger.directory, "child-terminal.json"))).toBe(false); expect(lean.readLeanTimeAccounting(c.ledger).active).toBe(true); return }
      expect(lean.readLeanChildTerminal(c.ledger).status).toBe("child_failed")
      expect(parentApi.validateLeanSupervisorReasonBytes(fs.readFileSync(join(c.ledger.directory, "parent-supervisor-reasons.json")))).toMatchObject({ uncertain: true, observations: { finalIdentity: "exception", cleanup: "child_exit_observed" } })
      const time = lean.readLeanTimeAccounting(c.ledger); expect(time.active).toBe(false); expect(time.closed.has("pilot-entry")).toBe(true)
      expect(() => hostObservation(c.guard)).toThrow()
    } finally { timeout?.mockRestore(); fork.mockRestore(); core.mockRestore(); vi.useRealTimers() }
  }, "20261014-v6"), 30000)
  it("[continuation-stage-cadence-H] denies unselected finite allocation Git reads even if caller includes them", () => {
    const body = { schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const, grantId: "inert-v6", approvalEvidence: { humanDecisionId: "inert-human", recordedBy: "inert-root" }, approvedAtMs: 1792002607000, anchorMs: 1792002607000, carryMs: 654665903, capMs: 683465903, deadlineMs: 1792031407000, durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace: "20261014-v6" as const, reviewedSourceHead: "a".repeat(40), sourceRoot: root("source"), sourceGateRoot: root("gate"), planRoot: root("plan"), runOperator: "inert-runner", readerOperator: "inert-reader" }, w = { ...body, root: labRoot(body.schemaVersion, body) }
    for (const p of [lean.LEAN_BASELINE_CONTINUATION_PATHS_V2, lean.LEAN_BASELINE_CONTINUATION_PATHS_V4, lean.LEAN_BASELINE_CONTINUATION_PATHS_V5]) expect(() => continuationGit.readLeanBaselineContinuationGitV2(["show", `${w.reviewedSourceHead}:${p.allocation}`], [{ path: p.allocation, root: root("inert") }], w)).toThrow(/GIT_V2_METADATA/)
  })
  it.each(["pass", "closing", "after-charge"] as const)("[continuation-stage-cadence-H] connected durable charge-before-provider with spent %s failure", mode => fixture(async c => {
    const entry = { schemaVersion: "lean-child-entry-v2", allocationRoot: c.allocation.root, sourceRoot: c.allocation.sourceRoot, requestBytesRoot: c.requestBytesRoot, head: c.fixedHead, parentPid: process.ppid, childPid: process.pid, handshakeRoot: root("inert-handshake"), wallStartMs: c.window.anchorMs, monotonicStartNs: process.hrtime.bigint().toString() }
    fs.writeFileSync(join(c.ledger.directory, "entry.json"), leanCanonicalBytes(entry), { mode: 0o600 })
    lean.beginLeanInterval(c.ledger, "pilot-entry", c.window.anchorMs)
    const slot = c.allocation.slots[0]!, order: string[] = [], provider = vi.fn(async charge => { expect(lean.readLeanLedger(c.ledger).charges.get(slot.root)?.root).toBe(charge.root); order.push("provider"); return "inert" })
    const charge = () => {
      const value = lean.chargeLeanSlot(c.ledger, slot, { freeBytes: 100000000000, availableMemoryBytes: 4000000000 }); order.push("durable-charge")
      if (mode === "closing") fs.writeFileSync(resolve("scripts/closed-cost.txt"), "drift")
      return value
    }
    const start = () => { c.startCell(); if (mode === "after-charge") fs.writeFileSync(resolve("scripts/closed-cost.txt"), "drift") }
    const action = parentApi.dispatchLeanContinuationChargedCellV6(c.stage, charge, start, provider)
    if (mode === "pass") { await expect(action).resolves.toMatchObject({ execution: "inert" }); expect(order).toEqual(["durable-charge", "provider"]) }
    else { await expect(action).rejects.toThrow(); expect(provider).not.toHaveBeenCalled(); expect(order).toEqual(["durable-charge"]) }
    expect(lean.readLeanLedger(c.ledger).charges.size).toBe(1); expect(lean.readLeanLedger(c.ledger).charged).toBe(51)
  }, "20261014-v6"), 30000)
  it("[continuation-remaining-overhead] actual complete guard removes pure window hashes but retains all live work", () => fixture((c, f) => {
    f.hashes.mockClear(); f.clearObservations(); f.passes.length = 0
    c.guard(1234)
    expect(f.hashes.mock.calls.filter(([domain]) => domain === "lean-baseline-continuation-window-v2")).toHaveLength(0)
    expect(f.observationCounts()).toEqual({ physical: 21, chunks: 2 }); expect(f.passes).toHaveLength(2)
    expect(f.passes[0]).toEqual(f.passes[1]); expect(f.realpaths.mock.calls.length).toBeGreaterThanOrEqual(2 * f.passes[0]!.length)
  }))
  it("[continuation-run-diagnostics] binds real denied carry to finite private invocation provenance without admission", () => fixture(async (c, f) => {
    await expect(invokeRun(c.paths.request)).rejects.toThrow(/ENOENT/)
    const formatted = parentApi.leanBaselineContinuationRunFailureV2(f.authBoundary.error)
    expect(formatted).toContain("stage=CARRY_REAUTHENTICATION"); expect(formatted).toContain("completed=false"); expect(formatted).toContain("code=DETAILS_WITHHELD")
    expect(formatted).toMatch(/guards_completed=[1-9][0-9]*/); expect(formatted).toMatch(/opening_completed=[1-9][0-9]*/); expect(formatted).toMatch(/closing_completed=[1-9][0-9]*/)
    for (const text of [process.cwd(), "ENOENT", "allocation.json", "stack", "sourceRoot"]) expect(formatted).not.toContain(text)
    expect(f.authBoundary.completed).toBe(0)
    for (const name of ["run-claim.json", "entry.json", "result.json", "reader-claim.json"]) expect(fs.existsSync(join(c.ledger.directory, name))).toBe(false)
  }, "20261012-v3", { n: 32, u: 64 }))
  it("[continuation-run-diagnostics] does not attribute hostile, forged or cross-invocation error objects", () => fixture(async c => {
    const error = new Error("PRIVATE raw message"), getter = new Error(), trap = vi.fn(() => { throw error }); Object.defineProperty(getter, "message", { get: trap })
    const revoked = Proxy.revocable({}, {}); revoked.revoke()
    for (const unknown of [null, "PRIVATE", 1, error, getter, { stage: "FULL_GUARD", guards_completed: 999 }, new Proxy(error, { get: trap, ownKeys: trap }), revoked.proxy]) expect(parentApi.leanBaselineContinuationRunFailureV2(unknown)).toBe("LEAN_BASELINE_RUN_PREENTRY stage=UNKNOWN code=DETAILS_WITHHELD\n")
    const memory = vi.mocked(process.memoryUsage), actual = memory.getMockImplementation()!
    try {
      memory.mockImplementation(() => { throw error })
      await expect(invokeRun(c.paths.request)).rejects.toBe(error)
      expect(parentApi.leanBaselineContinuationRunFailureV2(error)).toContain("stage=PREFLIGHT")
      await expect(invokeRun(c.paths.request)).rejects.toBe(error)
      expect(parentApi.leanBaselineContinuationRunFailureV2(error)).toBe("LEAN_BASELINE_RUN_PREENTRY stage=UNKNOWN code=DETAILS_WITHHELD\n")
      memory.mockImplementation(() => { throw getter })
      await expect(invokeRun(c.paths.request)).rejects.toBe(getter)
      expect(parentApi.leanBaselineContinuationRunFailureV2(getter)).toBe("LEAN_BASELINE_RUN_PREENTRY stage=UNKNOWN code=DETAILS_WITHHELD\n")
      expect(trap).not.toHaveBeenCalled()
    } finally { memory.mockImplementation(actual) }
  }))
  it("[continuation-run-diagnostics] records closing identity began, never completed, when bytes mutate between passes", () => fixture(async c => {
    const identity = vi.mocked(continuationHelper.createLeanContinuationIdentityGuardV2), original = identity.getMockImplementation()!
    identity.mockImplementation((pins, rows) => { const guard = original(pins, rows); let passes = 0; return () => { if (++passes === 2) fs.chmodSync(resolve(c.manifest.implementationEntries[0]!.path), 0o600); guard() } })
    let error: unknown
    try { await invokeRun(c.paths.request) } catch (caught) { error = caught }
    const formatted = parentApi.leanBaselineContinuationRunFailureV2(error)
    expect(formatted).toContain("stage=FULL_GUARD completed=false"); expect(formatted).toContain("guards_began=1 guards_completed=0"); expect(formatted).toContain("opening_began=1 opening_completed=1 closing_began=1 closing_completed=0")
    expect(fs.existsSync(join(c.ledger.directory, "run-claim.json"))).toBe(false)
  }, "20261012-v3", { n: 32, u: 64 }))
  it.each([[32, 64], [128, 256], [512, 1024], [2280, 2352]] as const)("[continuation-guard-sensitivity] bounded actual guard/inventory N=%i U=%i (mock resource inputs, no admitted context)", async (n, u) => {
    const assayStart = performance.now()
    let report: Record<string, number | string | boolean> = {}
    await fixture((c, f) => {
    const start = f.fixtureStartMs, setupMs = performance.now() - start, stopAt = start + 8000, censored = new Error("FINITE_ASSAY_STOP")
    let callbacksBegan = 0, callbacksCompleted = 0, guards = 0, identityPasses = 0, identityRows = 0, physical = 0, chunks = 0, realpaths = 0, windowHashes = 0, maxGuardMs = 0, guardMs = 0, identityMs = 0, physicalMs = 0, readMs = 0, realpathMs = 0
    const clear = () => { f.clearObservations(); f.hashes.mockClear(); f.passes.length = 0 }
    // Pure timing is local work only; never a whole-run throughput forecast.
    clear(); const strictStart = performance.now()
    for (let i = 0; i < 16; i++) lean.leanBaselineContinuationElapsedFloorV2(c.window, c.window.anchorMs)
    const strictMs = performance.now() - strictStart, strictHashes = f.hashes.mock.calls.filter(([domain]) => domain === "lean-baseline-continuation-window-v2").length
    clear(); const admittedStart = performance.now()
    for (let i = 0; i < 16; i++) lean.leanAdmittedContinuationElapsedFloorV2(c.ledger, c.window.anchorMs)
    const admittedMs = performance.now() - admittedStart, admittedHashes = f.hashes.mock.calls.filter(([domain]) => domain === "lean-baseline-continuation-window-v2").length
    expect(strictHashes).toBe(16); expect(admittedHashes).toBe(0)
    const callback = () => {
      // Reserve a generous finite stop margin BEFORE a callback/guard begins.
      if (performance.now() + Math.max(500, maxGuardMs * 3) >= stopAt) throw censored
      callbacksBegan++; clear(); const at = performance.now(); c.guard(); const elapsed = performance.now() - at
      maxGuardMs = Math.max(maxGuardMs, elapsed); guardMs += elapsed; guards++; callbacksCompleted++
      expect(f.passes).toHaveLength(2); expect(f.passes.map(pass => pass.length)).toEqual([u, u])
      identityPasses += f.passes.length; identityRows += f.passes.reduce((sum, pass) => sum + pass.length, 0)
      const observations = f.observationCounts(); physical += observations.physical; chunks += observations.chunks; realpaths += f.realpaths.mock.calls.length
      windowHashes += f.hashes.mock.calls.filter(([domain]) => domain === "lean-baseline-continuation-window-v2").length
      identityMs += f.timing.identityMs; physicalMs += f.timing.physicalMs; readMs += f.timing.readMs; realpathMs += f.timing.realpathMs
      clear()
    }
    let status: "completed" | "censored" = "completed", rowsCompleted = 0
    try { const rows = continuationHelper.inventoryLeanContinuationSurvivorsV2(f.assayRows, [], () => { throw new Error("NO_GIT_FOR_IMMUTABLE_SYNTHETIC_ROWS") }, callback); rowsCompleted = rows.length; expect(rows).toHaveLength(n) }
    catch (error) { if (error !== censored) throw error; status = "censored"; rowsCompleted = Math.min(n, Math.floor(callbacksCompleted / 2)) }
    const durationMs = performance.now() - start
    expect(durationMs).toBeLessThan(8000); expect(f.fixtureExtraBound).toBeLessThanOrEqual(64 * 1024 * 1024)
    expect(guards).toBe(callbacksCompleted); expect(identityPasses).toBe(2 * guards); expect(identityRows).toBe(2 * u * guards); expect(physical).toBe(21 * guards); expect(chunks).toBe(2 * guards); expect(realpaths).toBeGreaterThanOrEqual(identityRows); expect(windowHashes).toBe(0)
    if (status === "completed") expect(callbacksCompleted).toBe(2 * n + 1)
    else { expect(callbacksCompleted).toBeLessThan(2 * n + 1); expect(rowsCompleted).toBeLessThan(n) }
    expect(f.authBoundary.completed).toBe(0)
    report = { n, u, status, rowsCompleted, callbacksBegan, callbacksCompleted, guards, identityPasses, identityRows, physical, chunks, realpaths, windowHashes, strictHashes, admittedHashes, strictMs: Math.ceil(strictMs), admittedMs: Math.ceil(admittedMs), setupMs: Math.ceil(setupMs), guardMs: Math.ceil(guardMs), identityMs: Math.ceil(identityMs), physicalMs: Math.ceil(physicalMs), readMs: Math.ceil(readMs), realpathMs: Math.ceil(realpathMs), timingsOverlap: true, durationMs: Math.ceil(durationMs), extraBytesBound: f.fixtureExtraBound, sampleLimitMs: 8000, contextAuthenticated: false, resourceInputsMocked: true }
    }, "20261012-v3", { n, u })
    report.totalDurationMs = Math.ceil(performance.now() - assayStart); expect(report.totalDurationMs).toBeLessThan(8000)
    process.stdout.write(`FINITE_SYNTHETIC_GUARD_ASSAY ${JSON.stringify(report)}\n`)
  }, 15000)
  it("uses the opened ledger exact allocation and fresh opening/closing passes for every callback", () => fixture((c, f) => {
    expect(c.allocation).toBe(c.ledger.allocation); expect(lean.readLeanAdmittedContinuationAllocationV2(c.ledger)).toBe(c.allocation)
    expect(f.reservations).toEqual([0, 65536, 0]); expect(f.passes).toHaveLength(10)
    for (const pass of f.passes) expect(new Set(pass).size).toBe(pass.length)
    f.hashes.mockClear(); f.clearObservations(); const before = f.passes.length; c.guard(1234)
    expect(f.observationCounts()).toEqual({ physical: 21, chunks: 2 }); c.guard(5678)
    expect(f.observationCounts()).toEqual({ physical: 42, chunks: 4 })
    expect(f.passes.length - before).toBe(4)
    expect(f.hashes.mock.calls.filter(([domain]) => domain === "lean-slot-v1" || domain === "lean-baseline-continuation-admission-v2" || domain === "lean-baseline-continuation-allocation-v2")).toHaveLength(0)
    // Empty synthetic journals require no remaining domain hashes after the
    // admitted pure-window reuse; live bytes/42 physical samples still run.
    expect(f.hashes.mock.calls).toHaveLength(0)
  }))
  it("denies live HEAD, resource and allocation-byte drift through the actual complete guard", () => fixture((c, f) => {
    c.guard(); f.head.value = "d".repeat(40); expect(() => c.guard()).toThrow(/HOLD/); f.head.value = c.fixedHead
    for (const additional of [-1, NaN, Number.MAX_SAFE_INTEGER, LEAN_CAPS.scratchBytes]) expect(() => c.guard(additional)).toThrow()
    const p = c.paths.allocation, bytes = fs.readFileSync(resolve(p)); fs.writeFileSync(resolve(p), "not canonical"); expect(() => c.guard()).toThrow(); fs.writeFileSync(resolve(p), bytes); expect(() => c.guard()).toThrow()
  }))
  it.each(["source", "planning", "request", "window", "store-allocation"] as const)("reobserves %s bytes and rejects replacement/restore on the next actual callback", kind => fixture(c => {
    const path = kind === "source" ? c.manifest.implementationEntries[0]!.path : kind === "planning" ? ".planning/STATE.md" : kind === "request" ? c.paths.request : kind === "window" ? c.paths.window : join(c.ledger.directory, "allocation.json")
    const absolute = resolve(path), original = fs.readFileSync(absolute)
    fs.renameSync(absolute, `${absolute}.old`); fs.writeFileSync(absolute, original, { mode: kind === "source" || kind === "planning" ? 0o644 : 0o600 })
    expect(() => c.guard()).toThrow(); fs.unlinkSync(absolute); fs.renameSync(`${absolute}.old`, absolute); expect(() => c.guard()).toThrow()
  }))
  it("uses fresh availableRAM/freebytes/RSS/arrayBuffers and rejects deadline/monotonic drift before use", () => fixture((c, f) => {
    const usage = process.memoryUsage(), disk = fs.statfsSync(resolve("."), { bigint: true })
    for (const change of [{ rss: 3000000000 }, { arrayBuffers: LEAN_CAPS.scratchBytes + 1 }]) { vi.mocked(process.memoryUsage).mockReturnValue({ ...usage, ...change }); expect(() => c.guard()).toThrow(/CAPACITY/); vi.mocked(process.memoryUsage).mockReturnValue(usage) }
    vi.mocked(leagueHost.observeLeagueAvailableMemoryBytes).mockReturnValue(0); expect(() => c.guard()).toThrow(/CAPACITY/); vi.mocked(leagueHost.observeLeagueAvailableMemoryBytes).mockReturnValue(4000000000)
    vi.mocked(fs.statfsSync).mockReturnValue({ bavail: 0n, bsize: 1n } as never); expect(() => c.guard()).toThrow(/CAPACITY/); vi.mocked(fs.statfsSync).mockReturnValue(disk as never)
    const mono = vi.spyOn(process.hrtime, "bigint").mockReturnValue(0n); try { expect(() => c.guard()).toThrow(/LIVENESS/) } finally { mono.mockRestore() }
    vi.mocked(Date.now).mockReturnValue(f.w.deadlineMs - 36 * LEAN_CAPS.matchMs - f.w.closureMs - f.w.offlineOverheadMs + 1); expect(() => c.guard()).toThrow(/CAPACITY/)
    vi.mocked(Date.now).mockReturnValue(f.w.anchorMs - 1); expect(() => c.guard()).toThrow(/HOLD/)
  }))
  it("retains actual journal-prefix binding, active-cell reserve and fresh membership refusal", () => fixture((c, f) => {
    const full = () => c.guard() as ReturnType<typeof c.fullSample> // This fixture is the unchanged full-cadence V3 caller, not V8 reserve.
    const slot = c.allocation.slots[0]!, cb = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: c.allocation.root, slotRoot: slot.root, ordinal: 0 }, charge = { ...cb, root: labRoot(cb.schemaVersion, cb) }, path = join(c.ledger.directory, "ledger.ndjson")
    fs.writeFileSync(path, Buffer.concat([leanCanonicalBytes({ kind: "charge", charge }), Buffer.from("\n")]))
    c.startCell(); expect(full().remainingSlots).toBe(36); expect(full().charged).toBe(51)
    const before = fs.readFileSync(path), resource = { kind: "resource", elapsedMs: f.w.carryMs + 1, physicalBytes: 4096, bufferBytes: 0, scratchBytes: 0 }
    fs.writeFileSync(path, Buffer.concat([before, leanCanonicalBytes(resource), Buffer.from("\n")])); expect(() => c.guard()).toThrow(/LEDGER_CHANGED/); fs.writeFileSync(path, before); expect(full().charged).toBe(51)
    c.finishCell(); expect(full().remainingSlots).toBe(35); c.closeRun(); expect(full().remainingSlots).toBe(0)
    fs.writeFileSync(join(c.ledger.directory, "unknown.json"), "{}", { mode: 0o600 }); expect(() => c.guard()).toThrow(/STORE_MEMBERS/)
    expect(f.passes.every(pass => pass.length === new Set(pass).size)).toBe(true)
  }))
  it("keeps optional descriptor chunks and denies loss of child liveness in the actual frontier caller", () => fixture((c, f) => {
    const entry = { schemaVersion: "lean-child-entry-v2", allocationRoot: c.allocation.root, sourceRoot: c.allocation.sourceRoot, requestBytesRoot: c.allocation.requestBytesRoot, head: c.fixedHead, parentPid: process.ppid, childPid: process.pid, handshakeRoot: root("inert-handshake"), wallStartMs: c.window.anchorMs, monotonicStartNs: process.hrtime.bigint().toString() }
    fs.writeFileSync(join(c.ledger.directory, "entry.json"), leanCanonicalBytes(entry), { mode: 0o600 })
    Object.defineProperty(process, "connected", { value: true, writable: true, configurable: true })
    const actualRead = lean.readLeanChildEntry, read = vi.spyOn(lean, "readLeanChildEntry").mockImplementation(l => { const result = actualRead(l); Object.defineProperty(process, "connected", { value: false, writable: true, configurable: true }); return result })
    try { f.clearObservations(); expect(() => c.guard()).toThrow(/V2_FRONTIER/); expect(read).toHaveBeenCalledOnce(); expect(f.observationCounts()).toEqual({ physical: 26, chunks: 3 }) } finally { read.mockRestore() }
  }))
  it("[continuation-v5] opens the selected V5 context with both fresh identity passes and bounded reservations", () => fixture((c, f) => {
    expect(c.paths).toEqual(lean.LEAN_BASELINE_CONTINUATION_PATHS_V5)
    expect(c.claim.routeNamespace).toBe("20261013-v5")
    expect(c.allocation.window).toEqual(c.window)
    f.clearObservations(); f.passes.length = 0; f.hashes.mockClear(); c.guard()
    expect(f.passes).toHaveLength(2)
    expect(f.observationCounts()).toEqual({ physical: 21, chunks: 2 })
    expect(f.hashes.mock.calls.filter(([domain]) => domain === "lean-baseline-continuation-allocation-v2")).toHaveLength(0)
  }, "20261013-v5"))
  it.each(["valid", "claim", "entry", "pair", "journal"] as const)("[continuation-v5] real issuer joins through pair/journal before inert source sentinel: %s", mode => fixture((c) => {
    // Real admitted context, full guards and synthetic ledger/pair descriptors;
    // the external source boundary throws before any capability is issued.
    const slot = c.allocation.slots[0]!, body = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: c.allocation.root, slotRoot: slot.root, ordinal: 0 }, charge = { ...body, root: labRoot(body.schemaVersion, body) }
    const journal = Buffer.concat([leanCanonicalBytes({ kind: "charge", charge }), Buffer.from("\n")])
    fs.writeFileSync(join(c.ledger.directory, "ledger.ndjson"), journal)
    const entry = { allocationRoot: c.allocation.root, sourceRoot: c.allocation.sourceRoot, requestBytesRoot: mode === "entry" ? root("crossed-request") : c.allocation.requestBytesRoot, head: c.fixedHead }
    const pairBody = { schemaVersion: "lean-baseline-pair-v1", ordinal: 0, slotRoot: slot.root, requestRoot: mode === "pair" ? root("crossed-pair") : slot.requestRoot, priorCharged: 50, priorLedgerByteLength: 0, priorLedgerBytesRoot: mode === "journal" ? root("crossed-journal-prefix") : leanBytesRoot(Buffer.alloc(0)), bottomRole: "final-response", topRole: "final-response", bottomSourceRoot: root("source"), topSourceRoot: root("source"), bottomSnapshotRoot: root("snapshot"), topSnapshotRoot: root("snapshot") }
    fs.writeFileSync(join(c.ledger.directory, "pair-0.json"), leanCanonicalBytes({ ...pairBody, root: labRoot("lean-baseline-pair-v1", pairBody) }), { mode: 0o600 })
    fs.writeFileSync(join(c.ledger.directory, "source-final-response.json"), "{}", { mode: 0o600 })
    const receipt = vi.spyOn(lean, "readLeanChildEntry").mockReturnValue(entry as never)
    const actualRead = continuationHelper.readLeanContinuationJsonV2, claimRead = vi.spyOn(continuationHelper, "readLeanContinuationJsonV2").mockImplementation((path, cap, permissions, guard) => {
      const value = actualRead(path, cap, permissions, guard)
      return path === c.paths.claim && mode === "claim" ? { ...value, routeNamespace: "20261012-v4" } : value
    })
    const sentinel = new Error("INERT_EXTERNAL_SOURCE_BOUNDARY"), source = vi.spyOn(continuationSource, "validateLeanBaselineSource").mockImplementation(() => { throw sentinel }), provider = vi.spyOn(childProcess, "fork")
    try {
      const invoke = () => continuationAuthority.issueLeanBaselineContinuationRuntimeAuthorityV2(c.ledger, charge, {} as never, { budgetRoot: c.allocation.root, seat: "bottom" } as never, c.guard)
      if (mode === "valid") { expect(invoke).toThrow(sentinel); expect(source).toHaveBeenCalledOnce() }
      else { expect(invoke).toThrow(); expect(source).not.toHaveBeenCalled() }
      expect(claimRead.mock.calls.some(([path]) => path === c.paths.claim)).toBe(mode !== "entry")
      expect(claimRead.mock.calls.some(([path]) => path === lean.LEAN_BASELINE_CONTINUATION_PATHS_V4.claim)).toBe(false)
      expect(provider).not.toHaveBeenCalled()
    } finally { provider.mockRestore(); source.mockRestore(); claimRead.mockRestore(); receipt.mockRestore() }
  }, "20261013-v5"), 15000)
  it.each(["valid", "claim"] as const)("[continuation-stage-cadence-H] V6 real issuer joins through pair/journal before inert source sentinel: %s", mode => fixture((c) => {
    // Real admitted context, full guards and synthetic ledger/pair descriptors;
    // the external source boundary throws before any capability is issued.
    const slot = c.allocation.slots[0]!, body = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: c.allocation.root, slotRoot: slot.root, ordinal: 0 }, charge = { ...body, root: labRoot(body.schemaVersion, body) }
    const journal = Buffer.concat([leanCanonicalBytes({ kind: "charge", charge }), Buffer.from("\n")])
    fs.writeFileSync(join(c.ledger.directory, "ledger.ndjson"), journal)
    const entry = { allocationRoot: c.allocation.root, sourceRoot: c.allocation.sourceRoot, requestBytesRoot: c.allocation.requestBytesRoot, head: c.fixedHead }
    const pairBody = { schemaVersion: "lean-baseline-pair-v1", ordinal: 0, slotRoot: slot.root, requestRoot: slot.requestRoot, priorCharged: 50, priorLedgerByteLength: 0, priorLedgerBytesRoot: leanBytesRoot(Buffer.alloc(0)), bottomRole: "final-response", topRole: "final-response", bottomSourceRoot: root("source"), topSourceRoot: root("source"), bottomSnapshotRoot: root("snapshot"), topSnapshotRoot: root("snapshot") }
    fs.writeFileSync(join(c.ledger.directory, "pair-0.json"), leanCanonicalBytes({ ...pairBody, root: labRoot("lean-baseline-pair-v1", pairBody) }), { mode: 0o600 })
    fs.writeFileSync(join(c.ledger.directory, "source-final-response.json"), "{}", { mode: 0o600 })
    const receipt = vi.spyOn(lean, "readLeanChildEntry").mockReturnValue(entry as never)
    const actualRead = continuationHelper.readLeanContinuationJsonV2, claimRead = vi.spyOn(continuationHelper, "readLeanContinuationJsonV2").mockImplementation((path, cap, permissions, guard) => {
      const value = actualRead(path, cap, permissions, guard)
      return path === c.paths.claim && mode === "claim" ? { ...value, routeNamespace: "20261012-v4" } : value
    })
    const sentinel = new Error("INERT_EXTERNAL_SOURCE_BOUNDARY"), source = vi.spyOn(continuationSource, "validateLeanBaselineSource").mockImplementation(() => { throw sentinel }), provider = vi.spyOn(childProcess, "fork")
    try {
      const invoke = () => continuationAuthority.issueLeanBaselineContinuationRuntimeAuthorityV2(c.ledger, charge, {} as never, { budgetRoot: c.allocation.root, seat: "bottom" } as never, c.guard)
      if (mode === "valid") { expect(invoke).toThrow(sentinel); expect(source).toHaveBeenCalledOnce() }
      else { expect(invoke).toThrow(); expect(source).not.toHaveBeenCalled() }
      expect(claimRead.mock.calls.some(([path]) => path === c.paths.claim)).toBe(true)
      expect(claimRead.mock.calls.some(([path]) => path === lean.LEAN_BASELINE_CONTINUATION_PATHS_V4.claim)).toBe(false)
      expect(provider).not.toHaveBeenCalled()
    } finally { provider.mockRestore(); source.mockRestore(); claimRead.mockRestore(); receipt.mockRestore() }
  }, "20261014-v6"), 30000)
  it.each(["valid", "window", "context-paths", "context-window", "context-allocation", "context-ledger"] as const)("[continuation-v5] real retained scope before inert publication boundary: %s", mode => fixture((c) => {
    // Direct inert consumer invocation, not an ordinary reader process. External
    // receipt/context/time hooks are mocked; scope joins and c.guard stay real.
    // Claim and interval-close sentinels prevent all journal/publication writes.
    const send = Object.getOwnPropertyDescriptor(process, "send"); Object.defineProperty(process, "send", { value: undefined, configurable: true, writable: true })
    const before = { ...lean.readLeanTimeAccounting(c.ledger), active: false, closed: new Set(["continuation-run-admission", "pilot-entry"]), closes: new Map([["pilot-entry", c.window.anchorMs]]) }
    const time = vi.spyOn(lean, "readLeanTimeAccounting").mockReturnValue(before), terminal = vi.spyOn(lean, "readLeanChildTerminal").mockReturnValue({} as never), entry = vi.spyOn(lean, "readLeanChildEntry").mockReturnValue({ parentPid: 999991, childPid: 999992 } as never)
    const start = vi.spyOn(lean, "beginLeanInterval").mockImplementation(() => undefined as never), close = vi.spyOn(lean, "closeLeanInterval").mockImplementation(() => { throw new Error("INERT_NO_PUBLICATION") })
    const metadata = vi.spyOn(parentApi, "withLeanContinuationReaderMetadataV2").mockImplementation((_w, parse) => parse())
    const { root: _windowRoot, ...crossedWindowBody } = { ...c.window, routeNamespace: "20261012-v4" as const }, crossedWindow = { ...crossedWindowBody, root: labRoot(crossedWindowBody.schemaVersion, crossedWindowBody) }
    const window = vi.spyOn(parentApi, "readLeanBaselineContinuationWindowV2").mockReturnValue(mode === "window" ? crossedWindow : c.window)
    const context = vi.spyOn(parentApi, "openLeanBaselineContinuationContextV2").mockReturnValue({ ...c, ...(mode === "context-paths" ? { paths: lean.LEAN_BASELINE_CONTINUATION_PATHS_V4 } : {}), ...(mode === "context-window" ? { window: { ...c.window, root: root("crossed-window") } } : {}), ...(mode === "context-allocation" ? { allocation: { ...c.allocation, root: root("crossed-allocation") } } : {}), ...(mode === "context-ledger" ? { ledger: { ...c.ledger, directory: "/inert-crossed-ledger" } } : {}) } as never)
    const kill = vi.spyOn(process, "kill").mockImplementation(() => { throw Object.assign(new Error("inert absent pid"), { code: "ESRCH" }) })
    const publication = vi.spyOn(parentApi, "writeLeanContinuationArtifact").mockImplementation(() => { throw new Error("INERT_CLAIM_BOUNDARY") }), dispatch = vi.spyOn(childProcess, "fork")
    try {
      expect(() => continuationRetainedReader.verifyLeanBaselineContinuationRetainedV2(c.paths.request)).toThrow(mode === "window" ? /V2_READER_WINDOW_BINDING/ : /V2_TERMINAL_REFUSAL/)
      if (mode === "valid") { expect(start, "reader interval admitted").toHaveBeenCalledOnce(); expect(context, "context join reached").toHaveBeenCalledWith(c.paths.request, true); expect(publication).toHaveBeenCalledOnce(); expect(publication.mock.calls[0]?.[1]).toBe("reader-claim.json") }
      else expect(publication).not.toHaveBeenCalled()
      expect(publication.mock.calls.some(([, name]) => name === "retained-check.json")).toBe(false); expect(dispatch).not.toHaveBeenCalled()
    } finally { if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send"); dispatch.mockRestore(); publication.mockRestore(); kill.mockRestore(); context.mockRestore(); window.mockRestore(); metadata.mockRestore(); close.mockRestore(); start.mockRestore(); entry.mockRestore(); terminal.mockRestore(); time.mockRestore() }
  }, "20261013-v5"))
})
describe.each(["20261012-v4", "20261013-v5"] as const)("[continuation-v4] [continuation-v5] real driver namespace and mutation-free refusal %s", selectedNamespace => {
  const selected = selectedNamespace === "20261013-v5" ? lean.LEAN_BASELINE_CONTINUATION_PATHS_V5 : lean.LEAN_BASELINE_CONTINUATION_PATHS_V4
  it.each(["revoked", "throwing-prototype"] as const)("withholds hostile Proxy classifier details: %s", kind => {
    const privateDetail = "PRIVATE prototype payload /private/source"
    const prototype = vi.fn(() => { throw new Error(privateDetail) })
    const revocable = Proxy.revocable({}, {})
    const error = kind === "revoked" ? revocable.proxy : new Proxy({}, { getPrototypeOf: prototype })
    if (kind === "revoked") revocable.revoke()
    // Assert only finite results, never ask the test reporter to inspect the Proxy.
    expect(parentApi.leanContinuationPreparationCodeV4(error)).toBe("DETAILS_WITHHELD")
    const formatted = parentApi.leanBaselineContinuationPreparationFailureV4(error)
    expect(formatted).toBe("LEAN_BASELINE_PREPARATION_V4 stage=UNKNOWN code=DETAILS_WITHHELD\n")
    expect(formatted).not.toContain(privateDetail)
    if (kind === "throwing-prototype") expect(prototype).toHaveBeenCalledTimes(1)
  })
  const window = (namespace: "20261012-v3" | "20261012-v4" | "20261013-v5" = selectedNamespace) => {
    const body = { schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const, grantId: "inert-v4", approvalEvidence: { humanDecisionId: "inert-human", recordedBy: "inert-root" }, approvedAtMs: 1791840227000, anchorMs: 1791840227000, carryMs: 492285903, capMs: 521085903, deadlineMs: 1791869027000, durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace: namespace, reviewedSourceHead: "a".repeat(40), sourceRoot: root("source"), sourceGateRoot: root("source-gate"), planRoot: root("plan"), runOperator: "inert-runner", readerOperator: "inert-reader" }
    return { ...body, root: labRoot(body.schemaVersion, body) }
  }
  const fixture = (run: (dir: string, w: lean.LeanBaselineContinuationWindowV2) => void, namespace: "20261012-v3" | "20261012-v4" | "20261013-v5" = selectedNamespace) => {
    const dir = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "continuation-v4-driver-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir), w = window(namespace)
    const clock = vi.spyOn(Date, "now").mockReturnValue(w.anchorMs), actualExists = fs.existsSync
    const exists = vi.spyOn(fs, "existsSync").mockImplementation(path => actualExists(resolve(String(path))))
    try {
      fs.mkdirSync(resolve(".strategy-lab")); fs.mkdirSync(resolve(".planning/artifacts"), { recursive: true })
      fs.writeFileSync(resolve(selected.window), leanCanonicalBytes(w), { mode: 0o600 })
      run(dir, w)
    } finally { exists.mockRestore(); clock.mockRestore(); cwd.mockRestore(); fs.rmSync(dir, { recursive: true }) }
  }
  const absent = () => {
    const p = selected
    for (const path of [p.claim, p.store, p.allocation, p.temp]) expect(fs.existsSync(resolve(path))).toBe(false)
  }
  it("denies every unselected finite allocation even if advertised by the manifest, keeping selected metadata bounded", () => {
    const paths = [lean.LEAN_BASELINE_CONTINUATION_PATHS_V2, lean.LEAN_BASELINE_CONTINUATION_PATHS_V4, lean.LEAN_BASELINE_CONTINUATION_PATHS_V5], head = "a".repeat(40), manifest = paths.map(p => ({ path: p.allocation, root: root(p.allocation) }))
    const git = vi.spyOn(childProcess, "execFileSync").mockReturnValue(Buffer.from("{}"))
    try {
      expect(continuationGit.readLeanBaselineContinuationGitV2(["show", `${head}:${selected.allocation}`], manifest, window())).toEqual(Buffer.from("{}"))
      expect(git.mock.calls[0]?.[2]).toMatchObject({ maxBuffer: 262144, timeout: 1500, stdio: ["ignore", "pipe", "ignore"] })
      expect(continuationGit.readLeanBaselineContinuationGitV2(["show", `${head}:${lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.allocation}`], manifest)).toEqual(Buffer.from("{}"))
      git.mockClear()
      for (const p of paths.filter(p => p !== selected)) for (const operation of ["show", "rev-parse"]) expect(() => continuationGit.readLeanBaselineContinuationGitV2([operation, `${head}:${p.allocation}`], manifest, window())).toThrow(/GIT_V2_METADATA/)
      expect(() => continuationGit.readLeanBaselineContinuationGitV2(["show", `${head}:${lean.LEAN_BASELINE_CONTINUATION_PATHS_V5.allocation}`], manifest)).toThrow(/GIT_V2_METADATA/)
      expect(git).not.toHaveBeenCalled()
      for (const request of [selected.request.replace("-v", "-unknown-v"), `${selected.request}/extra`, selected.request.replace("202610", "202611")]) expect(() => parseLeanBaselineCommand(["prepare-continuation-v2", "--request", request])).toThrow()
    } finally { git.mockRestore() }
  })
  it("accepts only both exact public request strings, keeping hidden child syntax private", () => {
    for (const request of [lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.request, lean.LEAN_BASELINE_CONTINUATION_PATHS_V4.request, lean.LEAN_BASELINE_CONTINUATION_PATHS_V5.request]) for (const mode of ["prepare-continuation-v2", "run-continuation-v2", "verify-continuation-v2"]) expect(parseLeanBaselineCommand([mode, "--request", request])).toEqual({ mode, request })
    expect(() => parseLeanBaselineCommand(["child-continuation-v2", "--request", selected.request])).toThrow()
  })
  it("reads the selected real bounded window first and denies crossed namespace before mutation", () => {
    fixture((_dir, w) => { expect(parentApi.readLeanBaselineContinuationWindowV2(selected.request)).toEqual(w); absent() })
    fixture(() => { expect(() => parentApi.prepareLeanBaselineContinuationV2(selected.request)).toThrow(/WINDOW_NAMESPACE/); absent() }, "20261012-v3")
  })
  it("refuses missing window, consumed claim and missed full36 frontier with setup absent", () => {
    fixture((_dir, w) => {
      vi.mocked(Date.now).mockReturnValue(w.deadlineMs - 36 * LEAN_CAPS.matchMs - w.closureMs - w.offlineOverheadMs + 1)
      expect(() => parentApi.prepareLeanBaselineContinuationV2(selected.request)).toThrow(/WINDOW_EXPIRED/); absent()
      fs.unlinkSync(resolve(selected.window)); expect(() => parentApi.prepareLeanBaselineContinuationV2(selected.request)).toThrow(); absent()
    })
    fixture(() => {
      fs.mkdirSync(resolve(selected.temp), { mode: 0o700 })
      expect(() => parentApi.prepareLeanBaselineContinuationV2(selected.request)).toThrow(/GRANT_CLAIMED/)
      for (const path of [selected.claim, selected.store, selected.allocation]) expect(fs.existsSync(resolve(path))).toBe(false)
    })
  })
  it("selects setup ancestor membership without accepting V3 additions under V4", () => {
    const row = { path: ".strategy-lab", kind: "directory" as const, bytes: 1, allocatedBytes: 4096, dev: 1, ino: 2, mode: 0o755, mtimeMs: 1, ctimeMs: 1, rawRoot: null, members: [] }
    const additions = (p: typeof lean.LEAN_BASELINE_CONTINUATION_PATHS_V2 | typeof lean.LEAN_BASELINE_CONTINUATION_PATHS_V4 | typeof lean.LEAN_BASELINE_CONTINUATION_PATHS_V5) => [p.store, p.temp].map(path => path.split("/").at(-1)!).sort()
    expect(() => parentApi.validateLeanContinuationSetupDirectoriesV2([row], [{ ...row, members: additions(selected) }], window())).not.toThrow()
    expect(() => parentApi.validateLeanContinuationSetupDirectoriesV2([row], [{ ...row, members: additions(lean.LEAN_BASELINE_CONTINUATION_PATHS_V2) }], window())).toThrow(/SETUP_DIRECTORIES/)
  })
  it("rejects crossed TMPDIR and capacity before source/carry/setup, with no provider", () => fixture((_dir, w) => {
    const originalArgs = process.execArgv, core = vi.spyOn(childProcess, "execFileSync").mockImplementation((command => (command === "ps" ? "100\n" : "0\n") as never) as typeof childProcess.execFileSync), fork = vi.spyOn(childProcess, "fork")
    const disk = vi.spyOn(fs, "statfsSync").mockReturnValue({ bavail: 100000000000n, bsize: 1n } as never)
    try {
      process.execArgv = ["--import", "tsx"]
      vi.stubEnv("TSX_DISABLE_CACHE", "1"); vi.stubEnv("NODE_DISABLE_COMPILE_CACHE", "1")
      for (const key of ["NODE_OPTIONS", "NODE_COMPILE_CACHE", "NODE_REDIRECT_WARNINGS", "NODE_V8_COVERAGE"]) vi.stubEnv(key, undefined)
      vi.stubEnv("TMPDIR", resolve(lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.temp))
      expect(() => parentApi.prepareLeanBaselineContinuationV2(selected.request)).toThrow(/SCOPE/); absent()
      vi.stubEnv("TMPDIR", resolve(selected.temp))
      expect(() => parentApi.assertLeanBaselineContinuationScopeV2(true, w)).not.toThrow()
      const usage = process.memoryUsage(), memory = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...usage, rss: 4000000000 })
      try {
        expect(() => parentApi.prepareLeanBaselineContinuationV2(selected.request)).toThrow(/CAPACITY/); absent(); expect(fork).not.toHaveBeenCalled()
        const error = new TypeError(), getter = vi.fn(() => { throw new Error("PRIVATE getter") }); Object.defineProperty(error, "stack", { value: "PRIVATE static stack" }); Object.defineProperty(error, "message", { get: getter })
        expect(parentApi.leanContinuationPreparationCodeV4(error)).toBe("DETAILS_WITHHELD")
        expect(parentApi.leanBaselineContinuationPreparationFailureV4(error)).toBe("LEAN_BASELINE_PREPARATION_V4 stage=UNKNOWN code=DETAILS_WITHHELD\n"); expect(getter).not.toHaveBeenCalled(); absent()
      } finally { memory.mockRestore() }
    } finally { process.execArgv = originalArgs; vi.unstubAllEnvs(); core.mockRestore(); fork.mockRestore(); disk.mockRestore() }
  }))
  it("refuses malformed source/data joins before reading a window or private request", () => fixture((_dir, w) => {
    expect(() => parentApi.leanBaselineContinuationDataManifestV2(w, { sourceGate: null } as never)).toThrow(/SOURCE_GATE/)
    expect(() => parentApi.validateLeanBaselineContinuationRequestV2({ schemaVersion: "lean-baseline-continuation-request-v2", raw: "PRIVATE" }, w, {} as never)).toThrow(/REQUEST/)
    absent()
  }))
  it("builds the real selected manifest from canonical synthetic gates and denies crossed grant roots", () => fixture((_dir, originalWindow) => {
    const p = selected, implementationEntries = [{ path: "scripts/inert.ts", root: leanBytesRoot(Buffer.from("inert source")) }]
    const sourceRoot = labRoot("lean-baseline-continuation-implementation-v2", implementationEntries), planPath = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-BASELINE-CONTINUATION-PLAN-20261012.md", planRoot = leanBytesRoot(Buffer.from("inert plan"))
    const sourceGate: parentApi.LeanContinuationSourceGateV2 = { schemaVersion: "lean-baseline-continuation-source-gate-v2", plan_check: "passed", source_review: "passed", root_validation: "passed", source_verification: "passed", commands_closed: true, reviewedSourceHead: originalWindow.reviewedSourceHead, sourceRoot, sourceAuthor: "inert-author", sourceReviewer: "inert-reviewer", sourceVerifier: "inert-verifier" }
    const { root: _, ...windowBody } = { ...originalWindow, sourceRoot, planRoot, sourceGateRoot: labRoot(sourceGate.schemaVersion, sourceGate) }, w = { ...windowBody, root: labRoot(windowBody.schemaVersion, windowBody) }
    const dataGate: parentApi.LeanContinuationDataGateV2 = { schemaVersion: "lean-baseline-continuation-data-gate-v2", status: "passed", grantId: w.grantId, windowRoot: w.root, windowBytesRoot: leanBytesRoot(leanCanonicalBytes(w)), reviewedSourceHead: w.reviewedSourceHead, sourceRoot: w.sourceRoot, sourceGateRoot: w.sourceGateRoot, planRoot: w.planRoot, approvalEvidence: w.approvalEvidence, runOperator: w.runOperator, readerOperator: w.readerOperator, dataReviewer: "inert-data-reviewer", commands_closed: true }
    const gateBytes = Buffer.from(`\`\`\`json\n${Buffer.from(leanCanonicalBytes(sourceGate)).toString()}\n\`\`\`\n\`\`\`json\n${Buffer.from(leanCanonicalBytes(dataGate)).toString()}\n\`\`\`\n`)
    fs.mkdirSync(resolve("scripts")); fs.mkdirSync(resolve(".planning/phases/265-serious-current-rules-league-and-development-red-team"), { recursive: true })
    fs.writeFileSync(resolve(implementationEntries[0]!.path), "inert source", { mode: 0o644 }); fs.writeFileSync(resolve(planPath), "inert plan", { mode: 0o644 })
    fs.writeFileSync(resolve(p.gates), gateBytes, { mode: 0o644 }); fs.writeFileSync(resolve(p.window), leanCanonicalBytes(w))
    const planningEntries = [{ path: planPath, root: planRoot }, { path: p.gates, root: leanBytesRoot(gateBytes) }].sort((a, b) => a.path.localeCompare(b.path)), entries = [...implementationEntries, ...planningEntries].sort((a, b) => a.path.localeCompare(b.path))
    const source = { implementationEntries, planningEntries, entries, schemaVersion: "lean-baseline-continuation-source-manifest-v2" as const, admitting: false as const, root: sourceRoot, planningRoot: labRoot("lean-baseline-continuation-planning-source-v2", planningEntries), manifestRoot: labRoot("lean-baseline-continuation-source-manifest-v2", entries), sourceGate: { ...sourceGate }, sourceGateRoot: w.sourceGateRoot }
    const manifest = parentApi.leanBaselineContinuationDataManifestV2(w, source)
    expect(manifest.planningEntries.find(row => row.path === p.window)?.root).toBe(dataGate.windowBytesRoot)
    expect(manifest.planningEntries.some(row => row.path === lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.window)).toBe(false)
    expect(parentApi.validateLeanContinuationDataGateV2(dataGate, w, sourceGate)).toEqual(dataGate)
    const { root: _v3, ...crossedBody } = { ...w, routeNamespace: "20261012-v3" as const }, crossed = { ...crossedBody, root: labRoot(crossedBody.schemaVersion, crossedBody) }
    expect(() => parentApi.validateLeanContinuationDataGateV2(dataGate, crossed, sourceGate)).toThrow(/DATA_GATE/)
    expect(() => parentApi.validateLeanContinuationDataGateV2({ ...dataGate, grantId: "spent-grant" }, w, sourceGate)).toThrow(/DATA_GATE/)
    absent()
  }))
  it("reads only selected V4 descriptor metadata with reservations before the inert parser", () => fixture((_dir, w) => {
    const p = selected
    fs.mkdirSync(resolve(p.temp), { mode: 0o700 }); fs.mkdirSync(resolve(p.store), { mode: 0o700 })
    fs.writeFileSync(resolve(p.allocation), "{}", { mode: 0o644 })
    for (const name of ["allocation.json", "ledger.ndjson", "time.ndjson"]) fs.writeFileSync(resolve(join(p.store, name)), "{}", { mode: 0o600 })
    const actualStat = fs.lstatSync, stat = vi.spyOn(fs, "lstatSync").mockImplementation(actualStat)
    const disk = vi.spyOn(fs, "statfsSync").mockReturnValue({ bavail: 100000000000n, bsize: 1n } as never)
    const memory = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...process.memoryUsage(), rss: 100000000, arrayBuffers: 0 })
    const available = vi.spyOn(leagueHost, "observeLeagueAvailableMemoryBytes").mockReturnValue(4000000000)
    const ps = vi.spyOn(childProcess, "execFileSync").mockReturnValue("100\n" as never), parse = vi.fn(() => "inert-parsed")
    try {
      expect(parentApi.withLeanContinuationStoreMetadataV2(w, parse, 123)).toBe("inert-parsed")
      expect(parse).toHaveBeenCalledTimes(1)
      expect(stat.mock.calls.map(call => String(call[0]))).toContain(resolve(p.allocation))
      expect(stat.mock.calls.map(call => String(call[0]))).not.toContain(resolve(lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.allocation))
      memory.mockReturnValue({ ...process.memoryUsage(), rss: 4000000000 }); parse.mockClear()
      expect(() => parentApi.withLeanContinuationStoreMetadataV2(w, parse)).toThrow(/CAPACITY/); expect(parse).not.toHaveBeenCalled()
    } finally { stat.mockRestore(); disk.mockRestore(); memory.mockRestore(); available.mockRestore(); ps.mockRestore() }
  }))
  it("withholds raw private failure details and reports only finite V4 prepare stage/code", () => fixture((_dir, w) => {
    vi.mocked(Date.now).mockReturnValue(w.deadlineMs)
    let error: unknown
    try { parentApi.prepareLeanBaselineContinuationV2(selected.request) } catch (caught) { error = caught }
    expect(parentApi.leanBaselineContinuationPreparationFailureV4(error)).toBe("LEAN_BASELINE_PREPARATION_V4 stage=WINDOW code=WINDOW_EXPIRED\n")
    expect(parentApi.leanBaselineContinuationPreparationFailureV4(new Error("PRIVATE path source stack"))).toBe("LEAN_BASELINE_PREPARATION_V4 stage=UNKNOWN code=DETAILS_WITHHELD\n")
    const { root: _root, ...body } = { ...w, routeNamespace: "20261012-v3" as const }, v3 = { ...body, root: labRoot(body.schemaVersion, body) }
    fs.writeFileSync(resolve(lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.window), leanCanonicalBytes(v3), { mode: 0o600 })
    let legacyError: unknown
    try { parentApi.prepareLeanBaselineContinuationV2(lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.request) } catch (caught) { legacyError = caught }
    expect(parentApi.leanBaselineContinuationPreparationFailureV4(legacyError)).toBe("LEAN_BASELINE_PREPARATION_V4 stage=UNKNOWN code=DETAILS_WITHHELD\n")
    absent()
  }))
})
describe("continuation CLI and narrow metadata", () => {
  it("[continuation-v2] dispatches the exact verify request to the distinct retained reader", async () => {
    const request = lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.request
    const reader = vi.spyOn(continuationRetainedReader, "verifyLeanBaselineContinuationRetainedV2").mockReturnValue({ root: root("inert-check") } as never)
    try {
      expect(parseLeanBaselineCommand(["verify-continuation-v2", "--request", request])).toEqual({ mode: "verify-continuation-v2", request })
      await parentApi.leanBaselineMain(["verify-continuation-v2", "--request", request])
      expect(reader).toHaveBeenCalledTimes(1)
      expect(reader).toHaveBeenCalledWith(request)
      expect(() => parseLeanBaselineCommand(["verify-continuation-v2", "--request", lean.LEAN_BASELINE_CONTINUATION_PATHS.request])).toThrow()
    } finally { reader.mockRestore() }
  })
  it("observes one fresh complete parent manifest per callback and pins only the reviewed debug document", () => {
    const observe = vi.fn(() => ({ root: root("source"), planningRoot: root("planning") }))
    expect(parentApi.readLeanBaselineContinuationManifestRoot(root("planning"), observe)).toBe(root("source"))
    expect(observe).toHaveBeenCalledTimes(1)
    observe.mockReturnValue({ root: root("source"), planningRoot: root("changed") })
    expect(() => parentApi.readLeanBaselineContinuationManifestRoot(root("planning"), observe)).toThrow(/PLANNING_HOLD/)
    expect(observe).toHaveBeenCalledTimes(2)
    expect(parentApi.LEAN_BASELINE_CONTINUATION_PLANNING_PATHS.filter(p => p.startsWith(".planning/debug/"))).toEqual([".planning/debug/265-native-exit-reader-cost.md"])
  })
  it("accepts only the new exact request and keeps hidden child mode out of public dispatch", () => {
    const request = lean.LEAN_BASELINE_CONTINUATION_PATHS.request
    for (const mode of ["prepare-continuation", "run-continuation", "verify-continuation"]) {
      expect(parseLeanBaselineCommand([mode, "--request", request])).toEqual({ mode, request })
      expect(() => parseLeanBaselineCommand([mode, "--request", "/tmp/override.json"])).toThrow()
    }
    expect(() => parseLeanBaselineCommand(["child-continuation", "--request", request])).toThrow()
  })
  it("denies arbitrary programs, refs, paths and writes before any metadata process", () => {
    for (const args of [["status"], ["show", "HEAD:package.json"], ["show", `${"a".repeat(40)}:/etc/passwd`], ["show", `${"a".repeat(40)}:.strategy-lab/holdout/PREIMAGE`], ["rev-parse", "HEAD~1"], ["checkout", "main"], ["sh", "-c", "true"]]) expect(() => continuationGit.readLeanBaselineContinuationGit(args)).toThrow("LEAN_BASELINE_CONTINUATION_GIT_METADATA")
  })
})

describe("additive finite supervisor reason-v2 contract", () => {
  const fixture = (): parentApi.LeanSupervisorReasonEnvelopeV2 => {
    const body: Omit<parentApi.LeanSupervisorReasonEnvelopeV2, "root"> = { schemaVersion: "lean-parent-supervisor-reasons-v2", allocationRoot: root("allocation"), sourceRoot: root("source"), requestBytesRoot: root("request"), entryBytesRoot: root("entry"), head: "a".repeat(40), parentPid: 100, childPid: 101, exitCode: 0, signal: null, uncertain: false, reasons: [], observations: { entry: "published", childReady: "observed", resourceSampling: "observed", finalIdentity: "matched", failureReceipt: "absent", cleanup: "child_exit_observed", terminalization: "unobserved", initiatingCause: "unknown", resourceSamplingOperation: "none", resourceSamplingSequence: 0, resourceSamplingExitObserved: false } }
    return { ...body, root: labRoot("lean-parent-supervisor-reasons-v2", body) }
  }
  const reroot = (value: any) => { const { root: _ignored, ...body } = value; return { ...body, root: labRoot("lean-parent-supervisor-reasons-v2", body) } }
  it("accepts only separately rooted exact canonical v2 bytes", () => {
    const v = fixture(), bytes = leanCanonicalBytes(v)
    expect(parentApi.validateLeanSupervisorReasonBytesV2(bytes)).toEqual(v)
    expect(parentApi.leanSupervisorReasonRootV2(v)).toBe(v.root)
    expect(parentApi.isLeanSupervisorReasonEnvelope(v)).toBe(false)
    expect(() => parentApi.validateLeanSupervisorReasonBytes(bytes)).toThrow()
    for (const mutated of [Buffer.concat([Buffer.from(" "), bytes]), Buffer.alloc(4097), Buffer.from("{broken")]) expect(() => parentApi.validateLeanSupervisorReasonBytesV2(mutated)).toThrow()
  })
  it("requires finite first-exception attribution and rejects raw or contradictory fields", () => {
    const clean = fixture()
    const exception = reroot({ ...clean, uncertain: true, reasons: ["resource_sampling_exception"], observations: { ...clean.observations, resourceSampling: "exception", resourceSamplingOperation: "unknown", resourceSamplingSequence: 2147483647, resourceSamplingExitObserved: true } })
    expect(parentApi.isLeanSupervisorReasonEnvelopeV2(exception)).toBe(true)
    for (const patch of [{ resourceSamplingOperation: "none" }, { resourceSamplingOperation: "raw_error" }, { resourceSamplingSequence: 0 }, { resourceSamplingSequence: -1 }, { resourceSamplingSequence: 2147483648 }, { resourceSamplingSequence: 1.5 }, { resourceSamplingExitObserved: "false" }, { rawError: "PRIVATE" }]) expect(parentApi.isLeanSupervisorReasonEnvelopeV2(reroot({ ...exception, observations: { ...exception.observations, ...patch } }))).toBe(false)
    for (const patch of [{ resourceSamplingOperation: "child_rss" }, { resourceSamplingSequence: 1 }, { resourceSamplingExitObserved: true }]) expect(parentApi.isLeanSupervisorReasonEnvelopeV2(reroot({ ...clean, observations: { ...clean.observations, ...patch } }))).toBe(false)
    expect(parentApi.isLeanSupervisorReasonEnvelopeV2(reroot({ ...exception, uncertain: false }))).toBe(false)
    expect(parentApi.isLeanSupervisorReasonEnvelopeV2(reroot({ ...exception, rawError: "PRIVATE" }))).toBe(false)
    expect(parentApi.isLeanSupervisorReasonEnvelopeV2({ ...exception, root: root("wrong") })).toBe(false)
  })
  it("saturates operation order without wrapping or accepting invalid counters", () => {
    expect(parentApi.nextLeanSupervisorSamplingSequenceV2(0)).toBe(1)
    expect(parentApi.nextLeanSupervisorSamplingSequenceV2(2147483646)).toBe(2147483647)
    expect(parentApi.nextLeanSupervisorSamplingSequenceV2(2147483647)).toBe(2147483647)
    for (const invalid of [-1, 0.5, 2147483648, NaN, Infinity]) expect(() => parentApi.nextLeanSupervisorSamplingSequenceV2(invalid)).toThrow()
  })
})

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

const preparationParentAllocation = (mode: "v12-1" | "v13-1") => {
  const extension = mode === "v13-1" ? lean.LEAN_PREPARATION_CONTINUATION_V13_EXTENSION : lean.LEAN_SUPERVISOR_RETEST_V12_EXTENSION
  const p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 34, elapsedUpperBoundMs: extension.priorElapsedMs, allocatedDiskBytes: extension.physicalFloorBytes, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: root("history"), survivors: Array.from({ length: 695 }, (_, ordinal) => ({ identity: `.strategy-lab/inert-parent-survivor-${ordinal}`, allocatedBytes: 4096 })) }
  return lean.createLeanSupervisorCorrectionAllocation({ sourceRoot: root("source"), reviewRoot: root("review"), coldRoot: root("cold"), planRoot: extension.planRoot, seed: "inert-preparation-parent", candidateRoots: [root("a"), root("b")], requestRoots: [root("request")], route: "diagnostic", reuseGrantRoot: root("reuse"), supervisorDecisionRoot: extension.approvalRoot, acceptedCheckRoot: null, acceptedReaderCloseRoot: null, requestBytesRoot: root("request"), dataReviewRoot: root("data"), setupAccountingRoot: root("setup"), startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, timeboxExtension: extension, attemptOrdinal: 1, priorClosureRoot: root("old-carry"), continuationRoot: root("continuation"), predecessor: { ...p, root: labRoot(p.schemaVersion, p) } }, 8)
}
describe("actual authenticated preparation parent reason publication", () => {
  it.each([false, true])("publishes actual v13 reason-v2 accepted by both strict consumers (legacy opt-in %s)", async enabled => {
    const { child, settled } = beginParent(enabled, () => { host.allocation = preparationParentAllocation("v13-1") })
    await readyParent(child); exitParent(child)
    expect((await settled).error).toBeNull()
    const bytes = host.files.get("parent-supervisor-reasons.json")!
    expect(bytes).toBeDefined()
    const reason = parentApi.validateLeanSupervisorReasonBytesV2(bytes)
    const entry = host.entry, terminal = host.terminal
    expect(assertLeanSupervisorReasonCustodyV2(bytes, { allocationRoot: entry.allocationRoot, sourceRoot: entry.sourceRoot, requestBytesRoot: entry.requestBytesRoot, entryBytesRoot: leanBytesRoot(leanCanonicalBytes(entry)), head: entry.head, parentPid: entry.parentPid, childPid: entry.childPid, exitCode: terminal.exitCode, signal: terminal.signal, status: terminal.status })).toEqual(reason)
    expect(validateLeanPreparationContinuationReasonJoinV13(bytes, entry, terminal)).toEqual(reason)
    expect(host.order.indexOf("parent-supervisor-reasons.json")).toBeLessThan(host.order.indexOf("derive-terminal"))
    expect(reason.observations.initiatingCause).toBe("unknown")
  })
  it("keeps the strict v12 predicate narrow and its actual no-opt-in reason-v2 publication unchanged", async () => {
    expect(lean.isLeanSupervisorRetestMode("v13-1")).toBe(false)
    const { child, settled } = beginParent(false, () => { host.allocation = preparationParentAllocation("v12-1") })
    await readyParent(child); exitParent(child)
    expect((await settled).error).toBeNull()
    expect(parentApi.validateLeanSupervisorReasonBytesV2(host.files.get("parent-supervisor-reasons.json")!).schemaVersion).toBe("lean-parent-supervisor-reasons-v2")
  })
})

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

  // This legacy integration probe creates the canonical actual scratch path.
  // Source-only suites must never consume that path.
  it.skip("wrapper reports safe inherited scope without entering preparation or Matches", () => {
    const output = execFileSync("sh", ["scripts/run-v1-38-lean-baseline.sh", "--probe-launch-scope"], { cwd: resolve("."), env: { ...process.env, LEAN_BASELINE_LAUNCH_PROBE: "1", NODE_OPTIONS: "--trace-warnings", NODE_COMPILE_CACHE: "/tmp/leak", NODE_REDIRECT_WARNINGS: "/tmp/leak", NODE_V8_COVERAGE: "/tmp/leak" }, encoding: "utf8", timeout: 10_000 })
    expect(output).toContain("cache=1 compile=1")
    expect(output).toContain("node_options=unset compile_cache=unset warnings=unset coverage=unset core=0")
    expect(output).toContain("lean-baseline-20261004-v1-tmp")
  })
})

// Independent pre-extraction defaults copied from public source at 3d672717.
it("internal-observations-default preserves ordered catalogs, legacy aliases and real source closure", async () => {
  const observations = await import("./lib/v1-38-lean-continuation-observations.js")
  const CONTINUATION_PHASE = ".planning/phases/265-serious-current-rules-league-and-development-red-team/"
  const expected = { sourcePaths: [
  "scripts/run-v1-38-lean-baseline.ts", "scripts/run-v1-38-lean-baseline.sh",
  "scripts/lib/v1-38-lean-baseline-pipeline.ts", "scripts/lib/v1-38-lean-baseline-source.ts",
  "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-baseline-analysis.ts",
  "scripts/lib/v1-38-lean-baseline-metrics.ts",
  "scripts/lib/v1-38-lean-baseline-retained.ts", "scripts/lib/v1-38-lean-cold-corpus.ts",
  "scripts/lib/v1-38-lean-seal-metadata.ts",
  "scripts/lib/v1-38-lean-training-adapter.ts", "scripts/lib/v1-38-lean-experiment-authority.ts",
  "scripts/lib/v1-38-lean-baseline.ts", "packages/strategy-lab/src/league/lean-training.ts",
  "packages/strategy-lab/src/league/lean-experiment.ts", "scripts/run-v1-38-lean-experiment.ts",
  "scripts/lib/v1-38-lean-child-cli-terminal.ts", "scripts/lib/v1-38-factory-supervised-runtime.ts",
  "scripts/lib/v1-38-lean-container-match-session.ts", "scripts/lib/v1-38-league-prospective-lifetime.ts",
], continuationOwnedPaths: [
  "packages/strategy-lab/src/league/lean-experiment.ts", "scripts/lib/v1-38-lean-baseline-continuation.ts", "scripts/lib/v1-38-lean-baseline-continuation.test.ts",
  "scripts/lib/v1-38-lean-experiment-authority.ts", "scripts/lib/v1-38-lean-baseline-authority.test.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-baseline-match.test.ts",
  "scripts/run-v1-38-lean-baseline.ts", "scripts/lib/v1-38-lean-baseline-pipeline.ts", "scripts/lib/v1-38-lean-baseline-source.ts", "scripts/lib/v1-38-lean-baseline-pipeline.test.ts",
  "scripts/lib/v1-38-lean-baseline-retained.ts", "scripts/lib/v1-38-lean-baseline-retained.test.ts", "scripts/run-v1-38-lean-baseline.test.ts", "scripts/lib/v1-38-lean-container-match-session.ts",], continuationExtraPaths: ["packages/strategy-lab/src/league/lean-training.test.ts", "scripts/lib/v1-38-lean-baseline-analysis.test.ts", "scripts/lib/v1-38-lean-baseline-source.test.ts", "scripts/lib/v1-38-lean-startup-supervisor-v8.mjs", "AGENTS.md"], continuationPlanningPaths: [
  ".planning/PROJECT.md", ".planning/REQUIREMENTS.md", ".planning/ROADMAP.md", ".planning/STATE.md", ".planning/research/SUMMARY.md",
  ".planning/debug/265-native-exit-reader-cost.md",
  ...["265-16-PLAN.md", "265-15-PLAN.md", "265-15-PILOT-RETAINED-VERIFICATION-v2.md", "265-16-BASELINE-CONTINUATION-APPROVAL-20261012.md", "265-16-BASELINE-CONTINUATION-RESEARCH-20261012.md", "265-16-BASELINE-CONTINUATION-PLAN-20261012.md", "265-16-BASELINE-CONTINUATION-GATES-20261012.md"].map(name => `${CONTINUATION_PHASE}${name}`),
  ".planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/LEAN-EXPERIMENT-20261003.md",
  ".planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/LEAN-REMAINING-PLAN-20261003.md",] }
  const value = observations.readLeanContinuationExpectedObservations()
  expect(value.sourcePaths).toEqual(expected.sourcePaths)
  expect(value.continuationOwnedPaths).toEqual([...expected.continuationOwnedPaths, "scripts/lib/v1-38-lean-continuation-observations.ts"])
  expect(value.continuationExtraPaths).toEqual(expected.continuationExtraPaths)
  expect(value.continuationPlanningPaths).toEqual(expected.continuationPlanningPaths)
  expect(parentApi.LEAN_BASELINE_CONTINUATION_OWNED_PATHS).toEqual(value.continuationOwnedPaths)
  expect(parentApi.LEAN_BASELINE_CONTINUATION_PLANNING_PATHS).toEqual(value.continuationPlanningPaths)
  const manifest = parentApi.leanBaselineContinuationSourceManifest()
  expect(manifest.implementationEntries.find(row => row.path === "scripts/lib/v1-38-lean-continuation-observations.ts")?.root).toBe(leanBytesRoot(fs.readFileSync(resolve("scripts/lib/v1-38-lean-continuation-observations.ts"))))
})
// Public synthetic external observations only. Every hash, descriptor, schema,
// source collector, importer, controller, wrapper and failure publisher is real.
// No success object substitutes for any of those production boundaries.
const withInternalObservationTree = async (verify: boolean, run: (f: any) => Promise<void>, namespace: "20261015-v8" | "20261017-v9" | "20261017-v10" | "20261017-v11" = "20261015-v8", pilotStartElapsedMs = 0, deviceNegative?: "missing-hash" | "wrong-hash" | "metadata" | "directory-members" | "sealed") => {
  // Prospective checked test-only harness. Earlier 10s attempts below remain
  // CENSORED; this changes no production admission, resource or runtime limit.
  const harness = "OBS3-HARNESS-45000", fixtureLimitMs = 45000
  const began = performance.now(), realMono = process.hrtime.bigint.bind(process.hrtime)
  const fs = { ...await vi.importActual<typeof import("node:fs")>("node:fs") }
  const CP = { ...await vi.importActual<typeof import("node:child_process")>("node:child_process") }
  // Existing suite-wide fake-host wrappers otherwise wrap EVERY native stat,
  // read, ledger and publication call, even with host.active=false. Isolate the
  // connected path from them, then restore the exact old module objects.
  const legacyMockNames = ["node:fs", "node:child_process", "./run-v1-38-lean-experiment.js", "../packages/strategy-lab/src/league/lean-experiment.js"]
  const legacyMocks = await Promise.all(legacyMockNames.map(name => vi.importMock(name)))
  for (const name of legacyMockNames) vi.doUnmock(name)
  // Mutable export facades permit ONLY the named external resource/IPC seams;
  // every descriptor, byte read, hash and write is the unwrapped native owner.
  vi.doMock("node:fs", () => fs); vi.doMock("node:child_process", () => CP)
  const dir = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "internal-observations-")))
  const restored: Array<() => void> = [], args = process.execArgv, send = Object.getOwnPropertyDescriptor(process, "send"), connected = Object.getOwnPropertyDescriptor(process, "connected")
  let written = 0, maximumBytes = 0, status = "PARTIAL", stage = "imports", counts: Record<string, number> = {}
  const bounded = () => { if (performance.now() - began > fixtureLimitMs || written > 8 * 1024 * 1024) throw new Error(`PUBLIC_FIXTURE_BOUND_${stage}`) }
  try {
    vi.resetModules()
    const defaults = await vi.importActual<typeof import("./lib/v1-38-lean-continuation-observations.js")>("./lib/v1-38-lean-continuation-observations.js")
    const phase = ".planning/phases/265-serious-current-rules-league-and-development-red-team/", plan = `${phase}265-16-BASELINE-CONTINUATION-PLAN-20261012.md`
    const obs: any = { ...defaults.LEAN_CONTINUATION_EXPECTED_OBSERVATIONS, sourcePaths: [], continuationOwnedPaths: ["scripts/lib/v1-38-lean-continuation-observations.ts"], continuationExtraPaths: [], continuationPlanningPaths: [plan, `${phase}265-16-BASELINE-CONTINUATION-GATES-20261012.md`], closedCostV2: {}, spentV3Metadata: [], spentV4Metadata: [], spentV4Directories: [], spentV5Metadata: [], spentV5Directories: [], spentV6Metadata: [], spentV7Metadata: [], spentV7Directories: [], spentV8Metadata: [], spentV8Directories: [], spentV9Metadata: [], spentV9Directories: [], spentV10Metadata: [] }
    vi.doMock("./lib/v1-38-lean-continuation-observations.js", () => ({ ...defaults, readLeanContinuationExpectedObservations: () => obs }))
    const D = await import("./run-v1-38-lean-baseline.js"), L = await import("../packages/strategy-lab/src/league/lean-experiment.js"), C = await import("./lib/v1-38-lean-baseline-continuation.js"), R = await import("./lib/v1-38-lean-baseline-retained.js"), G = await import("./lib/v1-38-lean-container-match-session.js"), F = await import("./v1-38-factory-implementation.js"), H = await import("./run-v1-38-serious-league.js")
    const { labRoot: hash, freezeLabValue } = await import("../packages/strategy-lab/src/contracts.js"), { leanColdProcedureRoot: cold } = await import("./lib/v1-38-lean-baseline-pipeline.js")
    const p = namespace === "20261017-v11" ? L.LEAN_BASELINE_CONTINUATION_PATHS_V11 : namespace === "20261017-v10" ? L.LEAN_BASELINE_CONTINUATION_PATHS_V10 : namespace === "20261017-v9" ? L.LEAN_BASELINE_CONTINUATION_PATHS_V9 : L.LEAN_BASELINE_CONTINUATION_PATHS_V8, old = L.LEAN_BASELINE_CONTINUATION_PATHS, sourceHead = "c".repeat(40), head = { value: "d".repeat(40) }, reviewedHead = "e".repeat(40)
    const originalCwd = process.cwd(); process.chdir(dir); restored.push(() => process.chdir(originalCwd))
    const write = (name: string, value: string | Uint8Array, mode = 0o644) => { bounded(); const target = resolve(name); fs.mkdirSync(resolve(target, ".."), { recursive: true }); fs.writeFileSync(target, value, { mode }); fs.chmodSync(target, mode); written += Buffer.byteLength(value); bounded() }
    const json = (name: string, value: unknown, mode = 0o600) => write(name, L.leanCanonicalBytes(value), mode)
    const rooted = (value: Record<string, any>): any => { const { root: _, ...body } = value; return { ...body, root: hash(body.schemaVersion, body) } }
    const read = (name: string) => JSON.parse(fs.readFileSync(resolve(name), "utf8"))
    // External factory inventory, Git, host resources and coherent wall/mono
    // observations. Filesystem identities, modes, blocks and bytes stay actual.
    restored.push(vi.spyOn(F, "factoryAssessmentImplementationManifest").mockReturnValue({ entries: [], root: root("empty-external-factory") }).mockRestore)
    const resource = { fail: false, failAfterEntry: false, closingHeadObserved: false, closingHeadSample: 0, denialSample: 0, tripped: false, calls: 0 }
    restored.push(vi.spyOn(fs, "statfsSync").mockImplementation(() => {
      bounded()
      resource.calls++
      counts.resourceSamples = resource.calls
      // Instrumentation history is not evidence; counters survive. Keep the
      // actual repeated production samples, not millions of Vitest call rows.
      if (resource.calls % 512 === 0) { vi.mocked(fs.statfsSync).mockClear(); vi.mocked(process.memoryUsage).mockClear(); vi.mocked(H.observeLeagueAvailableMemoryBytes).mockClear(); vi.mocked(G.readLeanBaselineContinuationGitV2).mockClear(); vi.mocked(CP.execFileSync).mockClear(); vi.mocked(Date.now).mockClear(); vi.mocked(process.hrtime.bigint).mockClear() }
      const closingDenial = resource.failAfterEntry && resource.closingHeadObserved && !resource.tripped
      if (closingDenial) { resource.tripped = true; resource.denialSample = resource.calls }
      return { type: 0n, blocks: 100000000000n, bfree: 100000000000n, files: 1000000n, ffree: 1000000n, bavail: resource.fail || closingDenial ? 0n : 100000000000n, bsize: 1n }
    }).mockRestore)
    restored.push(vi.spyOn(process, "memoryUsage").mockReturnValue({ ...process.memoryUsage(), rss: 100000000, arrayBuffers: 0 }).mockRestore)
    restored.push(vi.spyOn(H, "observeLeagueAvailableMemoryBytes").mockReturnValue(4000000000).mockRestore)
    let logicalMs = 0, anchor = namespace === "20261017-v11" ? 1792242843861 : namespace === "20261017-v10" ? 1792241199001 : namespace === "20261017-v9" ? 1792198286001 : 1792093334001
    const tick = (ms: number) => { logicalMs += ms }
    restored.push(vi.spyOn(Date, "now").mockImplementation(() => anchor + logicalMs).mockRestore)
    restored.push(vi.spyOn(process.hrtime, "bigint").mockImplementation(() => 100000000000n + BigInt(logicalMs) * 1000000n).mockRestore)
    const git = (op: readonly string[]): Buffer => {
      bounded()
      // Shared external Git observation, used by BOTH the Git wrapper and
      // execFileSync seam. Local reserve/completeWrite never calls Git. The
      // first HEAD after actual entry+pilot start is therefore the real
      // controller closing check, after the parent's entered=true assignment.
      if (op.length === 2 && op[0] === "rev-parse" && op[1] === "HEAD" && resource.failAfterEntry && !resource.closingHeadObserved && fs.existsSync(resolve(p.store, "entry.json"))) {
        const observedEntry = L.readLeanChildEntry(ledger), observedTime = L.readLeanTimeAccounting(ledger)
        if (observedEntry.parentPid === process.pid && observedTime.active && observedTime.starts.get("pilot-entry") === observedEntry.wallStartMs && !observedTime.closed.has("pilot-entry")) {
          resource.closingHeadObserved = true; resource.closingHeadSample = resource.calls; counts.closingHeadObservations = 1
        }
      }
      if (op[0] === "rev-parse") return Buffer.from(`${head.value}\n`)
      if (op[0] === "merge-base") return Buffer.alloc(0)
      if (op[0] === "rev-list") return Buffer.from(op[4] === "b".repeat(40) || op.at(-1) === "b".repeat(40) ? `${"b".repeat(40)} ${"a".repeat(40)}\n` : `${head.value} ${sourceHead}\n`)
      if (op[0] === "diff") return Buffer.from(`${op[2] === "a".repeat(40) ? old.allocation : p.allocation}\n`)
      if (op[0] === "show") return fs.readFileSync(resolve(op[1]!.slice(op[1]!.indexOf(":") + 1)))
      throw new Error("UNEXPECTED_PUBLIC_GIT_OBSERVATION")
    }
    restored.push(vi.spyOn(G, "readLeanBaselineContinuationGitV2").mockImplementation(git).mockRestore)
    restored.push(vi.spyOn(CP, "execFileSync").mockImplementation(((command: string, op: string[], options?: { encoding?: string }) => { const bytes = command === "git" ? git(op) : Buffer.from(command === "ps" ? "100\n" : "0\n"); return options?.encoding ? bytes.toString("utf8") : bytes }) as typeof childProcess.execFileSync).mockRestore)
    restored.push(vi.spyOn(process, "kill").mockImplementation((() => { const e = new Error("public fake PID absent") as NodeJS.ErrnoException; e.code = "ESRCH"; throw e }) as typeof process.kill).mockRestore)
    process.execArgv = ["--import", "tsx"]; Object.defineProperty(process, "send", { value: undefined, configurable: true }); Object.defineProperty(process, "connected", { value: false, configurable: true })
    vi.stubEnv("TSX_DISABLE_CACHE", "1"); vi.stubEnv("NODE_DISABLE_COMPILE_CACHE", "1"); vi.stubEnv("TMPDIR", resolve(p.temp)); for (const key of ["NODE_OPTIONS", "NODE_COMPILE_CACHE", "NODE_REDIRECT_WARNINGS", "NODE_V8_COVERAGE"]) vi.stubEnv(key, undefined)
    stage = "public files"
    for (const name of [...obs.sourcePaths, ...obs.continuationOwnedPaths, ...obs.continuationPlanningPaths]) write(name, `public inert ${name}`)
    fs.mkdirSync(resolve(".strategy-lab"), { recursive: true })
    fs.mkdirSync(resolve(".planning/artifacts"), { recursive: true })
    // Required spent records, including the V6 absence contract. Only expected
    // metadata is synthetic; hashes and allocated block observations are real.
    // Minimal public opaque history: window/request/allocation/claim, not the
    // production large carry/hold/catalog history. Unmocked defaults separately
    // pin every production member; these leaf-only synthetic catalogs exercise
    // the same actual descriptor/membership/absence validators on fewer rows.
    for (const key of ["spentV3Metadata", "spentV4Metadata", "spentV5Metadata", "spentV6Metadata", "spentV7Metadata", ...(namespace !== "20261015-v8" ? ["spentV8Metadata" as const] : []), ...((namespace === "20261017-v10" || namespace === "20261017-v11") ? ["spentV9Metadata" as const] : [])] as const) {
      const selected = defaults.LEAN_CONTINUATION_EXPECTED_OBSERVATIONS[key].filter(row => key === "spentV9Metadata" || /(?:window-|request-)|\/window-claim\.json$/u.test(row.path))
      for (const [i, row] of selected.entries()) {
        const bytes = Buffer.alloc(key === "spentV9Metadata" ? row.bytes ?? 0 : 0), mode = "mode" in row ? row.mode : 0o600
        write(row.path, bytes, mode)
        obs[key].push({ ...row, bytes: bytes.length, rawRoot: L.leanBytesRoot(bytes), ...("allocatedBytes" in row ? { allocatedBytes: fs.lstatSync(resolve(row.path)).blocks * 512 } : {}) })
      }
    }
    for (const key of ["spentV4Directories", "spentV5Directories", "spentV7Directories", ...(namespace !== "20261015-v8" ? ["spentV8Directories" as const] : []), ...((namespace === "20261017-v10" || namespace === "20261017-v11") ? ["spentV9Directories" as const] : [])] as const) {
      const metadata = obs[key.replace("Directories", "Metadata")]
      for (const original of defaults.LEAN_CONTINUATION_EXPECTED_OBSERVATIONS[key]) {
        const row = { path: original.path, members: metadata.filter((item: any) => item.path.startsWith(original.path + "/")).map((item: any) => item.path.slice(original.path.length + 1)).sort() }
        obs[key].push(row); fs.mkdirSync(resolve(row.path), { recursive: true, mode: 0o700 }); fs.chmodSync(resolve(row.path), 0o700); expect(fs.readdirSync(resolve(row.path)).sort()).toEqual(row.members)
      }
    }
    // Six-success/one-failure closed capsule, identical validator shape to the
    // focused continuation test, carrying logical debt without a 90 MB payload.
    const originalInventory: any[] = []
    if (namespace === "20261017-v11") {
      const item = deviceNegative === "sealed" ? "sealed.bin" : "item.bin"
      write(`.strategy-lab/lean-public-history/${item}`, Buffer.alloc(131073, 79), 0o600)
      for (const name of [".strategy-lab/lean-public-history", `.strategy-lab/lean-public-history/${item}`]) {
        const s = fs.lstatSync(resolve(name)), members = s.isDirectory() ? fs.readdirSync(resolve(name)).sort() : undefined
        originalInventory.push({ path: name, kind: s.isDirectory() ? "directory" : "file", bytes: s.size, allocatedBytes: s.blocks * 512, dev: s.dev + 1, ino: s.ino, mode: s.mode & 0o777, mtimeMs: s.mtimeMs, ctimeMs: s.ctimeMs, rawRoot: s.isFile() ? L.leanBytesRoot(fs.readFileSync(resolve(name))) : null, ...(members ? { members } : {}) })
      }
      const file = originalInventory[1]!
      if (deviceNegative === "missing-hash") file.rawRoot = null
      if (deviceNegative === "wrong-hash") file.rawRoot = root("wrong-public-content")
      if (deviceNegative === "metadata") file.ino += 1
      if (deviceNegative === "directory-members") { originalInventory[0]!.members = ["not-authenticated.bin"]; originalInventory.splice(1) }
      if (deviceNegative === "sealed") file.kind = "sealed_metadata"
    }
    const oldRequest = Buffer.from("public old request"), predecessor = rooted({ schemaVersion: "lean-baseline-continuation-carry-v1", chargedMatches: 43, elapsedUpperBoundMs: 459375903, allocatedDiskBytes: Math.max(4096, originalInventory.reduce((sum, row) => sum + row.allocatedBytes, 0)), historicalPeakDiskBytes: "unknown", historicalPeakRssBytes: "unknown", custodyRoot: hash("lean-baseline-continuation-custody-v1", { inert: true }), inventoryRoot: hash("lean-baseline-continuation-inventory-v1", originalInventory), qualifiedReaderAuthority: "cost_only" })
    const a = L.createLeanBaselineContinuationAllocation({ sourceRoot: root("old-source"), reviewRoot: root("old-review"), coldRoot: root("old-cold"), planRoot: root("old-plan"), candidateRoots: [root("old-a"), root("old-b")], requestRoots: Array.from({ length: 36 }, (_, i) => root(`old-request-${i}`)), seed: "public-old", sourceHead: "a".repeat(40), planningRoot: root("old-planning"), requestBytesRoot: L.leanBytesRoot(oldRequest), offlineOverheadMs: 60000, predecessor })
    const events: any[] = [], charges: any[] = [], terminals: any[] = []
    for (let ordinal = 0; ordinal < 7; ordinal++) { const slot = a.slots[ordinal]!, charge = rooted({ schemaVersion: "lean-slot-charge-v1", allocationRoot: a.root, slotRoot: slot.root, ordinal }), terminal = { kind: "terminal", chargeRoot: charge.root, record: { classification: ordinal === 6 ? "system_failure" : "success", code: ordinal === 6 ? "SUPERVISOR_FAILURE" : "OK", cleanupComplete: true, outcome: ordinal === 6 ? null : "DRAW" }, replay: null }; charges.push(charge); terminals.push(terminal); events.push({ kind: "charge", charge }, terminal) }
    events.push({ kind: "stop", reason: "failure" })
    const records = a.slots.map((slot, i) => ({ slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: charges[i]?.root ?? null, terminal: terminals[i] ?? null, status: charges[i] ? terminals[i].record.classification : "unused" })), evidenceRoot = hash("lean-evidence-v1", { allocationRoot: a.root, events, records }), unusedOrdinals = Array.from({ length: 29 }, (_, i) => i + 7), oldHead = "b".repeat(40)
    const pipeline = rooted({ schemaVersion: "lean-baseline-continuation-pipeline-v1", unusedOrdinals }), entry = { allocationRoot: a.root, sourceRoot: a.sourceRoot, requestBytesRoot: a.requestBytesRoot, head: oldHead, parentPid: 1, childPid: 2, wallStartMs: a.window.anchorMs + 200 }
    const terminal = { allocationRoot: a.root, sourceRoot: a.sourceRoot, head: oldHead, entryBytesRoot: L.leanBytesRoot(L.leanCanonicalBytes(entry)), parentPid: 1, childPid: 2, status: "child_exited", exitCode: 0, signal: null, elapsedUpperBoundMs: 100, wallObservedMs: a.window.anchorMs + 300, physicalBytes: 88924160 }, parent = rooted({ schemaVersion: "lean-parent-supervisor-reasons-v1", allocationRoot: a.root, head: oldHead, entryBytesRoot: terminal.entryBytesRoot, parentPid: 1, childPid: 2, exitCode: 0, signal: null, uncertain: false })
    const result = { schemaVersion: "lean-baseline-continuation-result-v1", allocationRoot: a.root, sourceRoot: a.sourceRoot, planningRoot: a.planningRoot, requestBytesRoot: a.requestBytesRoot, head: oldHead, charged: 50, successful: 6, failure: null, status: "partial_or_failed_baseline", holdoutOpened: false, formationMaterialized: false, sourceAuthor: "author", runOperator: "runner", evidenceRoot, pipeline, unusedOrdinals, holdoutReservations: a.holdoutReservations, elapsedMs: 465187800 }, report = rooted({ schemaVersion: "lean-baseline-continuation-retained-v1", allocationRoot: a.root, head: oldHead, charged: 50, currentCharged: 7, successful: 6, complete: false, evidenceRoot, pipelineRoot: pipeline.root, sourceAuthor: "author", runOperator: "runner", unusedOrdinals }), check = rooted({ schemaVersion: "lean-baseline-continuation-retained-check-v1", allocationRoot: a.root, disposition: "gaps_found", failure: null, sourceHoldFailure: null, report, charged: 50, currentCharged: 7, unusedOrdinals, elapsedMs: 465187899, physicalBytes: 88924160 })
    const intervals = ["continuation-run-admission", "pilot-entry", "continuation-retained-verifier"].flatMap((id, i) => [{ kind: "start", id, atMs: a.window.anchorMs + i * 200 }, { kind: "close", id, atMs: a.window.anchorMs + i * 200 + 100 }]), carry = { carry: predecessor, inventory: originalInventory, custody: { inert: true } }
    expect(C.validateLeanContinuationClosedCapsuleV2(a, { carry, result, check, entry, terminal, parent, events, intervals })).toEqual({ elapsedMs: 465187899, allocatedDiskBytes: 88924160 })
    json(old.allocation, a, 0o644); write(old.request, oldRequest, 0o600)
    fs.mkdirSync(resolve(old.temp), { recursive: true, mode: 0o700 })
    for (const [name, value] of Object.entries({ allocation: a, carry, result, "retained-check": check, entry, "child-terminal": terminal, "parent-supervisor-reasons": parent })) json(`${old.store}/${name}.json`, value)
    write(`${old.store}/ledger.ndjson`, events.map(e => Buffer.from(L.leanCanonicalBytes(e)).toString()).join("\n") + "\n", 0o600); write(`${old.store}/time.ndjson`, intervals.map(e => Buffer.from(L.leanCanonicalBytes(e)).toString()).join("\n") + "\n", 0o600)
    Object.assign(obs.closedCostV2, { sourceHead: a.sourceHead, allocationCommit: oldHead, allocationBytesRoot: L.leanBytesRoot(L.leanCanonicalBytes(a)), resultBytesRoot: L.leanBytesRoot(L.leanCanonicalBytes(result)), checkBytesRoot: L.leanBytesRoot(L.leanCanonicalBytes(check)), checkRoot: check.root })
    stage = "current manifest"
    const base = D.leanBaselineContinuationSourceManifestV2(), sg = { schemaVersion: "lean-baseline-continuation-source-gate-v2", plan_check: "passed", source_review: "passed", root_validation: "passed", source_verification: "passed", commands_closed: true, reviewedSourceHead: reviewedHead, sourceRoot: base.root, sourceAuthor: "inert-author", sourceReviewer: "inert-reviewer", sourceVerifier: "inert-verifier" }
    // Same approved V8 numeric contract as existing fixtures, never a new route.
    const carryMs = L.leanContinuationGlobalFloorV2(anchor)
    const wb = { schemaVersion: "lean-baseline-continuation-window-v2", status: "approved", grantId: "public-internal-observations", approvalEvidence: { humanDecisionId: (namespace === "20261017-v10" || namespace === "20261017-v11") ? "human-approval-observed-20261017T124639Z" : namespace === "20261017-v9" ? "human-approval-observed-20261017T005126Z" : "human-approval-observed-20261015T194214Z", recordedBy: "public-inert-root" }, approvedAtMs: namespace === "20261017-v11" ? 1792241199000 : anchor - 1, anchorMs: anchor, carryMs, capMs: carryMs + 28800000, deadlineMs: anchor + 28800000, durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace: namespace, reviewedSourceHead: reviewedHead, sourceRoot: base.root, sourceGateRoot: hash(sg.schemaVersion, sg), planRoot: base.planningEntries.find(row => row.path === plan)!.root, runOperator: "inert-runner", readerOperator: "inert-reader" }, w = rooted(wb)
    if (namespace === "20261017-v11") {
      const oldWindow = rooted({ ...w, routeNamespace: "20261017-v10" })
      json(L.LEAN_BASELINE_CONTINUATION_PATHS_V10.window, oldWindow)
      write(L.LEAN_BASELINE_CONTINUATION_PATHS_V10.request, "public opaque spent V10 request", 0o600)
      for (const name of [L.LEAN_BASELINE_CONTINUATION_PATHS_V10.window, L.LEAN_BASELINE_CONTINUATION_PATHS_V10.request]) {
        const s = fs.lstatSync(resolve(name))
        obs.spentV10Metadata.push({ path: name, bytes: s.size, allocatedBytes: s.blocks * 512, mode: 0o600, maximum: 65536, rawRoot: L.leanBytesRoot(fs.readFileSync(resolve(name))) })
      }
    }
    const dg = { schemaVersion: "lean-baseline-continuation-data-gate-v2", status: "passed", grantId: w.grantId, windowRoot: w.root, windowBytesRoot: L.leanBytesRoot(L.leanCanonicalBytes(w)), reviewedSourceHead: reviewedHead, sourceRoot: base.root, sourceGateRoot: w.sourceGateRoot, planRoot: w.planRoot, approvalEvidence: w.approvalEvidence, runOperator: w.runOperator, readerOperator: w.readerOperator, dataReviewer: "inert-data-reviewer", commands_closed: true }
    write(p.gates, `\`\`\`json\n${Buffer.from(L.leanCanonicalBytes(sg))}\n\`\`\`\n\`\`\`json\n${Buffer.from(L.leanCanonicalBytes(dg))}\n\`\`\`\n`); json(p.window, w)
    const manifest = D.leanBaselineContinuationDataManifestV2(w, D.leanBaselineContinuationSourceManifestV2()), seed = "public-internal-observations", coldRoot = cold(seed)
    expect(manifest.implementationEntries.map(row => row.path)).toEqual([...obs.sourcePaths, ...obs.continuationOwnedPaths].sort((a, b) => a.localeCompare(b)))
    expect(D.LEAN_BASELINE_CONTINUATION_OWNED_PATHS).toHaveLength(1)
    counts = { implementation: manifest.implementationEntries.length, planning: manifest.planningEntries.length, spentMetadata: ["spentV3Metadata", "spentV4Metadata", "spentV5Metadata", "spentV6Metadata", "spentV7Metadata", ...(namespace !== "20261015-v8" ? ["spentV8Metadata" as const] : []), ...((namespace === "20261017-v10" || namespace === "20261017-v11") ? ["spentV9Metadata" as const] : [])].reduce((sum, key) => sum + obs[key].length, 0), spentDirectories: obs.spentV4Directories.length + obs.spentV5Directories.length + obs.spentV7Directories.length + obs.spentV8Directories.length + ((namespace === "20261017-v10" || namespace === "20261017-v11") ? obs.spentV9Directories.length : 0) }
    const request = { schemaVersion: "lean-baseline-continuation-request-v2", seed, sourceHead, sourceRoot: base.root, planningRoot: manifest.planningRoot, planRoot: w.planRoot, reviewRoot: w.sourceGateRoot, coldRoot, candidateRoots: D.deriveLeanBaselineCandidateRoots(coldRoot), requestRoots: D.deriveLeanBaselineRequestRoots({ seed, coldRoot, planRoot: w.planRoot, sourceRoot: base.root }), offlineOverheadMs: w.offlineOverheadMs, sourceAuthor: sg.sourceAuthor, runOperator: w.runOperator, readerOperator: w.readerOperator, windowRoot: w.root, windowBytesRoot: manifest.windowBytesRoot, sourceGateRoot: w.sourceGateRoot, dataReviewRoot: manifest.dataReviewRoot, manifestRoot: manifest.manifestRoot }
    json(p.request, request)
    stage = "real initial import"
    // Actual bounded public allocated bytes cover the unchanged known-file
    // lower bound. This is real no-refund disk accounting, not a sampler stub
    // or a 90 MB imitation of historical artifacts.
    write(".strategy-lab/lean-public-accounted-extra.bin", Buffer.alloc(namespace !== "20261015-v8" ? 2621440 : 1310720), 0o600)
    const review = manifest.entries.filter(row => row.path !== p.window).map(row => ({ ...row, commit: manifest.implementationEntries.some(s => s.path === row.path) ? reviewedHead : sourceHead, kind: manifest.implementationEntries.some(s => s.path === row.path) ? "reviewed_source" as const : "active_planning" as const }))
    if (deviceNegative) {
      expect(() => C.authenticateLeanBaselineContinuationCarryV2(git, review, bounded, w)).toThrow(/V11_CONTINUITY_/)
      status = "COMPLETE"; return
    }
    const imported = C.authenticateLeanBaselineContinuationCarryV2(git, review, bounded, w)
    counts.inventory = imported.inventory.length
    expect(imported.carry.chargedMatches).toBe(50); expect(imported.carry.elapsedUpperBoundMs).toBe(465187899); expect(imported.carry.allocatedDiskBytes).toBeGreaterThanOrEqual(88924160)
    freezeLabValue(obs)
    const allocation = L.createLeanBaselineContinuationAllocationV2({ ...Object.fromEntries(["sourceRoot", "reviewRoot", "coldRoot", "planRoot", "candidateRoots", "requestRoots", "seed", "sourceHead", "planningRoot", "manifestRoot", "sourceGateRoot", "dataReviewRoot", "windowBytesRoot"].map(key => [key, request[key as keyof typeof request]])) as lean.LeanBaselineContinuationInputV2, requestBytesRoot: L.leanBytesRoot(L.leanCanonicalBytes(request)), predecessor: imported.carry, window: w })
    fs.mkdirSync(resolve(p.temp), { recursive: true, mode: 0o700 }); fs.chmodSync(resolve(p.temp), 0o700)
    const ledger = L.createLeanLedger(resolve(p.store), allocation)
    json(p.allocation, allocation, 0o644); json(`${p.store}/carry.json`, imported); json(`${p.store}/source-manifest.json`, manifest)
    const claim = rooted({ schemaVersion: "lean-baseline-continuation-window-claim-v2", grantId: w.grantId, routeNamespace: w.routeNamespace, windowRoot: w.root, windowBytesRoot: request.windowBytesRoot, requestBytesRoot: allocation.requestBytesRoot, sourceHead, sourceRoot: request.sourceRoot, sourceGateRoot: request.sourceGateRoot, dataReviewRoot: request.dataReviewRoot, planningRoot: request.planningRoot, manifestRoot: request.manifestRoot })
    json(p.claim, claim); json(`${p.store}/source-hold.json`, rooted({ schemaVersion: "lean-baseline-continuation-source-hold-v2", allocationRoot: allocation.root, sourceHead, manifestRoot: allocation.manifestRoot, claimRoot: claim.root, rows: [] }))
    if (verify) {
      L.beginLeanInterval(ledger, "continuation-run-admission"); tick(1); L.closeLeanInterval(ledger, "continuation-run-admission"); tick(1)
      if (pilotStartElapsedMs) tick(pilotStartElapsedMs - 2)
      const currentEntry = { schemaVersion: "lean-child-entry-v2" as const, allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot: allocation.requestBytesRoot, head: head.value, parentPid: 811111, childPid: 811112, handshakeRoot: root("inert-handshake"), wallStartMs: Date.now(), monotonicStartNs: process.hrtime.bigint().toString() }
      L.publishLeanChildEntry(ledger, currentEntry); L.beginLeanInterval(ledger, "pilot-entry", currentEntry.wallStartMs); tick(1)
      L.publishLeanChildTerminal(ledger, L.deriveLeanChildTerminal(ledger, currentEntry, { exitCode: 1, signal: null, wallObservedMs: Date.now(), monotonicObservedNs: process.hrtime.bigint().toString(), status: "child_failed", parentRssBytes: 100000000, childRssObservedBytes: 0, physicalBytes: L.cumulativeLeanPhysicalBytes(ledger), freeBytes: 100000000000 })); tick(1)
    }
    stage = "connected execution"
    await run({ D, L, C, R, CP, fs, p, ledger, allocation, imported, git, review, originalInventory, obs, old, request, manifest, w, head, write, json, read, tick, resource, bounded, restored, note: (value: string) => { stage = value } })
    status = "COMPLETE"
  } finally {
    const measure = (path: string): number => fs.readdirSync(path, { withFileTypes: true }).reduce((sum, item) => sum + (item.isDirectory() ? measure(join(path, item.name)) : fs.lstatSync(join(path, item.name)).size), 0)
    maximumBytes = measure(dir)
    for (const restore of restored.reverse()) restore()
    process.execArgv = args
    if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send")
    if (connected) Object.defineProperty(process, "connected", connected); else Reflect.deleteProperty(process, "connected")
    vi.unstubAllEnvs(); vi.doUnmock("./lib/v1-38-lean-continuation-observations.js"); vi.resetModules()
    for (const [i, name] of legacyMockNames.entries()) vi.doMock(name, () => legacyMocks[i]!)
    fs.rmSync(dir, { recursive: true })
    const elapsedMs = performance.now() - began
    if (elapsedMs > fixtureLimitMs) status = "CENSORED"
    process.stdout.write(`INTERNAL_OBSERVATIONS_FIXTURE ${JSON.stringify({ harness, fixtureLimitMs, verify, status, stage, counts, maximumBytes, written, elapsedMs: Math.ceil(elapsedMs), cleanupIncluded: true, syntheticOnly: true })}\n`)
    expect(elapsedMs).toBeLessThanOrEqual(fixtureLimitMs); expect(maximumBytes).toBeLessThanOrEqual(8 * 1024 * 1024); expect(fs.existsSync(dir)).toBe(false); expect(realMono()).toBeGreaterThan(0n)
  }
}
it.each(["missing-hash", "wrong-hash", "metadata", "directory-members", "sealed"] as const)("continuation-device-v11-importer denies authenticated historical %s", deviceNegative => withInternalObservationTree(false, async () => { throw new Error("unexpected admitted fixture") }, "20261017-v11", 0, deviceNegative), 60000)
it("continuation-device-v11-importer authenticates device-only files/directories once and rejects copied proof, content and descriptor races", () => withInternalObservationTree(false, async f => {
  const { C, L, fs: native, originalInventory, imported, git, review, w, bounded } = f
  const target = originalInventory.find((row: any) => row.kind === "file"), actual = imported.inventory.find((row: any) => row.path === target.path)
  expect(actual.dev).not.toBe(target.dev); expect(actual.rawRoot).toBe(target.rawRoot)
  expect(() => C.reconcileLeanContinuationInventoryV2(originalInventory, imported.inventory, review, w)).toThrow(/IMMUTABLE_CHANGED/)
  expect(() => C.reconcileLeanContinuationInventoryV2(originalInventory, structuredClone(imported.inventory), review, w)).toThrow(/IMMUTABLE_CHANGED/)
  const legacy = { ...w, routeNamespace: "20261017-v10" }; const { root: _, ...body } = legacy
  expect(() => C.inventoryLeanContinuationSurvivorsV2(originalInventory, review, git, bounded, { ...body, root: labRoot(body.schemaVersion, body) })).toThrow()
  const reserved: number[] = []
  const again = () => C.authenticateLeanBaselineContinuationCarryV2(git, review, (n = 0) => { bounded(); reserved.push(n) }, w)
  expect(again().carry).toEqual(imported.carry); expect(reserved.filter(n => n === 65536).length).toBeGreaterThanOrEqual(6)
  const guard = C.createLeanContinuationIdentityGuardV2([], imported.inventory)
  const lstat = native.lstatSync.bind(native), fstat = native.fstatSync.bind(native), readSync = native.readSync.bind(native), openSync = native.openSync.bind(native)
  let targetFd = -1
  const opened = vi.spyOn(native, "openSync").mockImplementation(((path: string, ...args: any[]) => { const fd = openSync(path, ...args); targetFd = String(path) === resolve(target.path) ? fd : -1; return fd }) as any)
  try {
    const corrupted = vi.spyOn(native, "readSync").mockImplementation(((fd: number, buffer: Buffer, ...args: any[]) => { const n = readSync(fd, buffer, ...args); if (fd === targetFd && n) buffer.writeUInt8(buffer.readUInt8(0) ^ 1, 0); return n }) as any)
    expect(again).toThrow(/CONTINUITY_HASH/); corrupted.mockRestore()
    const raced = vi.spyOn(native, "fstatSync").mockImplementation(((fd: number, ...args: any[]) => { const s = fstat(fd, ...args); return fd === targetFd ? Object.assign(s, { dev: s.dev + 1 }) : s }) as any)
    expect(again).toThrow(/CONTINUITY_CHANGED/); raced.mockRestore()
  } finally { opened.mockRestore() }
  const drifted = vi.spyOn(native, "lstatSync").mockImplementation(((path: string, ...args: any[]) => { const s = lstat(path, ...args); return String(path) === resolve(target.path) ? Object.assign(s, { dev: s.dev + 1 }) : s }) as any)
  try { expect(guard).toThrow() } finally { drifted.mockRestore() }
  const oldBytes = native.readFileSync(resolve(L.LEAN_BASELINE_CONTINUATION_PATHS_V10.window))
  native.writeFileSync(resolve(L.LEAN_BASELINE_CONTINUATION_PATHS_V10.window), Buffer.alloc(oldBytes.length, 32))
  expect(again).toThrow(/ALLOWANCE_ANCHOR/)
}, "20261017-v11"), 60000)

it("continuation-device-v11-driver-bind actual importer binds fresh device and strict polling rejects later drift without historical rehash", () => withInternalObservationTree(false, async f => {
  const { D, p, fs: native, originalInventory, tick, w } = f
  f.note("V11 actual importer and bindArchive")
  tick(w.durationMs - 3060000)
  const context = D.openLeanBaselineContinuationContextV2(p.request)
  expect(context.fullSample().remainingSlots).toBe(36)
  const target = originalInventory.find((row: any) => row.kind === "file"), opened = vi.spyOn(native, "openSync")
  context.guard(); context.guard()
  expect(opened.mock.calls.some((call: any[]) => String(call[0]) === resolve(target.path))).toBe(false)
  opened.mockRestore()
  const lstat = native.lstatSync.bind(native), changed = vi.spyOn(native, "lstatSync").mockImplementation(((path: string, ...args: any[]) => { const s = lstat(path, ...args); return String(path) === resolve(target.path) ? Object.assign(s, { dev: s.dev + 2 }) : s }) as any)
  try { expect(() => context.stage("dispatch", () => context.guard())).toThrow() } finally { changed.mockRestore() }
  expect(() => context.guard()).toThrow()
}, "20261017-v11"), 60000)

for (const { namespace, tag } of [{ namespace: "20261017-v10" as const, tag: "continuation-next-v10-reader-remaining-closure" }, { namespace: "20261017-v11" as const, tag: "continuation-device-v11-retained-default" }]) it(`${tag} actual default reader admits40minutes, preserves31minute closure and refuses hard expiry (public synthetic history/resources)`, () => withInternalObservationTree(true, async f => {
  const { D, L, R, p, ledger, w, tick, read, fs } = f, stages: string[] = []
  f.note("remaining reader closure at40minutes")
  expect(w.deadlineMs - Date.now()).toBe(2400000)
  const before = L.readLeanTimeAccounting(ledger), close = before.closes.get("pilot-entry")
  expect(Date.now() - close).toBe(1)
  expect(w.closureMs - (Date.now() - close)).toBe(1859999)
  // Real default opener/importer/controller, private enrollment and both closing
  // barriers. Missing public result is deliberately nonaccepting, not a stubbed success.
  const result = R.verifyLeanBaselineContinuationRetainedV2(p.request, (stage: string) => { stages.push(stage); f.note(stage) })
  expect(stages).toContain("CLAIM"); expect(stages).toContain("PUBLICATION")
  expect(read(p.store + "/reader-claim.json").allocationRoot).toBe(ledger.allocation.root)
  expect(result).toMatchObject({ disposition: "gaps_found", failure: "CONTINUATION_READER_FAILURE", report: null })
  for (const value of [result, structuredClone(result), JSON.parse(JSON.stringify(result)), { ...result }]) expect(R.isLeanContinuationAcceptedPrivateCheckV6(value)).toBe(false)
  expect(L.readLeanTimeAccounting(ledger).closed.has("continuation-retained-verifier-v2")).toBe(true)
  const claimBytes = fs.readFileSync(resolve(p.store, "reader-claim.json")), timeBytes = fs.readFileSync(resolve(p.store, "time.ndjson"))
  tick(w.deadlineMs - Date.now()); expect(Date.now()).toBe(w.deadlineMs)
  expect(() => D.openLeanBaselineContinuationContextV2(p.request, true)).toThrow(/V2_WINDOW_EXPIRED/)
  expect(fs.readFileSync(resolve(p.store, "reader-claim.json"))).toEqual(claimBytes)
  expect(fs.readFileSync(resolve(p.store, "time.ndjson"))).toEqual(timeBytes)
}, namespace, 28800000 - 2400000 - 2), 60000)

it("continuation-next-v10-driver-sample actual default context fullSample uses truthful unfinished counts and journal floor (public synthetic history/resources)", () => withInternalObservationTree(false, async f => {
  const { D, L, p, ledger, allocation, w, tick, json, read } = f
  f.note("next-cell actual context")
  tick(w.durationMs - 3060000)
  const context = D.openLeanBaselineContinuationContextV2(p.request)
  const before = context.fullSample(); expect(before.remainingSlots).toBe(36); expect(before.charged).toBe(50)
  expect(before.nowMs).toBe(w.deadlineMs - 3060000)
  const start = Date.now(), entry = { schemaVersion: "lean-child-entry-v2", allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot: allocation.requestBytesRoot, head: f.head.value, parentPid: process.ppid, childPid: process.pid, handshakeRoot: root("public-sample-handshake"), wallStartMs: start, monotonicStartNs: process.hrtime.bigint().toString() }
  json(p.store + "/entry.json", entry); L.beginLeanInterval(ledger, "pilot-entry", start)
  context.stage("charge", () => L.chargeLeanSlot(ledger, allocation.slots[0], { freeBytes: 100000000000, availableMemoryBytes: 4000000000 }))
  context.startCell(); context.finishCell(); const active = context.fullSample(); expect(active.remainingSlots).toBe(36); expect(active.charged).toBe(51)
  const charge = L.readLeanLedger(ledger).charges.get(allocation.slots[0].root)
  context.stage("post_match", () => L.retainLeanMatch(ledger, charge, { classification: "success", code: "OK", outcome: "DRAW", elapsedMs: 10, cleanupComplete: true, invocationCount: 0, accountingRoot: root("accounting"), executionRoot: root("execution"), telemetry: { transitions: 0, events: 0 } }, [], undefined, () => {}))
  const terminal = context.fullSample(); expect(terminal.remainingSlots).toBe(35); expect(terminal.charged).toBe(51)
  // A legitimate higher journal floor cannot be displaced by frozen wall time.
  const events = L.readLeanLedger(ledger).events, path = p.store + "/ledger.ndjson"
  f.write(path, events.map((event: unknown) => Buffer.from(L.leanCanonicalBytes(event)).toString() + "\n").join("") + Buffer.from(L.leanCanonicalBytes({ kind: "resource", elapsedMs: w.capMs - 3060000 + 1, physicalBytes: 4096, bufferBytes: 0, scratchBytes: 0 })).toString() + "\n", 0o600)
  const provider = vi.fn(); expect(() => { context.fullSample(); provider() }).toThrow(/CAPACITY|FRONTIER/); expect(provider).not.toHaveBeenCalled()
  expect(L.readLeanLedger(ledger).charged).toBe(51); expect(read(p.store + "/allocation.json").slots).toHaveLength(36)
}, "20261017-v10"), 60000)

// CENSORED, not coverage: latest connected attempt stopped at IMPORT before
// interval/claim. 1 implementation + 3 planning, 13 opaque metadata + 6 dirs,
// inventory36, 6048 resource samples, 1412568 bytes, 10010ms including cleanup.
// The ONE prospective OBS3-HARNESS-45000 admission below is separate; no
// postclaim behavior is inferred from the earlier initial-import observation.
// Actual prospective attempt passed: 27059ms including cleanup, 1414512 bytes,
// 18043 resource samples. Real interval/claim/evidence-result/closed failure
// publication observed; actual/clone/deserialized private acceptance all false.
it.each([{ namespace: "20261015-v8" as const, name: "internal-observations-C" }, { namespace: "20261017-v9" as const, name: "continuation-route-v9-C" }])("$name actual CLI default importer claims before missing result and resource-checked cleanup", ({ namespace }) => withInternalObservationTree(true, async f => {
  const { D, L, R, p, ledger, resource, read } = f
  const stages: string[] = [], reader = (R as typeof import("./lib/v1-38-lean-baseline-retained.js")).verifyLeanBaselineContinuationRetainedV2
  f.restored.push(vi.spyOn(R as typeof import("./lib/v1-38-lean-baseline-retained.js"), "verifyLeanBaselineContinuationRetainedV2").mockImplementation((request, observe) => reader(request, s => { stages.push(s); f.note(s); observe?.(s) })).mockRestore)
  let failure: unknown
  const actual = await D.leanBaselineMain(["verify-continuation-v2", "--request", p.request]).catch((error: unknown) => { failure = error })
  process.stdout.write(`INTERNAL_OBSERVATIONS_C_PROGRESS ${JSON.stringify({ stages, diagnostic: D.leanBaselineContinuationReaderFailureV2(failure).trim(), claimExists: fs.existsSync(resolve(p.store, "reader-claim.json")), resultExists: fs.existsSync(resolve(p.store, "result.json")), timeActive: L.readLeanTimeAccounting(ledger).active, verifierClosed: L.readLeanTimeAccounting(ledger).closed.has("continuation-retained-verifier-v2"), resourceSamples: resource.calls })}\n`)
  expect(fs.existsSync(resolve(p.store, "reader-claim.json")), `${stages.join("->")} ${D.leanBaselineContinuationReaderFailureV2(failure)}`).toBe(true)
  const claim = read(`${p.store}/reader-claim.json`); expect(claim.allocationRoot).toBe(ledger.allocation.root)
  const time = L.readLeanTimeAccounting(ledger); expect(time.closed.has("continuation-retained-verifier-v2")).toBe(true); expect(time.active).toBe(false)
  expect(fs.existsSync(resolve(p.store, "result.json"))).toBe(false)
  const check = read(`${p.store}/retained-check.json`); expect(check.disposition).toBe("gaps_found"); expect(check.failure).toBe("CONTINUATION_READER_FAILURE"); expect(check.report).toBeNull()
  const ordered = ["IMPORT", "READER_INTERVAL", "CLAIM", "EVIDENCE_RESULT", "TERMINAL", "PUBLICATION"]
  for (let i = 1; i < ordered.length; i++) expect(stages.indexOf(ordered[i]!)).toBeGreaterThan(stages.indexOf(ordered[i - 1]!))
  expect(actual).toMatchObject({ disposition: "gaps_found", failure: "CONTINUATION_READER_FAILURE", report: null })
  for (const value of [actual, structuredClone(actual), JSON.parse(JSON.stringify(actual))]) expect(R.isLeanContinuationAcceptedPrivateCheckV6(value)).toBe(false)
  process.stdout.write(`INTERNAL_OBSERVATIONS_C_NONACCEPTANCE ${JSON.stringify({ disposition: actual.disposition, failure: actual.failure, acceptedObject: R.isLeanContinuationAcceptedPrivateCheckV6(actual), acceptedClone: R.isLeanContinuationAcceptedPrivateCheckV6(structuredClone(actual)), acceptedDeserialized: R.isLeanContinuationAcceptedPrivateCheckV6(JSON.parse(JSON.stringify(actual))) })}\n`)
  expect(resource.calls).toBeGreaterThan(10)
  expect(failure).toBeUndefined()
}, namespace), 60000)
// CENSORED, not coverage: latest connected attempt never verified fork/entry.
// Same catalog/inventory sizes as C; 7575 actual resource samples, 1411664 bytes,
// 10012ms including cleanup. The ONE prospective OBS3-HARNESS-45000 admission
// below is separate; it does not retroactively prove those old assertions.
// OBS3-HARNESS-45000 attempt ONE: PARTIAL, not a timing censor. 25611ms incl
// cleanup, 1412277 bytes, 18694 resource samples. Real fork/entry/observed exit
// and finite PARENT_CLAIM refusal passed; child-terminal absent/pilot unclosed.
// The external denial fired inside completeWrite(time), before entered=true,
// not the intended closing barrier. It remains failed; the separate checked
// OBS3-B-CLOSING-INJECTION correction below arms only on real closing HEAD.
// Corrected attempt passed: 24859ms including cleanup, 1413892 bytes, 18881
// resource samples; real closing HEAD at sample18733, denial at18734. Actual
// failed terminal/pilot closure/observed exit/finite PARENT/nonacceptance pass.
it.each([{ namespace: "20261015-v8" as const, name: "internal-observations-B" }, { namespace: "20261017-v9" as const, name: "continuation-route-v9-driver-B" }])("$name actual CLI wrapper reaches parent entry then owned closing denial with observed child exit", ({ namespace }) => withInternalObservationTree(false, async f => {
  const { D, L, R, CP, fs, p, ledger, resource, read, restored } = f
  const provider = vi.fn()
  const child = Object.assign(new EventEmitter(), { pid: 811113, connected: true, exitCode: null as number | null, signalCode: null as NodeJS.Signals | null,
    send: vi.fn((message: any) => { if (message.release) provider(); return true }),
    kill: vi.fn(() => { child.connected = false; child.signalCode = "SIGKILL"; child.emit("exit", null, "SIGKILL"); return true }),
  })
  let exits = 0; child.on("exit", () => { exits++ })
  restored.push(() => child.removeAllListeners())
  const fork = vi.spyOn(CP as typeof childProcess, "fork").mockImplementation((() => { queueMicrotask(() => child.emit("message", { ready: child.pid })); return child }) as unknown as typeof childProcess.fork)
  restored.push(fork.mockRestore)
  resource.failAfterEntry = true
  let failure: unknown
  try { await D.leanBaselineMain(["run-continuation-v2", "--request", p.request]) } catch (error) { failure = error }
  f.note(D.leanBaselineContinuationRunFailureV2(failure).trim())
  process.stdout.write(`INTERNAL_OBSERVATIONS_B_PROGRESS ${JSON.stringify({ correction: "OBS3-B-CLOSING-INJECTION", diagnostic: D.leanBaselineContinuationRunFailureV2(failure).trim(), forks: fork.mock.calls.length, closingHeadObserved: resource.closingHeadObserved, closingHeadSample: resource.closingHeadSample, denialSample: resource.denialSample, resourceDenialObserved: resource.tripped, entryExists: fs.existsSync(resolve(p.store, "entry.json")), childExitEvents: exits, terminalExists: fs.existsSync(resolve(p.store, "child-terminal.json")), resultExists: fs.existsSync(resolve(p.store, "result.json")), pilotClosed: L.readLeanTimeAccounting(ledger).closed.has("pilot-entry"), resourceSamples: resource.calls })}\n`)
  expect(fork).toHaveBeenCalledOnce()
  expect(resource.closingHeadObserved).toBe(true)
  expect(resource.closingHeadSample).toBeGreaterThan(0); expect(resource.denialSample).toBeGreaterThan(resource.closingHeadSample)
  expect(resource.tripped).toBe(true)
  expect(fs.existsSync(resolve(p.store, "run-claim.json"))).toBe(true)
  expect(fs.existsSync(resolve(p.store, "entry.json"))).toBe(true)
  expect(L.readLeanChildEntry(ledger).childPid).toBe(child.pid)
  expect(child.kill).toHaveBeenCalledWith("SIGKILL"); expect(exits).toBe(1)
  expect(provider).not.toHaveBeenCalled()
  expect(String(failure)).toBe("TypeError: LEAN_BASELINE_FAILED_DETAILS_WITHHELD")
  expect(D.leanBaselineContinuationRunFailureV2(failure)).toMatch(/^LEAN_BASELINE_RUN_PARENT stage=PARENT_CLAIM completed=false code=DETAILS_WITHHELD /u)
  const terminal = L.readLeanChildTerminal(ledger), reason = read(`${p.store}/parent-supervisor-reasons.json`)
  expect(terminal.status).toBe("child_failed"); expect(terminal.signal).toBe("SIGKILL")
  expect(reason.observations.cleanup).toBe("child_exit_observed")
  expect(L.readLeanTimeAccounting(ledger).closed.has("pilot-entry")).toBe(true)
  expect(L.readLeanTimeAccounting(ledger).active).toBe(false)
  expect(L.readLeanLedger(ledger).charged).toBe(50)
  expect(fs.existsSync(resolve(p.store, "result.json"))).toBe(false)
  expect(R.isLeanContinuationAcceptedPrivateCheckV6(reason)).toBe(false)
  expect(resource.calls).toBeGreaterThan(10)
  for (const event of ["message", "disconnect"]) expect(child.listenerCount(event)).toBe(0)
}, namespace), 60000)
