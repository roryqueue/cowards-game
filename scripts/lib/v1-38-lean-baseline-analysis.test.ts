import { describe, it, expect } from "vitest"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { analyseLeanDistinctPairs, analyseLeanResponseAdmission, selectLeanMixtureTarget } from "./v1-38-lean-baseline-analysis.js"
const a = labRoot("source", "a"), b = labRoot("source", "b"), response = labRoot("source", "response")
const cells = () => Array.from({ length: 4 }, (_, ordinal) => ({ ordinal, bottomSourceRoot: a, topSourceRoot: b, outcome: "DRAW" as const, executionRoot: labRoot("execution", ordinal), semanticRoot: labRoot("semantic", ordinal) }))
describe("bounded empirical pair analysis", () => {
  it("solves only complete distinct pairs with honest four-Match denominator", () => {
    const result = analyseLeanDistinctPairs([a, b], cells())
    expect(result.matrixCellCount).toBe(4)
    expect(result.pairDenominators[0]?.matches).toBe(4)
    expect(result.claim).toBe("no_robust_pure_claimed")
    expect(result.historicalFullSnapshotCredit).toBe(false)
    expect(result.exactNumericalSolver).toBe("solved")
    expect(analyseLeanDistinctPairs([b, a], [...cells()].reverse()).root).toBe(result.root)
    expect(() => analyseLeanDistinctPairs([a, b], cells().slice(1))).toThrow()
    expect(() => analyseLeanDistinctPairs([a, b], [...cells().slice(1), cells()[1]!])).toThrow()
  })
  it("samples a frozen diagnostic mixture by deterministic quantiles without randomness", () => {
    const mixture = [{ sourceRoot: a, numerator: "1", denominator: "2" }, { sourceRoot: b, numerator: "1", denominator: "2" }]
    const targets = Array.from({ length: 4 }, (_, ordinal) => selectLeanMixtureTarget(mixture, ordinal))
    expect(targets.filter(v => v === a)).toHaveLength(2)
    expect(targets.filter(v => v === b)).toHaveLength(2)
    expect(() => selectLeanMixtureTarget(mixture.slice(1), 0)).toThrow()
  })
})

const responseCells = (aPoints: number, bPoints: number) => [a, b].flatMap((opponent, opponentIndex) => {
  const points = opponentIndex === 0 ? aPoints : bPoints
  return Array.from({ length: 4 }, (_, index) => ({ ordinal: 20 + opponentIndex * 4 + index, bottomSourceRoot: response, topSourceRoot: opponent,
    outcome: (index < Math.floor(points / 2) ? "bottom" : index === Math.floor(points / 2) && points % 2 ? "DRAW" : "top") as "bottom" | "top" | "DRAW",
    executionRoot: labRoot("response-execution", [opponentIndex, index]), semanticRoot: labRoot("response-semantic", [opponentIndex, index]) }))
})
const admission = (aPoints: number, bPoints: number, aWeight = "3", bWeight = "2") => analyseLeanResponseAdmission({
  initialSources: [a, b], frozenMixture: [{ sourceRoot: a, numerator: aWeight, denominator: "5" }, { sourceRoot: b, numerator: bWeight, denominator: "5" }],
  strongestPureRoot: a, strongestInitialMinimumHalfPoints: 1.25, responseRoot: response, responseCells: responseCells(aPoints, bPoints),
})
describe("frozen response admission, distinct from security diagnostic", () => {
  it("uses exact strict >0.55 and keeps the unsupported strongest-pure comparator explicit", () => {
    const equal = admission(6, 2)
    expect(equal.frozenMixtureNormalizedScore).toMatchObject({ numerator: "11", denominator: "20", passed: false })
    expect(equal.disposition).toBe("frozen_mixture_threshold_not_met")
    const below = admission(4, 2)
    expect(below.frozenMixtureNormalizedScore.passed).toBe(false)
    const above = admission(6, 4)
    expect(above.frozenMixtureNormalizedScore.passed).toBe(true)
    expect(above.strongestPureFreshComparator).toMatchObject({ status: "unsupported", reason: "strongest_pure_self_pair_not_allocated", missingOpponentRoot: a, allocatedComparablePairings: 4 })
    expect(above.admitted).toBe(false)
    expect(above.disposition).toBe("fresh_strongest_pure_comparator_unsupported")
  })
  it("rejects the misleading unweighted security-gap counterexample", () => {
    const observed = analyseLeanResponseAdmission({ initialSources: [a, b], frozenMixture: [{ sourceRoot: a, numerator: "1", denominator: "1" }, { sourceRoot: b, numerator: "0", denominator: "1" }], strongestPureRoot: a, strongestInitialMinimumHalfPoints: 1.25, responseRoot: response, responseCells: responseCells(4, 8) })
    expect(observed.unweightedSecurityDiagnostic.gapHalfPoints).toBe(0.25)
    expect(observed.frozenMixtureNormalizedScore).toMatchObject({ numerator: "1", denominator: "2", passed: false })
    expect(observed.admitted).toBe(false)
    expect(observed.freshPairings).toBe(8)
  })
})
