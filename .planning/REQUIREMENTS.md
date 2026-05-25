# Requirements: Coward's Game

**Defined:** 2026-05-25
**Milestone:** v1.21 WASM/WASI Multi-Language Runtime Candidate and Rust Exhibition Alpha
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1 Requirements

### Baseline, ABI Decision, And Artifact Contract

- [ ] **BASE-01**: Developer can inspect a v1.21 baseline that treats v1.20 as the floor and preserves normal topology: web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementations.
- [ ] **BASE-02**: Developer can inspect a WASM/WASI candidate decision that chooses WASI Preview 1 stdin/stdout JSON envelopes as the first executable ABI.
- [ ] **BASE-03**: Developer can inspect a future-ABI decision that documents direct exports and component model as future candidates, not v1.21 product claims.
- [ ] **BASE-04**: Developer can inspect promotion gates that keep JS/TS as the counted Strategy path, Python as non-counted exhibition beta, and Rust/Zig/WASM as non-counted exhibition alpha/beta only.
- [ ] **BASE-05**: Developer can verify v1.21 excludes Rust/Zig backend ownership, Go/web/API Strategy execution, Node `node:wasi` sandbox promotion, arbitrary package installs, unbounded stress tests, silent fallback, and production sandbox certification.

### WASM/WASI Runtime Registry And ABI

- [ ] **WASM-01**: Developer can inspect a registered WASM/WASI runtime target or equivalent broker entry with exact language, adapter, ABI, package, limit, and eligibility metadata.
- [ ] **WASM-02**: Developer can validate runtime selection fails closed when language id, adapter id, ABI version, artifact hash, package policy, or runtime target metadata mismatches.
- [ ] **WASM-03**: Developer can inspect schema-validated stdin JSON request and stdout JSON response envelopes for WASI Preview 1 Strategy calls.
- [ ] **WASM-04**: Developer can verify malformed JSON, missing fields, invalid method names, invalid actions, and schema-invalid results map to deterministic runtime violation or system failure taxonomy.
- [ ] **WASM-05**: Developer can inspect Wasmtime runtime controls for no inherited env, no host preopens by default, no inherited network, output caps, memory/resource limits where practical, and fuel/timeout behavior.
- [ ] **WASM-06**: Developer can run monitors that fail on WASM/WASI registry drift, ABI drift, Node `node:wasi` promotion, production-claim drift, backend ownership creep, and JS/TS regression.

### Immutable WASM Artifact Model

- [ ] **ART-01**: Developer can inspect Strategy Revision metadata for Rust WASM artifacts, including language id/version, runtime target, adapter version, WASI profile, ABI envelope version, source hash, source bytes, artifact hash, artifact bytes, validation status, and non-counted eligibility.
- [ ] **ART-02**: User can submit or locally prove a Rust Strategy source compile that produces an immutable `.wasm` artifact for Match eligibility.
- [ ] **ART-03**: Developer can verify Match execution for Rust uses immutable WASM artifact bytes/hash/metadata rather than mutable source text.
- [ ] **ART-04**: Developer can verify source edits after submission do not alter an already eligible Rust WASM artifact or Match execution input.
- [ ] **ART-05**: Developer can inspect toolchain and compile evidence for Rust artifacts, including rustc/cargo version, target triple, command summary, artifact hash, and fail-closed compile diagnostics.
- [ ] **ART-06**: Developer can verify public artifact summaries expose safe labels, hashes, non-counted status, and compatibility metadata without leaking Strategy source or private runtime internals.
- [ ] **ART-07**: Developer can verify stale, missing, oversized, malformed, unsupported, or hash-mismatched WASM artifacts fail loudly and cannot silently fall back to source execution.

### Rust Strategy Path

