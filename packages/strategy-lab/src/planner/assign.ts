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
const assignmentFacts = (o: MissionObjective,input: StrategyInputV119) => {
  const self = input.mySoldiers.find(s => s.id === o.soldierId)
  if (!self?.position || self.status !== "ACTIVE") return null
  const enemies = input.enemySoldiers.filter(s => s.status === "ACTIVE" && s.position)
  return {
    self,nearest: enemies.reduce((d,s) => Math.min(d,distance(self.position!,s.position!)),99),
    deadline: input.roundNumber === 4 && edgeDistance(self.position,input) === 0,
    blocked: input.board.terrainStones.some(p => samePoint(p,o.goal)) || input.board.soldiers.some(s => s.id !== o.soldierId && s.status !== "FALLEN" && samePoint(s.position,o.goal)),
    status: evaluateMission(o,input).status,travel: distance(self.position,o.goal),
    edge: edgeDistance(self.position,input),cut: o.kind === "graph-cut-stone" ? cutPreference(o.goal,input) : 0,
  }
}
type AssignmentFacts = ReturnType<typeof assignmentFacts>
type AssignmentContribution = { facts: AssignmentFacts; key: string; hard0: number; hard1: number; hard3: number; softFirst: number; softSecond: number }
type AssignmentCache = { objectives: MissionObjective[]; contributions: AssignmentContribution[]; omitted: { id: string; hard0: number; hard2: number }[] }

/** Heuristic obligations only. Neither hypothetical initiative branch changes the board
 * or claims an Action legal; the canonical kernel alone adjudicates execution. */
