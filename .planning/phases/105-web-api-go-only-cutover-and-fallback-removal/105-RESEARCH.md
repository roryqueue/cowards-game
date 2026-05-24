# Phase 105: Web/API Go-Only Cutover and Fallback Removal - Research

**Researched:** 2026-05-24 [VERIFIED: local date/context]
**Domain:** Next.js API adapter cutover, Go backend route ownership, no TypeScript backend fallback [VERIFIED: .planning/ROADMAP.md; .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-CONTEXT.md]
**Confidence:** HIGH for repo-local route inventory, adapter paths, manifests, tests, and monitor implications; MEDIUM for exact live-database smoke data because live DB contents were not queried during research. [VERIFIED: repo grep; .planning/artifacts/v1.16-typescript-backend-inventory.json]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Selected Normal Routes
- **D-01:** Treat Phase 105 as an actual cutover for selected v1.15-promoted normal routes, not merely documentation.
- **D-02:** Selected route families include auth/session flows needed by normal paths, account revision reads, starter and advanced forks, selected exhibition MatchSet creation, public Strategy/player/ladder/MatchSet reads, public replay metadata, and public replay evidence.
- **D-03:** Do not expand this phase into all TypeScript-backed web routes. Surfaces outside the selected route set must be explicitly deferred, test-only, parity-only, rollback-only, or quarantined in later artifacts.

### Fallback Policy
- **D-04:** When a route is Go-selected or strict topology is active, require `COWARDS_GO_BACKEND_URL` or the equivalent Go backend client configuration and fail closed when Go is unavailable.
- **D-05:** Do not fall back to local `@cowards/service`, direct TypeScript persistence, or Chronicle reads for selected normal routes.
- **D-06:** Stopped-Go behavior for selected routes should produce explicit classified failure, not hidden TypeScript service behavior.

### Next.js API Role
- **D-07:** Selected Next.js API routes should act as frontend adapters to Go-backed boundary clients.
- **D-08:** Selected normal Next.js API routes must not directly import persistence or `@cowards/service` for normal behavior.

### Current User And Session Reads
- **D-09:** Avoid hidden direct database reads inside selected public/account adapters.
- **D-10:** Session/current-user lookup for selected normal routes should use the same Go-owned account/session boundary when Go ownership is selected.

### Replay Evidence Split
- **D-11:** Public replay metadata and public replay evidence should use Go-owned public read/evidence contracts for selected normal paths.
- **D-12:** Private owner-debug replay may remain explicit and deferred with authorization gates, but it must never act as public evidence fallback.

### Error And Privacy Behavior
- **D-13:** Selected route failures should be schema/auth classified and redacted.
- **D-14:** Public errors and DTOs must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner-debug data, stack traces, DB details, host paths, tokens, session internals, or private runtime material.

### the agent's Discretion
The agent may decide exact cutover order, adapter refactor shape, environment flag simplification, and test grouping, provided the selected v1.15-promoted route families become Go-only for normal runtime and all non-selected surfaces are explicitly labeled for later phases.

### Deferred Ideas (OUT OF SCOPE)
- Workshop validation, submission, save/source/test, analytics rerun/profile/export/runtime flows.
- Broader ladder mutations, scheduling, entry operations, and governance/admin actions.
- Owner-debug replay/private Chronicle projection migration.
- Test-support routes and fixture generators beyond explicit test-only gates.
- Migration/schema ownership.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
| --- | --- | --- |
| WEB-01 | Selected normal account/session flows use Go-owned contracts without TypeScript persistence or service fallback. [VERIFIED: .planning/REQUIREMENTS.md] | Cut over `auth/session`, `auth/sign-in`, `auth/sign-out`, `auth/sign-up`, account read boundary, and current-user reads to `apps/web/lib/go-backend-service-client.ts`; remove local-service fallback from selected normal mode. [VERIFIED: apps/web/lib/account-service-adapter.ts; apps/web/lib/go-backend-service-client.ts] |
| WEB-02 | Selected exhibition MatchSet creation uses Go-owned contracts without TypeScript competition persistence fallback. [VERIFIED: .planning/REQUIREMENTS.md] | Cut over `apps/web/app/api/exhibitions/route.ts` to `POST /matchsets` on Go and remove `competitiveServer.createExhibition` from normal mode. [VERIFIED: apps/web/app/api/exhibitions/route.ts; apps/go-backend/live_backend.go] |
| WEB-03 | Selected public pages and replay evidence use Go-owned read contracts without TypeScript service fallback. [VERIFIED: .planning/REQUIREMENTS.md] | Make all selected public read route IDs Go-selected by default, including `getPublicReplayEvidence`; preserve private owner-debug as deferred. [VERIFIED: apps/web/lib/public-service-adapter.ts; apps/web/app/matches/server.ts] |
| WEB-04 | Selected Next.js API routes are frontend adapters or explicitly non-normal. [VERIFIED: .planning/REQUIREMENTS.md] | Selected adapter routes are listed below; deferred/test-only routes are also listed below. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| WEB-05 | `apps/web/app/competitive/server.ts` no longer owns selected normal auth/session/account/fork/exhibition backend behavior. [VERIFIED: .planning/REQUIREMENTS.md] | Keep `competitive/server.ts` only for deferred ladder/governance/rollback code after selected normal route imports are removed or gated out of normal mode. [VERIFIED: apps/web/app/competitive/server.ts; scripts/check-boundary-monitors.ts] |
| WEB-06 | `account-service-adapter.ts` and `public-service-adapter.ts` cannot silently fall back when Go is selected or required. [VERIFIED: .planning/REQUIREMENTS.md] | Replace selected-route default TypeScript fallback with required Go client and focused tests for missing URL/stopped Go/no local-service calls. [VERIFIED: apps/web/lib/account-service-adapter.test.ts; apps/web/lib/public-service-adapter.test.ts] |
| WEB-07 | Selected public replay evidence avoids persistence-backed TypeScript Chronicle reads except owner-debug/test/deferred paths. [VERIFIED: .planning/REQUIREMENTS.md] | `getMatchReplay` already uses `PublicGoReadClient.getPublicReplayEvidence` when public evidence is Go-selected; Phase 105 should make that selection normal and keep owner-debug explicit. [VERIFIED: apps/web/app/matches/server.ts; apps/web/app/matches/server.test.ts] |
| WEB-08 | Selected cutovers preserve schema validation, auth/session privacy, owner-source privacy, public DTO privacy, and redacted diagnostics. [VERIFIED: .planning/REQUIREMENTS.md] | Reuse Go/public clients, service DTO schemas, `assertPublicServiceDtoLeakSafe`, and Go service error parsing rather than adding raw fetch calls. [VERIFIED: apps/web/lib/go-backend-service-client.ts; apps/web/lib/public-go-read-client.ts] |
</phase_requirements>

