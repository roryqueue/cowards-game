# Phase 97: Go Job Lifecycle and Persistence Contracts - Code Review

**Reviewed:** 2026-05-24
**Reviewer:** Lovelace (`gsd-code-reviewer`)
**Status:** Findings fixed

## Findings

### CR-01: BLOCKER - Empty Go Match allowlists claim every queued job

**File:** `apps/go-backend/job_lifecycle.go`

`claimNextMatchJob` used the global claim query whenever `len(input.MatchIDs) == 0`. That made an explicitly empty allowlist claim any queued or expired job, diverging from the TypeScript oracle and creating risk for targeted rollback/parity/test workers.

**Resolution:** `claimNextMatchJob` now distinguishes `nil` from an explicit empty slice and uses the allowlist SQL whenever `input.MatchIDs != nil`. DB integration coverage now asserts an empty allowlist claims nothing even when a queued job exists.

### CR-02: BLOCKER - Stale lease holders can mutate terminal jobs

**File:** `apps/go-backend/job_lifecycle.go`

`recordAttemptFailure` selected jobs by `id` and `lease_token` without requiring `status = 'running'`. A stale holder could mutate a terminal job into `failed_system`.

**Resolution:** failure recording now requires `status = 'running'`. DB integration coverage rejects duplicate failure recording after `failed_system` and rejects stale failure recording after a job has been marked `complete`.

### CR-03: BLOCKER - TypeScript normal worker remains fail-open unless env is set

**File:** `apps/worker/src/runner.ts`

The TypeScript worker ownership guard allowed `lifecycleOwner: "unspecified"` in normal mode, which meant a normal TypeScript worker could still claim jobs unless deployment config selected Go explicitly.

**Resolution:** normal TypeScript job claiming now requires `lifecycleOwner: "typescript"`. Rollback, test, and parity purposes remain explicitly allowed. Preflight, demo, and test-support worker call sites were updated to declare test/parity ownership rather than relying on the default.

### WR-01: WARNING - Critical Go SQL behavior is skipped in normal test runs

**File:** `apps/go-backend/job_lifecycle_test.go`

The DB lifecycle integration suite requires `COWARDS_GO_BACKEND_TEST_DATABASE_URL`, so default `go test ./...` skips SQL behavior.

**Resolution:** The phase verification now runs both default Go tests and DB-backed Go tests after `pnpm services:up`. Keeping the default skip is intentional so routine Go tests do not require Docker, but SQL behavior is required in the phase verification command set.

## Verification After Fixes

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm exec vitest run apps/worker/src/runner.test.ts apps/web/app/api/test-support/run-worker-once/route.test.ts`
- `cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL='postgresql://cowards:cowards@localhost:5432/cowards_game' PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm boundary:imports`
- `git diff --check`
