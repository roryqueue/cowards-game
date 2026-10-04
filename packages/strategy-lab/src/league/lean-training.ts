import { createHash } from "node:crypto"
import { labRoot, type LabRoot } from "../contracts.js"
import { deriveFactorySourceStructureRoot } from "../factory/fingerprint.js"
import { SoldierBrainInputV119Schema, StrategyInputV119Schema, type Action, type SoldierBrainInputV119, type StrategyInputV119 } from "../../../spec/src/index.js"
import { buildPlannerCandidate } from "../planner/emit.js"
import { selectPlannerActivations } from "../planner/assign.js"

export const LEAN_TRAINING_VECTOR = Object.freeze({ tacticalEvaluations: 64, teacherSearchNodes: 64, distillationExamples: 64, responseNodes: 128, totalChannelOperations: 320 })
export type LeanCandidateMechanism = "tactical" | "teacher" | "response"
export type LeanCandidateDisposition = "accepted_for_evaluation" | "clone_rejected" | "invalid_rejected" | "weak_preserved"

export interface LeanLegalExample {
  readonly input: SoldierBrainInputV119
  /** A score projected from the completed, supervised training Match. */
  readonly trainingHalfPoints: 0 | 1 | 2
  readonly trainingMatchRoot: LabRoot
}
export interface LeanColdTrainingManifest {
  readonly schemaVersion: "lean-cold-training-manifest-v1"
  readonly coldRoot: LabRoot
  readonly corpusRoot: LabRoot
  readonly armRoot: LabRoot
  readonly candidates: readonly Readonly<{
    mechanism: LeanCandidateMechanism
    source: string
    sourceRoot: LabRoot
    structureRoot: LabRoot
    decisionRoot: LabRoot
    disposition: LeanCandidateDisposition
    trainingMatchRoots: readonly LabRoot[]
  }>[]
  readonly vector: typeof LEAN_TRAINING_VECTOR
  readonly root: LabRoot
}
export interface LeanColdTrainingInput {
  readonly coldRoot: LabRoot
  readonly corpusRoot: LabRoot
  readonly armRoot: LabRoot
  /** Exactly eight already-supervised training Match records, four per initial slot. */
  readonly trainingExamples: readonly LeanLegalExample[]
  /** Canonical-kernel teacher receipts; exact node count is checked before distillation. */
  readonly teacherSearchReceipts: readonly unknown[]
  /** The candidate-free source root prevents cross-arm learned predecessor reuse. */
  readonly commonSourceRoot: LabRoot
  readonly predecessorRoot?: never
}
export interface LeanResponseInput extends LeanColdTrainingInput {
  readonly initial: LeanColdTrainingManifest
  /** Eight already-supervised response-training Matches; each includes legal ABI examples. */
  readonly responseExamples: readonly LeanLegalExample[]
  /** 128 exact legal planner input nodes, rooted to the eight response Matches. */
  readonly responsePlannerNodes: readonly Readonly<{ input: StrategyInputV119; trainingMatchRoot: LabRoot }>[]
  readonly targetRoots: Readonly<{ mixture: LabRoot; strongestPure: LabRoot }>
}
export interface LeanMechanismBuild {
  readonly source: string
  readonly decision: unknown
  readonly evaluatedLegalInputRoots: readonly LabRoot[]
  readonly teacherSearchNodeRoots: readonly LabRoot[]
  readonly distillationExampleRoots: readonly LabRoot[]
}
/** Trusted adapters live above strategy-lab to avoid a reverse package dependency cycle. */
export interface LeanInitialMechanismBuilders {
  readonly tactical: (examples: readonly LeanLegalExample[]) => LeanMechanismBuild
  readonly teacher: (receipts: readonly unknown[], examples: readonly LeanLegalExample[]) => LeanMechanismBuild
}

