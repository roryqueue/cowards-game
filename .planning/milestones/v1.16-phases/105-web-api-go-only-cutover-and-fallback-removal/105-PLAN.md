---
phase: 105-web-api-go-only-cutover-and-fallback-removal
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/web/lib/account-service-adapter.ts
  - apps/web/lib/account-service-adapter.test.ts
  - apps/web/lib/account-service-boundary.ts
  - apps/web/lib/account-revision-write-boundary.ts
  - apps/web/lib/public-service-adapter.ts
  - apps/web/lib/public-service-adapter.test.ts
  - apps/web/app/api/auth/session/route.ts
  - apps/web/app/api/auth/sign-in/route.ts
  - apps/web/app/api/auth/sign-up/route.ts
  - apps/web/app/api/auth/sign-out/route.ts
  - apps/web/app/api/account/revisions/route.ts
  - apps/web/app/api/account/revisions/[revisionId]/source/route.ts
  - apps/web/app/api/account/starter-forks/route.ts
  - apps/web/app/api/account/advanced-forks/route.ts
  - apps/web/app/api/exhibitions/route.ts
  - apps/web/app/matches/server.ts
  - apps/web/app/matches/server.test.ts
  - apps/web/app/api/service/health/route.ts
  - apps/go-backend/live_backend.go
  - apps/go-backend/main_test.go
  - .planning/artifacts/v1.16-selected-go-route-manifest.json
  - .planning/artifacts/v1.16-selected-go-route-manifest.md
  - .planning/artifacts/v1.16-typescript-backend-inventory.json
  - .planning/artifacts/v1.16-typescript-backend-inventory.md
  - scripts/check-boundary-monitors.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-local-topology.ts
  - scripts/check-local-topology.test.ts
  - .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VALIDATION.md
autonomous: true
requirements: [WEB-01, WEB-02, WEB-03, WEB-04, WEB-05, WEB-06, WEB-07, WEB-08]
user_setup: []
must_haves:
  truths:
    - "User can complete selected auth/session and account Strategy Revision flows through web routes backed by Go contracts without TypeScript persistence or @cowards/service fallback."
    - "User can fork Starter and Advanced Strategies and create selected exhibition MatchSets through Go-backed web/API adapters."
    - "User can view selected public Strategy, player, ladder, MatchSet, replay metadata, and public replay evidence pages through Go-owned read contracts."
    - "Developer can verify selected Next.js API routes are frontend adapters, while Workshop, broader ladder mutations, governance/admin, owner-debug/private Chronicle, test-support, fixtures, rollback, and parity surfaces are explicitly non-normal."
    - "Developer can verify stopped Go and missing Go URL fail closed with classified redacted errors, not hidden TypeScript service behavior."
    - "Developer can run route-manifest, boundary-monitor, topology, page-smoke, schema, auth, source privacy, and public DTO privacy gates for the selected route set."
  artifacts:
    - path: "apps/web/lib/account-service-adapter.ts"
      provides: "Go-only selected account/session read adapter and no local-service fallback"
      exports: ["isGoAuthSessionSelected", "isGoAccountRevisionsSelected", "isGoAccountForksSelected", "isGoExhibitionsSelected", "requireSelectedGoBackendClient", "createAccountReadService"]
    - path: "apps/web/lib/public-service-adapter.ts"
      provides: "Go-only selected public read adapter and Go-backed current-user/session boundary"
      exports: ["resolvePublicReadRouteOwnership", "createPublicReadService", "getCurrentPublicReadUser"]
    - path: "apps/web/app/matches/server.ts"
      provides: "Public replay metadata/evidence split that uses Go for public evidence and keeps owner-debug/private Chronicle explicit"
      exports: ["createMatchReplayServer", "getMatchReplay"]
    - path: ".planning/artifacts/v1.16-selected-go-route-manifest.json"
      provides: "Machine-readable selected normal route manifest for auth/session, account revisions/source/save, starter/advanced forks, exhibitions, public reads, replay metadata, and replay evidence"
      contains: "v1.16-selected-go-route-manifest"
    - path: "scripts/check-boundary-monitors.ts"
      provides: "Boundary checks for selected Go route manifest, selected API adapter imports, no TypeScript fallback, and route drift"
      contains: "v1.16-selected-go-route-manifest"
    - path: "scripts/check-local-topology.ts"
      provides: "Strict selected-route page-smoke requirements for Account, Exhibition creation, public pages, and public replay"
      contains: "requireWebPageSmoke"
  key_links:
    - from: "apps/web/app/api/auth/sign-in/route.ts"
      to: "apps/web/lib/go-backend-service-client.ts"
      via: "requireSelectedGoBackendClient('auth/session').createSession"
      pattern: "requireSelectedGoBackendClient\\(\\s*['\"]auth/session['\"]\\s*\\)\\.createSession"
    - from: "apps/web/app/api/account/revisions/[revisionId]/source/route.ts"
      to: "apps/web/lib/go-backend-service-client.ts"
      via: "owner-private Go source retrieval with private no-store response"
      pattern: "getStrategyRevisionSource"
    - from: "apps/web/app/api/exhibitions/route.ts"
      to: "apps/web/lib/go-backend-service-client.ts"
      via: "POST /matchsets through createMatchSet"
      pattern: "createMatchSet"
    - from: "apps/web/lib/public-service-adapter.ts"
      to: "apps/web/lib/public-go-read-client.ts"
      via: "selected public route ids require PublicGoReadClient"
      pattern: "getPublicReplayEvidence"
    - from: "apps/web/app/matches/server.ts"
      to: "apps/web/lib/public-go-read-client.ts"
      via: "public replay evidence branch before Chronicle store access"
      pattern: "selectedPublicReplayEvidence"
    - from: "scripts/check-boundary-monitors.ts"
      to: ".planning/artifacts/v1.16-selected-go-route-manifest.json"
      via: "manifest validation for selected normal route ownership"
      pattern: "v1\\.16-selected-go-route-manifest"
