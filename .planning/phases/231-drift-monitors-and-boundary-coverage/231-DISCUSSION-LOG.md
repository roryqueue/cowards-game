# Phase 231: Drift Monitors and Boundary Coverage - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 231-Drift Monitors and Boundary Coverage
**Areas discussed:** Monitor conversion, special-case policy

---

## Monitor Conversion

| Option | Description | Selected |
|--------|-------------|----------|
| Convert to positive parity monitors | Preserve guard strength while changing the intended language-support truth. | X |
| Delete non-promotion monitors | Fast but loses the safety wall. | |

**User's choice:** Convert to positive parity monitors.
**Notes:** Explicitly approved in shared defaults.

---

## Special-Case Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Narrow allowlist | Allow specialization only inside provider/adapter boundaries. | X |
| Broad app-level switches | Reintroduces drift across product surfaces. | |

**User's choice:** Narrow allowlist.
**Notes:** Product code should ask provider questions.

## The Agent's Discretion

- Define exact allowlist and monitor implementation details.

## Deferred Ideas

- External sandbox certification review.
