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
  it("creates, starts, serves, and destroys exactly one controlled container for one Match", () => {
    const fake = fakeTransport([
      result("container-a\n"), result(),
      result(JSON.stringify({ ok: true, value: ["soldier:1"] })), result(),
    ])
    const session = createLeanContainerMatchSession({
      matchId: "match:lean:a", image: LEAN_CONTAINER_IMAGE, transport: fake.transport,
    })

    expect(session.adapter.execute({
      source: "export const selectActivations = () => []",
      methodName: "selectActivations", input: {}, timeoutMs: 25, outputByteLimit: 1024,
    })).toEqual({ ok: true, value: ["soldier:1"] })
    expect(session.close()).toEqual({ cleanupComplete: true, orphanedChild: false })
    expect(session.close()).toEqual({ cleanupComplete: true, orphanedChild: false })

    expect(fake.calls.map(([, args]) => args[0])).toEqual(["create", "start", "exec", "rm"])
    const createArgs = fake.calls[0]![1]
    expect(createArgs).toEqual(expect.arrayContaining([
      "--network", "none", "--read-only", "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
      "--memory", "64m", "--cpus", "0.5", "--pids-limit", "64", "--cap-drop", "ALL",
      "--security-opt", "no-new-privileges", "--env", "NODE_ENV=production", LEAN_CONTAINER_IMAGE,
    ]))
    expect(createArgs).not.toContain("-v")
    expect(createArgs).not.toContain("--mount")
    expect(fake.calls[2]![1].slice(0, 3)).toEqual(["exec", "-i", "container-a"])
    expect(fake.calls[3]![1]).toEqual(["rm", "--force", "container-a"])
    expect(session.adapter.metadata).toMatchObject({ id: "container-subprocess", diagnostics: { fallback: false, dockerRequired: true } })
  })

  it("poisons and force-removes the session on malformed, surplus, or hostile output", () => {
    for (const stdout of ["not-json", '{"ok":true,"value":[],"extra":true}', '{"ok":true,"value":[]}\n{}']) {
      const fake = fakeTransport([result("container-b\n"), result(), result(stdout), result()])
      const session = createLeanContainerMatchSession({ matchId: "match:lean:b", image: LEAN_CONTAINER_IMAGE, transport: fake.transport })
      expect(() => session.adapter.execute({ source: "x", methodName: "selectActivations", input: {} })).toThrow()
      expect(session.state).toBe("poisoned")
      expect(fake.calls.at(-1)?.[1]).toEqual(["rm", "--force", "container-b"])
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
      const fake = fakeTransport([result("container-c\n"), result(), failure, result()])
      const session = createLeanContainerMatchSession({ matchId: "match:lean:c", image: LEAN_CONTAINER_IMAGE, transport: fake.transport })
      expect(() => session.adapter.execute({ source: "x", methodName: "soldierBrain", input: {}, outputByteLimit: 32 })).toThrow()
      expect(session.state).toBe("poisoned")
      expect(fake.calls.at(-1)?.[1][0]).toBe("rm")
    }
  })

  it("reports cleanup ambiguity, never reopens, and isolates Match identities", () => {
    const first = fakeTransport([result("container-one\n"), result(), result("", { status: 1 })])
    const firstSession = createLeanContainerMatchSession({ matchId: "match:lean:one", image: LEAN_CONTAINER_IMAGE, transport: first.transport })
    expect(firstSession.close()).toEqual({ cleanupComplete: false, orphanedChild: true })
    expect(() => firstSession.adapter.execute({ source: "x", methodName: "selectActivations", input: {} })).toThrow(/SESSION_CLOSED/u)

    const second = fakeTransport([result("container-two\n"), result(), result()])
    const secondSession = createLeanContainerMatchSession({ matchId: "match:lean:two", image: LEAN_CONTAINER_IMAGE, transport: second.transport })
    expect(secondSession.containerId).toBe("container-two")
    expect(secondSession.containerId).not.toBe(firstSession.containerId)
    expect(secondSession.close()).toEqual({ cleanupComplete: true, orphanedChild: false })
  })

  it("fails creation closed and cleans up when start is ambiguous", () => {
    const fake = fakeTransport([result("container-d\n"), result("", { status: 1 }), result()])
    expect(() => createLeanContainerMatchSession({ matchId: "match:lean:d", image: LEAN_CONTAINER_IMAGE, transport: fake.transport })).toThrow(/SESSION_START_FAILED/u)
    expect(fake.calls.map(([, args]) => args[0])).toEqual(["create", "start", "rm"])
  })
})
