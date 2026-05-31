# Phase 227 Research: Zig Production Support Path

## Inputs Reviewed

- Phase 227 context and discussion logs.
- Phase 226 Rust production support path and artifact/provider proof shape.
- Zig readiness and helper evidence from v1.22/v1.23.
- Runtime/provider registry, WASM/WASI validation, runtime-service validation endpoint, Workshop save path, persistence entry gates, Go public backend, and public evidence copy.

## Implementation Direction

Zig should mirror the Rust immutable WASM/WASI artifact discipline while keeping Zig-specific no-std/import policy:

- Runtime-service owns Zig validation/build and is the only path that can attach provider-validation proof.
- Local Zig builders strip incoming `providerValidation` metadata and cannot mint counted provenance.
- Provider proof is HMAC signed and bound to provider id, contract version, source hash/bytes, artifact hash/bytes, and the provider-validation secret.
- Counted entry gates must verify exact runtime metadata, artifact metadata, decoded artifact bytes, target triple `wasm32-wasi`, WASI Preview 1, stdin/stdout JSON ABI, validation status, source hash/bytes, artifact hash/bytes, and proof.
- Public evidence may say Zig is counted provider eligible, but must avoid broad sandbox certification claims.

## Boundary Decision

WASI Preview 1 stdin/stdout JSON remains the active Zig ABI. Broad Zig std/package ergonomics remain deferred.

