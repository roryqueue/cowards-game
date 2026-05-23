# Technology Stack: v1.12 Go Backend Promotion Readiness and Cutover Plan

**Project:** Coward's Game
**Milestone:** v1.12 Go Backend Promotion Readiness and Cutover Plan
**Researched:** 2026-05-23
**Overall confidence:** HIGH for repo-local recommendations; MEDIUM for external version recommendations.

## Executive Recommendation

v1.12 should add promotion controls around the existing TypeScript service and Go read-only backend, not a new backend platform. The current Go service is fixture-backed and has five GET-only manifest entries: health, public MatchSet summary, public replay metadata, public Strategy page, and owner analytics summary. That proves contract shape, privacy, topology, and no-fallback evidence, but it does not by itself prove production web reads can use Go data. Production promotion requires one live Go read source, one explicit route switch, and CI evidence that the route behaves identically or fails closed.

Promote at most `getPublicStrategyPage` behind an explicit off-by-default switch. It is the narrowest existing public route with a Go manifest entry, no owner auth, no Strategy source, no Chronicle projection, no Match orchestration, and an existing strict web boundary through `apps/web/app/strategies/[strategyId]/page.tsx` and `apps/web/lib/public-service-boundary.ts`. Do not promote public MatchSet, replay metadata, or owner analytics first; those carry broader evidence, owner/debug, replay, or authorization risks.

If v1.12 only proves readiness and does not promote live production traffic, keep Go standard-library-only and fixture-backed. If v1.12 promotes the public Strategy page route for real production data, add exactly one Go data dependency: `github.com/jackc/pgx/v5` using `pgxpool` for read-only PostgreSQL access. Do not add an ORM, sqlc, migrations in Go, generated Go clients, OpenTelemetry, Kubernetes, service mesh, GraphQL, gRPC, or a broad feature-flag platform.

## Current Baseline

| Area | Current State | v1.12 Implication |
| --- | --- | --- |
| TypeScript service | `@cowards/service` owns canonical read DTOs and validates with `@cowards/spec`. | Keep it canonical; Go must prove parity against it. |
| Service contracts | `SERVICE_API_ROUTES`, Zod schemas, OpenAPI artifact `service-api-v1.8`. | Do not invent a second route registry. Add only promotion metadata if needed. |
| Go backend | Go stdlib `net/http`, fixture manifests, checksum validation, privacy guard, GET-only route inventory. | Keep the harness; add live DB read provider only for selected promotion route. |
| Topology | `pnpm topology:check -- --require-go --json` proves live Go availability and no fallback. | Extend it to prove web-read switch behavior, not just direct Go smoke. |
| Boundary monitors | `pnpm boundary:monitors` checks OpenAPI, privacy, import boundary, runtime/non-JS, Go manifest, topology. | Add cutover checks to prevent accidental broad Go routing. |
| CI | Node 24 jobs exist; no dedicated Go setup or live Go topology job. | Add a Go readiness/cutover CI job with `actions/setup-go` and required live Go evidence. |

## Recommended Stack Additions

### Core Stack

| Technology | Version | Purpose | Why |
| --- | --- | --- | --- |
| Go toolchain in CI | `1.25.x` unless repo standardizes newer after verification | Run Go parity, Go tests, and live Go service in CI. | `apps/go-backend/go.mod` is `go 1.23`, but official Go releases show security releases through `go1.25.10` on 2026-05-07. CI should use a supported toolchain before promoting web reads. |
| `github.com/jackc/pgx/v5` | v5, exact version pinned by `go get` | Optional, only if one real production Go read is promoted. | pgx is the direct PostgreSQL driver/toolkit for Go; use `pgxpool` without ORM semantics. |
| Existing Go stdlib | Current | HTTP routing, JSON, tests, checksum validation. | Keep the Go service small and auditable. |
| Existing Node/TypeScript stack | Current repo versions | Contract generation, topology, cutover harness, web route switch tests. | The repo already has pnpm, tsx, Vitest, Zod schemas, and service adapters. |

### New Internal Modules and Scripts

