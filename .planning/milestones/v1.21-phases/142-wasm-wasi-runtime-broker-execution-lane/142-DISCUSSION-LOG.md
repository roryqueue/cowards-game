# Phase 142: WASM/WASI Runtime Broker Execution Lane - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 142-WASM/WASI Runtime Broker Execution Lane
**Areas discussed:** Wasmtime runner, artifact execution, runtime boundary, carry-forward policy

---

## Wasmtime Runner

| Option | Description | Selected |
| --- | --- | --- |
| CLI subprocess | Runtime-service spawns installed Wasmtime CLI with strict args. | yes |
| Embedded library | Bind Wasmtime directly into runtime-service. | |
| Node `node:wasi` | Use Node WASI support. | |

**User's choice:** CLI subprocess.
**Notes:** This is the fastest honest alpha path and mirrors existing subprocess evidence patterns.

---

## Artifact Execution

| Option | Description | Selected |
| --- | --- | --- |
| Immutable WASM artifact | Execute artifact bytes/hash/metadata from the submitted revision. | yes |
| Mutable source fallback | Recompile or execute source when artifact is unavailable. | |
| Local proof artifact only | Use evidence artifacts outside product Match execution. | |

**User's choice:** Immutable WASM artifact.
**Notes:** Missing or stale artifacts must fail loudly.

---

## Runtime Boundary

| Option | Description | Selected |
| --- | --- | --- |
| Runtime-service only | Runtime-service executes Wasmtime; Go validates and orchestrates only. | yes |
| Go execution | Go compiles or executes Rust/WASM directly. | |
| Web/API execution | Web/API process executes Strategy code. | |

**User's choice:** Runtime-service only.
**Notes:** Preserves the v1.20 topology and non-negotiables.

---

## Carry-Forward Policy

| Option | Description | Selected |
| --- | --- | --- |
| Carry similar decisions forward | Later equivalent runtime choices inherit these decisions unless contradicted. | yes |
| Re-ask | Re-open equivalent choices in later phases. | |

**User's choice:** Carry similar decisions forward.
**Notes:** Applies to Zig if Zig reaches execution proof.

## the agent's Discretion

Exact process wrapper and timeout/fuel mechanics may follow what is practical with local Wasmtime CLI, as long as claims stay honest.

## Deferred Ideas

- Embedded Wasmtime.
- Node `node:wasi`.
- Production sandbox promotion.
