---
phase: 03-chronicle-and-replay-core
plan: 03-03
subsystem: replay
tags: [typescript, chronicle, replay, validation, integrity, reconstruction]

requires:
  - phase: 03-01
    provides: Versioned Chronicle contracts, validation error types, integrity metadata, and schemas
  - phase: 03-02
    provides: Chronicle construction with semantic events, boundary snapshots, and owner-private sections
provides:
  - Deterministic Chronicle normalization and sha256 content hashing
  - Typed Chronicle validation for schema, version, ordering, required events, snapshots, migrations, and hash integrity
  - Chronicle-only replay reconstruction with stateAt(sequence) and linear iteration
affects: [replay-projection, replay-viewer, match-orchestration, persistence]

tech-stack:
  added: []
  patterns:
    - Replay utilities return structured ChronicleValidationError values instead of raw failures
    - Replay reconstruction uses boundary snapshots plus semantic Chronicle events only
    - Content hashes normalize deterministic replay content and exclude storage metadata/integrity

key-files:
  created:
    - packages/replay/src/normalize.ts
    - packages/replay/src/hash.ts
    - packages/replay/src/validate.ts
    - packages/replay/src/reconstruct.ts
    - packages/replay/src/integrity.test.ts
    - packages/replay/src/validate.test.ts
    - packages/replay/src/reconstruct.test.ts
  modified:
    - packages/replay/src/build.ts
    - packages/replay/src/index.ts
    - packages/replay/tsconfig.json

key-decisions:
  - "Kept replay reconstruction independent of StrategyRuntime and engine transition execution; Chronicle snapshots/events are the replay truth."
  - "Hashing excludes storageMetadata and existing integrity metadata so persistence details cannot alter deterministic content hashes."
  - "Validation returns typed ChronicleValidationError values for corruption, version, snapshot, ordering, migration, and integrity failures."

patterns-established:
  - "stateAt(sequence) starts from the nearest boundary snapshot and applies semantic event effects until the requested sequence."
  - "iterateReplay() yields ordered event/state pairs using the same reconstruction core as stateAt."
  - "Unsupported future Chronicle versions have a migrateChronicle() extension hook that currently returns UNSUPPORTED_MIGRATION."

requirements-completed: [REPLAY-03, REPLAY-04, REPLAY-05, TEST-03]

duration: 9min 36s
completed: 2026-05-16
---

# Phase 3 Plan 03-03: Replay Reconstruction, Validation, and Integrity Summary

**Chronicle integrity hashing, typed validation, and snapshot/event replay reconstruction without StrategyRuntime execution**

## Performance

- **Duration:** 9min 36s
- **Started:** 2026-05-16T14:57:29Z
- **Completed:** 2026-05-16T15:07:05Z
- **Tasks:** 3
- **Files modified:** 10 source/config/test files plus this summary

## Accomplishments

- Added deterministic Chronicle normalization and sha256 content hashing over replay-relevant content while excluding nondeterministic storage metadata and existing integrity metadata.
- Added typed Chronicle validation for schema failures, incompatible versions, event ordering, required completed-match events, boundary snapshots, hash mismatches, and unsupported migrations.
- Added `createReplay`, `stateAt(sequence)`, and `iterateReplay()` to reconstruct board truth and outcomes from Chronicle snapshots/events only.
- Added focused replay tests covering integrity, validation failures, movement, push, Backstab, stoning, match end, and invalid Chronicle errors.

## Task Commits

Each task was committed atomically:

1. **Task 03-03-01: Implement normalization and content hashing** - `24edd98` (`feat`)
2. **Task 03-03-02: Implement typed Chronicle validation** - `adc629a` (`feat`)
3. **Task 03-03-03: Implement stateAt and linear replay iterator** - `f153227` (`feat`)
4. **Verification cleanup: Format replay validation and reconstruction files** - `40709a5` (`style`)

## Files Created/Modified

- `packages/replay/src/normalize.ts` - Deterministic normalized Chronicle content shape.
- `packages/replay/src/hash.ts` - Stable recursive stringify and sha256 Chronicle content hash helper.
- `packages/replay/src/validate.ts` - Typed Chronicle validation and unsupported migration hook.
- `packages/replay/src/reconstruct.ts` - Chronicle-only replay reconstruction with `stateAt` and `iterateReplay`.
- `packages/replay/src/integrity.test.ts` - Normalization and hash determinism tests.
- `packages/replay/src/validate.test.ts` - Schema, version, ordering, snapshot, migration, and hash validation tests.
- `packages/replay/src/reconstruct.test.ts` - Replay reconstruction tests for built and handcrafted Chronicles.
- `packages/replay/src/build.ts` - Sanitizes owner-private payloads to valid JSON before storing them in Chronicle private sections.
- `packages/replay/src/index.ts` - Exports normalization, hashing, validation, and reconstruction APIs.
- `packages/replay/tsconfig.json` - Adds Node type declarations for the replay package hash implementation.

## Decisions Made

