import { describe, expect, it } from "vitest"
import { resolveStrategyInputSchema, resolveSoldierBrainInputSchema, DEFAULT_RUNTIME_LIMITS } from "@cowards/spec"
import { PLANNER_FEASIBILITY_PROTOCOL as P, buildFeasibilityCorpus, buildFeasibilityAllocation, validateFeasibilityAllocation, evaluateFeasibilityTiming, validateFeasibilityProtocol } from "./feasibility-protocol.js"
import { evaluateMission, validateMission, type MissionObjective } from "./planner/missions.js"
import { observeBrainMission } from "./planner/brain.js"

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
    expect(corpus.sourceCorpusRoot).toBe("sha256:b14605fdf1d117e0759fb75df0719f6196f54dda8f63660b14742937a7edaed3")
    expect(corpus.root).not.toBe(corpus.sourceCorpusRoot)
    expect(corpus.root).toBe("sha256:fe109ecf734e1f8d0dcdebd140037f083a4a51f7e28cd22a0e313133eb116340")
    expect(corpus).toEqual(buildFeasibilityCorpus())
    expect(corpus.selectActivations).toHaveLength(100)
    expect(corpus.soldierBrain).toHaveLength(100)
    for (const method of ["selectActivations", "soldierBrain"] as const) {
      expect(new Set(corpus[method].map((c) => c.mission)).size).toBe(10)
      expect(new Set(corpus[method].map((c) => c.family)).size).toBe(10)
      expect(new Set(corpus[method].map((c) => c.caseRoot)).size).toBe(100)
      expect(new Set(corpus[method].map((c) => c.inputRoot)).size).toBe(100)
      for (const c of corpus[method]) {
        const schema = method === "selectActivations" ? resolveStrategyInputSchema("strategy-runtime-abi-v1.19") : resolveSoldierBrainInputSchema("strategy-runtime-abi-v1.19")
        expect(schema!.safeParse(c.input).success).toBe(true)
        expect(Object.isFrozen(c.input)).toBe(true)
      }
    }
    expect(corpus.root).toBe(P.corpusRoot)
    expect(P.benchmark.inputReset).toBe("fresh-input-and-memory-every-call")
  })
  it("exercises deployed active, expired, target-failed and absent fallback paths", () => {
    const corpus = buildFeasibilityCorpus()
    const observed = new Set(corpus.soldierBrain.map(c => observeBrainMission(c.input).status))
    expect(observed).toEqual(new Set(["active", "complete", "stale", "absent", "invalid"]))
    for (const c of corpus.selectActivations.filter(c => c.family !== "hostile-schema")) {
      const missions = (c.input.strategyMemory as { missions: MissionObjective[] }).missions
      expect(missions.every(m => validateMission(m, c.input))).toBe(true)
      const statuses = missions.map(m => evaluateMission(m, c.input).status)
      if (c.family === "stale") expect(statuses).toContain("stale")
      if (c.family === "failure") expect(statuses).toContain("failed")
      if (c.family === "fallback") expect(missions).toEqual([])
    }
    const kinds = corpus.soldierBrain.filter(c => c.family === "positive").map(c => (c.input.objective as unknown as MissionObjective).kind)
    expect(new Set(kinds).size).toBe(10)
  })
})
