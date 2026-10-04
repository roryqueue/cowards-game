import { createHash } from "node:crypto"
import { SoldierBrainInputV119Schema, type Action, type SoldierBrainInputV119 } from "../../packages/spec/src/index.js"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { deriveFactorySourceStructureRoot } from "../../packages/strategy-lab/src/factory/fingerprint.js"
import {
  admitTacticalAdaptationProfile,
  emitProfiledTacticalSource,
  scoreTacticalAction,
  TACTICAL_ADAPTATION_PROFILES,
  type TacticalAdaptationProfile,
} from "../../packages/strategy-oracle-tactical/src/index.js"
import { tacticalActionChoices } from "../../packages/strategy-oracle-tactical/src/scoring.js"
import {
  distillLegalStudent,
  emitTeacherSource,
  projectTeacherSearchToLegalTraining,
  type LegalTrainingRecord,
} from "../../packages/strategy-oracle-teacher/src/index.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code: string): never => { throw new TypeError(`LEAN_TRAINING_ADAPTER_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const sourceRoot = (source: string): LabRoot => `sha256:${createHash("sha256").update(source, "utf8").digest("hex")}` as LabRoot
const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  labRoot("lean-input-equality-v1", left) === labRoot("lean-input-equality-v1", right)

export interface LeanInitialProposalInput {
  readonly commonSourceRoot: LabRoot
  /** Sixty-four already schema-admitted legal ABI observations from the frozen cold corpus. */
  readonly tacticalInputs: readonly SoldierBrainInputV119[]
  /** Canonical MATCH_KERNEL receipt(s), whose combined charged-node and projected-label counts are exact. */
  readonly teacherSearchReceipts: readonly unknown[]
}

export interface LeanMechanismProposal {
  readonly mechanism: "tactical" | "teacher"
  readonly source: string
  readonly sourceRoot: LabRoot
  readonly structureRoot: LabRoot
  readonly parameterRoot: LabRoot
  readonly decisionRoot: LabRoot
  readonly inputRoots: readonly LabRoot[]
  readonly root: LabRoot
}

export interface LeanInitialProposalSet {
  readonly schemaVersion: "lean-initial-proposals-v1"
  readonly commonSourceRoot: LabRoot
  readonly frozenTacticalSearchSpaceRoot: LabRoot
  readonly tactical: readonly LeanMechanismProposal[]
  readonly teacher: LeanMechanismProposal
  readonly operations: Readonly<{ tacticalEvaluations: 64; teacherSearchNodes: 64; distillationExamples: 64; maximumTacticalBeam: 4 }>
  readonly teacherReceiptRoots: readonly LabRoot[]
  readonly teacherSearchNodeRoots: readonly LabRoot[]
  readonly distillationExampleRoots: readonly LabRoot[]
  readonly teacherProjectedDistinctLabelCount: number
  readonly teacherResamplingRoot: LabRoot
  readonly root: LabRoot
}

export interface LeanTrainingResultRow {
  readonly trainingMatchRoot: LabRoot
  readonly trainingHalfPoints: 0 | 1 | 2
}

export interface LeanBeamTrainingResultRow extends LeanTrainingResultRow {
  readonly proposalRoot: LabRoot
}

export interface LeanProposalSelection {
  readonly schemaVersion: "lean-proposal-selection-v1"
  readonly proposalRoot: LabRoot
  readonly selectedSource: string
  readonly selectedSourceRoot: LabRoot
  readonly selectedStructureRoot: LabRoot
  readonly trainingMatchRoots: readonly LabRoot[]
  readonly trainingMatchCount: number
  readonly trainingHalfPoints: number
  readonly disposition: "accepted_for_evaluation" | "weak_preserved"
  readonly decisionRoot: LabRoot
  readonly root: LabRoot
}

const proposal = (mechanism: LeanMechanismProposal["mechanism"], source: string, parameterRoot: LabRoot, decision: unknown, inputRoots: readonly LabRoot[]): LeanMechanismProposal => {
  if (!source || new TextEncoder().encode(source).byteLength > 65_536) return fail("SOURCE_SIZE")
  const sourceIdentity = sourceRoot(source)
  const body = { mechanism, source, sourceRoot: sourceIdentity, structureRoot: deriveFactorySourceStructureRoot(new TextEncoder().encode(source)), parameterRoot, decisionRoot: labRoot("lean-mechanism-proposal-decision-v1", decision), inputRoots: [...inputRoots] }
  return Object.freeze({ ...body, root: labRoot("lean-mechanism-proposal-v1", body) })
}

