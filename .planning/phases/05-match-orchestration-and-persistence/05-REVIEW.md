---
phase: 05
status: issues_found
depth: standard
reviewed_at: 2026-05-17T18:28:08.000Z
scope: phase-05-source-changes
files_reviewed: 10
findings:
  critical: 0
  warning: 3
  info: 0
  total: 3
---

# Phase 05 Code Review

## Findings

### F-01: Worker dispatch ignores persisted player IDs

- Severity: warning
- Files: `apps/worker/src/runner.ts:32`, `apps/worker/src/runner.ts:83`
- Requirements: MATCH-01, MATCH-02, MATCH-04
- Status: open

`loadRunMatchInput` preserves `bottomPlayerId` and `topPlayerId` from the persisted Match, but `createSideDispatchRuntime` routes strategy calls only when the owner is exactly `player:bottom` or `player:top`. Any Match or MatchSet created with other valid Player IDs, including the custom matrix path already covered in tests with `player:a` and `player:b`, will route both sides to `INVALID_OUTPUT` instead of the submitted strategy runtime. This makes valid persisted Matches execute incorrectly outside the seed/default IDs.

Recommended fix: pass the persisted bottom/top Player IDs into `createSideDispatchRuntime`, compare against those values, and add a worker test that loads a Match using non-default Player IDs.

### F-02: MatchSet creation bypasses revision locking and input validation

- Severity: warning
- Files: `packages/persistence/src/matchset-service.ts:64`, `packages/persistence/src/match-service.ts:47`
- Requirements: MATCH-02, MATCH-03, DATA-02
- Status: open

Single Match creation validates inputs, confirms both Strategy Revisions and the Arena Variant exist, and locks both Strategy Revisions before inserting the Match. MatchSet creation inserts the matrix directly into `matches`, `match_jobs`, and `match_set_matches` without calling the same checks or locking either revision. Foreign keys will reject missing rows, but they do not enforce the Phase 5 immutability rule that Strategy Revisions become locked before MatchSet use, and the service also skips seed/string validation.

Recommended fix: share the Match creation validation/locking path inside MatchSet creation, or factor a transaction-scoped helper that validates every matrix entry and locks all distinct Strategy Revisions before inserting the MatchSet.

### F-03: Scoring tie-breakers use match-level survivor totals for both strategies

- Severity: warning
- Files: `packages/persistence/src/complete-match.ts:22`, `packages/persistence/src/scoring.ts:55`, `packages/persistence/migrations/0001_initial.sql:64`
- Requirements: MATCH-06
- Status: open

`deriveMatchCompletionFields` stores only aggregate `surviving_soldiers` and `survival_turns` at the Match level, and `scoreMatchSet` adds those same values to both the bottom and top strategy scores. That means the cumulative surviving-soldier tie-breaker cannot distinguish which strategy actually preserved more Soldiers; both participants receive the same survivor count for every completed Match. The current ranking tests pass because they use one strategy pair per Match, so the duplicated survivor value still affects ordering globally, but it does not implement per-strategy cumulative survivor scoring for a head-to-head Set.

Recommended fix: persist per-side completion stats, for example bottom/top surviving Soldiers and bottom/top survival turns if that metric is also side-specific, then feed those side-specific values into `scoreMatchSet`.

## Fixed During Prior Review

### P-01: Chronicle persisted before lease validation

- Severity: warning
- Files: `packages/persistence/src/complete-match.ts`, `packages/persistence/src/chronicle-store.ts`
- Resolution: moved Chronicle storage into the completion transaction after validating the running job lease. `createPostgresChronicleStore` now accepts a transaction-capable query object so completion can validate lease, store Chronicle, and update Match/job records under one transaction boundary.

### P-02: Chronicle metadata used fixed player IDs

- Severity: info
- Files: `packages/persistence/src/chronicle-store.ts`, `packages/persistence/src/chronicle-store.test.ts`
- Resolution: metadata extraction now derives player IDs from Chronicle events where possible, falling back only when the artifact lacks player information. Tests assert bottom/top player metadata is extracted.

## Verification

Review-only update. No tests were run.
