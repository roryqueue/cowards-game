---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "145"
subsystem: bounded-runtime-execution
tags: [native-custody, retained-descriptor, retry-v4, source-seal, single-operator-local-seal]
requires:
  - phase: 262-143
    provides: immutable live-v14 custody closeout and truthful failed Plan 110 history
provides:
  - retained-descriptor native owner lease with bounded PAIR/LIFE transactions
  - additive retry-envelope v4 model and producer under unchanged frozen bounds
  - live-v15 one-review and one-invocation source gate
  - inactive source-bound envelope-v4 and source-seal-v14
affects: [262-146, 262-147, ADMIT-03]
tech-stack:
  added: []
  patterns: [opaque WeakMap lease, shared bounded shutdown promise, committed review blob, durable pre-entry invocation marker, strict stage-aware postcheck]
key-files:
  created:
    - scripts/lib/v1-38-bounded-retry-v4-native-custody-v1.ts
    - scripts/lib/v1-38-private-native-bootstrap-v3.ts
    - scripts/lib/v1-38-bounded-retry-envelope-v4.ts
    - scripts/run-v1-38-bounded-retry-envelope-v4.ts
    - scripts/run-v1-38-bounded-retry-envelope-v4-live-v15.ts
    - .planning/artifacts/v1.38-plan-262-145-retry-envelope-v4.json
    - .planning/artifacts/v1.38-successor-source-seal-v14.json
  modified: []
key-decisions:
  - "Retain and validate the owner's original root open-file description for every under-lease PAIR/LIFE transaction."
  - "Authenticate the single Plan 146 REVIEW.md from its exact committed blob and bind the report commit/blob into the invocation marker."
  - "Record the sole corrected invocation durably before producer entry and preserve absent terminal as failure."
requirements-supported: [ADMIT-03, ADMIT-04, MEAS-02, MEAS-04, MEAS-09, MEAS-10, SEAL-01]
requirements-completed: []
coverage:
  - id: D1
    description: "Real retained-owner native composition completes while a competing owner remains excluded."
    requirement: ADMIT-04
    verification:
      - kind: integration
        ref: "scripts/lib/v1-38-bounded-retry-v4-native-custody-v1.test.ts#owner-to-PAIR-to-LIFE-to-PAIR"
        status: pass
    human_judgment: false
  - id: D2
    description: "Retry v4 preserves frozen resource policy and passes the lease through every native writer."
    requirement: MEAS-04
    verification:
      - kind: unit
        ref: "scripts/lib/v1-38-bounded-retry-envelope-v4.test.ts and scripts/run-v1-38-bounded-retry-envelope-v4.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Live-v15 enforces one exact review, durable pre-entry consumption, and stage-aware failure custody."
    requirement: SEAL-01
    verification:
      - kind: unit
        ref: "scripts/run-v1-38-bounded-retry-envelope-v4-live-v15.test.ts"
        status: pass
    human_judgment: false
duration: 23 min
completed: 2026-08-31
status: complete
---

# Phase 262 Plan 145: Retained Native Ownership and Retry-v4 Source Closure Summary

**A retained root descriptor now carries exclusive native ownership across real PAIR/LIFE transactions, with an inactive source-bound retry-v4/live-v15 closure and no operational invocation.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-08-31T20:57:00Z
- **Completed:** 2026-08-31T21:20:32Z
- **Tasks:** 3
- **Files created:** 11

## Accomplishments

- Proved real owner → PAIR → LIFE → PAIR composition in separately supervised native fixtures while a second owner stayed excluded until release.
- Threaded one opaque retained-descriptor lease through all five active native writer call sites without changing the owner-v1 or transaction-v6 C bytes.
- Froze corrected exact committed source `6fd67e32640ec0b4c6e1f60e53b622ec97097609`, semantic runtime root `sha256:132282ee554dc0f2ade43cf4917c3049abab6eb64991be6d7daed0776b67754e`, source root `sha256:ec29267a04839c2ddf107284c6087b7a5b8678df13bddbfa55df1d9ca79f60f4`, envelope root `sha256:a4fb6fe9c7062c7c4464e6e4681a5a75e895e7fe28077df1c5ece6845e3dfd42`, and seal root `sha256:4f2d6c1c22d0a81cf1b36bdc64c7f8546a9d5abffcd1d99e50887ffff8ec9384` after the independent code-review repair.
- Preserved failed Plan 110 as one consumed invocation with zero accepted cells, absent journal/terminal/reproduction, and its empty private-v3 directory unchanged.

## Verification

