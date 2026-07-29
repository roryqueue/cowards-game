---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "10"
subsystem: integrity
tags: [parallel-calibration, stopped-process-failure, charged-accounting, immutable-receipt]

requires:
  - phase: 262-09
    provides: frozen eight-attempt calibration policy, deterministic four-way supervision, cleanup, and charged accounting
  - phase: 262-08
    provides: independently rooted historical expectation and exact predicate
  - phase: 262-02
    provides: immutable stopped predecessor and exact supervised 540-attempt inventory
provides:
  - immutable calibration successor binding all eight charged calibration identities to the stopped predecessor
  - exact calibration write/check/branch-require CLI commands
  - truthful terminal refusal with zero accepted cells and no authoritative full-run launch
affects: [262-03, ADMIT-03, v1.38-foundation-contract]

tech-stack:
  added: []
  patterns:
    - atomically publish a closed calibration successor only after policy, projection, lineage, cleanup, and root checks
    - retain immutable Git predecessor evidence separately from the current successor artifact

key-files:
  created:
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-10-SUMMARY.md
  modified:
    - scripts/lib/v1-38-current-matrix-reproduction.ts
    - scripts/evaluate-v1-38-foundation-contract.test.ts
    - .planning/artifacts/v1.38-current-matrix-reproduction.json

key-decisions:
  - "Treat the exact four-shard calibration's SHARD_RUNNER_EXCEPTION classification as a terminal process refusal: charge all eight identities, publish zero cells, and do not launch the 540-cell matrix."
  - "Keep the frozen 90-minute gate unchanged; the time projection was admitted, but classification and absent resource observations independently require a stop."
  - "Preserve the Plan 262-02 stopped receipt from its producing Git commit while the working artifact advances to a newly rooted successor."

patterns-established:
  - "Calibration receipt checking recomputes policy, inventory, projection, charged, accepted, source, and final roots and rejects mutation."
  - "A calibration stop is terminal for the plan's authoritative branch and cannot be reinterpreted as empirical evidence."

requirements-completed: []

coverage:
  - id: D1
    description: "Exact calibration successor CLI and mutation-detecting branch checker"
    requirement: ADMIT-03
    verification:
      - kind: integration
        ref: "scripts/evaluate-v1-38-foundation-contract.test.ts#v1.38 matrix calibration receipt branches"
        status: pass
    human_judgment: false
  - id: D2
    description: "Complete accepted 540-cell authoritative historical reproduction"
    requirement: ADMIT-03
    verification:
      - kind: integration
        ref: ".planning/artifacts/v1.38-current-matrix-reproduction.json#status"
        status: fail
    human_judgment: false

duration: 16min
completed: 2026-07-29
status: complete
outcome: stopped_process_failure
---

# Phase 262 Plan 10: Authoritative Parallel Calibration Summary

**The preregistered eight-attempt calibration stopped on four supervised shard-runner exceptions, sealing all work as charged process failure with zero accepted cells and no 540-cell launch**

## Performance

- **Duration:** 16 min
- **Started:** 2026-07-29T06:09:12Z
- **Completed:** 2026-07-29T06:25:00Z
- **Tasks:** 1 of 2 executed; Task 2 was correctly prohibited by the failed calibration gate
- **Files modified:** 3 implementation/evidence files plus this Summary
- **Calibration CLI wall time:** approximately 23.4 seconds observed by the command runner
- **Receipt batch wall:** 9 ms from first spawn attempt through the four synthetic failure terminals
- **Resource samples:** unavailable; persisted zero RSS fields mean no successful measurement was obtained, not zero physical memory use
- **Focused verification:** 3/3 selected tests passed
- **Phase 262 test file:** 93/93 tests passed
- **Workspace typecheck:** 27/27 tasks passed

## Accomplishments

- Ran exactly the frozen eight calibration-only identities as four predeclared two-attempt shards under policy root `sha256:13ca3f9e...a3b`.
- Sealed successor receipt `sha256:99187d35...b280` with predecessor `sha256:bd64a793...5a33`, all eight calibration attempts charged, zero accepted cells, and `fullRunLaunched: false`.
- Added exact calibration write, check, admitted-require, and stopped-require commands with atomic artifact replacement and fail-closed mutation checks.
- Preserved the unchanged v1.18 service, v1.19 ABI, selected MATCH_KERNEL, historical expectation, authoritative shard plan, resource policy, and source bindings.

## Terminal Calibration Result

