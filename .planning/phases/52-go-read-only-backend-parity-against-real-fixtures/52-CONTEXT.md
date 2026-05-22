# Phase 52: Go Read-Only Backend Parity Against Real Fixtures - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 52 promotes the v1.7 Go backend spike from static DTO proof to a v1.8 read-only parity service backed by generated real fixture JSON and TypeScript service/schema outputs. It proves Go can serve an allowlisted read surface that matches canonical TypeScript DTOs without taking over orchestration, writes, jobs, migrations, auth mutation, Strategy submission/source retrieval, or Strategy execution.

</domain>

<decisions>
## Implementation Decisions

### Fixture Source
- **D-01:** Generate committed v1.8 Go parity JSON fixtures from TypeScript canonical schemas/fixtures, not hand-written Go literals.
- **D-02:** Treat generated parity fixtures as test input for Go and as the TypeScript service-output baseline for Phase 52. Add stale-output checks so Go parity cannot drift quietly.
- **D-03:** Include at least one degraded or system-failed public evidence fixture and run the same privacy leak checks over generated fixtures.

### Read Surface
- **D-04:** Go remains read-only and allowlisted. v1.8 endpoints are health, public MatchSet summary, public replay metadata, and one selected analytics run summary.
- **D-05:** The selected analytics surface is a read-only analytics run summary envelope backed by `AnalyticsGauntletRunSummarySchema`. It is owner/diagnostic parity evidence, requires a matching owner identity even in the Go spike, is not a public OpenAPI route, and is not an analytics mutation/export rewrite.
- **D-06:** Go should return v1.8 service DTO shapes exactly. Replay metadata uses the Phase 51 `metadata` envelope, not the older v1.7 `chronicle`/`replayAvailable` shape.

### Parity and Guardrails
- **D-07:** Compare Go HTTP responses to canonical JSON fixtures with deterministic JSON equality, schema-valid TypeScript fixtures, privacy leak scanning, and missing-resource public error checks.
- **D-08:** Add route inventory tests that fail on mutation verbs or unsupported endpoints.
- **D-09:** Go docs must explicitly list TypeScript-owned responsibilities: auth mutation, Strategy submission, Strategy source retrieval, MatchSet creation, Match orchestration, job claiming, migrations, persistence writes, and Strategy execution.

### the agent's Discretion
- The planner may choose exact fixture paths and script names, provided they are deterministic, committed, easy to run locally, and referenced from Go tests/docs.
- The planner may keep the Go service standard-library-only unless a dependency clearly reduces risk.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` — Phase 52 goal and success criteria.
- `.planning/REQUIREMENTS.md` — GO-01 through GO-06.
- `.planning/STATE.md` — Current milestone position and constraints.
- `.planning/phases/51-service-contract-generation-and-route-migration/51-CONTEXT.md` — Phase 51 service contract decisions.
- `.planning/phases/51-service-contract-generation-and-route-migration/51-REVIEW.md` — Clean review and strict boundary guard state.
- `AGENTS.md` — Non-negotiables for engine purity, Strategy isolation, and replay/privacy.
- `packages/spec/src/service.ts` — v1.8 route metadata.
- `packages/spec/src/schemas.ts` — canonical DTO schemas.
- `packages/spec/src/service-fixtures.ts` — canonical service examples.
- `packages/spec/src/analytics.ts` — analytics public summary leak guard.
- `packages/persistence/src/workshop-analytics.ts` — deterministic analytics demo snapshot and persisted summary source.
- `packages/service/src/index.ts` — TypeScript service boundary.
- `apps/go-backend/main.go` and `apps/go-backend/main_test.go` — existing v1.7 Go spike.

</canonical_refs>

<code_context>
## Existing Code Insights

- `apps/go-backend` currently hardcodes `service-api-v1.7`, static in-memory DTOs, and only tests health plus MatchSet summary.
- Phase 51 produced `service-api-v1.8`, canonical schemas, committed OpenAPI, and strict migrated-route import guards.
- `@cowards/service` currently exposes health, public MatchSet summary, replay metadata, and public Strategy page. It does not yet expose analytics summary.
- Analytics has strong existing real data: `createWorkshopAnalyticsDemoSnapshot()` includes strong, thin, degraded, and system-failed evidence bands; `AnalyticsGauntletRunSummarySchema` already leak-checks public/owner-safe analytics summaries.

</code_context>

<specifics>
## Specific Ideas

- Preferred fixture directory: `apps/go-backend/testdata/service-fixtures/`.
- Preferred generator: root script under `scripts/` that writes Go parity fixtures from TypeScript schemas/examples.
- Preferred Go tests: endpoint response equals TypeScript-service-generated fixture JSON; route inventory matches the generated contract manifest; owner analytics rejects missing/mismatched owner identity; POST/DELETE/PUT/PATCH return non-success; serialized responses omit private markers/keys.

</specifics>

<deferred>
## Deferred Ideas

- Go persistence/database reads are deferred unless explicitly chosen later; Phase 52 can prove parity from generated real fixtures.
- Go mutations, orchestration, job claiming, Strategy execution, migrations, auth writes, and source retrieval remain out of scope.
- Public analytics product routes remain out of scope; the selected analytics summary is parity evidence.

</deferred>

---

*Phase: 52-Go Read-Only Backend Parity Against Real Fixtures*
*Context gathered: 2026-05-22*
