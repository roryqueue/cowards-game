import { CANONICAL_ARENA_CATALOG_V1_37, SoldierBrainInputV119Schema, StrategyInputV119Schema } from "@cowards/spec"
import { createInitialGameState, createSoldierBrainInputV119, createStrategyInputV119, MATCH_KERNEL } from "../packages/engine/src/index.js"
import { LAB_ADMITTED_ROOTS, freezeLabValue, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { buildStrategyRevision } from "../packages/runtime-js/src/revision.js"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { admitFactory, authorizeFactorySupervision } from "../packages/strategy-lab/src/factory/admission.js"
import { readLeanBaselineSource } from "./lib/v1-38-lean-baseline-source.js"
import { createFactorySupervisedRuntime } from "./lib/v1-38-factory-supervised-runtime.js"
import { LEAN_PRIVATE_PROBE_COST_ROOT, authenticateLeanPrivateProbeCostV1, observeLeanPrivateProbeResourcesV1, observeLeanPrivateProbeCapacityV1, openLeanPrivateProbeAdmissionV1, recordAndIssueLeanPrivateProbeRuntimeAuthorityV1, type LeanPrivateProbeAllocationV1 } from "./lib/v1-38-lean-experiment-authority.js"
import { closeSync, constants, fsyncSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, statfsSync, writeSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { dirname, join, resolve } from "node:path"
import { performance } from "node:perf_hooks"
import { pathToFileURL } from "node:url"
import { leanBytesRoot, leanCanonicalBytes } from "../packages/strategy-lab/src/league/lean-experiment.js"

export type LeanPrivateProbeMethodV1 = "selectActivations" | "soldierBrain"
export interface LeanPrivateProbeCaseV1 {
  readonly ordinal: number
  readonly caseId: string
  readonly method: LeanPrivateProbeMethodV1
  readonly sourceRoot: LabRoot
  readonly executableRoot: LabRoot
  readonly requestRoot: LabRoot
  readonly inputRoot: LabRoot
  readonly image: string
  readonly tupleId: string
  readonly tupleRoot: LabRoot
  readonly runtimeLimitsRoot: LabRoot
}
export interface LeanPrivateProbeScheduleV1 {
  readonly schemaVersion: "lean-private-probe-allocation-v1"
  readonly sourceHead: string
  readonly matchCount: 0
  readonly cases: readonly LeanPrivateProbeCaseV1[]
  readonly sourceRoot: LabRoot
  readonly executableRoot: LabRoot
  readonly image: string
  readonly tupleId: string
  readonly tupleRoot: LabRoot
  readonly runtimeLimitsRoot: LabRoot
  readonly costSnapshotRoot: LabRoot
  readonly ceilings: Readonly<{ guestMs: 1000; hostMs: 5000; startupMs: 2500; matchMs: 600000 }>
  readonly root: LabRoot
}
export interface LeanPrivateProbeResultV1 {
  readonly schemaVersion: "lean-private-probe-result-v1"
  readonly allocationRoot: LabRoot
  readonly sourceHead: string
  readonly matchCount: 0
  readonly attemptedOrdinals: readonly number[]
  readonly outcomes: readonly Readonly<{ ordinal: number; status: "success" | "strategy_timeout" | "system_failure" | "unknown"; cleanupComplete: boolean; inputRoot: LabRoot; requestRoot: LabRoot }>[]
  readonly root: LabRoot
}
export type LeanPrivateProbeCommandV1 =
  | Readonly<{ command: "prepare"; sourceStore: string; sourceRoot: LabRoot; store: string; sourceHead: string; costSnapshotRoot: LabRoot }>
  | Readonly<{ command: "entry"; sourceStore: string; sourceRoot: LabRoot; store: string; allocationCommit: string; allocationPath: string }>
  | Readonly<{ command: "verify"; sourceRoot: LabRoot; store: string; allocationCommit: string; allocationPath: string }>

const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value)
const fail = (code: string): never => { throw new TypeError(code) }
const ceilings = Object.freeze({ guestMs: 1000 as const, hostMs: 5000 as const, startupMs: 2500 as const, matchMs: 600000 as const })
const privateProbeInputs = (): readonly unknown[] => {
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(value => value.id === "arena:smoke:v1")
  if (!arena) return fail("LEAN_PRIVATE_PROBE_CANONICAL_ARENA")
  const state = createInitialGameState({ matchId: "private-probe-public-observation-v1", seed: "private-probe-public-observation-v1", arenaVariant: arena, bottomPlayerId: "probe-bottom", topPlayerId: "probe-top", bottomStrategyRevisionId: "private-probe-source", topStrategyRevisionId: "private-probe-opponent" })
  const selected = state.soldiers.find(soldier => soldier.ownerPlayerId === "probe-bottom")
  if (!selected) return fail("LEAN_PRIVATE_PROBE_CANONICAL_SOLDIER")
  return [createStrategyInputV119(state, "probe-bottom"), createStrategyInputV119(state, "probe-bottom"), createSoldierBrainInputV119(state, selected.id, 0, false), createSoldierBrainInputV119(state, selected.id, 0, false)]
}

/** Strict flag parser. `sourceStore` is input-only and never aliases `store`. */
export const parseLeanPrivateProbeArgsV1 = (argv: readonly string[]): LeanPrivateProbeCommandV1 => {
  const [command, ...rest] = argv
  if (command !== "prepare" && command !== "entry" && command !== "verify" || rest.length % 2 !== 0) return fail("LEAN_PRIVATE_PROBE_ARGS")
  const flags = new Map<string, string>()
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index]!, value = rest[index + 1]!
    if (!key.startsWith("--") || key.length < 3 || !value || flags.has(key)) return fail("LEAN_PRIVATE_PROBE_ARGS")
    flags.set(key, value)
  }
  const allowed = command === "prepare" ? ["--source-store", "--source-root", "--store", "--source-head", "--cost-snapshot-root"] : command === "entry" ? ["--source-store", "--source-root", "--store", "--allocation-commit", "--allocation-path"] : ["--source-root", "--store", "--allocation-commit", "--allocation-path"]
  if (flags.size !== allowed.length || [...flags.keys()].some(key => !allowed.includes(key))) return fail("LEAN_PRIVATE_PROBE_ARGS")
  const get = (name: string) => flags.get(`--${name}`)!
  const sourceRoot = get("source-root"), store = get("store"), allocationCommit = get("allocation-commit"), allocationPath = get("allocation-path")
  if (!isRoot(sourceRoot) || !store || command !== "prepare" && (!/^[a-f0-9]{40,64}$/u.test(allocationCommit) || ![".planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json", ".planning/artifacts/v1.38-phase-265-private-probe-allocation-v2.json"].includes(allocationPath))) return fail("LEAN_PRIVATE_PROBE_ARGS")
  if (command === "prepare") {
    const sourceHead = get("source-head"), costSnapshotRoot = get("cost-snapshot-root"), sourceStore = get("source-store")
    if (!sourceStore || !/^[a-f0-9]{40,64}$/u.test(sourceHead) || !isRoot(costSnapshotRoot) || sourceStore === store) return fail("LEAN_PRIVATE_PROBE_ARGS")
    return Object.freeze({ command, sourceStore, sourceRoot, store, sourceHead, costSnapshotRoot })
  }
  const sourceStore = command === "entry" ? get("source-store") : undefined
  if (command === "entry" && (!sourceStore || sourceStore === store)) return fail("LEAN_PRIVATE_PROBE_ARGS")
  return command === "entry" ? Object.freeze({ command, sourceStore: sourceStore!, sourceRoot, store, allocationCommit, allocationPath }) : Object.freeze({ command, sourceRoot, store, allocationCommit, allocationPath })
}

