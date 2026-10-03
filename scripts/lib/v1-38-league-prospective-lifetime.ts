import { LAB_ADMITTED_ROOTS, exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { admitProspectiveLeagueExecutionAllocationV2, admitProspectiveLeagueExecutionAllocationV3, type ProspectiveLeagueExecutionAllocationV2, type ProspectiveLeagueExecutionAllocationV3 } from "../../packages/strategy-lab/src/league/allocation.js"
import type { FactoryAdmission } from "../../packages/strategy-lab/src/factory/admission.js"
import type { LabRuntimeIdentity } from "../../packages/strategy-lab/src/runtime-bridge.js"

export type ProspectiveLeagueRuntimeBinding = Pick<LabRuntimeIdentity, "revisionId" | "sourceRoot" | "executableRoot" | "tupleId" | "tupleRoot" | "runtimeLimitsRoot" | "image"> & Readonly<{ factoryAuthorizationRoot: LabRoot; factoryPacketRoot: LabRoot; factoryProposalRoot: LabRoot; factoryValidationRoot: LabRoot }>
export interface ProspectiveLeagueLifetimeProviderBinding {
  readonly budgetRoot: LabRoot; readonly attemptRoot: LabRoot; readonly matchId: string
  readonly seat: "bottom" | "top"; readonly containerName: string; readonly ownershipLabel: string
  readonly runtime: ProspectiveLeagueRuntimeBinding
}
export interface ProspectiveLeagueRetainedCharge {
  readonly kind: "cell-start" | "response-match-start"; readonly root: LabRoot; readonly value: Readonly<Record<string, unknown>>
  readonly measuredAttemptRoot?: LabRoot
  readonly parentStartArtifactRoot?: LabRoot
}
export interface ProspectiveLeagueLifetimeAuthority {
  readonly schemaVersion: "league-prospective-lifetime-authority-v2"
  readonly runtime: ProspectiveLeagueRuntimeBinding
  readonly seat: "bottom" | "top"
  toJSON(): never
}
type Issued = { binding: ProspectiveLeagueLifetimeProviderBinding; allocationRoot: LabRoot; amendmentRoot: LabRoot; implementationRoot: LabRoot; sourceRoot: LabRoot; retainedStartRoot: LabRoot; factory: boolean; planner: boolean; fixture: boolean }
const issued = new WeakMap<object, Issued>(), providers = new Set<string>()
const root = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v)
const fail = (code: string): never => { throw new TypeError(`LEAGUE_PROSPECTIVE_LIFETIME_${code}`) }
const same = (a: unknown, b: unknown) => labRoot("league-prospective-lifetime-binding-v2", a) === labRoot("league-prospective-lifetime-binding-v2", b)
/** Called only by the existing private host closure AFTER durable Match charge.
 * Nothing is serialized or independently signed; copying the handle is forgery. */
