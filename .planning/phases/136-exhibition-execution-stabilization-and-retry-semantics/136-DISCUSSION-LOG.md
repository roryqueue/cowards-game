# Phase 136: Exhibition Execution Stabilization and Retry Semantics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 136-exhibition-execution-stabilization-and-retry-semantics
**Areas discussed:** Stabilization boundary, retry behavior, ownership

---

## Stabilization Boundary

| Option | Description | Selected |
| --- | --- | --- |
| Practical bounded stabilization | Improve avoidable latency without weakening deterministic caps or boundaries. | yes |
| Per-call cap loosening | Increase Python Strategy caps for reliability. | |
| No stabilization | Only measure and document current latency. | |

**User's choice:** Practical bounded stabilization, inheriting the Phase 135 outer-budget-only decision.

---

## Retry Behavior

| Option | Description | Selected |
| --- | --- | --- |
| System failures only | Retry explicit transient/system/runtime-service/container failures. | yes |
| Retry everything | Retry Strategy runtime violations too. | |
| Never retry | Disable retry behavior for proof simplicity. | |

**User's choice:** System failures only.

---

## Ownership

| Option | Description | Selected |
| --- | --- | --- |
| Go-owned lifecycle | Go owns completion, scoring, retry policy, status, and public evidence. | yes |
| Runtime-owned retry | Runtime service decides job retry policy. | |
| Python-owned fallback | Python manages exhibition lifecycle. | |

**User's choice:** Go-owned lifecycle.

## the agent's Discretion

- Exact stabilization tactics depend on Phase 135 measurements.

## Deferred Ideas

- Python backend ownership.
- Retrying player-caused Strategy failures as infrastructure failures.
