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
- [ ] **v1.16 Runtime Isolation and TypeScript Backend Retirement** - Phases 103-109, active planning.

## Current Milestone: v1.16 Runtime Isolation and TypeScript Backend Retirement

**Status:** Planning
**Phases:** 103-109
**Granularity:** Standard
**Requirements:** 48 pending
**Research:** `.planning/research/v1.16-SUMMARY.md`

## Overview

v1.16 finishes the TypeScript backend retirement by making TypeScript's normal role explicit and narrow: frontend plus an isolated JS/TS Strategy runtime service only. Go owns normal backend orchestration, persistence-facing API behavior, Match lifecycle, Chronicle persistence handoff, MatchSet scoring completion, and public evidence delivery.

The target flow is:

`web frontend -> Go backend -> isolated JS/TS Strategy runtime service`

TypeScript service/backend paths may remain only as parity oracle, test fixture source, rollback reference, frontend support code, runtime-only execution infrastructure, or explicitly deferred product surfaces. There must be no silent fallback to retired TypeScript backend behavior.

## Phases

- [x] **Phase 103: TypeScript Backend Inventory and Retirement Contract** - Developers can inspect a complete v1.16 ownership inventory, allowed TypeScript roles, non-goals, and retirement contract before deletion or quarantine work begins.
- [ ] **Phase 104: Isolated Runtime Service Boundary Hardening** - Developers can verify JS/TS Strategy execution remains supported only through a broker-ready Strategy Execution Service / Runtime Broker contract and runtime ABI, with no DB/job/API ownership.
- [ ] **Phase 105: Web/API Go-Only Cutover and Fallback Removal** - Users can use selected normal web/account/exhibition/public evidence flows through Go-owned contracts without TypeScript backend fallback.
- [ ] **Phase 106: TypeScript Worker and Persistence Quarantine** - Developers can verify TypeScript worker and persistence lifecycle modules are rollback/parity/test only and unreachable as normal backend paths.
- [ ] **Phase 107: Deferred Surface Relabeling and Privacy Preservation** - Developers can inspect remaining Workshop, ladder, governance, owner-debug, test-support, and parity surfaces as explicitly deferred or non-normal, with privacy guards intact.
- [ ] **Phase 108: No-TypeScript-Backend Topology and Monitor Gate** - Developers can prove the normal product topology works with TypeScript service/backend disabled or absent except for frontend and runtime service.
- [ ] **Phase 109: Milestone Verification, Deletion Audit, and Promotion Decision** - Developers can run final verification, inspect deletion/quarantine evidence, and record whether v1.16 achieved no TypeScript backend.

## Phase Details

### Phase 103: TypeScript Backend Inventory and Retirement Contract

**Goal:** Developers can inspect the v1.16 baseline for all remaining TypeScript backend-like surfaces and the exact roles allowed after retirement.
**Depends on:** Phase 102
**Requirements:** BASE-01, BASE-02, BASE-03, BASE-04, BASE-05, BASE-06

**Success Criteria:**
1. Developer can inspect a machine-readable and human-readable inventory covering Next.js API routes, TypeScript server modules, direct persistence imports, `@cowards/service`, workers, runtime service, replay/public evidence, tests, fixtures, rollback, and deferred surfaces.
2. Developer can verify allowed TypeScript roles exclude any normal backend owner role.
3. Developer can verify v1.15 Go ownership behavior is the new backend baseline and TypeScript service/backend behavior is only parity/test/rollback/deferred/frontend/runtime support.
4. Developer can verify non-goals and privacy/determinism/runtime constraints are explicit before implementation.

**Plans:** 1 plan

### Phase 104: Isolated Runtime Service Boundary Hardening

**Goal:** Developers can verify the runtime service is a narrow hostile-code execution service invoked by Go through a broker-ready Strategy Execution Service / Runtime Broker public runtime ABI contract and not a backend.
**Depends on:** Phase 103
**Requirements:** RT-01, RT-02, RT-03, RT-04, RT-05, RT-06, RT-07