const scoreAssignmentInternal = (orders: MissionObjective[], input: StrategyInputV119, entrantFirst: boolean, factsFor: (o: MissionObjective) => AssignmentFacts, keyFor: (o: MissionObjective) => string = objectiveKey, cache?: AssignmentCache): AssignmentCandidate => {
  const hard = [0,0,0,0], selected = new Set(orders.map(o => o.soldierId))
  let soft = 0
  for (const [slot,o] of orders.entries()) {
    const objectiveIndex = cache ? cache.objectives.indexOf(o) : -1
    const contribution = objectiveIndex >= 0 ? cache!.contributions[objectiveIndex]! : null
    const facts = contribution?.facts ?? factsFor(o)
    if (!facts) { hard[1]! -= 1; continue }
    const { self,nearest,deadline,status,travel } = facts
    // Entrant-second and later slots expose threatened Soldiers to more intervening responses.
    const delay = slot + (entrantFirst ? 0 : 1)
    if (contribution) { hard[0]! += contribution.hard0 - (deadline ? slot : 0); hard[1]! += contribution.hard1; hard[3]! += contribution.hard3; soft += entrantFirst ? contribution.softFirst : contribution.softSecond }
    else {
      if (deadline && o.kind !== "evacuation") hard[0]! -= 10
      if (deadline) hard[0]! -= slot
      if (facts.blocked) hard[1]! -= 1
      if (status === "failed" || status === "stale") hard[3]! -= 1
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
    if (nearest <= 1 && !["recovery","evacuation","rear-entry","edge-push"].includes(o.kind)) hard[2]! -= 1 + delay
    if (nearest <= 1) hard[2]! -= delay
    if (o.kind === "pincer" && !selected.has(o.partnerId)) hard[3]! -= 1
    if (orders.slice(0,slot).some(previous => samePoint(previous.goal,o.goal))) hard[3]! -= 1
  }
  for (const self of input.mySoldiers) if (self.status === "ACTIVE" && self.position && !selected.has(self.id)) {
    if (cache) {
      const penalty = cache.omitted.find(value => value.id === self.id)
      if (penalty) { hard[0]! += penalty.hard0; hard[2]! += penalty.hard2 }
      continue
    }
    if (input.roundNumber === 4 && edgeDistance(self.position,input) === 0) hard[0]! -= 10
    if (input.enemySoldiers.some(s => s.status === "ACTIVE" && s.position && distance(self.position!,s.position) <= 1)) hard[2]! -= 2
  }
  return { hard, soft, key: orders.map(o => { const objectiveIndex = cache ? cache.objectives.indexOf(o) : -1; return objectiveIndex >= 0 ? cache!.contributions[objectiveIndex]!.key : keyFor(o) }).join("|") }
}
export const scoreAssignment = (orders: MissionObjective[], input: StrategyInputV119, entrantFirst: boolean, factsFor: (o: MissionObjective) => AssignmentFacts = o => assignmentFacts(o,input)): AssignmentCandidate => scoreAssignmentInternal(orders,input,entrantFirst,factsFor)
const robustScore = (orders: MissionObjective[], input: StrategyInputV119, factsFor: (o: MissionObjective) => AssignmentFacts, cache?: AssignmentCache) => {
  if (cache) {
    const firstHard = [0,0,0,0], secondHard = [0,0,0,0], selected = new Set(orders.map(o => o.soldierId)); let firstSoft = 0, secondSoft = 0
    for (const [slot,o] of orders.entries()) {
      const objectiveIndex = cache.objectives.indexOf(o), contribution = cache.contributions[objectiveIndex]!
      const facts = contribution.facts, delayFirst = slot, delaySecond = slot + 1
      if (!facts) { firstHard[1]!--; secondHard[1]!--; continue }
      firstHard[0]! += contribution.hard0 - (facts.deadline ? slot : 0); secondHard[0]! += contribution.hard0 - (facts.deadline ? slot : 0)
      firstHard[1]! += contribution.hard1; secondHard[1]! += contribution.hard1; firstHard[3]! += contribution.hard3; secondHard[3]! += contribution.hard3
      firstSoft += contribution.softFirst; secondSoft += contribution.softSecond
      const threatened = facts.nearest <= 1 && !["recovery","evacuation","rear-entry","edge-push"].includes(o.kind)
      if (threatened) { firstHard[2]! -= 1 + delayFirst; secondHard[2]! -= 1 + delaySecond }
      if (facts.nearest <= 1) { firstHard[2]! -= delayFirst; secondHard[2]! -= delaySecond }
      if (o.kind === "pincer" && !selected.has(o.partnerId)) { firstHard[3]!--; secondHard[3]!-- }
      if (orders.slice(0,slot).some(previous => samePoint(previous.goal,o.goal))) { firstHard[3]!--; secondHard[3]!-- }
    }
    for (const self of input.mySoldiers) if (self.status === "ACTIVE" && self.position && !selected.has(self.id)) {
      const penalty = cache.omitted.find(value => value.id === self.id)
      if (penalty) { firstHard[0]! += penalty.hard0; secondHard[0]! += penalty.hard0; firstHard[2]! += penalty.hard2; secondHard[2]! += penalty.hard2 }
    }
    const key = orders.map(o => cache.contributions[cache.objectives.indexOf(o)]!.key).join("|")
    const first = { hard: firstHard,soft: firstSoft,key }, second = { hard: secondHard,soft: secondSoft,key }
    return compareAssignmentCandidates(first,second) > 0 ? first : second
  }
  const first = scoreAssignmentInternal(orders,input,true,factsFor,objectiveKey,cache)
  const second = scoreAssignmentInternal(orders,input,false,factsFor,objectiveKey,cache)
  // Compare full lexicographic vectors, not independent components from impossible mixed worlds.
  return compareAssignmentCandidates(first,second) > 0 ? first : second
}

export const selectPlannerActivations = (input: StrategyInputV119, budget: AssignmentBudget = { maxExpansions: 256 }): StrategyResult => {
  if (!Number.isSafeInteger(budget.maxExpansions) || budget.maxExpansions < 0 || budget.maxExpansions > 256) throw new TypeError("ASSIGNMENT_BUDGET")
  const active = input.mySoldiers.filter(s => s.status === "ACTIVE" && s.position).sort((a,b) => compareIds(a.id,b.id))
  const count = Math.min(input.activationCount,active.length)
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
  let best = fallback, bestScore = robustScore(best,input,() => null,cache), expansions = 0
  const complete = (prefix: MissionObjective[]) => [...prefix, ...active.filter(s => !prefix.some(o => o.soldierId === s.id)).slice(0,count-prefix.length).map(reserveFor)]
  let beam: MissionObjective[][] = [[]]
  for (let depth = 0; depth < count && expansions < budget.maxExpansions; depth++) {
    const next: { orders: MissionObjective[]; score: AssignmentCandidate }[] = []
    for (const prefix of beam) for (const soldierOptions of options) for (const objective of soldierOptions) {
      if (prefix.some(o => o.soldierId === objective.soldierId)) continue
      if (expansions >= budget.maxExpansions) break
      expansions++
      const orders = [...prefix,objective], full = complete(orders), score = robustScore(full,input,() => null,cache)
      if (compareAssignmentCandidates(score,bestScore) < 0) { best = full; bestScore = score }
      next.push({ orders,score })
    }
    beam = next.sort((a,b) => compareAssignmentCandidates(a.score,b.score)).slice(0,4).map(c => c.orders)
  }
  return { activationOrders: best.map(objective => ({ soldierId: objective.soldierId, objective })), strategyMemory: { missions: best, planner: { schemaVersion: "assignment-v1", expansions, reserved: count, hypothesisEvaluations: 2 * (1 + expansions), hypotheses: ["entrant-first","entrant-second"], beam: 4 } } }
}
