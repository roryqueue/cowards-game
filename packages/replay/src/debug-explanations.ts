import type {
  Chronicle,
  ChronicleBoundarySnapshot,
  ChronicleEvent,
  JsonValue,
  PlayerId,
  RuntimeViolationType,
  SoldierId,
  SoldierInactivityExplanationCause,
  SoldierInactivityExplanationDto,
  SoldierSnapshot,
} from "@cowards/spec"

export interface BuildSoldierInactivityExplanationsInput {
  chronicle: Chronicle
  ownerPlayerId?: PlayerId | undefined
}

type ExplanationCopy = {
  label: string
  remediation: string
}

const COPY: Record<SoldierInactivityExplanationCause, ExplanationCopy> = {
  not_selected: {
    label: "Soldier was not selected",
    remediation:
      "Return this active Soldier from selectActivations when you want it to act in the Round.",
  },
  invalid_action: {
    label: "Strategy returned an invalid action",
    remediation:
      "Return schema-valid Strategy output and avoid immediately reversing the Soldier's previous Advance.",
  },
  blocked_movement: {
    label: "Movement was blocked",
    remediation:
      "Choose a direction without a wall, terrain Stone, blocking Soldier, or blocked Push destination.",
  },
  timeout: {
    label: "Strategy timed out",
    remediation:
      "Reduce per-call work so Strategy and Soldier brain methods finish within the runtime timeout.",
  },
  thrown_exception: {
    label: "Strategy threw an exception",
    remediation:
      "Handle missing data and return a valid result instead of throwing from Strategy code.",
  },
  stone: {
    label: "Soldier became STONE",
    remediation:
      "Advance at least once during the Activation or avoid actions that intentionally turn the Soldier to STONE.",
  },
  fallen: {
    label: "Soldier became FALLEN",
    remediation: "Avoid moving or being pushed beyond the active board bounds.",
  },
  match_ended: {
    label: "Match ended",
    remediation:
      "No further Soldier actions are possible after the Match reaches a terminal outcome.",
  },
}

const RUNTIME_CAUSES: Partial<
  Record<RuntimeViolationType, SoldierInactivityExplanationCause>
> = {
  INVALID_OUTPUT: "invalid_action",
  FORBIDDEN_CAPABILITY: "invalid_action",
  OVERSIZED_OUTPUT: "invalid_action",
  TIMEOUT: "timeout",
  THROWN_EXCEPTION: "thrown_exception",
}

const isRecord = (value: JsonValue): value is Record<string, JsonValue> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const readString = (payload: JsonValue, key: string): string | undefined => {
  if (!isRecord(payload)) {
    return undefined
  }
  const value = payload[key]
  return typeof value === "string" ? value : undefined
}

const detailString = (
  key: string,
  value: string | undefined,
): Record<string, JsonValue> => (value === undefined ? {} : { [key]: value })

const findSnapshotAtOrBefore = (
  chronicle: Chronicle,
  sequence: number,
): ChronicleBoundarySnapshot | undefined =>
  chronicle.snapshots
    .filter((snapshot) => snapshot.sequence <= sequence)
    .sort((left, right) => right.sequence - left.sequence)[0]

const findSoldierAt = (
  chronicle: Chronicle,
  sequence: number,
  soldierId: SoldierId,
): SoldierSnapshot | undefined =>
  findSnapshotAtOrBefore(chronicle, sequence)?.board.soldiers.find(
    (soldier) => soldier.id === soldierId,
  )

const activeSoldiersForPlayerAt = (
  chronicle: Chronicle,
  sequence: number,
  playerId: PlayerId,
): SoldierSnapshot[] =>
  findSnapshotAtOrBefore(chronicle, sequence)?.board.soldiers.filter(
    (soldier) =>
      soldier.ownerPlayerId === playerId && soldier.status === "ACTIVE",
  ) ?? []

const activeSoldiersAt = (
  chronicle: Chronicle,
  sequence: number,
  ownerPlayerId: PlayerId | undefined,
): SoldierSnapshot[] =>
  findSnapshotAtOrBefore(chronicle, sequence)?.board.soldiers.filter(
    (soldier) =>
      soldier.status === "ACTIVE" &&
      (ownerPlayerId === undefined || soldier.ownerPlayerId === ownerPlayerId),
  ) ?? []

const sameRound = (left: ChronicleEvent, right: ChronicleEvent): boolean =>
  left.context.phaseNumber === right.context.phaseNumber &&
  left.context.roundNumber === right.context.roundNumber

const includePlayer = (
  playerId: PlayerId | undefined,
  ownerPlayerId: PlayerId | undefined,
): boolean => ownerPlayerId === undefined || playerId === ownerPlayerId

const explanation = (
  soldier: SoldierSnapshot,
  sequence: number,
  cause: SoldierInactivityExplanationCause,
  details?: JsonValue | undefined,
): SoldierInactivityExplanationDto => ({
  soldierId: soldier.id,
  playerId: soldier.ownerPlayerId,
  sequence,
  cause,
  label: COPY[cause].label,
  remediation: COPY[cause].remediation,
  ...(details === undefined ? {} : { details }),
})

