import { createHash } from "node:crypto"
import { SoldierBrainInputV119Schema, type SoldierBrainInputV119 } from "../../../spec/src/index.js"
import { labRoot, type LabRoot } from "../contracts.js"
import { auditLeanTrainingVector, deriveLeanColdCorpusRoot, LEAN_INITIAL_TRAINING_VECTOR, LEAN_TRAINING_VECTOR, trainLeanInitialCandidates, trainLeanResponse, type LeanColdTrainingInput, type LeanLegalExample } from "./lean-training.js"
import { buildFeasibilityCorpus } from "../feasibility-protocol.js"
import { describe, expect, it } from "vitest"

const root = (value: string): LabRoot => `sha256:${createHash("sha256").update(value).digest("hex")}` as LabRoot
const soldier = (id: string, ownerPlayerId: string, x: number, y: number) => ({ id, ownerPlayerId, status: "ACTIVE" as const, position: { x, y }, facing: "RIGHT" as const, lastSuccessfulMoveDirection: null, soldierMemory: {} })
const legalInput = (enemyX = 4): SoldierBrainInputV119 => SoldierBrainInputV119Schema.parse({
  self: soldier("self:a", "self", 1, 1),
  awarenessGrid: { cells: Array.from({ length: 25 }, (_, index) => ({ dx: index % 5 - 2, dy: Math.floor(index / 5) - 2, absoluteX: index % 5 - 1, absoluteY: Math.floor(index / 5) - 1, contents: index === 14 ? "ENEMY_ACTIVE" : "EMPTY" })) },
  cycleIndex: 1, maxCycles: 12, objective: { schemaVersion: "tactical-mission-v1", soldierId: "self:a", targetId: "enemy:a", goal: { x: enemyX, y: 1 }, goalFacing: "RIGHT", posture: "press" }, soldierMemory: {}, hasAdvancedThisActivation: false,
}) as SoldierBrainInputV119
const examples = (suffix: string, enemyX = 4, matchCount = 4): LeanLegalExample[] => Array.from({ length: 64 }, (_, index) => ({ input: legalInput(enemyX + (index % 2)), trainingHalfPoints: (Math.floor(index / (64 / matchCount)) % 3) as 0 | 1 | 2, trainingMatchRoot: root(`${suffix}:match:${Math.floor(index / (64 / matchCount))}`) }))
const teacherReceipt = (suffix: string, legalExamples: readonly LeanLegalExample[]) => ({ canonicalTransitionRoot: root(`${suffix}:transition`), selectedTemplate: "screen-anchor", selectedOutcomeRoot: root(`${suffix}:outcome`), depthReached: 1, nodesVisited: 64, alternativesEvaluated: 1, outcomeRoots: [], outcomes: [], selectedLegalTargets: legalExamples.map((example) => ({ kind: "brain" as const, input: example.input, target: { type: "MOVE" as const, direction: "RIGHT" as const } })), offlineOnly: true as const })
const input = (suffix: string, enemyX = 4): LeanColdTrainingInput => {
  const tactical = examples(`${suffix}:tactical`, enemyX)
  const teacher = examples(`${suffix}:teacher`, enemyX)
  const frozenTacticalInputs = Array.from({ length: 64 }, (_, index) => legalInput(enemyX + index))
  return { coldRoot: root(`${suffix}:cold`), corpusRoot: deriveLeanColdCorpusRoot(frozenTacticalInputs), armRoot: root(`${suffix}:arm`), commonSourceRoot: root("profile-agnostic-common-source"), frozenTacticalInputs, trainingExamples: [...tactical, ...teacher], teacherSearchReceipts: [teacherReceipt(suffix, teacher)] }
}
const builders = {
  tactical: (values: readonly SoldierBrainInputV119[]) => { const roots = values.map((value) => labRoot("runtime-input", value)); return { source: `const learned = ${JSON.stringify(roots)}; export default { selectActivations(input) { return { activationOrders: [], strategyMemory: { learned } }; }, soldierBrain(input) { return { action: { type: "TURN_TO_STONE" }, soldierMemory: { learned } }; } };`, decision: roots, evaluatedLegalInputRoots: roots, teacherSearchNodeRoots: [], distillationExampleRoots: [] } },
  teacher: (_receipts: readonly unknown[]) => { const roots = Array.from({ length: 64 }, (_, index) => root(`distill:${index}`)); return { source: `const distilled = ${JSON.stringify(roots)}; export default { selectActivations(input) { return { activationOrders: [], strategyMemory: { distilled } }; }, soldierBrain(input) { return { action: { type: "TURN_TO_STONE" }, soldierMemory: { distilled } }; } };`, decision: roots, evaluatedLegalInputRoots: [], teacherSearchNodeRoots: Array.from({ length: 64 }, (_, index) => root(`node:${index}`)), distillationExampleRoots: roots } },
}

