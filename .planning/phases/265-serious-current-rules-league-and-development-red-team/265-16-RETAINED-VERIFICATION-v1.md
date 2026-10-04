---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
scope: actual_unique_current_baseline_retained_check
verified: 2026-10-04T14:22:44Z
actual_verifier_agent: /root/verify_265_baseline_retained
status: gaps_found
process_disposition: retained_valid_partial_failure
score: 4/5 bounded retained obligations verified
behavior_unverified: 0
overrides_applied: 0
held_head: 05d3cb8732906f37e3125be856fb815ed2603f66
source_root: sha256:03e2a09d1a79aff27fb1ecfd6a6f52d307aeb5b7303139b6e7a5b3f58a019781
source_entries: 876
request_raw_sha256: fd136129ea914eb59e73b05596c993ddfb64938e6dd4c623564c7aa198e50d17
allocation_root: sha256:92c856a0e1944fcc429e0c7da2f40851ce8914b66cf8f4e63aa7ba2545aa422f
allocation_raw_sha256: 9726cb9fa5b93c5c46c6c2a835da2c45d8e1fd31f518619cc69ee2ec1d94d894
result_raw_sha256: 5aa36738cda28049b60a294ece81518f8cd74e56e05612d9852092fe3c4298ab
retained_report_root: sha256:ace1f5df26e2d1bd9f4895fe76725b207ea0fdc789dce2dd4f63112e22bc4962
retained_session: 37314
retained_initial_chunk: 691e83
retained_terminal_chunk: ac6c23
retained_exit_code: 0
retained_invocations: 1
current_charged: 1
cumulative_charged: 10
successful_current_cells: 0
unused_current_slots: 35
cumulative_elapsed_ms: 3319046
phase_265_complete: false
freeze_266_authorized: false
gaps:
  - truth: "The actual current-only baseline completes cold training and its allocated comparisons before baseline freeze."
    status: failed
    reason: "The first initial-training cell is a charged system failure; the accepted retained result is partial_or_failed_baseline, complete false, with zero successful cells and 35 unused slots."
    artifacts:
      - path: .strategy-lab/lean-baseline-20261004-v1/result.json
        issue: "Actual pipeline stops at initial_training; no completed trained candidates, comparison matrix, response round or freeze evidence."
      - path: .strategy-lab/lean-baseline-20261004-v1/observation-0.json
        issue: "system_failure / SUPERVISOR_FAILURE; null outcome, trainingHalfPoints and semanticRoot."
    missing:
      - "Successful actual baseline evidence through the remaining allocated stages; this consumed route must not be retried, reused, reconstructed or recredited."
      - "A safe checked GSD failure/closeout disposition; the finite subprocess-signal diagnostic does not establish the underlying cause."
---

# Plan 265-16: Actual retained verification v1

The **one ordinary retained check passed its integrity/process audit**, but the actual baseline **did not complete**. Its honest disposition is `retained_valid_partial_failure`, and the goal verdict is `gaps_found`. This is a narrow actual retained-result report, not the canonical whole-Phase 265 verification, source-only verification, a successful empirical rerun, or authority to proceed to freeze/formation/holdout.

## Contract and bounded method

Read the verifier's mandatory references, gate/override guidance, project skill-discovery and calibration guidance, AGENTS.md, the current STATE frontier, SOURCE-VERIFICATION-v1, SOURCE-REVIEW-v2 and REQUEST-REVIEW-v1 including its corrections. No project-local skill directory was found. The conversational UAT workflow is not invoked: this assignment is exactly one actual ordinary retained reader, not interactive feature UAT. No accepted override applies.

The request review's early wrong-path absence observation is **not** treated as actual-store absence. Its later prepared-state check concerns the configured `.strategy-lab/lean-baseline-20261004-v1`. My current precheck independently observed actual entry, child-terminal and result files in that store, with the exact real held HEAD and request/allocation joins. No fabricated result/head, reconstructed terminal or old consumed reader was used.

Actual command, invoked **once**:

```text
sh scripts/run-v1-38-lean-baseline.sh verify-retained --request .strategy-lab/lean-baseline-request-20261004-v1.json
```

The invocation yielded actual session `37314`, initial chunk `691e83`; polling that same session returned terminal chunk `ac6c23`, exit `0`, and the rooted report above. No reinvocation, retry, old-v6/v7 reader, provider, Match, preparation, capacity-admission helper, test suite or heavy competing work was executed. Only this safe report is authored; no commit is made during the held-source/HEAD interval.

## Goal-backward retained obligations

| # | Observable truth | Status | Actual evidence |
|---|---|---|---|
| 1 | The unique check audits the real consumed current route against fixed committed source/HEAD/request/allocation, not source cleanliness alone. | VERIFIED | The ordinary reader returned exit 0 against the real result, held HEAD and 876-entry source root; loader checks committed plan/review/allocation, request and tracked unchanged source. Pre/post metadata joins match. |
| 2 | Failed actual execution remains charged, with no successful outcome/training/repeat credit or subsequent dispatch. | VERIFIED | Reader reports cumulative charged 10/current charged 1/successful 0/complete false. The one actual compact cell is system_failure, SUPERVISOR_FAILURE, cleanupComplete true, outcome null; observation has trainingHalfPoints null and semanticRoot null. Only ordinal 0 pair/observation exists. |
| 3 | The verifier is invoked once, charges one bounded interval, closes it and preserves all consumed bytes apart from that authorized append. | VERIFIED | Actual time journal contains one baseline-retained-verifier start/close, 2,510 ms, no open interval. All 19 other store files retain exact raw hashes and lengths; inventory remains unchanged. HEAD, request and canonical allocation match before/after. |
| 4 | Resource/history, incomplete measurement and privacy boundaries remain explicit, without formation/holdout/promotion claims. | VERIFIED | Actual rooted report retains 10 charges, 3,319,046 ms, physical 1,507,794,944 B, scratch high-water 1,506,455,552 B, one measured failed cell, missing metrics and inconclusive formationComparison; holdoutOpened false and formationMaterialized false. No private source/memory/objective/IO/error payload is published. |
| 5 | The actual current-only baseline completes cold training and allocated comparisons before baseline freeze. | FAILED — BLOCKER | Actual result and audit say partial_or_failed_baseline/complete false, initial_training, 1 charged/0 successful current cells. The remaining 35 slots and downstream stages have no actual completion evidence. |

