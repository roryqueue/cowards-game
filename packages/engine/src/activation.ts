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
import { checkAndApplyMatchEnd } from "./match.js"
import { resolveAction } from "./movement.js"
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
  type GameState,
  type RoundNumber,
  type StrategyRuntime,
  type TransitionResult,
} from "./types.js"

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

const applyRuntimeViolation = (
  state: GameState,
  soldier: Soldier,
  violation: RuntimeViolation,
  advanced: boolean,
): TransitionResult => {
  const events = [event("RUNTIME_VIOLATION", violation)]
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
      events: [event("RUNTIME_VIOLATION", result.violation)],
    }
  }

  const parsed = StrategyResultSchema.safeParse(result.value)
  if (!parsed.success) {
    return {
      state: { state, orders: [] },
      events: [
        event("RUNTIME_VIOLATION", {
          type: "INVALID_OUTPUT",
          message: parsed.error.message,
        }),
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
    events: [event("STRATEGY_EVALUATED", { playerId })],
  }
}

export const resolveActivation = (
  state: GameState,
  runtime: StrategyRuntime,
  soldierId: string,
  objective?: JsonValue,
): TransitionResult => {
  let current = state
  const events = [event("ACTIVATION_STARTED", { soldierId })]
  const startBackstab = resolveBackstabBoundary(current, "activation-start")
  current = startBackstab.state
  events.push(...startBackstab.events)
  const startEnd = checkAndApplyMatchEnd(current)
  current = startEnd.state
  events.push(...startEnd.events)
  if (current.outcome) {
    return { state: current, events }
  }

  let soldier = getSoldier(current, soldierId)
  if (!soldier || soldier.status !== "ACTIVE") {
    return { state: current, events }
  }

  let advanced = false
  for (
    let cycleIndex = 0;
    cycleIndex < MAX_ACTIVATION_CYCLES;
    cycleIndex += 1
  ) {
    soldier = getSoldier(current, soldierId)
    if (!soldier || soldier.status !== "ACTIVE") {
      break
    }
    const input = createSoldierBrainInput(
      current,
      soldierId,
      cycleIndex,
      objective,
    )
    events.push(event("AWARENESS_GRID_OBSERVED", { soldierId, cycleIndex }))
    const runtimeResult = runtime.runSoldierBrain(input)
    if (!runtimeResult.ok) {
      const violationResult = applyRuntimeViolation(
        current,
        soldier,
        runtimeResult.violation,
        advanced,
      )
      current = violationResult.state
      events.push(...violationResult.events)
      break
    }
    const parsed = SoldierBrainResultSchema.safeParse(runtimeResult.value)
    if (!parsed.success) {
      const violationResult = applyRuntimeViolation(
        current,
        soldier,
        { type: "INVALID_OUTPUT", message: parsed.error.message },
        advanced,
      )
      current = violationResult.state
      events.push(...violationResult.events)
      break
    }
    current = replaceSoldier(current, {
      ...soldier,
      soldierMemory: parsed.data.soldierMemory,
    })
    events.push(
      event("ACTION_EMITTED", { soldierId, action: parsed.data.action }),
    )
    const actionResult = resolveAction(current, soldierId, parsed.data.action, {
      advanced,
    })
    current = actionResult.state
    events.push(...actionResult.events)
    advanced = advanced || actionResult.advanced
    if (actionResult.terminalReason) {
      break
    }
  }

  soldier = getSoldier(current, soldierId)
  if (soldier?.status === "ACTIVE" && !advanced) {
    current = replaceSoldier(current, { ...soldier, status: "STONE" })
    events.push(event("SOLDIER_STONED", { soldierId }))
  }

  const endBackstab = resolveBackstabBoundary(current, "activation-end")
  current = endBackstab.state
  events.push(...endBackstab.events)
  const end = checkAndApplyMatchEnd(current)
  current = end.state
  events.push(...end.events)
  return { state: current, events }
}
