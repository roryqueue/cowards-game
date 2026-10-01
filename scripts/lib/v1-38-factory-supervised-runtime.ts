import { createHash } from "node:crypto"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { LAB_ADMITTED_ROOTS, freezeLabValue, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import type { FactoryAdmission, FactorySupervisionProvider } from "../../packages/strategy-lab/src/factory/admission.js"
import type { LabRuntimeEvidence } from "../../packages/strategy-lab/src/runtime-bridge.js"
import { requireDiagnosticPilotLifetimeGrant, type DiagnosticPilotLifetimeGrant } from "../../packages/strategy-lab/src/league/diagnostic-pilot.js"
import { requireDiagnosticOneCellLifetimeGrant, type DiagnosticOneCellLifetimeGrant } from "../../packages/strategy-lab/src/league/diagnostic-one-cell.js"
import { requireDiagnosticRetryV4LifetimeGrant, type DiagnosticRetryV4LifetimeGrant } from "../../packages/strategy-lab/src/league/diagnostic-retry-v4.js"
import { createPlannerSupervisedRuntime, type PlannerSupervisedRuntime, type PlannerSupervisedRuntimeOptions } from "./v1-38-planner-supervised-runtime.js"

const fail = (code: string): never => { throw new TypeError(`FACTORY_RUNTIME_${code}`) }
const rawRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const same = (left: unknown, right: unknown) => labRoot("factory-runtime-binding-v1", left) === labRoot("factory-runtime-binding-v1", right)

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
export const admitFactorySupervisorLifetime = (options: Pick<FactorySupervisedRuntimeOptions, "factoryLifetimeMs" | "pilotLifetimeGrant" | "oneCellLifetimeGrant" | "retryV4LifetimeGrant" | "budgetRoot" | "attemptRoot" | "containerName" | "ownershipLabel">): number => {
  const factoryLifetimeMs = options.factoryLifetimeMs ?? 120_000
  if (options.pilotLifetimeGrant && options.oneCellLifetimeGrant) return fail("LIFETIME_GRANT_CONFLICT")
  if (options.retryV4LifetimeGrant && (options.pilotLifetimeGrant || options.oneCellLifetimeGrant)) return fail("LIFETIME_GRANT_CONFLICT")
  if (!Number.isSafeInteger(factoryLifetimeMs) || factoryLifetimeMs < 1 || factoryLifetimeMs > (options.pilotLifetimeGrant || options.oneCellLifetimeGrant || options.retryV4LifetimeGrant ? 240_000 : 120_000)) return fail("LIFETIME")
  if (options.retryV4LifetimeGrant !== undefined) {
    requireDiagnosticRetryV4LifetimeGrant(options.retryV4LifetimeGrant, { allocationRoot: options.budgetRoot, cellRoot: options.retryV4LifetimeGrant.cellRoot, startRoot: options.attemptRoot, seat: options.retryV4LifetimeGrant.seat, containerName: options.containerName, ownershipLabel: options.ownershipLabel, lifetimeMilliseconds: factoryLifetimeMs })
  }
  if (options.pilotLifetimeGrant !== undefined) {
    requireDiagnosticPilotLifetimeGrant(options.pilotLifetimeGrant, { allocationRoot: options.budgetRoot, cellRoot: options.pilotLifetimeGrant.cellRoot, startRoot: options.attemptRoot, seat: options.pilotLifetimeGrant.seat, containerName: options.containerName, ownershipLabel: options.ownershipLabel, lifetimeMilliseconds: factoryLifetimeMs })
  }
  if (options.oneCellLifetimeGrant !== undefined) {
    requireDiagnosticOneCellLifetimeGrant(options.oneCellLifetimeGrant, { allocationRoot: options.budgetRoot, cellRoot: options.oneCellLifetimeGrant.cellRoot, startRoot: options.attemptRoot, seat: options.oneCellLifetimeGrant.seat, containerName: options.containerName, ownershipLabel: options.ownershipLabel, lifetimeMilliseconds: factoryLifetimeMs })
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
  const factoryLifetimeMs = admitFactorySupervisorLifetime(options)
  const began = performance.now()
  const { admission: _admission, sourceBytes: _sourceBytes, createRuntime: _createRuntime, factoryLifetimeMs: _factoryLifetimeMs, ...runtimeOptions } = options
  const selected = createRuntime({ ...runtimeOptions, ...(options.pilotLifetimeGrant === undefined ? {} : { pilotLifetimeMs: factoryLifetimeMs }), ...(options.oneCellLifetimeGrant === undefined ? {} : { oneCellLifetimeMs: factoryLifetimeMs }), ...(options.retryV4LifetimeGrant === undefined ? {} : { retryV4LifetimeMs: factoryLifetimeMs }), revision, image: options.image ?? LAB_ADMITTED_ROOTS.image })
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
