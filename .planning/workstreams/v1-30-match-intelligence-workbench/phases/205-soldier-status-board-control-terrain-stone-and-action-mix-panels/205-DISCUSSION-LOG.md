# Phase 205: Soldier Status, Board-Control, Terrain/Stone, and Action-Mix Panels - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 205-soldier-status-board-control-terrain-stone-and-action-mix-panels
**Areas discussed:** Tactical panels and board emphasis

---

## Panel Set

| Option | Description | Selected |
|--------|-------------|----------|
| Four tactical panels | Soldier progression, board control, terrain/stone occupancy, and action mix. | ✓ |
| Single tactical summary | Simpler but too thin for Phase 205 requirements. | |
| Broad analysis dashboard | Too large and risks scope creep. | |

**User's choice:** `confirm 205`
**Notes:** User confirmed the recommended default.

---

## Overlay Stance

| Option | Description | Selected |
|--------|-------------|----------|
| Lightweight if stable | Category highlighting, occupancy tint, or key sequence markers only if mobile-safe. | ✓ |
| Complex layered map | Too much for this phase and higher visual proof risk. | |
| No board emphasis ever | Safe but may underserve replay tactical inspection. | |

**User's choice:** `confirm 205`
**Notes:** The planner can defer overlays if mobile proof risk is high.

---

## Board-Control Model

| Option | Description | Selected |
|--------|-------------|----------|
| Transparent public heuristics | Active/STONE count, center/edge presence, contraction pressure, occupied regions, engagement proximity. | ✓ |
| Abstract dominance score | Compact but too easy to overstate. | |
| Hidden Strategy analysis | Rejected as private/intent-based. | |

**User's choice:** `confirm 205`
**Notes:** Copy should describe signals, not definitive strategic dominance.

---

## Sparse Replay Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Section-level limitations | Keep panels visible with "not enough public evidence" rows. | ✓ |
| Hide weak panels | Cleaner but inconsistent across fixtures. | |
| Fill zeros | Misleading when data is absent rather than genuinely zero. | |

**User's choice:** `confirm 205`
**Notes:** Continues the Phase 201-204 low-signal stance.

---

## the agent's Discretion

- Exact panel order, metric names, visual encoding, board region definitions, and whether lightweight emphasis ships are left to the agent/planner.

## Deferred Ideas

- Complex layered tactical-map overlays.
