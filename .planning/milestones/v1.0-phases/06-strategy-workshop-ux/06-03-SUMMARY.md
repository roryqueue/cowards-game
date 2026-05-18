---
phase: 6
plan: 06-03
subsystem: strategy-workshop-ux
tags:
  - workshop
  - revisions
  - history
requires:
  - 06-01
  - 06-02
provides:
  - Functional revision submission
  - Revision history selection
  - Revision source copy-to-draft flow
affects:
  - apps/web
  - packages/persistence
tech-stack:
  added: []
  patterns:
    - Flat UI revision DTOs
    - Immutable revision source loading through local-only source routes
    - Server-side validation before persistence
key-files:
  created:
    - apps/web/app/api/workshop/revisions/route.ts
    - apps/web/app/api/workshop/revisions/[revisionId]/source/route.ts
  modified:
    - apps/web/app/workshop/server.ts
    - apps/web/app/workshop/workshop-client.tsx
    - apps/web/app/workshop/workshop-client-state.ts
    - apps/web/app/workshop/workshop-client.test.tsx
    - packages/persistence/src/workshop.ts
    - packages/persistence/src/workshop.test.ts
key-decisions:
  - Use `strategy:local-workshop` as the persisted local Workshop strategy id.
  - Return flat revision summary fields for the UI while preserving validation and metadata objects.
  - Loading a revision source always resets the editor to an unchecked draft copy and never updates the existing revision.
requirements-completed:
  - UX-04
  - UX-06
duration: "00:16"
completed: "2026-05-17"
---

# Phase 6 Plan 06-03: Revision Submission, History, and Selection Summary

The Workshop now supports the immutable revision loop: valid drafts can be submitted with label/notes, history shows persisted revision summaries, and selected revision source can be loaded back as an editable draft copy.

## Execution

- Start: 2026-05-17 16:29 America/New_York
- End: 2026-05-17 16:35 America/New_York
- Duration: 00:16
- Tasks completed: 4
- Files changed: 8

## Completed Tasks

- Added flat Workshop revision summaries with `strategyId`, `label`, `notes`, `createdBy`, `valid`, and `usedInMatches`.
- Added SQL string tests proving local-strategy filtering, descending creation order, and usage counts across bottom/top match columns.
- Added `/api/workshop/revisions` for listing and submission.
- Added `/api/workshop/revisions/[revisionId]/source` for local-only source loading.
- Wired the Submit Revision panel to validation state, `source`/`label`/`notes` submission, success/error messages, and history prepending.
- Added revision selection plus `Load source`, which copies source into the editor and resets validation to `Not checked`.

## Verification

- `pnpm --filter @cowards/persistence test -- workshop.test.ts`: passed
- `pnpm --filter @cowards/web test -- server.test.ts`: passed
- `pnpm --filter @cowards/web test -- workshop-client.test.tsx`: passed
- `pnpm --filter @cowards/web typecheck`: passed
- `pnpm --filter @cowards/web build`: passed
- `pnpm verify`: passed

## Issues Encountered

- None.

## Next Phase Readiness

Ready for 06-04.

## Self-Check: PASSED
