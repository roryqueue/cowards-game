import { MATCH_KERNEL } from "@cowards/engine"
import { LAB_ADMITTED_ROOTS, freezeLabValue, labRoot, type LabRoot } from "./contracts.js"
import { buildFeasibilityCorpus, evaluateFeasibilityTiming, PLANNER_FEASIBILITY_PROTOCOL } from "./feasibility-protocol.js"
import type { LabKernelRequest, LabRuntimeEvidence, LabRuntimeIdentity, LabSupervisedProvider } from "./runtime-bridge.js"

export interface BenchmarkObservation {
  runtime: LabRuntimeEvidence;
  observation: { binding: { invocationRoot: string; sourceRoot: string; executableRoot: string; inputRoot: string; method: "selectActivations" | "soldierBrain"; tupleId: string; harnessRoot: string; profileRoot: string }; durationMs: number; complete: true };
  totalMs: number; transportMs: number; provenance: "supervised_container" | "synthetic_transport";
  machineRoot: LabRoot;
}
export interface BenchmarkProvider extends LabSupervisedProvider {
  timing(evidence: LabRuntimeEvidence): BenchmarkObservation | undefined;
  verifyTiming(evidence: BenchmarkObservation): boolean;
}
export interface BenchmarkCommitment {
  revisionId: string;
  corpusRoot: LabRoot; sourceRoot: LabRoot; executableRoot: LabRoot; harnessRoot: LabRoot;
  profileRoot: string; budgetRoot: LabRoot; attemptRoot: LabRoot; machineRoot: LabRoot;
}
type Corpus = ReturnType<typeof buildFeasibilityCorpus>
const methods = ["selectActivations", "soldierBrain"] as const
const canonicalCorpus = buildFeasibilityCorpus()
const runtimeInputRoots = Object.fromEntries(methods.map((method) => [method, canonicalCorpus[method].map((c) => labRoot("runtime-input", c.input))])) as Record<(typeof methods)[number], LabRoot[]>
const assertCorpus = (corpus: Corpus, commitment: BenchmarkCommitment) => {
  const expected = canonicalCorpus
  if (corpus.root !== expected.root || commitment.corpusRoot !== expected.root || commitment.profileRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot || commitment.budgetRoot !== PLANNER_FEASIBILITY_PROTOCOL.budgetRoot || !/^sha256:[0-9a-f]{64}$/.test(commitment.machineRoot)) throw new TypeError("LAB_BENCHMARK_COMMITMENT")
  for (const method of methods) {
    if (corpus[method].length !== 100) throw new TypeError("LAB_BENCHMARK_CORPUS")
    for (const [i, entry] of corpus[method].entries()) {
      if (labRoot("timing-input", entry.input) !== expected[method][i]!.inputRoot || labRoot("case-check", { ...entry, input: null }) !== labRoot("case-check", { ...expected[method][i]!, input: null })) throw new TypeError("LAB_BENCHMARK_CORPUS")
    }
  }
}
const requestAt = (ordinal: number, corpus: Corpus, commitment: BenchmarkCommitment): LabKernelRequest => {
  const method = methods[Math.floor(ordinal / 1100)]!
  const entry = corpus[method][ordinal % 1100 % 100]!
  return {
    kind: method, semanticTupleId: MATCH_KERNEL.tupleId,
    requestId: labRoot("benchmark-call", { sourceRoot: commitment.sourceRoot, corpusRoot: commitment.corpusRoot, ordinal, method }),
    coordinates: { phaseNumber: 1, roundNumber: 1, stage: method === "selectActivations" ? "select_bottom" : "soldier_effect", ordinal },
    input: entry.input,
  } as LabKernelRequest
}

const admittedIdentity = (commitment: BenchmarkCommitment): LabRuntimeIdentity => ({
  revisionId: commitment.revisionId, sourceRoot: commitment.sourceRoot, executableRoot: commitment.executableRoot,
  harnessRoot: commitment.harnessRoot, budgetRoot: commitment.budgetRoot, attemptRoot: commitment.attemptRoot,
  runtimeLimitsRoot: commitment.profileRoot, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image,
})
const assertObservation = (provider: BenchmarkProvider, commitment: BenchmarkCommitment, observation: BenchmarkObservation, request: LabKernelRequest, ordinal: number, invocationRoots: Set<string>) => {
  const e = observation.runtime, b = observation.observation.binding
  if (!provider.verify(e) || !provider.verifyTiming(observation) || observation.machineRoot !== commitment.machineRoot || !e.result.ok || !e.charged || !e.completed || e.ordinal !== ordinal || e.method !== request.kind || e.requestId !== request.requestId || e.inputRoot !== runtimeInputRoots[request.kind][ordinal % 1100 % 100] ||
    Object.keys(e.identity).length !== Object.keys(admittedIdentity(commitment)).length || Object.entries(admittedIdentity(commitment)).some(([key, value]) => e.identity[key as keyof LabRuntimeIdentity] !== value) ||
    b.invocationRoot !== e.invocationRoot || b.sourceRoot !== commitment.sourceRoot || b.executableRoot !== commitment.executableRoot || b.inputRoot !== e.inputRoot || b.method !== request.kind || b.tupleId !== MATCH_KERNEL.tupleId || b.harnessRoot !== commitment.harnessRoot || b.profileRoot !== commitment.profileRoot ||
    !Number.isSafeInteger(e.outputBytes) || e.outputBytes < 0 || e.outputBytes > 262144 || invocationRoots.has(e.invocationRoot) || observation.observation.complete !== true || !Number.isFinite(observation.observation.durationMs) || observation.observation.durationMs < 0 || observation.observation.durationMs > 1000 ||
    !Number.isFinite(observation.totalMs) || observation.totalMs < 0 || !Number.isFinite(observation.transportMs) || observation.transportMs < 0 || !["synthetic_transport", "supervised_container"].includes(observation.provenance)) throw new TypeError("LAB_BENCHMARK_BINDING")
  invocationRoots.add(e.invocationRoot)
}

