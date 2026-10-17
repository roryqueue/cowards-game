/** Prospective current-only private baseline entry. Importing this module is inert. */
import { readLeanContinuationExpectedObservations } from "./lib/v1-38-lean-continuation-observations.js"
import { constants, closeSync, fsyncSync, fchmodSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync, statfsSync, mkdirSync, existsSync } from "node:fs"
import { fork, execFileSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { dirname, join, resolve, relative } from "node:path"
import { pathToFileURL } from "node:url"
import { isLeanPostV13FivePairMode, isLeanPreparationContinuationMode, isLeanSupervisorRetestMode, isLeanResourceWindowModeV15, leanCapsForAllocation, leanSupervisorAllocationMode, type AnyLeanAllocation } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { exactLabKeys, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createLeanCurrentBaselineAllocation, createLeanLedger, openLeanLedger, readLeanAdmittedContinuationAllocationV2, leanAdmittedContinuationCapacityBasisV2, leanHostIsProxy, leanHostIsNativeError, readLeanLedger, readLeanTimeAccounting, readLeanChildEntry, publishLeanChildEntry, beginLeanInterval, chargeLeanSlot, retainLeanMatch, checkpointLeanResources, stopLeanLedger, verifyLeanEvidence, deriveLeanChildTerminal, publishLeanChildTerminal, cumulativeLeanPhysicalBytes, assertLeanPublicationCapacity, currentLeanElapsedMs, currentBaselineSlotKind, leanCanonicalBytes, leanBytesRoot, writeLeanAll, LEAN_BASELINE_REQUEST, LEAN_BASELINE_STORE, LEAN_BASELINE_WRITABLE_PATHS, LEAN_CAPS, LEAN_EXTERNAL_SCRATCH_RESERVE, type LeanExperimentLedger, type LeanChildEntryV2, type LeanSlot } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { observeLeagueAvailableMemoryBytes } from "./run-v1-38-serious-league.js"
import { factoryAssessmentImplementationManifest } from "./v1-38-factory-implementation.js"
import { assessLeanPrefixCapacity, createLeanParentObservationGuard, admitLeanChildRelease, assertLeanEntryBinding, readLeanSafeFile } from "./run-v1-38-lean-experiment.js"
import { leanResourcePolicyForAllocationV15 } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { leanMemoryLimitForAllocation } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { executeLeanCurrentPipeline, leanColdProcedureRoot, compactLeanBaselineCell } from "./lib/v1-38-lean-baseline-pipeline.js"
import { publishLeanBaselineSource } from "./lib/v1-38-lean-baseline-source.js"
import { runLeanBaselineMatch } from "./lib/v1-38-lean-baseline-match.js"
import { isLeanChildFailureReceipt, isLeanChildFailureReceiptV7, publishChildTerminalAfterOptionalReceipt, resolveLeanChildCliTerminal, type LeanChildFailureReceipt, type LeanChildFailureReceiptV7 } from "./lib/v1-38-lean-child-cli-terminal.js"
import { createLeanBaselineContinuationAllocation, validateLeanBaselineContinuationAllocation, LEAN_BASELINE_CONTINUATION_PATHS as CONTINUATION, LEAN_BASELINE_CONTINUATION_WINDOW as CONTINUATION_WINDOW, measureLeanPhysicalBytes, type LeanBaselineContinuationAllocation } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { createLeanContinuationIdentityGuard, authenticateLeanContinuationPinnedSource, authenticateLeanBaselineContinuationCarry, assertLeanBaselineContinuationFrontier, assertLeanContinuationDirectParent, readLeanContinuationBytes, readLeanContinuationJson, type LeanContinuationInventoryRow } from "./lib/v1-38-lean-baseline-continuation.js"
import { executeLeanBaselineContinuationPipeline } from "./lib/v1-38-lean-baseline-pipeline.js"
import { publishLeanBaselineContinuationSource } from "./lib/v1-38-lean-baseline-source.js"
import { runLeanBaselineContinuationMatch } from "./lib/v1-38-lean-baseline-match.js"
import { readLeanBaselineContinuationGit } from "./lib/v1-38-lean-container-match-session.js"
import { closeLeanInterval } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { LEAN_BASELINE_CONTINUATION_PATHS_V2 as CONTINUATION_V2, LEAN_BASELINE_CONTINUATION_PATHS_V4, LEAN_BASELINE_CONTINUATION_PATHS_V5, LEAN_BASELINE_CONTINUATION_PATHS_V6, LEAN_BASELINE_CONTINUATION_PATHS_V7, LEAN_BASELINE_CONTINUATION_PATHS_V8, LEAN_BASELINE_CONTINUATION_PATHS_V9, leanBaselineContinuationPathsForWindowV2, leanBaselineContinuationPathsForRequestV2, LEAN_BASELINE_CONTINUATION_POLICY_V2, validateLeanBaselineContinuationWindowV2, validateLeanBaselineContinuationAllocationV2, createLeanBaselineContinuationAllocationV2, leanBaselineContinuationElapsedFloorV2, leanContinuationGlobalFloorV2, leanContinuationIdentityV2, type LeanBaselineContinuationWindowV2, type LeanBaselineContinuationAllocationV2 } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { readLeanContinuationBoundedBytesV2, readLeanContinuationJsonV2, authenticateLeanBaselineContinuationCarryV2, assertLeanBaselineContinuationFrontierV2, createLeanContinuationIdentityGuardV2, createLeanContinuationStageControllerV6, type LeanContinuationStageV6, type LeanContinuationInventoryRowV2, type LeanContinuationReviewedRowV2 } from "./lib/v1-38-lean-baseline-continuation.js"
import { createLeanContinuationBoundaryControllerV8, createLeanContinuationOwnedMeasurementV8, createLeanContinuationReservationAccountingV8, measureLeanContinuationKnownDisjointBytesV8, LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V8, LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V9 } from "./lib/v1-38-lean-baseline-continuation.js"
import { readLeanBaselineContinuationGitV2 } from "./lib/v1-38-lean-container-match-session.js"
import { executeLeanBaselineContinuationPipelineV2 } from "./lib/v1-38-lean-baseline-pipeline.js"
import { publishLeanBaselineContinuationSourceV2 } from "./lib/v1-38-lean-baseline-source.js"
import { runLeanBaselineContinuationMatchV2 } from "./lib/v1-38-lean-baseline-match.js"

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
export const LEAN_SUPERVISOR_SAMPLING_OPERATIONS_V2 = Object.freeze(["none", "child_rss", "parent_rss", "time_budget", "threshold_kill", "unknown"] as const)
export type LeanSupervisorSamplingOperationV2 = typeof LEAN_SUPERVISOR_SAMPLING_OPERATIONS_V2[number]
export interface LeanSupervisorReasonEnvelopeV2 extends Omit<LeanSupervisorReasonEnvelope, "schemaVersion" | "observations"> {
  schemaVersion: "lean-parent-supervisor-reasons-v2"
  observations: LeanSupervisorReasonEnvelope["observations"] & {
    resourceSamplingOperation: LeanSupervisorSamplingOperationV2
    resourceSamplingSequence: number
    resourceSamplingExitObserved: boolean
  }
}
/** A distinct root domain; legacy v1 remains strict and rejects this schema. */
export const leanSupervisorReasonRootV2 = (value: Omit<LeanSupervisorReasonEnvelopeV2, "root"> | LeanSupervisorReasonEnvelopeV2): LabRoot => {
  const { root: _ignored, ...body } = value as LeanSupervisorReasonEnvelopeV2
  return labRoot("lean-parent-supervisor-reasons-v2", body)
}
export const isLeanSupervisorReasonEnvelopeV2 = (value: unknown): value is LeanSupervisorReasonEnvelopeV2 => {
  if (!value || typeof value !== "object" || !exactLabKeys(value, ["schemaVersion", "allocationRoot", "sourceRoot", "requestBytesRoot", "entryBytesRoot", "head", "parentPid", "childPid", "exitCode", "signal", "uncertain", "reasons", "observations", "root"])) return false
  const v = value as unknown as LeanSupervisorReasonEnvelopeV2, o = v.observations
  if (v.schemaVersion !== "lean-parent-supervisor-reasons-v2" || !o || !exactLabKeys(o, ["entry", "childReady", "resourceSampling", "finalIdentity", "failureReceipt", "cleanup", "terminalization", "initiatingCause", "resourceSamplingOperation", "resourceSamplingSequence", "resourceSamplingExitObserved"])) return false
  const { resourceSamplingOperation, resourceSamplingSequence, resourceSamplingExitObserved, ...legacyObservations } = o
  if (!LEAN_SUPERVISOR_SAMPLING_OPERATIONS_V2.includes(resourceSamplingOperation) || !Number.isInteger(resourceSamplingSequence) || resourceSamplingSequence < 0 || resourceSamplingSequence > 2147483647 || typeof resourceSamplingExitObserved !== "boolean") return false
  if (o.resourceSampling === "exception" ? resourceSamplingOperation === "none" || resourceSamplingSequence === 0 : resourceSamplingOperation !== "none" || resourceSamplingSequence !== 0 || resourceSamplingExitObserved !== false) return false
  const { root: _ignored, ...body } = v
  const legacyBody = { ...body, schemaVersion: "lean-parent-supervisor-reasons-v1" as const, observations: legacyObservations }
  // Reuse all v1 identity/reason consistency checks without accepting v2 as v1.
  try {
    if (!isLeanSupervisorReasonEnvelope({ ...legacyBody, root: labRoot("lean-parent-supervisor-reasons-v1", legacyBody) })) return false
    return v.root === leanSupervisorReasonRootV2(v) && leanCanonicalBytes(v).length <= LEAN_SUPERVISOR_REASON_MAX_BYTES
  } catch { return false }
}
export const validateLeanSupervisorReasonBytesV2 = (bytes: Uint8Array): LeanSupervisorReasonEnvelopeV2 => {
  if (!(bytes instanceof Uint8Array) || bytes.length > LEAN_SUPERVISOR_REASON_MAX_BYTES) return fail("SUPERVISOR_REASONS_V2")
  let value: unknown
  try { value = JSON.parse(Buffer.from(bytes).toString("utf8")) } catch { return fail("SUPERVISOR_REASONS_V2") }
  if (!isLeanSupervisorReasonEnvelopeV2(value) || leanBytesRoot(bytes) !== leanBytesRoot(leanCanonicalBytes(value))) return fail("SUPERVISOR_REASONS_V2")
  return value
}
/** Select only after allocation authentication; caller flags cannot widen legacy custody. */
export const leanParentUsesReasonV2 = (allocation: AnyLeanAllocation): boolean => {
  leanCapsForAllocation(allocation)
  const mode = leanSupervisorAllocationMode(allocation)
  return isLeanSupervisorRetestMode(mode) || isLeanPreparationContinuationMode(mode) || isLeanPostV13FivePairMode(mode) || isLeanResourceWindowModeV15(mode)
}
/** Actual parent's pure reason producer, also exercised by inert custody regressions. */
export const deriveLeanParentSupervisorReason = (allocation: AnyLeanAllocation, body: Omit<LeanSupervisorReasonEnvelope, "root">, sampling?: Pick<LeanSupervisorReasonEnvelopeV2["observations"], "resourceSamplingOperation" | "resourceSamplingSequence" | "resourceSamplingExitObserved">): LeanSupervisorReasonEnvelope | LeanSupervisorReasonEnvelopeV2 => {
  if (body.allocationRoot !== allocation.root) return fail("SUPERVISOR_REASONS")
  if (leanParentUsesReasonV2(allocation)) {
    const v2Body: Omit<LeanSupervisorReasonEnvelopeV2, "root"> = { ...body, schemaVersion: "lean-parent-supervisor-reasons-v2", observations: { ...body.observations, ...(sampling ?? { resourceSamplingOperation: "none" as const, resourceSamplingSequence: 0, resourceSamplingExitObserved: false }) } }
    const envelope = { ...v2Body, root: leanSupervisorReasonRootV2(v2Body) }
    if (!isLeanSupervisorReasonEnvelopeV2(envelope)) return fail("SUPERVISOR_REASONS")
    return envelope
  }
  const envelope = { ...body, root: labRoot("lean-parent-supervisor-reasons-v1", body) }
  if (!isLeanSupervisorReasonEnvelope(envelope)) return fail("SUPERVISOR_REASONS")
  return envelope
}
/** Saturation is local ordering only, not an elapsed clock or native cause. */
export const nextLeanSupervisorSamplingSequenceV2 = (sequence: number): number => {
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > 2147483647) return fail("SUPERVISOR_SEQUENCE_V2")
  return Math.min(2147483647, sequence + 1)
}
const SOURCE_PATHS = readLeanContinuationExpectedObservations().sourcePaths

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
  if (args.length === 3 && ["prepare-continuation-v2", "run-continuation-v2", "verify-continuation-v2"].includes(args[0]!) && args[1] === "--request" && (args[2] === CONTINUATION_V2.request || args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V4.request || args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V5.request || (args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V6.request || args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V7.request || (args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V8.request || args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V9.request)))) return { mode: args[0] as "prepare-continuation-v2" | "run-continuation-v2" | "verify-continuation-v2", request: args[2] }
  if (args.length !== 3 || !["prepare-current", "run-current", "verify-retained", "prepare-continuation", "run-continuation", "verify-continuation"].includes(args[0]!) || args[1] !== "--request" || !args[2] || args[2].startsWith("--") || args[0]!.endsWith("-continuation") && args[2] !== CONTINUATION.request) return fail("ARGUMENTS")
  return { mode: args[0] as "prepare-current" | "run-current" | "verify-retained" | "prepare-continuation" | "run-continuation" | "verify-continuation", request: args[2]! }
}
export const assertLeanBaselineWritableScope = (scope: { cacheDisabled?: string; compileDisabled?: string; nodeOptions?: string; compileCache?: string; warningRedirect?: string; coverage?: string; tempDirectory?: string }, coreSoftLimit: string): void => {
  if (scope.cacheDisabled !== "1" || scope.compileDisabled !== "1" || scope.nodeOptions !== undefined || scope.compileCache !== undefined || scope.warningRedirect !== undefined || scope.coverage !== undefined || scope.tempDirectory !== TEMP || coreSoftLimit.trim() !== "0") return fail("WRITABLE_SCOPE")
}
const coreSoftLimit = () => execFileSync("sh", ["-c", "ulimit -c"], { encoding: "utf8", timeout: 1000, maxBuffer: 128 })
const requireScope = () => assertLeanBaselineWritableScope({ cacheDisabled: process.env.TSX_DISABLE_CACHE, compileDisabled: process.env.NODE_DISABLE_COMPILE_CACHE, nodeOptions: process.env.NODE_OPTIONS, compileCache: process.env.NODE_COMPILE_CACHE, warningRedirect: process.env.NODE_REDIRECT_WARNINGS, coverage: process.env.NODE_V8_COVERAGE, tempDirectory: process.env.TMPDIR }, coreSoftLimit())
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
export const assessLeanBaselineObservedPrefixCapacityV15 = (m: Parameters<typeof assessLeanPrefixCapacity>[0], allocation: LeanExperimentLedger["allocation"]): number => {
  const policy = leanResourcePolicyForAllocationV15(allocation)
  if (!policy) return fail("PREFIX_CAPACITY")
  return assessLeanPrefixCapacity(m, policy.guardBytes, allocation)
}
export const assertLeanBaselinePrefixCapacity = (ledger: LeanExperimentLedger, parentPid: number, reserveBytes = 320 * 1024 * 1024): number => {
  if (process.ppid !== parentPid || !process.connected) return fail("PARENT_LOST")
  const childRss = Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024), parentRss = rssOf(parentPid)
  if (process.ppid !== parentPid || !process.connected) return fail("PARENT_LOST")
  const fs = statfsSync(ledger.directory, { bigint: true }), free = fs.bavail * fs.bsize
  if (free > BigInt(Number.MAX_SAFE_INTEGER)) return fail("PREFIX_CAPACITY")
  return assessLeanPrefixCapacity({ childRss, parentRss, freeBytes: Number(free), allocatedBytes: cumulativeLeanPhysicalBytes(ledger), elapsedMs: currentLeanElapsedMs(ledger) }, reserveBytes, ledger.allocation)
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
interface LeanContinuationIpcV8 {
  pid: number; ppid: number; connected: boolean
  on(event: string, listener: (...args: any[]) => void): unknown
  off(event: string, listener: (...args: any[]) => void): unknown
  send?(message: unknown): unknown
}
const continuationOwnedFailuresV2 = new WeakMap<object, Readonly<LeanChildFailureReceipt>>()
const continuationOwnedFailureV2 = (code: "HANDSHAKE" | "PARENT_LOST" | "CHILD_PARENT") => {
  const error = new TypeError(`LEAN_CONTINUATION_${code}`)
  continuationOwnedFailuresV2.set(error, Object.freeze({ type: "lean-child-failure", schemaVersion: "lean-child-failure-v1", code, stage: code === "CHILD_PARENT" ? "preflight" : "handshake" }))
  return error
}
interface LeanContinuationCliChildV2 { connected: boolean; exitCode?: number | string | null | undefined; disconnect(): void; send?(message: LeanChildFailureReceipt, callback?: (error: Error | null) => void): unknown }
/** Only exact driver-minted errors carry categories. No hostile field is read. */
export const resolveLeanContinuationChildCliTerminalV2 = async (action: Promise<unknown>, child: LeanContinuationCliChildV2 = process): Promise<void> => {
  let exit: 0 | 1 = 0
  try { await action } catch (error) {
    exit = 1
    process.stderr.write("LEAN_BASELINE_FAILED_DETAILS_WITHHELD\n")
    const trusted = error !== null && typeof error === "object" ? continuationOwnedFailuresV2.get(error) : undefined
    if (error !== null && typeof error === "object") continuationOwnedFailuresV2.delete(error)
    const receipt: LeanChildFailureReceipt = trusted ?? { type: "lean-child-failure", schemaVersion: "lean-child-failure-v1", code: "UNKNOWN_INTERNAL_FAILURE", stage: "unknown" }
    if (child.connected && child.send) await new Promise<void>(done => {
      const timer = setTimeout(done, 250)
      const finish = () => { clearTimeout(timer); done() }
      try { child.send!(receipt, finish) } catch { finish() }
    })
  } finally { child.exitCode = exit; if (child.connected) { try { child.disconnect() } catch { child.exitCode = 1 } } }
}
type ContinuationReaderDiagnosticStageV2 = "INITIAL_WINDOW" | "CONTEXT_OPEN" | "IMPORT" | "REUSE_WINDOW_TERMINAL" | "ENTRY_PID_CONTEXT" | "READER_INTERVAL" | "CLAIM" | "EVIDENCE_RESULT" | "TERMINAL" | "PUBLICATION"
const continuationReaderFailuresV2 = new WeakMap<object, ContinuationReaderDiagnosticStageV2>()
export const leanBaselineContinuationReaderFailureV2 = (error: unknown): string => `LEAN_BASELINE_VERIFY stage=${error !== null && typeof error === "object" ? continuationReaderFailuresV2.get(error) ?? "UNKNOWN" : "UNKNOWN"} code=DETAILS_WITHHELD\n`
const ownContinuationControlV8 = (value: unknown, keys: readonly string[]): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || leanHostIsProxy(value)) return
  const fields = Object.getOwnPropertyDescriptors(value)
  if (Reflect.ownKeys(fields).length !== keys.length || keys.some(key => !fields[key] || !("value" in fields[key]!))) return
  return Object.fromEntries(keys.map(key => [key, fields[key]!.value]))
}
/** Non-authorizing coordination only. The caller retains entry/token admission.
 * checkWindow is the existing absolute window/frontier, never a fresh duration. */
