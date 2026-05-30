# Requirements: Coward's Game v1.24

**Defined:** 2026-05-30
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Milestone Goal

Build a serious runtime abuse lab and production-sandbox readiness matrix across current Strategy runtime lanes, while spiking direct exports and Component Model/WIT as future ABI paths without silently changing Match execution.

## Baseline

- v1.23 is complete, committed, tagged `v1.23`, and archived.
- Active `.planning/REQUIREMENTS.md` was absent before this milestone began.
- JS/TS remains the counted Strategy path.
- Python remains non-counted exhibition beta.
- Rust and Zig remain non-counted exhibition beta.
- No Rust, Zig, Python, or WASM/WASI counted/ranked/ladder/gauntlet promotion is allowed in this milestone.
- Preview 1 stdin/stdout JSON remains the active WASM/WASI execution ABI unless an explicit future decision promotes a replacement.
- Direct exports and Component Model/WIT remain proof spikes only.
- Go owns orchestration, persistence-facing backend behavior, Match lifecycle, scoring, public evidence, retry policy, and promotion decisions.
- Runtime-service owns hostile Strategy execution only through schema-validated ABI envelopes and registered runtime implementations.
- Public output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, or private runtime internals by default.

## v1 Requirements

### Baseline and Claims Contract

- [ ] **BASE-01**: Operator can inspect a v1.23 baseline summary before implementation begins.
- [ ] **BASE-02**: Operator can inspect a v1.24 threat model covering current runtime lanes and hostile Strategy assumptions.
- [ ] **BASE-03**: Operator can inspect a claims contract that separates readiness evidence, exhibition beta status, counted eligibility, and production sandbox certification.
- [ ] **BASE-04**: Planning artifacts explicitly preserve JS/TS counted status and Python/Rust/Zig non-counted exhibition beta status.
- [ ] **BASE-05**: Planning artifacts explicitly reject counted/ranked/ladder/gauntlet promotion for Python, Rust, Zig, and WASM/WASI.
- [ ] **BASE-06**: Planning artifacts explicitly preserve Go/runtime-service ownership boundaries and public-output privacy exclusions.

### Abuse Taxonomy and Evidence Schema

- [ ] **LAB-01**: Operator can inspect a runtime abuse taxonomy spanning JS/TS, Python, Rust, Zig, and WASM/WASI lanes.
- [ ] **LAB-02**: Operator can inspect evidence schemas that record runtime lane, probe class, expected outcome, observed outcome, failure class, privacy class, and promotion impact.
- [ ] **LAB-03**: Abuse evidence distinguishes Strategy failure from system failure.
- [ ] **LAB-04**: Abuse evidence distinguishes unsupported/unavailable lanes from passing runtime protection.
- [ ] **LAB-05**: Abuse evidence is public-safe by default and redacts private Strategy/runtime details.
- [ ] **LAB-06**: Abuse lab commands can be rerun locally without requiring production credentials or external services.

### JS/TS and Python Abuse Probes

- [ ] **JSPY-01**: Runtime-service can run JS/TS abuse probes for timeout, oversized output, malformed result, invalid schema/action, thrown error, and runtime unavailability.
- [ ] **JSPY-02**: Runtime-service can run JS/TS probes for forbidden filesystem, network, process/shell, environment, time/random, and package capability attempts where applicable.
- [ ] **JSPY-03**: JS/TS probe failures never fall back to web/API/Go Strategy execution.
- [ ] **JSPY-04**: Runtime-service can run Python abuse probes for timeout, oversized output, malformed result, invalid schema/action, crash, and runtime unavailability.
- [ ] **JSPY-05**: Runtime-service can run Python probes for forbidden filesystem, network, process/shell, imports/packages, environment, time/random, and host path attempts where applicable.
- [ ] **JSPY-06**: Python probe failures never fall back to JS/TS, source execution in Go, or stale artifacts.
- [ ] **JSPY-07**: JS/TS and Python abuse evidence stays public-safe and preserves counted/non-counted eligibility boundaries.

