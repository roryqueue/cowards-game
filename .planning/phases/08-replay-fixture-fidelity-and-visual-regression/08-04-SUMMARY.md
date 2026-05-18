---
phase: 08-replay-fixture-fidelity-and-visual-regression
plan: 04
subsystem: testing
tags: [replay, visual-regression, playwright, fixtures, ui-rendering]
requires:
  - phase: 08-replay-fixture-fidelity-and-visual-regression
    provides: scenario-specific replay fixture catalog and generated ReplayReadyDto projection
provides:
  - Stable replay timeline event aria labels
  - Focused replay visual regression spec for desktop and mobile
  - Board-scale, Soldier-position, contraction-bound, and event-callout screenshot baselines
  - Root e2e:visual script wired into verify
affects: [phase-08, replay-viewer, visual-regression, ci-verification]
tech-stack:
  added: []
  patterns:
    - Playwright locator screenshots against the replay board host only
    - Scenario catalog lookup for generated replay fixture URLs
    - UI-layer diagnostics prefixed with [ui rendering]
key-files:
  created:
    - apps/web/e2e/replay.visual.spec.ts
    - apps/web/e2e/replay.visual.spec.ts-snapshots/
  modified:
    - package.json
    - apps/web/app/matches/[matchId]/replay/replay-client.tsx
    - apps/web/app/matches/replay-fixture.ts
    - apps/web/e2e/replay.fixture.spec.ts
key-decisions:
  - "Timeline event buttons expose aria labels as Timeline event {sequence}: {type}, with event type read from the replay DTO."
  - "Visual tests use fixture catalog replayHref values and focused board-host screenshots rather than full-page snapshots."
  - "Selected visual checkpoints force a scrubbed final frame before screenshot comparison to avoid Pixi animation variance."
patterns-established:
  - "Visual E2E helpers throw [ui rendering] errors for missing scenarios, malformed labels, blank board screenshots, and catalog failures."
  - "Replay visual baselines are mechanic-specific and project-specific under replay.visual.spec.ts-snapshots."
requirements-completed: [FID-05, FID-07]
duration: 24min
completed: 2026-05-18
---

# Phase 8 Plan 04: Focused Replay Visual Regression Summary

**Deterministic Playwright replay-board visual checks now cover generated fixture mechanics across desktop and mobile.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-05-18T14:13:02Z
- **Completed:** 2026-05-18T14:36:34Z
- **Tasks:** 3
- **Files modified:** 19

## Accomplishments

- Added stable event-button selectors in `ReplayClient` without adding rule logic to React.
- Updated the fixture smoke spec to use the generated scenario catalog while preserving public privacy and owner-debug Awareness Grid coverage.
- Added focused Playwright visual checks and 14 desktop/mobile baselines for board scale, push Soldier positions, contraction bounds, and push/backstab/runtime/endgame callouts.
- Added `pnpm e2e:visual` and wired it into `pnpm verify`.

## Task Commits

1. **Task 1: Stable UI hooks and fixture smoke catalog use** - `b7e20e3` (feat)
2. **Task 2 RED: Focused replay visual regression spec** - `952bee6` (test)
3. **Task 2 GREEN: Replay visual screenshot baselines** - `690294d` (feat)
4. **Task 3: Visual gate script and screenshot stabilization** - `93550bb` (fix)

## Files Created/Modified

