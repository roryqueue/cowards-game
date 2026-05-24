# Phase 101: Public Evidence Delivery and Web Cutover - Validation

**Validated:** 2026-05-24
**Nyquist status:** Complete for selected Phase 101 workflows

## Test Infrastructure

| Layer | Tool | Command |
| --- | --- | --- |
| Go unit/default | Go test | `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` |
| Go DB integration | Go test + local Postgres | `cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL='postgresql://cowards:cowards@localhost:5432/cowards_game' PATH=/usr/local/go/bin:$PATH go test ./...` |
| Spec contract | Vitest | `pnpm --filter @cowards/spec test` |
| Spec typecheck | TypeScript | `pnpm --filter @cowards/spec typecheck` |
| Web typecheck | TypeScript | `pnpm --filter @cowards/web typecheck` |
| Web adapter/replay tests | Vitest | `pnpm exec vitest run apps/web/app/matches/server.test.ts apps/web/lib/public-go-read-client.test.ts apps/web/lib/public-service-adapter.test.ts` |
| Boundary monitors | pnpm/tsx | `pnpm boundary:imports && pnpm exec tsx scripts/check-boundary-monitors.ts` |
| Patch hygiene | Git | `git diff --check` |

## Requirement Coverage

| Requirement | Automated/Artifact Coverage | Status |
| --- | --- | --- |
| API-01 | Existing exhibition adapter tests and account route selection enforce Go-selected fail-closed behavior. | COVERED |
| API-02 | Phase 100 DB tests plus Phase 101 web client/schema tests cover Go public MatchSet summary/evidence consumption. | COVERED |
| API-03 | Go DB test verifies public replay evidence projection strips private sections; web replay server test verifies Go-selected public evidence avoids direct Chronicle store reads. | COVERED |
| API-04 | Public service adapter/client tests cover selected Go routes and no-fallback behavior. | COVERED |
| API-05 | `.planning/artifacts/v1.15-typescript-surface-labels.json` labels remaining TypeScript surfaces. | COVERED |
| API-06 | Spec public schema tests, Go response privacy validation, web Go client privacy checks, and replay server tests cover private-output omissions. | COVERED |

## Review Fix Validation

Code review found one blocker and two warnings. Follow-up validation now covers public-only replay evidence projection schemas, `ownerPrivate` public-output rejection, replay Match identity checks for metadata and evidence reads, and service route-id enum coverage.

## Manual-Only Items

Full browser replay realism with live Go evidence remains in Phase 102 topology verification. Phase 101 preserves board realism validation in the replay evidence renderer and adds contract tests for the Go-selected data path.