**Score: 4/5 for these scoped obligations, not a Phase 265 or LEAG score.** The successful integrity reader verifies an honestly failed partial; it does not convert that partial into successful baseline evidence.

## Actual closure and roots

Root handed off the unique producer session `77660` as closed exit 0. My independent actual entry/terminal inspection binds parent PID `32979` and child PID `33010`; the real terminal says `child_exited`, exit 0, signal null, upper elapsed 10,930 ms. A bounded `ps` check found neither PID present. Producer exit 0 means it published its partial, not that the Match succeeded.

| Artifact/report | Raw or semantic root | Preservation/result |
|---|---|---|
| Canonical and private allocation | raw `9726cb9fa5b93c5c46c6c2a835da2c45d8e1fd31f518619cc69ee2ec1d94d894` | Both match; unchanged |
| Actual result, 4,961 B | raw `5aa36738cda28049b60a294ece81518f8cd74e56e05612d9852092fe3c4298ab` | Unchanged |
| Actual entry, 551 B | raw `e55cc0ef48cfbe96d067f24ef4cde1128b15b94d5fb140e47f1bd4b251f14336` | Unchanged |
| Actual child terminal, 657 B | raw `2ea7d61e9c16678ebab08995c82561ff7cc11b3c5e035786c27c3574c7a2d270` | Unchanged |
| Actual charge ledger, 1,500 B | raw `fdee81b0656bc0def9c814daa9193ec3bb3a6ff33c4f177dcd9ef7ce7f0ec2bb` | Unchanged |
| Evidence | `sha256:018cc4cb4ae28e5ad6d162b6b3171cc783fefbafba62e16b70e1f3350df338eb` | Producer and independent reader agree |
| Pipeline | `sha256:7c8780a132768364185743616b9cfe97cf317fc3beb8f27b3efe1b920b680f2e` | Partial initial_training; reader agrees |
| Independent retained report | `sha256:ace1f5df26e2d1bd9f4895fe76725b207ea0fdc789dce2dd4f63112e22bc4962` | Actual stdout, exit 0; not fabricated or rewritten into result |
| Time journal | pre raw `474884a919d428fb443dd5676ec1022ca89dc2155c5ad433984de465688885bf`; post raw `0f134b9e57245bfa2e3f169170fa2f404a3b99436a790d40e667838d7ac0bd85` | Authorized append only; 114 → 258 B |

Time rows: `pilot-entry` start `1791123503705`, close `1791123514635`; `baseline-retained-verifier` start `1791123720092`, close `1791123722602`. The baseline entry retains the runner's `pilot-entry` label; this is not a reopened old pilot. Cumulative elapsed is the prior 3,305,606 ms plus 10,930 ms actual entry terminal bound plus 2,510 ms unique verifier = **3,319,046 ms**. The producer's earlier 3,315,748 ms result remains unchanged; it is not the final reader-inclusive debit.

## Bounded failure metadata and disposition

The actual compact cell reports elapsed 5,083 ms, invocationCount 1, zero events/transitions, `system_failure`, `SUPERVISOR_FAILURE`, cleanup complete, null outcome. The independently authenticated bounded diagnostic sidecar exposes only finite allowlisted fields: `SUBPROCESS_SIGNAL`, stage `native_response`, method `selectActivations`, reason `executor`, ordinal 0. This narrows the recorded failure class; it does **not** establish the signal identity, private error text, underlying root cause, insufficient-memory conclusion, or Strategy-strength conclusion. Nothing was retried to obtain additional detail.

The carry remains nine prior charges plus one new failed baseline charge = ten cumulative charges. Zero successful **current baseline** cells does not erase or reclassify prior pilot evidence. The 35 unused slots are unexecuted, not a refund, replacement authority or evidence of completion. Historical peak disk/RSS uncertainty remains explicit. All shared ceilings remain unchanged: 15,000,000,000 B / 28,800,000 ms / 300 Matches, guest 1,000 ms, host 5,000 ms, Match 600,000 ms. Existing rules and public privacy remain unchanged.

Missing metrics remain missing: no half-point outcome/terminal length/cycles/contractions, active survival, enemy awareness/contact/decisive events, forced evacuation/reserves, advance/STONE/push/block causes, opening cluster/entropy or behavior classification is claimed from this failed cell. Formation comparison stays inconclusive. Sources and cold proposals existing privately are not completed training or a frozen finalist population.

No later-phase deferral can satisfy the failed current-baseline prerequisite for freeze. No new empirical LEAG requirement, Phase 265 completion, Phase 266 freeze, formation, private-holdout opening, public/counted gameplay or production promotion receives credit. This is an observed failure, not an uncertain visual/UAT result; no human testing of the consumed route is requested. Safe checked GSD failure/closeout may continue after root releases the hold following this real producer closure and unique verifier closure. This reader is spent and must never be repeated; all consumed history remains immutable.

_Verifier: `/root/verify_265_baseline_retained`; actual unique retained check, no commit._
