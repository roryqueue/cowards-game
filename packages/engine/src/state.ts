import {
  createCandidateInitialGameState,
  getInitialInitiativePlayerId,
} from "./kernel/create-initial-state.js"
import type { CreateInitialGameStateInput, GameState } from "./types.js"

export { getInitialInitiativePlayerId }

export const createInitialGameState = (
  input: CreateInitialGameStateInput,
): GameState => {
  const created = createCandidateInitialGameState(input)
  if (!created.ok) {
    throw new Error("Canonical initial GameState admission failed.")
  }
  return created.state
}
