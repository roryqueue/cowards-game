---
phase: 04-strategy-runtime-sandbox
plan: 04-01
subsystem: runtime-contracts
tags: [runtime-js, strategy-revision, zod, spec]

requires:
  - phase: 03-replay-chronicle
    provides: compatibility versions and replay-safe spec exports
provides:
  - Canonical Strategy Revision TypeScript contracts
  - Zod schemas for Strategy Revision artifacts and validation reports
  - Safe default runtime-js public entrypoint
affects: [runtime-js, spec, persistence, workshop]

tech-stack:
  added: []
  patterns: [spec-owned contracts, safe runtime default export]

key-files:
  created: []
  modified:
    - packages/spec/src/types.ts
    - packages/spec/src/schemas.ts
    - packages/spec/src/spec.test.ts
    - packages/runtime-js/src/index.ts

key-decisions:
  - "Strategy Revision identity and validation metadata live in @cowards/spec so persistence, UI, replay, and runtime code can share one contract."
  - "The default @cowards/runtime-js entrypoint remains safe-only; executable APIs are deferred to the worker-only export."

patterns-established:
  - "Validation reports use structured issue codes and a schema refinement tying valid to an empty errors array."
  - "Strategy Revision artifacts include raw source plus deterministic source metadata, but no clocks, random IDs, queue state, or match execution state."

requirements-completed: [RUN-01, RUN-02, RUN-05, RUN-10]

duration: 15min
completed: 2026-05-16
---

# Phase 4 Plan 04-01: Strategy Revision Contracts and Safe API Surface Summary

**Spec-owned Strategy Revision artifacts with schema validation and a non-executable runtime-js default API**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-16T17:01:00Z
- **Completed:** 2026-05-16T17:15:57Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added canonical Strategy Revision types, validation issue codes, metadata, and runtime compatibility fields.
- Added Zod schemas and contract tests for valid revisions, oversized source rejection, and invalid validation reports.
- Replaced the runtime-js placeholder with safe named exports only.

## Task Commits

Each task was committed atomically:

1. **Task 04-01-01: Add canonical Strategy Revision types** - `1356708` (feat)
2. **Task 04-01-02: Add Strategy Revision schemas and schema tests** - `0e838e7` (test)
3. **Task 04-01-03: Prepare runtime-js safe entrypoint exports** - `1005465` (feat)

**Plan metadata:** pending final commit

## Files Created/Modified

- `packages/spec/src/types.ts` - Adds Strategy Revision contracts and validation report shape.
- `packages/spec/src/schemas.ts` - Adds Strategy Revision schemas and validation report refinement.
- `packages/spec/src/spec.test.ts` - Adds Strategy Revision schema coverage.
- `packages/runtime-js/src/index.ts` - Exposes only safe runtime package constants and spec types.

## Decisions Made

Strategy Revision source and validation metadata were kept in the spec package so future persistence, Workshop UI, and replay flows do not depend on executable runtime modules.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Runtime-js typecheck initially saw stale spec declarations from the ignored `dist` output. Running `pnpm --filter @cowards/spec build` refreshed the local build artifacts; no tracked files were added.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 04-02 can build deterministic hashing, validation, transpilation, and immutable revision construction on top of the new shared contracts.

---
*Phase: 04-strategy-runtime-sandbox*
*Completed: 2026-05-16*
