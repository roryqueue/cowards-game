import {
  MatchOutcomeSchema,
  type Chronicle,
  type ChronicleBoundarySnapshot,
  type ChronicleEvent,
  type ChronicleEventContext,
  type ChronicleEventType,
  type ChronicleValidationError,
  type JsonValue,
} from "@cowards/spec"

type ContextKey = keyof ChronicleEventContext

const START_BOUNDARY_EVENT_TYPES = {
  MATCH_START: "MATCH_STARTED",
  ROUND_START: "ROUND_STARTED",
  ACTIVATION_START: "ACTIVATION_STARTED",
  CONTRACTION: "CONTRACTION_RESOLVED",
  MATCH_END: "MATCH_ENDED",
  TERMINAL: "MATCH_ENDED",
} as const satisfies Partial<
  Record<ChronicleBoundarySnapshot["kind"], ChronicleEventType>
>

const ROUND_CONTEXT_KEYS = [
  "phaseNumber",
  "roundNumber",
] as const satisfies readonly ContextKey[]

const ACTIVATION_CONTEXT_KEYS = [
  "phaseNumber",
  "roundNumber",
  "activationId",
  "activationIndex",
  "actingPlayerId",
  "soldierId",
] as const satisfies readonly ContextKey[]

const CONTRACTION_CONTEXT_KEYS = [
  "phaseNumber",
  "roundNumber",
] as const satisfies readonly ContextKey[]

const ALL_CONTEXT_KEYS = [
  "phaseNumber",
  "roundNumber",
  "activationId",
  "activationIndex",
  "cycleIndex",
  "actingPlayerId",
  "soldierId",
] as const satisfies readonly ContextKey[]

const error = (
  code: ChronicleValidationError["code"],
  message: string,
  details: Omit<ChronicleValidationError, "code" | "message"> = {},
): ChronicleValidationError => ({
  code,
  message,
  ...details,
})

const eventBySequence = (chronicle: Chronicle): Map<number, ChronicleEvent> =>
  new Map(chronicle.events.map((event) => [event.sequence, event]))

const orderedEvents = (chronicle: Chronicle): ChronicleEvent[] =>
  [...chronicle.events].sort((left, right) => left.sequence - right.sequence)

const contextValue = (
  context: ChronicleEventContext,
  key: ContextKey,
): string | number | undefined => context[key]

const contextMatches = (
  left: ChronicleEventContext,
  right: ChronicleEventContext,
  keys: readonly ContextKey[],
): boolean =>
  keys.every((key) => contextValue(left, key) === contextValue(right, key))

const contextsDiffer = (
  snapshot: ChronicleBoundarySnapshot,
  event: ChronicleEvent,
  keys: readonly ContextKey[],
): boolean => !contextMatches(snapshot.context, event.context, keys)

const snapshotContextContradictsEvent = (
  snapshot: ChronicleBoundarySnapshot,
  event: ChronicleEvent,
  keys: readonly ContextKey[],
): boolean =>
  keys.some((key) => {
    const snapshotValue = contextValue(snapshot.context, key)
    return (
      snapshotValue !== undefined &&
      snapshotValue !== contextValue(event.context, key)
    )
  })

const hasRoundContext = (
  context: ChronicleEventContext,
): context is ChronicleEventContext & { roundNumber: 1 | 2 | 3 | 4 } =>
  context.roundNumber !== undefined

const isSameRound = (
  event: ChronicleEvent,
  roundContext: ChronicleEventContext,
): boolean =>
  event.context.roundNumber === roundContext.roundNumber &&
  (roundContext.phaseNumber === undefined ||
    event.context.phaseNumber === roundContext.phaseNumber)

const isSameActivation = (
  event: ChronicleEvent,
  activationContext: ChronicleEventContext,
): boolean =>
  event.context.activationId === activationContext.activationId &&
  event.context.activationIndex === activationContext.activationIndex &&
  event.context.soldierId === activationContext.soldierId &&
  event.context.actingPlayerId === activationContext.actingPlayerId &&
  event.context.roundNumber === activationContext.roundNumber &&
  (activationContext.phaseNumber === undefined ||
    event.context.phaseNumber === activationContext.phaseNumber)

