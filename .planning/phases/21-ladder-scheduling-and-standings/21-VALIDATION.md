# Phase 21 Validation

## Automated

- `pnpm --filter @cowards/persistence test -- ladder`
- `pnpm --filter @cowards/worker test`
- `STRATEGY_EXECUTION_ADAPTER=worker-thread pnpm exec tsx scripts/run-v13-demo-tournament.ts`

## Coverage

Deterministic scheduling, counted standings, replay-backed result links, and completed 8-starter demo tournament.

