# Feature Research: v1.21 WASM/WASI Multi-Language Runtime Candidate

**Project:** Coward's Game
**Milestone:** v1.21 WASM/WASI Multi-Language Runtime Candidate and Rust Exhibition Alpha
**Researched:** 2026-05-25

## Table Stakes

### WASM/WASI Candidate Contract

- WASM/WASI runtime target is registered behind the Strategy Execution Service / Runtime Broker.
- Runtime selection is exact-match and fail-closed on ABI, language, adapter, artifact hash, package policy, or version mismatch.
- WASI Preview 1 stdin/stdout JSON is documented as the v1.21 executable ABI.
- Direct exports and component model are documented as future ABI candidates, not v1.21 product claims.

### Immutable Artifact Model

- Rust Strategy source validates/compiles into an immutable WASM artifact at submission or explicit local compile proof time.
- Match execution uses artifact bytes/hash/metadata, not mutable source.
- Artifact metadata includes language id/version, runtime target, adapter version, WASI profile, ABI envelope version, compile command/toolchain evidence, artifact hash, validation status, and non-counted eligibility.
- Public summaries expose safe labels and hashes only, not source, memory, stderr, stack, host paths, env, package paths, or private runtime internals.

### Rust Exhibition Alpha

- User can create/save one Rust Strategy Revision as non-counted exhibition alpha.
- User can choose safe starter Rust samples.
- Runtime-service can execute Rust WASM through the same Match execution boundary as other runtimes.
- JS/TS-vs-Rust and Rust-vs-Rust non-counted exhibitions can complete and open result/replay evidence.

### Zig Stretch

- Developer can run a Zig readiness/preflight command.
- If local compile/runtime proof passes, Zig can use the same WASI Preview 1 JSON ABI and non-counted exhibition semantics.
- If tooling or ABI proof fails, artifacts record fail-loud unavailable/non-promotion evidence.

### Hostile And Determinism Probes

- Filesystem/preopen denial, network denial, clock/time/random denial, memory growth/caps, fuel/timeout, trap/panic/abort, malformed JSON/ABI result, oversized stdout/stderr/result, invalid actions/schema, toolchain drift, package/import drift, no-fallback, and privacy redaction are covered where practical.
- Wasmtime deterministic fuel is preferred over wall-time-only timeout claims for deterministic execution evidence.
- Runtime failures distinguish Strategy violations from system failures and retry/no-retry behavior.

### Signed-In Proof

- Proof creates/signs into a local account.
- Proof saves one JS/TS Strategy Revision and one Rust Strategy Revision compiled to immutable WASM.
- Proof creates non-counted JS/TS-vs-Rust and Rust-vs-Rust exhibitions, optionally Rust-vs-Zig if Zig passes.
- Proof verifies Go -> Runtime Broker/runtime-service -> WASM/WASI runtime implementation, result/replay labels, replay plausibility, public-safe evidence, no silent fallback, and JS/TS regression safety.

## Differentiators

- Immutable WASM artifacts become the long-term product direction for compiled languages.
- Rust gives the first serious compiled-language proof without creating a bespoke runtime per language.
- Zig stretch can validate whether the ABI is genuinely language-neutral rather than Rust-shaped.

## Anti-Features

- Rust/Zig/WASM must not appear as counted/ranked/ladder-capable.
- Wasmtime or WASI evidence must not be described as production sandbox certification.
- Node `node:wasi` must not be accepted as the runtime sandbox.
- Runtime-service cannot silently fall back to JS/TS or Python when WASM/WASI fails.
- Go cannot compile or execute Strategy source as backend behavior.

---
*Research written: 2026-05-25*
