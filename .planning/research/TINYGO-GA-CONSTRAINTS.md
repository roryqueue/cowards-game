# TinyGo GA Constraints

TinyGo is a spike-only candidate until a future milestone explicitly promotes it.
It must stay absent from production Strategy language registries, Workshop
pickers, public entry flows, Learn copy, result/replay evidence copy, and counted
eligibility gates.

## Acceptance Mechanics

TinyGo can only become generally available if the normal WASM/WASI artifact gate
accepts it:

1. Compile the Strategy to an artifact.
2. Parse the artifact's WASM import section before accepting or executing it.
3. Reject any import outside the production WASI Preview 1 allowlist.
4. Bind provider proof to source hash/bytes and artifact hash/bytes.
5. Execute only validated artifacts behind runtime-service / Runtime Broker /
   Wasmtime boundaries.
6. Keep public output redacted by default.

This is a fail-closed rule. Runtime stubs for forbidden imports are not enough
for GA unless a future milestone changes the ABI and threat model.

## Current Blocker

The v1.33 TinyGo spike compiled and executed the minimal stdin/stdout JSON ABI
through Wasmtime, but the compiled artifact imported production-forbidden WASI
capabilities:

- `wasi_snapshot_preview1.clock_time_get`
- `wasi_snapshot_preview1.args_get`
- `wasi_snapshot_preview1.args_sizes_get`
- `wasi_snapshot_preview1.random_get`

These imports are rejected because Coward's Game Strategy execution must remain
deterministic and auditable before runtime. TinyGo therefore remains non-GA even
though the basic runtime proof succeeded.

## Promotion Paths

Any future TinyGo GA milestone should choose one of these paths:

- a constrained TinyGo target/runtime that emits only allowed WASI imports, or
- a new deterministic direct-export ABI, likely via `wasm-unknown`, with its own
  adapter, conformance tests, provider proof, browser review, signed-in proof,
  boundary monitors, and privacy audit.

Until then, the production site should not mention TinyGo.
