import { z } from "zod"
import {
  ANALYTICS_COMPATIBILITY_MISMATCH_CODES,
  ANALYTICS_EVIDENCE_BANDS,
  ANALYTICS_PROFILE_SCHEMA_VERSION,
  ANALYTICS_REPLAY_FALLBACK_STATES,
  ANALYTICS_REPLAY_MOMENT_TYPES,
  ANALYTICS_RUN_SCHEMA_VERSION,
  ANALYTICS_SUMMARY_SCHEMA_VERSION,
  assertAnalyticsPublicSummaryLeakSafe,
} from "./analytics.js"
import {
  OBJECTIVE_PAYLOAD_BYTES,
  SOLDIER_MEMORY_BYTES,
  STRATEGY_MEMORY_BYTES,
  STRATEGY_SOURCE_BYTES,
} from "./constants.js"
import {
  RUNTIME_VIOLATION_TYPES,
  SOLDIER_INACTIVITY_EXPLANATION_CAUSES,
  type JsonValue,
} from "./types.js"
import {
  STRATEGY_LANGUAGE_IDS,
  STRATEGY_RUNTIME_ABI_VERSION,
  STRATEGY_RUNTIME_ADAPTER_IDS,
  STRATEGY_RUNTIME_SYSTEM_FAILURE_CODES,
  STRATEGY_RUNTIME_VIOLATION_CODES,
} from "./runtime.js"

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

export const AnalyticsEvidenceBandSchema = z.enum(ANALYTICS_EVIDENCE_BANDS)
export const AnalyticsReplayMomentTypeSchema = z.enum(
  ANALYTICS_REPLAY_MOMENT_TYPES,
)
export const AnalyticsReplayFallbackStateSchema = z.enum(
  ANALYTICS_REPLAY_FALLBACK_STATES,
)
export const AnalyticsCompatibilityMismatchCodeSchema = z.enum(
  ANALYTICS_COMPATIBILITY_MISMATCH_CODES,
)

export const AnalyticsStrategySnapshotSchema = z.object({
  revisionId: z.string().min(1),
  label: z.string().min(1),
  sourceHash: z.string().min(1),
  tags: z.array(z.string().min(1)),
})

export const AnalyticsOpponentSnapshotSchema =
  AnalyticsStrategySnapshotSchema.extend({
    opponentId: z.string().min(1),
    tier: z.enum(["starter", "advanced", "workshop"]),
    archetypeTags: z.array(z.string().min(1)),
  })

export const AnalyticsCompatibilityKeySchema = z.object({
  profileSchemaVersion: z.literal(ANALYTICS_PROFILE_SCHEMA_VERSION),
  candidateRevisionIds: z.array(z.string().min(1)),
  opponentRevisionIds: z.array(z.string().min(1)),
  presetId: z.string().min(1),
  seeds: z.array(z.string().min(1)),
  mirrorSides: z.boolean(),
  scoringPolicyVersion: z.string().min(1),
  ruleVersion: z.string().min(1),
  chronicleVersion: z.string().min(1),
  runtimeAdapter: z.string().min(1),
  runtimeVersion: z.string().min(1),
  matrixOrder: z.array(z.string().min(1)),
})

export const AnalyticsCompatibilitySummarySchema = z.object({
  hash: z.string().min(1),
  key: AnalyticsCompatibilityKeySchema,
  equivalent: z.boolean(),
  mismatches: z.array(AnalyticsCompatibilityMismatchCodeSchema),
})

export const AnalyticsReplayReferenceSchema = z.object({
  matchId: z.string().min(1),
  momentType: AnalyticsReplayMomentTypeSchema,
  sequence: z.number().int().nonnegative(),
  label: z.string().min(1),
  side: z.enum(["bottom", "top", "neutral"]),
  fallbackState: AnalyticsReplayFallbackStateSchema,
  href: z.string().min(1),
})

export const AnalyticsEvidenceSummarySchema = z.object({
  band: AnalyticsEvidenceBandSchema,
  counted: z.boolean(),
  completedCount: z.number().int().nonnegative(),
  replayBackedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
  systemFailureCount: z.number().int().nonnegative(),
  notes: z.array(z.string().min(1)),
})

