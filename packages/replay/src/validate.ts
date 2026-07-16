import { createHash } from "node:crypto"
import { verifyCandidateExecutionEvidence as verifyCurrentExecutionEvidence } from "@cowards/engine/recorder-evidence"
import {
  ChronicleSchema,
  COMPATIBILITY_VERSIONS,
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD,
  STRATEGY_RUNTIME_ABI_VERSION,
  MatchExecutionExactEvidenceV137Schema,
  RuntimeExecutionFinalStateSchema,
  resolveCanonicalCompatibilityTuple,
  resolveHistoricalRuntimeV114SemanticTuple,
  validateCanonicalArena,
  validateCanonicalGameState,
  validateCanonicalInitialGameState,
  validateCanonicalTransition,
  type CanonicalCompatibilityTuple,
  type CanonicalSemanticGameState,
  type Chronicle,
  type ChronicleEventType,
  type ChronicleSnapshotKind,
  type ChronicleValidationError,
  type ChronicleValidationResult,
  type JsonValue,
  type SemanticIntegrityCode,
  type SemanticIntegrityIssue,
} from "@cowards/spec"
import { validateChronicleGrammar } from "./grammar.js"
import { validateHistoricalV14Grammar } from "./historical-v1-4-grammar.js"
import { createChronicleContentHash, stableStringify } from "./hash.js"
import {
  resolveReplayTransitionEventContract,
  validateChronicleTransitions,
} from "./replay-transition.js"
import {
  recordChronicleFromExecution,
  type ChronicleBoundaryAnchor,
  type ChronicleRecorderExecution,
} from "./record.js"
import { validateSnapshotBoundaries } from "./snapshot-boundaries.js"
import { validateCurrentTransitionPostconditions } from "./current-transition-postconditions.js"

const SUPPORTED_SCHEMA_VERSION = "chronicle-v1.4"

export const V1_37_CURRENT_REPLAY_TUPLE = Object.freeze({
  tupleId: CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tupleId,
  tuple: Object.freeze({
    ...CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tuple,
  }),
}) satisfies Readonly<{
  tupleId: string
  tuple: Readonly<CanonicalCompatibilityTuple>
}>

if (
  V1_37_CURRENT_REPLAY_TUPLE.tuple.runtimeAbi !== STRATEGY_RUNTIME_ABI_VERSION
) {
  throw new Error("Current replay authority is not the activated v1.17 tuple.")
}

export const CURRENT_REPLAY_ADMISSION_CODE_ORDER = Object.freeze([
  "CURRENT_ROUTE_INVALID",
  "CURRENT_SHAPE_INVALID",
  "CURRENT_TUPLE_INVALID",
  "CURRENT_VERSION_INVALID",
  "CURRENT_EVENT_INVALID",
  "CURRENT_GRAMMAR_INVALID",
  "CURRENT_INITIAL_STATE_INVALID",
  "CURRENT_BOUNDARY_STATE_INVALID",
  "CURRENT_BOUNDARY_HASH_INVALID",
  "CURRENT_RECONSTRUCTION_INVALID",
  "CURRENT_TERMINAL_INVALID",
] as const)

export type CurrentReplayAdmissionCode =
  (typeof CURRENT_REPLAY_ADMISSION_CODE_ORDER)[number]
export type CurrentReplaySemanticCode =
  | CurrentReplayAdmissionCode
  | SemanticIntegrityCode

export interface CurrentReplaySemanticIssue {
  readonly code: CurrentReplaySemanticCode
  readonly path: readonly (string | number)[]
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>
}

export type CurrentChronicleSemanticValidationResult =
  | {
      readonly ok: true
      readonly profile: "current-exact"
      readonly publishable: true
      readonly current: true
      readonly issues: readonly []
      readonly truncated: false
    }
  | {
      readonly ok: false
      readonly profile: "current-exact"
      readonly publishable: false
      readonly current: true
      readonly category: "CANONICAL_INTEGRITY_FAILURE"
      readonly ownership: "system_integrity"
      readonly issues: readonly CurrentReplaySemanticIssue[]
      readonly truncated: boolean
    }

export interface CurrentChronicleSemanticInput {
  readonly profile: "current-exact"
  readonly compatibility: {
    readonly tupleId: string
    readonly tuple: Readonly<CanonicalCompatibilityTuple>
  }
  readonly chronicle: unknown
  readonly boundaryAnchors: readonly ChronicleBoundaryAnchor[]
  readonly execution: ChronicleRecorderExecution
}

const REQUIRED_COMPLETED_EVENT_TYPES = [
  "MATCH_STARTED",
  "ROUND_STARTED",
  "STRATEGY_EVALUATED",
  "ACTIVATION_STARTED",
  "AWARENESS_GRID_OBSERVED",
  "ACTION_EMITTED",
  "MATCH_ENDED",
] as const satisfies readonly ChronicleEventType[]