---

<objective>
Create the executable Phase 105 implementation prompt for cutting selected normal web/API flows over to Go-only contracts.

Purpose: Phase 105 removes silent TypeScript backend fallback from selected v1.15-promoted normal routes while preserving TypeScript as frontend plus isolated JS/TS runtime service only. It must not broaden scope into Workshop, broader ladder mutations, governance/admin, owner-debug/private Chronicle migration, test-support routes, fixtures, rollback/parity paths, migrations, schema ownership, or runtime replacement.

Output: Go-only selected account/auth/revision/fork/exhibition/public/replay adapters, a selected live route manifest, focused TDD tests, boundary monitor checks, page-smoke requirements, regenerated TypeScript backend inventory, and Phase 105 validation notes covering WEB-01 through WEB-08.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/get-shit-done/workflows/execute-plan.md
@/Users/roryquinlan/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@AGENTS.md
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/SUMMARY.md
@.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-SUMMARY.md
@.planning/phases/104-isolated-runtime-service-boundary-hardening/104-SUMMARY.md
@.planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-CONTEXT.md
@.planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-RESEARCH.md
@.planning/artifacts/v1.15-lifecycle-ownership-manifest.json
@.planning/artifacts/v1.15-promotion-decision.md
@.planning/artifacts/v1.16-typescript-backend-inventory.json
@.planning/artifacts/v1.16-runtime-service-boundary.json
@apps/web/lib/account-service-adapter.ts
@apps/web/lib/account-service-boundary.ts
@apps/web/lib/go-backend-service-client.ts
@apps/web/lib/public-service-adapter.ts
@apps/web/lib/public-go-read-client.ts
@apps/web/app/matches/server.ts
@apps/go-backend/live_backend.go
@scripts/check-boundary-monitors.ts
@scripts/check-local-topology.ts

<interfaces>
Use these existing contracts directly.

