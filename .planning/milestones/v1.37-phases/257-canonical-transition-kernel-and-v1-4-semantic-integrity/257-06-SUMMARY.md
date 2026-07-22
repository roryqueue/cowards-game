---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "06"
subsystem: engine
tags: [immutability, semantic-validation, initial-state, integrity, tdd]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: bounded semantic issue contracts, full validators, compatibility corpus, and inactive kernel candidate
provides:
  - Deeply frozen canonical bounds, activation counts, and starting-position constants
  - Inactive clone-owning candidate initial-state factory with typed semantic admission
  - Mutation, purity, authority-hash, and valid-v1.4 equivalence proof
affects: [257-08, 257-19, kernel-driver, semantic-boundaries, integrity-authority]
tech-stack:
  added: []
  patterns: [finite domain cloning, validate-before-expose, inactive candidate seam, immutable shared constants]
key-files:
  created:
    - packages/engine/src/kernel/create-initial-state.ts
    - packages/engine/src/kernel/create-initial-state.test.ts
  modified:
    - packages/spec/src/constants.ts
    - packages/engine/src/state.test.ts
    - packages/engine/src/purity.test.ts
key-decisions:
  - "The candidate factory remains outside the public engine barrel and active createInitialGameState remains unchanged until Plan 257-19 switches authority."
  - "Candidate states clone and freeze their own compatibility-version object while packages/spec/src/versions.ts remains byte-exact under the active authority pin."
  - "Arena semantics are admitted before state construction is exposed, followed by complete canonical initial-state validation."
patterns-established:
  - "Finite ownership: bounds, arena, terrain, starts, players, Soldiers, memories, and versions are cloned explicitly rather than through a generic hostile-value copier."
  - "Construction failure: shape or semantic rejection returns only a bounded system-integrity failure and never a partial GameState."
requirements-completed: [KERN-03, KERN-08, KERN-10, KERN-11]
coverage:
  - id: D1
    description: Canonical nested constants and every outward candidate state value are isolated from caller and cross-Match mutation.
    requirement: KERN-08
    verification:
      - kind: unit
        ref: "packages/engine/src/kernel/create-initial-state.test.ts#candidate initial-state constant and clone ownership"
        status: pass
      - kind: unit
        ref: "packages/engine/src/state.test.ts#mutation clone constant subset"
        status: pass
    human_judgment: false
  - id: D2
    description: Shape-valid overlapping, out-of-bounds, and duplicate arena data fails with bounded stable system-integrity issues before any state is exposed.
    requirement: KERN-03
    verification:
      - kind: unit
        ref: "packages/engine/src/kernel/create-initial-state.test.ts#candidate initial-state semantic admission"
        status: pass
      - kind: unit
        ref: "packages/engine/src/purity.test.ts#candidate initial-state admission"
        status: pass
    human_judgment: false
  - id: D3
    description: Valid candidate starts preserve active v1.4 values, deterministic initiative, compatibility fixtures, and active authority identity.
    requirement: KERN-10
    verification:
      - kind: integration
        ref: "pnpm --filter @cowards/engine exec vitest run src/compatibility-fixtures.test.ts"
        status: pass
      - kind: integration
        ref: "pnpm v1.37:integrity-authority:check"
        status: pass
      - kind: integration
        ref: "scripts/generate-v1-37-event-coverage.test.ts and scripts/check-v1-37-integrity-boundaries.test.ts: 41 passed"
        status: pass
    human_judgment: false
duration: 7min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 06: Immutable Candidate Initial-State Admission Summary

**Deep-frozen canonical constants and a clone-owning, semantic-validating candidate factory now reject invalid starts without changing active v1.4 authority or behavior.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-13T16:02:32Z
- **Completed:** 2026-07-13T16:09:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Deep-froze nested canonical board/start constants and proved imported mutation cannot contaminate later construction.
- Added an inactive factory that explicitly owns every nested state value and returns bounded typed integrity failures without exposing partial state.
- Preserved exact v1.4 start values, initiative, twenty-scenario compatibility evidence, active version-source bytes, and canonical tuple hash.

## Task Commits

Each TDD gate was committed atomically:

