# Phase 51: Service Contract Generation and Route Migration - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 51 delivers the first v1.8 contract-generation and service-boundary migration slice. It should make service contract artifacts deterministic and reviewable, enrich canonical route metadata in `@cowards/spec`, migrate a small low-risk set of read paths through `@cowards/service`, and add import/staleness/privacy checks that prove migrated paths do not bypass the boundary.

This phase does not move orchestration, writes, jobs, migrations, Strategy execution, Go ownership, sandbox behavior, or non-JS runtime semantics. Those belong to later v1.8 phases.

</domain>

<decisions>
## Implementation Decisions

### Contract Artifact Policy
- **D-01:** Commit the generated v1.8 service contract artifact, expected to be `service-api-v1.8.openapi.json` or equivalent, so diffs are reviewable and downstream Go/parity work has a stable checked artifact.
- **D-02:** Add deterministic generation plus lint/stale checks. The generated artifact should be reproducible locally and CI should fail when checked output is stale.
- **D-03:** Prefer OpenAPI/JSON Schema generated from canonical Zod schemas in `@cowards/spec`; do not introduce a separate schema DSL or make generated artifacts the source of truth.

### First Route Migration Slice
- **D-04:** Keep the first migration slice tight: service health, public MatchSet summary, public replay metadata, and one additional public read that is already close to service shape.
- **D-05:** Do not include auth mutation, Strategy source retrieval, MatchSet creation, ladder mutations, Workshop execution, worker test-support routes, or analytics write/export routes in Phase 51 migration.
- **D-06:** The extra public read should be chosen for low migration risk and high boundary value. Good candidates are public player page, public Strategy page, or public ladder season read; analytics should wait unless planning proves a specific summary path is already schema-ready.

### Route Registry Shape
- **D-07:** Enrich the existing `SERVICE_API_ROUTES` source in `@cowards/spec` into metadata objects rather than adding a parallel generation registry.
- **D-08:** Route metadata should include stable route id, operation id, method, path, auth scope, privacy class, request schema, response schema, shared error schema, examples, and fixture references.
- **D-09:** Keep `@cowards/spec` the authoritative contract source; `@cowards/service`, generated OpenAPI, Go fixtures, and import guards should consume or validate against it.

### Import Guard Strictness
- **D-10:** Apply strict failing import guards to the named migrated route slice in Phase 51.
- **D-11:** Add a broader report-only scan over `apps/web/app` server modules to reveal remaining direct persistence/runtime imports without blocking Phase 51.
- **D-12:** The strict guard must fail if migrated web/API routes import persistence roots, migration code, worker entrypoints, runtime adapters, or Strategy execution modules directly.

### the agent's Discretion
- The planner may decide the exact additional public read in the first slice after inspecting code and tests, as long as it stays low-risk, public-safe, read-only, and already close to service shape.
- The planner may choose the artifact directory/name, but it should be versioned, deterministic, and easy for Phase 52 Go parity to consume.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and Milestone
- `.planning/PROJECT.md` — Current v1.8 milestone frame, constraints, and out-of-scope boundaries.
- `.planning/REQUIREMENTS.md` — Phase 51 requirements `GEN-01` through `GEN-07`.
- `.planning/ROADMAP.md` — Phase 51 goal, dependencies, and success criteria.
- `.planning/research/SUMMARY.md` — v1.8 synthesis for stack, feature behavior, architecture direction, watch-outs, and phase shape.
- `.planning/research/STACK.md` — Contract generation stack recommendation and tool exclusions.
- `.planning/research/ARCHITECTURE.md` — Integration direction for canonical spec -> service -> web/Go/monitors.
- `.planning/research/PITFALLS.md` — Phase-specific risks around schema drift, false migration, and bypasses.

### Shipped Boundary Baseline
- `.planning/milestones/v1.7-REQUIREMENTS.md` — Prior service/runtime boundary requirements and deferred contract generation items.
- `.planning/milestones/v1.7-ROADMAP.md` — Phase 45 service boundary and Phase 50 Go spike context.
- `.planning/milestones/v1.7-MILESTONE-AUDIT.md` — Closed audit findings around persistence-root service imports, runtime worker imports, and schema-drift fallback behavior.

### Source Specs
- `AGENTS.md` — Non-negotiables for purity, Strategy isolation, runtime boundaries, privacy, and canonical terminology.
- `CowardsGameSpec_Full_Consolidated_v1.md` — Product/rules terminology and replay/privacy expectations.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Architecture constraints and boundary expectations.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/spec/src/service.ts`: Current `SERVICE_API_VERSION`, `SERVICE_API_ROUTES`, service DTO interfaces, service error codes, and public DTO leak scanner.
- `packages/spec/src/schemas.ts`: Existing Zod schemas for service error, service health, route ids, auth session, Strategy revision summaries, and other DTO foundations.
- `packages/service/src/index.ts`: Current typed local service boundary with health, public MatchSet summary, and public replay metadata.
- `packages/service/src/service.test.ts`: Existing service envelope tests that can expand into contract-generation and equivalence tests.
- `apps/web/app/api/service/health/route.ts`: Existing service-backed API route proving the route can call `@cowards/service` without persistence.
- `apps/web/app/competitive/server.ts`: Current mixed boundary. It imports many persistence modules but already uses `@cowards/service` for `getMatchSetResult`, making public MatchSet reads a natural migrated slice.

### Established Patterns
- `@cowards/spec` already centralizes service versions, route ids, DTO types, Zod schemas, and privacy guards. Phase 51 should extend this instead of creating a competing contract source.
- `@cowards/service` is allowed to import persistence implementation details; migrated web/API route handlers should call the service boundary instead of importing persistence roots directly.
- Public DTO privacy is enforced through `assertPublicServiceDtoLeakSafe`; Phase 51 should reuse and broaden this scanner rather than hand-checking individual fields.
- The repo already uses pnpm/turbo scripts and Vitest. Contract generation/linting/staleness checks should fit this workflow.

### Integration Points
- `packages/spec` owns route metadata, schemas, generated artifact generation, and service API versioning.
- `packages/service` validates or produces DTOs using the canonical schemas and exposes route-facing service methods.
- `apps/web/app/api/**` and server loaders selected for migration call `@cowards/service` and are covered by strict import guards.
- Phase 52 Go parity should consume the committed artifact and fixture references created in Phase 51.

</code_context>

<specifics>
## Specific Ideas

- Generated artifacts should be committed for reviewability, not only generated transiently.
- The first route slice should be intentionally modest. The goal is to prove the migration ratchet, not maximize endpoint count.
- Broad app import scanning should start report-only so Phase 51 reveals remaining debt without failing unrelated legacy routes.

</specifics>

<deferred>
## Deferred Ideas

- Broad strict import enforcement across all `apps/web/app` server modules is deferred until after the named migrated-route guard is proven.
- Analytics route migration may happen in Phase 51 only if planning finds one public summary read already schema-ready; otherwise it is better left to later parity/monitoring work.
- Generated TypeScript clients, production API docs UX, GraphQL/gRPC/TypeSpec, and OpenAPI-first rewrites are out of scope for Phase 51.

</deferred>

---

*Phase: 51-Service Contract Generation and Route Migration*
*Context gathered: 2026-05-22*
