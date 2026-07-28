import { CURRENT_SEMANTIC_AUTHORITY_KEY } from "@cowards/spec"
import {
  createCandidateInitialGameState,
  createCandidateInitialGameStateV119,
  getInitialInitiativePlayerId,
} from "./kernel/create-initial-state.js"
import type { CreateInitialGameStateInput, GameState } from "./types.js"

export { getInitialInitiativePlayerId }

export const createInitialGameState = (
  input: CreateInitialGameStateInput,
): GameState => {
  const initialInitiativePlayerId = getInitialInitiativePlayerId(
    input.seed,
    input.bottomPlayerId,
    input.topPlayerId,
  )
  const created =
    String(CURRENT_SEMANTIC_AUTHORITY_KEY) === "runtime-v1.19"
      ? createCandidateInitialGameStateV119({
          ...input,
          initialInitiativePlayerId,
        })
      : createCandidateInitialGameState(input)
  if (!created.ok) {
    throw new Error("Canonical initial GameState admission failed.")
  }
  return created.state
}