| Addition | Location | Required? | Purpose |
| --- | --- | --- | --- |
| Go read promotion manifest | `packages/spec/src/service.ts` or adjacent `service-promotion.ts` | Yes | Declare the only promotion-eligible route id, switch env name, default backend, rollback policy, and non-goals. |
| Public read route switch | `apps/web/lib/public-read-routing.ts` or inside `public-service-boundary.ts` | Yes | Route only `getPublicStrategyPage` to TypeScript or Go based on explicit env. |
| Go HTTP client | `apps/web/lib/go-public-read-client.ts` | Yes if route switch exists | Fetch selected Go route, validate response with `@cowards/spec`, enforce timeout, sanitize errors, and never fallback silently. |
| Go DB read provider | `apps/go-backend/public_strategy_read.go` | Only if promoting real production data | Build the public Strategy page DTO from PostgreSQL read-only queries matching `buildPublicStrategyCardDto`. |
| Cutover harness | `scripts/check-go-read-cutover.ts` | Yes | Compare TypeScript service and live Go responses, verify switch-off/switch-on behavior, and fail when Go is unavailable with switch on. |
| CI Go readiness job | `.github/workflows/ci.yml` | Yes | Run `pnpm go:parity`, Go tests, live Go topology, and cutover harness on every PR. |

## Selected Route

Recommend `getPublicStrategyPage` as the only v1.12 promotion candidate.

| Criterion | Assessment |
| --- | --- |
| Public-safe | Yes. DTO is `PublicStrategyPageServiceDtoSchema` and current service path calls `assertPublicServiceDtoLeakSafe`. |
| Existing Go manifest entry | Yes. `GET /public/strategies/{strategyId}` already exists in the route manifest and topology checks. |
| Existing web boundary | Yes. Strategy page already calls `getPublicStrategyCard` through `@cowards/service`. |
| Auth risk | Low. Public route, no session mutation, no owner source. |
| Data complexity | Moderate. Records require public MatchSet scoring summaries, but still read-only. |
| Rollback clarity | High. Unset the route env switch and web returns to TypeScript service reads. |

Do not select owner analytics first because bearer-token fixture auth is evidence-only and not the web product auth model. Do not select replay metadata first because replay/private Chronicle boundaries are too sensitive for the first cutover. Do not select public MatchSet first because the web page adds owner source affordances and richer evidence presentation around the public summary.

## Switch and Rollback Primitives

Add one explicit switch, not a broad backend selector:

| Env / Config | Values | Default | Behavior |
| --- | --- | --- | --- |
| `COWARDS_GO_PUBLIC_STRATEGY_READS` | `0` or `1` | `0` | Enables only public Strategy page reads through Go. |
| `COWARDS_GO_BACKEND_URL` | URL | unset | Required when the route switch is enabled. |
| `COWARDS_GO_READ_TIMEOUT_MS` | integer | `750` or `1000` | Caps web-to-Go read latency. |

Required semantics:

- Switch disabled: web uses the existing TypeScript service path.
- Switch enabled and Go succeeds: web uses Go response after schema validation.
- Switch enabled and Go is unavailable, divergent, timeout, non-JSON, schema-invalid, or leaks private fields: web returns a public-safe failure or not-found behavior for that route; it must not call the TypeScript service as a fallback.
- Rollback: set `COWARDS_GO_PUBLIC_STRATEGY_READS=0` or remove it, redeploy/restart, and leave all TypeScript service behavior intact.
- Diagnostics must record route id, selected backend, public-safe status code, and sanitized failure reason. They must not include Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, bearer tokens, host paths, or database DSNs.

## CI and Topology Harness Changes

Add a dedicated `go-readiness` CI job instead of hiding this inside `test:fast`.

Recommended CI shape:

1. Checkout, setup Node 24, enable corepack, install pnpm dependencies.
2. Setup Go `1.25.x`.
3. Start PostgreSQL and Redis services using the existing service-e2e pattern.
4. Run `pnpm go:parity`.
5. Run Go tests in `apps/go-backend`.
6. Start Go backend on `127.0.0.1:8087`.
7. Run `pnpm topology:check -- --require-go --json`.
8. Run `pnpm exec tsx scripts/check-go-read-cutover.ts --route getPublicStrategyPage`.
9. Run the no-fallback negative lane: switch enabled, Go stopped or pointed at `127.0.0.1:1`, command must fail for the required Go path and must prove no TypeScript fallback.

Extend `scripts/check-local-topology.ts` with a new optional layer only when web is supplied:

