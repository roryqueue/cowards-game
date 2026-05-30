# Roadmap: Coward's Game

## Milestones

- [x] **v1.0 MVP** - Phases 1-7, shipped 2026-05-17. See `.planning/milestones/v1.0-ROADMAP.md`.
- [x] **v1.1 Trustworthy Simulation Beta** - Phases 8-13, shipped 2026-05-18. See `.planning/milestones/v1.1-ROADMAP.md`.
- [x] **v1.2 Competitive Alpha** - Phases 14-18, shipped 2026-05-19. See `.planning/milestones/v1.2-ROADMAP.md`.
- [x] **v1.3 Competition Trust Beta** - Phases 19-24, shipped 2026-05-20. See `.planning/milestones/v1.3-ROADMAP.md`.
- [x] **v1.4 Cycle-Interleaved Rules Correction** - Phases 25-29, shipped 2026-05-20. See `.planning/milestones/v1.4-ROADMAP.md`.
- [x] **v1.5 Strategy Workshop Power Tools and Advanced Strategy Library** - Phases 30-37, shipped 2026-05-21. See `.planning/milestones/v1.5-ROADMAP.md`.
- [x] **v1.6 Workshop Analytics and Evidence Explorer** - Phases 38-44, shipped 2026-05-22. See `.planning/milestones/v1.6-ROADMAP.md`.
- [x] **v1.7 Runtime and Backend Boundary Stabilization** - Phases 45-50, shipped 2026-05-22. See `.planning/milestones/v1.7-ROADMAP.md`.
- [x] **v1.8 Production Boundary Hardening** - Phases 51-56, shipped 2026-05-22. See `.planning/milestones/v1.8-ROADMAP.md`.
- [x] **v1.9 Backend and Runtime Ownership Split** - Phases 57-63, shipped 2026-05-23. See `.planning/milestones/v1.9-ROADMAP.md`.
- [x] **v1.10 Service Boundary Completion and Go Read-Model Decision** - Phases 64-69, shipped 2026-05-23. See `.planning/milestones/v1.10-ROADMAP.md`.
- [x] **v1.11 Remaining Web Read Boundary Burn-Down and Live Go Readiness Evidence** - Phases 70-75, shipped 2026-05-23. See `.planning/milestones/v1.11-ROADMAP.md`.
- [x] **v1.12 Go Backend Promotion Readiness and Cutover Plan** - Phases 76-81, shipped 2026-05-23 with `promote-none-yet`. See `.planning/milestones/v1.12-ROADMAP.md`.
- [x] **v1.13 Go Backend Ownership Cutover** - Phases 82-88, shipped 2026-05-23 with selected Go backend route promotion. See `.planning/milestones/v1.13-ROADMAP.md`.
- [x] **v1.14 Generic Strategy Artifact and Runtime Boundary Contract** - Phases 89-95, shipped 2026-05-23 with artifact-backed Go forks and runtime ABI v1.14. See `.planning/milestones/v1.14-ROADMAP.md`.
- [x] **v1.15 Go Backend Ownership Completion** - Phases 96-102, shipped 2026-05-24 with Go backend ownership completion and strict topology/monitor/page-smoke gates. See `.planning/milestones/v1.15-ROADMAP.md`.
- [x] **v1.16 Runtime Isolation and TypeScript Backend Retirement** - Phases 103-109, shipped 2026-05-24 with no normal TypeScript backend except frontend plus isolated JS/TS Strategy runtime service. See `.planning/milestones/v1.16-ROADMAP.md`.
- [x] **v1.17 Python Strategy Runtime Pilot and Broker Contract Hardening** - Phases 110-116, shipped 2026-05-24. See `.planning/milestones/v1.17-ROADMAP.md`.
- [x] **v1.18 Runtime Isolation and Multi-Language Exhibition Beta** - Phases 117-123, shipped 2026-05-25. See `.planning/milestones/v1.18-ROADMAP.md`.
- [x] **v1.19 Runtime Isolation Readiness and Exhibition Beta Trust** - Phases 124-131, shipped 2026-05-25. See `.planning/milestones/v1.19-ROADMAP.md`.
- [x] **v1.20 Runtime Sandbox Candidate and Exhibition Reliability Proof** - Phases 132-139, shipped 2026-05-25. See `.planning/milestones/v1.20-ROADMAP.md`.
- [x] **v1.21 WASM/WASI Multi-Language Runtime Candidate and Rust Exhibition Alpha** - Phases 140-147, shipped 2026-05-25. See `.planning/milestones/v1.21-ROADMAP.md`.
- [x] **v1.22 WASM/WASI Multi-Compiler Alpha and Runtime Hardening** - Phases 148-155, shipped 2026-05-25. See `.planning/milestones/v1.22-ROADMAP.md`.
- [x] **v1.23 WASM/WASI Rust/Zig Exhibition Beta and ABI Readiness** - Phases 156-163, shipped 2026-05-25. See `.planning/milestones/v1.23-ROADMAP.md`.
- [x] **v1.24 Runtime Abuse Lab and ABI Future-Proofing** - Phases 164-173, shipped 2026-05-30. See `.planning/milestones/v1.24-ROADMAP.md`.

