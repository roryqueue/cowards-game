import {
  ROUND_ACTIVATION_COUNTS,
  type ActivationOrder,
  type PlayerId,
} from "@cowards/spec"
import {
  event,
  type ActivationCount,
  type ActivationSlotState,
  type GameState,
  type RoundNumber,
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

const activationEventContext = (slot: ActivationSlotState) => ({
  activationId: slot.activationId,
  activationIndex: slot.activationIndex,
  actingPlayerId: slot.actingPlayerId,
  soldierId: slot.soldierId,
})

export const activationStartedEvent = (slot: ActivationSlotState) =>
  event(
    "ACTIVATION_STARTED",
    { soldierId: slot.soldierId },
    { context: activationEventContext(slot) },
  )
