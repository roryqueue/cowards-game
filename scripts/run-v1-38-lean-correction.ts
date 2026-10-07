import { admitLeanRetryTimeboxExtension, LEAN_RETRY_V8_TIMEBOX_EXTENSION, isLeanBookkeepingContinuationV8, leanRetryClosedPrefixFloorV8, leanRetryRootElapsedFloorV8, type LeanRetryTimeboxExtension, isLeanRetryMode, leanRetryOrdinal, leanRetrySetupPath, LEAN_RETRY_V8_APPROVAL_ROOT, LEAN_RETRY_V8_PLAN_ROOT, LEAN_RETRY_V8_POLICY, LEAN_RETRY_V8_CARRY, type LeanRetryMode, type LeanRetryOrdinal } from "../packages/strategy-lab/src/league/lean-experiment.js"
/** Additive, fixed one-cell diagnostic / conditional 36-cell baseline.
 * Import is inert. Historical requests, stores and empirical readers are never used. */
import { constants, closeSync, existsSync, fstatSync, fsyncSync, lstatSync, openSync, readFileSync, realpathSync, readdirSync, statfsSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { dirname, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { exactLabKeys, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { leanCapsForAllocation, type AnyLeanAllocation, LEAN_REPLAY_V7_APPROVAL_ROOT, LEAN_REPLAY_V7_SUPPLEMENT_ROOT, LEAN_REPLAY_V7_SETUP_PATH, LEAN_REPLAY_V7_CARRY, LEAN_REPLAY_V7_POLICY, validateLeanReplayV7PredecessorCustody, LEAN_REPLAY_V6_APPROVAL_ROOT, LEAN_REPLAY_V6_SUPPLEMENT_ROOT, LEAN_REPLAY_V6_SETUP_PATH, LEAN_REPLAY_V6_CARRY, validateLeanReplayV6PredecessorCustody, LEAN_STARTUP_POLICY_V5, LEAN_STARTUP_APPROVAL_ROOT, LEAN_STARTUP_SUPPLEMENT_ROOT, LEAN_STARTUP_V5_SETUP_PATH, LEAN_CAPS, LEAN_CORRECTION_ROUTES, LEAN_SUPERVISOR_CORRECTION_ROUTES, leanCorrectionRoutePaths, leanSupervisorAllocationMode, leanSupervisorVersion, type LeanSupervisorMode, createLeanSupervisorCorrectionAllocation, LEAN_EXTERNAL_SCRATCH_RESERVE, LEAN_BASELINE_STORE, LEAN_BASELINE_WRITABLE_PATHS, createLeanCorrectionAllocation, createLeanLedger, openLeanLedger, readLeanLedger, readLeanTimeAccounting, readLeanChildEntry, readLeanChildTerminal, beginLeanInterval, closeLeanInterval, chargeLeanSlot, retainLeanMatch, checkpointLeanResources, stopLeanLedger, verifyLeanEvidence, currentLeanElapsedMs, cumulativeLeanPhysicalBytes, measureLeanPhysicalBytes, inspectLeanClosedV7Predecessor, leanBytesRoot, leanCanonicalBytes, writeLeanAll, assertLeanPublicationCapacity, type LeanCorrectionPredecessor, type LeanCorrectionAllocation, type LeanExperimentLedger } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { leanBaselineSourceManifest, deriveLeanBaselineRequestRoots, deriveLeanBaselineCandidateRoots, leanBaselinePair, runLeanBoundedParent, assertLeanBaselinePrefixCapacity, admitsLeanBaselineReviewAgents } from "./run-v1-38-lean-baseline.js"
import { createLeanParentObservationGuard, admitLeanChildRelease, assertLeanEntryBinding } from "./run-v1-38-lean-experiment.js"
import { observeLeagueAvailableMemoryBytes } from "./run-v1-38-serious-league.js"
import { authenticateLeanColdReuse, LEAN_COLD_REUSE_HISTORY, type LeanColdReuse } from "./lib/v1-38-lean-baseline-reuse.js"
import { executeLeanReusedCurrentPipeline } from "./lib/v1-38-lean-baseline-pipeline.js"
import { publishLeanBaselineSource, publishLeanReusedBaselineSource } from "./lib/v1-38-lean-baseline-source.js"
import { runLeanBaselineMatch } from "./lib/v1-38-lean-baseline-match.js"
import { validateLeanPrivateCorrectionOrigin, buildLeanStartupWorkerHarnessV5, buildLeanContainerBrokerSourceV5, buildLeanContainerBrokerSourceV6, buildLeanContainerBrokerSourceV7, type LeanPrivateCorrectionOrigin } from "./lib/v1-38-lean-container-match-session.js"
import { resolveLeanChildCliTerminal } from "./lib/v1-38-lean-child-cli-terminal.js"
import { captureLeanHostFailureV7, type LeanHostFailureBindingV7 } from "./lib/v1-38-lean-host-stage-v7.js"
let activeHostBindingV7: LeanHostFailureBindingV7 | undefined
import { authenticateLeanSupervisorDiagnosticCheck, authenticateLeanRetryClosureV8, authenticateLeanBookkeepingPredecessorV8 } from "./lib/v1-38-lean-correction-retained.js"

export { LEAN_CORRECTION_ROUTES, LEAN_SUPERVISOR_CORRECTION_ROUTES }
export const LEAN_SUPERVISOR_DECISION = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-CORRECTION-SUPERVISOR-DECISION-v1.md"
export const LEAN_SUPERVISOR_PLAN = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SUPERVISOR-PLAN-v1.md"
export const LEAN_SUPERVISOR_SETUP_WITNESS = ".strategy-lab/lean-correction-supervisor-setup-20261004-v2.json"
export const LEAN_SUPERVISOR_SETUP_CUSTODY = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SUPERVISOR-SOURCE-SETUP-CLOCK-v1.md"
export const LEAN_FRESH_SUPERVISOR_DECISION = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-FRESH-SUPERVISOR-APPROVAL-20261005.md"
export const LEAN_FRESH_SUPERVISOR_PLAN = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-FRESH-SUPERVISOR-RESEARCH-PLAN-v1.md"
export const LEAN_FRESH_SUPERVISOR_SETUP_WITNESS = ".strategy-lab/lean-correction-supervisor-setup-20261005-v3.json"
export const LEAN_FRESH_SUPERVISOR_SETUP_CUSTODY = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-FRESH-SUPERVISOR-SETUP-CLOCK-v1.md"
export const LEAN_REPAIRED_READER_DECISION = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-FRESH-READER-APPROVAL-20261005.md"
export const LEAN_REPAIRED_READER_PLAN = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-FRESH-READER-RESEARCH-PLAN-v1.md"
export const LEAN_REPAIRED_READER_SETUP_WITNESS = ".strategy-lab/lean-correction-supervisor-setup-20261005-v4.json"
export const LEAN_STARTUP_V5_DECISION = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-STARTUP-APPROVAL-20261005.md"
export const LEAN_STARTUP_V5_PLAN = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-STARTUP-PLAN-v1.md"
export const LEAN_REPLAY_V6_DECISION = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-REPLAY-REPAIR-APPROVAL-20261006.md"
export const LEAN_REPLAY_V6_PLAN = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-REPLAY-V6-PLAN-v1.md"
export const LEAN_REPLAY_V7_DECISION = ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-HOST-STAGE-APPROVAL-20261006.md"
export const LEAN_REPLAY_V7_PLAN = ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-HOST-STAGE-V7-PLAN-v1.md"
export const LEAN_RETRY_V8_DECISION = ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-POST-HANDSHAKE-APPROVAL-20261006.md"
export const LEAN_RETRY_V8_PLAN = ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-RETRY-ENVELOPE-PLAN-v1.md"
export const LEAN_RETRY_V8_TIMEBOX_DECISION = ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-TWENTY-HOUR-APPROVAL-20261006.md"
export const LEAN_RETRY_V8_TIMEBOX_PLAN = ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-TWENTY-HOUR-PLAN-v1.md"
export const LEAN_RETRY_V8_TIMEBOX_RESEARCH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-TWENTY-HOUR-RESEARCH-v1.md"
export const LEAN_RETRY_V8_BOOKKEEPING_DECISION = ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-BOOKKEEPING-CONTINUATION-APPROVAL-20261007.md"
export const LEAN_RETRY_V8_BOOKKEEPING_PLAN = ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-BOOKKEEPING-CONTINUATION-RESEARCH-PLAN-v1.md"
const leanRetryExtensionDocumentsV8 = (extension: LeanRetryTimeboxExtension, mode: LeanRetryMode) => {
  if (isLeanBookkeepingContinuationV8(extension)) {
    if (mode !== "v8-2") return fail("SUPERVISOR_REQUEST")
    return { decision: LEAN_RETRY_V8_BOOKKEEPING_DECISION, plan: LEAN_RETRY_V8_BOOKKEEPING_PLAN }
  }
  return { decision: LEAN_RETRY_V8_TIMEBOX_DECISION, plan: LEAN_RETRY_V8_TIMEBOX_PLAN }
}
const assertLeanRetryExtensionDocumentsV8 = (extension: LeanRetryTimeboxExtension, mode: LeanRetryMode) => {
  const documents = leanRetryExtensionDocumentsV8(extension, mode)
  if (leanBytesRoot(readFileSync(documents.decision)) !== extension.approvalRoot || leanBytesRoot(readFileSync(documents.plan)) !== extension.planRoot) return fail("SUPERVISOR_REQUEST")
}
export const LEAN_RETRY_V8_SOURCE_INVENTORY = Object.freeze([
  LEAN_RETRY_V8_DECISION, LEAN_RETRY_V8_PLAN,
  ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-RETRY-ENVELOPE-RESEARCH-v1.md",
  "scripts/run-v1-38-lean-retry-envelope-source-manifest.ts", "scripts/run-v1-38-lean-host-stage-v8.test.ts",
  "scripts/check-v1-38-factory-boundaries.test.ts",
  "scripts/lib/v1-38-lean-baseline-retained.ts", "scripts/lib/v1-38-lean-baseline-retained.test.ts",
  "scripts/lib/v1-38-lean-baseline-authority.test.ts", "scripts/lib/v1-38-lean-baseline-source.test.ts",
  "scripts/run-v1-38-lean-correction.test.ts", "scripts/run-v1-38-lean-correction-bytes.test.ts", "scripts/lib/v1-38-lean-correction-retained.test.ts",
  "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/run-v1-38-lean-baseline.test.ts",
] as const)
/** Exact union of checked source inventories plus approval, plan, policy, fixture. */
export const LEAN_HOST_STAGE_V7_SOURCE_INVENTORY = Object.freeze([
  LEAN_REPLAY_V7_DECISION, LEAN_REPLAY_V7_PLAN, LEAN_REPLAY_V7_POLICY.identity,
  "scripts/run-v1-38-lean-correction.ts", "scripts/run-v1-38-lean-correction.sh", "scripts/run-v1-38-lean-baseline.ts", "scripts/run-v1-38-lean-experiment.ts", "scripts/run-v1-38-lean-host-stage-v7.test.ts",
  "scripts/lib/v1-38-lean-host-stage-v7.ts", "scripts/lib/v1-38-lean-child-cli-terminal.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-container-match-session.ts", "scripts/lib/v1-38-factory-supervised-runtime.ts", "scripts/lib/v1-38-planner-supervised-runtime.ts", "scripts/lib/v1-38-lean-correction-retained.ts", "scripts/lib/v1-38-lean-experiment-authority.ts", "scripts/lib/v1-38-lean-baseline-source.ts", "scripts/lib/v1-38-lean-baseline-pipeline.ts", "scripts/lib/v1-38-lean-startup-supervisor.mjs", "packages/strategy-lab/src/league/lean-experiment.ts",
] as const)
const supervisorDocuments = (mode: LeanSupervisorMode) => isLeanRetryMode(mode) ? { decision: LEAN_RETRY_V8_DECISION, plan: LEAN_RETRY_V8_PLAN, setup: leanRetrySetupPath(mode), custody: LEAN_RETRY_V8_DECISION } : mode === "v7" ? { decision: LEAN_REPLAY_V7_DECISION, plan: LEAN_REPLAY_V7_PLAN, setup: LEAN_REPLAY_V7_SETUP_PATH, custody: LEAN_REPLAY_V7_DECISION } : mode === "v6" ? { decision: LEAN_REPLAY_V6_DECISION, plan: LEAN_REPLAY_V6_PLAN, setup: LEAN_REPLAY_V6_SETUP_PATH, custody: LEAN_REPLAY_V6_DECISION } : mode === "v5" ? { decision: LEAN_STARTUP_V5_DECISION, plan: LEAN_STARTUP_V5_PLAN, setup: LEAN_STARTUP_V5_SETUP_PATH, custody: LEAN_STARTUP_V5_DECISION } : mode === "v4" ? { decision: LEAN_REPAIRED_READER_DECISION, plan: LEAN_REPAIRED_READER_PLAN, setup: LEAN_REPAIRED_READER_SETUP_WITNESS, custody: LEAN_REPAIRED_READER_DECISION } : mode === "v3" ? { decision: LEAN_FRESH_SUPERVISOR_DECISION, plan: LEAN_FRESH_SUPERVISOR_PLAN, setup: LEAN_FRESH_SUPERVISOR_SETUP_WITNESS, custody: LEAN_FRESH_SUPERVISOR_SETUP_CUSTODY } : { decision: LEAN_SUPERVISOR_DECISION, plan: LEAN_SUPERVISOR_PLAN, setup: LEAN_SUPERVISOR_SETUP_WITNESS, custody: LEAN_SUPERVISOR_SETUP_CUSTODY }
export const admitsLeanSupervisorReviewAgents = (author: unknown, reviewer: unknown) => typeof author === "string" && typeof reviewer === "string" && /^\/root(?:\/[a-z0-9_]+)*$/u.test(author) && /^\/root(?:\/[a-z0-9_]+)*$/u.test(reviewer) && author !== reviewer
export type LeanCorrectionRoute = keyof typeof LEAN_CORRECTION_ROUTES
// Only errors created by these trusted static guards can cross the private
// v3 verifier diagnostic boundary. Message-shaped runtime errors are untrusted.
const trustedGuardCodes = new Set([
  ..."ACCEPTED_CHECK ADMISSION_CLOCK ADMISSION_CUSTODY ADMISSION_DIRECTORY ADMISSION_INTERRUPTED_NO_REFUND ADMISSION_TIME ADMISSION_UNCLOSED_ENTRY ALLOCATION ALLOCATION_REQUEST_CUSTODY ALLOCATION_VERSION ARGUMENTS ARTIFACT CANONICAL CAPACITY COORDINATOR_HEAP_BOUND DIAGNOSIS DIAGNOSTIC_CHECK DIAGNOSTIC_CUSTODY DIAGNOSTIC_UNCLOSED DIAGNOSTIC_UNKNOWN_OR_UNCLEAN FRESH_ADMISSION_CUSTODY FRESH_HISTORY HISTORY ORIGIN_LIMIT PAIR PARENT_LOST PREDECESSOR_DRIFT PREPARATION_CLOSURE PRIVATE_FILE REQUEST REQUEST_PATH REQUEST_ROOTS REUSE REVIEW REVIEW_SOURCE ROUTE_ALIAS SETUP_WITNESS SOURCE_HOLD SPENT_DESTINATION SUPERVISOR_ACCOUNTING_CLOCK SUPERVISOR_DECISION SUPERVISOR_HISTORY SUPERVISOR_REQUEST SURVIVOR SURVIVOR_CHANGED SURVIVOR_DUPLICATE SURVIVOR_LIMIT UNCOMMITTED_ALLOCATION WRITABLE_SCOPE".split(" ").map(code => `LEAN_CORRECTION_${code}`),
  ..."ACCEPTED_ALLOCATION ACCEPTED_CHARGE ACCEPTED_CHECK_CUSTODY ACCEPTED_FULL_AUDIT ACCEPTED_INVENTORY ACCEPTED_READER_CLOSURE ACCEPTED_REUSE ACCOUNTING ALLOCATION CLAIM CUSTODY DIAGNOSTIC DIAGNOSTIC_NOT_ACCEPTED EVIDENCE HOLD_OR_CAPACITY INCOMPLETE_SOLVER INITIAL_SCHEDULE INVENTORY JOURNAL METRIC OBSERVATION ORIGIN ORIGIN_EXECUTABLE ORIGIN_INVOCATION ORIGIN_ROOT ORIGIN_SOURCE PAIR PAIR_ROOT PAIR_SOURCE PIPELINE POINTS PRECHARGE PROBE_SCHEDULE RESPONSE_BRAIN_INPUT RESPONSE_COUNTER_SOURCE RESPONSE_NODES RESPONSE_NODE_INPUT_OUTPUT RESPONSE_NODE_RECEIPT RESPONSE_NODE_ROOT RESPONSE_NODE_TOTAL RESPONSE_SCHEDULE RESPONSE_SOURCE_TARGET RESPONSE_WORK RESULT RESULT_ROOT REUSE REUSED_PIPELINE SCHEDULE SCHEDULE_EVIDENCE SELECTION SNAPSHOT SOLVER SOURCE STATUS SUPERVISOR_REASON_CUSTODY SUPERVISOR_REQUEST TERMINAL_ONLY_REQUIRED TRAINING TRAINING_JOIN TRAINING_OUTCOME UNCLOSED WORK_VECTOR READER_GAP_CUSTODY".split(" ").map(code => `LEAN_CORRECTION_RETAINED_${code}`)
])
const trustedGuardErrors = new WeakMap<object, string>()
export const leanCorrectionTrustedGuardError = (code: string): TypeError => {
  const error = new TypeError(code)
  if (trustedGuardCodes.has(code)) trustedGuardErrors.set(error, code)
  return error
}
export const leanCorrectionCliFailure = (args: readonly string[], error: unknown): string => {
  const withheld = "LEAN_CORRECTION_FAILED_DETAILS_WITHHELD\n"
  const command = args[0], supervisor = command?.endsWith("-v7") ? "v7" : command?.endsWith("-v6") ? "v6" : command?.endsWith("-v5") ? "v5" : command?.endsWith("-v4") ? "v4" : "v3", route = command === `verify-supervisor-diagnostic-${supervisor}` ? "diagnostic" : command === `verify-supervisor-baseline-${supervisor}` ? "baseline" : null
  if (!route || args.length !== 3 || args[1] !== "--request" || args[2] !== leanCorrectionRoutePaths(route, supervisor).request || typeof error !== "object" || error === null) return withheld
  const code = trustedGuardErrors.get(error)
  if (!code || Object.getOwnPropertyDescriptor(error, "message")?.value !== code) return withheld
  return `${code}\n`
}
const fail = (code: string): never => { throw leanCorrectionTrustedGuardError(`LEAN_CORRECTION_${code}`) }
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
export const beginLeanCorrectionAdmission = (route: LeanCorrectionRoute, mode: "prepare" | "run", directory = resolve(LEAN_CORRECTION_ROUTES[route].temp), clock = processAdmissionClock(), supervisor: LeanSupervisorMode = false) => {
  const stat = lstatSync(directory)
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid?.() || (stat.mode & 0o777) !== 0o700 || realpathSync(directory) !== resolve(directory)) return fail("ADMISSION_DIRECTORY")
  if (isLeanRetryMode(supervisor) && resolve(directory) !== resolve(leanCorrectionRoutePaths(route, supervisor).temp)) return fail("ADMISSION_DIRECTORY")
  const body = { schemaVersion: supervisor ? `lean-correction-supervisor-admission-v${leanSupervisorVersion(supervisor)}` : "lean-correction-admission-v1", ...(isLeanRetryMode(supervisor) ? { attemptOrdinal: leanRetryOrdinal(supervisor) } : {}), route, mode, parentPid: process.pid, ...clock }
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
export const assertLeanCorrectionAdmissionTime = (priorMs: number, start: AdmissionClock, now = admissionClock(), allocation?: AnyLeanAllocation): number => {
  const caps = allocation === undefined ? LEAN_CAPS : leanCapsForAllocation(allocation)
  const extension = allocation && "timeboxExtension" in allocation ? allocation.timeboxExtension : undefined
  const elapsed = Math.max(priorMs + leanCorrectionAdmissionElapsed(start, now), extension ? leanRetryRootElapsedFloorV8(now.wallStartMs, extension) : 0)
  const reserve = LEAN_CAPS.matchMs + LEAN_CORRECTION_RESERVE.cleanupMs + LEAN_CORRECTION_RESERVE.terminalMs + LEAN_CORRECTION_RESERVE.checkMs + LEAN_CORRECTION_RESERVE.replayMs
  if (!Number.isSafeInteger(priorMs) || priorMs < 3319046 || !Number.isSafeInteger(elapsed) || elapsed + reserve >= caps.elapsedMs) return fail("ADMISSION_TIME")
  return elapsed
}
export const closeLeanCorrectionAdmission = (carrier: ReturnType<typeof beginLeanCorrectionAdmission>, ledger: LeanExperimentLedger | null, now = admissionClock()) => {
  const elapsedUpperBoundMs = leanCorrectionAdmissionElapsed(carrier, now)
  if (carrier.schemaVersion === "lean-correction-supervisor-admission-v8" || carrier.schemaVersion === "lean-correction-supervisor-admission-v5" || (carrier.schemaVersion === "lean-correction-supervisor-admission-v6" || carrier.schemaVersion === "lean-correction-supervisor-admission-v7")) {
    // Raw clock observations authenticate elapsed; the effective ledger boundary
    // may lead wall time after conservative monotonic rounding. Publish it only
    // after importing/closing, so receipt and journal cannot disagree.
    let importedMs = 0, ledgerInterval: string | null = null, ledgerCloseMs = carrier.wallStartMs + elapsedUpperBoundMs
    if (ledger) {
      let time = readLeanTimeAccounting(ledger)
      if (time.active) {
        if (time.starts.get("pilot-entry") !== carrier.wallStartMs) return fail("ADMISSION_UNCLOSED_ENTRY")
        time = closeLeanInterval(ledger, "pilot-entry", ledgerCloseMs)
      }
      if (time.starts.has("pilot-entry") && time.starts.get("pilot-entry") !== carrier.wallStartMs) return fail("ADMISSION_CUSTODY")
      importedMs = time.starts.has("pilot-entry") ? (time.closes.get("pilot-entry") ?? fail("ADMISSION_UNCLOSED_ENTRY")) - carrier.wallStartMs : 0
      ledgerInterval = carrier.mode === "prepare" ? "correction-preparation" : "correction-run-finalization"
      beginLeanInterval(ledger, ledgerInterval, carrier.wallStartMs + importedMs)
      const closed = closeLeanInterval(ledger, ledgerInterval, ledgerCloseMs)
      ledgerCloseMs = closed.closes.get(ledgerInterval)!
    }
    const body = { ...(carrier.schemaVersion === "lean-correction-supervisor-admission-v8" ? { attemptOrdinal: carrier.attemptOrdinal } : {}), schemaVersion: carrier.schemaVersion === "lean-correction-supervisor-admission-v8" ? "lean-correction-supervisor-admission-close-v8" : carrier.schemaVersion === "lean-correction-supervisor-admission-v7" ? "lean-correction-supervisor-admission-close-v7" : carrier.schemaVersion === "lean-correction-supervisor-admission-v6" ? "lean-correction-supervisor-admission-close-v6" : "lean-correction-supervisor-admission-close-v5", startRoot: carrier.root, route: carrier.route, mode: carrier.mode, elapsedUpperBoundMs, monotonicObservedNs: now.monotonicStartNs, wallObservedMs: now.wallStartMs, allocationRoot: ledger?.allocation.root ?? null, ledgerInterval, importedMs, ledgerCloseMs }
    const closed = { ...body, root: labRoot(body.schemaVersion, body) }
    publishLeanCorrection(join(carrier.directory, `admission-${carrier.mode}-close.json`), closed)
    return closed
  }
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
  const body = { schemaVersion: carrier.schemaVersion === "lean-correction-supervisor-admission-v5" ? "lean-correction-supervisor-admission-close-v5" : carrier.schemaVersion === "lean-correction-supervisor-admission-v4" ? "lean-correction-supervisor-admission-close-v4" : carrier.schemaVersion === "lean-correction-supervisor-admission-v3" ? "lean-correction-supervisor-admission-close-v3" : carrier.schemaVersion === "lean-correction-supervisor-admission-v2" ? "lean-correction-supervisor-admission-close-v2" : "lean-correction-admission-close-v1", startRoot: carrier.root, route: carrier.route, mode: carrier.mode, elapsedUpperBoundMs, monotonicObservedNs: now.monotonicStartNs, wallObservedMs: now.wallStartMs, allocationRoot: ledger?.allocation.root ?? null, ledgerInterval, importedMs }
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
export const leanCorrectionSourceManifest = (supervisor: LeanSupervisorMode = false, timeboxExtension?: LeanRetryTimeboxExtension): { entries: Array<{ path: string; root: string }>; root: LabRoot } => {
  if (isLeanRetryMode(supervisor)) {
    const extension = timeboxExtension === undefined ? undefined : admitLeanRetryTimeboxExtension(timeboxExtension)
    const closure = new Map(leanCorrectionSourceManifest("v7").entries.map(entry => [entry.path, entry]))
    if (extension) {
      const documents = leanRetryExtensionDocumentsV8(extension, supervisor)
      const added = isLeanBookkeepingContinuationV8(extension) ? [documents.decision, documents.plan, "scripts/lib/v1-38-lean-bookkeeping-continuation.test.ts"] : [documents.decision, documents.plan, LEAN_RETRY_V8_TIMEBOX_RESEARCH]
      for (const path of added) closure.set(path, { path, root: leanBytesRoot(readFileSync(resolve(path))) })
    }
    for (const path of LEAN_RETRY_V8_SOURCE_INVENTORY) closure.set(path, { path, root: leanBytesRoot(readFileSync(resolve(path))) })
    const entries = [...closure.values()].sort((a, b) => a.path.localeCompare(b.path))
    return { entries, root: labRoot("lean-retry-reviewed-source-v8", { attemptOrdinal: leanRetryOrdinal(supervisor), entries, ...(extension ? { timeboxExtension: extension } : {}), approvalRoot: LEAN_RETRY_V8_APPROVAL_ROOT, planRoot: LEAN_RETRY_V8_PLAN_ROOT, envelopePolicy: LEAN_RETRY_V8_POLICY, harnessRoot: leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV5())), brokerRoot: leanBytesRoot(Buffer.from(buildLeanContainerBrokerSourceV7())) }) }
  }
  if (supervisor === "v7") {
    const closure = new Map(leanBaselineSourceManifest().entries.map(entry => [entry.path, entry]))
    for (const path of LEAN_HOST_STAGE_V7_SOURCE_INVENTORY) closure.set(path, { path, root: leanBytesRoot(readFileSync(resolve(path))) })
    const entries = [...closure.values()].sort((a, b) => a.path.localeCompare(b.path))
    return { entries, root: labRoot("lean-correction-supervisor-reviewed-source-v7", { entries, policyRoot: LEAN_REPLAY_V7_POLICY.bytesRoot, supplementRoot: LEAN_REPLAY_V7_SUPPLEMENT_ROOT, approvalRoot: LEAN_REPLAY_V7_APPROVAL_ROOT, harnessRoot: leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV5())), brokerRoot: leanBytesRoot(Buffer.from(buildLeanContainerBrokerSourceV7())) }) }
  }
  const entries = new Map(leanBaselineSourceManifest().entries.map(e => [e.path, e]))
  for (const path of ["scripts/run-v1-38-lean-correction.ts", "scripts/run-v1-38-lean-correction.sh", "scripts/lib/v1-38-lean-baseline-reuse.ts", "scripts/lib/v1-38-lean-correction-retained.ts", "scripts/lib/v1-38-planner-supervised-runtime.ts"]) entries.set(path, { path, root: leanBytesRoot(readFileSync(resolve(path))) })
  if (supervisor) for (const path of ["scripts/run-v1-38-lean-baseline.ts", "scripts/run-v1-38-lean-baseline.test.ts", "scripts/run-v1-38-lean-correction.test.ts", "scripts/lib/v1-38-lean-correction-retained.test.ts", "packages/strategy-lab/src/league/lean-experiment.ts", "packages/strategy-lab/src/league/lean-experiment.test.ts", "scripts/lib/v1-38-lean-baseline-pipeline.ts", "scripts/lib/v1-38-lean-container-match-session.ts"]) entries.set(path, { path, root: leanBytesRoot(readFileSync(resolve(path))) })
  if (supervisor === "v3" || supervisor === "v4" || supervisor === "v5") for (const path of ["scripts/lib/v1-38-lean-baseline-source.ts", "scripts/lib/v1-38-lean-baseline-source.test.ts", "scripts/lib/v1-38-lean-experiment-authority.ts", "scripts/lib/v1-38-lean-baseline-authority.test.ts"]) entries.set(path, { path, root: leanBytesRoot(readFileSync(resolve(path))) })
  if (supervisor === "v4") for (const path of ["scripts/run-v1-38-lean-fresh-reader.test.ts", "scripts/run-v1-38-lean-correction-bytes.test.ts", "scripts/run-v1-38-lean-baseline.sh"]) entries.set(path, { path, root: leanBytesRoot(readFileSync(resolve(path))) })
  if (supervisor === "v5") for (const path of ["scripts/run-v1-38-lean-startup-v5.test.ts", "scripts/run-v1-38-lean-experiment.ts", "scripts/lib/v1-38-factory-supervised-runtime.ts", "scripts/lib/v1-38-lean-baseline-match.ts"]) entries.set(path, { path, root: leanBytesRoot(readFileSync(resolve(path))) })
  if (supervisor === "v6") for (const path of [LEAN_REPLAY_V6_DECISION, LEAN_REPLAY_V6_PLAN, ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-REPLAY-V6-POLICY-v1.json", "scripts/run-v1-38-lean-replay-validation-v6.test.ts", "scripts/run-v1-38-lean-replay-validation-v5.test.ts", "scripts/lib/v1-38-lean-baseline-source.ts", "scripts/lib/v1-38-lean-experiment-authority.ts", "scripts/lib/v1-38-planner-supervised-runtime.ts", "scripts/lib/v1-38-factory-supervised-runtime.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-startup-supervisor.mjs", "scripts/run-v1-38-lean-experiment.ts"]) entries.set(path, { path, root: leanBytesRoot(readFileSync(resolve(path))) })
  const sorted = [...entries.values()].sort((a, b) => a.path.localeCompare(b.path))
  return { entries: sorted, root: labRoot(supervisor ? `lean-correction-supervisor-reviewed-source-v${leanSupervisorVersion(supervisor)}` : "lean-correction-reviewed-source-v1", supervisor === "v6" ? { entries: sorted, policyRoot: LEAN_STARTUP_POLICY_V5.root, supplementRoot: LEAN_REPLAY_V6_SUPPLEMENT_ROOT, approvalRoot: LEAN_REPLAY_V6_APPROVAL_ROOT, harnessRoot: leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV5())), brokerRoot: leanBytesRoot(Buffer.from(buildLeanContainerBrokerSourceV6())) } : supervisor === "v5" ? { entries: sorted, policyRoot: LEAN_STARTUP_POLICY_V5.root, supplementRoot: LEAN_STARTUP_SUPPLEMENT_ROOT, harnessRoot: leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV5())), brokerRoot: leanBytesRoot(Buffer.from(buildLeanContainerBrokerSourceV5())) } : sorted) }
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
  if (!Buffer.from(bytes).equals(Buffer.from(leanCanonicalBytes(value)))) return fail("CANONICAL")
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
  const mode = args[0]
  if (mode && /^(prepare|run|verify|verify-terminal)-supervisor-(diagnostic|baseline)-v8-[123]$/u.test(mode)) {
    const route: LeanCorrectionRoute = mode.includes("-diagnostic-") ? "diagnostic" : "baseline", supervisor = mode.slice(-4) as LeanRetryMode
    if (args.length !== 3 || args[1] !== "--request" || args[2] !== leanCorrectionRoutePaths(route, supervisor).request || mode.startsWith("verify-terminal-") && route !== "diagnostic") return fail("ARGUMENTS")
    return { mode, route, request: args[2]!, supervisor }
  }
  if (mode && /^(prepare|run|verify)-supervisor-(diagnostic|baseline)-v[234567]$/u.test(mode)) {
    const route: LeanCorrectionRoute = mode.includes("-diagnostic-") ? "diagnostic" : "baseline"
    const supervisor = mode.endsWith("-v7") ? "v7" as const : mode.endsWith("-v6") ? "v6" as const : mode.endsWith("-v5") ? "v5" as const : mode.endsWith("-v4") ? "v4" as const : mode.endsWith("-v3") ? "v3" as const : true
    if (args.length !== 3 || args[1] !== "--request" || args[2] !== leanCorrectionRoutePaths(route, supervisor).request) return fail("ARGUMENTS")
    return { mode, route, request: args[2]!, supervisor }
  }
  const route: LeanCorrectionRoute = mode?.endsWith("-diagnostic") ? "diagnostic" : mode?.endsWith("-baseline") ? "baseline" : fail("ARGUMENTS")
  if (args.length !== 3 || args[1] !== "--request" || !["prepare", "run", "verify"].some(prefix => mode === `${prefix}-${route}`) || args[2] !== LEAN_CORRECTION_ROUTES[route].request) return fail("ARGUMENTS")
  return { mode: mode!, route, request: args[2]! }
}
export const assertLeanCorrectionResources = (m: { elapsedMs: number; charged: number; physicalBytes: number; childRss: number; parentRss: number; freeBytes: number; availableMemoryBytes: number }, allocation?: AnyLeanAllocation): number => {
  const caps = allocation === undefined ? LEAN_CAPS : leanCapsForAllocation(allocation)
  if (!exactLabKeys(m, ["elapsedMs", "charged", "physicalBytes", "childRss", "parentRss", "freeBytes", "availableMemoryBytes"]) || !Object.values(m).every(n => Number.isSafeInteger(n) && n >= 0) || m.elapsedMs < 3319046 || m.charged < 10 || m.charged >= LEAN_CAPS.matches || m.elapsedMs + LEAN_CAPS.matchMs + LEAN_CORRECTION_RESERVE.cleanupMs + LEAN_CORRECTION_RESERVE.terminalMs + LEAN_CORRECTION_RESERVE.checkMs + LEAN_CORRECTION_RESERVE.replayMs >= caps.elapsedMs || m.physicalBytes + LEAN_CORRECTION_RESERVE.terminalBytes > LEAN_CAPS.retainedBytes || m.childRss + m.parentRss + LEAN_EXTERNAL_SCRATCH_RESERVE + LEAN_CORRECTION_RESERVE.bufferBytes > LEAN_CAPS.scratchBytes || m.physicalBytes + m.childRss + m.parentRss + LEAN_EXTERNAL_SCRATCH_RESERVE + LEAN_CORRECTION_RESERVE.bufferBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes || m.freeBytes < LEAN_CAPS.totalBytes - m.physicalBytes || m.availableMemoryBytes < 1_073_741_824) return fail("CAPACITY")
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
  timeboxExtension?: LeanRetryTimeboxExtension; startupPolicyRoot?: LabRoot; authorizationPath?: string; authorizationRoot?: LabRoot
  attemptOrdinal?: LeanRetryOrdinal; priorClosureRoot?: LabRoot | null; continuationRoot?: LabRoot | null; acceptedReaderCloseRoot?: LabRoot | null
  schemaVersion: "lean-correction-supervisor-request-v8" | "lean-correction-supervisor-request-v7" | "lean-correction-supervisor-request-v6" | "lean-correction-supervisor-request-v5" | "lean-correction-supervisor-request-v4" | "lean-correction-request-v1" | "lean-correction-supervisor-request-v2" | "lean-correction-supervisor-request-v3"; route: LeanCorrectionRoute; sourceRoot: LabRoot; planRoot: LabRoot; amendmentRoot: LabRoot
  reviewPath: string; reviewRoot: LabRoot; dataReviewPath: string; dataReviewRoot: LabRoot; coldRoot: LabRoot; seed: string; reuseGrantRoot: LabRoot
  candidateRoots: readonly LabRoot[]; requestRoots: readonly LabRoot[]; diagnosis: LeanCorrectionDiagnosis | null
  supervisorDecisionRoot?: LabRoot; acceptedCheckRoot?: LabRoot | null; setupAccountingPath?: string; setupAccountingRoot?: LabRoot
}
export const authenticateLeanCorrectionReview = (path: string, expected: LabRoot, source: LabRoot, diagnosisRoot: LabRoot | null, dataRequestRoot?: LabRoot, supervisor: LeanSupervisorMode = false, timeboxExtension?: LeanRetryTimeboxExtension) => {
  const absolute = resolve(path)
  if (!absolute.startsWith(`${resolve(".planning/phases/265-serious-current-rules-league-and-development-red-team")}/`)) return fail("REVIEW")
  const bytes = readFileSync(absolute)
  if (bytes.length > 262144 || leanBytesRoot(bytes) !== expected) return fail("REVIEW")
  const front = bytes.toString("utf8").split("\n---", 2)[0]!
  const field = (key: string) => front.match(new RegExp(`^${key}: ([^\\n]+)$`, "mu"))?.[1]?.replace(/^['"]|['"]$/gu, "")
  const commit = field("source_commit")
  if (!front.startsWith("---\n") || field("status") !== "clean" || field("source_root") !== source || field("independently_reviewed") !== "true" || !(supervisor ? admitsLeanSupervisorReviewAgents : admitsLeanBaselineReviewAgents)(field("author_agent"), field("reviewer_agent")) || !commit || !/^[a-f0-9]{40}$/u.test(commit) || diagnosisRoot !== null && (field("diagnosis_root") !== diagnosisRoot || field("repair_verified") !== "true") || dataRequestRoot !== undefined && field("request_root") !== dataRequestRoot) return fail("REVIEW")
  if ((supervisor === "v7" || isLeanRetryMode(supervisor)) && leanCorrectionSourceManifest(supervisor, timeboxExtension).root !== source) return fail("REVIEW_SOURCE")
  try { execFileSync("git", ["diff", "--exit-code", commit, "--", ...leanCorrectionSourceManifest(supervisor, timeboxExtension).entries.map(e => e.path)], { stdio: "pipe", maxBuffer: 1024 }) } catch { return fail("REVIEW_SOURCE") }
}
const readReview = authenticateLeanCorrectionReview
export const leanCorrectionRequestDataRoot = (request: LeanCorrectionRequest): LabRoot => {
  const { dataReviewPath: _path, dataReviewRoot: _root, ...raw } = request
  const body = (request.schemaVersion === "lean-correction-supervisor-request-v8" || request.schemaVersion === "lean-correction-supervisor-request-v5" || request.schemaVersion === "lean-correction-supervisor-request-v6" || request.schemaVersion === "lean-correction-supervisor-request-v7") ? Object.fromEntries(Object.entries(raw).filter(([key]) => key !== "authorizationRoot")) : raw
  return labRoot(request.schemaVersion === "lean-correction-supervisor-request-v8" ? "lean-correction-supervisor-request-data-v8" : request.schemaVersion === "lean-correction-supervisor-request-v7" ? "lean-correction-supervisor-request-data-v7" : request.schemaVersion === "lean-correction-supervisor-request-v6" ? "lean-correction-supervisor-request-data-v6" : request.schemaVersion === "lean-correction-supervisor-request-v5" ? "lean-correction-supervisor-request-data-v5" : request.schemaVersion === "lean-correction-supervisor-request-v4" ? "lean-correction-supervisor-request-data-v4" : request.schemaVersion === "lean-correction-supervisor-request-v3" ? "lean-correction-supervisor-request-data-v3" : request.schemaVersion === "lean-correction-supervisor-request-v2" ? "lean-correction-supervisor-request-data-v2" : "lean-correction-request-data-v1", body)
}
export const deriveLeanCorrectionRequestRoots = (input: { route: LeanCorrectionRoute; seed: string; coldRoot: LabRoot; planRoot: LabRoot; sourceRoot: LabRoot }): readonly LabRoot[] => {
  if (!exactLabKeys(input, ["route", "seed", "coldRoot", "planRoot", "sourceRoot"]) || !["diagnostic", "baseline"].includes(input.route)) return fail("REQUEST_ROOTS")
  const roots = deriveLeanBaselineRequestRoots({ seed: input.seed, coldRoot: input.coldRoot, planRoot: input.planRoot, sourceRoot: input.sourceRoot })
  return (input.route === "diagnostic" ? roots.slice(0, 1) : roots).map((historicalIntentRoot, ordinal) => labRoot("lean-correction-request-slot-v1", { route: input.route, historicalIntentRoot, ordinal }))
}
export const readLeanCorrectionRequest = (path: string, route: LeanCorrectionRoute, supervisor: LeanSupervisorMode = false): { request: LeanCorrectionRequest; reuse: LeanColdReuse } => {
  if (supervisor) return readLeanSupervisorCorrectionRequest(path, route, supervisor)
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
export const deriveLeanSupervisorCorrectionRequestRoots = (input: Parameters<typeof deriveLeanCorrectionRequestRoots>[0], supervisorDecisionRoot: LabRoot, supervisor: true | "v3" | "v4" | "v5" | "v6" | "v7" | LeanRetryMode = true) => {
  if (!root(supervisorDecisionRoot)) return fail("SUPERVISOR_DECISION")
  return deriveLeanCorrectionRequestRoots(input).map((intentRoot, ordinal) => labRoot(`lean-correction-supervisor-request-slot-v${leanSupervisorVersion(supervisor)}`, { intentRoot, ordinal, supervisorDecisionRoot, ...(isLeanRetryMode(supervisor) ? { attemptOrdinal: leanRetryOrdinal(supervisor) } : {}) }))
}
export const readLeanSupervisorCorrectionRequest = (path: string, route: LeanCorrectionRoute, supervisor: true | "v3" | "v4" | "v5" | "v6" | "v7" | LeanRetryMode = true): { request: LeanCorrectionRequest; reuse: LeanColdReuse } => {
  if (isLeanRetryMode(supervisor)) return readLeanRetryRequestV8(path, route, supervisor)
  const documents = supervisorDocuments(supervisor)
  if (path !== leanCorrectionRoutePaths(route, supervisor).request) return fail("REQUEST_PATH")
  const request = readLeanCorrectionJson(path) as LeanCorrectionRequest
  const decision = readFileSync(documents.decision)
  if (supervisor === "v7") {
    if (leanBytesRoot(decision) !== LEAN_REPLAY_V7_APPROVAL_ROOT || leanBytesRoot(readFileSync(documents.plan)) !== LEAN_REPLAY_V7_SUPPLEMENT_ROOT || request.startupPolicyRoot !== LEAN_STARTUP_POLICY_V5.root || typeof request.authorizationPath !== "string" || !request.authorizationPath.startsWith(".strategy-lab/lean-host-stage-v7-") || request.authorizationPath.includes("..") || !root(request.authorizationRoot)) return fail("SUPERVISOR_REQUEST")
    const authorization = readLeanCorrectionJson(request.authorizationPath) as Record<string, unknown>
    if (!exactLabKeys(authorization, ["schemaVersion", "approved", "executionAuthorized", "route", "sourceRoot", "approvalRoot", "supplementRoot", "policyRoot", "requestDataRoot", "root"]) || authorization.schemaVersion !== "lean-replay-execution-authorization-v7" || authorization.approved !== true || authorization.executionAuthorized !== true || authorization.route !== route || authorization.sourceRoot !== request.sourceRoot || authorization.approvalRoot !== LEAN_REPLAY_V7_APPROVAL_ROOT || authorization.supplementRoot !== LEAN_REPLAY_V7_SUPPLEMENT_ROOT || authorization.policyRoot !== LEAN_REPLAY_V7_POLICY.bytesRoot || authorization.requestDataRoot !== leanCorrectionRequestDataRoot(request)) return fail("SUPERVISOR_REQUEST")
    const { root: claimed, ...body } = authorization
    if (claimed !== labRoot("lean-replay-execution-authorization-v7", body) || request.authorizationRoot !== leanBytesRoot(leanCanonicalBytes(authorization))) return fail("SUPERVISOR_REQUEST")
  }
  if (supervisor === "v5") {
    if (leanBytesRoot(decision) !== LEAN_STARTUP_APPROVAL_ROOT || leanBytesRoot(readFileSync(documents.plan)) !== LEAN_STARTUP_SUPPLEMENT_ROOT || request.startupPolicyRoot !== LEAN_STARTUP_POLICY_V5.root || typeof request.authorizationPath !== "string" || !request.authorizationPath.startsWith(".strategy-lab/lean-startup-v5-") || request.authorizationPath.includes("..") || !root(request.authorizationRoot)) return fail("SUPERVISOR_REQUEST")
    const authorization = readLeanCorrectionJson(request.authorizationPath) as Record<string, unknown>
    if (!exactLabKeys(authorization, ["schemaVersion", "approved", "executionAuthorized", "route", "sourceRoot", "approvalRoot", "supplementRoot", "policyRoot", "requestDataRoot", "root"]) || authorization.schemaVersion !== "lean-startup-execution-authorization-v5" || authorization.approved !== true || authorization.executionAuthorized !== true || authorization.route !== route || authorization.sourceRoot !== request.sourceRoot || authorization.approvalRoot !== LEAN_STARTUP_APPROVAL_ROOT || authorization.supplementRoot !== LEAN_STARTUP_SUPPLEMENT_ROOT || authorization.policyRoot !== LEAN_STARTUP_POLICY_V5.root || authorization.requestDataRoot !== leanCorrectionRequestDataRoot(request)) return fail("SUPERVISOR_REQUEST")
    const { root: claimed, ...body } = authorization
    if (claimed !== labRoot("lean-startup-execution-authorization-v5", body) || request.authorizationRoot !== leanBytesRoot(leanCanonicalBytes(authorization))) return fail("SUPERVISOR_REQUEST")
  }
  if (supervisor === "v6") {
    if (leanBytesRoot(decision) !== LEAN_REPLAY_V6_APPROVAL_ROOT || leanBytesRoot(readFileSync(documents.plan)) !== LEAN_REPLAY_V6_SUPPLEMENT_ROOT || request.startupPolicyRoot !== LEAN_STARTUP_POLICY_V5.root || typeof request.authorizationPath !== "string" || !request.authorizationPath.startsWith(".strategy-lab/lean-replay-v6-") || request.authorizationPath.includes("..") || !root(request.authorizationRoot)) return fail("SUPERVISOR_REQUEST")
    const authorization = readLeanCorrectionJson(request.authorizationPath) as Record<string, unknown>
    if (!exactLabKeys(authorization, ["schemaVersion", "approved", "executionAuthorized", "route", "sourceRoot", "approvalRoot", "supplementRoot", "policyRoot", "requestDataRoot", "root"]) || authorization.schemaVersion !== "lean-replay-execution-authorization-v6" || authorization.approved !== true || authorization.executionAuthorized !== true || authorization.route !== route || authorization.sourceRoot !== request.sourceRoot || authorization.approvalRoot !== LEAN_REPLAY_V6_APPROVAL_ROOT || authorization.supplementRoot !== LEAN_REPLAY_V6_SUPPLEMENT_ROOT || authorization.policyRoot !== LEAN_STARTUP_POLICY_V5.root || authorization.requestDataRoot !== leanCorrectionRequestDataRoot(request)) return fail("SUPERVISOR_REQUEST")
    const { root: claimed, ...body } = authorization
    if (claimed !== labRoot("lean-replay-execution-authorization-v6", body) || request.authorizationRoot !== leanBytesRoot(leanCanonicalBytes(authorization))) return fail("SUPERVISOR_REQUEST")
  }
  if (!exactLabKeys(request, ["schemaVersion", "route", "sourceRoot", "planRoot", "amendmentRoot", "reviewPath", "reviewRoot", "dataReviewPath", "dataReviewRoot", "coldRoot", "seed", "reuseGrantRoot", "candidateRoots", "requestRoots", "diagnosis", "supervisorDecisionRoot", "acceptedCheckRoot", "setupAccountingPath", "setupAccountingRoot", ...((supervisor === "v5" || (supervisor === "v6" || (supervisor === "v7" || isLeanRetryMode(supervisor)))) ? ["startupPolicyRoot", "authorizationPath", "authorizationRoot"] : [])]) || request.schemaVersion !== `lean-correction-supervisor-request-v${leanSupervisorVersion(supervisor)}` || request.route !== route || request.diagnosis !== null || request.sourceRoot !== leanCorrectionSourceManifest(supervisor).root || request.planRoot !== leanBytesRoot(readFileSync(documents.plan)) || request.supervisorDecisionRoot !== leanBytesRoot(decision) || supervisor !== "v7" && supervisor !== "v5" && (!/^approved: true$/mu.test(decision.toString("utf8")) || !/^execution_authorized: true$/mu.test(decision.toString("utf8"))) || request.amendmentRoot !== LEAN_COLD_REUSE_HISTORY.amendmentRoot || leanBytesRoot(readFileSync(AMENDMENT)) !== request.amendmentRoot || request.coldRoot !== LEAN_COLD_REUSE_HISTORY.coldRoot || request.seed !== LEAN_COLD_REUSE_HISTORY.seed || !same(request.candidateRoots, deriveLeanBaselineCandidateRoots(request.coldRoot)) || !same(request.requestRoots, deriveLeanSupervisorCorrectionRequestRoots({ route, seed: request.seed, sourceRoot: request.sourceRoot, planRoot: request.planRoot, coldRoot: request.coldRoot }, request.supervisorDecisionRoot!, supervisor)) || request.setupAccountingPath !== documents.setup || request.setupAccountingRoot !== readLeanSupervisorSetupWitness(supervisor).root) return fail("SUPERVISOR_REQUEST")
  const reuse = authenticateLeanColdReuse({ directory: LEAN_BASELINE_STORE, newSourceRoot: request.sourceRoot, amendmentRoot: request.amendmentRoot })
  if (reuse.grant.root !== request.reuseGrantRoot) return fail("REUSE")
  if (route === "diagnostic" ? request.acceptedCheckRoot !== null : authenticateLeanSupervisorDiagnosticCheck(supervisor).root !== request.acceptedCheckRoot) return fail("ACCEPTED_CHECK")
  readReview(request.reviewPath, request.reviewRoot, request.sourceRoot, null, undefined, supervisor)
  readReview(request.dataReviewPath, request.dataReviewRoot, request.sourceRoot, null, leanCorrectionRequestDataRoot(request), supervisor)
  return { request, reuse }
}
export const readLeanRetryRequestV8 = (path: string, route: LeanCorrectionRoute, mode: LeanRetryMode): { request: LeanCorrectionRequest; reuse: LeanColdReuse } => {
  const n = leanRetryOrdinal(mode), paths = leanCorrectionRoutePaths(route, mode)
  if (path !== paths.request) return fail("REQUEST_PATH")
  const request = readLeanCorrectionJson(path) as LeanCorrectionRequest
  const extension = Object.hasOwn(request, "timeboxExtension") ? admitLeanRetryTimeboxExtension(request.timeboxExtension) : undefined
  if (extension) assertLeanRetryExtensionDocumentsV8(extension, mode)
  const keys = [...(extension ? ["timeboxExtension"] : []), "schemaVersion", "route", "sourceRoot", "planRoot", "amendmentRoot", "reviewPath", "reviewRoot", "dataReviewPath", "dataReviewRoot", "coldRoot", "seed", "reuseGrantRoot", "candidateRoots", "requestRoots", "diagnosis", "supervisorDecisionRoot", "acceptedCheckRoot", "setupAccountingPath", "setupAccountingRoot", "startupPolicyRoot", "authorizationPath", "authorizationRoot", "attemptOrdinal", "priorClosureRoot", "continuationRoot", "acceptedReaderCloseRoot"]
  if (!exactLabKeys(request, keys) || request.schemaVersion !== "lean-correction-supervisor-request-v8" || request.route !== route || request.attemptOrdinal !== n || request.diagnosis !== null || request.planRoot !== LEAN_RETRY_V8_PLAN_ROOT || request.supervisorDecisionRoot !== LEAN_RETRY_V8_APPROVAL_ROOT || leanBytesRoot(readFileSync(LEAN_RETRY_V8_DECISION)) !== LEAN_RETRY_V8_APPROVAL_ROOT || leanBytesRoot(readFileSync(LEAN_RETRY_V8_PLAN)) !== LEAN_RETRY_V8_PLAN_ROOT || request.startupPolicyRoot !== LEAN_STARTUP_POLICY_V5.root || request.sourceRoot !== leanCorrectionSourceManifest(mode, extension).root || request.setupAccountingPath !== leanRetrySetupPath(mode) || request.setupAccountingRoot !== readLeanRetrySetupWitnessV8(mode).root || !same(extension ?? null, readLeanRetrySetupWitnessV8(mode).timeboxExtension ?? null) || request.authorizationPath !== `.strategy-lab/lean-retry-authorization-${route}-v8-${n}.json` || request.amendmentRoot !== LEAN_COLD_REUSE_HISTORY.amendmentRoot || request.coldRoot !== LEAN_COLD_REUSE_HISTORY.coldRoot || request.seed !== LEAN_COLD_REUSE_HISTORY.seed || !same(request.candidateRoots, deriveLeanBaselineCandidateRoots(request.coldRoot)) || !same(request.requestRoots, deriveLeanSupervisorCorrectionRequestRoots({ route, seed: request.seed, coldRoot: request.coldRoot, planRoot: request.planRoot, sourceRoot: request.sourceRoot }, request.supervisorDecisionRoot!, mode))) return fail("SUPERVISOR_REQUEST")
  const authorization = readLeanCorrectionJson(request.authorizationPath) as Record<string, unknown>, { root: claimed, ...body } = authorization
  if (!exactLabKeys(authorization, ["schemaVersion", "approved", "executionAuthorized", "route", "attemptOrdinal", "sourceRoot", "approvalRoot", "planRoot", "policyRoot", "requestDataRoot", "authorAgent", "reviewerAgent", "root", ...(extension ? ["timeboxExtension"] : [])]) || !same(authorization.timeboxExtension ?? null, extension ?? null) || authorization.schemaVersion !== "lean-retry-execution-authorization-v8" || authorization.approved !== true || authorization.executionAuthorized !== true || authorization.route !== route || authorization.attemptOrdinal !== n || authorization.sourceRoot !== request.sourceRoot || authorization.approvalRoot !== LEAN_RETRY_V8_APPROVAL_ROOT || authorization.planRoot !== LEAN_RETRY_V8_PLAN_ROOT || authorization.policyRoot !== labRoot(LEAN_RETRY_V8_POLICY.schemaVersion, LEAN_RETRY_V8_POLICY) || authorization.authorAgent !== "/root" || !admitsLeanSupervisorReviewAgents(authorization.authorAgent, authorization.reviewerAgent) || authorization.requestDataRoot !== leanCorrectionRequestDataRoot(request) || claimed !== labRoot(String(authorization.schemaVersion), body) || request.authorizationRoot !== leanBytesRoot(leanCanonicalBytes(authorization))) return fail("SUPERVISOR_REQUEST")
  if (n === 1 ? request.priorClosureRoot !== null || request.continuationRoot !== null : !root(request.priorClosureRoot) || !root(request.continuationRoot)) return fail("DIAGNOSTIC_CUSTODY")
  let continuationDiagnosisRoot: LabRoot | null = null
  if (n > 1) {
    const historical = isLeanBookkeepingContinuationV8(extension) ? authenticateLeanBookkeepingPredecessorV8() : null
    const previous = historical?.diagnostic ?? authenticateLeanRetryClosureV8(`v8-${n - 1}` as LeanRetryMode), continuation = readLeanCorrectionJson(`.strategy-lab/lean-retry-continuation-v8-${n}.json`) as Record<string, unknown>, { root: cr, ...cb } = continuation
    const predecessorValid = historical ? isLeanBookkeepingContinuationV8(extension) && n === 2 && previous.root === extension.diagnosticClosureRoot && same(continuation.timeboxExtension, extension) && continuation.failedBaselineRoot === historical.baseline.root : same(previous.timeboxExtension ?? null, extension ?? null) && previous.closureClass !== "accepted"
    if (!predecessorValid || request.priorClosureRoot !== previous.root || request.continuationRoot !== cr || !exactLabKeys(continuation, ["schemaVersion", "attemptOrdinal", "priorClosureRoot", "sourceRoot", "diagnosisRoot", "resolvedDefectRoot", "reviewRoot", "root", ...(historical ? ["timeboxExtension", "failedBaselineRoot"] : [])]) || continuation.schemaVersion !== "lean-retry-continuation-v8" || continuation.attemptOrdinal !== n || continuation.priorClosureRoot !== previous.root || continuation.sourceRoot !== request.sourceRoot || continuation.reviewRoot !== request.reviewRoot || !root(continuation.diagnosisRoot) || !root(continuation.resolvedDefectRoot) || continuation.diagnosisRoot === previous.resultBytesRoot || continuation.resolvedDefectRoot === previous.resultBytesRoot || cr !== labRoot(String(continuation.schemaVersion), cb)) return fail("DIAGNOSTIC_CUSTODY")
    continuationDiagnosisRoot = continuation.diagnosisRoot as LabRoot
  }
  if (route === "diagnostic") { if (request.acceptedCheckRoot !== null || request.acceptedReaderCloseRoot !== null) return fail("ACCEPTED_CHECK") }
  else {
    const accepted = authenticateLeanSupervisorDiagnosticCheck(mode), closure = authenticateLeanRetryClosureV8(mode)
    if (!same(closure.timeboxExtension ?? null, extension ?? null) || closure.closureClass !== "accepted" || request.acceptedCheckRoot !== accepted.root || request.acceptedReaderCloseRoot !== closure.root || closure.checkRoot !== accepted.root || closure.readerCloseMs !== accepted.readerCloseMs) return fail("ACCEPTED_CHECK")
  }
  const reuse = authenticateLeanColdReuse({ directory: LEAN_BASELINE_STORE, newSourceRoot: request.sourceRoot, amendmentRoot: request.amendmentRoot })
  if (reuse.grant.root !== request.reuseGrantRoot) return fail("REUSE")
  readReview(request.reviewPath, request.reviewRoot, request.sourceRoot, continuationDiagnosisRoot, undefined, mode, extension)
  readReview(request.dataReviewPath, request.dataReviewRoot, request.sourceRoot, continuationDiagnosisRoot, leanCorrectionRequestDataRoot(request), mode, extension)
  return { request, reuse }
}
/** Count each inode exactly once, including nested directories. Reject aliases,
 * changed metadata, links, ownership drift and unsafe ancestry. No deletions. */
export const inventoryLeanSupervisorSurvivors = (identities: readonly string[]) => {
  const unique = [...new Set(identities)].sort()
  if (unique.length !== identities.length) return fail("SURVIVOR_DUPLICATE")
  const roots = unique.filter(path => !unique.some(ancestor => path.startsWith(`${ancestor}/`)))
  const seen = new Set<string>(), rows: Array<{ identity: string; allocatedBytes: number }> = []
  const visit = (identity: string, depth = 0) => {
    if (depth > 16 || rows.length >= 200000) return fail("SURVIVOR_LIMIT")
    const absolute = resolve(identity), before = lstatSync(absolute), inode = `${before.dev}:${before.ino}`
    if (before.isSymbolicLink() || before.uid !== process.getuid?.() || realpathSync(absolute) !== absolute || !before.isFile() && !before.isDirectory() || before.isFile() && before.nlink !== 1 || seen.has(inode)) return fail("SURVIVOR")
    seen.add(inode); rows.push({ identity, allocatedBytes: before.blocks * 512 })
    if (before.isDirectory()) for (const name of readdirSync(absolute).sort()) visit(join(identity, name), depth + 1)
    const after = lstatSync(absolute)
    if (after.dev !== before.dev || after.ino !== before.ino || after.size !== before.size || after.blocks !== before.blocks || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs) return fail("SURVIVOR_CHANGED")
  }
  for (const path of roots) visit(path)
  return rows.sort((a, b) => a.identity.localeCompare(b.identity))
}
export function readLeanSupervisorSetupWitness(supervisor: "v5"): ReturnType<typeof validateLeanStartupSetupWitnessV5>
export function readLeanSupervisorSetupWitness(supervisor?: true | "v3" | "v4"): ReturnType<typeof readLeanLegacySupervisorSetupWitness>
export function readLeanSupervisorSetupWitness(supervisor: true | "v3" | "v4" | "v5" | "v6" | "v7" | LeanRetryMode): ReturnType<typeof validateLeanStartupSetupWitnessV5> | ReturnType<typeof readLeanLegacySupervisorSetupWitness> | ReturnType<typeof readLeanRetrySetupWitnessV8>
export function readLeanSupervisorSetupWitness(supervisor: true | "v3" | "v4" | "v5" | "v6" | "v7" | LeanRetryMode = true) {
  if (isLeanRetryMode(supervisor)) return readLeanRetrySetupWitnessV8(supervisor)
  return supervisor === "v7" ? validateLeanReplaySetupWitnessV7(readLeanCorrectionJson(LEAN_REPLAY_V7_SETUP_PATH)) : supervisor === "v6" ? validateLeanReplaySetupWitnessV6(readLeanCorrectionJson(LEAN_REPLAY_V6_SETUP_PATH)) : supervisor === "v5" ? validateLeanStartupSetupWitnessV5(readLeanCorrectionJson(LEAN_STARTUP_V5_SETUP_PATH)) : readLeanLegacySupervisorSetupWitness(supervisor)
}
const readLeanLegacySupervisorSetupWitness = (supervisor: true | "v3" | "v4" = true) => {
  if (supervisor === "v4") return validateLeanRepairedReaderSetupWitness(readLeanCorrectionJson(LEAN_REPAIRED_READER_SETUP_WITNESS), leanBytesRoot(readFileSync(LEAN_REPAIRED_READER_DECISION)))
  if (supervisor === "v3") return validateLeanFreshSupervisorSetupWitness(readLeanCorrectionJson(LEAN_FRESH_SUPERVISOR_SETUP_WITNESS), leanBytesRoot(readFileSync(LEAN_FRESH_SUPERVISOR_DECISION)), leanBytesRoot(readFileSync(LEAN_FRESH_SUPERVISOR_SETUP_CUSTODY)))
  const v = readLeanCorrectionJson(LEAN_SUPERVISOR_SETUP_WITNESS) as { schemaVersion: string; startedAtMs: number; observedAtMs: number; source: string; threadId: string; turnId: string; decisionRoot: LabRoot; custodyRoot: LabRoot; root: LabRoot }
  const { root: r, ...body } = v
  if (!exactLabKeys(v, ["schemaVersion", "startedAtMs", "observedAtMs", "source", "threadId", "turnId", "decisionRoot", "custodyRoot", "root"]) || v.schemaVersion !== "lean-supervisor-setup-witness-v2" || v.startedAtMs !== 1791155677000 || !Number.isSafeInteger(v.observedAtMs) || v.observedAtMs < v.startedAtMs || v.source !== "codex-app-read-thread" || v.threadId !== "019fa652-915a-7183-9af1-3b3c05868d86" || v.turnId !== "01a10932-a9e2-77a3-9083-229b602e9d48" || v.decisionRoot !== leanBytesRoot(readFileSync(LEAN_SUPERVISOR_DECISION)) || v.custodyRoot !== leanBytesRoot(readFileSync(LEAN_SUPERVISOR_SETUP_CUSTODY)) || r !== labRoot(v.schemaVersion, body)) return fail("SETUP_WITNESS")
  return v
}
export const inspectLeanSupervisorCorrectionPredecessor = (route: LeanCorrectionRoute, accountingAtMs: number, supervisor: true | "v3" | "v4" | "v5" | "v6" | "v7" | LeanRetryMode = true): LeanCorrectionPredecessor => {
  if (isLeanRetryMode(supervisor)) return inspectLeanRetryPredecessorV8(route, accountingAtMs, supervisor)
  if (supervisor === "v7") return inspectLeanReplayPredecessorV7(route, accountingAtMs)
  if (supervisor === "v6") return inspectLeanReplayPredecessorV6(route, accountingAtMs)
  if (supervisor === "v5") return inspectLeanStartupPredecessorV5(route, accountingAtMs)
  if (supervisor === "v4") return inspectLeanRepairedReaderPredecessor(route, accountingAtMs)
  if (supervisor === "v3") return inspectLeanFreshSupervisorPredecessor(route, accountingAtMs)
  const old = openLeanLedger(LEAN_CORRECTION_ROUTES.diagnostic.store), time = readLeanTimeAccounting(old), state = readLeanLedger(old)
  const rawTime = readLeanCorrectionPrivateBytes(join(old.directory, "time.ndjson"), 4_194_304)
  if (old.allocation.root !== "sha256:7ce7ea8108a389806547d8c9a91dd64110b8cef5e73d3d6b843d7073d889223c" || leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, "result.json"), 8_388_608)) !== "sha256:574e8df011f0463a41c0d5985fe6b676001b180f959b3990fc51599b1be024b9" || leanBytesRoot(rawTime) !== "sha256:5224cd8501e0967bed04990aa8f9ef17768f7003be8f74c3df88d759b4f73024" || time.active || time.elapsedMs !== 5282046 || state.charged !== 11 || !state.stopped || !time.closed.has("correction-diagnostic-terminal-verifier") || time.closes.get("correction-diagnostic-terminal-verifier")! - time.starts.get("correction-diagnostic-terminal-verifier")! !== 435878) return fail("SUPERVISOR_HISTORY")
  // The refused ordinary-reader attempt stays closed/spent. No old acceptance
  // is required and no old reader is executed here.
  const witness = readLeanSupervisorSetupWitness()
  const prior = inspectLeanClosedV7Predecessor(), identities: string[] = [LEAN_BASELINE_STORE, ...LEAN_BASELINE_WRITABLE_PATHS, LEAN_CORRECTION_ROUTES.diagnostic.store, LEAN_CORRECTION_ROUTES.diagnostic.request, LEAN_CORRECTION_ROUTES.diagnostic.allocation, LEAN_CORRECTION_ROUTES.diagnostic.temp]
  let elapsed = time.elapsedMs, charged = state.charged, closedAt = witness.startedAtMs, historyRoots: LabRoot[] = [prior.root, leanBytesRoot(rawTime), old.allocation.root, witness.root]
  if (route === "baseline") {
    const accepted = authenticateLeanSupervisorDiagnosticCheck(), diagnostic = openLeanLedger(LEAN_SUPERVISOR_CORRECTION_ROUTES.diagnostic.store), latest = readLeanTimeAccounting(diagnostic)
    if (latest.active || !latest.closed.has("correction-supervisor-diagnostic-v2-verifier")) return fail("DIAGNOSTIC_UNCLOSED")
    elapsed = latest.elapsedMs; charged = readLeanLedger(diagnostic).charged; closedAt = latest.closes.get("correction-supervisor-diagnostic-v2-verifier")!
    identities.push(...Object.values(LEAN_SUPERVISOR_CORRECTION_ROUTES.diagnostic).filter(path => path.startsWith(".strategy-lab/") || path.startsWith(".planning/artifacts/")))
    historyRoots.push(accepted.root, leanBytesRoot(readLeanCorrectionPrivateBytes(join(diagnostic.directory, "time.ndjson"), 4_194_304)))
  }
  if (!Number.isSafeInteger(accountingAtMs) || accountingAtMs < closedAt || accountingAtMs < witness.observedAtMs) return fail("SUPERVISOR_ACCOUNTING_CLOCK")
  // The independently witnessed active-turn start covers new source/review/data
  // work, not earlier human-approval idle. No past monotonic clock is invented.
  elapsed += accountingAtMs - closedAt
  const survivors = inventoryLeanSupervisorSurvivors(identities)
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: charged, elapsedUpperBoundMs: elapsed, allocatedDiskBytes: prior.allocatedDiskBytes + survivors.reduce((n, s) => n + s.allocatedBytes, 0), historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: labRoot("lean-correction-supervisor-history-v2", { roots: historyRoots, accountingAtMs, closedAt }), survivors }
  return { ...body, root: labRoot(body.schemaVersion, body) }
}
export const LEAN_FRESH_SUPERVISOR_CARRY = Object.freeze({
  allocationRoot: "sha256:da940e2a1d151d80fb9b1e4c7389b5f06440b72407a87451c03a075235bc5c2d" as LabRoot,
  allocationBytesRoot: "sha256:016071d6a2065f00a1c0851b478d7e0ae6164fdbca7f1d8a690384d44db22974" as LabRoot,
  entryBytesRoot: "sha256:415628661243fae8f9dee8f9f7b135a25955a68331175e7301387f1e987f2360" as LabRoot,
  terminalBytesRoot: "sha256:d8cf7c2c93eb1cebdcf687b6e11da27615f1df2102a508c8e346a2f29a21ffb7" as LabRoot,
  reasonBytesRoot: "sha256:dfdfcb340a9bdb6507aec8a1d8315bec65e0b4f7e3d07ae4ff4417ae32590cf7" as LabRoot,
  failureBytesRoot: "sha256:d8200b485f6aa73c7e37dd2c233766db62f7480f22133659f8abc6f0b45eb2fd" as LabRoot,
  timeBytesRoot: "sha256:29aad4a28078c2d3b9fb67bf8106d8ff3c0ec9f5cb81cb7178ea3786ce7eaf5c" as LabRoot,
  charged: 11, closedElapsedMs: 10230553, readerCloseMs: 1791160625507, completionUpperMs: 1791161283000,
  repairAdminMs: 657493, priorElapsedMs: 10888046, physicalFloorBytes: 2179072, setupStartMs: 1791200983000,
})
type FreshSetupWitness = { schemaVersion: "lean-supervisor-setup-witness-v3"; startedAtMs: number; observedAtMs: number; source: string; threadId: string; turnId: string; previousTurnId: string; priorCompletionUpperMs: number; priorCheckCloseMs: number; priorRepairMs: number; consumedTimeBytesRoot: LabRoot; decisionRoot: LabRoot; custodyRoot: LabRoot; root: LabRoot }
export const validateLeanFreshSupervisorConsumedAccounting = (value: unknown) => {
  if (!exactLabKeys(value, ["allocationRoot", "rawRoots", "charged", "currentCharges", "elapsedMs", "active", "resultExists", "terminalStatus", "exitCode", "signal", "verifierIds", "readerCloseMs"])) return fail("FRESH_HISTORY")
  const v = value as Record<string, unknown>, c = LEAN_FRESH_SUPERVISOR_CARRY
  if (!same(v.rawRoots, { allocation: c.allocationBytesRoot, entry: c.entryBytesRoot, terminal: c.terminalBytesRoot, reason: c.reasonBytesRoot, failure: c.failureBytesRoot, time: c.timeBytesRoot }) || v.allocationRoot !== c.allocationRoot || v.charged !== c.charged || v.currentCharges !== 0 || v.elapsedMs !== c.closedElapsedMs || v.active !== false || v.resultExists !== false || v.terminalStatus !== "child_failed" || v.exitCode !== 1 || v.signal !== null || !same(v.verifierIds, ["correction-supervisor-diagnostic-v2-terminal-verifier"]) || v.readerCloseMs !== c.readerCloseMs) return fail("FRESH_HISTORY")
  return { charged: c.charged, elapsedUpperBoundMs: c.closedElapsedMs + c.completionUpperMs - c.readerCloseMs }
}
/** Wall-clock upper bound from independently retained app custody. Never a
 * fabricated past monotonic clock, an old acceptance, or a refunded interval. */
