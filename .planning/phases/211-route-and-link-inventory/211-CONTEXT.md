# Phase 211: Route and Link Inventory - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning/execution

<domain>
## Phase Boundary

Phase 211 inventories the current app route/site structure, read boundaries, and link gaps so v1.31 can add a public discovery spine without touching execution internals or the frozen `match-execution-app-v1` contract.

</domain>

<decisions>
## Implementation Decisions

### Route Inventory
- **D-01:** Treat `/` rendering Workshop as a baseline gap, not as a Workshop implementation defect.
- **D-02:** Treat `/workshop` as the canonical future Workshop route.
- **D-03:** Inventory existing individual object pages before designing index/discovery reads.

### Discovery Boundary
- **D-04:** Discovery reads must be separate public/account-safe APIs and must not be part of `match-execution-app-v1`.
- **D-05:** Do not add fields to existing public execution DTOs to power route indexes or navigation.
- **D-06:** Discovery should link to existing public object pages using canonical hrefs where possible.

### the agent's Discretion
- Phase 211 can write planning and inventory artifacts only. Implementation details for DTO namespace, route handlers, and UI layout belong to later phases.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and Boundaries
- `AGENTS.md` - Project rules, non-negotiables, testing expectations, and GSD workflow.
- `.planning/PROJECT.md` - Current milestone and active constraints.
- `.planning/REQUIREMENTS.md` - v1.31 requirements and traceability.
- `.planning/ROADMAP.md` - v1.31 phase map.
- `.planning/research/v1.31-SUMMARY.md` - Research baseline for public site spine.
- `CowardsGameSpec_Full_Consolidated_v1.md` - Canonical game terms and rules.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - Architecture constraints.

### Prior Milestone Evidence
- `.planning/research/v1.29-SUMMARY.md` - v1.29 public result/replay trust baseline.
- `.planning/milestones/v1.29-MILESTONE-AUDIT.md` - v1.29 closure and frozen-contract proof.
- `.planning/workstreams/v1-27-result-replay-workbench/REQUIREMENTS.md` - Merged v1.27 result/replay workbench scope.
- `.planning/workstreams/v1-27-result-replay-workbench/ROADMAP.md` - Merged v1.27 phase structure.
- `.planning/workstreams/v1-27-result-replay-workbench/research/SUMMARY.md` - Merged v1.27 app/result/replay UX research.
- `.planning/artifacts/v1.29-replay-result-trust-proof.md` - Public result/replay state proof and non-claims.

### Current App Surfaces
- `apps/web/app/page.tsx` - Root route currently renders Workshop.
- `apps/web/app/layout.tsx` - Root layout currently has no global shell.
- `apps/web/app/workshop/page.tsx` - Canonical Workshop page candidate.
- `apps/web/app/account/page.tsx` - Signed-in account and saved revision dashboard.
- `apps/web/app/exhibitions/new/page.tsx` - Existing signed-in exhibition creation flow.
- `apps/web/app/ladder/[seasonId]/page.tsx` - Existing public ladder/competition-like detail page.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - Existing public result workbench.
- `apps/web/app/matches/[matchId]/replay/page.tsx` - Existing public replay viewer.
- `apps/web/app/players/[handle]/page.tsx` - Existing public player profile.
- `apps/web/app/strategies/[strategyId]/page.tsx` - Existing public Strategy card.

### Public Read Contracts
- `apps/web/lib/public-service-boundary.ts` - Existing individual public web read helpers.
- `apps/web/lib/public-service-adapter.ts` - Existing public route ownership and selected Go public reads.
- `apps/web/lib/public-go-read-client.ts` - Existing public Go read client and privacy/schema validation.
- `packages/spec/src/competition.ts` - Public competition/player/Strategy/result DTOs.
- `packages/spec/src/service.ts` - Public page/service DTOs.
- `packages/service/src/index.ts` - TypeScript local service reference and public service DTO assembly.
- `apps/go-backend/live_backend.go` - Go public read route ownership and current public endpoint set.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/app/globals.css`: existing `app-page`, `app-panel`, `app-section-header`, `status-strip`, tables, chips, and result/replay workbench styles.
- `apps/web/lib/public-service-boundary.ts`: established public web read helper location.
- `apps/web/lib/public-service-adapter.ts`: established route ownership and selected Go-read pattern.
- `packages/spec/src/service.ts`: established service DTO schema and leak-safe validation pattern.
- `apps/web/e2e/v1-29-public-result-replay-proof.spec.ts`: precedent for public page proof and privacy scanning.

### Established Patterns
- Public object pages are server components using read helpers from `apps/web/lib/*-boundary.ts`.
- Existing selected public reads fail closed when Go ownership is selected but unavailable.
- Fixture/test support is explicitly gated and must not become production fallback.
- Public DTOs are validated with schema and privacy checks before rendering or client use.

### Integration Points
- New discovery spec types should live beside service/public DTOs but must be named and tested as discovery contracts, not match-execution contracts.
- New web discovery helpers can sit near `public-service-boundary.ts` or in a separate `public-discovery-boundary.ts`.
- Public site pages should consume discovery helpers and link to existing object pages rather than expand execution DTOs.

</code_context>

<specifics>
## Specific Ideas

- Desired public routes: `/`, `/watch`, `/competitions`, `/competitions/[competitionId]`, `/competitions/[competitionId]/enter`, `/learn`.
- Desired existing routes to preserve/link: `/workshop`, `/account`, `/matchsets/[matchSetId]`, `/matches/[matchId]/replay`, `/players/[handle]`, `/strategies/[strategyId]`.
- Discovery reads to design: `getPublicHomeDiscovery`, `getPublicWatchIndex`, `getPublicCompetitionIndex`, `getPublicCompetitionDetail`, `getSignedInCompetitionEntryDashboard`.

</specifics>

<deferred>
## Deferred Ideas

- Search, filtering, pagination, recommendations, notifications, and durable rankings belong after the basic public discovery spine.
- Tournament governance, permanent ratings, moderation workflows, and production sandbox/ranked eligibility remain future milestones.

</deferred>

---
*Phase: 211-route-and-link-inventory*
*Context gathered: 2026-05-31*