- `package.json` - Adds `e2e:visual` and includes it after `e2e:smoke` in `verify`.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` - Adds stable timeline event aria labels from replay DTO event types.
- `apps/web/app/matches/replay-fixture.ts` - Imports Chronicle metadata through the route-safe persistence subpath.
- `apps/web/e2e/replay.fixture.spec.ts` - Uses the fixture scenario catalog and stable event selectors while retaining public privacy and owner-debug checks.
- `apps/web/e2e/replay.visual.spec.ts` - Adds focused `[ui rendering]` visual tests, nonblank board screenshot pixel checks, and deterministic selected-event helpers.
- `apps/web/e2e/replay.visual.spec.ts-snapshots/` - Adds desktop and mobile screenshot baselines for seven focused replay board views.

## Decisions Made

- Used event type from `data.timeline` for button aria labels because grouped timeline entries intentionally store only sequence and display label.
- Kept screenshots scoped to the replay board host to minimize unrelated page layout variance.
- Forced selected event sequences through the timeline slider with scrubbing active after clicking the stable event button; this renders Pixi at the final frame before snapshot comparison.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Avoided bundling persistence migrations in the fixture route**
- **Found during:** Task 1 verification
- **Issue:** `apps/web/app/matches/replay-fixture.ts` imported `createChronicleMetadata` from `@cowards/persistence`, which pulled `migrations.ts` into the Next test-support route and failed E2E bundling.
- **Fix:** Switched to the exported `@cowards/persistence/chronicle-store` subpath.
- **Files modified:** `apps/web/app/matches/replay-fixture.ts`
- **Verification:** `PLAYWRIGHT_TEST=1 pnpm e2e replay.fixture.spec.ts --project=desktop`
- **Committed in:** `b7e20e3`

**Total deviations:** 1 auto-fixed blocking issue
**Impact on plan:** Required for the planned fixture route catalog and replay visual tests to run; no architecture change.

## Issues Encountered

- The exact commands `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.visual.spec.ts --project=desktop` and `... --project=mobile` pass, but because `--project` appears after the delimiter, Playwright treats it as positional input and runs both desktop and mobile projects.
- `pnpm verify` is blocked before lint/type/test by an out-of-scope Prettier issue in `packages/test-utils/src/replay-scenarios.legality.test.ts`. Logged in `deferred-items.md`.
- The `gsd-sdk` available on PATH did not expose the required `query` handlers, and no project-local `gsd-sdk` binary was present, so automated STATE/ROADMAP/REQUIREMENTS handler updates could not run.

## Known Stubs

None.

## Auth Gates

None.

## Verification

- RED: `PLAYWRIGHT_TEST=1 pnpm e2e replay.visual.spec.ts --project=desktop` failed on missing baselines after route, selector, and nonblank board checks passed.
- `PLAYWRIGHT_TEST=1 pnpm e2e replay.fixture.spec.ts --project=desktop`
- `PLAYWRIGHT_TEST=1 pnpm e2e replay.visual.spec.ts --project=desktop --update-snapshots`
- `PLAYWRIGHT_TEST=1 pnpm e2e replay.visual.spec.ts --project=mobile --update-snapshots`
- `PLAYWRIGHT_TEST=1 pnpm e2e replay.visual.spec.ts --project=desktop`
- `PLAYWRIGHT_TEST=1 pnpm e2e replay.visual.spec.ts --project=mobile`
- `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.visual.spec.ts --project=desktop`
- `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.visual.spec.ts --project=mobile`
- `pnpm e2e:visual`
- `pnpm exec prettier --check package.json apps/web/e2e/replay.fixture.spec.ts apps/web/e2e/replay.visual.spec.ts`
- `pnpm verify` failed on out-of-scope formatting in `packages/test-utils/src/replay-scenarios.legality.test.ts`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Replay visual regression now has a dedicated local/CI command and mechanic-specific baselines. Later Phase 8 or reliability work should fix the out-of-scope Prettier issue so the aggregate `pnpm verify` command can progress beyond formatting.

## Self-Check: PASSED

- Summary file exists: `.planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-04-SUMMARY.md`
- Visual spec exists: `apps/web/e2e/replay.visual.spec.ts`
- Visual baseline directory exists with project-specific screenshots.
- Task commits exist: `b7e20e3`, `952bee6`, `690294d`, `93550bb`

---
*Phase: 08-replay-fixture-fidelity-and-visual-regression*
*Completed: 2026-05-18*
