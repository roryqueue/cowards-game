/** Bounded, private, per-Match measurements extracted before canonical traces are discarded.
 * A receipt is evidence of exactly one execution, never a substitute for all-cell coverage. */
import type { LabMatchExecution } from "../../packages/strategy-lab/src/runtime-bridge.js"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import type { LeanCompactMatchRecord } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { canonicalizeV138OpeningCluster } from "./v1-38-classifiers.js"

export const LEAN_BASELINE_REQUIRED_METRICS = [
  "half_point_outcome", "terminal_length", "cycles", "contractions", "active_survival",
  "first_enemy_awareness", "first_contact", "first_backstab", "first_push", "first_stone",
  "first_decisive_event", "forced_evacuation", "first_contraction_unselected_reserves",
  "advance_and_stone", "push_and_block_causes", "opening_cluster", "opening_normalized_entropy",
  "center_wing_convoy_turtle",
] as const
export type LeanBaselineRequiredMetric = typeof LEAN_BASELINE_REQUIRED_METRICS[number]

type Event = Extract<LabMatchExecution, { kind: "completed" }>["transitions"][number]["events"][number]
type StateSoldier = { id: string; ownerPlayerId: string; status: string; position: { x: number; y: number } | null; facing: string }
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value)
const finiteInt = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0
const position = (value: unknown): value is { x: number; y: number } => record(value) && finiteInt(value.x) && finiteInt(value.y)
const soldier = (value: unknown): value is StateSoldier => record(value) && typeof value.id === "string" && typeof value.ownerPlayerId === "string" &&
  typeof value.status === "string" && (value.position === null || position(value.position)) && typeof value.facing === "string"

/** Only the first emitted action per Soldier is used. The established
 * canonicalizer removes opaque identifiers and normalizes side/mirror order. */
export const leanBaselineOpeningCluster = (execution: LabMatchExecution): LabRoot | null => {
  if (execution.kind !== "completed" || execution.transitions.length === 0) return null
  const initial = execution.transitions[0]!.beforeState
  if (!record(initial.bounds) || !finiteInt(initial.bounds.minX) || !finiteInt(initial.bounds.maxX) ||
    !finiteInt(initial.bounds.minY) || !finiteInt(initial.bounds.maxY) || !Array.isArray(initial.players) ||
    !Array.isArray(initial.soldiers) || !initial.soldiers.every(soldier)) return null
  const players = initial.players.filter(record)
  if (players.length !== 2 || players.some(p => typeof p.id !== "string")) return null
  const bounds = initial.bounds
  const width = Number(bounds.maxX) - Number(bounds.minX) + 1
  const height = Number(bounds.maxY) - Number(bounds.minY) + 1
  if (width < 1 || height < 1) return null
  const firstActions = new Map<string, string>()
  for (const transition of execution.transitions) for (const event of transition.events) {
    if (event.type !== "ACTION_EMITTED" || !record(event.payload) || typeof event.payload.soldierId !== "string" || firstActions.has(event.payload.soldierId)) continue
    const action = record(event.payload.action) ? event.payload.action.type : null
    if (typeof action === "string") firstActions.set(event.payload.soldierId, action)
  }
  const entrants = players.map(p => ({ opaqueId: p.id as string, soldiers: (initial.soldiers as StateSoldier[])
    .filter(s => s.ownerPlayerId === p.id && s.position !== null)
    .map((s, sourceOrder) => ({ opaqueId: s.id, sourceOrder, x: s.position!.x - Number(bounds.minX), y: s.position!.y - Number(bounds.minY), facing: s.facing, actions: firstActions.has(s.id) ? [firstActions.get(s.id)!] : [] })) }))
  if (entrants.some(e => e.soldiers.length === 0)) return null
  try { return canonicalizeV138OpeningCluster({ schemaVersion: "v1.38-synthetic-opening-projection-v1", board: { width, height }, entrants }) as LabRoot }
  catch { return null }
}

export interface LeanBaselineMetricReceipt {
  readonly schemaVersion: "v1.38-lean-baseline-match-metrics-v1"
  readonly source: "actual_canonical_trace" | "unavailable"
  readonly executionRoot: LabRoot
  readonly measurements: {
    readonly terminalLength: number | null
    readonly terminalActivationCount: number | null
    readonly cycleCount: number | null
    readonly contractionCount: number | null
    readonly activeSurvival: readonly [number, number] | null
    readonly firstEnemyAwarenessActivation: number | null
    readonly firstContactActivation: number | null
    readonly firstBackstabActivation: number | null
    readonly firstPushActivation: number | null
    readonly firstStoneActivation: number | null
    readonly firstDecisiveActivation: number | null
    readonly contractionFallCount: number | null
    readonly advances: number | null
    readonly stones: number | null
    readonly pushes: number | null
    readonly moveBlocks: number | null
    readonly pushBlocks: number | null
    readonly openingCluster: LabRoot | null
  }
  readonly missing: readonly LeanBaselineRequiredMetric[]
  readonly formationComparison: "inconclusive"
  readonly root: LabRoot
}

