# Phase 45: Service Boundary Contract - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 45 defines the typed service/API boundary that the web app needs before any backend rewrite. It should create the contract spine and move one real public read path through it, while preserving existing TypeScript persistence, orchestration, jobs, Match execution, and Strategy runtime boundaries.

</domain>

<decisions>
## Implementation Decisions

### Contract Source Of Truth
- **D-01:** `@cowards/spec` remains the canonical source of truth for service DTO contracts, zod schemas, compatibility/version fields, privacy checks, and golden fixture validation.
- **D-02:** OpenAPI is secondary and non-authoritative in v1.7. Phase 45 should create only a minimal OpenAPI stub for health plus representative read endpoint(s), shaped from the schema-first contract where practical.
- **D-03:** Do not make OpenAPI, Go structs, route handlers, or persistence records the canonical contract source in this phase.

### Service Layer Shape
- **D-04:** Add a new shared service package for the service boundary. Canonical DTOs and schema definitions still live in `@cowards/spec`; the new package owns service interfaces, client-facing method shapes, local TypeScript implementation, and boundary tests.
- **D-05:** The service package should be shaped so a future remote or Go-backed client can slot in later, but Phase 45 should not build a full remote-client abstraction yet.
- **D-06:** Define a broad service interface skeleton for the milestone scope, covering auth/session, Strategy revisions, MatchSets, replay DTOs, analytics profiles/runs, exports, ladders, public pages, and health.
- **D-07:** Implement only selected read paths concretely in Phase 45. This keeps the contract complete enough for the milestone while limiting implementation risk.

### First Boundary Slice
- **D-08:** The first concrete service implementation slice is public MatchSet summary plus replay metadata/page data.
- **D-09:** Phase 45 should migrate one vertical read path end to end: MatchSet page and replay page/server data loading should go through the new service package.
- **D-10:** Tests must prove the migrated vertical path returns equivalent DTOs and preserves current privacy behavior.
- **D-11:** Analytics can be prepared in the broad interface skeleton or deferred to later phases; it should not displace MatchSet/replay as the first proof path.

### Error And Privacy Contract
- **D-12:** Service errors should be structured from day one, with stable error codes/status classes suitable for TypeScript and future Go/client parity.
- **D-13:** Public and owner-authorized DTOs must be separate schema families. Public DTOs must not carry optional private fields that can accidentally be filled.
- **D-14:** Public service DTO schema tests and leak checks must fail if they expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, or private runtime internals.
- **D-15:** Owner-authorized DTOs require explicit authorization paths. They may include owner-only fields only through separate schemas and service methods.

### the agent's Discretion
- The planner may choose the exact package name, but it should be an explicit shared package such as `packages/service` or similarly clear naming.
- The planner may choose the minimal OpenAPI stub format and location, provided it remains non-authoritative and points back to `@cowards/spec`.
- The planner may decide whether to expose service methods as classes, factory functions, or plain objects, provided dependencies are injectable for tests and future remote clients.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Planning
- `.planning/PROJECT.md` — Current milestone goal, constraints, key decisions, and v1.7 scope.
- `.planning/REQUIREMENTS.md` — Phase 45 requirements `SVC-01` through `SVC-06` and traceability.
- `.planning/ROADMAP.md` — Phase 45 goal, success criteria, canonical refs, and milestone order.
- `.planning/research/SUMMARY.md` — Contract-first and parity-first research synthesis.
- `.planning/research/ARCHITECTURE.md` — Existing integration points and recommended service boundary direction.
- `.planning/research/PITFALLS.md` — Contract drift, privacy regression, accidental rewrite, and JSON parity pitfalls.

### Primary Source Specs
- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical game terminology and deterministic Match contract.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Architecture constraints around engine purity, runtime isolation, persistence, and replay.

### Contract And DTO Code
- `packages/spec/src/types.ts` — Existing canonical DTO/type definitions and Strategy Revision runtime metadata shape.
- `packages/spec/src/schemas.ts` — Existing zod schemas, memory limits, Strategy Revision schema, Chronicle/replay schemas, and privacy-facing validation patterns.
- `packages/spec/src/competition.ts` — Existing public MatchSet, ladder, profile, Strategy card, standing, and match evidence DTO types.
- `packages/spec/src/analytics.ts` — Existing analytics contracts, compatibility keys, replay references, and public leak checks.

### Current Web And Persistence Integration
- `apps/web/app/competitive/server.ts` — Current web-owned competitive service module that imports persistence directly and builds MatchSet/profile/ladder DTOs.
- `apps/web/app/matches/server.ts` — Current replay page data loader/server module that imports persistence and builds replay page data.
- `apps/web/app/matches/types.ts` — Current replay page DTOs that should move or be mirrored into service/spec contracts.
- `apps/web/app/matches/replay-ready.ts` — Current replay metadata, timeline, focus, owner-debug, and public projection assembly.
- `packages/persistence/src/competition.ts` — `buildPublicMatchSetResultDto` and public MatchSet DTO assembly.
- `packages/persistence/src/chronicle-store.ts` — Chronicle storage/metadata boundary used by replay page data.
- `packages/replay/src/project.ts` — Public versus owner Chronicle projection behavior and privacy boundary.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@cowards/spec` schemas and types already form the contract spine; Phase 45 should extend them instead of duplicating DTO truth.
- `apps/web/app/competitive/server.ts` already behaves like a local service facade, but it is web-owned and imports persistence directly.
- `apps/web/app/matches/server.ts` and `apps/web/app/matches/replay-ready.ts` already isolate replay page data assembly and are good candidates for the first vertical migration.
- `packages/persistence/src/competition.ts` exposes `buildPublicMatchSetResultDto`, which can remain the local implementation behind the new shared service boundary.
- Existing replay and analytics leak checks provide patterns for strict public DTO privacy tests.

### Established Patterns
- Public DTOs are summary-oriented and privacy-safe by default.
- Owner-only data is server-authorized and should remain separated from public URL/query affordances.
- Existing server modules use dependency injection (`withPool`, dependency overrides) for tests; the new service package should preserve this style.
- Storage fallbacks and storage-unavailable error mapping exist in web server modules and can guide structured service errors.

### Integration Points
- New package should depend on `@cowards/spec` and `@cowards/persistence` for the local TypeScript implementation.
- `apps/web` should depend on the new service package for the migrated MatchSet/replay vertical path.
- `packages/spec` should receive service DTO schemas, structured error schemas, and public/owner schema families needed by the service package.
- Minimal OpenAPI stub should reference the service/spec contracts and include health plus representative MatchSet/replay read endpoints.

</code_context>

<specifics>
## Specific Ideas

- Use MatchSet summary plus replay metadata/page data as the first proof path because it is public, privacy-sensitive, replay-backed, central to product trust, and useful for the later Go backend spike.
- Keep the broad service interface visible enough that later phases can add runtime ABI, parity fixtures, adapter registry metadata, non-JS runtime spike, and Go backend spike without rethinking Phase 45.
- Treat OpenAPI as a helpful map for future HTTP consumers, not as the contract authority.

</specifics>

<deferred>
## Deferred Ideas

- Full OpenAPI coverage for every service area is deferred until after schema-first service contracts and at least one real read path prove the shape.
- Remote HTTP client implementation is deferred until the Go backend spike or a later backend migration phase needs it.
- Moving Workshop writes, auth/session mutation flows, analytics persistence actions, job orchestration, Match execution, or Strategy runtime execution behind a remote backend is out of scope for Phase 45.

</deferred>

---

*Phase: 45-Service Boundary Contract*
*Context gathered: 2026-05-22*
