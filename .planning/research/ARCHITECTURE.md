# Architecture Research: v1.21 WASM/WASI Multi-Language Runtime Candidate

**Project:** Coward's Game
**Milestone:** v1.21 WASM/WASI Multi-Language Runtime Candidate and Rust Exhibition Alpha
**Researched:** 2026-05-25

## Recommended Architecture

v1.21 should add WASM/WASI as a runtime-service implementation lane, not as a backend language and not as a replacement for Go orchestration. The end-to-end target flow is:

`signed-in user -> web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> runtime-wasm-wasi implementation -> Wasmtime -> immutable Rust WASM artifact`

## ABI Choice

Use WASI Preview 1 stdin/stdout JSON envelopes for v1.21.

Why:
- Rust `wasm32-wasip1` is locally installed and officially supported as a Rust target.
- WASI 0.1/P1 remains more widely supported among runtimes than component model P2 for simple command-style execution.
- JSON envelopes reuse the existing runtime ABI validation mindset.
- Stdin/stdout is simple to prove with malformed JSON, oversized output, timeout/fuel, and no-fallback probes.

Tradeoffs:
- Stdin/stdout is process-style and less elegant than direct exports.
- Direct exports would require guest memory allocation/marshalling design.
- Component model/WIT is the long-term interop direction, but introduces more toolchain and binding risk than this milestone needs.

## Integration Points

- `packages/spec/src/runtime.ts`: add language/runtime ids, metadata, eligibility, limits, compatibility keys, and non-counted semantics.
- `packages/spec/src/schemas.ts` and `packages/spec/src/types.ts`: add source/artifact formats and immutable artifact fields if current Strategy Revision shape needs extension.
- New runtime package or module such as `packages/runtime-wasm-wasi`: validation, compile/preflight, metadata, artifact hashing, Wasmtime runner, failure taxonomy, and tests.
- `apps/runtime-service/src/runtime-config.ts` and `apps/runtime-service/src/execute-match.ts`: select WASM/WASI runtime implementation behind the broker without changing Go ownership.
- `apps/web/app/workshop/*`: gated Rust author/save UI and safe samples, with non-counted exhibition alpha copy.
- `apps/go-backend/*`: preserve runtime-service-only execution, validate runtime metadata/artifact hashes, create non-counted exhibitions, and keep public evidence Go-owned.
- `scripts/check-boundary-monitors.ts` and topology/sandbox scripts: add WASM/WASI registry, no-fallback, privacy, artifact, and production-claim monitors.

## Artifact Contract

Rust and optional Zig Strategy Revisions should carry:
- Source hash and source bytes for owner-private source.
- WASM artifact hash, bytes, target triple, WASI profile, and compile evidence.
- Runtime adapter id/version and ABI envelope id/version.
- Toolchain identity and compile command summary.
- Immutable eligibility snapshot used for Match execution.
- Public-safe semantics indicating non-counted exhibition alpha/beta only.

## Runtime Controls

Wasmtime execution should start with:
- No inherited env.
- No preopened host directories by default.
- Network disabled/not inherited.
- Deterministic fuel and bounded timeout behavior.
- Memory/table/instance/resource limits where practical.
- Output byte caps and schema validation.
- Redacted diagnostics.

## Build Order

1. Register and specify the WASM/WASI candidate lane and ABI.
2. Prove local Rust compile/artifact flow before Workshop product UI.
3. Implement runtime-service execution against immutable WASM artifacts.
4. Add hostile/determinism probes and monitor gates.
5. Add signed-in product proof and conservative promotion decision.

---
*Research written: 2026-05-25*
