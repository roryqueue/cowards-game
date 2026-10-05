---
phase: 265-16-fresh-reader
reviewed: 2026-10-05T19:22:06Z
files_reviewed: 4
files_reviewed_list:
  - .strategy-lab/lean-correction-supervisor-baseline-20261005-v4-tmp/draft-request.json
  - .strategy-lab/lean-correction-supervisor-diagnostic-20261005-v4/correction-supervisor-diagnostic-check-v4.json
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-FRESH-READER-APPROVAL-20261005.md
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-FRESH-READER-SOURCE-REVIEW-v2.md
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
source_root: sha256:cf9096c68ff0954ed83334f635cf8ac944d4d4bf0b4af3b602f93ebe65ff9bca
source_commit: 31e0e379f53664a00a6464a08c75bf83983aecc6
request_root: sha256:5169617e05610fbd780a0b326638ac4ed7a43702f3d8eae9de63486e10cffcf4
independently_reviewed: true
author_agent: /root
reviewer_agent: /root/review_265_saved_diagnostic
---

# Phase 265-16: V4 Conditional Baseline Data Review

**Reviewed:** 2026-10-05
**Status:** clean; draft metadata only

## Summary

The fixed baseline draft binds to source root `sha256:cf9096c68ff0954ed83334f635cf8ac944d4d4bf0b4af3b602f93ebe65ff9bca`, the approved v4 decision and plan, and the unchanged cold root and seed. Its candidate roots match the exact two approved candidates and its request-root vector matches the 36 derived baseline requests. It uses `diagnosis: null` and carries the approved v4 setup witness root.

The draft's `acceptedCheckRoot` is exactly `sha256:a323f13fa38805942202d79814c8bd5c3167eb98ab38f35d0e126120eaf4085e`, the semantic root of the existing v4 diagnostic check. I read only that check's metadata and verified its canonical/self-rooted form, v4 diagnostic schema/route, `accepted: true`, and matching allocation. The v3 check is not referenced. The recomputed baseline request-data root is `sha256:5169617e05610fbd780a0b326638ac4ed7a43702f3d8eae9de63486e10cffcf4` (excluding only the designated data-review path/root fields).

This review binds the draft to the accepted diagnostic check; it does not authorize baseline preparation/run or certify that a full baseline can complete. The 36 × 600,000 ms figure is a worst-case sum of per-Match caps, not a minimum runtime. Actual prepare/run admission and live capacity guards remain authoritative; no resource decision is made here.

## Bound Roots

- Baseline request-data root: `sha256:5169617e05610fbd780a0b326638ac4ed7a43702f3d8eae9de63486e10cffcf4`.
- Draft request raw-byte root: `sha256:903823c6d1fc99435d35554a2cc06142d83188e0051da10b941df9f2e1155322`.
- Accepted diagnostic check root: `sha256:a323f13fa38805942202d79814c8bd5c3167eb98ab38f35d0e126120eaf4085e`.
- Approved decision raw root: `sha256:cff75d71020cbe224ab17e8a352fb518eec039ab8efa89fd695dfabf58ba93f9`.
- Setup witness root: `sha256:81c9f3bffc513166a82bfd4684611993cd5e77b47557cabacf24e6ed3cbf52a6`.

No author helper, preparation, baseline run/check, provider, Match, ordinary reader, or private cold artifact was invoked or accessed.

---

_Reviewer: /root/review_265_saved_diagnostic_