From `apps/web/lib/go-backend-service-client.ts`:
```typescript
export interface GoBackendServiceClient {
  getAuthSession(sessionId: string): Promise<AuthSessionServiceDto>
  createSession(input: { username: unknown; password: unknown }): Promise<{ body: AuthSessionServiceDto; setCookie?: string | undefined }>
  createAccount(input: { username: unknown; password: unknown; handle: unknown; displayName: unknown }): Promise<{ body: AuthSessionServiceDto; setCookie?: string | undefined }>
  revokeSession(sessionId: string): Promise<void>
  listStrategyRevisions(sessionId: string): Promise<ListStrategyRevisionsServiceDto>
  createStrategyRevision(sessionId: string, input: { strategyId?: string; source: unknown; label?: unknown; notes?: unknown; starterId?: unknown; advancedId?: unknown }): Promise<StrategyRevisionSubmissionServiceDto>
  getStrategyRevisionSource(sessionId: string, revisionId: StrategyRevisionId): Promise<StrategyRevisionSourceServiceDto | null>
  forkStarterStrategy(sessionId: string, starterId: unknown): Promise<StrategyRevisionSubmissionServiceDto>
  forkAdvancedStrategy(sessionId: string, advancedId: unknown): Promise<StrategyRevisionSubmissionServiceDto>
  createMatchSet(sessionId: string, input: { presetId: unknown; revisionIds: unknown }): Promise<CreateMatchSetServiceDto>
}
```

From `apps/web/lib/public-go-read-client.ts`:
```typescript
export interface PublicGoReadClient {
  getPublicStrategyPage(strategyId: StrategyId): Promise<PublicStrategyPageServiceDto | null>
  getPublicPlayerPage(handle: string): Promise<PublicPlayerPageServiceDto | null>
  getPublicLadderSeason(seasonId: string): Promise<PublicLadderPageServiceDto | null>
  getPublicMatchSetSummary(matchSetId: MatchSetId): Promise<PublicMatchSetSummaryServiceDto | null>
  getPublicReplayMetadata(matchId: MatchId): Promise<PublicReplayMetadataServiceDto | null>
  getPublicReplayEvidence(matchId: MatchId): Promise<PublicReplayEvidenceServiceDto | null>
}
```

From `apps/web/lib/account-service-boundary.ts`:
```typescript
export const getAccountSession = async (): Promise<AuthSessionServiceDto> =>
  accountReadService.getAuthSession(await getAccountSessionId())
export const getCurrentAccountReadUser = async (): Promise<AccountReadUser | null> =>
  (await getAccountSession()).user
export const listAccountReadRevisions = async (): Promise<AccountReadRevisionSummary[]> => { ... }
```

From `apps/go-backend/live_backend.go`, live selected route registrations already exist:
```go
mux.HandleFunc("GET /auth/session", server.authSession)
mux.HandleFunc("POST /auth/session", server.signIn)
mux.HandleFunc("POST /auth/sign-up", server.signUp)
mux.HandleFunc("DELETE /auth/session", server.signOut)
mux.HandleFunc("GET /account/strategy-revisions", server.listStrategyRevisions)
mux.HandleFunc("POST /account/strategy-revisions", server.createStrategyRevision)
mux.HandleFunc("GET /account/strategy-revisions/{strategyRevisionId}/source", server.strategyRevisionSource)
mux.HandleFunc("POST /account/starter-forks", server.forkStarterStrategy)
mux.HandleFunc("POST /account/advanced-forks", server.forkAdvancedStrategy)
mux.HandleFunc("POST /matchsets", server.createExhibition)
```
</interfaces>
</context>

<source_audit>
## Multi-Source Coverage Audit

