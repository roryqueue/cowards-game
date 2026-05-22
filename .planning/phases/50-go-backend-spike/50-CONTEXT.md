# Phase 50: Go Backend Spike - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 50 builds a minimal read-only Go service against the Phase 45 service contract. It should prove DTO parity, fixture/schema access, a narrow dev/test web integration, and Go service layout without moving orchestration, writes, jobs, Match execution, or Strategy runtime execution out of TypeScript.

</domain>

<decisions>
## Implementation Decisions

### First Go Endpoint
- **D-01:** Implement health plus public MatchSet summary first.
- **D-02:** Public MatchSet summary is chosen because it aligns with Phase 45's first vertical service slice, is public/privacy-sensitive, is useful for web integration, and is less complex than full replay page data.
- **D-03:** Replay metadata/page data and analytics summary endpoints are not the required first Go endpoint in Phase 50.

### Data Source For The Spike
- **D-04:** Required Go path is fixture first. Go should read committed `packages/golden` MatchSet summary fixtures and serve the service-contract DTO shape.
- **D-05:** Go tests must prove parity against TypeScript/golden expectations.
- **D-06:** Direct PostgreSQL read for the same DTO is optional stretch only after the fixture path is stable.
- **D-07:** Go must not implement orchestration, writes, job claiming, retries, Match execution, Strategy execution, or domain mutation logic in v1.7.
- **D-08:** Go should consume the contract; it must not become the source of DTO truth.

### Web Integration Shape
- **D-09:** Add a dev/test flag for the MatchSet page read path so that one MatchSet summary read can come from Go when explicitly enabled.
- **D-10:** Default web behavior remains the TypeScript service path.
- **D-11:** Do not make Go the default web backend in Phase 50.
- **D-12:** Test-only direct Go calls are insufficient by themselves; the spike should prove a narrow web client integration path.

### Go Module Location And Lifecycle
- **D-13:** The Go service lives in `apps/go-backend`.
- **D-14:** Include explicit spike scripts/docs for `go test` and `go run`.
- **D-15:** Optional root/package script such as `pnpm verify:go-spike` is acceptable if low friction.
- **D-16:** Do not create deep CI/deployment commitments in v1.7 unless the implementation discovers a very light, non-disruptive path.

### Carried Forward From Earlier Phases
- **D-17:** `@cowards/spec` remains canonical for service contracts and DTO schemas.
- **D-18:** `packages/golden` committed fixtures are the required parity source for the spike.
- **D-19:** Public DTO privacy remains strict; Go output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, private runtime internals, or private diagnostics.
- **D-20:** The Go spike is read-only and must not imply backend migration is complete.

### the agent's Discretion
- The planner may choose exact endpoint paths, provided health and public MatchSet summary map clearly to Phase 45's service contract and are documented.
- The planner may choose exact environment variable/flag naming for the dev/test web integration.
- The planner may choose whether the optional root script is worthwhile after checking local toolchain friction.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Planning
- `.planning/PROJECT.md` — v1.7 backend/runtime boundary stabilization goal.
- `.planning/REQUIREMENTS.md` — Phase 50 requirements `GO-01` through `GO-05`.
- `.planning/ROADMAP.md` — Phase 50 goal, success criteria, and milestone closeout role.
- `.planning/research/SUMMARY.md` — Go backend spike recommendation and constraints.
- `.planning/research/STACK.md` — Go `net/http` / `encoding/json` research and JSON parity cautions.
- `.planning/research/ARCHITECTURE.md` — Service boundary and Go spike integration direction.
- `.planning/research/PITFALLS.md` — Accidental rewrite and JSON canonicalization pitfalls.
- `.planning/phases/45-service-boundary-contract/45-CONTEXT.md` — Service contract, package, first MatchSet/replay slice, strict errors/privacy decisions.
- `.planning/phases/47-golden-parity-harness/47-CONTEXT.md` — Fixture ownership, comparison semantics, regeneration, and MatchSet/replay fixture priorities.

### Web And Service Code
- `apps/web/app/matchsets/[matchSetId]/page.tsx` — Current MatchSet page read path and rendering.
- `apps/web/app/competitive/server.ts` — Current TypeScript service-like module for MatchSet result retrieval and DTO shaping.
- `packages/persistence/src/competition.ts` — Current `buildPublicMatchSetResultDto` implementation.
- `packages/spec/src/competition.ts` — Public MatchSet DTO types and related public competition DTOs.
- `packages/spec/src/schemas.ts` — Service DTO schema patterns and privacy validation.

### Future Fixture And Go Integration
- `packages/golden` — New golden fixture package from Phase 47; Go should consume its committed MatchSet summary artifacts once implemented.
- `pnpm-workspace.yaml` — Existing workspace shape; Go module should live under `apps/go-backend` without pretending to be a pnpm package unless useful scripts are added.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Current MatchSet page calls `competitiveServer.getMatchSetResult(matchSetId, user)` and renders standings, entrants, replay evidence, provenance, and private-fields-excluded data.
- Current `competitiveServer` already maps persistence DTOs into page-friendly data and handles owner source affordances.
- Phase 45 service package should provide the contract path that Go mirrors or serves for the public MatchSet summary.
- Phase 47 golden fixtures should provide committed MatchSet summary JSON for Go tests and fixture-backed service responses.

### Established Patterns
- Public MatchSet summaries are privacy-sensitive and include provenance, replay links, standings, scoring policy, visibility, and private field exclusions.
- Owner source links and owner-authorized fields must not appear in public Go fixture responses unless the service contract explicitly authorizes them.
- Default app behavior should remain stable; experimental backend path is opt-in.

### Integration Points
- Add Go module under `apps/go-backend`.
- Go reads fixture files from `packages/golden` using relative paths or documented config.
- Web app uses a dev/test flag to route one MatchSet summary read to Go-backed client.
- Tests compare Go response to committed golden fixture and TypeScript service-contract schema-compatible DTO.

</code_context>

<specifics>
## Specific Ideas

- Health endpoint should prove service process liveness only; it should not imply database/job/runtime readiness unless explicitly implemented.
- Public MatchSet summary endpoint is enough for the spike. Full replay page data can remain TypeScript-owned.
- Optional DB read should be the same DTO shape and should not become a second implementation of scoring rules.

</specifics>

<deferred>
## Deferred Ideas

- Moving orchestration, writes, jobs, Match execution, Strategy execution, auth/session mutation, analytics write flows, or replay projection ownership to Go is deferred.
- Full Go deployment/CI pipeline is deferred.
- Go as authoritative DTO source is explicitly rejected.
- Full replay metadata/page data Go endpoint is deferred unless planning finds it trivial after MatchSet summary.

</deferred>

---

*Phase: 50-Go Backend Spike*
*Context gathered: 2026-05-22*
