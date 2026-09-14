import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { LAB_ADMITTED_ROOTS, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { buildFactoryAuthorCommand, completeAuthorAttempt, createFactoryAuthoringAllocation, createFrozenModelBundleV2FromAuthorAttempt, inspectAuthoringCapability, runFactoryAppServerAuthorAttempt, startAuthorAttempt, type AuthoringCapability, type FrozenAuthorSettings } from "./author-v1-38-factory-model-source.js"

const temporary: string[] = [], root = (value: string): LabRoot => `sha256:${createHash("sha256").update(value).digest("hex")}` as LabRoot
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }) })
const directory = () => { const value = mkdtempSync(join(tmpdir(), "factory-author-test-")); temporary.push(value); return value }
const packet = new TextEncoder().encode('{"abi":"disclosed"}'), packetRoot = root(new TextDecoder().decode(packet))
const capability: AuthoringCapability = { codexExecutable: realpathSync(process.execPath), codexVersion: "codex-cli 0.139.0", execHelp: "--model --sandbox --cd --skip-git-repo-check --ephemeral --ignore-user-config --json instructions are read from stdin", appServerHelp: "--stdio --strict-config --disable", featureList: "shell_tool stable\nunified_exec stable\nbrowser_use stable\nbrowser_use_external stable\napps stable\nplugins stable\ncomputer_use stable\nimage_generation stable\nimagegenext stable\nstandalone_web_search stable\nmulti_agent stable\n" }
const frozenSettings: FrozenAuthorSettings = { providerId: "openai-codex", settingsRoot: root("settings"), promptRoot: root("prompt"), contextRoot: root("context"), budgetRoot: root("budget"), runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, predecessorRoot: root("parent"), correctionRoot: null, retryParentRoot: null }
const source = `export default { selectActivations(input) { return { activationOrders: [], strategyMemory: {} }; }, soldierBrain(input) { return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }; } };`
const eventStream = (model: string | null, message = JSON.stringify({ source }), usage = true) => new TextEncoder().encode(`${JSON.stringify({ type: "thread.started", thread_id: "t1", ...(model ? { model } : {}) })}\n{"type":"turn.started"}\n{"type":"item.completed","item":{"id":"r1","type":"reasoning","text":"benign"}}\n${JSON.stringify({ type: "item.completed", item: { id: "a1", type: "agent_message", text: message } })}\n${usage ? '{"type":"turn.completed","usage":{"input_tokens":30000,"cached_input_tokens":1000,"output_tokens":20000,"reasoning_output_tokens":2000}}\n' : ""}`)
const launchFor = (parent: string) => buildFactoryAuthorCommand(createFactoryAuthoringAllocation(), { packetBytes: packet, packetRoot, disclosedDirectory: join(parent, "disclosed"), model: "gpt-5.6-sol", capability, frozenSettings, codePath: "/tool/bin", authHome: join(parent, "auth") })

