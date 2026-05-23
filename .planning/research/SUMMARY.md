# Project Research Summary

**Project:** Coward's Game
**Milestone:** v1.12 Go Backend Promotion Readiness and Cutover Plan
**Domain:** Production Go read-routing readiness, route ownership, cutover criteria, rollback, and privacy-safe validation
**Researched:** 2026-05-23
**Confidence:** HIGH for repo-local route inventory, boundaries, and guardrails; MEDIUM for any production promotion until live-read evidence exists.

## Executive Summary

v1.12 should be a Go backend promotion readiness and cutover decision milestone, not a backend rewrite. Coward's Game is a deterministic programmable strategy game with strict privacy, replay, runtime, and service-boundary constraints; experts should move production ownership only after contracts, live topology, privacy, no-fallback behavior, and rollback are proven through repeatable gates. The existing TypeScript service remains canonical for DTO construction and schemas, while the Go backend is currently read-only and fixture-backed.

The decisive recommendation is to permit at most one narrow production read route to be considered for Go: `getPublicStrategyPage` / `GET /public/strategies/{strategyId}`. It is the safest current candidate because it is public, source-free, already present in `SERVICE_API_ROUTES`, already represented in the Go manifest, and already consumed through the web public service boundary. Even so, fixture-backed Go is not production-ready for arbitrary Strategy pages; zero promotion is valid and preferred if live data parity, no-fallback, privacy, rollback, and operational failure criteria are not satisfied.

The main risks are silent TypeScript fallback, privacy or diagnostic leaks, route ownership ambiguity, fixture/schema drift, and scope creep into writes, auth/session, Match orchestration, Strategy source, runtime execution, or non-JS counted play. Mitigate them with a route ownership manifest, route-scoped switch, explicit no-fallback semantics, schema-validated Go responses, public-safe diagnostics, required live topology, rollback drills, and boundary monitors that fail on any broader Go ownership.

## Key Findings

### Recommended Stack

Keep the current TypeScript service/spec stack as the source of truth and add only the minimum routing and validation surface required to decide v1.12. The Go service should remain small, read-only, and auditable. If v1.12 does not prove a real DB-backed read for the selected route, install no new runtime dependency and do not claim production promotion.

**Core technologies:**
- `@cowards/spec`: canonical service route metadata, DTO schemas, privacy guards, and OpenAPI contract source.
- `@cowards/service`: canonical TypeScript DTO producer and parity oracle for Go responses.
- `apps/go-backend`: read-only Go HTTP service with GET-only route manifest, fixture checksums, and privacy validation.
- `apps/web/lib/public-service-adapter.ts`: recommended switch point below pages/routes and above concrete TypeScript or Go clients.
- Go toolchain in CI: required for Go tests, parity, and live topology evidence.
- `github.com/jackc/pgx/v5`: optional only if v1.12 implements a real DB-backed Go read for `getPublicStrategyPage`; avoid ORM, sqlc, migrations, gRPC, GraphQL, Kubernetes, service mesh, and observability-stack expansion.

### Expected Features

v1.12 must produce a decision-quality promotion package. The milestone is successful if it proves that no route should be promoted yet.

**Must have:**
- Route ownership matrix covering current Go manifest routes plus nearby TypeScript public reads.
- Candidate route scorecard and final decision record selecting zero or one production web read.
- Explicit route-level Go read switch with default TypeScript ownership and no automatic TypeScript fallback.
- Live data proof for any selected production route; fixture-only Go blocks promotion.
- TypeScript-vs-Go DTO parity using canonical schemas and public privacy guards.
- Public-safe timeout, error, diagnostic, topology, and log behavior.
- Rollback runbook and rehearsal through one explicit owner/config switch.
- Evidence bundle for parity, boundary monitors, required live Go topology, no-fallback failure, rollback, and final owner state.

**Should have:**
- Shadow comparison mode if useful, with TypeScript still serving users and diagnostics remaining private-safe.
- Operator-visible route owner status that exposes only route id, selected owner, version, and health.
- Generated promotion report from route matrix, parity results, failure drills, and rollback proof.

**Defer:**
- Owner analytics routing, public MatchSet summary routing, replay projection/owner-debug migration, public player/ladder Go expansion, Strategy source retrieval, Workshop runtime/source/export flows, Go writes, migrations, jobs, orchestration, auth/session mutation, production runtime sandbox promotion, and counted non-JS play.

