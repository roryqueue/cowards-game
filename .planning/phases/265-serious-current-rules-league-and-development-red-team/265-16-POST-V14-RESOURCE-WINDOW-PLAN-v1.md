---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: post-v14-resource-window-v1
type: execute
wave: 12
depends_on: [265-15]
autonomous: true
execution_owner: ROOT_only_after_source_gates
requirements: [LEAG-01, LEAG-02, LEAG-03, LEAG-04, LEAG-05, LEAG-07]
requirement_dispositions:
  LEAG-06: original_diversity_certification_deferred_no_credit
  LEAG-08: original_robust_finalist_certification_deferred_no_credit
  LEAG-09: superseded_single_automated_round_no_new_channels
files_modified:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-resource-window-v15.test.ts
  - scripts/lib/v1-38-lean-resource-window-v15.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/run-v1-38-lean-resource-window-v15.test.ts
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-SOURCE-SUMMARY-v1.md
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v1.md
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-VALIDATION-v1.md
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-SOURCE-VERIFICATION-v1.md
must_haves:
  truths:
    - Only authenticated v15-2 through v15-5 receive the approved RAM/window policy; every legacy family keeps its original policy and paths.
    - Aggregate parent/child RSS including fixed reserves is bounded at 3000000000 bytes independently of unchanged 2GB scratch, 12GB retained and 15GB total disk.
    - Original FULL108M plus every wall millisecond since 1791455941097 remains charged, ending at the exact approved deadline with the unchanged 31-minute terminal reserve.
    - Authentic closed v14-1 carries all 36 charges; later routes carry their whole closed prefix, and only their own accepted diagnostic plus actual FINAL can enable their baseline.
    - Source verification grants no empirical credit; only ROOT may prepare a fresh reviewed allocation and enter after all gates, stopping at first accepted baseline or exhausted budget.
  artifacts:
    - path: scripts/lib/v1-38-lean-resource-window-v15.ts
      provides: explicit documents, finite historical pins and authenticated successor family joins
    - path: packages/strategy-lab/src/league/lean-resource-window-v15.test.ts
      provides: inert policy, memory/disk and ledger boundary regressions
    - path: scripts/run-v1-38-lean-resource-window-v15.test.ts
      provides: inert selected-route admission, reader and parent/child guard regressions
  key_links:
    - from: authenticated allocation and request
      to: parent, child, capacity and retained readers
      via: identical rooted v15 policy lookup, never a caller-supplied ceiling
    - from: actual v14-1 closed pair
      to: v15-2 predecessor
      via: pinned terminal/carry/hold/accepted diagnostic custody with cumulative 36 charges
    - from: v15 own accepted diagnostic and FINAL
      to: same ordinal conditional baseline
      via: fresh source-bound ROOT data/helper review and committed immutable allocation
  prohibitions:
    - No consumed route reuse, refund, re-anchor, idle exclusion or historical reader execution.
    - No audit bypass, cache waiver, legacy/default cap change, resource-cure or full-baseline-fit promise.
    - No executor helper/allocation/Match/provider authority; no Phase265 completion, freeze, formation, holdout opening, public, counted or production authority.
---

<objective>
Implement the approved prospective memory/window distinction as an additive supplement to EXISTING Plan265-16, not a new numbered plan or phase replan. Per D-01, D-02, D-04, D-05 and D-22–D-28, preserve all scientific/runtime/history boundaries while enabling only the four unused global ordinals. Source-only implementation/review/validation/verification precede a separate ROOT empirical frontier; neither stage promises runtime recovery or full36 fit.
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
@CowardsGameSpec_Full_Consolidated_v1.md
@CowardsGame_Technical_Architecture_Spec_V1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-CONTEXT.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-PLAN.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-RESEARCH-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-MEMORY-AND-TIME-DECISION-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-MEMORY-AND-TIME-APPROVAL-20261009.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-REPLACEMENT-WINDOW-APPROVAL-20261009.md
@.planning/debug/v14-baseline-precharge-rss.md
</context>

## Approved policy and source-grounded seams

Discovery level0: existing TypeScript/Vitest patterns only; no installs. Actual resume1791556713000/prior208771903 +14400000 = cap223171903; absolute deadline1791571113000 /2026-10-09T18:38:33Z. Preserve original1791455941097 and FULL108000000: cumulative floor108000000 + max(0, observedWall-originalAnchor), never start the clock at v15 preparation. All research/planning/review/testing/admin/idle/wait continues charging. Reserve1860000ms; Match600000ms unchanged. Aggregate RAM3000000000 includes parent+child+external512000000+guard335544320. Oldspace768MiB, sampling250ms, guest1000/host5000/startup2500, disk scratch2000000000/retained12000000000/total15000000000/terminal1000000000, maximum300Matches unchanged.

