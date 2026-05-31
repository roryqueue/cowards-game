# Phase 214: Public Home Discovery Hub - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 214 builds `/` as the public discovery hub backed by `getPublicHomeDiscovery`. It should make Coward's Game legible through current public evidence and routes, not a detached marketing splash.

</domain>

<decisions>
## Implementation Decisions

### Home Content Priority
- **D-01:** Home should be a real discovery dashboard, not a marketing splash.
- **D-02:** Priority order: current competitions/entry opportunities, latest replay-ready public evidence, recent MatchSets, highlighted player/Strategy links, Learn/trust explainer.
- **D-03:** If data is sparse, show fewer stronger sections rather than filler.

### Discovery Behavior
- **D-04:** Home consumes `getPublicHomeDiscovery`.
- **D-05:** Home handles empty/unavailable discovery states honestly and does not pretend execution data exists.
- **D-06:** Home links directly to `/watch`, `/competitions`, `/learn`, `/workshop`, and account actions.

### Privacy
- **D-07:** Home output is public-safe and source-free; do not expose private Strategy/runtime/operator/recovery details.

### the agent's Discretion
- Choose exact section labels and ordering within the confirmed priority order based on available DTO data.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - HOME-01 through HOME-05.
- `.planning/ROADMAP.md` - Phase 214 scope.
- `.planning/phases/212-discovery-read-requirements-and-boundary-design/212-CONTEXT.md` - Discovery DTO boundary.
- `.planning/phases/213-global-site-shell-and-navigation/213-CONTEXT.md` - Shell/navigation context.
- `.planning/artifacts/v1.31-discussion-summary.md` - Home priority decisions.

### Current Routes
- `apps/web/app/page.tsx` - Existing root route to replace.
- `apps/web/app/workshop/page.tsx` - Canonical Workshop route.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - Result destination.
- `apps/web/app/matches/[matchId]/replay/page.tsx` - Replay destination.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing app panel/card/table/chip CSS can support a dashboard layout.

### Established Patterns
- Result/replay pages already communicate public evidence and trust states.

### Integration Points
- Root page should switch from Workshop initial data to public home discovery data.
- Home should link into existing object routes rather than require new object DTO fields.

</code_context>

<specifics>
## Specific Ideas

The first viewport should communicate active public competition/evidence, with a visible hint of Watch/Competition content below.

</specifics>

<deferred>
## Deferred Ideas

Personalized recommendations, search, email alerts, and marketing campaign content.

</deferred>

---
*Phase: 214-public-home-discovery-hub*
*Context gathered: 2026-05-31*
