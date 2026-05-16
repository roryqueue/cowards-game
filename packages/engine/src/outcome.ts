import type { MatchOutcome } from "@cowards/spec"
import { countActiveByPlayer } from "./selectors.js"
import { event, type GameState, type TransitionResult } from "./types.js"

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
  if (state.outcome) {
    return { state, events: [] }
  }

  const outcome = checkImmediateMatchEnd(state)
  if (!outcome) {
    return { state, events: [] }
  }
  return {
    state: applyMatchOutcome(state, outcome),
    events: [event("MATCH_ENDED", outcome)],
  }
}
