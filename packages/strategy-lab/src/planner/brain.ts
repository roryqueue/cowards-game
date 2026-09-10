import type { Action, Direction, SoldierBrainInputV119, SoldierBrainResult } from "@cowards/spec"
import { MISSION_KINDS, distance, type MissionObjective, type Point } from "./missions.js"

export const BRAIN_DIRECTIONS: readonly Direction[] = ["UP","RIGHT","DOWN","LEFT"]
const brainVector = (d: Direction): Point => d === "UP" ? { x: 0,y: -1 } : d === "DOWN" ? { x: 0,y: 1 } : d === "LEFT" ? { x: -1,y: 0 } : { x: 1,y: 0 }
const brainOpposite = (d: Direction): Direction => BRAIN_DIRECTIONS[(BRAIN_DIRECTIONS.indexOf(d)+2)%4]!
export const enumerateConcreteActions = (): Action[] => [...BRAIN_DIRECTIONS.map(direction => ({ type: "MOVE" as const,direction })),...BRAIN_DIRECTIONS.map(direction => ({ type: "TURN" as const,direction })),{ type: "TURN_TO_STONE" }]
const brainCell = (input: SoldierBrainInputV119,x: number,y: number) => input.awarenessGrid.cells.find(c => c.dx === x && c.dy === y)

/** Brain observes no phase/round or other Soldier IDs. Expiry is planner-owned;
 * local invalidation uses only self identity and visible occupancy at bound coordinates. */
export const observeBrainMission = (input: SoldierBrainInputV119): { status: string; mission: MissionObjective | null } => {
  const value = input.objective
  if (!value || typeof value !== "object" || Array.isArray(value)) return { status: "absent",mission: null }
  const o = value as unknown as MissionObjective
  const point = (p: unknown): p is Point => !!p && typeof p === "object" && !Array.isArray(p) && Object.keys(p).sort().join(",") === "x,y" && Number.isSafeInteger((p as Point).x) && Number.isSafeInteger((p as Point).y)
  if (Object.keys(o).sort().join(",") !== "expiresPhase,goal,goalFacing,issuedPhase,issuedRound,kind,partnerId,schemaVersion,soldierId,targetId,targetPosition" || o.schemaVersion !== "mission-v1" || !MISSION_KINDS.includes(o.kind) || o.soldierId !== input.self.id || !point(o.goal) || !BRAIN_DIRECTIONS.includes(o.goalFacing) || !Number.isSafeInteger(o.issuedPhase) || o.issuedPhase < 1 || o.expiresPhase !== o.issuedPhase+1 || ![1,2,3,4].includes(o.issuedRound) || ![o.soldierId,o.targetId,o.partnerId].every(id => typeof id === "string" && /^[\x20-\x7e]{0,128}$/.test(id)) || JSON.stringify(o).length > 1024 || (o.targetPosition !== null && !point(o.targetPosition))) return { status: "invalid",mission: null }
  const targeted = ["rear-entry","edge-push","screen","bait","pincer"].includes(o.kind)
  if (targeted !== (o.targetId !== "" && o.targetPosition !== null) || ["bait","pincer"].includes(o.kind) !== (o.partnerId !== "")) return { status: "invalid",mission: null }
  if (!input.self.position || input.self.status !== "ACTIVE") return { status: "failed",mission: null }
  if (o.targetPosition) {
    const cell = brainCell(input,o.targetPosition.x-input.self.position.x,o.targetPosition.y-input.self.position.y)
    if (cell && cell.contents !== (o.kind === "screen" ? "FRIENDLY_ACTIVE" : "ENEMY_ACTIVE")) return { status: "stale",mission: null }
  }
  const goalCell = brainCell(input,o.goal.x-input.self.position.x,o.goal.y-input.self.position.y)
  if (goalCell?.contents === "WALL") return { status: "stale",mission: null }
  const atGoal = distance(input.self.position,o.goal) === 0
  const complete = atGoal && o.kind !== "graph-cut-stone" && (o.kind !== "recovery" || input.self.facing === o.goalFacing)
  return { status: complete ? "complete" : "active",mission: o }
}

type BrainRank = { action: Action; hard: number[]; soft: number; ordinal: number }
const compareBrain = (a: BrainRank,b: BrainRank) => {
  for (let i = 0; i < 4; i++) if (a.hard[i] !== b.hard[i]) return b.hard[i]! - a.hard[i]!
  return b.soft-a.soft || a.ordinal-b.ordinal
}

/** Ranks intentions over visible geometry; returns no projected state, events,
 * canonical legality verdict or transition. Offline kernel fixtures adjudicate choices. */
