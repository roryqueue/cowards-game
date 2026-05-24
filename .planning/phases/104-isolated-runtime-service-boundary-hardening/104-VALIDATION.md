# Phase 104 Validation

## Scope

Phase 104 hardens the current isolated JS/TS runtime service as the v1.16 HTTP+JSON binding for the broker-ready **Strategy Execution Service / Runtime Broker** contract. It does not build the future broker, replace JS/TS execution, promote WASM/WASI/component-model, promote counted non-JS play, or replace the production sandbox boundary.

## Commands Run

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm exec vitest run packages/spec/src/spec.test.ts` | PASS | 33 spec contract tests passed, including v1.16 runtime boundary artifact checks. |
| `pnpm --filter @cowards/spec contract:check` | PASS | Service OpenAPI artifact check stayed current. |
| `node -e "const fs=require('node:fs'); const j=JSON.parse(fs.readFileSync('.planning/artifacts/v1.16-runtime-service-boundary.json','utf8')); for (const key of ['strategyExecutionService','currentImplementation','transport','runtimeAbi','authority','submissionArtifactPolicy','failurePrivacy','noFallback','nonPromotion']) if (!(key in j)) throw new Error('missing '+key);"` | PASS | Machine-readable runtime boundary artifact contains all required top-level sections. |
| `pnpm exec vitest run apps/runtime-service/src/execute-match.test.ts apps/runtime-service/src/server.test.ts apps/runtime-service/src/redaction.test.ts` | PASS | 18 runtime-service tests passed for schema failures, source mismatch, HTTP route narrowness, redaction, and authority scans. |
| `pnpm --filter @cowards/runtime-service typecheck` | PASS | Runtime-service package and referenced spec package typechecked. |
| `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'RuntimeServiceClient'` | PASS | Runtime service client tests passed, including local source validation, ABI drift, stopped service, timeout, oversized response, sanitized service failures, and no fallback request path. |
| `pnpm exec vitest run scripts/check-boundary-monitors.test.ts` | PASS | 7 monitor tests passed, including v1.16 runtime boundary artifact validation and live repository monitor checks with mocked local topology. |
| `pnpm typescript-backend:inventory:check` | PASS | v1.16 TypeScript backend inventory artifacts are current after adding runtime-service boundary tests and monitor checks. |
| `pnpm boundary:monitors` | PARTIAL | Contract, privacy, import-boundary, inventory, Go parity, sandbox, and new Phase 104 boundary monitor checks passed. Live topology failed because local web, Go, runtime-service, and auth-gated endpoints were not running. |

## Requirement Evidence

| Requirement | Evidence |
| --- | --- |
| RT-01 | `.planning/artifacts/v1.16-runtime-service-boundary.json`, `.planning/artifacts/v1.16-runtime-service-boundary.md`, and `packages/spec/src/runtime-execution-service.ts` define the Strategy Execution Service / Runtime Broker contract, HTTP+JSON binding, runtime ABI, schema envelopes, limits, diagnostics, crash/fail-closed behavior, privacy, and no-fallback policy. |
| RT-02 | Runtime-service tests and `scripts/check-boundary-monitors.ts` verify JS/TS execution remains in `apps/runtime-service` and `packages/runtime-js` adapter boundaries, with no forbidden execution imports in Go/web API files. |
| RT-03 | Runtime-service authority tests and monitors reject DB, job, Match completion, Chronicle persistence, MatchSet scoring, product API, web session, public evidence, and retired TypeScript backend ownership markers. |
| RT-04 | Spec metadata, Go client constants, Go tests, and monitor checks keep `runtime-execution-service-v1.15` and `strategy-runtime-abi-v1.14` synchronized. |
| RT-05 | Runtime-service and Go tests cover malformed requests, ABI drift, source hash/byte mismatch, oversized requests/responses, invalid outputs as runtime violations, execution exceptions, unsafe diagnostics, response schema invalid paths, and public-safe artifacts. |
| RT-06 | Monitor checks scan Go and web files for runtime worker imports, `createRuntimeFromRevision`, Node `vm`, and Node `node:wasi` promotion markers outside the runtime boundary. |
| RT-07 | Spec readiness wording and monitor validation keep worker-thread, subprocess, container-subprocess, non-JS, WASM/WASI, and component-model statuses as readiness/evaluation labels with no v1.16 production sandbox or counted non-JS promotion. |

## Artifacts

- `.planning/artifacts/v1.16-runtime-service-boundary.json`
- `.planning/artifacts/v1.16-runtime-service-boundary.md`
- `.planning/phases/104-isolated-runtime-service-boundary-hardening/104-VALIDATION.md`

## Boundary Monitor Evidence

`pnpm boundary:monitors` passed these lanes before the live topology failure:

- `contract:check`
- `contract:lint`
- `boundary:imports` with `strict_offenses=0 report_only_offenses=29`
- `typescript-backend:inventory:check`
- `go:parity`
- `sandbox:evaluate:check`
- Phase 104 monitor checks for the v1.16 runtime boundary artifact, runtime-service production authority, and no Strategy execution outside the runtime boundary.

The final live topology lane failed because the local services were not running. Startup commands reported by the topology helper:

- `pnpm services:up`
- `pnpm --filter @cowards/runtime-service start`
- `cd apps/go-backend && COWARDS_GO_BACKEND_OWNER_TOKENS=<redacted>=user:local go run .`
- `cd apps/go-backend && COWARDS_GO_BACKEND_DATA_MODE=live redacted-db-env COWARDS_RUNTIME_SERVICE_URL=http://127.0.0.1:3107 go run .`
- `COWARDS_GO_PUBLIC_STRATEGY_READS=1 COWARDS_GO_BACKEND_URL=http://127.0.0.1:8087 pnpm --filter @cowards/web dev`
- `pnpm topology:check -- --require-web-go-public-strategy-read --web-url http://localhost:3000`

Residual risk: the full live web -> Go -> isolated runtime-service topology was not proven in this execution turn. Focused contract, runtime, Go client, inventory, sandbox, and monitor logic passed; live endpoint availability remains the only incomplete evidence.

## Expected 104-SUMMARY.md Contents

- Requirements completed: RT-01 through RT-07.
- Decisions covered: D-01 through D-18.
- Artifacts created and files modified.
- Validation commands and results, including partial `pnpm boundary:monitors` live topology evidence.
- Confirmation that no deferred ideas were promoted.
- Deviation note that v1.16 TypeScript backend inventory artifacts were regenerated to keep `typescript-backend:inventory:check` current after Phase 104 test and monitor additions.