const findRoundStartIndex = (
  events: readonly ChronicleEvent[],
  roundContext: ChronicleEventContext,
): number =>
  events.findIndex(
    (event) =>
      event.type === "ROUND_STARTED" && isSameRound(event, roundContext),
  )

const findActivationStartIndex = (
  events: readonly ChronicleEvent[],
  activationContext: ChronicleEventContext,
): number =>
  events.findIndex(
    (event) =>
      event.type === "ACTIVATION_STARTED" &&
      isSameActivation(event, activationContext),
  )

const previousSequence = (
  events: readonly ChronicleEvent[],
  currentIndex: number,
): number | undefined => {
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (event !== undefined) {
      return event.sequence
    }
  }
  return undefined
}

const expectedRoundEndSequence = (
  events: readonly ChronicleEvent[],
  roundContext: ChronicleEventContext,
): number | undefined => {
  if (!hasRoundContext(roundContext)) {
    return undefined
  }

  const startIndex = findRoundStartIndex(events, roundContext)
  if (startIndex < 0) {
    return undefined
  }

  let lastInRound: number | undefined
  for (let index = startIndex; index < events.length; index += 1) {
    const event = events[index]
    if (event === undefined) {
      continue
    }
    if (index > startIndex && event.type === "ROUND_STARTED") {
      return lastInRound
    }
    if (event.type === "CONTRACTION_RESOLVED") {
      return lastInRound
    }
    if (event.type === "MATCH_ENDED") {
      return isSameRound(event, roundContext)
        ? event.sequence
        : (lastInRound ?? previousSequence(events, index))
    }
    if (isSameRound(event, roundContext)) {
      lastInRound = event.sequence
    }
  }
  return lastInRound
}

const expectedActivationEndSequence = (
  events: readonly ChronicleEvent[],
  activationContext: ChronicleEventContext,
): number | undefined => {
  const startIndex = findActivationStartIndex(events, activationContext)
  if (startIndex < 0) {
    return undefined
  }

  let lastInActivation: number | undefined
  for (let index = startIndex; index < events.length; index += 1) {
    const event = events[index]
    if (event === undefined) {
      continue
    }
    if (index > startIndex && event.type === "ACTIVATION_STARTED") {
      return lastInActivation
    }
    if (
      event.type === "ROUND_STARTED" ||
      event.type === "CONTRACTION_RESOLVED"
    ) {
      return lastInActivation
    }
    if (event.type === "MATCH_ENDED") {
      return isSameActivation(event, activationContext)
        ? event.sequence
        : (lastInActivation ?? previousSequence(events, index))
    }
    if (isSameActivation(event, activationContext)) {
      lastInActivation = event.sequence
    }
  }
  return lastInActivation
}

const outcomePayload = (event: ChronicleEvent): JsonValue | undefined =>
  event.payload

const outcomesMatch = (
  snapshot: ChronicleBoundarySnapshot,
  event: ChronicleEvent,
): boolean => {
  const parsed = MatchOutcomeSchema.safeParse(outcomePayload(event))
  if (!parsed.success || snapshot.outcome === undefined) {
    return false
  }
  return JSON.stringify(snapshot.outcome) === JSON.stringify(parsed.data)
}

