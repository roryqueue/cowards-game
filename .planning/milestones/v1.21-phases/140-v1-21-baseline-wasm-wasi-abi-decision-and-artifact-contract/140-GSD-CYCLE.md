# Phase 140 GSD Cycle

## Plan

Lock v1.20 as the floor, register the WASM/WASI lane as non-counted candidate evidence, choose WASI Preview 1 stdin/stdout JSON as the first executable ABI, and keep direct exports/component model as future candidates only.

## Execution

Updated spec language/runtime metadata, runtime broker registry compatibility keys, artifact metadata schema, and v1.17 broker artifact drift evidence for Rust/Zig WASM/WASI entries.

## Review

Code review found overclaim and boundary risks; fixes kept WASM/WASI non-counted, runtime-only, and exact-match fail-closed.

## Validation

Passed `pnpm --filter @cowards/spec test`, `pnpm test:fast`, and `pnpm boundary:monitors`.

## UAT

Developer can inspect runtime registry and promotion decision evidence. Counted play remains JS/TS only.

