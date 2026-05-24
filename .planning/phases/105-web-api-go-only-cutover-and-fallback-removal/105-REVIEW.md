---
phase: 105-web-api-go-only-cutover-and-fallback-removal
reviewed: 2026-05-24T19:31:52Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - .planning/artifacts/v1.16-selected-go-route-manifest.json
  - .planning/artifacts/v1.16-selected-go-route-manifest.md
  - apps/go-backend/live_backend.go
  - apps/go-backend/main_test.go
  - apps/web/app/api/account/advanced-forks/route.ts
  - apps/web/app/api/account/revisions/[revisionId]/source/route.ts
  - apps/web/app/api/account/revisions/route.ts
  - apps/web/app/api/account/starter-forks/route.ts
  - apps/web/app/api/auth/session/route.ts
  - apps/web/app/api/auth/sign-in/route.ts
  - apps/web/app/api/auth/sign-out/route.ts
  - apps/web/app/api/auth/sign-up/route.ts
  - apps/web/app/api/exhibitions/route.ts
  - apps/web/app/api/replays/[matchId]/metadata/route.ts
  - apps/web/app/api/service/health/route.ts
  - apps/web/app/matches/server.test.ts
  - apps/web/app/matches/server.ts
  - apps/web/lib/account-revision-write-boundary.ts
  - apps/web/lib/account-service-adapter.test.ts
  - apps/web/lib/account-service-adapter.ts
  - apps/web/lib/account-service-boundary.ts
  - apps/web/lib/go-backend-service-client.ts
  - apps/web/lib/public-go-read-client.ts
  - apps/web/lib/public-service-adapter.test.ts
  - apps/web/lib/public-service-adapter.ts
  - apps/web/lib/public-service-boundary.ts
  - scripts/check-boundary-monitors.ts
  - scripts/check-local-topology.ts
findings:
  critical: 2
  warning: 3
  info: 0
  total: 5
status: issues_found
---

# Phase 105: Code Review Report

**Reviewed:** 2026-05-24T19:31:52Z
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Reviewed Phase 105 commits `997098e..2397324` on top of `cef207e`, with emphasis on Go-only selected-route behavior, fallback removal, privacy, cookie handling, manifest drift, and page-smoke realism. The main cutover removes many selected API imports correctly, but strict no-TypeScript mode and route-scoped public ownership are inconsistent enough to allow silent TypeScript fallback or accidental broader public-read migration.

## Critical Issues

### CR-01: BLOCKER - Strict no-TypeScript mode still falls back to TypeScript account and replay backends

**File:** `apps/web/lib/account-service-adapter.ts:34`

**Issue:** `/api/service/health` treats `COWARDS_NO_TYPESCRIPT_BACKEND=1` as strict Go mode, but the account and public ownership predicates do not. With `COWARDS_NO_TYPESCRIPT_BACKEND=1` and `COWARDS_GO_BACKEND_URL` set, `/api/auth/session` and `/api/account/revisions` still call `createCowardsLocalService()` unless `COWARDS_GO_BACKEND_OWNER=go` or route-specific flags are also set. `apps/web/app/matches/server.ts:122` has the same gap for public replay metadata/evidence, so strict no-TypeScript mode can still read the private Chronicle store for public replay.

**Fix:**
```typescript
export interface GoBackendOwnershipEnv {
  COWARDS_NO_TYPESCRIPT_BACKEND?: string | undefined
}

const isStrictNoTypescriptBackend = (env: GoBackendOwnershipEnv): boolean =>
  env.COWARDS_NO_TYPESCRIPT_BACKEND === "1"

export const isGoAuthSessionSelected = (env = process.env): boolean =>
  isStrictNoTypescriptBackend(env) ||
  env.COWARDS_GO_BACKEND_OWNER === "go" ||
  env.COWARDS_GO_AUTH_SESSION === "1"

export const isGoAccountRevisionsSelected = (env = process.env): boolean =>
  isStrictNoTypescriptBackend(env) ||
  env.COWARDS_GO_BACKEND_OWNER === "go" ||
  env.COWARDS_GO_ACCOUNT_REVISIONS === "1"
```

