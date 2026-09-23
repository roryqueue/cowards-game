import type { Action, SoldierBrainInputV119 } from "@cowards/spec"
import { labRoot, type LabRoot } from "../../strategy-lab/src/contracts.js"
import { scoreTacticalAction, tacticalActionChoices } from "./scoring.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const LIMIT = 262_144
const kinds = ["MOVE", "TURN", "TURN_TO_STONE"] as const
type ActionKind = typeof kinds[number]
const fail = (code: string): never => { throw new TypeError(`TACTICAL_ADAPTATION_${code}`) }
const rooted = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value)
const exact = (value: unknown, keys: readonly string[]) => record(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key))

export interface TacticalAdaptationProfile { readonly schemaVersion: "tactical-adaptation-profile-v1"; readonly id: string; readonly p: -2 | -1 | 0 | 1 | 2; readonly q: -2 | -1 | 0 | 1 | 2; readonly postureWeights: Readonly<{ press: number; screen: number; recover: number }>; readonly actionWeights: Readonly<Record<ActionKind, number>>; readonly root: LabRoot }
export interface TacticalAdaptationObservation {
  readonly cellResultRoot: LabRoot; readonly matchRoot: LabRoot; readonly executionRoot: LabRoot; readonly roundRoot: LabRoot; readonly targetCandidateRoot: LabRoot
  readonly roles: readonly ("mixture" | "strongest_pure" | "vulnerable_pure")[]; readonly mixtureWeight: Readonly<{ numerator: string; denominator: string }> | null
  readonly selectAccountingOrdinal: number; readonly invocationRoot: LabRoot; readonly selectRequestRoot: LabRoot; readonly selectInputRoot: LabRoot; readonly selectedSoldierId: `soldier-${number}`
  readonly brainAccountingOrdinal: number; readonly soldierBrainRequestRoot: LabRoot; readonly soldierBrainInputRoot: LabRoot; readonly soldierBrainInvocationRoot: LabRoot; readonly soldierBrainOutputRoot: LabRoot; readonly targetAction: Action
}
export interface TacticalAdaptationCorpus { readonly schemaVersion: "tactical-adaptation-corpus-v1"; readonly privacy: "private_offline"; readonly roundRoot: LabRoot; readonly observations: readonly TacticalAdaptationObservation[]; readonly root?: LabRoot }
export type TacticalAdaptationCorpusDraft = Readonly<Pick<TacticalAdaptationCorpus, "roundRoot" | "observations">>
export interface TacticalAdaptationRow { readonly profileId: string; readonly soldierBrainInputRoot: LabRoot; readonly selectedAction: Action; readonly targetActionSummary: Readonly<Record<ActionKind, number>>; readonly nodeValue: readonly [number, number, number, number, string] }
export interface TacticalAdaptationSelection { readonly schemaVersion: "tactical-adaptation-selection-v1"; readonly corpusRoot: LabRoot; readonly gridRoot: LabRoot; readonly rows: readonly TacticalAdaptationRow[]; readonly profile: TacticalAdaptationProfile; readonly root: LabRoot }

