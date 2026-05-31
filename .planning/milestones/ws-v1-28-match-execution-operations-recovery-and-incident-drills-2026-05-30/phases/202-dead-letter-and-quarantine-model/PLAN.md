# Phase 202 Plan: Dead-Letter and Quarantine Model

**Goal:** Add deterministic private dead-letter/quarantine semantics for exhausted and non-retryable execution jobs.

## Tasks

1. Add a private persistence table for execution quarantine records.
2. Add Go helpers for deterministic quarantine IDs, retry-exhausted versus non-retryable reason classification, and operator evidence sanitization.
3. Hook terminal execution failure handling so quarantine records are written transactionally with job, Match, and MatchSet state updates.
4. Add unit tests for reason classification and operator evidence redaction.
5. Extend Go job lifecycle integration tests so retryable non-terminal failures do not quarantine, exhausted failures do quarantine, and non-retryable terminal failures quarantine immediately.
6. Record proof artifacts and update requirement traceability.

## Verification

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm --filter @cowards/persistence test`

## Expected Outputs

- `packages/persistence/migrations/0007_match_execution_operations.sql`
- `apps/go-backend/match_execution_quarantine.go`
- `apps/go-backend/job_lifecycle.go`
- `apps/go-backend/job_lifecycle_test.go`
- `.planning/artifacts/v1.28-dead-letter-quarantine-model.{md,json}`
- Phase `SUMMARY.md`
