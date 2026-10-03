/** New compact-route capability; never a legacy full-league receipt. */
import { labRoot, freezeLabValue, LAB_ADMITTED_ROOTS, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { readLeanLedger, type LeanExperimentLedger, type LeanCharge } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import type { ProspectiveLeagueLifetimeProviderBinding } from "./v1-38-league-prospective-lifetime.js"

export interface LeanRuntimeAuthority { readonly schemaVersion: "lean-runtime-authority-v1"; readonly runtime: ProspectiveLeagueLifetimeProviderBinding["runtime"]; readonly seat: "bottom" | "top"; toJSON(): never }
type Layer = "factory" | "planner" | "session"
const issued = new WeakMap<object, { binding: ProspectiveLeagueLifetimeProviderBinding; claims: Set<Layer> }>()
const used = new Set<string>()
const fail = (): never => { throw new TypeError("LEAN_RUNTIME_AUTHORITY") }
export const issueLeanRuntimeAuthority = (ledger: LeanExperimentLedger, charge: LeanCharge, candidateRoot: LabRoot, binding: ProspectiveLeagueLifetimeProviderBinding): LeanRuntimeAuthority => {
  const state = readLeanLedger(ledger)
  if (state.stopped || state.charges.get(charge.slotRoot)?.root !== charge.root || state.terminals.has(charge.root) || !ledger.allocation.candidateRoots.includes(candidateRoot) || binding.budgetRoot !== ledger.allocation.root || binding.attemptRoot !== charge.root || binding.matchId !== `lean-${charge.root.slice(7, 31)}` || binding.containerName !== `lean-${charge.root.slice(7, 25)}-${binding.seat}` || binding.ownershipLabel !== `lean-${ledger.allocation.root.slice(7, 25)}` || binding.runtime.tupleRoot !== LAB_ADMITTED_ROOTS.tupleRoot || binding.runtime.runtimeLimitsRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot || binding.runtime.image !== LAB_ADMITTED_ROOTS.image || !["bottom", "top"].includes(binding.seat)) return fail()
  const key = `${ledger.allocation.root}:${charge.root}:${binding.seat}`
  if (used.has(key)) return fail()
  const authority: LeanRuntimeAuthority = Object.freeze({ schemaVersion: "lean-runtime-authority-v1", runtime: freezeLabValue(structuredClone(binding.runtime)), seat: binding.seat, toJSON: fail })
  issued.set(authority, { binding: freezeLabValue(structuredClone(binding)), claims: new Set() }); used.add(key); return authority
}
export const claimLeanRuntimeAuthority = (authority: LeanRuntimeAuthority, binding: Omit<ProspectiveLeagueLifetimeProviderBinding, "seat"> & { seat?: "bottom" | "top" }, layer: Layer): { lifetimeMs: 600000; receiptMs: 5000 } => {
  const state = authority && issued.get(authority)
  if (!state || authority.schemaVersion !== "lean-runtime-authority-v1" || !["factory", "planner", "session"].includes(layer) || state.claims.has(layer) || layer === "planner" && !state.claims.has("factory") || layer === "session" && !state.claims.has("planner") || labRoot("lean-runtime-binding-v1", { ...binding, seat: authority.seat }) !== labRoot("lean-runtime-binding-v1", state.binding)) return fail()
  state.claims.add(layer); return { lifetimeMs: 600000, receiptMs: 5000 }
}