export const AnalyticsMatchupRecordSchema = z.object({
  candidate: AnalyticsStrategySnapshotSchema,
  opponent: AnalyticsOpponentSnapshotSchema,
  matchSetId: z.string().min(1),
  matchIds: z.array(z.string().min(1)),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  draws: z.number().int().nonnegative(),
  points: z.number().int(),
  failureCount: z.number().int().nonnegative(),
  sideBias: z.enum(["bottom", "top", "balanced", "insufficient"]),
  evidence: AnalyticsEvidenceSummarySchema,
  replayReferences: z.array(AnalyticsReplayReferenceSchema),
})

export const AnalyticsGauntletProfileDefinitionSchema = z.object({
  profileSchemaVersion: z.literal(ANALYTICS_PROFILE_SCHEMA_VERSION),
  candidates: z.array(AnalyticsStrategySnapshotSchema).min(1),
  opponents: z.array(AnalyticsOpponentSnapshotSchema).min(1),
  presetId: z.string().min(1),
  seeds: z.array(z.string().min(1)),
  mirrorSides: z.boolean(),
  scoringPolicyVersion: z.string().min(1),
  ruleVersion: z.string().min(1),
  chronicleVersion: z.string().min(1),
  runtimeAdapter: z.string().min(1),
  runtimeVersion: z.string().min(1),
  matrixOrder: z.array(z.string().min(1)),
})

export const AnalyticsGauntletProfileSchema = z.object({
  id: z.string().min(1),
  ownerUserId: z.string().min(1),
  name: z.string().min(1),
  notes: z.string().min(1).optional(),
  status: z.enum(["active", "archived"]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  definition: AnalyticsGauntletProfileDefinitionSchema,
  compatibility: AnalyticsCompatibilitySummarySchema,
})

const addAnalyticsLeakCheck = <T extends z.ZodType>(schema: T) =>
  schema.superRefine((value, ctx) => {
    try {
      assertAnalyticsPublicSummaryLeakSafe(value)
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message:
          error instanceof Error
            ? error.message
            : "Analytics payload contains private fields",
      })
    }
  })

export const AnalyticsGauntletRunSummarySchema = addAnalyticsLeakCheck(
  z.object({
    summarySchemaVersion: z.literal(ANALYTICS_SUMMARY_SCHEMA_VERSION),
    profileId: z.string().min(1),
    runId: z.string().min(1),
    ownerUserId: z.string().min(1),
    lifecycleStatus: z.enum([
      "queued",
      "running",
      "complete",
      "blocked_preflight",
    ]),
    compatibility: AnalyticsCompatibilitySummarySchema,
    totals: z.object({
      wins: z.number().int().nonnegative(),
      losses: z.number().int().nonnegative(),
      draws: z.number().int().nonnegative(),
      points: z.number().int(),
      matchups: z.number().int().nonnegative(),
      completedMatches: z.number().int().nonnegative(),
      failedMatches: z.number().int().nonnegative(),
    }),
    matchupRecords: z.array(AnalyticsMatchupRecordSchema),
    provenance: z.object({
      matchSetIds: z.array(z.string().min(1)),
      generatedAt: z.string().min(1),
      runSchemaVersion: z.literal(ANALYTICS_RUN_SCHEMA_VERSION),
    }),
    privacy: z.object({
      ownerSafe: z.literal(true),
      publicFieldsExcluded: z.array(z.string().min(1)),
    }),
    metadata: JsonValueSchema.optional(),
  }),
)

export const AnalyticsGauntletProfileRunSchema = addAnalyticsLeakCheck(
  z
    .object({
      id: z.string().min(1),
      profileId: z.string().min(1),
      ownerUserId: z.string().min(1),
      runIndex: z.number().int().nonnegative(),
      createdAt: z.string().min(1),
      completedAt: z.string().min(1).optional(),
      notes: z.string().min(1).optional(),
      summary: AnalyticsGauntletRunSummarySchema,
    })
    .superRefine((run, ctx) => {
      if (run.id !== run.summary.runId) {
        ctx.addIssue({
          code: "custom",
          path: ["summary", "runId"],
          message: "run id must match summary.runId",
        })
      }
      if (run.profileId !== run.summary.profileId) {
        ctx.addIssue({
          code: "custom",
          path: ["summary", "profileId"],
          message: "profile id must match summary.profileId",
        })
      }
      if (run.ownerUserId !== run.summary.ownerUserId) {
        ctx.addIssue({
          code: "custom",
          path: ["summary", "ownerUserId"],
          message: "owner user id must match summary.ownerUserId",
        })
      }
    }),
)

