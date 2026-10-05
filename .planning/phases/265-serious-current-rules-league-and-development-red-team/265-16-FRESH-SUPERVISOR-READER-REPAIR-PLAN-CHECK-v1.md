---
phase: 265
plan: "16"
status: passed
scope: existing_plan16_source_only_reader_repair
author_agent: /root
reviewer_agent: /root/review_265_fresh_supervisor_v3
independently_checked: true
plan_bytes_root: sha256:37c6e98cf60d8d3d51c601cabacc587435873fceb9467893ddd035ba4b6b47c3
findings: {critical: 0, warning: 0, total: 0}
empirical_started: false
source_edits_started: false
execution_authorized: false
---

# Existing Plan 16: Reader Repair Source-Only Plan Check

## Result

Passed as a finite source-only continuation. The proposed work targets two observed but unresolved source/accounting issues without claiming either explains the prior refusal. It preserves the spent v3 diagnostic and denied baseline boundary: no request, allocation, preparation, Match, provider, reader, result mutation, replay, or empirical acceptance is authorized by this plan check.

## Goal-backward coverage

| Required outcome | Planned coverage | Result |
|---|---|---|
| Safely identify only selected v3 verifier guard classes | Explicit finite allowlist; only the private v3 verify command projects enumerated static codes; unknown errors, arbitrary text, paths, payloads, and stacks remain details-withheld. v1/v2 and public/production behavior stay unchanged. | Covered |
| Preserve the actual refusal as unknown | The plan explicitly says prospective observability cannot identify the historical throw point and forbids old-store or artifact mutation. | Covered |
| Carry run-to-reader delay without double counting | Authenticate the rooted run-close receipt against route, mode, allocation and its closed ledger interval; require actual wall-clock custody; charge the gap and the new loader/runtime/closure once; missing or invalid custody fails closed. | Covered |
| Keep consumed evidence and admission authority immutable | Tests use synthetic fresh isolated stores; no consumed interval is reopened, edited, refunded, or treated as accepted evidence. The ended envelope and baseline denial remain explicit. | Covered |
| Bound ownership, time, and existing experimental limits | One source owner changes only the runner/reader and their tests plus a summary; MAIN coordinates; an independent reviewer checks separately. Work is capped at 30 minutes; 15GB/28,800,000ms/300-Match and guest/host/Match subceilings are unchanged. | Covered |

## Static integration check

The plan's ownership matches the current call graph: `leanCorrectionMain` handles the `verify-*` dispatch and its CLI failure projection in `scripts/run-v1-38-lean-correction.ts`; `verifyLeanCorrectionRetained` owns the one-shot interval, precheck, report publication, and close in `scripts/lib/v1-38-lean-correction-retained.ts`. The run process writes `admission-run-close.json` and imports the `correction-run-finalization` interval through `closeLeanCorrectionAdmission`. A source repair can validate that receipt and account the prospective gap in isolated fixtures without reopening the already-closed v3 interval.

Implementation verification should exercise both outcomes of the explicit v3 allowlist (enumerated code visible; unknown/path-bearing error withheld), assert legacy/public outputs are unchanged, and mutate each relevant run-close join to prove fail-closed behavior. A positive exact-once accounting fixture should compare the run-close wall observation, actual prospective reader start, verifier close, and append-only time rows. These are verification details within the stated plan, not additional scope or empirical authority.

## Findings

None. This is a static plan check only; no source edits, tests, empirical data audit, replay, Match, provider, or reader were run.

_Reviewed: 2026-10-05_
_Reviewer: /root/review_265_fresh_supervisor_v3_