export const validateLeanFreshSupervisorSetupWitness = (value: unknown, decisionRoot: LabRoot, custodyRoot: LabRoot): FreshSetupWitness => {
  if (!exactLabKeys(value, ["schemaVersion", "startedAtMs", "observedAtMs", "source", "threadId", "turnId", "previousTurnId", "priorCompletionUpperMs", "priorCheckCloseMs", "priorRepairMs", "consumedTimeBytesRoot", "decisionRoot", "custodyRoot", "root"])) return fail("SETUP_WITNESS")
  const v = value as unknown as FreshSetupWitness, { root: r, ...body } = v, c = LEAN_FRESH_SUPERVISOR_CARRY
  if (v.schemaVersion !== "lean-supervisor-setup-witness-v3" || v.startedAtMs !== c.setupStartMs || !Number.isSafeInteger(v.observedAtMs) || v.observedAtMs < v.startedAtMs || v.source !== "codex-app-read-thread" || v.threadId !== "019fa652-915a-7183-9af1-3b3c05868d86" || v.turnId !== "01a10be5-f9b9-72f0-860c-31b82fc9b1b7" || v.previousTurnId !== "01a10932-a9e2-77a3-9083-229b602e9d48" || v.priorCompletionUpperMs !== c.completionUpperMs || v.priorCheckCloseMs !== c.readerCloseMs || v.priorRepairMs !== c.repairAdminMs || v.consumedTimeBytesRoot !== c.timeBytesRoot || v.decisionRoot !== decisionRoot || v.custodyRoot !== custodyRoot || !root(decisionRoot) || !root(custodyRoot) || r !== labRoot(v.schemaVersion, body)) return fail("SETUP_WITNESS")
  return v
}
/** Reopen finite consumed-v2 accounting only. Its refused check/result absence
 * cannot authorize v3. All surviving roots are counted recursively once. */
