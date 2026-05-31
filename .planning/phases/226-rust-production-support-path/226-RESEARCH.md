# Phase 226 Research: Rust Production Support Path

## Current State

Rust already has a real WASM/WASI lane in `@cowards/runtime-wasm-wasi`:

- Source validation rejects host capabilities, time/random/env/path/socket patterns, external crates, oversized source, and missing `fn main`.
- Build compiles with `rustc --target wasm32-wasip1 -O` into an immutable WASM artifact.
- Artifact metadata records hash, bytes, source hash, WASI profile, target triple, ABI envelope, ABI version, validation status, toolchain, and public evidence.
- Runtime execution uses Wasmtime CLI through runtime-service and validates artifact bytes, hash, target, ABI, import allowlist, timeout, stdio caps, and output schemas.

## Promotion Pattern

Phase 225 showed that counted non-JS promotion needs provenance, not just runtime shape. Rust should follow that pattern with an artifact-bound proof:

- provider id: `strategy-language-provider-rust-wasi`
- contract version: `strategy-language-provider-contract-v1.32`
- source hash and bytes
- artifact hash and bytes
- HMAC proof using configured provider-validation secret

## Key Risk

`buildRustStrategyRevision()` is exported and can compile artifacts locally. That is useful for tests and runtime fixtures, but counted entry must not treat local builder output as provider proof. Runtime-service `/validate-strategy` should be the provenance authority, and entry gates should reject Rust without a matching provider proof.

## Implementation Notes

- Extend `metadata.providerValidation` to optionally carry artifact hash and byte count.
- Keep local Rust builders from accepting or minting provider validation.
- Runtime-service can compose returned metadata from the builder's compiled artifact plus its own provider proof.
- Workshop and Go save paths already route Rust through runtime-service; their persistence gates need to require the proof for counted support.
- Zig should continue through the existing non-counted WASM/WASI beta path.