const writeFileExclusive = (path: string, bytes: Uint8Array, mode: number): void => {
  const fd = openSync(path, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, mode)
  try {
    const file = fstatSync(fd)
    if (!file.isFile() || file.nlink !== 1 || (file.mode & 0o777) !== mode) return fail("LEAN_PRIVATE_PROBE_WRITE_IDENTITY")
    let offset = 0
    while (offset < bytes.byteLength) { const count = writeSync(fd, bytes, offset, bytes.byteLength - offset); if (count <= 0) return fail("LEAN_PRIVATE_PROBE_WRITE_SHORT"); offset += count }
    fsyncSync(fd)
  } finally { closeSync(fd) }
}
const readPrivateFile = (path: string, maxBytes = 65_536): Buffer => {
  const file = lstatSync(path)
  if (!file.isFile() || file.isSymbolicLink() || file.nlink !== 1 || file.uid !== (typeof process.getuid === "function" ? process.getuid() : file.uid) || (file.mode & 0o777) !== 0o600 || file.size > maxBytes || realpathSync(path) !== path) return fail("LEAN_PRIVATE_PROBE_FILE_IDENTITY")
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try { const opened = fstatSync(fd); if (opened.dev !== file.dev || opened.ino !== file.ino || opened.size !== file.size || opened.nlink !== 1 || (opened.mode & 0o777) !== 0o600) return fail("LEAN_PRIVATE_PROBE_FILE_RACE"); const bytes = readFileSync(fd); if (bytes.length !== opened.size || bytes.length > maxBytes) return fail("LEAN_PRIVATE_PROBE_FILE_SIZE"); return bytes } finally { closeSync(fd) }
}
const writeJson = (path: string, value: unknown): void => { writeFileExclusive(path, leanCanonicalBytes(value), 0o600); directorySync(dirname(path)) }
const readJson = (path: string): unknown => JSON.parse(readPrivateFile(path).toString("utf8")) as unknown
const directorySync = (path: string): void => { const fd = openSync(path, constants.O_RDONLY); try { fsyncSync(fd) } finally { closeSync(fd) } }
const capacityCheck = (path: string, began: number): Readonly<{ rssBytes: number; availableDiskBytes: number; elapsedMs: number }> => {
  observeLeanPrivateProbeResourcesV1(path)
  const rssBytes = process.memoryUsage().rss, disk = statfsSync(path), availableDiskBytes = disk.bavail * disk.bsize, elapsedMs = Math.ceil(performance.now() - began)
  if (!Number.isSafeInteger(availableDiskBytes) || rssBytes > 3_000_000_000 || availableDiskBytes < 2_000_000_000 || elapsedMs > 600_000) return fail("LEAN_PRIVATE_PROBE_CAPACITY")
  return Object.freeze({ rssBytes, availableDiskBytes, elapsedMs })
}
const allocationPathAllowed = (path: string): boolean => [".planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json", ".planning/artifacts/v1.38-phase-265-private-probe-allocation-v2.json"].includes(path)
const exactKeys = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
const nonnegative = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0
const probeRequest = (schedule: LeanPrivateProbeScheduleV1) => {
  const body = { schemaVersion: "lean-private-probe-request-v1", sourceRoot: schedule.sourceRoot, executableRoot: schedule.executableRoot, tupleRoot: schedule.tupleRoot, runtimeLimitsRoot: schedule.runtimeLimitsRoot, caseRoots: schedule.cases.map(item => ({ ordinal: item.ordinal, method: item.method, inputRoot: item.inputRoot, requestRoot: item.requestRoot })) }
  return { ...body, root: labRoot("lean-private-probe-request-v1", body) }
}
const validProbeRecord = (record: Record<string, unknown>, descriptor: LeanPrivateProbeCaseV1): boolean => exactKeys(record, ["schemaVersion", "ordinal", "caseId", "method", "sourceRoot", "executableRoot", "inputRoot", "requestRoot", "status", "charged", "evidenceVerified", "cleanupComplete", "elapsedMs", "factoryConstructionMs", "guestStartup", "rssBytes", "availableDiskBytes", "outputBytes", "root"]) && record.schemaVersion === "lean-private-probe-case-result-v1" && ["ordinal", "caseId", "method", "sourceRoot", "executableRoot", "inputRoot", "requestRoot"].every(key => record[key] === descriptor[key as keyof LeanPrivateProbeCaseV1]) && ["success", "strategy_timeout", "system_failure", "unknown"].includes(String(record.status)) && record.charged === true && typeof record.evidenceVerified === "boolean" && typeof record.cleanupComplete === "boolean" && (record.status !== "success" || record.evidenceVerified === true && record.cleanupComplete === true) && record.guestStartup === "unknown" && ["elapsedMs", "factoryConstructionMs", "rssBytes", "availableDiskBytes", "outputBytes"].every(key => nonnegative(record[key])) && Number(record.outputBytes) <= 262144

