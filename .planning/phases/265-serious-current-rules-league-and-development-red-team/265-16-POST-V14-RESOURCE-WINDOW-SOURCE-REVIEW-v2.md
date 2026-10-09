---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
reviewed: 2026-10-09T16:26:40Z
depth: standard
source_commit: 7250223f67620ccc274a3a2fc80d099718ea58ea
source_root: sha256:2d499dc06ae7a95b12c11c4d96a0ce8f0033e20fcaaf8a484b5279c86215059e
source_entries: 950
diff_base: a0bb236f
author_agent: /root
reviewer_agent: /root/review_265_resource_window_v15
independently_reviewed: true
files_reviewed: 10
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-resource-window-v15.test.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-resource-window-v15.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/run-v1-38-lean-resource-window-v15.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
findings_open: 0
resolved_findings: [CR-01, CR-02, CR-03]
status: clean
empirical_credit: none
---

# Phase 265 Plan 16: Resource-window source re-review

## Narrative Findings (AI reviewer)

### Summary and exact scope

No remaining actionable source finding was identified in this bounded standard-depth review of the ten explicit source files against `a0bb236f`, including the ROOT-scheduled Match-helper seam and fixes `db06094b`, `5efd05c6`, and `7250223f`. The original v1 report and both fix reports remain historical evidence; this new report does not rewrite their findings or receipts. No structural pre-pass was supplied.

The actual implementation source is `7250223f67620ccc274a3a2fc80d099718ea58ea`; review began at MAIN HEAD `61b2aa078ec2c83cc506c1c73de4b59414c3672a`. The ten files have no working-tree difference from the implementation commit. Independently exporting the inert finite source manifest returned exactly 950 entries and `sha256:2d499dc06ae7a95b12c11c4d96a0ce8f0033e20fcaaf8a484b5279c86215059e`, matching ROOT's actual supplied identity.

`clean` means no open source finding in this explicitly bounded review. It does not mean global validation passed, full accepted v15 custody succeeded, memory feasibility was established, or an actual route is authorized. No runtime success or empirical credit is asserted.

### Previously reported BLOCKER defects: source closure

| Historical finding | Fixed source and actual consumer | Independent re-review conclusion |
| --- | --- | --- |
| CR-01: legacy compaction memory guard | `scripts/lib/v1-38-lean-baseline-match.ts:104-110,183` passes authenticated allocation and the actual projected-byte checkpoint to `compactExecution`; `scripts/run-v1-38-lean-experiment.ts:174-175` forwards both to `boundLeanReplayFrame`; package `lean-experiment.ts:1220-1229,1244` selects the strict prospective guard. | The selected compaction call no longer loses policy context. Missing selected guard, aggregate overflow, unchanged measured-buffer overflow and frame-size excess still refuse; legacy calls retain their original ceiling. |
| CR-02: parent reason-v1 versus strict reason-v2 consumer | `scripts/run-v1-38-lean-baseline.ts:121-140,385,454` authenticates the allocation before selecting v15 reason-v2 and uses the same producer in the actual parent. Retained audit still requires strict v2 at `scripts/lib/v1-38-lean-correction-retained.ts:127,1291-1294`. | The producer/consumer version mismatch is removed without making the consumer accept alternate schemas. Canonical v2 sampling fields and exact allocation/source/request/entry/HEAD/PID/terminal joins remain checked; legacy v1 remains selected only for its unchanged families. |
| CR-03: immutable issues-found v1 review selection and missing report debit | `scripts/lib/v1-38-lean-resource-window-v15.ts:18` now selects exact SOURCE-REVIEW-v2. Package `lean-experiment.ts:1964-1971` retains v1 and adds exact SOURCE-REVIEW-v2/REVIEW-FIX-v1/REVIEW-FIX-v2 paths; report deltas at `960-972` and predecessor inventory at correction `2017-2025` consume this finite list. | The new review can satisfy the unchanged exact-path consumer, and these new report blocks/growth are measured. Previously charged shrink/disappearance refuses. No arbitrary version, wildcard, broad scan or old-report replacement was introduced. |

These conclusions close the source defects, not authentic full accepted diagnostic/FINAL or real parent-child execution proof.

### Selected boundary checks

