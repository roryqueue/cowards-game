# Phase 203 Plan: Result Page Tactical Summary and Comparison Model

## Research

- Result pages already render compact workbench sections and evidence panels.
- The new intelligence model can attach to `ResultWorkbenchViewModel` without changing public service contracts.

## Plan

1. Extend result view model with result intelligence.
2. Render Match Intelligence summary, availability/confidence metrics, entrant comparison rows, and replay jump targets.
3. Preserve low-signal copy for completed-without-replay, pending, failed, degraded, and unavailable fixtures.
4. Add browser proof across all frozen public result fixtures.

## Verification

- `PLAYWRIGHT_BASE_URL=http://localhost:3100 PLAYWRIGHT_TEST=1 pnpm e2e --project=desktop --project=mobile --workers=1 v1-30-match-intelligence-workbench.spec.ts`
