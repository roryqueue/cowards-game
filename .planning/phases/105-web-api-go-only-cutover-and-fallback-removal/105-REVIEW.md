---
phase: 105-web-api-go-only-cutover-and-fallback-removal
reviewed: 2026-05-24T19:44:45Z
depth: standard
re_review_of: a76d9a151b305feefe0e373b6d2df97a9811ce63
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

# Phase 105: Code Review Re-review Report

**Reviewed:** 2026-05-24T19:44:45Z
**Depth:** standard
**Fix Commit:** `a76d9a151b305feefe0e373b6d2df97a9811ce63`
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Re-reviewed Phase 105 after fix commit `a76d9a1`. The two prior blockers are resolved: `COWARDS_NO_TYPESCRIPT_BACKEND=1` now selects Go ownership for account/public reads and replay evidence, and the legacy strategy-only public flag no longer routes unrelated public read methods through Go. The classified health failure warning is also resolved.

Two warnings remain. The route manifest monitor still does not prove selected Next routes import the intended Go/public replay boundaries, and replay realism smoke still validates only DTO evidence/Soldier bounds rather than rendered replay board realism, terrain bounds, or canonical starts.

## Resolved Prior Findings

- **CR-01 resolved:** `apps/web/lib/account-service-adapter.ts` now treats `COWARDS_NO_TYPESCRIPT_BACKEND=1` as strict selected Go mode for auth/session, account revisions, forks, and exhibitions. `apps/web/lib/public-service-adapter.ts` and `apps/web/app/matches/server.ts` now include strict no-TypeScript mode in public replay selection, with tests covering fail-closed behavior without Chronicle reads.
- **CR-02 resolved:** `apps/web/lib/public-service-adapter.ts` now checks `selectedRoutes` before dispatching public read methods. The strategy-only switch calls only `getPublicStrategyPage`; unrelated public read methods reject before hitting the Go client.
- **WR-01 resolved:** `/api/service/health` now classifies missing URL, stopped Go, and non-JSON Go health failures as redacted 503 responses, with focused tests.

## Warnings

### WR-01: WARNING - Manifest drift monitor still does not verify selected routes use the intended adapter boundary

**File:** `scripts/check-boundary-monitors.ts:862`

**Issue:** The fix adds Next route/page existence checks and forbidden-import checks for API routes, but it still does not require the expected Go/public boundary token for each selected route. Non-API public pages only need to exist, and API routes can pass as long as they avoid forbidden imports. A selected Next route could be reverted to a placeholder, wrong boundary, or stale non-Go implementation without tripping `validateSelectedGoRouteManifest()`.

**Fix:** Add per-route expected boundary assertions after resolving `nextFile`. For example, require account/auth/exhibition API routes to contain `requireSelectedGoBackendClient` or the account boundary, public page/API routes to contain `public-service-boundary`, and replay pages to contain `getMatchReplay`/`apps/web/app/matches/server` as appropriate. Add negative tests that mutate a manifest route to an existing but wrong file and that mock a selected file without its expected boundary token.

### WR-02: WARNING - Replay page smoke still does not cover rendered board realism

**File:** `scripts/check-local-topology.ts:450`

**Issue:** `checkPublicReplayEvidenceRealism()` validates the public replay evidence schema, first snapshot bounds, and visible Soldier positions, but it does not verify terrain positions, canonical arena starts, or the rendered replay board/page. The v1.16 page smoke at `scripts/check-local-topology.ts:1225` still fetches replay HTML by static text markers and separately checks the Go evidence endpoint, so a clipped/off-screen or incorrectly rendered replay board can pass.

**Fix:** Extend the strict selected Go smoke to assert the replay projection and rendered page together. At minimum, check terrain coordinates inside declared bounds, canonical arena starting Soldier positions for the golden replay, and rendered board evidence from the replay page rather than only HTML text. Prefer a browser/rendered assertion or a stable server-rendered board marker that proves cells/pieces are in bounds.

## Verification

- `pnpm exec vitest run apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts apps/web/app/api/service/health/route.test.ts apps/web/app/matches/server.test.ts scripts/check-boundary-monitors.test.ts scripts/check-local-topology.test.ts` passed: 6 files, 61 tests.
- `pnpm boundary:monitors` passed.

---

_Reviewed: 2026-05-24T19:44:45Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
