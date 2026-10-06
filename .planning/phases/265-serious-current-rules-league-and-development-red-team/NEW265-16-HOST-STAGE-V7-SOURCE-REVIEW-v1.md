---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
supplement: NEW265-16-HOST-STAGE-V7-PLAN-v1
reviewed: 2026-10-06T13:22:01Z
depth: standard
status: needs_fixes
source_root: sha256:6f96a16d3dfab3cd9fd19566f76095b7c9e7e2dd372b72aa90f3ece4cd97770b
source_commit: 521d6df86dfae79d39314d0dd32f43dbe98c6e6a
observed_head: ebdcda92c879c68fcf748b9ada1a1f0f290a4df5
diff_base: 06af9b4c
independently_reviewed: true
author_agent: /root/execute_265_host_stage_v7
reviewer_agent: /root/review_265_host_stage_v7
manifest_entries: 20
files_reviewed: 12
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-baseline-source.ts
  - scripts/lib/v1-38-lean-child-cli-terminal.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-host-stage-v7.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-host-stage-v7.test.ts
connected_consumers_inspected:
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-lean-baseline-pipeline.ts
  - scripts/lib/v1-38-lean-startup-supervisor.mjs
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/v1-38-factory-implementation.ts
  - scripts/check-v1-38-lab-boundaries.ts
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
empirical_credit: false
phase_complete: false
---

# Plan 265-16 Host-Stage V7: Independent Source Review

## Narrative Findings (AI reviewer)

### Summary

The new delta needs fixes before source acceptance. One source-custody blocker is independently reproduced, and the dedicated fixture lacks connected positive/fault regressions required to protect the new joins. This is a bounded review of the 12 changed/new source/fixture files and their connected consumers, not an audit of historical Phase 265 or an empirical acceptance.

The exact raw-byte `leanCorrectionSourceManifest("v7")` invocation independently returned 20 entries and the source root recorded above. The dedicated synthetic fixture independently passed 15/15 tests. Passing those cases does not resolve the findings below. No Match, native/Docker/provider/Strategy execution, empirical route, helper preparation, old ordinary reader, historical payload scan, or new allocation occurred. Only this review artifact was written; no source changes or commit were made.

### Critical Issues

#### CR-01: V7 drops live engine/runtime closure from its fixed-source authority

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:161-164`

**Connected joins:** `scripts/run-v1-38-lean-correction.ts:245`, `:698`, `:774`; `scripts/lib/v1-38-lean-correction-retained.ts:274`; `scripts/run-v1-38-lean-baseline.ts:96-100`.

**Issue:** The v7 early return replaces the inherited live implementation closure with just the 20 supplemental inventory entries. It neither includes the inherited entries nor commits a separately recomputed inherited implementation root. The existing branch starts from `leanBaselineSourceManifest()`, which includes `factoryAssessmentImplementationManifest()` and its live engine/runtime/admission dependency bytes. The current v6 branch has 893 entries; v7 has 20. Actual imported dependencies such as `packages/engine/src/backstab.ts`, `packages/strategy-lab/src/runtime-bridge.ts`, `packages/runtime-js/src/subprocess-ipc.ts`, and `scripts/lib/v1-38-lean-baseline-reuse.ts` are omitted by v7.

This is not merely a shorter display inventory: source review's Git comparison is limited to the returned entries, and dispatch/parent/reader holds recompute this same v7 root and check HEAD. An uncommitted change to an omitted dependency leaves HEAD and the v7 root unchanged. The static admitted tuple/source-closure constants and generated harness/broker hashes do not authenticate the live engine or all imported runtime/admission bytes. Changed game/runtime behavior can therefore pass as independently reviewed fixed source, contrary to the unchanged gameplay/runtime and source-custody contract.

**Evidence:** In an isolated Node process, a temporary `readFileSync` interceptor appended a comment only to the *virtual read result* for `packages/engine/src/backstab.ts`. No filesystem bytes were changed. Recomputing the actual manifest functions produced `v7SourceRootUnchanged:true`, `v6SourceRootChanged:true`, with one intercepted inherited read. The v7 root remained `sha256:6f96a16d3dfab3cd9fd19566f76095b7c9e7e2dd372b72aa90f3ece4cd97770b`.

**Fix:** Restore live transitive source custody for v7. Either inherit the full existing closure and add the supplemental entries, or preserve the exact 20-entry supplemental inventory while committing a separately recomputed full inherited closure root into the v7 root body. Ensure review admission and every live source hold check that full binding. Keep v1-v6 manifest definitions unchanged. Add synthetic read-interception/mutation negatives for omitted engine, runtime-bridge, IPC/admission dependencies: their byte changes must change the v7 source root and refuse stale reviewed-source admission even with unchanged HEAD. Recompute the v7 root and repeat independent fixed-source gates after the repair.

### Warnings

#### WR-01: Stage and successful-reader tests bypass the connected boundaries they need to protect

**Classification:** WARNING

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-host-stage-v7.test.ts:109-136`

