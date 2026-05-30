# Phase 183: v1.25 Contract Baseline and Execution-Side Drift Inventory - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 183-v1.25 Contract Baseline and Execution-Side Drift Inventory
**Areas discussed:** Contract baseline, ownership calibration, inventory shape

---

## Contract Baseline

| Option | Description | Selected |
|--------|-------------|----------|
| No additions | Keep `match-execution-app-v1` frozen unless inventory proves a necessary backward-compatible addition. | ✓ |
| Optional fields | Permit public-safe optional additions proactively. | |
| New version | Create a new app-facing contract version. | |

**User's choice:** Confirmed recommended no-additions default.
**Notes:** This carries forward from milestone initialization decision `1A`.

## Ownership Calibration

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve v1.25 split | Go owns orchestration/retry/public evidence; runtime-service owns hostile execution only. | ✓ |
| Rebalance ownership | Revisit which layer owns retry/evidence behavior. | |

**User's choice:** Confirmed recommended preservation of v1.25 ownership boundaries.
**Notes:** No Strategy execution in web/API/Go and no runtime-service backend authority.

## Inventory Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Contract-to-emitter inventory | Classify surfaces and trace public outcome emitters. | ✓ |
| Narrative-only summary | Summarize risks without exhaustive surface classification. | |

**User's choice:** Confirmed recommended contract-to-emitter inventory.
**Notes:** Must cover unavailable, degraded, system failure, malformed runtime result, stale artifact, timeout, retryable, and non-retryable paths.

## the agent's Discretion

- Choose the clearest inventory format and include machine-checkable structure if it fits existing monitor patterns.

## Deferred Ideas

None.
