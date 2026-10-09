---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
reviewed: 2026-10-09T17:43:00Z
depth: standard
diff_base: 7e7e6c0b5773c4a640dd4ded0eea885997a48d8c
source_commit: 47425b37ee8d4a9ebdf0851667689d6d5ec0713e
source_root: sha256:6f843d8614f3397403e613367cf751e89032dd8cc28b0fe5e322a679fd513742
source_entries: 955
author_agent: /root
reviewer_agent: /root/review_265_checkpoint_repair
independently_reviewed: true
files_reviewed: 7
files_reviewed_list:
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/lib/v1-38-lean-checkpoint-observation-v15.ts
  - scripts/run-v1-38-lean-checkpoint-observation-v15.test.ts
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-resource-window-v15.ts
  - scripts/run-v1-38-lean-resource-window-v15.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
findings_open: 0
status: clean
empirical_credit: none
---

# Phase 265 Plan 16: Checkpoint-repair source review

## Narrative Findings (AI reviewer)

No actionable BLOCKER or WARNING was identified in this bounded independent review of the seven declared changed source/test files and their actual called guards. No structural pre-pass was supplied. This is source review, not acceptance of an actual request or experiment. The exact strict-consumer receipt is the separately authored POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v3 report.

The complete repair plan, both plan checks, current STATE frontier, diagnostic session, source summary, actual seven-file diff and called boundary implementations were inspected. PLAN-CHECK-v1's withdrawn ownership finding is not repeated. The ROOT typed mock correction is included in the reviewed source commit, not inferred from the earlier isolated source root.

### Actual selected call chain

| Boundary | Source inspected and conclusion |
| --- | --- |
| Selected child | correction.ts:1558-1574 selects the new composition only after strict allocation policy reconstruction; legacy observer remains separate. |
| Observation | checkpoint-observation-v15.ts:21-39 invokes each observation once in this synchronous call, validates nonnegative safe integers and overflow of projected RSS/buffer values, then discards all operands on return. No durable or cross-callback cache exists. |
| Identity and parent ownership | correction.ts:479-482 independently reopens/admit-checks allocation; observation helper:24,32 retains before/after allocation admissions, in addition to unchanged readLeanLedger admission. Parent/IPC checks surround observations and guards. |
| Prefix and correction guards | correction.ts:470-477 binds real allocation to baseline.ts:244-248 -> experiment.ts:113-120 and correction.ts:458-466. Identical measured elapsed, physical/free bytes and projected max(current RSS,maxRSS) plus additionalBytes reach both guards. Prefix reserve and correction available-memory/charge checks remain enforced. |
| Independent disk guard | correction.ts:476 uses physicalBytes and measured arrayBuffers+additionalBytes+temporary allocated blocks. RSS is not charged as disk; scratch2GB and total15GB remain distinct from RAM3GB. |
| Match and compaction | baseline-match.ts:143-155 keeps both pre-native and post-native callbacks. Its compactExecution call still passes actual allocation and checkpoint; replay/retention callbacks remain reachable. |
| Mutation/publication | correction.ts:1584-1587 takes fresh disk/time observations for resource-event publication; package lean-experiment.ts:1751-1758 appends then freshly calls readLeanLedger. No pre-write admitted ledger is reused after append. |
| Dispatch and parent | Source/HEAD/request hold at correction.ts:1590 remains; unchanged parent admission/deadline/sampler remains distinct from child observation. |

Sampling is sequential within one synchronous call, not an atomic OS snapshot. The reduced observations do not establish a native timing improvement or historical peak measurement; the unchanged parent sampler remains required. The source-proven operation count is per checkpoint, not shared across the two Match callbacks. Closure-local highWater never replaces current observations.

### Inventory, identity and authority

Package lean-experiment.ts:1964-1972 adds exactly eight finite repair reports and exact strict v3 review to physical accounting, retaining old outputs. Report growth is charged; previously charged shrink or disappearance refuses through leanTwentySixReportDeltaBytes at960-972. correction.ts:281-287 includes the helper, test, repair plan and both immutable plan checks in source closure; only enumerated downstream cyclic outputs are removed from source identity, not physical debit. No wildcard/new scan scope or version fallback was added.

resource-window-v15.ts:18 selects only exact SOURCE-REVIEW-v3. The strict consumer at correction.ts:503-516 still requires hashed bytes, clean status, current source root, full source commit, independent actors and source/Git equality. Missing/forged prior custody and own accepted diagnostic/actual FINAL still refuse. Later v15-3..5 remain deliberately fail-closed; the historical-cost-only prospective contract is not supplied by this repair.

### Evidence and limitations

Independent read-only source-manifest invocation through local tsx closed exit0, re-derived exactly955 entries/root sha256:6f843d8614f3397403e613367cf751e89032dd8cc28b0fe5e322a679fd513742. git diff --check closed exit0. HEAD matched full reviewed commit. git check-ignore identified no ignored scoped source files. No project-local skill directories were present. The code-review skill guided adversarial tracing/classification; it did not authorize source changes or an actual route.

Tests were inspected, not rerun by this reviewer. Source-summary receipts record RED/GREEN20 checkpoint and25 resource tests; ROOT separately reports45/45 focused tests in27.68s and20 follow-up tests in17.17s after its typed mock fix, configured types/shell/diff/factory1434-zero passing. These are attributed receipts, not independently executed review tests. The inert helper fixture verifies operands; the selected composition fixture executes actual prefix/correction/disk predicates, exact boundaries/+1, fresh changes and real on-disk allocation drift. They do not replace positive authentic custody or real native measurements.

Strict-six inherited errors, earlier private-four ENOENT and monitor-five node:util limitations remain NOTPASS. No full-suite green, runtime cure, initiating-cause attribution, positive full accepted custody or complete36-cell fit is claimed. Deadline18:38:33UTC/all-wall223171903ms/reserve1860000ms/RAM3GB/scratch2GB/retained12GB/total15GB/terminal1GB/300Matches/Match600000ms and runtime limits remain unchanged.

Actual v15-2 remains refused, current1/cumulative37, with the duplicate-publication hold-refusal preserved. Initiating cause remains UNKNOWN. No empirical/LEAG/phase/freeze/formation/holdout/public/counted/production credit follows. No source, STATE, historical report, allocation, authority, request or artifact was modified; only the two assigned fresh review reports were created. All reviewer commands closed, no actual reader/provider/Match ran, and source ownership is released.
