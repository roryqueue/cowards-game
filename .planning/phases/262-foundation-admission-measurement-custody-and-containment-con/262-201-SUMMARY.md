---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "201"
subsystem: hostile-runtime
tags: [worker-threads, lifecycle, docker, diagnostics, custody]
requires:
  - phase: 262-200
    provides: immutable attempt-8 diagnostic and exact exit-before-receipt reproduction target
provides:
  - order-independent exact Worker completion reconciliation
  - fresh v15 custody and operational artifact toolchain
  - passing immutable attempt-9 actual-fixture diagnostic-v6
affects: [ADMIT-03, 262-202, 262-175, 262-176]
tech-stack:
  added: []
  patterns: [order-insensitive terminal conjunction, single-deadline reconciliation, consumed-writer retirement]
key-files:
  created:
    - .planning/artifacts/v1.38-lean-runner-direct-actual-fixture-stage-diagnostic-v6.json
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-201-SUMMARY.md
  modified:
    - scripts/lib/v1-38-lean-container-match-session.ts
    - scripts/lib/v1-38-lean-container-match-session.test.ts
    - scripts/check-v1-38-lean-admission.ts
    - scripts/check-v1-38-lean-admission.test.ts
    - .planning/debug/phase-262-probe-failed.md
key-decisions:
  - "Treat receipt, port close, and natural code-0 exit as an order-independent conjunction inside the original deadline."
  - "Retire attempt 8 permanently and permit Plan202 only because diagnostic-v6 completed exactly with no preflight or Match invocation."
requirements-completed: []
coverage:
  - id: D1
    description: "Valid Worker terminal events are accepted in any observed order without weakening exact-count, correlation, exit-code, failure, or deadline checks"
    requirement: ADMIT-03
    verification:
      - kind: unit
        ref: "scripts/lib/v1-38-lean-container-match-session.test.ts#completion lifecycle and rapid-exit stress"
        status: pass
    human_judgment: false
  - id: D2
    description: "Attempt 9 confirms the repaired broker across all 16 public fixture requests with complete cleanup and zero preflights or Matches"
    requirement: MEAS-02
    verification:
      - kind: integration
        ref: "--check-direct-actual-fixture-stage-diagnostic-v6"
        status: pass
    human_judgment: false
metrics:
  duration: 22m
  completed: 2026-09-10
status: complete
---

# Phase 262 Plan 201: Order-Independent Worker Completion Summary

**The persistent broker now accepts valid receipt/close/code-0-exit delivery permutations, with a passing 16-request attempt-9 confirmation and no preflight or Match execution.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-09-09T05:17:00Z
- **Completed:** 2026-09-09T05:39:00Z
- **Tasks:** 2 complete
- **Files modified:** 7
- **Preflight / Match invocations:** 0 / 0
- **Successor locks:** 36

## Accomplishments

- Removed only the invalid `exitBeforeReceipt` observation-order latch while retaining exactly one correlated completion receipt, one port close, one natural exit with code 0, all duplicate/error/missing-event failures, and the original single deadline.
- Passed 50 consecutive real Advanced rapid-exit executions through the legacy harness and 50 through v1.17, alongside the full focused custody and lifecycle suite.
- Retired diagnostic-v5, authenticated Plan200 and its exact artifact/summary byte roots, and added the complete v15 diagnostic/preflight/authorization/review/live/adjudication/eligibility/tracking toolchain.
- Ran diagnostic-v6 exactly once: 16/16 requests succeeded, 2/2 sessions cleaned up, zero preflights and zero Matches ran, and all authority remained false.

## Task Commits

1. **Task 1 RED: ordering, rapid-exit, and v15 custody regressions** - `c86f1cf5`
2. **Task 1 GREEN: minimal lifecycle repair and v15 toolchain** - `edc35fa3`
3. **Task 1 fix: exact attempt-8 byte-root custody** - `a27c5d00`
4. **Task 2: immutable attempt-9 diagnostic-v6** - `9aa3c12a`

