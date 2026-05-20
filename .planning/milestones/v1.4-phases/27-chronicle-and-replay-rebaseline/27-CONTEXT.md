# Phase 27: Chronicle and Replay Rebaseline - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 27 updates Chronicle grammar, replay reconstruction, active replay fixtures, and targeted replay/debug wording for `cowards-rules-v1.4`. It replaces old single-active-Activation assumptions with explicit selected-slot and Cycle-layer semantics, introduces a new Chronicle schema version, and makes v1.4 replay evidence reconstructable and privacy-safe.

This phase does not rewrite the engine scheduler, retune starter Strategies, rebuild competition/demo standings, or redesign the replay viewer. It consumes Phase 26 engine behavior and prepares replay evidence for later starter/demo phases.

</domain>

<decisions>
## Implementation Decisions

### Chronicle Grammar Shape
- **D-01:** v1.4 Chronicle should use a new explicit selected-slot/Cycle grammar, not stretch old Activation events to fit interleaving.
- **D-02:** Introduce a new Chronicle schema version for v1.4 because event ordering, context semantics, selected-slot lifecycle, and Backstab boundary names materially change.
- **D-03:** v1.4 event/context vocabulary should emphasize selected slot and Cycle layer: slot id/index/order, Cycle layer, per-slot cycle index, skip reason, terminal reason, and `cycle-start` / `cycle-end` boundaries.
- **D-04:** Emit and validate explicit selected-slot lifecycle events: opened, ended, and skipped.
- **D-05:** The grammar must allow multiple selected slots to be open within one Round and must validate that their Cycle events interleave according to the Round snake order and Cycle-layer progression.
- **D-06:** Old `ACTIVATION_STARTED`, `ACTIVATION_START`, `ACTIVATION_END`, and `post-advance` vocabulary should not be carried into active v1.4 grammar except where removed/blocked stale artifacts need explanation.

### Compatibility Policy
- **D-07:** Reject old Chronicles by default unless an explicit stale/historical handling path blocks or explains them. Do not silently accept old `chronicle-v1` artifacts in active replay paths.
- **D-08:** Old v1.3 demo replay links should not render through the normal viewer. They should show a clear stale/historical explanation and point to v1.4 evidence when available.
- **D-09:** Do not keep a developer-only legacy parser. The product is not live yet, so v1.4 should move firmly away from legacy support and clear out legacy cruft.
- **D-10:** Old generated fixtures should be archived only if useful for audit or removed if regeneration is easy. They must not remain in active test, docs, demo, or viewer paths.
- **D-11:** Prefer deletion/replacement over long-lived legacy namespaces when old helpers encode full-Activation assumptions.

### Replay Reconstruction Contract
- **D-12:** Replay reconstruction must match engine states at selected-slot open/end, Cycle-start, Cycle-end, skip, Round end, contraction, and Match end boundaries.
- **D-13:** Skip events are no-op board-state transitions, but replay must validate them against selected-slot state and expose them as timeline/debug explanations.
- **D-14:** Blocked MOVE/PUSH in replay is a no-op board transition that consumes/progresses the Cycle, keeps the selected slot open, records no Advance, and still allows Cycle-end Backstab from the unchanged board.
- **D-15:** Match-end interruption stops replay immediately. Other open selected slots should be represented as interrupted or unresolved by match end rather than auto-closed or replayed after Match end.
- **D-16:** v1.4 reconstruction/projection tests must assert public privacy exclusions at the same time: no Strategy source, StrategyMemory, SoldierMemory, objective payloads, Awareness Grid details, private runtime details, or owner debug in public output.

### Fixture Rebaseline Scope
- **D-17:** Regenerate or replace all active replay fixtures used by tests, docs, visual snapshots, or local demos.
- **D-18:** Update replay visual snapshots in Phase 27 when v1.4 fixture timing changes rendered output.
- **D-19:** Delete or replace active fixture helpers/builders that encode old full-Activation assumptions instead of wrapping them with legacy modes.
- **D-20:** Write a human-readable fixture rebaseline summary naming regenerated fixtures, removed legacy artifacts, and the v1.4 behaviors each fixture proves.

### Replay UI and Debug Explanation
- **D-21:** Update replay timeline, callouts, inspector labels, and owner debug explanations enough to make selected slots, Cycle layers, skips, and interrupted slots understandable without a broad replay UX redesign.
- **D-22:** Public replay may expose safe selected-slot lifecycle metadata: selected slot opened/ended/skipped, Cycle layer, terminal reason labels, and Backstab boundaries.
- **D-23:** Public replay must continue to hide objectives, Strategy source, StrategyMemory, SoldierMemory, Awareness Grid details, private runtime internals, owner debug, and private error details.
- **D-24:** Owner debug should explain skipped slots with actionable cause labels such as already ended, off-turn STONE/FALLEN, match interrupted, runtime violation, invalid output, TURN_TO_STONE, or Cycle exhausted.
- **D-25:** If UI changes are made, run relevant Playwright replay visual/spec checks and use browser/screenshot verification for local replay pages.

