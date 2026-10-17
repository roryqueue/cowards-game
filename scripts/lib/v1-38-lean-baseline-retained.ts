/** One prospective, read-only reader for the private current-baseline route.
 * Historical pilot readers and their spent routes are intentionally absent. */
import { constants, closeSync, lstatSync, openSync, readFileSync, realpathSync, readdirSync, fstatSync, statfsSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { join, relative, resolve } from "node:path"
import { exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { auditLeanTrainingVector, trainLeanInitialCandidates, trainLeanResponse, LEAN_INITIAL_TRAINING_VECTOR, LEAN_TRAINING_VECTOR, type LeanColdTrainingManifest, type LeanColdTrainingInput, type LeanLegalExample } from "../../packages/strategy-lab/src/league/lean-training.js"
import { LEAN_CAPS, LEAN_BASELINE_REQUEST, LEAN_BASELINE_STORE, LEAN_EXTERNAL_SCRATCH_RESERVE, beginLeanInterval, closeLeanInterval, currentBaselineSlotKind, currentLeanElapsedMs, cumulativeLeanPhysicalBytes, leanBytesRoot, leanCanonicalBytes, openLeanLedger, readLeanChildEntry, readLeanChildTerminal, readLeanLedger, readLeanTimeAccounting, verifyLeanEvidence, type LeanCurrentBaselineAllocation, type LeanExperimentLedger } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { analyseLeanDistinctPairs, analyseLeanResponseAdmission, selectLeanMixtureTarget, type LeanMeasuredPair } from "./v1-38-lean-baseline-analysis.js"
import { leanColdProcedureRoot, leanBaselineMetricCoverage, compactLeanBaselineCell, type LeanBaselineObservedCell } from "./v1-38-lean-baseline-pipeline.js"
import { LEAN_BASELINE_REQUIRED_METRICS } from "./v1-38-lean-baseline-metrics.js"
import { LEAN_CONTINUATION_EXECUTOR_REASONS } from "./v1-38-lean-container-match-session.js"
import type { LeanContinuationExecutorDiagnostic, LeanContinuationFailureAccounting } from "./v1-38-lean-baseline-match.js"
import { readLeanBaselineSource, validateLeanBaselineSource, type LeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { inspectLeanSealMetadata } from "./v1-38-lean-seal-metadata.js"
import { buildLeanColdCorpus } from "./v1-38-lean-cold-corpus.js"
import { buildLeanInitialProposals, selectLeanBestTrainedProposal, selectLeanTrainedProposal } from "./v1-38-lean-training-adapter.js"
import { selectPlannerActivations } from "../../packages/strategy-lab/src/planner/assign.js"
import { buildPlannerCandidate } from "../../packages/strategy-lab/src/planner/emit.js"
import { emitTacticalSource } from "../../packages/strategy-oracle-tactical/src/emit.js"
import { authenticateLeanBaselineReview, deriveLeanBaselineCandidateRoots, deriveLeanBaselineRequestRoots, leanBaselineSourceManifest } from "../run-v1-38-lean-baseline.js"
import { authenticateLeanSupervisorDiagnosticCheck, authenticateLeanRetryClosureV8 } from "./v1-38-lean-correction-retained.js"
import { admitLeanRetryTimeboxExtension, admitLeanAllocation, leanCorrectionRoutePaths, leanSupervisorAllocationMode, isLeanRetryMode } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { leanCorrectionSourceManifest, authenticateLeanTwoPairAcceptedJoinV11, authenticateLeanSupervisorRetestAcceptedJoinV12, authenticateLeanPreparationContinuationAcceptedJoinV13, authenticateLeanPostV13FivePairAcceptedJoinV14 } from "../run-v1-38-lean-correction.js"
import { isLeanTwoPairMode, isLeanSupervisorRetestMode, isLeanPreparationContinuationMode, isLeanPostV13FivePairMode } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { validateLeanSupervisorReasonBytesV2 } from "../run-v1-38-lean-baseline.js"
import { validateLeanBaselineContinuationAllocation, validateLeanBaselineContinuationAllocationV2, leanBaselineContinuationPathsForRequestV2, leanBaselineContinuationPathsForWindowV2, LEAN_BASELINE_CONTINUATION_PATHS as CONTINUATION, LEAN_BASELINE_CONTINUATION_WINDOW, leanContinuationIdentityV2, leanContinuationGlobalFloorV2, type LeanBaselineContinuationAllocation, type LeanBaselineContinuationAllocationV2 } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { openLeanBaselineContinuationContext, openLeanBaselineContinuationContextV2, writeLeanContinuationArtifact, assertLeanBaselineContinuationScope } from "../run-v1-38-lean-baseline.js"
import { readLeanContinuationJson, readLeanContinuationJsonV2, assertLeanBaselineContinuationFrontier, assertLeanBaselineContinuationFrontierV2, type LeanContinuationFrontier } from "./v1-38-lean-baseline-continuation.js"
import { deriveLeanContinuationWorkAccounting } from "./v1-38-lean-baseline-pipeline.js"
import type { LeanResponseNodeReceipt, LeanResponseWork } from "../../packages/strategy-lab/src/league/lean-training.js"
import * as parentReaderContract from "../run-v1-38-lean-baseline.js"
import { measureLeanPhysicalBytes } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { observeLeagueAvailableMemoryBytes } from "../run-v1-38-serious-league.js"
import { LEAN_BASELINE_CONTINUATION_PATHS_V6, LEAN_BASELINE_CONTINUATION_PATHS_V7, LEAN_BASELINE_CONTINUATION_PATHS_V8, LEAN_BASELINE_CONTINUATION_PATHS_V9, LEAN_BASELINE_CONTINUATION_PATHS_V10, LEAN_BASELINE_CONTINUATION_PATHS_V11, LEAN_BASELINE_CONTINUATION_PATHS_V12, LEAN_BASELINE_CONTINUATION_PATHS_V13, readLeanAdmittedContinuationAllocationV2 } from "../../packages/strategy-lab/src/league/lean-experiment.js"

const fail = (code: string): never => { throw new TypeError(`LEAN_BASELINE_RETAINED_${code}`) }
/** Strict v12 custody join, shared by ordinary and terminal-only readers.
 * The caller authenticates the actual allocation/request/entry/terminal files;
 * this function accepts no filenames, IO, legacy upgrades or implied cleanup. */
export const assertLeanSupervisorReasonCustodyV2 = (bytes: Uint8Array, actual: {
  allocationRoot: LabRoot; sourceRoot: LabRoot; requestBytesRoot: LabRoot; entryBytesRoot: LabRoot
  head: string; parentPid: number; childPid: number; exitCode: number | null
  signal: string | null; status: "child_exited" | "child_failed"
}) => {
  const reason = validateLeanSupervisorReasonBytesV2(bytes)
  if (!exactLabKeys(actual, ["allocationRoot", "sourceRoot", "requestBytesRoot", "entryBytesRoot", "head", "parentPid", "childPid", "exitCode", "signal", "status"]) ||
    reason.allocationRoot !== actual.allocationRoot || reason.sourceRoot !== actual.sourceRoot || reason.requestBytesRoot !== actual.requestBytesRoot || reason.entryBytesRoot !== actual.entryBytesRoot || reason.head !== actual.head || reason.parentPid !== actual.parentPid || reason.childPid !== actual.childPid || reason.exitCode !== actual.exitCode || reason.signal !== actual.signal || !["child_exited", "child_failed"].includes(actual.status)) return fail("SUPERVISOR_CUSTODY_V2")
  const clean = reason.exitCode === 0 && !reason.uncertain && reason.observations.failureReceipt === "absent"
  if (actual.status !== (clean ? "child_exited" : "child_failed")) return fail("SUPERVISOR_CUSTODY_V2")
  return reason
}
/** Selected v8 baseline authority is the actual diagnostic check + FINAL close,
 * not an observation, synthetic report, or terminal-only/refusal receipt. */
export const assertLeanRetryBaselineJoinV8 = (allocation: import("../../packages/strategy-lab/src/league/lean-experiment.js").LeanCorrectionAllocation, check: { root: LabRoot; allocationRoot: LabRoot; readerCloseMs: number }, closure: { attemptOrdinal: number; closureClass: string; checkRoot: LabRoot | null; allocationRoot: LabRoot | null; root: LabRoot; readerCloseMs: number; finalReaderClose: boolean; acceptedCheckAbsent: boolean; sourceRoot: LabRoot; head: string; timeboxExtension?: import("../../packages/strategy-lab/src/league/lean-experiment.js").LeanRetryTimeboxExtension }, head: string) => {
  if (Object.hasOwn(allocation, "timeboxExtension")) admitLeanRetryTimeboxExtension(allocation.timeboxExtension)
  if (!same(allocation.timeboxExtension ?? null, closure.timeboxExtension ?? null) || allocation.schemaVersion !== "lean-correction-supervisor-baseline-allocation-v8" || allocation.attemptOrdinal !== closure.attemptOrdinal || closure.closureClass !== "accepted" || closure.finalReaderClose !== true || closure.acceptedCheckAbsent !== false || allocation.acceptedCheckRoot !== check.root || closure.checkRoot !== check.root || closure.allocationRoot !== check.allocationRoot || allocation.acceptedReaderCloseRoot !== closure.root || check.readerCloseMs !== closure.readerCloseMs || closure.sourceRoot !== allocation.sourceRoot || !/^[a-f0-9]{40}$/u.test(head) || !/^[a-f0-9]{40}$/u.test(closure.head)) return fail("RETRY_ACCEPTED_FINAL_JOIN")
}
/** Shared real accepted-file gate at publisher, issuer and selected reader. */
export const authenticateLeanRetryBaselineAuthorityV8 = (allocation: import("../../packages/strategy-lab/src/league/lean-experiment.js").LeanCorrectionAllocation, head: string) => {
  admitLeanAllocation(allocation)
  const mode = leanSupervisorAllocationMode(allocation)
  if (!isLeanRetryMode(mode)) return fail("RETRY_ACCEPTED_FINAL_JOIN")
  const { accepted: check, closure } = isLeanPostV13FivePairMode(mode) ? authenticateLeanPostV13FivePairAcceptedJoinV14(mode) : isLeanPreparationContinuationMode(mode) ? authenticateLeanPreparationContinuationAcceptedJoinV13(mode) : isLeanSupervisorRetestMode(mode) ? authenticateLeanSupervisorRetestAcceptedJoinV12(mode) : isLeanTwoPairMode(mode) ? authenticateLeanTwoPairAcceptedJoinV11(mode) : { accepted: authenticateLeanSupervisorDiagnosticCheck(mode), closure: authenticateLeanRetryClosureV8(mode) }
  assertLeanRetryBaselineJoinV8(allocation, check, closure, head)
  const lean = { diagnostic: leanCorrectionRoutePaths("diagnostic", mode), baseline: leanCorrectionRoutePaths("baseline", mode) }
  const diagnostic = openLeanLedger(lean.diagnostic.store), diagnosticEntry = readLeanChildEntry(diagnostic)
  if (diagnosticEntry.head !== closure.head || diagnosticEntry.allocationRoot !== check.allocationRoot || diagnosticEntry.sourceRoot !== allocation.sourceRoot || head !== execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", maxBuffer: 128 }).trim()) return fail("RETRY_COMMITTED_LINEAGE")
  try {
    // A new committed baseline allocation is mandatory; only source bytes,
    // not the two allocation commits, remain identical across this handoff.
    execFileSync("git", ["merge-base", "--is-ancestor", closure.head, head], { stdio: "pipe", maxBuffer: 1024 })
    const manifest = leanCorrectionSourceManifest(mode, allocation.timeboxExtension)
    if (manifest.root !== allocation.sourceRoot) return fail("RETRY_COMMITTED_LINEAGE")
    for (const commit of [closure.head, head]) execFileSync("git", ["diff", "--exit-code", commit, "--", ...manifest.entries.map(entry => entry.path)], { stdio: "pipe", maxBuffer: 1024 })
    for (const [commit, path, value] of [[closure.head, lean.diagnostic.allocation, diagnostic.allocation], [head, lean.baseline.allocation, allocation]] as const) {
      const bytes = execFileSync("git", ["show", `${commit}:${path}`], { maxBuffer: 262144 })
      if (leanBytesRoot(bytes) !== leanBytesRoot(leanCanonicalBytes(value))) return fail("RETRY_COMMITTED_LINEAGE")
    }
  } catch { return fail("RETRY_COMMITTED_LINEAGE") }
}
export const verifyLeanRetryBaselineRetainedV8 = async (path: string, mode: import("../../packages/strategy-lab/src/league/lean-experiment.js").LeanRetryMode, precheck?: () => void) => {
  const lean = await import("../../packages/strategy-lab/src/league/lean-experiment.js"), reader = await import("./v1-38-lean-correction-retained.js")
  const paths = lean.leanCorrectionRoutePaths("baseline", mode)
  if (path !== paths.request || !lean.isLeanRetryMode(mode)) return fail("RETRY_ACCEPTED_FINAL_JOIN")
  const ledger = openLeanLedger(paths.store), allocation = lean.admitLeanAllocation(ledger.allocation)
  if (!("route" in allocation) || allocation.route !== "baseline") return fail("RETRY_ACCEPTED_FINAL_JOIN")
  authenticateLeanRetryBaselineAuthorityV8(allocation, readLeanChildEntry(ledger).head)
  // The selected v12 wrapper enters through this owner; invoke the shared
  // generic audit exactly once, not the wrapper again (which would recurse).
  return reader.verifyLeanCorrectionRetained(path, "baseline", mode, precheck)
}
const rooted = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[0-9a-f]{64}$/u.test(v)
const natural = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0
const same = (left: unknown, right: unknown): boolean => labRoot("lean-baseline-retained-equality-v1", left) === labRoot("lean-baseline-retained-equality-v1", right)
const sourceRoles = ["cold-opponent", "probe", ...Array.from({ length: 4 }, (_, i) => `tactical-${i}`), "teacher-0", "initial-tactical", "initial-teacher", "response-0", "final-response"] as const
const planPath = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-PLAN.md"
const resultKeys = ["schemaVersion", "issued", "evidenceClass", "allocationRoot", "sourceRoot", "requestBytesRoot", "head", "evidenceRoot", "charged", "successful", "status", "pipeline", "elapsedMs", "physicalHighWaterBytes", "scratchHighWaterBytes", "holdoutOpened", "formationMaterialized"] as const

/** All file reads are bounded and descriptor-based; a symlink, alias or
 * noncanonical replacement cannot become evidence. */
const readPrivate = (path: string, maximum: number, guard: () => void = () => {}): Uint8Array => {
  guard()
  const p = resolve(path), stat = lstatSync(p)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || realpathSync(p) !== p || (stat.mode & 0o777) !== 0o600 || stat.size > maximum) return fail("FILE")
  const fd = openSync(p, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const bound = fstatSync(fd)
    if (bound.dev !== stat.dev || bound.ino !== stat.ino || bound.size !== stat.size || bound.nlink !== 1) return fail("FILE_RACE")
    const bytes = readFileSync(fd)
    const after = fstatSync(fd), current = lstatSync(p)
    if (bytes.length > maximum || bytes.length !== stat.size || after.dev !== stat.dev || after.ino !== stat.ino || after.size !== stat.size || current.dev !== stat.dev || current.ino !== stat.ino || current.size !== stat.size) return fail("FILE")
    guard()
    return bytes
  } finally { closeSync(fd) }
}
const parsePrivate = (path: string, maximum = 262144, guard: () => void = () => {}): unknown => {
  const bytes = readPrivate(path, maximum, guard)
  const value: unknown = JSON.parse(Buffer.from(bytes).toString("utf8"))
  if (leanBytesRoot(bytes) !== leanBytesRoot(leanCanonicalBytes(value))) return fail("CANONICAL")
  guard()
  return value
}

export interface LeanBaselinePairReceipt {
  readonly schemaVersion: "lean-baseline-pair-v1"
  readonly ordinal: number; readonly slotRoot: LabRoot; readonly requestRoot: LabRoot
  readonly bottomRole: string; readonly bottomSourceRoot: LabRoot; readonly bottomSnapshotRoot: LabRoot
  readonly topRole: string; readonly topSourceRoot: LabRoot; readonly topSnapshotRoot: LabRoot
  readonly priorLedgerBytesRoot: LabRoot; readonly priorLedgerByteLength: number; readonly priorCharged: number; readonly root: LabRoot
}
interface LeanBaselineObservationReceipt { readonly schemaVersion: "lean-baseline-observation-v1"; readonly pairRoot: LabRoot; readonly cell: LeanBaselineObservedCell; readonly root: LabRoot }
export interface LeanBaselineRetainedSnapshot {
  readonly allocation: LeanCurrentBaselineAllocation
  readonly request: Record<string, unknown>
  readonly requestBytesRoot: LabRoot
  readonly head: string
  readonly entry: ReturnType<typeof readLeanChildEntry>
  readonly terminal: ReturnType<typeof readLeanChildTerminal>
  readonly evidence: ReturnType<typeof verifyLeanEvidence>
  readonly ledgerEvents: ReturnType<typeof readLeanLedger>["events"]
  readonly time: ReturnType<typeof readLeanTimeAccounting>
  readonly result: Record<string, unknown>
  readonly pairs: readonly LeanBaselinePairReceipt[]
  readonly observations: readonly LeanBaselineObservationReceipt[]
  readonly sources: readonly LeanBaselineSource[]
  readonly artifacts: Readonly<Record<string, unknown>>
}
export type LeanBaselineContinuationRetainedSnapshot = Omit<LeanBaselineRetainedSnapshot, "allocation"> & { readonly allocation: LeanBaselineContinuationAllocation }
type BaselineContentSnapshot = LeanBaselineRetainedSnapshot | LeanBaselineContinuationRetainedSnapshot | LeanBaselineContinuationRetainedSnapshotV2

const assertRequest = (s: LeanBaselineRetainedSnapshot): void => {
  const a = s.allocation, r = s.request
  if (a.schemaVersion !== "lean-current-baseline-allocation-v1" || a.slots.length !== 36 || a.predecessor.chargedMatches !== 9 || a.predecessor.elapsedUpperBoundMs !== 3_305_606 || a.coldRoot !== leanColdProcedureRoot(a.seed) ||
      !exactLabKeys(r, ["schemaVersion", "seed", "reviewPath", "reviewRoot", "sourceRoot", "planRoot", "coldRoot", "candidateRoots", "requestRoots"]) ||
      r.schemaVersion !== "lean-current-baseline-request-v1" || r.seed !== a.seed || r.reviewRoot !== a.reviewRoot || r.sourceRoot !== a.sourceRoot || r.planRoot !== a.planRoot || r.coldRoot !== a.coldRoot ||
      !Array.isArray(r.candidateRoots) || !same([...r.candidateRoots].sort(), a.candidateRoots) || !same(r.requestRoots, a.requestRoots) || s.requestBytesRoot !== leanBytesRoot(leanCanonicalBytes(r)) ||
      !/^[a-f0-9]{40}$/u.test(s.head)) return fail("REQUEST")
  for (const [ordinal, slot] of a.slots.entries()) if (slot.ordinal !== ordinal || slot.requestRoot !== a.requestRoots[ordinal] || currentBaselineSlotKind(ordinal).condition !== slot.condition) return fail("SLOT")
}
const assertEntry = (s: LeanBaselineRetainedSnapshot): void => {
  const a = s.allocation, e = s.entry, t = s.terminal
  const verifierStarted = s.time.starts.has("baseline-retained-verifier"), verifierClosed = s.time.closed.has("baseline-retained-verifier")
  if (e.allocationRoot !== a.root || e.sourceRoot !== a.sourceRoot || e.requestBytesRoot !== s.requestBytesRoot || e.head !== s.head ||
      t.entryBytesRoot !== leanBytesRoot(leanCanonicalBytes(e)) || t.allocationRoot !== a.root || t.sourceRoot !== a.sourceRoot || t.head !== s.head || t.parentPid !== e.parentPid || t.childPid !== e.childPid ||
      t.status !== "child_exited" || t.exitCode !== 0 || t.signal !== null || s.time.starts.size !== 2 || s.time.closed.size !== (verifierClosed ? 2 : 1) || s.time.active === verifierClosed || !verifierStarted ||
      s.time.starts.get("pilot-entry") !== e.wallStartMs || s.time.closes.get("pilot-entry") !== e.wallStartMs + t.elapsedUpperBoundMs ||
      Number(s.time.starts.get("baseline-retained-verifier")) < Number(s.time.closes.get("pilot-entry")) ||
      verifierClosed && Number(s.time.closes.get("baseline-retained-verifier")) < Number(s.time.starts.get("baseline-retained-verifier")) ||
      s.time.elapsedMs > LEAN_CAPS.elapsedMs || s.evidence.charged > LEAN_CAPS.matches || s.evidence.physicalHighWaterBytes > LEAN_CAPS.totalBytes) return fail("ENTRY_TERMINAL")
}

const pairBodyKeys = ["schemaVersion", "ordinal", "slotRoot", "requestRoot", "bottomRole", "bottomSourceRoot", "bottomSnapshotRoot", "topRole", "topSourceRoot", "topSnapshotRoot", "priorLedgerBytesRoot", "priorLedgerByteLength", "priorCharged"]
const assertPairs = (s: BaselineContentSnapshot, byRole: Map<string, LeanBaselineSource>, chargedCount: number): void => {
  if (s.pairs.length !== chargedCount || s.pairs.length !== s.observations.length) return fail("PAIR_COUNT")
  const eventLines = s.ledgerEvents.map(event => Buffer.from(leanCanonicalBytes(event)).toString("utf8") + "\n")
  const chargeIndexes = s.ledgerEvents.map((event, index) => event.kind === "charge" ? index : -1).filter(index => index >= 0)
  for (let ordinal = 0; ordinal < s.pairs.length; ordinal++) {
    const pair = s.pairs[ordinal]!, slot = s.allocation.slots[ordinal]!
    if (!exactLabKeys(pair, [...pairBodyKeys, "root"]) || pair.schemaVersion !== "lean-baseline-pair-v1" || pair.ordinal !== ordinal || pair.slotRoot !== slot.root || pair.requestRoot !== slot.requestRoot || pair.priorCharged !== s.allocation.predecessor.chargedMatches + ordinal ||
        !rooted(pair.priorLedgerBytesRoot) || !natural(pair.priorLedgerByteLength) || pair.bottomRole === pair.topRole ||
        byRole.get(pair.bottomRole)?.sourceRoot !== pair.bottomSourceRoot || byRole.get(pair.bottomRole)?.root !== pair.bottomSnapshotRoot ||
        byRole.get(pair.topRole)?.sourceRoot !== pair.topSourceRoot || byRole.get(pair.topRole)?.root !== pair.topSnapshotRoot) return fail("PAIR_BINDING")
    const { root: _root, ...body } = pair
    if (pair.root !== labRoot("lean-baseline-pair-v1", body)) return fail("PAIR_ROOT")
    const chargeIndex = chargeIndexes[ordinal]
    if (chargeIndex === undefined) return fail("CHARGE_ORDER")
    const event = s.ledgerEvents[chargeIndex]
    if (event?.kind !== "charge" || event.charge.ordinal !== ordinal || event.charge.slotRoot !== slot.root) return fail("CHARGE_ORDER")
    // The receipt seals one actual pre-charge journal prefix. Resource events
    // may follow the receipt, but it cannot claim any later charge as prior.
    const prefix = eventLines.slice(0, chargeIndex).join("")
    if (pair.priorLedgerByteLength > Buffer.byteLength(prefix) ||
        !eventLines.slice(0, chargeIndex).some((_, index) => Buffer.byteLength(eventLines.slice(0, index + 1).join("")) === pair.priorLedgerByteLength) && pair.priorLedgerByteLength !== 0 ||
        leanBytesRoot(Buffer.from(prefix).subarray(0, pair.priorLedgerByteLength)) !== pair.priorLedgerBytesRoot) return fail("PAIR_CHRONOLOGY")
    const kind = currentBaselineSlotKind(ordinal).kind, roles = [pair.bottomRole, pair.topRole]
    const has = (left: string, right: string) => roles.includes(left) && roles.includes(right)
    if (kind === "initial_training" && !(ordinal < 4 ? has(`tactical-${ordinal}`, "cold-opponent") : has("teacher-0", "cold-opponent")) ||
        kind === "initial_matrix" && !has("initial-tactical", "initial-teacher") ||
        kind === "response_training" && (!roles.includes("response-0") || !roles.some(r => r === "initial-tactical" || r === "initial-teacher")) ||
        kind === "response_pairing" && !(ordinal < 24 ? has("final-response", "initial-tactical") : has("final-response", "initial-teacher")) ||
        kind === "probe" && (!roles.includes("probe") || !roles.some(r => r === "initial-tactical" || r === "initial-teacher" || r === "final-response")) ||
        kind === "repeat" && !has("initial-tactical", "initial-teacher")) return fail("PAIR_ROLE")
    const entrantRole = kind === "initial_training" ? ordinal < 4 ? `tactical-${ordinal}` : "teacher-0" :
      kind === "initial_matrix" || kind === "repeat" ? "initial-tactical" :
      kind === "response_training" ? "response-0" : kind === "response_pairing" ? "final-response" :
      roles.find(role => role !== "probe") ?? fail("PAIR_ROLE")
    const targetRole = roles.find(role => role !== entrantRole) ?? fail("PAIR_ROLE")
    if (pair.bottomRole !== (slot.condition < 2 ? entrantRole : targetRole) || pair.topRole !== (slot.condition < 2 ? targetRole : entrantRole)) return fail("PAIR_SEAT")
  }
}

const measured = (cell: LeanBaselineObservedCell): LeanMeasuredPair => {
  if (cell.compact.classification !== "success" || !cell.compact.outcome || !cell.semanticRoot) return fail("MEASURED")
  return { ordinal: cell.ordinal, bottomSourceRoot: cell.bottomRoot, topSourceRoot: cell.topRoot, outcome: cell.compact.outcome, executionRoot: cell.compact.executionRoot, semanticRoot: cell.semanticRoot }
}
const trainingPoints = (cell: LeanBaselineObservedCell): 0 | 1 | 2 => cell.trainingHalfPoints ?? fail("TRAINING_POINTS")
const observedExamples = (cells: readonly LeanBaselineObservedCell[], perMatch: number): LeanLegalExample[] => cells.flatMap(cell => {
  if (!cell.brainInputs.length || cell.trainingHalfPoints === null) return fail("TRAINING_EXAMPLES")
  return Array.from({ length: perMatch }, (_, ordinal) => ({ input: cell.brainInputs[ordinal % cell.brainInputs.length]!, trainingHalfPoints: trainingPoints(cell), trainingMatchRoot: cell.compact.executionRoot }))
})
const assertSealMetadata = (value: unknown): void => {
  if (!exactLabKeys(value, ["schemaVersion", "protocol", "originalPublicReference", "checkoutDirty", "originalCompatibleUnopenedSealVerified", "privateStoreOrPreimageRead", "newExploratorySealCreated", "reservedHoldoutPerProfile", "disposition", "reason", "claims", "root"])) return fail("SEAL_METADATA")
  const v = value as Record<string, unknown>
  const metadata = (item: unknown) => exactLabKeys(item, ["present", "bytesRoot"]) && typeof item.present === "boolean" && (item.present ? rooted(item.bytesRoot) : item.bytesRoot === null)
  if (v.schemaVersion !== "lean-seal-metadata-inventory-v1" || !metadata(v.protocol) || !metadata(v.originalPublicReference) || typeof v.checkoutDirty !== "boolean" ||
      v.originalCompatibleUnopenedSealVerified !== false || v.privateStoreOrPreimageRead !== false || v.newExploratorySealCreated !== false || v.reservedHoldoutPerProfile !== 4 ||
      v.disposition !== "holdout_claim_deferred_no_verified_compatible_seal" || v.reason !== (v.checkoutDirty ? "existing_clean_checkout_seal_prerequisite_not_met" : "compatible_original_seal_and_new_safe_provenance_not_established") ||
      !exactLabKeys(v.claims, ["absenceOfAllExternalSealsProved", "originalCommitmentSatisfied", "holdoutOpened"]) || Object.values(v.claims).some(flag => flag !== false)) return fail("SEAL_METADATA")
  const { root, ...body } = v
  if (root !== labRoot("lean-seal-metadata-inventory-v1", body)) return fail("SEAL_ROOT")
}

/** Pure audit surface for synthetic regressions. It never creates an allocation,
 * publishes a file, starts a provider, or executes Strategy source. */
export const auditLeanCurrentBaselineRetained = (s: LeanBaselineRetainedSnapshot, guard: () => void = () => {}) => {
  guard()
  assertRequest(s); assertEntry(s)
  return auditBaselineContent(s, guard, false)
}
/** Witness shape/join validation only. Retained authority additionally requires
 * validateLeanContinuationFailureDiagnostic against the charged terminal. */
export const validateLeanContinuationExecutorDiagnostic = (value: unknown, expected: { allocationRoot: LabRoot; chargeRoot: LabRoot; accountingRoot: LabRoot; executionRoot: LabRoot; sourceRoots: readonly LabRoot[]; method: unknown; ordinal: unknown; code: unknown }): LeanContinuationExecutorDiagnostic => {
  const keys = ["schemaVersion", "availability", "originAvailability", "allocationRoot", "chargeRoot", "accountingRoot", "executionRoot", "sourceRoot", "executableRoot", "invocationRoot", "requestIdRoot", "inputRoot", "method", "ordinal", "stage", "reason", "code", "initiatingCause", "root"]
  if (!value || typeof value !== "object" || Array.isArray(value) || !exactLabKeys(value, keys)) return fail("CONTINUATION_EXECUTOR")
  const d = value as unknown as LeanContinuationExecutorDiagnostic
  if (d.schemaVersion !== "lean-continuation-executor-diagnostic-v1" || d.availability !== "available" || !["available", "unavailable"].includes(d.originAvailability) || d.initiatingCause !== "unknown" || d.code !== "SUBPROCESS_EXIT" || d.code !== expected.code || ![d.allocationRoot, d.chargeRoot, d.accountingRoot, d.executionRoot, d.sourceRoot, d.executableRoot, d.invocationRoot, d.requestIdRoot, d.inputRoot, d.root].every(rooted) || d.allocationRoot !== expected.allocationRoot || d.chargeRoot !== expected.chargeRoot || d.accountingRoot !== expected.accountingRoot || d.executionRoot !== expected.executionRoot || !expected.sourceRoots.includes(d.sourceRoot) || !["selectActivations", "soldierBrain"].includes(d.method) || d.method !== expected.method || !natural(d.ordinal) || d.ordinal >= 24800 || d.ordinal !== expected.ordinal || (d.reason === "unknown" ? d.stage !== "unknown" : d.stage !== "executor" || d.originAvailability !== "available" || !(LEAN_CONTINUATION_EXECUTOR_REASONS as readonly string[]).includes(d.reason))) return fail("CONTINUATION_EXECUTOR")
  const { root, ...body } = d
  if (root !== labRoot(d.schemaVersion, body)) return fail("CONTINUATION_EXECUTOR")
  return d
}
/** The prospective continuation reader requires this version for EVERY failed
 * terminal, based on the frozen compact classification rather than sidecar
 * presence/code. Pre-policy continuation failures are explicitly unsupported;
 * the legacy reader and successful-record accounting remain unchanged. */
export const validateLeanContinuationFailureDiagnostic = (value: unknown, expected: { allocationRoot: LabRoot; chargeRoot: LabRoot; accountingRoot: LabRoot; executionRoot: LabRoot; sourceRoots: readonly LabRoot[]; classification: string; compactCode: string }) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail("CONTINUATION_EXECUTOR_COMMITMENT")
  const d = value as Record<string, unknown>, extension = d.continuationExecutor
  if (!exactLabKeys(d, ["schemaVersion", "chargeRoot", "stage", "reason", "code", "method", "ordinal", "failureAccounting", ...(extension === undefined ? [] : ["continuationExecutor"])]) || d.schemaVersion !== "lean-supervisor-diagnostic-v1" || d.chargeRoot !== expected.chargeRoot || !exactLabKeys(d.failureAccounting, ["schemaVersion", "canonicalAccountingRoot", "executionRoot", "diagnosticRoot", "root"])) return fail("CONTINUATION_EXECUTOR_COMMITMENT")
  const c = d.failureAccounting as unknown as LeanContinuationFailureAccounting
  const { failureAccounting: _commitment, ...diagnostic } = d
  const { root, ...body } = c
  if (c.schemaVersion !== "lean-continuation-failure-accounting-v1" || ![c.canonicalAccountingRoot, c.executionRoot, c.diagnosticRoot, c.root].every(rooted) || c.executionRoot !== expected.executionRoot || c.diagnosticRoot !== labRoot("lean-continuation-failure-diagnostic-v1", diagnostic) || root !== labRoot(c.schemaVersion, body) || root !== expected.accountingRoot) return fail("CONTINUATION_EXECUTOR_COMMITMENT")
  if (d.code === "SUBPROCESS_EXIT" || extension !== undefined) {
    if (expected.classification !== "system_failure" || !["SUPERVISOR_FAILURE", "CLEANUP"].includes(expected.compactCode)) return fail("CONTINUATION_EXECUTOR")
    validateLeanContinuationExecutorDiagnostic(extension, { ...expected, accountingRoot: c.canonicalAccountingRoot, method: d.method, ordinal: d.ordinal, code: d.code })
  }
  return d
}
const auditBaselineContent = (s: BaselineContentSnapshot, guard: () => void, continuation: false | "v1" | "v2") => {
  guard()
  const r = s.result, a = s.allocation, pipeline = r.pipeline as Record<string, unknown>
  const aV2 = continuation === "v2" ? a as LeanBaselineContinuationAllocationV2 : undefined
  const isContinuation = continuation !== false, priorMatches = a.predecessor.chargedMatches
  assertSealMetadata(s.artifacts["seal-metadata.json"])
  const continuationResultKeys = [...resultKeys, "planningRoot", "unusedOrdinals", "holdoutReservations", "failure", "sourceAuthor", "runOperator", "resourceReceipts", ...(continuation === "v2" ? ["sourceHead", "windowRoot", "windowBytesRoot", "sourceGateRoot", "dataReviewRoot", "manifestRoot"] : [])]
  if (!exactLabKeys(r, isContinuation ? continuationResultKeys : resultKeys) || r.schemaVersion !== (continuation === "v2" ? "lean-baseline-continuation-result-v2" : continuation === "v1" ? "lean-baseline-continuation-result-v1" : "lean-current-baseline-result-v1") || r.issued !== false || r.evidenceClass !== "exploratory_current_only" || r.allocationRoot !== a.root || r.sourceRoot !== a.sourceRoot || r.requestBytesRoot !== s.requestBytesRoot || r.head !== s.head || r.evidenceRoot !== s.evidence.root ||
      continuation === "v2" && (!aV2 || r.sourceHead !== aV2.sourceHead || r.planningRoot !== aV2.planningRoot || r.windowRoot !== aV2.window.root || r.windowBytesRoot !== aV2.windowBytesRoot || r.sourceGateRoot !== aV2.sourceGateRoot || r.dataReviewRoot !== aV2.dataReviewRoot || r.manifestRoot !== aV2.manifestRoot) ||
      !natural(r.charged) || !natural(r.successful) || !pipeline || typeof pipeline !== "object" || Array.isArray(pipeline) || !Array.isArray(pipeline.cells) || !Array.isArray(pipeline.sources) || !rooted(pipeline.root) ||
      pipeline.holdoutOpened !== false || pipeline.formationMaterialized !== false || r.holdoutOpened !== false || r.formationMaterialized !== false ||
      !natural(r.elapsedMs) || !natural(r.physicalHighWaterBytes) || !natural(r.scratchHighWaterBytes) || (isContinuation ? Number(r.elapsedMs) < s.evidence.elapsedMs : r.elapsedMs !== s.evidence.elapsedMs) || r.physicalHighWaterBytes !== s.evidence.physicalHighWaterBytes || r.scratchHighWaterBytes !== s.evidence.scratchHighWaterBytes || Number(r.elapsedMs) > s.time.elapsedMs || Number(r.elapsedMs) < a.predecessor.elapsedUpperBoundMs ||
      Number(r.physicalHighWaterBytes) > LEAN_CAPS.totalBytes || Number(r.scratchHighWaterBytes) > LEAN_CAPS.scratchBytes || s.ledgerEvents.at(-1)?.kind !== "stop") return fail("RESULT")
  const { root: _root, ...pipelineBody } = pipeline
  if (pipeline.root !== labRoot(continuation === "v2" ? "lean-baseline-continuation-pipeline-v2" : continuation === "v1" ? "lean-baseline-continuation-pipeline-v1" : "lean-current-baseline-pipeline-v1", pipelineBody)) return fail("PIPELINE_ROOT")
  const newCharges = s.evidence.records.filter(row => row.chargeRoot !== null).length
  const successful = s.evidence.records.filter(row => row.status === "success").length
  if (r.charged !== s.evidence.charged || newCharges !== s.observations.length || r.successful !== successful || s.evidence.charged !== priorMatches + newCharges || successful > newCharges) return fail("ACCOUNTING")
  const byRole = new Map(s.sources.map(source => [source.role, source]))
  if (byRole.size !== s.sources.length || s.sources.some(source => source.coldRoot !== a.coldRoot || source.implementationRoot !== a.sourceRoot) ||
      !same(pipeline.sources, s.sources.map(source => ({ role: source.role, sourceRoot: source.sourceRoot, snapshotRoot: source.root })))) return fail("SOURCES")
  assertPairs(s, byRole, newCharges)
  guard()
  for (let i = 0; i < newCharges; i++) {
    guard()
    const receipt = s.observations[i]!, cell = receipt.cell, pair = s.pairs[i]!, record = s.evidence.records[i]!
    if (!exactLabKeys(receipt, ["schemaVersion", "pairRoot", "cell", "root"]) || receipt.schemaVersion !== "lean-baseline-observation-v1" || receipt.pairRoot !== pair.root ||
        receipt.root !== labRoot("lean-baseline-observation-v1", { schemaVersion: receipt.schemaVersion, pairRoot: receipt.pairRoot, cell })) return fail("OBSERVATION_RECEIPT")
    if (!exactLabKeys(cell, ["ordinal", "slotRoot", "bottomRoot", "topRoot", "compact", "brainInputs", "strategyInputs", "trainingHalfPoints", "semanticRoot", "metrics", "decisionRoot", "diagnostic"]) ||
        cell.ordinal !== i || cell.slotRoot !== a.slots[i]!.root || cell.bottomRoot !== pair.bottomSourceRoot || cell.topRoot !== pair.topSourceRoot ||
        !same(cell.compact, record.terminal?.record) || !rooted(cell.decisionRoot) ||
        (cell.compact.classification === "success" ? !cell.compact.cleanupComplete || !rooted(cell.semanticRoot) || cell.diagnostic !== null : cell.semanticRoot !== null) ||
        !same((pipeline.cells as unknown[])[i], compactLeanBaselineCell(cell))) return fail("OBSERVATION")
    if (isContinuation && cell.compact.classification !== "success") {
      if (!record.chargeRoot) return fail("CONTINUATION_EXECUTOR_COMMITMENT")
      validateLeanContinuationFailureDiagnostic(cell.diagnostic, { allocationRoot: a.root, chargeRoot: record.chargeRoot, accountingRoot: record.terminal!.record.accountingRoot, executionRoot: record.terminal!.record.executionRoot, sourceRoots: [pair.bottomSourceRoot, pair.topSourceRoot], classification: record.terminal!.record.classification, compactCode: record.terminal!.record.code })
    }
    const metric = cell.metrics
    const alwaysMissing = ["forced_evacuation", "first_contraction_unselected_reserves", "push_and_block_causes", "opening_normalized_entropy", "center_wing_convoy_turtle"] as const
    if (!exactLabKeys(metric, ["schemaVersion", "source", "executionRoot", "measurements", "missing", "formationComparison", "root"]) ||
        metric.schemaVersion !== "v1.38-lean-baseline-match-metrics-v1" || metric.executionRoot !== cell.compact.executionRoot ||
        metric.source !== (cell.compact.classification === "success" ? "actual_canonical_trace" : "unavailable") ||
        metric.formationComparison !== "inconclusive" || !Array.isArray(metric.missing) || new Set(metric.missing).size !== metric.missing.length ||
        !same(metric.missing, LEAN_BASELINE_REQUIRED_METRICS.filter(key => metric.missing.includes(key))) ||
        !alwaysMissing.every(key => metric.missing.includes(key)) ||
        !exactLabKeys(metric.measurements, ["terminalLength", "terminalActivationCount", "cycleCount", "contractionCount", "activeSurvival", "firstEnemyAwarenessActivation", "firstContactActivation", "firstBackstabActivation", "firstPushActivation", "firstStoneActivation", "firstDecisiveActivation", "contractionFallCount", "advances", "stones", "pushes", "moveBlocks", "pushBlocks", "openingCluster"])) return fail("METRICS")
    const m = metric.measurements
    const numericKeys = ["terminalLength", "terminalActivationCount", "cycleCount", "contractionCount", "firstEnemyAwarenessActivation", "firstContactActivation", "firstBackstabActivation", "firstPushActivation", "firstStoneActivation", "firstDecisiveActivation", "contractionFallCount", "advances", "stones", "pushes", "moveBlocks", "pushBlocks"] as const
    if (numericKeys.some(key => m[key] !== null && (!natural(m[key]) || Number(m[key]) > (key === "terminalLength" ? cell.compact.telemetry.transitions : cell.compact.telemetry.events))) ||
        m.activeSurvival !== null && (!Array.isArray(m.activeSurvival) || m.activeSurvival.length !== 2 || m.activeSurvival.some(value => !natural(value) || value > 16)) ||
        m.openingCluster !== null && !rooted(m.openingCluster) ||
        m.openingCluster === null && !metric.missing.includes("opening_cluster") ||
        metric.source === "unavailable" && (metric.missing.length !== LEAN_BASELINE_REQUIRED_METRICS.length || numericKeys.some(key => m[key] !== null) || m.activeSurvival !== null || m.openingCluster !== null)) return fail("METRICS_VALUES")
    const { root: _metricRoot, ...metricBody } = metric
    if (metric.root !== labRoot("lean-baseline-match-metrics-v1", metricBody)) return fail("METRICS_ROOT")
    const kind = currentBaselineSlotKind(i).kind
    const observedRole = kind === "initial_training" ? i < 4 ? `tactical-${i}` : "teacher-0" : kind === "response_training" ? "response-0" : null
    const observedSeat = observedRole === pair.bottomRole ? "bottom" : observedRole === pair.topRole ? "top" : null
    const expectedPoints = cell.compact.classification !== "success" || cell.compact.outcome === null ? null : cell.compact.outcome === "DRAW" ? 1 : observedSeat && cell.compact.outcome === observedSeat ? 2 : 0
    if (cell.trainingHalfPoints !== expectedPoints || kind === "initial_training" && cell.compact.classification === "success" && cell.brainInputs.length === 0 ||
        kind === "response_training" && cell.compact.classification === "success" && cell.strategyInputs.length === 0) return fail("TRAINING_OBSERVATION")
  }
  if ((pipeline.cells as unknown[]).length !== newCharges) return fail("CELL_COUNT")
  if (!same(pipeline.measurement, leanBaselineMetricCoverage(s.observations.map(receipt => receipt.cell)))) return fail("METRIC_COVERAGE")
  const complete = pipeline.status === "current_baseline_complete"
    if (complete) {
    guard()
    if (newCharges !== 36 || successful !== 36 || pipeline.stage !== "complete" || pipeline.claim !== "no_robust_pure_claimed" ||
        !exactLabKeys(pipeline.solver, ["completeDistinctPairCells", "repeatsExcluded", "noHistoricalFullSnapshotCredit"]) ||
        (pipeline.solver as Record<string, unknown>).completeDistinctPairCells !== 12 || (pipeline.solver as Record<string, unknown>).repeatsExcluded !== true || (pipeline.solver as Record<string, unknown>).noHistoricalFullSnapshotCredit !== true ||
        !exactLabKeys(pipeline.repeat, ["matches", "semanticEqual"]) || (pipeline.repeat as Record<string, unknown>).matches !== 4 || (pipeline.repeat as Record<string, unknown>).semanticEqual !== true) return fail("COMPLETE_CLAIM")
    const initial = s.artifacts["initial-training.json"] as LeanColdTrainingManifest
    const final = s.artifacts["response-training.json"] as LeanColdTrainingManifest
    if (!initial || !final || auditLeanTrainingVector(initial).vector !== LEAN_INITIAL_TRAINING_VECTOR || auditLeanTrainingVector(final).vector !== LEAN_TRAINING_VECTOR ||
        initial.coldRoot !== a.coldRoot || final.coldRoot !== a.coldRoot || final.corpusRoot !== initial.corpusRoot || !same(pipeline.training, final) ||
        !same(final.candidates.slice(0, 2), initial.candidates)) return fail("TRAINING")
    const corpus = buildLeanColdCorpus(a.seed)
    guard()
    if (!same(s.artifacts["cold-corpus.json"], corpus) || initial.corpusRoot !== corpus.corpusRoot) return fail("COLD_CORPUS")
    const proposals = buildLeanInitialProposals({ commonSourceRoot: a.coldRoot, tacticalInputs: corpus.tacticalInputs, teacherSearchReceipts: corpus.teacherSearchReceipts })
    guard()
    if (!same(s.artifacts["initial-proposals.json"], proposals)) return fail("INITIAL_PROPOSALS")
    if (byRole.get("cold-opponent")?.source !== emitTacticalSource() || byRole.get("probe")?.source !== buildPlannerCandidate().source ||
        byRole.get("response-0")?.source !== buildPlannerCandidate().source ||
        proposals.tactical.some((proposal, index) => byRole.get(`tactical-${index}`)?.sourceRoot !== proposal.sourceRoot) ||
        byRole.get("teacher-0")?.sourceRoot !== proposals.teacher.sourceRoot) return fail("COLD_SOURCE")
    const initialCells = s.observations.slice(0, 8).map(receipt => receipt.cell)
    const tacticalSelection = selectLeanBestTrainedProposal(proposals.tactical, initialCells.slice(0, 4).map((cell, index) => ({ proposalRoot: proposals.tactical[index]!.root, trainingMatchRoot: cell.compact.executionRoot, trainingHalfPoints: trainingPoints(cell) })))
    const teacherSelection = selectLeanTrainedProposal(proposals.teacher, initialCells.slice(4, 8).map(cell => ({ trainingMatchRoot: cell.compact.executionRoot, trainingHalfPoints: trainingPoints(cell) })))
    if (!same(s.artifacts["initial-selection.json"], { tactical: tacticalSelection, teacher: teacherSelection, limitation: "one-match-per-tactical-variation-condition-confounded-no-strength-claim" }) ||
        initial.candidates[0]!.sourceRoot !== tacticalSelection.selectedSourceRoot || initial.candidates[1]!.sourceRoot !== teacherSelection.selectedSourceRoot) return fail("INITIAL_SELECTION")
    const common: LeanColdTrainingInput = { coldRoot: a.coldRoot, corpusRoot: corpus.corpusRoot, armRoot: labRoot("lean-current-arm-v1", a.coldRoot), commonSourceRoot: a.coldRoot, frozenTacticalInputs: corpus.tacticalInputs, teacherSearchReceipts: corpus.teacherSearchReceipts, trainingExamples: observedExamples(initialCells, 16) }
    const rebuiltInitial = trainLeanInitialCandidates(common, {
      tactical: () => ({ source: tacticalSelection.selectedSource, decision: { proposalSetRoot: proposals.root, selectionRoot: tacticalSelection.root, supervisedMatchRoots: initialCells.slice(0, 4).map(cell => cell.compact.executionRoot) }, evaluatedLegalInputRoots: proposals.tactical[0]!.inputRoots, teacherSearchNodeRoots: [], distillationExampleRoots: [] }),
      teacher: () => ({ source: teacherSelection.selectedSource, decision: { proposalSetRoot: proposals.root, selectionRoot: teacherSelection.root, distinctLegalLabels: proposals.teacherProjectedDistinctLabelCount, resamplingRoot: proposals.teacherResamplingRoot }, evaluatedLegalInputRoots: [], teacherSearchNodeRoots: proposals.teacherSearchNodeRoots, distillationExampleRoots: proposals.distillationExampleRoots }),
    })
    guard()
    if (!same(initial, rebuiltInitial)) return fail("REBUILT_INITIAL")
    const initially = [byRole.get("initial-tactical")!, byRole.get("initial-teacher")!], response = byRole.get("final-response")!
    if (initially.some(source => !source) || !response || initially.some((source, i) => source.sourceRoot !== initial.candidates[i]!.sourceRoot) || response.sourceRoot !== final.candidates[2]!.sourceRoot) return fail("TRAINED_SOURCE")
    const initialAnalysis = analyseLeanDistinctPairs(initially.map(source => source.sourceRoot), s.observations.slice(8, 12).map(receipt => measured(receipt.cell)))
    if (!initialAnalysis.mixture || !same(s.artifacts["initial-analysis.json"], initialAnalysis)) return fail("INITIAL_SOLVER")
    for (let ordinal = 12; ordinal < 20; ordinal++) {
      const targetRoot = ordinal < 16 ? selectLeanMixtureTarget(initialAnalysis.mixture, ordinal - 12) : initialAnalysis.selectedPureRoot
      const pair = s.pairs[ordinal]!
      if (pair.bottomSourceRoot !== targetRoot && pair.topSourceRoot !== targetRoot) return fail("RESPONSE_TARGET")
    }
    const work = s.artifacts["response-work.json"] as Record<string, unknown>
    if (!exactLabKeys(work, ["targetRoots", "plannerEvidence", "responseNodeCap", "actualAssignmentNodes", "selectedPlannerBudget", "matchOutcomes", "realizedTrainingHalfPoints", "commonSourceRoot", "plannerNodeRoots"]) ||
        work.responseNodeCap !== 128 || !natural(work.actualAssignmentNodes) || work.actualAssignmentNodes > 128 ||
        !Array.isArray(work.plannerEvidence) || work.plannerEvidence.length !== 8 ||
        work.plannerEvidence.some(row => !exactLabKeys(row, ["trainingMatchRoot", "allocation", "actualNodes", "nodeRoot"]) || !natural(row.allocation) || !natural(row.actualNodes) || Number(row.actualNodes) > Number(row.allocation)) ||
        work.actualAssignmentNodes !== work.plannerEvidence.reduce<number>((sum, row) => sum + Number((row as Record<string, unknown>).actualNodes), 0) ||
        labRoot("lean-training-decision-v1", work) !== final.candidates[2]!.decisionRoot) return fail("RESPONSE_WORK")
    const plannerEvidence = work.plannerEvidence as readonly { trainingMatchRoot: LabRoot; allocation: number; actualNodes: number; nodeRoot: LabRoot }[]
    const responseTrainingCells = s.observations.slice(12, 20).map(receipt => receipt.cell)
    const orderedResponseInputs = responseTrainingCells.map(cell => ({ trainingMatchRoot: cell.compact.executionRoot, input: cell.strategyInputs[0] }))
      .sort((left, right) => left.trainingMatchRoot.localeCompare(right.trainingMatchRoot))
    if (orderedResponseInputs.some(row => !row.input) || !same(plannerEvidence.map(row => row.trainingMatchRoot), orderedResponseInputs.map(row => row.trainingMatchRoot))) return fail("RESPONSE_INPUTS")
    for (const [ordinal, row] of orderedResponseInputs.entries()) {
      guard()
      const evidence = plannerEvidence[ordinal]!, output = selectPlannerActivations(row.input!, { maxExpansions: evidence.allocation })
      const actualNodes = Number((output.strategyMemory as { planner?: { expansions?: unknown } } | undefined)?.planner?.expansions)
      if (actualNodes !== evidence.actualNodes || evidence.nodeRoot !== labRoot("lean-response-planner-node-v1", { ordinal, trainingMatchRoot: row.trainingMatchRoot, allocation: evidence.allocation, actualNodes, inputRoot: labRoot("runtime-input", row.input), output })) return fail("RESPONSE_ACTUAL_WORK")
    }
    if (!same(work.plannerNodeRoots, plannerEvidence.map(row => row.nodeRoot)) || !same(final.candidates[2]!.workRoots.responseNodes, plannerEvidence.map(row => row.nodeRoot))) return fail("RESPONSE_NODE_ROOTS")
    let rebuiltWork: unknown = null
    const rebuiltFinal = trainLeanResponse({ ...common, initial: rebuiltInitial, responseExamples: observedExamples(responseTrainingCells, 8), responsePlannerNodes: responseTrainingCells.map(cell => ({ input: cell.strategyInputs[0]!, trainingMatchRoot: cell.compact.executionRoot })), targetRoots: { mixture: labRoot("lean-frozen-initial-mixture-v1", initialAnalysis.mixture), strongestPure: initialAnalysis.selectedPureRoot } }, candidateWork => { rebuiltWork = candidateWork })
    guard()
    if (!same(final, rebuiltFinal) || !same(work, rebuiltWork)) return fail("REBUILT_RESPONSE")
    const analysis = analyseLeanDistinctPairs([...initially.map(source => source.sourceRoot), response.sourceRoot], s.observations.slice(8, 12).concat(s.observations.slice(20, 28)).map(receipt => measured(receipt.cell)))
    guard()
    const responseCells = s.observations.slice(20, 28).map(receipt => receipt.cell)
    const responseAdmission = analyseLeanResponseAdmission({ initialSources: initially.map(source => source.sourceRoot), frozenMixture: initialAnalysis.mixture, strongestPureRoot: initialAnalysis.selectedPureRoot, strongestInitialMinimumHalfPoints: initialAnalysis.pure[0]!.minimumHalfPoints, responseRoot: response.sourceRoot, responseCells: responseCells.map(measured) })
    const eligible = responseAdmission.admitted ? [...initially, response] : initially
    const selected = analysis.pure.find(row => eligible.some(source => source.sourceRoot === row.sourceRoot))?.sourceRoot
    const probePoints = s.observations.slice(28, 32).map(receipt => {
      const cell = receipt.cell
      if (!selected || (cell.bottomRoot !== selected && cell.topRoot !== selected)) return fail("PROBE_PAIR")
      return cell.compact.outcome === "DRAW" ? 1 : (cell.compact.outcome === "bottom" ? cell.bottomRoot : cell.topRoot) === selected ? 2 : 0
    })
    if (pipeline.initialAnalysisRoot !== initialAnalysis.root || pipeline.analysisRoot !== analysis.root || pipeline.selectedPureRoot !== selected ||
        !same(pipeline.eligiblePureRoots, eligible.map(source => source.sourceRoot).sort()) ||
        !same(s.artifacts["initial-analysis.json"], initialAnalysis) || !same(s.artifacts["current-analysis.json"], analysis) ||
        !s.observations.slice(32, 36).every((receipt, i) => receipt.cell.semanticRoot === s.observations[8 + i]!.cell.semanticRoot)) return fail("SOLVER_REPEAT")
    if (!exactLabKeys(pipeline.response, ["attemptCount", ...Object.keys(responseAdmission)]) ||
        !same(pipeline.response, { attemptCount: 1, ...responseAdmission }) ||
        !exactLabKeys(pipeline.probe, ["matches", "meanHalfPoints", "mechanismSharesPlannerWithResponse", "independenceStrengthClaim"]) ||
        (pipeline.probe as Record<string, unknown>).matches !== 4 || (pipeline.probe as Record<string, unknown>).meanHalfPoints !== probePoints.reduce<number>((sum, points) => sum + points, 0) / 4 ||
        (pipeline.probe as Record<string, unknown>).mechanismSharesPlannerWithResponse !== true || (pipeline.probe as Record<string, unknown>).independenceStrengthClaim !== false) return fail("CLAIM")
  } else if (pipeline.status !== "partial_or_failed_baseline" || r.status !== "partial_or_failed_baseline") return fail("STATUS")
  if (complete && r.status !== "pending_independent_verification") return fail("STATUS")
  const stop = s.ledgerEvents.at(-1)
  if (stop?.kind !== "stop" || stop.reason !== (complete ? "complete" : "failure")) return fail("STOP_DISPOSITION")
  const report = { schemaVersion: continuation === "v2" ? "lean-baseline-continuation-retained-v2" as const : continuation === "v1" ? "lean-baseline-continuation-retained-v1" as const : "lean-current-baseline-retained-v1" as const, allocationRoot: a.root, evidenceRoot: s.evidence.root, pipelineRoot: pipeline.root as LabRoot, head: s.head, complete, charged: s.evidence.charged, currentCharged: newCharges, successful, cumulativeElapsedMs: s.time.elapsedMs, cumulativePhysicalBytes: s.evidence.physicalHighWaterBytes, scratchHighWaterBytes: s.evidence.scratchHighWaterBytes, measurement: pipeline.measurement, claim: "no_robust_pure_claimed" as const, holdoutOpened: false as const, formationMaterialized: false as const }
  return Object.freeze({ ...report, root: labRoot(report.schemaVersion, report) })
}

/** Future new allocation/result only. This does not read a v6/v7 ledger or
 * call an old retained verifier; predecessor cost is carried in allocation. */
const loadLeanCurrentBaselineRetainedSnapshot = (input: { requestPath?: string; storePath?: string; allocationPath?: string }, guard: () => void = () => {}): LeanBaselineRetainedSnapshot => {
  guard()
  const requestPath = input.requestPath ?? LEAN_BASELINE_REQUEST, storePath = input.storePath ?? LEAN_BASELINE_STORE
  const allocationPath = input.allocationPath ?? ".planning/artifacts/v1.38-lean-current-baseline-allocation-v1.json"
  const ledger: LeanExperimentLedger = openLeanLedger(storePath)
  if (ledger.allocation.schemaVersion !== "lean-current-baseline-allocation-v1") return fail("ALLOCATION")
  const requestBytes = readPrivate(requestPath, 262144, guard), request = parsePrivate(requestPath, 262144, guard) as Record<string, unknown>
  guard()
  if (resolve(requestPath) !== resolve(LEAN_BASELINE_REQUEST) || leanBaselineSourceManifest().root !== ledger.allocation.sourceRoot ||
      !same(request.candidateRoots, deriveLeanBaselineCandidateRoots(ledger.allocation.coldRoot)) ||
      !same(request.requestRoots, deriveLeanBaselineRequestRoots({ seed: ledger.allocation.seed, coldRoot: ledger.allocation.coldRoot, planRoot: ledger.allocation.planRoot, sourceRoot: ledger.allocation.sourceRoot })) ||
      typeof request.reviewPath !== "string") return fail("IMMUTABLE_REQUEST_SOURCE")
  authenticateLeanBaselineReview(request.reviewPath, ledger.allocation.reviewRoot, ledger.allocation.sourceRoot)
  const committedPlan = execFileSync("git", ["show", `HEAD:${planPath}`], { maxBuffer: 262144 })
  const currentPlan = readFileSync(resolve(planPath))
  if (leanBytesRoot(committedPlan) !== leanBytesRoot(currentPlan) || leanBytesRoot(currentPlan) !== ledger.allocation.planRoot) return fail("IMMUTABLE_PLAN")
  const reviewIdentity = relative(process.cwd(), resolve(request.reviewPath))
  if (reviewIdentity.startsWith("..") || reviewIdentity.startsWith("/")) return fail("IMMUTABLE_REVIEW")
  const committedReview = execFileSync("git", ["show", `HEAD:${reviewIdentity}`], { maxBuffer: 262144 })
  if (leanBytesRoot(committedReview) !== ledger.allocation.reviewRoot || leanBytesRoot(committedReview) !== leanBytesRoot(readFileSync(resolve(request.reviewPath)))) return fail("IMMUTABLE_REVIEW")
  const sourcePaths = leanBaselineSourceManifest().entries.map(entry => entry.path)
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", "--", ...sourcePaths], { maxBuffer: 2_097_152, stdio: "pipe" })
    execFileSync("git", ["diff", "--exit-code", "HEAD", "--", ...sourcePaths], { maxBuffer: 1024, stdio: "pipe" })
  } catch { return fail("UNCOMMITTED_SOURCE") }
  const entry = readLeanChildEntry(ledger), terminal = readLeanChildTerminal(ledger)
  guard()
  const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", maxBuffer: 128 }).trim()
  const committed = execFileSync("git", ["show", `${head}:${allocationPath}`], { maxBuffer: 262144 })
  if (leanBytesRoot(committed) !== leanBytesRoot(readPrivate(allocationPath, 262144, guard)) || leanBytesRoot(committed) !== leanBytesRoot(leanCanonicalBytes(ledger.allocation))) return fail("IMMUTABLE_ALLOCATION")
  const evidence = verifyLeanEvidence(ledger), state = readLeanLedger(ledger), time = readLeanTimeAccounting(ledger)
  guard()
  const result = parsePrivate(join(storePath, "result.json"), 2_097_152, guard) as Record<string, unknown>
  const charged = evidence.records.filter(record => record.chargeRoot !== null).length
  const pairs = Array.from({ length: charged }, (_, i) => parsePrivate(join(storePath, `pair-${i}.json`), 262144, guard) as LeanBaselinePairReceipt)
  const observations = Array.from({ length: charged }, (_, i) => parsePrivate(join(storePath, `observation-${i}.json`), 8_388_608, guard) as LeanBaselineObservationReceipt)
  const roles = (result.pipeline as { sources?: readonly { role: string }[] })?.sources?.map(source => source.role) ?? []
  if (roles.some(role => !sourceRoles.includes(role as typeof sourceRoles[number]))) return fail("SOURCE_ROLE")
  const sources = roles.map(role => { guard(); return readLeanBaselineSource(storePath, role) })
  const artifactNames = ["seal-metadata.json", "cold-corpus.json", "initial-proposals.json", "initial-selection.json", "initial-training.json", "response-training.json", "response-work.json", "initial-analysis.json", "current-analysis.json"]
  const names = new Set(readdirSync(resolve(storePath)))
  const allowed = new Set(["allocation.json", "entry.json", "child-terminal.json", "ledger.ndjson", "time.ndjson", "result.json", "cold-corpus.json", "initial-proposals.json", "initial-selection.json", ...artifactNames])
  for (let i = 0; i < charged; i++) { allowed.add(`pair-${i}.json`); allowed.add(`observation-${i}.json`) }
  for (const source of sources) allowed.add(`source-${source.role}.json`)
  for (const row of evidence.records) {
    if (row.terminal?.replay && row.chargeRoot) allowed.add(`${row.chargeRoot.slice(7)}.gz`)
  }
  for (const [ordinal, receipt] of observations.entries()) {
    const chargeRoot = evidence.records[ordinal]!.chargeRoot
    if (!chargeRoot) return fail("DIAGNOSTIC")
    const name = `diagnostic-${chargeRoot.slice(7)}.json`
    if (receipt.cell.diagnostic === null) { if (names.has(name)) return fail("DIAGNOSTIC") }
    else {
      if (!names.has(name) || !same(parsePrivate(join(storePath, name), 4096, guard), receipt.cell.diagnostic)) return fail("DIAGNOSTIC")
      allowed.add(name)
    }
  }
  for (const name of names) if (!allowed.has(name)) return fail("STORE_INVENTORY")
  const artifacts = Object.fromEntries(artifactNames.filter(name => names.has(name)).map(name => [name, parsePrivate(join(storePath, name), 2_097_152, guard)]))
  const currentSealPublicMetadata = inspectLeanSealMetadata(), retainedSeal = artifacts["seal-metadata.json"] as Record<string, unknown> | undefined
  if (!retainedSeal || !same(retainedSeal.protocol, currentSealPublicMetadata.protocol) || !same(retainedSeal.originalPublicReference, currentSealPublicMetadata.originalPublicReference)) return fail("SEAL_PUBLIC_METADATA")
  return { allocation: ledger.allocation, request, requestBytesRoot: leanBytesRoot(requestBytes), head, entry, terminal, evidence, ledgerEvents: state.events, time, result, pairs, observations, sources, artifacts }
}
/** Exactly one new-route retained invocation is expected. The interval is
 * charged even if verification fails; a later retry is not made here. */
export const verifyLeanCurrentBaselineRetained = (requestPath: string) => {
  const ledger = openLeanLedger(LEAN_BASELINE_STORE)
  if (ledger.allocation.schemaVersion !== "lean-current-baseline-allocation-v1") return fail("ALLOCATION")
  readLeanChildTerminal(ledger)
  beginLeanInterval(ledger, "baseline-retained-verifier")
  let readerScratchHighWaterBytes = 0
  const guard = () => {
    const scratch = Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024) + LEAN_EXTERNAL_SCRATCH_RESERVE
    readerScratchHighWaterBytes = Math.max(readerScratchHighWaterBytes, scratch)
    const physical = cumulativeLeanPhysicalBytes(ledger)
    if (scratch > LEAN_CAPS.scratchBytes || physical > LEAN_CAPS.retainedBytes || physical + scratch + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes || currentLeanElapsedMs(ledger) > LEAN_CAPS.elapsedMs) return fail("READER_RESOURCE")
  }
  let report: ReturnType<typeof auditLeanCurrentBaselineRetained>
  try {
    guard()
    const snapshot = loadLeanCurrentBaselineRetainedSnapshot({ requestPath }, guard)
    const time = readLeanTimeAccounting(ledger)
    report = auditLeanCurrentBaselineRetained({ ...snapshot, time: { ...time, elapsedMs: currentLeanElapsedMs(ledger) } }, guard)
    guard()
  }
  finally { closeLeanInterval(ledger, "baseline-retained-verifier") }
  const time = readLeanTimeAccounting(ledger), physical = cumulativeLeanPhysicalBytes(ledger)
  if (time.active || time.elapsedMs > LEAN_CAPS.elapsedMs || physical > LEAN_CAPS.retainedBytes || readerScratchHighWaterBytes > LEAN_CAPS.scratchBytes || physical + readerScratchHighWaterBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes) return fail("READER_RESOURCE")
  const { root: _root, ...audited } = report
  const body = { ...audited, cumulativeElapsedMs: time.elapsedMs, cumulativePhysicalBytes: Math.max(report.cumulativePhysicalBytes, physical), scratchHighWaterBytes: Math.max(report.scratchHighWaterBytes, readerScratchHighWaterBytes) }
  return Object.freeze({ ...body, root: labRoot("lean-current-baseline-retained-v1", body) })
}

