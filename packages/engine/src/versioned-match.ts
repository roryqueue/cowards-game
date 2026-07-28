import {
  runCandidateMatchV117,
  runCandidateMatchV119,
} from "./kernel/driver.js"
import type { CandidateExecution } from "./kernel/types.js"
import { MatchExecutionFailure, type CanonicalMatchResult } from "./match.js"
import type { CreateInitialGameStateInputV119, RunMatchInput } from "./types.js"

export interface VersionedMatchInputV119 extends RunMatchInput {
  readonly initialInitiativePlayerId: CreateInitialGameStateInputV119["initialInitiativePlayerId"]
}

const completedMatchResult = (
  execution: CandidateExecution,
): CanonicalMatchResult => {
  if (execution.kind !== "completed") {
    throw new MatchExecutionFailure(execution.failure, execution.unchangedState)
  }
  return {
    state: execution.result.state,
    events: [...execution.result.events],
    execution,
  }
}

/** Immutable v1.17 facade over the sole transition-kernel driver. */
export const runVersionedMatchV117 = (
  input: RunMatchInput,
): CanonicalMatchResult => completedMatchResult(runCandidateMatchV117(input))

/** Explicit v1.19 facade preserving authoritative initial initiative. */
export const runVersionedMatchV119 = (
  input: VersionedMatchInputV119,
): CanonicalMatchResult => completedMatchResult(runCandidateMatchV119(input))