export const AnalyticsExportEnvelopeSchema = addAnalyticsLeakCheck(
  z.object({
    exportedBy: z.string().min(1),
    exportedAt: z.string().min(1),
    format: z.enum(["json", "csv"]),
    summarySchemaVersion: z.literal(ANALYTICS_SUMMARY_SCHEMA_VERSION),
    profile: AnalyticsGauntletProfileSchema,
    runs: z.array(AnalyticsGauntletProfileRunSchema),
  }),
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

export const RuntimeViolationTypeSchema = z.enum(RUNTIME_VIOLATION_TYPES)

export const RuntimeViolationUserGuidanceSchema = z.object({
  label: z.string().min(1),
  constraint: z.string().min(1),
  remediation: z.string().min(1),
})

export const SoldierInactivityExplanationCauseSchema = z.enum(
  SOLDIER_INACTIVITY_EXPLANATION_CAUSES,
)

export const SoldierInactivityExplanationDtoSchema = z.object({
  soldierId: z.string().min(1),
  playerId: z.string().min(1).optional(),
  sequence: z.number().int().nonnegative(),
  cause: SoldierInactivityExplanationCauseSchema,
  label: z.string().min(1),
  remediation: z.string().min(1),
  details: JsonValueSchema.optional(),
})

export const StrategyRuntimeNameSchema = z.literal("runtime-js")

export const StrategyLanguageIdSchema = z.enum(STRATEGY_LANGUAGE_IDS)
export const StrategyRuntimeAdapterIdSchema = z.enum(
  STRATEGY_RUNTIME_ADAPTER_IDS,
)

export const StrategyRuntimeLimitsSchema = z.object({
  timeoutMs: z.number().int().positive(),
  stdoutBytes: z.number().int().positive(),
  stderrBytes: z.number().int().positive(),
  sourceBytes: z.number().int().positive(),
  strategyMemoryBytes: z.number().int().positive(),
  soldierMemoryBytes: z.number().int().positive(),
  objectivePayloadBytes: z.number().int().positive(),
  environment: z.enum(["empty", "minimal", "inherited"]),
  filesystem: z.enum(["none", "read-only-root", "host"]),
  network: z.enum(["disabled", "inherited"]),
  shell: z.enum(["disabled", "inherited"]),
  packagePolicy: z.enum(["none", "experimental"]),
})

export const StrategyPackageMetadataSchema = z
  .object({
    mode: z.enum(["none", "declared"]),
    entrypoint: z.string().min(1),
    manifestHash: z.string().min(1).optional(),
    lockfileHash: z.string().min(1).optional(),
    declaredDependencies: z.record(z.string(), z.string()).optional(),
  })
  .superRefine((metadata, ctx) => {
    if (metadata.mode === "declared" && !metadata.manifestHash) {
      ctx.addIssue({
        code: "custom",
        path: ["manifestHash"],
        message:
          "package manifest hash is required when package mode is declared",
      })
    }
  })

export const StrategyRuntimeMetadataSchema = z.object({
  abiVersion: z.literal(STRATEGY_RUNTIME_ABI_VERSION),
  language: z.object({
    id: StrategyLanguageIdSchema,
    version: z.string().min(1),
  }),
  adapter: z.object({
    id: StrategyRuntimeAdapterIdSchema,
    version: z.string().min(1),
  }),
  package: StrategyPackageMetadataSchema,
  requiredCapabilities: z.array(z.string().min(1)),
  limits: StrategyRuntimeLimitsSchema,
})

export const PublicStrategyRuntimeMetadataSchema =
  StrategyRuntimeMetadataSchema.omit({
    limits: true,
  })

export const StrategyRuntimeViolationEnvelopeSchema = z.object({
  ok: z.literal(false),
  abiVersion: z.literal(STRATEGY_RUNTIME_ABI_VERSION),
  failureKind: z.literal("runtimeViolation"),
  violation: z.object({
    code: z.enum(STRATEGY_RUNTIME_VIOLATION_CODES),
    message: z.string().min(1),
    publicMessage: z.string().min(1),
    privateDiagnostics: JsonValueSchema.optional(),
  }),
})

export const StrategyRuntimeSystemFailureEnvelopeSchema = z.object({
  ok: z.literal(false),
  abiVersion: z.literal(STRATEGY_RUNTIME_ABI_VERSION),
  failureKind: z.literal("systemFailure"),
  systemFailure: z.object({
    code: z.enum(STRATEGY_RUNTIME_SYSTEM_FAILURE_CODES),
    message: z.string().min(1),
    publicMessage: z.string().min(1),
    privateDiagnostics: JsonValueSchema.optional(),
  }),
})

export const StrategyRuntimeSuccessEnvelopeSchema = z.object({
  ok: z.literal(true),
  abiVersion: z.literal(STRATEGY_RUNTIME_ABI_VERSION),
  value: JsonValueSchema,
})

export const StrategyRuntimeResponseEnvelopeSchema = z.union([
  StrategyRuntimeSuccessEnvelopeSchema,
  StrategyRuntimeViolationEnvelopeSchema,
  StrategyRuntimeSystemFailureEnvelopeSchema,
])

export const StrategyRuntimeRequestEnvelopeSchema = z.discriminatedUnion(
  "methodName",
  [
    z.object({
      abiVersion: z.literal(STRATEGY_RUNTIME_ABI_VERSION),
      methodName: z.literal("selectActivations"),
      runtime: StrategyRuntimeMetadataSchema,
      source: z.object({
        text: z.string().min(1),
        hash: z.string().min(1),
        bytes: z.number().int().min(0),
        entrypoint: z.string().min(1),
      }),
      input: StrategyInputSchema,
    }),
    z.object({
      abiVersion: z.literal(STRATEGY_RUNTIME_ABI_VERSION),
      methodName: z.literal("soldierBrain"),
      runtime: StrategyRuntimeMetadataSchema,
      source: z.object({
        text: z.string().min(1),
        hash: z.string().min(1),
        bytes: z.number().int().min(0),
        entrypoint: z.string().min(1),
      }),
      input: SoldierBrainInputSchema,
    }),
  ],
)

export const StrategyRevisionValidationSeveritySchema = z.enum([
  "error",
  "warning",
])

export const StrategyRevisionValidationCodeSchema = z.enum([
  "UNSUPPORTED_LANGUAGE",
  "UNSUPPORTED_PACKAGE_METADATA",
  "INCOMPATIBLE_ADAPTER",
  "ABI_MISMATCH",
  "SOURCE_TOO_LARGE",
  "MEMORY_LIMIT_EXCEEDED",
  "TIMEOUT",
  "FORBIDDEN_CAPABILITY",
  "NON_COUNTED_RUNTIME",
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
  constraint: z.string().min(1).optional(),
  remediation: z.string().min(1).optional(),
  reference: z.string().min(1).optional(),
})

export const StrategyRevisionValidationReportSchema = z
  .object({
    valid: z.boolean(),
    errors: z.array(StrategyRevisionValidationIssueSchema),
    warnings: z.array(StrategyRevisionValidationIssueSchema),
    sourceBytes: z.number().int().min(0),
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
  starterLineage: z
    .object({
      starterId: z.string().min(1),
      starterName: z.string().min(1),
      starterVersion: z.string().min(1),
      sourceHash: z.string().min(1),
    })
    .optional(),
  advancedLineage: z
    .object({
      advancedId: z.string().min(1),
      advancedName: z.string().min(1),
      advancedVersion: z.string().min(1),
      archetype: z.string().min(1),
      sourceHash: z.string().min(1),
    })
    .optional(),
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
  runtime: StrategyRuntimeMetadataSchema,
  engineCompatibility: z.object({
    spec: z.string().min(1),
    engine: z.string().min(1),
  }),
  validation: StrategyRevisionValidationReportSchema,
  metadata: StrategyRevisionMetadataSchema,
})

const SERVICE_SCHEMA_API_VERSION = "service-api-v1.8"

const SERVICE_SCHEMA_ERROR_CODES = [
  "NOT_FOUND",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "VALIDATION_FAILED",
  "STORAGE_UNAVAILABLE",
  "UPSTREAM_UNAVAILABLE",
  "INTERNAL",
] as const

const SERVICE_SCHEMA_ROUTE_IDS = [
  "health",
  "authSession",
  "createSession",
  "revokeSession",
  "listStrategyRevisions",
  "createStrategyRevision",
  "getStrategyRevisionSource",
  "createMatchSet",
  "getPublicMatchSetSummary",
  "getPublicReplayMetadata",
  "listAnalyticsProfiles",
  "createAnalyticsRun",
  "getAnalyticsRunSummary",
  "exportAnalyticsRun",
  "listLadderSeasons",
  "enterLadderSeason",
  "getPublicPlayerPage",
  "getPublicLadderSeason",
  "getPublicStrategyPage",
] as const

export const EmptyParamsSchema = z.object({})
export const EmptyQuerySchema = z.object({})
export const EmptyBodySchema = z.object({})

export const MatchSetIdParamsSchema = z.object({
  matchSetId: z.string().min(1),
})
export const MatchIdParamsSchema = z.object({
  matchId: z.string().min(1),
})
export const StrategyIdParamsSchema = z.object({
  strategyId: z.string().min(1),
})
export const StrategyRevisionIdParamsSchema = z.object({
  strategyRevisionId: z.string().min(1),
})
export const ProfileIdParamsSchema = z.object({
  profileId: z.string().min(1),
})
export const RunIdParamsSchema = z.object({
  runId: z.string().min(1),
})
export const SeasonIdParamsSchema = z.object({
  seasonId: z.string().min(1),
})
export const HandleParamsSchema = z.object({
  handle: z.string().min(1),
})

export const ServiceErrorDtoSchema = z.object({
  code: z.enum(SERVICE_SCHEMA_ERROR_CODES),
  message: z.string().min(1),
  status: z.number().int().min(400).max(599),
  publicSafe: z.literal(true),
  details: JsonValueSchema.optional(),
})

export const ServiceHealthDtoSchema = z.object({
  ok: z.literal(true),
  service: z.literal("cowards-service"),
  version: z.literal(SERVICE_SCHEMA_API_VERSION),
})

export const ServiceApiRouteIdSchema = z.enum(SERVICE_SCHEMA_ROUTE_IDS)

export const AuthSessionServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("authSession"),
  user: z
    .object({
      id: z.string().min(1),
      username: z.string().min(1),
      handle: z.string().min(1),
      displayName: z.string().min(1),
    })
    .nullable(),
})

