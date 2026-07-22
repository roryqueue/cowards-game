---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "09"
subsystem: replay-integrity
tags: [typescript, replay, candidate-dispatch, arena-catalog, set-conditions, historical-compatibility]

requires:
  - phase: 260-05
    provides: Persisted runtime-v1.19 scenario, condition, side, initiative, catalog, geometry, and request authority
  - phase: 260-06
    provides: Generated-authority Go candidate scheduling and frozen revision evidence
  - phase: 260-17
    provides: Exact public candidate tuple and manifest-backed arena dispatch
provides:
  - Immutable candidate replay reproducibility envelope bound to exact runtime-v1.19 execution and persisted Match authority
  - Version-first replay validation for catalog, condition, side, initiative, request, and tuple identity
  - Byte-exact current Phase-259 and immutable historical v1.4 replay preservation
affects: [260-14, 260-23, 260-24, replay, chronicle, public-evidence]

tech-stack:
  added: []
  patterns: [explicit-candidate-dispatch, persisted-authority-equality, manifest-backed-alias-rejection, non-publishable-preactivation]

key-files:
  created: []
  modified:
    - packages/replay/src/record.ts
    - packages/replay/src/record.test.ts
    - packages/replay/src/validate.ts
    - packages/replay/src/validate.test.ts

key-decisions:
  - "Attach runtime-v1.19 reproducibility as a separate immutable candidate envelope so the current Chronicle reproducibility shape and historical bytes remain unchanged."
  - "Dispatch candidate validation by exact profile and tuple before current or historical resolution, and report it as inactive and non-publishable."
  - "Resolve arena IDs against the canonical catalog but reject historical aliases, nonschedulable records, and semantic-hash substitutions for candidate replay."
  - "Replay validates kernel-recorded and persisted authority without deriving fairness from seeds, reconstructing initiative, executing Strategy code, or granting UI authority."

patterns-established:
  - "Candidate replay admission: exact route -> exact candidate tuple -> persisted/envelope equality -> active catalog identity -> trusted recorder reproduction."
  - "Preactivation replay evidence is structurally valid but explicitly non-current and non-publishable until the atomic activation owner changes authority."

requirements-completed: [STRAT-04, SET-01, SET-02, SET-04, SET-05]

coverage:
  - id: D1
    description: "Explicit runtime-v1.19 recording carries exact scenario, condition, ordinal, catalog, semantic geometry, side, initiative, revision, and request identity without changing the current recording shape."
    requirement: SET-04
    verification:
      - kind: unit
        ref: "packages/replay/src/record.test.ts#records one exact immutable runtime-v1.19 condition reproducibility envelope"
        status: pass
      - kind: integration
        ref: "pnpm --filter @cowards/replay test"
        status: pass
    human_judgment: false
  - id: D2
    description: "Candidate validation rejects every frozen-field mutation, alias substitution, mixed tuple, persisted relabeling, and private extra before replay reconstruction."
    requirement: SET-02
    verification:
      - kind: unit
        ref: "packages/replay/src/validate.test.ts#candidate-v1.19 replay validation matrix"
        status: pass
      - kind: integration
        ref: "pnpm exec vitest run packages/replay/src/validate.test.ts packages/replay/src/historical-v1-4.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Current Phase-259 replay and immutable historical v1.4 dispatch remain exact, while replay gains no gameplay, Strategy execution, seed-derived fairness, UI, or public-publication authority."
    requirement: STRAT-04
    verification:
      - kind: unit
        ref: "packages/replay/src/record.test.ts#keeps the Phase-259 current recording result and Chronicle shape exact"
        status: pass
      - kind: integration
        ref: "packages/replay/src/historical-v1-4.test.ts"
        status: pass
      - kind: other
        ref: "packages/replay/src/validate.test.ts#keeps candidate validation structural-only with no gameplay, runtime, or UI authority"
        status: pass
    human_judgment: false

duration: 19min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 09: Candidate Replay Authority Summary

**Replay now records and validates exact inactive runtime-v1.19 catalog and four-condition authority while preserving the complete Phase-259 current route and immutable v1.4 history.**

## Performance

- **Duration:** 19 min, including rescue from the interrupted RED commit
- **Started:** 2026-07-17T06:22:38Z
- **Completed:** 2026-07-17T06:41:03Z
- **Tasks:** 2 TDD tasks
- **Files modified:** 4

## Accomplishments

- Added one frozen candidate replay envelope containing the exact runtime-v1.19 tuple plus persisted Match, revision, catalog, scenario, condition, side, initiative, semantic geometry, and request identity.
- Added version-first candidate validation that reproduces trusted recording from the execution, requires byte-equivalent persisted authority, resolves the spec catalog, and rejects aliases or any condition/catalog substitution.
- Preserved the exact current recording key set, current Phase-259 replay validation, historical v1.4 tuple/grammar/digest dispatch, and private-data boundary.
- Kept candidate evidence inactive and non-publishable; replay imports no Strategy runtime, derives no gameplay or fairness semantics, and grants no UI authority.

## Task Commits

