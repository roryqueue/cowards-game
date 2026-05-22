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
- [ ] **v1.9 Backend and Runtime Ownership Split** - Phases 57-63, planned.

## Current Milestone: v1.9 Backend and Runtime Ownership Split

**Status:** Roadmap created
**Phases:** 57-63
**Granularity:** Standard
**Requirements:** 28/28 mapped

## Overview

v1.9 makes one production ownership move: service-backed web read/user surfaces become more canonical while strict import enforcement widens around each migrated slice. The milestone starts with an explicit ownership matrix and baseline evidence, migrates the public player profile and owner account reads through `@cowards/service`, chooses the public ladder service read as the single follow-up read boundary, and keeps Go, production runtime isolation, and counted non-JS play behind guardrails rather than promotion. The active read-model branch is the public ladder service read; Go read-model expansion is deferred to future backend migration requirements.

## Phases

- [ ] **Phase 57: Ownership Matrix and Baseline Evidence** - Developers can see the v1.9 ownership split, non-goals, and starting boundary evidence before migration begins.
- [ ] **Phase 58: Public Player Profile Service Read** - Users can view public player profiles through `@cowards/service` with unchanged behavior, privacy, and stricter imports.
- [ ] **Phase 59: Owner Account Read Service Slice** - Signed-in users can load account session and revision-list reads through service-owned DTOs without moving mutations or source retrieval.
- [ ] **Phase 60: Public Ladder Service Read Follow-Up** - Users can view the selected public ladder season through `@cowards/service` while Go writes and Go route expansion stay out of scope.
- [ ] **Phase 61: Runtime Isolation Readiness Guardrails** - Developers can inspect production runtime-isolation readiness criteria and verify no candidate is promoted by default.
- [ ] **Phase 62: Experimental Non-JS Runtime Guardrails** - Users and developers see experimental non-JS semantics while counted eligibility remains fail-closed.
- [ ] **Phase 63: Milestone Verification and Regression Gate** - Developers can run the v1.9 verification set and prove existing JS/TS, replay, analytics, and privacy behavior remain unchanged.

## Phase Details

### Phase 57: Ownership Matrix and Baseline Evidence
**Goal**: Developers can identify v1.9 ownership scope, verify current boundary evidence, and confirm Go/runtime/non-JS non-goals before any migration.
**Depends on**: Phase 56
**Requirements**: OWN-01, OWN-02, OWN-03, OWN-04
**Success Criteria** (what must be TRUE):
  1. Developer can inspect a v1.9 ownership matrix naming selected routes, files, DTOs, and processes owned by web, `@cowards/service`, `@cowards/spec`, Go, runtime adapters, or future milestones.
  2. Developer can verify baseline boundary evidence from `pnpm boundary:imports`, `pnpm boundary:monitors`, current strict offenses, and current report-only broad web persistence/runtime offenses.
  3. Developer can see explicit v1.9 non-goals for Go writes, production sandbox promotion, counted non-JS play, full replay projection, Workshop source/test/save flows, and backend rewrites.
  4. Developer can verify no v1.9 ownership change moves game rules into React components, web route handlers, service DTO mappers, or Go handlers.
**Plans**: TBD

### Phase 58: Public Player Profile Service Read
**Goal**: Users can view the public player profile page through the service boundary with the same public behavior, privacy guarantees, and stricter dependency enforcement.
**Depends on**: Phase 57
**Requirements**: SVC-01, SVC-02, SVC-03, SVC-04, SVC-05
**Success Criteria** (what must be TRUE):
  1. User can view the public player profile page with the same found, not-found, Strategy card, ladder history, and privacy behavior after the page reads through `@cowards/service`.
  2. Developer can call a canonical `@cowards/service` public player profile read that validates input and output with `@cowards/spec` schemas before returning data.
  3. Developer can verify public player profile DTOs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, and private runtime internals by default.
  4. Developer can verify the migrated public player profile page and its dependency closure are covered by strict import enforcement against persistence roots, migrations, workers, runtime adapters, and Strategy execution modules.
  5. Developer can verify the broad web import-boundary baseline decreases after migration instead of masking migrated direct-import fingerprints.
**Plans**: TBD
**UI hint**: yes

### Phase 59: Owner Account Read Service Slice
**Goal**: Signed-in users can load account session and Strategy Revision list reads through service-owned DTOs while mutations, source access, and execution flows stay in their existing ownership boundaries.
**Depends on**: Phase 58
**Requirements**: ACCT-01, ACCT-02, ACCT-03, ACCT-04, ACCT-05
**Success Criteria** (what must be TRUE):
  1. Signed-in user can load the account session snapshot through a service-owned read while existing authenticated and unauthenticated behavior remains unchanged.
  2. Signed-in user can view their account Strategy Revision list with metadata, hashes, status, language/runtime labels, counted eligibility, and compatibility data without receiving Strategy source.
  3. Developer can verify owner account reads authorize before resource-specific disclosure and do not expose session ids, bearer tokens, private handles, existence oracles, stack traces, stderr, host paths, or private runtime internals.
  4. Developer can verify Strategy saves, source retrieval, validation/test execution, submissions, MatchSet creation, analytics reruns, exports, and other mutation flows are not moved behind the new read slice.
  5. Developer can verify migrated account read files and their dependency closure are covered by strict import enforcement.
**Plans**: TBD
**UI hint**: yes

