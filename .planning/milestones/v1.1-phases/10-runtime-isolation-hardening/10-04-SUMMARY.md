---
phase: 10-runtime-isolation-hardening
plan: 04
subsystem: worker
tags: [worker, runtime-js, adapter-selection, system-failure]
requires:
  - phase: 10-runtime-isolation-hardening
    plan: 01
    provides: StrategyExecutionAdapter contract and worker-thread default.
  - phase: 10-runtime-isolation-hardening
    plan: 02
    provides: Opt-in subprocess adapter and SubprocessSystemFailure taxonomy.
  - phase: 10-runtime-isolation-hardening
    plan: 03
    provides: Hostile Strategy matrix and gameplay/system failure separation.
provides:
  - Worker runtime adapter resolver with worker-thread default and subprocess opt-in.
  - Startup visibility for active adapter id, label, and isolation boundary.
  - Adapter-aware runtime construction for bottom and top Strategy Revisions.
  - Retryable worker system failure details with adapter id and subprocess failure code.
affects: [worker-runtime-selection, match-execution, runtime-isolation]
requirements-completed: [ISO-01, ISO-02, ISO-07]
completed: 2026-05-18
---

# Phase 10 Plan 10-04 Summary

**Worker-side Strategy execution adapter selection is now explicit, visible, and propagated through Match execution.**

## Accomplishments

- Added `apps/worker/src/runtime-config.ts` with a whitelisted `createWorkerRuntimeConfig()` resolver.
- Preserved `worker-thread` as the default adapter and made `subprocess` available through explicit `STRATEGY_EXECUTION_ADAPTER` configuration.
- Added fail-closed behavior for unknown adapter ids before any Strategy source is loaded or executed by the runtime config path.
- Exposed active adapter metadata, including id, label, and isolation boundary text, and logged it at worker startup without Strategy source or secrets.
- Passed the selected adapter into both bottom and top `createRuntimeFromRevision()` calls when loading Match inputs.
- Added worker failure details that include the active adapter id and sanitized `SubprocessSystemFailure` code/details for retryable system failures.
- Kept player-caused `RuntimeResult` violations and Chronicle `RUNTIME_VIOLATION` events on the normal Match completion path.

## Files Created/Modified

- `apps/worker/src/runtime-config.ts` - Worker runtime adapter config resolver and startup log formatting.
- `apps/worker/src/runner.ts` - Adapter-aware runtime construction and sanitized system failure details.
- `apps/worker/src/runner.test.ts` - Config, propagation, startup visibility, and strategy/system failure tests.
- `apps/worker/src/index.ts` - Reads `STRATEGY_EXECUTION_ADAPTER`, logs active adapter metadata, and passes config to the loop.
- `.planning/phases/10-runtime-isolation-hardening/10-04-PLAN.md` - Marks plan status complete.
- `.planning/phases/10-runtime-isolation-hardening/10-04-SUMMARY.md` - Completion summary.

## Verification

- `pnpm --filter @cowards/worker test -- runner.test.ts`
- `pnpm --filter @cowards/worker typecheck`
- `pnpm --filter @cowards/runtime-js test -- subprocess-adapter.test.ts hostile-matrix.test.ts`

## Issues Encountered

- The worker test fixture initially imported the spec fixture barrel incorrectly; it was corrected to use `fixtures.valid.standardArenaVariant`.

## Next Phase Readiness

Plan 10-05 can audit the runtime isolation boundary with worker-level visibility and propagation now in place.

---
*Phase: 10-runtime-isolation-hardening*
*Completed: 2026-05-18*
