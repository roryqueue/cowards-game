---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: post-v15-archived-prefix-v3
type: execute
wave: 14
depends_on: [265-16-POST-V15-CHECKPOINT-REPAIR]
autonomous: true
execution_owner: source_only_ROOT_scheduled
requirements: [LEAG-01, LEAG-02, LEAG-03, LEAG-04, LEAG-05, LEAG-07]
files_modified:
  - scripts/lib/v1-38-lean-resource-window-v15.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/run-v1-38-lean-resource-window-v15.test.ts
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-resource-window-v15.test.ts
must_haves:
  truths:
    - The immutable refused v15-2 prefix is authenticated from exactly 11 raw-pinned metadata records and yields only non-authorizing cost custody carrying 37 charges, elapsed/debit/survivor floors, and unknown historical peaks.
    - Consumed resourceWindowBodyV15, LEAN_RESOURCE_WINDOW_V15_POLICY and LEAN_RESOURCE_WINDOW_V15_CAPS remain unchanged; only v15-3 selects a separately named approved successor policy with cumulative cap 250530903 and absolute deadline 1791598472000.
    - Original anchor 1791455941097 and original priorElapsedMs 108000000 are used once; actual resume 1791569672000 yields cumulative elapsed 221730903 without resetting or double-counting prior wall time.
    - Allocation reconstruction, ledger caps and memory roots, source manifest, setup/request/continuation, reservation/timer/publication, and prospective accepted-reader joins all consume the identical ordinal-selected policy/root.
    - v15-3 requires fresh_synchronous_checkpoint_observation_v15 and the exact independent v4 receipt over nine named files against failed base 7250223f67620ccc274a3a2fc80d099718ea58ea; source identity drift is insufficient.
    - v15-2 retains its old review v3 and policy; accepted v14-1 and legacy/default behavior stay unchanged; v15-4/5 remain dormant with no admitted successor policy, prefix, or execution.
    - The existing 13 archival input/report paths plus four exact approved inputs form a finite 17-path amendment; only six exact generated outputs are functionally excluded and every path remains physically debited.
  artifacts:
    - path: scripts/lib/v1-38-lean-resource-window-v15.ts
      provides: distinct raw-pinned archived-prefix cost authenticator and ordinal-specific source-review path
    - path: packages/strategy-lab/src/league/lean-experiment.ts
      provides: separately rooted successor policy/caps, strict mode selection and reconstructed allocation/ledger guards
    - path: scripts/run-v1-38-lean-correction.ts
      provides: real cost-prefix/request/continuation/source-review and continuous timing consumer joins
    - path: scripts/lib/v1-38-lean-correction-retained.ts
      provides: prospective v15-3 publication and pair-exhaustion guards using the selected envelope
    - path: scripts/run-v1-38-lean-resource-window-v15.test.ts
      provides: connected non-authorizing raw-custody/producer/consumer/retained guard fixtures
    - path: packages/strategy-lab/src/league/lean-resource-window-v15.test.ts
      provides: policy compatibility, allocation/ledger/memory, continuous-clock and boundary tests
  key_links:
    - from: exact 11-row PIN-INVENTORY-v1
      to: readLeanResourceWindowPriorPairV15 v15-3 branch
      via: exact raw lengths/digests, canonical pin-domain roots, applicable embedded roots, and field-role joins; no old authenticator
    - from: leanResourceWindowPolicyForModeV15
      to: actual allocation/ledger/request/source/setup/timing/retained consumers
      via: strict selected successor object/root for v15-3; legacy object for v15-2; dormant ordinal refusal
    - from: actual repaired checkpoint call chain
      to: validateLeanResourceWindowContinuationV15 v15-3 branch
      via: exact semantic distinction, failed functional comparator, final source identity and independent v4 raw receipt
    - from: finite 17-path amendment
      to: leanCorrectionSourceManifest and physical report debit
      via: exact 11 included input paths and six excluded generated outputs, all 17 charged without refunds
---

<objective>
Implement the approved successor time policy together with both checked archived-prefix tasks inside existing Plan 265-16. Per D-01/D-02/D-05/D-22/D-25/D-27/D-28, authenticate failed history as cost only, preserve consumed policy/history, and connect the actual repaired checkpoint distinction to one fresh ordinal's source admission.

Purpose: Close the missing source dependencies without treating a refusal as acceptance or a source gate as an empirical result.
Output: Three serial source-only RED/GREEN tasks, exact raw pins, separately named v15-3 envelope, nine-file independent-review contract, connected adversarial tests, and finite source/debit inventory. This is an additive successor of PLAN-v2, not a new numbered phase or plan and not permission to execute ROOT's empirical task.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/gsd-core/workflows/execute-plan.md
@/Users/roryquinlan/.codex/gsd-core/templates/summary.md
</execution_context>

