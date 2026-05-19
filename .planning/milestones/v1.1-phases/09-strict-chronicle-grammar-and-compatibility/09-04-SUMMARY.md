# Plan 09-04 Summary: Snapshot Boundary Grammar

**Status:** Complete
**Date:** 2026-05-18

## Implemented

- Added `packages/replay/src/snapshot-boundaries.ts` exporting `validateSnapshotBoundaries(chronicle)`.
- Enforced snapshot kind/event boundary rules:
  - `MATCH_START` -> `MATCH_STARTED`
  - `ROUND_START` -> `ROUND_STARTED`
  - `ACTIVATION_START` -> `ACTIVATION_STARTED`
  - `CONTRACTION` -> `CONTRACTION_RESOLVED`
  - `MATCH_END` and `TERMINAL` -> `MATCH_ENDED`
- Computed `ROUND_END` and `ACTIVATION_END` boundary sequences from Chronicle event context without Strategy execution or a second engine.
- Returned stable `SNAPSHOT_MISSING`, `SNAPSHOT_BOUNDARY_INVALID`, and `CONTEXT_MISMATCH` errors for missing references, incompatible boundaries, wrong end-boundary placement, context contradictions, and terminal outcome contradictions.
- Added `packages/replay/src/snapshot-boundaries.test.ts` with replay-built Chronicle fixtures and targeted snapshot mutations.

## Verification

- Passed: `pnpm --filter @cowards/replay test -- snapshot-boundaries.test.ts`
- Passed: isolated compile check for owned files:
  `pnpm exec tsc --ignoreConfig --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --strict --exactOptionalPropertyTypes --skipLibCheck packages/replay/src/snapshot-boundaries.ts packages/replay/src/snapshot-boundaries.test.ts`
- Blocked: `pnpm --filter @cowards/replay typecheck` currently fails in unowned `packages/replay/src/grammar.ts` and `packages/replay/src/grammar.test.ts`, which appear to belong to Plan 09-03.

## Notes

- The current builder emits a `CONTRACTION` snapshot after all contraction fallout, while this grammar requires `CONTRACTION` to reference `CONTRACTION_RESOLVED`. This plan intentionally did not edit `build.ts`; Plan 09-05 or a builder follow-up should reconcile integration behavior before wiring the validator into `validateChronicle`.
