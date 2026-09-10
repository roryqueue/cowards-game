import { exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "./contracts.js"
import { buildFeasibilityAllocation } from "./feasibility-protocol.js"
import { deriveLabTaskId, validateLabTaskContext, type LabTaskContext, type LabTaskIdentity } from "./identity.js"

export interface LabTask { id: LabRoot; identity: LabTaskIdentity; purpose: "scientific" | "alias-compatibility"; representativeId: LabRoot; ordinal: number }
export interface LabPlannedAttempt { id: LabRoot; taskId: LabRoot; ordinal: number; pass: "baseline" | "variant"; retry: 0 }
export interface LabTaskGraph { context: LabTaskContext; tasks: readonly LabTask[]; attempts: readonly LabPlannedAttempt[]; root: LabRoot }
// Only deeply frozen graphs constructed here are trusted-cache members.
const constructedGraphs = new WeakSet<object>()
export const enumerateLabTasks = (input: unknown): Readonly<LabTaskGraph> => {
  const context = validateLabTaskContext(input)
  const representatives = new Map<LabRoot, LabRoot>()
  const tasks = buildFeasibilityAllocation().slice(0,12).map((cell): LabTask => {
    const purpose = cell.aliasCompatibility ? "alias-compatibility" : "scientific"
    const identity: LabTaskIdentity = { ...context, schemaVersion: "lab-task-identity-v1", split: "development", geometryCellRoot: cell.geometryCellRoot, arenaId: cell.arenaId, ordinal: cell.ordinal, purpose }
    const id = deriveLabTaskId(identity)
    if (purpose === "scientific") {
      if (representatives.has(cell.geometryCellRoot)) throw new TypeError("LAB_DUPLICATE_SCIENTIFIC_CELL")
      representatives.set(cell.geometryCellRoot, id)
    }
    const representativeId = representatives.get(cell.geometryCellRoot)
    if (!representativeId) throw new TypeError("LAB_ALIAS_WITHOUT_REPRESENTATIVE")
    return { id, identity, purpose, representativeId, ordinal: cell.ordinal }
  })
  const attempts = (["baseline", "variant"] as const).flatMap((pass, passIndex) => tasks.map((task): LabPlannedAttempt => {
    const ordinal = passIndex * 12 + task.ordinal
    return { id: labRoot("attempt-id", { taskId: task.id, ordinal, pass }), taskId: task.id, ordinal, pass, retry: 0 }
  }))
  const graph = freezeLabValue({ context, tasks, attempts, root: labRoot("task-graph", { context, tasks, attempts }) })
  constructedGraphs.add(graph)
  return graph
}
export const validateLabTaskGraph = (graph: LabTaskGraph): Readonly<LabTaskGraph> => {
  if (constructedGraphs.has(graph)) return graph
  const expected = enumerateLabTasks(graph.context)
  if (labRoot("graph-admission", expected) !== labRoot("graph-admission", graph)) throw new TypeError("LAB_GRAPH_DRIFT")
  return expected
}
export interface LabLayout { workers: 1 | 2; shardSize: 1 | 3; order: "forward" | "reverse" | "permutation" }
export interface LabAssignment { task: LabTask; attempt: LabPlannedAttempt; worker: number; shard: number; dispatchOrdinal: number }
export const assignLabTasks = (input: LabTaskGraph, layout: unknown): readonly LabAssignment[] => {
  const graph = validateLabTaskGraph(input)
  if (!exactLabKeys(layout, ["workers", "shardSize", "order"]) || (layout.workers !== 1 && layout.workers !== 2) || (layout.shardSize !== 1 && layout.shardSize !== 3) || !["forward", "reverse", "permutation"].includes(String(layout.order))) throw new TypeError("LAB_LAYOUT")
  const ordered = [...graph.attempts]
  if (layout.order === "reverse") ordered.reverse()
  if (layout.order === "permutation") ordered.sort((a,b) => (a.ordinal * 5 % 24) - (b.ordinal * 5 % 24))
  return freezeLabValue(ordered.map((attempt, dispatchOrdinal) => ({ task: graph.tasks.find((t) => t.id === attempt.taskId)!, attempt, worker: dispatchOrdinal % Number(layout.workers), shard: Math.floor(dispatchOrdinal / Number(layout.shardSize)), dispatchOrdinal })))
}
