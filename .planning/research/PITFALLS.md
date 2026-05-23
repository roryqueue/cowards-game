# Domain Pitfalls: v1.12 Go Backend Promotion Readiness and Cutover Plan

**Project:** Coward's Game
**Researched:** 2026-05-23
**Scope:** Pitfalls for adding production Go read routing to the existing TypeScript service-owned web app. This is not a broad backend rewrite.
**Overall confidence:** HIGH for codebase-specific guardrails and failure modes; MEDIUM for exact v1.12 phase numbers because the roadmap is not created yet.

## Recommended v1.12 Phase Ownership

Use these phase names as the roadmap anchor for the warnings below:

| Proposed Phase | Purpose |
| --- | --- |
| Phase 76: Scope Lock and Route Ownership Manifest | Decide whether any route is eligible, freeze non-goals, define service ownership and route manifest rules before code changes. |
| Phase 77: Production Read Routing Switch Contract | Define the web-to-Go read switch, no-fallback semantics, health behavior, observability, and local/CI topology evidence. |
| Phase 78: Optional Single Read Route Promotion | Promote at most one boring public GET route only if Phase 76 and 77 criteria are satisfied. Skip promotion if criteria fail. |
| Phase 79: Privacy, DTO, Fixture, and Schema Drift Gate | Prove public/private DTO separation, generated fixture freshness, schema parity, and privacy-safe diagnostics. |
| Phase 80: Rollback and Operational Failure Drill | Prove rollback, fail-closed behavior, outage handling, and production safety without changing writes or execution. |
| Phase 81: Milestone Verification and Scope-Creep Audit | Run the full gate and prove no writes, runtime, orchestration, source retrieval, or broader Go ownership slipped in. |

## Critical Pitfalls

### Pitfall 1: Accidental TypeScript Fallback Makes Go Promotion Meaningless

**What goes wrong:** Production or validation routing silently serves the TypeScript service when Go is unavailable, divergent, misconfigured, or returning a wrong shape. The route appears "promoted" but the system has not proven Go can own the read path.

**Why it happens:** v1.11 topology supports optional checks by default and required checks only with `--require-go`. It also intentionally left production web traffic on TypeScript. A production switch that treats Go as an optional optimization will recreate the optional topology behavior in user traffic.

**Warning signs:**
- Web route code catches Go fetch failures and calls the TypeScript service in the same request path.
- Success metrics do not identify whether Go or TypeScript served the request.
- `pnpm topology:check -- --require-go --json` is not part of the promotion gate.
- Tests pass when Go is stopped.
- Rollback docs describe "automatic fallback" instead of an explicit operator action.

**Prevention:**
- Phase 77 must define a fail-closed production switch: if a route is Go-owned for a given environment, Go failure returns a public-safe service error rather than silently falling back.
- Phase 80 must include a stopped-Go drill proving promoted-route requests fail in the expected public-safe way, and a separate rollback drill proving the operator can intentionally route back to TypeScript.
- Phase 81 must reject any try/catch fallback in the promoted route path unless the fallback is explicitly the rollback mode and is externally visible in configuration/evidence.

**Detection:** Required live topology fails when Go is stopped; route response headers/logs identify backend ownership; route tests assert TypeScript fallback is not invoked in Go-owned mode.

**Phase:** Phase 77, Phase 80, Phase 81.

### Pitfall 2: Public Privacy or Diagnostic Log Leak

**What goes wrong:** A Go response, topology output, route log, error body, or manifest artifact exposes Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, bearer tokens, or private runtime internals.

**Why it happens:** The current Go service validates fixture files and blocks known private keys, but production routing adds new failure surfaces: HTTP proxy errors, fetch diagnostics, request URLs, authorization headers, upstream stack traces, and route ownership logs. The existing `safeDetail` sanitizer is strong for topology diagnostics, not a complete production logging policy.