/** Separate admission: no historical snapshot, alias, clock override or reader
 * report can become a continuation allocation. The common audit below rebuilds
 * every successful training, matrix, solver, pairing, probe and repeat result. */
export const auditLeanBaselineContinuationRetained = (s: LeanBaselineContinuationRetainedSnapshot, guard: () => void = () => {}) => {
  guard()
  const a = validateLeanBaselineContinuationAllocation(s.allocation), r = s.request, e = s.entry, t = s.terminal
  const interval = "continuation-retained-verifier", closed = s.time.closed.has(interval)
  if (!s.time.closed.has("continuation-run-admission") || !s.time.starts.has("continuation-run-admission") || Number(s.time.starts.get("continuation-run-admission")) < a.window.anchorMs || Number(s.time.closes.get("continuation-run-admission")) > e.wallStartMs) return fail("CONTINUATION_ADMISSION")
  if (!exactLabKeys(r, ["schemaVersion", "seed", "sourceHead", "sourceRoot", "planningRoot", "planRoot", "reviewRoot", "coldRoot", "candidateRoots", "requestRoots", "offlineOverheadMs", "sourceAuthor", "runOperator", "readerOperator"]) || r.schemaVersion !== "lean-baseline-continuation-request-v1" || r.seed !== a.seed || r.sourceHead !== a.sourceHead || r.sourceRoot !== a.sourceRoot || r.planningRoot !== a.planningRoot || r.planRoot !== a.planRoot || r.reviewRoot !== a.reviewRoot || r.coldRoot !== a.coldRoot || r.offlineOverheadMs !== a.offlineOverheadMs || !Array.isArray(r.candidateRoots) || !same([...r.candidateRoots].sort(), a.candidateRoots) || !same(r.requestRoots, a.requestRoots) || s.requestBytesRoot !== a.requestBytesRoot || leanBytesRoot(leanCanonicalBytes(r)) !== a.requestBytesRoot || [r.sourceAuthor, r.runOperator, r.readerOperator].some(v => typeof v !== "string" || !/^[A-Za-z0-9_.:@/-]{1,128}$/u.test(v)) || new Set([r.sourceAuthor, r.runOperator, r.readerOperator]).size !== 3) return fail("CONTINUATION_REQUEST")
  if (e.allocationRoot !== a.root || e.sourceRoot !== a.sourceRoot || e.requestBytesRoot !== a.requestBytesRoot || e.head !== s.head || !/^[a-f0-9]{40}$/u.test(s.head) || t.entryBytesRoot !== leanBytesRoot(leanCanonicalBytes(e)) || t.allocationRoot !== a.root || t.sourceRoot !== a.sourceRoot || t.head !== s.head || t.parentPid !== e.parentPid || t.childPid !== e.childPid || t.status !== "child_exited" || t.exitCode !== 0 || t.signal !== null || e.wallStartMs < a.window.anchorMs || t.wallObservedMs > a.window.deadlineMs || s.time.starts.size !== 3 || s.time.closed.size !== (closed ? 3 : 2) || s.time.active === closed || s.time.starts.get("pilot-entry") !== e.wallStartMs || s.time.closes.get("pilot-entry") !== e.wallStartMs + t.elapsedUpperBoundMs || Number(s.time.starts.get(interval)) < Number(s.time.closes.get("pilot-entry")) || !s.time.starts.has(interval) || Number(s.time.starts.get(interval)) > a.window.deadlineMs || closed && Number(s.time.closes.get(interval)) > a.window.deadlineMs || s.time.elapsedMs > a.caps.elapsedMs) return fail("CONTINUATION_ENTRY")
  const pipeline = s.result.pipeline as Record<string, unknown> | null
  const unused = s.evidence.records.flatMap((row, ordinal) => row.chargeRoot === null ? [ordinal] : [])
  const resources = s.result.resourceReceipts as readonly { ordinal: number; chargeRoot: LabRoot; before: LeanContinuationFrontier; after: LeanContinuationFrontier }[]
  if (!Array.isArray(resources) || resources.length !== s.evidence.charged - 43) return fail("CONTINUATION_RESOURCES")
  let priorResourceMs = e.wallStartMs
  for (const [ordinal, row] of resources.entries()) {
    guard()
    const before: LeanContinuationFrontier = row.before, after: LeanContinuationFrontier = row.after
    if (!exactLabKeys(row, ["ordinal", "chargeRoot", "before", "after"]) || row.ordinal !== ordinal || row.chargeRoot !== s.evidence.records[ordinal]?.chargeRoot || !exactLabKeys(row.before, ["nowMs", "monotonicElapsedMs", "remainingSlots", "charged", "retainedBytes", "scratchBytes", "parentRssBytes", "childRssBytes", "arrayBuffersBytes", "availableMemoryBytes", "freeBytes", "live"]) || !exactLabKeys(row.after, Object.keys(row.before)) || before.charged !== 43 + ordinal || after.charged !== 44 + ordinal || before.remainingSlots !== 36 - ordinal || after.remainingSlots !== 35 - ordinal || before.nowMs < priorResourceMs || after.nowMs < before.nowMs || after.nowMs > t.wallObservedMs) return fail("CONTINUATION_RESOURCES")
    assertLeanBaselineContinuationFrontier(a, before); assertLeanBaselineContinuationFrontier(a, after)
    priorResourceMs = after.nowMs
  }
  if (!pipeline || !same(s.result.unusedOrdinals, unused) || !same(pipeline.unusedOrdinals, unused) || !same(s.result.holdoutReservations, a.holdoutReservations) || !same(pipeline.holdoutReservations, a.holdoutReservations) || s.result.planningRoot !== a.planningRoot || s.result.sourceAuthor !== r.sourceAuthor || s.result.runOperator !== r.runOperator || s.result.failure !== null) return fail("CONTINUATION_DISPOSITION")
  if (s.artifacts["response-work.json"] !== undefined) {
    const corpus = s.artifacts["cold-corpus.json"] as ReturnType<typeof buildLeanColdCorpus>, proposals = s.artifacts["initial-proposals.json"] as ReturnType<typeof buildLeanInitialProposals>
    const receipts = s.artifacts["response-node-receipts.json"] as readonly LeanResponseNodeReceipt[]
    if (!Array.isArray(receipts) || !same(s.artifacts["work-accounting.json"], deriveLeanContinuationWorkAccounting(corpus, proposals, s.artifacts["response-work.json"] as LeanResponseWork, receipts))) return fail("CONTINUATION_WORK")
  }
  const report = auditBaselineContent(s, guard, "v1")
  const { root: _root, ...content } = report
  const body = { ...content, disposition: report.complete ? "passed" : "gaps_found", planningRoot: a.planningRoot, sourceHead: a.sourceHead, unusedOrdinals: unused, holdoutReservations: a.holdoutReservations, sourceAuthor: r.sourceAuthor, runOperator: r.runOperator, readerOperator: r.readerOperator, historicalMemoryPeaks: "unknown", resourceRoot: labRoot("lean-baseline-continuation-resources-v1", resources), work: s.artifacts["work-accounting.json"] ?? null }
  guard(); return Object.freeze({ ...body, root: labRoot("lean-baseline-continuation-retained-v1", body) })
}