<context>
@AGENTS.md
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/SUMMARY.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-CONTEXT.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-RESEARCH-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-RESEARCH-v2.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-PLAN-v2.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-PLAN-CHECK-v2.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-PIN-INVENTORY-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-TIMING-DECISION-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-TIMING-APPROVAL-20261009.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-CHECKPOINT-REPAIR-SOURCE-VERIFICATION-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v3.md
</context>

<fixed_constraints>
This plan is source-only. Do not create an actual request, setup witness, helper, data/helper/distinction review, authorization, allocation, owned store, capacity receipt or empirical result; do not execute preparation/entry/route/provider/Strategy/Match, an old reader/authenticator, or a duplicate publisher. Inert test values and isolated temporary fixture files are not actual authority. Preserve every old artifact, pending historical decision document and consumed authority byte. The timing approval supersedes the old pending timing frontier prospectively; do not edit the decision's approved:false history or rewrite PLAN-v2/check-v2/research-v1.

Approved exact timing: actualResumeMs=1791569672000; startedAtMs=1791455941097; priorElapsedMs=108000000; elapsedMs=250530903; absoluteDeadlineMs=1791598472000; reserveMs=1860000. The elapsed function remains the maximum of authentic inherited/ledger elapsed and the original floor plus wall difference, not their sum. At actual resume the floor is 221730903; at deadline it is 250530903. Never assign 221730903 to priorElapsedMs then add wall since the original anchor. The fresh-entry cutoff is 1791596012000 (2026-10-10T01:33:32Z), with equality refused for reserve+600000ms Match. Source work must leave reserve at 1791596612000 (01:43:32Z); report partial/inconclusive if gates cannot close. Every wall millisecond, source work, test/review, idle/wait and cleanup is charged; the window is a maximum, not a completion promise.

Keep RAM3000000000B inclusive of external512000000B and guard335544320B, disk scratch2000000000B/retained12000000000B/total15000000000B/terminal1000000000B, maximum300Matches, guest1000ms/host5000ms/startup2500ms/Match600000ms, old-space768MiB, sampling250ms and every kernel/gameplay/privacy boundary unchanged. All37 charges and survivor/file debit carry without reset/refund. Only unused ordinals3..5 remain the ceiling; this contract admits the policy for ordinal3 only and leaves4/5 dormant until independently checked immediate-prefix/distinction contracts exist.

Historical identity: failed functional comparator is commit7250223f67620ccc274a3a2fc80d099718ea58ea, source sha256:2d499dc06ae7a95b12c11c4d96a0ce8f0033e20fcaaf8a484b5279c86215059e /950 entries. Checkpoint repair47425b37ee8d4a9ebdf0851667689d6d5ec0713e, sha256:6f843d8614f3397403e613367cf751e89032dd8cc28b0fe5e322a679fd513742 /955 entries is reviewed repair evidence, NOT the failed comparator. ROOT73583 closed0 and ordinary58084 closed1/refused; current1/cumulative37; separate duplicate-publisher7008 hold-refusal remains an operator error, not a hold authenticator. Initiating throw and historical peak RSS/disk remain UNKNOWN. A cost-only return type has no accepted/finalReaderClose/successful-audit/hold-authentication authority fields.

Exact new policy choices: export LEAN_RESOURCE_WINDOW_V15_SUCCESSOR_POLICY and LEAN_RESOURCE_WINDOW_V15_SUCCESSOR_CAPS; schema and labRoot domain are both lean-resource-window-successor-envelope-v15-3-v1. Retain the existing elapsedMs field so all-wall consumers use the existing formula. Preserve inherited original floor/anchor/reserve/RAM/disk/runtime metadata; override actualResumeMs, elapsedMs, absoluteDeadlineMs, approvalRoot, planRoot, predecessorExtensionRoot, charged and attempt bounds only. approvalRoot is SHA-256 of the exact TIMING-APPROVAL-20261009.md bytes; planRoot is SHA-256 of this final PLAN-v3.md bytes after independent PLAN-CHECK-v3 closes; predecessorExtensionRoot is the unchanged old policy.root; charged=37, attemptOrdinals=[3], maximumDiagnostics=1, maximumBaselines=1. Preserve the old memoryApprovalRoot and its real document join. Do not invent a new approval-event turn ID or claim inherited setup provenance is a fresh approval event: actual successor approval provenance is its exact approval path/root and actualResumeMs. Freeze the new object with the existing helper. Export leanResourceWindowPolicyForModeV15: v15-2 returns the old singleton, v15-3 the successor, v15-4/5 fail closed. Expand family classification/admission only enough to recognize both strict schemas, and enforce ordinal/policy equality in every contextual consumer; legacy constants and behavior remain unchanged.
</fixed_constraints>