## Active Milestone

None. Start the next milestone with `$gsd-new-milestone`; active `.planning/REQUIREMENTS.md` is intentionally absent after v1.24 completion.

## Latest Shipped Milestone

**v1.24 Runtime Abuse Lab and ABI Future-Proofing**

**Decision:** Readiness evidence only. No production sandbox certification. JS/TS remains counted; Python, Rust, and Zig remain non-counted exhibition beta. WASI Preview 1 stdin/stdout JSON remains the active WASM/WASI execution ABI; direct exports and Component Model/WIT are not promoted.

## Phase Overview

| Phase | Name | Goal | Requirements | Success Criteria |
| --- | --- | --- | --- | --- |
| 164 | Baseline, Threat Model, and Claims Contract | Define the v1.23 floor, hostile Strategy threat model, and allowed v1.24 claims before probes begin. | BASE-01..BASE-06 | 5 |
| 165 | Runtime Abuse Taxonomy and Evidence Schema | Build the cross-runtime abuse taxonomy and public-safe evidence format. | LAB-01..LAB-06 | 5 |
| 166 | JS/TS and Python Runtime Abuse Probes | Run and record abuse/no-fallback probes across JS/TS counted and Python beta lanes. | JSPY-01..JSPY-07 | 5 |
| 167 | WASM/WASI Rust/Zig Abuse Probes | Run and record abuse/no-fallback probes across Rust/Zig WASM/WASI beta lanes. | WASM-01..WASM-07 | 5 |
| 168 | Cross-Runtime Production-Sandbox Readiness Matrix | Produce a public-safe matrix of what each runtime lane proves, does not prove, and needs next. | MATRIX-01..MATRIX-05 | 5 |
| 169 | Direct-Export ABI Proof Spike | Spike direct exports as a future ABI option without changing Match execution. | DEX-01..DEX-06 | 5 |
| 170 | Component Model/WIT ABI Proof Spike | Spike Component Model/WIT as a future ABI option without changing Match execution. | WIT-01..WIT-06 | 5 |
| 171 | ABI Decision, Rollback, and Migration Criteria | Decide active ABI status and write fail-closed migration/rollback criteria. | ABIDEC-01..ABIDEC-06 | 5 |
| 172 | Signed-In Multi-Runtime Regression Proof and Public Replay/Privacy Review | Prove JS/TS counted support and Python/Rust/Zig beta regressions still work with public-safe result/replay evidence. | REG-01..REG-08 | 5 |
| 173 | Audit, Archive, Commit, and Tag | Review, fix, decide claims, archive, commit, and tag v1.24. | CLOSE-01..CLOSE-05 | 5 |

## Phase Details

### Phase 164: Baseline, Threat Model, and Claims Contract

**Goal:** Define the v1.23 floor, hostile Strategy threat model, and allowed v1.24 claims before probes begin.

