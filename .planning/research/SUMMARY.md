# Research Summary

**Project:** Coward's Game
**Date:** 2026-05-21
**Milestone context:** v1.6 Workshop Analytics and Evidence Explorer

## Key Findings

**Stack:** Extend the existing TypeScript/Next/PostgreSQL/MatchSet/Chronicle stack. Avoid adding a new analytics warehouse or charting dependency unless the first implementation proves local React/CSS tables insufficient. Current references support optional future use of TanStack Table for complex controlled table state and D3 color scales for quantitative heatmap color encoding.

**Product:** v1.6 should turn deterministic evidence into a study workflow: save a profile, rerun it through worker-backed MatchSets, compare compatible runs, scan a matchup heatmap, filter evidence bands, drill into MatchSets, open representative replay moments, and export owner-safe summaries.

**Architecture:** Add typed analytics contracts and persistence-backed saved gauntlet profiles before UI. Evidence summaries should be serializable, deterministic, public-safe by default, and derived from completed MatchSets/Chronicles. Replay deep links should target public-projected sequence/moment references.

**Privacy:** Public analytics and replay references must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, or private runtime internals. Owner exports should still be summary DTOs rather than raw private artifacts unless a future explicit owner-authorized raw export mode is designed.

## Prescriptive Direction

1. Define the v1.6 analytics evidence model first: `GauntletProfile`, `GauntletSummary`, `MatchupRecord`, `EvidenceBand`, `ReplayReference`, and owner export DTOs.
2. Persist saved profiles with immutable compatibility snapshots and hash/equivalence rules.
3. Rerun profiles by creating existing MatchSets/jobs; never execute Strategy code from web/API routes.
4. Summarize matchup evidence by candidate/opponent/preset/side/count status and classify bands before rendering heatmaps.
5. Build an evidence explorer that filters and sorts typed summaries, not raw Chronicle/private payloads.
6. Generate replay deep links from public replay projections and deterministic moment-selection rules.
7. Add owner-only JSON/CSV exports with dedicated privacy tests and CSV escaping.
8. Finish with local v1.6 demo analytics data and browser verification from Strategy page to heatmap to replay/export.

## Requirements Implications

Recommended v1.6 requirement categories:

- Analytics Evidence Model
- Saved Gauntlet Profiles
- Matchup Heatmaps
- Evidence Explorer
- Replay Deep Links
- Owner Export and Privacy
- Demo, Docs, Verification

## Roadmap Implications

Continue from v1.5 Phase 37:

1. **Phase 38: Analytics Evidence Model** — stable summary contracts for gauntlets, MatchSets, matchup records, archetype tags, evidence bands, and replay references.
2. **Phase 39: Saved Gauntlet Profiles** — save, rerun, compare, and name deterministic gauntlet profiles without runtime execution in web/API.
3. **Phase 40: Matchup Heatmaps** — Workshop heatmaps for per-opponent records, points, failures, side bias, confidence, and evidence count.
4. **Phase 41: Evidence Explorer UX** — sortable/filterable drilldowns from Strategy to opponent to MatchSet to replay.
5. **Phase 42: Replay Deep Links** — links to meaningful public moments, not just Match start.
6. **Phase 43: Owner Export and Privacy** — owner-only JSON/CSV exports with public privacy boundaries preserved.
7. **Phase 44: Demo, Docs, Verification** — example analytics data, browser verification, docs, privacy audit, runtime isolation audit.

## Watch Out For

- Cross-profile comparisons that ignore compatibility changes.
- Heatmap color implying strong evidence when samples are thin or degraded.
- Counting system failures as Strategy quality.
- Public exports or analytics DTOs carrying private replay/debug/runtime fields.
- Deep links to private or unstable sequence data.
- Introducing a chart/table dependency before the local UI proves it needs one.
- Letting saved profile reruns bypass the existing worker/runtime adapter boundary.

## Sources

- User v1.6 milestone brief.
- `.planning/PROJECT.md`
- `.planning/milestones/v1.5-REQUIREMENTS.md`
- `.planning/milestones/v1.5-ROADMAP.md`
- `packages/persistence/src/workshop.ts`
- `apps/web/app/workshop/server.ts`
- `apps/web/app/workshop/workshop-client.tsx`
- `apps/web/app/matches/replay-ready.ts`
- TanStack Table sorting guide: https://tanstack.dev/table/latest/docs/guide/sorting
- TanStack Table filter APIs: https://tanstack.com/table/v8/docs/api/features/filters
- D3 sequential scales: https://d3js.org/d3-scale/sequential
- D3 sequential color schemes: https://d3js.org/d3-scale-chromatic/sequential
- MDN `URLSearchParams`: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
- RFC 4180 CSV: https://www.rfc-editor.org/rfc/rfc4180
- MDN `Blob`: https://developer.mozilla.org/en-US/docs/Web/API/Blob
- OWASP Privacy by Design guidance: https://owasp.org/www-project-devsecops-guideline/latest/02g-Privacy