Verified existing interfaces: leanCapsForAllocation, admitLeanAllocation, leanSupervisorAllocationMode, leanRetryOrdinal, leanCorrectionRoutePaths, leanWritablePaths, checkpointLeanResources/readLeanLedger/verifyLeanEvidence in lean-experiment.ts; assessLeanPrefixCapacity in scripts/run-v1-38-lean-experiment.ts; assertLeanBaselinePrefixCapacity and bounded parent's readiness/sampling in scripts/run-v1-38-lean-baseline.ts; assertLeanCorrectionResources, leanCorrectionSourceManifest, leanPreparationProtocolBinding/Documents/Version/Schema, leanCorrectionChildSupervisor, readLeanPostV13PriorPairV14, validateLeanPostV13ContinuationV14, authenticateLeanPostV13FivePairAcceptedJoinV14 in correction.ts. Existing selected v14 continuation validator intentionally rejects ordinals after1: do not remove that rejection.

Existing retained seams: auditLeanCorrectionRetained, ordinary reader guard/readerScratchHighWaterBytes, preparationContinuationPublicationGuard, accepted-full-audit checks, refusal guards, authenticateLeanPostV13ClosedPairV14 and terminal/carry/hold authenticators. Existing helper topology is scripts/lib/v1-38-lean-post-v13-five-pair.ts; portable patterns in scripts/run-v1-38-lean-post-v13-five-pair.test.ts and scripts/lib/v1-38-lean-post-v13-five-pair-custody.test.ts. New test/module paths below are explicitly NEW, not claimed existing tests.

<produced_symbols>
NEW LeanResourceWindowModeV15, LEAN_RESOURCE_WINDOW_V15_POLICY, isLeanResourceWindowModeV15, leanResourcePolicyForAllocationV15, assertLeanAggregateMemoryV15, leanResourceWindowDocumentsV15, authenticateLeanResourceWindowPriorPairV15, authenticateLeanResourceWindowAcceptedJoinV15. Names are new implementation contracts; do not cite them as existing exports. Integrate via existing CLI dispatcher and allocation/reader seams, not another execution boundary.
</produced_symbols>

<tasks>
<task type="auto" tdd="true">
<name>Task1: Add strict prospective policy, routes and finite custody contract</name>
<files>packages/strategy-lab/src/league/lean-experiment.ts, packages/strategy-lab/src/league/lean-resource-window-v15.test.ts, scripts/lib/v1-38-lean-resource-window-v15.ts</files>
<read_first>lean-experiment.ts mode/extension/caps/allocation/paths/report inventory and resource-event parser; scripts/lib/v1-38-lean-post-v13-five-pair.ts document/pin pattern; actual replacement approval and closed v14-1 saved artifacts named by its existing document helper. Read metadata only; do not execute old readers.</read_first>
<behavior>RED: accept only authenticated v15-2..5 and exact rooted approved policy; unknown/forged modes, v15-1/6, arbitrary ceilings, altered approvals/anchor/cap/reserves/ordinal/root refuse. Legacy/default policy and paths unchanged. Aggregate3000000000 exactly allowed, +1 refused; legacy2000000000 +1 still refused. Scratch2000000000 exactly keeps existing boundary, +1 refused independently; retained/total overflow never rescued by RAM allowance. Original elapsed floor includes idle/preparation/test/review and preserves reserve/deadline.</behavior>
<action>Per D-01/D-02/D-05/D-22/D-25/D-28 add a separately rooted exact-key policy and explicit four-mode tuple v15-2..5; no widening existing v14 extension/caps/validator. Bind policy through allocation/request/continuation/setup/source-review/authorization identities and authenticate before selecting limits; do not accept structurally similar unauthenticated objects or mutable cached policy. Preserve leanCapsForAllocation's disk fields, add distinct memory lookup and memory telemetry, reject unknown schema/extra keys. Allocation admission, schema/version unions, caps cache, route selection, writable paths and physical report inventory must select new family explicitly. Routes use dated20261009-v15-N stores/request/temp, allocation artifact v1.38-lean-correction-supervisor-{route}-allocation-v15-N.json and check filenames ending-v15-N.json, with global ordinal N unchanged. Documents use phase-local265-16-POST-V14-RESOURCE-WINDOW-{route}-v15-N-{ROLE}-v1.{json,md} and private helper .strategy-lab/lean-resource-window-{route}-v15-N-helper.mts; enumerate finite ROLE sets, no glob authority. Bind actual approval bytes and this supplement bytes without editing old history. New helper authenticates actual v14-1 failed baseline closed-pair/carry/hold/terminal verification AND its accepted diagnostic/FINAL, exact36charges and survivor/time debits; obtain full hashes from saved canonical bytes, not abbreviated STATE values. Later ordinals require their authentic immediate closed prefix and charge every failure; no ordinal skip/refund. Carry unknown historical RSS/native cause as unknown. Add finite source/report/path inventories for all four modes without replacing historical lists; source excludes only named cyclic output reports/attestations/helper/data roots while physical accounting includes every survivor and new report. No helper, actual setup, authorization or allocation is created in this source task.</action>
<verify><automated>pnpm exec vitest run packages/strategy-lab/src/league/lean-resource-window-v15.test.ts</automated></verify>
<acceptance_criteria>Rooted prospective memory policy cannot widen disk or old authority; fixed timing and finite routes authenticate; complete36-charge predecessor and exact later-prefix semantics are defined. RED then GREEN recorded; no empirical files generated.</acceptance_criteria>
<done>Contract and portable tests exist, legacy behavior preserved, no route prepared.</done>
</task>

