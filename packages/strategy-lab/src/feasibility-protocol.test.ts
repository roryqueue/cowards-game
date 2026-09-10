import { describe, expect, it } from "vitest"
import { resolveStrategyInputSchema, resolveSoldierBrainInputSchema, DEFAULT_RUNTIME_LIMITS } from "@cowards/spec"
import { PLANNER_FEASIBILITY_PROTOCOL as P, buildFeasibilityCorpus, buildFeasibilityAllocation, validateFeasibilityAllocation, evaluateFeasibilityTiming, validateFeasibilityProtocol } from "./feasibility-protocol.js"

describe("frozen source-independent feasibility protocol", () => {
  it("freezes 24 charges across12 labels but only8 scientific cells", () => {
    const a = buildFeasibilityAllocation()
    expect(a).toHaveLength(24)
    expect(new Set(a.map((v) => v.taskRoot)).size).toBe(12)
    expect(new Set(a.map((v) => v.geometryCellRoot)).size).toBe(8)
    expect(a.filter((v) => v.scientificEligible)).toHaveLength(8)
    expect(a.filter((v) => v.aliasCompatibility)).toHaveLength(8)
    expect(validateFeasibilityAllocation(a)).toEqual(a)
    expect(() => validateFeasibilityAllocation([...a, a[0]])).toThrow()
    expect(() => validateFeasibilityAllocation(a.map((v) => ({ ...v, scientificEligible: true })))).toThrow()
    expect(() => validateFeasibilityAllocation(a.map((v) => ({ ...v, retry: 1 })))).toThrow()
  })
  it("preserves benchmark identity, admitted runtime and strict separate method p99", () => {
    expect(P.benchmark.identity).toBe("v1.38-direct-execution-benchmark-v1")
    expect(P.benchmark.totalInvocations).toBe(2200)
    expect(P.budget.validationInvocations).toBe(256)
    expect(P.budget.totalInvocationCeiling).toBe(597656)
    expect(P.runtimeLimits).toEqual(DEFAULT_RUNTIME_LIMITS)
    expect(P.runtimeLimits.timeoutMs).toBe(1000)
    expect(P.budget.retries).toBe(0)
    const fast = Array.from({ length: 1000 }, () => 4.9)
    expect(evaluateFeasibilityTiming({ selectActivations: fast, soldierBrain: fast }).passed).toBe(true)
    expect(evaluateFeasibilityTiming({ selectActivations: fast, soldierBrain: Array(1000).fill(5) }).passed).toBe(false)
    expect(evaluateFeasibilityTiming({ selectActivations: [...Array(990).fill(4), ...Array(10).fill(10)], soldierBrain: fast }).selectActivationsP99Ms).toBe(4)
    expect(() => evaluateFeasibilityTiming({ selectActivations: fast.slice(1), soldierBrain: fast })).toThrow()
    for (const drift of [{ ...P, budget: { ...P.budget, retries: 1 } }, { ...P, benchmark: { ...P.benchmark, thresholdMs: 6 } }, { ...P, benchmark: { ...P.benchmark, identity: "other" } }]) {
      expect(() => validateFeasibilityProtocol(drift)).toThrow()
    }
  })
  it("builds100 stable legal cases per method with full mission/family coverage and frozen exact hashes", () => {
    const corpus = buildFeasibilityCorpus()
    expect(corpus).toEqual(buildFeasibilityCorpus())
    expect(corpus.selectActivations).toHaveLength(100)
    expect(corpus.soldierBrain).toHaveLength(100)
    for (const method of ["selectActivations", "soldierBrain"] as const) {
      expect(new Set(corpus[method].map((c) => c.mission)).size).toBe(10)
      expect(new Set(corpus[method].map((c) => c.family)).size).toBe(10)
      expect(new Set(corpus[method].map((c) => c.caseRoot)).size).toBe(100)
      for (const c of corpus[method]) {
        const schema = method === "selectActivations" ? resolveStrategyInputSchema("strategy-runtime-abi-v1.19") : resolveSoldierBrainInputSchema("strategy-runtime-abi-v1.19")
        expect(schema!.safeParse(c.input).success).toBe(true)
        expect(Object.isFrozen(c.input)).toBe(true)
      }
    }
    expect(corpus.root).toBe(P.corpusRoot)
    expect(P.benchmark.inputReset).toBe("fresh-input-and-memory-every-call")
  })
})
