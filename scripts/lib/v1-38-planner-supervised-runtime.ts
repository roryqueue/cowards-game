import { createHash } from "node:crypto"
import { claimLeanRuntimeAuthority, type LeanRuntimeAuthority } from "./v1-38-lean-experiment-authority.js"
import { claimProspectiveLeagueLifetimeAuthority, isProspectiveLeagueLifetimeFixture, type ProspectiveLeagueLifetimeAuthority, type ProspectiveLeagueRuntimeBinding } from "./v1-38-league-prospective-lifetime.js"
import { performance } from "node:perf_hooks"
import { claimProspectiveLeagueHostReceiptAuthority, isProspectiveLeagueHostReceiptFixture } from "./v1-38-league-host-receipt.js"
import { DEFAULT_RUNTIME_LIMITS, StrategyRevisionSchema, StrategyInputV119Schema, SoldierBrainInputV119Schema, type StrategyRevision } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { createSelectedCurrentRuntimeFromRevisionV119 } from "../../packages/runtime-js/src/executor.js"
import { WORKER_HARNESS_SOURCE } from "../../packages/runtime-js/src/worker-harness.js"
import { SubprocessSystemFailure, SUBPROCESS_SYSTEM_FAILURE_CODES } from "../../packages/runtime-js/src/subprocess-ipc.js"
import { LAB_ADMITTED_ROOTS, freezeLabValue, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import type { DiagnosticPilotLifetimeGrant } from "../../packages/strategy-lab/src/league/diagnostic-pilot.js"
import type { DiagnosticOneCellLifetimeGrant } from "../../packages/strategy-lab/src/league/diagnostic-one-cell.js"
import { claimDiagnosticRetryV4LifetimeGrant, type DiagnosticRetryV4LifetimeGrant, type DiagnosticRetryV4RuntimeBinding } from "./v1-38-diagnostic-retry-v4.js"
import type { LabKernelRequest, LabRuntimeEvidence, LabRuntimeIdentity, LabSupervisedProvider } from "../../packages/strategy-lab/src/runtime-bridge.js"
import { buildLeanAuthenticatedHarnessSource, createLeanContainerMatchSession, type LeanContainerMatchSessionOptions, type LeanTimingBinding, type LeanTimingObservation, type LeanPrivateFailureOrigin } from "./v1-38-lean-container-match-session.js"

export type PlannerPrivateDiagnostic = LeanPrivateFailureOrigin & Readonly<Pick<LabRuntimeEvidence, "identity" | "invocationRoot" | "requestId" | "method" | "inputRoot" | "ordinal">>
// Constructor identity, not structural capabilities, grants private lookup.
const privateDiagnostics = new WeakMap<object, (evidence: LabRuntimeEvidence) => PlannerPrivateDiagnostic | undefined>()
export const getPlannerPrivateDiagnostic = (provider: object, evidence: LabRuntimeEvidence): PlannerPrivateDiagnostic | undefined => privateDiagnostics.get(provider)?.(evidence)
export const verifyPlannerPrivateDiagnostic = (provider: object, evidence: LabRuntimeEvidence, diagnostic: unknown): boolean => diagnostic !== undefined && getPlannerPrivateDiagnostic(provider, evidence) === diagnostic

const rawRoot = (value: string | Uint8Array): LabRoot => `sha256:${createHash("sha256").update(value).digest("hex")}`
const rejectRetiredDiagnosticLifetimeOptions = (options: object): void => {
  if (["pilotLifetimeGrant", "pilotLifetimeMs", "oneCellLifetimeGrant", "oneCellLifetimeMs"].some((key) => key in options)) throw new TypeError("LAB_RUNTIME_RETIRED_DIAGNOSTIC_LIFETIME")
}
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
  leanExperimentAuthority?: LeanRuntimeAuthority
  revision: StrategyRevision; attemptRoot: LabRoot; budgetRoot: LabRoot;
  /** Source produced by the reviewed observer builder; expectedRoot hashes the
   * actual buildLeanAuthenticatedHarnessSource(source) worker bytes. */
  observerHarness?: { source: string; expectedRoot: LabRoot; machineRoot: LabRoot };
  signal?: AbortSignal;
  invocationLimit?: number;
  /** Benchmark only: the coordinator's remaining overall budget, not Match time. */
  benchmarkLifetimeMs?: number;
  /** Retained type compatibility only: retired from new supervisor operations. */
  pilotLifetimeMs?: number;
  pilotLifetimeGrant?: DiagnosticPilotLifetimeGrant;
  /** Retained type compatibility only: retired from new supervisor operations. */
  oneCellLifetimeMs?: number;
  oneCellLifetimeGrant?: DiagnosticOneCellLifetimeGrant;
  retryV4LifetimeMs?: number;
  retryV4LifetimeGrant?: DiagnosticRetryV4LifetimeGrant;
  retryV4RuntimeBinding?: DiagnosticRetryV4RuntimeBinding;
  prospectiveLifetimeAuthority?: ProspectiveLeagueLifetimeAuthority;
  prospectiveLifetimeMs?: number;
}

