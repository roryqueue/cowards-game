# Roadmap: Coward's Game v1.33

## Active Milestone

**v1.33 Artifact Provenance for Source Languages + WASM Language Spikes**

**Goal:** Add artifact provenance for TypeScript and Python source-language providers, then run a contained TinyGo WASM/WASI spike without promoting the candidate language by default.

**Decision baseline:** v1.33 starts from v1.32's four supported counted Strategy languages. Rust and Zig already have immutable WASM/WASI Preview 1 artifact proof; TypeScript and Python need comparable provider provenance without pretending they are WASM-isolated. TinyGo is spike-only unless a future approved plan productionizes it. Strategy execution remains behind runtime-service / Runtime Broker / language provider boundaries.

## Phase Overview

| Phase | Name | Goal | Requirements | Success Criteria |
| --- | --- | --- | --- | --- |
| 234 | TypeScript Artifact Provenance | Add canonical TypeScript artifact generation, proof binding, artifact execution, fail-closed validation, privacy, and regression coverage. | TSART-01..TSART-06 | Planned |
| 235 | Python Artifact Provenance | Add Python artifact provenance with interpreter metadata while preserving constrained source/runtime policy and honest security claims. | PYART-01..PYART-06 | Planned |
| 236 | TinyGo WASM/WASI Spike | Build and evaluate a minimal TinyGo WASM/WASI Strategy artifact against the existing Strategy ABI and runtime evidence model. | TINYGO-01..TINYGO-05 | Planned |
| 237 | Documentation, UI, and Verification | Update language status docs/UI/evidence, preserve Rust/Zig behavior, run monitors/browser review, and close milestone validation. | LANGDOC-01..LANGDOC-07 | Planned |

## Phase Details

### Phase 234: TypeScript Artifact Provenance

**Goal:** Add canonical TypeScript artifact generation, proof binding, artifact execution, fail-closed validation, privacy, and regression coverage.

**Requirements:** TSART-01, TSART-02, TSART-03, TSART-04, TSART-05, TSART-06

**Success criteria:**
1. TypeScript validation/build produces a canonical executable artifact with deterministic build metadata and provider compatibility information.
2. Provider proof binds source hash/bytes and artifact hash/bytes, and tests reject source mismatch, artifact mismatch, missing/stale artifact, incompatible metadata, and silent fallback.
3. Match and MatchSet execution use the validated artifact path and do not silently re-transpile mutable source.
4. Public/private evidence surfaces show TypeScript as artifact-proven without exposing Strategy source, StrategyMemory, SoldierMemory, objective payloads, or private runtime internals.
5. Existing TypeScript counted support, JS/TS runtime behavior, public result/replay privacy, and no Strategy execution in web/API/Go remain green.

### Phase 235: Python Artifact Provenance

**Goal:** Add Python artifact provenance with interpreter metadata while preserving constrained source/runtime policy and honest security claims.

**Requirements:** PYART-01, PYART-02, PYART-03, PYART-04, PYART-05, PYART-06

**Success criteria:**
1. Python provider emits an artifact provenance object such as normalized source bundle, bytecode artifact, sealed executable bundle, or equivalent evidence with interpreter/version metadata.
2. Provider proof binds source hash/bytes and artifact hash/bytes, and tests reject source mismatch, artifact mismatch, stale/missing artifact, incompatible metadata, and silent fallback.
3. Python continues to enforce no packages, no host imports, no filesystem/network/clock/random access, limits, timeout behavior, invalid-output handling, and public-safe diagnostics.
4. Docs and evidence explicitly state Python artifact provenance is evidence/provenance and not equivalent to WASM isolation or production sandbox certification.
5. Existing Python counted support, runtime-service boundary behavior, public result/replay privacy, and no Strategy execution in web/API/Go remain green.

### Phase 236: TinyGo WASM/WASI Spike

**Goal:** Build and evaluate a minimal TinyGo WASM/WASI Strategy artifact against the existing Strategy ABI and runtime evidence model.

**Requirements:** TINYGO-01, TINYGO-02, TINYGO-03, TINYGO-04, TINYGO-05

**Success criteria:**
1. A minimal TinyGo Strategy artifact builds for WASI Preview 1 or the closest locally viable deterministic WebAssembly target, or fails loudly with actionable toolchain evidence.
2. The spike attempts the existing WASI Preview 1 stdin/stdout JSON ABI and records any adapter, shim, or incompatibility.
3. Import table audit records allowed imports, forbidden imports, host capability risks, memory behavior, and runtime allowances.
4. Spike evidence records compile viability, artifact size, startup/per-call latency, deterministic behavior, invalid-output behavior, timeout/trap behavior, and failure taxonomy.
5. A promote/defer/reject recommendation is recorded without enabling TinyGo production support, counted eligibility, or public production labels.

### Phase 237: Documentation, UI, and Verification

**Goal:** Update language status docs/UI/evidence, preserve Rust/Zig behavior, run monitors/browser review, and close milestone validation.

**Requirements:** LANGDOC-01, LANGDOC-02, LANGDOC-03, LANGDOC-04, LANGDOC-05, LANGDOC-06, LANGDOC-07

**Success criteria:**
1. Supported-language docs, UI labels, provider evidence docs, Strategy cards, result/replay surfaces, Learn/docs, and public evidence distinguish artifact-proven source languages, WASM/WASI artifact-backed production languages, and spike-only candidates.
2. Rust and Zig artifact-backed behavior stays green under the expanded provider proof model.
3. Boundary monitors and privacy scans cover TypeScript/Python artifact proof, Rust/Zig regression, TinyGo spike-only labels, no public private-data leak, and no Strategy execution in web/API/Go.
4. Browser review confirms supported-language pages and evidence surfaces are realistic, unclipped, and do not overclaim security or sandbox guarantees.
5. Final validation records tests, spike artifacts, import audits, latency/size notes, recommendations, public privacy scans, replay board realism checks where applicable, and milestone audit outcome.

## Coverage

- v1 requirements: 24 total
- Complete: 0
- Planned: 24
- Mapped to phases: 24
- Unmapped: 0

## Next Up

Phase 234 is ready for discussion and planning.

`$gsd-discuss-phase 234` - gather context and clarify the TypeScript artifact provenance approach.

Also: `$gsd-plan-phase 234` - skip discussion and plan directly.

---
*Roadmap updated: 2026-05-31 after v1.33 milestone initialization*
