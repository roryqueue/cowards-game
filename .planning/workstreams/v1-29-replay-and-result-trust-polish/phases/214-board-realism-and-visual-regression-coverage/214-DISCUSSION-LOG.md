# Phase 214: Board Realism and Visual Regression Coverage - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 214-board-realism-and-visual-regression-coverage
**Areas discussed:** Board realism, visual regression, design boundary

---

## Board Realism

| Option | Description | Selected |
|--------|-------------|----------|
| Strengthen existing realism checks | Build on current in-bounds, canonical start, FALLEN, overlap, and nonblank checks | yes |
| Rework board rules | Change replay or engine semantics while improving visuals | |

**User's choice:** Carry forward AGENTS.md testing expectations and hard engine boundary.
**Notes:** Do not put game rules in React components.

---

## Visual Regression

| Option | Description | Selected |
|--------|-------------|----------|
| Cover trust surfaces | Add snapshots/pixel checks for replay trust, unavailable states, result evidence layouts | yes |
| Board-only visuals | Keep visual proof limited to board callouts | |

**User's choice:** Agent recommendation accepted.
**Notes:** v1.29 is about trust surfaces, not only board drawing.

---

## Design Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Dense stable UI | Keep result/replay evidence utilitarian and responsive | yes |
| Decorative redesign | Redesign pages with marketing-style visuals | |

**User's choice:** Carry forward frontend design guidance and existing app patterns.
**Notes:** Avoid nested cards and layout shifts.

## the agent's Discretion

- Exact test split between Playwright visual, pixel checks, and unit tests.
- Snapshot names and proof artifact shape.

## Deferred Ideas

None.
