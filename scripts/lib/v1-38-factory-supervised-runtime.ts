import { createHash } from "node:crypto"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { claimProspectiveLeagueLifetimeAuthority, isProspectiveLeagueLifetimeFixture, prospectiveLeagueRuntimeBinding, type ProspectiveLeagueRuntimeBinding } from "./v1-38-league-prospective-lifetime.js"
import { LAB_ADMITTED_ROOTS, freezeLabValue, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import type { FactoryAdmission, FactorySupervisionProvider } from "../../packages/strategy-lab/src/factory/admission.js"
import type { LabRuntimeEvidence } from "../../packages/strategy-lab/src/runtime-bridge.js"
import type { DiagnosticPilotLifetimeGrant } from "../../packages/strategy-lab/src/league/diagnostic-pilot.js"
import type { DiagnosticOneCellLifetimeGrant } from "../../packages/strategy-lab/src/league/diagnostic-one-cell.js"
import { claimDiagnosticRetryV4LifetimeGrant, type DiagnosticRetryV4LifetimeGrant, type DiagnosticRetryV4RuntimeBinding } from "./v1-38-diagnostic-retry-v4.js"
import { createPlannerSupervisedRuntime, type PlannerSupervisedRuntime, type PlannerSupervisedRuntimeOptions } from "./v1-38-planner-supervised-runtime.js"

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
  rejectRetiredDiagnosticLifetimeOptions(options)
  const supplied = options as unknown as Record<string, unknown>
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
  const createRuntime = options.createRuntime ?? createPlannerSupervisedRuntime
  const retryV4RuntimeBinding: DiagnosticRetryV4RuntimeBinding | undefined = options.retryV4LifetimeGrant === undefined ? undefined : {
    ...options.retryV4LifetimeGrant.runtime, factoryAuthorizationRoot: admission.authorizationRoot, factoryPacketRoot: admission.packetRoot,
    factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot,
    sourceRoot: admission.sourceRoot, revisionId: revision.id, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}`,
    tupleId: options.retryV4LifetimeGrant.runtime.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot,
    runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: options.image ?? LAB_ADMITTED_ROOTS.image,
  }
  const prospectiveRuntimeBinding = options.prospectiveLifetimeAuthority === undefined ? undefined : prospectiveLeagueRuntimeBinding(admission, { ...options.prospectiveLifetimeAuthority.runtime, revisionId: revision.id, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}`, tupleId: MATCH_KERNEL.tupleId, image: options.image ?? LAB_ADMITTED_ROOTS.image })
  const factoryLifetimeMs = admitFactorySupervisorLifetime({ ...options, ...(retryV4RuntimeBinding === undefined ? {} : { retryV4RuntimeBinding }), ...(prospectiveRuntimeBinding === undefined ? {} : { prospectiveRuntimeBinding }) })
  const began = performance.now()
  const { admission: _admission, sourceBytes: _sourceBytes, createRuntime: _createRuntime, factoryLifetimeMs: _factoryLifetimeMs, ...runtimeOptions } = options
  const selected = createRuntime({ ...runtimeOptions, ...(options.retryV4LifetimeGrant === undefined ? {} : { retryV4LifetimeMs: factoryLifetimeMs, retryV4RuntimeBinding: retryV4RuntimeBinding! }), revision, image: options.image ?? LAB_ADMITTED_ROOTS.image })
  let identity: FactorySupervisionProvider["identity"]
  try {
    if (selected.identity.sourceRoot !== admission.sourceRoot || selected.identity.runtimeLimitsRoot !== admission.nativeLane.runtimeProfileRoot || selected.identity.attemptRoot !== options.attemptRoot || selected.identity.budgetRoot !== options.budgetRoot || selected.identity.image !== (options.image ?? LAB_ADMITTED_ROOTS.image)) return fail("SELECTED_IDENTITY")
    identity = freezeLabValue({ ...selected.identity, nativeLane: admission.nativeLane, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot })
  } catch (error) {
    selected.close()
    throw error
  }
  const issued = new WeakMap<object, LabRuntimeEvidence>()
  return {
    identity,
    invoke(request, admittedIdentity) {
      if (performance.now() - began >= factoryLifetimeMs) { selected.close(); return fail("LIFETIME_EXHAUSTED") }
      if (!same(admittedIdentity, identity)) { selected.close(); return fail("REQUEST_IDENTITY") }
      const evidence = selected.invoke(request, selected.identity)
      if (performance.now() - began >= factoryLifetimeMs) { selected.close(); return fail("LIFETIME_EXHAUSTED") }
      if (!selected.verify(evidence) || !same(evidence.identity, selected.identity)) { selected.close(); return fail("EVIDENCE_IDENTITY") }
      const wrapped = freezeLabValue({ ...evidence, identity })
      issued.set(wrapped, evidence)
      return wrapped
    },
    verify(evidence) { const underlying = issued.get(evidence); return underlying !== undefined && selected.verify(underlying) },
    close() { return selected.close() },
  }
}
