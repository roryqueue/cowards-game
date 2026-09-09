import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { describe, expect, it } from "vitest"
import { createLeanContainerMatchSession, LEAN_CONTAINER_BROKER_SOURCE, type LeanContainerMatchTransport, type LeanContainerPersistentStream, type LeanContainerPersistentStreamFactory, type LeanContainerTransportResult } from "./v1-38-lean-container-match-session.js"
import { LEAN_CONTAINER_IMAGE } from "../run-v1-38-lean-runner-feasibility.js"
import { WORKER_HARNESS_SOURCE, WORKER_HARNESS_V117_SOURCE } from "../../packages/runtime-js/src/worker-harness.js"
import { createContainerFixtureRevision } from "../run-v1-38-lean-runner-feasibility.js"

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
  const artifact = createContainerFixtureRevision("advanced:vanguard-pressure").metadata.sourceArtifact
  if (artifact === undefined) throw new Error("advanced fixture artifact missing")
  return Buffer.from(artifact.bytesBase64, "base64").toString("utf8")
}

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
