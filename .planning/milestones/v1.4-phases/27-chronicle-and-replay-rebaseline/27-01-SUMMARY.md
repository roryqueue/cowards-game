# Phase 27 Summary

## Completed

- Added `ACTIVATION_SKIPPED`, `ACTIVATION_ENDED`, `CYCLE_STARTED`, and
  `CYCLE_ENDED` to Chronicle event schemas and types.
- Bumped compatibility versions to `cowards-rules-v1.4`, engine `0.1.4`,
  Chronicle `chronicle-v1.4`, and Strategy Revision `0.1.4`.
- Updated `buildChronicleFromMatch` to consume engine `resolveRound` output.
- Updated replay grammar, validation, reconstruction, snapshot boundary checks,
  and web labels for the selected-slot/Cycle lifecycle.
- Rebased active replay, persistence, test-utils, and web fixtures on
  `chronicle-v1.4`.

## Notes

- Default replay validation rejects `chronicle-v1` as incompatible.
- Lifecycle events intentionally do not mutate replay board state.

