---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03T22:01:34Z
depth: deep
source_commit: a5baa65051e0eaa05c0dc0ef9c2bfdfed9725d28
source_root: sha256:28dbd0ec7de8954d53ffa67ff3b4db34b0a6c6f0ec02b501950f1ef7c8d58695
source_manifest_entries: 862
author_agent: /root/fixture_265_15_full_verifier
reviewer_agent: /root/review_265_15_import_crash
independently_reviewed: true
files_reviewed: 4
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-experiment.test.ts
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/run-v1-38-lean-experiment.sh
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 265-15: Retained-disk amendment re-review

## Summary

CR-01 from the v1 review is closed at the fixed source commit above. For v2, `createLeanLedger` now checks measured surviving bytes, the three existing prospective writable destinations, any store blocks, a projected new file and reserve, plus the unspent filesystem envelope **before `mkdirSync`**. After admission remeasures the six-file historical surviving basis, it checks the admitted predecessor count again before directory creation and before each of the three exclusive store writes. The new near-cap synthetic test requires a `RESOURCE` refusal with no store directory. The legacy v1 branch and the old historical-numeric-bound denial were not changed by this commit.

I traced the preparation callsite through canonical allocation publication and the normal entry, Match-ledger, result and terminal write paths. This narrow source review found no remaining code defect in the CR-01 repair or its future-write integration. The actual `leanSourceManifest()` root was independently recomputed through the guarded inert import and is recorded above. Author-reported 28 focused tests, types and shell checks passed; I did not rerun them or invoke preparation, a private historical reader, provider, or Match.

## Narrative Findings (AI reviewer)

No findings in this scoped re-review. This is source approval only. It does not certify live filesystem capacity, historical peak disk or RSS, a private pilot result, or Phase passage. The approved prospective disk policy continues to record the past peak as unknown, count surviving allocated files and constrain future writes under the unchanged 15 GB total and 12 GB retained-file envelopes; the separate time carry-forward remains 565,459 ms.

---

_Reviewer: /root/review_265_15_import_crash; source-only review at the fixed commit above._
