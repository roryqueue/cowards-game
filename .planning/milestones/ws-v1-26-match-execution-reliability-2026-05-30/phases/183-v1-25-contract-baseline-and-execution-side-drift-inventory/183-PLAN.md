# Phase 183: v1.25 Contract Baseline and Execution-Side Drift Inventory - Plan

**Status:** Executed
**UI phase needed:** No new UI contract; existing proof pages only.

## Tasks

1. Inventory frozen app contract schemas and v1.25 proof artifacts.
2. Classify execution-side surfaces by ownership and stability.
3. Record no-contract-change decision and risks for later phases.

## Verification

- cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...
- pnpm --filter @cowards/runtime-service test
- pnpm --filter @cowards/runtime-service typecheck
- pnpm --filter @cowards/spec test
- pnpm --filter @cowards/web test
- PLAYWRIGHT_TEST=1 pnpm e2e -- v1-25-match-execution-fixtures.spec.ts --project=desktop --workers=1
- pnpm match-execution:reliability:check
- pnpm exec tsx scripts/check-boundary-monitors.ts
- pnpm exec prettier --check package.json scripts/evaluate-v1-26-match-execution-reliability.ts scripts/check-boundary-monitors.ts apps/runtime-service/src/server.ts apps/runtime-service/src/server.test.ts
- in-app browser fixture-page private-marker scan for unavailable-runtime, stale-artifact, malformed-runtime-result, public-safe-replay, replay
