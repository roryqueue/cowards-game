import {
  MAX_ACTIVATION_CYCLES,
  ROUND_ACTIVATION_COUNTS,
  SoldierBrainResultSchema,
  StrategyResultSchema,
  type ActivationOrder,
  type JsonValue,
  type PlayerId,
  type Soldier,
} from "@cowards/spec"
import { activationStartedEvent, createActivationSlots } from "../activation.js"
import { resolveBackstabBoundary } from "../backstab.js"
import { resolveContraction } from "../contraction.js"
import { resolveAction } from "../movement.js"
import { applyMatchOutcome, checkAndApplyMatchEnd } from "../outcome.js"
import { getOpponentPlayer, getSoldier, replaceSoldier } from "../selectors.js"
import {
  createSoldierBrainInput,
  createStrategyInput,
} from "../runtime-inputs.js"
import {
  event,
  type ActivationSlotState,
  type ActivationTerminalReason,
  type GameState,
  type TransitionEventSummary,
} from "../types.js"
import type {
  KernelEffectRequest,
  KernelInput,
  KernelRestrictedFailure,
  KernelRuntimeViolation,
  KernelStepResult,
  MatchMachine,
} from "./types.js"
import {
  appendKernelEventHistory,
  appendKernelRequestIdHistory,
  createTransitionRecord,
  expectedEffectRequestId,
  validateKernelInput,
  validateMachine,
  validateTransitionRecord,
} from "./validate.js"

const privateJson = (value: unknown): JsonValue => value as JsonValue

// v1.17 retains exact resource ownership in the private invocation evidence,
// while the v1.4 gameplay consequence and Chronicle vocabulary remain TIMEOUT.
// This translation belongs at the single engine consequence/event boundary;
// adapters must not discard the more precise RESOURCE_EXHAUSTION evidence.
const historicalGameplayViolationType = (
  violation: KernelRuntimeViolation,
) =>
  violation.type === "RESOURCE_EXHAUSTION" ? "TIMEOUT" : violation.type

const integrityFailure = (code: string): KernelRestrictedFailure => ({
  classification: "system_failure",
  category: "CANONICAL_INTEGRITY_FAILURE",
  ownership: "system_integrity",
  code,
  retryable: false,
})

const fail = (
  machine: MatchMachine,
  failure: KernelRestrictedFailure,
): KernelStepResult => ({ kind: "failure", machine, failure })

const nextOrdinal = (machine: MatchMachine) => machine.cursor.ordinal + 1

const withCursor = (
  machine: MatchMachine,
  cursor: Partial<MatchMachine["cursor"]>,
): MatchMachine => ({
  ...machine,
  cursor: {
    ...machine.cursor,
    ...cursor,
    ordinal: nextOrdinal(machine),
  },
})

const sequenceEvents = (
  machine: MatchMachine,
  events: readonly TransitionEventSummary[],
): TransitionEventSummary[] =>
  events.map((summary, index) => ({
    ...summary,
    sequence: machine.fullEvents.length + index,
  }))

const finishTransition = (
  before: MatchMachine,
  afterWithoutEvents: MatchMachine,
  transitionKind: string,
  classification: string,
  rawEvents: readonly TransitionEventSummary[],
): KernelStepResult => {
  if (rawEvents.length === 0) {
    return fail(before, integrityFailure("KERNEL_ZERO_EVENT_TRANSITION"))
  }
  const sequenced = sequenceEvents(before, rawEvents)
  const history = appendKernelEventHistory(before.fullEvents, sequenced)
  const events = history.events
  const after: MatchMachine = {
    ...afterWithoutEvents,
    fullEvents: history.fullEvents,
  }
  const machineFailure = validateMachine(after)
  if (machineFailure !== undefined) return fail(before, machineFailure)
  const record = createTransitionRecord({
    before,
    after,
    transitionKind,
    classification,
    events,
  })
  const recordFailure = validateTransitionRecord(record, before.semanticTuple)
  if (recordFailure !== undefined) return fail(before, recordFailure)
  if (after.state.outcome !== undefined) {
    return {
      kind: "completed",
      machine: after,
      record,
      result: { state: after.state, events: record.events.slice() },
    }
  }
  return { kind: "transition", machine: after, record }
}

