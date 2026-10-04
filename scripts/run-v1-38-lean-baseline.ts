/** Prospective current-only private baseline entry. Importing this module is inert. */
import { constants, closeSync, fsyncSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync, statfsSync } from "node:fs"
import { fork, execFileSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { exactLabKeys, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createLeanCurrentBaselineAllocation, createLeanLedger, openLeanLedger, readLeanLedger, readLeanTimeAccounting, readLeanChildEntry, publishLeanChildEntry, beginLeanInterval, chargeLeanSlot, retainLeanMatch, checkpointLeanResources, stopLeanLedger, verifyLeanEvidence, deriveLeanChildTerminal, publishLeanChildTerminal, cumulativeLeanPhysicalBytes, assertLeanPublicationCapacity, currentLeanElapsedMs, currentBaselineSlotKind, leanCanonicalBytes, leanBytesRoot, writeLeanAll, LEAN_BASELINE_REQUEST, LEAN_BASELINE_STORE, LEAN_BASELINE_WRITABLE_PATHS, LEAN_CAPS, LEAN_EXTERNAL_SCRATCH_RESERVE, type LeanExperimentLedger, type LeanChildEntryV2, type LeanSlot } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { observeLeagueAvailableMemoryBytes } from "./run-v1-38-serious-league.js"
import { factoryAssessmentImplementationManifest } from "./v1-38-factory-implementation.js"
import { assessLeanPrefixCapacity, createLeanParentObservationGuard, admitLeanChildRelease, assertLeanEntryBinding, readLeanSafeFile } from "./run-v1-38-lean-experiment.js"
import { executeLeanCurrentPipeline, leanColdProcedureRoot, compactLeanBaselineCell } from "./lib/v1-38-lean-baseline-pipeline.js"
import { publishLeanBaselineSource } from "./lib/v1-38-lean-baseline-source.js"
import { runLeanBaselineMatch } from "./lib/v1-38-lean-baseline-match.js"
import { isLeanChildFailureReceipt, publishChildTerminalAfterOptionalReceipt, resolveLeanChildCliTerminal, type LeanChildFailureReceipt } from "./lib/v1-38-lean-child-cli-terminal.js"

const fail = (code: string): never => { throw new TypeError(`LEAN_BASELINE_${code}`) }
const STORE = resolve(LEAN_BASELINE_STORE)
const ALLOCATION = LEAN_BASELINE_WRITABLE_PATHS[1]
const TEMP = resolve(LEAN_BASELINE_WRITABLE_PATHS[0])
const PLAN = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-PLAN.md"
const ROOT = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v)
export const LEAN_SUPERVISOR_REASON_FILE = "parent-supervisor-reasons.json" as const
export const LEAN_SUPERVISOR_REASON_MAX_BYTES = 4096
/** Codes describe the branch actually observed, never an inferred initiating cause. */
export const LEAN_SUPERVISOR_REASON_CODES = Object.freeze([
  "child_error", "malformed_ipc", "duplicate_failure_receipt", "resource_threshold",
  "resource_sampling_exception", "deadline_timeout", "final_identity_mismatch",
  "final_identity_exception", "failure_receipt_publication_uncertain",
] as const)
export type LeanSupervisorReasonCode = typeof LEAN_SUPERVISOR_REASON_CODES[number]
// ChildProcess exit signals are finite host values. Never retain arbitrary text.
const SUPERVISOR_EXIT_SIGNALS = ["SIGHUP", "SIGINT", "SIGQUIT", "SIGILL", "SIGTRAP", "SIGABRT", "SIGIOT", "SIGBUS", "SIGFPE", "SIGKILL", "SIGUSR1", "SIGSEGV", "SIGUSR2", "SIGPIPE", "SIGALRM", "SIGTERM", "SIGSTKFLT", "SIGCHLD", "SIGCONT", "SIGSTOP", "SIGTSTP", "SIGTTIN", "SIGTTOU", "SIGURG", "SIGXCPU", "SIGXFSZ", "SIGVTALRM", "SIGPROF", "SIGWINCH", "SIGIO", "SIGPOLL", "SIGPWR", "SIGSYS", "SIGUNUSED", "SIGBREAK", "SIGLOST", "SIGINFO"] as const
export interface LeanSupervisorReasonEnvelope {
  schemaVersion: "lean-parent-supervisor-reasons-v1"
  allocationRoot: LabRoot
  sourceRoot: LabRoot
  requestBytesRoot: LabRoot
  entryBytesRoot: LabRoot
  head: string
  parentPid: number
  childPid: number
  exitCode: number | null
  signal: NodeJS.Signals | null
  uncertain: boolean
  reasons: readonly LeanSupervisorReasonCode[]
  observations: {
    entry: "published"
    childReady: "observed"
    resourceSampling: "observed" | "exception"
    finalIdentity: "matched" | "mismatch" | "exception"
    failureReceipt: "absent" | "published" | "publication_failed"
    // This is only process exit, NOT provider/container cleanup acceptance.
    cleanup: "child_exit_observed"
    // Terminal publication and finally cleanup occur AFTER this snapshot.
    terminalization: "unobserved"
    initiatingCause: "unknown"
  }
  root: LabRoot
}
export const isLeanSupervisorReasonEnvelope = (value: unknown): value is LeanSupervisorReasonEnvelope => {
  if (!value || typeof value !== "object" || !exactLabKeys(value, ["schemaVersion", "allocationRoot", "sourceRoot", "requestBytesRoot", "entryBytesRoot", "head", "parentPid", "childPid", "exitCode", "signal", "uncertain", "reasons", "observations", "root"])) return false
  const v = value as unknown as LeanSupervisorReasonEnvelope, o = v.observations
  if (v.schemaVersion !== "lean-parent-supervisor-reasons-v1" || ![v.allocationRoot, v.sourceRoot, v.requestBytesRoot, v.entryBytesRoot, v.root].every(ROOT) || typeof v.head !== "string" || !/^[a-f0-9]{40}$/u.test(v.head) || !Number.isSafeInteger(v.parentPid) || v.parentPid <= 0 || !Number.isSafeInteger(v.childPid) || v.childPid <= 0 || v.parentPid === v.childPid || (v.exitCode !== null && (!Number.isSafeInteger(v.exitCode) || v.exitCode < 0 || v.exitCode > 255)) || (v.signal !== null && !SUPERVISOR_EXIT_SIGNALS.includes(v.signal as typeof SUPERVISOR_EXIT_SIGNALS[number])) || typeof v.uncertain !== "boolean" || !Array.isArray(v.reasons) || v.reasons.length > LEAN_SUPERVISOR_REASON_CODES.length) return false
  const indexes = v.reasons.map(reason => LEAN_SUPERVISOR_REASON_CODES.indexOf(reason))
  if (indexes.some((index, i) => index < 0 || (i > 0 && index <= indexes[i - 1]!)) || v.uncertain !== (v.reasons.length > 0)) return false
  if (!o || !exactLabKeys(o, ["entry", "childReady", "resourceSampling", "finalIdentity", "failureReceipt", "cleanup", "terminalization", "initiatingCause"]) || o.entry !== "published" || o.childReady !== "observed" || !["observed", "exception"].includes(o.resourceSampling) || !["matched", "mismatch", "exception"].includes(o.finalIdentity) || !["absent", "published", "publication_failed"].includes(o.failureReceipt) || o.cleanup !== "child_exit_observed" || o.terminalization !== "unobserved" || o.initiatingCause !== "unknown") return false
  if ((o.resourceSampling === "exception") !== v.reasons.includes("resource_sampling_exception") || (o.finalIdentity === "mismatch") !== v.reasons.includes("final_identity_mismatch") || (o.finalIdentity === "exception") !== v.reasons.includes("final_identity_exception") || (o.failureReceipt === "publication_failed") !== v.reasons.includes("failure_receipt_publication_uncertain")) return false
  const { root, ...body } = v
  return root === labRoot("lean-parent-supervisor-reasons-v1", body) && leanCanonicalBytes(v).length <= LEAN_SUPERVISOR_REASON_MAX_BYTES
}
/** Validate exact canonical retained bytes; callers still MUST authenticate custody joins. */
export const validateLeanSupervisorReasonBytes = (bytes: Uint8Array): LeanSupervisorReasonEnvelope => {
  if (!(bytes instanceof Uint8Array) || bytes.length > LEAN_SUPERVISOR_REASON_MAX_BYTES) return fail("SUPERVISOR_REASONS")
  let value: unknown
  try { value = JSON.parse(Buffer.from(bytes).toString("utf8")) } catch { return fail("SUPERVISOR_REASONS") }
  if (!isLeanSupervisorReasonEnvelope(value) || leanBytesRoot(bytes) !== leanBytesRoot(leanCanonicalBytes(value))) return fail("SUPERVISOR_REASONS")
  return value
}
const SOURCE_PATHS = [
  "scripts/run-v1-38-lean-baseline.ts", "scripts/run-v1-38-lean-baseline.sh",
  "scripts/lib/v1-38-lean-baseline-pipeline.ts", "scripts/lib/v1-38-lean-baseline-source.ts",
  "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-baseline-analysis.ts",
  "scripts/lib/v1-38-lean-baseline-metrics.ts",
  "scripts/lib/v1-38-lean-baseline-retained.ts", "scripts/lib/v1-38-lean-cold-corpus.ts",
  "scripts/lib/v1-38-lean-seal-metadata.ts",
  "scripts/lib/v1-38-lean-training-adapter.ts", "scripts/lib/v1-38-lean-experiment-authority.ts",
  "scripts/lib/v1-38-lean-baseline.ts", "packages/strategy-lab/src/league/lean-training.ts",
  "packages/strategy-lab/src/league/lean-experiment.ts", "scripts/run-v1-38-lean-experiment.ts",
  "scripts/lib/v1-38-lean-child-cli-terminal.ts", "scripts/lib/v1-38-factory-supervised-runtime.ts",
  "scripts/lib/v1-38-lean-container-match-session.ts", "scripts/lib/v1-38-league-prospective-lifetime.ts",
] as const

