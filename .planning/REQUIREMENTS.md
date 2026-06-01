# Requirements: Coward's Game v1.34

**Defined:** 2026-06-01
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Milestone Goal

Bring Workshop "Validate source" checker behavior for TypeScript, Python, Rust, and Zig up to the same practical quality by routing validation through provider/runtime-service semantics where appropriate, producing accurate public-safe diagnostics before submit, save, and entry without changing runtime ownership or making new sandbox claims.

## Baseline

- v1.33 Source Artifact Provenance and TinyGo WASI Spike is shipped and tagged.
- TypeScript, Python, Rust, and Zig are supported counted Strategy languages only through provider-compatible runtime evidence.
- TypeScript and Python have source-language artifact provenance with runtime-service provider proof binding source hash/bytes and artifact hash/bytes.
- Rust and Zig remain immutable WASM/WASI Preview 1 artifact-backed production languages.
- TinyGo remains spike-only and hidden from production surfaces.
- Workshop Validate source is expected to be fast and useful before submit/save/entry, but Python/Rust/Zig checker behavior now needs parity with the provider-grade semantics used by submit.
- Runtime-service / Runtime Broker / provider boundaries remain the hostile-code boundary.
- Public/default output must remain public-safe and must not expose Strategy source, private memory, objective payloads, raw diagnostics, host paths, env values, package paths, artifact bytes, tokens, DB details, or private runtime internals.

## Hard Boundaries

- Do not execute Strategy code in the web/API process.
- Do not execute Strategy code in Go.
- Do not use Node `vm` as a security boundary for hostile Strategy code.
- Strategy validation and execution must remain behind runtime-service / Runtime Broker / language provider boundaries when hostile-code semantics are involved.
- TypeScript and Python artifact provenance remains provenance evidence, not WASM isolation or production sandbox certification.
- Rust and Zig remain immutable WASM/WASI Preview 1 artifact-backed lanes; do not replace the active ABI in this milestone.
- TinyGo remains spike-only and must not appear in production-supported Workshop, submit/save, entry, result, replay, or public evidence surfaces.
- Validate source may provide diagnostics, but public/default output must redact raw compiler/runtime diagnostics, Strategy source, artifact bytes, host paths, env values, package paths, tokens, DB details, and private runtime internals.
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle.

## v1 Requirements

### Workshop Checker Inventory and Contract

- [x] **CHECKINV-01**: Developer can inventory the current Workshop Validate source, submit, save, and competition-entry validation paths for TypeScript, Python, Rust, and Zig, including frontend calls, app/API routes, Go/API involvement, runtime-service/provider calls, cache behavior, and diagnostic surfaces.
- [x] **CHECKINV-02**: Developer can identify every semantic difference between Validate source and submit/save/entry validation for Python, Rust, and Zig, with TypeScript recorded as the practical parity baseline.
- [x] **CHECKINV-03**: Developer can define a single public-safe Workshop checker contract for all four production languages, including status, diagnostic category, severity, actionability, language/provider id, artifact/provenance state, runtime-service/toolchain availability, and privacy exclusions.
- [x] **CHECKINV-04**: Developer can preserve submit/save/entry ownership and runtime-service/provider boundaries while allowing Validate source to reuse provider-grade validation semantics where appropriate.

### Provider-Grade Validate Source Semantics

- [ ] **CHECKVAL-01**: Workshop Validate source for TypeScript continues to use the existing provider-grade checker semantics and remains the parity baseline for status, actionability, and public-safe diagnostics.
- [ ] **CHECKVAL-02**: Workshop Validate source for Python uses the same constrained provider/runtime-service validation semantics as submit, including policy checks for forbidden capabilities, imports, packages, source/artifact provenance compatibility, limits, and public-safe failure categories.
- [ ] **CHECKVAL-03**: Workshop Validate source for Rust uses provider/runtime-service artifact validation semantics equivalent to submit, including compile/toolchain checks, WASM/WASI Preview 1 artifact metadata, import compatibility, stale/missing/mismatched artifact detection, and public-safe failure categories.
- [ ] **CHECKVAL-04**: Workshop Validate source for Zig uses provider/runtime-service artifact validation semantics equivalent to submit, including compile/toolchain checks, no-std/helper compatibility, WASM/WASI Preview 1 artifact metadata, import compatibility, stale/missing/mismatched artifact detection, and public-safe failure categories.
- [ ] **CHECKVAL-05**: Validate, submit, save, and entry paths fail consistently for unsupported providers, stale artifacts, mismatched provenance, invalid output shape, unavailable runtime-service, unavailable toolchain, and privacy-unsafe diagnostics without silently falling back to another runtime or mutable source.

### Language-Specific Diagnostics and UX

