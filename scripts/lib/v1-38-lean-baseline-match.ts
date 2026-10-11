/** Trusted native Match composition for the distinct private current baseline. */
import { performance } from "node:perf_hooks"
import { createHash } from "node:crypto"
import { CANONICAL_ARENA_CATALOG_V1_37, createSetScenarioV137, defaultRuntimeMetadata, type SoldierBrainInputV119, type StrategyInputV119 } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { encodeSubprocessIpcRequest } from "../../packages/runtime-js/src/subprocess-ipc.js"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { admitFactory, authorizeFactorySupervision, type FactorySupervisionProvider } from "../../packages/strategy-lab/src/factory/admission.js"
import { runCanonicalLabMatch, readLabHostFailureV15, type LabHostBindingV15, type LabMatchExecution } from "../../packages/strategy-lab/src/runtime-bridge.js"
import { admitLeanAllocation, isLeanRetryMode, leanSupervisorAllocationMode, LEAN_CAPS, type LeanExperimentLedger, type LeanCharge, type LeanSlot, type LeanCompactMatchRecord } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { compactExecution, deriveLeanSupervisorDiagnostic } from "../run-v1-38-lean-experiment.js"
import { createFactorySupervisedRuntime, getFactoryPrivateDiagnostic } from "./v1-38-factory-supervised-runtime.js"
import { prospectiveLeagueRuntimeBinding } from "./v1-38-league-prospective-lifetime.js"
import { issueLeanBaselineRuntimeAuthority, issueLeanCorrectionRuntimeAuthority, issueLeanPrivateMatchRuntimeAuthorityV1, readLeanPrivateMatchContextV1, checkpointLeanPrivateMatchV1, LEAN_PRIVATE_MATCH_SEED_V1, type LeanPrivateMatchAdmissionV1, type LeanPrivateMatchDebitV1 } from "./v1-38-lean-experiment-authority.js"
import { type LeanColdReuse } from "./v1-38-lean-baseline-reuse.js"
import { type LeanPrivateCorrectionOrigin, validateLeanPrivateCorrectionOrigin } from "./v1-38-lean-container-match-session.js"
import { validateLeanBaselineSource, type LeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { collectLeanBaselineMetrics } from "./v1-38-lean-baseline-metrics.js"
import { SUBPROCESS_SYSTEM_FAILURE_CODES } from "../../packages/runtime-js/src/subprocess-ipc.js"
import { isLeanPrivateFailureOrigin } from "./v1-38-lean-container-match-session.js"
import { readLeanPrivateMatchContextV2, checkpointLeanPrivateMatchV2, issueLeanPrivateMatchRuntimeAuthorityV2, type LeanPrivateMatchAdmissionV2, type LeanPrivateMatchDebitV2 } from "./v1-38-lean-experiment-authority.js"
import { captureLeanHostFailureV7, type LeanHostFailureBindingV7 } from "./v1-38-lean-host-stage-v7.js"

const fail = (): never => { throw new TypeError("LEAN_BASELINE_MATCH") }
const CORRECTION_RUNTIME_OUTPUT_BYTES = 262144
export const leanBaselineMatchSeed = (seed: string, ordinal: number): string => `${seed}-${ordinal >= 32 ? ordinal - 24 : ordinal}`
/** Repeats preserve the initial matrix's seed, arena, side and initiative. */
export const leanBaselineScenario = (input: { seed: string; slot: LeanSlot; bottom: LeanBaselineSource; top: LeanBaselineSource }) => {
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.status === "active" && a.semanticGeometryHash === input.slot.arenaHash) ?? fail()
  const bottomPlayerId = `lean-source-${input.bottom.sourceRoot.slice(7)}`, topPlayerId = `lean-source-${input.top.sourceRoot.slice(7)}`
  if (bottomPlayerId === topPlayerId) return fail()
  const scenario = createSetScenarioV137({ arenaCatalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion, arenaSemanticGeometryHash: input.slot.arenaHash, entrantA: { entrantKey: input.bottom.sourceRoot, playerId: bottomPlayerId }, entrantB: { entrantKey: input.top.sourceRoot, playerId: topPlayerId }, baseSeed: leanBaselineMatchSeed(input.seed, input.slot.ordinal) })
  // Sources are already in their retained bottom/top seats. Only initiative is
  // selected here; a Set condition must not silently swap them a second time.
  const initialInitiativePlayerId = input.slot.condition % 2 === 0 ? bottomPlayerId : topPlayerId
  return { arena, bottomPlayerId, topPlayerId, initialInitiativePlayerId, seed: scenario.baseSeed }
}
const redact = (value: unknown): unknown => Array.isArray(value) ? value.map(redact) : value !== null && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([key]) => !/(?:source|memory|objective|input|output|stdio|prompt)/iu.test(key)).map(([key, v]) => [key, redact(v)])) : value
/** Normalize only engine-owned run identity, never arbitrary user memory keys.
 * Canonical transition hashes bind the original Match identity and therefore
 * cannot themselves be compared across distinct counted repeat Matches. The
 * complete normalized gameplay projections and private runtime results remain
 * bound, incrementally rooted to avoid one unbounded canonical JSON graph. */
