---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
reviewed: 2026-10-06T01:12:48Z
depth: standard
diff_base: 3044e7ff
source_commit: 03ed458a9466b780d751dae0ed4e168b797bf529
author_agent: replay-v6-source-executor
reviewer_agent: review_265_replay_v6
independently_reviewed: true
files_reviewed: 9
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-baseline-source.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/run-v1-38-lean-replay-validation-v6.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
execution_authorized: source_only
empirical_credit: false
phase_complete: false
---

# Plan 265-16: fixed v6 source re-review

## Narrative Findings (AI reviewer)

No open material findings in the original v6 source-review scope. CR-01 is closed by the bounded fix at `03ed458a`; the v1 report remains unchanged as history.

## CR-01 resolution

`scripts/run-v1-38-lean-correction.ts:494-505` now admits exactly one segment, requires its exact keys, fixes its start to `1791247033529`, and requires `closeMs === null`. Additional segments, closed first segments and the v1 counterexample cannot pass the production validator, even with a recomputed witness root. Carry is now computed directly as `36,151,532 + accountingAtMs - 1791247033529`; no segment summation or caller-selected idle gap remains. The original request/setup/predecessor consumers continue to call this validator and carry function, so the correction reaches actual admission rather than only a fixture.

`scripts/run-v1-38-lean-replay-validation-v6.test.ts:291-302` adds explicit rejection cases for the one-hour gap, near-cap erasure, an extra open segment and a closed sole segment. It also asserts exactly `43,199,999` ms is accepted and `43,200,000` ms is refused. The assertions were inspected, not executed during this re-review.

The fix delta contains only those two files. The other seven files in the original review scope are byte-unchanged from `b992a2bc`, so their prior admission, capability, publication, retained-reader, broker-label and finite-predecessor analysis carries forward. No v1–v5 branch, caps, policy, sealed harness, replay/inflate/audit mechanism or runtime budget is changed by this fix. No new material defect was identified in the fix or its joins.

## Scope and authority

This is static source re-review under the code-review skill, against the original approved v6 plan/PLAN-CHECK-v2/approval context and the preserved v1 review. It is not validation or independent source verification. No tests, helper, subprocess runtime, provider, Strategy, Match, allocation preparation, historical/empirical reader, payload/gzip inspection or empirical command was invoked. Only static file/git inspection and this new report write were performed; no source edits or commits.

The previously reported 148 synthetic passes are not native proof. Full-buffer inflation remains, and neither RSS feasibility nor a complete 36-Match baseline within the carried remainder is established.

**Gate outcome:** independent source review is clean for fixed commit `03ed458a9466b780d751dae0ed4e168b797bf529`. MAIN must next validate that fixed source and then obtain independent source verification, in order, before new data/helper/allocation/entry. This result grants no empirical authority, Phase 265 completion, LEAG credit, freeze, formation, holdout, public, counted or production authority.
