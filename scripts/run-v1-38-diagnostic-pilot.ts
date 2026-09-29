import { createHash } from "node:crypto"
import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { existsSync, lstatSync, readFileSync, statfsSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { performance } from "node:perf_hooks"
import { createFactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import {
  DIAGNOSTIC_PILOT_ARTIFACT_CEILING,
  DIAGNOSTIC_PILOT_PHASE264_STORE,
  DIAGNOSTIC_PILOT_STORE,
  admitDiagnosticPilotAllocation,
  admitDiagnosticPilotCell,
  createDiagnosticPilotAllocation,
  createDiagnosticPilotCell,
  createDiagnosticPilotStart,
  createDiagnosticPilotTerminal,
  createDiagnosticPilotLifetimeGrant,
  diagnosticPilotContainerIdentity,
  openDiagnosticPilotLedger,
  readDiagnosticPilotAssessedPair,
  reopenDiagnosticPilotLedger,
  type DiagnosticPilotAllocation,
  type DiagnosticPilotCell,
} from "../packages/strategy-lab/src/league/diagnostic-pilot.js"
import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { closeDiagnosticPilotIssuedProvider, issueDiagnosticPilotProviderFromFactoryCandidate, runDiagnosticPilotCell, type FactorySupervisedRuntimeHost } from "../packages/strategy-lab/src/league/connected-runner.js"
import { createFactorySupervisedRuntime } from "./lib/v1-38-factory-supervised-runtime.js"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { leaguePlayerId } from "../packages/strategy-lab/src/league/matrix.js"
import type { LabMatchExecution } from "../packages/strategy-lab/src/runtime-bridge.js"
import type { DiagnosticPilotLedger, DiagnosticPilotStart } from "../packages/strategy-lab/src/league/diagnostic-pilot.js"
import { MEMORY_PRESSURE_Q_REQUEST, parseMemoryPressureQ } from "./lib/v1-38-darwin-headroom.js"

const fail = (code: string): never => { throw new TypeError(`DIAGNOSTIC_PILOT_CLI_${code}`) }
const sha = (bytes: Uint8Array | string): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const root = (value: unknown): value is LabRoot => typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
const GATE_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-08-PILOT-GATE.json"
const REVIEW_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-08-PILOT-SOURCE-REVIEW.md"
export const DIAGNOSTIC_PILOT_SOURCE_FILES = Object.freeze([
  "packages/strategy-lab/src/league/diagnostic-pilot.ts",
  "packages/strategy-lab/src/league/diagnostic-pilot.test.ts",
  "packages/strategy-lab/src/league/connected-runner.ts",
  "scripts/lib/v1-38-factory-supervised-runtime.ts",
  "scripts/lib/v1-38-planner-supervised-runtime.ts",
  "scripts/run-v1-38-diagnostic-pilot.ts",
  "scripts/run-v1-38-diagnostic-pilot.test.ts",
  "scripts/check-v1-38-diagnostic-pilot-boundaries.ts",
  "pnpm-lock.yaml",
  ".github/workflows/ci.yml",
])

export interface DiagnosticPilotSourceGate {
  readonly schemaVersion: "diagnostic-pilot-source-gate-v1"
  readonly sourceFiles: readonly { readonly path: string; readonly sha256: LabRoot }[]
  readonly sourceClosureRoot: LabRoot
  readonly reviewPath: typeof REVIEW_PATH
  readonly reviewSha256: LabRoot
  readonly reviewerId: string
  readonly authorId: string
  readonly actionableFindings: 0
  readonly commands: readonly { readonly command: string; readonly exitCode: 0 }[]
  readonly readerSamplesMilliseconds: readonly number[]
  readonly readerCeilingMilliseconds: number
  readonly capacityVersion: typeof DIAGNOSTIC_PILOT_ARTIFACT_CEILING.version
  readonly watchdogVersion: "diagnostic-pilot-watchdog-v1"
  readonly empiricalAuthority: false
  readonly root: LabRoot
}
export const diagnosticPilotSourceClosure = (read: (path: string) => Uint8Array = (path) => readFileSync(path)) => {
  const sourceFiles = DIAGNOSTIC_PILOT_SOURCE_FILES.map((path) => ({ path, sha256: sha(read(path)) }))
  return { sourceFiles, sourceClosureRoot: labRoot("diagnostic-pilot-source-closure-v1", sourceFiles) }
}
export const diagnosticPilotRequiredGateCommands = (): readonly string[] => {
  const ci = readFileSync(".github/workflows/ci.yml", "utf8").split("\n")
  const leagueLine = ci.find((line) => line.includes("vitest run --maxWorkers=1 packages/strategy-lab/src/league/contracts.test.ts"))?.trim()
  if (!leagueLine || (leagueLine.match(/\.test\.ts/gu) ?? []).length !== 29) return fail("CI_29_SUITE_DRIFT")
  return Object.freeze([
    "./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/diagnostic-pilot.test.ts packages/strategy-lab/src/league/connected-runner.test.ts scripts/run-v1-38-diagnostic-pilot.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts",
    leagueLine,
    "./node_modules/.bin/tsc --noEmit -p packages/strategy-lab/tsconfig.json",
    "./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.ts scripts/run-v1-38-diagnostic-pilot.ts scripts/run-v1-38-diagnostic-pilot.test.ts scripts/check-v1-38-diagnostic-pilot-boundaries.ts",
    "./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false",
    "./node_modules/.bin/tsx scripts/check-v1-38-serious-league-boundaries.ts",
    "./node_modules/.bin/tsx scripts/check-v1-38-lab-boundaries.ts",
    "./node_modules/.bin/tsx scripts/check-v1-38-factory-boundaries.ts",
    "./node_modules/.bin/tsx scripts/check-v1-38-diagnostic-pilot-boundaries.ts",
    "pnpm exec tsx scripts/check-service-boundary-imports.ts",
    "./node_modules/.bin/vitest run --maxWorkers=1 scripts/check-v1-38-serious-league-boundaries.test.ts scripts/check-v1-38-lab-boundaries.test.ts scripts/check-v1-38-factory-boundaries.test.ts scripts/run-v1-38-diagnostic-pilot.test.ts",
  ])
}
export const checkDiagnosticPilotGate = (options: { readonly gatePath?: string; readonly sourceFiles?: Readonly<Record<string, Uint8Array>>; readonly reviewBytes?: Uint8Array }): DiagnosticPilotSourceGate => {
  const gatePath = options.gatePath ?? GATE_PATH
  const raw = JSON.parse(readFileSync(gatePath, "utf8")) as unknown
  const keys = ["schemaVersion", "sourceFiles", "sourceClosureRoot", "reviewPath", "reviewSha256", "reviewerId", "authorId", "actionableFindings", "commands", "readerSamplesMilliseconds", "readerCeilingMilliseconds", "capacityVersion", "watchdogVersion", "empiricalAuthority", "root"]
  if (!exact(raw, keys) || raw.schemaVersion !== "diagnostic-pilot-source-gate-v1" || raw.reviewPath !== REVIEW_PATH || raw.actionableFindings !== 0 || raw.empiricalAuthority !== false || raw.capacityVersion !== DIAGNOSTIC_PILOT_ARTIFACT_CEILING.version || raw.watchdogVersion !== "diagnostic-pilot-watchdog-v1" || typeof raw.reviewerId !== "string" || typeof raw.authorId !== "string" || raw.reviewerId.length < 2 || raw.authorId.length < 2 || raw.reviewerId === raw.authorId || !root(raw.root)) return fail("GATE_SCHEMA")
  const source = diagnosticPilotSourceClosure((path) => options.sourceFiles === undefined ? readFileSync(path) : options.sourceFiles[path] ?? fail("GATE_SOURCE_MISSING"))
  if (JSON.stringify(raw.sourceFiles) !== JSON.stringify(source.sourceFiles) || raw.sourceClosureRoot !== source.sourceClosureRoot) return fail("GATE_SOURCE_DRIFT")
  const review = options.reviewBytes ?? readFileSync(REVIEW_PATH)
  if (raw.reviewSha256 !== sha(review) || !Buffer.from(review).toString("utf8").includes(source.sourceClosureRoot) || !Buffer.from(review).toString("utf8").includes(`Reviewer: ${raw.reviewerId}`) || !Buffer.from(review).toString("utf8").includes("Actionable findings: 0")) return fail("GATE_REVIEW")
  const required = diagnosticPilotRequiredGateCommands()
  if (!Array.isArray(raw.commands) || raw.commands.length !== required.length || raw.commands.some((entry) => !exact(entry, ["command", "exitCode"]) || typeof entry.command !== "string" || entry.exitCode !== 0) || required.some((command, index) => (raw.commands as { command: string }[])[index]?.command !== command) || !Array.isArray(raw.readerSamplesMilliseconds) || raw.readerSamplesMilliseconds.length < 2 || raw.readerSamplesMilliseconds.some((value) => !Number.isFinite(value) || value <= 0) || typeof raw.readerCeilingMilliseconds !== "number" || raw.readerCeilingMilliseconds < Math.max(...raw.readerSamplesMilliseconds) + 30_000 || raw.readerCeilingMilliseconds > DIAGNOSTIC_PILOT_CELL_MS - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS) return fail("GATE_EVIDENCE")
  const { root: identity, ...body } = raw
  if (identity !== labRoot("diagnostic-pilot-source-gate-v1", body)) return fail("GATE_ROOT")
  return raw as unknown as DiagnosticPilotSourceGate
}

/** The reserve is additive: two providers, each with 2-second stream close,
 * remove and inspect; parent process-group kill, two owned-container checks,
 * separate terminal writer and filesystem uncertainty all have finite slots. */
export const DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS = Object.freeze({
  providerCount: 2,
  streamCloseMilliseconds: 2_000,
  removeMilliseconds: 2_000,
  inspectBeforeMilliseconds: 2_000,
  inspectAfterMilliseconds: 2_000,
  processGroupKillMilliseconds: 2_000,
  terminalWriterAndFsyncMilliseconds: 5_000,
  schedulerAndFilesystemMarginMilliseconds: 7_000,
})
export const DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS = DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.providerCount * (DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.streamCloseMilliseconds + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.removeMilliseconds + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.inspectBeforeMilliseconds + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.inspectAfterMilliseconds) + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.processGroupKillMilliseconds + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.terminalWriterAndFsyncMilliseconds + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.schedulerAndFilesystemMarginMilliseconds
export const DIAGNOSTIC_PILOT_OVERALL_MS = 1_800_000
export const DIAGNOSTIC_PILOT_CELL_MS = 240_000
export const computeDiagnosticPilotDeadlines = (input: { readonly overallStartedAt: number; readonly cellStartedAt: number }) => {
  if (![input.overallStartedAt, input.cellStartedAt].every(Number.isFinite) || input.cellStartedAt < input.overallStartedAt) return fail("DEADLINE_INPUT")
  const cellHardAt = input.cellStartedAt + DIAGNOSTIC_PILOT_CELL_MS
  const overallHardAt = input.overallStartedAt + DIAGNOSTIC_PILOT_OVERALL_MS
  return Object.freeze({ cellHardAt, overallHardAt, killAt: Math.min(cellHardAt, overallHardAt) - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS })
}
export const canStartDiagnosticPilotCell = (now: number, overallStartedAt: number): boolean => Number.isFinite(now) && Number.isFinite(overallStartedAt) && now >= overallStartedAt && now + DIAGNOSTIC_PILOT_CELL_MS + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS <= overallStartedAt + DIAGNOSTIC_PILOT_OVERALL_MS

export const measureDiagnosticPilotReader = (): number => {
  const began = performance.now()
  readDiagnosticPilotAssessedPair(createFactoryRepository(DIAGNOSTIC_PILOT_PHASE264_STORE))
  return Math.ceil(performance.now() - began)
}

export interface DiagnosticPilotCapacityProbe {
  readonly statfs: () => { readonly bavail: bigint; readonly bsize: bigint; readonly ffree: bigint }
  readonly historicalStoreIsDirectory: () => boolean
  readonly pilotStoreExists: () => boolean
}
const defaultCapacityProbe: DiagnosticPilotCapacityProbe = {
  statfs: () => statfsSync(resolve(".strategy-lab"), { bigint: true }),
  historicalStoreIsDirectory: () => lstatSync(resolve(DIAGNOSTIC_PILOT_PHASE264_STORE)).isDirectory(),
  pilotStoreExists: () => existsSync(resolve(DIAGNOSTIC_PILOT_STORE)),
}
/** Read-only observation only. The worker repeats this after run's clock starts. */
export const preflightDiagnosticPilot = (gate: DiagnosticPilotSourceGate, storeState: "fresh" | "reserved" = "fresh", probe: DiagnosticPilotCapacityProbe = defaultCapacityProbe) => {
  const fileSystem = probe.statfs()
  const availableBytes = fileSystem.bavail * fileSystem.bsize
  const availableInodes = fileSystem.ffree
  const requiredBytes = BigInt(DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxBytes + DIAGNOSTIC_PILOT_ARTIFACT_CEILING.terminalReserveBytes) * 4n
  const requiredInodes = BigInt(DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxInodes + DIAGNOSTIC_PILOT_ARTIFACT_CEILING.terminalReserveInodes) * 4n
  if (availableBytes < requiredBytes || availableInodes < requiredInodes) return fail("CAPACITY")
  if (gate.readerCeilingMilliseconds + DIAGNOSTIC_PILOT_CELL_MS + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS > DIAGNOSTIC_PILOT_OVERALL_MS) return fail("FIRST_CELL_INFEASIBLE")
  if (!probe.historicalStoreIsDirectory() || (storeState === "fresh" && probe.pilotStoreExists()) || (storeState === "reserved" && !probe.pilotStoreExists())) return fail("PILOT_STORE_STATE")
  return Object.freeze({ availableBytes: availableBytes.toString(), availableInodes: availableInodes.toString(), requiredBytes: requiredBytes.toString(), requiredInodes: requiredInodes.toString(), consuming: false as const })
}

export interface PilotDockerControl { readonly command: (args: readonly string[], timeoutMs: number) => Promise<{ status: number | null; stdout: string; stderr: string; signal: string | null; error: boolean }> }
const dockerCommand = (args: readonly string[], timeoutMs: number): ReturnType<PilotDockerControl["command"]> => new Promise((resolveCommand) => {
  const child = spawn("docker", [...args], { env: { PATH: process.env.PATH ?? "" }, stdio: ["ignore", "pipe", "pipe"], shell: false, windowsHide: true })
  let stdout = "", stderr = "", error = false, settled = false
  const timer = setTimeout(() => { error = true; child.kill("SIGKILL") }, timeoutMs)
  child.stdout?.on("data", (data: Buffer) => { stdout += data.toString("utf8"); if (stdout.length > 4096) { error = true; child.kill("SIGKILL") } })
  child.stderr?.on("data", (data: Buffer) => { stderr += data.toString("utf8"); if (stderr.length > 4096) { error = true; child.kill("SIGKILL") } })
  child.on("error", () => { error = true })
  child.on("close", (status, signal) => { if (settled) return; settled = true; clearTimeout(timer); resolveCommand({ status, signal, stdout, stderr, error }) })
})
const defaultDocker: PilotDockerControl = { command: dockerCommand }
export const observeDiagnosticPilotHost = async (allocation: DiagnosticPilotAllocation, docker: PilotDockerControl = defaultDocker, memoryProbe: () => ReturnType<typeof parseMemoryPressureQ> = () => {
  const request = MEMORY_PRESSURE_Q_REQUEST
  const result = spawnSync(request.executable, [...request.args], { env: { ...request.env }, stdio: ["ignore", "pipe", "pipe"], shell: false, timeout: request.timeoutMilliseconds, maxBuffer: request.maximumOutputBytes })
  return parseMemoryPressureQ({ stdout: result.stdout, stderr: result.stderr, exitCode: result.status, signal: result.signal, timedOut: (result.error as NodeJS.ErrnoException | undefined)?.code === "ETIMEDOUT" })
}) => {
  const admitted = admitDiagnosticPilotAllocation(allocation)
  const memory = memoryProbe()
  if (!memory.ok || memory.observation.disposition !== "preflight_admitted" || Math.floor(memory.observation.totalBytes * memory.observation.percentage / 100) < 1_073_741_824) return fail("HOST_MEMORY")
  const info = await docker.command(["info", "--format", "{{.NCPU}}|{{.MemTotal}}"], 5_000)
  if (info.error || info.signal !== null || info.status !== 0 || info.stderr !== "" || !/^[0-9]+\|[0-9]+\n?$/u.test(info.stdout)) return fail("DOCKER_DAEMON")
  const [cpus, memoryBytes] = info.stdout.trim().split("|").map(Number)
  if (!Number.isSafeInteger(cpus) || cpus < 2 || !Number.isSafeInteger(memoryBytes) || memoryBytes < 268_435_456) return fail("DOCKER_PROFILE")
  const image = await docker.command(["image", "inspect", "--format", "{{.Id}}|{{.Architecture}}", admitted.image], 5_000)
  if (image.error || image.signal !== null || image.status !== 0 || image.stderr !== "" || !/^sha256:[0-9a-f]{64}\|amd64\n?$/u.test(image.stdout)) return fail("DOCKER_IMAGE")
  for (let ordinal = 0; ordinal < admitted.cells.length; ordinal++) {
    const cell = createDiagnosticPilotCell(admitted, ordinal)
    for (const seat of ["bottom", "top"] as const) {
      const { containerName } = diagnosticPilotContainerIdentity(admitted, cell, seat)
      const inspection = await docker.command(["inspect", "--format", '{{index .Config.Labels "v1.38-lean-owner"}}', containerName], 2_000)
      const absent = !inspection.error && inspection.signal === null && inspection.status === 1 && ((inspection.stdout === "" && inspection.stderr === `Error: No such object: ${containerName}\n`) || (inspection.stdout === "\n" && inspection.stderr === `error: no such object: ${containerName}\n`))
      if (!absent) return fail("DOCKER_NAME_COLLISION")
    }
  }
  return Object.freeze({ memoryBasisPoints: memory.observation.observedBasisPoints, dockerCpus: cpus, dockerMemoryBytes: memoryBytes, imagePresent: true as const, ownedNameCollisions: 0 as const })
}
export const cleanupDiagnosticPilotContainers = async (allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell, docker: PilotDockerControl = defaultDocker): Promise<boolean> => {
  const admitted = admitDiagnosticPilotCell(allocation, cell)
  for (const seat of ["bottom", "top"] as const) {
    const { containerName, ownershipLabel } = diagnosticPilotContainerIdentity(allocation, admitted, seat)
    const inspect = async () => docker.command(["inspect", "--format", '{{index .Config.Labels "v1.38-lean-owner"}}', containerName], 2_000)
    const first = await inspect()
    const absent = (row: Awaited<ReturnType<typeof inspect>>) => !row.error && row.signal === null && row.status === 1 && ((row.stdout === "" && row.stderr === `Error: No such object: ${containerName}\n`) || (row.stdout === "\n" && row.stderr === `error: no such object: ${containerName}\n`))
    if (absent(first)) continue
    if (first.error || first.signal !== null || first.status !== 0 || first.stderr !== "" || first.stdout.trim() !== ownershipLabel) return false
    const removed = await docker.command(["rm", "--force", containerName], 2_000)
    if (removed.error || removed.signal !== null || removed.status !== 0 || removed.stderr !== "") return false
    if (!absent(await inspect())) return false
  }
  return true
}

/** Bounded private evidence stream. Each canonical JSON row is retained in a
 * hash-checked chunk; no event, accounting row or failed invocation is elided. */
export const retainDiagnosticPilotExecution = (ledger: DiagnosticPilotLedger, start: DiagnosticPilotStart, execution: LabMatchExecution) => {
  if (!ledger.writeEvidence || !ledger.readEvidence || execution.transitions.length > 1_010_000 || execution.accounting.length > 49_600) return fail("EVIDENCE_WRITER")
  let artifactBytes = 0, artifactRecords = 0
  const write = (bytes: Uint8Array) => { const identity = ledger.writeEvidence!(start.root, bytes); artifactBytes += bytes.length; artifactRecords++; return identity }
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value), "utf8")
  const rows = (values: readonly unknown[], rowLimit: number): LabRoot[] => {
    const roots: LabRoot[] = []; let pending: Buffer[] = [], pendingBytes = 0
    const flush = () => { if (pendingBytes) { roots.push(write(Buffer.concat(pending, pendingBytes))); pending = []; pendingBytes = 0 } }
    const append = (bytes: Buffer) => { for (let offset = 0; offset < bytes.length;) { const take = Math.min(131_072 - pendingBytes, bytes.length - offset); pending.push(bytes.subarray(offset, offset + take)); pendingBytes += take; offset += take; if (pendingBytes === 131_072) flush() } }
    for (const value of values) {
      const bytes = encode(value)
      if (bytes.length < 1 || bytes.length > rowLimit) return fail("EVIDENCE_ROW_CAP")
      append(bytes); append(Buffer.from("\n"))
    }
    flush(); return roots
  }
  const transitionRoots = rows(execution.transitions, 8_192)
  const accountingRoots = rows(execution.accounting, 262_144 + 8_192)
  const outcome = execution.kind === "completed" ? { kind: "completed", privacy: execution.privacy, state: execution.result.state } : { kind: "failure", privacy: execution.privacy, failure: execution.failure, unchangedState: execution.unchangedState }
  const outcomeBytes = encode(outcome)
  if (outcomeBytes.length > 131_072) return fail("EVIDENCE_OUTCOME_CAP")
  const outcomeRoot = write(outcomeBytes)
  const manifestBytes = encode({ schemaVersion: "diagnostic-pilot-execution-manifest-v1", startRoot: start.root, transitionRoots, accountingRoots, outcomeRoot, transitionCount: execution.transitions.length, accountingCount: execution.accounting.length })
  if (manifestBytes.length > 131_072) return fail("EVIDENCE_MANIFEST_CAP")
  const evidenceRoot = write(manifestBytes)
  return Object.freeze({ evidenceRoot, artifactBytes, artifactRecords })
}
export const verifyRetainedDiagnosticPilotExecution = (ledger: DiagnosticPilotLedger, start: DiagnosticPilotStart, evidenceRoot: LabRoot): Readonly<{ transitionCount: number; accountingCount: number; artifactBytes: number; artifactRecords: number }> => {
  if (!ledger.readEvidence || !root(evidenceRoot)) return fail("EVIDENCE_READER")
  let artifactBytes = 0, artifactRecords = 0
  const read = (identity: LabRoot) => { const bytes = ledger.readEvidence!(start.root, identity); artifactBytes += bytes.length; artifactRecords++; if (artifactBytes > DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxBytes || artifactRecords > DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxRecords) return fail("EVIDENCE_READ_CAP"); return bytes }
  const manifest = JSON.parse(Buffer.from(read(evidenceRoot)).toString("utf8")) as unknown
  if (!exact(manifest, ["schemaVersion", "startRoot", "transitionRoots", "accountingRoots", "outcomeRoot", "transitionCount", "accountingCount"]) || manifest.schemaVersion !== "diagnostic-pilot-execution-manifest-v1" || manifest.startRoot !== start.root || !Array.isArray(manifest.transitionRoots) || !Array.isArray(manifest.accountingRoots) || !manifest.transitionRoots.every(root) || !manifest.accountingRoots.every(root) || !root(manifest.outcomeRoot) || !Number.isSafeInteger(manifest.transitionCount) || !Number.isSafeInteger(manifest.accountingCount) || (manifest.transitionCount as number) < 0 || (manifest.transitionCount as number) > 1_010_000 || (manifest.accountingCount as number) < 0 || (manifest.accountingCount as number) > 49_600) return fail("EVIDENCE_MANIFEST")
  const countRows = (roots: LabRoot[]) => {
    let count = 0, carry = Buffer.alloc(0)
    for (const identity of roots) {
      const data = Buffer.concat([carry, Buffer.from(read(identity))])
      let offset = 0
      for (let at = data.indexOf(10); at >= 0; at = data.indexOf(10, offset)) {
        const line = data.subarray(offset, at)
        if (!line.length) return fail("EVIDENCE_ROW")
        JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(line)); count++; offset = at + 1
      }
      carry = data.subarray(offset)
      if (carry.length > 262_144 + 8_192) return fail("EVIDENCE_ROW_CAP")
    }
    if (carry.length) return fail("EVIDENCE_UNTERMINATED_ROW")
    return count
  }
  const transitions = countRows(manifest.transitionRoots as LabRoot[]), accounting = countRows(manifest.accountingRoots as LabRoot[])
  if (transitions !== manifest.transitionCount || accounting !== manifest.accountingCount) return fail("EVIDENCE_COUNTS")
  const outcome = JSON.parse(Buffer.from(read(manifest.outcomeRoot as LabRoot)).toString("utf8")) as unknown
  if (!outcome || typeof outcome !== "object" || !["completed", "failure"].includes((outcome as { kind: string }).kind)) return fail("EVIDENCE_OUTCOME")
  return Object.freeze({ transitionCount: transitions, accountingCount: accounting, artifactBytes, artifactRecords })
}

