---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: post-v15-checkpoint-repair-v1
subsystem: trusted-host-resource-observation
tags: [v15, checkpoint, source-only, tdd, no-refund]
requires: [post-v15-checkpoint-repair-plan-v1, post-v15-checkpoint-repair-plan-check-v2]
provides: [fresh-synchronous-selected-checkpoint, exact-v3-review-selector, finite-repair-report-debit]
affects: [independent-source-review, ROOT-validation, independent-source-verification]
tech-stack:
  added: []
  patterns: [synchronous-invocation-local-observation, independent-allocation-read-admission]
key-files:
  created: [scripts/lib/v1-38-lean-checkpoint-observation-v15.ts, scripts/run-v1-38-lean-checkpoint-observation-v15.test.ts]
  modified: [scripts/run-v1-38-lean-correction.ts, scripts/run-v1-38-lean-baseline.ts, packages/strategy-lab/src/league/lean-experiment.ts, scripts/lib/v1-38-lean-resource-window-v15.ts, scripts/run-v1-38-lean-resource-window-v15.test.ts]
key-decisions:
  - Keep independent before/after allocation admission and the allocation admission internal to readLeanLedger; safety takes precedence over minimizing identity reads.
  - Keep resource-event publication observations and post-append ledger validation independently fresh.
  - Include immutable repair plan/checks in source closure, excluding only finite named downstream output gates.
requirements-completed: []
duration: 10min
completed: 2026-10-09
status: complete
scope: source_tasks_only_not_Plan16_or_phase_completion
---

# Phase 265 Plan 16: Post-v15 Checkpoint Repair Source Summary

Fresh synchronous v15 checkpoint observations feed the unchanged prefix, correction and independent disk guards; exact v3 review selection and nine finite physical report debits remain non-authorizing.

## Scope and commits

Only the two source tasks of the checked existing Plan16 supplement are complete. ROOT owns integration, STATE/ROADMAP/requirement tracking and all subsequent independent gates. No independent review, validation or verification report was written by this source executor.

| Task | RED commit and actual receipt | GREEN commit and actual receipt |
|---|---|---|
| 1: fresh selected checkpoint | `29352e7a`; focused command exit1, missing new helper module, 0 tests collected | `8af84bc3`; focused command exit0, initially 20/20 tests; stronger post-observation allocation test included in final source |
| 2: v3 review and finite debit | `2832d637`; two focused files exit1, 3 expected failures/21 passes (old v2 selector and absent new inventory) | `77117b91`; final two focused files exit0, 25/25 tests |

Execution started approximately 17:25 UTC and source commands closed by 17:35 UTC. Source checkout `/private/tmp/cg-265-checkpoint-source-MbtBBb`, branch `codex/265-checkpoint-source-v15`, immutable spawn base `7e7e6c0b5773c4a640dd4ded0eea885997a48d8c`. No MAIN edit, push, merge, old reader or operator-history replay occurred.

## Actual final checks

| Command | Actual receipt |
|---|---|
| `node_modules/.bin/vitest run scripts/run-v1-38-lean-checkpoint-observation-v15.test.ts --testTimeout 30000` | exit0, 20/20; final run 19.48s wall |
| `node_modules/.bin/vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts packages/strategy-lab/src/league/lean-resource-window-v15.test.ts --testTimeout 30000` | exit0, 25/25; final run 30.32s wall |
| `node_modules/.bin/tsc -p packages/strategy-lab/tsconfig.json --noEmit --tsBuildInfoFile /tmp/cg-265-checkpoint-typecheck.tsbuildinfo` | exit0; package's configured project, explicitly non-emitting to preserve all existing dist bytes |
| `sh -n scripts/run-v1-38-lean-correction.sh` | exit0 |
| `git diff --check` | exit0 |
| Actual `leanCorrectionSourceManifest("v15-2", LEAN_RESOURCE_WINDOW_V15_POLICY)` via local tsx, source reads only | exit0; 955 entries, `sha256:8bcc3286a5ff8c550c6ef9c07696776b22f94a09dd38421256affcc7df5b0667` |

ROOT must independently rerun its own checks and the strict review consumer after the actual independent v3 report exists. No fabricated clean review or successful review-consumer receipt was produced here. Unchanged package dependencies/dist were linked into this isolated checkout to resolve imports; no dependency installation or build was performed, and changed strategy-lab source was loaded from this checkout.

## Selected call chain and operands

`runLeanCorrectionChildBody` authenticates the policy and selects `assertLeanCorrectionCheckpointV15` only for v15. It calls the tested `checkpointLeanObservationV15` composition. Other modes retain the existing observer branch. Match pre- and post-native callbacks remain unchanged, as do source/HEAD/request dispatch holds, parent sampler, charge-time checks, compaction/retention callbacks and package append/read validation.

