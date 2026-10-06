---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
supplement: NEW265-16-HOST-STAGE-V7-PLAN-v1
reviewed: 2026-10-06T13:43:43Z
depth: standard
status: clean
source_root: sha256:0e15d33f3533e826a7cb8b14b8294609ce3dec8848604f912072d61e8334b8e4
source_commit: 15a2adbdfda547b4b1cdc2a49afc0e63cef57873
observed_head: b8e62e41dd231e5f6597a29b512c4ea0ec5e652c
diff_base: f87be5c7
independently_reviewed: true
author_agent: /root/fix_265_host_stage_v7
reviewer_agent: /root/review_265_host_stage_v7
manifest_entries: 888
supplemental_inventory_entries: 20
files_reviewed: 3
files_reviewed_list:
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-host-stage-v7.test.ts
resolved_findings:
  - CR-01
  - WR-01
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
empirical_credit: false
phase_complete: false
---

# Plan 265-16 Host-Stage V7: Independent Repair Re-Review

## Narrative Findings (AI reviewer)

### Summary

CR-01 and WR-01 are resolved within the bounded repair scope. No new actionable correctness, security, or robustness defect was found in the three changed source/fixture files or their connected repair joins. This review covers `f87be5c7..b8e62e41`; it does not reopen the historical Phase or audit every inherited manifest entry. The original v1 review remains immutable history.

The actual raw-byte `leanCorrectionSourceManifest("v7")` recomputation returned **888 entries**, including the unchanged **20-entry supplemental inventory**, and `sha256:0e15d33f3533e826a7cb8b14b8294609ce3dec8848604f912072d61e8334b8e4`. The full source commit is `15a2adbdfda547b4b1cdc2a49afc0e63cef57873`; the observed HEAD above adds only the fix-report documentation.

### CR-01 resolution: Full live source closure restored

`scripts/run-v1-38-lean-correction.ts:161-165` now starts from the live `leanBaselineSourceManifest()` inherited factory/engine/runtime closure and overlays the supplemental inventory before sorting and rooting the union. There is no longer an unbound 20-file-only authority. Existing v1-v6 manifest construction branches remain unchanged. Current dispatch, parent and reader holds recompute the repaired full v7 root. The real review-admission path now also rejects a stale v7 root before its full entry-list Git comparison.

The original reproduction was independently repeated without filesystem edits: an isolated `readFileSync` interception virtually perturbed `packages/engine/src/backstab.ts`. The repaired v7 manifest changed root, with exactly one intercepted dependency read. Dedicated regressions additionally perturb runtime-bridge, subprocess IPC and cold-reuse dependency reads, assert a changed v7 root, and reject stale reviewed-source admission with unchanged synthetic HEAD. The inherited closure builder and relevant live review/hold call sites were inspected; no static admitted constant is being substituted for live dependency bytes.

### WR-01 resolution: Connected fault and acceptance regressions added

The extracted `publishLeanCorrectionMatchEvidence`, `publishLeanCorrectionTerminalResult` and `leanParentFailureReceiptHandler` functions are used by their actual production call sites. The extraction preserves the existing legacy behavior and finite v7 stage/charge binding, without issuing a runtime capability or allocation authority. The stage-preserving private WeakMap brand remains unchanged.

The dedicated fixture now exercises real Match preparation/provider construction, composition and cleanup catches through mocked providers/Match composition; hostile exception getters remain unread. It injects faults at actual replay write, slot-terminal append, observation/origin publication and final result publication, then feeds the classifier's receipt through the real production parent handler. It tests stale/foreign, duplicate, legacy/extra-field and torn-ledger refusal, plus optional receipt-publication failure followed by mandatory real terminal publication in a fresh synthetic store.

For the previously untested positive path, real v7 source publication, pair/charge, replay/compact retention, observation/origin/result and terminal producers feed **one ordinary retained-reader invocation in a newly created synthetic store**. The actual immutable-check authenticator/full audit accepts one successful diagnostic with 29 cumulative charges. `leanReplayDiagnosticCarryV7`, called by the production predecessor inspector only after actual check authentication, carries from the final reader-close; earlier report-observation time, foreign allocation/source, missing close, legacy check schema, false acceptance and wrong cumulative charge count reject.

The positive fixture controls inherited sealed-cold/request admission and Git identity; it does not claim native execution or a full real parent subprocess lifecycle. The ordinary v7 reader, retained bytes, source-publication proofs, allocation/audit/version checks, time closure, check authentication and carry arithmetic remain real. This is proportionate source regression evidence, not empirical diagnostic acceptance.

### Independent checks and remaining boundaries

The focused source-only command completed with **29/29 tests passed**, exit 0:

```sh
node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-host-stage-v7.test.ts --maxWorkers=1
```

Fixture child-process/Worker/native controls remain denied; only a fixed synthetic Git identity is admitted. All retained stores are fresh isolated temporary fixtures; no consumed store, old ordinary reader, private historical payload, provider, Strategy or Match was executed. No empirical prepare/run/verify command, helper preparation or new allocation occurred. Only this v2 review file was written; no implementation edits or commit were made.

The fix report's broader 144-test/lab-typecheck claims were not substituted for this independent source review or independently rerun as a whole-phase gate. Its inherited feasibility-protocol script diagnostic remains disclosed, outside these repairs, and is not reclassified as a clean repository-wide typecheck. MAIN's ordered final-source validation and source verification are still next.

The repair does not alter v1-v6 route/policy/manifest definitions, the approved 57,600,000-ms cumulative cap, prior elapsed/28-charge custody, 15GB/300-Match limits, runtime/reserve bounds, or one-use diagnostic/conditional-baseline semantics. No historical cause/resource feasibility, LEAG/Phase completion, freeze, formation, holdout, public, counted or production authority follows.

---

_Reviewer: /root/review_265_host_stage_v7; standard depth; independent bounded source-only re-review._
