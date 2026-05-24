# Phase 105: Web/API Go-Only Cutover and Fallback Removal - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 105 cuts over the selected v1.15-promoted normal web/API surfaces so they operate through Go-owned contracts with no TypeScript backend fallback. The phase should make normal account/session, account revision/fork, selected exhibition, selected public read, public replay metadata, and public replay evidence flows Go-only where they were promoted or made Go-ready by v1.15.

This phase does not migrate every TypeScript-backed web route. Workshop validation/submission/tests/analytics/export, broader ladder mutations, governance/admin actions, owner-debug replay/private Chronicle projection, test-support routes, fixture generators, rollback/parity paths, and migration/schema ownership remain deferred or non-normal unless explicitly selected by later phases.

</domain>

<decisions>
## Implementation Decisions

### Selected Normal Routes
- **D-01:** Treat Phase 105 as an actual cutover for selected v1.15-promoted normal routes, not merely documentation.
- **D-02:** Selected route families include auth/session flows needed by normal paths, account revision reads, starter and advanced forks, selected exhibition MatchSet creation, public Strategy/player/ladder/MatchSet reads, public replay metadata, and public replay evidence.
- **D-03:** Do not expand this phase into all TypeScript-backed web routes. Surfaces outside the selected route set must be explicitly deferred, test-only, parity-only, rollback-only, or quarantined in later artifacts.

### Fallback Policy
- **D-04:** When a route is Go-selected or strict topology is active, require `COWARDS_GO_BACKEND_URL` or the equivalent Go backend client configuration and fail closed when Go is unavailable.
- **D-05:** Do not fall back to local `@cowards/service`, direct TypeScript persistence, or Chronicle reads for selected normal routes.
- **D-06:** Stopped-Go behavior for selected routes should produce explicit classified failure, not hidden TypeScript service behavior.

### Next.js API Role
- **D-07:** Selected Next.js API routes should act as frontend adapters to Go-backed boundary clients.
- **D-08:** Selected normal Next.js API routes must not directly import persistence or `@cowards/service` for normal behavior.

### Current User And Session Reads
- **D-09:** Avoid hidden direct database reads inside selected public/account adapters.
- **D-10:** Session/current-user lookup for selected normal routes should use the same Go-owned account/session boundary when Go ownership is selected.

### Replay Evidence Split
- **D-11:** Public replay metadata and public replay evidence should use Go-owned public read/evidence contracts for selected normal paths.
- **D-12:** Private owner-debug replay may remain explicit and deferred with authorization gates, but it must never act as public evidence fallback.

### Error And Privacy Behavior
- **D-13:** Selected route failures should be schema/auth classified and redacted.
- **D-14:** Public errors and DTOs must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner-debug data, stack traces, DB details, host paths, tokens, session internals, or private runtime material.

### the agent's Discretion
The agent may decide exact cutover order, adapter refactor shape, environment flag simplification, and test grouping, provided the selected v1.15-promoted route families become Go-only for normal runtime and all non-selected surfaces are explicitly labeled for later phases.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Context
- `.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md` - Strict role taxonomy and retirement action defaults.
- `.planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md` - Runtime service must not become backend fallback.
- `.planning/REQUIREMENTS.md` - WEB-01 through WEB-08 and related privacy/fallback requirements.
- `.planning/ROADMAP.md` - Phase 105 boundary and success criteria.
- `.planning/research/v1.16-SUMMARY.md` - Web/API retirement findings.

### v1.15 Baseline
- `.planning/artifacts/v1.15-lifecycle-ownership-manifest.json` - Go lifecycle ownership baseline.
- `.planning/artifacts/v1.15-typescript-surface-labels.json` - Existing TypeScript surface labels to revise.
- `.planning/artifacts/v1.15-live-web-go-runtime-topology.json` - v1.15 live topology and page-smoke evidence.
- `.planning/artifacts/v1.15-promotion-decision.md` - Promoted Go backend route state.

### Web/API Surfaces
- `apps/web/lib/account-service-adapter.ts` - Account/session Go selection and current local fallback path.
- `apps/web/lib/public-service-adapter.ts` - Public read Go selection and current local fallback path.
- `apps/web/lib/go-backend-service-client.ts` - Go backend account/write client.
- `apps/web/lib/public-go-read-client.ts` - Go public read client.
- `apps/web/app/competitive/server.ts` - Direct persistence-backed competitive server code to cut over or label.
- `apps/web/app/matches/server.ts` - Replay metadata/evidence and owner-debug/private Chronicle split.
- `apps/web/app/api/**/route.ts` - Next.js API adapter routes.

### Go Backend Contracts
- `apps/go-backend/main.go` - Go backend selected route handlers and data mode.
- `apps/go-backend/main_test.go` - Go route behavior, public DTO, auth/session, exhibition, and replay tests.
- `apps/go-backend/testdata/service-fixtures/route-manifest.json` - Route manifest that monitors must stay synchronized with.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing Go backend service clients already provide account/session, revision, fork, exhibition, public read, public replay metadata, and public replay evidence access patterns.
- Existing adapter tests already assert no fallback when Go is selected for some route families.
- Boundary monitors already understand fallback policies and route ownership manifests from v1.15.

### Established Patterns
- Go-selected routes currently require `COWARDS_GO_BACKEND_URL` in several adapters; Phase 105 should make this consistent and fail-closed.
- Existing public read ownership supports route selection via env flags, but v1.16 strict mode should reduce ambiguity for selected normal paths.
- Replay page logic already distinguishes public Go evidence from private owner-debug Chronicle projection; Phase 105 should preserve and harden that split.

### Integration Points
- `apps/web/lib/account-service-adapter.ts` and `apps/web/lib/public-service-adapter.ts` are the main fallback-removal chokepoints.
- `apps/web/app/competitive/server.ts` and selected API routes need careful treatment so they become adapters or are labeled deferred.
- `apps/web/app/matches/server.ts` must use Go public evidence for public replay while keeping owner-debug explicit/private/deferred.

</code_context>

<specifics>
## Specific Ideas

The user asked whether Phase 105 is expected to cut over these routes in the milestone. Decision: yes, v1.16 should cut over the selected v1.15-promoted normal routes. The nuance is that selected does not mean every TypeScript-backed web route; out-of-set surfaces are explicitly deferred, quarantined, test-only, parity-only, or rollback-only.

</specifics>

<deferred>
## Deferred Ideas

- Workshop validation, submission, save/source/test, analytics rerun/profile/export/runtime flows.
- Broader ladder mutations, scheduling, entry operations, and governance/admin actions.
- Owner-debug replay/private Chronicle projection migration.
- Test-support routes and fixture generators beyond explicit test-only gates.
- Migration/schema ownership.

</deferred>

---

*Phase: 105-Web/API Go-Only Cutover and Fallback Removal*
*Context gathered: 2026-05-24*