const preparePrivateProbe = (input: Extract<LeanPrivateProbeCommandV1, { command: "prepare" }>): LeanPrivateProbeScheduleV1 => {
  const source = readLeanBaselineSource(input.sourceStore, "probe")
  if (source.sourceRoot !== input.sourceRoot) return fail("LEAN_PRIVATE_PROBE_SOURCE_ROOT")
  const metadata = { ...defaultRuntimeMetadata("typescript"), adapter: { ...defaultRuntimeMetadata("typescript").adapter, id: "runtime-js-container-subprocess" as const } }
  const revision = buildStrategyRevision({ source: source.source, runtime: metadata })
  const executableRoot = `sha256:${revision.metadata.sourceArtifact?.hash ?? ""}` as LabRoot
  if (!revision.validation.valid || !revision.metadata.sourceArtifact || `sha256:${revision.sourceHash}` !== source.sourceRoot) return fail("LEAN_PRIVATE_PROBE_SOURCE_ADMISSION")
  const currentHead = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 1500, maxBuffer: 4096 }).trim()
  if (currentHead !== input.sourceHead || input.store === input.sourceStore || !allocationPathAllowed(".planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json")) return fail("LEAN_PRIVATE_PROBE_SOURCE_HEAD")
  const schedule = createLeanPrivateProbeScheduleV1({ sourceHead: input.sourceHead, sourceRoot: source.sourceRoot, executableRoot, costSnapshotRoot: input.costSnapshotRoot })
  const storePath = resolve(input.store)
  if (input.costSnapshotRoot !== LEAN_PRIVATE_PROBE_COST_ROOT) return fail("LEAN_PRIVATE_PROBE_COST_SNAPSHOT")
  observeLeanPrivateProbeResourcesV1(storePath)
  mkdirSync(storePath, { mode: 0o700 })
  if (realpathSync(storePath) !== storePath || (lstatSync(storePath).mode & 0o777) !== 0o700 || readdirSync(storePath).length !== 0) return fail("LEAN_PRIVATE_PROBE_FRESH_STORE")
  const request = probeRequest(schedule)
  writeJson(join(storePath, "request.json"), request)
  writeJson(join(storePath, "allocation.json"), schedule)
  const artifact = resolve(".planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json")
  mkdirSync(dirname(artifact), { recursive: true })
  writeFileExclusive(artifact, leanCanonicalBytes(schedule), 0o644)
  directorySync(storePath); directorySync(dirname(artifact))
  capacityCheck(storePath, performance.now())
  return schedule
}

