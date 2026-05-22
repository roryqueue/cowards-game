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

## Current Position

**Status:** Ready for next milestone planning
**Latest shipped milestone:** v1.8 Production Boundary Hardening
**Latest audit:** `.planning/milestones/v1.8-MILESTONE-AUDIT.md`
**Latest phase archives:** `.planning/milestones/v1.8-phases/`

## Recommended Next Milestone

**v1.9 Backend and Runtime Ownership Split**

Use v1.8 contracts, parity fixtures, local topology, and monitors to make one deliberate ownership move instead of several at once.

Recommended first decision: choose whether v1.9 starts with Go read-model expansion, production runtime isolation, or mutation boundary design. The strongest default is to reduce direct web persistence debt through service-backed slices first, then use the cleaner boundary to decide what moves to Go or an isolated runtime process.

## Next Command

`$gsd-new-milestone`

---
*Last updated: 2026-05-22 after archiving v1.8*
