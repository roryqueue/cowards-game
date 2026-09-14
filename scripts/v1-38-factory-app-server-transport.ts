import { spawn as spawnChild, type ChildProcessWithoutNullStreams } from "node:child_process"

export interface FactoryAppServerProcess {
  readonly stdin: { write(chunk: string): boolean }
  readonly stdout: { on(event: "data", listener: (chunk: Buffer) => void): unknown }
  readonly stderr: { on(event: "data", listener: (chunk: Buffer) => void): unknown }
  readonly on: (event: "close" | "error", listener: (...args: readonly unknown[]) => void) => unknown
  kill(signal?: NodeJS.Signals): boolean
}

export interface FactoryAppServerTransportOptions {
  /** A newly created, caller-prepared Codex state directory. This helper never reads or copies authentication. */
  readonly codexHome: string
  /** An empty, disclosed-packet-only directory; it must not be the repository checkout. */
  readonly cwd: string
  readonly requestedModel: string
  readonly requestedProvider: string
  readonly timeoutMs: number
  readonly spawn?: (command: string, args: readonly string[], options: Readonly<{ cwd: string; env: Readonly<Record<string, string>>; stdio: "pipe" }>) => FactoryAppServerProcess
}

export interface FactoryAppServerTurnResult {
  readonly sourceMessage: string
  readonly usage: Readonly<{ inputTokens: number; cachedInputTokens: number; outputTokens: number; reasoningOutputTokens: number; totalTokens: number }>
  readonly reportedModel: string
  readonly rawJsonl: Uint8Array
}

export interface FactoryAppServerTransport {
  readonly threadId: string
  readonly reportedModel: string
  startTurn(sourceMessage: string, timeoutMs?: number): Promise<FactoryAppServerTurnResult>
  close(): void
}

type JsonRecord = Readonly<Record<string, unknown>>
const fail = (code: string): never => { throw new TypeError(`FACTORY_APP_SERVER_${code}`) }
const record = (value: unknown): JsonRecord | null => value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null
const text = (value: unknown): string | null => typeof value === "string" && value.length > 0 ? value : null
const nonNegativeInteger = (value: unknown): number | null => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : null
const byteCopy = (parts: readonly Buffer[]): Uint8Array => Uint8Array.from(Buffer.concat(parts))

/**
 * Starts the installed Codex app-server in a no-tools, read-only authoring context.
 * Authentication is intentionally outside this API: the caller prepares the supplied
 * CODEX_HOME binding and this helper neither discovers nor copies credentials.
 */