**Success Criteria:**
1. Developer can inspect runtime service transport, ABI, JSON/schema-validated envelopes, limits, timeout, package, diagnostics, crash, log, privacy, and no-fallback contracts as language-neutral broker-ready boundaries.
2. Developer can verify `apps/runtime-service` and runtime-js execute JS/TS Strategies only through the ABI boundary and perform no DB/job/public API ownership.
3. Developer can verify Go and web/API do not execute Strategy source or use Node `vm`.
4. Developer can run runtime boundary tests for malformed input, ABI drift, timeout, invalid output, oversized payload, source mismatch, and redacted diagnostics.
5. Developer can verify non-JS and production sandbox candidates remain unpromoted unless explicitly planned later.
6. Developer can verify a future Runtime Broker could front or replace the current TypeScript runtime service without changing Go orchestration, persistence, scoring, or public evidence ownership.
7. Developer can verify Strategy Revision submission performs compile, validation, or artifact packaging checks where practical before immutable Match execution, and that WASM/WASI/component-model notes are long-term evaluation guidance rather than v1.16 promotion.

**Plans:** 1 plan

### Phase 105: Web/API Go-Only Cutover and Fallback Removal

**Goal:** Users can use selected normal account/session, fork, exhibition, public read, and public replay evidence workflows through Go-owned contracts with no TypeScript backend fallback.
**Depends on:** Phases 103 and 104
**Requirements:** WEB-01, WEB-02, WEB-03, WEB-04, WEB-05, WEB-06, WEB-07, WEB-08

**Success Criteria:**
1. User can complete selected account/session and account Strategy Revision flows through web routes backed by Go contracts.
2. User can create selected exhibition MatchSets through Go-backed web routes.
3. User can view selected public pages and replay evidence through Go-backed read contracts.
4. Developer can verify selected Next.js API routes are frontend adapters or explicitly non-normal.
5. Developer can verify TypeScript service, local persistence, and Chronicle fallback paths fail closed or are quarantined when Go is selected.
6. Developer can run schema, auth, source privacy, public DTO privacy, and no-fallback tests for selected routes.

**Plans:** 1 plan

### Phase 106: TypeScript Worker and Persistence Quarantine

**Goal:** Developers can verify TypeScript DB-owning worker and persistence lifecycle code cannot act as the normal backend after v1.15.
**Depends on:** Phase 105
**Requirements:** QUAR-01, QUAR-02, QUAR-03, QUAR-04, QUAR-05, QUAR-06, QUAR-07

**Success Criteria:**
1. Developer can verify `apps/worker` is explicit rollback/parity/test infrastructure only.
2. Developer can verify TypeScript job claim, completion, Chronicle persistence, scoring refresh, and MatchSet creation modules are deleted, quarantined, or removed from normal exports.
3. Developer can verify public TypeScript DTO reads do not lazily refresh Go-owned scoring/status for selected normal paths.
4. Developer can verify `@cowards/service` is not treated as the normal backend for selected routes.
5. Developer can run worker guard, export boundary, no mixed owner, rollback, and parity tests.

**Plans:** 1 plan

### Phase 107: Deferred Surface Relabeling and Privacy Preservation

**Goal:** Developers can inspect remaining TypeScript Workshop, ladder, governance, owner-debug, test-support, fixture, parity, and rollback paths as explicitly allowed non-normal surfaces with privacy guarantees.
**Depends on:** Phase 106
**Requirements:** DEF-01, DEF-02, DEF-03, DEF-04, DEF-05, DEF-06

**Success Criteria:**
1. Developer can inspect each remaining deferred Workshop, admin/governance, ladder, owner-debug, test-support, fixture, parity, and rollback surface with owner, role, risk, and future migration notes.
2. Developer can verify owner-debug replay remains private and authorized, not a public evidence fallback.
3. Developer can verify test-support and parity routes are gated from normal product runtime.
4. Developer can verify public outputs from deferred paths remain source-safe, memory-safe, objective-free, owner-debug-free, and diagnostics-safe by default.
5. Developer can inspect the final TypeScript surface label artifact covering every remaining backend-like TypeScript path.

**Plans:** 1 plan

