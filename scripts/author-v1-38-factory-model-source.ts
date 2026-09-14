import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, symlinkSync, writeFileSync } from "node:fs"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { admitFrozenModelBundle, deriveFrozenModelBundleRoot, deriveFrozenModelRawResponseRecordRoot, deriveFrozenModelRequestRecordRoot, deriveFrozenModelResponseRoot, type FrozenModelBundleV2 } from "../packages/strategy-oracle-model/src/bundle.js"
import { assertModelSourceClosure } from "../packages/strategy-oracle-model/src/emit.js"
import { createFactoryAppServerTransport, FactoryAppServerTurnFailure, type FactoryAppServerTransport, type FactoryAppServerTransportOptions, type FactoryAppServerTurnResult } from "./v1-38-factory-app-server-transport.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code: string): never => { throw new TypeError(`FACTORY_AUTHOR_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const bytesRoot = (value: Uint8Array | string): LabRoot => `sha256:${createHash("sha256").update(value).digest("hex")}` as LabRoot
const atomicJson = (path: string, value: unknown) => { const tmp = `${path}.tmp-${process.pid}`; writeFileSync(tmp, `${JSON.stringify(value)}\n`, { flag: "wx", mode: 0o600 }); renameSync(tmp, path) }

// Pure allocation declarations are shared with the data-only runner; it must
// not import this module's authoring process capability.
import { admitFactoryAuthoringAllocation, createFactoryAuthoringAllocation, FACTORY_SOURCE_RECIPES, FACTORY_DISABLED_AUTHOR_FEATURES as FEATURES, factoryAuthoringRequestPolicyRoot, type FactoryAuthoringAllocation } from "./v1-38-factory-allocation.js"
export { admitFactoryAuthoringAllocation, createFactoryAuthoringAllocation, FACTORY_SOURCE_RECIPES, type FactoryAuthoringAllocation, type FactorySourceSlot } from "./v1-38-factory-allocation.js"

export interface ModelUsageRecord { readonly inputTokens: number; readonly outputTokens: number; readonly cachedInputTokens: number; readonly totalTokens: number }
export const assessAuthoringUsage = (usage: ModelUsageRecord | null): "within_ceiling" | "charged_terminal_stop" => !usage || ![usage.inputTokens, usage.outputTokens, usage.cachedInputTokens, usage.totalTokens].every(Number.isSafeInteger) || usage.inputTokens < 0 || usage.outputTokens < 0 || usage.cachedInputTokens < 0 || usage.cachedInputTokens > usage.inputTokens || usage.totalTokens !== usage.inputTokens + usage.outputTokens || usage.totalTokens > 50_000 ? "charged_terminal_stop" : "within_ceiling"

