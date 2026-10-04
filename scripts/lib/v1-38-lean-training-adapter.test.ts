import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { SoldierBrainInputV119Schema, type SoldierBrainInputV119 } from "../../packages/spec/src/index.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { projectTeacherSearchToLegalTraining, searchCanonicalCounterfactual } from "../../packages/strategy-oracle-teacher/src/index.js"
import {
  buildLeanInitialProposals,
  selectLeanBestTrainedProposal,
  selectLeanTrainedProposal,
} from "./v1-38-lean-training-adapter.js"

const root = (value: string) => `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}` as const
const soldier = (id: string, ownerPlayerId: string, x: number, y: number) => ({ id, ownerPlayerId, status: "ACTIVE" as const, position: { x, y }, facing: "RIGHT" as const, lastSuccessfulMoveDirection: null })
const brain = (variant: number): SoldierBrainInputV119 => SoldierBrainInputV119Schema.parse({
  self: soldier("self:a", "self", 2, 2),
  awarenessGrid: { cells: Array.from({ length: 25 }, (_, index) => {
    const dx = index % 5 - 2, dy = Math.floor(index / 5) - 2
    const enemyDx = variant % 3 - 1
    return { dx, dy, absoluteX: dx + 2, absoluteY: dy + 2, contents: dx === enemyDx && dy === 0 ? "ENEMY_ACTIVE" : "EMPTY" }
  }) },
  cycleIndex: variant % 12, maxCycles: 12, objective: null, soldierMemory: {}, hasAdvancedThisActivation: variant % 2 === 0,
}) as SoldierBrainInputV119
const canonicalMatch = {
  matchId: "lean-adapter-match", seed: "lean-adapter-seed",
  arenaVariant: { id: "lean-adapter-arena", name: "Adapter arena", initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 }, terrainStones: [] },
  bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "bottom-revision", topStrategyRevisionId: "top-revision", initialInitiativePlayerId: "bottom",
}
const receipt = () => searchCanonicalCounterfactual({ canonicalMatch, studentPlayerId: "bottom", counterfactual: { opponentHypothesis: "cautious" }, maxDepth: 6, maxNodes: 64 })

