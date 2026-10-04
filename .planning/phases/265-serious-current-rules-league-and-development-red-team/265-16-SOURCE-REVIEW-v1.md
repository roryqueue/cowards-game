---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
reviewed: 2026-10-04T13:28:00Z
depth: deep
source_commit: 7e08232e1ba95c1c8b58301dbf5ae8e595d19397
source_root: sha256:4a5c07841a5b1f5e8b7b82714fee457f2f8af2eaa279c8b186d51f819dc185af
source_entries: 875
reviewer_agent: /root/review_265_lean_baseline
author_agent: /root
co_author_agents:
  - /root/lean_baseline_entry
  - /root/lean_baseline_reader
  - /root/lean_baseline_accounting
  - /root/lean_baseline_contract_repair
  - /root/lean_training_adapter
independently_reviewed: true
files_reviewed: 27
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-training.ts
  - packages/strategy-lab/src/league/lean-training.test.ts
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-experiment.test.ts
  - scripts/lib/v1-38-lean-baseline.ts
  - scripts/lib/v1-38-lean-baseline.test.ts
  - scripts/lib/v1-38-lean-training-adapter.ts
  - scripts/lib/v1-38-lean-training-adapter.test.ts
  - scripts/lib/v1-38-lean-baseline-source.ts
  - scripts/lib/v1-38-lean-baseline-source.test.ts
  - scripts/lib/v1-38-lean-baseline-analysis.ts
  - scripts/lib/v1-38-lean-baseline-analysis.test.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-baseline-match.test.ts
  - scripts/lib/v1-38-lean-baseline-authority.test.ts
  - scripts/lib/v1-38-lean-baseline-pipeline.ts
  - scripts/lib/v1-38-lean-baseline-pipeline.test.ts
  - scripts/lib/v1-38-lean-cold-corpus.ts
  - scripts/lib/v1-38-lean-cold-corpus.test.ts
  - scripts/lib/v1-38-lean-seal-metadata.ts
  - scripts/lib/v1-38-lean-seal-metadata.test.ts
  - scripts/lib/v1-38-lean-baseline-retained.ts
  - scripts/lib/v1-38-lean-baseline-retained.test.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/run-v1-38-lean-baseline.test.ts
  - scripts/run-v1-38-lean-baseline.sh
findings:
  critical: 3
  warning: 1
  info: 0
  total: 4
status: issues_found
---

# Phase 265 Plan 16: Independent source review

## Narrative Findings (AI reviewer)

### Summary

Three BLOCKER findings affect the reduced experimental schedule, response eligibility, and honest failure verification. One WARNING concerns missing all-Match measurement coverage. These findings apply to the approved lean experiment, not deferred full-league or production certification.

The fixed checkout and safe `leanBaselineSourceManifest()` export independently matched the full commit, functional root and 875 entries above. Review included the explicit 27-file scope, additive baseline/accounting changes in `lean-experiment.ts` and its tests relative to `d7f98332`, and the additive baseline authority issuer; unchanged pilot authority was traced only as context. Cross-file tracing covered source snapshots, staged learning, pair-prefix publication, ledger charge, parent/child release, native authority claims, retained observations, solver inputs, repeat identity normalization and the new retained audit.

No source files were edited. No preparation, allocation publication, capacity admission, native provider, actual Match, empirical retained reader, old v6/v7 reader, holdout opening or external mutation was invoked. Existing historical artifacts remain untouched. No structural pre-pass was provided. No project-local `.codex/skills` or `.agents/skills` index was present. AGENTS.md, current STATE top, checked Plan 16, active remaining-plan and source checkpoint informed the review.

## Critical Issues