export interface LeanBaselineContinuationRetainedSnapshotV2 extends Omit<LeanBaselineRetainedSnapshot, "allocation"> {
  readonly allocation: LeanBaselineContinuationAllocationV2
  readonly window: LeanBaselineContinuationAllocationV2["window"]
  readonly windowBytesRoot: LabRoot
  readonly sourceGateRoot: LabRoot
  readonly dataReviewRoot: LabRoot
  readonly manifestRoot: LabRoot
  readonly claim: Record<string, unknown>
  readonly carry: Record<string, unknown>
  readonly sourceHold: Record<string, unknown>
}

export const assertLeanBaselineContinuationV2ClosedCount = (cumulative: number, current: number, recordCount = 36) => {
  if (!natural(cumulative) || !natural(current) || !natural(recordCount) || current > 36 || recordCount !== 36 || cumulative !== 50 + current) return fail("V2_CHARGE_COUNT")
  return Object.freeze({ cumulative, current, unused: 36 - current, complete: current === 36 && cumulative === 86 })
}
const frontierReceiptKeysV2 = ["nowMs", "monotonicElapsedMs", "remainingSlots", "charged", "retainedBytes", "scratchBytes", "parentRssBytes", "childRssBytes", "arrayBuffersBytes", "availableMemoryBytes", "freeBytes", "live"] as const
export const assertLeanBaselineContinuationResourceReceiptShapeV2 = (frontier: LeanContinuationFrontier): void => {
  const keys = Object.keys(frontier), basic = [...frontierReceiptKeysV2], closure = [...basic, "remainingClosureMs", "remainingOfflineMs"]
  if ((!exactLabKeys(frontier, basic) && !exactLabKeys(frontier, closure)) || typeof frontier.live !== "boolean" || keys.some(key => key !== "live" && !natural((frontier as any)[key])) || (frontier.remainingSlots !== 0 && (frontier.remainingClosureMs !== undefined || frontier.remainingOfflineMs !== undefined))) return fail("V2_RESOURCE_SHAPE")
}

