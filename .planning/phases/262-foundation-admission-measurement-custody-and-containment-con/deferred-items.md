# Phase 262 Deferred Items

## Plan 262-82 full-suite observation

- `pnpm turbo test --concurrency=1` failed in the unrelated `@cowards/replay` package because `packages/replay/src/historical-v1-4-grammar.ts` and `packages/replay/src/historical-v1-4-transition.ts` do not match their pre-existing frozen-source manifest identities.
- Isolated confirmation: `pnpm --filter @cowards/replay test` reported 228 passed and 2 failed in `src/historical-v1-4.test.ts`, both with the same `FROZEN_SOURCE_MISMATCH` codes.
- Plan 262-82 does not modify replay sources or their frozen manifest, so the mismatch is deferred without repair under the executor scope boundary.
