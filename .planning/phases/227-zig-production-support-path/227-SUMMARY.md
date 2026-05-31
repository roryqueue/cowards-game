# Phase 227 Summary: Zig Production Support Path

## Accomplished

- Promoted Zig in the shared supported-language registry to counted eligible and normal-play enabled.
- Kept WASI Preview 1 stdin/stdout JSON as the active Zig ABI.
- Removed active Zig non-counted validation/product warnings.
- Kept Zig no-std/import restrictions, including `@import("std")`, filesystem, network, time, random, process, env, and embed-file rejection.
- Updated Zig runtime artifact public evidence to counted provider artifact evidence.
- Added runtime-service Zig provider-validation provenance bound to provider id, contract version, source hash/bytes, artifact hash/bytes, and HMAC proof.
- Required counted Zig entry to verify runtime metadata, provider proof, artifact metadata, decoded artifact bytes, target triple, WASI profile, ABI envelope/version, and validation status.
- Updated Workshop templates/save semantics, account/listing semantics, competition, ladder, Go backend entry gates, result evidence, Learn copy, exhibition copy, and runtime labels.
- Preserved historical non-counted Rust/Zig MatchSet evidence by respecting stored `countedStatus`.

## Boundary Notes

Zig counted support is artifact/provider scoped: self-contained no-std Zig source, no packages/imported std, compile through runtime-service, immutable WASM/WASI Preview 1 artifact, import audit, Wasmtime execution, provider proof, and public-safe diagnostics. This phase does not claim broad sandbox certification for arbitrary WASM/WASI programs.

## Verification

- `pnpm --filter @cowards/spec typecheck` passed.
- `pnpm --filter @cowards/spec test` passed: 4 files, 55 tests.
- `pnpm --filter @cowards/runtime-wasm-wasi typecheck` passed.
- `pnpm --filter @cowards/runtime-wasm-wasi test` passed: 1 file, 6 tests.
- `pnpm --filter @cowards/runtime-service typecheck` passed.
- `pnpm --filter @cowards/runtime-service test -- server execute-match` passed: 3 files, 28 tests.
- `pnpm --filter @cowards/persistence typecheck` passed.
- `pnpm --filter @cowards/persistence test -- workshop ladder competition` passed: 12 files, 60 passed, 1 skipped.
- `pnpm --filter @cowards/web typecheck` passed.
- `pnpm --filter @cowards/web test -- workshop/server runtime-labels evidence-copy result-view-model` passed: 25 files, 171 tests.
- `PATH=/usr/local/go/bin:$PATH go test ./...` passed in `apps/go-backend`.

