# Phase 98: Runtime Execution Service Boundary - Summary

**Completed:** 2026-05-24
**Status:** Complete

## What Changed

- Added `runtime-execution-service-v1.15` request/response contracts and schemas in `@cowards/spec`.
- Added `apps/runtime-service`, a DB-free TypeScript execution service with `/health` and `/execute-match`.
- The runtime service validates requests, checks Strategy Revision source hash/bytes, builds the existing `strategy-runtime-abi-v1.14` runtime bridge, executes `buildChronicleFromMatch`, and returns schema-validated success or redacted system-failure envelopes.
- Added a Go runtime-service client with timeout, stopped-service, malformed-response, oversized-response, source-mismatch, contract-drift, and redaction tests.
- Added the runtime service to the root TypeScript project graph.
- Fixed code-review findings by allowing self-play revisions, adding a shared golden request fixture parsed by TypeScript and Go, redacting Go diagnostics case-insensitively, marking success payloads as internal runtime results, bounding request-controlled limits, and requiring explicit runtime adapter configuration outside local-dev fallback.

## Requirements Covered

- RT-01: Contract carries complete Match execution inputs, Strategy Revision source/hash/bytes/runtime metadata, arena data, seed, player ids, and limits.
- RT-02: TypeScript runtime service is execution-only and DB-free; tests assert no persistence, `pg`, job claiming, completion, or scoring imports/dependencies.
- RT-03: Go client validates and transports JSON only; it does not import, transpile, evaluate, or execute Strategy source.
- RT-04: Runtime violations remain successful Match execution outcomes; service/transport/schema/source failures become redacted system-failure envelopes.
- RT-05: Tests cover malformed requests, source mismatch, malformed/oversized/stopped/timeout Go client cases, runtime violation, and redaction.
- RT-06: Runtime ABI remains `strategy-runtime-abi-v1.14`; adapter readiness labels were not promoted.

## Verification Run

- `pnpm --filter @cowards/spec test`
- `pnpm --filter @cowards/spec typecheck`
- `pnpm --filter @cowards/spec lint`
- `pnpm --filter @cowards/runtime-service test`
- `pnpm --filter @cowards/runtime-service typecheck`
- `pnpm --filter @cowards/runtime-service lint`
- `pnpm --filter @cowards/runtime-service build`
- `pnpm exec tsc -b --pretty false`
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm boundary:imports`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
- `STRATEGY_EXECUTION_ADAPTER=worker-thread pnpm --filter @cowards/runtime-service start`
- `curl -sS http://127.0.0.1:3107/health` while runtime service was running
- `git diff --check`

## Notes

Phase 98 intentionally does not complete Matches, persist Chronicles, score MatchSets, promote the container sandbox, or retire the TypeScript runtime. Those remain later-phase or v1.16 responsibilities.
