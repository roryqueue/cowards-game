import type {
  BoardBounds,
  Direction,
  FullBoardSnapshot,
  PlayerId,
  Position,
  Soldier,
  SoldierSnapshot,
} from "@cowards/spec"
import type { GameState } from "./types.js"

export const positionKey = ({ x, y }: Position): string => `${x},${y}`

export const samePosition = (a: Position, b: Position): boolean =>
  a.x === b.x && a.y === b.y

export const isWithinBounds = (
  { x, y }: Position,
  bounds: BoardBounds,
): boolean =>
  x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY

export const getOccupyingSoldier = (
  state: GameState,
  position: Position,
): Soldier | undefined =>
  state.soldiers.find(
    (soldier) =>
      soldier.status !== "FALLEN" &&
      soldier.position !== null &&
      samePosition(soldier.position, position),
  )

export const getTerrainStoneAt = (
  state: GameState,
  position: Position,
): Position | undefined =>
  state.terrainStones.find((terrainStone) =>
    samePosition(terrainStone, position),
  )

export const getSoldier = (
  state: GameState,
  soldierId: string,
): Soldier | undefined =>
  state.soldiers.find((soldier) => soldier.id === soldierId)

export const getPlayer = (state: GameState, playerId: PlayerId) =>
  state.players.find((player) => player.id === playerId)

export const getOpponentPlayer = (state: GameState, playerId: PlayerId) => {
  const opponent = state.players.find((player) => player.id !== playerId)
  if (!opponent) {
    throw new Error(`Opponent not found for player ${playerId}`)
  }
  return opponent
}

export const getActiveSoldiers = (
  state: GameState,
  playerId?: PlayerId,
): Soldier[] =>
  state.soldiers.filter(
    (soldier) =>
      soldier.status === "ACTIVE" &&
      (playerId === undefined || soldier.ownerPlayerId === playerId),
  )

export const getSoldierSnapshot = ({
  id,
  ownerPlayerId,
  status,
  position,
  facing,
  lastSuccessfulMoveDirection,
}: Soldier): SoldierSnapshot => ({
  id,
  ownerPlayerId,
  status,
  position,
  facing,
  lastSuccessfulMoveDirection,
})

export const getFullBoardSnapshot = (state: GameState): FullBoardSnapshot => ({
  bounds: state.bounds,
  soldiers: state.soldiers.map(getSoldierSnapshot),
  terrainStones: state.terrainStones,
})

export const getBehindSquare = (soldier: Soldier): Position | null => {
  if (soldier.position === null || soldier.facing === null) {
    return null
  }

  switch (soldier.facing) {
    case "UP":
      return { x: soldier.position.x, y: soldier.position.y + 1 }
    case "DOWN":
      return { x: soldier.position.x, y: soldier.position.y - 1 }
    case "LEFT":
      return { x: soldier.position.x + 1, y: soldier.position.y }
    case "RIGHT":
      return { x: soldier.position.x - 1, y: soldier.position.y }
  }
}

export const countActiveByPlayer = (
  state: GameState,
): Map<PlayerId, number> => {
  const counts = new Map<PlayerId, number>(
    state.players.map((player) => [player.id, 0]),
  )
  for (const soldier of state.soldiers) {
    if (soldier.status === "ACTIVE") {
      counts.set(
        soldier.ownerPlayerId,
        (counts.get(soldier.ownerPlayerId) ?? 0) + 1,
      )
    }
  }
  return counts
}

export const directionDelta = (direction: Direction): Position => {
  switch (direction) {
    case "UP":
      return { x: 0, y: -1 }
    case "DOWN":
      return { x: 0, y: 1 }
    case "LEFT":
      return { x: -1, y: 0 }
    case "RIGHT":
      return { x: 1, y: 0 }
  }
}

export const movePosition = (
  position: Position,
  direction: Direction,
): Position => {
  const delta = directionDelta(direction)
  return { x: position.x + delta.x, y: position.y + delta.y }
}

export const oppositeDirection = (direction: Direction): Direction => {
  switch (direction) {
    case "UP":
      return "DOWN"
    case "DOWN":
      return "UP"
    case "LEFT":
      return "RIGHT"
    case "RIGHT":
      return "LEFT"
  }
}

export const replaceSoldier = (
  state: GameState,
  updatedSoldier: Soldier,
): GameState => ({
  ...state,
  soldiers: state.soldiers.map((soldier) =>
    soldier.id === updatedSoldier.id ? updatedSoldier : soldier,
  ),
})

export const replaceSoldiers = (
  state: GameState,
  updatedSoldiers: Soldier[],
): GameState => {
  const byId = new Map(updatedSoldiers.map((soldier) => [soldier.id, soldier]))
  return {
    ...state,
    soldiers: state.soldiers.map((soldier) => byId.get(soldier.id) ?? soldier),
  }
}
