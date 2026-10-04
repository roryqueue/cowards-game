/** One prospective, read-only reader for the private current-baseline route.
 * Historical pilot readers and their spent routes are intentionally absent. */
import { constants, closeSync, lstatSync, openSync, readFileSync, realpathSync, readdirSync, fstatSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { join, relative, resolve } from "node:path"
import { exactLabKeys, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { auditLeanTrainingVector, trainLeanInitialCandidates, trainLeanResponse, LEAN_INITIAL_TRAINING_VECTOR, LEAN_TRAINING_VECTOR, type LeanColdTrainingManifest, type LeanColdTrainingInput, type LeanLegalExample } from "../../packages/strategy-lab/src/league/lean-training.js"
import { LEAN_CAPS, LEAN_BASELINE_REQUEST, LEAN_BASELINE_STORE, LEAN_EXTERNAL_SCRATCH_RESERVE, beginLeanInterval, closeLeanInterval, currentBaselineSlotKind, currentLeanElapsedMs, cumulativeLeanPhysicalBytes, leanBytesRoot, leanCanonicalBytes, openLeanLedger, readLeanChildEntry, readLeanChildTerminal, readLeanLedger, readLeanTimeAccounting, verifyLeanEvidence, type LeanCurrentBaselineAllocation, type LeanExperimentLedger } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { analyseLeanDistinctPairs, analyseLeanResponseAdmission, selectLeanMixtureTarget, type LeanMeasuredPair } from "./v1-38-lean-baseline-analysis.js"
import { leanColdProcedureRoot, leanBaselineMetricCoverage, compactLeanBaselineCell, type LeanBaselineObservedCell } from "./v1-38-lean-baseline-pipeline.js"
import { LEAN_BASELINE_REQUIRED_METRICS } from "./v1-38-lean-baseline-metrics.js"
import { readLeanBaselineSource, type LeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { inspectLeanSealMetadata } from "./v1-38-lean-seal-metadata.js"
import { buildLeanColdCorpus } from "./v1-38-lean-cold-corpus.js"
import { buildLeanInitialProposals, selectLeanBestTrainedProposal, selectLeanTrainedProposal } from "./v1-38-lean-training-adapter.js"
import { selectPlannerActivations } from "../../packages/strategy-lab/src/planner/assign.js"
import { buildPlannerCandidate } from "../../packages/strategy-lab/src/planner/emit.js"
import { emitTacticalSource } from "../../packages/strategy-oracle-tactical/src/emit.js"
import { authenticateLeanBaselineReview, deriveLeanBaselineCandidateRoots, deriveLeanBaselineRequestRoots, leanBaselineSourceManifest } from "../run-v1-38-lean-baseline.js"

const fail = (code: string): never => { throw new TypeError(`LEAN_BASELINE_RETAINED_${code}`) }
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
const assertPairs = (s: LeanBaselineRetainedSnapshot, byRole: Map<string, LeanBaselineSource>, chargedCount: number): void => {
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
  const r = s.result, a = s.allocation, pipeline = r.pipeline as Record<string, unknown>
  assertSealMetadata(s.artifacts["seal-metadata.json"])
  if (!exactLabKeys(r, resultKeys) || r.schemaVersion !== "lean-current-baseline-result-v1" || r.issued !== false || r.evidenceClass !== "exploratory_current_only" || r.allocationRoot !== a.root || r.sourceRoot !== a.sourceRoot || r.requestBytesRoot !== s.requestBytesRoot || r.head !== s.head || r.evidenceRoot !== s.evidence.root ||
      !natural(r.charged) || !natural(r.successful) || !pipeline || typeof pipeline !== "object" || Array.isArray(pipeline) || !Array.isArray(pipeline.cells) || !Array.isArray(pipeline.sources) || !rooted(pipeline.root) ||
      pipeline.holdoutOpened !== false || pipeline.formationMaterialized !== false || r.holdoutOpened !== false || r.formationMaterialized !== false ||
      !natural(r.elapsedMs) || !natural(r.physicalHighWaterBytes) || !natural(r.scratchHighWaterBytes) || r.elapsedMs !== s.evidence.elapsedMs || r.physicalHighWaterBytes !== s.evidence.physicalHighWaterBytes || r.scratchHighWaterBytes !== s.evidence.scratchHighWaterBytes || Number(r.elapsedMs) > s.time.elapsedMs || Number(r.elapsedMs) < a.predecessor.elapsedUpperBoundMs ||
      Number(r.physicalHighWaterBytes) > LEAN_CAPS.totalBytes || Number(r.scratchHighWaterBytes) > LEAN_CAPS.scratchBytes || s.ledgerEvents.at(-1)?.kind !== "stop") return fail("RESULT")
  const { root: _root, ...pipelineBody } = pipeline
  if (pipeline.root !== labRoot("lean-current-baseline-pipeline-v1", pipelineBody)) return fail("PIPELINE_ROOT")
  const newCharges = s.evidence.records.filter(row => row.chargeRoot !== null).length
  const successful = s.evidence.records.filter(row => row.status === "success").length
  if (r.charged !== s.evidence.charged || newCharges !== s.observations.length || r.successful !== successful || s.evidence.charged !== a.predecessor.chargedMatches + newCharges || successful > newCharges) return fail("ACCOUNTING")
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
  const report = { schemaVersion: "lean-current-baseline-retained-v1" as const, allocationRoot: a.root, evidenceRoot: s.evidence.root, pipelineRoot: pipeline.root as LabRoot, head: s.head, complete, charged: s.evidence.charged, currentCharged: newCharges, successful, cumulativeElapsedMs: s.time.elapsedMs, cumulativePhysicalBytes: s.evidence.physicalHighWaterBytes, scratchHighWaterBytes: s.evidence.scratchHighWaterBytes, measurement: pipeline.measurement, claim: "no_robust_pure_claimed" as const, holdoutOpened: false as const, formationMaterialized: false as const }
  return Object.freeze({ ...report, root: labRoot("lean-current-baseline-retained-v1", report) })
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