export const executeLeanPrivateProbeEntryV1 = async (input: Extract<LeanPrivateProbeCommandV1, { command: "entry" }>): Promise<LeanPrivateProbeResultV1> => {
  const source = readLeanBaselineSource(input.sourceStore, "probe")
  if (source.sourceRoot !== input.sourceRoot || resolve(input.sourceStore) === resolve(input.store)) return fail("LEAN_PRIVATE_PROBE_SOURCE_ROOT")
  const sourceBytes = new TextEncoder().encode(source.source)
  const sourceAdmission = admitFactory({ packet: source.packet, proposal: source.proposal, sourceBytes })
  const admission = authorizeFactorySupervision({ sourceAdmission, validation: source.validation })
  const allocationBytes = readPrivateFile(join(resolve(input.store), "allocation.json"))
  const allocation = JSON.parse(allocationBytes.toString("utf8")) as LeanPrivateProbeAllocationV1
  if (!allocationPathAllowed(input.allocationPath) || allocation.sourceRoot !== source.sourceRoot || !allocationBytes.equals(leanCanonicalBytes(allocation))) return fail("LEAN_PRIVATE_PROBE_ALLOCATION")
  const storePath = resolve(input.store), began = performance.now(), firstCapacity = observeLeanPrivateProbeCapacityV1(storePath)
  const authorityAdmission = openLeanPrivateProbeAdmissionV1({ storePath, allocationCommit: input.allocationCommit, allocationPath: input.allocationPath, capacity: firstCapacity })
  const entryBody = { schemaVersion: "lean-private-probe-entry-v1", sourceHead: allocation.sourceHead, allocationRoot: allocation.root, allocationCommit: input.allocationCommit, sourceRoot: source.sourceRoot, enteredAtElapsedMs: 0 }
  const inputs = privateProbeInputs(), outcomes: LeanPrivateProbeResultV1["outcomes"][number][] = [], attemptedOrdinals: number[] = []
  let peakRssBytes = process.memoryUsage().rss, minimumAvailableDiskBytes = Number.MAX_SAFE_INTEGER
  let failureCode: "resource_or_io_failure" | null = null
  let terminalCapacity = { elapsedMs: 0, rssBytes: peakRssBytes, availableDiskBytes: 0 }
  try {
  writeJson(join(storePath, "entry.json"), { ...entryBody, root: labRoot("lean-private-probe-entry-v1", entryBody) })
  for (let ordinal = 0; ordinal < allocation.cases.length; ordinal++) {
    const descriptor = allocation.cases[ordinal]!, capacity = observeLeanPrivateProbeCapacityV1(storePath)
    const measured = capacityCheck(storePath, began)
    peakRssBytes = Math.max(peakRssBytes, measured.rssBytes); minimumAvailableDiskBytes = Math.min(minimumAvailableDiskBytes, measured.availableDiskBytes)
    attemptedOrdinals.push(ordinal)
    const authority = recordAndIssueLeanPrivateProbeRuntimeAuthorityV1(authorityAdmission, descriptor, capacity)
    let status: LeanPrivateProbeResultV1["outcomes"][number]["status"] = "unknown", evidenceVerified = false, charged = true, outputBytes = 0, cleanupComplete = false, startupMs = 0
    const callStarted = performance.now()
    let provider: ReturnType<typeof createFactorySupervisedRuntime> | undefined
    try {
      const factoryStarted = performance.now()
      provider = createFactorySupervisedRuntime({ admission, sourceBytes, attemptRoot: descriptor.requestRoot, budgetRoot: allocation.root, matchId: authority.binding.executionOwnerId, containerName: `probe-${allocation.root.slice(7, 19)}-${ordinal}`, ownershipLabel: `probe-${allocation.root.slice(7, 19)}`, image: allocation.image, privateProbeAuthority: authority, privateProbeBinding: authority.binding })
      startupMs = Math.ceil(performance.now() - factoryStarted)
      const method = descriptor.method
      const request = { kind: method, requestId: `private-probe-${ordinal}`, semanticTupleId: descriptor.tupleId, coordinates: { phaseNumber: 1, roundNumber: 1, stage: method === "selectActivations" ? "select_bottom" : "activation_cycle", ordinal }, input: inputs[ordinal] } as never
      const evidence = await provider.invoke(request, provider.identity)
      evidenceVerified = provider.verify(evidence) && evidence.charged && evidence.method === method && evidence.inputRoot === descriptor.inputRoot && evidence.identity.sourceRoot === descriptor.sourceRoot && evidence.identity.executableRoot === descriptor.executableRoot
      if (!evidenceVerified) status = "unknown"
      else if (evidence.result.ok) { status = "success"; outputBytes = evidence.outputBytes }
      else if (evidence.result.violation?.type === "TIMEOUT") status = "strategy_timeout"
      else if ("systemFailure" in evidence.result && typeof evidence.result.systemFailure.code === "string") status = "system_failure"
      else status = "unknown"
    } catch {
      status = "unknown"
    } finally {
      if (provider) { try { const closed = provider.close(); cleanupComplete = closed.cleanupComplete && !closed.orphanedChild } catch { cleanupComplete = false } }
    }
    const elapsedMs = Math.max(0, Math.ceil(performance.now() - callStarted))
    if (elapsedMs > allocation.ceilings.hostMs) status = "system_failure"
    if (!cleanupComplete) status = "system_failure"
    if (!nonnegative(outputBytes) || outputBytes > 262144) { outputBytes = 0; status = "system_failure"; evidenceVerified = false }
    const itemBody = { schemaVersion: "lean-private-probe-case-result-v1", ordinal, caseId: descriptor.caseId, method: descriptor.method, sourceRoot: descriptor.sourceRoot, executableRoot: descriptor.executableRoot, inputRoot: descriptor.inputRoot, requestRoot: descriptor.requestRoot, status, charged, evidenceVerified, cleanupComplete, elapsedMs, factoryConstructionMs: startupMs, guestStartup: "unknown", rssBytes: measured.rssBytes, availableDiskBytes: measured.availableDiskBytes, outputBytes }
    const record = { ...itemBody, root: labRoot("lean-private-probe-case-result-v1", itemBody) }
    if (!validProbeRecord(record, descriptor)) return fail("LEAN_PRIVATE_PROBE_RECORD_SCHEMA")
    outcomes.push({ ordinal, status, cleanupComplete, inputRoot: descriptor.inputRoot, requestRoot: descriptor.requestRoot })
    writeJson(join(storePath, `probe-${String(ordinal).padStart(2, "0")}.json`), record)
    const now = capacityCheck(storePath, began)
    peakRssBytes = Math.max(peakRssBytes, now.rssBytes); minimumAvailableDiskBytes = Math.min(minimumAvailableDiskBytes, now.availableDiskBytes)
    if (status !== "success" || !cleanupComplete || measured.elapsedMs > 600_000 || now.elapsedMs > 600_000) break
  }
  terminalCapacity = capacityCheck(storePath, began)
  } catch {
    failureCode = "resource_or_io_failure"
    terminalCapacity = { elapsedMs: Math.max(0, Math.ceil(performance.now() - began)), rssBytes: process.memoryUsage().rss, availableDiskBytes: 0 }
    for (const ordinal of attemptedOrdinals.slice(outcomes.length)) { const descriptor = allocation.cases[ordinal]!; outcomes.push({ ordinal, status: "unknown", cleanupComplete: false, inputRoot: descriptor.inputRoot, requestRoot: descriptor.requestRoot }) }
  }
  peakRssBytes = Math.max(peakRssBytes, terminalCapacity.rssBytes); minimumAvailableDiskBytes = Math.min(minimumAvailableDiskBytes, terminalCapacity.availableDiskBytes)
  const resultBody = { schemaVersion: "lean-private-probe-result-v1" as const, allocationRoot: allocation.root, sourceHead: allocation.sourceHead, matchCount: 0 as const, attemptedOrdinals, outcomes }
  const result = freezeLabValue({ ...resultBody, root: labRoot("lean-private-probe-result-v1", resultBody) })
  let resources: ReturnType<typeof observeLeanPrivateProbeResourcesV1> | null = null
  if (!failureCode) { try { resources = observeLeanPrivateProbeResourcesV1(storePath) } catch { failureCode = "resource_or_io_failure" } }
  const terminalBody = { schemaVersion: "lean-private-probe-terminal-v1", allocationRoot: allocation.root, attemptedCount: attemptedOrdinals.length, matchCount: 0, elapsedMs: terminalCapacity.elapsedMs, peakRssBytes, availableDiskBytes: minimumAvailableDiskBytes, cleanupComplete: outcomes.every(item => item.cleanupComplete), failureCode, resources, resultRoot: result.root }
  let persistenceFailed = false
  try { writeJson(join(storePath, "terminal.json"), { ...terminalBody, root: labRoot("lean-private-probe-terminal-v1", terminalBody) }) } catch { persistenceFailed = true }
  try { writeJson(join(storePath, "result.json"), result); directorySync(storePath) } catch { persistenceFailed = true }
  if (persistenceFailed || failureCode) return fail("LEAN_PRIVATE_PROBE_INCOMPLETE_TERMINAL")
  return result
}

