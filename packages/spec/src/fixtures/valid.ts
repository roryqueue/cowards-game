import {
  BOTTOM_STARTING_POSITIONS,
  INITIAL_BOUNDS,
  MAX_ACTIVATION_CYCLES,
  TOP_STARTING_POSITIONS,
} from "../constants.js"
import {
  ArenaVariantSchema,
  PositionSchema,
  SoldierBrainInputSchema,
  SoldierSchema,
  StrategyInputSchema,
} from "../schemas.js"
import type {
  ArenaVariant,
  AwarenessCell,
  Direction,
  PlayerId,
  Position,
  Soldier,
  SoldierBrainInput,
  StrategyInput,
} from "../types.js"

export const sampleSeed = "cowards-seed-0001"

export const createPosition = (position: Position): Position =>
  PositionSchema.parse(position)

export const emptyArena12x12: ArenaVariant = {
  id: "arena-empty-12x12",
  name: "Empty 12x12",
  initialBounds: INITIAL_BOUNDS,
  terrainStones: [],
}

export const createArenaVariant = (
  arenaVariant: ArenaVariant = emptyArena12x12,
): ArenaVariant => ArenaVariantSchema.parse(arenaVariant)

export const standardArenaVariant = createArenaVariant()

export const createSoldier = (soldier: Soldier): Soldier =>
  SoldierSchema.parse(soldier) as Soldier

const createStartingSoldiers = (
  ownerPlayerId: PlayerId,
  prefix: string,
  positions: readonly Position[],
  facing: Direction,
): Soldier[] =>
  positions.map((position, index) =>
    createSoldier({
      id: `${prefix}-${index + 1}`,
      ownerPlayerId,
      status: "ACTIVE",
      position,
      facing,
      lastSuccessfulMoveDirection: null,
      soldierMemory: {},
    }),
  )

export const standardInitialSoldiers = [
  ...createStartingSoldiers(
    "bottom",
    "bottom-soldier",
    BOTTOM_STARTING_POSITIONS,
    "UP",
  ),
  ...createStartingSoldiers(
    "top",
    "top-soldier",
    TOP_STARTING_POSITIONS,
    "DOWN",
  ),
]

const toSnapshot = ({
  soldierMemory: _soldierMemory,
  ...snapshot
}: Soldier): Omit<Soldier, "soldierMemory"> => snapshot

const emptyAwarenessCells = (): AwarenessCell[] => {
  const cells: AwarenessCell[] = []
  for (const dy of [-2, -1, 0, 1, 2] as const) {
    for (const dx of [-2, -1, 0, 1, 2] as const) {
      cells.push({
        dx,
        dy,
        absoluteX: 5 + dx,
        absoluteY: 5 + dy,
        contents: dx === 0 && dy === 0 ? "FRIENDLY_ACTIVE" : "EMPTY",
        ...(dx === 0 && dy === 0 ? { facing: "UP" as const } : {}),
      })
    }
  }
  return cells
}

const bottomSoldiers = standardInitialSoldiers.filter(
  (soldier) => soldier.ownerPlayerId === "bottom",
)
const topSoldiers = standardInitialSoldiers.filter(
  (soldier) => soldier.ownerPlayerId === "top",
)

export const standardStrategyInput: StrategyInput = StrategyInputSchema.parse({
  phaseNumber: 1,
  roundNumber: 1,
  activationCount: 1,
  board: {
    bounds: INITIAL_BOUNDS,
    soldiers: standardInitialSoldiers.map(toSnapshot),
    terrainStones: [],
  },
  mySoldiers: bottomSoldiers.map(toSnapshot),
  enemySoldiers: topSoldiers.map(toSnapshot),
  strategyMemory: {},
}) as StrategyInput

export const standardSoldierBrainInput: SoldierBrainInput =
  SoldierBrainInputSchema.parse({
    self: toSnapshot(bottomSoldiers[0]!),
    awarenessGrid: {
      cells: emptyAwarenessCells(),
    },
    cycleIndex: 0,
    maxCycles: MAX_ACTIVATION_CYCLES,
    objective: { role: "advance" },
    soldierMemory: {},
  }) as SoldierBrainInput

export const blockedMovementScenario = {
  name: "blocked movement into TerrainStone",
  mover: createSoldier({
    id: "mover",
    ownerPlayerId: "bottom",
    status: "ACTIVE",
    position: { x: 5, y: 5 },
    facing: "UP",
    lastSuccessfulMoveDirection: null,
    soldierMemory: {},
  }),
  terrainStones: [{ x: 5, y: 4 }],
}

export const sidePushScenario = {
  name: "side push against active Soldier",
  mover: createSoldier({
    id: "mover",
    ownerPlayerId: "bottom",
    status: "ACTIVE",
    position: { x: 4, y: 5 },
    facing: "RIGHT",
    lastSuccessfulMoveDirection: null,
    soldierMemory: {},
  }),
  target: createSoldier({
    id: "target",
    ownerPlayerId: "top",
    status: "ACTIVE",
    position: { x: 5, y: 5 },
    facing: "UP",
    lastSuccessfulMoveDirection: null,
    soldierMemory: {},
  }),
}

export const backstabScenario = {
  name: "advance into enemy behind-square",
  attacker: createSoldier({
    id: "attacker",
    ownerPlayerId: "bottom",
    status: "ACTIVE",
    position: { x: 5, y: 7 },
    facing: "UP",
    lastSuccessfulMoveDirection: null,
    soldierMemory: {},
  }),
  target: createSoldier({
    id: "target",
    ownerPlayerId: "top",
    status: "ACTIVE",
    position: { x: 5, y: 5 },
    facing: "UP",
    lastSuccessfulMoveDirection: null,
    soldierMemory: {},
  }),
}

export const offBoardFallScenario = {
  name: "move off current board",
  mover: createSoldier({
    id: "edge-mover",
    ownerPlayerId: "bottom",
    status: "ACTIVE",
    position: { x: 0, y: 0 },
    facing: "UP",
    lastSuccessfulMoveDirection: null,
    soldierMemory: {},
  }),
  action: { type: "MOVE", direction: "UP" } as const,
}

export const contractionScenario = {
  name: "soldiers outside contracted bounds fall",
  boundsBefore: INITIAL_BOUNDS,
  boundsAfter: { minX: 1, maxX: 10, minY: 1, maxY: 10 },
  vulnerableSoldier: createSoldier({
    id: "edge-soldier",
    ownerPlayerId: "bottom",
    status: "ACTIVE",
    position: { x: 0, y: 5 },
    facing: "UP",
    lastSuccessfulMoveDirection: null,
    soldierMemory: {},
  }),
}

export const noAdvanceStoningScenario = {
  name: "activation ends without Advance",
  soldier: createSoldier({
    id: "turn-only",
    ownerPlayerId: "bottom",
    status: "ACTIVE",
    position: { x: 5, y: 5 },
    facing: "UP",
    lastSuccessfulMoveDirection: null,
    soldierMemory: {},
  }),
  actions: [{ type: "TURN", direction: "LEFT" }] as const,
}