/** V2 routes may use either legacy v1 custody or the additive v2 envelope;
 * retain exact root/identity joins and never promote a failed envelope. */
export const assertLeanContinuationSupervisorCustodyV2 = (bytes: Uint8Array, actual: {
  allocationRoot: LabRoot; sourceRoot: LabRoot; requestBytesRoot: LabRoot; entryBytesRoot: LabRoot
  head: string; parentPid: number; childPid: number; exitCode: number | null
  signal: string | null; status: "child_exited" | "child_failed"
}) => {
  let reason: any
  try { reason = parentReaderContract.validateLeanSupervisorReasonBytes(bytes) }
  catch { reason = assertLeanSupervisorReasonCustodyV2(bytes, actual) }
  if (!exactLabKeys(actual, ["allocationRoot", "sourceRoot", "requestBytesRoot", "entryBytesRoot", "head", "parentPid", "childPid", "exitCode", "signal", "status"]) ||
      reason.allocationRoot !== actual.allocationRoot || reason.sourceRoot !== actual.sourceRoot || reason.requestBytesRoot !== actual.requestBytesRoot || reason.entryBytesRoot !== actual.entryBytesRoot || reason.head !== actual.head || reason.parentPid !== actual.parentPid || reason.childPid !== actual.childPid || reason.exitCode !== actual.exitCode || reason.signal !== actual.signal) return fail("SUPERVISOR_CUSTODY_V2")
  const clean = reason.exitCode === 0 && !reason.uncertain && reason.observations.failureReceipt === "absent" && reason.observations.finalIdentity === "matched"
  if (actual.status !== (clean ? "child_exited" : "child_failed")) return fail("SUPERVISOR_CUSTODY_V2")
  return reason
}