export const verifyPrivateProbeStore = (input: Extract<LeanPrivateProbeCommandV1, { command: "verify" }>): Readonly<{ verified: true; resultRoot: LabRoot }> => {
  const storePath = resolve(input.store), allocationBytes = readPrivateFile(join(storePath, "allocation.json")), allocation = JSON.parse(allocationBytes.toString("utf8")) as LeanPrivateProbeScheduleV1
  if (!allocationPathAllowed(input.allocationPath) || allocation.sourceRoot !== input.sourceRoot || !allocationBytes.equals(leanCanonicalBytes(allocation))) return fail("LEAN_PRIVATE_PROBE_VERIFY_ALLOCATION")
  const expected = createLeanPrivateProbeScheduleV1({ sourceHead: allocation.sourceHead, sourceRoot: allocation.sourceRoot, executableRoot: allocation.executableRoot, costSnapshotRoot: allocation.costSnapshotRoot })
  authenticateLeanPrivateProbeCostV1()
  if (expected.root !== allocation.root || expected.root !== labRoot("lean-private-probe-allocation-v1", (({ root: _root, ...body }) => body)(allocation))) return fail("LEAN_PRIVATE_PROBE_VERIFY_SCHEDULE")
  const request = readJson(join(storePath, "request.json")) as Record<string, unknown>
  if (!readPrivateFile(join(storePath, "request.json")).equals(leanCanonicalBytes(probeRequest(expected)))) return fail("LEAN_PRIVATE_PROBE_VERIFY_REQUEST")
  if (!exactKeys(request, ["schemaVersion", "sourceRoot", "executableRoot", "tupleRoot", "runtimeLimitsRoot", "caseRoots", "root"]) || request.schemaVersion !== "lean-private-probe-request-v1" || request.sourceRoot !== allocation.sourceRoot || request.executableRoot !== allocation.executableRoot || !Array.isArray(request.caseRoots) || request.caseRoots.length !== 4) return fail("LEAN_PRIVATE_PROBE_VERIFY_REQUEST")
  const { root: requestRoot, ...requestBody } = request
  if (requestRoot !== labRoot("lean-private-probe-request-v1", requestBody)) return fail("LEAN_PRIVATE_PROBE_VERIFY_REQUEST_ROOT")
  const entry = readJson(join(storePath, "entry.json")) as Record<string, unknown>
  if (!nonnegative(entry.enteredAtElapsedMs)) return fail("LEAN_PRIVATE_PROBE_VERIFY_ENTRY")
  if (!exactKeys(entry, ["schemaVersion", "sourceHead", "allocationRoot", "allocationCommit", "sourceRoot", "enteredAtElapsedMs", "root"]) || entry.schemaVersion !== "lean-private-probe-entry-v1" || entry.allocationRoot !== allocation.root || entry.sourceRoot !== allocation.sourceRoot || entry.sourceHead !== allocation.sourceHead || entry.allocationCommit !== input.allocationCommit) return fail("LEAN_PRIVATE_PROBE_VERIFY_ENTRY")
  const { root: entryRoot, ...entryBody } = entry
  if (entryRoot !== labRoot("lean-private-probe-entry-v1", entryBody)) return fail("LEAN_PRIVATE_PROBE_VERIFY_ENTRY_ROOT")
  const commitParents = execFileSync("git", ["rev-list", "--parents", "-n", "1", input.allocationCommit], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 1500, maxBuffer: 4096 }).trim().split(/\s+/u)
  const committedAllocation = execFileSync("git", ["show", `${input.allocationCommit}:${input.allocationPath}`], { encoding: "buffer", stdio: ["ignore", "pipe", "ignore"], timeout: 1500, maxBuffer: 65_537 })
  if (commitParents.length !== 2 || commitParents[1] !== allocation.sourceHead || !Buffer.from(committedAllocation).equals(allocationBytes) || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 1500, maxBuffer: 4096 }).trim() !== input.allocationCommit) return fail("LEAN_PRIVATE_PROBE_VERIFY_HEAD")
  const result = readJson(join(storePath, "result.json")) as LeanPrivateProbeResultV1
  if (!verifyLeanPrivateProbeResultV1(allocation, result)) return fail("LEAN_PRIVATE_PROBE_VERIFY_RESULT")
  const ledgerBytes = readPrivateFile(join(storePath, "ledger.ndjson"), 65_536), ledgerText = ledgerBytes.toString("utf8")
  if (ledgerText && !ledgerText.endsWith("\n")) return fail("LEAN_PRIVATE_PROBE_VERIFY_LEDGER")
  const rows = ledgerText ? ledgerText.trimEnd().split("\n").map(line => JSON.parse(line) as Record<string, unknown>) : []
  if (rows.length !== result.attemptedOrdinals.length || rows.some((row, ordinal) => !exactKeys(row, ["schemaVersion", "allocationRoot", "allocationDigest", "ordinal", "caseId", "requestRoot", "inputRoot"]) || row.schemaVersion !== "lean-private-probe-debit-v1" || row.ordinal !== ordinal || row.caseId !== allocation.cases[ordinal]!.caseId || row.allocationRoot !== allocation.root || row.allocationDigest !== leanBytesRoot(allocationBytes) || row.inputRoot !== allocation.cases[ordinal]!.inputRoot || row.requestRoot !== allocation.cases[ordinal]!.requestRoot)) return fail("LEAN_PRIVATE_PROBE_VERIFY_DEBITS")
  for (const outcome of result.outcomes) {
    const record = readJson(join(storePath, `probe-${String(outcome.ordinal).padStart(2, "0")}.json`)) as Record<string, unknown>
    if (!validProbeRecord(record, allocation.cases[outcome.ordinal]!) || record.status !== outcome.status || record.cleanupComplete !== true || outcome.cleanupComplete !== true || Number(record.elapsedMs) > allocation.ceilings.hostMs || Number(record.rssBytes) > 3_000_000_000 || Number(record.availableDiskBytes) < 2_000_000_000) return fail("LEAN_PRIVATE_PROBE_VERIFY_CASE")
    const { root: recordRoot, ...recordBody } = record
    if (recordRoot !== labRoot("lean-private-probe-case-result-v1", recordBody)) return fail("LEAN_PRIVATE_PROBE_VERIFY_CASE_ROOT")
  }
  const terminalFull = readJson(join(storePath, "terminal.json")) as Record<string, unknown>
  const { resources, ...terminal } = terminalFull
  if (!exactKeys(resources, ["costSnapshotRoot", "historicalCharged", "historicalAllocatedBytes", "wallAtMs", "cumulativeElapsedMs", "newAllocatedBytes", "retainedBytesUpperBound", "parentRssBytes", "containerMemoryUpperBound", "aggregateMemoryUpperBound", "availableDiskBytes"]) || resources.costSnapshotRoot !== LEAN_PRIVATE_PROBE_COST_ROOT || resources.historicalCharged !== 40 || resources.historicalAllocatedBytes !== 29970432 || !Object.entries(resources).filter(([key]) => key !== "costSnapshotRoot").every(([, value]) => nonnegative(value)) || resources.cumulativeElapsedMs !== 292757903 + Number(resources.wallAtMs) - 1791640699000 || Number(resources.cumulativeElapsedMs) < 292757903 || Number(resources.cumulativeElapsedMs) + 1860000 > 296357903 || Number(resources.wallAtMs) + 1860000 > 1791644299000 || resources.retainedBytesUpperBound !== 29970432 + Number(resources.newAllocatedBytes) + 131072 || Number(resources.retainedBytesUpperBound) > 12000000000 || resources.containerMemoryUpperBound !== 268435456 || resources.aggregateMemoryUpperBound !== Number(resources.parentRssBytes) + 268435456 + 512000000 + 335544320 || Number(resources.aggregateMemoryUpperBound) > 3000000000 || Number(resources.availableDiskBytes) < 2000000000) return fail("LEAN_PRIVATE_PROBE_VERIFY_RESOURCES")
  if (!exactKeys(terminal, ["schemaVersion", "allocationRoot", "attemptedCount", "matchCount", "elapsedMs", "peakRssBytes", "availableDiskBytes", "cleanupComplete", "failureCode", "resultRoot", "root"]) || terminal.failureCode !== null || terminal.schemaVersion !== "lean-private-probe-terminal-v1" || terminal.allocationRoot !== allocation.root || terminal.attemptedCount !== result.attemptedOrdinals.length || terminal.matchCount !== 0 || terminal.resultRoot !== result.root || !nonnegative(terminal.elapsedMs) || terminal.elapsedMs > 600_000 || !nonnegative(terminal.peakRssBytes) || terminal.peakRssBytes > 3_000_000_000 || !nonnegative(terminal.availableDiskBytes) || terminal.availableDiskBytes < 2_000_000_000 || terminal.cleanupComplete !== true) return fail("LEAN_PRIVATE_PROBE_VERIFY_TERMINAL")
  const { root: terminalRoot, ...terminalBody } = terminal
  if (terminalRoot !== labRoot("lean-private-probe-terminal-v1", { ...terminalBody, resources })) return fail("LEAN_PRIVATE_PROBE_VERIFY_TERMINAL_ROOT")
  const storeStat = lstatSync(storePath)
  if (!storeStat.isDirectory() || storeStat.isSymbolicLink() || (storeStat.mode & 0o777) !== 0o700 || realpathSync(storePath) !== storePath) return fail("LEAN_PRIVATE_PROBE_VERIFY_STORE")
  const inventory = readdirSync(storePath).sort(), wanted = ["allocation.json", "entry.json", "ledger.ndjson", "request.json", "result.json", "terminal.json", ...result.attemptedOrdinals.map(ordinal => `probe-${String(ordinal).padStart(2, "0")}.json`)].sort()
  if (inventory.length !== wanted.length || inventory.some((name, index) => name !== wanted[index])) return fail("LEAN_PRIVATE_PROBE_VERIFY_INVENTORY")
  const retainedBeforeTerminal = storeStat.blocks * 512 + inventory.filter(name => name !== "terminal.json" && name !== "result.json").reduce((sum, name) => sum + lstatSync(join(storePath, name)).blocks * 512, 0)
  if (resources.newAllocatedBytes !== retainedBeforeTerminal) return fail("LEAN_PRIVATE_PROBE_VERIFY_RETAINED_BYTES")
  return Object.freeze({ verified: true, resultRoot: result.root })
}

