---
phase: 129
status: implemented
---

# Phase 129 UI Spec

## User-Facing Contract
- MatchSet result shows a compact Evidence panel with status, public runtime labels, and privacy exclusions.
- Replay shows a compact Evidence panel in the metadata rail.
- Evidence cues do not expose Strategy code, memory, diagnostic streams, stacks, host paths, package paths, or private runtime internals.

## Layout
- Use existing `app-panel`, `details-grid`, and `replay-rail` idioms.
- Keep the replay board and timeline as the primary interaction surface.
