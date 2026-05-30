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
- [ ] **v1.25 Match Execution Interface Freeze and Parallel App/Execution Contract** - Phases 174-182, active.

## Active Milestone

**v1.25 Match Execution Interface Freeze and Parallel App/Execution Contract**

**Goal:** Establish a firm, versioned, tested boundary between Match execution and the app around it, so execution internals and app/result/replay UX can iterate in parallel with confidence.

**Decision baseline:** JS/TS remains counted. Python, Rust, and Zig remain non-counted exhibition beta. Preview 1 stdin/stdout JSON remains the active WASM/WASI execution ABI. No production sandbox certification, direct-export migration, Component Model/WIT migration, or counted non-JS promotion is in scope.

## Latest Shipped Milestone

**v1.24 Runtime Abuse Lab and ABI Future-Proofing**

**Decision:** Readiness evidence only. No production sandbox certification. JS/TS remains counted; Python, Rust, and Zig remain non-counted exhibition beta. WASI Preview 1 stdin/stdout JSON remains the active WASM/WASI execution ABI; direct exports and Component Model/WIT are not promoted.

## Phase Overview

| Phase | Name | Goal | Requirements | Success Criteria |
| --- | --- | --- | --- | --- |
| 174 | Match/App Boundary Baseline and Contract Inventory | Inventory current Match execution app-facing surfaces and classify stable versus internal dependencies. | BASE-01..BASE-05 | 5 |
| 175 | Canonical Match Lifecycle State Machine | Define and test canonical Match and MatchSet lifecycle semantics. | LIFE-01..LIFE-06 | 5 |
| 176 | App-Facing DTO v1 Contract | Publish versioned DTO schemas for result, replay, runtime evidence, failure evidence, and public/private splits. | DTO-01..DTO-07 | 5 |
| 177 | Fixture Catalog and Golden Match States | Commit schema-valid fixture scenarios and replay goldens for app and contract testing. | FIX-01..FIX-07 | 5 |
| 178 | Contract Test Harness and Drift Monitors | Prove Go/service/app outputs match schemas and add monitors for contract, privacy, and fixture drift. | TEST-01..TEST-07 | 5 |
| 179 | Replay and Result Page Interface Hardening | Make result and replay pages consume frozen contracts and public-safe lifecycle copy. | UI-01..UI-06 | 5 |
| 180 | Execution/App Parallelization Adapter | Add a fixture-backed app/test adapter for result and replay work without live execution services. | ADAPT-01..ADAPT-05 | 5 |
| 181 | End-to-End Proof and Boundary Freeze Decision | Run fixture-mode and signed-in live proof, then publish the freeze decision and unstable-internals list. | PROOF-01..PROOF-05 | 5 |
| 182 | Audit, Archive, Commit, and Tag | Review, validate, archive, commit, and tag v1.25. | CLOSE-01..CLOSE-04 | 5 |

## Phase Details

### Phase 174: Match/App Boundary Baseline and Contract Inventory

**Goal:** Inventory current Match execution app-facing surfaces and classify stable versus internal dependencies.

**Requirements:** BASE-01, BASE-02, BASE-03, BASE-04, BASE-05

**Success criteria:**
1. v1.24 outcome and v1.25 non-goals are summarized before implementation.
2. Inventory covers MatchSet creation, Go lifecycle, runtime-service envelopes, public MatchSet result DTOs, replay metadata/evidence DTOs, app pages, adapters, fixtures, and monitors.
3. Each surface is classified as app-facing contract, owner/test-only contract, execution-internal, persistence-internal, or intentionally unstable.
4. Inventory identifies app dependencies on execution internals that must be removed or wrapped.
5. Baseline preserves JS/TS counted, non-JS non-counted beta, Preview 1 JSON, Go ownership, runtime-service hostile execution ownership, and public-output privacy.

### Phase 175: Canonical Match Lifecycle State Machine

**Goal:** Define and test canonical Match and MatchSet lifecycle semantics.

**Requirements:** LIFE-01, LIFE-02, LIFE-03, LIFE-04, LIFE-05, LIFE-06

**Success criteria:**
1. Match lifecycle state machine covers queued, accepted, running, complete, failed, degraded, unavailable, retryable, and non-retryable semantics.
2. MatchSet lifecycle composition explains how Match states become public result states.
3. Strategy failure, system failure, timeout, unavailable runtime, malformed runtime result, stale artifact, blocked, missing Chronicle, and no-result states are distinct.
4. Terminal, retryable, degraded terminal, and pending/running states are explicitly defined.
5. Backend/contract tests prove Go lifecycle outputs use the canonical vocabulary.

### Phase 176: App-Facing DTO v1 Contract

**Goal:** Publish versioned DTO schemas for result, replay, runtime evidence, failure evidence, and public/private splits.

**Requirements:** DTO-01, DTO-02, DTO-03, DTO-04, DTO-05, DTO-06, DTO-07