<source_ownership>
Only the six files in files_modified are mutable source/test ownership. The additional retained.ts ownership is limited to actual prospective publication and pair-exhaustion policy/deadline joins plus a connected test seam; it does not rewrite old readers, authenticators or old custody semantics. All tasks run serially because correction.ts and focused tests overlap. Task1 creates archived cost custody; Task2 needs that custody and creates selected envelope/guard propagation; Task3 needs both and creates real distinction/review/source-inventory admission. No checkpoint or empirical task is mixed into this plan.

Read-only semantic-review closure has exactly nine files: scripts/run-v1-38-lean-correction.ts; scripts/run-v1-38-lean-baseline.ts; scripts/lib/v1-38-lean-checkpoint-observation-v15.ts; scripts/run-v1-38-lean-checkpoint-observation-v15.test.ts; packages/strategy-lab/src/league/lean-experiment.ts; scripts/lib/v1-38-lean-resource-window-v15.ts; scripts/run-v1-38-lean-resource-window-v15.test.ts; packages/strategy-lab/src/league/lean-resource-window-v15.test.ts; scripts/lib/v1-38-lean-correction-retained.ts. The first eight are the v2 closure; the ninth is the real called dependency identified during successor planning and confirmed by ROOT. Do not edit baseline/checkpoint implementation or its existing tests. Exact files_reviewed=9 and files_reviewed_list membership/order are required in the selected receipt; no eight-file receipt can certify this enlarged called closure.
</source_ownership>

<finite_inventory>
All names below are full exact paths under .planning/phases/265-serious-current-rules-league-and-development-red-team/. Append these entries to LEAN_RESOURCE_WINDOW_V15_REPORT_PATHS without removing any existing path. This is the existing thirteen-entry amendment plus four approved noncyclic inputs, not a replacement of the earlier report inventory.

| Exact basename | Functional identity | Physical debit |
|---|---|---|
| 265-16-POST-V15-ARCHIVED-PREFIX-PLAN-v1.md | include | include |
| 265-16-POST-V15-ARCHIVED-PREFIX-PLAN-v2.md | include | include |
| 265-16-POST-V15-ARCHIVED-PREFIX-PLAN-CHECK-v1.md | include | include |
| 265-16-POST-V15-ARCHIVED-PREFIX-PLAN-CHECK-v2.md | include | include |
| 265-16-POST-V15-ARCHIVED-PREFIX-RESEARCH-v1.md | include | include |
| 265-16-POST-V15-ARCHIVED-PREFIX-PIN-INVENTORY-v1.md | include | include |
| 265-16-POST-V15-TIMING-DECISION-v1.md | include, historical proposal only | include |
| 265-16-POST-V15-ARCHIVED-PREFIX-SOURCE-SUMMARY-v1.md | exclude exact generated path | include |
| 265-16-POST-V15-ARCHIVED-PREFIX-REVIEW-FIX-v1.md | exclude exact generated path | include |
| 265-16-POST-V15-ARCHIVED-PREFIX-SOURCE-REVIEW-v1.md | exclude exact generated path | include |
| 265-16-POST-V15-ARCHIVED-PREFIX-VALIDATION-v1.md | exclude exact generated path | include |
| 265-16-POST-V15-ARCHIVED-PREFIX-SOURCE-VERIFICATION-v1.md | exclude exact generated path | include |
| 265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v4.md | exclude exact selected generated receipt | include |
| 265-16-POST-V15-ARCHIVED-PREFIX-RESEARCH-v2.md | include | include |
| 265-16-POST-V15-ARCHIVED-PREFIX-PLAN-v3.md | include | include |
| 265-16-POST-V15-ARCHIVED-PREFIX-PLAN-CHECK-v3.md | include | include |
| 265-16-POST-V15-TIMING-APPROVAL-20261009.md | include, adopted prospective approval | include |

Ordering: independent PLAN-CHECK-v3 closes before code; ROOT schedules the exact finite source/report amendment and named exclusions before source execution. All eleven included inputs exist and are immutable before deriving final source identity. Add each exact included path and the retained.ts dependency to the real selected source manifest. Exclude only the six listed generated paths from this amendment; retain existing independently checked exact exclusions for earlier report families. Do not use basename suffix filters, glob/prefix-wide exclusions, wildcard version discovery, or a mutable latest selector for this amendment. Generated outputs can be absent until their scheduled stage; already charged reports cannot disappear or shrink. Every listed output remains charged even when excluded from functional hashing.

After source/test fixes, derive final source commit/manifest/root over noncyclic inputs. Independent intermediate review and REVIEW-FIX close before the final clean receipt. Only then create the fresh selected RESOURCE-WINDOW-SOURCE-REVIEW-v4 against the final fixed identity and nine-file closure; do not overwrite any receipt. Source defects discovered after v4 require ROOT to schedule a new exact receipt/inventory amendment before continuing, never overwrite v4. Summary, validation and independent verification use unchanged final source/root/v4; their exact exclusions prevent self-hash cycles. Any additional report requires a separately reviewed exact inventory addition before creation.
</finite_inventory>

