# v1.32 Pitfalls Research: Four-Language Production Strategy Support

**Project:** Coward's Game
**Milestone:** v1.32 Four-Language Production Strategy Support
**Researched:** 2026-05-31

## High-Risk Pitfalls

### Label-Only Promotion

Changing "non-counted exhibition beta" labels to "supported" without provider eligibility, runtime execution, conformance, public evidence, and monitor proof would produce a false product claim. Prevent this by requiring every language promotion phase to pass provider, runtime, Workshop, Account, entry, result, replay, public evidence, privacy, docs, and signed-in proof checks.

### Hidden JS/TS Bias

JS/TS is currently the counted baseline, and product code still branches on `typescript`, `python`, `rust`, and `zig` directly. Promotion can silently fail if only the visible Workshop picker changes. Prevent this with a direct-special-case monitor and by requiring all product code to ask provider/registry questions.

### Runtime Boundary Creep

It will be tempting to validate, compile, or execute more Strategy behavior in web/API/Go for convenience. That violates the core boundary. Prevent this with import monitors, runtime-service boundary tests, and a clear provider contract that only exposes safe validation/build/execution requests.

### ABI Ambiguity

Rust/Zig currently use WASI Preview 1 stdin/stdout JSON. Python and JS/TS have different internal adapters. If v1.32 keeps Preview 1 JSON for WASM/WASI only, that must be explicit; if it introduces a shared ABI or migration, it must be versioned and tested. Prevent drift with ABI compatibility tests and migration/rollback records.

### Public Privacy Regression

Four-language proof may surface artifact hashes, source hashes, diagnostics, compiler output, paths, package data, or runtime internals. Public output must stay source-free and memory-free by default. Prevent this with denylist scans over DTOs, pages, proof artifacts, result/replay fixtures, and public discovery reads.

### Toolchain and Environment Drift

Rust and Zig production support depends on toolchain versions, target triples, WASI profile, Wasmtime availability, artifact hashing, and allowed import surfaces. Prevent this with versioned artifact metadata, preflight checks, compatibility keys, and fail-closed stale/missing/mismatched artifact tests.

### Python Sandbox Overclaim

Python subprocess beta evidence does not automatically equal production hostile-code isolation. Prevent overclaiming by documenting the sandbox claim separately from counted eligibility and requiring hostile probe/no-fallback evidence before promotion.

### Counted Eligibility Split Brain

Workshop save, Account lists, competition entry, exhibition counted toggles, MatchSet scoring, results, player/Strategy pages, public discovery, and docs can disagree. Prevent this by deriving all eligibility and labels from the same provider model and by adding result/replay/public evidence parity checks.

### Historical Monitor Inversion

Existing monitors intentionally fail if Python/Rust/Zig become counted. v1.32 must update them deliberately rather than disabling them broadly. Prevent this by replacing negative non-promotion assertions with positive four-language parity, provider-boundary, privacy, and no-fallback assertions.

### Replay and Chronicle Compatibility

Language promotion should not alter pure engine rules or Chronicle grammar unexpectedly. Prevent this by keeping the engine language-agnostic, validating public replay shape parity, and running board realism checks for four-language Match starts and replay playback.

## Warning Signs During Implementation

- A React component contains a new switch directly on `python`, `rust`, or `zig`.
- A Go or web/API route imports runtime implementation internals.
- A public DTO includes Strategy source, StrategyMemory, SoldierMemory, objective payloads, compiler stderr, stack traces, host paths, env values, package paths, or runtime internals.
- A language is marked counted but lacks a golden Strategy, pairwise Match/MatchSet proof, invalid-output tests, timeout tests, forbidden-capability tests, public label tests, and signed-in proof.
- A runtime failure falls back to JS/TS or mutable source execution.
- A monitor is deleted instead of converted into an equivalent positive guard.

## Phase Placement

- Inventory and exception map: Phase 222.
- Registry/provider model: Phase 223.
- Runtime/provider contract and ABI decision: Phase 224.
- Python production path: Phase 225.
- Rust production path: Phase 226.
- Zig production path: Phase 227.
- Golden corpus and parity matrix: Phase 228.
- Product UI/account/entry unification: Phase 229.
- Result/replay/public evidence/docs pass: Phase 230.
- Drift monitors and boundary coverage: Phase 231.
- Live signed-in proof: Phase 232.
- Audit/archive/tag: Phase 233.