export const leanBaselineSemanticRoot = (actual: LabMatchExecution): LabRoot | null => {
  if (actual.kind !== "completed") return null
  const normalizeState = (state: Readonly<Record<string, unknown>>) => ({ ...state, matchId: "lean-baseline-repeat-identity" })
  const transitionRoots = actual.transitions.map(record => {
    const { beforeStateHash: _beforeState, afterStateHash: _afterState, beforeMachineHash: _beforeMachine, afterMachineHash: _afterMachine, beforeState, afterState, events, ...body } = record
    return labRoot("lean-baseline-repeat-transition-v1", { ...body, beforeState: normalizeState(beforeState), afterState: normalizeState(afterState), events: events.map(event => event.type === "MATCH_STARTED" && event.payload !== null && typeof event.payload === "object" && !Array.isArray(event.payload) ? { ...event, payload: { ...event.payload, matchId: "lean-baseline-repeat-identity" } } : event) })
  })
  const runtimeRoots = actual.accounting.map(evidence => labRoot("lean-baseline-repeat-runtime-v1", { sourceRoot: evidence.identity.sourceRoot, revisionId: evidence.identity.revisionId, method: evidence.method, ordinal: evidence.ordinal, inputRoot: evidence.inputRoot, result: evidence.result }))
  return labRoot("lean-baseline-canonical-repeat-v1", { finalStateRoot: labRoot("lean-baseline-repeat-state-v1", normalizeState(actual.result.state as unknown as Readonly<Record<string, unknown>>)), transitionRoots, runtimeRoots })
}

/** Pure producer projection used by the actual dispatch and source-only
 * failure fixtures. A completed gameplay state is not by itself success. */
export const leanBaselineMatchEvidence = (actual: LabMatchExecution, compact: LeanCompactMatchRecord, observedSeat: "bottom" | "top" | null) => ({
  trainingHalfPoints: compact.classification !== "success" || compact.outcome === null ? null : compact.outcome === "DRAW" ? 1 as const : observedSeat && compact.outcome === observedSeat ? 2 as const : 0 as const,
  semanticRoot: compact.classification === "success" && compact.cleanupComplete ? leanBaselineSemanticRoot(actual) : null,
  metrics: collectLeanBaselineMetrics(actual, compact),
})