| Source | Item | Coverage |
| --- | --- | --- |
| GOAL | Users can use selected normal account/session, fork, exhibition, public read, and public replay evidence workflows through Go-owned contracts with no TypeScript backend fallback. | Tasks 1, 2, and 3. |
| REQ | WEB-01 selected account/session flows use Go-owned contracts without TypeScript persistence or `@cowards/service` fallback. | Task 1. |
| REQ | WEB-02 selected exhibition MatchSet creation uses Go-owned contracts without TypeScript competition persistence fallback. | Task 1. |
| REQ | WEB-03 selected public Strategy, player, ladder, MatchSet, replay metadata, and public replay evidence pages use Go-owned read contracts without TypeScript service fallback. | Task 2. |
| REQ | WEB-04 selected Next.js API routes are frontend adapters or explicitly non-normal. | Task 3 manifest and monitor checks. |
| REQ | WEB-05 `apps/web/app/competitive/server.ts` no longer owns selected normal auth/session/account/fork/exhibition backend behavior, or remaining code is rollback/deferred only. | Task 1 removes selected imports; Task 3 inventory/monitor verifies. |
| REQ | WEB-06 account/public adapters cannot silently fall back when Go is selected or required. | Task 1 and Task 2 tests. |
| REQ | WEB-07 selected public replay evidence avoids persistence-backed TypeScript Chronicle reads except explicit owner-debug or test/deferred paths. | Task 2. |
| REQ | WEB-08 schema validation, error classification, auth/session privacy, owner-source privacy, public DTO privacy, and redacted diagnostics are preserved. | Tasks 1, 2, and 3. |
| RESEARCH | Make `COWARDS_GO_BACKEND_OWNER=go` select all Phase 105 selected route families and require `COWARDS_GO_BACKEND_URL`. | Tasks 1 and 2. |
| RESEARCH | Remove selected normal fallback from `account-service-adapter.ts`, `public-service-adapter.ts`, selected API routes, and public replay evidence. | Tasks 1 and 2. |
| RESEARCH | Preserve private owner-debug replay as explicit/deferred and never use it as public fallback. | Task 2. |
| RESEARCH | Add selected live route manifest/monitor coverage for auth/account/fork/exhibition routes beyond fixture GET manifest. | Task 3. |
| RESEARCH | Page smoke must require selected Go mode for Account, Exhibition creation, Public player, Public Strategy, Public ladder, Public MatchSet, and Public replay; Workshop remains deferred load-only. | Task 3. |
| CONTEXT | D-01 actual cutover, not documentation. | Tasks 1 and 2 remove normal fallback branches; Task 3 verifies. |
| CONTEXT | D-02 selected route families include auth/session, account revisions/source/save, starter/advanced forks, exhibitions, public reads, replay metadata/evidence. | Tasks 1, 2, and route manifest in Task 3. |
| CONTEXT | D-03 do not expand into all TypeScript-backed routes. | Task 3 out-of-scope classifications; no task touches Workshop/governance/broader ladder/rollback fixtures except labels/monitors. |
| CONTEXT | D-04 require Go URL/equivalent when selected or strict topology active. | Tasks 1, 2, and topology gate in Task 3. |
| CONTEXT | D-05 no fallback to local `@cowards/service`, direct persistence, or Chronicle reads for selected normal routes. | Tasks 1 and 2. |
| CONTEXT | D-06 stopped-Go produces explicit classified failure. | Tasks 1, 2, and Task 3 stopped-Go/topology checks. |
| CONTEXT | D-07 selected Next.js API routes are frontend adapters to Go-backed clients. | Tasks 1 and 3. |
| CONTEXT | D-08 selected API routes must not directly import persistence or `@cowards/service`. | Tasks 1 and 3. |
| CONTEXT | D-09 avoid hidden direct DB reads inside selected public/account adapters. | Tasks 1 and 2. |
| CONTEXT | D-10 current-user/session uses Go-owned account/session boundary when selected. | Tasks 1 and 2. |
| CONTEXT | D-11 public replay metadata/evidence uses Go public contracts. | Task 2. |
| CONTEXT | D-12 owner-debug replay remains explicit/private/deferred and never public fallback. | Task 2 and Task 3 classifications. |
| CONTEXT | D-13 selected route failures are schema/auth classified and redacted. | Tasks 1, 2, and 3. |
| CONTEXT | D-14 public errors and DTOs do not leak source, memories, objective payloads, owner-debug, stack traces, DB details, host paths, tokens, session internals, or private runtime material. | Tasks 1, 2, and 3. |
| CONTEXT | Deferred Workshop validation/submission/save/source/test/analytics/export/runtime flows. | Explicitly excluded; Task 3 labels as deferred/load-only where encountered. |
| CONTEXT | Deferred broader ladder mutations, scheduling, entries, governance/admin, owner-debug/private Chronicle migration, test-support, fixture generators, migration/schema ownership. | Explicitly excluded; Task 3 labels as deferred/test-only/fixture-only/rollback/parity-only and no implementation task migrates them. |
</source_audit>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Cut selected account, auth, fork, source, save, and exhibition API routes to Go-only</name>
  <files>apps/web/lib/account-service-adapter.ts, apps/web/lib/account-service-adapter.test.ts, apps/web/lib/account-service-boundary.ts, apps/web/lib/account-revision-write-boundary.ts, apps/web/app/api/auth/session/route.ts, apps/web/app/api/auth/sign-in/route.ts, apps/web/app/api/auth/sign-up/route.ts, apps/web/app/api/auth/sign-out/route.ts, apps/web/app/api/account/revisions/route.ts, apps/web/app/api/account/revisions/[revisionId]/source/route.ts, apps/web/app/api/account/starter-forks/route.ts, apps/web/app/api/account/advanced-forks/route.ts, apps/web/app/api/exhibitions/route.ts</files>
  <behavior>
    - RED first: tests prove `COWARDS_GO_BACKEND_OWNER=go` selects auth/session, account revisions, account forks, and exhibitions by default, per D-01, D-02, and D-04.
    - RED first: selected account/session reads call only `GoBackendServiceClient` and do not construct or call `createCowardsLocalService`, per D-05, D-06, D-09, and D-10.
    - RED first: missing `COWARDS_GO_BACKEND_URL` and unavailable Go client reject with route-family-specific errors for auth/session, revisions, forks, source, save, and exhibitions; TypeScript persistence fallback call counters remain zero.
    - RED first: auth sign-in/sign-up preserve Go `Set-Cookie`, sign-out calls Go revoke then clears the frontend cookie, revision source returns private `text/plain` with `cache-control: private, no-store`, forks and save read back through Go revision list, and exhibitions return queued MatchSet shape.
    - RED first: selected API route source files no longer import `competitiveServer`, `getCurrentCompetitiveUser`, direct persistence modules, or `@cowards/service` for normal behavior.
  </behavior>
  <action>Make selected account/auth/write routes Go-only for normal runtime. In `account-service-adapter.ts`, remove eager local service construction from selected paths and make Go owner mode the normal selected path for auth/session, account revisions, account forks, and exhibitions per D-01 through D-10. If an explicit rollback/test helper remains, gate it behind an unmistakable non-normal option that production `COWARDS_GO_BACKEND_OWNER=go` never uses; do not leave silent fallback behavior. Update `account-service-boundary.ts` so current-user/session reads for selected account surfaces come from `accountReadService.getAuthSession` and not hidden persistence reads. Remove normal TypeScript branches and `competitiveServer` imports from auth sign-in/sign-up/sign-out, account revision source, starter fork, advanced fork, account revision save boundary, and exhibitions route. Use `requireSelectedGoBackendClient()` and existing schema clients instead of raw fetch calls. Preserve response behavior: Go auth Set-Cookie forwarding, sign-out clear cookie, private source `cache-control`, fork/save readback guard, exhibition queued response, and `competitiveErrorResponse` redacted classification. Do not touch Workshop, broader ladder mutations, governance/admin, owner-debug replay/private Chronicle, test-support routes, fixtures, rollback/parity paths, migrations, schema ownership, or runtime execution.</action>
  <verify>
    <automated>pnpm exec vitest run apps/web/lib/account-service-adapter.test.ts</automated>
    <automated>pnpm boundary:imports</automated>
    <automated>rg -n "competitiveServer|getCurrentCompetitiveUser|@cowards/persistence|@cowards/service" apps/web/app/api/auth/session/route.ts apps/web/app/api/auth/sign-in/route.ts apps/web/app/api/auth/sign-up/route.ts apps/web/app/api/auth/sign-out/route.ts apps/web/app/api/account/revisions/route.ts 'apps/web/app/api/account/revisions/[revisionId]/source/route.ts' apps/web/app/api/account/starter-forks/route.ts apps/web/app/api/account/advanced-forks/route.ts apps/web/app/api/exhibitions/route.ts apps/web/lib/account-revision-write-boundary.ts | grep -v '^#' | grep -c . | grep -q '^0$'</automated>
  </verify>
  <done>Selected auth/session, account revision/source/save, starter/advanced fork, and exhibition routes are frontend adapters to Go clients, fail closed without Go configuration, preserve auth/source/privacy response semantics, and cannot silently call TypeScript persistence or `@cowards/service` in selected normal mode.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Cut selected public reads and public replay evidence to Go-only while preserving private owner-debug as deferred</name>
  <files>apps/web/lib/public-service-adapter.ts, apps/web/lib/public-service-adapter.test.ts, apps/web/lib/public-go-read-client.ts, apps/web/lib/public-go-read-client.test.ts, apps/web/app/matches/server.ts, apps/web/app/matches/server.test.ts, apps/web/app/api/replays/[matchId]/metadata/route.ts, apps/web/app/api/service/health/route.ts</files>
  <behavior>
    - RED first: `COWARDS_GO_BACKEND_OWNER=go` or strict selected mode selects `getPublicStrategyPage`, `getPublicPlayerPage`, `getPublicLadderSeason`, `getPublicMatchSetSummary`, `getPublicReplayMetadata`, and `getPublicReplayEvidence` by default, per D-02 and D-11.
    - RED first: selected public reads require `COWARDS_GO_BACKEND_URL`, never call `createCowardsLocalService`, and return `PublicGoReadError` diagnostics without source/memory/objective/owner/session/token/DB/host/private-runtime leaks, per D-04 through D-06 and D-13 through D-14.
    - RED first: `getCurrentPublicReadUser` uses the Go auth/session boundary in selected mode and does not call `getSession(pool, sessionId)` directly for selected public/account adapters, per D-09 and D-10.
    - RED first: public replay metadata and public replay evidence use Go public read/evidence clients in selected normal mode; `createChronicleStore().getByMatchId` is not called for public replay and stopped Go fails closed, per D-11 and D-12.
    - RED first: owner-debug/private Chronicle behavior remains explicit, authorization-gated, and non-public; public replay never falls back to owner-debug/private Chronicle when Go evidence is selected.
  </behavior>
  <action>Update `public-service-adapter.ts` so selected normal public route ownership resolves to Go for the full Phase 105 public route set when `COWARDS_GO_BACKEND_OWNER=go`, `COWARDS_GO_PUBLIC_READS=1`, or the new strict selected mode from Task 3 is active. Remove selected normal local-service fallback and direct persistence-backed current-user reads; route selected current-user/session lookup through the Go auth/session boundary. Keep rollback/parity helpers only if they are explicit non-normal paths and monitor-labeled, not defaults. Update `matches/server.ts` so public replay metadata/evidence uses Go public read contracts for selected normal paths and only uses persisted Chronicle reads for explicit owner-debug, replay fixture, or test/deferred paths. Preserve owner-debug authorization checks and public DTO privacy. Update `/api/service/health` so strict Go/no-TypeScript-backend mode proxies or validates Go `/health` rather than reporting TypeScript local service health; outside strict mode it may remain a frontend health endpoint, not a selected backend proof. Reuse `PublicGoReadClient`, `assertPublicServiceDtoLeakSafe`, and existing DTO schemas; do not hand-roll DTO validation or replay projection.</action>
  <verify>
    <automated>pnpm exec vitest run apps/web/lib/public-service-adapter.test.ts apps/web/lib/public-go-read-client.test.ts apps/web/app/matches/server.test.ts</automated>
    <automated>rg -n "getSession\\(|createCowardsLocalService\\(|createPostgresChronicleStore\\(" apps/web/lib/public-service-adapter.ts apps/web/app/matches/server.ts | grep -v '^#' | grep -E "getSession\\(|createCowardsLocalService\\(" | grep -c . | grep -q '^0$'</automated>
    <automated>pnpm boundary:imports</automated>
  </verify>
  <done>Selected public pages, replay metadata, and public replay evidence use Go public read/evidence clients with schema/privacy validation, stopped-Go fail-closed behavior, no public Chronicle fallback, and explicit private/deferred owner-debug separation.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Add selected route manifest, monitor gates, inventory sync, and strict page-smoke evidence</name>
  <files>.planning/artifacts/v1.16-selected-go-route-manifest.json, .planning/artifacts/v1.16-selected-go-route-manifest.md, apps/go-backend/live_backend.go, apps/go-backend/main_test.go, scripts/check-boundary-monitors.ts, scripts/check-boundary-monitors.test.ts, scripts/check-local-topology.ts, scripts/check-local-topology.test.ts, .planning/artifacts/v1.16-typescript-backend-inventory.json, .planning/artifacts/v1.16-typescript-backend-inventory.md, .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VALIDATION.md</files>
  <behavior>
    - RED first: selected live route manifest validation requires auth/session, account revisions/source/save, starter forks, advanced forks, exhibitions, public Strategy/player/ladder/MatchSet reads, replay metadata, replay evidence, and Go health entries with method, Go path, Next adapter path/page, auth scope, privacy class, selected normal status, fallback policy, stopped-Go behavior, and non-normal classification.
    - RED first: monitor tests fail when a selected normal API route imports `competitiveServer`, direct persistence, `@cowards/service`, or persisted Chronicle fallback; deferred Workshop, broader ladder mutation, governance/admin, test-support, fixture, rollback, parity, and owner-debug/private Chronicle paths are recognized as non-normal and not counted as selected.
    - RED first: `LiveServer.routes()` registration and the selected route manifest stay synchronized without forcing non-GET write routes into the existing fixture-only `route-manifest.json`.
    - RED first: topology page-smoke strict mode requires selected Go mode for Account, Exhibition creation, Public player, Public Strategy, Public ladder, Public MatchSet, and Public replay; Workshop and Workshop evidence remain load-only/deferred and must not imply Go ownership.
    - RED first: monitor and topology diagnostics redact URL credentials, bearer tokens, session identifiers, DB DSNs, host paths, Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner-debug data, stack traces, stderr, and private runtime material.
  </behavior>
  <action>Create `.planning/artifacts/v1.16-selected-go-route-manifest.json` and `.md` from an explicit manifest constant or generator path in `scripts/check-boundary-monitors.ts`; include exactly the Phase 105 selected normal route families from D-02 plus Go health. Keep the existing fixture `apps/go-backend/testdata/service-fixtures/route-manifest.json` GET/read-only and do not append write routes to it unless the fixture validator is deliberately split. Add monitor functions and tests that validate the selected live manifest against `apps/go-backend/live_backend.go` registrations and selected Next adapter/page paths. Update the known report-only boundary baseline to remove selected normal API route offenses eliminated by Task 1, while preserving deferred entries for Workshop, broader ladder mutations, governance/admin, owner-debug/private Chronicle, test-support, fixtures, rollback, and parity. Regenerate `.planning/artifacts/v1.16-typescript-backend-inventory.json` and `.md` after code edits so selected route rows become frontend-adapter/go-selected/no-fallback and out-of-scope rows remain deferred/test-only/fixture-only/rollback-only/parity-only. Extend `scripts/check-local-topology.ts` and tests with a strict selected Go page-smoke lane, for example `--require-v1-16-selected-go-pages`, that requires web + Go + runtime-service URLs and validates Account, Exhibition creation, Public player, Public Strategy, Public ladder, Public MatchSet, and Public replay pages under Go-selected env. Record `105-VALIDATION.md` with focused test commands, live service startup commands, stopped-Go classification, page-smoke expectations, route-manifest coverage, and explicit out-of-scope list. Do not implement rollback/parity, Workshop migration, ladder mutation migration, governance/admin migration, owner-debug replay migration, test-support changes, fixture generators, migrations, schema ownership, or runtime broker work.</action>
  <verify>
    <automated>pnpm exec vitest run scripts/check-boundary-monitors.test.ts scripts/check-local-topology.test.ts</automated>
    <automated>pnpm typescript-backend:inventory && pnpm typescript-backend:inventory:check</automated>
    <automated>cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...</automated>
    <automated>pnpm boundary:monitors</automated>
    <automated>pnpm topology:check -- --require-web-page-smoke --require-go --require-runtime-service</automated>
    <automated>test -s .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VALIDATION.md && grep -v '^#' .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VALIDATION.md | grep -q 'WEB-08'</automated>
  </verify>
  <done>Selected route manifest and monitor gates prove route ownership, no selected fallback, live Go route coverage, page-smoke coverage, inventory sync, stopped-Go fail-closed behavior, and explicit non-normal status for all excluded surfaces.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