| Consumer | Actual operand derivation within this one synchronous checkpoint |
|---|---|
| Observed-prefix adapter -> existing `assessLeanPrefixCapacity` | `childRss=max(current child RSS, current maxRSS*1024)+additionalBytes`; one fresh parent RSS, statfs free bytes, cumulative physical bytes as allocatedBytes, elapsed; actual allocation and policy.guardBytes |
| Existing `assertLeanCorrectionResources` | identical projected childRss, parentRss, free bytes, physical bytes and elapsed; one admitted ledger charged count, one available-memory observation; actual allocation |
| Independent scratch/total-disk guards | same measured physical bytes; `bufferBytes=observed arrayBuffers+additionalBytes`, independently observed temporary scratch bytes; unchanged scratch/terminal/total caps; RSS is never charged as disk |
| High water | closure-local maximum of both actual guard results; never substitutes for fresh current observations |

The counting fixture captures every field sent to the actual selected helper's prefix/correction/disk guard operations, including zero and nonzero projections. Actual correction composition tests additionally execute the real prefix/correction/disk predicates and exact RAM/scratch/time-reserve boundaries and +1 refusal. A second call samples every operation again and forwards changed time, current/max RSS, parent RSS, disk, memory, physical and charge operands. Numeric malformation, observation throws, parent loss and allocation drift refuse.

Per selected checkpoint the explicit physical/time/parent-ps/statfs/ledger/available-memory/disk operations each run once. Allocation identity is intentionally not deduplicated: before observations, once internally in the unchanged admitted ledger read, and after all observations (three identity admissions). Actual on-disk alteration during the disk observation is rejected after the ledger admission and before guards; pre-entry alteration also refuses. Parent checks surround observations and guards; the outer child checkpoint assertion also remains. No module cache, WeakMap, cross-callback observation or asynchronous suspension was introduced.

Resource-event publication is a separate callback/mutation boundary: it still takes fresh disk and elapsed observations and calls unchanged `checkpointLeanResources`, whose post-append `readLeanLedger` validation remains untouched. No checkpoint observation is reused there.

## Finite source and physical accounting

Eight exact POST-V15-CHECKPOINT-REPAIR reports are physically charged: PLAN-v1, PLAN-CHECK-v1, PLAN-CHECK-v2, SOURCE-SUMMARY-v1, REVIEW-FIX-v1, SOURCE-REVIEW-v1, VALIDATION-v1 and SOURCE-VERIFICATION-v1. Exact POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v3 is the ninth new inventory entry and sole selected strict review path; old v1/v2 remain in inventory and do not certify changed source.

Tests create only disposable NON_AUTHORIZING inert host fixtures. Every newly enumerated report's physical growth is charged, charged shrink/disappearance refuses, and prior outputs survive. The actual source manifest includes new helper/test/repair-plan and immutable plan checks. The finite named summary/fix/review/validation/verification outputs are excluded from source identity to avoid cycles but are not excluded from physical charging. No wildcard/version selector or broad physical-directory scan was added.

## Preserved evidence, bounds and frontier

Historical v15-2 remains system_failure/SUPERVISOR_FAILURE, ordinary refused, one current/37 cumulative charges. The operator's duplicate carry-publication hold-refusal remains immutable and non-authorizing. Initiating throw remains UNKNOWN; source-proven redundant calls have no measured contribution or production speedup claim.

Source identity alone cannot activate v15-3..5. Existing immediate-prefix custody, concrete distinction and own accepted diagnostic/actual FINAL checks are unchanged and continue to fail closed. A separately checked historical-cost-only prospective contract is still required to carry the honest ended/refused 37-charge prefix; this source repair does not implement, authorize or certify that contract.

Deadline 2026-10-09T18:38:33Z, continuous all-wall cap223171903ms, reserve1860000ms, original anchor1791455941097 plus FULL108000000ms floor remain unchanged. RAM3000000000 is separate from scratch2000000000, retained12000000000, total15000000000, terminal1000000000; maximum300 Matches, Match600000/guest1000/host5000/startup2500, oldspace768MiB and sampling250ms remain unchanged. No reset, refund, deletion, recredit or authority expansion.

Strict inherited six, private-fixture four and monitor five limitations remain NOTPASS, not resolved or relabeled by these focused tests. No authentic positive full custody, native timing/RSS, runtime recovery, complete36-cell fit, empirical acceptance, LEAG/phase/freeze/formation/holdout/public/counted/production credit is established.

## Deviations and issues

- Safety-first identity count remains three admitted allocation reads, rather than deduplicating the ledger's internal identity check.
- New helper/test/plan/check source-closure entries were added in the owned correction file as essential source binding for Task2; no unowned files were changed.
- Initial import resolution was blocked by absent isolated package dependencies. Only unchanged local dependency/dist links were added; no install/build or MAIN source change occurred.
- Used the configured package project with `--noEmit` and external build-info path instead of emitting `tsc -b`, because dependency/dist modification was forbidden.

## Known Stubs

None in the repair implementation. Inert synthetic fixture values are explicitly NON_AUTHORIZING and do not stand in for actual evidence. Positive strict source-review consumption is intentionally deferred to independently produced v3 and ROOT validation.

## Self-Check: PASSED

All seven declared source/test files exist; RED/GREEN commits `29352e7a`, `8af84bc3`, `2832d637`, `77117b91` exist. No tracked deletion is present. No new network/auth endpoint or engine/game rule surface was introduced. All invoked test/typecheck/source-read commands closed; no actual provider, Match, allocation authorization, empirical reader or held operator route was started.
