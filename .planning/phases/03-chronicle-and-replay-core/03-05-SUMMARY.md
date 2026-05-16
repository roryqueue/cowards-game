---
phase: 03-chronicle-and-replay-core
plan: 03-05
subsystem: replay
tags: [typescript, vitest, chronicle, replay, determinism, documentation]

requires:
  - phase: 03-01
    provides: Versioned Chronicle contracts, validation error types, and schemas
  - phase: 03-02
    provides: Chronicle construction from deterministic engine transitions
  - phase: 03-03
    provides: Chronicle normalization, integrity hashing, validation, and reconstruction
  - phase: 03-04
    provides: Public and owner Chronicle projection utilities
provides:
  - Deterministic Chronicle equivalence tests over normalized content and content hashes
  - End-to-end replay integration coverage across build, validate, hash, reconstruct, iterate, and project APIs
  - Replay package README and green Phase 3 validation status
affects: [strategy-runtime, match-orchestration, persistence, replay-viewer]

tech-stack:
  added: []
  patterns:
    - Determinism assertions compare normalized Chronicle semantics and content hashes
    - Replay integration tests exercise the package public API as one pipeline
    - Public projection privacy checks use marker strings that must not survive serialization

key-files:
  created:
    - packages/replay/src/determinism.test.ts
    - packages/replay/src/integration.test.ts
    - packages/replay/README.md
    - .planning/phases/03-chronicle-and-replay-core/03-05-SUMMARY.md
  modified:
    - .planning/phases/03-chronicle-and-replay-core/03-VALIDATION.md
    - packages/replay/src/determinism.test.ts
    - packages/replay/src/integration.test.ts

key-decisions:
  - "Compared deterministic Chronicle output through normalizeChronicle() and createChronicleContentHash(), not raw serialized storage artifacts."
  - "Kept the replay package README focused on builder, normalization/hash, validation, reconstruction, and projection APIs."
  - "Marked Phase 3 validation green only after replay package tests, replay typecheck, and full pnpm verify passed."

patterns-established:
  - "Replay determinism tests should change reproducibility inputs such as seed or Strategy Revision ID when asserting hash differences."
  - "Replay integration tests should attach integrity metadata before validation and then reuse the same artifact for reconstruction and projections."

requirements-completed: [REPLAY-01, REPLAY-02, REPLAY-03, REPLAY-04, REPLAY-05, REPLAY-06, REPLAY-07, TEST-03]

duration: 5min 33s
completed: 2026-05-16
---

# Phase 3 Plan 03-05: Determinism, Integration Tests, and Replay Package Polish Summary

**Normalized Chronicle determinism, end-to-end replay package integration coverage, and green Phase 3 validation status**

## Performance

- **Duration:** 5min 33s
- **Started:** 2026-05-16T15:17:10Z
- **Completed:** 2026-05-16T15:22:43Z
- **Tasks:** 3
- **Files modified:** 5 source/docs/planning files plus this summary

## Accomplishments

- Added deterministic Chronicle tests proving independent builds with identical reproducibility inputs produce equal `normalizeChronicle()` content and equal `createChronicleContentHash()` output.
- Added a replay integration test that builds a deterministic Match Chronicle, attaches integrity, validates it, reconstructs final state with `stateAt`, iterates every event with `iterateReplay`, and verifies public/owner projection privacy.
- Added replay package documentation covering construction, validation/integrity, reconstruction, projections, and Phase 3 non-goals.
- Updated Phase 3 validation to `wave_0_complete: true` with green task statuses after `pnpm verify` passed.

## Task Commits

Each task was committed atomically:

1. **Task 03-05-01: Add deterministic Chronicle equivalence tests** - `174f690` (`test`)
2. **Task 03-05-02: Add end-to-end replay integration test** - `287c7f1` (`test`)
3. **Task 03-05-03: Polish replay exports, docs, and validation status** - `6657012` (`docs`)

## Files Created/Modified

- `packages/replay/src/determinism.test.ts` - Verifies normalized semantic Chronicle equality and normalized content hash determinism.
- `packages/replay/src/integration.test.ts` - Exercises Chronicle build, validate, hash, reconstruct, iterate, public projection, and owner projection as one deterministic pipeline.
- `packages/replay/README.md` - Documents replay package construction, validation/integrity, reconstruction, projections, and non-goals.
- `.planning/phases/03-chronicle-and-replay-core/03-VALIDATION.md` - Marks Phase 3 validation green and records final Plan 03-05 validation rows.
- `.planning/phases/03-chronicle-and-replay-core/03-05-SUMMARY.md` - Records execution outcome and verification.

