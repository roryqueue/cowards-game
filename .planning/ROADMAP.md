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
- [x] **v1.13 Go Backend Ownership Cutover** - Phases 82-88, completed 2026-05-23 with selected Go backend route promotion. See `.planning/milestones/v1.13-ROADMAP.md`.
- [ ] **v1.14 Generic Strategy Artifact and Runtime Boundary Contract** - Phases 89-95, active.

## Current Milestone: v1.14 Generic Strategy Artifact and Runtime Boundary Contract

**Status:** Ready for Phase 89
**Phases:** 89-95
**Granularity:** Standard
**Requirements:** 48 mapped
**Research:** `.planning/research/SUMMARY.md`

## Overview

v1.14 turns Strategy source, validation, lineage, runtime metadata, and public/private runtime boundaries into explicit contracts. v1.13 promoted selected Go backend routes but deferred Starter/Advanced fork ownership because Go lacks parity-safe library source access. v1.14 resolves that by creating generic Strategy Artifact contracts and generated manifests, then using those manifests for Go fork parity without executing hostile Strategy code in Go or web/API.

The milestone also freezes a stricter `strategy-runtime-abi-v1.14` so deterministic server/native orchestration and hostile runtime code communicate through one public boundary. Existing JS runtime adapters may remain TypeScript worker-owned, but they must conform to the ABI or an explicit conformance bridge. Privacy and replay realism remain hard gates throughout.

## Phases

- [ ] **Phase 89: Boundary Baseline and Scope Lock** - Developers can inspect the exact v1.14 starting boundary and non-goals before implementation.
- [ ] **Phase 90: Generic Strategy Artifact Contract** - Developers can validate source-bearing Strategy artifacts and compatible revisions through spec-owned schemas.
- [ ] **Phase 91: Generated Strategy Artifact Manifest** - Developers can generate parity-safe Strategy artifact manifests from TypeScript-owned libraries/templates.
- [ ] **Phase 92: Runtime ABI v1.14 Contract** - Developers can validate strict method-specific runtime ABI envelopes and failure taxonomy.
- [ ] **Phase 93: JS Runtime Adapter Conformance** - Developers can prove existing JS adapters conform to v1.14 ABI boundaries without moving execution into web/API/Go.
- [ ] **Phase 94: Go Artifact Consumption and Fork Parity** - Users can fork Starter/Advanced Strategies through Go-owned routes from generated artifacts with TypeScript-oracle parity.
- [ ] **Phase 95: Privacy, Realism, Topology, and Promotion Gate** - Developers can prove privacy, board realism, topology, no-fallback, and final promotion/defer decisions across v1.14 surfaces.

## Phase Details

### Phase 89: Boundary Baseline and Scope Lock

**Goal:** Developers can inspect the v1.14 baseline for Go ownership, blocked forks, artifact/template sources, runtime ABI drift, privacy gates, replay realism gates, topology evidence, and explicit non-goals.
**Depends on:** Phase 88
**Requirements:** BASE-01, BASE-02, BASE-03, BASE-04, BASE-05, BASE-06

**Success Criteria:**
1. Developer can inspect a v1.14 ownership/boundary manifest that separates live Go routes, fixture routes, TypeScript oracle/reference surfaces, worker-owned runtime surfaces, and deferred surfaces.
2. Developer can inspect concrete code references for Starter/Advanced fork deferral, Go lineage loss, Go reduced revision validation, runtime ABI drift, adapter ID drift, limit drift, privacy deny-list drift, and replay realism coverage.
3. Developer can verify explicit non-goals prevent Go/web/API Strategy execution, Node `vm` security boundary use, counted non-JS play, sandbox promotion, Go migrations, full replay projection, owner-debug replay migration, Workshop runtime ownership, and job claiming/completion migration.
4. Developer can verify baseline evidence records `strict_offenses=0`, `report_only_offenses=29`, v1.13 selected route ownership, and current topology/monitor gaps.

**Plans:** 0 plans

### Phase 90: Generic Strategy Artifact Contract

**Goal:** Developers can represent Strategy source artifacts and compatible revisions through generic spec-owned contracts that preserve existing behavior while enabling future language and template variants.
**Depends on:** Phase 89
**Requirements:** ART-01, ART-02, ART-03, ART-04, ART-05, ART-06, ART-07

