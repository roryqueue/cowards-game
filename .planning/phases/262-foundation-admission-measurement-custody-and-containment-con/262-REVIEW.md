---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-27T15:44:42Z
depth: deep
files_reviewed: 11
files_reviewed_list:
  - scripts/lib/v1-38-bounded-retry-envelope.ts
  - scripts/run-v1-38-bounded-retry-envelope.ts
  - scripts/run-v1-38-bounded-retry-envelope.test.ts
  - scripts/check-v1-38-plan-262-77-bounded-retry-source-review.ts
  - scripts/check-v1-38-plan-262-77-bounded-retry-source-review.test.ts
  - scripts/check-v1-38-plan-262-83-bounded-retry-source-rereview.ts
  - scripts/check-v1-38-plan-262-83-bounded-retry-source-rereview.test.ts
  - scripts/check-v1-38-plan-262-80-bounded-retry-admission.ts
  - scripts/check-v1-38-plan-262-80-bounded-retry-admission.test.ts
  - scripts/check-v1-38-plan-262-81-lifecycle.ts
  - scripts/check-v1-38-plan-262-81-lifecycle.test.ts
findings:
  critical: 4
  warning: 0
  info: 0
  total: 4
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-27T15:44:42Z
**Depth:** deep
**Files Reviewed:** 11
**Status:** issues_found

## Summary

The five fix commits do not produce a clean bounded-retry successor. Four blocker-tier defects remain. Cleanup truth is still incorrect for expiry with pending work and is omitted from the derived-state root; production crash recovery remains unable to recover a stale owner lock or a journal/private-receipt split; the corrected Plan-83 review is still primarily token-presence attestation; and the post-run correction has made the canonical seal, Plan-80 disposition, read-only outcome checks, and real Plan-81 lifecycle join mutually inconsistent.

The immutable live bytes were not changed by this review. Before and after all checks, the journal SHA-256 remained `14e66af5...67a14`, the terminal remained `b79dc330...8ac3`, all 15 private-receipt hashes were identical, and the Plan-80 disposition remained the recorded exhausted `0/540` non-pass. Those bytes remain honest raw historical evidence of what occurred. However, the corrected reviewer now rejects the historical zero-finding premise that authorized the seal, so the seal/envelope and old Plan-80 disposition cannot currently be authenticated as a valid assurance chain. This is a post-run audit correction to the trust conclusion, not a mutation of the empirical result. The repository does not yet represent that correction with a canonical additive audit/disposition artifact.

Focused verification confirmed the regression:

- Both real read-only controller modes fail with `V138_RETRY_SOURCE_CUSTODY_INVALID`.
- Plan 83's canonical `--check-review` fails with `V138_PLAN_262_83_REVIEW_MISMATCH`; its fresh derivation instead reports three historical findings.
- Plan 80's canonical `--check-disposition` fails with `V138_PLAN_262_80_DISPOSITION_INVALID`; fresh derivation adds `GIT_CUSTODY_INVALID` and `SEAL_ROOT_INVALID` and changes the disposition root from `sha256:5fe2...cccdf` to `sha256:0257...f96df`.
- The real Plan-81 post-summary command fails before it can prove the required non-pass/no-mutation result because canonical Plan-80 authentication fails.
- The serialized five-suite run stopped with one Plan-80 failure after 38 passing tests. The Plan-81 suite separately passed 8/8, TypeScript passed, and `git diff --check` passed.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Cleanup truth remains forgeable and reports pending work as clean

**Classification:** BLOCKER

**File:** `scripts/lib/v1-38-bounded-retry-envelope.ts:582-650`; `scripts/run-v1-38-bounded-retry-envelope.ts:228-268`

**Issue:** The CR-01 fix added `completeCleanup`, but computes it only from completed calibration/reproduction terminals. Empty terminal collections pass `.every()`, and an absent reproduction terminal passes `state.reproductionTerminal?.completeCleanup !== false`. On restart after the deadline, `deadlineGuard()` appends `time_window_expired` before pending-reservation reconciliation. A journal containing `reserve_calibration` (or `reserve_reproduction`) with no finish record therefore becomes `exhausted` with `completeCleanup: true`, even though cleanup is unproved. A focused reproduction produced exactly that state with one charged route/eight charged calibration identities and no terminal cleanup record.