/** Pure lifetime admission; retired pilot/v3 option presence fails first. */
export const admitPlannerSupervisorLifetime = (options: Pick<PlannerSupervisedRuntimeOptions, "pilotLifetimeGrant" | "pilotLifetimeMs" | "oneCellLifetimeGrant" | "oneCellLifetimeMs" | "retryV4LifetimeGrant" | "retryV4LifetimeMs" | "retryV4RuntimeBinding" | "benchmarkLifetimeMs" | "observerHarness" | "transport" | "streamFactory" | "budgetRoot" | "attemptRoot" | "containerName" | "ownershipLabel" | "prospectiveLifetimeAuthority" | "prospectiveLifetimeMs"> & { matchId?: string; prospectiveRuntimeBinding?: ProspectiveLeagueRuntimeBinding }, invocationLimit: number): number => {
  rejectRetiredDiagnosticLifetimeOptions(options)
  if ("prospectiveLifetimeAuthority" in options || "prospectiveLifetimeMs" in options) {
    if (!options.prospectiveLifetimeAuthority || options.prospectiveLifetimeMs !== 600000 || !options.prospectiveRuntimeBinding || !options.matchId || !options.containerName || !options.ownershipLabel || ["retryV4LifetimeGrant", "retryV4LifetimeMs", "retryV4RuntimeBinding", "benchmarkLifetimeMs", "observerHarness"].some((key) => key in options) || (options.transport !== undefined || options.streamFactory !== undefined) && !isProspectiveLeagueLifetimeFixture(options.prospectiveLifetimeAuthority)) throw new TypeError("LAB_RUNTIME_PROSPECTIVE_LIFETIME")
    return claimProspectiveLeagueLifetimeAuthority(options.prospectiveLifetimeAuthority, { budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, matchId: options.matchId, containerName: options.containerName, ownershipLabel: options.ownershipLabel, runtime: options.prospectiveRuntimeBinding }, options.prospectiveLifetimeMs, "planner")
  }
  if ((options.retryV4LifetimeGrant === undefined) !== (options.retryV4LifetimeMs === undefined)) throw new TypeError("LAB_RUNTIME_RETRY_V4_GRANT")
  if (options.retryV4LifetimeGrant !== undefined) {
    if (options.benchmarkLifetimeMs !== undefined || options.observerHarness !== undefined || options.transport !== undefined || options.streamFactory !== undefined) throw new TypeError("LAB_RUNTIME_RETRY_V4_MODE")
    if (!options.retryV4RuntimeBinding) throw new TypeError("LAB_RUNTIME_RETRY_V4_IDENTITY")
    claimDiagnosticRetryV4LifetimeGrant(options.retryV4LifetimeGrant, { allocationRoot: options.budgetRoot, cellRoot: options.retryV4LifetimeGrant.cellRoot, startRoot: options.attemptRoot, seat: options.retryV4LifetimeGrant.seat, containerName: options.containerName, ownershipLabel: options.ownershipLabel, lifetimeMilliseconds: options.retryV4LifetimeMs!, runtime: options.retryV4RuntimeBinding }, "planner")
  }
  const lifetime = options.retryV4LifetimeMs ?? options.benchmarkLifetimeMs ?? 120_000
  if (!Number.isFinite(lifetime) || lifetime <= 0 || lifetime > 3_600_000 || (options.benchmarkLifetimeMs !== undefined && (!options.observerHarness || invocationLimit !== 2_200))) throw new TypeError("LAB_RUNTIME_LIFETIME")
  return lifetime
}