export const CreateSessionRequestBodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const CreateSessionServiceDtoSchema = AuthSessionServiceDtoSchema

export const RevokeSessionServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("sessionRevoked"),
  revoked: z.literal(true),
})

export const StrategyRevisionSummaryServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("strategyRevisionSummary"),
  strategyId: z.string().min(1),
  strategyRevisionId: z.string().min(1),
  label: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  starterLineage: StrategyRevisionMetadataSchema.shape.starterLineage,
  advancedLineage: StrategyRevisionMetadataSchema.shape.advancedLineage,
  sourceHash: z.string().min(1),
  sourceBytes: z.number().int().min(0),
  runtimeSemantics: z.object({
    languageLabel: z.string().min(1),
    adapterLabel: z.string().min(1),
    readiness: z.string().min(1),
    readinessLabel: z.string().min(1),
    experimental: z.boolean(),
    countedPlayEligible: z.boolean(),
    countedPlayLabel: z.enum(["Counted eligible", "Not counted"]),
    countedPlayReason: z.string().min(1).nullable(),
    sourcePolicyLabel: z.string().min(1),
    packagePolicyLabel: z.string().min(1),
    docsReference: z.string().min(1),
    examplesReference: z.string().min(1),
    warnings: z.array(z.string().min(1)),
    validationIssueCodes: z.array(z.string().min(1)),
  }),
  engineCompatibility: z.object({
    spec: z.string().min(1),
    engine: z.string().min(1),
  }),
  validationStatus: z.enum(["valid", "invalid"]),
  createdAt: z.string().min(1),
  lockedAt: z.string().min(1).optional(),
})