export const inspectLeanFreshSupervisorPredecessor = (route: LeanCorrectionRoute, accountingAtMs: number): LeanCorrectionPredecessor => {
  const c = LEAN_FRESH_SUPERVISOR_CARRY, paths = LEAN_SUPERVISOR_CORRECTION_ROUTES.diagnostic
  const old = openLeanLedger(paths.store), state = readLeanLedger(old), time = readLeanTimeAccounting(old), terminal = readLeanChildTerminal(old), witness = readLeanSupervisorSetupWitness("v3")
  const rawRoots = [["allocation.json", c.allocationBytesRoot], ["entry.json", c.entryBytesRoot], ["child-terminal.json", c.terminalBytesRoot], [paths.reason, c.reasonBytesRoot], ["entry-failure.json", c.failureBytesRoot], ["time.ndjson", c.timeBytesRoot]] as const
  for (const [name, expected] of rawRoots) if (leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, name), 4_194_304)) !== expected) return fail("FRESH_HISTORY")
  validateLeanFreshSupervisorConsumedAccounting({ allocationRoot: old.allocation.root, rawRoots: { allocation: rawRoots[0][1], entry: rawRoots[1][1], terminal: rawRoots[2][1], reason: rawRoots[3][1], failure: rawRoots[4][1], time: rawRoots[5][1] }, charged: state.charged, currentCharges: state.charges.size, elapsedMs: time.elapsedMs, active: time.active, resultExists: existsSync(join(old.directory, "result.json")), terminalStatus: terminal.status, exitCode: terminal.exitCode, signal: terminal.signal, verifierIds: [...time.starts.keys()].filter(id => id.includes("verifier")), readerCloseMs: time.closes.get("correction-supervisor-diagnostic-v2-terminal-verifier") })
  if (readLeanCorrectionPrivateBytes(join(old.directory, "ledger.ndjson")).length !== 0) return fail("FRESH_HISTORY")
  if (leanBytesRoot(readLeanCorrectionPrivateBytes(paths.allocation)) !== c.allocationBytesRoot || leanBytesRoot(readLeanCorrectionPrivateBytes(paths.request)) !== readLeanChildEntry(old).requestBytesRoot || readLeanSupervisorSetupWitness().root !== (old.allocation as LeanCorrectionAllocation).setupAccountingRoot) return fail("FRESH_HISTORY")
  if (!Number.isSafeInteger(accountingAtMs) || accountingAtMs < witness.observedAtMs || old.allocation.root !== c.allocationRoot || leanSupervisorAllocationMode(old.allocation) !== true || !("route" in old.allocation) || old.allocation.route !== "diagnostic" || time.active || time.elapsedMs !== c.closedElapsedMs || state.charged !== c.charged || state.charges.size !== 0 || terminal.status !== "child_failed" || terminal.exitCode !== 1 || terminal.signal !== null || existsSync(join(old.directory, "result.json")) || time.closes.get("correction-supervisor-diagnostic-v2-terminal-verifier") !== c.readerCloseMs || [...time.starts.keys()].filter(id => id.includes("verifier")).join("|") !== "correction-supervisor-diagnostic-v2-terminal-verifier") return fail("FRESH_HISTORY")
  for (const mode of ["prepare", "run"] as const) {
    const start = readLeanCorrectionJson(join(paths.temp, `admission-${mode}-start.json`)) as ReturnType<typeof beginLeanCorrectionAdmission>, closed = readLeanCorrectionJson(join(paths.temp, `admission-${mode}-close.json`)) as ReturnType<typeof closeLeanCorrectionAdmission>
    const { root: sr, ...sb } = start, { root: cr, ...cb } = closed
    if (start.schemaVersion !== "lean-correction-supervisor-admission-v2" || sr !== labRoot(start.schemaVersion, sb) || closed.schemaVersion !== "lean-correction-supervisor-admission-close-v2" || cr !== labRoot(closed.schemaVersion, cb) || closed.startRoot !== sr || start.route !== "diagnostic" || closed.route !== "diagnostic" || start.mode !== mode || closed.mode !== mode || closed.allocationRoot !== old.allocation.root || closed.elapsedUpperBoundMs !== leanCorrectionAdmissionElapsed(start, { wallStartMs: closed.wallObservedMs, monotonicStartNs: closed.monotonicObservedNs }) || !closed.ledgerInterval || !time.closed.has(closed.ledgerInterval) || time.starts.get(closed.ledgerInterval) !== start.wallStartMs + closed.importedMs || time.closes.get(closed.ledgerInterval) !== start.wallStartMs + closed.elapsedUpperBoundMs) return fail("FRESH_ADMISSION_CUSTODY")
  }
  const identities = [...old.allocation.predecessor.survivors.map(row => row.identity), paths.store, paths.request, paths.allocation, paths.temp, LEAN_SUPERVISOR_SETUP_WITNESS]
  let charged: number = c.charged, elapsed = c.priorElapsedMs + accountingAtMs - witness.startedAtMs
  const historyRoots: LabRoot[] = [old.allocation.root, ...rawRoots.map(([, r]) => r), witness.root]
  if (route === "baseline") {
    const accepted = authenticateLeanSupervisorDiagnosticCheck("v3"), current = leanCorrectionRoutePaths("diagnostic", "v3"), diagnostic = openLeanLedger(current.store), latest = readLeanTimeAccounting(diagnostic)
    if (latest.active || accountingAtMs < accepted.readerCloseMs) return fail("DIAGNOSTIC_UNCLOSED")
    charged = readLeanLedger(diagnostic).charged; elapsed = accepted.closedElapsedMs + accountingAtMs - accepted.readerCloseMs
    identities.push(current.store, current.request, current.allocation, current.temp)
    historyRoots.push(accepted.root, leanBytesRoot(readLeanCorrectionPrivateBytes(join(diagnostic.directory, "time.ndjson"), 4_194_304)))
  }
  const survivors = inventoryLeanSupervisorSurvivors([...new Set(identities)])
  const conservativeBasis = old.allocation.predecessor.allocatedDiskBytes - old.allocation.predecessor.survivors.reduce((n, s) => n + s.allocatedBytes, 0)
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: charged, elapsedUpperBoundMs: elapsed, allocatedDiskBytes: Math.max(c.physicalFloorBytes, conservativeBasis) + survivors.reduce((n, s) => n + s.allocatedBytes, 0), historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: labRoot("lean-correction-supervisor-history-v3", { roots: historyRoots, accountingAtMs }), survivors }
  return { ...body, root: labRoot(body.schemaVersion, body) }
}
/** Fixed consumed v3 is accounting only; no old audit/check is replayed. */
export const LEAN_REPAIRED_READER_CARRY = Object.freeze({
  allocationRoot: "sha256:aff06160f3852f3efd4fdc7a5ecd52b7025eda32c58e82d58e526c090fbd8cf5" as LabRoot,
  allocationBytesRoot: "sha256:adf7c4567e676abd33516b7e2e1d4b9470be041ebf1724ff7f812b8400d2f0b9" as LabRoot,
  requestBytesRoot: "sha256:78acf116c219312c10612398bd4627b6cc3b895ce833b5f038a4d8fa9731318d" as LabRoot,
  timeBytesRoot: "sha256:7a7362cf73ff72b275bf63a7d8b10f4a1b6b6b4c5c7118aabc206f2fee6f5691" as LabRoot,
  entryBytesRoot: "sha256:4d2ea625d2ace64166a97b4af37ac32bf6c0921abd340628b250a3ba43842034" as LabRoot,
  terminalBytesRoot: "sha256:d5619f5d8fd867127de5ad65924025fb4d7dadd5ecbb13139796f6b0799208b2" as LabRoot,
  resultBytesRoot: "sha256:f2597b2a0d915bc0ba8f8e47c50d93e1e0b141a6ea94bc70830070e183972244" as LabRoot,
  reasonBytesRoot: "sha256:6b767fa1895d8563c5c3661543051481622d076dfab8ae2e70ba9743a316dba7" as LabRoot,
  ledgerBytesRoot: "sha256:1de871e9d23738fffbb9f01782da21d09e743ba7631548eccd07ca333d72f67a" as LabRoot,
  runCloseBytesRoot: "sha256:875182f89c5bc4de57390fd29e2f1a8d309fee86f2ffa260525959e19926d7a4" as LabRoot,
  charged: 12, closedElapsedMs: 14939187, priorElapsedMs: 20471046, physicalFloorBytes: 4231168,
  setupStartMs: 1791225186000,
})
export const validateLeanRepairedReaderConsumedAccounting = (value: unknown) => {
  const c = LEAN_REPAIRED_READER_CARRY
  if (!exactLabKeys(value, ["allocationRoot", "rawRoots", "charged", "currentCharges", "elapsedMs", "active", "terminalStatus", "exitCode", "signal", "verifierIds", "checkExists", "failureExists"])) return fail("FRESH_HISTORY")
  const v = value as Record<string, unknown>
  if (!same(v.rawRoots, { allocation: c.allocationBytesRoot, request: c.requestBytesRoot, time: c.timeBytesRoot, entry: c.entryBytesRoot, terminal: c.terminalBytesRoot, result: c.resultBytesRoot, reason: c.reasonBytesRoot, ledger: c.ledgerBytesRoot, runClose: c.runCloseBytesRoot }) || v.allocationRoot !== c.allocationRoot || v.charged !== c.charged || v.currentCharges !== 1 || v.elapsedMs !== c.closedElapsedMs || v.active !== false || v.terminalStatus !== "child_exited" || v.exitCode !== 0 || v.signal !== null || !same(v.verifierIds, ["correction-supervisor-diagnostic-v3-verifier"]) || v.checkExists !== false || v.failureExists !== false) return fail("FRESH_HISTORY")
  return { charged: c.charged, elapsedUpperBoundMs: c.priorElapsedMs }
}
type RepairedSetupWitness = { schemaVersion: "lean-supervisor-setup-witness-v4"; startedAtMs: number; observedAtMs: number; source: string; threadId: string; turnId: string; previousTurnId: string; priorElapsedMs: number; consumedTimeBytesRoot: LabRoot; decisionRoot: LabRoot; custodyRoot: LabRoot; root: LabRoot }
export const validateLeanRepairedReaderSetupWitness = (value: unknown, decisionRoot: LabRoot): RepairedSetupWitness => {
  if (!exactLabKeys(value, ["schemaVersion", "startedAtMs", "observedAtMs", "source", "threadId", "turnId", "previousTurnId", "priorElapsedMs", "consumedTimeBytesRoot", "decisionRoot", "custodyRoot", "root"])) return fail("SETUP_WITNESS")
  const v = value as unknown as RepairedSetupWitness, { root: r, ...body } = v, c = LEAN_REPAIRED_READER_CARRY
  if (v.schemaVersion !== "lean-supervisor-setup-witness-v4" || v.startedAtMs !== c.setupStartMs || !Number.isSafeInteger(v.observedAtMs) || v.observedAtMs < v.startedAtMs || v.source !== "codex-app-read-thread" || v.threadId !== "019fa652-915a-7183-9af1-3b3c05868d86" || v.turnId !== "01a10d57-49be-78f0-9475-836f26e7ff9c" || v.previousTurnId !== "01a10cbd-cb18-7991-8426-5c82c2e8b1fe" || v.priorElapsedMs !== c.priorElapsedMs || v.consumedTimeBytesRoot !== c.timeBytesRoot || !root(decisionRoot) || v.decisionRoot !== decisionRoot || v.custodyRoot !== decisionRoot || r !== labRoot(v.schemaVersion, body)) return fail("SETUP_WITNESS")
  return v
}
export const inspectLeanRepairedReaderPredecessor = (route: LeanCorrectionRoute, accountingAtMs: number): LeanCorrectionPredecessor => {
  const c = LEAN_REPAIRED_READER_CARRY, paths = leanCorrectionRoutePaths("diagnostic", "v3"), old = openLeanLedger(paths.store)
  if (!("route" in old.allocation) || old.allocation.route !== "diagnostic" || leanSupervisorAllocationMode(old.allocation) !== "v3") return fail("FRESH_HISTORY")
  const oldAllocation = old.allocation
  const time = readLeanTimeAccounting(old), state = readLeanLedger(old), terminal = readLeanChildTerminal(old), witness = readLeanSupervisorSetupWitness("v4")
  const raw = { allocation: leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, "allocation.json"))), request: leanBytesRoot(readLeanCorrectionPrivateBytes(paths.request)), time: leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, "time.ndjson"), 4_194_304)), entry: leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, "entry.json"))), terminal: leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, "child-terminal.json"))), result: leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, "result.json"), 8_388_608)), reason: leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, "parent-supervisor-reasons.json"))), ledger: leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, "ledger.ndjson"), 4_194_304)), runClose: leanBytesRoot(readLeanCorrectionPrivateBytes(join(paths.temp, "admission-run-close.json"))) }
  validateLeanRepairedReaderConsumedAccounting({ allocationRoot: old.allocation.root, rawRoots: raw, charged: state.charged, currentCharges: state.charges.size, elapsedMs: time.elapsedMs, active: time.active, terminalStatus: terminal.status, exitCode: terminal.exitCode, signal: terminal.signal, verifierIds: [...time.starts.keys()].filter(id => id.includes("verifier")), checkExists: existsSync(join(old.directory, paths.check)), failureExists: existsSync(join(old.directory, "entry-failure.json")) })
  if (leanSupervisorAllocationMode(old.allocation) !== "v3" || leanBytesRoot(readLeanCorrectionPrivateBytes(paths.allocation)) !== c.allocationBytesRoot || !state.stopped || !Number.isSafeInteger(accountingAtMs) || accountingAtMs < witness.observedAtMs) return fail("FRESH_HISTORY")
  const identities = [...oldAllocation.predecessor.survivors.map(row => row.identity), paths.store, paths.request, paths.allocation, paths.temp, LEAN_FRESH_SUPERVISOR_SETUP_WITNESS, ".strategy-lab/lean-saved-evidence-diagnostic-20261005-v1-entry.json", ".strategy-lab/lean-saved-evidence-diagnostic-20261005-v1-result.json"]
  let charged: number = c.charged, elapsed = c.priorElapsedMs + accountingAtMs - witness.startedAtMs
  const roots: LabRoot[] = [old.allocation.root, ...Object.values(raw), witness.root]
  if (route === "baseline") {
    const accepted = authenticateLeanSupervisorDiagnosticCheck("v4"), current = leanCorrectionRoutePaths("diagnostic", "v4"), diagnostic = openLeanLedger(current.store), latest = readLeanTimeAccounting(diagnostic)
    if (latest.active || accountingAtMs < accepted.readerCloseMs) return fail("DIAGNOSTIC_UNCLOSED")
    charged = readLeanLedger(diagnostic).charged; elapsed = accepted.closedElapsedMs + accountingAtMs - accepted.readerCloseMs
    identities.push(current.store, current.request, current.allocation, current.temp)
    roots.push(accepted.root, leanBytesRoot(readLeanCorrectionPrivateBytes(join(diagnostic.directory, "time.ndjson"), 4_194_304)))
  }
  const survivors = inventoryLeanSupervisorSurvivors([...new Set(identities)])
  const conservativeBasis = oldAllocation.predecessor.allocatedDiskBytes - oldAllocation.predecessor.survivors.reduce((n, s) => n + s.allocatedBytes, 0)
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: charged, elapsedUpperBoundMs: elapsed, allocatedDiskBytes: Math.max(c.physicalFloorBytes, conservativeBasis) + survivors.reduce((n, s) => n + s.allocatedBytes, 0), historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: labRoot("lean-correction-supervisor-history-v4", { roots, accountingAtMs }), survivors }
  return { ...body, root: labRoot(body.schemaVersion, body) }
}
const supervisorPostPreparationClock = (directory: string, supervisor: true | "v3" | "v4" | "v5" | "v6" | "v7" | LeanRetryMode = true): AdmissionClock => {
  const start = readLeanCorrectionJson(join(directory, "admission-prepare-start.json")) as ReturnType<typeof beginLeanCorrectionAdmission>
  const closed = readLeanCorrectionJson(join(directory, "admission-prepare-close.json")) as ReturnType<typeof closeLeanCorrectionAdmission>
  const { root: startRoot, ...startBody } = start, { root: closeRoot, ...closeBody } = closed
  if (isLeanRetryMode(supervisor) && (start.attemptOrdinal !== leanRetryOrdinal(supervisor) || ("attemptOrdinal" in closed && closed.attemptOrdinal !== leanRetryOrdinal(supervisor))) || start.schemaVersion !== `lean-correction-supervisor-admission-v${leanSupervisorVersion(supervisor)}` || startRoot !== labRoot(start.schemaVersion, startBody) || closed.schemaVersion !== `lean-correction-supervisor-admission-close-v${leanSupervisorVersion(supervisor)}` || closeRoot !== labRoot(closed.schemaVersion, closeBody) || closed.startRoot !== start.root || closed.mode !== "prepare" || closed.allocationRoot === null || closed.elapsedUpperBoundMs !== leanCorrectionAdmissionElapsed(start, { wallStartMs: closed.wallObservedMs, monotonicStartNs: closed.monotonicObservedNs })) return fail("PREPARATION_CLOSURE")
  return { wallStartMs: closed.wallObservedMs, monotonicStartNs: closed.monotonicObservedNs }
}
export const LEAN_STARTUP_CARRY_V5 = Object.freeze({ charged: 23, priorElapsedMs: 26_634_447, startedAtMs: 1791235144280, readerCloseMs: 1791229625398, closedElapsedMs: 24_910_444, physicalFloorBytes: 9_617_408, allocationRoot: "sha256:229b7738fae7459489a2a6c7126b92c518db89755357bce32b769c435f2b2499" as LabRoot })
/** New reviewed custody may exclude human idle only by closing the preceding active interval. */
export const validateLeanStartupSetupWitnessV5 = (value: unknown) => {
  if (!exactLabKeys(value, ["schemaVersion", "approvalRoot", "supplementRoot", "policyRoot", "priorElapsedMs", "charged", "segments", "consumedTimeBytesRoot", "root"])) return fail("SETUP_WITNESS")
  const v = value as { schemaVersion: string; approvalRoot: LabRoot; supplementRoot: LabRoot; policyRoot: LabRoot; priorElapsedMs: number; charged: number; segments: Array<{ startMs: number; closeMs: number | null }>; consumedTimeBytesRoot: LabRoot; root: LabRoot }, { root: r, ...body } = v
  if (v.schemaVersion !== "lean-startup-setup-witness-v5" || v.approvalRoot !== LEAN_STARTUP_APPROVAL_ROOT || v.supplementRoot !== LEAN_STARTUP_SUPPLEMENT_ROOT || v.policyRoot !== LEAN_STARTUP_POLICY_V5.root || v.priorElapsedMs !== LEAN_STARTUP_CARRY_V5.priorElapsedMs || v.charged !== 23 || !root(v.consumedTimeBytesRoot) || !Array.isArray(v.segments) || !v.segments.length || v.segments.length > 100 || v.segments[0]?.startMs !== LEAN_STARTUP_CARRY_V5.startedAtMs || r !== labRoot(v.schemaVersion, body)) return fail("SETUP_WITNESS")
  let previous = 0
  for (const [i, segment] of v.segments.entries()) {
    if (!exactLabKeys(segment, ["startMs", "closeMs"]) || !Number.isSafeInteger(segment.startMs) || segment.startMs < previous || (i === v.segments.length - 1 ? segment.closeMs !== null : !Number.isSafeInteger(segment.closeMs) || segment.closeMs! < segment.startMs)) return fail("SETUP_WITNESS")
    previous = segment.closeMs ?? segment.startMs
  }
  return Object.freeze(structuredClone(v))
}
export const leanStartupCarryElapsedV5 = (witness: ReturnType<typeof validateLeanStartupSetupWitnessV5>, accountingAtMs: number): number => {
  const v = validateLeanStartupSetupWitnessV5(witness)
  if (!Number.isSafeInteger(accountingAtMs) || accountingAtMs < v.segments.at(-1)!.startMs) return fail("SUPERVISOR_ACCOUNTING_CLOCK")
  const elapsed = v.priorElapsedMs + v.segments.reduce((sum, segment) => sum + (segment.closeMs ?? accountingAtMs) - segment.startMs, 0)
  if (!Number.isSafeInteger(elapsed) || elapsed >= 43_200_000) return fail("ADMISSION_TIME")
  return elapsed
}
export const validateLeanReplaySetupWitnessV6 = (value: unknown) => {
  if (!exactLabKeys(value, ["schemaVersion", "approvalRoot", "supplementRoot", "policyRoot", "priorElapsedMs", "charged", "segments", "consumedTimeBytesRoot", "root"])) return fail("SETUP_WITNESS")
  const v = value as { schemaVersion: string; approvalRoot: LabRoot; supplementRoot: LabRoot; policyRoot: LabRoot; priorElapsedMs: number; charged: number; segments: Array<{ startMs: number; closeMs: number | null }>; consumedTimeBytesRoot: LabRoot; root: LabRoot }, { root: r, ...body } = v
  if (v.schemaVersion !== "lean-replay-setup-witness-v6" || v.approvalRoot !== LEAN_REPLAY_V6_APPROVAL_ROOT || v.supplementRoot !== LEAN_REPLAY_V6_SUPPLEMENT_ROOT || v.policyRoot !== LEAN_STARTUP_POLICY_V5.root || v.priorElapsedMs !== LEAN_REPLAY_V6_CARRY.priorElapsedMs || v.charged !== 24 || v.consumedTimeBytesRoot !== LEAN_REPLAY_V6_CARRY.timeBytesRoot || !Array.isArray(v.segments) || v.segments.length !== 1 || !exactLabKeys(v.segments[0], ["startMs", "closeMs"]) || v.segments[0].startMs !== LEAN_REPLAY_V6_CARRY.startedAtMs || v.segments[0].closeMs !== null || r !== labRoot(v.schemaVersion, body)) return fail("SETUP_WITNESS")
  return Object.freeze(structuredClone(v))
}
export const leanReplayCarryElapsedV6 = (witness: ReturnType<typeof validateLeanReplaySetupWitnessV6>, accountingAtMs: number): number => {
  const v = validateLeanReplaySetupWitnessV6(witness)
  if (!Number.isSafeInteger(accountingAtMs) || accountingAtMs < LEAN_REPLAY_V6_CARRY.startedAtMs) return fail("SUPERVISOR_ACCOUNTING_CLOCK")
  const elapsed = v.priorElapsedMs + accountingAtMs - LEAN_REPLAY_V6_CARRY.startedAtMs
  if (!Number.isSafeInteger(elapsed) || elapsed >= 43_200_000) return fail("ADMISSION_TIME")
  return elapsed
}
export const validateLeanReplaySetupWitnessV7 = (value: unknown) => {
  if (!exactLabKeys(value, ["schemaVersion", "approvalRoot", "supplementRoot", "policyRoot", "priorElapsedMs", "charged", "segments", "consumedTimeBytesRoot", "root"])) return fail("SETUP_WITNESS")
  const v = value as { schemaVersion: string; approvalRoot: LabRoot; supplementRoot: LabRoot; policyRoot: LabRoot; priorElapsedMs: number; charged: number; segments: Array<{ startMs: number; closeMs: number | null }>; consumedTimeBytesRoot: LabRoot; root: LabRoot }, { root: r, ...body } = v
  if (v.schemaVersion !== "lean-replay-setup-witness-v7" || v.approvalRoot !== LEAN_REPLAY_V7_APPROVAL_ROOT || v.supplementRoot !== LEAN_REPLAY_V7_SUPPLEMENT_ROOT || v.policyRoot !== LEAN_REPLAY_V7_POLICY.bytesRoot || v.priorElapsedMs !== LEAN_REPLAY_V7_CARRY.priorElapsedMs || v.charged !== 28 || v.consumedTimeBytesRoot !== LEAN_REPLAY_V7_CARRY.roots.time || !Array.isArray(v.segments) || v.segments.length !== 1 || !exactLabKeys(v.segments[0], ["startMs", "closeMs"]) || v.segments[0].startMs !== LEAN_REPLAY_V7_CARRY.startedAtMs || v.segments[0].closeMs !== null || r !== labRoot(v.schemaVersion, body)) return fail("SETUP_WITNESS")
  return Object.freeze(structuredClone(v))
}
export const leanReplayCarryElapsedV7 = (witness: ReturnType<typeof validateLeanReplaySetupWitnessV7>, accountingAtMs: number): number => {
  const v = validateLeanReplaySetupWitnessV7(witness)
  if (!Number.isSafeInteger(accountingAtMs) || accountingAtMs < LEAN_REPLAY_V7_CARRY.startedAtMs) return fail("SUPERVISOR_ACCOUNTING_CLOCK")
  const elapsed = v.priorElapsedMs + accountingAtMs - LEAN_REPLAY_V7_CARRY.startedAtMs
  if (!Number.isSafeInteger(elapsed) || elapsed >= 57_600_000) return fail("ADMISSION_TIME")
  return elapsed
}
/** Uses the authenticated new diagnostic's final close, never its report time. */
export const leanReplayDiagnosticCarryV7 = (accepted: ReturnType<typeof authenticateLeanSupervisorDiagnosticCheck>, diagnostic: LeanExperimentLedger, accountingAtMs: number) => {
  const latest = readLeanTimeAccounting(diagnostic)
  if (leanSupervisorAllocationMode(diagnostic.allocation) !== "v7" || !("route" in diagnostic.allocation) || diagnostic.allocation.route !== "diagnostic" || accepted.allocationRoot !== diagnostic.allocation.root || latest.active || !Number.isSafeInteger(accountingAtMs) || accountingAtMs < accepted.readerCloseMs || latest.closes.get("correction-supervisor-diagnostic-v7-reader-close") !== accepted.readerCloseMs || latest.elapsedMs !== accepted.closedElapsedMs || readLeanLedger(diagnostic).charged !== 29) return fail("DIAGNOSTIC_UNCLOSED")
  return { charged: 29, elapsedMs: accepted.closedElapsedMs + accountingAtMs - accepted.readerCloseMs }
}
export const inspectLeanReplayPredecessorV7 = (route: LeanCorrectionRoute, accountingAtMs: number): LeanCorrectionPredecessor => {
  const c = LEAN_REPLAY_V7_CARRY, oldPaths = leanCorrectionRoutePaths("baseline", "v6"), old = openLeanLedger(oldPaths.store), witness = readLeanSupervisorSetupWitness("v7") as ReturnType<typeof validateLeanReplaySetupWitnessV7>
  const time = readLeanTimeAccounting(old), state = readLeanLedger(old)
  const rawRoots = Object.fromEntries(Object.entries(c.roots).map(([key]) => [key, leanBytesRoot(readLeanCorrectionPrivateBytes(key === "request" ? oldPaths.request : join(old.directory, key === "allocation" ? "allocation.json" : key === "ledger" || key === "time" ? key + ".ndjson" : key === "entry" ? "entry.json" : key === "terminal" ? "child-terminal.json" : "parent-supervisor-reasons.json"), 4194304))]))
  if (leanBytesRoot(readLeanCorrectionPrivateBytes(oldPaths.allocation)) !== c.roots.allocation || leanSupervisorAllocationMode(old.allocation) !== "v6" || !("route" in old.allocation) || old.allocation.route !== "baseline") return fail("FRESH_HISTORY")
  const pending = [...state.charges.values()].filter(charge => !state.terminals.has(charge.root))
  validateLeanReplayV7PredecessorCustody({ allocationRoot: old.allocation.root, rawRoots, charged: state.charged, currentCharges: state.charges.size, currentTerminals: state.terminals.size, nonterminalOrdinal: pending.length === 1 ? pending[0]!.ordinal : null, stopped: state.stopped, resultExists: existsSync(join(old.directory, "result.json")), closedElapsedMs: time.closedElapsedMs, effectiveCloseMs: Math.max(...time.closes.values()), active: time.active })
  const terminal = readLeanChildTerminal(old)
  if (terminal.status !== "child_failed" || terminal.exitCode !== 1 || terminal.signal !== null) return fail("FRESH_HISTORY")
  let elapsed = leanReplayCarryElapsedV7(witness, accountingAtMs), charged: number = c.charged
  const identities = [...old.allocation.predecessor.survivors.map(s => s.identity), oldPaths.store, oldPaths.request, oldPaths.allocation, oldPaths.temp, LEAN_REPLAY_V6_SETUP_PATH, LEAN_REPLAY_V7_SETUP_PATH]
  const roots: LabRoot[] = [old.allocation.root, witness.root, ...Object.values(rawRoots) as LabRoot[]]
  if (route === "baseline") {
    const accepted = authenticateLeanSupervisorDiagnosticCheck("v7"), p = leanCorrectionRoutePaths("diagnostic", "v7"), diagnostic = openLeanLedger(p.store)
    const carry = leanReplayDiagnosticCarryV7(accepted, diagnostic, accountingAtMs)
    elapsed = carry.elapsedMs; charged = carry.charged
    identities.push(p.store, p.request, p.allocation, p.temp); roots.push(accepted.root, accepted.bytesRoot)
  }
  const survivors = inventoryLeanSupervisorSurvivors([...new Set(identities)])
  const reserve = Math.max(0, old.allocation.predecessor.allocatedDiskBytes - old.allocation.predecessor.survivors.reduce((sum, s) => sum + s.allocatedBytes, 0))
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: charged, elapsedUpperBoundMs: elapsed, allocatedDiskBytes: Math.max(c.physicalFloorBytes, reserve + survivors.reduce((sum, s) => sum + s.allocatedBytes, 0)), historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: labRoot("lean-replay-history-v7", { roots, accountingAtMs }), survivors }
  return { ...body, root: labRoot(body.schemaVersion, body) }
}
export const leanRetryElapsedV8 = (now: number, timeboxExtension?: LeanRetryTimeboxExtension): number => {
  const carry = timeboxExtension === undefined ? LEAN_RETRY_V8_CARRY : admitLeanRetryTimeboxExtension(timeboxExtension)
  if (!Number.isSafeInteger(now) || now < carry.startedAtMs) return fail("SUPERVISOR_ACCOUNTING_CLOCK")
  return leanRetryRootElapsedFloorV8(now, timeboxExtension)
}
export const readLeanRetrySetupWitnessV8 = (mode: LeanRetryMode) => {
  const v = readLeanCorrectionJson(leanRetrySetupPath(mode)) as Record<string, unknown>, { root: claimed, ...body } = v
  const extension = Object.hasOwn(v, "timeboxExtension") ? admitLeanRetryTimeboxExtension(v.timeboxExtension) : undefined
  const carry = extension ?? LEAN_RETRY_V8_CARRY
  if (extension) assertLeanRetryExtensionDocumentsV8(extension, mode)
  if (!exactLabKeys(v, [...(extension ? ["timeboxExtension"] : []), "schemaVersion", "attemptOrdinal", "startedAtMs", "observedAtMs", "priorElapsedMs", "consumedTimeBytesRoot", "decisionRoot", "threadId", "turnId", "source", "root"]) || v.schemaVersion !== "lean-retry-setup-witness-v8" || v.attemptOrdinal !== leanRetryOrdinal(mode) || v.startedAtMs !== carry.startedAtMs || v.priorElapsedMs !== carry.priorElapsedMs || v.consumedTimeBytesRoot !== LEAN_RETRY_V8_CARRY.timeBytesRoot || v.decisionRoot !== (extension?.approvalRoot ?? LEAN_RETRY_V8_APPROVAL_ROOT) || v.threadId !== "019fa652-915a-7183-9af1-3b3c05868d86" || v.turnId !== (extension?.turnId ?? "01a111c1-6f91-7310-870d-056b2d77194f") || v.source !== "codex-task-event-custody" || !Number.isSafeInteger(v.observedAtMs) || Number(v.observedAtMs) < carry.startedAtMs || claimed !== labRoot(String(v.schemaVersion), body)) return fail("SETUP_WITNESS")
  return v as unknown as { root: LabRoot; observedAtMs: number; startedAtMs: number; timeboxExtension?: LeanRetryTimeboxExtension }
}
/** Source-only finite old bytes; no historical reader or private trace opens. */
/** Exact finite sealed failure records only; never invokes a consumed reader. */
export const readLeanRetryFailedV7PrefixV8 = () => {
  const oldPaths = leanCorrectionRoutePaths("diagnostic", "v7"), old = openLeanLedger(oldPaths.store), time = readLeanTimeAccounting(old), state = readLeanLedger(old)
  if (!("route" in old.allocation) || old.allocation.route !== "diagnostic" || leanSupervisorAllocationMode(old.allocation) !== "v7") return fail("FRESH_HISTORY")
  const pinned = { "allocation.json": LEAN_RETRY_V8_CARRY.allocationBytesRoot, "time.ndjson": LEAN_RETRY_V8_CARRY.timeBytesRoot, "ledger.ndjson": "sha256:49982e82a3e6d10367001ed1c230932e14ec221b1c3fda1021fa7e99748212ee", "entry.json": "sha256:3a44a08ce6bd68fbc118df64294385f44dd47cf753deb13709d9674deabb6414", "child-terminal.json": "sha256:84776b6e1d776eb2a158324004eccdd3d48d325dac71ba6e3b188ebbf9975f6b", "result.json": "sha256:28d762f61dc06d0596e582b17334c2a5f12db24e17d89e8f08552d9f7434f66e" }
  for (const [name, expected] of Object.entries(pinned)) if (leanBytesRoot(readLeanCorrectionPrivateBytes(join(oldPaths.store, name), 4194304)) !== expected) return fail("FRESH_HISTORY")
  if (leanBytesRoot(readLeanCorrectionPrivateBytes(oldPaths.allocation)) !== LEAN_RETRY_V8_CARRY.allocationBytesRoot || time.active || time.elapsedMs !== 47361631 || time.closes.get("correction-supervisor-diagnostic-v7-reader-close") !== 1791295466715 || state.charged !== 29 || !state.stopped || state.charges.size !== 1 || state.terminals.size !== 1 || [...state.terminals.values()].some(t => t.record.code !== "CLEANUP" || t.record.cleanupComplete !== false || t.record.classification !== "system_failure") || existsSync(join(oldPaths.store, oldPaths.check))) return fail("FRESH_HISTORY")
  const extraPins = [[oldPaths.request, "sha256:6bd2890bca333f4afecc2af5a6ab22ea7a3c9e3ee10e21a3f1304144a17076d8"], [join(oldPaths.store, "parent-supervisor-reasons.json"), "sha256:0d435d573c869946f572359b9e84aaf5faf292ad1c6d924ca217faa9aefe7651"], [join(oldPaths.temp, "admission-run-close.json"), "sha256:f02a8b28ecdf9fca49591d9c71f3fa0826bb02d43a14a7936fd21a153369f3d0"]] as const
  for (const [path, expected] of extraPins) if (leanBytesRoot(readLeanCorrectionPrivateBytes(path)) !== expected) return fail("FRESH_HISTORY")
  return { oldPaths, old, time, state, pinned, extraPins }
}
export const inspectLeanRetryPredecessorV8 = (route: LeanCorrectionRoute, atMs: number, mode: LeanRetryMode): LeanCorrectionPredecessor => {
  const { oldPaths, old, pinned, extraPins } = readLeanRetryFailedV7PrefixV8()
  if (!("route" in old.allocation)) return fail("FRESH_HISTORY")
  const witness = readLeanRetrySetupWitnessV8(mode)
  if (atMs < witness.observedAtMs) return fail("SUPERVISOR_ACCOUNTING_CLOCK")
  const n = leanRetryOrdinal(mode), identities = [...old.allocation.predecessor.survivors.map(s => s.identity), oldPaths.store, oldPaths.temp, oldPaths.request, oldPaths.allocation, LEAN_REPLAY_V7_SETUP_PATH, leanRetrySetupPath(mode)]
  const historical = isLeanBookkeepingContinuationV8(witness.timeboxExtension) ? authenticateLeanBookkeepingPredecessorV8() : null
  if (historical && n !== 2) return fail("DIAGNOSTIC_CUSTODY")
  let charged = 29, elapsed = leanRetryElapsedV8(atMs, witness.timeboxExtension)
  const roots: unknown[] = [pinned, extraPins, witness.root]
  if (historical) { identities.push(...historical.identities); roots.push(historical.baseline.root) }
  for (let i = 1; i < n || route === "baseline" && i <= n; i++) {
    const priorMode = `v8-${i}` as LeanRetryMode, paths = leanCorrectionRoutePaths("diagnostic", priorMode)
    const historicalPrefix = historical !== null && i === 1
    const closed = historicalPrefix ? historical.diagnostic : authenticateLeanRetryClosureV8(priorMode)
    if (!historicalPrefix && !same(closed.timeboxExtension ?? null, witness.timeboxExtension ?? null)) return fail("DIAGNOSTIC_CUSTODY")
    if (!historicalPrefix && existsSync(paths.store) && readLeanTimeAccounting(openLeanLedger(paths.store)).active || closed.readerCloseMs > atMs || !historicalPrefix && closed.closureClass === "accepted" && (route !== "baseline" || i !== n) || route === "baseline" && i === n && closed.closureClass !== "accepted") return fail("DIAGNOSTIC_CUSTODY")
    charged = closed.cumulativeCharged
    elapsed = Math.max(elapsed, leanRetryClosedPrefixFloorV8(closed.closedElapsedMs, closed.readerCloseMs, atMs, i, witness.timeboxExtension))
    identities.push(...[paths.store, paths.temp, paths.request, paths.allocation, leanRetrySetupPath(priorMode)].filter(path => existsSync(path)))
    roots.push(closed.root, closed.timeBytesRoot)
  }
  for (const i of [1, 2, 3] as const) {
    const paths = leanCorrectionRoutePaths("baseline", `v8-${i}`)
    if (historical && i === 1) continue // Exact authenticated failed destination remains inventoried above.
    if ((route !== "baseline" || i !== n) && (existsSync(paths.store) || existsSync(paths.allocation) || (existsSync(join(paths.temp, "admission-run-start.json")) || existsSync(join(paths.temp, "admission-prepare-start.json"))))) return fail("SPENT_DESTINATION")
    if (i > n) { const future = leanCorrectionRoutePaths("diagnostic", `v8-${i}`); if (existsSync(future.store) || existsSync(future.allocation) || (existsSync(join(future.temp, "admission-run-start.json")) || existsSync(join(future.temp, "admission-prepare-start.json")))) return fail("SPENT_DESTINATION") }
  }
  const survivors = inventoryLeanSupervisorSurvivors([...new Set(identities)])
  const reserve = Math.max(0, old.allocation.predecessor.allocatedDiskBytes - old.allocation.predecessor.survivors.reduce((sum, s) => sum + s.allocatedBytes, 0))
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: charged, elapsedUpperBoundMs: elapsed, allocatedDiskBytes: Math.max(old.allocation.predecessor.allocatedDiskBytes, reserve + survivors.reduce((sum, s) => sum + s.allocatedBytes, 0)), historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: labRoot("lean-retry-history-v8", { n, route, roots, atMs }), survivors }
  return { ...body, root: labRoot(body.schemaVersion, body) }
}
export const inspectLeanStartupPredecessorV5 = (route: LeanCorrectionRoute, accountingAtMs: number): LeanCorrectionPredecessor => {
  const oldPaths = leanCorrectionRoutePaths("baseline", "v4"), old = openLeanLedger(oldPaths.store), witness = readLeanSupervisorSetupWitness("v5") as ReturnType<typeof validateLeanStartupSetupWitnessV5>
  if (!("route" in old.allocation) || old.allocation.root !== LEAN_STARTUP_CARRY_V5.allocationRoot || old.allocation.route !== "baseline") return fail("FRESH_HISTORY")
  const oldTime = readLeanTimeAccounting(old), oldState = readLeanLedger(old)
  if (oldTime.active || oldTime.elapsedMs !== LEAN_STARTUP_CARRY_V5.closedElapsedMs || oldState.charged !== 23 || !oldState.stopped || leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, "time.ndjson"), 4194304)) !== witness.consumedTimeBytesRoot) return fail("FRESH_HISTORY")
  readLeanChildTerminal(old)
  let elapsed = leanStartupCarryElapsedV5(witness, accountingAtMs), charged = 23
  const identities = [...old.allocation.predecessor.survivors.map(s => s.identity), oldPaths.store, oldPaths.request, oldPaths.allocation, oldPaths.temp, LEAN_STARTUP_V5_SETUP_PATH]
  const roots: LabRoot[] = [old.allocation.root, witness.root]
  if (route === "baseline") {
    const accepted = authenticateLeanSupervisorDiagnosticCheck("v5"), p = leanCorrectionRoutePaths("diagnostic", "v5"), diagnostic = openLeanLedger(p.store), time = readLeanTimeAccounting(diagnostic)
    if (time.active || accountingAtMs < accepted.readerCloseMs || accepted.closedElapsedMs < elapsed - (accountingAtMs - LEAN_STARTUP_CARRY_V5.startedAtMs)) return fail("DIAGNOSTIC_UNCLOSED")
    elapsed = accepted.closedElapsedMs + accountingAtMs - accepted.readerCloseMs; charged = readLeanLedger(diagnostic).charged
    identities.push(p.store, p.request, p.allocation, p.temp); roots.push(accepted.root)
  }
  const survivors = inventoryLeanSupervisorSurvivors([...new Set(identities)])
  const reserve = Math.max(0, old.allocation.predecessor.allocatedDiskBytes - old.allocation.predecessor.survivors.reduce((sum, s) => sum + s.allocatedBytes, 0))
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: charged, elapsedUpperBoundMs: elapsed, allocatedDiskBytes: Math.max(LEAN_STARTUP_CARRY_V5.physicalFloorBytes, reserve + survivors.reduce((sum, s) => sum + s.allocatedBytes, 0)), historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: labRoot("lean-startup-history-v5", { roots, accountingAtMs }), survivors }
  return { ...body, root: labRoot(body.schemaVersion, body) }
}
/** Carry every predecessor survivor and cost. This inventory reads bytes/counters,
 * never calls a historical empirical reader or a cold builder. */