/** Trusted host issuance is required even for replay evaluation; serializable
 * timing assertions and caller-provided clocks are not accepted as evidence. */
export const evaluatePlannerBenchmark = (options: {
  provider: BenchmarkProvider; commitment: BenchmarkCommitment; observedCommitment: BenchmarkCommitment;
  observations: readonly BenchmarkObservation[]; corpus: Corpus; cleanupComplete: boolean;
}) => {
  const { provider, commitment, observations, corpus } = options
  assertCorpus(corpus, commitment)
  if (labRoot("benchmark-commitment", commitment) !== labRoot("benchmark-commitment", options.observedCommitment) || observations.length !== 2200 || !options.cleanupComplete) throw new TypeError("LAB_BENCHMARK_INCOMPLETE")
  const durations: Record<(typeof methods)[number], number[]> = { selectActivations: [], soldierBrain: [] }
  const invocationRoots = new Set<string>()
  let empirical = true
  for (const [ordinal, observation] of observations.entries()) {
    const request = requestAt(ordinal, corpus, commitment)
    assertObservation(provider, commitment, observation, request, ordinal, invocationRoots)
    empirical = empirical && observation.provenance === "supervised_container"
    if (ordinal % 1100 >= 100) durations[request.kind].push(observation.observation.durationMs)
  }
  const timing = evaluateFeasibilityTiming(durations)
  return freezeLabValue({ ...timing, passed: empirical && timing.passed, protocolPassed: timing.passed, empirical,
    charged: 2200, measuredPerMethod: 1000, warmupsPerMethod: 100, warmupRule: "exclude-first-100-per-method-only",
    commitment: structuredClone(commitment),
    transportMs: observations.map((o) => o.transportMs), totalMs: observations.map((o) => o.totalMs),
  })
}

export const runPlannerBenchmark = async (options: { provider: BenchmarkProvider; commitment: BenchmarkCommitment; corpus: Corpus }) => {
  const { provider } = options
  const observations: BenchmarkObservation[] = []
  const invocationRoots = new Set<string>()
  let charged = 0; let clean = false
  let commitment: BenchmarkCommitment | undefined, corpus: Corpus | undefined
  let admitted = false
  try {
    // Ownership already exists on entry, so every admission/copy failure must
    // pass through the same exactly-once provider cleanup guard as dispatch.
    assertCorpus(options.corpus, options.commitment)
    commitment = freezeLabValue(structuredClone(options.commitment))
    const identity = freezeLabValue(admittedIdentity(commitment))
    if (typeof identity.revisionId !== "string" || identity.revisionId.length === 0 || labRoot("runtime-identity", provider.identity) !== labRoot("runtime-identity", identity)) throw new TypeError("LAB_BENCHMARK_PROVIDER_IDENTITY")
    corpus = freezeLabValue(structuredClone(options.corpus))
    admitted = true
    for (let ordinal = 0; ordinal < 2200; ordinal++) {
      const request = structuredClone(requestAt(ordinal, corpus, commitment))
      charged++
      const e = await provider.invoke(request, identity)
      const timing = provider.timing(e)
      if (!timing || timing.runtime !== e) break
      assertObservation(provider, commitment, timing, request, ordinal, invocationRoots)
      observations.push(timing)
    }
  } catch { /* Admission uses zero calls; a charged failure never resamples. */ }
  finally {
    try { const cleanup = provider.close(); clean = cleanup.cleanupComplete && !cleanup.orphanedChild } catch { clean = false }
  }
  if (!admitted || !commitment || !corpus) return freezeLabValue({ passed: false, protocolPassed: false, empirical: false, charged, cleanupComplete: clean, reason: "admission_rejected" })
  if (observations.length !== 2200 || !clean) return freezeLabValue({ passed: false, protocolPassed: false, empirical: false, charged, cleanupComplete: clean, reason: "incomplete_or_failed" })
  try { return evaluatePlannerBenchmark({ provider, commitment, observedCommitment: commitment, observations, corpus, cleanupComplete: clean }) }
  catch { return freezeLabValue({ passed: false, protocolPassed: false, empirical: false, charged, cleanupComplete: clean, reason: "incomplete_or_failed" }) }
}