export const ListStrategyRevisionsServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("strategyRevisionList"),
  revisions: z.array(StrategyRevisionSummaryServiceDtoSchema),
})

export const StrategyRevisionSubmissionBodySchema = z.object({
  strategyId: z.string().min(1).optional(),
  source: z.string().min(1),
  label: z.string().min(1).optional(),
})

export const StrategyRevisionSubmissionServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("strategyRevisionCreated"),
  strategyId: z.string().min(1),
  strategyRevisionId: z.string().min(1),
  validationStatus: z.enum(["valid", "invalid"]),
})

export const StrategyRevisionSourceServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("strategyRevisionSource"),
  strategyRevisionId: z.string().min(1),
  source: z.string().min(1),
  sourceHash: z.string().min(1),
})

export const CreateMatchSetRequestBodySchema = z.object({
  presetId: z.string().min(1),
  entrantRevisionIds: z.array(z.string().min(1)).min(2),
})

export const CreateMatchSetServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("matchSetCreated"),
  matchSetId: z.string().min(1),
  publicHref: z.string().min(1),
})

const CompetitionScoringPolicyServiceDtoSchema = z.object({
  id: z.literal("exhibition-points-v1"),
  version: z.literal("v1"),
  winPoints: z.literal(3),
  drawPoints: z.literal(1),
  lossPoints: z.literal(0),
  strategyFailurePenaltyPoints: z.literal(-1),
})