- [ ] **RUST-01**: User can select or load safe starter Rust Strategy samples that implement the required Strategy behavior through the WASI Preview 1 JSON envelope.
- [ ] **RUST-02**: User can create and save a Rust Strategy Revision as non-counted exhibition alpha.
- [ ] **RUST-03**: User receives public-safe Rust compile/validation diagnostics for syntax, compile, missing API, unsupported imports/packages, forbidden capabilities, source limits, and artifact limits.
- [ ] **RUST-04**: Developer can verify Rust package behavior is self-contained and does not allow arbitrary Cargo package installs as a product feature.
- [ ] **RUST-05**: Developer can verify Rust panic, trap, abort, timeout/fuel exhaustion, memory growth failure, malformed output, oversized output, invalid action, and invalid schema behavior is classified safely.
- [ ] **RUST-06**: User-facing labels consistently describe Rust as non-counted exhibition alpha/beta, not ranked, ladder, counted, gauntlet, or production multi-language support.
- [ ] **RUST-07**: Developer can verify JS/TS validation, runtime execution, counted eligibility, exhibition creation, result evidence, and replay safety remain intact after Rust is added.

### WASM/WASI Runtime Execution

- [ ] **EXEC-01**: Runtime service can execute Rust WASM Strategy calls through Wasmtime behind the Strategy Execution Service / Runtime Broker boundary.
- [ ] **EXEC-02**: Developer can verify Go sends schema-validated Match execution requests to runtime-service and never executes, compiles, or evaluates Rust Strategy code.
- [ ] **EXEC-03**: Developer can verify runtime-service constructs side-specific runtimes for JS/TS and Rust without changing Go-owned Match lifecycle, scoring, retry policy, or public evidence ownership.
- [ ] **EXEC-04**: Developer can run Rust-vs-Rust non-counted exhibition Matches through runtime-service and receive complete Match/Chronicle/replay outputs when Strategies are valid.
- [ ] **EXEC-05**: Developer can run JS/TS-vs-Rust non-counted exhibition Matches through runtime-service and verify the JS/TS counted path is not degraded or replaced.
- [ ] **EXEC-06**: Developer can inspect runtime-service health/topology evidence showing WASM/WASI as runtime-only and non-backend.
- [ ] **EXEC-07**: Developer can verify stopped runtime-service, missing Wasmtime, missing artifact, unsupported runtime adapter, stale artifact, and malformed runtime response fail closed with public-safe diagnostics.

### Hostile And Determinism Probes

- [ ] **PROBE-01**: Developer can run filesystem, preopen, host-path, package-path, stdout, stderr, and artifact-path probes against the WASM/WASI lane.
- [ ] **PROBE-02**: Developer can run network, DNS, socket, localhost, metadata IP, and proxy probes against WASM/WASI code that attempts network access.
- [ ] **PROBE-03**: Developer can run clock, wall-time, monotonic-time, random, environment, args, and token/DB DSN probes without exposing private host data.
- [ ] **PROBE-04**: Developer can run memory growth, memory cap, hostcall fuel, execution fuel, infinite loop, recursive stack, trap, panic, abort, and process-exit probes.
- [ ] **PROBE-05**: Developer can run malformed stdin, malformed stdout, oversized stdout/stderr/result, invalid action, invalid activation order, invalid memory payload, and schema-invalid result probes.
- [ ] **PROBE-06**: Developer can verify diagnostics redact source, StrategyMemory, SoldierMemory, objective payloads, stderr, stacks, host paths, package paths, environment values, tokens, DB DSNs, sessions, artifact internals, and private runtime internals.
- [ ] **PROBE-07**: Developer can run no-fallback drills for missing Wasmtime, unsupported WASI profile, missing artifact, artifact hash mismatch, stale registry metadata, stopped runtime-service, and Zig unavailable.
- [ ] **PROBE-08**: Developer can inspect bounded latency/resource evidence for WASM/WASI Match execution without loosening deterministic per-Strategy caps or running unbounded stress tests.

### Zig Stretch Readiness

- [ ] **ZIG-01**: Developer can run a Zig toolchain preflight that records local Zig version, target availability, compile command, artifact hash, and runtime outcome.
- [ ] **ZIG-02**: Developer can inspect a fail-loud Zig readiness artifact when Zig compile, target, runtime, ABI, or proof evidence is unavailable.
- [ ] **ZIG-03**: If Zig proof passes, user can save a Zig Strategy Revision as non-counted exhibition alpha using the same WASI Preview 1 JSON ABI and immutable artifact contract.
- [ ] **ZIG-04**: If Zig proof passes, developer can run optional Rust-vs-Zig or Zig-vs-Zig non-counted exhibition proof through runtime-service.
- [ ] **ZIG-05**: Developer can verify Zig never silently substitutes Rust, JS/TS, or Python behavior and never claims counted/ranked/production support.

