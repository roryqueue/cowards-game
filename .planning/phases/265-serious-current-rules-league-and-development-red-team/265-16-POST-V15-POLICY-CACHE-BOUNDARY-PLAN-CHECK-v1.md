---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: policy-cache-boundary-fix-v1
status: passed
scope: source_only_pre_execution_revision_gate
plan_bytes_root: sha256:fba98989ebb370251642cfbf45a69d229a5ab3170a8c1b1bad9adc332510f60c
source_repair_base: b21db1433611b494091a269d13c8f58dc91ba2bf
failed_functional_comparator: 763174fdbbadb21982acdfb6f4c9bedd007241cf
source_readiness: blocked_until_repair_and_independent_gates
empirical_credit: none
---

# Existing Plan16 — policy-cache boundary amendment check

## VERIFICATION PASSED

**Revision Gate: PASS for the submitted source-only correction plan.** Two serial correction tasks, eight unique owned source/test paths, unchanged thirteen-path semantic closure, exact eight-path accounting amendment. No new plan-level BLOCKER or WARNING remains. The existing implementation findings CR-PC-B01 and CR-PC-T01 remain open until actual correction and independent validation; this plan check does not mark them fixed.

Read full BOUNDARY-PLAN-v1 and ROOT VALIDATION-v1, original checked plan/inventory, implementation summary, intermediate clean review/no-fix disposition and selected-v5 history. Checked actual bridge/wrapper/publication/retained/source-review/manifest interfaces and factory scanner source with bounded reads. Earlier project/context/gate/pattern reads from the preceding original-plan check remain applicable. No new numbered plan, new human decision, source execution or empirical operation is introduced.

Checked amendment raw identity: `sha256:fba98989ebb370251642cfbf45a69d229a5ab3170a8c1b1bad9adc332510f60c`.

## Concrete findings mapped to executable fixes

| Required outcome | Actual source evidence and planned closure | Verdict |
|---|---|---|
| CR-PC-B01: remove denied core clock dependency without weakening scanner | Actual `runtime-bridge.ts:3` imports node:perf_hooks. Factory scanner `allowedNode` excludes it and allows it specifically only at existing named host paths, including `baseline-match.ts`; no bridge exemption exists. Task1 removes the new bridge import and uses optional `hostClockV15` supplied with strict4 binding by the already allowed wrapper. Scanner/allowlists remain unmodified and must pass. | PASS planned |
| Preserve valid host failure phase when timing cannot be trusted | Current bridge final issuance selects `unknownHostFailureV15` when timingValid is false, losing firstFailure. Amendment explicitly separates timing validity from catch/refusal truth: absent/throwing/backward/nonfinite/unsafe clock produces exact seven zero totals while preserving firstFailure phase/code and final execution branding. Unknown remains for absent/mismatched brand or genuinely unknown operation. Tests cover the negative clocks and cleanup. | PASS planned |
| No timing callback on legacy/default path | Task1 passes clock only with admitted4 hostBindingV15; bridge makes no direct Node/Date/global performance/system-clock access, and no-opt-in never calls it. Existing phase-boundary sites remain outside pure engine logic; caught clock values are not inspected and cannot prevent cleanup. Positive finite totals and legacy no-clock call assertions are required. | PASS planned |
| CR-PC-T01: correct two new fixtures without suppressing type checks | Actual script test reason fixture around`:88` omits required canonical root, and allocation fixture around`:126–127` uses Object.fromEntries plus full-type assertion. Task1 replaces them with complete canonically rooted reason data and explicit typed constructor fields, preserving assertions and inert scope. No any/double-unknown/ts-ignore workaround or unrelated nullable baseline repair. | PASS planned |
| Independent fresh v6 and actual fixed-source joins | Task2 owns custody document selection currently choosing v5 at`:393` and correction exact source-role checks at`:560`; new4 selects only v6, actual fixer `/root/fix_265_policy_cache`, reviewer `/root/review_265_policy_cache`, exact13 paths, same763174fd comparator/tag, current final manifest/commit/entries/Git ancestry, clean0/independenttrue/identity_onlyfalse. Old v5 is rejected rather than rewritten. | PASS planned |
| Acyclic source and physical inventory | Task2 owns lean-experiment report/input/exclusion sets and correction actual mode4 manifest`:298–300`. Exactly two new immutable functional inputs plus six exact generated exclusions are appended; all eight are physically debited. Old inputs/exclusions/debits, including v5 exclusion, remain. No lookalike exemption, broad new exclusion, self-hash or disappearing/shrinking charged output. | PASS planned |
| Preserve actual cache/guard/cost/private-cell behavior | Original checked contract remains binding: host-return identity cache only, old immutable helper/map untouched, all THREE fresh allocation-file admissions and live native/source/HEAD/ledger/RSS/time/disk/memory checks, exact ten failed3 pins and38-charge nonauthorizing cost lineage, seven finite private totals and3-root cell join. Task2 connected tests preserve those paths rather than replacing them. | PASS planned |

