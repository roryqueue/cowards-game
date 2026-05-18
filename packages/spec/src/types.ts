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

export const RUNTIME_VIOLATION_TYPES = [
  "INVALID_OUTPUT",
  "TIMEOUT",
  "THROWN_EXCEPTION",
  "FORBIDDEN_CAPABILITY",
  "OVERSIZED_OUTPUT",
] as const

export type RuntimeViolationType = (typeof RUNTIME_VIOLATION_TYPES)[number]

export interface RuntimeViolation {
  type: RuntimeViolationType
  message: string
}

export type StrategyRuntimeName = "runtime-js"

export type StrategyRevisionValidationSeverity = "error" | "warning"

export type StrategyRevisionValidationCode =
  | "SOURCE_TOO_LARGE"
  | "FORBIDDEN_PATTERN"
  | "MISSING_DEFAULT_EXPORT"
  | "MISSING_SELECT_ACTIVATIONS"
  | "MISSING_SOLDIER_BRAIN"
  | "ASYNC_METHOD_NOT_ALLOWED"
  | "IMPORT_NOT_ALLOWED"
  | "TRANSPILE_FAILED"
  | "ENGINE_INCOMPATIBLE"

export interface StrategyRevisionValidationIssue {
  code: StrategyRevisionValidationCode
  severity: StrategyRevisionValidationSeverity
  message: string
  pattern?: string | undefined
}

export interface StrategyRevisionValidationReport {
  valid: boolean
  errors: StrategyRevisionValidationIssue[]
  warnings: StrategyRevisionValidationIssue[]
  sourceBytes: number
  forbiddenPatterns: string[]
  sourceHash: string
  runtimeVersion: string
  engineCompatibility: {
    spec: string
    engine: string
  }
}

export interface StrategyRevisionMetadata {
  createdBy?: string | undefined
  label?: string | undefined
  notes?: string | undefined
  tags?: string[] | undefined
}

export interface StrategyRevision {
  id: StrategyRevisionId
  strategyId?: StrategyId | undefined
  source: string
  sourceHash: string
  sourceBytes: number
  runtime: {
    name: StrategyRuntimeName
    version: string
  }
  engineCompatibility: {
    spec: string
    engine: string
  }
  validation: StrategyRevisionValidationReport
  metadata: StrategyRevisionMetadata
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

export type ChronicleSchemaVersion = "chronicle-v1"

export type ChronicleSnapshotKind =
  | "MATCH_START"
  | "MATCH_END"
  | "ROUND_START"
  | "ROUND_END"
  | "ACTIVATION_START"
  | "ACTIVATION_END"
  | "CONTRACTION"
  | "TERMINAL"

export interface ChronicleEventContext {
  phaseNumber?: number
  roundNumber?: 1 | 2 | 3 | 4
  activationId?: string
  activationIndex?: number
  cycleIndex?: number
  actingPlayerId?: PlayerId
  soldierId?: SoldierId
}

export type ChroniclePrivacy = "public" | "owner" | "private"

export interface ChronicleEvent {
  type: ChronicleEventType
  sequence: number
  context: ChronicleEventContext
  privacy: ChroniclePrivacy
  payload: JsonValue
  privateRef?: string | undefined
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

export interface ChronicleBoundarySnapshot {
  kind: ChronicleSnapshotKind
  sequence: number
  context: ChronicleEventContext
  board: FullBoardSnapshot
  outcome?: MatchOutcome | undefined
}

export interface ChronicleReproducibilityEnvelope {
  matchId: MatchId
  seed: string
  arenaVariantId: ArenaVariantId
  arenaVariantVersion: string
  strategyRevisionIds: [StrategyRevisionId, StrategyRevisionId]
  versions: CompatibilityVersions
}

export interface ChronicleIntegrity {
  algorithm: "sha256"
  normalizedContentHash: string
}

export interface ChroniclePrivateSections {
  byPlayerId: Record<PlayerId, JsonValue>
  debug?: JsonValue | undefined
}

export interface Chronicle {
  schemaVersion: ChronicleSchemaVersion
  reproducibility: ChronicleReproducibilityEnvelope
  events: ChronicleEvent[]
  snapshots: ChronicleBoundarySnapshot[]
  private?: ChroniclePrivateSections | undefined
  integrity?: ChronicleIntegrity | undefined
  storageMetadata?: JsonValue | undefined
}

export type ChronicleValidationErrorCode =
  | "SCHEMA_INVALID"
  | "VERSION_INCOMPATIBLE"
  | "EVENT_ORDER_INVALID"
  | "EVENT_WINDOW_INVALID"
  | "REQUIRED_EVENT_MISSING"
  | "CONTEXT_MISSING"
  | "CONTEXT_MISMATCH"
  | "PAYLOAD_INCONSISTENT"
  | "SNAPSHOT_MISSING"
  | "SNAPSHOT_BOUNDARY_INVALID"
  | "SNAPSHOT_MISMATCH"
  | "HASH_MISMATCH"
  | "PRIVATE_ACCESS_DENIED"
  | "UNSUPPORTED_MIGRATION"

export interface ChronicleValidationError {
  code: ChronicleValidationErrorCode
  sequence?: number | undefined
  message: string
  expected?: JsonValue | undefined
  actual?: JsonValue | undefined
}

export type ChronicleValidationResult =
  | { ok: true }
  | { ok: false; errors: ChronicleValidationError[] }

export type ChronicleViewerAccess = "public" | "owner"

export type ChronicleViewer =
  | { access: "public" }
  | { access: "owner"; playerId: PlayerId }

export interface ChroniclePublicEvent {
  type: ChronicleEventType
  sequence: number
  context: ChronicleEventContext
  payload: JsonValue
}

export interface ChronicleOwnerPrivateSection {
  playerId: PlayerId
  data: JsonValue
}

export interface ChronicleProjection {
  schemaVersion: ChronicleSchemaVersion
  viewer: ChronicleViewer
  reproducibility: ChronicleReproducibilityEnvelope
  events: ChroniclePublicEvent[]
  snapshots: ChronicleBoundarySnapshot[]
  ownerPrivate?: ChronicleOwnerPrivateSection | undefined
  integrity?: ChronicleIntegrity | undefined
}

export interface ChronicleMigration {
  from: string
  to: ChronicleSchemaVersion
  migrate: (chronicle: JsonValue) => Chronicle | ChronicleValidationError
}

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
