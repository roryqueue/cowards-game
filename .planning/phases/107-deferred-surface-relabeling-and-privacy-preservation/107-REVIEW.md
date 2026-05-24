---
phase: 107-deferred-surface-relabeling-and-privacy-preservation
reviewed: 2026-05-24T22:09:39Z
depth: deep
files_reviewed: 21
files_reviewed_list:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/STATE.md
  - .planning/artifacts/v1.16-final-typescript-surface-labels.json
  - .planning/artifacts/v1.16-final-typescript-surface-labels.md
  - .planning/artifacts/v1.16-typescript-backend-inventory.json
  - .planning/artifacts/v1.16-typescript-backend-inventory.md
  - .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-SUMMARY.md
  - .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-VALIDATION.md
  - apps/web/app/api/test-support/replay-fixture/route.test.ts
  - apps/web/app/api/test-support/replay-fixture/route.ts
  - apps/web/app/api/test-support/run-worker-once/route.test.ts
  - apps/web/app/api/test-support/run-worker-once/route.ts
  - apps/web/app/matches/replay-fixture.ts
  - apps/web/app/matches/server.test.ts
  - apps/web/app/matches/server.ts
  - package.json
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/generate-typescript-surface-labels.test.ts
  - scripts/generate-typescript-surface-labels.ts
findings:
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
---

# Phase 107: Code Review Report

**Reviewed:** 2026-05-24T22:09:39Z
**Depth:** deep
**Files Reviewed:** 21
**Status:** issues_found

## Summary

Reviewed commits `da2a266..050bd52` against `107-PLAN.md` and DEF-01 through DEF-06, focusing on owner-debug privacy, test-support/fixture gating, public-output scanning, monitor drift, selected Go public replay ownership, accidental Workshop/ladder/governance migration, and planning status.

Selected Go public replay remains the normal path when owner-debug is not explicitly enabled, and fixture/test-support routes are no longer enabled by development mode alone. However, two ship-blocking gaps remain: owner-debug authorization does not bind to the real requester, and the boundary monitor does not prove the final labels cover the exact inventory path set. Planning completion claims are therefore premature until these blockers are fixed.

Validation run during review:

- `pnpm exec vitest run scripts/generate-typescript-surface-labels.test.ts scripts/check-boundary-monitors.test.ts 'apps/web/app/matches/[matchId]/replay/owner-debug.test.ts' apps/web/app/matches/server.test.ts apps/web/app/api/test-support/run-worker-once/route.test.ts apps/web/app/api/test-support/replay-fixture/route.test.ts` - passed, 51 tests.
- `pnpm typescript-surface-labels:check` - passed.

## Critical Issues

### CR-01: BLOCKER - Owner-Debug Replay Authorization Is Not Bound To The Requesting Owner

**File:** `apps/web/app/matches/[matchId]/replay/page.tsx:58`

**Issue:** `resolveOwnerDebugReplayOptions` turns public query params into `allowOwnerDebug` options, but the replay page never supplies an authenticated current player. The server then calls the authorization resolver with `currentPlayerId: WORKSHOP_PLAYER_ID` hardcoded at `apps/web/app/matches/server.ts:223`. The default resolver authorizes when that hardcoded id matches `requestedOwnerPlayerId` and the Match belongs to a workshop MatchSet (`apps/web/app/matches/server.ts:96`). In any environment with `COWARDS_ENABLE_OWNER_DEBUG_REPLAY=1`, a public requester can use `?ownerDebug=1&ownerPlayerId=player:workshop-local` for an eligible workshop Match and receive owner/private replay data without proving they are that owner.

This violates DEF-03 and DEF-05. The planning files also mark DEF-03 complete (`.planning/REQUIREMENTS.md:53`) and state that owner-debug is "owner-authorized" (`.planning/STATE.md:130`), which is not accurate while requester identity is not checked.

**Fix:**

Require a real authenticated/local owner identity before owner-debug can be resolved, and make the default path fail closed when no current owner is available.

```typescript
type ResolveAuthorizedReplayOwners = (input: {
  pool: Queryable
  matchId: MatchId
  requestedOwnerPlayerId: PlayerId
  currentPlayerId: PlayerId
}) => Promise<readonly PlayerId[]>

// Page/server boundary should pass the authenticated current owner, not a constant.
if (!options.currentPlayerId || options.currentPlayerId !== options.requestedOwnerPlayerId) {
  return []
}
```

Add route/page tests that exercise the real `resolveOwnerDebugReplayOptions -> getMatchReplay` path without an authenticated owner and assert that owner-private fields are not returned even when `COWARDS_ENABLE_OWNER_DEBUG_REPLAY=1`.

### CR-02: BLOCKER - Surface Label Monitor Does Not Verify Exact Inventory Coverage

**File:** `scripts/check-boundary-monitors.ts:1913`

**Issue:** `validateV116FinalTypeScriptSurfaceLabels` reads the source inventory, but only checks `sourceInventorySurfaceCount` and final row count (`scripts/check-boundary-monitors.ts:1913-1921`, `1963-1965`). It tracks duplicates in the final artifact (`1966-1978`) but never compares the final label path set to the inventory path set. During review, replacing one committed label path with `apps/web/app/fake-uninventoried-surface.ts` still returned `185 final TypeScript surface labels checked`.

That means the `surface_labels` lane can pass while omitting an actual inventory surface, so it cannot prove DEF-06 coverage and can mask an unsafe or newly drifted TypeScript backend-like surface.

**Fix:**

Build an inventory path set and require exact equality.

```typescript
const inventoryPaths = new Set(
  inventory.surfaces.map((item) => requireRecord(item, "inventory surface").path),
)

for (const inventoryPath of inventoryPaths) {
  if (!seen.has(inventoryPath)) {
    throw new Error(`final labels missing inventory surface ${inventoryPath}`)
  }
}
for (const finalPath of seen) {
  if (!inventoryPaths.has(finalPath)) {
    throw new Error(`final labels include non-inventory surface ${finalPath}`)
  }
}
```

Add a monitor regression test that replaces one real path with a fake unique path and expects validation to throw.

## Warnings

### WR-01: WARNING - Public-Output Privacy Monitor Only Checks Synthetic Examples

**File:** `scripts/check-boundary-monitors.ts:2047`

**Issue:** The Phase 107 monitor calls `assertMonitorPublicPayload(surface.publicOutputExample ?? {})`, but `publicOutputExample` is generated as a tiny synthetic object containing only path, role, label, group, selectedNormal, and noPublicFallback (`scripts/generate-typescript-surface-labels.ts:472-482`). The validator does not scan the committed label row fields, markdown output, route response samples, or other default/public artifacts for forbidden private markers. A private marker in `reason`, `risk`, `gate`, `futureMigration`, or generated markdown would not be caught by this monitor lane.

This weakens the DEF-05 privacy evidence and does not satisfy the plan's requirement that monitor privacy checks reject public/default examples or artifacts containing Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner-debug data, raw Awareness Grid, stack/stderr, session/token, DB DSN, host path, or private runtime internals.

**Fix:** Define an allowlisted privacy scan for public/default artifact fields and actual public route fixtures. Keep intentionally named policy fields such as `publicOutputForbiddenMarkers` out of the scan, but scan generated row metadata and markdown text that are meant to be shareable evidence.

---

_Reviewed: 2026-05-24T22:09:39Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
