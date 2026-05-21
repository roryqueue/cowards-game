# Phase 35: Completed Demo Tournament - Plan

## Research Summary

- The existing ladder page can display a completed local tournament.
- A direct 8-entrant smoke round robin is fast enough for local evidence and avoids excessive worker runtime.

## Implemented Plan

1. Seed the eight Advanced Strategies most likely to win a Match.
2. Generate one 8-entrant Advanced-only tournament MatchSet.
3. Complete all matches with worker-backed execution and mark complete replay-backed evidence counted.
4. Tune the Advanced set if standings are degenerate.

## Verification

- Tournament page: `/ladder/v1-5-demo`
- Tournament MatchSet: `/matchsets/match-set%3Av1-5%3Atournament%3Aadvanced-eight`