<tasks>
<task type="auto" tdd="true">
  <name>Task 1: Authenticate the exact archived refusal as non-authorizing cost custody</name>
  <files>scripts/lib/v1-38-lean-resource-window-v15.ts, scripts/run-v1-38-lean-correction.ts, scripts/run-v1-38-lean-resource-window-v15.test.ts</files>
  <read_first>265-16-POST-V15-ARCHIVED-PREFIX-PIN-INVENTORY-v1.md and RESEARCH-v1.md in the phase directory; scripts/lib/v1-38-lean-resource-window-v15.ts in full; scripts/run-v1-38-lean-correction.ts readLeanResourceWindowPriorPairV15; scripts/run-v1-38-lean-resource-window-v15.test.ts.</read_first>
  <behavior>
    - Exactly eleven named records produce cost-only custody with current1/cumulative37, immutable refusal provenance, monotonically carried elapsed/debit/survivor floors and unknown historical peaks.
    - Missing/extra/path-substituted/raw-tampered/re-rooted records and each applicable embedded-root mismatch refuse; record roles cannot be exchanged even when unrelated roots are made internally consistent.
    - ROOT refused closure, ordinary-reader refusal, completed-hold metadata and operator-error hold-refusal remain separate; none can satisfy an accepted reader, actual FINAL, accepted check or hold authentication.
    - The actual readLeanResourceWindowPriorPairV15 branch consumes the exact injected byte map for v15-3 and never calls the old authenticateLeanResourceWindowPriorPairV15 or any old ordinary/retained reader. v15-2 keeps its existing branch;4/5 refuse.
  </behavior>
  <action>Per D-01/D-02/D-05/D-22/D-25/D-27/D-28, first perform an isolated bounded read-only recomputation of all eleven exact inventory paths: byte lengths, raw SHA-256, canonical pin root in fixed domain lean-resource-window-archived-v15-2-pin-v1, and labRoot(schemaVersion, record_without_root) where present. Stop on unavailable/mismatched bytes without refreshing pins or finding substitutes. Write focused failing tests before production edits and record the specific RED failure. Add source-controlled LEAN_RESOURCE_WINDOW_ARCHIVED_V15_2_PINS with the exact inventory literals, sizes/key sets/roles, and authenticateLeanResourceWindowArchivedPrefixV15_2(bytes) as an additive exact-key non-authorizing cost-only contract with schema/root domain v15-2-failed-prefix-cost-only-v1. Validate the seven explicit field-role joins in the inventory, including allocation's inherited36 context and refused closure's current1/cumulative37; request/entry/child terminal have no embedded root but retain full canonical pin identity. Return only cost and identity provenance plus a rooted lean-correction-predecessor-v1, never acceptance/final-reader authority. Do not expose private error strings, Strategy/memory/objective, compressed replay or IO material. Add an optional bounded injected-byte reader to readLeanResourceWindowPriorPairV15 with production default readLeanCorrectionPrivateBytes; v15-3 reads only this exact eleven-path set and dispatches the additive authenticator, v15-2 runs its unchanged existing path,4/5 stop before historical reads. Extra input map members, incomplete survivor continuity or cost decreases refuse. Preserve all old authenticator code, pin literals and prior accepted v14-1 behavior. Run GREEN and refactor only with the focused tests still passing; no empirical command is part of this task.</action>
  <verify><automated>node_modules/.bin/vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts --testTimeout 30000</automated></verify>
  <acceptance_criteria>11/11 pre-code checks match exact inventory; real v15-3 reader branch returns rooted cost-only37-charge custody; modified/missing/extra records refuse before interpretation; old reader/authenticator spies show zero calls in new fixtures; returned object has no accepted/finalReaderClose authority property; no historical artifact changes.</acceptance_criteria>
  <done>The refused prefix is reproducibly checkable as immutable cost history only, with no old verification rerun or acceptance promotion.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Propagate the separately rooted approved successor envelope through actual budget guards</name>
  <files>packages/strategy-lab/src/league/lean-experiment.ts, scripts/run-v1-38-lean-correction.ts, scripts/lib/v1-38-lean-correction-retained.ts, packages/strategy-lab/src/league/lean-resource-window-v15.test.ts, scripts/run-v1-38-lean-resource-window-v15.test.ts</files>
  <read_first>265-16-POST-V15-TIMING-APPROVAL-20261009.md and ARCHIVED-PREFIX-RESEARCH-v2.md in the phase directory; lean-experiment.ts resourceWindowBodyV15, leanProspectiveBudgetBinding, admitLeanRetryTimeboxExtension, leanRetryExtensionCaps, leanSupervisorAllocationMode, createLeanResourceWindowAllocationV15, leanResourcePolicyForAllocationV15, assertLeanAggregateMemoryV15, assertLeanProcessMemoryV15, leanCapsForAllocation, leanRetryRootElapsedFloorV8, leanPilotEvidence; correction.ts leanPreparationProtocolBinding, leanRetryExtensionDocumentsV8, assertLeanRetryExtensionDocumentsV8, assertLeanCorrectionAdmissionTime, publishLeanCorrection, assertLeanCorrectionResources, setup/request/continuation/reservation/predecessor and accepted-join functions; retained.ts preparationContinuationPublicationGuard, assertLeanResourceWindowReaderV15, deriveLeanPostV13ClosedPairV14; both focused test files.</read_first>
  <behavior>
    - Capture old policy canonical bytes/root and caps before edits; they remain exactly unchanged after successor addition. v15-2 reconstructs old policy/caps; only v15-3 reconstructs successor; swapped policy/ordinal and dormant4/5 refuse.
    - Real setup and request producers carry approved roots and exact cap/deadline. leanRetryRootElapsedFloorV8 at actual resume equals221730903 and at deadline250530903; a later observation charges each extra millisecond once. Re-anchored/floor-doubled/root-recomputed policy refuses strict admission.
    - Actual allocation constructor/admitLeanAllocation/leanSupervisorAllocationMode/leanCapsForAllocation/leanResourcePolicyForAllocationV15, inert ledger currentLeanElapsedMs/readLeanLedger and leanPilotEvidence agree on successor caps and memoryPolicyRoot; no singleton old-root leak.
    - Actual parent/child resources and prefix-capacity consumers accept only unchanged3GB RAM and unchanged independent2GBscratch/15GBdisk bounds under successor allocation. Equality at reserve+Match cutoff refuses; terminal/publication reserve equality refuses. Baseline requires its own accepted diagnostic and actual FINAL, never cost-only history.
    - Actual prospective retained publication guard and called closed-pair exhaustion logic use successor deadline rather than the consumed18:38:33Z deadline, preserving old-mode results and absent-provider execution.
  </behavior>
  <action>Per D-22/D-25/D-27/D-28 and the direct timing approval, write connected failing policy/clock/guard tests first, then implement the exact successor choices in fixed_constraints without modifying resourceWindowBodyV15 or either old export. Compute approvalRoot and planRoot from final exact bytes, not prose or caller values. Extend LeanRetryTimeboxExtension, strict schema admission/classification, allocation/caps unions and retry-cap cache to include the successor. Implement leanResourceWindowPolicyForModeV15 and use it in leanProspectiveBudgetBinding, leanPreparationProtocolBinding, extension document selection and mode reconstruction; exact policy must match exact ordinal at each producer/consumer. Old documents remain selected for v15-2; successor document joins select this PLAN-v3 and approved TIMING-APPROVAL, retain exact memory approval, and reject mismatched hashes. Adapt createLeanResourceWindowAllocationV15 and validateLeanResourceWindowPredecessorV15 using the selected envelope/floor, with a backward-compatible old default only where the existing call signature requires it. Successor diagnostic carries exactly the authenticated37 historical charges; its conditional baseline carries38 only after its own accepted diagnostic. Keep no-refund survivor/path/physical rules and complete37/300 accounting; the cap is250530903 total, not an old-cap-plus-extension allowance. Reconstruct policy from admitted allocation in leanResourcePolicyForAllocationV15; use admitted supplied policy operands in both memory assertions and emit selected memoryPolicyRoot in leanPilotEvidence. Thread identical b through correction setup, request, continuation, reservation, predecessor, source-manifest checks, admission timer, parent terminal reserve, prospective publication guard, ledger guard and accepted-join equality. Use maximum continuous/inherited elapsed, never add overlapping intervals. In retained.ts change only the prospective preparationContinuationPublicationGuard resourcePolicy selection and deriveLeanPostV13ClosedPairV14 exhausted deadline selection to leanPreparationProtocolBinding(mode), with strict ordinal selection before work; keep full audits intact. If a pure exhaustion/observation seam is extracted, call it from the actual guard/pair constructor and test those consumers, not only the helper. Export a narrowly selected publication-guard wrapper only if needed for connected inert tests; it must delegate to the same real guard, not bypass custody. Existing assertLeanResourceWindowReaderV15 and actual accepted-join code receive successor through admitted allocation/binding; do not invoke actual historical or new retained readers in these tests. Use isolated temporary inert ledgers and injected observations/bytes, not actual route destinations or authority publications. Run GREEN and retain unchanged legacy/default, v14-1 and v15-2 fixture expectations. No allocation/setup/request is published outside inert fixtures.</action>
  <verify><automated>node_modules/.bin/vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts packages/strategy-lab/src/league/lean-resource-window-v15.test.ts --testTimeout 30000</automated></verify>
  <acceptance_criteria>Old policy bytes/root and223171903 caps match their captured baseline; successor strict admission/root has exact250530903 cap/1791598472000 deadline/108000000 floor/1791455941097 anchor/1791569672000 resume/1860000 reserve; real producers, allocation/ledger, memory, timer/publication and retained-exhaustion consumers agree; wrong-policy/re-anchor/double-count/dormant-mode cases refuse; all unrelated RAM/disk/runtime/Match limits unchanged.</acceptance_criteria>
  <done>The approved successor envelope is usable only by v15-3 source contracts, with complete selected-policy propagation and continuous accounting, while consumed policy/history remain immutable.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Join concrete checkpoint distinction, exact independent review v4 and finite source/debit closure</name>
  <files>scripts/lib/v1-38-lean-resource-window-v15.ts, scripts/run-v1-38-lean-correction.ts, packages/strategy-lab/src/league/lean-experiment.ts, scripts/run-v1-38-lean-resource-window-v15.test.ts, packages/strategy-lab/src/league/lean-resource-window-v15.test.ts</files>
  <read_first>ARCHIVED-PREFIX-PLAN-v2.md, PLAN-CHECK-v2.md and CHECKPOINT-REPAIR-SOURCE-VERIFICATION-v1.md in the phase directory; read-only actual checkpoint selector/callback sites in correction.ts, baseline.ts, lib/v1-38-lean-checkpoint-observation-v15.ts and its connected tests; correction.ts authenticateLeanCorrectionReview, authenticateLeanPreparationContinuationSourceReviewV13, validateLeanResourceWindowContinuationV15, createLeanResourceWindowRequestDraftV15, leanCorrectionSourceManifest; lean-experiment.ts LEAN_RESOURCE_WINDOW_V15_REPORT_PATHS and leanTwentySixReportDeltaBytes; lib/v1-38-lean-resource-window-v15.ts leanResourceWindowDocumentsV15; both focused tests.</read_first>
  <behavior>
    - Positive connected fixture authenticates raw cost prefix through actual reader seam, creates setup/request/continuation with successor, and passes actual validateLeanResourceWindowContinuationV15 and authenticateLeanPreparationContinuationSourceReviewV13 with exact independent v4/source/semantic joins; fixture acceptance cannot publish authority.
    - v15-2 selects old policy and exact review-v3; v15-3 selects only exact review-v4; wrong/stale v3, wrong receipt/source/commit/entry count/diff base/actors/nine-file membership/open findings, changed tag or identity-only drift refuses.
    - Concrete fresh observation distinction must match the actual pre/post-native.invoke call chain, same measured guard operands/projection, no observation crossing checkpoints/awaits, and closure-local scalar used only as high-water evidence, never reused measurement.
    - All seventeen amendment paths have exact membership; the actual source manifest includes eleven inputs and excludes only six generated outputs from this amendment. Physical report delta charges all17, growth costs more, charged shrink/disappearance refuses, and unrelated similarly named files receive no exemption.
    - Tampered/refusal-promoted/nonmonotonic prefix, mismatched approval/policy/request/continuation/source joins and dormant4/5 refuse before route preparation; v14-1 and legacy paths are unchanged.
  </behavior>
  <action>Per D-01/D-02/D-05/D-22/D-25/D-27/D-28, write the connected RED fixtures before implementing v15-3 distinction admission and finite inventory. Keep the existing v15-2 approved_prospective_memory_policy branch unchanged. Add only fresh_synchronous_checkpoint_observation_v15 as the v15-3 distinction; it attests repaired source semantics, not a speedup or initiating-failure cause. Preserve the current distinction keys kind/evidenceRoot/reviewRoot; in the new branch evidenceRoot joins request.sourceRoot and reviewRoot is SHA-256 of exact selected v4 receipt bytes. Match top-level continuation.reviewRoot, request.reviewRoot and the independent reviewed source identity to the same receipt. The final runtime validator checks exact receipt/frontmatter and source-root/manifest/current-commit joins plus explicit distinction, not arbitrary prose or an AST-derived semantic certificate. Use leanResourceWindowDocumentsV15 to select exact RESOURCE-WINDOW-SOURCE-REVIEW-v4.md only for v15-3; v15-2 retains v3 and4/5 get no usable new review/policy contract. Preserve strict existing review frontmatter fields source_commit, source_root, source_entries, diff_base, author_agent, reviewer_agent, independently_reviewed:true, files_reviewed:9, files_reviewed_list, findings_open:0 and status:clean. Require diff_base=7250223f67620ccc274a3a2fc80d099718ea58ea, exact nine-file closure above, final current source identity and independent allowlisted reviewer distinct from author. The independently created v4 narrative must attest actual synchronous fresh checkpoint selector/callback/guard invariants and connected-test evidence against that failed base;47425b37 is prior repair evidence only. Reject a clean-looking identity-only drift or stale review. Add optional bounded injected bytes/current-identity observations to actual validators for isolated connected tests without bypassing any production check. Distinction tests must use actual readLeanResourceWindowPriorPairV15, createLeanResourceWindowContinuationV15, createLeanResourceWindowRequestDraftV15, validateLeanResourceWindowContinuationV15 and actual selected source-review consumer; spy that new prefix handling never invokes old authenticators/readers. Preserve fresh own-diagnostic+actual-FINAL baseline requirement and all actual per-route actor/data/helper/distinction gates; this source task creates none of those real artifacts. Encode the exact17-path amendment and exact six-path functional exclusions from finite_inventory, include retained.ts as functional source dependency, and exercise real leanCorrectionSourceManifest plus leanTwentySixReportDeltaBytes/monotone survivor debit with inert physical files. All four new inputs are included, not generated exclusions. Independent final v4 creation occurs only after final reviewed/fixed source commit/root; tests use clearly non-authorizing fixtures, not a fabricated real clean receipt. Run GREEN and report source-only readiness; do not execute ROOT's empirical task.</action>
  <verify><automated>node_modules/.bin/vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts packages/strategy-lab/src/league/lean-resource-window-v15.test.ts --testTimeout 30000</automated></verify>
  <acceptance_criteria>Positive real producer/consumer fixture joins exact11-pin cost custody, v15-3 successor, concrete semantic tag and nine-file v4 receipt; each stale/wrong/tampered/identity-only/authority-promoting case refuses. Exact17 paths are inventoried and debited, eleven source inputs are hashed and six exact generated outputs excluded. No consumed artifacts, existing checkpoint implementation or old review path is altered; no actual source-review/data/helper/authorization/allocation/route artifact is manufactured by tests.</acceptance_criteria>
  <done>The missing archived-prefix and meaningful-distinction source joins are fully specified and tested under the approved successor timing policy, ready for independent source review/fix/validation/verification only.</done>