### Signed-In Rust Exhibition Proof

- [ ] **PROOF-01**: User can create or sign into a local account.
- [ ] **PROOF-02**: User can create and save one JS/TS Strategy Revision.
- [ ] **PROOF-03**: User can create and save one Rust Strategy Revision compiled to immutable WASM.
- [ ] **PROOF-04**: User can optionally create and save one Zig Strategy Revision only if Zig readiness proof passes.
- [ ] **PROOF-05**: User can create non-counted JS/TS-vs-Rust and Rust-vs-Rust exhibition MatchSets, and optionally Rust-vs-Zig if Zig proof passes.
- [ ] **PROOF-06**: Developer can verify Match execution flows through Go -> Runtime Broker/runtime-service -> selected WASM/WASI runtime implementation with no silent fallback.
- [ ] **PROOF-07**: User can open MatchSet result and replay evidence with language/runtime labels, non-counted status, artifact evidence, timeout/fuel evidence, replay plausibility, and private-data-safe public output.
- [ ] **PROOF-08**: Developer can verify public outputs contain no Strategy source, private memories, objective payloads, stderr, stack, host paths, env, token, DB DSN, artifact internals, private runtime internals, Rust/Zig counted eligibility, or JS/TS regression.

### Completion And Promotion

- [ ] **EXIT-01**: Developer can inspect v1.21 artifacts for baseline, ABI decision, Rust artifact contract, Rust compile evidence, WASM/WASI runtime evidence, hostile probes, Zig readiness, signed-in proof, JS/TS regression checks, replay plausibility, privacy checks, and no-fallback drills.
- [ ] **EXIT-02**: Developer can inspect a promotion decision stating Rust/WASM remains non-counted exhibition alpha/beta unless explicit future counted-play gates pass.
- [ ] **EXIT-03**: Developer can inspect a promotion decision stating Zig is either non-counted exhibition stretch with proof or fail-loud unavailable/non-promoted.
- [ ] **EXIT-04**: Developer can inspect a promotion decision stating WASM/WASI runtime evidence remains candidate/readiness evidence, not production sandbox certification.
- [ ] **EXIT-05**: Developer can run final verification across spec/contracts, runtime-js/runtime-service, runtime-wasm-wasi, optional Zig proof, Go backend, web, topology, boundary monitors, privacy, JS/TS regression, and signed-in browser proof.
- [ ] **EXIT-06**: Developer can archive requirements/roadmap/phases, remove active `.planning/REQUIREMENTS.md`, update PROJECT/STATE/MILESTONES/RETROSPECTIVE, audit cleanly, commit, and tag `v1.21`.

## Future Requirements