export const leanBaselineSourceManifest = () => {
  const byPath = new Map(factoryAssessmentImplementationManifest().entries.map(e => [e.path, e]))
  for (const path of SOURCE_PATHS) byPath.set(path, { path, root: leanBytesRoot(readFileSync(resolve(path))) })
  const entries = [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path))
  return { entries, root: labRoot("lean-current-baseline-reviewed-source-v1", entries) }
}
export const deriveLeanBaselineRequestRoots = (input: { seed: string; coldRoot: LabRoot; planRoot: LabRoot; sourceRoot: LabRoot }): readonly LabRoot[] => {
  if (!exactLabKeys(input, ["seed", "coldRoot", "planRoot", "sourceRoot"]) || !/^[a-z0-9-]{1,100}$/u.test(input.seed) || !ROOT(input.coldRoot) || !ROOT(input.planRoot) || !ROOT(input.sourceRoot)) return fail("REQUEST_ROOTS")
  const arenas = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter(arena => arena.status === "active").sort((a, b) => a.semanticGeometryHash.localeCompare(b.semanticGeometryHash))
  if (arenas.length !== 2) return fail("ARENA")
  return Object.freeze(Array.from({ length: 36 }, (_, ordinal) => {
    const slot = currentBaselineSlotKind(ordinal)
    return labRoot("lean-current-baseline-request-slot-v1", { ...input, ordinal, ...slot, arenaHash: arenas[slot.arenaIndex]!.semanticGeometryHash })
  }))
}
export const deriveLeanBaselineCandidateRoots = (coldRoot: LabRoot): readonly [LabRoot, LabRoot] => {
  if (!ROOT(coldRoot)) return fail("CANDIDATE_ROOTS")
  return [labRoot("lean-current-baseline-mechanism-v1", { coldRoot, mechanism: "tactical" }), labRoot("lean-current-baseline-mechanism-v1", { coldRoot, mechanism: "teacher" })]
}
export interface LeanBaselineRequest { schemaVersion: "lean-current-baseline-request-v1"; seed: string; reviewPath: string; reviewRoot: LabRoot; sourceRoot: LabRoot; planRoot: LabRoot; coldRoot: LabRoot; candidateRoots: readonly LabRoot[]; requestRoots: readonly LabRoot[] }
export const parseLeanBaselineCommand = (args: readonly string[]) => {
  if (args.length !== 3 || !["prepare-current", "run-current", "verify-retained"].includes(args[0]!) || args[1] !== "--request" || !args[2] || args[2].startsWith("--")) return fail("ARGUMENTS")
  return { mode: args[0] as "prepare-current" | "run-current" | "verify-retained", request: args[2]! }
}
export const assertLeanBaselineWritableScope = (scope: { cacheDisabled?: string; compileDisabled?: string; nodeOptions?: string; compileCache?: string; warningRedirect?: string; coverage?: string; tempDirectory?: string }, coreSoftLimit: string): void => {
  if (scope.cacheDisabled !== "1" || scope.compileDisabled !== "1" || scope.nodeOptions !== undefined || scope.compileCache !== undefined || scope.warningRedirect !== undefined || scope.coverage !== undefined || scope.tempDirectory !== TEMP || coreSoftLimit.trim() !== "0") return fail("WRITABLE_SCOPE")
}
const requireScope = () => assertLeanBaselineWritableScope({ cacheDisabled: process.env.TSX_DISABLE_CACHE, compileDisabled: process.env.NODE_DISABLE_COMPILE_CACHE, nodeOptions: process.env.NODE_OPTIONS, compileCache: process.env.NODE_COMPILE_CACHE, warningRedirect: process.env.NODE_REDIRECT_WARNINGS, coverage: process.env.NODE_V8_COVERAGE, tempDirectory: process.env.TMPDIR }, execFileSync("sh", ["-c", "ulimit -c"], { encoding: "utf8", timeout: 1000, maxBuffer: 128 }))
const head = () => execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", maxBuffer: 128 }).trim()
const safeBytes = (path: string, max = 262144) => readLeanSafeFile(path, max)
const exact = (a: unknown, b: unknown) => labRoot("lean-baseline-exact-join-v1", a) === labRoot("lean-baseline-exact-join-v1", b)
export const admitsLeanBaselineReviewAgents = (author: unknown, reviewer: unknown): boolean =>
  typeof author === "string" && (author === "/root" || author.startsWith("/root/")) && typeof reviewer === "string" && reviewer.startsWith("/root/") && reviewer !== author
