---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
status: clean
independently_reviewed: true
author_agent: /root
reviewer_agent: /root/review_265_replay_v6_data
source_commit: 03ed458a9466b780d751dae0ed4e168b797bf529
source_root: sha256:67263fe477e884ffabb74c09f562d0091e2a86ec8ae29cf7c812ed64d31430aa
request_root: sha256:59d8a9387a34c5decffd8fe6c8ca407b260df3d542dc9529093c90fb9dce7b4c
reviewed: 2026-10-06T01:41:46Z
scope: fresh_v6_baseline_data_and_helper_static_metadata_only
execution_authorized: false
empirical_credit: false
phase_complete: false
---

# v6 baseline data/helper independent review

**Disposition: CLEAN for the narrowly scoped baseline data/helper gate.** This does not approve execution or allocation preparation.

Independently inspected the baseline `draft-request.json`, baseline author wrapper, baseline-only `main-entry.sh`, setup witness, diagnostic retained-check metadata, and source's static v6 request/carry contracts. To resolve the apparent elapsed discrepancy, used only `openLeanLedger` and `readLeanTimeAccounting` on the current v6 diagnostic ledger; no authentication helper or empirical reader was invoked. No tests, cold reuse, empirical payload, provider, Strategy, Match, allocation preparation, source edits, or commits were used.

The baseline request-data root independently recomputes to `sha256:59d8a9387a34c5decffd8fe6c8ca407b260df3d542dc9529093c90fb9dce7b4c`. It binds route `baseline`, exactly 36 request roots and the two candidate roots, the accepted diagnostic check root `sha256:cb94964c93bc0ae154d56b0c9f1c00f49a8d1af3efa7cef4b5a2e09523251c12`, and the fixed source/plan/decision/setup/reuse identities. Placeholder review and authorization roots are excluded by the v6 request-data-root contract and do not grant authority; the canonical baseline request is not present.

The initial concern is reconciled: the retained check's `cumulativeElapsedMs: 39550947` is a pre-close snapshot and is not the baseline carry authority. The permitted current-ledger accounting reports `elapsedMs = closedElapsedMs = 39551176`, `active: false`, and final interval `correction-supervisor-diagnostic-v6-reader-close` from `1791250432991` through `1791250433172`. Source inspection confirms `authenticateLeanSupervisorDiagnosticCheck("v6")` returns current `readLeanTimeAccounting(...).elapsedMs` and the `...reader-close` close timestamp, rather than the check snapshot field; `inspectLeanReplayPredecessorV6` carries `accepted.closedElapsedMs + accountingAtMs - accepted.readerCloseMs`. The final reader-close interval and all preceding current-turn intervals are therefore included, with no reset. The setup's basic one-open wall formula yields `39551175`; the one-millisecond difference is the previously verified conservative effective close accounting, yielding `39551176`, not an undercharge. The check's 229-ms-shorter snapshot is expected before that final accounting closure and source bounds it to no greater than current effective time. The blocked predecessor copy records the initial interpretation and is superseded after this narrowly authorized accounting read.

The baseline author wrapper explicitly imports the common author with baseline mode supplied by argv; its draft uses the checked accepted diagnostic root rather than a null/placeholder. The new entry wrapper only allows the three baseline-v6 CLI commands and selects the baseline-specific temp directory; it does not implicitly run or prepare a command. Static roots: wrapper `sha256:87f9035ef086b7981da5867775d11553b07c02ed3357bba0cc8adb187c5c43ec`, entry `sha256:9d79ae63e5531bf31f22af8ef0eff04fec24cc9fe8af220c832bf1eb964129f6`, draft bytes `sha256:c9df7a36111e53844303dda1ec60a83e095869a09e53d9fa389f4debf73100db`.

The one-open setup carry records 24 spent predecessor charges and `36,151,532 ms`; diagnostic retained metadata reports 25 cumulative charges including its one successful private Match. The baseline draft preserves the accepted diagnostic check root, candidate roots and immutable predecessor identities; it does not regenerate or refund prior costs. The full envelope remains 12h / 15 GB / 300 Matches with previously approved per-Match and startup limits. The canonical baseline request remains absent and this report itself grants no execution authority; MAIN must still use the exact report-bound finalize gate and the separate allocation/capacity/entry gates.