| Check | Required When | Expected Result |
| --- | --- | --- |
| Web TypeScript route read | `--require-web` | Strategy page renders via TypeScript service with switch off. |
| Web Go route read | `--require-web --require-go --require-go-read-switch` | Strategy page renders same public Strategy evidence through Go. |
| Switch no-fallback | switch enabled and Go unavailable | Required failure, sanitized diagnostic, no fallback marker. |
| Route scope | always in static topology | Only `getPublicStrategyPage` is promotion-eligible. |

Keep `pnpm boundary:monitors` as the broad drift gate, but add checks that:

- The promotion manifest contains at most one enabled route in v1.12.
- Every promotion-eligible route is GET-only, `privacyClass: "public"`, and present in `SERVICE_API_ROUTES`.
- No owner, session, admin, POST, DELETE, source, replay owner-debug, Match orchestration, runtime, job, or migration route is promotion-eligible.
- Web switch files do not import `@cowards/persistence`, runtime packages, worker packages, migrations, or broad server facades.

## Generated Fixture and Parity Changes

Current generated Go fixtures are good for route shape and privacy. v1.12 needs cutover fixtures that prove live data equivalence for the selected route.

Add or extend generated artifacts:

| Artifact | Purpose |
| --- | --- |
| `apps/go-backend/testdata/service-fixtures/public-strategy-page.json` | Keep existing static sentinel fixture for route shape and checksum parity. |
| `apps/go-backend/testdata/service-fixtures/route-manifest.json` | Add `promotionEligible: true` only for `getPublicStrategyPage` if scoped. |
| `apps/go-backend/testdata/service-fixtures/fixture-manifest.json` | Bump schema only if fields change; keep SHA-256 checks. |
| `apps/go-backend/testdata/cutover/public-strategy-page-live.json` | New generated DB-seeded expected payload for TypeScript-vs-Go live comparison. |
| `.planning/artifacts/go-read-cutover-*.json` | Sanitized validation evidence from topology and cutover harness. |

The parity generator should still use `@cowards/service` as canonical. For a live DB-backed promotion route, seed a deterministic local Strategy record with source-free public metadata, execute both TypeScript service and Go DB provider against the same database, canonicalize JSON, validate both with `PublicStrategyPageServiceDtoSchema`, then compare. Do not compare raw bytes except for committed fixture checksum files.

## Go Backend Implementation Guidance

If adding live DB access:

- Use `pgxpool.New` with `DATABASE_URL` and an explicit read-only provider interface.
- Keep fixture provider as the default for tests and topology fixture evidence.
- Add a DB provider only for `getPublicStrategyPage`; all other routes remain fixture-backed until future milestones.
- Run read-only SQL only. No migrations, writes, advisory locks, job claims, session mutation, or Strategy source retrieval.
- Match TypeScript DTO behavior exactly: latest revision per Strategy, runtime normalization, validation status, source hash/bytes only, tags, lineage, public record links, and public-safe not-found.
- Add Go tests for missing Strategy, invalid database JSON, private key rejection, bad route method rejection, context timeout, and DTO shape.

If not adding live DB access, do not claim a production route is promoted. The milestone can still conclude "not ready for promotion" with strong evidence, but fixture-backed Go cannot serve arbitrary production Strategy pages.

## Validation Tooling

Add `scripts/check-go-read-cutover.ts` with these modes:

| Mode | What It Proves |
| --- | --- |
| `--static` | Manifest route scope, GET-only, public-only, switch defaults off. |
| `--live-go` | Direct Go selected route validates against schema and privacy guard. |
| `--compare-ts-go` | TypeScript service and Go selected route return canonical-equivalent DTOs for seeded data. |
| `--web-switch-off` | Web uses TypeScript path when switch is unset. |
| `--web-switch-on` | Web uses Go path when switch is set and Go is healthy. |
| `--no-fallback` | Web fails loudly when switch is set and Go is unavailable. |
| `--json` | Emits sanitized artifact suitable for `.planning/artifacts/` and CI logs. |

Testing additions should be focused:

- Vitest unit tests for env parsing, switch defaults, route allowlist, schema validation, sanitized diagnostics, and no-fallback behavior.
- Go unit tests for DB provider mapping and fixture provider privacy.
- One Playwright or route-level smoke only if the actual web page is switched.
- Existing `pnpm boundary:imports`, `pnpm boundary:monitors`, `pnpm topology:check -- --require-go --json`, and `pnpm go:parity` stay mandatory.

