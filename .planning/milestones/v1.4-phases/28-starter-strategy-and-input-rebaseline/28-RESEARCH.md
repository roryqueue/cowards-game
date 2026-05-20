# Phase 28 Research: Starter Strategy and Input Rebaseline

## Findings

- `packages/persistence/src/starter-strategies.ts` kept stable starter IDs but
  still labeled every starter as `v1`.
- All ten starter sources used a hard `cycleIndex >= 4` stabilization guard.
  Under v1.4 Cycle interleaving, that prematurely stops movement in a 12-Cycle
  slot and weakens starter evidence.
- Starter lineage is copied through `buildStarterStrategyRevision`,
  account-fork creation, Strategy cards, and player profiles, so bumping starter
  versions updates downstream provenance without changing starter IDs.
- Workshop tests already validate starter uniqueness and source validity, but
  did not execute all starters through a real interleaved Match path.

## Implementation Risks

- Updating starter behavior must keep all sources valid under runtime-js schema
  validation.
- Existing starter IDs should stay stable while source hashes and lineage move
  to `v1.4`.
- The behavior gauntlet must prove real execution without making the fast suite
  impractically slow.

