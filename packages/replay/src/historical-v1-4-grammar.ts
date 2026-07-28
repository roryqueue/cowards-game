import type {
  Chronicle,
  ChronicleEvent,
  ChronicleEventType,
  ChronicleValidationError,
  JsonValue,
} from "@cowards/spec"

const HISTORICAL_V14_MAX_ACTIVATION_CYCLES = 12 as const

const HISTORICAL_V14_ROUND_ACTIVATION_COUNTS = Object.freeze({
  1: 1,
  2: 2,
  3: 3,
  4: 4,
} as const)

export const HISTORICAL_V14_EVENT_TYPES = Object.freeze([
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
] as const satisfies readonly ChronicleEventType[])

interface HistoricalGrammarState {
  matchStarted: boolean
  matchEnded: boolean
  activeRoundNumber: number | undefined
  activeActivation:
    | {
        activationId: string
        activationIndex: number
        actingPlayerId: string
        soldierId: string
        nextCycleIndex: number
      }
    | undefined
  activeCycleIndex: number | undefined
  contractionOpen: boolean
}

const ACTIVATION_EVENT_TYPES = new Set<ChronicleEventType>([
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
])

const SOLDIER_CONTEXT_EVENT_TYPES = new Set<ChronicleEventType>([
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
  "SOLDIER_STONED",
  "SOLDIER_FELL",
])

const SELF_SOLDIER_PAYLOAD_EVENT_TYPES = new Set<ChronicleEventType>([
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
])

const PLAYER_CONTEXT_EVENT_TYPES = new Set<ChronicleEventType>([
  "STRATEGY_EVALUATED",
  "RUNTIME_VIOLATION",
])

const REQUIRED_COMPLETED_EVENT_TYPES = Object.freeze([
  "MATCH_STARTED",
  "ROUND_STARTED",
  "STRATEGY_EVALUATED",
  "ACTIVATION_STARTED",
  "AWARENESS_GRID_OBSERVED",
  "ACTION_EMITTED",
  "MATCH_ENDED",
] as const satisfies readonly ChronicleEventType[])

const error = (
  code: ChronicleValidationError["code"],
  message: string,
  event?: ChronicleEvent | undefined,
  details: Omit<ChronicleValidationError, "code" | "message" | "sequence"> = {},
): ChronicleValidationError => ({
  code,
  ...(event === undefined ? {} : { sequence: event.sequence }),
  message,
  ...details,
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

interface HistoricalSchemaIssue {
  readonly path: readonly (string | number)[]
  readonly message: string
}

type HistoricalSchemaParseResult =
  | { readonly success: true; readonly data: Chronicle }
  | {
      readonly success: false
      readonly error: { readonly issues: readonly HistoricalSchemaIssue[] }
    }

const HISTORICAL_V14_DIRECTIONS = new Set(["UP", "DOWN", "LEFT", "RIGHT"])

const HISTORICAL_V14_SOLDIER_STATUSES = new Set(["ACTIVE", "STONE", "FALLEN"])

const HISTORICAL_V14_SNAPSHOT_KINDS = new Set([
  "MATCH_START",
  "MATCH_END",
  "ROUND_START",
  "ROUND_END",
  "ACTIVATION_START",
  "ACTIVATION_END",
  "CONTRACTION",
  "TERMINAL",
])

const HISTORICAL_V14_PRIVACY_VALUES = new Set(["public", "owner", "private"])

const HISTORICAL_V14_RUNTIME_VIOLATIONS = new Set([
  "INVALID_OUTPUT",
  "TIMEOUT",
  "THROWN_EXCEPTION",
  "FORBIDDEN_CAPABILITY",
  "OVERSIZED_OUTPUT",
])

const HISTORICAL_V14_BACKSTAB_BOUNDARIES = new Set([
  "activation-start",
  "activation-end",
  "post-advance",
  "cycle-start",
  "cycle-end",
])

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value)

const isInteger = (value: unknown): value is number =>
  isFiniteNumber(value) && Number.isInteger(value)

const isNonnegativeInteger = (value: unknown): value is number =>
  isInteger(value) && value >= 0

const isPositiveInteger = (value: unknown): value is number =>
  isInteger(value) && value > 0

const isNonemptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0

const isHistoricalDirection = (value: unknown): boolean =>
  typeof value === "string" && HISTORICAL_V14_DIRECTIONS.has(value)

const addSchemaIssue = (
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
  message: string,
): false => {
  issues.push({ path, message })
  return false
}

const validateOptional = (
  value: unknown,
  predicate: (candidate: unknown) => boolean,
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
  message: string,
): boolean =>
  value === undefined ||
  predicate(value) ||
  addSchemaIssue(issues, path, message)

const validateJsonValue = (
  value: unknown,
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
  ancestors = new WeakSet<object>(),
): boolean => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    isFiniteNumber(value)
  ) {
    return true
  }
  if (typeof value !== "object" || value === null) {
    return addSchemaIssue(issues, path, "Expected a JSON value.")
  }
  if (ancestors.has(value)) {
    return addSchemaIssue(issues, path, "Expected an acyclic JSON value.")
  }
  ancestors.add(value)
  let valid = true
  if (Array.isArray(value)) {
    value.forEach((child, index) => {
      valid =
        validateJsonValue(child, issues, [...path, index], ancestors) && valid
    })
  } else {
    for (const [key, child] of Object.entries(value)) {
      valid =
        validateJsonValue(child, issues, [...path, key], ancestors) && valid
    }
  }
  ancestors.delete(value)
  return valid
}