## Summary

Phase 105 should make the selected v1.15-promoted web/API flows Go-only for normal runtime: auth/session, account Strategy Revision reads/source/create/save, Starter/Advanced forks, selected exhibition MatchSet creation, public Strategy/player/ladder/MatchSet reads, public replay metadata, and public replay evidence. [VERIFIED: .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-CONTEXT.md; .planning/artifacts/v1.15-lifecycle-ownership-manifest.json]

The main implementation work is not adding brand-new Go handlers; live Go already exposes the selected auth, account, fork, exhibition, public read, replay metadata, and replay evidence paths in `LiveServer.routes`. [VERIFIED: apps/go-backend/live_backend.go] The main work is removing selected normal-mode fallback from Next.js adapters and web server modules that still import `competitiveServer`, `@cowards/service`, or persistence-backed Chronicle/local service code. [VERIFIED: apps/web/app/api/**/route.ts; apps/web/lib/account-service-adapter.ts; apps/web/lib/public-service-adapter.ts; apps/web/app/matches/server.ts]

**Primary recommendation:** Make `COWARDS_GO_BACKEND_OWNER=go` / v1.16 selected mode select all Phase 105 route families by default, require `COWARDS_GO_BACKEND_URL`, fail closed on stopped Go, and update route manifests/monitors to prove the live Go route surface rather than relying on the current fixture-only GET manifest. [VERIFIED: apps/web/lib/account-service-adapter.ts; apps/web/lib/public-service-adapter.ts; apps/go-backend/main.go; apps/go-backend/live_backend.go; scripts/check-boundary-monitors.ts]

## Project Constraints (from AGENTS.md)

- The engine must remain pure, deterministic, serializable, and side-effect free; Phase 105 must not move game rules into React or web/API adapters. [VERIFIED: AGENTS.md]
- Strategy code must not execute in the web/API process, Go process, or Node `vm`; Phase 105 must preserve isolated runtime-service execution only. [VERIFIED: AGENTS.md; .planning/artifacts/v1.16-runtime-service-boundary.md]
- Runtime boundaries must validate hostile Strategy inputs/outputs with schemas, and public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md; .planning/artifacts/v1.16-runtime-service-boundary.md]
- Canonical terms such as Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, and Chronicle must be preserved. [VERIFIED: AGENTS.md]
- Replay or Match creation changes must include board realism checks for visible Soldier/terrain bounds and plausible full Match starts. [VERIFIED: AGENTS.md; scripts/check-local-topology.ts]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
| --- | --- | --- | --- |
| Auth/session read and mutation | API / Backend (Go) | Frontend Server (Next adapter) | Go live backend owns `/auth/session` and `/auth/sign-up`; Next routes should forward and set/clear cookies only. [VERIFIED: apps/go-backend/live_backend.go; apps/web/lib/go-backend-service-client.ts] |
| Account Strategy Revision list/source/create | API / Backend (Go) | Frontend Server (Next adapter) | Go live backend owns `/account/strategy-revisions` and source retrieval; Next should not perform selected normal persistence reads/writes. [VERIFIED: apps/go-backend/live_backend.go; apps/web/app/api/account/revisions/route.ts] |
| Starter/Advanced forks | API / Backend (Go) | Frontend Server (Next adapter) | Go live backend owns `/account/starter-forks` and `/account/advanced-forks`; web must not execute Strategy code while forking artifacts. [VERIFIED: apps/go-backend/live_backend.go; .planning/artifacts/v1.14-route-ownership-manifest.json] |
| Exhibition MatchSet creation | API / Backend (Go) | Isolated runtime service later through Go orchestration | Go live backend owns `POST /matchsets`; runtime service only executes Strategy code after Go orchestration requests it. [VERIFIED: apps/go-backend/live_backend.go; .planning/artifacts/v1.16-runtime-service-boundary.md] |
| Public Strategy/player/ladder/MatchSet reads | API / Backend (Go) | Frontend Server (Next page/API adapters) | Go fixture/live public routes exist for selected read DTOs; web pages should use public boundary clients and avoid local service fallback in selected mode. [VERIFIED: apps/go-backend/main.go; apps/go-backend/live_backend.go; apps/web/lib/public-service-boundary.ts] |
| Public replay metadata/evidence | API / Backend (Go) | Frontend Server (replay page renderer) | Go owns public replay metadata/evidence, while the browser renders replay UI from public-safe projection data. [VERIFIED: apps/go-backend/live_backend.go; apps/web/app/matches/server.ts; apps/web/app/matches/[matchId]/replay/page.tsx] |
| Private owner-debug replay | Deferred TypeScript private path | API / Backend (future Go owner-debug migration) | Owner-debug still depends on persisted Chronicle/private authorization logic and is explicitly deferred, not public fallback. [VERIFIED: apps/web/app/matches/server.ts; .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-CONTEXT.md] |

## Standard Stack

### Core