const activationEventContext = (slot: ActivationSlotState) => ({
  activationId: slot.activationId,
  activationIndex: slot.activationIndex,
  actingPlayerId: slot.actingPlayerId,
  soldierId: slot.soldierId,
})

const cycleEventContext = (slot: ActivationSlotState, cycleIndex: number) => ({
  ...activationEventContext(slot),
  cycleIndex,
})

const closeSlot = (
  state: GameState,
  slot: ActivationSlotState,
  terminalReason: ActivationTerminalReason,
): {
  state: GameState
  slot: ActivationSlotState
  events: TransitionEventSummary[]
} => {
  let current = state
  const events: TransitionEventSummary[] = []
  const soldier = getSoldier(current, slot.soldierId)
  if (soldier?.status === "ACTIVE" && !slot.advanced) {
    current = replaceSoldier(current, { ...soldier, status: "STONE" })
    events.push(
      event(
        "SOLDIER_STONED",
        { soldierId: slot.soldierId, reason: "NO_ADVANCE" },
        { context: activationEventContext(slot) },
      ),
    )
  }
  events.push(
    event(
      "ACTIVATION_ENDED",
      { soldierId: slot.soldierId, reason: terminalReason },
      { context: activationEventContext(slot) },
    ),
  )
  return {
    state: current,
    slot: { ...slot, ended: true, terminalReason },
    events,
  }
}

const parseRetainedStrategyResult = (
  state: GameState,
  playerId: PlayerId,
  value: unknown,
):
  | {
      success: true
      orders: ActivationOrder[]
      strategyMemory: JsonValue
    }
  | { success: false; message: string } => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    const parsed = StrategyResultSchema.safeParse(value)
    return {
      success: false,
      message: parsed.success
        ? "Strategy result must be an object."
        : parsed.error.message,
    }
  }
  const rawOrders = (value as { activationOrders?: unknown }).activationOrders
  if (!Array.isArray(rawOrders)) {
    const parsed = StrategyResultSchema.safeParse(value)
    return {
      success: false,
      message: parsed.success
        ? "activationOrders must be an array."
        : parsed.error.message,
    }
  }
  const parsed = StrategyResultSchema.safeParse({
    ...value,
    activationOrders: rawOrders.slice(0, state.activationCount),
  })
  if (!parsed.success) {
    return { success: false, message: parsed.error.message }
  }

  const seen = new Set<string>()
  for (const order of parsed.data.activationOrders) {
    const soldier = getSoldier(state, order.soldierId)
    if (
      seen.has(order.soldierId) ||
      soldier === undefined ||
      soldier.ownerPlayerId !== playerId ||
      soldier.status !== "ACTIVE"
    ) {
      return {
        success: false,
        message:
          "A retained activation order is duplicate, unknown, wrong-owner, or inactive.",
      }
    }
    seen.add(order.soldierId)
  }
  return {
    success: true,
    orders: parsed.data.activationOrders.map((order) =>
      order.objective === undefined
        ? { soldierId: order.soldierId }
        : { soldierId: order.soldierId, objective: order.objective },
    ),
    strategyMemory: parsed.data.strategyMemory,
  }
}

const runtimeViolationEvent = (
  playerId: PlayerId,
  violation: KernelRuntimeViolation,
): TransitionEventSummary =>
  event(
    "RUNTIME_VIOLATION",
    { playerId, type: historicalGameplayViolationType(violation) },
    {
      context: { actingPlayerId: playerId },
      privacy: "owner",
      privatePayload: privateJson({ playerId, violation }),
    },
  )

