# Phase 158 Research

Existing hardening lives in `scripts/evaluate-wasm-wasi-runtime.ts` and `packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts`. The adapter already verifies artifact bytes/hash, target triple, WASI profile, ABI envelope, import audit, Wasmtime availability, timeout/fuel, memory, stack, stdio caps, and empty env/no shell execution.

v1.23 needs its own evidence rather than mutating the archived v1.22 artifacts.