const CompetitionEntrantSnapshotServiceDtoSchema = z.object({
  entrantId: z.string().min(1),
  entrantIndex: z.number().int().nonnegative(),
  strategyRevisionId: z.string().min(1),
  ownerUserId: z.string().min(1),
  ownerHandle: z.string().min(1),
  displayLabel: z.string().min(1),
  sourceHash: z.string().min(1),
  sourceBytes: z.number().int().min(0),
  runtime: PublicStrategyRuntimeMetadataSchema,
  engineCompatibility: z.object({
    spec: z.string().min(1),
    engine: z.string().min(1),
  }),
  lockedAt: z.string().min(1),
})

const PublicScorePenaltyServiceDtoSchema = z.object({
  matchId: z.string().min(1).optional(),
  reason: z.enum([
    "strategy_failure",
    "system_failure",
    "invalid_result",
    "no_result",
  ]),
  points: z.number().int(),
})

const PublicStandingServiceDtoSchema = z.object({
  rank: z.number().int().positive(),
  entrantId: z.string().min(1),
  strategyRevisionId: z.string().min(1),
  ownerHandle: z.string().min(1),
  displayLabel: z.string().min(1),
  sourceHash: z.string().min(1),
  points: z.number().int(),
  wins: z.number().int().nonnegative(),
  draws: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  penalties: z.array(PublicScorePenaltyServiceDtoSchema),
  survivingSoldiers: z.number().int().nonnegative(),
  survivalTurns: z.number().int().nonnegative(),
  tieBreakerPath: z.array(z.string().min(1)),
})

const PublicMatchEvidenceServiceDtoSchema = z.object({
  matchId: z.string().min(1),
  entrants: z.object({
    bottom: z.string().min(1),
    top: z.string().min(1),
  }),
  status: z.enum([
    "pending",
    "running",
    "complete",
    "failed_system",
    "blocked",
  ]),
  replayAvailable: z.boolean(),
  chronicleHash: z.string().min(1).optional(),
  publicReason: z
    .enum(["strategy_failure", "system_failure", "invalid_result", "no_result"])
    .optional(),
  arenaVariantId: z.string().min(1).optional(),
})

export const PublicMatchSetResultServiceDtoSchema = z.object({
  matchSetId: z.string().min(1),
  preset: z.object({
    id: z.enum(["smoke-exhibition-v1", "standard-exhibition-v1"]),
    version: z.literal("v1"),
    label: z.string().min(1),
  }),
  status: z.enum([
    "accepted",
    "queued",
    "running",
    "complete",
    "degraded",
    "failed",
  ]),
  visibility: z.literal("public"),
  scoringPolicy: CompetitionScoringPolicyServiceDtoSchema,
  entrants: z.array(CompetitionEntrantSnapshotServiceDtoSchema),
  standings: z.array(PublicStandingServiceDtoSchema),
  matches: z.array(PublicMatchEvidenceServiceDtoSchema),
  provenance: z.object({
    matchSetId: z.string().min(1),
    presetId: z.enum(["smoke-exhibition-v1", "standard-exhibition-v1"]),
    scoringPolicyVersion: z.string().min(1),
    entrantSnapshotIds: z.array(z.string().min(1)),
    chronicleHashes: z.array(z.string().min(1)),
  }),
  publication: z.object({
    publicResults: z.literal(true),
    publicReplayEvidence: z.literal(true),
    privateFieldsExcluded: z.array(z.string().min(1)),
  }),
  metadata: JsonValueSchema.optional(),
})

export const PublicMatchSetSummaryServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("publicMatchSetSummary"),
  matchSetId: z.string().min(1),
  result: PublicMatchSetResultServiceDtoSchema,
})

export const PublicReplayMetadataServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("publicReplayMetadata"),
  matchId: z.string().min(1),
  metadata: z.object({
    matchId: z.string().min(1),
    chronicleId: z.string().min(1),
    hash: z.string().min(1),
    schemaVersion: z.string().min(1),
    eventCount: z.number().int().nonnegative(),
    snapshotCount: z.number().int().nonnegative(),
    bottomPlayerId: z.string().min(1),
    topPlayerId: z.string().min(1),
    arenaVariantId: z.string().min(1),
  }),
})