**Requirements:** BASE-01, BASE-02, BASE-03, BASE-04, BASE-05, BASE-06

**Success criteria:**
1. v1.23 proof, promotion, ABI, privacy, and no-fallback evidence is summarized as the v1.24 floor.
2. Threat model covers hostile Strategy behavior across JS/TS, Python, Rust, Zig, and WASM/WASI lanes.
3. Claims contract separates readiness evidence, non-counted exhibition beta, counted support, and production sandbox certification.
4. Planning artifacts preserve JS/TS counted status and Python/Rust/Zig non-counted exhibition beta status.
5. Go/runtime-service ownership and public-output privacy boundaries are explicitly protected.

### Phase 165: Runtime Abuse Taxonomy and Evidence Schema

**Goal:** Build the cross-runtime abuse taxonomy and public-safe evidence format.

**Requirements:** LAB-01, LAB-02, LAB-03, LAB-04, LAB-05, LAB-06

**Success criteria:**
1. Taxonomy covers capability, resource, ABI, artifact, unavailable-lane, malformed-output, failure-class, and privacy probes.
2. Evidence schema records expected/observed outcomes and promotion impact.
3. Strategy failures and system failures are distinct in evidence.
4. Unsupported or unavailable lanes fail loud instead of counting as sandbox passes.
5. Evidence commands are local, repeatable, and public-safe by default.

### Phase 166: JS/TS and Python Runtime Abuse Probes

**Goal:** Run and record abuse/no-fallback probes across JS/TS counted and Python beta lanes.

**Requirements:** JSPY-01, JSPY-02, JSPY-03, JSPY-04, JSPY-05, JSPY-06, JSPY-07

**Success criteria:**
1. JS/TS abuse probes cover timeout, oversized output, malformed result, invalid schema/action, thrown error, unavailable runtime, and forbidden capabilities where applicable.
2. Python abuse probes cover timeout, oversized output, malformed result, invalid schema/action, crash, unavailable runtime, and forbidden capabilities where applicable.
3. JS/TS failures do not execute Strategy code in web/API/Go.
4. Python failures do not fall back to JS/TS, Go source execution, or stale artifacts.
5. Evidence preserves JS/TS counted semantics and Python non-counted exhibition beta semantics.

### Phase 167: WASM/WASI Rust/Zig Abuse Probes

**Goal:** Run and record abuse/no-fallback probes across Rust/Zig WASM/WASI beta lanes.

**Requirements:** WASM-01, WASM-02, WASM-03, WASM-04, WASM-05, WASM-06, WASM-07

**Success criteria:**
1. Rust probes cover timeout/fuel, memory, stdio/result cap, malformed JSON, invalid schema/action, panic/trap/abort, unavailable runtime, stale/missing/mismatched artifacts, and forbidden imports.
2. Zig probes cover timeout/fuel, memory, stdio/result cap, malformed JSON, invalid schema/action, panic/trap/abort, unavailable runtime, stale/missing/mismatched artifacts, and forbidden imports.
3. Runtime mismatch, ABI mismatch, and target mismatch fail closed.
4. Rust/Zig failures do not fall back to JS/TS, Python, mutable source execution, stale artifacts, or alternate ABI execution.
5. Evidence remains non-counted exhibition beta readiness evidence only.

### Phase 168: Cross-Runtime Production-Sandbox Readiness Matrix

**Goal:** Produce a public-safe matrix of what each runtime lane proves, does not prove, and needs next.

**Requirements:** MATRIX-01, MATRIX-02, MATRIX-03, MATRIX-04, MATRIX-05

**Success criteria:**
1. Matrix covers JS/TS, Python, Rust, Zig, WASM/WASI, direct exports, and Component Model/WIT.
2. Each lane states proven evidence, non-evidence, production certification gaps, and next required proof.
3. Matrix distinguishes local, CI, signed-in, operational, deployment, and external-review evidence.
4. Matrix records no-fallback status for unavailable, stale, mismatched, malformed, and capability-invalid paths.
5. Public summaries omit private diagnostics, source, memory, objectives, host paths, env values, tokens, DB details, package paths, and private runtime internals.

