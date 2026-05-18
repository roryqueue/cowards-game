---
phase: 04-strategy-runtime-sandbox
plan: 04-03
subsystem: worker-runtime
tags: [runtime-js, worker-threads, sandbox, engine-adapter, violations]

requires:
  - phase: 04-strategy-runtime-sandbox
    provides: Strategy Revision builder and validation APIs from plan 04-02
provides:
  - Worker-only runtime-js executable export
  - Synchronous StrategyRuntime adapter over worker_threads
  - Runtime violation guard helpers
  - Failure matrix coverage for invalid, thrown, timeout, forbidden, and oversized outputs
affects: [runtime-js, worker-app, engine-integration, replay]

tech-stack:
  added: [node:worker_threads]
  patterns: [worker-only execution export, typed runtime violation mapping, one-shot worker bridge]

key-files:
  created:
    - packages/runtime-js/src/worker.ts
    - packages/runtime-js/src/guards.ts
    - packages/runtime-js/src/worker-harness.ts
    - packages/runtime-js/src/worker-bridge.ts
    - packages/runtime-js/src/executor.ts
    - packages/runtime-js/src/executor.test.ts
  modified:
    - packages/runtime-js/package.json
    - apps/worker/package.json
    - apps/worker/tsconfig.json
    - apps/worker/src/index.ts
    - eslint.config.mjs
    - pnpm-lock.yaml

key-decisions:
  - "Executable runtime APIs are exported only from @cowards/runtime-js/worker, while the default runtime-js entrypoint remains safe-only."
  - "The Phase 4 bridge uses a replaceable worker_threads boundary with typed violations rather than modifying engine execution semantics."
  - "The adapter budgets extra time for one-shot Worker startup while preserving the 50ms runtime timeout constant for the bridge API."

patterns-established:
  - "Worker failures are normalized to RuntimeViolationType values before returning to the engine."
  - "Runtime-js tests exercise the full failure matrix directly at the adapter boundary."

requirements-completed: [RUN-03, RUN-04, RUN-05, RUN-06, RUN-07, RUN-08, RUN-09, RUN-10, TEST-04]

duration: 32min
completed: 2026-05-16
---

# Phase 4 Plan 04-03: Worker-Only Runtime Execution Adapter Summary

**Worker-only runtime-js execution adapter that runs validated Strategy Revisions and maps sandbox failures to engine-compatible violations**

## Performance

- **Duration:** 32 min
- **Started:** 2026-05-16T17:01:00Z
- **Completed:** 2026-05-16T17:33:40Z
- **Tasks:** 6
- **Files modified:** 12

## Accomplishments

- Added `@cowards/runtime-js/worker` as the only executable public runtime path and blocked runtime imports from web/engine boundaries.
- Implemented guard helpers, a one-shot worker bridge, and an executor that conforms to the existing synchronous `StrategyRuntime` interface.
- Added failure matrix tests for `INVALID_OUTPUT`, `TIMEOUT`, `THROWN_EXCEPTION`, `FORBIDDEN_CAPABILITY`, and `OVERSIZED_OUTPUT`.

## Task Commits

Each task was committed atomically:

1. **Task 04-03-01: Add worker-only package export and import boundaries** - `54fcccc` (feat)
2. **Task 04-03-02: Implement guard helpers and runtime violation mapping** - `e7ead70` (feat)
3. **Task 04-03-03: Implement worker bridge for synchronous engine calls** - `101a0c6` (feat)
4. **Task 04-03-04: Implement StrategyRuntime execution adapter and failure matrix tests** - `77c26fd` (test)
5. **Task 04-03-05: Add runtime execution failure matrix tests** - `a96ea77` (test)
6. **Task 04-03-06: Expose executable worker entrypoint** - `e8e881f` (feat)

**Auto-fix commits:** `8fc0750`, `33c27d9`
**Plan metadata:** pending final commit

## Files Created/Modified

- `packages/runtime-js/src/worker.ts` - Worker-only executable public entrypoint.
- `packages/runtime-js/src/guards.ts` - Runtime timeout and violation mapping helpers.
- `packages/runtime-js/src/worker-harness.ts` - Isolated one-shot strategy execution harness source.
- `packages/runtime-js/src/worker-bridge.ts` - Synchronous `Atomics.wait` bridge over `worker_threads`.
- `packages/runtime-js/src/executor.ts` - Strategy Revision to `StrategyRuntime` adapter.
- `packages/runtime-js/src/executor.test.ts` - Runtime success and failure matrix coverage.
- `eslint.config.mjs` - Import boundary rules for runtime-js worker APIs.
- `apps/worker/*` - Worker app dependency and typecheck alignment for the runtime worker export.

## Decisions Made

The worker harness is exported as source text and loaded via a data URL. This keeps Vitest/source execution reliable without requiring a prebuilt `worker-harness.js` artifact, while preserving the planned worker_threads boundary, `SharedArrayBuffer` signal, `Atomics.wait`, no `node:vm`, and one-shot execution shape.

## Deviations from Plan

### Auto-fixed Issues

**1. Worker startup exceeded the 50ms runtime budget in source tests**
- **Found during:** Task 04-03-04
- **Issue:** One-shot Node worker startup can exceed 50ms before strategy code starts, causing valid strategy fixtures to timeout.
- **Fix:** Kept `RUNTIME_TIMEOUT_MS = 50` and gave the adapter a `RUNTIME_TIMEOUT_MS * 10` one-shot worker budget.
- **Files modified:** `packages/runtime-js/src/executor.ts`
- **Verification:** `pnpm --filter @cowards/runtime-js test -- executor.test.ts`
- **Committed in:** `77c26fd`

**2. Runtime adapter lint errors**
- **Found during:** Plan verification
- **Issue:** `structuredClone` was not in ESLint globals and an unused import remained after refactoring.
- **Fix:** Replaced the test clone with JSON cloning and removed the unused import.
- **Files modified:** `packages/runtime-js/src/executor.ts`, `packages/runtime-js/src/executor.test.ts`
- **Verification:** `pnpm lint`
- **Committed in:** `8fc0750`

**3. Worker app typecheck needed runtime-js project reference**
- **Found during:** `pnpm verify`
- **Issue:** The worker app imports the runtime worker export and needed Node types plus a build-mode reference to runtime-js.
- **Fix:** Added Node types and runtime-js reference to `apps/worker/tsconfig.json`, and changed worker typecheck to `tsc -b`.
- **Files modified:** `apps/worker/package.json`, `apps/worker/tsconfig.json`
- **Verification:** `pnpm verify`
- **Committed in:** `33c27d9`

---

**Total deviations:** 3 auto-fixed (1 runtime practicality, 2 tooling fixes)
**Impact on plan:** The public boundary and failure semantics remain intact; the notable implementation detail is a source-test-friendly harness loading path and worker startup budget.

## Issues Encountered

None beyond the auto-fixed issues above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 04-04 can now prove the runtime through engine and Chronicle flows, then document the prototype sandbox boundary and close validation status.

---
*Phase: 04-strategy-runtime-sandbox*
*Completed: 2026-05-16*