</task>
</tasks>

<threat_model>
## Trust boundaries

| Boundary | Description |
|---|---|
| Archived raw metadata → cost parser | Exact lengths/digests/canonical pins and field roles authenticate hostile/stale bytes without old reader execution. |
| Human approval and mode → immutable envelope | An adopted exact time extension cannot mutate consumed policy or enable another ordinal. |
| Cost custody → request/continuation/baseline | Refused historical facts cannot issue acceptance or actual FINAL authority. |
| Source/review actors → distinction consumer | Independent exact source/receipt identities and actual call-chain review, not self-review or identity-only drift. |
| Source/debit manifests → publication/reader guards | Cyclic output exclusions cannot hide physical costs or substitute an old deadline. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-265-AP-01 | Tampering | Eleven raw records | high | mitigate | Task1 exact raw/canonical/embedded pins and seven role joins; missing/extra/tampered bytes stop. |
| T-265-AP-02 | Repudiation | Refused and operator-error history | high | mitigate | Task1 separate immutable refusal/hold roles,37 charges and monotone time/debit/survivors; no accepted authority properties. |
| T-265-AP-03 | Elevation of privilege | Mode/policy/continuation/baseline | critical | mitigate | Tasks2/3 strict ordinal-selected policy/root and exact source/distinction/own accepted diagnostic+FINAL;4/5 dormant. |
| T-265-AP-04 | Information disclosure | Metadata projection/tests | high | mitigate | Task1 metadata role allowlist only; no private errors, Strategy/memory/objective or IO payload dumps. |
| T-265-AP-05 | Denial of service | Wall/reserve/resource admission | high | mitigate | Task2 unchanged physical/RAM/runtime bounds, continuous floor counted once, exact cumulative/absolute reserve gates including retained publication/exhaustion. |
| T-265-AP-06 | Spoofing | Selected independent v4 reviewer | high | mitigate | Task3 exact actor allowlist/distinct author, raw receipt/current commit/root/nine-file closure, clean0 findings; no stale v3 or fake runtime semantic certificate. |
| T-265-AP-07 | Tampering | Report/source exclusion set | high | mitigate | Task3 exact17-path inclusion/debit and six exact cyclic exclusions, real manifest/delta tests and charged shrink refusal. |
| T-265-AP-SC | Supply-chain tampering | Dependency installs | low | accept | No install tasks or new packages; existing repository TypeScript/Vitest only. |
</threat_model>