const applySoldierRuntimeViolation = (
  state: GameState,
  soldier: Soldier,
  violation: KernelRuntimeViolation,
  advanced: boolean,
): { state: GameState; events: TransitionEventSummary[] } => {
  const events = [
    event(
      "RUNTIME_VIOLATION",
      {
        soldierId: soldier.id,
        ownerPlayerId: soldier.ownerPlayerId,
        type: historicalGameplayViolationType(violation),
      },
      {
        context: {
          actingPlayerId: soldier.ownerPlayerId,
          soldierId: soldier.id,
        },
        privacy: "owner",
        privatePayload: privateJson({
          soldierId: soldier.id,
          ownerPlayerId: soldier.ownerPlayerId,
          violation,
        }),
      },
    ),
  ]
  if (advanced || soldier.status === "FALLEN") return { state, events }
  return {
    state: replaceSoldier(state, { ...soldier, status: "STONE" }),
    events: [...events, event("SOLDIER_STONED", { soldierId: soldier.id })],
  }
}

const advanceRoundState = (state: GameState): GameState => {
  const roundNumber =
    state.roundNumber === 4 ? 1 : ((state.roundNumber + 1) as 1 | 2 | 3 | 4)
  return {
    ...state,
    roundNumber,
    activationCount: ROUND_ACTIVATION_COUNTS[roundNumber],
    initiativePlayerId: getOpponentPlayer(state, state.initiativePlayerId).id,
  }
}

const afterRound = (machine: MatchMachine, state: GameState): MatchMachine => {
  if (state.roundNumber < 4) {
    const next = advanceRoundState(state)
    return withCursor(
      {
        ...machine,
        state: next,
        selections: { bottom: [], top: [] },
        slots: [],
      },
      {
        stage: "round_start",
        phaseNumber: next.phaseNumber,
        roundNumber: next.roundNumber,
        cycleLayer: 0,
        slotIndex: 0,
      },
    )
  }
  return withCursor(
    { ...machine, state, selections: { bottom: [], top: [] }, slots: [] },
    { stage: "contraction", cycleLayer: 0, slotIndex: 0 },
  )
}

const afterSlot = (
  machine: MatchMachine,
  state: GameState,
  slots: readonly ActivationSlotState[],
): MatchMachine => {
  if (
    machine.executionMode === "activation" &&
    slots[machine.cursor.slotIndex]?.ended
  ) {
    return withCursor({ ...machine, state, slots }, { stage: "completed" })
  }
  const nextSlotIndex = machine.cursor.slotIndex + 1
  if (nextSlotIndex < slots.length) {
    return withCursor(
      { ...machine, state, slots },
      { stage: "cycle_slot_start", slotIndex: nextSlotIndex },
    )
  }
  const nextCycleLayer = machine.cursor.cycleLayer + 1
  if (nextCycleLayer < MAX_ACTIVATION_CYCLES) {
    return withCursor(
      { ...machine, state, slots },
      {
        stage: "cycle_slot_start",
        cycleLayer: nextCycleLayer,
        slotIndex: 0,
      },
    )
  }
  return afterRound({ ...machine, state, slots }, state)
}

const selectionRequest = (
  machine: MatchMachine,
  playerId: PlayerId,
): KernelEffectRequest => ({
  kind: "selectActivations",
  requestId: expectedEffectRequestId(machine, "selectActivations", playerId),
  semanticTupleId: machine.semanticTuple.tupleId,
  coordinates: {
    phaseNumber: machine.cursor.phaseNumber,
    roundNumber: machine.cursor.roundNumber,
    actingPlayerId: playerId,
    stage: machine.cursor.stage,
    ordinal: machine.cursor.ordinal,
  },
  input: createStrategyInput(
    machine.state,
    playerId,
    machine.semanticTuple.tuple.runtimeAbi,
  ),
})

