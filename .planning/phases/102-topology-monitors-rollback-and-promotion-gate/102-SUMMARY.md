# Phase 102: Topology, Monitors, Rollback, and Promotion Gate - Summary

**Completed:** 2026-05-24
**Status:** Complete; final milestone audit passed

## What Changed

- Added Go parity fixture and fixture-mode route coverage for `GET /public/replays/{matchId}/evidence`.
- Extended the local topology checker with `--require-v1-15-lifecycle` to validate v1.15 topology, failure-drill, TypeScript surface-label, and promotion-decision artifacts.
- Extended boundary monitors so v1.15 live topology is promotion-blocking, Go route manifest metadata includes public replay evidence, runtime-service health is checked, and public-output leak guards cover fixtures and text artifacts.
- Added source-safe v1.15 promotion artifacts:
  - `.planning/artifacts/v1.15-live-web-go-runtime-topology.json`
  - `.planning/artifacts/v1.15-failure-drills.json`
  - `.planning/artifacts/v1.15-promotion-decision.md`
- Added a DB-backed Go integration test proving `createExhibitionMatchSet` creates a Go-owned public exhibition MatchSet with queued jobs.
- Added the Go-owned orchestration runner path that claims queued jobs, calls the TypeScript runtime execution service, completes/persists through Go, refreshes scoring, and exposes public replay evidence. In live mode, Go orchestration starts automatically when `COWARDS_RUNTIME_SERVICE_URL` is configured, unless explicitly disabled.
- Added persisted strategy-failure scoring attribution from Chronicle `RUNTIME_VIOLATION` events.
- Closed Phase 102 review/audit blockers by requiring live web/Go/runtime-service evidence under `--require-v1-15-lifecycle`, exact command-evidence ids, ordered rollback drills, live Go replay-evidence schema validation, central public-output text privacy checks, required TypeScript surface labels, and Go orchestration E2E evidence.
- Ran the browser replay visual suite to verify realistic board rendering, in-bounds pieces, and nonblank replay canvas behavior.

## Requirements Covered

- GATE-01: Topology gate validates the web -> Go -> runtime service health -> Go public evidence chain, and the Go DB test covers exhibition creation/queued jobs/runtime handoff/completion/scoring/public evidence.
- GATE-02: Browser replay visual suite passed for desktop and mobile replay states.
- GATE-03: Failure drill artifact plus selected Go client tests cover stopped-Go fail-closed behavior.
- GATE-04: Failure drill artifact plus runtime service client/job lifecycle tests cover stopped-runtime classification without TypeScript persistence fallback.
- GATE-05: Rollback artifact documents explicit stop-Go, switch-owner, start-TypeScript-rollback-worker order and no mixed DB owners.
- GATE-06: Boundary monitors now fail on v1.15 topology, route, privacy, runtime ABI, lifecycle manifest, and report-only drift.
- GATE-07: Promotion/defer artifact records promoted Go ownership, deferred runtime retirement/sandbox replacement, rollback, privacy, and TypeScript runtime-only scope.
- GATE-08: TypeScript surface labels and monitors restrict remaining TypeScript production-ish ownership to the isolated runtime service plus documented parity/test/rollback/deferred surfaces.

## Verification Run

- `pnpm topology:check -- --require-v1-15-lifecycle --json`
- `pnpm exec vitest run scripts/check-local-topology.test.ts scripts/check-boundary-monitors.test.ts`
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm go:parity`
- `pnpm --filter @cowards/runtime-service test`
- `pnpm --filter @cowards/runtime-service typecheck`
- `pnpm boundary:monitors`
- `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.visual.spec.ts`

## Notes

Docker was unavailable for `pnpm services:up`, but final DB verification ran against a temporary local Postgres started with the installed `initdb`/`pg_ctl` binaries. The DB-backed Go suite passed.
