# Requirements: Coward's Game v1.35

**Defined:** 2026-06-14
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Milestone Goal

Close or explicitly reframe the remaining runtime/account/security-policy edges so Coward's Game has honest, testable, production-facing boundaries for account-owned Strategy Revisions, provider proof, sandbox-readiness evidence, and package/dependency policy without changing runtime ownership or making unsupported sandbox claims.

## Baseline

- v1.34 Workshop Provider Checker Parity is shipped and archived.
- TypeScript, Python, Rust, and Zig are supported counted Strategy languages through provider-gated runtime evidence.
- TypeScript and Python have source-language artifact provenance with runtime-service provider proof binding source hash/bytes and artifact hash/bytes; this remains provenance evidence, not WASM isolation.
- Rust and Zig remain immutable WASM/WASI Preview 1 artifact-backed lanes.
- TinyGo remains spike-only and hidden from production surfaces.
- Strategy execution remains outside web/API/Go and behind runtime-service / Runtime Broker / provider boundaries.
- Go owns normal backend orchestration and selected account/entry/public evidence surfaces, but TypeScript account-save/provider-proof drift remains a standing limitation.
- Package ecosystems and dependency policy are intentionally unsolved beyond current no-rich-package/no-host-import behavior.

## Hard Boundaries

- Do not execute Strategy code in the web/API process.
- Do not execute Strategy code in Go.
- Do not use Node `vm` as a security boundary for hostile Strategy code.
- Strategy validation/build/execution remains behind runtime-service / Runtime Broker / language provider boundaries when hostile-code semantics are involved.
- TypeScript and Python artifact provenance remains provenance evidence, not WASM isolation or production sandbox certification.
- Rust and Zig remain immutable WASM/WASI Preview 1 artifact-backed lanes; do not replace the active ABI in this milestone.
- TinyGo remains spike-only and must not appear in production-supported Workshop, submit/save, account, entry, result, replay, or public evidence surfaces.
- Public/default output must not expose raw diagnostics, Strategy source, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, objective payloads, owner-debug payloads, raw Awareness Grids, quarantine details, operator action details, or recovery payloads.
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle.

## v1 Requirements

### Boundary Inventory and Decisions

- [ ] **INV-01**: Developer can inventory every v1.35-affected account save, account-owned revision/source read, owner-debug/private replay, Workshop compatibility alias, competition entry, Go-owned read/write, provider-proof, sandbox-claim, package/dependency, TinyGo, and privacy monitor surface.
- [ ] **INV-02**: Developer can classify every inventoried surface as fix-now, quarantine, deprecate/remove, document-only, or future, with current owner, trust boundary, public/private data class, required tests, and follow-up evidence.
- [ ] **INV-03**: Developer can lock the v1.35 decision register before behavioral changes so later phases know which surfaces must preserve, migrate, hide, or fail loudly.

### Account Save and Provider Proof

- [ ] **ACCT-01**: Go runtime-service validation can request and accept TypeScript provider validation using the same runtime-service/provider boundary as Workshop submit and checker paths.
- [ ] **ACCT-02**: TypeScript account-owned Strategy Revision save through Go stores provider runtime, validation, engine compatibility, source-artifact identity, and provider-proof metadata equivalent to the current provider-grade proof path where the revision is execution-ready or entry-eligible.
- [ ] **ACCT-03**: Account save distinguishes provider-validated execution-ready revisions from invalid revisions, unavailable/system states, and any explicitly allowed non-execution draft storage.
- [ ] **ACCT-04**: If runtime-service proof is unavailable, stale, missing, mismatched, malformed, unverifiable, oversized, or incompatible, Go account save fails closed or saves only as clearly non-execution draft storage with no eligibility/readiness claim.
- [ ] **ACCT-05**: Go account-save validation errors are normalized into public-safe categories without exposing raw diagnostics, source, artifact bytes, host paths, env values, package paths, tokens, DB details, provider signing material, or private runtime internals by default.

### Entry Eligibility and Go/Persistence Parity