export interface LeanCorrectionInvocationBinding {
  readonly schemaVersion: "v1.38-lean-correction-invocation-binding-v1" | "v1.38-lean-correction-invocation-binding-v5" | "v1.38-lean-correction-invocation-binding-v6" | "v1.38-lean-correction-invocation-binding-v7" | "v1.38-lean-correction-invocation-binding-v8"
  readonly method: "selectActivations" | "soldierBrain"
  readonly requestOrdinal: number
  readonly requestRoot: string
  readonly payloadRoot: string
  readonly inputRoot: LabRoot
  readonly executableRoot: LabRoot
  readonly sourceRoot: LabRoot
  readonly seat: "bottom" | "top"
  readonly requestId: string
  readonly ordinal: number
  readonly invocationRoot: LabRoot
}
const invocationBindingKeys = ["schemaVersion", "method", "requestOrdinal", "requestRoot", "payloadRoot", "inputRoot", "executableRoot", "sourceRoot", "seat", "requestId", "ordinal", "invocationRoot"] as const
interface LeanCorrectionInvocationTransportBinding { readonly method: "selectActivations" | "soldierBrain"; readonly requestOrdinal: number; readonly requestRoot: string; readonly payloadRoot: string; readonly inputRoot: LabRoot; readonly executableRoot: LabRoot }
export const leanCorrectionInvocationTransportBinding = (request: { methodName: LeanCorrectionInvocationBinding["method"]; source: string; input: unknown; outputByteLimit?: number; requestOrdinal: number }, startupV5: boolean | "v6" | "v7" | "v8" = false): LeanCorrectionInvocationTransportBinding => {
  const payload = encodeSubprocessIpcRequest({ source: request.source, methodName: request.methodName, input: request.input, outputByteLimit: request.outputByteLimit })
  const requestOrdinal = request.requestOrdinal
  if (!Number.isSafeInteger(requestOrdinal) || requestOrdinal < 1) throw new TypeError("LEAN_CORRECTION_INVOCATION_ORDINAL")
  const payloadRoot = `sha256:${createHash("sha256").update(payload).digest("hex")}`
  return Object.freeze({ method: request.methodName, requestOrdinal, requestRoot: `sha256:${createHash("sha256").update(`${startupV5 === "v8" ? "v1.38-lean-startup-v8" : startupV5 === "v7" ? "v1.38-lean-startup-v7" : startupV5 === "v6" ? "v1.38-lean-startup-v6" : startupV5 ? "v1.38-lean-startup-v5" : "v1.38-lean-correction-origin"}:${requestOrdinal}:`).update(payload).digest("hex")}`, payloadRoot, inputRoot: labRoot("runtime-input", request.input), executableRoot: `sha256:${createHash("sha256").update(request.source).digest("hex")}` })
}
/** Authenticate the finite transport receipt against the actual failed
 * host-issued runtime evidence before it can be retained beside an origin. */
export const bindLeanCorrectionInvocation = (origin: LeanPrivateCorrectionOrigin, transport: LeanCorrectionInvocationTransportBinding, evidence: Parameters<typeof getFactoryPrivateDiagnostic>[1], privateDiagnostic: ReturnType<typeof getFactoryPrivateDiagnostic>, seat: "bottom" | "top"): LeanCorrectionInvocationBinding => {
  const o = validateLeanPrivateCorrectionOrigin(origin), t = validateTransportBinding(transport)
  if (!privateDiagnostic || evidence.result.ok || !("systemFailure" in evidence.result) || o.requestOrdinal !== t.requestOrdinal || o.requestRoot !== t.requestRoot || t.method !== evidence.method || t.requestOrdinal !== evidence.ordinal + 1 || t.inputRoot !== evidence.inputRoot || t.executableRoot !== evidence.identity.executableRoot || !/^sha256:[a-f0-9]{64}$/u.test(evidence.identity.sourceRoot) || privateDiagnostic.method !== evidence.method || privateDiagnostic.ordinal !== evidence.ordinal || privateDiagnostic.requestId !== evidence.requestId || privateDiagnostic.inputRoot !== evidence.inputRoot || privateDiagnostic.invocationRoot !== evidence.invocationRoot || privateDiagnostic.identity.sourceRoot !== evidence.identity.sourceRoot || privateDiagnostic.identity.executableRoot !== evidence.identity.executableRoot) throw new TypeError("LEAN_CORRECTION_INVOCATION_JOIN")
  if ((o.schemaVersion === "v1.38-lean-startup-origin-v5" || o.schemaVersion === "v1.38-lean-startup-origin-v6" || o.schemaVersion === "v1.38-lean-startup-origin-v7" || o.schemaVersion === "v1.38-lean-startup-origin-v8") && (o.sourceRoot !== evidence.identity.sourceRoot || o.executableRoot !== evidence.identity.executableRoot || o.inputRoot !== evidence.inputRoot || o.method !== evidence.method || o.seat !== seat || o.allocationRoot !== evidence.identity.budgetRoot || o.chargeRoot !== evidence.identity.attemptRoot || o.harnessRoot !== evidence.identity.harnessRoot)) throw new TypeError("LEAN_STARTUP_INVOCATION_JOIN_V5")
  const binding: LeanCorrectionInvocationBinding = Object.freeze({ schemaVersion: o.schemaVersion === "v1.38-lean-startup-origin-v8" ? "v1.38-lean-correction-invocation-binding-v8" : o.schemaVersion === "v1.38-lean-startup-origin-v7" ? "v1.38-lean-correction-invocation-binding-v7" : o.schemaVersion === "v1.38-lean-startup-origin-v6" ? "v1.38-lean-correction-invocation-binding-v6" : o.schemaVersion === "v1.38-lean-startup-origin-v5" ? "v1.38-lean-correction-invocation-binding-v5" : "v1.38-lean-correction-invocation-binding-v1", method: evidence.method as LeanCorrectionInvocationBinding["method"], requestOrdinal: t.requestOrdinal, requestRoot: t.requestRoot, payloadRoot: t.payloadRoot, inputRoot: evidence.inputRoot, executableRoot: evidence.identity.executableRoot, sourceRoot: evidence.identity.sourceRoot, seat, requestId: evidence.requestId, ordinal: evidence.ordinal, invocationRoot: evidence.invocationRoot })
  if (!exactInvocationBinding(binding) || binding.requestId.length < 1) throw new TypeError("LEAN_CORRECTION_INVOCATION_JOIN")
  return binding
}
const exactInvocationBinding = (value: unknown): value is LeanCorrectionInvocationBinding => !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === invocationBindingKeys.length && invocationBindingKeys.every(key => key in value) && ["v1.38-lean-correction-invocation-binding-v1", "v1.38-lean-correction-invocation-binding-v5", "v1.38-lean-correction-invocation-binding-v6", "v1.38-lean-correction-invocation-binding-v7", "v1.38-lean-correction-invocation-binding-v8"].includes((value as LeanCorrectionInvocationBinding).schemaVersion)
const transportBindingKeys = ["method", "requestOrdinal", "requestRoot", "payloadRoot", "inputRoot", "executableRoot"] as const
const validateTransportBinding = (value: unknown): LeanCorrectionInvocationTransportBinding => {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== transportBindingKeys.length || transportBindingKeys.some(key => !(key in value))) throw new TypeError("LEAN_CORRECTION_TRANSPORT_BINDING_INVALID")
  const r = value as LeanCorrectionInvocationTransportBinding
  if (!["selectActivations", "soldierBrain"].includes(r.method) || !Number.isSafeInteger(r.requestOrdinal) || r.requestOrdinal < 1 || !/^sha256:[a-f0-9]{64}$/u.test(r.requestRoot) || !/^sha256:[a-f0-9]{64}$/u.test(r.payloadRoot) || !/^sha256:[a-f0-9]{64}$/u.test(r.inputRoot) || !/^sha256:[a-f0-9]{64}$/u.test(r.executableRoot)) throw new TypeError("LEAN_CORRECTION_TRANSPORT_BINDING_INVALID")
  return Object.freeze({ ...r })
}

