---
status: diagnosed
trigger: "Approved conditional v8-1 baseline stopped resource_threshold before first charge"
created: 2026-10-06
updated: 2026-10-06
---

## Symptoms

Expected: fresh conditional private36 baseline under approved20h/15GB/300 caps with SAME-PROCESS capacity before charges.
Actual: unique MAIN94895 closed exit1; child97464/97547 entry terminal child_failed/exitnull/SIGKILL/128431ms; parent finite reasons resource_threshold, initiatingcauseunknown; no charge/result.
Timeline: successful one-cell diagnostic v8-1/unique reader accepted and FINAL closed earlier this turn; baseline data review/preparation/committed allocation passed, then first baseline entry failed before first charge.
Reproduction: do not rerun; approved conditional baseline is spent and no replacement authority remains. Safe source-only diagnosis permitted.

## Current Focus

hypothesis: parent resource sampler refused one of several resource predicates; initiating predicate is not retained
test: finite metadata plus static producer/consumer tracing only
expecting: identify proven diagnostic scope versus unproven initiating cause and smallest defensible source repair
next_action: report proven parent RSS-threshold branch; leave source remediation unapplied pending separate authorization

## Evidence

- MAIN actual terminal raw sha256:cc29918971dc5f93a1989113d5d27d3f82b74327b2c95ec5725d70d8ea28645b.
- Parent finite reason raw sha256:c5abccf652a78c2bda702c1f06014c9ed86265303c8863181c3dee561428a390; observations resourceSampling observed, cleanup child_exit_observed, finalIdentity matched, failureReceipt absent, initiatingCause unknown.
- Held HEAD1b5f59d62704cf6672b4ba2953925ddede8a9957/source6cade0e237fe976051a71248f3f291166af3e769/root9ba555e7.
- Store .strategy-lab/lean-correction-supervisor-baseline-20261006-v8-1; ledger0B, result absent, three time intervals closed final1791330306250. Both actual processes absent.
- Finite terminal metadata: parent reason list is exactly `resource_threshold`; `resourceSampling` is `observed` (not `exception`), final identity matched, failure receipt absent, cleanup observed, initiating cause unknown. Child terminal is `child_failed`/`SIGKILL`; ledger has no charge, consistent with no result and no first Match charge.
- Static trigger localization: [scripts/run-v1-38-lean-baseline.ts:354] samples every 250 ms and records the same `resource_threshold` for the OR of (a) `process.memoryUsage().rss + childRss + LEAN_EXTERNAL_SCRATCH_RESERVE + 320 MiB > LEAN_CAPS.scratchBytes` and (b) `leanBoundedParentTimeBudget(...).elapsedMs >= leanCapsForAllocation(allocation).elapsedMs`.
- The time branch is ruled out for this v8 allocation when sampling succeeds: [scripts/run-v1-38-lean-baseline.ts:311] makes `leanBoundedParentTimeBudget` throw for v8 when `elapsedMs + max(1,860,000 ms, matchMs + terminalReserveMs) >= cap`; a successful return therefore guarantees `elapsedMs < cap`. If it threw inside the monitor, the catch would record `resource_sampling_exception`, contrary to this terminal's `resourceSampling: observed` and sole reason `resource_threshold`. The remaining OR branch—the aggregate RSS/scratch predicate—is therefore the proven trigger. Trigger-tick RSS values are not retained, so its excess magnitude and the upstream reason RSS was high remain unknown.
- Terminal-only safe resource fields later showed parent RSS 519,835,648 bytes and maximum observed child RSS 666,226,688 bytes; with the 512,000,000-byte external reserve and 335,544,320-byte buffer reserve, their sum is 2,033,606,656 bytes against the 2,000,000,000-byte scratch cap. These are not guaranteed same-instant trigger operands, so they corroborate but do not quantify the triggering sample. Free bytes were 201,995,898,880; elapsed entry was 128,431 ms and carried floor about 60.2M ms of 72M ms. No disk-trigger inference is supported.
- Adjacent predicates are distinct and were not the emitted parent reason: pre-release admission in [scripts/run-v1-38-lean-baseline.ts:339-342] checks the same parent+child RSS/scratch expression and available disk against remaining total-write capacity; the child checkpoint [scripts/run-v1-38-lean-correction.ts:246] separately checks elapsed reserve, charge ceiling, retained bytes, combined RSS/scratch, cumulative disk plus terminal reserve, free disk, and at least 1 GiB available memory. These produce admission/capacity errors, not the observed periodic parent `resource_threshold` reason.
- Smallest defensible repair recommendation (not applied): preserve the existing kill condition and unchanged caps, but evaluate the periodic sampler's scratch and time booleans separately and retain a bounded reason for each true branch (including both if simultaneous), with schema/validator tests. Do not retain raw process measurements or alter the resource boundary. Existing terminal-only RSS observations, if considered, are not the triggering sample and do not establish the memory trajectory.
- A separate narrow source-only efficiency pass that reuses the already-validated immutable allocation/cap view across the 250 ms supervisor sampling loop is defensible as overhead reduction, provided each admission expression is semantically identical and focused tests prove parity. It is not evidence that repeat validation caused this stop and cannot be reported as a causal fix. The more direct next step is a prospective new-source bounded trigger vector containing finite numeric operands and the two branch booleans for the first threshold sample; keep prior artifacts immutable, preserve existing limits/kill semantics, and validate exact schema bounds before any newly authorized run. Neither change was applied here.
- The separate ENTRY-terminal-only verifier closed with finite custody verified, no result/no charge, and source HEAD unchanged; this diagnosis did not duplicate its work.

## Eliminated

- A successful baseline or retained empirical result is disproved by no result/charge and failure terminal.
- Guest timeout is not established: no Match charge and no authenticated guest timeout receipt.

## Resolution

root_cause: Parent `resource_threshold` is proven to be the aggregate parent+child RSS plus scratch-reserve predicate; the v8 elapsed predicate cannot pass on a successful sample. Trigger-time measurements and the upstream cause of elevated RSS are not established.
fix: not applied; recommend persist separate bounded parent scratch/time trigger codes while preserving current kill behavior and caps.
verification: one bounded source-only diagnosis complete; separate unique ENTRY-terminal-only verifier closed with no result/no charge and HEAD unchanged.
files_changed: this diagnosis record only
