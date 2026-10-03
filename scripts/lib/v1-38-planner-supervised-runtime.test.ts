import { describe, expect, it, vi, afterEach } from "vitest"
const nativeStreamMock = vi.hoisted(() => ({ worker: undefined as any }))
vi.mock("node:worker_threads", async (original) => {
  const actual = await original<typeof import("node:worker_threads")>()
  return { ...actual, Worker: vi.fn(function (...args: any[]) { if (nativeStreamMock.worker) { Atomics.store(new Int32Array(args[1].workerData.start), 0, 1); return nativeStreamMock.worker }; return Reflect.construct(actual.Worker, args) }) }
})
import { performance } from "node:perf_hooks"
afterEach(() => { nativeStreamMock.worker = undefined; vi.restoreAllMocks() })
import { createHash } from "node:crypto"
import { defaultRuntimeMetadata, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { createInitialGameState, createStrategyInputV119, createSoldierBrainInputV119 } from "../../packages/engine/src/index.js"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { labRoot, LAB_ADMITTED_ROOTS } from "../../packages/strategy-lab/src/contracts.js"
import { WORKER_HARNESS_SOURCE } from "../../packages/runtime-js/src/worker-harness.js"
import { SubprocessSystemFailure } from "../../packages/runtime-js/src/subprocess-ipc.js"
import { admitPlannerSupervisorLifetime, createPlannerSupervisedRuntime, closePlannerRuntime } from "./v1-38-planner-supervised-runtime.js"
import * as plannerApi from "./v1-38-planner-supervised-runtime.js"
it("prospective lifetime rejects forged and partial authority without changing benchmark admission", () => {
  const base = { budgetRoot: labRoot("test", "budget"), attemptRoot: labRoot("test", "attempt"), containerName: "test", ownershipLabel: "test" }
  expect(admitPlannerSupervisorLifetime(base, 24800)).toBe(120000)
  expect(admitPlannerSupervisorLifetime({ ...base, benchmarkLifetimeMs: 3600000, observerHarness: {} as never }, 2200)).toBe(3600000)
  for (const options of [{ prospectiveLifetimeAuthority: {}, prospectiveLifetimeMs: 600000 }, { prospectiveLifetimeMs: 600000 }, { prospectiveLifetimeAuthority: {} }]) expect(() => admitPlannerSupervisorLifetime({ ...base, ...options } as never, 24800)).toThrow()
})
import type { LeanContainerMatchTransport, LeanContainerPersistentStreamFactory } from "./v1-38-lean-container-match-session.js"
import { buildLeanAuthenticatedHarnessSource } from "./v1-38-lean-container-match-session.js"
import { prospectiveLifetimeFixture } from "../../packages/strategy-lab/src/league/allocation.test.js"
import { createProspectiveLeagueExecutionAllocationV2 } from "../../packages/strategy-lab/src/league/allocation.js"
import { issueProspectiveLeagueLifetimeAuthority, claimProspectiveLeagueLifetimeAuthority, type ProspectiveLeagueRuntimeBinding } from "./v1-38-league-prospective-lifetime.js"
import { issueProspectiveLeagueHostReceiptAuthority, claimProspectiveLeagueHostReceiptAuthority } from "./v1-38-league-host-receipt.js"
import { createLeagueProspectiveAmendmentV3, createProspectiveLeagueExecutionAllocationV3 } from "../../packages/strategy-lab/src/league/allocation.js"
import { createLeagueRepository } from "../../packages/strategy-lab/src/league/repository.js"
import { LeagueRecordGraph } from "../run-v1-38-serious-league.js"
import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
const receiptDirectories: string[] = []
afterEach(() => { for (const directory of receiptDirectories.splice(0)) rmSync(directory, { recursive: true, force: true }) })

const source = "export default { selectActivations(input) { return { activationOrders: [], strategyMemory: input.strategyMemory }; }, soldierBrain(input) { return { action: { type: 'TURN_TO_STONE' }, soldierMemory: input.soldierMemory }; } };"
const runtime = { ...defaultRuntimeMetadata("typescript"), adapter: { ...defaultRuntimeMetadata("typescript").adapter, id: "runtime-js-container-subprocess" as const } }
const revision = () => buildStrategyRevision({ source, runtime })
// Exact first synthetic positive evacuation case formerly obtained through the
// full feasibility CLI corpus. Use the same canonical constructors directly.
const fixtureState = createInitialGameState({ matchId: "lab-corpus-0", seed: "lab-corpus-0", arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === "arena:smoke:v1")!, bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "lab-candidate", topStrategyRevisionId: "lab-fixture" })
const fixtureSelf = fixtureState.soldiers[0]!, fixtureEnemy = fixtureState.soldiers.find((soldier) => soldier.ownerPlayerId === "top")!
fixtureSelf.position = { x: 2, y: 4 }; fixtureSelf.facing = "UP"; fixtureSelf.lastSuccessfulMoveDirection = null
fixtureEnemy.position = { x: 2, y: 2 }; fixtureEnemy.facing = "DOWN"
fixtureState.roundNumber = 1; fixtureState.activationCount = 1; fixtureState.phaseNumber = 1; fixtureState.initiativePlayerId = "bottom"
const fixtureContext = { mission: "evacuation", family: "positive", ordinal: 0 }
fixtureState.players[0].strategyMemory = { fixtureContext, stalePhase: 1 }; fixtureSelf.soldierMemory = { fixtureContext, previous: "UP" }
// Preserve the old fixture-to-mission-paths-v2 mapping too, not just its base
// state. This is an immutable synthetic first-case packet, not a rules helper.
const fixtureMission = { schemaVersion: "mission-v1", kind: "evacuation", soldierId: fixtureSelf.id, issuedPhase: 1, issuedRound: 1, expiresPhase: 2, goal: { x: 5, y: 5 }, goalFacing: "UP", targetId: "", targetPosition: null, partnerId: "" }
const fixtureBrainInput = createSoldierBrainInputV119(fixtureState, fixtureSelf.id, 0, false, fixtureMission)
fixtureState.players[0].strategyMemory = { fixtureContext: { ordinal: 0, family: "positive", mission: "evacuation" }, missions: [fixtureMission] }
const corpus = { selectActivations: [{ input: createStrategyInputV119(fixtureState, "bottom") }], soldierBrain: [{ input: fixtureBrainInput }] }
it("host response receipt preserves exact former canonical feasibility fixture roots", () => {
  expect(labRoot("timing-input", corpus.selectActivations[0]!.input)).toBe("sha256:629ef6500887e18a66edfe378c0a8dacf08d81e720e499d8e5b79ba2caf814f8")
  expect(labRoot("timing-input", corpus.soldierBrain[0]!.input)).toBe("sha256:e312a34fb2b75be20a4847d5da07d93513a6bc72236172a854404499eec9f9f3")
})
const root = labRoot("synthetic-host-test", 1)
const fixture = (fault?: string) => {
  let exists = false
  const frames: Record<string, any>[] = []
  const calls: readonly string[][] = []
  const transport: LeanContainerMatchTransport = (_command, args) => {
    ;(calls as string[][]).push([...args])
    let status = 0; let stdout = ""; let stderr = ""
    if (args[0] === "inspect") { if (exists) stdout = "owner:phase263-test\n"; else { status = 1; stderr = "Error: No such object: phase263-test\n" } }
    if (args[0] === "create") { exists = true; stdout = "container-id\n" }
    if (args[0] === "rm") exists = false
    return { status, signal: null, stdout: Buffer.from(stdout), stderr: Buffer.from(stderr) }
  }
  const streamFactory: LeanContainerPersistentStreamFactory = () => ({ exchange(frame) {
    const q = JSON.parse(frame); frames.push(q)
    if (fault === "timeout") throw Error("synthetic timeout")
    if (fault === "unknown") throw Error("private source objective memory stderr stack")
    if (fault === "primitive") throw 42
    if (fault === "null") throw null
    if (fault === "forged-code") throw { code: "SUBPROCESS_EXIT", name: "SubprocessSystemFailure", message: "private source objective memory stderr stack" }
    if (fault === "forged-name") throw Object.assign(Error("private source objective memory stderr stack"), { name: "SubprocessSystemFailure", code: "SUBPROCESS_SIGNAL" })
    if (fault === "unknown-typed-code") throw new SubprocessSystemFailure("UNRECOGNIZED" as never, "private source objective memory stderr stack")
    if (fault === "typed-spawn") throw new SubprocessSystemFailure("SPAWN_FAILED", "private source objective memory stderr stack", { stderr: "private payload" })
    const r = JSON.parse(Buffer.from(q.payloadBase64, "base64").toString())
    const result = fault === "violation" ? { ok: false, violation: { type: "FORBIDDEN_CAPABILITY", message: "synthetic blocked" } }
      : { ok: true, value: r.methodName === "selectActivations" ? { activationOrders: [], strategyMemory: r.input.strategyMemory } : { action: { type: "TURN_TO_STONE" }, soldierMemory: r.input.soldierMemory } }
    const timing = q.timingBinding && fault !== "missing-timing" ? { binding: { ...q.timingBinding, ...(fault === "forged-timing" ? { inputRoot: "wrong" } : {}) }, durationMs: 2, complete: true } : undefined
    const inner = fault === "inner-surplus" ? { ...result, private: "private source objective memory stderr stack" } : fault === "inner-malformed" ? null : result
    return Buffer.from(JSON.stringify({ requestId: fault === "request" ? 999 : q.requestId, status: fault === "exit" ? 7 : 0, signal: fault === "signal" ? "SIGKILL" : null, stdoutBase64: Buffer.from(JSON.stringify(inner)).toString("base64"), stderrBase64: fault === "stdio" ? Buffer.from("private source objective memory stderr stack").toString("base64") : "", ...(timing ? { timing } : {}) }) + "\n")
  }, close() { return { status: fault === "cleanup" ? 1 : 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) } } })
  return { transport, streamFactory, frames, calls }
}
const options = (fault?: string) => ({ revision: revision(), attemptRoot: root, budgetRoot: root, matchId: "phase263:match", containerName: "phase263-test", ownershipLabel: "owner:phase263-test", image: LAB_ADMITTED_ROOTS.image, ...fixture(fault) })
const request = (method: "selectActivations" | "soldierBrain", id = "kernel:1") => ({ kind: method, requestId: id, semanticTupleId: MATCH_KERNEL.tupleId, coordinates: { phaseNumber: 1, roundNumber: 1, stage: "select_bottom", ordinal: 0 }, input: corpus[method][0]!.input }) as Parameters<ReturnType<typeof createPlannerSupervisedRuntime>["invoke"]>[0]
const hostReceiptOptions = (fault?: string) => {
  const opts = options(fault), input = prospectiveLifetimeFixture(), { root: _root, schemaVersion: _schema, ...body } = input.amendment
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "league-planner-receipt-"))); receiptDirectories.push(directory)
  const policy = { ...body.policy, operations: { ...body.policy.operations, hostResponseReceiptMilliseconds: 5000 as const } }
  const amendment = createLeagueProspectiveAmendmentV3({ ...body, policy, hostReceiptApproval: "265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002" })
  const allocation = createProspectiveLeagueExecutionAllocationV3({ ...input, operations: policy.operations, amendment, outputDirectories: { ...input.outputDirectories, league: directory } })
  const value = { cellRoot: labRoot("planner-receipt-cell", directory), allocationRoot: allocation.root }, start = { ...value, root: labRoot("league-cell-start-v1", value) }
  const runtime: ProspectiveLeagueRuntimeBinding = { revisionId: opts.revision.id, sourceRoot: `sha256:${opts.revision.sourceHash}`, executableRoot: `sha256:${opts.revision.metadata.sourceArtifact!.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: allocation.tupleRoot, runtimeLimitsRoot: allocation.runtimeRoot, image: allocation.operations.image, factoryAuthorizationRoot: root, factoryPacketRoot: root, factoryProposalRoot: root, factoryValidationRoot: root }
  const binding = { budgetRoot: allocation.root, attemptRoot: start.root, matchId: `league-${start.root.slice(7, 31)}`, seat: "bottom" as const, containerName: opts.containerName, ownershipLabel: opts.ownershipLabel, runtime }
  const graph = new LeagueRecordGraph(createLeagueRepository(directory), allocation.operations), charge = { kind: "cell-start" as const, root: graph.append("cell-start", { start }), value: start }
  const prospectiveLifetimeAuthority = issueProspectiveLeagueLifetimeAuthority(allocation, charge, binding), prospectiveHostReceiptAuthority = issueProspectiveLeagueHostReceiptAuthority(allocation, charge, binding)
  claimProspectiveLeagueLifetimeAuthority(prospectiveLifetimeAuthority, binding, 600000, "factory"); claimProspectiveLeagueHostReceiptAuthority(prospectiveHostReceiptAuthority, binding, "factory")
  return { ...opts, ...binding, prospectiveLifetimeAuthority, prospectiveLifetimeMs: 600000, prospectiveHostReceiptAuthority }
}
describe("host response receipt planner charge and isolation", () => {
  it("threads the opaque grant into the actual legacy session, charging before dispatch", () => {
    const opts = hostReceiptOptions(), original = opts.streamFactory, waits: number[] = []
    let provider: ReturnType<typeof createPlannerSupervisedRuntime>
    provider = createPlannerSupervisedRuntime({ ...opts, streamFactory: (...args) => { const stream = original(...args); return { ...stream, exchange(frame, config) { expect(provider.accounting).toHaveLength(1); expect(provider.accounting[0]).toMatchObject({ charged: true, completed: false }); waits.push(config.timeoutMilliseconds); return stream.exchange(frame, config) } } } })
    expect(provider.invoke(request("selectActivations"), provider.identity).completed).toBe(true)
    expect(waits).toEqual([5000]); expect(opts.frames[0]!.timeoutMilliseconds).toBe(1000)
    expect(() => createPlannerSupervisedRuntime(opts)).toThrow("CLAIM_REUSED")
    expect(opts.calls.filter((args) => args[0] === "create")).toHaveLength(1); expect(provider.close().cleanupComplete).toBe(true)
  })
  it("exact native parent expiry retains one incomplete system charge and cleanup", () => {
    const opts = hostReceiptOptions(); let waits = 0, hostWait = 0, dispatches = 0
    nativeStreamMock.worker = { postMessage(message: any) { if (message.type === "exchange") dispatches++; else Atomics.store(new Int32Array(message.control), 0, 1) }, terminate: vi.fn(async () => 0) }
    vi.spyOn(Atomics, "wait").mockImplementation((_view, _index, _value, timeout) => { if (++waits === 2) { hostWait = timeout!; return "timed-out" }; return "ok" })
    const provider = createPlannerSupervisedRuntime({ ...opts, streamFactory: undefined }), e = provider.invoke(request("selectActivations"), provider.identity)
    expect(hostWait).toBe(5000); expect(dispatches).toBe(1)
    expect(e).toMatchObject({ charged: true, completed: false, outputBytes: 0, result: { ok: false, systemFailure: { code: "MALFORMED_IPC", retryable: false } } })
    expect(plannerApi.getPlannerPrivateDiagnostic(provider, e)).toMatchObject({ stage: "stream_exchange", reason: "wait_timeout" })
    expect(() => provider.invoke(request("selectActivations", "next"), provider.identity)).toThrow("LAB_RUNTIME_STOPPED")
    expect(provider.accounting).toEqual([e]); expect(provider.close().cleanupComplete).toBe(true)
  })
  it.each(["scalar", "copy", "seat", "source", "benchmark", "diagnostic", "fixture-default"])("rejects %s before session construction", (fault) => {
    const opts = hostReceiptOptions(), changed = { ...opts }
    if (fault === "copy") changed.prospectiveHostReceiptAuthority = { ...opts.prospectiveHostReceiptAuthority }
    if (fault === "seat") changed.prospectiveLifetimeAuthority = { ...opts.prospectiveLifetimeAuthority, seat: "top" }
    if (fault === "source") changed.revision = buildStrategyRevision({ source: source.replace("TURN_TO_STONE", "WAIT"), runtime })
    const extra = fault === "scalar" ? { hostResponseReceiptMilliseconds: 5000 } : fault === "benchmark" ? { benchmarkLifetimeMs: 3600000 } : fault === "diagnostic" ? { retryV4LifetimeGrant: {} } : {}
    expect(() => createPlannerSupervisedRuntime({ ...changed, ...extra, ...(fault === "fixture-default" ? { transport: undefined } : {}) } as never)).toThrow()
    expect(opts.calls).toHaveLength(0)
  })
})
describe("private IPC diagnostics injected planner", () => {
  it.each(["timeout", "state"])("preserves actual native %s origin in one charged incomplete invocation", (fault) => {
    let dispatches = 0, waits = 0
    nativeStreamMock.worker = { postMessage(message: any) { if (message.type === "exchange") { dispatches++; Atomics.store(new Int32Array(message.control), 0, fault === "state" ? -6 : 0) } else Atomics.store(new Int32Array(message.control), 0, 1) }, terminate: vi.fn(async () => 0) }
    vi.spyOn(Atomics, "wait").mockImplementation(() => ++waits === 2 && fault === "timeout" ? "timed-out" : "ok")
    const opts = options(), host = createPlannerSupervisedRuntime({ ...opts, streamFactory: undefined }), e = host.invoke(request("selectActivations"), host.identity)
    expect((plannerApi as any).getPlannerPrivateDiagnostic(host, e)).toMatchObject({ stage: "stream_exchange", reason: fault === "timeout" ? "wait_timeout" : "non_success_state" })
    expect(e).toMatchObject({ charged: true, completed: false, outputBytes: 0, result: { ok: false, systemFailure: { code: "MALFORMED_IPC", retryable: false } } })
    expect(host.accounting).toEqual([e]); expect(host.verify(e)).toBe(true)
    expect(() => host.invoke(request("selectActivations", "next"), host.identity)).toThrow("LAB_RUNTIME_STOPPED")
    expect(dispatches).toBe(1); expect(closePlannerRuntime(host)).toEqual({ cleanupComplete: true, orphanedChild: false })
    expect(opts.calls.some((args) => args[0] === "rm")).toBe(true)
  })
  it("does not issue diagnostics from pre-issuance accounting when cleanup throws", () => {
    const opts = options("request"), original = opts.transport
    const host = createPlannerSupervisedRuntime({ ...opts, transport(command, args, config) { if (args[0] === "rm") throw Error("cleanup failed"); return original(command, args, config) } })
    expect(() => host.invoke(request("selectActivations"), host.identity)).toThrow("cleanup failed")
    const e = host.accounting[0]!
    expect(host.verify(e)).toBe(false); expect((plannerApi as any).getPlannerPrivateDiagnostic(host, e)).toBeUndefined()
    expect(opts.frames).toHaveLength(1)
  })
  it.each(["request", "inner-surplus", "inner-malformed", "unknown", "primitive", "null", "forged-code", "forged-name", "unknown-typed-code", "typed-spawn"])("binds %s without changing failure accounting or classification", (fault) => {
    const opts = options(fault), host = createPlannerSupervisedRuntime(opts), e = host.invoke(request("selectActivations"), host.identity)
    const api = plannerApi as any, diagnostic = api.getPlannerPrivateDiagnostic?.(host, e)
    const origin = fault === "request" ? ["outer_frame", "correlation_invalid"] : fault === "inner-surplus" ? ["inner_response", "keys_invalid"] : fault === "inner-malformed" ? ["inner_response", "object_invalid"] : ["primitive", "null"].includes(fault) ? ["executor", "unknown"] : ["stream_exchange", "unknown"]
    expect(diagnostic).toEqual({ stage: origin[0], reason: origin[1], identity: e.identity, invocationRoot: e.invocationRoot, requestId: e.requestId, method: e.method, inputRoot: e.inputRoot, ordinal: e.ordinal })
    expect(Object.isFrozen(diagnostic)).toBe(true); expect(JSON.stringify(diagnostic)).not.toContain("private")
    expect(api.verifyPlannerPrivateDiagnostic?.(host, e, diagnostic)).toBe(true)
    expect(api.verifyPlannerPrivateDiagnostic?.(host, e, structuredClone(diagnostic))).toBe(false)
    expect(api.getPlannerPrivateDiagnostic?.(host, structuredClone(e))).toBeUndefined()
    expect(api.getPlannerPrivateDiagnostic?.({ ...host }, e)).toBeUndefined()
    const other = createPlannerSupervisedRuntime(options("request")), otherE = other.invoke(request("selectActivations"), other.identity)
    expect(api.verifyPlannerPrivateDiagnostic?.(other, otherE, diagnostic)).toBe(false)
    expect(e.result).toEqual({ ok: false, violation: { type: "INVALID_OUTPUT", message: "Runtime system failure" }, systemFailure: { code: fault === "typed-spawn" ? "SPAWN_FAILED" : "MALFORMED_IPC", retryable: false } })
    expect(e).toMatchObject({ charged: true, completed: false, outputBytes: 0, ordinal: 0 })
    expect(host.accounting).toEqual([e]); expect(host.verify(e)).toBe(true)
    expect(() => host.invoke(request("selectActivations", "next"), host.identity)).toThrow("LAB_RUNTIME_STOPPED")
    expect(opts.frames).toHaveLength(1); expect(opts.frames[0]!.timeoutMilliseconds).toBe(1000)
    expect(closePlannerRuntime(host)).toEqual({ cleanupComplete: true, orphanedChild: false })
  })
  it.each([undefined, "violation"])("keeps normally returned %s evidence unchanged with no diagnostic", (fault) => {
    const host = createPlannerSupervisedRuntime(options(fault)), e = host.invoke(request("selectActivations"), host.identity)
    expect(e.completed).toBe(true); expect(e.outputBytes).toBe(Buffer.byteLength(JSON.stringify(e.result)))
    expect((plannerApi as any).getPlannerPrivateDiagnostic?.(host, e)).toBeUndefined()
    expect(e).not.toHaveProperty("privateDiagnostic"); expect(e.result).not.toHaveProperty("privateDiagnostic")
    closePlannerRuntime(host)
  })
})
it("prospective lifetime planner uses issued nested claim and includes synthetic session setup in exact expiry", () => {
  const allocation = createProspectiveLeagueExecutionAllocationV2(prospectiveLifetimeFixture()), opts = options(), selected = opts.revision
  const startValue = { cellRoot: labRoot("planner-lifetime", 1), allocationRoot: allocation.root }, start = { ...startValue, root: labRoot("league-cell-start-v1", startValue) }
  const bound: ProspectiveLeagueRuntimeBinding = { revisionId: selected.id, sourceRoot: `sha256:${selected.sourceHash}`, executableRoot: `sha256:${selected.metadata.sourceArtifact!.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: allocation.tupleRoot, runtimeLimitsRoot: allocation.runtimeRoot, image: allocation.operations.image, factoryAuthorizationRoot: root, factoryPacketRoot: root, factoryProposalRoot: root, factoryValidationRoot: root }
  const binding = { budgetRoot: allocation.root, attemptRoot: start.root, matchId: `league-${start.root.slice(7, 31)}`, seat: "bottom" as const, containerName: opts.containerName, ownershipLabel: opts.ownershipLabel, runtime: bound }
  const authority = issueProspectiveLeagueLifetimeAuthority(allocation, { kind: "cell-start", root: labRoot("planner-retained", start), value: start }, binding)
  expect(claimProspectiveLeagueLifetimeAuthority(authority, binding, 600000, "factory")).toBe(600000)
  let now = 0; vi.spyOn(performance, "now").mockImplementation(() => now)
  const originalTransport = opts.transport
  const selectedOptions = { ...opts, ...binding, prospectiveLifetimeAuthority: authority, prospectiveLifetimeMs: 600000, transport: ((command: any, args: any, transportOptions: any) => { if (args[0] === "create") now = 100000; return originalTransport(command, args, transportOptions) }) as typeof opts.transport }
  const provider = createPlannerSupervisedRuntime(selectedOptions)
  now = 599999; expect(provider.invoke(request("selectActivations"), provider.identity).result.ok).toBe(true)
  now = 600000; expect(() => provider.invoke(request("selectActivations", "next"), provider.identity)).toThrow("LAB_RUNTIME_STOPPED")
  expect(opts.calls.filter((args) => args[0] === "create")).toHaveLength(1)
  expect(opts.calls.some((args) => args[0] === "rm")).toBe(true)
  expect(() => createPlannerSupervisedRuntime(selectedOptions)).toThrow("CLAIM_REUSED")
  expect(opts.calls.filter((args) => args[0] === "create")).toHaveLength(1)
})

