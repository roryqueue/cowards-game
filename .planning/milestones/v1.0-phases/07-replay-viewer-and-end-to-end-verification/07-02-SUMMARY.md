---
phase: 7
plan: 07-02
subsystem: replay-client
tags: [next, react, replay, timeline, inspector, responsive-ui]
requires:
  - phase: 7
    plan: 07-01
    provides: Match replay DTOs and route
provides:
  - Replay state helper layer
  - Client replay workbench shell
  - Draggable timeline scrubber and playback controls
  - Public/owner-aware inspector scaffolding
affects: [phase-7-replay-viewer, pixi-board-renderer, workshop-handoff]
tech-stack:
  added: []
  patterns: [pure-state-helpers, public-debug-gating, responsive-workbench]
key-files:
  created:
    - apps/web/app/matches/[matchId]/replay/replay-state.ts
    - apps/web/app/matches/[matchId]/replay/replay-state.test.ts
    - apps/web/app/matches/[matchId]/replay/replay-client.tsx
    - apps/web/app/matches/[matchId]/replay/replay-client.test.tsx
  modified:
    - apps/web/app/matches/[matchId]/replay/page.tsx
    - apps/web/app/globals.css
key-decisions:
  - Keep replay timeline state as selected index/sequence only; all summaries derive from canonical replay DTOs.
  - Gate owner/debug inspector controls behind owner projection data.
  - Use CSS-defined replay workbench dimensions now, before the PixiJS board replaces the placeholder.
patterns-established:
  - React client components consume server-built replay DTOs without importing runtime/engine logic.
  - Replay helpers remain pure and directly testable outside React.
requirements-completed:
  - VIEW-02
  - VIEW-03
  - VIEW-04
duration: 30 min
completed: 2026-05-17
---

# Phase 7 Plan 07-02: Replay Client Shell, Timeline, and Inspector Summary

**Replay workbench shell with scrubber, playback controls, grouped timeline, inspector, and responsive layout**

## Performance

- **Duration:** 30 min
- **Started:** 2026-05-17T22:00:00Z
- **Completed:** 2026-05-17T22:30:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Added pure replay state helpers for timeline clamping, Round -> Activation -> Event grouping, position summaries, Soldier inspection, event inspection, and owner/debug availability.
- Replaced the ready replay route placeholder with a Client Component workbench that supports a draggable scrubber, step back, play/pause, step forward, grouped timeline rows, selected Soldier state, selected event details, and owner/debug visibility.
- Added replay-specific responsive CSS matching the UI contract: `300px minmax(560px, 1fr) 360px` desktop grid, stable board minimum heights, wrapping controls, and event color tokens.

## Task Commits

1. **Task 07-02-01: Add replay state helpers for timeline, selection, and inspector summaries** - `ea63531` (feat)
2. **Task 07-02-02: Build replay client workbench controls and inspector** - `33e7de8` (feat)
3. **Task 07-02-03: Add replay workbench responsive layout styles and component tests** - `056f290` (feat)

## Files Created/Modified

- `apps/web/app/matches/[matchId]/replay/replay-state.ts` - Pure replay timeline, summary, Soldier, event, and owner/debug helper functions.
- `apps/web/app/matches/[matchId]/replay/replay-state.test.ts` - Helper coverage for initial sequence, clamping, grouping, conditional cycle labels, fallen Soldier display, and privacy labels.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` - Client replay workbench shell and playback/inspector controls.
- `apps/web/app/matches/[matchId]/replay/replay-client.test.tsx` - Shell affordance tests for controls, scrubber wiring, and owner/debug gating.
- `apps/web/app/matches/[matchId]/replay/page.tsx` - Ready replay path now renders `ReplayClient`.
- `apps/web/app/globals.css` - Replay workbench layout, responsive board sizes, inspector/timeline styles, and event color tokens.

## Decisions Made

- Preserved Next's `jsx: preserve` setup and used static source assertions for the narrow component shell test because the current Vitest/OXC path does not transform imported Next `.tsx` components.
- Kept the arena as a semantic placeholder until Plan 07-03 adds PixiJS rendering.
- Added the shortened Match ID to the compact replay header while retaining the full ID in title text.

## Deviations from Plan

- `replay-client.test.tsx` verifies client affordances and scrubber wiring through source assertions rather than rendering the Client Component. `pnpm --filter @cowards/web typecheck` remains the compile gate for the `.tsx` component, and pure state behavior is covered in `replay-state.test.ts`.

## Issues Encountered

- Vitest failed to import the new Next Client Component because the web app's TypeScript config preserves JSX for Next. A small Vitest esbuild config was tested and removed when OXC still took precedence. The final test strategy avoids broad tooling changes.

## Verification

- `pnpm --filter @cowards/web test -- replay-state.test.ts replay-client.test.tsx` passed.
- `pnpm --filter @cowards/web typecheck` passed.
- `pnpm verify` passed.

## User Setup Required

None.

## Next Phase Readiness

Plan 07-03 can replace the semantic arena placeholder with the PixiJS replay board while reusing the selected timeline entry, selected Soldier state, and layout zones created here.

## Self-Check: PASSED

---
*Phase: 07-replay-viewer-and-end-to-end-verification*
*Completed: 2026-05-17*
