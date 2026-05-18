# Phase 12 Research: Local and CI Reliability

**Phase:** 12-local-and-ci-reliability  
**Date:** 2026-05-18  
**Status:** Ready for planning

## Current Topology

Docker currently provides service containers only:

- `compose.yaml` starts Postgres and Redis.
- Both services have healthchecks.
- `pnpm dev:full` starts Compose services, then host-run web/worker dev processes.

The no-Docker path is stronger today:

- `scripts/dev-local-postgres.sh` starts or reuses local Postgres.
- It creates the `cowards` role and `cowards_game` database.
- It runs migrations before starting web and worker.
- `--setup-only` prepares the database and exits.

Playwright currently starts only the web server. Service-backed E2E exists in `apps/web/e2e/workshop-to-replay.spec.ts`, but it is skipped unless `RUN_SERVICE_E2E=1`.

There is no checked-in CI workflow.

## Useful Existing Assets

- `compose.yaml`: Docker service definitions and healthchecks for Postgres/Redis.
- `scripts/dev-local-postgres.sh`: no-Docker setup and migration flow.
- `packages/persistence/src/dev-smoke.ts`: seed + MatchSet smoke helper.
- `apps/web/app/api/test-support/run-worker-once/route.ts`: test-only route for one-shot worker execution.
- `apps/web/e2e/workshop-to-replay.spec.ts`: service-backed edit -> submit -> execute -> replay path.
- `apps/web/e2e/replay.fixture.spec.ts`: deterministic fixture replay smoke.
- `apps/web/e2e/replay.visual.spec.ts`: deterministic visual regression suite.

## Gaps

| Requirement | Gap |
| --- | --- |
| REL-01 | Compose healthchecks exist, but `dev:full` does not wait, migrate, seed, or print layer-specific readiness. |
| REL-02 | no-Docker path works for Postgres but lacks shared preflight and parity output. |
| REL-03 | No shared preflight command checks Postgres, Redis, migrations, seed/smoke, worker, and replay endpoint readiness. |
| REL-04 | Service-backed Workshop-to-replay test is opt-in and no CI workflow runs it. |
| REL-05 | Fast, service-backed, and visual commands are partially split but not explicit enough. |
| REL-06 | Failures are not consistently classified as service startup, migration, seeding, worker execution, Chronicle validation, replay projection, or UI rendering. |

## Implementation Direction

1. Add shared shell orchestration for Docker service startup and health waiting.
2. Add a TypeScript preflight command that performs layer-labelled checks and can run locally or in CI.
3. Reuse the existing no-Docker setup path, but expose equivalent preflight commands after setup.
4. Add explicit root scripts for `preflight`, `preflight:docker`, `preflight:local`, `e2e:service`, `test:fast`, and CI slices.
5. Add a GitHub Actions workflow with separate fast, service-backed, and visual jobs.
6. Improve service-backed E2E/test-support diagnostics so failures identify the layer.

## Docker Scope

This phase should not require app/worker containers. The must-have is end-to-end local development with Dockerized services and host-run web/worker, plus a CI service-backed E2E path.

## Non-Goals

- Ranked ladders.
- Full production containerization.
- Replacing the current monorepo build/test stack.
- Moving game rules into scripts or UI checks.

