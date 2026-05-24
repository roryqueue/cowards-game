# Phase 97: Go Job Lifecycle and Persistence Contracts - Verification

**Verified:** 2026-05-24
**Verifier:** the agent

## Goal-Backward Check

Phase goal: move normal Match job lifecycle primitives to Go while keeping TypeScript as a parity/rollback/test path and preventing mixed DB-owning workers.

Result: PASS.

## Evidence

- Go lifecycle contract exists in `apps/go-backend/job_lifecycle.go`.
- Go tests in `apps/go-backend/job_lifecycle_test.go` cover pure retry/redaction helpers and DB-backed lifecycle transitions.
- TypeScript worker guard exists in `apps/worker/src/runner.ts`.
- Worker tests in `apps/worker/src/runner.test.ts` prove Go-selected and unspecified normal TS claiming fails before `claimNextMatchJob`, while explicit TypeScript ownership and rollback/test/parity purposes remain allowed.
- Boundary import check remains at `strict_offenses=0 report_only_offenses=29`.

## Requirement Coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| ORCH-01 | PASS | Go claim contract covers queued/running selection, lease tokens, attempt numbering, expired lease reclaim, and DB locking semantics. |
| ORCH-02 | PASS | Go heartbeat and lease extension reject stale or mismatched leases. |
| ORCH-03 | PASS | Go attempt failure recording covers retryable failures, retry exhaustion, failed-system Match status, attempt rows, and redacted diagnostics. |
| ORCH-04 | PASS | Lifecycle contracts are parity-tested against TypeScript job/completion/worker behavior. |
| ORCH-05 | PASS | TypeScript worker guard blocks normal TypeScript DB claiming when Go ownership is selected or unspecified. |
| ORCH-06 | PASS | Lifecycle ownership manifest and phase docs capture rollback/no-fallback behavior for running jobs, leases, retries, and incomplete MatchSets. |
| ORCH-07 | PASS | Go lifecycle diagnostics are redacted and public-output monitors reject private runtime/source/session/DB fields. |
| ORCH-08 | PASS | Go tests cover successful claim, idle, lease mismatch, expired reclaim, retry queueing, retry exhaustion, and duplicate-claim prevention. |

## Commands

```bash
cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...
pnpm exec vitest run apps/worker/src/runner.test.ts apps/web/app/api/test-support/run-worker-once/route.test.ts
pnpm services:up
cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL='postgresql://cowards:cowards@localhost:5432/cowards_game' PATH=/usr/local/go/bin:$PATH go test ./...
pnpm boundary:imports
git diff --check
```

## Residual Risk

- Go does not yet run the Strategy runtime worker, complete Matches, persist Chronicles, or score MatchSets. That is expected and tracked by Phases 98 through 100.
- Integration tests require `COWARDS_GO_BACKEND_TEST_DATABASE_URL`; without it, the DB-backed lifecycle test skips and pure Go tests still run.