The new field is also added only after `body` is constructed, while `stateRoot` hashes `body`. Consequently, `completeCleanup` is not authenticated by `stateRoot`; two projected states with different cleanup truth share the same derived-state root. This leaves the original evidence-integrity defect only partially fixed.

**Fix:** Treat every reserved-but-unterminated calibration/reproduction as incomplete cleanup. Reconcile pending work before expiry terminalization or encode an explicit cleanup-unknown terminal before expiry. Include `completeCleanup` inside the exact object hashed into `stateRoot`, and add boundary tests for expiry with each pending reservation plus a test proving cleanup mutation changes the root.

### CR-02: The audit correction invalidates the canonical trust chain without a canonical correction disposition

**Classification:** BLOCKER

**File:** `scripts/run-v1-38-bounded-retry-envelope.ts:929-987`; `scripts/check-v1-38-plan-262-80-bounded-retry-admission.ts:205-332,744-848,1151-1182`; `scripts/check-v1-38-plan-262-81-lifecycle.ts:289-317,478-518`

**Issue:** The corrected Plan-83 reviewer truthfully rejects the historical Plan-83 source/review, but the rest of the chain still requires that historical zero-finding review and also requires the current source bytes to equal the sealed parent with no later rewrite. The fix commits necessarily changed those source files. As a result, `checkPublishedPair()` cannot authenticate the historical seal, Plan 80 derives `SEAL_ROOT_INVALID` plus `GIT_CUSTODY_INVALID`, the committed Plan-80 disposition no longer equals fresh derivation, and Plan 81 cannot authenticate its canonical admission input.

This means the newly added read-only modes are present but unusable against the only real published run. It also means the old Plan-80 disposition and Plan-81 validation/verification continue to claim integrity passed even though the current independent derivation rejects their seal/review premise. Raw journal/terminal/private evidence remains immutable and still proves an exhausted empirical `0/540`; the assurance conclusion does not.

**Fix:** Publish an additive, immutable post-run audit-correction artifact that binds the historical seal/envelope/live bytes, the old Plan-83 review root, the new rejected historical re-review result, and the resulting downgraded/non-pass trust status. Update Plan 80 and Plan 81 to consume that correction without requiring current source to equal historical sealed bytes, while still authenticating both historical blobs and every later correction commit. Make the read-only modes validate the sealed historical commit from Git plus the additive audit chain, not the mutable working tree. Refresh validation/verification to state that empirical `0/540` is preserved but the earlier integrity-pass conclusion is superseded.

### CR-03: Production crash recovery is still blocked by the owner lock and split durable writes

**Classification:** BLOCKER

**File:** `scripts/run-v1-38-bounded-retry-envelope.ts:1254-1277,1396-1462`

**Issue:** The CR-03 tests call `publishV138RetryOutcome()` directly and simulate exceptions after writes, but the real production path first exclusive-creates `<journal>.lock` and removes it only in `finally`. A process or host crash skips `finally`; the next invocation fails immediately because the lock destination is present. There is no authenticated stale-lock takeover or restart protocol, so the reproduction-first recovery path is unreachable after a real crash.

The journal record and its private receipt are also two separate durable operations: the public journal is appended/fsynced first, then the private receipt is exclusive-created/fsynced. A crash between them leaves an authenticated journal with a missing required receipt, and no recovery path recreates that receipt. The current crash-boundary tests cover neither production lock recovery nor the journal/receipt split.

**Fix:** Make the production ownership record recoverable with an authenticated lease/generation and compare-and-takeover protocol, or use an OS lock whose ownership disappears on process death. Make each journal/receipt transition recoverable: persist a single canonical record once and derive/link the second view, or add a restart reconciler that authenticates the journal record and exclusive-creates the exact missing private receipt before further work. Exercise real subprocess termination/power-loss-equivalent boundaries around lock creation, journal fsync, receipt write/fsync, reproduction write/fsync, terminal write/fsync, and prove convergence without rerunning an identity.

