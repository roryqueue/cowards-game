# Phase 206: Degraded, Unavailable, Queued, Running, Failed, and Missing-Chronicle Intelligence States - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 206-degraded-unavailable-queued-running-failed-and-missing-chronicle-intelligence-states
**Areas discussed:** Public intelligence state coverage

---

## State Taxonomy

| Option | Description | Selected |
|--------|-------------|----------|
| Specific state taxonomy | Distinct states for queued, running, degraded, unavailable/failure categories, no-result, missing/invalid Chronicle. | ✓ |
| Generic unavailable/failed buckets | Simpler but loses useful public explanation. | |
| Derive ad hoc in UI | Risky and harder to test consistently. | |

**User's choice:** `confirm 206`
**Notes:** User confirmed the recommended default.

---

## Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Visible but limited | Keep Match Intelligence visible with state-specific limitations for all states. | ✓ |
| Hide when unavailable | Cleaner but less useful and inconsistent with fixture coverage goal. | |
| Fake tactical state | Rejected because it invents evidence. | |

**User's choice:** `confirm 206`
**Notes:** Continues the prior low-signal stance.

---

## Replay Unavailable Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Explain and route back | Show why annotations/intelligence are unavailable and link back to result evidence where useful. | ✓ |
| Blank workbench | Misleading and poor UX. | |
| Fake board/timeline | Rejected as false evidence. | |

**User's choice:** `confirm 206`
**Notes:** Replay unavailable pages should not render fake tactical panels.

---

## Copy Style

| Option | Description | Selected |
|--------|-------------|----------|
| Public evidence language | "pending/missing/withheld/unusable" without private/internal field names. | ✓ |
| Internal category details | Too leaky for public output. | |
| Vague generic copy | Safer but less useful. | |

**User's choice:** `confirm 206`
**Notes:** Copy must stay terse, specific, and public-safe.

---

## the agent's Discretion

- Exact copy strings, helper names, and table-driven vs composed implementation are left to the agent/planner.

## Deferred Ideas

None.
