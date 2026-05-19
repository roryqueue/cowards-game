---
phase: 11-doctrine-debugging-ux
plan: 02
subsystem: persistence
tags: [workshop, samples, validation, runtime-js]
requires:
  - phase: 10-runtime-isolation-hardening
    provides: Runtime violation taxonomy and Strategy validation boundaries
provides:
  - Workshop sample catalog with starter and failure-mode metadata
  - Doctrine mechanics starter samples for Advance, push setup, Backstab setup, and STONE blocking
  - Failure-mode samples for forbidden capability validation and runtime violation teaching inputs
affects: [workshop, runtime-js, doctrine-debugging]
tech-stack:
  added: []
  patterns: [typed catalog metadata, validation-backed built-in samples]
key-files:
  created:
    - .planning/phases/11-doctrine-debugging-ux/11-02-SUMMARY.md
  modified:
    - packages/persistence/src/workshop.ts
    - packages/persistence/src/workshop.test.ts
    - packages/runtime-js/src/validation.test.ts
key-decisions:
  - "Kept listWorkshopTemplates() as valid templates only and added a sibling sample catalog."
  - "Represented runtime-only failure samples with expectedRuntimeViolationType instead of forcing validation failure."
patterns-established:
  - "Workshop samples include sampleKind, concise description, source, validation, and explicit failure expectations."
requirements-completed: [DEBUG-02]
duration: 32min
completed: 2026-05-18
---

# Phase 11 Plan 11-02 Summary

**Workshop Strategy samples now teach doctrine mechanics and intentional failure modes through typed, validation-backed catalog entries.**

## Performance

- **Duration:** 32 min
- **Started:** 2026-05-18T14:06:00-04:00
- **Completed:** 2026-05-18T14:38:13-04:00
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added `WorkshopSampleSummary` and `listWorkshopSamples()` beside the existing valid template contract.
- Added starter samples for basic Advance/turn, push setup, Backstab setup, and stoning/blocking.
- Added failure-mode samples for forbidden clock access, invalid Strategy API output, and thrown SoldierBrain exceptions.
- Added tests asserting sample metadata, starter validation success, explicit failure expectations, and runtime validation boundary coverage.

## Files Created/Modified

- `packages/persistence/src/workshop.ts` - Adds the typed sample catalog and includes it in Workshop snapshots.
- `packages/persistence/src/workshop.test.ts` - Covers sample metadata, stable starter ids, validation success, and failure expectation codes/types.
- `packages/runtime-js/src/validation.test.ts` - Adds duplicated failure-mode sample sources as validation regression inputs.
- `.planning/phases/11-doctrine-debugging-ux/11-02-SUMMARY.md` - Records Plan 11-02 completion context.

## Decisions Made

- Preserved `listWorkshopTemplates()` as only the original valid starter templates so current Workshop consumers do not accidentally select failure-mode examples as templates.
- Added `expectedRuntimeViolationType` for samples that are syntactically valid but only fail during execution.
- Duplicated the small failure-mode sources in `runtime-js` validation tests instead of adding a package dependency from runtime tests to persistence.

## Deviations from Plan

None - the implementation stayed within the requested files. Runtime validation test changes were limited to sample regression coverage.

## Issues Encountered

- `pnpm --filter @cowards/persistence test -- workshop.test.ts` currently runs the whole persistence suite and fails in unrelated `chronicle-store.test.ts` fixtures with `STRATEGY_EVALUATED requires context.roundNumber`.
- The directly targeted Workshop test file passes with `pnpm --filter @cowards/persistence exec vitest run src/workshop.test.ts`.
- Concurrent runtime/spec edits were present in the worktree; this plan only stages the sample regression hunk from `packages/runtime-js/src/validation.test.ts`.

## Verification

- `pnpm --filter @cowards/persistence exec vitest run src/workshop.test.ts` - pass, 11 tests.
- `pnpm --filter @cowards/runtime-js test -- validation.test.ts` - pass, 9 files / 152 tests under the current workspace state.
- `pnpm --filter @cowards/persistence typecheck` - pass.
- `pnpm --filter @cowards/persistence test -- workshop.test.ts` - fails because unrelated `src/chronicle-store.test.ts` tests fail on missing `context.roundNumber`.

## Next Phase Readiness

The Workshop data layer can now expose starter and failure-mode Strategy samples to UI work without weakening valid template assumptions. Follow-on UI plans can render `samples` separately from `templates` and use failure metadata to label examples clearly.

---
*Phase: 11-doctrine-debugging-ux*
*Completed: 2026-05-18*