const validateHistoricalContext = (
  value: unknown,
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
): boolean => {
  if (!isRecord(value)) {
    return addSchemaIssue(issues, path, "Expected an event context object.")
  }
  let valid = true
  valid =
    validateOptional(
      value.phaseNumber,
      isPositiveInteger,
      issues,
      [...path, "phaseNumber"],
      "Expected a positive integer.",
    ) && valid
  valid =
    validateOptional(
      value.roundNumber,
      (candidate) =>
        candidate === 1 ||
        candidate === 2 ||
        candidate === 3 ||
        candidate === 4,
      issues,
      [...path, "roundNumber"],
      "Expected Round 1, 2, 3, or 4.",
    ) && valid
  for (const field of [
    "activationId",
    "actingPlayerId",
    "soldierId",
  ] as const) {
    valid =
      validateOptional(
        value[field],
        isNonemptyString,
        issues,
        [...path, field],
        "Expected a non-empty string.",
      ) && valid
  }
  for (const field of ["activationIndex", "cycleIndex"] as const) {
    valid =
      validateOptional(
        value[field],
        isNonnegativeInteger,
        issues,
        [...path, field],
        "Expected a nonnegative integer.",
      ) && valid
  }
  return valid
}

const validatePosition = (
  value: unknown,
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
): boolean => {
  if (!isRecord(value)) {
    return addSchemaIssue(issues, path, "Expected a position object.")
  }
  let valid = true
  for (const field of ["x", "y"] as const) {
    if (!isInteger(value[field])) {
      valid =
        addSchemaIssue(issues, [...path, field], "Expected an integer.") &&
        valid
    }
  }
  return valid
}

const validateBounds = (
  value: unknown,
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
): boolean => {
  if (!isRecord(value)) {
    return addSchemaIssue(issues, path, "Expected a board-bounds object.")
  }
  let valid = true
  for (const field of ["minX", "maxX", "minY", "maxY"] as const) {
    if (!isInteger(value[field])) {
      valid =
        addSchemaIssue(issues, [...path, field], "Expected an integer.") &&
        valid
    }
  }
  return valid
}

const validateHistoricalOutcome = (
  value: unknown,
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
): boolean => {
  if (!isRecord(value)) {
    return addSchemaIssue(issues, path, "Expected a Match outcome object.")
  }
  if (value.type === "DRAW") return true
  if (value.type === "WIN" && isNonemptyString(value.winnerPlayerId)) {
    return true
  }
  if (value.type === "FAILED" && isNonemptyString(value.reason)) return true
  return addSchemaIssue(issues, path, "Expected a frozen v1.4 Match outcome.")
}

const validateHistoricalAction = (
  value: unknown,
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
): boolean => {
  if (!isRecord(value)) {
    return addSchemaIssue(issues, path, "Expected an Action object.")
  }
  if (value.type === "TURN_TO_STONE") return true
  if (
    (value.type === "MOVE" || value.type === "TURN") &&
    isHistoricalDirection(value.direction)
  ) {
    return true
  }
  return addSchemaIssue(issues, path, "Expected a frozen v1.4 Action.")
}

const validateHistoricalBoard = (
  value: unknown,
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
): boolean => {
  if (!isRecord(value)) {
    return addSchemaIssue(issues, path, "Expected a board snapshot object.")
  }
  let valid = validateBounds(value.bounds, issues, [...path, "bounds"])
  if (!Array.isArray(value.soldiers)) {
    valid =
      addSchemaIssue(
        issues,
        [...path, "soldiers"],
        "Expected a Soldier array.",
      ) && valid
  } else {
    value.soldiers.forEach((soldier, index) => {
      const soldierPath = [...path, "soldiers", index]
      if (!isRecord(soldier)) {
        valid =
          addSchemaIssue(
            issues,
            soldierPath,
            "Expected a Soldier snapshot object.",
          ) && valid
        return
      }
      for (const field of ["id", "ownerPlayerId"] as const) {
        if (!isNonemptyString(soldier[field])) {
          valid =
            addSchemaIssue(
              issues,
              [...soldierPath, field],
              "Expected a non-empty string.",
            ) && valid
        }
      }
      if (
        typeof soldier.status !== "string" ||
        !HISTORICAL_V14_SOLDIER_STATUSES.has(soldier.status)
      ) {
        valid =
          addSchemaIssue(
            issues,
            [...soldierPath, "status"],
            "Expected a frozen v1.4 Soldier status.",
          ) && valid
      }
      if (
        soldier.position !== null &&
        !validatePosition(soldier.position, issues, [
          ...soldierPath,
          "position",
        ])
      ) {
        valid = false
      }
      for (const field of ["facing", "lastSuccessfulMoveDirection"] as const) {
        if (soldier[field] !== null && !isHistoricalDirection(soldier[field])) {
          valid =
            addSchemaIssue(
              issues,
              [...soldierPath, field],
              "Expected a Direction or null.",
            ) && valid
        }
      }
    })
  }
  if (!Array.isArray(value.terrainStones)) {
    valid =
      addSchemaIssue(
        issues,
        [...path, "terrainStones"],
        "Expected a terrain-stone array.",
      ) && valid
  } else {
    value.terrainStones.forEach((position, index) => {
      valid =
        validatePosition(position, issues, [...path, "terrainStones", index]) &&
        valid
    })
  }
  return valid
}

const validatePayloadObject = (
  payload: unknown,
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
): Record<string, unknown> | undefined => {
  if (isRecord(payload)) return payload
  addSchemaIssue(issues, path, "Expected an event payload object.")
  return undefined
}

const requirePayloadString = (
  payload: Record<string, unknown>,
  field: string,
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
): boolean =>
  isNonemptyString(payload[field]) ||
  addSchemaIssue(issues, [...path, field], "Expected a non-empty string.")

const requirePayloadCycleIndex = (
  payload: Record<string, unknown>,
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
): boolean =>
  isNonnegativeInteger(payload.cycleIndex) ||
  addSchemaIssue(
    issues,
    [...path, "cycleIndex"],
    "Expected a nonnegative integer.",
  )

