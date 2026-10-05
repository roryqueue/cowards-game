---
phase: 265-16-fresh-reader
reviewed: 2026-10-05T18:57:31Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-baseline-authority.test.ts
  - scripts/lib/v1-38-lean-baseline-source.test.ts
  - scripts/lib/v1-38-lean-baseline-source.ts
  - scripts/lib/v1-38-lean-correction-retained.test.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-fresh-reader.test.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
source_root: sha256:be60e2152dd30f5966f1afe7724807705e688c4a48f74fcbded1e04296ebdb69
source_commit: a064a324e6402d42c7f35dfbf4a79566e99fb046
independently_reviewed: true
author_agent: /root/execute_265_fresh_reader_v4
reviewer_agent: /root/review_265_saved_diagnostic
---

# Phase 265-16: Fresh Reader Source Review

**Reviewed:** 2026-10-05
**Depth:** standard, targeted to RED `5ef0c3d3` → GREEN `2a8574ec` and comparator repair `a064a324`
**Status:** issues_found

## Summary

Reviewed the additive v4 selectors, consumers, carry pins, predecessor accounting, and retained-audit path against `FRESH-READER-RESEARCH-PLAN-v1.md` and `FRESH-READER-SOURCE-SUMMARY-v1.md`. The old v1/v2/v3 selectors and paths remain separately versioned. The byte comparator repair correctly compares the retained bytes directly. One blocker prevents a successful v4 diagnostic from being accepted, so a v4 baseline cannot become eligible. The source summary reports 90 passed and 11 skipped synthetic/source tests; this review did not run tests or access private saved data, and those skipped cases do not establish a complete cold-data audit.

## Critical Issues

### CR-01: V4 accepted-check gate expects the pre-v4 cumulative charge total

**File:** `scripts/lib/v1-38-lean-correction-retained.ts:294`
**Issue:** The v4 carry pins the consumed v3 ledger at 12 charged matches (`scripts/run-v1-38-lean-correction.ts:361-380`). A new v4 one-cell diagnostic adds one more charge. `readLeanLedger` computes the cumulative total as the current ledger's charge count plus `allocation.predecessor.chargedMatches` (`packages/strategy-lab/src/league/lean-experiment.ts:1232,1249-1250`), so the expected total after that cell is 13. The shared v3/v4 accepted-check authenticator still requires `state.charged === 12` while also requiring one current charge (`scripts/lib/v1-38-lean-correction-retained.ts:294`). Consequently it rejects the valid v4 diagnostic after its full check, and `inspectLeanRepairedReaderPredecessor(..., "baseline")` cannot authenticate it; the conditional baseline is unreachable even if the v4 cell and audit succeed.
**Fix:** Make the cumulative expected charge count version-specific: retain 12 for v3 and require 13 for v4, while keeping `state.charges.size === 1`. Add a source-only regression proving both versions' exact cumulative totals and that only a valid v4 check authorizes the v4 baseline.

## Review Boundaries

- The reviewed v4 source manifest root is `sha256:be60e2152dd30f5966f1afe7724807705e688c4a48f74fcbded1e04296ebdb69`.
- The review traced the v4 raw carry pins, closed 14,939,187 ms / 12-charge predecessor, 20,471,046 ms setup carry, fixed v4 route identities, request/allocation/retained consumers, and spent historical reader boundary. No old reader or private evidence was executed or opened.
- No provider, Match, empirical/private-data reader, or full audit was run. Reported source-test counts are executor-provided context, not independently reproduced verification.

---

_Reviewer: /root/review_265_saved_diagnostic_
_Depth: standard_
