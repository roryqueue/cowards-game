---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16-supplement-v10-1
reviewed: 2026-10-07T14:21:34Z
depth: standard
status: issues_found
independently_reviewed: true
reviewer_agent: /root/review_265_twenty_six
source_commit: c65bceb199bc62a95bc8de9f3f8608deddfe7863
checkout_head: 836a651eed0dfcfc517fd781561f8ec7977619d9
diff_base: 66a8abf8eb9a6f078f7e4d3edad0945688e25d55
source_root: sha256:d807e34ec5b946f02b95a11ba13ba9cfd743a7ec87a330a9e37264e08847efd4
source_entries: 905
extension_root: sha256:c3ca30760a9bd04c988bebdb804990dde33b16dd0c3d0972efbe4f69544d14f1
files_reviewed: 5
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/lib/v1-38-lean-remaining-budget.test.ts
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
empirical_admission: false
---

# Phase 265 Plan 16: Twenty-six-hour source review

## Summary

Source-only adversarial review of the five-file diff `66a8abf8..c65bceb1`, with connected baseline-retained and admission/accounting context. Approval, checked PLAN-v1, PLAN-CHECK-v2 and SOURCE-SUMMARY-v1 were read. No project-local skill directories were found. No source files were changed, no commits were made, and no preparation, allocation, entry, provider, Match or empirical reader was invoked.

The inert source-manifest computation directly confirmed the 905-entry functional root and extension root above. HEAD differs from the reviewed source commit only by the source-summary report. The executor's 158-test/type/shell results are reported context, not independently rerun results and not evidence that the defects below are absent.

Disposition: **not clean; source gate remains open**. This review grants no empirical or Phase 265 completion authority.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: BLOCKER — Required post-preparation reports invalidate the prepared allocation

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:783-797`

**Connected locations:** `scripts/run-v1-38-lean-correction.ts:1170`; `packages/strategy-lab/src/league/lean-experiment.ts:915-918`.

**Issue:** The new predecessor adds every currently existing allowed report to `survivors`, and includes every report's raw byte root in `historyRoot`. Preparation freezes that predecessor into the allocation. Run then recomputes it at the original prepare-start timestamp and demands exact equality.

The approved Task 3 sequence explicitly requires: prepare the canonical allocation, then write `...-ALLOCATION-v1.json` and `...-PREPARATION-v1.md`, then commit and enter. Both new reports are in the dynamic allowlist. Writing either after preparation adds a survivor and changes `historyRoot`, so the mandatory run comparison throws `PREDECESSOR_DRIFT` before child dispatch. Updating the physical report inventory likewise changes its byte root even if its allocated block count stays unchanged. The same defect applies to the conditional baseline's own allocation/preparation reports.

This is a deterministic incompatibility between the implementation and the approved normal sequence, not a hypothetical concurrent edit. The new source tests validate report enumeration/debits but do not exercise prepare-snapshot → required report publication → run validation.

**Fix:** Keep the allocation's historical/report snapshot immutable, and explicitly account for subsequent exact allowlisted administrative publications outside that snapshot. At run, authenticate the original rows/byte roots without recomputing the historical digest over newly authored reports; separately measure/debit the permitted report delta before entry and at later resource checks. Do not simply remove the drift check or omit report costs. Add an inert composed regression for the required diagnostic and baseline preparation-report sequence, including inventory-byte updates, and rejection of changed historical rows/unapproved reports. Preserve v8/v9 behavior.

### CR-02: BLOCKER — Baseline terminal-only custody accepts unauthenticated preparation markers

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:469-479`

**Issue:** The new canonical baseline terminal command reads the actual `admission-prepare-start.json` and `admission-prepare-close.json`, but validates only route/mode, the start ordinal, and equality of two claimed root strings. `readLeanCorrectionJson` verifies file permissions and canonical JSON serialization; it does **not** authenticate an object's `root`, schema or clock claims.

Consequently, changing a preparation marker's clock, schema, root or close ordinal while retaining the handful of checked fields still allows a rooted terminal-custody report. In the legitimate no-store preparation-failure branch, a close with arbitrary claimed roots and no valid elapsed linkage is accepted as actual custody; the report also assigns cumulative charge 32 without authenticating the new diagnostic check/FINAL. In the store-present branch, neither prepare-close allocation/interval linkage nor run-admission close/cleanup custody is checked. A file at the right canonical path is therefore being treated as proof of the claimed terminal stage.

This finding concerns the truth of the new nonauthorizing terminal report, not an execution-authority bypass: `accepted` and `authorizing` remain false. The source/data contract nevertheless treats MAIN-authored roots and schemas as untrusted until checked, so a counterfeit or malformed preparation receipt must not become independently verified failure evidence.

**Fix:** Add a finite baseline admission-custody validator, analogous to the existing diagnostic admission-failure validator, without invoking an ordinary empirical reader or inventing entry identities. Require exact schemas/keys, recomputed start/close roots, matching route/ordinal, validated monotonic/wall elapsed and chronology, actual allocation/closed-interval joins when a ledger exists, and authenticated run/cleanup evidence for an admission failure after spawning. Derive carried charges from authenticated new diagnostic check/FINAL or the admitted ledger rather than a literal in the no-store report. Add inert tests of the actual terminal adapter for valid preparation/admission/entry failures and individually tampered marker roots, clocks, ordinals and allocation joins. Preserve the absent actual entry HEAD as null.

## Scope and limits

The exact v10 binding, cached/uncached cap selection, CLI/child/shell routing, finite historical metadata pins, and private WeakMap lineage/revocation were traced. Connected existing baseline authority requires the new diagnostic's accepted check and actual FINAL, matching source and committed allocation lineage. No additional concrete defect is asserted in those joins by this review.

The review is proportionate to the approved source supplement; it is not a whole-repository security certification. The full phase, baseline experiment, freeze, formation, holdout, public/counting and production gates remain unverified and incomplete. Both findings require repair and an independent re-review before any new empirical preparation.

_Reviewer: /root/review_265_twenty_six (gsd-code-reviewer)_
