# Phase 29 Validation

## Commands

- `pnpm services:up`
- `STRATEGY_EXECUTION_ADAPTER=worker-thread pnpm exec tsx scripts/run-v1-4-demo-tournament.ts`
- `pnpm test:fast`

## Result

Passed.

## Browser Evidence

Local web app: `http://localhost:3000`

- Ladder: `/ladder/v1-4-demo`
- MatchSet: `/matchsets/match-set%3Atrial%3Atrial-season%3Av1-4-demo%3A0%3A0`
- Replay sample:
  `/matches/match%3Amatch-set%3Atrial%3Atrial-season%3Av1-4-demo%3A0%3A0%3A0/replay`
- Strategy card: `/strategies/strategy%3Ademo%3Abackstab-hunter`
- Player profile: `/players/backstab-hunter`

