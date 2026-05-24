---
phase: 107-deferred-surface-relabeling-and-privacy-preservation
reviewed: 2026-05-24T22:28:55Z
depth: deep
re_review_of_commits:
  - 9c86a392434cc5216267a41643a9f59db7faceab
  - 1d1f4a810c6ec3abcc1a4b86439db350fc95ccaa
  - 74e121700c09df1350eb67076da53448a35131ec
files_reviewed: 11
files_reviewed_list:
  - .planning/artifacts/v1.16-final-typescript-surface-labels.json
  - .planning/artifacts/v1.16-final-typescript-surface-labels.md
  - .planning/artifacts/v1.16-typescript-backend-inventory.json
  - apps/web/app/matches/[matchId]/replay/page.tsx
  - apps/web/app/matches/[matchId]/replay/owner-debug.ts
  - apps/web/app/matches/[matchId]/replay/owner-debug.test.ts
  - apps/web/app/matches/server.test.ts
  - apps/web/app/matches/server.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/generate-typescript-surface-labels.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 107: Final Focused Code Re-review Report

**Reviewed:** 2026-05-24T22:28:55Z
**Depth:** deep
**Commits Reviewed:** `9c86a392434cc5216267a41643a9f59db7faceab`, `1d1f4a810c6ec3abcc1a4b86439db350fc95ccaa`, `74e121700c09df1350eb67076da53448a35131ec`
**Files Reviewed:** 11
**Status:** clean

## Summary

Focused final re-review of the remaining Phase 107 warning after commit `74e1217`, plus re-confirmation that the prior owner-debug and inventory coverage blockers remain resolved.

All reviewed files meet quality standards. No issues found.

## Verification Notes

The remaining shareable-label privacy warning is resolved. `validateV116FinalTypeScriptSurfaceLabels` now scans both `taxonomyRole` and `publicOutputPrivacy` in the shareable label payload passed to `assertPublicOutputLeakSafe` (`scripts/check-boundary-monitors.ts:2064-2079`). The regression tests mutate both fields to `DATABASE_URL` and require validation failure (`scripts/check-boundary-monitors.test.ts:585-613`). `taxonomyRole` remains markdown-rendered by `renderFinalTypeScriptSurfaceLabelsMarkdown` (`scripts/generate-typescript-surface-labels.ts:671-705`), while `publicOutputPrivacy` remains JSON-shareable because the JSON artifact renderer serializes the full final label artifact (`scripts/generate-typescript-surface-labels.ts:709-711`).

Manual negative probes confirmed the privacy and inventory monitors fail closed:

- `taxonomyRole` leak: failed with `shareable label fields leaks private marker at $.taxonomyRole`.
- `publicOutputPrivacy` leak: failed with `shareable label fields leaks private marker at $.publicOutputPrivacy`.
- Fake final label path: failed with `final label path apps/web/app/not-in-inventory.ts is not in source inventory`.
- Dropped inventory coverage: failed with `source inventory count drifted`.

The owner-debug blocker remains resolved. The replay page calls `resolveOwnerDebugReplayOptions(resolvedSearchParams)` without accepting requester identity from public query parameters (`apps/web/app/matches/[matchId]/replay/page.tsx:58-60`). The resolver only uses `COWARDS_OWNER_DEBUG_REQUESTER_PLAYER_ID` as the trusted requester identity and requires it to match the requested owner id (`apps/web/app/matches/[matchId]/replay/owner-debug.ts:32-41`). `getMatchReplay` independently requires `allowOwnerDebug`, the owner-debug env gate, a requester identity, and requested-owner/requester equality before bypassing selected public replay evidence (`apps/web/app/matches/server.ts:177-183`), then checks persisted owner authorization before building owner replay data (`apps/web/app/matches/server.ts:217-233`). Tests cover missing requester and requester mismatch as public-only behavior (`apps/web/app/matches/server.test.ts:769-818`).

The exact inventory path coverage blocker remains resolved. The final-label validator builds a source inventory path set, rejects final label paths missing from that inventory, rejects duplicate paths, checks row-count drift, and verifies every inventory path is represented (`scripts/check-boundary-monitors.ts:1914-1932`, `scripts/check-boundary-monitors.ts:1973-1990`, `scripts/check-boundary-monitors.ts:2090-2093`).

Validation run during final re-review:

- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts apps/web/app/matches/server.test.ts 'apps/web/app/matches/[matchId]/replay/owner-debug.test.ts'` - passed, 43 tests.
- `pnpm typescript-surface-labels:check` - passed.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` - passed, including `surface_labels`.

---

_Reviewed: 2026-05-24T22:28:55Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