type LegacyMatchInput = {
  ledger: LeanExperimentLedger; charge: LeanCharge; slot: LeanSlot; seed: string
  bottom: LeanBaselineSource; top: LeanBaselineSource; observedRole?: string
  correction?: { reuse: LeanColdReuse; observe?: (metadata: LeanPrivateCorrectionOrigin, sourceRoot: LabRoot, seat: "bottom" | "top", binding: LeanCorrectionInvocationTransportBinding) => void }
  checkpoint: (additionalBytes?: number) => void
  register: (provider: Pick<FactorySupervisionProvider, "close">) => void
  unregister: (provider: Pick<FactorySupervisionProvider, "close">) => void
}
type PrivateMatchInput = Pick<LegacyMatchInput, "bottom" | "top" | "register" | "unregister"> & { admission: LeanPrivateMatchAdmissionV1; debit: LeanPrivateMatchDebitV1 }
type PrivateMatchInputV2 = Pick<LegacyMatchInput, "bottom" | "top" | "register" | "unregister"> & { admission: LeanPrivateMatchAdmissionV2; debit: LeanPrivateMatchDebitV2 }
export const runLeanBaselineMatch = (input: LegacyMatchInput) => composeLeanNativeMatch(input)
/** Only opaque admitted/debited context enters the new lane; no callable
 * issuer, scalar capacity, arbitrary scenario or fabricated ledger seam. */
