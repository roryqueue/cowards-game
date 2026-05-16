import {
  ArenaVariantSchema,
  BOTTOM_STARTING_POSITIONS,
  COMPATIBILITY_VERSIONS,
  ROUND_ACTIVATION_COUNTS,
  TOP_STARTING_POSITIONS,
  type Direction,
  type PlayerId,
  type Position,
  type Soldier,
} from "@cowards/spec"
import type {
  CreateInitialGameStateInput,
  EnginePlayer,
  GameState,
  PlayerSide,
} from "./types.js"

const seedHash = (seed: string): number => {
  let hash = 0
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return hash
}

export const getInitialInitiativePlayerId = (
  seed: string,
  bottomPlayerId: PlayerId,
  topPlayerId: PlayerId,
): PlayerId => (seedHash(seed) % 2 === 0 ? bottomPlayerId : topPlayerId)

const createPlayer = (
  id: PlayerId,
  side: PlayerSide,
  strategyRevisionId: string,
): EnginePlayer => ({
  id,
  side,
  strategyRevisionId,
  strategyMemory: {},
})

const createStartingSoldiers = (
  ownerPlayerId: PlayerId,
  side: PlayerSide,
  positions: readonly Position[],
  facing: Direction,
): Soldier[] =>
  positions.map((position, index) => ({
    id: `${side}-soldier-${index + 1}`,
    ownerPlayerId,
    status: "ACTIVE",
    position,
    facing,
    lastSuccessfulMoveDirection: null,
    soldierMemory: {},
  }))

export const createInitialGameState = (
  input: CreateInitialGameStateInput,
): GameState => {
  const arenaVariant = ArenaVariantSchema.parse(input.arenaVariant)
  const bottomPlayer = createPlayer(
    input.bottomPlayerId,
    "bottom",
    input.bottomStrategyRevisionId,
  )
  const topPlayer = createPlayer(
    input.topPlayerId,
    "top",
    input.topStrategyRevisionId,
  )

  return {
    matchId: input.matchId,
    seed: input.seed,
    versions: COMPATIBILITY_VERSIONS,
    arenaVariant,
    players: [bottomPlayer, topPlayer],
    phase: "ROUND",
    phaseNumber: 1,
    roundNumber: 1,
    activationCount: ROUND_ACTIVATION_COUNTS[1],
    initiativePlayerId: getInitialInitiativePlayerId(
      input.seed,
      input.bottomPlayerId,
      input.topPlayerId,
    ),
    bounds: arenaVariant.initialBounds,
    soldiers: [
      ...createStartingSoldiers(
        input.bottomPlayerId,
        "bottom",
        BOTTOM_STARTING_POSITIONS,
        "UP",
      ),
      ...createStartingSoldiers(
        input.topPlayerId,
        "top",
        TOP_STARTING_POSITIONS,
        "DOWN",
      ),
    ],
    terrainStones: arenaVariant.terrainStones,
  }
}
