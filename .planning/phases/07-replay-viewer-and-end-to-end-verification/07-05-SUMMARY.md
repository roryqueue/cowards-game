---
phase: 7
plan: 07-05
subsystem: replay-e2e-validation
tags: [playwright, e2e, replay, validation, test-support]
requires:
  - phase: 7
    plan: 07-02
    provides: Replay timeline and inspector
  - phase: 7
    plan: 07-03
    provides: Pixi board renderer
  - phase: 7
    plan: 07-04
    provides: Workshop replay handoff
provides:
  - Separate `pnpm e2e` command
  - Fixture-backed replay browser coverage
  - Service-backed smoke harness scaffold
  - Completed Phase 7 validation strategy
affects: [phase-7-replay-viewer, verification, future-service-e2e]
tech-stack:
  added: ["@playwright/test"]
  patterns: [test-support-route-gating, fixture-e2e, service-e2e-skip-until-services]
key-files:
  created:
    - playwright.config.ts
    - apps/web/vitest.config.ts
    - apps/web/app/api/test-support/replay-fixture/route.ts
    - apps/web/app/api/test-support/run-worker-once/route.ts
    - apps/web/app/matches/replay-fixture.ts
    - apps/web/e2e/replay.fixture.spec.ts
    - apps/web/e2e/workshop-to-replay.spec.ts
  modified:
    - package.json
    - pnpm-lock.yaml
    - packages/persistence/package.json
    - apps/web/app/matches/server.ts
    - apps/web/app/matches/[matchId]/replay/replay-board.tsx
    - .planning/phases/07-replay-viewer-and-end-to-end-verification/07-VALIDATION.md
key-decisions:
  - Keep Playwright outside `pnpm verify`.
  - Use a deterministic replay fixture for DB-free browser coverage.
  - Skip service-backed Workshop-to-replay smoke unless `RUN_SERVICE_E2E=1` is set with local services available.
patterns-established:
  - Test-support routes are gated by test/development signals and unavailable in production.
  - Vitest excludes `apps/web/e2e/**`; Playwright owns browser specs.
requirements-completed:
  - TEST-06
  - VIEW-01
  - VIEW-02
  - VIEW-03
  - VIEW-04
  - VIEW-05
  - VIEW-06
  - VIEW-07
duration: 55 min
completed: 2026-05-17
---

# Phase 7 Plan 07-05: E2E Harness and Final Replay Verification Summary

**Playwright harness, replay fixture browser coverage, service smoke scaffold, and completed validation sign-off**

## Performance

- **Duration:** 55 min
- **Started:** 2026-05-17T23:33:00Z
- **Completed:** 2026-05-17T23:58:00Z
- **Tasks:** 4
- **Files modified:** 13

## Accomplishments

- Added root `pnpm e2e` and `playwright.config.ts` with desktop `1440x900` and mobile `390x844` Chromium projects.
- Added a deterministic replay fixture route and direct fixture data path for `/matches/{matchId}/replay`.
- Added Playwright coverage for replay route rendering, nonblank canvas output, scrubber/step behavior, inspector details, public privacy marker absence, and major callout labels.
- Added a gated Workshop-to-replay smoke harness that skips unless local services are explicitly enabled.
- Closed `07-VALIDATION.md` with `nyquist_compliant: true` and `wave_0_complete: true`.

## Task Commits

1. **Task 07-05-01: Add Playwright config and separate e2e command** - `83a80ff` (chore)
2. **Task 07-05-02: Add fixture-backed replay route checks** - `f0c03ef` (test)
3. **Task 07-05-03: Add service-backed Workshop-to-replay smoke E2E** - `66ab827` (test)
4. **Task 07-05-04: Close validation strategy and final verification** - `66d3e5a` (docs)

## Files Created/Modified

- `playwright.config.ts` - E2E config, projects, and web server.
- `apps/web/e2e/replay.fixture.spec.ts` - Fixture-backed replay browser assertions.
- `apps/web/e2e/workshop-to-replay.spec.ts` - Service-backed smoke harness, skipped unless `RUN_SERVICE_E2E=1`.
- `apps/web/app/api/test-support/replay-fixture/route.ts` - Gated fixture discovery route.
- `apps/web/app/api/test-support/run-worker-once/route.ts` - Gated service smoke helper placeholder.
- `apps/web/app/matches/replay-fixture.ts` - Deterministic replay fixture DTO.
- `apps/web/vitest.config.ts` - Keeps Vitest from collecting Playwright specs.
- `apps/web/app/matches/server.ts` - Serves the test fixture when gated.
- `apps/web/app/matches/[matchId]/replay/replay-board.tsx` - Stabilized React-owned canvas and Pixi cleanup for browser tests.
- `packages/persistence/package.json` - Added subpath exports to avoid bundling migration filesystem code into the replay page.
- `package.json` and `pnpm-lock.yaml` - Added `@playwright/test` and `pnpm e2e`.
- `07-VALIDATION.md` - Final validation status.

## Decisions Made

- Fixture-backed replay E2E is always runnable without local database services.
- Service-backed Workshop-to-replay E2E is present but gated because local Postgres/Redis were not running in this environment.
- Playwright uses Chromium for both desktop and mobile projects to keep local browser installation bounded.

## Deviations from Plan

- The service-backed smoke test is skipped by default and documented as requiring `RUN_SERVICE_E2E=1` plus local services. This keeps `PLAYWRIGHT_TEST=1 pnpm e2e` green in service-less environments while preserving the test harness for real service runs.
- The explicit 1180x800 and 820x1180 viewport checks remain documented as manual visual review items; automated Playwright coverage currently runs 1440x900 and 390x844.

## Issues Encountered

- Playwright browser binaries were missing locally; Chromium was installed with `pnpm exec playwright install chromium`.
- Next dev rewrote `apps/web/next-env.d.ts`; generated changes were restored before commit.
- The replay page initially imported the persistence package root, which pulled migration filesystem code into Next. Subpath exports and narrower imports fixed that.
- Pixi cleanup during React state changes initially blocked browser interaction; cleanup now stops the ticker and clears children instead of destroying the application on every timeline selection.

## Verification

- `pnpm verify` passed.
- `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts` passed.
- `PLAYWRIGHT_TEST=1 pnpm e2e -- workshop-to-replay.spec.ts` passed with 2 skipped service-gated tests.
- `PLAYWRIGHT_TEST=1 pnpm e2e` passed with 2 replay fixture tests passed and 2 service smoke tests skipped.

## User Setup Required

Run `RUN_SERVICE_E2E=1 PLAYWRIGHT_TEST=1 pnpm e2e -- workshop-to-replay.spec.ts` with local Postgres/Redis running when ready to exercise the full service-backed smoke path.

## Next Phase Readiness

Phase 7 is complete. The replay viewer has route, data facade, timeline, inspector, Pixi board, Workshop links, and browser verification.

## Self-Check: PASSED

---
*Phase: 07-replay-viewer-and-end-to-end-verification*
*Completed: 2026-05-17*
