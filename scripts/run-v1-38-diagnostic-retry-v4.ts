import { createHash, randomUUID } from "node:crypto"
import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { closeSync, constants, existsSync, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, statfsSync, writeSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { performance } from "node:perf_hooks"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { freezeLabValue, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createFactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { DIAGNOSTIC_PILOT_PHASE264_STORE, readDiagnosticPilotAssessedPair } from "../packages/strategy-lab/src/league/diagnostic-pilot.js"
import { readDiagnosticPilotOldEvidenceBaseline } from "./run-v1-38-diagnostic-pilot.js"
// Pure enumeration only: no v3 selector, gate, token or operational function is called.
import { oneCellSourcePaths, checkOneCellWorkspaceResolution } from "./run-v1-38-one-cell-diagnostic.js"
import { createFactorySupervisedRuntime } from "./lib/v1-38-factory-supervised-runtime.js"
import { MEMORY_PRESSURE_Q_REQUEST, parseMemoryPressureQ } from "./lib/v1-38-darwin-headroom.js"
import {
  DIAGNOSTIC_RETRY_V4_CAPACITY, DIAGNOSTIC_RETRY_V4_SEED, DIAGNOSTIC_RETRY_V4_STAGES,
  admitDiagnosticRetryV4Allocation, createDiagnosticRetryV4Allocation, createDiagnosticRetryV4Cell,
  createDiagnosticRetryV4Start, createDiagnosticRetryV4Stage, createDiagnosticRetryV4Terminal,
  createDiagnosticRetryV4Result, diagnosticRetryV4ContainerIdentity, openDiagnosticRetryV4Ledger,
  issueDiagnosticRetryV4LifetimeGrant, retainDiagnosticRetryV4PartialEvidence, safeDiagnosticRetryV4Cause,
  type DiagnosticRetryV4Allocation, type DiagnosticRetryV4Ledger,
} from "../packages/strategy-lab/src/league/diagnostic-retry-v4.js"
import {
  issueDiagnosticRetryV4ProviderFromFactoryCandidate, closeDiagnosticRetryV4IssuedProvider,
  runAuthorizedDiagnosticRetryV4, type DiagnosticRetryV4RuntimeHost, type DiagnosticRetryV4IssuedProvider,
} from "../packages/strategy-lab/src/league/diagnostic-retry-v4-bridge.js"

const fail = (code: string): never => { throw new TypeError(`DIAGNOSTIC_RETRY_V4_CLI_${code}`) }
const hash = (bytes: Uint8Array | string): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const isRoot = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v)
const canonical = (value: unknown): Uint8Array => { const r = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!r.ok) return fail("CANONICAL"); return r.canonicalBytes }
const same = (a: unknown, b: unknown): boolean => hash(canonical(a)) === hash(canonical(b))
const exact = (v: unknown, keys: readonly string[]): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).sort().join("\0") === [...keys].sort().join("\0")
const readBytes = (path: string, max = 32_000_000): Buffer => {
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try { const s = fstatSync(fd); if (!s.isFile() || s.nlink !== 1 || s.size < 1 || s.size > max) return fail("FILE"); const bytes = readFileSync(fd); if (bytes.length !== s.size) return fail("FILE_RACE"); return bytes } finally { closeSync(fd) }
}
const read = (path: string): unknown => { const r = admitCanonicalJsonBytes(readBytes(path), { profile: "canonical-manifest", operation: "require-canonical" }); if (!r.ok) return fail("RECORD"); return r.value }
const syncDirectory = (path: string): void => { const fd = openSync(path, constants.O_RDONLY); try { fsyncSync(fd) } finally { closeSync(fd) } }
export const durableRetryV4Create = (path: string, value: unknown): void => {
  if (realpathSync(dirname(path)) !== resolve(dirname(path))) return fail("WRITE_ALIAS")
  const bytes = canonical(value), fd = openSync(path, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
  try { for (let offset = 0; offset < bytes.length;) offset += writeSync(fd, bytes, offset, bytes.length - offset); fsyncSync(fd) } finally { closeSync(fd) }
  syncDirectory(dirname(path))
}
const rooted = <T extends Record<string, unknown>>(domain: string, body: T): Readonly<T & { root: LabRoot }> => freezeLabValue({ ...body, root: labRoot(domain, body) })
const requireRooted = (domain: string, value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail("ROOTED")
  const { root, ...fields } = value as Record<string, unknown>
  if (!isRoot(root) || root !== labRoot(domain, fields)) return fail("ROOTED")
  return value as Record<string, unknown>
}
export const RETRY_V4_CLOSURE_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-13-RETRY-V4-SOURCE-CLOSURE.json"
export const RETRY_V4_REVIEW_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-13-RETRY-V4-SOURCE-REVIEW.md"
export const RETRY_V4_REPOSITORY = ".strategy-lab/league-265-retry-v4"
export const RETRY_V4_BOUNDS = Object.freeze({ maxAttempts: 5, cellMilliseconds: 240_000, runEntryMilliseconds: 600_000, cleanupMilliseconds: 30_000 })
export const RETRY_V4_TEST_FILES = Object.freeze([
  "packages/strategy-lab/src/league/diagnostic-retry-v4.test.ts",
  "packages/strategy-lab/src/league/diagnostic-retry-v4-bridge.test.ts",
  "scripts/lib/v1-38-factory-supervised-runtime.test.ts",
  "scripts/lib/v1-38-planner-supervised-runtime.test.ts",
  "scripts/run-v1-38-diagnostic-retry-v4.test.ts",
])
export const RETRY_V4_REQUIRED_COMMANDS = Object.freeze([
  `pnpm exec vitest run --maxWorkers=1 ${RETRY_V4_TEST_FILES.join(" ")}`,
  "pnpm exec tsc --noEmit -p packages/strategy-lab/tsconfig.json",
  "pnpm exec tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck --types node scripts/run-v1-38-diagnostic-retry-v4.ts scripts/run-v1-38-diagnostic-retry-v4.test.ts scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.ts",
])
const configs = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((e) => e.isFile() && /^tsconfig.*\.json$/u.test(e.name) ? [join(directory, e.name).replace(/^\.\//u, "")] : [])
export const diagnosticRetryV4SourcePaths = (): readonly string[] => Object.freeze([...new Set([
  ...oneCellSourcePaths(), ...configs("."),
  ...readdirSync("packages", { withFileTypes: true }).filter((e) => e.isDirectory()).flatMap((e) => configs(`packages/${e.name}`)),
])].filter((p) => p !== RETRY_V4_CLOSURE_PATH && p !== RETRY_V4_REVIEW_PATH).sort())
export const diagnosticRetryV4SourceClosure = (paths: readonly string[] = diagnosticRetryV4SourcePaths(), reader = readBytes) => {
  const repository = realpathSync(".")
  const sourceFiles = [...paths].sort().map((path) => {
    const actual = realpathSync(path)
    if (actual !== repository && !actual.startsWith(`${repository}/`) || actual !== resolve(path)) return fail("SOURCE_REALPATH")
    return { path, sha256: hash(reader(path)) }
  })
  return rooted("diagnostic-retry-source-closure-v4", { schemaVersion: "diagnostic-retry-source-closure-v4", sourceFiles, sourceClosureRoot: labRoot("diagnostic-retry-source-files-v4", sourceFiles), empiricalAuthority: false })
}
/** Review is actual structured Markdown, without a new signing/custody ritual.
 * A fenced JSON block carries the independently recorded source root/checks. */
export const parseDiagnosticRetryV4Review = (text: string, closure: ReturnType<typeof diagnosticRetryV4SourceClosure>) => {
  const blocks = [...text.matchAll(/```json\s*\n([\s\S]*?)\n```/gu)]
  if (blocks.length !== 1) return fail("REVIEW_BLOCK")
  const value = JSON.parse(blocks[0]![1]!) as unknown
  if (!exact(value, ["schemaVersion", "sourceClosureRoot", "closureRoot", "reviewer", "independent", "disposition", "unresolvedActionableFindings", "commands"]) || value.schemaVersion !== "diagnostic-retry-source-review-v4" || value.sourceClosureRoot !== closure.sourceClosureRoot || value.closureRoot !== closure.root || typeof value.reviewer !== "string" || value.reviewer.length < 1 || value.independent !== true || value.disposition !== "accepted" || value.unresolvedActionableFindings !== 0 || !Array.isArray(value.commands) || value.commands.length !== RETRY_V4_REQUIRED_COMMANDS.length) return fail("REVIEW")
  for (let i = 0; i < RETRY_V4_REQUIRED_COMMANDS.length; i++) { const c = value.commands[i]; if (!exact(c, ["command", "exitCode"]) || c.command !== RETRY_V4_REQUIRED_COMMANDS[i] || c.exitCode !== 0) return fail("REVIEW_COMMANDS") }
  return Object.freeze(value)
}
export const checkDiagnosticRetryV4SourceClosure = (closurePath = RETRY_V4_CLOSURE_PATH, reviewPath = RETRY_V4_REVIEW_PATH) => {
  checkOneCellWorkspaceResolution()
  const closure = diagnosticRetryV4SourceClosure(), retained = read(closurePath)
  if (!same(closure, retained)) return fail("SOURCE_DRIFT")
  const reviewBytes = readBytes(reviewPath, 262_144), review = parseDiagnosticRetryV4Review(reviewBytes.toString("utf8"), closure)
  return Object.freeze({ closure, review, reviewHash: hash(reviewBytes), implementationRoot: labRoot("diagnostic-retry-implementation-v4", { sourceClosureRoot: closure.sourceClosureRoot, reviewHash: hash(reviewBytes) }) })
}
export const historicalRetryV4Snapshot = () => {
  const oldEvidenceBaseline = readDiagnosticPilotOldEvidenceBaseline()
  const paths = [
    ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-allocation-v3.json",
    ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-result-v3.json",
    "packages/strategy-lab/src/league/diagnostic-one-cell.ts",
    "packages/strategy-lab/src/league/connected-runner.ts",
    "scripts/run-v1-38-one-cell-diagnostic.ts",
  ]
  const tree = (directory: string): void => {
    if (realpathSync(directory) !== resolve(directory)) return fail("HISTORY_ALIAS")
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      const p = join(directory, entry.name)
      if (entry.isDirectory()) tree(p)
      else if (entry.isFile()) paths.push(p)
      else return fail("HISTORY_ALIAS")
    }
  }
  tree(".strategy-lab/league-265-one-cell-diagnostic-v3-20260929-a")
  tree(".strategy-lab/league-265-diagnostic-pilot-20260923-a")
  const historicalFiles = paths.sort().map((path) => ({ path, sha256: hash(readBytes(path, 64_000_000)) }))
  return freezeLabValue({ oldEvidenceBaseline, historicalFiles, historicalRoot: labRoot("diagnostic-retry-historical-v4", { oldEvidenceBaseline, historicalFiles }) })
}
const noAuthority = Object.freeze({ leagueRequirementsEvidence: false, freezeAuthorized: false, formationAuthorized: false, holdoutAuthorized: false, counted: false, public: false, productionAuthorized: false })
export const createDiagnosticRetryV4Envelope = (input: {
  authorizationMessage: string; sourceClosureRoot: LabRoot; closureRoot: LabRoot; reviewHash: LabRoot; implementationRoot: LabRoot;
  closurePath: string; reviewPath: string; historical: ReturnType<typeof historicalRetryV4Snapshot>;
}) => {
  if (typeof input.authorizationMessage !== "string" || input.authorizationMessage.length < 1 || Buffer.byteLength(input.authorizationMessage) > 65_536 || ![input.sourceClosureRoot, input.closureRoot, input.reviewHash, input.implementationRoot, input.historical.historicalRoot].every(isRoot)) return fail("ENVELOPE_INPUT")
  return rooted("diagnostic-retry-authority-envelope-v4", {
    schemaVersion: "diagnostic-retry-authority-envelope-v4", privacy: "private_offline", evidenceClass: "diagnostic_only",
    authorizationMessage: input.authorizationMessage, authorizationMessageHash: hash(input.authorizationMessage),
    sourceClosureRoot: input.sourceClosureRoot, closureRoot: input.closureRoot, reviewHash: input.reviewHash, implementationRoot: input.implementationRoot,
    closurePath: input.closurePath, reviewPath: input.reviewPath, historical: input.historical,
    seed: DIAGNOSTIC_RETRY_V4_SEED, bounds: RETRY_V4_BOUNDS, ...noAuthority,
  })
}
export type DiagnosticRetryV4Envelope = ReturnType<typeof createDiagnosticRetryV4Envelope>
export const createDiagnosticRetryV4AllocationSet = (envelope: DiagnosticRetryV4Envelope) => rooted("diagnostic-retry-allocation-set-v4", {
  schemaVersion: "diagnostic-retry-allocation-set-v4", envelopeRoot: envelope.root, maxAttempts: 5,
  allocations: Array.from({ length: 5 }, (_, index) => createDiagnosticRetryV4Allocation({
    attemptOrdinal: index + 1, envelopeRoot: envelope.root, sourceClosureRoot: envelope.sourceClosureRoot,
    implementationRoot: envelope.implementationRoot, gateRoot: envelope.reviewHash, oldEvidenceBaseline: envelope.historical.oldEvidenceBaseline,
  })), ...noAuthority,
})
export const admitDiagnosticRetryV4Envelope = (envelopeValue: unknown, allocationValue: unknown) => {
  const value = requireRooted("diagnostic-retry-authority-envelope-v4", envelopeValue)
  const expected = createDiagnosticRetryV4Envelope(value as unknown as Parameters<typeof createDiagnosticRetryV4Envelope>[0])
  if (!same(expected, value)) return fail("ENVELOPE_MISMATCH")
  const allocations = createDiagnosticRetryV4AllocationSet(expected)
  if (!same(allocations, allocationValue)) return fail("ALLOCATION_SET")
  return Object.freeze({ envelope: expected, allocations })
}
export const checkDiagnosticRetryV4Envelope = (envelopePath: string, allocationPath: string) => {
  const admitted = admitDiagnosticRetryV4Envelope(read(envelopePath), read(allocationPath)), e = admitted.envelope
  const source = checkDiagnosticRetryV4SourceClosure(e.closurePath, e.reviewPath)
  if (source.closure.root !== e.closureRoot || source.closure.sourceClosureRoot !== e.sourceClosureRoot || source.reviewHash !== e.reviewHash || source.implementationRoot !== e.implementationRoot || !same(historicalRetryV4Snapshot(), e.historical)) return fail("ENVELOPE_SOURCE_HISTORY")
  return admitted
}
const directory = (path: string): void => {
  if (!existsSync(path)) { mkdirSync(path, { mode: 0o700 }); syncDirectory(dirname(path)) }
  const s = lstatSync(path)
  if (!s.isDirectory() || realpathSync(path) !== resolve(path) || (s.mode & 0o777) !== 0o700) return fail("DIRECTORY")
}
const controlDirectory = (a: DiagnosticRetryV4Allocation) => join(a.store, "control")
const controlPath = (a: DiagnosticRetryV4Allocation, kind: string) => join(controlDirectory(a), `${kind}.json`)
const readControl = (a: DiagnosticRetryV4Allocation, kind: string): unknown | null => {
  const path = controlPath(a, kind)
  if (!existsSync(path)) return null
  const stat = lstatSync(path)
  if (!stat.isFile() || stat.nlink !== 1 || (stat.mode & 0o777) !== 0o600 || realpathSync(path) !== resolve(path)) return fail("CONTROL_FILE")
  return read(path)
}
const writeControl = (a: DiagnosticRetryV4Allocation, kind: string, value: unknown) => durableRetryV4Create(controlPath(a, kind), value)
export const createDiagnosticRetryV4PreflightAttempt = (a: DiagnosticRetryV4Allocation) => rooted("diagnostic-retry-preflight-attempt-v4", { schemaVersion: "diagnostic-retry-preflight-attempt-v4", allocationRoot: a.root, envelopeRoot: a.envelopeRoot, attemptOrdinal: a.attemptOrdinal, exclusive: true })
export interface RetryV4Observation { fileSystemBytes: string; fileSystemInodes: string; memoryBasisPoints: number; memoryAvailableBytes: number; dockerCpus: number; dockerMemoryBytes: number; imageDigest: LabRoot; architecture: "amd64"; ownedNameCollisions: 0; readerMilliseconds: number }
export const createDiagnosticRetryV4PreflightDisposition = (a: DiagnosticRetryV4Allocation, observation: RetryV4Observation | null) => rooted("diagnostic-retry-preflight-disposition-v4", {
  schemaVersion: "diagnostic-retry-preflight-disposition-v4", allocationRoot: a.root,
  attemptRoot: createDiagnosticRetryV4PreflightAttempt(a).root, status: observation === null ? "prestart_denied" : "admitted",
  observation, terminal: true,
})
const admitObservation = (o: unknown): RetryV4Observation => {
  if (!exact(o, ["fileSystemBytes", "fileSystemInodes", "memoryBasisPoints", "memoryAvailableBytes", "dockerCpus", "dockerMemoryBytes", "imageDigest", "architecture", "ownedNameCollisions", "readerMilliseconds"]) || typeof o.fileSystemBytes !== "string" || !/^[0-9]+$/u.test(o.fileSystemBytes) || BigInt(o.fileSystemBytes) < BigInt(DIAGNOSTIC_RETRY_V4_CAPACITY.maxBytes + DIAGNOSTIC_RETRY_V4_CAPACITY.terminalReserveBytes) || typeof o.fileSystemInodes !== "string" || !/^[0-9]+$/u.test(o.fileSystemInodes) || BigInt(o.fileSystemInodes) < BigInt(DIAGNOSTIC_RETRY_V4_CAPACITY.maxInodes + DIAGNOSTIC_RETRY_V4_CAPACITY.terminalReserveInodes) || !Number.isSafeInteger(o.memoryBasisPoints) || Number(o.memoryBasisPoints) < 2500 || Number(o.memoryBasisPoints) > 10000 || !Number.isSafeInteger(o.memoryAvailableBytes) || Number(o.memoryAvailableBytes) < 1_073_741_824 || !Number.isSafeInteger(o.dockerCpus) || Number(o.dockerCpus) < 2 || !Number.isSafeInteger(o.dockerMemoryBytes) || Number(o.dockerMemoryBytes) < 268_435_456 || !isRoot(o.imageDigest) || o.architecture !== "amd64" || o.ownedNameCollisions !== 0 || !Number.isSafeInteger(o.readerMilliseconds) || Number(o.readerMilliseconds) < 0 || Number(o.readerMilliseconds) > 60_000) return fail("PREFLIGHT_OBSERVATION")
  return o as unknown as RetryV4Observation
}
export const requireDiagnosticRetryV4Preflight = (a: DiagnosticRetryV4Allocation, attempt: unknown, disposition: unknown) => {
  if (!same(attempt, createDiagnosticRetryV4PreflightAttempt(a))) return fail("PREFLIGHT_ATTEMPT")
  const raw = requireRooted("diagnostic-retry-preflight-disposition-v4", disposition)
  const expected = createDiagnosticRetryV4PreflightDisposition(a, raw.status === "admitted" ? admitObservation(raw.observation) : null)
  if (!same(raw, expected)) return fail("PREFLIGHT_DISPOSITION")
  return expected
}
interface DockerResult { status: number | null; signal: string | null; stdout: string; stderr: string; error: boolean }
export const retryV4Docker = (args: readonly string[], timeoutMilliseconds = 2000): Promise<DockerResult> => new Promise((done) => {
  const child = spawn("docker", [...args], { stdio: ["ignore", "pipe", "pipe"], shell: false, env: { PATH: process.env.PATH ?? "" } })
  let stdout = "", stderr = "", error = false, settled = false
  const timer = setTimeout(() => { error = true; child.kill("SIGKILL") }, timeoutMilliseconds)
  const append = (which: "stdout" | "stderr", bytes: Buffer) => { if (which === "stdout") stdout += bytes.toString("utf8"); else stderr += bytes.toString("utf8"); if (stdout.length + stderr.length > 4096) { error = true; child.kill("SIGKILL") } }
  child.stdout.on("data", (b: Buffer) => append("stdout", b)); child.stderr.on("data", (b: Buffer) => append("stderr", b))
  child.on("error", () => { error = true })
  child.on("close", (status, signal) => { if (settled) return; settled = true; clearTimeout(timer); done({ status, signal, stdout, stderr, error }) })
})
const absent = (r: DockerResult, name: string): boolean => !r.error && r.signal === null && r.status === 1 && ["", "\n"].includes(r.stdout) && [`Error: No such object: ${name}\n`, `error: no such object: ${name}\n`].includes(r.stderr)
const boundedCleanup = async (cleanup: () => Promise<boolean>, milliseconds = 30_000): Promise<boolean> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  try { return await Promise.race([cleanup().catch(() => false), new Promise<boolean>((finish) => { timer = setTimeout(() => finish(false), milliseconds) })]) } finally { if (timer !== undefined) clearTimeout(timer) }
}
export const cleanupDiagnosticRetryV4ExactOwners = async (a: DiagnosticRetryV4Allocation, docker = retryV4Docker): Promise<boolean> => {
  const began = performance.now(), cell = createDiagnosticRetryV4Cell(a, 0)
  for (const seat of ["bottom", "top"] as const) {
    const owner = diagnosticRetryV4ContainerIdentity(a, cell, seat)
    if (performance.now() - began >= 22_000) return false
    const inspected = await docker(["inspect", "--format", '{{index .Config.Labels "v1.38-lean-owner"}}', owner.containerName])
    if (absent(inspected, owner.containerName)) continue
    if (inspected.error || inspected.signal !== null || inspected.status !== 0 || inspected.stderr !== "" || inspected.stdout !== `${owner.ownershipLabel}\n`) return false
    const removed = await docker(["rm", "-f", owner.containerName])
    if (removed.error || removed.signal !== null || removed.status !== 0 || removed.stderr !== "" || !absent(await docker(["inspect", "--format", '{{index .Config.Labels "v1.38-lean-owner"}}', owner.containerName]), owner.containerName)) return false
  }
  return performance.now() - began < 30_000
}
export const observeDiagnosticRetryV4Host = async (a: DiagnosticRetryV4Allocation): Promise<RetryV4Observation> => {
  const began = performance.now(), repository = createFactoryRepository(DIAGNOSTIC_PILOT_PHASE264_STORE)
  readDiagnosticPilotAssessedPair(repository)
  const readerMilliseconds = Math.ceil(performance.now() - began), filesystem = statfsSync(resolve(".strategy-lab"), { bigint: true })
  const request = MEMORY_PRESSURE_Q_REQUEST
  const result = spawnSync(request.executable, [...request.args], { env: request.env, stdio: ["ignore", "pipe", "pipe"], timeout: request.timeoutMilliseconds, maxBuffer: request.maximumOutputBytes, shell: false })
  const parsed = parseMemoryPressureQ({ stdout: result.stdout ?? Buffer.alloc(0), stderr: result.stderr ?? Buffer.alloc(0), exitCode: result.status, signal: result.signal, timedOut: !!result.error })
  if (!parsed.ok) return fail("MEMORY")
  const info = await retryV4Docker(["info", "--format", "{{.NCPU}}|{{.MemTotal}}"], 5000)
  const image = await retryV4Docker(["image", "inspect", "--format", "{{.Id}}|{{.Architecture}}", a.image], 5000)
  if (info.error || info.status !== 0 || info.signal !== null || info.stderr !== "" || !/^[0-9]+\|[0-9]+\n?$/u.test(info.stdout) || image.error || image.status !== 0 || image.signal !== null || image.stderr !== "" || !/^sha256:[a-f0-9]{64}\|amd64\n?$/u.test(image.stdout)) return fail("DOCKER")
  const cell = createDiagnosticRetryV4Cell(a, 0)
  for (const seat of ["bottom", "top"] as const) { const owner = diagnosticRetryV4ContainerIdentity(a, cell, seat); if (!absent(await retryV4Docker(["inspect", "--format", '{{index .Config.Labels "v1.38-lean-owner"}}', owner.containerName]), owner.containerName)) return fail("OWNED_COLLISION") }
  const [dockerCpus, dockerMemoryBytes] = info.stdout.trim().split("|").map(Number)
  return admitObservation({ fileSystemBytes: String(filesystem.bavail * filesystem.bsize), fileSystemInodes: String(filesystem.ffree), memoryBasisPoints: parsed.observation.observedBasisPoints, memoryAvailableBytes: Math.floor(parsed.observation.totalBytes * parsed.observation.percentage / 100), dockerCpus, dockerMemoryBytes, imageDigest: image.stdout.trim().split("|")[0], architecture: "amd64", ownedNameCollisions: 0, readerMilliseconds })
}
const requireLivePreflight = (a: DiagnosticRetryV4Allocation): void => { const d = requireDiagnosticRetryV4Preflight(a, readControl(a, "preflight-attempt"), readControl(a, "preflight")); if (d.status !== "admitted") return fail("PREFLIGHT_DENIED") }
/** Observe in a killable child: candidate reopening and synchronous host IO
 * cannot delay the parent's run-entry deadline. The exclusive reservation is
 * already durable before this child may observe anything. */
const superviseRetryV4Preflight = async (envelopePath: string, allocationPath: string, a: DiagnosticRetryV4Allocation, commandStartedAt: number): Promise<RetryV4Observation | null> => {
  const token = randomUUID(), child = spawn(resolve("node_modules/.bin/tsx"), [fileURLToPath(import.meta.url), "--internal-preflight-v4", envelopePath, allocationPath, String(a.attemptOrdinal), token], { stdio: ["ignore", "pipe", "pipe", "ipc"], env: { PATH: process.env.PATH ?? "", TMPDIR: process.env.TMPDIR ?? "" }, shell: false, detached: true })
  let value: RetryV4Observation | null = null, observed = false, ready = false, failed = false, size = 0
  const kill = () => { failed = true; try { process.kill(-child.pid!, "SIGKILL") } catch { try { child.kill("SIGKILL") } catch { /* denied */ } } }
  return new Promise((complete) => {
    const timer = setTimeout(kill, Math.max(1, 300_000 - (performance.now() - commandStartedAt)))
    const drain = (bytes: Buffer) => { size += bytes.length; if (size > 4096) kill() }
    child.stdout?.on("data", drain); child.stderr?.on("data", drain)
    child.on("error", () => { failed = true })
    child.on("message", (m: unknown) => {
      if (exact(m, ["kind", "token"]) && m.kind === "ready" && m.token === token && !ready) { ready = true; child.send({ kind: "go", token }); return }
      if (exact(m, ["kind", "allocationRoot", "observation"]) && m.kind === "preflight" && m.allocationRoot === a.root && ready && !observed) {
        observed = true
        try { value = m.observation === null ? null : admitObservation(m.observation) } catch { kill() }
        return
      }
      kill()
    })
    child.on("exit", (code) => { clearTimeout(timer); complete(!failed && observed && code === 0 ? value : null) })
  })
}
export const executeDiagnosticRetryV4Worker = async (a: DiagnosticRetryV4Allocation): Promise<void> => {
  requireLivePreflight(a)
  const cell = createDiagnosticRetryV4Cell(a, 0), start = createDiagnosticRetryV4Start(a, cell), ledger = openDiagnosticRetryV4Ledger(a.store)
  const began = performance.now(), handles: DiagnosticRetryV4IssuedProvider[] = []
  let stage = -1, publishing = false
  const checkpoint = (i: number) => { ledger.writeStage(createDiagnosticRetryV4Stage(start, i, DIAGNOSTIC_RETRY_V4_STAGES[i]!)); stage = i }
  const elapsed = () => Math.min(240_000, Math.max(0, Math.ceil(performance.now() - began)))
  // Start and charge precede any provider construction. Stage names still show
  // the last actually entered issuance/kernel/evidence boundary.
  ledger.writeStart(start)
  process.send?.({ kind: "started", startRoot: start.root })
  checkpoint(0); checkpoint(1); checkpoint(2)
  const runPermit = ledger.writeRunAttempt(start)
  let execution: Awaited<ReturnType<typeof runAuthorizedDiagnosticRetryV4>> | null = null
  let cause: ReturnType<typeof safeDiagnosticRetryV4Cause> = "unknown_internal"
  try {
    const repository = createFactoryRepository(DIAGNOSTIC_PILOT_PHASE264_STORE), pair = readDiagnosticPilotAssessedPair(repository)
    const host: DiagnosticRetryV4RuntimeHost = { createFactorySupervisedRuntime: ({ admission, sourceBytes, attemptRoot, budgetRoot, retryV4LifetimeGrant }) => createFactorySupervisedRuntime({
      admission, sourceBytes, attemptRoot, budgetRoot, retryV4LifetimeGrant, factoryLifetimeMs: 240_000,
      matchId: `retry-v4-${cell.requestRoot.slice(7)}`, containerName: retryV4LifetimeGrant.containerName, ownershipLabel: retryV4LifetimeGrant.ownershipLabel,
    }) }
    for (const seat of ["bottom", "top"] as const) {
      const assessed = pair.find((v) => v.candidate.root === (seat === "bottom" ? cell.bottomCandidateRoot : cell.topCandidateRoot))
      if (!assessed) return fail("WORKER_CANDIDATE")
      const retryV4LifetimeGrant = issueDiagnosticRetryV4LifetimeGrant(ledger, a, cell, start, seat)
      handles.push(issueDiagnosticRetryV4ProviderFromFactoryCandidate({ host, factoryRepository: repository, ledger, allocation: a, cell, start, requestRoot: cell.requestRoot, assessed, retryV4LifetimeGrant }))
    }
    const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((v) => v.id === "arena:smoke:v1")!
    execution = await runAuthorizedDiagnosticRetryV4({ ledger, allocation: a, cell, start, runPermit, requestRoot: cell.requestRoot,
      bottom: handles[0]!, top: handles[1]!, match: { matchId: `retry-v4-${cell.requestRoot.slice(7)}`, seed: a.seed, arenaVariant: smoke,
        bottomPlayerId: `league-${cell.bottomCandidateRoot.slice(7)}`, topPlayerId: `league-${cell.topCandidateRoot.slice(7)}`,
        initialInitiativePlayerId: `league-${cell.initialInitiativeCandidateRoot.slice(7)}`, bottomStrategyRevisionId: handles[0]!.identity.revisionId, topStrategyRevisionId: handles[1]!.identity.revisionId },
      onKernelEntry: () => checkpoint(3), onEvidenceStart: () => checkpoint(4),
    })
  } catch (error) { cause = safeDiagnosticRetryV4Cause(error) }
  let closed = true
  for (const handle of handles) try { closed = closeDiagnosticRetryV4IssuedProvider(handle) && closed } catch { closed = false }
  const cleaned = await boundedCleanup(() => cleanupDiagnosticRetryV4ExactOwners(a))
  if (ledger.hasUncertainPublication()) return fail("PUBLICATION_UNCERTAIN")
  const priorStage = stage < 0 ? "unknown" : DIAGNOSTIC_RETRY_V4_STAGES[Math.min(stage, 4)]!
  checkpoint(5)
  const evidence = execution ?? retainDiagnosticRetryV4PartialEvidence(ledger, start)
  const valid = execution?.disposition === "success" && execution.cleanupComplete && closed && cleaned && elapsed() < 240_000
  const terminal = createDiagnosticRetryV4Terminal(start, { disposition: valid ? "success" : cleaned && closed ? execution?.disposition === "player_violation" ? "player_violation" : "system_failure" : "uncertain", processValidity: valid ? "process_valid" : "process_invalid", evidenceRoot: evidence.evidenceRoot, cleanupComplete: cleaned && closed && (execution?.cleanupComplete ?? true), elapsedMilliseconds: elapsed(), artifactBytes: evidence.artifactBytes, artifactRecords: evidence.artifactRecords, code: !cleaned || !closed ? "cleanup_incomplete" : valid ? "completed" : elapsed() >= 240_000 ? "cell_deadline" : execution?.disposition === "player_violation" ? "player_violation" : "system_failure", lastEnteredStage: "terminal_publication", failureStage: valid ? "unknown" : priorStage, cause })
  publishing = true
  ledger.writeTerminal(terminal)
  if (publishing && ledger.hasUncertainPublication()) return fail("PUBLICATION_UNCERTAIN")
  process.send?.({ kind: "done", startRoot: start.root, terminalRoot: terminal.root, status: terminal.processValidity })
}
interface RetryV4WatchdogHost { now(): number; spawn(): ChildProcess; cleanup(): Promise<boolean>; token?: string }
export const superviseDiagnosticRetryV4Attempt = async (a: DiagnosticRetryV4Allocation, commandStartedAt: number, host: RetryV4WatchdogHost): Promise<{ status: "process_valid" | "process_invalid"; cleanupComplete: boolean; timedOut: boolean; exitCode: number | null; terminalRoot: LabRoot | null; elapsedMilliseconds: number }> => {
  const child = host.spawn(), start = createDiagnosticRetryV4Start(a, createDiagnosticRetryV4Cell(a, 0))
  if (!child.pid || child.pid < 2) return fail("CHILD_PID")
  let started: number | null = null, terminalRoot: LabRoot | null = null, status: "process_valid" | "process_invalid" = "process_invalid", timedOut = false, exitCode: number | null = null, done = false, ready = false, outputBytes = 0
  const kill = () => { try { process.kill(-child.pid!, "SIGKILL") } catch { try { child.kill("SIGKILL") } catch { /* retained uncertainty */ } } }
  await new Promise<void>((complete) => {
    const timer = setInterval(() => { const now = host.now(); if (now - commandStartedAt >= 570_000 || started !== null && now - started >= 240_000) { timedOut = true; kill() } }, 25)
    const finish = () => { clearInterval(timer); complete() }
    child.stdout?.on("data", (b: Buffer) => { outputBytes += b.length; if (outputBytes > 4096) { timedOut = true; kill() } })
    child.stderr?.on("data", (b: Buffer) => { outputBytes += b.length; if (outputBytes > 4096) { timedOut = true; kill() } })
    child.on("error", () => { timedOut = true; kill(); finish() })
    child.on("exit", (code) => { exitCode = code; finish() })
    child.on("message", (m: unknown) => {
      if (host.token !== undefined && exact(m, ["kind", "token"]) && m.kind === "ready" && m.token === host.token && !ready) { ready = true; return }
      if (exact(m, ["kind", "startRoot"]) && m.kind === "started" && m.startRoot === start.root && started === null) { started = host.now(); return }
      if (exact(m, ["kind", "startRoot", "terminalRoot", "status"]) && m.kind === "done" && m.startRoot === start.root && started !== null && !done && isRoot(m.terminalRoot) && ["process_valid", "process_invalid"].includes(String(m.status))) { done = true; terminalRoot = m.terminalRoot; status = m.status as typeof status; return }
      timedOut = true; kill()
    })
  })
  const cleanupComplete = await boundedCleanup(host.cleanup, Math.max(1, Math.min(30_000, commandStartedAt + 600_000 - host.now())))
  const elapsedMilliseconds = Math.ceil(host.now() - commandStartedAt)
  return { status: timedOut || exitCode !== 0 || !done || !cleanupComplete || elapsedMilliseconds > 600_000 ? "process_invalid" : status, cleanupComplete, timedOut, exitCode, terminalRoot, elapsedMilliseconds }
}
export type RetryV4Stop = "process_valid" | "preflight_denied" | "cleanup_unresolved" | "publication_uncertain" | "integrity_failure" | "cap"
export const decideDiagnosticRetryV4Next = (ordinal: number, result: { processValidity: string; cleanupComplete: boolean; publicationCertain: boolean; integrityValid: boolean; preflightAdmitted: boolean }): RetryV4Stop | "continue" => {
  if (!Number.isSafeInteger(ordinal) || ordinal < 1 || ordinal > 5 || !result.integrityValid) return "integrity_failure"
  if (!result.preflightAdmitted) return "preflight_denied"
  if (!result.publicationCertain) return "publication_uncertain"
  if (!result.cleanupComplete) return "cleanup_unresolved"
  if (result.processValidity === "process_valid") return "process_valid"
  if (result.processValidity !== "process_invalid") return "integrity_failure"
  return ordinal === 5 ? "cap" : "continue"
}
const controlNames = ["preflight-attempt", "preflight", "dispatch", "parent", "result", "publication", "verification"] as const
export const reopenDiagnosticRetryV4Attempt = (a: DiagnosticRetryV4Allocation) => {
  admitDiagnosticRetryV4Allocation(a)
  const attempt = readControl(a, "preflight-attempt"), preflight = readControl(a, "preflight")
  const disposition = requireDiagnosticRetryV4Preflight(a, attempt, preflight)
  const names = readdirSync(controlDirectory(a)).sort()
  if (names.some((n) => !controlNames.some((k) => n === `${k}.json`))) return fail("CONTROL_ORPHAN")
  if (disposition.status === "prestart_denied") {
    if (!same(names, ["preflight-attempt.json", "preflight.json"])) return fail("DENIED_CHARGE")
    if (readdirSync(a.store).some((name) => name !== "control")) return fail("DENIED_CHARGE")
    return Object.freeze({ ordinal: a.attemptOrdinal, status: "preflight_denied" as const, chargedCount: 0 })
  }
  if (names.length !== controlNames.length) return fail("PUBLICATION_INCOMPLETE")
  const cell = createDiagnosticRetryV4Cell(a, 0), start = createDiagnosticRetryV4Start(a, cell)
  const dispatch = rooted("diagnostic-retry-dispatch-v4", { allocationRoot: a.root, preflightRoot: disposition.root, startRoot: start.root, charged: true })
  if (!same(dispatch, readControl(a, "dispatch"))) return fail("DISPATCH")
  const parent = requireRooted("diagnostic-retry-parent-v4", readControl(a, "parent"))
  if (parent.allocationRoot !== a.root || typeof parent.cleanupComplete !== "boolean" || parent.cleanupComplete !== true || !Number.isSafeInteger(parent.elapsedMilliseconds) || Number(parent.elapsedMilliseconds) > 600_000 || parent.exitCode !== 0 || parent.timedOut !== false || !isRoot(parent.terminalRoot)) return fail("PARENT")
  const ledger = openDiagnosticRetryV4Ledger(a.store), expected = createDiagnosticRetryV4Result(a, ledger, Number(parent.elapsedMilliseconds), parent.status as "process_valid" | "process_invalid", parent.cleanupComplete)
  if (!same(expected, readControl(a, "result")) || ledger.hasUncertainPublication() || expected.terminalRoot !== parent.terminalRoot) return fail("RESULT")
  const publication = rooted("diagnostic-retry-publication-v4", { allocationRoot: a.root, preflightRoot: disposition.root, dispatchRoot: dispatch.root, parentRoot: parent.root, resultRoot: expected.root, durable: true })
  if (!same(publication, readControl(a, "publication"))) return fail("PUBLICATION")
  const verification = rooted("diagnostic-retry-verification-v4", { allocationRoot: a.root, publicationRoot: publication.root, resultRoot: expected.root, reopened: true })
  if (!same(verification, readControl(a, "verification"))) return fail("VERIFICATION")
  const terminal = ledger.readTerminal(start.root) as { cleanupComplete?: unknown } | null
  return Object.freeze({ ordinal: a.attemptOrdinal, status: expected.processValidity, chargedCount: expected.chargedCount, resultRoot: expected.root, cleanupComplete: terminal?.cleanupComplete === true && parent.cleanupComplete === true })
}
export const checkDiagnosticRetryV4Retained = (envelopePath: string, allocationPath: string, repository = RETRY_V4_REPOSITORY, checkEnvelope = checkDiagnosticRetryV4Envelope) => {
  if (resolve(repository) !== resolve(RETRY_V4_REPOSITORY)) return fail("REPOSITORY")
  const admitted = checkEnvelope(envelopePath, allocationPath)
  if (!same(readdirSync(repository).sort(), ["run-latch.json", "sequence.json"])) return fail("SEQUENCE_ORPHAN")
  const latch = rooted("diagnostic-retry-sequence-latch-v4", { envelopeRoot: admitted.envelope.root, allocationRoot: admitted.allocations.root, consumed: true })
  if (!same(read(join(repository, "run-latch.json")), latch)) return fail("SEQUENCE_LATCH")
  const entries: (ReturnType<typeof reopenDiagnosticRetryV4Attempt> | Readonly<{ ordinal: number; status: "uncertain"; chargedCount: number | "unknown"; cleanupComplete: boolean; parentRoot: LabRoot | null }>)[] = []
  let stop: RetryV4Stop | null = null
  for (const a of admitted.allocations.allocations) {
    if (!existsSync(a.store)) continue
    if (stop !== null || a.attemptOrdinal !== entries.length + 1) return fail("SERIAL_ORPHAN")
    const entry = reopenDiagnosticRetryV4Attempt(a); entries.push(entry)
    const choice = decideDiagnosticRetryV4Next(a.attemptOrdinal, { processValidity: entry.status, cleanupComplete: "cleanupComplete" in entry && entry.cleanupComplete, publicationCertain: true, integrityValid: true, preflightAdmitted: entry.status !== "preflight_denied" })
    if (choice !== "continue") stop = choice
  }
  const sequence = read(join(repository, "sequence.json"))
  const expected = rooted("diagnostic-retry-sequence-v4", { envelopeRoot: admitted.envelope.root, allocationRoot: admitted.allocations.root, stopReason: stop ?? "integrity_failure", entries, unusedOrdinals: Array.from({ length: 5 - entries.length }, (_, i) => entries.length + i + 1), ...noAuthority })
  if (!same(sequence, expected)) return fail("SEQUENCE")
  return expected
}
/** Single shared policy; injected tests can use in-memory hooks, with no host IO. */
export const runDiagnosticRetryV4Sequence = async (hooks: {
  recheck(ordinal: number): void; preflight(ordinal: number): Promise<boolean>;
  execute(ordinal: number): Promise<{ processValidity: "process_valid" | "process_invalid"; cleanupComplete: boolean; publicationCertain: boolean; integrityValid: boolean }>;
}) => {
  const attempts: number[] = []
  for (let ordinal = 1; ordinal <= 5; ordinal++) {
    try { hooks.recheck(ordinal) } catch { return { attempts, stopReason: "integrity_failure" as const } }
    if (!await hooks.preflight(ordinal)) return { attempts, stopReason: "preflight_denied" as const }
    attempts.push(ordinal)
    const result = await hooks.execute(ordinal)
    const next = decideDiagnosticRetryV4Next(ordinal, { ...result, preflightAdmitted: true })
    if (next !== "continue") return { attempts, stopReason: next }
  }
  return { attempts, stopReason: "cap" as const }
}
export interface RetryV4SequenceHost {
  checkEnvelope?: typeof checkDiagnosticRetryV4Envelope
  observe?: (allocation: DiagnosticRetryV4Allocation, commandStartedAt: number) => Promise<RetryV4Observation | null>
  supervise?: (allocation: DiagnosticRetryV4Allocation, commandStartedAt: number) => ReturnType<typeof superviseDiagnosticRetryV4Attempt>
}
export const runDiagnosticRetryV4Live = async (envelopePath: string, allocationPath: string, repository: string, host: RetryV4SequenceHost = {}): Promise<void> => {
  if (resolve(repository) !== resolve(RETRY_V4_REPOSITORY)) return fail("REPOSITORY")
  const checkEnvelope = host.checkEnvelope ?? checkDiagnosticRetryV4Envelope
  const admitted = checkEnvelope(envelopePath, allocationPath)
  directory(".strategy-lab"); directory(repository)
  durableRetryV4Create(join(repository, "run-latch.json"), rooted("diagnostic-retry-sequence-latch-v4", { envelopeRoot: admitted.envelope.root, allocationRoot: admitted.allocations.root, consumed: true }))
  const entries: (ReturnType<typeof reopenDiagnosticRetryV4Attempt> | Readonly<{ ordinal: number; status: "uncertain"; chargedCount: number | "unknown"; cleanupComplete: boolean; parentRoot: LabRoot | null }>)[] = []
  let stopReason: RetryV4Stop = "cap"
  for (const a of admitted.allocations.allocations) {
    const commandStartedAt = performance.now()
    checkEnvelope(envelopePath, allocationPath)
    directory(a.store); directory(controlDirectory(a))
    writeControl(a, "preflight-attempt", createDiagnosticRetryV4PreflightAttempt(a))
    let observation: RetryV4Observation | null = null
    try { observation = await (host.observe ? host.observe(a, commandStartedAt) : superviseRetryV4Preflight(envelopePath, allocationPath, a, commandStartedAt)) } catch { observation = null }
    const preflight = createDiagnosticRetryV4PreflightDisposition(a, observation)
    writeControl(a, "preflight", preflight)
    if (!observation) { entries.push(reopenDiagnosticRetryV4Attempt(a)); stopReason = "preflight_denied"; break }
    checkEnvelope(envelopePath, allocationPath)
    if (performance.now() - commandStartedAt > 300_000) { stopReason = "integrity_failure"; break }
    const start = createDiagnosticRetryV4Start(a, createDiagnosticRetryV4Cell(a, 0))
    const dispatch = rooted("diagnostic-retry-dispatch-v4", { allocationRoot: a.root, preflightRoot: preflight.root, startRoot: start.root, charged: true })
    writeControl(a, "dispatch", dispatch)
    const token = randomUUID()
    const observed = host.supervise ? await host.supervise(a, commandStartedAt) : await superviseDiagnosticRetryV4Attempt(a, commandStartedAt, {
      now: () => performance.now(), cleanup: () => cleanupDiagnosticRetryV4ExactOwners(a), token,
      spawn: () => {
        const child = spawn(resolve("node_modules/.bin/tsx"), [fileURLToPath(import.meta.url), "--internal-worker-v4", envelopePath, allocationPath, String(a.attemptOrdinal), token], { stdio: ["ignore", "pipe", "pipe", "ipc"], env: { PATH: process.env.PATH ?? "", TMPDIR: process.env.TMPDIR ?? "" }, shell: false, detached: true })
        child.on("message", (m: unknown) => { if (exact(m, ["kind", "token"]) && m.kind === "ready" && m.token === token) child.send({ kind: "go", token }) })
        return child
      },
    })
    const parent = rooted("diagnostic-retry-parent-v4", { allocationRoot: a.root, ...observed })
    writeControl(a, "parent", parent)
    if (!observed.cleanupComplete || observed.timedOut || observed.exitCode !== 0 || observed.terminalRoot === null) {
      let chargedCount: number | "unknown" = "unknown"
      try { chargedCount = openDiagnosticRetryV4Ledger(a.store).readStart(start.root) === null ? 0 : 1 } catch { /* preserve unknown */ }
      entries.push(Object.freeze({ ordinal: a.attemptOrdinal, status: "uncertain", chargedCount, cleanupComplete: observed.cleanupComplete, parentRoot: parent.root }))
      stopReason = !observed.cleanupComplete ? "cleanup_unresolved" : "publication_uncertain"; break
    }
    try {
      const ledger = openDiagnosticRetryV4Ledger(a.store)
      const result = createDiagnosticRetryV4Result(a, ledger, observed.elapsedMilliseconds, observed.status, observed.cleanupComplete)
      writeControl(a, "result", result)
      const publication = rooted("diagnostic-retry-publication-v4", { allocationRoot: a.root, preflightRoot: preflight.root, dispatchRoot: dispatch.root, parentRoot: parent.root, resultRoot: result.root, durable: true })
      writeControl(a, "publication", publication)
      writeControl(a, "verification", rooted("diagnostic-retry-verification-v4", { allocationRoot: a.root, publicationRoot: publication.root, resultRoot: result.root, reopened: true }))
      const entry = reopenDiagnosticRetryV4Attempt(a); entries.push(entry)
      const next = decideDiagnosticRetryV4Next(a.attemptOrdinal, { processValidity: entry.status, cleanupComplete: "cleanupComplete" in entry && entry.cleanupComplete, publicationCertain: !ledger.hasUncertainPublication(), integrityValid: true, preflightAdmitted: true })
      if (next !== "continue") { stopReason = next; break }
    } catch {
      let chargedCount: number | "unknown" = "unknown"
      try { chargedCount = openDiagnosticRetryV4Ledger(a.store).readStart(start.root) === null ? 0 : 1 } catch { /* preserve unknown */ }
      entries.push(Object.freeze({ ordinal: a.attemptOrdinal, status: "uncertain", chargedCount, cleanupComplete: observed.cleanupComplete, parentRoot: parent.root }))
      stopReason = "integrity_failure"; break
    }
  }
  checkEnvelope(envelopePath, allocationPath)
  durableRetryV4Create(join(repository, "sequence.json"), rooted("diagnostic-retry-sequence-v4", { envelopeRoot: admitted.envelope.root, allocationRoot: admitted.allocations.root, stopReason, entries, unusedOrdinals: Array.from({ length: 5 - entries.length }, (_, i) => entries.length + i + 1), ...noAuthority }))
}
const flags = (args: readonly string[]): Record<string, string> => { if (args.length % 2 !== 0) return fail("FLAGS"); const map: Record<string, string> = {}; for (let i = 0; i < args.length; i += 2) { const k = args[i]!; if (!/^--[a-z-]+$/u.test(k) || !args[i + 1] || k in map) return fail("FLAGS"); map[k] = args[i + 1]! } return map }
const need = (f: Record<string, string>, name: string): string => f[`--${name}`] ?? fail("FLAG_REQUIRED")
export const main = async (args: readonly string[]): Promise<void> => {
  const selector = args[0]
  if (selector === "--internal-worker-v4" || selector === "--internal-preflight-v4") {
    if (args.length !== 5 || !process.send || !process.connected) return fail("WORKER_PARENT")
    const [, e, p, ordinal, token] = args
    const admitted = checkDiagnosticRetryV4Envelope(e!, p!), a = admitted.allocations.allocations[Number(ordinal) - 1]
    if (!a || String(a.attemptOrdinal) !== ordinal) return fail("WORKER_ORDINAL")
    await new Promise<void>((go, denied) => {
      const timer = setTimeout(() => denied(new TypeError("DIAGNOSTIC_RETRY_V4_CLI_PERMISSION")), 5000)
      process.once("message", (m: unknown) => { clearTimeout(timer); if (!exact(m, ["kind", "token"]) || m.kind !== "go" || m.token !== token) return denied(new TypeError("DIAGNOSTIC_RETRY_V4_CLI_PERMISSION")); go() })
      process.send!({ kind: "ready", token })
    })
    if (selector === "--internal-preflight-v4") {
      if (!same(readControl(a, "preflight-attempt"), createDiagnosticRetryV4PreflightAttempt(a)) || readControl(a, "preflight") !== null || readControl(a, "dispatch") !== null) return fail("PREFLIGHT_RESERVATION")
      let observation: RetryV4Observation | null = null
      try { observation = await observeDiagnosticRetryV4Host(a) } catch { observation = null }
      process.send!({ kind: "preflight", allocationRoot: a.root, observation }); process.disconnect(); return
    }
    requireLivePreflight(a)
    if (readControl(a, "dispatch") === null) return fail("WORKER_DISPATCH")
    await executeDiagnosticRetryV4Worker(a)
    process.disconnect(); return
  }
  const f = flags(args.slice(1))
  if (selector === "write-source-closure") { checkOneCellWorkspaceResolution(); durableRetryV4Create(need(f, "closure"), diagnosticRetryV4SourceClosure()); return }
  if (selector === "check-source-closure") { const r = checkDiagnosticRetryV4SourceClosure(need(f, "closure"), need(f, "review")); process.stdout.write(JSON.stringify({ status: "accepted", sourceClosureRoot: r.closure.sourceClosureRoot }) + "\n"); return }
  if (selector === "prepare-envelope") {
    const closurePath = need(f, "closure"), reviewPath = need(f, "review"), source = checkDiagnosticRetryV4SourceClosure(closurePath, reviewPath)
    const envelope = createDiagnosticRetryV4Envelope({ authorizationMessage: readBytes(need(f, "authorization-message"), 65_536).toString("utf8"), sourceClosureRoot: source.closure.sourceClosureRoot, closureRoot: source.closure.root, reviewHash: source.reviewHash, implementationRoot: source.implementationRoot, closurePath, reviewPath, historical: historicalRetryV4Snapshot() })
    durableRetryV4Create(need(f, "envelope"), envelope); durableRetryV4Create(need(f, "allocation"), createDiagnosticRetryV4AllocationSet(envelope)); return
  }
  if (selector === "check-envelope") { const r = checkDiagnosticRetryV4Envelope(need(f, "envelope"), need(f, "allocation")); process.stdout.write(JSON.stringify({ envelopeRoot: r.envelope.root, allocationRoot: r.allocations.root, maxAttempts: 5 }) + "\n"); return }
  if (selector === "check-retained") { process.stdout.write(JSON.stringify(checkDiagnosticRetryV4Retained(need(f, "envelope"), need(f, "allocation"), need(f, "repository"))) + "\n"); return }
  if (selector === "run") { await runDiagnosticRetryV4Live(need(f, "envelope"), need(f, "allocation"), need(f, "repository")); return }
  return fail("SELECTOR")
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch(() => { process.stderr.write("DIAGNOSTIC_RETRY_V4_CLI_FAILED\n"); process.exitCode = 1 })
