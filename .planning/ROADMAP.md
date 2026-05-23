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
- [ ] **v1.11 Remaining Web Read Boundary Burn-Down and Live Go Readiness Evidence** - Phases 70-75, active.

## Current Milestone: v1.11 Remaining Web Read Boundary Burn-Down and Live Go Readiness Evidence

**Status:** Planned
**Phases:** 70-75
**Granularity:** Standard
**Requirements:** 30/30 mapped

## Overview

v1.11 continues the service-boundary burn-down after v1.10. It starts by re-baselining the remaining 30 broad web report-only direct persistence offenses, selects Workshop test-summary and analytics-compare GET reads as the next narrow public/owner-safe read surfaces, and keeps writes, Strategy source, Workshop launch/rerun/export/runtime flows, replay owner-debug/private Chronicle assembly, production sandbox promotion, counted non-JS play, Go writes, and production Go routing out of scope. Live Go readiness becomes a required evidence-only validation lane: parity, route manifest, topology, privacy, no-fallback semantics, and rollback evidence must pass, but production web traffic remains on the TypeScript service path.

## Phases

- [ ] **Phase 70: Boundary Debt Rebaseline and v1.11 Scope Lock** - Developers can inspect the 30-offense ownership matrix, selected Workshop read slices, live Go evidence decision, and non-goals before migration begins.
- [ ] **Phase 71: Workshop Test Summary Read Boundary** - Users can load Workshop test summaries through a service-backed source-free DTO while launch/source/runtime behavior remains TypeScript-owned.
- [ ] **Phase 72: Workshop Analytics Compare Read Boundary** - Users can load Workshop analytics comparison data through a service-backed DTO while rerun/save/export/execution behavior remains TypeScript-owned.
- [ ] **Phase 73: Boundary Enforcement and Source-Free Type Cleanup** - Developers can promote proven migrated files to strict import enforcement, remove real report-only fingerprints, and reduce the baseline below 30.
- [ ] **Phase 74: Live Go Readiness Evidence Gate** - Developers can require live Go topology evidence as validation only, with privacy, no-fallback, GET-only, rollback, and non-promotion proof.
- [ ] **Phase 75: Milestone Verification and Regression Gate** - Developers can run the full v1.11 verification set and prove service migrations, privacy, Go evidence, and unchanged gameplay behavior before release.

## Phase Details

### Phase 70: Boundary Debt Rebaseline and v1.11 Scope Lock

**Goal:** Developers can identify v1.11 ownership scope, verify current boundary evidence, select the Workshop read slices, and lock Go/runtime/non-JS/replay/source non-goals before implementation.
**Depends on:** Phase 69
**Requirements:** SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04, SCOPE-05

**Success Criteria:**
1. Developer can inspect a v1.11 ownership matrix classifying all 30 report-only boundary offenses and naming selected candidates versus intentionally deferred surfaces.
2. Developer can verify baseline evidence from `pnpm boundary:imports`, current Go route inventory, topology checks, and boundary monitors before implementation begins.
3. Developer can see explicit non-goals for writes, Strategy source retrieval, Workshop source/save/validation/test-launch/rerun/export flows, full replay projection, production Go routing, production sandbox promotion, counted non-JS play, and rule semantics changes.
4. Developer can verify selected slices name web routes, service methods, spec DTOs, strict import targets, privacy checks, and rollback/defer criteria.
5. Developer can verify the milestone avoids cleanup-only work unless it is tied to a proven selected read boundary.

**Plans:** 1 plan

- [ ] 70-01-PLAN.md - Capture v1.11 ownership matrix, report-only baseline evidence, selected Workshop read slices, live Go evidence decision, and non-goals.

### Phase 71: Workshop Test Summary Read Boundary

**Goal:** Users can load Workshop test MatchSet summaries through a service-backed source-free DTO while launch/source/runtime flows stay out of scope.
**Depends on:** Phase 70
**Requirements:** WTEST-01, WTEST-02, WTEST-03, WTEST-04, WTEST-05

**Success Criteria:**
1. User can load `GET /api/workshop/tests/{matchSetId}` with unchanged status, Match ids, match summaries, scoring, and replay availability behavior.
2. Developer can call a canonical `@cowards/service` test-summary read method that validates input and output with `@cowards/spec`.
3. Developer can verify the DTO omits Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, and private runtime internals by default.
4. Developer can verify Workshop test launch, source validation, source save, source retrieval, runtime execution, Match orchestration, and worker behavior are unchanged and not moved.
5. Developer can verify missing and storage-unavailable errors preserve current public-safe behavior.

**Plans:** 1 plan

- [ ] 71-01-PLAN.md - Move the Workshop test-summary GET read behind spec/service-owned DTOs.

### Phase 72: Workshop Analytics Compare Read Boundary

**Goal:** Users can load Workshop analytics profile comparison data through a service-backed DTO while rerun/save/export/execution flows stay out of scope.
**Depends on:** Phase 71
**Requirements:** WCOMP-01, WCOMP-02, WCOMP-03, WCOMP-04, WCOMP-05

**Success Criteria:**
1. User can load `GET /api/workshop/analytics/profiles/{profileId}/compare` with unchanged profile id, base/compare run ids, compatibility, W-L-D, points, evidence, and delta behavior.
2. Developer can call a canonical `@cowards/service` comparison read method that validates input and output with `@cowards/spec`.
3. Developer can verify comparison DTOs and diagnostics omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, and private runtime internals by default.
4. Developer can verify analytics rerun, profile save, export, gauntlet execution, test Match launch, worker execution, and persistence writes remain unchanged and not moved.
5. Developer can verify local/owner availability checks and storage errors do not create private analytics existence oracles.

**Plans:** 1 plan