### Phase 169: Direct-Export ABI Proof Spike

**Goal:** Spike direct exports as a future ABI option without changing Match execution.

**Requirements:** DEX-01, DEX-02, DEX-03, DEX-04, DEX-05, DEX-06

**Success criteria:**
1. Direct-export proof or fail-loud non-promotion artifact exists.
2. Proof records memory ownership, allocation/free, buffer passing, encoding, caps, schema validation, and failure behavior.
3. Rust and Zig parity is attempted where feasible and non-parity is recorded honestly.
4. Direct-export artifacts are ineligible for Match execution without future promotion.
5. Compatibility and rollback impact against Preview 1 JSON artifacts is documented.

### Phase 170: Component Model/WIT ABI Proof Spike

**Goal:** Spike Component Model/WIT as a future ABI option without changing Match execution.

**Requirements:** WIT-01, WIT-02, WIT-03, WIT-04, WIT-05, WIT-06

**Success criteria:**
1. Component Model/WIT proof or fail-loud non-promotion artifact exists.
2. Minimal Strategy WIT world/interface shape and tooling status are recorded.
3. Wasmtime host integration, import surface, caps, validation, trap handling, and privacy behavior are recorded.
4. Rust and Zig parity is attempted where feasible and non-parity is recorded honestly.
5. Component Model/WIT artifacts are ineligible for Match execution without future promotion.

### Phase 171: ABI Decision, Rollback, and Migration Criteria

**Goal:** Decide active ABI status and write fail-closed migration/rollback criteria.

**Requirements:** ABIDEC-01, ABIDEC-02, ABIDEC-03, ABIDEC-04, ABIDEC-05, ABIDEC-06

**Success criteria:**
1. ABI decision explicitly keeps or changes the active WASM/WASI execution ABI.
2. Decision explains why direct exports and Component Model/WIT are or are not promoted.
3. Unknown, stale, mismatched, or unpromoted ABI metadata fails closed.
4. Migration criteria cover compatibility, schema, caps, privacy, replay, no-fallback, rollback, and coexistence.
5. Decision preserves Go/runtime-service ownership and prevents Strategy execution in web/API/Go.

### Phase 172: Signed-In Multi-Runtime Regression Proof and Public Replay/Privacy Review

**Goal:** Prove JS/TS counted support and Python/Rust/Zig beta regressions still work with public-safe result/replay evidence.

**Requirements:** REG-01, REG-02, REG-03, REG-04, REG-05, REG-06, REG-07, REG-08

**Success criteria:**
1. Signed-in proof records JS/TS counted Strategy support.
2. Signed-in proof records Python, Rust, and Zig non-counted exhibition beta support.
3. Result pages show public-safe runtime/evidence labels.
4. Replay pages show plausible full Match starts with in-bounds visible Soldiers and terrain.
5. Privacy and no-fallback scans pass for public result/replay output.

### Phase 173: Audit, Archive, Commit, and Tag

**Goal:** Review, fix, decide claims, archive, commit, and tag v1.24.

**Requirements:** CLOSE-01, CLOSE-02, CLOSE-03, CLOSE-04, CLOSE-05

**Success criteria:**
1. Code review verifies abuse-lab, ABI-spike, no-fallback, privacy, and boundary changes.
2. Validation verifies all requirements, readiness evidence, ABI decision, signed-in proof, replay plausibility, and privacy gates.
3. Final decision states whether production sandbox certification remains unclaimed or is explicitly supported by evidence.
4. Final decision preserves JS/TS counted support and non-JS non-counted status unless evidence explicitly changes it.
5. Planning artifacts are archived, active requirements are removed at milestone close, and commit/tag evidence is recorded.

## Coverage

- v1 requirements: 62 total
- Mapped to phases: 62
- Unmapped: 0

## Next Up

Start the next milestone with `$gsd-new-milestone`.

---
*Last updated: 2026-05-30 after v1.24 completion*