- [ ] **ENTRY-01**: Counted Go exhibition, persistence competition, and ladder entry gates require current provider-grade proof for TypeScript, Python, Rust, and Zig where eligibility depends on execution readiness.
- [ ] **ENTRY-02**: Non-counted exhibition gates still reject unsupported providers, hidden TinyGo, stale/missing/mismatched artifacts, incompatible runtime metadata, non-`none` package mode, invalid owner/revision state, and silent fallback.
- [ ] **ENTRY-03**: Go and persistence eligibility checks agree for eligible, draft, invalid, stale-proof, missing-proof, mismatched-proof, unsupported-provider, package-declared, unavailable-runtime, and TinyGo cases.
- [ ] **ENTRY-04**: Account, entry, public Strategy, result, replay, and developer evidence labels derive readiness from provider proof and registry policy rather than local language assumptions.

### Ownership, Local Trust, and Private Replay

- [ ] **AUTH-01**: `player:workshop-local` and no-auth local shortcuts are restricted to ephemeral Workshop/test-only flows and cannot authorize persisted account-owned revisions, private source reads, owner-debug replay, private analytics, or competition entry.
- [ ] **AUTH-02**: Account-owned Strategy source/read/write paths require the current server-authorized account/session or internal test authorization and return private/no-store responses where source or owner-private evidence is involved.
- [ ] **PRIV-01**: Owner-debug/private replay evidence requires server-side owner/participant authorization or internal test authorization; query parameters may request owner view but cannot grant it.
- [ ] **PRIV-02**: Public/default replay, result, account, Strategy, entry, checker, and evidence outputs omit owner-debug payloads, owner-private data, Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grids, raw diagnostics, host paths, env values, tokens, DB details, package paths, artifact bytes, provider signing material, and private runtime internals.

### Workshop Compatibility Aliases

- [ ] **API-01**: Developer can decide the fate of legacy Workshop source, submit, save, and compatibility aliases as removed, hidden/local-only, migrated, or deprecated.
- [ ] **API-02**: Removed or deprecated aliases return explicit public-safe migration errors without leaking source, owner-private data, provider internals, host paths, raw diagnostics, or account details.
- [ ] **API-03**: Retained aliases are tested so they cannot bypass current provider-proof, account authorization, package policy, TinyGo hiding, or public/default privacy rules.

### Sandbox-Readiness and Labels

- [ ] **SBOX-01**: Developer can publish a versioned sandbox-readiness/certification contract that distinguishes runtime containment, hostile-code evidence, source/artifact provenance, immutable artifact backing, candidate-readiness evidence, unavailable lanes, spike-only lanes, and actual production sandbox certification.
- [ ] **SBOX-02**: No lane claims production sandbox certification unless the explicit evidence checklist is complete; current lanes remain uncertified unless v1.35 produces that evidence.
- [ ] **LABEL-01**: Public and developer labels state that TypeScript/Python are provenance-only, Rust/Zig are immutable WASM/WASI Preview 1 artifact-backed, TinyGo is spike-only/hidden, and no current lane silently claims stronger isolation than it proves.
- [ ] **LABEL-02**: Boundary monitors fail loudly on forbidden claim drift such as TypeScript/Python WASM isolation, broad production sandbox certification, TinyGo production support, package ecosystem support, or active direct-export/Component Model/WIT ABI claims.

### Package and Dependency Policy

- [ ] **PKG-01**: Developer can define the current package/dependency policy per language: no TypeScript packages/host imports, no Python packages/host imports, no Rust external crates or package installation for production Strategy support, no Zig packages or host imports beyond approved no-std/helper lanes, and no TinyGo production packages.
- [ ] **PKG-02**: Account save, Workshop validation/submit, competition entry, runtime registry, compatibility keys, and public evidence enforce package mode `none` for current production Strategy lanes.
- [ ] **PKG-03**: Package/dependency diagnostics are public-safe and do not expose package paths, host paths, env values, tokens, DB details, artifact bytes, raw compiler/runtime output, raw diagnostics, source, or private runtime internals.
- [ ] **PKG-04**: Future package support requirements are documented without enabling packages, including reproducible dependency resolution, lockfiles, supply-chain policy, native-code policy, sandboxed build/install, deterministic outputs, cache invalidation, privacy redaction, rollback, and runtime-boundary proof.

### Tests, Proof, Privacy, and Monitors