const validateHistoricalPayload = (
  type: ChronicleEventType,
  value: unknown,
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
): boolean => {
  const payload = validatePayloadObject(value, issues, path)
  if (payload === undefined) return false
  let valid = true
  const requireSoldier = (): void => {
    valid = requirePayloadString(payload, "soldierId", issues, path) && valid
  }
  const requireTarget = (): void => {
    valid =
      requirePayloadString(payload, "targetSoldierId", issues, path) && valid
  }
  const validateOptionalReason = (): void => {
    valid =
      validateOptional(
        payload.reason,
        isNonemptyString,
        issues,
        [...path, "reason"],
        "Expected a non-empty string.",
      ) && valid
  }

  switch (type) {
    case "MATCH_STARTED":
      valid = requirePayloadString(payload, "matchId", issues, path) && valid
      valid =
        validateOptional(
          payload.seed,
          isNonemptyString,
          issues,
          [...path, "seed"],
          "Expected a non-empty string.",
        ) && valid
      break
    case "ROUND_STARTED":
      if (
        payload.roundNumber !== 1 &&
        payload.roundNumber !== 2 &&
        payload.roundNumber !== 3 &&
        payload.roundNumber !== 4
      ) {
        valid =
          addSchemaIssue(
            issues,
            [...path, "roundNumber"],
            "Expected Round 1, 2, 3, or 4.",
          ) && valid
      }
      break
    case "STRATEGY_EVALUATED":
      valid = requirePayloadString(payload, "playerId", issues, path) && valid
      break
    case "ACTIVATION_STARTED":
      requireSoldier()
      break
    case "ACTIVATION_SKIPPED":
      requireSoldier()
      valid = requirePayloadCycleIndex(payload, issues, path) && valid
      valid = requirePayloadString(payload, "reason", issues, path) && valid
      break
    case "ACTIVATION_ENDED":
      requireSoldier()
      valid = requirePayloadString(payload, "reason", issues, path) && valid
      break
    case "CYCLE_STARTED":
    case "CYCLE_ENDED":
    case "AWARENESS_GRID_OBSERVED":
      requireSoldier()
      valid = requirePayloadCycleIndex(payload, issues, path) && valid
      break
    case "ACTION_EMITTED":
      requireSoldier()
      valid =
        validateHistoricalAction(payload.action, issues, [...path, "action"]) &&
        valid
      break
    case "MOVE_ADVANCED":
    case "TURN_RESOLVED":
      requireSoldier()
      if (!isHistoricalDirection(payload.direction)) {
        valid =
          addSchemaIssue(
            issues,
            [...path, "direction"],
            "Expected a frozen v1.4 Direction.",
          ) && valid
      }
      break
    case "MOVE_BLOCKED":
      requireSoldier()
      valid = requirePayloadString(payload, "reason", issues, path) && valid
      valid =
        validateOptional(
          payload.targetSoldierId,
          isNonemptyString,
          issues,
          [...path, "targetSoldierId"],
          "Expected a non-empty string.",
        ) && valid
      break
    case "PUSH_ATTEMPTED":
    case "PUSH_BLOCKED":
      requireSoldier()
      requireTarget()
      break
    case "PUSH_RESOLVED":
      requireSoldier()
      requireTarget()
      if (typeof payload.pushedOffBoard !== "boolean") {
        valid =
          addSchemaIssue(
            issues,
            [...path, "pushedOffBoard"],
            "Expected a boolean.",
          ) && valid
      }
      break
    case "BACKSTAB_RESOLVED":
      if (
        typeof payload.boundary !== "string" ||
        !HISTORICAL_V14_BACKSTAB_BOUNDARIES.has(payload.boundary)
      ) {
        valid =
          addSchemaIssue(
            issues,
            [...path, "boundary"],
            "Expected a frozen v1.4 Backstab boundary.",
          ) && valid
      }
      if (!Array.isArray(payload.pairs)) {
        valid =
          addSchemaIssue(
            issues,
            [...path, "pairs"],
            "Expected a Backstab-pair array.",
          ) && valid
      } else {
        payload.pairs.forEach((pair, index) => {
          const pairPath = [...path, "pairs", index]
          if (!isRecord(pair)) {
            valid =
              addSchemaIssue(
                issues,
                pairPath,
                "Expected a Backstab pair object.",
              ) && valid
            return
          }
          for (const field of ["attackerId", "victimId"] as const) {
            if (!isNonemptyString(pair[field])) {
              valid =
                addSchemaIssue(
                  issues,
                  [...pairPath, field],
                  "Expected a non-empty string.",
                ) && valid
            }
          }
        })
      }
      break
    case "SOLDIER_STONED":
    case "SOLDIER_FELL":
      requireSoldier()
      validateOptionalReason()
      break
    case "CONTRACTION_RESOLVED":
      valid =
        validateBounds(payload.bounds, issues, [...path, "bounds"]) && valid
      break
    case "MATCH_ENDED":
      valid = validateHistoricalOutcome(payload, issues, path) && valid
      break
    case "RUNTIME_VIOLATION":
      if (
        typeof payload.type !== "string" ||
        !HISTORICAL_V14_RUNTIME_VIOLATIONS.has(payload.type)
      ) {
        valid =
          addSchemaIssue(
            issues,
            [...path, "type"],
            "Expected a frozen v1.4 Runtime violation.",
          ) && valid
      }
      for (const field of [
        "category",
        "playerId",
        "ownerPlayerId",
        "soldierId",
      ] as const) {
        valid =
          validateOptional(
            payload[field],
            isNonemptyString,
            issues,
            [...path, field],
            "Expected a non-empty string.",
          ) && valid
      }
      break
  }
  return valid
}

