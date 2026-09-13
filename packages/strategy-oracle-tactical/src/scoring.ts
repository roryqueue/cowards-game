import type { Action, Direction, SoldierBrainInputV119, StrategyInputV119 } from "@cowards/spec"

export type TacticalPoint = Readonly<{ x: number; y: number }>
export type TacticalMission = Readonly<{
  schemaVersion: "tactical-mission-v1"
  soldierId: string
  targetId: string | null
  goal: TacticalPoint
  goalFacing: Direction
  posture: "press" | "screen" | "recover"
}>

export type TacticalRank = Readonly<{ hard: readonly number[]; soft: number; key: string }>

export const TACTICAL_DIRECTIONS: readonly Direction[] = ["UP", "RIGHT", "DOWN", "LEFT"]

export const tacticalDistance = (left: TacticalPoint, right: TacticalPoint): number =>
  Math.abs(left.x - right.x) + Math.abs(left.y - right.y)

export const compareTacticalRanks = (left: TacticalRank, right: TacticalRank): number => {
  for (let index = 0; index < Math.max(left.hard.length, right.hard.length); index++) {
    const difference = (right.hard[index] ?? 0) - (left.hard[index] ?? 0)
    if (difference !== 0) return difference
  }
  return right.soft - left.soft || left.key.localeCompare(right.key)
}

const directionToward = (from: TacticalPoint, to: TacticalPoint, fallback: Direction): Direction => {
  const horizontal = to.x - from.x
  const vertical = to.y - from.y
  if (Math.abs(horizontal) >= Math.abs(vertical) && horizontal !== 0) return horizontal > 0 ? "RIGHT" : "LEFT"
  if (vertical !== 0) return vertical > 0 ? "DOWN" : "UP"
  return fallback
}

const stepToward = (from: TacticalPoint, to: TacticalPoint, bounds: StrategyInputV119["board"]["bounds"]): TacticalPoint => {
  const direction = directionToward(from, to, "UP")
  const delta = direction === "UP" ? { x: 0, y: -1 } : direction === "DOWN" ? { x: 0, y: 1 } : direction === "LEFT" ? { x: -1, y: 0 } : { x: 1, y: 0 }
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, from.x + delta.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, from.y + delta.y)),
  }
}

const activeEnemies = (input: StrategyInputV119) => input.enemySoldiers.filter((soldier) => soldier.status === "ACTIVE" && soldier.position !== null)

const nearestEnemy = (input: StrategyInputV119, origin: TacticalPoint) =>
  activeEnemies(input)
    .map((enemy) => ({ enemy, distance: tacticalDistance(origin, enemy.position!) }))
    .sort((left, right) => left.distance - right.distance || left.enemy.id.localeCompare(right.enemy.id))[0]

/** Scores a legal board observation without predicting a transition or consulting hidden state. */
export const scoreTacticalMission = (input: StrategyInputV119, soldierId: string): Readonly<{ mission: TacticalMission; rank: TacticalRank }> => {
  const soldier = input.mySoldiers.find((candidate) => candidate.id === soldierId)
  if (!soldier || soldier.status !== "ACTIVE" || soldier.position === null) throw new TypeError("TACTICAL_SOLDIER")
  const enemy = nearestEnemy(input, soldier.position)
  const center = {
    x: Math.trunc((input.board.bounds.minX + input.board.bounds.maxX) / 2),
    y: Math.trunc((input.board.bounds.minY + input.board.bounds.maxY) / 2),
  }
  const objective = enemy?.enemy.position ?? center
  const distance = tacticalDistance(soldier.position, objective)
  const edge = Math.min(
    soldier.position.x - input.board.bounds.minX,
    input.board.bounds.maxX - soldier.position.x,
    soldier.position.y - input.board.bounds.minY,
    input.board.bounds.maxY - soldier.position.y,
  )
  const underThreat = enemy !== undefined && enemy.distance <= 1
  const posture: TacticalMission["posture"] = underThreat ? "recover" : enemy === undefined ? "screen" : "press"
  const goal = underThreat ? stepToward(objective, soldier.position, input.board.bounds) : stepToward(soldier.position, objective, input.board.bounds)
  const mission: TacticalMission = {
    schemaVersion: "tactical-mission-v1",
    soldierId,
    targetId: enemy?.enemy.id ?? null,
    goal,
    goalFacing: directionToward(soldier.position, objective, soldier.facing ?? "UP"),
    posture,
  }
  return {
    mission,
    rank: {
      hard: [underThreat ? -1 : 0, soldier.status === "ACTIVE" ? 0 : -1],
      soft: (input.hasRoundInitiative ? 3 : 0) + (input.hasInitialInitiative ? 1 : 0) + edge * 3 - distance * 4 + (posture === "press" ? 8 : posture === "screen" ? 3 : -2),
      key: soldierId,
    },
  }
}

const vector = (direction: Direction): TacticalPoint => direction === "UP" ? { x: 0, y: -1 } : direction === "DOWN" ? { x: 0, y: 1 } : direction === "LEFT" ? { x: -1, y: 0 } : { x: 1, y: 0 }
const localCell = (input: SoldierBrainInputV119, point: TacticalPoint) => input.awarenessGrid.cells.find((cell) => cell.dx === point.x && cell.dy === point.y)

/** Scores each Action exclusively from the local legal observation and tactical objective. */
export const scoreTacticalAction = (input: SoldierBrainInputV119, action: Action, mission: TacticalMission | null, ordinal: number): TacticalRank => {
  const facing = action.type === "TURN_TO_STONE" ? input.self.facing ?? "UP" : action.direction
  const delta = vector(facing)
  const next = action.type === "MOVE" ? delta : { x: 0, y: 0 }
  const cell = action.type === "MOVE" ? localCell(input, delta) : undefined
  const goalDistance = mission && input.self.position ? tacticalDistance({ x: input.self.position.x + next.x, y: input.self.position.y + next.y }, mission.goal) : 0
  const blocked = action.type === "MOVE" && (!cell || cell.contents === "WALL" || cell.contents === "FRIENDLY_ACTIVE" || cell.contents === "FRIENDLY_STONE" || cell.contents === "TERRAIN_STONE")
  const enemyContact = cell?.contents === "ENEMY_ACTIVE"
  const goalFacing = mission?.goalFacing === facing
  const terminalTurn = action.type === "TURN_TO_STONE" && mission?.posture === "recover" && input.cycleIndex >= input.maxCycles - 1
  return {
    hard: [blocked ? -2 : 0, action.type === "MOVE" && input.hasAdvancedThisActivation ? -1 : 0, terminalTurn ? 1 : 0],
    soft: (enemyContact ? 12 : 0) + (goalFacing ? 6 : 0) - goalDistance * 3 + (action.type === "MOVE" ? 4 : action.type === "TURN" ? 1 : -1),
    key: `${ordinal}:${action.type}:${facing}`,
  }
}

export const tacticalActionChoices = (): readonly Action[] => [
  ...TACTICAL_DIRECTIONS.map((direction) => ({ type: "MOVE" as const, direction })),
  ...TACTICAL_DIRECTIONS.map((direction) => ({ type: "TURN" as const, direction })),
  { type: "TURN_TO_STONE" as const },
]
