---
phase: 265
fixed_at: 2026-10-07T23:23:51Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-TWO-PAIR-REVIEW-v2.md
iteration: 2
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
source_head: 956523dd869ac43e9c6dd907aa0f487febdcc34e
source_root: sha256:4e2c06d1a0cd6272b4e4d4e013e9e2543144d38d7e28174271d22b5b275fd904
source_entries: 910
empirical_admission: false
---

# Phase 265: Two-pair v11 Code Review Fix Report v2

**Source review:** `265-16-TWO-PAIR-REVIEW-v2.md`  
**Iteration:** 2  
**Summary:** One BLOCKER in scope, fixed in one atomic commit; none skipped. The previous four fixes and their artifacts remain intact. This report is intentionally uncommitted for MAIN to retain.

## Fixed Issues

### CR-05: Authenticate sealed no-ledger refusal history independently of live admission availability

**Status:** diagnostic refusal fixed; baseline accepted-lineage variant remains open in REVIEW-v3  
**Commit:** `956523dd` — `fix(265): CR-05 separate sealed refusal history from live admission`  
**Files modified:** `scripts/run-v1-38-lean-correction.ts`, `scripts/lib/v1-38-lean-correction-retained.ts`, `scripts/lib/v1-38-lean-correction-retained.test.ts`.

Historical no-ledger terminal authentication now reads the predecessor snapshot already sealed in the actual terminal report. It validates that snapshot against independently authenticated pinned historical custody or the prior closed pair, actual setup witness/request, and actual preparation-start time. The finite terminal authenticator still joins exact admission start/close, refusal witness, reader interval, report bytes/root, completed hold, and carry bytes/root. The snapshot's own root does not confer authority, and the private caller-supplied predecessor is only an equality check, not a bypass.

Live and historical readers share immutable lineage reconstruction; only genuine live inspection applies destination/spent-route guards and measures prospective optional inventory. The live `v11-1` guard still rejects after a real `v11-2` prepare-start marker exists. Historical reads do not redispatch that old-route live guard.

Validation enforces the exact independent count, history/setup/start joins, uninterrupted elapsed floor including inherited elapsed, inherited row inclusion, actual immutable file rows, and exact maximum floor/inherited cumulative debit plus recorded positive growth. Every saved consumed row is rechecked with the existing no-refund helper, so deletion/shrink still rejects. Later optional reports or row growth do not rewrite/rederive the old exact report body; prospective pair-two inspection measures and charges those bytes.

## Verification

The expanded inert lifecycle fixture no longer mocks `inspectLeanTwoPairPredecessorV11`. It injects only unavailable old pinned historical custody and the functional-source observer. Actual new admission helper records, preparation refusal, full request, report/carry/completed seal, filesystem byte/physical inventories, and small fixture Git HEAD are real isolated reads.

RED on the pre-fix source reproduced `LEAN_CORRECTION_SPENT_DESTINATION` during unchanged pair-one closed-outcome reauthentication immediately after the actual pair-two preparation-start publication. GREEN demonstrates all of:

- Authentic no-ledger pair-one refusal and completed carry authenticate before and after the actual pair-two prepare-start marker.
- Genuine new pair-one live inspection still rejects with `SPENT_DESTINATION`.
- New optional report publication and further growth leave the original report bytes and carry value unchanged and reauthenticatable.
- Real pair-two live inspection includes the new report, charges positive growth prospectively, preserves all 32 inherited charges and elapsed/debit floors, and rejects deletion once that row is consumed.
- Re-rooted recorded predecessors with altered count, elapsed floor, history root, debit, or missing inherited rows reject.
- Existing ledger-failure prefix, real no-entry/entered-no-result, report mutation, missing admission custody, source/HEAD/request/entry hold, and postpublication mutation regressions remain passing.

Final relevant runner plus full retained regression ran on one fixed source snapshot: **81 passed / 9 historical-fixture skips**, two files passed, no failures; duration **51.49 seconds**. The focused lifecycle GREEN before final hardening also passed; final full regression includes that strengthened case.

Strategy-lab TypeScript project build, shell syntax, diff checks, and modified-source rereads passed. Strict transitive script checking exits 2 with only the same six inherited errors in `feasibility-protocol.ts:52` and `planner/missions.ts:52,60,66,68,69`; it is not represented as a clean strict gate. No expensive unrelated stage-eleven or absent-old-store regression was repeated.

An intermediate regression failed solely because its deletion assertion expected a branded error but the native missing-row path throws ENOENT; the assertion now checks rejection without inventing an error brand. The earlier injected fixture's fixed physical observation was also updated to its real independently computed predecessor debit. Neither intermediate issue was left in the committed fix.

## Remaining Scope and Gates

This is source/regression evidence, not a native empirical refusal, an actual old-store custody audit, or proof of runtime/RSS feasibility. Historical peaks and native capacity remain honestly unknown. Independent fixed-source re-review and fresh data/helper/capacity gates remain required before empirical admission.

Only the three existing source/test files above changed. No old authority/artifact bytes, Matches, providers, helpers, actual allocations, old ordinary readers, private payloads, engine/game rules, or public/counted behavior were opened or changed. Old recovery markers, locks, and unrelated untracked artifacts are preserved.

The continuous clock remains rooted at `1791409410738` / **2026-10-07T21:43:30.738Z**, debiting **93,600,000 ms + all subsequent elapsed time** against **108,000,000 ms**, with expiry **2026-10-08T01:43:30.738Z**. All repair/test/administrative work counts; there is no restart or refund. The **15,000,000,000-byte / 300-Match** caps, **32 historical charges**, unchanged **1,860,000-ms next-Match/cleanup/terminal/verifier reserve**, and other runtime bounds remain intact.

---

_Fixer: gsd-code-fixer_  
_Iteration: 2_