/** The V2 producer still emits the authentic legacy reason-v1 envelope.
 * Keep the additive v2 custody validator above for other callers, but this
 * reader must not silently accept an unproduced envelope variant. */
export const assertLeanContinuationSupervisorCustodyV1ForV2 = (bytes: Uint8Array, actual: Parameters<typeof assertLeanContinuationSupervisorCustodyV2>[1]) => {
  const reason = parentReaderContract.validateLeanSupervisorReasonBytes(bytes)
  if (!exactLabKeys(actual, ["allocationRoot", "sourceRoot", "requestBytesRoot", "entryBytesRoot", "head", "parentPid", "childPid", "exitCode", "signal", "status"]) ||
      reason.allocationRoot !== actual.allocationRoot || reason.sourceRoot !== actual.sourceRoot || reason.requestBytesRoot !== actual.requestBytesRoot || reason.entryBytesRoot !== actual.entryBytesRoot || reason.head !== actual.head || reason.parentPid !== actual.parentPid || reason.childPid !== actual.childPid || reason.exitCode !== actual.exitCode || reason.signal !== actual.signal) return fail("SUPERVISOR_CUSTODY_V2")
  const clean = reason.exitCode === 0 && !reason.uncertain && reason.observations.failureReceipt === "absent" && reason.observations.finalIdentity === "matched"
  if (actual.status !== (clean ? "child_exited" : "child_failed")) return fail("SUPERVISOR_CUSTODY_V2")
  return reason
}

/** Pure, closed-schema V2 audit. Fixture callers supply in-memory snapshots;
 * this function has no filesystem, process, grant-issuance or runtime effect. */
