---
phase: 7
plan: 07-03
subsystem: replay-board
tags: [pixi, canvas, replay, board, callouts, accessibility]
requires:
  - phase: 7
    plan: 07-01
    provides: Replay DTOs and route
  - phase: 7
    plan: 07-02
    provides: Replay client shell and selected timeline state
provides:
  - PixiJS replay board renderer
  - Pure board render-model descriptors
  - Event callout color/variant mapping
  - Board accessibility/status hooks
affects: [phase-7-replay-viewer, e2e-visual-checks]
tech-stack:
  added: [pixi.js, "@pixi/react"]
  patterns: [browser-only-pixi-lifecycle, pure-render-model, display-only-animation]
key-files:
  created:
    - apps/web/app/matches/[matchId]/replay/replay-board-model.ts
    - apps/web/app/matches/[matchId]/replay/replay-board.test.ts
    - apps/web/app/matches/[matchId]/replay/replay-board.tsx
  modified:
    - apps/web/package.json
    - pnpm-lock.yaml
    - apps/web/app/matches/[matchId]/replay/replay-client.tsx
    - apps/web/app/matches/[matchId]/replay/replay-client.test.tsx
    - apps/web/app/globals.css
key-decisions:
  - Use a direct PixiJS `Application` inside a browser-only Client Component for explicit lifecycle and SSR safety.
  - Keep render descriptors pure and tested separately from canvas drawing.
  - Treat animations as display-only redraw progress over canonical selected replay state.
patterns-established:
  - Board rendering is fed by `buildReplayBoardModel` and never imports engine/runtime logic.
  - Canvas status and selected event details remain accessible through surrounding semantic HTML.
requirements-completed:
  - VIEW-01
  - VIEW-05
  - VIEW-06
duration: 35 min
completed: 2026-05-17
---

# Phase 7 Plan 07-03: PixiJS Replay Board and Event Callouts Summary

**Pixi replay board with visual state descriptors, owner badges, facing markers, terrain, contraction bounds, and event callouts**

## Performance

- **Duration:** 35 min
- **Started:** 2026-05-17T22:31:00Z
- **Completed:** 2026-05-17T23:06:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Installed `pixi.js` and `@pixi/react` for the web app.
- Added a pure replay board model that describes Soldier state, owner colors, numbered badges, terrain, bounds, contraction status, and major event callouts.
- Added a browser-only Pixi renderer that draws the replay board, active/stone Soldiers, terrain, facing markers, selected outlines, and event callout pulses.
- Replaced the arena placeholder with `ReplayBoard` while preserving the selected timeline entry and selected Soldier state.
- Added board sizing and accessibility hooks so the canvas fills the stable arena and exposes current sequence/event status.

## Task Commits

1. **Task 07-03-01: Add Pixi dependencies and browser-only board model** - `3e5520a` (feat)
2. **Task 07-03-02: Render Pixi board with states, badges, facing, and callouts** - `d514673` (feat)
3. **Task 07-03-03: Finalize replay board CSS and accessibility hooks** - `d742722` (feat)
4. **Lint follow-up: Use browser performance API** - `49ab84d` (fix)

## Files Created/Modified

- `apps/web/app/matches/[matchId]/replay/replay-board-model.ts` - Board descriptors and event callout mapping.
- `apps/web/app/matches/[matchId]/replay/replay-board.test.ts` - Descriptor tests for visual state distinctions and callout colors.
- `apps/web/app/matches/[matchId]/replay/replay-board.tsx` - Browser-only Pixi board component.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` - Renders `ReplayBoard` and passes selected sequence/Soldier/event state.
- `apps/web/app/matches/[matchId]/replay/replay-client.test.tsx` - Verifies replay client renders the board affordance.
- `apps/web/app/globals.css` - Canvas host sizing, overflow protection, and screen-reader status styles.
- `apps/web/package.json` - Added Pixi dependencies.
- `pnpm-lock.yaml` - Recorded Pixi dependency graph.

## Decisions Made

- Used direct Pixi lifecycle management instead of declarative `@pixi/react` components because it keeps the canvas boot path explicit under Next and avoids adding JSX runtime test configuration during this phase.
- Rendered FALLEN Soldiers through absence plus event/history callout descriptors rather than as occupied squares.
- Used a 240ms callout pulse for display-only animation; scrubbing snaps immediately by using zero-duration redraw.

## Deviations from Plan

- The board renderer uses `pixi.js` directly rather than `@pixi/react` JSX components. `@pixi/react` remains installed as planned and available if later board components benefit from declarative composition.

## Issues Encountered

- Repo-wide lint rejected the bare browser global `performance`; this was corrected to `window.performance`.

## Verification

- `pnpm --filter @cowards/web test -- replay-board.test.ts replay-client.test.tsx` passed.
- `pnpm --filter @cowards/web typecheck` passed.
- `pnpm verify` passed.

## User Setup Required

None.

## Next Phase Readiness

Plan 07-04 can wire Workshop completed Match results into `/matches/{matchId}/replay` now that the route, client workbench, and board renderer exist.

## Self-Check: PASSED

---
*Phase: 07-replay-viewer-and-end-to-end-verification*
*Completed: 2026-05-17*
