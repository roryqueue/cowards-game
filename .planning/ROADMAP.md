# Roadmap: Coward's Game v1.32

## Active Milestone

**v1.32 Four-Language Production Strategy Support**

**Goal:** Promote JS/TS, Python, Rust, and Zig to fully supported counted Strategy languages with one shared eligibility model, one shared runtime/provider contract, one shared conformance suite, and strong drift prevention across Workshop, Account, competition entry, Match execution, results, replay, public evidence, docs, and monitors.

**Decision baseline:** v1.32 intentionally reopens language eligibility and runtime/provider contract work. Any execution DTO, ABI, service contract, Match execution contract, runtime eligibility, or counted eligibility change must be explicit, justified, versioned or migrated where needed, tested, audited, and documented. Strategy execution remains behind runtime-service / Runtime Broker / language provider boundaries.

## Phase Overview

| Phase | Name | Goal | Requirements | Success Criteria |
| --- | --- | --- | --- | --- |
| 222 | Language Surface Inventory | Inventory every current language, runtime, eligibility, product-label, docs, and monitor surface before changing behavior. | INV-01..INV-05 | Complete |
| 223 | Unified Supported Language Registry and Eligibility Model | Establish one shared supported-language source of truth for all four languages. | LANG-01..LANG-05 | Complete |
| 224 | StrategyLanguageProvider Runtime Contract | Define the provider/runtime contract, ABI posture, schema validation, and versioning path. | PROV-01..PROV-05 | Complete |
| 225 | Python Production Support Path | Promote Python through provider validation, runtime execution, counted eligibility, product surfaces, and signed-in proof. | PY-01..PY-05 | Complete |
| 226 | Rust Production Support Path | Promote Rust through provider validation, immutable artifact policy, execution, counted eligibility, and signed-in proof. | RUST-01..RUST-05 | Complete |
| 227 | Zig Production Support Path | Promote Zig through provider validation, no-std/import policy, immutable artifact policy, execution, counted eligibility, and signed-in proof. | ZIG-01..ZIG-05 | Complete |
| 228 | Cross-Language Golden Strategy Corpus and Parity Matrix | Build the golden Strategy corpus, pairwise matrix, conformance tests, result/replay parity, and privacy parity. | PAR-01..PAR-05 | Complete |
| 229 | Workshop, Account, and Competition Entry Unification | Move product authoring, account, and entry flows onto shared provider eligibility and labels. | PROD-01..PROD-05 | 5 |
| 230 | Result, Replay, Public Evidence, and Docs Language Pass | Unify result/replay/public evidence/docs across all four supported languages with privacy and terminology proof. | EVID-01..EVID-05 | 5 |
| 231 | Drift Monitors and Boundary Coverage | Convert non-promotion monitors into positive parity/boundary monitors and block future direct special-casing drift. | MON-01..MON-05 | 5 |
| 232 | Live Four-Language Signed-In Proof | Prove signed-in author/save/entry/execution/result/replay/public evidence flows for all four languages. | PROOF-01..PROOF-05 | 5 |
| 233 | Audit, Archive, Commit, and Tag | Review, validate, audit, archive, commit, and tag v1.32. | CLOSE-01..CLOSE-05 | 5 |

## Phase Details

### Phase 222: Language Surface Inventory

**Goal:** Inventory every current language, runtime, eligibility, product-label, docs, and monitor surface before changing behavior.

**Requirements:** INV-01, INV-02, INV-03, INV-04, INV-05

**Success criteria:**
1. Inventory artifact lists all active language/runtime/eligibility/label/ABI/validation/template/product/public/docs/monitor surfaces.
2. Every surface is classified as source of truth, active consumer, stale historical artifact, approved provider boundary, or drift risk.
3. Every direct active product/UI/API special case for `typescript`, `python`, `rust`, or `zig` is identified with owner and likely remediation.
4. Every non-promotion monitor, non-counted assertion, exhibition beta label, and JS/TS-only counted gate is recorded for conversion or preservation.
5. Inventory explicitly answers the core promotion question and names monitors needed to prevent future drift.

### Phase 223: Unified Supported Language Registry and Eligibility Model

**Goal:** Establish one shared supported-language source of truth for all four languages.

**Requirements:** LANG-01, LANG-02, LANG-03, LANG-04, LANG-05

**Success criteria:**
1. A canonical supported-language registry/model exists for JS/TS, Python, Rust, and Zig with all required product, runtime, privacy, docs, and evidence fields.
2. Existing runtime/language/broker registries are consolidated or bridged so callers have one active product semantics source.
3. Counted eligibility, entry eligibility, public labels, validation copy, and docs references are provider/registry-derived.
4. Historical non-JS support policy and validation copy no longer define active product truth.
5. Tests prove all four languages have complete records and counted eligibility semantics.

