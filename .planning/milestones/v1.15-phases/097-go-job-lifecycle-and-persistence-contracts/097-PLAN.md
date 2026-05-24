# Phase 97: Go Job Lifecycle and Persistence Contracts - Plan

**Status:** Ready for execution
**Research:** `097-RESEARCH.md`
**Requirements:** ORCH-01, ORCH-02, ORCH-03, ORCH-04, ORCH-05, ORCH-06, ORCH-07, ORCH-08

## Objective

Move normal Match job lifecycle primitives to Go with TypeScript parity and no mixed DB-owning workers.

## Tasks

1. Implement Go lifecycle contracts in `apps/go-backend`.
   - Add claim queued/expired-running jobs with `FOR UPDATE SKIP LOCKED`, attempt rows, lease tokens, and injected clock/token seams.
   - Add heartbeat/lease extension that rejects stale or mismatched leases.
   - Add retryable and exhausted system-failure recording with redacted diagnostics.

2. Add Go tests for lifecycle behavior.
   - Cover claim success, idle, duplicate-claim prevention, expired lease reclaim, heartbeat success, lease mismatch, retry queueing, retry exhaustion, and invalid lease failure recording.
   - Keep tests deterministic through injected clock/token generation.

3. Add TypeScript parity fixture coverage.
   - Preserve current `packages/persistence/src/jobs.ts` behavior as oracle.
   - Add fixture or test assertions for retry exhaustion and lifecycle decision logic where a live DB parity fixture is too expensive.

4. Prevent TypeScript DB worker ownership creep.
   - Add an explicit normal/rollback/test ownership guard around TypeScript worker job claiming.
   - Ensure Go-selected normal orchestration does not silently allow TypeScript worker claim/completion.

5. Document rollback/no-fallback behavior.
   - Cover queued jobs, running jobs, expired leases, retries, and incomplete MatchSets.
   - Update lifecycle manifest or phase summary if implementation changes surface details.

6. Write `097-SUMMARY.md`, `097-VERIFICATION.md`, and `097-VALIDATION.md`.

## Verification

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- Focused TypeScript worker/persistence tests for ownership guard and parity.
- `pnpm boundary:imports`
- `git diff --check`

## Exit Criteria

- Go can claim, heartbeat, retry, exhaust, and fail Match jobs with parity.
- TypeScript DB worker is explicit rollback/test/parity only when Go lifecycle ownership is selected.
