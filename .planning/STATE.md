---
gsd_state_version: 1.0
milestone: v1.11
milestone_name: Remaining Web Read Boundary Burn-Down and Live Go Readiness Evidence
status: awaiting_next_milestone
stopped_at: v1.11 archived
last_updated: "2026-05-23T05:05:00.000Z"
last_activity: 2026-05-23
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 6
  completed_plans: 6
  percent: 100
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.11 archived; ready for next milestone

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-23)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Planning v1.12 Go Backend Promotion Readiness and Cutover Plan.
**Latest shipped milestone:** v1.11 Remaining Web Read Boundary Burn-Down and Live Go Readiness Evidence
**Requirements:** archived in .planning/milestones/v1.11-REQUIREMENTS.md; fresh requirements pending next milestone
**Roadmap:** .planning/ROADMAP.md

## Current Position

Phase: -
Plan: -
Status: Awaiting next milestone
Last activity: 2026-05-23 - v1.11 archived and tagged

Progress: [##########] 100%

## Workflow Settings

- Mode: YOLO
- Granularity: Standard
- Execution: Sequential boundary foundation first, then parallel where safe
- Git tracking: Yes
- Research before planning: Yes
- Plan check: Yes
- Verifier: Yes
- Model profile: Balanced

## Active Milestone Summary

v1.12 candidate direction:

- Run one large Go transition readiness milestone, not a blind full rewrite.
- Prove production-read criteria, CI-grade live Go evidence, no-fallback behavior, rollback, privacy, and operational failure behavior.
- Promote at most one narrow production read route only if research proves it is boring and reversible.
- Keep Go writes, auth/session mutation, Match orchestration, jobs, migrations, persistence ownership, Strategy source retrieval, and Strategy execution out of scope unless explicit promotion criteria are proven.

## Completed Milestones

| Milestone | Phases | Plans | Requirements | Status |
| --- | ---: | ---: | ---: | --- |
| v1.0 MVP | 7 | 33 | 80/80 | Shipped |
| v1.1 Trustworthy Simulation Beta | 6 | 29 | 34/34 | Shipped |
| v1.2 Competitive Alpha | 5 | 10 | 33/33 | Shipped |
| v1.3 Competition Trust Beta | 6 | 6 | 51/51 | Shipped |
| v1.4 Cycle-Interleaved Rules Correction | 5 | 5 | 33/33 | Shipped |
| v1.5 Strategy Workshop Power Tools and Advanced Strategy Library | 8 | 8 | 53/53 | Shipped |
| v1.6 Workshop Analytics and Evidence Explorer | 7 | 7 | 54/54 | Shipped |
| v1.7 Runtime and Backend Boundary Stabilization | 6 | 6 | 32/32 | Shipped |
| v1.8 Production Boundary Hardening | 6 | 8 | 38/38 | Shipped |
| v1.9 Backend and Runtime Ownership Split | 7 | 7 | 28/28 | Shipped |
| v1.10 Service Boundary Completion and Go Read-Model Decision | 6 | 6 | 29/29 | Shipped |
| v1.11 Remaining Web Read Boundary Burn-Down and Live Go Readiness Evidence | 6 | 6 | 30/30 | Shipped |

## Latest Milestone Outcomes

- v1.11 moved Workshop test-summary and analytics-compare reads behind `@cowards/service`.
- Migrated Workshop read files are strict import-gated.
- Broad web report-only direct persistence debt dropped from 30 to 29.
- Live Go readiness is now required evidence-only validation: required topology passes with Go live and fails without Go.
- Production web traffic remains on the TypeScript service path; Go writes and runtime/non-JS promotion remain deferred.

## Previous Milestone Outcomes

- v1.10 moved account Strategy Revision list reads and Workshop analytics/Evidence Explorer reads behind `@cowards/service`.
- Migrated web read surfaces are strict import-gated.
- Broad web report-only direct persistence debt dropped from 34 to 30.
- Go gained exactly one additional read-model route: public `GET /public/strategies/{strategyId}`.
- Go remains read-only and fixture-backed; production web traffic still uses the TypeScript service path.
- Runtime isolation remains evidence-only; Python and other non-JS runtimes remain experimental and non-counted.

## Next Todos

- Start `$gsd-new-milestone` for v1.12 Go Backend Promotion Readiness and Cutover Plan.

## Blockers/Concerns

None active. Note: `pnpm preflight -- --skip-redis --skip-web` applied missing local migrations but its development MatchSet smoke returned `idle`; replay smoke passed after migrations.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| backend | 29 remaining broad web report-only direct persistence offenses not selected in v1.11 | Deferred | v1.11 scope |
| backend | Go mutation endpoints, auth/session mutation, ladder writes, orchestration, persistence writes, job claiming, migrations, and Match execution | Deferred | v1.11 scope |
| backend | Production web routing to Go | Deferred | v1.11 scope |
| replay | Full replay projection, owner-debug replay migration, and private Chronicle assembly | Deferred | v1.11 research |
| workshop | Workshop source retrieval, source save, validation, test launch, analytics rerun, profile save, export, and runtime flows | Deferred | v1.11 scope |
| runtime | Production hostile-code sandbox promotion | Deferred | v1.11 scope |
| runtime | Counted non-JS MatchSets, ladders, or gauntlets by default | Deferred | v1.11 scope |
| product | Public language picker implying support parity | Deferred | v1.11 scope |
| ops | Kubernetes, service mesh, cloud deployment, or production observability stack | Deferred | v1.11 scope |

## Session Continuity

Last session: 2026-05-23T05:05:00.000Z
Stopped at: v1.11 archived
Resume file: .planning/MILESTONES.md
