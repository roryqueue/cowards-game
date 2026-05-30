# Phase 185: Runtime Unavailable and Stopped-Service Live Drills - Plan

**Status:** Executed
**UI phase needed:** No new UI contract; existing proof pages only.

## Tasks

1. Reuse stopped/transport runtime tests and fixture proof pages.
2. Record unavailable retry semantics in proof artifact.
3. Verify no private-field leaks in unavailable public pages.

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