const CURRENT_REQUIRED_COMPLETED_EVENT_TYPES = [
  "MATCH_STARTED",
  "ROUND_STARTED",
  "STRATEGY_EVALUATED",
  "MATCH_ENDED",
] as const satisfies readonly ChronicleEventType[]

const REQUIRED_COMPLETED_SNAPSHOT_KINDS = [
  "MATCH_START",
  "MATCH_END",
  "TERMINAL",
] as const satisfies readonly ChronicleSnapshotKind[]

const error = (
  code: ChronicleValidationError["code"],
  message: string,
  details: Omit<ChronicleValidationError, "code" | "message"> = {},
): ChronicleValidationError => ({
  code,
  message,
  ...details,
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value)
  return (
    keys.length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  )
}

export type ReplayCompatibilityIdentityResolution =
  | {
      status: "current_exact"
      tupleId: string
    }
  | {
      status: "historical_original_semantics"
      tupleResolution: "unresolved_legacy"
    }
  | {
      status: "historical_v1_16_exact"
      tupleId: string
      tupleResolution: "resolved_v1.16"
    }
  | {
      status: "invalid"
      reason:
        | "missing_or_mixed_current_tuple"
        | "invalid_current_execution_evidence"
        | "unsupported_profile"
    }

export const resolveReplayCompatibilityIdentity = (
  input: unknown,
): ReplayCompatibilityIdentityResolution => {
  if (!isRecord(input)) {
    return { status: "invalid", reason: "unsupported_profile" }
  }
  if (input.profile === "historical-v1.4") {
    return hasExactKeys(input, ["profile", "chronicle"])
      ? {
          status: "historical_original_semantics",
          tupleResolution: "unresolved_legacy",
        }
      : { status: "invalid", reason: "unsupported_profile" }
  }
  if (input.profile === "historical-v1.16") {
    if (!hasExactKeys(input, ["profile", "compatibility", "chronicle"])) {
      return { status: "invalid", reason: "unsupported_profile" }
    }
    const resolved = resolveHistoricalRuntimeV114SemanticTuple(
      input.compatibility,
    )
    return resolved === undefined
      ? { status: "invalid", reason: "missing_or_mixed_current_tuple" }
      : {
          status: "historical_v1_16_exact",
          tupleId: resolved.tupleId,
          tupleResolution: "resolved_v1.16",
        }
  }
  if (
    input.profile !== "current-exact" ||
    !(
      hasExactKeys(input, ["profile", "compatibility", "chronicle"]) ||
      hasExactKeys(input, [
        "profile",
        "compatibility",
        "executionEvidence",
        "chronicle",
      ])
    )
  ) {
    return {
      status: "invalid",
      reason:
        input.profile === "current-exact"
          ? "missing_or_mixed_current_tuple"
          : "unsupported_profile",
    }
  }
  const resolved = resolveCanonicalCompatibilityTuple(input.compatibility)
  if (!resolved) {
    return { status: "invalid", reason: "missing_or_mixed_current_tuple" }
  }
  if (Object.hasOwn(input, "executionEvidence")) {
    const parsed = MatchExecutionExactEvidenceV137Schema.safeParse(
      input.executionEvidence,
    )
    if (
      !parsed.success ||
      parsed.data.evidenceSnapshot.compatibility.tupleId !== resolved.tupleId
    ) {
      return {
        status: "invalid",
        reason: "invalid_current_execution_evidence",
      }
    }
    const chronicle = input.chronicle
    if (
      isRecord(chronicle) &&
      isRecord(chronicle.reproducibility) &&
      typeof chronicle.reproducibility.matchId === "string" &&
      parsed.data.matchId !== chronicle.reproducibility.matchId
    ) {
      return {
        status: "invalid",
        reason: "invalid_current_execution_evidence",
      }
    }
  }
  return { status: "current_exact", tupleId: resolved.tupleId }
}

export const validateReplayInput = (
  input: unknown,
): ChronicleValidationResult | CurrentChronicleSemanticValidationResult => {
  if (
    isRecord(input) &&
    input.profile === "current-exact" &&
    hasExactKeys(input, [
      "profile",
      "compatibility",
      "chronicle",
      "boundaryAnchors",
      "execution",
    ])
  ) {
    return validateCurrentChronicle(input)
  }
  const compatibility = resolveReplayCompatibilityIdentity(input)
  if (compatibility.status === "invalid") {
    return {
      ok: false,
      errors: [
        error(
          "VERSION_INCOMPATIBLE",
          compatibility.reason === "missing_or_mixed_current_tuple"
            ? "Current replay requires one exact registered compatibility tuple."
            : compatibility.reason === "invalid_current_execution_evidence"
              ? "Current replay execution evidence is invalid or does not match the replay identity."
              : "Replay compatibility profile is unsupported.",
        ),
      ],
    }
  }
  return compatibility.status === "historical_original_semantics"
    ? validateHistoricalV14Chronicle(
        (input as Record<string, unknown>).chronicle,
      )
    : validateChronicle((input as Record<string, unknown>).chronicle)
}