const waitForCellPermission = (ordinal: number): Promise<boolean> => new Promise((resolvePermission) => {
  const receive = (message: unknown) => {
    if (!exact(message, ["kind", "ordinal"]) || message.kind !== "cell-go" || message.ordinal !== ordinal) { process.off("message", receive); resolvePermission(false); return }
    process.off("message", receive); resolvePermission(true)
  }
  process.on("message", receive)
})
const writeDiagnosticPilotTimeout = (allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell, code: "cell_deadline" | "overall_deadline" | "cleanup_incomplete"): "written" | "no_start" => {
  const admitted = admitDiagnosticPilotCell(admitDiagnosticPilotAllocation(allocation), cell)
  const start = createDiagnosticPilotStart(allocation, admitted)
  const ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
  if (ledger.readStart(start.root) === null) return "no_start"
  if (ledger.readTerminal(start.root) !== null) return fail("TIMEOUT_ALREADY_TERMINAL")
  ledger.writeTerminal(createDiagnosticPilotTerminal(start, { disposition: code === "cleanup_incomplete" ? "uncertain" : "timeout", processValidity: "process_invalid", evidenceRoot: null, cleanupComplete: code !== "cleanup_incomplete", elapsedMilliseconds: 240_000, artifactBytes: 0, artifactRecords: 0, code }))
  const reopened = reopenDiagnosticPilotLedger(ledger, allocation)
  if (reopened.records.find((entry) => entry.start.root === start.root)?.terminal?.code !== code) return fail("TIMEOUT_REOPEN")
  return "written"
}

