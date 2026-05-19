---
phase: 10-runtime-isolation-hardening
plan: 02
subsystem: runtime
tags: [runtime-js, subprocess, ipc, isolation, system-failure]
requires:
  - phase: 10-runtime-isolation-hardening
    plan: 01
    provides: StrategyExecutionAdapter contract and worker-thread default.
provides:
  - Opt-in subprocess StrategyExecutionAdapter exported from the worker subpath.
  - One-shot JSON IPC request and response guards.
  - Stable stdout and stderr byte caps with system failure classification.
  - Subprocess system failure class for malformed IPC, spawn failure, stdio cap overflow, nonzero exit, and signal termination.
affects: [runtime-isolation, subprocess-runtime, adapter-selection]
tech-stack:
  added: []
  patterns: [json-ipc, no-shell-subprocess, typed-system-failure]
key-files:
  created:
    - packages/runtime-js/src/subprocess-ipc.ts
    - packages/runtime-js/src/subprocess-harness.ts
    - packages/runtime-js/src/subprocess-adapter.ts
    - packages/runtime-js/src/subprocess-adapter.test.ts
  modified:
    - packages/runtime-js/src/worker.ts
    - .planning/phases/10-runtime-isolation-hardening/10-02-PLAN.md
key-decisions:
  - "Kept worker-thread as the active default and made subprocess execution opt-in through @cowards/runtime-js/worker."
  - "Used a synchronous child-process adapter to match the existing synchronous StrategyExecutionAdapter contract."
  - "Classified subprocess infrastructure failures with SubprocessSystemFailure instead of gameplay RuntimeViolation values."
requirements-completed: [ISO-04, ISO-05, ISO-07]
completed: 2026-05-18
---

# Phase 10 Plan 10-02 Summary

**Subprocess Strategy execution is now available as an opt-in adapter with bounded JSON IPC.**

## Accomplishments

- Added strict JSON-only IPC guards for subprocess requests and runtime-result-shaped responses.
- Added stable stdout and stderr caps and helper validation that rejects oversized subprocess output before parsing it as trusted JSON.
- Added a child-process harness that reads one JSON request from stdin and writes one JSON response to stdout.
- Added `createSubprocessStrategyExecutionAdapter()` with no shell, stdio pipes, minimal explicit env, timeout kill behavior, and no `process.env` inheritance.
- Exported the subprocess adapter and `SubprocessSystemFailure` from the executable worker subpath while leaving worker-thread as the default adapter.
- Added tests covering valid execution, spawn options, timeout, stdio cap overflow, malformed JSON, nonzero exit, signal termination, spawn failure, and schema-invalid output.

## Files Created/Modified

- `packages/runtime-js/src/subprocess-ipc.ts` - JSON IPC guards, byte caps, and shared subprocess system failure type.
- `packages/runtime-js/src/subprocess-harness.ts` - Child-side one-shot Strategy execution harness.
- `packages/runtime-js/src/subprocess-adapter.ts` - Opt-in subprocess adapter implementation.
- `packages/runtime-js/src/subprocess-adapter.test.ts` - Subprocess IPC, adapter, and failure taxonomy coverage.
- `packages/runtime-js/src/worker.ts` - Worker subpath exports for the opt-in adapter and system failure type.
- `.planning/phases/10-runtime-isolation-hardening/10-02-PLAN.md` - Marks plan status complete.

## Verification

- `pnpm --filter @cowards/runtime-js lint`
- `pnpm --filter @cowards/runtime-js test -- subprocess-adapter.test.ts adapter-contract.test.ts`
- `pnpm --filter @cowards/runtime-js typecheck`

## Issues Encountered

None.

## Next Phase Readiness

Plan 10-04 can now propagate `SubprocessSystemFailure` through worker orchestration as system failure behavior without changing engine gameplay semantics.

---
*Phase: 10-runtime-isolation-hardening*
*Completed: 2026-05-18*