const bounded = <T>(value: T): T => { if (new TextEncoder().encode(JSON.stringify(value)).byteLength > LIMIT) fail("SIZE"); return value }
const profile = (p: -2 | -1 | 0 | 1 | 2, q: -2 | -1 | 0 | 1 | 2): TacticalAdaptationProfile => { const value = { schemaVersion: "tactical-adaptation-profile-v1" as const, id: `${p}:${q}`, p, q, postureWeights: { press: p, screen: q, recover: -p - q }, actionWeights: { MOVE: q, TURN: -p, TURN_TO_STONE: p - q } }; return Object.freeze({ ...value, root: labRoot("tactical-adaptation-profile-v1", value) }) }
export const TACTICAL_ADAPTATION_PROFILES = Object.freeze(([-2, -1, 0, 1, 2] as const).flatMap((p) => ([-2, -1, 0, 1, 2] as const).map((q) => profile(p, q))))
/** Rejects forged or partially changed profile constants before they reach prospective emission. */
export const admitTacticalAdaptationProfile = (input: TacticalAdaptationProfile): TacticalAdaptationProfile => {
  if (!exact(input, ["schemaVersion", "id", "p", "q", "postureWeights", "actionWeights", "root"]) || ![-2, -1, 0, 1, 2].includes(input.p) || ![-2, -1, 0, 1, 2].includes(input.q)) fail("PROFILE")
  const expected = profile(input.p, input.q)
  if (input.root !== expected.root || input.schemaVersion !== expected.schemaVersion || input.id !== expected.id || !exact(input.postureWeights, ["press", "screen", "recover"]) || !exact(input.actionWeights, kinds) || input.postureWeights.press !== expected.postureWeights.press || input.postureWeights.screen !== expected.postureWeights.screen || input.postureWeights.recover !== expected.postureWeights.recover || input.actionWeights.MOVE !== expected.actionWeights.MOVE || input.actionWeights.TURN !== expected.actionWeights.TURN || input.actionWeights.TURN_TO_STONE !== expected.actionWeights.TURN_TO_STONE) fail("PROFILE")
  return expected
}
const validAction = (action: Action): boolean => record(action) && (action.type === "TURN_TO_STONE" ? exact(action, ["type"]) : (action.type === "MOVE" || action.type === "TURN") && exact(action, ["type", "direction"]) && ["UP", "RIGHT", "DOWN", "LEFT"].includes(String(action.direction)))
const valid = (entry: TacticalAdaptationObservation, roundRoot: LabRoot): void => {
  const roots = [entry.cellResultRoot, entry.matchRoot, entry.executionRoot, entry.roundRoot, entry.targetCandidateRoot, entry.invocationRoot, entry.selectRequestRoot, entry.selectInputRoot, entry.soldierBrainRequestRoot, entry.soldierBrainInputRoot, entry.soldierBrainInvocationRoot, entry.soldierBrainOutputRoot]
  if (!exact(entry, ["cellResultRoot", "matchRoot", "executionRoot", "roundRoot", "targetCandidateRoot", "roles", "mixtureWeight", "selectAccountingOrdinal", "invocationRoot", "selectRequestRoot", "selectInputRoot", "selectedSoldierId", "brainAccountingOrdinal", "soldierBrainRequestRoot", "soldierBrainInputRoot", "soldierBrainInvocationRoot", "soldierBrainOutputRoot", "targetAction"]) || !roots.every(rooted) || entry.roundRoot !== roundRoot || !Number.isSafeInteger(entry.selectAccountingOrdinal) || entry.selectAccountingOrdinal < 0 || !Number.isSafeInteger(entry.brainAccountingOrdinal) || entry.brainAccountingOrdinal < 0 || !/^soldier-[0-9]+$/u.test(entry.selectedSoldierId) || !validAction(entry.targetAction)) fail("OBSERVATION")
  const order = ["mixture", "strongest_pure", "vulnerable_pure"] as const
  if (!entry.roles.length || entry.roles.some((role, i) => order.indexOf(role) < 0 || order.indexOf(role) < (i ? order.indexOf(entry.roles[i - 1]!) : -1)) || new Set(entry.roles).size !== entry.roles.length || (entry.roles.includes("mixture") !== (entry.mixtureWeight !== null)) || (entry.mixtureWeight !== null && (!exact(entry.mixtureWeight, ["numerator", "denominator"]) || !/^[1-9][0-9]*$/u.test(entry.mixtureWeight.numerator) || !/^[1-9][0-9]*$/u.test(entry.mixtureWeight.denominator)))) fail("ROLES")
}
export const createTacticalAdaptationCorpus = (input: TacticalAdaptationCorpus | TacticalAdaptationCorpusDraft): Readonly<TacticalAdaptationCorpus & { root: LabRoot }> => {
  const normalized = { schemaVersion: "tactical-adaptation-corpus-v1" as const, privacy: "private_offline" as const, ...input }
  if (normalized.schemaVersion !== "tactical-adaptation-corpus-v1" || normalized.privacy !== "private_offline" || !rooted(normalized.roundRoot) || normalized.observations.length !== 4) fail("CORPUS")
  normalized.observations.forEach((entry) => valid(entry, normalized.roundRoot))
  if (new Set(normalized.observations.map((entry) => entry.cellResultRoot)).size !== 4) fail("CELL_DUPLICATE")
  const roles = new Set(normalized.observations.flatMap((entry) => entry.roles)); if (!roles.has("strongest_pure") || !roles.has("vulnerable_pure")) fail("NAMED_PURE")
  const suppliedRoot = "root" in normalized ? normalized.root : undefined
  const value = bounded({ schemaVersion: normalized.schemaVersion, privacy: normalized.privacy, roundRoot: normalized.roundRoot, observations: normalized.observations }), root = labRoot("tactical-adaptation-corpus-v1", value); if (suppliedRoot !== undefined && suppliedRoot !== root) fail("CORPUS_ROOT"); return Object.freeze({ ...value, root })
}
/** Strict parser for retained canonical corpus records. Ordering is rebuilt by authoring from named-pure reservation then mixture fill. */
export const admitTacticalAdaptationCorpus = (value: unknown): Readonly<TacticalAdaptationCorpus & { root: LabRoot }> => {
  if (!exact(value, ["schemaVersion", "privacy", "roundRoot", "observations", "root"]) || !rooted((value as Record<string, unknown>).root)) fail("CORPUS")
  return createTacticalAdaptationCorpus(value as TacticalAdaptationCorpus)
}
const targetSummary = (observations: readonly TacticalAdaptationObservation[]) => Object.freeze({ MOVE: observations.filter((entry) => entry.targetAction.type === "MOVE").length, TURN: observations.filter((entry) => entry.targetAction.type === "TURN").length, TURN_TO_STONE: observations.filter((entry) => entry.targetAction.type === "TURN_TO_STONE").length })
const counters = { MOVE: { MOVE: -1, TURN: 1, TURN_TO_STONE: 2 }, TURN: { MOVE: 1, TURN: 0, TURN_TO_STONE: -1 }, TURN_TO_STONE: { MOVE: 2, TURN: -1, TURN_TO_STONE: -2 } } as const
const choose = (input: SoldierBrainInputV119, p: TacticalAdaptationProfile) => tacticalActionChoices().map((action, ordinal) => { const base = scoreTacticalAction(input, action, null, ordinal); return { action, base, soft: base.soft + p.actionWeights[action.type] } }).sort((a, b) => { for (let i = 0; i < Math.max(a.base.hard.length, b.base.hard.length); i++) { const diff = (b.base.hard[i] ?? 0) - (a.base.hard[i] ?? 0); if (diff) return diff }; return b.soft - a.soft || a.base.key.localeCompare(b.base.key) })[0]!
/** Pure, direct 25 × 4 Action scoring. It neither imports nor calls tactical search. */
export const deriveTacticalAdaptationProfile = (input: TacticalAdaptationCorpus, rehydratedInputs: readonly SoldierBrainInputV119[]): TacticalAdaptationSelection => {
  const corpus = createTacticalAdaptationCorpus(input); if (rehydratedInputs.length !== 4) fail("REHYDRATION")
  corpus.observations.forEach((entry, index) => { if (labRoot("runtime-input", rehydratedInputs[index]) !== entry.soldierBrainInputRoot) fail("INPUT_ROOT") })
  const summary = targetSummary(corpus.observations)
  const rows = TACTICAL_ADAPTATION_PROFILES.flatMap((p) => corpus.observations.map((entry, index) => { const selected = choose(rehydratedInputs[index]!, p), kind = selected.action.type, base = selected.base; return Object.freeze({ profileId: p.id, soldierBrainInputRoot: entry.soldierBrainInputRoot, selectedAction: selected.action, targetActionSummary: summary, nodeValue: [base.hard[0] ?? 0, base.hard[1] ?? 0, counters[kind].MOVE * summary.MOVE + counters[kind].TURN * summary.TURN + counters[kind].TURN_TO_STONE * summary.TURN_TO_STONE, base.soft, base.key] as const }) }))
  if (rows.length !== 100) fail("EVALUATIONS")
  const winner = TACTICAL_ADAPTATION_PROFILES.map((p) => ({ profile: p, score: rows.filter((row) => row.profileId === p.id).reduce<readonly [number, number, number, number]>((a, row) => [a[0] + row.nodeValue[0], a[1] + row.nodeValue[1], a[2] + row.nodeValue[2], a[3] + row.nodeValue[3]], [0, 0, 0, 0]) })).sort((a, b) => b.score[0] - a.score[0] || b.score[1] - a.score[1] || b.score[2] - a.score[2] || b.score[3] - a.score[3] || a.profile.id.localeCompare(b.profile.id))[0]!
  const gridRoot = labRoot("tactical-adaptation-grid-v1", TACTICAL_ADAPTATION_PROFILES.map((p) => p.root)), value = bounded({ schemaVersion: "tactical-adaptation-selection-v1" as const, corpusRoot: corpus.root, gridRoot, rows, profile: winner.profile })
  return Object.freeze({ ...value, root: labRoot("tactical-adaptation-selection-v1", value) })
}