export const migrateChronicle = (
  chronicle: JsonValue,
): Chronicle | ChronicleValidationError => {
  if (!isRecord(chronicle)) {
    return error(
      "UNSUPPORTED_MIGRATION",
      "Chronicle migration requires an object input.",
    )
  }
  if (chronicle.schemaVersion === SUPPORTED_SCHEMA_VERSION) {
    const parsed = ChronicleSchema.safeParse(chronicle)
    if (!parsed.success) {
      return error(
        "SCHEMA_INVALID",
        "Chronicle does not match the canonical schema.",
        {
          actual: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })) as JsonValue,
        },
      )
    }
    const parsedChronicle = parsed.data as Chronicle
    const validation = validateParsedChronicle(parsedChronicle)
    if (!validation.ok) {
      return (
        validation.errors[0] ??
        error("SCHEMA_INVALID", "Chronicle validation failed.")
      )
    }
    return parsedChronicle
  }
  return error(
    "UNSUPPORTED_MIGRATION",
    "No Chronicle migrations are supported.",
    {
      expected: SUPPORTED_SCHEMA_VERSION,
      actual:
        typeof chronicle.schemaVersion === "string"
          ? chronicle.schemaVersion
          : "missing",
    },
  )
}

const validateVersion = (chronicle: Chronicle): ChronicleValidationError[] => {
  const errors: ChronicleValidationError[] = []
  if (chronicle.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    errors.push(
      error("VERSION_INCOMPATIBLE", "Unsupported Chronicle schema version.", {
        expected: SUPPORTED_SCHEMA_VERSION,
        actual: chronicle.schemaVersion,
      }),
    )
  }

  const versions = chronicle.reproducibility.versions
  const unsupported = Object.entries(COMPATIBILITY_VERSIONS).find(
    ([key, expected]) =>
      versions[key as keyof typeof COMPATIBILITY_VERSIONS] !== expected,
  )
  if (unsupported) {
    const [key, expected] = unsupported
    errors.push(
      error("VERSION_INCOMPATIBLE", `Unsupported ${key} version.`, {
        expected,
        actual: versions[key as keyof typeof COMPATIBILITY_VERSIONS],
      }),
    )
  }
  return errors
}

const validateEventOrder = (
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  const errors: ChronicleValidationError[] = []
  chronicle.events.forEach((event, index) => {
    if (event.sequence !== index) {
      errors.push(
        error(
          "EVENT_ORDER_INVALID",
          "Chronicle event sequences must be contiguous from zero.",
          { sequence: event.sequence, expected: index, actual: event.sequence },
        ),
      )
    }
  })

  const firstMatchStart = chronicle.events.findIndex(
    (event) => event.type === "MATCH_STARTED",
  )
  const firstRoundStart = chronicle.events.findIndex(
    (event) => event.type === "ROUND_STARTED",
  )
  const firstActivationStart = chronicle.events.findIndex(
    (event) => event.type === "ACTIVATION_STARTED",
  )
  const matchEnded = chronicle.events
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => event.type === "MATCH_ENDED")

  if (firstMatchStart !== 0) {
    errors.push(
      error("EVENT_ORDER_INVALID", "Chronicle must start with MATCH_STARTED.", {
        expected: "MATCH_STARTED at sequence 0",
        actual: chronicle.events[0]?.type ?? "missing",
      }),
    )
  }
  if (firstRoundStart >= 0 && firstRoundStart < firstMatchStart) {
    errors.push(
      error(
        "EVENT_ORDER_INVALID",
        "ROUND_STARTED cannot precede MATCH_STARTED.",
        {
          sequence: chronicle.events[firstRoundStart]?.sequence,
        },
      ),
    )
  }
  if (firstActivationStart >= 0 && firstActivationStart < firstRoundStart) {
    errors.push(
      error(
        "EVENT_ORDER_INVALID",
        "ACTIVATION_STARTED cannot precede ROUND_STARTED.",
        { sequence: chronicle.events[firstActivationStart]?.sequence },
      ),
    )
  }
  if (matchEnded.length !== 1) {
    errors.push(
      error(
        "EVENT_ORDER_INVALID",
        "Chronicle must contain exactly one MATCH_ENDED event.",
        {
          expected: 1,
          actual: matchEnded.length,
        },
      ),
    )
  } else if (matchEnded[0]?.index !== chronicle.events.length - 1) {
    errors.push(
      error("EVENT_ORDER_INVALID", "MATCH_ENDED must be the final event.", {
        sequence: matchEnded[0]?.event.sequence,
      }),
    )
  }

  return errors
}