The generic supervisor actor predicate at correction.ts:164 accepts distinct `/root/...` identifiers, so the exact new fixer/reviewer pair is compatible; Task2 still must change the **strict mode4 role assertion**, not merely the generic predicate. Selected request review paths derive from the owned custody document helper, so updating that actual helper and strict consumer closes the destination change without an unowned caller edit. Existing private0600/default consumer and real current-manifest/Git checks remain required after actual v6 issuance. Tests alone cannot issue that receipt.

Wrapper/publication/retained wiring remains the previously checked real path: wrapper adds only strict4 private hostFailureV15; actual correction publication spreads returned non-replay fields into the rooted observation cell; retained audit validates the exact nullable finite metadata and allocation/charge/slot identity. Read-only pipeline cell type derives from wrapper ReturnType. No extra public field, writable sidecar, timing allowance or retained-audit bypass is planned. Only bridge timing source/fallback behavior changes; first failure and cleanup replacement retain the actual returned-object identity.

## Ownership, dependency, verification and scope

Task1 owns five files: bridge/test, wrapper/test and script resource test. Task2 follows Task1 and owns lean-experiment, correction, custody resource-window source and that same script test. The single overlap is explicitly serial; eight unique edits are within the bounded scope. No scanner, source receipt, unrelated baseline fixture or additional caller ownership is implied. ROOT owns isolation/lifecycle/integration/tracking. Fixer writes only scheduled SOURCE-SUMMARY-v2 and its source commits; intermediate reviewer and selected reviewer receipts are separately scheduled, never fixer self-issuance. Review/fix remains bounded to three iterations; new source dependencies require an exact ROOT amendment rather than silent widening.

This is an additive correction amendment to existing checked Plan16, not a fresh standalone phase PLAN. Its two named task contracts specify owned files, concrete actions, RED/GREEN expectations and measurable closure; the original checked plan and SOURCE-SUMMARY-v1 supply the exact existing focused test command families. Scope is not expanded into phase-wide implementation or a new ceremony.

Nyquist is enabled and existing phase VALIDATION.md remains partial/false. Both correction tasks require automated named inert checks; no MISSING/Wave0 dependency or watch-mode suite is introduced. Existing focused command families are bridge/wrapper `-t 'policy cache host attribution'` and script resource-window `-t 'policy cache'`, CLI5000 with768MiB old-space and hard60s command bound. Only the already directed single inert publication case retains its15000ms test override. Task1 additionally requires unmodified factory scanner/configured package no-emit and the explicit strict ten-file graph with `--ignoreConfig`; expected strict outcome is no new diagnostics, with only independently attributable eleven inherited diagnostics, **not** a strict PASS. ROOT source validation must capture actual exact commands/exits/counts; this checker executes none of them.

The current clean intermediate/v5 source review is immutable historical evidence, not proof that the newly identified scanner/type gaps do not exist. ROOT's recorded23969/64417 denial is directly incorporated into the two tasks. Old six production errors, five byte-identical baseline nullable diagnostics, earlier private-fixture/monitor NOTPASS and unavailable historical exits/counts remain uncredited. No deferred formation/holdout/rule/product work is imported. Relevant LEAG prerequisite declarations and D-01/02/05/22/25/27/28 remain original checked scope; no empirical requirement becomes complete.

