---
phase: 10-runtime-isolation-hardening
plan: 01
subsystem: runtime
tags: [runtime-js, strategy-runtime, worker-thread, adapter-contract]
requires:
  - phase: 09-strict-chronicle-grammar-and-compatibility
    provides: Runtime violation behavior consumed by engine and replay flows.
provides:
  - Explicit StrategyExecutionAdapter contract and metadata.
  - Worker-thread adapter extraction preserving default runtime behavior.
  - Configurable createRuntimeFromRevision adapter injection.
  - Worker subpath metadata exports while the root entrypoint remains non-executing.
affects: [runtime-isolation, worker-runtime, adapter-selection]
tech-stack:
  added: []
  patterns: [adapter-contract, metadata-visible-runtime-boundary]
key-files:
  created:
    - packages/runtime-js/src/adapter.ts
    - packages/runtime-js/src/worker-thread-adapter.ts
    - packages/runtime-js/src/adapter-contract.test.ts
  modified:
    - packages/runtime-js/src/worker-bridge.ts
    - packages/runtime-js/src/executor.ts
    - packages/runtime-js/src/worker.ts
    - packages/runtime-js/src/executor.test.ts
    - .planning/phases/10-runtime-isolation-hardening/10-01-PLAN.md
key-decisions:
  - "Kept worker-thread as the default compatibility containment boundary while labeling it as not a final sandbox."
  - "Kept output normalization in executor.ts so engine rules continue to see only StrategyRuntime results."
patterns-established:
  - "Adapter metadata lives beside the adapter contract and is exported only from the executable worker subpath."
  - "createRuntimeFromRevision accepts adapter and timeout options without changing existing call sites."
requirements-completed: [ISO-01, ISO-02, ISO-03, ISO-05]
duration: 12min
completed: 2026-05-18
---

# Phase 10 Plan 10-01 Summary

**Strategy execution now has a visible adapter contract with worker-thread preserved as the default compatibility boundary.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-18T17:08:00Z
- **Completed:** 2026-05-18T17:20:16Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added `StrategyExecutionAdapter` request/options/metadata types and active/default metadata helpers.
- Extracted the default worker-thread adapter around `runStrategyMethodInWorker` without changing worker bridge behavior.
- Wired `createRuntimeFromRevision(revision, { adapter?, timeoutMs? })` so tests can inject custom adapters while default runtime behavior remains worker-thread based.
- Exported adapter metadata from `@cowards/runtime-js/worker` and added tests proving the safe root entrypoint remains non-executing.

## Task Commits

This plan is delivered as one atomic implementation commit containing tasks 1 through 3 plus plan metadata.

## Files Created/Modified

- `packages/runtime-js/src/adapter.ts` - Adapter contract, request/options types, and worker-thread default metadata.
- `packages/runtime-js/src/worker-thread-adapter.ts` - Default worker-thread adapter delegating to the existing bridge.
- `packages/runtime-js/src/worker-bridge.ts` - Reuses shared `StrategyMethodName` type while preserving worker creation behavior.
- `packages/runtime-js/src/executor.ts` - Adds adapter and timeout options while keeping engine-facing normalization.
- `packages/runtime-js/src/worker.ts` - Exports adapter metadata and adapter types from the executable worker subpath.
- `packages/runtime-js/src/adapter-contract.test.ts` - Covers metadata, contract shape, worker-thread delegation, timeout mapping, and worker subpath exports.
- `packages/runtime-js/src/executor.test.ts` - Covers custom adapter injection and safe root entrypoint boundaries.
- `.planning/phases/10-runtime-isolation-hardening/10-01-PLAN.md` - Marks plan status complete.

## Decisions Made

- Worker-thread metadata explicitly says it is default compatibility containment and a prototype boundary, not a final sandbox.
- Adapter output remains raw `unknown`; `executor.ts` still owns StrategyResult and SoldierBrainResult schema normalization before values reach the engine.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

None.

## Verification

- `pnpm --filter @cowards/runtime-js test -- adapter-contract.test.ts executor.test.ts`
- `pnpm --filter @cowards/runtime-js typecheck`

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 10-02 can build stronger subprocess or alternate adapter behavior behind the new contract without changing engine rules or existing runtime call sites.

---
*Phase: 10-runtime-isolation-hardening*
*Completed: 2026-05-18*
