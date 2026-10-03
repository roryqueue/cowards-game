import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import ts from "typescript"
import { afterEach, describe, expect, it, vi } from "vitest"
const nativeStreamMock = vi.hoisted(() => ({ worker: undefined as any }))
vi.mock("node:worker_threads", async (original) => {
  const actual = await original<typeof import("node:worker_threads")>()
  return { ...actual, Worker: vi.fn(function (...args: any[]) { if (nativeStreamMock.worker) { Atomics.store(new Int32Array(args[1].workerData.start), 0, 1); return nativeStreamMock.worker }; throw Error("unexpected native Worker construction") }) }
})
afterEach(() => { nativeStreamMock.worker = undefined; vi.restoreAllMocks() })
import { buildLeanAuthenticatedHarnessSource, buildLeanObserverBrokerSource, createLeanContainerMatchSession, LEAN_CONTAINER_BROKER_SOURCE, validateLeanTimingObservation, type LeanContainerMatchTransport, type LeanContainerPersistentStream, type LeanContainerPersistentStreamFactory, type LeanContainerTransportResult, type LeanTimingBinding } from "./v1-38-lean-container-match-session.js"
import { LAB_ADMITTED_ROOTS } from "../../packages/strategy-lab/src/contracts.js"
import { WORKER_HARNESS_SOURCE, WORKER_HARNESS_V117_SOURCE } from "../../packages/runtime-js/src/worker-harness.js"
import { buildAdvancedStrategyRevision, findAdvancedStrategy } from "../../packages/persistence/src/advanced-strategies.js"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { defaultRuntimeMetadata, RUNTIME_INVOCATION_V1_17_TEST_KEY_ID, createSelectedRuntimeInvocationRequestV117, createRuntimeAbiV117ExecutionLedger, createRuntimeInvocationBudgetV117, serializeRuntimeInvocationRequestV117, verifyRuntimeInvocationResponseV117 } from "@cowards/spec"
import { encodeCandidateHostEnvelopeV117 } from "../../packages/runtime-js/src/candidate-host-envelope.js"
import { registerCandidateEvidenceFixture } from "../../packages/runtime-js/src/candidate-evidence-fixture.js"
const LEAN_CONTAINER_IMAGE = LAB_ADMITTED_ROOTS.image
import { issueProspectiveLeagueHostReceiptAuthority, claimProspectiveLeagueHostReceiptAuthority } from "./v1-38-league-host-receipt.js"
import { createLeagueProspectiveAmendmentV3, createProspectiveLeagueExecutionAllocationV3 } from "../../packages/strategy-lab/src/league/allocation.js"
import { prospectiveLifetimeFixture } from "../../packages/strategy-lab/src/league/allocation.test.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LeagueRecordGraph } from "../run-v1-38-serious-league.js"
import { createLeagueRepository } from "../../packages/strategy-lab/src/league/repository.js"
import { mkdtempSync, rmSync, realpathSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createHash } from "node:crypto"
import { createLeanContainerFixtureStreamFactory } from "./v1-38-lean-container-match-session.js"