const parseTacticalInputs = (inputs: readonly SoldierBrainInputV119[]): readonly SoldierBrainInputV119[] => {
  if (!Array.isArray(inputs) || inputs.length !== 64) return fail("TACTICAL_INPUT_COUNT")
  return Object.freeze(inputs.map((input) => {
    let parsed: SoldierBrainInputV119
    try { parsed = SoldierBrainInputV119Schema.parse(input) as SoldierBrainInputV119 } catch { return fail("TACTICAL_LEGAL_INPUT") }
    if (!sameCanonicalValue(parsed, input)) return fail("TACTICAL_INPUT_CANONICAL")
    return parsed
  }))
}

const tacticalProposalBeam = (inputs: readonly SoldierBrainInputV119[], commonSourceRoot: LabRoot): readonly LeanMechanismProposal[] => {
  const actions = tacticalActionChoices()
  // One genuine tactical scorer evaluation per retained legal input. The candidate
  // parameter grid is evaluated against this cached vector; it triggers no replays.
  const evaluations = inputs.map((input, ordinal) => {
    const nearestEnemy = input.awarenessGrid.cells
      .filter((cell) => cell.contents === "ENEMY_ACTIVE")
      .sort((left, right) => Math.abs(left.dx) + Math.abs(left.dy) - Math.abs(right.dx) - Math.abs(right.dy) || left.dy - right.dy || left.dx - right.dx)[0]
    const actionOrdinal = ((input.cycleIndex + (input.hasAdvancedThisActivation ? 4 : 0) + (nearestEnemy?.dx ?? 0) * 2 + (nearestEnemy?.dy ?? 0) + actions.length * 2) % actions.length + actions.length) % actions.length
    const action = actions[actionOrdinal]!
    const rank = scoreTacticalAction(input, action, null, actionOrdinal)
    return Object.freeze({ ordinal, inputRoot: labRoot("runtime-input", input), action, rank })
  })
  if (evaluations.length !== 64) return fail("TACTICAL_EVALUATION_COUNT")
  const grid = TACTICAL_ADAPTATION_PROFILES.map((profile) => admitTacticalAdaptationProfile(profile))
  const gridRoot = labRoot("lean-tactical-frozen-search-space-v1", grid.map((entry) => entry.root))
  const ranked = grid.map((profile) => {
    // Weight the cached scorer value by the frozen profile coefficient. The
    // interaction preserves input-conditioned rankings; adding a coefficient
    // alone would sum to a corpus-independent constant over action categories.
    const score = evaluations.reduce((sum, evaluation) => sum + evaluation.rank.soft * profile.actionWeights[evaluation.action.type], 0)
    return { profile, score }
  }).sort((left, right) => right.score - left.score || left.profile.id.localeCompare(right.profile.id))
  const selected = ranked.slice(0, 4)
  if (selected.length !== 4 || new Set(selected.map(({ profile }) => profile.root)).size !== 4) return fail("TACTICAL_BEAM")
  const inputRoots = evaluations.map((row) => row.inputRoot)
  const evaluationRoot = labRoot("lean-tactical-evaluations-v1", evaluations)
  return Object.freeze(selected.map(({ profile, score }) => proposal("tactical", emitProfiledTacticalSource(profile), profile.root, {
    commonSourceRoot,
    frozenSearchSpaceRoot: gridRoot,
    beamWidth: 4,
    profileRoot: profile.root,
    cachedEvaluationRoot: evaluationRoot,
    cachedInputCount: evaluations.length,
    cachedWeightedRank: score,
    scorer: "scoreTacticalAction-v1",
  }, inputRoots)))
}

