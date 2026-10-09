---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
reviewed: 2026-10-09T16:03:43Z
depth: standard
source_commit: 7bfc9344c69912e49ad3130c2d27a354857b5519
source_root: sha256:4e1bccdb035f0b0b206dc5ce9073877b15a81ef31647df6a3dfaa09e092abf54
source_entries: 950
diff_base: a0bb236f
author_agent: /root
reviewer_agent: /root/review_265_resource_window_v15
independently_reviewed: true
files_reviewed: 9
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-resource-window-v15.test.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-resource-window-v15.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/run-v1-38-lean-resource-window-v15.test.ts
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
findings_open: 2
status: issues_found
empirical_credit: none
---

# Phase 265 Plan 16: Resource-window source review

## Narrative Findings (AI reviewer)

### Summary

Two BLOCKER defects remain in the selected v15 execution/acceptance call chains. The nine submitted source files are byte-equivalent to the fixed source commit at review; later HEAD planning commits do not change this reviewed source. The 950-entry source root above is the fixed identity supplied by ROOT/source handoff, not a newly granted source authorization.

The review applied the project constraints and the resource-window RESEARCH-v1, PLAN-v1, PLAN-CHECK-v2, SOURCE-SUMMARY-v1, and exact replacement-window approval. Checks covered policy reconstruction, finite commands, original all-wall timing, independent disk fields, v14 metadata carry, own diagnostic/FINAL joins, parent/child capacity, retained evidence, publication, and refusal paths. The direct Match helper was inspected as a called dependency, not added to the nine-file submitted scope. No structural pre-pass was supplied.

### Critical Issues

#### CR-01: BLOCKER — Selected Match compaction still applies the legacy 2 GB memory guard

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-experiment.ts:174-175`

**Related files:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/league/lean-experiment.ts:1220-1229,1244`; `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:1572`; called dependency `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-baseline-match.ts:183`.

**Issue:** The selected correction child invokes `runLeanBaselineMatch`, which calls the shared `compactExecution`. That function calls `boundLeanReplayFrame(e)` without the authenticated allocation or live projected-byte checkpoint. `boundLeanReplayFrame` likewise calls `assertTransient(upper * 3)` without policy context. Consequently it always takes the legacy branch, rejecting RSS + 512000000 reserve + projected bytes above 2000000000. This is reachable for both the new diagnostic and baseline, despite their surrounding guards admitting the approved aggregate 3000000000 policy. A Match can already be charged/executed before this postprocessing failure prevents its evidence from being retained. It is not an unreachable legacy pilot-parent branch.

**Reproduction:** An inert in-process call mocked only the RSS observation to 2100000000, with arrayBuffers 4096 and a small failure-shaped execution. No Match/provider/entry was invoked. `assertLeanAggregateMemoryV15({parentRssBytes:40000000, childRssBytes:2100000000}, policy)` returned 2987544320, below the approved limit; calling `compactExecution(inertExecution, 1, true, "bottom")` immediately threw `TypeError: LEAN_EXPERIMENT_BUFFER_CAP`. The same unchanged call is made by the selected real Match helper. Actual native-memory feasibility is not assumed.

**Fix:** Thread optional authenticated allocation and projected-byte guard arguments through `compactExecution` and `boundLeanReplayFrame`, forwarding them to `assertTransient`. The selected `runLeanBaselineMatch` caller must pass `input.ledger.allocation` and its real checkpoint; widen that checkpoint's type to accept projected additional bytes. Preserve the existing default for legacy callers, require a non-omitted selected guard, and retain the unchanged frame-size and measured disk checks. This requires ROOT to schedule the called Match-helper seam outside the original nine-file ownership; no edits were made by this reviewer.

**Regression:** Exercise the actual shared `compactExecution` call under an inert v15 allocation with small execution data and approved above-legacy RSS, then exact aggregate/+1, disk overflow, omitted selected callback, and unchanged legacy rejection. An `encodeLeanReplay`-only test does not cover this earlier compaction call.