const receiptDirectories: string[] = []
afterEach(() => { for (const directory of receiptDirectories.splice(0)) rmSync(directory, { recursive: true, force: true }) })
const receiptGrant = () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "league-receipt-mock-"))); receiptDirectories.push(directory)
  const input = prospectiveLifetimeFixture(), { root: _root, schemaVersion: _schema, ...body } = input.amendment
  const policy = { ...body.policy, operations: { ...body.policy.operations, hostResponseReceiptMilliseconds: 5000 as const } }
  const allocation = createProspectiveLeagueExecutionAllocationV3({ ...input, operations: policy.operations, amendment: createLeagueProspectiveAmendmentV3({ ...body, policy, hostReceiptApproval: "265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002" }), outputDirectories: { league: directory, responseFactory: "/fixture/factory-response" } })
  const value = { cellRoot: labRoot("receipt-cell", directory), allocationRoot: allocation.root }, start = { ...value, root: labRoot("league-cell-start-v1", value) }
  const runtime = { revisionId: "receipt-revision", sourceRoot: value.cellRoot, executableRoot: `sha256:${createHash("sha256").update("inert").digest("hex")}` as const, tupleId: "candidate-kernel-v1.19", tupleRoot: allocation.tupleRoot, runtimeLimitsRoot: allocation.runtimeRoot, image: allocation.operations.image, factoryAuthorizationRoot: value.cellRoot, factoryPacketRoot: value.cellRoot, factoryProposalRoot: value.cellRoot, factoryValidationRoot: value.cellRoot }
  const binding = { budgetRoot: allocation.root, attemptRoot: start.root, matchId: `league-${start.root.slice(7, 31)}`, seat: "bottom" as const, containerName: "receipt-mock", ownershipLabel: "owner:receipt-mock", runtime }
  const graph = new LeagueRecordGraph(createLeagueRepository(directory), allocation.operations)
  const charge = { kind: "cell-start" as const, root: graph.append("cell-start", { start }), value: start }
  return { allocation, binding, charge, graph, authority: issueProspectiveLeagueHostReceiptAuthority(allocation, charge, binding) }
}
describe("host response receipt native stream clock split", () => {
  it("requires the exact durable record and V3 allocation before issuing a provider", () => {
    const { allocation, binding, charge, graph } = receiptGrant()
    expect(() => issueProspectiveLeagueHostReceiptAuthority(allocation, { ...charge, root: labRoot("missing-retained", 1) }, { ...binding, seat: "top" })).toThrow()
    expect(() => issueProspectiveLeagueHostReceiptAuthority(allocation, { ...charge, value: { ...charge.value, cellRoot: labRoot("crossed-retained", 1) } }, { ...binding, seat: "top" })).toThrow()
    expect(() => issueProspectiveLeagueHostReceiptAuthority(allocation, charge, binding)).toThrow("PROVIDER_REUSED")
    const v2 = { ...allocation, schemaVersion: "league-prospective-execution-allocation-v2" }
    expect(() => issueProspectiveLeagueHostReceiptAuthority(v2 as never, charge, { ...binding, seat: "top" })).toThrow()
    const wrongKind = graph.append("runtime-cleanup", charge.value)
    expect(() => issueProspectiveLeagueHostReceiptAuthority(allocation, { ...charge, root: wrongKind }, { ...binding, seat: "top" })).toThrow("RETAINED_START")
  })
  it("rejects public/default scalar or unauthenticated handles before any control dispatch", () => {
    const transport = vi.fn(() => result()), streamFactory = vi.fn()
    for (const extra of [{ hostResponseReceiptMilliseconds: 5000 }, { prospectiveHostReceiptAuthority: {} }, { prospectiveHostReceiptBinding: {} }]) expect(() => createLeanContainerMatchSession({ matchId: "default", containerName: "default", ownershipLabel: "default", image: LEAN_CONTAINER_IMAGE, transport, streamFactory, ...extra } as never)).toThrow()
    expect(transport).not.toHaveBeenCalled(); expect(streamFactory).not.toHaveBeenCalled()
    const normal = create("receipt-unchanged-default", []); normal.session.close()
    expect(normal.persistent.calls[0]![1].at(-1)).toBe(LEAN_CONTAINER_BROKER_SOURCE)
  })
  it.each(["missing", "undefined", "null"])("host response receipt rejects %s fixture stream before claims or construction", (fault) => {
    const { authority, binding } = receiptGrant(), transport = vi.fn(() => { throw Error("control must not dispatch") })
    for (const layer of ["factory", "planner"] as const) claimProspectiveLeagueHostReceiptAuthority(authority, binding, layer)
    expect(() => createLeanContainerMatchSession({ ...binding, image: binding.runtime.image, infrastructureProfile: "closeout", transport, ...(fault === "undefined" ? { streamFactory: undefined } : fault === "null" ? { streamFactory: null as never } : {}), prospectiveHostReceiptAuthority: authority, prospectiveHostReceiptBinding: binding })).toThrow("FIXTURE_STREAM")
    expect(transport).not.toHaveBeenCalled()
    expect(claimProspectiveLeagueHostReceiptAuthority(authority, binding, "session")).toBe(5000)
  })
  it("rejects forged, copied, crossed and reused authority before transport", () => {
    const { authority, binding } = receiptGrant()
    expect(() => createLeanContainerMatchSession({ ...binding, image: binding.runtime.image, infrastructureProfile: "closeout", prospectiveHostReceiptAuthority: authority, prospectiveHostReceiptBinding: binding })).toThrow("FIXTURE_CONTROL")
    for (const fake of [5000, {}, { ...authority }]) expect(() => claimProspectiveLeagueHostReceiptAuthority(fake as never, binding, "factory")).toThrow()
    for (const key of ["budgetRoot", "attemptRoot", "matchId", "seat", "containerName", "ownershipLabel"] as const) expect(() => claimProspectiveLeagueHostReceiptAuthority(authority, { ...binding, [key]: "crossed" } as never, "factory")).toThrow()
    for (const key of Object.keys(binding.runtime)) expect(() => claimProspectiveLeagueHostReceiptAuthority(authority, { ...binding, runtime: { ...binding.runtime, [key]: "crossed" } }, "factory")).toThrow()
    expect(() => JSON.stringify(authority)).toThrow()
    expect(() => claimProspectiveLeagueHostReceiptAuthority(authority, binding, "session")).toThrow()
    for (const layer of ["factory", "planner", "session"] as const) { expect(claimProspectiveLeagueHostReceiptAuthority(authority, binding, layer)).toBe(5000); expect(() => claimProspectiveLeagueHostReceiptAuthority(authority, binding, layer)).toThrow() }
  })
  it.each(["missing", "malformed", "crossed"])("poisons a %s late receipt without guessing Strategy timeout and cleans up", (fault) => {
    const { authority, binding } = receiptGrant()
    for (const layer of ["factory", "planner"] as const) claimProspectiveLeagueHostReceiptAuthority(authority, binding, layer)
    const control = fakeTransport([absent(binding.containerName), result("id\n"), owned(binding.ownershipLabel), result(), result(), absent(binding.containerName)])
    const frames = fault === "missing" ? ["\n"] : fault === "malformed" ? ["{\n"] : [response(99, [])]
    const persistent = fakeStream(frames)
    const session = createLeanContainerMatchSession({ ...binding, image: binding.runtime.image, infrastructureProfile: "closeout", transport: control.transport, streamFactory: persistent.factory, prospectiveHostReceiptAuthority: authority, prospectiveHostReceiptBinding: binding })
    const invoke = () => session.adapter.execute({ source: "inert", methodName: "selectActivations", input: {}, timeoutMs: 1000 })
    let error: unknown; try { invoke() } catch (caught) { error = caught }
    expect(session.failureOrigin(error)?.stage).toBe("outer_frame")
    expect(session.state).toBe("poisoned"); expect(() => invoke()).toThrow()
    expect(persistent.frames).toHaveLength(1); expect(session.close().cleanupComplete).toBe(true); expect(persistent.closes).toBe(1)
    expect(control.calls.some((call) => call[1][0] === "rm")).toBe(true)
  })
  it.each([["{", "json_invalid"], ["null", "object_invalid"], ['{"ok":true,"value":{},"extra":1}', "keys_invalid"], ['{"ok":0,"violation":{}}', "schema_invalid"]])("host response receipt poisons invalid inner legacy %s with original origin and one cleanup", (inner, reason) => {
    const { authority, binding } = receiptGrant()
    for (const layer of ["factory", "planner"] as const) claimProspectiveLeagueHostReceiptAuthority(authority, binding, layer)
    const control = fakeTransport([absent(binding.containerName), result("id\n"), owned(binding.ownershipLabel), result(), result(), absent(binding.containerName)]), persistent = fakeStream([{ ...response(1, {}), stdoutBase64: Buffer.from(inner!).toString("base64") }])
    const session = createLeanContainerMatchSession({ ...binding, image: binding.runtime.image, infrastructureProfile: "closeout", transport: control.transport, streamFactory: persistent.factory, prospectiveHostReceiptAuthority: authority, prospectiveHostReceiptBinding: binding })
    const invoke = () => session.adapter.execute({ source: "inert", methodName: "selectActivations", input: {}, timeoutMs: 1000 })
    let error: unknown; try { invoke() } catch (caught) { error = caught }
    expect(error).toMatchObject({ code: "MALFORMED_IPC" })
    expect(session.failureOrigin(error)).toEqual({ stage: "inner_response", reason })
    expect(session.state).toBe("poisoned"); expect(() => invoke()).toThrow("SESSION_POISONED")
    expect(persistent.frames).toHaveLength(1); expect(persistent.closes).toBe(1)
    expect(session.close().cleanupComplete).toBe(true); expect(persistent.closes).toBe(1)
    expect(control.calls.filter((call) => call[1][0] === "rm")).toHaveLength(1)
  })
  it.each([["legacy", false, 1200], ["legacy", true, 5000], ["v117", false, 51], ["v117", true, 5000], ["v117", false, 1200]] as const)("keeps %s signed guest/broker budget with native receipt wait 5000; expiry=%s elapsed=%s", (mode, expire, elapsed) => {
    const { authority, binding } = receiptGrant()
    for (const layer of ["factory", "planner"] as const) claimProspectiveLeagueHostReceiptAuthority(authority, binding, layer)
    let exists = false, frame: any, dispatches = 0
    nativeStreamMock.worker = { postMessage(message: any) {
      if (message.type === "exchange") { dispatches++; frame = JSON.parse(Buffer.from(message.request).toString()); const envelope = encodeCandidateHostEnvelopeV117({ frame: Uint8Array.of(68), goNanoseconds: 1n, terminationMilliseconds: 1 }); const answer = mode === "legacy" ? response(frame.requestId, []) : { requestId: frame.requestId, status: 0, signal: null, stdoutBase64: envelope.toString("base64"), stderrBase64: "" }; const bytes = Buffer.from(JSON.stringify(answer) + "\n"); new Uint8Array(message.response).set(bytes); Atomics.store(new Int32Array(message.control), 1, bytes.length); Atomics.store(new Int32Array(message.control), 0, 1) }
      else Atomics.store(new Int32Array(message.control), 0, 1)
    }, terminate: vi.fn(async () => 0) }
    const waits: number[] = []; let receiptElapsed = 0
    vi.spyOn(Atomics, "wait").mockImplementation((_view, _index, _value, timeout) => { waits.push(timeout!); if (waits.length === 2) receiptElapsed = elapsed; return waits.length === 2 && expire ? "timed-out" : "ok" })
    const transport: LeanContainerMatchTransport = (_command, args) => { if (args[0] === "inspect") return exists ? owned(binding.ownershipLabel) : absent(binding.containerName); if (args[0] === "create") exists = true; if (args[0] === "rm") exists = false; return result("id\n") }
    const session = createLeanContainerMatchSession({ ...binding, image: binding.runtime.image, infrastructureProfile: "closeout", transport, streamFactory: createLeanContainerFixtureStreamFactory(nativeStreamMock.worker), prospectiveHostReceiptAuthority: authority, prospectiveHostReceiptBinding: binding })
    const signingIdentity = { keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID, secret: "fixture-only:runtime-js:v1.17:host-secret" }
    const request = createSelectedRuntimeInvocationRequestV117({ requestId: "request:receipt", invocationId: "invocation:receipt", kernelRequestId: "kernel:receipt", method: "selectActivations", semanticTuple: { rules: "cowards-rules-v1.4", engine: "engine-kernel-v1.37-candidate-1", runtimeAbi: "strategy-runtime-abi-v1.17", chronicle: "chronicle-recorder-current-events-v1.37-candidate-1", arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1", setPolicy: "canonical-set-policy-v1.4" }, sourceIdentity: { strategyRevisionId: binding.runtime.revisionId, originalSourceSha256: binding.runtime.executableRoot, normalizedSourceSha256: binding.runtime.executableRoot, artifactSha256: binding.runtime.executableRoot }, budget: createRuntimeInvocationBudgetV117("selectActivations"), accounting: { prestate: createRuntimeAbiV117ExecutionLedger() }, input: { value: {} }, retry: { retryId: "retry:receipt", attempt: 0, previousRequestSha256: null } }, signingIdentity)
    const invocation = { requestBytes: serializeRuntimeInvocationRequestV117(request), executableSource: "inert", signingIdentity }
    registerCandidateEvidenceFixture(invocation, (observation) => {
      const deltas = { wallMilliseconds: observation.methodDeadlineExceeded ? 51 : 1, computeFuel: 1, payloadBytes: observation.payloadBytes, stdoutBytes: observation.stdoutBytes, stderrBytes: observation.stderrBytes }
      return { attribution: expire ? "host" : "proven_strategy", counters: Object.fromEntries(Object.entries(deltas).map(([key, delta]) => [key, { status: "measured", delta, cumulative: delta }])) as import("@cowards/spec").RuntimeInvocationExecutionReceiptEvidenceV117["counters"], memory: { status: "measured", peakBytes: 1, cumulativePeakBytes: 1 }, process: { status: "verified", processes: 1, threads: 1, children: 0 }, capabilities: { status: "verified", filesystem: "none", network: "disabled", environment: "empty", shell: "disabled" }, cancellation: { status: "verified", ...observation.cancellation }, accountingEvidence: { status: "verified", signatureVerified: true, monotonic: true } }
    })
    let clockReads = 0; vi.spyOn(process.hrtime, "bigint").mockImplementation(() => ++clockReads === 1 ? 1n : BigInt(elapsed) * 1000000n + 1n)
    const invokeLegacy = () => session.adapter.execute({ source: "inert", methodName: "selectActivations", input: {}, timeoutMs: 1000 })
    if (mode === "v117") {
      const verified = verifyRuntimeInvocationResponseV117(session.adapter.executeV117(invocation), request, signingIdentity)
      expect(verified).toMatchObject({ kind: "success", value: { outcome: { kind: "system_failure", failure: { code: expire || elapsed > 150 ? "AMBIGUOUS_ATTRIBUTION" : "TIMEOUT" } } } })
      if (expire && verified.kind === "success") { expect(verified.value.outcome.trace.safeCodes).toContain("TRANSPORT_CRASH"); expect(verified.value.outcome.trace.safeCodes).not.toContain("WALL_DEADLINE_EXCEEDED") }
      const payload = JSON.parse(Buffer.from(frame.payloadBase64, "base64").toString())
      expect(payload.methodWallMilliseconds).toBe(50)
      expect(frame.timeoutMilliseconds).toBe(payload.startupTimeoutMilliseconds + 50 + payload.cancellationGraceMilliseconds)
      expect(payload.cancellationGraceMilliseconds).toBe(100)
    } else if (expire) { let error: unknown; try { invokeLegacy() } catch (caught) { error = caught }; expect(session.failureOrigin(error)).toEqual({ stage: "stream_exchange", reason: "wait_timeout" }); expect(session.state).toBe("poisoned"); expect(() => invokeLegacy()).toThrow() }
    else expect(invokeLegacy()).toEqual({ ok: true, value: [] })
    if (mode === "legacy") expect(frame.timeoutMilliseconds).toBe(1000)
    expect(frame.mode).toBe(mode); expect(waits[1]).toBe(5000); expect(receiptElapsed).toBe(elapsed); expect(dispatches).toBe(1)
    expect(session.close().cleanupComplete).toBe(true); expect(nativeStreamMock.worker.terminate).toHaveBeenCalledOnce()
  })
})

const result = (stdout: string | Uint8Array = "", override: Partial<LeanContainerTransportResult> = {}): LeanContainerTransportResult => ({ status: 0, signal: null, stdout: Buffer.from(stdout), stderr: Buffer.alloc(0), ...override })
const absent = (name: string) => result("", { status: 1, stderr: Buffer.from(`Error: No such object: ${name}\n`) })
const absentDocker29 = (name: string) => result("\n", { status: 1, stderr: Buffer.from(`error: no such object: ${name}\n`) })
const owned = (label: string) => result(`${label}\n`)
const fakeTransport = (responses: LeanContainerTransportResult[]) => {
  const calls: Parameters<LeanContainerMatchTransport>[] = []
  const transport: LeanContainerMatchTransport = (...input) => { calls.push(input); const next = responses.shift(); if (next === undefined) throw new Error("unexpected transport call"); return next }
  return { calls, transport }
}
const fakeStream = (responses: unknown[]) => {
  const frames: string[] = []; let closes = 0
  const stream: LeanContainerPersistentStream = {
    exchange(frame) { frames.push(frame); const next = responses.shift(); if (next instanceof Error) throw next; if (next === undefined) throw new Error("unexpected stream request"); return Buffer.from(typeof next === "string" ? next : `${JSON.stringify(next)}\n`) },
    close() { closes += 1; return result() },
  }
  const calls: Parameters<LeanContainerPersistentStreamFactory>[] = []
  const factory: LeanContainerPersistentStreamFactory = (...args) => { calls.push(args); return stream }
  return { calls, frames, factory, get closes() { return closes } }
}
const response = (requestId: number, methodValue: unknown) => ({ requestId, status: 0, signal: null, stdoutBase64: Buffer.from(JSON.stringify({ ok: true, value: methodValue })).toString("base64"), stderrBase64: "" })
const create = (name: string, streamResponses: unknown[]) => {
  const label = `v1.38-lean-owner:${name}`
  const control = fakeTransport([absent(name), result(`${name}-id\n`), owned(label), result(), result(), absent(name)])
  const persistent = fakeStream(streamResponses)
  const session = createLeanContainerMatchSession({ matchId: `match:${name}`, containerName: name, ownershipLabel: label, image: LEAN_CONTAINER_IMAGE, transport: control.transport, streamFactory: persistent.factory })
  return { control, persistent, session }
}
describe("private IPC diagnostics injected session", () => {
  const invoke = (session: ReturnType<typeof createLeanContainerMatchSession>) => session.adapter.execute({ source: "inert fixture", methodName: "selectActivations", input: {}, timeoutMs: 1000 })
  const capture = (session: ReturnType<typeof createLeanContainerMatchSession>) => { try { invoke(session) } catch (error) { return error }; throw Error("expected rejection") }
  it.each([
    ["no newline", "outer_frame", "single_frame_invalid"],
    ["{}\n{}\n", "outer_frame", "single_frame_invalid"],
    ["x".repeat(1048576) + "\n", "outer_frame", "frame_cap_exceeded"],
    ["{\n", "outer_frame", "json_invalid"],
    ["null\n", "outer_frame", "object_invalid"],
    [{ ...response(1, {}), requestId: 99 }, "outer_frame", "correlation_invalid"],
    [{ ...response(1, {}), stdoutBase64: Buffer.from("{").toString("base64") }, "inner_response", "json_invalid"],
    [{ ...response(1, {}), stdoutBase64: Buffer.from("null").toString("base64") }, "inner_response", "object_invalid"],
    [{ ...response(1, {}), stdoutBase64: Buffer.from('{"ok":true,"value":{},"source":"PRIVATE_CANARY"}').toString("base64") }, "inner_response", "keys_invalid"],
    [{ ...response(1, {}), stdoutBase64: Buffer.from('{"ok":0,"violation":{}}').toString("base64") }, "inner_response", "schema_invalid"],
  ])("records only host pair", (frame, stage, reason) => {
    const { session, persistent, control } = create("diag-session", [frame])
    const error = capture(session), origin = (session as any).failureOrigin?.(error)
    expect(origin).toEqual({ stage, reason }); expect(Object.isFrozen(origin)).toBe(true)
    expect(session.state).toBe(stage === "inner_response" ? "active" : "poisoned") // Historical no-grant behavior is unchanged.
    expect((session as any).failureOrigin?.({ ...(error as object) })).toBeUndefined()
    expect(session.close()).toEqual({ cleanupComplete: true, orphanedChild: false })
    expect(() => invoke(session)).toThrow(); expect(persistent.frames).toHaveLength(1)
    expect(control.calls.some((call) => call[1][0] === "rm")).toBe(true)
  })
  it.each(["timeout", "state"])("records actual native %s branch without a Worker or child", (fault) => {
    let exists = false, dispatches = 0
    nativeStreamMock.worker = { postMessage(message: any) { if (message.type === "exchange") { dispatches++; Atomics.store(new Int32Array(message.control), 0, fault === "state" ? -6 : 0) } else Atomics.store(new Int32Array(message.control), 0, 1) }, terminate: vi.fn(async () => 0) }
    let waits = 0
    vi.spyOn(Atomics, "wait").mockImplementation(() => ++waits === 2 && fault === "timeout" ? "timed-out" : "ok")
    const transport: LeanContainerMatchTransport = (_command, args) => {
      if (args[0] === "inspect") return exists ? owned("owner:diag-native") : absent("diag-native")
      if (args[0] === "create") { exists = true; return result("id\n") }
      if (args[0] === "rm") exists = false
      return result()
    }
    const session = createLeanContainerMatchSession({ matchId: "diag-native", containerName: "diag-native", ownershipLabel: "owner:diag-native", image: LEAN_CONTAINER_IMAGE, transport })
    const error = capture(session)
    expect((session as any).failureOrigin?.(error)).toEqual({ stage: "stream_exchange", reason: fault === "timeout" ? "wait_timeout" : "non_success_state" })
    expect(dispatches).toBe(1); expect(session.close().cleanupComplete).toBe(true)
    expect(nativeStreamMock.worker.terminate).toHaveBeenCalledOnce()
  })
  it("refuses ETIMEDOUT/name/code impersonation and does not decorate successful outputs", () => {
    const fake = Object.assign(Error("PRIVATE_CANARY"), { name: "SubprocessSystemFailure", code: "ETIMEDOUT", details: { stdout: "PRIVATE_CANARY" } })
    const failed = create("diag-forged", [fake]), error = capture(failed.session)
    expect((failed.session as any).failureOrigin?.(error)).toEqual({ stage: "stream_exchange", reason: "unknown" })
    const success = create("diag-success", [response(1, { value: 1 })])
    expect(invoke(success.session)).toEqual({ ok: true, value: { value: 1 } })
    expect((success.session as any).failureOrigin?.(error)).toBeUndefined(); success.session.close()
  })
})
const runBroker = (requests: readonly Record<string, unknown>[], brokerSource = LEAN_CONTAINER_BROKER_SOURCE, timeout = 5_000) => {
  const input = requests.map((request) => JSON.stringify(request)).join("\n") + "\n"
  const broker = spawnSync(process.execPath, ["--input-type=module", "--eval", brokerSource], { input, encoding: "utf8", timeout, maxBuffer: 1_048_576 })
  return { broker, frames: broker.stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as Record<string, unknown>) }
}
const brokerWithHarnesses = (legacy: string, v117 = WORKER_HARNESS_V117_SOURCE) => LEAN_CONTAINER_BROKER_SOURCE.replace(
  `const harnesses = ${JSON.stringify({ legacy: WORKER_HARNESS_SOURCE, v117: WORKER_HARNESS_V117_SOURCE })};`,
  `const harnesses = ${JSON.stringify({ legacy, v117 })};`,
)
const legacyBrokerRequest = (requestId: number, source: string, timeoutMilliseconds = 1_000) => ({
  requestId,
  mode: "legacy",
  payloadBase64: Buffer.from(JSON.stringify({ source, methodName: "selectActivations", input: {}, outputByteLimit: 1024 })).toString("base64"),
  timeoutMilliseconds,
  stdoutByteLimit: 1024,
  stderrByteLimit: 4096,
})
const v117BrokerRequest = (requestId: number, source: string, timeoutMilliseconds = 1_000) => ({
  requestId,
  mode: "v117",
  payloadBase64: Buffer.from(JSON.stringify({ source, methodName: "selectActivations", input: {}, outputByteLimit: 1024, methodWallMilliseconds: 500, startupTimeoutMilliseconds: 300, cancellationGraceMilliseconds: 200 })).toString("base64"),
  timeoutMilliseconds,
  stdoutByteLimit: 4096,
  stderrByteLimit: 4096,
})
const decodeLegacyBrokerFrame = (frame: Record<string, unknown>) => JSON.parse(Buffer.from(frame.stdoutBase64 as string, "base64").toString("utf8")) as unknown
const advancedSource = () => {
  // Same authored source and container compilation as the old broad CLI helper;
  // importing that CLI pulled unrelated feasibility/admission code into strict CI.
  const selected = findAdvancedStrategy("advanced:vanguard-pressure")
  if (!selected) throw Error("advanced fixture missing")
  const legacy = buildAdvancedStrategyRevision(selected), current = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: legacy.source, strategyId: legacy.strategyId, runtime: { ...current, adapter: { id: "runtime-js-container-subprocess", version: current.adapter.version }, limits: { ...current.limits, filesystem: "read-only-root", network: "disabled" } } })
  expect(revision.validation.valid).toBe(true)
  expect(revision.sourceHash).toBe(legacy.sourceHash)
  const artifact = revision.metadata.sourceArtifact
  if (artifact === undefined || artifact.bytesBase64 === undefined) throw new Error("advanced fixture artifact missing")
  return Buffer.from(artifact.bytesBase64, "base64").toString("utf8")
}

