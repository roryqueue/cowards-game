# Phase 97: Go Job Lifecycle and Persistence Contracts - Summary

**Completed:** 2026-05-24
**Status:** Complete

## What Changed

- Added Go-owned Match job lifecycle primitives in `apps/go-backend/job_lifecycle.go`.
- Added deterministic Go tests for retry exhaustion, diagnostics sanitization, and DB-backed claim/heartbeat/reclaim/retry/failure behavior.
- Added a TypeScript worker ownership guard so normal TS job claiming is blocked when Go is selected as lifecycle owner.
- Updated worker tests to cover fail-closed normal ownership and explicit rollback/test/parity allowances.
- Updated preflight, demo, and web test-support worker call sites so their TypeScript worker use is explicitly test/parity-only.

## Requirements Covered

- ORCH-01: Go claim mirrors queued and expired-running selection with `FOR UPDATE SKIP LOCKED`, lease tokens, attempt rows, and attempt numbering.
- ORCH-02: Go heartbeat updates only running jobs whose lease token matches.
- ORCH-03: Go failure recording preserves retry queueing, exhaustion, attempt status, Match `failed_system`, and redacted diagnostic details.
- ORCH-04: TypeScript job lifecycle remains the parity oracle; worker tests cover guard behavior and ABI-realistic runtime invocation.
- ORCH-05: normal TypeScript DB worker claiming fails closed unless TypeScript is explicitly selected as owner or the worker declares rollback, test, or parity purpose.
- ORCH-06: Rollback/no-fallback behavior is explicit: stop Go lifecycle workers before enabling the legacy TypeScript DB-owning worker.
- ORCH-07: Go failure details are allowlisted and omit source, stderr, stack traces, tokens, and nested unsafe payloads.
- ORCH-08: Go tests cover claim, idle, duplicate running prevention, heartbeat mismatch, heartbeat success, expired reclaim, retry queueing, exhaustion, and invalid lease failure recording.

## Rollback / No-Fallback Notes

- Normal mode: TypeScript worker job claiming fails closed unless TypeScript is explicitly selected as lifecycle owner or the worker is explicitly marked rollback/test/parity.
- Rollback mode: stop Go orchestration first, then start the legacy TypeScript worker with `COWARDS_TYPESCRIPT_WORKER_PURPOSE=rollback`.
- Running jobs are recovered by lease expiry and reclaim; there is no silent mixed Go/TypeScript DB ownership.
- Incomplete MatchSets remain incomplete until their Match jobs are reclaimed or failed by the selected lifecycle owner.

## Verification Run

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm exec vitest run apps/worker/src/runner.test.ts`
- `pnpm services:up`
- `cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL='postgresql://cowards:cowards@localhost:5432/cowards_game' PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm boundary:imports`
- `git diff --check`

## Notes

Phase 97 intentionally does not invoke the TypeScript runtime service from Go, complete Matches, persist Chronicles, or score MatchSets. Those are Phase 98 through Phase 100 responsibilities.
