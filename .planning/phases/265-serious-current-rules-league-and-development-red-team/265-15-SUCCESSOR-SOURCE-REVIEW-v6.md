---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-04T00:12:49Z
depth: deep
source_commit: 14765a978b528bf5ff61ac6a5567dfd8d3cd5aaa
source_root: sha256:e4879404e048c8c78830f43350697c153a265875498419f9ec4ff9f2d8697337
source_manifest_entries: 863
author_agent: /root/fixture_265_15_full_verifier
co_author_agents:
  - /root
reviewer_agent: /root/review_265_15_import_crash
independently_reviewed: true
files_reviewed: 7
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-experiment.test.ts
  - scripts/assess-v1-38-factory-independence.ts
  - scripts/assess-v1-38-factory-independence.test.ts
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/run-v1-38-lean-experiment.test.ts
  - scripts/run-v1-38-lean-experiment.sh
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 265-15: Projection repair and closed-v4 successor source review v6

## Summary

I independently reviewed the seven-file integrated source diff from `1fe30e56a8a708905fd2f1cb5dc95b71f3acc1c8` through fixed HEAD `14765a978b528bf5ff61ac6a5567dfd8d3cd5aaa`, including the assessor's bounded pool, its historical-import callsite and synthetic tests, the closed-v4 predecessor/ledger integration, strict v5 runner and pre-Node launcher route, and their focused tests. The reviewed source paths have no uncommitted diff. Guarded inert import yielded the 863-entry `leanSourceManifest()` root recorded above. No findings remain in this source scope.

The bounded-import-only projection keeps the ordinary reader untouched. It uses an exact-value `Map` to return one canonical immutable string value for repeated payloads, retains newly cloned/frozen observation containers, and charges the 512-byte pool baseline, per-project bookkeeping, each occurrence/reference, container and property slot, plus one unique string payload/pool entry before `Map.set`. Object key-list overhead is reserved before `Object.keys` constructs that list. The charge fails closed at the unchanged 256-MiB cumulative projection ceiling; a failed pool cannot be reused. The observation call retains the unchanged 64-MiB per-cell token-emission ceiling and verifies each cell before projecting it. The inert full-48 fixture compares complete ordinary and bounded assessment values/roots and denies corrupted/missing evidence; root reports its 18/18 focused assessor/observation tests passed. These are source and synthetic-fixture conclusions, not a measured historical RSS peak.

The disjoint v5 store/temp/request/allocation route preserves v1–v4 readers and routes future writes by allocation version. The closed-v4 predecessor reopens bounded, exact raw allocation/request/entry/receipt/terminal/time/empty-ledger/report identities, fixed source and held HEAD, one closed interval and failed terminal, exact inventory, zero charges and all prior predecessor commitments. Its arithmetic carries `1,402,442 ms` (`1,362,476 + 39,966`), zero charges and the conservative `311,296`-byte terminal floor, which exceeds `126,976` measured surviving bytes and the `249,856` cumulative survivor/debit floor. Historical disk and RSS peaks remain unknown; no reset, refund or double count is admitted. The v4 terminal report's independently computed raw SHA-256 is `858d141008736e58d436e28aed54a9ff024e78d6d23127431f738bf06aeb1e93`, matching the fixed source literal. Runner and shell use the same version-owned v5 temporary and request paths while retaining the same caps and child/parent checks. Root reports 47 focused accounting/runner tests, types and shell checks passed, plus three boundary scans of 1,364 files with zero violations; I did not rerun those gates.

## Narrative Findings (AI reviewer)

No findings in the reviewed fixed source. This clean source-only review is a prerequisite to a distinct prospective request; it is not preparation, same-process capacity proof, historical importer execution, provider or Match evidence, pilot admission, or Phase credit. The consumed v4 failure remains an immutable failed terminal, and this review does not infer the cause of the earlier v3 failure.

---

_Reviewer: /root/review_265_15_import_crash; independent source-only review at fixed HEAD above._
