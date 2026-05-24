---
phase: 105-web-api-go-only-cutover-and-fallback-removal
reviewed: 2026-05-24T19:54:51Z
depth: standard
re_review_of:
  - a76d9a151b305feefe0e373b6d2df97a9811ce63
  - 36e6d3ddd9dac940f24b720e2e3d0f2f015fce6e
files_reviewed: 13
files_reviewed_list:
  - apps/web/app/api/service/health/route.test.ts
  - apps/web/app/api/service/health/route.ts
  - apps/web/app/matches/server.test.ts
  - apps/web/app/matches/server.ts
  - apps/web/lib/account-service-adapter.test.ts
  - apps/web/lib/account-service-adapter.ts
  - apps/web/lib/public-service-adapter.test.ts
  - apps/web/lib/public-service-adapter.ts
  - apps/web/lib/public-service-boundary.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/check-local-topology.test.ts
  - scripts/check-local-topology.ts
findings:
  critical: 0
  warning: 2
  info: 0
  total: 2
status: issues_found
---

# Phase 105: Final Code Review Re-review Report

**Reviewed:** 2026-05-24T19:54:51Z
**Depth:** standard
**Fix Commits:** `a76d9a151b305feefe0e373b6d2df97a9811ce63`, `36e6d3ddd9dac940f24b720e2e3d0f2f015fce6e`
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Final re-review after commits `a76d9a1` and `36e6d3d`. The prior blockers are resolved: strict no-TypeScript-backend mode now selects Go for the Phase 105 account/public replay surfaces, and the old public Strategy-only flag is constrained to the Strategy route instead of accidentally routing unrelated public reads. The prior health failure classification warning is also resolved.

Commit `36e6d3d` resolves the main selected-route boundary-token warning for the current v1.16 selected route set, and it adds replay evidence checks for canonical starts plus terrain bounds. Two warning-level issues remain in the monitors: the route-token validator can still accept an unexpected selected route without a boundary-token contract, and the replay page smoke still does not prove the rendered replay board itself is plausible.

## Resolved Prior Findings

- **CR-01 resolved:** `COWARDS_NO_TYPESCRIPT_BACKEND=1` now fails closed through Go-selected account/session, revision, fork, exhibition, and public replay paths. The focused adapter and replay tests cover missing Go URL behavior without TypeScript Chronicle fallback.
- **CR-02 resolved:** `COWARDS_GO_PUBLIC_STRATEGY_READS=1` no longer enables unrelated public reads. `createPublicReadService()` checks route-specific ownership before dispatching to the Go client.
- **WR-01 resolved:** `/api/service/health` now classifies missing URL, stopped Go, and non-JSON Go health failures as redacted 503 responses.
- **Prior selected-route monitor warning mostly resolved:** current selected routes now require route-specific boundary tokens, and `createStrategyRevision` now points at the write route `/api/account/revisions/save`.
- **Prior replay evidence warning partially resolved:** strict selected-Go smoke now validates 16 canonical Soldiers, 8 per side, canonical facing/status/positions, and terrain coordinates inside board bounds.

## Warnings

### WR-01: WARNING - Route boundary-token validator accepts unexpected selected route IDs without a token contract

**File:** `scripts/check-boundary-monitors.ts:927`

**Issue:** `validateSelectedGoRouteManifest()` verifies all required route IDs are present, but it does not reject route IDs outside that required set. For an unexpected route ID, `selectedGoRouteBoundaryTokens()` falls through to `[]`, so the new boundary-token assertion silently becomes a no-op. A future manifest edit could add a selected route that has a live Go route and an existing Next route/page while skipping the intended boundary-token proof.

**Fix:** Fail closed for unexpected route IDs and remove the empty-token default. For example:

```ts
if (routeIds.size !== requiredRouteIds.size) {
  throw new Error("v1.16 selected Go route manifest has unexpected route ids")
}

const selectedGoRouteBoundaryTokens = (routeId: string): readonly string[] => {
  switch (routeId) {
    // existing cases
    default:
      throw new Error(`${routeId} has no selected Go boundary token contract`)
  }
}
```

Add a negative test that appends a new route ID using an existing selected Next path and proves validation fails before accepting the manifest.

### WR-02: WARNING - Replay smoke still does not prove the rendered replay board is plausible

**File:** `scripts/check-local-topology.ts:1276`

**Issue:** The v1.16 selected-Go page smoke still fetches replay HTML by text markers through `checkWebPageLoads()` and then validates the Go evidence endpoint separately. The new evidence checks cover terrain bounds and canonical starts, but a broken replay-page render, client board projection, CSS sizing issue, or off-screen Pixi board can still pass this smoke because no rendered board evidence is inspected.

**Fix:** Extend the strict selected-Go replay smoke to validate the page-rendered board, not only the DTO. Use a browser-rendered assertion or a stable server/client test hook that proves the replay board rendered cells, Soldier pieces, and terrain inside the declared board bounds for the golden Match start.

## Verification

- `pnpm exec vitest run apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts apps/web/app/api/service/health/route.test.ts apps/web/app/matches/server.test.ts scripts/check-boundary-monitors.test.ts scripts/check-local-topology.test.ts` passed: 6 files, 61 tests.
- `pnpm boundary:monitors` passed.

---

_Reviewed: 2026-05-24T19:54:51Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
