# Plan 09-01 Summary: Validation Error Contract and Compatibility Gate

**Status:** Complete
**Completed:** 2026-05-18

## Changed Files

- `packages/spec/src/schemas.ts`
- `packages/spec/src/types.ts`
- `packages/replay/src/validate.test.ts`
- `apps/web/app/matches/replay-ready.ts`
- `apps/web/app/matches/server.test.ts`
- `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-01-PLAN.md`
- `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-01-SUMMARY.md`

## Requirements Satisfied

- Added stable grammar-specific Chronicle validation codes to schema and type contracts: `EVENT_WINDOW_INVALID`, `CONTEXT_MISSING`, `CONTEXT_MISMATCH`, `PAYLOAD_INCONSISTENT`, and `SNAPSHOT_BOUNDARY_INVALID`.
- Added validation-code contract coverage proving the new codes parse through `ChronicleValidationErrorCodeSchema` and stay type-compatible.
- Expanded compatibility rejection coverage over every key in `COMPATIBILITY_VERSIONS`: `spec`, `engine`, `runtimeJs`, `chronicle`, `strategyRevision`, and `arenaVariant`.
- Preserved acceptance for current `chronicle-v1` Chronicles with current compatibility versions.
- Kept malformed shape failures surfaced as `SCHEMA_INVALID` with normalized issue details.
- Kept current-version semantic failures surfaced through stable validation codes instead of raw Zod messages.
- Updated replay-ready loading so `createReplay` validation failures return replay-unavailable diagnostics with the stable validation code before projection, timeline, or board-state DTO assembly.

## Verification

- `pnpm --filter @cowards/replay test -- validate.test.ts` - passed, 7 files / 33 tests.
- `pnpm --filter @cowards/web test -- server.test.ts` - passed, 9 files / 63 tests.
- `pnpm --filter @cowards/replay typecheck` - passed.
- `pnpm --filter @cowards/web typecheck` - passed.

## Coordination Notes

- Left unrelated concurrent `packages/replay/src/project.ts` changes unstaged and untouched for Plan 09-02.
- No blockers.