<verification>
Each task records a named focused RED failure, GREEN pass, and any refactor pass; use only the two existing focused Vitest files. Commands should finish within60s; if they exceed that budget, ROOT records the actual result/time and selects exact named test groups instead of inventing a passing count. No empirical/historical reader or provider execution is permitted as source verification. Inherited strict typing, legacy-suite and serious-monitor NOTPASS observations remain explicit; a focused pass is not a whole-suite or phase pass. Independent source review/fix precedes ROOT validation and distinct source verification at held final source identity. They must independently recompute current manifest/selected receipt and confirm all called guard joins, not claim success from this plan text.

Before handing back source work verify git diff ownership is only the six files and already scheduled exact source-only output paths, old resourceWindowBodyV15/policy/caps are unchanged, exact11 historical raw pins still match, and no actual empirical/request/setup/helper/allocation/authority artifact was created. Stop honestly if reserve/deadline cannot accommodate remaining gates. This planner creates only this PLAN-v3; it does not implement code, run tests, create reviews or commit.
</verification>

<source_audit>
| Source | Item | Coverage | Status |
|---|---|---|---|
| GOAL | Phase265 serious current-rules empirical league/development red team | Existing Plan16 owns empirical work; this supplement closes source prerequisites only | COVERED prerequisite; goal not achieved |
| REQ | LEAG-01/02/03/04/05/07 | Tasks1–3 preserve source/custody/accounting prerequisite joins; unchanged existing plan remains empirical owner | COVERED prerequisite; no completion credit |
| REQ | LEAG-06/08/09 | Existing approved phase/lean Plan16 dispositions remain; no diversity/finalist/red-team implementation added here | COVERED by existing plan scope, not recredited |
| RESEARCH | Archived raw refusal custody, role separation,37-charge/no-refund/unknown peaks | Task1 exact11 inventory and actual reader seam | COVERED |
| RESEARCH | New policy schema/domain/name and old policy immutability | Task2 fixed named strict successor and old-byte regression | COVERED |
| RESEARCH | Exact resume/cap/deadline/floor counted once/reserve and all mode-selected guards | Task2 real producer/allocation/ledger/memory/timer/retained joins; narrow retained dependency included | COVERED |
| RESEARCH | Concrete repaired checkpoint semantics vs failed base and fresh current receipt | Task3 actual connected consumers, exact v4 and expanded nine-file scope | COVERED |
| RESEARCH | Existing13 plus four noncyclic inputs, exact exclusions, physical charge and order | Task3 finite17 table and real manifest/delta tests | COVERED |
| CONTEXT | D-01/D-02/D-05 | Tasks1/3 preserve immutable identity, pinned evidence and independence; no scope authority change | COVERED |
| CONTEXT | D-22/D-25/D-27/D-28 plus direct approved timing | Tasks1–3 continuous unchanged resource accounting, new named private envelope, no history/public/runtime/rule authority change | COVERED |
| CONTEXT | D-23/D-24/D-26 | Unchanged pilot tier/cold workflow/freeze-before-formation scope belongs to existing Plan16 and downstream freeze, not this source supplement | COVERED by existing scope; no deferred implementation |
| CONTEXT | Other D-03/04/06–21 | Existing Plan16/phase contracts remain unchanged; no new solver/population/response/claims semantics | COVERED by existing scope |
| CONTEXT | Deferred formation/Phase268 retraining/Phase269 certification/later-rule experiments | Explicitly excluded from all three source tasks | EXCLUDED, not a gap |
</source_audit>