**Warning signs:**
- Logs include full request URLs with query tokens or raw `Authorization` values.
- Error DTO details contain upstream body text, Go panic text, stack traces, host paths, or process environment.
- Public/private checks only scan successful fixture JSON, not failed Go requests.
- Owner-scoped route evidence is reused as public route evidence.
- New forbidden field names are added to schemas without updating leak guards.

**Prevention:**
- Phase 79 must extend privacy checks to promoted-route success, 404, 401/403, 5xx, timeout, and invalid JSON responses.
- Phase 77 must standardize public-safe error mapping for Go failures using `ServiceErrorDto` shapes only.
- Phase 80 must include diagnostic-output review for cutover, rollback, unavailable-Go, divergent-Go, and bad-auth cases.
- Do not promote any owner route in v1.12 unless bearer-token, session identity, not-found masking, and log redaction are proven. Prefer a public GET if any route is promoted.

**Detection:** Boundary monitors and route tests scan response bodies and captured diagnostic details for private markers; topology JSON remains public-safe during both pass and fail cases.

**Phase:** Phase 77, Phase 79, Phase 80.

### Pitfall 3: Route Ownership Ambiguity

**What goes wrong:** TypeScript spec metadata, Go route inventory, Next.js route files, local topology samples, OpenAPI artifacts, and service methods disagree about who owns a route, whether it is public or owner-scoped, and what path/signature is canonical.

**Why it happens:** The codebase already has multiple route views: `SERVICE_API_ROUTES`, `route-manifest.json`, Go `routeInventory`, Next routes, and topology sample paths. v1.11 kept these aligned for evidence-only Go routes, but production routing adds an ownership dimension not currently represented as a first-class manifest field.

**Warning signs:**
- A route is present in Go but absent from `SERVICE_API_ROUTES`.
- Route manifest entries are updated manually without regenerated checksums.
- A Next route proxies to Go while the ownership matrix still says TypeScript service-owned.
- Public OpenAPI excludes or includes a route differently from production routing.
- The route path in Go differs from the web path or service signature.

**Prevention:**
- Phase 76 must create a v1.12 route ownership manifest with route id, method, path, auth scope, privacy class, TypeScript owner, Go owner, production-routing state, rollback owner, sample path, and promotion status.
- Phase 77 must require route ownership metadata in the switch, not just env vars.
- Phase 79 must assert manifest alignment across `SERVICE_API_ROUTES`, Go `routeInventory`, generated fixtures, topology samples, and any promoted web route.

**Detection:** A monitor fails on any route missing ownership metadata, any unexpected Go route, any non-GET Go route, and any production-routed route not marked promoted.

**Phase:** Phase 76, Phase 77, Phase 79.

### Pitfall 4: Fixture Drift Hides Real Behavior Drift

**What goes wrong:** Go passes parity against stale or narrow fixtures while TypeScript service behavior, public DTO shape, error mapping, ordering, or redaction has changed.

**Why it happens:** `pnpm go:parity` checks generated fixture freshness and Go tests compare served JSON to committed fixtures, but fixtures are still snapshots. A production route needs live behavior criteria, not only fixture equality.

**Warning signs:**
- Fixture updates are approved without explaining source service behavior changes.
- The promoted route uses a fixture-backed Go handler while production needs live data.
- Parity only covers the sentinel id and not missing, degraded, and invalid id cases.
- Go tests compare top-level envelopes but not nested schema semantics.
- `fixture-manifest.json` changes without `fixture_checksums_gen.go` changing, or vice versa.

**Prevention:**
- Phase 76 must decide whether the optional promoted route is allowed to be fixture-backed. If production users need live data, fixture-backed promotion should be rejected.
- Phase 78 must require route-specific parity cases: success, missing, malformed id, degraded/system-failed if applicable, privacy rejection, and ordering.
- Phase 79 must keep `pnpm go:parity` mandatory and add promoted-route schema equivalence tests against TypeScript service outputs.

**Detection:** `pnpm go:parity --check`, Go checksum startup validation, route-specific schema tests, and live topology samples all fail on stale or hand-edited fixtures.

