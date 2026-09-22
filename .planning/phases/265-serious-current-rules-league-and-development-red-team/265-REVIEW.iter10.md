---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-09-22T01:28:05Z
depth: deep
reviewed_head: 9fb22f92c09a1f4f2480101063b6df76f44f8a81
reviewed_source: 65b5cf63662f46151b8ddcb014d5799594e4c0de
diff_base: 98e4392e
files_reviewed: 47
files_reviewed_list:
  - .github/workflows/ci.yml
  - packages/strategy-lab/src/factory/fingerprint.test.ts
  - packages/strategy-lab/src/factory/fingerprint.ts
  - packages/strategy-lab/src/factory/repository.test.ts
  - packages/strategy-lab/src/factory/repository.ts
  - packages/strategy-lab/src/index.ts
  - packages/strategy-lab/src/league/allocation.test.ts
  - packages/strategy-lab/src/league/allocation.ts
  - packages/strategy-lab/src/league/connected-runner.test.ts
  - packages/strategy-lab/src/league/connected-runner.ts
  - packages/strategy-lab/src/league/contracts.test.ts
  - packages/strategy-lab/src/league/contracts.ts
  - packages/strategy-lab/src/league/fixtures.test.ts
  - packages/strategy-lab/src/league/fixtures.ts
  - packages/strategy-lab/src/league/identity.test.ts
  - packages/strategy-lab/src/league/identity.ts
  - packages/strategy-lab/src/league/integration.test.ts
  - packages/strategy-lab/src/league/matrix.test.ts
  - packages/strategy-lab/src/league/matrix.ts
  - packages/strategy-lab/src/league/psro.test.ts
  - packages/strategy-lab/src/league/psro.ts
  - packages/strategy-lab/src/league/red-team.test.ts
  - packages/strategy-lab/src/league/red-team.ts
  - packages/strategy-lab/src/league/report.test.ts
  - packages/strategy-lab/src/league/report.ts
  - packages/strategy-lab/src/league/repository.test.ts
  - packages/strategy-lab/src/league/repository.ts
  - packages/strategy-lab/src/league/selection.test.ts
  - packages/strategy-lab/src/league/selection.ts
  - packages/strategy-lab/src/league/solver.test.ts
  - packages/strategy-lab/src/league/solver.ts
  - scripts/assess-v1-38-factory-independence.test.ts
  - scripts/assess-v1-38-factory-independence.ts
  - scripts/check-v1-38-lab-boundaries.test.ts
  - scripts/check-v1-38-serious-league-boundaries.test.ts
  - scripts/check-v1-38-serious-league-boundaries.ts
  - scripts/lib/v1-38-league-authoring.test.ts
  - scripts/lib/v1-38-league-authoring.ts
  - scripts/lib/v1-38-league-execution-stream.ts
  - scripts/lib/v1-38-league-response-runtime.test.ts
  - scripts/lib/v1-38-league-response-runtime.ts
  - scripts/run-v1-38-serious-league.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/v1-38-factory-assessment-correction.test.ts
  - scripts/v1-38-factory-assessment-correction.ts
  - scripts/v1-38-factory-execution-evidence.test.ts
  - scripts/v1-38-factory-execution-evidence.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 265: Code Review Report

**Reviewed:** 2026-09-22T01:28:05Z
**Depth:** deep
**Files Reviewed:** 47
**Status:** one BLOCKER in the new execution-stream reader

## Summary

Commit `65b5cf63` repairs whole-execution canonical admission and the
result-before-journal publication order, while retaining the original small
v1 graph roots. This independent incremental deep trace found one writer/reader
limit mismatch in the new v2 format. The baseline 29-suite/269-test gate passed
on preceding source `9c910d82`; only focused tests and types are reported for
the new source. No Phase 265 empirical allocation or live run exists.

## Critical Issues

### CR-01 — v2 reader rejects a stream admitted within artifact limits (BLOCKER)

**File:** `scripts/lib/v1-38-league-execution-stream.ts:69,94`; writer:
`scripts/run-v1-38-serious-league.ts:102-115`.