const rankBrainAction = (input: SoldierBrainInputV119,action: Action,ordinal: number,mission: MissionObjective | null,optional: boolean): BrainRank => {
  const hard = [0,0,0,0]
  let soft = 0, dx = 0,dy = 0, facing = input.self.facing ?? "UP", advanceIntent = false
  const stoneGoal = mission?.kind === "graph-cut-stone" && input.self.position && distance(input.self.position,mission.goal) === 0
  if (action.type === "TURN_TO_STONE") {
    if (!stoneGoal) hard[0]! -= 1
    else soft += 100
    return { action,hard,soft,ordinal }
  }
  facing = action.direction
  const v = brainVector(action.direction)
  if (action.type === "MOVE") {
    if (input.self.lastSuccessfulMoveDirection === brainOpposite(action.direction)) hard[1]! -= 1
    const cell = brainCell(input,v.x,v.y), beyond = brainCell(input,v.x*2,v.y*2)
    if (!cell || cell.contents === "WALL") hard[0]! -= 2
    const activeContact = cell?.contents === "ENEMY_ACTIVE" || cell?.contents === "FRIENDLY_ACTIVE"
    const lateralContact = activeContact && cell.facing !== action.direction && cell.facing !== brainOpposite(action.direction)
    advanceIntent = cell?.contents === "EMPTY" || !!(lateralContact && (beyond?.contents === "EMPTY" || beyond?.contents === "WALL"))
    if (!advanceIntent) hard[3]! -= 1
    if (advanceIntent) { dx = v.x; dy = v.y }
    if (lateralContact && beyond?.contents === "WALL") {
      if (cell?.contents === "ENEMY_ACTIVE") soft += 100
      else hard[0]! -= 2
    }
  }
  const rear = brainVector(brainOpposite(facing))
  const behind = brainCell(input,dx+rear.x,dy+rear.y)
  if (behind?.contents === "ENEMY_ACTIVE") hard[0]! -= 1
  for (const enemy of input.awarenessGrid.cells) if (enemy.contents === "ENEMY_ACTIVE" && enemy.facing) {
    const e = brainVector(brainOpposite(enemy.facing))
    if (dx === enemy.dx+e.x && dy === enemy.dy+e.y) soft += 80
  }
  if (!input.hasAdvancedThisActivation) {
    if (input.cycleIndex >= input.maxCycles-1 && !advanceIntent) hard[2]! -= 1
    if (advanceIntent) soft += 5
  }
  if (mission && input.self.position) {
    const next = { x: input.self.position.x+dx,y: input.self.position.y+dy }
    if (mission.kind === "reserve" && input.hasAdvancedThisActivation && action.type === "MOVE") soft -= 12
    if (mission.kind === "recovery" && facing === mission.goalFacing) soft += 15
    if (stoneGoal) hard[3]! -= 1
    if (optional) {
      soft += (distance(input.self.position,mission.goal)-distance(next,mission.goal))*8
      if (distance(next,mission.goal) === 0 && facing === mission.goalFacing) soft += 4
    }
  }
  if (optional) {
    // Small visible-mobility preference, not an alternate simulation/search kernel.
    for (const d of BRAIN_DIRECTIONS) { const q = brainVector(d); if (brainCell(input,dx+q.x,dy+q.y)?.contents === "EMPTY") soft++ }
  }
  return { action,hard,soft,ordinal }
}

export const reserveBrainFallback = (input: SoldierBrainInputV119) => {
  const observation = observeBrainMission(input)
  const ranks = enumerateConcreteActions().map((action,ordinal) => rankBrainAction(input,action,ordinal,observation.mission,false))
  return { action: ranks.sort(compareBrain)[0]!.action,evaluations: 9,missionStatus: observation.status }
}

export const runPlannerSoldierBrain = (input: SoldierBrainInputV119,budget: { maxEvaluations: number } = { maxEvaluations: 64 }): SoldierBrainResult => {
  if (!Number.isSafeInteger(budget.maxEvaluations) || budget.maxEvaluations < 0 || budget.maxEvaluations > 64) throw new TypeError("BRAIN_BUDGET")
  const observed = observeBrainMission(input), actions = enumerateConcreteActions()
  // Nine mandatory evaluations reserve a complete safe choice before optional scoring.
  const reserved = actions.map((action,ordinal) => rankBrainAction(input,action,ordinal,observed.mission,false))
  let best = [...reserved].sort(compareBrain)[0]!, evaluations = 0
  const optional: BrainRank[] = []
  for (const [ordinal,action] of actions.entries()) {
    if (evaluations >= budget.maxEvaluations) break
    evaluations++
    optional.push(rankBrainAction(input,action,ordinal,observed.mission,true))
  }
  // Compare optional candidates against the reserved rank with identical hard gates.
  for (const rank of optional) if (compareBrain(rank,best) < 0) best = rank
  return { action: best.action,soldierMemory: { planner: { schemaVersion: "brain-v1",reservedEvaluations: 9,optionalEvaluations: evaluations,missionStatus: observed.status,authoritativeAdvance: input.hasAdvancedThisActivation } } }
}
