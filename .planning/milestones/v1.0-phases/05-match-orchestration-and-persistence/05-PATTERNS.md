# Phase 5: Match Orchestration and Persistence - Pattern Map

## Closest Existing Analogs

### Shared Type Contracts

- `packages/spec/src/types.ts`
- `packages/spec/src/schemas.ts`
- `packages/spec/src/index.ts`

Use these as the source for canonical IDs and JSON-compatible domain payloads. Phase 5 persistence-specific statuses can begin in `packages/persistence` unless a later UI package needs them exported from `@cowards/spec`.

### Pure Simulation Boundary

- `packages/engine/src/types.ts`
- `packages/engine/src/match.ts`
- `packages/engine/src/index.ts`

The engine consumes `RunMatchInput` and a `StrategyRuntime`, derives initiative from seed, and returns deterministic transition state/events. Do not add database, queue, filesystem, clock, or network access to engine files.

### Runtime Boundary

- `packages/runtime-js/src/revision.ts`
- `packages/runtime-js/src/executor.ts`
- `packages/runtime-js/src/worker.ts`

`buildStrategyRevision` creates immutable StrategyRevision artifacts. `createRuntimeFromRevision` converts a revision into a `StrategyRuntime`. Worker orchestration should call this API; web/API code should not execute strategy source.

### Chronicle Boundary

- `packages/replay/src/build.ts`
- `packages/replay/src/validate.ts`
- `packages/replay/src/hash.ts`
- `packages/replay/src/project.ts`

`buildChronicleFromMatch` is the best fit for durable completed Match artifacts because it captures boundary snapshots and private sections. `validateChronicle` and Chronicle hashing should run before marking a Match complete.

### Worker App Shell

- `apps/worker/src/index.ts`
- `apps/worker/package.json`

The worker is currently a small shell. Phase 5 should expand it into the executable host for polling/claiming jobs, running simulations, and recording attempts.

### Workspace Package Pattern

- `packages/replay/package.json`
- `packages/runtime-js/package.json`
- `packages/test-utils/package.json`
- `tsconfig.base.json`
- `pnpm-workspace.yaml`
- `turbo.json`

New packages should use `"type": "module"`, source exports pointing at `./src/index.ts`, scripts for `build`, `lint`, `typecheck`, and `test`, and workspace dependencies via `"workspace:*"`.

## Proposed New Files

- `packages/persistence/package.json`
- `packages/persistence/tsconfig.json`
- `packages/persistence/migrations/0001_initial.sql`
- `packages/persistence/src/index.ts`
- `packages/persistence/src/db.ts`
- `packages/persistence/src/migrations.ts`
- `packages/persistence/src/schema.ts`
- `packages/persistence/src/repositories.ts`
- `packages/persistence/src/match-service.ts`
- `packages/persistence/src/matchset-service.ts`
- `packages/persistence/src/chronicle-store.ts`
- `packages/persistence/src/jobs.ts`
- `packages/persistence/src/scoring.ts`
- `packages/persistence/src/seed.ts`
- `packages/persistence/src/*.test.ts`
- `apps/worker/src/index.ts`
- `apps/worker/src/runner.ts`
- `apps/worker/src/runner.test.ts`
- `packages/map-configs/src/index.ts`

## Constraints To Preserve

- Engine remains pure and deterministic.
- Runtime violations stay as gameplay events.
- Match completion requires durable outcome plus durable Chronicle.
- MatchSet presets generate a concrete matrix once, then the persisted matrix is canonical.
- Full private Chronicle artifacts are stored internally; projection remains the public-access boundary.