<task type="auto" tdd="true">
<name>Task2: Wire every selected guard, independent disk ledger and retained join</name>
<files>scripts/run-v1-38-lean-correction.ts, scripts/run-v1-38-lean-baseline.ts, scripts/run-v1-38-lean-experiment.ts, scripts/lib/v1-38-lean-correction-retained.ts, scripts/run-v1-38-lean-resource-window-v15.test.ts</files>
<read_first>Task1 exports; correction source manifest/admission/protocol/CLI/run checkpoint callers; baseline prefix and bounded parent; experiment assessLeanPrefixCapacity; retained ordinary/full-audit/publication/refusal/closed-pair guard regions. Read adjacent existing tests for inert tmpdir mocks, not operator-local live fixtures.</read_first>
<behavior>RED: real selected v15 request/child/dispatch/authentication path accepts only fresh correct ROOT author and distinct permitted reviewer gates; forged source/helper/policy/HEAD/continuation/closed-prefix/accepted-check/FINAL refuses. Each own baseline refuses wrong ordinal, stale FINAL or missing own diagnostic. Parent readiness, child prefix, replay child guard callback, 250ms sampler, publication and retained readers use same memory policy; one-byte over kills/refuses, missing callback refuses. Memory above2GB below3GB must not fail by being mislabeled disk; genuine disk excess still fails. Cumulative36 floor and time budget hold. Inert fixtures never charge, run Strategy/provider/Match or create empirical credit.</behavior>
<action>Per D-02/D-04/D-05/D-22/D-25/D-27/D-28 route v15 through existing trusted parent/child dispatcher, source closure, preparation admission and actual actor/data/helper contracts; require genuinely approved memory-policy distinction independently bound to current source rather than identity-only byte drift or old graph-repair attestation. Preserve full parent/child admission and accepted-result audits, repeat guards and fresh same-process capacity BEFORE charge/provider; no cache waiver. Authenticate root/history/source/request/helper/actual reviewer roles and fresh actual FINAL. Update only v15 selected branches for every memory guard: package assertTransient allocation-aware callers; assessLeanPrefixCapacity; assertLeanCorrectionResources; assertLeanBaselinePrefixCapacity; bounded parent's ready check and 250ms kill sampler; correction's two highWater/checkpointLeanResources calls; retained ordinary reader, accepted-full-audit readerScratchHighWaterBytes, publication and no-ledger/admission-refusal checks. Legacy experiment-parent guard stays unchanged unless selected v15 reaches it; trace reachability and document that exclusion. For v15 separate RSS telemetry from disk scratch/buffer fields: correction highWater currently returns combined RSS then feeds disk resource events, retained scratchPeak likewise combines RSS into physical/total arithmetic. Never clamp/zero/fabricate disk usage to evade this coupling: extend rooted v15 event/reader telemetry with explicitly named memory high-water plus independently measured physical/scratch/buffer evidence; update checkpoint/parser/verify/audit agreement, preserving old schema interpretation and unchanged physical/retained/total/reserved-terminal assertions. Include parent and child plus512M+335544320 in memory boundary; a reader without child uses its actual process and fixed reserves, not an invented child observation. Bind new policy to source closure and request/entry/caps/report roots. Physical inventory includes historical v14-1, current store/temp/helper/gates and exact allowed reports, avoiding cyclic source-hash self-reference and broad write allowlists. Publish source-summary guard/coupling/reachability table and exact tests; obtain independent fixed-source review, validation, and separate source verifier records before ROOT task3. No executor allocation/helper/entry/Match/provider authority.</action>
<verify><automated>pnpm exec vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts</automated></verify>
<acceptance_criteria>All reachable memory guards and memory-to-disk couplings are accounted for; parent/child/reader agree. Portable tests exercise selected dispatch and authenticators with clearly NON-AUTHORIZING synthetic custody; no fabricated production successful diagnostic. Closed prefix and own-FINAL negative cases pass, with unproved positive full accepted-baseline audit explicitly disclosed.</acceptance_criteria>
<done>Independent source review/fix and scoped validation/verification closed; actual runtime recovery and full36 feasibility remain unproved.</done>
</task>

