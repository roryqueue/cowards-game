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
- [x] **v1.12 Go Backend Promotion Readiness and Cutover Plan** - Phases 76-81, complete with promote-none-yet decision.

## Current Milestone: v1.12 Go Backend Promotion Readiness and Cutover Plan

**Status:** Complete
**Phases:** 76-81
**Granularity:** Standard
**Requirements:** 36/36 mapped
**Research:** `.planning/research/SUMMARY.md`

## Overview

v1.12 is a decisive Go backend transition readiness milestone, not a broad rewrite. It re-baselines TypeScript-service versus Go ownership, defines promotion criteria for production web reads, adds production-equivalent live evidence where feasible, and decides whether to promote at most one narrow public read route: `getPublicStrategyPage` / `GET /public/strategies/{strategyId}`.

The milestone is successful if it produces a defensible `promote-none-yet` decision. Promotion is allowed only when route ownership, live Go data behavior, generated parity, schema validation, privacy, topology, CI-grade evidence, no-fallback semantics, rollback, public-safe diagnostics, and operational failure behavior all pass.

## Phases

- [x] **Phase 76: Scope Lock and Route Ownership Manifest** - Developers can inspect current ownership, select at most the public Strategy page route as a candidate, and lock promotion/no-go criteria before implementation.
- [x] **Phase 77: Production Read Switch Contract** - Developers can implement and test a route-scoped TypeScript-vs-Go read switch that defaults to TypeScript and fails closed without fallback in Go-selected mode.
- [x] **Phase 78: Conditional Public Strategy Go Read Path** - Users can keep loading public Strategy pages through TypeScript by default, and optionally through Go only if live-read promotion criteria are satisfied.
- [x] **Phase 79: Privacy, Parity, and Boundary Drift Gate** - Developers can prove Go responses, diagnostics, topology output, route manifests, and boundary monitors preserve canonical schemas and privacy.
- [x] **Phase 80: Rollback and Operational Failure Drill** - Operators can rehearse forward cutover, stopped-Go no-fallback, bad-response/timeout/privacy-failure behavior, and rollback to TypeScript.
- [x] **Phase 81: Milestone Verification and Promotion Decision** - Developers can run the full v1.12 gate and record either `promote-one-route` or `promote-none-yet` with evidence and deferred work.

## Phase Details

### Phase 76: Scope Lock and Route Ownership Manifest

**Goal:** Developers can identify v1.12 ownership scope, verify current boundary evidence, select at most one public read candidate, and lock explicit non-goals before implementation.
**Depends on:** Phase 75
**Requirements:** OWN-01, OWN-02, OWN-03, OWN-04, OWN-05, OWN-06

**Success Criteria:**
1. Developer can inspect a route ownership matrix covering the 29 broad web report-only offenses and the five current GET-only Go route manifest entries.
2. Developer can inspect a candidate scorecard and see `getPublicStrategyPage` as the only eligible route for possible production Go read promotion.
3. Developer can verify `promote-none-yet` is an acceptable final decision with blocker categories.
4. Developer can verify explicit non-goals for writes, auth/session mutation, ladder writes, Match orchestration, jobs, migrations, persistence ownership, Strategy source retrieval, Strategy execution, runtime sandbox promotion, counted non-JS play, and rule/engine changes.
5. Developer can verify baseline evidence for boundary imports, report-only count, Go manifest inventory, topology behavior, and the v1.11 worker-idle caveat.

**Plans:** 1 plan

- [x] 76-01-PLAN.md - Capture ownership matrix, candidate scorecard, route selection, promotion/no-go criteria, and non-goals.

### Phase 77: Production Read Switch Contract

**Goal:** Developers can route exactly one selected public read through a narrow switch contract that defaults to TypeScript and fails closed without fallback when Go is selected.
**Depends on:** Phase 76
**Requirements:** SWCH-01, SWCH-02, SWCH-03, SWCH-04, SWCH-05, SWCH-06

