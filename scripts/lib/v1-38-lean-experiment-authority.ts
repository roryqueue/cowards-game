/** New compact-route capability; never a legacy full-league receipt. */
import { labRoot, freezeLabValue, LAB_ADMITTED_ROOTS, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { readLeanLedger, type LeanExperimentLedger, type LeanCharge } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import type { ProspectiveLeagueLifetimeProviderBinding } from "./v1-38-league-prospective-lifetime.js"
import { prospectiveLeagueRuntimeBinding } from "./v1-38-league-prospective-lifetime.js"
import { readCandidateClosure, type FactoryCandidateClosure } from "../../packages/strategy-lab/src/league/connected-runner.js"
import { admitFactory, authorizeFactorySupervision } from "../../packages/strategy-lab/src/factory/admission.js"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"

export interface LeanRuntimeAuthority { readonly schemaVersion: "lean-runtime-authority-v1"; readonly runtime: ProspectiveLeagueLifetimeProviderBinding["runtime"]; readonly seat: "bottom" | "top"; toJSON(): never }
type Layer = "factory" | "planner" | "session"
const issued = new WeakMap<object, { binding: ProspectiveLeagueLifetimeProviderBinding; claims: Set<Layer> }>()
const used = new Set<string>()
const fail = (): never => { throw new TypeError("LEAN_RUNTIME_AUTHORITY") }
export const deriveLeanCandidateRuntime = (input: FactoryCandidateClosure) => {
  const closure = readCandidateClosure(input)
  const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: closure.packet, proposal: closure.proposal, sourceBytes: closure.sourceBytes }), validation: closure.validation })
  const defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: new TextDecoder("utf8", { fatal: true }).decode(closure.sourceBytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  if (!revision.validation.valid || !revision.metadata.sourceArtifact || revision.sourceHash !== admission.sourceRoot.slice(7)) return fail()
  const runtime = prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot: admission.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image })
  return { candidateRoot: closure.candidate.root, runtime }
}
export const issueLeanRuntimeAuthority = (ledger: LeanExperimentLedger, charge: LeanCharge, input: FactoryCandidateClosure, binding: ProspectiveLeagueLifetimeProviderBinding): LeanRuntimeAuthority => {
  const state = readLeanLedger(ledger)
  const retainedCharge = state.charges.get(charge.slotRoot)
  if (!retainedCharge || labRoot("lean-slot-charge", charge) !== labRoot("lean-slot-charge", retainedCharge)) return fail()
  const derived = deriveLeanCandidateRuntime(input), candidateRoot = derived.candidateRoot
  const slot = ledger.allocation.slots[retainedCharge.ordinal]
  const seatIndex = binding.seat === "bottom" ? 0 : 1
  const scheduled = slot && ledger.allocation.candidateRoots[slot.condition < 2 ? seatIndex : 1 - seatIndex]
  if (candidateRoot !== scheduled || labRoot("lean-candidate-runtime", binding.runtime) !== labRoot("lean-candidate-runtime", derived.runtime)) return fail()
  if (state.stopped || state.terminals.has(retainedCharge.root) || !ledger.allocation.candidateRoots.includes(candidateRoot) || binding.budgetRoot !== ledger.allocation.root || binding.attemptRoot !== retainedCharge.root || binding.matchId !== `lean-${retainedCharge.root.slice(7, 31)}` || binding.containerName !== `lean-${retainedCharge.root.slice(7, 25)}-${binding.seat}` || binding.ownershipLabel !== `lean-${ledger.allocation.root.slice(7, 25)}` || binding.runtime.tupleRoot !== LAB_ADMITTED_ROOTS.tupleRoot || binding.runtime.runtimeLimitsRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot || binding.runtime.image !== LAB_ADMITTED_ROOTS.image || !["bottom", "top"].includes(binding.seat)) return fail()
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