Each TDD task was committed as a RED/GREEN pair:

1. **Task 1 RED: candidate replay recording contract** - `038b4d4` (test)
2. **Task 1 GREEN: exact candidate replay authority recording** - `01c49bb` (feat)
3. **Task 2 RED: candidate replay validation contract** - `11f46ba` (test)
4. **Task 2 GREEN: frozen candidate replay validation** - `e824f18` (feat)

## Files Created/Modified

- `packages/replay/src/record.ts` - Validates the exact candidate tuple, catalog, scenario, condition, side, initiative, and kernel state before attaching a frozen candidate reproducibility envelope.
- `packages/replay/src/record.test.ts` - Proves exact envelope bytes, mutation rejection, privacy, and unchanged current recording shape.
- `packages/replay/src/validate.ts` - Adds explicit candidate routing and non-publishable persisted/catalog equality validation beside isolated current and historical branches.
- `packages/replay/src/validate.test.ts` - Covers the full frozen-field mutation matrix, alias/mixed-tuple/private-extra rejection, and structural no-execution/no-UI authority.

## Decisions Made

- Candidate reproducibility remains outside the Chronicle's released `reproducibility` object. This keeps current and historical Chronicle bytes exact while giving the inactive successor a self-describing evidence envelope.
- Candidate validation succeeds only as `candidate: true`, `current: false`, and `publishable: false`. Plan 260-14 remains the sole activation owner.
- Catalog lookup recognizes historical aliases only to reject their use as candidate scheduling/replay authority; only the exact active schedulable record and semantic hash are admissible.
- The recorder is the single execution-to-replay truth checker. Validation replays that trusted recording from the supplied execution and persisted Match rather than recreating condition or gameplay semantics.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Included successor initial-initiative state in the replay recorder projection**
- **Found during:** Task 1 GREEN verification
- **Issue:** The interrupted implementation admitted the candidate tuple but compared the v1.19 kernel material against a replay projection that omitted `initialInitiativePlayerId`, producing `RECORDER_MATERIAL_INVALID` for valid candidate execution.
- **Fix:** Project the kernel-owned initial initiative only when present. Phase-259 states omit the field and retain their exact serialized shape.
- **Files modified:** `packages/replay/src/record.ts`
- **Verification:** Candidate recorder, full current replay, historical v1.4, replay package, typecheck, build, and lint all pass.
- **Committed in:** `01c49bb`

---

**Total deviations:** 1 auto-fixed bug.
**Impact on plan:** The fix was required for exact successor recording and is additive only for v1.19 state; current and historical bytes remain unchanged.

## Issues Encountered

- The first executor stopped after Task 1 RED because of model capacity and left an uncommitted GREEN implementation. Execution resumed from commit `038b4d4`, verified the inherited diff, repaired its candidate state projection, and completed both TDD gates without rewriting the existing RED commit.

## User Setup Required

None - no dependency, environment variable, database, service, secret, or UI setup is required.

## Verification

- `pnpm --filter @cowards/replay test`: 14 files, 225 tests passed.
- Focused candidate/current/historical command: 2 files, 73 tests passed.
- Task 1 record/historical command: 2 files, 34 tests passed.
- `pnpm --filter @cowards/replay typecheck`: passed.
- `pnpm --filter @cowards/replay build`: passed.
- ESLint on all four modified files: passed.
- Stub scan: no TODO, FIXME, XXX, placeholder, or unimplemented marker in changed files.
- Threat scan: no Strategy runtime/service, Match kernel, UI, filesystem, network, or seed-parsing authority was added to replay recording/validation.
- Protected-baseline check: `.planning/config.json` remains `a9502647c42da6e83564e56e35833a66d2daad6704f2ac2a2d98cf12cc953f7b`; `CowardsGameSpec_Full_Consolidated_v1.md` remains `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46`.
- The protected files remain the only unstaged changes.

## TDD Gate Compliance

- Task 1 RED `038b4d4` failed because candidate recording and its exact mutation contract did not exist; GREEN `01c49bb` passes candidate, current, privacy, and historical proof.
- Task 2 RED `11f46ba` failed because `validateCandidateReplayV119` did not exist; GREEN `e824f18` passes exact persisted/catalog validation and the complete adversarial mutation matrix.

## Next Phase Readiness

- Plan 260-14 can activate the compact semantic selector without changing the replay evidence shape or adding a handwritten candidate default.
- Plans 260-23 and 260-24 can project and integrate the validated privacy-safe candidate identifiers while retaining non-publishable preactivation.
- Current Phase-259 and historical replay remain isolated and exact; Plan 260-09 introduces no UI route, public DTO, gameplay interpretation, or Strategy execution path.
- The pre-existing user modifications to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remain untouched and uncommitted.

## Self-Check: PASSED

- All four modified replay files exist and all four RED/GREEN commits are present in git history.
- Full replay, focused candidate/current/historical, typecheck, build, lint, mutation, privacy, boundary, stub, and protected-baseline gates pass.
- No summary existed before execution; this committed summary closes the rescued Plan 09 atomic state.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