const yieldSelection = (
  machine: MatchMachine,
  playerId: PlayerId,
): KernelStepResult => {
  const request = selectionRequest(machine, playerId)
  const pending = { ...machine, pendingEffect: request }
  return { kind: "effect", machine: pending, request }
}

const resolveSelection = (
  machine: MatchMachine,
  input: Extract<KernelInput, { kind: "runtime_resume" }>,
  side: "bottom" | "top",
): KernelStepResult => {
  const player = machine.state.players[side === "bottom" ? 0 : 1]
  let state = machine.state
  let orders: ActivationOrder[] = []
  let classification = input.classification
  let events: TransitionEventSummary[]

  if (input.classification === "player_violation") {
    events = [runtimeViolationEvent(player.id, input.violation)]
  } else if (input.classification === "success") {
    const parsed = parseRetainedStrategyResult(state, player.id, input.value)
    if (!parsed.success) {
      classification = "player_violation"
      events = [
        runtimeViolationEvent(player.id, {
          type: "INVALID_OUTPUT",
          message: parsed.message,
        }),
      ]
    } else {
      state = {
        ...state,
        players: state.players.map((candidate) =>
          candidate.id === player.id
            ? { ...candidate, strategyMemory: parsed.strategyMemory }
            : candidate,
        ) as GameState["players"],
      }
      orders = parsed.orders
      events = [
        event(
          "STRATEGY_EVALUATED",
          { playerId: player.id },
          {
            context: { actingPlayerId: player.id },
            privacy: "owner",
            privatePayload: {
              playerId: player.id,
              strategyMemory: parsed.strategyMemory,
            },
          },
        ),
      ]
    }
  } else {
    return fail(machine, {
      classification: "system_failure",
      category: "RUNTIME_SYSTEM_FAILURE",
      ownership: "runtime_system",
      code: input.failure.code,
      retryable: input.failure.retryable,
    })
  }

  const consumed = appendKernelRequestIdHistory(
    machine.consumedRequestIds,
    input.requestId,
  )
  if (side === "bottom") {
    const after = withCursor(
      {
        ...machine,
        state,
        pendingEffect: undefined,
        consumedRequestIds: consumed,
        selections: { ...machine.selections, bottom: orders },
      },
      { stage: "select_top" },
    )
    return finishTransition(
      machine,
      after,
      "BOTTOM_SELECTION_RESOLVED",
      classification,
      events,
    )
  }

  const selections = { ...machine.selections, top: orders }
  const firstPlayerId = state.initiativePlayerId
  const secondPlayerId = getOpponentPlayer(state, firstPlayerId).id
  const slots = createActivationSlots(
    state,
    new Map([
      [state.players[0].id, [...selections.bottom]],
      [state.players[1].id, [...selections.top]],
    ]),
    firstPlayerId,
    secondPlayerId,
  )
  events.push(...slots.map(activationStartedEvent))
  const base: MatchMachine = {
    ...machine,
    state,
    pendingEffect: undefined,
    consumedRequestIds: consumed,
    selections,
    slots,
  }
  const after =
    slots.length === 0
      ? afterRound(base, state)
      : withCursor(base, {
          stage: "cycle_slot_start",
          cycleLayer: 0,
          slotIndex: 0,
        })
  return finishTransition(
    machine,
    after,
    "TOP_SELECTION_AND_ACTIVATIONS_RESOLVED",
    classification,
    events,
  )
}

