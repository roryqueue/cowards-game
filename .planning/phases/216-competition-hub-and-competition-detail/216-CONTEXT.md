# Phase 216: Competition Hub and Competition Detail - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 216 builds `/competitions` and `/competitions/[competitionId]` for active competitions and public evidence, using `getPublicCompetitionIndex` and `getPublicCompetitionDetail`. It should support current ladder/exhibition data first and leave bracket/pod/tournament affordances conditional.

</domain>

<decisions>
## Implementation Decisions

### Competition Concept
- **D-01:** `/competitions` is the canonical public directory for ladders, exhibitions, and future tournament-like objects.
- **D-02:** Existing `/ladder/[seasonId]` and `/exhibitions/new` remain compatible specific routes.
- **D-03:** Competition detail should support current ladder/exhibition data first and must not fake brackets where the data model does not support them.

### Detail Content
- **D-04:** Detail pages show entrants, standings, schedule/pods/bracket where applicable, MatchSets, replay coverage, and entry links when available.
- **D-05:** Resettable trial ladder and exhibition copy should avoid durable-rating, production-governance, or permanent ranking overclaims.
- **D-06:** Python/Rust/Zig remain labeled as non-counted exhibition beta only.

### Navigation
- **D-07:** Competition detail links to results, replays, players, Strategies, and entry routes where public-safe links exist.

### the agent's Discretion
- Decide canonical competition id encoding/mapping for current ladders/exhibitions, while preserving existing URLs.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - COMP-01 through COMP-06.
- `.planning/ROADMAP.md` - Phase 216 scope.
- `.planning/phases/212-discovery-read-requirements-and-boundary-design/212-CONTEXT.md` - Competition discovery DTO boundary.
- `.planning/artifacts/v1.31-discussion-summary.md` - Competition model decisions.

### Current Competition Surfaces
- `apps/web/app/ladder/[seasonId]/page.tsx` - Existing public ladder detail.
- `apps/web/app/exhibitions/new/page.tsx` - Existing exhibition creation.
- `packages/spec/src/competition.ts` - Public ladder, MatchSet, entrant, Strategy runtime, and standing DTOs.
- `packages/persistence/src/competition.ts` - Existing exhibition creation persistence behavior.
- `packages/persistence/src/ladder.ts` - Existing trial ladder persistence behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Public trial ladder season DTO already includes entries, standings, MatchSets, policy, and publication metadata.
- Competition presets already exist for smoke and standard exhibitions.

### Established Patterns
- Current competition copy emphasizes resettable trial standings and no permanent ratings.
- Entry/creation is account-gated.

### Integration Points
- Competition discovery should map existing ladder/exhibition objects into a unified public concept without breaking existing routes.

</code_context>

<specifics>
## Specific Ideas

Use conditional sections for schedule/pods/bracket: render only when the discovery DTO provides real public data.

</specifics>

<deferred>
## Deferred Ideas

Durable ratings, permanent seasons, formal tournament governance, moderation workflows, and real brackets if unsupported by current data.

</deferred>

---
*Phase: 216-competition-hub-and-competition-detail*
*Context gathered: 2026-05-31*
