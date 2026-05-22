# Phase 41: Evidence Explorer UX - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>

## Phase Boundary

Phase 41 builds the sortable/filterable Evidence Explorer UX for drilling from Strategy to opponent to MatchSet to Match to replay link. It consumes saved profile/run summaries, heatmap links, and analytics contracts from prior phases. It does not implement saved profile execution, heatmap cell design, targeted replay moment detection, or export endpoints.

</domain>

<decisions>

## Implementation Decisions

### Explorer Navigation Shape

- **D-01:** Evidence Explorer should have a dedicated route/page plus Workshop entry points.
- **D-02:** Workshop heatmap/profile surfaces link into the explorer with selected Strategy, opponent, profile run, and matchup params where available.
- **D-03:** Explorer route state should be URL-addressable enough for reloads and browser verification.
- **D-04:** The explorer should still feel like part of Workshop, not a separate analytics product or public sharing surface.
- **D-05:** Use a master-detail layout: list/filterable matchup records in the primary pane and selected opponent/MatchSet/Match/replay information in the detail pane.
- **D-06:** Mobile adapts master-detail into stacked panes with clear back/selection behavior.
- **D-07:** Route/state should preserve the selected record where practical.

### Sort and Filter Priority

- **D-08:** First-class controls are evidence band, opponent tier/archetype, and sort.
- **D-09:** Advanced filters include failure category, side, counted status, replay availability, and profile run.
- **D-10:** Active advanced filters must be summarized as chips/badges so hidden filters are not invisible.
- **D-11:** System-failed and degraded states remain visible in rows even when not selected as filters.
- **D-12:** Mobile can collapse the filter row, but evidence band and sort must remain easy to reach.
- **D-13:** Default sorting is weakness-finding: unfavorable points/W-L-D first, then evidence strength/count, then deterministic opponent grouping/order.
- **D-14:** Thin/degraded/system-failed states remain explicit so “weak matchup” does not imply Strategy blame when evidence is unreliable.
- **D-15:** User-selected sort should persist in URL state for reloadability if practical; durable user preferences are not required.

### Drilldown Depth

- **D-16:** Drilldown path is Strategy -> opponent -> MatchSet -> Match -> replay.
- **D-17:** Before replay handoff, the explorer shows evidence summary plus Match list.
- **D-18:** MatchSet detail includes status, counted/degraded/system state, aggregate W-L-D/points, evidence band, failure/replay counts, and a list of Matches with outcome/status/replay link.
- **D-19:** Do not duplicate the full MatchSet result page inside the explorer; link to the existing MatchSet page for full provenance.
- **D-20:** Match rows show safe outcome/status/replay availability, not raw private payloads.
- **D-21:** Replay links use current replay URLs initially; Phase 42 upgrades them with targeted moments.
- **D-22:** Keep a sticky compact selected Strategy summary visible during drilldown.
- **D-23:** The sticky summary includes revision label, short hash/id, selected profile/run, W-L-D/points summary, and evidence caveat.
- **D-24:** On mobile, the Strategy summary can collapse to a sticky summary bar.

### Empty and Failure States

- **D-25:** Empty/no-useful-evidence states use action-oriented neutral copy, e.g. “No counted replay-backed evidence for this matchup yet,” with actions to run/rerun a profile or adjust filters.
- **D-26:** Filter-empty and data-empty states should be distinguishable.
- **D-27:** Empty state copy should say evidence is absent or insufficient, not that the Strategy is bad.
- **D-28:** Degraded/non-counted/system-failed rows use reliability-first treatment.
- **D-29:** Reliability-first rows show prominent reliability label before outcome metrics, with safe counts and explanation in details.
- **D-30:** System failure remains platform evidence, not Strategy weakness.
- **D-31:** Replay-unavailable is an evidence flag, not a failed run.

### the agent's Discretion

- The user approved auto-locking choices that clearly follow from prior deterministic evidence, privacy, compatibility, failure taxonomy, readability, and phase-boundary decisions.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Context

- `.planning/PROJECT.md` — v1.6 goals and privacy/runtime constraints.
- `.planning/REQUIREMENTS.md` — Phase 41 requirements EXP-01 through EXP-08.
- `.planning/ROADMAP.md` — Phase 41 boundary and success criteria.
- `.planning/research/SUMMARY.md` — v1.6 research direction.
- `.planning/phases/38-analytics-evidence-model/38-CONTEXT.md` — Analytics DTOs, evidence bands, compatibility, and replay-reference constraints.
- `.planning/phases/39-saved-gauntlet-profiles/39-CONTEXT.md` — Saved profile/run model, statuses, and comparison semantics.
- `.planning/phases/40-matchup-heatmaps/40-CONTEXT.md` — Heatmap handoff links, visual language, grouping, and delta constraints.

### Existing Workshop and Replay Code

- `apps/web/app/workshop/workshop-client.tsx` — Current Workshop layout and controls to reuse.
- `apps/web/app/workshop/server.ts` — Server boundary for Workshop data.
- `apps/web/app/matches/server.ts` — Replay retrieval server path and owner authorization pattern.
- `apps/web/app/matches/replay-ready.ts` — Public/owner replay projection and timeline DTO construction.
- `apps/web/app/matches/types.ts` — Replay DTO and timeline entry shapes.
- `packages/persistence/src/matchset-status.ts` — MatchSet match summaries and replay availability.
- `packages/persistence/src/scoring.ts` — Scoring/failure summary source for explorer rows.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- Workshop currently has revision/opponent/preset selectors, gauntlet result summaries, replay links, and dense panel styling.
- Existing MatchSet summaries already include status, outcome, winner, side/player ids, and replay availability.
- Replay server/client paths already support public replay links and owner debug authorization; Phase 41 should not change those authorization rules.

### Established Patterns

- Workshop surfaces should be dense, task-oriented, and consistent with current app-local CSS.
- Privacy-safe DTOs and public projections are the boundary; UI components should not receive private fields.
- Route-driven state is already useful for replay and MatchSet surfaces; explorer should be reloadable enough for browser verification.

### Integration Points

- Add an Evidence Explorer route/page under the web app, likely near Workshop or analytics routing chosen during planning.
- Add Workshop heatmap/profile links to explorer URL state.
- Add explorer data loader/server method that consumes Phase 39 profile run summaries and Phase 38 analytics DTOs.
- Add master-detail UI with first-class filters, advanced filter tray/chips, sortable matchup list, and detail pane.
- Add browser checks for empty, pending, degraded, system-failed, replay-unavailable, mobile, and normal drilldown states.

</code_context>

<specifics>

## Specific Ideas

- The explorer should help users find weak archetypes without implying durable ratings or blaming the Strategy for platform failure.
- First-class filters are evidence band, opponent tier/archetype, and sort.
- Default sort surfaces likely weak matchups first but keeps evidence reliability visible.
- Phase 41 replay links can be ordinary replay links; Phase 42 owns targeted moment links.

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 41-Evidence Explorer UX*
*Context gathered: 2026-05-22*
