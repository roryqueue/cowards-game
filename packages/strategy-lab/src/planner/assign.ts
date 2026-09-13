import type { StrategyInputV119, StrategyResult } from "@cowards/spec"
import { MISSION_KINDS, compareIds, createMissionOptions, cutPreference, distance, edgeDistance, evaluateMission, fallbackMission, samePoint, validateMission, type MissionObjective } from "./missions.js"

export type AssignmentBudget = { maxExpansions: number }
export type AssignmentCandidate = { hard: number[]; soft: number; key: string }
/** Negative penalties: larger hard entries are better. Soft utility is never compensatory. */
export const compareAssignmentCandidates = (a: AssignmentCandidate, b: AssignmentCandidate) => {
  for (let i = 0; i < 4; i++) if (a.hard[i] !== b.hard[i]) return b.hard[i]! - a.hard[i]!
  return b.soft - a.soft || compareIds(a.key,b.key)
}
const objectiveKey = (o: MissionObjective) => `${o.soldierId}/${String(MISSION_KINDS.indexOf(o.kind)).padStart(2,"0")}/${o.goal.x}/${o.goal.y}`
const assignmentMin = Math.min
const assignmentFacts = (o: MissionObjective,input: StrategyInputV119) => {
  const self = input.mySoldiers.find(s => s.id === o.soldierId)
  if (!self?.position || self.status !== "ACTIVE") return null
  const enemies = input.enemySoldiers.filter(s => s.status === "ACTIVE" && s.position)
  return {
    self,nearest: enemies.reduce((d,s) => assignmentMin(d,distance(self.position!,s.position!)),99),
    deadline: input.roundNumber === 4 && edgeDistance(self.position,input) === 0,
    blocked: input.board.terrainStones.some(p => samePoint(p,o.goal)) || input.board.soldiers.some(s => s.id !== o.soldierId && s.status !== "FALLEN" && samePoint(s.position,o.goal)),
    status: evaluateMission(o,input).status,travel: distance(self.position,o.goal),
    edge: edgeDistance(self.position,input),cut: o.kind === "graph-cut-stone" ? cutPreference(o.goal,input) : 0,
  }
}
type AssignmentFacts = ReturnType<typeof assignmentFacts>
type AssignmentContribution = { facts: AssignmentFacts; key: string; hard0: number; hard1: number; hard3: number; softFirst: number; softSecond: number }
type AssignmentCache = { objectives: MissionObjective[]; contributions: AssignmentContribution[]; omitted: { id: string; hard0: number; hard2: number }[] }
type AssignmentRecord = { objective: MissionObjective; soldierId: string; key: string; contribution: AssignmentContribution }

const scoreAssignmentRecords = (orders: AssignmentRecord[], input: StrategyInputV119, cache: AssignmentCache): AssignmentCandidate => {
  const firstHard = [0,0,0,0], secondHard = [0,0,0,0], selected = new Set(orders.map(o => o.soldierId)); let firstSoft = 0, secondSoft = 0
  for (const [slot,record] of orders.entries()) {
    const o = record.objective, contribution = record.contribution, facts = contribution.facts
    if (!facts) { firstHard[1]!--; secondHard[1]!--; continue }
    firstHard[0]! += contribution.hard0 - (facts.deadline ? slot : 0); secondHard[0]! += contribution.hard0 - (facts.deadline ? slot : 0)
    firstHard[1]! += contribution.hard1; secondHard[1]! += contribution.hard1; firstHard[3]! += contribution.hard3; secondHard[3]! += contribution.hard3
    firstSoft += contribution.softFirst; secondSoft += contribution.softSecond
    if (facts.nearest <= 1 && !["recovery","evacuation","rear-entry","edge-push"].includes(o.kind)) { firstHard[2]! -= 1 + slot; secondHard[2]! -= 2 + slot }
    if (facts.nearest <= 1) { firstHard[2]! -= slot; secondHard[2]! -= 1 + slot }
    if (o.kind === "pincer" && !selected.has(o.partnerId)) { firstHard[3]!--; secondHard[3]!-- }
    for (let i = 0; i < slot; i++) if (samePoint(orders[i]!.objective.goal,o.goal)) { firstHard[3]!--; secondHard[3]!--; break }
  }
  for (const penalty of cache.omitted) if (!selected.has(penalty.id)) { firstHard[0]! += penalty.hard0; secondHard[0]! += penalty.hard0; firstHard[2]! += penalty.hard2; secondHard[2]! += penalty.hard2 }
  const key = orders.map(record => record.key).join("|"), first = { hard: firstHard,soft: firstSoft,key }, second = { hard: secondHard,soft: secondSoft,key }
  return compareAssignmentCandidates(first,second) > 0 ? first : second
}

