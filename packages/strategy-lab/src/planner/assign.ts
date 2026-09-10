import type { StrategyInputV119, StrategyResult } from "@cowards/spec"
import { MISSION_KINDS, compareIds, createMission, cutPreference, distance, edgeDistance, evaluateMission, fallbackMission, samePoint, validateMission, type MissionObjective } from "./missions.js"

export type AssignmentBudget = { maxExpansions: number }
export type AssignmentCandidate = { hard: number[]; soft: number; key: string }
/** Negative penalties: larger hard entries are better. Soft utility is never compensatory. */
export const compareAssignmentCandidates = (a: AssignmentCandidate, b: AssignmentCandidate) => {
  for (let i = 0; i < 4; i++) if (a.hard[i] !== b.hard[i]) return b.hard[i]! - a.hard[i]!
  return b.soft - a.soft || compareIds(a.key,b.key)
}
const objectiveKey = (o: MissionObjective) => `${o.soldierId}/${String(MISSION_KINDS.indexOf(o.kind)).padStart(2,"0")}/${o.goal.x}/${o.goal.y}`

/** Heuristic obligations only. Neither hypothetical initiative branch changes the board
 * or claims an Action legal; the canonical kernel alone adjudicates execution. */
export const scoreAssignment = (orders: MissionObjective[], input: StrategyInputV119, entrantFirst: boolean): AssignmentCandidate => {
  const hard = [0,0,0,0], selected = new Set(orders.map(o => o.soldierId))
  let soft = 0
  for (const [index,o] of orders.entries()) {
    const self = input.mySoldiers.find(s => s.id === o.soldierId)
    if (!self?.position || self.status !== "ACTIVE") { hard[1]! -= 1; continue }
    const enemies = input.enemySoldiers.filter(s => s.status === "ACTIVE" && s.position)
    const nearest = enemies.reduce((d,s) => Math.min(d,distance(self.position!,s.position!)),99)
    const deadline = input.roundNumber === 4 && edgeDistance(self.position,input) === 0
    // Entrant-second and later slots expose threatened Soldiers to more intervening responses.
    const delay = index + (entrantFirst ? 0 : 1)
    if (deadline && o.kind !== "evacuation") hard[0]! -= 10
    if (deadline) hard[0]! -= index
    if (nearest <= 1 && !["recovery","evacuation","rear-entry","edge-push"].includes(o.kind)) hard[2]! -= 1 + delay
    if (nearest <= 1) hard[2]! -= delay
    if (input.board.terrainStones.some(p => samePoint(p,o.goal)) || input.board.soldiers.some(s => s.id !== o.soldierId && s.status !== "FALLEN" && samePoint(s.position,o.goal))) hard[1]! -= 1
    const status = evaluateMission(o,input).status
    if (status === "failed" || status === "stale") hard[3]! -= 1
    if (o.kind === "pincer" && !selected.has(o.partnerId)) hard[3]! -= 1
    if (orders.slice(0,index).some(previous => samePoint(previous.goal,o.goal))) hard[3]! -= 1
    const travel = distance(self.position,o.goal)
    switch (o.kind) {
      case "evacuation": soft += (deadline ? 80 : edgeDistance(self.position,input) < 2 ? 20 : -20) - travel; break
      case "rear-entry": soft += 18 - travel * 2; break
      case "edge-push": soft += 20 - (o.targetPosition ? edgeDistance(o.targetPosition,input) * 4 : 20) - travel; break
      case "screen": soft += 10 - travel + (entrantFirst ? 2 : -2); break
      case "anchor": soft += 6 - travel; break
      case "graph-cut-stone": soft += cutPreference(o.goal,input) * 4 - travel - 12; break
      case "reserve": soft += nearest > 4 ? 2 : -10; break
      case "recovery": soft += self.facing !== o.goalFacing ? 12 : -8; break
      case "bait": soft += 8 - travel - (entrantFirst ? 0 : 6); break
      case "pincer": soft += 24 - travel * 2; break
    }
  }
  for (const self of input.mySoldiers) if (self.status === "ACTIVE" && self.position && !selected.has(self.id)) {
    if (input.roundNumber === 4 && edgeDistance(self.position,input) === 0) hard[0]! -= 10
    if (input.enemySoldiers.some(s => s.status === "ACTIVE" && s.position && distance(self.position!,s.position) <= 1)) hard[2]! -= 2
  }
  return { hard, soft, key: orders.map(objectiveKey).join("|") }
}
const robustScore = (orders: MissionObjective[], input: StrategyInputV119) => {
  const first = scoreAssignment(orders,input,true), second = scoreAssignment(orders,input,false)
  // Compare full lexicographic vectors, not independent components from impossible mixed worlds.
  return compareAssignmentCandidates(first,second) > 0 ? first : second
}

export const selectPlannerActivations = (input: StrategyInputV119, budget: AssignmentBudget = { maxExpansions: 256 }): StrategyResult => {
  if (!Number.isSafeInteger(budget.maxExpansions) || budget.maxExpansions < 0 || budget.maxExpansions > 256) throw new TypeError("ASSIGNMENT_BUDGET")
  const active = input.mySoldiers.filter(s => s.status === "ACTIVE" && s.position).sort((a,b) => compareIds(a.id,b.id))
  const count = Math.min(input.activationCount,active.length)
  // Mandatory reservation is charged separately from optional expansions, including zero-budget calls.
  const fallback = active.slice(0,count).map(s => fallbackMission(input,s.id))
  let best = fallback, bestScore = robustScore(best,input), expansions = 0
  const memory = input.strategyMemory
  const previous = memory && typeof memory === "object" && !Array.isArray(memory) && Array.isArray(memory.missions) ? memory.missions : []
  const options = active.map(s => {
    const fresh = MISSION_KINDS.map(kind => createMission(kind,input,s.id)).filter((o): o is MissionObjective => o !== null)
    for (const value of previous) if (validateMission(value,input) && value.soldierId === s.id && evaluateMission(value,input).status === "active" && !fresh.some(o => objectiveKey(o) === objectiveKey(value))) fresh.push(value)
    return fresh.sort((a,b) => compareIds(objectiveKey(a),objectiveKey(b)))
  })
  const complete = (prefix: MissionObjective[]) => [...prefix, ...active.filter(s => !prefix.some(o => o.soldierId === s.id)).slice(0,count-prefix.length).map(s => fallbackMission(input,s.id))]
  let beam: MissionObjective[][] = [[]]
  for (let depth = 0; depth < count && expansions < budget.maxExpansions; depth++) {
    const next: { orders: MissionObjective[]; score: AssignmentCandidate }[] = []
    for (const prefix of beam) for (const soldierOptions of options) for (const objective of soldierOptions) {
      if (prefix.some(o => o.soldierId === objective.soldierId)) continue
      if (expansions >= budget.maxExpansions) break
      expansions++
      const orders = [...prefix,objective], full = complete(orders), score = robustScore(full,input)
      if (compareAssignmentCandidates(score,bestScore) < 0) { best = full; bestScore = score }
      next.push({ orders,score })
    }
    beam = next.sort((a,b) => compareAssignmentCandidates(a.score,b.score)).slice(0,4).map(c => c.orders)
  }
  return { activationOrders: best.map(objective => ({ soldierId: objective.soldierId, objective })), strategyMemory: { missions: best, planner: { schemaVersion: "assignment-v1", expansions, reserved: count, hypothesisEvaluations: 2 * (1 + expansions), hypotheses: ["entrant-first","entrant-second"], beam: 4 } } }
}
