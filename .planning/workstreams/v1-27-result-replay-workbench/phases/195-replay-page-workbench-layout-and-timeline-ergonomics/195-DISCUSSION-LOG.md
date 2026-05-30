# Phase 195: Replay Page Workbench Layout and Timeline Ergonomics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 195-Replay Page Workbench Layout and Timeline Ergonomics
**Areas discussed:** Desktop Layout, Timeline Control, Mobile Layout, Owner Debug

---

## Desktop Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Board-centered tri-pane | Board stays central, metadata/evidence on one side, inspector/event details on the other, timeline below or near the board. Keeps spatial state dominant. | ✓ |
| Timeline-centered layout | Event list and timeline dominate, board is a preview. Good for logs, weaker for replay realism. | |
| Evidence-centered layout | Evidence panels dominate, board/timeline are supporting. Good for trust review, less useful for Match inspection. | |

**User's choice:** Board-centered tri-pane.
**Notes:** Replay is fundamentally spatial, and board realism is a milestone proof goal.

---

## Timeline Control

| Option | Description | Selected |
|--------|-------------|----------|
| Range scrubber plus grouped event list | Keep the slider for fast movement, and improve grouped event rows for precise jumps by Round/Activation/Cycle/sequence. | ✓ |
| Event list only | Remove reliance on the slider and make event rows the primary navigation. More precise, less fluid. | |
| Slider only with richer current-position panel | Simpler surface, but weak for inspecting tactical moments. | |

**User's choice:** Range scrubber plus grouped event list.
**Notes:** This fits the existing code and gives both fast scanning and precise inspection.

---

## Mobile Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Board first, controls sticky/nearby, evidence below | Keep board visible first, playback/timeline immediately reachable, inspector/evidence stacked below. | ✓ |
| Tabs for Board / Timeline / Evidence | Cleaner but heavier interaction; can hide context while inspecting. | |
| Single long stack in current order | Least work, but likely weak ergonomics and overlap risk. | |

**User's choice:** Board first, controls sticky/nearby, evidence below.
**Notes:** Mobile still needs the board to anchor replay inspection.

---

## Owner Debug

| Option | Description | Selected |
|--------|-------------|----------|
| Gated collapsible secondary panel | Owner debug stays hidden by default, only appears when server/test gating says it can, and remains visually secondary to public replay evidence. | ✓ |
| Separate owner debug route | Strong separation, but bigger scope and less useful for current workbench iteration. | |
| Inline but disabled for public mode | Simpler, but risks public output including debug affordances. | |

**User's choice:** Gated collapsible secondary panel.
**Notes:** Preserves the existing gating pattern while keeping default public output clean.

---

## the agent's Discretion

- The agent may choose exact grid breakpoints, sticky control behavior, helper filenames, and event-row density.

## Deferred Ideas

None.