- Policy selection reconstructs the allocation with `admitLeanAllocation` before choosing the prospective memory limit. Exact policy keys/roots, fixed approval and pinned plan identities, caps, mode and ordinal remain bound; mutable altered copies do not inherit cached authority. Parent reason selection also authenticates allocation caps first. Actual request authorization requires ROOT author plus a distinct allowed reviewer, and exact helper/source/request/policy joins before provider-capable execution.
- The selected child passes its real checkpoint through Match compaction and retention. The callback retains connected-parent checks, live parent RSS, actual/current child RSS high-water, projected allocation, disk measurements, available-memory checks and repeated source/HEAD holds. Parent readiness and 250ms sampler select the same authenticated 3GB aggregate policy. Standalone retained readers observe their own process plus reserves rather than inventing a child.
- Aggregate memory remains parent + child + 512000000 external reserve + 335544320 guard, bounded at 3000000000. RSS telemetry is separate from measured arrayBuffers/temp allocated blocks. Scratch 2000000000, retained 12000000000 and total disk 15000000000 remain unchanged. Both `resource-v15` ledger validation and retained audit enforce policy/root/high-water agreement and independent disk arithmetic; legacy resource events are refused for selected allocations.
- FULL108000000 plus all wall since1791455941097 remains charged, including this review. The approved cumulative cap223171903, deadline2026-10-09T18:38:33Z, terminal reserve1860000 and Match600000 are unchanged. Allocation, admission, child, parent and publication checks retain the fixed floor and reserve; no reset/refund/idle exclusion was added.
- v14 carry authentication remains finite metadata-only, pinned by full raw byte digests and canonical/semantic joins, with36 cumulative charges and monotone survivor debits. Own baseline admission requires its matching accepted diagnostic, actual reader closure/FINAL, full retained audit and source/Git lineage, not shape-only roots. The later immediate-prefix contracts retain charge/time/disk continuity. v15-3..5 remain deliberately dormant and fail closed because only v15-2 currently has the approved distinction.
- Existing dispatcher and shell wrapper enumerate only v15-[2-5] diagnostic/baseline prepare/run/ordinary-verify/terminal-verify, preserve dated TMPDIR/cache/core/oldspace controls, and reject unknown selectors. Legacy paths/defaults remain selected unchanged. v15 reaches the correction-owned baseline pipeline, not the standalone legacy baseline child or pilot parent.
- Selected ordinary, accepted-full-audit, publication and no-ledger/carry/hold guards remain wired. Finite physical report inventories include the new review/fix outputs even though those named downstream outputs are excluded from functional source hashing. Missing previously charged identities and physical shrink refuse instead of refunding.

### Independent read-only receipts

1. `node_modules/.bin/vitest run packages/strategy-lab/src/league/lean-resource-window-v15.test.ts scripts/run-v1-38-lean-resource-window-v15.test.ts --testTimeout 30000` — exit0,2 files/22 tests passed in12.08s. The explicit test-runner timeout is not a runtime/game bound change. Tests use in-memory or owned temporary NON-AUTHORIZING fixtures; no actual experiment/provider is invoked.
2. The tests cover the actual shared compaction forwarding with nonzero projected bytes, exact RAM/+1 and independent disk/+1 boundaries, missing callback and unchanged legacy refusal; the actual parent producer and unchanged strict retained reason join; exact new review selection; and actual report allocated-block growth/shrink/disappearance accounting. Their synthetic joins are not authentic accepted v15 custody.
3. `node_modules/.bin/tsx -e` importing only `leanCorrectionSourceManifest` and the prospective policy — exit0,actual root and950 entries as recorded above. No historical reader or predecessor execution was called.
4. Exact ten-file comparison against7250223f returned no differences. `sh -n scripts/run-v1-38-lean-correction.sh` and `git diff --check` — exit0. The actual strict review consumer was read: it requires exact selected path, hashed report bytes, clean status, matching source root/full source commit, independent actor fields and source/Git equality. This report supplies those fields from the actual review; no fake clean fixture was used.

### Limits and preserved authority frontier

Inherited strict-six diagnostics, private-fixture-four ENOENT and monitor-five node:util findings remain NOT PASS. They were not rerun, repaired or relabeled as successful by this review. No repository-wide validation or production certification is claimed.

Actual positive full accepted v15 diagnostic/FINAL custody, parent-disconnect/runtime sampler behavior, native provider/RSS recovery and complete36-cell baseline feasibility remain unproved. Missing empirical proof alone is not a source finding. The code-review skill supplied the adversarial call-chain checks and severity classification; the source scope and approved private-experiment limits governed what was reviewed.

No source, STATE, allocation, helper, authorization, data/helper gate, pinned plan, SOURCE-SUMMARY, old report or artifact was changed; no commit, consumed ordinary reader, heavy history scan, actual entry, Strategy, Match or provider run occurred. This new review is the only output. ROOT still owns separate validation/source verification and any fresh actual gates, immutable allocation and conditional entry. No LEAG/Phase completion, freeze, formation, holdout opening, public/counting/production authority or resource-cure promise follows.

_Reviewer: gsd-code-reviewer; depth: standard; reviewed: 2026-10-09T16:26:40Z._
