# Architecture Research: v1.8 Production Boundary Hardening

**Date:** 2026-05-22
**Milestone:** v1.8 Production Boundary Hardening
**Confidence:** HIGH for existing TypeScript boundaries; MEDIUM for sandbox candidate ranking because v1.8 should evaluate, not select a production sandbox.

## Summary

v1.8 should harden integration boundaries, not move ownership. The TypeScript service, persistence workflows, worker, runtime adapters, engine, Chronicle, replay, and analytics remain the authoritative execution path. Go remains read-only. Non-JS runtime support remains product-visible only as experimental metadata and validation semantics, not counted play.

The safest architecture is contract-first and parity-first:

1. Make `@cowards/spec` the source for service route metadata, request/response schemas, privacy assertions, runtime ABI metadata, and compatibility keys.
2. Expand `@cowards/service` from a small read facade into the typed boundary that Next routes call before persistence.
3. Let generated artifacts flow outward from the TypeScript/Zod contract into OpenAPI/JSON Schema, golden DTO fixtures, Go parity tests, and local topology smokes.
4. Keep Strategy execution isolated behind worker/runtime adapters; sandbox candidates are evaluated by a separate harness and must not become the default Match execution path in v1.8.

Primary v1.8 data flow:

```txt
@cowards/spec route/runtime schemas
  -> generated contract artifacts and golden fixtures
  -> @cowards/service local TypeScript implementation
  -> Next route/page callers and TS reference responses
  -> apps/go-backend read-only parity responses
  -> drift monitors comparing schemas, DTOs, privacy, routes, adapters, and Go/TS outputs
```

## Existing Boundaries

### Stable Boundaries To Preserve

| Boundary | Current owner | v1.8 rule |
| --- | --- | --- |
| Pure rules engine | `packages/engine` | No service, runtime language, Go, time, filesystem, network, DB, or UI imports. |
| Chronicle/replay | `packages/replay` | Continue consuming deterministic engine outputs and public/owner projection rules. |
| Strategy execution | `apps/worker` + `packages/runtime-js` + `packages/runtime-python` | Runs only behind worker/runtime adapter boundaries; never in web/API route handlers. |
| Persistence/workflows | `packages/persistence` | TypeScript-owned writes, orchestration, jobs, retries, MatchSet creation, and Strategy revision mutation. |
| Service contract | `packages/spec/src/service.ts`, `packages/spec/src/schemas.ts`, `packages/service` | Expand as the route and DTO boundary; do not let Next routes import persistence for migrated paths. |
| Runtime ABI/metadata | `packages/spec/src/runtime.ts` | Keep compatibility keys, adapter registry, limits, readiness, and counted eligibility centralized. |
| Golden parity | `packages/golden` | Promote to cross-process fixture source for TS service, Go service, privacy, runtime failure taxonomy, and ordering. |
| Go backend | `apps/go-backend` | Read-only parity service only; no writes, job claiming, orchestration, or Strategy execution. |

### Current Gaps v1.8 Should Close

- `@cowards/service` currently exposes health, public MatchSet summary, and public replay metadata only. Most auth, account revision, Workshop, ladder, analytics, export, profile, and governance route code still reaches into `@cowards/persistence` through web server modules.
- `SERVICE_API_ROUTES` lists many routes, but route metadata is not yet generation-ready: method/path ids are present, while request schemas, response schemas, auth scope, privacy class, and error schemas need to be bound together.
- Go DTOs are hand-shaped and partially divergent from the TS service shapes, especially replay metadata. v1.8 should make Go compare against canonical TS-produced fixtures before adding more endpoints.
- Runtime adapter metadata exists in both `@cowards/spec` and `packages/runtime-js`; v1.8 needs a drift monitor so the executable adapter metadata cannot silently disagree with the public registry.
- Runtime sandbox alternatives are discussed but not measured under one shared hostile matrix. v1.8 should create an evaluation harness and report, not promote a new default sandbox.

## Proposed Integration

### 1. Generated Or Generation-Ready Service Contracts

