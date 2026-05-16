# Plan 05-05 Summary: MatchSet Scoring, Status Aggregation, and End-to-End Smoke Path

## Status

Complete.

## What Changed

- Added deterministic MatchSet scoring by wins, surviving Soldiers, survival turns, then StrategyRevision id.
- Added degraded/incomplete scoring behavior for `failed_system` Matches.
- Added MatchSet status aggregation and persisted scoring refresh.
- Added a development smoke helper that migrates, seeds, creates a smoke MatchSet, optionally runs queued work, refreshes scoring, and reports Chronicle count.
- Aligned the persistence default database URL with the existing Docker Compose database name.

## Verification

```bash
pnpm --filter @cowards/persistence test -- scoring.test.ts dev-smoke.test.ts
pnpm --filter @cowards/persistence typecheck
```

Both checks passed.

## Key Files Created Or Modified

- `packages/persistence/src/scoring.ts`
- `packages/persistence/src/matchset-status.ts`
- `packages/persistence/src/dev-smoke.ts`
- `packages/persistence/src/scoring.test.ts`
- `packages/persistence/src/dev-smoke.test.ts`
- `packages/persistence/src/db.ts`

## Deviations

- The live PostgreSQL smoke test is skipped unless `DATABASE_URL` is explicitly provided, while still checking the exported smoke contract by default.
