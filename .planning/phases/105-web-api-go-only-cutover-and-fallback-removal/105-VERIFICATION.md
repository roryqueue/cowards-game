---
phase: 105-web-api-go-only-cutover-and-fallback-removal
verified: 2026-05-24T20:33:02Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
---

# Phase 105: Web/API Go-Only Cutover and Fallback Removal Verification Report

**Phase Goal:** Users can use selected normal account/session, fork, exhibition, public read, and public replay evidence workflows through Go-owned contracts with no TypeScript backend fallback.
**Verified:** 2026-05-24T20:33:02Z
**Status:** passed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | User can complete selected account/session and account Strategy Revision flows through web routes backed by Go contracts. | VERIFIED | `apps/web/lib/account-service-adapter.ts` selects Go for `COWARDS_GO_BACKEND_OWNER=go` / `COWARDS_NO_TYPESCRIPT_BACKEND=1` and requires `COWARDS_GO_BACKEND_URL`; selected auth/account routes call `requireSelectedGoBackendClient`; `tests/phase-105-selected-go-route-behavior.test.ts` covers auth cookies, source reads, save/fork readback. |
| 2 | User can create selected exhibition MatchSets through Go-backed web routes. | VERIFIED | `apps/web/app/api/exhibitions/route.ts` calls `requireSelectedGoBackendClient("exhibitions").createMatchSet`; behavior test verifies queued MatchSet response and invalid revision filtering. |
| 3 | User can view selected public pages and replay evidence through Go-backed read contracts. | VERIFIED | `apps/web/lib/public-service-adapter.ts` selects Strategy/player/ladder/MatchSet/replay metadata/replay evidence reads for Go; `apps/web/app/matches/server.ts` uses `getPublicReplayEvidence` before any Chronicle store path in selected public mode. |
| 4 | Developer can verify selected Next.js API routes are frontend adapters or explicitly non-normal. | VERIFIED | Static grep found zero `competitiveServer`, `@cowards/persistence`, or `@cowards/service` imports in selected auth/account/fork/exhibition route files. Boundary imports pass with `strict_offenses=0 report_only_offenses=22`, all report-only entries are deferred/admin/ladder/private replay/workshop/test scope. |
| 5 | Developer can verify TypeScript service, local persistence, and Chronicle fallback paths fail closed or are quarantined when Go is selected. | VERIFIED | Missing Go URL throws route-family Go ownership errors in account/public adapters; selected replay metadata/evidence throws without `COWARDS_GO_BACKEND_URL` rather than reading Chronicle; owner-debug Chronicle remains explicit via `allowOwnerDebug`/owner mode. |
| 6 | Developer can run schema, auth, source privacy, public DTO privacy, no-fallback, route drift, monitor, topology, page-load, and replay realism gates. | VERIFIED | Focused Vitest suite, boundary imports, inventory check, Go tests, boundary monitors, strict live topology, and desktop replay visual tests all passed during verification. |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/lib/account-service-adapter.ts` | Go-only selected account/session read adapter and no selected local fallback | VERIFIED | Exports selected helpers and requires Go URL in selected mode; local service is lazy and only used when Go is not selected. |
| `apps/web/lib/public-service-adapter.ts` | Go-only selected public read adapter and Go-backed current-user/session boundary | VERIFIED | Selected public route set maps to Go; `getCurrentPublicReadUser()` uses account session boundary, not direct persistence. |
| `apps/web/app/matches/server.ts` | Public replay metadata/evidence split with explicit private Chronicle owner-debug path | VERIFIED | Public selected mode uses Go clients; persisted Chronicle is outside selected public branch and remains owner-debug/test/deferred. |
| `.planning/artifacts/v1.16-selected-go-route-manifest.json` | Machine-readable selected route manifest | VERIFIED | `schemaVersion=v1.16-selected-go-route-manifest`; 17 routes cover health, auth/session, revisions/source/save, forks, exhibitions, public reads, replay metadata, and replay evidence. |
| `scripts/check-boundary-monitors.ts` | Manifest, selected adapter import, no-fallback, and route drift checks | VERIFIED | `pnpm boundary:monitors` passed and reports 17 selected Go routes checked. |
| `scripts/check-local-topology.ts` | Strict selected-route page-smoke requirements | VERIFIED | `--require-v1-16-selected-go-pages` live run passed: 7 selected Go pages loaded with replay board realism checked. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `apps/web/app/api/auth/sign-in/route.ts` | Go backend client | `requireSelectedGoBackendClient("auth/session").createSession` | WIRED | Route forwards Go auth body and Set-Cookie. |
| `apps/web/app/api/account/revisions/[revisionId]/source/route.ts` | Go backend client | `getStrategyRevisionSource` | WIRED | Owner source response is `text/plain` with `cache-control: private, no-store`. |
| `apps/web/app/api/exhibitions/route.ts` | Go backend client | `createMatchSet` | WIRED | POST uses account session id and Go client. |
| `apps/web/lib/public-service-adapter.ts` | public Go read client | selected public route IDs require `PublicGoReadClient` | WIRED | Missing Go URL fails closed for selected public route IDs. |
| `apps/web/app/matches/server.ts` | public Go read client | selected replay metadata/evidence branches | WIRED | Public selected branch precedes Chronicle store access. |
| `scripts/check-boundary-monitors.ts` | selected route manifest artifact | manifest validation | WIRED | Boundary monitor validates schema/version, route coverage, live Go registration, privacy denylist, and drift. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| Account/session routes | auth session and revisions | `GoBackendServiceClient` -> `/auth/session`, `/account/strategy-revisions` | Yes, schema-validated Go responses | FLOWING |
| Exhibition route | MatchSet creation DTO | `GoBackendServiceClient.createMatchSet` -> `POST /matchsets` | Yes, Go queued MatchSet DTO | FLOWING |
| Public read service | public page DTOs | `PublicGoReadClient` -> Go public routes | Yes, schema-validated public DTOs with leak checks | FLOWING |
| Public replay page | replay evidence projection | `PublicGoReadClient.getPublicReplayEvidence` -> Go public evidence | Yes, live topology returned 93930 public-safe bytes and replay board realism passed | FLOWING |
| Account/exhibition pages | revision list outage state | `listAccountReadRevisions()` errors classified by `isGoBackendServiceUnavailableError` | Yes, failed revision reads render unavailable state instead of empty revisions | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Focused Phase 105 behavior tests | `pnpm exec vitest run tests/phase-105-selected-go-route-behavior.test.ts apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts apps/web/lib/public-go-read-client.test.ts apps/web/app/matches/server.test.ts scripts/check-boundary-monitors.test.ts scripts/check-local-topology.test.ts` | 7 files, 72 tests passed | PASS |
| Selected route import boundary | `pnpm boundary:imports` | `strict_offenses=0 report_only_offenses=22` | PASS |
| Inventory freshness | `pnpm typescript-backend:inventory:check` | TypeScript backend inventory artifacts are current | PASS |
| Go backend routes | `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` | passed, cached | PASS |
| Full boundary monitors | `pnpm boundary:monitors` | passed; selected manifest reports 17 routes checked | PASS |
| Strict selected Go page smoke | `pnpm topology:check -- --require-web-page-smoke --require-go --require-runtime-service --require-v1-16-selected-go-pages --web-url http://localhost:3000 --go-url http://127.0.0.1:8087 --runtime-service-url http://127.0.0.1:3107 --json` | passed; 11 representative pages, 7 selected Go pages, Go public reads, replay realism, and privacy diagnostics green | PASS |
| Replay visual realism | `PLAYWRIGHT_TEST=1 pnpm exec playwright test --project=desktop replay.visual.spec.ts` | 7 desktop replay visual tests passed | PASS |
| Web typecheck | `pnpm --filter @cowards/web typecheck` | passed | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| WEB-01 | 105-PLAN | Account/session flows call Go-owned contracts without TypeScript persistence or service fallback. | SATISFIED | Account adapter selected mode requires Go; auth route behavior tests passed. |
| WEB-02 | 105-PLAN | Exhibition MatchSet creation calls Go without TypeScript competition fallback. | SATISFIED | Exhibition API route calls Go `createMatchSet`; behavior test passed. |
| WEB-03 | 105-PLAN | Public Strategy/player/ladder/MatchSet/replay metadata/evidence pages use Go reads. | SATISFIED | Public adapter selected route set includes all six public read IDs; strict live topology passed selected page smoke. |
| WEB-04 | 105-PLAN | Selected Next API routes are adapters or explicitly non-normal. | SATISFIED | Selected route grep is clean; boundary monitors classify remaining report-only surfaces as deferred/test/private. |
| WEB-05 | 105-PLAN | `competitive/server.ts` no longer owns selected normal behavior, or remaining code is quarantined. | SATISFIED | Selected route files do not import `competitive/server`; remaining competitive server imports are report-only deferred/admin/ladder/workshop/private replay/test. |
| WEB-06 | 105-PLAN | Account/public adapters cannot silently fall back when Go is selected or required. | SATISFIED | Adapter tests verify no local service construction/calls and missing URL fail-closed behavior. |
| WEB-07 | 105-PLAN | Public replay evidence avoids TypeScript Chronicle reads except owner-debug/test/deferred. | SATISFIED | Replay tests verify selected public evidence uses Go and direct Chronicle store is not called; owner-debug remains explicit. |
| WEB-08 | 105-PLAN | Schema validation, auth/session privacy, owner-source privacy, public DTO privacy, and redacted diagnostics are preserved. | SATISFIED | Go/public clients schema-parse responses, owner source is private/no-store, public client runs `assertPublicServiceDtoLeakSafe`, topology diagnostics passed privacy scan. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `apps/web/lib/account-service-adapter.ts` | 1-2 | Imports persistence/service for non-selected local path | Info | Not a selected-mode fallback: tests prove selected Go mode does not construct/call local service. Remaining TypeScript backend-like code is Phase 106/107 quarantine scope. |
| `apps/web/app/matches/server.ts` | 1-7 | Imports persistence/Chronicle store | Info | Used only after selected public Go branch is bypassed for owner-debug/test/deferred paths; replay tests prove selected public evidence does not call store. |
| `scripts/check-boundary-monitors.ts`, `scripts/check-local-topology.ts` | CLI output lines | `console.log` in CLI scripts | Info | Expected command output, not stub implementation. |

### Human Verification Required

None. Automated route, monitor, live page-load, and replay visual checks passed.

### Gaps Summary

No blocking gaps found. Phase 105 achieves the selected Go-only web/API cutover goal. Remaining TypeScript backend-like surfaces are visible as 22 report-only deferred/admin/ladder/private replay/workshop/test entries and are Phase 106/107 scope, not Phase 105 selected normal fallback.

### Residual Risks

- Live services were already running during verification, so strict topology was independently rerun and passed. Future failures remain possible if the local web, Go backend, or runtime-service processes are stopped, but that is now fail-closed topology behavior rather than hidden TypeScript fallback.
- `apps/web/lib/account-service-adapter.ts` and `apps/web/app/matches/server.ts` still contain non-selected TypeScript service/persistence paths. They are monitored and classified as non-normal; Phase 106/107 must continue quarantine/deferred labeling work.

---

_Verified: 2026-05-24T20:33:02Z_
_Verifier: the agent (gsd-verifier)_