const advanceCycleStart = (machine: MatchMachine): KernelStepResult => {
  const slot = machine.slots[machine.cursor.slotIndex]
  if (slot === undefined) {
    return fail(machine, integrityFailure("KERNEL_SLOT_MISSING"))
  }
  const context = cycleEventContext(slot, machine.cursor.cycleLayer)
  if (slot.ended) {
    const after = afterSlot(machine, machine.state, machine.slots)
    return finishTransition(machine, after, "ACTIVATION_SKIPPED", "success", [
      event(
        "ACTIVATION_SKIPPED",
        {
          soldierId: slot.soldierId,
          cycleIndex: machine.cursor.cycleLayer,
          reason: slot.terminalReason ?? "ENDED",
        },
        { context },
      ),
    ])
  }

  let soldier = getSoldier(machine.state, slot.soldierId)
  if (!soldier || soldier.status !== "ACTIVE") {
    const closed = closeSlot(
      machine.state,
      slot,
      soldier?.status === "FALLEN" ? "SOLDIER_FELL" : "SOLDIER_STONED",
    )
    const slots = machine.slots.map((candidate, index) =>
      index === machine.cursor.slotIndex ? closed.slot : candidate,
    )
    return finishTransition(
      machine,
      afterSlot(machine, closed.state, slots),
      "ACTIVATION_CLOSED",
      "success",
      closed.events,
    )
  }

  let state = machine.state
  const events = [
    event(
      "CYCLE_STARTED",
      { soldierId: slot.soldierId, cycleIndex: machine.cursor.cycleLayer },
      { context },
    ),
  ]
  const backstab = resolveBackstabBoundary(state, "cycle-start")
  state = backstab.state
  events.push(
    ...backstab.events.map((summary) => ({
      ...summary,
      context: { ...context, ...summary.context },
    })),
  )
  const ended = checkAndApplyMatchEnd(state)
  state = ended.state
  events.push(...ended.events)
  if (state.outcome !== undefined) {
    const slots = machine.slots.map((candidate, index) =>
      index === machine.cursor.slotIndex
        ? { ...slot, ended: true, terminalReason: "MATCH_ENDED" as const }
        : candidate,
    )
    return finishTransition(
      machine,
      withCursor({ ...machine, state, slots }, { stage: "completed" }),
      "CYCLE_START_TERMINAL",
      "success",
      events,
    )
  }

  soldier = getSoldier(state, slot.soldierId)
  if (!soldier || soldier.status !== "ACTIVE") {
    const closed = closeSlot(
      state,
      slot,
      soldier?.status === "FALLEN" ? "SOLDIER_FELL" : "SOLDIER_STONED",
    )
    const slots = machine.slots.map((candidate, index) =>
      index === machine.cursor.slotIndex ? closed.slot : candidate,
    )
    return finishTransition(
      machine,
      afterSlot(machine, closed.state, slots),
      "CYCLE_START_CLOSED",
      "success",
      [...events, ...closed.events],
    )
  }

  return finishTransition(
    machine,
    withCursor({ ...machine, state }, { stage: "soldier_observation" }),
    "CYCLE_STARTED",
    "success",
    events,
  )
}

const advanceObservation = (machine: MatchMachine): KernelStepResult => {
  const slot = machine.slots[machine.cursor.slotIndex]
  const soldier = slot && getSoldier(machine.state, slot.soldierId)
  if (slot === undefined || soldier?.status !== "ACTIVE") {
    return fail(machine, integrityFailure("KERNEL_OBSERVATION_TARGET_INVALID"))
  }
  const input = createSoldierBrainInput(
    machine.state,
    slot.soldierId,
    machine.cursor.cycleLayer,
    slot.objective,
  )
  return finishTransition(
    machine,
    withCursor(machine, { stage: "soldier_effect" }),
    "SOLDIER_OBSERVATION_CREATED",
    "success",
    [
      event(
        "AWARENESS_GRID_OBSERVED",
        {
          soldierId: slot.soldierId,
          cycleIndex: machine.cursor.cycleLayer,
        },
        {
          context: cycleEventContext(slot, machine.cursor.cycleLayer),
          privacy: "owner",
          privatePayload: privateJson({
            soldierId: slot.soldierId,
            ownerPlayerId: soldier.ownerPlayerId,
            cycleIndex: machine.cursor.cycleLayer,
            awarenessGrid: input.awarenessGrid,
            objectiveRef: { hasObjective: slot.objective !== undefined },
            objectivePayload: slot.objective,
          }),
        },
      ),
    ],
  )
}