/** Private worker only: it is never invoked by source-only commands or tests.
 * Parent IPC permission arrives before the first durable byte of a cell. */
const runDiagnosticPilotWorker = async (allocationPath: string): Promise<void> => {
  if (!process.send) return fail("WORKER_IPC")
  const gate = checkDiagnosticPilotGate({})
  preflightDiagnosticPilot(gate, "reserved")
  const allocation = admitDiagnosticPilotAllocation(JSON.parse(readFileSync(allocationPath, "utf8")))
  if (allocation.sourceClosureRoot !== gate.sourceClosureRoot || allocation.implementationRoot !== gate.sourceClosureRoot || allocation.gateRoot !== gate.root) return fail("WORKER_ALLOCATION_GATE")
  await observeDiagnosticPilotHost(allocation)
  const historicalRepository = createFactoryRepository(DIAGNOSTIC_PILOT_PHASE264_STORE)
  const readerStartedAt = performance.now()
  const assessed = readDiagnosticPilotAssessedPair(historicalRepository)
  if (performance.now() - readerStartedAt > gate.readerCeilingMilliseconds) return fail("WORKER_READER_LATENCY")
  const ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
  const existing = reopenDiagnosticPilotLedger(ledger, allocation)
  if (existing.records.length > 0) return fail("WORKER_REUSE_DENIED")
  for (const [ordinal] of allocation.cells.entries()) {
    const cell = createDiagnosticPilotCell(allocation, ordinal), start = createDiagnosticPilotStart(allocation, cell)
    process.send({ kind: "cell-request", allocation, cell } satisfies PilotMessage)
    if (!await waitForCellPermission(ordinal)) { process.send({ kind: "done", status: "safe_no_start" } satisfies PilotMessage); return }
    const cellStartedAt = performance.now()
    preflightDiagnosticPilot(gate, "reserved")
    await observeDiagnosticPilotHost(allocation)
    ledger.writeStart(start)
    let bottom: ReturnType<typeof issueDiagnosticPilotProviderFromFactoryCandidate> | null = null
    let top: ReturnType<typeof issueDiagnosticPilotProviderFromFactoryCandidate> | null = null
    try {
      const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === "arena:smoke:v1")
      if (!smoke) return fail("WORKER_SMOKE")
      const host: FactorySupervisedRuntimeHost = { createFactorySupervisedRuntime: (request) => {
        if (!request.pilotLifetimeGrant) return fail("WORKER_LIFETIME_GRANT")
        const grant = request.pilotLifetimeGrant
        const { executableRoot: _executableRoot, ...runtimeRequest } = request
        return createFactorySupervisedRuntime({ ...runtimeRequest, matchId: `diagnostic-pilot-${start.root.slice(7, 27)}`, containerName: grant.containerName, ownershipLabel: grant.ownershipLabel, image: allocation.image, invocationLimit: 24_800, factoryLifetimeMs: 240_000 })
      } }
      const byRoot = new Map(assessed.map((entry) => [entry.candidate.root, entry]))
      const issue = (seat: "bottom" | "top") => {
        const candidateRoot = seat === "bottom" ? cell.bottomCandidateRoot : cell.topCandidateRoot
        const candidate = byRoot.get(candidateRoot)
        if (!candidate) return fail("WORKER_CANDIDATE")
        const pilotLifetimeGrant = createDiagnosticPilotLifetimeGrant(ledger, allocation, cell, start, seat)
        return issueDiagnosticPilotProviderFromFactoryCandidate({ host, factoryRepository: historicalRepository, ledger, allocation, cell, start, requestRoot: cell.requestRoot, assessed: candidate, pilotLifetimeGrant })
      }
      bottom = issue("bottom")
      top = issue("top")
      const match = { matchId: `diagnostic-pilot-${start.root.slice(7, 27)}`, seed: allocation.seed, arenaVariant: smoke, bottomPlayerId: leaguePlayerId(cell.bottomCandidateRoot), topPlayerId: leaguePlayerId(cell.topCandidateRoot), initialInitiativePlayerId: leaguePlayerId(cell.initialInitiativeCandidateRoot), bottomStrategyRevisionId: bottom.identity.revisionId, topStrategyRevisionId: top.identity.revisionId }
      let retained: ReturnType<typeof retainDiagnosticPilotExecution> | null = null
      const result = await runDiagnosticPilotCell({ ledger, allocation, cell, start, requestRoot: cell.requestRoot, bottom, top, match, beforeReturn: (execution) => { retained = retainDiagnosticPilotExecution(ledger, start, execution) } })
      const cleaned = await cleanupDiagnosticPilotContainers(allocation, cell)
      const elapsedMilliseconds = Math.ceil(performance.now() - cellStartedAt)
      if (elapsedMilliseconds >= 240_000) return fail("WORKER_CELL_DEADLINE")
      if (!retained) return fail("WORKER_MISSING_EVIDENCE")
      const evidence = retained as ReturnType<typeof retainDiagnosticPilotExecution>
      const terminal = createDiagnosticPilotTerminal(start, { disposition: result.disposition, processValidity: result.processValidity, evidenceRoot: evidence.evidenceRoot, cleanupComplete: cleaned && result.cleanupComplete, elapsedMilliseconds, artifactBytes: evidence.artifactBytes, artifactRecords: evidence.artifactRecords, code: result.disposition === "success" ? "completed" : result.disposition })
      ledger.writeTerminal(terminal)
      process.send({ kind: "cell-complete", ordinal } satisfies PilotMessage)
      if (result.disposition !== "success" || !cleaned) { process.send({ kind: "done", status: "process_invalid" } satisfies PilotMessage); return }
    } catch {
      if (bottom) closeDiagnosticPilotIssuedProvider(bottom)
      if (top) closeDiagnosticPilotIssuedProvider(top)
      const cleaned = await cleanupDiagnosticPilotContainers(allocation, cell)
      const elapsedMilliseconds = Math.min(240_000, Math.max(0, Math.ceil(performance.now() - cellStartedAt)))
      try { ledger.writeTerminal(createDiagnosticPilotTerminal(start, { disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: null, cleanupComplete: cleaned, elapsedMilliseconds, artifactBytes: 0, artifactRecords: 0, code: cleaned ? "system_failure" : "cleanup_incomplete" })) } catch { /* start-only remains process-invalid */ }
      process.send({ kind: "done", status: "process_invalid" } satisfies PilotMessage)
      return
    }
  }
  const final = reopenDiagnosticPilotLedger(ledger, allocation)
  if (final.records.length !== 4 || final.records.some((entry) => entry.terminal?.disposition !== "success" || entry.terminal.processValidity !== "process_valid" || !entry.terminal.evidenceRoot)) return fail("WORKER_FINAL_REOPEN")
  for (const entry of final.records) {
    const evidence = verifyRetainedDiagnosticPilotExecution(ledger, entry.start, entry.terminal!.evidenceRoot!)
    if (evidence.artifactBytes !== entry.terminal!.artifactBytes || evidence.artifactRecords !== entry.terminal!.artifactRecords) return fail("WORKER_FINAL_EVIDENCE")
  }
  process.send({ kind: "done", status: "process_valid" } satisfies PilotMessage)
}

