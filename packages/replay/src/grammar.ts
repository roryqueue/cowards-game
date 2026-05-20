import type {
  Chronicle,
  ChronicleEvent,
  ChronicleEventType,
  ChronicleValidationError,
  JsonValue,
} from "@cowards/spec"
import { MAX_ACTIVATION_CYCLES, ROUND_ACTIVATION_COUNTS } from "@cowards/spec"

type GrammarState = {
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

const requireActivationContext = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
  activeActivation: GrammarState["activeActivation"],
): GrammarState["activeActivation"] | undefined => {
  const activationId = requireStringContext(errors, event, "activationId")
  const activationIndex = requireNumberContext(errors, event, "activationIndex")
  const actingPlayerId = requireStringContext(errors, event, "actingPlayerId")
  const soldierId = SOLDIER_CONTEXT_EVENT_TYPES.has(event.type)
    ? requireStringContext(errors, event, "soldierId")
    : event.context.soldierId

  if (
    activeActivation !== undefined &&
    activationId !== undefined &&
    activationId !== activeActivation.activationId
  ) {
    errors.push(
      error(
        "CONTEXT_MISMATCH",
        `${event.type} context.activationId must match the active Activation.`,
        event,
        {
          expected: expectedField(
            "activationId",
            activeActivation.activationId,
          ),
          actual: actualField("activationId", activationId),
        },
      ),
    )
  }
  if (
    activeActivation !== undefined &&
    activationIndex !== undefined &&
    activationIndex !== activeActivation.activationIndex
  ) {
    errors.push(
      error(
        "CONTEXT_MISMATCH",
        `${event.type} context.activationIndex must match the active Activation.`,
        event,
        {
          expected: expectedField(
            "activationIndex",
            activeActivation.activationIndex,
          ),
          actual: actualField("activationIndex", activationIndex),
        },
      ),
    )
  }
  if (
    activeActivation !== undefined &&
    actingPlayerId !== undefined &&
    actingPlayerId !== activeActivation.actingPlayerId
  ) {
    errors.push(
      error(
        "CONTEXT_MISMATCH",
        `${event.type} context.actingPlayerId must match the active Activation.`,
        event,
        {
          expected: expectedField(
            "actingPlayerId",
            activeActivation.actingPlayerId,
          ),
          actual: actualField("actingPlayerId", actingPlayerId),
        },
      ),
    )
  }
  if (
    activeActivation !== undefined &&
    soldierId !== undefined &&
    soldierId !== activeActivation.soldierId
  ) {
    errors.push(
      error(
        "CONTEXT_MISMATCH",
        `${event.type} context.soldierId must match the active Activation Soldier.`,
        event,
        {
          expected: expectedField("soldierId", activeActivation.soldierId),
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
        nextCycleIndex: activeActivation?.nextCycleIndex ?? 0,
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
  activeCycleIndex: number | undefined,
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
  state: GrammarState,
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
  state: GrammarState,
): boolean => {
  if (state.activeRoundNumber === undefined) {
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

const requireActivationOpen = (
  errors: ChronicleValidationError[],
  event: ChronicleEvent,
  state: GrammarState,
): boolean => {
  if (
    state.activeActivation === undefined &&
    event.context.activationId === undefined
  ) {
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
  return true
}

export const validateChronicleGrammar = (
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  const errors: ChronicleValidationError[] = []
  const state: GrammarState = {
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
      case "ACTIVATION_STARTED": {
        requireRoundOpen(errors, event, state)
        requireRoundContext(errors, event, state.activeRoundNumber)
        requireActivationContext(errors, event, undefined)
        validateActivationIndexWindow(errors, event)
        validateSoldierPayload(errors, event)
        state.activeActivation = undefined
        state.activeCycleIndex = undefined
        state.contractionOpen = false
        break
      }
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
      default: {
        const exhaustive: never = event.type
        return exhaustive
      }
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
