---
phase: 05
status: passed
verified_at: 2026-05-16T18:58:25.037Z
requirements:
  - MATCH-01
  - MATCH-02
  - MATCH-03
  - MATCH-04
  - MATCH-05
  - MATCH-06
  - MATCH-07
  - DATA-01
  - DATA-02
  - DATA-03
  - DATA-04
  - DATA-05
  - TEST-05
---

# Phase 05 Verification: Match Orchestration and Persistence

## Verdict

Passed.

## Goal Check

Phase goal: queue, execute, persist, and score Matches and MatchSets with correct failure semantics.

Implemented:

- `@cowards/persistence` package with PostgreSQL connection helpers, repeatable SQL migrations, schema constants, repositories, creation services, Chronicle storage, job primitives, completion service, scoring, and dev smoke helper.
- Curated Arena Variant exports in `@cowards/map-configs`.
- Worker runner that claims jobs, builds locked Match input, runs runtime/engine/replay, completes Matches, and records retryable system failures.
- Tests covering migration shape, seed data, Match creation contracts, MatchSet presets/matrix generation, Chronicle storage metadata/idempotency, job retry decisions, completion fields, worker failure classification, and MatchSet scoring.

## Requirement Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| MATCH-01 | Passed | `createMatchService` requires two StrategyRevision IDs, ArenaVariant ID, seed, and explicit side assignment. |
| MATCH-02 | Passed | `createMatchSetService` creates MatchSets from explicit matrices or versioned presets with curated arenas and side assignments. |
| MATCH-03 | Passed | Match creation locks StrategyRevisions and stores seed, arena, and side assignment before execution. |
| MATCH-04 | Passed | Worker runner claims jobs, executes simulation through runtime/engine/replay, persists Match completion, and stores Chronicles. |
| MATCH-05 | Passed | Job primitives retry system failures up to fixed limit and mark exhausted jobs/Matches `failed_system`. |
| MATCH-06 | Passed | `scoreMatchSet` orders by wins, surviving Soldiers, survival turns, then StrategyRevision id. |
| MATCH-07 | Passed | Match, MatchSet, and job status constants and status refresh paths include pending/running/complete/failed/degraded states. |
| DATA-01 | Passed | SQL schema persists Users, Strategies, StrategyRevisions, ArenaVariants, Matches, MatchSets, Chronicle metadata/artifacts, jobs, and attempts. |
| DATA-02 | Passed | Repository guard rejects locked StrategyRevision content mutation while allowing metadata-only changes. |
| DATA-03 | Passed | Chronicle adapter stores full artifacts and metadata by Match id. |
| DATA-04 | Passed | `createDevelopmentSeedData` and `runDevelopmentMatchSetSmoke` provide local seed/dev paths. |
| DATA-05 | Passed | Migration runner applies ordered SQL files and records them in `schema_migrations`. |
| TEST-05 | Passed | Worker tests distinguish `RUNTIME_VIOLATION` gameplay completion from unexpected system failure retry. |

## Automated Checks

```bash
pnpm verify
```

Passed:

- Prettier format check
- ESLint across all packages/apps
- TypeScript typecheck across all packages/apps
- Vitest suites across all packages/apps

## Review

`05-REVIEW.md` status: clean.

Two review findings were fixed before verification:

- Chronicle persistence now happens after lease validation inside the completion transaction.
- Chronicle metadata derives player IDs from Chronicle events instead of fixed placeholders when available.

## Residual Risk

- PostgreSQL integration smoke test is intentionally skipped unless `DATABASE_URL` is provided. The default fast suite validates contracts and SQL shape, but a live DB smoke run should be used before deployment.