### CR-01: Reduced four-condition blocks split arenas by entrant side

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/league/lean-experiment.ts:603-607`

**Affected joins:** `lean-experiment.ts:677-681`; `scripts/run-v1-38-lean-baseline.ts:45-49`; `scripts/lib/v1-38-lean-baseline-match.ts:20-27`; `lean-experiment.test.ts:58`.

**Issue:** `arenaIndex: Math.floor(localOrdinal / 2) % 2` assigns conditions 0/1 to Smoke and conditions 2/3 to Standard Cross. The pipeline places the entrant on bottom for 0/1 and top for 2/3, so geometry is confounded with side. This happens in every four-cell block, including initial training, response training, matrix, probe and repeats. The source test explicitly expects `[0, 0, 1, 1]`, protecting the defect.

The active `LEAN-REMAINING-PLAN-20261003.md:25-33` defines reduced as one geometry, explicitly puts both training blocks on Smoke, and line 39 locks reduced Smoke by canonical semantic identity before outcomes. This is not an old full-scale requirement. Pure source inspection reproduced initial matrix slots 8–11 as `bottom/Smoke, bottom/Smoke, top/Standard Cross, top/Standard Cross`.

**Fix:** Resolve the active Smoke catalog entry by its canonical semantic identity and use it for all 36 current reduced slots and corresponding request roots. Preserve all four side/initiative conditions, counts, seeds and the exact-repeat mapping. Do not change the old pilot allocation or expand to eight Matches per pair. Correct the expectation that currently encodes the side/geometry confounding.

**Verification:** A source-only regression must assert every reduced slot has the Smoke semantic root; each pair's four conditions cover both sides and initiatives on that same geometry; repeats match initial matrix arena/condition/seed. Verify allocation and request constructors agree without preparing an actual allocation.

### CR-02: Response eligibility substitutes an unweighted security gap for the frozen acceptance rule

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-baseline-pipeline.ts:135-142`

**Affected joins:** `scripts/lib/v1-38-lean-baseline-pipeline.ts:157`; `scripts/lib/v1-38-lean-baseline-retained.ts:268-285`.

**Issue:** The pipeline computes the response's equally weighted mean over both initial opponents, subtracts the strongest initial pure's earlier minimum score, and treats a positive difference as sufficient for finalist eligibility. The retained reader repeats this arithmetic. It does not compute the score against the frozen mixture or enforce its strict normalized `>0.55` threshold. The gap is useful as a separately labeled diagnostic, but is not the approved response acceptance rule.

Active `LEAN-REMAINING-PLAN-20261003.md:49,57-59` preserves rejected/nonpositive responses, frozen-weight response gaps, and the explicit positive-response thresholds. This is separate from deferred robust-finalist certification.

**Reproduction:** Four initial A–B results give A 5/8 points, or 1.25 half-points per Match. The existing solver returns a frozen mixture with weight 1 on A and 0 on B. Let the response R draw all four against A and win all four against B. R's unweighted mean is 1.5, so the code reports improvement `+0.25`, admits R, and the final pure ranking selects R. Yet R's normalized score against the actual frozen mixture is exactly 0.5, failing `>0.55`. This counterexample was checked using only the existing numeric solver and synthetic rows.

**Fix:** Retain the existing security-gap diagnostic under its honest name, but compute a separate normalized score using the frozen initial mixture weights and the retained fresh per-opponent pairing scores. Enforce the approved response admission conjunction before adding R to `eligiblePureRoots`, and make the retained audit independently recompute it. Record the strongest-pure comparison separately; if the allocated data cannot support the exact declared comparator, record it unsupported and exclude R, without adding Matches, self-play, replacement attempts or tuning thresholds. Preserve all diagnostic response rows and the earlier snapshot even when R is excluded.

**Verification:** Add a complete synthetic pipeline/retained-audit counterexample matching the results above. It must retain the eight response pairings but exclude R as a finalist. Test exactly 0.55, below-threshold and above-threshold frozen-mixture scores and an unsupported strongest-pure comparator. No native execution is required.