export const AnalyticsProfileServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("analyticsProfile"),
  profileId: z.string().min(1),
  ownerUserId: z.string().min(1),
  label: z.string().min(1),
  revisionIds: z.array(z.string().min(1)),
})

export const ListAnalyticsProfilesServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("analyticsProfileList"),
  profiles: z.array(AnalyticsProfileServiceDtoSchema),
})

export const CreateAnalyticsRunRequestBodySchema = z.object({
  notes: z.string().min(1).optional(),
})

export const CreateAnalyticsRunServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("analyticsRun"),
  runId: z.string().min(1),
  profileId: z.string().min(1),
  status: z.enum(["queued", "running", "complete", "failed"]),
  summary: JsonValueSchema.optional(),
})

export const AnalyticsRunSummaryServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("analyticsRunSummary"),
  runId: z.string().min(1),
  profileId: z.string().min(1),
  summary: AnalyticsGauntletRunSummarySchema,
})

export const ExportAnalyticsRunServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("exportManifest"),
  exportId: z.string().min(1),
  format: z.enum(["json", "csv"]),
  href: z.string().min(1),
  contentHash: z.string().min(1),
})

export const LadderSeasonServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("ladderSeason"),
  seasonId: z.string().min(1),
  status: z.string().min(1),
  publicHref: z.string().min(1),
})

export const ListLadderSeasonsServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("ladderSeasonList"),
  seasons: z.array(LadderSeasonServiceDtoSchema),
})

export const EnterLadderSeasonRequestBodySchema = z.object({
  strategyRevisionId: z.string().min(1),
})

export const EnterLadderSeasonServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("ladderEntryCreated"),
  seasonId: z.string().min(1),
  entryId: z.string().min(1),
  status: z.enum(["active", "withdrawn", "suspended", "invalidated", "stale"]),
})

export const PublicLadderMatchSetSummaryDtoSchema = z.object({
  matchSetId: z.string().min(1),
  seasonId: z.string().min(1),
  scheduleRunId: z.string().min(1).optional(),
  podIndex: z.number().int().nonnegative().optional(),
  status: z.enum([
    "accepted",
    "queued",
    "running",
    "complete",
    "degraded",
    "failed",
  ]),
  countedStatus: z.enum([
    "pending",
    "counted",
    "retrying",
    "under_review",
    "invalid",
    "non_competitive",
    "non_counted",
  ]),
  publicReason: z
    .enum([
      "system_failure",
      "incomplete_evidence",
      "invalid_result",
      "governance_hold",
      "non_counted",
    ])
    .optional(),
  publicExplanation: z.string().min(1).optional(),
  entrantIds: z.array(z.string().min(1)),
  replayHref: z.string().min(1).optional(),
  resultHref: z.string().min(1),
})

export const TrialLadderPolicyDtoSchema = z.object({
  oneEntryPerUser: z.literal(true),
  replacementPolicy: z.literal("next-season-only"),
  staleRevisionPolicy: z.string().min(1),
  standingsReset: z.literal(true),
  noPermanentRatings: z.literal(true),
  minimumEntries: z.number().int().nonnegative(),
  targetPodSize: z.number().int().positive(),
})

export const TrialLadderEntrySnapshotSchema =
  CompetitionEntrantSnapshotServiceDtoSchema.extend({
    seasonId: z.string().min(1),
    entryId: z.string().min(1),
    status: z.enum([
      "active",
      "withdrawn",
      "suspended",
      "invalidated",
      "stale",
    ]),
    strategyName: z.string().min(1),
    strategyDescription: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)),
  })

export const PublicTrialLadderSeasonDtoSchema = z.object({
  seasonId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  status: z.enum([
    "draft",
    "open",
    "scheduling",
    "active",
    "completed",
    "archived",
  ]),
  statusLabel: z.string().min(1),
  description: z.string().min(1).optional(),
  seasonSeed: z.string().min(1),
  openedAt: z.string().min(1).optional(),
  closedAt: z.string().min(1).optional(),
  scheduledAt: z.string().min(1).optional(),
  completedAt: z.string().min(1).optional(),
  archivedAt: z.string().min(1).optional(),
  policy: TrialLadderPolicyDtoSchema,
  entries: z.array(TrialLadderEntrySnapshotSchema),
  standings: z.array(PublicStandingServiceDtoSchema),
  matchSets: z.array(PublicLadderMatchSetSummaryDtoSchema),
  publication: z.object({
    publicEntries: z.literal(true),
    publicStandings: z.literal(true),
    publicReplayEvidence: z.literal(true),
    privateFieldsExcluded: z.array(z.string().min(1)),
  }),
})

