# Phase 185: Runtime Unavailable and Stopped-Service Live Drills - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 185-Runtime Unavailable and Stopped-Service Live Drills
**Areas discussed:** Proof scope, unavailable classification, cleanup

---

## Proof Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Local live drills | Use local Postgres, Go, runtime-service, run-once commands, pages, and leak scans. | ✓ |
| Test harness only | Use mostly unit/integration tests without live orchestration. | |
| Full UX expansion | Expand result/replay UX beyond proof pages. | |

**User's choice:** Confirmed local live drills.
**Notes:** Carries forward from milestone initialization decision `3A`.

## Unavailable Classification

| Option | Description | Selected |
|--------|-------------|----------|
| Retry while attempts remain | Stopped/unavailable runtime-service is retryable until bounded attempts exhaust. | ✓ |
| Immediate terminal | Treat stopped runtime-service as immediately non-retryable. | |

**User's choice:** Confirmed retry-while-attempts-remain.
**Notes:** Exhaustion must become terminal public-safe system failure.

## Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Require cleanup proof | Verify no orphaned running jobs, stale leases, or duplicate refreshes. | ✓ |
| Artifact only | Record outcome without cleanup/idempotency checks. | |

**User's choice:** Confirmed cleanup proof.
**Notes:** Repeatable drills are part of reliability, not a nice-to-have.

## the agent's Discretion

- Select the smallest reliable local live topology.

## Deferred Ideas

None.
