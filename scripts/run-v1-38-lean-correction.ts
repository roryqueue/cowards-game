/** Additive, fixed one-cell diagnostic / conditional 36-cell baseline.
 * Import is inert. Historical requests, stores and empirical readers are never used. */
import { constants, closeSync, existsSync, fstatSync, fsyncSync, lstatSync, openSync, readFileSync, realpathSync, readdirSync, statfsSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { exactLabKeys, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { LEAN_CAPS, LEAN_CORRECTION_ROUTES, LEAN_EXTERNAL_SCRATCH_RESERVE, LEAN_BASELINE_STORE, LEAN_BASELINE_WRITABLE_PATHS, createLeanCorrectionAllocation, createLeanLedger, openLeanLedger, readLeanLedger, readLeanTimeAccounting, readLeanChildEntry, readLeanChildTerminal, beginLeanInterval, closeLeanInterval, chargeLeanSlot, retainLeanMatch, checkpointLeanResources, stopLeanLedger, verifyLeanEvidence, currentLeanElapsedMs, cumulativeLeanPhysicalBytes, measureLeanPhysicalBytes, inspectLeanClosedV7Predecessor, leanBytesRoot, leanCanonicalBytes, writeLeanAll, assertLeanPublicationCapacity, type LeanCorrectionPredecessor, type LeanCorrectionAllocation, type LeanExperimentLedger } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { leanBaselineSourceManifest, deriveLeanBaselineRequestRoots, deriveLeanBaselineCandidateRoots, leanBaselinePair, runLeanBoundedParent, assertLeanBaselinePrefixCapacity, admitsLeanBaselineReviewAgents } from "./run-v1-38-lean-baseline.js"
import { createLeanParentObservationGuard, admitLeanChildRelease, assertLeanEntryBinding } from "./run-v1-38-lean-experiment.js"
import { observeLeagueAvailableMemoryBytes } from "./run-v1-38-serious-league.js"
import { authenticateLeanColdReuse, LEAN_COLD_REUSE_HISTORY, type LeanColdReuse } from "./lib/v1-38-lean-baseline-reuse.js"
import { executeLeanReusedCurrentPipeline } from "./lib/v1-38-lean-baseline-pipeline.js"
import { publishLeanBaselineSource, publishLeanReusedBaselineSource } from "./lib/v1-38-lean-baseline-source.js"
import { runLeanBaselineMatch } from "./lib/v1-38-lean-baseline-match.js"
import { validateLeanCorrectionOriginMetadata, type LeanCorrectionOriginMetadata } from "./lib/v1-38-lean-container-match-session.js"
import { resolveLeanChildCliTerminal } from "./lib/v1-38-lean-child-cli-terminal.js"

export { LEAN_CORRECTION_ROUTES }
export type LeanCorrectionRoute = keyof typeof LEAN_CORRECTION_ROUTES
const fail = (code: string): never => { throw new TypeError(`LEAN_CORRECTION_${code}`) }
const root = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v)
const same = (a: unknown, b: unknown) => labRoot("lean-correction-exact-v1", a) === labRoot("lean-correction-exact-v1", b)
const PLAN = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-BOUNDED-CORRECTION-PLAN-v1.md"
const AMENDMENT = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-CONTINUATION-DECISION-v1.md"
export const LEAN_CORRECTION_RESERVE = Object.freeze({ cleanupMs: 30_000, terminalMs: 30_000, checkMs: 600_000, replayMs: 600_000, bufferBytes: 320 * 1024 * 1024, terminalBytes: 65_536 })
type AdmissionClock = { wallStartMs: number; monotonicStartNs: string }
const admissionClock = (): AdmissionClock => ({ wallStartMs: Date.now(), monotonicStartNs: process.hrtime.bigint().toString() })
const processAdmissionClock = (): AdmissionClock => {
  const now = admissionClock(), uptimeNs = BigInt(Math.ceil(process.uptime() * 1_000_000_000))
  return { wallStartMs: now.wallStartMs - Number((uptimeNs + 999999n) / 1000000n), monotonicStartNs: (BigInt(now.monotonicStartNs) - uptimeNs).toString() }
}
/** Exclusive host custody precedes source authentication and child startup.
 * An interrupted start is never refunded; a spent command cannot be reopened. */
export const beginLeanCorrectionAdmission = (route: LeanCorrectionRoute, mode: "prepare" | "run", directory = resolve(LEAN_CORRECTION_ROUTES[route].temp), clock = processAdmissionClock()) => {
  const stat = lstatSync(directory)
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid?.() || (stat.mode & 0o777) !== 0o700 || realpathSync(directory) !== resolve(directory)) return fail("ADMISSION_DIRECTORY")
  const body = { schemaVersion: "lean-correction-admission-v1", route, mode, parentPid: process.pid, ...clock }
  const carrier = { ...body, root: labRoot(body.schemaVersion, body) }
  publishLeanCorrection(join(directory, `admission-${mode}-start.json`), carrier)
  return { ...carrier, directory }
}
export const leanCorrectionAdmissionElapsed = (start: AdmissionClock, now = admissionClock()): number => {
  if (!Number.isSafeInteger(start.wallStartMs) || start.wallStartMs < 0 || !/^\d{1,30}$/u.test(start.monotonicStartNs) || !/^\d{1,30}$/u.test(now.monotonicStartNs)) return fail("ADMISSION_CLOCK")
  const ns = BigInt(now.monotonicStartNs) - BigInt(start.monotonicStartNs)
  const elapsed = Math.max(now.wallStartMs - start.wallStartMs, Number((ns + 999999n) / 1000000n))
  if (ns < 0n || !Number.isSafeInteger(elapsed) || elapsed < 0) return fail("ADMISSION_CLOCK")
  return elapsed
}
export const assertLeanCorrectionAdmissionTime = (priorMs: number, start: AdmissionClock, now = admissionClock()): number => {
  const elapsed = priorMs + leanCorrectionAdmissionElapsed(start, now)
  const reserve = LEAN_CAPS.matchMs + LEAN_CORRECTION_RESERVE.cleanupMs + LEAN_CORRECTION_RESERVE.terminalMs + LEAN_CORRECTION_RESERVE.checkMs + LEAN_CORRECTION_RESERVE.replayMs
  if (!Number.isSafeInteger(priorMs) || priorMs < 3319046 || elapsed + reserve >= LEAN_CAPS.elapsedMs) return fail("ADMISSION_TIME")
  return elapsed
}
export const closeLeanCorrectionAdmission = (carrier: ReturnType<typeof beginLeanCorrectionAdmission>, ledger: LeanExperimentLedger | null, now = admissionClock()) => {
  const elapsedUpperBoundMs = leanCorrectionAdmissionElapsed(carrier, now)
  let ledgerInterval: string | null = null, importedMs = 0
  let ledgerFailure: unknown, closeActiveEntry = false
  if (ledger) {
    try {
    const time = readLeanTimeAccounting(ledger)
    // Failed parent paths may have an entry but no terminal. Close that exact
    // original clock; no success terminal is invented and readers fail closed.
    if (time.active) {
      if (time.starts.get("pilot-entry") !== carrier.wallStartMs) return fail("ADMISSION_UNCLOSED_ENTRY")
      closeActiveEntry = true
    }
    if (time.starts.has("pilot-entry") && time.starts.get("pilot-entry") !== carrier.wallStartMs) return fail("ADMISSION_CUSTODY")
    importedMs = closeActiveEntry ? elapsedUpperBoundMs : time.starts.has("pilot-entry") ? (time.closes.get("pilot-entry") ?? fail("ADMISSION_UNCLOSED_ENTRY")) - carrier.wallStartMs : 0
    if (importedMs > elapsedUpperBoundMs) return fail("ADMISSION_CLOCK")
    ledgerInterval = carrier.mode === "prepare" ? "correction-preparation" : "correction-run-finalization"
    } catch (error) { ledgerFailure = error }
  }
  const body = { schemaVersion: "lean-correction-admission-close-v1", startRoot: carrier.root, route: carrier.route, mode: carrier.mode, elapsedUpperBoundMs, monotonicObservedNs: now.monotonicStartNs, wallObservedMs: now.wallStartMs, allocationRoot: ledger?.allocation.root ?? null, ledgerInterval, importedMs }
  const closed = { ...body, root: labRoot(body.schemaVersion, body) }
  // Receipt is durable before ledger import. Failed import remains fail-closed:
  // later admission independently requires the exact corresponding interval.
  publishLeanCorrection(join(carrier.directory, `admission-${carrier.mode}-close.json`), closed)
  if (ledgerFailure) throw ledgerFailure
  if (ledger && ledgerInterval) {
    if (closeActiveEntry) closeLeanInterval(ledger, "pilot-entry", carrier.wallStartMs + elapsedUpperBoundMs)
    beginLeanInterval(ledger, ledgerInterval, carrier.wallStartMs + importedMs)
    closeLeanInterval(ledger, ledgerInterval, carrier.wallStartMs + elapsedUpperBoundMs)
  }
  return closed
}
export const leanCorrectionSourceManifest = () => {
  const entries = new Map(leanBaselineSourceManifest().entries.map(e => [e.path, e]))
  for (const path of ["scripts/run-v1-38-lean-correction.ts", "scripts/run-v1-38-lean-correction.sh", "scripts/lib/v1-38-lean-baseline-reuse.ts", "scripts/lib/v1-38-lean-correction-retained.ts", "scripts/lib/v1-38-planner-supervised-runtime.ts"]) entries.set(path, { path, root: leanBytesRoot(readFileSync(resolve(path))) })
  const sorted = [...entries.values()].sort((a, b) => a.path.localeCompare(b.path))
  return { entries: sorted, root: labRoot("lean-correction-reviewed-source-v1", sorted) }
}
/** Bounded owner-only descriptor read; no symbolic links, aliases or custody drift. */
export const readLeanCorrectionPrivateBytes = (path: string, limit = 262144): Uint8Array => {
  const absolute = resolve(path), stat = lstatSync(absolute)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.uid !== process.getuid?.() || stat.nlink !== 1 || (stat.mode & 0o777) !== 0o600 || stat.size > limit || realpathSync(absolute) !== absolute) return fail("PRIVATE_FILE")
  const fd = openSync(absolute, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const before = fstatSync(fd)
    if (before.dev !== stat.dev || before.ino !== stat.ino || before.size !== stat.size || before.nlink !== 1 || before.uid !== stat.uid || (before.mode & 0o777) !== 0o600) return fail("PRIVATE_FILE")
    const bytes = readFileSync(fd), after = fstatSync(fd)
    if (bytes.length !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs || after.nlink !== 1) return fail("PRIVATE_FILE")
    return bytes
  } finally { closeSync(fd) }
}
export const readLeanCorrectionJson = (path: string, limit = 262144): unknown => {
  const bytes = readLeanCorrectionPrivateBytes(path, limit), value: unknown = JSON.parse(Buffer.from(bytes).toString("utf8"))
  if (!same([...bytes], [...leanCanonicalBytes(value)])) return fail("CANONICAL")
  return value
}
export const publishLeanCorrection = (path: string, value: unknown, ledger?: LeanExperimentLedger): void => {
  const bytes = leanCanonicalBytes(value)
  if (ledger) assertLeanPublicationCapacity(ledger, bytes.length)
  const fd = openSync(resolve(path), constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
  try { writeLeanAll(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) }
  const directory = openSync(resolve(path, ".."), constants.O_RDONLY)
  try { fsyncSync(directory) } finally { closeSync(directory) }
}
export const parseLeanCorrectionCommand = (args: readonly string[]) => {
  const mode = args[0], route: LeanCorrectionRoute = mode?.endsWith("-diagnostic") ? "diagnostic" : mode?.endsWith("-baseline") ? "baseline" : fail("ARGUMENTS")
  if (args.length !== 3 || args[1] !== "--request" || !["prepare", "run", "verify"].some(prefix => mode === `${prefix}-${route}`) || args[2] !== LEAN_CORRECTION_ROUTES[route].request) return fail("ARGUMENTS")
  return { mode: mode!, route, request: args[2]! }
}
export const assertLeanCorrectionResources = (m: { elapsedMs: number; charged: number; physicalBytes: number; childRss: number; parentRss: number; freeBytes: number; availableMemoryBytes: number }): number => {
  if (!exactLabKeys(m, ["elapsedMs", "charged", "physicalBytes", "childRss", "parentRss", "freeBytes", "availableMemoryBytes"]) || !Object.values(m).every(n => Number.isSafeInteger(n) && n >= 0) || m.elapsedMs < 3319046 || m.charged < 10 || m.charged >= LEAN_CAPS.matches || m.elapsedMs + LEAN_CAPS.matchMs + LEAN_CORRECTION_RESERVE.cleanupMs + LEAN_CORRECTION_RESERVE.terminalMs + LEAN_CORRECTION_RESERVE.checkMs + LEAN_CORRECTION_RESERVE.replayMs >= LEAN_CAPS.elapsedMs || m.physicalBytes + LEAN_CORRECTION_RESERVE.terminalBytes > LEAN_CAPS.retainedBytes || m.childRss + m.parentRss + LEAN_EXTERNAL_SCRATCH_RESERVE + LEAN_CORRECTION_RESERVE.bufferBytes > LEAN_CAPS.scratchBytes || m.physicalBytes + m.childRss + m.parentRss + LEAN_EXTERNAL_SCRATCH_RESERVE + LEAN_CORRECTION_RESERVE.bufferBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes || m.freeBytes < LEAN_CAPS.totalBytes - m.physicalBytes || m.availableMemoryBytes < 1_073_741_824) return fail("CAPACITY")
  return m.childRss + m.parentRss + LEAN_CORRECTION_RESERVE.bufferBytes
}
export interface LeanCorrectionDiagnosis {
  schemaVersion: "lean-correction-diagnosis-v1"; diagnosticCheckRoot: LabRoot; originRoot: LabRoot; cause: "legacy_deadline_observed"; cleanupComplete: true; actionable: true
  authorAgent: string; reviewerAgent: string; independentlyReviewed: true; root: LabRoot
}
/** Native signals alone cannot establish cause. A separate independently
 * checked narrow diagnosis is required, followed by source-bound repair review. */
export const validateLeanCorrectionDiagnosis = (value: unknown, checkRoot: LabRoot): LeanCorrectionDiagnosis => {
  if (!exactLabKeys(value, ["schemaVersion", "diagnosticCheckRoot", "originRoot", "cause", "cleanupComplete", "actionable", "authorAgent", "reviewerAgent", "independentlyReviewed", "root"])) return fail("DIAGNOSIS")
  const v = value as unknown as LeanCorrectionDiagnosis, { root: r, ...body } = v
  if (v.schemaVersion !== "lean-correction-diagnosis-v1" || v.diagnosticCheckRoot !== checkRoot || !root(v.originRoot) || v.cause !== "legacy_deadline_observed" || v.cleanupComplete !== true || v.actionable !== true || v.independentlyReviewed !== true || !admitsLeanBaselineReviewAgents(v.authorAgent, v.reviewerAgent) || r !== labRoot(v.schemaVersion, body)) return fail("DIAGNOSIS")
  return Object.freeze(structuredClone(v))
}
export interface LeanCorrectionRequest {
  schemaVersion: "lean-correction-request-v1"; route: LeanCorrectionRoute; sourceRoot: LabRoot; planRoot: LabRoot; amendmentRoot: LabRoot
  reviewPath: string; reviewRoot: LabRoot; dataReviewPath: string; dataReviewRoot: LabRoot; coldRoot: LabRoot; seed: string; reuseGrantRoot: LabRoot
  candidateRoots: readonly LabRoot[]; requestRoots: readonly LabRoot[]; diagnosis: LeanCorrectionDiagnosis | null
}
const readReview = (path: string, expected: LabRoot, source: LabRoot, diagnosisRoot: LabRoot | null, dataRequestRoot?: LabRoot) => {
  const absolute = resolve(path)
  if (!absolute.startsWith(`${resolve(".planning/phases/265-serious-current-rules-league-and-development-red-team")}/`)) return fail("REVIEW")
  const bytes = readFileSync(absolute)
  if (bytes.length > 262144 || leanBytesRoot(bytes) !== expected) return fail("REVIEW")
  const front = bytes.toString("utf8").split("\n---", 2)[0]!
  const field = (key: string) => front.match(new RegExp(`^${key}: ([^\\n]+)$`, "mu"))?.[1]?.replace(/^['"]|['"]$/gu, "")
  const commit = field("source_commit")
  if (!front.startsWith("---\n") || field("status") !== "clean" || field("source_root") !== source || field("independently_reviewed") !== "true" || !admitsLeanBaselineReviewAgents(field("author_agent"), field("reviewer_agent")) || !commit || !/^[a-f0-9]{40}$/u.test(commit) || diagnosisRoot !== null && (field("diagnosis_root") !== diagnosisRoot || field("repair_verified") !== "true") || dataRequestRoot !== undefined && field("request_root") !== dataRequestRoot) return fail("REVIEW")
  try { execFileSync("git", ["diff", "--exit-code", commit, "--", ...leanCorrectionSourceManifest().entries.map(e => e.path)], { stdio: "pipe", maxBuffer: 1024 }) } catch { return fail("REVIEW_SOURCE") }
}
export const leanCorrectionRequestDataRoot = (request: LeanCorrectionRequest): LabRoot => {
  const { dataReviewPath: _path, dataReviewRoot: _root, ...body } = request
  return labRoot("lean-correction-request-data-v1", body)
}
export const deriveLeanCorrectionRequestRoots = (input: { route: LeanCorrectionRoute; seed: string; coldRoot: LabRoot; planRoot: LabRoot; sourceRoot: LabRoot }): readonly LabRoot[] => {
  if (!exactLabKeys(input, ["route", "seed", "coldRoot", "planRoot", "sourceRoot"]) || !["diagnostic", "baseline"].includes(input.route)) return fail("REQUEST_ROOTS")
  const roots = deriveLeanBaselineRequestRoots({ seed: input.seed, coldRoot: input.coldRoot, planRoot: input.planRoot, sourceRoot: input.sourceRoot })
  return (input.route === "diagnostic" ? roots.slice(0, 1) : roots).map((historicalIntentRoot, ordinal) => labRoot("lean-correction-request-slot-v1", { route: input.route, historicalIntentRoot, ordinal }))
}
export const readLeanCorrectionRequest = (path: string, route: LeanCorrectionRoute): { request: LeanCorrectionRequest; reuse: LeanColdReuse } => {
  if (path !== LEAN_CORRECTION_ROUTES[route].request) return fail("REQUEST_PATH")
  const request = readLeanCorrectionJson(path) as LeanCorrectionRequest
  if (!exactLabKeys(request, ["schemaVersion", "route", "sourceRoot", "planRoot", "amendmentRoot", "reviewPath", "reviewRoot", "dataReviewPath", "dataReviewRoot", "coldRoot", "seed", "reuseGrantRoot", "candidateRoots", "requestRoots", "diagnosis"]) || request.schemaVersion !== "lean-correction-request-v1" || request.route !== route || request.sourceRoot !== leanCorrectionSourceManifest().root || request.amendmentRoot !== LEAN_COLD_REUSE_HISTORY.amendmentRoot || leanBytesRoot(readFileSync(AMENDMENT)) !== request.amendmentRoot || request.planRoot !== leanBytesRoot(readFileSync(PLAN)) || request.seed !== LEAN_COLD_REUSE_HISTORY.seed || request.coldRoot !== LEAN_COLD_REUSE_HISTORY.coldRoot || !same(request.candidateRoots, deriveLeanBaselineCandidateRoots(request.coldRoot)) || !same(request.requestRoots, deriveLeanCorrectionRequestRoots({ route, seed: request.seed, coldRoot: request.coldRoot, planRoot: request.planRoot, sourceRoot: request.sourceRoot }))) return fail("REQUEST")
  const reuse = authenticateLeanColdReuse({ directory: LEAN_BASELINE_STORE, newSourceRoot: request.sourceRoot, amendmentRoot: request.amendmentRoot })
  if (reuse.grant.root !== request.reuseGrantRoot) return fail("REUSE")
  if (route === "diagnostic" ? request.diagnosis !== null : request.diagnosis === null) return fail("DIAGNOSIS")
  if (route === "baseline") {
    const check = readLeanCorrectionJson(join(LEAN_CORRECTION_ROUTES.diagnostic.store, LEAN_CORRECTION_ROUTES.diagnostic.check)) as Record<string, unknown> & { root: LabRoot; cleanupComplete: boolean; originRoot: LabRoot | null; observedOrigin: string; status: string }
    const { root: checkRoot, ...checkBody } = check
    if (checkRoot !== labRoot("lean-correction-retained-v1", checkBody) || check.schemaVersion !== "lean-correction-retained-v1" || check.route !== "diagnostic" || check.currentCharged !== 1 || check.cumulativeCharged !== 11 || check.phaseComplete !== false || check.freezeAdmitted !== false || check.holdoutOpened !== false || check.formationMaterialized !== false) return fail("DIAGNOSTIC_CHECK")
    const diagnosticLedger = openLeanLedger(LEAN_CORRECTION_ROUTES.diagnostic.store), diagnosticEntry = readLeanChildEntry(diagnosticLedger), diagnosticTerminal = readLeanChildTerminal(diagnosticLedger), diagnosticTime = readLeanTimeAccounting(diagnosticLedger)
    const diagnosticResult = readLeanCorrectionJson(join(diagnosticLedger.directory, "result.json")) as Record<string, unknown>
    if (check.allocationRoot !== diagnosticLedger.allocation.root || check.sourceRoot !== diagnosticEntry.sourceRoot || check.head !== diagnosticEntry.head || check.resultRoot !== diagnosticResult.root || diagnosticTerminal.status !== "child_exited" || diagnosticTime.active || !diagnosticTime.closed.has("correction-diagnostic-verifier")) return fail("DIAGNOSTIC_CUSTODY")
    const diagnosis = validateLeanCorrectionDiagnosis(request.diagnosis, check.root)
    if (!check.cleanupComplete || check.status !== "retained_valid" || check.observedOrigin !== "legacy_deadline" || check.originRoot !== diagnosis.originRoot) return fail("DIAGNOSTIC_UNKNOWN_OR_UNCLEAN")
  }
  readReview(request.reviewPath, request.reviewRoot, request.sourceRoot, request.diagnosis?.root ?? null)
  readReview(request.dataReviewPath, request.dataReviewRoot, request.sourceRoot, request.diagnosis?.root ?? null, leanCorrectionRequestDataRoot(request))
  return { request, reuse }
}
/** Carry every predecessor survivor and cost. This inventory reads bytes/counters,
 * never calls a historical empirical reader or a cold builder. */
export const inspectLeanCorrectionPredecessor = (route: LeanCorrectionRoute, activeAdmissionRoot?: LabRoot): LeanCorrectionPredecessor => {
  const prior = inspectLeanClosedV7Predecessor(), historical = openLeanLedger(LEAN_BASELINE_STORE), historyTime = readLeanTimeAccounting(historical), historyState = readLeanLedger(historical)
  readLeanChildTerminal(historical)
  if (historyTime.active || historyTime.elapsedMs !== 3319046 || historyState.charged !== 10) return fail("HISTORY")
  const identities: string[] = [LEAN_BASELINE_STORE, ...LEAN_BASELINE_WRITABLE_PATHS]
  let chargedMatches = 10, elapsedUpperBoundMs = 3319046
  const historyRoots: LabRoot[] = [LEAN_COLD_REUSE_HISTORY.verificationRoot]
  if (route === "baseline") {
    const diagnostic = openLeanLedger(LEAN_CORRECTION_ROUTES.diagnostic.store), time = readLeanTimeAccounting(diagnostic), state = readLeanLedger(diagnostic)
    readLeanChildTerminal(diagnostic)
    if (time.active || !time.closed.has("correction-diagnostic-verifier") || state.charges.size !== 1 || !state.stopped) return fail("DIAGNOSTIC_UNCLOSED")
    elapsedUpperBoundMs = time.elapsedMs; chargedMatches = state.charged
    identities.push(LEAN_CORRECTION_ROUTES.diagnostic.store, LEAN_CORRECTION_ROUTES.diagnostic.temp, LEAN_CORRECTION_ROUTES.diagnostic.request, LEAN_CORRECTION_ROUTES.diagnostic.allocation)
    historyRoots.push(leanBytesRoot(readLeanCorrectionPrivateBytes(join(diagnostic.directory, LEAN_CORRECTION_ROUTES.diagnostic.check))))
  }
  for (const priorRoute of ["diagnostic", "baseline"] as const) for (const mode of ["prepare", "run"] as const) {
    const directory = LEAN_CORRECTION_ROUTES[priorRoute].temp, startPath = join(directory, `admission-${mode}-start.json`)
    if (!existsSync(startPath)) continue
    const start = readLeanCorrectionJson(startPath) as ReturnType<typeof beginLeanCorrectionAdmission>, { root: startRoot, ...startBody } = start
    if (!exactLabKeys(start, ["schemaVersion", "route", "mode", "parentPid", "wallStartMs", "monotonicStartNs", "root"]) || startRoot !== labRoot("lean-correction-admission-v1", startBody) || start.route !== priorRoute || start.mode !== mode) return fail("ADMISSION_CUSTODY")
    if (startRoot === activeAdmissionRoot) continue
    const closePath = join(directory, `admission-${mode}-close.json`)
    if (!existsSync(closePath)) return fail("ADMISSION_INTERRUPTED_NO_REFUND")
    const closed = readLeanCorrectionJson(closePath) as ReturnType<typeof closeLeanCorrectionAdmission>, { root: closeRoot, ...closeBody } = closed
    if (!exactLabKeys(closed, ["schemaVersion", "startRoot", "route", "mode", "elapsedUpperBoundMs", "monotonicObservedNs", "wallObservedMs", "allocationRoot", "ledgerInterval", "importedMs", "root"]) || closeRoot !== labRoot("lean-correction-admission-close-v1", closeBody) || closed.startRoot !== startRoot || closed.route !== priorRoute || closed.mode !== mode || closed.elapsedUpperBoundMs !== leanCorrectionAdmissionElapsed(start, { wallStartMs: closed.wallObservedMs, monotonicStartNs: closed.monotonicObservedNs })) return fail("ADMISSION_CUSTODY")
    if (closed.allocationRoot === null) { elapsedUpperBoundMs += closed.elapsedUpperBoundMs; historyRoots.push(closeRoot) }
    else {
      const accounted = openLeanLedger(LEAN_CORRECTION_ROUTES[priorRoute].store), time = readLeanTimeAccounting(accounted)
      if (accounted.allocation.root !== closed.allocationRoot || !closed.ledgerInterval || !time.closed.has(closed.ledgerInterval) || time.starts.get(closed.ledgerInterval) !== start.wallStartMs + closed.importedMs || time.closes.get(closed.ledgerInterval) !== start.wallStartMs + closed.elapsedUpperBoundMs) return fail("ADMISSION_CUSTODY")
    }
  }
  const survivors = identities.map(identity => {
    const stat = lstatSync(resolve(identity))
    if (stat.isSymbolicLink() || realpathSync(resolve(identity)) !== resolve(identity) || !stat.isDirectory() && (!stat.isFile() || stat.nlink !== 1)) return fail("SURVIVOR")
    return { identity, allocatedBytes: stat.isDirectory() ? measureLeanPhysicalBytes(identity) : stat.blocks * 512 }
  })
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches, elapsedUpperBoundMs, allocatedDiskBytes: prior.allocatedDiskBytes + survivors.reduce((n, s) => n + s.allocatedBytes, 0), historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: labRoot("lean-correction-history-v1", historyRoots), survivors }
  return { ...body, root: labRoot(body.schemaVersion, body) }
}
const scope = (route: LeanCorrectionRoute) => {
  const temp = resolve(LEAN_CORRECTION_ROUTES[route].temp), stat = lstatSync(temp)
  if (process.env.TSX_DISABLE_CACHE !== "1" || process.env.NODE_DISABLE_COMPILE_CACHE !== "1" || ["NODE_OPTIONS", "NODE_COMPILE_CACHE", "NODE_REDIRECT_WARNINGS", "NODE_V8_COVERAGE"].some(k => process.env[k] !== undefined) || process.env.TMPDIR !== temp || !stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o777) !== 0o700 || stat.uid !== process.getuid?.() || realpathSync(temp) !== temp || execFileSync("sh", ["-c", "ulimit -c"], { encoding: "utf8", timeout: 1000, maxBuffer: 128 }).trim() !== "0") return fail("WRITABLE_SCOPE")
}
export const prepareLeanCorrection = (path: string, route: LeanCorrectionRoute) => {
  const carrier = beginLeanCorrectionAdmission(route, "prepare")
  let ledger: LeanExperimentLedger | null = null
  try {
  scope(route)
  const { request, reuse } = readLeanCorrectionRequest(path, route), predecessor = inspectLeanCorrectionPredecessor(route, carrier.root)
  assertLeanCorrectionAdmissionTime(predecessor.elapsedUpperBoundMs, carrier)
  const allocation = createLeanCorrectionAllocation({ sourceRoot: request.sourceRoot, reviewRoot: request.reviewRoot, coldRoot: request.coldRoot, planRoot: request.planRoot, candidateRoots: request.candidateRoots, requestRoots: request.requestRoots, seed: request.seed, route, reuseGrantRoot: reuse.grant.root, diagnosisRoot: request.diagnosis?.root ?? null, predecessor })
  ledger = createLeanLedger(LEAN_CORRECTION_ROUTES[route].store, allocation)
  publishLeanCorrection(LEAN_CORRECTION_ROUTES[route].allocation, allocation, ledger)
  return { issued: false, evidenceClass: "preparation_only", route, allocationRoot: allocation.root, plannedCells: allocation.slots.length, charged: 0 }
  } finally { closeLeanCorrectionAdmission(carrier, ledger) }
}
const allocationFor = (path: string, route: LeanCorrectionRoute) => {
  const { request, reuse } = readLeanCorrectionRequest(path, route), ledger = openLeanLedger(LEAN_CORRECTION_ROUTES[route].store)
  if (!("route" in ledger.allocation) || ledger.allocation.route !== route || ledger.allocation.sourceRoot !== request.sourceRoot || ledger.allocation.reviewRoot !== request.reviewRoot || ledger.allocation.planRoot !== request.planRoot || ledger.allocation.reuseGrantRoot !== reuse.grant.root || ledger.allocation.diagnosisRoot !== (request.diagnosis?.root ?? null) || !same(ledger.allocation.requestRoots, request.requestRoots) || !same(ledger.allocation.candidateRoots, [...request.candidateRoots].sort())) return fail("ALLOCATION")
  return { request, reuse, ledger, allocation: ledger.allocation }
}
export const runLeanCorrectionChildBody = async (path: string, route: LeanCorrectionRoute) => {
  scope(route)
  const { request, reuse, ledger, allocation } = allocationFor(path, route), entry = readLeanChildEntry(ledger)
  const head = () => execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", maxBuffer: 128 }).trim()
  const committed = execFileSync("git", ["show", `HEAD:${LEAN_CORRECTION_ROUTES[route].allocation}`], { maxBuffer: 262144 })
  if (leanBytesRoot(committed) !== leanBytesRoot(leanCanonicalBytes(allocation))) return fail("UNCOMMITTED_ALLOCATION")
  assertLeanEntryBinding(entry, { head: head(), sourceRoot: request.sourceRoot, requestBytesRoot: leanBytesRoot(readLeanCorrectionPrivateBytes(path)), allocationRoot: allocation.root, parentPid: process.ppid, childPid: process.pid, intervalStartMs: readLeanTimeAccounting(ledger).starts.get("pilot-entry") ?? -1 })
  const parent = createLeanParentObservationGuard(entry.parentPid)
  const disconnect = () => { parent.disconnect(); process.exit(1) }; process.once("disconnect", disconnect)
  let highWater = 0
  const checkpoint = () => {
    parent.assert()
    highWater = Math.max(highWater, assertLeanBaselinePrefixCapacity(ledger, entry.parentPid))
    const free = statfsSync(ledger.directory, { bigint: true }); const freeBytes = free.bavail * free.bsize
    if (freeBytes > BigInt(Number.MAX_SAFE_INTEGER)) return fail("CAPACITY")
    const rss = Number(execFileSync("ps", ["-o", "rss=", "-p", String(entry.parentPid)], { encoding: "utf8", timeout: 1000, maxBuffer: 128 }).trim()) * 1024
    highWater = Math.max(highWater, assertLeanCorrectionResources({ elapsedMs: currentLeanElapsedMs(ledger), charged: readLeanLedger(ledger).charged, physicalBytes: cumulativeLeanPhysicalBytes(ledger), childRss: Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024), parentRss: rss, freeBytes: Number(freeBytes), availableMemoryBytes: observeLeagueAvailableMemoryBytes() }))
    parent.assert()
  }
  const dispatch: Parameters<typeof executeLeanReusedCurrentPipeline>[0]["dispatch"] = async (slot, bottom, top, observedRole) => {
    if (head() !== entry.head || leanCorrectionSourceManifest().root !== entry.sourceRoot || leanBytesRoot(readLeanCorrectionPrivateBytes(path)) !== entry.requestBytesRoot) return fail("SOURCE_HOLD")
    checkpoint(); checkpointLeanResources(ledger, currentLeanElapsedMs(ledger), highWater, LEAN_EXTERNAL_SCRATCH_RESERVE)
    const before = readLeanCorrectionPrivateBytes(join(ledger.directory, "ledger.ndjson"), 1_048_576)
    const pair = leanBaselinePair({ ordinal: slot.ordinal, slot, priorLedgerBytesRoot: leanBytesRoot(before), priorLedgerByteLength: before.length, priorCharged: readLeanLedger(ledger).charged, bottom, top })
    publishLeanCorrection(join(ledger.directory, `pair-${slot.ordinal}.json`), pair, ledger)
    checkpoint()
    const fs = statfsSync(ledger.directory, { bigint: true }), free = fs.bavail * fs.bsize
    if (free > BigInt(Number.MAX_SAFE_INTEGER)) return fail("CAPACITY")
    const charge = chargeLeanSlot(ledger, slot, { freeBytes: Number(free), availableMemoryBytes: observeLeagueAvailableMemoryBytes() })
    const origins: Array<{ metadata: LeanCorrectionOriginMetadata; sourceRoot: LabRoot; seat: "bottom" | "top"; binding: unknown }> = []
    const execution = await runLeanBaselineMatch({ ledger, charge, slot, seed: request.seed, bottom, top, ...(observedRole === undefined ? {} : { observedRole }), checkpoint, register: parent.register, unregister: parent.unregister, correction: { reuse, ...(route === "diagnostic" ? { observe: (metadata: LeanCorrectionOriginMetadata, sourceRoot: LabRoot, seat: "bottom" | "top", binding: unknown) => { if (origins.length >= 2) return fail("ORIGIN_LIMIT"); origins.push({ metadata: validateLeanCorrectionOriginMetadata(metadata), sourceRoot, seat, binding }) } } : {}) } })
    retainLeanMatch(ledger, charge, execution.compact, execution.replayFrames)
    const { replayFrames: _frames, ...body } = execution, cell = { ...body, ordinal: slot.ordinal, slotRoot: slot.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot }
    const observationBody = { schemaVersion: "lean-baseline-observation-v1", pairRoot: pair.root, cell }
    publishLeanCorrection(join(ledger.directory, `observation-${slot.ordinal}.json`), { ...observationBody, root: labRoot("lean-baseline-observation-v1", observationBody) }, ledger)
    if (route === "diagnostic") {
      const originBody = { schemaVersion: "lean-correction-origin-envelope-v1", allocationRoot: allocation.root, sourceRoot: request.sourceRoot, pairRoot: pair.root, chargeRoot: charge.root, origins }
      publishLeanCorrection(join(ledger.directory, "correction-origin.json"), { ...originBody, root: labRoot("lean-correction-origin-envelope-v1", originBody) }, ledger)
    }
    checkpoint(); checkpointLeanResources(ledger, currentLeanElapsedMs(ledger), highWater, LEAN_EXTERNAL_SCRATCH_RESERVE)
    return cell
  }
  try {
    checkpoint()
    let pipeline: unknown
    if (route === "diagnostic") {
      const bottom = reuse.sources.find(s => s.role === "tactical-0") ?? fail("PAIR"), top = reuse.sources.find(s => s.role === "cold-opponent") ?? fail("PAIR")
      publishLeanReusedBaselineSource(ledger, bottom, reuse); publishLeanReusedBaselineSource(ledger, top, reuse)
      publishLeanCorrection(join(ledger.directory, "cold-reuse.json"), reuse, ledger)
      // Exact predecessor condition0/seed/Smoke state; no authoring, solver or feedback.
      const cell = await dispatch(allocation.slots[0]!, bottom, top)
      pipeline = { status: "diagnostic_only", cells: [{ ordinal: cell.ordinal, slotRoot: cell.slotRoot, compact: cell.compact }], training: null, holdoutOpened: false, formationMaterialized: false }
    } else {
      publishLeanCorrection(join(ledger.directory, "cold-reuse.json"), reuse, ledger)
      pipeline = await executeLeanReusedCurrentPipeline({ allocation, reuse, checkpoint, freezeSource: source => { checkpoint(); if (reuse.sources.some(s => s.root === source.root)) publishLeanReusedBaselineSource(ledger, source, reuse); else publishLeanBaselineSource(ledger, source); checkpoint() }, retainArtifact: (name, value) => { if (!/^(?:seal-metadata|cold-corpus|cold-reuse-grant|initial-proposals|initial-selection|initial-training|initial-analysis|response-work|response-node-receipts|response-training|current-analysis)\.json$/u.test(name)) return fail("ARTIFACT"); checkpoint(); publishLeanCorrection(join(ledger.directory, name), value, ledger); checkpoint() }, dispatch })
    }
    stopLeanLedger(ledger, route === "diagnostic" || (pipeline as { status: string }).status !== "current_baseline_complete" ? "failure" : "complete")
    const evidence = verifyLeanEvidence(ledger)
    const body = { schemaVersion: "lean-correction-result-v1", privacy: "private_offline", issued: false, route, allocationRoot: allocation.root, sourceRoot: request.sourceRoot, requestBytesRoot: entry.requestBytesRoot, head: entry.head, reuseGrantRoot: reuse.grant.root, pipeline, evidenceRoot: evidence.root, cumulativeCharged: evidence.charged, holdoutOpened: false, formationMaterialized: false, phaseComplete: false }
    publishLeanCorrection(join(ledger.directory, "result.json"), { ...body, root: labRoot("lean-correction-result-v1", body) }, ledger)
    return { issued: false, route, status: "closed_pending_unique_check" }
  } finally { process.removeListener("disconnect", disconnect); parent.disconnect() }
}
const child = async (path: string, route: LeanCorrectionRoute) => {
  scope(route)
  if (!process.send || !process.connected) return fail("PARENT_LOST")
  process.send({ ready: process.pid })
  const token = await new Promise<string>((done, reject) => {
    const timer = setTimeout(() => reject(new TypeError("LEAN_CORRECTION_RELEASE")), 30000)
    process.once("message", message => { clearTimeout(timer); if (!exactLabKeys(message, ["release"]) || typeof (message as { release: unknown }).release !== "string") reject(new TypeError("LEAN_CORRECTION_RELEASE")); else done((message as { release: string }).release) })
  })
  const ledger = openLeanLedger(LEAN_CORRECTION_ROUTES[route].store)
  admitLeanChildRelease(readLeanChildEntry(ledger), token, process.pid, process.ppid)
  return runLeanCorrectionChildBody(path, route)
}
export const leanCorrectionMain = async (args: readonly string[]) => {
  const command = parseLeanCorrectionCommand(args), { route, request: path } = command
  if (command.mode.startsWith("prepare-")) return prepareLeanCorrection(path, route)
  if (command.mode.startsWith("verify-")) { scope(route); const { verifyLeanCorrectionRetained } = await import("./lib/v1-38-lean-correction-retained.js"); return verifyLeanCorrectionRetained(path, route) }
  const carrier = beginLeanCorrectionAdmission(route, "run")
  let accountingLedger: LeanExperimentLedger | null = null
  try {
  scope(route)
  accountingLedger = openLeanLedger(LEAN_CORRECTION_ROUTES[route].store)
  const { request, ledger, allocation } = allocationFor(path, route)
  accountingLedger = ledger
  if (!same(allocation.predecessor, inspectLeanCorrectionPredecessor(route, carrier.root))) return fail("PREDECESSOR_DRIFT")
  return await runLeanBoundedParent({ ledger, requestPath: path, allocationPath: LEAN_CORRECTION_ROUTES[route].allocation, store: resolve(LEAN_CORRECTION_ROUTES[route].store), sourceRoot: request.sourceRoot, manifestRoot: () => leanCorrectionSourceManifest().root, childMode: `child-${route}`, prospectiveStart: carrier, beforeRelease: () => { assertLeanCorrectionAdmissionTime(readLeanTimeAccounting(ledger).closedElapsedMs, carrier) }, terminalReserveMs: LEAN_CORRECTION_RESERVE.cleanupMs + LEAN_CORRECTION_RESERVE.terminalMs + LEAN_CORRECTION_RESERVE.checkMs + LEAN_CORRECTION_RESERVE.replayMs })
  } finally { closeLeanCorrectionAdmission(carrier, accountingLedger) }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2), childRoute = args[0] === "child-diagnostic" ? "diagnostic" : args[0] === "child-baseline" ? "baseline" : null
  const action = childRoute !== null && args.length === 3 && args[1] === "--request" && args[2] === LEAN_CORRECTION_ROUTES[childRoute].request ? child(args[2], childRoute) : leanCorrectionMain(args)
  if (childRoute) void resolveLeanChildCliTerminal(action)
  else void action.then(value => process.stdout.write(`${JSON.stringify(value)}\n`)).catch(() => { process.stderr.write("LEAN_CORRECTION_FAILED_DETAILS_WITHHELD\n"); process.exitCode = 1 })
}
