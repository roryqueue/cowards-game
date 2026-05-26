# Phase 159 Research

The active runtime ABI is still `strategy-runtime-abi-v1.14` over WASI Preview 1 stdin/stdout JSON. Runtime metadata already records `abiEnvelope: "stdin-stdout-json"` and rejects mismatched ABI metadata before execution.

Direct exports and component model/WIT remain future candidates. The missing pieces are memory ownership, allocation/free contracts, typed caps, Rust/Zig parity, Wasmtime host integration, and rollback/migration semantics.
