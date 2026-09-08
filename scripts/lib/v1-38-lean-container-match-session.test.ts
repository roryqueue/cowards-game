import { Buffer } from "node:buffer"
import { describe, expect, it } from "vitest"
import { createLeanContainerMatchSession, type LeanContainerMatchTransport, type LeanContainerPersistentStream, type LeanContainerPersistentStreamFactory, type LeanContainerTransportResult } from "./v1-38-lean-container-match-session.js"
import { LEAN_CONTAINER_IMAGE } from "../run-v1-38-lean-runner-feasibility.js"

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

describe("lean Match-scoped hostile container session", () => {
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
