# Phase 203 Plan: Internal Requeue and Rerun Controls

**Goal:** Add Go-owned operator recovery controls with idempotency guards and no duplicate public evidence.

## Tasks

1. Add private operator action persistence with idempotency keys.
2. Add Go recovery service that validates active quarantine, terminal failed state, no Chronicle, and recoverable failure category.
3. Add internal-token endpoints for requeue and rerun.
4. Preserve attempts while granting one additional bounded operator-authorized attempt.
5. Release quarantine and refresh MatchSet state in the same recovery transaction.
6. Add integration tests for applied requeue, duplicate idempotency, stale-artifact rejection, and no public/private leaks.
7. Record proof artifacts and update traceability.

## Verification

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm --filter @cowards/persistence test`