### Phase 224: StrategyLanguageProvider Runtime Contract

**Goal:** Define the provider/runtime contract, ABI posture, schema validation, and versioning path.

**Requirements:** PROV-01, PROV-02, PROV-03, PROV-04, PROV-05

**Success criteria:**
1. `StrategyLanguageProvider` or equivalent contract covers validation, build/compile, artifacts, adapter selection, execution compatibility, eligibility, labels, diagnostics, and evidence.
2. Runtime-service / Runtime Broker routes validation and execution through provider boundaries without moving hostile Strategy execution into web/API/Go.
3. ABI decision states whether Preview 1 stdin/stdout JSON remains active, remains Rust/Zig-specific, or is migrated through a versioned path.
4. Schemas validate provider inputs/outputs and distinguish Strategy failures from system failures for all four languages.
5. Any DTO/ABI/service/Match execution contract change has versioning or migration notes, tests, and audit hooks.

### Phase 225: Python Production Support Path

**Goal:** Promote Python through provider validation, runtime execution, counted eligibility, product surfaces, and signed-in proof.

**Requirements:** PY-01, PY-02, PY-03, PY-04, PY-05

**Success criteria:**
1. Python validation is provider-owned and enforces deterministic restrictions, forbidden capabilities, limits, package policy, and public-safe diagnostics.
2. Python execution remains behind runtime-service / Runtime Broker / provider boundaries.
3. Python counted eligibility is enabled only after invalid-output, timeout, oversized-output, forbidden-capability, memory-heavy, deterministic, unavailable, malformed-result, no-fallback, and privacy tests pass.
4. Workshop, Account, entry, MatchSet execution, result, replay, public evidence, docs, and monitors present Python through shared provider semantics.
5. Signed-in proof creates, saves, enters, executes, views result/replay, and scans public output for counted Python without private leaks.

### Phase 226: Rust Production Support Path

**Goal:** Promote Rust through provider validation, immutable artifact policy, execution, counted eligibility, and signed-in proof.

**Requirements:** RUST-01, RUST-02, RUST-03, RUST-04, RUST-05

**Success criteria:**
1. Rust validation is provider-owned and enforces deterministic restrictions, forbidden capabilities, limits, package/import policy, artifact policy, and public-safe diagnostics.
2. Rust build/compile emits immutable artifact metadata with toolchain, target, WASI, ABI, hash, bytes, validation, and compatibility data.
3. Rust execution remains behind runtime-service / Runtime Broker / provider boundaries with no mutable-source or JS/TS fallback.
4. Rust counted eligibility is enabled only after runtime, artifact, determinism, failure, no-fallback, and privacy tests pass.
5. Product surfaces, docs, monitors, and signed-in proof present Rust as fully supported and counted through shared provider semantics.

### Phase 227: Zig Production Support Path

**Goal:** Promote Zig through provider validation, no-std/import policy, immutable artifact policy, execution, counted eligibility, and signed-in proof.

**Requirements:** ZIG-01, ZIG-02, ZIG-03, ZIG-04, ZIG-05

**Success criteria:**
1. Zig validation is provider-owned and enforces deterministic restrictions, allowed imports, no-std/helper policy, limits, package/import policy, artifact policy, and public-safe diagnostics.
2. Zig build/compile emits immutable artifact metadata with toolchain, target, WASI, ABI, import audit, hash, bytes, validation, and compatibility data.
3. Zig execution remains behind runtime-service / Runtime Broker / provider boundaries with no mutable-source or JS/TS fallback.
4. Zig counted eligibility is enabled only after runtime, artifact/import, determinism, failure, no-fallback, and privacy tests pass.
5. Product surfaces, docs, monitors, and signed-in proof present Zig as fully supported and counted through shared provider semantics.

### Phase 228: Cross-Language Golden Strategy Corpus and Parity Matrix

**Goal:** Build the golden Strategy corpus, pairwise matrix, conformance tests, result/replay parity, and privacy parity.

**Requirements:** PAR-01, PAR-02, PAR-03, PAR-04, PAR-05

**Success criteria:**
1. Golden Strategy corpus has equivalent JS/TS, Python, Rust, and Zig implementations.
2. Pairwise Match/MatchSet matrix covers same-language and cross-language combinations.
3. Conformance suite covers invalid output, timeout, oversized output, forbidden capability, memory-heavy output, determinism, unavailable runtime, malformed runtime result, and no fallback.
4. Public result/replay shape parity is proven across all four languages.
5. Privacy parity scans prove no private Strategy/runtime data leaks from matrix fixtures or proof artifacts.

