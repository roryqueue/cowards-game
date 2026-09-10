import { describe, expect, it } from "vitest"
import { MATCH_KERNEL } from "@cowards/engine"
import { LAB_ADMITTED_ROOTS, labRoot } from "./contracts.js"
import { buildFeasibilityCorpus, evaluateFeasibilityTiming, PLANNER_FEASIBILITY_PROTOCOL } from "./feasibility-protocol.js"
import { runPlannerBenchmark, evaluatePlannerBenchmark, type BenchmarkProvider, type BenchmarkObservation } from "./benchmark.js"
const root = labRoot("synthetic-benchmark", 1)
const corpus = buildFeasibilityCorpus()
const inputRoots = { selectActivations: corpus.selectActivations.map((c) => labRoot("runtime-input", c.input)), soldierBrain: corpus.soldierBrain.map((c) => labRoot("runtime-input", c.input)) }
const commitment = { revisionId: "synthetic-only", corpusRoot: corpus.root, sourceRoot: root, executableRoot: root, harnessRoot: root, profileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, budgetRoot: PLANNER_FEASIBILITY_PROTOCOL.budgetRoot, attemptRoot: root, machineRoot: root }
const synthetic = (ms = 1): BenchmarkProvider => {
  let ordinal = 0
  const issued = new WeakSet<object>(); const observations = new WeakMap<object, BenchmarkObservation>(); const timingIssued = new WeakSet<object>()
  const identity = { revisionId: "synthetic-only", sourceRoot: root, executableRoot: root, harnessRoot: root, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, budgetRoot: commitment.budgetRoot, attemptRoot: root }
  return { identity, invoke(request) {
    const invocationRoot = labRoot("synthetic-benchmark-call", ordinal)
    const e = { identity, requestId: request.requestId, method: request.kind, inputRoot: inputRoots[request.kind][ordinal % 1100 % 100]!, ordinal: ordinal++, invocationRoot, charged: true, completed: true, outputBytes: 40, result: { ok: true as const, value: {} } }
    const observation: BenchmarkObservation = { runtime: e, observation: { binding: { invocationRoot, sourceRoot: root, executableRoot: root, inputRoot: e.inputRoot, method: request.kind, tupleId: identity.tupleId, harnessRoot: root, profileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }, durationMs: ms, complete: true }, transportMs: 10, totalMs: 12, machineRoot: root, provenance: "synthetic_transport" }
    issued.add(e); timingIssued.add(observation); observations.set(e, observation); return e
  }, verify(e) { return issued.has(e) }, timing(e) { return observations.get(e) }, verifyTiming(e) { return timingIssued.has(e) }, close() { return { cleanupComplete: true, orphanedChild: false } } }
}
describe("fixed benchmark protocol with synthetic observations only", () => {
  it.each(["sourceRoot", "harnessRoot", "attemptRoot"] as const)("rejects wrong initial %s before any charged call", async field => {
    const provider = synthetic(); let calls = 0, closed = 0
    provider.identity[field] = labRoot("wrong", field)
    provider.invoke = () => { calls++; throw new Error("must not dispatch") }
    provider.close = () => { closed++; return { cleanupComplete: true, orphanedChild: false } }
    expect(await runPlannerBenchmark({ provider, commitment, corpus })).toMatchObject({ passed: false, charged: 0, cleanupComplete: true, reason: "admission_rejected" })
    expect(calls).toBe(0)
    expect(closed).toBe(1)
  })
  it.each(["malformed-corpus", "copy-failure", "cleanup-throws", "cleanup-incomplete"])("closes rejected owned setup exactly once: %s", async fault => {
    const provider = synthetic(); let calls = 0, closed = 0
    provider.invoke = () => { calls++; throw new Error("must not dispatch") }
    provider.close = () => { closed++; if (fault === "cleanup-throws") throw new Error("uncertain cleanup"); return { cleanupComplete: fault !== "cleanup-incomplete", orphanedChild: false } }
    const badCorpus = structuredClone(corpus)
    if (fault === "malformed-corpus") badCorpus.selectActivations.pop()
    const badCommitment = fault === "copy-failure" ? new Proxy(commitment, {}) : { ...commitment, sourceRoot: labRoot("wrong", 1) }
    expect(await runPlannerBenchmark({ provider, commitment: badCommitment, corpus: badCorpus })).toMatchObject({ passed: false, charged: 0, reason: "admission_rejected", cleanupComplete: !fault.startsWith("cleanup-") })
    expect(calls).toBe(0)
    expect(closed).toBe(1)
  })
  it.each(["source", "timing", "request", "machine"])("stops after one charged wrong returned %s binding", async field => {
    const provider = synthetic(), original = provider.timing
    let calls = 0
    provider.timing = e => {
      calls++
      const observation = original(e)!
      if (field === "source") e.identity.sourceRoot = labRoot("wrong", 1)
      if (field === "timing") observation.observation.binding.inputRoot = labRoot("wrong", 1)
      if (field === "request") e.requestId = "wrong"
      if (field === "machine") observation.machineRoot = labRoot("wrong", 1)
      return observation
    }
    expect(await runPlannerBenchmark({ provider, commitment, corpus })).toMatchObject({ passed: false, charged: 1, reason: "incomplete_or_failed" })
    expect(calls).toBe(1)
  })
  it("uses nearest-rank sample990, not interpolation or trimming", () => {
    const samples: number[] = Array.from({ length: 1000 }, (_, i) => i < 990 ? 1 : 100)
    expect(evaluateFeasibilityTiming({ selectActivations: samples, soldierBrain: samples }).passed).toBe(true)
    samples[989] = 5
    expect(evaluateFeasibilityTiming({ selectActivations: samples, soldierBrain: Array(1000).fill(1) })).toMatchObject({ passed: false, selectActivationsP99Ms: 5, soldierBrainP99Ms: 1 })
  })
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
    expect(await runPlannerBenchmark({ provider: synthetic(), commitment, corpus: changed })).toMatchObject({ passed: false, charged: 0, reason: "admission_rejected" })
    const p = synthetic(); p.timing = () => undefined
    expect(await runPlannerBenchmark({ provider: p, commitment, corpus })).toMatchObject({ passed: false, charged: 1, reason: "incomplete_or_failed" })
  })
})
