import { exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAN_CAPS, leanBytesRoot, LEAN_POST_V13_FIVE_PAIR_V14_REPORT_PATHS, LEAN_POST_V13_FIVE_PAIR_V14_EXTENSION as binding, isLeanPostV13FivePairMode, leanCorrectionRoutePaths, type LeanCorrectionPredecessor, type LeanPostV13FivePairMode } from "../../packages/strategy-lab/src/league/lean-experiment.js"

/** Pure prospective contracts, NOT a filesystem admission or accepted reader.
 * ROOT must bind authentic raw historical custody separately; no pins invented here. */
export const LEAN_FIVE_PAIR_V14_HISTORICAL_CARRY_ROOT: LabRoot = "sha256:b80d8ad678f6d2ee81c999905d46256c482a8665e9c9f6aa10b9f125ef726169"
/** Raw pins independently observed by ROOT. These three finite metadata files
 * are historical accounting only, never accepted-check or old reader authority. */
export const LEAN_FIVE_PAIR_V14_HISTORY_PINS = Object.freeze([
  { path: ".strategy-lab/lean-correction-supervisor-baseline-20261008-v13-1-tmp/terminal-verification-v13.json", bytesRoot: "sha256:08c0738c01cb634572675a4a8f639acfa44bd7bda3d26242cee08d85f0a6f5a3", root: "sha256:ac0c2cf0734fdfd5f2405912a64603abb746cd45fd79ac084074e55de97272b6" },
  { path: ".strategy-lab/lean-correction-supervisor-baseline-20261008-v13-1-tmp/terminal-carry-v13.json", bytesRoot: "sha256:fc01e8d7e4a19de3574e91f3f4114879918e52c1e0c037ead8ca113c10d405eb", root: LEAN_FIVE_PAIR_V14_HISTORICAL_CARRY_ROOT },
  { path: ".strategy-lab/lean-correction-supervisor-baseline-20261008-v13-1-tmp/terminal-hold-complete-v13.json", bytesRoot: "sha256:a3c5f5e88297319b972425a60e09770b6702bedbbeef1cb7609b8a2b0aacbf14", root: "sha256:d9c0628b0e3a74fc9f3f621dae78ec1f43da6e161c5567198172b88f55d9d5bb" },
] as const)
export const validateLeanPostV13HistoryV14 = (bytes: ReadonlyMap<string, Uint8Array>) => {
  if (bytes.size !== 3) return fail()
  const records = LEAN_FIVE_PAIR_V14_HISTORY_PINS.map(pin => {
    const raw = bytes.get(pin.path)
    if (!raw || leanBytesRoot(raw) !== pin.bytesRoot) return fail()
    const value = JSON.parse(new TextDecoder().decode(raw)) as Record<string, unknown>, { root: claimed, ...body } = value
    if (claimed !== pin.root || typeof value.schemaVersion !== "string" || claimed !== labRoot(value.schemaVersion, body)) return fail()
    return value
  })
  const [verification, carry, hold] = records as [Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]
  const head = "5b01e62eec1554f68dce6f80dd24d41646dc50d8", source = "sha256:e7d8bf583b09828a34f5cd79d81cb0220242b093dd26e6026b30705347d5b442", allocation = "sha256:5edd320e53cba57dcbf38f0a4fa170e5f5be5527f932735264c2121ec9a9cd81"
  if (verification.accepted !== false || verification.authorizing !== false || verification.finalReaderClose !== false || verification.resultAbsent !== true || verification.checkAbsent !== true || verification.route !== "baseline" || verification.currentCharges !== 0 || verification.cumulativeCharged !== 35 || verification.entryHead !== head || verification.sourceRoot !== source || verification.allocationRoot !== allocation || verification.closedAtMs !== 1791496635485 || verification.cumulativeElapsedMs !== 148694388 || carry.outcome !== "entered_without_result" || carry.accepted !== false || carry.authorizing !== false || carry.route !== "baseline" || carry.currentCharges !== 0 || carry.cumulativeCharged !== 35 || carry.entryHead !== head || carry.sourceRoot !== source || carry.allocationRoot !== allocation || carry.resultBytesRoot !== null || carry.closedAtMs !== verification.closedAtMs || carry.cumulativeElapsedMs !== verification.cumulativeElapsedMs || carry.allocatedDiskBytes !== 22777856 || carry.verificationRoot !== verification.root || carry.verificationBytesRoot !== LEAN_FIVE_PAIR_V14_HISTORY_PINS[0].bytesRoot || carry.closureRoot !== verification.root || hold.head !== head || hold.sourceRoot !== source || hold.mode !== "v13-1" || hold.route !== "baseline" || hold.carryRoot !== carry.root || hold.carryBytesRoot !== LEAN_FIVE_PAIR_V14_HISTORY_PINS[1].bytesRoot || hold.verificationRoot !== verification.root || hold.verificationBytesRoot !== carry.verificationBytesRoot || hold.requestBytesRoot !== carry.requestBytesRoot || hold.entryBytesRoot !== carry.entryBytesRoot) return fail()
  const survivors = carry.survivors as LeanCorrectionPredecessor["survivors"]
  if (!Array.isArray(survivors) || survivors.length !== 774 || new Set(survivors.map(row => row.identity)).size !== survivors.length || survivors.some(row => !exactLabKeys(row, ["identity", "allocatedBytes"]) || typeof row.identity !== "string" || row.identity.startsWith("/") || row.identity.split("/").includes("..") || !natural(row.allocatedBytes)) || survivors.reduce((sum, row) => sum + row.allocatedBytes, 0) > 22777856) return fail()
  const historyRoot = labRoot("lean-post-v13-finite-history-v14", LEAN_FIVE_PAIR_V14_HISTORY_PINS)
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 35, elapsedUpperBoundMs: 148694388, allocatedDiskBytes: 22777856, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot, survivors }
  return freezeLabValue({ root: historyRoot, cumulativeCharged: 35, carryRoot: LEAN_FIVE_PAIR_V14_HISTORICAL_CARRY_ROOT, holdRoot: LEAN_FIVE_PAIR_V14_HISTORY_PINS[2].root, identities: LEAN_FIVE_PAIR_V14_HISTORY_PINS.map(pin => pin.path), predecessor: { ...body, root: labRoot(body.schemaVersion, body) } })
}
const phase = ".planning/phases/265-serious-current-rules-league-and-development-red-team/"
export const LEAN_FIVE_PAIR_V14_REPORT_PATHS = LEAN_POST_V13_FIVE_PAIR_V14_REPORT_PATHS
export const leanFivePairDocumentsV14 = (route: "diagnostic" | "baseline", mode: LeanPostV13FivePairMode) => {
  if (!isLeanPostV13FivePairMode(mode) || route !== "diagnostic" && route !== "baseline") return fail()
  const paths = leanCorrectionRoutePaths(route, mode), label = `${route.toUpperCase()}-${mode.toUpperCase()}`
  return Object.freeze({ review: `${phase}265-16-POST-V13-FIVE-PAIR-SOURCE-REVIEW-v1.md`, dataReview: `${phase}265-16-POST-V13-FIVE-PAIR-${label}-DATA-REVIEW-v1.md`, helperReview: `${phase}265-16-POST-V13-FIVE-PAIR-${label}-HELPER-REVIEW-v1.md`, helper: `.strategy-lab/lean-five-pair-${route}-${mode}-helper.mts`, authorization: `.strategy-lab/lean-five-pair-authorization-${route}-${mode}.json`, setup: `.strategy-lab/lean-five-pair-setup-${mode}.json`, continuation: `.strategy-lab/lean-five-pair-continuation-${mode}.json`, pairClosure: `.strategy-lab/lean-five-pair-closure-${mode}.json`, carry: `${paths.temp}/terminal-carry-v14.json`, hold: `${paths.temp}/terminal-hold-complete-v14.json` })
}
const fail = (): never => { throw new TypeError("LEAN_FIVE_PAIR_V14_CUSTODY") }
const root = (value: unknown): value is LabRoot => typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value)
const natural = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0
type Route = "diagnostic" | "baseline"
type Outcome = "refused_before_entry" | "entered_without_result" | "failed_result" | "accepted_complete"
export interface LeanFivePairCloseV14 {
  ordinal: number; route: Route; outcome: Outcome; allocationRoot: LabRoot | null; entryHead: string | null; resultRoot: LabRoot | null
  acceptedCheckRoot: LabRoot | null; finalRoot: LabRoot | null; verificationRoot: LabRoot; holdRoot: LabRoot; closureRoot: LabRoot
  cumulativeCharged: number; cumulativeElapsedMs: number; allocatedDiskBytes: number; observedMs: number
}
export interface LeanFivePairStateV14 {
  schemaVersion: "lean-five-pair-state-v14"; policyRoot: LabRoot; historicalCarryRoot: LabRoot; historicalHoldRoot: LabRoot; historicalCustodyRoot: LabRoot
  spentPairs: number; nextRoute: Route | null; reservationRoots: readonly LabRoot[]; distinctionRoots: readonly LabRoot[]; closures: readonly LeanFivePairCloseV14[]
  cumulativeCharged: number; cumulativeElapsedMs: number; allocatedDiskBytes: number; observedMs: number
  ended: boolean; endReason: "accepted_complete_baseline" | "five_spent_pairs" | "budget_exhausted" | null; root: LabRoot
}
const elapsedFloor = (observedMs: number) => binding.priorElapsedMs + observedMs - binding.startedAtMs
const resourceValid = (charged: number, elapsed: number, debit: number, observed: number) => natural(charged) && charged >= 35 && charged <= 220 && natural(observed) && observed >= 1791496635485 && natural(elapsed) && elapsed >= 148694388 && elapsed >= elapsedFloor(observed) && natural(debit) && debit >= binding.physicalFloorBytes && debit <= LEAN_CAPS.retainedBytes
const exhausted = (state: Pick<LeanFivePairStateV14, "cumulativeElapsedMs" | "observedMs">) => state.cumulativeElapsedMs + binding.reserveMs >= binding.elapsedMs || state.observedMs + binding.reserveMs >= binding.absoluteDeadlineMs
const seal = (body: Omit<LeanFivePairStateV14, "root">): Readonly<LeanFivePairStateV14> => freezeLabValue({ ...body, root: labRoot(body.schemaVersion, body) })
const stateKeys = ["schemaVersion", "policyRoot", "historicalCarryRoot", "historicalHoldRoot", "historicalCustodyRoot", "spentPairs", "nextRoute", "reservationRoots", "distinctionRoots", "closures", "cumulativeCharged", "cumulativeElapsedMs", "allocatedDiskBytes", "observedMs", "ended", "endReason", "root"]
export const validateLeanFivePairStateV14 = (state: LeanFivePairStateV14): void => {
  if (!exactLabKeys(state, stateKeys)) return fail()
  const { root: claimed, ...body } = state
  if (state.schemaVersion !== "lean-five-pair-state-v14" || state.policyRoot !== binding.root || claimed !== labRoot(state.schemaVersion, body) || state.historicalCarryRoot !== LEAN_FIVE_PAIR_V14_HISTORICAL_CARRY_ROOT || !root(state.historicalHoldRoot) || !root(state.historicalCustodyRoot) || !natural(state.spentPairs) || state.spentPairs > 5 || !Array.isArray(state.reservationRoots) || state.reservationRoots.length !== state.spentPairs || state.reservationRoots.some(value => !root(value)) || new Set(state.reservationRoots).size !== state.spentPairs || !Array.isArray(state.distinctionRoots) || state.distinctionRoots.length !== state.spentPairs || state.distinctionRoots.some(value => !root(value)) || new Set(state.distinctionRoots).size !== state.spentPairs || !Array.isArray(state.closures) || state.closures.length > 10 || !resourceValid(state.cumulativeCharged, state.cumulativeElapsedMs, state.allocatedDiskBytes, state.observedMs) || typeof state.ended !== "boolean" || ![null, "diagnostic", "baseline"].includes(state.nextRoute) || ![null, "accepted_complete_baseline", "five_spent_pairs", "budget_exhausted"].includes(state.endReason) || state.ended !== (state.endReason !== null) || state.ended && state.nextRoute !== null) return fail()
  // Reconstruct all route order/cost/nullable joins, not just a caller's root.
  let ordinal = 1, route: Route = "diagnostic", charges = 35, elapsed = 148694388, debit = binding.physicalFloorBytes, observed = 1791496635485, acceptedBaseline = false
  const roots = new Set<LabRoot>()
  for (const closure of state.closures) {
    validateClosure(closure)
    if (acceptedBaseline || closure.ordinal !== ordinal || closure.route !== route || roots.has(closure.closureRoot) || closure.cumulativeCharged < charges || closure.outcome === "refused_before_entry" && closure.cumulativeCharged !== charges || closure.cumulativeCharged - charges > (route === "diagnostic" ? 1 : 36) || closure.outcome === "accepted_complete" && closure.cumulativeCharged - charges !== (route === "diagnostic" ? 1 : 36) || closure.cumulativeElapsedMs < elapsed || closure.allocatedDiskBytes < debit || closure.observedMs < observed) return fail()
    roots.add(closure.closureRoot); charges = closure.cumulativeCharged; elapsed = closure.cumulativeElapsedMs; debit = closure.allocatedDiskBytes; observed = closure.observedMs
    if (route === "diagnostic" && closure.outcome === "accepted_complete") route = "baseline"
    else { acceptedBaseline = route === "baseline" && closure.outcome === "accepted_complete"; ordinal++; route = "diagnostic" }
  }
  if (charges > state.cumulativeCharged || elapsed > state.cumulativeElapsedMs || debit > state.allocatedDiskBytes || observed > state.observedMs || state.spentPairs < ordinal - 1 || state.spentPairs > ordinal || state.nextRoute !== null && (state.spentPairs !== ordinal || state.nextRoute !== route) || !state.ended && state.nextRoute === null && state.spentPairs !== ordinal - 1 || acceptedBaseline !== (state.endReason === "accepted_complete_baseline") || state.endReason === "five_spent_pairs" && (ordinal !== 6 || state.spentPairs !== 5) || state.endReason === "budget_exhausted" && !exhausted(state)) return fail()
}
const validateClosure = (value: LeanFivePairCloseV14): void => {
  if (!exactLabKeys(value, ["ordinal", "route", "outcome", "allocationRoot", "entryHead", "resultRoot", "acceptedCheckRoot", "finalRoot", "verificationRoot", "holdRoot", "closureRoot", "cumulativeCharged", "cumulativeElapsedMs", "allocatedDiskBytes", "observedMs"]) || !natural(value.ordinal) || value.ordinal < 1 || value.ordinal > 5 || !["diagnostic", "baseline"].includes(value.route) || !["refused_before_entry", "entered_without_result", "failed_result", "accepted_complete"].includes(value.outcome) || !root(value.verificationRoot) || !root(value.holdRoot) || !root(value.closureRoot) || !resourceValid(value.cumulativeCharged, value.cumulativeElapsedMs, value.allocatedDiskBytes, value.observedMs)) return fail()
  if (value.outcome === "refused_before_entry" ? value.entryHead !== null : typeof value.entryHead !== "string" || !/^[a-f0-9]{40}$/u.test(value.entryHead)) return fail()
  if (value.allocationRoot !== null && !root(value.allocationRoot) || value.outcome !== "refused_before_entry" && !root(value.allocationRoot)) return fail()
  if (["refused_before_entry", "entered_without_result"].includes(value.outcome) ? value.resultRoot !== null : !root(value.resultRoot)) return fail()
  if (value.outcome === "accepted_complete" ? !root(value.acceptedCheckRoot) || !root(value.finalRoot) : value.acceptedCheckRoot !== null || value.finalRoot !== null) return fail()
}
export const createLeanFivePairStateV14 = (input: Pick<LeanFivePairStateV14, "historicalCarryRoot" | "historicalHoldRoot" | "historicalCustodyRoot" | "cumulativeCharged" | "cumulativeElapsedMs" | "allocatedDiskBytes" | "observedMs">): Readonly<LeanFivePairStateV14> => {
  if (!exactLabKeys(input, ["historicalCarryRoot", "historicalHoldRoot", "historicalCustodyRoot", "cumulativeCharged", "cumulativeElapsedMs", "allocatedDiskBytes", "observedMs"]) || input.cumulativeCharged !== 35) return fail()
  const ended = exhausted(input), state = seal({ ...input, schemaVersion: "lean-five-pair-state-v14", policyRoot: binding.root, spentPairs: 0, nextRoute: null, reservationRoots: [], distinctionRoots: [], closures: [], ended, endReason: ended ? "budget_exhausted" : null })
  validateLeanFivePairStateV14(state); return state
}
export const reserveLeanFivePairV14 = (state: LeanFivePairStateV14, input: { ordinal: number; reservationRoot: LabRoot; distinction: { kind: "reviewed_actionable_repair" | "prospective_diagnostic_distinction"; evidenceRoot: LabRoot; reviewRoot: LabRoot }; observedMs: number }): Readonly<LeanFivePairStateV14> => {
  validateLeanFivePairStateV14(state)
  if (!exactLabKeys(input, ["ordinal", "reservationRoot", "distinction", "observedMs"]) || state.ended || state.nextRoute !== null || input.ordinal !== state.spentPairs + 1 || input.ordinal > 5 || !root(input.reservationRoot) || state.reservationRoots.includes(input.reservationRoot) || !exactLabKeys(input.distinction, ["kind", "evidenceRoot", "reviewRoot"]) || !["reviewed_actionable_repair", "prospective_diagnostic_distinction"].includes(input.distinction.kind) || !root(input.distinction.evidenceRoot) || !root(input.distinction.reviewRoot) || input.observedMs < state.observedMs) return fail()
  const cumulativeElapsedMs = Math.max(state.cumulativeElapsedMs, elapsedFloor(input.observedMs)), distinctionRoot = labRoot("lean-five-pair-distinction-v14", input.distinction)
  if (state.distinctionRoots.includes(distinctionRoot) || exhausted({ observedMs: input.observedMs, cumulativeElapsedMs }) || cumulativeElapsedMs + binding.reserveMs + LEAN_CAPS.matchMs >= binding.elapsedMs) return fail()
  const { root: _root, ...body } = state
  const next = seal({ ...body, spentPairs: input.ordinal, nextRoute: "diagnostic", reservationRoots: [...state.reservationRoots, input.reservationRoot], distinctionRoots: [...state.distinctionRoots, distinctionRoot], observedMs: input.observedMs, cumulativeElapsedMs })
  validateLeanFivePairStateV14(next); return next
}
export const closeLeanFivePairRouteV14 = (state: LeanFivePairStateV14, closure: LeanFivePairCloseV14): Readonly<LeanFivePairStateV14> => {
  validateLeanFivePairStateV14(state); validateClosure(closure)
  if (state.ended || state.nextRoute !== closure.route || state.spentPairs !== closure.ordinal || closure.cumulativeCharged < state.cumulativeCharged || closure.cumulativeElapsedMs < state.cumulativeElapsedMs || closure.allocatedDiskBytes < state.allocatedDiskBytes || closure.observedMs < state.observedMs) return fail()
  const complete = closure.route === "baseline" && closure.outcome === "accepted_complete", pairClosed = closure.route === "baseline" || closure.outcome !== "accepted_complete"
  const endReason = complete ? "accepted_complete_baseline" : exhausted(closure) ? "budget_exhausted" : pairClosed && state.spentPairs === 5 ? "five_spent_pairs" : null
  const { root: _root, ...body } = state
  const next = seal({ ...body, closures: [...state.closures, closure], cumulativeCharged: closure.cumulativeCharged, cumulativeElapsedMs: closure.cumulativeElapsedMs, allocatedDiskBytes: closure.allocatedDiskBytes, observedMs: closure.observedMs, nextRoute: endReason || pairClosed ? null : "baseline", ended: endReason !== null, endReason })
  validateLeanFivePairStateV14(next); return next
}