export const runLeanPrivateFeasibilityMatch = async (input: PrivateMatchInput) => composeLeanNativeMatch(input, { version: 1, context: readLeanPrivateMatchContextV1(input.admission, input.debit) })
export const runLeanPrivateFeasibilityMatchV2 = async (input: PrivateMatchInputV2) => composeLeanNativeMatch(input, { version: 2, context: readLeanPrivateMatchContextV2(input.admission, input.debit) })
type AuthenticatedPrivateRoute = { version: 1; context: ReturnType<typeof readLeanPrivateMatchContextV1> } | { version: 2; context: ReturnType<typeof readLeanPrivateMatchContextV2> }
const composeLeanNativeMatch = async (input: LegacyMatchInput | PrivateMatchInput | PrivateMatchInputV2, route?: AuthenticatedPrivateRoute) => {
  const legacy = "ledger" in input ? input : undefined
  const privateInput = "admission" in input ? input : undefined
  const v2 = route?.version === 2 ? privateInput as PrivateMatchInputV2 : undefined
  const v1 = route?.version === 1 ? privateInput as PrivateMatchInput : undefined
  const context = route?.context
  const allocationRoot = context?.allocation.root ?? legacy!.ledger.allocation.root, chargeRoot = context?.debitRoot ?? legacy!.charge.root
  const checkpoint = v2 ? (additionalBytes = 0) => checkpointLeanPrivateMatchV2(v2.admission, v2.debit, additionalBytes) : v1 ? (additionalBytes = 0) => checkpointLeanPrivateMatchV1(v1.admission, v1.debit, additionalBytes) : legacy!.checkpoint
  const hostBinding: LeanHostFailureBindingV7 | undefined = legacy && (legacy.ledger.allocation.schemaVersion.endsWith("-v7") || legacy.ledger.allocation.schemaVersion.endsWith("-v8")) && "route" in legacy.ledger.allocation ? { route: legacy.ledger.allocation.route, allocationRoot, chargeRoot, slotRoot: legacy.slot.root } : undefined
  const hostBindingV15: LabHostBindingV15 | undefined = legacy && leanSupervisorAllocationMode(legacy.ledger.allocation) === "v15-4" && leanSupervisorAllocationMode(admitLeanAllocation(legacy.ledger.allocation)) === "v15-4" ? { allocationRoot, chargeRoot, slotRoot: legacy.slot.root } : undefined
  let bottomSource: LeanBaselineSource, topSource: LeanBaselineSource, scenario: ReturnType<typeof leanBaselineScenario>
  try {
    bottomSource = validateLeanBaselineSource(input.bottom); topSource = validateLeanBaselineSource(input.top)
    if (context) {
      const a = context.allocation, slot = context.slot
      if (a.seed !== LEAN_PRIVATE_MATCH_SEED_V1 || bottomSource.role !== slot.bottomRole || topSource.role !== slot.topRole || !a.sources.some(s => s.snapshotRoot === bottomSource.root && s.sourceRoot === bottomSource.sourceRoot) || !a.sources.some(s => s.snapshotRoot === topSource.root && s.sourceRoot === topSource.sourceRoot)) return fail()
      const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.id === "arena:smoke:v1" && a.status === "active" && a.semanticGeometryHash === context.allocation.arenaHash) ?? fail()
      const bottomPlayerId = `lean-source-${bottomSource.sourceRoot.slice(7)}`, topPlayerId = `lean-source-${topSource.sourceRoot.slice(7)}`
      scenario = { arena, bottomPlayerId, topPlayerId, initialInitiativePlayerId: bottomPlayerId, seed: a.seed }
    } else scenario = leanBaselineScenario({ seed: legacy!.seed, slot: legacy!.slot, bottom: bottomSource, top: topSource })
  } catch (error) { if (hostBinding) throw captureLeanHostFailureV7("match_preparation", hostBinding, error); throw error }
  const began = performance.now(), opened: FactorySupervisionProvider[] = []
  const brainInputs: SoldierBrainInputV119[] = [], strategyInputs: StrategyInputV119[] = []
  const decisionRows: Array<{ method: string; inputRoot: LabRoot; outputRoot: LabRoot }> = []
  let cleanupComplete = true
  const create = (snapshot: LeanBaselineSource, seat: "bottom" | "top"): FactorySupervisionProvider => {
    checkpoint()
    const sourceBytes = new TextEncoder().encode(snapshot.source)
    const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: snapshot.packet, proposal: snapshot.proposal, sourceBytes }), validation: snapshot.validation })
    const defaults = defaultRuntimeMetadata("typescript")
    const revision = buildStrategyRevision({ source: snapshot.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
    if (!revision.validation.valid || !revision.metadata.sourceArtifact) return fail()
    const executableSource = Buffer.from(revision.metadata.sourceArtifact.bytesBase64 ?? fail(), "base64").toString("utf8")
    const matchId = `lean-${chargeRoot.slice(7, 31)}`, containerName = `lean-${chargeRoot.slice(7, 25)}-${seat}`, ownershipLabel = `lean-${allocationRoot.slice(7, 25)}`
    const runtime = prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot: snapshot.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image })
    const binding = { budgetRoot: allocationRoot, attemptRoot: chargeRoot, matchId, containerName, ownershipLabel, seat, runtime }
    const authority = v2 ? issueLeanPrivateMatchRuntimeAuthorityV2(v2.admission, v2.debit, snapshot, binding) : v1 ? issueLeanPrivateMatchRuntimeAuthorityV1(v1.admission, v1.debit, snapshot, binding) : legacy!.correction ? issueLeanCorrectionRuntimeAuthority(legacy!.ledger, legacy!.charge, snapshot, binding, legacy!.correction.reuse) : issueLeanBaselineRuntimeAuthority(legacy!.ledger, legacy!.charge, snapshot, binding)
    let activeTransportBinding: LeanCorrectionInvocationTransportBinding | undefined
    let requestOrdinal = 0
    const retainedTransportBindings = new Map<number, { origin: LeanPrivateCorrectionOrigin; transport: LeanCorrectionInvocationTransportBinding }>()
    const native = createFactorySupervisedRuntime({ admission, sourceBytes, leanExperimentAuthority: authority, matchId, containerName, ownershipLabel, attemptRoot: chargeRoot, budgetRoot: allocationRoot, image: LAB_ADMITTED_ROOTS.image, invocationLimit: 24800, factoryLifetimeMs: 600000, ...(legacy?.correction?.observe ? { [(leanSupervisorAllocationMode(legacy.ledger.allocation) === "v5" || (leanSupervisorAllocationMode(legacy.ledger.allocation) === "v6" || (leanSupervisorAllocationMode(legacy.ledger.allocation) === "v7" || isLeanRetryMode(leanSupervisorAllocationMode(legacy.ledger.allocation))))) ? "startupOriginObserver" : "correctionOriginObserver"]: { observe: (metadata: LeanPrivateCorrectionOrigin) => { if (!activeTransportBinding) return fail(); retainedTransportBindings.set(activeTransportBinding.requestOrdinal, { origin: validateLeanPrivateCorrectionOrigin(metadata), transport: activeTransportBinding }); legacy.correction!.observe!(metadata, snapshot.sourceRoot, seat, activeTransportBinding) } } } : {}) })
    let closed: ReturnType<FactorySupervisionProvider["close"]> | undefined
    const observed = snapshot.role === legacy?.observedRole
    const provider: FactorySupervisionProvider = {
      identity: native.identity,
      async invoke(request, identity) {
        if (performance.now() - began >= LEAN_CAPS.matchMs) { provider.close(); return fail() }
        checkpoint()
        requestOrdinal += 1
        if (legacy?.correction?.observe) activeTransportBinding = leanCorrectionInvocationTransportBinding({ methodName: request.kind, source: executableSource, input: request.input, outputByteLimit: CORRECTION_RUNTIME_OUTPUT_BYTES, requestOrdinal }, leanSupervisorAllocationMode(legacy.ledger.allocation) === "v15-5" ? "v8" : (leanSupervisorAllocationMode(legacy.ledger.allocation) === "v7" || isLeanRetryMode(leanSupervisorAllocationMode(legacy.ledger.allocation))) ? "v7" : leanSupervisorAllocationMode(legacy.ledger.allocation) === "v6" ? "v6" : leanSupervisorAllocationMode(legacy.ledger.allocation) === "v5")
        const evidence = await native.invoke(request, identity)
        activeTransportBinding = undefined
        if (observed && native.verify(evidence) && evidence.result.ok) {
          if (request.kind === "soldierBrain" && brainInputs.length < 16) brainInputs.push(structuredClone(request.input as SoldierBrainInputV119))
          if (request.kind === "selectActivations" && strategyInputs.length < 16) strategyInputs.push(structuredClone(request.input as StrategyInputV119))
          if (decisionRows.length < 128) decisionRows.push({ method: request.kind, inputRoot: evidence.inputRoot, outputRoot: labRoot("lean-runtime-decision-output-v1", evidence.result.value) })
        }
        checkpoint()
        return evidence
      },
      verify: evidence => native.verify(evidence),
      close() { if (!closed) closed = native.close(); cleanupComplete = cleanupComplete && closed.cleanupComplete && !closed.orphanedChild; return closed },
    }
    // This accessor is kept private and only read after a finite failure.
    diagnosticProviders.set(provider, evidence => getFactoryPrivateDiagnostic(native, evidence))
    diagnosticTransportBindings.set(provider, retainedTransportBindings)
    opened.push(provider); input.register(provider)
    return provider
  }
  let actual: LabMatchExecution
  try {
    let bottom: FactorySupervisionProvider, top: FactorySupervisionProvider
    try { bottom = create(bottomSource, "bottom"); top = create(topSource, "top") }
    catch (error) { if (hostBinding) throw captureLeanHostFailureV7("match_preparation", hostBinding, error); throw error }
    actual = await runCanonicalLabMatch({ match: { matchId: `lean-${chargeRoot.slice(7, 31)}`, seed: scenario.seed, arenaVariant: scenario.arena, bottomPlayerId: scenario.bottomPlayerId, topPlayerId: scenario.topPlayerId, initialInitiativePlayerId: scenario.initialInitiativePlayerId, bottomStrategyRevisionId: bottom.identity.revisionId, topStrategyRevisionId: top.identity.revisionId }, providers: { [scenario.bottomPlayerId]: bottom, [scenario.topPlayerId]: top }, ...(hostBindingV15 ? { hostBindingV15, hostClockV15: () => performance.now() } : {}) })
  } catch (error) { if (hostBinding) throw captureLeanHostFailureV7("match_composition_postprocessing", hostBinding, error); actual = { kind: "failure", privacy: "private_offline", unchangedState: null, transitions: [], accounting: [], failure: { classification: "system_failure", code: "LEAN_BASELINE_SUPERVISOR_FAILURE" } } }
  finally {
    let cleanupFailure: unknown
    for (const provider of opened) {
      if (hostBinding) {
        try { input.unregister(provider) } catch (error) { cleanupFailure ??= captureLeanHostFailureV7("match_composition_postprocessing", hostBinding, error) }
        try { provider.close() } catch (error) { cleanupComplete = false; cleanupFailure ??= captureLeanHostFailureV7("match_composition_postprocessing", hostBinding, error) }
      } else { input.unregister(provider); try { provider.close() } catch { cleanupComplete = false } }
    }
    if (cleanupFailure) throw cleanupFailure
  }
  checkpoint()
  const elapsedMs = Math.ceil(performance.now() - began), compact = compactExecution(actual, elapsedMs, cleanupComplete, scenario.bottomPlayerId, legacy?.ledger.allocation, checkpoint)
  const observedSeat = legacy?.observedRole === bottomSource.role ? "bottom" : legacy?.observedRole === topSource.role ? "top" : null
  const { trainingHalfPoints, semanticRoot, metrics } = leanBaselineMatchEvidence(actual, compact, observedSeat)
  function* replayFrames() {
    if (actual.kind === "completed") {
      yield redact({ kind: "final-state", value: actual.result.state })
      for (const transition of actual.transitions) { checkpoint(); yield redact({ kind: "transition", value: transition }) }
    } else yield { kind: "failure", code: compact.code }
  }
  const failedEvidence = actual.accounting.find(e => !e.result.ok && "systemFailure" in e.result)
  const provider = failedEvidence && opened.find(p => p.identity.sourceRoot === failedEvidence.identity.sourceRoot)
  const origin = provider && failedEvidence ? diagnosticProviders.get(provider)?.(failedEvidence) : undefined
  const retainedOrigin = provider && failedEvidence ? diagnosticTransportBindings.get(provider)?.get(failedEvidence.ordinal + 1) : undefined
  const invocationBinding = origin && retainedOrigin && failedEvidence && provider ? bindLeanCorrectionInvocation(retainedOrigin.origin, retainedOrigin.transport, failedEvidence, origin, provider.identity.sourceRoot === bottomSource.sourceRoot ? "bottom" : "top") : undefined
  if (context && actual.accounting.some(evidence => !opened.some(provider => provider.identity.sourceRoot === evidence.identity.sourceRoot && provider.verify(evidence)))) return fail()
  const baseDiagnostic = compact.classification !== "success" ? deriveLeanSupervisorDiagnostic(chargeRoot, actual, origin ? { stage: "native_response", reason: ["stream_exchange", "outer_frame", "inner_response", "executor"].includes(origin.stage) ? origin.stage as "stream_exchange" | "outer_frame" | "inner_response" | "executor" : "system_failure", method: failedEvidence!.method, ordinal: failedEvidence!.ordinal, code: !failedEvidence!.result.ok && "systemFailure" in failedEvidence!.result ? failedEvidence!.result.systemFailure.code : undefined } : undefined) : null
  const diagnostic = baseDiagnostic && invocationBinding ? { ...baseDiagnostic, invocationBinding } : baseDiagnostic
  const returned = { compact, replayFrames: replayFrames(), brainInputs, strategyInputs, trainingHalfPoints, semanticRoot, metrics, decisionRoot: labRoot("lean-baseline-observed-decisions-v1", decisionRows), diagnostic, ...(context ? { privateActual: actual, privateProviderIdentities: opened.map(provider => provider.identity) } : {}), ...(hostBindingV15 ? { hostFailureV15: compact.classification === "success" ? null : readLabHostFailureV15(actual, hostBindingV15) } : {}) }
  if (v2) {
    const failed = actual.accounting.filter(e => e.charged && !e.result.ok && "systemFailure" in e.result)
    if (failed.length > 1) return fail()
    const evidence = failed[0]
    if (evidence) {
      const owner = opened.find(p => p.identity === evidence.identity && p.verify(evidence))
      if (!owner || evidence.result.ok || !("systemFailure" in evidence.result) || !(SUBPROCESS_SYSTEM_FAILURE_CODES as readonly string[]).includes(evidence.result.systemFailure.code)) return fail()
      const issuedOrigin = diagnosticProviders.get(owner)?.(evidence)
      if (issuedOrigin && (issuedOrigin.identity !== evidence.identity || issuedOrigin.invocationRoot !== evidence.invocationRoot || issuedOrigin.requestId !== evidence.requestId || issuedOrigin.inputRoot !== evidence.inputRoot || issuedOrigin.method !== evidence.method || issuedOrigin.ordinal !== evidence.ordinal || !isLeanPrivateFailureOrigin(issuedOrigin))) return fail()
      privateDiagnosticReturnsV2.set(returned, Object.freeze({ availability: "available", originAvailability: issuedOrigin ? "available" : "unavailable", stage: issuedOrigin?.stage ?? "unknown", reason: issuedOrigin?.reason ?? "unknown", code: evidence.result.systemFailure.code, identity: evidence.identity, invocationRoot: evidence.invocationRoot, requestId: evidence.requestId, inputRoot: evidence.inputRoot, method: evidence.method, ordinal: evidence.ordinal }))
    } else privateDiagnosticReturnsV2.set(returned, Object.freeze({ availability: "unavailable", originAvailability: "unavailable", stage: "unknown", reason: "unknown", code: "UNKNOWN", identity: null, invocationRoot: null, requestId: null, inputRoot: null, method: null, ordinal: null }))
  }
  return returned
}
type PrivateDiagnosticV2 = Readonly<{ availability: "available" | "unavailable"; originAvailability: "available" | "unavailable"; stage: string; reason: string; code: string; identity: import("../../packages/strategy-lab/src/runtime-bridge.js").LabRuntimeIdentity | null; invocationRoot: LabRoot | null; requestId: string | null; inputRoot: LabRoot | null; method: string | null; ordinal: number | null }>
const privateDiagnosticReturnsV2 = new WeakMap<object, PrivateDiagnosticV2>()
/** Only a real composer return is a key. No caller-supplied diagnostic exists. */
export const readLeanPrivateMatchDiagnosticV2 = (returned: object): PrivateDiagnosticV2 | undefined => privateDiagnosticReturnsV2.get(returned)
const diagnosticProviders = new WeakMap<object, (evidence: Parameters<typeof getFactoryPrivateDiagnostic>[1]) => ReturnType<typeof getFactoryPrivateDiagnostic>>()
const diagnosticTransportBindings = new WeakMap<object, Map<number, { origin: LeanPrivateCorrectionOrigin; transport: LeanCorrectionInvocationTransportBinding }>>()
