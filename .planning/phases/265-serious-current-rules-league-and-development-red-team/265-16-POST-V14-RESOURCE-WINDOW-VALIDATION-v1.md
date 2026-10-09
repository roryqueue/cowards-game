---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: post-v14-resource-window-v1
status: partial
nyquist_compliant: false
wave_0_complete: true
validated: 2026-10-09T16:32:33Z
validation_scope: resource_window_source_tasks_1_and_2_only
source_commit: 7250223f67620ccc274a3a2fc80d099718ea58ea
source_root: sha256:2d499dc06ae7a95b12c11c4d96a0ce8f0033e20fcaaf8a484b5279c86215059e
source_entries: 950
empirical_credit: none
---

# Resource-window scoped validation

MAIN independently reran the checked supplement's source checks after the actual executor, reviewer, and two isolated fix turns closed. This uses the GSD validation mapping for the completed source tasks, not a completed Phase265 audit. Existing phase-wide validation, REQUIREMENTS, ROADMAP and historical reports remain unchanged. The original Plan16 empirical task3 is unexecuted; full-phase Nyquist compliance is deliberately false.

## Infrastructure and actual receipts

| Check | Actual result |
|---|---|
| `node_modules/.bin/vitest run packages/strategy-lab/src/league/lean-resource-window-v15.test.ts scripts/run-v1-38-lean-resource-window-v15.test.ts --testTimeout 30000` | Exit0; two files,22 tests passed;12.18s wall; no skipped cases. Explicit test-runner timeout does not change runtime/Match bounds. |
| `node_modules/.bin/tsc -p packages/strategy-lab/tsconfig.json --noEmit --composite false --incremental false` | Exit0. |
| Strict no-emit host graph, NodeNext/ES2022/Node types/768MiB old-space, correction/retained/baseline/experiment/new module/new host test/Match helper | Exit2; exactly six inherited diagnostics in feasibility-protocol.ts:52 and planner/missions.ts:52,60,66,68,69. No changed-file diagnostics. NOT strict PASS. |
| `sh -n scripts/run-v1-38-lean-correction.sh` | Exit0. |
| `git diff --check` | Exit0. |
| `node --max-old-space-size=768 --import tsx scripts/check-v1-38-factory-boundaries.ts` | Exit0;1432 files scanned;zero violations. |
| Actual `authenticateLeanCorrectionReview` on exact fresh SOURCE-REVIEW-v2 bytes, selected v15-2/rooted policy | Exit0;sourceReviewConsumer PASS;actual950-entry source root matched. This authenticates a source review only, not a request, allocation or empirical result. |

The configured Nyquist hook is active. Existing Vitest infrastructure is sufficient for these source regressions; no installs or new dependencies occurred. The two isolated fix checkouts, their merged temporary branches and their dedicated recovery sentinels were removed only after actual clean closure and fast-forward; commits and reports survive on MAIN. Historical sentinels and consumed records were not removed.

## Per-task verification map

| Scope | Linked requirements | Automated coverage | Disposition |
|---|---|---|---|
| Task1 policy/modes/window | LEAG-01/02 prerequisite | Exact rooted policy, only ordinals2..5, original all-wall anchor/cap/reserve, allocation mutation rejection, unchanged legacy/disk caps | Source boundary covered; empirical requirements not credited. |
| Task1 predecessor/own FINAL contract | LEAG-01/02 prerequisite | Missing/forged metadata and own-FINAL refuse; finite actual historical metadata pins defined; dormant later modes refuse | Partial: complete authentic fresh positive route joins not yet exercised. |
| Task2 guards/accounting | LEAG-01/02/05 prerequisite | Exact/+1 RAM and disk, measured resource journal/forgery, actual prefix/child/reader callbacks, finite report blocks/growth/shrink/missing cases | Covered source cases; actual native RAM recovery and child sampling remain unproved. |
| Task2 compaction/reason producer | LEAG-01/02 prerequisite | Actual shared compaction receives authenticated allocation/live projection; actual parent producer feeds unchanged strict reason-custody validator; mismatched joins and legacy cases reject | Source regressions covered; full actual Match/ordinary accepted-result path unproved. |
| Task2 ROOT/dispatcher/gate frontier | LEAG-03/04/07 prerequisite only | All finite shell modes with inert loader; actual dispatcher refuses absent custody without writes; actual independent source-review consumer passes; author/reviewer negatives | Partial: real request/data/helper/policy attestation/allocation/capacity/entry remain ROOT task3. |
| ROOT task3 diagnostic/conditional36 baseline | Original Plan16 empirical goal | No actual fresh helper, request, allocation, entry, Match or retained-result verifier yet | Unexecuted; no league, baseline, freeze or downstream completion. |

## Test quality and limitations

The22 active tests use explicit values, exact bounds, actual called producer/consumer helpers and filesystem measurements. Synthetic custody is labeled NON-AUTHORIZING and is never published as production evidence. The prefix/result-negative fixtures do not prove an authentic successful full result. Temporary inert filesystem fixtures and a fake shell loader are test inputs, not accepted runtime records. Searches found no disabled/todo cases in the two scoped files. No circular expected experiment result or fabricated successful FINAL was used.

Independent review-v2 is clean within ten source files, closing CR-01/02/03. It does not erase the inherited strict-six, private-fixture-four ENOENT, or serious-monitor-five node:util limitations. The latter two previously established failures were not repeatedly rerun; they remain NOT PASS, not silently skipped into a global green verdict. The applicable factory boundary scanner passes on current source, without claiming every historical monitor passes.

Positive fresh full custody, actual child disconnect/cleanup/sampling, native provider recovery, accepted own diagnostic FINAL, and complete36-cell baseline remain explicit empirical gaps. These belong to the already approved ROOT-only task3 frontier, not an invented manual user action or a new numbered plan. No source-only test grants empirical admission or Phase265 verification. No UI changed; UI phase/review and browser replay steps are inapplicable to this resource-only supplement. Engine rules, formation and public replay semantics were not changed.

## Sign-off and next gate

Scoped source checks have repeatable automated coverage with the limitations above. Separate independent SOURCE-VERIFICATION-v1 must assess the checked source goal before ROOT authors any actual route data/helper. Any discovered source gap is repaired and rechecked without weakening frozen policy. No human-only decision is currently introduced by these source checks.

The exact replacement deadline remains2026-10-09T18:38:33Z, cumulative223171903ms/FULL108M+every wall millisecond since1791455941097, with1860000ms terminal reserve. All36 historical charges and surviving files carry; RAM3GB is not a disk increase. Later modes remain dormant until a concrete independently checked distinction exists. Current-rules serious league/evaluation/freeze precedes formation; holdout unopened; no public/counted/production or empirical credit.
