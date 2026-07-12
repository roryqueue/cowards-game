---
phase: 251-season-lifecycle-and-scheduling-policy
plan: 02
subsystem: persistence
tags: [season, scheduling, transaction, idempotency, snapshots]
requires: [251-01]
provides:
  - Monotonic audited Season status mutation
  - Shared Season row lock for entry and scheduling
  - Caller-owned MatchSet insertion transaction
  - Atomic idempotent scheduling and insufficient-evidence completion
affects: [251-03, 252, 255]
requirements-completed: [SEAS-02, SEAS-04, SEAS-05]
completed: 2026-07-11
---

# Phase 251 Plan 02 Summary

## Accomplishments

- Enforced the spec transition graph under `FOR UPDATE`, set `closed_at` on the entry freeze boundary, and made repeated same-state requests no-ops.
- Moved counted entry onto the same Season row lock, retaining constraint-specific recovery through a PostgreSQL savepoint.
- Extracted `insertMatchSetWithMatrixOnClient` so scheduling can compose all MatchSet rows into its outer transaction while existing callers retain standalone transactions.
- Made scheduling lock/freeze/read/create/write/finalize one transaction and return an existing completed/no-op run instead of duplicating MatchSets.
- Added a public `insufficient_evidence` completion path with a no-op run for below-minimum Seasons.
- Added transition, close, rollback, insufficient-evidence, freeze-order, and idempotency tests.

## Commit

- `1563123` - Make Season scheduling atomic and share the Season lock with counted entry.

## Verification

- Persistence typecheck passed.
- `pnpm exec vitest run packages/persistence/src/ladder.test.ts packages/persistence/src/competition.test.ts` - 45 tests passed.
- `git diff --check` passed before commit.

## Boundaries

Scheduling consumes stored immutable snapshots only. No game rule, result classifier, standings scoring, governance, or Strategy execution ownership changed.
