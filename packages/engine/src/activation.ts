import {
  MAX_ACTIVATION_CYCLES,
  ROUND_ACTIVATION_COUNTS,
  SoldierBrainResultSchema,
  StrategyResultSchema,
  type ActivationOrder,
  type JsonValue,
  type PlayerId,
  type RuntimeViolation,
  type Soldier,
} from "@cowards/spec"
import { resolveBackstabBoundary } from "./backstab.js"
import { resolveAction } from "./movement.js"
import { checkAndApplyMatchEnd } from "./outcome.js"
import {
  getActiveSoldiers,
  getPlayer,
  getSoldier,
  replaceSoldier,
} from "./selectors.js"
import {
  createSoldierBrainInput,
  createStrategyInput,
} from "./runtime-inputs.js"
import {
  event,
  type ActivationCount,
  type ActivationSelectionResult,
  type ActivationSlotState,
  type ActivationTerminalReason,
  type GameState,
  type RoundNumber,
  type StrategyRuntime,
  type TransitionResult,
} from "./types.js"

interface ActivationCycleResult {
  state: GameState
  slot: ActivationSlotState
  events: TransitionResult["events"]
}

export const getActivationCountForRound = (
  roundNumber: RoundNumber,
): ActivationCount => ROUND_ACTIVATION_COUNTS[roundNumber]

export const getRoundPlayerOrder = (
  firstPlayerId: PlayerId,
  secondPlayerId: PlayerId,
  activationCount: ActivationCount,
): PlayerId[] => {
  const order: PlayerId[] = []
  for (let index = 0; index < activationCount; index += 1) {
    if (index % 2 === 0) {
      order.push(firstPlayerId, secondPlayerId)
    } else {
      order.push(secondPlayerId, firstPlayerId)
    }
  }
  return order
}

const validOrders = (
  state: GameState,
  playerId: PlayerId,
  orders: Array<{ soldierId: string; objective?: JsonValue | undefined }>,
): ActivationOrder[] => {
  const seen = new Set<string>()
  const activeIds = new Set(
    getActiveSoldiers(state, playerId).map((soldier) => soldier.id),
  )
  const filtered: ActivationOrder[] = []
  for (const order of orders) {
    if (filtered.length >= state.activationCount) {
      break
    }
    if (seen.has(order.soldierId) || !activeIds.has(order.soldierId)) {
      continue
    }
    seen.add(order.soldierId)
    filtered.push(
      order.objective === undefined
        ? { soldierId: order.soldierId }
        : { soldierId: order.soldierId, objective: order.objective },
    )
  }
  return filtered
}

const privateJson = (value: unknown): JsonValue => value as JsonValue

