---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
reviewed: 2026-10-04T13:55:47Z
depth: standard
review_mode: focused_delta_rereview
source_commit: e7d0acda88957ca868ad295c42d51ee362fd3236
source_root: sha256:03e2a09d1a79aff27fb1ecfd6a6f52d307aeb5b7303139b6e7a5b3f58a019781
source_entries: 876
reviewer_agent: /root/review_265_lean_baseline
author_agent: /root
co_author_agents:
  - /root/lean_baseline_entry
  - /root/lean_baseline_reader
  - /root/lean_baseline_accounting
  - /root/lean_baseline_contract_repair
  - /root/lean_training_adapter
  - /root/repair_265_smoke
  - /root/repair_265_metrics
  - /root/repair_265_response
independently_reviewed: true
files_reviewed: 29
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
  - scripts/lib/v1-38-lean-baseline-metrics.ts
  - scripts/lib/v1-38-lean-baseline-metrics.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 265 Plan 16: Independent source re-review v2

## Narrative Findings (AI reviewer)

### Summary

No open actionable findings were found in this focused source re-review. The three BLOCKER findings and one WARNING in immutable review v1 are resolved at this distinct checkpoint. Review v1 remains an accurate `issues_found` report of its earlier source; it was not edited or retroactively cleared.

This review used the GSD source-review workflow, AGENTS.md, current STATE top, checked Plan 16, active `LEAN-REMAINING-PLAN-20261003.md`, source execution checkpoint, review v1 and source validation v1. The approved reduced contract, particularly D-24/D-27 and its fixed response thresholds and missing-telemetry fallback, governs this assessment. Deferred original full-league/production certification is not imposed as a new gate. No structural pre-pass was provided.

### Resolution of v1 findings

- **CR-01 resolved:** `lean-experiment.ts:598-613` resolves the active schedulable Smoke entry and supplies its semantic arena index to every reduced slot. Allocation, request, dispatch/scenario and exact-repeat joins now preserve one geometry with all four side/initiative conditions. The added allocation/CLI tests cover all 36 slots and repeat arena/condition/seed identity; old pilot scheduling was not changed.
- **CR-02 resolved:** `v1-38-lean-baseline-analysis.ts:65-128` computes the frozen-mixture score from actual per-opponent pairing totals using exact rational weights and strict `11/20` comparison. The old unweighted security gap is explicitly diagnostic, not admission. The strongest initial pure's identically allocated fresh-opponent comparison needs an unallocated self-pair; it is honestly unsupported and R is excluded, including above-threshold results. Pipeline and retained audit preserve all eight response pairings and the three-source diagnostic matrix, recompute admission, and retain only the two eligible initial roots. No self-play, replacement attempt, extra Match or threshold retuning was introduced.
- **CR-03 resolved:** `v1-38-lean-baseline-match.ts:49-53` gates semantic repeat credit on successful clean classification and assigns null training credit to non-success. `v1-38-lean-baseline-retained.ts:188-215` applies the matching observation and score contract. Completed player violation, system failure and cleanup failure remain charged partials with no later launch, payoff or repeat credit. Successful private-value-preserving repeat normalization is unchanged.
- **WR-01 resolved:** The new metrics module extracts bounded count/first-event/survival/opening receipts before actual traces are discarded. Enemy contact checks opposing ownership rather than counting friendly blocks. Receipts contain no raw private payloads or opaque Soldier identifiers, are rooted and bound to the compact execution identity, and are included in private observation and compact pipeline joins. The reader checks exact metric keys, bounded values, receipt roots, unavailable failure shapes and coverage aggregation (`v1-38-lean-baseline-retained.ts:193-219`). Missing evacuation/reserve/cause/entropy/behavioral coverage remains explicit; pipeline and retained reports carry `formationComparison: inconclusive`. Sampled replay retention is not presented as full metric coverage or formation authority.

### Scope and verification

The original 27-file scope was cross-checked against its completed deep review and the fixed delta; unchanged files retain that prior assessment. Changed functions/tests and the two new metric files were read and traced through their allocation/request/scenario, observation/ledger, pipeline/analysis and pure retained-audit callers. The functional source manifest now includes the new metric implementation. No source file was edited and no commit was created.

Independently observed checks:

- Full HEAD was `e7d0acda88957ca868ad295c42d51ee362fd3236`. The inert `leanBaselineSourceManifest()` export matched the exact functional root above with 876 entries.
- `vitest run scripts/lib/v1-38-lean-baseline-metrics.test.ts scripts/lib/v1-38-lean-baseline-analysis.test.ts --maxWorkers=1 --testTimeout=30000`: 2 files, 10 tests passed. Cases cover rational response boundaries/counterexample, actual event causes, friendly/enemy contact, absent contact, mirrored/opaque opening normalization, privacy and failed execution credit.
- Targeted synthetic retained-audit cases selected by `completed player violation|rejects missing observations|rejects altered|retains an honest incomplete`: 3 tests passed, 6 deliberately skipped. The completed player-violation/system/cleanup partial cases preserve charge, null points/semantics, completion false and unused later slots.
- Source-validation-v1's root 14-file/87-test single-worker pass, package typecheck, shell/whitespace checks and three 1390-file zero-violation boundary scans were read as author-side evidence, not rerun or represented as independently executed here. Its full synthetic 36-cell and response-exclusion regression code was inspected. Inherited strict script typecheck errors remain disclosed; no global script typecheck pass is claimed.

No native provider, actual Match, preparation/allocation publication, capacity admission, actual retained reader (old or new), empirical helper terminal, holdout, formation or external mutation was invoked. Historical consumed artifacts/readers remain untouched. The nine prior charges and 3,305,606 ms carry remain under the unchanged shared 15 GB / 8-hour / 300-Match envelope.

`clean` here means zero actionable source-review findings at this fixed checkpoint. It is not an empirical baseline acceptance, a complete telemetry/classifier result, independent source verification, a Phase 266 freeze, a robustness claim or authority to open holdout/materialize formation/promote public or counted gameplay. Source-only verification and subsequent scoped data/entry gates remain separate.

_Reviewer: /root/review_265_lean_baseline; standard focused-delta re-review; source-only._