export const auditLeanBaselineContinuationRetainedV2 = (s: LeanBaselineContinuationRetainedSnapshotV2, guard: () => void = () => {}) => {
  guard()
  const a = validateLeanBaselineContinuationAllocationV2(s.allocation), w = a.window, r = s.request, e = s.entry, t = s.terminal
  const interval = "continuation-retained-verifier-v2"
  if (!same(s.window, w) || s.window.root !== w.root || s.windowBytesRoot !== a.windowBytesRoot || s.sourceGateRoot !== a.sourceGateRoot || s.dataReviewRoot !== a.dataReviewRoot || s.manifestRoot !== a.manifestRoot ||
      !exactLabKeys(r, ["schemaVersion", "seed", "sourceHead", "sourceRoot", "planningRoot", "planRoot", "reviewRoot", "coldRoot", "candidateRoots", "requestRoots", "offlineOverheadMs", "sourceAuthor", "runOperator", "readerOperator", "windowRoot", "windowBytesRoot", "sourceGateRoot", "dataReviewRoot", "manifestRoot"]) ||
      r.schemaVersion !== "lean-baseline-continuation-request-v2" || r.seed !== a.seed || r.sourceHead !== a.sourceHead || r.sourceRoot !== a.sourceRoot || r.planningRoot !== a.planningRoot || r.planRoot !== a.planRoot || r.reviewRoot !== a.reviewRoot || r.coldRoot !== a.coldRoot || r.offlineOverheadMs !== a.offlineOverheadMs ||
      !same([...r.candidateRoots as LabRoot[]].sort(), a.candidateRoots) || !same(r.requestRoots, a.requestRoots) || r.windowRoot !== w.root || r.windowBytesRoot !== a.windowBytesRoot || r.sourceGateRoot !== a.sourceGateRoot || r.dataReviewRoot !== a.dataReviewRoot || r.manifestRoot !== a.manifestRoot ||
      s.requestBytesRoot !== a.requestBytesRoot || leanBytesRoot(leanCanonicalBytes(r)) !== a.requestBytesRoot || ![r.sourceAuthor, r.runOperator, r.readerOperator].every(leanContinuationIdentityV2) || new Set([r.sourceAuthor, r.runOperator, r.readerOperator]).size !== 3) return fail("V2_REQUEST")
  const closed = s.time.closed.has(interval)
  if (e.allocationRoot !== a.root || e.sourceRoot !== a.sourceRoot || e.requestBytesRoot !== a.requestBytesRoot || e.head !== s.head || !/^[a-f0-9]{40}$/u.test(s.head) || t.entryBytesRoot !== leanBytesRoot(leanCanonicalBytes(e)) || t.allocationRoot !== a.root || t.sourceRoot !== a.sourceRoot || t.head !== s.head || t.parentPid !== e.parentPid || t.childPid !== e.childPid || t.status !== "child_exited" || t.exitCode !== 0 || t.signal !== null || e.wallStartMs < w.anchorMs || t.wallObservedMs > w.deadlineMs || s.time.starts.size !== 3 || s.time.closed.size !== (closed ? 3 : 2) || s.time.active === closed || s.time.starts.get("pilot-entry") !== e.wallStartMs || s.time.closes.get("pilot-entry") !== e.wallStartMs + t.elapsedUpperBoundMs || Number(s.time.starts.get(interval)) < Number(s.time.closes.get("pilot-entry")) || !s.time.starts.has(interval) || Number(s.time.starts.get(interval)) > w.deadlineMs || closed && Number(s.time.closes.get(interval)) > w.deadlineMs || s.time.elapsedMs > a.caps.elapsedMs) return fail("V2_ENTRY")
  const claim = s.claim, carry = s.carry, hold = s.sourceHold
  if (!exactLabKeys(claim, ["schemaVersion", "grantId", "routeNamespace", "windowRoot", "windowBytesRoot", "requestBytesRoot", "sourceHead", "sourceRoot", "sourceGateRoot", "dataReviewRoot", "planningRoot", "manifestRoot", "root"]) || claim.schemaVersion !== "lean-baseline-continuation-window-claim-v2" || claim.grantId !== w.grantId || claim.routeNamespace !== w.routeNamespace || claim.windowRoot !== w.root || claim.windowBytesRoot !== a.windowBytesRoot || claim.requestBytesRoot !== a.requestBytesRoot || claim.sourceHead !== a.sourceHead || claim.sourceRoot !== a.sourceRoot || claim.sourceGateRoot !== a.sourceGateRoot || claim.dataReviewRoot !== a.dataReviewRoot || claim.planningRoot !== a.planningRoot || claim.manifestRoot !== a.manifestRoot || claim.root !== labRoot(claim.schemaVersion, Object.fromEntries(Object.entries(claim).filter(([key]) => key !== "root")))) return fail("V2_CLAIM")
  if (!exactLabKeys(carry, ["carry", "custody", "inventory"]) || !same(carry.carry, a.predecessor) || !Array.isArray(carry.inventory) || carry.inventory.length > 4096 || labRoot("lean-baseline-continuation-inventory-v2", carry.inventory) !== a.predecessor.inventoryRoot || labRoot("lean-baseline-continuation-custody-v2", carry.custody) !== a.predecessor.custodyRoot || labRoot("lean-baseline-continuation-closed-capsule-v2", carry.custody) !== a.predecessor.closedCapsuleRoot) return fail("V2_CARRY")
  if (!exactLabKeys(hold, ["schemaVersion", "allocationRoot", "sourceHead", "manifestRoot", "claimRoot", "rows", "root"]) || hold.schemaVersion !== "lean-baseline-continuation-source-hold-v2" || hold.allocationRoot !== a.root || hold.sourceHead !== a.sourceHead || hold.manifestRoot !== a.manifestRoot || hold.claimRoot !== claim.root || !Array.isArray(hold.rows) || hold.rows.length > 1024 || hold.root !== labRoot(hold.schemaVersion, Object.fromEntries(Object.entries(hold).filter(([key]) => key !== "root")))) return fail("V2_SOURCE_HOLD")
  const unused = s.evidence.records.flatMap((row, ordinal) => row.chargeRoot === null ? [ordinal] : [])
  const resources = s.result.resourceReceipts as readonly { ordinal: number; chargeRoot: LabRoot; before: LeanContinuationFrontier; after: LeanContinuationFrontier }[]
  const newCharges = s.evidence.records.filter(row => row.chargeRoot !== null).length
  const count = assertLeanBaselineContinuationV2ClosedCount(s.evidence.charged, newCharges, s.evidence.records.length)
  if (!Array.isArray(resources) || resources.length !== newCharges || !same(s.result.unusedOrdinals, unused) || !same(s.result.pipeline && (s.result.pipeline as Record<string, unknown>).unusedOrdinals, unused) || !same(s.result.holdoutReservations, a.holdoutReservations) || !same((s.result.pipeline as Record<string, unknown>)?.holdoutReservations, a.holdoutReservations) || s.result.failure !== null || s.result.planningRoot !== a.planningRoot || s.result.sourceAuthor !== r.sourceAuthor || s.result.runOperator !== r.runOperator) return fail("V2_ACCOUNTING")
  let priorMs = e.wallStartMs
  for (const [ordinal, row] of resources.entries()) {
    guard()
    if (!exactLabKeys(row, ["ordinal", "chargeRoot", "before", "after"])) return fail("V2_RESOURCE_RECEIPT")
    const receipt = row as { ordinal: number; chargeRoot: LabRoot; before: LeanContinuationFrontier; after: LeanContinuationFrontier }
    assertLeanBaselineContinuationResourceReceiptShapeV2(receipt.before); assertLeanBaselineContinuationResourceReceiptShapeV2(receipt.after)
    if (receipt.ordinal !== ordinal || receipt.chargeRoot !== s.evidence.records[ordinal]?.chargeRoot || receipt.before.charged !== 50 + ordinal || receipt.after.charged !== 51 + ordinal || receipt.before.remainingSlots !== 36 - ordinal || receipt.after.remainingSlots !== 35 - ordinal || receipt.before.nowMs < priorMs || receipt.after.nowMs < receipt.before.nowMs || receipt.after.nowMs > t.wallObservedMs) return fail("V2_RESOURCE_RECEIPT")
    assertLeanBaselineContinuationFrontierV2(a, receipt.before); assertLeanBaselineContinuationFrontierV2(a, receipt.after); priorMs = receipt.after.nowMs
  }
  guard()
  if (s.artifacts["response-work.json"] !== undefined) {
    const corpus = s.artifacts["cold-corpus.json"] as ReturnType<typeof buildLeanColdCorpus>, proposals = s.artifacts["initial-proposals.json"] as ReturnType<typeof buildLeanInitialProposals>
    const receipts = s.artifacts["response-node-receipts.json"] as readonly LeanResponseNodeReceipt[]
    if (!Array.isArray(receipts) || !same(s.artifacts["work-accounting.json"], deriveLeanContinuationWorkAccounting(corpus, proposals, s.artifacts["response-work.json"] as LeanResponseWork, receipts))) return fail("V2_WORK")
  }
  const content = auditBaselineContent(s, guard, "v2")
  const body = { ...content, disposition: content.complete ? "passed" : "gaps_found", planningRoot: a.planningRoot, sourceHead: a.sourceHead, windowRoot: w.root, windowBytesRoot: a.windowBytesRoot, sourceGateRoot: a.sourceGateRoot, dataReviewRoot: a.dataReviewRoot, manifestRoot: a.manifestRoot, unusedOrdinals: unused, holdoutReservations: a.holdoutReservations, sourceAuthor: r.sourceAuthor, runOperator: r.runOperator, readerOperator: r.readerOperator, historicalMemoryPeaks: "unknown", resourceRoot: labRoot("lean-baseline-continuation-resources-v2", resources), carryRoot: a.predecessor.root, count, work: s.artifacts["work-accounting.json"] ?? null }
  guard()
  return Object.freeze({ ...body, root: labRoot("lean-baseline-continuation-retained-v2", body) })
}

/** Ordinary IPC-free one-use reader. Admission is charged before expensive
 * authentication; a failed attempt remains consumed and cannot be rerun. */