export const waitLeanContinuationReleaseV8 = (checkWindow: () => void, host: LeanContinuationIpcV8 = process) => new Promise<string>((accept, reject) => {
  const expectedParent = host.ppid
  let armed = false, settled = false, releaseTimer: ReturnType<typeof setTimeout> | undefined
  let stagingTimer: ReturnType<typeof setInterval> | undefined
  const cleanup = () => { if (releaseTimer !== undefined) clearTimeout(releaseTimer); if (stagingTimer !== undefined) clearInterval(stagingTimer); host.off("message", message); host.off("disconnect", disconnected) }
  const refuse = (code: "HANDSHAKE" | "PARENT_LOST") => { if (settled) return; settled = true; cleanup(); reject(continuationOwnedFailureV2(code)) }
  const check = () => { if (!host.connected || host.ppid !== expectedParent) { refuse("PARENT_LOST"); return false }; try { checkWindow(); return true } catch { refuse("HANDSHAKE"); return false } }
  const disconnected = () => refuse("PARENT_LOST")
  const message = (value: unknown) => {
    if (settled || !check()) return
    if (!armed) {
      const arm = ownContinuationControlV8(value, ["armRelease"])
      if (!arm || typeof arm.armRelease !== "string" || !/^[a-f0-9]{64}$/u.test(arm.armRelease)) { refuse("HANDSHAKE"); return }
      armed = true
      releaseTimer = setTimeout(() => refuse("HANDSHAKE"), 30000)
      try { host.send?.({ releaseArmed: host.pid, nonce: arm.armRelease }) } catch { refuse("PARENT_LOST") }
      return
    }
    const release = ownContinuationControlV8(value, ["release"])
    if (!release || typeof release.release !== "string" || !/^[a-f0-9]{64}$/u.test(release.release)) { refuse("HANDSHAKE"); return }
    settled = true; cleanup(); accept(release.release)
  }
  host.on("message", message); host.on("disconnect", disconnected)
  stagingTimer = setInterval(check, 250)
  if (!check()) return
  try { if (!host.send) { refuse("PARENT_LOST"); return }; host.send({ ready: host.pid }) } catch { refuse("PARENT_LOST") }
})
export const coordinateLeanContinuationParentV8 = (child: ReturnType<typeof fork>, deadline: number, checkWindow: () => void) => {
  const acceptedControls = new WeakSet<object>()
  let phase: "ready" | "staging" | "armed" | "released" = "ready", nonce: string | undefined, failure: unknown
  let readyResolve!: () => void, readyReject!: (error: unknown) => void, armedResolve!: () => void, armedReject!: (error: unknown) => void
  const ready = new Promise<void>((a, b) => { readyResolve = a; readyReject = b }), armed = new Promise<void>((a, b) => { armedResolve = a; armedReject = b })
  void ready.catch(() => {}); void armed.catch(() => {})
  const refuse = () => { failure ??= continuationOwnedFailureV2("HANDSHAKE"); readyReject(failure); armedReject(failure); if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL") }
  const check = (fresh = true) => { if (failure) throw failure; if (!child.pid || !child.connected || child.exitCode !== null || child.signalCode !== null || Date.now() >= deadline) throw continuationOwnedFailureV2("PARENT_LOST"); if (fresh) checkWindow() }
  const message = (value: unknown) => {
    try {
      check(phase !== "armed")
      const r = ownContinuationControlV8(value, ["ready"])
      if (phase === "ready" && r?.ready === child.pid) { phase = "staging"; acceptedControls.add(value as object); readyResolve(); return }
      const a = ownContinuationControlV8(value, ["releaseArmed", "nonce"])
      if (phase === "armed" && a && a.releaseArmed === child.pid && a.nonce === nonce) { phase = "released"; acceptedControls.add(value as object); armedResolve(); return }
      // Failure receipts remain the existing handler's responsibility.
      refuse()
    } catch { refuse() }
  }
  const exited = () => { if (phase !== "released") refuse() }, disconnected = () => { if (phase !== "released") refuse() }
  child.on("message", message); child.on("exit", exited); child.on("error", disconnected); child.on("disconnect", disconnected)
  // Full guards already closed before arm. Do not let a queued poll consume
  // the child's independent release lifetime while its acknowledgement waits.
  const period = setInterval(() => { try { check(phase !== "armed") } catch { refuse() } }, 250)
  const timeout = setTimeout(refuse, Math.max(1, deadline - Date.now()))
  return { ready, check, async arm() { check(); if (phase !== "staging") throw continuationOwnedFailureV2("HANDSHAKE"); nonce = randomBytes(32).toString("hex"); phase = "armed"; child.send({ armRelease: nonce }); await armed; check(false) }, acceptsControl(value: unknown) { if (!value || typeof value !== "object" || !acceptedControls.has(value)) return false; acceptedControls.delete(value); return true }, close() { clearInterval(period); clearTimeout(timeout); child.off("message", message); child.off("exit", exited); child.off("error", disconnected); child.off("disconnect", disconnected) } }
}
/** Same parent IPC handler, independently exercisable without a subprocess. */
export const leanParentFailureReceiptHandler = (ledger: LeanExperimentLedger, childPid: number | undefined, accept: (receipt: LeanChildFailureReceipt | LeanChildFailureReceiptV7) => void, uncertain: (reason: "duplicate_failure_receipt" | "malformed_ipc") => void, acceptsControl?: (value: unknown) => boolean) => {
  let received = false
  return (message: unknown) => {
    if (acceptsControl?.(message)) return
    if (!acceptsControl && message !== null && typeof message === "object" && exactLabKeys(message, ["ready"]) && message.ready === childPid) return
    if (acceptsControl) { const safe = ownContinuationControlV8(message, ["type", "schemaVersion", "code", "stage"]); if (!safe) { uncertain("malformed_ipc"); return }; message = safe }
    let validReceipt: boolean
    const allocation = ledger.allocation
    if (["lean-correction-supervisor-diagnostic-allocation-v7", "lean-correction-supervisor-baseline-allocation-v7", "lean-correction-supervisor-diagnostic-allocation-v8", "lean-correction-supervisor-baseline-allocation-v8"].includes(allocation.schemaVersion) && "route" in allocation) {
      try {
        const state = readLeanLedger(ledger), charge = [...state.charges.values()].at(-1)
        validReceipt = !!charge && isLeanChildFailureReceiptV7(message, { route: allocation.route, allocationRoot: allocation.root, chargeRoot: charge.root, slotRoot: charge.slotRoot })
      } catch { validReceipt = false }
    } else validReceipt = isLeanChildFailureReceipt(message)
    if (!validReceipt || received) { uncertain(validReceipt ? "duplicate_failure_receipt" : "malformed_ipc"); return }
    received = true; accept(message as LeanChildFailureReceipt | LeanChildFailureReceiptV7)
  }
}
/** Actual parent admission/deadline consumer, independently testable with inert allocations. */
export const leanBoundedParentTimeBudget = (ledger: LeanExperimentLedger, terminalReserveMs = 0) => {
  const caps = leanCapsForAllocation(ledger.allocation)
  const elapsedMs = currentLeanElapsedMs(ledger)
  const retry = ledger.allocation.schemaVersion.endsWith("-v8")
  const reserveMs = retry ? Math.max(1_860_000, LEAN_CAPS.matchMs + terminalReserveMs) : 0
  if (retry && elapsedMs + reserveMs >= caps.elapsedMs) return fail("PREFIX_CAPACITY")
  return { elapsedMs, capMs: caps.elapsedMs, timeoutMs: Math.max(1, caps.elapsedMs - elapsedMs - terminalReserveMs) }
}
export const runLeanBoundedParent = async (options: { ledger: LeanExperimentLedger; requestPath: string; allocationPath: string; store: string; sourceRoot: LabRoot; manifestRoot: () => LabRoot; childMode: string; prospectiveStart?: { wallStartMs: number; monotonicStartNs: string }; beforeRelease?: () => void; stage?: <T>(kind: LeanContinuationStageV6, body: () => T) => T; beforeTerminal?: () => void; onFailure?: () => void; terminalReserveMs?: number; supervisorObservation?: true; onStage?: (stage: ContinuationRunStageV2) => void; onChildCreated?: () => void; onPreEntryCleanup?: (value: { childPid: number; exitCode: number | null; signal: string | null }) => void; writeReservation?: Pick<ReturnType<typeof createLeanContinuationLocalReservationV8>, "reserveWrite" | "completeWrite"> }) => {
  options.onStage?.("PARENT_IMPORT")
  const { ledger, requestPath, store: STORE } = options, allocation = ledger.allocation
  const boundaryV8 = allocation.schemaVersion === "lean-baseline-continuation-allocation-v2" && (allocation.window.routeNamespace === "20261015-v8" || allocation.window.routeNamespace === "20261017-v9")
  if (boundaryV8 && readLeanAdmittedContinuationAllocationV2(ledger) !== allocation) return fail("V8_PARENT_CONTEXT")
  // Allocation family is authenticated by the same strict caps/mode admission;
  // a legacy caller's opt-in flag can never select reason-v2.
  const reasonV2 = leanParentUsesReasonV2(allocation)
  const supervisorObservation = reasonV2 || options.supervisorObservation === true
  const committed = execFileSync("git", ["show", `HEAD:${options.allocationPath}`], { maxBuffer: 262144 })
  if (leanBytesRoot(committed) !== leanBytesRoot(leanCanonicalBytes(allocation)) || leanBytesRoot(committed) !== leanBytesRoot(safeBytes(options.allocationPath))) return fail("UNCOMMITTED_ALLOCATION")
  if (readLeanLedger(ledger).events.length || readLeanTimeAccounting(ledger).active || readLeanTimeAccounting(ledger).starts.has("pilot-entry") || readdirSync(STORE).some(name => ["entry.json", "child-terminal.json", "result.json", "entry-failure.json"].includes(name))) return fail("ALLOCATION_USED")
  const fixedHead = head(), fixedManifest = options.manifestRoot(), fixedRequest = requestBytesRoot(requestPath)
  if (fixedManifest !== options.sourceRoot) return fail("SOURCE_HOLD")
  options.beforeRelease?.()
  leanBoundedParentTimeBudget(ledger, options.terminalReserveMs ?? 0)
  const token = randomBytes(32).toString("hex")
  const effect = <T>(kind: LeanContinuationStageV6, body: () => T): T => { options.onStage?.(kind === "claim" ? "PARENT_CLAIM" : kind === "dispatch" ? "PARENT_DISPATCH" : kind === "terminal" ? "PARENT_TERMINAL" : "PARENT_IMPORT"); return options.stage ? options.stage(kind, body) : body() }
  const stagingDeadline = boundaryV8 ? Date.now() + leanBoundedParentTimeBudget(ledger, options.terminalReserveMs ?? 0).timeoutMs : 0
  let coordination: ReturnType<typeof coordinateLeanContinuationParentV8> | undefined
  let earlyExit: { code: number | null; signal: NodeJS.Signals | null } | undefined
  let spawned: ReturnType<typeof fork> | undefined, child: ReturnType<typeof fork>
  try { child = effect("import", () => { spawned = fork(resolve(process.argv[1] ?? fail("ENTRY_PATH")), [options.childMode, "--request", requestPath], { execArgv: process.execArgv, stdio: ["ignore", "ignore", "ignore", "ipc"] }); if (boundaryV8) { spawned.once("exit", (code, signal) => { earlyExit = { code, signal } }); coordination = coordinateLeanContinuationParentV8(spawned, stagingDeadline, () => { continuationWindowAdmissionV2(allocation.window, 36); options.beforeRelease?.(); const rss = rssOf(spawned!.pid!); if (process.memoryUsage().rss + rss + LEAN_EXTERNAL_SCRATCH_RESERVE + 320 * 1024 * 1024 > leanMemoryLimitForAllocation(allocation)) return fail("PREFIX_CAPACITY") }) }; return spawned }) }
  catch (error) {
    coordination?.close()
    // A rejected closing pass may follow a successful fork. Never lose the
    // unreleased child merely because the stage refused to return its handle.
    if (spawned && spawned.exitCode === null && spawned.signalCode === null) {
      spawned.once("error", () => {}) // Cleanup must not become an unhandled IPC error.
      const pending = new Promise<void>((done, reject) => { const timer = setTimeout(() => reject(new TypeError("LEAN_BASELINE_CHILD_CLEANUP_UNCERTAIN")), 30000); spawned!.once("exit", () => { clearTimeout(timer); done() }) })
      spawned.kill("SIGKILL"); await pending
    }
    throw error
  }
  options.onChildCreated?.()
  let entered = false, uncertain = false, childRssObservedBytes: number | null = null, childFailure: LeanChildFailureReceipt | LeanChildFailureReceiptV7 | null = null
  const reasons = new Set<LeanSupervisorReasonCode>()
  const observe = (reason: LeanSupervisorReasonCode) => { if (supervisorObservation) reasons.add(reason) }
  let exitEventObserved = false, samplingSequence = 0
  let samplingOperation: LeanSupervisorSamplingOperationV2 = "unknown"
  let firstSamplingException: { resourceSamplingOperation: LeanSupervisorSamplingOperationV2; resourceSamplingSequence: number; resourceSamplingExitObserved: boolean } | null = null
  const sample = <T>(operation: Exclude<LeanSupervisorSamplingOperationV2, "none" | "unknown">, run: () => T): T => {
    samplingSequence = nextLeanSupervisorSamplingSequenceV2(samplingSequence)
    samplingOperation = operation
    const value = run()
    samplingOperation = "unknown"
    return value
  }
  let finalIdentity: LeanSupervisorReasonEnvelope["observations"]["finalIdentity"] = "matched"
  const v6 = allocation.schemaVersion === "lean-baseline-continuation-allocation-v2" && (allocation.window.routeNamespace === "20261014-v6" || allocation.window.routeNamespace === "20261014-v7" || (allocation.window.routeNamespace === "20261015-v8" || allocation.window.routeNamespace === "20261017-v9"))
  let publishedEntry: LeanChildEntryV2 | undefined, observedExit: { code: number | null; signal: NodeJS.Signals | null } | undefined = earlyExit
  let terminalPublicationBegan = false, failureTerminalAttempted = false, terminalCallbackBegan = false
  let period: ReturnType<typeof setInterval> | undefined, timeout: ReturnType<typeof setTimeout> | undefined
  child.once("exit", (code: number | null, signal: NodeJS.Signals | null) => { exitEventObserved = true; observedExit = { code, signal } })
  const cleanupChild = async () => {
    if (observedExit) return observedExit
    const pending = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((done, reject) => {
      const timer = setTimeout(() => reject(new TypeError("LEAN_BASELINE_CHILD_CLEANUP_UNCERTAIN")), 30000)
      child.once("exit", (code, signal) => { clearTimeout(timer); done({ code, signal }) })
    })
    child.kill("SIGKILL"); return pending
  }
  const publishTerminal = (entry: LeanChildEntryV2, exit: { code: number | null; signal: NodeJS.Signals | null }) => {
    terminalPublicationBegan = true
    // A failure publisher is independent of the invalid source reservation.
    const writes = failureTerminalAttempted ? undefined : options.writeReservation
    for (const name of ["child-terminal.json", "time.ndjson", LEAN_SUPERVISOR_REASON_FILE, ...(childFailure ? ["entry-failure.json"] : [])]) writes?.reserveWrite(3 * 65536, join(STORE, name))
    const terminalFs = statfsSync(STORE, { bigint: true }), terminalFree = terminalFs.bavail * terminalFs.bsize
    return publishChildTerminalAfterOptionalReceipt(childFailure,
      receipt => exclusive(join(STORE, "entry-failure.json"), receipt, ledger),
      receiptUncertain => {
        if (receiptUncertain) { uncertain = true; observe("failure_receipt_publication_uncertain") }
        if (supervisorObservation) {
          try {
            const body: Omit<LeanSupervisorReasonEnvelope, "root"> = {
              schemaVersion: "lean-parent-supervisor-reasons-v1", allocationRoot: allocation.root, sourceRoot: options.sourceRoot,
              requestBytesRoot: fixedRequest, entryBytesRoot: leanBytesRoot(safeBytes(join(STORE, "entry.json"))), head: fixedHead,
              parentPid: process.pid, childPid: child.pid!, exitCode: exit.code, signal: exit.signal, uncertain,
              reasons: LEAN_SUPERVISOR_REASON_CODES.filter(reason => reasons.has(reason)),
              observations: { entry: "published", childReady: "observed", resourceSampling: reasons.has("resource_sampling_exception") ? "exception" : "observed", finalIdentity, failureReceipt: childFailure === null ? "absent" : receiptUncertain ? "publication_failed" : "published", cleanup: "child_exit_observed", terminalization: "unobserved", initiatingCause: "unknown" },
            }
            const envelope = deriveLeanParentSupervisorReason(allocation, body, firstSamplingException ?? undefined)
            exclusive(join(STORE, LEAN_SUPERVISOR_REASON_FILE), envelope, ledger)
          } catch { uncertain = true } // No retry or success override.
        }
        const derived = deriveLeanChildTerminal(ledger, entry, { exitCode: exit.code, signal: exit.signal, wallObservedMs: Date.now(), monotonicObservedNs: process.hrtime.bigint().toString(), status: exit.code === 0 && !uncertain && childFailure === null ? "child_exited" : "child_failed", parentRssBytes: process.memoryUsage().rss, childRssObservedBytes, physicalBytes: cumulativeLeanPhysicalBytes(ledger) + 65_536, freeBytes: terminalFree <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(terminalFree) : null })
        publishLeanChildTerminal(ledger, derived)
        for (const name of ["child-terminal.json", "time.ndjson", LEAN_SUPERVISOR_REASON_FILE, ...(childFailure ? ["entry-failure.json"] : [])]) writes?.completeWrite(join(STORE, name))
        return derived
      })
  }
  const publishFailureTerminal = (entry: LeanChildEntryV2, exit: { code: number | null; signal: NodeJS.Signals | null }) => {
    failureTerminalAttempted = true
    const guard = continuationFailureTerminalGuardV6(ledger, entry)
    guard(); const terminal = publishTerminal(entry, exit); guard(); return terminal
  }
  child.on("error", () => { uncertain = true; observe("child_error") })
  const failureHandler = leanParentFailureReceiptHandler(ledger, child.pid, receipt => { childFailure = receipt }, reason => { uncertain = true; observe(reason) }, coordination?.acceptsControl)
  child.on("message", failureHandler)
  try {
    options.onStage?.("PARENT_READY")
    if (coordination) { await coordination.ready; coordination.check() } else await waitLeanBoundedChildReady(child)
    if (!child.pid) return fail("CHILD_PID")
    childRssObservedBytes = rssOf(child.pid)
    if (process.memoryUsage().rss + childRssObservedBytes + LEAN_EXTERNAL_SCRATCH_RESERVE + 320 * 1024 * 1024 > leanMemoryLimitForAllocation(allocation)) return fail("PREFIX_CAPACITY")
    const fs = statfsSync(STORE, { bigint: true }), free = fs.bavail * fs.bsize
    if (free > BigInt(Number.MAX_SAFE_INTEGER) || free < BigInt(LEAN_CAPS.totalBytes - cumulativeLeanPhysicalBytes(ledger))) return fail("PREFIX_CAPACITY")
    options.beforeRelease?.()
    const entry: LeanChildEntryV2 = { schemaVersion: "lean-child-entry-v2", allocationRoot: allocation.root, sourceRoot: options.sourceRoot, requestBytesRoot: fixedRequest, head: fixedHead, parentPid: process.pid, childPid: child.pid, handshakeRoot: leanBytesRoot(Buffer.from(token, "hex")), wallStartMs: options.prospectiveStart?.wallStartMs ?? Date.now(), monotonicStartNs: options.prospectiveStart?.monotonicStartNs ?? process.hrtime.bigint().toString() }
    effect("claim", () => {
    options.writeReservation?.reserveWrite(3 * 262144, join(STORE, "entry.json")); options.writeReservation?.reserveWrite(16384, join(STORE, "time.ndjson"))
    publishLeanChildEntry(ledger, entry)
    options.writeReservation?.completeWrite(join(STORE, "entry.json"))
    publishedEntry = entry
    beginLeanInterval(ledger, "pilot-entry", entry.wallStartMs)
    options.writeReservation?.completeWrite(join(STORE, "time.ndjson"))
    entered = true
    if (!boundaryV8) child.send({ release: token })
    })
    if (coordination) { effect("dispatch", () => {}); coordination.check(); options.onStage?.("PARENT_RELEASE"); await coordination.arm(); coordination.check(false); child.send({ release: token }); coordination.close() }
    period = setInterval(() => {
      try {
        if (allocation.schemaVersion === "lean-baseline-continuation-allocation-v2") options.beforeRelease?.()
        const rss = sample("child_rss", () => rssOf(child.pid!))
        childRssObservedBytes = Math.max(childRssObservedBytes ?? 0, rss)
        if (sample("parent_rss", () => process.memoryUsage().rss) + rss + LEAN_EXTERNAL_SCRATCH_RESERVE + 320 * 1024 * 1024 > leanMemoryLimitForAllocation(allocation) || sample("time_budget", () => leanBoundedParentTimeBudget(ledger, options.terminalReserveMs ?? 0).elapsedMs >= leanCapsForAllocation(allocation).elapsedMs)) { uncertain = true; observe("resource_threshold"); sample("threshold_kill", () => child.kill("SIGKILL")) }
      } catch {
        if (!firstSamplingException) firstSamplingException = { resourceSamplingOperation: samplingOperation, resourceSamplingSequence: Math.max(1, samplingSequence), resourceSamplingExitObserved: exitEventObserved }
        uncertain = true; observe("resource_sampling_exception"); child.kill("SIGKILL")
      }
    }, 250)
    timeout = setTimeout(() => { uncertain = true; observe("deadline_timeout"); child.kill("SIGKILL") }, boundaryV8 ? Math.max(1, stagingDeadline - Date.now()) : leanBoundedParentTimeBudget(ledger, options.terminalReserveMs ?? 0).timeoutMs)
    const exit = observedExit ?? await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(resolveExit => child.once("exit", (code, signal) => resolveExit({ code, signal })))
    clearInterval(period); clearTimeout(timeout)
    options.onStage?.("PARENT_TERMINAL")
    terminalCallbackBegan = true; options.beforeTerminal?.()
    try { if (head() !== fixedHead || options.manifestRoot() !== fixedManifest || requestBytesRoot(requestPath) !== fixedRequest) { uncertain = true; observe("final_identity_mismatch"); finalIdentity = "mismatch" } } catch { uncertain = true; observe("final_identity_exception"); finalIdentity = "exception" }
    let terminal: ReturnType<typeof publishTerminal>
    if (v6 && uncertain) {
      // Source authority remains invalid. Observed child exit permits only a
      // nonaccepting terminal under independent current resource/accounting custody.
      terminal = publishFailureTerminal(entry, exit)
    } else {
      let began = false
      try { terminal = effect("terminal", () => { began = true; return publishTerminal(entry, exit) }) }
      catch (error) {
        if (!v6 || began) throw error // Never retry/overwrite partial publication.
        uncertain = true; observe("final_identity_exception"); finalIdentity = "exception"
        terminal = publishFailureTerminal(entry, exit)
      }
    }
    if (terminal.status !== "child_exited") return fail("CHILD_FAILED")
    return { issued: false, evidenceClass: "exploratory_current_only", status: "child_exited_pending_independent_verification", allocationRoot: allocation.root, terminalElapsedUpperBoundMs: terminal.elapsedUpperBoundMs }
  } catch (error) {
    if (v6) { try { options.onFailure?.() } catch { /* Failure remains nonaccepting. */ } }
    if (v6 && entered && publishedEntry && !terminalPublicationBegan && !failureTerminalAttempted) {
      const exit = await cleanupChild()
      if (!terminalCallbackBegan) { terminalCallbackBegan = true; try { options.beforeTerminal?.() } catch { /* Independent failure accounting does not need source authority. */ } }
      uncertain = true; observe("final_identity_exception"); finalIdentity = "exception"
      publishFailureTerminal(publishedEntry, exit)
    }
    throw error
  } finally {
    coordination?.close(); child.off("message", failureHandler)
    if (period !== undefined) clearInterval(period)
    if (timeout !== undefined) clearTimeout(timeout)
    if (options.prospectiveStart && child.exitCode === null && child.signalCode === null) {
      // Accounting closes only after bounded child cleanup, including a ready
      // timeout or a failed post-ready admission. Old parent behavior is intact.
      await cleanupChild()
    } else if (!entered && child.exitCode === null) child.kill("SIGKILL")
    if (!entered && options.onPreEntryCleanup && child.pid && (child.exitCode !== null || child.signalCode !== null)) options.onPreEntryCleanup({ childPid: child.pid, exitCode: child.exitCode, signal: child.signalCode })
  }
}
/** Independent failure evidence only; no HEAD/source acceptance or controller
 * resurrection. Called solely after this parent's actual child-exit observation. */
const continuationFailureTerminalGuardV6 = (ledger: LeanExperimentLedger, entry: LeanChildEntryV2) => {
  const allocation = readLeanAdmittedContinuationAllocationV2(ledger), paths = leanBaselineContinuationPathsForWindowV2(allocation.window)
  if ((paths !== LEAN_BASELINE_CONTINUATION_PATHS_V6 && paths !== LEAN_BASELINE_CONTINUATION_PATHS_V7 && (paths !== LEAN_BASELINE_CONTINUATION_PATHS_V8 && paths !== LEAN_BASELINE_CONTINUATION_PATHS_V9)) || entry.allocationRoot !== allocation.root) return fail("V6_FAILURE_TERMINAL_SCOPE")
  const reserve = (bytes = 0) => continuationCapacityV2(allocation.window, cumulativeLeanPhysicalBytes(ledger), CONTINUATION_V2_METADATA_PARSE_RESERVE + bytes + 16777216, true, ledger)
  const read = (path: string, maximum = 4194304, mode = 0o600) => readLeanContinuationBoundedBytesV2(path, maximum, mode, bytes => reserve(bytes ?? 0))
  const journal = read(join(ledger.directory, "ledger.ndjson")), timePrefix = read(join(ledger.directory, "time.ndjson"))
  return () => {
    reserve(); continuationStoreMembershipV2(ledger)
    for (const [path, mode] of [[paths.allocation, 0o644], [join(ledger.directory, "allocation.json"), 0o600]] as const) if (!read(path, 262144, mode).equals(Buffer.from(leanCanonicalBytes(allocation)))) return fail("V6_FAILURE_TERMINAL_ALLOCATION")
    if (!read(join(ledger.directory, "entry.json"), 262144).equals(Buffer.from(leanCanonicalBytes(entry))) || !read(join(ledger.directory, "ledger.ndjson")).equals(journal) || !read(join(ledger.directory, "time.ndjson")).subarray(0, timePrefix.length).equals(timePrefix)) return fail("V6_FAILURE_TERMINAL_PREFIX")
    const time = readLeanTimeAccounting(ledger), state = readLeanLedger(ledger)
    if (time.starts.size !== 2 || time.starts.get("pilot-entry") !== entry.wallStartMs || !time.closed.has("continuation-run-admission") || time.active === time.closed.has("pilot-entry")) return fail("V6_FAILURE_TERMINAL_TIME")
    const carry = readLeanContinuationJsonV2(join(ledger.directory, "carry.json"), 4194304, 0o600, bytes => reserve(bytes ?? 0)), rows = carry.inventory as LeanContinuationInventoryRowV2[]
    if (!Array.isArray(rows) || rows.length > 4096 || labRoot("lean-baseline-continuation-inventory-v2", rows) !== allocation.predecessor.inventoryRoot) return fail("V6_FAILURE_TERMINAL_CARRY")
    let growth = 0
    for (const row of rows) {
      reserve(); const path = resolve(row.path), stat = lstatSync(path)
      if (stat.isSymbolicLink() || stat.uid !== process.getuid?.() || stat.dev !== row.dev || stat.ino !== row.ino || (stat.mode & 0o777) !== row.mode || realpathSync(path) !== path || (row.kind === "directory" ? !stat.isDirectory() : !stat.isFile() || stat.nlink !== 1)) return fail("V6_FAILURE_TERMINAL_RESOURCE")
      if (stat.isDirectory()) {
        const allowed = new Set(row.members ?? [])
        for (const selected of [paths.request, paths.window, paths.allocation, paths.store, paths.temp]) { const prefix = path + "/", selectedPath = resolve(selected); if (selectedPath.startsWith(prefix)) allowed.add(selectedPath.slice(prefix.length).split("/")[0]!) }
        const members = readdirSync(path); if (members.some(name => !allowed.has(name)) || (row.members ?? []).some(name => !members.includes(name))) return fail("V6_FAILURE_TERMINAL_MEMBERS")
      }
      growth += Math.max(0, stat.blocks * 512 - row.allocatedBytes)
    }
    const usage = process.memoryUsage(), disk = statfsSync(ledger.directory, { bigint: true }), elapsed = process.hrtime.bigint() - BigInt(entry.monotonicStartNs)
    if (elapsed < 0n || elapsed > BigInt(Number.MAX_SAFE_INTEGER) * 1000000n || disk.bavail * disk.bsize > BigInt(Number.MAX_SAFE_INTEGER)) return fail("V6_FAILURE_TERMINAL_RESOURCE")
    assertLeanBaselineContinuationFrontierV2(allocation, { nowMs: Date.now(), monotonicElapsedMs: Math.max(0, entry.wallStartMs - allocation.window.anchorMs) + Number((elapsed + 999999n) / 1000000n), remainingSlots: 0, remainingClosureMs: 0, remainingOfflineMs: 0, charged: state.charged, retainedBytes: cumulativeLeanPhysicalBytes(ledger) + growth + 16777216, scratchBytes: measureLeanPhysicalBytes(paths.temp) + 16777216, parentRssBytes: Math.max(usage.rss, process.resourceUsage().maxRSS * 1024), childRssBytes: 0, arrayBuffersBytes: usage.arrayBuffers + 16777216, availableMemoryBytes: observeLeagueAvailableMemoryBytes(), freeBytes: Number(disk.bavail * disk.bsize), live: true }, ledger)
    reserve()
  }
}
const CONTINUATION_PHASE = ".planning/phases/265-serious-current-rules-league-and-development-red-team/"
export const LEAN_BASELINE_CONTINUATION_OWNED_PATHS = readLeanContinuationExpectedObservations().continuationOwnedPaths
export const LEAN_BASELINE_CONTINUATION_PLANNING_PATHS = readLeanContinuationExpectedObservations().continuationPlanningPaths
export const leanBaselineContinuationSourceManifest = () => {
  const source = new Map(leanBaselineSourceManifest().entries.filter(row => /^(?:packages|scripts)\//u.test(row.path) || ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json", "tsconfig.base.json"].includes(row.path)).map(row => [row.path, row]))
  for (const path of [...LEAN_BASELINE_CONTINUATION_OWNED_PATHS, ...readLeanContinuationExpectedObservations().continuationExtraPaths]) {
    source.set(path, { path, root: leanBytesRoot(readLeanContinuationBytes(path, 4194304)) })
  }
  const implementationEntries = [...source.values()].sort((a, b) => a.path.localeCompare(b.path))
  const planningEntries = LEAN_BASELINE_CONTINUATION_PLANNING_PATHS.map(path => ({ path, root: leanBytesRoot(readLeanContinuationBytes(path, 4194304)) })).sort((a, b) => a.path.localeCompare(b.path))
  const entries = [...implementationEntries, ...planningEntries].sort((a, b) => a.path.localeCompare(b.path))
  if (entries.length > 1024 || new Set(entries.map(e => e.path)).size !== entries.length || leanCanonicalBytes(entries).length > 4194304) return fail("CONTINUATION_MANIFEST_BOUND")
  return { entries, implementationEntries, planningEntries, root: labRoot("lean-baseline-continuation-implementation-v1", implementationEntries), planningRoot: labRoot("lean-baseline-continuation-planning-v1", planningEntries), manifestRoot: labRoot("lean-baseline-continuation-manifest-v1", entries) }
}
export const readLeanBaselineContinuationManifestRoot = (planningRoot: LabRoot, observe: () => { root: LabRoot; planningRoot: LabRoot } = leanBaselineContinuationSourceManifest): LabRoot => {
  const manifest = observe()
  if (manifest.planningRoot !== planningRoot) return fail("CONTINUATION_PLANNING_HOLD")
  return manifest.root
}
export interface LeanBaselineContinuationRequest {
  schemaVersion: "lean-baseline-continuation-request-v1"; seed: string; sourceHead: string; sourceRoot: LabRoot; planningRoot: LabRoot; planRoot: LabRoot; reviewRoot: LabRoot; coldRoot: LabRoot
  candidateRoots: readonly LabRoot[]; requestRoots: readonly LabRoot[]; offlineOverheadMs: number; sourceAuthor: string; runOperator: string; readerOperator: string
}
export const readLeanBaselineContinuationRequest = (path: string): LeanBaselineContinuationRequest => {
  if (path !== CONTINUATION.request) return fail("CONTINUATION_REQUEST_PATH")
  const r = readLeanContinuationJson(path, 65536, 0o600) as unknown as LeanBaselineContinuationRequest
  const manifest = leanBaselineContinuationSourceManifest()
  if (!exactLabKeys(r, ["schemaVersion", "seed", "sourceHead", "sourceRoot", "planningRoot", "planRoot", "reviewRoot", "coldRoot", "candidateRoots", "requestRoots", "offlineOverheadMs", "sourceAuthor", "runOperator", "readerOperator"]) || r.schemaVersion !== "lean-baseline-continuation-request-v1" || !/^[a-f0-9]{40}$/u.test(r.sourceHead) || r.sourceRoot !== manifest.root || r.planningRoot !== manifest.planningRoot || r.planRoot !== manifest.planningEntries.find(row => row.path.endsWith("265-16-BASELINE-CONTINUATION-PLAN-20261012.md"))?.root || r.reviewRoot !== manifest.planningEntries.find(row => row.path === CONTINUATION.gates)?.root || r.coldRoot !== leanColdProcedureRoot(r.seed) || !exact(r.candidateRoots, deriveLeanBaselineCandidateRoots(r.coldRoot)) || !exact(r.requestRoots, deriveLeanBaselineRequestRoots({ seed: r.seed, coldRoot: r.coldRoot, planRoot: r.planRoot, sourceRoot: r.sourceRoot })) || !Number.isSafeInteger(r.offlineOverheadMs) || r.offlineOverheadMs < 1 || r.offlineOverheadMs > 5340000 || [r.sourceAuthor, r.runOperator, r.readerOperator].some(id => typeof id !== "string" || !/^[A-Za-z0-9_./:-]{1,120}$/u.test(id)) || new Set([r.sourceAuthor, r.runOperator, r.readerOperator]).size !== 3) return fail("CONTINUATION_REQUEST")
  const gates = readLeanContinuationBytes(CONTINUATION.gates, 262144).toString("utf8")
  const field = (name: string) => gates.match(new RegExp(`^${name}: ([^\\n]+)$`, "mu"))?.[1]
  if (["plan_check", "source_review", "root_validation", "source_verification"].some(name => field(name) !== "passed") || field("commands_closed") !== "true" || field("source_root") !== r.sourceRoot || field("source_author") !== r.sourceAuthor || field("run_operator") !== r.runOperator || field("reader_operator") !== r.readerOperator || !field("source_reviewer") || !field("source_verifier") || new Set([r.sourceAuthor, field("source_reviewer"), field("source_verifier")]).size !== 3) return fail("CONTINUATION_GATES")
  return r
}
const continuationHead = () => readLeanBaselineContinuationGit(["rev-parse", "HEAD"]).toString("utf8").trim()
const continuationWindowGuard = (remaining: number, overhead: number) => {
  const now = Date.now()
  if (now < CONTINUATION_WINDOW.anchorMs || now + remaining * 600000 + CONTINUATION_WINDOW.reserveMs + overhead > CONTINUATION_WINDOW.deadlineMs) return fail("CONTINUATION_WINDOW")
}
const continuationPreAuthenticationCapacity = (retainedBytes = 0): void => {
  const usage = process.memoryUsage(), fs = statfsSync(resolve(CONTINUATION.temp), { bigint: true })
  const reserve = 2 * 268435456 + 512000000 + 335544320
  if (!Number.isSafeInteger(retainedBytes) || retainedBytes < 0 || retainedBytes > LEAN_CAPS.retainedBytes || usage.rss + (process.connected ? rssOf(process.ppid) : 0) + usage.arrayBuffers + reserve > CONTINUATION_WINDOW.memoryBytes || observeLeagueAvailableMemoryBytes() < reserve || fs.bavail * fs.bsize < BigInt(LEAN_CAPS.totalBytes - retainedBytes) || measureLeanPhysicalBytes(CONTINUATION.temp) > LEAN_CAPS.scratchBytes) return fail("CONTINUATION_PREAUTH_CAPACITY")
}
export const assertLeanBaselineContinuationScope = (): void => {
  if (process.env.TSX_DISABLE_CACHE !== "1" || process.env.NODE_DISABLE_COMPILE_CACHE !== "1" || ["NODE_OPTIONS", "NODE_COMPILE_CACHE", "NODE_REDIRECT_WARNINGS", "NODE_V8_COVERAGE"].some(key => process.env[key] !== undefined) || process.env.TMPDIR !== resolve(CONTINUATION.temp) || !process.execArgv.some((arg, i, args) => arg === "--import" && args[i + 1] === "tsx" || arg === "--import=tsx") || process.execArgv.some(arg => /(?:loader|inspect|require)/u.test(arg)) || coreSoftLimit().trim() !== "0") return fail("CONTINUATION_SCOPE")
  const stat = lstatSync(resolve(CONTINUATION.temp))
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid?.() || (stat.mode & 0o777) !== 0o700 || realpathSync(resolve(CONTINUATION.temp)) !== resolve(CONTINUATION.temp)) return fail("CONTINUATION_SCRATCH")
}
export const writeLeanContinuationArtifact = (ledger: LeanExperimentLedger, name: string, value: unknown, maximum: number): void => {
  // Estimate before allocating canonical serialization buffers. Recursive depth
  // and byte bounds deny hostile structures rather than truncating evidence.
  let size = 0
  const measure = (v: unknown, depth: number): void => { if (depth > 96) return fail("CONTINUATION_SERIALIZATION"); size += typeof v === "string" ? Buffer.byteLength(v) * 6 + 2 : 32; if (size > maximum * 6) return fail("CONTINUATION_SERIALIZATION"); if (Array.isArray(v)) for (const item of v) measure(item, depth + 1); else if (v && typeof v === "object") for (const [key, item] of Object.entries(v)) { size += Buffer.byteLength(key) * 6 + 4; measure(item, depth + 1) } }
  measure(value, 0)
  if (!/^[A-Za-z0-9_.-]+$/u.test(name) || maximum > 8388608) return fail("CONTINUATION_ARTIFACT")
  assertLeanPublicationCapacity(ledger, Math.min(size, maximum) * 3)
  const bytes = leanCanonicalBytes(value)
  if (bytes.length > maximum) return fail("CONTINUATION_ARTIFACT_SIZE")
  const path = join(ledger.directory, name), fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
  try { writeLeanAll(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) }
  const parent = openSync(ledger.directory, constants.O_RDONLY | constants.O_NOFOLLOW)
  try { fsyncSync(parent) } finally { closeSync(parent) }
}
/** Prepare is data-only and is never called by source tests. */
export const prepareLeanBaselineContinuation = (requestPath: string) => {
  assertLeanBaselineContinuationScope(); continuationWindowGuard(36, 1); continuationPreAuthenticationCapacity()
  const request = readLeanBaselineContinuationRequest(requestPath), manifest = leanBaselineContinuationSourceManifest()
  const guard = () => { continuationWindowGuard(36, request.offlineOverheadMs); if (continuationHead() !== request.sourceHead || leanBaselineContinuationSourceManifest().manifestRoot !== manifest.manifestRoot || leanBytesRoot(readLeanContinuationBytes(requestPath, 65536, 0o600)) !== requestRoot) return fail("CONTINUATION_HOLD") }
  const requestRoot = leanBytesRoot(readLeanContinuationBytes(requestPath, 65536, 0o600))
  guard()
  const pinnedPaths = manifest.entries.map(row => row.path)
  const streamGuard = () => { continuationWindowGuard(36, request.offlineOverheadMs); continuationPreAuthenticationCapacity(); if (continuationHead() !== request.sourceHead) return fail("CONTINUATION_HOLD") }
  for (const row of manifest.entries) authenticateLeanContinuationPinnedSource(row, request.sourceHead, pinnedPaths, readLeanBaselineContinuationGit, streamGuard)
  guard()
  const carried = authenticateLeanBaselineContinuationCarry(readLeanBaselineContinuationGit, manifest.entries.map(row => row.path), () => { continuationWindowGuard(36, request.offlineOverheadMs); continuationPreAuthenticationCapacity() })
  guard()
  const allocation = createLeanBaselineContinuationAllocation({ sourceRoot: request.sourceRoot, reviewRoot: request.reviewRoot, coldRoot: request.coldRoot, planRoot: request.planRoot, candidateRoots: request.candidateRoots, requestRoots: request.requestRoots, seed: request.seed, sourceHead: request.sourceHead, planningRoot: request.planningRoot, requestBytesRoot: requestRoot, offlineOverheadMs: request.offlineOverheadMs, predecessor: carried.carry })
  const fs = statfsSync(resolve(CONTINUATION.temp), { bigint: true }), freeBytes = Number(fs.bavail * fs.bsize), usage = process.memoryUsage()
  assertLeanBaselineContinuationFrontier(allocation, { nowMs: Date.now(), monotonicElapsedMs: 0, remainingSlots: 36, charged: 43, retainedBytes: carried.carry.allocatedDiskBytes, scratchBytes: measureLeanPhysicalBytes(CONTINUATION.temp), parentRssBytes: usage.rss, childRssBytes: 0, arrayBuffersBytes: usage.arrayBuffers, availableMemoryBytes: observeLeagueAvailableMemoryBytes(), freeBytes, live: true })
  guard()
  const ledger = createLeanLedger(CONTINUATION.store, allocation)
  writeLeanContinuationArtifact(ledger, "carry.json", carried, 4194304)
  writeLeanContinuationArtifact(ledger, "source-manifest.json", manifest, 4194304)
  const fd = openSync(CONTINUATION.allocation, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o644)
  try { fchmodSync(fd, 0o644); writeLeanAll(fd, leanCanonicalBytes(allocation)); fsyncSync(fd) } finally { closeSync(fd) }
  const parent = openSync(dirname(CONTINUATION.allocation), constants.O_RDONLY | constants.O_NOFOLLOW)
  try { fsyncSync(parent) } finally { closeSync(parent) }
  guard()
  return { schemaVersion: "lean-baseline-continuation-prepared-v1", allocationRoot: allocation.root, allocationPath: CONTINUATION.allocation, store: CONTINUATION.store, sourceHead: request.sourceHead, charged: 43, plannedCurrentCells: 36, holdoutReservations: allocation.holdoutReservations, issued: false }
}

/** Pins every source/test/planning byte and survivor stat. Full streaming carry
 * authentication occurs at admission; later claims recheck immutable identity. */
export const openLeanBaselineContinuationContext = (requestPath: string, reader = false) => {
  assertLeanBaselineContinuationScope(); if (reader) { if (Date.now() < CONTINUATION_WINDOW.anchorMs || Date.now() >= CONTINUATION_WINDOW.deadlineMs) return fail("CONTINUATION_WINDOW") } else continuationWindowGuard(36, 1)
  const ledger = openLeanLedger(CONTINUATION.store), allocation = validateLeanBaselineContinuationAllocation(ledger.allocation)
  continuationPreAuthenticationCapacity(cumulativeLeanPhysicalBytes(ledger))
  const request = readLeanBaselineContinuationRequest(requestPath)
  const manifest = leanBaselineContinuationSourceManifest(), fixedHead = continuationHead(), fixedRequest = leanBytesRoot(readLeanContinuationBytes(requestPath, 65536, 0o600))
  if (allocation.sourceRoot !== request.sourceRoot || allocation.planningRoot !== request.planningRoot || allocation.sourceHead !== request.sourceHead || allocation.requestBytesRoot !== fixedRequest || allocation.reviewRoot !== request.reviewRoot || allocation.coldRoot !== request.coldRoot || allocation.seed !== request.seed || allocation.offlineOverheadMs !== request.offlineOverheadMs || !exact(allocation.requestRoots, request.requestRoots) || !exact(readLeanContinuationJson(join(ledger.directory, "source-manifest.json"), 4194304, 0o600), manifest)) return fail("CONTINUATION_ALLOCATION_JOIN")
  assertLeanContinuationDirectParent(fixedHead, allocation.sourceHead, readLeanBaselineContinuationGit(["rev-list", "--parents", "-n", "1", fixedHead]).toString("utf8").trim().split(/\s+/u), leanCanonicalBytes(allocation), readLeanBaselineContinuationGit(["show", `${fixedHead}:${CONTINUATION.allocation}`]))
  if (!readLeanContinuationBytes(CONTINUATION.allocation, 262144).equals(Buffer.from(leanCanonicalBytes(allocation)))) return fail("CONTINUATION_ALLOCATION_JOIN")
  const carry = readLeanContinuationJson(join(ledger.directory, "carry.json"), 4194304, 0o600)
  if (!exact(carry.carry, allocation.predecessor)) return fail("CONTINUATION_CARRY")
  const began = process.hrtime.bigint(), wallBegan = Date.now()
  const pinned = manifest.entries.map(row => ({ ...row, stat: lstatSync(resolve(row.path)) }))
  const survivors = carry.inventory as LeanContinuationInventoryRow[]
  if (!Array.isArray(survivors) || survivors.length > 4096 || labRoot("lean-baseline-continuation-inventory-v1", survivors) !== allocation.predecessor.inventoryRoot || labRoot("lean-baseline-continuation-custody-v1", carry.custody) !== allocation.predecessor.custodyRoot) return fail("CONTINUATION_CARRY")
  const assertIdentities = createLeanContinuationIdentityGuard(pinned, survivors)
  let closure = reader, closureBegan = reader ? readLeanTimeAccounting(ledger).closes.get("pilot-entry") ?? wallBegan : wallBegan, expectedLedger: LabRoot | undefined, active = false
  const guard = (additionalBytes = 0) => {
    const nowMs = Date.now()
    if (nowMs < wallBegan || continuationHead() !== fixedHead || leanBytesRoot(readLeanContinuationBytes(requestPath, 65536, 0o600)) !== fixedRequest) return fail("CONTINUATION_HOLD")
    assertIdentities()
    const journal = readLeanContinuationBytes(join(ledger.directory, "ledger.ndjson"), 4194304, 0o600)
    if (expectedLedger && leanBytesRoot(journal) !== expectedLedger) return fail("CONTINUATION_LEDGER_CHANGED")
    const state = readLeanLedger(ledger), usage = process.memoryUsage(), fs = statfsSync(ledger.directory, { bigint: true })
    const child = process.connected ? process.pid : 0, parent = process.connected ? process.ppid : process.pid
    if (child && process.ppid !== readLeanChildEntry(ledger).parentPid) return fail("CONTINUATION_PARENT")
    const sample = { nowMs, monotonicElapsedMs: wallBegan - CONTINUATION_WINDOW.anchorMs + Number((process.hrtime.bigint() - began) / 1000000n), remainingSlots: closure ? 0 : 36 - state.charges.size + (active ? 1 : 0), ...(closure ? { remainingClosureMs: Math.max(0, CONTINUATION_WINDOW.reserveMs - Math.max(0, nowMs - closureBegan)), remainingOfflineMs: 0 } : {}), charged: state.charged, retainedBytes: cumulativeLeanPhysicalBytes(ledger), scratchBytes: measureLeanPhysicalBytes(CONTINUATION.temp) + additionalBytes, parentRssBytes: child ? rssOf(parent) : usage.rss, childRssBytes: child ? usage.rss : 0, arrayBuffersBytes: usage.arrayBuffers + additionalBytes, availableMemoryBytes: observeLeagueAvailableMemoryBytes(), freeBytes: Number(fs.bavail * fs.bsize), live: !child || process.connected === true }
    assertLeanBaselineContinuationFrontier(allocation, sample)
    return sample
  }
  guard()
  // Fresh hashes and canonical custody on both sides of the expensive read.
  const authenticated = authenticateLeanBaselineContinuationCarry(readLeanBaselineContinuationGit, manifest.entries.map(row => row.path), () => { if (reader) guard(); else { continuationWindowGuard(36, request.offlineOverheadMs); continuationPreAuthenticationCapacity(cumulativeLeanPhysicalBytes(ledger)) } })
  if (!exact(authenticated, carry)) return fail("CONTINUATION_CARRY_CHANGED")
  const pinnedPaths = manifest.entries.map(row => row.path)
  for (const row of manifest.entries) authenticateLeanContinuationPinnedSource(row, fixedHead, pinnedPaths, readLeanBaselineContinuationGit, guard)
  guard()
  return { request, ledger, allocation, manifest, fixedHead, guard, startCell() { active = true; expectedLedger = leanBytesRoot(readLeanContinuationBytes(join(ledger.directory, "ledger.ndjson"), 4194304, 0o600)); guard() }, finishCell() { active = false; expectedLedger = undefined }, closeRun() { active = false; expectedLedger = undefined; closure = true; closureBegan = Date.now() } }
}
export const runLeanBaselineContinuation = async (requestPath: string) => {
  if (requestPath !== CONTINUATION.request || process.send || process.connected) return fail("CONTINUATION_RUN_SCOPE")
  assertLeanBaselineContinuationScope()
  const ledger = openLeanLedger(CONTINUATION.store)
  validateLeanBaselineContinuationAllocation(ledger.allocation)
  // Existing time journal is the one-use marker, including failed admission.
  beginLeanInterval(ledger, "continuation-run-admission")
  let c: ReturnType<typeof openLeanBaselineContinuationContext>
  try { c = openLeanBaselineContinuationContext(requestPath) } finally { closeLeanInterval(ledger, "continuation-run-admission") }
  c.guard()
  return runLeanBoundedParent({ ledger: c.ledger, requestPath, allocationPath: CONTINUATION.allocation, store: CONTINUATION.store, sourceRoot: c.allocation.sourceRoot, manifestRoot: () => readLeanBaselineContinuationManifestRoot(c.allocation.planningRoot), childMode: "child-continuation", prospectiveStart: { wallStartMs: Date.now(), monotonicStartNs: process.hrtime.bigint().toString() }, beforeRelease: c.guard, terminalReserveMs: CONTINUATION_WINDOW.reserveMs, supervisorObservation: true })
}
export const runLeanBaselineContinuationChild = async (requestPath: string) => {
  assertLeanBaselineContinuationScope()
  if (requestPath !== CONTINUATION.request || !process.send || !process.connected) return fail("CONTINUATION_CHILD_PARENT")
  const token = await new Promise<string>((accept, reject) => { const timer = setTimeout(() => reject(new TypeError("LEAN_CONTINUATION_HANDSHAKE")), 30000); process.once("disconnect", () => { clearTimeout(timer); reject(new TypeError("LEAN_CONTINUATION_PARENT_LOST")) }); process.once("message", value => { clearTimeout(timer); if (!exactLabKeys(value, ["release"]) || typeof value.release !== "string") { reject(new TypeError("LEAN_CONTINUATION_HANDSHAKE")); return }; accept(value.release) }); process.send!({ ready: process.pid }) })
  const ledger = openLeanLedger(CONTINUATION.store), entry = readLeanChildEntry(ledger)
  admitLeanChildRelease(entry, token, process.pid, process.ppid)
  const c = openLeanBaselineContinuationContext(requestPath), parent = createLeanParentObservationGuard(entry.parentPid)
  assertLeanEntryBinding(entry, { head: c.fixedHead, sourceRoot: c.allocation.sourceRoot, requestBytesRoot: c.allocation.requestBytesRoot, allocationRoot: c.allocation.root, parentPid: process.ppid, childPid: process.pid, intervalStartMs: readLeanTimeAccounting(ledger).starts.get("pilot-entry") ?? -1 })
  const disconnect = () => { parent.disconnect(); process.exit(1) }
  process.once("disconnect", disconnect)
  const checkpoint = (additionalBytes = 0) => { parent.assert(); const sample = c.guard(additionalBytes); parent.assert(); return sample }
  const resourceReceipts: Array<{ ordinal: number; chargeRoot: LabRoot; before: ReturnType<typeof checkpoint>; after: ReturnType<typeof checkpoint> }> = []
  let pipeline: unknown = null, failed = false
  try {
    pipeline = await executeLeanBaselineContinuationPipeline({ allocation: c.allocation, checkpoint, freezeSource: source => publishLeanBaselineContinuationSource(ledger, source, checkpoint), retainArtifact(name, value) { if (!/^(?:seal-metadata|cold-corpus|initial-proposals|initial-selection|initial-training|initial-analysis|response-work|response-node-receipts|response-training|work-accounting|current-analysis)\.json$/u.test(name)) return fail("CONTINUATION_ARTIFACT_NAME"); checkpoint(); writeLeanContinuationArtifact(ledger, name, value, 8388608); checkpoint() }, async dispatch(slot, bottom, top, observedRole) {
      checkpoint()
      const before = readLeanContinuationBytes(join(ledger.directory, "ledger.ndjson"), 4194304, 0o600)
      const pair = leanBaselinePair({ ordinal: slot.ordinal, slot, priorLedgerBytesRoot: leanBytesRoot(before), priorLedgerByteLength: before.length, priorCharged: readLeanLedger(ledger).charged, bottom, top })
      writeLeanContinuationArtifact(ledger, `pair-${slot.ordinal}.json`, pair, 16384); const resourceBefore = checkpoint()
      const fs = statfsSync(ledger.directory, { bigint: true }), charge = chargeLeanSlot(ledger, slot, { freeBytes: Number(fs.bavail * fs.bsize), availableMemoryBytes: observeLeagueAvailableMemoryBytes() })
      c.startCell()
      const execution = await runLeanBaselineContinuationMatch({ ledger, charge, slot, seed: c.allocation.seed, bottom, top, ...(observedRole === undefined ? {} : { observedRole }), checkpoint, register: parent.register, unregister: parent.unregister })
      c.finishCell(); checkpoint()
      retainLeanMatch(ledger, charge, execution.compact, execution.replayFrames, undefined, checkpoint)
      const { replayFrames: _frames, ...content } = execution
      const cell = { ...content, ordinal: slot.ordinal, slotRoot: slot.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot }
      const body = { schemaVersion: "lean-baseline-observation-v1", pairRoot: pair.root, cell }
      writeLeanContinuationArtifact(ledger, `observation-${slot.ordinal}.json`, { ...body, root: labRoot(body.schemaVersion, body) }, 8388608)
      if (execution.diagnostic) writeLeanContinuationArtifact(ledger, `diagnostic-${charge.root.slice(7)}.json`, execution.diagnostic, 16384)
      checkpointLeanResources(ledger, currentLeanElapsedMs(ledger), process.memoryUsage().arrayBuffers, measureLeanPhysicalBytes(CONTINUATION.temp))
      const resourceAfter = checkpoint()
      resourceReceipts.push({ ordinal: slot.ordinal, chargeRoot: charge.root, before: resourceBefore, after: resourceAfter })
      return cell
    } })
  } catch { failed = true }
  finally { c.closeRun(); process.off("disconnect", disconnect) }
  const complete = !failed && (pipeline as { status?: string } | null)?.status === "current_baseline_complete"
  const state = readLeanLedger(ledger)
  if (!state.stopped) stopLeanLedger(ledger, complete ? "complete" : "failure")
  checkpoint()
  let evidence: ReturnType<typeof verifyLeanEvidence> | null = null
  try { evidence = verifyLeanEvidence(ledger, checkpoint) } catch { failed = true }
  // Missing evidence stays missing. The charge, any published work/terminal,
  // and exact unused slots survive a host failure without imputed outcomes.
  const result = { schemaVersion: "lean-baseline-continuation-result-v1", issued: false, evidenceClass: "exploratory_current_only", allocationRoot: c.allocation.root, sourceRoot: c.allocation.sourceRoot, planningRoot: c.allocation.planningRoot, requestBytesRoot: c.allocation.requestBytesRoot, head: c.fixedHead, evidenceRoot: evidence?.root ?? null, pipeline, resourceReceipts, charged: state.charged, successful: [...state.terminals.values()].filter(row => row.record.classification === "success").length, status: complete && !failed ? "pending_independent_verification" : "partial_or_failed_baseline", elapsedMs: Math.max(state.elapsedMs, currentLeanElapsedMs(ledger)), physicalHighWaterBytes: state.physicalHighWaterBytes, scratchHighWaterBytes: state.scratchHighWaterBytes, unusedOrdinals: c.allocation.slots.filter(slot => !state.charges.has(slot.root)).map(slot => slot.ordinal), holdoutReservations: c.allocation.holdoutReservations, failure: failed ? "source_runtime_or_integrity_stop" : null, sourceAuthor: c.request.sourceAuthor, runOperator: c.request.runOperator, holdoutOpened: false, formationMaterialized: false }
  writeLeanContinuationArtifact(ledger, "result.json", result, 4194304); checkpoint()
  return result
}

export interface LeanContinuationSourceGateV2 {
  schemaVersion: "lean-baseline-continuation-source-gate-v2"; plan_check: "passed"; source_review: "passed"; root_validation: "passed"; source_verification: "passed"; commands_closed: true
  reviewedSourceHead: string; sourceRoot: LabRoot; sourceAuthor: string; sourceReviewer: string; sourceVerifier: string
}
export interface LeanContinuationDataGateV2 {
  schemaVersion: "lean-baseline-continuation-data-gate-v2"; status: "passed"; grantId: string; windowRoot: LabRoot; windowBytesRoot: LabRoot; reviewedSourceHead: string; sourceRoot: LabRoot; sourceGateRoot: LabRoot; planRoot: LabRoot
  approvalEvidence: LeanBaselineContinuationWindowV2["approvalEvidence"]; runOperator: string; readerOperator: string; dataReviewer: string; commands_closed: true
}
/** Each projection is one canonical JSON object in its own json fence in GATES.
 * Its digest excludes the enclosing Markdown and thus cannot reference itself. */
export const readLeanContinuationGateProjectionV2 = (text: string, schemaVersion: string): Record<string, unknown> | null => {
  if (Buffer.byteLength(text) > 4194304) return fail("V2_GATE_BOUND")
  const matches: Record<string, unknown>[] = []
  for (const block of text.matchAll(/^```json\r?\n([\s\S]*?)\r?\n```[ \t]*$/gmu)) {
    let value: unknown
    try { value = JSON.parse(block[1]!) } catch { if (block[1]!.includes(schemaVersion)) return fail("V2_GATE_JSON"); continue }
    if (!value || typeof value !== "object" || Array.isArray(value) || (value as Record<string, unknown>).schemaVersion !== schemaVersion) continue
    if (Buffer.from(leanCanonicalBytes(value)).toString("utf8") !== block[1]) return fail("V2_GATE_CANONICAL")
    matches.push(value as Record<string, unknown>)
  }
  if (matches.length > 1) return fail("V2_GATE_DUPLICATE")
  return matches[0] ?? null
}
export const validateLeanContinuationSourceGateV2 = (value: unknown): LeanContinuationSourceGateV2 => {
  if (!exactLabKeys(value, ["schemaVersion", "plan_check", "source_review", "root_validation", "source_verification", "commands_closed", "reviewedSourceHead", "sourceRoot", "sourceAuthor", "sourceReviewer", "sourceVerifier"])) return fail("V2_SOURCE_GATE")
  const g = value as unknown as LeanContinuationSourceGateV2
  if (g.schemaVersion !== "lean-baseline-continuation-source-gate-v2" || [g.plan_check, g.source_review, g.root_validation, g.source_verification].some(v => v !== "passed") || g.commands_closed !== true || !/^[a-f0-9]{40}$/u.test(g.reviewedSourceHead) || !ROOT(g.sourceRoot) || ![g.sourceAuthor, g.sourceReviewer, g.sourceVerifier].every(leanContinuationIdentityV2) || new Set([g.sourceAuthor, g.sourceReviewer, g.sourceVerifier]).size !== 3) return fail("V2_SOURCE_GATE")
  return g
}
export const validateLeanContinuationDataGateV2 = (value: unknown, window: LeanBaselineContinuationWindowV2, sourceGate: LeanContinuationSourceGateV2): LeanContinuationDataGateV2 => {
  const w = validateLeanBaselineContinuationWindowV2(window), sg = validateLeanContinuationSourceGateV2(sourceGate)
  if (!exactLabKeys(value, ["schemaVersion", "status", "grantId", "windowRoot", "windowBytesRoot", "reviewedSourceHead", "sourceRoot", "sourceGateRoot", "planRoot", "approvalEvidence", "runOperator", "readerOperator", "dataReviewer", "commands_closed"])) return fail("V2_DATA_GATE")
  const g = value as unknown as LeanContinuationDataGateV2
  if (g.schemaVersion !== "lean-baseline-continuation-data-gate-v2" || g.status !== "passed" || g.commands_closed !== true || !leanContinuationIdentityV2(g.dataReviewer) || g.grantId !== w.grantId || g.windowRoot !== w.root || g.windowBytesRoot !== leanBytesRoot(leanCanonicalBytes(w)) || g.reviewedSourceHead !== w.reviewedSourceHead || g.sourceRoot !== w.sourceRoot || g.sourceGateRoot !== w.sourceGateRoot || g.planRoot !== w.planRoot || !exact(g.approvalEvidence, w.approvalEvidence) || g.runOperator !== w.runOperator || g.readerOperator !== w.readerOperator || sg.reviewedSourceHead !== w.reviewedSourceHead || sg.sourceRoot !== w.sourceRoot || labRoot(sg.schemaVersion, sg) !== w.sourceGateRoot || new Set([sg.sourceAuthor, w.runOperator, w.readerOperator]).size !== 3) return fail("V2_DATA_GATE")
  return g
}
/** Inert implementation metadata is available while the real grant is absent. */
export const leanBaselineContinuationSourceManifestV2 = () => {
  const base = leanBaselineContinuationSourceManifest()
  const implementationEntries = base.implementationEntries.map(row => { if (!ROOT(row.root)) return fail("V2_SOURCE_ROOT"); return { path: row.path, root: row.root } })
  const entries = [...implementationEntries, ...base.planningEntries].sort((a, b) => a.path.localeCompare(b.path))
  const gateBytes = readLeanContinuationBytes(CONTINUATION_V2.gates, 4194304, 0o644)
  if (leanBytesRoot(gateBytes) !== base.planningEntries.find(row => row.path === CONTINUATION_V2.gates)?.root) return fail("V2_PLANNING_CHANGED")
  const sourceGate = readLeanContinuationGateProjectionV2(gateBytes.toString("utf8"), "lean-baseline-continuation-source-gate-v2")
  return { ...base, implementationEntries, entries, schemaVersion: "lean-baseline-continuation-source-manifest-v2" as const, admitting: false as const, root: labRoot("lean-baseline-continuation-implementation-v2", implementationEntries), planningRoot: labRoot("lean-baseline-continuation-planning-source-v2", base.planningEntries), manifestRoot: labRoot("lean-baseline-continuation-source-manifest-v2", entries), sourceGate, sourceGateRoot: sourceGate === null ? null : labRoot("lean-baseline-continuation-source-gate-v2", sourceGate) }
}
const continuationWindowAdmissionV2 = (window: LeanBaselineContinuationWindowV2, remainingSlots: number, journalMs = 0): number => {
  const now = Date.now(), elapsed = leanBaselineContinuationElapsedFloorV2(window, now, journalMs)
  const reserve = remainingSlots === 0 ? 0 : remainingSlots * LEAN_CAPS.matchMs + window.closureMs + window.offlineOverheadMs
  if (!Number.isSafeInteger(remainingSlots) || remainingSlots < 0 || remainingSlots > 36 || now >= window.deadlineMs || now + reserve > window.deadlineMs || elapsed + reserve > window.capMs) return fail("V2_WINDOW_EXPIRED")
  return elapsed
}
export const readLeanBaselineContinuationWindowV2 = (requestPath: string = CONTINUATION_V2.request): Readonly<LeanBaselineContinuationWindowV2> => {
  const paths = leanBaselineContinuationPathsForRequestV2(requestPath)
  const bytes = readLeanContinuationBoundedBytesV2(paths.window, 65536, 0o600, additional => { if ((additional ?? 0) > 65536 || process.memoryUsage().arrayBuffers + (additional ?? 0) > LEAN_CAPS.scratchBytes) return fail("V2_WINDOW_BUFFER") })
  const window = validateLeanBaselineContinuationWindowV2(JSON.parse(bytes.toString("utf8")))
  if (leanBaselineContinuationPathsForWindowV2(window).request !== requestPath) return fail("V2_WINDOW_NAMESPACE")
  if (!bytes.equals(Buffer.from(leanCanonicalBytes(window)))) return fail("V2_WINDOW_CANONICAL")
  return window
}
export const leanBaselineContinuationDataManifestV2 = (window: LeanBaselineContinuationWindowV2, source: ReturnType<typeof leanBaselineContinuationSourceManifestV2>) => {
  const w = validateLeanBaselineContinuationWindowV2(window), paths = leanBaselineContinuationPathsForWindowV2(w), gate = validateLeanContinuationSourceGateV2(source.sourceGate)
  if (source.admitting !== false || source.root !== w.sourceRoot || source.sourceGateRoot !== w.sourceGateRoot || source.root !== labRoot("lean-baseline-continuation-implementation-v2", source.implementationEntries) || source.planningRoot !== labRoot("lean-baseline-continuation-planning-source-v2", source.planningEntries) || !exact(source.entries, [...source.implementationEntries, ...source.planningEntries].sort((a, b) => a.path.localeCompare(b.path))) || source.manifestRoot !== labRoot("lean-baseline-continuation-source-manifest-v2", source.entries)) return fail("V2_SOURCE_MANIFEST")
  const windowBytes = readLeanContinuationBoundedBytesV2(paths.window, 65536, 0o600, () => { continuationWindowAdmissionV2(w, 0) })
  if (!windowBytes.equals(Buffer.from(leanCanonicalBytes(w)))) return fail("V2_WINDOW_BYTES")
  const gateBytes = readLeanContinuationBoundedBytesV2(paths.gates, 4194304, 0o644, () => { continuationWindowAdmissionV2(w, 0) })
  if (leanBytesRoot(gateBytes) !== source.planningEntries.find(row => row.path === paths.gates)?.root || w.planRoot !== source.planningEntries.find(row => row.path.endsWith("265-16-BASELINE-CONTINUATION-PLAN-20261012.md"))?.root) return fail("V2_PLANNING_BYTES")
  const dataGate = validateLeanContinuationDataGateV2(readLeanContinuationGateProjectionV2(gateBytes.toString("utf8"), "lean-baseline-continuation-data-gate-v2"), w, gate)
  const planningEntries = [...source.planningEntries, { path: paths.window, root: leanBytesRoot(windowBytes) }].sort((a, b) => a.path.localeCompare(b.path)), entries = [...source.implementationEntries, ...planningEntries].sort((a, b) => a.path.localeCompare(b.path))
  if (entries.length > 1024 || new Set(entries.map(row => row.path)).size !== entries.length || leanCanonicalBytes(entries).length > 4194304) return fail("V2_MANIFEST_BOUND")
  return { schemaVersion: "lean-baseline-continuation-data-manifest-v2" as const, admitting: true as const, implementationEntries: source.implementationEntries, planningEntries, entries, root: source.root, planningRoot: labRoot("lean-baseline-continuation-planning-v2", planningEntries), manifestRoot: labRoot("lean-baseline-continuation-data-manifest-v2", entries), windowRoot: w.root, windowBytesRoot: leanBytesRoot(windowBytes), sourceGateRoot: w.sourceGateRoot, dataReviewRoot: labRoot(dataGate.schemaVersion, dataGate), sourceGate: gate, dataGate }
}
export interface LeanBaselineContinuationRequestV2 extends Omit<LeanBaselineContinuationRequest, "schemaVersion"> {
  schemaVersion: "lean-baseline-continuation-request-v2"; windowRoot: LabRoot; windowBytesRoot: LabRoot; sourceGateRoot: LabRoot; dataReviewRoot: LabRoot; manifestRoot: LabRoot
}
export const validateLeanBaselineContinuationRequestV2 = (value: unknown, w: LeanBaselineContinuationWindowV2, manifest: ReturnType<typeof leanBaselineContinuationDataManifestV2>): LeanBaselineContinuationRequestV2 => {
  validateLeanBaselineContinuationWindowV2(w)
  if (!exactLabKeys(value, ["schemaVersion", "seed", "sourceHead", "sourceRoot", "planningRoot", "planRoot", "reviewRoot", "coldRoot", "candidateRoots", "requestRoots", "offlineOverheadMs", "sourceAuthor", "runOperator", "readerOperator", "windowRoot", "windowBytesRoot", "sourceGateRoot", "dataReviewRoot", "manifestRoot"])) return fail("V2_REQUEST")
  const r = value as unknown as LeanBaselineContinuationRequestV2
  if (r.schemaVersion !== "lean-baseline-continuation-request-v2" || manifest.admitting !== true || !/^[a-f0-9]{40}$/u.test(r.sourceHead) || r.sourceRoot !== manifest.root || r.sourceRoot !== w.sourceRoot || r.planningRoot !== manifest.planningRoot || r.manifestRoot !== manifest.manifestRoot || r.planRoot !== w.planRoot || r.reviewRoot !== manifest.sourceGateRoot || r.windowRoot !== w.root || r.windowBytesRoot !== manifest.windowBytesRoot || r.sourceGateRoot !== w.sourceGateRoot || r.dataReviewRoot !== manifest.dataReviewRoot || r.coldRoot !== leanColdProcedureRoot(r.seed) || !exact(r.candidateRoots, deriveLeanBaselineCandidateRoots(r.coldRoot)) || !exact(r.requestRoots, deriveLeanBaselineRequestRoots({ seed: r.seed, coldRoot: r.coldRoot, planRoot: r.planRoot, sourceRoot: r.sourceRoot })) || r.offlineOverheadMs !== w.offlineOverheadMs || r.sourceAuthor !== manifest.sourceGate.sourceAuthor || r.runOperator !== w.runOperator || r.readerOperator !== w.readerOperator || ![r.sourceAuthor, r.runOperator, r.readerOperator].every(leanContinuationIdentityV2) || new Set([r.sourceAuthor, r.runOperator, r.readerOperator]).size !== 3) return fail("V2_REQUEST")
  return r
}
export const readLeanBaselineContinuationRequestV2 = (path: string): LeanBaselineContinuationRequestV2 => {
  leanBaselineContinuationPathsForRequestV2(path)
  const window = readLeanBaselineContinuationWindowV2(path); continuationWindowAdmissionV2(window, 0)
  const manifest = leanBaselineContinuationDataManifestV2(window, leanBaselineContinuationSourceManifestV2())
  return validateLeanBaselineContinuationRequestV2(readLeanContinuationJsonV2(path, 65536, 0o600, () => { continuationWindowAdmissionV2(window, 0) }), window, manifest)
}

export const assertLeanBaselineContinuationScopeV2 = (preparing = false, window?: LeanBaselineContinuationWindowV2): void => {
  const paths = window === undefined ? CONTINUATION_V2 : leanBaselineContinuationPathsForWindowV2(window)
  if (process.env.TSX_DISABLE_CACHE !== "1" || process.env.NODE_DISABLE_COMPILE_CACHE !== "1" || ["NODE_OPTIONS", "NODE_COMPILE_CACHE", "NODE_REDIRECT_WARNINGS", "NODE_V8_COVERAGE"].some(key => process.env[key] !== undefined) || process.env.TMPDIR !== resolve(paths.temp) || !process.execArgv.some((arg, i, args) => arg === "--import" && args[i + 1] === "tsx" || arg === "--import=tsx") || process.execArgv.some(arg => /(?:loader|inspect|require)/u.test(arg)) || coreSoftLimit().trim() !== "0") return fail("V2_SCOPE")
  if (!preparing) { const s = lstatSync(paths.temp); if (!s.isDirectory() || s.isSymbolicLink() || s.uid !== process.getuid?.() || (s.mode & 0o777) !== 0o700 || realpathSync(resolve(paths.temp)) !== resolve(paths.temp)) return fail("V2_SCRATCH") }
}
const continuationCapacityV2 = (w: LeanBaselineContinuationWindowV2, retained = 88924160, additional = 0, scratchExists = false, ledger?: LeanExperimentLedger) => {
  let tempPath: string
  if (ledger === undefined) { tempPath = leanBaselineContinuationPathsForWindowV2(w).temp; continuationWindowAdmissionV2(w, 0) }
  else {
    const now = Date.now(), basis = leanAdmittedContinuationCapacityBasisV2(ledger, w, now)
    if (now >= w.deadlineMs || basis.elapsedMs > w.capMs) return fail("V2_WINDOW_EXPIRED")
    tempPath = basis.tempPath
  }
  continuationCapacityObservationV2(tempPath, retained, additional, scratchExists)
}
// Shared fresh observations: neither admitted-ledger nor preflight expectations
// may cache, omit or independently reimplement these resource predicates.
const continuationCapacityObservationV2 = (tempPath: string, retained: number, additional: number, scratchExists: boolean) => {
  const usage = process.memoryUsage(), fs = statfsSync(resolve("."), { bigint: true }), reserve = 2 * 268435456 + 512000000 + 335544320, scratch = scratchExists ? measureLeanPhysicalBytes(tempPath) : 0
  if (![retained, additional, scratch].every(n => Number.isSafeInteger(n) && n >= 0) || retained > LEAN_CAPS.retainedBytes || scratch + additional + usage.arrayBuffers > LEAN_CAPS.scratchBytes || usage.rss + (process.connected ? rssOf(process.ppid) : 0) + usage.arrayBuffers + additional + reserve > LEAN_BASELINE_CONTINUATION_POLICY_V2.memoryBytes || observeLeagueAvailableMemoryBytes() < reserve || fs.bavail * fs.bsize > BigInt(Number.MAX_SAFE_INTEGER) || fs.bavail * fs.bsize < BigInt(LEAN_CAPS.totalBytes - retained)) return fail("V2_CAPACITY")
}
const CONTINUATION_V2_METADATA_PARSE_RESERVE = 2 * 7 * 4194304 + 4 * 3 * 262144
/** Checking-only invocation state. This is not accepted by any authority API.
 * Descriptor leaves reach bounded local measurement/resources/time ONLY. The
 * privately admitted capacity basis is pure and safe, but no full ledger or
 * source/history reader belongs in this reservation callback. */
export const createLeanContinuationLocalReservationV8 = (window: LeanBaselineContinuationWindowV2, reader = false) => {
  const w = validateLeanBaselineContinuationWindowV2(window), p = leanBaselineContinuationPathsForWindowV2(w)
  if ((p !== LEAN_BASELINE_CONTINUATION_PATHS_V8 && p !== LEAN_BASELINE_CONTINUATION_PATHS_V9)) return fail("V8_RESERVATION_SCOPE")
  const pid = process.pid, cwd = process.cwd(), began = process.hrtime.bigint(), wall = Date.now(), measure = createLeanContinuationOwnedMeasurementV8(w)
  const otherKnownDisjointBytes = measureLeanContinuationKnownDisjointBytesV8(w)
  let floor = (p === LEAN_BASELINE_CONTINUATION_PATHS_V9 ? LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V9 : LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V8) + otherKnownDisjointBytes, accounting = createLeanContinuationReservationAccountingV8(floor), journalPrefix: Buffer = Buffer.alloc(0), journalFloor = 0, observedGrowth = 0, closure = reader, closureStart: number | undefined, remainingSlots = reader ? 0 : 36, invalid = false
  const outstandingWrites = new Map<string, { bytes: number; previousBlocks: number; previousSize: number }>()
  let progressLedger: LeanExperimentLedger | undefined, progressPrefix: Buffer = Buffer.alloc(0)
  // Current owned journal only: bounded descriptors and canonical hash/schema
  // joins, never archive/source authentication or a complete guard callback.
  const progress = (additional: number) => {
    if (!progressLedger) return
    const a = progressLedger.allocation, path = join(p.store, "ledger.ndjson")
    const bytes = readLeanContinuationBoundedBytesV2(path, 4194304, 0o600, more => { resource(additional + (more ?? 0), true) })
    if (bytes.length < progressPrefix.length || !bytes.subarray(0, progressPrefix.length).equals(progressPrefix)) return fail("V8_PROGRESS_CHANGED")
    const text = bytes.toString("utf8"), lines = text ? text.slice(0, -1).split("\n") : []
    if (text && !text.endsWith("\n") || lines.length > 512) return fail("V8_PROGRESS_CHANGED")
    let charges = 0, terminals = 0, chargeRoot: LabRoot | undefined, stopped = false, elapsed = w.carryMs, physical = 0
    const natural = (n: unknown): n is number => Number.isSafeInteger(n) && Number(n) >= 0
    for (const line of lines) {
      const e = JSON.parse(line)
      if (!e || !Buffer.from(leanCanonicalBytes(e)).equals(Buffer.from(line))) return fail("V8_PROGRESS_CHANGED")
      if (e.kind === "charge") {
        const c = e.charge, slot = a.slots[charges]
        if (stopped || charges !== terminals || !slot || !exactLabKeys(e, ["kind", "charge"]) || !c || !exactLabKeys(c, ["schemaVersion", "allocationRoot", "slotRoot", "ordinal", "root"]) || c.schemaVersion !== "lean-slot-charge-v1" || c.allocationRoot !== a.root || c.ordinal !== charges || c.slotRoot !== slot.root || c.root !== labRoot(c.schemaVersion, { schemaVersion: c.schemaVersion, allocationRoot: a.root, slotRoot: slot.root, ordinal: charges })) return fail("V8_PROGRESS_CHANGED")
        charges++; chargeRoot = c.root
      } else if (e.kind === "terminal") {
        const r = e.record
        if (stopped || charges !== terminals + 1 || e.chargeRoot !== chargeRoot || !exactLabKeys(e, ["kind", "chargeRoot", "record", "replay"]) || !r || !exactLabKeys(r, ["classification", "code", "outcome", "elapsedMs", "cleanupComplete", "invocationCount", "accountingRoot", "executionRoot", "telemetry"]) || !["success", "player_violation", "system_failure"].includes(String(r.classification)) || !natural(r.elapsedMs) || r.elapsedMs > LEAN_CAPS.matchMs + 30000 || !natural(r.invocationCount) || r.invocationCount > 49600 || !ROOT(r.accountingRoot) || !ROOT(r.executionRoot) || !r.telemetry || !exactLabKeys(r.telemetry, ["transitions", "events"]) || !Object.values(r.telemetry).every(natural) || typeof r.cleanupComplete !== "boolean") return fail("V8_PROGRESS_CHANGED")
        if (r.classification === "success" ? r.code !== "OK" || !r.cleanupComplete || !["bottom", "top", "DRAW"].includes(String(r.outcome)) : r.outcome !== null || (r.classification === "player_violation" ? r.code !== "PLAYER_VIOLATION" || !r.cleanupComplete : !["SUPERVISOR_FAILURE", "CAPACITY", "CLEANUP"].includes(String(r.code))) || !r.cleanupComplete && r.code !== "CLEANUP") return fail("V8_PROGRESS_CHANGED")
        if (e.replay !== null) {
          const replay = e.replay
          if (!exactLabKeys(replay, ["schemaVersion", "privacy", "codec", "compressedRoot", "uncompressedRoot", "compressedBytes", "uncompressedBytes", "frames", "root"])) return fail("V8_PROGRESS_CHANGED")
          const { root: replayRoot, ...body } = replay
          if (replay.schemaVersion !== "lean-sampled-replay-gzip-v1" || replay.privacy !== "private_offline" || replay.codec !== "gzip-node-v1" || !ROOT(replay.compressedRoot) || !ROOT(replay.uncompressedRoot) || !natural(replay.compressedBytes) || !natural(replay.uncompressedBytes) || !natural(replay.frames) || replay.compressedBytes > LEAN_CAPS.retainedBytes || replay.uncompressedBytes > 256000000 || replayRoot !== labRoot(replay.schemaVersion, body)) return fail("V8_PROGRESS_CHANGED")
        }
        terminals++
      } else if (e.kind === "resource") {
        if (!exactLabKeys(e, ["kind", "elapsedMs", "physicalBytes", "bufferBytes", "scratchBytes"]) || !natural(e.elapsedMs) || !natural(e.physicalBytes) || !natural(e.bufferBytes) || !natural(e.scratchBytes) || e.elapsedMs < elapsed || e.elapsedMs > w.carryMs + Math.max(0, Date.now() - w.anchorMs) + 1 || e.physicalBytes < physical || e.physicalBytes + floor > LEAN_CAPS.retainedBytes || e.bufferBytes + e.scratchBytes > LEAN_CAPS.scratchBytes || e.physicalBytes + floor + e.bufferBytes + e.scratchBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes) return fail("V8_PROGRESS_CHANGED")
        elapsed = e.elapsedMs; physical = e.physicalBytes
      } else if (e.kind === "stop") {
        if (stopped || !exactLabKeys(e, ["kind", "reason"]) || !["complete", "failure", "capacity", "integrity"].includes(String(e.reason)) || e.reason === "complete" && (charges !== 36 || terminals !== 36)) return fail("V8_PROGRESS_CHANGED")
        stopped = true
      } else return fail("V8_PROGRESS_CHANGED")
    }
    progressPrefix = bytes; journalFloor = Math.max(journalFloor, elapsed)
    // Charges do not complete cells. In particular the parent's active flag
    // cannot describe its child: an in-flight charged cell remains reserved.
    if (!closure) remainingSlots = 36 - terminals
  }
  const writePath = (name: string) => { const path = resolve(name); if (![p.allocation, p.request, p.window].map(name => resolve(name)).includes(path) && ![p.store, p.temp].some(name => path.startsWith(resolve(name) + "/") && !relative(resolve(name), path).includes("/"))) return fail("V8_WRITE_SCOPE"); return path }
  const fileBlocks = (path: string) => { try { const s = lstatSync(path); if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || s.uid !== process.getuid?.() || realpathSync(path) !== path) return fail("V8_WRITE_SCOPE"); return { blocks: s.blocks * 512, size: s.size } } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { blocks: 0, size: -1 }; throw error } }
  const resource = (additional: number, readingProgress = false) => {
    if (invalid || process.pid !== pid || process.cwd() !== cwd || !Number.isSafeInteger(additional) || additional < 0) return fail("V8_RESERVATION_SCOPE")
    const owned = measure()
    let outstanding = 0
    for (const [path, pending] of outstandingWrites) { const measured = fileBlocks(path); outstanding += Math.max(0, pending.bytes - Math.max(0, measured.blocks - pending.previousBlocks)) }
    const reserve = additional + CONTINUATION_V2_METADATA_PARSE_RESERVE + outstanding, retained = accounting.required(reserve + observedGrowth, owned.retainedBytes)
    const now = Date.now(), mono = process.hrtime.bigint() - began, usage = process.memoryUsage(), disk = statfsSync(cwd, { bigint: true }), free = disk.bavail * disk.bsize, native = 2 * 268435456 + 512000000 + 335544320
    // Before the first bounded journal leaf is read, no dependent effect is
    // admitted. reserve() rechecks after it obtains the fresh pilot close.
    const remaining = readingProgress ? 0 : closure ? closureStart === undefined ? 0 : Math.max(0, w.closureMs - Math.max(0, now - closureStart)) : remainingSlots * LEAN_CAPS.matchMs + w.closureMs + w.offlineOverheadMs
    if (mono < 0n || mono > BigInt(Number.MAX_SAFE_INTEGER) * 1000000n || now < wall) return fail("V8_RESERVATION_CLOCK")
    const elapsed = Math.max(leanContinuationGlobalFloorV2(now), w.carryMs + Math.max(now - w.anchorMs, wall - w.anchorMs + Number((mono + 999999n) / 1000000n)), journalFloor)
    if (![retained, reserve, owned.scratchBytes + reserve, elapsed + remaining, now + remaining].every(n => Number.isSafeInteger(n) && n >= 0) || now + remaining > w.deadlineMs || elapsed + remaining > w.capMs || retained > LEAN_CAPS.retainedBytes || retained + LEAN_CAPS.scratchBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes || owned.scratchBytes + reserve + usage.arrayBuffers > LEAN_CAPS.scratchBytes || usage.rss + (process.connected ? rssOf(process.ppid) : 0) + usage.arrayBuffers + reserve + native > LEAN_BASELINE_CONTINUATION_POLICY_V2.memoryBytes || observeLeagueAvailableMemoryBytes() < native || free > BigInt(Number.MAX_SAFE_INTEGER) || free < BigInt(LEAN_CAPS.totalBytes - floor - observedGrowth - owned.retainedBytes) || process.connected === false && process.send !== undefined) return fail("V8_RESERVATION_CAPACITY")
    return { retainedBytes: retained, scratchBytes: owned.scratchBytes, elapsedMs: elapsed }
  }
  const reserve = (additional = 0) => {
    try {
      progress(additional)
      let result = resource(additional)
      const path = join(p.store, "time.ndjson")
      if (existsSync(path)) {
        // Small append-only frontier: no allocation, ledger or carry parser.
        const bytes = readLeanContinuationBoundedBytesV2(path, 65536, 0o600, more => { resource(additional + (more ?? 0)) })
        if (bytes.length < journalPrefix.length || !bytes.subarray(0, journalPrefix.length).equals(journalPrefix)) return fail("V8_JOURNAL_CHANGED")
        const text = bytes.toString("utf8"), rows = text ? text.slice(0, -1).split("\n") : []
        if (text && !text.endsWith("\n") || rows.length > 16) return fail("V8_JOURNAL_CHANGED")
        let previous = w.anchorMs, activeId: string | undefined
        const started = new Set<string>()
        for (const line of rows) {
          const row = JSON.parse(line) as Record<string, unknown>
          if (!exactLabKeys(row, ["kind", "id", "atMs"]) || !["start", "close"].includes(String(row.kind)) || !["continuation-run-admission", "pilot-entry", "continuation-retained-verifier-v2"].includes(String(row.id)) || !Number.isSafeInteger(row.atMs) || Number(row.atMs) < previous || Number(row.atMs) > Date.now() + 1 || !Buffer.from(leanCanonicalBytes(row)).equals(Buffer.from(line))) return fail("V8_JOURNAL_CHANGED")
          const id = String(row.id)
          if (row.kind === "start") { if (activeId !== undefined || started.has(id)) return fail("V8_JOURNAL_CHANGED"); started.add(id); activeId = id }
          else { if (activeId !== id) return fail("V8_JOURNAL_CHANGED"); activeId = undefined }
          previous = Number(row.atMs); if (closure && row.kind === "close" && row.id === "pilot-entry") closureStart = Number(row.atMs)
        }
        journalFloor = Math.max(journalFloor, w.carryMs + previous - w.anchorMs); journalPrefix = bytes
        result = resource(additional)
      } else if (journalPrefix.length) return fail("V8_JOURNAL_CHANGED")
      return result
    } catch (error) { invalid = true; throw error }
  }
  return Object.freeze({ reserve, reserveWrite(bytes: number, name: string) { try { const path = writePath(name), before = fileBlocks(path); if (!Number.isSafeInteger(bytes) || bytes < 0 || outstandingWrites.has(path)) return fail("V8_WRITE_SCOPE"); outstandingWrites.set(path, { bytes, previousBlocks: before.blocks, previousSize: before.size }); return reserve() } catch (error) { invalid = true; throw error } },
    bindProgress(ledger: LeanExperimentLedger) { if (invalid || progressLedger || resolve(ledger.directory) !== resolve(p.store) || ledger.allocation.schemaVersion !== "lean-baseline-continuation-allocation-v2" || ledger.allocation.window.root !== w.root || readLeanAdmittedContinuationAllocationV2(ledger) !== ledger.allocation) return fail("V8_PROGRESS_SCOPE"); progressLedger = ledger },
    completeWrite(name: string, unwritten = false) { try { const path = writePath(name), pending = outstandingWrites.get(path); if (!pending) return fail("V8_WRITE_SCOPE"); reserve(); const after = fileBlocks(path); if (unwritten ? pending.previousSize !== -1 || after.size !== -1 : after.size <= pending.previousSize || after.blocks < pending.previousBlocks) return fail("V8_WRITE_SCOPE"); outstandingWrites.delete(path); return reserve() } catch (error) { invalid = true; throw error } },
    reconcileAuthenticated(carriedDebitFloor: number) { if (invalid || outstandingWrites.size || !Number.isSafeInteger(carriedDebitFloor) || carriedDebitFloor < floor) return fail("V8_CARRIED_DEBIT"); floor = carriedDebitFloor; accounting = createLeanContinuationReservationAccountingV8(floor); reserve() },
    setRemainingSlots(slots: number) { if (invalid || !Number.isSafeInteger(slots) || slots < 0 || slots > 36) return fail("V8_RESERVATION_SCOPE"); remainingSlots = slots },
    observeGrowth(bytes: number) { if (invalid || !Number.isSafeInteger(bytes) || bytes < observedGrowth) return fail("V8_SURVIVOR_SHRINK"); observedGrowth = bytes },
    closeRun() { closure = true; closureStart ??= Date.now() }, invalidate() { invalid = true },
  })
}
/** Testable seam for reserving all bounded journal/time metadata parsing before
 * legacy helpers allocate strings, split rows or parse JSON. */