## What Not To Add

Do not add these in v1.12:

| Do Not Add | Reason |
| --- | --- |
| Full Go backend rewrite | v1.12 is readiness plus at most one read route. |
| Go writes, migrations, job claiming, Match orchestration, Strategy execution | Read parity does not prove write semantics or hostile-code isolation. |
| Go auth/session mutation or owner-source retrieval | Auth and Strategy source are private, high-risk boundaries. |
| Broad `COWARDS_READ_BACKEND=go` switch | Too easy to route unproven reads. Use one route-specific env. |
| Silent TypeScript fallback | It hides production Go failures and invalidates readiness evidence. |
| ORM, Prisma for Go, GORM, sqlc, ent | Too much stack for one read route; hand-written read SQL is auditable here. |
| Generated Go DTO source of truth | `@cowards/spec` and TypeScript service remain canonical. |
| OpenTelemetry, Prometheus, service mesh, Kubernetes, Terraform | Diagnostics should be script-level and CI-visible for this milestone. |
| GraphQL, gRPC, protobuf | Existing REST DTO contracts are sufficient. |
| Runtime sandbox promotion or counted non-JS play | Separate risk domain; keep runtime evidence-only. |
| Replay private projection or owner-debug Go route | Too sensitive for first Go web-read cutover. |

## Installation

Only needed if v1.12 promotes a real DB-backed Go read:

```bash
cd apps/go-backend
go get github.com/jackc/pgx/v5
go get github.com/jackc/pgx/v5/pgxpool
go mod tidy
```

CI addition should use `actions/setup-go` with `go-version: '1.25.x'` and keep Node setup unchanged.

If v1.12 remains readiness-only, install no new runtime dependencies. Add only TypeScript scripts/tests and CI topology wiring.

## Roadmap-Ready Phase Suggestions

1. **Promotion Scope and Route Switch Contract** - Add the promotion manifest, route-specific env, and rollback/no-fallback contract.
2. **Cutover Harness and CI Topology** - Add setup-go CI, live Go topology, switch-off/switch-on/no-fallback validation, and sanitized artifacts.
3. **Generated Parity Expansion** - Add cutover fixtures and TypeScript-vs-Go canonical comparison for the selected route.
4. **Optional Public Strategy Go DB Read** - Add `pgx/v5` and DB-backed public Strategy page provider only if the previous phases prove promotion criteria.
5. **Single Route Promotion Gate** - Enable the explicit switch in test/staging evidence, prove rollback, and decide whether production remains TypeScript or promotes one route.

## Sources

- Repo planning: `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/MILESTONES.md`, `.planning/milestones/v1.11-ROADMAP.md`, `.planning/milestones/v1.11-REQUIREMENTS.md`, `.planning/milestones/v1.11-MILESTONE-AUDIT.md`. HIGH confidence.
- Repo scripts: `package.json`, `scripts/check-local-topology.ts`, `scripts/check-boundary-monitors.ts`, `scripts/generate-go-parity-fixtures.ts`, `scripts/check-service-boundary-imports.ts`. HIGH confidence.
- Repo Go backend: `apps/go-backend/main.go`, `apps/go-backend/main_test.go`, `apps/go-backend/README.md`, `apps/go-backend/go.mod`, `apps/go-backend/testdata/service-fixtures/route-manifest.json`. HIGH confidence.
- Repo service/spec boundary: `packages/spec/src/service.ts`, `packages/service/src/index.ts`, `apps/web/lib/public-service-boundary.ts`, `apps/web/lib/public-service-adapter.ts`, `packages/persistence/src/profiles.ts`. HIGH confidence.
- CI baseline: `.github/workflows/ci.yml`. HIGH confidence.
- Go official release history showing current 1.25 security releases through `go1.25.10` on 2026-05-07. MEDIUM confidence for exact CI version because toolchain policy can change. https://go.dev/doc/devel/release
- pgx official repository and package docs identify `github.com/jackc/pgx/v5` as a PostgreSQL driver/toolkit for Go. MEDIUM confidence for exact package version; pin during implementation. https://github.com/jackc/pgx and https://pkg.go.dev/github.com/jackc/pgx/v5