const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code: string): never => { throw new TypeError(`LEAN_TRAINING_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
const validateExamples = (examples: readonly LeanLegalExample[], expectedMatches: number, expectedExamples = 64): readonly LeanLegalExample[] => {
  if (!Array.isArray(examples) || examples.length !== expectedExamples || !Number.isSafeInteger(expectedMatches) || expectedMatches < 1) return fail("EXAMPLES")
  const roots = new Set<LabRoot>()
  const normalized = examples.map((example) => {
    if (!example || !isRoot(example.trainingMatchRoot) || ![0, 1, 2].includes(example.trainingHalfPoints)) return fail("MATCH_RECORD")
    let input: SoldierBrainInputV119
    try { input = SoldierBrainInputV119Schema.parse(example.input) as SoldierBrainInputV119 } catch { return fail("LEGAL_INPUT") }
    if (JSON.stringify(input) !== JSON.stringify(example.input)) return fail("LEGAL_INPUT_CANONICAL")
    roots.add(example.trainingMatchRoot)
    return { input, trainingHalfPoints: example.trainingHalfPoints, trainingMatchRoot: example.trainingMatchRoot }
  })
  if (roots.size !== expectedMatches) return fail("MATCH_DENOMINATOR")
  return normalized
}
const buildCandidate = (mechanism: LeanCandidateMechanism, built: LeanMechanismBuild, trainingMatchRoots: readonly LabRoot[], disposition: LeanCandidateDisposition) => {
  const { source, decision } = built
  const bytes = new TextEncoder().encode(source)
  if (!source || bytes.byteLength > 65536) return fail("SOURCE_SIZE")
  const rootArrays = [built.evaluatedLegalInputRoots, built.teacherSearchNodeRoots, built.distillationExampleRoots]
  if (rootArrays.some((roots) => !Array.isArray(roots) || roots.some((root) => !isRoot(root))) ||
      (mechanism === "tactical" && (built.evaluatedLegalInputRoots.length !== 64 || built.teacherSearchNodeRoots.length !== 0 || built.distillationExampleRoots.length !== 0)) ||
      (mechanism === "teacher" && (built.evaluatedLegalInputRoots.length !== 0 || built.teacherSearchNodeRoots.length !== 64 || built.distillationExampleRoots.length !== 64)) ||
      (mechanism === "response" && (built.evaluatedLegalInputRoots.length !== 0 || built.teacherSearchNodeRoots.length !== 0 || built.distillationExampleRoots.length !== 0))) return fail("MECHANISM_WORK_VECTOR")
  return Object.freeze({ mechanism, source, sourceRoot: `sha256:${createHash("sha256").update(bytes).digest("hex")}` as LabRoot, structureRoot: deriveFactorySourceStructureRoot(bytes), decisionRoot: labRoot("lean-training-decision-v1", decision), disposition, trainingMatchRoots: Object.freeze([...trainingMatchRoots].sort()) })
}
const finish = (input: LeanColdTrainingInput, candidates: ReturnType<typeof buildCandidate>[]): LeanColdTrainingManifest => {
  if (!isRoot(input.coldRoot) || !isRoot(input.corpusRoot) || !isRoot(input.armRoot) || !isRoot(input.commonSourceRoot)) return fail("ROOT")
  if (input.predecessorRoot !== undefined) return fail("WARM_START")
  const seen = new Set<LabRoot>()
  const audited = candidates.map((candidate) => {
    const clone = seen.has(candidate.structureRoot)
    seen.add(candidate.structureRoot)
    return Object.freeze({ ...candidate, disposition: clone ? "clone_rejected" as const : candidate.disposition })
  })
  const value = { schemaVersion: "lean-cold-training-manifest-v1" as const, coldRoot: input.coldRoot, corpusRoot: input.corpusRoot, armRoot: input.armRoot, candidates: audited, vector: LEAN_TRAINING_VECTOR }
  return deepFreeze({ ...value, root: labRoot("lean-cold-training-manifest-v1", value) })
}

/** Cold initial attempt: one legal-input tactical search and one independent teacher-distillation source. */
export const trainLeanInitialCandidates = (input: LeanColdTrainingInput, builders: LeanInitialMechanismBuilders): LeanColdTrainingManifest => {
  if (!Array.isArray(input.trainingExamples) || input.trainingExamples.length !== 128) return fail("INITIAL_EXAMPLES")
  const tacticalExamples = validateExamples(input.trainingExamples.slice(0, 64), 4)
  const teacherMatchExamples = validateExamples(input.trainingExamples.slice(64), 4)
  if (!Array.isArray(input.teacherSearchReceipts) || input.teacherSearchReceipts.length === 0) return fail("TEACHER_NODES")
  const tacticalMatchRoots = [...new Set(tacticalExamples.map((example) => example.trainingMatchRoot))].sort()
  const teacherMatchRoots = [...new Set(teacherMatchExamples.map((example) => example.trainingMatchRoot))].sort()
  const tactical = builders.tactical(tacticalExamples)
  const teacher = builders.teacher(input.teacherSearchReceipts, teacherMatchExamples)
  if (tactical.evaluatedLegalInputRoots.some((root, index) => root !== labRoot("runtime-input", tacticalExamples[index]!.input))) return fail("TACTICAL_INPUT_BINDING")
  const tacticalScore = tacticalExamples.reduce((sum, example) => sum + example.trainingHalfPoints, 0)
  const teacherScore = teacherMatchExamples.reduce((sum, example) => sum + example.trainingHalfPoints, 0)
  const candidates = [
    buildCandidate("tactical", tactical, tacticalMatchRoots, tacticalScore > 0 ? "accepted_for_evaluation" : "weak_preserved"),
    buildCandidate("teacher", teacher, teacherMatchRoots, teacherScore > 0 ? "accepted_for_evaluation" : "weak_preserved"),
  ]
  return finish(input, candidates)
}

/** One response attempt. Source choices depend on legal response examples, not target labels or hidden state. */
export const trainLeanResponse = (input: LeanResponseInput): LeanColdTrainingManifest => {
  if (input.initial.coldRoot !== input.coldRoot || input.initial.corpusRoot !== input.corpusRoot || input.initial.armRoot !== input.armRoot || input.initial.candidates.length !== 2 || !isRoot(input.targetRoots?.mixture) || !isRoot(input.targetRoots?.strongestPure)) return fail("INITIAL_JOIN")
  const examples = validateExamples(input.responseExamples, 8)
  if (!Array.isArray(input.responsePlannerNodes) || input.responsePlannerNodes.length !== LEAN_TRAINING_VECTOR.responseNodes || input.responsePlannerNodes.some((node) => !isRoot(node.trainingMatchRoot) || !examples.some((example) => example.trainingMatchRoot === node.trainingMatchRoot))) return fail("RESPONSE_NODES")
  const plannerMatchRoots = new Set(input.responsePlannerNodes.map((node) => node.trainingMatchRoot))
  if (plannerMatchRoots.size !== 8) return fail("RESPONSE_MATCH_DENOMINATOR")
  let assignments = 0
  const nodeRoots: LabRoot[] = []
  for (const [ordinal, node] of input.responsePlannerNodes.entries()) {
    let legalInput: StrategyInputV119
    try { legalInput = StrategyInputV119Schema.parse(node.input) } catch { return fail("RESPONSE_LEGAL_INPUT") }
    if (JSON.stringify(legalInput) !== JSON.stringify(node.input)) return fail("RESPONSE_LEGAL_INPUT_CANONICAL")
    // One bounded ordered planner expansion per retained legal input. The existing
    // planner owns mission enumeration/scoring; this module owns only accounting.
    const output = selectPlannerActivations(legalInput, { maxExpansions: 1 })
    assignments += output.activationOrders.length
    nodeRoots.push(labRoot("lean-response-planner-node-v1", { ordinal, inputRoot: labRoot("runtime-input", legalInput), output }))
  }
  const defaultBudget = Math.max(1, Math.min(128, Math.round(assignments / input.responsePlannerNodes.length)))
  const basePlannerSource = buildPlannerCandidate().source
  const marker = "selectPlannerActivations(input);"
  if (!basePlannerSource.includes(marker)) return fail("PLANNER_EMITTER_SHAPE")
  const source = basePlannerSource.replace(marker, `selectPlannerActivations(input, { maxExpansions: ${defaultBudget} });`)
  const trainingMatchRoots = [...new Set(examples.map((example) => example.trainingMatchRoot))].sort()
  const score = examples.reduce((sum, example) => sum + example.trainingHalfPoints, 0)
  const disposition: LeanCandidateDisposition = score > 0 ? "accepted_for_evaluation" : "weak_preserved"
  const response = buildCandidate("response", { source, decision: { targetRoots: input.targetRoots, plannerNodeRoots: nodeRoots, responseNodes: 128, selectedPlannerBudget: defaultBudget, realizedTrainingHalfPoints: score, commonSourceRoot: input.commonSourceRoot }, evaluatedLegalInputRoots: [], teacherSearchNodeRoots: [], distillationExampleRoots: [] }, trainingMatchRoots, disposition)
  const combined = finish(input, [...input.initial.candidates.map((candidate) => ({ ...candidate })), response])
  return combined
}

/** Recomputes channel arithmetic and source/decision roots from a retained manifest. */
export const auditLeanTrainingVector = (value: LeanColdTrainingManifest): Readonly<{ valid: true; vector: typeof LEAN_TRAINING_VECTOR; root: LabRoot }> => {
  if (!value || value.schemaVersion !== "lean-cold-training-manifest-v1" || value.vector.tacticalEvaluations !== 64 || value.vector.teacherSearchNodes !== 64 || value.vector.distillationExamples !== 64 || value.vector.responseNodes !== 128 || value.vector.totalChannelOperations !== 320 || Object.values(value.vector).slice(0, 4).reduce((sum, count) => sum + count, 0) !== 320 || value.candidates.length < 2 || value.candidates.some((candidate) => !isRoot(candidate.sourceRoot) || !isRoot(candidate.structureRoot) || !isRoot(candidate.decisionRoot) || candidate.sourceRoot !== `sha256:${createHash("sha256").update(candidate.source).digest("hex")}`)) return fail("AUDIT")
  const { root: _root, ...body } = value
  const root = labRoot("lean-cold-training-manifest-v1", body)
  if (root !== value.root) return fail("MANIFEST_ROOT")
  return Object.freeze({ valid: true, vector: LEAN_TRAINING_VECTOR, root })
}