export const withLeanContinuationMetadataReservationV2 = <T>(additionalBytes: number, reserve: (bytes: number) => void, readMetadata: () => T): T => {
  if (!Number.isSafeInteger(additionalBytes) || additionalBytes < 0) return fail("V2_METADATA_RESERVE")
  const bytes = additionalBytes + CONTINUATION_V2_METADATA_PARSE_RESERVE
  if (!Number.isSafeInteger(bytes)) return fail("V2_METADATA_RESERVE")
  reserve(bytes)
  return readMetadata()
}
export const withLeanContinuationDescriptorPreflightV2 = <T>(paths: readonly [string, string, string, string], reserve: (bytes: number) => void, readDescriptor: (path: string, maximum: number, mode: number, guard: (additionalBytes?: number) => void) => Buffer, parseLegacyMetadata: () => T, additionalBytes = 0, optionalPaths: readonly string[] = [], optionalExists: (path: string) => boolean = existsSync): T => {
  return withLeanContinuationMetadataReservationV2(additionalBytes, reserve, () => {
    const reserved = additionalBytes + CONTINUATION_V2_METADATA_PARSE_RESERVE
    const guardedRead = (path: string, maximum: number, mode: number) => readDescriptor(path, maximum, mode, additional => reserve(reserved + (additional ?? 0)))
    guardedRead(paths[0], 262144, 0o644)
    guardedRead(paths[1], 262144, 0o600)
    guardedRead(paths[2], 4194304, 0o600)
    guardedRead(paths[3], 4194304, 0o600)
    for (const path of optionalPaths) if (optionalExists(path)) guardedRead(path, 262144, 0o600)
    return parseLegacyMetadata()
  })
}
export const withLeanContinuationStoreMetadataV2 = <T>(window: LeanBaselineContinuationWindowV2, parseLegacyMetadata: () => T, additionalBytes = 0): T => {
  const selected = leanBaselineContinuationPathsForWindowV2(window), store = selected.store
  const paths = [selected.allocation, join(store, "allocation.json"), join(store, "ledger.ndjson"), join(store, "time.ndjson")] as const
  return withLeanContinuationDescriptorPreflightV2(paths, bytes => continuationCapacityV2(window, 88924160, bytes, true), readLeanContinuationBoundedBytesV2, parseLegacyMetadata, additionalBytes)
}
export const withLeanContinuationReaderMetadataV2 = <T>(window: LeanBaselineContinuationWindowV2, parseLegacyMetadata: () => T, additionalBytes = 0): T => {
  const selected = leanBaselineContinuationPathsForWindowV2(window), store = selected.store
  const paths = [selected.allocation, join(store, "allocation.json"), join(store, "ledger.ndjson"), join(store, "time.ndjson")] as const
  return withLeanContinuationDescriptorPreflightV2(paths, bytes => continuationCapacityV2(window, 88924160, bytes, true), readLeanContinuationBoundedBytesV2, parseLegacyMetadata, additionalBytes, [join(store, "entry.json"), join(store, "child-terminal.json")])
}
const continuationClaimBodyV2 = (request: LeanBaselineContinuationRequestV2, window: LeanBaselineContinuationWindowV2, requestBytesRoot: LabRoot) => ({ schemaVersion: "lean-baseline-continuation-window-claim-v2", grantId: window.grantId, routeNamespace: window.routeNamespace, windowRoot: window.root, windowBytesRoot: request.windowBytesRoot, requestBytesRoot, sourceHead: request.sourceHead, sourceRoot: request.sourceRoot, sourceGateRoot: request.sourceGateRoot, dataReviewRoot: request.dataReviewRoot, planningRoot: request.planningRoot, manifestRoot: request.manifestRoot })
const continuationReviewRowsV2 = (manifest: ReturnType<typeof leanBaselineContinuationDataManifestV2>, sourceHead: string, window: LeanBaselineContinuationWindowV2): LeanContinuationReviewedRowV2[] => [...manifest.implementationEntries.map(row => ({ ...row, commit: sourceHead, kind: "reviewed_source" as const })), ...manifest.planningEntries.filter(row => row.path !== leanBaselineContinuationPathsForWindowV2(window).window).map(row => ({ ...row, commit: sourceHead, kind: "active_planning" as const }))]
type ContinuationRunStageV2 = "RUN_SCOPE" | "PREFLIGHT" | "ALLOCATION_JOIN" | "CLAIM_DIRECT_PARENT" | "MANIFEST_CARRY_HOLD" | "FULL_GUARD" | "CARRY_REAUTHENTICATION" | "PRE_ENTRY_BARRIER" | "PARENT_IMPORT" | "PARENT_READY" | "PARENT_CLAIM" | "PARENT_DISPATCH" | "PARENT_RELEASE" | "PARENT_TERMINAL"
// Hook counts, not inferred internal scans: source_callbacks counts the actual
// preflight source hook; descriptor_callbacks counts explicit request/admitted
// context read hooks. Carry's shared hook cannot truthfully split its internal
// inventory/source/descriptor sites, so that counter is deliberately combined.
const continuationRunCounterNamesV2 = ["guards_began", "guards_completed", "opening_began", "opening_completed", "closing_began", "closing_completed", "source_callbacks", "descriptor_callbacks", "carry_inventory_source_chunk_callbacks"] as const
type ContinuationRunCounterV2 = typeof continuationRunCounterNamesV2[number]
interface ContinuationRunDiagnosticV2 { active: boolean; stage: ContinuationRunStageV2; completed: boolean; counts: Record<ContinuationRunCounterV2, number> }
const continuationRunFailuresV2 = new WeakMap<object, Readonly<Omit<ContinuationRunDiagnosticV2, "active">>>()
const continuationRunUsedErrorsV2 = new WeakSet<object>()
// Native stack accessors are engine-owned on this host. Arbitrary accessors,
// proxies and structural errors never receive provenance, and none is invoked.
const continuationNativeStackV2 = Object.getOwnPropertyDescriptor(new Error(), "stack")
const continuationRunCountV2 = (d: ContinuationRunDiagnosticV2 | undefined, name: ContinuationRunCounterV2) => { if (d?.active) d.counts[name] = Math.min(1000000000, d.counts[name] + 1) }
const continuationRunStageV2 = (d: ContinuationRunDiagnosticV2 | undefined, stage: ContinuationRunStageV2, completed = false) => { if (d?.active) { d.stage = stage; d.completed = completed } }
const issueContinuationRunFailureV2 = (error: unknown, d: ContinuationRunDiagnosticV2): void => {
  if (error === null || typeof error !== "object" || leanHostIsProxy(error) || !leanHostIsNativeError(error)) return
  if (continuationRunUsedErrorsV2.has(error)) { continuationRunFailuresV2.delete(error); return }
  continuationRunUsedErrorsV2.add(error)
  const descriptors = Object.getOwnPropertyDescriptors(error)
  if (Reflect.ownKeys(descriptors).some(key => { const field = descriptors[key as string]!; return !("value" in field) && !(key === "stack" && field.get === continuationNativeStackV2?.get && field.set === continuationNativeStackV2?.set) })) return
  continuationRunFailuresV2.set(error, Object.freeze({ stage: d.stage, completed: d.completed, counts: Object.freeze({ ...d.counts }) }))
}
/** DORMANT finite private RUN attribution. Not connected to any CLI selector or
 * catch, artifact, journal or authority consumer. Never reads error fields. */
