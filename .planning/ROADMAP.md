# Roadmap: Coward's Game v1.34

## Active Milestone

**v1.34 Workshop Provider Checker Parity**

**Goal:** Bring Workshop "Validate source" checker behavior for TypeScript, Python, Rust, and Zig up to the same practical quality by routing validation through provider/runtime-service semantics where appropriate, producing accurate public-safe diagnostics before submit, save, and entry without changing runtime ownership or making new sandbox claims.

**Decision baseline:** v1.34 starts from v1.33's shipped source-language artifact provenance for TypeScript/Python and immutable WASM/WASI Preview 1 artifact backing for Rust/Zig. TinyGo remains spike-only and hidden from production surfaces. The milestone improves Workshop checker parity and diagnostics only; it does not move Strategy execution into web/API/Go, productionize TinyGo, replace the Rust/Zig ABI, or claim new sandbox certification.

## Phase Overview

| Phase | Name | Goal | Requirements | Success Criteria |
| --- | --- | --- | --- | --- |
| 238 | Workshop Checker Path Inventory and Public Contract | Inventory Validate source, submit, save, and entry paths for all four production languages and define the shared public-safe checker contract. | CHECKINV-01..CHECKINV-04 | Planned |
| 239 | Provider-Grade Validate Source Parity | Make Workshop Validate source reuse submit-grade provider/runtime-service validation semantics for TypeScript, Python, Rust, and Zig where appropriate. | CHECKVAL-01..CHECKVAL-05 | Complete |
| 240 | Language Diagnostic UX and Availability States | Add actionable public-safe language-specific diagnostics and honest unavailable states for Python, Rust, and Zig. | CHECKDIAG-01..CHECKDIAG-05 | Complete |
| 241 | Checker Ergonomics, Caching, and Boundary Monitors | Make Rust/Zig validation realistic for editing, prevent stale diagnostics, keep TinyGo hidden, and prove boundaries do not drift. | CHECKERG-01..CHECKERG-04 | Complete |
| 242 | Four-Language Checker Proof, Privacy, and Audit | Add focused tests and a service-backed E2E proof covering all four Workshop checker paths, then audit and record evidence. | CHECKTEST-01..CHECKTEST-05 | Complete |

## Phase Details

### Phase 238: Workshop Checker Path Inventory and Public Contract

**Goal:** Inventory Validate source, submit, save, and entry paths for all four production languages and define the shared public-safe checker contract.

**Requirements:** CHECKINV-01, CHECKINV-02, CHECKINV-03, CHECKINV-04

**Canonical refs:**
- `.planning/PROJECT.md` - current project state, runtime/language decisions, active constraints.
- `.planning/REQUIREMENTS.md` - v1.34 requirements and hard boundaries.
- `.planning/STATE.md` - milestone state and resume notes.
- `.planning/research/SUMMARY.md` - latest language/runtime research baseline.
- `.planning/milestones/v1.33-REQUIREMENTS.md` - source artifact provenance and TinyGo spike baseline.
- `.planning/milestones/v1.33-ROADMAP.md` - v1.33 phase outcomes and proof expectations.
- `CowardsGameSpec_Full_Consolidated_v1.md` - canonical game terminology and product constraints.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - service/runtime architecture baseline.

**Success criteria:**
1. Inventory records frontend Workshop Validate source, submit, save, and entry flows for TypeScript, Python, Rust, and Zig.
2. Inventory identifies where each flow crosses app/API, Go, runtime-service, Runtime Broker, provider, compiler/toolchain, and artifact/provenance boundaries.
3. Semantic gaps between Validate source and submit/save/entry are documented per language, with TypeScript treated as the practical parity baseline.
4. Shared checker response contract covers statuses, categories, severity, actionability, provider metadata, availability, provenance/artifact state, and privacy exclusions.
5. Contract explicitly preserves runtime-service/provider ownership and does not enable Strategy execution in web/API/Go.

### Phase 239: Provider-Grade Validate Source Parity

**Goal:** Make Workshop Validate source reuse submit-grade provider/runtime-service validation semantics for TypeScript, Python, Rust, and Zig where appropriate.

**Requirements:** CHECKVAL-01, CHECKVAL-02, CHECKVAL-03, CHECKVAL-04, CHECKVAL-05

**Canonical refs:**
- `.planning/REQUIREMENTS.md` - v1.34 parity requirements and out-of-scope boundaries.
- `.planning/phases/238-workshop-checker-path-inventory-and-public-contract/238-CONTEXT.md` - inventory decisions and checker contract.
- `.planning/milestones/v1.32-REQUIREMENTS.md` - four-language provider eligibility baseline.
- `.planning/milestones/v1.33-REQUIREMENTS.md` - source artifact provenance baseline.
- `.planning/artifacts/v1.32-four-language-parity-matrix.md` - prior parity evidence.
- `.planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md` - TinyGo spike-only evidence and non-promotion context.

**Success criteria:**
1. TypeScript Validate source behavior remains green and establishes the shared parity baseline for status and diagnostics.
2. Python Validate source uses submit-equivalent constrained provider/runtime-service checks for policy, imports, packages, limits, provenance compatibility, and failure categories.
3. Rust Validate source uses submit-equivalent provider/runtime-service checks for compile/toolchain, WASM/WASI imports, artifact metadata, provenance, stale/missing/mismatched artifacts, and no fallback.
4. Zig Validate source uses submit-equivalent provider/runtime-service checks for compile/toolchain, no-std/helper compatibility, WASM/WASI imports, artifact metadata, provenance, stale/missing/mismatched artifacts, and no fallback.
5. Validate, submit, save, and entry fail consistently for unsupported providers, stale artifacts, mismatched provenance, invalid output shape, unavailable runtime-service, unavailable toolchain, and privacy-unsafe diagnostics.

