---
phase: 252-counted-state-classifier-and-standings-recompute
plan: 02
subsystem: persistence-standings
tags: [standings, recompute, determinism, season, evidence]
requires: [252-01]
provides:
  - Pure deterministic Season standings reducer
  - Counted and excluded evidence summaries with stable links
  - Mutation-free Season-scoped public ladder reads
affects: [252-03, 253, 254, 255]
requirements-completed: [RESULT-03, RESULT-04, RESULT-05, RESULT-06]
completed: 2026-07-11
---

# Phase 252 Plan 02 Summary

## Accomplishments

- Replaced ad hoc standings aggregation with a pure Season reducer that is byte-stable across repeated and permuted input.
- Preserved the existing points, wins, surviving Soldiers, survival turns, and Strategy Revision tie-break order.
- Limited score contributions to canonical `counted` MatchSets while retaining counted/excluded totals, evidence availability, and deduplicated result/replay links for every entrant.
- Removed `refreshMatchSetStatus` from public Season reads and retained explicit `ladder_season_id` query scoping.
- Updated public player result summaries to use the same canonical classifier instead of trusting stored status.

## Commit

- `89601a2` - Add deterministic standings recompute and mutation-free ladder reads.

## Verification

- Focused standings and ladder tests passed, 47 tests.
- Exclusion coverage includes pending, retrying, degraded, non-counted, non-competitive, under-review, disputed, invalid, and invalidated states.
- Persistence typecheck passed.

## Boundaries

No score values, tie-break rules, deterministic game rules, Strategy execution, runtime ownership, or durable rating policy changed.
