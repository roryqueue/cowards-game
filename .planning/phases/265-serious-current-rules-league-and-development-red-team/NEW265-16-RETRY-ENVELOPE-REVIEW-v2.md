---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-06T16:38:52Z
depth: standard
scope: focused_re_review_CR01_CR02_CR03_WR01
source_commit: 3471f03e25c14a58791bed867137da94a6cc33c9
diff_base: 1df78472446cb756aa060f279e96dc612e4885ee
source_root: sha256:5ec6dfb57fa24af653182412f434e7279c207be41d6037b1865340f9d5950eb5
independently_reviewed: true
author_agent: /root/execute_265_retry_envelope
fixer_agent: /root/fix_265_retry_envelope
reviewer_agent: /root/review_265_retry_envelope
files_reviewed: 7
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-baseline-retained.test.ts
  - scripts/lib/v1-38-lean-baseline-retained.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-host-stage-v8.test.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
empirical_executed: false
---

# Phase 265 Plan 16: Focused Retry Envelope Re-review

## Narrative Findings (AI reviewer)

### Summary and prior-finding dispositions

Read the integrated fix diff at fixed HEAD, the fix report and refreshed 900-entry inventory. The recorded ordinal-1 source root is shown above. This is a narrow re-review of the original four findings, not a new broad audit. Original REVIEW-v1 is preserved.

CR-01 is addressed: the actual baseline gate now authenticates the diagnostic's own immutable HEAD and separately authenticates baseline current HEAD, source equality, ancestry and both committed allocation bytes. Distinct commits are allowed without relaxing fixed-source holds.

CR-02 is addressed: readers pass the not-yet-imported gap into `max(journal + gap, whole-task wall floor)` and the check validator no longer allows a second gap debit. Default arguments and legacy callers preserve old accounting semantics.

CR-03 is partly addressed: truthful MAIN admission-failure receipts, exclusive absent-reader start/final-close and null genuinely absent child custody support pre-ledger preparation and observed pre-entry cleanup. Present/corrupt child custody refuses. The early-run ordering below remains incorrect.

WR-01 is addressed within the requested source-only scope: fixtures call the actual ordinal-2 request reader for refused/absent predecessor closure and negative ordinal/closure/continuation/authorization cases; baseline publisher, issuer and selected reader see distinct commit identities. Realistic wall-gap and pre-ledger/pre-entry fixtures were added. The fix report records eight targeted passed cases; this reviewer did not rerun tests. The selected baseline fixture still truthfully ends at absent-result refusal, not complete baseline acceptance or empirical 36-cell completion. No ordinal-3 positive end-to-end or final combined-suite success is inferred.

## Critical Issues

### CR-03: BLOCKER — Early run scope refusal still cannot close the spent attempt with an existing ledger

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:934`

**Related locations:** Same file lines 931-935, 942 and 793; `closeLeanCorrectionAdmission` lines 124-138; `authenticateLeanRetryAdmissionFailureV8` existing-store branch.

**Issue:** A prepared run already has a real ledger/store. The run first durably publishes `admission-run-start.json`, initializes `accountingLedger = null`, and calls `scope` before reopening that ledger. If scope refuses—for example an incorrect coordinator heap/environment—the actual `finally` calls `closeLeanCorrectionAdmission(carrier, null)`. Its close receipt truthfully contains `allocationRoot: null` and `ledgerInterval: null`, and no run-finalization journal interval is appended. The new failure publisher then sees the existing store, reopens it, and records the real nonnull allocation root. Its authenticator's existing-store branch requires the close's allocation root to match that root and requires a real closed ledger interval. These necessarily fail for this path. The spent run cannot be rerun, the absent reader cannot authenticate the failure, and successor admission still requires the missing closure. Thus the zero-charge early-run case from the original CR-03 remains stranded despite the now-working pre-ledger prepare case.

**Fix:** For v8 run finalization, acquire/bind the existing authentic accounting ledger before the scope guard can fail, or have the trusted finalizer safely reopen and finalize that exact ledger on a pre-scope failure. Preserve scope refusal, immutable spent admission, real accounting and zero charges; do not manufacture child entry, child terminal, HEAD, or accepted check. Add an inert actual `leanCorrectionMain` regression with a prepared ledger and deliberate scope refusal, then prove the real close/failure receipt and unique absent closure authenticate, replay refuses, and successor custody remains gated on that closure.

---

No implementation/test edits, test executions, live readers, allocation/capacity, provider, native runtime, Strategy, Match or commits were performed in this re-review. Only this separate review artifact was written. Empirical execution remains unauthorized until MAIN's remaining gates pass on the final repaired identity.
