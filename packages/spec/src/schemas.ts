import { z } from "zod"
import {
  OBJECTIVE_PAYLOAD_BYTES,
  SOLDIER_MEMORY_BYTES,
  STRATEGY_MEMORY_BYTES,
  STRATEGY_SOURCE_BYTES,
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

export const RuntimeViolationTypeSchema = z.enum([
  "INVALID_OUTPUT",
  "TIMEOUT",
  "THROWN_EXCEPTION",
  "FORBIDDEN_CAPABILITY",
  "OVERSIZED_OUTPUT",
])

export const StrategyRuntimeNameSchema = z.literal("runtime-js")

export const StrategyRevisionValidationSeveritySchema = z.enum([
  "error",
  "warning",
])

export const StrategyRevisionValidationCodeSchema = z.enum([
  "SOURCE_TOO_LARGE",
  "FORBIDDEN_PATTERN",
  "MISSING_DEFAULT_EXPORT",
  "MISSING_SELECT_ACTIVATIONS",
  "MISSING_SOLDIER_BRAIN",
  "ASYNC_METHOD_NOT_ALLOWED",
  "IMPORT_NOT_ALLOWED",
  "TRANSPILE_FAILED",
  "ENGINE_INCOMPATIBLE",
])

export const StrategyRevisionValidationIssueSchema = z.object({
  code: StrategyRevisionValidationCodeSchema,
  severity: StrategyRevisionValidationSeveritySchema,
  message: z.string().min(1),
  pattern: z.string().min(1).optional(),
})

export const StrategyRevisionValidationReportSchema = z
  .object({
    valid: z.boolean(),
    errors: z.array(StrategyRevisionValidationIssueSchema),
    warnings: z.array(StrategyRevisionValidationIssueSchema),
    sourceBytes: z.number().int().min(0).max(STRATEGY_SOURCE_BYTES),
    forbiddenPatterns: z.array(z.string()),
    sourceHash: z.string().min(1),
    runtimeVersion: z.string().min(1),
    engineCompatibility: z.object({
      spec: z.string().min(1),
      engine: z.string().min(1),
    }),
  })
  .refine((report) => report.valid === (report.errors.length === 0), {
    message: "valid must match whether errors is empty",
    path: ["valid"],
  })

export const StrategyRevisionMetadataSchema = z.object({
  createdBy: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
})

export const StrategyRevisionSchema = z.object({
  id: z.string().min(1),
  strategyId: z.string().min(1).optional(),
  source: z
    .string()
    .min(1)
    .refine(
      (source) =>
        new TextEncoder().encode(source).length <= STRATEGY_SOURCE_BYTES,
      "Strategy source exceeds 64KB",
    ),
  sourceHash: z.string().min(1),
  sourceBytes: z.number().int().min(0).max(STRATEGY_SOURCE_BYTES),
  runtime: z.object({
    name: StrategyRuntimeNameSchema,
    version: z.string().min(1),
  }),
  engineCompatibility: z.object({
    spec: z.string().min(1),
    engine: z.string().min(1),
  }),
  validation: StrategyRevisionValidationReportSchema,
  metadata: StrategyRevisionMetadataSchema,
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

export const ChronicleEventBaseSchema = z.object({
  type: ChronicleEventTypeSchema,
  sequence: z.number().int().nonnegative(),
  context: ChronicleEventContextSchema,
  privacy: ChroniclePrivacySchema,
  privateRef: z.string().min(1).optional(),
})

const SoldierIdPayloadSchema = z.object({
  soldierId: z.string().min(1),
})

const OptionalReasonPayloadSchema = SoldierIdPayloadSchema.extend({
  reason: z.string().min(1).optional(),
})

export const ChronicleEventSchema = z.discriminatedUnion("type", [
  ChronicleEventBaseSchema.extend({
    type: z.literal("MATCH_STARTED"),
    payload: z.object({
      matchId: z.string().min(1),
      seed: z.string().min(1).optional(),
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("ROUND_STARTED"),
    payload: z.object({
      roundNumber: z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
      ]),
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("STRATEGY_EVALUATED"),
    payload: z.object({
      playerId: z.string().min(1),
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("ACTIVATION_STARTED"),
    payload: SoldierIdPayloadSchema,
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("AWARENESS_GRID_OBSERVED"),
    payload: SoldierIdPayloadSchema.extend({
      cycleIndex: z.number().int().nonnegative(),
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("ACTION_EMITTED"),
    payload: SoldierIdPayloadSchema.extend({
      action: ActionSchema,
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("MOVE_ADVANCED"),
    payload: SoldierIdPayloadSchema.extend({
      direction: DirectionSchema,
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("MOVE_BLOCKED"),
    payload: SoldierIdPayloadSchema.extend({
      reason: z.string().min(1),
      targetSoldierId: z.string().min(1).optional(),
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("TURN_RESOLVED"),
    payload: SoldierIdPayloadSchema.extend({
      direction: DirectionSchema,
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("PUSH_ATTEMPTED"),
    payload: SoldierIdPayloadSchema.extend({
      targetSoldierId: z.string().min(1),
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("PUSH_RESOLVED"),
    payload: SoldierIdPayloadSchema.extend({
      targetSoldierId: z.string().min(1),
      pushedOffBoard: z.boolean(),
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("PUSH_BLOCKED"),
    payload: SoldierIdPayloadSchema.extend({
      targetSoldierId: z.string().min(1),
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("BACKSTAB_RESOLVED"),
    payload: z.object({
      boundary: z.enum(["activation-start", "activation-end", "post-advance"]),
      pairs: z.array(
        z.object({
          attackerId: z.string().min(1),
          victimId: z.string().min(1),
        }),
      ),
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("SOLDIER_STONED"),
    payload: OptionalReasonPayloadSchema,
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("SOLDIER_FELL"),
    payload: OptionalReasonPayloadSchema,
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("CONTRACTION_RESOLVED"),
    payload: z.object({
      bounds: BoardBoundsSchema,
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("MATCH_ENDED"),
    payload: MatchOutcomeSchema,
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("RUNTIME_VIOLATION"),
    payload: z.object({
      type: RuntimeViolationTypeSchema,
      category: z.string().min(1).optional(),
      playerId: z.string().min(1).optional(),
      ownerPlayerId: z.string().min(1).optional(),
      soldierId: z.string().min(1).optional(),
    }),
  }),
])

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
  "EVENT_WINDOW_INVALID",
  "REQUIRED_EVENT_MISSING",
  "CONTEXT_MISSING",
  "CONTEXT_MISMATCH",
  "PAYLOAD_INCONSISTENT",
  "SNAPSHOT_MISSING",
  "SNAPSHOT_BOUNDARY_INVALID",
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

export const ChroniclePublicEventSchema = z.object({
  type: ChronicleEventTypeSchema,
  sequence: z.number().int().nonnegative(),
  context: ChronicleEventContextSchema,
  payload: JsonValueSchema,
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
