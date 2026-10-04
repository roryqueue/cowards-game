import { describe, it, expect } from "vitest"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { analyseLeanDistinctPairs, selectLeanMixtureTarget } from "./v1-38-lean-baseline-analysis.js"
const a = labRoot("source", "a"), b = labRoot("source", "b")
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
