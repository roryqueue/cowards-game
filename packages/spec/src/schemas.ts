import { z } from "zod"
import {
  OBJECTIVE_PAYLOAD_BYTES,
  SOLDIER_MEMORY_BYTES,
  STRATEGY_MEMORY_BYTES,
} from "./constants.js"
import type { JsonValue } from "./types.js"

export const jsonByteLength = (value: unknown): number =>
  new TextEncoder().encode(JSON.stringify(value)).length

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
)

export const DirectionSchema = z.enum(["UP", "DOWN", "LEFT", "RIGHT"])
export const SoldierStatusSchema = z.enum(["ACTIVE", "STONE", "FALLEN"])

export const PositionSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
})

export const BoardBoundsSchema = z.object({
  minX: z.number().int(),
  maxX: z.number().int(),
  minY: z.number().int(),
  maxY: z.number().int(),
})

export const SoldierSchema = z.object({
  id: z.string().min(1),
  ownerPlayerId: z.string().min(1),
  status: SoldierStatusSchema,
  position: PositionSchema.nullable(),
  facing: DirectionSchema.nullable(),
  lastSuccessfulMoveDirection: DirectionSchema.nullable(),
  soldierMemory: JsonValueSchema.refine(
    (value) => jsonByteLength(value) <= SOLDIER_MEMORY_BYTES,
    "SoldierMemory exceeds 2KB",
  ),
})

export const SoldierSnapshotSchema = SoldierSchema.omit({
  soldierMemory: true,
})

export const AwarenessCellContentsSchema = z.enum([
  "EMPTY",
  "WALL",
  "FRIENDLY_ACTIVE",
  "FRIENDLY_STONE",
  "ENEMY_ACTIVE",
  "ENEMY_STONE",
  "TERRAIN_STONE",
])

const AwarenessDeltaSchema = z.union([
  z.literal(-2),
  z.literal(-1),
  z.literal(0),
  z.literal(1),
  z.literal(2),
])

export const AwarenessCellSchema = z.object({
  dx: AwarenessDeltaSchema,
  dy: AwarenessDeltaSchema,
  absoluteX: z.number().int(),
  absoluteY: z.number().int(),
  contents: AwarenessCellContentsSchema,
  facing: DirectionSchema.optional(),
})

export const AwarenessGrid5x5Schema = z.object({
  cells: z.array(AwarenessCellSchema).length(25),
})

export const MoveActionSchema = z.object({
  type: z.literal("MOVE"),
  direction: DirectionSchema,
})

export const TurnActionSchema = z.object({
  type: z.literal("TURN"),
  direction: DirectionSchema,
})

export const TurnToStoneActionSchema = z.object({
  type: z.literal("TURN_TO_STONE"),
})

export const ActionSchema = z.discriminatedUnion("type", [
  MoveActionSchema,
  TurnActionSchema,
  TurnToStoneActionSchema,
])

export const FullBoardSnapshotSchema = z.object({
  bounds: BoardBoundsSchema,
  soldiers: z.array(SoldierSnapshotSchema),
  terrainStones: z.array(PositionSchema),
})

export const StrategyInputSchema = z.object({
  phaseNumber: z.number().int().positive(),
  roundNumber: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
  activationCount: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
  board: FullBoardSnapshotSchema,
  mySoldiers: z.array(SoldierSnapshotSchema),
  enemySoldiers: z.array(SoldierSnapshotSchema),
  strategyMemory: JsonValueSchema.refine(
    (value) => jsonByteLength(value) <= STRATEGY_MEMORY_BYTES,
    "StrategyMemory exceeds 32KB",
  ),
})

export const ActivationOrderSchema = z.object({
  soldierId: z.string().min(1),
  objective: JsonValueSchema.refine(
    (value) => jsonByteLength(value) <= OBJECTIVE_PAYLOAD_BYTES,
    "Objective payload exceeds 1KB",
  ).optional(),
})

export const StrategyResultSchema = z.object({
  activationOrders: z.array(ActivationOrderSchema),
  strategyMemory: JsonValueSchema.refine(
    (value) => jsonByteLength(value) <= STRATEGY_MEMORY_BYTES,
    "StrategyMemory exceeds 32KB",
  ),
})

export const SoldierBrainInputSchema = z.object({
  self: SoldierSnapshotSchema,
  awarenessGrid: AwarenessGrid5x5Schema,
  cycleIndex: z.number().int().min(0),
  maxCycles: z.literal(12),
  objective: JsonValueSchema.refine(
    (value) => jsonByteLength(value) <= OBJECTIVE_PAYLOAD_BYTES,
    "Objective payload exceeds 1KB",
  ).optional(),
  soldierMemory: JsonValueSchema.refine(
    (value) => jsonByteLength(value) <= SOLDIER_MEMORY_BYTES,
    "SoldierMemory exceeds 2KB",
  ),
})

export const SoldierBrainResultSchema = z.object({
  action: ActionSchema,
  soldierMemory: JsonValueSchema.refine(
    (value) => jsonByteLength(value) <= SOLDIER_MEMORY_BYTES,
    "SoldierMemory exceeds 2KB",
  ),
})

export const ArenaVariantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  initialBounds: BoardBoundsSchema,
  terrainStones: z.array(PositionSchema),
})

export const CompatibilityVersionsSchema = z.object({
  spec: z.string(),
  engine: z.string(),
  runtimeJs: z.string(),
  chronicle: z.string(),
  strategyRevision: z.string(),
  arenaVariant: z.string(),
})

export const MatchOutcomeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("WIN"),
    winnerPlayerId: z.string().min(1),
  }),
  z.object({
    type: z.literal("DRAW"),
  }),
  z.object({
    type: z.literal("FAILED"),
    reason: z.string().min(1),
  }),
])