**Success Criteria:**
1. Developer can inspect a route-scoped promotion registry with owner, fallback, rollback, privacy, and diagnostics metadata.
2. Developer can verify unset/default config keeps production web reads on the TypeScript service path.
3. Developer can verify Go-selected mode does not automatically call TypeScript on network failure, timeout, malformed response, schema drift, privacy failure, 5xx, unavailable Go, or divergence.
4. Developer can verify switch logic lives in the service adapter/client boundary rather than React components, route handlers, Go proxies, or persistence modules.
5. Developer can verify Go client responses parse through canonical spec schemas and produce public-safe success and error shapes.
6. Developer can verify diagnostics expose only sanitized route/backend/status/duration/failure-class details.

**Plans:** 1 plan

- [x] 77-01-PLAN.md - Implement the route-scoped switch contract, typed Go client behavior, no-fallback semantics, and diagnostics tests.

### Phase 78: Conditional Public Strategy Go Read Path

**Goal:** Users can load public Strategy pages unchanged by default, and the project can attempt Go ownership for that route only when live-read criteria are satisfied.
**Depends on:** Phase 77
**Requirements:** GOREAD-01, GOREAD-02, GOREAD-03, GOREAD-04, GOREAD-05, GOREAD-06, GOREAD-07

**Success Criteria:**
1. User can load public Strategy pages through existing TypeScript service behavior when the switch is unset or TypeScript-owned.
2. User can load the same public Strategy page through Go-owned behavior only when `getPublicStrategyPage` is explicitly selected and promotion evidence passes.
3. Developer can verify any claimed promotion uses live or production-equivalent Go data rather than fixture-only data.
4. Developer can verify TypeScript and Go DTO parity for success, missing, malformed, unavailable, ordering, and public error cases.
5. Developer can verify public Strategy Go responses remain source-free and omit all private Strategy, owner, replay, session, host, database, and runtime internals.
6. Developer can verify no other Go route or private/source/runtime/write surface is promoted.
7. Developer can document a no-go decision without partially enabling Go when live-read criteria fail.

**Plans:** 1 plan

- [x] 78-01-PLAN.md - Attempt the conditional public Strategy read path or record `promote-none-yet` blockers when live criteria are not met.

### Phase 79: Privacy, Parity, and Boundary Drift Gate

**Goal:** Developers can prove the selected route and surrounding evidence preserve canonical service schemas, privacy guards, Go manifest constraints, and import boundaries.
**Depends on:** Phase 78
**Requirements:** GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06

**Success Criteria:**
1. Developer can run Go parity checks and verify fixtures, route manifest, checksums, schema validation, and public error shapes remain aligned with TypeScript-service outputs.
2. Developer can run boundary monitors and verify the Go route manifest remains GET-only, canonical, privacy-checked, and limited to approved read-only routes.
3. Developer can run required live Go topology checks covering direct Go, web-through-selected-route behavior when enabled, TypeScript-owned default behavior, owner analytics auth rejection, and sanitized diagnostics.
4. Developer can verify required Go evidence fails loudly without TypeScript fallback for stopped Go, invalid JSON, timeout, schema/privacy failure, and divergence.
5. Developer can verify strict import offenses remain zero and broad report-only offenses do not increase above 29.
6. Developer can verify no rules, Chronicle reconstruction, scoring, runtime execution, or Strategy validation logic moved into web, service mapper, or Go handler layers.

**Plans:** 1 plan

- [x] 79-01-PLAN.md - Harden parity, privacy, topology, route manifest, and boundary monitors around the selected route decision.

### Phase 80: Rollback and Operational Failure Drill

**Goal:** Operators can prove forward cutover, no-fallback failure, public-safe degraded behavior, and rollback to TypeScript for the selected route.
**Depends on:** Phase 79
**Requirements:** OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06

