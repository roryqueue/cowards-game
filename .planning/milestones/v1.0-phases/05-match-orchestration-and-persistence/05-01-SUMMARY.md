---
phase: 5
plan: 05-01
status: complete
requirements-completed: [DATA-01, DATA-04, DATA-05]
---

# Plan 05-01 Summary: Persistence Package, SQL Schema, Migrations, and Seeds

## Status

Complete.

## What Changed

- Added the `@cowards/persistence` workspace package.
- Added PostgreSQL connection helpers and a transaction helper.
- Added a repeatable SQL migration runner using `schema_migrations`.
- Added initial SQL schema for users, strategies, strategy revisions, arena variants, matches, match sets, Chronicle metadata, jobs, and attempts.
- Added persistence status constants and the default retry limit.
- Added deterministic development seed data using immutable Strategy Revisions.
- Added static migration and seed tests.

## Verification

```bash
pnpm --filter @cowards/persistence test -- migrations.test.ts
pnpm --filter @cowards/persistence typecheck
```

Both commands passed.

## Key Files Created

- `packages/persistence/package.json`
- `packages/persistence/migrations/0001_initial.sql`
- `packages/persistence/src/db.ts`
- `packages/persistence/src/migrations.ts`
- `packages/persistence/src/schema.ts`
- `packages/persistence/src/seed.ts`
- `packages/persistence/src/migrations.test.ts`

## Deviations

- Created the package shell before running `pnpm add`, because `pnpm --filter @cowards/persistence` cannot target a package that does not exist yet.
