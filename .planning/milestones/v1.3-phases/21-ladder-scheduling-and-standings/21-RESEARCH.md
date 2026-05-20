# Phase 21 Research: Ladder Scheduling and Standings

## Findings

- Existing MatchSet, Match, worker, Chronicle, replay, and scoring infrastructure can serve ladder scheduling without duplicating game execution.
- Scheduling must use stable entry-derived ordering, not database row order or wall-clock timing.
- Counted standings should be recomputable from MatchSets, scoring, replay evidence, and governance state.

## Decision

Generate deterministic round-robin pods from active entries and aggregate only counted, complete, replay-backed MatchSets.

