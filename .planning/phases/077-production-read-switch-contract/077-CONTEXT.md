# Phase 77: Production Read Switch Contract - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 77 defines and tests the route-scoped TypeScript-vs-Go read switch contract. It should create the switch semantics, typed Go client boundary, failure mapping, schema/privacy validation, and diagnostics contract needed by later phases. It must not promote the route yet, add broad backend routing, move `@cowards/service` ownership to Go, or implement unrelated Go routes.

</domain>

<decisions>
## Implementation Decisions

### Switch Shape
- **D-01:** Use a route-specific switch, not a global backend mode.
- **D-02:** Default behavior remains the TypeScript service path.
- **D-03:** Enable only the selected route with explicit config such as `COWARDS_GO_PUBLIC_STRATEGY_READS=1`.
- **D-04:** Require explicit Go backend URL/config when Go route selection is enabled.
- **D-05:** Reject or ignore any attempt to enable non-v1.12 routes for Go production reads.
- **D-06:** Do not add a broad switch such as `GO_BACKEND_ENABLED=true`.

### Failure Mapping
- **D-07:** Use specific internal/evidence failure classes while collapsing user-facing behavior to canonical public-safe service errors.
- **D-08:** Internal classes should include `go_unavailable`, `go_timeout`, `go_non_json`, `go_schema_invalid`, `go_privacy_violation`, `go_status_mismatch`, and `go_body_divergent`.
- **D-09:** Missing and malformed ids should preserve existing TypeScript route behavior where possible.
- **D-10:** Go unavailable, timeout, non-JSON, schema failure, privacy failure, and divergence should map to `UPSTREAM_UNAVAILABLE` or an existing public-safe 503 equivalent.
- **D-11:** Never expose raw Go error text, secret-bearing URLs, stack traces, host paths, stderr, database DSNs, tokens, sessions, or response body excerpts.

### Go Client Boundary
- **D-12:** Put the typed Go client beside the web public service adapter, not in React/routes and not inside `@cowards/service`.
- **D-13:** Favor a module such as `apps/web/lib/public-go-read-client.ts` for fetch, timeout, schema validation, privacy checks, and error mapping.
- **D-14:** Keep `apps/web/lib/public-service-adapter.ts` responsible for owner selection and default TypeScript service construction.
- **D-15:** Keep `apps/web/lib/public-service-boundary.ts` as the page-facing public read boundary.
- **D-16:** Keep `@cowards/service` as the canonical TypeScript service and parity oracle, not a mixed TypeScript/Go routing package.

### Diagnostics Contract
- **D-17:** Provide both internal evidence artifacts and minimal public/operator-visible status, with a hard privacy split.
- **D-18:** Internal evidence may include route id, selected backend, failure class, status, duration bucket, schema/privacy check result, and sanitized target origin.
- **D-19:** Public/operator-visible status should include only route id, selected owner, route health, service API version, and last check result class.
- **D-20:** No public status, evidence artifact, topology output, or log may include tokens, sessions, raw secret-bearing URLs, host paths, database DSNs, stack traces, stderr, response body excerpts, Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, or private runtime internals.

### the agent's Discretion
Planner may choose exact env var names and module filenames if they remain route-specific, explicit, reversible, and aligned with the decisions above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/phases/076-scope-lock-and-route-ownership-manifest/076-CONTEXT.md` — Locked ownership matrix shape, all-or-nothing scorecard, baseline bundle, and no-go decision format.

### Active Milestone
- `.planning/PROJECT.md` — Current v1.12 milestone posture and non-goals.
- `.planning/REQUIREMENTS.md` — SWCH requirements and traceability.
- `.planning/ROADMAP.md` — Phase 77 scope and dependencies.
- `.planning/research/SUMMARY.md` — Switch architecture recommendation and promotion criteria.

### Code References
- `apps/web/lib/public-service-adapter.ts` — Current TypeScript public service adapter and recommended switch owner.
- `apps/web/lib/public-service-boundary.ts` — Page-facing public read boundary to preserve.
- `packages/service/src/index.ts` — Canonical TypeScript service and parity oracle.
- `packages/spec/src/service.ts` — Canonical service route metadata and error DTO schema.
- `packages/spec/src/schemas.ts` — Canonical service schemas including `ServiceErrorDtoSchema`.
- `scripts/check-local-topology.ts` — Existing public-safe diagnostics and topology sanitization patterns.
- `scripts/check-boundary-monitors.ts` — Existing monitor pattern for privacy and route constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `publicReadService` in `apps/web/lib/public-service-adapter.ts`: current TypeScript default path that should remain the fallback owner only when TypeScript is selected.
- `getPublicStrategyCard` in `apps/web/lib/public-service-boundary.ts`: current page-facing use of `getPublicStrategyPage` payload; later phases can route this through the adapter without changing React/page logic.
- `safeDetail` and `sanitizeDiagnosticUrl` in `scripts/check-local-topology.ts`: reusable patterns for diagnostics safety.
- `ServiceErrorDtoSchema` and `ServiceErrorDto` in `@cowards/spec`: canonical public-safe error shape.

### Established Patterns
- Strict migrated web reads use boundary modules/adapters to keep route/page code clean.
- Topology diagnostics sanitize URLs and bearer tokens before output.
- Public DTO privacy is enforced through spec-owned guards rather than ad hoc string checks in React.

### Integration Points
- Phase 77 switch contract feeds Phase 78's conditional public Strategy route path.
- Failure classes and diagnostics fields feed Phase 79 privacy/parity monitors and Phase 80 operational drills.

</code_context>

<specifics>
## Specific Ideas

Prefer a route-specific env var such as `COWARDS_GO_PUBLIC_STRATEGY_READS=1`. Do not infer Go ownership merely because `COWARDS_GO_BACKEND_URL` exists.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 77-Production Read Switch Contract*
*Context gathered: 2026-05-23*
