import { EventEmitter } from "node:events"
import { describe, expect, it } from "vitest"
import { createFactoryAppServerTransport, type FactoryAppServerProcess } from "./v1-38-factory-app-server-transport.js"

class FakeAppServer extends EventEmitter implements FactoryAppServerProcess {
  readonly stdout = new EventEmitter()
  readonly stderr = new EventEmitter()
  readonly writes: string[] = []
  readonly stdin = { write: (chunk: string): boolean => { this.writes.push(chunk); this.reply(JSON.parse(chunk) as Record<string, unknown>); return true } }
  killed = false
  ignoreTerm = false
  signals: Array<NodeJS.Signals | undefined> = []
  rerouteOnTurn = false
  kill(signal?: NodeJS.Signals): boolean { this.killed = true; this.signals.push(signal); if (!this.ignoreTerm || signal === "SIGKILL") queueMicrotask(() => this.emit("close", 0)); return true }
  private reply(request: Record<string, unknown>): void {
    const response = (result: unknown): void => { this.stdout.emit("data", Buffer.from(`${JSON.stringify({ jsonrpc: "2.0", id: request.id, result })}\n`)) }
    if (request.method === "initialize") response({ protocolVersion: "1" })
    if (request.method === "thread/start") response({ thread: { id: "thread-1" }, model: "gpt-5.6-luna", modelProvider: "openai", cwd: "/isolated", sandbox: { type: "readOnly", networkAccess: false }, approvalPolicy: "never", instructionSources: [] })
    if (request.method === "turn/start") {
      response({ turn: { id: "turn-1" } })
      for (const message of [
        ...(this.rerouteOnTurn ? [{ jsonrpc: "2.0", method: "model/rerouted", params: { threadId: "thread-1", turnId: "turn-1", fromModel: "gpt-5.6-luna", toModel: "other", reason: "fallback" } }] : []),
        { jsonrpc: "2.0", method: "item/completed", params: { threadId: "thread-1", turnId: "turn-1", completedAtMs: 1, item: { id: "item-1", type: "agentMessage", text: "{\"source\":\"source\"}" } } },
        { jsonrpc: "2.0", method: "thread/tokenUsage/updated", params: { threadId: "thread-1", turnId: "turn-1", tokenUsage: { total: { inputTokens: 30, cachedInputTokens: 5, outputTokens: 12, reasoningOutputTokens: 2, totalTokens: 42 }, last: { inputTokens: 30, cachedInputTokens: 5, outputTokens: 12, reasoningOutputTokens: 2, totalTokens: 42 }, modelContextWindow: null } } },
        { jsonrpc: "2.0", method: "turn/completed", params: { threadId: "thread-1", turn: { id: "turn-1", status: "completed" } } },
      ]) this.stdout.emit("data", Buffer.from(`${JSON.stringify(message)}\n`))
    }
  }
}

describe("factory Codex app-server transport", () => {
  const options = { codexExecutable: "/opt/codex/bin/codex", codexHome: "/fresh", cwd: "/isolated", env: { PATH: "/opt/codex/bin:/usr/bin:/bin", CODEX_HOME: "/fresh", LANG: "C.UTF-8", LC_ALL: "C.UTF-8" }, requestedModel: "gpt-5.6-luna", requestedProvider: "openai", timeoutMs: 100 } as const
  it("uses strict isolated startup, validates effective settings, and retains raw JSONL", async () => {
    const fake = new FakeAppServer()
    const transport = await createFactoryAppServerTransport({ ...options, spawn: (command, args, spawnOptions) => {
      expect(command).toBe("/opt/codex/bin/codex"); expect(args).toEqual(expect.arrayContaining(["app-server", "--stdio", "--strict-config", "--disable", "unified_exec"])); expect(spawnOptions).toEqual({ cwd: "/isolated", env: options.env, stdio: "pipe" }); return fake
    } })
    const result = await transport.startTurn("emit source only")
    expect(result).toMatchObject({ sourceMessage: '{"source":"source"}', usage: { totalTokens: 42 }, reportedModel: "gpt-5.6-luna" })
    expect(new TextDecoder().decode(result.rawJsonl)).toContain('"turn/completed"')
    expect(fake.writes.map((line) => JSON.parse(line).method)).toEqual(["initialize", "thread/start", "turn/start"])
  })
  it("rejects model rerouting before a turn can start", async () => {
    const fake = new FakeAppServer()
    const original = fake["reply"].bind(fake)
    fake["reply"] = (request: Record<string, unknown>): void => {
      if (request.method !== "thread/start") return original(request)
      fake.stdout.emit("data", Buffer.from(`${JSON.stringify({ jsonrpc: "2.0", id: request.id, result: { thread: { id: "thread-1" }, model: "rerouted", modelProvider: "openai", cwd: "/isolated", sandbox: { type: "readOnly", networkAccess: false }, approvalPolicy: "never", instructionSources: [] } })}\n`))
    }
    await expect(createFactoryAppServerTransport({ ...options, spawn: () => fake })).rejects.toThrow("FACTORY_APP_SERVER_THREAD_START_CONTRACT")
    expect(fake.writes.map((line) => JSON.parse(line).method)).toEqual(["initialize", "thread/start"])
    expect(fake.killed).toBe(true)
  })
  it("refuses an effective approval policy other than never before turn start", async () => {
    const fake = new FakeAppServer()
    const original = fake["reply"].bind(fake)
    fake["reply"] = (request: Record<string, unknown>): void => {
      if (request.method !== "thread/start") return original(request)
      fake.stdout.emit("data", Buffer.from(`${JSON.stringify({ jsonrpc: "2.0", id: request.id, result: { thread: { id: "thread-1" }, model: "gpt-5.6-luna", modelProvider: "openai", cwd: "/isolated", sandbox: { type: "readOnly", networkAccess: false }, approvalPolicy: "on-request", instructionSources: [] } })}\n`))
    }
    await expect(createFactoryAppServerTransport({ ...options, spawn: () => fake })).rejects.toThrow("FACTORY_APP_SERVER_THREAD_START_CONTRACT")
    expect(fake.writes.map((line) => JSON.parse(line).method)).toEqual(["initialize", "thread/start"])
    expect(fake.killed).toBe(true)
  })
  it("rejects an explicit in-turn reroute even when a terminal message follows", async () => {
    const fake = new FakeAppServer(); fake.rerouteOnTurn = true
    const transport = await createFactoryAppServerTransport({ ...options, spawn: () => fake })
    await expect(transport.startTurn("emit source only")).rejects.toThrow("FACTORY_APP_SERVER_TURN_TERMINAL_CONTRACT")
  })
  it("waits for termination and escalates an ignored SIGTERM", async () => {
    const fake = new FakeAppServer(); fake.ignoreTerm = true
    const transport = await createFactoryAppServerTransport({ ...options, spawn: () => fake })
    await expect(transport.close()).resolves.toBe("sigkill")
    expect(fake.signals).toEqual(["SIGTERM", "SIGKILL"])
  })
})
