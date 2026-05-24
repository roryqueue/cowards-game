---
phase: 107-deferred-surface-relabeling-and-privacy-preservation
reviewed: 2026-05-24T22:24:23Z
depth: deep
re_review_of_commits:
  - 9c86a392434cc5216267a41643a9f59db7faceab
  - 1d1f4a810c6ec3abcc1a4b86439db350fc95ccaa
files_reviewed: 14
files_reviewed_list:
  - .planning/artifacts/v1.16-final-typescript-surface-labels.json
  - .planning/artifacts/v1.16-final-typescript-surface-labels.md
  - .planning/artifacts/v1.16-typescript-backend-inventory.json
  - apps/web/app/matches/[matchId]/replay/page.tsx
  - apps/web/app/matches/[matchId]/replay/owner-debug.ts
  - apps/web/app/matches/[matchId]/replay/owner-debug.test.ts
  - apps/web/app/matches/server.test.ts
  - apps/web/app/matches/server.ts
  - apps/web/app/matches/types.ts
  - apps/web/app/workshop/workshop-client-state.ts
  - apps/web/e2e/workshop-to-replay.spec.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/generate-typescript-surface-labels.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 107: Second Focused Code Re-review Report

**Reviewed:** 2026-05-24T22:24:23Z
**Depth:** deep
**Commits Reviewed:** `9c86a392434cc5216267a41643a9f59db7faceab`, `1d1f4a810c6ec3abcc1a4b86439db350fc95ccaa`
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Focused re-review of the two Phase 107 fix commits against the current `107-REVIEW.md` findings.

The owner-debug blocker is resolved. The real replay page still calls `resolveOwnerDebugReplayOptions(resolvedSearchParams)` (`apps/web/app/matches/[matchId]/replay/page.tsx:58-60`), and that resolver now reads the trusted server-side `COWARDS_OWNER_DEBUG_REQUESTER_PLAYER_ID` (`apps/web/app/matches/[matchId]/replay/owner-debug.ts:32-41`). It returns owner-debug options only when the debug env gate is enabled, the public query explicitly requests owner debug, the query owner id matches the server-side requester id, and `getMatchReplay` then rechecks `allowOwnerDebug`, the owner-debug env gate, requester presence, and requester/owner equality before bypassing public replay evidence (`apps/web/app/matches/server.ts:177-183`). The previous public-query-only requester path is gone; mismatched or missing requester identity fails closed to normal public replay behavior.

The exact final-label inventory path coverage remains resolved. `validateV116FinalTypeScriptSurfaceLabels` builds a source inventory path set, rejects any final label path not present in that inventory, rejects duplicate final paths, checks final row count, and checks that every inventory path is represented (`scripts/check-boundary-monitors.ts:1917-1925`, `scripts/check-boundary-monitors.ts:1973-1990`, `scripts/check-boundary-monitors.ts:2088-2091`). Manual probes confirmed fake paths and dropped inventory coverage throw.

The shareable label privacy scan is improved but still incomplete. It now scans `surfaceLabel`, `capabilityGroup`, `owner`, `reason`, `risk`, `privacyClass`, `gate`, `futureMigration`, `monitorStatus`, and `selectedNormalJustification` (`scripts/check-boundary-monitors.ts:2063-2078`), so the specifically rechecked `privacyClass`, `gate`, and `reason` leaks are covered. However, not every markdown-rendered/shareable field is scanned; a forbidden marker in a non-selected row's markdown-rendered `taxonomyRole` still passes validation, and JSON-shareable `publicOutputPrivacy` also passes.

Validation run during re-review:

- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts apps/web/app/matches/server.test.ts 'apps/web/app/matches/[matchId]/replay/owner-debug.test.ts'` - passed, 43 tests.
- `pnpm typescript-surface-labels:check` - passed.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` - passed, including `surface_labels`.
- Manual negative probes:
  - `fake-path` threw `final label path apps/web/app/not-in-inventory.ts is not in source inventory`.
  - `missing-path-via-drop` threw `source inventory count drifted`.
  - `reason-leak`, `privacyClass-leak`, and `gate-leak` all threw `public output/shareable label leak`.
  - `taxonomyRole-leak` on a non-selected row returned `PASSED`.
  - `publicOutputPrivacy-leak` returned `PASSED`.

## Warnings

### WR-01: WARNING - Shareable Label Privacy Scan Still Misses Rendered And JSON Fields

**File:** `scripts/check-boundary-monitors.ts:2064`

**Issue:** Commit `1d1f4a8` fixes the concrete `privacyClass` gap from the prior re-review and also covers `gate` and `reason`, but the monitor still does not scan every shareable final-label field written to the JSON or markdown artifacts. `renderFinalTypeScriptSurfaceLabelsMarkdown` renders `taxonomyRole` into the markdown table (`scripts/generate-typescript-surface-labels.ts:674`), but `validateV116FinalTypeScriptSurfaceLabels` omits `taxonomyRole` from the `assertPublicOutputLeakSafe` payload (`scripts/check-boundary-monitors.ts:2064-2078`). A manual probe changing a non-selected row's `taxonomyRole` to `DATABASE_URL` passed validation. The same probe against JSON-shareable `publicOutputPrivacy` also passed.

This leaves the prior privacy finding partially open: the monitor now proves the named fields `privacyClass`, `gate`, and `reason` are safe, but it still does not prove the complete shareable JSON/markdown label surface is free of forbidden private markers.

**Fix:** Scan the exact row object used for shareable JSON/markdown output, with explicit exclusions only for non-string booleans and tightly enumerated policy fields. At minimum, add `path`, `taxonomyRole`, and `publicOutputPrivacy` to the public-output leak check, and add regression tests for a non-selected-row `taxonomyRole` leak and a `publicOutputPrivacy` leak.

```typescript
assertPublicOutputLeakSafe(
  {
    path: surface.path,
    taxonomyRole: surface.taxonomyRole,
    surfaceLabel: surface.surfaceLabel,
    capabilityGroup: surface.capabilityGroup,
    owner: surface.owner,
    reason: surface.reason,
    risk: surface.risk,
    privacyClass: surface.privacyClass,
    gate: surface.gate,
    futureMigration: surface.futureMigration,
    monitorStatus: surface.monitorStatus,
    publicOutputPrivacy: surface.publicOutputPrivacy,
    selectedNormalJustification: surface.selectedNormalJustification,
  },
  `${pathValue} shareable label fields`,
)
```

## Resolved Prior Findings

- **CR-01 resolved:** the real replay page now receives owner-debug requester identity from server-side `COWARDS_OWNER_DEBUG_REQUESTER_PLAYER_ID`; no public query parameter can supply `currentRequesterPlayerId`, missing/mismatched requester identity fails closed, and owner-debug remains behind the debug env/query gate plus persisted owner authorization.
- **CR-02 remains resolved:** exact final-label inventory path coverage rejects fake final paths and missing inventory paths.
- **WR-01 partially resolved:** `privacyClass`, `gate`, and `reason` are now scanned, but the warning remains because not all rendered/shareable label fields are covered.

---

_Reviewed: 2026-05-24T22:24:23Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