describe("bounded lean cold training", () => {
  it("produces deterministic source-bearing distinct tactical and teacher attempts from legal training inputs", () => {
    const first = trainLeanInitialCandidates(input("one"), builders)
    const again = trainLeanInitialCandidates(input("one"), builders)
    expect(first).toEqual(again)
    expect(first.candidates.map((candidate) => candidate.mechanism)).toEqual(["tactical", "teacher"])
    expect(first.candidates.map((candidate) => candidate.sourceRoot)).toHaveLength(2)
    expect(new Set(first.candidates.map((candidate) => candidate.structureRoot)).size).toBe(2)
    expect(first.candidates.every((candidate) => candidate.trainingMatchRoots.length === 4)).toBe(true)
    expect(first.candidates.every((candidate) => candidate.disposition === "accepted_for_evaluation")).toBe(true)
    expect(first.stage).toBe("initial")
    expect(first.vector).toEqual(LEAN_INITIAL_TRAINING_VECTOR)
    expect(auditLeanTrainingVector(first).valid).toBe(true)
  })

  it("changes evaluated decisions and deployed source when legal examples change", () => {
    const ordinary = trainLeanInitialCandidates(input("one", 4), builders)
    const shifted = trainLeanInitialCandidates(input("one", 0), builders)
    expect(ordinary.candidates[0]!.decisionRoot).not.toBe(shifted.candidates[0]!.decisionRoot)
    expect(ordinary.candidates[0]!.sourceRoot).not.toBe(shifted.candidates[0]!.sourceRoot)
  })

  it("uses the exact nonfungible per-arm vector and preserves weak attempts rather than replacing them", () => {
    expect(LEAN_INITIAL_TRAINING_VECTOR).toEqual({ tacticalEvaluations: 64, teacherSearchNodes: 64, distillationExamples: 64, responseNodes: 0, totalChannelOperations: 192 })
    expect(LEAN_TRAINING_VECTOR).toEqual({ tacticalEvaluations: 64, teacherSearchNodes: 64, distillationExamples: 64, responseNodes: 128, totalChannelOperations: 320 })
    const weak = input("weak")
    const manifest = trainLeanInitialCandidates({ ...weak, trainingExamples: weak.trainingExamples.map((example) => ({ ...example, trainingHalfPoints: 0 })) }, builders)
    expect(manifest.candidates.map((candidate) => candidate.disposition)).toEqual(["weak_preserved", "weak_preserved"])
    expect(manifest.candidates.flatMap((candidate) => candidate.trainingMatchRoots)).toHaveLength(8)
  })

  it("creates one response attempt against the frozen initial root and denies privileged fields", () => {
    const cold = input("one")
    const initial = trainLeanInitialCandidates(cold, builders)
    const responseExamples = examples("response", 1, 8)
    const plannerCorpus = buildFeasibilityCorpus().selectActivations
    const responsePlannerNodes = Array.from({ length: 8 }, (_, index) => ({ input: plannerCorpus[index % plannerCorpus.length]!.input, trainingMatchRoot: responseExamples[index * 8]!.trainingMatchRoot }))
    const response = trainLeanResponse({ ...cold, initial, responseExamples, responsePlannerNodes, targetRoots: { mixture: root("frozen-mixture"), strongestPure: root("strongest-pure") } })
    expect(response.candidates).toHaveLength(3)
    expect(response.candidates[2]!.mechanism).toBe("response")
    expect(response.candidates[2]!.trainingMatchRoots).toHaveLength(8)
    expect(response.stage).toBe("response_complete")
    expect(response.vector).toEqual(LEAN_TRAINING_VECTOR)
    const responseDecision = JSON.parse(JSON.stringify(response.candidates[2]!.decisionRoot))
    expect(responseDecision).toMatch(/^sha256:/u)
    expect(() => trainLeanInitialCandidates({ ...cold, trainingExamples: cold.trainingExamples.map((example) => ({ ...example, input: { ...example.input, hiddenCanonicalState: { winner: "teacher" } } as SoldierBrainInputV119 })) }, builders)).toThrow("LEAN_TRAINING_LEGAL_INPUT")
  })

  it("rejects altered operation arithmetic and warm-start claims", () => {
    const manifest = trainLeanInitialCandidates(input("one"), builders)
    expect(() => auditLeanTrainingVector({ ...manifest, vector: { ...manifest.vector, totalChannelOperations: 256 } as unknown as typeof manifest.vector })).toThrow("LEAN_TRAINING_AUDIT")
    expect(() => trainLeanInitialCandidates({ ...input("one"), predecessorRoot: root("learned-predecessor") as never }, builders)).toThrow("LEAN_TRAINING_WARM_START")
  })

  it("rejects forged teacher receipt payloads and keeps the exact canonical node total", () => {
    const good = input("one")
    expect(() => trainLeanInitialCandidates({ ...good, teacherSearchReceipts: [{ ...good.teacherSearchReceipts[0] as object, nodesVisited: 63 }] }, builders)).toThrow("LEAN_TRAINING_TEACHER_NODE_COUNT")
    expect(() => trainLeanInitialCandidates({ ...good, teacherSearchReceipts: [{ ...good.teacherSearchReceipts[0] as object, hiddenCanonicalState: { winner: "teacher" } }] }, builders)).toThrow("LEAN_TRAINING_TEACHER_RECEIPT_SCHEMA")
  })

  it("rejects inconsistent Match outcomes and non-bijective planner Match partitions", () => {
    const good = input("one")
    const inconsistent = good.trainingExamples.map((example, index) => index === 0 ? { ...example, trainingHalfPoints: 2 as const } : example)
    expect(() => trainLeanInitialCandidates({ ...good, trainingExamples: inconsistent }, builders)).toThrow("LEAN_TRAINING_MATCH_SCORE_BINDING")
  })
})
