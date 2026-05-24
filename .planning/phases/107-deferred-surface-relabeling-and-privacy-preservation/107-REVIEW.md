---
phase: 107-deferred-surface-relabeling-and-privacy-preservation
reviewed: 2026-05-24T22:18:06Z
depth: deep
re_review_of_commit: 9c86a392434cc5216267a41643a9f59db7faceab
files_reviewed: 13
files_reviewed_list:
  - .planning/artifacts/v1.16-typescript-backend-inventory.json
  - apps/web/app/matches/[matchId]/replay/page.tsx
  - apps/web/app/matches/[matchId]/replay/owner-debug.ts
  - apps/web/app/matches/[matchId]/replay/owner-debug.test.ts
  - apps/web/app/matches/server.test.ts
  - apps/web/app/matches/server.ts
  - apps/web/app/matches/types.ts
  - apps/web/app/workshop/workshop-client-state.ts
  - apps/web/e2e/workshop-to-replay.spec.ts
  - packages/spec/src/public-output-privacy.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/generate-typescript-surface-labels.ts
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 107: Focused Code Re-review Report

**Reviewed:** 2026-05-24T22:18:06Z
**Depth:** deep
**Commit Reviewed:** `9c86a392434cc5216267a41643a9f59db7faceab`
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Focused re-review of commit `9c86a39` against the three prior findings in `107-REVIEW.md`: owner-debug requester authorization, exact final label inventory path coverage, and shareable artifact/privacy scanning beyond the synthetic `publicOutputExample`.

The exact final label inventory coverage blocker is resolved: `validateV116FinalTypeScriptSurfaceLabels` now builds an inventory path set, rejects non-inventory final rows, rejects missing inventory rows, and has a regression test that swaps a real path for `apps/web/app/not-in-inventory.ts`.

The owner-debug fix is secure in the narrow server-unit path because missing or mismatched `currentRequesterPlayerId` now fails closed. However, the real replay page still never derives or passes a requester identity, so the Workshop owner-debug link path that the product/e2e expects can no longer produce owner-debug data. The privacy monitor also still does not scan every shareable row/markdown field; for example, a forbidden marker in `privacyClass` passes validation.

Validation run during re-review:

- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts apps/web/app/matches/server.test.ts 'apps/web/app/matches/[matchId]/replay/owner-debug.test.ts'` - passed, 42 tests.
- `pnpm typescript-surface-labels:check` - passed.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` - passed, including `surface_labels`.
- Manual negative probe: mutating the in-memory final labels artifact to set `surfaces[0].privacyClass = "DATABASE_URL"` still returned `PASSED`.

## Critical Issues

### CR-01: BLOCKER - Owner-Debug Requester Binding Is Not Wired Into The Real Replay Page

**File:** `apps/web/app/matches/[matchId]/replay/page.tsx:58`

**Issue:** Commit `9c86a39` makes `getMatchReplay` require `options.currentRequesterPlayerId` before owner-debug can be authorized (`apps/web/app/matches/server.ts:177-182`) and passes that value into the authorization resolver (`apps/web/app/matches/server.ts:221-225`). That is a correct fail-closed server guard, but the actual replay page still calls `getMatchReplay` with only `resolveOwnerDebugReplayOptions(resolvedSearchParams)` and focus options. `resolveOwnerDebugReplayOptions` only returns `allowOwnerDebug` and `requestedOwnerPlayerId` (`apps/web/app/matches/[matchId]/replay/owner-debug.ts:37-40`), so the real page path never supplies `currentRequesterPlayerId`.

This means the security issue is avoided by making owner-debug unreachable through the normal persisted replay page rather than by binding it to a real authenticated requester. That breaks the Workshop owner-debug flow that still emits `?ownerDebug=1&ownerPlayerId=player:workshop-local` links (`apps/web/app/workshop/workshop-client-state.ts:170-174`) and whose e2e expects the clicked replay to show the `Owner debug` status (`apps/web/e2e/workshop-to-replay.spec.ts:121-124`).

**Fix:** Derive a trusted requester identity at the page/server boundary, pass it as `currentRequesterPlayerId`, and cover the real page path with tests. Do not derive it from public query params.

```typescript
const ownerOptions = resolveOwnerDebugReplayOptions(resolvedSearchParams)
const currentRequesterPlayerId =
  ownerOptions === undefined
    ? undefined
    : await resolveTrustedReplayRequesterPlayerId({
        matchId: resolvedParams.matchId,
        requestedOwnerPlayerId: ownerOptions.requestedOwnerPlayerId,
      })

const data = await getMatchReplay(resolvedParams.matchId, {
  ...ownerOptions,
  ...(currentRequesterPlayerId ? { currentRequesterPlayerId } : {}),
  focus: resolveReplayFocus(resolvedSearchParams),
})
```

Add an integration/page-level regression that clicks or renders the real Workshop owner-debug replay path and asserts owner data appears only when the trusted requester resolves to the requested owner.

## Warnings

### WR-01: WARNING - Shareable Label Privacy Scan Still Misses Public Artifact Fields

**File:** `scripts/check-boundary-monitors.ts:2061`

**Issue:** The monitor now scans several label row fields with `assertPublicOutputLeakSafe`, but it omits other shareable fields that are rendered into the markdown artifact, including `privacyClass` (`scripts/generate-typescript-surface-labels.ts:674`). During re-review, mutating the in-memory final labels artifact to set `surfaces[0].privacyClass = "DATABASE_URL"` still passed `validateV116FinalTypeScriptSurfaceLabels`.

That leaves a gap in the prior privacy finding: the monitor is no longer limited to synthetic `publicOutputExample`, but it still does not prove the complete shareable JSON/markdown label surface is free of forbidden private markers.

**Fix:** Scan every shareable final-label field that is written to JSON or markdown, with explicit allowlisting only for intentional policy vocabulary. At minimum, include `privacyClass`, `surfaceLabel`, `capabilityGroup`, `publicOutputPrivacy`, and the markdown-rendered row payload, or centralize the scan by building the exact markdown row object and validating it before rendering.

```typescript
assertPublicOutputLeakSafe(
  {
    path: surface.path,
    taxonomyRole: surface.taxonomyRole,
    surfaceLabel: surface.surfaceLabel,
    capabilityGroup: surface.capabilityGroup,
    selectedNormal: surface.selectedNormal,
    privacyClass: surface.privacyClass,
    gate: surface.gate,
    futureMigration: surface.futureMigration,
    monitorStatus: surface.monitorStatus,
    owner: surface.owner,
    reason: surface.reason,
    risk: surface.risk,
    publicOutputPrivacy: surface.publicOutputPrivacy,
    selectedNormalJustification: surface.selectedNormalJustification,
  },
  `${pathValue} shareable label fields`,
)
```

Add a regression test that mutates `privacyClass` or another markdown-rendered field to a forbidden marker and expects validation to throw.

## Resolved Prior Findings

- **CR-02 resolved:** exact final label inventory coverage now compares final paths with inventory paths in both directions and rejects swapped fake paths.

---

_Reviewed: 2026-05-24T22:18:06Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