export const PublicStrategyCardDtoSchema = z.object({
  strategyId: z.string().min(1),
  strategyRevisionId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)),
  authorHandle: z.string().min(1),
  sourceHash: z.string().min(1),
  sourceBytes: z.number().int().min(0),
  runtime: PublicStrategyRuntimeMetadataSchema,
  engineCompatibility: z.object({
    spec: z.string().min(1),
    engine: z.string().min(1),
  }),
  validationStatus: z.enum(["valid", "invalid"]),
  starterLineage: z
    .object({
      starterId: z.string().min(1),
      starterName: z.string().min(1),
      starterVersion: z.string().min(1),
      sourceHash: z.string().min(1),
    })
    .optional(),
  advancedLineage: z
    .object({
      advancedId: z.string().min(1),
      advancedName: z.string().min(1),
      advancedVersion: z.string().min(1),
      archetype: z.string().min(1),
      sourceHash: z.string().min(1),
    })
    .optional(),
  record: z.object({
    wins: z.number().int().nonnegative(),
    losses: z.number().int().nonnegative(),
    draws: z.number().int().nonnegative(),
    points: z.number().int(),
  }),
  resultLinks: z.array(z.string().min(1)),
  replayLinks: z.array(z.string().min(1)),
})

export const PublicPlayerProfileDtoSchema = z.object({
  handle: z.string().min(1),
  displayName: z.string().min(1),
  strategies: z.array(PublicStrategyCardDtoSchema),
  ladderHistory: z.array(
    z.object({
      seasonId: z.string().min(1),
      seasonName: z.string().min(1),
      entryStatus: z.enum([
        "active",
        "withdrawn",
        "suspended",
        "invalidated",
        "stale",
      ]),
      points: z.number().int(),
      rank: z.number().int().positive().optional(),
    }),
  ),
  results: z.array(PublicLadderMatchSetSummaryDtoSchema),
})

export const PublicPageServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("publicPage"),
  page: z.enum(["player", "strategy", "matchSet", "replay", "ladder"]),
  canonicalHref: z.string().min(1),
  payload: JsonValueSchema,
})

export const PublicPlayerPageServiceDtoSchema =
  PublicPageServiceDtoSchema.extend({
    page: z.literal("player"),
    payload: PublicPlayerProfileDtoSchema,
  })

export const PublicLadderPageServiceDtoSchema =
  PublicPageServiceDtoSchema.extend({
    page: z.literal("ladder"),
    payload: PublicTrialLadderSeasonDtoSchema,
  })

export const PublicStrategyPageServiceDtoSchema =
  PublicPageServiceDtoSchema.extend({
    page: z.literal("strategy"),
    payload: z.object({
      strategy: PublicStrategyCardDtoSchema,
    }),
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
  "ACTIVATION_SKIPPED",
  "ACTIVATION_ENDED",
  "CYCLE_STARTED",
  "CYCLE_ENDED",
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

export const ChronicleSchemaVersionSchema = z.union([
  z.literal("chronicle-v1"),
  z.literal("chronicle-v1.4"),
])

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
    type: z.literal("ACTIVATION_SKIPPED"),
    payload: SoldierIdPayloadSchema.extend({
      cycleIndex: z.number().int().nonnegative(),
      reason: z.string().min(1),
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("ACTIVATION_ENDED"),
    payload: SoldierIdPayloadSchema.extend({
      reason: z.string().min(1),
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("CYCLE_STARTED"),
    payload: SoldierIdPayloadSchema.extend({
      cycleIndex: z.number().int().nonnegative(),
    }),
  }),
  ChronicleEventBaseSchema.extend({
    type: z.literal("CYCLE_ENDED"),
    payload: SoldierIdPayloadSchema.extend({
      cycleIndex: z.number().int().nonnegative(),
    }),
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
      boundary: z.enum([
        "activation-start",
        "activation-end",
        "post-advance",
        "cycle-start",
        "cycle-end",
      ]),
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