const validateHistoricalEvent = (
  value: unknown,
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
): boolean => {
  if (!isRecord(value)) {
    return addSchemaIssue(issues, path, "Expected a Chronicle event object.")
  }
  let valid = true
  if (
    typeof value.type !== "string" ||
    !(HISTORICAL_V14_EVENT_TYPES as readonly string[]).includes(value.type)
  ) {
    return addSchemaIssue(
      issues,
      [...path, "type"],
      "Expected a frozen v1.4 Chronicle event type.",
    )
  }
  if (!isNonnegativeInteger(value.sequence)) {
    valid =
      addSchemaIssue(
        issues,
        [...path, "sequence"],
        "Expected a nonnegative integer.",
      ) && valid
  }
  valid =
    validateHistoricalContext(value.context, issues, [...path, "context"]) &&
    valid
  if (
    typeof value.privacy !== "string" ||
    !HISTORICAL_V14_PRIVACY_VALUES.has(value.privacy)
  ) {
    valid =
      addSchemaIssue(
        issues,
        [...path, "privacy"],
        "Expected public, owner, or private.",
      ) && valid
  }
  valid =
    validateOptional(
      value.privateRef,
      isNonemptyString,
      issues,
      [...path, "privateRef"],
      "Expected a non-empty string.",
    ) && valid
  valid =
    validateHistoricalPayload(
      value.type as ChronicleEventType,
      value.payload,
      issues,
      [...path, "payload"],
    ) && valid
  return valid
}

const validateHistoricalSnapshot = (
  value: unknown,
  issues: HistoricalSchemaIssue[],
  path: readonly (string | number)[],
): boolean => {
  if (!isRecord(value)) {
    return addSchemaIssue(issues, path, "Expected a Chronicle snapshot object.")
  }
  let valid = true
  if (
    typeof value.kind !== "string" ||
    !HISTORICAL_V14_SNAPSHOT_KINDS.has(value.kind)
  ) {
    valid =
      addSchemaIssue(
        issues,
        [...path, "kind"],
        "Expected a frozen v1.4 snapshot kind.",
      ) && valid
  }
  if (!isNonnegativeInteger(value.sequence)) {
    valid =
      addSchemaIssue(
        issues,
        [...path, "sequence"],
        "Expected a nonnegative integer.",
      ) && valid
  }
  valid =
    validateHistoricalContext(value.context, issues, [...path, "context"]) &&
    valid
  valid =
    validateHistoricalBoard(value.board, issues, [...path, "board"]) && valid
  if (
    value.outcome !== undefined &&
    !validateHistoricalOutcome(value.outcome, issues, [...path, "outcome"])
  ) {
    valid = false
  }
  return valid
}

const parseHistoricalV14Chronicle = (
  input: unknown,
): HistoricalSchemaParseResult => {
  const issues: HistoricalSchemaIssue[] = []
  if (!isRecord(input)) {
    addSchemaIssue(issues, [], "Expected a Chronicle object.")
    return { success: false, error: { issues } }
  }
  if (input.schemaVersion !== "chronicle-v1.4") {
    addSchemaIssue(
      issues,
      ["schemaVersion"],
      "Expected literal chronicle-v1.4.",
    )
  }
  if (!isRecord(input.reproducibility)) {
    addSchemaIssue(
      issues,
      ["reproducibility"],
      "Expected a reproducibility envelope.",
    )
  } else {
    const reproducibility = input.reproducibility
    for (const field of [
      "matchId",
      "seed",
      "arenaVariantId",
      "arenaVariantVersion",
    ] as const) {
      if (!isNonemptyString(reproducibility[field])) {
        addSchemaIssue(
          issues,
          ["reproducibility", field],
          "Expected a non-empty string.",
        )
      }
    }
    if (
      !Array.isArray(reproducibility.strategyRevisionIds) ||
      reproducibility.strategyRevisionIds.length !== 2
    ) {
      addSchemaIssue(
        issues,
        ["reproducibility", "strategyRevisionIds"],
        "Expected exactly two Strategy revision identifiers.",
      )
    } else {
      reproducibility.strategyRevisionIds.forEach((revisionId, index) => {
        if (!isNonemptyString(revisionId)) {
          addSchemaIssue(
            issues,
            ["reproducibility", "strategyRevisionIds", index],
            "Expected a non-empty string.",
          )
        }
      })
    }
    const expectedVersions = {
      spec: "cowards-rules-v1.4",
      engine: "0.1.4",
      runtimeJs: "0.1.0",
      chronicle: "chronicle-v1.4",
      strategyRevision: "0.1.4",
      arenaVariant: "0.1.0",
    } as const
    if (!isRecord(reproducibility.versions)) {
      addSchemaIssue(
        issues,
        ["reproducibility", "versions"],
        "Expected a compatibility-version object.",
      )
    } else {
      for (const [field, expected] of Object.entries(expectedVersions)) {
        if (reproducibility.versions[field] !== expected) {
          addSchemaIssue(
            issues,
            ["reproducibility", "versions", field],
            `Expected literal ${expected}.`,
          )
        }
      }
    }
  }
  if (!Array.isArray(input.events)) {
    addSchemaIssue(issues, ["events"], "Expected a Chronicle-event array.")
  } else {
    input.events.forEach((event, index) => {
      validateHistoricalEvent(event, issues, ["events", index])
    })
  }
  if (!Array.isArray(input.snapshots)) {
    addSchemaIssue(
      issues,
      ["snapshots"],
      "Expected a Chronicle-snapshot array.",
    )
  } else {
    input.snapshots.forEach((snapshot, index) => {
      validateHistoricalSnapshot(snapshot, issues, ["snapshots", index])
    })
  }
  if (input.private !== undefined) {
    if (!isRecord(input.private) || !isRecord(input.private.byPlayerId)) {
      addSchemaIssue(
        issues,
        ["private"],
        "Expected private Chronicle sections.",
      )
    } else {
      for (const [playerId, value] of Object.entries(
        input.private.byPlayerId,
      )) {
        if (playerId.length === 0) {
          addSchemaIssue(
            issues,
            ["private", "byPlayerId", playerId],
            "Expected a non-empty player identifier.",
          )
        }
        validateJsonValue(value, issues, ["private", "byPlayerId", playerId])
      }
      if (input.private.debug !== undefined) {
        validateJsonValue(input.private.debug, issues, ["private", "debug"])
      }
    }
  }
  if (input.integrity !== undefined) {
    if (
      !isRecord(input.integrity) ||
      input.integrity.algorithm !== "sha256" ||
      !isNonemptyString(input.integrity.normalizedContentHash)
    ) {
      addSchemaIssue(
        issues,
        ["integrity"],
        "Expected frozen v1.4 integrity metadata.",
      )
    }
  }
  if (input.storageMetadata !== undefined) {
    validateJsonValue(input.storageMetadata, issues, ["storageMetadata"])
  }
  return issues.length === 0
    ? { success: true, data: input as unknown as Chronicle }
    : { success: false, error: { issues } }
}

