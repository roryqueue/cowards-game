/** New correction reader: byte/root custody and fixed schedule joins only.
 * No cold builders, authored proposal generation, search or historical reader. */
import { readdirSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { join } from "node:path"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { labRoot, exactLabKeys, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAN_CAPS, LEAN_CORRECTION_ROUTES, LEAN_SUPERVISOR_CORRECTION_ROUTES, leanCorrectionRoutePaths, leanSupervisorAllocationMode, leanSupervisorVersion, type LeanSupervisorMode, LEAN_EXTERNAL_SCRATCH_RESERVE, admitLeanAllocation, beginLeanInterval, closeLeanInterval, cumulativeLeanPhysicalBytes, currentLeanElapsedMs, openLeanLedger, readLeanChildEntry, readLeanChildTerminal, readLeanLedger, readLeanTimeAccounting, verifyLeanEvidence, currentBaselineSlotKind, leanBytesRoot, leanCanonicalBytes, type LeanCorrectionAllocation } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { auditLeanTrainingVector, type LeanColdTrainingManifest, type LeanResponseWork, type LeanResponseNodeReceipt } from "../../packages/strategy-lab/src/league/lean-training.js"
import { validateLeanColdReuse, type LeanColdReuse } from "./v1-38-lean-baseline-reuse.js"
import { readLeanBaselineSource, type LeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { compactLeanBaselineCell, leanBaselineMetricCoverage, type LeanBaselineObservedCell } from "./v1-38-lean-baseline-pipeline.js"
import { analyseLeanDistinctPairs, analyseLeanResponseAdmission, selectLeanMixtureTarget, type LeanMeasuredPair } from "./v1-38-lean-baseline-analysis.js"
import { selectLeanBestTrainedProposal, selectLeanTrainedProposal } from "./v1-38-lean-training-adapter.js"
import { validateLeanCorrectionOriginMetadata } from "./v1-38-lean-container-match-session.js"
import { leanCorrectionSourceManifest, leanCorrectionAdmissionElapsed, leanCorrectionTrustedGuardError, readLeanCorrectionPrivateBytes, readLeanCorrectionJson, readLeanCorrectionRequest, publishLeanCorrection, type LeanCorrectionRoute, type LeanCorrectionRequest } from "../run-v1-38-lean-correction.js"
import { validateLeanSupervisorReasonBytes, LEAN_SUPERVISOR_REASON_FILE, LEAN_SUPERVISOR_REASON_MAX_BYTES } from "../run-v1-38-lean-baseline.js"
import type { LeanBaselinePair } from "./v1-38-lean-experiment-authority.js"
import { SoldierBrainInputV119Schema, StrategyInputV119Schema, StrategyResultSchema } from "@cowards/spec"

const fail = (code: string): never => { throw leanCorrectionTrustedGuardError(`LEAN_CORRECTION_RETAINED_${code}`) }
const same = (a: unknown, b: unknown) => labRoot("lean-correction-retained-exact-v1", a) === labRoot("lean-correction-retained-exact-v1", b)
const rooted = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v)
interface Observation { schemaVersion: "lean-baseline-observation-v1"; pairRoot: LabRoot; cell: LeanBaselineObservedCell; root: LabRoot }
export const validateLeanSupervisorReasonJoin = (bytes: Uint8Array, entry: ReturnType<typeof readLeanChildEntry>, terminal: ReturnType<typeof readLeanChildTerminal>) => {
  const reason = validateLeanSupervisorReasonBytes(bytes)
  if (reason.uncertain || reason.reasons.length || reason.observations.resourceSampling !== "observed" || reason.observations.finalIdentity !== "matched" || reason.observations.failureReceipt !== "absent" || reason.entryBytesRoot !== leanBytesRoot(leanCanonicalBytes(entry)) || reason.allocationRoot !== entry.allocationRoot || reason.sourceRoot !== entry.sourceRoot || reason.requestBytesRoot !== entry.requestBytesRoot || reason.head !== entry.head || reason.parentPid !== entry.parentPid || reason.childPid !== entry.childPid || terminal.entryBytesRoot !== reason.entryBytesRoot || terminal.allocationRoot !== reason.allocationRoot || terminal.sourceRoot !== reason.sourceRoot || terminal.head !== reason.head || terminal.parentPid !== reason.parentPid || terminal.childPid !== reason.childPid || terminal.exitCode !== reason.exitCode || terminal.signal !== reason.signal || terminal.status !== "child_exited" || reason.exitCode !== 0 || reason.signal !== null) return fail("SUPERVISOR_REASON_CUSTODY")
  return reason
}
export interface LeanCorrectionRetainedSnapshot {
  schemaVersion: "lean-correction-supervisor-retained-snapshot-v4" | "lean-correction-retained-snapshot-v1" | "lean-correction-supervisor-retained-snapshot-v2" | "lean-correction-supervisor-retained-snapshot-v3"; supervisorReasonBytes?: Uint8Array; allocation: LeanCorrectionAllocation; request: LeanCorrectionRequest
  entry: ReturnType<typeof readLeanChildEntry>; terminal: ReturnType<typeof readLeanChildTerminal>; evidence: ReturnType<typeof verifyLeanEvidence>
  time: ReturnType<typeof readLeanTimeAccounting>; result: Record<string, unknown>; reuse: LeanColdReuse; pairs: readonly LeanBaselinePair[]
  observations: readonly Observation[]; sources: readonly LeanBaselineSource[]; artifacts: Readonly<Record<string, unknown>>; origin: Record<string, unknown> | null; journalBytes: Uint8Array
}
export const auditLeanCorrectionRetained = (value: unknown, guard: () => void = () => {}) => {
  const schema = (value as LeanCorrectionRetainedSnapshot | null)?.schemaVersion
  const supervisor: LeanSupervisorMode = schema === "lean-correction-supervisor-retained-snapshot-v4" ? "v4" : schema === "lean-correction-supervisor-retained-snapshot-v3" ? "v3" : schema === "lean-correction-supervisor-retained-snapshot-v2"
  if (!exactLabKeys(value, ["schemaVersion", "allocation", "request", "entry", "terminal", "evidence", "time", "result", "reuse", "pairs", "observations", "sources", "artifacts", "origin", "journalBytes", ...(supervisor ? ["supervisorReasonBytes"] : [])])) return fail("SNAPSHOT")
  const s = value as unknown as LeanCorrectionRetainedSnapshot, a = admitLeanAllocation(s.allocation), r = s.result
  if (!("route" in a) || leanSupervisorAllocationMode(a) !== supervisor || !supervisor && s.schemaVersion !== "lean-correction-retained-snapshot-v1") return fail("ALLOCATION")
  const reason = supervisor ? validateLeanSupervisorReasonJoin(s.supervisorReasonBytes!, s.entry, s.terminal) : null
  if (supervisor && (s.request.schemaVersion !== `lean-correction-supervisor-request-v${leanSupervisorVersion(supervisor)}` || s.request.supervisorDecisionRoot !== a.supervisorDecisionRoot || s.request.acceptedCheckRoot !== a.acceptedCheckRoot || s.request.diagnosis !== null || a.requestBytesRoot !== leanBytesRoot(leanCanonicalBytes(s.request)) || s.request.dataReviewRoot !== a.dataReviewRoot || s.request.setupAccountingRoot !== a.setupAccountingRoot)) return fail("SUPERVISOR_REQUEST")
  const reuse = validateLeanColdReuse(s.reuse, a.sourceRoot), route = a.route
  if (!same(s.request.requestRoots, a.requestRoots) || s.request.route !== route || s.request.sourceRoot !== a.sourceRoot || s.request.reuseGrantRoot !== a.reuseGrantRoot || reuse.grant.root !== a.reuseGrantRoot || s.entry.allocationRoot !== a.root || s.entry.sourceRoot !== a.sourceRoot || s.entry.requestBytesRoot !== leanBytesRoot(leanCanonicalBytes(s.request)) || s.terminal.entryBytesRoot !== leanBytesRoot(leanCanonicalBytes(s.entry)) || s.terminal.allocationRoot !== a.root || s.terminal.sourceRoot !== a.sourceRoot || s.terminal.head !== s.entry.head || s.terminal.status !== "child_exited" || s.terminal.exitCode !== 0 || s.terminal.signal !== null || s.time.active || !s.time.closed.has("pilot-entry")) return fail("CUSTODY")
  if (!exactLabKeys(r, ["schemaVersion", "privacy", "issued", "route", "allocationRoot", "sourceRoot", "requestBytesRoot", "head", "reuseGrantRoot", "pipeline", "evidenceRoot", "cumulativeCharged", "holdoutOpened", "formationMaterialized", "phaseComplete", "root"]) || r.schemaVersion !== (supervisor ? `lean-correction-supervisor-result-v${leanSupervisorVersion(supervisor)}` : "lean-correction-result-v1") || r.privacy !== "private_offline" || r.issued !== false || r.route !== route || r.allocationRoot !== a.root || r.sourceRoot !== a.sourceRoot || r.requestBytesRoot !== s.entry.requestBytesRoot || r.head !== s.entry.head || r.reuseGrantRoot !== reuse.grant.root || r.evidenceRoot !== s.evidence.root || r.cumulativeCharged !== s.evidence.charged || r.holdoutOpened !== false || r.formationMaterialized !== false || r.phaseComplete !== false) return fail("RESULT")
  const { root: resultRoot, ...resultBody } = r
  if (resultRoot !== labRoot(supervisor ? `lean-correction-supervisor-result-v${leanSupervisorVersion(supervisor)}` : "lean-correction-result-v1", resultBody)) return fail("RESULT_ROOT")
  const charged = s.evidence.records.filter(row => row.chargeRoot !== null).length, successful = s.evidence.records.filter(row => row.status === "success").length
  if (!(s.journalBytes instanceof Uint8Array) || s.journalBytes.length > 4_194_304) return fail("JOURNAL")
  const journal = Buffer.from(s.journalBytes).toString("utf8")
  if (journal && !journal.endsWith("\n")) return fail("JOURNAL")
  const events = journal.split("\n").filter(Boolean).map(line => JSON.parse(line) as { kind: string; charge?: { root: LabRoot; slotRoot: LabRoot }; chargeRoot?: LabRoot; record?: unknown })
  if (events.at(-1)?.kind !== "stop" || s.evidence.root !== labRoot("lean-evidence-v1", { allocationRoot: a.root, events, records: s.evidence.records }) || events.filter(e => e.kind === "charge").length !== charged || events.filter(e => e.kind === "terminal").length !== charged) return fail("EVIDENCE")
  if (s.evidence.charged !== a.predecessor.chargedMatches + charged || charged !== s.pairs.length || charged !== s.observations.length || charged > a.slots.length || s.time.elapsedMs < a.predecessor.elapsedUpperBoundMs || s.time.elapsedMs > LEAN_CAPS.elapsedMs || s.evidence.scratchHighWaterBytes > LEAN_CAPS.scratchBytes) return fail("ACCOUNTING")
  const byRole = new Map(s.sources.map(source => [source.role, source]))
  let frozenInitial: ReturnType<typeof analyseLeanDistinctPairs> | undefined, selectedProbe: LabRoot | undefined
  if (byRole.size !== s.sources.length || s.sources.some(source => source.coldRoot !== a.coldRoot || source.implementationRoot !== a.sourceRoot && !reuse.sources.some(original => original.root === source.root && original.role === source.role))) return fail("SOURCE")
  for (let ordinal = 0; ordinal < charged; ordinal++) {
    guard()
    const pair = s.pairs[ordinal]!, receipt = s.observations[ordinal]!, slot = a.slots[ordinal]!, record = s.evidence.records[ordinal]!, cell = receipt.cell
    if (!exactLabKeys(pair, ["schemaVersion", "ordinal", "slotRoot", "requestRoot", "priorLedgerBytesRoot", "priorLedgerByteLength", "priorCharged", "bottomRole", "bottomSourceRoot", "bottomSnapshotRoot", "topRole", "topSourceRoot", "topSnapshotRoot", "root"]) || pair.schemaVersion !== "lean-baseline-pair-v1" || pair.ordinal !== ordinal || pair.slotRoot !== slot.root || pair.requestRoot !== slot.requestRoot || pair.priorCharged !== a.predecessor.chargedMatches + ordinal || !Number.isSafeInteger(pair.priorLedgerByteLength) || pair.priorLedgerByteLength < 0 || pair.priorLedgerByteLength > s.journalBytes.length || pair.priorLedgerBytesRoot !== leanBytesRoot(s.journalBytes.subarray(0, pair.priorLedgerByteLength))) return fail("PAIR")
    const { root: pairRoot, ...pairBody } = pair
    if (pairRoot !== labRoot("lean-baseline-pair-v1", pairBody)) return fail("PAIR_ROOT")
    const prefix = Buffer.from(s.journalBytes.subarray(0, pair.priorLedgerByteLength)).toString("utf8")
    if (prefix && !prefix.endsWith("\n") || prefix.split("\n").filter(Boolean).map(line => JSON.parse(line) as { kind: string }).filter(row => row.kind === "charge").length !== ordinal) return fail("PRECHARGE")
    for (const seat of ["bottom", "top"] as const) {
      const source = byRole.get(seat === "bottom" ? pair.bottomRole : pair.topRole)
      if (!source || source.root !== (seat === "bottom" ? pair.bottomSnapshotRoot : pair.topSnapshotRoot) || source.sourceRoot !== (seat === "bottom" ? pair.bottomSourceRoot : pair.topSourceRoot)) return fail("PAIR_SOURCE")
    }
    const has = (entrant: string, target: string) => slot.condition < 2 ? pair.bottomRole === entrant && pair.topRole === target : pair.topRole === entrant && pair.bottomRole === target
    const kind = currentBaselineSlotKind(ordinal).kind
    if (ordinal === 12) {
      const initialRoots = [byRole.get("initial-tactical")?.sourceRoot, byRole.get("initial-teacher")?.sourceRoot]
      if (!initialRoots.every(rooted)) return fail("INITIAL_SCHEDULE")
      frozenInitial = analyseLeanDistinctPairs(initialRoots as LabRoot[], s.observations.slice(8, 12).map(row => measuredRetained(row.cell)))
      if (!frozenInitial.mixture || !same(s.artifacts["initial-analysis.json"], frozenInitial)) return fail("INITIAL_SCHEDULE")
    }
    if (kind === "response_training") {
      if (!frozenInitial?.mixture) return fail("RESPONSE_SCHEDULE")
      const target = ordinal < 16 ? selectLeanMixtureTarget(frozenInitial.mixture, ordinal - 12) : frozenInitial.selectedPureRoot
      if (!has("response-0", byRole.get("initial-tactical")?.sourceRoot === target ? "initial-tactical" : "initial-teacher")) return fail("RESPONSE_SCHEDULE")
    }
    if (ordinal === 28) {
      const initialRoots = [byRole.get("initial-tactical")!.sourceRoot, byRole.get("initial-teacher")!.sourceRoot], responseRoot = byRole.get("final-response")!.sourceRoot
      if (!frozenInitial?.mixture) return fail("PROBE_SCHEDULE")
      const responseCells = s.observations.slice(20, 28).map(row => measuredRetained(row.cell))
      const analysis = analyseLeanDistinctPairs([...initialRoots, responseRoot], s.observations.slice(8, 12).map(row => measuredRetained(row.cell)).concat(responseCells))
      const admission = analyseLeanResponseAdmission({ initialSources: initialRoots, frozenMixture: frozenInitial.mixture, strongestPureRoot: frozenInitial.selectedPureRoot, strongestInitialMinimumHalfPoints: frozenInitial.pure[0]!.minimumHalfPoints, responseRoot, responseCells })
      const eligible = admission.admitted ? [...initialRoots, responseRoot] : initialRoots
      selectedProbe = analysis.pure.find(row => eligible.includes(row.sourceRoot))?.sourceRoot
      if (!selectedProbe || !same(s.artifacts["current-analysis.json"], analysis)) return fail("PROBE_SCHEDULE")
    }
    if (kind === "probe" && (!selectedProbe || !(slot.condition < 2 ? pair.bottomSourceRoot === selectedProbe && pair.topRole === "probe" : pair.topSourceRoot === selectedProbe && pair.bottomRole === "probe"))) return fail("PROBE_SCHEDULE")
    if (kind === "initial_training" && !has(ordinal < 4 ? `tactical-${ordinal}` : "teacher-0", "cold-opponent") || (kind === "initial_matrix" || kind === "repeat") && !has("initial-tactical", "initial-teacher") || kind === "response_training" && !(slot.condition < 2 ? pair.bottomRole === "response-0" : pair.topRole === "response-0") || kind === "response_pairing" && !has("final-response", ordinal < 24 ? "initial-tactical" : "initial-teacher") || kind === "probe" && !(slot.condition < 2 ? pair.topRole === "probe" : pair.bottomRole === "probe")) return fail("SCHEDULE")
    if (!exactLabKeys(receipt, ["schemaVersion", "pairRoot", "cell", "root"]) || receipt.schemaVersion !== "lean-baseline-observation-v1" || receipt.pairRoot !== pairRoot || receipt.root !== labRoot("lean-baseline-observation-v1", { schemaVersion: receipt.schemaVersion, pairRoot, cell }) || !exactLabKeys(cell, ["ordinal", "slotRoot", "bottomRoot", "topRoot", "compact", "brainInputs", "strategyInputs", "trainingHalfPoints", "semanticRoot", "metrics", "decisionRoot", "diagnostic"]) || cell.ordinal !== ordinal || cell.slotRoot !== slot.root || cell.bottomRoot !== pair.bottomSourceRoot || cell.topRoot !== pair.topSourceRoot || !same(cell.compact, record.terminal?.record) || !rooted(cell.decisionRoot) || (record.status === "success" ? !rooted(cell.semanticRoot) || cell.diagnostic !== null : cell.semanticRoot !== null) || !Array.isArray(cell.brainInputs) || cell.brainInputs.length > 16 || !Array.isArray(cell.strategyInputs) || cell.strategyInputs.length > 16) return fail("OBSERVATION")
    if (route === "baseline" && (kind === "initial_training" || kind === "response_training") && record.status === "success") {
      const entrantSeat = slot.condition < 2 ? "bottom" : "top"
      if (cell.trainingHalfPoints !== (cell.compact.outcome === "DRAW" ? 1 : cell.compact.outcome === entrantSeat ? 2 : 0)) return fail("TRAINING_OUTCOME")
    }
    const { root: metricRoot, ...metricBody } = cell.metrics
    if (metricRoot !== labRoot("lean-baseline-match-metrics-v1", metricBody) || cell.metrics.executionRoot !== cell.compact.executionRoot || cell.metrics.formationComparison !== "inconclusive") return fail("METRIC")
  }
  const pipeline = r.pipeline as Record<string, unknown>
  if (!pipeline || !Array.isArray(pipeline.cells) || pipeline.cells.length !== charged || pipeline.holdoutOpened !== false || pipeline.formationMaterialized !== false) return fail("PIPELINE")
  let originRoot: LabRoot | null = null, observedOrigin: "legacy_deadline" | "unknown" = "unknown"
  if (route === "diagnostic") {
    if (charged !== 1 || s.origin === null || pipeline.status !== "diagnostic_only" || pipeline.training !== null || !same(pipeline.cells, s.observations.map(({ cell }) => ({ ordinal: cell.ordinal, slotRoot: cell.slotRoot, compact: cell.compact })))) return fail("DIAGNOSTIC")
    const origin = s.origin
    if (!exactLabKeys(origin, ["schemaVersion", "allocationRoot", "sourceRoot", "pairRoot", "chargeRoot", "origins", "root"]) || origin.schemaVersion !== "lean-correction-origin-envelope-v1" || origin.allocationRoot !== a.root || origin.sourceRoot !== a.sourceRoot || origin.pairRoot !== s.pairs[0]!.root || origin.chargeRoot !== s.evidence.records[0]!.chargeRoot || !Array.isArray(origin.origins) || origin.origins.length > 2) return fail("ORIGIN")
    const { root: oRoot, ...originBody } = origin
    if (oRoot !== labRoot("lean-correction-origin-envelope-v1", originBody)) return fail("ORIGIN_ROOT")
    originRoot = oRoot as LabRoot
    for (const row of origin.origins as { metadata: unknown; sourceRoot: LabRoot; seat: string; binding: Record<string, unknown> }[]) {
      if (!exactLabKeys(row, ["metadata", "sourceRoot", "seat", "binding"]) || !["bottom", "top"].includes(row.seat) || row.sourceRoot !== (row.seat === "bottom" ? s.pairs[0]!.bottomSourceRoot : s.pairs[0]!.topSourceRoot)) return fail("ORIGIN_SOURCE")
      const metadata = validateLeanCorrectionOriginMetadata(row.metadata)
      const diagnostic = s.observations[0]!.cell.diagnostic as unknown as Record<string, unknown> | null
      const binding = diagnostic?.invocationBinding as Record<string, unknown> | undefined
      const transport = row.binding
      if (!binding || !exactLabKeys(binding, ["schemaVersion", "method", "requestOrdinal", "requestRoot", "payloadRoot", "inputRoot", "executableRoot", "sourceRoot", "seat", "requestId", "ordinal", "invocationRoot"]) || binding.schemaVersion !== "v1.38-lean-correction-invocation-binding-v1" || !exactLabKeys(transport, ["method", "requestOrdinal", "requestRoot", "payloadRoot", "inputRoot", "executableRoot"]) || !["selectActivations", "soldierBrain"].includes(String(binding.method)) || binding.method !== diagnostic?.method || binding.ordinal !== diagnostic?.ordinal || diagnostic?.chargeRoot !== s.evidence.records[0]!.chargeRoot || !Number.isSafeInteger(binding.ordinal) || Number(binding.ordinal) < 0 || binding.requestOrdinal !== Number(binding.ordinal) + 1 || Number(binding.ordinal) >= s.observations[0]!.cell.compact.invocationCount || binding.requestOrdinal !== metadata.requestOrdinal || binding.requestRoot !== metadata.requestRoot || binding.sourceRoot !== row.sourceRoot || binding.seat !== row.seat || typeof binding.requestId !== "string" || binding.requestId.length < 1 || binding.requestId.length > 256 || ![binding.requestRoot, binding.payloadRoot, binding.inputRoot, binding.executableRoot, binding.invocationRoot].every(rooted) || Object.entries(transport).some(([key, value]) => binding[key] !== value)) return fail("ORIGIN_INVOCATION")
      const source = byRole.get(row.seat === "bottom" ? s.pairs[0]!.bottomRole : s.pairs[0]!.topRole)
      if (!source) return fail("ORIGIN_EXECUTABLE")
      const defaults = defaultRuntimeMetadata("typescript")
      const revision = buildStrategyRevision({ source: source.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
      if (!revision.validation.valid || !revision.metadata.sourceArtifact || binding.executableRoot !== `sha256:${revision.metadata.sourceArtifact.hash}`) return fail("ORIGIN_EXECUTABLE")
      if (metadata.brokerBranch === "legacy_deadline" && metadata.waitDisposition === "timed_out" && metadata.transportSignal === "broker_synthetic_sigkill" && metadata.terminationDisposition === "worker_terminate_completed") observedOrigin = "legacy_deadline"
    }
  } else {
    const { root: pipelineRoot, ...pipelineBody } = pipeline
    if (pipelineRoot !== labRoot("lean-current-baseline-pipeline-v1", pipelineBody) || !same(pipeline.cells, s.observations.map(receipt => compactLeanBaselineCell(receipt.cell))) || !same(pipeline.measurement, leanBaselineMetricCoverage(s.observations.map(receipt => receipt.cell))) || !same(s.artifacts["cold-corpus.json"], reuse.corpus) || !same(s.artifacts["initial-proposals.json"], reuse.proposals) || !same(s.artifacts["cold-reuse-grant.json"], reuse.grant)) return fail("REUSED_PIPELINE")
    if (pipeline.status === "current_baseline_complete") auditCompleteBaseline(s, byRole, guard)
    else if (pipeline.status !== "partial_or_failed_baseline") return fail("STATUS")
  }
  const cleanupComplete = s.evidence.records.filter(row => row.terminal !== null).every(row => row.terminal!.record.cleanupComplete)
  if (supervisor && route === "diagnostic" && (successful !== 1 || !cleanupComplete)) return fail("DIAGNOSTIC_NOT_ACCEPTED")
  const body = { schemaVersion: supervisor ? `lean-correction-supervisor-retained-v${leanSupervisorVersion(supervisor)}` as const : "lean-correction-retained-v1" as const, ...(supervisor ? { evidenceClass: "limited_exploratory" as const, accepted: true, requestBytesRoot: s.entry.requestBytesRoot, entryBytesRoot: leanBytesRoot(leanCanonicalBytes(s.entry)), terminalBytesRoot: leanBytesRoot(leanCanonicalBytes(s.terminal)), resultBytesRoot: leanBytesRoot(leanCanonicalBytes(r)), reasonRoot: reason!.root, reasonBytesRoot: leanBytesRoot(s.supervisorReasonBytes!), supervisorDecisionRoot: a.supervisorDecisionRoot!, acceptedCheckRoot: a.acceptedCheckRoot!, publicAuthorized: false, countedAuthorized: false, productionAuthorized: false } : {}), status: "retained_valid" as const, route, allocationRoot: a.root, sourceRoot: a.sourceRoot, resultRoot: resultRoot as LabRoot, reuseGrantRoot: reuse.grant.root, evidenceRoot: s.evidence.root, head: s.entry.head, currentCharged: charged, cumulativeCharged: s.evidence.charged, successful, cleanupComplete, originRoot, observedOrigin, initiatingNativeCause: "unknown" as const, complete: route === "baseline" && pipeline.status === "current_baseline_complete", claim: "no_robust_pure_claimed" as const, phaseComplete: false, freezeAdmitted: false, holdoutOpened: false, formationMaterialized: false, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const }
  return { ...body, root: labRoot(body.schemaVersion, body) }
}
const measuredRetained = (cell: LeanBaselineObservedCell): LeanMeasuredPair => {
  if (cell.compact.classification !== "success" || !cell.compact.cleanupComplete || !cell.compact.outcome || !cell.semanticRoot) return fail("SCHEDULE_EVIDENCE")
  return { ordinal: cell.ordinal, bottomSourceRoot: cell.bottomRoot, topSourceRoot: cell.topRoot, outcome: cell.compact.outcome, executionRoot: cell.compact.executionRoot, semanticRoot: cell.semanticRoot }
}
const auditCompleteBaseline = (s: LeanCorrectionRetainedSnapshot, byRole: Map<string, LeanBaselineSource>, guard: () => void) => {
  const cells = s.observations.map(row => row.cell), pipeline = s.result.pipeline as Record<string, unknown>
  if (cells.length !== 36 || cells.some(cell => cell.compact.classification !== "success" || !cell.compact.cleanupComplete) || pipeline.claim !== "no_robust_pure_claimed") return fail("INCOMPLETE_SOLVER")
  const initial = s.artifacts["initial-training.json"] as LeanColdTrainingManifest, final = s.artifacts["response-training.json"] as LeanColdTrainingManifest
  auditLeanTrainingVector(initial); auditLeanTrainingVector(final)
  if (initial.stage !== "initial" || final.stage !== "response_complete" || initial.coldRoot !== s.allocation.coldRoot || initial.corpusRoot !== s.reuse.corpus.corpusRoot || final.coldRoot !== initial.coldRoot || final.corpusRoot !== initial.corpusRoot || !same(final.candidates.slice(0, 2), initial.candidates) || !same(pipeline.training, final)) return fail("TRAINING")
  const points = (cell: LeanBaselineObservedCell) => cell.trainingHalfPoints ?? fail("POINTS")
  const tactical = selectLeanBestTrainedProposal(s.reuse.proposals.tactical, cells.slice(0, 4).map((cell, index) => ({ proposalRoot: s.reuse.proposals.tactical[index]!.root, trainingMatchRoot: cell.compact.executionRoot, trainingHalfPoints: points(cell) })))
  const teacher = selectLeanTrainedProposal(s.reuse.proposals.teacher, cells.slice(4, 8).map(cell => ({ trainingMatchRoot: cell.compact.executionRoot, trainingHalfPoints: points(cell) })))
  if (!same(s.artifacts["initial-selection.json"], { tactical, teacher, limitation: "one-match-per-tactical-variation-condition-confounded-no-strength-claim" }) || byRole.get("initial-tactical")?.sourceRoot !== tactical.selectedSourceRoot || byRole.get("initial-teacher")?.sourceRoot !== teacher.selectedSourceRoot) return fail("SELECTION")
  for (const candidate of final.candidates) {
    const expected = candidate.mechanism === "tactical" ? cells.slice(0, 4) : candidate.mechanism === "teacher" ? cells.slice(4, 8) : cells.slice(12, 20)
    if (!same(candidate.trainingMatchRoots, expected.map(c => c.compact.executionRoot).sort())) return fail("TRAINING_JOIN")
    if (candidate.mechanism === "tactical" && !same(candidate.workRoots.tacticalInputs, s.reuse.proposals.tactical[0]!.inputRoots) || candidate.mechanism === "teacher" && (!same(candidate.workRoots.teacherNodes, s.reuse.proposals.teacherSearchNodeRoots) || !same(candidate.workRoots.distillationExamples, s.reuse.proposals.distillationExampleRoots))) return fail("WORK_VECTOR")
  }
  guard()
  const measured = (cell: LeanBaselineObservedCell): LeanMeasuredPair => ({ ordinal: cell.ordinal, bottomSourceRoot: cell.bottomRoot, topSourceRoot: cell.topRoot, outcome: cell.compact.outcome!, executionRoot: cell.compact.executionRoot, semanticRoot: cell.semanticRoot! })
  const initialRoots = [byRole.get("initial-tactical")!.sourceRoot, byRole.get("initial-teacher")!.sourceRoot], responseRoot = byRole.get("final-response")!.sourceRoot
  const initialAnalysis = analyseLeanDistinctPairs(initialRoots, cells.slice(8, 12).map(measured)), analysis = analyseLeanDistinctPairs([...initialRoots, responseRoot], cells.slice(8, 12).concat(cells.slice(20, 28)).map(measured))
  if (!initialAnalysis.mixture || !same(s.artifacts["initial-analysis.json"], initialAnalysis) || !same(s.artifacts["current-analysis.json"], analysis) || pipeline.initialAnalysisRoot !== initialAnalysis.root || pipeline.analysisRoot !== analysis.root) return fail("SOLVER")
  const response = analyseLeanResponseAdmission({ initialSources: initialRoots, frozenMixture: initialAnalysis.mixture, strongestPureRoot: initialAnalysis.selectedPureRoot, strongestInitialMinimumHalfPoints: initialAnalysis.pure[0]!.minimumHalfPoints, responseRoot, responseCells: cells.slice(20, 28).map(measured) })
  const eligible = response.admitted ? [...initialRoots, responseRoot] : initialRoots, selected = analysis.pure.find(row => eligible.includes(row.sourceRoot))?.sourceRoot
  if (!same(pipeline.response, { attemptCount: 1, ...response }) || !same(pipeline.eligiblePureRoots, [...eligible].sort()) || pipeline.selectedPureRoot !== selected || cells.slice(32, 36).some((cell, i) => cell.semanticRoot !== cells[i + 8]!.semanticRoot)) return fail("CLAIM")
  const work = s.artifacts["response-work.json"] as LeanResponseWork
  const candidate = final.candidates.find(row => row.mechanism === "response")!
  if (!exactLabKeys(work, ["targetRoots", "plannerEvidence", "responseNodeCap", "actualAssignmentNodes", "selectedPlannerBudget", "matchOutcomes", "realizedTrainingHalfPoints", "commonSourceRoot", "plannerNodeRoots"]) || work.responseNodeCap !== 128 || !Number.isSafeInteger(work.actualAssignmentNodes) || work.actualAssignmentNodes < 0 || work.actualAssignmentNodes > 128 || candidate.decisionRoot !== labRoot("lean-training-decision-v1", work)) return fail("RESPONSE_WORK")
  const snapshot = byRole.get("final-response")!, draft = byRole.get("response-0")!
  if (snapshot.source !== candidate.source || snapshot.sourceRoot !== candidate.sourceRoot || snapshot.structureRoot !== candidate.structureRoot || work.commonSourceRoot !== s.allocation.coldRoot || !same(work.targetRoots, { mixture: labRoot("lean-frozen-initial-mixture-v1", initialAnalysis.mixture), strongestPure: initialAnalysis.selectedPureRoot })) return fail("RESPONSE_SOURCE_TARGET")
  const sorted = [...cells.slice(12, 20)].sort((left, right) => left.compact.executionRoot.localeCompare(right.compact.executionRoot))
  const totalWeight = sorted.reduce((sum, cell) => sum + points(cell) + 1, 0)
  const assigned = sorted.map(cell => Math.floor(128 * (points(cell) + 1) / totalWeight))
  let remaining = 128 - assigned.reduce((sum, count) => sum + count, 0)
  for (let ordinal = 0; remaining > 0; ordinal = (ordinal + 1) % 8, remaining--) assigned[ordinal]!++
  const expectedOutcomes = sorted.map((cell, index) => ({ trainingMatchRoot: cell.compact.executionRoot, halfPoints: points(cell), assignedNodes: assigned[index]! }))
  const selectedBudget = Math.max(1, Math.min(128, Math.round(sorted.reduce((sum, cell, index) => sum + assigned[index]! * (points(cell) + 1), 0) / totalWeight)))
  if (!same(work.matchOutcomes, expectedOutcomes) || work.realizedTrainingHalfPoints !== sorted.reduce((sum, cell) => sum + points(cell), 0) || work.selectedPlannerBudget !== selectedBudget || !draft.source.includes("selectPlannerActivations(input);") || candidate.source !== draft.source.replace("selectPlannerActivations(input);", `selectPlannerActivations(input, { maxExpansions: ${selectedBudget} });`)) return fail("RESPONSE_COUNTER_SOURCE")
  const receipts = s.artifacts["response-node-receipts.json"] as readonly LeanResponseNodeReceipt[]
  if (!Array.isArray(receipts) || receipts.length !== 8 || !Array.isArray(work.plannerEvidence) || work.plannerEvidence.length !== 8 || !same(work.plannerNodeRoots, candidate.workRoots.responseNodes)) return fail("RESPONSE_NODES")
  let actualTotal = 0
  for (let ordinal = 0; ordinal < 8; ordinal++) {
    guard()
    const receipt = receipts[ordinal]!, cell = sorted[ordinal]!, allocation = assigned[ordinal]!
    if (!exactLabKeys(receipt, ["ordinal", "trainingMatchRoot", "allocation", "actualNodes", "inputRoot", "output", "nodeRoot"]) || receipt.ordinal !== ordinal || receipt.trainingMatchRoot !== cell.compact.executionRoot || receipt.allocation !== allocation || typeof receipt.actualNodes !== "number" || !Number.isSafeInteger(receipt.actualNodes) || receipt.actualNodes < 0 || receipt.actualNodes > allocation || !cell.brainInputs.length || !cell.strategyInputs.length) return fail("RESPONSE_NODE_RECEIPT")
    const input = StrategyInputV119Schema.parse(cell.strategyInputs[0]), output = StrategyResultSchema.parse(receipt.output)
    for (const brainInput of cell.brainInputs) if (!same(SoldierBrainInputV119Schema.parse(brainInput), brainInput)) return fail("RESPONSE_BRAIN_INPUT")
    if (!same(input, cell.strategyInputs[0]) || !same(output, receipt.output) || receipt.inputRoot !== labRoot("runtime-input", input) || (output.strategyMemory as { planner?: { expansions?: unknown } } | undefined)?.planner?.expansions !== receipt.actualNodes) return fail("RESPONSE_NODE_INPUT_OUTPUT")
    const { nodeRoot, ...nodeBody } = receipt
    if (nodeRoot !== labRoot("lean-response-planner-node-v1", nodeBody) || work.plannerNodeRoots[ordinal] !== nodeRoot || !same(work.plannerEvidence[ordinal], { trainingMatchRoot: receipt.trainingMatchRoot, allocation, actualNodes: receipt.actualNodes, nodeRoot })) return fail("RESPONSE_NODE_ROOT")
    actualTotal += receipt.actualNodes
  }
  if (work.actualAssignmentNodes !== actualTotal) return fail("RESPONSE_NODE_TOTAL")
}
export interface LeanFreshSupervisorReaderGap { runCloseMs: number; readerStartMs: number; gapMs: number }
/** Pure producer-to-reader join. Wall observations are actual custody; elapsed
 * upper bounds may conservatively advance the close by monotonic rounding. */
export const validateLeanFreshSupervisorReaderGap = (startValue: unknown, closeValue: unknown, allocationRoot: LabRoot, route: LeanCorrectionRoute, time: Pick<ReturnType<typeof readLeanTimeAccounting>, "starts" | "closes" | "closed">, readerStartMs: number, version: 3 | 4 = 3): LeanFreshSupervisorReaderGap => {
  const start = startValue as Record<string, unknown>, end = closeValue as Record<string, unknown>
  const natural = (n: unknown): n is number => Number.isSafeInteger(n) && Number(n) >= 0
  if (!start || !end || !exactLabKeys(start, ["schemaVersion", "route", "mode", "parentPid", "wallStartMs", "monotonicStartNs", "root"]) || !exactLabKeys(end, ["schemaVersion", "startRoot", "route", "mode", "elapsedUpperBoundMs", "monotonicObservedNs", "wallObservedMs", "allocationRoot", "ledgerInterval", "importedMs", "root"]) || ![3, 4].includes(version) || start.schemaVersion !== `lean-correction-supervisor-admission-v${version}` || end.schemaVersion !== `lean-correction-supervisor-admission-close-v${version}` || start.route !== route || end.route !== route || start.mode !== "run" || end.mode !== "run" || !natural(start.parentPid) || start.parentPid === 0 || !natural(start.wallStartMs) || !natural(end.wallObservedMs) || !natural(end.elapsedUpperBoundMs) || !natural(end.importedMs) || !natural(readerStartMs)) return fail("READER_GAP_CUSTODY")
  const { root: startRoot, ...startBody } = start, { root: closeRoot, ...closeBody } = end
  if (startRoot !== labRoot(String(start.schemaVersion), startBody) || closeRoot !== labRoot(String(end.schemaVersion), closeBody) || end.startRoot !== startRoot || end.allocationRoot !== allocationRoot || end.ledgerInterval !== "correction-run-finalization" || time.starts.get("pilot-entry") !== start.wallStartMs || !time.closed.has("pilot-entry") || time.closes.get("pilot-entry") !== start.wallStartMs + end.importedMs || !time.closed.has("correction-run-finalization") || time.starts.get("correction-run-finalization") !== start.wallStartMs + end.importedMs || time.closes.get("correction-run-finalization") !== start.wallStartMs + end.elapsedUpperBoundMs || end.importedMs > end.elapsedUpperBoundMs) return fail("READER_GAP_CUSTODY")
  let elapsed: number
  try { elapsed = leanCorrectionAdmissionElapsed(start as never, { wallStartMs: end.wallObservedMs, monotonicStartNs: end.monotonicObservedNs } as never) } catch { return fail("READER_GAP_CUSTODY") }
  const runCloseMs = start.wallStartMs + end.elapsedUpperBoundMs
  if (elapsed !== end.elapsedUpperBoundMs || end.wallObservedMs < start.wallStartMs || !natural(runCloseMs) || readerStartMs < runCloseMs || time.starts.get(`correction-supervisor-${route}-v${version}-verifier`) !== readerStartMs) return fail("READER_GAP_CUSTODY")
  const gapId = `correction-supervisor-${route}-v${version}-reader-gap`
  for (const [id, from] of time.starts) {
    const to = time.closes.get(id)
    if (id !== gapId && to !== undefined && to > runCloseMs && from < readerStartMs) return fail("READER_GAP_CUSTODY")
  }
  return { runCloseMs, readerStartMs, gapMs: readerStartMs - runCloseMs }
}
export const readLeanFreshSupervisorReaderGap = (ledger: Parameters<typeof readLeanTimeAccounting>[0], route: LeanCorrectionRoute, readerStartMs: number, directory: string = leanCorrectionRoutePaths(route, "v3").temp, version: 3 | 4 = 3) => {
  try { return validateLeanFreshSupervisorReaderGap(readLeanCorrectionJson(join(directory, "admission-run-start.json")), readLeanCorrectionJson(join(directory, "admission-run-close.json")), ledger.allocation.root, route, readLeanTimeAccounting(ledger), readerStartMs, version) } catch { return fail("READER_GAP_CUSTODY") }
}
/** Append only to this newly spent reader. Gap rows retain authenticated wall
 * timestamps; a separate real closure interval debits import/closing work. */
export const closeLeanFreshSupervisorReader = (ledger: Parameters<typeof closeLeanInterval>[0], route: LeanCorrectionRoute, gap: LeanFreshSupervisorReaderGap | null, clock = Date.now, version: 3 | 4 = 3) => {
  const interval = `correction-supervisor-${route}-v${version}-verifier`, closingStart = clock()
  closeLeanInterval(ledger, interval, closingStart)
  if (gap) {
    const id = `correction-supervisor-${route}-v${version}-reader-gap`
    beginLeanInterval(ledger, id, gap.runCloseMs); closeLeanInterval(ledger, id, gap.readerStartMs)
  }
  const closing = `correction-supervisor-${route}-v${version}-reader-close`
  beginLeanInterval(ledger, closing, closingStart); closeLeanInterval(ledger, closing, clock())
}
/** Exactly one invocation; begin marker spends reader identity even on failure. */
export const verifyLeanCorrectionRetained = (path: string, route: LeanCorrectionRoute, supervisor: LeanSupervisorMode = false, precheck?: () => void) => {
  const paths = leanCorrectionRoutePaths(route, supervisor)
  const ledger = openLeanLedger(paths.store), allocation = ledger.allocation
  if (supervisor !== "v3" && supervisor !== "v4" && (!("route" in allocation) || allocation.route !== route)) return fail("ALLOCATION")
  const interval = supervisor ? `correction-supervisor-${route}-v${leanSupervisorVersion(supervisor)}-verifier` : `correction-${route}-verifier`
  // V2 debits precheck/loader even when custody refuses ordinary acceptance.
  const readerStartMs = Date.now() - Math.ceil(process.uptime() * 1000)
  if (supervisor) beginLeanInterval(ledger, interval, readerStartMs)
  let gap: LeanFreshSupervisorReaderGap | null = null
  let terminal: ReturnType<typeof readLeanChildTerminal>, entry: ReturnType<typeof readLeanChildEntry>
  try { if (supervisor === "v3" || supervisor === "v4") { if (!("route" in allocation) || allocation.route !== route || leanSupervisorAllocationMode(allocation) !== supervisor) return fail("ALLOCATION"); gap = readLeanFreshSupervisorReaderGap(ledger, route, readerStartMs, paths.temp, leanSupervisorVersion(supervisor) as 3 | 4) } terminal = readLeanChildTerminal(ledger); entry = readLeanChildEntry(ledger); if (terminal.status !== "child_exited") return fail("TERMINAL_ONLY_REQUIRED") } catch (error) { if (supervisor === "v3" || supervisor === "v4") closeLeanFreshSupervisorReader(ledger, route, gap, Date.now, leanSupervisorVersion(supervisor) as 3 | 4); else if (supervisor) closeLeanInterval(ledger, interval); throw error }
  // Include loader and pre-reader custody work; source fixtures do not spend
  // this actual one-shot reader identity.
  if (!supervisor) beginLeanInterval(ledger, interval, Date.now() - Math.ceil(process.uptime() * 1000))
  let scratchPeak = 0
  const guard = () => {
    scratchPeak = Math.max(scratchPeak, process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024)
    const scratch = scratchPeak + LEAN_EXTERNAL_SCRATCH_RESERVE, physical = cumulativeLeanPhysicalBytes(ledger)
    if (scratch > LEAN_CAPS.scratchBytes || physical + 65536 > LEAN_CAPS.retainedBytes || scratch + physical + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes || currentLeanElapsedMs(ledger) + (gap?.gapMs ?? 0) >= LEAN_CAPS.elapsedMs || leanCorrectionSourceManifest(supervisor).root !== allocation.sourceRoot || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", maxBuffer: 128 }).trim() !== entry.head) return fail("HOLD_OR_CAPACITY")
  }
  let report: ReturnType<typeof auditLeanCorrectionRetained>
  try {
    if (supervisor) precheck?.()
    guard()
    const { request, reuse } = readLeanCorrectionRequest(path, route, supervisor)
    const result = readLeanCorrectionJson(join(ledger.directory, "result.json"), 8_388_608) as Record<string, unknown>
    const retainedReuse = readLeanCorrectionJson(join(ledger.directory, "cold-reuse.json"), 4_194_304)
    if (!same(validateLeanColdReuse(retainedReuse, allocation.sourceRoot), reuse)) return fail("REUSE")
    const evidence = verifyLeanEvidence(ledger), state = readLeanLedger(ledger), charged = state.charges.size
    if (!state.stopped) return fail("UNCLOSED")
    const observations = Array.from({ length: charged }, (_, i) => readLeanCorrectionJson(join(ledger.directory, `observation-${i}.json`), 8_388_608) as Observation)
    const pairs = Array.from({ length: charged }, (_, i) => readLeanCorrectionJson(join(ledger.directory, `pair-${i}.json`)) as LeanBaselinePair)
    const names = readdirSync(ledger.directory), sources = names.filter(name => /^source-[a-z0-9-]+\.json$/u.test(name)).map(name => readLeanBaselineSource(ledger.directory, name.slice(7, -5)))
    const artifactNames = ["seal-metadata.json", "cold-corpus.json", "cold-reuse-grant.json", "initial-proposals.json", "initial-selection.json", "initial-training.json", "initial-analysis.json", "response-work.json", "response-node-receipts.json", "response-training.json", "current-analysis.json"]
    const artifacts = Object.fromEntries(artifactNames.filter(name => names.includes(name)).map(name => [name, readLeanCorrectionJson(join(ledger.directory, name), 2_097_152)]))
    const allowed = new Set(["allocation.json", "ledger.ndjson", "time.ndjson", "entry.json", "child-terminal.json", "result.json", "cold-reuse.json", ...(supervisor ? [LEAN_SUPERVISOR_REASON_FILE] : []), ...(route === "diagnostic" ? ["correction-origin.json"] : artifactNames), ...sources.map(source => `source-${source.role}.json`), ...pairs.flatMap(pair => [`pair-${pair.ordinal}.json`, `observation-${pair.ordinal}.json`]), ...evidence.records.filter(row => row.terminal?.replay).map(row => `${row.chargeRoot!.slice(7)}.gz`)])
    if (names.some(name => !allowed.has(name))) return fail("INVENTORY")
    report = auditLeanCorrectionRetained({ schemaVersion: supervisor ? `lean-correction-supervisor-retained-snapshot-v${leanSupervisorVersion(supervisor)}` as const : "lean-correction-retained-snapshot-v1", ...(supervisor ? { supervisorReasonBytes: readLeanCorrectionPrivateBytes(join(ledger.directory, LEAN_SUPERVISOR_REASON_FILE), LEAN_SUPERVISOR_REASON_MAX_BYTES) } : {}), allocation, request, entry, terminal, evidence, time: { ...readLeanTimeAccounting(ledger), active: false, elapsedMs: currentLeanElapsedMs(ledger) }, result, reuse: retainedReuse, pairs, observations, sources, artifacts, origin: route === "diagnostic" ? readLeanCorrectionJson(join(ledger.directory, "correction-origin.json")) : null, journalBytes: readLeanCorrectionPrivateBytes(join(ledger.directory, "ledger.ndjson"), 4_194_304) }, guard)
    guard()
    const { root: _root, ...body } = report
    const final = { ...body, cumulativeElapsedMs: currentLeanElapsedMs(ledger) + (gap?.gapMs ?? 0), cumulativePhysicalBytes: cumulativeLeanPhysicalBytes(ledger), readerScratchHighWaterBytes: scratchPeak + LEAN_EXTERNAL_SCRATCH_RESERVE, ...(supervisor ? { readerInterval: interval, readerStartMs: readLeanTimeAccounting(ledger).starts.get(interval)!, readerObservedMs: Date.now() } : {}) }
    const checked = { ...final, root: labRoot(final.schemaVersion, final) }
    publishLeanCorrection(join(ledger.directory, paths.check), checked, ledger)
    return checked
  } finally { if (supervisor === "v3" || supervisor === "v4") closeLeanFreshSupervisorReader(ledger, route, gap, Date.now, leanSupervisorVersion(supervisor) as 3 | 4); else closeLeanInterval(ledger, interval) }
}
/** Admission reopens immutable bytes; it never dispatches/retries an empirical
 * reader. Caller booleans and mock audit reports cannot grant this authority. */
export const authenticateLeanSupervisorDiagnosticCheck = (supervisor: true | "v3" | "v4" = true) => {
  const paths = leanCorrectionRoutePaths("diagnostic", supervisor), ledger = openLeanLedger(paths.store), allocation = ledger.allocation
  if (leanSupervisorAllocationMode(allocation) !== supervisor || !("route" in allocation) || allocation.route !== "diagnostic") return fail("ACCEPTED_ALLOCATION")
  const entry = readLeanChildEntry(ledger), terminal = readLeanChildTerminal(ledger), time = readLeanTimeAccounting(ledger), interval = `correction-supervisor-diagnostic-v${leanSupervisorVersion(supervisor)}-verifier`
  if (time.active || !time.closed.has(interval) || [...time.starts.keys()].filter(id => id.includes("verifier")).join("|") !== interval) return fail("ACCEPTED_READER_CLOSURE")
  if (supervisor === "v3" || supervisor === "v4") {
    const gap = readLeanFreshSupervisorReaderGap(ledger, "diagnostic", time.starts.get(interval)!, paths.temp, leanSupervisorVersion(supervisor) as 3 | 4), gapId = `correction-supervisor-diagnostic-v${leanSupervisorVersion(supervisor)}-reader-gap`, closing = `correction-supervisor-diagnostic-v${leanSupervisorVersion(supervisor)}-reader-close`
    if (!time.closed.has(gapId) || time.starts.get(gapId) !== gap.runCloseMs || time.closes.get(gapId) !== gap.readerStartMs || !time.closed.has(closing) || time.starts.get(closing) !== time.closes.get(interval) || time.closes.get(closing)! < time.closes.get(interval)!) return fail("ACCEPTED_READER_CLOSURE")
  }
  const check = readLeanCorrectionJson(join(ledger.directory, paths.check)) as Record<string, unknown>
  const { root: checkRoot, ...checkBody } = check
  if (check.schemaVersion !== `lean-correction-supervisor-retained-v${leanSupervisorVersion(supervisor)}` || checkRoot !== labRoot(`lean-correction-supervisor-retained-v${leanSupervisorVersion(supervisor)}`, checkBody) || check.readerInterval !== interval || check.readerStartMs !== time.starts.get(interval) || !Number.isSafeInteger(check.readerObservedMs) || Number(check.readerObservedMs) < Number(check.readerStartMs) || Number(check.readerObservedMs) > time.closes.get(interval)!) return fail("ACCEPTED_CHECK_CUSTODY")
  const { request, reuse } = readLeanCorrectionRequest(paths.request, "diagnostic", supervisor)
  const evidence = verifyLeanEvidence(ledger), state = readLeanLedger(ledger)
  if (!state.stopped || state.charges.size !== 1 || state.charged !== 12) return fail("ACCEPTED_CHARGE")
  const result = readLeanCorrectionJson(join(ledger.directory, "result.json"), 8_388_608) as Record<string, unknown>
  const retainedReuse = readLeanCorrectionJson(join(ledger.directory, "cold-reuse.json"), 4_194_304)
  if (!same(retainedReuse, reuse)) return fail("ACCEPTED_REUSE")
  const pair = readLeanCorrectionJson(join(ledger.directory, "pair-0.json")) as LeanBaselinePair, observation = readLeanCorrectionJson(join(ledger.directory, "observation-0.json"), 8_388_608) as Observation
  const sources = ["tactical-0", "cold-opponent"].map(role => readLeanBaselineSource(ledger.directory, role))
  const allowed = new Set(["allocation.json", "ledger.ndjson", "time.ndjson", "entry.json", "child-terminal.json", "result.json", "cold-reuse.json", "correction-origin.json", "pair-0.json", "observation-0.json", "source-tactical-0.json", "source-cold-opponent.json", LEAN_SUPERVISOR_REASON_FILE, paths.check, ...evidence.records.filter(row => row.terminal?.replay).map(row => `${row.chargeRoot!.slice(7)}.gz`)])
  if (readdirSync(ledger.directory).some(name => !allowed.has(name))) return fail("ACCEPTED_INVENTORY")
  const audited = auditLeanCorrectionRetained({ schemaVersion: `lean-correction-supervisor-retained-snapshot-v${leanSupervisorVersion(supervisor)}` as const, allocation, request, entry, terminal, evidence, time, result, reuse: retainedReuse, pairs: [pair], observations: [observation], sources, artifacts: {}, origin: readLeanCorrectionJson(join(ledger.directory, "correction-origin.json")), journalBytes: readLeanCorrectionPrivateBytes(join(ledger.directory, "ledger.ndjson"), 4_194_304), supervisorReasonBytes: readLeanCorrectionPrivateBytes(join(ledger.directory, LEAN_SUPERVISOR_REASON_FILE), LEAN_SUPERVISOR_REASON_MAX_BYTES) })
  const { root: _root, ...body } = audited
  const extras = ["root", "cumulativeElapsedMs", "cumulativePhysicalBytes", "readerScratchHighWaterBytes", "readerInterval", "readerStartMs", "readerObservedMs"]
  if (!exactLabKeys(check, [...Object.keys(body), ...extras]) || Object.entries(body).some(([key, value]) => !same(check[key], value)) || !Number.isSafeInteger(check.cumulativeElapsedMs) || Number(check.cumulativeElapsedMs) < allocation.predecessor.elapsedUpperBoundMs || Number(check.cumulativeElapsedMs) > time.elapsedMs || !Number.isSafeInteger(check.cumulativePhysicalBytes) || Number(check.cumulativePhysicalBytes) > LEAN_CAPS.retainedBytes || !Number.isSafeInteger(check.readerScratchHighWaterBytes) || Number(check.readerScratchHighWaterBytes) > LEAN_CAPS.scratchBytes) return fail("ACCEPTED_FULL_AUDIT")
  return Object.freeze({ root: checkRoot as LabRoot, bytesRoot: leanBytesRoot(readLeanCorrectionPrivateBytes(join(ledger.directory, paths.check))), allocationRoot: allocation.root, readerInterval: interval, closedElapsedMs: time.elapsedMs, readerCloseMs: time.closes.get(supervisor === "v3" || supervisor === "v4" ? `correction-supervisor-diagnostic-v${leanSupervisorVersion(supervisor)}-reader-close` : interval)! })
}
