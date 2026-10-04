/** Trusted, current-only cold-training sequence; every dispatch is host-supervised. */
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { buildPlannerCandidate } from "../../packages/strategy-lab/src/planner/emit.js"
import { emitTacticalSource } from "../../packages/strategy-oracle-tactical/src/emit.js"
import { trainLeanInitialCandidates, trainLeanResponse, type LeanColdTrainingInput, type LeanColdTrainingManifest, type LeanLegalExample } from "../../packages/strategy-lab/src/league/lean-training.js"
import { type LeanCurrentBaselineAllocation, type LeanSlot } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { buildLeanInitialProposals, selectLeanBestTrainedProposal, selectLeanTrainedProposal } from "./v1-38-lean-training-adapter.js"
import { buildLeanColdCorpus } from "./v1-38-lean-cold-corpus.js"
import { buildLeanBaselineSource, type LeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { analyseLeanDistinctPairs, analyseLeanResponseAdmission, selectLeanMixtureTarget, type LeanMeasuredPair } from "./v1-38-lean-baseline-analysis.js"
import type { runLeanBaselineMatch } from "./v1-38-lean-baseline-match.js"
import { inspectLeanSealMetadata } from "./v1-38-lean-seal-metadata.js"

type Observed = Awaited<ReturnType<typeof runLeanBaselineMatch>>
export interface LeanBaselineObservedCell extends Omit<Observed, "replayFrames"> { readonly ordinal: number; readonly slotRoot: LabRoot; readonly bottomRoot: LabRoot; readonly topRoot: LabRoot }
/** Keep the final result bounded. Full legal observations remain in separately
 * rooted private files; neither their bytes nor their source are a public report. */
export const compactLeanBaselineCell = (cell: LeanBaselineObservedCell) => ({
  ordinal: cell.ordinal, slotRoot: cell.slotRoot, bottomRoot: cell.bottomRoot, topRoot: cell.topRoot,
  compact: cell.compact, trainingHalfPoints: cell.trainingHalfPoints,
  semanticRoot: cell.semanticRoot, decisionRoot: cell.decisionRoot,
  metrics: cell.metrics,
  observationRoot: labRoot("lean-baseline-observation-v1", cell),
  brainInputCount: cell.brainInputs.length, strategyInputCount: cell.strategyInputs.length,
  diagnosticRoot: cell.diagnostic === null ? null : labRoot("lean-baseline-cell-diagnostic-v1", cell.diagnostic),
})
const fail = (code: string): never => { throw new TypeError(`LEAN_BASELINE_PIPELINE_${code}`) }
const trainingPoints = (cell: LeanBaselineObservedCell): 0 | 1 | 2 => cell.trainingHalfPoints ?? fail("TRAINING_POINTS")
export const leanBaselineMetricCoverage = (cells: readonly LeanBaselineObservedCell[]) => ({
  cells: cells.length,
  missingByCell: cells.map(cell => ({ ordinal: cell.ordinal, missing: cell.metrics.missing })),
  formationComparison: "inconclusive" as const,
})
export const leanColdProcedureRoot = (seed: string): LabRoot => labRoot("lean-common-nonlearned-procedure-v1", { seed, tuple: "current-canonical-v1.37", corpus: "canonical-prefix-turn-left-right-v1", teacher: { hypothesis: "aggressive", depth: 6, nodes: 64, resampling: "canonical-order-round-robin-v1" }, tactical: { evaluations: 64, beam: 4, space: "tactical-adaptation-25-v1" }, response: { attempt: 1, nodes: 128 }, budget: { initialTraining: 8, initialMatrix: 4, responseTraining: 8, responsePairing: 8, probe: 4, repeat: 4 }, modelHumanExternal: 0 })

/** Resampling is explicit, deterministic and local to a completed Match. It
 * supplies legal observations, never additional Match or oracle evidence. */
const observedExamples = (cells: readonly LeanBaselineObservedCell[], perMatch: number): LeanLegalExample[] => cells.flatMap(cell => {
  if (cell.compact.classification !== "success" || cell.trainingHalfPoints === null || !cell.brainInputs.length) return fail("TRAINING_OBSERVATION")
  return Array.from({ length: perMatch }, (_, ordinal) => ({ input: cell.brainInputs[ordinal % cell.brainInputs.length]!, trainingHalfPoints: trainingPoints(cell), trainingMatchRoot: cell.compact.executionRoot }))
})
const measured = (cell: LeanBaselineObservedCell): LeanMeasuredPair => {
  if (cell.compact.classification !== "success" || !cell.compact.outcome || !cell.semanticRoot) return fail("PAIR_EVIDENCE")
  return { ordinal: cell.ordinal, bottomSourceRoot: cell.bottomRoot, topSourceRoot: cell.topRoot, outcome: cell.compact.outcome, executionRoot: cell.compact.executionRoot, semanticRoot: cell.semanticRoot }
}

export const executeLeanCurrentPipeline = async (input: {
  allocation: LeanCurrentBaselineAllocation
  freezeSource: (source: LeanBaselineSource) => void
  retainArtifact: (name: string, value: unknown) => void
  checkpoint: () => void
  dispatch: (slot: LeanSlot, bottom: LeanBaselineSource, top: LeanBaselineSource, observedRole?: string) => Promise<LeanBaselineObservedCell>
}) => {
  const allocation = input.allocation
  if (allocation.coldRoot !== leanColdProcedureRoot(allocation.seed) || allocation.slots.length !== 36) return fail("ALLOCATION")
  const sources = new Map<string, LeanBaselineSource>(), cells: LeanBaselineObservedCell[] = []
  // Metadata inventory and an explicit deferral precede all learned outputs;
  // no original seal is silently replaced and all reserved cells stay unused.
  input.retainArtifact("seal-metadata.json", inspectLeanSealMetadata())
  const freeze = (role: string, source: string) => {
    if (sources.has(role)) return fail("SOURCE_REFREEZE")
    const snapshot = buildLeanBaselineSource({ role, source, coldRoot: allocation.coldRoot, implementationRoot: allocation.sourceRoot })
    input.freezeSource(snapshot); sources.set(role, snapshot); return snapshot
  }
  // Opponent and probe are independently frozen before candidate outputs.
  const opponent = freeze("cold-opponent", emitTacticalSource())
  const probe = freeze("probe", buildPlannerCandidate().source)
  const corpus = buildLeanColdCorpus(allocation.seed)
  input.checkpoint(); input.retainArtifact("cold-corpus.json", corpus)
  const proposals = buildLeanInitialProposals({ commonSourceRoot: allocation.coldRoot, tacticalInputs: corpus.tacticalInputs, teacherSearchReceipts: corpus.teacherSearchReceipts })
  input.retainArtifact("initial-proposals.json", proposals)
  const tacticalVariants = proposals.tactical.map((proposal, ordinal) => freeze(`tactical-${ordinal}`, proposal.source))
  const teacherVariant = freeze("teacher-0", proposals.teacher.source)
  const dispatch = async (ordinal: number, entrant: LeanBaselineSource, target: LeanBaselineSource, observedRole?: string) => {
    const slot = allocation.slots[ordinal] ?? fail("SLOT")
    const bottom = slot.condition < 2 ? entrant : target, top = slot.condition < 2 ? target : entrant
    const cell = await input.dispatch(slot, bottom, top, observedRole)
    if (cell.ordinal !== ordinal || cell.slotRoot !== slot.root || cell.bottomRoot !== bottom.sourceRoot || cell.topRoot !== top.sourceRoot) return fail("DISPATCH_JOIN")
    cells.push(cell)
    if (cell.compact.classification !== "success" || !cell.compact.cleanupComplete) return null
    return cell
  }
  const partial = (stage: string, training: LeanColdTrainingManifest | null) => {
    const body = { status: "partial_or_failed_baseline" as const, stage, training, cells: cells.map(compactLeanBaselineCell), measurement: leanBaselineMetricCoverage(cells), sources: [...sources.values()].map(s => ({ role: s.role, sourceRoot: s.sourceRoot, snapshotRoot: s.root })), holdoutOpened: false, formationMaterialized: false }
    return { ...body, root: labRoot("lean-current-baseline-pipeline-v1", body) }
  }
  const tacticalTraining: LeanBaselineObservedCell[] = [], teacherTraining: LeanBaselineObservedCell[] = []
  for (let ordinal = 0; ordinal < 8; ordinal++) {
    const entrant = ordinal < 4 ? tacticalVariants[ordinal]! : teacherVariant
    const cell = await dispatch(ordinal, entrant, opponent, entrant.role)
    if (!cell) return partial("initial_training", null)
    ;(ordinal < 4 ? tacticalTraining : teacherTraining).push(cell)
  }
  const tacticalSelection = selectLeanBestTrainedProposal(proposals.tactical, tacticalTraining.map((cell, index) => ({ proposalRoot: proposals.tactical[index]!.root, trainingMatchRoot: cell.compact.executionRoot, trainingHalfPoints: trainingPoints(cell) })))
  const teacherSelection = selectLeanTrainedProposal(proposals.teacher, teacherTraining.map(cell => ({ trainingMatchRoot: cell.compact.executionRoot, trainingHalfPoints: trainingPoints(cell) })))
  input.retainArtifact("initial-selection.json", { tactical: tacticalSelection, teacher: teacherSelection, limitation: "one-match-per-tactical-variation-condition-confounded-no-strength-claim" })
  const common: LeanColdTrainingInput = { coldRoot: allocation.coldRoot, corpusRoot: corpus.corpusRoot, armRoot: labRoot("lean-current-arm-v1", allocation.coldRoot), commonSourceRoot: allocation.coldRoot, frozenTacticalInputs: corpus.tacticalInputs, teacherSearchReceipts: corpus.teacherSearchReceipts, trainingExamples: [...observedExamples(tacticalTraining, 16), ...observedExamples(teacherTraining, 16)] }
  const initial = trainLeanInitialCandidates(common, {
    tactical: () => ({ source: tacticalSelection.selectedSource, decision: { proposalSetRoot: proposals.root, selectionRoot: tacticalSelection.root, supervisedMatchRoots: tacticalTraining.map(c => c.compact.executionRoot) }, evaluatedLegalInputRoots: proposals.tactical[0]!.inputRoots, teacherSearchNodeRoots: [], distillationExampleRoots: [] }),
    teacher: () => ({ source: teacherSelection.selectedSource, decision: { proposalSetRoot: proposals.root, selectionRoot: teacherSelection.root, distinctLegalLabels: proposals.teacherProjectedDistinctLabelCount, resamplingRoot: proposals.teacherResamplingRoot }, evaluatedLegalInputRoots: [], teacherSearchNodeRoots: proposals.teacherSearchNodeRoots, distillationExampleRoots: proposals.distillationExampleRoots }),
  })
  input.retainArtifact("initial-training.json", initial)
  if (initial.candidates.some(c => c.disposition === "clone_rejected" || c.disposition === "invalid_rejected")) return partial("initial_rejected", initial)
  const tactical = freeze("initial-tactical", tacticalSelection.selectedSource), teacher = freeze("initial-teacher", teacherSelection.selectedSource)
  const initialMatrix: LeanBaselineObservedCell[] = []
  for (let ordinal = 8; ordinal < 12; ordinal++) {
    const cell = await dispatch(ordinal, tactical, teacher)
    if (!cell) return partial("initial_matrix", initial)
    initialMatrix.push(cell)
  }
  const initialAnalysis = analyseLeanDistinctPairs([tactical.sourceRoot, teacher.sourceRoot], initialMatrix.map(measured))
  input.retainArtifact("initial-analysis.json", initialAnalysis)
  if (!initialAnalysis.mixture) return partial("initial_solver_unsupported", initial)
  const initialByRoot = new Map([tactical, teacher].map(s => [s.sourceRoot, s]))
  const strongest = initialByRoot.get(initialAnalysis.selectedPureRoot) ?? fail("PURE")
  // A fixed nonlearned planner is the one response attempt's supervised draft.
  // Its final bounded parameter is selected only after the eight training rows.
  const responseDraft = freeze("response-0", buildPlannerCandidate().source)
  const responseTraining: LeanBaselineObservedCell[] = []
  for (let ordinal = 12; ordinal < 20; ordinal++) {
    const target = ordinal < 16 ? initialByRoot.get(selectLeanMixtureTarget(initialAnalysis.mixture, ordinal - 12))! : strongest
    const cell = await dispatch(ordinal, responseDraft, target, responseDraft.role)
    if (!cell) return partial("response_training", initial)
    responseTraining.push(cell)
  }
  if (responseTraining.some(cell => !cell.strategyInputs.length)) return partial("response_observation_missing", initial)
  const trained = trainLeanResponse({ ...common, initial, responseExamples: observedExamples(responseTraining, 8), responsePlannerNodes: responseTraining.map(cell => ({ input: cell.strategyInputs[0]!, trainingMatchRoot: cell.compact.executionRoot })), targetRoots: { mixture: labRoot("lean-frozen-initial-mixture-v1", initialAnalysis.mixture), strongestPure: strongest.sourceRoot } }, work => input.retainArtifact("response-work.json", work))
  input.retainArtifact("response-training.json", trained)
  const responseCandidate = trained.candidates.find(c => c.mechanism === "response") ?? fail("RESPONSE")
  if (responseCandidate.disposition === "clone_rejected" || responseCandidate.disposition === "invalid_rejected" || responseCandidate.disposition === "weak_preserved") return partial("response_attempt_rejected_unused_pairings", trained)
  const response = freeze("final-response", responseCandidate.source)
  const responseMatrix: LeanBaselineObservedCell[] = []
  for (let ordinal = 20; ordinal < 28; ordinal++) {
    const target = ordinal < 24 ? tactical : teacher
    const cell = await dispatch(ordinal, response, target)
    if (!cell) return partial("response_pairings", trained)
    responseMatrix.push(cell)
  }
  const matrix = [...initialMatrix, ...responseMatrix]
  const analysis = analyseLeanDistinctPairs([tactical.sourceRoot, teacher.sourceRoot, response.sourceRoot], matrix.map(measured))
  input.retainArtifact("current-analysis.json", analysis)
  const responseAdmission = analyseLeanResponseAdmission({ initialSources: [tactical.sourceRoot, teacher.sourceRoot], frozenMixture: initialAnalysis.mixture, strongestPureRoot: strongest.sourceRoot, strongestInitialMinimumHalfPoints: initialAnalysis.pure[0]!.minimumHalfPoints, responseRoot: response.sourceRoot, responseCells: responseMatrix.map(measured) })
  // Preserve all eight response rows and the three-source diagnostic matrix.
  // The missing strongest-pure self-pair is not repaired with extra Matches.
  const eligible = responseAdmission.admitted ? [tactical, teacher, response] : [tactical, teacher]
  const selectedRanking = analysis.pure.find(row => eligible.some(s => s.sourceRoot === row.sourceRoot)) ?? fail("SELECTED_PURE")
  const selected = eligible.find(s => s.sourceRoot === selectedRanking.sourceRoot) ?? fail("SELECTED_PURE")
  const probes: LeanBaselineObservedCell[] = []
  for (let ordinal = 28; ordinal < 32; ordinal++) {
    const cell = await dispatch(ordinal, selected, probe)
    if (!cell) return partial("probe", trained)
    probes.push(cell)
  }
  const repeats: LeanBaselineObservedCell[] = []
  for (let ordinal = 32; ordinal < 36; ordinal++) {
    const cell = await dispatch(ordinal, tactical, teacher)
    if (!cell) return partial("repeat", trained)
    repeats.push(cell)
  }
  const repeatEqual = repeats.every((cell, index) => cell.semanticRoot === initialMatrix[index]!.semanticRoot)
  const probePoints: number[] = probes.map(cell => cell.compact.outcome === "DRAW" ? 1 : (cell.compact.outcome === "bottom" ? cell.bottomRoot : cell.topRoot) === selected.sourceRoot ? 2 : 0)
  const body = { status: repeatEqual ? "current_baseline_complete" as const : "partial_or_failed_baseline" as const, stage: repeatEqual ? "complete" : "deterministic_repeat_mismatch", training: trained, cells: cells.map(compactLeanBaselineCell), measurement: leanBaselineMetricCoverage(cells), sources: [...sources.values()].map(s => ({ role: s.role, sourceRoot: s.sourceRoot, snapshotRoot: s.root })), initialAnalysisRoot: initialAnalysis.root, analysisRoot: analysis.root, selectedPureRoot: selected.sourceRoot, eligiblePureRoots: eligible.map(s => s.sourceRoot).sort(), response: { attemptCount: 1, ...responseAdmission }, probe: { matches: 4, meanHalfPoints: probePoints.reduce((sum, value) => sum + value, 0) / 4, mechanismSharesPlannerWithResponse: true, independenceStrengthClaim: false }, repeat: { matches: 4, semanticEqual: repeatEqual }, solver: { completeDistinctPairCells: 12, repeatsExcluded: true, noHistoricalFullSnapshotCredit: true }, claim: "no_robust_pure_claimed", holdoutOpened: false, formationMaterialized: false }
  return { ...body, root: labRoot("lean-current-baseline-pipeline-v1", body) }
}