- [ ] **CHECKDIAG-01**: Python Workshop diagnostics distinguish policy/capability errors, forbidden imports, package/dependency errors, syntax/build errors, provenance errors, runtime-service unavailable, timeout/limit failures, and invalid output/schema failures using actionable, public-safe messages.
- [ ] **CHECKDIAG-02**: Rust Workshop diagnostics distinguish compile errors, artifact/provenance errors, forbidden WASI/import errors, runtime-service errors, toolchain unavailable, timeout/limit failures, and invalid output/schema failures using actionable, public-safe messages.
- [ ] **CHECKDIAG-03**: Zig Workshop diagnostics distinguish compile errors, artifact/provenance errors, forbidden WASI/import errors, no-std/helper misuse, runtime-service errors, toolchain unavailable, timeout/limit failures, and invalid output/schema failures using actionable, public-safe messages.
- [ ] **CHECKDIAG-04**: Toolchain-unavailable and runtime-service-unavailable states are honest, calm, non-scary, and explain what the player can do next without implying their Strategy is unsafe or broken.
- [ ] **CHECKDIAG-05**: Diagnostics never expose Strategy source, raw diagnostics, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, or objective payloads in public/default Workshop output.

### Checker Ergonomics, Caching, and Boundaries

- [ ] **CHECKERG-01**: Rust and Zig Workshop validation is debounced, cached, coalesced, or otherwise made realistic enough for ordinary editing without excessive compile/runtime-service calls or stale status flicker.
- [ ] **CHECKERG-02**: Checker caching keys account for language, provider id, source hash/bytes, artifact hash/bytes where applicable, toolchain/provider compatibility metadata, and validation policy so stale or cross-language diagnostics cannot be reused incorrectly.
- [ ] **CHECKERG-03**: Workshop UI clearly separates checking, checked, unavailable, failed, stale, and ready states across TypeScript, Python, Rust, and Zig without adding TinyGo to production surfaces.
- [ ] **CHECKERG-04**: Web/API/Go surfaces treat checker responses as validated data and do not execute Strategy source, compiler artifacts, or runtime payloads outside the approved runtime-service/provider boundary.

### Tests, E2E Proof, and Audit

- [ ] **CHECKTEST-01**: Focused unit/integration tests cover Validate source and submit/save/entry parity for TypeScript, Python, Rust, and Zig, including invalid source, forbidden capability/import/package, compile/artifact/provenance mismatch, unavailable runtime-service/toolchain, timeout/limit, invalid output/schema, and no-fallback cases.
- [ ] **CHECKTEST-02**: Privacy tests scan Workshop checker responses, UI text, logs/fixtures where relevant, and public/default output for Strategy source, raw diagnostics, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, and objective payload leaks.
- [ ] **CHECKTEST-03**: At least one service-backed E2E proof validates all four Workshop checker paths end to end for TypeScript, Python, Rust, and Zig using runtime-service/provider semantics where required.
- [ ] **CHECKTEST-04**: Boundary monitors prove no Strategy execution moved into web/API/Go, TinyGo remains spike-only/hidden, TypeScript/Python provenance claims remain non-WASM-isolation claims, and Rust/Zig remain immutable WASM/WASI Preview 1 artifact-backed lanes.
- [ ] **CHECKTEST-05**: Final validation records inventory findings, parity decisions, checker UX evidence, caching/debounce behavior, test commands, service-backed E2E proof, privacy scans, audit outcome, and any local toolchain/runtime-service limitations.

## Future Requirements

### Future Runtime and Checker Work

- **FUT-CHECK-01**: TinyGo production Workshop checker support requires a future explicit productionization milestone that resolves forbidden WASI imports, GA constraints, provider proof, product labels, conformance, public evidence, privacy, and user approval.
- **FUT-CHECK-02**: Rich package/dependency ecosystems for TypeScript, Python, Rust, Zig, or TinyGo require separate supply-chain, reproducibility, native-code, and deterministic-build policies.
- **FUT-CHECK-03**: Direct exports or Component Model/WIT can replace Preview 1 stdin/stdout JSON only after a separate ABI migration proves parity, schema validation, caps, memory ownership, privacy, rollback, and replay compatibility.
- **FUT-CHECK-04**: Stronger Python or TypeScript sandbox claims require a separate runtime isolation plan and must not be inferred from checker parity or artifact provenance.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Go production Strategy runtime work | This milestone intentionally skips Go production work and keeps hostile Strategy execution outside Go. |
| TinyGo production support | TinyGo remains spike-only/hidden until a future approved milestone resolves its risks. |
| New sandbox certification claims | Checker parity improves validation UX; it does not certify a broader production sandbox. |
| TypeScript/Python WASM isolation claims | Source-language provenance is evidence, not WASM/WASI isolation. |
| Rust/Zig ABI migration | Existing WASM/WASI Preview 1 artifact-backed behavior must remain stable. |
| Strategy execution in web/API/Go | Runtime-service / Runtime Broker / provider boundaries remain the hostile-code boundary. |
| Public raw diagnostics or private internals | Default/public output must remain redacted and public-safe. |
| Package ecosystem expansion | Dependencies and packages require separate policy work. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| CHECKINV-01..CHECKINV-04 | Phase 238 | Complete |
| CHECKVAL-01..CHECKVAL-05 | Phase 239 | Planned |
| CHECKDIAG-01..CHECKDIAG-05 | Phase 240 | Planned |
| CHECKERG-01..CHECKERG-04 | Phase 241 | Planned |
| CHECKTEST-01..CHECKTEST-05 | Phase 242 | Planned |

**Coverage:**
- v1 requirements: 23 total
- Complete: 4
- Planned: 19
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-06-01*
*Last updated: 2026-06-01 after Phase 238 completion*
