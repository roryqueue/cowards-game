---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-27T22:12:07Z
depth: deep
files_reviewed: 9
files_reviewed_list:
  - scripts/lib/v1-38-bounded-retry-envelope-v2.ts
  - scripts/run-v1-38-bounded-retry-envelope-v2.ts
  - scripts/run-v1-38-bounded-retry-envelope-v2.test.ts
  - scripts/check-v1-38-plan-262-85-bounded-retry-source-review-v2.ts
  - scripts/check-v1-38-plan-262-85-bounded-retry-source-review-v2.test.ts
  - scripts/check-v1-38-plan-262-88-bounded-retry-admission-v2.ts
  - scripts/check-v1-38-plan-262-88-bounded-retry-admission-v2.test.ts
  - scripts/check-v1-38-plan-262-89-lifecycle-v2.ts
  - scripts/check-v1-38-plan-262-89-lifecycle-v2.test.ts
findings:
  critical: 5
  warning: 0
  info: 0
  total: 5
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-27T22:12:07Z
**Depth:** deep
**Files Reviewed:** 9
**Status:** issues_found

## Summary

The committed v2 empirical evidence is internally consistent with the observed clean exhaustion at fresh `0/540`, and all 117 existing focused tests pass. However, the implementation does not meet its claimed crash-safety and single-publication contracts. Two controller recovery gaps can leave a live envelope terminally unpublishable or misclassify known cleanup as uncertain. Three publication/lifecycle paths can strand partial state or overwrite a concurrently created canonical destination.

These defects do not convert the real `0/540` result into accepted evidence and do not authorize Phase 263. Because the reviewed v2 source and evidence are already sealed history, remediation must preserve those bytes and use an additive successor/correction route rather than rewriting the committed journal, terminal, review, seal, envelope, disposition, or lifecycle artifacts.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: An admitted preflight can be stranded across a crash, leaving an active envelope with no capacity

**File:** `scripts/run-v1-38-bounded-retry-envelope-v2.ts:300-317,377-380`

**Issue:** Recovery only recognizes a preflight reservation with no observation. It does not recognize an already observed, threshold-admitted preflight that has no matching `reserve_route`. A crash at the durable journal boundary after `observe_preflight` and before `reserve_route` therefore loses the only route admission associated with that observation. If the remaining observations are refused, replay does not call the envelope exhausted because not every observation is below 2,500, while `nextPreflightIdentity` is `null`; the loop breaks and returns `disposition: active`. Production then cannot publish the required terminal. I reproduced this with one durable `2500` observation followed by eleven `2499` observations: the result was active with zero remaining observations and zero route starts.

The real SIGKILL matrix does not cover this boundary: the generic `journal_fsync` hook kills on the first record fsync, so it proves reservation recovery but not each semantically distinct journal transition.

**Fix:** Add recovery for an admitted observation that lacks a route reservation. Either durably reserve the next route for that same preflight and then fail closed/continue under the frozen rules, or append a distinct integrity terminal that charges the observation and closes the envelope. Add SIGKILL tests after every journal event, especially admitted observation, route reservation, admitted calibration, and each terminal event. If sealed v2 source is immutable, implement this in an additive successor source version and explicitly supersede the zero-finding source review.

### CR-02: Deadline checks discard completed effect results and create an unreconcilable terminal journal

**File:** `scripts/run-v1-38-bounded-retry-envelope-v2.ts:434-456,468-490`

**Issue:** After `runCalibration` or `runReproduction` returns, the controller calls `deadlineGuard()` before durably appending the corresponding finish record. If the effect crosses the inclusive four-hour boundary, the guard appends `time_window_expired` and returns. The journal is now terminal while the calibration or reproduction reservation remains unfinished. Derived state reports `completeCleanup: false` even when the completed effect proved cleanup, and a restart cannot reconcile the reservation because replay rejects every record after a terminal (`V138_RETRY_ENVELOPE_TERMINAL`). I reproduced a complete-cleanup calibration that crossed the deadline: the journal ended with `reserve_calibration,time_window_expired`, derived an exhausted/cleanup-false state, and restart failed.

This turns a clean deadline exhaustion into an assurance defect and loses the already observed effect/cleanup result. The same ordering can discard an exact reproduction result.

**Fix:** Once an effect has started, always append its finish record first, preserving its observed status and cleanup, then apply the deadline as the next terminal decision if the envelope is still active. Define precedence explicitly for an exact reproduction completed at/after the deadline; the frozen contract must decide whether that is expiry or success, but the effect terminal and cleanup facts must remain durable. Add boundary tests for preflight, calibration, and reproduction effects that advance monotonic time to exactly and beyond the deadline, plus restart checks.

