import { spawn as spawnChild, type ChildProcessWithoutNullStreams } from "node:child_process"

export interface FactoryAppServerProcess {
  readonly stdin: { write(chunk: string): boolean }
  readonly stdout: { on(event: "data", listener: (chunk: Buffer) => void): unknown }
  readonly stderr: { on(event: "data", listener: (chunk: Buffer) => void): unknown }
  readonly on: (event: "close" | "error", listener: (...args: readonly unknown[]) => void) => unknown
  kill(signal?: NodeJS.Signals): boolean
}

export interface FactoryAppServerTransportOptions {
  readonly codexExecutable: string
  /** A newly created, caller-prepared Codex state directory. This helper never reads or copies authentication. */
  readonly codexHome: string
  /** An empty, disclosed-packet-only directory; it must not be the repository checkout. */
  readonly cwd: string
  readonly env: Readonly<Record<string, string>>
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
export interface FactoryAppServerTurnFailureEvidence {
  readonly rawJsonl: Uint8Array
  readonly usage: FactoryAppServerTurnResult["usage"] | null
  readonly reportedModel: string
  readonly terminalStatus: string | null
}
export class FactoryAppServerTurnFailure extends Error {
  constructor(message: string, readonly evidence: FactoryAppServerTurnFailureEvidence) { super(message); this.name = "FactoryAppServerTurnFailure" }
}

export interface FactoryAppServerTransport {
  readonly threadId: string
  readonly reportedModel: string
  startTurn(sourceMessage: string, timeoutMs?: number): Promise<FactoryAppServerTurnResult>
  close(): Promise<"already_exited" | "sigterm" | "sigkill">
}

type JsonRecord = Readonly<Record<string, unknown>>
const fail = (code: string): never => { throw new TypeError(`FACTORY_APP_SERVER_${code}`) }
const record = (value: unknown): JsonRecord | null => value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null
const text = (value: unknown): string | null => typeof value === "string" && value.length > 0 ? value : null
const userMessageText = (item: JsonRecord | null): string | null => { const content = item?.content; if (!Array.isArray(content) || content.length !== 1) return null; const part = record(content[0]); return part?.type === "text" ? text(part.text) : null }
const nonNegativeInteger = (value: unknown): number | null => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : null
const byteCopy = (parts: readonly Buffer[]): Uint8Array => Uint8Array.from(Buffer.concat(parts))

/**
 * Starts the installed Codex app-server in a no-tools, read-only authoring context.
 * Authentication is intentionally outside this API: the caller prepares the supplied
 * CODEX_HOME binding and this helper neither discovers nor copies credentials.
 */
export const createFactoryAppServerTransport = async (options: FactoryAppServerTransportOptions): Promise<FactoryAppServerTransport> => {
  const envKeys = Object.keys(options.env).sort()
  if (!options.codexExecutable.startsWith("/") || !options.codexHome || !options.cwd || !options.requestedModel || !options.requestedProvider || !Number.isSafeInteger(options.timeoutMs) || options.timeoutMs < 1 || envKeys.join("\0") !== ["CODEX_HOME", "LANG", "LC_ALL", "PATH"].sort().join("\0") || options.env.CODEX_HOME !== options.codexHome) fail("OPTIONS")
  const raw: Buffer[] = []
  const pending = new Map<number, { resolve(value: JsonRecord): void; reject(error: Error): void }>()
  const terminal = new Map<string, JsonRecord>(), usageByTurn = new Map<string, JsonRecord>(), messagesByTurn = new Map<string, string[]>()
  const forbiddenTurns = new Set<string>()
  const userMessageStarted = new Set<string>(), userMessageCompleted = new Set<string>()
  const userMessageTurnIds = new Set<string>()
  let protocolTurnFailure = false
  let admittedThreadId: string | null = null
  let activeSourceMessage: string | null = null
  let sequence = 0
  let buffered = ""
  let closed: Error | null = null
  const defaultSpawn = (command: string, args: readonly string[], spawnOptions: Readonly<{ cwd: string; env: Readonly<Record<string, string>>; stdio: "pipe" }>): FactoryAppServerProcess => spawnChild(command, [...args], spawnOptions) as ChildProcessWithoutNullStreams
  const child = (options.spawn ?? defaultSpawn)(options.codexExecutable, [
    "app-server", "--stdio", "--strict-config",
    ...["shell_tool", "unified_exec", "browser_use", "browser_use_external", "apps", "plugins", "computer_use", "image_generation", "imagegenext", "standalone_web_search", "multi_agent"].flatMap((feature) => ["--disable", feature]),
  ], { cwd: options.cwd, env: options.env, stdio: "pipe" })
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
    if (message.method === "turn/failed" || message.method === "error") {
      protocolTurnFailure = true
      const failedTurn = record(params?.turn)
      const failedTurnId = text(failedTurn?.id) ?? text(params?.turnId)
      if (failedTurnId) forbiddenTurns.add(failedTurnId)
    }
    if (message.method === "thread/tokenUsage/updated" && params) { const turnId = text(params.turnId), tokenUsage = record(params.tokenUsage), total = record(tokenUsage?.total); if (turnId && total) usageByTurn.set(turnId, total) }
    if ((message.method === "item/started" || message.method === "item/completed") && params) {
      const turnId = text(params.turnId), item = record(params.item), itemType = text(item?.type)
      if (itemType === "userMessage") {
        const itemId = text(item?.id)
        if (params.threadId !== admittedThreadId || !turnId || !itemId || userMessageText(item) !== activeSourceMessage || (message.method === "item/started" ? userMessageStarted.has(itemId) || (userMessageStarted.size > 0 && !userMessageCompleted.has(itemId)) : userMessageCompleted.has(itemId) || (userMessageStarted.size > 0 && !userMessageStarted.has(itemId)) || (userMessageCompleted.size > 0 && !userMessageStarted.has(itemId)))) protocolTurnFailure = true
        else {
          userMessageTurnIds.add(turnId)
          if (message.method === "item/started") userMessageStarted.add(itemId)
          else userMessageCompleted.add(itemId)
        }
      } else {
        if (turnId && itemType && !["reasoning", "agentMessage"].includes(itemType)) forbiddenTurns.add(turnId)
        if (turnId && message.method === "item/completed" && itemType === "agentMessage" && typeof item?.text === "string") messagesByTurn.set(turnId, [...(messagesByTurn.get(turnId) ?? []), item.text])
      }
    }
    if ((message.method === "turn/completed" || message.method === "turn/failed") && params) {
      const turn = record(params.turn) ?? params
      const idValue = text(turn.id) ?? text(params.turnId)
      if (idValue && !terminal.has(idValue)) terminal.set(idValue, Object.freeze({ ...params, turn }))
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
  let observedClose = false
  const closeWaiters: Array<() => void> = []
  child.on("close", () => { observedClose = true; for (const resolve of closeWaiters.splice(0)) resolve(); closed ??= new Error("FACTORY_APP_SERVER_PROCESS_CLOSED"); rejectPending(closed) })
  const waitForClose = (timeoutMs: number): Promise<boolean> => observedClose ? Promise.resolve(true) : new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs)
    closeWaiters.push(() => { clearTimeout(timer); resolve(true) })
  })
  const request = (method: string, params: JsonRecord, timeoutMs = options.timeoutMs): Promise<JsonRecord> => new Promise((resolve, reject) => {
    if (closed) { reject(closed); return }
    const id = ++sequence
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`FACTORY_APP_SERVER_TIMEOUT_${method}`)) }, timeoutMs)
    pending.set(id, { resolve: (value) => { clearTimeout(timer); resolve(value) }, reject: (error) => { clearTimeout(timer); reject(error) } })
    try { child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`) } catch (error) { pending.delete(id); clearTimeout(timer); reject(error instanceof Error ? error : new Error("FACTORY_APP_SERVER_WRITE")) }
  })
  try {
    await request("initialize", Object.freeze({ clientInfo: Object.freeze({ name: "cowards-game-v1.38-factory", version: "1" }), capabilities: Object.freeze({ experimentalApi: false, optOutNotificationMethods: Object.freeze(["item/agentMessage/delta"]) }) }))
    let cursor: string | null = null, modelAvailable = false
    for (let page = 0; page < 10; page += 1) {
      const listed = await request("model/list", Object.freeze({ includeHidden: true, limit: 1000, cursor }))
      const data = listed.data
      if (!Array.isArray(data) || !(listed.nextCursor === null || typeof listed.nextCursor === "string")) fail("MODEL_CATALOG")
      if ((data as unknown[]).some((entry: unknown) => record(entry)?.model === options.requestedModel)) modelAvailable = true
      cursor = listed.nextCursor as string | null
      if (modelAvailable || cursor === null) break
    }
    if (!modelAvailable) fail("MODEL_UNAVAILABLE")
    const started = await request("thread/start", Object.freeze({ cwd: options.cwd, model: options.requestedModel, modelProvider: options.requestedProvider, sandbox: "read-only", approvalPolicy: "never", ephemeral: true, baseInstructions: "Return only the requested inert source JSON. Never request tools or external context.", developerInstructions: null, config: Object.freeze({}) }))
    const thread = record(started.thread)
    const threadId = text(thread?.id)
    const reportedModel = text(started.model), provider = text(started.modelProvider), cwd = text(started.cwd), sandbox = record(started.sandbox), instructionSources = started.instructionSources
    if (!threadId || reportedModel !== options.requestedModel || provider !== options.requestedProvider || cwd !== options.cwd || sandbox?.type !== "readOnly" || sandbox.networkAccess !== false || started.approvalPolicy !== "never" || !Array.isArray(instructionSources) || instructionSources.length !== 0) fail("THREAD_START_CONTRACT")
    admittedThreadId = threadId
    const admittedModel = reportedModel as string
    return Object.freeze({
      threadId: threadId as string, reportedModel: admittedModel,
      async startTurn(sourceMessage: string, timeoutMs = options.timeoutMs): Promise<FactoryAppServerTurnResult> {
        if (!sourceMessage || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1) fail("SOURCE_MESSAGE")
        activeSourceMessage = sourceMessage
        const deadline = Date.now() + timeoutMs
        let admittedTurnId: string | null = null
        try {
          const startedTurn = await request("turn/start", Object.freeze({ threadId: admittedThreadId, input: Object.freeze([{ type: "text", text: sourceMessage }]) }), Math.max(1, deadline - Date.now()))
          const turn = record(startedTurn.turn) ?? startedTurn
          admittedTurnId = text(turn.id)
          if (!admittedTurnId) fail("TURN_START")
          const turnKey = admittedTurnId as string
          while (!terminal.has(turnKey)) { if (Date.now() >= deadline) fail("TURN_TIMEOUT"); await new Promise<void>((resolve) => setTimeout(resolve, 5)) }
          const completed = terminal.get(turnKey)!, completedTurn = record(completed.turn) ?? completed, status = text(completedTurn.status)
          const rawUsage = usageByTurn.get(turnKey), messages = messagesByTurn.get(turnKey) ?? []
          const usage = rawUsage && { inputTokens: nonNegativeInteger(rawUsage.inputTokens), cachedInputTokens: nonNegativeInteger(rawUsage.cachedInputTokens), outputTokens: nonNegativeInteger(rawUsage.outputTokens), reasoningOutputTokens: nonNegativeInteger(rawUsage.reasoningOutputTokens), totalTokens: nonNegativeInteger(rawUsage.totalTokens) }
          if (status !== "completed" || protocolTurnFailure || forbiddenTurns.has(turnKey) || [...userMessageTurnIds].some((itemId) => itemId !== turnKey) || [...userMessageStarted].some((itemId) => !userMessageCompleted.has(itemId)) || messages.length !== 1 || !usage || Object.values(usage).some((value) => value === null) || usage.totalTokens !== usage.inputTokens! + usage.outputTokens!) fail("TURN_TERMINAL_CONTRACT")
          return Object.freeze({ sourceMessage: messages[0]!, usage: usage as FactoryAppServerTurnResult["usage"], reportedModel: admittedModel, rawJsonl: byteCopy(raw) })
        } catch (error) {
          const rawUsage = admittedTurnId ? usageByTurn.get(admittedTurnId) : null
          const parsed = rawUsage && { inputTokens: nonNegativeInteger(rawUsage.inputTokens), cachedInputTokens: nonNegativeInteger(rawUsage.cachedInputTokens), outputTokens: nonNegativeInteger(rawUsage.outputTokens), reasoningOutputTokens: nonNegativeInteger(rawUsage.reasoningOutputTokens), totalTokens: nonNegativeInteger(rawUsage.totalTokens) }
          const usage = parsed && !Object.values(parsed).some((value) => value === null) && parsed.totalTokens === parsed.inputTokens! + parsed.outputTokens! ? parsed as FactoryAppServerTurnResult["usage"] : null
          const ended = admittedTurnId ? terminal.get(admittedTurnId) : null, status = text(record(ended?.turn)?.status) ?? text(ended?.status)
          throw new FactoryAppServerTurnFailure(error instanceof Error ? error.message : "FACTORY_APP_SERVER_TURN_FAILURE", Object.freeze({ rawJsonl: byteCopy(raw), usage, reportedModel: admittedModel, terminalStatus: status }))
        }
      },
      async close(): Promise<"already_exited" | "sigterm" | "sigkill"> {
        if (observedClose) return "already_exited"
        child.kill("SIGTERM")
        if (await waitForClose(250)) return "sigterm"
        child.kill("SIGKILL")
        if (await waitForClose(250)) return "sigkill"
        return fail("PROCESS_DID_NOT_EXIT")
      },
    })
  } catch (error) { child.kill("SIGTERM"); throw error }
}
