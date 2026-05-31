# Phase 228 Research: Cross-Language Golden Strategy Corpus and Parity Matrix

## Inputs Reviewed

- Phase 228 context and discussion log.
- Phase 225/226/227 production paths for Python, Rust, and Zig.
- Existing `@cowards/golden` v1.7 parity harness.
- Runtime-service execution tests and provider builders.
- Public Chronicle projection and privacy helpers.

## Implementation Direction

The most maintainable location for the corpus is `packages/golden`, because it already owns cross-package golden fixtures. Runtime-service is the right first execution consumer because it exercises the real Runtime Broker and provider boundaries without moving Strategy execution into web/API/Go.

## Design Notes

- The golden behavior is `first-active-turn-to-stone`: select the first active Soldier, attach a private objective marker, then turn to STONE with private memory markers.
- Python source must stay within the sandbox safe builtins; ordinary helpers like `next` are not available.
- Rust/Zig no-std/WASI sources intentionally use simple JSON scanning. They match the outcome and public replay shape but can produce different low-level event lengths in later rounds than JS/Python.
- Public parity should therefore assert outcome parity, core event presence, schema shape, and private-marker redaction rather than byte-for-byte Chronicle identity.

