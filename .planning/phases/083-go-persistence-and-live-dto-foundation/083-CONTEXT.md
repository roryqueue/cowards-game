# Phase 83: Go Persistence and Live DTO Foundation - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 83 adds the shared Go foundation for live PostgreSQL-backed DTO assembly. It must make selected route families capable of using live data, validating canonical DTO contracts, comparing against TypeScript service/reference behavior, and returning public-safe errors. It does not promote web traffic, change route ownership states to `go_primary`, own migrations, introduce broad ORM/persistence ownership, execute Strategy code, or move worker/runtime responsibilities.

</domain>

<decisions>
## Implementation Decisions

### Live and Fixture Mode Boundary

- **D-01:** Promoted route ownership must require explicit live DB-backed mode. Fixture-backed Go mode remains valid for tests, local parity references, and dev smoke checks only.
- **D-02:** Fixture-only Go startup must reject or refuse any `go_primary` ownership claim for selected v1.13 routes.
- **D-03:** Live DB configuration must be explicit and sanitized; command output, health output, diagnostics, errors, topology files, and monitor artifacts must never print DB DSNs, credentials, host paths, tokens, sessions, cookies, or private runtime internals.
- **D-04:** Phase 83 may keep existing fixture-backed routes available as a reference mode, but selected live DTO providers must be distinguishable from fixture providers in evidence and route manifests.

### Persistence Shape

- **D-05:** Use small route-specific Go query/provider code for selected DTOs rather than adopting a broad ORM, generalized repository layer, or Go-owned migration system.
- **D-06:** Direct PostgreSQL access such as `pgxpool` is acceptable for Go, provided connection lifecycle, timeout/cancellation behavior, and sanitized diagnostics are explicit.
- **D-07:** Existing TypeScript service and persistence behavior remains the parity oracle and migration reference. It should not be treated as the future production path for selected Go-owned routes.
- **D-08:** Go must use the existing schema created by current TypeScript migrations/preflight; Go-owned schema generation or migration execution is deferred.

### DTO, Schema, and Privacy Gate

- **D-09:** Go live DTOs must pass canonical service schema or generated contract checks before web clients consume them in later phases.
- **D-10:** Go live DTOs and error envelopes must pass private-field/privacy scans before response, evidence, monitor, or topology output records them.
- **D-11:** Seeded local parity checks must compare Go live DTOs against TypeScript service/reference output for success, missing, malformed id, unauthorized, forbidden, storage unavailable, ordering, and public error behavior where each case applies.
- **D-12:** Parity evidence should be route-family aware so later phases can promote only the families that passed their own checks.

### Error Handling

- **D-13:** Storage failures, unavailable DB, malformed ids, validation failures, unauthorized/forbidden cases, and not-found cases must map to canonical public-safe service error shapes.
- **D-14:** Error handling must omit stack traces, SQL details, DB DSNs, host paths, stderr, tokens, cookies, sessions, password hashes, Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, and private runtime internals by default.
- **D-15:** Invalid or unsafe Go responses must fail closed for later selected-Go paths rather than silently falling back to TypeScript.

### the agent's Discretion

Downstream agents may choose exact Go package structure, environment variable names, parity script names, and generated contract mechanism, but they must preserve the live/fixture distinction, route-specific provider scope, schema/privacy gates, and sanitized diagnostics.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Prior Context

- `.planning/PROJECT.md` - v1.13 cutover goal and hard project boundaries.
- `.planning/REQUIREMENTS.md` - GODB-01 through GODB-06 plus milestone-wide privacy/runtime constraints.
- `.planning/ROADMAP.md` - Phase 83 goal, success criteria, and downstream dependency ordering.
- `.planning/phases/082-ownership-baseline-and-aggressive-cutover-registry/082-CONTEXT.md` - Ownership manifest, promotion-state, and evidence decisions.
- `.planning/artifacts/v1.13-cutover-scope-decision.md` - Aggressive scope and selected/deferred route families.
- `.planning/research/SUMMARY.md` - v1.13 research summary and route-family build order.

### Go Backend and Existing Fixture Mode

- `apps/go-backend/main.go` - Current fixture-backed server, route inventory, fixture validation, privacy checks, and owner-token handling.
- `apps/go-backend/main_test.go` - Existing Go fixture validation and route tests.
- `apps/go-backend/README.md` - Current read-only fixture-backed Go boundary and deferred responsibilities.
- `apps/go-backend/testdata/service-fixtures/route-manifest.json` - Current fixture route inventory.
- `apps/go-backend/fixture_checksums_gen.go` - Generated fixture checksum baseline.

### TypeScript Reference and Contracts

- `packages/spec/src/service.ts` - Canonical service route metadata, schemas, route ids, fixture refs, and service error shapes.
- `packages/spec/src/service-contract.test.ts` - Existing service contract completeness checks.
- `packages/service/src/index.ts` - TypeScript service DTO assembly and parity oracle behavior.
- `packages/persistence/src/db.ts` - Existing TypeScript DB configuration pattern and default local connection.
- `packages/persistence/src/repositories.ts` - Existing persistence repository patterns.
- `packages/persistence/src/account-revisions.ts` - Strategy Revision storage behavior.
- `packages/persistence/src/auth.ts` - Auth/session storage behavior.
- `packages/persistence/src/matchset-service.ts` - MatchSet creation/reference behavior relevant to later phases.
- `scripts/dev-local-postgres.sh` - Local PostgreSQL setup and preflight flow.

### Monitors and Topology

- `scripts/check-boundary-monitors.ts` - Boundary monitor pattern and privacy-safe artifact checks.
- `scripts/check-service-boundary-imports.ts` - Strict/report-only import baseline.
- `scripts/check-local-topology.ts` - Existing topology evidence pattern and current fixture-loading assumptions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- Current Go startup is entirely fixture-backed through `NewServerFromFixtureDir`, fixture checksum validation, and committed service fixtures.
- The TypeScript stack already has PostgreSQL configuration in `packages/persistence/src/db.ts` and route DTO assembly in `packages/service/src/index.ts`.
- `packages/spec/src/service.ts` defines route ids and DTO contracts for both public and owner/session/mutation routes.
- Existing monitor scripts already check fixture manifests, privacy, topology evidence, and boundary offense counts.

### Established Patterns

- Public and service artifacts are scanned for private fields before use as evidence.
- Route promotion must be explicit and fail closed when selected Go paths are unavailable or invalid.
- TypeScript service remains the reference implementation for parity, not a silent fallback once routes are selected for Go evidence.
- v1.13 does not move engine, Strategy execution, job claiming/completion, Chronicle generation, or migration ownership.

### Integration Points

- Live Go providers should update/extend the Phase 82 route ownership registry and evidence fields without replacing it.
- Phase 84-87 plans will consume Phase 83's live DTO providers and parity harness.
- Boundary monitors need enough structured output to distinguish live-backed selected routes from fixture-backed reference routes.

</code_context>

<specifics>
## Specific Ideas

Require explicit live mode for any future `go_primary` evidence. Keep fixture mode as a named reference/test mode. Prefer route-specific Go providers and parity scripts over broad infrastructure. Make privacy and schema scans mandatory before any DTO or error envelope can be returned to web clients in selected-Go paths.

</specifics>

<deferred>
## Deferred Ideas

- Go-owned migrations/schema generation remain out of scope for v1.13.
- Broad ORM adoption remains out of scope.
- Web route promotion is deferred to Phases 84-87.
- Worker/runtime ownership and Strategy execution remain outside Phase 83.

</deferred>

---

*Phase: 83-Go Persistence and Live DTO Foundation*
*Context gathered: 2026-05-23*