Keep TypeScript/Zod as the authoring source because the repo already validates DTOs with Zod and shares TypeScript types across packages. Add a route contract registry in `@cowards/spec` that binds:

- route id, method, path, and public/internal classification
- request params/query/body schema
- success response schema
- `ServiceErrorDtoSchema`
- auth requirement: public, session, owner, admin, or internal test support
- privacy class: public-safe, owner-authorized, internal-only
- generation metadata: operation id, tags, summary, examples, fixture ids

Generation data flow:

```txt
packages/spec service contract registry
  -> generated JSON Schema/OpenAPI artifact under packages/spec/generated/
  -> checked-in snapshot or golden fixture hash
  -> @cowards/service local handlers
  -> optional HTTP client used by Next and Go parity smoke tests
```

Opinionated recommendation: generate OpenAPI from the route registry as a build artifact, but do not make OpenAPI the hand-authored source yet. The project gets drift detection and future client generation without forcing a large rewrite of existing Zod contracts.

### 2. Route Migration Boundary

Expand `@cowards/service` into the only allowed dependency on `@cowards/persistence` for migrated application routes. Next route handlers and page server modules should depend on `@cowards/service` or a typed service client, not repositories or persistence workflow modules.

Recommended internal shape:

```txt
apps/web route/page
  -> app server facade for cookies/form normalization only
  -> @cowards/service CowardsService method
  -> packages/persistence workflow/repository
  -> @cowards/spec DTO schema + privacy guard
```

Keep mutations TypeScript-owned. The service layer may expose mutation methods such as session creation, Strategy revision creation, exhibition creation, ladder entry, and analytics run creation, but those methods stay implemented by TypeScript persistence workflows in v1.8.

For public read endpoints, add an implementation switch:

```txt
COWARDS_READ_SERVICE=ts  -> local @cowards/service implementation
COWARDS_READ_SERVICE=go  -> HTTP client to apps/go-backend for approved GET routes only
```

The switch must be route allowlisted. If a caller tries to use Go for POST/PUT/DELETE, jobs, Strategy source, owner debug, or internal test-support endpoints, fail closed.

### 3. Go Read-Only Parity

Promote `apps/go-backend` from static spike to parity reader with two data sources:

| Source | Purpose | Constraint |
| --- | --- | --- |
| Golden fixture mode | Deterministic contract parity in CI and local smoke tests. | Fixture JSON is produced by TS service/golden code, then loaded by Go tests and service. |
| Local read-only Postgres mode | Optional local proof that Go can read safe persisted public data. | Use selected public GET DTOs only; no writes, transactions that mutate, job claiming, or Strategy source reads. |

Recommended Go endpoint order:

1. `GET /health`
2. `GET /public/matchsets/{matchSetId}/summary`
3. `GET /public/replays/{matchId}/metadata`
4. selected analytics summary endpoint only after the first two public DTOs match TS fixtures

Parity data flow:

```txt
TypeScript service builds canonical DTO
  -> @cowards/spec schema validates DTO and privacy guard runs
  -> fixture written to packages/golden or apps/go-backend/testdata
  -> Go handler returns same canonical DTO
  -> Go test compares parsed canonical values, not raw JSON bytes unless hash behavior is explicit
```

Do not integrate Go into Match execution, MatchSet creation, account mutation, Workshop validation, Strategy source retrieval, or worker jobs in v1.8.

### 4. Runtime Sandbox Prototype Evaluation

Create a sandbox evaluation harness separate from production Match execution. It should drive the same ABI/runtime hostile cases against candidate boundaries and produce a structured report.

Candidate classes:

