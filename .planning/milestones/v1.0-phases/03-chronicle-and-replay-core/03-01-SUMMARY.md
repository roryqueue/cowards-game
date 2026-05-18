---
phase: 03-chronicle-and-replay-core
plan: 03-01
subsystem: spec
tags: [typescript, zod, chronicle, replay, privacy, validation]

requires:
  - phase: 02-pure-rules-engine
    provides: deterministic event summaries, board snapshots, Match outcome contracts
provides:
  - Versioned Chronicle artifact contracts in @cowards/spec
  - Chronicle boundary snapshot, integrity, validation, migration, and projection contracts
  - Zod schemas and fixture coverage for minimal Chronicle artifacts
affects: [replay, engine, worker, persistence, replay-viewer]

tech-stack:
  added: []
  patterns:
    - Spec-owned canonical replay contracts
    - Explicit public/owner/private Chronicle privacy boundary
    - Typed validation errors for replay/version/integrity failures

key-files:
  created:
    - .planning/phases/03-chronicle-and-replay-core/03-01-SUMMARY.md
  modified:
    - packages/spec/src/types.ts
    - packages/spec/src/schemas.ts
    - packages/spec/src/spec.test.ts

key-decisions:
  - "Kept Chronicle contracts in packages/spec so replay, worker, persistence, and UI packages share one canonical artifact shape."
  - "Did not modify packages/spec/src/index.ts because it already re-exports schemas and types via wildcard exports."
  - "Modeled projection access as public or owner, with private sections remaining inside the canonical artifact rather than public event output."

patterns-established:
  - "Chronicle events carry sequence, contextual hierarchy, privacy classification, payload, and optional privateRef."
  - "Boundary snapshots capture replay anchors without embedding full board state in every event."
  - "Replay validation failures use structured ChronicleValidationError codes instead of raw strings."

requirements-completed: [REPLAY-02, REPLAY-04, REPLAY-05, REPLAY-06, REPLAY-07]

duration: 3min 22s
completed: 2026-05-16
---

# Phase 3 Plan 03-01: Chronicle Contracts and Schemas Summary

**Versioned Chronicle contracts with boundary snapshots, integrity metadata, validation errors, privacy sections, and Zod schema coverage**

## Performance

- **Duration:** 3min 22s
- **Started:** 2026-05-16T14:38:47Z
- **Completed:** 2026-05-16T14:42:09Z
- **Tasks:** 2
- **Files modified:** 3 source/test files plus this summary

## Accomplishments

- Added the canonical `Chronicle` artifact shape, reproducibility envelope, boundary snapshot contracts, integrity metadata, and migration hook types to `@cowards/spec`.
- Added explicit public/owner/private privacy contracts, public event projection shape, owner private section shape, and viewer/projection contracts.
- Added Zod schemas for Chronicle events, snapshots, reproducibility, integrity, private sections, validation errors/results, viewers, projections, and Match outcomes.
- Added a minimal Chronicle fixture test with required event types and owner-only private data.

## Task Commits

Each task was committed atomically:

1. **Task 03-01-01: Add canonical Chronicle types** - `ef19c39` (`feat`)
2. **Task 03-01-02: Add Chronicle Zod schemas and schema tests** - `a4dd902` (`test`)

## Files Created/Modified

- `packages/spec/src/types.ts` - Added Chronicle schema version, event context, privacy, boundary snapshots, reproducibility, integrity, private sections, validation, projection, and migration contracts.
- `packages/spec/src/schemas.ts` - Added Chronicle and projection Zod schemas plus `MatchOutcomeSchema`.
- `packages/spec/src/spec.test.ts` - Added a valid minimal Chronicle fixture parsed through `ChronicleSchema`.
- `.planning/phases/03-chronicle-and-replay-core/03-01-SUMMARY.md` - Recorded execution outcome and verification.

## Decisions Made

- Kept all new contracts inside `packages/spec` to preserve the planned ownership boundary for canonical replay artifacts.
- Left `packages/spec/src/index.ts` unchanged because its existing wildcard exports already expose the new types and schemas.
- Kept schemas structural at this layer; event ordering and integrity semantics are left to later replay validation plans.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None - the new Chronicle privacy, validation, and boundary snapshot surfaces were explicitly covered by the plan threat model.

## Verification

- `pnpm --filter @cowards/spec typecheck` - PASS
- `pnpm --filter @cowards/spec test -- spec.test.ts` - PASS, 1 file / 6 tests
- `pnpm verify` - PASS, format/lint/typecheck/test all successful across 8 packages

## Acceptance Criteria

- `packages/spec/src/types.ts` contains `export interface Chronicle` - PASS
- `packages/spec/src/types.ts` contains `export interface ChronicleBoundarySnapshot` - PASS
- `packages/spec/src/types.ts` contains `ChronicleValidationErrorCode` - PASS
- `packages/spec/src/types.ts` contains `ChronicleReproducibilityEnvelope` - PASS
- `packages/spec/src/schemas.ts` contains `export const ChronicleSchema` - PASS
- `packages/spec/src/schemas.ts` contains `export const ChronicleBoundarySnapshotSchema` - PASS
- `packages/spec/src/spec.test.ts` contains `ChronicleSchema.parse` - PASS

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03-02 can build Chronicle construction and boundary capture against the newly exported contracts and schemas.

## Self-Check: PASSED

- Verified created/modified files exist.
- Verified task commits `ef19c39` and `a4dd902` exist in git history.

---
*Phase: 03-chronicle-and-replay-core*
*Completed: 2026-05-16*
