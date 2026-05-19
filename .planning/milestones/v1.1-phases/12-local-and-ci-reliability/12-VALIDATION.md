# Phase 12 Validation Evidence

**Phase:** 12-local-and-ci-reliability
**Validated:** 2026-05-18
**Scope:** REL-01 through REL-06

## Requirement Evidence

| Requirement | Evidence files | Command-backed result |
| --- | --- | --- |
| REL-01: Docker Compose startup reports service health and readiness clearly | `compose.yaml`, `scripts/wait-for-compose-services.sh`, `scripts/preflight.ts`, `package.json` | `pnpm preflight:docker -- --skip-web` passed. Docker Compose started Postgres and Redis, both reached `healthy`, migrations ran, smoke Match completed, Chronicle replay parsed, and public replay projection succeeded. |
| REL-02: no-Docker local Postgres path remains supported with equivalent diagnostics | `scripts/dev-local-postgres.sh`, `scripts/preflight.ts`, `README.md`, `package.json` | `pnpm dev:local -- --setup-only` passed. `pnpm preflight:local -- --skip-web` passed with Redis skipped and the same migration/smoke/replay/projection checks. |
| REL-03: shared preflight checks services, migrations, seed state, worker readiness, and replay endpoint readiness | `scripts/preflight.ts`, `packages/persistence/src/dev-smoke.ts`, `apps/worker/src/runner.ts` | `pnpm preflight:docker -- --skip-web`, `pnpm preflight:local -- --skip-web`, and `COWARDS_WEB_URL=http://localhost:3000 pnpm preflight -- --require-web` passed. Preflight binds Chronicle validation, projection, and replay-route rendering to the MatchSet created by the same run. |
| REL-04: CI can run service-backed edit -> submit revision -> execute Match -> open replay | `.github/workflows/ci.yml`, `apps/web/e2e/workshop-to-replay.spec.ts`, `apps/web/app/api/test-support/run-worker-once/route.ts`, `package.json` | `pnpm e2e:service` passed with the isolated desktop service-backed project. CI has a `service-e2e` job with Postgres/Redis services, preflight, and the service-backed Playwright flow. |
| REL-05: commands separate fast, service-backed E2E, and replay visual regression checks | `package.json`, `.github/workflows/ci.yml`, `README.md` | `pnpm test:fast` passed. `pnpm e2e:service` passed. `pnpm e2e:smoke` passed. `pnpm e2e:visual` passed. |
| REL-06: failures identify the failing layer | `scripts/preflight.ts`, `scripts/wait-for-compose-services.sh`, `apps/web/e2e/workshop-to-replay.spec.ts`, `apps/web/app/api/test-support/run-worker-once/route.ts` | Preflight and service E2E output use `service_startup`, `migration`, `seeding`, `worker_execution`, `chronicle_validation`, `replay_projection`, and `ui_rendering` labels. Route tests cover worker diagnostic payloads. |

## Phase Gates

| Command | Result |
| --- | --- |
| `pnpm preflight:docker -- --skip-web` | Passed. Last run used Docker Compose Postgres/Redis with healthchecks and produced a completed preflight MatchSet. |
| `COWARDS_WEB_URL=http://localhost:3000 pnpm preflight -- --require-web` | Passed. The UI rendering check fetched `/matches/{matchId}/replay` for the generated preflight Match and confirmed replay content rendered. |
| `pnpm dev:local -- --setup-only` | Passed. Local Postgres started from `/tmp/cowards-game-postgres-data`, role/database existed, migrations skipped as current. |
| `pnpm preflight:local -- --skip-web` | Passed. Redis was intentionally skipped and all required DB/worker/replay/projection checks passed. |
| `pnpm e2e:service` | Passed after isolating the service-backed test to desktop/one worker. |
| `pnpm e2e:smoke` | Passed, 6 tests. |
| `pnpm e2e:visual` | Passed, 14 tests after refreshing the current contraction fixture snapshots. |
| `pnpm test:fast` | Passed: format, lint, typecheck, and unit/package tests. |
| `pnpm --filter @cowards/web test -- run-worker-once/route.test.ts` | Passed, included worker diagnostic payload coverage. |
| `pnpm --filter @cowards/persistence exec vitest run src/chronicle-store.test.ts` | Passed after updating the fixture to strict Chronicle grammar. |

## Notes

- Docker proof found and fixed the Postgres 18 volume mount change: the Compose volume now mounts `/var/lib/postgresql`.
- Fast CI proof found and fixed two stale gates unrelated to Phase 12 product behavior: a Chronicle storage fixture missing strict context fields and an unused replay grammar constant.
- Visual proof found stale contraction snapshots after fixture correction work; the refreshed snapshots preserve the current legal contraction rendering.