export const verifyLeanContinuationEvidence = (ledger: LeanExperimentLedger, guard: (additionalBytes?: number) => void, version: "v1" | "v2" = "v1") => verifyLeanEvidence(ledger, guard, version === "v1" ? "continuation-descriptor-v1" : "continuation-descriptor-v2")
export const verifyLeanBaselineContinuationRetained = (requestPath: string) => {
  if (requestPath !== CONTINUATION.request || process.send || process.connected) return fail("CONTINUATION_READER_SCOPE")
  assertLeanBaselineContinuationScope()
  const now = Date.now()
  if (now < LEAN_BASELINE_CONTINUATION_WINDOW.anchorMs || now >= LEAN_BASELINE_CONTINUATION_WINDOW.deadlineMs) return fail("CONTINUATION_WINDOW")
  const ledger = openLeanLedger(CONTINUATION.store), allocation = validateLeanBaselineContinuationAllocation(ledger.allocation)
  const before = readLeanTimeAccounting(ledger)
  if (before.active || before.starts.has("continuation-retained-verifier") || !before.closed.has("continuation-run-admission") || readdirSync(ledger.directory).includes("retained-check.json")) return fail("CONTINUATION_READER_USED")
  beginLeanInterval(ledger, "continuation-retained-verifier")
  let report: ReturnType<typeof auditLeanBaselineContinuationRetained> | undefined, failure: string | null = null
  let resourceGuard: (() => void) | undefined
  try {
    const entry = readLeanChildEntry(ledger), terminal = readLeanChildTerminal(ledger)
    for (const pid of [entry.parentPid, entry.childPid]) { try { process.kill(pid, 0) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ESRCH") continue; throw error }; return fail("CONTINUATION_PROCESS_LIVE") }
    const c = openLeanBaselineContinuationContext(requestPath, true), guard = (additionalBytes?: number) => c.guard(additionalBytes)
    resourceGuard = guard; guard()
    const read = (name: string, maximum = 8388608) => { guard(); const value = readLeanContinuationJson(join(ledger.directory, name), maximum, 0o600); guard(); return value }
    const evidence = verifyLeanContinuationEvidence(ledger, guard), state = readLeanLedger(ledger), result = read("result.json", 4194304)
    const charged = evidence.records.filter(row => row.chargeRoot !== null).length
    const pairs = Array.from({ length: charged }, (_, i) => read(`pair-${i}.json`, 16384) as unknown as LeanBaselinePairReceipt)
    const observations = Array.from({ length: charged }, (_, i) => read(`observation-${i}.json`) as unknown as LeanBaselineObservationReceipt)
    const roles = (result.pipeline as { sources?: readonly { role: string }[] } | null)?.sources?.map(row => row.role) ?? []
    if (roles.length > sourceRoles.length || roles.some(role => !sourceRoles.includes(role as typeof sourceRoles[number]))) return fail("SOURCE_ROLE")
    const sources = roles.map(role => { guard(); const source = readLeanBaselineSource(ledger.directory, role); const publication = read(`publication-${role}-continuation-v1.json`, 16384); const body = { schemaVersion: "lean-baseline-continuation-source-publication-v1", allocationRoot: allocation.root, sourceHead: allocation.sourceHead, head: c.fixedHead, implementationRoot: allocation.sourceRoot, coldRoot: allocation.coldRoot, role, snapshotRoot: source.root, sourceRoot: source.sourceRoot }; if (!same(publication, { ...body, root: labRoot(body.schemaVersion, body) })) return fail("CONTINUATION_PUBLICATION"); guard(); return source })
    const artifactNames = ["seal-metadata.json", "cold-corpus.json", "initial-proposals.json", "initial-selection.json", "initial-training.json", "response-training.json", "response-work.json", "response-node-receipts.json", "work-accounting.json", "initial-analysis.json", "current-analysis.json"]
    const names = readdirSync(ledger.directory), allowed = new Set(["allocation.json", "carry.json", "source-manifest.json", "entry.json", "child-terminal.json", "parent-supervisor-reasons.json", "ledger.ndjson", "time.ndjson", "result.json", ...artifactNames])
    for (let i = 0; i < charged; i++) { allowed.add(`pair-${i}.json`); allowed.add(`observation-${i}.json`) }
    for (const source of sources) { allowed.add(`source-${source.role}.json`); allowed.add(`publication-${source.role}-continuation-v1.json`) }
    for (const [ordinal, row] of evidence.records.entries()) {
      if (row.terminal?.replay && row.chargeRoot) allowed.add(`${row.chargeRoot.slice(7)}.gz`)
      if (row.chargeRoot && observations[ordinal]?.cell.diagnostic) { const name = `diagnostic-${row.chargeRoot.slice(7)}.json`; if (!same(read(name, 16384), observations[ordinal]!.cell.diagnostic)) return fail("DIAGNOSTIC"); allowed.add(name) }
    }
    if (names.some(name => !allowed.has(name))) return fail("STORE_INVENTORY")
    const reason = read("parent-supervisor-reasons.json", 4096)
    const { validateLeanSupervisorReasonBytes } = parentReaderContract
    validateLeanSupervisorReasonBytes(leanCanonicalBytes(reason))
    if (reason.allocationRoot !== allocation.root || reason.sourceRoot !== allocation.sourceRoot || reason.requestBytesRoot !== allocation.requestBytesRoot || reason.entryBytesRoot !== leanBytesRoot(leanCanonicalBytes(entry)) || reason.head !== c.fixedHead || reason.parentPid !== entry.parentPid || reason.childPid !== entry.childPid || reason.exitCode !== 0 || reason.signal !== null || reason.uncertain !== false) return fail("CONTINUATION_SUPERVISOR")
    const artifacts = Object.fromEntries(artifactNames.filter(name => names.includes(name)).map(name => [name, read(name)]))
    const seal = inspectLeanSealMetadata(), retainedSeal = artifacts["seal-metadata.json"] as Record<string, unknown> | undefined
    if (!retainedSeal || !same(retainedSeal.protocol, seal.protocol) || !same(retainedSeal.originalPublicReference, seal.originalPublicReference)) return fail("SEAL_PUBLIC_METADATA")
    const time = { ...readLeanTimeAccounting(ledger), elapsedMs: currentLeanElapsedMs(ledger) }
    report = auditLeanBaselineContinuationRetained({ allocation, request: { ...c.request }, requestBytesRoot: allocation.requestBytesRoot, head: c.fixedHead, entry, terminal, evidence, ledgerEvents: state.events, time, result, pairs, observations, sources, artifacts }, guard)
    guard()
  } catch (error) { failure = continuationReaderFailure(error) }
  finally {
    try { closeLeanInterval(ledger, "continuation-retained-verifier") }
    catch { return fail("CONTINUATION_TERMINAL_REFUSAL") }
  }
  return publishLeanContinuationRetainedCheck(ledger, report, failure, resourceGuard)
}

/** V2 is a separate, one-use ordinary reader. The V1 pathname/schema and
 * count-43 path above remain byte- and behavior-compatible. */
export type LeanContinuationReaderStageV2 = "INITIAL_WINDOW" | "CONTEXT_OPEN" | "IMPORT" | "REUSE_WINDOW_TERMINAL" | "ENTRY_PID_CONTEXT" | "READER_INTERVAL" | "CLAIM" | "EVIDENCE_RESULT" | "TERMINAL" | "PUBLICATION"
export const verifyLeanBaselineContinuationRetainedV2 = (requestPath: string, observeStage?: (stage: LeanContinuationReaderStageV2) => void) => {
  // A diagnostic observer cannot change admission, cleanup or acceptance.
  const stage = (value: LeanContinuationReaderStageV2) => { try { observeStage?.(value) } catch { /* Diagnostic only. */ } }
  stage("INITIAL_WINDOW")
  const initialPaths = leanBaselineContinuationPathsForRequestV2(requestPath)
  if (process.send || process.connected) return fail("V2_READER_SCOPE")
  // Authenticate true V2 scope, exact approved window/allocation binding and
  // live global/deadline reserve before any one-use journal mutation.
  const approvedWindow = parentReaderContract.readLeanBaselineContinuationWindowV2(requestPath), paths = leanBaselineContinuationPathsForWindowV2(approvedWindow)
  if (!same(initialPaths, paths)) return fail("V2_READER_WINDOW_BINDING")
  parentReaderContract.assertLeanBaselineContinuationScopeV2(false, approvedWindow)
  const admissionNow = Date.now()
  if (approvedWindow.status !== "approved" || admissionNow < approvedWindow.anchorMs || admissionNow >= approvedWindow.deadlineMs ||
      leanContinuationGlobalFloorV2(admissionNow) > approvedWindow.capMs) return fail("V2_READER_WINDOW")
  const v8 = (paths === LEAN_BASELINE_CONTINUATION_PATHS_V8 || (paths === LEAN_BASELINE_CONTINUATION_PATHS_V9 || (paths === LEAN_BASELINE_CONTINUATION_PATHS_V10 || (paths === LEAN_BASELINE_CONTINUATION_PATHS_V11 || (paths === LEAN_BASELINE_CONTINUATION_PATHS_V12 || paths === LEAN_BASELINE_CONTINUATION_PATHS_V13)))))
  if (paths === LEAN_BASELINE_CONTINUATION_PATHS_V11 || (paths === LEAN_BASELINE_CONTINUATION_PATHS_V12 || paths === LEAN_BASELINE_CONTINUATION_PATHS_V13)) {
    // Necessary metadata only: no content, custody or success is authenticated
    // here. The later guarded descriptor read/audit and closings remain required.
    // Older routes retain their original failure ordering.
    const resultPath = resolve(paths.store, "result.json"), stat = lstatSync(resultPath)
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.uid !== process.getuid?.() ||
        (stat.mode & 0o7777) !== 0o600 || !natural(stat.size) || stat.size > 4194304 || realpathSync(resultPath) !== resultPath) return fail("CONTINUATION_READER_FAILURE")
  }
  stage("CONTEXT_OPEN")
  const freshOpening = v8 ? openLeanBaselineContinuationContextV2(requestPath, true, () => stage("IMPORT")) : undefined
  stage("IMPORT")
  const { ledger, allocation, before } = freshOpening ? freshOpening.stage("import", () => { freshOpening.guard(); return { ledger: freshOpening.ledger, allocation: freshOpening.allocation, before: readLeanTimeAccounting(freshOpening.ledger) } }) : parentReaderContract.withLeanContinuationReaderMetadataV2(approvedWindow, () => { const ledger = openLeanLedger(paths.store); return { ledger, allocation: validateLeanBaselineContinuationAllocationV2(ledger.allocation), before: readLeanTimeAccounting(ledger) } })
  stage("REUSE_WINDOW_TERMINAL")
  if (!same(leanBaselineContinuationPathsForWindowV2(allocation.window), initialPaths) || !same(allocation.window, approvedWindow) || allocation.windowBytesRoot !== leanBytesRoot(leanCanonicalBytes(approvedWindow)) || allocation.window.root !== approvedWindow.root) return fail("V2_READER_WINDOW_BINDING")
  if (Date.now() >= approvedWindow.deadlineMs) return fail("V2_READER_WINDOW")
  if (before.active || before.starts.has("continuation-retained-verifier-v2") || !before.closed.has("continuation-run-admission") || readdirSync(ledger.directory).some(name => ["reader-claim.json", "retained-check.json"].includes(name))) return fail("V2_READER_USED")
  const pilotCloseMs = before.closes.get("pilot-entry"), remainingClosureMs = pilotCloseMs === undefined ? approvedWindow.closureMs : Math.max(0, approvedWindow.closureMs - Math.max(0, admissionNow - pilotCloseMs))
  if (!before.closed.has("pilot-entry") || pilotCloseMs === undefined || admissionNow + remainingClosureMs > approvedWindow.deadlineMs ||
      leanContinuationGlobalFloorV2(admissionNow) + remainingClosureMs > approvedWindow.capMs || currentLeanElapsedMs(ledger) + remainingClosureMs > allocation.caps.elapsedMs) return fail("V2_READER_WINDOW")
  readLeanChildTerminal(ledger)
  const v6 = (paths === LEAN_BASELINE_CONTINUATION_PATHS_V6 || paths === LEAN_BASELINE_CONTINUATION_PATHS_V7 || (paths === LEAN_BASELINE_CONTINUATION_PATHS_V8 || (paths === LEAN_BASELINE_CONTINUATION_PATHS_V9 || (paths === LEAN_BASELINE_CONTINUATION_PATHS_V10 || (paths === LEAN_BASELINE_CONTINUATION_PATHS_V11 || (paths === LEAN_BASELINE_CONTINUATION_PATHS_V12 || paths === LEAN_BASELINE_CONTINUATION_PATHS_V13))))))
  // A V6/V7 reader owns a new independently authenticated invocation. Never import
  // a parent's controller or mutate a one-use journal before this opening.
  const opening = freshOpening ?? (v6 ? openLeanBaselineContinuationContextV2(requestPath, true, () => stage("IMPORT")) : undefined)
  if (!v6) { stage("READER_INTERVAL"); beginLeanInterval(ledger, "continuation-retained-verifier-v2") }
  let report: ReturnType<typeof auditLeanBaselineContinuationRetainedV2> | undefined, failure: string | null = null
  let resourceGuard: ((additionalBytes?: number) => void) | undefined
  let publicationStage: (<T>(body: () => T) => T) | undefined, readerBegan = !v6
  try {
    stage("ENTRY_PID_CONTEXT")
    const entry = readLeanChildEntry(ledger), terminal = readLeanChildTerminal(ledger)
    for (const pid of [entry.parentPid, entry.childPid]) {
      try { process.kill(pid, 0) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ESRCH") continue; throw error }
      return fail("V2_PROCESS_LIVE")
    }
    const c = opening ?? openLeanBaselineContinuationContextV2(requestPath, true), guard = (additionalBytes?: number) => c.guard(additionalBytes ?? 0)
    if (!same(c.paths, paths) || !same(leanBaselineContinuationPathsForWindowV2(c.allocation.window), initialPaths) || !same(c.allocation.window, approvedWindow) || c.window.root !== approvedWindow.root || c.allocation.root !== allocation.root || c.ledger.directory !== ledger.directory) return fail("V2_READER_CONTEXT_BINDING")
    resourceGuard = guard
    if (v6) {
      publicationStage = body => c.stage("publication", body)
      if (v8) privatePublicationStagesV8.set(publicationStage, ledger)
      stage("READER_INTERVAL")
      c.stage("reader", () => { c.localReservation?.reserveWrite(16384, join(ledger.directory, "time.ndjson")); beginLeanInterval(ledger, "continuation-retained-verifier-v2"); readerBegan = true; c.localReservation?.completeWrite(join(ledger.directory, "time.ndjson")) })
    }
    const readAndAudit = () => {
    if (!v6) {
    stage("CLAIM")
    const claimBody = { schemaVersion: "lean-baseline-continuation-reader-claim-v2", allocationRoot: allocation.root, grantId: allocation.window.grantId, windowRoot: allocation.window.root, requestBytesRoot: allocation.requestBytesRoot, readerOperator: c.request.readerOperator, startedAtMs: Date.now() }
    const readerClaim = { ...claimBody, root: labRoot(claimBody.schemaVersion, claimBody) }
    c.guard(65536); writeLeanContinuationArtifact(ledger, "reader-claim.json", readerClaim, 65536); c.guard()
    }
    const read = (name: string, maximum = 4194304): Record<string, any> => { c.guard(); const value = readLeanContinuationJsonV2(join(ledger.directory, name), maximum, 0o600, c.guard); c.guard(); return value }
    stage("EVIDENCE_RESULT")
    const evidence = verifyLeanContinuationEvidence(ledger, guard, "v2"), state = readLeanLedger(ledger), result = read("result.json", 4194304)
    const charged = evidence.records.filter(row => row.chargeRoot !== null).length
    const pairs = Array.from({ length: charged }, (_, i) => read(`pair-${i}.json`, 16384) as unknown as LeanBaselinePairReceipt)
    const observations = Array.from({ length: charged }, (_, i) => read(`observation-${i}.json`) as unknown as LeanBaselineObservationReceipt)
    const roles = (result.pipeline as { sources?: readonly { role: string }[] } | null)?.sources?.map(row => row.role) ?? []
    if (roles.length > sourceRoles.length || roles.some(role => !sourceRoles.includes(role as typeof sourceRoles[number]))) return fail("V2_SOURCE_ROLE")
    const sources = roles.map(role => {
      c.guard()
      const source = validateLeanBaselineSource(read(`source-${role}.json`, 262144)), publication = read(`publication-${role}-continuation-v2.json`, 16384)
      const body = { schemaVersion: "lean-baseline-continuation-source-publication-v2", allocationRoot: allocation.root, sourceHead: allocation.sourceHead, head: c.fixedHead, implementationRoot: allocation.sourceRoot, coldRoot: allocation.coldRoot, role, snapshotRoot: source.root, sourceRoot: source.sourceRoot, windowRoot: allocation.window.root, windowBytesRoot: allocation.windowBytesRoot, requestBytesRoot: allocation.requestBytesRoot, dataReviewRoot: allocation.dataReviewRoot }
      if (!same(publication, { ...body, root: labRoot(body.schemaVersion, body) })) return fail("V2_PUBLICATION")
      c.guard(); return source
    })
    const artifactNames = ["seal-metadata.json", "cold-corpus.json", "initial-proposals.json", "initial-selection.json", "initial-training.json", "response-training.json", "response-work.json", "response-node-receipts.json", "work-accounting.json", "initial-analysis.json", "current-analysis.json"]
    const names = readdirSync(ledger.directory), allowed = new Set(["allocation.json", "ledger.ndjson", "time.ndjson", "carry.json", "source-manifest.json", "source-hold.json", "run-claim.json", "reader-claim.json", "entry.json", "child-terminal.json", "parent-supervisor-reasons.json", "result.json", ...artifactNames])
    for (let i = 0; i < charged; i++) { allowed.add(`pair-${i}.json`); allowed.add(`observation-${i}.json`) }
    for (const source of sources) { allowed.add(`source-${source.role}.json`); allowed.add(`publication-${source.role}-continuation-v2.json`) }
    for (const [ordinal, row] of evidence.records.entries()) {
      if (row.terminal?.replay && row.chargeRoot) allowed.add(`${row.chargeRoot.slice(7)}.gz`)
      if (row.chargeRoot && observations[ordinal]?.cell.diagnostic) { const name = `diagnostic-${row.chargeRoot.slice(7)}.json`; if (!same(read(name, 16384), observations[ordinal]!.cell.diagnostic)) return fail("V2_DIAGNOSTIC"); allowed.add(name) }
    }
    if (names.length > allowed.size || names.some(name => !allowed.has(name))) return fail("V2_STORE_INVENTORY")
    const reason = read("parent-supervisor-reasons.json", 4096)
    const actual = { allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot: allocation.requestBytesRoot, entryBytesRoot: leanBytesRoot(leanCanonicalBytes(entry)), head: c.fixedHead, parentPid: entry.parentPid, childPid: entry.childPid, exitCode: terminal.exitCode, signal: terminal.signal, status: terminal.status }
    assertLeanContinuationSupervisorCustodyV1ForV2(leanCanonicalBytes(reason), actual)
    const artifacts = Object.fromEntries(artifactNames.filter(name => names.includes(name)).map(name => [name, read(name)]))
    const carry = read("carry.json", 4194304), sourceHold = read("source-hold.json", 4194304)
    const storedManifest = read("source-manifest.json", 4194304)
    if (!same(storedManifest, c.manifest)) return fail("V2_MANIFEST")
    const time = { ...readLeanTimeAccounting(ledger), elapsedMs: currentLeanElapsedMs(ledger) }
    report = auditLeanBaselineContinuationRetainedV2({ allocation, window: c.window, windowBytesRoot: c.manifest.windowBytesRoot, sourceGateRoot: c.manifest.sourceGateRoot, dataReviewRoot: c.manifest.dataReviewRoot, manifestRoot: c.manifest.manifestRoot, claim: c.claim, carry, sourceHold, request: { ...c.request }, requestBytesRoot: c.requestBytesRoot, head: c.fixedHead, entry, terminal, evidence, ledgerEvents: state.events, time, result, pairs, observations, sources, artifacts }, guard)
    guard()
    }
    // Claim publication has its own barrier; the evidence/audit body must not
    // recursively start a full barrier through an active read callback.
    if (v6) { stage("CLAIM"); c.stage("claim", () => { c.localReservation?.reserveWrite(3 * 65536, join(ledger.directory, "reader-claim.json")); c.guard(65536); const body = { schemaVersion: "lean-baseline-continuation-reader-claim-v2", allocationRoot: allocation.root, grantId: allocation.window.grantId, windowRoot: allocation.window.root, requestBytesRoot: allocation.requestBytesRoot, readerOperator: c.request.readerOperator, startedAtMs: Date.now() }; writeLeanContinuationArtifact(ledger, "reader-claim.json", { ...body, root: labRoot(body.schemaVersion, body) }, 65536); c.localReservation?.completeWrite(join(ledger.directory, "reader-claim.json")); c.guard() }); c.stage("reader", readAndAudit) }
    else readAndAudit()
  } catch (error) { opening?.invalidate(); failure = v6 ? "CONTINUATION_READER_FAILURE" : continuationReaderFailure(error) }
  finally { stage("TERMINAL"); try { if (readerBegan) {
    if (v8 && !failure) opening!.stage("terminal", () => { opening!.localReservation?.reserveWrite(16384, join(ledger.directory, "time.ndjson")); closeLeanInterval(ledger, "continuation-retained-verifier-v2"); opening!.localReservation?.completeWrite(join(ledger.directory, "time.ndjson")) })
    else { if (v8) continuationReaderFailurePublicationGuardV6(ledger, 16384); closeLeanInterval(ledger, "continuation-retained-verifier-v2"); if (v8) continuationReaderFailurePublicationGuardV6(ledger, 0) }
  } } catch { opening?.invalidate(); return fail("V2_TERMINAL_REFUSAL") } }
  if (v6 && !v8 && !failure) { try { opening!.stage("terminal", () => opening!.guard()) } catch { opening!.invalidate(); failure = "CONTINUATION_READER_FAILURE" } }
  stage("PUBLICATION")
  if (v8 && !failure) opening!.localReservation?.reserveWrite(16 * 1024 * 1024, join(ledger.directory, "retained-check.json"))
  const publish = v8 && !failure ? ((l, name, value, maximum) => { const result = writeLeanContinuationArtifact(l, name, value, maximum); opening!.localReservation?.completeWrite(join(ledger.directory, name)); return result }) as typeof writeLeanContinuationArtifact : writeLeanContinuationArtifact
  return publishLeanContinuationRetainedCheckV2(ledger, report, failure, resourceGuard, publish, publicationStage, v6 ? bytes => continuationReaderFailurePublicationGuardV6(ledger, bytes ?? 0) : undefined)
}

const continuationReaderFailure = (error: unknown): string => error instanceof Error && /^LEAN_[A-Z0-9_]{1,160}$/u.test(error.message) ? error.message : "CONTINUATION_READER_FAILURE"
/** Publication has its own capacity check: a broken source hold can only
 * produce failure evidence, never bypass RAM, disk, scratch or time limits. */
const continuationReaderPublicationGuard = (ledger: LeanExperimentLedger): number => {
  const allocation = validateLeanBaselineContinuationAllocation(ledger.allocation)
  const capacity = (growth: number): number => {
    const usage = process.memoryUsage(), disk = statfsSync(ledger.directory, { bigint: true }), nowMs = Date.now(), publicationBytes = 16777216
    const physicalBytes = cumulativeLeanPhysicalBytes(ledger) + growth
    assertLeanBaselineContinuationFrontier(allocation, { nowMs, monotonicElapsedMs: Math.max(0, currentLeanElapsedMs(ledger) - allocation.window.carryMs), remainingSlots: 0, remainingClosureMs: 0, remainingOfflineMs: 0, charged: readLeanLedger(ledger).charged, retainedBytes: physicalBytes + publicationBytes, scratchBytes: measureLeanPhysicalBytes(CONTINUATION.temp) + publicationBytes, parentRssBytes: Math.max(usage.rss, process.resourceUsage().maxRSS * 1024), childRssBytes: 0, arrayBuffersBytes: usage.arrayBuffers + publicationBytes, availableMemoryBytes: observeLeagueAvailableMemoryBytes(), freeBytes: Number(disk.bavail * disk.bsize), live: true })
    return physicalBytes
  }
  capacity(0)
  const carry = readLeanContinuationJson(join(ledger.directory, "carry.json"), 4194304, 0o600)
  const rows = carry.inventory as import("./v1-38-lean-baseline-continuation.js").LeanContinuationInventoryRow[]
  if (!Array.isArray(rows) || rows.length > 4096 || labRoot("lean-baseline-continuation-inventory-v1", rows) !== allocation.predecessor.inventoryRoot) return fail("CONTINUATION_CARRY")
  // Keep every old debit even if a file shrinks; add growth once. Content drift
  // is already a failure, but its newly consumed blocks still cost capacity.
  let growth = 0
  for (const row of rows) {
    const stat = lstatSync(resolve(row.path))
    if (stat.isSymbolicLink() || stat.uid !== process.getuid?.() || realpathSync(resolve(row.path)) !== resolve(row.path) || stat.isFile() && stat.nlink !== 1 || !stat.isFile() && !stat.isDirectory()) return fail("CONTINUATION_PUBLICATION_FILE")
    // A changed directory could hide newly added, unmeasured children. Refuse
    // finitely instead of scanning history or treating capacity as known.
    if (stat.isDirectory() && (stat.ino !== row.ino || stat.dev !== row.dev || stat.size !== row.bytes || stat.mtimeMs !== row.mtimeMs || stat.ctimeMs !== row.ctimeMs)) return fail("CONTINUATION_PUBLICATION_INVENTORY")
    growth += Math.max(0, stat.blocks * 512 - row.allocatedBytes)
  }
  return capacity(growth)
}

/** Only the ordinary reader calls this after its one-use admission is closed.
 * Injected guards/publisher are inert fixture seams, not CLI authority. */
export const publishLeanContinuationRetainedCheck = (ledger: LeanExperimentLedger, report: ReturnType<typeof auditLeanBaselineContinuationRetained> | undefined, failure: string | null, sourceGuard: (() => void) | undefined, publicationGuard: (ledger: LeanExperimentLedger) => number | void = continuationReaderPublicationGuard, publish: typeof writeLeanContinuationArtifact = writeLeanContinuationArtifact) => {
  let sourceHoldFailure: string | null = null
  try { sourceGuard?.() } catch (error) { sourceHoldFailure = continuationReaderFailure(error); failure ??= sourceHoldFailure }
  try {
    const observedPhysicalBytes = publicationGuard(ledger)
    const allocation = validateLeanBaselineContinuationAllocation(ledger.allocation)
    const time = readLeanTimeAccounting(ledger)
    if (time.active || !time.starts.has("continuation-retained-verifier") || !time.closed.has("continuation-retained-verifier")) return fail("CONTINUATION_READER_ADMISSION")
    const elapsedMs = currentLeanElapsedMs(ledger), physicalBytes = Math.max(cumulativeLeanPhysicalBytes(ledger), observedPhysicalBytes ?? 0)
    if (elapsedMs > allocation.caps.elapsedMs || Date.now() >= allocation.window.deadlineMs) return fail("CONTINUATION_READER_WINDOW")
    const state = readLeanLedger(ledger)
    const body = { schemaVersion: "lean-baseline-continuation-retained-check-v1", allocationRoot: allocation.root, disposition: failure || !report?.complete ? "gaps_found" : "passed", failure, sourceHoldFailure, report: failure ? null : report ?? null, charged: state.charged, currentCharged: state.charges.size, unusedOrdinals: allocation.slots.filter(slot => !state.charges.has(slot.root)).map(slot => slot.ordinal), elapsedMs, physicalBytes, readerPeakRssBytes: Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024), historicalPeakRssBytes: "unknown", holdoutOpened: false, formationMaterialized: false }
    const check = { ...body, root: labRoot(body.schemaVersion, body) }
    publish(ledger, "retained-check.json", check, 4194304)
    publicationGuard(ledger)
    if (!failure) sourceGuard?.()
    return check
  } catch { return fail("CONTINUATION_TERMINAL_REFUSAL") }
}

/** V2 retained check has its own discriminator and full human-window joins;
 * fixture callbacks are test-only seams and never supply a grant or clock. */
/** Failed source authority is never revived to publish failure evidence. This
 * independent resource-only guard keeps every old debit and refuses unknown
 * directory growth rather than opening or enumerating historical contents. */
const continuationReaderFailurePublicationGuardV6 = (ledger: LeanExperimentLedger, additional: number): void => {
  const allocation = readLeanAdmittedContinuationAllocationV2(ledger), paths = leanBaselineContinuationPathsForWindowV2(allocation.window)
  if ((paths !== LEAN_BASELINE_CONTINUATION_PATHS_V6 && paths !== LEAN_BASELINE_CONTINUATION_PATHS_V7 && (paths !== LEAN_BASELINE_CONTINUATION_PATHS_V8 && (paths !== LEAN_BASELINE_CONTINUATION_PATHS_V9 && (paths !== LEAN_BASELINE_CONTINUATION_PATHS_V10 && (paths !== LEAN_BASELINE_CONTINUATION_PATHS_V11 && (paths !== LEAN_BASELINE_CONTINUATION_PATHS_V12 && paths !== LEAN_BASELINE_CONTINUATION_PATHS_V13)))))) || !Number.isSafeInteger(additional) || additional < 0) return fail("V6_FAILURE_RESOURCE_SCOPE")
  let growth = 0
  const capacity = (reserved = 0) => {
    const usage = process.memoryUsage(), disk = statfsSync(ledger.directory, { bigint: true }), free = disk.bavail * disk.bsize, reserve = additional + reserved + 16777216
    if (free > BigInt(Number.MAX_SAFE_INTEGER)) return fail("V6_FAILURE_RESOURCE_SCOPE")
    assertLeanBaselineContinuationFrontierV2(allocation, { nowMs: Date.now(), monotonicElapsedMs: 0, remainingSlots: 0, remainingClosureMs: 0, remainingOfflineMs: 0, charged: readLeanLedger(ledger).charged, retainedBytes: cumulativeLeanPhysicalBytes(ledger) + growth + reserve, scratchBytes: measureLeanPhysicalBytes(paths.temp) + reserve, parentRssBytes: Math.max(usage.rss, process.resourceUsage().maxRSS * 1024), childRssBytes: 0, arrayBuffersBytes: usage.arrayBuffers + reserve, availableMemoryBytes: observeLeagueAvailableMemoryBytes(), freeBytes: Number(free), live: true }, ledger)
  }
  capacity()
  const carry = readLeanContinuationJsonV2(join(ledger.directory, "carry.json"), 4194304, 0o600, reserved => capacity(reserved ?? 0)), rows = carry.inventory as import("./v1-38-lean-baseline-continuation.js").LeanContinuationInventoryRowV2[]
  if (!Array.isArray(rows) || rows.length > 4096 || labRoot("lean-baseline-continuation-inventory-v2", rows) !== allocation.predecessor.inventoryRoot) return fail("V6_FAILURE_RESOURCE_SCOPE")
  for (const row of rows) {
    const path = resolve(row.path), stat = lstatSync(path)
    if (stat.isSymbolicLink() || stat.uid !== process.getuid?.() || realpathSync(path) !== path || stat.isFile() && stat.nlink !== 1 || !stat.isFile() && !stat.isDirectory() || stat.isDirectory() && (stat.dev !== row.dev || stat.ino !== row.ino || stat.size !== row.bytes || stat.mtimeMs !== row.mtimeMs || stat.ctimeMs !== row.ctimeMs)) return fail("V6_FAILURE_RESOURCE_SCOPE")
    growth += Math.max(0, stat.blocks * 512 - row.allocatedBytes)
  }
  capacity()
}
const acceptedPrivateChecksV6 = new WeakSet<object>()
// Only the independent ordinary reader registers this one-use callback after
// its strict fresh opening/context joins. No exported or serialized mint.
const privatePublicationStagesV8 = new WeakMap<object, LeanExperimentLedger>()
/** In-process private handoff only: never accept persisted/serialized fields as
 * closing evidence. Not public/counting authority or a portable receipt. */
export const isLeanContinuationAcceptedPrivateCheckV6 = (value: unknown): boolean => value !== null && typeof value === "object" && acceptedPrivateChecksV6.has(value)
export const publishLeanContinuationRetainedCheckV2 = (
  ledger: LeanExperimentLedger,
  report: ReturnType<typeof auditLeanBaselineContinuationRetainedV2> | undefined,
  failure: string | null,
  sourceGuard: ((additionalBytes?: number) => void) | undefined,
  publish: typeof writeLeanContinuationArtifact = writeLeanContinuationArtifact,
  publicationStage?: <T>(body: () => T) => T,
  failureGuard?: (additionalBytes?: number) => void,
) => {
  const v6 = ledger.allocation.schemaVersion === "lean-baseline-continuation-allocation-v2" && (ledger.allocation.window.routeNamespace === "20261014-v6" || ledger.allocation.window.routeNamespace === "20261014-v7" || (ledger.allocation.window.routeNamespace === "20261015-v8" || (ledger.allocation.window.routeNamespace === "20261017-v9" || (ledger.allocation.window.routeNamespace === "20261017-v10" || ledger.allocation.window.routeNamespace === "20261017-v11" || (ledger.allocation.window.routeNamespace === "20261017-v12" || ledger.allocation.window.routeNamespace === "20261017-v13")))))
  const failedV8 = ledger.allocation.schemaVersion === "lean-baseline-continuation-allocation-v2" && (ledger.allocation.window.routeNamespace === "20261015-v8" || (ledger.allocation.window.routeNamespace === "20261017-v9" || (ledger.allocation.window.routeNamespace === "20261017-v10" || ledger.allocation.window.routeNamespace === "20261017-v11" || (ledger.allocation.window.routeNamespace === "20261017-v12" || ledger.allocation.window.routeNamespace === "20261017-v13")))) && failure !== null
  const boundaryV8 = ledger.allocation.schemaVersion === "lean-baseline-continuation-allocation-v2" && (ledger.allocation.window.routeNamespace === "20261015-v8" || (ledger.allocation.window.routeNamespace === "20261017-v9" || (ledger.allocation.window.routeNamespace === "20261017-v10" || ledger.allocation.window.routeNamespace === "20261017-v11" || (ledger.allocation.window.routeNamespace === "20261017-v12" || ledger.allocation.window.routeNamespace === "20261017-v13"))))
  let sourceHoldFailure: string | null = null
  if (failedV8) sourceHoldFailure = "CONTINUATION_READER_FAILURE"
  else try { sourceGuard?.() } catch (error) { sourceHoldFailure = v6 ? "CONTINUATION_READER_FAILURE" : continuationReaderFailure(error); failure ??= sourceHoldFailure }
  try {
    if (v6 && !failure && !publicationStage) return fail("V2_PUBLICATION_GUARD")
    if (boundaryV8 && !failure) {
      if (!publicationStage || privatePublicationStagesV8.get(publicationStage) !== ledger) return fail("V2_PUBLICATION_GUARD")
      privatePublicationStagesV8.delete(publicationStage)
    }
    const guard = v6 && failure ? failureGuard : sourceGuard
    if (!guard) return fail("V2_PUBLICATION_GUARD")
    let privateCheck: object | undefined
    const publishCheck = () => {
    // Reserve for bounded body + canonical serialization/rooting + publish
    // buffering before constructing the report body (V1 keeps its old cap).
    guard(16 * 1024 * 1024)
    const allocation = validateLeanBaselineContinuationAllocationV2(ledger.allocation), time = readLeanTimeAccounting(ledger)
    if (time.active || !time.starts.has("continuation-retained-verifier-v2") || !time.closed.has("continuation-retained-verifier-v2") || Date.now() >= allocation.window.deadlineMs) return fail("V2_READER_ADMISSION")
    const state = readLeanLedger(ledger), elapsedMs = currentLeanElapsedMs(ledger), physicalBytes = cumulativeLeanPhysicalBytes(ledger)
    if (elapsedMs > allocation.caps.elapsedMs) return fail("V2_READER_WINDOW")
    const body = {
      schemaVersion: "lean-baseline-continuation-retained-check-v2", allocationRoot: allocation.root,
      grantId: allocation.window.grantId, windowRoot: allocation.window.root, windowBytesRoot: allocation.windowBytesRoot,
      sourceGateRoot: allocation.sourceGateRoot, dataReviewRoot: allocation.dataReviewRoot, planningRoot: allocation.planningRoot,
      manifestRoot: allocation.manifestRoot, disposition: failure || !report?.complete ? "gaps_found" : "passed",
      failure, sourceHoldFailure, report: failure ? null : report ?? null, charged: state.charged,
      currentCharged: state.charges.size, unusedOrdinals: allocation.slots.filter(slot => !state.charges.has(slot.root)).map(slot => slot.ordinal),
      elapsedMs, physicalBytes, readerPeakRssBytes: Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024),
      historicalPeakRssBytes: "unknown", holdoutOpened: false, formationMaterialized: false,
      ...(v6 ? { issued: false as const } : {}),
    }
    const durableBody = v6 && !failure ? { ...body, disposition: "pending_closing", verificationStatus: "pending_closing", failure: "PUBLICATION_PENDING_CLOSING", report: null } : body
    const check = { ...durableBody, root: labRoot(body.schemaVersion, durableBody) }
    if (v6 && !failure) {
      const acceptedBody = { ...body, verificationStatus: "closed_private_return" }, accepted = { ...acceptedBody, root: labRoot(body.schemaVersion, acceptedBody) }, bytes = leanCanonicalBytes(accepted)
      if (bytes.length > 4194304) return fail("V2_PUBLICATION_GUARD")
      // Capture/freeze our own plain snapshot, never caller-owned report data.
      privateCheck = freezeLabValue(JSON.parse(Buffer.from(bytes).toString("utf8"))) as typeof accepted
    }
    guard(4 * 1024 * 1024); publish(ledger, "retained-check.json", check, 4194304); guard()
    if (!failure) guard()
    return check
    }
    if (!v6 || failure) return publishCheck()
    publicationStage!(publishCheck) // BOTH full passes must accept before return.
    if (!privateCheck) return fail("V2_PUBLICATION_GUARD")
    if ((privateCheck as { disposition: string }).disposition === "passed") acceptedPrivateChecksV6.add(privateCheck)
    return privateCheck as ReturnType<typeof publishCheck> & { verificationStatus: "closed_private_return" }
  } catch { return fail("V2_TERMINAL_REFUSAL") }
}