const applyRuntimeViolation = (
  state: GameState,
  soldier: Soldier,
  violation: RuntimeViolation,
  advanced: boolean,
): TransitionResult => {
  const events = [
    event(
      "RUNTIME_VIOLATION",
      {
        soldierId: soldier.id,
        ownerPlayerId: soldier.ownerPlayerId,
        type: violation.type,
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
  if (advanced || soldier.status === "FALLEN") {
    return { state, events }
  }
  const stoned = { ...soldier, status: "STONE" as const }
  return {
    state: replaceSoldier(state, stoned),
    events: [...events, event("SOLDIER_STONED", { soldierId: soldier.id })],
  }
}

export const resolveActivationSelection = (
  state: GameState,
  runtime: StrategyRuntime,
  playerId: PlayerId,
): TransitionResult<ActivationSelectionResult> => {
  const player = getPlayer(state, playerId)
  if (!player) {
    throw new Error(`Player not found: ${playerId}`)
  }
  const result = runtime.selectActivations(createStrategyInput(state, playerId))
  if (!result.ok) {
    return {
      state: { state, orders: [] },
      events: [
        event(
          "RUNTIME_VIOLATION",
          { playerId, type: result.violation.type },
          {
            context: { actingPlayerId: playerId },
            privacy: "owner",
            privatePayload: privateJson({
              playerId,
              violation: result.violation,
            }),
          },
        ),
      ],
    }
  }

  const parsed = StrategyResultSchema.safeParse(result.value)
  if (!parsed.success) {
    return {
      state: { state, orders: [] },
      events: [
        event(
          "RUNTIME_VIOLATION",
          { playerId, type: "INVALID_OUTPUT" },
          {
            context: { actingPlayerId: playerId },
            privacy: "owner",
            privatePayload: privateJson({
              playerId,
              violation: {
                type: "INVALID_OUTPUT",
                message: parsed.error.message,
              },
            }),
          },
        ),
      ],
    }
  }

  const nextState: GameState = {
    ...state,
    players: state.players.map((candidate) =>
      candidate.id === playerId
        ? { ...candidate, strategyMemory: parsed.data.strategyMemory }
        : candidate,
    ) as GameState["players"],
  }

  return {
    state: {
      state: nextState,
      orders: validOrders(nextState, playerId, parsed.data.activationOrders),
    },
    events: [
      event(
        "STRATEGY_EVALUATED",
        { playerId },
        {
          context: { actingPlayerId: playerId },
          privacy: "owner",
          privatePayload: {
            playerId,
            strategyMemory: parsed.data.strategyMemory,
          },
        },
      ),
    ],
  }
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
): ActivationCycleResult => {
  let current = state
  const events: TransitionResult["events"] = []
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
    slot: {
      ...slot,
      ended: true,
      terminalReason,
    },
    events,
  }
}

export const createActivationSlots = (
  state: GameState,
  selections: ReadonlyMap<PlayerId, ActivationOrder[]>,
  firstPlayerId: PlayerId,
  secondPlayerId: PlayerId,
): ActivationSlotState[] => {
  const queues = new Map<PlayerId, ActivationOrder[]>(
    [...selections.entries()].map(([playerId, orders]) => [
      playerId,
      [...orders],
    ]),
  )
  const order = getRoundPlayerOrder(
    firstPlayerId,
    secondPlayerId,
    state.activationCount,
  )
  const slots: ActivationSlotState[] = []

  for (const playerId of order) {
    const activationOrder = queues.get(playerId)?.shift()
    if (!activationOrder) {
      continue
    }
    const activationIndex = slots.length
    slots.push({
      activationId: `${state.phaseNumber}:${state.roundNumber}:${activationIndex}`,
      activationIndex,
      actingPlayerId: playerId,
      soldierId: activationOrder.soldierId,
      objective: activationOrder.objective,
      cycleIndex: 0,
      advanced: false,
      ended: false,
    })
  }

  return slots
}

export const activationStartedEvent = (slot: ActivationSlotState) =>
  event(
    "ACTIVATION_STARTED",
    { soldierId: slot.soldierId },
    { context: activationEventContext(slot) },
  )

export const resolveActivationCycle = (
  state: GameState,
  runtime: StrategyRuntime,
  slot: ActivationSlotState,
  cycleLayer: number,
): ActivationCycleResult => {
  let current = state
  const events: TransitionResult["events"] = []

  if (slot.ended) {
    return {
      state: current,
      slot,
      events: [
        event(
          "ACTIVATION_SKIPPED",
          {
            soldierId: slot.soldierId,
            cycleIndex: cycleLayer,
            reason: slot.terminalReason ?? "ENDED",
          },
          { context: cycleEventContext(slot, cycleLayer) },
        ),
      ],
    }
  }

  let soldier = getSoldier(current, slot.soldierId)
  if (!soldier || soldier.status !== "ACTIVE") {
    const terminalReason =
      soldier?.status === "FALLEN" ? "SOLDIER_FELL" : "SOLDIER_STONED"
    return closeSlot(current, slot, terminalReason)
  }

  events.push(
    event(
      "CYCLE_STARTED",
      { soldierId: slot.soldierId, cycleIndex: cycleLayer },
      { context: cycleEventContext(slot, cycleLayer) },
    ),
  )

  const startBackstab = resolveBackstabBoundary(current, "cycle-start")
  current = startBackstab.state
  events.push(
    ...startBackstab.events.map((summary) => ({
      ...summary,
      context: { ...cycleEventContext(slot, cycleLayer), ...summary.context },
    })),
  )
  const startEnd = checkAndApplyMatchEnd(current)
  current = startEnd.state
  events.push(...startEnd.events)
  if (current.outcome) {
    return {
      state: current,
      slot: {
        ...slot,
        ended: true,
        terminalReason: "MATCH_ENDED",
      },
      events,
    }
  }

  soldier = getSoldier(current, slot.soldierId)
  if (!soldier || soldier.status !== "ACTIVE") {
    const terminalReason =
      soldier?.status === "FALLEN" ? "SOLDIER_FELL" : "SOLDIER_STONED"
    const closed = closeSlot(current, slot, terminalReason)
    return {
      state: closed.state,
      slot: closed.slot,
      events: [...events, ...closed.events],
    }
  }

  const input = createSoldierBrainInput(
    current,
    slot.soldierId,
    cycleLayer,
    slot.objective,
  )
  events.push(
    event(
      "AWARENESS_GRID_OBSERVED",
      { soldierId: slot.soldierId, cycleIndex: cycleLayer },
      {
        context: cycleEventContext(slot, cycleLayer),
        privacy: "owner",
        privatePayload: privateJson({
          soldierId: slot.soldierId,
          ownerPlayerId: soldier.ownerPlayerId,
          cycleIndex: cycleLayer,
          awarenessGrid: input.awarenessGrid,
          objectiveRef: { hasObjective: slot.objective !== undefined },
          objectivePayload: slot.objective,
        }),
      },
    ),
  )

  const runtimeResult = runtime.runSoldierBrain(input)
  if (!runtimeResult.ok) {
    const violationResult = applyRuntimeViolation(
      current,
      soldier,
      runtimeResult.violation,
      slot.advanced,
    )
    current = violationResult.state
    events.push(
      ...violationResult.events.map((summary) => ({
        ...summary,
        context: { ...cycleEventContext(slot, cycleLayer), ...summary.context },
      })),
    )
    const closed = closeSlot(current, slot, "RUNTIME_VIOLATION")
    return {
      state: closed.state,
      slot: closed.slot,
      events: [...events, ...closed.events],
    }
  }

  const parsed = SoldierBrainResultSchema.safeParse(runtimeResult.value)
  if (!parsed.success) {
    const violationResult = applyRuntimeViolation(
      current,
      soldier,
      { type: "INVALID_OUTPUT", message: parsed.error.message },
      slot.advanced,
    )
    current = violationResult.state
    events.push(
      ...violationResult.events.map((summary) => ({
        ...summary,
        context: { ...cycleEventContext(slot, cycleLayer), ...summary.context },
      })),
    )
    const closed = closeSlot(current, slot, "RUNTIME_VIOLATION")
    return {
      state: closed.state,
      slot: closed.slot,
      events: [...events, ...closed.events],
    }
  }

  current = replaceSoldier(current, {
    ...soldier,
    soldierMemory: parsed.data.soldierMemory,
  })
  events.push(
    event(
      "ACTION_EMITTED",
      { soldierId: slot.soldierId, action: parsed.data.action },
      {
        context: cycleEventContext(slot, cycleLayer),
        privacy: "owner",
        privatePayload: {
          soldierId: slot.soldierId,
          ownerPlayerId: soldier.ownerPlayerId,
          soldierMemory: parsed.data.soldierMemory,
        },
      },
    ),
  )

  const actionResult = resolveAction(
    current,
    slot.soldierId,
    parsed.data.action,
    {
      advanced: slot.advanced,
    },
  )
  current = actionResult.state
  events.push(
    ...actionResult.events.map((summary) => ({
      ...summary,
      context: { ...cycleEventContext(slot, cycleLayer), ...summary.context },
    })),
  )
  const advanced = slot.advanced || actionResult.advanced

  const endBackstab = resolveBackstabBoundary(current, "cycle-end")
  current = endBackstab.state
  events.push(
    ...endBackstab.events.map((summary) => ({
      ...summary,
      context: { ...cycleEventContext(slot, cycleLayer), ...summary.context },
    })),
  )
  events.push(
    event(
      "CYCLE_ENDED",
      { soldierId: slot.soldierId, cycleIndex: cycleLayer },
      { context: cycleEventContext(slot, cycleLayer) },
    ),
  )

  const end = checkAndApplyMatchEnd(current)
  current = end.state
  events.push(...end.events)
  if (current.outcome) {
    return {
      state: current,
      slot: {
        ...slot,
        advanced,
        cycleIndex: cycleLayer + 1,
        ended: true,
        terminalReason: "MATCH_ENDED",
      },
      events,
    }
  }

  const nextSlot = {
    ...slot,
    advanced,
    cycleIndex: cycleLayer + 1,
  }
  const terminalReason =
    actionResult.terminalReason ??
    (nextSlot.cycleIndex >= MAX_ACTIVATION_CYCLES
      ? "CYCLE_EXHAUSTED"
      : undefined)

  if (terminalReason) {
    const closed = closeSlot(current, nextSlot, terminalReason)
    return {
      state: closed.state,
      slot: closed.slot,
      events: [...events, ...closed.events],
    }
  }

  return { state: current, slot: nextSlot, events }
}

export const resolveActivation = (
  state: GameState,
  runtime: StrategyRuntime,
  soldierId: string,
  objective?: JsonValue,
): TransitionResult => {
  const soldier = getSoldier(state, soldierId)
  const slot: ActivationSlotState = {
    activationId: `${state.phaseNumber}:${state.roundNumber}:0`,
    activationIndex: 0,
    actingPlayerId: soldier?.ownerPlayerId ?? state.players[0].id,
    soldierId,
    objective,
    cycleIndex: 0,
    advanced: false,
    ended: false,
  }
  let current = state
  let currentSlot = slot
  const events = [activationStartedEvent(slot)]

  for (
    let cycleLayer = 0;
    cycleLayer < MAX_ACTIVATION_CYCLES;
    cycleLayer += 1
  ) {
    const resolved = resolveActivationCycle(
      current,
      runtime,
      currentSlot,
      cycleLayer,
    )
    current = resolved.state
    currentSlot = resolved.slot
    events.push(...resolved.events)
    if (current.outcome || currentSlot.ended) {
      break
    }
  }

  return { state: current, events }
}
