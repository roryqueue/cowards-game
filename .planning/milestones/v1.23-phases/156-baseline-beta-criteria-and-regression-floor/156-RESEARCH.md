# Phase 156 Research

Local research confirmed v1.22 is a usable regression floor: `pnpm wasm-wasi:evaluate:check` passes 19/19 probes, Zig readiness is detected, Rust uses `wasm32-wasip1`, Zig uses `wasm32-wasi`, and both execute through runtime-service/Runtime Broker/Wasmtime with WASI Preview 1 stdin/stdout JSON.

The main implementation hook is a machine-readable v1.23 beta criteria artifact under `.planning/artifacts/`, not runtime behavior. Beta remains non-counted exhibition beta only. JS/TS counted support and Python non-counted exhibition beta must stay protected.
