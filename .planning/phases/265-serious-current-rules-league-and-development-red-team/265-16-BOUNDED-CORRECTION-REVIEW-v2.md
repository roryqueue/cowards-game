---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-04
depth: standard
status: issues_found
author_agent: /root
reviewer_agent: /root/review_265_bounded_correction
independently_reviewed: true
source_commit: d2e2569fbd520a8db16d50423b5b77e881c2785a
source_root: sha256:179234e2c3853e77c042b95c4fe29079b355b86768c4857f7082defab3bb51c1
diff_base: 5551e79725e158f0456a01d3667610de8bf776ea
files_reviewed: 18
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-training.ts
  - scripts/lib/v1-38-lean-baseline-match.test.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-baseline-pipeline.test.ts
  - scripts/lib/v1-38-lean-baseline-pipeline.ts
  - scripts/lib/v1-38-lean-baseline-reuse.test.ts
  - scripts/lib/v1-38-lean-baseline-reuse.ts
  - scripts/lib/v1-38-lean-baseline-source.ts
  - scripts/lib/v1-38-lean-container-match-session.test.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-correction-retained.test.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/run-v1-38-lean-correction.test.ts
  - scripts/run-v1-38-lean-correction.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
previous_findings_closed: [CR-01, CR-02, CR-03, CR-04, CR-05, WR-01]
empirical_execution: not_started
---

# Phase 265-16 bounded-correction source re-review v2

Independent review of fixed d2e2569f, preserving v1. The six previous findings are closed at source level; one new narrow diagnostic outcome regression remains. This is not an empirical readiness/cause claim. No provider, Docker, Strategy execution, Match, actual retained reader, preparation, source edit or commit was performed. The exported inert manifest supplied the exact source root above; the reviewed source paths have no working-tree delta from d2e2569f. Diff whitespace checks pass. MAIN's reported mock/type results are supporting context, not reviewer-run empirical evidence.

## Narrative Findings (AI reviewer)

### CR-06 — BLOCKER: A valid bottom-win diagnostic is rejected as an invalid training result

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:88-90`.

**Issue:** The new training-outcome join is applied to both routes because diagnostic ordinal0 has slot kind `initial_training`. But the diagnostic call at `scripts/run-v1-38-lean-correction.ts:300` deliberately omits `observedRole`; `runLeanBaselineMatch` consequently uses `observedSeat: null` at `v1-38-lean-baseline-match.ts:167`. Its projection at line55 returns `trainingHalfPoints: 0` for a successful non-draw result without an observed seat. When tactical-0/bottom wins this diagnostic, the new reader expects2 and throws `TRAINING_OUTCOME`, spending the one reader on otherwise valid diagnostic evidence. DRAW and top wins happen to pass, so the existing failure-only diagnostic fixture and all-DRAW baseline fixture do not expose the discrepancy. A nonreproduced crash must be closable honestly as diagnostic-success/unknown-cause, not rejected because no training score was collected.

**Fix:** Limit this training-score admission to `route === "baseline"`; the diagnostic must not contribute training evidence. Add synthetic diagnostic cases for bottom win, top win and DRAW, requiring retained-valid but `complete:false`, `observedOrigin:"unknown"` and no baseline authority. Keep the strict outcome join for real baseline training rows.

## Prior finding closure

| v1 finding | Source-level closure |
|---|---|
| CR-01 accounting | Owner-only exclusive start/close carriers precede request admission; process uptime captures loader costs; the same monotonic start transfers to entry, failed-start costs persist, and only the unimported finalization tail is added. Release checks subtract time and reserved cleanup/check costs. |
| CR-02 training root ordering | Expected retained training roots are copied and sorted to match canonical candidate manifests; the full synthetic fixture uses deliberately nonlexicographic execution roots. |
| CR-03 response-work schema | Reader admits the producer's exact unrooted work schema and checks its training-decision digest instead of inventing a `root` field. |
| CR-04 source/work joins | Response candidate/source/structure, target roots, outcomes, budget arithmetic, eight already-computed planner receipts and node totals are joined. The reader validates/digests retained receipts without invoking planner search or cold builders. |
| CR-05 response/probe schedule | Frozen mixture/strongest response targets and the selected eligible probe entrant are checked row-by-row, including partial prefixes. Re-rooted wrong-target fixture cases are present. |
| WR-01 invocation origin | Host binding now uses compiled sourceArtifact bytes plus the same IPC encoder/output cap, binds method/ordinal/input/executable to actual failed host-issued runtime evidence, and is retained with the origin. The reader checks strict transport/diagnostic/sourceArtifact joins. |

The observed broker deadline remains distinct from initiating native cause, which stays `unknown`. The approved cumulative10/3319046 carry, fixed opportunity, unchanged1000/5000/600000 clocks, original cold provenance, old consumed reader and unopened formation/holdout boundaries remain controlling. This review does not authorize a baseline before a separately checked actual diagnosis and any later source repair/review.
