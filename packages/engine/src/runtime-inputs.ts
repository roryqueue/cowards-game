import {
  MAX_ACTIVATION_CYCLES,
  SoldierBrainInputSchema,
  StrategyInputSchema,
  type AwarenessCell,
  type AwarenessCellContents,
  type AwarenessGrid5x5,
  type Direction,
  type JsonValue,
  type Soldier,
  type SoldierBrainInput,
  type StrategyInput,
} from "@cowards/spec"
import {
  getFullBoardSnapshot,
  getOccupyingSoldier,
  getOpponentPlayer,
  getPlayer,
  getSoldier,
  getSoldierSnapshot,
  getTerrainStoneAt,
  isWithinBounds,
} from "./selectors.js"
import type { GameState } from "./types.js"

const awarenessContents = (
  state: GameState,
  self: Soldier,
  absoluteX: number,
  absoluteY: number,
): { contents: AwarenessCellContents; facing?: Direction | undefined } => {
  const position = { x: absoluteX, y: absoluteY }
  if (!isWithinBounds(position, state.bounds)) {
    return { contents: "WALL" }
  }
  if (getTerrainStoneAt(state, position)) {
    return { contents: "TERRAIN_STONE" }
  }
  const occupying = getOccupyingSoldier(state, position)
  if (!occupying) {
    return { contents: "EMPTY" }
  }
  const friendly = occupying.ownerPlayerId === self.ownerPlayerId
  const kind = occupying.status === "STONE" ? "STONE" : "ACTIVE"
  return {
    contents:
      `${friendly ? "FRIENDLY" : "ENEMY"}_${kind}` as AwarenessCellContents,
    ...(occupying.facing ? { facing: occupying.facing } : {}),
  }
}

export const createAwarenessGrid = (
  state: GameState,
  soldier: Soldier,
): AwarenessGrid5x5 => {
  if (soldier.position === null) {
    return { cells: [] }
  }

  const cells: AwarenessCell[] = []
  for (const dy of [-2, -1, 0, 1, 2] as const) {
    for (const dx of [-2, -1, 0, 1, 2] as const) {
      const absoluteX = soldier.position.x + dx
      const absoluteY = soldier.position.y + dy
      cells.push({
        dx,
        dy,
        absoluteX,
        absoluteY,
        ...awarenessContents(state, soldier, absoluteX, absoluteY),
      })
    }
  }
  return { cells }
}

export const createStrategyInput = (
  state: GameState,
  playerId: string,
): StrategyInput => {
  const player = getPlayer(state, playerId)
  if (!player) {
    throw new Error(`Player not found: ${playerId}`)
  }
  const opponent = getOpponentPlayer(state, playerId)
  return StrategyInputSchema.parse({
    phaseNumber: state.phaseNumber,
    roundNumber: state.roundNumber,
    activationCount: state.activationCount,
    board: getFullBoardSnapshot(state),
    mySoldiers: state.soldiers
      .filter((soldier) => soldier.ownerPlayerId === playerId)
      .map(getSoldierSnapshot),
    enemySoldiers: state.soldiers
      .filter((soldier) => soldier.ownerPlayerId === opponent.id)
      .map(getSoldierSnapshot),
    strategyMemory: player.strategyMemory,
  }) as StrategyInput
}

export const createSoldierBrainInput = (
  state: GameState,
  soldierId: string,
  cycleIndex: number,
  objective?: JsonValue,
): SoldierBrainInput => {
  const soldier = getSoldier(state, soldierId)
  if (!soldier) {
    throw new Error(`Soldier not found: ${soldierId}`)
  }
  return SoldierBrainInputSchema.parse({
    self: getSoldierSnapshot(soldier),
    awarenessGrid: createAwarenessGrid(state, soldier),
    cycleIndex,
    maxCycles: MAX_ACTIVATION_CYCLES,
    ...(objective === undefined ? {} : { objective }),
    soldierMemory: soldier.soldierMemory,
  }) as SoldierBrainInput
}