type PilotMessage = { kind: "cell-request"; allocation: DiagnosticPilotAllocation; cell: DiagnosticPilotCell } | { kind: "cell-complete"; ordinal: number } | { kind: "done"; status: "safe_no_start" | "process_valid" | "process_invalid" }
export interface PilotWatchdogHost {
  readonly now: () => number
  readonly spawnWorker: (allocationPath: string) => ChildProcess
  readonly cleanup: (allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell) => Promise<boolean>
  readonly publishTimeout: (allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell, code: "cell_deadline" | "overall_deadline" | "cleanup_incomplete") => Promise<"written" | "no_start" | "uncertain">
  readonly killGroup: (child: ChildProcess) => void
}
const defaultHost: PilotWatchdogHost = {
  now: () => performance.now(),
  spawnWorker: (allocationPath) => spawn(process.execPath, [...process.execArgv, fileURLToPath(import.meta.url), "worker", allocationPath], { detached: true, stdio: ["ignore", "ignore", "ignore", "ipc"], env: { PATH: process.env.PATH ?? "", NODE_ENV: "production" } }),
  cleanup: (allocation, cell) => cleanupDiagnosticPilotContainers(allocation, cell),
  publishTimeout: (allocation, cell, code) => new Promise((resolvePublication) => {
    const payload = Buffer.from(JSON.stringify({ allocation, cell, code }), "utf8").toString("base64")
    const writer = spawn(process.execPath, [...process.execArgv, fileURLToPath(import.meta.url), "terminal-writer", payload], { stdio: ["ignore", "pipe", "ignore"], env: { PATH: process.env.PATH ?? "", NODE_ENV: "production" }, shell: false })
    let output = "", failed = false
    const timer = setTimeout(() => { failed = true; writer.kill("SIGKILL") }, 5_000)
    writer.stdout?.on("data", (bytes: Buffer) => { output += bytes.toString("utf8"); if (output.length > 64) { failed = true; writer.kill("SIGKILL") } })
    writer.on("error", () => { failed = true })
    writer.on("close", (status) => { clearTimeout(timer); resolvePublication(!failed && status === 0 && (output === "written\n" || output === "no_start\n") ? output.trim() as "written" | "no_start" : "uncertain") })
  }),
  killGroup: (child) => { if (child.pid !== undefined) { try { process.kill(-child.pid, "SIGKILL") } catch { child.kill("SIGKILL") } } },
}
/** The parent performs no historical reading, Docker sync I/O or fsync. The
 * worker must ask permission before each durable start, so this monotonic cell
 * window begins before any charge or provider issuance. */
