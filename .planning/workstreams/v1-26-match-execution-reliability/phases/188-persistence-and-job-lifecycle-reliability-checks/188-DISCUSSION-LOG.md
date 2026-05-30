# Phase 188: Persistence and Job Lifecycle Reliability Checks - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 188-Persistence and Job Lifecycle Reliability Checks
**Areas discussed:** Idempotency, persistence privacy, integration coverage

---

## Idempotency

| Option | Description | Selected |
|--------|-------------|----------|
| Cover stale and duplicate writers | Require checks for stale leases, duplicate failures, duplicate completion, and terminal rewrites. | ✓ |
| Happy-path only | Rely on existing job lifecycle behavior without new edge coverage. | |

**User's choice:** Confirmed recommended stale/duplicate writer coverage.
**Notes:** Reliability proof needs late-worker and duplicate-attempt safety.

## Persistence Privacy

| Option | Description | Selected |
|--------|-------------|----------|
| Allowlisted scalars only | Persist only public-safe scalar failure details. | ✓ |
| Store rich diagnostics | Persist raw diagnostics for easier debugging. | |

**User's choice:** Confirmed allowlisted scalars only.
**Notes:** Raw diagnostics must remain private.

## Integration Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Local Postgres where needed | Use integration tests/drills for transaction semantics. | ✓ |
| Pure unit only | Avoid database-backed tests. | |

**User's choice:** Confirmed local Postgres where needed.
**Notes:** Existing gated Go integration test pattern should be reused.

## the agent's Discretion

- Pick the most focused test/helper additions.

## Deferred Ideas

None.