export interface AuthoringCapability { readonly codexExecutable: string; readonly codexVersion: string; readonly execHelp: string; readonly appServerHelp: string; readonly featureList: string }
export const inspectAuthoringCapability = (input: AuthoringCapability) => {
  const clientVersion = input.codexVersion.trim(), names = new Set(input.featureList.split(/\r?\n/u).map((line) => line.trim().split(/\s+/u)[0]).filter(Boolean))
  const help = ["--model", "--sandbox", "--cd", "--skip-git-repo-check", "--ephemeral", "--ignore-user-config", "--json", "instructions are read from stdin"]
  const requiredFeatures = FEATURES.filter((feature) => !(clientVersion === "codex-cli 0.154.0" && feature === "imagegenext"))
  return Object.freeze({ available: isAbsolute(input.codexExecutable) && /^codex-cli\s+\d+\.\d+\.\d+$/u.test(clientVersion) && help.every((flag) => input.execHelp.includes(flag)) && ["--stdio", "--strict-config", "--disable"].every((flag) => input.appServerHelp.includes(flag)) && requiredFeatures.every((feature) => names.has(feature)), codexExecutable: input.codexExecutable, clientVersion, disabledFeatures: Object.freeze([...FEATURES]) })
}
export interface FactoryAuthorLaunchPlan { readonly status: "ready"; readonly cwd: string; readonly argv: readonly string[]; readonly env: Readonly<Record<string, string>>; readonly stdin: string; readonly packetPath: string; readonly packetRoot: LabRoot; readonly requestedModel: string; readonly requestRecord: Readonly<Record<string, unknown>>; readonly requestRecordRoot: LabRoot }
export interface FrozenAuthorSettings { readonly providerId: string; readonly settingsRoot: LabRoot; readonly promptRoot: LabRoot; readonly contextRoot: LabRoot; readonly budgetRoot: LabRoot; readonly runtimeProfileRoot: LabRoot; readonly predecessorRoot: LabRoot; readonly correctionRoot: LabRoot | null; readonly retryParentRoot: LabRoot | null }
const outsideRepository = (path: string): boolean => {
  let current = path
  for (;;) { if (existsSync(join(current, ".git"))) return false; const parent = dirname(current); if (parent === current) return true; current = parent }
}
export const buildFactoryAuthorCommand = (allocation: FactoryAuthoringAllocation, input: Readonly<{ packetBytes: Uint8Array; packetRoot: LabRoot; disclosedDirectory: string; model: string; capability: AuthoringCapability; frozenSettings: FrozenAuthorSettings; codePath?: string; authHome?: string }>): Readonly<FactoryAuthorLaunchPlan> | Readonly<{ status: "authoring_context_capability_unavailable" }> => {
  const admitted = admitFactoryAuthoringAllocation(allocation), capability = inspectAuthoringCapability(input.capability)
  if (!capability.available || !isRoot(input.packetRoot) || bytesRoot(input.packetBytes) !== input.packetRoot || !/^[-a-zA-Z0-9_.:]+$/u.test(input.model) || !/^[a-z][a-z0-9-]{0,95}$/u.test(input.frozenSettings.providerId) || ![input.frozenSettings.settingsRoot, input.frozenSettings.promptRoot, input.frozenSettings.contextRoot, input.frozenSettings.budgetRoot, input.frozenSettings.runtimeProfileRoot, input.frozenSettings.predecessorRoot].every(isRoot) || ![input.frozenSettings.correctionRoot, input.frozenSettings.retryParentRoot].every((value) => value === null || isRoot(value))) return Object.freeze({ status: "authoring_context_capability_unavailable" as const })
  const controlledRoot = resolve(input.disclosedDirectory); if (!existsSync(controlledRoot)) mkdirSync(controlledRoot, { mode: 0o700 }); if (lstatSync(controlledRoot).isSymbolicLink() || readdirSync(controlledRoot).length !== 0) return fail("DISCLOSED_DIRECTORY_NOT_EMPTY")
  const canonicalRoot = realpathSync(controlledRoot); if (!outsideRepository(canonicalRoot)) return fail("DISCLOSED_DIRECTORY_REPOSITORY")
  const cwd = realpathSync(mkdtempSync(join(canonicalRoot, "author-"))); if (!outsideRepository(cwd)) return fail("DISCLOSED_DIRECTORY_REPOSITORY")
  const packetPath = join(cwd, "admitted-packet.json"); writeFileSync(packetPath, input.packetBytes, { flag: "wx", mode: 0o400 })
  const argv = [capability.codexExecutable, "app-server", "--stdio", "--strict-config", ...capability.disabledFeatures.flatMap((feature) => ["--disable", feature])]
  const stdin = `Author deterministic TypeScript using only this admitted packet. Do not request tools, files, network, or host context. Return one JSON object with a source string.\n<admitted-packet root="${input.packetRoot}">\n${new TextDecoder().decode(input.packetBytes)}\n</admitted-packet>\n`
  const env: Record<string, string> = { PATH: input.codePath ?? "/usr/bin:/bin:/usr/sbin:/sbin", LANG: "C.UTF-8", LC_ALL: "C.UTF-8" }; if (input.authHome) env.CODEX_HOME = resolve(input.authHome)
  const requestRecord = Object.freeze({ schemaVersion: "factory-model-author-request-v1", allocationRoot: admitted.root, packetRoot: input.packetRoot, requestedModel: input.model, codexExecutable: capability.codexExecutable, clientVersion: capability.clientVersion, clientSettings: argv.slice(2), launchEnvironment: env, frozenSettings: input.frozenSettings, recipes: FACTORY_SOURCE_RECIPES, context: stdin, cwd, cwdClass: "fresh-disclosed-packet-only-outside-repository" })
  return Object.freeze({ status: "ready", cwd, argv: Object.freeze(argv), env: Object.freeze(env), stdin, packetPath, packetRoot: input.packetRoot, requestedModel: input.model, requestRecord, requestRecordRoot: labRoot("factory-model-author-request-v1", requestRecord) })
}

