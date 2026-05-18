---
phase: 6
plan: 06-05
subsystem: strategy-workshop-ux
tags:
  - workshop
  - browser-verification
  - accessibility
requires:
  - 06-02
  - 06-03
  - 06-04
provides:
  - Responsive Workshop hardening
  - Browser verification notes
  - Approved validation artifact
affects:
  - apps/web
  - packages/persistence
  - .planning/phases/06-strategy-workshop-ux/06-VALIDATION.md
tech-stack:
  added: []
  patterns:
    - Public `next/dynamic` with local type declaration for NodeNext
    - Static fallback snapshot when local storage is unavailable
    - Mobile `display: contents` ordering for Workshop panels
key-files:
  created:
    - apps/web/next-dynamic.d.ts
  modified:
    - apps/web/app/globals.css
    - apps/web/app/workshop/monaco-editor.tsx
    - apps/web/app/workshop/workshop-client.tsx
    - apps/web/app/workshop/workshop-client.test.tsx
    - apps/web/app/workshop/server.ts
    - apps/web/app/api/workshop/revisions/route.ts
    - apps/web/app/api/workshop/tests/route.ts
    - packages/persistence/src/workshop.ts
    - .planning/phases/06-strategy-workshop-ux/06-VALIDATION.md
key-decisions:
  - Render the Workshop even when local Postgres is unavailable, using static templates and clear storage error messages.
  - Keep the first screen Workshop-only and explicitly exclude replay board/timeline UI from Phase 6.
  - Record Docker unavailability as an environment limitation while preserving browser checks and endpoint validation.
requirements-completed:
  - UX-01
  - UX-02
  - UX-03
  - UX-04
  - UX-05
  - UX-06
duration: "00:22"
completed: "2026-05-17"
---

# Phase 6 Plan 06-05: Workshop UX Hardening and Browser Verification Summary

The Workshop is now hardened for responsive layout, accessible status text, browser rendering, local-storage failure handling, and final Phase 6 validation sign-off.

## Execution

- Start: 2026-05-17 16:40 America/New_York
- End: 2026-05-17 16:49 America/New_York
- Duration: 00:22
- Tasks completed: 3
- Files changed: 10

## Completed Tasks

- Added mobile panel ordering so the single-column flow matches the UI-SPEC order.
- Added `aria-live="polite"` / `role="status"` status regions for validation and test status.
- Switched Monaco back to public `next/dynamic` for dev-server compatibility and added a local declaration for this repo's NodeNext config.
- Added static Workshop snapshot fallback so the page still renders without local Postgres.
- Added recoverable storage-unavailable errors for revision submit and test launch routes.
- Updated `.planning/phases/06-strategy-workshop-ux/06-VALIDATION.md` to approved with browser verification notes.

## Verification

- Browser checked at 1440x900, 1180x800, 820x1180, and 390x844.
- `pnpm --filter @cowards/web test -- workshop-client.test.tsx`: passed
- `pnpm --filter @cowards/web test -- server.test.ts`: passed
- `pnpm --filter @cowards/persistence test -- workshop.test.ts`: passed
- `pnpm --filter @cowards/web typecheck`: passed
- `pnpm --filter @cowards/web build`: passed
- `pnpm verify`: passed
- `rg 'wave_0_complete: true' .planning/phases/06-strategy-workshop-ux/06-VALIDATION.md`: passed
- `rg 'Approval: approved' .planning/phases/06-strategy-workshop-ux/06-VALIDATION.md`: passed

## Issues Encountered

- Docker is not installed in this environment, so database-backed submit/test launch could not be completed end-to-end in-browser. The UI now renders without storage and returns a clear storage-unavailable message for those actions.

## Next Phase Readiness

Phase complete, ready for next step.

## Self-Check: PASSED