### Architecture Approach

Preserve the current layering: Next pages/routes call thin web boundary modules; adapters choose concrete service clients; `@cowards/service` builds canonical DTOs; `@cowards/spec` validates shape and privacy; Go remains a constrained read-only backend. The v1.12 switch belongs in the public service adapter/client layer, not in React components, route handlers, Go route path proxies, or persistence modules.

**Major components:**
1. Route ownership manifest/registry: declares eligible route id, method, path, privacy class, selected owner, switch env, fallback policy, rollback owner, and non-goals.
2. Typed Go public read client: fetches only `getPublicStrategyPage`, enforces timeout, validates with `PublicStrategyPageServiceDtoSchema`, runs privacy guards, and maps failures to public-safe errors.
3. Public service adapter switch: defaults to TypeScript, routes only the approved route to Go when explicitly enabled, and fails closed without fallback when Go is selected but unavailable or divergent.
4. Cutover/topology harness: proves direct Go, web-through-Go, stopped-Go no-fallback failure, TypeScript rollback, and sanitized diagnostics.
5. Boundary monitors: fail on more than one promoted route, non-GET promotion, owner/source/runtime/replay-debug routes, private diagnostic markers, or strict import regressions.

### Route Candidate Decision

Recommended candidate: `getPublicStrategyPage` / `GET /public/strategies/{strategyId}`.

Reasons:
- It is public, source-free, and already has a canonical service DTO.
- It already exists in the Go route manifest and topology checks.
- It is consumed through the public web service boundary, making cutover localized.
- It avoids owner auth/session mutation, Strategy source retrieval, Chronicle replay projection, Match orchestration, jobs, migrations, and runtime execution.

Rejected for v1.12 production promotion:
- `getAnalyticsRunSummary`: owner-scoped, bearer-token fixture auth is not production session ownership.
- `getPublicReplayMetadata`: smaller DTO but tied to Chronicle/replay privacy; keep shadow/evidence-only.
- `getPublicMatchSetSummary`: broader composite evidence and owner affordance risks; defer.
- `GET /health`: readiness evidence only, not a product read.
- Public player and ladder routes: not current Go manifest routes; adding new routes expands scope too early.

## Promotion Criteria

Promotion may proceed only if all criteria pass for exactly one route:

- Route is `getPublicStrategyPage`, GET-only, public, source-free, and manifest-aligned with `SERVICE_API_ROUTES`.
- Go reads production-equivalent live data for the selected route, not just fixtures.
- TypeScript service and Go return canonical-equivalent parsed DTOs for success, missing record, malformed id, storage/unavailable, ordering, and public error shape.
- Go and web outputs validate with `@cowards/spec` schemas and pass public privacy guards.
- Switch defaults to TypeScript and only enables the selected route through explicit config.
- Go-selected mode has no automatic TypeScript fallback for network failure, timeout, non-JSON, schema drift, privacy failure, 5xx, or divergence.
- Stopped-Go, bad-response, timeout, and rollback drills pass through the web route and direct Go route.
- Diagnostics/logs expose only route id, selected backend, public-safe status, duration bucket, and sanitized failure class.
- `strict_offenses=0` remains true and broad report-only boundary debt does not increase.
- Evidence artifacts record forward cutover, no-fallback failure, rollback, privacy scan, and final route owner state.

## No-Go Criteria

Any of these should block promotion and make `promote-none-yet` the correct v1.12 decision:

- Selected Go route remains fixture-only.
- More than one production web read is configured for Go.
- Go-selected mode silently calls TypeScript on failure.
- DTO, error, ordering, status, or not-found parity differs from TypeScript service.
- Any response, log, topology artifact, or diagnostic leaks Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, database DSNs, or private runtime internals.
- Rollback is not one explicit owner/config switch back to TypeScript.
- Boundary imports regress or web route logic bypasses service boundaries.
- Diff includes Go writes, auth/session mutation, ladder writes, Match orchestration, jobs, migrations, persistence ownership, Strategy source retrieval, Strategy execution, production runtime sandbox promotion, counted non-JS play, or rule/engine changes.

## Explicit Out Of Scope