const explanationForSoldierId = (
  chronicle: Chronicle,
  event: ChronicleEvent,
  cause: SoldierInactivityExplanationCause,
  ownerPlayerId: PlayerId | undefined,
  details?: JsonValue | undefined,
): SoldierInactivityExplanationDto[] => {
  const soldierId = readString(event.payload, "soldierId")
  if (soldierId === undefined) {
    return []
  }
  const soldier = findSoldierAt(chronicle, event.sequence, soldierId)
  if (!soldier || !includePlayer(soldier.ownerPlayerId, ownerPlayerId)) {
    return []
  }
  return [explanation(soldier, event.sequence, cause, details)]
}

const runtimeViolationExplanations = (
  chronicle: Chronicle,
  event: ChronicleEvent,
  ownerPlayerId: PlayerId | undefined,
): SoldierInactivityExplanationDto[] => {
  const runtimeType = readString(event.payload, "type") as
    | RuntimeViolationType
    | undefined
  if (runtimeType === undefined) {
    return []
  }
  const cause = RUNTIME_CAUSES[runtimeType]
  if (cause === undefined) {
    return []
  }

  const details = {
    runtimeViolationType: runtimeType,
  } satisfies Record<string, JsonValue>
  const soldierId = readString(event.payload, "soldierId")
  if (soldierId !== undefined) {
    return explanationForSoldierId(
      chronicle,
      event,
      cause,
      ownerPlayerId,
      details,
    )
  }

  const playerId =
    readString(event.payload, "ownerPlayerId") ??
    readString(event.payload, "playerId") ??
    event.context.actingPlayerId
  if (!playerId || !includePlayer(playerId, ownerPlayerId)) {
    return []
  }
  return activeSoldiersForPlayerAt(chronicle, event.sequence, playerId).map(
    (soldier) => explanation(soldier, event.sequence, cause, details),
  )
}

const selectedSoldierIdsForEvaluation = (
  chronicle: Chronicle,
  evaluation: ChronicleEvent,
  playerId: PlayerId,
): Set<SoldierId> =>
  new Set(
    chronicle.events
      .filter(
        (event) =>
          event.type === "ACTIVATION_STARTED" &&
          event.sequence > evaluation.sequence &&
          sameRound(event, evaluation) &&
          event.context.actingPlayerId === playerId,
      )
      .map((event) => readString(event.payload, "soldierId"))
      .filter((soldierId): soldierId is SoldierId => soldierId !== undefined),
  )

const notSelectedExplanations = (
  chronicle: Chronicle,
  evaluation: ChronicleEvent,
  ownerPlayerId: PlayerId | undefined,
): SoldierInactivityExplanationDto[] => {
  const playerId = readString(evaluation.payload, "playerId")
  if (!playerId || !includePlayer(playerId, ownerPlayerId)) {
    return []
  }

  const selected = selectedSoldierIdsForEvaluation(
    chronicle,
    evaluation,
    playerId,
  )
  return activeSoldiersForPlayerAt(chronicle, evaluation.sequence, playerId)
    .filter((soldier) => !selected.has(soldier.id))
    .map((soldier) =>
      explanation(soldier, evaluation.sequence, "not_selected", {
        phaseNumber: evaluation.context.phaseNumber ?? null,
        roundNumber: evaluation.context.roundNumber ?? null,
      }),
    )
}

const eventExplanations = (
  chronicle: Chronicle,
  event: ChronicleEvent,
  ownerPlayerId: PlayerId | undefined,
): SoldierInactivityExplanationDto[] => {
  switch (event.type) {
    case "STRATEGY_EVALUATED":
      return notSelectedExplanations(chronicle, event, ownerPlayerId)
    case "RUNTIME_VIOLATION":
      return runtimeViolationExplanations(chronicle, event, ownerPlayerId)
    case "MOVE_BLOCKED": {
      const reason = readString(event.payload, "reason")
      return explanationForSoldierId(
        chronicle,
        event,
        reason === "IMMEDIATE_REVERSAL" ? "invalid_action" : "blocked_movement",
        ownerPlayerId,
        {
          ...detailString("reason", reason),
          ...detailString(
            "targetSoldierId",
            readString(event.payload, "targetSoldierId"),
          ),
        },
      )
    }
    case "PUSH_BLOCKED":
      return explanationForSoldierId(
        chronicle,
        event,
        "blocked_movement",
        ownerPlayerId,
        detailString(
          "targetSoldierId",
          readString(event.payload, "targetSoldierId"),
        ),
      )
    case "SOLDIER_STONED":
      return explanationForSoldierId(
        chronicle,
        event,
        "stone",
        ownerPlayerId,
        detailString("reason", readString(event.payload, "reason")),
      )
    case "SOLDIER_FELL":
      return explanationForSoldierId(
        chronicle,
        event,
        "fallen",
        ownerPlayerId,
        detailString("reason", readString(event.payload, "reason")),
      )
    case "MATCH_ENDED":
      return activeSoldiersAt(chronicle, event.sequence, ownerPlayerId).map(
        (soldier) => explanation(soldier, event.sequence, "match_ended"),
      )
    default:
      return []
  }
}

export const buildSoldierInactivityExplanations = ({
  chronicle,
  ownerPlayerId,
}: BuildSoldierInactivityExplanationsInput): SoldierInactivityExplanationDto[] =>
  chronicle.events.flatMap((event) =>
    eventExplanations(chronicle, event, ownerPlayerId),
  )
