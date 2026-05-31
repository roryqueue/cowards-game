# Phase 226 Summary: Rust Production Support Path

## Accomplished

- Promoted Rust in the shared supported-language registry to counted eligible and normal-play enabled.
- Kept Zig as the only remaining non-counted WASM/WASI exhibition beta language.
- Updated the shared WASM/WASI adapter posture so Rust can be counted while Zig remains language-gated.
- Removed Rust `NON_COUNTED_RUNTIME` validation warnings.
- Updated Rust immutable artifact public evidence from non-counted beta to counted provider artifact.
- Added Rust provider-validation provenance bound to provider id, contract version, source hash/bytes, artifact hash/bytes, and HMAC proof.
- Required counted Rust entry to verify runtime metadata, provider proof, artifact metadata, artifact bytes, target triple, WASI profile, ABI envelope/version, and validation status.
- Updated Workshop, account/listing semantics, competition, ladder, Go backend entry gates, result evidence, Learn copy, exhibition copy, and runtime labels.
- Preserved historical non-counted Rust MatchSet evidence by respecting stored `countedStatus`.

## Boundary Notes

Rust counted support is artifact/provider scoped: self-contained Rust source, no packages/external crates, compile through runtime-service, immutable WASM/WASI Preview 1 artifact, import audit, Wasmtime execution, provider proof, and public-safe diagnostics. This phase does not claim broad sandbox certification for arbitrary WASM/WASI programs and does not promote Zig.

## Verification

- `pnpm --filter @cowards/spec typecheck` passed.
- `pnpm --filter @cowards/spec test` passed: 4 files, 55 tests.
- `pnpm --filter @cowards/runtime-wasm-wasi typecheck` passed.
- `pnpm --filter @cowards/runtime-wasm-wasi test` passed: 1 file, 6 tests.
- `pnpm --filter @cowards/runtime-service typecheck` passed.
- `pnpm --filter @cowards/runtime-service test -- server execute-match` passed: 3 files, 27 tests.
- `pnpm --filter @cowards/persistence typecheck` passed.
- `pnpm --filter @cowards/persistence test -- workshop ladder competition` passed: 12 files, 60 passed, 1 skipped.
- `pnpm --filter @cowards/web typecheck` passed.
- `pnpm --filter @cowards/web test -- workshop/server runtime-labels evidence-copy result-view-model` passed: 25 files, 171 tests.
- `PATH=/usr/local/go/bin:$PATH go test ./...` passed in `apps/go-backend`.