### CR-03: Review and seal/envelope pair publication can be stranded half-written

**Files:** `scripts/check-v1-38-plan-262-85-bounded-retry-source-review-v2.ts:664-690`; `scripts/run-v1-38-bounded-retry-envelope-v2.ts:909-930`

**Issue:** Both canonical pairs are published as two independent exclusive creates. The review pair does not fsync either file or its parent and attempts an unlink rollback only for an ordinary second-write exception; a crash can leave just the JSON. The seal/envelope pair fsyncs individual files but has no recovery path if the process dies after the seal is durable and before the envelope is created. A rerun rejects the already present first member instead of authenticating it and completing the exact missing member. For the separately committed direct-child seal, that partial state can consume the only authorized seal attempt without producing a checkable envelope.

**Fix:** Use a durable pair transaction: precompute both exact byte strings, create/fsync staged files, record/fsync transaction intent, publish with no-replace semantics, fsync the parent, and make restart authenticate any existing member byte-for-byte before completing only the missing member. Never unlink a possibly durable canonical member as rollback. Add crash probes after each file and parent fsync for both pairs.

### CR-04: The lifecycle publisher's rename can overwrite a concurrently created canonical artifact

**File:** `scripts/check-v1-38-plan-262-89-lifecycle-v2.ts:466-491`

**Issue:** `atomicPublish` checks that the target is absent, writes a PID-named temporary file, then uses `renameSync(temporary, target)`. POSIX rename replaces an existing destination. A second process can create readiness-v2 or lifecycle-status-v2 after the absence check and before the rename; this process will silently overwrite it, violating the additive immutable publication and fail-closed destination contract. There is no lock around this path.

**Fix:** Publish with a no-replace primitive or an exclusive final-component create. If temporary-file durability is required, acquire a kernel lock for the destination transaction, recheck the final component under that lock, and fail on any existing byte rather than replacing it. Add a synchronized race test that creates the final destination between staging and publication and asserts conflict without mutation.

### CR-05: Pass-side lifecycle mutation is not crash-atomic or restart-safe

**File:** `scripts/check-v1-38-plan-262-89-lifecycle-v2.ts:821-860`

**Issue:** On an exact pass, the driver runs four independent mutating GSD commands (requirements, roadmap, state, phase completion) and only afterward publishes lifecycle-status-v2. Any command failure or process death can leave a prefix of those project files mutated with no lifecycle status. A retry begins from the first command again with no durable step journal; `state.record-session` can duplicate history, and later commands may observe already-partial completion. The tests cover only all-success ordering and the non-pass zero-mutation branch, not failure after each pass-side step.

**Fix:** Make the pass transition transactional and restartable. Prefer deriving all target bytes first and committing them with one durable transaction; otherwise write a hash-chained lifecycle-step journal with before/after hashes, make each operation idempotent, verify its exact postcondition before advancing, and recover from every prefix. Publish lifecycle-status-v2 only after all exact postconditions hold. Add injected failures after each of the four commands and prove deterministic convergence without duplicate state history.

## Post-Summary Readiness Command Assessment

The observed failure of `--check-post-summary-driver-ready` after `262-89-SUMMARY.md` exists is **not an additional defect**. Plan 262-89 explicitly defines that command as the pre-summary Stage-1 check, and its implementation intentionally re-derives the 69-summary topology. Stage 2 uses the separate `authenticateCommittedReadiness()` path through `--apply-post-summary`, which authenticates the committed pre-summary readiness without pretending the topology is still pre-summary. The command name is broad, but the fail-closed post-summary rejection matches the written two-stage contract.

## Verification Performed

- Existing focused suites: **4/4 files passed, 117/117 tests passed**.
- Independent admitted-observation crash reconstruction: reproduced `active` with zero remaining observations and no terminalizable route.
- Independent calibration deadline-crossing reconstruction: reproduced `exhausted` with an unfinished calibration, false cleanup, and restart rejection.
- Traced source/review/seal lineage, lockf ownership, journal/private-receipt fsync ordering, exact 2,500-basis-point gate, 3/12/8x4/540 accounting, reproduction privacy projection, Plan-88 independent replay, Route-10 conditionality, and the Plan-89 summary latch.
- Current protected outcome remains non-pass/exhausted, fresh `0/540`, reproduction-v16 absent, correction-v3 absent, Route-10 absent, and downstream authority denied.

---

_Reviewed: 2026-08-27T22:12:07Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