### Phase 240: Language Diagnostic UX and Availability States

**Goal:** Add actionable public-safe language-specific diagnostics and honest unavailable states for Python, Rust, and Zig.

**Requirements:** CHECKDIAG-01, CHECKDIAG-02, CHECKDIAG-03, CHECKDIAG-04, CHECKDIAG-05

**Canonical refs:**
- `.planning/REQUIREMENTS.md` - diagnostic and privacy requirements.
- `.planning/phases/238-workshop-checker-path-inventory-and-public-contract/238-CONTEXT.md` - checker contract and response categories.
- `.planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md` - provider parity decisions.
- `.planning/artifacts/v1.18-python-validation-diagnostics.json` - earlier Python diagnostics evidence.
- `.planning/artifacts/v1.21-zig-readiness-evidence.md` - Zig readiness and fail-loud context.
- `.planning/artifacts/v1.22-zig-readiness-evidence.md` - Zig validation/toolchain context.

**Success criteria:**
1. Python diagnostics distinguish policy/capability, forbidden import, package/dependency, syntax/build, provenance, runtime-service unavailable, timeout/limit, and invalid output/schema failures.
2. Rust diagnostics distinguish compile, artifact/provenance, forbidden WASI/import, runtime-service, toolchain unavailable, timeout/limit, and invalid output/schema failures.
3. Zig diagnostics distinguish compile, artifact/provenance, forbidden WASI/import, no-std/helper misuse, runtime-service, toolchain unavailable, timeout/limit, and invalid output/schema failures.
4. Runtime-service-unavailable and toolchain-unavailable states are calm, honest, actionable, and do not imply the player wrote unsafe code.
5. Workshop UI and responses redact raw diagnostics, source, artifact bytes, host paths, env values, package paths, private runtime internals, memory, and objective payloads by default.

### Phase 241: Checker Ergonomics, Caching, and Boundary Monitors

**Goal:** Make Rust/Zig validation realistic for editing, prevent stale diagnostics, keep TinyGo hidden, and prove boundaries do not drift.

**Requirements:** CHECKERG-01, CHECKERG-02, CHECKERG-03, CHECKERG-04

**Canonical refs:**
- `.planning/REQUIREMENTS.md` - ergonomics, caching, and boundary requirements.
- `.planning/phases/238-workshop-checker-path-inventory-and-public-contract/238-CONTEXT.md` - checker contract and cache-relevant fields.
- `.planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md` - parity semantics and provider validation behavior.
- `.planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md` - UX categories and unavailable-state decisions.
- `.planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md` - TinyGo hidden/spike-only boundary.

**Success criteria:**
1. Rust and Zig Validate source calls are debounced, cached, coalesced, or otherwise paced so ordinary editing does not trigger excessive compile/runtime-service churn.
2. Cache keys include language, provider id, source hash/bytes, artifact hash/bytes where applicable, toolchain/provider compatibility metadata, and validation policy to prevent stale or cross-language reuse.
3. Workshop states clearly distinguish checking, checked, unavailable, failed, stale, and ready across TypeScript, Python, Rust, and Zig.
4. TinyGo remains absent from production Workshop validation, submit/save, entry, result, replay, and public evidence surfaces.
5. Boundary monitors prove no Strategy execution moved into web/API/Go and checker responses remain validated data across app/API/Go surfaces.

### Phase 242: Four-Language Checker Proof, Privacy, and Audit

**Goal:** Add focused tests and a service-backed E2E proof covering all four Workshop checker paths, then audit and record evidence.

**Requirements:** CHECKTEST-01, CHECKTEST-02, CHECKTEST-03, CHECKTEST-04, CHECKTEST-05

**Canonical refs:**
- `.planning/REQUIREMENTS.md` - test, privacy, and audit requirements.
- `.planning/ROADMAP.md` - v1.34 phase success criteria.
- `.planning/phases/238-workshop-checker-path-inventory-and-public-contract/238-CONTEXT.md` - checker contract decisions.
- `.planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md` - parity implementation decisions.
- `.planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md` - diagnostics and UI decisions.
- `.planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md` - caching and boundary decisions.
- `.planning/artifacts/v1.32-four-language-signed-in-proof.md` - prior all-language service-backed proof baseline.

**Success criteria:**
1. Focused tests cover Validate source and submit/save/entry parity for TypeScript, Python, Rust, and Zig across invalid source, forbidden capability/import/package, compile/artifact/provenance mismatch, unavailable runtime-service/toolchain, timeout/limit, invalid output/schema, and no-fallback cases.
2. Privacy scans cover checker responses, UI text, fixtures/logs where relevant, and public/default output for source, raw diagnostics, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, and objective payload leaks.
3. A service-backed E2E proof validates all four Workshop checker paths end to end using runtime-service/provider semantics where required.
4. Boundary monitors prove TinyGo remains spike-only/hidden, TypeScript/Python claims remain provenance-only, Rust/Zig remain immutable WASM/WASI Preview 1 artifact-backed, and Strategy execution stays out of web/API/Go.
5. Final validation records inventory findings, parity decisions, checker UX evidence, cache/debounce behavior, test commands, service-backed proof, privacy scans, local service/toolchain limitations, and audit outcome.

## Coverage

- v1 requirements: 23 total
- Complete: 23
- Planned: 0
- Mapped to phases: 23
- Unmapped: 0

## Next Up

Run final milestone audit/archive flow for v1.34 after review agents are incorporated.

---
*Roadmap updated: 2026-06-14 after Phases 239-242 implementation and verification*