- Native custody suite after review repair: **5/5 passed in 31.84s**. Each real fixture ran in a separate process group with a 55-second external SIGKILL supervisor.
- Complete affected suites after review repair: **22/22 passed in 38.06s** across four test files.
- Model/producer suites after review repair: **11/11 passed**.
- Live-v15 suite after review repair: **6/6 passed**.
- Targeted TypeScript invocation was run against the five v4/bootstrap source entries. The repository-wide transitive command remains nonzero because of pre-existing legacy errors, but its filtered output contained **zero errors in the affected v4/native/bootstrap files**. This is not claimed as a global TypeScript pass.
- `git diff --check`: passed.
- Original native hashes remained `owner=fef25dc7eab2cb372e6cd7549adb8836ab466340bd8a18b5eb748de906aefcea` and `transaction=643d5c7a2bc1e92671c73705965d6f3451946faa60be48b34b044962020d261a`.
- Fresh journal/private/terminal/reproduction destinations remain absent. No producer, live, preflight, calibration, Match, holdout, or canonical/public operation ran.

## Task Commits

1. **Task 1 RED:** `57377d07`
2. **Task 1 GREEN:** `fd81e1ef`
3. **Task 1 cleanup fix:** `8c27eab9`
4. **Bounded bootstrap identity fix:** `0cf76458`
5. **Task 2 producer/model:** `6e742a54`
6. **Task 3 RED:** `3d590007`
7. **Task 3 live-v15 source:** `c8011d33`, `48556aca`, `dafeb114`
8. **Inactive envelope/seal publication:** `8868f8cd`
9. **Independent review RED:** `815b98a4`
10. **Committed review, producer marker, and strict postcheck:** `c3eb164b`, `327ed926`
11. **Joined bounded native shutdown:** `9dac0a94`, with TypeScript narrowing follow-ups `2482f420`, `6fd67e32`
12. **Corrected inactive envelope/seal publication:** `4197ee79`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Invalidate the lease on transaction compiler/setup failure**
- **Found during:** Task 1 failure-path verification
- **Issue:** A prelaunch transaction failure could leave the owner lease usable.
- **Fix:** Invalidate ownership before cleanup on every transaction setup/compile failure.
- **Verification:** Native failure fixture and targeted TypeScript check passed.
- **Committed in:** `8c27eab9`

**2. [Rule 2 - Missing Critical] Version the bounded bootstrap assurance**
- **Found during:** Task 2 source-identity test
- **Issue:** The additive v3 bootstrap exposed its timeouts but lacked an explicit v3 schema identity.
- **Fix:** Added `v1.38-private-native-execution-assurance-v3` without changing deadlines.
- **Verification:** Task 2 suites passed 10/10.
- **Committed in:** `0cf76458`

**3. [Rule 1 - Bug] Correct synthetic v4 journal ordering in the new test**
- **Found during:** Task 2 model verification
- **Issue:** The test reserved a route before its charged preflight observation, so the frozen model correctly rejected it.
- **Fix:** Test now reserves and observes preflight first and expects zero started routes after refusal.
- **Verification:** Model/producer suites passed 10/10.
- **Committed in:** `6e742a54`

**Total deviations:** 3 auto-fixed (2 bugs, 1 missing critical identity). **Impact:** No scientific, resource, gameplay, privacy, assurance-class, or execution-authority bound changed.

### Independent code-review repair

- Plan 146 review custody now resolves and parses the exact committed review blob, verifies the no-follow working file equals it, requires the report commit to descend from the reviewed source commit, and binds the report commit/blob into readiness and invocation custody.
- The actual producer entry has no `validateInputs:false` or injected `checkPair` bypass. It authenticates committed review custody and the exact durable invocation marker before acquiring native ownership or creating effects.
- Native invalidation and release share one bounded shutdown promise. Release joins invalidated shutdown, escalates with `SIGKILL` only after the grace bound, awaits child close before cleanup, and producer cleanup cannot mask the original transaction error.
- Raw terminal postcheck uses the strict journal/receipt/terminal/reproduction outcome validator. Claimed Plan 94 retirement and hybrid raw/retired state fail closed until Plan 94 supplies its exact committed checker contract.
- The earlier envelope/seal remain historical failed-source bytes. The same inactive canonical paths were corrected once, before Plan 146, to bind the repaired source only; this grants no execution authority.

## TDD Gate Compliance

Tasks 1 and 3 have explicit RED commits. Task 2's new tests and source were committed together after the delegated implementation pass; its observed failing checks were corrected before GREEN, but it does not have a separate RED commit. The complete affected suite is green.

## Known Stubs

None. Producer seal derivation/publication and direct CLI execution intentionally fail closed into live-v15; these are security boundaries, not incomplete placeholders.

## Authority and Next Plan

Plan 145 is source-complete only. Its envelope and seal are inactive and explicitly non-authorizing. ADMIT-03 remains `0/540`; no requirement is marked complete by this recovery source. Only Plan 146 may independently create the exact review header and decide whether Plan 147 is eligible for the already-approved one corrected invocation. Plan 145 did not execute Plans 146 or 147.

## Self-Check: PASSED

All eleven planned files exist, every listed commit resolves, the worktree is clean before summary creation, and the sealed source commit matches the nine-file source manifest.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-08-31*
