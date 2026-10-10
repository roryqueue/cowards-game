import { createHash } from "node:crypto"
import { claimLeanRuntimeAuthority, claimLeanStartupAuthorityV8, leanStartupAuthorityDescriptorV8, claimLeanPrivateProbeRuntimeAuthority, type LeanPrivateProbeBindingV1, type LeanPrivateProbeRuntimeAuthority } from "./v1-38-lean-experiment-authority.js"
import { defaultRuntimeMetadata, StrategyInputV119Schema, SoldierBrainInputV119Schema } from "@cowards/spec"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { claimProspectiveLeagueHostReceiptAuthority, isProspectiveLeagueHostReceiptFixture } from "./v1-38-league-host-receipt.js"
import { claimProspectiveLeagueLifetimeAuthority, isProspectiveLeagueLifetimeFixture, prospectiveLeagueRuntimeBinding, type ProspectiveLeagueRuntimeBinding } from "./v1-38-league-prospective-lifetime.js"
import { LAB_ADMITTED_ROOTS, freezeLabValue, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import type { FactoryAdmission, FactorySupervisionProvider } from "../../packages/strategy-lab/src/factory/admission.js"
import type { LabRuntimeEvidence } from "../../packages/strategy-lab/src/runtime-bridge.js"
import type { DiagnosticPilotLifetimeGrant } from "../../packages/strategy-lab/src/league/diagnostic-pilot.js"
import type { DiagnosticOneCellLifetimeGrant } from "../../packages/strategy-lab/src/league/diagnostic-one-cell.js"
import { claimDiagnosticRetryV4LifetimeGrant, type DiagnosticRetryV4LifetimeGrant, type DiagnosticRetryV4RuntimeBinding } from "./v1-38-diagnostic-retry-v4.js"
import { createPlannerSupervisedRuntime, getPlannerPrivateDiagnostic, verifyPlannerPrivateDiagnostic, type PlannerPrivateDiagnostic, type PlannerSupervisedRuntime, type PlannerSupervisedRuntimeOptions } from "./v1-38-planner-supervised-runtime.js"

const privateDiagnostics = new WeakMap<object, (evidence: LabRuntimeEvidence) => PlannerPrivateDiagnostic | undefined>()
export const getFactoryPrivateDiagnostic = (provider: object, evidence: LabRuntimeEvidence): PlannerPrivateDiagnostic | undefined => privateDiagnostics.get(provider)?.(evidence)
export const verifyFactoryPrivateDiagnostic = (provider: object, evidence: LabRuntimeEvidence, diagnostic: unknown): boolean => diagnostic !== undefined && getFactoryPrivateDiagnostic(provider, evidence) === diagnostic

const fail = (code: string): never => { throw new TypeError(`FACTORY_RUNTIME_${code}`) }
const rawRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const same = (left: unknown, right: unknown) => labRoot("factory-runtime-binding-v1", left) === labRoot("factory-runtime-binding-v1", right)
/** Retired diagnostic options are data-compatible, never construction authority.
 * Presence (including undefined/inherited/accessor values) is denied without
 * reading the token or touching source, revision, constructor, or runtime. */
const rejectRetiredDiagnosticLifetimeOptions = (options: object): void => {
  if (["pilotLifetimeGrant", "pilotLifetimeMs", "oneCellLifetimeGrant", "oneCellLifetimeMs"].some((key) => key in options)) return fail("RETIRED_DIAGNOSTIC_LIFETIME")
}

export interface FactorySupervisedRuntimeOptions extends Omit<PlannerSupervisedRuntimeOptions, "revision" | "image" | "benchmarkLifetimeMs" | "observerHarness" | "transport" | "streamFactory" | "oneCellLifetimeMs"> {
  readonly admission: FactoryAdmission
  readonly sourceBytes: Uint8Array
  readonly image?: string
  /** Factory allocation lifetime. Kept separate from the Phase 263 benchmark-only option. */
  readonly factoryLifetimeMs?: number
  readonly pilotLifetimeGrant?: DiagnosticPilotLifetimeGrant
  readonly oneCellLifetimeGrant?: DiagnosticOneCellLifetimeGrant
  readonly retryV4LifetimeGrant?: DiagnosticRetryV4LifetimeGrant
  readonly createRuntime?: (options: PlannerSupervisedRuntimeOptions) => PlannerSupervisedRuntime
  readonly privateProbeAuthority?: LeanPrivateProbeRuntimeAuthority
  readonly privateProbeBinding?: LeanPrivateProbeBindingV1
}

/** Pure lifetime admission shared by real construction and injected tests. */
export const admitFactorySupervisorLifetime = (options: Pick<FactorySupervisedRuntimeOptions, "factoryLifetimeMs" | "pilotLifetimeGrant" | "oneCellLifetimeGrant" | "retryV4LifetimeGrant" | "retryV4RuntimeBinding" | "budgetRoot" | "attemptRoot" | "containerName" | "ownershipLabel" | "prospectiveLifetimeAuthority" | "prospectiveLifetimeMs"> & { matchId?: string; prospectiveRuntimeBinding?: ProspectiveLeagueRuntimeBinding }): number => {
  rejectRetiredDiagnosticLifetimeOptions(options)
  if ("prospectiveLifetimeAuthority" in options || "prospectiveLifetimeMs" in options) {
    if (!options.prospectiveLifetimeAuthority || options.prospectiveLifetimeMs !== 600000 || options.factoryLifetimeMs !== undefined && options.factoryLifetimeMs !== 600000 || options.retryV4LifetimeGrant !== undefined || options.retryV4RuntimeBinding !== undefined || !options.prospectiveRuntimeBinding || !options.matchId || !options.containerName || !options.ownershipLabel) return fail("PROSPECTIVE_LIFETIME")
    return claimProspectiveLeagueLifetimeAuthority(options.prospectiveLifetimeAuthority, { budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, matchId: options.matchId, containerName: options.containerName, ownershipLabel: options.ownershipLabel, runtime: options.prospectiveRuntimeBinding }, options.prospectiveLifetimeMs, "factory")
  }
  const factoryLifetimeMs = options.factoryLifetimeMs ?? 120_000
  if (!Number.isSafeInteger(factoryLifetimeMs) || factoryLifetimeMs < 1 || factoryLifetimeMs > (options.retryV4LifetimeGrant ? 240_000 : 120_000)) return fail("LIFETIME")
  if (options.retryV4LifetimeGrant !== undefined) {
    if (!options.retryV4RuntimeBinding) return fail("RETRY_V4_IDENTITY")
    claimDiagnosticRetryV4LifetimeGrant(options.retryV4LifetimeGrant, { allocationRoot: options.budgetRoot, cellRoot: options.retryV4LifetimeGrant.cellRoot, startRoot: options.attemptRoot, seat: options.retryV4LifetimeGrant.seat, containerName: options.containerName, ownershipLabel: options.ownershipLabel, lifetimeMilliseconds: factoryLifetimeMs, runtime: options.retryV4RuntimeBinding }, "factory")
  }
  return factoryLifetimeMs
}

/**
 * Turns admitted authored TypeScript bytes into the one selected container
 * revision. The packet provider id remains producer provenance and is never
 * confused with the runtime adapter id.
 */
export const createFactorySupervisedRuntime = (options: FactorySupervisedRuntimeOptions): FactorySupervisionProvider => {
  const supplied = options as unknown as Record<string, unknown>
  const hasRuntimeOverride = Reflect.has(supplied, "createRuntime")
  const hasProbeAuthority = Reflect.has(supplied, "privateProbeAuthority"), hasProbeBinding = Reflect.has(supplied, "privateProbeBinding")
  if (hasProbeAuthority || hasProbeBinding) {
    if (!hasProbeAuthority || !hasProbeBinding || !options.privateProbeAuthority || !options.privateProbeBinding || hasRuntimeOverride || ["leanExperimentAuthority", "prospectiveLifetimeAuthority", "prospectiveLifetimeMs", "prospectiveHostReceiptAuthority", "retryV4LifetimeGrant", "retryV4RuntimeBinding", "observerHarness", "privateObserver", "transport", "streamFactory", "benchmarkLifetimeMs", "startupOriginObserver", "correctionOriginObserver"].some(key => Reflect.has(supplied, key))) return fail("PRIVATE_PROBE_MODE")
    if (options.privateProbeBinding.executionOwnerId !== options.matchId || options.privateProbeBinding.image !== LAB_ADMITTED_ROOTS.image || options.image !== undefined && options.image !== LAB_ADMITTED_ROOTS.image) return fail("PRIVATE_PROBE_IDENTITY")
  }
  rejectRetiredDiagnosticLifetimeOptions(options)
  if (["startup", "startupPolicy", "startupGrant", "startupMs"].some(key => key in options)) return fail("STARTUP_OPTION_V5")
  if (options.leanExperimentAuthority && ["createRuntime", "prospectiveLifetimeAuthority", "prospectiveLifetimeMs", "prospectiveHostReceiptAuthority", "retryV4LifetimeGrant", "observerHarness", "transport", "streamFactory"].some(key => key in supplied)) return fail("LEAN_MODE")
  if ("hostResponseReceiptMilliseconds" in supplied || "prospectiveHostReceiptBinding" in supplied) return fail("HOST_RECEIPT_OPTION")
  if ("prospectiveHostReceiptAuthority" in supplied && (!options.prospectiveHostReceiptAuthority || !options.prospectiveLifetimeAuthority || options.prospectiveLifetimeMs !== 600000 || "createRuntime" in supplied && !isProspectiveLeagueHostReceiptFixture(options.prospectiveHostReceiptAuthority) || ["retryV4LifetimeGrant", "retryV4LifetimeMs", "retryV4RuntimeBinding", "benchmarkLifetimeMs", "observerHarness", "privateObserver", "transport", "streamFactory"].some((key) => key in supplied))) return fail("HOST_RECEIPT_MODE")
  if (options.prospectiveHostReceiptAuthority && isProspectiveLeagueHostReceiptFixture(options.prospectiveHostReceiptAuthority) && typeof options.createRuntime !== "function") return fail("HOST_RECEIPT_FIXTURE_CONSTRUCTOR")
  if (("prospectiveLifetimeAuthority" in options || "prospectiveLifetimeMs" in options) && ("createRuntime" in supplied && (!options.prospectiveLifetimeAuthority || !isProspectiveLeagueLifetimeFixture(options.prospectiveLifetimeAuthority)) || ["retryV4LifetimeGrant", "retryV4LifetimeMs", "retryV4RuntimeBinding", "benchmarkLifetimeMs", "observerHarness", "transport", "streamFactory"].some((key) => key in supplied))) return fail("PROSPECTIVE_CONSTRUCTOR_OVERRIDE")
  if (options.retryV4LifetimeGrant !== undefined && Object.prototype.hasOwnProperty.call(supplied, "createRuntime")) return fail("RETRY_V4_CONSTRUCTOR_OVERRIDE")
  if (["benchmarkLifetimeMs", "observerHarness", "transport", "streamFactory"].some((key) => Object.prototype.hasOwnProperty.call(supplied, key))) return fail("UNSUPPORTED_OPTION")
  const admission = options.admission
  if (admission.nativeLane.language !== "typescript" || admission.nativeLane.translation !== "none") return fail("UNSUPPORTED_NATIVE_LANE")
  if (admission.nativeLane.runtimeAbi !== "strategy-runtime-abi-v1.19" || admission.nativeLane.runtimeProfileRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot) return fail("NATIVE_LANE_IDENTITY")
  if (!(options.sourceBytes instanceof Uint8Array) || options.sourceBytes.byteLength < 1 || options.sourceBytes.byteLength > 65_536 || rawRoot(options.sourceBytes) !== admission.sourceRoot) return fail("SOURCE_BINDING")
  let source: string
  try { source = new TextDecoder("utf-8", { fatal: true }).decode(options.sourceBytes) } catch { return fail("SOURCE_ENCODING") }
  const defaults = defaultRuntimeMetadata("typescript")
  const runtimeMetadata = { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" as const } }
  const revision = buildStrategyRevision({ source, runtime: runtimeMetadata })
  if (!revision.validation.valid || revision.sourceHash !== admission.sourceRoot.slice(7) || revision.sourceBytes !== options.sourceBytes.byteLength || revision.runtime.language.id !== "typescript" || revision.runtime.abiVersion !== admission.nativeLane.runtimeAbi || revision.runtime.adapter.id !== "runtime-js-container-subprocess") return fail("REVISION_BINDING")
  const probeBinding = options.privateProbeBinding
  if (options.privateProbeAuthority && probeBinding && (probeBinding.sourceRoot !== admission.sourceRoot || probeBinding.executableRoot !== `sha256:${revision.metadata.sourceArtifact!.hash}` || probeBinding.tupleId !== MATCH_KERNEL.tupleId || probeBinding.tupleRoot !== LAB_ADMITTED_ROOTS.tupleRoot || probeBinding.runtimeLimitsRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot || probeBinding.image !== (options.image ?? LAB_ADMITTED_ROOTS.image) || !["selectActivations", "soldierBrain"].includes(probeBinding.method))) return fail("PRIVATE_PROBE_SOURCE_BINDING")
  const createRuntime = options.createRuntime ?? createPlannerSupervisedRuntime
  const retryV4RuntimeBinding: DiagnosticRetryV4RuntimeBinding | undefined = options.retryV4LifetimeGrant === undefined ? undefined : {
    ...options.retryV4LifetimeGrant.runtime, factoryAuthorizationRoot: admission.authorizationRoot, factoryPacketRoot: admission.packetRoot,
    factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot,
    sourceRoot: admission.sourceRoot, revisionId: revision.id, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}`,
    tupleId: options.retryV4LifetimeGrant.runtime.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot,
    runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: options.image ?? LAB_ADMITTED_ROOTS.image,
  }
  const prospectiveRuntimeBinding = options.prospectiveLifetimeAuthority === undefined ? undefined : prospectiveLeagueRuntimeBinding(admission, { ...options.prospectiveLifetimeAuthority.runtime, revisionId: revision.id, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}`, tupleId: MATCH_KERNEL.tupleId, image: options.image ?? LAB_ADMITTED_ROOTS.image })
  const leanRuntimeBinding = options.leanExperimentAuthority === undefined ? undefined : prospectiveLeagueRuntimeBinding(admission, { ...options.leanExperimentAuthority.runtime, revisionId: revision.id, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}`, tupleId: MATCH_KERNEL.tupleId, image: options.image ?? LAB_ADMITTED_ROOTS.image })
  if (options.privateProbeAuthority && probeBinding) claimLeanPrivateProbeRuntimeAuthority(options.privateProbeAuthority, probeBinding, "factory")
  const factoryLifetimeMs = options.privateProbeAuthority ? 5000 : options.leanExperimentAuthority === undefined ? admitFactorySupervisorLifetime({ ...options, ...(retryV4RuntimeBinding === undefined ? {} : { retryV4RuntimeBinding }), ...(prospectiveRuntimeBinding === undefined ? {} : { prospectiveRuntimeBinding }) }) : (leanStartupAuthorityDescriptorV8(options.leanExperimentAuthority) ? claimLeanStartupAuthorityV8 : claimLeanRuntimeAuthority)(options.leanExperimentAuthority, { budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, matchId: options.matchId, containerName: options.containerName, ownershipLabel: options.ownershipLabel, runtime: leanRuntimeBinding! }, "factory").lifetimeMs
  if (options.leanExperimentAuthority && options.factoryLifetimeMs !== 600000) return fail("LEAN_LIFETIME")
  if (options.prospectiveHostReceiptAuthority) claimProspectiveLeagueHostReceiptAuthority(options.prospectiveHostReceiptAuthority, { budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, matchId: options.matchId, containerName: options.containerName, ownershipLabel: options.ownershipLabel, runtime: prospectiveRuntimeBinding!, seat: options.prospectiveLifetimeAuthority!.seat }, "factory")
  const began = performance.now()
  const { admission: _admission, sourceBytes: _sourceBytes, createRuntime: _createRuntime, factoryLifetimeMs: _factoryLifetimeMs, ...runtimeOptions } = options
  const probeOptions = probeBinding === undefined ? {} : { matchId: probeBinding.executionOwnerId, budgetRoot: probeBinding.allocationRoot, attemptRoot: probeBinding.debitDigest, containerName: `probe-${probeBinding.allocationRoot.slice(7, 19)}-${probeBinding.ordinal}`, ownershipLabel: `probe-${probeBinding.allocationRoot.slice(7, 19)}` }
  const selected = createRuntime({ ...runtimeOptions, ...probeOptions, ...(options.retryV4LifetimeGrant === undefined ? {} : { retryV4LifetimeMs: factoryLifetimeMs, retryV4RuntimeBinding: retryV4RuntimeBinding! }), revision, image: options.image ?? LAB_ADMITTED_ROOTS.image })
  let identity: FactorySupervisionProvider["identity"]
  try {
    if (selected.identity.sourceRoot !== admission.sourceRoot || selected.identity.runtimeLimitsRoot !== admission.nativeLane.runtimeProfileRoot || selected.identity.attemptRoot !== (probeBinding?.debitDigest ?? options.attemptRoot) || selected.identity.budgetRoot !== (probeBinding?.allocationRoot ?? options.budgetRoot) || selected.identity.image !== (options.image ?? LAB_ADMITTED_ROOTS.image)) return fail("SELECTED_IDENTITY")
    identity = freezeLabValue({ ...selected.identity, nativeLane: admission.nativeLane, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot })
  } catch (error) {
    selected.close()
    throw error
  }
  const issued = new WeakMap<object, LabRuntimeEvidence>()
  const diagnostics = new WeakMap<object, PlannerPrivateDiagnostic>()
  let privateProbeConsumed = false
  const provider: FactorySupervisionProvider = {
    identity,
    invoke(request, admittedIdentity) {
      if (probeBinding) {
        if (privateProbeConsumed) { selected.close(); return fail("PRIVATE_PROBE_REUSED") }
        privateProbeConsumed = true
        const inputRoot = labRoot("runtime-input", request.input)
        const requestRoot = labRoot("lean-private-probe-request-v1", { method: request.kind, inputRoot, tupleId: request.semanticTupleId })
        if (!same(admittedIdentity, identity) || identity.sourceRoot !== probeBinding.sourceRoot || identity.executableRoot !== probeBinding.executableRoot || request.kind !== probeBinding.method || inputRoot !== probeBinding.inputRoot || requestRoot !== probeBinding.requestRoot) { selected.close(); return fail("PRIVATE_PROBE_REQUEST_BINDING") }
        const parsed = request.kind === "selectActivations" ? StrategyInputV119Schema.safeParse(request.input) : SoldierBrainInputV119Schema.safeParse(request.input)
        if (!parsed.success) { selected.close(); return fail("PRIVATE_PROBE_SCHEMA") }
      }
      if (performance.now() - began >= factoryLifetimeMs) { selected.close(); return fail("LIFETIME_EXHAUSTED") }
      if (!same(admittedIdentity, identity)) { selected.close(); return fail("REQUEST_IDENTITY") }
      const evidence = selected.invoke(request, selected.identity)
      if (performance.now() - began >= factoryLifetimeMs) { selected.close(); return fail("LIFETIME_EXHAUSTED") }
      if (!selected.verify(evidence) || !same(evidence.identity, selected.identity)) { selected.close(); return fail("EVIDENCE_IDENTITY") }
      const wrapped = freezeLabValue({ ...evidence, identity })
      issued.set(wrapped, evidence)
      const diagnostic = getPlannerPrivateDiagnostic(selected, evidence)
      if (diagnostic && verifyPlannerPrivateDiagnostic(selected, evidence, diagnostic)) diagnostics.set(wrapped, freezeLabValue({ stage: diagnostic.stage, reason: diagnostic.reason, identity, invocationRoot: wrapped.invocationRoot, requestId: wrapped.requestId, method: wrapped.method, inputRoot: wrapped.inputRoot, ordinal: wrapped.ordinal }) as PlannerPrivateDiagnostic)
      return wrapped
    },
    verify(evidence) { const underlying = issued.get(evidence); return underlying !== undefined && selected.verify(underlying) },
    close() { return selected.close() },
  }
  privateDiagnostics.set(provider, (evidence) => {
    const underlying = issued.get(evidence), diagnostic = underlying && getPlannerPrivateDiagnostic(selected, underlying)
    return underlying && selected.verify(underlying) && diagnostic && verifyPlannerPrivateDiagnostic(selected, underlying, diagnostic) ? diagnostics.get(evidence) : undefined
  })
  return provider
}
