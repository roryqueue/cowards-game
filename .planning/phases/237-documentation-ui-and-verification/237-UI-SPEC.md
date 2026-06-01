# Phase 237 UI Spec

## Scope

Update existing product surfaces only. Do not introduce TinyGo to the Workshop picker or production entry flows.

## Required Copy Claims

- TypeScript: artifact-proven source-language provenance; not WASM/WASI isolated.
- Python: artifact-proven source-language provenance in the constrained provider; not WASM/WASI isolated.
- Rust/Zig: immutable WASM/WASI artifact-backed provider proof.
- TinyGo: spike-only research, not production-supported or counted.

## Privacy

Public UI must not expose Strategy source, source artifact bytes, WASM bytes, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, environment values, credentials, or private runtime internals.

## Browser Targets

- `/learn#supported-languages`
- `/workshop`
- `/matchsets/{matchSetId}` when local data is available
