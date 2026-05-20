# Phase 27 Validation

## Commands

- `pnpm --filter @cowards/spec test -- --run`
- `pnpm --filter @cowards/replay test -- --run`
- `pnpm --filter @cowards/test-utils test -- --run`
- `pnpm --filter @cowards/persistence test -- chronicle-store.test.ts --run`
- `pnpm --filter @cowards/web test -- --run`
- `pnpm test:fast`

## Result

Passed. The full fast suite completed with lint, typecheck, and all package
tests green.

## Coverage Notes

- Replay tests cover schema compatibility, grammar errors, deterministic
  reconstruction, lifecycle no-op transitions, fixture legality, and Chronicle
  storage metadata.