**Phase:** Phase 76, Phase 78, Phase 79.

### Pitfall 5: Schema Drift Between TypeScript and Go

**What goes wrong:** Go returns a DTO that is close enough for the UI today but no longer matches `@cowards/spec` exactly. Nulls, omitted fields, enum casing, unknown fields, route errors, or version strings diverge.

**Why it happens:** Go currently validates top-level fixture shape with strict structs, then allows nested maps for several DTO payloads. TypeScript owns the real Zod schemas. A promoted Go route can drift inside nested data unless TypeScript schema validation remains part of the gate.

**Warning signs:**
- New Go structs are hand-written without generated TypeScript schema validation.
- Nested DTOs are represented as `map[string]any` and not revalidated by TypeScript schemas.
- OpenAPI version, service API version, or route `kind` changes are patched in Go manually.
- Consumer tests parse Go responses with permissive schemas or snapshots only.

**Prevention:**
- Phase 79 must require promoted Go responses to round-trip through the canonical `@cowards/spec` response schema for that route.
- Phase 78 should avoid routes with large nested DTOs unless schema validation is already comprehensive.
- Do not introduce a second Go-owned schema source in v1.12. Go should serve shapes generated or validated from TypeScript service contracts.

**Detection:** TypeScript schema parse tests for live Go responses; OpenAPI drift checks; Go tests rejecting unknown top-level fields; route contract checks that fail on version or `kind` mismatch.

**Phase:** Phase 78, Phase 79, Phase 81.

### Pitfall 6: Public and Private DTO Confusion

**What goes wrong:** A public route accidentally uses an owner DTO, or an owner route is exposed through public Go routing. Public replay, Strategy, player, ladder, and analytics surfaces leak private fields or become existence oracles.

**Why it happens:** The codebase has public service DTOs, owner-safe DTOs, owner analytics summaries, private source routes, and replay owner-debug/private Chronicle paths. Go route metadata currently includes both public and owner entries for evidence, but production promotion should not treat those equally.

**Warning signs:**
- A route with `privacyClass: "owner"` appears in public OpenAPI or public production routing.
- A public route includes `ownerUserId` or owner-only analytics fields without a public privacy review.
- Missing resources return different public statuses depending on private ownership.
- Strategy source retrieval is described as a "read route" candidate.

**Prevention:**
- Phase 76 must classify every candidate as public, owner, or internal and reject owner/private/source-bearing routes for v1.12 production Go promotion unless separately proven.
- Phase 79 must run public leak guards on public artifacts and owner-safe guards on owner artifacts; do not use one check for both.
- Phase 78 should prefer a route with existing public DTO and no session or owner-token dependency.

**Detection:** Public OpenAPI contains only public routes; `assertPublicServiceDtoLeakSafe` rejects promoted public outputs; owner route topology tests prove auth rejection and not-found masking if any owner route remains evidence-only.

**Phase:** Phase 76, Phase 78, Phase 79.

### Pitfall 7: Topology Lies About Production Readiness

**What goes wrong:** Local checks pass but production routing is unproven because topology only tested fixture-backed local Go on `127.0.0.1:8087`, optional live checks, or static diagnostics.

**Why it happens:** `pnpm topology:check` is intentionally a local harness. It can require Go, but it does not by itself prove deployment health checks, production route wiring, cutover config, origin identity, timeout budgets, or rollback.

**Warning signs:**
- "Topology passed" is used as the only production readiness argument.
- Required live Go topology is run without the web route actually proxying to Go.
- The topology sample route differs from the promoted route.
- A route is promoted without proving the web process can reach Go in the intended environment.
- Logs do not show process attribution for served requests.

**Prevention:**
- Phase 77 must define production-read topology separately from static/local topology: web process, Go process, routing config, health checks, timeouts, ownership headers, and diagnostics.
- Phase 78 must add a web-routed smoke for the candidate, not just direct Go smoke.
- Phase 80 must test unavailable-Go behavior through the web route and direct Go route.

