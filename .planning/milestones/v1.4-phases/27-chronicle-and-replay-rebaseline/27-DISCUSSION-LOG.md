# Phase 27: Chronicle and Replay Rebaseline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 27-Chronicle and Replay Rebaseline
**Areas discussed:** Chronicle Grammar Shape, Compatibility Policy, Replay Reconstruction Contract, Fixture Rebaseline Scope, Replay UI and Debug Explanation

---

## Chronicle Grammar Shape

| Option | Description | Selected |
|--------|-------------|----------|
| New slot/Cycle grammar | Add explicit selected-slot/Cycle semantics, slot id/index, Cycle layer, skip events, cycle boundaries, and multiple open slots. | ✓ |
| Reuse Activation events | Keep Activation event structure but relax grammar so Activation events can be interleaved. | |
| Dual grammar | Support new v1.4 slot/Cycle events while accepting old Activation grammar for historical Chronicles. | |

**User's choice:** New slot/Cycle grammar.
**Notes:** The user selected a new Chronicle schema version, slot/Cycle-layer vocabulary, and explicit selected-slot opened/ended/skipped events.

---

## Compatibility Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Legacy accepted, clearly historical | Keep old artifacts accepted by old grammar/projection paths, label them historical, and do not migrate into v1.4 semantics. | |
| Migrate old to v1.4 | Provide a migration path that rewrites old Chronicles into the new schema where possible. | |
| Reject old by default | New validators reject old Chronicles unless an explicit stale/historical path is used. | ✓ |

**User's choice:** Reject old by default.
**Notes:** Old public replay links should be blocked with stale/historical explanation. No developer-only legacy parser should be kept because the product is not live yet. Old generated fixtures should be archived only if useful for audit or removed if regeneration is easy.

---

## Replay Reconstruction Contract

| Option | Description | Selected |
|--------|-------------|----------|
| State equality at Cycle boundaries | Reconstruction must match engine states at selected-slot open/end, Cycle-start, Cycle-end, skip, Round end, contraction, and Match end boundaries. | ✓ |
| Final state only | Only require final replay state to match engine output initially. | |
| Event-by-event visual state | Require every event application to exactly match expected board state, even between boundaries. | |

**User's choice:** State equality at Cycle boundaries.
**Notes:** The user selected skip events as no-op explainable transitions, blocked MOVE/PUSH as no-op board state with Cycle progress and open slot, immediate match-end interruption with other slots marked interrupted, and privacy assertions coupled to reconstruction/projection tests.

---

## Fixture Rebaseline Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All active replay fixtures | Regenerate/replace every active replay fixture used by tests, docs, visual snapshots, or local demos; archive old only if needed. | ✓ |
| Canonical fixtures only | Rebaseline engine-generated canonical scenarios first and leave visual/demo fixtures for later. | |
| Replay visual fixtures only | Focus on user-facing replay visual set and defer deeper canonical fixtures. | |

**User's choice:** All active replay fixtures.
**Notes:** The user selected updating visual snapshots when timing changes rendered output, deleting/replacing old-assumption fixture helpers, and writing a human-readable fixture rebaseline summary.

---

## Replay UI and Debug Explanation

| Option | Description | Selected |
|--------|-------------|----------|
| Targeted wording update | Update timeline, callouts, inspector labels, and owner debug explanations enough to make selected slots, Cycle layers, skips, and interrupted slots understandable. | ✓ |
| No UI wording | Keep Phase 27 backend/replay-core only. | |
| Full replay UX pass | Redesign replay timeline/inspector around interleaved slots in Phase 27. | |

**User's choice:** Targeted wording update.
**Notes:** Public replay may expose safe selected-slot lifecycle metadata while hiding private data. Owner debug should explain skipped slots with actionable cause labels. If UI changes are made, run Playwright visual/spec checks and browser/screenshot verification.

---

## the agent's Discretion

- The planner may choose exact v1.4 Chronicle schema version string and event names.
- The planner may choose the exact stale replay explanation route/component.

## Deferred Ideas

- Broad replay UX redesign.
- Starter Strategy timing update.
- Demo competition regeneration.