**Success criteria:**
1. MatchSet summary/result DTO schemas are versioned and distinct from execution-internal responses.
2. Replay metadata/evidence DTO schemas are versioned and public-safe.
3. Runtime evidence and failure evidence schemas expose categories, not raw diagnostics.
4. Public/private evidence split is explicit, including owner/test-only fields.
5. Schema artifacts and examples are validated against fixtures and Go outputs.

### Phase 177: Fixture Catalog and Golden Match States

**Goal:** Commit schema-valid fixture scenarios and replay goldens for app and contract testing.

**Requirements:** FIX-01, FIX-02, FIX-03, FIX-04, FIX-05, FIX-06, FIX-07

**Success criteria:**
1. Fixture catalog includes complete, running, queued, strategy failure, system failure, timeout, unavailable runtime, malformed runtime result, stale artifact, and public-safe replay scenarios.
2. Fixtures parse with app-facing DTO schemas.
3. Replay fixture has plausible sequence-0 board state with in-bounds visible Soldiers and terrain.
4. Fixtures are usable without live Match execution services.
5. Fixture metadata records public, owner/test-only, execution-internal, and intentionally unstable status.

### Phase 178: Contract Test Harness and Drift Monitors

**Goal:** Prove Go/service/app outputs match schemas and add monitors for contract, privacy, and fixture drift.

**Requirements:** TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07

**Success criteria:**
1. Go public MatchSet summary/result outputs validate against DTO schemas.
2. Go public replay metadata/evidence outputs validate against DTO schemas.
3. Runtime-service failures translate to app-facing failure evidence without private diagnostics.
4. Result/replay app fixture tests cover every scenario.
5. Drift monitors check lifecycle vocabulary, DTO versions, fixture coverage, privacy, and ownership boundaries.

### Phase 179: Replay and Result Page Interface Hardening

**Goal:** Make result and replay pages consume frozen contracts and public-safe lifecycle copy.

**Requirements:** UI-01, UI-02, UI-03, UI-04, UI-05, UI-06

**Success criteria:**
1. Result page consumes app-facing MatchSet/result DTOs through the contract or fixture adapter.
2. Replay page consumes replay metadata/evidence DTOs through the contract or fixture adapter.
3. Page copy covers queued, running, complete, degraded, failed, unavailable, retryable, and non-retryable states.
4. Public pages do not expose Strategy source, memories, objectives, raw diagnostics, paths, env values, tokens, DB details, package paths, or private runtime internals.
5. Browser proof validates representative fixture-backed result/replay pages.

### Phase 180: Execution/App Parallelization Adapter

**Goal:** Add a fixture-backed app/test adapter for result and replay work without live execution services.

**Requirements:** ADAPT-01, ADAPT-02, ADAPT-03, ADAPT-04, ADAPT-05

**Success criteria:**
1. App/test code can select fixture-backed MatchSet result and replay data.
2. Adapter is gated to test/local development modes and cannot silently fallback in production.
3. Adapter returns the same versioned DTO shapes as Go/service-backed reads.
4. Adapter covers all required fixture scenarios.
5. Documentation explains parallel app/execution workflows and remaining live proof requirements.

### Phase 181: End-to-End Proof and Boundary Freeze Decision

**Goal:** Run fixture-mode and signed-in live proof, then publish the freeze decision and unstable-internals list.

**Requirements:** PROOF-01, PROOF-02, PROOF-03, PROOF-04, PROOF-05

**Success criteria:**
1. Fixture-mode proof renders the full scenario catalog and records public-safe evidence.
2. Signed-in live proof covers JS/TS counted support and non-JS non-counted exhibition evidence.
3. Live result/replay pages validate lifecycle copy, DTO parsing, replay plausibility, and privacy.
4. Freeze decision states whether app-facing Match execution interfaces are stable enough for parallel work.
5. Decision lists intentionally unstable internals and explicitly rejects runtime promotion, sandbox certification, and ABI migration claims.

### Phase 182: Audit, Archive, Commit, and Tag

**Goal:** Review, validate, archive, commit, and tag v1.25.

**Requirements:** CLOSE-01, CLOSE-02, CLOSE-03, CLOSE-04

**Success criteria:**
1. Code review verifies lifecycle, DTO, fixture, adapter, privacy, ownership, and monitor changes.
2. Validation verifies all requirements, tests, fixture rendering, live proof, replay realism, privacy scans, and freeze decision.
3. Final decision preserves JS/TS counted support, non-JS non-counted beta, Preview 1 JSON ABI, no sandbox certification, and no Strategy execution in web/API/Go.
4. Planning artifacts are archived, active requirements are removed at milestone close, and commit/tag evidence is recorded.

## Coverage

- v1 requirements: 52 total
- Mapped to phases: 52
- Unmapped: 0

## Next Up

**Phase 174: Match/App Boundary Baseline and Contract Inventory** - Inventory current Match execution app-facing surfaces and classify stable versus internal dependencies.

`$gsd-discuss-phase 174`

Also: `$gsd-plan-phase 174` - skip discussion, plan directly.

---
*Roadmap created: 2026-05-30 after v1.25 milestone initialization*