export const authenticateLeanBaselineReview = (path: string, expected: LabRoot, source: LabRoot): void => {
  if (typeof path !== "string" || !resolve(path).startsWith(`${resolve(".planning/phases/265-serious-current-rules-league-and-development-red-team")}/`)) return fail("REVIEW")
  const bytes = safeBytes(path), value = Buffer.from(bytes).toString("utf8")
  if (leanBytesRoot(bytes) !== expected || !value.startsWith("---\n")) return fail("REVIEW")
  const front = value.split("\n---", 2)[0]!
  const field = (key: string) => front.match(new RegExp(`^${key}: ([^\\n]+)$`, "mu"))?.[1]?.replace(/^['"]|['"]$/gu, "")
  const commit = field("source_commit"), reviewer = field("reviewer_agent"), author = field("author_agent")
  if (field("status") !== "clean" || field("source_root") !== source || !commit || !/^[a-f0-9]{40}$/u.test(commit) || !admitsLeanBaselineReviewAgents(author, reviewer) || field("independently_reviewed") !== "true") return fail("REVIEW")
  const manifest = leanBaselineSourceManifest()
  if (manifest.root !== source) return fail("REVIEW_SOURCE")
  try { execFileSync("git", ["diff", "--exit-code", commit, "--", ...manifest.entries.map(e => e.path)], { maxBuffer: 1024, stdio: "pipe" }) } catch { return fail("REVIEW_SOURCE") }
}
export const readLeanBaselineRequest = (path: string): LeanBaselineRequest => {
  if (resolve(path) !== resolve(LEAN_BASELINE_REQUEST)) return fail("REQUEST_PATH")
  const requestStat = lstatSync(resolve(path))
  if (!requestStat.isFile() || requestStat.isSymbolicLink() || requestStat.nlink !== 1 || (requestStat.mode & 0o777) !== 0o600 || realpathSync(resolve(path)) !== resolve(path)) return fail("REQUEST_FILE")
  const bytes = safeBytes(path)
  const request = JSON.parse(Buffer.from(bytes).toString("utf8")) as LeanBaselineRequest
  if (leanBytesRoot(bytes) !== leanBytesRoot(leanCanonicalBytes(request))) return fail("REQUEST_CANONICAL")
  if (!exactLabKeys(request, ["schemaVersion", "seed", "reviewPath", "reviewRoot", "sourceRoot", "planRoot", "coldRoot", "candidateRoots", "requestRoots"]) || request.schemaVersion !== "lean-current-baseline-request-v1" || !ROOT(request.reviewRoot) || !ROOT(request.sourceRoot) || !ROOT(request.planRoot) || !ROOT(request.coldRoot) || !Array.isArray(request.candidateRoots) || !Array.isArray(request.requestRoots) || request.coldRoot !== leanColdProcedureRoot(request.seed) || request.planRoot !== leanBytesRoot(safeBytes(PLAN)) || request.sourceRoot !== leanBaselineSourceManifest().root || !exact(request.candidateRoots, deriveLeanBaselineCandidateRoots(request.coldRoot)) || !exact(request.requestRoots, deriveLeanBaselineRequestRoots({ seed: request.seed, coldRoot: request.coldRoot, planRoot: request.planRoot, sourceRoot: request.sourceRoot }))) return fail("REQUEST")
  authenticateLeanBaselineReview(request.reviewPath, request.reviewRoot, request.sourceRoot)
  return request
}
const exclusive = (path: string, value: unknown, ledger?: LeanExperimentLedger) => {
  const bytes = leanCanonicalBytes(value)
  if (ledger) assertLeanPublicationCapacity(ledger, bytes.length)
  const fd = openSync(path, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
  try { writeLeanAll(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) }
}
const committedAllocation = (ledger: LeanExperimentLedger): void => {
  const committed = execFileSync("git", ["show", `HEAD:${ALLOCATION}`], { maxBuffer: 262144 })
  if (leanBytesRoot(committed) !== leanBytesRoot(safeBytes(ALLOCATION)) || leanBytesRoot(committed) !== leanBytesRoot(leanCanonicalBytes(ledger.allocation))) return fail("UNCOMMITTED_ALLOCATION")
}
const allocationFor = (request: LeanBaselineRequest) => {
  const ledger = openLeanLedger(STORE), a = ledger.allocation
  if (a.schemaVersion !== "lean-current-baseline-allocation-v1" || a.sourceRoot !== request.sourceRoot || a.reviewRoot !== request.reviewRoot || a.seed !== request.seed || a.planRoot !== request.planRoot || a.coldRoot !== request.coldRoot || !exact(a.candidateRoots, [...request.candidateRoots].sort()) || !exact(a.requestRoots, request.requestRoots)) return fail("ALLOCATION")
  return { ledger, allocation: a }
}
export const prepareLeanCurrent = (requestPath: string) => {
  requireScope()
  const request = readLeanBaselineRequest(requestPath)
  const allocation = createLeanCurrentBaselineAllocation({ sourceRoot: request.sourceRoot, reviewRoot: request.reviewRoot, coldRoot: request.coldRoot, planRoot: request.planRoot, candidateRoots: request.candidateRoots, requestRoots: request.requestRoots, seed: request.seed })
  const ledger = createLeanLedger(STORE, allocation)
  exclusive(resolve(ALLOCATION), allocation, ledger)
  return { issued: false, evidenceClass: "preparation_only", allocationRoot: allocation.root, allocationPath: ALLOCATION, store: LEAN_BASELINE_STORE, plannedCurrentCells: 36, charged: 0 }
}
const rssOf = (pid: number): number => {
  if (!Number.isSafeInteger(pid) || pid <= 0) return fail("PROCESS_RSS")
  const kib = Number(execFileSync("ps", ["-o", "rss=", "-p", String(pid)], { encoding: "utf8", timeout: 1000, maxBuffer: 128 }).trim())
  if (!Number.isSafeInteger(kib) || kib <= 0 || kib * 1024 > Number.MAX_SAFE_INTEGER) return fail("PROCESS_RSS")
  return kib * 1024
}
export const assertLeanBaselinePrefixCapacity = (ledger: LeanExperimentLedger, parentPid: number, reserveBytes = 320 * 1024 * 1024): number => {
  if (process.ppid !== parentPid || !process.connected) return fail("PARENT_LOST")
  const childRss = Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024), parentRss = rssOf(parentPid)
  if (process.ppid !== parentPid || !process.connected) return fail("PARENT_LOST")
  const fs = statfsSync(ledger.directory, { bigint: true }), free = fs.bavail * fs.bsize
  if (free > BigInt(Number.MAX_SAFE_INTEGER)) return fail("PREFIX_CAPACITY")
  return assessLeanPrefixCapacity({ childRss, parentRss, freeBytes: Number(free), allocatedBytes: cumulativeLeanPhysicalBytes(ledger), elapsedMs: currentLeanElapsedMs(ledger) }, reserveBytes)
}
export const leanBaselinePair = (input: { ordinal: number; slot: LeanSlot; priorLedgerBytesRoot: LabRoot; priorLedgerByteLength: number; priorCharged: number; bottom: { role: string; sourceRoot: LabRoot; root: LabRoot }; top: { role: string; sourceRoot: LabRoot; root: LabRoot } }) => {
  const body = { schemaVersion: "lean-baseline-pair-v1" as const, ordinal: input.ordinal, slotRoot: input.slot.root, requestRoot: input.slot.requestRoot, priorLedgerBytesRoot: input.priorLedgerBytesRoot, priorLedgerByteLength: input.priorLedgerByteLength, priorCharged: input.priorCharged, bottomRole: input.bottom.role, bottomSourceRoot: input.bottom.sourceRoot, bottomSnapshotRoot: input.bottom.root, topRole: input.top.role, topSourceRoot: input.top.sourceRoot, topSnapshotRoot: input.top.root }
  return { ...body, root: labRoot("lean-baseline-pair-v1", body) }
}
const requestBytesRoot = (path: string) => leanBytesRoot(safeBytes(path))
const existingStart = (ledger: LeanExperimentLedger) => {
  if (readLeanLedger(ledger).events.length || readLeanTimeAccounting(ledger).starts.size || readdirSync(STORE).some(name => ["entry.json", "child-terminal.json", "result.json", "entry-failure.json"].includes(name))) return fail("ALLOCATION_USED")
}
const childBody = async (requestPath: string) => {
  const request = readLeanBaselineRequest(requestPath), { ledger, allocation } = allocationFor(request)
  committedAllocation(ledger)
  const entry = readLeanChildEntry(ledger), fixedHead = head()
  assertLeanEntryBinding(entry, { head: fixedHead, sourceRoot: request.sourceRoot, requestBytesRoot: requestBytesRoot(requestPath), allocationRoot: allocation.root, parentPid: process.ppid, childPid: process.pid, intervalStartMs: readLeanTimeAccounting(ledger).starts.get("pilot-entry") ?? -1 })
  const parent = createLeanParentObservationGuard(entry.parentPid)
  const onDisconnect = () => { parent.disconnect(); process.exit(1) }
  process.once("disconnect", onDisconnect)
  let bufferHighWater = 0
  const checkpoint = () => {
    parent.assert()
    bufferHighWater = Math.max(bufferHighWater, assertLeanBaselinePrefixCapacity(ledger, entry.parentPid))
    parent.assert()
  }
  try {
    checkpoint()
    const pipeline = await executeLeanCurrentPipeline({
      allocation,
      checkpoint,
      freezeSource: source => { checkpoint(); publishLeanBaselineSource(ledger, source); checkpoint() },
      retainArtifact: (name, value) => {
        if (!/^(?:seal-metadata|cold-corpus|initial-proposals|initial-selection|initial-training|initial-analysis|response-work|response-training|current-analysis)\.json$/u.test(name)) return fail("ARTIFACT_NAME")
        checkpoint(); exclusive(join(STORE, name), value, ledger); checkpoint()
      },
      dispatch: async (slot, bottom, top, observedRole) => {
        parent.assert()
        if (head() !== fixedHead || leanBaselineSourceManifest().root !== request.sourceRoot || requestBytesRoot(requestPath) !== entry.requestBytesRoot) return fail("SOURCE_HOLD")
        // A pre-charge checkpoint is followed by the immutable pair receipt.
        // The ledger byte prefix is captured before any Match authority exists.
        checkpointLeanResources(ledger, currentLeanElapsedMs(ledger), bufferHighWater, LEAN_EXTERNAL_SCRATCH_RESERVE)
        checkpoint()
        const before = safeBytes(join(STORE, "ledger.ndjson"), 1_048_576)
        const priorCharged = readLeanLedger(ledger).charged
        const pair = leanBaselinePair({ ordinal: slot.ordinal, slot, priorLedgerBytesRoot: leanBytesRoot(before), priorLedgerByteLength: before.length, priorCharged, bottom, top })
        exclusive(join(STORE, `pair-${slot.ordinal}.json`), pair, ledger)
        // Fresh same-process live parent/child, disk, time, and available-memory
        // observations precede every charge and both native provider creations.
        checkpoint()
        const fs = statfsSync(STORE, { bigint: true }), free = fs.bavail * fs.bsize
        if (free > BigInt(Number.MAX_SAFE_INTEGER)) return fail("CAPACITY_RANGE")
        const charge = chargeLeanSlot(ledger, slot, { freeBytes: Number(free), availableMemoryBytes: observeLeagueAvailableMemoryBytes() })
        const execution = await runLeanBaselineMatch({ ledger, charge, slot, seed: request.seed, bottom, top, observedRole, checkpoint, register: parent.register, unregister: parent.unregister })
        parent.assert()
        retainLeanMatch(ledger, charge, execution.compact, execution.replayFrames)
        const { replayFrames: _frames, ...cellBody } = execution
        const cell = { ...cellBody, ordinal: slot.ordinal, slotRoot: slot.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot }
        const observationBody = { schemaVersion: "lean-baseline-observation-v1" as const, pairRoot: pair.root, cell }
        const observation = { ...observationBody, root: labRoot("lean-baseline-observation-v1", observationBody) }
        if (leanCanonicalBytes(observation).length > 8 * 1024 * 1024) return fail("OBSERVATION_SIZE")
        exclusive(join(STORE, `observation-${slot.ordinal}.json`), observation, ledger)
        if (execution.diagnostic) exclusive(join(STORE, `diagnostic-${charge.root.slice(7)}.json`), execution.diagnostic, ledger)
        checkpoint()
        checkpointLeanResources(ledger, currentLeanElapsedMs(ledger), bufferHighWater, LEAN_EXTERNAL_SCRATCH_RESERVE)
        // Final result uses the compact view, while the full bounded legal
        // observations remain available for independent private verification.
        if (compactLeanBaselineCell(cell).observationRoot !== labRoot("lean-baseline-observation-v1", cell)) return fail("OBSERVATION_ROOT")
        return cell
      },
    })
    const completed = pipeline.status === "current_baseline_complete"
    stopLeanLedger(ledger, completed ? "complete" : "failure")
    checkpoint()
    const verified = verifyLeanEvidence(ledger)
    if (head() !== fixedHead || leanBaselineSourceManifest().root !== request.sourceRoot || requestBytesRoot(requestPath) !== entry.requestBytesRoot) return fail("SOURCE_HOLD")
    const result = { schemaVersion: "lean-current-baseline-result-v1", issued: false, evidenceClass: "exploratory_current_only", allocationRoot: allocation.root, sourceRoot: request.sourceRoot, requestBytesRoot: entry.requestBytesRoot, head: fixedHead, evidenceRoot: verified.root, pipeline, charged: verified.charged, successful: verified.records.filter(record => record.status === "success").length, status: completed ? "pending_independent_verification" : "partial_or_failed_baseline", elapsedMs: verified.elapsedMs, physicalHighWaterBytes: verified.physicalHighWaterBytes, scratchHighWaterBytes: verified.scratchHighWaterBytes, holdoutOpened: false, formationMaterialized: false }
    exclusive(join(STORE, "result.json"), result, ledger)
    return result
  } finally { process.off("disconnect", onDisconnect) }
}
/** Hidden child is inert until the exact one-use parent release is committed. */
export const runLeanCurrentChild = async (requestPath: string) => {
  requireScope()
  if (!process.send || !process.connected) return fail("CHILD_PARENT")
  const token = await new Promise<string>((resolveToken, reject) => {
    const timer = setTimeout(() => reject(new TypeError("LEAN_BASELINE_HANDSHAKE")), 30_000)
    process.once("disconnect", () => { clearTimeout(timer); reject(new TypeError("LEAN_BASELINE_PARENT_LOST")) })
    process.once("message", message => { clearTimeout(timer); if (!message || typeof message !== "object" || !exactLabKeys(message, ["release"]) || typeof message.release !== "string") { reject(new TypeError("LEAN_BASELINE_HANDSHAKE")); return }; resolveToken(message.release) })
    process.send!({ ready: process.pid })
  })
  const ledger = openLeanLedger(STORE), entry = readLeanChildEntry(ledger)
  admitLeanChildRelease(entry, token, process.pid, process.ppid)
  if (!process.connected || !readLeanTimeAccounting(ledger).active) return fail("PARENT_LOST")
  return childBody(requestPath)
}
export const runLeanCurrent = async (requestPath: string) => {
  requireScope()
  const request = readLeanBaselineRequest(requestPath), { ledger, allocation } = allocationFor(request)
  return runLeanBoundedParent({ ledger, requestPath, allocationPath: ALLOCATION, store: STORE, sourceRoot: request.sourceRoot, manifestRoot: () => leanBaselineSourceManifest().root, childMode: "child-current" })
}
/** Shared parent lifecycle only. Callers still own strict source/request/allocation
 * admission; this does not create or substitute a route. */
export const waitLeanBoundedChildReady = (child: ReturnType<typeof fork>) => new Promise<void>((ready, reject) => {
  const timer = setTimeout(() => reject(new TypeError("LEAN_BASELINE_CHILD_READY")), 30_000)
  child.once("message", message => { clearTimeout(timer); if (!message || typeof message !== "object" || !exactLabKeys(message, ["ready"]) || message.ready !== child.pid) { reject(new TypeError("LEAN_BASELINE_CHILD_READY")); return }; ready() })
  child.once("exit", () => { clearTimeout(timer); reject(new TypeError("LEAN_BASELINE_CHILD_EXIT_BEFORE_ENTRY")) })
})
export const runLeanBoundedParent = async (options: { ledger: LeanExperimentLedger; requestPath: string; allocationPath: string; store: string; sourceRoot: LabRoot; manifestRoot: () => LabRoot; childMode: string; prospectiveStart?: { wallStartMs: number; monotonicStartNs: string }; beforeRelease?: () => void; terminalReserveMs?: number; supervisorObservation?: true }) => {
  const { ledger, requestPath, store: STORE } = options, allocation = ledger.allocation
  const committed = execFileSync("git", ["show", `HEAD:${options.allocationPath}`], { maxBuffer: 262144 })
  if (leanBytesRoot(committed) !== leanBytesRoot(leanCanonicalBytes(allocation)) || leanBytesRoot(committed) !== leanBytesRoot(safeBytes(options.allocationPath))) return fail("UNCOMMITTED_ALLOCATION")
  if (readLeanLedger(ledger).events.length || readLeanTimeAccounting(ledger).active || readLeanTimeAccounting(ledger).starts.has("pilot-entry") || readdirSync(STORE).some(name => ["entry.json", "child-terminal.json", "result.json", "entry-failure.json"].includes(name))) return fail("ALLOCATION_USED")
  const fixedHead = head(), fixedManifest = options.manifestRoot(), fixedRequest = requestBytesRoot(requestPath)
  if (fixedManifest !== options.sourceRoot) return fail("SOURCE_HOLD")
  options.beforeRelease?.()
  const token = randomBytes(32).toString("hex")
  const child = fork(resolve(process.argv[1] ?? fail("ENTRY_PATH")), [options.childMode, "--request", requestPath], { execArgv: process.execArgv, stdio: ["ignore", "ignore", "ignore", "ipc"] })
  let entered = false, uncertain = false, childRssObservedBytes: number | null = null, childFailure: LeanChildFailureReceipt | null = null
  const reasons = new Set<LeanSupervisorReasonCode>()
  const observe = (reason: LeanSupervisorReasonCode) => { if (options.supervisorObservation === true) reasons.add(reason) }
  let finalIdentity: LeanSupervisorReasonEnvelope["observations"]["finalIdentity"] = "matched"
  child.on("error", () => { uncertain = true; observe("child_error") })
  child.on("message", message => {
    if (message !== null && typeof message === "object" && exactLabKeys(message, ["ready"]) && message.ready === child.pid) return
    const validReceipt = isLeanChildFailureReceipt(message)
    if (!validReceipt || childFailure !== null) { uncertain = true; observe(validReceipt ? "duplicate_failure_receipt" : "malformed_ipc"); return }
    childFailure = message
  })
  try {
    await waitLeanBoundedChildReady(child)
    if (!child.pid) return fail("CHILD_PID")
    childRssObservedBytes = rssOf(child.pid)
    if (process.memoryUsage().rss + childRssObservedBytes + LEAN_EXTERNAL_SCRATCH_RESERVE + 320 * 1024 * 1024 > LEAN_CAPS.scratchBytes) return fail("PREFIX_CAPACITY")
    const fs = statfsSync(STORE, { bigint: true }), free = fs.bavail * fs.bsize
    if (free > BigInt(Number.MAX_SAFE_INTEGER) || free < BigInt(LEAN_CAPS.totalBytes - cumulativeLeanPhysicalBytes(ledger))) return fail("PREFIX_CAPACITY")
    options.beforeRelease?.()
    const entry: LeanChildEntryV2 = { schemaVersion: "lean-child-entry-v2", allocationRoot: allocation.root, sourceRoot: options.sourceRoot, requestBytesRoot: fixedRequest, head: fixedHead, parentPid: process.pid, childPid: child.pid, handshakeRoot: leanBytesRoot(Buffer.from(token, "hex")), wallStartMs: options.prospectiveStart?.wallStartMs ?? Date.now(), monotonicStartNs: options.prospectiveStart?.monotonicStartNs ?? process.hrtime.bigint().toString() }
    publishLeanChildEntry(ledger, entry)
    beginLeanInterval(ledger, "pilot-entry", entry.wallStartMs)
    entered = true
    child.send({ release: token })
    const period = setInterval(() => {
      try {
        const rss = rssOf(child.pid!)
        childRssObservedBytes = Math.max(childRssObservedBytes ?? 0, rss)
        if (process.memoryUsage().rss + rss + LEAN_EXTERNAL_SCRATCH_RESERVE + 320 * 1024 * 1024 > LEAN_CAPS.scratchBytes || currentLeanElapsedMs(ledger) >= LEAN_CAPS.elapsedMs) { uncertain = true; observe("resource_threshold"); child.kill("SIGKILL") }
      } catch { uncertain = true; observe("resource_sampling_exception"); child.kill("SIGKILL") }
    }, 250)
    const timeout = setTimeout(() => { uncertain = true; observe("deadline_timeout"); child.kill("SIGKILL") }, Math.max(1, LEAN_CAPS.elapsedMs - currentLeanElapsedMs(ledger) - (options.terminalReserveMs ?? 0)))
    const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(resolveExit => child.once("exit", (code, signal) => resolveExit({ code, signal })))
    clearInterval(period); clearTimeout(timeout)
    try { if (head() !== fixedHead || options.manifestRoot() !== fixedManifest || requestBytesRoot(requestPath) !== fixedRequest) { uncertain = true; observe("final_identity_mismatch"); finalIdentity = "mismatch" } } catch { uncertain = true; observe("final_identity_exception"); finalIdentity = "exception" }
    const terminalFs = statfsSync(STORE, { bigint: true }), terminalFree = terminalFs.bavail * terminalFs.bsize
    const terminal = publishChildTerminalAfterOptionalReceipt(childFailure,
      receipt => exclusive(join(STORE, "entry-failure.json"), receipt, ledger),
      receiptUncertain => {
        if (receiptUncertain) { uncertain = true; observe("failure_receipt_publication_uncertain") }
        if (options.supervisorObservation === true) {
          try {
            const body: Omit<LeanSupervisorReasonEnvelope, "root"> = {
              schemaVersion: "lean-parent-supervisor-reasons-v1", allocationRoot: allocation.root, sourceRoot: options.sourceRoot,
              requestBytesRoot: fixedRequest, entryBytesRoot: leanBytesRoot(safeBytes(join(STORE, "entry.json"))), head: fixedHead,
              parentPid: process.pid, childPid: child.pid!, exitCode: exit.code, signal: exit.signal, uncertain,
              reasons: LEAN_SUPERVISOR_REASON_CODES.filter(reason => reasons.has(reason)),
              observations: { entry: "published", childReady: "observed", resourceSampling: reasons.has("resource_sampling_exception") ? "exception" : "observed", finalIdentity, failureReceipt: childFailure === null ? "absent" : receiptUncertain ? "publication_failed" : "published", cleanup: "child_exit_observed", terminalization: "unobserved", initiatingCause: "unknown" },
            }
            const envelope = { ...body, root: labRoot("lean-parent-supervisor-reasons-v1", body) }
            if (!isLeanSupervisorReasonEnvelope(envelope)) return fail("SUPERVISOR_REASONS")
            exclusive(join(STORE, LEAN_SUPERVISOR_REASON_FILE), envelope, ledger)
          } catch {
            // No retry or success override: existing terminal/cleanup attempts
            // still run, while missing reason custody remains non-accepting.
            uncertain = true
          }
        }
        const derived = deriveLeanChildTerminal(ledger, entry, { exitCode: exit.code, signal: exit.signal, wallObservedMs: Date.now(), monotonicObservedNs: process.hrtime.bigint().toString(), status: exit.code === 0 && !uncertain && childFailure === null ? "child_exited" : "child_failed", parentRssBytes: process.memoryUsage().rss, childRssObservedBytes, physicalBytes: cumulativeLeanPhysicalBytes(ledger) + 65_536, freeBytes: terminalFree <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(terminalFree) : null })
        publishLeanChildTerminal(ledger, derived)
        return derived
      })
    if (terminal.status !== "child_exited") return fail("CHILD_FAILED")
    return { issued: false, evidenceClass: "exploratory_current_only", status: "child_exited_pending_independent_verification", allocationRoot: allocation.root, terminalElapsedUpperBoundMs: terminal.elapsedUpperBoundMs }
  } finally {
    if (options.prospectiveStart && child.exitCode === null && child.signalCode === null) {
      // Accounting closes only after bounded child cleanup, including a ready
      // timeout or a failed post-ready admission. Old parent behavior is intact.
      const cleanup = new Promise<void>((done, reject) => {
        const timer = setTimeout(() => reject(new TypeError("LEAN_BASELINE_CHILD_CLEANUP_UNCERTAIN")), 30000)
        child.once("exit", () => { clearTimeout(timer); done() })
      })
      child.kill("SIGKILL")
      await cleanup
    } else if (!entered && child.exitCode === null) child.kill("SIGKILL")
  }
}
export const leanBaselineMain = async (args: readonly string[]) => {
  const command = parseLeanBaselineCommand(args)
  if (command.mode === "prepare-current") return prepareLeanCurrent(command.request)
  if (command.mode === "run-current") return runLeanCurrent(command.request)
  const { verifyLeanCurrentBaselineRetained } = await import("./lib/v1-38-lean-baseline-retained.js")
  return verifyLeanCurrentBaselineRetained(command.request)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  const childMode = args.length === 3 && args[0] === "child-current" && args[1] === "--request"
  const action = childMode ? runLeanCurrentChild(args[2]!) : leanBaselineMain(args)
  if (childMode) void resolveLeanChildCliTerminal(action)
  else void action.then(value => { process.stdout.write(`${JSON.stringify(value)}\n`) }).catch(() => { process.stderr.write("LEAN_BASELINE_FAILED_DETAILS_WITHHELD\n"); process.exitCode = 1 })
}
