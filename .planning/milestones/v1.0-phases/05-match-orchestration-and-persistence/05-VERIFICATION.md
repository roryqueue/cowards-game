---
phase: 05-match-orchestration-and-persistence
status: passed
verified_at: 2026-05-17T23:11:40Z
score: 13/13 requirements verified
requirements:
  - id: MATCH-01
    status: verified
  - id: MATCH-02
    status: verified
  - id: MATCH-03
    status: verified
  - id: MATCH-04
    status: verified
  - id: MATCH-05
    status: verified
  - id: MATCH-06
    status: verified
  - id: MATCH-07
    status: verified
  - id: DATA-01
    status: verified
  - id: DATA-02
    status: verified
  - id: DATA-03
    status: verified
  - id: DATA-04
    status: verified_with_residual_risk
  - id: DATA-05
    status: verified
  - id: TEST-05
    status: verified
gaps: []
residual_risks:
  - "Live PostgreSQL smoke remains gated by DATABASE_URL in the default test run; the later Phase 7 gap-resolution pass exercised the database-backed browser flow with local PostgreSQL."
---

# Phase 05 Verification: Match Orchestration and Persistence

## Verdict

**Passed.** Phase 5's goal is achieved at the persistence/service/worker level: the code can create locked Matches and MatchSets, queue jobs, execute worker simulations through runtime plus engine, persist outcomes and Chronicles, classify system failures separately from strategy/runtime violations, and score MatchSets deterministically.

No blocking gaps were found for MATCH-01 through MATCH-07, DATA-01 through DATA-05, or TEST-05. The live database smoke path remains a residual deployment/integration risk because `DATABASE_URL` is not set in the default environment.

## Goal Check

**Phase goal:** Queue, execute, persist, and score Matches and MatchSets with correct failure semantics.