- **Status:** `stopped_process_failure`
- **Reason:** `SHARD_RUNNER_EXCEPTION`
- **Calibration shards:** 4 terminal / 4 declared
- **Calibration attempts:** 8 charged / 8 declared
- **Attempt dispositions:** 8 `system_failure`, 0 success, 0 accepted
- **Cleanup records:** 4/4 report awaited terminal handling and no orphan process IDs
- **Projection:** 60,654 ms, inside the unchanged 5,400,000 ms ceiling
- **Resource evidence:** no successful child RSS or aggregate RSS sample; the receipt cannot treat this as resource admission
- **Authoritative matrix:** not launched
- **Accepted cells:** 0
- **ADMIT-03:** remains pending/blocked

## Task Commits

1. **Task 1 RED: Require calibration successor receipt branches** - `3961d69d` (test)
2. **Task 1 GREEN: Seal stopped parallel calibration** - `c5665b75` (feat)
3. **Task 1 compatibility: Preserve immutable predecessor coverage** - `24df9e90` (test)

Task 2 has no commit because the Task 1 calibration gate explicitly prohibited the full 540-cell launch.

## Files Created/Modified

- `scripts/lib/v1-38-current-matrix-reproduction.ts` - Successor receipt schema, exact builders/checkers, atomic calibration writer, hardware identity capture, and CLI branch enforcement.
- `scripts/evaluate-v1-38-foundation-contract.test.ts` - Admitted/stopped branch coverage, mutation rejection, and immutable legacy predecessor coverage.
- `.planning/artifacts/v1.38-current-matrix-reproduction.json` - Newly rooted stopped successor with full calibration and predecessor lineage.
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-10-SUMMARY.md` - Terminal execution record.

## Decisions Made

- The admitted time projection cannot override the shard classification gate or missing resource observations.
- No retry, direct-engine shortcut, loader substitution, gate relaxation, partial reuse, or fabricated success is permitted.
- Plans 262-03 through 262-07 remain blocked because ADMIT-03 has no exact 540/540 accepted receipt.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Compatibility Bug] Kept the pre-Plan-10 stopped receipt test bound to immutable predecessor evidence**

- **Found during:** Overall Phase 262 verification
- **Issue:** The legacy Plan 262-02 test read the mutable working artifact path after it had correctly advanced to the v2 successor schema.
- **Fix:** Load the legacy stopped receipt from its producing Git commit for the historical assertions, while Plan 262-10 tests check the current successor independently.
- **Files modified:** `scripts/evaluate-v1-38-foundation-contract.test.ts`
- **Verification:** Full Phase 262 file passed 93/93 tests.
- **Committed in:** `24df9e90`

---

**Total deviations:** 1 auto-fixed compatibility bug
**Impact on plan:** No execution, authority, resource, or evidence policy changed. The fix keeps predecessor and successor assertions non-circular.

## Issues Encountered

- Every real calibration shard terminated as `SHARD_RUNNER_EXCEPTION` before a successful resource sample was recorded. The closed receipt therefore records process failure rather than interpreting the admitted time projection as launch authority.
- The first broader suite run exposed the mutable-path legacy test described above; it was corrected and the complete file then passed.

## Known Stubs

None. The absent authoritative run is a required fail-closed outcome of the calibration gate, not a stub.

## Threat Flags

None beyond the plan's registered offline artifact-write, subprocess supervision, resource reporting, charged lineage, and atomic-publication boundaries. No network endpoint, authentication path, schema trust boundary, formation artifact, candidate artifact, game-rule surface, or public product surface was added.

## User Setup Required

None.

## Next Phase Readiness

- **Blocked:** ADMIT-03 remains unmet; Plans 262-03 through 262-07 must not execute authoritatively.
- Any future retry requires a new explicitly authorized successor plan and must retain both stopped roots and every charged calibration identity. This plan does not authorize a duplicate calibration.
- The 90-minute ceiling and all v1.18/v1.19/MATCH_KERNEL authority bindings remain unchanged.

## Self-Check: PASSED

- Planned implementation, test, artifact, and Summary files exist.
- Task commits `3961d69d`, `c5665b75`, and `24df9e90` exist.
- Calibration checker and stopped-branch requirement command both pass for receipt root `sha256:99187d35...b280`.
- Full Phase 262 test file passed 93/93 and workspace typecheck passed 27/27.
- Forbidden-loader, direct-engine, stub, private-output, and new threat-surface scans found no blocking issue.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-07-29*
