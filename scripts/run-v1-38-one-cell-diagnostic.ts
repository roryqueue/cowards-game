import { createHash, createPublicKey, randomUUID, verify as verifySignature } from "node:crypto"
import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { constants, existsSync, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, closeSync, readFileSync, renameSync, statfsSync, writeSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { performance } from "node:perf_hooks"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { createFactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { closeDiagnosticOneCellIssuedProvider, issueDiagnosticOneCellProviderFromFactoryCandidate, runDiagnosticOneCellCell, type FactorySupervisedRuntimeHost } from "../packages/strategy-lab/src/league/connected-runner.js"
import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import {
  DIAGNOSTIC_ONE_CELL_CAPACITY,
  DIAGNOSTIC_ONE_CELL_ALLOCATION_PATH,
  DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH,
  DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH,
  DIAGNOSTIC_ONE_CELL_RESULT_PATH,
  DIAGNOSTIC_ONE_CELL_SEED,
  DIAGNOSTIC_ONE_CELL_STORE,
  DIAGNOSTIC_ONE_CELL_STAGES,
  admitDiagnosticOneCellAllocation,
  createDiagnosticOneCellAllocation,
  createDiagnosticOneCellCell,
  createDiagnosticOneCellStart,
  createDiagnosticOneCellLifetimeGrant,
  createDiagnosticOneCellResult,
  diagnosticOneCellContainerIdentity,
  openDiagnosticOneCellLedger,
  retainDiagnosticOneCellPartialEvidence,
  createDiagnosticOneCellStage,
  createDiagnosticOneCellTerminal,
  reopenDiagnosticOneCellLedger,
  verifyRetainedDiagnosticOneCellExecution,
  safeDiagnosticOneCellCause,
  type DiagnosticOneCellAllocation,
  type DiagnosticOneCellCell,
  type DiagnosticOneCellLedger,
  type DiagnosticOneCellStart,
} from "../packages/strategy-lab/src/league/diagnostic-one-cell.js"
import { DIAGNOSTIC_PILOT_REPAIR_SOURCE_FILES, admitDiagnosticPilotHistoricalVerdict, checkDiagnosticPilotHistoricalGate, diagnosticPilotRepairGateSigningPayload, diagnosticPilotRepairSourceClosure, readDiagnosticPilotOldEvidenceBaseline } from "./run-v1-38-diagnostic-pilot.js"
import { DIAGNOSTIC_PILOT_PHASE264_STORE, readDiagnosticPilotAssessedPair } from "../packages/strategy-lab/src/league/diagnostic-pilot.js"
import { createFactorySupervisedRuntime } from "./lib/v1-38-factory-supervised-runtime.js"
import { MEMORY_PRESSURE_Q_REQUEST, parseMemoryPressureQ } from "./lib/v1-38-darwin-headroom.js"

const fail = (code: string): never => { throw new TypeError(`DIAGNOSTIC_ONE_CELL_CLI_${code}`) }
const ROOT = /^sha256:[0-9a-f]{64}$/u
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right)
const sha = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const readNoFollow = (path: string, limit = 4_194_304): Buffer => {
  const descriptor = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try { const stat = fstatSync(descriptor); if (!stat.isFile() || stat.nlink !== 1 || stat.size < 1 || stat.size > limit) return fail("NOFOLLOW_FILE"); return readFileSync(descriptor) } finally { closeSync(descriptor) }
}
const syncParent = (path: string): void => { const descriptor = openSync(dirname(path), constants.O_RDONLY); try { fsyncSync(descriptor) } finally { closeSync(descriptor) } }
const durableCreate = (path: string, value: unknown): void => {
  const data = Buffer.from(JSON.stringify(value), "utf8")
  if (data.length < 1 || data.length > 262_144) return fail("DURABLE_BYTES")
  const descriptor = openSync(path, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
  try { let offset = 0; while (offset < data.length) offset += writeSync(descriptor, data, offset, data.length - offset); fsyncSync(descriptor) } finally { closeSync(descriptor) }
  syncParent(path)
}
const readExact = (actual: string, expected: string): unknown => { if (resolve(actual) !== resolve(expected)) return fail("EXACT_PATH"); return JSON.parse(readNoFollow(actual, 262_144).toString("utf8")) as unknown }

/** Hard maxima are measured from run command entry, not from provider issuance. */
export const ONE_CELL_OPERATION_BUDGET = Object.freeze({
  sourceCheckMilliseconds: 30_000,
  approvalCheckMilliseconds: 10_000,
  oldTreeHashMilliseconds: 75_000,
  readerMilliseconds: 44_739,
  memoryDockerMilliseconds: 35_000,
  filesystemMilliseconds: 25_000,
  reservationMilliseconds: 25_000,
  publicationMilliseconds: 30_000,
  cellMilliseconds: 240_000,
  cleanupReserveMilliseconds: 30_000,
  overallMilliseconds: 600_000,
})
export const verifyOneCellComponentBudget = (budget: { readonly [K in keyof typeof ONE_CELL_OPERATION_BUDGET]: number }): number => {
  const entries = Object.entries(budget)
  if (entries.some(([, value]) => !Number.isSafeInteger(value) || value <= 0) || budget.readerMilliseconds !== 44_739 || budget.cellMilliseconds !== 240_000 || budget.cleanupReserveMilliseconds !== 30_000 || budget.overallMilliseconds !== 600_000) return fail("BUDGET_FIELDS")
  const setup = budget.sourceCheckMilliseconds + budget.approvalCheckMilliseconds + budget.oldTreeHashMilliseconds + budget.readerMilliseconds + budget.memoryDockerMilliseconds + budget.filesystemMilliseconds + budget.reservationMilliseconds + budget.publicationMilliseconds
  const margin = budget.overallMilliseconds - setup - budget.cellMilliseconds - budget.cleanupReserveMilliseconds
  if (margin <= 0 || setup - budget.readerMilliseconds > 285_261) return fail("BUDGET_EXCEEDED")
  return margin
}
/** Publication is post-cell work, so retain its own 30-second slot after the
 * 240-second cell and 30-second cleanup/terminal reserve. */
export const canStartOneCell = (now: number, overallStartedAt: number): boolean => Number.isFinite(now) && Number.isFinite(overallStartedAt) && now >= overallStartedAt && now - overallStartedAt <= 300_000
const withinOneCellBudget = (startedAt: number, milliseconds: number, code: string): void => { if (performance.now() - startedAt > milliseconds) fail(code) }
const timedOneCellSync = <T>(milliseconds: number, code: string, action: () => T): T => { const startedAt = performance.now(); const result = action(); withinOneCellBudget(startedAt, milliseconds, code); return result }
const timedOneCellAsync = async <T>(milliseconds: number, code: string, action: () => Promise<T>): Promise<T> => {
  let timer: NodeJS.Timeout | undefined
  try { return await Promise.race([action(), new Promise<T>((_resolve, reject) => { timer = setTimeout(() => reject(new TypeError(`DIAGNOSTIC_ONE_CELL_CLI_${code}`)), milliseconds) })]) }
  finally { if (timer) clearTimeout(timer) }
}
type OneCellLiveSelector = "prepare" | "preflight" | "run"
type OneCellLiveStage = "source" | "approval" | "history" | "attempt" | "reader" | "filesystem" | "memory_docker" | "reservation" | "cell" | "publication"
type OneCellStageRunner = <T>(name: OneCellLiveStage, action: () => T | Promise<T>) => Promise<T>
interface OneCellPublisherContext { readonly pendingRoot: LabRoot; readonly stageTranscript: readonly OneCellLiveStage[]; readonly childElapsedMilliseconds: number }
interface OneCellPublisherInstruction extends OneCellPublisherContext { readonly parentElapsedBeforePublisherMilliseconds: number }
const directOneCellStage: OneCellStageRunner = async (_name, action) => action()
const ONE_CELL_STAGE_ORDER: readonly OneCellLiveStage[] = Object.freeze(["source", "approval", "history", "attempt", "reader", "filesystem", "memory_docker", "reservation", "cell", "publication"])
const ONE_CELL_STAGE_LIMIT: Readonly<Record<OneCellLiveStage, number>> = Object.freeze({
  source: ONE_CELL_OPERATION_BUDGET.sourceCheckMilliseconds,
  approval: ONE_CELL_OPERATION_BUDGET.approvalCheckMilliseconds,
  history: ONE_CELL_OPERATION_BUDGET.oldTreeHashMilliseconds,
  attempt: ONE_CELL_OPERATION_BUDGET.reservationMilliseconds,
  reader: ONE_CELL_OPERATION_BUDGET.readerMilliseconds,
  filesystem: ONE_CELL_OPERATION_BUDGET.filesystemMilliseconds,
  memory_docker: ONE_CELL_OPERATION_BUDGET.memoryDockerMilliseconds,
  reservation: ONE_CELL_OPERATION_BUDGET.reservationMilliseconds,
  // Normal Match execution and normal cleanup together get 240 seconds. A
  // timed-out child is killed; only then may the outer parent spend the separate
  // 30-second emergency owner cleanup reserve. No positive completion uses it.
  cell: ONE_CELL_OPERATION_BUDGET.cellMilliseconds,
  publication: ONE_CELL_OPERATION_BUDGET.publicationMilliseconds,
})
const ONE_CELL_REQUIRED_STAGES: Readonly<Record<OneCellLiveSelector, readonly OneCellLiveStage[]>> = Object.freeze({
  prepare: ["source", "approval", "history", "reservation"],
  preflight: ["source", "approval", "history", "attempt", "reader", "filesystem", "memory_docker", "publication"],
  run: ["source", "approval", "history", "attempt", "reader", "filesystem", "memory_docker", "reservation", "cell", "publication"],
})
interface OneCellSupervisorHost {
  readonly now: () => number
  readonly latch: (selector: OneCellLiveSelector, milliseconds: number) => Promise<boolean>
  readonly spawn: (token: string, selector: OneCellLiveSelector, args: readonly string[]) => ChildProcess
  readonly killGroup: (pid: number, child: ChildProcess) => void
  readonly cleanup: (milliseconds: number) => Promise<boolean>
  readonly stageLimit?: (name: OneCellLiveStage) => number
  readonly publish?: (selector: OneCellLiveSelector, status: "finished" | "prestart_denied", commandStartedAt: number, context: OneCellPublisherContext) => Promise<void>
}
const defaultOneCellSupervisorHost: OneCellSupervisorHost = {
  now: () => performance.now(),
  latch: (selector, milliseconds) => superviseOneCellSelectorAttempt(selector, milliseconds),
  spawn: (token, selector, args) => spawn(resolve("node_modules/.bin/tsx"), [fileURLToPath(import.meta.url), "--internal-live-v3", token, selector, ...args], { stdio: ["ignore", "pipe", "pipe", "ipc"], env: { PATH: process.env.PATH ?? "", TMPDIR: process.env.TMPDIR ?? "" }, shell: false, detached: true, windowsHide: true }),
  killGroup: (pid, child) => { try { process.kill(-pid, "SIGKILL") } catch { try { child.kill("SIGKILL") } catch { /* retained invalid */ } } },
  cleanup: (milliseconds) => superviseOneCellEmergencyCleanup(milliseconds),
}
/** Only a detached child created by this host is addressed as a process group.
 * The parent owns monotonic stage and overall clocks even when the child blocks
 * in synchronous Git, filesystem, memory or publication work. */
export const superviseOneCellLive = async (selector: OneCellLiveSelector, args: readonly string[], host: OneCellSupervisorHost = defaultOneCellSupervisorHost, commandStartedAt: number = host.now()): Promise<void> => {
  const startedAt = commandStartedAt
  const latchRemaining = Math.max(1, Math.min(40_000, (selector === "run" ? 600_000 : 300_000) - (host.now() - startedAt)))
  if (!await host.latch(selector, latchRemaining) || host.now() - startedAt >= (selector === "run" ? 600_000 : 300_000)) return fail("LIVE_SELECTOR_ATTEMPT_INVALID")
  const token = randomUUID(), child = host.spawn(token, selector, args)
  if (!child.pid || child.pid < 2) return fail("LIVE_SUPERVISOR_PID")
  const required = ONE_CELL_REQUIRED_STAGES[selector]
  let entered: OneCellLiveStage | null = null, lastStageIndex = -1, stageTimer: NodeJS.Timeout | undefined, idleTimer: NodeJS.Timeout | undefined, done = false, completedStatus: "finished" | "prestart_denied" | null = null, completedPendingRoot: LabRoot | null = null, timedOut = false, settled = false, exitCode: number | null = null, outputBytes = 0, failedHostStage = false
  const seenStages: OneCellLiveStage[] = []
  const kill = () => { if (settled || timedOut) return; timedOut = true; host.killGroup(child.pid!, child) }
  const clearStage = () => { if (stageTimer) clearTimeout(stageTimer); stageTimer = undefined }
  const clearIdle = () => { if (idleTimer) clearTimeout(idleTimer); idleTimer = undefined }
  const armIdle = () => { clearIdle(); idleTimer = setTimeout(kill, 5_000) }
  const outerMilliseconds = selector === "run" ? 600_000 : 300_000
  const outerTimer = setTimeout(kill, Math.max(1, outerMilliseconds - (host.now() - startedAt)))
  const outcome = await new Promise<void>((resolveOutcome) => {
    const finish = () => { if (settled) return; settled = true; clearStage(); clearIdle(); clearTimeout(outerTimer); resolveOutcome() }
    armIdle()
    const drain = (bytes: Buffer) => { outputBytes += bytes.length; if (outputBytes > 4096) kill() }
    child.stdout?.on("data", drain); child.stderr?.on("data", drain)
    child.on("error", finish); child.on("exit", (code) => { exitCode = code; finish() })
    child.on("message", (message: unknown) => {
      if (exact(message, ["kind", "token", "stage"]) && message.kind === "stage-ready" && message.token === token && entered === null && ONE_CELL_STAGE_ORDER.includes(message.stage as OneCellLiveStage)) {
        const stage = message.stage as OneCellLiveStage, index = required.indexOf(stage)
        const sparseDenialPublication = selector === "preflight" && failedHostStage && stage === "publication" && index === required.length - 1
        if (index < 0 || index !== lastStageIndex + 1 && !sparseDenialPublication || selector === "run" && stage === "cell" && !canStartOneCell(host.now(), startedAt) || selector === "run" && stage === "publication" && host.now() - startedAt > 570_000) { kill(); return }
        clearIdle(); entered = stage; lastStageIndex = index; seenStages.push(stage)
        const limit = host.stageLimit?.(stage) ?? ONE_CELL_STAGE_LIMIT[stage]
        if (!Number.isSafeInteger(limit) || limit < 1 || limit > ONE_CELL_STAGE_LIMIT[stage]) { kill(); return }
        stageTimer = setTimeout(kill, limit)
        child.send({ kind: "stage-go", token, stage }, (error) => { if (error) kill() })
        return
      }
      if (exact(message, ["kind", "token", "stage", "ok"]) && message.kind === "stage-done" && message.token === token && message.stage === entered && typeof message.ok === "boolean") { if (!message.ok && selector === "preflight" && ["reader", "filesystem", "memory_docker"].includes(entered!)) failedHostStage = true; clearStage(); entered = null; armIdle(); return }
      if (exact(message, ["kind", "token", "status", "pendingRoot"]) && message.kind === "live-complete" && message.token === token && (message.status === "finished" || message.status === "prestart_denied") && root(message.pendingRoot) && entered === null && !done) {
        const allStages = same(seenStages, required)
        const denialPrefix = same(seenStages.slice(0, 4), required.slice(0, 4)) && seenStages.at(-1) === "publication" && (failedHostStage || allStages)
        if (message.status === "finished" && !allStages || message.status === "prestart_denied" && (selector !== "preflight" || !denialPrefix)) { kill(); return }
        clearIdle()
        done = true; completedStatus = message.status; completedPendingRoot = message.pendingRoot; return
      }
      kill()
    })
  })
  void outcome
  const cellWasEntered = selector === "run" && lastStageIndex >= required.indexOf("cell")
  const childSucceeded = !timedOut && exitCode === 0 && done && completedStatus !== null && completedPendingRoot !== null && host.now() - startedAt <= (selector === "run" ? 600_000 : 300_000)
  const cleanupMilliseconds = Math.max(1, Math.min(30_000, startedAt + 600_000 - host.now()))
  const cleanupComplete = !childSucceeded && cellWasEntered ? await timedOneCellAsync(cleanupMilliseconds, "SUPERVISOR_CLEANUP_DEADLINE", () => host.cleanup(cleanupMilliseconds)).catch(() => false) : true
  if (!childSucceeded || !cleanupComplete) return fail("LIVE_SUPERVISOR_PROCESS_INVALID")
  await (host.publish ?? publishOneCellWithWatchdog)(selector, completedStatus!, startedAt, { pendingRoot: completedPendingRoot!, stageTranscript: [...seenStages], childElapsedMilliseconds: Math.max(0, Math.ceil(host.now() - startedAt)) })
}
const oneCellIpcStageRunner = (token: string): OneCellStageRunner => async (stage, action) => {
  if (!process.send || !process.connected) return fail("LIVE_STAGE_PARENT_IPC")
  await new Promise<void>((resolveGo, rejectGo) => {
    const timer = setTimeout(() => { process.off("message", receive); rejectGo(new TypeError("DIAGNOSTIC_ONE_CELL_CLI_LIVE_STAGE_PERMISSION_TIMEOUT")) }, 5_000)
    const receive = (message: unknown) => {
      if (!exact(message, ["kind", "token", "stage"]) || message.kind !== "stage-go" || message.token !== token || message.stage !== stage) { clearTimeout(timer); process.off("message", receive); rejectGo(new TypeError("DIAGNOSTIC_ONE_CELL_CLI_LIVE_STAGE_PERMISSION")); return }
      clearTimeout(timer); process.off("message", receive); resolveGo()
    }
    process.on("message", receive)
    process.send!({ kind: "stage-ready", token, stage })
  })
  try { const value = await action(); process.send({ kind: "stage-done", token, stage, ok: true }); return value }
  catch (error) { process.send({ kind: "stage-done", token, stage, ok: false }); throw error }
}

export interface OneCellPreflightAttempt { readonly schemaVersion: "diagnostic-one-cell-preflight-attempt-v3"; readonly root: LabRoot; readonly allocationRoot: LabRoot; readonly authorizationRoot: LabRoot; readonly sourceGateRoot: LabRoot; readonly exclusive: true }
export const createOneCellPreflightAttempt = (allocation: DiagnosticOneCellAllocation, authorizationRoot: LabRoot): OneCellPreflightAttempt => {
  const admitted = admitDiagnosticOneCellAllocation(allocation)
  if (!root(authorizationRoot)) return fail("PREFLIGHT_AUTHORIZATION")
  const fields = { schemaVersion: "diagnostic-one-cell-preflight-attempt-v3" as const, allocationRoot: admitted.root, authorizationRoot, sourceGateRoot: admitted.gateRoot, exclusive: true as const }
  return Object.freeze({ ...fields, root: labRoot("diagnostic-one-cell-preflight-attempt-v3", fields) })
}
export type OneCellPreflightObservation = OneCellHostObservation | Readonly<{ denialCode: "source" | "history" | "candidate" | "filesystem" | "memory" | "docker" | "timeout" | "unknown" }>
export interface OneCellPreflightDisposition { readonly schemaVersion: "diagnostic-one-cell-preflight-disposition-v3"; readonly root: LabRoot; readonly attemptRoot: LabRoot; readonly allocationRoot: LabRoot; readonly status: "admitted" | "prestart_denied"; readonly observationRoot: LabRoot; readonly observation: OneCellPreflightObservation; readonly terminal: true }
export const createOneCellPreflightDisposition = (attempt: OneCellPreflightAttempt, input: { readonly status: "admitted" | "prestart_denied"; readonly observation: OneCellPreflightObservation }): OneCellPreflightDisposition => {
  if (!root(attempt.root) || !root(attempt.allocationRoot) || !["admitted", "prestart_denied"].includes(input.status) || !input.observation || typeof input.observation !== "object" || input.status === "admitted" && ("denialCode" in input.observation || !exact(input.observation, ["fileSystemBytes", "fileSystemInodes", "memoryBasisPoints", "memoryAvailableBytes", "dockerCpus", "dockerMemoryBytes", "imageDigest", "architecture", "ownedNameCollisions", "readerMilliseconds"])) || input.status === "prestart_denied" && (!exact(input.observation, ["denialCode"]) || !["source", "history", "candidate", "filesystem", "memory", "docker", "timeout", "unknown"].includes(String(input.observation.denialCode)))) return fail("PREFLIGHT_DISPOSITION")
  if (input.status === "admitted") {
    const observed = input.observation as OneCellHostObservation
    if (!/^[0-9]+$/u.test(observed.fileSystemBytes) || BigInt(observed.fileSystemBytes) < BigInt(DIAGNOSTIC_ONE_CELL_CAPACITY.maxBytes + DIAGNOSTIC_ONE_CELL_CAPACITY.terminalReserveBytes) || !/^[0-9]+$/u.test(observed.fileSystemInodes) || BigInt(observed.fileSystemInodes) < BigInt(DIAGNOSTIC_ONE_CELL_CAPACITY.maxInodes + DIAGNOSTIC_ONE_CELL_CAPACITY.terminalReserveInodes) || !Number.isSafeInteger(observed.memoryBasisPoints) || observed.memoryBasisPoints < 2500 || !Number.isSafeInteger(observed.memoryAvailableBytes) || observed.memoryAvailableBytes < 1_073_741_824 || !Number.isSafeInteger(observed.dockerCpus) || observed.dockerCpus < 2 || !Number.isSafeInteger(observed.dockerMemoryBytes) || observed.dockerMemoryBytes < 268_435_456 || !root(observed.imageDigest) || observed.architecture !== "amd64" || observed.ownedNameCollisions !== 0 || !Number.isSafeInteger(observed.readerMilliseconds) || observed.readerMilliseconds < 0 || observed.readerMilliseconds > 44_739) return fail("PREFLIGHT_OBSERVATION")
  }
  const fields = { schemaVersion: "diagnostic-one-cell-preflight-disposition-v3" as const, attemptRoot: attempt.root, allocationRoot: attempt.allocationRoot, status: input.status, observationRoot: labRoot("diagnostic-one-cell-preflight-observation-v3", input.observation), observation: input.observation, terminal: true as const }
  return Object.freeze({ ...fields, root: labRoot("diagnostic-one-cell-preflight-disposition-v3", fields) })
}
export const admitOneCellPreflightDisposition = (attempt: OneCellPreflightAttempt, value: unknown): OneCellPreflightDisposition => {
  if (!exact(value, ["schemaVersion", "root", "attemptRoot", "allocationRoot", "status", "observationRoot", "observation", "terminal"])) return fail("PREFLIGHT_DISPOSITION_KEYS")
  const expected = createOneCellPreflightDisposition(attempt, { status: value.status as OneCellPreflightDisposition["status"], observation: value.observation as OneCellPreflightObservation })
  if (!same(value, expected)) return fail("PREFLIGHT_DISPOSITION_MISMATCH")
  return expected
}
export const requireAdmittedOneCellPreflight = (allocation: DiagnosticOneCellAllocation, authorizationRoot: LabRoot, attempt: unknown, disposition: unknown): OneCellPreflightDisposition => {
  const expected = createOneCellPreflightAttempt(allocation, authorizationRoot)
  if (!exact(attempt, ["schemaVersion", "root", "allocationRoot", "authorizationRoot", "sourceGateRoot", "exclusive"]) || !same(attempt, expected)) return fail("PREFLIGHT_ATTEMPT_MISMATCH")
  const admitted = admitOneCellPreflightDisposition(expected, disposition)
  if (admitted.status !== "admitted") return fail("PREFLIGHT_DENIED")
  return admitted
}

type WorkerMessage = { readonly kind: "cell-complete"; readonly ordinal: 0 } | { readonly kind: "done"; readonly status: "process_valid" | "process_invalid" }
export interface OneCellWorkerExecution { readonly disposition: "success" | "system_failure" | "player_violation"; readonly processValidity: "process_valid" | "process_invalid"; readonly evidenceRoot: LabRoot | null; readonly artifactBytes: number; readonly artifactRecords: number; readonly cleanupComplete: boolean }
export const runOneCellWorkerCell = async <T>(input: {
  readonly allocation: DiagnosticOneCellAllocation; readonly cell: DiagnosticOneCellCell; readonly start: DiagnosticOneCellStart; readonly ledger: DiagnosticOneCellLedger
  readonly now: () => number; readonly cellStartedAt: number
  readonly issue: (seat: "bottom" | "top") => T
  readonly execute: (bottom: T, top: T, enteredKernel: () => void, enteredEvidence: () => void) => Promise<OneCellWorkerExecution>
  readonly close: (handle: T) => boolean; readonly cleanup: () => Promise<boolean>; readonly send: (message: WorkerMessage) => boolean
  readonly beforeTerminalWrite?: () => void; readonly afterTerminalWrite?: () => void
}): Promise<"stop"> => {
  const { ledger, allocation, cell, start } = input
  let bottom: T | null = null, top: T | null = null, stage = -1, stageUncertain = false, publicationAttempted = false, terminalDurable = false, completionAttempted = false
  const checkpoint = (ordinal: number): void => {
    stageUncertain = true
    const record = createDiagnosticOneCellStage(start, ordinal, DIAGNOSTIC_ONE_CELL_STAGES[ordinal]!)
    ledger.writeStage(record)
    stage = ordinal; stageUncertain = false
  }
  const elapsed = (): number => Math.min(240_000, Math.max(0, Math.ceil(input.now() - input.cellStartedAt)))
  const completion = (status: "process_valid" | "process_invalid"): "stop" => {
    if (completionAttempted) return "stop"
    completionAttempted = true
    if (!input.send({ kind: "cell-complete", ordinal: 0 })) return "stop"
    input.send({ kind: "done", status })
    return "stop"
  }
  const reopen = () => {
    const records = reopenDiagnosticOneCellLedger(ledger, allocation)
    if (records.retentionUncertain || records.records.length !== 1 || records.records[0]!.start.root !== start.root) return fail("WORKER_CELL_REOPEN")
    return records.records[0]!.terminal
  }
  try {
    checkpoint(0); bottom = input.issue("bottom")
    checkpoint(1); top = input.issue("top")
    checkpoint(2)
    const execution = await input.execute(bottom, top, () => checkpoint(3), () => checkpoint(4))
    const cleaned = await input.cleanup()
    if (elapsed() >= 240_000) return fail("WORKER_CELL_DEADLINE")
    checkpoint(5)
    let valid = execution.disposition === "success" && execution.processValidity === "process_valid" && execution.evidenceRoot !== null && execution.cleanupComplete && cleaned
    if (valid && execution.evidenceRoot) {
      const manifest = verifyRetainedDiagnosticOneCellExecution(ledger, allocation, cell, start, execution.evidenceRoot)
      valid = manifest.disposition === "success" && manifest.artifactBytes === execution.artifactBytes && manifest.artifactRecords === execution.artifactRecords
    }
    const terminal = createDiagnosticOneCellTerminal(start, { disposition: valid ? "success" : execution.disposition === "success" ? "uncertain" : execution.disposition, processValidity: valid ? "process_valid" : "process_invalid", evidenceRoot: execution.evidenceRoot, cleanupComplete: cleaned && execution.cleanupComplete, elapsedMilliseconds: elapsed(), artifactBytes: execution.artifactBytes, artifactRecords: execution.artifactRecords, code: !cleaned || !execution.cleanupComplete ? "cleanup_incomplete" : valid ? "completed" : execution.disposition === "success" ? "system_failure" : execution.disposition, lastEnteredStage: "terminal_publication", failureStage: "unknown", cause: "unknown_internal" })
    publicationAttempted = true; input.beforeTerminalWrite?.(); ledger.writeTerminal(terminal); terminalDurable = true; input.afterTerminalWrite?.()
    if (reopen()?.root !== terminal.root) return fail("WORKER_CELL_REOPEN")
    return completion(valid ? "process_valid" : "process_invalid")
  } catch (error) {
    if (completionAttempted) return "stop"
    let closeComplete = true
    for (const handle of [bottom, top]) if (handle !== null) try { if (!input.close(handle)) closeComplete = false } catch { closeComplete = false }
    let cleaned = false
    try { cleaned = await input.cleanup() } catch { /* process-invalid */ }
    try {
      const existing = reopen()
      if (existing) return terminalDurable ? completion("process_invalid") : "stop"
    } catch { return "stop" }
    if (publicationAttempted || ledger.hasUncertainPublication()) return "stop"
    const failureStage = stageUncertain || stage < 0 ? "unknown" : DIAGNOSTIC_ONE_CELL_STAGES[Math.min(stage, 4)]!
    try { if (stage < 5) checkpoint(5) } catch { return "stop" }
    let partial: ReturnType<typeof retainDiagnosticOneCellPartialEvidence>
    try { partial = retainDiagnosticOneCellPartialEvidence(ledger, start) } catch { return "stop" }
    const terminal = createDiagnosticOneCellTerminal(start, { disposition: cleaned && closeComplete ? "system_failure" : "uncertain", processValidity: "process_invalid", evidenceRoot: partial.evidenceRoot, cleanupComplete: cleaned && closeComplete, elapsedMilliseconds: elapsed(), artifactBytes: partial.artifactBytes, artifactRecords: partial.artifactRecords, code: cleaned && closeComplete ? "system_failure" : "cleanup_incomplete", lastEnteredStage: "terminal_publication", failureStage, cause: safeDiagnosticOneCellCause(error) })
    try { ledger.writeTerminal(terminal); if (reopen()?.root !== terminal.root) return "stop" } catch { return "stop" }
    return completion("process_invalid")
  }
}

/** Source gate is read-only and never a Match authorization. The reviewer key is
 * pinned by the independently reviewed final source freeze. */
export const ONE_CELL_GATE_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-11-SOURCE-GATE.json" as const
export const ONE_CELL_REVIEW_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-11-SOURCE-REVIEW.md" as const
export const ONE_CELL_RECEIPT_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-11-COMMAND-RECEIPT.json" as const
export const ONE_CELL_AUTHORIZATION_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-12-OPERATOR-AUTHORIZATION.json" as const
export const ONE_CELL_ALLOCATION_PENDING_PATH = `${DIAGNOSTIC_ONE_CELL_ALLOCATION_PATH}.pending-v3` as const
export const ONE_CELL_PREFLIGHT_PENDING_PATH = `${DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH}.pending-v3` as const
export const ONE_CELL_RESULT_PENDING_PATH = `${DIAGNOSTIC_ONE_CELL_RESULT_PATH}.pending-v3` as const
export const ONE_CELL_SELECTOR_ATTEMPT_PATHS = Object.freeze({
  prepare: ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-prepare-selector-attempt-v3.json",
  preflight: ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-preflight-selector-attempt-v3.json",
  run: ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-run-selector-attempt-v3.json",
} as const)
export const ONE_CELL_PARENT_PERMIT_PATHS = Object.freeze({
  prepare: ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-prepare-parent-permit-v3.json",
  preflight: ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-preflight-parent-permit-v3.json",
  run: ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-run-parent-permit-v3.json",
} as const)
export const ONE_CELL_PUBLISHER_RECEIPT_PATHS = Object.freeze({
  prepare: ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-prepare-publisher-receipt-v3.json",
  preflight: ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-preflight-publisher-receipt-v3.json",
  run: ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-run-publisher-receipt-v3.json",
} as const)
export const ONE_CELL_REVIEWER_PUBLIC_KEY_PEM = "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAJRvawNm1BgHmt9AaLeCYYIEdnpjMQdn9BlSKAHvmD9o=\n-----END PUBLIC KEY-----"
export const ONE_CELL_SOURCE_FILES = Object.freeze([
  "packages/strategy-lab/src/league/diagnostic-one-cell.ts", "packages/strategy-lab/src/league/diagnostic-one-cell.test.ts",
  "packages/strategy-lab/src/league/connected-runner.ts", "packages/strategy-lab/src/league/connected-runner.test.ts",
  "scripts/lib/v1-38-factory-supervised-runtime.ts", "scripts/lib/v1-38-factory-supervised-runtime.test.ts",
  "scripts/lib/v1-38-planner-supervised-runtime.ts", "scripts/lib/v1-38-planner-supervised-runtime.test.ts",
  "scripts/run-v1-38-one-cell-diagnostic.ts", "scripts/run-v1-38-one-cell-diagnostic.test.ts",
  "scripts/check-v1-38-one-cell-diagnostic-boundaries.ts", "scripts/check-v1-38-one-cell-diagnostic-boundaries.test.ts",
  "packages/strategy-lab/src/league/diagnostic-pilot.ts", "packages/strategy-lab/src/league/diagnostic-pilot.test.ts",
  "scripts/run-v1-38-diagnostic-pilot.ts", "scripts/run-v1-38-diagnostic-pilot.test.ts", "scripts/check-v1-38-diagnostic-pilot-boundaries.ts",
  "scripts/lib/v1-38-darwin-headroom.ts", "packages/strategy-lab/src/factory/repository.ts", "packages/strategy-lab/src/contracts.ts",
  "pnpm-lock.yaml", ".github/workflows/ci.yml",
] as const)
export const oneCellSourceClosure = (read: (path: string) => Uint8Array = (path) => readNoFollow(path)) => {
  const sourceFiles = ONE_CELL_SOURCE_FILES.map((path) => ({ path, sha256: sha(read(path)) }))
  return { sourceFiles, sourceClosureRoot: labRoot("diagnostic-one-cell-source-closure-v3", sourceFiles) }
}
export const oneCellRequiredGateCommands = (): readonly string[] => {
  const ci = readNoFollow(".github/workflows/ci.yml").toString("utf8").split("\n")
  const leagueLine = ci.find((line) => line.includes("vitest run --maxWorkers=1 packages/strategy-lab/src/league/contracts.test.ts"))?.trim()
  if (!leagueLine || (leagueLine.match(/\.test\.ts/gu) ?? []).length !== 29) return fail("CI_29_SUITE_DRIFT")
  return Object.freeze([
    "./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/diagnostic-one-cell.test.ts packages/strategy-lab/src/league/connected-runner.test.ts scripts/run-v1-38-one-cell-diagnostic.test.ts scripts/check-v1-38-one-cell-diagnostic-boundaries.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts",
    leagueLine,
    "./node_modules/.bin/tsc --noEmit -p packages/strategy-lab/tsconfig.json",
    "./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.ts scripts/run-v1-38-one-cell-diagnostic.ts scripts/run-v1-38-one-cell-diagnostic.test.ts scripts/check-v1-38-one-cell-diagnostic-boundaries.ts",
    "./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false",
    "./node_modules/.bin/tsx scripts/check-v1-38-serious-league-boundaries.ts",
    "./node_modules/.bin/tsx scripts/check-v1-38-lab-boundaries.ts",
    "./node_modules/.bin/tsx scripts/check-v1-38-factory-boundaries.ts",
    "./node_modules/.bin/tsx scripts/check-v1-38-diagnostic-pilot-boundaries.ts",
    "./node_modules/.bin/tsx scripts/check-v1-38-one-cell-diagnostic-boundaries.ts",
    "pnpm exec tsx scripts/check-service-boundary-imports.ts",
    "./node_modules/.bin/vitest run --maxWorkers=1 scripts/check-v1-38-serious-league-boundaries.test.ts scripts/check-v1-38-lab-boundaries.test.ts scripts/check-v1-38-factory-boundaries.test.ts scripts/check-v1-38-diagnostic-pilot-boundaries.test.ts scripts/check-v1-38-one-cell-diagnostic-boundaries.test.ts",
    "./node_modules/.bin/tsx scripts/run-v1-38-one-cell-diagnostic.ts check-history-source-only-v3",
  ])
}
export const oneCellGateSigningPayload = (fields: Record<string, unknown>): Uint8Array => Buffer.from(JSON.stringify({ domain: "diagnostic-one-cell-source-gate-signature-v3", fields }), "utf8")
const PLAN10_COMMIT = "1ebf10ae9325fd11048c33e5bbc3c20d29a08836"
const PLAN10_GATE_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-10-SOURCE-GATE.json"
const PLAN10_REVIEW_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-10-SOURCE-REVIEW.md"
const PLAN10_GATE_ROOT = "sha256:5cf7974145be0fd6d665dc28127aa83fff1b29ce1749dc5b2d6dc4d04bdad6d1"
const PLAN10_REVIEWER_PUBLIC_KEY_PEM = "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAUxpql4iRtDPzNKhsUEwxR1VCNydjKE82epOJ7GuFutY=\n-----END PUBLIC KEY-----"
const readPinnedPlan10 = (): Readonly<Record<string, Uint8Array>> => {
  const files: Record<string, Uint8Array> = {}
  for (const path of DIAGNOSTIC_PILOT_REPAIR_SOURCE_FILES) {
    const result = spawnSync("git", ["show", `${PLAN10_COMMIT}:${path}`], { encoding: "buffer", maxBuffer: 4_194_304, timeout: 10_000 })
    if (result.status !== 0 || result.signal !== null || result.error || !result.stdout?.length || result.stderr?.length) return fail("PINNED_PLAN10_BLOB")
    files[path] = result.stdout
  }
  return Object.freeze(files)
}
/** Pure file/Git authentication; unlike the historical live verifier, this
 * never probes Docker, memory, providers or a Match. */
export const checkOneCellHistoricalSourceOnly = () => {
  const v1Gate = checkDiagnosticPilotHistoricalGate()
  const raw = JSON.parse(readNoFollow(PLAN10_GATE_PATH, 262_144).toString("utf8")) as Record<string, unknown>
  if (!root(raw.root) || raw.root !== PLAN10_GATE_ROOT || typeof raw.signatureBase64 !== "string" || raw.empiricalAuthority !== false || raw.runAllowed !== false || raw.leagueRequirementsEvidence !== false || raw.freezeAuthorized !== false || raw.formationAuthorized !== false || raw.holdoutAuthorized !== false || raw.counted !== false || raw.public !== false || raw.productionAuthorized !== false || raw.reviewPath !== PLAN10_REVIEW_PATH) return fail("PLAN10_GATE")
  const pinnedBytes = readPinnedPlan10()
  const pinned = diagnosticPilotRepairSourceClosure((path) => pinnedBytes[path] ?? fail("PLAN10_SOURCE"))
  if (!same(raw.sourceFiles, pinned.sourceFiles) || raw.sourceClosureRoot !== pinned.sourceClosureRoot || raw.sourceClosureRoot !== "sha256:d985d51e82ae23dd805fc55bca3ee048ba37c77d7129c33b11c79d101357d41e" || raw.reviewSha256 !== sha(readNoFollow(PLAN10_REVIEW_PATH, 262_144))) return fail("PLAN10_SOURCE_DRIFT")
  const { root: gateRoot, signatureBase64, ...body } = raw
  if (gateRoot !== labRoot("diagnostic-pilot-repair-source-gate-v1", { ...body, signatureBase64 }) || !verifySignature(null, diagnosticPilotRepairGateSigningPayload(body as never), createPublicKey(PLAN10_REVIEWER_PUBLIC_KEY_PEM), Buffer.from(signatureBase64, "base64"))) return fail("PLAN10_SIGNATURE")
  const verdict = admitDiagnosticPilotHistoricalVerdict(raw.historicalCompatibility) as { readonly root: LabRoot; readonly gateRoot: LabRoot; readonly processValidity: string; readonly chargedCount: number; readonly slots: readonly { readonly status: string }[]; readonly oldEvidenceBaseline: unknown }
  if (verdict.gateRoot !== v1Gate.root || verdict.processValidity !== "process_invalid" || verdict.chargedCount !== 1 || verdict.slots.filter((slot) => slot.status === "unused").length !== 3) return fail("HISTORICAL_VERDICT")
  const baseline = readDiagnosticPilotOldEvidenceBaseline()
  if (!same(verdict.oldEvidenceBaseline, baseline) || !same(raw.oldEvidenceBaseline, baseline)) return fail("OLD_EVIDENCE_DRIFT")
  const pilotAllocation = JSON.parse(readNoFollow(".planning/artifacts/v1.38-phase-265-diagnostic-pilot-allocation.json", 262_144).toString("utf8")) as Record<string, unknown>
  const pilotResult = JSON.parse(readNoFollow(".planning/artifacts/v1.38-phase-265-diagnostic-pilot-result.json", 262_144).toString("utf8")) as Record<string, unknown>
  if (pilotAllocation.root !== "sha256:8d642cdc20c4e0ff718a78bf0a38b4fe06cc4a3f4a8cee26969d86ad96bd49bc" || pilotResult.root !== "sha256:af7aa261ebc7cd38cf893ea24c7b6c7a7986999125fe6a0eea853d893277f732") return fail("PILOT_HISTORY")
  return Object.freeze({ historicalV1Root: verdict.root, historicalV2GateRoot: gateRoot, oldEvidenceBaseline: baseline })
}
export const checkOneCellSourceGate = (gatePath: string = ONE_CELL_GATE_PATH, read: (path: string) => Uint8Array = (path) => readNoFollow(path)) => {
  if (resolve(gatePath) !== resolve(ONE_CELL_GATE_PATH)) return fail("SOURCE_GATE_PATH")
  const gate = JSON.parse(Buffer.from(read(gatePath)).toString("utf8")) as unknown
  if (!exact(gate, ["schemaVersion", "sourceFiles", "sourceClosureRoot", "reviewPath", "reviewSha256", "receiptPath", "receiptSha256", "reviewerId", "authorId", "actionableFindings", "commandsPassed", "historicalContinuity", "empiricalAuthority", "runAllowed", "leagueRequirementsEvidence", "freezeAuthorized", "formationAuthorized", "holdoutAuthorized", "counted", "public", "productionAuthorized", "signatureBase64", "root"])) return fail("SOURCE_GATE_KEYS")
  const { signatureBase64, root: gateRoot, ...fields } = gate
  if (gate.schemaVersion !== "diagnostic-one-cell-source-gate-v3" || gate.reviewPath !== ONE_CELL_REVIEW_PATH || gate.receiptPath !== ONE_CELL_RECEIPT_PATH || gate.actionableFindings !== 0 || gate.commandsPassed !== true || gate.historicalContinuity !== true || [gate.empiricalAuthority, gate.runAllowed, gate.leagueRequirementsEvidence, gate.freezeAuthorized, gate.formationAuthorized, gate.holdoutAuthorized, gate.counted, gate.public, gate.productionAuthorized].some((value) => value !== false) || !root(gateRoot) || !root(gate.reviewSha256) || !root(gate.receiptSha256) || typeof signatureBase64 !== "string" || !/^[A-Za-z0-9+/]{86}==$/u.test(signatureBase64)) return fail("SOURCE_GATE_FIELDS")
  const closure = oneCellSourceClosure(read)
  if (!same(gate.sourceFiles, closure.sourceFiles) || gate.sourceClosureRoot !== closure.sourceClosureRoot || sha(read(ONE_CELL_REVIEW_PATH)) !== gate.reviewSha256 || sha(read(ONE_CELL_RECEIPT_PATH)) !== gate.receiptSha256) return fail("SOURCE_GATE_DRIFT")
  const fingerprint = sha(createPublicKey(ONE_CELL_REVIEWER_PUBLIC_KEY_PEM).export({ type: "spki", format: "der" }) as Buffer)
  const reviewText = Buffer.from(read(ONE_CELL_REVIEW_PATH)).toString("utf8")
  if (!reviewText.includes(closure.sourceClosureRoot) || !reviewText.includes(`Reviewer: ${gate.reviewerId}`) || !reviewText.includes("Actionable findings: 0") || !reviewText.includes(`Public key fingerprint: ${fingerprint}`) || gate.reviewerId === gate.authorId) return fail("SOURCE_GATE_REVIEW")
  const receipt = JSON.parse(Buffer.from(read(ONE_CELL_RECEIPT_PATH)).toString("utf8")) as unknown
  if (!exact(receipt, ["schemaVersion", "sourceClosureRoot", "commands", "historicalV1Root", "historicalV2GateRoot", "complete", "root"]) || receipt.schemaVersion !== "diagnostic-one-cell-command-receipt-v3" || receipt.sourceClosureRoot !== closure.sourceClosureRoot || receipt.historicalV2GateRoot !== "sha256:5cf7974145be0fd6d665dc28127aa83fff1b29ce1749dc5b2d6dc4d04bdad6d1" || !root(receipt.historicalV1Root) || receipt.complete !== true || !Array.isArray(receipt.commands)) return fail("SOURCE_GATE_RECEIPT")
  const commands = oneCellRequiredGateCommands()
  if (receipt.commands.length !== commands.length || receipt.commands.some((entry, index) => !exact(entry, ["command", "exitCode", "testCount"]) || entry.command !== commands[index] || entry.exitCode !== 0 || !Number.isSafeInteger(entry.testCount) || (entry.testCount as number) < (new Set([0, 1, 11]).has(index) ? 1 : 0))) return fail("SOURCE_GATE_COMMANDS")
  const { root: receiptRoot, ...receiptBody } = receipt
  if (receiptRoot !== labRoot("diagnostic-one-cell-command-receipt-v3", receiptBody)) return fail("SOURCE_GATE_RECEIPT_ROOT")
  if (!verifySignature(null, oneCellGateSigningPayload(fields), createPublicKey(ONE_CELL_REVIEWER_PUBLIC_KEY_PEM), Buffer.from(signatureBase64, "base64"))) return fail("SOURCE_GATE_SIGNATURE")
  if (gateRoot !== labRoot("diagnostic-one-cell-source-gate-v3", { ...fields, signatureBase64 })) return fail("SOURCE_GATE_ROOT")
  const prior = checkOneCellHistoricalSourceOnly()
  if (prior.historicalV2GateRoot !== receipt.historicalV2GateRoot || prior.historicalV1Root !== receipt.historicalV1Root) return fail("SOURCE_GATE_HISTORY")
  return Object.freeze({ ...gate, root: gateRoot, sourceClosureRoot: closure.sourceClosureRoot, empiricalAuthority: false as const, runAllowed: false as const })
}

const exactDestinations = Object.freeze({ allocation: DIAGNOSTIC_ONE_CELL_ALLOCATION_PATH, allocationPending: ONE_CELL_ALLOCATION_PENDING_PATH, prepareSelectorAttempt: ONE_CELL_SELECTOR_ATTEMPT_PATHS.prepare, preflightAttempt: DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH, preflightSelectorAttempt: ONE_CELL_SELECTOR_ATTEMPT_PATHS.preflight, preflightDisposition: DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH, preflightPending: ONE_CELL_PREFLIGHT_PENDING_PATH, runSelectorAttempt: ONE_CELL_SELECTOR_ATTEMPT_PATHS.run, result: DIAGNOSTIC_ONE_CELL_RESULT_PATH, resultPending: ONE_CELL_RESULT_PENDING_PATH, prepareParentPermit: ONE_CELL_PARENT_PERMIT_PATHS.prepare, preflightParentPermit: ONE_CELL_PARENT_PERMIT_PATHS.preflight, runParentPermit: ONE_CELL_PARENT_PERMIT_PATHS.run, preparePublisherReceipt: ONE_CELL_PUBLISHER_RECEIPT_PATHS.prepare, preflightPublisherReceipt: ONE_CELL_PUBLISHER_RECEIPT_PATHS.preflight, runPublisherReceipt: ONE_CELL_PUBLISHER_RECEIPT_PATHS.run, store: DIAGNOSTIC_ONE_CELL_STORE })
const exactBounds = Object.freeze({ cellMilliseconds: 240_000, overallMilliseconds: 600_000, cleanupReserveMilliseconds: 30_000, maxChargedCells: 1, retries: 0, evidenceClass: "diagnostic_only", privacy: "private_offline", leagueRequirementsEvidence: false, freezeAuthorized: false, formationAuthorized: false, holdoutAuthorized: false, counted: false, public: false, productionAuthorized: false })
const oneCellCanonicalPath = (selector: OneCellLiveSelector): string => selector === "prepare" ? DIAGNOSTIC_ONE_CELL_ALLOCATION_PATH : selector === "preflight" ? DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH : DIAGNOSTIC_ONE_CELL_RESULT_PATH
const oneCellPendingPath = (selector: OneCellLiveSelector): string => selector === "prepare" ? ONE_CELL_ALLOCATION_PENDING_PATH : selector === "preflight" ? ONE_CELL_PREFLIGHT_PENDING_PATH : ONE_CELL_RESULT_PENDING_PATH
const validOneCellTranscript = (selector: OneCellLiveSelector, status: "finished" | "prestart_denied", stages: readonly OneCellLiveStage[]): boolean => {
  const required = ONE_CELL_REQUIRED_STAGES[selector]
  if (status === "finished") return same(stages, required)
  if (selector !== "preflight" || !same(stages.slice(0, 4), required.slice(0, 4)) || stages.at(-1) !== "publication") return false
  const host = stages.slice(4, -1)
  return host.length >= 1 && host.length <= 3 && same(host, required.slice(4, 4 + host.length))
}
export const createOneCellParentPermit = (input: { readonly selector: OneCellLiveSelector; readonly status: "finished" | "prestart_denied"; readonly token: string; readonly gateRoot: LabRoot; readonly authorizationRoot: LabRoot; readonly allocationRoot: LabRoot; readonly context: OneCellPublisherInstruction }) => {
  const { selector, status, token, gateRoot, authorizationRoot, allocationRoot, context } = input
  if (!/^[a-f0-9-]{36}$/u.test(token) || !root(gateRoot) || !root(authorizationRoot) || !root(allocationRoot) || !root(context.pendingRoot) || !Number.isSafeInteger(context.childElapsedMilliseconds) || context.childElapsedMilliseconds < 0 || context.childElapsedMilliseconds > (selector === "run" ? 600_000 : 300_000) || !Number.isSafeInteger(context.parentElapsedBeforePublisherMilliseconds) || context.parentElapsedBeforePublisherMilliseconds < context.childElapsedMilliseconds || context.parentElapsedBeforePublisherMilliseconds > (selector === "run" ? 600_000 : 330_000) - 5_000 || !validOneCellTranscript(selector, status, context.stageTranscript)) return fail("PARENT_PERMIT_FIELDS")
  const fields = { schemaVersion: "diagnostic-one-cell-parent-permit-v3" as const, selector, status, token, gateRoot, authorizationRoot, allocationRoot, pendingRoot: context.pendingRoot, stageTranscript: [...context.stageTranscript], stageTranscriptRoot: labRoot("diagnostic-one-cell-stage-transcript-v3", context.stageTranscript), childElapsedMilliseconds: context.childElapsedMilliseconds, parentElapsedBeforePublisherMilliseconds: context.parentElapsedBeforePublisherMilliseconds, childExitCode: 0 as const, finalIpc: true as const }
  return Object.freeze({ ...fields, root: labRoot("diagnostic-one-cell-parent-permit-v3", fields) })
}
export const createOneCellPublisherReceipt = (permit: ReturnType<typeof createOneCellParentPermit>, canonicalRoot: LabRoot, publisherElapsedMilliseconds: number) => {
  const deadlineMilliseconds = permit.selector === "run" ? 600_000 : 330_000
  if (!root(canonicalRoot) || canonicalRoot !== permit.pendingRoot || !Number.isSafeInteger(publisherElapsedMilliseconds) || publisherElapsedMilliseconds < 0 || publisherElapsedMilliseconds > 25_000 || permit.parentElapsedBeforePublisherMilliseconds + publisherElapsedMilliseconds > deadlineMilliseconds - 5_000) return fail("PUBLISHER_RECEIPT_DEADLINE")
  const fields = { schemaVersion: "diagnostic-one-cell-publisher-receipt-v3" as const, selector: permit.selector, status: permit.status, permitRoot: permit.root, token: permit.token, pendingRoot: permit.pendingRoot, canonicalRoot, canonicalPath: oneCellCanonicalPath(permit.selector), publisherElapsedMilliseconds, overallCommitBoundMilliseconds: deadlineMilliseconds, fsyncComplete: true as const }
  return Object.freeze({ ...fields, root: labRoot("diagnostic-one-cell-publisher-receipt-v3", fields) })
}
/** Called only after the canonical file and directory fsync returned. A slow
 * canonical fsync makes receipt creation impossible, leaving an ineligible
 * permit+canonical without a commit-point receipt. */
export const prepareOneCellPublisherReceiptAfterCanonicalFsync = (permit: ReturnType<typeof createOneCellParentPermit>, canonicalRoot: LabRoot, publisherStartedAt: number, now: () => number = () => performance.now()) => createOneCellPublisherReceipt(permit, canonicalRoot, Math.ceil(now() - publisherStartedAt))
/** Shared selector publication order. Caller has already authenticated the
 * exact pending bytes; only a completed receipt is an eligible commit. */
export const publishOneCellCommitSequence = (permit: ReturnType<typeof createOneCellParentPermit>, canonicalRoot: LabRoot, publisherStartedAt: number, operations: {
  readonly recheckPending: () => LabRoot
  readonly writePermit: () => void
  readonly writeCanonicalAndFsync: () => void
  readonly writeReceiptAndFsync: (receipt: ReturnType<typeof createOneCellPublisherReceipt>) => void
  readonly now?: () => number
}): void => {
  if (operations.recheckPending() !== canonicalRoot || canonicalRoot !== permit.pendingRoot) return fail("PUBLISHER_PENDING_RECHECK")
  operations.writePermit()
  operations.writeCanonicalAndFsync()
  const receipt = prepareOneCellPublisherReceiptAfterCanonicalFsync(permit, canonicalRoot, publisherStartedAt, operations.now)
  operations.writeReceiptAndFsync(receipt)
}
export const requireOneCellPublisherCommit = (selector: OneCellLiveSelector, canonicalRoot: LabRoot, gateRoot: LabRoot, authorizationRoot: LabRoot, allocationRoot: LabRoot): ReturnType<typeof createOneCellPublisherReceipt> => {
  const rawPermit = readExact(ONE_CELL_PARENT_PERMIT_PATHS[selector], ONE_CELL_PARENT_PERMIT_PATHS[selector])
  if (!exact(rawPermit, ["schemaVersion", "selector", "status", "token", "gateRoot", "authorizationRoot", "allocationRoot", "pendingRoot", "stageTranscript", "stageTranscriptRoot", "childElapsedMilliseconds", "parentElapsedBeforePublisherMilliseconds", "childExitCode", "finalIpc", "root"])) return fail("PARENT_PERMIT_KEYS")
  const context = { pendingRoot: rawPermit.pendingRoot as LabRoot, stageTranscript: rawPermit.stageTranscript as readonly OneCellLiveStage[], childElapsedMilliseconds: rawPermit.childElapsedMilliseconds as number, parentElapsedBeforePublisherMilliseconds: rawPermit.parentElapsedBeforePublisherMilliseconds as number }
  const expectedPermit = createOneCellParentPermit({ selector, status: rawPermit.status as "finished" | "prestart_denied", token: rawPermit.token as string, gateRoot, authorizationRoot, allocationRoot, context })
  if (!same(rawPermit, expectedPermit) || expectedPermit.pendingRoot !== canonicalRoot) return fail("PARENT_PERMIT_MISMATCH")
  const rawReceipt = readExact(ONE_CELL_PUBLISHER_RECEIPT_PATHS[selector], ONE_CELL_PUBLISHER_RECEIPT_PATHS[selector])
  if (!exact(rawReceipt, ["schemaVersion", "selector", "status", "permitRoot", "token", "pendingRoot", "canonicalRoot", "canonicalPath", "publisherElapsedMilliseconds", "overallCommitBoundMilliseconds", "fsyncComplete", "root"])) return fail("PUBLISHER_RECEIPT_KEYS")
  const expectedReceipt = createOneCellPublisherReceipt(expectedPermit, canonicalRoot, rawReceipt.publisherElapsedMilliseconds as number)
  if (!same(rawReceipt, expectedReceipt)) return fail("PUBLISHER_RECEIPT_MISMATCH")
  return expectedReceipt
}
const prospectiveAllocation = (gate: { readonly root: LabRoot; readonly sourceClosureRoot: LabRoot }) => createDiagnosticOneCellAllocation({ sourceClosureRoot: gate.sourceClosureRoot, implementationRoot: gate.sourceClosureRoot, gateRoot: gate.root, oldEvidenceBaseline: readDiagnosticPilotOldEvidenceBaseline() })
export const oneCellOperatorLiteral = (gate: { readonly root: LabRoot; readonly sourceClosureRoot: LabRoot }): string => {
  const allocation = prospectiveAllocation(gate)
  return `Authorize exactly one private Phase 265 S01/S03 Smoke one-cell v3 diagnostic over source ${gate.sourceClosureRoot}, gate ${gate.root}, allocation ${allocation.root}, seed ${DIAGNOSTIC_ONE_CELL_SEED}, condition ${allocation.cells[0].conditionId}, request ${allocation.cells[0].requestIdentity}; 240000-ms cell, 600000-ms run entry, 30000-ms cleanup reserve, zero retries; destinations ${Object.values(exactDestinations).join(",")}; no LEAG, freeze, formation, holdout, counted, public or production authority.`
}
export const createOneCellOperatorAuthorization = (gate: { readonly root: LabRoot; readonly sourceClosureRoot: LabRoot }, literal: string) => {
  if (!root(gate.root) || !root(gate.sourceClosureRoot) || literal !== oneCellOperatorLiteral(gate)) return fail("OPERATOR_LITERAL")
  const fields = { schemaVersion: "diagnostic-one-cell-operator-authorization-v3" as const, operatorId: "roryquinlan-repository-operator" as const, literal, sourceGateRoot: gate.root, sourceClosureRoot: gate.sourceClosureRoot, allocationRoot: prospectiveAllocation(gate).root, bounds: exactBounds, destinations: exactDestinations, singleUse: true as const }
  return Object.freeze({ ...fields, root: labRoot("diagnostic-one-cell-operator-authorization-v3", fields) })
}
const requireOneCellAuthorization = (gate: ReturnType<typeof checkOneCellSourceGate>, path: string = ONE_CELL_AUTHORIZATION_PATH) => {
  const value = readExact(path, ONE_CELL_AUTHORIZATION_PATH)
  if (!exact(value, ["schemaVersion", "operatorId", "literal", "sourceGateRoot", "sourceClosureRoot", "allocationRoot", "bounds", "destinations", "singleUse", "root"])) return fail("OPERATOR_AUTHORIZATION_KEYS")
  const expected = createOneCellOperatorAuthorization(gate, value.literal as string)
  if (!same(value, expected)) return fail("OPERATOR_AUTHORIZATION_MISMATCH")
  return expected
}
export const createOneCellSelectorAttempt = (selector: OneCellLiveSelector, gate: { readonly root: LabRoot; readonly sourceClosureRoot: LabRoot }, authorization: ReturnType<typeof createOneCellOperatorAuthorization>, allocationRoot: LabRoot) => {
  if (!["prepare", "preflight", "run"].includes(selector) || !root(gate.root) || !root(gate.sourceClosureRoot) || !root(allocationRoot) || authorization.sourceGateRoot !== gate.root || authorization.sourceClosureRoot !== gate.sourceClosureRoot || authorization.allocationRoot !== allocationRoot || authorization.literal !== oneCellOperatorLiteral(gate)) return fail("SELECTOR_ATTEMPT_FIELDS")
  const fields = { schemaVersion: "diagnostic-one-cell-selector-attempt-v3" as const, selector, gateRoot: gate.root, sourceClosureRoot: gate.sourceClosureRoot, authorizationRoot: authorization.root, operatorLiteralSha256: sha(Buffer.from(authorization.literal, "utf8")), allocationRoot, exclusive: true as const }
  return Object.freeze({ ...fields, root: labRoot("diagnostic-one-cell-selector-attempt-v3", fields) })
}
const requireOneCellSelectorAttempt = (selector: OneCellLiveSelector, gate: { readonly root: LabRoot; readonly sourceClosureRoot: LabRoot }, authorization: ReturnType<typeof createOneCellOperatorAuthorization>, allocationRoot: LabRoot) => {
  const expected = createOneCellSelectorAttempt(selector, gate, authorization, allocationRoot)
  if (!same(readExact(ONE_CELL_SELECTOR_ATTEMPT_PATHS[selector], ONE_CELL_SELECTOR_ATTEMPT_PATHS[selector]), expected)) return fail("SELECTOR_ATTEMPT_MISMATCH")
  return expected
}
const writeOneCellSelectorAttempt = (selector: OneCellLiveSelector) => {
  const gate = checkOneCellSourceGate(), authorization = requireOneCellAuthorization(gate)
  const allocation = selector === "prepare" ? prospectiveAllocation(gate) : readOneCellAllocation(gate)
  if (selector === "run") {
    const preflight = readOneCellPreflight(allocation, authorization.root)
    requireAdmittedOneCellPreflight(allocation, authorization.root, preflight.attempt, preflight.disposition)
  }
  const attempt = createOneCellSelectorAttempt(selector, gate, authorization, allocation.root)
  durableCreate(ONE_CELL_SELECTOR_ATTEMPT_PATHS[selector], attempt)
  return attempt.root
}
interface OneCellLatchHost {
  readonly spawn: (token: string, selector: OneCellLiveSelector) => ChildProcess
  readonly killGroup: (pid: number, child: ChildProcess) => void
}
const defaultOneCellLatchHost: OneCellLatchHost = {
  spawn: (token, selector) => spawn(resolve("node_modules/.bin/tsx"), [fileURLToPath(import.meta.url), "--internal-latch-v3", token, selector], { stdio: ["ignore", "pipe", "pipe", "ipc"], env: { PATH: process.env.PATH ?? "", TMPDIR: process.env.TMPDIR ?? "" }, shell: false, detached: true, windowsHide: true }),
  killGroup: (pid, child) => { try { process.kill(-pid, "SIGKILL") } catch { try { child.kill("SIGKILL") } catch { /* attempt state remains unknown */ } } },
}
/** A selector is consumed before any live child starts. Crash or lost IPC after
 * the exclusive fsynced latch leaves the route consumed, not retryable. */
export const superviseOneCellSelectorAttempt = async (selector: OneCellLiveSelector, milliseconds: number, host: OneCellLatchHost = defaultOneCellLatchHost): Promise<boolean> => {
  if (!["prepare", "preflight", "run"].includes(selector) || !Number.isSafeInteger(milliseconds) || milliseconds < 1 || milliseconds > 40_000) return false
  const token = randomUUID(), child = host.spawn(token, selector)
  if (!child.pid || child.pid < 2) return false
  let settled = false, timedOut = false, ready = false, complete = false, exitCode: number | null = null, outputBytes = 0
  const kill = () => { if (settled || timedOut) return; timedOut = true; host.killGroup(child.pid!, child) }
  await new Promise<void>((resolveOutcome) => {
    const timer = setTimeout(kill, Math.max(1, milliseconds - 50))
    const finish = () => { if (settled) return; settled = true; clearTimeout(timer); resolveOutcome() }
    const drain = (bytes: Buffer) => { outputBytes += bytes.length; if (outputBytes > 4096) kill() }
    child.stdout?.on("data", drain); child.stderr?.on("data", drain)
    child.on("error", finish); child.on("exit", (code) => { exitCode = code; finish() })
    child.on("message", (message: unknown) => {
      if (exact(message, ["kind", "token"]) && message.kind === "latch-ready" && message.token === token && !ready) { ready = true; child.send({ kind: "latch-go", token }, (error) => { if (error) kill() }); return }
      if (exact(message, ["kind", "token", "root"]) && message.kind === "latch-complete" && message.token === token && root(message.root) && ready && !complete) { complete = true; return }
      kill()
    })
  })
  return !timedOut && exitCode === 0 && ready && complete
}
const waitOneCellLatchPermission = (token: string): Promise<void> => new Promise((resolveGo, rejectGo) => {
  if (!process.send || !process.connected) { rejectGo(new TypeError("DIAGNOSTIC_ONE_CELL_CLI_LATCH_PARENT")); return }
  const timer = setTimeout(() => { process.off("message", receive); rejectGo(new TypeError("DIAGNOSTIC_ONE_CELL_CLI_LATCH_PERMISSION_TIMEOUT")) }, 5_000)
  const receive = (message: unknown) => {
    clearTimeout(timer); process.off("message", receive)
    if (!exact(message, ["kind", "token"]) || message.kind !== "latch-go" || message.token !== token) { rejectGo(new TypeError("DIAGNOSTIC_ONE_CELL_CLI_LATCH_PERMISSION")); return }
    resolveGo()
  }
  process.on("message", receive)
  process.send({ kind: "latch-ready", token })
})
const readOneCellAllocation = (gate: ReturnType<typeof checkOneCellSourceGate>, path: string = DIAGNOSTIC_ONE_CELL_ALLOCATION_PATH) => {
  const allocation = admitDiagnosticOneCellAllocation(readExact(path, DIAGNOSTIC_ONE_CELL_ALLOCATION_PATH))
  if (allocation.sourceClosureRoot !== gate.sourceClosureRoot || allocation.implementationRoot !== gate.sourceClosureRoot || allocation.gateRoot !== gate.root || !same(allocation.oldEvidenceBaseline, readDiagnosticPilotOldEvidenceBaseline())) return fail("ALLOCATION_GATE_HISTORY")
  const authorization = requireOneCellAuthorization(gate)
  requireOneCellSelectorAttempt("prepare", gate, authorization, allocation.root)
  const commit = requireOneCellPublisherCommit("prepare", allocation.root, gate.root, authorization.root, allocation.root)
  if (commit.status !== "finished") return fail("ALLOCATION_PUBLISHER_STATUS")
  return allocation
}
const readOneCellPreflight = (allocation: DiagnosticOneCellAllocation, authorizationRoot: LabRoot) => {
  const attempt = readExact(DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH, DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH)
  const disposition = readExact(DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH, DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH)
  const expected = createOneCellPreflightAttempt(allocation, authorizationRoot)
  if (!same(attempt, expected)) return fail("PREFLIGHT_ATTEMPT")
  const admitted = admitOneCellPreflightDisposition(expected, disposition)
  const gate = checkOneCellSourceGate(), authorization = requireOneCellAuthorization(gate)
  if (authorization.root !== authorizationRoot) return fail("PREFLIGHT_AUTHORIZATION")
  requireOneCellSelectorAttempt("preflight", gate, authorization, allocation.root)
  const commit = requireOneCellPublisherCommit("preflight", admitted.root, allocation.gateRoot, authorizationRoot, allocation.root)
  if ((commit.status === "finished") !== (admitted.status === "admitted")) return fail("PREFLIGHT_PUBLISHER_STATUS")
  return { attempt: expected, disposition: admitted }
}

export interface OneCellHostObservation { readonly fileSystemBytes: string; readonly fileSystemInodes: string; readonly memoryBasisPoints: number; readonly memoryAvailableBytes: number; readonly dockerCpus: number; readonly dockerMemoryBytes: number; readonly imageDigest: LabRoot; readonly architecture: "amd64"; readonly ownedNameCollisions: 0; readonly readerMilliseconds: number }
export interface OneCellHostProbe {
  readonly fileSystem: () => { readonly bavail: bigint; readonly bsize: bigint; readonly ffree: bigint }
  readonly memory: () => { readonly ok: boolean; readonly basisPoints: number; readonly availableBytes: number }
  readonly docker: (args: readonly string[], timeoutMs: number) => Promise<{ readonly status: number | null; readonly stdout: string; readonly stderr: string; readonly signal: string | null; readonly error: boolean }>
  readonly readCandidates: () => number
}
const defaultDocker = (args: readonly string[], timeoutMs: number): ReturnType<OneCellHostProbe["docker"]> => new Promise((resolveCommand) => {
  const child = spawn("docker", [...args], { env: { PATH: process.env.PATH ?? "" }, stdio: ["ignore", "pipe", "pipe"], shell: false, windowsHide: true })
  let stdout = "", stderr = "", error = false, settled = false
  const timer = setTimeout(() => { if (settled) return; settled = true; error = true; child.kill("SIGKILL"); resolveCommand({ status: null, stdout, stderr, signal: "SIGKILL", error }) }, timeoutMs)
  child.stdout?.on("data", (data: Buffer) => { stdout += data.toString("utf8"); if (stdout.length > 4096) { error = true; child.kill("SIGKILL") } })
  child.stderr?.on("data", (data: Buffer) => { stderr += data.toString("utf8"); if (stderr.length > 4096) { error = true; child.kill("SIGKILL") } })
  child.on("error", () => { error = true })
  child.on("close", (status, signal) => { if (settled) return; settled = true; clearTimeout(timer); resolveCommand({ status, stdout, stderr, signal, error }) })
})
const defaultProbe: OneCellHostProbe = {
  fileSystem: () => statfsSync(resolve(".strategy-lab"), { bigint: true }),
  memory: () => {
    const request = MEMORY_PRESSURE_Q_REQUEST
    const result = spawnSync(request.executable, [...request.args], { env: { ...request.env }, stdio: ["ignore", "pipe", "pipe"], shell: false, timeout: request.timeoutMilliseconds, maxBuffer: request.maximumOutputBytes })
    const parsed = parseMemoryPressureQ({ stdout: result.stdout, stderr: result.stderr, exitCode: result.status, signal: result.signal, timedOut: (result.error as NodeJS.ErrnoException | undefined)?.code === "ETIMEDOUT" })
    return parsed.ok ? { ok: true, basisPoints: parsed.observation.observedBasisPoints, availableBytes: Math.floor(parsed.observation.totalBytes * parsed.observation.percentage / 100) } : { ok: false, basisPoints: 0, availableBytes: 0 }
  },
  docker: defaultDocker,
  readCandidates: () => { const began = performance.now(); readDiagnosticPilotAssessedPair(createFactoryRepository(DIAGNOSTIC_PILOT_PHASE264_STORE)); return Math.ceil(performance.now() - began) },
}
/** All probes are injected in tests; only approved live selectors pass the
 * default implementation. A timeout or unknown observation is denial. */
export const observeOneCellHost = async (allocation: DiagnosticOneCellAllocation, probe: OneCellHostProbe = defaultProbe, stage: OneCellStageRunner = directOneCellStage): Promise<OneCellHostObservation> => {
  const readerMilliseconds = await stage("reader", () => timedOneCellSync(ONE_CELL_OPERATION_BUDGET.readerMilliseconds, "READER_DEADLINE", probe.readCandidates))
  if (!Number.isSafeInteger(readerMilliseconds) || readerMilliseconds < 0 || readerMilliseconds > ONE_CELL_OPERATION_BUDGET.readerMilliseconds) return fail("READER_CEILING")
  const fs = await stage("filesystem", () => timedOneCellSync(ONE_CELL_OPERATION_BUDGET.filesystemMilliseconds, "FILESYSTEM_DEADLINE", probe.fileSystem)), bytes = fs.bavail * fs.bsize, inodes = fs.ffree
  if (bytes < BigInt(DIAGNOSTIC_ONE_CELL_CAPACITY.maxBytes + DIAGNOSTIC_ONE_CELL_CAPACITY.terminalReserveBytes) || inodes < BigInt(DIAGNOSTIC_ONE_CELL_CAPACITY.maxInodes + DIAGNOSTIC_ONE_CELL_CAPACITY.terminalReserveInodes)) return fail("FILESYSTEM_CAPACITY")
  return stage("memory_docker", async () => {
  const memoryDockerStartedAt = performance.now()
  const memory = timedOneCellSync(ONE_CELL_OPERATION_BUDGET.memoryDockerMilliseconds, "MEMORY_DOCKER_DEADLINE", probe.memory)
  if (!memory.ok || !Number.isSafeInteger(memory.basisPoints) || memory.basisPoints < 2500 || !Number.isSafeInteger(memory.availableBytes) || memory.availableBytes < 1_073_741_824) return fail("MEMORY_CAPACITY")
  const docker = (args: readonly string[], timeoutMs: number) => timedOneCellAsync(timeoutMs, "DOCKER_DEADLINE", () => probe.docker(args, timeoutMs))
  const info = await docker(["info", "--format", "{{.NCPU}}|{{.MemTotal}}"], 5_000)
  if (info.error || info.signal !== null || info.status !== 0 || info.stderr !== "" || !/^[0-9]+\|[0-9]+\n?$/u.test(info.stdout)) return fail("DOCKER_INFO")
  const [dockerCpus, dockerMemoryBytes] = info.stdout.trim().split("|").map(Number)
  if (!Number.isSafeInteger(dockerCpus) || dockerCpus < 2 || !Number.isSafeInteger(dockerMemoryBytes) || dockerMemoryBytes < 268_435_456) return fail("DOCKER_PROFILE")
  const image = await docker(["image", "inspect", "--format", "{{.Id}}|{{.Architecture}}", allocation.image], 5_000)
  if (image.error || image.signal !== null || image.status !== 0 || image.stderr !== "" || !/^sha256:[0-9a-f]{64}\|amd64\n?$/u.test(image.stdout)) return fail("DOCKER_IMAGE")
  const cell = createDiagnosticOneCellCell(allocation, 0)
  for (const seat of ["bottom", "top"] as const) {
    const { containerName } = diagnosticOneCellContainerIdentity(allocation, cell, seat)
    const observed = await docker(["inspect", "--format", '{{index .Config.Labels "v1.38-lean-owner"}}', containerName], 2_000)
    if (observed.error || observed.signal !== null || observed.status !== 1 || !["", "\n"].includes(observed.stdout) || ![`Error: No such object: ${containerName}\n`, `error: no such object: ${containerName}\n`].includes(observed.stderr)) return fail("OWNED_NAME_COLLISION")
  }
  withinOneCellBudget(memoryDockerStartedAt, ONE_CELL_OPERATION_BUDGET.memoryDockerMilliseconds, "MEMORY_DOCKER_DEADLINE")
  return Object.freeze({ fileSystemBytes: bytes.toString(), fileSystemInodes: inodes.toString(), memoryBasisPoints: memory.basisPoints, memoryAvailableBytes: memory.availableBytes, dockerCpus: dockerCpus!, dockerMemoryBytes: dockerMemoryBytes!, imageDigest: image.stdout.trim().split("|")[0] as LabRoot, architecture: "amd64" as const, ownedNameCollisions: 0 as const, readerMilliseconds })
  })
}
const denialCode = (error: unknown): Extract<OneCellPreflightObservation, { denialCode: string }>["denialCode"] => {
  if (!(error instanceof Error)) return "unknown"
  if (/SOURCE|GATE|AUTH/u.test(error.message)) return "source"
  if (/HISTORY|OLD_EVIDENCE/u.test(error.message)) return "history"
  if (/CANDIDATE|READER/u.test(error.message)) return "candidate"
  if (/MEMORY/u.test(error.message)) return "memory"
  if (/FILESYSTEM|CAPACITY/u.test(error.message)) return "filesystem"
  if (/DOCKER|OWNED_NAME/u.test(error.message)) return "docker"
  if (/TIMEOUT|DEADLINE/u.test(error.message)) return "timeout"
  return "unknown"
}
/** The exclusive attempt fsync happens before `observe` is called. A failed
 * observation durably terminalizes denial; a write failure leaves attempt-only
 * uncertainty that never passes readOneCellPreflight. */
export const executeOneCellPreflightOnce = async (allocation: DiagnosticOneCellAllocation, authorizationRoot: LabRoot, observe: () => Promise<OneCellHostObservation>, paths: { readonly attempt: string; readonly disposition: string } = { attempt: DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH, disposition: DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH }, stage: OneCellStageRunner = directOneCellStage) => {
  if (resolve(paths.attempt) !== resolve(DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH) || ![DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH, ONE_CELL_PREFLIGHT_PENDING_PATH].some((path) => resolve(paths.disposition) === resolve(path))) return fail("PREFLIGHT_PATHS")
  const attempt = createOneCellPreflightAttempt(allocation, authorizationRoot)
  await stage("attempt", () => durableCreate(paths.attempt, attempt))
  let disposition: OneCellPreflightDisposition
  try { disposition = createOneCellPreflightDisposition(attempt, { status: "admitted", observation: await observe() }) }
  catch (error) { disposition = createOneCellPreflightDisposition(attempt, { status: "prestart_denied", observation: { denialCode: denialCode(error) } }) }
  await stage("publication", () => durableCreate(paths.disposition, disposition))
  return disposition
}
const parseExactFlags = (args: readonly string[], required: readonly [string, string][]) => {
  if (args.length !== required.length * 2) return fail("ARGUMENTS")
  for (let index = 0; index < required.length; index++) if (args[2 * index] !== `--${required[index]![0]}` || resolve(args[2 * index + 1]!) !== resolve(required[index]![1])) return fail("EXACT_PATH_FLAGS")
}
const prepareOneCell = async (authorizationPath: string, gatePath: string, stage: OneCellStageRunner = directOneCellStage) => {
  const gate = await stage("source", () => checkOneCellSourceGate(gatePath))
  const authorization = await stage("approval", () => requireOneCellAuthorization(gate, authorizationPath))
  const history = await stage("history", checkOneCellHistoricalSourceOnly)
  const allocation = createDiagnosticOneCellAllocation({ sourceClosureRoot: gate.sourceClosureRoot, implementationRoot: gate.sourceClosureRoot, gateRoot: gate.root, oldEvidenceBaseline: history.oldEvidenceBaseline })
  if (authorization.allocationRoot !== allocation.root || !same(authorization.destinations, exactDestinations) || !same(authorization.bounds, exactBounds)) return fail("AUTHORIZATION_SCOPE")
  await stage("reservation", () => durableCreate(ONE_CELL_ALLOCATION_PENDING_PATH, allocation))
  return allocation
}
const checkOneCellPreflightContract = (authorizationPath: string, allocationPath: string, gatePath: string, attemptPath: string, dispositionPath: string) => {
  const gate = checkOneCellSourceGate(gatePath), authorization = requireOneCellAuthorization(gate, authorizationPath)
  const allocation = readOneCellAllocation(gate, allocationPath)
  if (resolve(attemptPath) !== resolve(DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH) || resolve(dispositionPath) !== resolve(DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH)) return fail("PREFLIGHT_PATHS")
  const history = checkOneCellHistoricalSourceOnly()
  if (!same(allocation.oldEvidenceBaseline, history.oldEvidenceBaseline)) return fail("PREFLIGHT_HISTORY")
  return readOneCellPreflight(allocation, authorization.root)
}

const absentDockerObject = (value: Awaited<ReturnType<OneCellHostProbe["docker"]>>, name: string): boolean => !value.error && value.signal === null && value.status === 1 && ["", "\n"].includes(value.stdout) && [`Error: No such object: ${name}\n`, `error: no such object: ${name}\n`].includes(value.stderr)
const cleanupOneCellExactOwners = async (allocation: DiagnosticOneCellAllocation, cell: DiagnosticOneCellCell, docker: OneCellHostProbe["docker"] = defaultDocker): Promise<boolean> => {
  for (const seat of ["bottom", "top"] as const) {
    const { containerName, ownershipLabel } = diagnosticOneCellContainerIdentity(allocation, cell, seat)
    const inspect = () => docker(["inspect", "--format", '{{index .Config.Labels "v1.38-lean-owner"}}', containerName], 2_000)
    const before = await inspect()
    if (absentDockerObject(before, containerName)) continue
    if (before.error || before.signal !== null || before.status !== 0 || before.stderr !== "" || before.stdout.trim() !== ownershipLabel) return false
    const removed = await docker(["rm", "--force", containerName], 2_000)
    if (removed.error || removed.signal !== null || removed.status !== 0 || removed.stderr !== "") return false
    if (!absentDockerObject(await inspect(), containerName)) return false
  }
  return true
}
interface OneCellCleanupHost {
  readonly spawn: (token: string) => ChildProcess
  readonly killGroup: (pid: number, child: ChildProcess) => void
}
const defaultOneCellCleanupHost: OneCellCleanupHost = {
  spawn: (token) => spawn(resolve("node_modules/.bin/tsx"), [fileURLToPath(import.meta.url), "--internal-cleanup-v3", token], { stdio: ["ignore", "pipe", "pipe", "ipc"], env: { PATH: process.env.PATH ?? "", TMPDIR: process.env.TMPDIR ?? "" }, shell: false, detached: true, windowsHide: true }),
  killGroup: (pid, child) => { try { process.kill(-pid, "SIGKILL") } catch { try { child.kill("SIGKILL") } catch { /* unknown cleanup remains invalid */ } } },
}
/** Emergency cleanup never runs an in-process Git/fsync/host operation in the
 * outer parent. Only an exact owned process group is killed at this deadline. */
export const superviseOneCellEmergencyCleanup = async (milliseconds: number, host: OneCellCleanupHost = defaultOneCellCleanupHost): Promise<boolean> => {
  if (!Number.isSafeInteger(milliseconds) || milliseconds < 1 || milliseconds > 30_000) return false
  const token = randomUUID(), child = host.spawn(token)
  if (!child.pid || child.pid < 2) return false
  let settled = false, timedOut = false, ready = false, complete = false, exitCode: number | null = null, outputBytes = 0
  const kill = () => { if (settled || timedOut) return; timedOut = true; host.killGroup(child.pid!, child) }
  await new Promise<void>((resolveOutcome) => {
    const timer = setTimeout(kill, Math.max(1, milliseconds - 50))
    const finish = () => { if (settled) return; settled = true; clearTimeout(timer); resolveOutcome() }
    const drain = (bytes: Buffer) => { outputBytes += bytes.length; if (outputBytes > 4096) kill() }
    child.stdout?.on("data", drain); child.stderr?.on("data", drain)
    child.on("error", finish); child.on("exit", (code) => { exitCode = code; finish() })
    child.on("message", (message: unknown) => {
      if (exact(message, ["kind", "token"]) && message.kind === "cleanup-ready" && message.token === token && !ready) { ready = true; child.send({ kind: "cleanup-go", token }, (error) => { if (error) kill() }); return }
      if (exact(message, ["kind", "token", "clean"]) && message.kind === "cleanup-complete" && message.token === token && message.clean === true && ready && !complete) { complete = true; return }
      kill()
    })
  })
  return !timedOut && exitCode === 0 && ready && complete
}
const waitOneCellCleanupPermission = (token: string): Promise<void> => new Promise((resolveGo, rejectGo) => {
  if (!process.send || !process.connected) { rejectGo(new TypeError("DIAGNOSTIC_ONE_CELL_CLI_CLEANUP_PARENT")); return }
  const timer = setTimeout(() => { process.off("message", receive); rejectGo(new TypeError("DIAGNOSTIC_ONE_CELL_CLI_CLEANUP_PERMISSION_TIMEOUT")) }, 5_000)
  const receive = (message: unknown) => {
    clearTimeout(timer); process.off("message", receive)
    if (!exact(message, ["kind", "token"]) || message.kind !== "cleanup-go" || message.token !== token) { rejectGo(new TypeError("DIAGNOSTIC_ONE_CELL_CLI_CLEANUP_PERMISSION")); return }
    resolveGo()
  }
  process.on("message", receive)
  process.send({ kind: "cleanup-ready", token })
})
/** Read-only post-run cleanup confirmation; unlike cleanup, this never removes
 * even an exactly owned container. */
export const checkOneCellExactOwnersAbsent = async (allocation: DiagnosticOneCellAllocation, cell: DiagnosticOneCellCell, docker: OneCellHostProbe["docker"] = defaultDocker): Promise<boolean> => {
  for (const seat of ["bottom", "top"] as const) {
    const { containerName } = diagnosticOneCellContainerIdentity(allocation, cell, seat)
    if (!absentDockerObject(await timedOneCellAsync(2_000, "RETAINED_DOCKER_DEADLINE", () => docker(["inspect", "--format", '{{index .Config.Labels "v1.38-lean-owner"}}', containerName], 2_000)), containerName)) return false
  }
  return true
}
const oneCellAttemptedResult = (allocation: DiagnosticOneCellAllocation, authorizationRoot: LabRoot, preflightRoot: LabRoot) => {
  const fields = { schemaVersion: "diagnostic-one-cell-result-attempt-v3" as const, allocationRoot: allocation.root, authorizationRoot, gateRoot: allocation.gateRoot, preflightDispositionRoot: preflightRoot, chargedCount: "unknown" as const, maxChargedCells: 1 as const, processValidity: "process_invalid" as const, empiricalAuthority: false as const, runAllowed: false as const, leagueRequirementsEvidence: false as const, freezeAuthorized: false as const, formationAuthorized: false as const, holdoutAuthorized: false as const, counted: false as const, public: false as const, productionAuthorized: false as const }
  return Object.freeze({ ...fields, root: labRoot("diagnostic-one-cell-result-attempt-v3", fields) })
}
const waitForWorkerPermission = (allocation: DiagnosticOneCellAllocation, cell: DiagnosticOneCellCell, start: DiagnosticOneCellStart, token: string): Promise<void> => new Promise((resolvePermission, rejectPermission) => {
  const timeout = setTimeout(() => { process.off("message", receive); rejectPermission(new Error("DIAGNOSTIC_ONE_CELL_CLI_PERMISSION_TIMEOUT")) }, 5_000)
  const receive = (value: unknown) => {
    clearTimeout(timeout); process.off("message", receive)
    if (!exact(value, ["kind", "allocationRoot", "cellRoot", "startRoot", "token"]) || value.kind !== "cell-go" || value.allocationRoot !== allocation.root || value.cellRoot !== cell.root || value.startRoot !== start.root || value.token !== token) { rejectPermission(new Error("DIAGNOSTIC_ONE_CELL_CLI_PERMISSION_BINDING")); return }
    resolvePermission()
  }
  process.on("message", receive)
  process.send?.({ kind: "ready", ordinal: 0, startRoot: start.root })
})
const runOneCellWorkerLive = async (token: string): Promise<void> => {
  if (!process.send || !process.connected || !/^[a-f0-9-]{36}$/u.test(token)) return fail("WORKER_PARENT_IPC")
  const gate = checkOneCellSourceGate(), authorization = requireOneCellAuthorization(gate), allocation = readOneCellAllocation(gate)
  requireOneCellSelectorAttempt("run", gate, authorization, allocation.root)
  const preflight = readOneCellPreflight(allocation, authorization.root)
  requireAdmittedOneCellPreflight(allocation, authorization.root, preflight.attempt, preflight.disposition)
  const marker = oneCellAttemptedResult(allocation, authorization.root, preflight.disposition.root)
  if (!same(readExact(DIAGNOSTIC_ONE_CELL_RESULT_PATH, DIAGNOSTIC_ONE_CELL_RESULT_PATH), marker)) return fail("WORKER_ATTEMPT_MARKER")
  const cell = createDiagnosticOneCellCell(allocation, 0), start = createDiagnosticOneCellStart(allocation, cell)
  await waitForWorkerPermission(allocation, cell, start, token)
  const ledger = openDiagnosticOneCellLedger(DIAGNOSTIC_ONE_CELL_STORE)
  const cellStartedAt = performance.now()
  ledger.writeStart(start)
  process.send({ kind: "cell-started", ordinal: 0, startRoot: start.root })
  const repository = createFactoryRepository(DIAGNOSTIC_PILOT_PHASE264_STORE)
  const pair = readDiagnosticPilotAssessedPair(repository)
  const host: FactorySupervisedRuntimeHost = { createFactorySupervisedRuntime: ({ admission, sourceBytes, attemptRoot, budgetRoot, oneCellLifetimeGrant }) => {
    if (!oneCellLifetimeGrant) return fail("WORKER_GRANT")
    return createFactorySupervisedRuntime({ admission, sourceBytes, attemptRoot, budgetRoot, matchId: `one-cell-${cell.requestRoot.slice(7)}`, oneCellLifetimeGrant, factoryLifetimeMs: 240_000, containerName: oneCellLifetimeGrant.containerName, ownershipLabel: oneCellLifetimeGrant.ownershipLabel })
  } }
  const issue = (seat: "bottom" | "top") => {
    const candidateRoot = seat === "bottom" ? cell.bottomCandidateRoot : cell.topCandidateRoot
    const assessed = pair.find((entry) => entry.candidate.root === candidateRoot)
    if (!assessed) return fail("WORKER_CANDIDATE")
    const oneCellLifetimeGrant = createDiagnosticOneCellLifetimeGrant(ledger, allocation, cell, start, seat)
    return issueDiagnosticOneCellProviderFromFactoryCandidate({ host, factoryRepository: repository, ledger, allocation, cell, start, requestRoot: cell.requestRoot, assessed, oneCellLifetimeGrant })
  }
  const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === "arena:smoke:v1")
  if (!smoke) return fail("WORKER_ARENA")
  const match = { matchId: `one-cell-${cell.requestRoot.slice(7)}`, seed: allocation.seed, arenaVariant: smoke, bottomPlayerId: `league-${cell.bottomCandidateRoot.slice(7)}`, topPlayerId: `league-${cell.topCandidateRoot.slice(7)}`, initialInitiativePlayerId: `league-${cell.initialInitiativeCandidateRoot.slice(7)}`, bottomStrategyRevisionId: "", topStrategyRevisionId: "" }
  await runOneCellWorkerCell({ allocation, cell, start, ledger, now: () => performance.now(), cellStartedAt, issue, execute: async (bottom, top, enteredKernel, enteredEvidence) => {
    const result = await runDiagnosticOneCellCell({ ledger, allocation, cell, start, requestRoot: cell.requestRoot, bottom, top, match: { ...match, bottomStrategyRevisionId: bottom.identity.revisionId, topStrategyRevisionId: top.identity.revisionId }, onKernelEntry: enteredKernel, onEvidenceStart: enteredEvidence })
    return { disposition: result.disposition, processValidity: result.processValidity, evidenceRoot: result.evidenceRoot, artifactBytes: result.artifactBytes, artifactRecords: result.artifactRecords, cleanupComplete: result.cleanupComplete }
  }, close: (handle) => closeDiagnosticOneCellIssuedProvider(handle), cleanup: () => cleanupOneCellExactOwners(allocation, cell), send: (message) => { try { return process.send!(message) } catch { return false } } })
  if (process.connected) process.disconnect()
}

interface OneCellWatchdogHost { readonly now: () => number; readonly spawn: (token: string) => ChildProcess; readonly cleanup: () => Promise<boolean> }
const defaultWatchdogHost = (allocation: DiagnosticOneCellAllocation, cell: DiagnosticOneCellCell): OneCellWatchdogHost => ({
  now: () => performance.now(),
  spawn: (token) => spawn(resolve("node_modules/.bin/tsx"), [fileURLToPath(import.meta.url), "--internal-worker-v3", token], { stdio: ["ignore", "pipe", "pipe", "ipc"], env: { PATH: process.env.PATH ?? "", TMPDIR: process.env.TMPDIR ?? "" }, shell: false, detached: false, windowsHide: true }),
  cleanup: () => cleanupOneCellExactOwners(allocation, cell),
})
export const runOneCellWatchdog = async (allocation: DiagnosticOneCellAllocation, cell: DiagnosticOneCellCell, start: DiagnosticOneCellStart, overallStartedAt: number, host: OneCellWatchdogHost = defaultWatchdogHost(allocation, cell)): Promise<{ readonly status: "process_valid" | "process_invalid"; readonly containerAbsence: boolean }> => {
  const token = randomUUID(), child = host.spawn(token)
  if (!child.pid || child.pid < 2) return fail("WORKER_PID")
  let completionCount = 0, done: "process_valid" | "process_invalid" | null = null, cellStartedAt: number | null = null, timedOut = false, settled = false, ready = false
  const kill = () => { if (settled) return; try { child.kill("SIGKILL") } catch { /* outer supervisor owns process group */ } }
  const overallDeadline = overallStartedAt + 600_000 - 30_000
  let exitCode: number | null = null
  const outcome = await new Promise<void>((resolveOutcome) => {
    const poll = setInterval(() => { const now = host.now(); if (now >= overallDeadline || cellStartedAt !== null && now >= cellStartedAt + 240_000) { timedOut = true; kill() } }, 50)
    const finish = () => { if (settled) return; settled = true; clearInterval(poll); resolveOutcome() }
    let outputBytes = 0
    const drain = (data: Buffer) => { outputBytes += data.length; if (outputBytes > 4096) { timedOut = true; kill() } }
    child.stdout?.on("data", drain); child.stderr?.on("data", drain)
    child.on("error", finish); child.on("exit", (code) => { exitCode = code; finish() })
    child.on("message", (message: unknown) => {
      if (!message || typeof message !== "object") { timedOut = true; kill(); return }
      if (exact(message, ["kind", "ordinal", "startRoot"]) && message.kind === "ready" && message.ordinal === 0 && message.startRoot === start.root && !ready) { ready = true; child.send({ kind: "cell-go", allocationRoot: allocation.root, cellRoot: cell.root, startRoot: start.root, token }, (error) => { if (error) { timedOut = true; kill() } }); return }
      if (exact(message, ["kind", "ordinal", "startRoot"]) && message.kind === "cell-started" && message.ordinal === 0 && message.startRoot === start.root && ready && cellStartedAt === null) { cellStartedAt = host.now(); return }
      if (exact(message, ["kind", "ordinal"]) && message.kind === "cell-complete" && message.ordinal === 0 && cellStartedAt !== null) { completionCount++; if (completionCount > 1) { timedOut = true; kill() }; return }
      if (exact(message, ["kind", "status"]) && message.kind === "done" && ["process_valid", "process_invalid"].includes(String(message.status)) && cellStartedAt !== null && completionCount === 1 && done === null) { done = message.status as typeof done; return }
      timedOut = true; kill()
    })
  })
  void outcome
  const remainingReserve = Math.max(1, Math.min(30_000, overallDeadline - host.now()))
  const containerAbsence = await timedOneCellAsync(remainingReserve, "CLEANUP_DEADLINE", host.cleanup).catch(() => false)
  return { status: timedOut || exitCode !== 0 || completionCount !== 1 || done !== "process_valid" || !containerAbsence ? "process_invalid" : "process_valid", containerAbsence }
}
const writeOneCellPendingResult = (marker: ReturnType<typeof oneCellAttemptedResult>, result: ReturnType<typeof createDiagnosticOneCellResult>) => {
  if (!same(readExact(DIAGNOSTIC_ONE_CELL_RESULT_PATH, DIAGNOSTIC_ONE_CELL_RESULT_PATH), marker)) return fail("RESULT_MARKER_DRIFT")
  durableCreate(ONE_CELL_RESULT_PENDING_PATH, result)
}
/** Canonical allocation, preflight disposition and retained result are written
 * only by the separately supervised publisher after the outer parent observes
 * ordered stage IPC, final IPC and clean live-child exit.
 * Pending-only state cannot be promoted by a later run or retry. */
const publishOneCellAfterSupervision = async (selector: OneCellLiveSelector, status: "finished" | "prestart_denied", token: string, context: OneCellPublisherInstruction): Promise<void> => {
  const publisherStartedAt = performance.now()
  const gate = checkOneCellSourceGate(), authorization = requireOneCellAuthorization(gate)
  if (selector === "prepare") {
    if (status !== "finished") return fail("PARENT_PREPARE_STATUS")
    const pending = readExact(ONE_CELL_ALLOCATION_PENDING_PATH, ONE_CELL_ALLOCATION_PENDING_PATH)
    const expected = prospectiveAllocation(gate)
    if (!same(pending, expected) || authorization.allocationRoot !== expected.root || context.pendingRoot !== expected.root) return fail("PARENT_PREPARE_PENDING")
    requireOneCellSelectorAttempt(selector, gate, authorization, expected.root)
    const permit = createOneCellParentPermit({ selector, status, token, gateRoot: gate.root, authorizationRoot: authorization.root, allocationRoot: expected.root, context })
    publishOneCellCommitSequence(permit, expected.root, publisherStartedAt, {
      recheckPending: () => admitDiagnosticOneCellAllocation(readExact(ONE_CELL_ALLOCATION_PENDING_PATH, ONE_CELL_ALLOCATION_PENDING_PATH)).root,
      writePermit: () => durableCreate(ONE_CELL_PARENT_PERMIT_PATHS.prepare, permit),
      writeCanonicalAndFsync: () => durableCreate(DIAGNOSTIC_ONE_CELL_ALLOCATION_PATH, expected),
      writeReceiptAndFsync: (receipt) => durableCreate(ONE_CELL_PUBLISHER_RECEIPT_PATHS.prepare, receipt),
    })
    return
  }
  const allocation = readOneCellAllocation(gate)
  requireOneCellSelectorAttempt(selector, gate, authorization, allocation.root)
  if (selector === "preflight") {
    const attempt = readExact(DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH, DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH)
    const expectedAttempt = createOneCellPreflightAttempt(allocation, authorization.root)
    if (!same(attempt, expectedAttempt)) return fail("PARENT_PREFLIGHT_ATTEMPT")
    const disposition = admitOneCellPreflightDisposition(expectedAttempt, readExact(ONE_CELL_PREFLIGHT_PENDING_PATH, ONE_CELL_PREFLIGHT_PENDING_PATH))
    if ((status === "finished") !== (disposition.status === "admitted") || context.pendingRoot !== disposition.root) return fail("PARENT_PREFLIGHT_STATUS")
    const permit = createOneCellParentPermit({ selector, status, token, gateRoot: gate.root, authorizationRoot: authorization.root, allocationRoot: allocation.root, context })
    publishOneCellCommitSequence(permit, disposition.root, publisherStartedAt, {
      recheckPending: () => admitOneCellPreflightDisposition(expectedAttempt, readExact(ONE_CELL_PREFLIGHT_PENDING_PATH, ONE_CELL_PREFLIGHT_PENDING_PATH)).root,
      writePermit: () => durableCreate(ONE_CELL_PARENT_PERMIT_PATHS.preflight, permit),
      writeCanonicalAndFsync: () => durableCreate(DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH, disposition),
      writeReceiptAndFsync: (receipt) => durableCreate(ONE_CELL_PUBLISHER_RECEIPT_PATHS.preflight, receipt),
    })
    return
  }
  if (status !== "finished") return fail("PARENT_RUN_STATUS")
  const preflight = readOneCellPreflight(allocation, authorization.root)
  requireAdmittedOneCellPreflight(allocation, authorization.root, preflight.attempt, preflight.disposition)
  const marker = oneCellAttemptedResult(allocation, authorization.root, preflight.disposition.root)
  if (!same(readExact(DIAGNOSTIC_ONE_CELL_RESULT_PATH, DIAGNOSTIC_ONE_CELL_RESULT_PATH), marker)) return fail("PARENT_RUN_ATTEMPT")
  const pending = readExact(ONE_CELL_RESULT_PENDING_PATH, ONE_CELL_RESULT_PENDING_PATH)
  if (!exact(pending, ["schemaVersion", "privacy", "evidenceClass", "allocationRoot", "gateRoot", "oldEvidenceBaseline", "elapsedMilliseconds", "watchdogStatus", "chargedCount", "startRoot", "terminalRoot", "evidenceRoot", "containerAbsence", "processValidity", "leagueRequirementsEvidence", "freezeAuthorized", "formationAuthorized", "holdoutAuthorized", "counted", "public", "productionAuthorized", "root"])) return fail("PARENT_RESULT_KEYS")
  const ledger = openDiagnosticOneCellLedger(DIAGNOSTIC_ONE_CELL_STORE)
  const expected = createDiagnosticOneCellResult(allocation, ledger, pending.elapsedMilliseconds as number, pending.watchdogStatus as "process_valid" | "process_invalid" | "safe_no_start", pending.containerAbsence as boolean)
  if (!same(pending, expected) || context.pendingRoot !== expected.root) return fail("PARENT_RESULT_PENDING")
  if (expected.processValidity === "process_valid" && !await checkOneCellExactOwnersAbsent(allocation, createDiagnosticOneCellCell(allocation, 0))) return fail("PARENT_OWNER_PRESENT")
  const permit = createOneCellParentPermit({ selector, status, token, gateRoot: gate.root, authorizationRoot: authorization.root, allocationRoot: allocation.root, context })
  publishOneCellCommitSequence(permit, expected.root, publisherStartedAt, {
    recheckPending: () => (readExact(ONE_CELL_RESULT_PENDING_PATH, ONE_CELL_RESULT_PENDING_PATH) as { readonly root: LabRoot }).root,
    writePermit: () => durableCreate(ONE_CELL_PARENT_PERMIT_PATHS.run, permit),
    writeCanonicalAndFsync: () => {
      const beforePending = lstatSync(ONE_CELL_RESULT_PENDING_PATH), beforeMarker = lstatSync(DIAGNOSTIC_ONE_CELL_RESULT_PATH)
      if (!beforePending.isFile() || beforePending.nlink !== 1 || !beforeMarker.isFile() || beforeMarker.nlink !== 1) return fail("PARENT_RESULT_LINK")
      const afterPending = lstatSync(ONE_CELL_RESULT_PENDING_PATH), afterMarker = lstatSync(DIAGNOSTIC_ONE_CELL_RESULT_PATH)
      if (afterPending.dev !== beforePending.dev || afterPending.ino !== beforePending.ino || afterMarker.dev !== beforeMarker.dev || afterMarker.ino !== beforeMarker.ino) return fail("PARENT_RESULT_RACE")
      renameSync(ONE_CELL_RESULT_PENDING_PATH, DIAGNOSTIC_ONE_CELL_RESULT_PATH)
      syncParent(DIAGNOSTIC_ONE_CELL_RESULT_PATH)
    },
    writeReceiptAndFsync: (receipt) => durableCreate(ONE_CELL_PUBLISHER_RECEIPT_PATHS.run, receipt),
  })
}
/** Receipt is the single durable publisher commit point. This is read-only and
 * safe to rerun after lost final IPC; it never repairs a missing receipt. */
export const reopenOneCellPublishedCommit = (selector: OneCellLiveSelector, pendingRoot: LabRoot): boolean => {
  try {
    if (!root(pendingRoot)) return false
    const gate = checkOneCellSourceGate(), authorization = requireOneCellAuthorization(gate)
    if (selector === "prepare") {
      const allocation = admitDiagnosticOneCellAllocation(readExact(DIAGNOSTIC_ONE_CELL_ALLOCATION_PATH, DIAGNOSTIC_ONE_CELL_ALLOCATION_PATH))
      requireOneCellSelectorAttempt(selector, gate, authorization, allocation.root)
      return allocation.root === pendingRoot && requireOneCellPublisherCommit(selector, allocation.root, gate.root, authorization.root, allocation.root).status === "finished"
    }
    const allocation = readOneCellAllocation(gate)
    if (selector === "preflight") {
      const attempt = createOneCellPreflightAttempt(allocation, authorization.root)
      if (!same(readExact(DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH, DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH), attempt)) return false
      const disposition = admitOneCellPreflightDisposition(attempt, readExact(DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH, DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH))
      const commit = requireOneCellPublisherCommit(selector, disposition.root, gate.root, authorization.root, allocation.root)
      return disposition.root === pendingRoot && (commit.status === "finished") === (disposition.status === "admitted")
    }
    const preflight = readOneCellPreflight(allocation, authorization.root)
    requireAdmittedOneCellPreflight(allocation, authorization.root, preflight.attempt, preflight.disposition)
    const result = readExact(DIAGNOSTIC_ONE_CELL_RESULT_PATH, DIAGNOSTIC_ONE_CELL_RESULT_PATH)
    if (!exact(result, ["schemaVersion", "privacy", "evidenceClass", "allocationRoot", "gateRoot", "oldEvidenceBaseline", "elapsedMilliseconds", "watchdogStatus", "chargedCount", "startRoot", "terminalRoot", "evidenceRoot", "containerAbsence", "processValidity", "leagueRequirementsEvidence", "freezeAuthorized", "formationAuthorized", "holdoutAuthorized", "counted", "public", "productionAuthorized", "root"])) return false
    const ledger = openDiagnosticOneCellLedger(DIAGNOSTIC_ONE_CELL_STORE)
    const expected = createDiagnosticOneCellResult(allocation, ledger, result.elapsedMilliseconds as number, result.watchdogStatus as "process_valid" | "process_invalid" | "safe_no_start", result.containerAbsence as boolean)
    return same(result, expected) && expected.root === pendingRoot && requireOneCellPublisherCommit(selector, expected.root, gate.root, authorization.root, allocation.root).status === "finished"
  } catch { return false }
}
const publishOneCellWithWatchdog = async (selector: OneCellLiveSelector, status: "finished" | "prestart_denied", commandStartedAt: number, context: OneCellPublisherContext): Promise<void> => {
  const token = randomUUID(), limit = selector === "run" ? 600_000 : 330_000
  const parentElapsedBeforePublisherMilliseconds = Math.ceil(performance.now() - commandStartedAt)
  const remaining = Math.min(25_000, limit - parentElapsedBeforePublisherMilliseconds - 5_000)
  if (remaining <= 0) return fail("PARENT_PUBLICATION_RESERVE")
  const child = spawn(resolve("node_modules/.bin/tsx"), [fileURLToPath(import.meta.url), "--internal-publish-v3", token, selector, status], { stdio: ["ignore", "pipe", "pipe", "ipc"], env: { PATH: process.env.PATH ?? "", TMPDIR: process.env.TMPDIR ?? "" }, shell: false, detached: true, windowsHide: true })
  if (!child.pid || child.pid < 2) return fail("PARENT_PUBLICATION_PID")
  let settled = false, timedOut = false, ready = false, done = false, exitCode: number | null = null, outputBytes = 0
  const kill = () => { if (settled || timedOut) return; timedOut = true; try { process.kill(-child.pid!, "SIGKILL") } catch { try { child.kill("SIGKILL") } catch { /* invalid */ } } }
  await new Promise<void>((resolveOutcome) => {
    const timer = setTimeout(kill, remaining)
    const finish = () => { if (settled) return; settled = true; clearTimeout(timer); resolveOutcome() }
    const drain = (bytes: Buffer) => { outputBytes += bytes.length; if (outputBytes > 4096) kill() }
    child.stdout?.on("data", drain); child.stderr?.on("data", drain)
    child.on("error", finish); child.on("exit", (code) => { exitCode = code; finish() })
    child.on("message", (message: unknown) => {
      if (exact(message, ["kind", "token"]) && message.kind === "publish-ready" && message.token === token && !ready) { ready = true; child.send({ kind: "publish-go", token, context: { ...context, parentElapsedBeforePublisherMilliseconds } }, (error) => { if (error) kill() }); return }
      if (exact(message, ["kind", "token"]) && message.kind === "publish-complete" && message.token === token && ready && !done) { done = true; return }
      kill()
    })
  })
  if (timedOut || exitCode !== 0 || !ready || !done || performance.now() - commandStartedAt > limit) {
    // The receipt, not final IPC, is the durable commit point. A lost reply
    // after its fsync is classified by read-only exact join; no second write.
    if (performance.now() - commandStartedAt >= limit) return fail("PARENT_PUBLICATION_DEADLINE")
    const remainingReopen = Math.max(1, Math.min(5_000, limit - (performance.now() - commandStartedAt)))
    const reopened = spawnSync(resolve("node_modules/.bin/tsx"), [fileURLToPath(import.meta.url), "--internal-reopen-v3", selector, context.pendingRoot], { encoding: "utf8", env: { PATH: process.env.PATH ?? "", TMPDIR: process.env.TMPDIR ?? "" }, stdio: ["ignore", "pipe", "pipe"], timeout: remainingReopen, maxBuffer: 4096 })
    if (reopened.status !== 0 || reopened.signal !== null || reopened.error || reopened.stdout !== "committed\n") return fail("PARENT_PUBLICATION_UNKNOWN_REOPEN_REQUIRED")
  }
}
const waitOneCellPublisherPermission = (token: string): Promise<OneCellPublisherInstruction> => new Promise((resolveGo, rejectGo) => {
  if (!process.send || !process.connected) { rejectGo(new TypeError("DIAGNOSTIC_ONE_CELL_CLI_PUBLISHER_PARENT")); return }
  const timer = setTimeout(() => { process.off("message", receive); rejectGo(new TypeError("DIAGNOSTIC_ONE_CELL_CLI_PUBLISHER_PERMISSION_TIMEOUT")) }, 5_000)
  const receive = (message: unknown) => {
    clearTimeout(timer); process.off("message", receive)
    if (!exact(message, ["kind", "token", "context"]) || message.kind !== "publish-go" || message.token !== token || !exact(message.context, ["pendingRoot", "stageTranscript", "childElapsedMilliseconds", "parentElapsedBeforePublisherMilliseconds"]) || !root(message.context.pendingRoot) || !Array.isArray(message.context.stageTranscript) || !Number.isSafeInteger(message.context.childElapsedMilliseconds) || !Number.isSafeInteger(message.context.parentElapsedBeforePublisherMilliseconds)) { rejectGo(new TypeError("DIAGNOSTIC_ONE_CELL_CLI_PUBLISHER_PERMISSION")); return }
    resolveGo(message.context as unknown as OneCellPublisherInstruction)
  }
  process.on("message", receive)
  process.send({ kind: "publish-ready", token })
})
const runOneCellLive = async (authorizationPath: string, gatePath: string, allocationPath: string, overallStartedAt: number, stage: OneCellStageRunner = directOneCellStage): Promise<LabRoot> => {
  verifyOneCellComponentBudget(ONE_CELL_OPERATION_BUDGET)
  const gate = await stage("source", () => timedOneCellSync(ONE_CELL_OPERATION_BUDGET.sourceCheckMilliseconds, "SOURCE_DEADLINE", () => checkOneCellSourceGate(gatePath)))
  const { authorization, allocation, preflight } = await stage("approval", () => timedOneCellSync(ONE_CELL_OPERATION_BUDGET.approvalCheckMilliseconds, "APPROVAL_DEADLINE", () => {
    const authorization = requireOneCellAuthorization(gate, authorizationPath), allocation = readOneCellAllocation(gate, allocationPath)
    const preflight = readOneCellPreflight(allocation, authorization.root)
    requireAdmittedOneCellPreflight(allocation, authorization.root, preflight.attempt, preflight.disposition)
    return { authorization, allocation, preflight }
  }))
  requireOneCellSelectorAttempt("run", gate, authorization, allocation.root)
  if (!same(allocation.oldEvidenceBaseline, (await stage("history", () => timedOneCellSync(ONE_CELL_OPERATION_BUDGET.oldTreeHashMilliseconds, "HISTORY_DEADLINE", checkOneCellHistoricalSourceOnly))).oldEvidenceBaseline)) return fail("RUN_HISTORY")
  const cell = createDiagnosticOneCellCell(allocation, 0), start = createDiagnosticOneCellStart(allocation, cell)
  const marker = oneCellAttemptedResult(allocation, authorization.root, preflight.disposition.root)
  await stage("attempt", () => durableCreate(DIAGNOSTIC_ONE_CELL_RESULT_PATH, marker))
  try { await observeOneCellHost(allocation, defaultProbe, stage) }
  catch { return fail("RUN_HOST_DENIED_ATTEMPT_RETAINED") }
  if (!canStartOneCell(performance.now(), overallStartedAt) || existsSync(DIAGNOSTIC_ONE_CELL_STORE)) return fail("RUN_SETUP_DEADLINE_OR_STORE")
  try {
    await stage("reservation", () => { mkdirSync(DIAGNOSTIC_ONE_CELL_STORE, { mode: 0o700 }); syncParent(DIAGNOSTIC_ONE_CELL_STORE) })
    if (!canStartOneCell(performance.now(), overallStartedAt)) return fail("RUN_SETUP_DEADLINE_AFTER_RESERVATION")
    const outcome = await stage("cell", () => runOneCellWatchdog(allocation, cell, start, overallStartedAt))
    const ledger = openDiagnosticOneCellLedger(DIAGNOSTIC_ONE_CELL_STORE)
    const elapsed = Math.min(600_000, Math.max(0, Math.ceil(performance.now() - overallStartedAt)))
    const result = createDiagnosticOneCellResult(allocation, ledger, elapsed, outcome.status, outcome.containerAbsence)
    if (performance.now() - overallStartedAt > 570_000) return fail("PUBLICATION_RESERVE_EXHAUSTED")
    await stage("publication", () => writeOneCellPendingResult(marker, result))
    return result.root
  } catch {
    // The exclusive attempted marker is the terminal fail-closed outcome.
    // It is never deleted, replaced with synthetic success or retried.
    return fail("RUN_PROCESS_INVALID_ATTEMPT_RETAINED")
  }
}
const checkOneCellRetainedContract = async (authorizationPath: string, gatePath: string, allocationPath: string, attemptPath: string, dispositionPath: string, resultPath: string, repositoryPath: string) => {
  const gate = checkOneCellSourceGate(gatePath), authorization = requireOneCellAuthorization(gate, authorizationPath), allocation = readOneCellAllocation(gate, allocationPath)
  if (resolve(attemptPath) !== resolve(DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH) || resolve(dispositionPath) !== resolve(DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH) || resolve(resultPath) !== resolve(DIAGNOSTIC_ONE_CELL_RESULT_PATH) || resolve(repositoryPath) !== resolve(DIAGNOSTIC_ONE_CELL_STORE)) return fail("RETAINED_PATHS")
  const preflight = readOneCellPreflight(allocation, authorization.root)
  requireOneCellSelectorAttempt("run", gate, authorization, allocation.root)
  requireAdmittedOneCellPreflight(allocation, authorization.root, preflight.attempt, preflight.disposition)
  if (!same(allocation.oldEvidenceBaseline, checkOneCellHistoricalSourceOnly().oldEvidenceBaseline)) return fail("RETAINED_HISTORY")
  const raw = readExact(resultPath, DIAGNOSTIC_ONE_CELL_RESULT_PATH)
  const marker = oneCellAttemptedResult(allocation, authorization.root, preflight.disposition.root)
  if (same(raw, marker)) {
    const ledger = existsSync(DIAGNOSTIC_ONE_CELL_STORE) ? openDiagnosticOneCellLedger(DIAGNOSTIC_ONE_CELL_STORE) : null
    const state = ledger ? reopenDiagnosticOneCellLedger(ledger, allocation) : null
    return Object.freeze({ schemaVersion: "diagnostic-one-cell-retained-verdict-v3" as const, status: "attempted_process_invalid" as const, chargedCount: state?.records.length ?? 0, processValidity: "process_invalid" as const, leagueRequirementsEvidence: false as const })
  }
  if (!exact(raw, ["schemaVersion", "privacy", "evidenceClass", "allocationRoot", "gateRoot", "oldEvidenceBaseline", "elapsedMilliseconds", "watchdogStatus", "chargedCount", "startRoot", "terminalRoot", "evidenceRoot", "containerAbsence", "processValidity", "leagueRequirementsEvidence", "freezeAuthorized", "formationAuthorized", "holdoutAuthorized", "counted", "public", "productionAuthorized", "root"])) return fail("RETAINED_RESULT_KEYS")
  const ledger = openDiagnosticOneCellLedger(DIAGNOSTIC_ONE_CELL_STORE)
  const expected = createDiagnosticOneCellResult(allocation, ledger, raw.elapsedMilliseconds as number, raw.watchdogStatus as "process_valid" | "process_invalid" | "safe_no_start", raw.containerAbsence as boolean)
  if (!same(raw, expected)) return fail("RETAINED_RESULT_MISMATCH")
  const commit = requireOneCellPublisherCommit("run", expected.root, gate.root, authorization.root, allocation.root)
  if (commit.status !== "finished") return fail("RETAINED_PUBLISHER_STATUS")
  if (expected.processValidity === "process_valid" && !await checkOneCellExactOwnersAbsent(allocation, createDiagnosticOneCellCell(allocation, 0))) return fail("RETAINED_OWNER_PRESENT")
  return Object.freeze({ schemaVersion: "diagnostic-one-cell-retained-verdict-v3" as const, status: expected.processValidity, chargedCount: expected.chargedCount, processValidity: expected.processValidity, leagueRequirementsEvidence: false as const, resultRoot: expected.root })
}

const executeOneCellLiveSelector = async (selector: OneCellLiveSelector, args: readonly string[], stage: OneCellStageRunner): Promise<{ readonly status: "finished" | "prestart_denied"; readonly pendingRoot: LabRoot }> => {
  if (selector === "prepare") {
    parseExactFlags(args, [["authorization", ONE_CELL_AUTHORIZATION_PATH], ["gate", ONE_CELL_GATE_PATH]])
    const allocation = await prepareOneCell(args[1]!, args[3]!, stage); return { status: "finished", pendingRoot: allocation.root }
  }
  if (selector === "preflight") {
    parseExactFlags(args, [["authorization", ONE_CELL_AUTHORIZATION_PATH], ["allocation", DIAGNOSTIC_ONE_CELL_ALLOCATION_PATH], ["gate", ONE_CELL_GATE_PATH]])
    const gate = await stage("source", () => checkOneCellSourceGate(args[5]!))
    const { authorization, allocation } = await stage("approval", () => ({ authorization: requireOneCellAuthorization(gate, args[1]!), allocation: readOneCellAllocation(gate, args[3]!) }))
    if (!same(allocation.oldEvidenceBaseline, (await stage("history", checkOneCellHistoricalSourceOnly)).oldEvidenceBaseline)) return fail("PREFLIGHT_HISTORY")
    const disposition = await executeOneCellPreflightOnce(allocation, authorization.root, () => observeOneCellHost(allocation, defaultProbe, stage), { attempt: DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH, disposition: ONE_CELL_PREFLIGHT_PENDING_PATH }, stage)
    return { status: disposition.status === "admitted" ? "finished" : "prestart_denied", pendingRoot: disposition.root }
  }
  parseExactFlags(args, [["authorization", ONE_CELL_AUTHORIZATION_PATH], ["gate", ONE_CELL_GATE_PATH], ["allocation", DIAGNOSTIC_ONE_CELL_ALLOCATION_PATH]])
  const pendingRoot = await runOneCellLive(args[1]!, args[3]!, args[5]!, performance.now(), stage)
  return { status: "finished", pendingRoot }
}
/** Plan 11 never invokes live selectors. Future Plan 12 must supply a distinct,
 * exact operator authorization file; this source gate alone cannot do so. */
export const main = async (args: readonly string[]): Promise<void> => {
  const commandStartedAt = performance.now()
  const [selector, option, gatePath] = args
  if (selector === "check-source-gate-v3" && option === "--gate" && gatePath && args.length === 3) { checkOneCellSourceGate(gatePath); return }
  if (selector === "check-history-source-only-v3" && args.length === 1) { process.stdout.write(`${JSON.stringify(checkOneCellHistoricalSourceOnly())}\n`); return }
  if (selector === "--internal-latch-v3" && args.length === 3) {
    const token = args[1], liveSelector = args[2]
    if (!process.send || !process.connected || !token || !/^[a-f0-9-]{36}$/u.test(token) || !["prepare", "preflight", "run"].includes(liveSelector!)) return fail("LATCH_PARENT")
    await waitOneCellLatchPermission(token)
    const attemptRoot = writeOneCellSelectorAttempt(liveSelector as OneCellLiveSelector)
    process.send({ kind: "latch-complete", token, root: attemptRoot })
    if (process.connected) process.disconnect()
    return
  }
  if (selector === "--internal-live-v3" && args.length >= 4) {
    const token = args[1], liveSelector = args[2], liveArgs = args.slice(3)
    if (!process.send || !process.connected || !token || !/^[a-f0-9-]{36}$/u.test(token) || !["prepare", "preflight", "run"].includes(liveSelector!)) return fail("LIVE_CHILD_PARENT")
    const completed = await executeOneCellLiveSelector(liveSelector as OneCellLiveSelector, liveArgs, oneCellIpcStageRunner(token))
    process.send({ kind: "live-complete", token, ...completed })
    if (process.connected) process.disconnect()
    return
  }
  if (selector === "--internal-publish-v3" && args.length === 4) {
    const token = args[1], liveSelector = args[2], status = args[3]
    if (!process.send || !process.connected || !token || !/^[a-f0-9-]{36}$/u.test(token) || !["prepare", "preflight", "run"].includes(liveSelector!) || !["finished", "prestart_denied"].includes(status!)) return fail("PUBLISHER_PARENT")
    const context = await waitOneCellPublisherPermission(token)
    await publishOneCellAfterSupervision(liveSelector as OneCellLiveSelector, status as "finished" | "prestart_denied", token, context)
    process.send({ kind: "publish-complete", token })
    if (process.connected) process.disconnect()
    return
  }
  if (selector === "--internal-cleanup-v3" && args.length === 2) {
    const token = args[1]
    if (!process.send || !process.connected || !token || !/^[a-f0-9-]{36}$/u.test(token)) return fail("CLEANUP_PARENT")
    await waitOneCellCleanupPermission(token)
    const gate = checkOneCellSourceGate(), allocation = readOneCellAllocation(gate)
    const clean = await cleanupOneCellExactOwners(allocation, createDiagnosticOneCellCell(allocation, 0))
    process.send({ kind: "cleanup-complete", token, clean })
    if (process.connected) process.disconnect()
    if (!clean) return fail("CLEANUP_INCOMPLETE")
    return
  }
  if (selector === "--internal-reopen-v3" && args.length === 3 && ["prepare", "preflight", "run"].includes(args[1]!) && root(args[2])) {
    if (!reopenOneCellPublishedCommit(args[1] as OneCellLiveSelector, args[2] as LabRoot)) return fail("PUBLISHER_RECEIPT_ABSENT_OR_INVALID")
    process.stdout.write("committed\n"); return
  }
  if (selector === "prepare" || selector === "preflight" || selector === "run") { await superviseOneCellLive(selector, args.slice(1), defaultOneCellSupervisorHost, commandStartedAt); return }
  if (selector === "verify-allocation-v3") {
    parseExactFlags(args.slice(1), [["authorization", ONE_CELL_AUTHORIZATION_PATH], ["allocation", DIAGNOSTIC_ONE_CELL_ALLOCATION_PATH], ["gate", ONE_CELL_GATE_PATH]])
    const gate = checkOneCellSourceGate(args[6]!), authorization = requireOneCellAuthorization(gate, args[2]!), allocation = readOneCellAllocation(gate, args[4]!)
    if (!root(authorization.root) || !same(allocation.oldEvidenceBaseline, checkOneCellHistoricalSourceOnly().oldEvidenceBaseline)) return fail("ALLOCATION_HISTORY")
    return
  }
  if (selector === "check-preflight-v3-contract") {
    parseExactFlags(args.slice(1), [["authorization", ONE_CELL_AUTHORIZATION_PATH], ["allocation", DIAGNOSTIC_ONE_CELL_ALLOCATION_PATH], ["gate", ONE_CELL_GATE_PATH], ["attempt", DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH], ["disposition", DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH]])
    const result = checkOneCellPreflightContract(args[2]!, args[4]!, args[6]!, args[8]!, args[10]!)
    process.stdout.write(`${JSON.stringify({ status: result.disposition.status, attemptRoot: result.attempt.root, dispositionRoot: result.disposition.root, chargedCount: 0, empiricalAuthority: false })}\n`)
    return
  }
  if (selector === "verify-retained-v3" || selector === "check-retained-v3-contract") {
    parseExactFlags(args.slice(1), [["authorization", ONE_CELL_AUTHORIZATION_PATH], ["gate", ONE_CELL_GATE_PATH], ["allocation", DIAGNOSTIC_ONE_CELL_ALLOCATION_PATH], ["preflight-attempt", DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH], ["preflight-disposition", DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH], ["result", DIAGNOSTIC_ONE_CELL_RESULT_PATH], ["repository", DIAGNOSTIC_ONE_CELL_STORE]])
    process.stdout.write(`${JSON.stringify(await checkOneCellRetainedContract(args[2]!, args[4]!, args[6]!, args[8]!, args[10]!, args[12]!, args[14]!))}\n`)
    return
  }
  if (selector === "--internal-worker-v3" && args.length === 2) { await runOneCellWorkerLive(args[1]!); return }
  return fail("SELECTOR")
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : "DIAGNOSTIC_ONE_CELL_CLI_FAILURE"}\n`); process.exitCode = 1 })
