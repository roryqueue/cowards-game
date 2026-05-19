# Phase 13 Summary

**Phase:** Close Gap: Persisted Owner Replay Debug Authorization  
**Completed:** 2026-05-18  
**Status:** complete

## Delivered

- Persisted replay server now authorizes owner-debug requests against persisted Match participant data before returning owner replay DTOs.
- Stored Chronicle replay building accepts authorized requested owners and continues to downgrade public/unauthorized requests.
- Workshop Match summaries now include bottom/top player ids so the UI can identify whether `player:workshop-local` participated.
- Workshop result rows keep `Open replay` public by default and add `Open owner debug` only for completed replayable Matches owned by the local Workshop player.
- Service-backed E2E now proves a thrown-exception sample goes through submit -> worker execution -> persisted Chronicle -> owner replay -> Soldier inactivity explanation, and the same Match's public replay remains privacy-safe.
- Formal verification artifacts now exist for phases 8-13.
- Code review findings were fixed and re-reviewed.
- UI review passed with no blocking issues.

## Changed Files

- `apps/web/app/matches/server.ts`
- `apps/web/app/matches/replay-ready.ts`
- `apps/web/app/matches/server.test.ts`
- `packages/persistence/src/matchset-status.ts`
- `packages/persistence/src/workshop.ts`
- `packages/persistence/src/workshop.test.ts`
- `apps/web/app/workshop/workshop-client-state.ts`
- `apps/web/app/workshop/workshop-client.tsx`
- `apps/web/app/workshop/workshop-client.test.tsx`
- `apps/web/app/workshop/server.test.ts`
- `apps/web/e2e/workshop-to-replay.spec.ts`
- `.planning/phases/08-*/*-VERIFICATION.md` through `.planning/phases/13-*/*-VERIFICATION.md`

## Verification

- `pnpm --filter @cowards/web test -- server.test.ts owner-debug.test.ts`
- `pnpm --filter @cowards/persistence test -- workshop.test.ts`
- `pnpm --filter @cowards/web test -- workshop-client.test.tsx server.test.ts`
- `pnpm --filter @cowards/web test -- server.test.ts owner-debug.test.ts workshop-client.test.tsx`
- `pnpm --filter @cowards/web typecheck`
- `pnpm e2e:service`
- `pnpm preflight:docker -- --skip-web`
- `git diff --check`

## Review

- `13-REVIEW.md`: issues found.
- `13-REREVIEW.md`: passed after fixes.
- `13-UI-REVIEW.md`: passed.

## Deferred

- Production authentication and account/session ownership remain deferred.
- Removing Workshop compatibility API aliases remains deferred.
- Ranked ladders and public competitive surfaces remain out of v1.1 scope.
