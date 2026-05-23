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

## Current Milestone

No active milestone. Start the next milestone with `$gsd-new-milestone`.

## Latest Completion

**v1.9 Backend and Runtime Ownership Split** shipped after auditing and fixing the runtime ownership blocker found during code review. The milestone moved selected web read/user surfaces through `@cowards/service`, widened strict import enforcement, kept Go read-only, kept runtime isolation evidence-only, and kept Python/non-JS runtimes experimental and non-counted.

## Next Candidate Directions

- Continue service-backed web read migration and shrink the remaining report-only direct persistence debt.
- Prepare the first explicit Go read-model expansion with generated TypeScript-service-backed parity fixtures, GET-only routing, topology diagnosis, and rollback scope.
- Deepen production runtime isolation evidence in a CI or production-equivalent container lane before any counted promotion.
- Improve replay/Workshop product surfaces on top of the now-steadier service/runtime boundaries.

---
*Last updated: 2026-05-23 after completing v1.9*
