# Phase 84: Public Read Ownership Cutover - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 84 promotes the selected public read route family to Go-owned live data once Phase 83's live DTO, parity, schema, and privacy gates pass. It covers public Strategy pages, public player pages, public ladder pages, public MatchSet summaries, and public replay metadata. It does not move auth/session, account writes, exhibition creation, full replay projection, owner-debug/private replay data, worker/runtime ownership, Strategy execution, migrations, or engine behavior.

</domain>

<decisions>
## Implementation Decisions

### Cutover Slice

- **D-01:** Treat selected public reads as one route family for v1.13 cutover evidence: public Strategy, public player, public ladder season, public MatchSet summary, and public replay metadata.
- **D-02:** Promote public reads only after the relevant Phase 83 live DTO providers, TypeScript parity checks, canonical schema checks, and privacy scans pass for that route family.
- **D-03:** Public route evidence should remain route-specific enough to identify a rolled-back or blocked route without obscuring the family-level cutover decision.

### Default Routing and Rollback

- **D-04:** In selected v1.13 topology, public reads should use Go by default.
- **D-05:** TypeScript service behavior remains explicit rollback/reference only and must not be used as silent per-request fallback in Go-selected evidence paths.
- **D-06:** Rollback should be an explicit owner/config/code-revert action captured in the ownership manifest and final evidence.

### Replay Scope

- **D-07:** Public replay metadata is in scope.
- **D-08:** Full replay projection, owner-debug replay, private Chronicle assembly, raw Awareness Grid, StrategyMemory, SoldierMemory, objective payloads, and private runtime internals stay out of Phase 84.
- **D-09:** Public replay metadata output must stay minimal and source-free; it should not imply migration of full replay serving to Go.

### Failure Behavior

- **D-10:** Unavailable Go, timeouts, invalid JSON, schema violations, privacy violations, TypeScript parity divergence, unsafe links, malformed IDs, storage errors, and unsupported route selections must fail closed.
- **D-11:** Failures should render public-safe temporary unavailability or canonical public service errors without Strategy source, memory, objective payloads, owner debug, raw replay internals, stack traces, stderr, DSNs, host paths, tokens, sessions, or cookies.
- **D-12:** Stopped-Go drills for public reads must prove no silent TypeScript fallback when Go is selected.

### Route Switches and Monitors

- **D-13:** Replace the current single-route public Strategy switch with a multi-route public read ownership mechanism.
- **D-14:** The route switch should be manifest-driven or route-family-driven enough for boundary monitors, topology evidence, and final cutover artifacts to validate selected owners and no-fallback behavior.
- **D-15:** Route switches must preserve explicit rollback to TypeScript reference without broad fallback logic.

### the agent's Discretion

Downstream agents may choose exact environment variable names, web adapter structure, and monitor artifact shape, but the cutover must be multi-route, Go-default for selected public reads, privacy-safe, schema-validated, parity-tested, and fail-closed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Prior Context

- `.planning/PROJECT.md` - v1.13 goal and hard boundaries.
- `.planning/REQUIREMENTS.md` - PUB-01 through PUB-06 plus milestone-wide privacy/runtime constraints.
- `.planning/ROADMAP.md` - Phase 84 goal, success criteria, and dependencies.
- `.planning/phases/082-ownership-baseline-and-aggressive-cutover-registry/082-CONTEXT.md` - Ownership registry, promotion states, and baseline evidence decisions.
- `.planning/phases/083-go-persistence-and-live-dto-foundation/083-CONTEXT.md` - Live DB, route provider, schema/privacy, parity, and error decisions.
- `.planning/artifacts/v1.13-cutover-scope-decision.md` - Aggressive public read cutover scope.

### Public Read Contracts and TypeScript Reference

- `packages/spec/src/service.ts` - Public route contracts for `getPublicStrategyPage`, `getPublicPlayerPage`, `getPublicLadderSeason`, `getPublicMatchSetSummary`, and `getPublicReplayMetadata`.
- `packages/service/src/index.ts` - TypeScript public DTO assembly and parity oracle behavior.
- `apps/web/lib/public-service-boundary.ts` - Existing public service boundary entry points.
- `apps/web/lib/public-service-adapter.ts` - Existing single-route selected-owner/fail-closed switch.
- `apps/web/lib/public-go-read-client.ts` - Existing Go public Strategy client validation and diagnostics pattern.
- `apps/web/lib/public-service-adapter.test.ts` - Existing no-fallback selected-Go tests.
- `apps/web/lib/public-go-read-client.test.ts` - Existing invalid JSON, schema, privacy, and diagnostic tests.

### Go Backend and Evidence

- `apps/go-backend/main.go` - Current fixture-backed public route handlers and route inventory.
- `apps/go-backend/main_test.go` - Existing Go public route tests.
- `apps/go-backend/testdata/service-fixtures/route-manifest.json` - Current public route inventory baseline.
- `scripts/check-boundary-monitors.ts` - Monitor validation pattern.
- `scripts/check-local-topology.ts` - Direct Go, web-through-Go, and stopped-Go topology evidence pattern.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `apps/web/lib/public-service-adapter.ts` already proves selected-owner routing and fail-closed behavior for `getPublicStrategyPage`.
- `apps/web/lib/public-go-read-client.ts` already has raw JSON validation, schema parsing, public privacy diagnostics, and selected-Go failure classes for public Strategy reads.
- `packages/spec/src/service.ts` already declares all selected public read route contracts except the current adapter only exposes one Go switch.
- Go already serves fixture-backed MatchSet summary, replay metadata, and public Strategy routes; player and ladder page routes need live DTO support before promotion.

### Established Patterns

- Public read promotion must fail closed rather than silently using TypeScript fallback.
- Public outputs must exclude Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, host paths, DB DSNs, sessions, tokens, cookies, and private runtime internals.
- TypeScript service remains parity oracle and rollback reference.
- Full replay projection and owner-debug replay remain out of scope.

### Integration Points

- Phase 84 should update the Phase 82 ownership manifest for public read statuses and evidence.
- Phase 84 should consume Phase 83 live DTO providers rather than relying on fixture-backed Go reads.
- Boundary monitors and topology scripts need to validate multi-route public read ownership rather than only `getPublicStrategyPage`.

</code_context>

<specifics>
## Specific Ideas

Move from `COWARDS_GO_PUBLIC_STRATEGY_READS` to a public route-family or manifest-backed switch. Keep explicit rollback possible, but make selected-Go failures public-safe and no-fallback by default. Treat public replay metadata as a narrow metadata route, not a replay projection migration.

</specifics>

<deferred>
## Deferred Ideas

- Full replay projection and private/owner-debug replay assembly.
- Auth/session and account owner routes.
- Account Strategy Revision writes/forks/source.
- Exhibition creation and worker handoff.
- Worker/runtime, Strategy execution, migrations, and engine changes.

</deferred>

---

*Phase: 84-Public Read Ownership Cutover*
*Context gathered: 2026-05-23*
