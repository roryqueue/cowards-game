---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 265-16-supervisor-retest-v12-task-1
reviewed: 2026-10-08T11:39:00Z
depth: standard
status: issues_found
source_commit: 3ce53f0ac4c88f06efe0a9115b07f3136a4eedd0
reviewed_head: b7787391aec1acf20d130851bebb110d1eb2c30f
diff_base: c8019757
source_root: sha256:da0825af3bbd5cbdb0d9261b65e30783d154bfb9a9e7b32def49913597620239
source_inventory_count: 922
source_root_basis: supplied-source-summary-not-independently-regenerated
source_author: /root/execute_supervisor_retest_v12
reviewer: /root/review_265_twenty_hour
independently_reviewed: true
source_verified: false
empirical_admission: false
files_reviewed: 10
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/run-v1-38-lean-baseline.test.ts
  - scripts/run-v1-38-lean-supervisor-exit-repro.test.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/lib/v1-38-lean-baseline-retained.ts
  - scripts/lib/v1-38-lean-baseline-retained.test.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-supervisor-retest-v12.test.ts
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
---

# Phase 265 Plan 16: Fresh v12 source review

## Summary

Two BLOCKER findings prevent the intended accepted diagnostic → own conditional baseline lifecycle. These are concrete production call-chain defects, not a restatement of the unproven full synthetic lifecycle. This fresh review does not reuse any earlier twenty-hour review or admission authority.

Reviewed the ten changed source/test files in `c8019757..3ce53f0a` and their connected production consumers against the current supervisor-repair/retest approval, research, checked PLAN-v1, PLAN-CHECK-v3, and SOURCE-SUMMARY-v1. HEAD adds the summary after the GREEN source commit; the source scope is bound to the commits and supplied 922-file manifest above. The manifest was not independently regenerated, and the unchanged 922-file closure was not exhaustively re-audited.

The inspected new mode routes through the dedicated extension, allocation, request, authorization, reason-v2, carry, and retained-reader branches. Its approved clock uses the full 108,000,000 ms prior allowance plus wall elapsed since 1791455941097, with the fixed 136,800,000 ms cap and 2026-10-08T18:39:01.097Z deadline. The inspected binding retains prior charge 34, the 1,860,000 ms reserve, 15 GB/300 limits, decimal 2,000,000,000 B scratch, and guest/host/startup/Match/parent-cadence bounds. The authorization semantic root excludes the five downstream authorization/review fields while including helper bytes. Historical failed v11-2 custody is separately pinned to 17 raw byte roots and remains non-authorizing; it is not converted into current accepted-reader authority. These observations do not confer admission or override the blockers below.

No tests, ordinary or historical retained readers, source-manifest CLI, providers, Matches, native processes, or prospective canonical artifacts were invoked or created. No private historical payload was opened. Only this report was written. Existing synthetic results in the source summary were not independently reproduced and are not empirical credit. Inherited compile-once/default behavior was considered only where touched by the new dispatch; this is not a whole-history re-audit or a sourceVerified/phase-complete claim.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 — BLOCKER: Accepted v12 closure invalidates its own full retained reauthentication

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:396-397`

**Issue:** The full accepted diagnostic audit still admits only `retry-closure-v8.json` for every retry mode. The new mode publishes `retest-closure-v12.json` through `leanRetryClosureFile(mode)` at lines 421-424. Initial publication can derive an accepted closure before that file exists, but subsequent `authenticateLeanRetryClosureV8` reads the new file and re-derives it at lines 437-439. Accepted re-derivation calls `authenticateLeanSupervisorDiagnosticCheck` at line 416, which sees `retest-closure-v12.json` as an extra inventory member and fails `ACCEPTED_INVENTORY` at line 397. Thus a genuinely accepted saved v12 FINAL cannot reauthenticate for its own baseline authorization. This failure is deterministic after the required closure has been saved; it does not depend on a native result or timing race.

The new accepted-join test at `scripts/lib/v1-38-lean-supervisor-retest-v12.test.ts:49` mocks the closure authenticator, so it does not traverse this failing full audit.

**Fix:** Select the allowed closure filename with `leanRetryClosureFile(supervisor)` for retry modes, preserving the old filename for old modes. Add an isolated synthetic production lifecycle regression that publishes an accepted v12 closure, reauthenticates the saved closure through the actual full audit, and joins it to only its own conditional baseline. Do not replace the full audit with a fabricated accepted receipt or broaden the inventory allowlist to unrelated files.

### CR-02 — BLOCKER: Baseline wrapper publishes carry before its asynchronous reader executes

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:1238-1251`

**Issue:** The v12 ordinary-reader wrapper calls `verifyLeanRetryBaselineRetainedV8` without awaiting it (line 1240), then immediately publishes terminal carry (line 1241). That baseline reader is explicitly asynchronous and first awaits dynamic imports at `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-baseline-retained.ts:71-72`; the actual authority check and ordinary retained audit occur only afterward at lines 75-80. The wrapper therefore receives a pending Promise, not a completed report.

On the intended fresh result-present baseline path, the accepted check and closed reader interval have not yet been written. Carry derivation reads the missing `result-reader-refusal-v12.json` when no check exists (line 1115), or rejects the missing reader closure (line 1117). The carry publication fails before the reader settles, and the synchronous catch cannot handle the asynchronous reader's later rejection. The reader can nevertheless resume after the wrapper has already refused, leaving a completed check without the intended carry/hold closure, or producing an unhandled rejection. Fixing CR-01 does not fix this separate baseline lifecycle defect.

**Fix:** Make `verifyLeanSupervisorRetestRetainedV12` asynchronous and await the selected reader inside its `try` before publishing carry. Awaiting the synchronous diagnostic reader is safe; preserve its single-reader behavior and do not re-enter the wrapper recursively. The existing catch must run after an asynchronous baseline rejection so it can inspect the actual closed interval and publish the finite refusal carry when appropriate. Add an isolated regression with a controlled pending baseline reader: no carry or hold seal while pending; after settlement, exactly one correct success/refusal lifecycle; rejection is propagated without an unhandled Promise.

## Outcome

`issues_found`: two Critical/BLOCKER defects; zero Warning and zero Info findings. Fresh admission remains blocked pending scoped fixes and independent review of the changed source binding. This report authorizes no prospective request, allocation, reader, diagnostic, baseline, or empirical attempt.
