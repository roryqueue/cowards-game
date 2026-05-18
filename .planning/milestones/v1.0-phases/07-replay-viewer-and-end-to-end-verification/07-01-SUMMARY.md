---
phase: 7
plan: 07-01
subsystem: replay-api
tags: [next, replay, chronicle, privacy, route]
requires:
  - phase: 3
    provides: Chronicle projection and replay reconstruction utilities
  - phase: 5
    provides: persisted Chronicle storage by Match ID
provides:
  - Match-centered replay DTOs
  - Server facade for persisted Chronicle replay retrieval
  - Direct `/matches/{matchId}/replay` route
affects: [phase-7-replay-viewer, workshop-handoff, e2e]
tech-stack:
  added: [@cowards/replay]
  patterns: [server-facade, public-projection-default, replay-unavailable-state]
key-files:
  created:
    - apps/web/app/matches/types.ts
    - apps/web/app/matches/server.ts
    - apps/web/app/matches/server.test.ts
    - apps/web/app/matches/[matchId]/replay/page.tsx
    - apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx
  modified:
    - apps/web/package.json
    - apps/web/next.config.mjs
    - pnpm-lock.yaml
key-decisions:
  - Public replay projection is the default server response.
  - Owner debug projection requires explicit mode and owner player ID.
  - Missing or invalid Chronicles produce replay-unavailable data instead of fake replay state.
patterns-established:
  - Match replay server mirrors Workshop facade dependency injection for testable persistence access.
  - Replay route is Match-centered at `/matches/{matchId}/replay`.
requirements-completed:
  - VIEW-01
  - VIEW-03
  - VIEW-04
duration: 20 min
completed: 2026-05-17
---

# Phase 7 Plan 07-01: Replay Data Facade and Route Contracts Summary

**Persisted Chronicle replay facade with public-by-default projection and a direct Match replay route**

## Performance

- **Duration:** 20 min
- **Started:** 2026-05-17T21:37:00Z
- **Completed:** 2026-05-17T21:57:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Added `@cowards/replay` as a web dependency and transpiled it through Next.
- Added replay DTOs, server facade, and tests for public/owner projection behavior.
- Added the direct `/matches/{matchId}/replay` page and unavailable-state component.

## Task Commits

1. **Task 07-01-01: Add replay web dependencies and Next package configuration** - `60f7989` (chore)
2. **Task 07-01-02: Add replay DTOs and server facade** - `885755d` (feat)
3. **Task 07-01-03: Add replay route page and facade tests** - `1ae17f5` (feat)

## Files Created/Modified

- `apps/web/app/matches/types.ts` - Replay-ready and replay-unavailable DTO contracts.
- `apps/web/app/matches/server.ts` - Match replay facade that loads stored Chronicles and projects replay data.
- `apps/web/app/matches/server.test.ts` - Facade tests for missing Chronicles, public privacy, and owner projection.
- `apps/web/app/matches/[matchId]/replay/page.tsx` - Direct Match replay route shell.
- `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx` - Replay unavailable state.
- `apps/web/package.json` - Added `@cowards/replay`.
- `apps/web/next.config.mjs` - Added `@cowards/replay` to transpiled workspace packages.
- `pnpm-lock.yaml` - Recorded the replay workspace dependency.

## Decisions Made

- Used the persisted Chronicle as the only source of replay truth; no Strategy runtime execution is reachable from the replay facade.
- Returned server-built replay states alongside timeline entries so later UI plans can render without re-running replay reconstruction in React.
- Kept the first route shell minimal until the Phase 7 client and Pixi plans replace the placeholder board.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- A minimal Chronicle fixture initially failed schema validation because private replay events lacked required public payload fields. The fixture was corrected with `playerId`, `cycleIndex`, and `action` fields before committing the facade tests.

## Verification

- `pnpm --filter @cowards/web test -- server.test.ts` passed.
- `pnpm --filter @cowards/web typecheck` passed.
- `pnpm verify` passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 07-02 can build the replay client shell against `ReplayReadyDto`, `timeline`, `states`, and the direct route created here.

## Self-Check: PASSED

---
*Phase: 07-replay-viewer-and-end-to-end-verification*
*Completed: 2026-05-17*