<success_criteria>
All three serial source-only tasks pass their connected focused tests; exact raw pins and old consumed policy remain unchanged; successor-only mode3 cap/deadline and continuous elapsed are consistent across real called consumers; cost custody never issues accepted/final-reader authority; exact v4 review contract covers nine files against the failed comparator; finite17-path source/debit accounting is acyclic and no-refund. Independent clean review/fix, ROOT validation and distinct source verification are required next, not established by planning or fixture passes. No LEAG/Phase265/baseline/freeze/formation/holdout/public/counted/production success is inferred.
</success_criteria>

<output>
Planning output is this exact additive 265-16-POST-V15-ARCHIVED-PREFIX-PLAN-v3.md only. Execution later records source-only summary in the exact pre-inventoried 265-16-POST-V15-ARCHIVED-PREFIX-SOURCE-SUMMARY-v1.md. Do not create a numbered successor plan or alter historical artifacts. ROOT's empirical task is separate: only after independent fixed-source review/fix/validation/verification and actual fresh actor/request/data/helper/distinction gates, a new immutable committed allocation, empty owned0700store, passing SAMEPROCESS capacity before charge/provider, unique ROOT entry, source/HEAD hold and exactly one appropriate unique verification may a distinct route occur. Its own accepted diagnostic+actual FINAL alone may enable its conditional36-cell baseline; first accepted complete baseline or exhausted bounds ends the envelope. This supplement does not perform or authorize those operations by itself.
</output>
