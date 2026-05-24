# Phase 105 Validation

## Status

Nyquist validation is **complete**: WEB-01 through WEB-08 have focused automated coverage for selected Go-only route behavior, fallback removal, schema/privacy checks, manifests, monitors, rendered replay smoke, and live selected page-smoke with the web frontend, Go backend, and runtime service running.

## Validation Audit 2026-05-24

| Metric | Count |
| --- | ---: |
| Gaps found | 2 |
| Resolved with new behavioral tests | 1 |
| Escalated | 0 |
| Resolved with live topology rerun | 1 |
| Residual live/manual risks | 0 |

## Tests Added

| File | Type | Coverage |
| --- | --- | --- |
| `tests/phase-105-selected-go-route-behavior.test.ts` | integration | Calls real selected Next API route handlers with mocked Go clients to verify Go auth cookie forwarding/clearing, owner-source `private, no-store` response, account save/fork readback through listable Go revisions, and selected exhibition MatchSet creation. |

## Focused Gates Run

| Command | Result |
| --- | --- |
| `pnpm exec vitest run tests/phase-105-selected-go-route-behavior.test.ts` | passed, 4 tests |
| `pnpm exec vitest run tests/phase-105-selected-go-route-behavior.test.ts apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts apps/web/lib/public-go-read-client.test.ts apps/web/app/matches/server.test.ts scripts/check-boundary-monitors.test.ts scripts/check-local-topology.test.ts` | passed, 72 tests |
| `pnpm boundary:imports` | passed with `strict_offenses=0 report_only_offenses=22`; remaining report-only rows are deferred/admin/ladder/private replay/workshop/test surfaces, not selected normal routes |
| `pnpm typescript-backend:inventory:check` | passed; inventory artifacts are current |
| `pnpm --filter @cowards/web typecheck` | passed |
| `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` | passed |
| `pnpm boundary:monitors` | passed; live topology inside this command remains optional unless `COWARDS_REQUIRE_LIVE_TOPOLOGY=1` |
| `PLAYWRIGHT_TEST=1 pnpm exec playwright test --project=desktop replay.visual.spec.ts` | passed, 7 desktop replay visual tests with rendered board/canvas-pixel checks |
| `pnpm topology:check -- --require-web-page-smoke --require-go --require-runtime-service --require-v1-16-selected-go-pages --web-url http://localhost:3000 --go-url http://127.0.0.1:8087 --runtime-service-url http://127.0.0.1:3107 --json` | passed with running runtime service, Go fixture backend, and strict Go/no-TypeScript-backend web frontend; 11 representative pages and 7 selected Go pages loaded |

## Live Topology Evidence

Initial command attempted:

```bash
pnpm topology:check -- --require-web-page-smoke --require-go --require-runtime-service --require-v1-16-selected-go-pages
```

Initial result: failed because local live services were not running. Failures were `runtime service health`, `web service health route`, representative page loads, `v1.16 selected Go page smoke`, Go health, selected public read routes, and owner analytics auth gate. Diagnostics were redacted and did not include Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner-debug data, tokens, DB DSNs, host paths, stack traces, stderr, or private runtime material.

Rerun services:

```bash
COWARDS_RUNTIME_SERVICE_ALLOW_LOCAL_WORKER_THREAD=1 pnpm --filter @cowards/runtime-service start
cd apps/go-backend && PATH=/usr/local/go/bin:$PATH COWARDS_GO_BACKEND_ADDR=127.0.0.1:8087 go run .
COWARDS_NO_TYPESCRIPT_BACKEND=1 COWARDS_GO_BACKEND_OWNER=go COWARDS_GO_PUBLIC_READS=1 COWARDS_GO_BACKEND_URL=http://127.0.0.1:8087 COWARDS_RUNTIME_SERVICE_URL=http://127.0.0.1:3107 pnpm --filter @cowards/web dev
pnpm topology:check -- --require-web-page-smoke --require-go --require-runtime-service --require-v1-16-selected-go-pages --web-url http://localhost:3000 --go-url http://127.0.0.1:8087 --runtime-service-url http://127.0.0.1:3107 --json
```

Final result: passed. The topology report showed runtime service health, web health, Go health, representative page loads, selected Go page smoke, selected public read routes, owner analytics auth rejection, and privacy diagnostics all green. The selected Go page-smoke detail was: `7 v1.16 selected Go pages loaded at http://localhost:3000/ with replay board realism checked; rendered replay board visual smoke harness checks canvas pixels and snapshots; Workshop is deferred/load-only`.

## WEB-01 Through WEB-08 Evidence

| Requirement | Evidence | Status |
| --- | --- | --- |
| WEB-01 | `tests/phase-105-selected-go-route-behavior.test.ts` verifies selected sign-in/sign-up/sign-out route handlers call the Go client and preserve Go `Set-Cookie`/clear-cookie behavior; `apps/web/lib/account-service-adapter.test.ts` verifies selected account/session reads do not construct the local TypeScript service and fail closed without Go URL. | green |
| WEB-02 | `tests/phase-105-selected-go-route-behavior.test.ts` verifies selected exhibition creation calls the Go client, filters invalid revision ids, and returns queued MatchSet shape. | green |
| WEB-03 | `apps/web/lib/public-service-adapter.test.ts`, `apps/web/lib/public-go-read-client.test.ts`, `apps/web/app/matches/server.test.ts`, and `pnpm boundary:monitors` verify selected public Strategy/player/ladder/MatchSet/replay metadata/replay evidence reads use Go-owned public read contracts without TypeScript service fallback. | green |
| WEB-04 | `scripts/check-boundary-monitors.test.ts`, `pnpm boundary:imports`, and `pnpm boundary:monitors` verify the selected route manifest and selected Next API adapters remain frontend adapters or explicitly non-normal. | green |
| WEB-05 | `pnpm boundary:imports` and `pnpm boundary:monitors` verify selected normal offenses are removed from the boundary baseline while remaining `apps/web/app/competitive/server.ts` usage is report-only deferred/admin/ladder/private replay/workshop/test scope. | green |
| WEB-06 | `apps/web/lib/account-service-adapter.test.ts`, `apps/web/lib/public-service-adapter.test.ts`, and the new selected route behavior test verify selected account/public adapters and routes fail closed without Go configuration rather than silently falling back to TypeScript backend behavior. | green |
| WEB-07 | `apps/web/app/matches/server.test.ts` verifies selected public replay metadata/evidence use Go public read/evidence clients and do not call the Chronicle store; owner-debug/private Chronicle remains explicit and private. | green |
| WEB-08 | `tests/phase-105-selected-go-route-behavior.test.ts`, `apps/web/lib/public-go-read-client.test.ts`, `apps/go-backend/main_test.go`, `scripts/check-local-topology.test.ts`, `pnpm boundary:monitors`, and the desktop replay visual suite cover schema validation, auth/session cookie behavior, owner-source privacy headers, public DTO leak rejection, redacted diagnostics, replay board realism, and no source/memory/objective/owner-debug payload exposure by default. | green |

## Residual Risk

No Phase 105 validation residual risk remains. Full live-database Match orchestration remains part of later milestone-wide topology/audit coverage, not a Phase 105 selected web/API cutover gap.

## Explicitly Out of Scope

Workshop migration, broader ladder mutations, governance/admin, owner-debug/private Chronicle migration, test-support routes, fixtures, rollback/parity implementation, migrations/schema ownership, and runtime replacement were not implemented in Phase 105.
