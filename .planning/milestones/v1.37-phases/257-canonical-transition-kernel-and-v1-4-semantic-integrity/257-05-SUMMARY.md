---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "05"
subsystem: validation
tags: [semantic-integrity, deterministic-ordering, bounded-diagnostics, arena, game-state, lifecycle, v1-4]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: Plan 04 shared semantic vectors and cross-boundary RED contracts
provides:
  - Pure bounded semantic issue contract with fixed family/code/path ordering and immutable results
  - Safe public and restricted system-integrity projections
  - Current arena, initial-state, GameState, tuple, lifecycle, outcome, event, and transition validators
  - Executable compatibility proof for facing-preserving v1.4 STONE and FALLEN states
affects: [257-06, 257-11, 257-12, 257-18, engine-kernel, replay-validation, persistence-admission]
tech-stack:
  added: []
  patterns: [bounded top-k issue accumulation, code-point ordering, shape-first semantic validation, initial-versus-current state separation]
key-files:
  created:
    - packages/spec/src/semantic-integrity.ts
  modified:
    - packages/spec/src/semantic-integrity.test.ts
    - packages/spec/src/fixtures/semantic-integrity-vectors.json
    - packages/spec/src/index.ts
key-decisions:
  - "Semantic issue precedence is fixed as TUPLE, ARENA, PLAYER, SOLDIER, POSITION, LIFECYCLE, OUTCOME, TRANSITION; paths and safe metadata break ties deterministically."
  - "Initial-start admission is distinct from current-state validation so legal later state movement is not mistaken for noncanonical setup."
  - "Valid v1.4 STONE and FALLEN states preserve their prior facing; STONE requires a position and FALLEN requires no position."
  - "Semantic invalidity is always system_integrity with public category CANONICAL_INTEGRITY_FAILURE; this layer never mints a player violation."
patterns-established:
  - "Bounded diagnostics: stream candidates into a deterministic top-k set instead of sorting or retaining an unbounded diagnostic array."
  - "Compatibility validation: correct a RED vector when it would reject current valid v1.4 state, and add an explicit positive regression before implementation proceeds."
requirements-completed: [KERN-03, KERN-11]
coverage:
  - id: D1
    description: Stable semantic issues are explicitly ordered, bounded by issue/path/UTF-8 metadata caps, deeply immutable, and insertion-order independent.
    requirement: KERN-03
    verification:
      - kind: unit
        ref: "packages/spec/src/semantic-integrity.test.ts#codes|bounds|order"
        status: pass
    human_judgment: false
  - id: D2
    description: Public output exposes only the safe integrity category while restricted evidence contains bounded codes, paths, safe metadata, transition kind, and valid state hashes.
    requirement: KERN-03
    verification:
      - kind: unit
        ref: "packages/spec/src/semantic-integrity.test.ts#projection separates public category from bounded restricted evidence"
        status: pass
    human_judgment: false
  - id: D3
    description: Arena, initial-state, GameState, tuple, lifecycle, outcome, event, and transition validators return every shared vector's exact stable issue set.
    requirement: KERN-03
    verification:
      - kind: unit
        ref: "packages/spec/src/semantic-integrity.test.ts#validates every shared semantic vector with exact stable issues"
        status: pass
    human_judgment: false
  - id: D4
    description: Canonical initial state and facing-preserving v1.4 STONE/FALLEN states remain admitted without normalization or mutation.
    requirement: KERN-11
    verification:
      - kind: unit
        ref: "packages/spec/src/semantic-integrity.test.ts#admits valid current starts and facing-preserving v1.4 STONE and FALLEN states"
        status: pass
      - kind: integration
        ref: "packages/engine/src/compatibility-fixtures.test.ts: 12/12"
        status: pass
    human_judgment: false
duration: 15min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 05: Bounded Canonical Semantic Validation Summary

**The spec layer now owns one pure, immutable, bounded semantic contract that returns identical issue meaning and order across every current trust boundary while preserving valid v1.4 state.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-13T15:44:30Z
- **Completed:** 2026-07-13T15:59:39Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Implemented fixed semantic families/codes, deterministic code-point ordering, bounded top-k issue accumulation, UTF-8 path/metadata caps, deep immutability, and stable truncation disposition.
- Added public-safe and restricted-safe failure projections with an allowlisted metadata vocabulary, bounded transition kind, and exact SHA-256 state hashes.
- Implemented pure current validators for arenas, canonical initial state, later GameState, compatibility versions, lifecycle cursor/quota/effect identity, ownership/occupancy/status, initiative, outcomes, terminal continuation, event/state agreement, and hashes.
- Turned all 27 shared vectors green with exact code/path/metadata assertions while admitting unchanged valid fixtures.
- Added explicit positive regressions that v1.4 STONE and FALLEN Soldiers retain facing history.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement bounded stable issues and deterministic ordering** - `536810f` (feat)
2. **Task 2: Implement arena, state, lifecycle, tuple, and outcome semantics** - `ca15678` (feat)