| --- | --- |
| Browser -> Next API adapter | Untrusted request bodies, cookies, and route parameters enter frontend adapter routes. |
| Next API/page server -> Go backend | Selected normal routes cross from frontend server to Go-owned contracts using `COWARDS_GO_BACKEND_URL`. |
| Next public replay renderer -> Go public evidence | Public replay data crosses into browser-rendered DTOs and must stay public-safe. |
| Account owner routes -> Strategy source | Owner-private Strategy Revision source is returned only through authenticated Go account/source route. |
| Monitor artifacts -> enforcement scripts | Route manifests and inventories become enforcement inputs and must not drift or leak private data. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
| --- | --- | --- | --- | --- |
| T-105-01 | Spoofing | auth/session adapters | mitigate | Use Go auth/session boundary for selected current-user/session reads; preserve Go Set-Cookie/revoke semantics and fail closed when Go URL is absent. |
| T-105-02 | Tampering | selected API route fallback branches | mitigate | Remove selected normal `competitiveServer`, direct persistence, `@cowards/service`, and public Chronicle fallback imports; enforce with Vitest and boundary monitors. |
| T-105-03 | Repudiation | selected route ownership | mitigate | Add v1.16 selected Go route manifest with method/path/adapter/auth/privacy/fallback/stopped-Go fields and monitor it against live Go registrations. |
| T-105-04 | Information Disclosure | public DTOs and replay evidence | mitigate | Reuse schema clients and `assertPublicServiceDtoLeakSafe`; monitor denylist for Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner-debug, tokens, DB details, host paths, stack traces, stderr, and private runtime material. |
| T-105-05 | Information Disclosure | Strategy Revision source route | mitigate | Keep source retrieval owner-scoped through Go, return `text/plain`, and keep `cache-control: private, no-store`; never include source in public DTOs or route manifests. |
| T-105-06 | Denial of Service | stopped Go or missing Go URL | mitigate | Selected routes produce explicit classified failure and no TypeScript fallback; add stopped-Go/missing-URL tests and topology checks. |
| T-105-07 | Elevation of Privilege | runtime/Strategy execution | mitigate | Do not execute Strategy code in web/API or Go; Phase 104 runtime service remains the only JS/TS Strategy execution boundary. |
</threat_model>