**Issue:** `maxArtifactRecords` is the cap on stored artifact files. The writer
preflights and charges the stream's chunks, chunk nodes, stream descriptor and
parent graph artifacts against that cap. The reader additionally rejects when
`descriptor.recordCount`—the number of logical header/state/event/transition/
accounting *frames*—exceeds `maxArtifactRecords`. Those are different units.
The new oversized path is reachable: the focused test's 550 transitions with
300 small nested Soldier-like entries each exceed the canonical node limit,
forcing v2, but serialize into far fewer than 100 chunk/node/descriptor files.
With `maxArtifactRecords: 100` and adequate bytes, `LeagueRecordGraph.append`
can persist that result, while `readLeagueRecordGraph` calls the stream reader
and fails at its frame-count check (`recordCount` is at least 552). A durable
cell-result—and potentially an immutable success terminal—then cannot pass
retained verification despite staying within the declared artifact budget.
The existing test uses 10,000 records, masking this mismatch. No real Match or
historical artifact was executed or rewritten to establish this finding.

**Fix:** Keep `maxArtifactRecords` for actual artifacts (the graph reader's
unique-artifact inventory and the stream's `2 * chunkCount + 1` check). Validate
logical frame count and ordinals against authenticated `byteLength`, exact
descriptor counts, and a separate bounded frame rule derived from those bytes;
do not charge logical frames as artifact files or require a new allocation
field. Add a v2 regression that forces oversized admission with frame count
greater than the artifact cap but physical artifacts within it, then verifies
round-trip/reopen. Keep over-budget physical artifact, missing/reordered frame,
and bad-count rejection tests.

This is a format/readability defect in the same source plan, not an empirical
result or a request for more work authority.

## Narrative Findings (AI reviewer)

The only new supported finding is CR-01 above. The v2 writer preserves the
execution's required shape, including every event, transition, accounting
record, failure classification and code. Individual frames are canonicalized;
chunk bytes, ordered chunk links, ordered frame commitments, declared counts,
and reconstructed execution commitment are checked on read. A small execution
still uses its exact v1 graph bytes/root. Oversized events and whole-execution
values reach the v2 branch through the actual graph writer, including cell and
response results/failures. The defect is the extra frame-versus-file comparison,
not a failure to hash or order those records.

The graph still preflights the pending physical bytes and records before
publication and authenticates roots, links, cycles, and aggregate read budgets.
The connected runner publishes `cell-result` before the immutable journal
terminal. If a publication throws after terminal bytes are installed, the
process remains invalid, but retained verification can reopen the matching
persisted terminal without rewriting it. If no terminal was installed, the
failure prefix stays non-scorable. The preceding `executedCells` correction
counts a saved cell result even when the subsequent terminal is non-success.
These are source traces, not a filesystem fault-injection or full-suite result
for this new commit; a bounded after-link-sync failure regression would be
useful.

The previous deep 46-file review's eight original defects remain closed on
incremental source trace: ordinary-vs-emergency journal accounting;
preceding-target strength; charged failed-prefix reopening; bounded matrix
and report composition; comparison-only historical controls; honest final
round `not_closed`; immutable Factory terminal with post-terminal result
failure; and exact per-seed partial-report prefixes. The earlier compact graph
reader and host-issued fingerprint commitments still authenticate saved roots,
avoid retaining all Match payloads, and do not promote reopened data into
issuance. `deriveLeagueResultEventRoot`, `normalizedGameplayRoot`, and
`sameLargeResult`/`sameLargeExecution` preserve small-root equality while using
ordered oversized commitments consistently for writer and replay checks.
`diagnoseLeagueExecutionStorage` requires a fresh empty repository, stores
private data only, and grants no allocation, CLI, or empirical authority.

This review did not execute a Strategy, Match, provider, model, search, or long
test suite; read a historical private store; mutate evidence; or allocate an
empirical run. `empiricalRequirementsComplete: false` remains intentional.

---

_Reviewed: 2026-09-22T01:28:05Z_
_Reviewer: gsd-code-reviewer; depth: deep; source-only._
