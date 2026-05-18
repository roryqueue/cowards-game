# Phase 5: Match Orchestration and Persistence - Research

## Research Complete

### Goal

Plan the durable orchestration layer that creates Matches and MatchSets from immutable Strategy Revisions, executes queued Match jobs through the existing runtime/engine/replay stack, persists outcomes and Chronicles, and scores MatchSets deterministically.

### Inputs Read

- `.planning/phases/05-match-orchestration-and-persistence/05-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `AGENTS.md`
- `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.env.example`, `compose.yaml`
- `packages/spec/src/types.ts`
- `packages/engine/src/types.ts`
- `packages/engine/src/match.ts`
- `packages/replay/src/build.ts`
- `packages/replay/src/validate.ts`
- `packages/runtime-js/src/revision.ts`
- `packages/runtime-js/src/executor.ts`
- `packages/map-configs/src/index.ts`
- `apps/worker/package.json`
- `apps/worker/src/index.ts`

## Recommended Architecture

### Package Boundary

Add a new workspace package: `packages/persistence`.

This package should own:

- PostgreSQL connection helper and migration runner.
- SQL migrations under `packages/persistence/migrations`.
- Repository APIs for Users, Strategies, StrategyRevisions, ArenaVariants, Matches, MatchSets, Chronicles, and Match job attempts.
- Creation services for Matches and MatchSets.
- Chronicle storage adapter with PostgreSQL JSONB implementation.
- MatchSet preset definitions and scoring helpers.
- Integration tests that can run against local PostgreSQL when `DATABASE_URL` is present.

Keep `apps/worker` as the executable host:

- Load `DATABASE_URL`.
- Claim due Match jobs through `@cowards/persistence`.
- Execute locked inputs with `@cowards/runtime-js`, `@cowards/engine`, and `@cowards/replay`.
- Persist attempt/job state, outcome, and Chronicle data through repositories.

### Persistence Choice

Use SQL migrations plus `pg` for Phase 5 rather than introducing an ORM.

Rationale:

- The schema is relational and reproducibility-heavy; explicit SQL constraints are valuable.
- The project has no ORM yet, so adding an ORM would require both schema conventions and a generated client workflow.
- Explicit migrations satisfy DATA-05 and avoid a schema-push gate tied to ORM-specific tooling.
- A thin repository layer can keep SQL localized and still provide typed service contracts.

Recommended dependency changes:

- Root or package install command: `pnpm add pg dotenv --filter @cowards/persistence`
- Type dependency: `pnpm add -D @types/pg --filter @cowards/persistence`
- Worker dependency: `pnpm add @cowards/persistence @cowards/engine @cowards/replay --filter @cowards/worker`

### Schema Shape

Core tables:

- `users`: `id`, `display_name`, metadata JSONB.
- `strategies`: `id`, `owner_user_id`, `name`, metadata JSONB, `archived_at`.
- `strategy_revisions`: `id`, `strategy_id`, `source`, `source_hash`, `source_bytes`, runtime metadata JSONB, validation JSONB, metadata JSONB, `locked_at`, `created_at`.
- `arena_variants`: `id`, `name`, `config` JSONB, `version`, metadata JSONB.
- `matches`: locked input fields, status, outcome JSONB, scoring fields, failure fields, timestamps.
- `match_sets`: status, preset/version, matrix JSONB, scoring JSONB, degraded flag, timestamps.
- `match_set_matches`: explicit membership/order rows mapping MatchSets to Matches.
- `chronicles`: `id`, `match_id`, `schema_version`, `hash`, `event_count`, `snapshot_count`, player/revision/arena metadata, `artifact` JSONB, timestamps.
- `match_jobs`: one active job per Match, status, attempts, lease fields, timestamps.
- `match_job_attempts`: attempt number, worker id, timestamps, status, error class/message, retryable flag, private stack/details JSONB.

Important constraints:

- Unique Chronicle per Match.
- Unique active job per Match.
- Match completion idempotency via status transition checks plus unique Chronicle linkage.
- Foreign keys from Matches to StrategyRevisions and ArenaVariants.
- Foreign keys from MatchSet membership rows to MatchSets and Matches.
- StrategyRevision source/validation content should not be mutated after use by Matches/MatchSets; enforce this in service APIs and tests. SQL triggers are optional in Phase 5 if repository tests cover the guard.

### Job Claiming Model

PostgreSQL can be sufficient for Phase 5 job claiming. Redis is present in local infra, but a DB-backed claim table keeps job status and Match state transactionally consistent and reduces the number of moving parts in v1.

Recommended claim query behavior:

- Find jobs where `status = 'queued'` or `status = 'running' AND lease_expires_at < now()`.
- Use `FOR UPDATE SKIP LOCKED`.
- Set `status = 'running'`, `worker_id`, `lease_token`, `lease_expires_at`, and increment/record attempt.
- A worker must complete only when its lease token still matches.
- Exhaust retries at a fixed limit of 3 attempts and mark the Match `FAILED_SYSTEM`.

Redis can remain available for future scaling, but Phase 5 does not need it to satisfy the requirements.

### Match Execution Flow

1. Load locked Match inputs and StrategyRevisions.
2. Build runtime objects with `createRuntimeFromRevision`.
3. Execute deterministic simulation through `buildChronicleFromMatch` so the full Chronicle includes boundary snapshots and private sections.
4. Validate Chronicle with `validateChronicle` and hash it with replay helpers.
5. Persist Match outcome and Chronicle artifact in one transaction.
6. Mark job complete only after both Match outcome and Chronicle storage are durable.

Runtime violations should stay inside Match/Chronicle events. Unexpected exceptions in orchestration, DB, Chronicle validation, or process-level execution are system failures and should retry.

### MatchSet Scoring

Use a deterministic score object with:

- `wins`
- `losses`
- `draws`
- `failedSystemMatches`
- `survivingSoldiers`
- `survivalTurns` or a phase/round/activation-derived survival measure
- stable tie-breaker keys such as strategy revision id and side label

Scoring should report degraded/incomplete when any constituent Match is `FAILED_SYSTEM`.

### Presets And Fixtures

Define tiered presets in `packages/persistence` or a small domain module it exports:

- `smoke-v1`: minimal curated arena list and fixed seed list.
- `standard-v1`: curated arena list, fixed seed list, mirrored side balance enabled.
- `stress-v1`: larger curated arena/seed list for slower validation.

Each generated MatchSet must persist the concrete matrix at creation time. Preset definitions are helpers, not the canonical truth after creation.

## Planning Risks

- `packages/map-configs` is skeletal, so Phase 5 may need to add concrete Arena Variant configs before MatchSet seeds can be meaningful.
- `packages/spec` has only IDs/types, not persistence statuses. Add persistence enums in `@cowards/persistence` first unless shared UI contracts need them now.
- Chronicle validation failures must be treated as system failures. Tests need to inject a bad Chronicle storage/build path without treating strategy runtime violations as system failures.
- Worker idempotency needs both database constraints and service guards. Do not rely on in-memory flags.

## Validation Architecture

Plan verification should require:

- Unit tests for migration ordering and schema idempotency.
- Repository tests for create/read/update status transitions, immutability guards, and unique Chronicle per Match.
- Service tests for Match creation, MatchSet matrix freezing, presets, and scoring.
- Worker tests proving:
  - strategy runtime violations complete as gameplay outcomes,
  - unexpected orchestration errors retry,
  - exhausted retries mark Match `FAILED_SYSTEM`,
  - lease expiry allows reclaim,
  - duplicate completion cannot create duplicate Chronicles.
- Integration smoke test using local PostgreSQL when `DATABASE_URL` is present, skipped with an explicit message when absent.

## Recommended Plan Split

1. Persistence package, migrations, schema, and seed foundation.
2. Match/MatchSet creation services and preset matrix freezing.
3. Chronicle storage adapter and metadata persistence.
4. Worker claim/execute/retry/idempotent completion.
5. MatchSet scoring/status aggregation and end-to-end seed/dev smoke path.