<verification>
Focused gates:

```bash
pnpm exec vitest run apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts apps/web/lib/public-go-read-client.test.ts apps/web/app/matches/server.test.ts scripts/check-boundary-monitors.test.ts scripts/check-local-topology.test.ts
pnpm boundary:imports
pnpm typescript-backend:inventory:check
cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...
```

Phase gates after local web, Go backend, and runtime service are running:

```bash
pnpm boundary:monitors
pnpm topology:check -- --require-web-page-smoke --require-go --require-runtime-service
pnpm e2e:visual
```

The live phase gate may require the existing local service startup documented in Phase 104 validation. Any skipped live lane must be recorded in `105-VALIDATION.md` with the exact missing service and the focused gates that did pass.
</verification>

<success_criteria>
- WEB-01 through WEB-08 have focused tests and validation evidence.
- Selected normal auth/session, account revision list/source/save, Starter/Advanced fork, exhibition creation, public read, public replay metadata, and public replay evidence routes require Go in normal selected mode.
- Missing or stopped Go fails closed with classified, redacted errors and no TypeScript service/persistence/Chronicle fallback.
- Selected Next.js API route files do not import `competitiveServer`, direct persistence, `@cowards/service`, or runtime execution modules for normal behavior.
- Public replay uses Go public evidence in selected normal mode and owner-debug/private Chronicle remains explicit, private, authorization-gated, and deferred.
- `.planning/artifacts/v1.16-selected-go-route-manifest.json` exists and is validated by monitors without corrupting the existing fixture GET route manifest.
- Page-smoke strict mode covers Account, Exhibition creation, Public player, Public Strategy, Public ladder, Public MatchSet, and Public replay under Go-selected topology; Workshop and Workshop evidence remain load-only/deferred.
- Workshop, broader ladder mutations, governance/admin, owner-debug/private Chronicle migration, test-support routes, fixture generators, rollback/parity paths, migrations, schema ownership, and runtime broker/replacement are explicitly not implemented in Phase 105.
</success_criteria>

<output>
After completion, create `.planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-SUMMARY.md`.
</output>
