# Requirements: Coward's Game v1.33

**Defined:** 2026-05-31
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Milestone Goal

Add artifact provenance for TypeScript and Python source-language providers, then run a contained TinyGo WASM/WASI spike without promoting the candidate language by default.

## Baseline

- v1.32 Four-Language Production Strategy Support is shipped and archived.
- TypeScript, Python, Rust, and Zig are supported counted Strategy languages only through provider-compatible runtime evidence.
- Rust and Zig are artifact-backed through immutable WASM/WASI Preview 1 stdin/stdout JSON artifacts whose provider proof binds source hash, source byte count, artifact hash, and artifact byte count.
- Python is source-backed through constrained provider validation with no packages, host imports, or host capabilities.
- TypeScript is source/transpile-backed through the JS/TS runtime path.
- Runtime-service / Runtime Broker is the hostile Strategy execution boundary.
- Go owns normal backend orchestration, Match lifecycle, scoring/status refresh, Chronicle persistence handoff, selected account reads, selected public reads, and public evidence.
- Public result and replay outputs are public-safe projections and do not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default.

## Hard Boundaries

- Do not execute Strategy code in the web/API process.
- Do not execute Strategy code in Go.
- Do not use Node `vm` as a security boundary for hostile Strategy code.
- Strategy execution must remain behind runtime-service / Runtime Broker / language provider boundaries.
- Preserve deterministic Match execution and canonical terms: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle.
- Treat Strategy source, generated artifacts, spike artifacts, compiler outputs, provider proofs, and runtime envelopes as hostile until validated.
- Source-language artifacts must fail closed if stale, missing, mismatched, unverifiable, or incompatible with provider metadata.
- TypeScript and Python artifact provenance must not be described as equivalent to WASM/WASI isolation or production sandbox certification.
- Rust and Zig artifact-backed behavior must not regress.
- TinyGo remains spike-only unless a future plan explicitly proves safety and the user approves productionizing it.
- Public output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, private runtime internals, quarantine details, operator action details, recovery payloads, or spike-only private artifacts.

## v1 Requirements

### TypeScript Artifact Provenance

- [ ] **TSART-01**: Developer can produce a canonical TypeScript executable artifact during validation/build using a deterministic build path and recorded toolchain/runtime metadata.
- [ ] **TSART-02**: TypeScript provider proof binds source hash, source byte count, artifact hash, artifact byte count, build policy, provider id, and compatibility metadata.
- [ ] **TSART-03**: TypeScript runtime execution uses the validated artifact path instead of silently re-transpiling mutable source for Match or MatchSet execution.
- [ ] **TSART-04**: TypeScript validation fails closed for missing, stale, mismatched, unverifiable, oversized, or incompatible artifacts.
- [ ] **TSART-05**: TypeScript artifact provenance tests cover source mismatch, artifact mismatch, stale artifact, runtime execution, no silent fallback, public privacy, and existing JS/TS counted behavior.
- [ ] **TSART-06**: Public and private TypeScript evidence surfaces show artifact-proven provider status without exposing Strategy source or private runtime internals by default.

### Python Artifact Provenance

- [ ] **PYART-01**: Developer can produce a Python artifact provenance layer such as a normalized source bundle, bytecode artifact, sealed executable bundle, or equivalent evidence object with explicit interpreter/version metadata.
- [ ] **PYART-02**: Python provider proof binds source hash, source byte count, artifact hash, artifact byte count, interpreter metadata, provider id, validation policy, and compatibility metadata.
- [ ] **PYART-03**: Python validation and execution preserve the current no-packages, no-host-imports, no-filesystem, no-network, no-clock/random, no-host-capabilities policy.
- [ ] **PYART-04**: Python validation fails closed for missing, stale, mismatched, unverifiable, oversized, incompatible, or policy-violating artifacts.
- [ ] **PYART-05**: Python runtime tests cover forbidden imports/capabilities, source mismatch, artifact mismatch, stale artifact, invalid output, timeout, oversized output, privacy, and no silent fallback.
- [ ] **PYART-06**: Docs and evidence surfaces explicitly state that Python artifact provenance is provenance evidence and not equivalent to WASM/WASI isolation or production sandbox certification.

### TinyGo WASM/WASI Spike

