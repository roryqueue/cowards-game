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