export const validateProspectiveLeagueProviderCharge = (allocationValue: ProspectiveLeagueExecutionAllocationV2 | ProspectiveLeagueExecutionAllocationV3, charge: ProspectiveLeagueRetainedCharge, binding: ProspectiveLeagueLifetimeProviderBinding) => {
  const allocation = allocationValue.schemaVersion === "league-prospective-execution-allocation-v3" ? admitProspectiveLeagueExecutionAllocationV3(allocationValue) : admitProspectiveLeagueExecutionAllocationV2(allocationValue)
  if (!root(charge.root) || binding.budgetRoot !== allocation.root || !root(binding.attemptRoot) || !["bottom", "top"].includes(binding.seat) || !binding.containerName || !binding.ownershipLabel || !exactLabKeys(binding.runtime, ["revisionId", "sourceRoot", "executableRoot", "tupleId", "tupleRoot", "runtimeLimitsRoot", "image", "factoryAuthorizationRoot", "factoryPacketRoot", "factoryProposalRoot", "factoryValidationRoot"]) || Object.entries(binding.runtime).some(([key, value]) => key.endsWith("Root") && !root(value)) || binding.runtime.tupleRoot !== allocation.tupleRoot || binding.runtime.runtimeLimitsRoot !== allocation.runtimeRoot || binding.runtime.image !== allocation.operations.image || !binding.runtime.revisionId || !binding.runtime.tupleId) return fail("ISSUE_BINDING")
  const value = charge.value
  if (charge.kind === "cell-start") {
    if (!exactLabKeys(value, ["cellRoot", "allocationRoot", "root"]) || !root(value.cellRoot) || value.allocationRoot !== allocation.root || value.root !== labRoot("league-cell-start-v1", { cellRoot: value.cellRoot, allocationRoot: value.allocationRoot }) || binding.attemptRoot !== value.root || binding.matchId !== `league-${String(value.root).slice(7, 31)}`) return fail("CHARGE_BINDING")
  } else if (charge.kind === "response-match-start") {
    if (!exactLabKeys(value, ["parentStartRoot", "ordinal", "seed", "opponentRoot", "arena", "side", "initial", "purpose", "referencePublicationRoot"]) || !root(value.parentStartRoot) || !Number.isSafeInteger(value.ordinal) || (value.ordinal as number) < 0 || !root(value.opponentRoot) || !["bottom", "top"].includes(String(value.side)) || !["candidate", "opponent"].includes(String(value.initial)) || !["score", "independence_left", "independence_right"].includes(String(value.purpose)) || value.referencePublicationRoot !== allocation.independenceReferencePublicationRoot || binding.matchId !== `league-response-${charge.root.slice(7, 31)}`) return fail("CHARGE_BINDING")
    // Measured provider retains the red-team attempt; opponent retains chargeRoot.
    const measuredSeat = value.side
    if (!root(charge.measuredAttemptRoot) || binding.attemptRoot !== (binding.seat === measuredSeat ? charge.measuredAttemptRoot : charge.root)) return fail("CHARGE_BINDING")
  } else return fail("CHARGE_BINDING")
  return allocation
}
export const issueProspectiveLeagueLifetimeAuthority = (allocationValue: ProspectiveLeagueExecutionAllocationV2 | ProspectiveLeagueExecutionAllocationV3, charge: ProspectiveLeagueRetainedCharge, binding: ProspectiveLeagueLifetimeProviderBinding): ProspectiveLeagueLifetimeAuthority => {
  const allocation = validateProspectiveLeagueProviderCharge(allocationValue, charge, binding)
  const key = `${allocation.root}:${charge.root}:${binding.seat}`
  if (providers.has(key)) return fail("PROVIDER_REUSED")
  const authority: ProspectiveLeagueLifetimeAuthority = Object.freeze({ schemaVersion: "league-prospective-lifetime-authority-v2", runtime: freezeLabValue(structuredClone(binding.runtime)), seat: binding.seat, toJSON() { return fail("NOT_SERIALIZABLE") } })
  issued.set(authority, { binding: freezeLabValue(structuredClone(binding)), allocationRoot: allocation.root, amendmentRoot: allocation.amendment.root, implementationRoot: allocation.implementationRoot, sourceRoot: allocation.amendment.sourceRoot, retainedStartRoot: charge.root, factory: false, planner: false, fixture: allocation.evidenceClass === "injected_fixture" })
  providers.add(key)
  return authority
}
export const prospectiveLeagueRuntimeBinding = (admission: FactoryAdmission, runtime: Pick<LabRuntimeIdentity, "revisionId" | "sourceRoot" | "executableRoot" | "tupleId" | "tupleRoot" | "runtimeLimitsRoot" | "image">): ProspectiveLeagueRuntimeBinding => ({ ...runtime, factoryAuthorizationRoot: admission.authorizationRoot, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot, sourceRoot: admission.sourceRoot, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot })
export const isProspectiveLeagueLifetimeFixture = (authority: ProspectiveLeagueLifetimeAuthority): boolean => issued.get(authority)?.fixture === true
export const claimProspectiveLeagueLifetimeAuthority = (authority: ProspectiveLeagueLifetimeAuthority, binding: Omit<ProspectiveLeagueLifetimeProviderBinding, "seat">, lifetime: number, layer: "factory" | "planner"): number => {
  const state = authority && issued.get(authority)
  if (!state || !["factory", "planner"].includes(layer) || authority.schemaVersion !== "league-prospective-lifetime-authority-v2" || lifetime !== 600000 || "seat" in binding && binding.seat !== authority.seat || !same({ ...binding, seat: authority.seat }, state.binding)) return fail("CLAIM_BINDING")
  if (state[layer] || layer === "planner" && !state.factory) return fail("CLAIM_REUSED")
  state[layer] = true
  return 600000
}
