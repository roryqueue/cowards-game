# Phase 98: Runtime Execution Service Boundary - Plan

**Status:** Ready for execution
**Research:** `098-RESEARCH.md`
**Requirements:** RT-01, RT-02, RT-03, RT-04, RT-05, RT-06

## Objective

Create a DB-free TypeScript runtime execution service boundary that Go can call through a versioned JSON contract while preserving `strategy-runtime-abi-v1.14`.

## Tasks

1. Add shared runtime execution service contracts.
   - Define `runtime-execution-service-v1.15` request/response types and schemas in `@cowards/spec`.
   - Include complete Match inputs, Strategy Revision source/hash/bytes/runtime metadata, arena data, seed, player ids, execution limits, success result, runtime violation result, and system failure envelope.

2. Add a TypeScript execution-only service.
   - Create a service entrypoint that validates requests, builds Match runtime inputs, runs existing engine/replay/runtime-js ABI bridge behavior, and returns a schema-validated response.
   - Keep it DB-free: no `@cowards/persistence`, `pg`, job claiming, Match completion, Chronicle persistence, or scoring imports.

3. Add Go runtime service client.
   - Add strict request/response structs, timeout handling, source hash/byte validation, malformed/oversized response handling, and redacted diagnostics.
   - Map transport/service/malformed failures into Phase 97 system-failure envelopes.

4. Add tests.
   - TypeScript: valid execution, runtime violation, timeout/invalid output behavior, malformed request, source mismatch, import-boundary guard, and redaction.
   - Go: stopped service, malformed response, timeout, oversized response, source hash mismatch, system failure classification, and no Strategy execution in Go.

5. Update manifests/monitors.
   - Ensure v1.15 lifecycle manifest labels the TypeScript service `runtime_only`.
   - Verify readiness labels for worker-thread, subprocess, container-subprocess, and non-JS candidates are unchanged.

6. Write `098-SUMMARY.md`, `098-VERIFICATION.md`, and `098-VALIDATION.md`.

## Verification

- `pnpm --filter @cowards/spec test`
- Runtime service tests
- Go backend tests
- Boundary monitor/runtime adapter checks
- `git diff --check`

## Exit Criteria

- Go can call a strict TypeScript runtime service contract.
- TypeScript runtime service is execution-only and DB-less in normal topology.
- No runtime readiness or sandbox promotion occurs.
