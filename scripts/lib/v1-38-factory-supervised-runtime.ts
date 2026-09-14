import { createHash } from "node:crypto"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { LAB_ADMITTED_ROOTS, freezeLabValue, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import type { FactoryAdmission, FactorySupervisionProvider } from "../../packages/strategy-lab/src/factory/admission.js"
import type { LabRuntimeEvidence } from "../../packages/strategy-lab/src/runtime-bridge.js"
import { createPlannerSupervisedRuntime, type PlannerSupervisedRuntime, type PlannerSupervisedRuntimeOptions } from "./v1-38-planner-supervised-runtime.js"

const fail = (code: string): never => { throw new TypeError(`FACTORY_RUNTIME_${code}`) }
const rawRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const same = (left: unknown, right: unknown) => labRoot("factory-runtime-binding-v1", left) === labRoot("factory-runtime-binding-v1", right)

export interface FactorySupervisedRuntimeOptions extends Omit<PlannerSupervisedRuntimeOptions, "revision" | "image"> {
  readonly admission: FactoryAdmission
  readonly sourceBytes: Uint8Array
  readonly image?: string
  /** Factory allocation lifetime. Kept separate from the Phase 263 benchmark-only option. */
  readonly factoryLifetimeMs?: number
  readonly createRuntime?: (options: PlannerSupervisedRuntimeOptions) => PlannerSupervisedRuntime
}

/**
 * Turns admitted authored TypeScript bytes into the one selected container
 * revision. The packet provider id remains producer provenance and is never
 * confused with the runtime adapter id.
 */
export const createFactorySupervisedRuntime = (options: FactorySupervisedRuntimeOptions): FactorySupervisionProvider => {
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
  const factoryLifetimeMs = options.factoryLifetimeMs ?? 120_000
  if (!Number.isSafeInteger(factoryLifetimeMs) || factoryLifetimeMs < 1 || factoryLifetimeMs > 120_000) return fail("LIFETIME")
  const began = performance.now()
  const { admission: _admission, sourceBytes: _sourceBytes, createRuntime: _createRuntime, factoryLifetimeMs: _factoryLifetimeMs, ...runtimeOptions } = options
  const selected = createRuntime({ ...runtimeOptions, revision, image: options.image ?? LAB_ADMITTED_ROOTS.image })
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