export const createFactoryAppServerTransport = async (options: FactoryAppServerTransportOptions): Promise<FactoryAppServerTransport> => {
  if (!options.codexHome || !options.cwd || !options.requestedModel || !options.requestedProvider || !Number.isSafeInteger(options.timeoutMs) || options.timeoutMs < 1) fail("OPTIONS")
  const raw: Buffer[] = []
  const pending = new Map<number, { resolve(value: JsonRecord): void; reject(error: Error): void }>()
  const terminal = new Map<string, JsonRecord>(), usageByTurn = new Map<string, JsonRecord>(), messagesByTurn = new Map<string, string[]>()
  const forbiddenTurns = new Set<string>()
  let sequence = 0
  let buffered = ""
  let closed: Error | null = null
  const defaultSpawn = (command: string, args: readonly string[], spawnOptions: Readonly<{ cwd: string; env: Readonly<Record<string, string>>; stdio: "pipe" }>): FactoryAppServerProcess => spawnChild(command, [...args], spawnOptions) as ChildProcessWithoutNullStreams
  const child = (options.spawn ?? defaultSpawn)("codex", [
    "app-server", "--stdio", "--strict-config",
    ...["shell_tool", "unified_exec", "browser_use", "browser_use_external", "apps", "plugins", "computer_use", "image_generation", "imagegenext", "standalone_web_search", "multi_agent"].flatMap((feature) => ["--disable", feature]),
  ], { cwd: options.cwd, env: Object.freeze({ PATH: process.env.PATH ?? "", CODEX_HOME: options.codexHome, LANG: "C.UTF-8", LC_ALL: "C.UTF-8" }), stdio: "pipe" })
  const rejectPending = (error: Error): void => { for (const request of pending.values()) request.reject(error); pending.clear() }
  const acceptLine = (line: string): void => {
    if (!line.trim()) return
    let message: JsonRecord
    try { message = JSON.parse(line) as JsonRecord } catch { rejectPending(new Error("FACTORY_APP_SERVER_INVALID_JSONL")); return }
    const id = typeof message.id === "number" ? message.id : null
    if (id !== null && pending.has(id)) {
      const request = pending.get(id)!
      pending.delete(id)
      if (record(message.error)) request.reject(new Error(`FACTORY_APP_SERVER_RPC_${JSON.stringify(message.error)}`))
      else { const result = record(message.result); if (!result) request.reject(new Error("FACTORY_APP_SERVER_RESULT")); else request.resolve(result) }
      return
    }
    const params = record(message.params)
    if (message.method === "model/rerouted" && params) { const turnId = text(params.turnId); if (turnId) forbiddenTurns.add(turnId) }
    if (message.method === "thread/tokenUsage/updated" && params) { const turnId = text(params.turnId), tokenUsage = record(params.tokenUsage), total = record(tokenUsage?.total); if (turnId && total) usageByTurn.set(turnId, total) }
    if ((message.method === "item/started" || message.method === "item/completed") && params) { const turnId = text(params.turnId), item = record(params.item), itemType = text(item?.type); if (turnId && itemType && !["reasoning", "agentMessage"].includes(itemType)) forbiddenTurns.add(turnId); if (turnId && message.method === "item/completed" && itemType === "agentMessage" && typeof item?.text === "string") messagesByTurn.set(turnId, [...(messagesByTurn.get(turnId) ?? []), item.text]) }
    if ((message.method === "turn/completed" || message.method === "turn/failed") && params) {
      const turn = record(params.turn) ?? params
      const idValue = text(turn.id) ?? text(params.turnId)
      if (idValue) terminal.set(idValue, Object.freeze({ ...params, turn }))
    }
  }
  child.stdout.on("data", (chunk) => {
    raw.push(Buffer.from(chunk)); buffered += Buffer.from(chunk).toString("utf8")
    for (;;) { const newline = buffered.indexOf("\n"); if (newline < 0) break; const line = buffered.slice(0, newline); buffered = buffered.slice(newline + 1); acceptLine(line) }
  })
  // stderr is deliberately excluded: rawJsonl is the exact app-server protocol stream,
  // not a mixed diagnostics stream that callers might later mistake for JSONL evidence.
  child.stderr.on("data", () => undefined)
  child.on("error", (error) => { closed = error instanceof Error ? error : new Error("FACTORY_APP_SERVER_PROCESS_ERROR"); rejectPending(closed) })
  child.on("close", () => { closed ??= new Error("FACTORY_APP_SERVER_PROCESS_CLOSED"); rejectPending(closed) })
  const request = (method: string, params: JsonRecord, timeoutMs = options.timeoutMs): Promise<JsonRecord> => new Promise((resolve, reject) => {
    if (closed) { reject(closed); return }
    const id = ++sequence
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`FACTORY_APP_SERVER_TIMEOUT_${method}`)) }, timeoutMs)
    pending.set(id, { resolve: (value) => { clearTimeout(timer); resolve(value) }, reject: (error) => { clearTimeout(timer); reject(error) } })
    try { child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`) } catch (error) { pending.delete(id); clearTimeout(timer); reject(error instanceof Error ? error : new Error("FACTORY_APP_SERVER_WRITE")) }
  })
  try {
    await request("initialize", Object.freeze({ clientInfo: Object.freeze({ name: "cowards-game-v1.38-factory", version: "1" }), capabilities: Object.freeze({}) }))
    const started = await request("thread/start", Object.freeze({ cwd: options.cwd, model: options.requestedModel, modelProvider: options.requestedProvider, sandbox: "read-only", approvalPolicy: "never", ephemeral: true, baseInstructions: "Return only the requested inert source JSON. Never request tools or external context.", developerInstructions: null, config: Object.freeze({}) }))
    const thread = record(started.thread)
    const threadId = text(thread?.id)
    const reportedModel = text(started.model), provider = text(started.modelProvider), cwd = text(started.cwd), sandbox = record(started.sandbox), instructionSources = started.instructionSources
    if (!threadId || reportedModel !== options.requestedModel || provider !== options.requestedProvider || cwd !== options.cwd || sandbox?.type !== "readOnly" || sandbox.networkAccess !== false || started.approvalPolicy !== "never" || !Array.isArray(instructionSources) || instructionSources.length !== 0) fail("THREAD_START_CONTRACT")
    const admittedThreadId = threadId as string
    const admittedModel = reportedModel as string
    return Object.freeze({
      threadId: admittedThreadId, reportedModel: admittedModel,
      async startTurn(sourceMessage: string, timeoutMs = options.timeoutMs): Promise<FactoryAppServerTurnResult> {
        if (!sourceMessage || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1) fail("SOURCE_MESSAGE")
        const deadline = Date.now() + timeoutMs
        const startedTurn = await request("turn/start", Object.freeze({ threadId: admittedThreadId, input: Object.freeze([{ type: "text", text: sourceMessage }]) }), Math.max(1, deadline - Date.now()))
        const turn = record(startedTurn.turn) ?? startedTurn
        const turnId = text(turn.id)
        if (!turnId) fail("TURN_START")
        const admittedTurnId = turnId as string
        while (!terminal.has(admittedTurnId)) {
          if (Date.now() >= deadline) fail("TURN_TIMEOUT")
          await new Promise<void>((resolve) => setTimeout(resolve, 5))
        }
        const completed = terminal.get(admittedTurnId)!, completedTurn = record(completed.turn) ?? completed, status = text(completedTurn.status)
        const rawUsage = usageByTurn.get(admittedTurnId), messages = messagesByTurn.get(admittedTurnId) ?? []
        const usage = rawUsage && { inputTokens: nonNegativeInteger(rawUsage.inputTokens), cachedInputTokens: nonNegativeInteger(rawUsage.cachedInputTokens), outputTokens: nonNegativeInteger(rawUsage.outputTokens), reasoningOutputTokens: nonNegativeInteger(rawUsage.reasoningOutputTokens), totalTokens: nonNegativeInteger(rawUsage.totalTokens) }
        if (status !== "completed" || forbiddenTurns.has(admittedTurnId) || messages.length !== 1 || !usage || Object.values(usage).some((value) => value === null) || usage.totalTokens !== usage.inputTokens! + usage.outputTokens!) fail("TURN_TERMINAL_CONTRACT")
        return Object.freeze({ sourceMessage: messages[0]!, usage: usage as FactoryAppServerTurnResult["usage"], reportedModel: admittedModel, rawJsonl: byteCopy(raw) })
      },
      close: () => { child.kill("SIGTERM") },
    })
  } catch (error) { child.kill("SIGTERM"); throw error }
}
