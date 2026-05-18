# Plan 09-05 Summary: Integrated Validation Gate and Provable Board Contradictions

**Status:** Complete
**Completed:** 2026-05-18

## Implemented

- Wired `validateChronicleGrammar`, `validateSnapshotBoundaries`, and `validateChronicleTransitions` into `validateChronicle` after shape/version/order/required/snapshot checks and before hash validation.
- Extracted replay state application, snapshot cloning/comparison, and bounded boundary-to-boundary transition validation into `packages/replay/src/replay-transition.ts`.
- Kept `createReplay` on the same pure event application path used by validation, with no Strategy execution, persistence reads, filesystem access, network access, or second engine simulation.
- Added transition contradiction tests for `MOVE_ADVANCED`, `PUSH_RESOLVED`, `SOLDIER_FELL`, `SOLDIER_STONED`, `CONTRACTION_RESOLVED`, and `MATCH_ENDED`, plus an insufficient-boundary case that remains accepted.
- Added integrated negative validation coverage for corrupted event order, grammar failure, snapshot boundary failure, impossible snapshot transition, and version incompatibility.
- Extended canonical replay scenario legality diagnostics so validation failures use `[Chronicle validation]` and replay-state failures use `[replay reconstruction]`.

## Allowed Deviation

- Patched `packages/replay/src/build.ts` minimally because strict snapshot boundary grammar exposed the known Plan 09-04 mismatch: generated `CONTRACTION` snapshots were attached after contraction fallout instead of to `CONTRACTION_RESOLVED`.
- The patch now records the `CONTRACTION` snapshot at the emitted `CONTRACTION_RESOLVED` sequence while preserving the existing generated board state. Transition application treats `CONTRACTION_RESOLVED` as applying bounds, terrain pruning, and outside-Soldier fallout, so later `SOLDIER_FELL` events remain idempotent replay details.

## Changed Files

- `packages/replay/src/build.ts`
- `packages/replay/src/index.ts`
- `packages/replay/src/reconstruct.ts`
- `packages/replay/src/reconstruct.test.ts`
- `packages/replay/src/replay-transition.ts`
- `packages/replay/src/replay-transition.test.ts`
- `packages/replay/src/validate.ts`
- `packages/replay/src/validate.test.ts`
- `packages/test-utils/src/replay-scenarios.legality.test.ts`
- `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-05-PLAN.md`
- `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-05-SUMMARY.md`

## Verification

- `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts snapshot-boundaries.test.ts replay-transition.test.ts reconstruct.test.ts` - passed.
- `pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts` - passed.
- `pnpm --filter @cowards/replay typecheck` - passed.
- `pnpm --filter @cowards/test-utils typecheck` - passed.

## Blockers

- None.