| Goal truth | Status | Evidence |
| --- | --- | --- |
| Matches can be created from immutable Strategy Revisions with locked seed, arena, and side assignment. | Verified | `createMatchService` validates seed and string IDs, reads revisions/arena, locks both revisions, inserts `matches`, and creates a queued `match_jobs` row in `packages/persistence/src/match-service.ts:31`. |
| MatchSets can be created from configured arena/seed/side matrices and persisted canonically. | Verified | `generatePresetMatrix` expands preset arenas/seeds with mirrored side assignments, while `insertMatchSetWithMatrix` validates every match, locks distinct revisions, stores `match_sets.matrix`, creates matches, jobs, and membership rows in `packages/persistence/src/matchset-service.ts:32`. |
| Worker claims jobs, executes runtime plus engine, persists completion, and attaches Chronicle references. | Verified | `runWorkerOnce` claims a job, loads persisted Match inputs, builds side-dispatched runtimes from Strategy Revisions, calls `buildChronicleFromMatch`, and completes the Match in `apps/worker/src/runner.ts:61`. Completion stores the Chronicle inside the lease-validated transaction in `packages/persistence/src/complete-match.ts:66`. |
| Failure semantics distinguish strategy/runtime violations from system failures. | Verified | Worker tests prove `RUNTIME_VIOLATION` Chronicles complete as gameplay while unexpected exceptions call `recordAttemptFailure`; retry exhaustion returns `failed_system`. Job failure SQL marks job and match `failed_system` only after exhaustion in `packages/persistence/src/jobs.ts:120`. |
| MatchSet scoring is deterministic. | Verified | `scoreMatchSet` aggregates wins, side-specific surviving Soldiers, side-specific survival turns, then stable StrategyRevision ID tie-breaker in `packages/persistence/src/scoring.ts:59`. |
| Local schema, migrations, and seed data support the Phase 5 domain. | Verified | SQL migrations define users, strategies, StrategyRevisions, ArenaVariants, Matches, MatchSets, Chronicles, jobs, attempts, indexes, and side completion stats in `packages/persistence/migrations/0001_initial.sql:25` and `0002_match_side_completion_stats.sql:1`. |

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/persistence/migrations/0001_initial.sql` | PostgreSQL schema for users, strategies, revisions, arenas, matches, match sets, Chronicles, jobs, and attempts. | Verified | Tables and indexes exist; match/job status enums include pending/running/complete/failed_system/blocked/degraded shapes. |
| `packages/persistence/src/match-service.ts` | Locked Match creation service. | Verified | Validates inputs, locks Strategy Revisions, inserts Match plus queued job. |
| `packages/persistence/src/matchset-service.ts` | MatchSet preset/matrix creation service. | Verified | Persists concrete matrix and membership rows; locks all used revisions. |
| `packages/persistence/src/chronicle-store.ts` | Chronicle artifact and metadata adapter. | Verified | Validates Chronicle, hashes normalized content, stores one artifact per Match, exposes lookup by Match ID. |
| `packages/persistence/src/jobs.ts` | Worker job claim/retry/failure primitives. | Verified | Uses `FOR UPDATE SKIP LOCKED`, leases, attempts, retry exhaustion, and failed-system persistence. |
| `packages/persistence/src/complete-match.ts` | Idempotent Match completion. | Verified | Requires valid running lease unless already complete; stores Chronicle and Match outcome fields in one transaction. |
| `apps/worker/src/runner.ts` | Worker orchestration. | Verified | Loads persisted Match input, creates worker-only runtimes, runs engine/replay, completes or records retryable system failure. |
| `packages/persistence/src/scoring.ts` and `matchset-status.ts` | Deterministic scoring/status aggregation. | Verified | Aggregates rankings, degraded status, `hasReplay`, and persisted MatchSet scoring. |
| `packages/persistence/src/dev-smoke.ts` | Local seed-to-status smoke helper. | Verified with residual risk | Migrates, seeds, creates a smoke MatchSet, optionally invokes queued work, refreshes status, and counts Chronicles. Live DB test is skipped without `DATABASE_URL`. |

## Requirements Coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| MATCH-01 | Verified | Single Match creation requires two StrategyRevision IDs, ArenaVariant ID, deterministic seed, and bottom/top player side assignment. |
| MATCH-02 | Verified | MatchSet service supports presets and explicit matrices across curated arenas, seeds, and mirrored side assignments. |
| MATCH-03 | Verified | Match and MatchSet creation lock Strategy Revisions before inserting executable Match rows. |
| MATCH-04 | Verified | Worker claim -> persisted input load -> runtime/engine/replay -> transactional completion/Chronicle storage is wired. |
| MATCH-05 | Verified | Unexpected worker errors are retryable system failures; retry exhaustion marks job and Match `failed_system`, not strategy loss. |
| MATCH-06 | Verified | Scoring orders by wins, cumulative side-specific surviving Soldiers, survival turns, then StrategyRevision ID. |
| MATCH-07 | Verified | Status constants, services, Workshop summaries, and `hasReplay` projection expose pending/running/complete/failed_system/blocked/degraded states. |
| DATA-01 | Verified | PostgreSQL migrations persist all required domain records and job/run metadata. |
| DATA-02 | Verified | Locked StrategyRevision content mutation guard rejects reproducibility-field updates after use. |
| DATA-03 | Verified | Chronicle metadata and full JSONB artifacts are stored and linked one-to-one by Match ID. |
| DATA-04 | Verified with residual risk | Seed helpers and dev smoke helper exist; live PostgreSQL smoke was not run because `DATABASE_URL` is unset. |
| DATA-05 | Verified | Migration runner reads ordered SQL files and records applied filenames in `schema_migrations`. |
| TEST-05 | Verified | Worker runner tests cover strategy/runtime violation completion separately from unexpected system-failure retry/exhaustion behavior. |

## Integration/Data Flow

| Flow | Status | Evidence |
| --- | --- | --- |
| Creation service -> database -> job queue | Verified | `createMatchService` and `createMatchSetService` insert `matches` and `match_jobs` in transactions. |
| Job queue -> worker -> runtime/engine/replay | Verified | `claimNextMatchJob` leases jobs; `runWorkerOnce` loads persisted revisions/arena/seed/player IDs and calls `buildChronicleFromMatch`. |
| Worker completion -> Chronicle store -> Match rows | Verified | `completeMatch` validates the running lease, stores Chronicle through `createPostgresChronicleStore`, updates outcome/stat fields, and marks job attempt complete. |
| Match rows -> MatchSet scoring/status | Verified | `refreshMatchSetStatus` loads constituent Matches in matrix order, maps winner player IDs back to side Strategy Revisions, scores, and persists MatchSet status/scoring. |
| Workshop status display path | Verified | `getWorkshopTestSummary` refreshes status and returns matches with `hasReplay`; web client maps pending/running/complete/failed_system/blocked/degraded statuses. |
| Full service-backed browser worker helper | Verified by Phase 7 closure | `/api/test-support/run-worker-once` now invokes a gated one-shot worker process in test mode, and `workshop-to-replay.spec.ts` requires a 200 `{ status: "ok" }` helper response. The full service-backed browser flow passed on 2026-05-17 with local PostgreSQL and migrations applied. |

## Automated Checks

| Command | Result |
| --- | --- |
| `pnpm --filter @cowards/persistence test -- migrations.test.ts match-service.test.ts matchset-service.test.ts chronicle-store.test.ts jobs.test.ts complete-match.test.ts scoring.test.ts dev-smoke.test.ts` | Passed: 9 files, 28 tests passed, 1 skipped. |
| `pnpm --filter @cowards/worker test -- runner.test.ts` | Passed: 1 file, 5 tests passed. |
| `pnpm --filter @cowards/persistence typecheck && pnpm --filter @cowards/worker typecheck` | Passed. |
| `pnpm --filter @cowards/persistence test -- workshop.test.ts` | Passed; Vitest ran the persistence suite pattern with 9 files, 28 tests passed, 1 skipped. |
| `DATABASE_URL` environment check | `DATABASE_URL not set`; live PostgreSQL smoke was not run. |

## Residual Risk

- Live PostgreSQL smoke remains optional for normal local unit runs. During the Phase 7 gap-resolution pass, local PostgreSQL was started, migrations were applied, and the Workshop edit -> execute -> replay Playwright smoke passed against the database.
- `dev-smoke.test.ts` has a skipped integration test and uses an optional `runQueuedMatch` callback; without a real worker callback it does not prove Chronicle creation against a live DB.
- REQUIREMENTS.md body checkboxes for Phase 5 are now aligned with the passed verification and traceability table.

## Gaps Summary

No blocking Phase 5 gaps found. The phase goal is satisfied by substantive, wired implementation and focused tests. The remaining risks are integration-certification issues around live services and the later browser E2E harness, not missing Phase 5 orchestration or persistence behavior.

---

_Verified: 2026-05-17T23:11:40Z_
_Verifier: Codex gsd-verifier_
