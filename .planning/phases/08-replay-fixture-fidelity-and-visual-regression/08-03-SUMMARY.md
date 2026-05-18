---
phase: 08-replay-fixture-fidelity-and-visual-regression
plan: 03
subsystem: replay
tags: [replay, chronicle, projection, fixtures, privacy, nextjs, vitest]
requires:
  - phase: 08-replay-fixture-fidelity-and-visual-regression
    provides: canonical replay scenarios from @cowards/test-utils
provides:
  - Shared Chronicle-to-ReplayReadyDto projection helper
  - Scenario-specific generated replay fixture bridge
  - Projection parity, privacy, owner gating, and fixture catalog tests
affects: [phase-08, replay-viewer, chronicle-projection, visual-regression]
tech-stack:
  added: [@cowards/test-utils dependency for @cowards/web]
  patterns:
    - Shared persisted/fixture ready replay assembly through createReplay and Chronicle projection
    - Scenario fixture Match IDs using match:e2e-replay-fixture[:scenario]
key-files:
  created:
    - apps/web/app/matches/replay-ready.ts
  modified:
    - apps/web/app/matches/types.ts
    - apps/web/app/matches/server.ts
    - apps/web/app/matches/server.test.ts
    - apps/web/app/matches/replay-fixture.ts
    - apps/web/app/matches/replay-fixture.test.ts
    - apps/web/app/api/test-support/replay-fixture/route.ts
    - apps/web/package.json
    - pnpm-lock.yaml
key-decisions:
  - "Persisted Match replay and generated fixture replay now share buildReadyReplayFromChronicle."
  - "The default web fixture remains match:e2e-replay-fixture but resolves to the generated compound-tour scenario."
  - "Owner fixture data is exposed only when owner mode, ownerPlayerId, and allowOwnerDebug are all present."
patterns-established:
  - "Projection failures from ready replay assembly are labeled with [projection]."
  - "Fixture scenario catalog entries expose replay hrefs derived from encoded fixture Match IDs."
requirements-completed: [FID-04, FID-07]
duration: 6min
completed: 2026-05-18
---

# Phase 8 Plan 03: Replay Fixture Projection Parity Summary

**Generated canonical replay fixtures now flow through the same Chronicle projection and replay reconstruction helper as persisted Match replays.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-18T14:04:23Z
- **Completed:** 2026-05-18T14:10:12Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Extracted `buildReadyReplayFromChronicle` and `buildReadyReplayFromStoredChronicle` into `apps/web/app/matches/replay-ready.ts`.
- Replaced the hand-authored web fixture DTO with generated canonical scenario Chronicles from `@cowards/test-utils`.
- Added scenario-specific fixture Match IDs, fixture route catalog output, projection parity assertions, public privacy checks, and owner-debug gating tests.

## Task Commits

1. **Tasks 1-3: Replay fixture projection parity** - `afe20b0` (feat)

## Files Created/Modified

- `apps/web/app/matches/replay-ready.ts` - Shared Chronicle-to-ready replay DTO assembly using `createReplay` plus public/owner projection.
- `apps/web/app/matches/types.ts` - Shared `GetMatchReplayOptions` type moved out of `server.ts`.
- `apps/web/app/matches/server.ts` - Persisted replay path delegates to the shared helper and fixture IDs resolve scenario selection.
- `apps/web/app/matches/server.test.ts` - Adds `[projection]` invalid Chronicle diagnostics coverage.
- `apps/web/app/matches/replay-fixture.ts` - Generated scenario fixture lookup, scenario-specific Match IDs, catalog, and canonical DTO bridge.
- `apps/web/app/matches/replay-fixture.test.ts` - Projection parity, state/timeline count parity, privacy, owner gating, and catalog tests.
- `apps/web/app/api/test-support/replay-fixture/route.ts` - Optional `scenario` query and catalog response.
- `apps/web/package.json` - Adds `@cowards/test-utils` as a workspace dependency.
- `pnpm-lock.yaml` - Records the web dependency link.

## Decisions Made

- The default fixture route keeps the legacy `match:e2e-replay-fixture` ID for existing E2E callers while mapping it to `compound-tour`.
- Scenario-specific fixtures use `match:e2e-replay-fixture:{scenarioId}` so the replay page path remains the same surface as persisted Matches.
- Fixture metadata uses the scenario Chronicle metadata but overrides the public route-facing Match ID so route and DTO agree.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Re-exported `GetMatchReplayOptions` from `server.ts`**
- **Found during:** Typecheck after Task 1
- **Issue:** Existing owner-debug code imported the type from `server.ts`.
- **Fix:** Kept the canonical type in `types.ts` and re-exported it from `server.ts` for compatibility.
- **Files modified:** `apps/web/app/matches/server.ts`
- **Verification:** `pnpm --filter @cowards/web typecheck`
- **Committed in:** `afe20b0`

**2. [Rule 3 - Blocking] Added `@cowards/test-utils` to web dependencies**
- **Found during:** Task 2
- **Issue:** Web fixture code now imports canonical replay scenarios from the workspace package.
- **Fix:** Added `@cowards/test-utils` to `apps/web/package.json` and `pnpm-lock.yaml`.
- **Files modified:** `apps/web/package.json`, `pnpm-lock.yaml`
- **Verification:** `pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts` and `pnpm --filter @cowards/web typecheck`
- **Committed in:** `afe20b0`

**Total deviations:** 2 auto-fixed blocking issues
**Impact on plan:** Both fixes were required to complete the planned shared projection path without changing architecture.

## Issues Encountered

- Typecheck caught a null/undefined mismatch in scenario selection and a union narrowing issue in the invalid Chronicle test; both were fixed before commit.
- The `gsd-sdk` available on PATH did not expose the required `query` handlers, and no project-local `gsd-sdk` binary was present, so automated STATE/ROADMAP/REQUIREMENTS handler updates could not run.

## Known Stubs

None.

## Auth Gates

None.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: test-support-route | `apps/web/app/api/test-support/replay-fixture/route.ts` | Fixture route now exposes scenario catalog and optional scenario selection, still gated by the existing test/development environment check. |

## Verification

- `pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts`
- `pnpm --filter @cowards/web typecheck`

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Projection parity is ready for Phase 8 visual regression work. The web fixture endpoint can now enumerate canonical scenarios and open each through the same replay viewer route shape as persisted Matches.

## Self-Check: PASSED

- Created file exists: `apps/web/app/matches/replay-ready.ts`
- Summary file exists: `.planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-03-SUMMARY.md`
- Implementation commit exists: `afe20b0`
- Acceptance commands passed after formatting.

---
*Phase: 08-replay-fixture-fidelity-and-visual-regression*
*Completed: 2026-05-18*