#### CR-02: BLOCKER — v15 parent emits v1 reason bytes while its accepted audit requires v2

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-baseline.ts:367`

**Related files:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-baseline.ts:430-440`; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:127,1291-1294`; `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:1655`.

**Issue:** `runLeanBoundedParent` authenticates the allocation mode, but its `reasonV2` family selector enumerates only v12, v13 and v14, excluding v15. The selected correction caller enables `supervisorObservation`, so v15 still publishes a reason envelope, but the producer chooses `lean-parent-supervisor-reasons-v1`. The changed retained audit uses `isLeanPreparationFamilyMode(supervisor)`, which includes v15, and therefore calls `validateLeanSupervisorRetestReasonJoinV12`. That consumer strictly validates v2 bytes. Every normally completed v15 diagnostic or baseline thus fails its ordinary retained audit even with zero uncertainty and valid execution. The accepted-diagnostic full audit repeats the same mismatch, so its own conditional baseline cannot gain accepted custody.

**Reproduction:** Static producer selection for authenticated `"v15-2"` evaluates `reasonV2` to false. An inert canonical envelope constructed from exactly the producer's successful v1 schema and fields passed `isLeanSupervisorReasonEnvelope` (`true`), then failed `validateLeanSupervisorReasonBytesV2` with `TypeError: LEAN_BASELINE_SUPERVISOR_REASONS_V2`. This test used in-memory NON-AUTHORIZING roots and no actual parent/child or route files. The retained consumer calls that strict v2 validator through `assertLeanSupervisorReasonCustodyV2`; a custody join cannot repair the schema mismatch.

**Fix:** Include `isLeanResourceWindowModeV15(authenticatedMode)` in the parent's authenticated `reasonV2` selection and import its predicate. Preserve legacy v1 selections and the strict v2 consumer; do not weaken the audit to accept either schema. Add an inert producer-to-consumer regression proving the actual v15 mode selector produces canonical v2 bytes with all sampling provenance fields and that the unchanged selected retained reason join accepts those bytes only when all entry/terminal joins match.

### Review receipts and limits

- Combined focused suites: `pnpm exec vitest run packages/strategy-lab/src/league/lean-resource-window-v15.test.ts scripts/run-v1-38-lean-resource-window-v15.test.ts` — 2 files, 17 tests passed, exit 0. These tests do not cover the two failing call-chain seams above.
- Inert direct reproductions: approved aggregate 2987544320; compaction rejected `LEAN_EXPERIMENT_BUFFER_CAP`; canonical parent v1 valid; strict selected v2 reader rejected `LEAN_BASELINE_SUPERVISOR_REASONS_V2`. Exit 0 because expected failures were observed and caught.
- Exact nine-file diff against 7bfc9344 produced no differences; no scoped file is Git-ignored and no local `.codexignore` was present. No project-local `.codex/skills` or `.agents/skills` was available. The code-review skill guided classification/call-chain checks; no source modifications or commits were made.
- Authentic full accepted v15 custody, actual own FINAL, child disconnect/runtime sampling, provider recovery and complete 36-cell feasibility remain unproved. Missing empirical proof alone is not classified as a source defect. Dormant v15-3..5 refusal is the acknowledged approved distinction boundary, not an omission finding.
- Inherited strict-six diagnostics, private-fixture-four ENOENT and monitor-five node:util findings remain NOT PASS and were not reclassified or cleared here. No full-history scan, consumed ordinary reader, helper/data/authorization/allocation/entry/Match/provider execution, STATE/allocation update, or empirical credit occurred.

Source acceptance must remain closed until both blockers are fixed and independently re-reviewed against the new fixed source identity. ROOT owns any in-supplement ownership scheduling, source fixes, validation, verification and subsequent actual gates.

_Reviewer: gsd-code-reviewer; depth: standard; reviewed: 2026-10-09T16:03:43Z._
