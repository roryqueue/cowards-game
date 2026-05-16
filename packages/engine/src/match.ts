import {
  ROUND_ACTIVATION_COUNTS,
  type MatchOutcome,
  type PlayerId,
} from "@cowards/spec"
import {
  getRoundPlayerOrder,
  resolveActivation,
  resolveActivationSelection,
} from "./activation.js"
import { resolveContraction } from "./contraction.js"
import { countActiveByPlayer, getOpponentPlayer } from "./selectors.js"
import { createInitialGameState } from "./state.js"
import {
  event,
  type GameState,
  type RoundNumber,
  type RunMatchInput,
  type StrategyRuntime,
  type TransitionResult,
} from "./types.js"

export const checkImmediateMatchEnd = (
  state: GameState,
): MatchOutcome | undefined => {
  const counts = countActiveByPlayer(state)
  const [first, second] = state.players
  const firstActive = counts.get(first.id) ?? 0
  const secondActive = counts.get(second.id) ?? 0

  if (firstActive === 0 && secondActive === 0) {
    return { type: "DRAW" }
  }
  if (firstActive === 0) {
    return { type: "WIN", winnerPlayerId: second.id }
  }
  if (secondActive === 0) {
    return { type: "WIN", winnerPlayerId: first.id }
  }
  return undefined
}

export const applyMatchOutcome = (
  state: GameState,
  outcome: MatchOutcome,
): GameState => ({
  ...state,
  phase: "COMPLETE",
  outcome,
})

export const checkAndApplyMatchEnd = (state: GameState): TransitionResult => {
  const outcome = checkImmediateMatchEnd(state)
  if (!outcome) {
    return { state, events: [] }
  }
  return {
    state: applyMatchOutcome(state, outcome),
    events: [event("MATCH_ENDED", outcome)],
  }
}

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

  const queues = new Map<string, typeof bottomSelection.state.orders>([
    [current.players[0].id, [...bottomSelection.state.orders]],
    [current.players[1].id, [...topSelection.state.orders]],
  ])
  const order = getRoundPlayerOrder(
    firstPlayerId,
    secondPlayerId,
    current.activationCount,
  )

  for (const playerId of order) {
    if (current.outcome) {
      break
    }
    const activationOrder = queues.get(playerId)?.shift()
    if (!activationOrder) {
      continue
    }
    const resolved = resolveActivation(
      current,
      runtime,
      activationOrder.soldierId,
      activationOrder.objective,
    )
    current = resolved.state
    events.push(...resolved.events)
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