export const ChronicleEventTypeSchema = z.enum([
  "MATCH_STARTED",
  "ROUND_STARTED",
  "STRATEGY_EVALUATED",
  "ACTIVATION_STARTED",
  "AWARENESS_GRID_OBSERVED",
  "ACTION_EMITTED",
  "MOVE_ADVANCED",
  "MOVE_BLOCKED",
  "TURN_RESOLVED",
  "PUSH_ATTEMPTED",
  "PUSH_RESOLVED",
  "PUSH_BLOCKED",
  "BACKSTAB_RESOLVED",
  "SOLDIER_STONED",
  "SOLDIER_FELL",
  "CONTRACTION_RESOLVED",
  "MATCH_ENDED",
  "RUNTIME_VIOLATION",
])

export const ChronicleSchemaVersionSchema = z.literal("chronicle-v1")

export const ChronicleSnapshotKindSchema = z.enum([
  "MATCH_START",
  "MATCH_END",
  "ROUND_START",
  "ROUND_END",
  "ACTIVATION_START",
  "ACTIVATION_END",
  "CONTRACTION",
  "TERMINAL",
])

export const ChronicleEventContextSchema = z.object({
  phaseNumber: z.number().int().positive().optional(),
  roundNumber: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
    .optional(),
  activationId: z.string().min(1).optional(),
  activationIndex: z.number().int().nonnegative().optional(),
  cycleIndex: z.number().int().nonnegative().optional(),
  actingPlayerId: z.string().min(1).optional(),
  soldierId: z.string().min(1).optional(),
})

export const ChroniclePrivacySchema = z.enum(["public", "owner", "private"])

export const ChronicleEventSchema = z.object({
  type: ChronicleEventTypeSchema,
  sequence: z.number().int().nonnegative(),
  context: ChronicleEventContextSchema,
  privacy: ChroniclePrivacySchema,
  payload: JsonValueSchema,
  privateRef: z.string().min(1).optional(),
})

export const ChronicleBoundarySnapshotSchema = z.object({
  kind: ChronicleSnapshotKindSchema,
  sequence: z.number().int().nonnegative(),
  context: ChronicleEventContextSchema,
  board: FullBoardSnapshotSchema,
  outcome: MatchOutcomeSchema.optional(),
})

export const ChronicleReproducibilityEnvelopeSchema = z.object({
  matchId: z.string().min(1),
  seed: z.string().min(1),
  arenaVariantId: z.string().min(1),
  arenaVariantVersion: z.string().min(1),
  strategyRevisionIds: z.tuple([z.string().min(1), z.string().min(1)]),
  versions: CompatibilityVersionsSchema,
})

export const ChronicleIntegritySchema = z.object({
  algorithm: z.literal("sha256"),
  normalizedContentHash: z.string().min(1),
})

export const ChroniclePrivateSectionsSchema = z.object({
  byPlayerId: z.record(z.string().min(1), JsonValueSchema),
  debug: JsonValueSchema.optional(),
})

export const ChronicleSchema = z.object({
  schemaVersion: ChronicleSchemaVersionSchema,
  reproducibility: ChronicleReproducibilityEnvelopeSchema,
  events: z.array(ChronicleEventSchema),
  snapshots: z.array(ChronicleBoundarySnapshotSchema),
  private: ChroniclePrivateSectionsSchema.optional(),
  integrity: ChronicleIntegritySchema.optional(),
  storageMetadata: JsonValueSchema.optional(),
})

export const ChronicleValidationErrorCodeSchema = z.enum([
  "SCHEMA_INVALID",
  "VERSION_INCOMPATIBLE",
  "EVENT_ORDER_INVALID",
  "REQUIRED_EVENT_MISSING",
  "SNAPSHOT_MISSING",
  "SNAPSHOT_MISMATCH",
  "HASH_MISMATCH",
  "PRIVATE_ACCESS_DENIED",
  "UNSUPPORTED_MIGRATION",
])

export const ChronicleValidationErrorSchema = z.object({
  code: ChronicleValidationErrorCodeSchema,
  sequence: z.number().int().nonnegative().optional(),
  message: z.string().min(1),
  expected: JsonValueSchema.optional(),
  actual: JsonValueSchema.optional(),
})

export const ChronicleValidationResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true) }),
  z.object({
    ok: z.literal(false),
    errors: z.array(ChronicleValidationErrorSchema).min(1),
  }),
])

export const ChroniclePublicViewerSchema = z.object({
  access: z.literal("public"),
})

export const ChronicleOwnerViewerSchema = z.object({
  access: z.literal("owner"),
  playerId: z.string().min(1),
})

export const ChronicleViewerSchema = z.discriminatedUnion("access", [
  ChroniclePublicViewerSchema,
  ChronicleOwnerViewerSchema,
])

export const ChroniclePublicEventSchema = ChronicleEventSchema.pick({
  type: true,
  sequence: true,
  context: true,
  payload: true,
})

export const ChronicleOwnerPrivateSectionSchema = z.object({
  playerId: z.string().min(1),
  data: JsonValueSchema,
})

export const ChronicleProjectionSchema = z.object({
  schemaVersion: ChronicleSchemaVersionSchema,
  viewer: ChronicleViewerSchema,
  reproducibility: ChronicleReproducibilityEnvelopeSchema,
  events: z.array(ChroniclePublicEventSchema),
  snapshots: z.array(ChronicleBoundarySnapshotSchema),
  ownerPrivate: ChronicleOwnerPrivateSectionSchema.optional(),
  integrity: ChronicleIntegritySchema.optional(),
})
