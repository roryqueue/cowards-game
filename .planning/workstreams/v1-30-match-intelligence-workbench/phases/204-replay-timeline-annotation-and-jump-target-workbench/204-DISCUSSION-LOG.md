# Phase 204: Replay Timeline Annotation and Jump-Target Workbench - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 204-replay-timeline-annotation-and-jump-target-workbench
**Areas discussed:** Replay annotations and jump targets

---

## Annotation Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Inline plus Key Moments | Show annotations in the existing timeline/event list and add compact quick-jump navigation. | ✓ |
| Separate annotation page | More space but splits replay inspection. | |
| Only result-page links | Too thin for replay workbench requirements. | |

**User's choice:** `confirm 204`
**Notes:** User confirmed the recommended default.

---

## Initial Categories

| Option | Description | Selected |
|--------|-------------|----------|
| Tactical event set | `FALLEN`, `STONE`, `BACKSTAB`, `PUSH`, `CONTRACTION`, `NO_ADVANCE_CLEANUP`, `DECISIVE_PUSH`, `LATE_CYCLE_STABILIZATION`. | ✓ |
| Minimal existing moments only | Lower effort but too narrow for v1.30 ambition. | |
| Open-ended categories | Risky and harder to keep public-safe. | |

**User's choice:** `confirm 204`
**Notes:** Categories must map to public event or derived public evidence.

---

## Jump Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Query-driven focus | Use `moment` and/or `sequence`, preserving existing fallback behavior. | ✓ |
| Client-only selection | Easier but weaker for result-page deep links. | |
| New route format | Not needed and risks churn. | |

**User's choice:** `confirm 204`
**Notes:** Jump targets must not require private identifiers.

---

## Filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Lightweight if mobile-safe | Category toggles/chips only if they do not crowd mobile; otherwise use emphasis. | ✓ |
| Full filtering controls | Powerful but may overburden mobile layout. | |
| No category affordance | Too little control for a tactical workbench. | |

**User's choice:** `confirm 204`
**Notes:** The planner can choose emphasis over controls if mobile proof risk is high.

---

## the agent's Discretion

- Exact visual affordance, chip/icon labels, key moment ordering, and whether filters ship or defer are left to the agent/planner.

## Deferred Ideas

- Full replay board tactical overlays and tactical panels belong to Phase 205.
