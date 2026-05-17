---
phase: 7
plan: 07-04
subsystem: workshop-replay-handoff
tags: [workshop, replay, persistence, matchset, links]
requires:
  - phase: 7
    plan: 07-01
    provides: Match replay route
provides:
  - Workshop Match rows with outcome and replay availability
  - Direct replay links from completed Workshop tests
  - Degraded MatchSet replay evidence display
affects: [phase-7-replay-viewer, workshop-test-panel, e2e]
tech-stack:
  added: []
  patterns: [chronicle-backed-link-gating, compact-match-rows]
key-files:
  modified:
    - packages/persistence/src/matchset-status.ts
    - packages/persistence/src/workshop.ts
    - packages/persistence/src/workshop.test.ts
    - apps/web/app/workshop/types.ts
    - apps/web/app/workshop/workshop-client-state.ts
    - apps/web/app/workshop/workshop-client.test.tsx
    - apps/web/app/workshop/workshop-client.tsx
    - apps/web/app/workshop/server.test.ts
    - apps/web/app/globals.css
key-decisions:
  - `hasReplay` is derived from stored Chronicle rows, not inferred from Match completion alone.
  - Failed/system rows never open replay links even if bad fixture data claims a Chronicle exists.
  - Workshop remains the first replay entry point; no separate Match history page was added.
patterns-established:
  - Workshop links use `/matches/${encodeURIComponent(matchId)}/replay`.
  - Long Match IDs are truncated visually while full IDs remain available in `title`.
requirements-completed:
  - VIEW-07
duration: 25 min
completed: 2026-05-17
---

# Phase 7 Plan 07-04: Workshop Replay Handoff Summary

**Workshop completed/degraded MatchSets now expose per-Match status, outcome, replay availability, and safe direct replay links**

## Performance

- **Duration:** 25 min
- **Started:** 2026-05-17T23:07:00Z
- **Completed:** 2026-05-17T23:32:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Enriched MatchSet Match summaries with `matchId`, `status`, `outcome`, `winnerPlayerId`, and `hasReplay`.
- Derived `hasReplay` through a `chronicles` left join so replay links only appear when a Chronicle is stored.
- Added Workshop helpers for replay hrefs, replay eligibility, and compact outcome labels.
- Rendered full Workshop Match lists with status/outcome text, safe `Open replay` links, degraded MatchSet copy, and aggregate scoring still visible.
- Added compact row styling with Match ID truncation and full IDs preserved via `title`.

## Task Commits

1. **Task 07-04-01: Enrich MatchSet summaries with outcomes and replay availability** - `26a3621` (feat)
2. **Task 07-04-02: Expose replay links in Workshop MatchSet test panel** - `55aa312` (feat)
3. **Task 07-04-03: Style MatchSet replay rows without disrupting Workshop layout** - `5643802` (feat)

## Files Created/Modified

- `packages/persistence/src/matchset-status.ts` - Match summary SQL and row mapper with Chronicle-backed replay availability.
- `packages/persistence/src/workshop.ts` - Workshop summaries now return enriched Match rows.
- `packages/persistence/src/workshop.test.ts` - Contract tests for `hasReplay`, outcome, and failed/system rows.
- `apps/web/app/workshop/types.ts` - Web-facing Workshop test response now carries the enriched Match shape.
- `apps/web/app/workshop/workshop-client-state.ts` - Replay href, replay eligibility, and outcome formatting helpers.
- `apps/web/app/workshop/workshop-client.test.tsx` - Replay handoff helper tests.
- `apps/web/app/workshop/workshop-client.tsx` - Match list and `Open replay` links in the Workshop test panel.
- `apps/web/app/workshop/server.test.ts` - Updated test doubles for the new Match row contract.
- `apps/web/app/globals.css` - Compact Match row styling and truncation.

## Decisions Made

- Kept replay-link gating server-truthful by requiring both `status === "complete"` and `hasReplay === true`.
- Used plain anchor links for direct navigation to the replay route.
- Displayed `Replay unavailable` text instead of relying on disabled controls or color-only status.

## Deviations from Plan

None.

## Issues Encountered

- Web server test doubles needed the new `hasReplay` field before typecheck could pass.

## Verification

- `pnpm --filter @cowards/persistence test -- workshop.test.ts` passed.
- `pnpm --filter @cowards/web test -- workshop-client.test.tsx` passed.
- `pnpm --filter @cowards/web typecheck` passed.
- `pnpm verify` passed.

## User Setup Required

None.

## Next Phase Readiness

Plan 07-05 can now verify the full Workshop launch -> completed Match row -> replay route -> board/timeline path.

## Self-Check: PASSED

---
*Phase: 07-replay-viewer-and-end-to-end-verification*
*Completed: 2026-05-17*
