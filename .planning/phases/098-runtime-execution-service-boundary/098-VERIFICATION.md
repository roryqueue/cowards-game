# Phase 98: Runtime Execution Service Boundary - Verification

**Verified:** 2026-05-24
**Verifier:** the agent

## Goal-Backward Check

Phase goal: create a strict Go-to-TypeScript runtime execution service boundary while keeping the TypeScript process execution-only and DB-free.

Result: PASS.

## Evidence

- `packages/spec/src/runtime-execution-service.ts` defines `runtime-execution-service-v1.15` around the existing `strategy-runtime-abi-v1.14`.
- `apps/runtime-service` validates requests and responses with spec schemas and contains no persistence/pg/job/completion/scoring dependency.
- `apps/go-backend/runtime_service_client.go` validates source hash/bytes, timeouts, response byte limits, stopped-service/malformed-response behavior, and contract identity.
- `packages/spec/artifacts/runtime-execution-service-request.v1.15.json` is parsed by TypeScript and Go tests as the shared contract fixture.
- Runtime-service health returns `{"ok":true,"service":"runtime-execution-service-v1.15","runtimeAbiVersion":"strategy-runtime-abi-v1.14","adapter":"worker-thread"}`.

## Requirement Coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| RT-01 | PASS | The v1.15 runtime execution service schema carries complete Match inputs, Strategy metadata, arena, seed, players, and limits. |
| RT-02 | PASS | Runtime-service tests and imports prove the TypeScript service executes only behind the runtime ABI and has no job/completion/Chronicle/scoring writes. |
| RT-03 | PASS | Go runtime client validates source metadata but never imports, evaluates, transpiles, or executes Strategy source and contains no Node `vm` use. |
| RT-04 | PASS | Service/client tests cover runtime violations as valid execution outcomes and system failures as retryable/terminal envelopes. |
| RT-05 | PASS | Tests cover invalid output, timeout, malformed response, source hash mismatch, oversized output, stopped service, and redacted diagnostics. |
| RT-06 | PASS | Boundary monitors preserve worker-thread, subprocess, container-subprocess, and non-JS readiness labels. |

## Commands

```bash
pnpm --filter @cowards/spec test
pnpm --filter @cowards/spec typecheck
pnpm --filter @cowards/spec lint
pnpm --filter @cowards/runtime-service test
pnpm --filter @cowards/runtime-service typecheck
pnpm --filter @cowards/runtime-service lint
pnpm --filter @cowards/runtime-service build
pnpm exec tsc -b --pretty false
cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...
pnpm boundary:imports
pnpm exec tsx scripts/check-boundary-monitors.ts
STRATEGY_EXECUTION_ADAPTER=worker-thread pnpm --filter @cowards/runtime-service start
curl -sS http://127.0.0.1:3107/health
git diff --check
```

## Residual Risk

- Runtime execution still uses the existing worker-thread/subprocess/container adapter readiness labels; no production sandbox promotion was attempted.
- Phase 99 must consume the service response for Go-owned Match completion and Chronicle persistence.