**Detection:** Required checks include direct Go smoke, web-to-Go smoke, stopped-Go failure through web, and visible backend attribution.

**Phase:** Phase 77, Phase 78, Phase 80.

### Pitfall 8: Rollback Plan Is Only Documentation

**What goes wrong:** The milestone says rollback is possible, but no command, flag, config, test, or drill proves the promoted route can be returned to TypeScript safely.

**Why it happens:** v1.11 rollback was easy because production web traffic never left TypeScript. v1.12 changes that assumption if any route is promoted.

**Warning signs:**
- Rollback is described as reverting commits only.
- The Go routing flag is read only at build time with no operational procedure.
- Rollback changes response shape, cache behavior, status codes, or privacy redaction.
- No test proves TypeScript and Go return equivalent responses immediately before rollback.

**Prevention:**
- Phase 77 must define the routing control: route-level env/config, default owner, allowed values, and safe startup validation.
- Phase 80 must run a forward cutover and rollback drill for the exact promoted route.
- Phase 81 must require evidence that rollback does not affect writes, runtime execution, Match orchestration, sessions, or Strategy source access.

**Detection:** Automated smoke runs pass in TypeScript-owned mode, Go-owned mode, Go unavailable in Go-owned mode, and TypeScript rollback mode.

**Phase:** Phase 77, Phase 80, Phase 81.

### Pitfall 9: Operational Failure Behavior Is Under-Specified

**What goes wrong:** Timeouts, invalid JSON, partial responses, 404s, 403s, Go startup panics, fixture checksum failures, and upstream unavailability produce inconsistent UI behavior or leak internals.

**Why it happens:** Current Go handlers are simple fixture responders and fail startup on invalid fixtures. Production routing adds network and process failure modes that direct TypeScript service calls did not have.

**Warning signs:**
- Fetch calls have no explicit timeout or abort behavior.
- Invalid JSON becomes a 500 with raw upstream text.
- Go 404/403 errors are mapped differently from TypeScript service errors.
- The web route retries mutation-like behavior or retries indefinitely.
- UI treats Go outage as missing user data.

**Prevention:**
- Phase 77 must define timeout budgets, retry policy, and canonical error mapping for read routes.
- Phase 80 must test Go down, slow Go, invalid JSON, wrong status, missing resource, unauthorized owner route, and checksum/startup failure documentation.
- Phase 79 must ensure failure DTOs are schema-validated and public-safe.

**Detection:** Route tests use fake Go responses for timeout, invalid JSON, 404, 403, 500, and connection refused; topology failure output remains sanitized.

**Phase:** Phase 77, Phase 79, Phase 80.

### Pitfall 10: Overbroad Route Promotion

**What goes wrong:** The milestone promotes multiple routes, an owner route, a source-bearing route, replay private assembly, analytics export, or a route with write-adjacent behavior because all are "reads."

**Why it happens:** The remaining boundary debt includes many GET/read-looking surfaces that are not safe production Go candidates: Strategy source retrieval, owner analytics, replay owner-debug/private Chronicle assembly, Workshop validation/test launch/rerun/export flows, auth/session reads tied to mutation semantics, and ladder/competition workflows.

**Warning signs:**
- More than one route is marked promoted.
- Candidate includes `authScope: "owner"`, `privacyClass: "owner"`, source fields, session dependency, export behavior, replay owner debug, or analytics rerun/save adjacency.
- Scope documents talk about "Go backend promotion" instead of "one route read routing."
- Tests cover happy path only because route complexity is large.

**Prevention:**
- Phase 76 must set a hard limit: at most one narrow read route, and zero route promotion is acceptable.
- Phase 78 must require an explicit promotion checklist and abort if any criterion fails.
- Phase 81 must audit diff and route manifest for unexpected Go routes or production-routed paths.

**Detection:** Route manifest and web routing manifest list exactly zero or one promoted route; monitors fail on unexpected production-routed route ids.