**Success Criteria:**
1. Developer can use Strategy Artifact schemas for account revisions, server-native templates, Starter entries, Advanced entries, and future language variants.
2. Developer can validate artifact metadata for kind, source visibility, fork eligibility, source hash/bytes, runtime/language/package metadata, validation report/status, engine compatibility, lineage, and immutable Match eligibility.
3. Developer can verify existing StrategyRevision consumers remain backward-compatible while generic lineage and artifact metadata become available.
4. Developer can run valid/invalid artifact fixture tests covering public-safe summaries, built-in forkable source, owner-private source, and unsupported runtime/language examples.

**Plans:** 0 plans

### Phase 91: Generated Strategy Artifact Manifest

**Goal:** Developers can generate parity-safe manifests from TypeScript-owned Starter, Advanced, and Workshop template sources for TypeScript and Go consumers.
**Depends on:** Phase 90
**Requirements:** MAN-01, MAN-02, MAN-03, MAN-04, MAN-05, MAN-06

**Success Criteria:**
1. Developer can run a generation command that emits artifact manifests from canonical TypeScript registries/templates.
2. Developer can verify manifest entries include source, source hash/bytes, validation report/status, runtime metadata, engine compatibility, names, notes, tags, versions, archetypes, lineage metadata, and fork eligibility.
3. Developer can run stale-output and checksum gates that fail when source registries and generated manifests diverge.
4. Developer can verify Go consumes manifests as data without importing TypeScript modules or executing Strategy source.
5. Developer can verify manifest privacy classification distinguishes built-in forkable source from owner-private source.

**Plans:** 0 plans

### Phase 92: Runtime ABI v1.14 Contract

**Goal:** Developers can validate `strategy-runtime-abi-v1.14` as the strict public interface between deterministic server/native orchestration and hostile Strategy runtime code.
**Depends on:** Phase 90
**Requirements:** ABI-01, ABI-02, ABI-03, ABI-04, ABI-05, ABI-06, ABI-07, ABI-08

**Success Criteria:**
1. Developer can validate method-specific request and response envelopes for `selectActivations` and `soldierBrain`.
2. Developer can verify source hash/bytes, byte caps, runtime metadata, adapter id/version, language id/version, package mode, capabilities, limits, and compatibility are enforced at the ABI boundary.
3. Developer can verify runtime output schema, output byte caps, StrategyMemory, SoldierMemory, objective payload, and JSON-only limits are enforced consistently.
4. Developer can verify runtime violations, system failures, public messages, and private diagnostics use one spec-owned taxonomy.
5. Developer can run ABI fixtures for JS/TS counted runtime, experimental Python metadata, invalid language/adapter/package combinations, timeout, oversized output, malformed IPC, and redacted diagnostics.

**Plans:** 0 plans

### Phase 93: JS Runtime Adapter Conformance

**Goal:** Developers can prove existing JS runtime adapters conform to the v1.14 ABI boundary or a single explicit bridge while Strategy execution remains worker-owned and evidence-only where appropriate.
**Depends on:** Phase 92
**Requirements:** RUNC-01, RUNC-02, RUNC-03, RUNC-04, RUNC-05, RUNC-06

**Success Criteria:**
1. Developer can verify worker-thread, subprocess, and container-subprocess adapters execute through v1.14 envelopes or an explicit conformance bridge.
2. Developer can verify effective timeout, stdout/stderr/source/memory/objective limits align across spec, runtime-js, worker config, sandbox probes, and monitors.
3. Developer can verify runtime violations complete Match/Chronicle behavior consistently while system failures remain retryable or system-classified.
4. Developer can run hostile/determinism probes for time, randomness, filesystem, network, environment, shell, dynamic code, stdout/stderr caps, memory/source/objective limits, and malformed output.
5. Developer can verify executable runtime APIs remain absent from web/API and Go backend packages.

**Plans:** 0 plans

### Phase 94: Go Artifact Consumption and Fork Parity

**Goal:** Users can fork Starter and Advanced Strategies through Go-owned routes from generated artifacts, with lineage-preserving account saves and TypeScript-oracle parity, without Go executing Strategy code.
**Depends on:** Phases 91 and 93
**Requirements:** GOART-01, GOART-02, GOART-03, GOART-04, GOART-05, GOART-06, GOART-07