export const inspectLeanReplayPredecessorV6 = (route: LeanCorrectionRoute, accountingAtMs: number): LeanCorrectionPredecessor => {
  const oldPaths = leanCorrectionRoutePaths("baseline", "v5"), old = openLeanLedger(oldPaths.store), witness = readLeanSupervisorSetupWitness("v6") as ReturnType<typeof validateLeanReplaySetupWitnessV6>
  if (!("route" in old.allocation) || old.allocation.root !== LEAN_REPLAY_V6_CARRY.allocationRoot || old.allocation.route !== "baseline") return fail("FRESH_HISTORY")
  const oldTime = readLeanTimeAccounting(old), oldState = readLeanLedger(old)
  if (oldTime.active || oldTime.elapsedMs !== LEAN_REPLAY_V6_CARRY.closedElapsedMs || oldState.charged !== 24 || leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, "time.ndjson"), 4194304)) !== witness.consumedTimeBytesRoot) return fail("FRESH_HISTORY")
  readLeanChildTerminal(old)
  validateLeanReplayV6PredecessorCustody({ allocationRoot: old.allocation.root, allocationBytesRoot: leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, "allocation.json"), 4194304)), timeBytesRoot: leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, "time.ndjson"), 4194304)), terminalBytesRoot: leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, "child-terminal.json"), 65536)), ledgerBytesRoot: leanBytesRoot(readLeanCorrectionPrivateBytes(join(old.directory, "ledger.ndjson"), 4194304)), charged: oldState.charged, closedElapsedMs: oldTime.closedElapsedMs, readerCloseMs: Math.max(...oldTime.closes.values()), active: oldTime.active })
  let elapsed = leanReplayCarryElapsedV6(witness, accountingAtMs), charged = 24
  const identities = [...old.allocation.predecessor.survivors.map(s => s.identity), oldPaths.store, oldPaths.request, oldPaths.allocation, oldPaths.temp, LEAN_REPLAY_V6_SETUP_PATH]
  const roots: LabRoot[] = [old.allocation.root, witness.root]
  if (route === "baseline") {
    const accepted = authenticateLeanSupervisorDiagnosticCheck("v6"), p = leanCorrectionRoutePaths("diagnostic", "v6"), diagnostic = openLeanLedger(p.store), time = readLeanTimeAccounting(diagnostic)
    if (time.active || accountingAtMs < accepted.readerCloseMs || accepted.closedElapsedMs < elapsed - (accountingAtMs - LEAN_REPLAY_V6_CARRY.startedAtMs)) return fail("DIAGNOSTIC_UNCLOSED")
    elapsed = accepted.closedElapsedMs + accountingAtMs - accepted.readerCloseMs; charged = readLeanLedger(diagnostic).charged
    identities.push(p.store, p.request, p.allocation, p.temp); roots.push(accepted.root)
  }
  const survivors = inventoryLeanSupervisorSurvivors([...new Set(identities)])
  const reserve = Math.max(0, old.allocation.predecessor.allocatedDiskBytes - old.allocation.predecessor.survivors.reduce((sum, s) => sum + s.allocatedBytes, 0))
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: charged, elapsedUpperBoundMs: elapsed, allocatedDiskBytes: Math.max(LEAN_REPLAY_V6_CARRY.physicalFloorBytes, reserve + survivors.reduce((sum, s) => sum + s.allocatedBytes, 0)), historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: labRoot("lean-replay-history-v6", { roots, accountingAtMs }), survivors }
  return { ...body, root: labRoot(body.schemaVersion, body) }
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
const scope = (route: LeanCorrectionRoute, supervisor: LeanSupervisorMode = false) => {
  const temp = resolve(leanCorrectionRoutePaths(route, supervisor).temp), stat = lstatSync(temp)
  if (supervisor && !process.execArgv.includes("--max-old-space-size=768")) return fail("COORDINATOR_HEAP_BOUND")
  if (supervisor) for (const path of [leanCorrectionRoutePaths(route, supervisor).store, leanCorrectionRoutePaths(route, supervisor).request, leanCorrectionRoutePaths(route, supervisor).allocation]) if (realpathSync(dirname(resolve(path))) !== dirname(resolve(path))) return fail("ROUTE_ALIAS")
  if (process.env.TSX_DISABLE_CACHE !== "1" || process.env.NODE_DISABLE_COMPILE_CACHE !== "1" || ["NODE_OPTIONS", "NODE_COMPILE_CACHE", "NODE_REDIRECT_WARNINGS", "NODE_V8_COVERAGE"].some(k => process.env[k] !== undefined) || process.env.TMPDIR !== temp || !stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o777) !== 0o700 || stat.uid !== process.getuid?.() || realpathSync(temp) !== temp || execFileSync("sh", ["-c", "ulimit -c"], { encoding: "utf8", timeout: 1000, maxBuffer: 128 }).trim() !== "0") return fail("WRITABLE_SCOPE")
}
/** MAIN's finite pre-ledger/pre-entry failure, never a child terminal. The
 * durable admission remains spent, including a zero-charge failure. */
