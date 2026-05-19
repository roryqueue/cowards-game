---
phase: 13-close-gap-persisted-owner-replay-debug-authorization
reviewed: 2026-05-18
status: passed
previous_review: 13-REVIEW.md
---

# Phase 13 Re-Review

## Result

PASS. The findings from `13-REVIEW.md` are resolved.

## Finding Resolution

| Finding | Resolution |
| --- | --- |
| CR-01: owner debug authorization trusted caller-supplied player identity | Fixed. Default persisted owner authorization is now scoped to local Workshop MatchSets and only authorizes `player:workshop-local` when that player is a persisted participant. Opponent participant ids are no longer enough. |
| WR-01: explicit owner mode bypassed persisted authorization | Fixed. `trustedOwnerReplayOptions` now requires the owner id to appear in the authorized owner list before preserving explicit owner mode. Persisted server tests assert explicit owner mode stays public without authorization. |
| WR-02: Workshop test summary lookup was not scoped to Workshop MatchSets | Fixed. `getWorkshopTestSummary` returns `null` before querying for non-Workshop MatchSet ids; persistence tests cover this. |
| WR-03: runtime failure samples were not executed by tests | Fixed. `workshop.test.ts` now executes every sample with `expectedRuntimeViolationType` and asserts the advertised runtime violation type. |

## Verification

- `pnpm --filter @cowards/web test -- server.test.ts owner-debug.test.ts workshop-client.test.tsx`
- `pnpm --filter @cowards/persistence test -- workshop.test.ts`
- `pnpm --filter @cowards/web typecheck`
- `pnpm e2e:service`
- `git diff --check`