### CR-04: Plan 83 remains token-presence self-attestation and misses current semantic defects

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-83-bounded-retry-source-rereview.ts:150-326,532-652`; `scripts/check-v1-38-plan-262-83-bounded-retry-source-rereview.test.ts:73-204`

**Issue:** The CR-04 fix added four more source-string checks and maps findings to observation booleans, but it did not replace token counting with behavioral independent verification. `inspectV138Plan26283SourceMutation()` still accepts implementations based on literal strings, regex matches, relative token order, and the presence of a named test. Its mutation suite only replaces those strings and asserts the corresponding string checker fires. The detached harness still exercises only the historical expiry behavior.

This reviewer returns no findings for the current source despite CR-01's executable pending-cleanup failure, the broken real post-run modes/Plan-80 join, and CR-03's unrecoverable production lock. Most observation rows also remain `passed: true` for unrelated mutation findings because only four IDs are explicitly correlated. Thus the old three defects are now detected, but the underlying review-integrity failure remains.

**Fix:** Execute each reviewed semantic family against exact committed bytes with independent expected outcomes. Add real behavioral cases for pending cleanup, cleanup-root binding, current post-run authentication, canonical Plan-80/81 joins, stale production-lock recovery, and journal/private-receipt crash boundaries. Derive every observation's pass value from its own result and make any incomplete/unexecuted observation a finding. Token/AST checks may supplement, but must not determine the zero-finding verdict.

## Prior Finding Closure Audit

| Prior finding | Current status | Evidence |
|---|---|---|
| CR-01 cleanup derivation | **OPEN** | Pending reservations can expire as clean; cleanup is outside `stateRoot`. |
| CR-02 forged lifecycle PASS | **CLOSED AS SCOPED** | Production entry now calls canonical Plan-80 authentication and exact activation comparison; the real join is fail-closed, though currently blocked by CR-02 above. |
| CR-03 success publication recovery | **OPEN** | Reproduction-first ordering improved, but actual process crash leaves an unrecoverable lock and journal/receipt splits. |
| CR-04 semantic source review | **OPEN** | Historical issues are detected through added text predicates, not independent semantic execution. |
| WR-01 post-run modes | **OPEN** | Exact modes exist, but both fail on the canonical published run with source-custody mismatch. |
| WR-02 rerunnable tests | **CLOSED AS SCOPED** | Plan-77/83/controller tests run after publication without deleting or mutating live artifacts. |

## Current Bounded-Retry Verdict

**ISSUES FOUND.** Do not mutate or retry the exhausted evidence. Preserve the journal, terminal, private receipts, absent reproduction-v15, absent Route-9 activation, and recorded empirical `0/540`. ADMIT-03 and Phase 263 remain blocked. Before this machinery is used again, publish a new additive audit lineage that truthfully supersedes the historical zero-finding assurance claim, repair cleanup and crash recovery, and make all canonical read-only/admission/lifecycle checks agree.

## Prior Review History (preserved)

### 2026-08-27 initial bounded-retry successor review

The first deep review at commit `ad71dbbf` reported six findings: forged cleanup truth, self-consistent forged lifecycle PASS acceptance, non-recoverable success publication ordering, token-presence Plan-83 review, missing post-run modes, and tests coupled to pre-publication filesystem state. Fixes were recorded in `d5c967cd`, `566a52b2`, `bb3691b0`, `4b838155`, and `fae54bba`, with the fix report committed in `3370bf14`. This fresh review is the closure audit of those changes; the table above records which findings actually remain closed.

### 2026-08-26 Route-8 cumulative review

The earlier Route-8 review covered only:

- `scripts/check-v1-38-plan-262-69-route-8-source.ts`
- `scripts/check-v1-38-plan-262-69-route-8-source.test.ts`
- `scripts/check-v1-38-plan-262-70-route-8-source-review.ts`
- `scripts/check-v1-38-plan-262-70-route-8-source-review.test.ts`

**Historical status:** `clean` (0 critical, 0 warning, 0 info).

That historical verdict applied only to those four Route-8 files at integrated main HEAD `aec0d8533c9e4c2eebfd1c3b79449caf0755ff3f`. It resolved F-07 through F-09, including normalized/raw source provenance, first-parent source custody, detached non-mutation proof, and exact historical compatibility pinned to publication commit `05b10d6343eb0883db3b99bd5689220166c80169`. It is not reinterpreted as a verdict on the bounded-retry successor reviewed here.

---

_Reviewed: 2026-08-27T15:44:42Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_

## REVIEW COMPLETE