- **WASI-01**: Promote direct exported-function ABI only after memory marshalling, hostcall, determinism, language interop, tooling, and failure taxonomy evidence pass.
- **WASI-02**: Promote component-model/WIT Strategy ABI only after Rust and at least one additional language prove stable generated bindings, artifact compatibility, and runtime support.
- **RUST-COUNT-01**: Promote Rust to ranked/counted play only after explicit production sandbox, determinism, toolchain, artifact, replay, privacy, rollback, abuse, moderation, and governance criteria pass.
- **ZIG-COUNT-01**: Promote Zig to ranked/counted play only after executable proof, production sandbox, determinism, toolchain, artifact, replay, privacy, rollback, abuse, moderation, and governance criteria pass.
- **PKG-01**: Add arbitrary Cargo/Zig package installs only after reproducible supply-chain, lockfile, native extension, sandbox build/install, and vulnerability policy exists.
- **OPS-01**: Add cloud/Kubernetes/service-mesh/production observability only in a future ops milestone with deployment-specific evidence.
- **LANG-01**: Add broad production multi-language product support only after language onboarding, compatibility, documentation, runtime policy, and counted eligibility semantics are separately planned.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Rust ranked/ladder/counted play | Requires explicit future promotion gates and production-grade evidence. |
| Zig ranked/ladder/counted play | Zig is a gated stretch target in v1.21, not a counted language. |
| WASM/WASI production sandbox certification | v1.21 builds candidate/readiness evidence and must not overclaim. |
| Component-model Strategy ABI promotion | Important future direction, but too much toolchain/binding scope for first executable proof. |
| Direct-export Strategy ABI promotion | Needs memory allocation and ABI marshalling design beyond v1.21's simplest executable lane. |
| Arbitrary Cargo/Zig package installs | Supply-chain, lockfile, native extension, and sandbox build risks are outside v1.21. |
| Rust/Zig backend ownership | Violates Go-owned orchestration and runtime-only boundaries. |
| Go/web/API Strategy execution | Strategy code must execute only behind schema-validated runtime ABI envelopes. |
| Node `node:wasi` sandbox promotion | Node documentation warns its threat model is not secure sandboxing for untrusted code. |
| Silent fallback | Hides runtime failures and invalidates readiness and proof evidence. |
| Broad production multi-language marketplace | v1.21 focuses on Rust alpha and optional Zig readiness only. |
| Cloud deployment/Kubernetes/service mesh | Local runtime candidate and signed-in proof are the milestone focus. |
| Unbounded stress testing | Reliability evidence must be bounded, repeatable, and safe for local development. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| BASE-01 | Phase 140 | Pending |
| BASE-02 | Phase 140 | Pending |
| BASE-03 | Phase 140 | Pending |
| BASE-04 | Phase 140 | Pending |
| BASE-05 | Phase 140 | Pending |
| WASM-01 | Phase 140 | Pending |
| WASM-02 | Phase 140 | Pending |
| WASM-03 | Phase 140 | Pending |
| ART-01 | Phase 141 | Pending |
| ART-02 | Phase 141 | Pending |
| ART-03 | Phase 141 | Pending |
| ART-04 | Phase 141 | Pending |
| ART-05 | Phase 141 | Pending |
| ART-06 | Phase 141 | Pending |
| ART-07 | Phase 141 | Pending |
| RUST-04 | Phase 141 | Pending |
| WASM-04 | Phase 142 | Pending |
| WASM-05 | Phase 142 | Pending |
| RUST-05 | Phase 142 | Pending |
| EXEC-01 | Phase 142 | Pending |
| EXEC-02 | Phase 142 | Pending |
| EXEC-03 | Phase 142 | Pending |
| EXEC-04 | Phase 142 | Pending |
| EXEC-05 | Phase 142 | Pending |
| EXEC-06 | Phase 142 | Pending |
| EXEC-07 | Phase 142 | Pending |
| RUST-01 | Phase 143 | Pending |
| RUST-02 | Phase 143 | Pending |
| RUST-03 | Phase 143 | Pending |
| RUST-06 | Phase 143 | Pending |
| RUST-07 | Phase 143 | Pending |
| WASM-06 | Phase 144 | Pending |
| PROBE-01 | Phase 144 | Pending |
| PROBE-02 | Phase 144 | Pending |
| PROBE-03 | Phase 144 | Pending |
| PROBE-04 | Phase 144 | Pending |
| PROBE-05 | Phase 144 | Pending |
| PROBE-06 | Phase 144 | Pending |
| PROBE-07 | Phase 144 | Pending |
| PROBE-08 | Phase 144 | Pending |
| ZIG-01 | Phase 145 | Pending |
| ZIG-02 | Phase 145 | Pending |
| ZIG-03 | Phase 145 | Pending |
| ZIG-04 | Phase 145 | Pending |
| ZIG-05 | Phase 145 | Pending |
| PROOF-01 | Phase 146 | Pending |
| PROOF-02 | Phase 146 | Pending |
| PROOF-03 | Phase 146 | Pending |
| PROOF-04 | Phase 146 | Pending |
| PROOF-05 | Phase 146 | Pending |
| PROOF-06 | Phase 146 | Pending |
| PROOF-07 | Phase 146 | Pending |
| PROOF-08 | Phase 146 | Pending |
| EXIT-01 | Phase 147 | Pending |
| EXIT-02 | Phase 147 | Pending |
| EXIT-03 | Phase 147 | Pending |
| EXIT-04 | Phase 147 | Pending |
| EXIT-05 | Phase 147 | Pending |
| EXIT-06 | Phase 147 | Pending |

**Coverage:**
- v1 requirements: 59 total
- Mapped to phases: 59
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after v1.21 milestone initialization*