| Library / Runtime | Version | Purpose | Why Standard |
| --- | --- | --- | --- |
| Node.js | v24.15.0 | Runs Next/web tooling and TypeScript scripts. [VERIFIED: `node --version`] | Existing monorepo runtime; no new JS runtime is needed. [VERIFIED: package.json] |
| pnpm | 11.1.2 | Workspace package manager and script runner. [VERIFIED: `pnpm --version`; package.json] | Existing scripts use pnpm for tests, topology, monitors, and builds. [VERIFIED: package.json] |
| Go | go1.26.3 darwin/amd64 | Go backend route handlers and tests. [VERIFIED: `go version`] | Existing backend implementation and selected route ownership live in `apps/go-backend`. [VERIFIED: apps/go-backend/live_backend.go] |
| Next.js web app | Existing workspace package | Frontend pages and API adapter routes. [VERIFIED: apps/web/app; package.json] | Phase 105 keeps Next as frontend/server adapter, not backend owner. [VERIFIED: .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-CONTEXT.md] |
| `@cowards/spec` service DTO schemas | `service-api-v1.8` | Request/response schemas, route metadata, privacy guards. [VERIFIED: packages/spec/src/service.ts] | Existing clients parse Go responses through schemas and privacy checks. [VERIFIED: apps/web/lib/go-backend-service-client.ts; apps/web/lib/public-go-read-client.ts] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
| --- | --- | --- | --- |
| Vitest | 4.1.6 | Focused unit/adapter/monitor tests. [VERIFIED: package.json] | Use for adapter no-fallback tests, topology parser tests, and monitor tests. [VERIFIED: apps/web/lib/*test.ts; scripts/check-boundary-monitors.test.ts] |
| Playwright | 1.60.0 | Browser replay/page smoke. [VERIFIED: package.json] | Use for replay realism and visual smoke gates after route cutover. [VERIFIED: package.json; apps/web/e2e/replay.visual.spec.ts] |
| Docker / OrbStack context | Docker client 29.4.0, context `orbstack` | Local service dependencies for live topology. [VERIFIED: `docker info`] | Use for full live topology/page smoke where local Postgres/Redis are needed. [VERIFIED: package.json; scripts/check-local-topology.ts] |
| PostgreSQL CLI | psql 16.14 | Local DB checks and live Go backend mode. [VERIFIED: `psql --version`] | Use when running live DB-backed Go tests or topology. [VERIFIED: apps/go-backend/main.go; package.json] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
| --- | --- | --- |
| Removing fallback from selected adapters | Keep env-selectable TypeScript local fallback | Rejected for normal mode because Phase 105 requires no silent TypeScript backend fallback; explicit rollback can remain documented outside normal mode. [VERIFIED: 105-CONTEXT.md; .planning/artifacts/v1.15-promotion-decision.md] |
| Extending fixture `route-manifest.json` with write routes | Create or validate a separate live selected-route manifest | Preferred because current fixture `routeInventory` and `validateRouteManifest` require GET/read-only routes, while live Go owns auth/account/exhibition POST/DELETE routes. [VERIFIED: apps/go-backend/main.go; apps/go-backend/main_test.go; apps/go-backend/live_backend.go] |
| Hand-writing fetch calls in each API route | Reuse `go-backend-service-client.ts` and `public-go-read-client.ts` | Reuse is preferred because clients already enforce JSON parsing, schema validation, timeout/unavailable errors, set-cookie handling, and public DTO privacy checks. [VERIFIED: apps/web/lib/go-backend-service-client.ts; apps/web/lib/public-go-read-client.ts] |

**Installation:** No new package install is recommended. [VERIFIED: package.json]

## Selected Cutover Matrix

| Web/Next Surface | Go Contract | Current State | Phase 105 Action |
| --- | --- | --- | --- |
| `GET /api/auth/session` | `GET /auth/session` | Uses `getAccountSession()` through `accountReadService`, which can still instantiate local `@cowards/service`. [VERIFIED: apps/web/app/api/auth/session/route.ts; apps/web/lib/account-service-adapter.ts] | Make selected normal mode require Go, remove local service fallback for auth/session, and test missing URL/stopped Go fail-closed. |
| `POST /api/auth/sign-in` | `POST /auth/session` | Branches to Go when selected, otherwise calls `competitiveServer.signIn`. [VERIFIED: apps/web/app/api/auth/sign-in/route.ts] | Remove normal TypeScript branch or gate it as explicit rollback only; keep Set-Cookie forwarding from Go. |
| `POST /api/auth/sign-up` | `POST /auth/sign-up` | Branches to Go when selected, otherwise calls `competitiveServer.signUp`. [VERIFIED: apps/web/app/api/auth/sign-up/route.ts] | Same as sign-in; keep 201 status and Go Set-Cookie behavior. |
| `POST /api/auth/sign-out` | `DELETE /auth/session` | Branches to Go when selected, otherwise calls `competitiveServer.signOut`. [VERIFIED: apps/web/app/api/auth/sign-out/route.ts] | Same as sign-in; keep frontend clear-cookie response after Go revocation. |
| `GET /api/account/revisions` and account page reads | `GET /account/strategy-revisions` | Uses `accountReadService`, which falls back to local service when Go is not selected. [VERIFIED: apps/web/app/api/account/revisions/route.ts; apps/web/lib/account-service-adapter.ts] | Make Go selected for normal mode and ensure current-user read uses Go session boundary. |
| `POST /api/account/revisions/save` | `POST /account/strategy-revisions` | Uses Go only when account revisions are selected, otherwise calls `competitiveServer.saveAccountRevision`. [VERIFIED: apps/web/lib/account-revision-write-boundary.ts] | Remove normal TypeScript save path; after create, read back through Go revision list only. |
| `GET /api/account/revisions/[revisionId]/source` | `GET /account/strategy-revisions/{strategyRevisionId}/source` | Uses Go when selected, otherwise uses `competitiveServer.getAccountRevisionSource`. [VERIFIED: apps/web/app/api/account/revisions/[revisionId]/source/route.ts; apps/web/lib/go-backend-service-client.ts] | Keep owner-private source route but require Go in normal mode and preserve 404/null handling. |
| `POST /api/account/starter-forks` | `POST /account/starter-forks` | Uses Go when forks are selected; inventory marks Go-owned. [VERIFIED: apps/web/app/api/account/starter-forks/route.ts; apps/go-backend/live_backend.go] | Require Go normal mode and keep fork-readback guard. |
| `POST /api/account/advanced-forks` | `POST /account/advanced-forks` | Uses Go when forks are selected; inventory marks Go-owned. [VERIFIED: apps/web/app/api/account/advanced-forks/route.ts; apps/go-backend/live_backend.go] | Require Go normal mode and keep fork-readback guard. |
| `POST /api/exhibitions` | `POST /matchsets` | Uses Go when exhibitions are selected, otherwise calls `competitiveServer.createExhibition`. [VERIFIED: apps/web/app/api/exhibitions/route.ts; apps/web/lib/go-backend-service-client.ts] | Remove normal TypeScript competition fallback; preserve schema/error mapping and queued status. |
| Public pages `/strategies`, `/players`, `/ladder`, `/matchsets` | Go public read routes | `public-service-adapter.ts` can still default selectedOwner to `typescript`; `COWARDS_GO_PUBLIC_READS=1` selects all public reads. [VERIFIED: apps/web/lib/public-service-adapter.ts; apps/web/lib/public-service-boundary.ts] | Make all selected public reads Go-selected in normal v1.16 mode, requiring `COWARDS_GO_BACKEND_URL`. |
| `GET /api/replays/[matchId]/metadata` | `GET /public/replays/{matchId}/metadata` | Uses `publicReadService.getPublicReplayMetadata`, which can fall back to local service unless all public reads are selected. [VERIFIED: apps/web/app/api/replays/[matchId]/metadata/route.ts; apps/web/lib/public-service-adapter.ts] | Make Go selected in normal mode; preserve public DTO privacy. |
| Public replay page `/matches/[matchId]/replay` | `GET /public/replays/{matchId}/evidence` | Uses Go evidence only when `getPublicReplayEvidence` is selected and owner-debug is not requested; otherwise reads persisted Chronicle. [VERIFIED: apps/web/app/matches/server.ts; apps/web/app/matches/server.test.ts] | Make Go public evidence normal for public replay, keep persisted Chronicle path only for owner-debug/test/deferred fixture paths. |
| `GET /api/service/health` | `GET /health` | Returns local `@cowards/service` health without persistence. [VERIFIED: apps/web/app/api/service/health/route.ts] | In Go-selected/no-TypeScript-backend mode, proxy or validate Go `/health` instead of reporting TypeScript local service health. |

## Deferred, Test, Rollback, And Frontend-Only Surfaces

| Surface | Classification | Planning Note |
| --- | --- | --- |
| `POST /api/matchsets/[matchSetId]/flags` | Deferred governance/support mutation | The route currently imports `competitiveServer.flagMatchSetResult`, and no Go flag route exists; do not count it as Phase 105 selected public MatchSet read. [VERIFIED: apps/web/app/api/matchsets/[matchSetId]/flags/route.ts; apps/go-backend/live_backend.go] |
| Admin governance route | Deferred | `apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.ts` is deferred in the v1.16 inventory. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| Ladder mutation routes | Deferred | `apps/web/app/api/ladder/seasons/**` mutation routes are deferred in the v1.16 inventory. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| Workshop API routes | Deferred | Workshop revision/source/submit/validate/test/analytics routes are deferred until a future Workshop Go migration. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; 105-CONTEXT.md] |
| Test-support routes | Test-only | `api/test-support/replay-fixture` and `api/test-support/run-worker-once` are test-only and should stay gated out of product runtime. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| `apps/worker` and persistence lifecycle modules | Rollback/parity/test only, Phase 106 scope | Worker/job lifecycle quarantine is explicitly Phase 106, not Phase 105, but selected web routes must not call it as fallback. [VERIFIED: .planning/ROADMAP.md; .planning/artifacts/v1.15-lifecycle-ownership-manifest.json] |
| Owner-debug replay/private Chronicle projection | Deferred private path | Public replay evidence must use Go; owner-debug may keep authorization-gated Chronicle access until a future migration. [VERIFIED: apps/web/app/matches/server.ts; 105-CONTEXT.md] |
| React replay/client board rendering | Frontend-only | Replay board/client modules render already-projected data and should remain frontend-only. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; apps/web/app/matches/[matchId]/replay/page.tsx] |

## Go Route Manifest Changes

The fixture route manifest at `apps/go-backend/testdata/service-fixtures/route-manifest.json` currently lists eight routes: health, public player, public ladder, public MatchSet summary, public replay metadata, public replay evidence, public Strategy, and owner analytics run summary. [VERIFIED: apps/go-backend/testdata/service-fixtures/route-manifest.json]

The live Go backend currently registers additional selected Phase 105 routes: `GET/POST/DELETE /auth/session`, `POST /auth/sign-up`, `GET/POST /account/strategy-revisions`, `GET /account/strategy-revisions/{strategyRevisionId}/source`, `POST /account/starter-forks`, `POST /account/advanced-forks`, and `POST /matchsets`. [VERIFIED: apps/go-backend/live_backend.go]

Do not simply append write routes to the current fixture manifest unless `routeInventory`, `validateRouteManifest`, and `checkGoRouteManifest` are changed, because the fixture manifest validation currently expects GET/read-only entries and compares against the fixture server route inventory. [VERIFIED: apps/go-backend/main.go; apps/go-backend/main_test.go; scripts/check-boundary-monitors.ts]

Recommended implementation: create or extend a v1.16 selected live route manifest consumed by monitors, with these fields: route ID, method, path, Next adapter path, owner, auth scope, privacy class, selected normal status, fallback policy, stopped-Go behavior, and deferred/test/rollback classification. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; .planning/artifacts/v1.14-route-ownership-manifest.json]

The live manifest should reconcile three existing sources: `SERVICE_API_ROUTES` for core service contracts, `v1.14-route-ownership-manifest.json` for fork ownership, and `LiveServer.routes()` for actual handler registration. [VERIFIED: packages/spec/src/service.ts; .planning/artifacts/v1.14-route-ownership-manifest.json; apps/go-backend/live_backend.go]

## Architecture Patterns

### System Architecture Diagram

```text
Browser/page request
  -> Next.js page or /api adapter
    -> selected route? yes
      -> require COWARDS_GO_BACKEND_URL
      -> Go backend route
        -> schema-validated DTO / classified service error
        -> Next response or page render
    -> selected route? no
      -> deferred/test/rollback/private path label

Public replay page
  -> Next getMatchReplay()
    -> public mode and Go evidence selected
      -> Go GET /public/replays/{matchId}/evidence
      -> public-safe projection -> ReplayClient
    -> owner-debug requested
      -> explicit private/deferred Chronicle authorization path
```

Diagram basis: selected public evidence branches and owner-debug branches exist in `apps/web/app/matches/server.ts`; Go public evidence route exists in `apps/go-backend/live_backend.go`. [VERIFIED: apps/web/app/matches/server.ts; apps/go-backend/live_backend.go]

### Recommended Project Structure

```text
apps/web/lib/
|-- go-backend-service-client.ts       # selected account/auth/write Go client [VERIFIED]
|-- public-go-read-client.ts           # selected public read/evidence Go client [VERIFIED]
|-- account-service-adapter.ts         # cutover gate; remove selected local fallback [VERIFIED]
|-- public-service-adapter.ts          # cutover gate; remove selected local fallback [VERIFIED]
`-- *-boundary.ts                      # page/API DTO mapping only [VERIFIED]

apps/go-backend/
|-- live_backend.go                    # live selected route handlers [VERIFIED]
|-- main.go                            # fixture route inventory; keep fixture-only unless refactored [VERIFIED]
`-- testdata/service-fixtures/         # fixture public route manifest [VERIFIED]

scripts/
|-- check-boundary-monitors.ts         # add selected live route/no-fallback monitor checks [VERIFIED]
|-- check-local-topology.ts            # page smoke and live topology checks [VERIFIED]
`-- generate-typescript-backend-inventory.ts # regenerate after label/import changes [VERIFIED]
```

### Pattern 1: Selected Adapter Requires Go Client

**What:** A selected normal route should call `requireSelectedGoBackendClient(routeFamily)` and return schema-validated Go DTOs or classified errors. [VERIFIED: apps/web/lib/go-backend-service-client.ts]

**When to use:** Auth/session, account revision writes/source, forks, and exhibition creation. [VERIFIED: apps/web/app/api/auth/sign-in/route.ts; apps/web/app/api/exhibitions/route.ts]

```typescript
const result = await requireSelectedGoBackendClient(
  "account revisions",
).createStrategyRevision(sessionId, input)
```

Source: existing write boundary. [VERIFIED: apps/web/lib/account-revision-write-boundary.ts]

### Pattern 2: Public Reads Use Public Go Client With Privacy Guard

**What:** Public reads should use `createPublicGoReadClient`, schema parse the response, run `assertPublicServiceDtoLeakSafe`, and classify failures as `PublicGoReadError`. [VERIFIED: apps/web/lib/public-go-read-client.ts]

**When to use:** Public Strategy/player/ladder/MatchSet/replay metadata/replay evidence routes. [VERIFIED: apps/web/lib/public-service-adapter.ts]

```typescript
return requireGoClient(
  "getPublicReplayMetadata",
  selectedGoClient,
).getPublicReplayMetadata(matchId)
```

Source: existing public adapter. [VERIFIED: apps/web/lib/public-service-adapter.ts]

### Pattern 3: Public Replay Evidence Split

**What:** Public replay uses Go evidence; owner-debug stays explicit and private. [VERIFIED: apps/web/app/matches/server.ts]

**When to use:** `/matches/[matchId]/replay` and any replay API route where owner-debug is not requested. [VERIFIED: apps/web/app/matches/[matchId]/replay/page.tsx]

```typescript
if (selectedPublicReplayEvidence && options.allowOwnerDebug !== true) {
  return buildReadyReplayFromGoEvidence(evidence, options)
}
```

Source: existing replay server. [VERIFIED: apps/web/app/matches/server.ts]

### Anti-Patterns To Avoid

- **Leaving `competitiveServer` imports in selected normal API routes:** These imports are part of the report-only boundary offense baseline and can preserve TypeScript persistence fallback. [VERIFIED: scripts/check-boundary-monitors.ts]
- **Reporting TypeScript local service health in strict Go mode:** `api/service/health` currently instantiates `createCowardsLocalService`; strict selected topology should prove Go `/health`. [VERIFIED: apps/web/app/api/service/health/route.ts]
- **Treating `matchsets/[matchSetId]/flags` as a selected public read:** This route is a POST mutation backed by governance persistence and has no Go route. [VERIFIED: apps/web/app/api/matchsets/[matchSetId]/flags/route.ts; apps/go-backend/live_backend.go]
- **Using persisted Chronicle reads for public replay evidence when Go evidence is selected:** Public replay evidence should fail closed or use Go; persisted Chronicle fallback belongs only to owner-debug/test/deferred paths. [VERIFIED: apps/web/app/matches/server.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
| --- | --- | --- | --- |
| DTO validation | Ad hoc `JSON.parse` shape checks | Existing `@cowards/spec` schemas in Go/public clients | Existing clients validate service DTOs and errors. [VERIFIED: apps/web/lib/go-backend-service-client.ts; apps/web/lib/public-go-read-client.ts] |
| Public privacy scanning | Custom string denylist in each route | `assertPublicServiceDtoLeakSafe` and existing monitor privacy checks | Existing public Go client and monitors already enforce public DTO privacy. [VERIFIED: apps/web/lib/public-go-read-client.ts; scripts/check-boundary-monitors.ts] |
| Route ownership inventory | Manual markdown-only route table | v1.16 inventory JSON plus route ownership/manifest artifacts | Existing monitors consume machine-readable artifacts and stale-output checks. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; scripts/generate-typescript-backend-inventory.ts] |
| Replay projection | New projection logic in Next routes | Existing Go public evidence plus `buildReadyReplayFromPublicEvidence` | Existing replay code preserves public/owner-debug split. [VERIFIED: apps/web/app/matches/server.ts; apps/web/app/matches/replay-ready.ts] |
| Runtime fallback | Web/API Strategy execution or Node `vm` | Isolated runtime service through Go orchestration | Runtime service is explicitly not a backend and Go/web must not execute Strategy source. [VERIFIED: .planning/artifacts/v1.16-runtime-service-boundary.md] |

**Key insight:** Phase 105 is a boundary removal phase, so the safest implementation is deleting selected normal fallback branches and strengthening existing schema clients/monitors rather than creating new service abstractions. [VERIFIED: 105-CONTEXT.md; apps/web/lib/*service-adapter.ts]

## Runtime State Inventory

| Category | Items Found | Action Required |
| --- | --- | --- |
| Stored data | No renamed keys or schema migrations are in Phase 105 scope; selected routes read/write existing Postgres-backed auth/account/MatchSet/Chronicle data through Go. [VERIFIED: 105-CONTEXT.md; apps/go-backend/live_backend.go] | No data migration; run live DB-backed route smoke where available. [VERIFIED: package.json; apps/go-backend/main.go] |
| Live service config | Normal selected web routes depend on `COWARDS_GO_BACKEND_URL`; runtime orchestration depends on `COWARDS_RUNTIME_SERVICE_URL` for live Go orchestration. [VERIFIED: apps/web/lib/account-service-adapter.ts; apps/web/lib/public-service-adapter.ts; apps/go-backend/live_backend.go] | Require Go URL in selected mode; stopped-Go drill must fail closed. [VERIFIED: 105-CONTEXT.md] |
| OS-registered state | No systemd/launchd/pm2 registrations were found in repository planning/code references for Phase 105. [VERIFIED: repo grep for service scripts and package scripts] | None. |
| Secrets/env vars | Session cookies, owner tokens, DB URLs, and internal Go tokens must remain redacted; Go internal run-once uses `COWARDS_GO_BACKEND_INTERNAL_TOKEN`. [VERIFIED: apps/go-backend/live_backend.go; scripts/check-local-topology.ts] | Do not write secrets to artifacts; monitor diagnostics must redact URL tokens/credentials. [VERIFIED: scripts/check-local-topology.ts; 105-CONTEXT.md] |
| Build artifacts | TypeScript inventory artifacts and Go fixture checksums can become stale after route/manifest edits. [VERIFIED: scripts/generate-typescript-backend-inventory.ts; apps/go-backend/fixture_checksums_gen.go] | Regenerate/check inventory and Go parity fixtures if manifest/fixtures change. [VERIFIED: package.json] |

## Common Pitfalls

### Pitfall 1: Silent Fallback Survives In Adapter Defaults

**What goes wrong:** `createAccountReadService` and `createPublicReadService` instantiate local TypeScript service fallbacks even after selected Go routes exist. [VERIFIED: apps/web/lib/account-service-adapter.ts; apps/web/lib/public-service-adapter.ts]

**Why it happens:** The existing adapters were built for env-selectable promotion and rollback, not final no-TypeScript-backend normal mode. [VERIFIED: .planning/artifacts/v1.12-promotion-decision.md; .planning/artifacts/v1.15-promotion-decision.md]

**How to avoid:** Make selected v1.16 normal mode default to Go and require `COWARDS_GO_BACKEND_URL`; keep any rollback path explicit and non-normal. [VERIFIED: 105-CONTEXT.md]

**Warning signs:** Tests still pass when Go URL is missing, or local `@cowards/service` call counters increment in selected mode. [VERIFIED: apps/web/lib/public-service-adapter.test.ts]

### Pitfall 2: Route Manifest Drift Between Fixture And Live Go

**What goes wrong:** Monitors may validate only fixture GET routes while live selected account/exhibition routes drift. [VERIFIED: apps/go-backend/main.go; apps/go-backend/live_backend.go; scripts/check-boundary-monitors.ts]

**Why it happens:** `route-manifest.json` is fixture/read-only, while `LiveServer.routes()` registers the broader selected normal route set. [VERIFIED: apps/go-backend/testdata/service-fixtures/route-manifest.json; apps/go-backend/live_backend.go]

**How to avoid:** Add a v1.16 live selected-route manifest/monitor lane or refactor the existing manifest validation to distinguish fixture read routes from live selected routes. [VERIFIED: .planning/artifacts/v1.14-route-ownership-manifest.json; scripts/check-boundary-monitors.ts]

**Warning signs:** `checkGoRouteManifest` still rejects non-GET routes while Phase 105 claims auth/account/exhibition route coverage. [VERIFIED: scripts/check-boundary-monitors.ts]

### Pitfall 3: Public Replay Falls Back To Chronicle Store

**What goes wrong:** Public replay page can use persisted Chronicle reads instead of Go public evidence when public evidence route is not selected. [VERIFIED: apps/web/app/matches/server.ts]

**Why it happens:** The replay server intentionally preserves a private/deferred owner-debug Chronicle path. [VERIFIED: apps/web/app/matches/server.ts; 105-CONTEXT.md]

**How to avoid:** Select `getPublicReplayEvidence` for normal public replay and test that the Chronicle store is not called in public mode. [VERIFIED: apps/web/app/matches/server.test.ts]

**Warning signs:** Public replay passes without `COWARDS_GO_BACKEND_URL`, or `createChronicleStore().getByMatchId` is called in public selected mode. [VERIFIED: apps/web/app/matches/server.test.ts]

### Pitfall 4: Current User Reads Bypass Go Session

**What goes wrong:** Public/account page ownership checks can read sessions directly from persistence even while selected normal auth/session is Go-owned. [VERIFIED: apps/web/lib/public-service-adapter.ts; apps/web/app/competitive/server.ts]

**Why it happens:** `getCurrentPublicReadUser` currently calls `getSession(pool, sessionId)` directly, and `competitive/server.ts` has direct `getSession` usage. [VERIFIED: apps/web/lib/public-service-adapter.ts; apps/web/app/competitive/server.ts]

**How to avoid:** Route current-user/session reads for selected normal surfaces through the Go auth/session boundary. [VERIFIED: 105-CONTEXT.md]

**Warning signs:** `@cowards/persistence/auth` remains reachable from selected normal route adapters. [VERIFIED: scripts/check-boundary-monitors.ts]

## Code Examples

### Fail Closed On Missing Go URL

```typescript
const client = requireSelectedGoBackendClient("auth/session")
return client.getAuthSession(sessionId)
```

Source: existing Go client gate throws when `COWARDS_GO_BACKEND_URL` is missing. [VERIFIED: apps/web/lib/account-service-adapter.ts]

### Public Read Schema And Privacy Validation

```typescript
const parsed = schema.safeParse(body)
assertPublicServiceDtoLeakSafe(body)
```

Source: public Go client validates DTO shape and privacy before returning data. [VERIFIED: apps/web/lib/public-go-read-client.ts]

### Public Replay Evidence Without Chronicle Store

```typescript
const evidence = await publicReplayEvidenceClient.getPublicReplayEvidence(
  resolvedMatchId,
)
return evidence === null
  ? { status: "unavailable", matchId: resolvedMatchId, reason: "missing-chronicle" }
  : buildReadyReplayFromGoEvidence(evidence, options)
```

Source: replay server public-evidence branch. [VERIFIED: apps/web/app/matches/server.ts]

## State Of The Art

| Old Approach | Current Approach | When Changed | Impact |
| --- | --- | --- | --- |
| TypeScript service as normal backend for selected public/account flows | Go backend primary for selected normal workflows, TypeScript parity/rollback/deferred only | v1.13-v1.15 [VERIFIED: .planning/PROJECT.md; .planning/artifacts/v1.15-promotion-decision.md] | Phase 105 should remove selected normal web fallback branches. |
| Fixture-only Go public reads | Live Go owns selected auth/account/fork/exhibition/public/replay routes | v1.15 baseline [VERIFIED: apps/go-backend/live_backend.go; .planning/artifacts/v1.15-lifecycle-ownership-manifest.json] | Monitors need to check live selected route surface, not only fixture manifest. |
| Public replay from TypeScript Chronicle store | Public replay evidence from Go public evidence route | v1.15 baseline [VERIFIED: .planning/artifacts/v1.15-promotion-decision.md; apps/web/app/matches/server.ts] | Public mode must select Go evidence and keep owner-debug separate. |

**Deprecated/outdated:** Treating `@cowards/service` or `competitiveServer` as selected normal backend behavior is outdated for Phase 105 selected route families. [VERIFIED: 105-CONTEXT.md; .planning/artifacts/v1.16-typescript-backend-inventory.json]

## Monitor And Test Implications

- `knownReportOnlyBoundaryOffenses` should shrink when selected normal route files stop importing `competitiveServer`; expected removals include auth sign-in/sign-out/sign-up, account forks/source/save, exhibitions, and possibly `competitive/server.ts` selected auth/account/exhibition imports if refactored. [VERIFIED: scripts/check-boundary-monitors.ts; apps/web/app/api/**/route.ts]
- `checkGoRouteManifest` currently validates only fixture GET routes; Phase 105 needs a new live selected-route check or a split manifest model for fixture routes versus live normal routes. [VERIFIED: scripts/check-boundary-monitors.ts; apps/go-backend/main.go]
- `topology:check -- --require-web-page-smoke` currently covers 11 representative page types: Workshop, Sign in, Sign up, Account, Exhibition creation, Workshop evidence, Public player, Public Strategy, Public ladder, Public MatchSet, and Public replay. [VERIFIED: scripts/check-local-topology.ts]
- Phase 105 page smoke should require selected Go mode for Account, Exhibition creation, Public player, Public Strategy, Public ladder, Public MatchSet, and Public replay; Workshop evidence can remain deferred but must still load without implying Go ownership. [VERIFIED: scripts/check-local-topology.ts; 105-CONTEXT.md]
- Public replay smoke must preserve replay realism and privacy checks because replay/Match creation changes require visible Soldier/terrain positions in bounds and plausible starts. [VERIFIED: AGENTS.md; package.json; apps/web/e2e/replay.visual.spec.ts]