const yieldSoldierEffect = (machine: MatchMachine): KernelStepResult => {
  const slot = machine.slots[machine.cursor.slotIndex]
  if (slot === undefined) {
    return fail(machine, integrityFailure("KERNEL_SLOT_MISSING"))
  }
  const request: KernelEffectRequest = {
    kind: "soldierBrain",
    requestId: expectedEffectRequestId(
      machine,
      "soldierBrain",
      `${slot.activationId}:${machine.cursor.cycleLayer}`,
    ),
    semanticTupleId: machine.semanticTuple.tupleId,
    coordinates: {
      phaseNumber: machine.cursor.phaseNumber,
      roundNumber: machine.cursor.roundNumber,
      cycleIndex: machine.cursor.cycleLayer,
      activationId: slot.activationId,
      activationIndex: slot.activationIndex,
      actingPlayerId: slot.actingPlayerId,
      soldierId: slot.soldierId,
      stage: machine.cursor.stage,
      ordinal: machine.cursor.ordinal,
    },
    input: createSoldierBrainInput(
      machine.state,
      slot.soldierId,
      machine.cursor.cycleLayer,
      slot.objective,
    ),
  }
  return {
    kind: "effect",
    machine: { ...machine, pendingEffect: request },
    request,
  }
}

const resolveSoldierEffect = (
  machine: MatchMachine,
  input: Extract<KernelInput, { kind: "runtime_resume" }>,
): KernelStepResult => {
  if (input.classification === "system_failure") {
    return fail(machine, {
      classification: "system_failure",
      category: "RUNTIME_SYSTEM_FAILURE",
      ownership: "runtime_system",
      code: input.failure.code,
      retryable: input.failure.retryable,
    })
  }
  const slot = machine.slots[machine.cursor.slotIndex]
  const soldier = slot && getSoldier(machine.state, slot.soldierId)
  if (slot === undefined || soldier?.status !== "ACTIVE") {
    return fail(machine, integrityFailure("KERNEL_EFFECT_TARGET_INVALID"))
  }
  const context = cycleEventContext(slot, machine.cursor.cycleLayer)
  let state = machine.state
  let events: TransitionEventSummary[] = []
  let classification = input.classification
  let violation: KernelRuntimeViolation | undefined
  let parsed: ReturnType<typeof SoldierBrainResultSchema.safeParse> | undefined
  if (input.classification === "player_violation") {
    violation = input.violation
  } else {
    parsed = SoldierBrainResultSchema.safeParse(input.value)
    if (!parsed.success) {
      classification = "player_violation"
      violation = { type: "INVALID_OUTPUT", message: parsed.error.message }
    }
  }

  let resolvedSlot = slot
  if (violation !== undefined) {
    const violationResult = applySoldierRuntimeViolation(
      state,
      soldier,
      violation,
      slot.advanced,
    )
    state = violationResult.state
    events.push(
      ...violationResult.events.map((summary) => ({
        ...summary,
        context: { ...context, ...summary.context },
      })),
    )
    const closed = closeSlot(state, slot, "RUNTIME_VIOLATION")
    state = closed.state
    resolvedSlot = closed.slot
    events.push(...closed.events)
    // A violation can stone the player's final ACTIVE Soldier. The penalty and
    // activation closure remain player-owned; canonical terminal detection is
    // then applied immediately and MATCH_ENDED is the final causal event.
    const ended = checkAndApplyMatchEnd(state)
    state = ended.state
    events.push(...ended.events)
  } else if (parsed?.success) {
    state = replaceSoldier(state, {
      ...soldier,
      soldierMemory: parsed.data.soldierMemory,
    })
    events.push(
      event(
        "ACTION_EMITTED",
        { soldierId: slot.soldierId, action: parsed.data.action },
        {
          context,
          privacy: "owner",
          privatePayload: {
            soldierId: slot.soldierId,
            ownerPlayerId: soldier.ownerPlayerId,
            soldierMemory: parsed.data.soldierMemory,
          },
        },
      ),
    )
    const action = resolveAction(state, slot.soldierId, parsed.data.action, {
      advanced: slot.advanced,
    })
    state = action.state
    events.push(
      ...action.events.map((summary) => ({
        ...summary,
        context: { ...context, ...summary.context },
      })),
    )
    const advanced = slot.advanced || action.advanced
    const actorWasActiveBeforeBackstab =
      getSoldier(state, slot.soldierId)?.status === "ACTIVE"
    const backstab = resolveBackstabBoundary(state, "cycle-end")
    state = backstab.state
    events.push(
      ...backstab.events.map((summary) => ({
        ...summary,
        context: { ...context, ...summary.context },
      })),
      event(
        "CYCLE_ENDED",
        { soldierId: slot.soldierId, cycleIndex: machine.cursor.cycleLayer },
        { context },
      ),
    )
    const actorWasBackstabbed =
      actorWasActiveBeforeBackstab &&
      getSoldier(state, slot.soldierId)?.status !== "ACTIVE"
    resolvedSlot = {
      ...slot,
      advanced,
      cycleIndex: machine.cursor.cycleLayer + 1,
    }

    if (actorWasBackstabbed) {
      const closed = closeSlot(state, resolvedSlot, "BACKSTABBED")
      state = closed.state
      resolvedSlot = closed.slot
      events.push(...closed.events)
      const ended = checkAndApplyMatchEnd(state)
      state = ended.state
      events.push(...ended.events)
    } else {
      const ended = checkAndApplyMatchEnd(state)
      state = ended.state
      events.push(...ended.events)
      if (state.outcome !== undefined) {
        resolvedSlot = {
          ...resolvedSlot,
          ended: true,
          terminalReason: "MATCH_ENDED",
        }
      } else {
        const terminalReason =
          action.terminalReason ??
          (resolvedSlot.cycleIndex >= MAX_ACTIVATION_CYCLES
            ? "CYCLE_EXHAUSTED"
            : undefined)
        if (terminalReason !== undefined) {
          const closed = closeSlot(state, resolvedSlot, terminalReason)
          state = closed.state
          resolvedSlot = closed.slot
          events.push(...closed.events)
          const afterClosure = checkAndApplyMatchEnd(state)
          state = afterClosure.state
          events.push(...afterClosure.events)
        }
      }
    }
  } else {
    return fail(machine, integrityFailure("KERNEL_RUNTIME_RESULT_INVALID"))
  }

  const slots = machine.slots.map((candidate, index) =>
    index === machine.cursor.slotIndex ? resolvedSlot : candidate,
  )
  const base: MatchMachine = {
    ...machine,
    state,
    pendingEffect: undefined,
    consumedRequestIds: appendKernelRequestIdHistory(
      machine.consumedRequestIds,
      input.requestId,
    ),
    slots,
  }
  const after =
    state.outcome === undefined
      ? afterSlot(base, state, slots)
      : withCursor(base, { stage: "completed" })
  return finishTransition(
    machine,
    after,
    "SOLDIER_RESPONSE_RESOLVED",
    classification,
    events,
  )
}

