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

## Current Milestone

No active milestone. v1.10 has shipped and the project is ready for v1.11 selection.

## Latest Shipped Summary

v1.10 completed the next service-boundary ownership move after v1.9. Account Strategy Revision list reads and Workshop analytics/Evidence Explorer reads now flow through `@cowards/service`, selected migrated web surfaces are strict import-gated, broad web report-only direct persistence debt dropped from 34 to 30, and Go gained exactly one additional read-model route: `GET /public/strategies/{strategyId}` backed by TypeScript-service-generated parity fixtures.

Go writes, jobs, migrations, Match orchestration, Strategy execution, production web routing to Go, production sandbox promotion, and counted non-JS play remain out of scope.

## Next Up

Select v1.11. Recommended direction: continue service-boundary debt reduction for remaining public/owner-safe web read surfaces, while deciding whether the next useful step is another service-backed read slice, a live Go-readiness evidence lane, or deeper runtime isolation proof.

---
_Last updated: 2026-05-23 after v1.10 milestone archive_