const readPayloadString = (
  event: ChronicleEvent,
  field: string,
): string | undefined => {
  if (!isRecord(event.payload)) return undefined
  const value = event.payload[field]
  return typeof value === "string" ? value : undefined
}

const readPayloadNumber = (
  event: ChronicleEvent,
  field: string,
): number | undefined => {
  if (!isRecord(event.payload)) return undefined
  const value = event.payload[field]
  return typeof value === "number" ? value : undefined
}

const actualField = (
  field: string,
  value: string | number | undefined,
): JsonValue =>
  value === undefined ? { field, value: "missing" } : { field, value }

const expectedField = (field: string, value: string | number): JsonValue => ({
  field,
  value,
})

const requireStringContext = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
  field: "activationId" | "actingPlayerId" | "soldierId",
): string | undefined => {
  const value = event.context[field]
  if (typeof value === "string" && value.length > 0) return value
  errors.push(
    error(
      "CONTEXT_MISSING",
      `${event.type} requires context.${field}.`,
      event,
      { expected: `context.${field}` },
    ),
  )
  return undefined
}

const requireNumberContext = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
  field: "activationIndex" | "cycleIndex",
): number | undefined => {
  const value = event.context[field]
  if (typeof value === "number") return value
  errors.push(
    error(
      "CONTEXT_MISSING",
      `${event.type} requires context.${field}.`,
      event,
      { expected: `context.${field}` },
    ),
  )
  return undefined
}

const requireRoundContext = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
  activeRoundNumber: number | undefined,
): number | undefined => {
  const roundNumber = event.context.roundNumber
  if (typeof roundNumber !== "number") {
    errors.push(
      error(
        "CONTEXT_MISSING",
        `${event.type} requires context.roundNumber.`,
        event,
        { expected: "context.roundNumber" },
      ),
    )
    return undefined
  }
  if (activeRoundNumber !== undefined && roundNumber !== activeRoundNumber) {
    errors.push(
      error(
        "CONTEXT_MISMATCH",
        `${event.type} context.roundNumber must match the active Round.`,
        event,
        {
          expected: expectedField("roundNumber", activeRoundNumber),
          actual: actualField("roundNumber", roundNumber),
        },
      ),
    )
  }
  return roundNumber
}

const requireActivationContext = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
  activeActivation: HistoricalGrammarState["activeActivation"],
): HistoricalGrammarState["activeActivation"] | undefined => {
  const activationId = requireStringContext(errors, event, "activationId")
  const activationIndex = requireNumberContext(errors, event, "activationIndex")
  const actingPlayerId = requireStringContext(errors, event, "actingPlayerId")
  const soldierId = SOLDIER_CONTEXT_EVENT_TYPES.has(event.type)
    ? requireStringContext(errors, event, "soldierId")
    : event.context.soldierId

  for (const [field, actual, expected] of [
    ["activationId", activationId, activeActivation?.activationId],
    ["activationIndex", activationIndex, activeActivation?.activationIndex],
    ["actingPlayerId", actingPlayerId, activeActivation?.actingPlayerId],
    ["soldierId", soldierId, activeActivation?.soldierId],
  ] as const) {
    if (
      activeActivation !== undefined &&
      actual !== undefined &&
      expected !== undefined &&
      actual !== expected
    ) {
      errors.push(
        error(
          "CONTEXT_MISMATCH",
          `${event.type} context.${field} must match the active Activation.`,
          event,
          {
            expected: expectedField(field, expected),
            actual: actualField(field, actual),
          },
        ),
      )
    }
  }

  return activationId !== undefined &&
    activationIndex !== undefined &&
    actingPlayerId !== undefined &&
    soldierId !== undefined
    ? {
        activationId,
        activationIndex,
        actingPlayerId,
        soldierId,
        nextCycleIndex: activeActivation?.nextCycleIndex ?? 0,
      }
    : undefined
}

const validateActivationIndexWindow = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
): void => {
  const { roundNumber, activationIndex } = event.context
  if (roundNumber === undefined || activationIndex === undefined) return
  const maxActivationIndex =
    HISTORICAL_V14_ROUND_ACTIVATION_COUNTS[roundNumber] * 2 - 1
  if (activationIndex < 0 || activationIndex > maxActivationIndex) {
    errors.push(
      error(
        "EVENT_WINDOW_INVALID",
        `${event.type} context.activationIndex is outside the Round Activation window.`,
        event,
        { expected: `0..${maxActivationIndex}`, actual: activationIndex },
      ),
    )
  }
}

