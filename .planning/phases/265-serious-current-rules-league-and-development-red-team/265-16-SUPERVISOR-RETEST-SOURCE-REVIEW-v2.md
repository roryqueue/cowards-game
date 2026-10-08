---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 265-16-supervisor-retest-v12-task-1
iteration: 2
reviewed: 2026-10-08T11:56:39Z
depth: standard
status: issues_found
source_commit: 7b5b21f11483cb2f0b1bbe561966eee53bb741dc
reviewed_head: f6f79c5d5d805a5323330011265b8d65e628ba9c
diff_base: 3ce53f0ac4c88f06efe0a9115b07f3136a4eedd0
source_root: sha256:8e7956bdebbc1da5ffec6ddc8d9bfac6e77eee8a141851c3e63d6e0f98b2758c
source_inventory_count: 922
source_root_basis: supplied-current-fix-report-not-independently-regenerated
author_agent: /root/fix_265_correction_reader
reviewer_agent: /root/review_265_twenty_hour
original_source_author: /root/execute_supervisor_retest_v12
independently_reviewed: true
source_verified: false
empirical_admission: false
files_reviewed: 5
files_reviewed_list:
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-supervisor-retest-v12.test.ts
  - scripts/lib/v1-38-lean-baseline-retained.ts
  - scripts/run-v1-38-lean-correction.ts
  - packages/strategy-lab/src/league/lean-experiment.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
---

# Fresh v12 source re-review, iteration 2

## Summary

Both original BLOCKER findings are fixed in source. One remaining BLOCKER was found in the adjacent production request consumer: it still requires the immutable, failed v1 source review, so corrected source cannot use a fresh current-source review.

This independent source-only re-review binds the two integrated repair commits `41fd1b643e3566b40743a96f76d6fc13db0fbdfe` and `7b5b21f11483cb2f0b1bbe561966eee53bb741dc`, current administrative HEAD, and the supplied current 922-entry manifest above. Read the original v1 review, fresh REVIEW-FIX-v1, AGENTS, and current approval; inspected the repair diff, new regressions, actual CLI/promise consumers, accepted closure/baseline authority consumers, and report-accounting adjacency. The manifest was not independently regenerated. The earlier v1 review remains immutable and is not current-source authority.

No tests, actual retained readers, native/provider/Match processes, source-manifest CLI, private historical payloads, or prospective canonical paths were executed, read, or created. `git diff --check` on the two changed source files returned exit 0. Executor test results in REVIEW-FIX-v1 were read but not independently reproduced; neither they nor this static review grant empirical credit or sourceVerified/Phase265 completion.

## Narrative Findings (AI reviewer)

## Prior findings: source repairs confirmed

### CR-01 from v1 — resolved in source

`scripts/lib/v1-38-lean-correction-retained.ts:396` now selects `leanRetryClosureFile(supervisor)` instead of admitting the old filename for all retry modes. The selector at line 2 returns `retest-closure-v12.json` only for the new mode and retains `retry-closure-v8.json` otherwise. Publication and saved reauthentication use the same selector; the allowlist remains strict and does not admit both filenames or unrelated files.

The added regression at `scripts/lib/v1-38-lean-supervisor-retest-v12.test.ts:153` uses actual allocation construction, reason-v2/full retained auditing, closure publication, saved closure reauthentication, own accepted join, and baseline join. Neither closure authenticator nor full accepted auditor is mocked in this regression. Borrowed check, closure, source and ordinal values, an old closure filename in the v12 store, and an unrelated extra file are asserted to fail. Host file/time/evidence access, current manifest and inherited cold lineage are closed-world mocks; this is scoped synthetic coverage, not real admission or a complete ordinary-reader execution.

### CR-02 from v1 — resolved in source