- [ ] **PROOF-01**: Focused unit/integration/API tests cover account-save/provider-proof states across TypeScript, Python, Rust, and Zig, including valid, invalid, draft/non-execution, unavailable-runtime, stale/missing/mismatched proof, malformed provider response, package-declared, unsupported-provider, and TinyGo-hidden cases.
- [ ] **PROOF-02**: At least one service-backed proof shows a TypeScript account revision saved through Go carries provider proof and can become entry-eligible only with matching source/artifact identity and current provider metadata.
- [ ] **PROOF-03**: Privacy scans cover account source routes, owner-debug replay, public replay/result pages and APIs, Workshop aliases, checker/provider proof responses, package diagnostics, logs/fixtures where relevant, and generated proof artifacts for all forbidden private markers.
- [ ] **PROOF-04**: Boundary monitors prove no Strategy execution moved into web/API/Go, TinyGo remains hidden, TypeScript/Python remain provenance-only, Rust/Zig remain immutable WASM/WASI Preview 1 artifact-backed, package mode stays `none`, and unsupported sandbox/package claims fail loudly.
- [ ] **PROOF-05**: Final validation records inventory findings, provider-proof decisions, account/entry readiness behavior, alias decisions, sandbox-readiness contract, package policy, test commands, service-backed proof, privacy scans, boundary monitors, local service/toolchain limitations, and audit outcome.

## Future Requirements

### Future Runtime, Account, Sandbox, Package, and Competition Work

- **FUT-RUNTIME-01**: Production sandbox certification requires a future explicit milestone that defines the certification target, isolation boundary, threat model, hostile probes, operational controls, CI/production-equivalent evidence, rollback, and public/developer claim contract.
- **FUT-PKG-01**: Rich package/dependency ecosystems for TypeScript, Python, Rust, Zig, or TinyGo require a future explicit package-lane milestone covering supply chain, reproducibility, lockfiles, native code, deterministic builds, privacy, cache invalidation, and runtime-boundary proof.
- **FUT-TINYGO-01**: TinyGo production support requires a future explicit productionization milestone that resolves forbidden WASI imports, GA constraints, provider proof, product labels, conformance, public evidence, privacy, and user approval.
- **FUT-ABI-01**: Direct exports or Component Model/WIT can replace Preview 1 stdin/stdout JSON only after a separate ABI migration proves parity, schema validation, caps, memory ownership, privacy, rollback, and replay compatibility.
- **FUT-COMP-01**: Competition maturity, durable ratings, abuse/dispute/account-recovery posture, standings governance, and public beta claims belong in v1.36 or later after v1.35 provider-proof/account/security-policy gates exist.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Strategy execution in web/API/Go | Runtime-service / Runtime Broker / provider boundaries remain the hostile-code boundary. |
| New runtime ownership model | v1.35 is a contract and policy cleanup, not a Runtime Broker ownership migration. |
| Production sandbox certification by default | Current evidence calibrates claims; certification requires explicit future proof unless v1.35 genuinely completes the named checklist. |
| TypeScript/Python WASM isolation claims | Source-language artifact provenance is evidence, not WASM/WASI isolation. |
| Rust/Zig ABI migration | Existing WASM/WASI Preview 1 artifact-backed behavior must remain stable. |
| TinyGo production support | TinyGo remains spike-only/hidden until a future approved milestone resolves its risks. |
| Rich package ecosystem expansion | v1.35 documents and enforces no-package policy; it does not enable packages. |
| Durable ratings or public competition governance maturity | Competition maturity is planned for v1.36 after account/provider/security gates are cleaned up. |
| Public raw diagnostics or private internals | Default/public output must remain redacted and public-safe. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| INV-01..INV-03 | TBD | Pending |
| ACCT-01..ACCT-05 | TBD | Pending |
| ENTRY-01..ENTRY-04 | TBD | Pending |
| AUTH-01..AUTH-02 | TBD | Pending |
| PRIV-01..PRIV-02 | TBD | Pending |
| API-01..API-03 | TBD | Pending |
| SBOX-01..SBOX-02 | TBD | Pending |
| LABEL-01..LABEL-02 | TBD | Pending |
| PKG-01..PKG-04 | TBD | Pending |
| PROOF-01..PROOF-05 | TBD | Pending |

**Coverage:**
- v1 requirements: 32 total
- Complete: 0
- Planned: 0
- Mapped to phases: 0
- Unmapped: 32

---
*Requirements defined: 2026-06-14*
*Last updated: 2026-06-14 after v1.35 research synthesis*
