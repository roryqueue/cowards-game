# Phase 136 Code Review

**Status:** Findings fixed
**Date:** 2026-05-25

## Findings

### Fixed: Retry taxonomy contradicted Go/runtime-service behavior

The initial retry artifact was too coarse and did not distinguish local request validation from response-side runtime-service failures. The artifact now lists Go retryable classes such as `RuntimeServiceStopped`, transport/read/oversized/malformed response failures, `RuntimeServiceContractMismatch(response-side)`, and runtime-service `EXECUTION_EXCEPTION`/`RESPONSE_SCHEMA_INVALID`. Non-retryable entries now include request/local contract validation, source mismatches, malformed requests, unsupported adapter, Strategy runtime violations, invalid Strategy output, validation failures, and non-counted eligibility violations.

### Fixed: Retry ownership and guardrails were under-asserted

The boundary monitor now asserts Go-owned retry policy, Match completion, scoring, public evidence ownership, Python non-ownership of backend behavior, Python non-counted eligibility, public evidence private-data safety, and no production sandbox promotion.

### Fixed: Internal adapter codes were listed as Go retry classes

The retry artifact initially listed `SPAWN_FAILED`, `STDIO_CAP_EXCEEDED`, `SUBPROCESS_SIGNAL`, `SUBPROCESS_EXIT`, and `MALFORMED_IPC` as retryable Go-visible failure classes. Those are internal runtime adapter codes, not Go runtime-service retry codes by name. The artifact now documents them separately and states that Go-visible retry behavior comes through `EXECUTION_EXCEPTION` or malformed runtime-service responses, while some Python adapter failures may complete as Match runtime-violation outcomes.

## Follow-Up Verification

- `pnpm sandbox:evaluate` passed.
- `pnpm sandbox:evaluate:container` passed.
- `pnpm sandbox:evaluate:check` passed.
- `COWARDS_RUN_CONTAINER_SANDBOX=1 pnpm exec tsx scripts/evaluate-runtime-sandbox.ts --check` passed.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` passed.
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` passed.
- `pnpm exec vitest run apps/runtime-service/src/execute-match.test.ts scripts/check-boundary-monitors.test.ts` passed.