## Diagnostic Result

- Source commit: `a27c5d007131301a6d93029ed75734e7fd40c8d9`
- Source tree: `46f68a7759332b3f72971c964bfce006118ba5c5`
- Executable closure: `sha256:0572eef74c5fd271121c12ef1ba28654e80fd8edfbc03c00d85674ef2e9dd33c`
- Diagnostic-v6 byte root: `sha256:02decbcd7dd02b85f0247b1d699fbe92e32b230ad56f82a612d2bd11cf1068a0`
- Requests: 16 planned, 16 attempted, 16 successful
- Cleanup: 2 expected, 2 closed, complete
- Accounting: attempt 9/10, one attempt remaining, 0 preflights, 0 Matches

## Decisions Made

- Arrival order is not evidence of lifecycle invalidity. Acceptance depends only on the complete exact three-event invariant within the unchanged deadline.
- Diagnostic-v6 is confirmation evidence only. It makes Plan202 eligible but grants no Match, candidate, formation, public, production, archive, or tag authority.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test] Narrowed the no-ACK assertion**
- **Found during:** Task 1 GREEN verification
- **Issue:** A broad `/ack/` pattern matched the word `stack` inside embedded runtime harness source.
- **Fix:** Assert absence of explicit ACK message kinds instead.
- **Files modified:** `scripts/lib/v1-38-lean-container-match-session.test.ts`
- **Verification:** 114 focused tests pass.
- **Committed in:** `edc35fa3`

**2. [Rule 1 - Custody] Authenticate diagnostic-v5 as a byte root**
- **Found during:** Task 1 source-only custody
- **Issue:** The plan-provided diagnostic-v5 root is the exact file-byte SHA-256, while the first implementation compared it to the canonical-object hash.
- **Fix:** Hash the committed artifact bytes directly and retain separate structural validation.
- **Files modified:** `scripts/check-v1-38-lean-admission.ts`
- **Verification:** Fresh v15 source-only custody passes.
- **Committed in:** `a27c5d00`

**3. [Rule 2 - Historical validation] Permit additive successor runtime bytes**
- **Found during:** Task 1 GREEN verification
- **Issue:** The v13 historical validator required current runtime bytes to remain identical to the old v13 source, preventing any additive successor repair.
- **Fix:** Preserve exact historical commit/tree/closure/control validation while removing only the obsolete comparison against current successor bytes.
- **Files modified:** `scripts/check-v1-38-lean-admission.ts`
- **Verification:** Historical projections and fresh v15 custody both pass.
- **Committed in:** `edc35fa3`

---

**Total deviations:** 3 auto-fixed (2 Rule 1, 1 Rule 2)
**Impact on plan:** All changes preserve immutable history and the narrow repair boundary; no scope, rule, resource, privacy, or execution authority changed.

## Issues Encountered

None remain. The attempt-9 diagnostic passed exactly and cleanup completed.

## Known Stubs

None.

## Threat Flags

None. No endpoint, production path, persistence schema, public surface, gameplay rule, formation, or Match execution was added.

## User Setup Required

None.

## Next Phase Readiness

- Plan202 is eligible for exactly one final non-consuming preflight-v12 under unchanged bounds.
- Plan175 remains blocked until Plan202 commits an exact passing preflight, authorization-v15, and zero-blocker seven-category review.
- One bounded attempt remains; diagnostic-v6 must not be rerun.

## Self-Check: PASSED

- All four task commits exist.
- 114 focused tests passed with 25 historical skips; TypeScript compilation passed.
- Fresh v15 source custody and committed diagnostic-v6 checks passed.
- Diagnostic-v6 is complete at 16/16 requests and 2/2 cleanup, with zero preflight and Match invocations.
- No owned container remains and exactly 36 successor locks remain.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-09-10*
