---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
status: blocked
independently_reviewed: true
author_agent: /root
reviewer_agent: /root/review_265_replay_v6_data
source_commit: 03ed458a9466b780d751dae0ed4e168b797bf529
source_root: sha256:67263fe477e884ffabb74c09f562d0091e2a86ec8ae29cf7c812ed64d31430aa
request_root: sha256:59d8a9387a34c5decffd8fe6c8ca407b260df3d542dc9529093c90fb9dce7b4c
reviewed: 2026-10-06T01:25:00Z
scope: fresh_v6_baseline_data_and_helper_static_metadata_only
execution_authorized: false
empirical_credit: false
phase_complete: false
---

# v6 baseline data/helper independent review — superseded blocked copy

This preserves the original blocked review before the permitted finite accounting clarification. Its elapsed mismatch was based on comparing the retained-check snapshot (`cumulativeElapsedMs: 39550947`, captured before final reader-close accounting) to the expected closed interval. It did not yet inspect the current ledger's effective closed interval. See `NEW265-16-REPLAY-V6-BASELINE-DATA-REVIEW-v1.md` for the reconciled result.

The request-data root independently matched `sha256:59d8a9387a34c5decffd8fe6c8ca407b260df3d542dc9529093c90fb9dce7b4c`. The draft binds route `baseline`, 36 request roots, two candidate roots, accepted diagnostic check root `sha256:cb94964c93bc0ae154d56b0c9f1c00f49a8d1af3efa7cef4b5a2e09523251c12`, and fixed source/plan/decision/setup/reuse identities. Review and authorization placeholders are excluded from the request-data root and do not grant authority. No execution or allocation preparation was authorized.

Original discrepancy: the check snapshot's `39550947` was 229 ms below the stipulated final `39551176`; direct open-interval arithmetic from `36151532 + (1791250433172 - 1791247033529)` yields `39551175`, one millisecond below the stipulated value. This was initially treated as unresolved pending the actual closed ledger accounting.