| Candidate | v1.8 role | Recommendation |
| --- | --- | --- |
| Worker thread | Baseline local fallback. | Keep for dev compatibility only; never production hostile-code isolation. |
| Host subprocess | ABI and failure taxonomy baseline. | Keep as prototype; useful for system-failure classification but not sufficient alone. |
| Container subprocess | Existing production-candidate JS/TS path. | Treat as the near-term favorite to harden because it preserves the current Strategy API and already has network/read-only/root/cap/drop controls. |
| Deno permissions runtime | JS/TS candidate. | Evaluate as a permissions-oriented prototype; do not assume it solves hostile code alone. Official docs emphasize no IO by default, but also warn to read untrusted-code guidance. |
| WASM/WASI/Wasmtime | Language-constrained future candidate. | Evaluate for deterministic resource controls and capability-oriented execution, but expect higher product/package friction for existing JS/TS/Python Strategies. |
| MicroVM | Strong isolation candidate. | Defer implementation unless container results fail; likely highest ops complexity for local topology and CI. |

Evaluation data flow:

```txt
golden runtime ABI request
  -> candidate adapter/prototype
  -> runtime response envelope
  -> schema validation and privacy projection
  -> hostile capability result classification
  -> sandbox-evaluation report artifact
```

The worker should continue selecting only registered runtime adapters through `apps/worker/src/runtime-config.ts`. New prototype candidates should not be used for counted MatchSets unless the registry marks them enabled and counted, which should not happen in v1.8.

### 5. Non-JS Strategy Metadata Semantics

Use the existing `StrategyRuntimeMetadata` and registry as the product source for language semantics. Add product-facing fields rather than new execution paths:

- `displayName`, `docsHref`, `exampleStrategyIds`
- `availability`: enabled, disabled, experimental, hidden
- `countedPlayEligibility`: allowed, blocked, warnings
- `validationMessagePolicy`: public message, owner detail, compatibility warning
- `packagePolicy`: none, declared-only, locked, unsupported
- `compatibilityWarnings`: language version, adapter version, ABI version, package mode, required capabilities

Data flow:

```txt
Workshop language selection or imported revision metadata
  -> @cowards/spec registry validation
  -> StrategyRevision immutable runtime metadata
  -> persistence eligibility checks for MatchSet/ladder/analytics
  -> public DTO labels and compatibility warnings
```

Keep Python experimental and not counted. Public surfaces may show that Python exists only if the language is explicitly labeled experimental and blocked from normal counted play.

### 6. Multi-Process Local Topology

Add a repeatable boundary topology command that starts and checks:

```txt
PostgreSQL
  -> Next web app / API routes
  -> TypeScript @cowards/service reference path
  -> worker with selected runtime adapter
  -> Go read-only service
  -> fixture/local-data smoke requests
```

Recommended components:

- `scripts/dev-boundary-topology.ts` or equivalent orchestrator for health checks and smoke requests.
- `COWARDS_GO_BACKEND_ADDR` and `COWARDS_GO_BACKEND_URL` for Go.
- `COWARDS_READ_SERVICE=ts|go` for approved public read route delegation.
- `STRATEGY_EXECUTION_ADAPTER=worker-thread|subprocess|container-subprocess` for worker runtime selection.
- a fixture loader that seeds or exports known public MatchSet/replay/analytics records without exposing Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, or runtime internals.

Topology smoke flow:

```txt
start DB and migrations
  -> load golden/local demo fixtures
  -> start web
  -> start worker or run worker-once smoke
  -> start Go read-only service
  -> request TS service health/public DTOs
  -> request Go health/public DTOs
  -> compare canonical parsed DTOs and privacy guards
```

## New Components

