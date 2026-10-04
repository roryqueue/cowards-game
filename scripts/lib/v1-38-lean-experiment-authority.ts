/** New compact-route capability; never a legacy full-league receipt. */
import { labRoot, freezeLabValue, LAB_ADMITTED_ROOTS, exactLabKeys, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { readLeanLedger, type LeanExperimentLedger, type LeanCharge } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import type { ProspectiveLeagueLifetimeProviderBinding } from "./v1-38-league-prospective-lifetime.js"
import { prospectiveLeagueRuntimeBinding } from "./v1-38-league-prospective-lifetime.js"
import { readCandidateClosure, type FactoryCandidateClosure } from "../../packages/strategy-lab/src/league/connected-runner.js"
import { admitFactory, authorizeFactorySupervision } from "../../packages/strategy-lab/src/factory/admission.js"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { readLeanBaselineSource, type LeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { constants, openSync, closeSync, readFileSync, lstatSync, realpathSync, fstatSync } from "node:fs"
import { resolve } from "node:path"
import { leanCanonicalBytes, leanBytesRoot } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { validateLeanColdReuse, type LeanColdReuse } from "./v1-38-lean-baseline-reuse.js"

export interface LeanRuntimeAuthority { readonly schemaVersion: "lean-runtime-authority-v1"; readonly runtime: ProspectiveLeagueLifetimeProviderBinding["runtime"]; readonly seat: "bottom" | "top"; toJSON(): never }
const correctionAuthorities = new WeakSet<object>()
export const isLeanCorrectionRuntimeAuthority = (value: unknown): value is LeanRuntimeAuthority => typeof value === "object" && value !== null && correctionAuthorities.has(value)
export interface LeanBaselinePair {
  readonly schemaVersion: "lean-baseline-pair-v1"; readonly ordinal: number; readonly slotRoot: LabRoot; readonly requestRoot: LabRoot
  readonly priorLedgerBytesRoot: LabRoot; readonly priorLedgerByteLength: number; readonly priorCharged: number
  readonly bottomRole: string; readonly bottomSourceRoot: LabRoot; readonly bottomSnapshotRoot: LabRoot
  readonly topRole: string; readonly topSourceRoot: LabRoot; readonly topSnapshotRoot: LabRoot; readonly root: LabRoot
}
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

/** Distinct current-baseline route. The old pilot issuer and its two-source
 * scheduling predicate are unchanged. A pair is retained before charge and
 * both independently validated immutable source snapshots are reopened here. */
export const issueLeanBaselineRuntimeAuthority = (ledger: LeanExperimentLedger, charge: LeanCharge, snapshot: LeanBaselineSource, binding: ProspectiveLeagueLifetimeProviderBinding): LeanRuntimeAuthority => issueBaselineAuthority(ledger, charge, snapshot, binding)
export const issueLeanCorrectionRuntimeAuthority = (ledger: LeanExperimentLedger, charge: LeanCharge, snapshot: LeanBaselineSource, binding: ProspectiveLeagueLifetimeProviderBinding, reuse: LeanColdReuse): LeanRuntimeAuthority => issueBaselineAuthority(ledger, charge, snapshot, binding, validateLeanColdReuse(reuse, ledger.allocation.sourceRoot))
const issueBaselineAuthority = (ledger: LeanExperimentLedger, charge: LeanCharge, snapshot: LeanBaselineSource, binding: ProspectiveLeagueLifetimeProviderBinding, reuse?: LeanColdReuse): LeanRuntimeAuthority => {
  const allocation = ledger.allocation as unknown as { schemaVersion: string; coldRoot?: LabRoot; sourceRoot: LabRoot; predecessor?: { chargedMatches: number } }
  if (reuse ? !["lean-correction-diagnostic-allocation-v1", "lean-correction-baseline-allocation-v1"].includes(allocation.schemaVersion) || !("reuseGrantRoot" in ledger.allocation) || ledger.allocation.reuseGrantRoot !== reuse.grant.root : allocation.schemaVersion !== "lean-current-baseline-allocation-v1") return fail()
  const state = readLeanLedger(ledger), retainedCharge = state.charges.get(charge.slotRoot)
  if (!retainedCharge || state.stopped || state.terminals.has(retainedCharge.root) || labRoot("lean-slot-charge", charge) !== labRoot("lean-slot-charge", retainedCharge)) return fail()
  const path = resolve(ledger.directory, `pair-${charge.ordinal}.json`), stat = lstatSync(path)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || (stat.mode & 0o777) !== 0o600 || stat.size > 16384 || realpathSync(path) !== path) return fail()
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  let pair: LeanBaselinePair
  try {
    const opened = fstatSync(fd)
    if (!opened.isFile() || opened.dev !== stat.dev || opened.ino !== stat.ino || opened.nlink !== 1 || opened.size !== stat.size || (opened.mode & 0o777) !== 0o600) return fail()
    const bytes = readFileSync(fd)
    if (bytes.length > 16384) return fail()
    pair = JSON.parse(Buffer.from(bytes).toString("utf8"))
    if (leanBytesRoot(bytes) !== leanBytesRoot(leanCanonicalBytes(pair))) return fail()
  } finally { closeSync(fd) }
  const slot = ledger.allocation.slots[retainedCharge.ordinal]
  if (!exactLabKeys(pair, ["schemaVersion", "ordinal", "slotRoot", "requestRoot", "priorLedgerBytesRoot", "priorLedgerByteLength", "priorCharged", "bottomRole", "bottomSourceRoot", "bottomSnapshotRoot", "topRole", "topSourceRoot", "topSnapshotRoot", "root"]) || pair.schemaVersion !== "lean-baseline-pair-v1" || pair.ordinal !== retainedCharge.ordinal || pair.slotRoot !== retainedCharge.slotRoot || pair.requestRoot !== slot?.requestRoot || pair.priorCharged !== (allocation.predecessor?.chargedMatches ?? -1) + retainedCharge.ordinal || !["bottom", "top"].includes(binding.seat)) return fail()
  const { root: pairRoot, ...pairBody } = pair
  if (pairRoot !== labRoot("lean-baseline-pair-v1", pairBody)) return fail()
  // Prefix commitment proves the pair was retained against an uncharged slot;
  // fresh capacity resource rows may occur between that prefix and its charge.
  const journalPath = resolve(ledger.directory, "ledger.ndjson"), journalStat = lstatSync(journalPath)
  if (!journalStat.isFile() || journalStat.isSymbolicLink() || journalStat.nlink !== 1 || (journalStat.mode & 0o777) !== 0o600 || journalStat.size > 4 * 1024 * 1024 || realpathSync(journalPath) !== journalPath || !Number.isSafeInteger(pair.priorLedgerByteLength) || pair.priorLedgerByteLength < 0 || pair.priorLedgerByteLength > journalStat.size) return fail()
  const journalFd = openSync(journalPath, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const opened = fstatSync(journalFd)
    if (!opened.isFile() || opened.dev !== journalStat.dev || opened.ino !== journalStat.ino || opened.nlink !== 1 || opened.size !== journalStat.size) return fail()
    const bytes = readFileSync(journalFd)
    const prefix = bytes.subarray(0, pair.priorLedgerByteLength), suffix = bytes.subarray(pair.priorLedgerByteLength)
    if (leanBytesRoot(prefix) !== pair.priorLedgerBytesRoot || (prefix.length && prefix[prefix.length - 1] !== 10)) return fail()
    const charges = (part: Uint8Array) => Buffer.from(part).toString("utf8").split("\n").filter(Boolean).map(line => JSON.parse(line) as { kind: string; charge?: LeanCharge }).filter(row => row.kind === "charge").map(row => row.charge)
    const before = charges(prefix), after = charges(suffix)
    if (before.length !== retainedCharge.ordinal || before.some(c => c?.root === retainedCharge.root) || after.length !== 1 || labRoot("lean-slot-charge", after[0]) !== labRoot("lean-slot-charge", retainedCharge)) return fail()
  } finally { closeSync(journalFd) }
  const expectedRole = binding.seat === "bottom" ? pair.bottomRole : pair.topRole
  const expectedRoot = binding.seat === "bottom" ? pair.bottomSourceRoot : pair.topSourceRoot
  const expectedSnapshot = binding.seat === "bottom" ? pair.bottomSnapshotRoot : pair.topSnapshotRoot
  const source = readLeanBaselineSource(ledger.directory, expectedRole)
  if (source.sourceRoot !== expectedRoot || source.root !== expectedSnapshot || source.root !== snapshot.root || source.coldRoot !== allocation.coldRoot || (source.implementationRoot !== allocation.sourceRoot && (!reuse || !reuse.sources.some(s => s.root === source.root && s.role === source.role)))) return fail()
  const sourceBytes = new TextEncoder().encode(source.source)
  const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: source.packet, proposal: source.proposal, sourceBytes }), validation: source.validation })
  const defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: source.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  if (!revision.validation.valid || !revision.metadata.sourceArtifact) return fail()
  const runtime = prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot: source.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image })
  if (labRoot("lean-candidate-runtime", binding.runtime) !== labRoot("lean-candidate-runtime", runtime) || binding.budgetRoot !== ledger.allocation.root || binding.attemptRoot !== retainedCharge.root || binding.matchId !== `lean-${retainedCharge.root.slice(7, 31)}` || binding.containerName !== `lean-${retainedCharge.root.slice(7, 25)}-${binding.seat}` || binding.ownershipLabel !== `lean-${ledger.allocation.root.slice(7, 25)}`) return fail()
  const key = `${ledger.allocation.root}:${charge.root}:${binding.seat}`
  if (used.has(key)) return fail()
  const authority: LeanRuntimeAuthority = Object.freeze({ schemaVersion: "lean-runtime-authority-v1", runtime: freezeLabValue(structuredClone(runtime)), seat: binding.seat, toJSON: fail })
  issued.set(authority, { binding: freezeLabValue(structuredClone(binding)), claims: new Set() }); used.add(key)
  if (reuse) correctionAuthorities.add(authority)
  return authority
}
