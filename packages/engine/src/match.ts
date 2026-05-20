import {
  MAX_ACTIVATION_CYCLES,
  ROUND_ACTIVATION_COUNTS,
  type PlayerId,
} from "@cowards/spec"
import {
  activationStartedEvent,
  createActivationSlots,
  resolveActivationCycle,
  resolveActivationSelection,
} from "./activation.js"
import { resolveContraction } from "./contraction.js"
import { applyMatchOutcome, checkAndApplyMatchEnd } from "./outcome.js"
import { getOpponentPlayer } from "./selectors.js"
import { createInitialGameState } from "./state.js"
import {
  event,
  type GameState,
  type RoundNumber,
  type RunMatchInput,
  type StrategyRuntime,
  type TransitionResult,
} from "./types.js"

export const getNextRoundNumber = (roundNumber: RoundNumber): RoundNumber =>
  roundNumber === 4 ? 1 : ((roundNumber + 1) as RoundNumber)

export const getInitiativeForRound = (state: GameState): PlayerId =>
  state.initiativePlayerId

export const advanceRound = (state: GameState): GameState => {
  const nextRoundNumber = getNextRoundNumber(state.roundNumber)
  const nextInitiative = getOpponentPlayer(state, state.initiativePlayerId).id
  return {
    ...state,
    roundNumber: nextRoundNumber,
    activationCount: ROUND_ACTIVATION_COUNTS[nextRoundNumber],
    initiativePlayerId: nextInitiative,
  }
}

export const resolveRound = (
  state: GameState,
  runtime: StrategyRuntime,
): TransitionResult => {
  let current = state
  const events = [event("ROUND_STARTED", { roundNumber: state.roundNumber })]
  const firstPlayerId = getInitiativeForRound(current)
  const secondPlayerId = getOpponentPlayer(current, firstPlayerId).id
  const bottomSelection = resolveActivationSelection(
    current,
    runtime,
    current.players[0].id,
  )
  current = bottomSelection.state.state
  events.push(...bottomSelection.events)
  const topSelection = resolveActivationSelection(
    current,
    runtime,
    current.players[1].id,
  )
  current = topSelection.state.state
  events.push(...topSelection.events)

  const slots = createActivationSlots(
    current,
    new Map([
      [current.players[0].id, bottomSelection.state.orders],
      [current.players[1].id, topSelection.state.orders],
    ]),
    firstPlayerId,
    secondPlayerId,
  )
  events.push(...slots.map(activationStartedEvent))

  for (
    let cycleLayer = 0;
    cycleLayer < MAX_ACTIVATION_CYCLES && !current.outcome;
    cycleLayer += 1
  ) {
    for (const [slotIndex, slot] of slots.entries()) {
      if (current.outcome) {
        break
      }
      const resolved = resolveActivationCycle(
        current,
        runtime,
        slot,
        cycleLayer,
      )
      current = resolved.state
      slots[slotIndex] = resolved.slot
      events.push(...resolved.events)
    }
  }

  return { state: current, events }
}

export const runMatch = (input: RunMatchInput): TransitionResult => {
  let state = createInitialGameState(input)
  let events = [
    event("MATCH_STARTED", { matchId: state.matchId, seed: state.seed }),
  ]
  let phasesRun = 0

  while (!state.outcome && phasesRun < (input.maxPhases ?? 100)) {
    for (const roundNumber of [1, 2, 3, 4] as const) {
      if (state.outcome) {
        break
      }
      state = {
        ...state,
        roundNumber,
        activationCount: ROUND_ACTIVATION_COUNTS[roundNumber],
      }
      const round = resolveRound(state, input.runtime)
      state = round.state
      events.push(...round.events)
      const ended = checkAndApplyMatchEnd(state)
      state = ended.state
      events.push(...ended.events)
      if (!state.outcome && roundNumber < 4) {
        state = advanceRound(state)
      }
    }
    if (!state.outcome) {
      const contraction = resolveContraction(state)
      state = contraction.state
      events.push(...contraction.events)
      if (!state.outcome) {
        state = advanceRound(state)
        phasesRun += 1
      }
    }
  }

  if (!state.outcome) {
    state = applyMatchOutcome(state, {
      type: "FAILED",
      reason: "MAX_PHASES_EXCEEDED",
    })
    events.push(event("MATCH_ENDED", state.outcome))
  }

  events = events.map((summary, sequence) => ({ ...summary, sequence }))
  return { state, events }
}
