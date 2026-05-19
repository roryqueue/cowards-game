---
phase: 11-doctrine-debugging-ux
plan: 03
subsystem: ui
tags: [workshop, react, validation, replay, samples]
requires:
  - phase: 11-doctrine-debugging-ux
    provides: Validation guidance DTO fields and Workshop sample metadata from Plans 11-01 and 11-02
provides:
  - Workshop validation guidance rows with Strategy API constraint and remediation copy
  - Grouped starter and failure-mode sample catalog rendering
  - Replay availability helper and per-state unavailable reasons for Workshop Match rows
affects: [11-doctrine-debugging-ux, workshop, replay-handoff]
tech-stack:
  added: []
  patterns: [helper-driven Workshop display decisions, DTO metadata rendering]
key-files:
  created:
    - .planning/phases/11-doctrine-debugging-ux/11-03-SUMMARY.md
  modified:
    - apps/web/app/workshop/types.ts
    - apps/web/app/workshop/workshop-client-state.ts
    - apps/web/app/workshop/workshop-client.tsx
    - apps/web/app/workshop/workshop-client.test.tsx
key-decisions:
  - "Kept replay link rendering gated by canOpenReplay(match), with helper-provided unavailable reasons for every non-link state."
  - "Rendered Plan 11-02 samples in separate starter and failure-mode groups while preserving the existing dirty-draft confirmation path."
patterns-established:
  - "Workshop JSX consumes pure state helpers for validation guidance, sample grouping, and replay availability copy."
  - "Validation rows render structured guidance when present and fall back to legacy issue messages when absent."
requirements-completed: [DEBUG-01, DEBUG-02, DEBUG-03]
duration: 31min
completed: 2026-05-18
---

# Phase 11 Plan 11-03 Summary

**Workshop validation, sample selection, and replay handoff now show actionable doctrine debugging copy without moving Match rules into React.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-05-18T18:17:00Z
- **Completed:** 2026-05-18T18:48:40Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added pure Workshop helpers for validation guidance, sample grouping, sample labels, and replay availability.
- Updated validation rows to show issue heading, Strategy API constraint, existing issue message, and remediation when provided.
- Rendered starter samples and failure-mode samples as distinct groups while preserving the existing replace-draft confirmation flow.
- Replaced generic replay-unavailable text with distinct reasons for pending, running, failed system, blocked, and completed-without-Chronicle Match rows.

## Task Commits

Committed together atomically for Plan 11-03.

## Files Created/Modified

- `apps/web/app/workshop/types.ts` - Re-exports `WorkshopSampleSummary` for Workshop UI helper/component typing.
- `apps/web/app/workshop/workshop-client-state.ts` - Adds validation guidance, sample grouping, sample label, and replay availability helpers.
- `apps/web/app/workshop/workshop-client.tsx` - Renders grouped samples, validation guidance rows, and helper-provided replay handoff copy.
- `apps/web/app/workshop/workshop-client.test.tsx` - Adds helper coverage for guidance fallbacks, replay states, and sample grouping.
- `.planning/phases/11-doctrine-debugging-ux/11-03-SUMMARY.md` - Records Plan 11-03 completion context.

## Decisions Made

The Workshop still uses `canOpenReplay(match)` as the only condition that produces an anchor. `getReplayAvailability(match)` carries the reason copy so pending/running/failure/no-Chronicle states stay testable outside JSX.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Vitest could not import the TSX component directly under the current web test transform settings, so component-facing behavior is covered through exported pure helpers and typecheck verifies the component consumes them correctly.

## Verification

- `pnpm --filter @cowards/web test -- workshop-client.test.tsx` - passed, 9 files / 67 tests.
- `pnpm --filter @cowards/web typecheck` - passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

DEBUG-01 through DEBUG-03 are visible in the Workshop surface. Follow-on replay plans can build owner-only inactivity explanation DTOs without revisiting Workshop validation or replay-link copy.

---
*Phase: 11-doctrine-debugging-ux*
*Completed: 2026-05-18*