const requireCycleContext = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
  activeCycleIndex: number | undefined,
): number | undefined => {
  const cycleIndex = requireNumberContext(errors, event, "cycleIndex")
  if (
    cycleIndex !== undefined &&
    (cycleIndex < 0 || cycleIndex >= HISTORICAL_V14_MAX_ACTIVATION_CYCLES)
  ) {
    errors.push(
      error(
        "EVENT_WINDOW_INVALID",
        `${event.type} context.cycleIndex is outside the Activation Cycle window.`,
        event,
        {
          expected: `0..${HISTORICAL_V14_MAX_ACTIVATION_CYCLES - 1}`,
          actual: cycleIndex,
        },
      ),
    )
  }
  if (
    event.type === "ACTION_EMITTED" &&
    activeCycleIndex === undefined &&
    cycleIndex !== undefined
  ) {
    errors.push(
      error(
        "EVENT_WINDOW_INVALID",
        "ACTION_EMITTED requires an open Cycle started by AWARENESS_GRID_OBSERVED.",
        event,
        { expected: "open Cycle" },
      ),
    )
  }
  if (
    event.type === "ACTION_EMITTED" &&
    activeCycleIndex !== undefined &&
    cycleIndex !== undefined &&
    cycleIndex !== activeCycleIndex
  ) {
    errors.push(
      error(
        "CONTEXT_MISMATCH",
        "ACTION_EMITTED context.cycleIndex must match the active Cycle.",
        event,
        {
          expected: expectedField("cycleIndex", activeCycleIndex),
          actual: actualField("cycleIndex", cycleIndex),
        },
      ),
    )
  }
  return cycleIndex
}

const validateRoundStartedPayload = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
): number | undefined => {
  const payloadRoundNumber = readPayloadNumber(event, "roundNumber")
  const contextRoundNumber = event.context.roundNumber
  if (
    payloadRoundNumber !== undefined &&
    contextRoundNumber !== undefined &&
    payloadRoundNumber !== contextRoundNumber
  ) {
    errors.push(
      error(
        "PAYLOAD_INCONSISTENT",
        "ROUND_STARTED payload.roundNumber must match context.roundNumber.",
        event,
        {
          expected: expectedField("roundNumber", contextRoundNumber),
          actual: actualField("roundNumber", payloadRoundNumber),
        },
      ),
    )
  }
  return payloadRoundNumber
}

const validateSoldierPayload = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
): void => {
  if (
    !SELF_SOLDIER_PAYLOAD_EVENT_TYPES.has(event.type) &&
    event.type !== "RUNTIME_VIOLATION"
  ) {
    return
  }
  const payloadSoldierId = readPayloadString(event, "soldierId")
  const contextSoldierId = event.context.soldierId
  if (
    payloadSoldierId !== undefined &&
    contextSoldierId !== undefined &&
    payloadSoldierId !== contextSoldierId
  ) {
    errors.push(
      error(
        "PAYLOAD_INCONSISTENT",
        `${event.type} payload.soldierId must match context.soldierId.`,
        event,
        {
          expected: expectedField("soldierId", contextSoldierId),
          actual: actualField("soldierId", payloadSoldierId),
        },
      ),
    )
  }
}

const validateCyclePayload = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
): void => {
  const payloadCycleIndex = readPayloadNumber(event, "cycleIndex")
  const contextCycleIndex = event.context.cycleIndex
  if (
    payloadCycleIndex !== undefined &&
    contextCycleIndex !== undefined &&
    payloadCycleIndex !== contextCycleIndex
  ) {
    errors.push(
      error(
        "PAYLOAD_INCONSISTENT",
        `${event.type} payload.cycleIndex must match context.cycleIndex.`,
        event,
        {
          expected: expectedField("cycleIndex", contextCycleIndex),
          actual: actualField("cycleIndex", payloadCycleIndex),
        },
      ),
    )
  }
}

const validatePlayerPayload = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
): void => {
  const contextPlayerId = event.context.actingPlayerId
  if (contextPlayerId === undefined) return
  for (const field of ["playerId", "ownerPlayerId"] as const) {
    const payloadPlayerId = readPayloadString(event, field)
    if (payloadPlayerId !== undefined && payloadPlayerId !== contextPlayerId) {
      errors.push(
        error(
          "PAYLOAD_INCONSISTENT",
          `${event.type} payload.${field} must match context.actingPlayerId.`,
          event,
          {
            expected: expectedField("actingPlayerId", contextPlayerId),
            actual: actualField(field, payloadPlayerId),
          },
        ),
      )
    }
  }
}

const requireMatchOpen = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
  state: HistoricalGrammarState,
): boolean => {
  if (state.matchStarted) return true
  errors.push(
    error(
      "EVENT_WINDOW_INVALID",
      `${event.type} cannot occur before MATCH_STARTED.`,
      event,
      { expected: "MATCH_STARTED before event" },
    ),
  )
  return false
}

const requireRoundOpen = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
  state: HistoricalGrammarState,
): boolean => {
  if (state.activeRoundNumber !== undefined) return true
  errors.push(
    error(
      "EVENT_WINDOW_INVALID",
      `${event.type} requires an open Round.`,
      event,
      { expected: "open Round" },
    ),
  )
  return false
}

const requireActivationOpen = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
  state: HistoricalGrammarState,
): boolean => {
  if (
    state.activeActivation !== undefined ||
    event.context.activationId !== undefined
  ) {
    return true
  }
  errors.push(
    error(
      "EVENT_WINDOW_INVALID",
      `${event.type} requires an open Activation.`,
      event,
      { expected: "open Activation" },
    ),
  )
  return false
}