**Success Criteria:**
1. Developer can load generated Strategy artifact manifests in Go without TypeScript imports or Strategy execution.
2. User can fork Starter Strategies through Go with parity for source, hash, bytes, validation, tags, label, notes, lineage, revision IDs, runtime metadata, and account list DTOs.
3. User can fork Advanced Strategies through Go with parity for source, hash, bytes, validation, tags, label, notes, archetype, lineage, revision IDs, runtime metadata, and account list DTOs.
4. User can save Go account revisions with Starter/Advanced/template lineage preserved when source hash and selected artifact metadata match a manifest entry.
5. Developer can verify manifest, schema, privacy, auth, stale-output, invalid-artifact, storage, topology, and no-fallback failures fail closed without silent TypeScript fallback.
6. Developer can verify Go artifact/fork routes do not execute Strategy code, use Node `vm`, claim jobs, run Matches, build Chronicles, or classify runtime failures.

**Plans:** 0 plans

### Phase 95: Privacy, Realism, Topology, and Promotion Gate

**Goal:** Developers can prove v1.14 artifact, ABI, Go fork, public-output, replay realism, topology, no-fallback, and monitor evidence before recording promotion/defer decisions.
**Depends on:** Phases 94 and 93
**Requirements:** GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06, GATE-07, GATE-08

**Success Criteria:**
1. Developer can use one spec-owned forbidden-field contract across service, Go, replay, analytics, topology, OpenAPI, monitors, and browser-visible public replay checks.
2. Developer can verify public/service/Go/topology/monitor outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.
3. Developer can verify owner-private source retrieval remains the only source-returning exception and remains authenticated/private/no-store.
4. Developer can run repeatable live web-through-Go topology evidence that creates a Go-owned exhibition, runs the TypeScript worker, fetches replay metadata, and records privacy-safe output.
5. Developer can verify board realism for replay/match creation changes, including valid bounds, canonical starting positions, in-bounds terrain and visible Soldiers, and browser nonblank/non-clipped replay canvas.
6. Developer can verify boundary monitors fail on ABI drift, artifact manifest drift, adapter drift, privacy drift, unexpected Strategy execution, unsafe fallback, or runtime ownership creep.
7. Developer can inspect a final v1.14 promotion decision for artifact manifests, ABI conformance, Go fork routes, privacy gates, replay realism evidence, and remaining deferred surfaces.

**Plans:** 0 plans

## Progress

**Execution Order:** Phase 89 -> Phase 90 -> Phase 91 -> Phase 92 -> Phase 93 -> Phase 94 -> Phase 95

| Phase | Plans Complete | Status | Completed |
| --- | --- | --- | --- |
| 89. Boundary Baseline and Scope Lock | 0/0 | Not started | — |
| 90. Generic Strategy Artifact Contract | 0/0 | Not started | — |
| 91. Generated Strategy Artifact Manifest | 0/0 | Not started | — |
| 92. Runtime ABI v1.14 Contract | 0/0 | Not started | — |
| 93. JS Runtime Adapter Conformance | 0/0 | Not started | — |
| 94. Go Artifact Consumption and Fork Parity | 0/0 | Not started | — |
| 95. Privacy, Realism, Topology, and Promotion Gate | 0/0 | Not started | — |

## Requirement Coverage

| Requirement Group | Phase | Count |
| --- | --- | ---: |
| BASE-01 through BASE-06 | Phase 89 | 6 |
| ART-01 through ART-07 | Phase 90 | 7 |
| MAN-01 through MAN-06 | Phase 91 | 6 |
| ABI-01 through ABI-08 | Phase 92 | 8 |
| RUNC-01 through RUNC-06 | Phase 93 | 6 |
| GOART-01 through GOART-07 | Phase 94 | 7 |
| GATE-01 through GATE-08 | Phase 95 | 8 |

**Coverage:** 48/48 v1.14 requirements mapped.
**Unmapped requirements:** 0.
**Starting phase:** 89.

## Next Up

**Phase 89: Boundary Baseline and Scope Lock** - Rebaseline v1.13 ownership, artifact/template source, runtime ABI drift, privacy, topology, and replay realism before implementation.

`$gsd-discuss-phase 89`

Also available: `$gsd-plan-phase 89`

---
*Last updated: 2026-05-23 after v1.14 milestone initialization*