## Validation Architecture

### Test Framework

| Property | Value |
| --- | --- |
| Framework | Vitest 4.1.6, Go test go1.26.3, Playwright 1.60.0. [VERIFIED: package.json; `go version`] |
| Config file | `apps/web/vitest.config.ts`; Go package tests use standard `go test`; Playwright uses workspace Playwright config. [VERIFIED: rg --files] |
| Quick run command | `pnpm exec vitest run apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts apps/web/app/matches/server.test.ts scripts/check-boundary-monitors.test.ts` [VERIFIED: existing test files] |
| Full suite command | `pnpm boundary:monitors && pnpm e2e:visual` with required local services for live lanes. [VERIFIED: package.json; .planning/phases/104-isolated-runtime-service-boundary-hardening/104-VALIDATION.md] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
| --- | --- | --- | --- | --- |
| WEB-01 | Auth/session/account reads require Go and do not call local service in selected mode. | unit/integration | `pnpm exec vitest run apps/web/lib/account-service-adapter.test.ts` | Yes, extend. [VERIFIED: apps/web/lib/account-service-adapter.test.ts] |
| WEB-02 | Exhibition route posts to Go `POST /matchsets` and fails closed without Go URL. | unit/integration | Add route/client test, plus `cd apps/go-backend && go test ./... -run 'Exhibition|MatchSet'` | Partial. [VERIFIED: apps/web/app/api/exhibitions/route.ts; apps/go-backend/main_test.go] |
| WEB-03 | Public reads and public replay evidence use Go in normal mode. | unit/integration | `pnpm exec vitest run apps/web/lib/public-service-adapter.test.ts apps/web/app/matches/server.test.ts` | Yes, extend. [VERIFIED: apps/web/lib/public-service-adapter.test.ts; apps/web/app/matches/server.test.ts] |
| WEB-04 | Selected Next API routes are adapters; non-selected routes are deferred/test/rollback. | monitor | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts && pnpm boundary:imports` | Yes, extend. [VERIFIED: scripts/check-boundary-monitors.test.ts] |
| WEB-05 | `competitive/server.ts` no longer owns selected normal backend behavior. | monitor/static | `pnpm boundary:imports && pnpm typescript-backend:inventory:check` | Yes, extend inventory expectations. [VERIFIED: package.json] |
| WEB-06 | No silent fallback in account/public adapters. | unit | `pnpm exec vitest run apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts` | Yes, extend. [VERIFIED: existing tests] |
| WEB-07 | Public replay evidence does not read Chronicle store in selected mode. | unit | `pnpm exec vitest run apps/web/app/matches/server.test.ts -t 'Go public replay evidence'` | Yes. [VERIFIED: apps/web/app/matches/server.test.ts] |
| WEB-08 | Schema/auth/privacy errors are classified and redacted. | unit/monitor | `pnpm exec vitest run apps/web/lib/public-go-read-client.test.ts scripts/check-boundary-monitors.test.ts` | Yes, extend as needed. [VERIFIED: apps/web/lib/public-go-read-client.test.ts] |

### Sampling Rate

- **Per task commit:** Run focused Vitest/Go tests for touched adapters/routes plus `pnpm typescript-backend:inventory:check`. [VERIFIED: package.json]
- **Per wave merge:** Run `pnpm boundary:imports`, `pnpm exec vitest run scripts/check-boundary-monitors.test.ts`, and relevant Go tests. [VERIFIED: package.json]
- **Phase gate:** Run `pnpm boundary:monitors`, `pnpm topology:check -- --require-web-page-smoke --require-go --require-runtime-service`, and `pnpm e2e:visual` with local services running. [VERIFIED: package.json; scripts/check-local-topology.ts]

### Wave 0 Gaps

- [ ] Extend adapter tests so selected normal mode defaults to Go and does not construct/call local `@cowards/service`. [VERIFIED: apps/web/lib/account-service-adapter.test.ts; apps/web/lib/public-service-adapter.test.ts]
- [ ] Add live selected-route manifest/monitor tests for auth/account/fork/exhibition routes registered by `LiveServer.routes()`. [VERIFIED: apps/go-backend/live_backend.go; scripts/check-boundary-monitors.ts]
- [ ] Update page smoke strict mode to prove selected Go mode for account/exhibition/public/replay pages while treating Workshop as deferred load-only. [VERIFIED: scripts/check-local-topology.ts]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
| --- | --- | --- |
| V2 Authentication | Yes | Go-owned auth/session routes, session cookie forwarding, no raw token diagnostics. [VERIFIED: apps/go-backend/live_backend.go; apps/web/lib/go-backend-service-client.ts] |
| V3 Session Management | Yes | Session cookie name is centralized and Go client forwards cookies; sign-out clears frontend cookie after Go revoke. [VERIFIED: apps/web/lib/competitive-session.ts; apps/web/app/api/auth/sign-out/route.ts] |
| V4 Access Control | Yes | Owner routes require session/owner scope; analytics fixture owner route requires bearer token in fixture manifest. [VERIFIED: apps/go-backend/testdata/service-fixtures/route-manifest.json; apps/go-backend/main.go] |
| V5 Input Validation | Yes | Service DTO schemas and request parsing through `@cowards/spec`; Go client rejects invalid JSON/schema. [VERIFIED: packages/spec/src/service.ts; apps/web/lib/go-backend-service-client.ts] |
| V6 Cryptography | Yes, indirectly | Phase 105 must not expose token hashes/password hashes/raw tokens; cryptographic/session internals remain inside Go/persistence auth code. [VERIFIED: .planning/artifacts/v1.14-route-ownership-manifest.json; 105-CONTEXT.md] |

### Known Threat Patterns For This Stack

| Pattern | STRIDE | Standard Mitigation |
| --- | --- | --- |
| Silent TypeScript backend fallback after stopped Go | Spoofing/Tampering | Required Go client and stopped-Go fail-closed tests. [VERIFIED: 105-CONTEXT.md; apps/web/lib/public-service-adapter.test.ts] |
| Public DTO private data leak | Information Disclosure | `assertPublicServiceDtoLeakSafe`, public Go client validation, boundary monitor denylist. [VERIFIED: apps/web/lib/public-go-read-client.ts; scripts/check-boundary-monitors.ts] |
| Owner source disclosure | Information Disclosure | Keep source retrieval owner-scoped through Go account route; never include source in public DTOs. [VERIFIED: apps/web/lib/go-backend-service-client.ts; .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| Strategy execution in web/API/Go | Elevation of Privilege | Runtime service boundary only; no Node `vm` security boundary. [VERIFIED: .planning/artifacts/v1.16-runtime-service-boundary.md; AGENTS.md] |
| Route manifest drift | Tampering/Repudiation | Machine-readable manifest checks and monitor tests for selected live routes. [VERIFIED: scripts/check-boundary-monitors.ts; apps/go-backend/main_test.go] |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
| --- | --- | --- | --- | --- |
| Node.js | TypeScript scripts/tests/web | Yes | v24.15.0 [VERIFIED: `node --version`] | None needed. |
| pnpm | Workspace scripts | Yes | 11.1.2 [VERIFIED: `pnpm --version`] | None needed. |
| Go | Go backend tests/routes | Yes | go1.26.3 [VERIFIED: `go version`] | None needed. |
| Docker / OrbStack | Local DB/service topology | Yes | Docker 29.4.0, context `orbstack` [VERIFIED: `docker info`] | Existing scripts can use local service commands. [VERIFIED: package.json] |
| PostgreSQL CLI | Live DB checks | Yes | psql 16.14 [VERIFIED: `psql --version`] | Docker Compose service path exists. [VERIFIED: package.json] |

**Missing dependencies with no fallback:** None found during research. [VERIFIED: environment probes]

**Missing dependencies with fallback:** None found during research. [VERIFIED: environment probes]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
| --- | --- | --- | --- |
| A1 | This research remains valid until 2026-06-23 unless route manifests or adapters change first. [ASSUMED] | Metadata | Planner may rely on stale route findings if Phase 105 implementation changes route surfaces before planning is consumed. |

## Open Questions

1. **Should rollback remain in code or only in documentation for selected routes?** [VERIFIED: 105-CONTEXT.md]
   - What we know: Phase 105 forbids silent fallback and v1.15 rollback is explicit/operator-driven. [VERIFIED: .planning/artifacts/v1.15-promotion-decision.md]
   - What's unclear: Whether implementation should leave an explicit rollback env gate in the same files or remove selected TypeScript branches entirely. [VERIFIED: current code has branches in selected routes]
   - Recommendation: Remove selected normal fallback branches from API adapters where practical; if rollback code remains, require an unmistakable rollback-only flag and monitor label. [VERIFIED: 105-CONTEXT.md]

2. **Should the Go fixture route manifest be split or generalized?** [VERIFIED: apps/go-backend/main.go; apps/go-backend/live_backend.go]
   - What we know: Fixture manifest is GET/read-only; live Go has write/session routes. [VERIFIED: apps/go-backend/testdata/service-fixtures/route-manifest.json; apps/go-backend/live_backend.go]
   - What's unclear: Whether maintainers prefer one generalized manifest or separate fixture/live manifests. [VERIFIED: no v1.16 live selected-route manifest found]
   - Recommendation: Add a separate v1.16 live selected-route manifest to avoid breaking fixture parity assumptions. [VERIFIED: scripts/check-boundary-monitors.ts]

## Sources

### Primary (HIGH confidence)

- `.planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-CONTEXT.md` - locked route/fallback/deferred decisions.
- `.planning/REQUIREMENTS.md` - WEB-01 through WEB-08 requirements and traceability.
- `.planning/ROADMAP.md` - Phase 105 scope and success criteria.
- `.planning/artifacts/v1.16-typescript-backend-inventory.json` and `.md` - selected/deferred/test/rollback/frontend TypeScript surface inventory.
- `.planning/artifacts/v1.15-lifecycle-ownership-manifest.json` - v1.15 selected owner baseline.
- `.planning/artifacts/v1.15-promotion-decision.md` - Go backend ownership and rollback policy.
- `.planning/artifacts/v1.14-route-ownership-manifest.json` - artifact fork route ownership and Go-selected route families.
- `.planning/artifacts/v1.16-runtime-service-boundary.md` - runtime service must not become backend/fallback.
- `apps/go-backend/live_backend.go` - live selected Go route registration and handlers.
- `apps/go-backend/main.go` and `apps/go-backend/testdata/service-fixtures/route-manifest.json` - fixture route manifest and validation assumptions.
- `apps/web/lib/account-service-adapter.ts`, `apps/web/lib/public-service-adapter.ts`, `apps/web/lib/go-backend-service-client.ts`, `apps/web/lib/public-go-read-client.ts` - selected client/adapters and fallback behavior.
- `apps/web/app/matches/server.ts` - public Go replay evidence vs owner-debug Chronicle split.
- `scripts/check-boundary-monitors.ts` and `scripts/check-local-topology.ts` - monitor and page-smoke behavior.

### Secondary (MEDIUM confidence)

- `.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-SUMMARY.md` and `103-VALIDATION.md` - inventory generation and downstream monitor contract.
- `.planning/phases/104-isolated-runtime-service-boundary-hardening/104-SUMMARY.md` and `104-VALIDATION.md` - runtime boundary and residual live topology note.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions were verified from local commands and `package.json`. [VERIFIED: `node --version`; `pnpm --version`; `go version`; package.json]
- Architecture: HIGH - route ownership and adapter paths were verified from local code and planning artifacts. [VERIFIED: apps/go-backend/live_backend.go; .planning/artifacts/v1.16-typescript-backend-inventory.json]
- Pitfalls: HIGH - pitfalls map to existing tests, monitor assumptions, and code branches. [VERIFIED: apps/web/lib/*test.ts; scripts/check-boundary-monitors.ts]
- Live smoke data readiness: MEDIUM - dependencies are available, but live web/Go/runtime services were not started during this research. [VERIFIED: environment probes; .planning/phases/104-isolated-runtime-service-boundary-hardening/104-VALIDATION.md]

**Research date:** 2026-05-24 [VERIFIED: current session context]
**Valid until:** 2026-06-23 for repo-local planning unless route manifests or adapters change first. [ASSUMED]
