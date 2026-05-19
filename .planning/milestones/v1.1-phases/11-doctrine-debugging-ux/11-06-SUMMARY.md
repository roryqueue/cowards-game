---
phase: 11-doctrine-debugging-ux
plan: 06
subsystem: replay
tags: [privacy, validation, replay, owner-debug, e2e]
requires:
  - phase: 11-doctrine-debugging-ux
    plan: 03
    provides: Workshop replay handoff and validation UI coverage
  - phase: 11-doctrine-debugging-ux
    plan: 05
    provides: Owner-only Soldier inactivity explanation DTO wiring
provides:
  - Projection/server/browser public privacy regression gates for owner debug fields
  - Owner debug route opt-in and owner-player-id guard coverage
  - Command-backed Phase 11 validation evidence for DEBUG-01 through DEBUG-06
affects: [11-doctrine-debugging-ux, replay, web, validation]
tech-stack:
  added: []
  patterns: [projection denylist hardening, layered privacy tests, command-backed validation evidence]
key-files:
  created:
    - .planning/phases/11-doctrine-debugging-ux/11-VALIDATION.md
    - .planning/phases/11-doctrine-debugging-ux/11-06-SUMMARY.md
  modified:
    - packages/replay/src/project.ts
    - packages/replay/src/project.test.ts
    - apps/web/app/matches/server.test.ts
    - apps/web/app/matches/[matchId]/replay/owner-debug.test.ts
    - apps/web/e2e/replay.fixture.spec.ts
key-decisions:
  - "Added ownerDebug and Soldier inactivity key names to the public projection privacy denylist."
  - "Kept browser checks fixture-backed so Phase 11 privacy validation does not depend on service-backed local Postgres."
  - "Recorded the known persistence package-script failure separately from the targeted passing Workshop sample test."
patterns-established:
  - "Public privacy is asserted at projection, server DTO, route guard, and browser rendering layers."
  - "Owner debug explanations remain hidden until explicit owner query parameters and the owner debug checkbox are both active."
requirements-completed: [DEBUG-01, DEBUG-02, DEBUG-03, DEBUG-04, DEBUG-05, DEBUG-06]
completed: 2026-05-18
---

# Phase 11 Plan 11-06 Summary

**Phase 11 now has layered public privacy tests and command-backed validation evidence.**

## Accomplishments

- Hardened `projectPublicChronicle` privacy filtering for `ownerDebug`, `soldierInactivity`, and `soldierInactivityExplanations`.
- Extended replay projection tests so public serialization rejects new owner-debug field names and markers while owner projection includes only the requested player's private section.
- Extended replay server tests so public DTOs omit owner debug data, trusted owner mode includes owner explanation DTOs, and top-player owner debug markers do not leak into bottom-owner projection.
- Added owner-debug route guard coverage for blank owner ids and missing/disabled opt-in flags.
- Updated fixture Playwright coverage so public replay hides owner debug UI and owner explanations, while explicit owner mode plus checkbox opt-in renders a Soldier inactivity explanation.
- Added `11-VALIDATION.md` mapping DEBUG-01 through DEBUG-06 to exact commands and results.

## Files Created/Modified

- `packages/replay/src/project.ts` - Adds new owner debug field names to the public projection privacy denylist.
- `packages/replay/src/project.test.ts` - Adds owner debug and Soldier inactivity private markers to public and owner projection regression coverage.
- `apps/web/app/matches/server.test.ts` - Adds server DTO privacy checks for public mode and owner-only explanation DTO checks for trusted owner mode.
- `apps/web/app/matches/[matchId]/replay/owner-debug.test.ts` - Adds explicit owner id and opt-in guard cases.
- `apps/web/e2e/replay.fixture.spec.ts` - Adds public privacy assertions and owner-only Soldier inactivity explanation browser coverage.
- `.planning/phases/11-doctrine-debugging-ux/11-VALIDATION.md` - Records Phase 11 command-backed requirement evidence.
- `.planning/phases/11-doctrine-debugging-ux/11-06-SUMMARY.md` - Records this plan completion.

## Issues Encountered

- `pnpm --filter @cowards/persistence test -- workshop.test.ts` failed because the package script ran unrelated `chronicle-store.test.ts` fixtures that now violate stricter Chronicle grammar with `STRATEGY_EVALUATED requires context.roundNumber`.
- The targeted alternative `pnpm --filter @cowards/persistence exec vitest run src/workshop.test.ts` passed and is recorded as DEBUG-02 evidence.
- The existing Awareness Grid fixture test needed to honor the newer owner debug checkbox default; the test now checks the toggle is off, enables it, and then asserts the grid.

## Verification

- `pnpm --filter @cowards/replay test -- project.test.ts` - passed, 11 files / 130 tests.
- `pnpm --filter @cowards/web test -- server.test.ts` - passed, 9 files / 76 tests.
- `pnpm --filter @cowards/web test -- owner-debug.test.ts` - passed, 9 files / 76 tests.
- `pnpm --filter @cowards/spec test -- spec.test.ts` - passed, 1 file / 18 tests.
- `pnpm --filter @cowards/runtime-js test -- validation.test.ts` - passed, 9 files / 161 tests.
- `pnpm --filter @cowards/persistence exec vitest run src/workshop.test.ts` - passed, 1 file / 11 tests.
- `pnpm --filter @cowards/replay test -- debug-explanations.test.ts project.test.ts` - passed, 11 files / 130 tests.
- `pnpm --filter @cowards/web test -- workshop-client.test.tsx replay-state.test.ts replay-client.test.tsx server.test.ts owner-debug.test.ts` - passed, 9 files / 76 tests.
- `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts` - passed, 6 tests.
- `pnpm --filter @cowards/spec typecheck` - passed.
- `pnpm --filter @cowards/runtime-js typecheck` - passed.
- `pnpm --filter @cowards/persistence typecheck` - passed.
- `pnpm --filter @cowards/replay typecheck` - passed.
- `pnpm --filter @cowards/web typecheck` - passed.

## Next Phase Readiness

Phase 11's Doctrine Debugging UX requirements now have automated evidence. Phase 12 can focus on service-backed local/CI reliability without reopening fixture-backed public privacy validation.

---
*Phase: 11-doctrine-debugging-ux*
*Completed: 2026-05-18*
