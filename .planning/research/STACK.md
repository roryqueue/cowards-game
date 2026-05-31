# v1.33 Stack Research

## Existing Stack to Reuse

- Provider language semantics and proof fields should start from `packages/spec/src/runtime.ts` and adjacent runtime/provider contracts.
- TypeScript/JavaScript execution remains behind runtime-service / Runtime Broker / JS/TS provider boundaries.
- Python execution remains behind runtime-service / Runtime Broker / Python provider boundaries with constrained imports and capabilities.
- Rust/Zig WASM/WASI Preview 1 artifact proof is the regression baseline for source/artifact hash and byte-count evidence.
- Wasmtime/WASI tooling and import-table probes from the Rust/Zig lanes should be reused for TinyGo and Grain spikes.

## Stack Additions to Investigate

- TypeScript canonical artifact build representation: transpiled executable bundle, provider-sealed JS artifact, or equivalent deterministic artifact format.
- Python provenance artifact representation: normalized source bundle, bytecode artifact, sealed executable bundle, or equivalent evidence object.
- TinyGo local toolchain availability and target support for WASI Preview 1 or closest viable WebAssembly target.
- Grain local toolchain availability, emitted WebAssembly format, and compatibility with Wasmtime/WASI without broad JavaScript host glue.

## Stack Non-Goals

- No new production runtime boundary in web/API/Go.
- No Node `vm` security boundary.
- No production TinyGo or Grain provider unless explicitly approved later.
- No Rust/Zig ABI replacement during this milestone.