**Phase:** Phase 76, Phase 78, Phase 81.

### Pitfall 11: Scope Creep Into Writes, Runtime, Orchestration, or Execution

**What goes wrong:** Go promotion expands into auth/session mutation, Strategy submission, Strategy source retrieval, MatchSet creation, ladder scheduling, job claiming, migrations, persistence writes, Strategy execution, runtime sandbox promotion, or counted non-JS support.

**Why it happens:** Production Go routing can create momentum toward "finish the rewrite." Those areas require transactional semantics, hostile-code isolation, deterministic execution boundaries, session ownership, and rollback plans not proven by read parity.

**Warning signs:**
- Go code imports or implements persistence writes, migrations, job claiming, runtime adapters, or Strategy execution.
- New endpoints use POST, PUT, PATCH, or DELETE.
- Workshop validation/test execution is moved near read promotion code.
- Runtime sandbox or non-JS counted play changes appear in the same milestone.
- Product copy implies Go owns Match execution.

**Prevention:**
- Phase 76 must restate non-goals as blocking criteria, not documentation.
- Phase 78 must fail if the Go route inventory contains any non-GET endpoint or any source/runtime/orchestration route.
- Phase 81 must run boundary monitors, route inventory checks, import checks, runtime/non-JS guardrails, and diff review for writes/runtime/execution changes.

**Detection:** `TestMutationVerbsDoNotSucceed`, Go route manifest GET-only checks, `pnpm boundary:monitors`, runtime/non-JS guardrails, and source diff audit.

**Phase:** Phase 76, Phase 78, Phase 81.

## Moderate Pitfalls

### Pitfall 12: Owner Token Evidence Is Mistaken for Session/Auth Ownership

**What goes wrong:** The local Go owner analytics bearer-token fixture path is treated as proof that Go can own session-authenticated production owner reads.

**Why it happens:** The current Go service supports `COWARDS_GO_BACKEND_OWNER_TOKENS` for evidence-only owner analytics rejection and local fixture authorization. That is not the same as production session auth, cookie handling, CSRF posture, session revocation, or user identity ownership.

**Warning signs:**
- Owner route promotion relies on `COWARDS_GO_BACKEND_OWNER_TOKENS`.
- Web cookies are forwarded to Go without a session ownership design.
- Owner id headers are trusted from the caller.

**Prevention:** Phase 76 should reject owner route production promotion for v1.12 unless a separate auth/session design exists. Phase 79 should keep owner analytics as evidence-only unless explicitly scoped.

**Phase:** Phase 76, Phase 79.

### Pitfall 13: Error Shape Drift Creates Existence Oracles

**What goes wrong:** Missing, forbidden, and wrong-owner cases return distinguishable statuses or messages that reveal private analytics, Strategy, replay, or account data.

**Why it happens:** Go currently maps unauthorized owner analytics to 403 before lookup, wrong owner to 404, and missing public resources to 404. A production route can accidentally reorder lookup/auth or expose raw not-found details.

**Warning signs:** Wrong-owner and missing-owner cases have different messages; missing private resources return timing or status differences; public route errors mention internal ids.

**Prevention:** Phase 79 must include missing, unauthorized, and wrong-owner parity cases for any owner evidence route. Phase 78 should avoid owner routes.

**Phase:** Phase 78, Phase 79.

### Pitfall 14: Web Route Uses Go While Page Data Still Bypasses Service Boundaries

**What goes wrong:** A page is said to use Go, but supporting loaders or helper modules still import persistence, matches server, competitive server, runtime, or broad Workshop server paths.

**Why it happens:** The import boundary checker follows strict migrated files and reports known remaining broad offenses. A new Go proxy helper may be safe while the page's dependency closure is not.

**Warning signs:** Promoted route file is strict-gated, but its page or sibling route is not; `report_only_offenses` grows; new broad facade hides persistence imports.

**Prevention:** Phase 78 must add the promoted route and safe helper closure to strict import enforcement. Phase 81 must verify `strict_offenses=0` and no unknown report-only offenses.

