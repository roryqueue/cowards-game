---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
reviewed: 2026-10-08T20:25:34Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-baseline-retained.ts
  - scripts/lib/v1-38-lean-preparation-continuation-v13.ts
  - scripts/run-v1-38-lean-preparation-continuation-v13.test.ts
  - scripts/run-v1-38-lean-preparation-provenance-v12.test.ts
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
source_root: sha256:89390d5593d0a3bc13d47be557c56971efe6a1cae82e2b02e110471e273d1b5f
source_commit: 73a6dc84a563fba9d34d713f76a677b14ef11a47
author_agent: /root
reviewer_agent: /root/review_preparation_continuation_v13
independently_reviewed: true
source_only: true
admits_execution: false
---

# Phase 265 Plan 16: Preparation continuation source review

## Summary

Independent standard review of the exact eight-file first-v13-1 adaptation, comparing GREEN's parent with held HEAD73a6dc84. Traced connected request/setup/approval/review, immutable historical pins, predecessor/no-refund inventory, allocation/admission, CLI initialization/dispatch, retained audit/FINAL join, terminal-only verification and carry publication. Only the new review artifact is written; no source edits, commits, empirical readers, private artifacts, helper/request preparation, allocations, capacity probes, providers or Matches.

**Status: issues_found.** A new terminal publication path can report completed custody after crossing the retained-storage bound. Its full lifecycle is absent from the scoped synthetic regression, despite passing tests. This review is not a clean source-admission gate.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Final carry and hold publications bypass the hard storage bound

**Classification:** BLOCKER
**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:1378-1388`
**Related:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:1451-1468`; `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:346-348`.

**Issue:** `publishPreparationContinuationHeldCarry` derives a carry whose `allocatedDiskBytes` describes the inventory **before** writing that carry. It then writes the potentially large survivor-bearing carry and completed-hold receipt without a ledger argument. `publishLeanCorrection` only calls `assertLeanPublicationCapacity` when a ledger is supplied. The surrounding `hold.guard()` verifies source/HEAD/request/entry identity, not retained bytes, projected publication size, scratch or elapsed capacity. Therefore these new writes can cross the unchanged12000000000-byte retained limit and the function still returns normally with a completed-hold receipt and an understated pre-publication debit. The terminal-only path similarly publishes start/close/report without a ledger; its lone physical check is before the later report/carry/hold writes, and is entirely omitted when there is no ledger. This is a correctness violation of the cumulative physical budget, not a performance observation. Later inventory/admission refusal does not undo an already over-budget publication.

**Evidence:** Executed only the exact trusted repository declaration in a closed-world HOST harness with a synthetic starting debit of11999995904B and695 survivor rows. Both publications received no ledger. The carry serialized to45257B (49152B allocated) and the hold to403B (4096B allocated); the function returned normally after four identity guards at12000049152B, **49152B over the retained cap**. No production/private file was read or written for this reproduction. The same missing enforcement exists with an ordinary retained ledger, because the final publisher still omits it.

**Fix:** Add prospective resource admission at each v13 terminal publication, including the no-ledger refusal case. Measure the complete current no-refund inventory; reserve projected block-rounded carry/report/hold sizes and required terminal headroom **before** writing, then remeasure after writes. Supply the actual ledger where it exists, and provide an equivalent finite independently derived inventory-based checker where it does not. Keep source/HEAD custody checks, exclusive0600 publication, non-authorizing failures, all existing limits and old v12 behavior unchanged. Recheck wall/scratch bounds through final publication as part of that same resource guard. Do not solve this by raising caps or treating carry/hold bytes as excluded. Add near-cap positive/refusal tests over the actual publisher and verify that no completed-hold receipt is issued for an over-budget closure.

## Warnings

### WR-01: The new terminal verifier and carry lifecycle is replaced by stubs in the scoped composition test

**Classification:** WARNING
**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-preparation-continuation-v13.test.ts:179-196`
**Related:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-preparation-continuation-v13.test.ts:346-360`.

**Issue:** The composed fixture substitutes `authenticateLeanPreparationContinuationTerminalCarryV13` with an arbitrary predecessor and replaces both new verifier owners with strings. The dispatch assertions consequently prove selection only. The final full-audit test exercises `publishLeanRetryClosureV8` and its accepted diagnostic authenticator, not the v13 ordinary wrapper, terminal-only verifier, report/carry/hold publisher, or saved carry reauthentication. Thus the passing35/35 suite does not prove the new zero-ledger/allocated zero-charge failure can complete its unique verifier, or that final publication failures and capacity changes cannot leave false closure. CR-01 survives precisely this gap. This is a test-reliability defect in a one-shot custody contract, not a request for release-grade certification or general coverage expansion.

**Fix:** Extend the existing closed-world HOST composition to execute the actual v13 terminal-only owner and ordinary wrapper through their actual report/carry/hold publisher and authenticator, mocking only filesystem/process/resource effects. Cover a valid zero-ledger refusal; an allocated zero-charge refusal; an entered result-absent terminal; accepted ordinary diagnostic carry followed by its own36 baseline join; exclusive/publication failures; tampered saved joins; and projected/final storage/time exhaustion. No old reader, private route, Strategy execution or production dependency injection is needed.

## Source-only checks and limits

- Independent focused run: `pnpm exec vitest run scripts/run-v1-38-lean-preparation-continuation-v13.test.ts scripts/run-v1-38-lean-preparation-provenance-v12.test.ts --maxWorkers=1`; session44252 actually CLOSED exit0,35/35,32.15s. An earlier identical public synthetic run was also allowed to finish before the final captured run; no empirical identity was spent by either.
- Configured `@cowards/strategy-lab` typecheck, `git diff --check`, and shell syntax check completed successfully. No targeted strictPASS is claimed: the supplied source summary records six inherited strict diagnostics in `feasibility-protocol.ts` and `planner/missions.ts`; this review neither fixes nor reclassifies them.
- Public functional manifest independently recomputed through `leanCorrectionSourceManifest("v13-1", LEAN_PREPARATION_CONTINUATION_V13_EXTENSION)`:930 entries, root shown above, zero private entries and own downstream source-review absent. Snapshot process50280 CLOSED exit0. All scoped files are unignored; no project skill directories were present.
- Read AGENTS and bounded relevant project/planning context, checked first-route research, approved time supplement, human time approval, narrow plan checkv2 and source summary. Current prospective cap165600000ms, original1791455941097 start plus full108000000ms prior debit, deadline2026-10-09T02:39:01.097Z and1860000ms reserve remain unchanged. Old34charges/114897342ms/21020672B/695-row history is accounting-only; old initiating cause remains unknown.
- GSD code-review guidance shaped the exact eight-file scope, connected checks and severity/fix artifact. Passing source tests do not authorize a helper, request, preparation, new allocation, entry, verifier rerun, complete baseline, freeze, formation, holdout, public/counting/production or milestone credit.

## Actual closure and handoff

**ACTUALLY CLOSED.** All review-owned captured processes completed; no source/HEAD mutation or commit occurred. Ownership of this newv1 review artifact is released to ROOT. Preserve this findings-bearingv1 record. Fix/re-review must use a new immutable review version and bind the prospective source-review pointer to the actual clean review, rather than overwritev1 or fabricate clean status. Actual MAIN data/helper review, committed allocation, unique entry, SAME-PROCESS capacity and the one appropriate actual verifier remain later gates.

_Reviewer: /root/review_preparation_continuation_v13 (gsd-code-reviewer); depth: standard._