| Component | Location | Responsibility |
| --- | --- | --- |
| Service contract registry | `packages/spec/src/service-contract.ts` or expanded `service.ts` | Bind route id, method/path, schemas, auth scope, privacy class, and generation metadata. |
| Contract generation script | `packages/spec` or `scripts/` | Emit OpenAPI/JSON Schema artifacts and fail on uncommitted drift. |
| Service route drift tests | `packages/spec` + `apps/web` tests | Prove every advertised service route has schema coverage and migrated routes do not bypass the service boundary. |
| Service HTTP/read client | `packages/service` | Typed client for approved public read routes, allowing TS vs Go backend selection without changing callers. |
| Go fixture/read store abstraction | `apps/go-backend` | Load canonical fixture DTOs and, optionally, read selected public DTOs from local Postgres. |
| Go/TS parity monitor | `packages/golden` + `apps/go-backend` | Compare canonical parsed service DTOs for health, public MatchSet summary, replay metadata, and later analytics summaries. |
| Sandbox evaluation harness | likely `packages/runtime-js` plus `packages/golden` fixtures, or `packages/runtime-sandbox-eval` if it grows | Run hostile/runtime ABI cases across worker, subprocess, container, Deno, WASI, and documented microVM assumptions. |
| Sandbox evaluation report | `.planning` artifact or generated test report | Rank candidates by isolation controls, determinism, local operability, package friction, failure taxonomy, and CI feasibility. |
| Non-JS product metadata registry fields | `packages/spec/src/runtime.ts` | Surface language availability, counted eligibility, docs/examples, warnings, and package policy. |
| Boundary topology smoke script | `scripts/` | Start/check web, worker/runtime adapter, TS service path, Go service, fixtures, and diagnostics. |
| Static boundary monitors | tests/scripts under `packages/spec`, `packages/service`, `apps/web`, `packages/runtime-js` | Detect DTO leaks, route/persistence bypasses, runtime/web execution bypasses, adapter registry drift, contract drift, and Go parity drift. |

## Modified Components

| Component | Modification |
| --- | --- |
| `@cowards/spec` | Add generation-ready service route registry, richer runtime product metadata, schema exports for all service DTOs, and compatibility/drift helpers. |
| `@cowards/service` | Expand from narrow read facade to the typed local service boundary for migrated routes; add optional HTTP read client for Go-backed public GETs. |
| `apps/web/app/competitive/server.ts` | Continue owning cookies/session UX mapping, but move migrated persistence calls into `@cowards/service`; keep route handlers thin. |
| `apps/web/app/workshop/server.ts` | Route validation/submission/analytics profile flows through service methods as they are migrated; preserve worker-only execution for tests and Match runs. |
| `apps/web/app/matches/server.ts` | Keep replay projection server-authorized; route public replay metadata through service, while full Chronicle loading remains TS-owned unless explicitly made public and safe. |
| `packages/persistence` | Remain implementation detail behind service methods; may add read helpers for service DTOs but should not import web, Go, runtime candidates, or generation tooling. |
| `apps/go-backend` | Replace static DTO maps with fixture/local read stores, canonical response shapes, strict error DTOs, route allowlist, and parsed-value parity tests. |
| `packages/golden` | Add service DTO fixture materialization, Go-compatible JSON fixtures, public privacy fixtures, and cross-process parity assertions. |
| `apps/worker/src/runtime-config.ts` | Keep current adapter selection but add tests/monitors that selected adapter metadata agrees with `@cowards/spec` registry. |
| `packages/runtime-js` | Reuse hostile matrix and container adapter for sandbox evaluation; do not make prototype candidates the default runtime path. |
| `packages/runtime-python` | Keep experimental ABI proof; add metadata/product tests if language semantics grow, but no counted-play enablement. |
| `package.json` scripts | Add boundary topology and drift-monitor commands, then include stable ones in `test:fast` only after they are reliable locally and in CI. |

## Build Order

1. **Contract registry and generator-ready schemas**
   - Dependency: existing `@cowards/spec` DTO schemas.
   - Output: route registry, schema coverage tests, generated artifact snapshot.
   - Risk reduced: every later migration and Go endpoint has a canonical shape.

2. **Drift monitors for current boundaries**
   - Dependency: contract registry.
   - Output: DTO privacy monitor, web/API persistence-import monitor, runtime-web bypass monitor, adapter registry drift monitor.
   - Risk reduced: catches accidental boundary regressions before adding more moving pieces.

3. **Expand `@cowards/service` and migrate low-risk public reads**
   - Dependency: contract registry and monitors.
   - Output: public MatchSet summary and replay metadata become reference routes; then migrate public profile/strategy/ladder reads if straightforward.
   - Risk reduced: proves the route migration pattern without touching writes first.

