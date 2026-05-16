# Plan 05-04 Summary: Worker Job Claiming, Execution, Retry, and Idempotent Completion

## Status

Complete.

## What Changed

- Added DB-backed Match job claiming with `FOR UPDATE SKIP LOCKED`.
- Added lease tokens, heartbeat extension, attempt recording, retry decisions, and `failed_system` exhaustion behavior.
- Added Match completion field derivation and a completion service that persists outcome fields after Chronicle storage.
- Added worker runner orchestration that claims jobs, loads locked inputs, runs runtime/engine/replay, completes Matches, and records unexpected orchestration failures.
- Added worker shutdown handling and pool creation in `apps/worker/src/index.ts`.
- Added worker tests distinguishing runtime-violation gameplay completion from system failure retry handling.

## Verification

```bash
pnpm --filter @cowards/persistence test -- jobs.test.ts complete-match.test.ts
pnpm --filter @cowards/persistence typecheck
pnpm --filter @cowards/worker test -- runner.test.ts
pnpm --filter @cowards/worker typecheck
```

All checks passed.

## Key Files Created Or Modified

- `packages/persistence/src/jobs.ts`
- `packages/persistence/src/complete-match.ts`
- `packages/persistence/src/jobs.test.ts`
- `packages/persistence/src/complete-match.test.ts`
- `apps/worker/src/runner.ts`
- `apps/worker/src/runner.test.ts`
- `apps/worker/src/index.ts`
- `apps/worker/package.json`

## Deviations

- Worker tests use injected dependencies so failure-classification behavior is verified without requiring a live PostgreSQL instance.
