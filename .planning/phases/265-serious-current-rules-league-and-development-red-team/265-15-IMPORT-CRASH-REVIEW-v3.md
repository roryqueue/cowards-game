---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03T19:28:48Z
depth: deep
source_commit: 817ab595d9d976599f47fb5717486a9573ffc3ac
reviewer_agent: /root/review_265_15_import_crash
files_reviewed: 6
files_reviewed_list:
  - scripts/assess-v1-38-factory-independence.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-lean-experiment.sh
  - scripts/run-v1-38-lean-experiment.ts
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/factory/repository.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Plan 265-15 import/crash source re-review, v3

Fixed-snapshot, source-only review of production changes in `71651d61`, `f6c82997`, and `817ab595`, including the dependent factory artifact reader. I did not run the private historical reader, prepare a pilot, invoke a provider/container/Match/model, or reexecute tests. The root agent owns the already-running inert test command. The separate WR-01 complete synthetic verifier fixture was reviewed cleanly at `d8bc1105`; this report does not duplicate that review.

## Narrative Findings (AI reviewer)

### CR-01 — BLOCKER: bounded import can allocate an oversized artifact before enforcing its byte cap

**File:** `scripts/run-v1-38-serious-league.ts:281-285`; `packages/strategy-lab/src/factory/repository.ts:16,63`

**Issue:** The new lean filename preflight correctly limits names and rejects extra attempt files before parsing attempt bodies. But `indexFactory` then calls `readFactoryArtifact` for *every* artifact name. Its shared `boundedRead` checks `isFile()`, calls `readFileSync(path)`, and only afterward checks the 262,144-byte cap. The index's `maxArtifactBytes` accounting also runs after that read. Thus a single oversized `factory-artifact-<digest>.bin` in an otherwise valid 48-attempt repository can allocate an arbitrarily large Buffer before the capacity callback, per-artifact cap, or import budget can reject it. The bounded reassessor's canonical-record and supervision calls use this reader as well. A file-size denial after allocation does not protect the precharge crash boundary.

**Fix:** In the common artifact reader, reject `lstat` size above `CAP` before reading; preferably open with `O_NOFOLLOW`, `fstat` the opened descriptor, read at most `CAP + 1` bytes, and reject growth/race before returning. Preserve the existing digest and canonical checks and ordinary API result for valid artifacts. Add one inert lean-import fixture with 48 valid attempt filename pairs and one oversized artifact whose name is syntactically valid; assert rejection before any whole-file read or index parse. No old private artifact is needed.

## Fixed code and remaining admission boundary

The `71651d61` preflight streams directory entries under a finite name count, requires exactly 48 start/terminal pairs, and runs before attempt-body parsing; the ordinary ledger reader retains its default route. The `817ab595` shell clears report/cache/warning/coverage environment settings before Node, disables core files, routes `TMPDIR` to a pilot-owned path, and is included in `leanSourceManifest()`. The runner rechecks the inherited scope; v2 physical accounting includes the owned temp path and allocation file, while v1 accounting remains on its prior branch. These source observations do not cure CR-01's whole-file read.

The `f6c82997` historical-bound validator is correctly fail-closed at `HISTORICAL_CORE_CACHE_BOUNDS_ESTABLISHED = false`: neither a present-day zero nor a self-asserted inventory can open v2 allocation. Establishing or revising a defensible historical core/cache disk bound is a separate pending human accounting decision, not an additional code finding or a reason to demand human verification of the source fixes above. This report approves no disk policy, resource receipt, empirical pilot, or phase pass.

The uncommitted lower-level parser test change from 48 repeated multi-chunk shapes to three does not change this production snapshot. The genuine full-verifier fixture still covers 48 total cells, but neither test covers CR-01's oversized-artifact pre-read allocation. The author's reported focused/unit and type results are not independent evidence of that boundary.
