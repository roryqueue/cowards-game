import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code: string): never => { throw new TypeError(`FACTORY_AUTHOR_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const bytesRoot = (value: Uint8Array | string): LabRoot => `sha256:${createHash("sha256").update(value).digest("hex")}` as LabRoot
const atomicJson = (path: string, value: unknown) => { const tmp = `${path}.tmp-${process.pid}`; writeFileSync(tmp, `${JSON.stringify(value)}\n`, { flag: "wx", mode: 0o600 }); renameSync(tmp, path) }

export type FactorySourceSlot = "S01" | "S02" | "S03" | "S04" | "S05" | "S06" | "S07" | "S08" | "S09" | "S10" | "S11" | "S12"
export interface FactoryAuthoringAllocation {
  readonly schemaVersion: "factory-model-authoring-allocation-v1"; readonly root: LabRoot
  readonly attempts: readonly ["A-01", "A-02", "A-03", "A-04"]
  readonly windowMinutes: 30; readonly perAttemptTokenCeiling: 50_000; readonly totalTokenCeiling: 200_000
  readonly providerTokenCapAvailability: "unavailable"; readonly humanExternal: "unused_zero"
  readonly sourceSlots: readonly FactorySourceSlot[]; readonly workloadCount: 48; readonly workloadWindowMinutes: 90
  readonly maxInvocations: 256; readonly maxLifetimeMs: 120_000; readonly perMethodMilliseconds: 1_000
}
export const FACTORY_SOURCE_RECIPES: Readonly<Record<FactorySourceSlot, string>> = Object.freeze({
  S01: "tactical-base-exact", S02: "s01-comment-only", S03: "teacher-base-depth-3-nodes-128", S04: "s03-delegating-wrapper",
  S05: "first-valid-a-slot-model-base", S06: "s05-opaque-id-geometry-roundtrip", S07: "s01-x2-turn-to-stone", S08: "s01-all-turn-to-stone",
  S09: "s03-comment-only", S10: "s03-x2-mutation", S11: "s05-guard-zero-wrapper", S12: "s05-guard-one-turn-to-stone",
})
const sourceSlots = Object.keys(FACTORY_SOURCE_RECIPES) as FactorySourceSlot[]
const allocationValue = (): Omit<FactoryAuthoringAllocation, "root"> => ({ schemaVersion: "factory-model-authoring-allocation-v1", attempts: ["A-01", "A-02", "A-03", "A-04"], windowMinutes: 30, perAttemptTokenCeiling: 50_000, totalTokenCeiling: 200_000, providerTokenCapAvailability: "unavailable", humanExternal: "unused_zero", sourceSlots, workloadCount: 48, workloadWindowMinutes: 90, maxInvocations: 256, maxLifetimeMs: 120_000, perMethodMilliseconds: 1_000 })
export const createFactoryAuthoringAllocation = (): Readonly<FactoryAuthoringAllocation> => { const value = allocationValue(); return Object.freeze({ ...value, root: labRoot("factory-model-authoring-allocation-v1", value) }) }
export const admitFactoryAuthoringAllocation = (value: unknown): Readonly<FactoryAuthoringAllocation> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail("ALLOCATION")
  const record = value as Record<string, unknown>, expected = allocationValue()
  if (Object.keys(record).length !== 14 || !isRoot(record.root) || Object.entries(expected).some(([key, item]) => JSON.stringify(record[key]) !== JSON.stringify(item)) || record.root !== labRoot("factory-model-authoring-allocation-v1", expected)) return fail("ALLOCATION")
  return Object.freeze(record as unknown as FactoryAuthoringAllocation)
}

export interface ModelUsageRecord { readonly inputTokens: number; readonly outputTokens: number; readonly cachedInputTokens: number; readonly totalTokens: number }
export const assessAuthoringUsage = (usage: ModelUsageRecord | null): "within_ceiling" | "charged_terminal_stop" => !usage || ![usage.inputTokens, usage.outputTokens, usage.cachedInputTokens, usage.totalTokens].every(Number.isSafeInteger) || usage.inputTokens < 0 || usage.outputTokens < 0 || usage.cachedInputTokens < 0 || usage.cachedInputTokens > usage.inputTokens || usage.totalTokens !== usage.inputTokens + usage.outputTokens || usage.totalTokens > 50_000 ? "charged_terminal_stop" : "within_ceiling"

const FEATURES = ["shell_tool", "unified_exec", "browser_use", "browser_use_external", "apps", "plugins", "computer_use", "image_generation", "imagegenext", "standalone_web_search"] as const
export interface AuthoringCapability { readonly codexVersion: string; readonly execHelp: string; readonly featureList: string }
export const inspectAuthoringCapability = (input: AuthoringCapability) => {
  const names = new Set(input.featureList.split(/\r?\n/u).map((line) => line.trim().split(/\s+/u)[0]).filter(Boolean))
  const help = ["--model", "--sandbox", "--cd", "--skip-git-repo-check", "--ephemeral", "--ignore-user-config", "--json", "instructions are read from stdin"]
  return Object.freeze({ available: /^codex-cli\s+\d+\.\d+\.\d+$/u.test(input.codexVersion.trim()) && help.every((flag) => input.execHelp.includes(flag)) && FEATURES.every((feature) => names.has(feature)), clientVersion: input.codexVersion.trim(), disabledFeatures: Object.freeze([...FEATURES]) })
}
export interface FactoryAuthorLaunchPlan { readonly status: "ready"; readonly cwd: string; readonly argv: readonly string[]; readonly env: Readonly<Record<string, string>>; readonly stdin: string; readonly packetPath: string; readonly packetRoot: LabRoot; readonly requestedModel: string; readonly requestRecord: Readonly<Record<string, unknown>>; readonly requestRecordRoot: LabRoot }
export const buildFactoryAuthorCommand = (allocation: FactoryAuthoringAllocation, input: Readonly<{ packetBytes: Uint8Array; packetRoot: LabRoot; disclosedDirectory: string; model: string; capability: AuthoringCapability; codePath?: string; authHome?: string }>): Readonly<FactoryAuthorLaunchPlan> | Readonly<{ status: "authoring_context_capability_unavailable" }> => {
  const admitted = admitFactoryAuthoringAllocation(allocation), capability = inspectAuthoringCapability(input.capability)
  if (!capability.available || !isRoot(input.packetRoot) || bytesRoot(input.packetBytes) !== input.packetRoot || !/^[-a-zA-Z0-9_.:]+$/u.test(input.model)) return Object.freeze({ status: "authoring_context_capability_unavailable" as const })
  const cwd = resolve(input.disclosedDirectory); mkdirSync(cwd, { mode: 0o700 }); if (readdirSync(cwd).length !== 0) return fail("DISCLOSED_DIRECTORY_NOT_EMPTY")
  const packetPath = join(cwd, "admitted-packet.json"); writeFileSync(packetPath, input.packetBytes, { flag: "wx", mode: 0o400 })
  const argv = ["codex", "exec", "--ephemeral", "--json", "--ignore-user-config", "--strict-config", "--skip-git-repo-check", "--sandbox", "read-only", "--cd", cwd, "--model", input.model, ...capability.disabledFeatures.flatMap((feature) => ["--disable", feature]), "-"]
  const stdin = `Author deterministic TypeScript using only this admitted packet. Do not request tools, files, network, or host context. Return one JSON object with a source string.\n<admitted-packet root="${input.packetRoot}">\n${new TextDecoder().decode(input.packetBytes)}\n</admitted-packet>\n`
  const env: Record<string, string> = { PATH: input.codePath ?? "/usr/bin:/bin:/usr/sbin:/sbin", LANG: "C.UTF-8", LC_ALL: "C.UTF-8" }; if (input.authHome) env.CODEX_HOME = resolve(input.authHome)
  const requestRecord = Object.freeze({ schemaVersion: "factory-model-author-request-v1", allocationRoot: admitted.root, packetRoot: input.packetRoot, requestedModel: input.model, clientVersion: capability.clientVersion, clientSettings: argv.slice(2), context: stdin, cwdClass: "fresh-disclosed-packet-only" })
  return Object.freeze({ status: "ready", cwd, argv: Object.freeze(argv), env: Object.freeze(env), stdin, packetPath, packetRoot: input.packetRoot, requestedModel: input.model, requestRecord, requestRecordRoot: labRoot("factory-model-author-request-v1", requestRecord) })
}

export interface AuthorAttemptStart { readonly schemaVersion: "factory-model-author-attempt-start-v1"; readonly allocationRoot: LabRoot; readonly ordinal: "A-01" | "A-02" | "A-03" | "A-04"; readonly startedAtMs: number; readonly firstStartedAtMs: number; readonly requestRecordRoot: LabRoot; readonly root: LabRoot }
export interface AuthorAttemptTerminal { readonly schemaVersion: "factory-model-author-attempt-terminal-v1"; readonly startRoot: LabRoot; readonly disposition: "valid" | "invalid" | "charged_terminal_stop" | "system_failure" | "identity_drift"; readonly usage: ModelUsageRecord | null; readonly requestBytesRoot: LabRoot; readonly responseBytesRoot: LabRoot; readonly sourceBytesRoot: LabRoot | null; readonly requestedModel: string; readonly reportedModel: string | null; readonly root: LabRoot }
const ordinals = (ledger: string) => readdirSync(ledger, { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^A-0[1-4]$/u.test(entry.name)).map((entry) => entry.name).sort()
const readTerminal = (ledger: string, ordinal: string): AuthorAttemptTerminal | null => { try { return JSON.parse(readFileSync(join(ledger, ordinal, "terminal.json"), "utf8")) as AuthorAttemptTerminal } catch { return null } }
export const startAuthorAttempt = (ledgerDirectory: string, allocation: FactoryAuthoringAllocation, launch: FactoryAuthorLaunchPlan, nowMs: number): Readonly<AuthorAttemptStart> => {
  const admitted = admitFactoryAuthoringAllocation(allocation); if (!Number.isSafeInteger(nowMs) || nowMs < 0) return fail("TIME")
  const ledger = resolve(ledgerDirectory); mkdirSync(ledger, { recursive: true, mode: 0o700 }); const existing = ordinals(ledger), prior = existing.map((ordinal) => readTerminal(ledger, ordinal))
  if (prior.some((item) => item === null) || prior.some((item) => item && ["valid", "charged_terminal_stop", "system_failure", "identity_drift"].includes(item.disposition)) || prior.reduce((sum, item) => sum + (item?.usage?.totalTokens ?? 0), 0) >= admitted.totalTokenCeiling || existing.length >= 4) return fail("TERMINAL")
  const firstStartedAtMs = existing.length === 0 ? nowMs : (JSON.parse(readFileSync(join(ledger, existing[0]!, "start.json"), "utf8")) as AuthorAttemptStart).firstStartedAtMs; if (nowMs - firstStartedAtMs > 1_800_000) return fail("WINDOW")
  const ordinal = admitted.attempts[existing.length]!; const directory = join(ledger, ordinal); mkdirSync(directory, { mode: 0o700 })
  const draft = { schemaVersion: "factory-model-author-attempt-start-v1" as const, allocationRoot: admitted.root, ordinal, startedAtMs: nowMs, firstStartedAtMs, requestRecordRoot: launch.requestRecordRoot }; const start = Object.freeze({ ...draft, root: labRoot("factory-model-author-attempt-start-v1", draft) })
  atomicJson(join(directory, "request.json"), launch.requestRecord); writeFileSync(join(directory, "request.stdin"), launch.stdin, { flag: "wx", mode: 0o600 }); atomicJson(join(directory, "start.json"), start); return start
}
export interface AuthorChildResult { readonly exitCode: number; readonly stdout: Uint8Array; readonly stderr: Uint8Array }
export type AuthorChild = (launch: FactoryAuthorLaunchPlan) => AuthorChildResult
const parseEvents = (bytes: Uint8Array) => { let usage: ModelUsageRecord | null = null, reportedModel: string | null = null, source: string | null = null; for (const line of new TextDecoder().decode(bytes).split(/\r?\n/u).filter(Boolean)) { const event = JSON.parse(line) as Record<string, unknown>; if (event.type === "usage" && event.usage && typeof event.usage === "object") usage = event.usage as unknown as ModelUsageRecord; if (typeof event.model === "string") reportedModel = event.model; if (event.type === "item.completed" && event.item && typeof event.item === "object") { const text = (event.item as Record<string, unknown>).text; if (typeof text === "string") { const value = JSON.parse(text) as Record<string, unknown>; if (typeof value.source === "string") source = value.source } } } return { usage, reportedModel, source } }
export const completeAuthorAttempt = (ledgerDirectory: string, start: AuthorAttemptStart, launch: FactoryAuthorLaunchPlan, child: AuthorChild): Readonly<AuthorAttemptTerminal> => {
  const directory = join(resolve(ledgerDirectory), start.ordinal), result = child(launch); writeFileSync(join(directory, "response.jsonl"), result.stdout, { flag: "wx", mode: 0o600 }); writeFileSync(join(directory, "stderr.bin"), result.stderr, { flag: "wx", mode: 0o600 })
  let parsed: ReturnType<typeof parseEvents> = { usage: null, reportedModel: null, source: null }; try { parsed = parseEvents(result.stdout) } catch { /* raw response remains retained */ }
  if (parsed.source !== null) writeFileSync(join(directory, "emitted-source.ts"), parsed.source, { flag: "wx", mode: 0o600 })
  const disposition: AuthorAttemptTerminal["disposition"] = result.exitCode !== 0 ? "system_failure" : parsed.reportedModel !== null && parsed.reportedModel !== launch.requestedModel ? "identity_drift" : assessAuthoringUsage(parsed.usage) === "charged_terminal_stop" ? "charged_terminal_stop" : parsed.source === null ? "invalid" : "valid"
  const draft = { schemaVersion: "factory-model-author-attempt-terminal-v1" as const, startRoot: start.root, disposition, usage: parsed.usage, requestBytesRoot: bytesRoot(readFileSync(join(directory, "request.stdin"))), responseBytesRoot: bytesRoot(result.stdout), sourceBytesRoot: parsed.source === null ? null : bytesRoot(parsed.source), requestedModel: launch.requestedModel, reportedModel: parsed.reportedModel }; const terminal = Object.freeze({ ...draft, root: labRoot("factory-model-author-attempt-terminal-v1", draft) }); atomicJson(join(directory, "terminal.json"), terminal); return terminal
}

export const createIndependentSourceReviewHandoff = (allocation: FactoryAuthoringAllocation) => Object.freeze({ status: "source_ready_for_independent_review" as const, allocationRoot: admitFactoryAuthoringAllocation(allocation).root, empiricalAction: "not_authorized" as const })
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href && process.argv.includes("--help")) process.stdout.write("Usage: author-v1-38-factory-model-source --help (prepares/captures only; operator-owned launch)\n")
