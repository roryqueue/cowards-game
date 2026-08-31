---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "132"
reviewed: 2026-08-31T01:54:36Z
reviewed_head: cbf5fcfb70731dd89450756298a3879bb9bba9aa
subject_commit: 26c57dfe33f44bed0068fd3d0d0b96126682c87b
depth: deep
files_reviewed: 3
files_reviewed_list:
  - scripts/check-v1-38-plan-262-132-live-v13-custody-v5.ts
  - scripts/check-v1-38-plan-262-132-live-v13-custody-v5.test.ts
  - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-132-SUMMARY.md
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 262 Plan 132: Code Review Report V2

**Reviewed:** 2026-08-31T01:54:36Z
**Depth:** deep
**Files Reviewed:** 3
**Status:** issues_found

## Summary

The corrected Plan132 v5 source, tests, and summary were re-reviewed from clean HEAD `cbf5fcfb` with subject `26c57dfe`. The correction closes both original review findings for static repository state: every Git call routes through the isolated runner, replacement refs and ambient Git environment are neutralized, the validator internally authenticates exact committed history, and self-consistent forged observations are rejected. The focused 8-test suite, TypeScript compilation, source-only checker, and static hostile probes pass. The result remains blocked because graft, shallow, and dangerous local metadata are checked only once rather than bound or neutralized across every subsequent Git process; the new forged-observation test also rejects for an obsolete argument shape rather than exercising the intended trust boundary.

## Narrative Findings (AI reviewer)

### CR-03 [BLOCKER]: Mutable graft and shallow metadata is checked once, not neutralized for every Git operation

**File:** `scripts/check-v1-38-plan-262-132-live-v13-custody-v5.ts:97-100,133-142,187-213`

**Issue:** The isolated runner sets `GIT_NO_REPLACE_OBJECTS=1`, which neutralizes replacement refs, and the checker rejects graft and shallow files before history authentication. Legacy grafts are not disabled by `GIT_NO_REPLACE_OBJECTS`, however. Against the hostile graft clone, raw Git with `GIT_NO_REPLACE_OBJECTS=1` still reported unrelated commit `6515ea1a2e372a71d9f9d161e395276cf163db76` as a descendant of exact summary `6a82901a8e73a4c2b8be92ba1b8d606919678784`; the ancestry check exited `0`. Adding `GIT_GRAFT_FILE=/dev/null` made the same check exit `1`. Because repository metadata is checked once and authentication then starts many independent Git processes, a concurrent graft insertion can alter ancestry after the safety check. A shallow file inserted later can likewise truncate protected-path history and hide a rewrite from `git log <commit>..HEAD -- <path>`. Dangerous local config has the same check/use separation even though explicit per-command flags mitigate several keys. This does not satisfy the requirement that grafts, shallow state, and dangerous configuration be neutralized for every Git operation.

**Fix:** Disable legacy grafts in every isolated Git subprocess, for example with an explicitly controlled empty graft source. Bind or reauthenticate mutable repository metadata around every history-sensitive operation so shallow/config changes cannot occur between validation and use. Add adversarial tests that mutate graft and shallow metadata after the initial safety check and require fail-closed rejection.

### WR-01 [WARNING]: Forged-observation regression test rejects on obsolete argument order

**File:** `scripts/check-v1-38-plan-262-132-live-v13-custody-v5.test.ts:147-175`

**Issue:** The test titled `rejects self-consistent forged observations and a forged payload trust anchor` calls the corrected validator through an `any` cast as `validate(payload.observations, payload)`. The new signature is `(rootInput, observationsInput)`, so the function rejects immediately because the first argument is not a string. The test never exercises self-consistent forged observations against internally authenticated repository history and would continue passing if the substantive observation comparison regressed.

**Fix:** Call `validateV138Plan132ObservationsForReview(ROOT, payload.observations)` and assert `V138_PLAN132_OBSERVATIONS_INVALID`. The direct external hostile probe using that exact call correctly rejected the forged observations.

## Verification

- Focused serialized Vitest: passed, 1 file / 8 tests.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- Source-only checker: passed with six validated observations, zero findings, Plan133 false, Plan110 false, and no effects.
- Static hostile config, replacement-ref, graft, and shallow repositories: rejected with their dedicated fail-closed errors.
- Hostile ambient `GIT_DIR`, `GIT_WORK_TREE`, `GIT_CONFIG_*`, and replacement environment: neutralized; source-only still passed.
- Self-consistent forged observations against the real repository root: rejected with `V138_PLAN132_OBSERVATIONS_INVALID`.
- Legacy graft probe: `GIT_NO_REPLACE_OBJECTS=1` still accepted forged ancestry; explicit empty graft source rejected it.
- `git diff --check`: passed before review persistence.

## Effect Boundary

No readiness selector, live selector, producer, producer destination, capacity/reset path, counter consumer, or downstream action was invoked. Review execution was limited to serialized tests, TypeScript compilation, source-only checking, static/Git reads, temporary hostile clones, and in-memory observation mutations.

---

_Reviewed: 2026-08-31T01:54:36Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
