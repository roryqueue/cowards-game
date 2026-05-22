# Phase 40: Matchup Heatmaps - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>

## Phase Boundary

Phase 40 adds Workshop heatmaps for selected saved profile runs, showing Strategy-by-opponent matchup evidence with W-L-D, points, evidence band, evidence count, replay availability, failure/degraded/system signals, side-bias markers, stable grouping, and compatible-run delta mode. It does not build the full Evidence Explorer, replay deep-link targeting, saved-profile execution mechanics, or export endpoints; those are handled by adjacent phases.

</domain>

<decisions>

## Implementation Decisions

### Heatmap Cell Language

- **D-01:** Heatmap cells use a balanced two-line face for normal counted evidence.
- **D-02:** Desktop cell top line shows W-L-D plus points.
- **D-03:** Desktop cell bottom line shows evidence band, evidence count, and replay marker.
- **D-04:** Failure counts, side split, scoring impact, and representative links belong in details/popover/drilldown rather than all being crammed into the cell face.
- **D-05:** System-failed cells prioritize `System failed` over W-L-D/points.
- **D-06:** Degraded/non-counted cells prioritize `Degraded` or `Non-counted` over W-L-D/points.
- **D-07:** Thin-evidence cells still show W-L-D/points, but the band/count must remain visible on the face.
- **D-08:** Replay-unavailable appears as a marker, but does not make the whole cell look failed unless replay-backed evidence is required and unavailable for all counted evidence.
- **D-09:** Mobile cells use compact symbols/short labels with details on tap; desktop keeps the two-line cell.
- **D-10:** Heatmap must include a legend for compact symbols and evidence/reliability styling.
- **D-11:** Cell dimensions must be stable with responsive constraints so labels and markers do not resize the grid or overlap.
- **D-12:** Long Strategy/opponent names belong in sticky headers, tooltips/details, or truncated labels, not inside tiny cells.

### Visual Encoding

- **D-13:** Color is never the only signal; cells must also use text, badges, icons, labels, borders, or markers.
- **D-14:** Use local React/CSS first. Do not add a charting dependency by default for Phase 40.
- **D-15:** Normal outcome strength uses subtle outcome fill plus evidence border/badge.
- **D-16:** Cell fill lightly encodes outcome direction/intensity.
- **D-17:** Border/badge encodes evidence band and reliability.
- **D-18:** System-failed and degraded/non-counted states override normal outcome styling.
- **D-19:** Side bias appears as a small marker on the cell face only when meaningful, with full split in details.
- **D-20:** Do not show a side-bias marker when the profile lacks mirrored side coverage or evidence is too thin to support the signal.
- **D-21:** Side-bias markers do not override degraded/system-failed reliability states.
- **D-22:** The exact side-bias threshold can be a named constant or derived from evidence-band rules during planning.

### Row/Column Grouping

- **D-23:** Default grouping is opponent tier/source first, then archetype within tier.
- **D-24:** Default opponent tiers include Starter, Advanced, and Custom/Other as applicable.
- **D-25:** Within groups, sort deterministically by stable label, then revision id/source hash.
- **D-26:** Group labels use snapshots captured by the profile/run, not current mutable labels.
- **D-27:** Users may change grouping if easy, but persisted grouping preferences are not required in Phase 40.
- **D-28:** Selected Strategy Revisions appear by user-facing revision label first, with short source hash/revision id available in tooltip/details.
- **D-29:** Label collisions are handled with short hash/id disambiguation in details, not by replacing readable labels with raw ids everywhere.
- **D-30:** Accessibility labels should include enough id/hash context to disambiguate duplicated names.

### Comparison Controls

- **D-31:** Heatmap comparison works only for compatible profile runs.
- **D-32:** Incompatible comparisons show structured mismatch reasons and no delta.
- **D-33:** Comparison controls must not rerun Strategy code in web/API.
- **D-34:** Heatmap comparison uses a toggle between absolute and delta view.
- **D-35:** Default heatmap mode shows the selected/current run.
- **D-36:** Compatible comparison toggle switches cells into compact delta mode and requires a delta legend.
- **D-37:** Delta mode cell face shows points delta plus compact W-L-D swing marker.
- **D-38:** Evidence-band, failure, degraded/non-counted, system-failed, replay, and side-bias deltas belong in details/drilldown rather than the cell face.
- **D-39:** Phase 40 may link to or prepare drilldown affordances for Phase 41, but should not become the full Evidence Explorer.

### the agent's Discretion

- The user approved auto-locking decisions that clearly follow from prior deterministic evidence, privacy, compatibility, failure-taxonomy, and readability-with-safe-disambiguation decisions.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Context

- `.planning/PROJECT.md` — v1.6 goals and product/privacy constraints.
- `.planning/REQUIREMENTS.md` — Phase 40 requirements HEAT-01 through HEAT-08.
- `.planning/ROADMAP.md` — Phase 40 boundary and success criteria.
- `.planning/research/SUMMARY.md` — v1.6 research direction.
- `.planning/phases/38-analytics-evidence-model/38-CONTEXT.md` — Evidence bands, replay references, compatibility keys, and analytics contract decisions.
- `.planning/phases/39-saved-gauntlet-profiles/39-CONTEXT.md` — Saved profile/run model and comparison semantics consumed by heatmaps.

### Existing Workshop and UI Code

- `apps/web/app/workshop/workshop-client.tsx` — Current Workshop layout, selection controls, gauntlet result display, and design patterns.
- `apps/web/app/workshop/server.ts` — Workshop server boundary and data-loading pattern.
- `apps/web/app/workshop/types.ts` — Workshop request/response type patterns.
- `packages/persistence/src/workshop.ts` — Existing Workshop snapshot/test summary data sources.
- `packages/persistence/src/matchset-status.ts` — Match status, outcome, replay availability, and degraded-state source data.
- `packages/persistence/src/scoring.ts` — Score/ranking/failure-count model for heatmap cells.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- Workshop already renders gauntlet summaries, match rows, replay availability, revision/opponent/preset selectors, and scoring rows in `workshop-client.tsx`.
- The current Workshop CSS/component structure can be extended with a grid/heatmap surface without introducing a chart library.
- Saved profile/run summaries from Phase 39 should provide the heatmap input model; Phase 40 should not recompute by executing Strategies.

### Established Patterns

- Workshop UI uses app-local React/CSS patterns rather than a design-system dependency.
- Public/private safety is enforced by server DTOs and spec schemas, not by hiding fields in the component tree.
- Dense Workshop surfaces should prioritize scanning and repeated action over landing-page-style explanation.
- Deterministic ordering uses stable ids/hashes as tie-breakers.

### Integration Points

- Add heatmap projection helpers that consume Phase 39 profile run summaries and Phase 38 analytics DTOs.
- Add Workshop heatmap controls for selecting run, compatible comparison run, absolute/delta mode, and optional grouping.
- Add cell details/popover/drilldown links that hand off to Phase 41 evidence explorer routes or anchors.
- Add responsive CSS/browser checks for desktop and mobile non-overlap.

</code_context>

<specifics>

## Specific Ideas

- The heatmap should help a player identify weak archetypes quickly without implying durable rating truth.
- Evidence reliability must remain visible on the face of every cell.
- Mobile should preserve heatmap scanning with compact labels rather than switching to a completely different list view in Phase 40.
- Delta mode should stay compact: points delta plus W-L-D swing marker on the face, richer deltas in details.

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 40-Matchup Heatmaps*
*Context gathered: 2026-05-22*
