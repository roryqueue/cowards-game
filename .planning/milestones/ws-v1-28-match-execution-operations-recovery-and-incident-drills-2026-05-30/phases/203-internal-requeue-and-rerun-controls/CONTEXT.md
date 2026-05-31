# Phase 203 Context: Internal Requeue and Rerun Controls

**Milestone:** v1.28 Match Execution Operations, Recovery, and Incident Drills
**Phase:** 203
**Status:** Context captured
**Date:** 2026-05-30

## Decisions

- Internal requeue/rerun controls operate through Go-owned lifecycle transactions.
- Controls are internal-token gated and not public product routes.
- Recovery is eligible only for active quarantined terminal failed jobs without existing Chronicles.
- Stale artifact and malformed runtime result categories are not recoverable in Phase 203.
- Requeue/rerun grants one additional operator-authorized attempt by increasing `max_attempts` to at least `attempts + 1`; it does not reset attempts.
- Idempotency is stored in private `match_execution_operator_actions`.

## Constraints

- No public result/replay contract change.
- No replacement Match/MatchSet semantics in v1.28 Phase 203.
- No source fallback, artifact rebuild, or Strategy execution in Go/web/API.
- Runtime-service remains execution-only; it does not own recovery policy.