export const leanBaselineContinuationRunFailureV2 = (error: unknown): string => {
  const d = error !== null && typeof error === "object" ? continuationRunFailuresV2.get(error) : undefined
  return d ? `LEAN_BASELINE_RUN_${d.stage.startsWith("PARENT_") ? "PARENT" : "PREENTRY"} stage=${d.stage} completed=${d.completed} code=DETAILS_WITHHELD ${continuationRunCounterNamesV2.map(name => `${name}=${d.counts[name]}`).join(" ")}\n` : "LEAN_BASELINE_RUN_PREENTRY stage=UNKNOWN code=DETAILS_WITHHELD\n"
}
/** Private own-DATA capture, using the same hostile-input primitives as the
 * identity compiler. No getter/proxy is evaluated, no caller object frozen,
 * and no aliased/sparse/executable scope becomes a reusable expectation. */
const captureContinuationPreflightValueV6 = <T>(value: T): Readonly<T> => {
  const seen = new WeakSet<object>(); let nodes = 0
  const capture = (input: unknown): unknown => {
    if (input === null || typeof input === "string" || typeof input === "number" || typeof input === "boolean") return input
    if (typeof input !== "object" || leanHostIsProxy(input) || seen.has(input) || ++nodes > 4096) return fail("V6_PREFLIGHT_EXPECTATIONS")
    seen.add(input)
    const array = Array.isArray(input), prototype = Object.getPrototypeOf(input)
    if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) return fail("V6_PREFLIGHT_EXPECTATIONS")
    const fields = Object.getOwnPropertyDescriptors(input)
    if (Reflect.ownKeys(fields).some(key => typeof key !== "string" || !("value" in fields[key]!))) return fail("V6_PREFLIGHT_EXPECTATIONS")
    if (array) {
      const length: unknown = fields.length?.value
      if (!Number.isSafeInteger(length) || (length as number) < 0 || (length as number) > 1024 || Reflect.ownKeys(fields).length !== (length as number) + 1) return fail("V6_PREFLIGHT_EXPECTATIONS")
      const copy: unknown[] = []
      for (let i = 0; i < (length as number); i++) { if (!Object.hasOwn(fields, String(i))) return fail("V6_PREFLIGHT_EXPECTATIONS"); copy.push(capture(fields[String(i)]!.value)) }
      return Object.freeze(copy)
    }
    const copy: Record<string, unknown> = Object.create(null)
    for (const key of Object.keys(fields)) copy[key] = capture(fields[key]!.value)
    return Object.freeze(copy)
  }
  return capture(value) as Readonly<T>
}
// Pure arithmetic over a privately captured strictly validated window. Keep
// this body identical to continuationElapsedForValidatedWindowV2: public global
// floor, natural inputs/sum, backward clock, journal and monotonic floors.
const continuationPreflightElapsedV6 = (w: Readonly<LeanBaselineContinuationWindowV2>, nowMs: number, journalMs = 0, monotonicSinceAnchorMs = 0): number => {
  const natural = (n: number) => Number.isSafeInteger(n) && n >= 0
  if (!natural(nowMs) || nowMs < w.anchorMs || !natural(journalMs) || !natural(monotonicSinceAnchorMs)) throw new TypeError("LEAN_EXPERIMENT_CONTINUATION_V2_CLOCK")
  const elapsed = Math.max(leanContinuationGlobalFloorV2(nowMs), w.carryMs + Math.max(nowMs - w.anchorMs, monotonicSinceAnchorMs), journalMs)
  if (!natural(elapsed)) throw new TypeError("LEAN_EXPERIMENT_CONTINUATION_V2_CLOCK")
  return elapsed
}
/** Issued only by the actual unconsumed V6/V7 preflight after all strict joins and
 * real Git scope/ancestry checks. The exact window/context references stay in
 * this closure, never a root cache, ledger brand, serialized or exported mint. */
