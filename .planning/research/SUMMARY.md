# Project Research Summary

**Project:** Coward's Game
**Milestone:** v1.21 WASM/WASI Multi-Language Runtime Candidate and Rust Exhibition Alpha
**Domain:** WASM/WASI runtime candidate execution, immutable compiled Strategy artifacts, Rust non-counted exhibition alpha, Zig stretch readiness, hostile/determinism probes, signed-in public-safe proof evidence
**Researched:** 2026-05-25
**Confidence:** High for local Rust/Wasmtime feasibility; medium for full end-to-end Rust product proof until implemented; medium for Zig because local tooling exists but the shared ABI still needs proof; low for counted/ranked promotion because v1.21 intentionally does not target it.

## Executive Summary

v1.21 should make WASM/WASI the next serious multi-language runtime candidate without overclaiming. The shortest honest executable path is WASI Preview 1 stdin/stdout JSON envelopes through Wasmtime, with Rust as the first net-new compiled language and Zig as a gated stretch target. Direct exports and the component model remain important future directions, but they add memory-marshalling and WIT/tooling complexity that would distract from proving immutable artifacts, hostile-code boundaries, replay safety, and signed-in exhibition evidence.

Local tooling supports a real proof: Rust `wasm32-wasip1` is installed, Zig is installed, Wasmtime is installed, and `wasm-tools` is installed. That means v1.21 can aim for an end-to-end Rust alpha rather than a paper design. The milestone should still remain conservative: JS/TS stays the counted Strategy path, Python stays non-counted exhibition beta, Rust/WASM can at most become non-counted exhibition alpha/beta, and Zig should either pass the same ABI proof or fail loudly.

## Stack Findings

- Rust `wasm32-wasip1` is a practical first target. Rust docs describe it as a WebAssembly compilation target for WASI Preview 1, with `rustup target add wasm32-wasip1` as the normal install path and `rustc --target wasm32-wasip1` as the build path.
- WASI docs identify WASI 0.2/component model as the future, but also say WASI 0.1/P1 support is more widespread among runtimes and widely used today.
- Wasmtime supports fuel and interruption mechanisms; fuel is deterministic for the same program and input when other nondeterminism is absent.
- Wasmtime exposes WASI context controls for stdin/stdout/env/preopens and broader resource configuration.
- Zig docs show first-class WASI compilation using `zig build-exe ... -target wasm32-wasi`, but v1.21 should prove the Coward's Game ABI before claiming Zig execution.
- Node `node:wasi` documentation warns that Node's threat model does not provide secure sandboxing like some WASI runtimes; it must remain forbidden as a hostile-code sandbox claim.

## Feature Findings

- Table stakes are: WASM/WASI candidate contract, immutable artifact model, Rust compile/validation path, Rust runtime-service execution, Rust non-counted exhibition labels, hostile/determinism probes, Zig gated stretch readiness, signed-in proof, JS/TS regression safety, public privacy safety, and explicit conservative promotion decisions.
- The first ABI should be WASI Preview 1 stdin/stdout JSON envelope because it is executable now and can reuse schema validation, output caps, malformed JSON probes, and no-fallback drills.
- Rust Strategy Revisions need metadata that separates owner-private source from immutable Match artifact: source hash/bytes, artifact hash/bytes, target triple, WASI profile, compile/toolchain evidence, runtime adapter metadata, validation status, and non-counted eligibility.
- Match execution must use immutable artifact bytes/hash, not mutable source.
- Zig should use the same ABI only if compile/runtime evidence passes. Otherwise, write fail-loud readiness artifacts and do not substitute Rust/JS/TS behavior.

## Architecture Findings

- Runtime-service should become the owner of WASM/WASI execution, while Go remains owner of orchestration, persistence-facing behavior, Match lifecycle, scoring, retry policy, public evidence, and promotion decisions.
- The runtime registry should select WASM/WASI by exact language/runtime/adapter/ABI/artifact/package match and fail closed on mismatch.
- Public output should expose language/runtime labels, non-counted status, hashes, and evidence summaries only. It must not expose source, StrategyMemory, SoldierMemory, objective payloads, stderr, stack, host paths, env, tokens, DB DSNs, package paths, artifact internals, or private runtime internals.
- Hostile probes should cover filesystem/preopen denial, network denial, clock/time/random denial, memory caps/growth, fuel/timeout, trap/panic/abort, malformed JSON/ABI result, oversized stdout/stderr/result, invalid actions/schema, package/import/toolchain drift, no-fallback, and redaction.

## Watch Out For

- Do not promote Rust/Zig/WASM to ranked, ladder, counted, gauntlet, broad production multi-language support, or production sandbox certification.
- Do not execute Strategy code in web/API/Go.
- Do not use mutable source for Match execution when a WASM artifact contract exists.
- Do not accept Node `node:wasi` as an untrusted-code sandbox.
- Do not let Rust/Zig own backend routes, persistence, job lifecycle, Match completion, scoring, public evidence, retry policy, or fallback behavior.
- Do not silently skip Zig or substitute another language when Zig evidence is unavailable.
- Do not run unbounded local stress tests.
- Do not expose private Strategy data or private runtime diagnostics in public MatchSet or replay evidence.

## Recommended Phase Structure

1. Phase 140: v1.21 Baseline, WASM/WASI ABI Decision, and Artifact Contract.
2. Phase 141: Rust Compile Validation and Immutable WASM Artifact Pipeline.
3. Phase 142: WASM/WASI Runtime Broker Execution Lane.
4. Phase 143: Rust Workshop UX, Samples, and Non-Counted Exhibition Eligibility.
5. Phase 144: WASM/WASI Hostile Probe and Determinism Evidence.
6. Phase 145: Zig Stretch Readiness and Optional Shared-ABI Proof.
7. Phase 146: Signed-In Rust Exhibition Proof and JS/TS Regression Gate.
8. Phase 147: Promotion Decision, Audit, Archive, and Tag.

## Sources Consulted

- Repo-local planning archive through v1.20, especially `.planning/milestones/v1.20-*` and `.planning/artifacts/v1.20-*`.
- Repo-local runtime and monitor code: `packages/spec/src/runtime.ts`, `packages/spec/src/runtime-execution-service.ts`, `apps/runtime-service/src/runtime-config.ts`, `apps/runtime-service/src/execute-match.ts`, `packages/runtime-python`, `packages/runtime-js/src/sandbox-evaluation.ts`, and `scripts/check-boundary-monitors.ts`.
- Rust `wasm32-wasip1` docs: https://doc.rust-lang.org/stable/rustc/platform-support/wasm32-wasip1.html
- WASI interfaces overview: https://wasi.dev/interfaces
- Wasmtime interruption/fuel docs: https://docs.wasmtime.dev/examples-interrupting-wasm.html
- Wasmtime WASI context docs: https://docs.wasmtime.dev/api/wasmtime_wasi/struct.WasiCtxBuilder.html
- Zig WASI docs: https://ziglang.org/documentation/master/#WASI
- Node WASI warning: https://nodejs.org/api/wasi.html

---
*Research summary written: 2026-05-25*
