---
status: investigating
trigger: Approved v5 baseline stopped by resource threshold before first charge
created: 2026-10-05
updated: 2026-10-05
goal: find_root_cause_only
---

## Symptoms

expected: Approved conditional fresh36-Match baseline after accepted v5 one-cell diagnostic, unchanged cumulative12h/15GB/300Match and2GB scratch bounds.
actual: Unique MAIN84884 closedexit1; actual childterminal child_failed/null exit/SIGKILL/96096ms, parent reason resource_threshold, zero recorded charges/observations/result.
timeline: Accepted diagnostic MAIN16769+ordinaryreader36914 preceded failedbaseline; no retry.
reproduction: Consumed baseline cannot be rerun; source-only diagnosis/static or synthetic tests only.

## Current Focus

hypothesis: Parent/child repeat materializing accepted-diagnostic and cold-reuse audits before first charge, exceeding aggregate scratch guard.
test: Trace actual source and finite terminal resource fields without rerunning native/empirical workloads or private payload scans.
expecting: Establish exact guard arithmetic and redundant audit call graph; distinguish source defect from unproven original sampled numeric trigger.
next_action: Delegate bounded diagnosis-only GSD manager; no resource change or new execution authority.

## Evidence

- timestamp: 2026-10-05T23:21:36Z
  checked: Unique independent terminal-only verification closed; sourceHEADhold released. All three intervals closed33812347ms/latestclose1791242322180; report STARTUP-BASELINE-TERMINAL-VERIFICATION-v1. Parent57975/child58050 absent. Old route/evidence immutable.
- timestamp: 2026-10-05T23:22:00Z
  checked: Safe terminal numeric fields parentRssBytes627642368, childRssObservedBytes607703040, physicalBytes10625024, freeBytes205825908736. These are terminal observations/retained peak, not an exact failure-sample receipt. Guard resource_threshold combines live RSS and cumulative time predicates; original initiating cause remains unknown until evidence supports attribution.

## Boundaries

No reader/provider/Strategy/Match/child/container/helper rerun. No old edits/recredit. All source/diagnosis costs carry33812347ms plus time since1791242322180 under43200000ms. New empirical route would need new bounded approval; this diagnosis grants none. Source-only optimization may be researched/planned/reviewed without changing any frozen resource/rule/privacy bounds. Current-rules league/freeze before formation; holdout unopened; no public/counted/production.
