import type { StrategyInputV119, Direction } from "@cowards/spec"

export const MISSION_KINDS = ["evacuation", "rear-entry", "edge-push", "screen", "anchor", "graph-cut-stone", "reserve", "recovery", "bait", "pincer"] as const
export type MissionKind = typeof MISSION_KINDS[number]
export type Point = { x: number; y: number }
export type MissionObjective = {
  schemaVersion: "mission-v1"; kind: MissionKind; soldierId: string
  issuedPhase: number; issuedRound: number; expiresPhase: number
  goal: Point; goalFacing: Direction; targetId: string; targetPosition: Point | null; partnerId: string
}
export const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
export const samePoint = (a: Point | null, b: Point | null) => a !== null && b !== null && a.x === b.x && a.y === b.y
export const compareIds = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
export const inside = (p: Point, input: StrategyInputV119) => p.x >= input.board.bounds.minX && p.x <= input.board.bounds.maxX && p.y >= input.board.bounds.minY && p.y <= input.board.bounds.maxY
export const edgeDistance = (p: Point, input: StrategyInputV119) => Math.min(p.x - input.board.bounds.minX, input.board.bounds.maxX - p.x, p.y - input.board.bounds.minY, input.board.bounds.maxY - p.y)
const vector = (d: Direction): Point => d === "UP" ? { x: 0, y: -1 } : d === "DOWN" ? { x: 0, y: 1 } : d === "LEFT" ? { x: -1, y: 0 } : { x: 1, y: 0 }
const toward = (a: Point, b: Point): Direction => Math.abs(b.x - a.x) > Math.abs(b.y - a.y) ? b.x > a.x ? "RIGHT" : "LEFT" : b.y > a.y ? "DOWN" : "UP"

/** Visible occupancy graph only; this scores a potential obstruction, never resolves an Action. */
export const cutPreference = (p: Point, input: StrategyInputV119) => {
  const free = (q: Point) => inside(q, input) && !input.board.terrainStones.some(t => samePoint(t, q)) && !input.board.soldiers.some(s => s.status !== "FALLEN" && samePoint(s.position, q))
  const neighbors = [{ x: p.x - 1, y: p.y }, { x: p.x + 1, y: p.y }, { x: p.x, y: p.y - 1 }, { x: p.x, y: p.y + 1 }].filter(free)
  // Bounded local connectivity: count neighbor pairs whose two-step detour is blocked.
  let separated = 0
  for (let i = 0; i < neighbors.length; i++) for (let j = i + 1; j < neighbors.length; j++) {
    const a = neighbors[i]!, b = neighbors[j]!
    if (a.x === b.x || a.y === b.y || !free({ x: a.x + b.x - p.x, y: a.y + b.y - p.y })) separated++
  }
  return separated
}

export const createMission = (kind: MissionKind, input: StrategyInputV119, soldierId: string): MissionObjective | null => {
  const self = input.mySoldiers.find(s => s.id === soldierId)
  if (!self?.position || self.status !== "ACTIVE") return null
  const p = self.position, bounds = input.board.bounds
  const enemies = input.enemySoldiers.filter(s => s.status === "ACTIVE" && s.position).sort((a, b) => distance(p, a.position!) - distance(p, b.position!) || compareIds(a.id, b.id))
  const allies = input.mySoldiers.filter(s => s.id !== soldierId && s.status === "ACTIVE" && s.position).sort((a, b) => distance(p, a.position!) - distance(p, b.position!) || compareIds(a.id, b.id))
  const enemy = enemies[0], ally = allies[0]
  const center = { x: Math.floor((bounds.minX + bounds.maxX) / 2), y: Math.floor((bounds.minY + bounds.maxY) / 2) }
  let goal = { ...p }, goalFacing = self.facing ?? "UP", target = enemy, partnerId = ""
  switch (kind) {
    case "evacuation": goal = center; target = undefined; break
    case "rear-entry": if (!enemy?.position) return null; { const v = vector(enemy.facing ?? "UP"); goal = { x: enemy.position.x - v.x, y: enemy.position.y - v.y } } break
    case "edge-push": if (!enemy?.position) return null; {
      const e = enemy.position
      const edges = [{ gap: e.x - bounds.minX, x: e.x + 1, y: e.y }, { gap: bounds.maxX - e.x, x: e.x - 1, y: e.y }, { gap: e.y - bounds.minY, x: e.x, y: e.y + 1 }, { gap: bounds.maxY - e.y, x: e.x, y: e.y - 1 }].sort((a,b) => a.gap-b.gap || a.x-b.x || a.y-b.y)
      goal = { x: edges[0]!.x, y: edges[0]!.y }; goalFacing = toward(goal, e)
    } break
    case "screen": if (!ally?.position || !enemy?.position) return null; target = ally; goal = { x: Math.floor((ally.position.x + enemy.position.x) / 2), y: Math.floor((ally.position.y + enemy.position.y) / 2) }; goalFacing = toward(goal, enemy.position); break
    case "anchor": goal = center; goalFacing = enemy?.position ? toward(center, enemy.position) : goalFacing; target = undefined; break
    case "graph-cut-stone": {
      const candidates = [p, { x: p.x - 1, y: p.y }, { x: p.x + 1, y: p.y }, { x: p.x, y: p.y - 1 }, { x: p.x, y: p.y + 1 }].filter(q => inside(q,input) && !input.board.terrainStones.some(t => samePoint(t,q)) && !input.board.soldiers.some(s => s.id !== self.id && s.status !== "FALLEN" && samePoint(s.position,q)))
      goal = candidates.sort((a,b) => cutPreference(b,input)-cutPreference(a,input) || distance(p,a)-distance(p,b) || a.x-b.x || a.y-b.y)[0] ?? p; target = undefined
    } break
    case "reserve": target = undefined; break
    case "recovery": goalFacing = enemy?.position ? toward(p, enemy.position) : toward(p, center); target = undefined; break
    case "bait": if (!enemy?.position || !ally?.position) return null; goal = { x: ally.position.x, y: ally.position.y + (enemy.position.y <= ally.position.y ? -1 : 1) }; partnerId = ally.id; break
    case "pincer": if (!enemy?.position || !ally?.position) return null; goal = { x: enemy.position.x + (ally.position.x >= enemy.position.x ? -1 : 1), y: enemy.position.y }; partnerId = ally.id; goalFacing = toward(goal, enemy.position); break
  }
  if (!inside(goal, input)) return null
  const objective: MissionObjective = { schemaVersion: "mission-v1", kind, soldierId, issuedPhase: input.phaseNumber, issuedRound: input.roundNumber, expiresPhase: input.phaseNumber + 1, goal, goalFacing, targetId: target?.id ?? "", targetPosition: target?.position ? { ...target.position } : null, partnerId }
  return validateMission(objective, input) ? objective : null
}

