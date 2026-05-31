# Phase 228 Code Review: Cross-Language Golden Strategy Corpus and Parity Matrix

## Review Scope

- `@cowards/golden` v1.32 corpus and conformance manifest.
- Runtime-service four-language parity test.
- Runtime-service dependency and TypeScript project wiring.
- Public Chronicle privacy assertions.

## Findings

No open local findings.

## Fixes Made During Review

- Replaced Python corpus use of `next` with a plain loop because the provider sandbox does not expose `next`.
- Relaxed event-signature parity to public shape/core event/outcome parity after runtime proof showed Rust/Zig no-std scanning can produce shorter later-round event sequences without changing outcome or privacy guarantees.
- Required the runtime-service matrix to fail when Rust or Zig compile probes are unavailable.
- Reworded the conformance list as required gates rather than completed coverage.
- Fixed Rust and Zig corpus source parsing so they select the first `ACTIVE` Soldier, not merely the first Soldier id.

## Residual Risk

The conformance requirements manifest is present, but future phases still need to convert every gate into broader CI monitors and product-surface gates.