const validateHistoricalEventOrder = (
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  const errors: ChronicleValidationError[] = []
  chronicle.events.forEach((event, index) => {
    if (event.sequence !== index) {
      errors.push(
        error(
          "EVENT_ORDER_INVALID",
          "Chronicle event sequences must be contiguous from zero.",
          event,
          { expected: index, actual: event.sequence },
        ),
      )
    }
  })
  if (chronicle.events[0]?.type !== "MATCH_STARTED") {
    errors.push(
      error(
        "EVENT_ORDER_INVALID",
        "Chronicle must start with MATCH_STARTED.",
        chronicle.events[0],
        {
          expected: "MATCH_STARTED at sequence 0",
          actual: chronicle.events[0]?.type ?? "missing",
        },
      ),
    )
  }
  const terminal = chronicle.events.filter(({ type }) => type === "MATCH_ENDED")
  if (terminal.length !== 1) {
    errors.push(
      error(
        "EVENT_ORDER_INVALID",
        "Chronicle must contain exactly one MATCH_ENDED event.",
        undefined,
        { expected: 1, actual: terminal.length },
      ),
    )
  } else if (chronicle.events.at(-1)?.type !== "MATCH_ENDED") {
    errors.push(
      error(
        "EVENT_ORDER_INVALID",
        "MATCH_ENDED must be the final event.",
        terminal[0],
      ),
    )
  }
  return errors
}

const validateHistoricalRequiredEvents = (
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  if (!chronicle.events.some(({ type }) => type === "MATCH_ENDED")) return []
  const present = new Set(chronicle.events.map(({ type }) => type))
  return REQUIRED_COMPLETED_EVENT_TYPES.flatMap((type) =>
    present.has(type)
      ? []
      : [
          error(
            "REQUIRED_EVENT_MISSING",
            `Completed Chronicle is missing ${type}.`,
            undefined,
            { expected: type },
          ),
        ],
  )
}