**Success Criteria:**
1. Operator can follow a rollback runbook that returns the selected route to TypeScript ownership through one explicit owner/config switch.
2. Developer can run forward cutover, stopped-Go, timeout/bad-response, privacy-failure, and rollback drills.
3. User receives public-safe failure behavior for Go-selected unavailable, timeout, malformed, divergent, missing, and schema/privacy-failed responses.
4. Developer can inspect evidence artifacts for cutover, no-fallback failure, rollback, privacy scan, route owner state, and final decision.
5. Developer can verify logs, topology JSON, monitor output, and evidence artifacts omit all private Strategy, owner, session, host, database, and runtime internals.
6. Developer can verify rollback does not affect immutable Strategy Revisions, public Strategy cards, replays, Workshop behavior, MatchSet evidence, or deterministic engine behavior.

**Plans:** 1 plan

- [x] 80-01-PLAN.md - Add rollback runbook, operational drills, public-safe failure behavior, and evidence artifacts.

### Phase 81: Milestone Verification and Promotion Decision

**Goal:** Developers can run the full v1.12 verification set and record a final promotion decision with evidence, blockers, and deferred work.
**Depends on:** Phase 80
**Requirements:** VER-01, VER-02, VER-03, VER-04, VER-05

**Success Criteria:**
1. Developer can run v1.12 verification commands for contracts, OpenAPI lint, import boundaries, spec tests, service tests, web tests, typecheck, Go parity, Go tests, live topology, boundary monitors, formatting, and whitespace checks.
2. Developer can inspect final evidence showing either `promote-one-route` with owner state or `promote-none-yet` with blockers.
3. Developer can verify public/service/Go/topology/monitor outputs remain free of private Strategy, owner, session, host, database, and runtime internals.
4. Developer can verify all 36 active v1.12 requirements are mapped, implemented or explicitly blocked/deferred, and covered by validation evidence.
5. Developer can verify deferred work is updated for unpromoted read routes, Go writes, auth/session mutation, ladder writes, Match orchestration, jobs, migrations, persistence ownership, Strategy source retrieval, Strategy execution, runtime sandbox promotion, and counted non-JS play.

**Plans:** 1 plan

- [x] 81-01-PLAN.md - Run the final v1.12 verification gate and record the route promotion decision.

## Progress

**Execution Order:** Phase 76 -> Phase 77 -> Phase 78 -> Phase 79 -> Phase 80 -> Phase 81

| Phase | Plans Complete | Status | Completed |
| --- | --- | --- | --- |
| 76. Scope Lock and Route Ownership Manifest | 1/1 | Complete | 2026-05-23 |
| 77. Production Read Switch Contract | 1/1 | Complete | 2026-05-23 |
| 78. Conditional Public Strategy Go Read Path | 1/1 | Complete | 2026-05-23 |
| 79. Privacy, Parity, and Boundary Drift Gate | 1/1 | Complete | 2026-05-23 |
| 80. Rollback and Operational Failure Drill | 1/1 | Complete | 2026-05-23 |
| 81. Milestone Verification and Promotion Decision | 1/1 | Complete | 2026-05-23 |

## Requirement Coverage

| Requirement Group | Phase | Count |
| --- | --- | ---: |
| OWN-01 through OWN-06 | Phase 76 | 6 |
| SWCH-01 through SWCH-06 | Phase 77 | 6 |
| GOREAD-01 through GOREAD-07 | Phase 78 | 7 |
| GATE-01 through GATE-06 | Phase 79 | 6 |
| OPS-01 through OPS-06 | Phase 80 | 6 |
| VER-01 through VER-05 | Phase 81 | 5 |

**Coverage:** 36/36 v1.12 requirements mapped.
**Completed:** 36/36 v1.12 requirements covered or explicitly blocked/deferred.
**Unmapped requirements:** 0.
**Selected Go production read candidate:** `getPublicStrategyPage` / `GET /public/strategies/{strategyId}`.
**Valid final decisions:** `promote-one-route` or `promote-none-yet`.
**Starting boundary baseline:** `strict_offenses=0 report_only_offenses=29`.

## Next Up

v1.12 complete. Final decision: `promote-none-yet` because Go public Strategy reads remain fixture-backed rather than production-equivalent.

## Archived Execution History

Phase execution history for completed milestones is archived under `.planning/milestones/vX.Y-phases/`.

---
*Last updated: 2026-05-23 after v1.12 roadmap creation*