### CR-03: Completed player-violation evidence cannot pass the retained partial-result join

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-baseline-match.ts:101-104`

**Affected joins:** `scripts/lib/v1-38-lean-baseline-match.ts:35-43,115`; `scripts/lib/v1-38-lean-baseline-pipeline.ts:73-78`; `scripts/lib/v1-38-lean-baseline-retained.ts:183-190`.

**Issue:** `leanBaselineSemanticRoot(actual)` returns a root whenever the underlying gameplay object is completed. A completed Match can include runtime player violations: `compactExecution` classifies such accounting as `player_violation`, while the kernel can continue gameplay to completion. The pipeline correctly stops and retains a partial result, but the observation still has a non-null semantic root. The retained audit requires a null semantic root for every non-success classification and therefore rejects this authentic partial result with `LEAN_BASELINE_RETAINED_OBSERVATION`.

A source-only synthetic canonical prefix with a synthetic violating accounting row reproduced `classification: player_violation` alongside a non-null semantic root. No full Match or provider was run. The same contract mismatch exists for any completed execution subsequently classified as cleanup failure.

**Fix:** Apply one consistent contract at producer and reader. The smallest fix is to set the returned semantic root to null unless `compact.classification === "success"`; retain the authentic execution/accounting/replay/diagnostic roots separately. Alternatively deliberately admit completed-failure semantic roots in both schemas, without treating them as successful repeat or payoff evidence. Do not erase, reclassify as a loss, rerun or refund the failed slot.

**Verification:** Add source-only cases for completed player violation, actual system failure and cleanup failure through the producer observation shape and pure retained partial audit. Their charge and failure must remain accounted, later slots unused, and completion false. Successful repeat semantics must remain unchanged and private memory values must remain bound.

## Warnings

### WR-01: Required measurement gaps are neither retained nor explicitly disclosed

**Classification:** WARNING

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-baseline-match.ts:101-115`

**Affected joins:** `scripts/lib/v1-38-lean-baseline-pipeline.ts:18-24,157`; `scripts/run-v1-38-lean-baseline.ts:181-187`; `packages/strategy-lab/src/league/lean-experiment.ts:683,1189-1193`; `scripts/lib/v1-38-lean-baseline-retained.ts:293`.

**Issue:** Per-cell telemetry contains only transition and event counts. The returned observation omits final gameplay state and the contact/opening/STONE/survival measurements required by the active remaining-plan lines 55–61. Nontraining observations have no retained legal inputs because no observed role is supplied. Only one replay per stage is preselected, so just two of the twelve matrix cells retain their traces; hashes cannot reconstruct the other ten cells' required measurements. The pipeline and retained report nevertheless have no explicit missing-metrics inventory or measurement/formation-comparison inconclusive disposition. This risks discovering unusable baseline comparison evidence only after the one-shot route has consumed its Matches.

No formation pass or robust claim is currently emitted, so this is not reported as an existing false formation authorization. The active contract explicitly allows missing telemetry to be reported with formation pass prohibited; a new comprehensive certification system is not required.

**Fix:** Before discarding an actual canonical trace, retain bounded rooted per-cell measurements using applicable existing metric/classifier logic. If a safe compatible collector is unavailable, add an explicit required-metrics coverage/missing inventory to pipeline and retained reports and bind the resulting formation-comparison disposition to inconclusive. Do not imply 12-cell metric coverage from two sampled replays, open holdout, expand replay retention or run additional Matches to reconstruct missing data.

**Verification:** Synthetic positive/negative trace fixtures must cover any newly retained metrics. Otherwise test explicit missing coverage and the inconclusive formation-comparison disposition, including a source-only fixture where all 36 Match counters pass but contact/opening metrics are unavailable.

## Source-only checks and limits

- Safe functional manifest export matched `sha256:4a5c07841a5b1f5e8b7b82714fee457f2f8af2eaa279c8b186d51f819dc185af`, 875 entries, at the fixed full HEAD.
- Twelve focused source-test files exercised 48 tests. The default parallel run passed 46 and timed out two first training/adapter tests at their default 5,000 ms limits. Rerunning only those two files with `--maxWorkers=1` passed all 15 tests; thus every one of the 48 unique test cases passed in a source-only run, but the default parallel command is not claimed passed. Timing dependence is disclosed, not presented as a proved product defect.
- Numeric response counterexample, reduced arena/side mapping and player-violation observation/root mismatch were reproduced with synthetic data and trusted canonical prefixes only.
- No broad historical test sweep, script typecheck pass, empirical capacity fit, actual native authority issuance, successful baseline, production eligibility or full snapshot certificate is claimed.

The report is an immutable review of this source checkpoint. Corrections require a distinct source checkpoint and re-review; this report must not be retroactively made clean.

_Reviewer: /root/review_265_lean_baseline; depth: deep; source-only._
