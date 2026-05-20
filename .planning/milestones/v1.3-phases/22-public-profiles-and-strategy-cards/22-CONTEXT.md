# Phase 22: Public Profiles and Strategy Cards - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 22 publishes privacy-safe player handle pages and Strategy cards with lineage, competition history, standings, MatchSet results, and replay links. It should give players a reason to care about their identity and Strategies without exposing private Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid details, private runtime internals, or private errors.

This phase does not build the ladder season model, scheduler, dispute governance, or runtime boundary spike. It consumes the public evidence surfaces from earlier phases.

</domain>

<decisions>
## Implementation Decisions

### Public Profile Shape
- **D-01:** Public player pages should be handle-first, not account-admin pages. The page identity is the public handle/display name.
- **D-02:** Show public Strategy cards, trial ladder history, competition record, counted/non-counted MatchSet links, replay links, and recent public activity.
- **D-03:** Keep the profile operational and competition-focused. Do not add social features such as follows, comments, galleries, likes, badges, or messaging in v1.3.
- **D-04:** Empty profile states should point users toward creating/forking Strategies and entering exhibitions/ladder seasons, but not become marketing copy.

### Public Strategy Card Shape
- **D-05:** Public Strategy cards should show name, description, tags, author handle, public lineage metadata, source hash, runtime/engine compatibility, season history, record, MatchSet links, and replay links.
- **D-06:** Strategy cards should be metadata-first and source-private. Do not expose source snippets or private memory/debug details.
- **D-07:** Starter-fork lineage from Phase 19 should be shown as safe metadata when present, such as "Forked from Centerline Bully v1" plus source hash/version, not code.
- **D-08:** Strategy cards should distinguish Strategy identity from immutable revision identity. Show current/public revision metadata and revision lineage without implying mutable competition entries.

### Owner Affordances
- **D-09:** Authorized owners can see owner-only affordances to edit/fork, inspect source, or debug through existing server-side checks.
- **D-10:** Owner-only affordances must not change the public DTO shape or leak into anonymous/current-non-owner output.
- **D-11:** If owner actions are included on public pages, they should be visually secondary and clearly scoped to the owner.

### Privacy and DTO Contract
- **D-12:** Add explicit public DTO leak assertions for player profile and Strategy card output, mirroring the existing public MatchSet result privacy posture.
- **D-13:** Forbidden public fields include Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid details, private runtime internals, private errors, and account/session internals.
- **D-14:** Public profile/card DTOs should link to public evidence rather than duplicating private or detailed runtime payloads.

### Navigation and Presentation
- **D-15:** Profiles and Strategy cards should connect naturally to season pages, MatchSet result pages, and replay pages.
- **D-16:** Keep pages dense, scannable, and competition-oriented rather than marketing/editorial.
- **D-17:** Use existing app styling patterns and avoid introducing a broad community/social design language in this phase.

### the agent's Discretion
- The planner may decide exact routes (`/players/[handle]`, `/strategies/[id]`, or similar) if links are stable and public.
- The planner may decide whether Strategy cards are standalone pages, embedded cards, or both, as long as requirements are met.
- The planner may decide how much recent history to show by default, with pagination/deeper browsing kept modest.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` — v1.3 privacy and competition trust constraints.
- `.planning/REQUIREMENTS.md` — PROF-01 through PROF-06 define Phase 22 requirements.
- `.planning/ROADMAP.md` — Phase 22 goal and success criteria.
- `.planning/research/SUMMARY.md` — public profiles/cards and privacy guidance.
- `.planning/phases/19-starter-strategy-library/19-CONTEXT.md` — starter lineage decisions.
- `.planning/phases/20-trial-ladder-season-model/20-CONTEXT.md` — season entry metadata and public season contract.
- `.planning/phases/21-ladder-scheduling-and-standings/21-CONTEXT.md` — standings and evidence link decisions.

### Existing Public/Competitive Surfaces
- `packages/spec/src/competition.ts` — public MatchSet result DTO and leak-safe assertion pattern.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` — existing public result page and provenance/evidence UI.
- `apps/web/app/competitive/server.ts` — current user/session-aware competitive server patterns and owner source affordance mapping.
- `packages/persistence/src/account-revisions.ts` — account-owned Strategy Revision listing/source access patterns.
- `apps/web/app/account/page.tsx` — current account surface and revision display patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing MatchSet result page already shows entrants, standings, replay evidence, and provenance.
- `assertPublicMatchSetResultLeakSafe()` provides a model for profile/card leak checks.
- `competitiveServer` already distinguishes current user/owner from anonymous public output.
- Account revision summaries already include labels, notes, source hash, source bytes, validation, and created-at metadata.

### Established Patterns
- Public results show evidence and hashes without Strategy source.
- Owner-only source links are exposed only when current user owns the entrant.
- Existing UI favors compact panels, tables, cards, status chips, and evidence links.

### Integration Points
- Add public profile/card DTOs in `packages/spec`.
- Add persistence queries to project public player and Strategy metadata from users, strategies, revisions, seasons, MatchSets, and standings.
- Add Next.js routes for player handles and Strategy cards.
- Add privacy tests for public DTOs and UI paths.

</code_context>

<specifics>
## Specific Ideas

- Public Strategy card lineage can say "Forked from [starter name] v[version]" when safe lineage exists.
- Public profile should show both counted and non-counted result links when relevant, with counted status clear.
- Owner-only source/debug actions should be present but visually secondary.

</specifics>

<deferred>
## Deferred Ideas

- Follows, likes, comments, galleries, messaging, badges, and social discovery.
- Public Strategy source sharing.
- Rich public starter library page beyond Workshop.
- Advanced search/filtering across public profiles and Strategies.

</deferred>

---

*Phase: 22-Public Profiles and Strategy Cards*
*Context gathered: 2026-05-19*