const compileContinuationPreflightExpectationsV6 = (window: LeanBaselineContinuationWindowV2, paths: typeof LEAN_BASELINE_CONTINUATION_PATHS_V6 | typeof LEAN_BASELINE_CONTINUATION_PATHS_V7 | typeof LEAN_BASELINE_CONTINUATION_PATHS_V8 | typeof LEAN_BASELINE_CONTINUATION_PATHS_V9, manifest: ReturnType<typeof leanBaselineContinuationDataManifestV2>, request: LeanBaselineContinuationRequestV2, requestBytesRoot: LabRoot, binding: object, fixedHead: string) => {
  const issuanceCwd = process.cwd()
  const w = validateLeanBaselineContinuationWindowV2(captureContinuationPreflightValueV6(window)), capturedPaths = captureContinuationPreflightValueV6(paths), rows = captureContinuationPreflightValueV6(manifest.entries), r = captureContinuationPreflightValueV6(request), scope = captureContinuationPreflightValueV6(binding)
  if ((paths !== LEAN_BASELINE_CONTINUATION_PATHS_V6 && paths !== LEAN_BASELINE_CONTINUATION_PATHS_V7 && (paths !== LEAN_BASELINE_CONTINUATION_PATHS_V8 && paths !== LEAN_BASELINE_CONTINUATION_PATHS_V9)) || leanBaselineContinuationPathsForWindowV2(w) !== paths || !Object.isFrozen(window) || !Object.isFrozen(window.approvalEvidence) || !Object.isFrozen(binding) || fixedHead !== r.sourceHead || !/^[a-f0-9]{40}$/u.test(fixedHead) || r.windowRoot !== w.root || r.windowBytesRoot !== leanBytesRoot(leanCanonicalBytes(w)) || r.sourceRoot !== w.sourceRoot || r.sourceGateRoot !== w.sourceGateRoot || r.planRoot !== w.planRoot || !ROOT(requestBytesRoot) || !exact(scope, binding)) return fail("V6_PREFLIGHT_EXPECTATIONS")
  const names = new Set(rows.map(row => row.path))
  // Complete wrapper scope predicates captured once. The literal HEAD branch
  // never uses allocation/show/rev-list/diff authority; those keep the wrapper.
  if (names.size !== rows.length || names.size > 1024 || rows.some(row => !/^sha256:[a-f0-9]{64}$/u.test(row.root) || !/^[A-Za-z0-9_./-]+$/u.test(row.path) || row.path.startsWith("/") || row.path.split("/").some(p => !p || p === "." || p === "..") || /preimage|secret/iu.test(row.path)) || labRoot("lean-baseline-continuation-data-manifest-v2", rows) !== r.manifestRoot || !exact(capturedPaths, paths)) return fail("V6_PREFLIGHT_EXPECTATIONS")
  const normalized = Object.freeze(Object.fromEntries(Object.entries(capturedPaths).map(([key, path]) => [key, resolve(issuanceCwd, path)])))
  // Readers retain their registered relative-name privacy predicates. CWD is
  // independently held before every current/admission/resource/HEAD/read hook,
  // so no absolute ancestor spelling widens or narrows the old lexical scope.
  const expectedInputs = Object.freeze([Object.freeze({ path: capturedPaths.window, root: r.windowBytesRoot }), Object.freeze({ path: capturedPaths.request, root: requestBytesRoot })])
  const assert = (candidate: object, exactWindow: LeanBaselineContinuationWindowV2) => { if (candidate !== binding || exactWindow !== window || process.pid !== (scope as { pid: number }).pid || process.cwd() !== issuanceCwd) return fail("V6_CONTEXT") }
  const admit = (candidate: object, exactWindow: LeanBaselineContinuationWindowV2, remainingSlots: number, journalMs = 0) => {
    assert(candidate, exactWindow)
    const now = Date.now(), elapsed = continuationPreflightElapsedV6(w, now, journalMs), reserve = remainingSlots === 0 ? 0 : remainingSlots * LEAN_CAPS.matchMs + w.closureMs + w.offlineOverheadMs
    if (!Number.isSafeInteger(remainingSlots) || remainingSlots < 0 || remainingSlots > 36 || now >= w.deadlineMs || now + reserve > w.deadlineMs || elapsed + reserve > w.capMs) return fail("V2_WINDOW_EXPIRED")
    return elapsed
  }
  const capacity = (candidate: object, exactWindow: LeanBaselineContinuationWindowV2, additional: number) => { admit(candidate, exactWindow, 0); continuationCapacityObservationV2(normalized.temp!, 88924160, additional, false) }
  const readHead = (candidate: object, exactWindow: LeanBaselineContinuationWindowV2) => {
    assert(candidate, exactWindow)
    // Same inherited cwd/env, ignored stdin/stderr, fresh process and bounds as
    // runLeanBoundedGitMetadata. No generic argv or native/read-result cache.
    const bytes = execFileSync("git", ["rev-parse", "HEAD"], { stdio: ["ignore", "pipe", "ignore"], timeout: 1500, maxBuffer: 128 })
    if (bytes.length > 128 || !/^[a-f0-9]{40}\n?$/u.test(bytes.toString("utf8"))) throw new TypeError("LEAN_BASELINE_CONTINUATION_GIT_V2_METADATA")
    return bytes.toString("utf8").trim()
  }
  return Object.freeze({ admit, capacity, readHead, expectedInputs })
}
const continuationPreflightV2 = (requestPath: string, consumed: boolean, reader: boolean, stage?: (value: LeanContinuationPreparationStageV4) => void, diagnostic?: ContinuationRunDiagnosticV2) => {
  stage?.("WINDOW"); leanBaselineContinuationPathsForRequestV2(requestPath)
  // This is the first external read. No directory, claim, allocation or cost
  // import is reachable before a genuine, exact approved record validates.
  const window = readLeanBaselineContinuationWindowV2(requestPath), paths = leanBaselineContinuationPathsForWindowV2(window); continuationWindowAdmissionV2(window, reader ? 0 : 36)
  const localReservation = (paths === LEAN_BASELINE_CONTINUATION_PATHS_V8 || paths === LEAN_BASELINE_CONTINUATION_PATHS_V9) ? createLeanContinuationLocalReservationV8(window, reader) : undefined
  localReservation?.reserve()
  if (!consumed && [paths.claim, paths.temp, paths.store, paths.allocation].some(path => existsSync(path))) return fail("V2_GRANT_CLAIMED")
  stage?.("SCOPE"); assertLeanBaselineContinuationScopeV2(!consumed, window); if (localReservation) localReservation.reserve(); else continuationCapacityV2(window, 88924160, 0, consumed)
  stage?.("SOURCE_DATA"); const source = leanBaselineContinuationSourceManifestV2(), manifest = leanBaselineContinuationDataManifestV2(window, source)
  stage?.("REQUEST"); const requestBytes = readLeanContinuationBoundedBytesV2(requestPath, 65536, 0o600, additional => { continuationRunCountV2(diagnostic, "descriptor_callbacks"); if (localReservation) localReservation.reserve(additional); else continuationCapacityV2(window, 88924160, additional, consumed) })
  const request = validateLeanBaselineContinuationRequestV2(JSON.parse(requestBytes.toString("utf8")), window, manifest)
  if (!requestBytes.equals(Buffer.from(leanCanonicalBytes(request)))) return fail("V2_REQUEST_CANONICAL")
  const git = (args: readonly string[]) => readLeanBaselineContinuationGitV2(args, manifest.entries, window)
  stage?.("SOURCE_IDENTITY"); const fixedHead = git(["rev-parse", "HEAD"]).toString("utf8").trim()
  if (!/^[a-f0-9]{40}$/u.test(fixedHead) || !consumed && fixedHead !== request.sourceHead) return fail("V2_SOURCE_HEAD")
  git(["merge-base", "--is-ancestor", window.reviewedSourceHead, request.sourceHead])
  const requestBytesRoot = leanBytesRoot(requestBytes)
  const pins = [...manifest.entries, { path: requestPath, root: requestBytesRoot }].map(row => ({ ...row, stat: lstatSync(resolve(row.path)) }))
  const identity = createLeanContinuationIdentityGuard(pins, [])
  const v6 = (paths === LEAN_BASELINE_CONTINUATION_PATHS_V6 || paths === LEAN_BASELINE_CONTINUATION_PATHS_V7 || (paths === LEAN_BASELINE_CONTINUATION_PATHS_V8 || paths === LEAN_BASELINE_CONTINUATION_PATHS_V9))
  const binding = Object.freeze({ pid: process.pid, fixedHead, reviewedSourceHead: window.reviewedSourceHead, sourceHead: request.sourceHead, sourceRoot: request.sourceRoot, planningRoot: request.planningRoot, manifestRoot: request.manifestRoot, requestBytesRoot, windowRoot: window.root, windowBytesRoot: request.windowBytesRoot, sourceGateRoot: request.sourceGateRoot, dataReviewRoot: request.dataReviewRoot, route: window.routeNamespace, grant: window.grantId })
  const preflightExpectations = v6 && !consumed ? compileContinuationPreflightExpectationsV6(window, paths, manifest, request, requestBytesRoot, binding, fixedHead) : undefined
  const current = (additionalBytes = 0) => {
    if (preflightExpectations) preflightExpectations.admit(binding, window, reader ? 0 : 36); else continuationWindowAdmissionV2(window, reader ? 0 : 36)
    const reserveCapacity = (bytes: number) => localReservation ? localReservation.reserve(bytes) : preflightExpectations ? preflightExpectations.capacity(binding, window, bytes) : continuationCapacityV2(window, 88924160, bytes, consumed)
    reserveCapacity(additionalBytes)
    if ((preflightExpectations ? preflightExpectations.readHead(binding, window) : git(["rev-parse", "HEAD"]).toString("utf8").trim()) !== fixedHead) return fail("V2_HEAD_CHANGED")
    if (v6) for (const row of preflightExpectations?.expectedInputs ?? [{ path: paths.window, root: request.windowBytesRoot }, { path: requestPath, root: requestBytesRoot }]) {
      const bytes = readLeanContinuationBoundedBytesV2(row.path, 65536, 0o600, reserve => reserveCapacity(reserve ?? 0))
      if (leanBytesRoot(bytes) !== row.root) return fail("V6_CONTEXT_BYTES")
    }
    if (localReservation) for (const row of manifest.planningEntries.filter(row => row.path !== paths.window)) {
      if (leanBytesRoot(readLeanContinuationBoundedBytesV2(row.path, 4194304, 0o644, bytes => reserveCapacity(bytes ?? 0))) !== row.root) return fail("V8_CONTEXT_BYTES")
    }
  }
  const roles = pins.map(row => ({ path: row.path, role: manifest.planningEntries.some(p => p.path === row.path) ? "active_planning" : row.path === requestPath ? "active_input" : "fixed_source" }))
  let controller = localReservation ? createLeanContinuationBoundaryControllerV8(pins, [], roles, binding, current, bytes => { localReservation.reserve(bytes) }) : v6 ? createLeanContinuationStageControllerV6(pins, [], roles, binding, current) : undefined
  const guard = (additionalBytes = 0) => {
    if (localReservation && controller) return (controller as ReturnType<typeof createLeanContinuationBoundaryControllerV8>).reserve(binding, additionalBytes)
    if (controller) return controller.live(binding, () => current(additionalBytes))
    current(additionalBytes); identity()
  }
  const stageBarrier = <T>(stage: LeanContinuationStageV6, body: () => T): T => controller ? controller.withStage(binding, stage, body) : body()
  const implementationPaths = new Set(manifest.implementationEntries.map(row => row.path)), committedPaths = new Set(manifest.entries.map(row => row.path))
  const sourceCallback = (additional?: number) => { continuationRunCountV2(diagnostic, "source_callbacks"); return guard(additional) }
  const authenticateSource = () => stageBarrier("source", () => {
  for (const row of manifest.implementationEntries) { guard(65536); authenticateLeanContinuationPinnedSource(row, window.reviewedSourceHead, implementationPaths, git, sourceCallback) }
  for (const row of manifest.entries.filter(row => row.path !== paths.window)) { guard(65536); authenticateLeanContinuationPinnedSource(row, request.sourceHead, committedPaths, git, sourceCallback) }
  guard()
  })
  authenticateSource()
  const bindArchive = (inventory: readonly LeanContinuationInventoryRowV2[]) => {
    if (!v6) return
    stageBarrier("bootstrap", () => guard())
    const livePaths = new Set(roles.filter(row => row.role !== "fixed_source").map(row => resolve(row.path)))
    const ancestors = new Set(continuationAncestorsV2([...manifest.entries.map(row => row.path), requestPath, paths.allocation, paths.store]).map(path => resolve(path)))
    const archiveRoles = inventory.map(row => ({ path: row.path, role: livePaths.has(resolve(row.path)) ? "active_input" : row.kind === "directory" ? ancestors.has(resolve(row.path)) ? "active_directory" : "closed_directory" : "closed_history" }))
    const directoryPolicy = (path: string, members: readonly string[]) => {
      const rows = inventory.filter(row => row.kind === "directory" && resolve(row.path) === path)
      const added = [paths.temp, paths.store, paths.allocation].filter(name => resolve(dirname(name)) === path).map(name => name.slice(dirname(name) === "." ? 0 : dirname(name).length + 1))
      if (!rows.length || rows.some(row => !row.members || members.some(name => !row.members!.includes(name) && !added.includes(name)))) return fail("V6_SETUP_MEMBERS")
    }
    controller = localReservation ? createLeanContinuationBoundaryControllerV8(pins, inventory, [...roles, ...archiveRoles], binding, current, bytes => { localReservation.reserve(bytes) }, directoryPolicy) : createLeanContinuationStageControllerV6(pins, inventory, [...roles, ...archiveRoles], binding, current, directoryPolicy)
    stageBarrier("bootstrap", () => guard())
  }
  return { paths, window, source, manifest, request, requestBytesRoot, git, fixedHead, guard, binding, stage: stageBarrier, authenticateSource, bindArchive, localReservation }
}
const continuationStatRowV2 = (path: string): LeanContinuationInventoryRowV2 => {
  const absolute = resolve(path), s = lstatSync(absolute)
  if (s.isSymbolicLink() || s.uid !== process.getuid?.() || realpathSync(absolute) !== absolute || !s.isFile() && !s.isDirectory() || s.isFile() && s.nlink !== 1) return fail("V2_FILE_IDENTITY")
  const members = s.isDirectory() ? readdirSync(absolute).sort() : undefined
  if (members && members.length > 4096) return fail("V2_DIRECTORY_BOUND")
  return { path, kind: s.isDirectory() ? "directory" : "file", bytes: s.size, allocatedBytes: s.blocks * 512, dev: s.dev, ino: s.ino, mode: s.mode & 0o777, mtimeMs: s.mtimeMs, ctimeMs: s.ctimeMs, rawRoot: null, ...(members ? { members } : {}) }
}
const continuationAncestorsV2 = (paths: readonly string[]): string[] => {
  const ancestors = new Set<string>()
  for (const path of paths) for (let parent = dirname(path);; parent = dirname(parent)) { ancestors.add(parent); if (parent === ".") break }
  if (ancestors.size > 1024) return fail("V2_ANCESTOR_BOUND")
  return [...ancestors].sort()
}
/** Pure bounded setup transition: only the registered three new identities. */
export const validateLeanContinuationSetupDirectoriesV2 = (before: readonly LeanContinuationInventoryRowV2[], after: readonly LeanContinuationInventoryRowV2[], window?: LeanBaselineContinuationWindowV2): void => {
  const paths = window === undefined ? CONTINUATION_V2 : leanBaselineContinuationPathsForWindowV2(window)
  if (before.length !== after.length || before.length > 1024 || new Set(before.map(row => row.path)).size !== before.length || new Set(after.map(row => row.path)).size !== after.length) return fail("V2_SETUP_DIRECTORIES")
  for (const old of before) {
    const current = after.find(row => row.path === old.path)
    const added = [paths.temp, paths.store, paths.allocation].filter(path => dirname(path) === old.path).map(path => path.slice(old.path === "." ? 0 : old.path.length + 1))
    if (!current || old.kind !== "directory" || current.kind !== "directory" || current.dev !== old.dev || current.ino !== old.ino || current.mode !== old.mode || current.allocatedBytes < old.allocatedBytes || !old.members || !current.members || !exact(current.members, [...old.members, ...added].sort()) || added.length === 0 && (current.bytes !== old.bytes || current.mtimeMs !== old.mtimeMs || current.ctimeMs !== old.ctimeMs)) return fail("V2_SETUP_DIRECTORIES")
  }
}
type LeanContinuationPreparationStageV4 = "WINDOW" | "SCOPE" | "SOURCE_DATA" | "REQUEST" | "SOURCE_IDENTITY" | "CARRY" | "SETUP" | "PUBLICATION" | "UNKNOWN"
type LeanContinuationPreparationCodeV4 = "WINDOW_EXPIRED" | "WINDOW_NAMESPACE" | "GRANT_CLAIMED" | "SCOPE" | "CAPACITY" | "SOURCE_GATE" | "DATA_GATE" | "SOURCE_MANIFEST" | "REQUEST" | "SOURCE_HEAD" | "DETAILS_WITHHELD"
const continuationPreparationFailuresV4 = new WeakMap<object, { stage: LeanContinuationPreparationStageV4; code: LeanContinuationPreparationCodeV4 }>()
export const leanContinuationPreparationCodeV4 = (error: unknown): LeanContinuationPreparationCodeV4 => {
  const codes: Readonly<Record<string, LeanContinuationPreparationCodeV4>> = { LEAN_BASELINE_V2_WINDOW_EXPIRED: "WINDOW_EXPIRED", LEAN_BASELINE_V2_WINDOW_NAMESPACE: "WINDOW_NAMESPACE", LEAN_BASELINE_V2_GRANT_CLAIMED: "GRANT_CLAIMED", LEAN_BASELINE_V2_SCOPE: "SCOPE", LEAN_BASELINE_V2_CAPACITY: "CAPACITY", LEAN_BASELINE_V2_SOURCE_GATE: "SOURCE_GATE", LEAN_BASELINE_V2_DATA_GATE: "DATA_GATE", LEAN_BASELINE_V2_SOURCE_MANIFEST: "SOURCE_MANIFEST", LEAN_BASELINE_V2_REQUEST: "REQUEST", LEAN_BASELINE_V2_SOURCE_HEAD: "SOURCE_HEAD" }
  try { if (!(error instanceof TypeError)) return "DETAILS_WITHHELD"; const message: unknown = Object.getOwnPropertyDescriptor(error, "message")?.value; return typeof message === "string" && Object.prototype.hasOwnProperty.call(codes, message) ? codes[message]! : "DETAILS_WITHHELD" } catch { return "DETAILS_WITHHELD" }
}
/** Finite attribution only; never formats raw errors or grants authority. */
export const leanBaselineContinuationPreparationFailureV4 = (error: unknown): string => {
  const failure = error !== null && typeof error === "object" ? continuationPreparationFailuresV4.get(error) : undefined
  return `LEAN_BASELINE_PREPARATION_V4 stage=${failure?.stage ?? "UNKNOWN"} code=${failure?.code ?? "DETAILS_WITHHELD"}\n`
}
export const prepareLeanBaselineContinuationV2 = (requestPath: string) => {
  let stage: LeanContinuationPreparationStageV4 = "WINDOW"
  try {
  const c = continuationPreflightV2(requestPath, false, false, value => { stage = value })
  stage = "CARRY"
  const carried = c.stage("archive", () => authenticateLeanBaselineContinuationCarryV2(c.git, continuationReviewRowsV2(c.manifest, c.request.sourceHead, c.window), c.guard, c.window))
  c.localReservation?.reconcileAuthenticated(carried.carry.allocatedDiskBytes)
  if (carried.carry.elapsedUpperBoundMs > c.window.carryMs) return fail("V2_CARRY_TIME")
  c.bindArchive(carried.inventory)
  const priorGuard = (c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V6 || c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V7 || (c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V8 || c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V9)) ? () => {} : createLeanContinuationIdentityGuardV2([], carried.inventory)
  stage = "SETUP"
  const ancestors = continuationAncestorsV2([...c.manifest.entries.map(row => row.path), requestPath, c.paths.allocation, c.paths.store]), before = ancestors.map(continuationStatRowV2)
  c.guard(); priorGuard(); continuationCapacityV2(c.window, carried.carry.allocatedDiskBytes)
  if ([c.paths.temp, c.paths.store, c.paths.allocation].some(path => existsSync(path))) return fail("V2_GRANT_CLAIMED")
  // Exclusive scratch creation is the concurrency barrier. A partial failure
  // consumes this namespace even if it never publishes an allocation.
  stage = "PUBLICATION"
  return c.stage("prepare", () => {
  c.localReservation?.reserveWrite(3 * 65536, c.paths.claim)
  mkdirSync(c.paths.temp, { mode: 0o700 })
  const body = continuationClaimBodyV2(c.request, c.window, c.requestBytesRoot), claim = { ...body, root: labRoot(body.schemaVersion, body) }
  const fd = openSync(c.paths.claim, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
  try { writeLeanAll(fd, leanCanonicalBytes(claim)); fsyncSync(fd) } finally { closeSync(fd) }
  c.localReservation?.completeWrite(c.paths.claim)
  c.guard(); priorGuard(); continuationCapacityV2(c.window, carried.carry.allocatedDiskBytes, 1048576, true)
  c.localReservation?.reserveWrite(1048576, join(c.paths.store, "allocation.json"))
  c.localReservation?.reserveWrite(4096, join(c.paths.store, "ledger.ndjson")); c.localReservation?.reserveWrite(4096, join(c.paths.store, "time.ndjson"))
  const allocation = createLeanBaselineContinuationAllocationV2({ sourceRoot: c.request.sourceRoot, reviewRoot: c.request.reviewRoot, coldRoot: c.request.coldRoot, planRoot: c.request.planRoot, candidateRoots: c.request.candidateRoots, requestRoots: c.request.requestRoots, seed: c.request.seed, sourceHead: c.request.sourceHead, planningRoot: c.request.planningRoot, manifestRoot: c.request.manifestRoot, requestBytesRoot: c.requestBytesRoot, window: c.window, windowBytesRoot: c.request.windowBytesRoot, sourceGateRoot: c.request.sourceGateRoot, dataReviewRoot: c.request.dataReviewRoot, predecessor: carried.carry })
  const ledger = createLeanLedger(c.paths.store, allocation)
  for (const name of ["allocation.json", "ledger.ndjson", "time.ndjson"]) c.localReservation?.completeWrite(join(c.paths.store, name))
  c.localReservation?.reserveWrite(3 * 4194304, join(c.paths.store, "carry.json"))
  c.guard(); writeLeanContinuationArtifact(ledger, "carry.json", carried, 4194304)
  c.localReservation?.completeWrite(join(c.paths.store, "carry.json"))
  c.localReservation?.reserveWrite(3 * 4194304, join(c.paths.store, "source-manifest.json"))
  c.guard(); writeLeanContinuationArtifact(ledger, "source-manifest.json", c.manifest, 4194304)
  c.localReservation?.completeWrite(join(c.paths.store, "source-manifest.json"))
  c.guard()
  c.localReservation?.reserveWrite(3 * 262144, c.paths.allocation)
  const allocationFd = openSync(c.paths.allocation, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o644)
  try { fchmodSync(allocationFd, 0o644); writeLeanAll(allocationFd, leanCanonicalBytes(allocation)); fsyncSync(allocationFd) } finally { closeSync(allocationFd) }
  c.localReservation?.completeWrite(c.paths.allocation)
  for (const path of [c.paths.temp, dirname(c.paths.allocation), dirname(c.paths.store)]) { const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW); try { fsyncSync(fd) } finally { closeSync(fd) } }
  const after = ancestors.map(continuationStatRowV2); validateLeanContinuationSetupDirectoriesV2(before, after, c.window)
  c.guard(); priorGuard()
  c.localReservation?.reserveWrite(3 * 4194304, join(c.paths.store, "source-hold.json"))
  const rows = [...after, ...[c.paths.window, requestPath, c.paths.claim, c.paths.allocation, c.paths.temp].map(continuationStatRowV2)]
  const holdBody = { schemaVersion: "lean-baseline-continuation-source-hold-v2", allocationRoot: allocation.root, sourceHead: allocation.sourceHead, manifestRoot: allocation.manifestRoot, claimRoot: claim.root, rows }
  writeLeanContinuationArtifact(ledger, "source-hold.json", { ...holdBody, root: labRoot(holdBody.schemaVersion, holdBody) }, 4194304)
  c.localReservation?.completeWrite(join(c.paths.store, "source-hold.json"))
  c.guard(); createLeanContinuationIdentityGuardV2([], rows)(); continuationCapacityV2(c.window, cumulativeLeanPhysicalBytes(ledger), 0, true)
  return { schemaVersion: "lean-baseline-continuation-prepared-v2", allocationRoot: allocation.root, allocationPath: c.paths.allocation, sourceHead: allocation.sourceHead, store: c.paths.store, grantId: c.window.grantId, claimRoot: claim.root, charged: 50, plannedCurrentCells: 36, holdoutReservations: allocation.holdoutReservations, issued: false }
  })
  } catch (error) {
    if ((requestPath === LEAN_BASELINE_CONTINUATION_PATHS_V4.request || requestPath === LEAN_BASELINE_CONTINUATION_PATHS_V5.request || requestPath === LEAN_BASELINE_CONTINUATION_PATHS_V6.request || requestPath === LEAN_BASELINE_CONTINUATION_PATHS_V7.request || (requestPath === LEAN_BASELINE_CONTINUATION_PATHS_V8.request || requestPath === LEAN_BASELINE_CONTINUATION_PATHS_V9.request)) && error !== null && typeof error === "object") continuationPreparationFailuresV4.set(error, { stage, code: leanContinuationPreparationCodeV4(error) })
    throw error
  }
}

