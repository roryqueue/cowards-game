import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { buildFactoryAuthorCommand, completeAuthorAttempt, createFactoryAuthoringAllocation, inspectAuthoringCapability, startAuthorAttempt, type AuthoringCapability } from "./author-v1-38-factory-model-source.js"

const temporary: string[] = []
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }) })
const directory = () => { const value = mkdtempSync(join(tmpdir(), "factory-author-test-")); temporary.push(value); return value }
const packet = new TextEncoder().encode('{"abi":"disclosed"}')
const packetRoot = `sha256:${createHash("sha256").update(packet).digest("hex")}` as const
const capability: AuthoringCapability = { codexVersion: "codex-cli 0.139.0", execHelp: "--model --sandbox --cd --skip-git-repo-check --ephemeral --ignore-user-config --json instructions are read from stdin", featureList: "shell_tool stable\nunified_exec stable\nbrowser_use stable\nbrowser_use_external stable\napps stable\nplugins stable\ncomputer_use stable\nimage_generation stable\nimagegenext stable\nstandalone_web_search stable\n" }

describe("operational factory authoring", () => {
  it("builds a real isolated-cwd stdin launch with sanitized environment and every tool feature disabled", () => {
    const parent = directory(), disclosedDirectory = join(parent, "disclosed")
    const result = buildFactoryAuthorCommand(createFactoryAuthoringAllocation(), { packetBytes: packet, packetRoot, disclosedDirectory, model: "gpt-5.6-sol", capability, codePath: "/tool/bin", authHome: join(parent, "auth") })
    expect(result.status).toBe("ready"); if (result.status !== "ready") return
    expect(result.cwd).toBe(disclosedDirectory); expect(result.argv).toContain("gpt-5.6-sol"); expect(result.argv.at(-1)).toBe("-")
    expect(result.argv.filter((item) => item === "--disable")).toHaveLength(10)
    expect(result.env).toEqual({ PATH: "/tool/bin", LANG: "C.UTF-8", LC_ALL: "C.UTF-8", CODEX_HOME: join(parent, "auth") })
    expect(result.stdin).toContain('{"abi":"disclosed"}'); expect(readFileSync(result.packetPath)).toEqual(Buffer.from(packet)); expect(JSON.stringify(result)).not.toContain(".planning")
  })
  it("fails closed when the installed feature/help proof is incomplete", () => {
    expect(inspectAuthoringCapability({ ...capability, featureList: capability.featureList.replace("shell_tool stable\n", "") }).available).toBe(false)
    expect(buildFactoryAuthorCommand(createFactoryAuthoringAllocation(), { packetBytes: packet, packetRoot, disclosedDirectory: join(directory(), "missing"), model: "gpt-5.6-sol", capability: { ...capability, execHelp: "--json" } })).toEqual({ status: "authoring_context_capability_unavailable" })
  })
  it("durably captures the first valid attempt, exact usage, identities, request/response and source, then forbids corrections", () => {
    const parent = directory(), allocation = createFactoryAuthoringAllocation(), ledger = join(parent, "ledger")
    const launch = buildFactoryAuthorCommand(allocation, { packetBytes: packet, packetRoot, disclosedDirectory: join(parent, "disclosed"), model: "gpt-5.6-sol", capability })
    if (launch.status !== "ready") throw new Error("launch")
    const start = startAuthorAttempt(ledger, allocation, launch, 1_000)
    const stdout = new TextEncoder().encode('{"type":"metadata","model":"gpt-5.6-sol"}\n{"type":"item.completed","item":{"text":"{\\"source\\":\\"export const x = 1\\"}"}}\n{"type":"usage","usage":{"inputTokens":30000,"outputTokens":20000,"cachedInputTokens":1000,"totalTokens":50000}}\n')
    const terminal = completeAuthorAttempt(ledger, start, launch, () => ({ exitCode: 0, stdout, stderr: new Uint8Array() }))
    expect(terminal).toMatchObject({ disposition: "valid", requestedModel: "gpt-5.6-sol", reportedModel: "gpt-5.6-sol", usage: { totalTokens: 50_000 } })
    expect(readFileSync(join(ledger, "A-01", "response.jsonl"))).toEqual(Buffer.from(stdout)); expect(readFileSync(join(ledger, "A-01", "emitted-source.ts"), "utf8")).toBe("export const x = 1")
    expect(() => startAuthorAttempt(ledger, allocation, launch, 2_000)).toThrow("FACTORY_AUTHOR_TERMINAL")
  })
  it("charges invalid corrections but terminal-stops missing usage, system failure, and identity drift", () => {
    for (const scenario of [
      { exitCode: 0, lines: '{"type":"metadata","model":"gpt-5.6-sol"}\n', expected: "charged_terminal_stop" },
      { exitCode: 2, lines: "not-json\n", expected: "system_failure" },
      { exitCode: 0, lines: '{"type":"metadata","model":"other"}\n{"type":"usage","usage":{"inputTokens":1,"outputTokens":1,"cachedInputTokens":0,"totalTokens":2}}\n', expected: "identity_drift" },
    ]) { const parent = directory(), allocation = createFactoryAuthoringAllocation(); const launch = buildFactoryAuthorCommand(allocation, { packetBytes: packet, packetRoot, disclosedDirectory: join(parent, "disclosed"), model: "gpt-5.6-sol", capability }); if (launch.status !== "ready") throw new Error("launch"); const start = startAuthorAttempt(join(parent, "ledger"), allocation, launch, 0); const terminal = completeAuthorAttempt(join(parent, "ledger"), start, launch, () => ({ exitCode: scenario.exitCode, stdout: new TextEncoder().encode(scenario.lines), stderr: new TextEncoder().encode("retained") })); expect(terminal.disposition).toBe(scenario.expected); expect(() => startAuthorAttempt(join(parent, "ledger"), allocation, launch, 1)).toThrow() }
  })
})
