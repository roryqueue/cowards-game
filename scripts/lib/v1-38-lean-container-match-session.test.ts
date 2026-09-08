import { Buffer } from "node:buffer"
import { describe, expect, it } from "vitest"
import {
  createLeanContainerMatchSession,
  type LeanContainerMatchTransport,
  type LeanContainerTransportResult,
} from "./v1-38-lean-container-match-session.js"
import { LEAN_CONTAINER_IMAGE } from "../run-v1-38-lean-runner-feasibility.js"

const result = (
  stdout: string | Uint8Array = "",
  override: Partial<LeanContainerTransportResult> = {},
): LeanContainerTransportResult => ({
  status: 0,
  signal: null,
  stdout: typeof stdout === "string" ? Buffer.from(stdout) : Buffer.from(stdout),
  stderr: Buffer.alloc(0),
  ...override,
})

const fakeTransport = (responses: LeanContainerTransportResult[]) => {
  const calls: Parameters<LeanContainerMatchTransport>[] = []
  const transport: LeanContainerMatchTransport = (...input) => {
    calls.push(input)
    const next = responses.shift()
    if (next === undefined) throw new Error("unexpected transport call")
    return next
  }
  return { calls, transport }
}

describe("lean Match-scoped hostile container session", () => {
  const owned = (name: string) => result(`v1.38-lean-owner:${name}\n`)
  const absent = () => result("", { status: 1 })

  it("creates, starts, serves, and destroys exactly one controlled container for one Match", () => {
    const fake = fakeTransport([
      absent(), result("container-a\n"), owned("lean-a"), result(),
      result(JSON.stringify({ ok: true, value: ["soldier:1"] })), result(), absent(),
    ])
    const session = createLeanContainerMatchSession({
      matchId: "match:lean:a", containerName: "lean-a", image: LEAN_CONTAINER_IMAGE, transport: fake.transport,
    })

    expect(session.adapter.execute({
      source: "export const selectActivations = () => []",
      methodName: "selectActivations", input: {}, timeoutMs: 25, outputByteLimit: 1024,
    })).toEqual({ ok: true, value: ["soldier:1"] })
    expect(session.close()).toEqual({ cleanupComplete: true, orphanedChild: false })
    expect(session.close()).toEqual({ cleanupComplete: true, orphanedChild: false })

    expect(fake.calls.map(([, args]) => args[0])).toEqual(["inspect", "create", "inspect", "start", "exec", "rm", "inspect"])
    const createArgs = fake.calls[1]![1]
    expect(createArgs).toEqual(expect.arrayContaining([
      "--network", "none", "--read-only", "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
      "--memory", "64m", "--cpus", "0.5", "--pids-limit", "64", "--cap-drop", "ALL",
      "--security-opt", "no-new-privileges", "--env", "NODE_ENV=production", LEAN_CONTAINER_IMAGE,
    ]))
    expect(createArgs).toEqual(expect.arrayContaining(["--name", "lean-a", "--label", "v1.38-lean-owner=v1.38-lean-owner:lean-a"]))
    expect(createArgs).not.toContain("-v")
    expect(createArgs).not.toContain("--mount")
    expect(fake.calls[4]![1].slice(0, 3)).toEqual(["exec", "-i", "lean-a"])
    expect(fake.calls[5]![1]).toEqual(["rm", "--force", "lean-a"])
    expect(session.adapter.metadata).toMatchObject({ id: "container-subprocess", diagnostics: { fallback: false, dockerRequired: true } })
  })

  it("poisons and force-removes the session on malformed, surplus, or hostile output", () => {
    for (const stdout of ["not-json", '{"ok":true,"value":[],"extra":true}', '{"ok":true,"value":[]}\n{}']) {
      const fake = fakeTransport([absent(), result("container-b\n"), owned("lean-b"), result(), result(stdout), result(), absent()])
      const session = createLeanContainerMatchSession({ matchId: "match:lean:b", containerName: "lean-b", image: LEAN_CONTAINER_IMAGE, transport: fake.transport })
      expect(() => session.adapter.execute({ source: "x", methodName: "selectActivations", input: {} })).toThrow()
      expect(session.state).toBe("poisoned")
      expect(fake.calls.at(-2)?.[1]).toEqual(["rm", "--force", "lean-b"])
      expect(() => session.adapter.execute({ source: "x", methodName: "selectActivations", input: {} })).toThrow(/SESSION_POISONED/u)
    }
  })

  it("poisons on timeout, signal, nonzero exit, stderr, or byte overflow", () => {
    const failures: LeanContainerTransportResult[] = [
      result("", { error: Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }) }),
      result("", { signal: "SIGKILL" }), result("", { status: 7 }),
      result("{}", { stderr: Buffer.from("private") }), result("x".repeat(33)),
    ]
    for (const failure of failures) {
      const fake = fakeTransport([absent(), result("container-c\n"), owned("lean-c"), result(), failure, result(), absent()])
      const session = createLeanContainerMatchSession({ matchId: "match:lean:c", containerName: "lean-c", image: LEAN_CONTAINER_IMAGE, transport: fake.transport })
      expect(() => session.adapter.execute({ source: "x", methodName: "soldierBrain", input: {}, outputByteLimit: 32 })).toThrow()
      expect(session.state).toBe("poisoned")
      expect(fake.calls.at(-1)?.[1][0]).toBe("rm")
    }
  })

  it("reports cleanup ambiguity, never reopens, and isolates Match identities", () => {
    const first = fakeTransport([absent(), result("container-one\n"), owned("lean-one"), result(), result("", { status: 1 }), result("occupied")])
    const firstSession = createLeanContainerMatchSession({ matchId: "match:lean:one", containerName: "lean-one", image: LEAN_CONTAINER_IMAGE, transport: first.transport })
    expect(firstSession.close()).toEqual({ cleanupComplete: false, orphanedChild: true })
    expect(() => firstSession.adapter.execute({ source: "x", methodName: "selectActivations", input: {} })).toThrow(/SESSION_CLOSED/u)

    const second = fakeTransport([absent(), result("container-two\n"), owned("lean-two"), result(), result(), absent()])
    const secondSession = createLeanContainerMatchSession({ matchId: "match:lean:two", containerName: "lean-two", image: LEAN_CONTAINER_IMAGE, transport: second.transport })
    expect(secondSession.containerId).toBe("lean-two")
    expect(secondSession.containerId).not.toBe(firstSession.containerId)
    expect(secondSession.close()).toEqual({ cleanupComplete: true, orphanedChild: false })
  })

  it("fails creation closed and cleans up when start is ambiguous", () => {
    const fake = fakeTransport([absent(), result("container-d\n"), owned("lean-d"), result("", { status: 1 }), result(), absent()])
    expect(() => createLeanContainerMatchSession({ matchId: "match:lean:d", containerName: "lean-d", image: LEAN_CONTAINER_IMAGE, transport: fake.transport })).toThrow(/SESSION_START_FAILED/u)
    expect(fake.calls.map(([, args]) => args[0])).toEqual(["inspect", "create", "inspect", "start", "rm", "inspect"])
  })

  it.each([
    ["timeout", result("", { error: Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }) })],
    ["output loss", result("")],
    ["malformed id", result("not an id with spaces")],
    ["stderr", result("container-e", { stderr: Buffer.from("ambiguous") })],
  ])("removes the caller-owned name after ambiguous create %s", (_label, createResult) => {
    const fake = fakeTransport([absent(), createResult, owned("lean-e"), result(), absent()])
    expect(() => createLeanContainerMatchSession({ matchId: "match:lean:e", containerName: "lean-e", image: LEAN_CONTAINER_IMAGE, transport: fake.transport })).toThrow(/SESSION_CREATE_FAILED/u)
    expect(fake.calls.at(-2)?.[1]).toEqual(["rm", "--force", "lean-e"])
    expect(fake.calls.at(-1)?.[1][0]).toBe("inspect")
  })

  it("refuses pre-existing and raced name collisions without reusing or deleting the occupant", () => {
    const occupied = fakeTransport([result("other-owner")])
    expect(() => createLeanContainerMatchSession({ matchId: "match:lean:f", containerName: "lean-f", image: LEAN_CONTAINER_IMAGE, transport: occupied.transport })).toThrow(/NAME_COLLISION/u)
    expect(occupied.calls).toHaveLength(1)

    const raced = fakeTransport([absent(), result("", { status: 125 }), result("other-owner")])
    expect(() => createLeanContainerMatchSession({ matchId: "match:lean:g", containerName: "lean-g", image: LEAN_CONTAINER_IMAGE, transport: raced.transport })).toThrow(/CLEANUP_INCOMPLETE/u)
    expect(raced.calls.some(([, args]) => args[0] === "rm")).toBe(false)
  })

  it("fails closed when removal or absence confirmation is ambiguous", () => {
    const cleanupFailed = fakeTransport([absent(), result("", { error: new Error("lost") }), owned("lean-h"), result("", { status: 1 }), result("still-present")])
    expect(() => createLeanContainerMatchSession({ matchId: "match:lean:h", containerName: "lean-h", image: LEAN_CONTAINER_IMAGE, transport: cleanupFailed.transport })).toThrow(/CLEANUP_INCOMPLETE/u)

    const unknownAbsence = fakeTransport([result("", { status: null, error: new Error("inspect timeout") })])
    expect(() => createLeanContainerMatchSession({ matchId: "match:lean:i", containerName: "lean-i", image: LEAN_CONTAINER_IMAGE, transport: unknownAbsence.transport })).toThrow(/NAME_CHECK_FAILED/u)
  })
})
