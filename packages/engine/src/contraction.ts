import type { BoardBounds, MatchOutcome } from "@cowards/spec"
import {
  countActiveByPlayer,
  isWithinBounds,
  replaceSoldiers,
} from "./selectors.js"
import {
  applyMatchOutcome,
  checkAndApplyMatchEnd,
  checkImmediateMatchEnd,
} from "./match.js"
import { event, type GameState, type TransitionResult } from "./types.js"

export const getContractedBounds = (bounds: BoardBounds): BoardBounds => ({
  minX: bounds.minX + 1,
  maxX: bounds.maxX - 1,
  minY: bounds.minY + 1,
  maxY: bounds.maxY - 1,
})

export const checkFinalTwoByTwoResolution = (
  state: GameState,
): MatchOutcome | undefined => {
  const width = state.bounds.maxX - state.bounds.minX + 1
  const height = state.bounds.maxY - state.bounds.minY + 1
  if (width !== 2 || height !== 2) {
    return undefined
  }
  const counts = countActiveByPlayer(state)
  const [first, second] = state.players
  const firstActive = counts.get(first.id) ?? 0
  const secondActive = counts.get(second.id) ?? 0
  if (firstActive === secondActive) {
    return { type: "DRAW" }
  }
  return {
    type: "WIN",
    winnerPlayerId: firstActive > secondActive ? first.id : second.id,
  }
}

export const resolveContraction = (state: GameState): TransitionResult => {
  const before = checkAndApplyMatchEnd(state)
  if (before.state.outcome) {
    return before
  }

  const bounds = getContractedBounds(state.bounds)
  const fallen = state.soldiers
    .filter(
      (soldier) =>
        soldier.status !== "FALLEN" &&
        soldier.position !== null &&
        !isWithinBounds(soldier.position, bounds),
    )
    .map((soldier) => ({
      ...soldier,
      status: "FALLEN" as const,
      position: null,
    }))

  let current: GameState = {
    ...state,
    phase: "CONTRACTION",
    bounds,
    terrainStones: state.terrainStones.filter((terrainStone) =>
      isWithinBounds(terrainStone, bounds),
    ),
  }
  current = replaceSoldiers(current, fallen)
  const events = [
    event("CONTRACTION_RESOLVED", { bounds }),
    ...fallen.map((soldier) =>
      event("SOLDIER_FELL", {
        soldierId: soldier.id,
        reason: "BOARD_CONTRACTION",
      }),
    ),
  ]

  const immediate = checkImmediateMatchEnd(current)
  const final = immediate ?? checkFinalTwoByTwoResolution(current)
  if (final) {
    current = applyMatchOutcome(current, final)
    events.push(event("MATCH_ENDED", final))
  } else {
    current = {
      ...current,
      phase: "ROUND",
      phaseNumber: current.phaseNumber + 1,
    }
  }

  return { state: current, events }
}
