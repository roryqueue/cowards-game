import { describe, expect, it } from "vitest"
import { classifyNumericComparison, compareNumericEvidence, freezeNumericCalibrationThreshold, type NumericCalibrationEvidence, type NumericComparison } from "./numeric-calibration.js"

const evidence = (suffix: string, variation = false): NumericCalibrationEvidence => ({
  sourceStructureTokens: ["export", "default", "select", variation ? suffix : "shared"],
  lineageEdgeTokens: ["base->candidate", variation ? suffix : "shared-edge"],
  dependencyEdgeTokens: ["runtime->abi", variation ? suffix : "shared-dependency"],
  legalInputSamples: { select: ["legal", variation ? suffix : "turn"] },
  chronicleSamples: { phase: ["activation", variation ? suffix : "stone"] },
  matchupSamples: { fixed: ["draw", variation ? suffix : "stable"] },
})
const comparison = (score: number, informativeCount = 1): NumericComparison => ({
  dimensions: {
    sourceStructure: { score, informativeCount }, lineage: { score, informativeCount }, dependency: { score, informativeCount },
    legalInput: { score, informativeCount }, chronicle: { score, informativeCount }, matchup: { score, informativeCount },
  },
  informativeDimensions: informativeCount === 0 ? 0 : 6,
  weightedMean: informativeCount === 0 ? null : score,
})
const validControls = () => ({
  "S01/S02": comparison(0.92), "S03/S04": comparison(0.88), "S05/S06": comparison(0.9),
  "S01/S07": comparison(0.72), "S01/S08": comparison(0.3), "S11/S12": comparison(0.68),
}) as const

describe("numeric factory calibration", () => {
  it("derives bounded scores from parsed tokens and matched declared samples", () => {
    const result = compareNumericEvidence(evidence("left"), evidence("right", true))
    expect(result.informativeDimensions).toBe(6)
    expect(result.weightedMean).toBeGreaterThan(0)
    expect(result.weightedMean).toBeLessThan(1)
    for (const dimension of Object.values(result.dimensions)) { expect(dimension.score).toBeGreaterThanOrEqual(0); expect(dimension.score).toBeLessThanOrEqual(1); expect(dimension.informativeCount).toBeGreaterThan(0) }
  })

  it("treats absent edges and unmatched behavioral sample keys as noninformative", () => {
    const left = evidence("left"), right = { ...evidence("right"), lineageEdgeTokens: [], dependencyEdgeTokens: [], legalInputSamples: { other: ["same"] }, chronicleSamples: {}, matchupSamples: {} }
    const result = compareNumericEvidence(left, right)
    expect(result.dimensions.lineage).toEqual({ score: null, informativeCount: 0 })
    expect(result.dimensions.dependency).toEqual({ score: null, informativeCount: 0 })
    expect(result.dimensions.legalInput).toEqual({ score: null, informativeCount: 0 })
    expect(result.informativeDimensions).toBe(1)
  })

  it("freezes one separated six-control fit and classifies only after freezing", () => {
    const frozen = freezeNumericCalibrationThreshold(validControls())
    expect(frozen.status).toBe("frozen")
    if (frozen.status !== "frozen") throw new Error("expected frozen threshold")
    expect(classifyNumericComparison(comparison(0.9), frozen.threshold)).toBe("correlated")
    expect(classifyNumericComparison(comparison(0.2), frozen.threshold)).toBe("distinct")
    expect(classifyNumericComparison(comparison(0.7), frozen.threshold)).toBe("unresolved")
  })

  it("keeps both named borderlines unresolved and rejects all-equal or label-swapped fits", () => {
    const equal = Object.fromEntries(Object.keys(validControls()).map((key) => [key, comparison(0.5)])) as unknown as ReturnType<typeof validControls>
    expect(freezeNumericCalibrationThreshold(equal)).toMatchObject({ status: "unresolved" })
    const swapped = { ...validControls(), "S01/S02": comparison(0.3), "S01/S08": comparison(0.92) }
    expect(freezeNumericCalibrationThreshold(swapped)).toMatchObject({ status: "unresolved" })
    const borderlineCorrelated = { ...validControls(), "S01/S07": comparison(0.9) }
    expect(freezeNumericCalibrationThreshold(borderlineCorrelated)).toMatchObject({ status: "unresolved" })
    const borderlineDistinct = { ...validControls(), "S11/S12": comparison(0.2) }
    expect(freezeNumericCalibrationThreshold(borderlineDistinct)).toMatchObject({ status: "unresolved" })
  })

  it("returns unresolved for insufficient, mixed, or malformed numeric evidence", () => {
    const frozen = freezeNumericCalibrationThreshold(validControls())
    if (frozen.status !== "frozen") throw new Error("expected frozen threshold")
    expect(classifyNumericComparison(comparison(0.9, 0), frozen.threshold)).toBe("unresolved")
    const mixed = comparison(0.9); mixed.dimensions.matchup = { score: 0.1, informativeCount: 1 }
    expect(classifyNumericComparison(mixed, frozen.threshold)).toBe("unresolved")
    expect(() => compareNumericEvidence({ ...evidence("left"), sourceStructureTokens: [""] }, evidence("right"))).toThrow("NUMERIC_CALIBRATION_EVIDENCE")
  })
})