const validateBoundaryKind = (
  snapshot: ChronicleBoundarySnapshot,
  event: ChronicleEvent,
  events: readonly ChronicleEvent[],
): ChronicleValidationError[] => {
  if (snapshot.kind === "ROUND_END") {
    const expectedSequence = expectedRoundEndSequence(events, snapshot.context)
    return expectedSequence === snapshot.sequence
      ? []
      : [
          error(
            "SNAPSHOT_BOUNDARY_INVALID",
            "ROUND_END snapshot must reference the computed Round end boundary.",
            {
              sequence: snapshot.sequence,
              expected: expectedSequence ?? "round end boundary",
              actual: snapshot.sequence,
            },
          ),
        ]
  }

  if (snapshot.kind === "ACTIVATION_END") {
    const expectedSequence = expectedActivationEndSequence(
      events,
      snapshot.context,
    )
    return expectedSequence === snapshot.sequence
      ? []
      : [
          error(
            "SNAPSHOT_BOUNDARY_INVALID",
            "ACTIVATION_END snapshot must reference the computed Activation end boundary.",
            {
              sequence: snapshot.sequence,
              expected: expectedSequence ?? "activation end boundary",
              actual: snapshot.sequence,
            },
          ),
        ]
  }

  const expectedType = START_BOUNDARY_EVENT_TYPES[snapshot.kind]
  return expectedType === event.type
    ? []
    : [
        error(
          "SNAPSHOT_BOUNDARY_INVALID",
          `${snapshot.kind} snapshot references an incompatible event type.`,
          {
            sequence: snapshot.sequence,
            expected: expectedType,
            actual: event.type,
          },
        ),
      ]
}

const validateBoundaryContext = (
  snapshot: ChronicleBoundarySnapshot,
  event: ChronicleEvent,
): ChronicleValidationError[] => {
  const contextError = (expected: JsonValue, actual: JsonValue) =>
    error("CONTEXT_MISMATCH", `${snapshot.kind} snapshot context mismatches.`, {
      sequence: snapshot.sequence,
      expected,
      actual,
    })

  switch (snapshot.kind) {
    case "ROUND_START":
    case "ROUND_END":
      return contextsDiffer(snapshot, event, ROUND_CONTEXT_KEYS)
        ? [
            contextError(
              event.context as JsonValue,
              snapshot.context as JsonValue,
            ),
          ]
        : []
    case "ACTIVATION_START":
    case "ACTIVATION_END":
      return contextsDiffer(snapshot, event, ACTIVATION_CONTEXT_KEYS)
        ? [
            contextError(
              event.context as JsonValue,
              snapshot.context as JsonValue,
            ),
          ]
        : []
    case "CONTRACTION":
      return contextsDiffer(snapshot, event, CONTRACTION_CONTEXT_KEYS)
        ? [
            contextError(
              event.context as JsonValue,
              snapshot.context as JsonValue,
            ),
          ]
        : []
    case "MATCH_START":
    case "MATCH_END":
    case "TERMINAL":
      return snapshotContextContradictsEvent(snapshot, event, ALL_CONTEXT_KEYS)
        ? [
            contextError(
              event.context as JsonValue,
              snapshot.context as JsonValue,
            ),
          ]
        : []
  }
}

const validateTerminalOutcome = (
  snapshot: ChronicleBoundarySnapshot,
  event: ChronicleEvent,
): ChronicleValidationError[] => {
  if (snapshot.kind !== "MATCH_END" && snapshot.kind !== "TERMINAL") {
    return []
  }
  return outcomesMatch(snapshot, event)
    ? []
    : [
        error(
          "CONTEXT_MISMATCH",
          `${snapshot.kind} snapshot outcome must match MATCH_ENDED payload.`,
          {
            sequence: snapshot.sequence,
            expected: event.payload,
            actual: snapshot.outcome ?? "missing",
          },
        ),
      ]
}

export const validateSnapshotBoundaries = (
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  const eventsBySequence = eventBySequence(chronicle)
  const events = orderedEvents(chronicle)
  const errors: ChronicleValidationError[] = []

  for (const snapshot of chronicle.snapshots) {
    const event = eventsBySequence.get(snapshot.sequence)
    if (event === undefined) {
      errors.push(
        error(
          "SNAPSHOT_MISSING",
          "Chronicle snapshot must reference an existing event sequence.",
          { sequence: snapshot.sequence },
        ),
      )
      continue
    }

    errors.push(...validateBoundaryKind(snapshot, event, events))
    errors.push(...validateBoundaryContext(snapshot, event))
    errors.push(...validateTerminalOutcome(snapshot, event))
  }

  return errors
}
