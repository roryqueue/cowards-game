# Phase 212: Discovery Read Requirements and Boundary Design - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 212 defines the public/account-safe discovery DTOs, read boundaries, route naming, and tests for `getPublicHomeDiscovery`, `getPublicWatchIndex`, `getPublicCompetitionIndex`, `getPublicCompetitionDetail`, and `getSignedInCompetitionEntryDashboard`. It does not implement the full public UI and does not change `match-execution-app-v1`.

</domain>

<decisions>
## Implementation Decisions

### Discovery Namespace
- **D-01:** Use a new discovery namespace, likely `public-discovery`, with DTO/schema names such as `PublicHomeDiscoveryDto`, `PublicWatchIndexDto`, `PublicCompetitionIndexDto`, `PublicCompetitionDetailDto`, and `SignedInCompetitionEntryDashboardDto`.
- **D-02:** Discovery contracts are explicitly separate from `match-execution-app-v1`; they must not be named, versioned, or validated as execution-contract DTOs.
- **D-03:** Discovery DTOs should be small, link-rich, and compositional. They can include summarized state labels and canonical hrefs, but should not nest full execution DTOs unless there is a clear reason.

### Delivery Shape
- **D-04:** Implement discovery reads as server-side service/read helpers first. Add route handlers only where the UI genuinely needs client-side refresh.
- **D-05:** Public pages should prefer Server Components consuming typed discovery helpers.
- **D-06:** Discovery reads aggregate existing public-safe projections and canonical hrefs; empty/unavailable states are first-class.

### Privacy Boundary
- **D-07:** Discovery reads must not inspect Strategy source, owner debug data, raw Chronicle private data, runtime internals, quarantine/recovery/operator data, or execute Strategy code.
- **D-08:** Tests must prove no existing public execution DTO fields were added, removed, renamed, or repurposed for discovery.

### the agent's Discretion
- Choose exact file/module names to match codebase conventions, as long as names make the discovery boundary obvious.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - v1.31 current milestone and non-goals.
- `.planning/REQUIREMENTS.md` - DISC-01 through DISC-06.
- `.planning/ROADMAP.md` - Phase 212 scope and success criteria.
- `.planning/artifacts/v1.31-route-link-inventory.md` - Current route/read inventory.
- `.planning/artifacts/v1.31-discussion-summary.md` - Milestone-wide confirmed decisions.

### Contracts and Reads
- `packages/spec/src/service.ts` - Existing service DTO/schema patterns.
- `packages/spec/src/competition.ts` - Existing public result/player/Strategy/ladder DTOs.
- `apps/web/lib/public-service-boundary.ts` - Existing web public read helper pattern.
- `apps/web/lib/public-service-adapter.ts` - Existing public route ownership and selected Go-read pattern.
- `apps/web/lib/public-go-read-client.ts` - Existing public read schema/privacy validation.
- `packages/service/src/index.ts` - Local TypeScript service reference DTO assembly.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing public service DTOs and zod schemas in `packages/spec/src/service.ts`.
- Existing leak-safe validation helpers and public read client failure diagnostics.

### Established Patterns
- Public reads validate DTOs and run public-output privacy checks before use.
- Web pages call narrow boundary helpers rather than reaching into persistence/runtime internals.

### Integration Points
- New discovery helpers can live beside public service boundaries or in a dedicated discovery boundary module.
- Discovery tests should include contract independence checks against `match-execution-app-v1`.

</code_context>

<specifics>
## Specific Ideas

Use discovery DTOs to carry canonical hrefs to `/watch`, `/competitions`, `/competitions/[competitionId]`, `/matchsets/[matchSetId]`, `/matches/[matchId]/replay`, `/players/[handle]`, `/strategies/[strategyId]`, `/workshop`, `/account`, and `/learn`.

</specifics>

<deferred>
## Deferred Ideas

Full UI implementation belongs to Phases 213-218. Search/filter/pagination/recommendation features are future work unless required for basic page usefulness.

</deferred>

---
*Phase: 212-discovery-read-requirements-and-boundary-design*
*Context gathered: 2026-05-31*
