# Phase 11: Doctrine Debugging UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 11-Doctrine Debugging UX
**Areas discussed:** Explanation style, Debug overlay visibility, Sample strategies, Workshop replay links, Validation messaging

---

## Explanation Style

| Option | Description | Selected |
|--------|-------------|----------|
| Cause labels plus short human copy | Structured cause codes with concise labels/user messages. | ✓ |
| Narrative explanations | Longer generated-style explanation copy. | |
| Raw events only | Let users infer from timeline and payloads. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Cause coverage must include not selected, invalid action, blocked movement, timeout, thrown exception, STONE, FALLEN, and Match ended.

---

## Debug Overlay Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Owner-only and opt-in | Rich debug overlays require owner/debug mode and never appear publicly. | ✓ |
| Always visible to owner | Show automatically for owners. | |
| Public summaries | Show simplified debug explanations publicly. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Keep public replay clean and privacy-safe.

---

## Sample Strategies

| Option | Description | Selected |
|--------|-------------|----------|
| Teach mechanics and failures | Include useful pattern and failure-mode samples. | ✓ |
| Mechanics only | Avoid failure examples in Workshop samples. | |
| Minimal samples | Keep only one or two basic templates. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Samples should also be useful as test inputs where practical.

---

## Workshop Replay Links

| Option | Description | Selected |
|--------|-------------|----------|
| Direct and status-aware | Show links only when replay exists; explain unavailable states. | ✓ |
| Always show disabled links | Keep replay affordance present for every status. | |
| Keep current behavior | Avoid changing replay link/status behavior. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Pending/running/failed states should explain why replay is unavailable.

---

## Validation Messaging

| Option | Description | Selected |
|--------|-------------|----------|
| Actionable, not verbose | Name constraint and one remediation step, link/reference docs as needed. | ✓ |
| Full inline docs | Explain API constraints in detail inside the UI. | |
| Current terse errors | Keep validation messages mostly as-is. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Avoid long docs dumps inside the UI.

## the agent's Discretion

- Exact copy, DTO names, component placement, and sample source text are left to research and planning.

## Deferred Ideas

None.