export const publishLeanRetryAdmissionFailureV8 = (mode: LeanRetryMode, admissionMode: "prepare" | "run", childSpawned: boolean, cleanup: { childPid: number; exitCode: number | null; signal: string | null } | null) => {
  const paths = leanCorrectionRoutePaths("diagnostic", mode)
  const start = readLeanCorrectionJson(join(paths.temp, `admission-${admissionMode}-start.json`)) as ReturnType<typeof beginLeanCorrectionAdmission>
  const close = readLeanCorrectionJson(join(paths.temp, `admission-${admissionMode}-close.json`)) as ReturnType<typeof closeLeanCorrectionAdmission> & { attemptOrdinal: number; ledgerCloseMs: number }
  const ledger = existsSync(paths.store) ? openLeanLedger(paths.store) : null
  if (childSpawned ? !cleanup || cleanup.exitCode === null && cleanup.signal === null : cleanup !== null) return fail("ADMISSION_CUSTODY")
  if (ledger && (readLeanTimeAccounting(ledger).active || readLeanLedger(ledger).charges.size !== 0 || ["entry.json", "child-terminal.json", "result.json", paths.check].some(name => existsSync(join(paths.store, name))))) return fail("ADMISSION_CUSTODY")
  const bytesRoot = (path: string) => leanBytesRoot(readLeanCorrectionPrivateBytes(path, 4194304))
  const extension = ledger && "timeboxExtension" in ledger.allocation ? ledger.allocation.timeboxExtension : (() => { try { return readLeanRetrySetupWitnessV8(mode).timeboxExtension } catch { return undefined } })()
  const body = { ...(extension ? { timeboxExtension: admitLeanRetryTimeboxExtension(extension) } : {}), schemaVersion: "lean-retry-admission-failure-v8", authorAgent: "/root", authorizing: false, attemptOrdinal: leanRetryOrdinal(mode), admissionMode, startRoot: start.root, closeRoot: close.root, sourceRoot: leanCorrectionSourceManifest(mode, extension).root, head: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", maxBuffer: 128 }).trim(), requestBytesRoot: existsSync(paths.request) ? bytesRoot(paths.request) : null, allocationRoot: ledger?.allocation.root ?? null, ledgerBytesRoot: ledger ? bytesRoot(join(paths.store, "ledger.ndjson")) : null, timeBytesRoot: ledger ? bytesRoot(join(paths.store, "time.ndjson")) : null, currentCharges: 0, cumulativeCharged: ledger ? readLeanLedger(ledger).charged : null, storeAbsent: ledger === null, childSpawned, cleanup, entryAbsent: true, terminalAbsent: true, resultAbsent: true, acceptedCheckAbsent: true }
  const receipt = { ...body, root: labRoot(body.schemaVersion, body) }
  publishLeanCorrection(join(paths.temp, "admission-failure-v8.json"), receipt)
  return receipt
}
export const authenticateLeanRetryAdmissionFailureV8 = (mode: LeanRetryMode) => {
  const paths = leanCorrectionRoutePaths("diagnostic", mode), value = readLeanCorrectionJson(join(paths.temp, "admission-failure-v8.json")) as ReturnType<typeof publishLeanRetryAdmissionFailureV8>
  const { root: claimed, ...body } = value
  if (!exactLabKeys(value, ["schemaVersion", "authorAgent", "authorizing", "attemptOrdinal", "admissionMode", "startRoot", "closeRoot", "sourceRoot", "head", "requestBytesRoot", "allocationRoot", "ledgerBytesRoot", "timeBytesRoot", "currentCharges", "cumulativeCharged", "storeAbsent", "childSpawned", "cleanup", "entryAbsent", "terminalAbsent", "resultAbsent", "acceptedCheckAbsent", "root", ...(Object.hasOwn(value, "timeboxExtension") ? ["timeboxExtension"] : [])]) || claimed !== labRoot("lean-retry-admission-failure-v8", body) || value.schemaVersion !== "lean-retry-admission-failure-v8" || value.authorAgent !== "/root" || value.authorizing !== false || value.attemptOrdinal !== leanRetryOrdinal(mode) || !["prepare", "run"].includes(value.admissionMode) || !root(value.sourceRoot) || !/^[a-f0-9]{40}$/u.test(value.head) || value.currentCharges !== 0 || !value.entryAbsent || !value.terminalAbsent || !value.resultAbsent || !value.acceptedCheckAbsent) return fail("ADMISSION_CUSTODY")
  if (value.childSpawned ? !value.cleanup || !exactLabKeys(value.cleanup, ["childPid", "exitCode", "signal"]) || !Number.isSafeInteger(value.cleanup.childPid) || value.cleanup.childPid <= 0 || value.cleanup.exitCode === null && value.cleanup.signal === null : value.cleanup !== null) return fail("ADMISSION_CUSTODY")
  if (value.timeboxExtension) {
    const extension = admitLeanRetryTimeboxExtension(value.timeboxExtension)
    if (!same(extension, readLeanRetrySetupWitnessV8(mode).timeboxExtension) || leanCorrectionSourceManifest(mode, extension).root !== value.sourceRoot) return fail("ADMISSION_CUSTODY")
  }
  const start = readLeanCorrectionJson(join(paths.temp, `admission-${value.admissionMode}-start.json`)) as ReturnType<typeof beginLeanCorrectionAdmission>, close = readLeanCorrectionJson(join(paths.temp, `admission-${value.admissionMode}-close.json`)) as ReturnType<typeof closeLeanCorrectionAdmission> & { attemptOrdinal: number; ledgerCloseMs: number }
  const { root: sr, ...sb } = start, { root: cr, ...cb } = close
  if (!exactLabKeys(start, ["schemaVersion", "attemptOrdinal", "route", "mode", "parentPid", "wallStartMs", "monotonicStartNs", "root"]) || !exactLabKeys(close, ["schemaVersion", "attemptOrdinal", "startRoot", "route", "mode", "elapsedUpperBoundMs", "monotonicObservedNs", "wallObservedMs", "allocationRoot", "ledgerInterval", "importedMs", "ledgerCloseMs", "root"]) || start.schemaVersion !== "lean-correction-supervisor-admission-v8" || close.schemaVersion !== "lean-correction-supervisor-admission-close-v8") return fail("ADMISSION_CUSTODY")
  if (sr !== value.startRoot || sr !== labRoot("lean-correction-supervisor-admission-v8", sb) || cr !== value.closeRoot || cr !== labRoot("lean-correction-supervisor-admission-close-v8", cb) || close.startRoot !== sr || start.attemptOrdinal !== leanRetryOrdinal(mode) || close.attemptOrdinal !== start.attemptOrdinal || start.mode !== value.admissionMode || close.mode !== start.mode || start.route !== "diagnostic" || close.route !== start.route || close.elapsedUpperBoundMs !== leanCorrectionAdmissionElapsed(start, { wallStartMs: close.wallObservedMs, monotonicStartNs: close.monotonicObservedNs }) || close.ledgerCloseMs < start.wallStartMs + close.elapsedUpperBoundMs) return fail("ADMISSION_CUSTODY")
  if (existsSync(paths.store) === value.storeAbsent || ["entry.json", "child-terminal.json", "result.json", paths.check].some(name => existsSync(join(paths.store, name)))) return fail("ADMISSION_CUSTODY")
  if (value.storeAbsent) { if (value.allocationRoot !== null || value.ledgerBytesRoot !== null || value.timeBytesRoot !== null || close.allocationRoot !== null || close.ledgerInterval !== null || value.cumulativeCharged !== null || value.childSpawned) return fail("ADMISSION_CUSTODY") }
  else {
    const ledger = openLeanLedger(paths.store), state = readLeanLedger(ledger), time = readLeanTimeAccounting(ledger)
    if (state.charges.size || time.active || state.charged !== value.cumulativeCharged || ledger.allocation.root !== value.allocationRoot || !same(("timeboxExtension" in ledger.allocation ? ledger.allocation.timeboxExtension : null) ?? null, value.timeboxExtension ?? null) || close.allocationRoot !== value.allocationRoot || !close.ledgerInterval || !time.closed.has(close.ledgerInterval) || time.closes.get(close.ledgerInterval) !== close.ledgerCloseMs || value.ledgerBytesRoot !== leanBytesRoot(readLeanCorrectionPrivateBytes(join(paths.store, "ledger.ndjson"), 4194304)) || value.timeBytesRoot !== leanBytesRoot(readLeanCorrectionPrivateBytes(join(paths.store, "time.ndjson"), 4194304))) return fail("ADMISSION_CUSTODY")
  }
  if (value.requestBytesRoot !== (existsSync(paths.request) ? leanBytesRoot(readLeanCorrectionPrivateBytes(paths.request)) : null)) return fail("ADMISSION_CUSTODY")
  return { ...value, admissionCloseMs: close.ledgerCloseMs }
}
export const prepareLeanCorrection = (path: string, route: LeanCorrectionRoute, supervisor: LeanSupervisorMode = false) => {
  const paths = leanCorrectionRoutePaths(route, supervisor)
  const carrier = beginLeanCorrectionAdmission(route, "prepare", resolve(paths.temp), processAdmissionClock(), supervisor)
  let ledger: LeanExperimentLedger | null = null, completed = false
  try {
  scope(route, supervisor)
  if (supervisor && (existsSync(paths.store) || existsSync(paths.allocation))) return fail("SPENT_DESTINATION")
  const { request, reuse } = readLeanCorrectionRequest(path, route, supervisor), predecessor = supervisor ? inspectLeanSupervisorCorrectionPredecessor(route, carrier.wallStartMs, supervisor) : inspectLeanCorrectionPredecessor(route, carrier.root)
  const common = { ...(request.timeboxExtension ? { timeboxExtension: request.timeboxExtension } : {}), ...(isLeanRetryMode(supervisor) ? { attemptOrdinal: leanRetryOrdinal(supervisor), priorClosureRoot: request.priorClosureRoot, continuationRoot: request.continuationRoot, acceptedReaderCloseRoot: request.acceptedReaderCloseRoot } : {}), sourceRoot: request.sourceRoot, reviewRoot: request.reviewRoot, coldRoot: request.coldRoot, planRoot: request.planRoot, candidateRoots: request.candidateRoots, requestRoots: request.requestRoots, seed: request.seed, route, reuseGrantRoot: reuse.grant.root, predecessor }
  const allocation = supervisor ? createLeanSupervisorCorrectionAllocation({ ...common, supervisorDecisionRoot: request.supervisorDecisionRoot!, acceptedCheckRoot: request.acceptedCheckRoot!, requestBytesRoot: leanBytesRoot(leanCanonicalBytes(request)), dataReviewRoot: request.dataReviewRoot, setupAccountingRoot: request.setupAccountingRoot!, ...((supervisor === "v5" || (supervisor === "v6" || (supervisor === "v7" || isLeanRetryMode(supervisor)))) ? { startupPolicyRoot: request.startupPolicyRoot! } : {}) }, leanSupervisorVersion(supervisor)) : createLeanCorrectionAllocation({ sourceRoot: request.sourceRoot, reviewRoot: request.reviewRoot, coldRoot: request.coldRoot, planRoot: request.planRoot, candidateRoots: request.candidateRoots, requestRoots: request.requestRoots, seed: request.seed, route, reuseGrantRoot: reuse.grant.root, diagnosisRoot: request.diagnosis?.root ?? null, predecessor })
  assertLeanCorrectionAdmissionTime(predecessor.elapsedUpperBoundMs, carrier, admissionClock(), allocation)
  ledger = createLeanLedger(paths.store, allocation)
  publishLeanCorrection(paths.allocation, allocation, ledger)
  completed = true
  return { issued: false, evidenceClass: "preparation_only", route, allocationRoot: allocation.root, plannedCells: allocation.slots.length, charged: 0 }
  } finally { closeLeanCorrectionAdmission(carrier, ledger); if (!completed && route === "diagnostic" && isLeanRetryMode(supervisor)) publishLeanRetryAdmissionFailureV8(supervisor, carrier.mode, false, null) }
}
const allocationFor = (path: string, route: LeanCorrectionRoute, supervisor: LeanSupervisorMode = false) => {
  const { request, reuse } = readLeanCorrectionRequest(path, route, supervisor), ledger = openLeanLedger(leanCorrectionRoutePaths(route, supervisor).store)
  if (supervisor && "route" in ledger.allocation && (ledger.allocation.requestBytesRoot !== leanBytesRoot(leanCanonicalBytes(request)) || ledger.allocation.dataReviewRoot !== request.dataReviewRoot || ledger.allocation.setupAccountingRoot !== request.setupAccountingRoot)) return fail("ALLOCATION_REQUEST_CUSTODY")
  if (leanSupervisorAllocationMode(ledger.allocation) !== supervisor || isLeanRetryMode(supervisor) && ("attemptOrdinal" in ledger.allocation && ledger.allocation.attemptOrdinal !== request.attemptOrdinal || !("attemptOrdinal" in ledger.allocation)) || supervisor && ("supervisorDecisionRoot" in ledger.allocation && (ledger.allocation.supervisorDecisionRoot !== request.supervisorDecisionRoot || ledger.allocation.acceptedCheckRoot !== request.acceptedCheckRoot))) return fail("ALLOCATION_VERSION")
  if (!("route" in ledger.allocation) || ledger.allocation.route !== route || ledger.allocation.sourceRoot !== request.sourceRoot || ledger.allocation.reviewRoot !== request.reviewRoot || ledger.allocation.planRoot !== request.planRoot || ledger.allocation.reuseGrantRoot !== reuse.grant.root || ledger.allocation.diagnosisRoot !== (request.diagnosis?.root ?? null) || !same(ledger.allocation.requestRoots, request.requestRoots) || !same(ledger.allocation.candidateRoots, [...request.candidateRoots].sort())) return fail("ALLOCATION")
  return { request, reuse, ledger, allocation: ledger.allocation }
}
/** Actual charged publication boundary; this grants no execution authority. */
export const publishLeanCorrectionMatchEvidence = (input: {
  ledger: LeanExperimentLedger; charge: Parameters<typeof retainLeanMatch>[1]; execution: Awaited<ReturnType<typeof runLeanBaselineMatch>>
  pair: ReturnType<typeof leanBaselinePair>; bottom: { sourceRoot: LabRoot }; top: { sourceRoot: LabRoot }; origins: readonly unknown[]
  route: LeanCorrectionRoute; supervisor: LeanSupervisorMode; sourceRoot: LabRoot; hostBinding?: LeanHostFailureBindingV7
}) => {
  const { ledger, charge, execution, pair, bottom, top, origins, route, supervisor, sourceRoot, hostBinding } = input
  try {
    retainLeanMatch(ledger, charge, execution.compact, execution.replayFrames, hostBinding ? (stage, error) => { throw captureLeanHostFailureV7(stage, hostBinding, error) } : undefined)
    const { replayFrames: _frames, ...body } = execution, cell = { ...body, ordinal: charge.ordinal, slotRoot: charge.slotRoot, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot }
    const observationBody = { schemaVersion: "lean-baseline-observation-v1", pairRoot: pair.root, cell }
    publishLeanCorrection(join(ledger.directory, `observation-${charge.ordinal}.json`), { ...observationBody, root: labRoot("lean-baseline-observation-v1", observationBody) }, ledger)
    if (route === "diagnostic") {
      const originBody = { schemaVersion: isLeanRetryMode(supervisor) ? "lean-startup-origin-envelope-v7" : supervisor === "v7" ? "lean-startup-origin-envelope-v7" : supervisor === "v6" ? "lean-startup-origin-envelope-v6" : supervisor === "v5" ? "lean-startup-origin-envelope-v5" : "lean-correction-origin-envelope-v1", allocationRoot: ledger.allocation.root, sourceRoot, pairRoot: pair.root, chargeRoot: charge.root, origins }
      publishLeanCorrection(join(ledger.directory, "correction-origin.json"), { ...originBody, root: labRoot(originBody.schemaVersion, originBody) }, ledger)
    }
    return cell
  } catch (error) { if (hostBinding) throw captureLeanHostFailureV7("compact_replay_retention_publication", hostBinding, error); throw error }
}
/** Actual final stop/evidence/result catch shared with source-only fixtures. */
export const publishLeanCorrectionTerminalResult = (ledger: LeanExperimentLedger, route: LeanCorrectionRoute, supervisor: LeanSupervisorMode, request: LeanCorrectionRequest, entry: ReturnType<typeof readLeanChildEntry>, reuse: LeanColdReuse, pipeline: unknown, hostBinding?: LeanHostFailureBindingV7) => {
  try {
    stopLeanLedger(ledger, route === "diagnostic" || (pipeline as { status: string }).status !== "current_baseline_complete" ? "failure" : "complete")
    const evidence = verifyLeanEvidence(ledger)
    const body = { ...(isLeanRetryMode(supervisor) ? { attemptOrdinal: leanRetryOrdinal(supervisor) } : {}), schemaVersion: supervisor ? `lean-correction-supervisor-result-v${leanSupervisorVersion(supervisor)}` : "lean-correction-result-v1", privacy: "private_offline", issued: false, route, allocationRoot: ledger.allocation.root, sourceRoot: request.sourceRoot, requestBytesRoot: entry.requestBytesRoot, head: entry.head, reuseGrantRoot: reuse.grant.root, pipeline, evidenceRoot: evidence.root, cumulativeCharged: evidence.charged, holdoutOpened: false, formationMaterialized: false, phaseComplete: false }
    publishLeanCorrection(join(ledger.directory, "result.json"), { ...body, root: labRoot(body.schemaVersion, body) }, ledger)
    return { issued: false, route, status: "closed_pending_unique_check" }
  } catch (error) { if (hostBinding) throw captureLeanHostFailureV7("terminal_result_publication", hostBinding, error); throw error }
}
export const runLeanCorrectionChildBody = async (path: string, route: LeanCorrectionRoute, supervisor: LeanSupervisorMode = false) => {
  scope(route, supervisor)
  const { request, reuse, ledger, allocation } = allocationFor(path, route, supervisor), entry = readLeanChildEntry(ledger)
  const head = () => execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", maxBuffer: 128 }).trim()
  const committed = execFileSync("git", ["show", `HEAD:${leanCorrectionRoutePaths(route, supervisor).allocation}`], { maxBuffer: 262144 })
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
    highWater = Math.max(highWater, assertLeanCorrectionResources({ elapsedMs: currentLeanElapsedMs(ledger), charged: readLeanLedger(ledger).charged, physicalBytes: cumulativeLeanPhysicalBytes(ledger), childRss: Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024), parentRss: rss, freeBytes: Number(freeBytes), availableMemoryBytes: observeLeagueAvailableMemoryBytes() }, allocation))
    parent.assert()
  }
  const dispatch: Parameters<typeof executeLeanReusedCurrentPipeline>[0]["dispatch"] = async (slot, bottom, top, observedRole) => {
    if (head() !== entry.head || leanCorrectionSourceManifest(supervisor, request.timeboxExtension).root !== entry.sourceRoot || leanBytesRoot(readLeanCorrectionPrivateBytes(path)) !== entry.requestBytesRoot) return fail("SOURCE_HOLD")
    checkpoint(); checkpointLeanResources(ledger, currentLeanElapsedMs(ledger), highWater, LEAN_EXTERNAL_SCRATCH_RESERVE)
    const before = readLeanCorrectionPrivateBytes(join(ledger.directory, "ledger.ndjson"), 1_048_576)
    const pair = leanBaselinePair({ ordinal: slot.ordinal, slot, priorLedgerBytesRoot: leanBytesRoot(before), priorLedgerByteLength: before.length, priorCharged: readLeanLedger(ledger).charged, bottom, top })
    publishLeanCorrection(join(ledger.directory, `pair-${slot.ordinal}.json`), pair, ledger)
    checkpoint()
    const fs = statfsSync(ledger.directory, { bigint: true }), free = fs.bavail * fs.bsize
    if (free > BigInt(Number.MAX_SAFE_INTEGER)) return fail("CAPACITY")
    const charge = chargeLeanSlot(ledger, slot, { freeBytes: Number(free), availableMemoryBytes: observeLeagueAvailableMemoryBytes() })
    const hostBinding = (allocation.schemaVersion.endsWith("-v7") || allocation.schemaVersion.endsWith("-v8")) ? { route, allocationRoot: allocation.root, chargeRoot: charge.root, slotRoot: slot.root } : undefined
    if (hostBinding) activeHostBindingV7 = hostBinding
    let hostStage: Parameters<typeof captureLeanHostFailureV7>[0] = "match_composition_postprocessing"
    try {
    const origins: Array<{ metadata: LeanPrivateCorrectionOrigin; sourceRoot: LabRoot; seat: "bottom" | "top"; binding: unknown }> = []
    const execution = await runLeanBaselineMatch({ ledger, charge, slot, seed: request.seed, bottom, top, ...(observedRole === undefined ? {} : { observedRole }), checkpoint, register: parent.register, unregister: parent.unregister, correction: { reuse, ...(route === "diagnostic" ? { observe: (metadata: LeanPrivateCorrectionOrigin, sourceRoot: LabRoot, seat: "bottom" | "top", binding: unknown) => { if (origins.length >= 2) return fail("ORIGIN_LIMIT"); origins.push({ metadata: validateLeanPrivateCorrectionOrigin(metadata), sourceRoot, seat, binding }) } } : {}) } })
    hostStage = "compact_replay_retention_publication"
    const cell = publishLeanCorrectionMatchEvidence({ ledger, charge, execution, pair, bottom, top, origins, route, supervisor, sourceRoot: request.sourceRoot, ...(hostBinding ? { hostBinding } : {}) })
    checkpoint(); checkpointLeanResources(ledger, currentLeanElapsedMs(ledger), highWater, LEAN_EXTERNAL_SCRATCH_RESERVE)
    return cell
    } catch (error) { if (hostBinding) throw captureLeanHostFailureV7(hostStage, hostBinding, error); throw error }
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
    return publishLeanCorrectionTerminalResult(ledger, route, supervisor, request, entry, reuse, pipeline, activeHostBindingV7)
  } finally { process.removeListener("disconnect", disconnect); parent.disconnect() }
}
const child = async (path: string, route: LeanCorrectionRoute, supervisor: LeanSupervisorMode = false) => {
  scope(route, supervisor)
  if (!process.send || !process.connected) return fail("PARENT_LOST")
  process.send({ ready: process.pid })
  const token = await new Promise<string>((done, reject) => {
    const timer = setTimeout(() => reject(new TypeError("LEAN_CORRECTION_RELEASE")), 30000)
    process.once("message", message => { clearTimeout(timer); if (!exactLabKeys(message, ["release"]) || typeof (message as { release: unknown }).release !== "string") reject(new TypeError("LEAN_CORRECTION_RELEASE")); else done((message as { release: string }).release) })
  })
  const ledger = openLeanLedger(leanCorrectionRoutePaths(route, supervisor).store)
  admitLeanChildRelease(readLeanChildEntry(ledger), token, process.pid, process.ppid)
  return runLeanCorrectionChildBody(path, route, supervisor)
}
export const leanCorrectionChildMode = (route: LeanCorrectionRoute, supervisor: LeanSupervisorMode) => isLeanRetryMode(supervisor) ? `child-supervisor-${route}-${supervisor}` : supervisor ? `child-supervisor-${route}-v${leanSupervisorVersion(supervisor)}` : `child-${route}`
export const leanCorrectionMain = async (args: readonly string[]) => {
  const command = parseLeanCorrectionCommand(args), { route, request: path } = command, supervisor: LeanSupervisorMode = ("supervisor" in command ? command.supervisor : false) ?? false, paths = leanCorrectionRoutePaths(route, supervisor)
  if (command.mode.startsWith("prepare-")) return prepareLeanCorrection(path, route, supervisor)
  if (command.mode.startsWith("verify-terminal-") && isLeanRetryMode(supervisor)) return (await import("./lib/v1-38-lean-correction-retained.js")).verifyLeanRetryTerminalOnlyV8(path, supervisor)
  if (command.mode.startsWith("verify-") && route === "baseline" && isLeanRetryMode(supervisor)) return (await import("./lib/v1-38-lean-baseline-retained.js")).verifyLeanRetryBaselineRetainedV8(path, supervisor, () => scope(route, supervisor))
  if (command.mode.startsWith("verify-")) { if (!supervisor) scope(route); const { verifyLeanCorrectionRetained } = await import("./lib/v1-38-lean-correction-retained.js"); return verifyLeanCorrectionRetained(path, route, supervisor, supervisor ? () => scope(route, supervisor) : undefined) }
  const start = supervisor ? supervisorPostPreparationClock(paths.temp, supervisor) : processAdmissionClock()
  const carrier = beginLeanCorrectionAdmission(route, "run", resolve(paths.temp), start, supervisor)
  let accountingLedger: LeanExperimentLedger | null = null, completed = false, childSpawned = false, cleanup: { childPid: number; exitCode: number | null; signal: string | null } | null = null
  try {
  // V8's spent run admission must close against the actual prepared ledger
  // even if the following scope check refuses before any child is created.
  if (isLeanRetryMode(supervisor)) accountingLedger = openLeanLedger(paths.store)
  scope(route, supervisor)
  if (!accountingLedger) accountingLedger = openLeanLedger(paths.store)
  const { request, ledger, allocation } = allocationFor(path, route, supervisor)
  accountingLedger = ledger
  if (!same(allocation.predecessor, (supervisor ? inspectLeanSupervisorCorrectionPredecessor(route, (readLeanCorrectionJson(join(paths.temp, "admission-prepare-start.json")) as AdmissionClock).wallStartMs, supervisor) : inspectLeanCorrectionPredecessor(route, carrier.root)))) return fail("PREDECESSOR_DRIFT")
  const result = await runLeanBoundedParent({ ledger, requestPath: path, allocationPath: paths.allocation, store: resolve(paths.store), sourceRoot: request.sourceRoot, manifestRoot: () => leanCorrectionSourceManifest(supervisor, request.timeboxExtension).root, childMode: leanCorrectionChildMode(route, supervisor), ...(supervisor ? { supervisorObservation: true as const } : {}), ...(isLeanRetryMode(supervisor) ? { onChildCreated: () => { childSpawned = true }, onPreEntryCleanup: (value: { childPid: number; exitCode: number | null; signal: string | null }) => { cleanup = value } } : {}), prospectiveStart: carrier, beforeRelease: () => { assertLeanCorrectionAdmissionTime(readLeanTimeAccounting(ledger).closedElapsedMs, carrier, admissionClock(), ledger.allocation) }, terminalReserveMs: LEAN_CORRECTION_RESERVE.cleanupMs + LEAN_CORRECTION_RESERVE.terminalMs + LEAN_CORRECTION_RESERVE.checkMs + LEAN_CORRECTION_RESERVE.replayMs })
  completed = true
  return result
  } finally { closeLeanCorrectionAdmission(carrier, accountingLedger); if (!completed && route === "diagnostic" && isLeanRetryMode(supervisor) && !existsSync(join(paths.store, "entry.json"))) publishLeanRetryAdmissionFailureV8(supervisor, carrier.mode, childSpawned, cleanup) }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2), supervisor: LeanSupervisorMode = /^child-supervisor-(diagnostic|baseline)-v8-[123]$/u.test(args[0] ?? "") ? args[0]!.slice(-4) as LeanRetryMode : /^child-supervisor-(diagnostic|baseline)-v[234567]$/u.test(args[0] ?? "") ? args[0]!.endsWith("-v7") ? "v7" : args[0]!.endsWith("-v6") ? "v6" : args[0]!.endsWith("-v5") ? "v5" : args[0]!.endsWith("-v4") ? "v4" : args[0]!.endsWith("-v3") ? "v3" : true : false, childRoute = supervisor ? (args[0]!.includes("-diagnostic-") ? "diagnostic" : "baseline") : args[0] === "child-diagnostic" ? "diagnostic" : args[0] === "child-baseline" ? "baseline" : null
  const action = childRoute !== null && args.length === 3 && args[1] === "--request" && args[2] === leanCorrectionRoutePaths(childRoute, supervisor).request ? child(args[2], childRoute, supervisor) : leanCorrectionMain(args)
  if (childRoute) void resolveLeanChildCliTerminal(action, process, () => activeHostBindingV7)
  else void action.then(value => process.stdout.write(`${JSON.stringify(value)}\n`)).catch(error => { process.stderr.write(leanCorrectionCliFailure(args, error)); process.exitCode = 1 })
}