### Phase 108: No-TypeScript-Backend Topology and Monitor Gate

**Goal:** Developers can prove v1.16 topology and monitors fail on TypeScript backend ownership creep, unsafe fallback, privacy leaks, runtime ABI drift, route drift, and representative page-load failure.
**Depends on:** Phase 107
**Requirements:** GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06, GATE-07, GATE-08, GATE-09

**Success Criteria:**
1. Developer can run a strict no-TypeScript-backend topology mode with web, Go, runtime service, selected web-through-Go routes, and representative page-load smoke required.
2. Developer can verify `pnpm boundary:monitors` includes representative page-load smoke and no-TypeScript-backend checks.
3. Developer can verify monitors fail on TypeScript backend ownership creep, direct web persistence access, retired fallback, unexpected Strategy execution outside runtime service, ABI drift, route drift, manifest drift, privacy drift, and page-load failure.
4. Developer can verify stopped-Go and stopped-runtime-service drills fail closed or classify explicitly without TypeScript backend fallback.
5. Developer can verify browser replay realism still passes for Go-created or Go-completed public replay evidence.

**Plans:** 1 plan

### Phase 109: Milestone Verification, Deletion Audit, and Promotion Decision

**Goal:** Developers can verify the milestone end state, inspect deletion/quarantine evidence, record promotion/defer decisions, and prepare v1.16 completion packaging.
**Depends on:** Phase 108
**Requirements:** EXIT-01, EXIT-02, EXIT-03, EXIT-04, EXIT-05

**Success Criteria:**
1. Developer can run the final v1.16 verification suite with Go tests, runtime-service tests/typecheck, web/service tests, topology strict mode, boundary monitors, replay/page smoke, and privacy scans.
2. Developer can inspect a deletion/quarantine audit of all retired or remaining TypeScript backend-like surfaces.
3. Developer can inspect a promotion decision proving the normal product topology is web frontend -> Go backend -> isolated JS/TS runtime service.
4. Developer can verify no v1.16 artifact or diagnostic leaks private Strategy, owner, session, host, database, runtime, or source material.
5. Developer can complete milestone archive steps after audit: archive requirements/roadmap/phases, remove active requirements, update project state files, and tag `v1.16`.

**Plans:** 1 plan

## Progress

**Execution Order:** Phase 103 -> Phase 104 -> Phase 105 -> Phase 106 -> Phase 107 -> Phase 108 -> Phase 109

| Phase | Plans Complete | Status | Completed |
| --- | --- | --- | --- |
| 103. TypeScript Backend Inventory and Retirement Contract | 1/1 | Complete | 2026-05-24 |
| 104. Isolated Runtime Service Boundary Hardening | 0/1 | Pending | — |
| 105. Web/API Go-Only Cutover and Fallback Removal | 0/1 | Pending | — |
| 106. TypeScript Worker and Persistence Quarantine | 0/1 | Pending | — |
| 107. Deferred Surface Relabeling and Privacy Preservation | 0/1 | Pending | — |
| 108. No-TypeScript-Backend Topology and Monitor Gate | 0/1 | Pending | — |
| 109. Milestone Verification, Deletion Audit, and Promotion Decision | 0/1 | Pending | — |

## Requirement Coverage

| Requirement Group | Phase | Count |
| --- | --- | ---: |
| BASE-01 through BASE-06 | Phase 103 | 6 |
| RT-01 through RT-07 | Phase 104 | 7 |
| WEB-01 through WEB-08 | Phase 105 | 8 |
| QUAR-01 through QUAR-07 | Phase 106 | 7 |
| DEF-01 through DEF-06 | Phase 107 | 6 |
| GATE-01 through GATE-09 | Phase 108 | 9 |
| EXIT-01 through EXIT-05 | Phase 109 | 5 |

**Coverage:** 48/48 v1.16 requirements mapped.
**Unmapped requirements:** 0.

## Next Up

Start with `$gsd-discuss-phase 103` to clarify the inventory and retirement contract, then `$gsd-plan-phase 103`.

---
*Last updated: 2026-05-24 after v1.16 milestone initialization*
