# Phase 105 Validation

## Focused Gates Run

- `pnpm exec vitest run apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts apps/web/lib/public-go-read-client.test.ts apps/web/app/matches/server.test.ts scripts/check-boundary-monitors.test.ts scripts/check-local-topology.test.ts` - passed, 65 tests.
- `pnpm boundary:imports` - passed with `strict_offenses=0 report_only_offenses=22`; remaining report-only rows are deferred/admin/ladder/private replay/workshop/test surfaces, not selected normal routes.
- `pnpm typescript-backend:inventory` - regenerated v1.16 inventory artifacts.
- `pnpm typescript-backend:inventory:check` - passed.
- `pnpm --filter @cowards/web typecheck` - passed.
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` - passed.
- `pnpm boundary:monitors` - passed; live topology inside this command is optional unless `COWARDS_REQUIRE_LIVE_TOPOLOGY=1`.

## Live Topology Attempt

Command attempted:

```bash
pnpm topology:check -- --require-web-page-smoke --require-go --require-runtime-service --require-v1-16-selected-go-pages
```

Result: failed because local live services were not running. Failures were `runtime service health`, `web service health route`, representative page loads, `v1.16 selected Go page smoke`, Go health, selected public read routes, and owner analytics auth gate. Diagnostics were redacted and did not include Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner-debug data, tokens, DB DSNs, host paths, stack traces, stderr, or private runtime material.

Startup commands for a full live rerun:

```bash
pnpm services:up
pnpm --filter @cowards/runtime-service start
cd apps/go-backend && COWARDS_GO_BACKEND_DATA_MODE=live redacted-db-env COWARDS_RUNTIME_SERVICE_URL=http://127.0.0.1:3107 go run .
COWARDS_GO_BACKEND_OWNER=go COWARDS_GO_BACKEND_URL=http://127.0.0.1:8087 COWARDS_GO_PUBLIC_READS=1 pnpm --filter @cowards/web dev
pnpm topology:check -- --require-web-page-smoke --require-go --require-runtime-service --require-v1-16-selected-go-pages
```

## WEB-01 Through WEB-08

- WEB-01/WEB-02: selected auth/session, account revision/source/save/fork, and exhibition adapters now call Go clients and fail closed without `COWARDS_GO_BACKEND_URL`.
- WEB-03/WEB-07: selected public reads, replay metadata, and public replay evidence use Go public read/evidence clients; owner-debug/private Chronicle remains explicit and private.
- WEB-04/WEB-05/WEB-06: selected Next API route imports no longer include `competitiveServer`, direct persistence, or `@cowards/service`; monitor baseline dropped selected normal offenses from 29 to 22.
- WEB-08: Go client schema validation, private owner-source response headers, public DTO leak checks, redacted diagnostics, and no source/memory/objective payload exposure are covered by focused tests and monitors.

## Explicitly Out of Scope

Workshop migration, broader ladder mutations, governance/admin, owner-debug/private Chronicle migration, test-support routes, fixtures, rollback/parity implementation, migrations/schema ownership, and runtime replacement were not implemented in Phase 105.