- Go writes.
- Auth/session mutation.
- Ladder writes.
- Match orchestration.
- Jobs.
- Migrations.
- Persistence ownership.
- Strategy source retrieval.
- Strategy execution.
- Production runtime sandbox promotion.
- Counted non-JS play.
- Rule, Chronicle, scoring, terminology, engine, or deterministic runtime behavior changes.
- Owner analytics production routing.
- Public player or ladder Go route expansion.
- Replay private projection, owner-debug replay migration, or private Chronicle assembly.
- Workshop source retrieval, source save, validation/test launch, analytics rerun, profile save, export, or runtime migration.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Scope Lock and Route Ownership Manifest

**Rationale:** Promotion must start with a hard ownership decision before implementation can create accidental broader routing.
**Delivers:** Route ownership matrix, candidate scorecard, selected route decision, explicit non-goals, promotion/no-go criteria, rollback owner, and baseline evidence.
**Addresses:** route ownership matrix, candidate scorecard, decision record, at-most-one promotion gate.
**Avoids:** route ownership ambiguity, overbroad route promotion, and scope creep into writes/runtime/orchestration.

### Phase 2: Production Read Routing Switch Contract

**Rationale:** The system needs a narrow route-level switch and no-fallback semantics before any web cutover path exists.
**Delivers:** Promotion registry, env parsing, default TypeScript behavior, typed Go client contract, timeout/error semantics, sanitized diagnostics, and unit tests.
**Uses:** `@cowards/spec`, `@cowards/service`, public service adapter, Go backend URL/timeout config.
**Avoids:** silent TypeScript fallback, switch logic in React/routes, generic Go proxy, and public diagnostic leaks.

### Phase 3: Optional Single Read Route Implementation

**Rationale:** Only after the switch contract exists should the project attempt a real route path. This phase may end with zero promotion if live data criteria are not met.
**Delivers:** `getPublicStrategyPage` web-through-Go path and, only if promoting real data, a narrow read-only Go provider for the public Strategy page.
**Addresses:** live Go data proof, TypeScript parity oracle, production web behavior parity.
**Avoids:** fixture-backed production routing, owner analytics/session risk, replay privacy risk, MatchSet composite-risk promotion.

### Phase 4: Privacy, DTO, Fixture, and Schema Drift Gate

**Rationale:** Go fixture success does not prove live behavior; schema and privacy must be validated on success and failure paths.
**Delivers:** Go parity hardening, canonical schema validation for live Go responses, privacy scans for responses/logs/topology, route manifest alignment, and boundary monitor updates.
**Addresses:** privacy parity, TypeScript-vs-Go DTO parity, boundary debt non-regression.
**Avoids:** fixture drift, schema drift, public/private DTO confusion, stale topology samples.

### Phase 5: Rollback and Operational Failure Drill

**Rationale:** A route is not promotable unless operators can prove forward cutover, stopped-Go failure, bad-response behavior, timeout behavior, and rollback to TypeScript.
**Delivers:** Runbook, evidence bundle, no-fallback drill, rollback drill, public-safe failure outputs, and final route owner state.
**Addresses:** rollback rehearsal, public error behavior, evidence bundle, production web parity.
**Avoids:** documentation-only rollback and under-specified operational failure behavior.

### Phase 6: Milestone Verification and Scope-Creep Audit

**Rationale:** The final gate must decide `promote-none-yet` or `promote-one-route` based on evidence, not aspiration.
**Delivers:** Full command gate results, diff audit, boundary count confirmation, final promotion/no-go decision, and deferred work list.
**Addresses:** final decision record, hard blockers, post-promotion rollback triggers.
**Avoids:** writes/runtime/source/replay/private migration slipping into v1.12.

### Phase Ordering Rationale

- Scope comes first because route ownership, no-go criteria, and explicit non-goals are the only reliable guard against accidental backend ownership creep.
- Switch contract comes before implementation so no-fallback behavior, timeout/error mapping, and adapter boundaries are testable before a route is promoted.
- Optional promotion is deliberately after static ownership and switch gates; if live data proof is missing, the roadmap should stop at readiness evidence.
- Privacy/schema/boundary gates sit after implementation because they must validate real outputs and diagnostics, not just declarations.
- Rollback and verification close the milestone because promotion readiness is an operational claim, not only a code shape.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** Only if implementing live DB-backed Go read access; needs exact data mapping, SQL ownership, and parity cases for public Strategy DTOs.
- **Phase 5:** Operational behavior needs careful route-level decisions for public 503/not-found mapping, timeout budgets, and rollback evidence artifacts.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Repo-local manifest and decision-record work is well documented by v1.11 evidence.
- **Phase 2:** Route-level adapter switch and typed client follow existing service/spec boundary patterns.
- **Phase 4:** Schema, privacy, parity, topology, and boundary monitor patterns already exist.
- **Phase 6:** Verification command gate and diff audit follow established milestone practice.

