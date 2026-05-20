---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: v1.4 Cycle-Interleaved Rules Correction
status: complete
last_updated: "2026-05-20T15:45:00.000-04:00"
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 5
  completed_plans: 5
  percent: 100
---

# State: Coward's Game

**Initialized:** 2026-05-16  
**Status:** v1.4 Cycle-Interleaved Rules Correction complete

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** v1.4 complete; ready to archive or ship
**Current milestone:** v1.4 Cycle-Interleaved Rules Correction
**Requirements:** .planning/REQUIREMENTS.md
**Roadmap:** .planning/ROADMAP.md

## Current Position

Phase: Milestone v1.4 complete
Plan: Complete
Status: All v1.4 phases completed, validated, verified, browser-checked, demo-regenerated, audit-fix clean, and replay speed polish documented.
Last activity: 2026-05-20 — Added configurable replay playback speeds with 2x default, verified the replay UI locally, and documented the milestone polish.

## Workflow Settings

- Mode: YOLO
- Granularity: Standard
- Execution: Sequential core contract first, then parallel where safe
- Git tracking: Yes
- Research before planning: Skipped for v1.4 because this is a correction to an internal source-of-truth rule, not a new domain feature
- Plan check: Yes
- Verifier: Yes
- Model profile: Balanced

## Completed Milestones

| Milestone | Phases | Plans | Requirements | Status |
| --- | ---: | ---: | ---: | --- |
| v1.0 MVP | 7 | 33 | 80/80 | Shipped |
| v1.1 Trustworthy Simulation Beta | 6 | 29 | 34/34 | Shipped |
| v1.2 Competitive Alpha | 5 | 10 | 33/33 | Shipped |
| v1.3 Competition Trust Beta | 6 | 6 | 51/51 | Shipped |

## Active Milestone

| Milestone | Phases | Plans | Requirements | Status |
| --- | ---: | ---: | ---: | --- |
| v1.4 Cycle-Interleaved Rules Correction | 5 | 5 | 33/33 complete | Complete |

## Accumulated Context

- v1.0 established the complete author -> execute -> replay loop.
- v1.1 hardened trust in that loop: engine-generated legal replay fixtures, strict Chronicle grammar, runtime isolation boundaries, doctrine debugging UX, and reliable Docker/no-Docker/service-backed verification.
- Phase 13 closed the v1.1 audit gap by authorizing persisted owner-debug replay requests against local Workshop Match participants.
- Public replay output remains privacy-safe by default and does not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, or private runtime details.
- v1.2 added minimal username/password ownership so competitive submissions no longer depend on `player:workshop-local`.
- v1.2 starts competition as unranked exhibition MatchSets with public scoring, replay evidence, provenance, and privacy-safe publication.
- v1.2 intentionally allows one user to enter multiple distinct Strategy Revisions into the same exhibition MatchSet for self-play testing; one Strategy per user is deferred to ranked or more formal competition.
- Phase 14-18 artifacts are archived under `.planning/milestones/v1.2-phases/`.
- v1.3 added Starter Library, resettable trial ladder seasons, deterministic scheduling, public profiles/cards, focused governance, and a containerized subprocess runtime boundary spike.
- Phase 19-24 artifacts are archived under `.planning/milestones/v1.3-phases/`.
- v1.4 exists because the intended core rule was miscommunicated: selected Soldiers should alternate by Cycle, not by whole Activation.
- v1.4 Backstab intent: check Backstab at the start and end of every Cycle using simultaneous all-board resolution.

## Deferred Items

Items acknowledged and deferred after v1.3 milestone completion on 2026-05-20:

| Category | Item | Status |
| --- | --- | --- |
| product | Email verification, password reset, OAuth, organizations, and account recovery | Deferred |
| product | Durable all-time ratings, ranked prize ladders, and public tournaments | Deferred |
| runtime | Production-grade container, microVM, or WASM/WASI sandbox | Deferred |
| product-learning | Continued Starter Strategy balance tuning for weaker mobility/outlast doctrines | Deferred |

## Next Command

Archive or ship Milestone v1.4.

---
*Last updated: 2026-05-20 after v1.4 replay speed polish*
