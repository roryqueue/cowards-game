import type { KernelRestrictedFailure, CandidateExecution } from "./kernel/types.js"
import { MATCH_KERNEL } from "./kernel/driver.js"
import type { GameState, RunMatchInput, TransitionResult } from "./types.js"

type CompletedMatchExecution = Extract<CandidateExecution, { kind: "completed" }>

export interface CanonicalMatchResult extends TransitionResult {
  readonly execution: CompletedMatchExecution
}

/**
 * A canonical Match can fail before it has a trustworthy gameplay result.
 * The unchanged prestate is retained only for restricted callers; public and
 * service responses project the bounded classification instead.
 */
export class MatchExecutionFailure extends Error {
  readonly failure: KernelRestrictedFailure
  readonly unchangedState: GameState | null

  constructor(
    failure: KernelRestrictedFailure,
    unchangedState: GameState | null,
  ) {
    super("Canonical Match execution failed.")
    this.name = "MatchExecutionFailure"
    this.failure = failure
    this.unchangedState = unchangedState
  }
}

/** Current public facade over the sole transition-kernel driver. */
export const runMatch = (input: RunMatchInput): CanonicalMatchResult => {
  const execution = MATCH_KERNEL.runMatch(input)
  if (execution.kind !== "completed") {
    throw new MatchExecutionFailure(execution.failure, execution.unchangedState)
  }
  return {
    state: execution.result.state,
    events: [...execution.result.events],
    execution,
  }
}