export const runDiagnosticPilotWatchdog = (allocationPath: string, host: PilotWatchdogHost = defaultHost): Promise<"safe_no_start" | "process_valid" | "process_invalid"> => {
  const overallStartedAt = host.now()
  const child = host.spawnWorker(allocationPath)
  return new Promise((resolveRun) => {
    let finished = false, timedOut = false, completed = 0, active: { allocation: DiagnosticPilotAllocation; cell: DiagnosticPilotCell; startedAt: number } | null = null
    let timer: NodeJS.Timeout | null = null
    const settle = (status: "safe_no_start" | "process_valid" | "process_invalid") => { if (finished) return; finished = true; if (timer) clearTimeout(timer); resolveRun(status) }
    const arm = (at: number, code: "cell_deadline" | "overall_deadline") => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => { if (finished) return; timedOut = true; try { host.killGroup(child) } catch { /* still reconcile exact owned names */ }; if (!active) { settle(completed === 0 ? "safe_no_start" : "process_invalid"); return }; const current = active; timer = setTimeout(() => settle("process_invalid"), DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS); void host.cleanup(current.allocation, current.cell).then((clean) => host.publishTimeout(current.allocation, current.cell, clean ? code : "cleanup_incomplete").then((publication) => settle(clean && publication === "no_start" && completed === 0 ? "safe_no_start" : "process_invalid")), () => settle("process_invalid")) }, Math.max(0, at - host.now()))
    }
    arm(overallStartedAt + DIAGNOSTIC_PILOT_OVERALL_MS - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS, "overall_deadline")
    child.on("message", (raw: PilotMessage) => {
      if (finished || !raw || typeof raw !== "object") return
      if (raw.kind === "cell-request") {
        try {
          if (active) return fail("OVERLAPPING_CELLS")
          const allocation = admitDiagnosticPilotAllocation(raw.allocation), cell = admitDiagnosticPilotCell(allocation, raw.cell), now = host.now()
          if (cell.ordinal !== completed || !canStartDiagnosticPilotCell(now, overallStartedAt)) { child.send?.({ kind: "stop" }); settle(completed === 0 ? "safe_no_start" : "process_invalid"); return }
          active = { allocation, cell, startedAt: now }
          const schedule = computeDiagnosticPilotDeadlines({ overallStartedAt, cellStartedAt: now })
          arm(schedule.killAt, schedule.cellHardAt <= schedule.overallHardAt ? "cell_deadline" : "overall_deadline")
          child.send?.({ kind: "cell-go", ordinal: cell.ordinal })
        } catch { host.killGroup(child); settle("process_invalid") }
      } else if (raw.kind === "cell-complete") {
        if (!active || raw.ordinal !== active.cell.ordinal) { host.killGroup(child); settle("process_invalid"); return }
        completed++
        active = null
        arm(overallStartedAt + DIAGNOSTIC_PILOT_OVERALL_MS - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS, "overall_deadline")
      } else if (raw.kind === "done") {
        if (active) {
          const current = active
          if (timer) clearTimeout(timer)
          timer = setTimeout(() => settle("process_invalid"), DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS)
          void host.cleanup(current.allocation, current.cell).then(() => settle("process_invalid"), () => settle("process_invalid"))
          return
        }
        settle(raw.status === "process_valid" && completed === 4 ? "process_valid" : raw.status === "safe_no_start" && completed === 0 ? "safe_no_start" : "process_invalid")
      }
    })
    child.on("error", () => settle("process_invalid"))
    child.on("exit", () => { if (!finished && !timedOut) { if (active) { const current = active; if (timer) clearTimeout(timer); timer = setTimeout(() => settle("process_invalid"), DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS); void host.cleanup(current.allocation, current.cell).then((clean) => host.publishTimeout(current.allocation, current.cell, "cleanup_incomplete").then((publication) => settle(clean && publication === "no_start" && completed === 0 ? "safe_no_start" : "process_invalid")), () => settle("process_invalid")) } else settle(completed === 0 ? "safe_no_start" : "process_invalid") } })
  })
}

