# Phase 175: Canonical Match Lifecycle State Machine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 175-Canonical Match Lifecycle State Machine
**Areas discussed:** Lifecycle states, Retryability, Degraded semantics, Failure categories

---

## Retryability

| Option | Description | Selected |
|--------|-------------|----------|
| Field on lifecycle/failure evidence | Keep states focused on lifecycle and model retryability as `retryDisposition`. | ✓ |
| Top-level states | Treat `retryable` and `non-retryable` as lifecycle states. | |

**User's choice:** Confirmed retryability as a field.
**Notes:** This keeps lifecycle state and orchestration disposition separate.

---

## Degraded Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Terminal partial public evidence | `degraded` means partial trustworthy evidence, not a clean counted outcome by default. | ✓ |
| Counted success variant | Allow degraded results to behave like clean counted outcomes. | |

**User's choice:** Confirmed degraded as terminal partial public evidence.
**Notes:** This prevents runtime/system uncertainty from being silently promoted into scoring certainty.

---

## Failure Categories

| Option | Description | Selected |
|--------|-------------|----------|
| Distinct public categories | Distinguish strategy failure, system failure, timeout, runtime unavailable, malformed result, stale artifact, blocked, missing Chronicle, and no result. | ✓ |
| Generic failure | Collapse failures into a single public failed state. | |

**User's choice:** Confirmed distinct public failure categories.
**Notes:** Strategy failure can be a valid Match result only when game/rules semantics say so; system failures must not masquerade as game outcomes.

## the agent's Discretion

- Exact enum names may be normalized during implementation, provided semantics remain equivalent and documented.

## Deferred Ideas

- Page copy and fixture generation are deferred to later phases.
