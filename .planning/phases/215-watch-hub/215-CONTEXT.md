# Phase 215: Watch Hub - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 215 builds `/watch` as the denser public evidence feed for latest public MatchSets, Matches, replay-ready evidence, and live/degraded states, backed by `getPublicWatchIndex`.

</domain>

<decisions>
## Implementation Decisions

### Feed Priority
- **D-01:** Watch prioritizes replay-ready evidence first, then recent complete/degraded MatchSets, then queued/running states.
- **D-02:** Failed, stale, missing, and no-result states are included as public evidence, but not glamorized as the main feed.
- **D-03:** Watch should be denser than Home and optimized for scanning evidence.

### Links and State
- **D-04:** Watch links to MatchSet results, replay pages, player profiles, Strategy cards, and competition detail where public-safe data is available.
- **D-05:** Watch distinguishes replay-ready, queued, running, degraded, failed, stale, missing, and no-result public states using existing public-safe status semantics.
- **D-06:** Watch handles empty and unavailable public reads cleanly.

### Boundary
- **D-07:** Watch consumes discovery DTOs, not execution DTO changes or execution internals.

### the agent's Discretion
- Choose grouping, sorting, and compact row/card presentation based on available DTO shape.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - WATCH-01 through WATCH-05.
- `.planning/ROADMAP.md` - Phase 215 scope.
- `.planning/phases/212-discovery-read-requirements-and-boundary-design/212-CONTEXT.md` - Watch discovery DTO boundary.
- `.planning/artifacts/v1.31-discussion-summary.md` - Watch priority decisions.

### Evidence Pages
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - Result destination and evidence copy.
- `apps/web/app/matches/[matchId]/replay/page.tsx` - Replay destination.
- `apps/web/app/matchsets/result-view-model.ts` - Existing result-state view model.
- `apps/web/app/matchsets/evidence-copy.ts` - Existing public evidence wording.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Result workbench state model and evidence copy can inform Watch labels.
- Existing table/card CSS can support dense rows.

### Established Patterns
- Public result/replay state language should stay canonical and privacy-safe.

### Integration Points
- Watch should aggregate links from discovery DTOs, not query raw execution/runtime data.

</code_context>

<specifics>
## Specific Ideas

Use clear status groups: Replay-ready, Recent results, In progress, Evidence issues.

</specifics>

<deferred>
## Deferred Ideas

Advanced filtering, search, infinite scroll, notifications, and personalized watchlists.

</deferred>

---
*Phase: 215-watch-hub*
*Context gathered: 2026-05-31*