/** Known ASCII fields make JSON length exactly canonical UTF-8 length, independent of key order. */
export const validateMission = (value: unknown, input: StrategyInputV119): value is MissionObjective => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const o = value as MissionObjective
  if (Object.keys(o).sort().join(",") !== "expiresPhase,goal,goalFacing,issuedPhase,issuedRound,kind,partnerId,schemaVersion,soldierId,targetId,targetPosition") return false
  const point = (p: unknown): p is Point => !!p && typeof p === "object" && Object.keys(p).sort().join(",") === "x,y" && Number.isSafeInteger((p as Point).x) && Number.isSafeInteger((p as Point).y) && inside(p as Point,input)
  if (o.schemaVersion !== "mission-v1" || !MISSION_KINDS.includes(o.kind) || !["UP","DOWN","LEFT","RIGHT"].includes(o.goalFacing) || !point(o.goal) || (o.targetPosition !== null && !point(o.targetPosition))) return false
  if (![o.soldierId,o.targetId,o.partnerId].every(id => typeof id === "string" && /^[\x20-\x7e]{0,128}$/.test(id))) return false
  if (!Number.isSafeInteger(o.issuedPhase) || o.issuedPhase < 1 || o.expiresPhase !== o.issuedPhase + 1 || ![1,2,3,4].includes(o.issuedRound)) return false
  if (!input.mySoldiers.some(s => s.id === o.soldierId) || (o.targetId && !input.board.soldiers.some(s => s.id === o.targetId)) || (o.partnerId && !input.mySoldiers.some(s => s.id === o.partnerId && s.id !== o.soldierId))) return false
  if ((o.targetId === "") !== (o.targetPosition === null)) return false
  const enemyTarget = ["rear-entry","edge-push","bait","pincer"].includes(o.kind)
  if (enemyTarget && !input.enemySoldiers.some(s => s.id === o.targetId)) return false
  if (o.kind === "screen" && !input.mySoldiers.some(s => s.id === o.targetId && s.id !== o.soldierId)) return false
  if (!enemyTarget && o.kind !== "screen" && o.targetId !== "") return false
  if (["bait","pincer"].includes(o.kind) !== (o.partnerId !== "")) return false
  return JSON.stringify(o).length <= 1024
}

export const evaluateMission = (o: MissionObjective, input: StrategyInputV119): { status: "active" | "complete" | "stale" | "failed"; reason: string } => {
  if (!validateMission(o, input)) return { status: "stale", reason: "invalid-objective" }
  const self = input.mySoldiers.find(s => s.id === o.soldierId)!
  if (self.status === "FALLEN" || !self.position) return { status: "failed", reason: "soldier-lost" }
  if (input.phaseNumber < o.issuedPhase || input.phaseNumber > o.expiresPhase || (input.phaseNumber === o.issuedPhase && input.roundNumber < o.issuedRound)) return { status: "stale", reason: "expired" }
  const target = input.board.soldiers.find(s => s.id === o.targetId)
  if (target && (target.status !== "ACTIVE" || !target.position)) return { status: "failed", reason: "target-unavailable" }
  if (target && !samePoint(target.position,o.targetPosition)) return { status: "stale", reason: "target-moved" }
  if (o.partnerId && !input.mySoldiers.some(s => s.id === o.partnerId && s.status === "ACTIVE")) return { status: "failed", reason: "partner-lost" }
  if (self.status === "STONE" && o.kind !== "graph-cut-stone") return { status: "failed", reason: "soldier-immobile" }
  const reached = samePoint(self.position,o.goal)
  const complete = o.kind === "graph-cut-stone" ? reached && self.status === "STONE" : o.kind === "reserve" ? reached && (input.phaseNumber > o.issuedPhase || input.roundNumber > o.issuedRound) : o.kind === "recovery" ? reached && self.facing === o.goalFacing : reached
  return { status: complete ? "complete" : "active", reason: complete ? `goal-${o.kind}` : `pursue-${o.kind}` }
}

export const fallbackMission = (input: StrategyInputV119, soldierId: string): MissionObjective => {
  const mission = createMission("reserve",input,soldierId)
  if (!mission) throw new TypeError("MISSION_NO_ACTIVE_SOLDIER")
  return mission
}