const main = async (args: readonly string[]) => {
  const command = args[0]
  if (command === "check-gate") { checkDiagnosticPilotGate({ gatePath: args[2] ?? GATE_PATH }); process.stdout.write("diagnostic-pilot-gate: pass\n"); return }
  if (command === "measure-targeted-reader") { process.stdout.write(JSON.stringify({ elapsedMilliseconds: measureDiagnosticPilotReader(), sourceOnly: true, empiricalAuthority: false }) + "\n"); return }
  if (command === "prepare") { const gate = checkDiagnosticPilotGate({}); const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: gate.sourceClosureRoot, implementationRoot: gate.sourceClosureRoot, gateRoot: gate.root }); process.stdout.write(JSON.stringify(allocation) + "\n"); return }
  if (command === "preflight") { const gate = checkDiagnosticPilotGate({}); const capacity = preflightDiagnosticPilot(gate); const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: gate.sourceClosureRoot, implementationRoot: gate.sourceClosureRoot, gateRoot: gate.root }); const host = await observeDiagnosticPilotHost(allocation); process.stdout.write(JSON.stringify({ capacity, host, consuming: false }) + "\n"); return }
  if (command === "verify-retained") { if (args[1] !== "--allocation" || !args[2]) return fail("VERIFY_ALLOCATION_ARGUMENT"); const allocation = admitDiagnosticPilotAllocation(JSON.parse(readFileSync(args[2], "utf8"))); const ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE); const state = reopenDiagnosticPilotLedger(ledger, allocation); for (const entry of state.records) if (entry.terminal?.evidenceRoot) { const verified = verifyRetainedDiagnosticPilotExecution(ledger, entry.start, entry.terminal.evidenceRoot); if (verified.artifactBytes !== entry.terminal.artifactBytes || verified.artifactRecords !== entry.terminal.artifactRecords) return fail("VERIFY_TERMINAL_COUNTS") }; process.stdout.write(JSON.stringify(state) + "\n"); return }
  if (command === "run") { if (args[1] !== "--allocation" || !args[2]) return fail("RUN_ALLOCATION_ARGUMENT"); const outcome = await runDiagnosticPilotWatchdog(args[2]); process.stdout.write(`${outcome}\n`); if (outcome !== "process_valid") process.exitCode = 1; return }
  if (command === "worker") { if (!args[1]) return fail("WORKER_ALLOCATION_ARGUMENT"); return runDiagnosticPilotWorker(args[1]) }
  if (command === "terminal-writer") { if (!args[1]) return fail("WRITER_INPUT"); const decoded = JSON.parse(Buffer.from(args[1], "base64").toString("utf8")) as unknown; if (!exact(decoded, ["allocation", "cell", "code"]) || !["cell_deadline", "overall_deadline", "cleanup_incomplete"].includes(String(decoded.code))) return fail("WRITER_INPUT"); const outcome = writeDiagnosticPilotTimeout(decoded.allocation as DiagnosticPilotAllocation, decoded.cell as DiagnosticPilotCell, decoded.code as "cell_deadline" | "overall_deadline" | "cleanup_incomplete"); process.stdout.write(`${outcome}\n`); return }
  return fail("COMMAND")
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) void main(process.argv.slice(2)).catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.message : "DIAGNOSTIC_PILOT_UNKNOWN"}\n`); process.exitCode = 1 })
