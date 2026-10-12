/** Prospective current-only private baseline entry. Importing this module is inert. */
import { constants, closeSync, fsyncSync, fchmodSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync, statfsSync, mkdirSync, existsSync } from "node:fs"
import { fork, execFileSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { dirname, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { isLeanPostV13FivePairMode, isLeanPreparationContinuationMode, isLeanSupervisorRetestMode, isLeanResourceWindowModeV15, leanCapsForAllocation, leanSupervisorAllocationMode, type AnyLeanAllocation } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { exactLabKeys, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createLeanCurrentBaselineAllocation, createLeanLedger, openLeanLedger, readLeanLedger, readLeanTimeAccounting, readLeanChildEntry, publishLeanChildEntry, beginLeanInterval, chargeLeanSlot, retainLeanMatch, checkpointLeanResources, stopLeanLedger, verifyLeanEvidence, deriveLeanChildTerminal, publishLeanChildTerminal, cumulativeLeanPhysicalBytes, assertLeanPublicationCapacity, currentLeanElapsedMs, currentBaselineSlotKind, leanCanonicalBytes, leanBytesRoot, writeLeanAll, LEAN_BASELINE_REQUEST, LEAN_BASELINE_STORE, LEAN_BASELINE_WRITABLE_PATHS, LEAN_CAPS, LEAN_EXTERNAL_SCRATCH_RESERVE, type LeanExperimentLedger, type LeanChildEntryV2, type LeanSlot } from "../packages/strategy-lab/src/league/lean-experiment.js"
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
import { LEAN_BASELINE_CONTINUATION_PATHS_V2 as CONTINUATION_V2, LEAN_BASELINE_CONTINUATION_POLICY_V2, validateLeanBaselineContinuationWindowV2, validateLeanBaselineContinuationAllocationV2, createLeanBaselineContinuationAllocationV2, leanBaselineContinuationElapsedFloorV2, leanContinuationIdentityV2, type LeanBaselineContinuationWindowV2, type LeanBaselineContinuationAllocationV2 } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { readLeanContinuationBoundedBytesV2, readLeanContinuationJsonV2, authenticateLeanBaselineContinuationCarryV2, assertLeanBaselineContinuationFrontierV2, createLeanContinuationIdentityGuardV2, type LeanContinuationInventoryRowV2, type LeanContinuationReviewedRowV2 } from "./lib/v1-38-lean-baseline-continuation.js"
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
  if (args.length === 3 && ["prepare-continuation-v2", "run-continuation-v2", "verify-continuation-v2"].includes(args[0]!) && args[1] === "--request" && args[2] === CONTINUATION_V2.request) return { mode: args[0] as "prepare-continuation-v2" | "run-continuation-v2" | "verify-continuation-v2", request: args[2] }
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
/** Same parent IPC handler, independently exercisable without a subprocess. */
export const leanParentFailureReceiptHandler = (ledger: LeanExperimentLedger, childPid: number | undefined, accept: (receipt: LeanChildFailureReceipt | LeanChildFailureReceiptV7) => void, uncertain: (reason: "duplicate_failure_receipt" | "malformed_ipc") => void) => {
  let received = false
  return (message: unknown) => {
    if (message !== null && typeof message === "object" && exactLabKeys(message, ["ready"]) && message.ready === childPid) return
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
export const runLeanBoundedParent = async (options: { ledger: LeanExperimentLedger; requestPath: string; allocationPath: string; store: string; sourceRoot: LabRoot; manifestRoot: () => LabRoot; childMode: string; prospectiveStart?: { wallStartMs: number; monotonicStartNs: string }; beforeRelease?: () => void; terminalReserveMs?: number; supervisorObservation?: true; onChildCreated?: () => void; onPreEntryCleanup?: (value: { childPid: number; exitCode: number | null; signal: string | null }) => void }) => {
  const { ledger, requestPath, store: STORE } = options, allocation = ledger.allocation
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
  const child = fork(resolve(process.argv[1] ?? fail("ENTRY_PATH")), [options.childMode, "--request", requestPath], { execArgv: process.execArgv, stdio: ["ignore", "ignore", "ignore", "ipc"] })
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
  child.on("error", () => { uncertain = true; observe("child_error") })
  child.on("message", leanParentFailureReceiptHandler(ledger, child.pid, receipt => { childFailure = receipt }, reason => { uncertain = true; observe(reason) }))
  try {
    await waitLeanBoundedChildReady(child)
    if (!child.pid) return fail("CHILD_PID")
    childRssObservedBytes = rssOf(child.pid)
    if (process.memoryUsage().rss + childRssObservedBytes + LEAN_EXTERNAL_SCRATCH_RESERVE + 320 * 1024 * 1024 > leanMemoryLimitForAllocation(allocation)) return fail("PREFIX_CAPACITY")
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
        if (allocation.schemaVersion === "lean-baseline-continuation-allocation-v2") options.beforeRelease?.()
        const rss = sample("child_rss", () => rssOf(child.pid!))
        childRssObservedBytes = Math.max(childRssObservedBytes ?? 0, rss)
        if (sample("parent_rss", () => process.memoryUsage().rss) + rss + LEAN_EXTERNAL_SCRATCH_RESERVE + 320 * 1024 * 1024 > leanMemoryLimitForAllocation(allocation) || sample("time_budget", () => leanBoundedParentTimeBudget(ledger, options.terminalReserveMs ?? 0).elapsedMs >= leanCapsForAllocation(allocation).elapsedMs)) { uncertain = true; observe("resource_threshold"); sample("threshold_kill", () => child.kill("SIGKILL")) }
      } catch {
        if (!firstSamplingException) firstSamplingException = { resourceSamplingOperation: samplingOperation, resourceSamplingSequence: Math.max(1, samplingSequence), resourceSamplingExitObserved: exitEventObserved }
        uncertain = true; observe("resource_sampling_exception"); child.kill("SIGKILL")
      }
    }, 250)
    const timeout = setTimeout(() => { uncertain = true; observe("deadline_timeout"); child.kill("SIGKILL") }, leanBoundedParentTimeBudget(ledger, options.terminalReserveMs ?? 0).timeoutMs)
    const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(resolveExit => child.once("exit", (code, signal) => { exitEventObserved = true; resolveExit({ code, signal }) }))
    clearInterval(period); clearTimeout(timeout)
    try { if (head() !== fixedHead || options.manifestRoot() !== fixedManifest || requestBytesRoot(requestPath) !== fixedRequest) { uncertain = true; observe("final_identity_mismatch"); finalIdentity = "mismatch" } } catch { uncertain = true; observe("final_identity_exception"); finalIdentity = "exception" }
    const terminalFs = statfsSync(STORE, { bigint: true }), terminalFree = terminalFs.bavail * terminalFs.bsize
    const terminal = publishChildTerminalAfterOptionalReceipt(childFailure,
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
    if (!entered && options.onPreEntryCleanup && child.pid && (child.exitCode !== null || child.signalCode !== null)) options.onPreEntryCleanup({ childPid: child.pid, exitCode: child.exitCode, signal: child.signalCode })
  }
}
const CONTINUATION_PHASE = ".planning/phases/265-serious-current-rules-league-and-development-red-team/"
export const LEAN_BASELINE_CONTINUATION_OWNED_PATHS = Object.freeze([
  "packages/strategy-lab/src/league/lean-experiment.ts", "scripts/lib/v1-38-lean-baseline-continuation.ts", "scripts/lib/v1-38-lean-baseline-continuation.test.ts",
  "scripts/lib/v1-38-lean-experiment-authority.ts", "scripts/lib/v1-38-lean-baseline-authority.test.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-baseline-match.test.ts",
  "scripts/run-v1-38-lean-baseline.ts", "scripts/lib/v1-38-lean-baseline-pipeline.ts", "scripts/lib/v1-38-lean-baseline-source.ts", "scripts/lib/v1-38-lean-baseline-pipeline.test.ts",
  "scripts/lib/v1-38-lean-baseline-retained.ts", "scripts/lib/v1-38-lean-baseline-retained.test.ts", "scripts/run-v1-38-lean-baseline.test.ts", "scripts/lib/v1-38-lean-container-match-session.ts",
])
export const LEAN_BASELINE_CONTINUATION_PLANNING_PATHS = Object.freeze([
  ".planning/PROJECT.md", ".planning/REQUIREMENTS.md", ".planning/ROADMAP.md", ".planning/STATE.md", ".planning/research/SUMMARY.md",
  ".planning/debug/265-native-exit-reader-cost.md",
  ...["265-16-PLAN.md", "265-15-PLAN.md", "265-15-PILOT-RETAINED-VERIFICATION-v2.md", "265-16-BASELINE-CONTINUATION-APPROVAL-20261012.md", "265-16-BASELINE-CONTINUATION-RESEARCH-20261012.md", "265-16-BASELINE-CONTINUATION-PLAN-20261012.md", "265-16-BASELINE-CONTINUATION-GATES-20261012.md"].map(name => `${CONTINUATION_PHASE}${name}`),
  ".planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/LEAN-EXPERIMENT-20261003.md",
  ".planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/LEAN-REMAINING-PLAN-20261003.md",
])
export const leanBaselineContinuationSourceManifest = () => {
  const source = new Map(leanBaselineSourceManifest().entries.filter(row => /^(?:packages|scripts)\//u.test(row.path) || ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json", "tsconfig.base.json"].includes(row.path)).map(row => [row.path, row]))
  for (const path of [...LEAN_BASELINE_CONTINUATION_OWNED_PATHS, "packages/strategy-lab/src/league/lean-training.test.ts", "scripts/lib/v1-38-lean-baseline-analysis.test.ts", "scripts/lib/v1-38-lean-baseline-source.test.ts", "scripts/lib/v1-38-lean-startup-supervisor-v8.mjs", "AGENTS.md"]) {
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
export const readLeanBaselineContinuationWindowV2 = (): Readonly<LeanBaselineContinuationWindowV2> => {
  const bytes = readLeanContinuationBoundedBytesV2(CONTINUATION_V2.window, 65536, 0o600, additional => { if ((additional ?? 0) > 65536 || process.memoryUsage().arrayBuffers + (additional ?? 0) > LEAN_CAPS.scratchBytes) return fail("V2_WINDOW_BUFFER") })
  const window = validateLeanBaselineContinuationWindowV2(JSON.parse(bytes.toString("utf8")))
  if (!bytes.equals(Buffer.from(leanCanonicalBytes(window)))) return fail("V2_WINDOW_CANONICAL")
  return window
}
export const leanBaselineContinuationDataManifestV2 = (window: LeanBaselineContinuationWindowV2, source: ReturnType<typeof leanBaselineContinuationSourceManifestV2>) => {
  const w = validateLeanBaselineContinuationWindowV2(window), gate = validateLeanContinuationSourceGateV2(source.sourceGate)
  if (source.admitting !== false || source.root !== w.sourceRoot || source.sourceGateRoot !== w.sourceGateRoot || source.root !== labRoot("lean-baseline-continuation-implementation-v2", source.implementationEntries) || source.planningRoot !== labRoot("lean-baseline-continuation-planning-source-v2", source.planningEntries) || !exact(source.entries, [...source.implementationEntries, ...source.planningEntries].sort((a, b) => a.path.localeCompare(b.path))) || source.manifestRoot !== labRoot("lean-baseline-continuation-source-manifest-v2", source.entries)) return fail("V2_SOURCE_MANIFEST")
  const windowBytes = readLeanContinuationBoundedBytesV2(CONTINUATION_V2.window, 65536, 0o600, () => { continuationWindowAdmissionV2(w, 0) })
  if (!windowBytes.equals(Buffer.from(leanCanonicalBytes(w)))) return fail("V2_WINDOW_BYTES")
  const gateBytes = readLeanContinuationBoundedBytesV2(CONTINUATION_V2.gates, 4194304, 0o644, () => { continuationWindowAdmissionV2(w, 0) })
  if (leanBytesRoot(gateBytes) !== source.planningEntries.find(row => row.path === CONTINUATION_V2.gates)?.root || w.planRoot !== source.planningEntries.find(row => row.path.endsWith("265-16-BASELINE-CONTINUATION-PLAN-20261012.md"))?.root) return fail("V2_PLANNING_BYTES")
  const dataGate = validateLeanContinuationDataGateV2(readLeanContinuationGateProjectionV2(gateBytes.toString("utf8"), "lean-baseline-continuation-data-gate-v2"), w, gate)
  const planningEntries = [...source.planningEntries, { path: CONTINUATION_V2.window, root: leanBytesRoot(windowBytes) }].sort((a, b) => a.path.localeCompare(b.path)), entries = [...source.implementationEntries, ...planningEntries].sort((a, b) => a.path.localeCompare(b.path))
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
  if (path !== CONTINUATION_V2.request) return fail("V2_REQUEST_PATH")
  const window = readLeanBaselineContinuationWindowV2(); continuationWindowAdmissionV2(window, 0)
  const manifest = leanBaselineContinuationDataManifestV2(window, leanBaselineContinuationSourceManifestV2())
  return validateLeanBaselineContinuationRequestV2(readLeanContinuationJsonV2(path, 65536, 0o600, () => { continuationWindowAdmissionV2(window, 0) }), window, manifest)
}

export const assertLeanBaselineContinuationScopeV2 = (preparing = false): void => {
  if (process.env.TSX_DISABLE_CACHE !== "1" || process.env.NODE_DISABLE_COMPILE_CACHE !== "1" || ["NODE_OPTIONS", "NODE_COMPILE_CACHE", "NODE_REDIRECT_WARNINGS", "NODE_V8_COVERAGE"].some(key => process.env[key] !== undefined) || process.env.TMPDIR !== resolve(CONTINUATION_V2.temp) || !process.execArgv.some((arg, i, args) => arg === "--import" && args[i + 1] === "tsx" || arg === "--import=tsx") || process.execArgv.some(arg => /(?:loader|inspect|require)/u.test(arg)) || coreSoftLimit().trim() !== "0") return fail("V2_SCOPE")
  if (!preparing) { const s = lstatSync(CONTINUATION_V2.temp); if (!s.isDirectory() || s.isSymbolicLink() || s.uid !== process.getuid?.() || (s.mode & 0o777) !== 0o700 || realpathSync(resolve(CONTINUATION_V2.temp)) !== resolve(CONTINUATION_V2.temp)) return fail("V2_SCRATCH") }
}
const continuationCapacityV2 = (w: LeanBaselineContinuationWindowV2, retained = 88924160, additional = 0, scratchExists = false) => {
  continuationWindowAdmissionV2(w, 0)
  const usage = process.memoryUsage(), fs = statfsSync(resolve("."), { bigint: true }), reserve = 2 * 268435456 + 512000000 + 335544320, scratch = scratchExists ? measureLeanPhysicalBytes(CONTINUATION_V2.temp) : 0
  if (![retained, additional, scratch].every(n => Number.isSafeInteger(n) && n >= 0) || retained > LEAN_CAPS.retainedBytes || scratch + additional + usage.arrayBuffers > LEAN_CAPS.scratchBytes || usage.rss + (process.connected ? rssOf(process.ppid) : 0) + usage.arrayBuffers + additional + reserve > LEAN_BASELINE_CONTINUATION_POLICY_V2.memoryBytes || observeLeagueAvailableMemoryBytes() < reserve || fs.bavail * fs.bsize > BigInt(Number.MAX_SAFE_INTEGER) || fs.bavail * fs.bsize < BigInt(LEAN_CAPS.totalBytes - retained)) return fail("V2_CAPACITY")
}
const continuationClaimBodyV2 = (request: LeanBaselineContinuationRequestV2, window: LeanBaselineContinuationWindowV2, requestBytesRoot: LabRoot) => ({ schemaVersion: "lean-baseline-continuation-window-claim-v2", grantId: window.grantId, routeNamespace: window.routeNamespace, windowRoot: window.root, windowBytesRoot: request.windowBytesRoot, requestBytesRoot, sourceHead: request.sourceHead, sourceRoot: request.sourceRoot, sourceGateRoot: request.sourceGateRoot, dataReviewRoot: request.dataReviewRoot, planningRoot: request.planningRoot, manifestRoot: request.manifestRoot })
const continuationReviewRowsV2 = (manifest: ReturnType<typeof leanBaselineContinuationDataManifestV2>, sourceHead: string): LeanContinuationReviewedRowV2[] => [...manifest.implementationEntries.map(row => ({ ...row, commit: sourceHead, kind: "reviewed_source" as const })), ...manifest.planningEntries.filter(row => row.path !== CONTINUATION_V2.window).map(row => ({ ...row, commit: sourceHead, kind: "active_planning" as const }))]
const continuationPreflightV2 = (requestPath: string, consumed: boolean, reader: boolean) => {
  if (requestPath !== CONTINUATION_V2.request) return fail("V2_REQUEST_PATH")
  // This is the first external read. No directory, claim, allocation or cost
  // import is reachable before a genuine, exact approved record validates.
  const window = readLeanBaselineContinuationWindowV2(); continuationWindowAdmissionV2(window, reader ? 0 : 36)
  if (!consumed && [CONTINUATION_V2.claim, CONTINUATION_V2.temp, CONTINUATION_V2.store, CONTINUATION_V2.allocation].some(path => existsSync(path))) return fail("V2_GRANT_CLAIMED")
  assertLeanBaselineContinuationScopeV2(!consumed); continuationCapacityV2(window, 88924160, 0, consumed)
  const source = leanBaselineContinuationSourceManifestV2(), manifest = leanBaselineContinuationDataManifestV2(window, source)
  const requestBytes = readLeanContinuationBoundedBytesV2(requestPath, 65536, 0o600, additional => continuationCapacityV2(window, 88924160, additional, consumed))
  const request = validateLeanBaselineContinuationRequestV2(JSON.parse(requestBytes.toString("utf8")), window, manifest)
  if (!requestBytes.equals(Buffer.from(leanCanonicalBytes(request)))) return fail("V2_REQUEST_CANONICAL")
  const git = (args: readonly string[]) => readLeanBaselineContinuationGitV2(args, manifest.entries)
  const fixedHead = git(["rev-parse", "HEAD"]).toString("utf8").trim()
  if (!/^[a-f0-9]{40}$/u.test(fixedHead) || !consumed && fixedHead !== request.sourceHead) return fail("V2_SOURCE_HEAD")
  git(["merge-base", "--is-ancestor", window.reviewedSourceHead, request.sourceHead])
  const requestBytesRoot = leanBytesRoot(requestBytes)
  const pins = [...manifest.entries, { path: requestPath, root: requestBytesRoot }].map(row => ({ ...row, stat: lstatSync(resolve(row.path)) }))
  const identity = createLeanContinuationIdentityGuard(pins, [])
  const guard = (additionalBytes = 0) => {
    continuationWindowAdmissionV2(window, reader ? 0 : 36)
    continuationCapacityV2(window, 88924160, additionalBytes, consumed)
    if (git(["rev-parse", "HEAD"]).toString("utf8").trim() !== fixedHead) return fail("V2_HEAD_CHANGED")
    identity()
  }
  for (const row of manifest.implementationEntries) { guard(65536); authenticateLeanContinuationPinnedSource(row, window.reviewedSourceHead, manifest.implementationEntries.map(r => r.path), git, guard) }
  for (const row of manifest.entries.filter(row => row.path !== CONTINUATION_V2.window)) { guard(65536); authenticateLeanContinuationPinnedSource(row, request.sourceHead, manifest.entries.map(r => r.path), git, guard) }
  guard()
  return { window, source, manifest, request, requestBytesRoot, git, fixedHead, guard }
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
export const validateLeanContinuationSetupDirectoriesV2 = (before: readonly LeanContinuationInventoryRowV2[], after: readonly LeanContinuationInventoryRowV2[]): void => {
  if (before.length !== after.length || before.length > 1024 || new Set(before.map(row => row.path)).size !== before.length || new Set(after.map(row => row.path)).size !== after.length) return fail("V2_SETUP_DIRECTORIES")
  for (const old of before) {
    const current = after.find(row => row.path === old.path)
    const added = [CONTINUATION_V2.temp, CONTINUATION_V2.store, CONTINUATION_V2.allocation].filter(path => dirname(path) === old.path).map(path => path.slice(old.path === "." ? 0 : old.path.length + 1))
    if (!current || old.kind !== "directory" || current.kind !== "directory" || current.dev !== old.dev || current.ino !== old.ino || current.mode !== old.mode || current.allocatedBytes < old.allocatedBytes || !old.members || !current.members || !exact(current.members, [...old.members, ...added].sort()) || added.length === 0 && (current.bytes !== old.bytes || current.mtimeMs !== old.mtimeMs || current.ctimeMs !== old.ctimeMs)) return fail("V2_SETUP_DIRECTORIES")
  }
}
export const prepareLeanBaselineContinuationV2 = (requestPath: string) => {
  const c = continuationPreflightV2(requestPath, false, false)
  const carried = authenticateLeanBaselineContinuationCarryV2(c.git, continuationReviewRowsV2(c.manifest, c.request.sourceHead), c.guard)
  if (carried.carry.elapsedUpperBoundMs > c.window.carryMs) return fail("V2_CARRY_TIME")
  const priorGuard = createLeanContinuationIdentityGuardV2([], carried.inventory)
  const ancestors = continuationAncestorsV2([...c.manifest.entries.map(row => row.path), requestPath, CONTINUATION_V2.allocation, CONTINUATION_V2.store]), before = ancestors.map(continuationStatRowV2)
  c.guard(); priorGuard(); continuationCapacityV2(c.window, carried.carry.allocatedDiskBytes)
  if ([CONTINUATION_V2.temp, CONTINUATION_V2.store, CONTINUATION_V2.allocation].some(path => existsSync(path))) return fail("V2_GRANT_CLAIMED")
  // Exclusive scratch creation is the concurrency barrier. A partial failure
  // consumes this namespace even if it never publishes an allocation.
  mkdirSync(CONTINUATION_V2.temp, { mode: 0o700 })
  const body = continuationClaimBodyV2(c.request, c.window, c.requestBytesRoot), claim = { ...body, root: labRoot(body.schemaVersion, body) }
  const fd = openSync(CONTINUATION_V2.claim, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
  try { writeLeanAll(fd, leanCanonicalBytes(claim)); fsyncSync(fd) } finally { closeSync(fd) }
  c.guard(); priorGuard(); continuationCapacityV2(c.window, carried.carry.allocatedDiskBytes, 1048576, true)
  const allocation = createLeanBaselineContinuationAllocationV2({ sourceRoot: c.request.sourceRoot, reviewRoot: c.request.reviewRoot, coldRoot: c.request.coldRoot, planRoot: c.request.planRoot, candidateRoots: c.request.candidateRoots, requestRoots: c.request.requestRoots, seed: c.request.seed, sourceHead: c.request.sourceHead, planningRoot: c.request.planningRoot, manifestRoot: c.request.manifestRoot, requestBytesRoot: c.requestBytesRoot, window: c.window, windowBytesRoot: c.request.windowBytesRoot, sourceGateRoot: c.request.sourceGateRoot, dataReviewRoot: c.request.dataReviewRoot, predecessor: carried.carry })
  const ledger = createLeanLedger(CONTINUATION_V2.store, allocation)
  c.guard(); writeLeanContinuationArtifact(ledger, "carry.json", carried, 4194304)
  c.guard(); writeLeanContinuationArtifact(ledger, "source-manifest.json", c.manifest, 4194304)
  c.guard()
  const allocationFd = openSync(CONTINUATION_V2.allocation, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o644)
  try { fchmodSync(allocationFd, 0o644); writeLeanAll(allocationFd, leanCanonicalBytes(allocation)); fsyncSync(allocationFd) } finally { closeSync(allocationFd) }
  for (const path of [CONTINUATION_V2.temp, dirname(CONTINUATION_V2.allocation), dirname(CONTINUATION_V2.store)]) { const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW); try { fsyncSync(fd) } finally { closeSync(fd) } }
  const after = ancestors.map(continuationStatRowV2); validateLeanContinuationSetupDirectoriesV2(before, after)
  c.guard(); priorGuard()
  const rows = [...after, ...[CONTINUATION_V2.window, requestPath, CONTINUATION_V2.claim, CONTINUATION_V2.allocation, CONTINUATION_V2.temp].map(continuationStatRowV2)]
  const holdBody = { schemaVersion: "lean-baseline-continuation-source-hold-v2", allocationRoot: allocation.root, sourceHead: allocation.sourceHead, manifestRoot: allocation.manifestRoot, claimRoot: claim.root, rows }
  writeLeanContinuationArtifact(ledger, "source-hold.json", { ...holdBody, root: labRoot(holdBody.schemaVersion, holdBody) }, 4194304)
  c.guard(); createLeanContinuationIdentityGuardV2([], rows)(); continuationCapacityV2(c.window, cumulativeLeanPhysicalBytes(ledger), 0, true)
  return { schemaVersion: "lean-baseline-continuation-prepared-v2", allocationRoot: allocation.root, allocationPath: CONTINUATION_V2.allocation, sourceHead: allocation.sourceHead, store: CONTINUATION_V2.store, grantId: c.window.grantId, claimRoot: claim.root, charged: 50, plannedCurrentCells: 36, holdoutReservations: allocation.holdoutReservations, issued: false }
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
export const openLeanBaselineContinuationContextV2 = (requestPath: string, reader = false) => {
  const c = continuationPreflightV2(requestPath, true, reader), ledger = openLeanLedger(CONTINUATION_V2.store), allocation = validateLeanBaselineContinuationAllocationV2(ledger.allocation)
  const expectedClaimBody = continuationClaimBodyV2(c.request, c.window, c.requestBytesRoot), expectedClaim = { ...expectedClaimBody, root: labRoot(expectedClaimBody.schemaVersion, expectedClaimBody) }
  const claim = readLeanContinuationJsonV2(CONTINUATION_V2.claim, 65536, 0o600, c.guard)
  if (!exact(claim, expectedClaim) || allocation.requestBytesRoot !== c.requestBytesRoot || allocation.sourceHead !== c.request.sourceHead || allocation.sourceRoot !== c.manifest.root || allocation.planningRoot !== c.manifest.planningRoot || allocation.manifestRoot !== c.manifest.manifestRoot || allocation.window.root !== c.window.root || allocation.windowBytesRoot !== c.manifest.windowBytesRoot || allocation.sourceGateRoot !== c.manifest.sourceGateRoot || allocation.dataReviewRoot !== c.manifest.dataReviewRoot || allocation.reviewRoot !== c.request.reviewRoot || allocation.coldRoot !== c.request.coldRoot || allocation.seed !== c.request.seed || !exact(allocation.requestRoots, c.request.requestRoots) || !exact([...allocation.candidateRoots].sort(), [...c.request.candidateRoots].sort())) return fail("V2_ALLOCATION_JOIN")
  const allocationBytes = readLeanContinuationBoundedBytesV2(CONTINUATION_V2.allocation, 262144, 0o644, c.guard)
  if (!allocationBytes.equals(Buffer.from(leanCanonicalBytes(allocation)))) return fail("V2_ALLOCATION_BYTES")
  assertLeanContinuationDirectParent(c.fixedHead, allocation.sourceHead, c.git(["rev-list", "--parents", "-n", "1", c.fixedHead]).toString("utf8").trim().split(/\s+/u), allocationBytes, c.git(["show", `${c.fixedHead}:${CONTINUATION_V2.allocation}`]))
  if (c.git(["diff", "--name-only", allocation.sourceHead, c.fixedHead]).toString("utf8").trim() !== CONTINUATION_V2.allocation) return fail("V2_ALLOCATION_DIFF")
  const storedManifest = readLeanContinuationJsonV2(join(ledger.directory, "source-manifest.json"), 4194304, 0o600, c.guard)
  if (!exact(storedManifest, c.manifest)) return fail("V2_MANIFEST_CHANGED")
  const carry = readLeanContinuationJsonV2(join(ledger.directory, "carry.json"), 4194304, 0o600, c.guard)
  if (!exact(carry.carry, allocation.predecessor) || !Array.isArray(carry.inventory) || carry.inventory.length > 4096 || labRoot("lean-baseline-continuation-inventory-v2", carry.inventory) !== allocation.predecessor.inventoryRoot || labRoot("lean-baseline-continuation-custody-v2", carry.custody) !== allocation.predecessor.custodyRoot || labRoot("lean-baseline-continuation-closed-capsule-v2", carry.custody) !== allocation.predecessor.closedCapsuleRoot) return fail("V2_CARRY")
  const hold = readLeanContinuationJsonV2(join(ledger.directory, "source-hold.json"), 4194304, 0o600, c.guard), { root: holdRoot, ...holdBody } = hold
  if (!exactLabKeys(hold, ["schemaVersion", "allocationRoot", "sourceHead", "manifestRoot", "claimRoot", "rows", "root"]) || hold.schemaVersion !== "lean-baseline-continuation-source-hold-v2" || holdRoot !== labRoot(hold.schemaVersion, holdBody) || hold.allocationRoot !== allocation.root || hold.sourceHead !== allocation.sourceHead || hold.manifestRoot !== allocation.manifestRoot || hold.claimRoot !== claim.root || !Array.isArray(hold.rows) || hold.rows.length > 1024) return fail("V2_SOURCE_HOLD")
  const pinned = [...c.manifest.entries.map(row => row.path), requestPath, CONTINUATION_V2.claim, CONTINUATION_V2.allocation, ...["allocation.json", "carry.json", "source-manifest.json", "source-hold.json"].map(name => join(ledger.directory, name))].map(path => ({ path, stat: lstatSync(resolve(path)) }))
  const identities = createLeanContinuationIdentityGuardV2(pinned, [...carry.inventory as LeanContinuationInventoryRowV2[], ...hold.rows as LeanContinuationInventoryRowV2[]])
  const startWall = Date.now(), startMono = process.hrtime.bigint()
  let closure = reader, closureBegan = reader ? readLeanTimeAccounting(ledger).closes.get("pilot-entry") ?? startWall : startWall, active = false, expectedLedger: LabRoot | undefined
  const guard = (additionalBytes = 0) => {
    if (!Number.isSafeInteger(additionalBytes) || additionalBytes < 0 || Date.now() < startWall || c.git(["rev-parse", "HEAD"]).toString("utf8").trim() !== c.fixedHead) return fail("V2_HOLD")
    identities(); continuationStoreMembershipV2(ledger)
    // No recursive callback: the outer complete observation surrounds this
    // descriptor read. Its small reservation is included in the final sample.
    const journal = readLeanContinuationBoundedBytesV2(join(ledger.directory, "ledger.ndjson"), 4194304, 0o600, bytes => continuationCapacityV2(c.window, cumulativeLeanPhysicalBytes(ledger), additionalBytes + (bytes ?? 0), true))
    if (expectedLedger && leanBytesRoot(journal) !== expectedLedger) return fail("V2_LEDGER_CHANGED")
    const state = readLeanLedger(ledger), nowMs = Date.now(), usage = process.memoryUsage(), fs = statfsSync(ledger.directory, { bigint: true }), child = process.connected ? process.pid : 0, parent = process.connected ? process.ppid : process.pid
    if (state.stopped && !closure) { closure = true; closureBegan = readLeanTimeAccounting(ledger).closes.get("pilot-entry") ?? nowMs }
    const elapsedMono = process.hrtime.bigint() - startMono
    if (elapsedMono < 0n || elapsedMono > BigInt(Number.MAX_SAFE_INTEGER) * 1000000n || child && process.ppid !== readLeanChildEntry(ledger).parentPid) return fail("V2_LIVENESS")
    const sample = { nowMs, monotonicElapsedMs: Math.max(0, startWall - c.window.anchorMs) + Number((elapsedMono + 999999n) / 1000000n), remainingSlots: closure ? 0 : 36 - state.charges.size + (active ? 1 : 0), ...(closure ? { remainingClosureMs: Math.max(0, c.window.closureMs - Math.max(0, nowMs - closureBegan)), remainingOfflineMs: 0 } : {}), charged: state.charged, retainedBytes: cumulativeLeanPhysicalBytes(ledger), scratchBytes: measureLeanPhysicalBytes(CONTINUATION_V2.temp) + additionalBytes, parentRssBytes: child ? rssOf(parent) : usage.rss, childRssBytes: child ? usage.rss : 0, arrayBuffersBytes: usage.arrayBuffers + additionalBytes, availableMemoryBytes: observeLeagueAvailableMemoryBytes(), freeBytes: Number(fs.bavail * fs.bsize), live: !child || process.connected === true }
    assertLeanBaselineContinuationFrontierV2(allocation, sample)
    if (currentLeanElapsedMs(ledger) + sample.remainingSlots * LEAN_CAPS.matchMs + (sample.remainingClosureMs ?? c.window.closureMs) + (sample.remainingOfflineMs ?? c.window.offlineOverheadMs) > allocation.caps.elapsedMs) return fail("V2_JOURNAL_FRONTIER")
    identities(); return sample
  }
  guard()
  const authenticated = authenticateLeanBaselineContinuationCarryV2(c.git, continuationReviewRowsV2(c.manifest, allocation.sourceHead), guard)
  if (!exact(authenticated, carry)) return fail("V2_CARRY_CHANGED")
  guard()
  return { ...c, ledger, allocation, carry, claim, guard, startCell() { active = true; expectedLedger = leanBytesRoot(readLeanContinuationBoundedBytesV2(join(ledger.directory, "ledger.ndjson"), 4194304, 0o600, bytes => continuationCapacityV2(c.window, cumulativeLeanPhysicalBytes(ledger), bytes, true))); guard() }, finishCell() { active = false; expectedLedger = undefined }, closeRun() { active = false; expectedLedger = undefined; closure = true; closureBegan = Date.now() } }
}
export const runLeanBaselineContinuationV2 = async (requestPath: string) => {
  if (process.send || process.connected) return fail("V2_RUN_SCOPE")
  const c = openLeanBaselineContinuationContextV2(requestPath), { ledger } = c
  if (readLeanLedger(ledger).events.length || readLeanTimeAccounting(ledger).starts.size || readdirSync(ledger.directory).some(name => ["run-claim.json", "entry.json", "child-terminal.json", "result.json", "reader-claim.json"].includes(name))) return fail("V2_RUN_USED")
  c.guard()
  writeLeanContinuationArtifact(ledger, "run-claim.json", { schemaVersion: "lean-baseline-continuation-run-claim-v2", allocationRoot: c.allocation.root, windowRoot: c.window.root, requestBytesRoot: c.requestBytesRoot, head: c.fixedHead, runOperator: c.request.runOperator }, 65536)
  beginLeanInterval(ledger, "continuation-run-admission")
  try { c.guard() } finally { closeLeanInterval(ledger, "continuation-run-admission") }
  c.guard()
  return runLeanBoundedParent({ ledger, requestPath, allocationPath: CONTINUATION_V2.allocation, store: CONTINUATION_V2.store, sourceRoot: c.allocation.sourceRoot, manifestRoot: () => { c.guard(); const manifest = leanBaselineContinuationDataManifestV2(c.window, leanBaselineContinuationSourceManifestV2()); if (manifest.manifestRoot !== c.allocation.manifestRoot || manifest.planningRoot !== c.allocation.planningRoot) return fail("V2_MANIFEST_HOLD"); return manifest.root }, childMode: "child-continuation-v2", prospectiveStart: { wallStartMs: Date.now(), monotonicStartNs: process.hrtime.bigint().toString() }, beforeRelease: c.guard, terminalReserveMs: c.window.closureMs, supervisorObservation: true })
}

export const runLeanBaselineContinuationChildV2 = async (requestPath: string) => {
  const approvedWindow = readLeanBaselineContinuationWindowV2(); continuationWindowAdmissionV2(approvedWindow, 36)
  assertLeanBaselineContinuationScopeV2()
  if (requestPath !== CONTINUATION_V2.request || !process.send || !process.connected) return fail("CONTINUATION_CHILD_PARENT")
  const token = await new Promise<string>((accept, reject) => { const timer = setTimeout(() => reject(new TypeError("LEAN_CONTINUATION_HANDSHAKE")), 30000); process.once("disconnect", () => { clearTimeout(timer); reject(new TypeError("LEAN_CONTINUATION_PARENT_LOST")) }); process.once("message", value => { clearTimeout(timer); if (!exactLabKeys(value, ["release"]) || typeof value.release !== "string") { reject(new TypeError("LEAN_CONTINUATION_HANDSHAKE")); return }; accept(value.release) }); process.send!({ ready: process.pid }) })
  const ledger = openLeanLedger(CONTINUATION_V2.store), entry = readLeanChildEntry(ledger)
  admitLeanChildRelease(entry, token, process.pid, process.ppid)
  const c = openLeanBaselineContinuationContextV2(requestPath), parent = createLeanParentObservationGuard(entry.parentPid)
  assertLeanEntryBinding(entry, { head: c.fixedHead, sourceRoot: c.allocation.sourceRoot, requestBytesRoot: c.allocation.requestBytesRoot, allocationRoot: c.allocation.root, parentPid: process.ppid, childPid: process.pid, intervalStartMs: readLeanTimeAccounting(ledger).starts.get("pilot-entry") ?? -1 })
  const disconnect = () => { parent.disconnect(); process.exit(1) }
  process.once("disconnect", disconnect)
  const checkpoint = (additionalBytes = 0) => { parent.assert(); const sample = c.guard(additionalBytes); parent.assert(); return sample }
  const resourceReceipts: Array<{ ordinal: number; chargeRoot: LabRoot; before: ReturnType<typeof checkpoint>; after: ReturnType<typeof checkpoint> }> = []
  let pipeline: unknown = null, failed = false
  try {
    pipeline = await executeLeanBaselineContinuationPipelineV2({ allocation: c.allocation, heldHead: c.fixedHead, checkpoint, freezeSource: source => publishLeanBaselineContinuationSourceV2(ledger, source, checkpoint), retainArtifact(name, value) { if (!/^(?:seal-metadata|cold-corpus|initial-proposals|initial-selection|initial-training|initial-analysis|response-work|response-node-receipts|response-training|work-accounting|current-analysis)\.json$/u.test(name)) return fail("CONTINUATION_ARTIFACT_NAME"); checkpoint(3 * 4194304); writeLeanContinuationArtifact(ledger, name, value, 4194304); checkpoint() }, async dispatch(slot, bottom, top, observedRole) {
      checkpoint()
      const before = readLeanContinuationBoundedBytesV2(join(ledger.directory, "ledger.ndjson"), 4194304, 0o600, checkpoint)
      const pair = leanBaselinePair({ ordinal: slot.ordinal, slot, priorLedgerBytesRoot: leanBytesRoot(before), priorLedgerByteLength: before.length, priorCharged: readLeanLedger(ledger).charged, bottom, top })
      writeLeanContinuationArtifact(ledger, `pair-${slot.ordinal}.json`, pair, 16384); const resourceBefore = checkpoint()
      const fs = statfsSync(ledger.directory, { bigint: true }), charge = chargeLeanSlot(ledger, slot, { freeBytes: Number(fs.bavail * fs.bsize), availableMemoryBytes: observeLeagueAvailableMemoryBytes() })
      c.startCell()
      const execution = await runLeanBaselineContinuationMatchV2({ ledger, charge, slot, seed: c.allocation.seed, bottom, top, ...(observedRole === undefined ? {} : { observedRole }), checkpoint, register: parent.register, unregister: parent.unregister })
      c.finishCell(); checkpoint()
      retainLeanMatch(ledger, charge, execution.compact, execution.replayFrames, undefined, checkpoint)
      const { replayFrames: _frames, ...content } = execution
      const cell = { ...content, ordinal: slot.ordinal, slotRoot: slot.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot }
      const body = { schemaVersion: "lean-baseline-observation-v1", pairRoot: pair.root, cell }
      writeLeanContinuationArtifact(ledger, `observation-${slot.ordinal}.json`, { ...body, root: labRoot(body.schemaVersion, body) }, 8388608)
      if (execution.diagnostic) writeLeanContinuationArtifact(ledger, `diagnostic-${charge.root.slice(7)}.json`, execution.diagnostic, 16384)
      checkpointLeanResources(ledger, currentLeanElapsedMs(ledger), process.memoryUsage().arrayBuffers, measureLeanPhysicalBytes(CONTINUATION_V2.temp))
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
  try { evidence = verifyLeanEvidence(ledger, checkpoint, "continuation-descriptor-v2") } catch { failed = true }
  // Missing evidence stays missing. The charge, any published work/terminal,
  // and exact unused slots survive a host failure without imputed outcomes.
  const result = { schemaVersion: "lean-baseline-continuation-result-v2", issued: false, evidenceClass: "exploratory_current_only", allocationRoot: c.allocation.root, sourceRoot: c.allocation.sourceRoot, planningRoot: c.allocation.planningRoot, requestBytesRoot: c.allocation.requestBytesRoot, head: c.fixedHead, sourceHead: c.allocation.sourceHead, windowRoot: c.window.root, windowBytesRoot: c.allocation.windowBytesRoot, sourceGateRoot: c.allocation.sourceGateRoot, dataReviewRoot: c.allocation.dataReviewRoot, manifestRoot: c.allocation.manifestRoot, evidenceRoot: evidence?.root ?? null, pipeline, resourceReceipts, charged: state.charged, successful: [...state.terminals.values()].filter(row => row.record.classification === "success").length, status: complete && !failed ? "pending_independent_verification" : "partial_or_failed_baseline", elapsedMs: Math.max(state.elapsedMs, currentLeanElapsedMs(ledger)), physicalHighWaterBytes: state.physicalHighWaterBytes, scratchHighWaterBytes: state.scratchHighWaterBytes, unusedOrdinals: c.allocation.slots.filter(slot => !state.charges.has(slot.root)).map(slot => slot.ordinal), holdoutReservations: c.allocation.holdoutReservations, failure: failed ? "source_runtime_or_integrity_stop" : null, sourceAuthor: c.request.sourceAuthor, runOperator: c.request.runOperator, holdoutOpened: false, formationMaterialized: false }
  checkpoint(3 * 4194304); writeLeanContinuationArtifact(ledger, "result.json", result, 4194304); checkpoint()
  return result
}


export const leanBaselineMain = async (args: readonly string[]) => {
  const command = parseLeanBaselineCommand(args)
  if (command.mode === "prepare-continuation-v2") return prepareLeanBaselineContinuationV2(command.request)
  if (command.mode === "run-continuation-v2") return runLeanBaselineContinuationV2(command.request)
  if (command.mode === "verify-continuation-v2") { const reader = await import("./lib/v1-38-lean-baseline-retained.js"); return reader.verifyLeanBaselineContinuationRetainedV2(command.request) }
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
  if (childMode) void resolveLeanChildCliTerminal(action)
  else void action.then(value => { process.stdout.write(`${JSON.stringify(value)}\n`) }).catch(() => { process.stderr.write("LEAN_BASELINE_FAILED_DETAILS_WITHHELD\n"); process.exitCode = 1 })
}
