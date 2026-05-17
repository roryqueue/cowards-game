---
phase: 6
plan: 06-04
subsystem: strategy-workshop-ux
tags:
  - workshop
  - matchsets
  - status
requires:
  - 06-01
  - 06-03
provides:
  - Workshop test launch
  - Workshop test status refresh
  - Aggregate score display
affects:
  - apps/web
  - packages/persistence
tech-stack:
  added: []
  patterns:
    - UI launches persisted MatchSets and relies on worker/job execution
    - Plural `/api/workshop/tests` routes for launch/status
    - Status polling stops on terminal MatchSet states
key-files:
  created:
    - apps/web/app/api/workshop/tests/route.ts
    - apps/web/app/api/workshop/tests/[matchSetId]/route.ts
  modified:
    - apps/web/app/workshop/server.ts
    - apps/web/app/workshop/types.ts
    - apps/web/app/workshop/workshop-client.tsx
    - apps/web/app/workshop/workshop-client-state.ts
    - apps/web/app/workshop/workshop-client.test.tsx
    - apps/web/app/workshop/server.test.ts
    - packages/persistence/src/workshop.ts
    - packages/persistence/src/workshop.test.ts
key-decisions:
  - Keep old singular test routes available but move the Workshop client to `/api/workshop/tests`.
  - Launch only persisted MatchSets from the web process; no runtime worker, engine, or replay execution imports in `apps/web`.
  - Show honest queued/running/complete/failure status and aggregate scoring without replay/chronicled private data.
requirements-completed:
  - UX-05
  - UX-06
duration: "00:14"
completed: "2026-05-17"
---

# Phase 6 Plan 06-04: Workshop Test Match Launch and Status Summary

Workshop users can now launch persisted test MatchSets from selected valid revisions, choose bundled opponents/presets, refresh/poll status, and inspect aggregate score fields without entering replay UI.

## Execution

- Start: 2026-05-17 16:36 America/New_York
- End: 2026-05-17 16:40 America/New_York
- Duration: 00:14
- Tasks completed: 3
- Files changed: 10

## Completed Tasks

- Updated `createWorkshopTestMatchSet` to return `matchSetId`, `status`, `matchIds`, `matchCount`, `matches`, and `scoring`.
- Added plural `/api/workshop/tests` launch and `/api/workshop/tests/[matchSetId]` status routes.
- Wired the Test Match panel with revision, opponent, and preset selectors plus `Launch test` and `Refresh status`.
- Added status copy for `Test queued`, `Test running`, `Test complete`, and failure states.
- Added score summary fields for wins/losses/draws, surviving soldiers, and survival turns.
- Added tests for Workshop status vocabulary and no forbidden web execution imports.

## Verification

- `pnpm --filter @cowards/persistence test -- workshop.test.ts`: passed
- `pnpm --filter @cowards/web test -- server.test.ts`: passed
- `pnpm --filter @cowards/web test -- workshop-client.test.tsx`: passed
- `pnpm --filter @cowards/web typecheck`: passed
- `pnpm --filter @cowards/web build`: passed
- `pnpm verify`: passed
- `rg 'createRuntimeFromRevision|@cowards/runtime-js/worker|@cowards/engine|@cowards/replay' apps/web`: no matches

## Issues Encountered

- None.

## Next Phase Readiness

Ready for 06-05.

## Self-Check: PASSED