### WASM/WASI Rust/Zig Abuse Probes

- [ ] **WASM-01**: Runtime-service can run Rust WASM/WASI probes for timeout/fuel, memory cap, stdio/result cap, malformed JSON, invalid schema/action, panic/trap/abort, and runtime unavailability.
- [ ] **WASM-02**: Runtime-service can run Zig WASM/WASI probes for timeout/fuel, memory cap, stdio/result cap, malformed JSON, invalid schema/action, panic/trap/abort, and runtime unavailability.
- [ ] **WASM-03**: Rust probes cover stale hash, missing artifact, mismatched target, mismatched runtime implementation, mismatched ABI metadata, and missing toolchain where applicable.
- [ ] **WASM-04**: Zig probes cover stale hash, missing artifact, mismatched target, mismatched runtime implementation, mismatched ABI metadata, and missing toolchain where applicable.
- [ ] **WASM-05**: Rust/Zig capability probes fail loud for forbidden filesystem/preopen, network, clock/random, environment, package, and host import surfaces where applicable.
- [ ] **WASM-06**: WASM/WASI probe failures never fall back to JS/TS, Python, mutable source execution, stale artifacts, or alternate ABI execution.
- [ ] **WASM-07**: Rust/Zig abuse evidence stays non-counted exhibition beta only and does not claim production sandbox certification.

### Sandbox Readiness Matrix

- [ ] **MATRIX-01**: Operator can inspect a cross-runtime readiness matrix for JS/TS, Python, Rust, Zig, WASM/WASI, direct exports, and Component Model/WIT.
- [ ] **MATRIX-02**: The readiness matrix states what each lane proves, does not prove, and requires before stronger sandbox claims.
- [ ] **MATRIX-03**: The readiness matrix separates local evidence, CI evidence, signed-in proof, operational/deployment proof, and production certification gaps.
- [ ] **MATRIX-04**: The readiness matrix records no-fallback status for stopped, unavailable, stale, mismatched, malformed, and capability-invalid runtime lanes.
- [ ] **MATRIX-05**: Public-facing readiness summaries do not expose private diagnostics, source, memory, objectives, host paths, env values, tokens, DB details, package paths, or private runtime internals.

### Direct-Export ABI Spike

- [ ] **DEX-01**: Operator can inspect a direct-export ABI proof or fail-loud non-promotion artifact.
- [ ] **DEX-02**: Direct-export proof records memory allocation/free rules, input buffer ownership, output buffer ownership, and string/buffer encoding.
- [ ] **DEX-03**: Direct-export proof records timeout/fuel, memory, result size, malformed output, invalid schema/action, trap, and privacy behavior.
- [ ] **DEX-04**: Direct-export proof attempts Rust and Zig parity where feasible and records fail-loud non-parity where not feasible.
- [ ] **DEX-05**: Direct-export artifacts cannot become Match execution artifacts without explicit future promotion.
- [ ] **DEX-06**: Direct-export proof records compatibility and rollback impact against existing Preview 1 JSON artifact metadata.

### Component Model/WIT ABI Spike

- [ ] **WIT-01**: Operator can inspect a Component Model/WIT proof or fail-loud non-promotion artifact.
- [ ] **WIT-02**: Component Model/WIT proof records a minimal Strategy world/interface shape and generated binding/tooling status.
- [ ] **WIT-03**: Component Model/WIT proof records Wasmtime host integration, import surface, timeout/fuel, memory, result cap, validation, trap, and privacy behavior.
- [ ] **WIT-04**: Component Model/WIT proof attempts Rust and Zig parity where feasible and records fail-loud non-parity where not feasible.
- [ ] **WIT-05**: Component Model/WIT artifacts cannot become Match execution artifacts without explicit future promotion.
- [ ] **WIT-06**: Component Model/WIT proof records compatibility and rollback impact against existing Preview 1 JSON artifact metadata.

### ABI Decision and Migration Criteria

