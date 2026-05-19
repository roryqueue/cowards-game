---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: v1.3 Competition Trust Beta
status: planning
last_updated: "2026-05-19T00:00:00.000-04:00"
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16  
**Status:** v1.3 Competition Trust Beta roadmap ready

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-19)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Phase 19: Starter Strategy Library
**Completed milestone:** v1.2 Competitive Alpha
**Archived roadmap:** .planning/milestones/v1.2-ROADMAP.md
**Archived requirements:** .planning/milestones/v1.2-REQUIREMENTS.md

## Current Position

Phase: 19 - Starter Strategy Library
Plan: —
Status: v1.3 phase contexts gathered; ready to plan Phase 19
Last activity: 2026-05-19 — Captured Phase 24 context in .planning/phases/24-production-runtime-boundary-spike/24-CONTEXT.md

## Workflow Settings

- Mode: YOLO
- Granularity: Standard
- Execution: Parallel
- Git tracking: Yes
- Research before planning: Yes
- Plan check: Yes
- Verifier: Yes
- Model profile: Balanced

## Completed Milestones

| Milestone | Phases | Plans | Requirements | Status |
| --- | ---: | ---: | ---: | --- |
| v1.0 MVP | 7 | 33 | 80/80 | Shipped |
| v1.1 Trustworthy Simulation Beta | 6 | 29 | 34/34 | Shipped |
| v1.2 Competitive Alpha | 5 | 10 | 33/33 | Shipped |

## Accumulated Context

- v1.0 established the complete author -> execute -> replay loop.
- v1.1 hardened trust in that loop: engine-generated legal replay fixtures, strict Chronicle grammar, runtime isolation boundaries, doctrine debugging UX, and reliable Docker/no-Docker/service-backed verification.
- Phase 13 closed the v1.1 audit gap by authorizing persisted owner-debug replay requests against local Workshop Match participants.
- Public replay output remains privacy-safe by default and does not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, or private runtime details.
- v1.2 added minimal username/password ownership so competitive submissions no longer depend on `player:workshop-local`.
- v1.2 starts competition as unranked exhibition MatchSets with public scoring, replay evidence, provenance, and privacy-safe publication.
- v1.2 intentionally allows one user to enter multiple distinct Strategy Revisions into the same exhibition MatchSet for self-play testing; one Strategy per user is deferred to ranked or more formal competition.
- Phase 14-18 artifacts are archived under `.planning/milestones/v1.2-phases/`.

## Deferred Items

Items acknowledged and deferred after v1.2 milestone completion on 2026-05-19:

| Category | Item | Status |
| --- | --- | --- |
| product | Email verification, password reset, OAuth, organizations, and account recovery | Deferred |
| product | Durable all-time ratings, ranked prize ladders, and public tournaments | Deferred |
| runtime | Production-grade container, microVM, or WASM/WASI sandbox | Deferred |

## Next Command

Run `$gsd-plan-phase 19` to plan the Starter Strategy Library phase.

---
*Last updated: 2026-05-19 after completing v1.3 phase discussions*