const enemyInAwareness = (event: Event): boolean => {
  if (!record(event.privatePayload) || !record(event.privatePayload.awarenessGrid) || !Array.isArray(event.privatePayload.awarenessGrid.cells)) return false
  return event.privatePayload.awarenessGrid.cells.some(cell => record(cell) && (cell.contents === "ENEMY_ACTIVE" || cell.contents === "ENEMY_STONE"))
}

export const collectLeanBaselineMetrics = (execution: LabMatchExecution, compact: LeanCompactMatchRecord): LeanBaselineMetricReceipt => {
  const completed = execution.kind === "completed" && execution.transitions.length > 0 && compact.classification === "success" && compact.cleanupComplete
  const events = completed ? execution.transitions.flatMap(t => t.events) : []
  const first = (predicate: (event: Event) => boolean): number | null => {
    let activation = 0
    for (const event of events) {
      if (event.type === "ACTIVATION_STARTED") activation++
      if (predicate(event)) return activation
    }
    return null
  }
  const count = (type: Event["type"]): number => events.filter(event => event.type === type).length
  const resultState = execution.kind === "completed" ? execution.result.state : null
  const players = resultState?.players ?? []
  const initialSoldiers = completed ? execution.transitions[0]?.beforeState.soldiers : null
  const ownerBySoldier = new Map<string, string>()
  if (Array.isArray(initialSoldiers)) for (const entry of initialSoldiers) if (record(entry) && typeof entry.id === "string" && typeof entry.ownerPlayerId === "string") ownerBySoldier.set(entry.id, entry.ownerPlayerId)
  const opposingOwners = (left: unknown, right: unknown): boolean => typeof left === "string" && typeof right === "string" &&
    ownerBySoldier.has(left) && ownerBySoldier.has(right) && ownerBySoldier.get(left) !== ownerBySoldier.get(right)
  const enemyContact = (event: Event): boolean => {
    if (!record(event.payload)) return false
    if (["MOVE_BLOCKED", "PUSH_ATTEMPTED", "PUSH_RESOLVED", "PUSH_BLOCKED"].includes(event.type)) return opposingOwners(event.payload.soldierId, event.payload.targetSoldierId)
    if (event.type !== "BACKSTAB_RESOLVED" || !Array.isArray(event.payload.pairs)) return false
    return event.payload.pairs.some(pair => record(pair) && opposingOwners(pair.attackerId, pair.victimId))
  }
  const activeSurvival = completed && players.length === 2 ? players.map(p => resultState!.soldiers.filter(s => s.ownerPlayerId === p.id && s.status === "ACTIVE").length) as [number, number] : null
  const openingCluster = completed ? leanBaselineOpeningCluster(execution) : null
  const measurements: LeanBaselineMetricReceipt["measurements"] = {
    terminalLength: completed ? execution.transitions.length : null,
    terminalActivationCount: completed ? count("ACTIVATION_STARTED") : null,
    cycleCount: completed ? count("CYCLE_STARTED") : null,
    contractionCount: completed ? count("CONTRACTION_RESOLVED") : null,
    activeSurvival,
    firstEnemyAwarenessActivation: completed ? first(event => event.type === "AWARENESS_GRID_OBSERVED" && enemyInAwareness(event)) : null,
    firstContactActivation: completed ? first(enemyContact) : null,
    firstBackstabActivation: completed ? first(event => event.type === "BACKSTAB_RESOLVED") : null,
    firstPushActivation: completed ? first(event => event.type === "PUSH_ATTEMPTED" || event.type === "PUSH_RESOLVED" || event.type === "PUSH_BLOCKED") : null,
    firstStoneActivation: completed ? first(event => event.type === "SOLDIER_STONED") : null,
    firstDecisiveActivation: completed ? first(event => event.type === "SOLDIER_FELL" || event.type === "BACKSTAB_RESOLVED") : null,
    contractionFallCount: completed ? events.filter(event => event.type === "SOLDIER_FELL" && record(event.payload) && event.payload.reason === "BOARD_CONTRACTION").length : null,
    advances: completed ? count("MOVE_ADVANCED") : null,
    stones: completed ? count("SOLDIER_STONED") : null,
    pushes: completed ? count("PUSH_RESOLVED") : null,
    moveBlocks: completed ? count("MOVE_BLOCKED") : null,
    pushBlocks: completed ? count("PUSH_BLOCKED") : null,
    openingCluster,
  }
  const supported = new Set<LeanBaselineRequiredMetric>()
  if (completed) {
    for (const key of ["terminal_length", "cycles", "contractions", "active_survival", "first_enemy_awareness", "first_contact", "first_backstab", "first_push", "first_stone", "first_decisive_event", "advance_and_stone"] as const) supported.add(key)
    if (compact.outcome !== null) supported.add("half_point_outcome")
    if (openingCluster) supported.add("opening_cluster")
  }
  const body = { schemaVersion: "v1.38-lean-baseline-match-metrics-v1" as const, source: completed ? "actual_canonical_trace" as const : "unavailable" as const, executionRoot: compact.executionRoot, measurements, missing: LEAN_BASELINE_REQUIRED_METRICS.filter(key => !supported.has(key)), formationComparison: "inconclusive" as const }
  return { ...body, root: labRoot("lean-baseline-match-metrics-v1", body) }
}