- [ ] **ABIDEC-01**: Operator can inspect an ABI decision that explicitly keeps or changes the active WASM/WASI execution ABI.
- [ ] **ABIDEC-02**: If Preview 1 JSON remains active, the decision states why direct exports and Component Model/WIT are not promoted.
- [ ] **ABIDEC-03**: If any ABI replacement is considered, the decision records required compatibility, schema, caps, privacy, no-fallback, replay, and rollback evidence.
- [ ] **ABIDEC-04**: Runtime metadata and eligibility gates fail closed for unknown, stale, mismatched, or unpromoted ABI metadata.
- [ ] **ABIDEC-05**: Migration criteria define how old and new artifacts coexist, roll back, and remain replay-compatible.
- [ ] **ABIDEC-06**: ABI decision explicitly preserves Go/runtime-service ownership boundaries and prevents Strategy execution in web/API/Go.

### Signed-In Regression and Public Privacy

- [ ] **REG-01**: Signed-in proof shows JS/TS counted Strategy support still works.
- [ ] **REG-02**: Signed-in proof shows Python non-counted exhibition beta still works.
- [ ] **REG-03**: Signed-in proof shows Rust non-counted exhibition beta still works.
- [ ] **REG-04**: Signed-in proof shows Zig non-counted exhibition beta still works.
- [ ] **REG-05**: Signed-in proof opens MatchSet result pages with public-safe language/runtime/evidence labels.
- [ ] **REG-06**: Signed-in proof opens replay pages with plausible full Match starts, visible Soldiers and terrain inside declared board bounds, and nonblank replay boards.
- [ ] **REG-07**: Public result/replay output does not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, or private runtime internals by default.
- [ ] **REG-08**: Signed-in proof records no silent fallback when runtime lanes are unavailable, stopped, stale, mismatched, malformed, or capability-invalid.

### Audit and Closure

- [ ] **CLOSE-01**: Code review verifies abuse-lab, ABI-spike, no-fallback, privacy, and boundary changes before closure.
- [ ] **CLOSE-02**: Validation verifies requirement coverage, abuse evidence, readiness matrix, ABI decision, signed-in proof, replay plausibility, and public privacy.
- [ ] **CLOSE-03**: Final milestone decision states whether production sandbox certification remains unclaimed or is explicitly supported by evidence.
- [ ] **CLOSE-04**: Final milestone decision states that Python, Rust, Zig, and WASM/WASI remain non-counted/non-ranked unless explicit evidence says otherwise.
- [ ] **CLOSE-05**: v1.24 planning artifacts are archived, active requirements are removed at milestone close, and commit/tag evidence is recorded.

## Future Requirements

### Runtime and ABI

