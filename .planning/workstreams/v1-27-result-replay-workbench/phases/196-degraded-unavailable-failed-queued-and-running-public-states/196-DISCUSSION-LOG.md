# Phase 196: Degraded, Unavailable, Failed, Queued, and Running Public States - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 196-Degraded, Unavailable, Failed, Queued, and Running Public States
**Areas discussed:** State Granularity, Replay Unavailable Handling, Fallback Rule

---

## State Granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated treatment for every category | queued, running, degraded, complete, strategy failure, system failure, timeout, unavailable runtime, malformed runtime result, stale artifact, blocked, missing Chronicle, and no-result each have explicit public-safe copy/tests. | ✓ |
| Dedicated only for current fixtures | Cover the v1.25 fixture catalog exactly; add other categories later if exposed. | |
| Group by broad status | Pending/complete/failed/degraded/unavailable only. Simpler, but risks misleading generic failures. | |

**User's choice:** Dedicated treatment for every lifecycle/failure category.
**Notes:** The frozen contract already names these categories, and v1.27 is about evidence readability.

---

## Replay Unavailable Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Public-safe unavailable panel | Show a clear nonblank state with lifecycle, replay availability, reason category, and privacy/provenance copy. No board placeholder that looks like failed rendering. | ✓ |
| Disabled replay links only | Keep users on result page; no replay unavailable page unless directly opened. | |
| Generic not-found | Treat missing replay like any missing page. Safe, but not evidence-readable. | |

**User's choice:** Public-safe unavailable panel.
**Notes:** This makes unavailable replay states inspectable without misleading users or leaking internals.

---

## Fallback Rule

| Option | Description | Selected |
|--------|-------------|----------|
| Fail closed with explicit test failure | Unknown state should fail schema/view-model tests and render a safe unavailable/not-found shape rather than generic evidence. | ✓ |
| Render generic unavailable | Safer at runtime, but can hide contract drift. | |
| Best-effort generic failure copy | Keeps pages alive, but risks misleading public evidence. | |

**User's choice:** Fail closed with explicit test failure.
**Notes:** This preserves the v1.25 fail-closed posture for stale/unversioned payloads.

---

## the agent's Discretion

- The agent may choose exact state copy strings and unavailable panel layout.

## Deferred Ideas

None.