describe("operational factory authoring", () => {
  it("binds packet, recipes, settings and model into a tool-disabled isolated launch", () => {
    const parent = directory(), result = launchFor(parent); expect(result.status).toBe("ready"); if (result.status !== "ready") return
    expect(result.argv[0]).toBe(capability.codexExecutable); expect(result.argv.filter((item) => item === "--disable")).toHaveLength(11); expect(result.argv).toEqual(expect.arrayContaining(["app-server", "--stdio", "--strict-config"])); expect(result.requestRecord).toMatchObject({ requestedModel: "gpt-5.6-sol", codexExecutable: capability.codexExecutable, launchEnvironment: result.env, frozenSettings, recipes: { S01: "tactical-base-exact", S12: "s05-guard-one-turn-to-stone" } })
    expect(result.env).toEqual({ PATH: "/tool/bin", LANG: "C.UTF-8", LC_ALL: "C.UTF-8", CODEX_HOME: join(parent, "auth") }); expect(readFileSync(result.packetPath)).toEqual(Buffer.from(packet)); expect(JSON.stringify(result)).not.toContain(".planning")
  })
  it("fails closed without exact installed capability evidence", () => {
    expect(inspectAuthoringCapability({ ...capability, featureList: capability.featureList.replace("shell_tool stable\n", "") }).available).toBe(false)
    expect(buildFactoryAuthorCommand(createFactoryAuthoringAllocation(), { packetBytes: packet, packetRoot, disclosedDirectory: join(directory(), "missing"), model: "gpt-5.6-sol", capability: { ...capability, execHelp: "--json" }, frozenSettings })).toEqual({ status: "authoring_context_capability_unavailable" })
  })
  it("rejects repository-contained and symlinked disclosed roots", () => {
    const parent = directory(), repository = join(parent, "repository"); mkdirSync(join(repository, ".git"), { recursive: true })
    expect(() => launchFor(repository)).toThrow("FACTORY_AUTHOR_DISCLOSED_DIRECTORY_REPOSITORY")
    const outside = join(parent, "outside"), linked = join(parent, "linked"); mkdirSync(join(outside, "disclosed"), { recursive: true }); mkdirSync(linked); symlinkSync(join(outside, "disclosed"), join(linked, "disclosed"))
    expect(() => launchFor(linked)).toThrow("FACTORY_AUTHOR_DISCLOSED_DIRECTORY_NOT_EMPTY")
  })
  it("parses documented exec JSONL but refuses a V2 bundle without raw reported identity", () => {
    const parent = directory(), allocation = createFactoryAuthoringAllocation(), ledger = join(parent, "ledger"), launch = launchFor(parent); if (launch.status !== "ready") throw new Error("launch")
    const times = [1_000, 1_050, 1_100], start = startAuthorAttempt(ledger, allocation, launch, () => times.shift()!)
    const stdout = eventStream(null), terminal = completeAuthorAttempt(ledger, start, launch, (_plan, timeout) => { expect(timeout).toBe(1_799_950); return { exitCode: 0, stdout, stderr: new Uint8Array(), admitted: { reportedModel: "gpt-5.6-sol", usage: { inputTokens: 30_000, outputTokens: 20_000, cachedInputTokens: 1_000, totalTokens: 50_000 }, source, validEnvelope: true } } }, () => times.shift()!)
    expect(terminal).toMatchObject({ disposition: "valid", elapsedMilliseconds: 50, reportedModel: "gpt-5.6-sol", usage: { inputTokens: 30_000, outputTokens: 20_000, cachedInputTokens: 1_000, totalTokens: 50_000 } })
    expect(() => createFrozenModelBundleV2FromAuthorAttempt(ledger, allocation, launch, start)).toThrow("FACTORY_AUTHOR_BUNDLE_CLEANUP")
    expect(() => completeAuthorAttempt(ledger, start, launch, () => { throw new Error("must not invoke") }, () => 2_000)).toThrow("FACTORY_AUTHOR_INVOCATION")
  })
  it("uses schema-verified app-server identity before charging and links its raw turn into V2", async () => {
    const parent = directory(), auth = join(parent, "native-auth.json"), executableLink = join(parent, "codex"); writeFileSync(auth, "not-read-by-author-code"); symlinkSync(capability.codexExecutable, executableLink)
    const linkedCapability = { ...capability, codexExecutable: executableLink }
    const times = [1_000, 1_010, 1_060, 1_070, 1_080]
    const rawJsonl = new TextEncoder().encode([
      { jsonrpc: "2.0", id: 2, result: { thread: { id: "thread-1" }, model: "gpt-5.6-sol", modelProvider: "openai-codex", cwd: join(parent, "disclosed"), sandbox: { type: "readOnly", networkAccess: false }, approvalPolicy: "never", instructionSources: [] } },
      { jsonrpc: "2.0", id: 3, result: { turn: { id: "turn-1" } } },
      { jsonrpc: "2.0", method: "item/completed", params: { threadId: "thread-1", turnId: "turn-1", item: { id: "item-1", type: "agentMessage", text: JSON.stringify({ source }) } } },
      { jsonrpc: "2.0", method: "thread/tokenUsage/updated", params: { threadId: "thread-1", turnId: "turn-1", tokenUsage: { total: { inputTokens: 12, cachedInputTokens: 2, outputTokens: 8, reasoningOutputTokens: 1, totalTokens: 20 }, last: { inputTokens: 12, cachedInputTokens: 2, outputTokens: 8, reasoningOutputTokens: 1, totalTokens: 20 } } } },
      { jsonrpc: "2.0", method: "turn/completed", params: { threadId: "thread-1", turn: { id: "turn-1", status: "completed" } } },
    ].map((event) => JSON.stringify(event)).join("\n") + "\n")
    const result = await runFactoryAppServerAuthorAttempt({ allocation: createFactoryAuthoringAllocation(), packetBytes: packet, packetRoot, disclosedDirectory: join(parent, "disclosed"), stateDirectory: join(parent, "state"), existingAuthFile: auth, ledgerDirectory: join(parent, "ledger"), model: "gpt-5.6-sol", modelProvider: "openai-codex", frozenSettings, capability: linkedCapability, clock: () => times.shift()!, transportFactory: async (options) => { expect(options).toMatchObject({ codexExecutable: capability.codexExecutable, env: { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", CODEX_HOME: join(parent, "state"), LANG: "C.UTF-8", LC_ALL: "C.UTF-8" }, requestedModel: "gpt-5.6-sol", requestedProvider: "openai-codex" }); expect(options.cwd).toContain("/disclosed/author-"); return { threadId: "thread-1", reportedModel: "gpt-5.6-sol", async close() { return "sigterm" as const }, async startTurn() { return { sourceMessage: JSON.stringify({ source }), usage: { inputTokens: 12, cachedInputTokens: 2, outputTokens: 8, reasoningOutputTokens: 1, totalTokens: 20 }, reportedModel: "gpt-5.6-sol", rawJsonl } } } } })
    expect(result.terminal).toMatchObject({ disposition: "valid", reportedModel: "gpt-5.6-sol", usage: { totalTokens: 20 } }); expect(result.bundle?.provenance.rawResponseRecord.bodyUtf8).toContain("tokenUsage")
  })
  it("keeps structurally invalid source correction-eligible but missing identity/usage and forbidden tools terminal", () => {
    const cases = [
      { stream: eventStream(null, JSON.stringify({ source: "export const x = 1" })), expected: "invalid", admitted: { reportedModel: "gpt-5.6-sol", usage: { inputTokens: 1, outputTokens: 1, cachedInputTokens: 0, totalTokens: 2 }, source: "export const x = 1", validEnvelope: true as const } },
      { stream: eventStream(null), expected: "charged_terminal_stop" },
      { stream: eventStream("gpt-5.6-sol", JSON.stringify({ source }), false), expected: "charged_terminal_stop" },
      { stream: new TextEncoder().encode('{"type":"thread.started","model":"gpt-5.6-sol"}\n{"type":"turn.started"}\n{"type":"item.started","item":{"type":"command_execution"}}\n{"type":"turn.completed","usage":{"input_tokens":1,"cached_input_tokens":0,"output_tokens":1,"reasoning_output_tokens":0}}\n'), expected: "charged_terminal_stop" },
    ]
    for (const [index, item] of cases.entries()) { const parent = directory(), allocation = createFactoryAuthoringAllocation(), ledger = join(parent, "ledger"), launch = launchFor(parent); if (launch.status !== "ready") throw new Error("launch"); let now = index * 10_000; const start = startAuthorAttempt(ledger, allocation, launch, () => now); const terminal = completeAuthorAttempt(ledger, start, launch, () => ({ exitCode: 0, stdout: item.stream, stderr: new Uint8Array(), admitted: "admitted" in item ? item.admitted : undefined }), () => ++now); expect(terminal.disposition).toBe(item.expected); if (item.expected === "invalid") expect(startAuthorAttempt(ledger, allocation, launch, () => now + 1).ordinal).toBe("A-02"); else expect(() => startAuthorAttempt(ledger, allocation, launch, () => now + 1)).toThrow() }
  })
  it("retains thrown/timeout outcomes and rejects tampered ledger roots before reuse", () => {
    const parent = directory(), allocation = createFactoryAuthoringAllocation(), ledger = join(parent, "ledger"), launch = launchFor(parent); if (launch.status !== "ready") throw new Error("launch"); let now = 100; const start = startAuthorAttempt(ledger, allocation, launch, () => now); const terminal = completeAuthorAttempt(ledger, start, launch, () => { throw new Error("interrupted") }, () => ++now); expect(terminal.disposition).toBe("system_failure"); expect(readFileSync(join(ledger, "A-01", "stderr.bin"), "utf8")).toContain("interrupted")
    const saved = JSON.parse(readFileSync(join(ledger, "A-01", "terminal.json"), "utf8")) as Record<string, unknown>; writeFileSync(join(ledger, "A-01", "terminal.json"), JSON.stringify({ ...saved, requestedModel: "forged" })); expect(() => startAuthorAttempt(ledger, allocation, launch, () => 200)).toThrow("FACTORY_AUTHOR_LEDGER_TERMINAL")
  })
  it("records cleanup failure and rejects the operational outcome", async () => {
    const parent = directory(), auth = join(parent, "native-auth.json"); writeFileSync(auth, "not-read")
    const promise = runFactoryAppServerAuthorAttempt({ allocation: createFactoryAuthoringAllocation(), packetBytes: packet, packetRoot, disclosedDirectory: join(parent, "disclosed"), stateDirectory: join(parent, "state"), existingAuthFile: auth, ledgerDirectory: join(parent, "ledger"), model: "gpt-5.6-sol", modelProvider: "openai-codex", frozenSettings, capability, transportFactory: async () => ({ threadId: "thread-1", reportedModel: "gpt-5.6-sol", async close() { throw new Error("still live") }, async startTurn() { throw new Error("deadline") } }) })
    await expect(promise).rejects.toThrow("still live")
    expect(JSON.parse(readFileSync(join(parent, "ledger", "A-01", "process-cleanup.json"), "utf8"))).toMatchObject({ disposition: "failed_to_exit" })
  })
})
