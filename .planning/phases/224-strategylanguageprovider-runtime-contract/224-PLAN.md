# Phase 224 Plan: StrategyLanguageProvider Runtime Contract

## Objective

Define the provider/runtime contract that all v1.32 languages use, make ABI posture explicit, and add runtime-service compatibility checks without moving hostile Strategy execution into web/API/Go.

## Tasks

1. Add a provider contract in `@cowards/spec`.
   - Define provider contract version, provider records, ABI posture, validation/build/execution ownership, failure taxonomy, evidence requirements, boundary rules, and migration notes.
   - Cover JS/TS, Python, Rust/WASI, and Zig/WASI providers.

2. Add provider compatibility validation.
   - Expose provider lookup and runtime compatibility helpers.
   - Validate runtime language, adapter, ABI, and runtime target against provider records.

3. Enforce provider compatibility in runtime-service.
   - Reject provider/runtime mismatches before Runtime Broker dispatch.
   - Reject JS/TS revisions whose declared runtime adapter does not match the configured runtime-service adapter.
   - Preserve runtime-service as the Strategy execution boundary.

4. Expose provider identity on runtime-service validation.
   - Include provider id, contract version, runtime ABI version, and ABI posture in Rust/Zig validation responses.

5. Review and verify.
   - Run code review and fix findings.
   - Run spec and runtime-service tests/typechecks.

## Non-Goals

- Do not promote Python/Rust/Zig to counted play.
- Do not migrate away from WASI Preview 1 stdin/stdout JSON.
- Do not change Go/web/API to execute Strategy code.
- Do not alter public replay/result DTO privacy shape in this phase.

## Verification

- `pnpm --filter @cowards/spec typecheck`
- `pnpm --filter @cowards/spec test`
- `pnpm --filter @cowards/runtime-service typecheck`
- `pnpm --filter @cowards/runtime-service test -- execute-match server`

