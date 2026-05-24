# Phase 101: Public Evidence Delivery and Web Cutover - Summary

**Completed:** 2026-05-24
**Status:** Complete

## What Changed

- Added Go-owned public replay evidence route `GET /public/replays/{matchId}/evidence`.
- Added `publicReplayEvidence` service schema, example, OpenAPI path, and web Go client method.
- Extended public read route selection so `COWARDS_GO_PUBLIC_READS=1` and `COWARDS_GO_BACKEND_OWNER=go` select public replay evidence along with public strategy/player/ladder/MatchSet/replay metadata reads.
- Updated the replay server so normal public replay data uses Go public evidence when selected, fails closed without `COWARDS_GO_BACKEND_URL`, and avoids direct Chronicle persistence reads on the selected path.
- Kept owner-debug replay outside the normal public path; it remains deferred/trusted-server only.
- Added public replay evidence rendering from a Go-owned public Chronicle projection while preserving board realism checks and private-output checks.
- Added `v1.15-typescript-surface-labels.json` to label remaining TypeScript surfaces as frontend, parity-only, rollback-only, runtime-only, test-only, or deferred.
- Closed code review findings by making public replay evidence use a public-only Chronicle projection schema, rejecting `ownerPrivate` in public outputs, validating replay Match identity in the web Go client, and adding the missing service route-id enum entry.

## Requirements Covered

- API-01: Exhibition creation already uses Go when selected and fails closed through the account service adapter.
- API-02: Public MatchSet summary/evidence is Go-owned and uses Go-refreshed scoring from Phase 100.
- API-03: Public replay metadata and selected public replay evidence are Go-owned and public-safe by default.
- API-04: Selected public web reads call Go-owned contracts when selected.
- API-05: Remaining TypeScript surfaces are labeled in the v1.15 surface label artifact.
- API-06: Public DTO schemas, Go writers, web clients, and tests enforce privacy for replay/evidence outputs.

## Verification Run

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL='postgresql://cowards:cowards@localhost:5432/cowards_game' PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm --filter @cowards/spec test`
- `pnpm --filter @cowards/spec typecheck`
- `pnpm --filter @cowards/web typecheck`
- `pnpm exec vitest run apps/web/app/matches/server.test.ts apps/web/lib/public-go-read-client.test.ts apps/web/lib/public-service-adapter.test.ts`
- `pnpm boundary:imports`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
- `git diff --check`

## Notes

This phase intentionally does not migrate owner-debug replay, workshop internals, ladder/admin/governance mutations, or test-support routes. Those remain explicitly deferred/test-only surfaces.