- Used `node:crypto` sha256 for content hashing inside `@cowards/replay`; replay is not engine logic and can depend on Node types.
- Kept reconstruction return state as `{ board, outcome? }` rather than engine `GameState`, preventing hidden dependency on engine/runtime state.
- Implemented broad Phase 3 validation rather than exhaustive Chronicle grammar, matching the phase deferral decision.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sanitized owner-private Chronicle payloads**
- **Found during:** Task 03-03-02 (typed Chronicle validation)
- **Issue:** Built Chronicles could include `undefined` fields inside owner-private payloads, which are not valid `JsonValue` and failed `ChronicleSchema.safeParse`.
- **Fix:** Sanitized private payloads at the replay builder recording boundary using JSON serialization before storing them under `private.byPlayerId`.
- **Files modified:** `packages/replay/src/build.ts`
- **Verification:** `pnpm --filter @cowards/replay test -- validate.test.ts integrity.test.ts`, replay typecheck, and full `pnpm verify` passed.
- **Committed in:** `adc629a`

**2. [Rule 3 - Blocking] Added Node type declarations to replay typecheck**
- **Found during:** Task 03-03-02 (typed Chronicle validation/typecheck)
- **Issue:** `node:crypto` hashing compiled in tests but package typecheck could not resolve Node built-in types from the package tsconfig.
- **Fix:** Added `"types": ["node"]` to `packages/replay/tsconfig.json`.
- **Files modified:** `packages/replay/tsconfig.json`
- **Verification:** `pnpm --filter @cowards/replay typecheck` and full `pnpm verify` passed.
- **Committed in:** `adc629a`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes were required for the planned validation and integrity implementation to be correct. No unrelated files were modified.

## Issues Encountered

- Plan-level `pnpm verify` initially failed on Prettier formatting for new replay files; formatting was applied and committed in `40709a5`.
- The local `gsd-sdk query` command was unavailable in this checkout/PATH, so planning state updates were applied directly to planning files instead of through SDK handlers.

## Known Stubs

None - empty arrays/objects in touched files are test fixtures, typed defaults, or internal accumulators, not user-visible stubs.

## Threat Flags

None - hashing, validation, and replay reconstruction surfaces were explicitly covered by the plan threat model.

## Verification

- `pnpm --filter @cowards/replay test -- integrity.test.ts` - PASS, replay package tests passed.
- `pnpm --filter @cowards/replay test -- validate.test.ts integrity.test.ts` - PASS, 3 files / 9 tests.
- `pnpm --filter @cowards/replay test -- reconstruct.test.ts` - PASS, replay package tests passed.
- `pnpm --filter @cowards/replay test -- reconstruct.test.ts validate.test.ts integrity.test.ts` - PASS, 4 files / 13 tests.
- `pnpm --filter @cowards/replay typecheck` - PASS.
- `pnpm verify` - PASS, format/lint/typecheck/test successful across 8 packages.

## Acceptance Criteria

- `packages/replay/src/normalize.ts` contains `export const normalizeChronicle` - PASS
- `packages/replay/src/hash.ts` contains `export const stableStringify` - PASS
- `packages/replay/src/hash.ts` contains `sha256` - PASS
- `packages/replay/src/index.ts` exports from `./normalize.js` - PASS
- `packages/replay/src/index.ts` exports from `./hash.js` - PASS
- `packages/replay/src/validate.ts` contains `export const validateChronicle` - PASS
- `packages/replay/src/validate.ts` contains `VERSION_INCOMPATIBLE` - PASS
- `packages/replay/src/validate.ts` contains `SNAPSHOT_MISSING` - PASS
- `packages/replay/src/validate.ts` contains `HASH_MISMATCH` - PASS
- `pnpm --filter @cowards/replay test -- validate.test.ts integrity.test.ts` exits 0 - PASS
- `packages/replay/src/reconstruct.ts` contains `export const createReplay` - PASS
- `packages/replay/src/reconstruct.ts` contains `stateAt` - PASS
- `packages/replay/src/reconstruct.ts` contains `iterateReplay` - PASS
- `packages/replay/src/reconstruct.ts` does not contain `runSoldierBrain` - PASS
- `pnpm --filter @cowards/replay test -- reconstruct.test.ts` exits 0 - PASS

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03-04 can build public and owner replay projections on top of validated Chronicles and `stateAt(sequence)` reconstruction. The replay package now has typed failure paths for corrupted or incompatible replay data.

## Self-Check: PASSED

- Verified created files exist: `packages/replay/src/normalize.ts`, `packages/replay/src/hash.ts`, `packages/replay/src/validate.ts`, `packages/replay/src/reconstruct.ts`, `packages/replay/src/integrity.test.ts`, `packages/replay/src/validate.test.ts`, `packages/replay/src/reconstruct.test.ts`, `.planning/phases/03-chronicle-and-replay-core/03-03-SUMMARY.md`.
- Verified task commits `24edd98`, `adc629a`, `f153227`, and cleanup commit `40709a5` exist in git history.

---
*Phase: 03-chronicle-and-replay-core*
*Completed: 2026-05-16*