const validateParsedHistoricalGrammar = (
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  const errors: ChronicleValidationError[] = []
  const state: HistoricalGrammarState = {
    matchStarted: false,
    matchEnded: false,
    activeRoundNumber: undefined,
    activeActivation: undefined,
    activeCycleIndex: undefined,
    contractionOpen: false,
  }

  for (const event of chronicle.events) {
    if (state.matchEnded) {
      errors.push(
        error(
          "EVENT_WINDOW_INVALID",
          event.type === "MATCH_ENDED"
            ? "Chronicle cannot contain duplicate MATCH_ENDED events."
            : `${event.type} cannot occur after MATCH_ENDED.`,
          event,
          { expected: "no events after MATCH_ENDED" },
        ),
      )
      continue
    }
    if (
      event.type !== "MATCH_STARTED" &&
      !requireMatchOpen(errors, event, state)
    ) {
      continue
    }
    if (
      state.activeCycleIndex !== undefined &&
      event.type !== "ACTION_EMITTED" &&
      event.type !== "RUNTIME_VIOLATION"
    ) {
      errors.push(
        error(
          "EVENT_WINDOW_INVALID",
          `${event.type} cannot occur before ACTION_EMITTED closes the active Cycle.`,
          event,
          { expected: "ACTION_EMITTED before non-Cycle event" },
        ),
      )
    }

    switch (event.type) {
      case "MATCH_STARTED":
        if (state.matchStarted) {
          errors.push(
            error(
              "EVENT_WINDOW_INVALID",
              "Chronicle cannot contain duplicate MATCH_STARTED events.",
              event,
              { expected: "single MATCH_STARTED" },
            ),
          )
          break
        }
        state.matchStarted = true
        state.activeRoundNumber = undefined
        state.activeActivation = undefined
        state.activeCycleIndex = undefined
        state.contractionOpen = false
        break
      case "ROUND_STARTED": {
        state.activeActivation = undefined
        state.activeCycleIndex = undefined
        state.contractionOpen = false
        const contextRoundNumber = requireRoundContext(errors, event, undefined)
        const payloadRoundNumber = validateRoundStartedPayload(errors, event)
        state.activeRoundNumber = payloadRoundNumber ?? contextRoundNumber
        break
      }
      case "STRATEGY_EVALUATED":
        requireRoundOpen(errors, event, state)
        requireRoundContext(errors, event, state.activeRoundNumber)
        requireStringContext(errors, event, "actingPlayerId")
        validatePlayerPayload(errors, event)
        break
      case "RUNTIME_VIOLATION":
        requireRoundOpen(errors, event, state)
        requireRoundContext(errors, event, state.activeRoundNumber)
        requireStringContext(errors, event, "actingPlayerId")
        if (
          state.activeCycleIndex !== undefined &&
          readPayloadString(event, "soldierId") === undefined
        ) {
          errors.push(
            error(
              "EVENT_WINDOW_INVALID",
              "RUNTIME_VIOLATION must identify the Soldier when closing an active Cycle.",
              event,
              { expected: "payload.soldierId" },
            ),
          )
        }
        if (readPayloadString(event, "soldierId") !== undefined) {
          requireActivationOpen(errors, event, state)
          requireActivationContext(errors, event, undefined)
          validateSoldierPayload(errors, event)
        }
        if (state.activeCycleIndex !== undefined) {
          state.activeActivation =
            state.activeActivation === undefined
              ? undefined
              : {
                  ...state.activeActivation,
                  nextCycleIndex: state.activeActivation.nextCycleIndex + 1,
                }
          state.activeCycleIndex = undefined
        }
        validatePlayerPayload(errors, event)
        break
      case "ACTIVATION_STARTED":
        requireRoundOpen(errors, event, state)
        requireRoundContext(errors, event, state.activeRoundNumber)
        requireActivationContext(errors, event, undefined)
        validateActivationIndexWindow(errors, event)
        validateSoldierPayload(errors, event)
        state.activeActivation = undefined
        state.activeCycleIndex = undefined
        state.contractionOpen = false
        break
      case "CYCLE_STARTED":
      case "CYCLE_ENDED":
      case "ACTIVATION_SKIPPED":
      case "ACTIVATION_ENDED":
        requireRoundOpen(errors, event, state)
        requireActivationOpen(errors, event, state)
        requireRoundContext(errors, event, state.activeRoundNumber)
        requireActivationContext(errors, event, undefined)
        validateActivationIndexWindow(errors, event)
        if (
          event.type === "CYCLE_STARTED" ||
          event.type === "CYCLE_ENDED" ||
          event.type === "ACTIVATION_SKIPPED"
        ) {
          requireCycleContext(errors, event, undefined)
          validateCyclePayload(errors, event)
        }
        validateSoldierPayload(errors, event)
        break
      case "AWARENESS_GRID_OBSERVED": {
        requireRoundOpen(errors, event, state)
        requireActivationOpen(errors, event, state)
        requireRoundContext(errors, event, state.activeRoundNumber)
        requireActivationContext(errors, event, undefined)
        validateActivationIndexWindow(errors, event)
        const cycleIndex = requireCycleContext(errors, event, undefined)
        if (state.activeCycleIndex !== undefined && cycleIndex !== undefined) {
          errors.push(
            error(
              "EVENT_WINDOW_INVALID",
              "AWARENESS_GRID_OBSERVED cannot start a new Cycle before ACTION_EMITTED closes the current Cycle.",
              event,
              { expected: "closed Cycle" },
            ),
          )
        }
        if (
          state.activeActivation !== undefined &&
          cycleIndex !== undefined &&
          cycleIndex !== state.activeActivation.nextCycleIndex
        ) {
          errors.push(
            error(
              "EVENT_WINDOW_INVALID",
              "AWARENESS_GRID_OBSERVED context.cycleIndex must be the next Cycle in the active Activation.",
              event,
              {
                expected: expectedField(
                  "cycleIndex",
                  state.activeActivation.nextCycleIndex,
                ),
                actual: actualField("cycleIndex", cycleIndex),
              },
            ),
          )
        }
        validateSoldierPayload(errors, event)
        validateCyclePayload(errors, event)
        state.activeCycleIndex = cycleIndex
        break
      }
      case "ACTION_EMITTED":
        requireRoundOpen(errors, event, state)
        requireActivationOpen(errors, event, state)
        requireRoundContext(errors, event, state.activeRoundNumber)
        requireActivationContext(errors, event, undefined)
        validateActivationIndexWindow(errors, event)
        requireCycleContext(errors, event, state.activeCycleIndex)
        validateSoldierPayload(errors, event)
        if (state.activeActivation !== undefined) {
          state.activeActivation = {
            ...state.activeActivation,
            nextCycleIndex: state.activeActivation.nextCycleIndex + 1,
          }
        }
        state.activeCycleIndex = undefined
        break
      case "MOVE_ADVANCED":
      case "MOVE_BLOCKED":
      case "TURN_RESOLVED":
      case "PUSH_ATTEMPTED":
      case "PUSH_RESOLVED":
      case "PUSH_BLOCKED":
      case "BACKSTAB_RESOLVED":
      case "SOLDIER_STONED":
        requireRoundOpen(errors, event, state)
        requireActivationOpen(errors, event, state)
        requireRoundContext(errors, event, state.activeRoundNumber)
        requireActivationContext(errors, event, undefined)
        validateActivationIndexWindow(errors, event)
        validateSoldierPayload(errors, event)
        break
      case "SOLDIER_FELL":
        if (
          state.activeActivation !== undefined ||
          event.context.activationId !== undefined
        ) {
          requireRoundOpen(errors, event, state)
          requireRoundContext(errors, event, state.activeRoundNumber)
          requireActivationContext(errors, event, undefined)
        } else if (!state.contractionOpen) {
          errors.push(
            error(
              "EVENT_WINDOW_INVALID",
              "SOLDIER_FELL requires an open Activation or Contraction.",
              event,
              { expected: "open Activation or Contraction" },
            ),
          )
        }
        validateSoldierPayload(errors, event)
        break
      case "CONTRACTION_RESOLVED":
        state.activeRoundNumber = undefined
        state.activeActivation = undefined
        state.activeCycleIndex = undefined
        state.contractionOpen = true
        break
      case "MATCH_ENDED":
        state.matchEnded = true
        state.activeRoundNumber = undefined
        state.activeActivation = undefined
        state.activeCycleIndex = undefined
        state.contractionOpen = false
        break
    }

    if (
      !ACTIVATION_EVENT_TYPES.has(event.type) &&
      event.type !== "MATCH_ENDED"
    ) {
      state.activeActivation =
        event.type === "ROUND_STARTED" || event.type === "CONTRACTION_RESOLVED"
          ? undefined
          : state.activeActivation
    }
    if (!PLAYER_CONTEXT_EVENT_TYPES.has(event.type)) {
      validatePlayerPayload(errors, event)
    }
  }

  if (!state.matchStarted) {
    errors.push(
      error(
        "REQUIRED_EVENT_MISSING",
        "Chronicle is missing MATCH_STARTED.",
        undefined,
        { expected: "MATCH_STARTED" },
      ),
    )
  }
  if (state.matchStarted && !state.matchEnded) {
    errors.push(
      error(
        "REQUIRED_EVENT_MISSING",
        "Chronicle is missing terminal MATCH_ENDED.",
        undefined,
        { expected: "MATCH_ENDED" },
      ),
    )
  }
  return errors
}

export const validateHistoricalV14Grammar = (
  input: unknown,
): ChronicleValidationError[] => {
  const parsed = parseHistoricalV14Chronicle(input)
  if (!parsed.success) {
    return [
      error(
        "SCHEMA_INVALID",
        "Historical v1.4 Chronicle does not match its original shape.",
        undefined,
        {
          actual: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })) as JsonValue,
        },
      ),
    ]
  }
  const chronicle = parsed.data as Chronicle
  return [
    ...validateHistoricalEventOrder(chronicle),
    ...validateHistoricalRequiredEvents(chronicle),
    ...validateParsedHistoricalGrammar(chronicle),
  ]
}