- **FUT-SBX-01**: Runtime lanes can be considered for production sandbox certification only after dedicated deployment, operations, abuse, isolation, incident-response, monitoring, resource-governance, and external-review evidence.
- **FUT-ABI-01**: Strategy execution can migrate to direct exports only after parity, memory ownership, validation, caps, privacy, replay, no-fallback, artifact compatibility, and rollback proof pass in a dedicated promotion milestone.
- **FUT-ABI-02**: Strategy execution can migrate to Component Model/WIT only after WIT world shape, Rust/Zig toolchains, generated bindings, Wasmtime hosting, validation, caps, privacy, replay, no-fallback, artifact compatibility, and rollback proof pass in a dedicated promotion milestone.
- **FUT-LANG-01**: Python/Rust/Zig can be considered for counted play only after governance, deterministic compatibility, sandbox, privacy, ranking, replay, rollback, abuse, and operational criteria are proven.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Production sandbox certification by default | v1.24 is a readiness and evidence milestone unless final evidence explicitly supports a stronger claim. |
| Python/Rust/Zig counted, ranked, ladder, gauntlet, or durable rating eligibility | JS/TS remains the counted Strategy path; non-JS lanes remain non-counted exhibition beta. |
| Direct-export or Component Model/WIT Match execution migration | v1.24 may spike these ABIs but must not silently replace Preview 1 JSON. |
| Runtime-service becoming a backend owner | Runtime-service owns hostile execution only; Go owns orchestration and persistence-facing backend behavior. |
| Go/web/API Strategy execution | Hostile Strategy code must stay behind runtime-service / Runtime Broker boundaries. |
| Arbitrary third-party package installation | Package policy and supply-chain risk require separate design and proof. |
| Public raw diagnostics or private runtime internals | Public evidence must remain source-free and private-data safe. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| BASE-01 | Phase 164 | Pending |
| BASE-02 | Phase 164 | Pending |
| BASE-03 | Phase 164 | Pending |
| BASE-04 | Phase 164 | Pending |
| BASE-05 | Phase 164 | Pending |
| BASE-06 | Phase 164 | Pending |
| LAB-01 | Phase 165 | Pending |
| LAB-02 | Phase 165 | Pending |
| LAB-03 | Phase 165 | Pending |
| LAB-04 | Phase 165 | Pending |
| LAB-05 | Phase 165 | Pending |
| LAB-06 | Phase 165 | Pending |
| JSPY-01 | Phase 166 | Pending |
| JSPY-02 | Phase 166 | Pending |
| JSPY-03 | Phase 166 | Pending |
| JSPY-04 | Phase 166 | Pending |
| JSPY-05 | Phase 166 | Pending |
| JSPY-06 | Phase 166 | Pending |
| JSPY-07 | Phase 166 | Pending |
| WASM-01 | Phase 167 | Pending |
| WASM-02 | Phase 167 | Pending |
| WASM-03 | Phase 167 | Pending |
| WASM-04 | Phase 167 | Pending |
| WASM-05 | Phase 167 | Pending |
| WASM-06 | Phase 167 | Pending |
| WASM-07 | Phase 167 | Pending |
| MATRIX-01 | Phase 168 | Pending |
| MATRIX-02 | Phase 168 | Pending |
| MATRIX-03 | Phase 168 | Pending |
| MATRIX-04 | Phase 168 | Pending |
| MATRIX-05 | Phase 168 | Pending |
| DEX-01 | Phase 169 | Pending |
| DEX-02 | Phase 169 | Pending |
| DEX-03 | Phase 169 | Pending |
| DEX-04 | Phase 169 | Pending |
| DEX-05 | Phase 169 | Pending |
| DEX-06 | Phase 169 | Pending |
| WIT-01 | Phase 170 | Pending |
| WIT-02 | Phase 170 | Pending |
| WIT-03 | Phase 170 | Pending |
| WIT-04 | Phase 170 | Pending |
| WIT-05 | Phase 170 | Pending |
| WIT-06 | Phase 170 | Pending |
| ABIDEC-01 | Phase 171 | Pending |
| ABIDEC-02 | Phase 171 | Pending |
| ABIDEC-03 | Phase 171 | Pending |
| ABIDEC-04 | Phase 171 | Pending |
| ABIDEC-05 | Phase 171 | Pending |
| ABIDEC-06 | Phase 171 | Pending |
| REG-01 | Phase 172 | Pending |
| REG-02 | Phase 172 | Pending |
| REG-03 | Phase 172 | Pending |
| REG-04 | Phase 172 | Pending |
| REG-05 | Phase 172 | Pending |
| REG-06 | Phase 172 | Pending |
| REG-07 | Phase 172 | Pending |
| REG-08 | Phase 172 | Pending |
| CLOSE-01 | Phase 173 | Pending |
| CLOSE-02 | Phase 173 | Pending |
| CLOSE-03 | Phase 173 | Pending |
| CLOSE-04 | Phase 173 | Pending |
| CLOSE-05 | Phase 173 | Pending |

**Coverage:**
- v1 requirements: 62 total
- Mapped to phases: 62
- Unmapped: 0

---
*Requirements defined: 2026-05-30*
*Last updated: 2026-05-30 after roadmap creation*