describe("planner selected-v1.19 host with injected transport only", () => {
  it("preserves typed subprocess exit through the real lean-session ABI executor chain", () => {
    const opts = options("exit"), host = createPlannerSupervisedRuntime(opts)
    const evidence = host.invoke(request("selectActivations"), host.identity)
    expect(evidence.result).toMatchObject({ ok: false, systemFailure: { code: "SUBPROCESS_EXIT", retryable: false } })
  })
  it.each([
    ["exit", "SUBPROCESS_EXIT"], ["signal", "SUBPROCESS_SIGNAL"], ["stdio", "STDIO_CAP_EXCEEDED"], ["typed-spawn", "SPAWN_FAILED"],
    ["request", "MALFORMED_IPC"], ["inner-surplus", "MALFORMED_IPC"], ["inner-malformed", "MALFORMED_IPC"],
    ["unknown", "MALFORMED_IPC"], ["forged-code", "MALFORMED_IPC"], ["forged-name", "MALFORMED_IPC"], ["unknown-typed-code", "MALFORMED_IPC"],
  ])("keeps %s typed-or-fallback failure private, charged once and closed", (fault, code) => {
    const opts = options(fault), host = createPlannerSupervisedRuntime(opts)
    const evidence = host.invoke(request("selectActivations"), host.identity)
    expect(evidence.result).toEqual({ ok: false, violation: { type: "INVALID_OUTPUT", message: "Runtime system failure" }, systemFailure: { code, retryable: false } })
    expect(evidence).toMatchObject({ charged: true, completed: false, outputBytes: 0, ordinal: 0 })
    expect(host.verify(evidence)).toBe(true); expect(host.verify(structuredClone(evidence))).toBe(false)
    const calls = opts.calls.length
    expect(() => host.invoke(request("selectActivations", "second"), host.identity)).toThrow("LAB_RUNTIME_STOPPED")
    expect(host.accounting).toEqual([evidence]); expect(opts.frames).toHaveLength(1)
    expect(opts.calls).toHaveLength(calls)
    expect(closePlannerRuntime(host)).toEqual({ cleanupComplete: true, orphanedChild: false })
  })
  it("rejects forged, grantless, and mixed v4 lifetime requests without constructing a container", () => {
    for (const key of ["observerHarness", "transport", "streamFactory", "benchmarkLifetimeMs"]) expect(() => createPlannerSupervisedRuntime({ ...options(), retryV4LifetimeGrant: {} as never, [key]: undefined })).toThrow("RETRY_V4_CONSTRUCTOR_OVERRIDE")
    const binding = { budgetRoot: root, attemptRoot: root, containerName: "fake", ownershipLabel: "fake" }
    expect(() => admitPlannerSupervisorLifetime({ ...binding, retryV4LifetimeMs: 240_000 }, 24800)).toThrow("RETRY_V4_GRANT")
    expect(() => admitPlannerSupervisorLifetime({ ...binding, retryV4LifetimeMs: 240_000, retryV4LifetimeGrant: {} as never }, 24800)).toThrow("RETRY_V4_IDENTITY")
    expect(() => admitPlannerSupervisorLifetime({ ...binding, retryV4LifetimeMs: 240_000, retryV4LifetimeGrant: {} as never, oneCellLifetimeMs: 240_000, oneCellLifetimeGrant: {} as never }, 24800)).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
    expect(() => admitPlannerSupervisorLifetime({ ...binding, retryV4LifetimeMs: 240_000, retryV4LifetimeGrant: {} as never, transport: fixture().transport }, 24800)).toThrow("RETRY_V4_MODE")
  })
  it("rejects grantless and mixed one-cell lifetime requests before a container exists", () => {
    expect(() => admitPlannerSupervisorLifetime({ budgetRoot: root, attemptRoot: root, containerName: "fake", ownershipLabel: "fake", oneCellLifetimeMs: 240_000 }, 2200)).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
    expect(() => admitPlannerSupervisorLifetime({ budgetRoot: root, attemptRoot: root, containerName: "fake", ownershipLabel: "fake", oneCellLifetimeMs: 240_000, oneCellLifetimeGrant: {} as never, pilotLifetimeMs: 240_000, pilotLifetimeGrant: {} as never }, 2200)).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
  })
  it.each(["pilotLifetimeGrant", "pilotLifetimeMs", "oneCellLifetimeGrant", "oneCellLifetimeMs"])("rejects retired %s before revision, grant, transport, observer or session work", (key) => {
    const touched = vi.fn(() => { throw Error("must not read") }), transport = vi.fn(), streamFactory = vi.fn()
    for (const value of [undefined, null, {}, 240000]) {
      const opts = Object.defineProperties({ [key]: value, transport, streamFactory, retryV4LifetimeGrant: {} }, { revision: { get: touched }, observerHarness: { get: touched }, benchmarkLifetimeMs: { get: touched } })
      for (let attempt = 0; attempt < 2; attempt++) {
        expect(() => admitPlannerSupervisorLifetime(opts as never, 2200)).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
        expect(() => createPlannerSupervisedRuntime(opts as never)).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
      }
    }
    const inherited = Object.create({ [key]: undefined })
    expect(() => admitPlannerSupervisorLifetime(inherited, 2200)).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
    expect(() => createPlannerSupervisedRuntime(inherited)).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
    const accessor = Object.defineProperty({}, key, { get: touched })
    expect(() => createPlannerSupervisedRuntime(accessor as never)).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
    expect(touched).not.toHaveBeenCalled(); expect(transport).not.toHaveBeenCalled(); expect(streamFactory).not.toHaveBeenCalled()
  })
  it("keeps the ordinary 120-second and explicit benchmark lifetime admissions distinct", () => {
    const binding = { budgetRoot: root, attemptRoot: root, containerName: "ordinary", ownershipLabel: "ordinary" }
    expect(admitPlannerSupervisorLifetime(binding, 24800)).toBe(120000)
    expect(admitPlannerSupervisorLifetime({ ...binding, benchmarkLifetimeMs: 180000, observerHarness: { source: WORKER_HARNESS_SOURCE, machineRoot: root, expectedRoot: root } }, 2200)).toBe(180000)
  })
  it("permits explicit benchmark lifetime past120s while retaining the Match deadline", () => {
    let now = 0
    vi.spyOn(performance, "now").mockImplementation(() => now)
    const opts = options()
    const benchmark = createPlannerSupervisedRuntime({ ...opts, invocationLimit: 2200, benchmarkLifetimeMs: 180000, observerHarness: { source: WORKER_HARNESS_SOURCE, machineRoot: root, expectedRoot: `sha256:${createHash("sha256").update(buildLeanAuthenticatedHarnessSource(WORKER_HARNESS_SOURCE)).digest("hex")}` } })
    expect(benchmark.invoke(request("selectActivations", "first"), benchmark.identity).result.ok).toBe(true)
    now = 132000
    expect(benchmark.invoke(request("soldierBrain", "after120"), benchmark.identity).result.ok).toBe(true)
    now = 180000
    expect(() => benchmark.invoke(request("soldierBrain", "expired"), benchmark.identity)).toThrow(/STOPPED/)
    const match = createPlannerSupervisedRuntime(options())
    now += 120000
    expect(() => match.invoke(request("soldierBrain"), match.identity)).toThrow(/STOPPED/)
    expect(opts.frames.every(frame => frame.timeoutMilliseconds === 1000)).toBe(true)
  })
  it("preserves both method outputs and memory through actual selected executor", () => {
    const opts = options(); const host = createPlannerSupervisedRuntime(opts)
    for (const method of ["selectActivations", "soldierBrain"] as const) {
      const e = host.invoke(request(method, `kernel:${method}`), host.identity)
      expect(e.result.ok).toBe(true); expect(e.completed).toBe(true); expect(host.verify(e)).toBe(true)
      expect(host.verify(structuredClone(e))).toBe(false)
    }
    expect(opts.frames).toHaveLength(2)
    expect(opts.frames[0]).toMatchObject({ mode: "legacy", timeoutMilliseconds: 1000, stdoutByteLimit: 262144, stderrByteLimit: 65536 })
    expect(opts.calls.find((a) => a[0] === "create")).toEqual(expect.arrayContaining(["--cpus", "2", "--memory", "256m", "--network", "none"]))
    expect(closePlannerRuntime(host).cleanupComplete).toBe(true)
  })
  it.each(["image", "abi", "source", "limits"])("rejects wrong %s before container creation", (fault) => {
    const opts = options(); const changed = structuredClone(opts.revision)
    if (fault === "abi") changed.runtime.abiVersion = "strategy-runtime-abi-v1.18" as typeof changed.runtime.abiVersion
    if (fault === "source") changed.sourceHash = "0".repeat(64)
    if (fault === "limits") changed.runtime.limits.timeoutMs = 50
    expect(() => createPlannerSupervisedRuntime({ ...opts, revision: changed, ...(fault === "image" ? { image: "other" } : {}) })).toThrow()
    expect(opts.calls).toHaveLength(0)
  })
  it.each(["timeout", "request"])("charges %s and poisons subsequent dispatch", (fault) => {
    const opts = options(fault); const host = createPlannerSupervisedRuntime(opts)
    const e = host.invoke(request("selectActivations"), host.identity)
    expect(e).toMatchObject({ charged: true, result: { ok: false, systemFailure: { retryable: false } } })
    expect(() => host.invoke(request("selectActivations", "next"), host.identity)).toThrow()
    expect(opts.frames).toHaveLength(1)
  })
  it("preserves runtime violations, rejects replay and bad input, and records cleanup failure", () => {
    const host = createPlannerSupervisedRuntime(options("violation"))
    const e = host.invoke(request("selectActivations"), host.identity)
    expect(e.result).toMatchObject({ ok: false, violation: { type: "FORBIDDEN_CAPABILITY" } })
    expect(() => host.invoke(request("selectActivations"), host.identity)).toThrow()
    closePlannerRuntime(host)
    const bad = createPlannerSupervisedRuntime(options("cleanup"))
    expect(() => bad.invoke({ ...request("selectActivations"), input: {} } as any, bad.identity)).toThrow()
    expect(closePlannerRuntime(bad).cleanupComplete).toBe(false)
  })
  it.each([undefined, "missing-timing", "forged-timing"])("binds private timing and fails closed on %s", (fault) => {
    const opts = options(fault)
    const host = createPlannerSupervisedRuntime({ ...opts, observerHarness: { source: WORKER_HARNESS_SOURCE, machineRoot: root, expectedRoot: `sha256:${createHash("sha256").update(buildLeanAuthenticatedHarnessSource(WORKER_HARNESS_SOURCE)).digest("hex")}` } })
    const e = host.invoke(request("selectActivations"), host.identity)
    if (fault) { expect(e.result).toMatchObject({ ok: false, systemFailure: {} }); expect(host.timing(e)).toBeUndefined() }
    else {
      const timing = host.timing(e)!
      expect(timing).toMatchObject({ provenance: "synthetic_transport", observation: { durationMs: 2, binding: { invocationRoot: e.invocationRoot } } })
      expect(host.verifyTiming(timing)).toBe(true)
      expect(host.verifyTiming(structuredClone(timing))).toBe(false)
      expect(e.result).not.toHaveProperty("timing")
    }
    closePlannerRuntime(host)
  })
})
