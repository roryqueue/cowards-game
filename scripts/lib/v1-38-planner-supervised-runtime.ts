import { createHash } from "node:crypto"
import { performance } from "node:perf_hooks"
import { DEFAULT_RUNTIME_LIMITS, StrategyRevisionSchema, StrategyInputV119Schema, SoldierBrainInputV119Schema, type StrategyRevision } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { createSelectedCurrentRuntimeFromRevisionV119 } from "../../packages/runtime-js/src/executor.js"
import { WORKER_HARNESS_SOURCE } from "../../packages/runtime-js/src/worker-harness.js"
import { LAB_ADMITTED_ROOTS, freezeLabValue, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import type { LabKernelRequest, LabRuntimeEvidence, LabRuntimeIdentity, LabSupervisedProvider } from "../../packages/strategy-lab/src/runtime-bridge.js"
import { buildLeanAuthenticatedHarnessSource, createLeanContainerMatchSession, type LeanContainerMatchSessionOptions, type LeanTimingBinding, type LeanTimingObservation } from "./v1-38-lean-container-match-session.js"

const rawRoot = (value: string | Uint8Array): LabRoot => `sha256:${createHash("sha256").update(value).digest("hex")}`
export interface PlannerTimingEvidence {
  observation: LeanTimingObservation; runtime: LabRuntimeEvidence; totalMs: number; transportMs: number;
  provenance: "supervised_container" | "synthetic_transport";
  machineRoot: LabRoot;
}
export interface PlannerSupervisedRuntime extends LabSupervisedProvider {
  invoke(request: LabKernelRequest, identity: LabRuntimeIdentity): LabRuntimeEvidence;
  timing(evidence: LabRuntimeEvidence): PlannerTimingEvidence | undefined;
  verifyTiming(evidence: PlannerTimingEvidence): boolean;
  readonly accounting: readonly LabRuntimeEvidence[];
}
export interface PlannerSupervisedRuntimeOptions extends Omit<LeanContainerMatchSessionOptions, "infrastructureProfile" | "privateObserver"> {
  revision: StrategyRevision; attemptRoot: LabRoot; budgetRoot: LabRoot;
  /** Source produced by the reviewed observer builder; expectedRoot hashes the
   * actual buildLeanAuthenticatedHarnessSource(source) worker bytes. */
  observerHarness?: { source: string; expectedRoot: LabRoot; machineRoot: LabRoot };
  signal?: AbortSignal;
  invocationLimit?: number;
}

export const createPlannerSupervisedRuntime = (options: PlannerSupervisedRuntimeOptions): PlannerSupervisedRuntime => {
  const observerHarness = options.observerHarness && freezeLabValue({ ...options.observerHarness })
  const provenance = options.transport || options.streamFactory ? "synthetic_transport" as const : "supervised_container" as const
  const revision = StrategyRevisionSchema.parse(options.revision)
  const expectedLimits = { ...DEFAULT_RUNTIME_LIMITS, environment: "empty", filesystem: revision.runtime.limits.filesystem, network: revision.runtime.limits.network }
  if (options.image !== LAB_ADMITTED_ROOTS.image || revision.runtime.abiVersion !== "strategy-runtime-abi-v1.19" || revision.runtime.adapter.id !== "runtime-js-container-subprocess" || revision.runtime.language.id !== "typescript" ||
    labRoot("limits", revision.runtime.limits) !== labRoot("limits", expectedLimits) || revision.sourceBytes > 65536 || revision.runtime.package.mode !== "none") throw new TypeError("LAB_RUNTIME_ADMISSION")
  const rebuilt = buildStrategyRevision({ source: revision.source, runtime: revision.runtime, ...(revision.strategyId === undefined ? {} : { strategyId: revision.strategyId }) })
  const artifact = revision.metadata.sourceArtifact
  if (!rebuilt.validation.valid || rebuilt.id !== revision.id || rebuilt.sourceHash !== revision.sourceHash || rebuilt.sourceBytes !== revision.sourceBytes || !artifact || labRoot("artifact", artifact) !== labRoot("artifact", rebuilt.metadata.sourceArtifact)) throw new TypeError("LAB_SOURCE_ADMISSION")
  const harness = observerHarness?.source ?? WORKER_HARNESS_SOURCE
  const harnessRoot = rawRoot(buildLeanAuthenticatedHarnessSource(harness))
  if (observerHarness && (harnessRoot !== observerHarness.expectedRoot || !/^sha256:[a-f0-9]{64}$/.test(observerHarness.machineRoot))) throw new TypeError("LAB_HARNESS_IDENTITY")
  const identity: LabRuntimeIdentity = freezeLabValue({ revisionId: revision.id, sourceRoot: rawRoot(revision.source), executableRoot: `sha256:${artifact.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: options.image, harnessRoot, budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot })
  const issued = new WeakSet<object>(); const timings = new WeakMap<object, PlannerTimingEvidence>(); const issuedTiming = new WeakSet<object>()
  const accounting: LabRuntimeEvidence[] = []; const seen = new Set<string>()
  let stopped = false; let pending: LeanTimingBinding | undefined; let observed: LeanTimingObservation | undefined; let observedTransportMs = 0
  const began = performance.now()
  const limit = options.invocationLimit ?? 24800
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 24800 || options.signal?.aborted) throw new TypeError("LAB_RUNTIME_ALLOCATION")
  const session = createLeanContainerMatchSession({ ...options, infrastructureProfile: "closeout", ...(observerHarness === undefined ? {} : { privateObserver: {
    harnessSource: harness,
    binding(request) {
      if (!pending || rawRoot(request.source) !== identity.executableRoot || request.methodName !== pending.method || labRoot("runtime-input", request.input) !== pending.inputRoot) throw new TypeError("LAB_DISPATCH_BINDING")
      return pending
    },
    observe(value, transportMs) { if (observed) throw new TypeError("LAB_DUPLICATE_TIMING"); observed = value; observedTransportMs = transportMs },
  } }) })
  const executor = createSelectedCurrentRuntimeFromRevisionV119(revision, { adapter: session.adapter, timeoutMs: 1000, outputByteLimit: 262144 })
  const close = () => { stopped = true; options.signal?.removeEventListener("abort", abort); return session.close() }
  const abort = () => { close() }
  options.signal?.addEventListener("abort", abort, { once: true })
  return {
    identity, get accounting() { return [...accounting] }, close,
    verify(e) { return issued.has(e) }, timing(e) { return timings.get(e) }, verifyTiming(e) { return issuedTiming.has(e) },
    invoke(request, admitted) {
      if (stopped || session.state !== "active" || options.signal?.aborted || performance.now() - began >= 120000 || accounting.length >= limit) { close(); throw new TypeError("LAB_RUNTIME_STOPPED") }
      if (labRoot("identity", admitted) !== labRoot("identity", identity) || request.semanticTupleId !== identity.tupleId || seen.has(request.requestId)) { close(); throw new TypeError("LAB_REQUEST_BINDING") }
      const parsed = (request.kind === "selectActivations" ? StrategyInputV119Schema : SoldierBrainInputV119Schema).safeParse(request.input)
      if (!parsed.success) { close(); throw new TypeError("LAB_INPUT_INVALID") }
      const input = parsed.data
      if (labRoot("runtime-input", input) !== labRoot("runtime-input", request.input)) { close(); throw new TypeError("LAB_INPUT_BINDING") }
      const ordinal = accounting.length
      const invocationRoot = labRoot("supervised-invocation", { identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", input), ordinal })
      seen.add(request.requestId)
      pending = { invocationRoot, sourceRoot: identity.sourceRoot, executableRoot: identity.executableRoot, inputRoot: labRoot("runtime-input", input), method: request.kind, tupleId: identity.tupleId, harnessRoot: identity.harnessRoot, profileRoot: identity.runtimeLimitsRoot }
      observed = undefined
      const e: LabRuntimeEvidence = { identity, requestId: request.requestId, method: request.kind, inputRoot: pending.inputRoot as LabRoot, ordinal, invocationRoot, charged: true, completed: false, outputBytes: 0, result: { ok: false, violation: { type: "INVALID_OUTPUT", message: "Runtime system failure" }, systemFailure: { code: "MALFORMED_IPC", retryable: false } } }
      accounting.push(e) // Charge before any adapter dispatch, including failure.
      const started = performance.now()
      try {
        e.result = request.kind === "selectActivations" ? executor.selectActivations(input as Parameters<typeof executor.selectActivations>[0]) : executor.runSoldierBrain(input as Parameters<typeof executor.runSoldierBrain>[0])
        e.completed = session.state === "active"
        e.outputBytes = Buffer.byteLength(JSON.stringify(e.result))
        if (observerHarness && !observed) throw new TypeError("LAB_TIMING_MISSING")
        if (!e.result.ok && "systemFailure" in e.result) close()
      } catch { e.result = { ok: false, violation: { type: "INVALID_OUTPUT", message: "Runtime system failure" }, systemFailure: { code: "MALFORMED_IPC", retryable: false } }; close() }
      const totalMs = performance.now() - started
      const observation = observed as LeanTimingObservation | undefined
      if (observation && e.completed && e.result.ok) {
        const timing = freezeLabValue({ observation, runtime: e, totalMs, transportMs: observedTransportMs, machineRoot: observerHarness!.machineRoot, provenance })
        timings.set(e, timing); issuedTiming.add(timing)
      }
      pending = undefined
      freezeLabValue(e); issued.add(e)
      return e
    },
  }
}
export const closePlannerRuntime = (runtime: PlannerSupervisedRuntime) => runtime.close()