const teacherProposal = (receipts: readonly unknown[]): Readonly<{ candidate: LeanMechanismProposal; receiptRoots: readonly LabRoot[]; nodeRoots: readonly LabRoot[]; exampleRoots: readonly LabRoot[]; distinctLabels: number; resamplingRoot: LabRoot }> => {
  if (!Array.isArray(receipts) || receipts.length === 0) return fail("TEACHER_RECEIPTS")
  let chargedNodes = 0
  const records: LegalTrainingRecord[] = []
  const receiptRoots: LabRoot[] = []
  const nodeRoots: LabRoot[] = []
  for (const receipt of receipts) {
    if (!receipt || typeof receipt !== "object" || Array.isArray(receipt) || (receipt as { offlineOnly?: unknown }).offlineOnly !== true) return fail("TEACHER_RECEIPT")
    const value = receipt as { nodesVisited?: unknown }
    if (!Number.isSafeInteger(value.nodesVisited) || Number(value.nodesVisited) < 0) return fail("TEACHER_NODE_COUNT")
    const projected = projectTeacherSearchToLegalTraining(receipt)
    const receiptRoot = labRoot("lean-canonical-teacher-receipt-v1", receipt)
    receiptRoots.push(receiptRoot)
    chargedNodes += Number(value.nodesVisited)
    records.push(...projected)
    for (let offset = 0; offset < Number(value.nodesVisited); offset++) nodeRoots.push(labRoot("lean-teacher-search-work-index-v1", { receiptRoot, ordinal: offset }))
  }
  if (chargedNodes !== 64 || nodeRoots.length !== 64) return fail("TEACHER_EXACT_NODES")
  if (records.length === 0) return fail("TEACHER_NO_LEGAL_LABELS")
  // The canonical teacher receipt may retain fewer than 64 targets. Fill the
  // fixed distillation work vector by deterministic round-robin resampling of
  // those authentic labels; the distinct-label denominator is reported.
  const sampled = Array.from({ length: 64 }, (_, ordinal) => ({ ordinal, sourceOrdinal: ordinal % records.length, record: records[ordinal % records.length]! }))
  const exampleRoots = sampled.map(({ ordinal, sourceOrdinal, record }) => labRoot("lean-teacher-distillation-example-v1", { ordinal, sourceOrdinal, record }))
  const resamplingRoot = labRoot("lean-teacher-legal-label-resampling-v1", { rule: "canonical-order-round-robin-v1", sourceLabelCount: records.length, sampleCount: sampled.length, exampleRoots })
  const student = distillLegalStudent(sampled.map((row) => row.record))
  const source = emitTeacherSource(student)
  const inputRoots = sampled.map(({ record }) => labRoot("runtime-input", record.input))
  const candidate = proposal("teacher", source, student.controllerRoot, {
    algorithm: "canonical-kernel-search-then-legal-projection-distillation-v1",
    teacherControllerRoot: student.controllerRoot,
    receiptRoots,
    receiptNodeCount: chargedNodes,
    distillationExampleCount: sampled.length,
    uniqueProjectedLegalLabelCount: records.length,
    deterministicResamplingRoot: resamplingRoot,
    distillationExampleRoots: exampleRoots,
    projectedAbiKinds: { activation: records.filter((record) => record.kind === "activation").length, brain: records.filter((record) => record.kind === "brain").length },
    deployedPolicyContainsOnlyLegalFeatureProjection: true,
  }, inputRoots)
  return Object.freeze({ candidate, receiptRoots: Object.freeze(receiptRoots), nodeRoots: Object.freeze(nodeRoots), exampleRoots: Object.freeze(exampleRoots), distinctLabels: records.length, resamplingRoot })
}

/**
 * Creates frozen, legal-input-dependent candidates before any supervised training
 * Match. No candidate source is executed here; source strings are emitted data.
 */
export const buildLeanInitialProposals = (input: LeanInitialProposalInput): LeanInitialProposalSet => {
  if (!isRoot(input.commonSourceRoot)) return fail("COMMON_SOURCE_ROOT")
  const legalInputs = parseTacticalInputs(input.tacticalInputs)
  const tactical = tacticalProposalBeam(legalInputs, input.commonSourceRoot)
  const teacher = teacherProposal(input.teacherSearchReceipts)
  const value = {
    schemaVersion: "lean-initial-proposals-v1" as const,
    commonSourceRoot: input.commonSourceRoot,
    frozenTacticalSearchSpaceRoot: labRoot("lean-tactical-search-space-binding-v1", { root: labRoot("lean-tactical-frozen-search-space-v1", TACTICAL_ADAPTATION_PROFILES.map((profile) => profile.root)), maximumBeam: 4 }),
    tactical,
    teacher: teacher.candidate,
    operations: Object.freeze({ tacticalEvaluations: 64 as const, teacherSearchNodes: 64 as const, distillationExamples: 64 as const, maximumTacticalBeam: 4 as const }),
    teacherReceiptRoots: teacher.receiptRoots,
    teacherSearchNodeRoots: teacher.nodeRoots,
    distillationExampleRoots: teacher.exampleRoots,
    teacherProjectedDistinctLabelCount: teacher.distinctLabels,
    teacherResamplingRoot: teacher.resamplingRoot,
  }
  return Object.freeze({ ...value, root: labRoot("lean-initial-proposals-v1", value) })
}

