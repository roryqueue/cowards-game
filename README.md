# Coward's Game

Coward's Game is a deterministic two-player programmable strategy game for the web. Players author autonomous Strategy Revisions that control Soldiers on a shrinking board.

## Local Development

Install dependencies:

```sh
pnpm install
```

Start the lightweight development loop:

```sh
pnpm dev
```

Start the Docker-backed local topology with PostgreSQL, Redis, the web app, and the worker:

```sh
pnpm dev:full
```

`pnpm dev:full` starts Docker Compose services, waits for service health, runs preflight checks, then starts the host-run web and worker dev processes. The application processes are intentionally still run on the host in this milestone; Docker owns the service layer.

Start the local end-to-end loop without Docker, using a Homebrew-style local PostgreSQL binary:

```sh
pnpm dev:local
```

`pnpm dev:local` initializes or reuses `/tmp/cowards-game-postgres-data`, creates the `cowards` role and `cowards_game` database, runs migrations, runs local preflight without Redis, then starts the web app and worker against `postgresql://cowards:cowards@localhost:5432/cowards_game`. Use `pnpm dev:local -- --setup-only` when you only want to prepare the local database.

## Reliability Commands

```sh
pnpm services:up
pnpm preflight:docker
pnpm preflight:local
pnpm e2e:service
pnpm e2e:smoke
pnpm e2e:visual
pnpm test:fast
```

`pnpm preflight:docker` verifies Dockerized Postgres and Redis, migrations, seeded Match execution, Chronicle replay, and public replay projection. `pnpm preflight:local` runs the same checks without Redis for the no-Docker Postgres path.

Failure output is prefixed by layer: `service_startup`, `migration`, `seeding`, `worker_execution`, `chronicle_validation`, `replay_projection`, or `ui_rendering`.

## Commands

```sh
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:fast
pnpm verify
```

`pnpm verify` runs fast checks plus fixture replay smoke and visual replay regression. Service-backed E2E is intentionally separate as `pnpm e2e:service` because it requires running services.

## Engine

```sh
pnpm --filter @cowards/engine test
pnpm --filter @cowards/engine typecheck
pnpm verify
```

The current source of truth is `CowardsGameSpec_CycleInterleaved_v1.4.md`
and `CowardsGame_Technical_Architecture_Spec_v1.4.md`. The original v1
specs remain historical. v1.4 replaces full-Activation sequencing with
Cycle-interleaved selected Soldier slots and uses Cycle-start/Cycle-end
Backstab boundaries.

## Package Boundaries

`packages/spec` is the canonical contract package. It owns Coward's Game types, constants, Zod schemas, compatibility versions, and canonical fixtures.

`packages/spec` must not depend on internal workspace packages. Downstream packages can depend on `@cowards/spec`, but dependency direction should not point back from `spec` to engine, runtime, replay, worker, web, map configs, or test utilities.

## Phase 1 Non-Goals

Phase 1 does not implement:

- engine rules
- runtime sandbox execution
- database schema
- Chronicle generation
- gameplay UI
- hosted CI

Runtime-related placeholders are inert. User Strategy code must not execute in the web/API process.
