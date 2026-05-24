# Phase 102: Topology, Monitors, Rollback, and Promotion Gate - Validation

**Validated:** 2026-05-24
**Nyquist status:** Complete for monitor, topology, rollback, public-output, and browser replay gates

## Test Infrastructure

| Layer | Tool | Command |
| --- | --- | --- |
| Live v1.15 topology gate | tsx | `pnpm topology:check -- --require-v1-15-lifecycle --json` |
| Topology/monitor unit tests | Vitest | `pnpm exec vitest run scripts/check-local-topology.test.ts scripts/check-boundary-monitors.test.ts` |
| Go fixture/default tests | Go test | `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` |
| Go parity fixture gate | pnpm/Go | `pnpm go:parity` |
| Runtime service | Vitest/TypeScript | `pnpm --filter @cowards/runtime-service test && pnpm --filter @cowards/runtime-service typecheck` |
| Composed monitor gate | pnpm | `pnpm boundary:monitors` |
| Browser replay realism | Playwright | `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.visual.spec.ts` |
| Patch hygiene | Git | `git diff --check` |

## Requirement Coverage

| Requirement | Automated/Artifact Coverage | Status |
| --- | --- | --- |
| GATE-01 | v1.15 live topology gate, runtime-service health smoke, Go public evidence fixture route, Go orchestration runner, Go exhibition-create/completion/scoring/public-evidence DB test. | COVERED |
| GATE-02 | Playwright replay visual suite passed 14/14. | COVERED |
| GATE-03 | Failure-drill artifact, public Go read client tests, account/exhibition selected-owner fail-closed behavior. | COVERED |
| GATE-04 | Runtime service client tests and job lifecycle system-failure tests. | COVERED |
| GATE-05 | Failure-drill exact rollback sequence and lifecycle ownership manifest no-mixed-owner checks. | COVERED |
| GATE-06 | `pnpm boundary:monitors` now includes live v1.15 topology, lifecycle artifacts, public evidence fixtures, runtime-service health, and text/public DTO privacy guards. | COVERED |
| GATE-07 | `.planning/artifacts/v1.15-promotion-decision.md`. | COVERED |
| GATE-08 | `.planning/artifacts/v1.15-typescript-surface-labels.json` plus lifecycle manifest monitor. | COVERED |

## Manual/Environment Notes

Docker was unavailable for `pnpm services:up`, so the final DB rerun used a temporary local Postgres started with installed `initdb`/`pg_ctl` binaries. The DB-backed Go suite passed with `<local-test-db-env>` pointed at that local database.
