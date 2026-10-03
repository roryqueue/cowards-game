import { exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { admitProspectiveLeagueExecutionAllocationV3, type ProspectiveLeagueExecutionAllocationV3 } from "../../packages/strategy-lab/src/league/allocation.js"
import { createLeagueRepository } from "../../packages/strategy-lab/src/league/repository.js"
import { factoryAssessmentImplementationManifest } from "../v1-38-factory-implementation.js"
import { readTacticalLeagueRecord } from "./v1-38-league-tactical-corpus.js"
import { validateProspectiveLeagueProviderCharge, type ProspectiveLeagueLifetimeProviderBinding, type ProspectiveLeagueRetainedCharge } from "./v1-38-league-prospective-lifetime.js"

/** Private, process-local provider capability, never a serialized timeout knob. */
export interface ProspectiveLeagueHostReceiptAuthority {
  readonly schemaVersion: "league-prospective-host-receipt-authority-v3"
  readonly runtime: ProspectiveLeagueLifetimeProviderBinding["runtime"]
  readonly seat: "bottom" | "top"
  toJSON(): never
}
type Layer = "factory" | "planner" | "session"
type Issued = { binding: ProspectiveLeagueLifetimeProviderBinding; allocationRoot: LabRoot; amendmentRoot: LabRoot; policyRoot: LabRoot; implementationRoot: LabRoot; sourceRoot: LabRoot; retainedStartRoot: LabRoot; fixture: boolean; claimed: Set<Layer> }
const issued = new WeakMap<object, Issued>(), providers = new Set<string>()
const fail = (code: string): never => { throw new TypeError(`LEAGUE_HOST_RECEIPT_${code}`) }
const same = (a: unknown, b: unknown) => labRoot("league-host-receipt-binding-v3", a) === labRoot("league-host-receipt-binding-v3", b)
const assertCurrentSource = (implementationRoot: LabRoot, sourceRoot: LabRoot) => {
  const manifest = factoryAssessmentImplementationManifest()
  if (manifest.root !== implementationRoot || labRoot("league-reviewed-source-bytes-v1", manifest.entries) !== sourceRoot) return fail("STALE_SOURCE")
}

/** Reopens the immutable retained record, not a caller's durability assertion.
 * Main/response closures call this only after their existing durable charge. */
export const issueProspectiveLeagueHostReceiptAuthority = (allocationValue: ProspectiveLeagueExecutionAllocationV3, charge: ProspectiveLeagueRetainedCharge, binding: ProspectiveLeagueLifetimeProviderBinding): ProspectiveLeagueHostReceiptAuthority => {
  const allocation = admitProspectiveLeagueExecutionAllocationV3(allocationValue)
  if (allocation.evidenceClass === "empirical") assertCurrentSource(allocation.implementationRoot, allocation.amendment.sourceRoot)
  validateProspectiveLeagueProviderCharge(allocation, charge, binding)
  const repository = createLeagueRepository(allocation.outputDirectories.league)
  const retained = readTacticalLeagueRecord(repository, charge.root, allocation.operations)
  if (retained.kind !== charge.kind || !same(charge.kind === "cell-start" ? retained.value.start : retained.value, charge.value)) return fail("RETAINED_START")
  if (charge.kind === "response-match-start") {
    if (!charge.parentStartArtifactRoot) return fail("RETAINED_PARENT")
    const parent = readTacticalLeagueRecord(repository, charge.parentStartArtifactRoot, allocation.operations)
    if (parent.kind !== "response-production-start" || parent.value.start.root !== charge.value.parentStartRoot || parent.value.start.budgetRoot !== allocation.root || parent.value.redTeamStart.root !== charge.measuredAttemptRoot || parent.value.start.resourceAccountingRoot !== charge.measuredAttemptRoot) return fail("RETAINED_PARENT")
  }
  const key = `${allocation.root}:${charge.root}:${binding.seat}`
  if (providers.has(key)) return fail("PROVIDER_REUSED")
  const authority: ProspectiveLeagueHostReceiptAuthority = Object.freeze({ schemaVersion: "league-prospective-host-receipt-authority-v3", runtime: freezeLabValue(structuredClone(binding.runtime)), seat: binding.seat, toJSON() { return fail("NOT_SERIALIZABLE") } })
  issued.set(authority, { binding: freezeLabValue(structuredClone(binding)), allocationRoot: allocation.root, amendmentRoot: allocation.amendment.root, policyRoot: labRoot("league-prospective-host-receipt-policy-v3", allocation.amendment.policy), implementationRoot: allocation.implementationRoot, sourceRoot: allocation.amendment.sourceRoot, retainedStartRoot: charge.root, fixture: allocation.evidenceClass === "injected_fixture", claimed: new Set() })
  providers.add(key)
  return authority
}
export const isProspectiveLeagueHostReceiptFixture = (authority: ProspectiveLeagueHostReceiptAuthority): boolean => issued.get(authority)?.fixture === true
/** Each layer verifies the whole provider binding, once and in strict order. */
export const claimProspectiveLeagueHostReceiptAuthority = (authority: ProspectiveLeagueHostReceiptAuthority, binding: Omit<ProspectiveLeagueLifetimeProviderBinding, "seat"> & { readonly seat?: "bottom" | "top" }, layer: Layer): 5000 => {
  const state = authority && issued.get(authority)
  if (!state || !["factory", "planner", "session"].includes(layer) || authority.schemaVersion !== "league-prospective-host-receipt-authority-v3" || "seat" in binding && binding.seat !== authority.seat || !exactLabKeys(binding.runtime, Object.keys(state.binding.runtime)) || !same({ ...binding, seat: authority.seat }, state.binding)) return fail("CLAIM_BINDING")
  if (state.claimed.has(layer) || layer === "planner" && !state.claimed.has("factory") || layer === "session" && !state.claimed.has("planner")) return fail("CLAIM_REUSED")
  if (!state.fixture) assertCurrentSource(state.implementationRoot, state.sourceRoot)
  state.claimed.add(layer)
  return 5000
}
