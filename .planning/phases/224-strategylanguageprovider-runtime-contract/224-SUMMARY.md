# Phase 224 Summary: StrategyLanguageProvider Runtime Contract

## Accomplished

- Added `STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION`.
- Added `StrategyLanguageProviderRecord` and `STRATEGY_LANGUAGE_PROVIDER_REGISTRY` covering:
  - JS/TS provider,
  - Python provider,
  - Rust WASI provider,
  - Zig WASI provider.
- Recorded ABI posture explicitly:
  - JS/TS: runtime-js source,
  - Python: source JSON,
  - Rust/Zig: WASI Preview 1 stdin/stdout JSON.
- Added provider lookup and compatibility helpers:
  - `getStrategyLanguageProviderRecord`
  - `validateStrategyLanguageProviderRuntimeCompatibility`
- Runtime-service now rejects provider/runtime mismatches before Runtime Broker dispatch.
- Runtime-service now rejects JS/TS adapter metadata drift when the revision adapter does not match the configured service adapter.
- Rust/Zig validation responses include provider id, contract version, ABI version, and ABI posture.
- Code review found one blocker, which was fixed and re-reviewed cleanly.

## Behavior Changes

- Invalid provider/runtime metadata now fails closed with `UNSUPPORTED_RUNTIME_ADAPTER`.
- Rust/Zig runtime-service validation responses now include public provider contract metadata.

## ABI Decision

WASI Preview 1 stdin/stdout JSON remains the active Rust/Zig ABI for Phase 224. Direct exports and Component Model/WIT remain deferred because this phase did not produce evidence requiring a migration.

## Verification

- `pnpm --filter @cowards/spec typecheck` passed.
- `pnpm --filter @cowards/spec test` passed: 4 files, 55 tests.
- `pnpm --filter @cowards/runtime-service typecheck` passed.
- `pnpm --filter @cowards/runtime-service test -- execute-match server` passed: 3 files, 25 tests.