describe("trusted lean training mechanism adapter", () => {
  it("builds deterministic tactical profile beam from exactly 64 legal scorer evaluations", () => {
    const inputs = Array.from({ length: 64 }, (_, index) => brain(index))
    const first = buildLeanInitialProposals({ commonSourceRoot: root("common"), tacticalInputs: inputs, teacherSearchReceipts: [receipt()] })
    const second = buildLeanInitialProposals({ commonSourceRoot: root("common"), tacticalInputs: inputs, teacherSearchReceipts: [receipt()] })
    expect(first.root).toBe(second.root)
    expect(first.operations).toEqual({ tacticalEvaluations: 64, teacherSearchNodes: 64, distillationExamples: 64, maximumTacticalBeam: 4 })
    expect(first.tactical).toHaveLength(4)
    expect(new Set(first.tactical.map((candidate) => candidate.sourceRoot)).size).toBe(4)
    expect(first.tactical.every((candidate) => candidate.inputRoots.length === 64)).toBe(true)
    expect(first.tactical[0]!.source).not.toBe(first.tactical[1]!.source)
  })

  it("uses exactly 64 canonical teacher nodes and honestly resamples only projected legal labels", () => {
    const teacherReceipt = receipt()
    const uniqueLabels = projectTeacherSearchToLegalTraining(teacherReceipt)
    expect(teacherReceipt.nodesVisited).toBe(64)
    expect(uniqueLabels.length).toBeGreaterThan(0)
    expect(uniqueLabels.length).toBeLessThan(64)
    const result = buildLeanInitialProposals({ commonSourceRoot: root("common"), tacticalInputs: Array.from({ length: 64 }, (_, index) => brain(index)), teacherSearchReceipts: [teacherReceipt] })
    expect(result.teacherSearchNodeRoots).toHaveLength(64)
    expect(result.distillationExampleRoots).toHaveLength(64)
    expect(result.teacherProjectedDistinctLabelCount).toBe(uniqueLabels.length)
    expect(result.teacherResamplingRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(result.teacher.inputRoots).toHaveLength(64)
    expect(result.teacher.source).not.toContain(teacherReceipt.canonicalTransitionRoot)
    expect(result.teacher.source).not.toContain(teacherReceipt.selectedOutcomeRoot)
  })

  it("keeps paired hidden receipt metadata out of deployed teacher choices", () => {
    const visible = receipt()
    const hiddenPair = {
      ...visible,
      canonicalTransitionRoot: root("different-hidden-transition"),
      selectedOutcomeRoot: root("different-hidden-outcome"),
      outcomeRoots: visible.outcomeRoots.map((_, index) => root(`paired-outcome-${index}`)),
      outcomes: visible.outcomes.map((outcome, index) => ({ ...outcome, outcomeRoot: root(`paired-root-${index}`), stateRoot: root(`paired-state-${index}`), score: [99, 99, 99, 99] })),
    }
    expect(projectTeacherSearchToLegalTraining(hiddenPair)).toEqual(projectTeacherSearchToLegalTraining(visible))
    const left = buildLeanInitialProposals({ commonSourceRoot: root("common"), tacticalInputs: Array.from({ length: 64 }, (_, index) => brain(index)), teacherSearchReceipts: [visible] })
    const right = buildLeanInitialProposals({ commonSourceRoot: root("common"), tacticalInputs: Array.from({ length: 64 }, (_, index) => brain(index)), teacherSearchReceipts: [hiddenPair] })
    expect(left.teacher.source).toBe(right.teacher.source)
    expect(left.teacher.source).not.toContain(root("different-hidden-transition"))
    expect(left.teacher.source).not.toContain(root("different-hidden-outcome"))
    expect(left.teacher.root).not.toBe(right.teacher.root)
  })

  it("rejects underfilled canonical search rather than inventing node or label evidence", () => {
    const underfilled = searchCanonicalCounterfactual({ canonicalMatch, studentPlayerId: "bottom", counterfactual: { opponentHypothesis: "cautious" }, maxDepth: 1, maxNodes: 2 })
    expect(underfilled.nodesVisited).toBe(2)
    expect(() => buildLeanInitialProposals({ commonSourceRoot: root("common"), tacticalInputs: Array.from({ length: 64 }, (_, index) => brain(index)), teacherSearchReceipts: [underfilled] })).toThrow("LEAN_TRAINING_ADAPTER_TEACHER_EXACT_NODES")
  })

  it("selects only after four distinct actual Match rows and preserves weak attempts", () => {
    const proposals = buildLeanInitialProposals({ commonSourceRoot: root("common"), tacticalInputs: Array.from({ length: 64 }, (_, index) => brain(index)), teacherSearchReceipts: [receipt()] })
    const rows = (prefix: string, points: readonly (0 | 1 | 2)[]) => points.map((trainingHalfPoints, index) => ({ trainingMatchRoot: labRoot("lean-test-match", `${prefix}-${index}`), trainingHalfPoints }))
    const tacticalWeak = selectLeanTrainedProposal(proposals.tactical[0]!, rows("weak", [0, 0, 0, 0]))
    expect(tacticalWeak.disposition).toBe("weak_preserved")
    expect(tacticalWeak.trainingHalfPoints).toBe(0)
    const beamRows = proposals.tactical.map((candidate, index) => ({ proposalRoot: candidate.root, trainingMatchRoot: labRoot("lean-test-match", `beam-${index}`), trainingHalfPoints: ([0, 2, 1, 0] as const)[index]! }))
    const selected = selectLeanBestTrainedProposal(proposals.tactical, beamRows)
    expect(selected.selectedSourceRoot).toBe(proposals.tactical[1]!.sourceRoot)
    expect(selected.trainingHalfPoints).toBe(2)
    expect(selected.trainingMatchCount).toBe(1)
    expect(() => selectLeanTrainedProposal(proposals.teacher, rows("duplicate", [2, 1, 0, 2]).map((row, index) => index === 3 ? rows("duplicate", [0])[0]! : row))).toThrow("LEAN_TRAINING_ADAPTER_TRAINING_RESULT_ROWS")
  })
})