Apply the same strict predicate to public read ownership, replay metadata/evidence selection, forks, and exhibitions. Add tests that `COWARDS_NO_TYPESCRIPT_BACKEND=1` rejects missing Go URL and never constructs local service or Chronicle store.

### CR-02: BLOCKER - Strategy-only public read flag migrates every public read route to Go

**File:** `apps/web/lib/public-service-adapter.ts:72`

**Issue:** `resolvePublicReadRouteOwnership()` says `COWARDS_GO_PUBLIC_STRATEGY_READS=1` selects only `getPublicStrategyPage`, but `createPublicReadService()` ignores `selectedRoutes` and routes player, ladder, MatchSet, and replay metadata reads to Go as well. The test at `apps/web/lib/public-service-adapter.test.ts:101` locks in the accidental broad migration. This violates the Phase 105 scope guard against accidental broader ladder/public migration and makes a legacy strategy-only rollout flag change unrelated pages.

**Fix:**
```typescript
const ownership = resolvePublicReadRouteOwnership(env)
const selected = (routeId: PublicReadRouteId) =>
  ownership.selectedRoutes.includes(routeId)

async getPublicLadderSeason(seasonId) {
  if (!selected("getPublicLadderSeason")) {
    return explicitNonNormalPublicReadFallback.getPublicLadderSeason(seasonId)
  }
  return requireGoClient("getPublicLadderSeason", selectedGoClient)
    .getPublicLadderSeason(seasonId)
}
```

Alternatively remove the strategy-only flag entirely and make `COWARDS_GO_PUBLIC_READS=1` or `COWARDS_GO_BACKEND_OWNER=go` the only public-read cutover switches. Update the route-scoped test so non-selected public routes cannot be reached through the strategy-only flag.

## Warnings

### WR-01: WARNING - Stopped-Go health proxy errors are unclassified

**File:** `apps/web/app/api/service/health/route.ts:13`

**Issue:** The selected manifest declares health stopped-Go behavior as `fail_closed_classified`, but the health route directly awaits `fetch()` and `response.json()` without a `try/catch`. If Go is stopped or returns non-JSON, the route throws through Next.js instead of returning a redacted classified 503 body.

**Fix:** Wrap the proxy fetch and JSON parse in a catch that returns a stable public response, for example `{ ok: false, service: "go-backend", error: "go_backend_unavailable" }` with status 503. Add stopped-Go and non-JSON tests for strict Go/no-TypeScript health mode.

### WR-02: WARNING - Selected route manifest validation does not validate Next path drift

**File:** `scripts/check-boundary-monitors.ts:858`

**Issue:** `validateSelectedGoRouteManifest()` validates Go `mux.HandleFunc` registrations, but it never verifies that each `nextPath` in `.planning/artifacts/v1.16-selected-go-route-manifest.json:16` maps to an existing Next route/page or still imports the intended Go adapter boundary. A stale `nextPath` or reverted Next adapter can pass the manifest check.

**Fix:** Convert each manifest `nextPath` to its expected App Router file path (`app/api/.../route.ts`, `app/.../page.tsx`, or the replay server boundary) and assert it exists. For selected API adapters, also assert no forbidden imports and require the expected Go/public-service boundary token.

### WR-03: WARNING - v1.16 page smoke does not check replay board realism

**File:** `scripts/check-local-topology.ts:421`

**Issue:** The new v1.16 selected Go page smoke fetches HTML and checks text only. It does not validate visible Soldier/terrain coordinates, board bounds, canonical starting positions, or that the replay board is actually plausible and unclipped. That misses the project-required replay/Match creation realism checks for this phase's replay and exhibition cutover.

**Fix:** Extend the strict selected Go smoke with a browser/rendered replay assertion or a shared replay DTO realism check. At minimum, for the public replay target, verify projected board dimensions, all visible Soldier and terrain positions are within declared bounds, canonical arena starts are present, and the rendered board contains in-bounds cells/pieces rather than only matching static text.

---

_Reviewed: 2026-05-24T19:31:52Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