4. **Go fixture parity over canonical TS DTOs**
   - Dependency: stable public read service methods and golden fixtures.
   - Output: Go reads fixture DTOs and returns exact contract-shaped responses; Go tests compare parsed values to TS fixtures.
   - Risk reduced: removes hand-shaped Go drift before local DB integration.

5. **Optional Go local Postgres read-only mode**
   - Dependency: fixture parity passing.
   - Output: Go can read selected public MatchSet/replay metadata from safe local persisted data.
   - Risk reduced: proves data access while retaining TypeScript ownership of writes, jobs, and orchestration.

6. **Non-JS Strategy metadata semantics**
   - Dependency: registry drift monitor and service DTO schemas.
   - Output: language selection metadata, experimental labels, counted eligibility, validation/warning copy, docs/examples hooks.
   - Risk reduced: product semantics become explicit before any runtime is promoted.

7. **Sandbox evaluation harness**
   - Dependency: runtime ABI fixtures and hostile matrix.
   - Output: candidate comparison report for worker, subprocess, container, Deno, WASI, and microVM assumptions.
   - Risk reduced: production sandbox decisions are evidence-backed and isolated from live Match execution.

8. **Multi-process local topology**
   - Dependency: TS service smokes, Go parity endpoint, worker runtime config, fixture loader.
   - Output: one command/checklist to start and diagnose web, worker/runtime, TS service path, Go read service, and fixture requests.
   - Risk reduced: v1.8 ends with repeatable local operations instead of isolated package tests.

## Risks

### Critical

- **Go ownership creep.** If Go starts handling mutations, jobs, MatchSet orchestration, Strategy source, or Strategy execution in v1.8, the system loses the parity-first migration path. Mitigation: route allowlist, read-only DB user for local mode, no POST/PUT/DELETE handlers, and tests that fail if Go exposes forbidden routes.
- **Runtime execution bypass.** Adding sandbox prototypes can accidentally create a path from web/API to Strategy execution. Mitigation: keep prototypes in evaluation harnesses only, scan web/API imports for `runtime-js/worker`, and require worker-only execution tests.
- **Public DTO leaks.** New generated schemas and Go responses can expose Strategy source, memories, objectives, owner debug, stderr, stacks, or runtime internals. Mitigation: run `assertPublicServiceDtoLeakSafe` on TS fixtures and mirror forbidden-key checks in Go tests.

### Moderate

- **Contract generator churn.** OpenAPI generation can create noisy diffs before the route registry is stable. Mitigation: make generation-ready metadata mandatory first, then snapshot generated artifacts once stable.
- **Schema source split.** If Go hand-maintains DTO structs without fixture/schema parity, drift will recur. Mitigation: generate or fixture-drive Go contract tests; compare parsed canonical values.
- **Adapter registry mismatch.** `@cowards/spec` and executable runtime adapter metadata can diverge. Mitigation: a test maps runtime-js adapter metadata to registered adapter ids, versions, limits, readiness, and counted eligibility.
- **Sandbox result overclaiming.** Container, Deno, WASI, or microVM experiments may look promising in unit tests but fail local/CI operability or package ergonomics. Mitigation: report candidates as evaluated prototypes only; do not change counted-play eligibility.
- **Route migration blast radius.** Moving auth, Workshop, ladder, and analytics mutations all at once risks behavior drift. Mitigation: migrate public reads first, then one mutation family at a time behind parity tests.

### Minor

- **Topology script flakiness.** Multi-process checks can become brittle around ports and startup timing. Mitigation: explicit env vars, health polling with timeouts, clear diagnostics, and fixture mode that avoids requiring completed long-running jobs.
- **Fixture bloat.** Golden service fixtures can grow large. Mitigation: keep small canonical fixtures for contract parity and leave large demo data to existing local seed/demo scripts.
- **User-facing non-JS confusion.** Showing Python too prominently may imply support. Mitigation: experimental labels, blocked counted-play states, and explicit compatibility warnings in every product DTO that surfaces it.