export interface AuthorAttemptStart { readonly schemaVersion: "factory-model-author-attempt-start-v1"; readonly allocationRoot: LabRoot; readonly ordinal: "A-01" | "A-02" | "A-03" | "A-04"; readonly startedAtMs: number; readonly firstStartedAtMs: number; readonly requestRecordRoot: LabRoot; readonly root: LabRoot }
export interface AuthorAttemptTerminal { readonly schemaVersion: "factory-model-author-attempt-terminal-v1"; readonly startRoot: LabRoot; readonly disposition: "valid" | "invalid" | "charged_terminal_stop" | "system_failure" | "identity_drift"; readonly usage: ModelUsageRecord | null; readonly elapsedMilliseconds: number; readonly requestBytesRoot: LabRoot; readonly responseBytesRoot: LabRoot; readonly sourceBytesRoot: LabRoot | null; readonly requestedModel: string; readonly reportedModel: string | null; readonly root: LabRoot }
const ordinals = (ledger: string) => readdirSync(ledger, { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^A-0[1-4]$/u.test(entry.name)).map((entry) => entry.name).sort()
const parseJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T
const validateStart = (value: AuthorAttemptStart, allocation: FactoryAuthoringAllocation, ordinal: string, requestRoot: LabRoot) => { const { root, ...draft } = value; if (value.schemaVersion !== "factory-model-author-attempt-start-v1" || value.allocationRoot !== allocation.root || value.ordinal !== ordinal || value.requestRecordRoot !== requestRoot || !Number.isSafeInteger(value.startedAtMs) || !Number.isSafeInteger(value.firstStartedAtMs) || root !== labRoot("factory-model-author-attempt-start-v1", draft)) return fail("LEDGER_START"); return value }
const validateTerminal = (directory: string, value: AuthorAttemptTerminal, start: AuthorAttemptStart) => { const { root, ...draft } = value; const response = readFileSync(join(directory, "response.jsonl")), source = value.sourceBytesRoot === null ? null : readFileSync(join(directory, "emitted-source.ts")); if (value.startRoot !== start.root || root !== labRoot("factory-model-author-attempt-terminal-v1", draft) || value.requestBytesRoot !== bytesRoot(readFileSync(join(directory, "request.stdin"))) || value.responseBytesRoot !== bytesRoot(response) || (source === null ? value.sourceBytesRoot !== null : value.sourceBytesRoot !== bytesRoot(source))) return fail("LEDGER_TERMINAL"); return value }
const readLedger = (ledger: string, allocation: FactoryAuthoringAllocation, launch: FactoryAuthorLaunchPlan) => ordinals(ledger).map((ordinal, index) => { if (ordinal !== allocation.attempts[index]) return fail("LEDGER_ORDINAL"); const directory = join(ledger, ordinal), request = parseJson<Record<string, unknown>>(join(directory, "request.json")); const requestRoot = labRoot("factory-model-author-request-v1", request); if (factoryAuthoringRequestPolicyRoot(request) !== factoryAuthoringRequestPolicyRoot(launch.requestRecord) || request.allocationRoot !== allocation.root || request.packetRoot !== launch.packetRoot || request.requestedModel !== launch.requestedModel || request.clientVersion !== launch.requestRecord.clientVersion) return fail("LEDGER_BINDING"); const start = validateStart(parseJson<AuthorAttemptStart>(join(directory, "start.json")), allocation, ordinal, requestRoot); let terminal: AuthorAttemptTerminal | null = null; try { terminal = validateTerminal(directory, parseJson<AuthorAttemptTerminal>(join(directory, "terminal.json")), start) } catch (error) { if (!(error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT")) throw error } return { start, terminal } })
export type AuthorClock = () => number
export const startAuthorAttempt = (ledgerDirectory: string, allocation: FactoryAuthoringAllocation, launch: FactoryAuthorLaunchPlan, clock: AuthorClock = Date.now): Readonly<AuthorAttemptStart> => {
  const admitted = admitFactoryAuthoringAllocation(allocation), nowMs = clock(); if (!Number.isSafeInteger(nowMs) || nowMs < 0) return fail("TIME")
  const ledger = resolve(ledgerDirectory); mkdirSync(ledger, { recursive: true, mode: 0o700 }); const prior = readLedger(ledger, admitted, launch)
  if (prior.some((item) => item.terminal === null) || prior.some((item) => item.terminal && ["valid", "charged_terminal_stop", "system_failure", "identity_drift"].includes(item.terminal.disposition)) || prior.reduce((sum, item) => sum + (item.terminal?.usage?.totalTokens ?? 0), 0) >= admitted.totalTokenCeiling || prior.length >= 4) return fail("TERMINAL")
  const firstStartedAtMs = prior.length === 0 ? nowMs : prior[0]!.start.firstStartedAtMs; if (nowMs - firstStartedAtMs >= 1_800_000) return fail("WINDOW")
  const ordinal = admitted.attempts[prior.length]!; const directory = join(ledger, ordinal); mkdirSync(directory, { mode: 0o700 })
  const draft = { schemaVersion: "factory-model-author-attempt-start-v1" as const, allocationRoot: admitted.root, ordinal, startedAtMs: nowMs, firstStartedAtMs, requestRecordRoot: launch.requestRecordRoot }; const start = Object.freeze({ ...draft, root: labRoot("factory-model-author-attempt-start-v1", draft) })
  atomicJson(join(directory, "request.json"), launch.requestRecord); writeFileSync(join(directory, "request.stdin"), launch.stdin, { flag: "wx", mode: 0o600 }); atomicJson(join(directory, "start.json"), start); return start
}
export interface AuthorChildResult { readonly exitCode: number; readonly stdout: Uint8Array; readonly stderr: Uint8Array; readonly admitted?: Readonly<{ reportedModel: string; usage: ModelUsageRecord | null; source: string | null; validEnvelope: boolean }>; readonly elapsedMilliseconds?: number }
export type AuthorChild = (launch: FactoryAuthorLaunchPlan, timeoutMs: number) => AuthorChildResult
const parseEvents = (bytes: Uint8Array) => { let usage: ModelUsageRecord | null = null, reportedModel: string | null = null, source: string | null = null, turnsStarted = 0, turnsCompleted = 0, finals = 0; let forbidden = false
  for (const line of new TextDecoder().decode(bytes).split(/\r?\n/u).filter(Boolean)) { const event = JSON.parse(line) as Record<string, unknown>; if (event.type === "thread.started" && typeof event.model === "string") { if (reportedModel !== null && reportedModel !== event.model) forbidden = true; reportedModel = event.model } else if (event.type === "turn.started") turnsStarted += 1; else if (event.type === "turn.completed") { turnsCompleted += 1; const raw = event.usage as Record<string, unknown> | undefined; if (!raw || ![raw.input_tokens, raw.cached_input_tokens, raw.output_tokens, raw.reasoning_output_tokens].every(Number.isSafeInteger) || Number(raw.reasoning_output_tokens) < 0 || Number(raw.reasoning_output_tokens) > Number(raw.output_tokens)) forbidden = true; else usage = { inputTokens: Number(raw.input_tokens), cachedInputTokens: Number(raw.cached_input_tokens), outputTokens: Number(raw.output_tokens), totalTokens: Number(raw.input_tokens) + Number(raw.output_tokens) } } else if (event.type === "turn.failed" || event.type === "error") forbidden = true; else if (typeof event.type === "string" && event.type.startsWith("item.")) { const item = event.item as Record<string, unknown> | undefined, itemType = item?.type; if (itemType === "reasoning") continue; if (itemType !== "agent_message") forbidden = true; else if (event.type === "item.completed") { finals += 1; if (typeof item?.text === "string") { try { const value = JSON.parse(item.text) as Record<string, unknown>; if (Object.keys(value).length === 1 && typeof value.source === "string") source = value.source } catch { /* correction-eligible invalid source */ } } } } }
  return { usage, reportedModel, source, validEnvelope: !forbidden && turnsStarted === 1 && turnsCompleted === 1 && finals === 1 }
}
export const completeAuthorAttempt = (ledgerDirectory: string, start: AuthorAttemptStart, launch: FactoryAuthorLaunchPlan, child: AuthorChild, clock: AuthorClock = Date.now): Readonly<AuthorAttemptTerminal> => {
  const ledger = resolve(ledgerDirectory), directory = join(ledger, start.ordinal), validated = readLedger(ledger, createFactoryAuthoringAllocation(), launch).find((entry) => entry.start.root === start.root); if (!validated || validated.terminal !== null) return fail("INVOCATION")
  const before = clock(), remaining = 1_800_000 - (before - start.firstStartedAtMs); if (!Number.isSafeInteger(before) || remaining <= 0) return fail("WINDOW")
  atomicJson(join(directory, "invocation.json"), { schemaVersion: "factory-model-author-invocation-v1", startRoot: start.root, timeoutMs: remaining })
  let result: AuthorChildResult; try { result = child(launch, remaining) } catch (error) { result = { exitCode: 1, stdout: new Uint8Array(), stderr: new TextEncoder().encode(error instanceof Error ? error.message : String(error)) } }
  const after = clock(), elapsedMilliseconds = result.elapsedMilliseconds ?? Math.max(0, after - before); writeFileSync(join(directory, "response.jsonl"), result.stdout, { flag: "wx", mode: 0o600 }); writeFileSync(join(directory, "stderr.bin"), result.stderr, { flag: "wx", mode: 0o600 })
  let parsed: ReturnType<typeof parseEvents> = { usage: null, reportedModel: null, source: null, validEnvelope: false }; try { parsed = parseEvents(result.stdout) } catch { /* raw response remains retained */ }
  if (result.admitted) parsed = result.admitted
  if (parsed.source !== null) { try { assertModelSourceClosure(parsed.source) } catch { parsed = { ...parsed, source: null } } }
  if (parsed.source !== null) writeFileSync(join(directory, "emitted-source.ts"), parsed.source, { flag: "wx", mode: 0o600 })
  const disposition: AuthorAttemptTerminal["disposition"] = result.exitCode !== 0 || elapsedMilliseconds >= remaining ? "system_failure" : parsed.reportedModel !== null && parsed.reportedModel !== launch.requestedModel ? "identity_drift" : parsed.reportedModel === null || !parsed.validEnvelope || assessAuthoringUsage(parsed.usage) === "charged_terminal_stop" ? "charged_terminal_stop" : parsed.source === null ? "invalid" : "valid"
  const draft = { schemaVersion: "factory-model-author-attempt-terminal-v1" as const, startRoot: start.root, disposition, usage: parsed.usage, elapsedMilliseconds, requestBytesRoot: bytesRoot(readFileSync(join(directory, "request.stdin"))), responseBytesRoot: bytesRoot(result.stdout), sourceBytesRoot: parsed.source === null ? null : bytesRoot(parsed.source), requestedModel: launch.requestedModel, reportedModel: parsed.reportedModel }; const terminal = Object.freeze({ ...draft, root: labRoot("factory-model-author-attempt-terminal-v1", draft) }); atomicJson(join(directory, "terminal.json"), terminal); return terminal
}

/** Reopens retained bytes and creates the exact V2 value consumed by model packet ingestion. */
export const createFrozenModelBundleV2FromAuthorAttempt = (ledgerDirectory: string, allocation: FactoryAuthoringAllocation, launch: FactoryAuthorLaunchPlan, start: AuthorAttemptStart): Readonly<FrozenModelBundleV2> => {
  const ledger = resolve(ledgerDirectory), entry = readLedger(ledger, admitFactoryAuthoringAllocation(allocation), launch).find((item) => item.start.root === start.root)
  if (!entry?.terminal || entry.terminal.disposition !== "valid" || !entry.terminal.usage || entry.terminal.reportedModel === null) return fail("BUNDLE_TERMINAL")
  let cleanup: Record<string, unknown>
  try { cleanup = parseJson<Record<string, unknown>>(join(ledger, start.ordinal, "process-cleanup.json")) } catch { return fail("BUNDLE_CLEANUP") }
  const cleanupRoot = cleanup.root, cleanupDraft = Object.fromEntries(Object.entries(cleanup).filter(([key]) => key !== "root"))
  if (cleanup.schemaVersion !== "factory-model-author-process-cleanup-v1" || cleanup.startRoot !== start.root || !["already_exited", "sigterm", "sigkill"].includes(String(cleanup.disposition)) || cleanupRoot !== labRoot("factory-model-author-process-cleanup-v1", cleanupDraft)) return fail("BUNDLE_CLEANUP")
  const directory = join(ledger, start.ordinal), bodyUtf8 = readFileSync(join(directory, "request.stdin"), "utf8"), rawBodyUtf8 = readFileSync(join(directory, "response.jsonl"), "utf8"), source = readFileSync(join(directory, "emitted-source.ts"), "utf8")
  const settings = launch.requestRecord.frozenSettings as unknown as FrozenAuthorSettings, clientVersion = launch.requestRecord.clientVersion
  if (typeof clientVersion !== "string") return fail("BUNDLE_CLIENT")
  const requestRecordValue = { byteLength: new TextEncoder().encode(bodyUtf8).byteLength, encoding: "utf8" as const, bodyUtf8 }, requestRecord = { ...requestRecordValue, root: deriveFrozenModelRequestRecordRoot(requestRecordValue) }
  const rawResponseValue = { format: "codex-exec-json" as const, bodyUtf8: rawBodyUtf8 }, rawResponseRecord = { ...rawResponseValue, root: deriveFrozenModelRawResponseRecordRoot(rawResponseValue) }
  const responseValue = { format: "explicit-typescript-source" as const, source }, response = { ...responseValue, root: deriveFrozenModelResponseRoot(responseValue) }, sourceRoot = bytesRoot(source)
  const usage = entry.terminal.usage, provider = { providerId: settings.providerId, modelId: entry.terminal.reportedModel, modelVersion: null, settingsRoot: settings.settingsRoot, promptRoot: settings.promptRoot, contextRoot: settings.contextRoot, servingSnapshot: { availability: "unavailable" as const } }
  const value = { schemaVersion: "frozen-model-bundle-v2" as const, privacy: "private_offline" as const, provider, request: { root: requestRecord.root, byteLength: requestRecord.byteLength, encoding: requestRecord.encoding }, response, source: { root: sourceRoot, sha256: sourceRoot, byteLength: new TextEncoder().encode(source).byteLength, encoding: "utf8" as const }, accounting: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, tokenLimit: allocation.perAttemptTokenCeiling, elapsedMilliseconds: entry.terminal.elapsedMilliseconds, resourceRoot: labRoot("factory-model-author-resource-v1", { usage, elapsedMilliseconds: entry.terminal.elapsedMilliseconds }) }, attempt: { attemptRoot: start.root, budgetRoot: settings.budgetRoot, ordinal: Number(start.ordinal.slice(-2)) }, nativeLane: { language: "typescript" as const, providerId: settings.providerId, runtimeAbi: "strategy-runtime-abi-v1.19" as const, runtimeProfileRoot: settings.runtimeProfileRoot, translation: "none" as const }, lineage: { predecessorRoot: settings.predecessorRoot, correctionRoot: settings.correctionRoot, retryParentRoot: settings.retryParentRoot }, provenance: { requestedModelId: launch.requestedModel, reportedModelId: entry.terminal.reportedModel, client: { version: clientVersion, settingsRoot: settings.settingsRoot }, servingSnapshot: { availability: "unavailable" as const }, requestRecordRoot: requestRecord.root, responseRecordRoot: rawResponseRecord.root, requestRecord, rawResponseRecord, actualUsage: usage } }
  return admitFrozenModelBundle({ ...value, root: deriveFrozenModelBundleRoot(value) }) as Readonly<FrozenModelBundleV2>
}

export interface AppServerAuthorAttemptInput { readonly allocation: FactoryAuthoringAllocation; readonly packetBytes: Uint8Array; readonly packetRoot: LabRoot; readonly disclosedDirectory: string; readonly stateDirectory: string; readonly existingAuthFile: string; readonly ledgerDirectory: string; readonly model: string; readonly modelProvider: string; readonly frozenSettings: FrozenAuthorSettings; readonly capability: AuthoringCapability; readonly clock?: AuthorClock; readonly transportFactory?: (options: FactoryAppServerTransportOptions) => Promise<FactoryAppServerTransport> }
/** Operational two-stage path: app-server negotiates exact identity/context before the charged turn starts. */
export const runFactoryAppServerAuthorAttempt = async (input: AppServerAuthorAttemptInput): Promise<Readonly<{ start: AuthorAttemptStart; terminal: AuthorAttemptTerminal; bundle: Readonly<FrozenModelBundleV2> | null }>> => {
  if (!isAbsolute(input.capability.codexExecutable)) return fail("CAPABILITY_EXECUTABLE")
  const canonicalExecutable = realpathSync(input.capability.codexExecutable)
  const capability = Object.freeze({ ...input.capability, codexExecutable: canonicalExecutable })
  const clock = input.clock ?? Date.now, stateDirectory = resolve(input.stateDirectory); mkdirSync(stateDirectory, { mode: 0o700 }); if (readdirSync(stateDirectory).length !== 0 || !lstatSync(resolve(input.existingAuthFile)).isFile()) return fail("AUTH_BINDING")
  writeFileSync(join(stateDirectory, "config.toml"), `model = ${JSON.stringify(input.model)}\napproval_policy = "never"\nsandbox_mode = "read-only"\n`, { flag: "wx", mode: 0o600 }); symlinkSync(resolve(input.existingAuthFile), join(stateDirectory, "auth.json"))
  const launch = buildFactoryAuthorCommand(input.allocation, { packetBytes: input.packetBytes, packetRoot: input.packetRoot, disclosedDirectory: input.disclosedDirectory, model: input.model, capability, frozenSettings: input.frozenSettings, authHome: stateDirectory })
  if (launch.status !== "ready") return fail("CAPABILITY")
  const transport = await (input.transportFactory ?? createFactoryAppServerTransport)({ codexExecutable: canonicalExecutable, codexHome: stateDirectory, cwd: launch.cwd, env: launch.env, requestedModel: input.model, requestedProvider: input.modelProvider, timeoutMs: input.allocation.windowMinutes * 60_000 })
  let started: AuthorAttemptStart | null = null, terminal: AuthorAttemptTerminal | null = null
  try {
    const start = startAuthorAttempt(input.ledgerDirectory, input.allocation, launch, clock), before = clock(); started = start
    let observed: FactoryAppServerTurnResult
    const remaining = input.allocation.windowMinutes * 60_000 - Math.max(0, before - start.firstStartedAtMs)
    try { observed = await transport.startTurn(launch.stdin, remaining) } catch (error) {
      const after = clock()
      terminal = completeAuthorAttempt(input.ledgerDirectory, start, launch, () => error instanceof FactoryAppServerTurnFailure
        ? { exitCode: 1, stdout: error.evidence.rawJsonl, stderr: new TextEncoder().encode(error.message), elapsedMilliseconds: Math.max(0, after - before), admitted: { reportedModel: error.evidence.reportedModel, usage: error.evidence.usage ? { inputTokens: error.evidence.usage.inputTokens, outputTokens: error.evidence.usage.outputTokens, cachedInputTokens: error.evidence.usage.cachedInputTokens, totalTokens: error.evidence.usage.totalTokens } : null, source: null, validEnvelope: false } }
        : { exitCode: 1, stdout: new Uint8Array(), stderr: new TextEncoder().encode(error instanceof Error ? error.message : String(error)), elapsedMilliseconds: Math.max(0, after - before) }, clock)
      observed = null as never
    }
    if (terminal === null) {
      const after = clock(); let source = ""; try { const sourceValue = JSON.parse(observed.sourceMessage) as Record<string, unknown>; if (Object.keys(sourceValue).length === 1 && typeof sourceValue.source === "string") source = sourceValue.source } catch { /* retained as correction-eligible invalid output */ }
      const usage: ModelUsageRecord = { inputTokens: observed.usage.inputTokens, outputTokens: observed.usage.outputTokens, cachedInputTokens: observed.usage.cachedInputTokens, totalTokens: observed.usage.totalTokens }
      terminal = completeAuthorAttempt(input.ledgerDirectory, start, launch, () => ({ exitCode: 0, stdout: observed.rawJsonl, stderr: new Uint8Array(), elapsedMilliseconds: Math.max(0, after - before), admitted: { reportedModel: observed.reportedModel, usage, source, validEnvelope: true } }), clock)
    }
  } finally {
    if (started) {
      let disposition: "already_exited" | "sigterm" | "sigkill" | "failed_to_exit"
      try { disposition = await transport.close() } catch (error) {
        disposition = "failed_to_exit"
        const draft = { schemaVersion: "factory-model-author-process-cleanup-v1" as const, startRoot: started.root, disposition }; atomicJson(join(resolve(input.ledgerDirectory), started.ordinal, "process-cleanup.json"), { ...draft, root: labRoot("factory-model-author-process-cleanup-v1", draft) })
        throw error
      }
      const draft = { schemaVersion: "factory-model-author-process-cleanup-v1" as const, startRoot: started.root, disposition }; atomicJson(join(resolve(input.ledgerDirectory), started.ordinal, "process-cleanup.json"), { ...draft, root: labRoot("factory-model-author-process-cleanup-v1", draft) })
    } else await transport.close()
  }
  if (!started || !terminal) return fail("ATTEMPT_RESULT")
  return Object.freeze({ start: started, terminal, bundle: terminal.disposition === "valid" ? createFrozenModelBundleV2FromAuthorAttempt(input.ledgerDirectory, input.allocation, launch, started) : null })
}

export const createIndependentSourceReviewHandoff = (allocation: FactoryAuthoringAllocation) => Object.freeze({ status: "source_ready_for_independent_review" as const, allocationRoot: admitFactoryAuthoringAllocation(allocation).root, empiricalAction: "not_authorized" as const })

const argument = (name: string) => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1] }
const commandOutput = (command: string, args: readonly string[]) => { const result = spawnSync(command, args, { encoding: "utf8", timeout: 5_000, maxBuffer: 1_048_576, env: { PATH: process.env.PATH ?? "/usr/bin:/bin:/usr/sbin:/sbin", LANG: "C.UTF-8", LC_ALL: "C.UTF-8" } }); if (result.status !== 0 || result.error) return fail("CAPABILITY_COMMAND"); return result.stdout }
const main = async () => {
  if (process.argv.includes("--help")) { process.stdout.write("Usage: author-v1-38-factory-model-source --run-attempt --allocation <json> --packet <json> --packet-root <sha256> --disclosed-directory <new-dir> --state-directory <new-dir> --auth-file <existing-auth.json> --ledger <dir> --model <exact-id> --model-provider <id> --settings <json>\n"); return }
  if (!process.argv.includes("--run-attempt")) return fail("COMMAND")
  const allocationPath = argument("--allocation"), packetPath = argument("--packet"), packetRoot = argument("--packet-root"), disclosedDirectory = argument("--disclosed-directory"), stateDirectory = argument("--state-directory"), authFile = argument("--auth-file"), ledger = argument("--ledger"), model = argument("--model"), modelProvider = argument("--model-provider"), settingsPath = argument("--settings")
  if (!allocationPath || !packetPath || !packetRoot || !disclosedDirectory || !stateDirectory || !authFile || !ledger || !model || !modelProvider || !settingsPath) return fail("ARGUMENTS")
  const allocation = admitFactoryAuthoringAllocation(JSON.parse(readFileSync(resolve(allocationPath), "utf8"))), packetBytes = readFileSync(resolve(packetPath))
  const codexExecutable = realpathSync(commandOutput("/usr/bin/which", ["codex"]).trim())
  const capability = { codexExecutable, codexVersion: commandOutput(codexExecutable, ["--version"]), execHelp: commandOutput(codexExecutable, ["exec", "--help"]), appServerHelp: commandOutput(codexExecutable, ["app-server", "--help"]), featureList: commandOutput(codexExecutable, ["features", "list"]) }, frozenSettings = JSON.parse(readFileSync(resolve(settingsPath), "utf8")) as FrozenAuthorSettings
  const result = await runFactoryAppServerAuthorAttempt({ allocation, packetBytes, packetRoot: packetRoot as LabRoot, disclosedDirectory, stateDirectory, existingAuthFile: authFile, ledgerDirectory: ledger, model, modelProvider, frozenSettings, capability })
  process.stdout.write(`${JSON.stringify({ startRoot: result.start.root, terminalRoot: result.terminal.root, disposition: result.terminal.disposition, bundleRoot: result.bundle?.root ?? null })}\n`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) void main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 })