**Phase:** Phase 78, Phase 81.

### Pitfall 15: Service Versioning Freezes at v1.8 While Behavior Changes

**What goes wrong:** v1.12 promotes routing while artifacts still say `service-api-v1.8`, obscuring whether this is compatible behavior or a new contract.

**Why it happens:** Existing artifacts and Go constants use `service-api-v1.8`. If v1.12 changes only routing with identical DTOs, the version may stay; if DTO/error semantics change, it must not.

**Warning signs:** DTO/error changes without version discussion; OpenAPI diffs are treated as routing-only; Go `serviceAPIVersion` is edited manually.

**Prevention:** Phase 76 must declare whether v1.12 is contract-compatible. Phase 79 must require OpenAPI and service route metadata checks for any behavior change.

**Phase:** Phase 76, Phase 79.

### Pitfall 16: Candidate Route Is Not Actually Boring

**What goes wrong:** The route chosen for promotion has hidden dependencies on Chronicle assembly, owner debug, session auth, storage availability, export generation, or live Strategy/runtime behavior.

**Why it happens:** Reads can be deceptively complex in this app. Replay and Workshop surfaces often look read-only while touching privacy-sensitive Chronicle, source, or runtime-owned data.

**Warning signs:** Candidate needs database writes, job state, source retrieval, runtime adapter metadata beyond public labels, owner-specific data, or replay reconstruction.

**Prevention:** Phase 76 must require a route complexity inventory before selecting the optional route. Phase 78 should promote no route if no candidate is boring.

**Phase:** Phase 76, Phase 78.

## Minor Pitfalls

### Pitfall 17: Route Sample Paths Become Stale

**What goes wrong:** Topology samples continue testing the sentinel fixture while the promoted production route or path changes.

**Prevention:** Phase 79 must tie sample paths to the route ownership manifest and fail if promoted route samples are absent.

**Phase:** Phase 79.

### Pitfall 18: Diagnostic Sanitizer Falls Behind New Secret Names

**What goes wrong:** New config keys such as `go_token`, `session_id`, or provider-specific secrets are not redacted.

**Prevention:** Phase 79 must update sanitizer tests with any new routing config names and require captured diagnostics to pass privacy guards.

**Phase:** Phase 79.

### Pitfall 19: Cutover Evidence Is Not Durable

**What goes wrong:** Commands are run locally but not recorded with pass/fail output, Go running/stopped state, route mode, and rollback mode.

**Prevention:** Phase 80 and Phase 81 should write durable artifacts for forward cutover, failure behavior, rollback, and final gate evidence.

**Phase:** Phase 80, Phase 81.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
| --- | --- | --- |
| Phase 76: Scope Lock and Route Ownership Manifest | Promotion criteria are vague, allowing multiple routes or owner/source-bearing reads. | Create a route ownership manifest and hard candidate checklist before implementation. |
| Phase 77: Production Read Routing Switch Contract | Switch silently falls back to TypeScript or lacks backend attribution. | Define fail-closed Go-owned mode, explicit rollback mode, timeouts, error mapping, and route owner diagnostics. |
| Phase 78: Optional Single Read Route Promotion | Route is too complex or touches private/source/runtime/orchestration data. | Promote zero routes if no candidate satisfies all criteria; otherwise promote exactly one public GET with schema and privacy parity. |
| Phase 79: Privacy, DTO, Fixture, and Schema Drift Gate | Fixtures pass but live/schema/privacy behavior drifts. | Validate promoted Go outputs with `@cowards/spec`, keep `pnpm go:parity`, scan success and failure diagnostics for private markers. |
| Phase 80: Rollback and Operational Failure Drill | Rollback exists only as a revert plan and failure behavior is untested. | Run forward, stopped-Go, bad-response, timeout, and rollback drills through the web route and direct Go route. |
| Phase 81: Milestone Verification and Scope-Creep Audit | Writes/runtime/execution changes sneak into the milestone. | Run full monitors and diff audit; reject non-GET Go routes, source retrieval, auth mutation, jobs, migrations, orchestration, Strategy execution, sandbox promotion, and counted non-JS play. |

