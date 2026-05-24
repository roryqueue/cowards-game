# Phase 101: Public Evidence Delivery and Web Cutover - Verification

**Verified:** 2026-05-24
**Status:** PASS

## Commands

| Command | Result |
| --- | --- |
| `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` | PASS |
| `cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL='postgresql://cowards:cowards@localhost:5432/cowards_game' PATH=/usr/local/go/bin:$PATH go test ./...` | PASS |
| `pnpm --filter @cowards/spec build` | PASS |
| `pnpm --filter @cowards/spec contract:generate` | PASS |
| `pnpm --filter @cowards/spec test` | PASS |
| `pnpm --filter @cowards/spec typecheck` | PASS |
| `pnpm --filter @cowards/web typecheck` | PASS |
| `pnpm exec vitest run apps/web/app/matches/server.test.ts apps/web/lib/public-go-read-client.test.ts apps/web/lib/public-service-adapter.test.ts` | PASS |
| `pnpm boundary:imports` | PASS, with 29 report-only known offenses and 0 strict offenses |
| `pnpm exec tsx scripts/check-boundary-monitors.ts` | PASS |
| `git diff --check` | PASS |

## Goal-Backward Checks

- Normal selected public replay evidence now resolves through Go-owned `/public/replays/{matchId}/evidence`.
- The selected path fails closed if Go ownership is selected without a Go backend URL.
- Web replay rendering does not directly read Chronicle persistence on the selected Go evidence path.
- Public replay evidence schemas and clients reject owner-private projection data.
- Public replay metadata/evidence clients reject mismatched Match ids.
- Remaining TypeScript surfaces are explicitly labeled as frontend, parity-only, runtime-only, rollback-only, test-only, or deferred.

## Residual Risk

Owner-debug replay and workshop/admin mutation surfaces remain intentionally deferred or test-only for v1.15. Phase 102 must prove live topology realism and no-fallback behavior with running services.