export const createPlannerSupervisedRuntime = (options: PlannerSupervisedRuntimeOptions): PlannerSupervisedRuntime => {
  rejectRetiredDiagnosticLifetimeOptions(options)
  if (options.leanExperimentAuthority && ["prospectiveLifetimeAuthority", "prospectiveLifetimeMs", "prospectiveHostReceiptAuthority", "retryV4LifetimeGrant", "benchmarkLifetimeMs", "observerHarness", "privateObserver", "transport", "streamFactory"].some(key => key in options)) throw new TypeError("LAB_RUNTIME_LEAN_MODE")
  if ("hostResponseReceiptMilliseconds" in options || "prospectiveHostReceiptBinding" in options) throw new TypeError("LAB_RUNTIME_HOST_RECEIPT_OPTION")
  if ("prospectiveHostReceiptAuthority" in options && (!options.prospectiveHostReceiptAuthority || !options.prospectiveLifetimeAuthority || options.prospectiveLifetimeMs !== 600000 || ["retryV4LifetimeGrant", "retryV4LifetimeMs", "retryV4RuntimeBinding", "benchmarkLifetimeMs", "observerHarness", "privateObserver"].some((key) => key in options) || (options.transport !== undefined || options.streamFactory !== undefined) && !isProspectiveLeagueHostReceiptFixture(options.prospectiveHostReceiptAuthority))) throw new TypeError("LAB_RUNTIME_HOST_RECEIPT_MODE")
  if (options.prospectiveHostReceiptAuthority && isProspectiveLeagueHostReceiptFixture(options.prospectiveHostReceiptAuthority) && typeof options.transport !== "function") throw new TypeError("LAB_RUNTIME_HOST_RECEIPT_FIXTURE_CONTROL")
  if (options.prospectiveHostReceiptAuthority && isProspectiveLeagueHostReceiptFixture(options.prospectiveHostReceiptAuthority) && typeof options.streamFactory !== "function") throw new TypeError("LAB_RUNTIME_HOST_RECEIPT_FIXTURE_STREAM")
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
  const diagnostics = new WeakMap<object, PlannerPrivateDiagnostic>()
  const accounting: LabRuntimeEvidence[] = []; const seen = new Set<string>()
  let stopped = false; let pending: LeanTimingBinding | undefined; let observed: LeanTimingObservation | undefined; let observedTransportMs = 0
  const began = performance.now()
  const limit = options.invocationLimit ?? 24800
  const retryV4RuntimeBinding = options.retryV4LifetimeGrant === undefined ? undefined : {
    ...options.retryV4RuntimeBinding, sourceRoot: identity.sourceRoot, revisionId: identity.revisionId, executableRoot: identity.executableRoot,
    tupleId: identity.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: identity.image,
  } as DiagnosticRetryV4RuntimeBinding
  const prospectiveRuntimeBinding = options.prospectiveLifetimeAuthority === undefined ? undefined : { ...options.prospectiveLifetimeAuthority.runtime, sourceRoot: identity.sourceRoot, revisionId: identity.revisionId, executableRoot: identity.executableRoot, tupleId: identity.tupleId, tupleRoot: identity.tupleRoot, runtimeLimitsRoot: identity.runtimeLimitsRoot, image: identity.image }
  const leanRuntimeBinding = options.leanExperimentAuthority === undefined ? undefined : { ...options.leanExperimentAuthority.runtime, sourceRoot: identity.sourceRoot, revisionId: identity.revisionId, executableRoot: identity.executableRoot, tupleId: identity.tupleId, tupleRoot: identity.tupleRoot, runtimeLimitsRoot: identity.runtimeLimitsRoot, image: identity.image }
  const leanExperimentBinding = options.leanExperimentAuthority === undefined ? undefined : { budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, matchId: options.matchId, containerName: options.containerName, ownershipLabel: options.ownershipLabel, runtime: leanRuntimeBinding!, seat: options.leanExperimentAuthority.seat }
  const lifetime = options.leanExperimentAuthority === undefined ? admitPlannerSupervisorLifetime({ ...options, ...(retryV4RuntimeBinding === undefined ? {} : { retryV4RuntimeBinding }), ...(prospectiveRuntimeBinding === undefined ? {} : { prospectiveRuntimeBinding }) }, limit) : claimLeanRuntimeAuthority(options.leanExperimentAuthority, leanExperimentBinding!, "planner").lifetimeMs
  const prospectiveHostReceiptBinding = options.prospectiveHostReceiptAuthority === undefined ? undefined : { budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, matchId: options.matchId, containerName: options.containerName, ownershipLabel: options.ownershipLabel, runtime: prospectiveRuntimeBinding!, seat: options.prospectiveLifetimeAuthority!.seat }
  if (options.prospectiveHostReceiptAuthority) claimProspectiveLeagueHostReceiptAuthority(options.prospectiveHostReceiptAuthority, prospectiveHostReceiptBinding!, "planner")
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 24800 || options.signal?.aborted) throw new TypeError("LAB_RUNTIME_ALLOCATION")
  const session = createLeanContainerMatchSession({ ...options, ...(leanExperimentBinding === undefined ? {} : { leanExperimentBinding }), ...(prospectiveHostReceiptBinding === undefined ? {} : { prospectiveHostReceiptBinding }), infrastructureProfile: "closeout", ...(observerHarness === undefined ? {} : { privateObserver: {
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
  const runtime: PlannerSupervisedRuntime = {
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
      } catch (error) {
        const origin = session.failureOrigin(error) ?? { stage: "executor", reason: "unknown" } as const
        diagnostics.set(e, freezeLabValue({ stage: origin.stage, reason: origin.reason, identity, invocationRoot: e.invocationRoot, requestId: e.requestId, method: e.method, inputRoot: e.inputRoot, ordinal: e.ordinal }) as PlannerPrivateDiagnostic)
        const code = error instanceof SubprocessSystemFailure && SUBPROCESS_SYSTEM_FAILURE_CODES.includes(error.code) ? error.code : "MALFORMED_IPC"
        e.result = { ok: false, violation: { type: "INVALID_OUTPUT", message: "Runtime system failure" }, systemFailure: { code, retryable: false } }; close()
      }
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
  privateDiagnostics.set(runtime, (evidence) => issued.has(evidence) ? diagnostics.get(evidence) : undefined)
  return runtime
}
export const closePlannerRuntime = (runtime: PlannerSupervisedRuntime) => runtime.close()
