---
phase: 10-runtime-isolation-hardening
plan: 03
subsystem: runtime
tags: [runtime-js, hostile-strategy, failure-taxonomy, adapter-contract]
requires:
  - phase: 10-runtime-isolation-hardening
    plan: 01
    provides: StrategyExecutionAdapter contract and worker-thread default.
  - phase: 10-runtime-isolation-hardening
    plan: 02
    provides: Opt-in subprocess adapter and SubprocessSystemFailure taxonomy.
provides:
  - Table-driven hostile Strategy matrix across createRuntimeFromRevision.
  - Schema-backed public RuntimeViolationType tuple.
  - Negative tests excluding infrastructure labels from gameplay violation semantics.
  - Worker-thread and subprocess adapter runtime contract coverage.
affects: [runtime-isolation, runtime-taxonomy, adapter-contract]
requirements-completed: [ISO-05, ISO-06, ISO-07]
completed: 2026-05-18
---

# Phase 10 Plan 10-03 Summary

**Hostile Strategy behavior is now covered by a matrix, and infrastructure failures remain outside public gameplay violation semantics.**

## Accomplishments

- Added `packages/runtime-js/src/hostile-matrix.test.ts` with table-driven coverage for forbidden globals, dynamic import rejection, process/worker/filesystem/network attempts, infinite loops, memory pressure, oversized output, invalid output, and thrown exceptions.
- Ran hostile cases through `createRuntimeFromRevision`; forged-valid revisions are used only for runtime-layer escape attempts that validation already rejects.
- Extended adapter contract coverage so worker-thread and subprocess adapters both prove valid output, invalid output, and timeout behavior through the runtime boundary.
- Added a subprocess malformed-IPC contract assertion that throws `SubprocessSystemFailure` instead of producing a gameplay `RuntimeViolation`.
- Converted public runtime violation types to the exported `RUNTIME_VIOLATION_TYPES` tuple and wired `RuntimeViolationTypeSchema` to it.
- Added spec tests proving player-caused types parse and infrastructure labels such as `MALFORMED_IPC`, `SUBPROCESS_EXIT`, `SUBPROCESS_SIGNAL`, `SPAWN_FAILED`, and `SYSTEM_FAILURE` are rejected by public violation schemas and Chronicle runtime violation payloads.

## Files Modified

- `packages/runtime-js/src/hostile-matrix.test.ts`
- `packages/runtime-js/src/adapter-contract.test.ts`
- `packages/spec/src/types.ts`
- `packages/spec/src/schemas.ts`
- `packages/spec/src/spec.test.ts`
- `.planning/phases/10-runtime-isolation-hardening/10-03-PLAN.md`
- `.planning/phases/10-runtime-isolation-hardening/10-03-SUMMARY.md`

## Verification

- `pnpm --filter @cowards/runtime-js test -- hostile-matrix.test.ts adapter-contract.test.ts subprocess-adapter.test.ts executor.test.ts`
- `pnpm --filter @cowards/spec test -- spec.test.ts`
- `pnpm --filter @cowards/runtime-js typecheck`
- `pnpm --filter @cowards/spec typecheck`

## Issues Encountered

- TypeScript initially inferred the hostile matrix as a narrow literal union, hiding optional fields on some rows. The matrix was flattened to the explicit `HostileCase` type; no behavior changes were needed.

## Next Phase Readiness

Plan 10-04 can propagate `SubprocessSystemFailure` through worker orchestration knowing runtime package tests keep player-caused violations and infrastructure failures distinct.

---
*Phase: 10-runtime-isolation-hardening*
*Completed: 2026-05-18*
