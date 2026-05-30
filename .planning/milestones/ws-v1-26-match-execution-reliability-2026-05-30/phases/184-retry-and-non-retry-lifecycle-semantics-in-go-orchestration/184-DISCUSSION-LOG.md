# Phase 184: Retry and Non-Retry Lifecycle Semantics in Go Orchestration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 184-Retry and Non-Retry Lifecycle Semantics in Go Orchestration
**Areas discussed:** Retry split, retry bounds, public evidence

---

## Retry Split

| Option | Description | Selected |
|--------|-------------|----------|
| Split by layer | Retry transport/envelope/system failures; fail Strategy output and stale artifacts closed. | ✓ |
| Retry all malformed | Treat malformed service envelopes and malformed Strategy output as retryable. | |
| Fail all malformed | Treat every malformed/stale case as non-retryable. | |

**User's choice:** Confirmed recommended split-by-layer decision.
**Notes:** Carries forward from milestone initialization decision `2A`.

## Retry Bounds

| Option | Description | Selected |
|--------|-------------|----------|
| Existing job limits | Use configured `max_attempts` and lease-aware Go lifecycle. | ✓ |
| New broad policy | Introduce broader policy concepts before live drills. | |

**User's choice:** Confirmed recommended bounded Go lifecycle.
**Notes:** Retry must be deterministic and non-infinite.

## Public Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Public-safe categories | Project terminal failures through frozen lifecycle/failure categories. | ✓ |
| Raw diagnostics | Surface detailed runtime diagnostics publicly. | |

**User's choice:** Confirmed public-safe categories only.
**Notes:** Raw diagnostics remain private.

## the agent's Discretion

- Choose the internal representation for the retry matrix.

## Deferred Ideas

None.