describe("private observer synthetic transport", () => {
  it("binds exactly the transformed worker bytes and parses the opt-in broker", () => {
    const parsed = ts.createSourceFile("broker.mjs", LEAN_CONTAINER_BROKER_SOURCE, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
    let replacement: string | undefined
    const visit = (node: ts.Node) => { if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === "replacement" && node.initializer && ts.isStringLiteral(node.initializer)) replacement = node.initializer.text; ts.forEachChild(node, visit) }
    visit(parsed)
    expect(replacement).toBeDefined()
    expect(buildLeanAuthenticatedHarnessSource(WORKER_HARNESS_SOURCE)).toBe(WORKER_HARNESS_SOURCE.replace('import { workerData } from "node:worker_threads"', replacement!))
    const observer = ts.createSourceFile("observer-broker.mjs", buildLeanObserverBrokerSource(WORKER_HARNESS_SOURCE), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
    expect((observer as any).parseDiagnostics).toHaveLength(0)
  })
  const binding: LeanTimingBinding = { invocationRoot: "call", sourceRoot: "source", executableRoot: "executable", inputRoot: "input", method: "selectActivations", tupleId: "tuple", harnessRoot: "harness", profileRoot: "profile" }
  it.each(["missing", "wrong", "duplicate", "stale", "negative", "infinite", "incomplete"])("rejects %s observation", (fault) => {
    const value: any = { binding: { ...binding }, durationMs: 1, complete: true }
    if (fault === "missing") delete value.binding
    if (fault === "wrong") value.binding.inputRoot = "forged"
    if (fault === "duplicate") value.extra = value
    if (fault === "stale") value.binding.invocationRoot = "old"
    if (fault === "negative") value.durationMs = -1
    if (fault === "infinite") value.durationMs = Infinity
    if (fault === "incomplete") value.complete = false
    expect(() => validateLeanTimingObservation(value, binding)).toThrow()
  })
  it("strips owned timing before ordinary result parsing and preserves default broker bytes", () => {
    const name = "phase263-observer"; const label = "owner:phase263-observer"
    const control = fakeTransport([absent(name), result("id\n"), owned(label), result(), result(), absent(name)])
    const persistent = fakeStream([{ ...response(1, { activationOrders: [], strategyMemory: null }), timing: { binding, durationMs: 2, complete: true } }])
    const observed: unknown[] = []
    const session = createLeanContainerMatchSession({ matchId: name, containerName: name, ownershipLabel: label, image: LEAN_CONTAINER_IMAGE, infrastructureProfile: "closeout", transport: control.transport, streamFactory: persistent.factory, privateObserver: { harnessSource: WORKER_HARNESS_SOURCE, binding: () => binding, observe: (v) => observed.push(v) } })
    expect(session.adapter.execute({ source: "synthetic", methodName: "selectActivations", input: {}, timeoutMs: 1000 })).toEqual({ ok: true, value: { activationOrders: [], strategyMemory: null } })
    expect(observed).toHaveLength(1)
    expect(JSON.parse(persistent.frames[0]!).timingBinding).toEqual(binding)
    session.close()
    const normal = create("phase263-disabled", [])
    expect(normal.persistent.calls[0]![1].at(-1)).toBe(LEAN_CONTAINER_BROKER_SOURCE)
    normal.session.close()
  })
})

describe("lean Match-scoped hostile container session", () => {
  it("selects the approved resources only for an explicit closeout session", () => {
    for (const profile of [undefined, "closeout"] as const) {
      const name = `lean-profile-${profile ?? "historical"}`
      const label = `owner:${name}`
      const control = fakeTransport([absent(name), result(`${name}-id\n`), owned(label), result(), result(), absent(name)])
      const persistent = fakeStream([])
      const session = createLeanContainerMatchSession({ matchId: `match:${name}`, containerName: name, ownershipLabel: label, image: LEAN_CONTAINER_IMAGE, transport: control.transport, streamFactory: persistent.factory, infrastructureProfile: profile })
      const args = control.calls.find((call) => call[1][0] === "create")![1]
      expect(args[args.indexOf("--cpus") + 1]).toBe(profile === "closeout" ? "2" : "0.5")
      expect(args[args.indexOf("--memory") + 1]).toBe(profile === "closeout" ? "256m" : "64m")
      expect(args).toContain("no-new-privileges")
      expect(args[args.indexOf("--network") + 1]).toBe("none")
      expect(session.close()).toEqual({ cleanupComplete: true, orphanedChild: false })
    }
  })

  it("uses one fresh bounded guest Worker per broker request without a child process", () => {
    const fixture = create("lean-worker-shape", [])
    const brokerSource = fixture.persistent.calls[0]![1].at(-1)!
    expect(brokerSource).toContain('from "node:worker_threads"')
    expect(brokerSource).toContain("new Worker(")
    expect(brokerSource).toContain("env: {}")
    expect(brokerSource).toContain("execArgv: []")
    expect(brokerSource).toContain("resourceLimits:")
    expect(brokerSource).toContain("worker.terminate()")
    expect(brokerSource).toContain("await terminate(worker")
    expect(brokerSource).toContain('kind:"completion"')
    expect(brokerSource).toContain('port.on("close"')
    expect(brokerSource).toContain('worker.on("exit"')
    expect(brokerSource).toContain("await reconcile(")
    expect(brokerSource).not.toContain("await terminate(worker,100);port1.close();\n  if(!received")
    expect(brokerSource).not.toContain("spawnSync")
    expect(brokerSource).not.toContain("node:child_process")
    fixture.session.close()
  })

  it("keeps broker requests serialized and correlates each terminal frame", () => {
    const fixture = create("lean-worker-order", [response(1, []), response(2, [])])
    const brokerSource = fixture.persistent.calls[0]![1].at(-1)!
    expect(brokerSource).toContain("queue=queue.then")
    expect(brokerSource).toContain("requestId:q.requestId")
    expect(brokerSource).toContain("expected++")
    fixture.session.adapter.execute({ source: "a", methodName: "selectActivations", input: {} })
    fixture.session.adapter.execute({ source: "b", methodName: "selectActivations", input: {} })
    expect(fixture.persistent.frames.map((frame) => JSON.parse(frame).requestId)).toEqual([1, 2])
    fixture.session.close()
  })

  it("executes repeated and alternating Strategy sources in fresh stateless Workers", () => {
    const counter = 'let count=0; module.exports.default={selectActivations(){count+=1;return [count]}}'
    const other = 'globalThis.leak=99; module.exports.default={selectActivations(){return [7]}}'
    const { broker, frames } = runBroker([legacyBrokerRequest(1, counter), legacyBrokerRequest(2, other), legacyBrokerRequest(3, counter)])
    expect({ status: broker.status, stderr: broker.stderr }).toEqual({ status: 0, stderr: "" })
    expect(frames.map((frame) => frame.requestId)).toEqual([1, 2, 3])
    expect(frames.map(decodeLegacyBrokerFrame)).toEqual([{ ok: true, value: [1] }, { ok: false, violation: { type: "FORBIDDEN_CAPABILITY", message: "FORBIDDEN_CAPABILITY: leak" } }, { ok: true, value: [1] }])
  })

  it("preserves forbidden-capability failures and kills timed-out Workers", () => {
    const forbidden = 'module.exports.default={selectActivations(){return process.cwd()}}'
    const hung = 'module.exports.default={selectActivations(){while(true){} }}'
    const forbiddenRun = runBroker([legacyBrokerRequest(1, forbidden)])
    expect(decodeLegacyBrokerFrame(forbiddenRun.frames[0]!)).toEqual({ ok: false, violation: { type: "FORBIDDEN_CAPABILITY", message: "FORBIDDEN_CAPABILITY: process" } })
    const timeoutRun = runBroker([legacyBrokerRequest(1, hung, 25)])
    expect(timeoutRun.broker.status).toBe(0)
    expect(timeoutRun.frames[0]).toMatchObject({ requestId: 1, status: null, signal: "SIGKILL", stdoutBase64: "", stderrBase64: "" })
  })

  it("waits beyond the obsolete 100 ms success race for port close and natural exit", () => {
    const delayed = WORKER_HARNESS_SOURCE.replace("port.close()", "setTimeout(() => port.close(), 175)")
    const started = performance.now()
    const { broker, frames } = runBroker([legacyBrokerRequest(1, 'module.exports.default={selectActivations(){return [1]}}')], brokerWithHarnesses(delayed))
    expect({ status: broker.status, stderr: broker.stderr }).toEqual({ status: 0, stderr: "" })
    expect(performance.now() - started).toBeGreaterThanOrEqual(150)
    expect(frames).toHaveLength(1)
    expect(decodeLegacyBrokerFrame(frames[0]!)).toEqual({ ok: true, value: [1] })
  })

  it("requires the same completion and natural-exit handshake for v1.17", () => {
    const delayed = WORKER_HARNESS_V117_SOURCE.replace("workerData.port.close()", "setTimeout(() => workerData.port.close(), 175)")
    const started = performance.now()
    const { broker, frames } = runBroker([v117BrokerRequest(1, 'module.exports.default={selectActivations(){return [1]}}')], brokerWithHarnesses(WORKER_HARNESS_SOURCE, delayed))
    expect({ status: broker.status, stderr: broker.stderr }).toEqual({ status: 0, stderr: "" })
    expect(performance.now() - started).toBeGreaterThanOrEqual(150)
    expect(frames).toHaveLength(1)
    const envelope = Buffer.from(frames[0]!.stdoutBase64 as string, "base64")
    expect(envelope.subarray(0, 4).toString("ascii")).toBe("CG17")
    expect(envelope.subarray(24, 25).toString("ascii")).toBe("S")
  })

  it("accepts natural exit before receipt observation while retaining the exact three-event invariant", () => {
    expect(LEAN_CONTAINER_BROKER_SOURCE).not.toContain("exitBeforeReceipt")
    expect(LEAN_CONTAINER_BROKER_SOURCE).toContain("receiptCount!==1||closeCount!==1||exitCount!==1||exitCode!==0")
    expect(LEAN_CONTAINER_BROKER_SOURCE).toContain("const budget=remaining(deadline)")
    expect(LEAN_CONTAINER_BROKER_SOURCE).not.toContain('kind:"ack"')
    expect(LEAN_CONTAINER_BROKER_SOURCE).not.toContain('kind:"acknowledgement"')
  })

  it("accepts at least 50 consecutive Advanced rapid exits in both protocol harnesses", () => {
    const source = advancedSource()
    const legacy = runBroker(Array.from({ length: 50 }, (_, index) => legacyBrokerRequest(index + 1, source)), LEAN_CONTAINER_BROKER_SOURCE, 30_000)
    expect({ status: legacy.broker.status, stderr: legacy.broker.stderr, frames: legacy.frames.length }).toEqual({ status: 0, stderr: "", frames: 50 })
    const v117 = runBroker(Array.from({ length: 50 }, (_, index) => v117BrokerRequest(index + 1, source)), LEAN_CONTAINER_BROKER_SOURCE, 30_000)
    expect({ status: v117.broker.status, stderr: v117.broker.stderr, frames: v117.frames.length }).toEqual({ status: 0, stderr: "", frames: 50 })
  })

  it.each([
    ["missing close", WORKER_HARNESS_SOURCE.replace("port.close()", "setInterval(() => {}, 1_000)")],
    ["nonzero exit", WORKER_HARNESS_SOURCE.replace("port.close()", "process.exitCode = 9; port.close()")],
    ["duplicate result", WORKER_HARNESS_SOURCE.replace("port.postMessage(capRuntimeResult(await runStrategy(workerData.source)))", "port.postMessage(capRuntimeResult(await runStrategy(workerData.source))); port.postMessage({ ok: true, value: [] })")],
  ])("fails closed without a response on %s", (_label, harness) => {
    const { broker, frames } = runBroker([legacyBrokerRequest(1, 'module.exports.default={selectActivations(){return [1]}}', 300)], brokerWithHarnesses(harness))
    expect(broker.status).toBe(73)
    expect(frames).toEqual([])
  })

  it("rejects a completion receipt whose request identity does not match", () => {
    const brokerSource = brokerWithHarnesses(WORKER_HARNESS_SOURCE).replace("requestId:rawWorkerData.requestId,kind:\"completion\"", "requestId:rawWorkerData.requestId+1,kind:\"completion\"")
    const { broker, frames } = runBroker([legacyBrokerRequest(1, 'module.exports.default={selectActivations(){return [1]}}')], brokerSource)
    expect(broker.status).toBe(73)
    expect(frames).toEqual([])
  })

  it("multiplexes mixed methods through exactly one persistent Docker stream", () => {
    const fixture = create("lean-a", [response(1, ["soldier:1"]), response(2, { action: "WAIT" })])
    expect(fixture.session.adapter.execute({ source: "source-a", methodName: "selectActivations", input: {}, outputByteLimit: 1024 })).toEqual({ ok: true, value: ["soldier:1"] })
    expect(fixture.session.adapter.execute({ source: "source-b", methodName: "soldierBrain", input: {}, outputByteLimit: 1024 })).toEqual({ ok: true, value: { action: "WAIT" } })
    expect(fixture.persistent.calls).toHaveLength(1)
    expect(fixture.persistent.calls[0]![1].slice(0, 3)).toEqual(["exec", "-i", "lean-a"])
    expect(fixture.control.calls.map(([, args]) => args[0])).toEqual(["inspect", "create", "inspect", "start"])
    expect(fixture.persistent.frames.map((frame) => JSON.parse(frame).requestId)).toEqual([1, 2])
    expect(fixture.session.close()).toEqual({ cleanupComplete: true, orphanedChild: false })
    expect(fixture.session.close()).toEqual({ cleanupComplete: true, orphanedChild: false })
    expect(fixture.persistent.closes).toBe(1)
    expect(fixture.control.calls.map(([, args]) => args[0])).toEqual(["inspect", "create", "inspect", "start", "rm", "inspect"])
  })

  it.each([
    ["stale", response(0, [])], ["future", response(2, [])], ["surplus", { ...response(1, []), extra: true }],
    ["missing", { status: 0, signal: null, stdoutBase64: "", stderrBase64: "" }], ["bad-base64", { ...response(1, []), stdoutBase64: "!!!!" }],
    ["stderr", { ...response(1, []), stderrBase64: Buffer.from("private").toString("base64") }], ["malformed", "not-json\n"],
    ["multiple", `${JSON.stringify(response(1, []))}\n${JSON.stringify(response(2, []))}\n`],
  ])("poisons on %s persistent response frames", (_label, corrupt) => {
    const fixture = create("lean-b", [corrupt])
    expect(() => fixture.session.adapter.execute({ source: "x", methodName: "selectActivations", input: {}, outputByteLimit: 64 })).toThrow()
    expect(fixture.session.state).toBe("poisoned")
    expect(fixture.persistent.closes).toBe(1)
    expect(fixture.control.calls.at(-2)?.[1]).toEqual(["rm", "--force", "lean-b"])
    expect(() => fixture.session.adapter.execute({ source: "x", methodName: "selectActivations", input: {} })).toThrow(/SESSION_POISONED/u)
  })

  it("poisons on stream timeout and never falls back to a control Docker exec", () => {
    const fixture = create("lean-c", [Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })])
    expect(() => fixture.session.adapter.execute({ source: "x", methodName: "soldierBrain", input: {} })).toThrow()
    expect(fixture.control.calls.every(([, args]) => args[0] !== "exec")).toBe(true)
    expect(fixture.persistent.calls).toHaveLength(1)
    expect(fixture.session.state).toBe("poisoned")
  })

  it.each([
    ["daemon", result("", { status: 1, stderr: Buffer.from("Cannot connect to the Docker daemon\n") })], ["permission", result("", { status: 1, stderr: Buffer.from("permission denied\n") })],
    ["empty", result("", { status: 1 })], ["wrong target", absent("some-other-name")], ["extra line", result("", { status: 1, stderr: Buffer.from("Error: No such object: lean-d\nextra\n") })],
    ["stdout", result("unexpected", { status: 1, stderr: Buffer.from("Error: No such object: lean-d\n") })], ["signal", result("", { status: 1, signal: "SIGKILL", stderr: Buffer.from("Error: No such object: lean-d\n") })],
  ])("treats status-1 %s inspect as unknown before create", (_label, inspect) => {
    const control = fakeTransport([inspect]); const persistent = fakeStream([])
    expect(() => createLeanContainerMatchSession({ matchId: "match:d", containerName: "lean-d", ownershipLabel: "owner:d", image: LEAN_CONTAINER_IMAGE, transport: control.transport, streamFactory: persistent.factory })).toThrow(/NAME_CHECK_FAILED/u)
    expect(control.calls).toHaveLength(1); expect(persistent.calls).toHaveLength(0)
  })

  it("requires exact absence after removal and reports ambiguous cleanup", () => {
    const label = "owner:e"; const control = fakeTransport([absent("lean-e"), result("id\n"), owned(label), result(), result(), result("", { status: 1 })]); const persistent = fakeStream([])
    const session = createLeanContainerMatchSession({ matchId: "match:e", containerName: "lean-e", ownershipLabel: label, image: LEAN_CONTAINER_IMAGE, transport: control.transport, streamFactory: persistent.factory })
    expect(session.close()).toEqual({ cleanupComplete: false, orphanedChild: true })
  })

  it.each([
    ["historical", absent],
    ["Docker 29.4", absentDocker29],
  ])("accepts the exact %s absence tuple before create and after removal", (_label, exactAbsence) => {
    const name = `lean-exact-${String(_label).replace(/[^a-z0-9]/giu, "-").toLowerCase()}`
    const ownershipLabel = `owner:${name}`
    const control = fakeTransport([exactAbsence(name), result(`${name}-id\n`), owned(ownershipLabel), result(), result(), exactAbsence(name)])
    const persistent = fakeStream([])
    const session = createLeanContainerMatchSession({ matchId: `match:${name}`, containerName: name, ownershipLabel, image: LEAN_CONTAINER_IMAGE, transport: control.transport, streamFactory: persistent.factory })
    expect(session.close()).toEqual({ cleanupComplete: true, orphanedChild: false })
    expect(control.calls.map(([, args]) => args[0])).toEqual(["inspect", "create", "inspect", "start", "rm", "inspect"])
  })

  it.each([
    ["wrong status", result("\n", { status: 2, stderr: Buffer.from("error: no such object: lean-d\n") })],
    ["non-null signal", result("\n", { status: 1, signal: "SIGKILL", stderr: Buffer.from("error: no such object: lean-d\n") })],
    ["transport error", result("\n", { status: 1, stderr: Buffer.from("error: no such object: lean-d\n"), error: new Error("transport") })],
    ["zero stdout", result("", { status: 1, stderr: Buffer.from("error: no such object: lean-d\n") })],
    ["extra stdout", result("\n\n", { status: 1, stderr: Buffer.from("error: no such object: lean-d\n") })],
    ["wrong stderr case", result("\n", { status: 1, stderr: Buffer.from("Error: no such object: lean-d\n") })],
    ["wrong target", result("\n", { status: 1, stderr: Buffer.from("error: no such object: lean-other\n") })],
    ["wrong prefix", result("\n", { status: 1, stderr: Buffer.from("docker: error: no such object: lean-d\n") })],
    ["wrong suffix", result("\n", { status: 1, stderr: Buffer.from("error: no such object: lean-d!\n") })],
    ["missing stderr newline", result("\n", { status: 1, stderr: Buffer.from("error: no such object: lean-d") })],
    ["extra stderr newline", result("\n", { status: 1, stderr: Buffer.from("error: no such object: lean-d\n\n") })],
    ["extra stderr bytes", result("\n", { status: 1, stderr: Buffer.from("error: no such object: lean-d\nextra") })],
  ])("rejects Docker 29.4 %s near misses before create", (_label, inspect) => {
    const control = fakeTransport([inspect]); const persistent = fakeStream([])
    expect(() => createLeanContainerMatchSession({ matchId: "match:d", containerName: "lean-d", ownershipLabel: "owner:d", image: LEAN_CONTAINER_IMAGE, transport: control.transport, streamFactory: persistent.factory })).toThrow(/NAME_CHECK_FAILED/u)
    expect(control.calls).toHaveLength(1); expect(persistent.calls).toHaveLength(0)
  })

  it.each([
    ["wrong status", result("\n", { status: 2, stderr: Buffer.from("error: no such object: lean-cleanup\n") })],
    ["other stdout", result("x", { status: 1, stderr: Buffer.from("error: no such object: lean-cleanup\n") })],
    ["wrong case", result("\n", { status: 1, stderr: Buffer.from("Error: no such object: lean-cleanup\n") })],
    ["wrong target", result("\n", { status: 1, stderr: Buffer.from("error: no such object: other\n") })],
    ["missing newline", result("\n", { status: 1, stderr: Buffer.from("error: no such object: lean-cleanup") })],
  ])("rejects Docker 29.4 %s near misses after removal", (_label, finalInspect) => {
    const name = "lean-cleanup"; const label = "owner:cleanup"
    const control = fakeTransport([absentDocker29(name), result("id\n"), owned(label), result(), result(), finalInspect]); const persistent = fakeStream([])
    const session = createLeanContainerMatchSession({ matchId: "match:cleanup", containerName: name, ownershipLabel: label, image: LEAN_CONTAINER_IMAGE, transport: control.transport, streamFactory: persistent.factory })
    expect(session.close()).toEqual({ cleanupComplete: false, orphanedChild: true })
  })

  it("keeps separate streams and request counters across Matches", () => {
    const first = create("lean-one", [response(1, [])]); const second = create("lean-two", [response(1, [])])
    first.session.adapter.execute({ source: "x", methodName: "selectActivations", input: {} }); second.session.adapter.execute({ source: "x", methodName: "selectActivations", input: {} })
    expect(JSON.parse(first.persistent.frames[0]!).requestId).toBe(1); expect(JSON.parse(second.persistent.frames[0]!).requestId).toBe(1)
    first.session.close(); second.session.close()
  })
})