/** Selects one already-proposed source only from its four actual supervised Match result rows. */
export const selectLeanTrainedProposal = (candidate: LeanMechanismProposal, rows: readonly LeanTrainingResultRow[]): LeanProposalSelection => {
  if (!candidate || !isRoot(candidate.root) || !isRoot(candidate.sourceRoot) || !isRoot(candidate.structureRoot)) return fail("PROPOSAL")
  if (!Array.isArray(rows) || rows.length !== 4 || rows.some((row) => !row || !isRoot(row.trainingMatchRoot) || ![0, 1, 2].includes(row.trainingHalfPoints)) || new Set(rows.map((row) => row.trainingMatchRoot)).size !== 4) return fail("TRAINING_RESULT_ROWS")
  const matchRoots = rows.map((row) => row.trainingMatchRoot).sort()
  const total = rows.reduce((sum, row) => sum + row.trainingHalfPoints, 0)
  const disposition = total > 0 ? "accepted_for_evaluation" as const : "weak_preserved" as const
  const decision = { proposalRoot: candidate.root, mechanism: candidate.mechanism, sourceRoot: candidate.sourceRoot, trainingMatchRoots: matchRoots, trainingMatchCount: 4, trainingHalfPoints: total, disposition, selection: "four-match-half-points-then-lexical-source-root-v1" }
  const value = {
    schemaVersion: "lean-proposal-selection-v1" as const,
    proposalRoot: candidate.root,
    selectedSource: candidate.source,
    selectedSourceRoot: candidate.sourceRoot,
    selectedStructureRoot: candidate.structureRoot,
    trainingMatchRoots: Object.freeze(matchRoots),
    trainingMatchCount: 4,
    trainingHalfPoints: total,
    disposition,
    decisionRoot: labRoot("lean-proposal-selection-decision-v1", decision),
  }
  return Object.freeze({ ...value, root: labRoot("lean-proposal-selection-v1", value) })
}

/** One allocated training Match per tactical beam member; exactly four total, no per-variant reruns. */
export const selectLeanBestTrainedProposal = (proposals: readonly LeanMechanismProposal[], rows: readonly LeanBeamTrainingResultRow[]): LeanProposalSelection => {
  if (!Array.isArray(proposals) || proposals.length !== 4 || !Array.isArray(rows) || rows.length !== 4) return fail("PROPOSAL_BEAM")
  const byRoot = new Map(proposals.map((candidate) => [candidate.root, candidate]))
  if (byRoot.size !== 4 || rows.some((row) => !row || !isRoot(row.proposalRoot) || !byRoot.has(row.proposalRoot) || !isRoot(row.trainingMatchRoot) || ![0, 1, 2].includes(row.trainingHalfPoints)) || new Set(rows.map((row) => row.trainingMatchRoot)).size !== 4 || new Set(rows.map((row) => row.proposalRoot)).size !== 4) return fail("BEAM_TRAINING_ROWS")
  const ranked = rows.map((row) => ({ proposal: byRoot.get(row.proposalRoot)!, row })).sort((left, right) => right.row.trainingHalfPoints - left.row.trainingHalfPoints || left.proposal.sourceRoot.localeCompare(right.proposal.sourceRoot))
  const winner = ranked[0]!
  const decision = {
    policy: "one-match-per-beam-variant-then-lexical-source-root-v1",
    trainingMatchCountPerVariant: 1,
    beamWidth: 4,
    results: ranked.map(({ proposal: candidate, row }) => ({ proposalRoot: candidate.root, sourceRoot: candidate.sourceRoot, trainingMatchRoot: row.trainingMatchRoot, trainingHalfPoints: row.trainingHalfPoints })).sort((left, right) => left.sourceRoot.localeCompare(right.sourceRoot)),
    selectedProposalRoot: winner.proposal.root,
  }
  const disposition = winner.row.trainingHalfPoints > 0 ? "accepted_for_evaluation" as const : "weak_preserved" as const
  const value = {
    schemaVersion: "lean-proposal-selection-v1" as const,
    proposalRoot: winner.proposal.root,
    selectedSource: winner.proposal.source,
    selectedSourceRoot: winner.proposal.sourceRoot,
    selectedStructureRoot: winner.proposal.structureRoot,
    trainingMatchRoots: Object.freeze([winner.row.trainingMatchRoot]),
    trainingMatchCount: 1,
    trainingHalfPoints: winner.row.trainingHalfPoints,
    disposition,
    decisionRoot: labRoot("lean-proposal-selection-decision-v1", decision),
  }
  return Object.freeze({ ...value, root: labRoot("lean-proposal-selection-v1", value) })
}

/** Useful to validate that an emitted candidate's declared legal input roots are reproducible. */
export const leanProposalInputRoots = (candidate: LeanMechanismProposal): readonly LabRoot[] => {
  if (!candidate || !Array.isArray(candidate.inputRoots) || candidate.inputRoots.some((root) => !isRoot(root))) return fail("PROPOSAL_INPUT_ROOTS")
  return Object.freeze([...candidate.inputRoots])
}

export type { Action }