const advanceContraction = (machine: MatchMachine): KernelStepResult => {
  const contraction = resolveContraction(machine.state)
  let after: MatchMachine
  if (contraction.state.outcome !== undefined) {
    after = withCursor(
      { ...machine, state: contraction.state },
      { stage: "completed" },
    )
  } else {
    const phasesRun = machine.phasesRun + 1
    const state = advanceRoundState(contraction.state)
    after = withCursor(
      { ...machine, state, phasesRun },
      {
        stage: phasesRun >= machine.maxPhases ? "max_phases" : "round_start",
        phaseNumber: state.phaseNumber,
        roundNumber: state.roundNumber,
        cycleLayer: 0,
        slotIndex: 0,
      },
    )
  }
  return finishTransition(
    machine,
    after,
    "CONTRACTION_RESOLVED",
    "success",
    contraction.events,
  )
}

const advanceMaxPhases = (machine: MatchMachine): KernelStepResult => {
  const state = applyMatchOutcome(machine.state, {
    type: "FAILED",
    reason: "MAX_PHASES_EXCEEDED",
  })
  return finishTransition(
    machine,
    withCursor({ ...machine, state }, { stage: "completed" }),
    "MAX_PHASES_EXCEEDED",
    "success",
    [event("MATCH_ENDED", state.outcome)],
  )
}

