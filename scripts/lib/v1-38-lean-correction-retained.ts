/** New correction reader: byte/root custody and fixed schedule joins only.
 * No cold builders, authored proposal generation, search or historical reader. */
import { readdirSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { join } from "node:path"
import { labRoot, exactLabKeys, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAN_CAPS, LEAN_CORRECTION_ROUTES, LEAN_EXTERNAL_SCRATCH_RESERVE, admitLeanAllocation, beginLeanInterval, closeLeanInterval, cumulativeLeanPhysicalBytes, currentLeanElapsedMs, openLeanLedger, readLeanChildEntry, readLeanChildTerminal, readLeanLedger, readLeanTimeAccounting, verifyLeanEvidence, currentBaselineSlotKind, leanBytesRoot, leanCanonicalBytes, type LeanCorrectionAllocation } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { auditLeanTrainingVector, type LeanColdTrainingManifest, type LeanResponseWork, type LeanResponseNodeReceipt } from "../../packages/strategy-lab/src/league/lean-training.js"
import { validateLeanColdReuse, type LeanColdReuse } from "./v1-38-lean-baseline-reuse.js"
import { readLeanBaselineSource, type LeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { compactLeanBaselineCell, leanBaselineMetricCoverage, type LeanBaselineObservedCell } from "./v1-38-lean-baseline-pipeline.js"
import { analyseLeanDistinctPairs, analyseLeanResponseAdmission, type LeanMeasuredPair } from "./v1-38-lean-baseline-analysis.js"
import { selectLeanBestTrainedProposal, selectLeanTrainedProposal } from "./v1-38-lean-training-adapter.js"
import { validateLeanCorrectionOriginMetadata } from "./v1-38-lean-container-match-session.js"
import { leanCorrectionSourceManifest, readLeanCorrectionPrivateBytes, readLeanCorrectionJson, readLeanCorrectionRequest, publishLeanCorrection, type LeanCorrectionRoute, type LeanCorrectionRequest } from "../run-v1-38-lean-correction.js"
import type { LeanBaselinePair } from "./v1-38-lean-experiment-authority.js"

const fail = (code: string): never => { throw new TypeError(`LEAN_CORRECTION_RETAINED_${code}`) }
const same = (a: unknown, b: unknown) => labRoot("lean-correction-retained-exact-v1", a) === labRoot("lean-correction-retained-exact-v1", b)
const rooted = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v)
interface Observation { schemaVersion: "lean-baseline-observation-v1"; pairRoot: LabRoot; cell: LeanBaselineObservedCell; root: LabRoot }
export interface LeanCorrectionRetainedSnapshot {
  schemaVersion: "lean-correction-retained-snapshot-v1"; allocation: LeanCorrectionAllocation; request: LeanCorrectionRequest
  entry: ReturnType<typeof readLeanChildEntry>; terminal: ReturnType<typeof readLeanChildTerminal>; evidence: ReturnType<typeof verifyLeanEvidence>
  time: ReturnType<typeof readLeanTimeAccounting>; result: Record<string, unknown>; reuse: LeanColdReuse; pairs: readonly LeanBaselinePair[]
  observations: readonly Observation[]; sources: readonly LeanBaselineSource[]; artifacts: Readonly<Record<string, unknown>>; origin: Record<string, unknown> | null; journalBytes: Uint8Array
}
export const auditLeanCorrectionRetained = (value: unknown, guard: () => void = () => {}) => {
  if (!exactLabKeys(value, ["schemaVersion", "allocation", "request", "entry", "terminal", "evidence", "time", "result", "reuse", "pairs", "observations", "sources", "artifacts", "origin", "journalBytes"])) return fail("SNAPSHOT")
  const s = value as unknown as LeanCorrectionRetainedSnapshot, a = admitLeanAllocation(s.allocation), r = s.result
  if (!("route" in a) || s.schemaVersion !== "lean-correction-retained-snapshot-v1") return fail("ALLOCATION")
  const reuse = validateLeanColdReuse(s.reuse, a.sourceRoot), route = a.route
  if (!same(s.request.requestRoots, a.requestRoots) || s.request.route !== route || s.request.sourceRoot !== a.sourceRoot || s.request.reuseGrantRoot !== a.reuseGrantRoot || reuse.grant.root !== a.reuseGrantRoot || s.entry.allocationRoot !== a.root || s.entry.sourceRoot !== a.sourceRoot || s.entry.requestBytesRoot !== leanBytesRoot(leanCanonicalBytes(s.request)) || s.terminal.entryBytesRoot !== leanBytesRoot(leanCanonicalBytes(s.entry)) || s.terminal.allocationRoot !== a.root || s.terminal.sourceRoot !== a.sourceRoot || s.terminal.head !== s.entry.head || s.terminal.status !== "child_exited" || s.terminal.exitCode !== 0 || s.terminal.signal !== null || s.time.active || !s.time.closed.has("pilot-entry")) return fail("CUSTODY")
  if (!exactLabKeys(r, ["schemaVersion", "privacy", "issued", "route", "allocationRoot", "sourceRoot", "requestBytesRoot", "head", "reuseGrantRoot", "pipeline", "evidenceRoot", "cumulativeCharged", "holdoutOpened", "formationMaterialized", "phaseComplete", "root"]) || r.schemaVersion !== "lean-correction-result-v1" || r.privacy !== "private_offline" || r.issued !== false || r.route !== route || r.allocationRoot !== a.root || r.sourceRoot !== a.sourceRoot || r.requestBytesRoot !== s.entry.requestBytesRoot || r.head !== s.entry.head || r.reuseGrantRoot !== reuse.grant.root || r.evidenceRoot !== s.evidence.root || r.cumulativeCharged !== s.evidence.charged || r.holdoutOpened !== false || r.formationMaterialized !== false || r.phaseComplete !== false) return fail("RESULT")
  const { root: resultRoot, ...resultBody } = r
  if (resultRoot !== labRoot("lean-correction-result-v1", resultBody)) return fail("RESULT_ROOT")
  const charged = s.evidence.records.filter(row => row.chargeRoot !== null).length, successful = s.evidence.records.filter(row => row.status === "success").length
  if (!(s.journalBytes instanceof Uint8Array) || s.journalBytes.length > 4_194_304) return fail("JOURNAL")
  const journal = Buffer.from(s.journalBytes).toString("utf8")
  if (journal && !journal.endsWith("\n")) return fail("JOURNAL")
  const events = journal.split("\n").filter(Boolean).map(line => JSON.parse(line) as { kind: string; charge?: { root: LabRoot; slotRoot: LabRoot }; chargeRoot?: LabRoot; record?: unknown })
  if (events.at(-1)?.kind !== "stop" || s.evidence.root !== labRoot("lean-evidence-v1", { allocationRoot: a.root, events, records: s.evidence.records }) || events.filter(e => e.kind === "charge").length !== charged || events.filter(e => e.kind === "terminal").length !== charged) return fail("EVIDENCE")
  if (s.evidence.charged !== a.predecessor.chargedMatches + charged || charged !== s.pairs.length || charged !== s.observations.length || charged > a.slots.length || s.time.elapsedMs < a.predecessor.elapsedUpperBoundMs || s.time.elapsedMs > LEAN_CAPS.elapsedMs || s.evidence.scratchHighWaterBytes > LEAN_CAPS.scratchBytes) return fail("ACCOUNTING")
  const byRole = new Map(s.sources.map(source => [source.role, source]))
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
    if (kind === "initial_training" && !has(ordinal < 4 ? `tactical-${ordinal}` : "teacher-0", "cold-opponent") || (kind === "initial_matrix" || kind === "repeat") && !has("initial-tactical", "initial-teacher") || kind === "response_training" && !(slot.condition < 2 ? pair.bottomRole === "response-0" : pair.topRole === "response-0") || kind === "response_pairing" && !has("final-response", ordinal < 24 ? "initial-tactical" : "initial-teacher") || kind === "probe" && !(slot.condition < 2 ? pair.topRole === "probe" : pair.bottomRole === "probe")) return fail("SCHEDULE")
    if (!exactLabKeys(receipt, ["schemaVersion", "pairRoot", "cell", "root"]) || receipt.schemaVersion !== "lean-baseline-observation-v1" || receipt.pairRoot !== pairRoot || receipt.root !== labRoot("lean-baseline-observation-v1", { schemaVersion: receipt.schemaVersion, pairRoot, cell }) || !exactLabKeys(cell, ["ordinal", "slotRoot", "bottomRoot", "topRoot", "compact", "brainInputs", "strategyInputs", "trainingHalfPoints", "semanticRoot", "metrics", "decisionRoot", "diagnostic"]) || cell.ordinal !== ordinal || cell.slotRoot !== slot.root || cell.bottomRoot !== pair.bottomSourceRoot || cell.topRoot !== pair.topSourceRoot || !same(cell.compact, record.terminal?.record) || !rooted(cell.decisionRoot) || (record.status === "success" ? !rooted(cell.semanticRoot) || cell.diagnostic !== null : cell.semanticRoot !== null) || !Array.isArray(cell.brainInputs) || cell.brainInputs.length > 16 || !Array.isArray(cell.strategyInputs) || cell.strategyInputs.length > 16) return fail("OBSERVATION")
    const { root: metricRoot, ...metricBody } = cell.metrics
    if (metricRoot !== labRoot("lean-baseline-match-metrics-v1", metricBody) || cell.metrics.executionRoot !== cell.compact.executionRoot || cell.metrics.formationComparison !== "inconclusive") return fail("METRIC")
  }
  const pipeline = r.pipeline as Record<string, unknown>
  if (!pipeline || !Array.isArray(pipeline.cells) || pipeline.cells.length !== charged || pipeline.holdoutOpened !== false || pipeline.formationMaterialized !== false) return fail("PIPELINE")
  let originRoot: LabRoot | null = null, observedOrigin: "legacy_deadline" | "unknown" = "unknown"
  if (route === "diagnostic") {
    if (charged !== 1 || s.origin === null || pipeline.status !== "diagnostic_only" || pipeline.training !== null) return fail("DIAGNOSTIC")
    const origin = s.origin
    if (!exactLabKeys(origin, ["schemaVersion", "allocationRoot", "sourceRoot", "pairRoot", "chargeRoot", "origins", "root"]) || origin.schemaVersion !== "lean-correction-origin-envelope-v1" || origin.allocationRoot !== a.root || origin.sourceRoot !== a.sourceRoot || origin.pairRoot !== s.pairs[0]!.root || origin.chargeRoot !== s.evidence.records[0]!.chargeRoot || !Array.isArray(origin.origins) || origin.origins.length > 2) return fail("ORIGIN")
    const { root: oRoot, ...originBody } = origin
    if (oRoot !== labRoot("lean-correction-origin-envelope-v1", originBody)) return fail("ORIGIN_ROOT")
    originRoot = oRoot as LabRoot
    for (const row of origin.origins as { metadata: unknown; sourceRoot: LabRoot; seat: string }[]) {
      if (!exactLabKeys(row, ["metadata", "sourceRoot", "seat"]) || !["bottom", "top"].includes(row.seat) || row.sourceRoot !== (row.seat === "bottom" ? s.pairs[0]!.bottomSourceRoot : s.pairs[0]!.topSourceRoot)) return fail("ORIGIN_SOURCE")
      const metadata = validateLeanCorrectionOriginMetadata(row.metadata)
      if (metadata.brokerBranch === "legacy_deadline" && metadata.waitDisposition === "timed_out" && metadata.transportSignal === "broker_synthetic_sigkill" && metadata.terminationDisposition === "worker_terminate_completed") observedOrigin = "legacy_deadline"
    }
  } else {
    const { root: pipelineRoot, ...pipelineBody } = pipeline
    if (pipelineRoot !== labRoot("lean-current-baseline-pipeline-v1", pipelineBody) || !same(pipeline.cells, s.observations.map(receipt => compactLeanBaselineCell(receipt.cell))) || !same(pipeline.measurement, leanBaselineMetricCoverage(s.observations.map(receipt => receipt.cell))) || !same(s.artifacts["cold-corpus.json"], reuse.corpus) || !same(s.artifacts["initial-proposals.json"], reuse.proposals) || !same(s.artifacts["cold-reuse-grant.json"], reuse.grant)) return fail("REUSED_PIPELINE")
    if (pipeline.status === "current_baseline_complete") auditCompleteBaseline(s, byRole, guard)
    else if (pipeline.status !== "partial_or_failed_baseline") return fail("STATUS")
  }
  const cleanupComplete = s.evidence.records.filter(row => row.terminal !== null).every(row => row.terminal!.record.cleanupComplete)
  const body = { schemaVersion: "lean-correction-retained-v1" as const, status: "retained_valid" as const, route, allocationRoot: a.root, sourceRoot: a.sourceRoot, resultRoot: resultRoot as LabRoot, reuseGrantRoot: reuse.grant.root, evidenceRoot: s.evidence.root, head: s.entry.head, currentCharged: charged, cumulativeCharged: s.evidence.charged, successful, cleanupComplete, originRoot, observedOrigin, initiatingNativeCause: "unknown" as const, complete: route === "baseline" && pipeline.status === "current_baseline_complete", claim: "no_robust_pure_claimed" as const, phaseComplete: false, freezeAdmitted: false, holdoutOpened: false, formationMaterialized: false, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const }
  return { ...body, root: labRoot("lean-correction-retained-v1", body) }
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
}
/** Exactly one invocation; begin marker spends reader identity even on failure. */
export const verifyLeanCorrectionRetained = (path: string, route: LeanCorrectionRoute) => {
  const ledger = openLeanLedger(LEAN_CORRECTION_ROUTES[route].store), allocation = ledger.allocation
  if (!("route" in allocation) || allocation.route !== route) return fail("ALLOCATION")
  const terminal = readLeanChildTerminal(ledger), entry = readLeanChildEntry(ledger)
  if (terminal.status !== "child_exited") return fail("TERMINAL_ONLY_REQUIRED")
  const interval = `correction-${route}-verifier`
  beginLeanInterval(ledger, interval)
  let scratchPeak = 0
  const guard = () => {
    scratchPeak = Math.max(scratchPeak, process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024)
    const scratch = scratchPeak + LEAN_EXTERNAL_SCRATCH_RESERVE, physical = cumulativeLeanPhysicalBytes(ledger)
    if (scratch > LEAN_CAPS.scratchBytes || physical + 65536 > LEAN_CAPS.retainedBytes || scratch + physical + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes || currentLeanElapsedMs(ledger) >= LEAN_CAPS.elapsedMs || leanCorrectionSourceManifest().root !== allocation.sourceRoot || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", maxBuffer: 128 }).trim() !== entry.head) return fail("HOLD_OR_CAPACITY")
  }
  let report: ReturnType<typeof auditLeanCorrectionRetained>
  try {
    guard()
    const { request, reuse } = readLeanCorrectionRequest(path, route)
    const result = readLeanCorrectionJson(join(ledger.directory, "result.json"), 8_388_608) as Record<string, unknown>
    const retainedReuse = readLeanCorrectionJson(join(ledger.directory, "cold-reuse.json"), 4_194_304)
    if (!same(validateLeanColdReuse(retainedReuse, allocation.sourceRoot), reuse)) return fail("REUSE")
    const evidence = verifyLeanEvidence(ledger), state = readLeanLedger(ledger), charged = state.charges.size
    if (!state.stopped) return fail("UNCLOSED")
    const observations = Array.from({ length: charged }, (_, i) => readLeanCorrectionJson(join(ledger.directory, `observation-${i}.json`), 8_388_608) as Observation)
    const pairs = Array.from({ length: charged }, (_, i) => readLeanCorrectionJson(join(ledger.directory, `pair-${i}.json`)) as LeanBaselinePair)
    const names = readdirSync(ledger.directory), sources = names.filter(name => /^source-[a-z0-9-]+\.json$/u.test(name)).map(name => readLeanBaselineSource(ledger.directory, name.slice(7, -5)))
    const artifactNames = ["seal-metadata.json", "cold-corpus.json", "cold-reuse-grant.json", "initial-proposals.json", "initial-selection.json", "initial-training.json", "initial-analysis.json", "response-work.json", "response-training.json", "current-analysis.json"]
    const artifacts = Object.fromEntries(artifactNames.filter(name => names.includes(name)).map(name => [name, readLeanCorrectionJson(join(ledger.directory, name), 2_097_152)]))
    const allowed = new Set(["allocation.json", "ledger.ndjson", "time.ndjson", "entry.json", "child-terminal.json", "result.json", "cold-reuse.json", ...(route === "diagnostic" ? ["correction-origin.json"] : artifactNames), ...sources.map(source => `source-${source.role}.json`), ...pairs.flatMap(pair => [`pair-${pair.ordinal}.json`, `observation-${pair.ordinal}.json`]), ...evidence.records.filter(row => row.terminal?.replay).map(row => `${row.chargeRoot!.slice(7)}.gz`)])
    if (names.some(name => !allowed.has(name))) return fail("INVENTORY")
    report = auditLeanCorrectionRetained({ schemaVersion: "lean-correction-retained-snapshot-v1", allocation, request, entry, terminal, evidence, time: { ...readLeanTimeAccounting(ledger), active: false, elapsedMs: currentLeanElapsedMs(ledger) }, result, reuse: retainedReuse, pairs, observations, sources, artifacts, origin: route === "diagnostic" ? readLeanCorrectionJson(join(ledger.directory, "correction-origin.json")) : null, journalBytes: readLeanCorrectionPrivateBytes(join(ledger.directory, "ledger.ndjson"), 4_194_304) }, guard)
    guard()
    const { root: _root, ...body } = report
    const final = { ...body, cumulativeElapsedMs: currentLeanElapsedMs(ledger), cumulativePhysicalBytes: cumulativeLeanPhysicalBytes(ledger), readerScratchHighWaterBytes: scratchPeak + LEAN_EXTERNAL_SCRATCH_RESERVE }
    const checked = { ...final, root: labRoot("lean-correction-retained-v1", final) }
    publishLeanCorrection(join(ledger.directory, LEAN_CORRECTION_ROUTES[route].check), checked, ledger)
    return checked
  } finally { closeLeanInterval(ledger, interval) }
}