/**
 * Pure, payload-free four-case schedule. The GameState is used only to derive
 * legal public ABI observations; this helper never steps a Match or invokes a
 * provider. Inputs are discarded after their schema/root checks.
 */
export const createLeanPrivateProbeScheduleV1 = (input: {
  readonly sourceHead: string
  readonly sourceRoot: LabRoot
  readonly executableRoot: LabRoot
  readonly costSnapshotRoot: LabRoot
}): LeanPrivateProbeScheduleV1 => {
  if (!/^[a-f0-9]{40,64}$/u.test(input.sourceHead) || !isRoot(input.sourceRoot) || !isRoot(input.executableRoot) || input.costSnapshotRoot !== LEAN_PRIVATE_PROBE_COST_ROOT) return fail("LEAN_PRIVATE_PROBE_SCHEDULE_INPUT")
  const inputs = privateProbeInputs()
  const methods: readonly LeanPrivateProbeMethodV1[] = ["selectActivations", "selectActivations", "soldierBrain", "soldierBrain"]
  const cases = inputs.map((candidate, ordinal): LeanPrivateProbeCaseV1 => {
    const method = methods[ordinal]!
    const schema = method === "selectActivations" ? StrategyInputV119Schema : SoldierBrainInputV119Schema
    const parsed = schema.safeParse(candidate)
    if (!parsed.success || labRoot("runtime-input", candidate) !== labRoot("runtime-input", parsed.data)) return fail("LEAN_PRIVATE_PROBE_LEGAL_INPUT")
    const inputRoot = labRoot("runtime-input", parsed.data)
    const tupleId = MATCH_KERNEL.tupleId
    const requestRoot = labRoot("lean-private-probe-request-v1", { method, inputRoot, tupleId })
    return Object.freeze({ ordinal, caseId: `case-${ordinal}`, method, sourceRoot: input.sourceRoot, executableRoot: input.executableRoot, requestRoot, inputRoot, image: LAB_ADMITTED_ROOTS.image, tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot })
  })
  if (cases[0]!.inputRoot !== cases[1]!.inputRoot || cases[0]!.requestRoot !== cases[1]!.requestRoot || cases[2]!.inputRoot !== cases[3]!.inputRoot || cases[2]!.requestRoot !== cases[3]!.requestRoot) return fail("LEAN_PRIVATE_PROBE_IDENTICAL_CASES")
  const body = { schemaVersion: "lean-private-probe-allocation-v1" as const, sourceHead: input.sourceHead, matchCount: 0 as const, cases, sourceRoot: input.sourceRoot, executableRoot: input.executableRoot, image: LAB_ADMITTED_ROOTS.image, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, costSnapshotRoot: input.costSnapshotRoot, ceilings }
  return freezeLabValue({ ...body, root: labRoot("lean-private-probe-allocation-v1", body) })
}

