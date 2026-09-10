import { describe, expect, it } from "vitest"
import { MATCH_KERNEL } from "@cowards/engine"
import { LAB_ADMITTED_ROOTS, labRoot } from "./contracts.js"
import { buildFeasibilityCorpus, PLANNER_FEASIBILITY_PROTOCOL } from "./feasibility-protocol.js"
import { runPlannerBenchmark, evaluatePlannerBenchmark, type BenchmarkProvider, type BenchmarkObservation } from "./benchmark.js"
const root = labRoot("synthetic-benchmark", 1)
const corpus = buildFeasibilityCorpus()
const commitment = { corpusRoot: corpus.root, sourceRoot: root, executableRoot: root, harnessRoot: root, profileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, budgetRoot: PLANNER_FEASIBILITY_PROTOCOL.budgetRoot, attemptRoot: root, machineRoot: root }
const synthetic = (ms = 1): BenchmarkProvider => {
  let ordinal = 0
  const issued = new WeakSet<object>(); const observations = new WeakMap<object, BenchmarkObservation>(); const timingIssued = new WeakSet<object>()
  const identity = { revisionId: "synthetic-only", sourceRoot: root, executableRoot: root, harnessRoot: root, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, budgetRoot: commitment.budgetRoot, attemptRoot: root }
  return { identity, invoke(request) {
    const invocationRoot = labRoot("synthetic-benchmark-call", ordinal)
    const e = { identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", request.input), ordinal: ordinal++, invocationRoot, charged: true, completed: true, outputBytes: 40, result: { ok: true as const, value: {} } }
    const observation: BenchmarkObservation = { runtime: e, observation: { binding: { invocationRoot, sourceRoot: root, executableRoot: root, inputRoot: e.inputRoot, method: request.kind, tupleId: identity.tupleId, harnessRoot: root, profileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }, durationMs: ms, complete: true }, transportMs: 10, totalMs: 12, provenance: "synthetic_transport" }
    issued.add(e); timingIssued.add(observation); observations.set(e, observation); return e
  }, verify(e) { return issued.has(e) }, timing(e) { return observations.get(e) }, verifyTiming(e) { return timingIssued.has(e) }, close() { return { cleanupComplete: true, orphanedChild: false } } }
}
describe("fixed benchmark protocol with synthetic observations only", () => {
  it("charges 2200 calls, excludes exactly100 warmups per method, never claims empirical pass", async () => {
    const result = await runPlannerBenchmark({ provider: synthetic(), commitment, corpus })
    expect(result).toMatchObject({ charged: 2200, measuredPerMethod: 1000, warmupsPerMethod: 100, passed: false, protocolPassed: true, empirical: false, selectActivationsP99Ms: 1, soldierBrainP99Ms: 1 })
  })
  it("strict5ms fails independently for each method", async () => {
    expect(await runPlannerBenchmark({ provider: synthetic(5), commitment, corpus })).toMatchObject({ passed: false, protocolPassed: false, selectActivationsP99Ms: 5, soldierBrainP99Ms: 5 })
  })
  it.each(["missing", "extra", "reordered", "forged", "wrong-source", "wrong-hardware"])("rejects %s evidence", async (fault) => {
    const provider = synthetic(); const observations: BenchmarkObservation[] = []
    const original = provider.timing; provider.timing = (e) => { const t = original(e); if (t) observations.push(t); return t }
    await runPlannerBenchmark({ provider, commitment, corpus })
    if (fault === "missing") observations.pop()
    if (fault === "extra") observations.push(observations[0]!)
    if (fault === "reordered") [observations[0], observations[1]] = [observations[1]!, observations[0]!]
    if (fault === "forged") observations[0] = structuredClone(observations[0]!)
    const expected = fault === "wrong-source" ? { ...commitment, sourceRoot: labRoot("wrong", 1) } : fault === "wrong-hardware" ? { ...commitment, machineRoot: labRoot("wrong", 1) } : commitment
    expect(() => evaluatePlannerBenchmark({ provider, commitment: expected, observedCommitment: commitment, observations, corpus, cleanupComplete: true })).toThrow()
  })
  it("rejects altered corpus and stops after a charged failed call without resampling", async () => {
    const changed = structuredClone(corpus); changed.selectActivations[0]!.input.strategyMemory = { tampered: true }
    await expect(runPlannerBenchmark({ provider: synthetic(), commitment, corpus: changed })).rejects.toThrow()
    const p = synthetic(); p.timing = () => undefined
    expect(await runPlannerBenchmark({ provider: p, commitment, corpus })).toMatchObject({ passed: false, charged: 1, reason: "incomplete_or_failed" })
  })
})