<task type="auto" owner="ROOT">
<name>Task3: ROOT-only fresh empirical frontier within the fixed remaining window</name>
<files>ROOT-only exact per-mode documents/helper/request/allocation/report paths enumerated by leanResourceWindowDocumentsV15 and leanCorrectionRoutePaths; no executor writes. Preserve older evidence and source-summary/review/validation/verification reports.</files>
<read_first>Actual closed task1/2 source gates, finite v14-1 carry, exact approval/deadline, actual author/reviewer request/helper authentication, committed-allocation checks, same-process capacity and unique ordinary-versus-result-absent terminal reader dispatch.</read_first>
<action>ROOT alone authors one distinct fresh v15-2 diagnostic request/setup/continuation/helper against held reviewed source; obtain ACTUAL independent request/data/helper/meaningful-policy attestation review, not a self-authored pass. ROOT prepares one immutable canonical allocation, commits allocation and gates BEFORE unique entry into empty0700store; inspect remaining continuous wall budget/reserve, all36charges/survivors and physical allowance. No new approval literal is needed; approval does not skip gates. Entry performs fresh SAME-PROCESS capacity before charge/provider; hold source AND HEAD through actual process terminal and exactly one appropriate actual independent verification. Result present selects ordinary retained reader; absent result selects terminal-only verifier, never retry old reader or run both as acceptance alternatives. A matching accepted diagnostic plus its actual FINAL alone permits a separately fresh ROOT baseline request/helper/review/committed allocation under same ordinal; 36 planned Matches, no charge inferred from preparation. Authentic cleanup/process closure/carry/closed-pair is mandatory before advance to v15-3, then4, then5; every failure/idle/wait/debit carries. Uncertain integrity/publication/cleanup blocks continuation. First fully independently accepted complete baseline ends experiment immediately; deadline/budget/reserve exhaustion stops without rolling extension; at most FOUR new pairs, not five new pairs. Further ordinals require independently checked meaningful prospective distinction under the approved policy, never unchanged known-failing rerun. If unsuccessful record feasibility_not_established/gaps_found with actual partial/zero current charges and immutable cumulative history. No full-Phase265/LEAG/freeze/formation/holdout/public/counting/production credit follows automatically; baseline remains current-only and needs actual downstream verification.</action>
<verify><automated>pnpm exec vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts -t 'ROOT authority frontier'</automated><human-check>ROOT records actual fresh review/allocation/capacity/entry/appropriate-verifier identities and terminal custody, or honest budget-exhausted/no-entry closure. This is an empirical proof obligation, not satisfied by the inert test.</human-check></verify>
<acceptance_criteria>Only ROOT can activate admitted prospective route; authentic actual records or explicit no-entry terminal reason, all elapsed/charges/disk carried. No executor silently dispatches this task.</acceptance_criteria>
<done>ROOT empirical frontier closed honestly or deferred to ROOT after source gates; source executors report no empirical authority.</done>
</task>
</tasks>

## Dependency and validation boundary

Single serial supplement: task1 contract → task2 selected source integration → independent source review/fix/validation/verification → ROOT task3 actual data/helper/allocation/entry. Shared source files prohibit parallel writes. Root-authorized report producers own their named reports; no new numbered plan/workstream. Source-task changes are bounded to3 and5 files respectively; task2 returns any discovered required extra source seam to ROOT for in-supplement ownership scheduling, never drops a guard or broadens authority. Existing replay validation's resource-guard callback must remain wired to the selected policy, and required child guard, source/root and sampling callbacks cannot be replaced with no-ops; enumerate the actual caller in the source-summary reachability table.

