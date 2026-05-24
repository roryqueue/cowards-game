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

## Current State

No active milestone is open. Start the next cycle with `$gsd-new-milestone`, which will create a fresh `.planning/REQUIREMENTS.md`.

## Latest Shipped Milestone: v1.16 Runtime Isolation and TypeScript Backend Retirement

**Decision:** `promote-no-typescript-backend-except-frontend-and-isolated-js-ts-runtime-service`
**Archives:** `.planning/milestones/v1.16-ROADMAP.md`, `.planning/milestones/v1.16-REQUIREMENTS.md`, `.planning/milestones/v1.16-phases/`
**Audit:** `.planning/milestones/v1.16-MILESTONE-AUDIT.md`

v1.16 finishes the TypeScript backend retirement step: normal product topology is now `web frontend -> Go backend -> isolated JS/TS Strategy runtime service`. TypeScript remains supported for JS/TS Strategy execution only inside the broker-ready Strategy Execution Service / Runtime Broker boundary, and retained TypeScript surfaces are explicitly labeled frontend, runtime-only, parity-only, rollback-only, fixture/test-only, quarantined, or deferred.
