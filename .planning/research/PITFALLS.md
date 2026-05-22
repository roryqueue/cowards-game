# Pitfalls Research: v1.6 Workshop Analytics and Evidence Explorer

**Project:** Coward's Game
**Date:** 2026-05-21
**Milestone context:** v1.6 Workshop Analytics and Evidence Explorer

## Major Risks

### Comparing Unlike Evidence

Saved profile names are human labels, not compatibility. Comparing results across changed seeds, presets, opponents, scoring policy, rule version, Chronicle version, or runtime adapter can mislead players.

**Prevention:** Store a compatibility key and require equality for result comparison. Show mismatch reasons when comparison is blocked.

### Reintroducing Runtime Risk

Analytics may tempt implementation to run Strategy code synchronously for "quick summaries" or browser previews.

**Prevention:** Analytics reads completed MatchSets/Chronicles or enqueues existing worker-backed MatchSets only. Add tests proving web/API routes do not execute Strategy code.

### Public Privacy Leakage

Evidence drilldowns and exports can accidentally expose owner debug, Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, stack traces, or runtime internals.

**Prevention:** Public analytics must use public DTOs/projections only. Owner exports must be explicit summary DTOs, not raw Chronicle or raw database dumps. Keep owner debug as a separate server-authorized replay mode.

### Overstating Confidence

Heatmaps can visually imply certainty even with tiny samples or degraded/system-failed evidence.

**Prevention:** Evidence bands and counts must be visible in cells and drilldowns. Degraded/non-counted and system-failed evidence should be visually distinct from weak Strategy performance.

### Deep Links That Drift

Deep links to raw event offsets can become wrong if Chronicle compatibility or projection rules change.

**Prevention:** Deep links should include Match id plus public sequence/moment type and be generated from the stored Chronicle compatibility version. Replay should gracefully fall back if the sequence is unavailable.

### CSV Injection and Export Confusion

CSV exports can be opened in spreadsheet tools. Values starting with formula-trigger characters may behave unexpectedly.

**Prevention:** Use a dedicated CSV formatter, RFC 4180 escaping, and consider prefixing risky cell values when export fields can contain user-controlled text.

### UI Density Without Study Value

Heatmaps and explorer tables can become colorful noise if every metric appears at once.

**Prevention:** Keep the top-level heatmap focused on matchup outcome/evidence, with drilldowns for detailed failure counts, side bias, and replay references.

## Phase Ownership

- Phase 38 should lock data contracts, compatibility rules, and privacy boundaries.
- Phase 39 should handle saved profile persistence/rerun/compare without new runtime execution paths.
- Phase 40 should make heatmaps honest about evidence count, side bias, failures, and confidence.
- Phase 41 should make drilldowns and filters useful without raw payload leakage.
- Phase 42 should make moment links deterministic and public-safe.
- Phase 43 should keep exports summary-oriented and owner-only.
- Phase 44 should prove the whole flow through demo data, browser verification, docs, and privacy/runtime audits.

## Sources

- User v1.6 milestone brief.
- `.planning/PROJECT.md`
- `.planning/milestones/v1.5-MILESTONE-AUDIT.md`
- OWASP Privacy by Design guidance: https://owasp.org/www-project-devsecops-guideline/latest/02g-Privacy
- RFC 4180 CSV: https://www.rfc-editor.org/rfc/rfc4180