## Decisions Made

- Used normalized Chronicle comparison and content hashing for determinism so storage metadata and serialization trivia cannot make deterministic tests brittle.
- Kept the integration test on public replay APIs instead of reaching into implementation internals.
- Left `packages/replay/src/index.ts` unchanged because it already exported `build`, `normalize`, `hash`, `validate`, `reconstruct`, and `project` modules.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed replay test runtime fixtures for typecheck**
- **Found during:** Task 03-05-03
- **Issue:** The new replay tests used `StrategyInput.playerId`, which does not exist on the canonical StrategyInput type. Vitest passed at runtime, but replay package typecheck and full `pnpm verify` failed.
- **Fix:** Derived the owner player from active Soldiers in the StrategyInput, matching existing runtime fixture patterns.
- **Files modified:** `packages/replay/src/determinism.test.ts`, `packages/replay/src/integration.test.ts`
- **Verification:** `pnpm --filter @cowards/replay typecheck` and `pnpm verify` passed.
- **Committed in:** `6657012`

**2. [Rule 2 - Missing Critical] Added missing final validation rows for Plan 03-05**
- **Found during:** Task 03-05-03
- **Issue:** `03-VALIDATION.md` had only one Plan 03-05 row, but this plan has determinism, integration, and package polish validation surfaces.
- **Fix:** Added green validation rows for integration coverage and replay package/docs verification after tests passed.
- **Files modified:** `.planning/phases/03-chronicle-and-replay-core/03-VALIDATION.md`
- **Verification:** `rg "wave_0_complete: true" .planning/phases/03-chronicle-and-replay-core/03-VALIDATION.md` and `pnpm verify` passed.
- **Committed in:** `6657012`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical validation traceability item)
**Impact on plan:** Both fixes improved correctness of the planned tests and validation tracking. No unrelated files were modified.

## Issues Encountered

- Initial `pnpm verify` found Prettier formatting in `packages/replay/src/integration.test.ts`; the file was formatted directly and the full verification passed.
- Local `gsd-sdk query` returned no output in this checkout, so state and roadmap updates were applied directly to planning files instead of SDK handlers.

## Known Stubs

None - the only empty object/default pattern found is a test helper default parameter in `packages/replay/src/determinism.test.ts`, not a UI or data-source stub.

## Threat Flags

None - the replay integration, hashing, validation, reconstruction, and projection surfaces were explicitly covered by the plan threat model.

## Verification

- `pnpm --filter @cowards/replay test -- determinism.test.ts` - PASS, replay package tests passed.
- `pnpm --filter @cowards/replay test -- integration.test.ts` - PASS, replay package tests passed.
- `pnpm --filter @cowards/replay test` - PASS, 7 files / 19 tests.
- `pnpm --filter @cowards/replay typecheck` - PASS.
- `pnpm verify` - PASS, format/lint/typecheck/test successful across 8 packages.

## Acceptance Criteria

- `packages/replay/src/determinism.test.ts` contains `normalizeChronicle` - PASS
- `packages/replay/src/determinism.test.ts` contains `createChronicleContentHash` - PASS
- `packages/replay/src/determinism.test.ts` contains `not.toEqual` - PASS
- `pnpm --filter @cowards/replay test -- determinism.test.ts` exits 0 - PASS
- `packages/replay/src/integration.test.ts` contains `validateChronicle` - PASS
- `packages/replay/src/integration.test.ts` contains `stateAt` - PASS
- `packages/replay/src/integration.test.ts` contains `iterateReplay` - PASS
- `packages/replay/src/integration.test.ts` contains `projectPublicChronicle` - PASS
- `pnpm --filter @cowards/replay test` exits 0 - PASS
- `packages/replay/README.md` contains `## Chronicle Construction` - PASS
- `packages/replay/README.md` contains `## Phase 3 Non-Goals` - PASS
- `packages/replay/src/index.ts` exports from `./build.js` - PASS
- `.planning/phases/03-chronicle-and-replay-core/03-VALIDATION.md` contains `wave_0_complete: true` - PASS
- `pnpm verify` exits 0 - PASS

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 4 can build the Strategy Runtime Sandbox against a green Chronicle/replay foundation. Replay APIs now cover construction, deterministic normalization/hash, typed validation, reconstruction, iteration, and privacy-safe projections.

## Self-Check: PASSED

- Verified created/modified files exist.
- Verified task commits `174f690`, `287c7f1`, and `6657012` exist in git history.

---
*Phase: 03-chronicle-and-replay-core*
*Completed: 2026-05-16*
