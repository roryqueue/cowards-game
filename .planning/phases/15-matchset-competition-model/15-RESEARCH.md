# Phase 15: MatchSet Competition Model - Research

**Date:** 2026-05-19
**Status:** Complete

## Findings

- Current MatchSet code supports two-revision preset matrix generation and mirrored sides.
- Current scoring ranks by wins, surviving Soldiers, survival turns, and revision id. v1.2 needs explicit points and public tie-breaker evidence.
- Existing `match_sets.matrix` JSON and `match_set_matches.matrix_index` are good foundations for deterministic public evidence.
- Entrant snapshots should be persisted separately or inside a versioned competition payload so result pages do not depend on mutable User/Strategy fields.

## Implementation Direction

1. Add versioned competition preset/scoring constants.
2. Add entrant snapshot type and persistence.
3. Generate pairwise all-vs-all matrices for 2-8 entrants.
4. Extend scoring outputs with points, penalties, and tie-breaker fields.

