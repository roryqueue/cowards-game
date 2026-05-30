# Phase 187: Runtime-Service Failure Envelope Translation Hardening - Plan

**Status:** Executed
**UI phase needed:** No new UI contract; existing proof pages only.

## Tasks

1. Redact runtime-service HTTP boundary malformed errors.
2. Keep failure envelopes schema-validated and registered-code-only.
3. Extend boundary monitor to check v1.26 reliability evidence.

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