## Validation Commands

Minimum v1.12 gate:

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

If any route is promoted, add route-specific checks for:

- TypeScript-owned mode with switch unset/default.
- Go-owned mode through the web public Strategy page path.
- Direct live Go selected-route smoke.
- Go unavailable in Go-owned mode, proving no TypeScript fallback.
- Invalid JSON/body, timeout, 404/403/5xx, and schema/privacy failures.
- Explicit rollback to TypeScript-owned mode.
- Public-safe diagnostics/logs for success, failure, stopped-Go, and rollback.

## Key Risks

1. **Silent TypeScript fallback** - fail closed in Go-owned mode and require stopped-Go validation.
2. **Privacy or diagnostic leaks** - scan successful and failed responses, logs, topology JSON, and artifacts for private markers.
3. **Route ownership ambiguity** - maintain one ownership manifest aligned with `SERVICE_API_ROUTES`, Go manifest, topology samples, and web switch config.
4. **Fixture-only false confidence** - block promotion unless live or production-equivalent Go reads are proven.
5. **Schema drift** - parse Go responses through canonical TypeScript schemas and privacy guards.
6. **Rollback gap** - rehearse rollback through the exact selected route and record evidence.
7. **Scope creep** - monitors and diff audit must reject writes, auth/session, jobs, migrations, source, runtime, replay-private, Match orchestration, counted non-JS, and rule/engine changes.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Repo-local stack and route inventory are verified; external Go/pgx version choices are optional and should be pinned during implementation if needed. |
| Features | HIGH | Table stakes are consistent across research and v1.11 deferred `BACKX-02` requirements. |
| Architecture | HIGH | Existing service/spec/web adapter/Go fixture boundaries are well documented; switch mechanics need implementation verification. |
| Pitfalls | HIGH | Failure modes are directly grounded in current topology, monitors, Go fixture behavior, and v1.11 evidence. |
| Promotion readiness | MEDIUM | `getPublicStrategyPage` is the best candidate, but production promotion remains unproven until live-read parity and rollback drills pass. |

**Overall confidence:** HIGH for the v1.12 roadmap direction; MEDIUM for actual production Go promotion.

### Gaps to Address

- Live data source for Go public Strategy page: decide whether to add a narrow read-only provider or stop at no-go.
- Error mapping: choose exact public-safe behavior for Go unavailable, timeout, invalid JSON, schema drift, and not-found parity.
- Switch shape: decide whether to use a route-specific env such as `COWARDS_GO_PUBLIC_STRATEGY_READS=1` or a global backend mode plus route allowlist; in either case v1.12 must allow only `getPublicStrategyPage`.
- Evidence artifacts: define filenames and JSON shape for cutover, no-fallback, rollback, and final route-owner evidence.

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` - stack recommendation, Go/TypeScript ownership, CI and cutover harness guidance.
- `.planning/research/FEATURES.md` - v1.12 table stakes, route recommendations, failure criteria, non-goals, and requirement seeds.
- `.planning/research/ARCHITECTURE.md` - route-scoped switch architecture, adapter boundaries, Go client shape, rollback architecture, and verification gates.
- `.planning/research/PITFALLS.md` - critical production read-routing pitfalls and phase-specific mitigations.
- `.planning/PROJECT.md` - current project state, v1.12 candidate direction, shipped milestone history, decisions, and constraints.
- `.planning/STATE.md` - v1.11 archived state and v1.12 planning focus.
- `.planning/milestones/v1.11-REQUIREMENTS.md` - deferred `BACKX-02` criteria and explicit v1.11 non-promotion boundary.

### Secondary (MEDIUM confidence)
- Go release guidance and pgx package recommendations as summarized in `STACK.md`; implementation should verify exact versions at the time dependencies are pinned.

---
*Research completed: 2026-05-23*
*Ready for roadmap: yes*
