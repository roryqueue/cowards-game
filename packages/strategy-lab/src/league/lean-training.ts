import { createHash } from "node:crypto"
import { labRoot, type LabRoot } from "../contracts.js"
import { deriveFactorySourceStructureRoot } from "../factory/fingerprint.js"
import { ActionSchema, SoldierBrainInputV119Schema, StrategyInputV119Schema, type SoldierBrainInputV119, type StrategyInputV119 } from "../../../spec/src/index.js"
import { buildPlannerCandidate } from "../planner/emit.js"
import { selectPlannerActivations } from "../planner/assign.js"

export const LEAN_TRAINING_VECTOR = Object.freeze({ tacticalEvaluations: 64, teacherSearchNodes: 64, distillationExamples: 64, responseNodes: 128, totalChannelOperations: 320 })
export const LEAN_INITIAL_TRAINING_VECTOR = Object.freeze({ tacticalEvaluations: 64, teacherSearchNodes: 64, distillationExamples: 64, responseNodes: 0, totalChannelOperations: 192 })
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
  readonly stage: "initial" | "response_complete"
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
    workRoots: Readonly<{ tacticalInputs: readonly LabRoot[]; teacherNodes: readonly LabRoot[]; distillationExamples: readonly LabRoot[]; responseNodes: readonly LabRoot[] }>
  }>[]
  readonly vector: typeof LEAN_TRAINING_VECTOR | typeof LEAN_INITIAL_TRAINING_VECTOR
  readonly root: LabRoot
}
export interface LeanColdTrainingInput {
  readonly coldRoot: LabRoot
  readonly corpusRoot: LabRoot
  readonly armRoot: LabRoot
  /** Legal input/result rows rooted to exactly four supervised Match outcomes per initial slot. */
  readonly trainingExamples: readonly LeanLegalExample[]
  /** Frozen canonical cold-corpus inputs evaluated before any supervised Match. */
  readonly frozenTacticalInputs: readonly SoldierBrainInputV119[]
  /** Canonical-kernel teacher receipts; exact node count is checked before distillation. */
  readonly teacherSearchReceipts: readonly unknown[]
  /** The candidate-free source root prevents cross-arm learned predecessor reuse. */
  readonly commonSourceRoot: LabRoot
  readonly predecessorRoot?: never
}
export interface LeanResponseInput extends LeanColdTrainingInput {
  readonly initial: LeanColdTrainingManifest
  /** Legal ABI/result rows rooted to exactly eight supervised response Matches. */
  readonly responseExamples: readonly LeanLegalExample[]
  /** One exact legal planner input per each of the eight response Matches. */
  readonly responsePlannerNodes: readonly Readonly<{ input: StrategyInputV119; trainingMatchRoot: LabRoot }>[]
  readonly targetRoots: Readonly<{ mixture: LabRoot; strongestPure: LabRoot }>
}
export interface LeanResponseWork {
  readonly targetRoots: Readonly<{ mixture: LabRoot; strongestPure: LabRoot }>
  readonly plannerEvidence: readonly Readonly<Record<string, unknown>>[]
  readonly responseNodeCap: 128
  readonly actualAssignmentNodes: number
  readonly selectedPlannerBudget: number
  readonly matchOutcomes: readonly Readonly<{ trainingMatchRoot: LabRoot; halfPoints: number; assignedNodes: number }>[]
  readonly realizedTrainingHalfPoints: number
  readonly commonSourceRoot: LabRoot
  readonly plannerNodeRoots: readonly LabRoot[]
}
export interface LeanMechanismBuild {
  readonly source: string
  readonly decision: unknown
  readonly evaluatedLegalInputRoots: readonly LabRoot[]
  readonly teacherSearchNodeRoots: readonly LabRoot[]
  readonly distillationExampleRoots: readonly LabRoot[]
  readonly responsePlannerNodeRoots?: readonly LabRoot[]
}
/** Trusted adapters live above strategy-lab to avoid a reverse package dependency cycle. */
export interface LeanInitialMechanismBuilders {
  readonly tactical: (frozenInputs: readonly SoldierBrainInputV119[]) => LeanMechanismBuild
  readonly teacher: (receipts: readonly unknown[]) => LeanMechanismBuild
}