1. **Task 1 RED: Define immutable initial-state ownership** - `ec460c7` (test)
2. **Task 1 GREEN: Isolate canonical initial-state values** - `831677c` (feat)
3. **Task 2 RED: Require semantic initial-state admission** - `741a4b9` (test)
4. **Task 2 GREEN: Admit candidate initial states semantically** - `5d9860a` (feat)

## Files Created/Modified

- `packages/spec/src/constants.ts` - Deeply frozen bounds, Round counts, and nested starting positions.
- `packages/engine/src/kernel/create-initial-state.ts` - Inactive finite-clone factory with arena and complete initial-state validation.
- `packages/engine/src/kernel/create-initial-state.test.ts` - Constant, caller, cross-state, authority, invalid-arena, initiative, and determinism proof.
- `packages/engine/src/state.test.ts` - Active/candidate v1.4 equality and canonical constant assertions.
- `packages/engine/src/purity.test.ts` - Static no-runtime/no-host-effect candidate guard.

## Decisions Made

- Kept `createInitialGameState` as the active facade. The candidate is intentionally not barrel-exported; Plan 257-19 owns the atomic pointer switch.
- Froze a per-state clone of compatibility versions instead of modifying the active `COMPATIBILITY_VERSIONS` source. Its SHA-256 remains `98ac9b63482c0a392694551db9a5de2443aa3119f62387316457f03d64341821`; the tuple hash remains `be54eb5317af0a87190433f649f9beef4490493d8c2a8815a323b082651b514c`.
- Returned the shared semantic failure object directly so code order, paths, safe metadata, truncation, category, and ownership remain one contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Authority boundary] Preserved the active version source under its exact pre-Plan-19 hash**

- **Found during:** Task 1 GREEN, while cross-checking concurrent Plan 257-07/12 authority pins.
- **Issue:** Broad constant-freezing language could have frozen `COMPATIBILITY_VERSIONS` in place, changing a source file whose exact active bytes are intentionally pinned until the atomic Plan 257-19 migration.
- **Fix:** Restored `packages/spec/src/versions.ts` to exact HEAD bytes before any task commit; candidate construction now clones and freezes its own versions object.
- **Files modified:** `packages/engine/src/kernel/create-initial-state.ts` (final implementation); `packages/spec/src/versions.ts` has no diff.
- **Verification:** Version source SHA-256 `98ac9b...` exact, empty git diff, event/boundary hash tests 41/41, and integrity-authority check current.
- **Committed in:** `831677c`

**Total deviations:** 1 auto-fixed (1 Rule 2 boundary correction).
**Impact on plan:** The correction strengthens the inactive-candidate boundary and prevents premature active-authority drift; requested behavior and scope remain intact.

## Issues Encountered

Repository-wide engine lint currently observes a pre-existing `structuredClone` environment rule in `kernel/semantic-boundaries.test.ts`, outside Plan 06 files. Scoped ESLint for all Plan 06 files passes; no unrelated source was changed.

## Verification

- State mutation/clone/constant subset: 2 passed.
- Candidate/state/purity suites: 16 passed.
- Full v1.4 compatibility corpus: 12 passed with zero semantic delta.
- Spec integrity-authority and semantic-integrity suites: 13 passed.
- Plan 257-07/12 boundary and candidate-event hash suites: 41 passed.
- Engine/spec typechecks, scoped ESLint, scoped Prettier, and integrity-authority artifact check: passed.
- Protected `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` working bytes and binary diffs remained exact.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Candidate kernel plans can consume the typed initial-state result without receiving aliasable caller values.
- Plan 257-19 can switch the public factory only after the remaining kernel, tuple, and executable-boundary gates pass.
- No valid v1.4 Match state, Action legality, event order, outcome, terminal behavior, runtime call, or Strategy observation changed.

## Self-Check: PASSED

- Both created files and all three modified implementation/test files exist.
- TDD commits `ec460c7`, `831677c`, `741a4b9`, and `5d9860a` are present.
- All three coverage deliverables have current passing automated evidence.
- Active versions, protected working files, and canonical compatibility evidence remain exact.

---
*Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity*
*Completed: 2026-07-13*
