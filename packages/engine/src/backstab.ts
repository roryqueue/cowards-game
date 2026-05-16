import type { SoldierId } from "@cowards/spec"
import {
  getBehindSquare,
  getOccupyingSoldier,
  getSoldier,
  replaceSoldiers,
} from "./selectors.js"
import {
  event,
  type BackstabBoundary,
  type BackstabPair,
  type GameState,
  type TransitionResult,
} from "./types.js"

export const findBackstabPairs = (state: GameState): BackstabPair[] => {
  const pairs: BackstabPair[] = []
  const activeSoldiers = state.soldiers.filter(
    (soldier) => soldier.status === "ACTIVE" && soldier.position !== null,
  )

  for (const victim of activeSoldiers) {
    const behindSquare = getBehindSquare(victim)
    if (!behindSquare) {
      continue
    }
    const attacker = getOccupyingSoldier(state, behindSquare)
    if (
      attacker?.status === "ACTIVE" &&
      attacker.ownerPlayerId !== victim.ownerPlayerId
    ) {
      pairs.push({ attackerId: attacker.id, victimId: victim.id })
    }
  }
  return pairs
}

export const resolveBackstabBoundary = (
  state: GameState,
  boundary: BackstabBoundary,
): TransitionResult => {
  const pairs = findBackstabPairs(state)
  if (pairs.length === 0) {
    return { state, events: [] }
  }

  const victimIds = new Set<SoldierId>(pairs.map((pair) => pair.victimId))
  const victims = [...victimIds]
    .map((victimId) => getSoldier(state, victimId))
    .filter((soldier) => soldier !== undefined)
    .map((soldier) => ({ ...soldier, status: "STONE" as const }))

  return {
    state: replaceSoldiers(state, victims),
    events: [
      event("BACKSTAB_RESOLVED", { boundary, pairs }),
      ...victims.map((victim) =>
        event("SOLDIER_STONED", { soldierId: victim.id, reason: "BACKSTAB" }),
      ),
    ],
  }
}
