import type {
  CreateInitialGameStateInput,
  GameState,
  TransitionResult,
} from "@cowards/engine"
import {
  type Chronicle,
  type ChronicleValidationError,
} from "@cowards/spec"

type InitialMatchInput = CreateInitialGameStateInput

export type BuildChronicleFromResultResult =
  | { ok: true; chronicle: Chronicle; finalState: GameState }
  | { ok: false; errors: ChronicleValidationError[] }

export interface BuildChronicleFromResultInput {
  input: InitialMatchInput
  result: TransitionResult
}

const missingIntermediateSnapshotWarnings = (): ChronicleValidationError[] => [
  {
    code: "SNAPSHOT_MISSING",
    message:
      "Existing match result only included final state; canonical recording requires transition boundaries from the Match kernel.",
  },
]

export const buildChronicleFromResult = ({
  input: _input,
  result: _result,
}: BuildChronicleFromResultInput): BuildChronicleFromResultResult => {
  return {
    ok: false,
    errors: missingIntermediateSnapshotWarnings(),
  }
}
