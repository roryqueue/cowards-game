import { createHash } from "node:crypto"
import { performance } from "node:perf_hooks"
import { DEFAULT_RUNTIME_LIMITS, StrategyRevisionSchema, StrategyInputV119Schema, SoldierBrainInputV119Schema, type StrategyRevision } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { createSelectedCurrentRuntimeFromRevisionV119 } from "../../packages/runtime-js/src/executor.js"
import { WORKER_HARNESS_SOURCE } from "../../packages/runtime-js/src/worker-harness.js"
import { LAB_ADMITTED_ROOTS, freezeLabValue, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { requireDiagnosticPilotLifetimeGrant, type DiagnosticPilotLifetimeGrant } from "../../packages/strategy-lab/src/league/diagnostic-pilot.js"
import { requireDiagnosticOneCellLifetimeGrant, type DiagnosticOneCellLifetimeGrant } from "../../packages/strategy-lab/src/league/diagnostic-one-cell.js"
import { claimDiagnosticRetryV4LifetimeGrant, type DiagnosticRetryV4LifetimeGrant, type DiagnosticRetryV4RuntimeBinding } from "./v1-38-diagnostic-retry-v4.js"
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
  /** Benchmark only: the coordinator's remaining overall budget, not Match time. */
  benchmarkLifetimeMs?: number;
  /** A distinct, durable-precharge-bound pilot exception; never benchmark mode. */
  pilotLifetimeMs?: number;
  pilotLifetimeGrant?: DiagnosticPilotLifetimeGrant;
  /** Distinct v3 diagnostic exception, never the consumed pilot capability. */
  oneCellLifetimeMs?: number;
  oneCellLifetimeGrant?: DiagnosticOneCellLifetimeGrant;
  retryV4LifetimeMs?: number;
  retryV4LifetimeGrant?: DiagnosticRetryV4LifetimeGrant;
  retryV4RuntimeBinding?: DiagnosticRetryV4RuntimeBinding;
}

/** Pure bound used before any container construction; testable with an inert
 * durable pilot grant without creating a provider or Match. */
export const admitPlannerSupervisorLifetime = (options: Pick<PlannerSupervisedRuntimeOptions, "pilotLifetimeGrant" | "pilotLifetimeMs" | "oneCellLifetimeGrant" | "oneCellLifetimeMs" | "retryV4LifetimeGrant" | "retryV4LifetimeMs" | "retryV4RuntimeBinding" | "benchmarkLifetimeMs" | "observerHarness" | "transport" | "streamFactory" | "budgetRoot" | "attemptRoot" | "containerName" | "ownershipLabel">, invocationLimit: number): number => {
  if ((options.retryV4LifetimeGrant === undefined) !== (options.retryV4LifetimeMs === undefined) || options.retryV4LifetimeGrant && (options.pilotLifetimeGrant || options.oneCellLifetimeGrant)) throw new TypeError("LAB_RUNTIME_RETRY_V4_GRANT")
  if (options.retryV4LifetimeGrant !== undefined) {
    if (options.benchmarkLifetimeMs !== undefined || options.observerHarness !== undefined || options.transport !== undefined || options.streamFactory !== undefined) throw new TypeError("LAB_RUNTIME_RETRY_V4_MODE")
    if (!options.retryV4RuntimeBinding) throw new TypeError("LAB_RUNTIME_RETRY_V4_IDENTITY")
    claimDiagnosticRetryV4LifetimeGrant(options.retryV4LifetimeGrant, { allocationRoot: options.budgetRoot, cellRoot: options.retryV4LifetimeGrant.cellRoot, startRoot: options.attemptRoot, seat: options.retryV4LifetimeGrant.seat, containerName: options.containerName, ownershipLabel: options.ownershipLabel, lifetimeMilliseconds: options.retryV4LifetimeMs!, runtime: options.retryV4RuntimeBinding }, "planner")
  }
  if ((options.pilotLifetimeGrant === undefined) !== (options.pilotLifetimeMs === undefined)) throw new TypeError("LAB_RUNTIME_PILOT_GRANT")
  if ((options.oneCellLifetimeGrant === undefined) !== (options.oneCellLifetimeMs === undefined) || options.pilotLifetimeGrant && options.oneCellLifetimeGrant) throw new TypeError("LAB_RUNTIME_ONE_CELL_GRANT")
  if (options.pilotLifetimeGrant !== undefined) {
    if (options.benchmarkLifetimeMs !== undefined || options.observerHarness !== undefined || options.transport !== undefined || options.streamFactory !== undefined) throw new TypeError("LAB_RUNTIME_PILOT_MODE")
    requireDiagnosticPilotLifetimeGrant(options.pilotLifetimeGrant, { allocationRoot: options.budgetRoot, cellRoot: options.pilotLifetimeGrant.cellRoot, startRoot: options.attemptRoot, seat: options.pilotLifetimeGrant.seat, containerName: options.containerName, ownershipLabel: options.ownershipLabel, lifetimeMilliseconds: options.pilotLifetimeMs! })
  }
  if (options.oneCellLifetimeGrant !== undefined) {
    if (options.benchmarkLifetimeMs !== undefined || options.observerHarness !== undefined || options.transport !== undefined || options.streamFactory !== undefined) throw new TypeError("LAB_RUNTIME_ONE_CELL_MODE")
    requireDiagnosticOneCellLifetimeGrant(options.oneCellLifetimeGrant, { allocationRoot: options.budgetRoot, cellRoot: options.oneCellLifetimeGrant.cellRoot, startRoot: options.attemptRoot, seat: options.oneCellLifetimeGrant.seat, containerName: options.containerName, ownershipLabel: options.ownershipLabel, lifetimeMilliseconds: options.oneCellLifetimeMs! })
  }
  const lifetime = options.retryV4LifetimeMs ?? options.oneCellLifetimeMs ?? options.pilotLifetimeMs ?? options.benchmarkLifetimeMs ?? 120_000
  if (!Number.isFinite(lifetime) || lifetime <= 0 || lifetime > 3_600_000 || (options.benchmarkLifetimeMs !== undefined && (!options.observerHarness || invocationLimit !== 2_200))) throw new TypeError("LAB_RUNTIME_LIFETIME")
  return lifetime
}

export const createPlannerSupervisedRuntime = (options: PlannerSupervisedRuntimeOptions): PlannerSupervisedRuntime => {
  if (options.retryV4LifetimeGrant !== undefined && ["observerHarness", "transport", "streamFactory", "benchmarkLifetimeMs"].some((key) => Object.prototype.hasOwnProperty.call(options, key))) throw new TypeError("LAB_RUNTIME_RETRY_V4_CONSTRUCTOR_OVERRIDE")
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
  const retryV4RuntimeBinding = options.retryV4LifetimeGrant === undefined ? undefined : {
    ...options.retryV4RuntimeBinding, sourceRoot: identity.sourceRoot, revisionId: identity.revisionId, executableRoot: identity.executableRoot,
    tupleId: identity.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: identity.image,
  } as DiagnosticRetryV4RuntimeBinding
  const lifetime = admitPlannerSupervisorLifetime({ ...options, ...(retryV4RuntimeBinding === undefined ? {} : { retryV4RuntimeBinding }) }, limit)
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
      if (stopped || session.state !== "active" || options.signal?.aborted || performance.now() - began >= lifetime || accounting.length >= limit) { close(); throw new TypeError("LAB_RUNTIME_STOPPED") }
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
