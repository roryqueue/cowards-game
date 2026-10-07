---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
reviewed: 2026-10-07T23:27:02Z
depth: deep
status: issues_found
source_commit: 956523dd869ac43e9c6dd907aa0f487febdcc34e
diff_base: e025739ac25e67a7be8a0b67327ac4deaa40dc67
submitted_source_root: sha256:4e2c06d1a0cd6272b4e4d4e013e9e2543144d38d7e28174271d22b5b275fd904
submitted_source_entries: 910
independently_reviewed: true
author_agent: /root
reviewer_agent: /root/review_two_pair_v11
empirical_admission: false
files_reviewed: 3
files_reviewed_list:
  - scripts/lib/v1-38-lean-correction-retained.test.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/run-v1-38-lean-correction.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
---

# Phase 265 Plan 16: Independent two-pair source re-review v3

## Narrative Findings (AI reviewer)

### Summary

CR-05 remains open on the connected baseline no-ledger branch. The new recorded-predecessor authenticator fixes the reported diagnostic no-ledger transition: it authenticates independent lineage, exact inherited counts, setup/preparation/request joins, recorded elapsed/debit and required rows without reconstructing the old report from later optional inventory. Growth is separately measured by future live inspection. Prior CR-01 through CR-04 safeguards remain intact in this bounded diff: required-row/full-debit no-refund accounting, full predecessor validation, exact terminal/admission/refusal/time-prefix/count joins, and source/HEAD/request/entry publication holds.

The three changed source/test files in atomic `956523dd` and their connected accepted-closure call chain were reviewed against `REVIEW-v2` and `REVIEW-FIX-v2`. No tests, providers, Matches, empirical routes, old ordinary-reader invocation, private payload inspection, source edit or commit were performed. The fix record's 81 passes/nine historical skips, build/shell passes and six inherited strict errors are disclosed results, not independently executed evidence. Injected unavailable historical/source authority is not actual historical custody proof. No structural pre-pass was supplied.

## Critical Issues

### CR-05: BLOCKER — Recorded baseline refusal still reaches the old live diagnostic guard transitively

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:535`

**Affected:** runner lines 481-484, 552-554, 564-568, 580-582 and 512; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:801`, `:338-342`, `:370`, `:393`, `:889` and `:903`.

**Issue:** The new historical reader avoids the live inspector directly, but its `route === "baseline"` branch still calls `authenticateLeanTwoPairAcceptedJoinV11`. That performs the full accepted diagnostic closure authentication. Inside that closure authentication, `authenticateLeanSupervisorDiagnosticCheck` issues its private accepted-lineage purpose and reads the diagnostic request. The diagnostic request reader calls `inspectLeanTwoPairPredecessorWithJoinV11` at runner line 512. Although that inspector recognizes the authentic private purpose at line 564, its pair-1/pair-2 spent check at line 568 remains unconditional; only the same-pair baseline-spent check at line 570 excludes accepted-lineage reads.

Therefore a valid sequence “pair-1 diagnostic accepted with actual FINAL → pair-1 baseline preparation refused before allocation → completed baseline terminal check/carry → fresh pair-2 preparation” still fails. Pair-2 preparation publishes its exclusive start marker before authenticating the prior closed pair. The prior closed-outcome authenticator needs the baseline carry at retained line 903. Because that baseline has no ledger, it reaches the recorded-predecessor authenticator at line 801, follows the accepted-diagnostic chain above, and throws `SPENT_DESTINATION` on the fresh pair-2 marker. This still violates the approved ability to proceed after any authentic closed pair-1 outcome and spends pair 2 on the failed preparation.

The strengthened lifecycle fixture fixes the original mocked-inspector gap but fixes `route = "diagnostic"` at test line 517, so it does not exercise this transitive baseline path. The finding is a call-chain defect, not a request for another empirical run or an assertion that the disclosed test results are false.

**Fix:** Ensure the genuinely private accepted-lineage authentication path is historical throughout, including the transitive diagnostic request inspection. For example, narrowly exclude the already-authenticated private purpose from the pair-1/pair-2 live-destination guard, or route it through the independently authenticated recorded-lineage reader. Keep the real live `v11-1` guard intact, reject caller-made purpose objects, preserve exact accepted check/actual FINAL/source/request joins and one complete accepted-closure audit per consumer; do not introduce a public boolean bypass or reuse prior-pair acceptance for the new pair. Add an inert connected regression for a no-ledger **baseline** refusal after a valid accepted own diagnostic, then publish a genuine pair-2 prepare-start marker and authenticate the unchanged pair-1 closed outcome. Exercise the real private-purpose dispatch/live-guard branch and separately assert genuinely new pair-1 admission remains rejected.

---

Only this review artifact was created. Source-clean admission remains withheld until the residual CR-05 path is repaired and independently re-reviewed.
