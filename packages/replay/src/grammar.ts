import type {
  Chronicle,
  ChronicleEvent,
  ChronicleEventType,
  ChronicleValidationError,
  JsonValue,
} from "@cowards/spec"
import { MAX_ACTIVATION_CYCLES, ROUND_ACTIVATION_COUNTS } from "@cowards/spec"
import {
  classifyCanonicalCompatibilityTupleId,
  type CanonicalCompatibilityTupleLifecycle,
} from "@cowards/spec"

const V1_37_CURRENT_GRAMMAR_EVENT_TYPES = new Set<string>([
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
  "PUSH_RESOLVED",
  "PUSH_BLOCKED",
  "BACKSTAB_RESOLVED",
  "SOLDIER_STONED",
  "SOLDIER_FELL",
  "CONTRACTION_RESOLVED",
  "MATCH_ENDED",
  "RUNTIME_VIOLATION",
])

export const resolveGrammarEventContract = (
  semanticTupleId: string,
  eventType: string,
): CanonicalCompatibilityTupleLifecycle =>
  V1_37_CURRENT_GRAMMAR_EVENT_TYPES.has(eventType)
    ? classifyCanonicalCompatibilityTupleId(semanticTupleId)
    : "historical-or-unknown"

export interface CurrentActivationSlotGrammarState {
  readonly activationId: string
  readonly activationIndex: number
  readonly actingPlayerId: string
  readonly soldierId: string
  readonly selected: true
  readonly started: true
  readonly open: boolean
  readonly closed: boolean
  readonly nextCycleIndex: number
  readonly hasAdvancedThisActivation: boolean
  readonly terminalReason: string | null
  readonly lastAcceptedEventType: ChronicleEventType
  readonly lastAcceptedSequence: number
}

export interface CurrentOpenCycleGrammarState {
  readonly activationId: string
  readonly cycleIndex: number
  readonly boundary: "started" | "observed" | "action_emitted"
}

export interface CurrentChronicleGrammarState {
  readonly matchStarted: boolean
  readonly matchEnded: boolean
  readonly matchSeed: string | null
  readonly activePhaseNumber: number | null
  readonly activeRoundNumber: number | null
  readonly roundSelectionPlayerIds: readonly string[]
  readonly initiativePlayerId: string | null
  readonly roundActivationActors: readonly string[]
  readonly contractionOpen: boolean
  readonly activationSlots: readonly CurrentActivationSlotGrammarState[]
  readonly openCycle: CurrentOpenCycleGrammarState | null
}

export type AdvanceCurrentChronicleGrammarResult =
  | {
      readonly ok: true
      readonly state: CurrentChronicleGrammarState
    }
  | {
      readonly ok: false
      readonly state: CurrentChronicleGrammarState
      readonly error: ChronicleValidationError
    }

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