## Static measurements and accounting check

One bounded read-only Node process compared current source with exact repair-baseb21db143 through Git show. All three policy bodies (old2/successor3/new4) and all six corresponding policy/caps export statements are byte-identical. This is a pre-repair baseline measurement, not a future implementation claim. The amendment requires the same comparison after repair. Strict4 retains original checked policy planRootbc54e7c5, approvalRoot21fae32b, root/caps/body; the boundary-plan/check are additional hashed **source prerequisites**, not replacements for the adopted policy plan/approval or permission to reset an allocation.

Static exact-name accounting is2 functional inputs+6 generated outputs=8 physical paths. Existing mode4 source manifest already consumes the owned precise input/exclusion sets and physical report list; Task2 extends those sets with set semantics, not a new authority mechanism. New outputs are SOURCE-SUMMARY-v2/SOURCE-REVIEW-v2/REVIEW-FIX-v2/VALIDATION-v2/SOURCE-VERIFICATION-v2 and selected RESOURCE-WINDOW-SOURCE-REVIEW-v6. V5 remains excluded functionally and physically charged. Actual mode4 manifest/default saved-v6/private0600 checks are downstream and must use final real source, not old972 or an injected fixture identity.

Saved selected-v5 raw digest remains `sha256:1bc4dfdfa13877878b03e9789bed1e592ace87d3f7175d08fed18a321ceb39e2`. Actual HEAD observed0fa5ae87fa5725173ebe3f674ab86121897c1f50; repair base resolvesb21db1433611b494091a269d13c8f58dc91ba2bf; failed functional comparator resolves763174fdbbadb21982acdfb6f4c9bedd007241cf. No tracked modifications were present before this sole report write.

Original108000000 floor+deadline1791598472000−anchor1791455941097 equals250530903ms. The cap/deadline02:14:32UTC, all source/test/review/wait/cleanup wall,31-minute1860000ms reserve,01:33:32 entry/01:43:32 source cutoffs, RAM3GB/disk15GB/300Matches and guest1000/host5000/startup2500/Match600000 remain unchanged. Neither clock fallback nor test timeout override is a new runtime/resource allowance. All38 historical charges and final970-survivor cost prefix remain; initiating cause isUNKNOWN and faster pure selection cannot establish recovery.

## Structured plan issues

```yaml
issues: []
```

## Handoff and CLOSED boundary

ROOT may schedule only these checked serial source corrections and exact eight-path amendment under the existing continuous budget. Actual implementation, independent review/fix, fresh finalv6, ROOT validation including ONE bounded actual same-object comparative pure probe, and distinct source verification remain required. CR-PC-B01/CR-PC-T01 are not closed by this report. No use of v5 for modified source is permitted; source changes after v6 require a new exact checked amendment, never receipt overwrite.

Only afterward may ROOT establish actual fresh actor/DATA/HELPER/distinction/setup/request/authorization, committed new immutable allocation, empty owned0700store and SAMEPROCESS capacity before charge/provider. Unique entry holds sourceANDHEAD through terminal and ONE appropriate unique verifier. Own accepted4 diagnostic+actualFINAL alone permits conditionalONE36 baseline; old failed cost history/clean review cannot. Ordinal5 remains dormant. No new4 route or source hold exists here; no Phase265/LEAG/baseline/freeze/formation/holdout/public/counting/production credit.

All checker commands are **CLOSED**: bounded file/source/scanner reads/searches, Git identity/status observations, exact plan/v5 digests, bounded policy-body/export/inventory/arithmetic measurement, apply_patch of this report and final digest. No tests, scanner/type gates, application, source-admission/helper, provider, Strategy, Match, capacity, actual allocation/request/authority, reader/authenticator or publisher ran. Only this scheduled new report was written; source, STATE/tracking, old artifacts and commits were untouched. No commit.
