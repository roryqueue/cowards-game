# Phase 218: Cross-Link Pass Across Existing Object Pages - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 218 connects Workshop, Account, MatchSet results, replay, player profiles, Strategy cards, competitions, and Learn into one evidence-oriented public site spine. It should improve links on existing object pages without changing execution DTOs.

</domain>

<decisions>
## Implementation Decisions

### Cross-Link Rule
- **D-01:** Cross-links should be evidence-oriented and contextual, not a generic link farm.
- **D-02:** Prefer stable canonical URLs over new query-driven deep links.
- **D-03:** Existing public-safe replay focus links may remain where already useful.

### Object Page Links
- **D-04:** MatchSet pages link to Watch, competition detail when known, entrant player profiles, Strategy cards, and replays.
- **D-05:** Replay pages link back to MatchSet, Watch, Learn/trust explanation, and any player/Strategy context already available from public-safe data.
- **D-06:** Player and Strategy pages expose recent public evidence links without source exposure.

### Signed-In Links
- **D-07:** Workshop points users toward saving revisions, Account, competition entry, and Learn.
- **D-08:** Account becomes the signed-in hub for saved revisions, public Strategy cards, entry opportunities, and recent results/replays where public-safe links exist.

### the agent's Discretion
- Choose exact placement and labels so existing pages stay scannable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - LINK-01 through LINK-05.
- `.planning/ROADMAP.md` - Phase 218 scope.
- `.planning/phases/213-global-site-shell-and-navigation/213-CONTEXT.md` - Shell decisions.
- `.planning/phases/216-competition-hub-and-competition-detail/216-CONTEXT.md` - Competition link context.
- `.planning/phases/217-signed-in-entry-spine/217-CONTEXT.md` - Entry link context.
- `.planning/artifacts/v1.31-discussion-summary.md` - Cross-link decisions.

### Existing Object Pages
- `apps/web/app/workshop/page.tsx` - Workshop route.
- `apps/web/app/account/page.tsx` - Account revisions.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - MatchSet result page.
- `apps/web/app/matches/[matchId]/replay/page.tsx` - Replay page.
- `apps/web/app/players/[handle]/page.tsx` - Player profile.
- `apps/web/app/strategies/[strategyId]/page.tsx` - Strategy card.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing `app-actions`, `workshop-chip-row`, and evidence link patterns.

### Established Patterns
- Public Strategy cards already list evidence links.
- MatchSet and replay pages already link to each other in limited ways.

### Integration Points
- Cross-link pass should use public-safe hrefs from discovery/object DTOs, not private source APIs.

</code_context>

<specifics>
## Specific Ideas

Where data is unavailable, link to broader hubs (`/watch`, `/competitions`, `/learn`) rather than inventing specific object relationships.

</specifics>

<deferred>
## Deferred Ideas

Search-driven related content, recommendations, personalized history, and notification trails.

</deferred>

---
*Phase: 218-cross-link-pass-across-existing-object-pages*
*Context gathered: 2026-05-31*