const validateRequiredEvents = (
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  const isCompleted = chronicle.events.some(
    (event) => event.type === "MATCH_ENDED",
  )
  if (!isCompleted) {
    return []
  }
  const present = new Set(chronicle.events.map((event) => event.type))
  return REQUIRED_COMPLETED_EVENT_TYPES.flatMap((type) =>
    present.has(type)
      ? []
      : [
          error(
            "REQUIRED_EVENT_MISSING",
            `Completed Chronicle is missing ${type}.`,
            { expected: type },
          ),
        ],
  )
}

const validateCurrentRequiredEvents = (
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  if (!chronicle.events.some(({ type }) => type === "MATCH_ENDED")) return []
  const present = new Set(chronicle.events.map(({ type }) => type))
  return CURRENT_REQUIRED_COMPLETED_EVENT_TYPES.flatMap((type) =>
    present.has(type)
      ? []
      : [
          error(
            "REQUIRED_EVENT_MISSING",
            `Completed current Chronicle is missing ${type}.`,
            { expected: type },
          ),
        ],
  )
}

const validateSnapshots = (
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  const present = new Set(chronicle.snapshots.map((snapshot) => snapshot.kind))
  const errors = REQUIRED_COMPLETED_SNAPSHOT_KINDS.flatMap((kind) =>
    present.has(kind)
      ? []
      : [
          error("SNAPSHOT_MISSING", `Chronicle is missing ${kind} snapshot.`, {
            expected: kind,
          }),
        ],
  )

  if (
    chronicle.events.some((event) => event.type === "ROUND_STARTED") &&
    (!present.has("ROUND_START") || !present.has("ROUND_END"))
  ) {
    errors.push(
      error(
        "SNAPSHOT_MISSING",
        "Chronicle with rounds requires ROUND_START and ROUND_END snapshots.",
        { expected: "ROUND_START and ROUND_END" },
      ),
    )
  }
  if (
    chronicle.events.some((event) => event.type === "CONTRACTION_RESOLVED") &&
    !present.has("CONTRACTION")
  ) {
    errors.push(
      error(
        "SNAPSHOT_MISSING",
        "Chronicle with Contraction requires a CONTRACTION snapshot.",
        { expected: "CONTRACTION" },
      ),
    )
  }

  const eventSequences = new Set(
    chronicle.events.map((event) => event.sequence),
  )
  for (const snapshot of chronicle.snapshots) {
    if (!eventSequences.has(snapshot.sequence)) {
      errors.push(
        error(
          "SNAPSHOT_MISSING",
          "Chronicle snapshot must reference an existing event sequence.",
          { sequence: snapshot.sequence },
        ),
      )
    }
  }

  return errors
}

const validateHash = (chronicle: Chronicle): ChronicleValidationError[] => {
  if (chronicle.integrity === undefined) {
    return []
  }
  const expected = createChronicleContentHash(chronicle)
  if (
    chronicle.integrity.algorithm !== expected.algorithm ||
    chronicle.integrity.normalizedContentHash !== expected.normalizedContentHash
  ) {
    return [
      error(
        "HASH_MISMATCH",
        "Chronicle content hash does not match integrity metadata.",
        {
          expected: expected as unknown as JsonValue,
          actual: chronicle.integrity as unknown as JsonValue,
        },
      ),
    ]
  }
  return []
}

const validateParsedChronicle = (
  chronicle: Chronicle,
): ChronicleValidationResult => {
  const errors = [
    ...validateVersion(chronicle),
    ...validateEventOrder(chronicle),
    ...validateRequiredEvents(chronicle),
    ...validateSnapshots(chronicle),
    ...validateChronicleGrammar(chronicle),
    ...validateSnapshotBoundaries(chronicle),
    ...validateChronicleTransitions(chronicle),
    ...validateHash(chronicle),
  ]

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

export const validateChronicle = (
  chronicle: unknown,
): ChronicleValidationResult => {
  if (
    isRecord(chronicle) &&
    chronicle.schemaVersion !== undefined &&
    chronicle.schemaVersion !== SUPPORTED_SCHEMA_VERSION
  ) {
    return {
      ok: false,
      errors: [
        error("VERSION_INCOMPATIBLE", "Unsupported Chronicle schema version.", {
          expected: SUPPORTED_SCHEMA_VERSION,
          actual:
            typeof chronicle.schemaVersion === "string"
              ? chronicle.schemaVersion
              : "invalid",
        }),
      ],
    }
  }

  const parsed = ChronicleSchema.safeParse(chronicle)
  if (!parsed.success) {
    return {
      ok: false,
      errors: [
        error(
          "SCHEMA_INVALID",
          "Chronicle does not match the canonical schema.",
          {
            actual: parsed.error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })) as JsonValue,
          },
        ),
      ],
    }
  }

  const parsedChronicle = parsed.data as Chronicle
  return validateParsedChronicle(parsedChronicle)
}