- [ ] **TINYGO-01**: Developer can build a minimal TinyGo Strategy artifact targeting WASI Preview 1 or the closest viable deterministic WebAssembly target available locally.
- [ ] **TINYGO-02**: TinyGo spike attempts to use the existing WASI Preview 1 stdin/stdout JSON Strategy ABI and documents any required adapter, shim, or incompatibility.
- [ ] **TINYGO-03**: TinyGo spike audits import tables and records allowed imports, forbidden imports, host capability risks, memory behavior, and any required runtime allowances.
- [ ] **TINYGO-04**: TinyGo spike measures compile viability, artifact size, startup latency, per-call latency, deterministic behavior, invalid-output behavior, timeout/trap behavior, and failure taxonomy.
- [ ] **TINYGO-05**: TinyGo spike produces public-safe artifacts and a concrete promote, defer, or reject recommendation without enabling production support or counted eligibility.

### Language Evidence, UI, Docs, and Verification

- [ ] **LANGDOC-01**: Supported-language docs and UI distinguish source-backed artifact-proven languages, WASM/WASI artifact-backed production languages, and spike-only candidate languages.
- [ ] **LANGDOC-02**: Provider evidence docs explain source hash/bytes, artifact hash/bytes, toolchain/interpreter metadata, validation policy, compatibility, privacy exclusions, and fail-closed semantics.
- [ ] **LANGDOC-03**: Product labels, entry flows, Strategy cards, results, replay, Learn/docs, and public evidence avoid implying TinyGo is production-supported unless explicitly approved.
- [ ] **LANGDOC-04**: Rust and Zig existing WASM/WASI artifact-backed provider behavior remains green under the expanded artifact provenance model.
- [ ] **LANGDOC-05**: Boundary monitors and privacy scans cover TypeScript/Python artifact proof, Rust/Zig regression, TinyGo spike-only labels, and no Strategy execution in web/API/Go.
- [ ] **LANGDOC-06**: Browser review covers supported-language pages and relevant evidence surfaces, verifying realistic language status labels and no overclaiming security or sandbox guarantees.
- [ ] **LANGDOC-07**: Final validation records tests, spike artifacts, import audit results, latency/size notes, recommendations, public privacy scans, replay board realism checks where replay or Match creation changes, and milestone audit outcome.

## Future Requirements

### Future Runtime Language Production

- **FUT-LANG-01**: TinyGo can become a production supported Strategy language only after a future milestone proves sandbox posture, deterministic ABI compatibility, provider proof, product surfaces, conformance, public evidence, signed-in proof, monitors, and user approval.
- **FUT-LANG-02**: Python isolation can be strengthened beyond artifact provenance only through a separate runtime isolation or WASM-backed migration plan with explicit claims, tests, rollback, and public documentation.
- **FUT-LANG-03**: Direct exports or Component Model/WIT can replace Preview 1 stdin/stdout JSON only after a separate migration proves parity, schema validation, caps, memory ownership, privacy, rollback, and replay compatibility.
- **FUT-LANG-04**: Rich package/dependency ecosystems for TypeScript, Python, Rust, Zig, or TinyGo require separate supply-chain, reproducibility, native-code, and deterministic-build policies.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Strategy execution in web/API/Go | Hostile Strategy code must remain behind runtime-service / Runtime Broker / provider boundaries. |
| Node `vm` as a security boundary | It is not an acceptable sandbox for hostile Strategy code. |
| Treating TypeScript/Python artifacts as sandbox certification | Artifact provenance binds evidence; it does not by itself prove WASM isolation or production sandboxing. |
| Production TinyGo support | v1.33 only spikes viability and records a recommendation unless explicit approval changes scope. |
| Rust/Zig ABI migration | Existing Rust/Zig behavior must remain green; any Preview 1 replacement is future work. |
| Public Strategy source, memory, or objective exposure | Public outputs must remain source-free, memory-free, and objective-payload-free by default. |
| Silent fallback to mutable source or another language runtime | Runtime and artifact failures must fail closed. |
| Package ecosystem expansion | Package/dependency policy is constrained to what existing providers explicitly support. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| TSART-01..TSART-06 | Phase 234 | Planned |
| PYART-01..PYART-06 | Phase 235 | Planned |
| TINYGO-01..TINYGO-05 | Phase 236 | Planned |
| LANGDOC-01..LANGDOC-07 | Phase 237 | Planned |

**Coverage:**
- v1 requirements: 24 total
- Complete: 0
- Planned: 24
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-05-31*
*Last updated: 2026-05-31 after v1.33 roadmap creation*