const continuationStoreMembershipV2 = (ledger: LeanExperimentLedger): void => {
  const state = readLeanLedger(ledger)
  const allowed = new Set(["allocation.json", "ledger.ndjson", "time.ndjson", "carry.json", "source-manifest.json", "source-hold.json", "run-claim.json", "reader-claim.json", "entry.json", "child-terminal.json", "entry-failure.json", "result.json", "retained-check.json", LEAN_SUPERVISOR_REASON_FILE, "seal-metadata.json", "cold-corpus.json", "initial-proposals.json", "initial-selection.json", "initial-training.json", "initial-analysis.json", "response-work.json", "response-node-receipts.json", "response-training.json", "work-accounting.json", "current-analysis.json"])
  for (const role of ["cold-opponent", "probe", ...Array.from({ length: 4 }, (_, i) => `tactical-${i}`), "teacher-0", "initial-tactical", "initial-teacher", "response-0", "final-response"]) { allowed.add(`source-${role}.json`); allowed.add(`publication-${role}-continuation-v2.json`) }
  for (let i = 0; i < 36; i++) { allowed.add(`pair-${i}.json`); allowed.add(`observation-${i}.json`) }
  for (const charge of state.charges.values()) { allowed.add(`${charge.root.slice(7)}.gz`); allowed.add(`diagnostic-${charge.root.slice(7)}.json`) }
  const members = readdirSync(ledger.directory)
  if (members.length > allowed.size || members.some(name => !allowed.has(name))) return fail("V2_STORE_MEMBERS")
  for (const name of members) { const path = resolve(ledger.directory, name), s = lstatSync(path); if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || s.uid !== process.getuid?.() || (s.mode & 0o777) !== 0o600 || realpathSync(path) !== path) return fail("V2_STORE_FILE") }
}
export const openLeanBaselineContinuationContextV2 = (requestPath: string, reader = false, observeImport?: () => void) => openContinuationContextV2(requestPath, reader, undefined, observeImport)
const openContinuationContextV2 = (requestPath: string, reader: boolean, diagnostic?: ContinuationRunDiagnosticV2, observeImport?: () => void) => {
  continuationRunStageV2(diagnostic, "PREFLIGHT")
  const c = continuationPreflightV2(requestPath, true, reader, undefined, diagnostic)
  continuationRunStageV2(diagnostic, "PREFLIGHT", true); continuationRunStageV2(diagnostic, "ALLOCATION_JOIN")
  const openMetadata = () => { const ledger = openLeanLedger(c.paths.store); return { ledger, allocation: readLeanAdmittedContinuationAllocationV2(ledger) } }
  const { ledger, allocation } = c.localReservation ? c.stage("import", () => { c.localReservation!.reserve(CONTINUATION_V2_METADATA_PARSE_RESERVE); return openMetadata() }) : withLeanContinuationStoreMetadataV2(c.window, openMetadata)
  continuationRunStageV2(diagnostic, "ALLOCATION_JOIN", true); continuationRunStageV2(diagnostic, "CLAIM_DIRECT_PARENT")
  const expectedClaimBody = continuationClaimBodyV2(c.request, c.window, c.requestBytesRoot), expectedClaim = { ...expectedClaimBody, root: labRoot(expectedClaimBody.schemaVersion, expectedClaimBody) }
  const claim = readLeanContinuationJsonV2(c.paths.claim, 65536, 0o600, c.guard)
  if (!exact(claim, expectedClaim) || allocation.requestBytesRoot !== c.requestBytesRoot || allocation.sourceHead !== c.request.sourceHead || allocation.sourceRoot !== c.manifest.root || allocation.planningRoot !== c.manifest.planningRoot || allocation.manifestRoot !== c.manifest.manifestRoot || !exact(allocation.window, c.window) || allocation.windowBytesRoot !== c.manifest.windowBytesRoot || allocation.sourceGateRoot !== c.manifest.sourceGateRoot || allocation.dataReviewRoot !== c.manifest.dataReviewRoot || allocation.reviewRoot !== c.request.reviewRoot || allocation.coldRoot !== c.request.coldRoot || allocation.seed !== c.request.seed || !exact(allocation.requestRoots, c.request.requestRoots) || !exact([...allocation.candidateRoots].sort(), [...c.request.candidateRoots].sort())) return fail("V2_ALLOCATION_JOIN")
  const allocationBytes = readLeanContinuationBoundedBytesV2(c.paths.allocation, 262144, 0o644, c.guard)
  if (!allocationBytes.equals(Buffer.from(leanCanonicalBytes(allocation)))) return fail("V2_ALLOCATION_BYTES")
  assertLeanContinuationDirectParent(c.fixedHead, allocation.sourceHead, c.git(["rev-list", "--parents", "-n", "1", c.fixedHead]).toString("utf8").trim().split(/\s+/u), allocationBytes, c.git(["show", `${c.fixedHead}:${c.paths.allocation}`]))
  if (c.git(["diff", "--name-only", allocation.sourceHead, c.fixedHead]).toString("utf8").trim() !== c.paths.allocation) return fail("V2_ALLOCATION_DIFF")
  continuationRunStageV2(diagnostic, "CLAIM_DIRECT_PARENT", true); continuationRunStageV2(diagnostic, "MANIFEST_CARRY_HOLD")
  const storedManifest = readLeanContinuationJsonV2(join(ledger.directory, "source-manifest.json"), 4194304, 0o600, c.guard)
  if (!exact(storedManifest, c.manifest)) return fail("V2_MANIFEST_CHANGED")
  const carry = readLeanContinuationJsonV2(join(ledger.directory, "carry.json"), 4194304, 0o600, c.guard)
  if (!exact(carry.carry, allocation.predecessor) || !Array.isArray(carry.inventory) || carry.inventory.length > 4096 || labRoot("lean-baseline-continuation-inventory-v2", carry.inventory) !== allocation.predecessor.inventoryRoot || labRoot("lean-baseline-continuation-custody-v2", carry.custody) !== allocation.predecessor.custodyRoot || labRoot("lean-baseline-continuation-closed-capsule-v2", carry.custody) !== allocation.predecessor.closedCapsuleRoot) return fail("V2_CARRY")
  const hold = readLeanContinuationJsonV2(join(ledger.directory, "source-hold.json"), 4194304, 0o600, c.guard), { root: holdRoot, ...holdBody } = hold
  if (!exactLabKeys(hold, ["schemaVersion", "allocationRoot", "sourceHead", "manifestRoot", "claimRoot", "rows", "root"]) || hold.schemaVersion !== "lean-baseline-continuation-source-hold-v2" || holdRoot !== labRoot(hold.schemaVersion, holdBody) || hold.allocationRoot !== allocation.root || hold.sourceHead !== allocation.sourceHead || hold.manifestRoot !== allocation.manifestRoot || hold.claimRoot !== claim.root || !Array.isArray(hold.rows) || hold.rows.length > 1024) return fail("V2_SOURCE_HOLD")
  const pinned = [...c.manifest.entries.map(row => row.path), requestPath, c.paths.claim, c.paths.allocation, ...["allocation.json", "carry.json", "source-manifest.json", "source-hold.json"].map(name => join(ledger.directory, name))].map(path => ({ path, stat: lstatSync(resolve(path)) }))
  const v6 = (c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V6 || c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V7 || (c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V8 || c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V9))
  const survivors = [...carry.inventory as LeanContinuationInventoryRowV2[], ...hold.rows as LeanContinuationInventoryRowV2[]]
  const identities = v6 ? () => {} : createLeanContinuationIdentityGuardV2(pinned, survivors)
  let controller: ReturnType<typeof createLeanContinuationStageControllerV6> | ReturnType<typeof createLeanContinuationBoundaryControllerV8> | undefined
  const binding = Object.freeze({ ...c.binding, allocationRoot: allocation.root, carryRoot: allocation.predecessor.root, claimRoot: claim.root, ledger })
  c.localReservation?.bindProgress(ledger)
  continuationRunStageV2(diagnostic, "MANIFEST_CARRY_HOLD", true)
  const startWall = Date.now(), startMono = process.hrtime.bigint()
  const guardedMetadataPaths = [c.paths.allocation, join(ledger.directory, "allocation.json"), join(ledger.directory, "ledger.ndjson"), join(ledger.directory, "time.ndjson")] as const
  const optionalExecutionReceiptPaths = [join(ledger.directory, "entry.json"), join(ledger.directory, "child-terminal.json")]
  // Only after the live descriptor/canonical/full-window joins above. No caller
  // window becomes trusted; capacity derives from this exact admitted ledger.
  const reserveMetadata = (bytes: number) => { if (c.localReservation) c.localReservation.reserve(bytes); else continuationCapacityV2(allocation.window, cumulativeLeanPhysicalBytes(ledger), bytes, true, ledger) }
  const descriptor = (path: string, maximum: number, mode: number, guard: (additional?: number) => void) => readLeanContinuationBoundedBytesV2(path, maximum, mode, additional => { continuationRunCountV2(diagnostic, "descriptor_callbacks"); return guard(additional) })
  let closure = reader, closureBegan = reader ? withLeanContinuationDescriptorPreflightV2(guardedMetadataPaths, reserveMetadata, descriptor, () => readLeanTimeAccounting(ledger).closes.get("pilot-entry") ?? startWall, 0, optionalExecutionReceiptPaths) : startWall, active = false, expectedLedger: LabRoot | undefined
  const sampleGuard = (additionalBytes = 0) => {
    const previousStage = diagnostic?.stage, previousCompleted = diagnostic?.completed
    continuationRunStageV2(diagnostic, "FULL_GUARD"); continuationRunCountV2(diagnostic, "guards_began")
    if (!Number.isSafeInteger(additionalBytes) || additionalBytes < 0 || Date.now() < startWall || c.git(["rev-parse", "HEAD"]).toString("utf8").trim() !== c.fixedHead) return fail("V2_HOLD")
    let metadataReserveBytes = additionalBytes + CONTINUATION_V2_METADATA_PARSE_RESERVE
    const sample = withLeanContinuationDescriptorPreflightV2(guardedMetadataPaths, bytes => { metadataReserveBytes = bytes; reserveMetadata(bytes) }, descriptor, () => {
    continuationRunCountV2(diagnostic, "opening_began"); identities(); continuationRunCountV2(diagnostic, "opening_completed"); continuationStoreMembershipV2(ledger)
    // No recursive callback: the outer complete observation surrounds this
    // descriptor read. Its small reservation is included in the final sample.
    const journal = descriptor(join(ledger.directory, "ledger.ndjson"), 4194304, 0o600, bytes => reserveMetadata(additionalBytes + CONTINUATION_V2_METADATA_PARSE_RESERVE + (bytes ?? 0)))
    if (expectedLedger && leanBytesRoot(journal) !== expectedLedger) return fail("V2_LEDGER_CHANGED")
    const state = readLeanLedger(ledger), nowMs = Date.now(), usage = process.memoryUsage(), fs = statfsSync(ledger.directory, { bigint: true }), child = process.connected ? process.pid : 0, parent = process.connected ? process.ppid : process.pid
    c.localReservation?.setRemainingSlots(closure ? 0 : 36 - state.terminals.size)
    if (state.stopped && !closure) { closure = true; closureBegan = readLeanTimeAccounting(ledger).closes.get("pilot-entry") ?? nowMs }
    const elapsedMono = process.hrtime.bigint() - startMono
    if (elapsedMono < 0n || elapsedMono > BigInt(Number.MAX_SAFE_INTEGER) * 1000000n || child && process.ppid !== readLeanChildEntry(ledger).parentPid) return fail("V2_LIVENESS")
    let growth = 0
    if (c.localReservation) for (const row of carry.inventory as LeanContinuationInventoryRowV2[]) { const s = lstatSync(resolve(row.path)); if (!Number.isSafeInteger(s.blocks * 512) || s.blocks * 512 < row.allocatedBytes) return fail("V8_SURVIVOR_SHRINK"); growth += s.blocks * 512 - row.allocatedBytes }
    c.localReservation?.observeGrowth(growth)
    const sample = { nowMs, monotonicElapsedMs: Math.max(0, startWall - c.window.anchorMs) + Number((elapsedMono + 999999n) / 1000000n), remainingSlots: closure ? 0 : c.localReservation ? 36 - state.terminals.size : 36 - state.charges.size + (active ? 1 : 0), ...(closure ? { remainingClosureMs: Math.max(0, c.window.closureMs - Math.max(0, nowMs - closureBegan)), remainingOfflineMs: 0 } : {}), charged: state.charged, retainedBytes: cumulativeLeanPhysicalBytes(ledger) + growth, scratchBytes: measureLeanPhysicalBytes(c.paths.temp) + metadataReserveBytes, parentRssBytes: child ? rssOf(parent) : usage.rss, childRssBytes: child ? usage.rss : 0, arrayBuffersBytes: usage.arrayBuffers + metadataReserveBytes, availableMemoryBytes: observeLeagueAvailableMemoryBytes(), freeBytes: Number(fs.bavail * fs.bsize), live: !child || process.connected === true }
    assertLeanBaselineContinuationFrontierV2(allocation, sample, ledger)
    if (currentLeanElapsedMs(ledger) + sample.remainingSlots * LEAN_CAPS.matchMs + (sample.remainingClosureMs ?? c.window.closureMs) + (sample.remainingOfflineMs ?? c.window.offlineOverheadMs) > allocation.caps.elapsedMs) return fail("V2_JOURNAL_FRONTIER")
    continuationRunCountV2(diagnostic, "closing_began"); identities(); continuationRunCountV2(diagnostic, "closing_completed"); return sample
    }, additionalBytes, optionalExecutionReceiptPaths)
    continuationRunCountV2(diagnostic, "guards_completed")
    if (previousStage !== undefined) continuationRunStageV2(diagnostic, previousStage, previousCompleted)
    return sample
  }
  const planningPaths = new Set(c.manifest.planningEntries.map(row => resolve(row.path))), implementationPaths = new Set(c.manifest.implementationEntries.map(row => resolve(row.path)))
  const pinnedRoles = pinned.map(row => ({ path: row.path, role: implementationPaths.has(resolve(row.path)) && !planningPaths.has(resolve(row.path)) ? "fixed_source" : "active_input" }))
  const livePinnedPaths = new Set(pinnedRoles.filter(row => row.role !== "fixed_source").map(row => resolve(row.path)))
  const survivorRoles = survivors.map(row => ({ path: row.path, role: livePinnedPaths.has(resolve(row.path)) ? "active_input" : (hold.rows as LeanContinuationInventoryRowV2[]).includes(row) ? row.kind === "directory" ? "active_directory" : "active_input" : row.kind === "directory" ? "closed_directory" : "closed_history" }))
  const directoryPolicy = (path: string, members: readonly string[]) => {
    if (path === resolve(c.paths.temp)) { if (!exact(members, ["window-claim.json"])) return fail("V6_SCRATCH_MEMBERS"); return }
    const rows = (hold.rows as LeanContinuationInventoryRowV2[]).filter(row => resolve(row.path) === path && row.kind === "directory")
    if (!rows.length || rows.some(row => !exact(members, row.members))) return fail("V6_DIRECTORY_MEMBERS")
  }
  // Exact bytes of every active pinned input are fresh; allocation/ledger/time
  // descriptors retain the reserve-only nested seam, never a complete guard.
  const expectedRaw = new Map(c.manifest.planningEntries.map(row => [resolve(row.path), row.root]))
  expectedRaw.set(resolve(requestPath), c.requestBytesRoot); expectedRaw.set(resolve(c.paths.claim), leanBytesRoot(leanCanonicalBytes(claim))); expectedRaw.set(resolve(c.paths.allocation), leanBytesRoot(leanCanonicalBytes(allocation)))
  for (const [name, value] of [["allocation.json", allocation], ["carry.json", carry], ["source-manifest.json", c.manifest], ["source-hold.json", hold]] as const) expectedRaw.set(resolve(ledger.directory, name), leanBytesRoot(leanCanonicalBytes(value)))
  const liveRaw = v6 ? pinnedRoles.filter(row => row.role !== "fixed_source").map(row => { const root = expectedRaw.get(resolve(row.path)); if (!root) return fail("V6_CONTEXT_SCOPE"); return { path: row.path, root } }) : []
  const current = () => {
    if (c.git(["rev-parse", "HEAD"]).toString("utf8").trim() !== c.fixedHead) return fail("V2_HEAD_CHANGED")
    for (const row of liveRaw) {
      const mode = row.path === c.paths.allocation ? 0o644 : c.manifest.planningEntries.some(p => p.path === row.path && row.path !== c.paths.window) ? 0o644 : 0o600
      if (leanBytesRoot(descriptor(row.path, row.path === c.paths.allocation ? 262144 : 4194304, mode, bytes => reserveMetadata(bytes ?? 0))) !== row.root) return fail("V6_CONTEXT_BYTES")
    }
  }
  if (c.localReservation) controller = createLeanContinuationBoundaryControllerV8(pinned, survivors, [...pinnedRoles, ...survivorRoles], binding, () => { current(); sampleGuard() }, bytes => { c.localReservation!.reserve(bytes) }, directoryPolicy)
  else if (v6) controller = createLeanContinuationStageControllerV6(pinned, survivors, [...pinnedRoles, ...survivorRoles], binding, current, directoryPolicy)
  const guard = (additionalBytes = 0) => { if (c.localReservation) { if (controller && "reserve" in controller) (controller as ReturnType<typeof createLeanContinuationBoundaryControllerV8>).reserve(binding, additionalBytes); return c.localReservation.reserve(additionalBytes) }; return controller ? controller.live(binding, () => sampleGuard(additionalBytes)) : sampleGuard(additionalBytes) }
  const stage = <T>(kind: LeanContinuationStageV6, body: () => T): T => controller ? controller.withStage(binding, kind, () => { guard(); const result = body(); guard(); return result }) : body()
  guard()
  continuationRunStageV2(diagnostic, "CARRY_REAUTHENTICATION")
  const carryCallback = (additional?: number) => { continuationRunCountV2(diagnostic, "carry_inventory_source_chunk_callbacks"); return guard(additional) }
  try { observeImport?.() } catch { /* A checking-only observer cannot alter admission. */ }
  stage("archive", () => { const authenticated = authenticateLeanBaselineContinuationCarryV2(c.git, continuationReviewRowsV2(c.manifest, allocation.sourceHead, c.window), carryCallback, c.window); if (!exact(authenticated, carry)) return fail("V2_CARRY_CHANGED"); c.localReservation?.reconcileAuthenticated(authenticated.carry.allocatedDiskBytes) })
  continuationRunStageV2(diagnostic, "CARRY_REAUTHENTICATION", true)
  guard()
  const authenticateSource = () => stage("source", () => {
    const fresh = leanBaselineContinuationDataManifestV2(c.window, leanBaselineContinuationSourceManifestV2())
    if (!exact(fresh, c.manifest)) return fail("V2_MANIFEST_HOLD")
    const implementations = new Set(c.manifest.implementationEntries.map(row => row.path)), committed = new Set(c.manifest.entries.map(row => row.path))
    for (const row of c.manifest.implementationEntries) { guard(65536); authenticateLeanContinuationPinnedSource(row, c.window.reviewedSourceHead, implementations, c.git, guard) }
    for (const row of c.manifest.entries.filter(row => row.path !== c.paths.window)) { guard(65536); authenticateLeanContinuationPinnedSource(row, allocation.sourceHead, committed, c.git, guard) }
    return fresh.root
  })
  return { ...c, ledger, allocation, carry, claim, guard, stage, authenticateSource, fullSample: sampleGuard, startCell() { active = true; expectedLedger = leanBytesRoot(descriptor(join(ledger.directory, "ledger.ndjson"), 4194304, 0o600, bytes => reserveMetadata(bytes ?? 0))); guard() }, finishCell() { active = false; expectedLedger = undefined; if (v6 && !c.localReservation) guard() }, closeRun() { active = false; expectedLedger = undefined; closure = true; closureBegan = Date.now(); c.localReservation?.closeRun() }, invalidate() { controller?.invalidate(); c.localReservation?.invalidate() } }
}
export const runLeanBaselineContinuationV2 = async (requestPath: string) => {
  const diagnostic: ContinuationRunDiagnosticV2 = { active: true, stage: "RUN_SCOPE", completed: false, counts: Object.fromEntries(continuationRunCounterNamesV2.map(name => [name, 0])) as Record<ContinuationRunCounterV2, number> }
  let c: ReturnType<typeof openContinuationContextV2>
  try {
    if (process.send || process.connected) return fail("V2_RUN_SCOPE")
    continuationRunStageV2(diagnostic, "RUN_SCOPE", true)
    c = openContinuationContextV2(requestPath, false, diagnostic)
    const { ledger } = c
    continuationRunStageV2(diagnostic, "PRE_ENTRY_BARRIER")
    if (readLeanLedger(ledger).events.length || readLeanTimeAccounting(ledger).starts.size || readdirSync(ledger.directory).some(name => ["run-claim.json", "entry.json", "child-terminal.json", "result.json", "reader-claim.json"].includes(name))) return fail("V2_RUN_USED")
    c.guard()
    c.stage("claim", () => {
    c.localReservation?.reserveWrite(3 * 65536, join(ledger.directory, "run-claim.json")); c.localReservation?.reserveWrite(16384, join(ledger.directory, "time.ndjson"))
    writeLeanContinuationArtifact(ledger, "run-claim.json", { schemaVersion: "lean-baseline-continuation-run-claim-v2", allocationRoot: c.allocation.root, windowRoot: c.window.root, requestBytesRoot: c.requestBytesRoot, head: c.fixedHead, runOperator: c.request.runOperator }, 65536)
    c.localReservation?.completeWrite(join(ledger.directory, "run-claim.json"))
    beginLeanInterval(ledger, "continuation-run-admission")
    try { c.guard() } finally { closeLeanInterval(ledger, "continuation-run-admission") }
    c.localReservation?.completeWrite(join(ledger.directory, "time.ndjson"))
    c.guard()
    })
    continuationRunStageV2(diagnostic, "PRE_ENTRY_BARRIER", true)
  } catch (error) { issueContinuationRunFailureV2(error, diagnostic); throw error } finally { diagnostic.active = false }
  const { ledger } = c
  diagnostic.active = true
  try {
  continuationRunStageV2(diagnostic, "PARENT_IMPORT")
  if ((c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V6 || c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V7 || (c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V8 || c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V9))) { c.authenticateSource(); c.stage("import", () => c.guard()) }
  return await runLeanBoundedParent({ ledger, requestPath, allocationPath: c.paths.allocation, store: c.paths.store, sourceRoot: c.allocation.sourceRoot, manifestRoot: () => { if ((c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V6 || c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V7 || (c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V8 || c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V9))) return c.authenticateSource(); c.guard(); const manifest = leanBaselineContinuationDataManifestV2(c.window, leanBaselineContinuationSourceManifestV2()); if (manifest.manifestRoot !== c.allocation.manifestRoot || manifest.planningRoot !== c.allocation.planningRoot) return fail("V2_MANIFEST_HOLD"); return manifest.root }, childMode: "child-continuation-v2", prospectiveStart: { wallStartMs: Date.now(), monotonicStartNs: process.hrtime.bigint().toString() }, beforeRelease: c.guard, ...((c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V6 || c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V7 || (c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V8 || c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V9)) ? { stage: c.stage, beforeTerminal: c.closeRun, onFailure: c.invalidate } : {}), terminalReserveMs: c.window.closureMs, supervisorObservation: true, onStage: stage => continuationRunStageV2(diagnostic, stage), ...(c.localReservation ? { writeReservation: c.localReservation } : {}) })
  } catch (error) {
    if ((c.paths !== LEAN_BASELINE_CONTINUATION_PATHS_V8 && c.paths !== LEAN_BASELINE_CONTINUATION_PATHS_V9)) throw error
    const withheld = new TypeError("LEAN_BASELINE_FAILED_DETAILS_WITHHELD")
    continuationRunFailuresV2.set(withheld, Object.freeze({ stage: diagnostic.stage, completed: false, counts: Object.freeze({ ...diagnostic.counts }) }))
    throw withheld
  } finally { diagnostic.active = false }
}