/** Heuristic obligations only. Neither hypothetical initiative branch changes the board
 * or claims an Action legal; the canonical kernel alone adjudicates execution. */
export const scoreAssignment = (orders: MissionObjective[], input: StrategyInputV119, entrantFirst: boolean, factsFor: (o: MissionObjective) => AssignmentFacts = o => assignmentFacts(o,input)): AssignmentCandidate => {
  const hard = [0,0,0,0], selected = new Set(orders.map(o => o.soldierId))
  let soft = 0
  for (const [index,o] of orders.entries()) {
    const facts = factsFor(o)
    if (!facts) { hard[1]! -= 1; continue }
    const { self,nearest,deadline,status,travel } = facts
    // Entrant-second and later slots expose threatened Soldiers to more intervening responses.
    const delay = index + (entrantFirst ? 0 : 1)
    if (deadline && o.kind !== "evacuation") hard[0]! -= 10
    if (deadline) hard[0]! -= index
    if (nearest <= 1 && !["recovery","evacuation","rear-entry","edge-push"].includes(o.kind)) hard[2]! -= 1 + delay
    if (nearest <= 1) hard[2]! -= delay
    if (facts.blocked) hard[1]! -= 1
    if (status === "failed" || status === "stale") hard[3]! -= 1
    if (o.kind === "pincer" && !selected.has(o.partnerId)) hard[3]! -= 1
    if (orders.slice(0,index).some(previous => samePoint(previous.goal,o.goal))) hard[3]! -= 1
    switch (o.kind) {
      case "evacuation": soft += (deadline ? 80 : facts.edge < 2 ? 20 : -20) - travel; break
      case "rear-entry": soft += 18 - travel * 2; break
      case "edge-push": soft += 20 - (o.targetPosition ? edgeDistance(o.targetPosition,input) * 4 : 20) - travel; break
      case "screen": soft += 10 - travel + (entrantFirst ? 2 : -2); break
      case "anchor": soft += 6 - travel; break
      case "graph-cut-stone": soft += facts.cut * 4 - travel - 12; break
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

export const selectPlannerActivations = (input: StrategyInputV119, budget: AssignmentBudget = { maxExpansions: 256 }): StrategyResult => {
  if (!Number.isSafeInteger(budget.maxExpansions) || budget.maxExpansions < 0 || budget.maxExpansions > 256) throw new TypeError("ASSIGNMENT_BUDGET")
  const active = input.mySoldiers.filter(s => s.status === "ACTIVE" && s.position).sort((a,b) => compareIds(a.id,b.id))
  const count = assignmentMin(input.activationCount,active.length)
  // The observation and objectives are read-only for this call. Identity, never
  // the abbreviated sorting key, owns cached facts; no state survives a call.
  const reserves: (MissionObjective | undefined)[] = []
  const reserveFor = (s: typeof active[number]) => {
    const index = active.indexOf(s)
    return reserves[index] ?? (reserves[index] = fallbackMission(input,s.id))
  }
  // Mandatory reservation is charged separately from optional expansions, including zero-budget calls.
  const fallback = active.slice(0,count).map(reserveFor)
  const memory = input.strategyMemory
  const previous = memory && typeof memory === "object" && !Array.isArray(memory) && Array.isArray(memory.missions) ? memory.missions : []
  const options = active.map(s => {
    const fresh = createMissionOptions(input,s.id)
    for (const value of previous) if (validateMission(value,input) && value.soldierId === s.id && evaluateMission(value,input).status === "active" && !fresh.some(o => objectiveKey(o) === objectiveKey(value))) fresh.push(value)
    return fresh.sort((a,b) => compareIds(objectiveKey(a),objectiveKey(b)))
  })
  const cache: AssignmentCache = { objectives: [],contributions: [],omitted: [] }
  for (const self of active) {
    let hard0 = 0,hard2 = 0
    if (input.roundNumber === 4 && edgeDistance(self.position!,input) === 0) hard0 -= 10
    if (input.enemySoldiers.some(s => s.status === "ACTIVE" && s.position && distance(self.position!,s.position) <= 1)) hard2 -= 2
    cache.omitted.push({ id: self.id,hard0,hard2 })
  }
  const cacheObjective = (objective: MissionObjective) => {
    if (cache.objectives.includes(objective)) return
    const facts = assignmentFacts(objective,input)
    if (!facts) { cache.objectives.push(objective); cache.contributions.push({ facts,key: objectiveKey(objective),hard0: 0,hard1: -1,hard3: 0,softFirst: 0,softSecond: 0 }); return }
    const { self,nearest,deadline,status,travel } = facts
    const hard0 = deadline && objective.kind !== "evacuation" ? -10 : 0
    const hard1 = facts.blocked ? -1 : 0
    const hard3 = status === "failed" || status === "stale" ? -1 : 0
    let softFirst = 0,softSecond = 0
    switch (objective.kind) {
      case "evacuation": softFirst = softSecond = (deadline ? 80 : facts.edge < 2 ? 20 : -20) - travel; break
      case "rear-entry": softFirst = softSecond = 18 - travel * 2; break
      case "edge-push": softFirst = softSecond = 20 - (objective.targetPosition ? edgeDistance(objective.targetPosition,input) * 4 : 20) - travel; break
      case "screen": softFirst = 12 - travel; softSecond = 8 - travel; break
      case "anchor": softFirst = softSecond = 6 - travel; break
      case "graph-cut-stone": softFirst = softSecond = facts.cut * 4 - travel - 12; break
      case "reserve": softFirst = softSecond = nearest > 4 ? 2 : -10; break
      case "recovery": softFirst = softSecond = self.facing !== objective.goalFacing ? 12 : -8; break
      case "bait": softFirst = 8 - travel; softSecond = 2 - travel; break
      case "pincer": softFirst = softSecond = 24 - travel * 2; break
    }
    cache.objectives.push(objective); cache.contributions.push({ facts,key: objectiveKey(objective),hard0,hard1,hard3,softFirst,softSecond })
  }
  for (const objective of fallback) cacheObjective(objective)
  for (const soldierOptions of options) for (const objective of soldierOptions) cacheObjective(objective)
  const records = cache.objectives.map((objective,index) => ({ objective,soldierId: objective.soldierId,key: cache.contributions[index]!.key,contribution: cache.contributions[index]! }))
  const recordFor = (objective: MissionObjective) => records[cache.objectives.indexOf(objective)]!
  const recordOptions = options.map(values => values.map(recordFor)), recordFallback = fallback.map(recordFor)
  const fallbackRecordFor = (index: number): AssignmentRecord => {
    const existing = recordFallback[index]
    if (existing) return existing
    // Only unusual duplicate-ID inputs can need a filler beyond the first
    // `count` Soldiers. Keep the original lazy validation/throw behavior.
    const objective = reserveFor(active[index]!)
    cacheObjective(objective)
    const contribution = cache.contributions[cache.objectives.indexOf(objective)]!
    return recordFallback[index] = { objective,soldierId: objective.soldierId,key: contribution.key,contribution }
  }
  let best = recordFallback.slice(), bestScore = scoreAssignmentRecords(best,input,cache), expansions = 0
  const complete = (prefix: AssignmentRecord[]) => {
    const selected = new Set(prefix.map(record => record.soldierId)), result = prefix.slice()
    for (let index = 0; index < active.length && result.length < count; index++) if (!selected.has(active[index]!.id)) result.push(fallbackRecordFor(index))
    return result
  }
  let beam: AssignmentRecord[][] = [[]]
  for (let depth = 0; depth < count && expansions < budget.maxExpansions; depth++) {
    const next: { orders: AssignmentRecord[]; score: AssignmentCandidate }[] = []
    for (const prefix of beam) for (const soldierOptions of recordOptions) for (const record of soldierOptions) {
      if (prefix.some(o => o.soldierId === record.soldierId)) continue
      if (expansions >= budget.maxExpansions) break
      expansions++
      const orders = [...prefix,record], full = complete(orders), score = scoreAssignmentRecords(full,input,cache)
      if (compareAssignmentCandidates(score,bestScore) < 0) { best = full; bestScore = score }
      // Stable top-four selection is exactly stable sort followed by slice(0,4).
      // Equal candidates go after earlier arrivals; every expansion is still
      // scored and can update the global best, even when it misses the beam.
      let insertion = 0
      while (insertion < next.length && compareAssignmentCandidates(next[insertion]!.score,score) <= 0) insertion++
      if (insertion < 4) {
        next.splice(insertion,0,{ orders,score })
        if (next.length > 4) next.pop()
      }
    }
    beam = next.map(c => c.orders)
  }
  const missions = best.map(record => record.objective)
  return { activationOrders: missions.map(objective => ({ soldierId: objective.soldierId, objective })), strategyMemory: { missions, planner: { schemaVersion: "assignment-v1", expansions, reserved: count, hypothesisEvaluations: 2 * (1 + expansions), hypotheses: ["entrant-first","entrant-second"], beam: 4 } } }
}
