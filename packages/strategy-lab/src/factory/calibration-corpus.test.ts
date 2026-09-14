import { describe, expect, it } from "vitest"
import { FACTORY_CALIBRATION_CORPUS, evaluateFactoryCalibrationCorpus, requireIssuedFactoryCalibrationObservations } from "./calibration-corpus.js"

describe("bounded development calibration projection corpus", () => {
  it("derives all six dimensions and actual agreement counts from concrete paired records", () => {
    const observations = evaluateFactoryCalibrationCorpus()
    expect(FACTORY_CALIBRATION_CORPUS).toHaveLength(6)
    expect(observations.every((entry) => entry.matchesExpected)).toBe(true)
    expect(observations.every((entry) => Object.keys(entry.dimensions).length === 6)).toBe(true)
    expect(observations.every((entry) => entry.evidenceClass === "mechanics_only" && entry.independence === "unresolved")).toBe(true)
    expect(observations[3]!.agreement).toEqual({ samples: 4, decisions: 3, behaviors: 3, matchupResponses: 3 })
    expect(observations[4]!.agreement).toEqual({ samples: 4, decisions: 2, behaviors: 2, matchupResponses: 2 })
    expect(observations[4]!.classification).toBe("distinct")
    expect(observations[5]!.classification).toBe("borderline")
    expect(observations[5]!.dimensions.sourceStructure.equal).toBe(false)
    expect(observations[5]!.dimensions.legalInputDecision.equal).toBe(true)
  })

  it("recognizes cosmetic rewrites, a shared selector, and reflected opaque-id fixtures", () => {
    const observations = evaluateFactoryCalibrationCorpus()
    expect(observations[0]!.dimensions.sourceStructure.equal).toBe(true)
    expect(observations[1]!.dimensions.sourceStructure.equal).toBe(false)
    expect(observations[1]!.dimensions.dependency.equal).toBe(true)
    expect(FACTORY_CALIBRATION_CORPUS[2]!.left.samples[0]!.soldierId).not.toBe(FACTORY_CALIBRATION_CORPUS[2]!.right.samples[0]!.soldierId)
    expect(observations.slice(0, 3).map((entry) => entry.classification)).toEqual(["correlated", "correlated", "correlated"])
  })

  it("is deterministic and immutable and refuses copied, reordered, partial or caller-root evidence", () => {
    const first = evaluateFactoryCalibrationCorpus(), second = evaluateFactoryCalibrationCorpus()
    expect(first).toEqual(second)
    expect(requireIssuedFactoryCalibrationObservations(first)).toBe(first)
    expect(Object.isFrozen(first[0]!.dimensions.sourceStructure)).toBe(true)
    expect(Object.isFrozen(FACTORY_CALIBRATION_CORPUS[0]!.left.samples)).toBe(true)
    expect(() => requireIssuedFactoryCalibrationObservations(structuredClone(first))).toThrow("UNISSUED")
    expect(() => requireIssuedFactoryCalibrationObservations([...first].reverse())).toThrow("UNISSUED")
    expect(() => requireIssuedFactoryCalibrationObservations(first.slice(1))).toThrow("UNISSUED")
    expect(() => requireIssuedFactoryCalibrationObservations([{ caseId: "semantic-rewrite", dimensionRoots: ["sha256:" + "a".repeat(64)] }] as never)).toThrow("UNISSUED")
  })
})
