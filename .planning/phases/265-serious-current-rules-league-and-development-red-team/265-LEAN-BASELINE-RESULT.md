---
phase: 265
plan: "16"
status: partial_or_failed_baseline
process_disposition: retained_valid_partial_failure
requirements_complete: false
freeze_admitted: false
formation_materialized: false
holdout_opened: false
current_charged_matches: 1
current_successful_matches: 0
current_unused_slots: 35
cumulative_charged_matches: 10
cumulative_elapsed_ms: 3319046
---

# Current baseline: first-cell system failure, no competitive conclusions

The private, current-rules baseline stopped during initial training. One supervised Match was charged, and it returned a system failure with complete cleanup. No training population, payoff matrix, response, development probe, repeat or finalist was completed. The remaining 35 pre-holdout slots were not run. This is an honest failed partial, not a strategic loss, missing-data imputation or successful baseline.

## Actual execution and independent verification

The new allocation was committed and pushed in `05d3cb8732906f37e3125be856fb815ed2603f66` before unique MAIN entry `77660` (parent32979/child33010). The entry closed exit0 after publishing its partial; exit0 is publication success, not Match success. Exactly one ordinary retained verifier, `/root/verify_265_baseline_retained`, invoked session37314 and closed exit0. Its scoped report is [265-16-RETAINED-VERIFICATION-v1.md](265-16-RETAINED-VERIFICATION-v1.md), status `gaps_found`, with four of five bounded integrity/accounting obligations verified and the baseline-completion obligation failed. It must not be invoked again.

| Identity | Bound value |
|---|---|
| Fixed source | sha256:03e2a09d1a79aff27fb1ecfd6a6f52d307aeb5b7303139b6e7a5b3f58a019781,876entries |
| Request raw root | sha256:fd136129ea914eb59e73b05596c993ddfb64938e6dd4c623564c7aa198e50d17 |
| Allocation root | sha256:92c856a0e1944fcc429e0c7da2f40851ce8914b66cf8f4e63aa7ba2545aa422f |
| Canonical/private allocation raw root | sha256:9726cb9fa5b93c5c46c6c2a835da2c45d8e1fd31f518619cc69ee2ec1d94d894 |
| Actual result raw root | sha256:5aa36738cda28049b60a294ece81518f8cd74e56e05612d9852092fe3c4298ab |
| Evidence root | sha256:018cc4cb4ae28e5ad6d162b6b3171cc783fefbafba62e16b70e1f3350df338eb |
| Partial pipeline root | sha256:7c8780a132768364185743616b9cfe97cf317fc3beb8f27b3efe1b920b680f2e |
| Actual independent report root | sha256:ace1f5df26e2d1bd9f4895fe76725b207ea0fdc789dce2dd4f63112e22bc4962 |

Source/HEAD remained held through actual producer closure and unique verification, then released. Consumed allocation, request, result, entry, terminal and charge bytes stayed unchanged; the only permitted store change was the verifier's time-journal append. No historical reader was repeated.

## Counters and limits

- Current: one charged system-failed cell, zero successes,35unused pre-holdout slots; four current holdout slots remain reserved/unopened, not replacement authority.
- Cumulative: ten charges (nine prior plus one failed current),3,319,046ms. The reader-inclusive debit is3,305,606prior +10,930entry +2,510verification. The earlier result's3,315,748ms remains immutable rather than being rewritten.
- Actual observed physical high-water1,507,794,944B and scratch1,506,455,552B. Historical peak disk/RSS uncertainty stays explicitly unknown; no claimed historical bound is inferred from these newer observations.
- Shared ceilings remain15,000,000,000B,28,800,000ms and300Matches. Guest1000ms,host5000ms,Match600000ms; canonical rules, runtime isolation and privacy unchanged.

Finite retained metadata records `SUBPROCESS_SIGNAL`, `native_response`, `selectActivations`, `executor`, ordinal0; the compact cell is `SUPERVISOR_FAILURE`, elapsed5083ms, invocationCount1, zero transitions/events, cleanuptrue and outcome null. The underlying cause and signal identity are not established by this finite receipt. Neither Strategy blame nor memory exhaustion is inferred. Source-only debugging may repair a demonstrated defect; it cannot turn this failed result into a success.

## Scientific and downstream disposition

There are no current competitive scores, accepted trained candidates, complete matrices or response/probe gaps to compare. All behavioral metrics are missing for this failed cell. No robust-pure claim, exact exploitability, balance conclusion or formation comparison is supported. The successful eight-cell pilot remains feasibility-only historical evidence, not a substitute training result.

LEAG-01…05/07 remain incomplete; LEAG-06/08 original certification remains deferred and LEAG-09 remains superseded by the approved single automated round. No empirical requirement is made green by source fixtures or the integrity reader. Phase265 is incomplete. Phase266freeze and Phases267–269 formation/retraining/holdout are not admitted. No public, counted, production, canonical experimental evidence, release archive or success tag is authorized.

The consumed route is closed and immutable. The active fixed-schedule contract says a failure consumes its slot and no replacement Match is scheduled. Source-only diagnosis, repair/review/tests and truthful dependency/audit reporting may continue; another empirical block requires an applicable prospective amendment, not reuse of this allocation or a second reader.