- [ ] 72-01-PLAN.md - Move the Workshop analytics-compare GET read behind spec/service-owned DTOs.

### Phase 73: Boundary Enforcement and Source-Free Type Cleanup

**Goal:** Developers can promote migrated slices from report-only to strict enforcement, remove real broad web fingerprints, and reduce report-only debt below 30 without hiding persistence behind broad facades.
**Depends on:** Phase 72
**Requirements:** BOUND-01, BOUND-02, BOUND-03, BOUND-04, BOUND-05

**Success Criteria:**
1. Developer can run `pnpm boundary:imports` and see `strict_offenses=0` with `report_only_offenses` below the v1.11 baseline of 30.
2. Developer can verify migrated report-only fingerprints are removed from the known baseline instead of hidden by path-only masking.
3. Developer can verify selected route files and safe dependency closures are strict import-gated.
4. Developer can verify source-free type cleanup does not promote source-bearing Workshop templates, samples, private source payloads, or runtime internals into public/service outputs.
5. Developer can verify no game rules moved into React components, web routes, service DTO mappers, or Go handlers.

**Plans:** 1 plan

- [ ] 73-01-PLAN.md - Promote selected Workshop read boundaries to strict enforcement and reduce real report-only debt.

### Phase 74: Live Go Readiness Evidence Gate

**Goal:** Developers can require live Go readiness evidence as validation only while keeping Go read-only, fixture-backed, and out of production web routing.
**Depends on:** Phase 73
**Requirements:** GOEVID-01, GOEVID-02, GOEVID-03, GOEVID-04, GOEVID-05, GOEVID-06

**Success Criteria:**
1. Developer can run `pnpm go:parity` and verify Go fixture, route manifest, checksum, schema, privacy, and public error parity.
2. Developer can run `pnpm boundary:monitors` and verify Go route inventory remains GET-only, canonical, privacy-checked, and limited to approved read-only fixture routes.
3. Developer can run live local Go topology with `pnpm topology:check -- --require-go --json` and pass required health, public MatchSet, replay metadata, public Strategy page, owner analytics auth rejection, and diagnostic privacy checks.
4. Developer can verify required live Go evidence fails loudly without silent TypeScript fallback when Go is unavailable or divergent.
5. Developer can verify rollback documentation leaves production web traffic on the TypeScript service path.
6. Developer can verify Go writes, auth/session mutation, ladder writes, Match orchestration, jobs, migrations, persistence ownership, Strategy source retrieval, Strategy execution, production web routing to Go, runtime sandbox promotion, and counted non-JS play remain out of scope.

**Plans:** 1 plan

- [ ] 74-01-PLAN.md - Add live Go readiness evidence-only validation and non-promotion guardrails.

### Phase 75: Milestone Verification and Regression Gate

**Goal:** Developers can run the v1.11 verification set and prove Workshop service migrations, boundary reduction, live Go evidence, privacy, and unchanged gameplay behavior before release.
**Depends on:** Phase 74
**Requirements:** VER-01, VER-02, VER-03, VER-04

**Success Criteria:**
1. Developer can run v1.11 verification commands for contracts, import boundaries, service tests, web tests, typecheck, Go parity, required live Go topology, boundary monitors, replay smoke privacy, formatting, and whitespace checks.
2. Developer can verify existing JS/TS Workshop behavior, immutable Strategy Revision behavior, exhibition/trial evidence, replay viewer, saved gauntlet analytics, golden parity, and public privacy behavior remain unchanged.
3. Developer can verify final report-only count, selected strict files, live Go evidence, runtime/non-JS non-promotion state, and rollback/defer notes are documented.
4. Developer can verify all 30 active v1.11 requirements are mapped, implemented or explicitly deferred, and covered by validation evidence.

**Plans:** 1 plan

- [ ] 75-01-PLAN.md - Run the v1.11 verification gate, fix regressions, and close milestone state.

## Progress

**Execution Order:** Phase 70 -> Phase 71 -> Phase 72 -> Phase 73 -> Phase 74 -> Phase 75

| Phase | Plans Complete | Status | Completed |
| --- | --- | --- | --- |
| 70. Boundary Debt Rebaseline and v1.11 Scope Lock | 0/1 | Pending | - |
| 71. Workshop Test Summary Read Boundary | 0/1 | Pending | - |
| 72. Workshop Analytics Compare Read Boundary | 0/1 | Pending | - |
| 73. Boundary Enforcement and Source-Free Type Cleanup | 0/1 | Pending | - |
| 74. Live Go Readiness Evidence Gate | 0/1 | Pending | - |
| 75. Milestone Verification and Regression Gate | 0/1 | Pending | - |

## Requirement Coverage

| Requirement Group | Phase | Count |
| --- | --- | ---: |
| SCOPE-01 through SCOPE-05 | Phase 70 | 5 |
| WTEST-01 through WTEST-05 | Phase 71 | 5 |
| WCOMP-01 through WCOMP-05 | Phase 72 | 5 |
| BOUND-01 through BOUND-05 | Phase 73 | 5 |
| GOEVID-01 through GOEVID-06 | Phase 74 | 6 |
| VER-01 through VER-04 | Phase 75 | 4 |

**Coverage:** 30/30 v1.11 requirements mapped.
**Completed:** 0/30 v1.11 requirements.
**Unmapped requirements:** 0.
**Selected web read slices:** Workshop test-summary GET and Workshop analytics-compare GET.
**Starting boundary baseline:** `strict_offenses=0 report_only_offenses=30`.

## Next Up

**Phase 70: Boundary Debt Rebaseline and v1.11 Scope Lock**

Recommended next command:

`$gsd-discuss-phase 70`

Also valid:

`$gsd-plan-phase 70`

---
*Last updated: 2026-05-23 after v1.11 roadmap creation*