const error = (
  code: ChronicleValidationError["code"],
  message: string,
  event: ChronicleEvent,
  details: Omit<ChronicleValidationError, "code" | "message" | "sequence"> = {},
): ChronicleValidationError => ({
  code,
  sequence: event.sequence,
  message,
  ...details,
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const readPayloadString = (
  event: ChronicleEvent,
  field: string,
): string | undefined => {
  if (!isRecord(event.payload)) {
    return undefined
  }
  const value = event.payload[field]
  return typeof value === "string" ? value : undefined
}

const readPayloadNumber = (
  event: ChronicleEvent,
  field: string,
): number | undefined => {
  if (!isRecord(event.payload)) {
    return undefined
  }
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
  if (typeof value !== "string" || value.length === 0) {
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
  return value
}

const requireNumberContext = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
  field: "activationIndex" | "cycleIndex",
): number | undefined => {
  const value = event.context[field]
  if (typeof value !== "number") {
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
  return value
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

interface ActivationIdentity {
  readonly activationId: string
  readonly activationIndex: number
  readonly actingPlayerId: string
  readonly soldierId: string
}

const requireActivationIdentity = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
  expectedSlot?: CurrentActivationSlotGrammarState | undefined,
): ActivationIdentity | undefined => {
  const activationId = requireStringContext(errors, event, "activationId")
  const activationIndex = requireNumberContext(errors, event, "activationIndex")
  const actingPlayerId = requireStringContext(errors, event, "actingPlayerId")
  const soldierId = SOLDIER_CONTEXT_EVENT_TYPES.has(event.type)
    ? requireStringContext(errors, event, "soldierId")
    : event.context.soldierId

  if (
    expectedSlot !== undefined &&
    activationId !== undefined &&
    activationId !== expectedSlot.activationId
  ) {
    errors.push(
      error(
        "CONTEXT_MISMATCH",
        `${event.type} context.activationId must match the active Activation.`,
        event,
        {
          expected: expectedField("activationId", expectedSlot.activationId),
          actual: actualField("activationId", activationId),
        },
      ),
    )
  }
  if (
    expectedSlot !== undefined &&
    activationIndex !== undefined &&
    activationIndex !== expectedSlot.activationIndex
  ) {
    errors.push(
      error(
        "CONTEXT_MISMATCH",
        `${event.type} context.activationIndex must match the active Activation.`,
        event,
        {
          expected: expectedField(
            "activationIndex",
            expectedSlot.activationIndex,
          ),
          actual: actualField("activationIndex", activationIndex),
        },
      ),
    )
  }
  if (
    expectedSlot !== undefined &&
    actingPlayerId !== undefined &&
    actingPlayerId !== expectedSlot.actingPlayerId
  ) {
    errors.push(
      error(
        "CONTEXT_MISMATCH",
        `${event.type} context.actingPlayerId must match the active Activation.`,
        event,
        {
          expected: expectedField(
            "actingPlayerId",
            expectedSlot.actingPlayerId,
          ),
          actual: actualField("actingPlayerId", actingPlayerId),
        },
      ),
    )
  }
  if (
    expectedSlot !== undefined &&
    soldierId !== undefined &&
    soldierId !== expectedSlot.soldierId
  ) {
    errors.push(
      error(
        "CONTEXT_MISMATCH",
        `${event.type} context.soldierId must match the active Activation Soldier.`,
        event,
        {
          expected: expectedField("soldierId", expectedSlot.soldierId),
          actual: actualField("soldierId", soldierId),
        },
      ),
    )
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
      }
    : undefined
}

const validateActivationIndexWindow = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
): void => {
  const roundNumber = event.context.roundNumber
  const activationIndex = event.context.activationIndex
  if (roundNumber === undefined || activationIndex === undefined) {
    return
  }
  const maxActivationIndex = ROUND_ACTIVATION_COUNTS[roundNumber] * 2 - 1
  if (activationIndex < 0 || activationIndex > maxActivationIndex) {
    errors.push(
      error(
        "EVENT_WINDOW_INVALID",
        `${event.type} context.activationIndex is outside the Round Activation window.`,
        event,
        {
          expected: `0..${maxActivationIndex}`,
          actual: activationIndex,
        },
      ),
    )
  }
}

const requireCycleContext = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
): number | undefined => {
  const cycleIndex = requireNumberContext(errors, event, "cycleIndex")
  if (
    cycleIndex !== undefined &&
    (cycleIndex < 0 || cycleIndex >= MAX_ACTIVATION_CYCLES)
  ) {
    errors.push(
      error(
        "EVENT_WINDOW_INVALID",
        `${event.type} context.cycleIndex is outside the Activation Cycle window.`,
        event,
        {
          expected: `0..${MAX_ACTIVATION_CYCLES - 1}`,
          actual: cycleIndex,
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
  if (contextPlayerId === undefined) {
    return
  }
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
  state: CurrentChronicleGrammarState,
): boolean => {
  if (!state.matchStarted) {
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
  return true
}

const requireRoundOpen = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
  state: CurrentChronicleGrammarState,
): boolean => {
  if (state.activeRoundNumber === null) {
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
  return true
}

const slotOrder = (
  left: CurrentActivationSlotGrammarState,
  right: CurrentActivationSlotGrammarState,
): number =>
  left.activationIndex - right.activationIndex ||
  (left.activationId < right.activationId
    ? -1
    : left.activationId > right.activationId
      ? 1
      : 0)

const seedHash = (seed: string): number => {
  let hash = 0
  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }
  return hash
}

const roundInitiativePlayerId = (
  seed: string,
  selectionPlayerIds: readonly [string, string],
  roundNumber: number,
): string => {
  const initial =
    seedHash(seed) % 2 === 0 ? selectionPlayerIds[0] : selectionPlayerIds[1]
  return roundNumber % 2 === 1
    ? initial
    : selectionPlayerIds.find((playerId) => playerId !== initial)!
}

const canonicalSnakeOpportunities = (
  initiativePlayerId: string,
  secondPlayerId: string,
  activationCount: number,
): readonly string[] => {
  const actors: string[] = []
  for (let pairIndex = 0; pairIndex < activationCount; pairIndex += 1) {
    actors.push(
      ...(pairIndex % 2 === 0
        ? [initiativePlayerId, secondPlayerId]
        : [secondPlayerId, initiativePlayerId]),
    )
  }
  return actors
}

const canonicalRoundActorSequences = (
  playerIds: readonly [string, string],
  initiativePlayerId: string | null,
  activationCount: number,
): readonly (readonly string[])[] => {
  const initiatives =
    initiativePlayerId === null ? playerIds : ([initiativePlayerId] as const)
  const sequences: string[][] = []
  for (const initiative of initiatives) {
    const second = playerIds.find((playerId) => playerId !== initiative)!
    const opportunities = canonicalSnakeOpportunities(
      initiative,
      second,
      activationCount,
    )
    for (let firstCount = 0; firstCount <= activationCount; firstCount += 1) {
      for (
        let secondCount = 0;
        secondCount <= activationCount;
        secondCount += 1
      ) {
        const selected = new Map<string, number>([
          [playerIds[0], firstCount],
          [playerIds[1], secondCount],
        ])
        const emitted = new Map<string, number>()
        sequences.push(
          opportunities.filter((actor) => {
            const used = emitted.get(actor) ?? 0
            if (used >= (selected.get(actor) ?? 0)) return false
            emitted.set(actor, used + 1)
            return true
          }),
        )
      }
    }
  }
  return sequences
}

const actorsMatch = (
  actual: readonly string[],
  expected: readonly string[],
): boolean =>
  actual.length === expected.length &&
  actual.every((actor, index) => actor === expected[index])

const actorSequenceIsCanonical = (
  actors: readonly string[],
  playerIds: readonly string[],
  initiativePlayerId: string | null,
  roundNumber: number,
  mode: "prefix" | "complete",
): boolean => {
  const firstPlayerId = playerIds[0]
  const secondPlayerId = playerIds[1]
  if (
    playerIds.length !== 2 ||
    firstPlayerId === undefined ||
    secondPlayerId === undefined ||
    firstPlayerId === secondPlayerId
  ) {
    return false
  }
  const activationCount =
    ROUND_ACTIVATION_COUNTS[roundNumber as keyof typeof ROUND_ACTIVATION_COUNTS]
  return canonicalRoundActorSequences(
    [firstPlayerId, secondPlayerId],
    initiativePlayerId,
    activationCount,
  ).some((expected) =>
    mode === "complete"
      ? actorsMatch(actors, expected)
      : actors.every((actor, index) => actor === expected[index]),
  )
}

const freezeGrammarState = (
  input: CurrentChronicleGrammarState,
): CurrentChronicleGrammarState => {
  const activationSlots = Object.freeze(
    input.activationSlots
      .map((slot) => Object.freeze({ ...slot }))
      .sort(slotOrder),
  )
  return Object.freeze({
    ...input,
    roundSelectionPlayerIds: Object.freeze([...input.roundSelectionPlayerIds]),
    roundActivationActors: Object.freeze([...input.roundActivationActors]),
    activationSlots,
    openCycle:
      input.openCycle === null ? null : Object.freeze({ ...input.openCycle }),
  })
}

export const createCurrentChronicleGrammarState =
  (): CurrentChronicleGrammarState =>
    freezeGrammarState({
      matchStarted: false,
      matchEnded: false,
      matchSeed: null,
      activePhaseNumber: null,
      activeRoundNumber: null,
      roundSelectionPlayerIds: [],
      initiativePlayerId: null,
      roundActivationActors: [],
      contractionOpen: false,
      activationSlots: [],
      openCycle: null,
    })

const firstError = (
  errors: readonly ChronicleValidationError[],
): ChronicleValidationError => errors[0]!

const readReason = (event: ChronicleEvent): string | undefined =>
  readPayloadString(event, "reason")

const validatePhaseContext = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
  activePhaseNumber: number | null,
): number | undefined => {
  const phaseNumber = event.context.phaseNumber
  if (
    typeof phaseNumber !== "number" ||
    !Number.isSafeInteger(phaseNumber) ||
    phaseNumber < 1
  ) {
    errors.push(
      error(
        "CONTEXT_MISSING",
        `${event.type} requires a positive integer context.phaseNumber.`,
        event,
        { expected: "context.phaseNumber" },
      ),
    )
    return undefined
  }
  if (activePhaseNumber !== null && phaseNumber !== activePhaseNumber) {
    errors.push(
      error(
        "CONTEXT_MISMATCH",
        `${event.type} context.phaseNumber must match the active Phase.`,
        event,
        {
          expected: expectedField("phaseNumber", activePhaseNumber),
          actual: actualField("phaseNumber", phaseNumber),
        },
      ),
    )
  }
  return phaseNumber
}

const terminalReasonFromEvent = (
  event: ChronicleEvent,
  slot: CurrentActivationSlotGrammarState,
): string | undefined => {
  if (event.type === "RUNTIME_VIOLATION") return "RUNTIME_VIOLATION"
  if (
    event.type === "SOLDIER_FELL" &&
    readPayloadString(event, "soldierId") === slot.soldierId
  ) {
    return "SOLDIER_FELL"
  }
  if (
    event.type === "MOVE_BLOCKED" &&
    readReason(event) === "IMMEDIATE_REVERSAL"
  ) {
    return "INVALID_MOVE"
  }
  if (
    event.type === "SOLDIER_STONED" &&
    readPayloadString(event, "soldierId") === slot.soldierId
  ) {
    const reason = readReason(event)
    if (reason === "BACKSTAB") return "BACKSTABBED"
    if (reason === "TURN_TO_STONE") return "SOLDIER_STONED"
  }
  return undefined
}

const slotWithAcceptedEvent = (
  slot: CurrentActivationSlotGrammarState,
  event: ChronicleEvent,
  changes: Partial<CurrentActivationSlotGrammarState> = {},
): CurrentActivationSlotGrammarState => ({
  ...slot,
  ...changes,
  lastAcceptedEventType: event.type,
  lastAcceptedSequence: event.sequence,
})

export const advanceCurrentChronicleGrammar = (
  input: CurrentChronicleGrammarState,
  event: ChronicleEvent,
): AdvanceCurrentChronicleGrammarResult => {
  const errors: ChronicleValidationError[] = []
  const slots = new Map(
    input.activationSlots.map((slot) => [
      slot.activationId,
      { ...slot } as CurrentActivationSlotGrammarState,
    ]),
  )
  let matchStarted = input.matchStarted
  let matchEnded = input.matchEnded
  let matchSeed = input.matchSeed
  let activePhaseNumber = input.activePhaseNumber
  let activeRoundNumber = input.activeRoundNumber
  let roundSelectionPlayerIds = [...input.roundSelectionPlayerIds]
  let initiativePlayerId = input.initiativePlayerId
  let roundActivationActors = [...input.roundActivationActors]
  let contractionOpen = input.contractionOpen
  let openCycle =
    input.openCycle === null ? null : ({ ...input.openCycle } as const)

  const reject = (): AdvanceCurrentChronicleGrammarResult => ({
    ok: false,
    state: input,
    error: firstError(errors),
  })
  const acceptedState = (): CurrentChronicleGrammarState =>
    freezeGrammarState({
      matchStarted,
      matchEnded,
      matchSeed,
      activePhaseNumber,
      activeRoundNumber,
      roundSelectionPlayerIds,
      initiativePlayerId,
      roundActivationActors,
      contractionOpen,
      activationSlots: [...slots.values()],
      openCycle,
    })
  const requireRound = (): boolean =>
    requireRoundOpen(errors, event, {
      ...input,
      activeRoundNumber,
    })
  const slotForEvent = (): CurrentActivationSlotGrammarState | undefined => {
    const identity = requireActivationIdentity(errors, event)
    if (identity === undefined) return undefined
    const slot = slots.get(identity.activationId)
    if (slot === undefined) {
      errors.push(
        error(
          "EVENT_WINDOW_INVALID",
          `${event.type} requires a previously selected Activation slot.`,
          event,
          { expected: "known activationId" },
        ),
      )
      return undefined
    }
    requireActivationIdentity(errors, event, slot)
    return slot
  }
  const requireMatchingOpenCycle = (
    slot: CurrentActivationSlotGrammarState,
    cycleIndex: number | undefined,
    boundary?: CurrentOpenCycleGrammarState["boundary"],
  ): boolean => {
    if (
      openCycle === null ||
      openCycle.activationId !== slot.activationId ||
      cycleIndex === undefined ||
      openCycle.cycleIndex !== cycleIndex
    ) {
      errors.push(
        error(
          "CONTEXT_MISMATCH",
          `${event.type} must target the exact open Activation Cycle.`,
          event,
          {
            expected:
              openCycle === null
                ? "open Cycle"
                : {
                    activationId: openCycle.activationId,
                    cycleIndex: openCycle.cycleIndex,
                  },
            actual:
              cycleIndex === undefined
                ? "missing Cycle"
                : {
                    activationId: slot.activationId,
                    cycleIndex,
                  },
          },
        ),
      )
      return false
    }
    if (boundary !== undefined && openCycle.boundary !== boundary) {
      errors.push(
        error(
          "EVENT_WINDOW_INVALID",
          `${event.type} is invalid at the current Cycle boundary.`,
          event,
          { expected: boundary, actual: openCycle.boundary },
        ),
      )
      return false
    }
    return true
  }
  const registerRoundPlayer = (playerId: string): void => {
    if (slots.size > 0 || roundActivationActors.length > 0) {
      errors.push(
        error(
          "EVENT_WINDOW_INVALID",
          `${event.type} cannot select a Round player after Activations started.`,
          event,
          { expected: "Round selection before Activations" },
        ),
      )
      return
    }
    if (
      roundSelectionPlayerIds.includes(playerId) ||
      roundSelectionPlayerIds.length >= 2
    ) {
      errors.push(
        error(
          "EVENT_WINDOW_INVALID",
          `${event.type} cannot duplicate or exceed the two Round selection players.`,
          event,
          { expected: "two distinct Round selection players" },
        ),
      )
      return
    }
    roundSelectionPlayerIds = [...roundSelectionPlayerIds, playerId]
    if (
      roundSelectionPlayerIds.length === 2 &&
      matchSeed !== null &&
      activeRoundNumber !== null
    ) {
      initiativePlayerId = roundInitiativePlayerId(
        matchSeed,
        [roundSelectionPlayerIds[0]!, roundSelectionPlayerIds[1]!],
        activeRoundNumber,
      )
    }
  }
  const requireClosedRoundSlots = (): boolean => {
    const unclosed = [...slots.values()]
      .sort(slotOrder)
      .find((slot) => !slot.closed)
    if (unclosed === undefined) return true
    errors.push(
      error(
        "EVENT_WINDOW_INVALID",
        `${event.type} cannot discard an unclosed Activation slot.`,
        event,
        {
          expected: {
            activationId: unclosed.activationId,
            state: "closed",
          },
          actual: {
            activationId: unclosed.activationId,
            state: "open",
          },
        },
      ),
    )
    return false
  }
  const requireCanonicalRoundActors = (): boolean => {
    if (
      activeRoundNumber === null ||
      actorSequenceIsCanonical(
        roundActivationActors,
        roundSelectionPlayerIds,
        initiativePlayerId,
        activeRoundNumber,
        "complete",
      )
    ) {
      return true
    }
    errors.push(
      error(
        "CONTEXT_MISMATCH",
        `${event.type} cannot close a Round with a noncanonical initiative/snake actor sequence.`,
        event,
        {
          expected: "canonical Round initiative/snake actor sequence",
          actual: [...roundActivationActors],
        },
      ),
    )
    return false
  }

  if (matchEnded) {
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
    return reject()
  }
  if (
    event.type !== "MATCH_STARTED" &&
    !requireMatchOpen(errors, event, input)
  ) {
    return reject()
  }
  if (
    openCycle !== null &&
    event.type !== "MATCH_ENDED" &&
    event.context.activationId !== undefined &&
    event.context.activationId !== openCycle.activationId
  ) {
    errors.push(
      error(
        "EVENT_WINDOW_INVALID",
        `${event.type} cannot target another Activation while a Cycle boundary is open.`,
        event,
        {
          expected: { activationId: openCycle.activationId },
          actual: { activationId: event.context.activationId },
        },
      ),
    )
    return reject()
  }

  switch (event.type) {
    case "MATCH_STARTED":
      if (matchStarted) {
        errors.push(
          error(
            "EVENT_WINDOW_INVALID",
            "Chronicle cannot contain duplicate MATCH_STARTED events.",
            event,
            { expected: "single MATCH_STARTED" },
          ),
        )
        return reject()
      }
      matchStarted = true
      matchEnded = false
      matchSeed = readPayloadString(event, "seed") ?? null
      activePhaseNumber = null
      activeRoundNumber = null
      roundSelectionPlayerIds = []
      initiativePlayerId = null
      roundActivationActors = []
      contractionOpen = false
      slots.clear()
      openCycle = null
      break
    case "ROUND_STARTED": {
      if (
        openCycle !== null ||
        (activeRoundNumber !== null &&
          (!requireClosedRoundSlots() || !requireCanonicalRoundActors()))
      ) {
        if (errors.length > 0) return reject()
        errors.push(
          error(
            "EVENT_WINDOW_INVALID",
            "ROUND_STARTED cannot replace an open Activation Cycle.",
            event,
            { expected: "closed Cycle" },
          ),
        )
        return reject()
      }
      const phaseNumber = validatePhaseContext(errors, event, activePhaseNumber)
      const contextRoundNumber = requireRoundContext(errors, event, undefined)
      const payloadRoundNumber = validateRoundStartedPayload(errors, event)
      if (errors.length > 0) return reject()
      activePhaseNumber = phaseNumber ?? null
      activeRoundNumber = payloadRoundNumber ?? contextRoundNumber ?? null
      roundSelectionPlayerIds = []
      initiativePlayerId = null
      roundActivationActors = []
      contractionOpen = false
      slots.clear()
      break
    }
    case "STRATEGY_EVALUATED": {
      requireRound()
      validatePhaseContext(errors, event, activePhaseNumber)
      requireRoundContext(errors, event, activeRoundNumber ?? undefined)
      const actingPlayerId = requireStringContext(
        errors,
        event,
        "actingPlayerId",
      )
      validatePlayerPayload(errors, event)
      if (errors.length > 0) return reject()
      registerRoundPlayer(actingPlayerId!)
      if (errors.length > 0) return reject()
      break
    }
    case "ACTIVATION_STARTED": {
      requireRound()
      const phaseNumber = validatePhaseContext(errors, event, activePhaseNumber)
      requireRoundContext(errors, event, activeRoundNumber ?? undefined)
      const identity = requireActivationIdentity(errors, event)
      validateActivationIndexWindow(errors, event)
      validateSoldierPayload(errors, event)
      if (identity !== undefined) {
        const canonicalActivationId = `${phaseNumber}:${activeRoundNumber}:${identity.activationIndex}`
        if (identity.activationId !== canonicalActivationId) {
          errors.push(
            error(
              "CONTEXT_MISMATCH",
              "ACTIVATION_STARTED context.activationId must match its exact Phase/Round/index coordinate.",
              event,
              {
                expected: canonicalActivationId,
                actual: identity.activationId,
              },
            ),
          )
        }
        if (
          slots.has(identity.activationId) ||
          [...slots.values()].some(
            (slot) =>
              slot.activationIndex === identity.activationIndex ||
              (slot.actingPlayerId === identity.actingPlayerId &&
                slot.soldierId === identity.soldierId),
          )
        ) {
          errors.push(
            error(
              "EVENT_WINDOW_INVALID",
              "ACTIVATION_STARTED cannot select or start a duplicate Activation slot.",
              event,
              { expected: "unique activationId/index/player/Soldier slot" },
            ),
          )
        }
        if (identity.activationIndex !== roundActivationActors.length) {
          errors.push(
            error(
              "CONTEXT_MISMATCH",
              "ACTIVATION_STARTED context.activationIndex must be the next retained Round slot.",
              event,
              {
                expected: roundActivationActors.length,
                actual: identity.activationIndex,
              },
            ),
          )
        }
        const nextActors = [...roundActivationActors, identity.actingPlayerId]
        if (
          activeRoundNumber !== null &&
          !actorSequenceIsCanonical(
            nextActors,
            roundSelectionPlayerIds,
            initiativePlayerId,
            activeRoundNumber,
            "prefix",
          )
        ) {
          errors.push(
            error(
              "CONTEXT_MISMATCH",
              "ACTIVATION_STARTED actor does not match canonical Round initiative/snake order.",
              event,
              {
                expected: "canonical Round initiative/snake actor",
                actual: identity.actingPlayerId,
              },
            ),
          )
        }
      }
      if (errors.length > 0 || identity === undefined) return reject()
      roundActivationActors = [
        ...roundActivationActors,
        identity.actingPlayerId,
      ]
      slots.set(identity.activationId, {
        ...identity,
        selected: true,
        started: true,
        open: true,
        closed: false,
        nextCycleIndex: 0,
        hasAdvancedThisActivation: false,
        terminalReason: null,
        lastAcceptedEventType: event.type,
        lastAcceptedSequence: event.sequence,
      })
      contractionOpen = false
      break
    }
    case "CYCLE_STARTED": {
      requireRound()
      validatePhaseContext(errors, event, activePhaseNumber)
      requireRoundContext(errors, event, activeRoundNumber ?? undefined)
      const slot = slotForEvent()
      const cycleIndex = requireCycleContext(errors, event)
      validateActivationIndexWindow(errors, event)
      validateCyclePayload(errors, event)
      validateSoldierPayload(errors, event)
      if (slot !== undefined) {
        if (slot.closed) {
          errors.push(
            error(
              "EVENT_WINDOW_INVALID",
              "CYCLE_STARTED cannot reopen a closed Activation slot.",
              event,
              { expected: "open Activation slot" },
            ),
          )
        }
        if (openCycle !== null) {
          errors.push(
            error(
              "EVENT_WINDOW_INVALID",
              "CYCLE_STARTED requires the prior Cycle boundary to be closed.",
              event,
              { expected: "no open Cycle" },
            ),
          )
        }
        if (cycleIndex !== undefined && cycleIndex !== slot.nextCycleIndex) {
          errors.push(
            error(
              "CONTEXT_MISMATCH",
              "CYCLE_STARTED context.cycleIndex must be the slot's next Cycle.",
              event,
              {
                expected: expectedField("cycleIndex", slot.nextCycleIndex),
                actual: actualField("cycleIndex", cycleIndex),
              },
            ),
          )
        }
      }
      if (errors.length > 0 || slot === undefined || cycleIndex === undefined)
        return reject()
      openCycle = {
        activationId: slot.activationId,
        cycleIndex,
        boundary: "started",
      }
      slots.set(slot.activationId, slotWithAcceptedEvent(slot, event))
      break
    }
    case "AWARENESS_GRID_OBSERVED": {
      requireRound()
      validatePhaseContext(errors, event, activePhaseNumber)
      requireRoundContext(errors, event, activeRoundNumber ?? undefined)
      const slot = slotForEvent()
      const cycleIndex = requireCycleContext(errors, event)
      validateActivationIndexWindow(errors, event)
      validateCyclePayload(errors, event)
      validateSoldierPayload(errors, event)
      if (
        slot !== undefined &&
        !requireMatchingOpenCycle(slot, cycleIndex, "started")
      ) {
        // Error already recorded.
      }
      if (errors.length > 0 || slot === undefined || cycleIndex === undefined)
        return reject()
      openCycle = {
        activationId: slot.activationId,
        cycleIndex,
        boundary: "observed",
      }
      slots.set(slot.activationId, slotWithAcceptedEvent(slot, event))
      break
    }
    case "ACTION_EMITTED": {
      requireRound()
      validatePhaseContext(errors, event, activePhaseNumber)
      requireRoundContext(errors, event, activeRoundNumber ?? undefined)
      const slot = slotForEvent()
      const cycleIndex = requireCycleContext(errors, event)
      validateActivationIndexWindow(errors, event)
      validateSoldierPayload(errors, event)
      if (
        slot !== undefined &&
        !requireMatchingOpenCycle(slot, cycleIndex, "observed")
      ) {
        // Error already recorded.
      }
      if (errors.length > 0 || slot === undefined || cycleIndex === undefined)
        return reject()
      openCycle = {
        activationId: slot.activationId,
        cycleIndex,
        boundary: "action_emitted",
      }
      slots.set(slot.activationId, slotWithAcceptedEvent(slot, event))
      break
    }
    case "MOVE_ADVANCED":
    case "MOVE_BLOCKED":
    case "TURN_RESOLVED":
    case "PUSH_ATTEMPTED":
    case "PUSH_RESOLVED":
    case "PUSH_BLOCKED": {
      requireRound()
      validatePhaseContext(errors, event, activePhaseNumber)
      requireRoundContext(errors, event, activeRoundNumber ?? undefined)
      const slot = slotForEvent()
      const cycleIndex = requireCycleContext(errors, event)
      validateActivationIndexWindow(errors, event)
      validateSoldierPayload(errors, event)
      if (
        slot !== undefined &&
        !requireMatchingOpenCycle(slot, cycleIndex, "action_emitted")
      ) {
        // Error already recorded.
      }
      if (errors.length > 0 || slot === undefined) return reject()
      const terminalReason = terminalReasonFromEvent(event, slot)
      slots.set(
        slot.activationId,
        slotWithAcceptedEvent(slot, event, {
          hasAdvancedThisActivation:
            slot.hasAdvancedThisActivation || event.type === "MOVE_ADVANCED",
          ...(terminalReason === undefined ? {} : { terminalReason }),
        }),
      )
      break
    }
    case "BACKSTAB_RESOLVED":
    case "SOLDIER_STONED": {
      requireRound()
      validatePhaseContext(errors, event, activePhaseNumber)
      requireRoundContext(errors, event, activeRoundNumber ?? undefined)
      const slot = slotForEvent()
      const noAdvanceCleanup =
        event.type === "SOLDIER_STONED" && readReason(event) === "NO_ADVANCE"
      const cycleIndex = noAdvanceCleanup
        ? event.context.cycleIndex
        : requireCycleContext(errors, event)
      validateActivationIndexWindow(errors, event)
      if (noAdvanceCleanup) {
        validateSoldierPayload(errors, event)
        if (cycleIndex !== undefined) {
          errors.push(
            error(
              "CONTEXT_MISMATCH",
              "SOLDIER_STONED reason NO_ADVANCE is Activation-close cleanup and must not claim a Cycle boundary.",
              event,
              { expected: "no context.cycleIndex", actual: cycleIndex },
            ),
          )
        }
      } else if (
        slot !== undefined &&
        !requireMatchingOpenCycle(slot, cycleIndex)
      ) {
        // Error already recorded.
      }
      if (
        slot !== undefined &&
        noAdvanceCleanup &&
        slot.hasAdvancedThisActivation
      ) {
        errors.push(
          error(
            "PAYLOAD_INCONSISTENT",
            "SOLDIER_STONED reason NO_ADVANCE conflicts with the slot's successful Advance history.",
            event,
            { expected: "no successful Advance" },
          ),
        )
      }
      if (errors.length > 0 || slot === undefined) return reject()
      const terminalReason = terminalReasonFromEvent(event, slot)
      slots.set(
        slot.activationId,
        slotWithAcceptedEvent(slot, event, {
          ...(terminalReason === undefined ? {} : { terminalReason }),
        }),
      )
      break
    }
    case "RUNTIME_VIOLATION": {
      requireRound()
      validatePhaseContext(errors, event, activePhaseNumber)
      requireRoundContext(errors, event, activeRoundNumber ?? undefined)
      const actingPlayerId = requireStringContext(
        errors,
        event,
        "actingPlayerId",
      )
      const soldierId = readPayloadString(event, "soldierId")
      if (soldierId !== undefined) {
        const slot = slotForEvent()
        const cycleIndex = requireCycleContext(errors, event)
        validateActivationIndexWindow(errors, event)
        validateSoldierPayload(errors, event)
        if (slot !== undefined && !requireMatchingOpenCycle(slot, cycleIndex)) {
          // Error already recorded.
        }
        if (errors.length > 0 || slot === undefined) return reject()
        slots.set(
          slot.activationId,
          slotWithAcceptedEvent(slot, event, {
            terminalReason: "RUNTIME_VIOLATION",
          }),
        )
      } else if (openCycle !== null) {
        errors.push(
          error(
            "EVENT_WINDOW_INVALID",
            "RUNTIME_VIOLATION must identify the Soldier when a Cycle is open.",
            event,
            { expected: "payload.soldierId" },
          ),
        )
      }
      validatePlayerPayload(errors, event)
      if (errors.length > 0) return reject()
      if (soldierId === undefined) {
        registerRoundPlayer(actingPlayerId!)
        if (errors.length > 0) return reject()
      }
      break
    }
    case "CYCLE_ENDED": {
      requireRound()
      validatePhaseContext(errors, event, activePhaseNumber)
      requireRoundContext(errors, event, activeRoundNumber ?? undefined)
      const slot = slotForEvent()
      const cycleIndex = requireCycleContext(errors, event)
      validateActivationIndexWindow(errors, event)
      validateCyclePayload(errors, event)
      validateSoldierPayload(errors, event)
      if (
        slot !== undefined &&
        !requireMatchingOpenCycle(slot, cycleIndex, "action_emitted")
      ) {
        // Error already recorded.
      }
      if (errors.length > 0 || slot === undefined || cycleIndex === undefined)
        return reject()
      slots.set(
        slot.activationId,
        slotWithAcceptedEvent(slot, event, {
          nextCycleIndex: cycleIndex + 1,
        }),
      )
      openCycle = null
      break
    }
    case "ACTIVATION_ENDED": {
      requireRound()
      validatePhaseContext(errors, event, activePhaseNumber)
      requireRoundContext(errors, event, activeRoundNumber ?? undefined)
      const slot = slotForEvent()
      validateActivationIndexWindow(errors, event)
      validateSoldierPayload(errors, event)
      const reason = readReason(event)
      if (slot !== undefined) {
        if (slot.closed) {
          errors.push(
            error(
              "EVENT_WINDOW_INVALID",
              "ACTIVATION_ENDED cannot close an Activation slot twice.",
              event,
              { expected: "open Activation slot" },
            ),
          )
        }
        if (
          slot.terminalReason !== null &&
          reason !== undefined &&
          reason !== slot.terminalReason
        ) {
          errors.push(
            error(
              "PAYLOAD_INCONSISTENT",
              "ACTIVATION_ENDED reason must match the slot's observed terminal reason.",
              event,
              {
                expected: slot.terminalReason,
                actual: reason,
              },
            ),
          )
        }
        if (
          reason === "CYCLE_EXHAUSTED" &&
          slot.nextCycleIndex !== MAX_ACTIVATION_CYCLES
        ) {
          errors.push(
            error(
              "PAYLOAD_INCONSISTENT",
              "ACTIVATION_ENDED cannot claim CYCLE_EXHAUSTED before every Cycle.",
              event,
              {
                expected: MAX_ACTIVATION_CYCLES,
                actual: slot.nextCycleIndex,
              },
            ),
          )
        }
      }
      if (errors.length > 0 || slot === undefined || reason === undefined)
        return reject()
      const nextCycleIndex =
        openCycle?.activationId === slot.activationId
          ? openCycle.cycleIndex + 1
          : slot.nextCycleIndex
      if (openCycle !== null && openCycle.activationId === slot.activationId) {
        openCycle = null
      }
      slots.set(
        slot.activationId,
        slotWithAcceptedEvent(slot, event, {
          open: false,
          closed: true,
          nextCycleIndex,
          terminalReason: reason,
        }),
      )
      break
    }
    case "ACTIVATION_SKIPPED": {
      requireRound()
      validatePhaseContext(errors, event, activePhaseNumber)
      requireRoundContext(errors, event, activeRoundNumber ?? undefined)
      const slot = slotForEvent()
      const cycleIndex = requireCycleContext(errors, event)
      validateActivationIndexWindow(errors, event)
      validateCyclePayload(errors, event)
      validateSoldierPayload(errors, event)
      const reason = readReason(event)
      if (slot !== undefined) {
        if (!slot.closed) {
          errors.push(
            error(
              "EVENT_WINDOW_INVALID",
              "ACTIVATION_SKIPPED requires a previously closed Activation slot.",
              event,
              { expected: "closed Activation slot" },
            ),
          )
        }
        if (cycleIndex !== undefined && cycleIndex !== slot.nextCycleIndex) {
          errors.push(
            error(
              "CONTEXT_MISMATCH",
              "ACTIVATION_SKIPPED context.cycleIndex must be the slot's next Cycle.",
              event,
              {
                expected: expectedField("cycleIndex", slot.nextCycleIndex),
                actual: actualField("cycleIndex", cycleIndex),
              },
            ),
          )
        }
        if (
          slot.terminalReason !== null &&
          reason !== undefined &&
          reason !== slot.terminalReason
        ) {
          errors.push(
            error(
              "PAYLOAD_INCONSISTENT",
              "ACTIVATION_SKIPPED reason must match the closed slot.",
              event,
              { expected: slot.terminalReason, actual: reason },
            ),
          )
        }
      }
      if (errors.length > 0 || slot === undefined || cycleIndex === undefined)
        return reject()
      slots.set(
        slot.activationId,
        slotWithAcceptedEvent(slot, event, {
          nextCycleIndex: cycleIndex + 1,
        }),
      )
      break
    }
    case "SOLDIER_FELL": {
      if (event.context.activationId === undefined) {
        if (!contractionOpen) {
          errors.push(
            error(
              "EVENT_WINDOW_INVALID",
              "SOLDIER_FELL requires an open Activation or Contraction.",
              event,
              { expected: "open Activation or Contraction" },
            ),
          )
        }
      } else {
        requireRound()
        validatePhaseContext(errors, event, activePhaseNumber)
        requireRoundContext(errors, event, activeRoundNumber ?? undefined)
        const slot = slotForEvent()
        const cycleIndex = requireCycleContext(errors, event)
        validateActivationIndexWindow(errors, event)
        if (slot !== undefined && !requireMatchingOpenCycle(slot, cycleIndex)) {
          // Error already recorded.
        }
        if (errors.length > 0 || slot === undefined) return reject()
        const terminalReason = terminalReasonFromEvent(event, slot)
        slots.set(
          slot.activationId,
          slotWithAcceptedEvent(slot, event, {
            ...(terminalReason === undefined ? {} : { terminalReason }),
          }),
        )
      }
      if (errors.length > 0) return reject()
      break
    }
    case "CONTRACTION_RESOLVED":
      if (
        openCycle !== null ||
        !requireClosedRoundSlots() ||
        !requireCanonicalRoundActors()
      ) {
        if (errors.length > 0) return reject()
        errors.push(
          error(
            "EVENT_WINDOW_INVALID",
            "CONTRACTION_RESOLVED cannot replace an open Activation Cycle.",
            event,
            { expected: "closed Cycle" },
          ),
        )
        return reject()
      }
      validatePhaseContext(errors, event, activePhaseNumber)
      if (errors.length > 0) return reject()
      activePhaseNumber = null
      activeRoundNumber = null
      roundSelectionPlayerIds = []
      initiativePlayerId = null
      roundActivationActors = []
      contractionOpen = true
      slots.clear()
      break
    case "MATCH_ENDED":
      matchEnded = true
      activeRoundNumber = null
      contractionOpen = false
      openCycle = null
      break
    default: {
      const exhaustive: never = event.type
      return exhaustive
    }
  }

  if (!PLAYER_CONTEXT_EVENT_TYPES.has(event.type)) {
    validatePlayerPayload(errors, event)
  }
  if (errors.length > 0) return reject()
  return { ok: true, state: acceptedState() }
}

export const validateChronicleGrammar = (
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  const errors: ChronicleValidationError[] = []
  let state = createCurrentChronicleGrammarState()
  for (const event of chronicle.events) {
    const advanced = advanceCurrentChronicleGrammar(state, event)
    if (!advanced.ok) {
      errors.push(advanced.error)
      continue
    }
    state = advanced.state
  }
  if (!state.matchStarted) {
    errors.push({
      code: "REQUIRED_EVENT_MISSING",
      message: "Chronicle is missing MATCH_STARTED.",
      expected: "MATCH_STARTED",
    })
  }
  if (state.matchStarted && !state.matchEnded) {
    errors.push({
      code: "REQUIRED_EVENT_MISSING",
      message: "Chronicle is missing terminal MATCH_ENDED.",
      expected: "MATCH_ENDED",
    })
  }
  return errors
}
