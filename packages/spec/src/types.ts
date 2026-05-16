export type JsonPrimitive = string | number | boolean | null
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue }

export type PlayerId = string
export type SoldierId = string
export type StrategyId = string
export type StrategyRevisionId = string
export type MatchId = string
export type MatchSetId = string
export type ArenaVariantId = string

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

export type Position = {
  x: number
  y: number
}

export type BoardBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export type SoldierStatus = "ACTIVE" | "STONE" | "FALLEN"

export type SoldierMemory = JsonValue
export type StrategyMemory = JsonValue

export interface Soldier {
  id: SoldierId
  ownerPlayerId: PlayerId
  status: SoldierStatus
  position: Position | null
  facing: Direction | null
  lastSuccessfulMoveDirection: Direction | null
  soldierMemory: SoldierMemory
}

export interface TerrainStone {
  position: Position
}

export interface ArenaVariant {
  id: ArenaVariantId
  name: string
  initialBounds: BoardBounds
  terrainStones: Position[]
}

export type AwarenessCellContents =
  | "EMPTY"
  | "WALL"
  | "FRIENDLY_ACTIVE"
  | "FRIENDLY_STONE"
  | "ENEMY_ACTIVE"
  | "ENEMY_STONE"
  | "TERRAIN_STONE"

export interface AwarenessCell {
  dx: -2 | -1 | 0 | 1 | 2
  dy: -2 | -1 | 0 | 1 | 2
  absoluteX: number
  absoluteY: number
  contents: AwarenessCellContents
  facing?: Direction | undefined
}

export interface AwarenessGrid5x5 {
  cells: AwarenessCell[]
}

export interface SoldierSnapshot {
  id: SoldierId
  ownerPlayerId: PlayerId
  status: SoldierStatus
  position: Position | null
  facing: Direction | null
  lastSuccessfulMoveDirection: Direction | null
}

export interface FullBoardSnapshot {
  bounds: BoardBounds
  soldiers: SoldierSnapshot[]
  terrainStones: Position[]
}

export type MoveAction = {
  type: "MOVE"
  direction: Direction
}

export type TurnAction = {
  type: "TURN"
  direction: Direction
}

export type TurnToStoneAction = {
  type: "TURN_TO_STONE"
}

export type Action = MoveAction | TurnAction | TurnToStoneAction

export interface StrategyInput {
  phaseNumber: number
  roundNumber: 1 | 2 | 3 | 4
  activationCount: 1 | 2 | 3 | 4
  board: FullBoardSnapshot
  mySoldiers: SoldierSnapshot[]
  enemySoldiers: SoldierSnapshot[]
  strategyMemory: StrategyMemory
}

export interface ActivationOrder {
  soldierId: SoldierId
  objective?: JsonValue
}

export interface StrategyResult {
  activationOrders: ActivationOrder[]
  strategyMemory: StrategyMemory
}

export interface SoldierBrainInput {
  self: SoldierSnapshot
  awarenessGrid: AwarenessGrid5x5
  cycleIndex: number
  maxCycles: 12
  objective?: JsonValue
  soldierMemory: SoldierMemory
}

export interface SoldierBrainResult {
  action: Action
  soldierMemory: SoldierMemory
}

export type RuntimeViolationType =
  | "INVALID_OUTPUT"
  | "TIMEOUT"
  | "THROWN_EXCEPTION"
  | "FORBIDDEN_CAPABILITY"
  | "OVERSIZED_OUTPUT"

export interface RuntimeViolation {
  type: RuntimeViolationType
  message: string
}

export type ChronicleEventType =
  | "MATCH_STARTED"
  | "ROUND_STARTED"
  | "STRATEGY_EVALUATED"
  | "ACTIVATION_STARTED"
  | "AWARENESS_GRID_OBSERVED"
  | "ACTION_EMITTED"
  | "MOVE_ADVANCED"
  | "MOVE_BLOCKED"
  | "TURN_RESOLVED"
  | "PUSH_ATTEMPTED"
  | "PUSH_RESOLVED"
  | "PUSH_BLOCKED"
  | "BACKSTAB_RESOLVED"
  | "SOLDIER_STONED"
  | "SOLDIER_FELL"
  | "CONTRACTION_RESOLVED"
  | "MATCH_ENDED"
  | "RUNTIME_VIOLATION"

export interface ChronicleEvent {
  type: ChronicleEventType
  sequence: number
  payload: JsonValue
}

export interface CompatibilityVersions {
  spec: string
  engine: string
  runtimeJs: string
  chronicle: string
  strategyRevision: string
  arenaVariant: string
}

export type MatchOutcome =
  | { type: "WIN"; winnerPlayerId: PlayerId }
  | { type: "DRAW" }
  | { type: "FAILED"; reason: string }

export interface Match {
  id: MatchId
  arenaVariantId: ArenaVariantId
  seed: string
  strategyRevisionIds: [StrategyRevisionId, StrategyRevisionId]
  versions: CompatibilityVersions
  outcome?: MatchOutcome
}

export interface MatchSet {
  id: MatchSetId
  matchIds: MatchId[]
  strategyRevisionIds: [StrategyRevisionId, StrategyRevisionId]
}