## Files Created/Modified

- `packages/spec/src/semantic-integrity.ts` - Pure issue vocabulary, bounds, projections, and current semantic validators.
- `packages/spec/src/semantic-integrity.test.ts` - Exact vector, ordering, bounds, privacy, immutability, and v1.4 admission proof.
- `packages/spec/src/fixtures/semantic-integrity-vectors.json` - Corrected STONE compatibility vector, complete cascading duplicate-player issues, and explicit transition versions.
- `packages/spec/src/index.ts` - Public semantic-integrity contract export.

## Decisions Made

- Validators consume already parsed typed values; callers retain shape validation responsibility and can use the exported stable family-owned shape failure helper.
- Initial-state validation checks canonical starts, while later GameState validation checks current bounds/occupancy without treating legal movement as a setup defect.
- Completed DRAW outcomes are coherent when active counts are equal, including final two-by-two resolution; WIN outcomes require a known winner with a strictly greater active count, covering immediate and final-board resolution.
- Semantic system/integrity ownership is fixed at this layer. Strategy-output legality remains the only later boundary permitted to create a player violation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Compatibility bug] Corrected a Plan 04 vector that rejected valid facing-preserving STONE state**

- **Found during:** Task 2 (state status/position/facing semantics)
- **Issue:** `soldier-stone-facing-present` expected retained facing to be invalid, but v1.4 backstab, movement, and activation transitions change status to STONE without clearing facing. FALLEN transitions likewise preserve facing while clearing position.
- **Fix:** Replaced it with `soldier-stone-position-null`, which rejects the truly impossible missing STONE position; allowed retained facing for STONE/FALLEN and added explicit positive regressions.
- **Files modified:** `packages/spec/src/fixtures/semantic-integrity-vectors.json`, `packages/spec/src/semantic-integrity.test.ts`, `packages/spec/src/semantic-integrity.ts`
- **Verification:** semantic suite 7/7 and v1.4 compatibility corpus 12/12 pass.
- **Committed in:** `ca15678`
- **KERN-11 reasoning:** Enforcing the original vector would have changed validity of reachable v1.4 Match state. Correcting the test prevents that semantic change; it does not change state, Action legality, event order, outcome, terminal behavior, or Strategy observation, so no user compatibility ruling was required.

**2. [Rule 2 - Complete deterministic evidence] Recorded cascading ownership issues for a duplicate player identity**

- **Found during:** Task 2 exact-vector execution
- **Issue:** Duplicating the top player ID also makes every top Soldier owner unknown; the original single expected issue contradicted the requirement to return all applicable bounded issues.
- **Fix:** Added the eight deterministic `SOLDIER_OWNER_UNKNOWN` issues after `PLAYER_ID_DUPLICATE` in canonical order.
- **Files modified:** `packages/spec/src/fixtures/semantic-integrity-vectors.json`
- **Verification:** all 27 vectors match exact issue code/path/metadata arrays.
- **Committed in:** `ca15678`

---

**Total deviations:** 2 auto-fixed (1 compatibility bug, 1 missing complete evidence expectation). **Impact:** Both corrections strengthen KERN-03 while preventing an unapproved KERN-11 semantic change; no scope expansion.

## Issues Encountered

- The first full spec run exposed Plan 07's intentionally whole-barrel candidate hash guard after the required new semantic export changed `packages/spec/src/index.ts`. Plan 07 narrowed that concurrent guard in `4ffea2d` to candidate-owned negative exports and exact authority bytes. The rerun passed 177/177.
- Full package ESLint still reports six pre-existing `Buffer is not defined` findings in authority/runtime-evidence files outside Plan 05. ESLint over every Plan 05-owned TypeScript file passes cleanly.

## User Setup Required

None - no external service configuration or dependency installation was required.

## Next Phase Readiness

- Plans 257-06, 257-11, 257-12, and 257-18 can consume the exported validators without importing gameplay scheduling or I/O.
- Final gates pass: semantic suite 7/7, complete spec suite 177/177, standard spec suite 72/72, spec typecheck, owned-file ESLint, and v1.4 compatibility fixtures 12/12.
- Protected `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` retain their captured byte hashes.

## Self-Check: PASSED

- All four Plan 05 files and this summary exist.
- Task commits `536810f` and `ca15678` are present.
- Every shared vector is exact-green and all valid compatibility fixtures remain green.
- No `STATE.md`, `ROADMAP.md`, Plan 07 authority artifact, or concurrent replay/web file was staged or modified by this executor.

---
*Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity*
*Completed: 2026-07-13*
