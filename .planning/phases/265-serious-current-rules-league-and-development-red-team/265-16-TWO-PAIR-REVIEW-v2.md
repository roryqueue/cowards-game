---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
reviewed: 2026-10-07T23:11:07Z
depth: deep
status: issues_found
source_commit: e025739ac25e67a7be8a0b67327ac4deaa40dc67
diff_base: 65802b5c94b84057c3b69aad24239498e626a202
submitted_source_root: sha256:f4340180cc94daa4d85764d6be11e5eaf416e9a6098009bee21f1cf9a36e6ee1
submitted_source_entries: 910
independently_reviewed: true
author_agent: /root
reviewer_agent: /root/review_two_pair_v11
empirical_admission: false
files_reviewed: 9
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.test.ts
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-baseline-retained.test.ts
  - scripts/lib/v1-38-lean-baseline-retained.ts
  - scripts/lib/v1-38-lean-correction-retained.test.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/run-v1-38-lean-correction.test.ts
  - scripts/run-v1-38-lean-correction.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
---

# Phase 265 Plan 16: Independent two-pair source re-review v2

## Narrative Findings (AI reviewer)

### Summary

One remaining BLOCKER prevents source-clean admission. The four atomic fixes were reviewed against the original findings and their connected prepare/run, accepted-FINAL, ordinary reader, refusal-prefix, terminal-only and carry consumers. The original nine-file scope is retained; the new fix diff changes five source/test files. The original review and fix record were read. No structural pre-pass was supplied.

CR-01's required-row checks and inherited cumulative debit are now enforced by the shared no-refund inventory helper. CR-03 now validates the complete predecessor before removing report rows for the schedule-only view. CR-04 now binds terminal publication to source, HEAD, exact request and actual entry bytes, with post-publication checks and a completed seal. CR-02's missing request/report/admission/refusal/count/clock joins are substantially repaired, but its new no-ledger predecessor reinspection invalidates a genuinely closed refused pair when the next pair starts (CR-05 below).

This is source-only review. No tests, provider work, Matches, empirical admission, private payload inspection, old ordinary-reader invocation, source edit or commit was performed. The fix record reports 17 focused passes and an isolated expanded result of 128 passing, four missing-old-store failures and nine historical skips, not a fully green expanded regression. Its injected historical predecessor/source authority is not proof of actual historical custody and masks the live transition reported below. No RSS repair or empirical feasibility is claimed.

## Critical Issues

### CR-05: BLOCKER — Authentic no-ledger pair-1 refusal becomes unauthentic as pair 2 starts

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:800`

**Affected:** retained lines 817-819, 833, 889 and 899; `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:498`, `:533`, `:1226` and `:1231`.

**Issue:** For a genuine preparation refusal with no ledger, the new terminal-report authenticator obtains its predecessor by rerunning the live admission inspector for the old route. That inspector is not a read-only historical authenticator: at runner line 533 it refuses every `v11-1` inspection once any `v11-2` route has a store, allocation, prepare/run start marker or carry. Pair-2 preparation publishes its exclusive `admission-prepare-start.json` at lines 1226/155 *before* reading/authenticating the request. The pair-2 request then authenticates the prior pair's closed outcome at line 498, which reauthenticates the old carry through retained lines 899 → 889 → 833 → 800. Because pair 1 has no ledger, that call reaches the `v11-1` inspector and now throws `SPENT_DESTINATION` on the very pair-2 start marker just published.

Thus the allowed sequence “valid pair-1 preparation refusal → completed terminal-only check/carry → fresh pair 2” necessarily refuses during pair-2 preparation, even though all old bytes remain unchanged and all counts/clocks are authentic. The refusal also spends pair 2, so this is not a harmless temporary guard. The ledger-present path avoids the reinspection because it has an allocation predecessor; the no-ledger branch is explicitly approved and must also work. More generally, reconstructing the old report's exact predecessor using a current live inventory makes that report depend on later optional report additions, instead of authenticating its sealed historical snapshot and separately charging subsequent growth.

The added positive lifecycle test replaces `inspectLeanTwoPairPredecessorV11` with `mockReturnValue(predecessor)`, so it never exercises this actual admission guard. Its successful closed-outcome assertions do not validate the pair-2 transition.

**Fix:** Separate historical no-ledger refusal custody reconstruction from live destination/admission inspection. Authenticate the prior predecessor's historical/prior-pair root, setup witness, exact inherited count and uninterrupted elapsed floor against the recorded actual preparation start, then validate its sealed rows/full debit with the same no-refund rule. Do not redispatch old live spent-destination checks when reading a completed carry, and do not reconstruct its exact original report body from newly added optional report rows. If adding a finite refusal predecessor snapshot, bind it to independently authenticated historical/prior-pair custody and actual admission/refusal records; a self-rooted report or caller-supplied bypass must not confer authority. Keep the live anti-reuse guard intact for genuinely new `v11-1` admission. Add an inert regression exercising the real historical-read versus live-inspector separation: authenticate a completed no-ledger pair-1 refusal, publish the actual pair-2 prepare-start marker, and reauthenticate the unchanged pair-1 closed outcome successfully while new pair-1 admission remains rejected. Do not mock away the specific inspector branch under test.

---

Only this review artifact was created. No empirical route is admitted while CR-05 remains open; fixed source must be independently re-reviewed after repair.