/** Connected charge/provider seam. Closing charge denial never calls provider;
 * charge bytes already written remain spent. No authority is returned here. */
export const dispatchLeanContinuationChargedCellV6 = async <C, T>(stage: <R>(kind: LeanContinuationStageV6, body: () => R) => R, charge: () => C, startCell: () => void, provider: (charge: C) => Promise<T>): Promise<{ charge: C; execution: T }> => {
  const charged = stage("charge", charge)
  startCell()
  stage("dispatch", () => {})
  return { charge: charged, execution: await provider(charged) }
}
/** Existing child callback only: consumes its already-admitted ledger/context.
 * Does not mint runtime authority, authenticate context, or enroll a reader. */
export const createLeanContinuationChildDispatchV2 = (ledger: LeanExperimentLedger, c: Pick<ReturnType<typeof openLeanBaselineContinuationContextV2>, "allocation" | "paths" | "localReservation" | "stage" | "fullSample" | "startCell" | "finishCell">, parent: Pick<ReturnType<typeof createLeanParentObservationGuard>, "register" | "unregister">, paths: typeof c.paths, checkpoint: (additionalBytes?: number) => unknown, resourceReceipts: Array<{ ordinal: number; chargeRoot: LabRoot; before: ReturnType<typeof c.fullSample>; after: ReturnType<typeof c.fullSample> }>): Parameters<typeof executeLeanBaselineContinuationPipelineV2>[0]["dispatch"] => async (slot, bottom, top, observedRole) => {
      checkpoint()
      const before = readLeanContinuationBoundedBytesV2(join(ledger.directory, "ledger.ndjson"), 4194304, 0o600, checkpoint)
      c.localReservation?.reserveWrite(3 * 16384, join(ledger.directory, `pair-${slot.ordinal}.json`))
      const pair = leanBaselinePair({ ordinal: slot.ordinal, slot, priorLedgerBytesRoot: leanBytesRoot(before), priorLedgerByteLength: before.length, priorCharged: readLeanLedger(ledger).charged, bottom, top })
      writeLeanContinuationArtifact(ledger, `pair-${slot.ordinal}.json`, pair, 16384); c.localReservation?.completeWrite(join(ledger.directory, `pair-${slot.ordinal}.json`)); const resourceBefore = c.localReservation ? c.stage("charge", c.fullSample) : checkpoint() as ReturnType<typeof c.fullSample>
      const chargeCell = () => { checkpoint(); c.localReservation?.reserveWrite(65536, join(ledger.directory, "ledger.ndjson")); const fs = statfsSync(ledger.directory, { bigint: true }); const charged = chargeLeanSlot(ledger, slot, { freeBytes: Number(fs.bavail * fs.bsize), availableMemoryBytes: observeLeagueAvailableMemoryBytes() }); c.localReservation?.completeWrite(join(ledger.directory, "ledger.ndjson")); return charged }
      const provider = (charge: ReturnType<typeof chargeCell>) => runLeanBaselineContinuationMatchV2({ ledger, charge, slot, seed: c.allocation.seed, bottom, top, ...(observedRole === undefined ? {} : { observedRole }), checkpoint, register: parent.register, unregister: parent.unregister })
      const { charge, execution } = (c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V6 || c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V7 || (c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V8 || c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V9)) ? await dispatchLeanContinuationChargedCellV6(c.stage, chargeCell, c.startCell, provider) : await (async () => { const charge = chargeCell(); c.startCell(); return { charge, execution: await provider(charge) } })()
      if (!c.localReservation) { c.finishCell(); checkpoint() }
      c.localReservation?.reserveWrite(3 * 4194304, join(ledger.directory, "ledger.ndjson"))
      c.localReservation?.reserveWrite(256000000, join(ledger.directory, `${charge.root.slice(7)}.gz`))
      retainLeanMatch(ledger, charge, execution.compact, execution.replayFrames, undefined, checkpoint)
      c.localReservation?.completeWrite(join(ledger.directory, "ledger.ndjson"))
      if (c.localReservation) c.localReservation.completeWrite(join(ledger.directory, `${charge.root.slice(7)}.gz`), !existsSync(join(ledger.directory, `${charge.root.slice(7)}.gz`)))
      const { replayFrames: _frames, ...content } = execution
      const cell = { ...content, ordinal: slot.ordinal, slotRoot: slot.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot }
      c.localReservation?.reserveWrite(3 * 8388608, join(ledger.directory, `observation-${slot.ordinal}.json`))
      const body = { schemaVersion: "lean-baseline-observation-v1", pairRoot: pair.root, cell }
      writeLeanContinuationArtifact(ledger, `observation-${slot.ordinal}.json`, { ...body, root: labRoot(body.schemaVersion, body) }, 8388608)
      c.localReservation?.completeWrite(join(ledger.directory, `observation-${slot.ordinal}.json`))
      if (execution.diagnostic) { c.localReservation?.reserveWrite(3 * 16384, join(ledger.directory, `diagnostic-${charge.root.slice(7)}.json`)); writeLeanContinuationArtifact(ledger, `diagnostic-${charge.root.slice(7)}.json`, execution.diagnostic, 16384); c.localReservation?.completeWrite(join(ledger.directory, `diagnostic-${charge.root.slice(7)}.json`)) }
      c.localReservation?.reserveWrite(65536, join(ledger.directory, "ledger.ndjson"))
      checkpointLeanResources(ledger, currentLeanElapsedMs(ledger), process.memoryUsage().arrayBuffers, measureLeanPhysicalBytes(paths.temp))
      c.localReservation?.completeWrite(join(ledger.directory, "ledger.ndjson"))
      if (c.localReservation) c.finishCell()
      const resourceAfter = c.localReservation ? c.stage("post_match", c.fullSample) : checkpoint() as ReturnType<typeof c.fullSample>
      resourceReceipts.push({ ordinal: slot.ordinal, chargeRoot: charge.root, before: resourceBefore, after: resourceAfter })
      return cell
}
export const runLeanBaselineContinuationChildV2 = async (requestPath: string) => {
  const approvedWindow = readLeanBaselineContinuationWindowV2(requestPath), paths = leanBaselineContinuationPathsForWindowV2(approvedWindow); continuationWindowAdmissionV2(approvedWindow, 36)
  assertLeanBaselineContinuationScopeV2(false, approvedWindow)
  if (requestPath !== paths.request || !process.send || !process.connected) throw continuationOwnedFailureV2("CHILD_PARENT")
  const token = (paths === LEAN_BASELINE_CONTINUATION_PATHS_V8 || paths === LEAN_BASELINE_CONTINUATION_PATHS_V9) ? await waitLeanContinuationReleaseV8(() => { continuationWindowAdmissionV2(approvedWindow, 36) }) : await new Promise<string>((accept, reject) => { const timer = setTimeout(() => reject(new TypeError("LEAN_CONTINUATION_HANDSHAKE")), 30000); process.once("disconnect", () => { clearTimeout(timer); reject(new TypeError("LEAN_CONTINUATION_PARENT_LOST")) }); process.once("message", value => { clearTimeout(timer); if (!exactLabKeys(value, ["release"]) || typeof value.release !== "string") { reject(new TypeError("LEAN_CONTINUATION_HANDSHAKE")); return }; accept(value.release) }); process.send!({ ready: process.pid }) })
  const ledger = openLeanLedger(paths.store), entry = readLeanChildEntry(ledger)
  admitLeanChildRelease(entry, token, process.pid, process.ppid)
  const c = openLeanBaselineContinuationContextV2(requestPath), parent = createLeanParentObservationGuard(entry.parentPid)
  assertLeanEntryBinding(entry, { head: c.fixedHead, sourceRoot: c.allocation.sourceRoot, requestBytesRoot: c.allocation.requestBytesRoot, allocationRoot: c.allocation.root, parentPid: process.ppid, childPid: process.pid, intervalStartMs: readLeanTimeAccounting(ledger).starts.get("pilot-entry") ?? -1 })
  const disconnect = () => { parent.disconnect(); process.exit(1) }
  process.once("disconnect", disconnect)
  const checkpoint = (additionalBytes = 0) => { parent.assert(); const sample = c.guard(additionalBytes); parent.assert(); return sample }
  const resourceReceipts: Array<{ ordinal: number; chargeRoot: LabRoot; before: ReturnType<typeof c.fullSample>; after: ReturnType<typeof c.fullSample> }> = []
  let pipeline: unknown = null, failed = false
  try {
    if ((c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V6 || c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V7 || (c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V8 || c.paths === LEAN_BASELINE_CONTINUATION_PATHS_V9))) { c.authenticateSource(); c.stage("import", () => checkpoint()) }
    pipeline = await executeLeanBaselineContinuationPipelineV2({ allocation: c.allocation, heldHead: c.fixedHead, checkpoint, freezeSource: source => {
      if (!c.localReservation) return publishLeanBaselineContinuationSourceV2(ledger, source, checkpoint)
      c.stage("source", () => { const names = [`source-${source.role}.json`, `publication-${source.role}-continuation-v2.json`]; for (const name of names) c.localReservation!.reserveWrite(3 * 262144, join(ledger.directory, name)); publishLeanBaselineContinuationSourceV2(ledger, source, checkpoint); for (const name of names) c.localReservation!.completeWrite(join(ledger.directory, name)) })
    }, retainArtifact(name, value) { if (!/^(?:seal-metadata|cold-corpus|initial-proposals|initial-selection|initial-training|initial-analysis|response-work|response-node-receipts|response-training|work-accounting|current-analysis)\.json$/u.test(name)) return fail("CONTINUATION_ARTIFACT_NAME"); const retain = () => { c.localReservation?.reserveWrite(3 * 4194304, join(ledger.directory, name)); checkpoint(3 * 4194304); writeLeanContinuationArtifact(ledger, name, value, 4194304); c.localReservation?.completeWrite(join(ledger.directory, name)); checkpoint() }; if (c.localReservation) c.stage("prepare", retain); else retain() }, dispatch: createLeanContinuationChildDispatchV2(ledger, c, parent, paths, checkpoint, resourceReceipts) })
  } catch { failed = true; c.invalidate() }
  finally { c.closeRun(); process.off("disconnect", disconnect) }
  const complete = !failed && (pipeline as { status?: string } | null)?.status === "current_baseline_complete"
  const state = readLeanLedger(ledger)
  if (!state.stopped) stopLeanLedger(ledger, complete ? "complete" : "failure")
  checkpoint()
  let evidence: ReturnType<typeof verifyLeanEvidence> | null = null
  try { evidence = verifyLeanEvidence(ledger, checkpoint, "continuation-descriptor-v2") } catch { failed = true }
  // Missing evidence stays missing. The charge, any published work/terminal,
  // and exact unused slots survive a host failure without imputed outcomes.
  c.localReservation?.reserveWrite(3 * 4194304, join(ledger.directory, "result.json"))
  const result = { schemaVersion: "lean-baseline-continuation-result-v2", issued: false, evidenceClass: "exploratory_current_only", allocationRoot: c.allocation.root, sourceRoot: c.allocation.sourceRoot, planningRoot: c.allocation.planningRoot, requestBytesRoot: c.allocation.requestBytesRoot, head: c.fixedHead, sourceHead: c.allocation.sourceHead, windowRoot: c.window.root, windowBytesRoot: c.allocation.windowBytesRoot, sourceGateRoot: c.allocation.sourceGateRoot, dataReviewRoot: c.allocation.dataReviewRoot, manifestRoot: c.allocation.manifestRoot, evidenceRoot: evidence?.root ?? null, pipeline, resourceReceipts, charged: state.charged, successful: [...state.terminals.values()].filter(row => row.record.classification === "success").length, status: complete && !failed ? "pending_independent_verification" : "partial_or_failed_baseline", elapsedMs: Math.max(state.elapsedMs, currentLeanElapsedMs(ledger)), physicalHighWaterBytes: state.physicalHighWaterBytes, scratchHighWaterBytes: state.scratchHighWaterBytes, unusedOrdinals: c.allocation.slots.filter(slot => !state.charges.has(slot.root)).map(slot => slot.ordinal), holdoutReservations: c.allocation.holdoutReservations, failure: failed ? "source_runtime_or_integrity_stop" : null, sourceAuthor: c.request.sourceAuthor, runOperator: c.request.runOperator, holdoutOpened: false, formationMaterialized: false }
  c.stage("terminal", () => { checkpoint(3 * 4194304); writeLeanContinuationArtifact(ledger, "result.json", result, 4194304); c.localReservation?.completeWrite(join(ledger.directory, "result.json")); checkpoint() })
  return result
}