### Phase 229: Workshop, Account, and Competition Entry Unification

**Goal:** Move product authoring, account, and entry flows onto shared provider eligibility and labels.

**Requirements:** PROD-01, PROD-02, PROD-03, PROD-04, PROD-05

**Success criteria:**
1. Workshop language controls, templates, samples, validation, save/submit behavior, and runtime cues are provider-driven.
2. Account save/read/list flows show all four languages consistently without source exposure by default.
3. Competition entry and exhibition counted/unranked controls use shared counted eligibility.
4. Strategy cards, player pages, Watch/discovery reads, and competition pages use provider-derived labels and eligibility.
5. Product tests prove label and eligibility consistency across all named surfaces.

### Phase 230: Result, Replay, Public Evidence, and Docs Language Pass

**Goal:** Unify result/replay/public evidence/docs across all four supported languages with privacy and terminology proof.

**Requirements:** EVID-01, EVID-02, EVID-03, EVID-04, EVID-05

**Success criteria:**
1. MatchSet result pages present four-language provider evidence without private internals.
2. Replay pages present four-language provider evidence, replay availability, trust copy, and board realism through public-safe projections.
3. Public evidence DTOs, fixtures, proof artifacts, and rendered pages scan clean for private Strategy/runtime markers.
4. Learn/docs explain supported languages, provider boundaries, counted eligibility, ABI decision, restrictions, source/artifact policy, package policy, privacy, and no-fallback behavior.
5. Docs/UI preserve canonical terminology and avoid unsupported sandbox-certification claims.

### Phase 231: Drift Monitors and Boundary Coverage

**Goal:** Convert non-promotion monitors into positive parity/boundary monitors and block future direct special-casing drift.

**Requirements:** MON-01, MON-02, MON-03, MON-04, MON-05

**Success criteria:**
1. Direct-special-case monitor fails on active product code that branches on language ids outside approved boundaries.
2. Old non-promotion monitors are converted into positive parity, eligibility, privacy, no-fallback, ABI, and provider-boundary checks.
3. Import monitors prove web/API/Go do not execute Strategy code or import runtime internals beyond approved service clients/schemas.
4. Registry/provider monitors prove every supported language has complete templates, docs, validation/build path, provider id, limits, public labels, privacy, eligibility, and proof coverage.
5. Contract monitors prove any DTO/service/ABI/Match execution contract change is intentional, versioned or migrated, and public-safe.

### Phase 232: Live Four-Language Signed-In Proof

**Goal:** Prove signed-in author/save/entry/execution/result/replay/public evidence flows for all four languages.

**Requirements:** PROOF-01, PROOF-02, PROOF-03, PROOF-04, PROOF-05

**Success criteria:**
1. Signed-in user authors or loads valid JS/TS, Python, Rust, and Zig Strategy Revisions.
2. Signed-in user enters counted competition or MatchSet paths with all four languages.
3. Live execution completes a four-language proof matrix with result and replay evidence.
4. Desktop/mobile browser proof covers Workshop, Account, entry, result, replay, public evidence, and docs without layout or label contradictions.
5. Proof artifact records provider ids, ABI decision, eligibility, pairwise coverage, privacy scan, boundary monitor, board realism, and non-claims.

### Phase 233: Audit, Archive, Commit, and Tag

**Goal:** Review, validate, audit, archive, commit, and tag v1.32.

**Requirements:** CLOSE-01, CLOSE-02, CLOSE-03, CLOSE-04, CLOSE-05

**Success criteria:**
1. Code review covers registry/provider, runtime-service contract, production paths, conformance, product unification, evidence, docs, privacy, and monitors.
2. Validation covers requirements, tests, conformance matrix, privacy scans, monitors, browser proof, replay board realism, and no Strategy execution in web/API/Go.
3. Final decision records promotion status for all four languages and active ABI/service-contract posture.
4. Audit verifies no label-only promotion, hidden JS/TS-only counted gate, public private-data leak, or unversioned runtime contract drift.
5. Artifacts are archived, milestone audit passes, commits are complete, and tag evidence is recorded.

## Coverage

- v1 requirements: 60 total
- Complete: 35
- Planned: 25
- Mapped to phases: 60
- Unmapped: 0

## Next Up

Phase 229: Workshop, Account, and Competition Entry Unification is ready for planning and execution.

---
*Roadmap created: 2026-05-31 after v1.32 requirements approval*
