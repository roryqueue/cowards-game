import {
  INITIAL_BOUNDS,
  type ArenaVariant,
  type BoardBounds,
  type PlayerId,
  type Position,
  type Soldier,
} from "@cowards/spec"

export const createScenarioSoldier = (
  overrides: Partial<Soldier> & { id: string },
): Soldier => ({
  ownerPlayerId: "bottom",
  status: "ACTIVE",
  position: { x: 5, y: 5 },
  facing: "UP",
  lastSuccessfulMoveDirection: null,
  soldierMemory: {},
  ...overrides,
})

export const createScenarioStateParts = (
  overrides: {
    bounds?: BoardBounds
    bottomPlayerId?: PlayerId
    topPlayerId?: PlayerId
    soldiers?: Soldier[]
    terrainStones?: Position[]
    arenaVariant?: Partial<ArenaVariant>
  } = {},
) => {
  const bounds = overrides.bounds ?? INITIAL_BOUNDS
  const arenaVariant: ArenaVariant = {
    id: "scenario-arena",
    name: "Scenario Arena",
    initialBounds: bounds,
    terrainStones: overrides.terrainStones ?? [],
    ...overrides.arenaVariant,
  }

  return {
    bounds,
    bottomPlayerId: overrides.bottomPlayerId ?? "bottom-player",
    topPlayerId: overrides.topPlayerId ?? "top-player",
    soldiers: overrides.soldiers ?? [],
    terrainStones: overrides.terrainStones ?? [],
    arenaVariant,
  }
}

export const createEmptyBoardScenario = () => createScenarioStateParts()