export const leanBaselineMain = async (args: readonly string[]) => {
  const command = parseLeanBaselineCommand(args)
  if (command.mode === "prepare-continuation-v2") return prepareLeanBaselineContinuationV2(command.request)
  if (command.mode === "run-continuation-v2") return runLeanBaselineContinuationV2(command.request)
  if (command.mode === "verify-continuation-v2") {
    let stage: ContinuationReaderDiagnosticStageV2 = "INITIAL_WINDOW"
    try { const reader = await import("./lib/v1-38-lean-baseline-retained.js"); return await reader.verifyLeanBaselineContinuationRetainedV2(command.request, value => { stage = value }) }
    catch { const withheld = new TypeError("LEAN_BASELINE_FAILED_DETAILS_WITHHELD"); continuationReaderFailuresV2.set(withheld, stage); throw withheld }
  }
  if (command.mode === "prepare-continuation") return prepareLeanBaselineContinuation(command.request)
  if (command.mode === "run-continuation") return runLeanBaselineContinuation(command.request)
  if (command.mode === "verify-continuation") { const reader = await import("./lib/v1-38-lean-baseline-retained.js"); return reader.verifyLeanBaselineContinuationRetained(command.request) }
  if (command.mode === "prepare-current") return prepareLeanCurrent(command.request)
  if (command.mode === "run-current") return runLeanCurrent(command.request)
  const { verifyLeanCurrentBaselineRetained } = await import("./lib/v1-38-lean-baseline-retained.js")
  return verifyLeanCurrentBaselineRetained(command.request)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  const childMode = args.length === 3 && ["child-current", "child-continuation", "child-continuation-v2"].includes(args[0]!) && args[1] === "--request"
  const action = childMode ? args[0] === "child-continuation-v2" ? runLeanBaselineContinuationChildV2(args[2]!) : args[0] === "child-continuation" ? runLeanBaselineContinuationChild(args[2]!) : runLeanCurrentChild(args[2]!) : leanBaselineMain(args)
  if (!childMode && args.length === 3 && args[0] === "verify-continuation-v2" && args[1] === "--request") void action.catch(error => { process.stderr.write(leanBaselineContinuationReaderFailureV2(error)) })
  if (childMode) void (args[0] === "child-continuation-v2" ? resolveLeanContinuationChildCliTerminalV2(action) : resolveLeanChildCliTerminal(action))
  else void action.then(value => { process.stdout.write(`${JSON.stringify(value)}\n`) }).catch(error => { if (args.length === 3 && args[0] === "prepare-continuation-v2" && args[1] === "--request" && (args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V4.request || args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V5.request || (args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V6.request || args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V7.request || (args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V8.request || args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V9.request)))) process.stderr.write(leanBaselineContinuationPreparationFailureV4(error)); if (args.length === 3 && args[0] === "run-continuation-v2" && args[1] === "--request" && (args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V6.request || args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V7.request || (args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V8.request || args[2] === LEAN_BASELINE_CONTINUATION_PATHS_V9.request))) process.stderr.write(leanBaselineContinuationRunFailureV2(error)); process.stderr.write("LEAN_BASELINE_FAILED_DETAILS_WITHHELD\n"); process.exitCode = 1 })
}
