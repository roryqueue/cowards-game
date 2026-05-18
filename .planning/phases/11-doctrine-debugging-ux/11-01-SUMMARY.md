---
phase: 11-doctrine-debugging-ux
plan: 01
subsystem: runtime
tags: [typescript, zod, validation, runtime-js]
requires:
  - phase: 10-runtime-isolation-hardening
    provides: Runtime violation taxonomy and Strategy runtime boundaries
provides:
  - Shared validation guidance DTO fields
  - Runtime violation user guidance DTO and schema
  - Actionable Strategy validation issue metadata
  - Privacy-safe runtime violation guidance mapper
affects: [11-doctrine-debugging-ux, workshop, replay, runtime-js]
tech-stack:
  added: []
  patterns: [typed guidance metadata, safe runtime violation mapping]
key-files:
  created:
    - .planning/phases/11-doctrine-debugging-ux/11-01-SUMMARY.md
  modified:
    - packages/spec/src/types.ts
    - packages/spec/src/schemas.ts
    - packages/spec/src/spec.test.ts
    - packages/runtime-js/src/validation.ts
    - packages/runtime-js/src/guards.ts
    - packages/runtime-js/src/validation.test.ts
key-decisions:
  - "Keep existing validation messages and codes while adding optional constraint, remediation, and reference fields."
  - "Map runtime violation guidance only from RuntimeViolation.type, never from raw violation.message."
patterns-established:
  - "Validation issues carry concise Strategy API constraint and remediation metadata beside stable codes."
  - "Runtime violations expose user-safe labels through a pure type-keyed mapper."
requirements-completed: [DEBUG-01]
duration: 28min
completed: 2026-05-18
---

# Phase 11: Plan 11-01 Summary

**Actionable validation and runtime violation contracts with concise Strategy API constraints and remediation paths.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-05-18T18:11:00Z
- **Completed:** 2026-05-18T18:39:08Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Added optional `constraint`, `remediation`, and `reference` fields to Strategy validation issues while preserving legacy report compatibility.
- Added shared runtime violation user guidance DTO/schema for `{ label, constraint, remediation }`.
- Updated every `validateStrategySource` error path to emit non-empty actionable guidance, including source size, forbidden/imported capabilities, async methods, missing Strategy API members, transpile failure, and compatibility mismatch.
- Added `describeRuntimeViolationForUser` to map runtime violation types to deterministic, user-safe copy without forwarding raw runtime details.

## Task Commits

Committed together atomically for Plan 11-01.

## Files Created/Modified

- `packages/spec/src/types.ts` - Shared validation issue guidance fields and runtime guidance DTO.
- `packages/spec/src/schemas.ts` - Zod validation for guidance fields and runtime guidance DTO.
- `packages/spec/src/spec.test.ts` - Schema coverage for guidance fields, empty-field rejection, and compatibility with legacy issues.
- `packages/runtime-js/src/validation.ts` - Guidance metadata emitted for all Strategy validation issue codes.
- `packages/runtime-js/src/guards.ts` - User-safe runtime violation guidance mapper.
- `packages/runtime-js/src/validation.test.ts` - Validation and runtime guidance behavior coverage.
- `.planning/phases/11-doctrine-debugging-ux/11-01-SUMMARY.md` - Plan completion summary.

## Decisions Made

Guidance fields are optional in the shared validation issue contract so existing persisted validation reports remain valid. Runtime violation copy is intentionally keyed by violation type only, which keeps raw exception messages, stack traces, source text, memory values, and objective payloads out of user-facing guidance.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

One runtime test initially caught that the default-export remediation did not explicitly say "Strategy object"; the copy was tightened and the verification commands were rerun.

## Verification

- `pnpm --filter @cowards/spec test -- spec.test.ts` - passed
- `pnpm --filter @cowards/runtime-js test -- validation.test.ts` - passed
- `pnpm --filter @cowards/spec typecheck` - passed
- `pnpm --filter @cowards/runtime-js typecheck` - passed

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 11-02 can render and reuse these guidance fields without inventing UI-side Strategy API rules or exposing raw runtime details.

---
*Phase: 11-doctrine-debugging-ux*
*Completed: 2026-05-18*