/**
 * Read-only result verifier. The host-side verifier additionally authenticates
 * files, allocation commit, source/HEAD and resource receipts; this function
 * verifies the retained public-schema join only and writes nothing.
 */
export const verifyLeanPrivateProbeResultV1 = (allocationValue: unknown, resultValue: unknown): boolean => {
  try {
    if (!allocationValue || typeof allocationValue !== "object" || !resultValue || typeof resultValue !== "object") return false
    const allocation = allocationValue as LeanPrivateProbeScheduleV1
    const result = resultValue as LeanPrivateProbeResultV1
    if (!exactKeys(allocation, ["schemaVersion", "sourceHead", "matchCount", "cases", "root", "sourceRoot", "executableRoot", "image", "tupleId", "tupleRoot", "runtimeLimitsRoot", "costSnapshotRoot", "ceilings"]) || !exactKeys(result, ["schemaVersion", "allocationRoot", "sourceHead", "matchCount", "attemptedOrdinals", "outcomes", "root"]) || allocation.schemaVersion !== "lean-private-probe-allocation-v1" || allocation.matchCount !== 0 || allocation.cases.length !== 4 || !isRoot(allocation.root) || !isRoot(result.allocationRoot) || result.schemaVersion !== "lean-private-probe-result-v1" || result.matchCount !== 0 || result.sourceHead !== allocation.sourceHead || result.allocationRoot !== allocation.root || !Array.isArray(result.attemptedOrdinals) || !Array.isArray(result.outcomes) || result.outcomes.length !== result.attemptedOrdinals.length || result.outcomes.length > 4) return false
    const { root, ...body } = allocation
    if (root !== labRoot("lean-private-probe-allocation-v1", body)) return false
    const rebuilt = createLeanPrivateProbeScheduleV1(allocation)
    if (!Buffer.from(leanCanonicalBytes(allocation)).equals(leanCanonicalBytes(rebuilt))) return false
    let expected = 0, terminal = false
    for (const outcome of result.outcomes) {
      if (terminal) return false
      if (!exactKeys(outcome, ["ordinal", "status", "cleanupComplete", "inputRoot", "requestRoot"]) || outcome.ordinal !== expected || result.attemptedOrdinals[expected] !== expected || outcome.inputRoot !== allocation.cases[expected]!.inputRoot || outcome.requestRoot !== allocation.cases[expected]!.requestRoot || !["success", "strategy_timeout", "system_failure", "unknown"].includes(String(outcome.status)) || typeof outcome.cleanupComplete !== "boolean") return false
      expected += 1
      if (outcome.status !== "success" || !outcome.cleanupComplete) terminal = true
    }
    const { root: resultRoot, ...resultBody } = result
    return isRoot(resultRoot) && resultRoot === labRoot("lean-private-probe-result-v1", resultBody)
  } catch { return false }
}

export const runLeanPrivateProbeV1 = async (argv: readonly string[] = process.argv.slice(2)): Promise<unknown> => {
  const command = parseLeanPrivateProbeArgsV1(argv)
  if (command.command === "prepare") return preparePrivateProbe(command)
  if (command.command === "entry") return executeLeanPrivateProbeEntryV1(command)
  return verifyPrivateProbeStore(command)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runLeanPrivateProbeV1().then(result => process.stdout.write(`${JSON.stringify(result)}\n`)).catch(() => { process.stderr.write("lean private probe stopped; inspect the bounded private result/terminal record\n"); process.exitCode = 1 })
}