### Phase 60: Public Ladder Service Read Follow-Up
**Goal**: Users can view the selected public ladder season through `@cowards/service` while Go expansion remains follow-up-only and write/orchestration ownership stays out of scope.
**Depends on**: Phase 59
**Requirements**: READ-01, READ-02, READ-05
**Success Criteria** (what must be TRUE):
  1. Developer can verify the public ladder season service read is the exactly one active v1.9 follow-up read boundary after the player profile and account read migrations.
  2. User can view the selected ladder season through `@cowards/service` while preserving not-found behavior, standings, entry metadata, MatchSet links, counted-state explanations, and no-permanent-ratings copy.
  3. Developer can verify Go mutation endpoints, auth/session mutation, ladder entry/schedule/status writes, Match orchestration, job claiming, migrations, persistence writes, and Strategy execution remain out of scope.
  4. Developer can verify the unselected Go read-model branch is not added in v1.9 without future TypeScript-service-backed parity fixtures, GET-only routing, topology diagnosis, and rollback scope.
**Plans**: TBD
**UI hint**: yes

### Phase 61: Runtime Isolation Readiness Guardrails
**Goal**: Developers can inspect production runtime-isolation promotion criteria and verify runtime candidates remain evidence-only instead of counted execution defaults.
**Depends on**: Phase 60
**Requirements**: RUN-01, RUN-02, RUN-03, RUN-04
**Success Criteria** (what must be TRUE):
  1. Developer can inspect runtime isolation promotion-readiness criteria covering required container probes, resource limits, filesystem denial, network denial, output caps, timeouts, image provenance, deployment prerequisites, failure taxonomy, and redacted diagnostics.
  2. Developer can verify worker-thread, host subprocess, container subprocess, Deno-style, WASM/WASI, gVisor, microVM, and other candidates are not promoted to production counted Match execution by default.
  3. Developer can verify required runtime checks fail loudly rather than silently falling back to worker-thread, host subprocess, JS/TS, stale fixtures, or in-process execution.
  4. Developer can verify runtime diagnostics distinguish Strategy runtime violations from system failures without exposing Strategy source, StrategyMemory, SoldierMemory, objective payloads, stderr, stack traces, host paths, sessions, tokens, or private runtime internals.
**Plans**: TBD

### Phase 62: Experimental Non-JS Runtime Guardrails
**Goal**: Users and developers can understand non-JS promotion criteria and experimental labels while Python and other non-JS runtimes remain disabled for counted play.
**Depends on**: Phase 61
**Requirements**: NJS-01, NJS-02, NJS-03, NJS-04
**Success Criteria** (what must be TRUE):
  1. Developer can inspect non-JS promotion criteria covering deterministic language semantics, package policy, Workshop UX/docs, compatibility keys, counted eligibility, replay/export privacy, rollback, and deprecation rules.
  2. Developer can verify Python and other non-JS runtimes remain experimental, disabled for normal counted play, and fail-closed for MatchSet, ladder, and gauntlet counted eligibility.
  3. User-facing runtime labels and validation messages can mention experimental non-JS semantics without adding a public language picker or implying production support parity.
  4. Developer can verify compatibility and boundary monitors fail on accidental non-JS counted eligibility or unsupported runtime promotion.
**Plans**: TBD
**UI hint**: yes

### Phase 63: Milestone Verification and Regression Gate
**Goal**: Developers can run the v1.9 verification set and prove service migrations, guardrails, and unchanged gameplay/privacy behavior before release.
**Depends on**: Phase 62
**Requirements**: VER-01, VER-02, VER-03
**Success Criteria** (what must be TRUE):
  1. Developer can run v1.9 verification commands for contracts, import boundaries, service tests, web tests, typecheck, topology, boundary monitors, and selected Go/runtime guardrail checks.
  2. Developer can verify existing JS/TS Workshop, immutable Strategy Revision behavior, exhibition/trial evidence, replay viewer, saved gauntlet analytics, golden parity, and public privacy behavior remain unchanged.
  3. Developer can verify public replay, service, Go, topology, monitor, export, analytics, and runtime outputs still omit private Strategy/runtime data by default.
**Plans**: TBD

## Progress

**Execution Order:** Phase 57 -> Phase 58 -> Phase 59 -> Phase 60 -> Phase 61 -> Phase 62 -> Phase 63

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 57. Ownership Matrix and Baseline Evidence | 0/TBD | Not started | - |
| 58. Public Player Profile Service Read | 0/TBD | Not started | - |
| 59. Owner Account Read Service Slice | 0/TBD | Not started | - |
| 60. Public Ladder Service Read Follow-Up | 0/TBD | Not started | - |
| 61. Runtime Isolation Readiness Guardrails | 0/TBD | Not started | - |
| 62. Experimental Non-JS Runtime Guardrails | 0/TBD | Not started | - |
| 63. Milestone Verification and Regression Gate | 0/TBD | Not started | - |

## Requirement Coverage

| Requirement Group | Phase | Count |
| --- | --- | ---: |
| OWN-01 through OWN-04 | Phase 57 | 4 |
| SVC-01 through SVC-05 | Phase 58 | 5 |
| ACCT-01 through ACCT-05 | Phase 59 | 5 |
| READ-01, READ-02, READ-05 | Phase 60 | 3 |
| RUN-01 through RUN-04 | Phase 61 | 4 |
| NJS-01 through NJS-04 | Phase 62 | 4 |
| VER-01 through VER-03 | Phase 63 | 3 |

**Coverage:** 28/28 v1.9 requirements mapped.
**Unmapped requirements:** 0.
**Branch note:** The approved v1.9 direction selects the public ladder service read branch. Future Go read-model expansion is tracked in BACKX-03 and BACKX-04, outside the active 28-requirement roadmap.

## Next Up

**Phase 57: Ownership Matrix and Baseline Evidence**

Recommended next command:

`$gsd-discuss-phase 57`

---
*Roadmap created: 2026-05-22 for v1.9 Backend and Runtime Ownership Split*