<verification>
Run each focused portable suite separately, aiming under60seconds per command; record RED/GREEN and selected/unselected coverage. After fixed-source review run relevant portable existing baseline/correction-byte/contract suites only with explicitly selected inert cases; do not run old operator-local fixture/readers as tests. Execute configured type/boundary/shell/whitespace checks at ROOT validation frontier and disclose exact results. Inherited strict6 diagnostics, legacy private fixture4ENOENT and serious-monitor5 node:util origins remain unresolved NOTPASS unless actual new evidence resolves them; never label global validation green or repair unrelated boundaries here. Source verifier independently checks policy-binding/guard reachability/disk independence/lineage/time/ROOT authority and reports any omitted positive custody/full-baseline/replay/disconnect/publication proof as an explicit gap, not runtime success.
</verification>

<threat_model>
## Trust Boundaries
Untrusted mode/request/allocation → rooted resource policy; historical bytes → charged predecessor; own diagnostic/FINAL → baseline; RSS observations → guard; filesystem inventory → disk debit; source-only executor → ROOT activation.
## STRIDE Threat Register
| ID | Category | Component | Severity | Disposition | Mitigation |
|---|---|---|---|---|---|
| T-265-RW1 | Tampering | policy/caps lookup | high | mitigate | Exact rooted allowlist and approval/request/allocation joins; legacy2GB regression. |
| T-265-RW2 | Elevation of privilege | dispatcher/request review | high | mitigate | Only v15-2..5, actual ROOT/distinct reviewer roles, no source-executor dispatch authority. |
| T-265-RW3 | Repudiation | carry and time floor | high | mitigate | Authentic failed v14-1/36 charges and immediate closed prefix; continuous original clock/no exclusions. |
| T-265-RW4 | Denial of service | parent/child/readers | high | mitigate | Same-process capacity, bounded sampling/kill, full guards and reserve; no runtime-fit guarantee. |
| T-265-RW5 | Tampering | highWater/disk inventory | high | mitigate | Separate rooted RAM telemetry and measured disk fields; scratch/retained/total independent boundaries. |
| T-265-RW6 | Spoofing | accepted diagnostic FINAL | high | mitigate | Own ordinal/source/root/actual closed reader joins; forged/missing FINAL refuses. |
| T-265-RW7 | Information disclosure | reports/runtime | high | mitigate | Private roots-only custody, unchanged hostile runtime/public privacy, no holdout or formation access. |
| T-265-SC | Supply-chain tampering | packages | low | accept | No installs or new dependencies. |
</threat_model>

## Multi-source coverage audit (supplement scope, not full phase certification)

| Source | Items | Coverage |
|---|---|---|
| GOAL | Active bounded current-rules exploratory goal | Tasks1–3 support existing265-16; empirical complete snapshots/solver/training still governed by original plan, not declared achieved here. |
| REQ | LEAG-01/02 complete cells/no imputation;03/04 frozen solver/response;05/07 honest report/pure portfolio | Existing265-16 retained unchanged; tasks1–3 resource/custody prerequisite, no new LEAG completion claim. |
| REQ | LEAG-06/08/09 | Existing approved deferred certification and superseded automated-round dispositions preserved; no new channels. |
| RESEARCH | Additive family, every guard/coupling, disk independence, timing, carry, ownFINAL, source holds, actual fresh gates, no cure promise | Tasks1–3 and verification cover all recommendations and boundary tests. |
| CONTEXT | D-01–D-06,D-22,D-25,D-27,D-28 | Tasks1–3 immutable identities/fail-closed/kernel-hostility/accounting/no rules/no formation/resource/privacy. |
| CONTEXT | D-07–D-21,D-23,D-24,D-26 | Existing265-16 implementation remains authoritative; no matrix/solver/training/portfolio/holdout/freezing semantics modified. Deferred D-17/18 scale gates not revived. |
| APPROVAL | RAM3GB, exact replacement anchor/cap/deadline, allwall/FULL108M, unchanged disk/runtime, fourunusedpairs/firstacceptedstop | Tasks1–3 exact adopted values and terminal conditions; expired earlier timing proposal remains historical. |

<success_criteria>Source gates accurately closed with inherited limitations disclosed; additive v15 policy authenticates approved memory/time without weakening disk or history. ROOT actual empirical outcome remains separately proven or explicitly inconclusive. No promise of native-memory cure, full36 fit or phase completion.</success_criteria>
<output>Write distinct265-16-POST-V14-RESOURCE-WINDOW-SOURCE-SUMMARY-v1.md; actual independent SOURCE-REVIEW/VALIDATION/SOURCE-VERIFICATION-v1.md. ROOT writes unique per-route actual preparation/data/helper/terminal records from finite document map. Do not overwrite265-16-SUMMARY.md or historical v14 reports, allocate, execute, update STATE/ROADMAP or commit from this planning assignment.</output>