export const stepCandidateMatch = (
  machine: MatchMachine,
  input: KernelInput,
): KernelStepResult => {
  const machineFailure = validateMachine(machine)
  if (machineFailure !== undefined) return fail(machine, machineFailure)
  const inputFailure = validateKernelInput(machine, input)
  if (inputFailure !== undefined) return fail(machine, inputFailure)

  if (input.kind === "runtime_resume") {
    if (input.classification === "system_failure") {
      return fail(machine, {
        classification: "system_failure",
        category: "RUNTIME_SYSTEM_FAILURE",
        ownership: "runtime_system",
        code: input.failure.code,
        retryable: input.failure.retryable,
      })
    }
    if (machine.cursor.stage === "select_bottom") {
      return resolveSelection(machine, input, "bottom")
    }
    if (machine.cursor.stage === "select_top") {
      return resolveSelection(machine, input, "top")
    }
    if (machine.cursor.stage === "soldier_effect") {
      return resolveSoldierEffect(machine, input)
    }
    return fail(machine, integrityFailure("KERNEL_RESUME_STAGE_INVALID"))
  }

  switch (machine.cursor.stage) {
    case "match_start": {
      const after = withCursor(machine, {
        stage: machine.maxPhases === 0 ? "max_phases" : "round_start",
      })
      return finishTransition(machine, after, "MATCH_STARTED", "success", [
        event("MATCH_STARTED", {
          matchId: machine.state.matchId,
          seed: machine.state.seed,
        }),
      ])
    }
    case "round_start":
      return finishTransition(
        machine,
        withCursor(machine, { stage: "select_bottom" }),
        "ROUND_STARTED",
        "success",
        [event("ROUND_STARTED", { roundNumber: machine.state.roundNumber })],
      )
    case "select_bottom":
      return yieldSelection(machine, machine.state.players[0].id)
    case "select_top":
      return yieldSelection(machine, machine.state.players[1].id)
    case "prepare_slots": {
      if (
        machine.executionMode !== "activation" ||
        machine.slots.length !== 1
      ) {
        return fail(machine, integrityFailure("KERNEL_STAGE_UNREACHABLE"))
      }
      return finishTransition(
        machine,
        withCursor(machine, {
          stage: "cycle_slot_start",
          cycleLayer: 0,
          slotIndex: 0,
        }),
        "ACTIVATION_STARTED",
        "success",
        [activationStartedEvent(machine.slots[0]!)],
      )
    }
    case "cycle_slot_start":
      return advanceCycleStart(machine)
    case "soldier_observation":
      return advanceObservation(machine)
    case "soldier_effect":
      return yieldSoldierEffect(machine)
    case "contraction":
      return advanceContraction(machine)
    case "max_phases":
      return advanceMaxPhases(machine)
    case "completed":
      return fail(machine, integrityFailure("KERNEL_ALREADY_COMPLETED"))
    case "cycle_slot_finish":
    case "round_finish":
      return fail(machine, integrityFailure("KERNEL_STAGE_UNREACHABLE"))
  }
}