## Codebase-Specific Evidence

- `AGENTS.md` non-negotiables require pure deterministic engine boundaries, hostile Strategy isolation, no user Strategy code in web/API, no Node `vm` as a security boundary, immutable Strategy Revisions, canonical terminology, and public replay privacy.
- `.planning/PROJECT.md` and `.planning/STATE.md` define v1.12 as Go transition readiness, not a broad rewrite, with at most one narrow read route after explicit criteria.
- `.planning/milestones/v1.11-REQUIREMENTS.md` defers production web routing to Go and defines future `BACKX-02` criteria: service ownership, generated parity fixtures, live topology, privacy, no-fallback semantics, rollback, and operational failure behavior.
- `.planning/artifacts/v1.11-live-go-readiness-evidence.md` proves required live Go topology passes with Go running and fails when Go is stopped, but only as evidence-only validation.
- `scripts/check-local-topology.ts` has required/optional live topology, public-safe diagnostic sanitization, direct Go smokes, and owner analytics auth rejection checks.
- `scripts/check-boundary-monitors.ts` gates public OpenAPI privacy, public service examples, Go fixture privacy, web import drift, runtime/non-JS guardrails, Go route manifest metadata, and static topology diagnostics.
- `scripts/generate-go-parity-fixtures.ts` generates Go fixtures and route manifest from TypeScript service/spec outputs and checks staleness with `pnpm go:parity`.
- `apps/go-backend/main.go` is fixture-backed, validates fixture checksums and private keys at startup, serves only the current route inventory, and requires bearer-token mapping only for the evidence-only owner analytics fixture.
- `apps/go-backend/main_test.go` verifies endpoint fixtures, GET-only route inventory, mutation verb rejection, private marker absence, invalid fixture rejection, owner-token behavior, and public error shapes.
- `packages/spec/src/service.ts` is the canonical service route metadata source, with public, owner, and mutation routes living side by side. This makes explicit route ownership classification mandatory before any production Go routing.

## Required v1.12 Gate Commands

At minimum, v1.12 should require:

```bash
pnpm contract:check
pnpm contract:lint
pnpm boundary:imports
pnpm go:parity
pnpm boundary:monitors
pnpm topology:check -- --require-go --json
pnpm --filter @cowards/spec test
pnpm --filter @cowards/service test
pnpm --filter @cowards/web test
cd apps/go-backend && go test ./...
pnpm typecheck
pnpm format:check
git diff --check
```

If a route is promoted, add route-specific checks for:

- TypeScript-owned mode.
- Go-owned mode through the web route.
- Direct Go smoke.
- Go unavailable in Go-owned mode.
- Explicit rollback to TypeScript-owned mode.
- Invalid Go JSON/body.
- Public-safe 404/403/5xx error mapping.
- Response schema validation with `@cowards/spec`.
- No private markers in response bodies, logs, and topology diagnostics.

## Confidence Assessment

| Area | Confidence | Notes |
| --- | --- | --- |
| Accidental fallback and topology risks | HIGH | Directly supported by v1.11 required-Go evidence and topology script behavior. |
| Privacy/log leak risks | HIGH | Multiple existing leak guards show this is a core boundary, but production logging adds new surfaces. |
| Fixture/schema drift risks | HIGH | Current Go backend is fixture-backed and TypeScript-spec-derived. |
| Route ownership ambiguity | HIGH | Multiple route inventories exist today without production routing ownership metadata. |
| Rollback/operational failure risks | MEDIUM | v1.11 rollback was documentation-only because production traffic stayed TypeScript-owned; v1.12 needs new drills. |
| Exact route promotion candidate | LOW | Research did not select a route. The safest recommendation is zero or one public GET only after Phase 76 criteria. |