**Connected joins:** `scripts/lib/v1-38-lean-baseline-match.ts:168-180`; `packages/strategy-lab/src/league/lean-experiment.ts:1380-1382`; `scripts/run-v1-38-lean-correction.ts:711-746`; `scripts/run-v1-38-lean-baseline.ts:309-321`; `scripts/lib/v1-38-lean-correction-retained.ts:256-330`.

**Issue:** The actual Match wrapper is exercised only with invalid source objects, and actual retention only with an invalid compact record. The four-stage table creates each brand directly with `captureLeanHostFailureV7`; it does not inject faults at the actual composition/cleanup, replay publication, terminal append, observation/origin, or result-publication catches. Removing or misplacing those catches would still pass these tests. `publishChildTerminalAfterOptionalReceipt` is tested in isolation, not through the new parent last-charge IPC handler, so duplicate/stale/malformed/partial parent custody is also unprotected.

Additionally, the v7 retained test only checks `validateLeanHostStageTerminalOnlyV7` on a failed synthetic ledger. No new fixture passes a successful v7 diagnostic through ordinary retained audit/read acceptance, reopens its accepted check, and derives baseline carry from the final reader-close. The v6 controls do not exercise the new v7 request/allocation/publication/count/schema branches. Thus 15 passing cases cannot detect a v7 success-path refusal or a wrong carry join before the one-use empirical route is spent. These are specific correctness-regression gaps, not a request for broader historical or production certification.

**Fix:** Add bounded synthetic tests at the real named catches and the parent IPC/publication seam, keeping child/Worker/native execution denied. Assert the produced receipt/terminal and fail-closed partial/duplicate/stale cases. Add a wholly synthetic successful v7 diagnostic producer-to-ordinary-reader/check-authentication test, followed by baseline predecessor reconstruction: require 29 cumulative charges and carry from actual final reader-close, rejecting earlier observed time, foreign roots, incomplete closure and v6 aliases. Extend the fixed-source regression with CR-01's live dependency-byte negatives. These tests should use isolated fixture stores/mocked external controls, never consumed stores, old readers, or real providers.

### Bounded observations

The private WeakMap brand and v7 classifier do not inspect thrown Strategy-controlled properties/getters to derive host stage. The new parent receipt path checks its actual last charge and fails uncertain on a malformed ledger. Optional receipt failure does not suppress the mandatory terminal callback. Failed-terminal custody remains explicitly non-accepting and does not fabricate a slot terminal, stop or result.

The scoped v7 version/root/path branches are additive. The policy/caps preserve the 15,000,000,000-byte and 300-Match limits and the listed runtime bounds, changing the elapsed cap to 57,600,000 ms. Finite predecessor validation pins 28 cumulative charges, three current charges/two terminals, third ordinal nonterminal, absent stop/result, and exact time roots. Current setup arithmetic is one interval from the approved start; accepted-diagnostic baseline carry reads the final reader-close rather than the check body's earlier observation. These source observations do not claim that the untested connected ordinary success path has passed, or establish historical cause/resource feasibility/empirical completion.

The executor's broader 130-test and script-typecheck claims were treated as handoff information, not independently rerun whole-phase proof. The inherited feasibility-protocol diagnostic was not repaired or reclassified here. No LEAG, freeze, formation, holdout, public, counted, production or Phase 265 credit follows.

---

_Reviewer: /root/review_265_host_stage_v7; standard depth; source-only._
