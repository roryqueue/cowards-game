# Phase 205: Soldier Status, Board-Control, Terrain/Stone, and Action-Mix Panels - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 205 adds public-safe replay tactical panels for Soldier progression, board-control signals, terrain/stone occupancy, and action mix. It may add lightweight board emphasis only if stable across desktop and mobile. It must not build a complex tactical-map system, expose owner debug data, infer hidden Strategy intent, or use private Strategy memory/objective data.

</domain>

<decisions>
## Implementation Decisions

### Carry-Forward Defaults
- **D-01:** Public board states and public timeline events only.
- **D-02:** Full overlays are optional and must survive mobile proof.
- **D-03:** FALLEN Soldiers do not occupy board cells.
- **D-04:** No hidden intent, private memory, private objective, raw diagnostics, or execution-internal data.

### Tactical Panel Set
- **D-05:** Add four tactical panels: `Soldier Progression`, `Board Control`, `Terrain and Stone Occupancy`, and `Action Mix`.
- **D-06:** Panels should be workbench-dense, scannable, and evidence-backed.
- **D-07:** Do not add broad coaching, doctrine grading, or hidden-intent analysis.

### Overlay Stance
- **D-08:** Ship lightweight board emphasis only if stable and readable.
- **D-09:** Acceptable emphasis examples include selected category highlighting, occupancy tint, or key sequence markers.
- **D-10:** Do not build a complex layered analysis map in Phase 205.
- **D-11:** If overlays threaten mobile layout, keep tactical insight in panels and defer overlays.

### Board-Control Model
- **D-12:** Use transparent public heuristics for board-control signals.
- **D-13:** Supported heuristics include active/STONE count by side, center/edge presence, contraction pressure, occupied lanes or regions, and visible engagement proximity.
- **D-14:** Board-control copy should describe these as public evidence signals, not definitive strategic dominance.

### Soldier Progression
- **D-15:** Show status transitions and public event involvement by Soldier.
- **D-16:** Use public board snapshots and public timeline event references.
- **D-17:** Avoid private objective, SoldierMemory, StrategyMemory, owner debug, awareness-grid, or "why they intended to act" explanations.

### Action Mix
- **D-18:** Count public event types and group them into movement, stoning, falling, push/backstab, blocked movement, contraction, and runtime/public failure where present.
- **D-19:** Action mix should show counts and proportions where useful, with public evidence source references.
- **D-20:** Sparse public projections should produce limitations rather than misleading zeros.

### Sparse Replay Behavior
- **D-21:** Show section-level "not enough public evidence" rows rather than hiding panels wholesale.
- **D-22:** Panels may be present with disabled/limited content for sparse replay-ready data.
- **D-23:** Missing/invalid/stale replay states remain Phase 206's state-copy focus, but Phase 205 panels should already fail closed for sparse data.

### the agent's Discretion
- The agent may choose exact panel ordering, metric names, visual encoding, board region definitions, and whether lightweight emphasis ships or is deferred, provided public-only derivation and mobile stability are preserved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior v1.30 Context
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/201-v1-30-result-replay-intelligence-signal-inventory/201-CONTEXT.md` — Signal inventory, v1.29 baseline, fixture bands, and no DTO expansion stance.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/202-fixture-backed-intelligence-derivation-adapter/202-CONTEXT.md` — Public-only intelligence model, output sections, limitations, and momentum stance.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/204-replay-timeline-annotation-and-jump-target-workbench/204-CONTEXT.md` — Replay annotations, key moments, and mobile-light filtering stance.
- `.planning/workstreams/v1-30-match-intelligence-workbench/REQUIREMENTS.md` — TACT-01 through TACT-07 define Phase 205 requirements.
- `.planning/workstreams/v1-30-match-intelligence-workbench/ROADMAP.md` — Phase 205 scope and success criteria.

### Replay and Board Source
- `apps/web/app/matches/types.ts` — Public replay state, board snapshots, timeline entries, and replay-ready DTO shape.
- `apps/web/app/matches/replay-ready.ts` — Public replay projection, board realism validation, canonical starts, and timeline construction.
- `apps/web/app/matches/[matchId]/replay/replay-board-model.ts` — Replay board model helpers.
- `apps/web/app/matches/[matchId]/replay/replay-board.tsx` — Board rendering integration point for optional emphasis.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` — Replay workbench panels, rails, and interaction integration.
- `apps/web/app/matches/[matchId]/replay/replay-state.ts` — Soldier inspector, event inspector, and timeline grouping helpers.
- `packages/replay/src/project.ts` — Public Chronicle projection sanitization and owner/private separation.
- `packages/spec/src/match-execution-contract.ts` — Frozen public replay evidence contract and privacy exclusions.

### Proof Baseline
- `.planning/artifacts/v1.29-replay-result-trust-proof.md` — Board realism, public page proof, privacy scans, and ready replay playback baseline.
- `apps/web/e2e/replay.visual.spec.ts` — Existing replay visual proof patterns.
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` — Existing fixture-backed result/replay proof patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Replay states already provide board snapshots with Soldiers, terrain stones, bounds, and outcome per sequence.
- Board realism checks already enforce in-bounds visible Soldiers/terrain, no visible FALLEN occupancy, no overlaps, and canonical starts.
- Replay board and replay client provide the likely integration points for optional emphasis and tactical panels.

### Established Patterns
- Replay workbench uses rails/panels around a stable board; new panels should preserve that layout discipline.
- Public projection strips private fields; tactical panels must stay downstream of public projection.
- Mobile proof is a hard constraint for any board emphasis or new controls.

### Integration Points
- Phase 205 consumes Phase 202 intelligence model and Phase 204 timeline annotations.
- Phase 208 will visually prove tactical panels and any board emphasis across desktop/mobile.
- Phase 209 can monitor tactical code for forbidden private/internal imports.

</code_context>

<specifics>
## Specific Ideas

- Tactical panels: `Soldier Progression`, `Board Control`, `Terrain and Stone Occupancy`, `Action Mix`.
- Board-control heuristics: active/STONE count by side, center/edge presence, contraction pressure, occupied lanes/regions, visible engagement proximity.
- Action groups: movement, stoning, falling, push/backstab, blocked movement, contraction, runtime/public failure.

</specifics>

<deferred>
## Deferred Ideas

- Complex layered tactical-map overlays are deferred beyond Phase 205 unless a very lightweight stable emphasis naturally fits.

</deferred>

---

*Phase: 205-Soldier Status, Board-Control, Terrain/Stone, and Action-Mix Panels*
*Context gathered: 2026-05-31*
