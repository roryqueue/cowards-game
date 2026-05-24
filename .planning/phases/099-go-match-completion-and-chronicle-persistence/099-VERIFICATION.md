# Phase 99: Go Match Completion and Chronicle Persistence - Verification

**Verified:** 2026-05-24
**Verifier:** the agent

## Goal-Backward Check

Phase goal: make Go the normal owner of Match completion and Chronicle persistence after a valid running lease and validated execution result.

Result: PASS.

## Evidence

- `apps/go-backend/completion.go` owns the completion transaction.
- `apps/go-backend/completion_test.go` covers completion derivation, Chronicle validation, DB-backed completion, idempotency, invalid lease, wrong-job lease, outcome drift, hash normalization, and invalid Chronicle failure.
- Existing TypeScript oracle tests for completion fields, Chronicle storage, and public projection still pass.

## Commands

```bash
cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...
cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL='postgresql://cowards:cowards@localhost:5432/cowards_game' PATH=/usr/local/go/bin:$PATH go test ./...
pnpm exec vitest run packages/persistence/src/complete-match.test.ts packages/persistence/src/chronicle-store.test.ts packages/replay/src/project.test.ts
git diff --check
```

## Residual Risk

Go completion uses conservative Chronicle metadata validation in this phase rather than a full Go port of every TypeScript replay validator. Existing TypeScript replay/projection tests remain the compatibility oracle until later hardening.