const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code: string): never => { throw new TypeError(`LEAN_TRAINING_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const exactKeys = (value: unknown, keys: readonly string[]): boolean => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
const sameCanonicalValue = (left: unknown, right: unknown): boolean => labRoot("lean-canonical-value-equality-v1", left) === labRoot("lean-canonical-value-equality-v1", right)
export const deriveLeanColdCorpusRoot = (inputs: readonly SoldierBrainInputV119[]): LabRoot => {
  if (!Array.isArray(inputs) || inputs.length !== 64) return fail("COLD_CORPUS_COUNT")
  const roots = inputs.map((raw) => {
    let parsed: SoldierBrainInputV119
    try { parsed = SoldierBrainInputV119Schema.parse(raw) as SoldierBrainInputV119 } catch { return fail("COLD_CORPUS_INPUT") }
    if (!sameCanonicalValue(parsed, raw)) return fail("COLD_CORPUS_CANONICAL")
    return labRoot("runtime-input", parsed)
  })
  // Repeated observations still incur distinct counted scorer calls; the root
  // commits order/denominator without claiming 64 unique game situations.
  return labRoot("lean-cold-corpus-v1", roots)
}
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
  const scores = new Map<LabRoot, 0 | 1 | 2>()
  const normalized = examples.map((example) => {
    if (!exactKeys(example, ["input", "trainingHalfPoints", "trainingMatchRoot"]) || !isRoot(example.trainingMatchRoot) || ![0, 1, 2].includes(example.trainingHalfPoints)) return fail("MATCH_RECORD")
    let input: SoldierBrainInputV119
    try { input = SoldierBrainInputV119Schema.parse(example.input) as SoldierBrainInputV119 } catch { return fail("LEGAL_INPUT") }
    if (!sameCanonicalValue(input, example.input)) return fail("LEGAL_INPUT_CANONICAL")
    roots.add(example.trainingMatchRoot)
    const priorScore = scores.get(example.trainingMatchRoot)
    if (priorScore !== undefined && priorScore !== example.trainingHalfPoints) return fail("MATCH_SCORE_BINDING")
    scores.set(example.trainingMatchRoot, example.trainingHalfPoints)
    return { input, trainingHalfPoints: example.trainingHalfPoints, trainingMatchRoot: example.trainingMatchRoot }
  })
  if (roots.size !== expectedMatches) return fail("MATCH_DENOMINATOR")
  return normalized
}
const validateTeacherReceipts = (receipts: readonly unknown[]): readonly Readonly<Record<string, unknown>>[] => {
  if (!Array.isArray(receipts) || receipts.length === 0) return fail("TEACHER_NODES")
  const keys = ["alternativesEvaluated", "canonicalTransitionRoot", "depthReached", "nodesVisited", "offlineOnly", "outcomeRoots", "outcomes", "selectedLegalTargets", "selectedOutcomeRoot", "selectedTemplate"]
  let nodes = 0
  const parsed: Readonly<Record<string, unknown>>[] = []
  for (const receipt of receipts) {
    if (!receipt || typeof receipt !== "object" || Array.isArray(receipt) || Object.keys(receipt).sort().join("\0") !== [...keys].sort().join("\0")) return fail("TEACHER_RECEIPT_SCHEMA")
    const value = receipt as Record<string, unknown>
    if (value.offlineOnly !== true || !isRoot(value.canonicalTransitionRoot) || !isRoot(value.selectedOutcomeRoot) ||
        (value.selectedTemplate !== null && typeof value.selectedTemplate !== "string") ||
        ![value.alternativesEvaluated, value.depthReached, value.nodesVisited].every((count) => Number.isSafeInteger(count) && Number(count) >= 0) ||
        !Array.isArray(value.outcomeRoots) || !value.outcomeRoots.every(isRoot) || !Array.isArray(value.outcomes) || value.outcomes.length !== value.outcomeRoots.length || !Array.isArray(value.selectedLegalTargets) || value.selectedLegalTargets.length > 256) return fail("TEACHER_RECEIPT_SCHEMA")
    nodes += Number(value.nodesVisited)
    for (const outcome of value.outcomes) {
      if (!outcome || typeof outcome !== "object" || Array.isArray(outcome) || Object.keys(outcome).sort().join("\0") !== ["outcomeRoot", "score", "stateRoot", "template", "terminal"].sort().join("\0")) return fail("TEACHER_RECEIPT_OUTCOME")
      const row = outcome as Record<string, unknown>
      if (!isRoot(row.outcomeRoot) || !isRoot(row.stateRoot) || typeof row.template !== "string" || !Array.isArray(row.score) || row.score.length !== 4 || !row.score.every(Number.isSafeInteger) || !["win", "loss", "draw", "failed", "nonterminal"].includes(String(row.terminal))) return fail("TEACHER_RECEIPT_OUTCOME")
    }
    if (JSON.stringify(value.outcomes.map((outcome) => (outcome as Record<string, unknown>).outcomeRoot)) !== JSON.stringify(value.outcomeRoots) ||
        (value.outcomeRoots.length > 0 && !value.outcomeRoots.includes(value.selectedOutcomeRoot as LabRoot))) return fail("TEACHER_RECEIPT_OUTCOME_JOIN")
    for (const target of value.selectedLegalTargets) {
      if (!target || typeof target !== "object" || Array.isArray(target)) return fail("TEACHER_TARGET")
      const row = target as Record<string, unknown>
      if (row.kind === "brain" && Object.keys(row).sort().join("\0") === ["input", "kind", "target"].sort().join("\0")) {
        try {
          const input = SoldierBrainInputV119Schema.parse(row.input)
          ActionSchema.parse(row.target)
          if (!sameCanonicalValue(input, row.input)) return fail("TEACHER_TARGET")
        } catch { return fail("TEACHER_TARGET") }
      } else if (row.kind === "activation" && Object.keys(row).sort().join("\0") === ["input", "kind", "target"].sort().join("\0")) {
        try {
          const input = StrategyInputV119Schema.parse(row.input)
          if (!new Set(["press", "screen"]).has(String(row.target)) || !sameCanonicalValue(input, row.input)) return fail("TEACHER_TARGET")
        } catch { return fail("TEACHER_TARGET") }
      } else return fail("TEACHER_TARGET")
    }
    parsed.push(value)
  }
  if (nodes !== 64) return fail("TEACHER_NODE_COUNT")
  if (parsed.reduce((sum, receipt) => sum + (receipt.selectedLegalTargets as readonly unknown[]).length, 0) === 0) return fail("TEACHER_DISTILLATION_BINDING")
  return Object.freeze(parsed)
}
const buildCandidate = (mechanism: LeanCandidateMechanism, built: LeanMechanismBuild, trainingMatchRoots: readonly LabRoot[], disposition: LeanCandidateDisposition) => {
  if (!exactKeys(built, ["source", "decision", "evaluatedLegalInputRoots", "teacherSearchNodeRoots", "distillationExampleRoots", ...(built?.responsePlannerNodeRoots === undefined ? [] : ["responsePlannerNodeRoots"]) ])) return fail("MECHANISM_BUILD_SCHEMA")
  const { source, decision } = built
  const bytes = new TextEncoder().encode(source)
  if (!source || bytes.byteLength > 65536) return fail("SOURCE_SIZE")
  const rootArrays = [built.evaluatedLegalInputRoots, built.teacherSearchNodeRoots, built.distillationExampleRoots]
  if (rootArrays.some((roots) => !Array.isArray(roots) || roots.some((root) => !isRoot(root))) ||
      (mechanism === "tactical" && (built.evaluatedLegalInputRoots.length !== 64 || built.teacherSearchNodeRoots.length !== 0 || built.distillationExampleRoots.length !== 0)) ||
      (mechanism === "teacher" && (built.evaluatedLegalInputRoots.length !== 0 || built.teacherSearchNodeRoots.length !== 64 || built.distillationExampleRoots.length !== 64)) ||
      (mechanism === "response" && (built.evaluatedLegalInputRoots.length !== 0 || built.teacherSearchNodeRoots.length !== 0 || built.distillationExampleRoots.length !== 0))) return fail("MECHANISM_WORK_VECTOR")
  return Object.freeze({ mechanism, source, sourceRoot: `sha256:${createHash("sha256").update(bytes).digest("hex")}` as LabRoot, structureRoot: deriveFactorySourceStructureRoot(bytes), decisionRoot: labRoot("lean-training-decision-v1", decision), disposition, trainingMatchRoots: Object.freeze([...trainingMatchRoots].sort()), workRoots: Object.freeze({ tacticalInputs: Object.freeze([...built.evaluatedLegalInputRoots]), teacherNodes: Object.freeze([...built.teacherSearchNodeRoots]), distillationExamples: Object.freeze([...built.distillationExampleRoots]), responseNodes: Object.freeze([...(built.responsePlannerNodeRoots ?? [])]) }) })
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
  const responseComplete = audited.some((candidate) => candidate.mechanism === "response")
  const value = { schemaVersion: "lean-cold-training-manifest-v1" as const, stage: responseComplete ? "response_complete" as const : "initial" as const, coldRoot: input.coldRoot, corpusRoot: input.corpusRoot, armRoot: input.armRoot, candidates: audited, vector: responseComplete ? LEAN_TRAINING_VECTOR : LEAN_INITIAL_TRAINING_VECTOR }
  return deepFreeze({ ...value, root: labRoot("lean-cold-training-manifest-v1", value) })
}

/** Cold initial attempt: one legal-input tactical search and one independent teacher-distillation source. */
export const trainLeanInitialCandidates = (input: LeanColdTrainingInput, builders: LeanInitialMechanismBuilders): LeanColdTrainingManifest => {
  if (!exactKeys(input, ["coldRoot", "corpusRoot", "armRoot", "trainingExamples", "frozenTacticalInputs", "teacherSearchReceipts", "commonSourceRoot", ...(input?.predecessorRoot === undefined ? [] : ["predecessorRoot"])]) ||
      !exactKeys(builders, ["tactical", "teacher"]) || typeof builders.tactical !== "function" || typeof builders.teacher !== "function") return fail("INPUT_SCHEMA")
  if (!Array.isArray(input.trainingExamples) || input.trainingExamples.length !== 128) return fail("INITIAL_EXAMPLES")
  const tacticalExamples = validateExamples(input.trainingExamples.slice(0, 64), 4)
  const teacherMatchExamples = validateExamples(input.trainingExamples.slice(64), 4)
  if (!Array.isArray(input.frozenTacticalInputs) || input.frozenTacticalInputs.length !== 64) return fail("FROZEN_TACTICAL_INPUTS")
  const frozenTacticalInputs = input.frozenTacticalInputs.map((raw) => {
    let parsed: SoldierBrainInputV119
    try { parsed = SoldierBrainInputV119Schema.parse(raw) as SoldierBrainInputV119 } catch { return fail("FROZEN_TACTICAL_INPUTS") }
    if (!sameCanonicalValue(parsed, raw)) return fail("FROZEN_TACTICAL_INPUTS_CANONICAL")
    return parsed
  })
  if (deriveLeanColdCorpusRoot(frozenTacticalInputs) !== input.corpusRoot) return fail("COLD_CORPUS_ROOT")
  const teacherReceipts = validateTeacherReceipts(input.teacherSearchReceipts)
  const tacticalMatchRoots = [...new Set(tacticalExamples.map((example) => example.trainingMatchRoot))].sort()
  const teacherMatchRoots = [...new Set(teacherMatchExamples.map((example) => example.trainingMatchRoot))].sort()
  if (tacticalMatchRoots.some((matchRoot) => teacherMatchRoots.includes(matchRoot))) return fail("INITIAL_MATCH_PARTITION_OVERLAP")
  const tactical = builders.tactical(frozenTacticalInputs)
  const teacher = builders.teacher(teacherReceipts)
  if (tactical.evaluatedLegalInputRoots.some((root, index) => root !== labRoot("runtime-input", frozenTacticalInputs[index]))) return fail("TACTICAL_INPUT_BINDING")
  const outcomeScore = (values: readonly LeanLegalExample[]) => [...new Map(values.map((example) => [example.trainingMatchRoot, example.trainingHalfPoints])).values()].reduce<number>((sum, points) => sum + points, 0)
  const tacticalScore = outcomeScore(tacticalExamples)
  const teacherScore = outcomeScore(teacherMatchExamples)
  const candidates = [
    buildCandidate("tactical", tactical, tacticalMatchRoots, tacticalScore > 0 ? "accepted_for_evaluation" : "weak_preserved"),
    buildCandidate("teacher", teacher, teacherMatchRoots, teacherScore > 0 ? "accepted_for_evaluation" : "weak_preserved"),
  ]
  return finish(input, candidates)
}

/** One response attempt. Source choices depend on legal response examples, not target labels or hidden state. */
export const trainLeanResponse = (input: LeanResponseInput, onWork?: (work: LeanResponseWork) => void): LeanColdTrainingManifest => {
  if (!exactKeys(input, ["coldRoot", "corpusRoot", "armRoot", "trainingExamples", "frozenTacticalInputs", "teacherSearchReceipts", "commonSourceRoot", "initial", "responseExamples", "responsePlannerNodes", "targetRoots", ...(input?.predecessorRoot === undefined ? [] : ["predecessorRoot"])]) ||
      !exactKeys(input.initial, ["schemaVersion", "stage", "coldRoot", "corpusRoot", "armRoot", "candidates", "vector", "root"]) || !exactKeys(input.targetRoots, ["mixture", "strongestPure"]) || (onWork !== undefined && typeof onWork !== "function")) return fail("RESPONSE_INPUT_SCHEMA")
  if (input.initial.stage !== "initial" || !auditLeanTrainingVector(input.initial).valid || input.initial.coldRoot !== input.coldRoot || input.initial.corpusRoot !== input.corpusRoot || deriveLeanColdCorpusRoot(input.frozenTacticalInputs) !== input.corpusRoot || input.initial.armRoot !== input.armRoot || input.initial.candidates.length !== 2 || new Set(input.initial.candidates.map((candidate) => candidate.mechanism)).size !== 2 || !isRoot(input.targetRoots?.mixture) || !isRoot(input.targetRoots?.strongestPure)) return fail("INITIAL_JOIN")
  const examples = validateExamples(input.responseExamples, 8)
  const initialMatchRoots = new Set(input.initial.candidates.flatMap((candidate) => candidate.trainingMatchRoots))
  if (examples.some((example) => initialMatchRoots.has(example.trainingMatchRoot))) return fail("RESPONSE_MATCH_REUSE")
  if (!Array.isArray(input.responsePlannerNodes) || input.responsePlannerNodes.length !== 8 || input.responsePlannerNodes.some((node) => !isRoot(node.trainingMatchRoot) || !examples.some((example) => example.trainingMatchRoot === node.trainingMatchRoot))) return fail("RESPONSE_NODES")
  const matchRoots = [...new Set(examples.map((example) => example.trainingMatchRoot))].sort()
  if (matchRoots.length !== 8 || JSON.stringify(input.responsePlannerNodes.map((node) => node.trainingMatchRoot).sort()) !== JSON.stringify(matchRoots)) return fail("RESPONSE_MATCH_DENOMINATOR")
  const matchScores = new Map<LabRoot, number>()
  for (const example of examples) matchScores.set(example.trainingMatchRoot, example.trainingHalfPoints)
  const weighted = matchRoots.map((matchRoot) => ({ matchRoot, points: matchScores.get(matchRoot)! })), weightTotal = weighted.reduce((sum, item) => sum + item.points + 1, 0)
  const allocations = weighted.map((item) => ({ ...item, allocation: Math.floor((LEAN_TRAINING_VECTOR.responseNodes * (item.points + 1)) / weightTotal) }))
  let remainder = LEAN_TRAINING_VECTOR.responseNodes - allocations.reduce((sum, item) => sum + item.allocation, 0)
  for (let index = 0; remainder > 0; index = (index + 1) % allocations.length, remainder--) allocations[index]!.allocation++
  const allocationByRoot = new Map(allocations.map((item) => [item.matchRoot, item.allocation]))
  let assignments = 0
  const nodeRoots: LabRoot[] = []
  const plannerEvidence: Readonly<Record<string, unknown>>[] = []
  for (const [ordinal, node] of [...input.responsePlannerNodes].sort((a, b) => a.trainingMatchRoot.localeCompare(b.trainingMatchRoot)).entries()) {
    let legalInput: StrategyInputV119
    try { legalInput = StrategyInputV119Schema.parse(node.input) } catch { return fail("RESPONSE_LEGAL_INPUT") }
    if (!sameCanonicalValue(legalInput, node.input)) return fail("RESPONSE_LEGAL_INPUT_CANONICAL")
    const allocation = allocationByRoot.get(node.trainingMatchRoot)!
    const output = selectPlannerActivations(legalInput, { maxExpansions: allocation })
    const actualNodes = Number((output.strategyMemory as { planner?: { expansions?: unknown } } | undefined)?.planner?.expansions)
    if (!Number.isSafeInteger(actualNodes) || actualNodes < 0 || actualNodes > allocation) return fail("RESPONSE_ACTUAL_NODES")
    assignments += actualNodes
    const nodeRoot = labRoot("lean-response-planner-node-v1", { ordinal, trainingMatchRoot: node.trainingMatchRoot, allocation, actualNodes, inputRoot: labRoot("runtime-input", legalInput), output })
    nodeRoots.push(nodeRoot)
    plannerEvidence.push(Object.freeze({ trainingMatchRoot: node.trainingMatchRoot, allocation, actualNodes, nodeRoot }))
  }
  // The emitted planner's bounded expansion budget is selected from supervised
  // response outcomes, not from activation count or a fabricated strength score.
  const selectedBudget = Math.max(1, Math.min(128, Math.round(allocations.reduce((sum, item) => sum + item.allocation * (item.points + 1), 0) / weightTotal)))
  const basePlannerSource = buildPlannerCandidate().source
  const marker = "selectPlannerActivations(input);"
  if (!basePlannerSource.includes(marker)) return fail("PLANNER_EMITTER_SHAPE")
  const source = basePlannerSource.replace(marker, `selectPlannerActivations(input, { maxExpansions: ${selectedBudget} });`)
  const trainingMatchRoots = [...new Set(examples.map((example) => example.trainingMatchRoot))].sort()
  const score = [...matchScores.values()].reduce<number>((sum, points) => sum + points, 0)
  const disposition: LeanCandidateDisposition = score > 0 ? "accepted_for_evaluation" : "weak_preserved"
  const responseWork: LeanResponseWork = deepFreeze({ targetRoots: input.targetRoots, plannerEvidence, responseNodeCap: 128, actualAssignmentNodes: assignments, selectedPlannerBudget: selectedBudget, matchOutcomes: allocations.map((item) => ({ trainingMatchRoot: item.matchRoot, halfPoints: item.points, assignedNodes: item.allocation })), realizedTrainingHalfPoints: score, commonSourceRoot: input.commonSourceRoot, plannerNodeRoots: nodeRoots })
  onWork?.(responseWork)
  const response = buildCandidate("response", { source, decision: responseWork, evaluatedLegalInputRoots: [], teacherSearchNodeRoots: [], distillationExampleRoots: [], responsePlannerNodeRoots: nodeRoots }, trainingMatchRoots, disposition)
  const combined = finish(input, [...input.initial.candidates.map((candidate) => ({ ...candidate })), response])
  return combined
}

/** Recomputes channel arithmetic and source/decision roots from a retained manifest. */
export const auditLeanTrainingVector = (value: LeanColdTrainingManifest): Readonly<{ valid: true; vector: typeof LEAN_TRAINING_VECTOR | typeof LEAN_INITIAL_TRAINING_VECTOR; root: LabRoot }> => {
  const expectedVector = value?.stage === "initial" ? LEAN_INITIAL_TRAINING_VECTOR : value?.stage === "response_complete" ? LEAN_TRAINING_VECTOR : null
  const expectedCandidateCount = value?.stage === "initial" ? 2 : 3
  if (!value || Object.keys(value).sort().join("\0") !== ["schemaVersion", "stage", "coldRoot", "corpusRoot", "armRoot", "candidates", "vector", "root"].sort().join("\0") ||
      value.schemaVersion !== "lean-cold-training-manifest-v1" || !expectedVector || JSON.stringify(value.vector) !== JSON.stringify(expectedVector) ||
      !isRoot(value.coldRoot) || !isRoot(value.corpusRoot) || !isRoot(value.armRoot) || !isRoot(value.root) ||
      !Array.isArray(value.candidates) || value.candidates.length !== expectedCandidateCount ||
      value.candidates.some((candidate) => {
        if (Object.keys(candidate).sort().join("\0") !== ["mechanism", "source", "sourceRoot", "structureRoot", "decisionRoot", "disposition", "trainingMatchRoots", "workRoots"].sort().join("\0") ||
            !["tactical", "teacher", "response"].includes(candidate.mechanism) || typeof candidate.source !== "string" ||
            !["accepted_for_evaluation", "clone_rejected", "invalid_rejected", "weak_preserved"].includes(candidate.disposition) ||
            !isRoot(candidate.sourceRoot) || !isRoot(candidate.structureRoot) || !isRoot(candidate.decisionRoot) ||
            candidate.sourceRoot !== `sha256:${createHash("sha256").update(candidate.source).digest("hex")}` ||
            candidate.structureRoot !== deriveFactorySourceStructureRoot(new TextEncoder().encode(candidate.source)) ||
            !Array.isArray(candidate.trainingMatchRoots) || candidate.trainingMatchRoots.length !== (candidate.mechanism === "response" ? 8 : 4) ||
            !candidate.trainingMatchRoots.every(isRoot) || new Set(candidate.trainingMatchRoots).size !== candidate.trainingMatchRoots.length ||
            !candidate.workRoots || Object.keys(candidate.workRoots).sort().join("\0") !== ["tacticalInputs", "teacherNodes", "distillationExamples", "responseNodes"].sort().join("\0") ||
            Object.values(candidate.workRoots).some((roots) => !Array.isArray(roots) || !roots.every(isRoot)) ||
            candidate.workRoots.tacticalInputs.length !== (candidate.mechanism === "tactical" ? 64 : 0) ||
            candidate.workRoots.teacherNodes.length !== (candidate.mechanism === "teacher" ? 64 : 0) ||
            candidate.workRoots.distillationExamples.length !== (candidate.mechanism === "teacher" ? 64 : 0) ||
            candidate.workRoots.responseNodes.length !== (candidate.mechanism === "response" ? 8 : 0)) return true
        return false
      }) || new Set(value.candidates.map((candidate) => candidate.mechanism)).size !== expectedCandidateCount ||
      (value.stage === "initial" && value.candidates.some((candidate) => candidate.mechanism === "response")) ||
      (value.stage === "response_complete" && !value.candidates.some((candidate) => candidate.mechanism === "response"))) return fail("AUDIT")
  const { root: _root, ...body } = value
  const root = labRoot("lean-cold-training-manifest-v1", body)
  if (root !== value.root) return fail("MANIFEST_ROOT")
  return Object.freeze({ valid: true, vector: expectedVector, root })
}
