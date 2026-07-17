import {
  MAX_ACTIVATION_CYCLES,
  SoldierBrainInputSchema,
  SoldierBrainInputV119Schema,
  StrategyInputSchema,
  StrategyInputV119Schema,
  type AwarenessCell,
  type AwarenessCellContents,
  type AwarenessGrid5x5,
  type Direction,
  type JsonValue,
  type Soldier,
  type SoldierBrainInput,
  type SoldierBrainInputV119,
  type StrategyInput,
  type StrategyInputV119,
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
  runtimeAbiVersion?: string,
): StrategyInput =>
  (runtimeAbiVersion === "strategy-runtime-abi-v1.19"
    ? createStrategyInputV119(state, playerId)
    : StrategyInputSchema.parse(
        createStrategyInputValue(state, playerId),
      )) as StrategyInput

export const createStrategyInputV119 = (
  state: GameState,
  playerId: string,
): StrategyInputV119 => {
  const initialInitiativePlayerId = state.initialInitiativePlayerId
  if (initialInitiativePlayerId === undefined) {
    throw new Error("Successor GameState has no initial initiative owner.")
  }
  const base = createStrategyInputValue(state, playerId)
  return StrategyInputV119Schema.parse({
    ...base,
    initialInitiativePlayerId,
    hasInitialInitiative: initialInitiativePlayerId === playerId,
    roundInitiativePlayerId: state.initiativePlayerId,
    hasRoundInitiative: state.initiativePlayerId === playerId,
  })
}

const createStrategyInputValue = (state: GameState, playerId: string) => {
  const player = getPlayer(state, playerId)
  if (!player) {
    throw new Error(`Player not found: ${playerId}`)
  }
  const opponent = getOpponentPlayer(state, playerId)
  return {
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
  }
}

export const createSoldierBrainInput = (
  state: GameState,
  soldierId: string,
  cycleIndex: number,
  objective?: JsonValue,
  hasAdvancedThisActivation = false,
  runtimeAbiVersion?: string,
): SoldierBrainInput => {
  const soldier = getSoldier(state, soldierId)
  if (!soldier) {
    throw new Error(`Soldier not found: ${soldierId}`)
  }
  const value = {
    self: getSoldierSnapshot(soldier),
    awarenessGrid: createAwarenessGrid(state, soldier),
    cycleIndex,
    maxCycles: MAX_ACTIVATION_CYCLES,
    ...(objective === undefined ? {} : { objective }),
    soldierMemory: soldier.soldierMemory,
  }
  return (runtimeAbiVersion === "strategy-runtime-abi-v1.19"
    ? SoldierBrainInputV119Schema.parse({
        ...value,
        hasAdvancedThisActivation,
      })
    : SoldierBrainInputSchema.parse(value)) as SoldierBrainInput
}

export const createSoldierBrainInputV119 = (
  state: GameState,
  soldierId: string,
  cycleIndex: number,
  hasAdvancedThisActivation: boolean,
  objective?: JsonValue,
): SoldierBrainInputV119 =>
  createSoldierBrainInput(
    state,
    soldierId,
    cycleIndex,
    objective,
    hasAdvancedThisActivation,
    "strategy-runtime-abi-v1.19",
  ) as SoldierBrainInputV119
