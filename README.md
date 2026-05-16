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

Start the full local topology with PostgreSQL, Redis, the skeletal web app, and the skeletal worker:

```sh
pnpm dev:full
```

Manual check: run `pnpm dev` and confirm the web and worker development processes start. Run `pnpm dev:full` and confirm Docker Compose starts PostgreSQL and Redis before the web and worker processes.

## Commands

```sh
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm verify
```

`pnpm verify` is the local quality gate for Phase 1. Hosted CI is intentionally not included in Phase 1.

## Engine

```sh
pnpm --filter @cowards/engine test
pnpm --filter @cowards/engine typecheck
pnpm verify
```

Backstab uses the Phase 2 activation-boundary clarification recorded in `.planning/spec-amendments/02-backstab-rule.md`.

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