/** Frozen v1.4 route. Plan 19 must not replace this comparator with current. */
export const validateHistoricalV14Chronicle = (
  chronicle: unknown,
): ChronicleValidationResult => {
  const errors = validateHistoricalV14Grammar(chronicle)
  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

const CURRENT_ISSUE_LIMIT = 16
const CURRENT_PATH_LIMIT = 8
const STATE_HASH_DOMAIN =
  "cowards-game:candidate-game-state-projection:v1" as const

const codePointCompare = (left: string, right: string): number => {
  const leftPoints = Array.from(left, (value) => value.codePointAt(0)!)
  const rightPoints = Array.from(right, (value) => value.codePointAt(0)!)
  const length = Math.min(leftPoints.length, rightPoints.length)
  for (let index = 0; index < length; index += 1) {
    const difference = leftPoints[index]! - rightPoints[index]!
    if (difference !== 0) return difference
  }
  return leftPoints.length - rightPoints.length
}

const boundedCurrentIssue = (
  code: CurrentReplaySemanticCode,
  path: readonly (string | number)[] = [],
  metadata: Readonly<Record<string, string | number | boolean | null>> = {},
): CurrentReplaySemanticIssue =>
  Object.freeze({
    code,
    path: Object.freeze(
      path
        .slice(0, CURRENT_PATH_LIMIT)
        .map((segment) =>
          typeof segment === "number" ? segment : segment.slice(0, 80),
        ),
    ),
    metadata: Object.freeze(
      Object.fromEntries(
        Object.entries(metadata)
          .sort(([left], [right]) => codePointCompare(left, right))
          .slice(0, 4)
          .map(([key, value]) => [
            key.slice(0, 40),
            typeof value === "string" ? value.slice(0, 64) : value,
          ]),
      ),
    ),
  })

const currentFailure = (
  issues: readonly CurrentReplaySemanticIssue[],
  alreadyTruncated = false,
): CurrentChronicleSemanticValidationResult =>
  Object.freeze({
    ok: false,
    profile: "current-exact",
    publishable: false,
    current: true,
    category: "CANONICAL_INTEGRITY_FAILURE",
    ownership: "system_integrity",
    issues: Object.freeze(issues.slice(0, CURRENT_ISSUE_LIMIT)),
    truncated: alreadyTruncated || issues.length > CURRENT_ISSUE_LIMIT,
  })

const currentCodeFailure = (
  code: CurrentReplayAdmissionCode,
  path: readonly (string | number)[] = [],
  metadata: Readonly<Record<string, string | number | boolean | null>> = {},
): CurrentChronicleSemanticValidationResult =>
  currentFailure([boundedCurrentIssue(code, path, metadata)])

const currentSuccess = (): CurrentChronicleSemanticValidationResult =>
  Object.freeze({
    ok: true,
    profile: "current-exact",
    publishable: true,
    current: true,
    issues: Object.freeze([]) as readonly [],
    truncated: false,
  })

const prefixedSemanticFailure = (
  issues: readonly SemanticIntegrityIssue[],
  prefix: readonly (string | number)[],
  truncated: boolean,
): CurrentChronicleSemanticValidationResult =>
  currentFailure(
    issues.map((issue) =>
      boundedCurrentIssue(issue.code, [...prefix, ...issue.path], {
        ...issue.metadata,
      }),
    ),
    truncated,
  )

const projectionAsState = (
  projection: unknown,
): CanonicalSemanticGameState | undefined => {
  if (!isRecord(projection)) return undefined
  const players = Array.isArray(projection.players)
    ? projection.players.map((player) =>
        isRecord(player) ? { ...player, strategyMemory: {} } : player,
      )
    : projection.players
  const soldiers = Array.isArray(projection.soldiers)
    ? projection.soldiers.map((soldier) =>
        isRecord(soldier) ? { ...soldier, soldierMemory: {} } : soldier,
      )
    : projection.soldiers
  const current = {
    ...projection,
    players,
    soldiers,
    ...(projection.outcome === null ? { outcome: undefined } : {}),
  }
  const parsed = RuntimeExecutionFinalStateSchema.safeParse(current)
  return parsed.success
    ? (parsed.data as CanonicalSemanticGameState)
    : undefined
}

const projectStateForRecording = (state: CanonicalSemanticGameState) => ({
  matchId: state.matchId,
  seed: state.seed,
  versions: {
    spec: state.versions.spec,
    engine: state.versions.engine,
    runtimeJs: state.versions.runtimeJs,
    chronicle: state.versions.chronicle,
    strategyRevision: state.versions.strategyRevision,
    arenaVariant: state.versions.arenaVariant,
  },
  arenaVariant: {
    id: state.arenaVariant.id,
    name: state.arenaVariant.name,
    initialBounds: { ...state.arenaVariant.initialBounds },
    terrainStones: [...state.arenaVariant.terrainStones]
      .map(({ x, y }) => ({ x, y }))
      .sort((left, right) => left.x - right.x || left.y - right.y),
  },
  players: [...state.players]
    .map(({ id, side, strategyRevisionId }) => ({
      id,
      side,
      strategyRevisionId,
    }))
    .sort((left, right) => codePointCompare(left.id, right.id)),
  phase: state.phase,
  phaseNumber: state.phaseNumber,
  roundNumber: state.roundNumber,
  activationCount: state.activationCount,
  initiativePlayerId: state.initiativePlayerId,
  bounds: { ...state.bounds },
  soldiers: [...state.soldiers]
    .map(
      ({
        id,
        ownerPlayerId,
        status,
        position,
        facing,
        lastSuccessfulMoveDirection,
      }) => ({
        id,
        ownerPlayerId,
        status,
        position: position === null ? null : { ...position },
        facing,
        lastSuccessfulMoveDirection,
      }),
    )
    .sort((left, right) => codePointCompare(left.id, right.id)),
  terrainStones: [...state.terrainStones]
    .map(({ x, y }) => ({ x, y }))
    .sort((left, right) => left.x - right.x || left.y - right.y),
  outcome: state.outcome ?? null,
})

const hashStateProjection = (projection: unknown): string =>
  `sha256:${createHash("sha256")
    .update(`${STATE_HASH_DOMAIN}\0`, "utf8")
    .update(JSON.stringify(projection), "utf8")
    .digest("hex")}`

const boardFromProjection = (projection: Record<string, unknown>) => ({
  bounds: projection.bounds,
  soldiers: projection.soldiers,
  terrainStones: projection.terrainStones,
})

const currentInputHasExactRoute = (input: Record<string, unknown>): boolean =>
  hasExactKeys(input, [
    "profile",
    "compatibility",
    "chronicle",
    "boundaryAnchors",
    "execution",
  ])

export const validateCurrentChronicleSemantics = (
  input: unknown,
): CurrentChronicleSemanticValidationResult => {
  if (
    !isRecord(input) ||
    input.profile !== "current-exact" ||
    !currentInputHasExactRoute(input)
  ) {
    return currentCodeFailure("CURRENT_ROUTE_INVALID")
  }
  if (!isRecord(input.compatibility)) {
    return currentCodeFailure("CURRENT_TUPLE_INVALID")
  }
  if (
    input.compatibility.tupleId !== V1_37_CURRENT_REPLAY_TUPLE.tupleId ||
    JSON.stringify(input.compatibility.tuple) !==
      JSON.stringify(V1_37_CURRENT_REPLAY_TUPLE.tuple)
  ) {
    return currentCodeFailure("CURRENT_TUPLE_INVALID", ["compatibility"])
  }

  const execution = input.execution as ChronicleRecorderExecution
  if (
    !isRecord(execution) ||
    execution.kind !== "completed" ||
    !Array.isArray(execution.transitions) ||
    execution.transitions.length === 0 ||
    !isRecord(execution.recorderMaterial)
  ) {
    return currentCodeFailure("CURRENT_SHAPE_INVALID", ["execution"])
  }
  if (!verifyCurrentExecutionEvidence(execution)) {
    return currentCodeFailure("CURRENT_BOUNDARY_HASH_INVALID", [
      "execution",
      "receipt",
    ])
  }
  const parsedChronicle = ChronicleSchema.safeParse(input.chronicle)
  if (!parsedChronicle.success || !Array.isArray(input.boundaryAnchors)) {
    return currentCodeFailure("CURRENT_SHAPE_INVALID", ["chronicle"])
  }
  const chronicle = parsedChronicle.data as Chronicle
  if (
    validateVersion(chronicle).length > 0 ||
    chronicle.reproducibility.matchId !==
      execution.recorderMaterial.finalState.matchId
  ) {
    return currentCodeFailure("CURRENT_VERSION_INVALID")
  }
  if (
    execution.transitions.some(
      (transition) =>
        transition.semanticTupleId !== V1_37_CURRENT_REPLAY_TUPLE.tupleId ||
        JSON.stringify(transition.semanticTuple) !==
          JSON.stringify(V1_37_CURRENT_REPLAY_TUPLE.tuple),
    )
  ) {
    return currentCodeFailure("CURRENT_TUPLE_INVALID", ["execution"])
  }

  const trustedRecording = recordChronicleFromExecution({
    execution,
    metadata: {
      schemaVersion: "chronicle-v1.4",
      semanticTupleId: V1_37_CURRENT_REPLAY_TUPLE.tupleId,
      semanticTuple: V1_37_CURRENT_REPLAY_TUPLE.tuple,
    },
  })
  if (!trustedRecording.ok) {
    return currentCodeFailure("CURRENT_BOUNDARY_HASH_INVALID", [
      "execution",
      "recorderMaterial",
    ])
  }
  if (
    stableStringify(chronicle.events) !==
      stableStringify(trustedRecording.chronicle.events) ||
    stableStringify(chronicle.private ?? null) !==
      stableStringify(trustedRecording.chronicle.private ?? null)
  ) {
    return currentCodeFailure("CURRENT_EVENT_INVALID", ["chronicle", "events"])
  }
  if (
    stableStringify(chronicle.snapshots) !==
      stableStringify(trustedRecording.chronicle.snapshots) ||
    stableStringify(input.boundaryAnchors) !==
      stableStringify(trustedRecording.boundaryAnchors)
  ) {
    return currentCodeFailure("CURRENT_BOUNDARY_STATE_INVALID", [
      "chronicle",
      "snapshots",
    ])
  }

  const eventErrors = [
    ...validateEventOrder(chronicle),
    ...validateCurrentRequiredEvents(chronicle),
    ...validateSnapshots(chronicle),
  ]
  if (
    eventErrors.length > 0 ||
    chronicle.events.some(
      ({ type }) =>
        resolveReplayTransitionEventContract(
          V1_37_CURRENT_REPLAY_TUPLE.tupleId,
          type,
        ) !== "current-exact",
    )
  ) {
    return currentCodeFailure("CURRENT_EVENT_INVALID")
  }
  if (validateChronicleGrammar(chronicle).length > 0) {
    return currentCodeFailure("CURRENT_GRAMMAR_INVALID")
  }
  if (
    validateSnapshotBoundaries(chronicle).length > 0 ||
    validateHash(chronicle).length > 0
  ) {
    return currentCodeFailure("CURRENT_BOUNDARY_STATE_INVALID")
  }

  const eventMaterial = execution.recorderMaterial.events
  const flattenedTransitionEvents = execution.transitions.flatMap(
    ({ events }) => events,
  )
  const publicEventMaterial = eventMaterial.map(
    ({ type, sequence, payload, context, privacy }) => ({
      type,
      sequence,
      payload,
      ...(context === undefined ? {} : { context }),
      ...(privacy === undefined ? {} : { privacy }),
    }),
  )
  if (
    !Array.isArray(eventMaterial) ||
    stableStringify(flattenedTransitionEvents) !==
      stableStringify(execution.result.events) ||
    stableStringify(publicEventMaterial) !==
      stableStringify(execution.result.events) ||
    chronicle.events.length !== eventMaterial.length ||
    chronicle.events.some((event, index) => {
      const material = eventMaterial[index]
      return (
        material === undefined ||
        event.type !== material.type ||
        event.sequence !== material.sequence ||
        event.privacy !== (material.privacy ?? "public") ||
        stableStringify(event.payload) !== stableStringify(material.payload)
      )
    })
  ) {
    return currentCodeFailure("CURRENT_EVENT_INVALID", ["chronicle", "events"])
  }

  const parsedInitial = RuntimeExecutionFinalStateSchema.safeParse(
    execution.recorderMaterial.initialState,
  )
  if (!parsedInitial.success) {
    return currentCodeFailure("CURRENT_INITIAL_STATE_INVALID")
  }
  const initialSemantic = validateCanonicalInitialGameState(
    parsedInitial.data as CanonicalSemanticGameState,
  )
  const initialArena = validateCanonicalArena(parsedInitial.data.arenaVariant)
  if (!initialArena.ok) {
    return prefixedSemanticFailure(
      initialArena.issues,
      ["execution", "initialState", "arenaVariant"],
      initialArena.truncated,
    )
  }
  if (!initialSemantic.ok) {
    return prefixedSemanticFailure(
      initialSemantic.issues,
      ["execution", "initialState"],
      initialSemantic.truncated,
    )
  }
  if (
    JSON.stringify(execution.transitions[0]!.beforeState) !==
      JSON.stringify(
        projectStateForRecording(
          parsedInitial.data as CanonicalSemanticGameState,
        ),
      ) ||
    execution.recorderMaterial.boundaries.length !==
      execution.transitions.length ||
    JSON.stringify(execution.recorderMaterial.boundaries) !==
      JSON.stringify(execution.transitions)
  ) {
    return currentCodeFailure("CURRENT_BOUNDARY_STATE_INVALID", [
      "execution",
      "transitions",
    ])
  }

  for (let index = 0; index < execution.transitions.length; index += 1) {
    const transition = execution.transitions[index]!
    const transitionSemantic = validateCanonicalTransition(transition)
    if (!transitionSemantic.ok) {
      return prefixedSemanticFailure(
        transitionSemantic.issues,
        ["execution", "transitions", index],
        transitionSemantic.truncated,
      )
    }
    const before = projectionAsState(transition.beforeState)
    const after = projectionAsState(transition.afterState)
    if (before === undefined || after === undefined) {
      return currentCodeFailure("CURRENT_BOUNDARY_STATE_INVALID", [
        "execution",
        "transitions",
        index,
      ])
    }
    for (const [side, state] of [
      ["beforeState", before],
      ["afterState", after],
    ] as const) {
      const semantic = validateCanonicalGameState(state)
      if (!semantic.ok) {
        return prefixedSemanticFailure(
          semantic.issues,
          ["execution", "transitions", index, side],
          semantic.truncated,
        )
      }
    }
    if (
      hashStateProjection(transition.beforeState) !==
        transition.beforeStateHash ||
      hashStateProjection(transition.afterState) !== transition.afterStateHash
    ) {
      return currentCodeFailure("CURRENT_BOUNDARY_HASH_INVALID", [
        "execution",
        "transitions",
        index,
      ])
    }
    const previous = execution.transitions[index - 1]
    if (
      previous !== undefined &&
      (previous.afterStateHash !== transition.beforeStateHash ||
        JSON.stringify(previous.afterState) !==
          JSON.stringify(transition.beforeState))
    ) {
      return currentCodeFailure("CURRENT_BOUNDARY_STATE_INVALID", [
        "execution",
        "transitions",
        index,
        "beforeState",
      ])
    }
  }

  const transitionPostconditions = validateCurrentTransitionPostconditions({
    transitions: execution.transitions,
    finalOutcome: execution.recorderMaterial.finalState.outcome,
  })
  if (!transitionPostconditions.ok) {
    return currentCodeFailure(
      transitionPostconditions.code === "CURRENT_TERMINAL_STATE_MISMATCH"
        ? "CURRENT_TERMINAL_INVALID"
        : "CURRENT_RECONSTRUCTION_INVALID",
      transitionPostconditions.transitionIndex === undefined
        ? ["execution", "transitions"]
        : [
            "execution",
            "transitions",
            transitionPostconditions.transitionIndex,
          ],
    )
  }

  const anchors = input.boundaryAnchors as readonly ChronicleBoundaryAnchor[]
  if (anchors.length !== chronicle.snapshots.length) {
    return currentCodeFailure("CURRENT_BOUNDARY_STATE_INVALID", [
      "boundaryAnchors",
    ])
  }
  for (let index = 0; index < anchors.length; index += 1) {
    const anchor = anchors[index]!
    const snapshot = chronicle.snapshots[index]
    const transition = execution.transitions.find(
      ({ coordinates }) => coordinates.ordinal === anchor.transitionOrdinal,
    )
    if (snapshot === undefined || transition === undefined) {
      return currentCodeFailure("CURRENT_BOUNDARY_STATE_INVALID", [
        "boundaryAnchors",
        index,
      ])
    }
    const projection =
      anchor.stateSide === "before"
        ? transition.beforeState
        : transition.afterState
    const stateHash =
      anchor.stateSide === "before"
        ? transition.beforeStateHash
        : transition.afterStateHash
    const projectionOutcome = projection.outcome
    if (
      anchor.snapshotIndex !== index ||
      anchor.kind !== snapshot.kind ||
      anchor.stateHash !== stateHash ||
      JSON.stringify(snapshot.board) !==
        JSON.stringify(boardFromProjection(projection)) ||
      (snapshot.kind === "CONTRACTION"
        ? snapshot.outcome !== undefined
        : JSON.stringify(snapshot.outcome ?? null) !==
          JSON.stringify(projectionOutcome ?? null))
    ) {
      return currentCodeFailure("CURRENT_BOUNDARY_STATE_INVALID", [
        "boundaryAnchors",
        index,
      ])
    }
  }

  const parsedFinal = RuntimeExecutionFinalStateSchema.safeParse(
    execution.recorderMaterial.finalState,
  )
  const last = execution.transitions.at(-1)!
  const terminalEvent = chronicle.events.at(-1)
  const terminalSnapshot = chronicle.snapshots.at(-1)
  if (
    !parsedFinal.success ||
    JSON.stringify(execution.result.state) !==
      JSON.stringify(execution.recorderMaterial.finalState) ||
    JSON.stringify(last.afterState) !==
      JSON.stringify(
        parsedFinal.success
          ? projectStateForRecording(
              parsedFinal.data as CanonicalSemanticGameState,
            )
          : null,
      ) ||
    terminalEvent?.type !== "MATCH_ENDED" ||
    terminalSnapshot?.kind !== "TERMINAL" ||
    JSON.stringify(terminalEvent?.payload) !==
      JSON.stringify(execution.recorderMaterial.finalState.outcome) ||
    JSON.stringify(terminalSnapshot?.outcome) !==
      JSON.stringify(execution.recorderMaterial.finalState.outcome) ||
    chronicle.events.filter(({ type }) => type === "MATCH_ENDED").length !== 1
  ) {
    return currentCodeFailure("CURRENT_TERMINAL_INVALID")
  }
  return currentSuccess()
}

export const validateCurrentChronicle = (
  input: unknown,
): CurrentChronicleSemanticValidationResult =>
  validateCurrentChronicleSemantics(input)

export const assertChronicleCompatible = (chronicle: unknown): Chronicle => {
  const result = validateChronicle(chronicle)
  if (!result.ok) {
    throw new Error(
      `Chronicle validation failed: ${result.errors
        .map((validationError) => validationError.code)
        .join(", ")}`,
    )
  }
  return ChronicleSchema.parse(chronicle) as Chronicle
}