`scripts/lib/v1-38-lean-correction-retained.ts:1238-1251` is now asynchronous and awaits its exactly one selected reader inside the existing `try`, before publishing carry. A baseline rejection therefore enters the finite closed-reader refusal branch instead of escaping as an ignored reader Promise. The actual async dependency at `scripts/lib/v1-38-lean-baseline-retained.ts:71-80` performs authority authentication then invokes the generic retained reader once, without re-entering the wrapper. The async CLI at `scripts/run-v1-38-lean-correction.ts:1420` returns and assimilates the wrapper Promise; CLI terminal handlers observe its fulfillment/rejection. No old/default wrapper was changed.

The two controlled pending regressions at `scripts/lib/v1-38-lean-supervisor-retest-v12.test.ts:132` execute the production wrapper, carry/refusal derivation and hold seal with virtual host IO. They assert exactly one reader invocation, no settlement/carry/refusal/seal while pending, and correct fulfilled or closed-rejected settlement, finite non-authorizing carry and completion seal afterward. The dependency's completion is mocked; the fixture's protective catch is not an independent unhandled-rejection detector. The production `await`/caller chain itself handles that dependency's rejection. Full actual baseline-reader acceptance is not claimed.

## Critical Issues

### CR-03 — BLOCKER: Fresh request gate pins the obsolete failed source-review version

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:72`

**Issue:** `leanSupervisorRetestDocumentsV12(...).review` always returns `265-16-SUPERVISOR-RETEST-SOURCE-REVIEW-v1.md`. The real draft constructor inherits this path through `createLeanRemainingRequestDraftV9` (lines 642, 650-653). More importantly, the actual v12 request consumer requires `request.reviewPath === docs.review` at line 1474 and authenticates that exact file at line 1492.

The pinned v1 report is immutable, `status: issues_found`, and bound to source root `sha256:da0825af3bbd5cbdb0d9261b65e30783d154bfb9a9e7b32def49913597620239`, not the repaired root `sha256:8e7956bdebbc1da5ffec6ddc8d9bfac6e77eee8a141851c3e63d6e0f98b2758c`. `authenticateLeanCorrectionReview` at lines 374-384 requires clean status, the actual current source root, independent author/reviewer metadata, exact report bytes and source-equivalent committed bytes. Thus keeping v1 fails `LEAN_CORRECTION_REVIEW`; changing the request to a fresh v2 or later report fails `LEAN_CORRECTION_SUPERVISOR_REQUEST` before review authentication. Both diagnostic and baseline are affected. Fixing closure selection and awaiting the reader cannot make current corrected source admissible through this path. This is an actual current-authority cross-wire, not a request to waive the existing gate or rerun empirical work.

**Fix:** Preserve the failed v1 and this v2 report unchanged. Route the new mode's source-review destination to the next independently authored final review (for example v3 after this repair), consistently in the pure document/draft selection and production request consumer. Require that final report's canonical bytes and metadata bind the newly changed current source; do not borrow the old report root, overwrite failed reviews, or relax clean/current-source checks. Keep downstream review bytes outside the source manifest to avoid a self-hash cycle, and add the new report versions to positive physical report accounting (`packages/strategy-lab/src/league/lean-experiment.ts:1773` currently enumerates only v1 source-review/report names). Add an isolated consumer regression showing a source-bound clean final review passes while immutable failed/stale v1, borrowed raw bytes and mismatched source fail; assertions on a pure draft alone do not cover this gate.

## Preserved bounds and outcome

The repairs leave the approval, one diagnostic/own conditional 36-cell baseline pair, full 108000000 ms prior allowance plus wall since 1791455941097, 136800000 ms cap, 2026-10-08T18:39:01.097Z deadline, prior34, 15 GB/300, reserve1860000, decimal scratch2,000,000,000 B and guest1000/host5000/startup2500/Match600000/parent250 ms bounds unchanged. They introduce no historical-reader authority, provider relaxation, public payload disclosure, compile-once/default rewrite, or formation-before-freeze authority.

`issues_found`: one current Critical/BLOCKER, zero Warning and zero Info findings. Original CR-01/CR-02 are closed in source only; CR-03 requires repair and fresh independent re-review before any admission. This report authorizes no prospective helper/request/allocation/reader/entry or empirical attempt.
