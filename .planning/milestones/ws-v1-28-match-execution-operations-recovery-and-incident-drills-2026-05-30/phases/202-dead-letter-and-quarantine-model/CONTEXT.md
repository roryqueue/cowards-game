# Phase 202 Context: Dead-Letter and Quarantine Model

**Milestone:** v1.28 Match Execution Operations, Recovery, and Incident Drills
**Phase:** 202
**Status:** Context captured
**Date:** 2026-05-30

## Decisions

- Implement quarantine as private Postgres state, not as a new public Match, MatchSet, or app lifecycle state.
- Keep `match_jobs`, `match_job_attempts`, `matches`, and `chronicles` as the source of truth.
- Write quarantine records in the same Go transaction that marks a job and Match terminal failed.
- Quarantine retry-exhausted and non-retryable terminal execution jobs only.
- Store only redacted operator evidence using allowlisted scalar fields and sanitized nested failure details.
- Do not expose quarantine through public result/replay DTOs in Phase 202.

## Constraints

- `match-execution-app-v1` remains frozen.
- No Strategy source fallback, mutable artifact rebuild, or Strategy execution in web/API/Go.
- Runtime-service remains the hostile Strategy execution boundary only.
- Phase 202 should not add public UI or public admin routes.

## Downstream Guidance

Phase 203 can build requeue/rerun controls on top of the private quarantine table. Those controls must keep idempotency and terminal-state guards rather than directly mutating public result/replay state.