### the agent's Discretion
- The planner may choose exact schema version string and event names if they clearly signal v1.4 selected-slot/Cycle semantics.
- The planner may decide whether stale old replay links are handled by a dedicated unavailable component, route guard, or validation error page.
- The planner may choose exact fixture summary filename/location if it lives with the Phase 27 artifacts or active fixture docs.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning and Upstream Rule Context
- `.planning/PROJECT.md` — replay privacy, deterministic Chronicle, and v1.4 correction constraints.
- `.planning/REQUIREMENTS.md` — REPLAY-01 through REPLAY-06 define Phase 27 requirements.
- `.planning/ROADMAP.md` — Phase 27 goal, success criteria, and notes.
- `.planning/STATE.md` — active milestone context.
- `.planning/milestones/v1.4-phases/25-rule-source-of-truth-version/25-CONTEXT.md` — locked v1.4 source-of-truth, compatibility, rule-label, and blocked MOVE/PUSH decisions.
- `.planning/milestones/v1.4-phases/26-engine-cycle-scheduler-rewrite/26-CONTEXT.md` — locked engine event/slot/Backstab/failure behavior that replay must consume.

### Chronicle and Replay Core
- `packages/spec/src/types.ts` — Chronicle type definitions and reproducibility metadata.
- `packages/spec/src/schemas.ts` — current `chronicle-v1` schema, event types, activation context, and old Backstab boundary enum.
- `packages/spec/src/versions.ts` — compatibility constants and likely rule/schema version integration point.
- `packages/replay/src/build.ts` — current Chronicle builder mirrors old full-Activation engine loop.
- `packages/replay/src/grammar.ts` — current grammar tracks one active Activation and one active Cycle.
- `packages/replay/src/validate.ts` — Chronicle schema, version, grammar, snapshot, and transition validation orchestration.
- `packages/replay/src/replay-transition.ts` — replay event application and board transition validation.
- `packages/replay/src/reconstruct.ts` — public replay reconstruction API.
- `packages/replay/src/project.ts` — public/owner projection and private payload sanitization.
- `packages/replay/src/debug-explanations.ts` — owner inactivity/debug explanation copy currently based on Activation assumptions.
- `packages/replay/src/snapshot-boundaries.ts` — boundary snapshot validation that currently expects Activation start/end snapshots.

### Fixtures, Visuals, and UI
- `packages/test-utils/src/replay-scenarios.ts` — active replay scenario fixture generation.
- `packages/test-utils/src/engine-scenarios.ts` — engine-generated scenario helpers consumed by replay fixtures.
- `packages/test-utils/src/replay-scenarios.legality.test.ts` — fixture legality checks.
- `apps/web/app/matches/replay-fixture.ts` — app replay fixture source for local/test replay pages.
- `apps/web/app/matches/[matchId]/replay/replay-state.ts` — replay timeline/state shaping for the UI.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` — replay controls, timeline, inspector, and labels.
- `apps/web/app/matches/[matchId]/replay/replay-board.tsx` — visual board rendering and callout effects.
- `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx` — likely surface for stale/historical replay explanations.
- `apps/web/e2e/replay.fixture.spec.ts` — replay fixture browser coverage.
- `apps/web/e2e/replay.visual.spec.ts` and `apps/web/e2e/replay.visual.spec.ts-snapshots/` — visual replay regression coverage and snapshots.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `projectPublicChronicle` already strips private payload keys and can be extended for the new schema/privacy assertions.
- `createReplay` and `stateAt` already reconstruct from snapshots and event applications, which fits boundary-level validation if snapshots are updated.
- Existing replay visual tests and snapshots provide a verification path for UI wording/fixture changes.
- `replay-unavailable.tsx` gives a likely place for blocked stale/historical replay explanation.

### Established Patterns
- Chronicle validation combines schema, grammar, transition, snapshots, and hash checks before rendering.
- Public replay projection is privacy-safe by default, and owner debug is explicit.
- Replay fixtures should be engine-generated/legal rather than hand-authored illusions.

### Integration Points
- Replace `chronicle-v1` active schema/event grammar with v1.4 selected-slot/Cycle grammar.
- Replace old single-active-Activation grammar state with multi-slot Round state.
- Update replay reconstruction and snapshot boundaries around selected-slot and Cycle boundaries.
- Regenerate active fixtures and snapshots after engine behavior changes.
- Add stale/historical blocking behavior for old replay links instead of legacy rendering.

</code_context>

<specifics>
## Specific Ideas

- Treat old v1/v1.3 artifacts as pre-live historical data, not a compatibility burden.
- Skip events should become explanatory timeline events, not board mutations.
- Public lifecycle metadata is allowed only when it is safe metadata; objectives and memory remain private.
- The fixture summary should help a human see which v1.4 behaviors are proven without reading every fixture.

</specifics>

<deferred>
## Deferred Ideas

- Broad replay UX redesign belongs after the corrected event model is proven.
- Starter Strategy timing/docs updates belong to Phase 28.
- Demo ladder/results regeneration belongs to Phase 29.

</deferred>

---

*Phase: 27-Chronicle and Replay Rebaseline*
*Context gathered: 2026-05-20*
