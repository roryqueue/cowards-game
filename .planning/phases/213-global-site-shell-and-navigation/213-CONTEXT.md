# Phase 213: Global Site Shell and Navigation - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 213 adds a restrained global public/signed-in site shell and navigation, making `/workshop` the canonical Workshop route while `/` becomes the public discovery hub in Phase 214. It does not build Home/Watch/Competition content beyond shell-level navigation.

</domain>

<decisions>
## Implementation Decisions

### Shell Shape
- **D-01:** Add one restrained competitive site shell across public/site pages with Home, Watch, Competitions, Learn, Workshop, and Account.
- **D-02:** The shell should be quiet and work-focused, using existing visual language (`app-page`, `app-panel`, chips, tables) rather than a marketing-heavy theme.
- **D-03:** The Workshop can remain a focused tool surface inside the shell unless implementation proves the editor needs a compact variant.

### Route Canonicalization
- **D-04:** `/workshop` is the canonical Workshop route.
- **D-05:** `/` should stop rendering Workshop directly once Home is implemented; Phase 213 may prepare links/redirect affordances but Phase 214 owns the public home content.

### Navigation Semantics
- **D-06:** Navigation copy should preserve canonical terms and avoid feature-explainer clutter.
- **D-07:** Anonymous and signed-in actions should be clear without exposing private Strategy data.

### the agent's Discretion
- Choose responsive shell mechanics that fit existing app CSS. If Workshop needs reduced chrome for editor ergonomics, keep the variant minimal and documented.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - v1.31 site-spine goal.
- `.planning/REQUIREMENTS.md` - SHELL-01 through SHELL-05.
- `.planning/ROADMAP.md` - Phase 213 scope.
- `.planning/artifacts/v1.31-discussion-summary.md` - Confirmed shell decisions.

### Current App
- `apps/web/app/layout.tsx` - Current root layout.
- `apps/web/app/globals.css` - Existing app visual language.
- `apps/web/app/page.tsx` - Current root Workshop behavior.
- `apps/web/app/workshop/page.tsx` - Canonical Workshop route.
- `apps/web/app/account/page.tsx` - Signed-in account route.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- CSS classes: `app-page`, `app-panel`, `app-section-header`, `app-actions`, `workshop-chip`, `status-strip`.

### Established Patterns
- App pages are server-rendered route components with local action links.
- Existing UI is operational and evidence-focused, not illustrative.

### Integration Points
- Root layout is the natural global shell insertion point.
- Current pages with local headers may need lightweight adaptation to avoid duplicated navigation.

</code_context>

<specifics>
## Specific Ideas

Primary nav labels: Home, Watch, Competitions, Learn, Workshop, Account. Keep labels short and predictable.

</specifics>

<deferred>
## Deferred Ideas

Full Home, Watch, Competition, Entry, and cross-link page content belongs to later phases.

</deferred>

---
*Phase: 213-global-site-shell-and-navigation*
*Context gathered: 2026-05-31*
