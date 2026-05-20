---
gsd_state_version: 1.0
milestone: none
milestone_name: Planning next milestone
status: planning_next
last_updated: "2026-05-20T11:10:00.000-04:00"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16  
**Status:** v1.3 Competition Trust Beta shipped; no active milestone

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Start the next milestone with fresh requirements
**Completed milestone:** v1.3 Competition Trust Beta
**Archived roadmap:** .planning/milestones/v1.3-ROADMAP.md
**Archived requirements:** .planning/milestones/v1.3-REQUIREMENTS.md

## Current Position

Phase: none active
Plan: none active
Status: v1.3 phases 19-24 implemented, reviewed, validated, verified, audited, archived, and tagged
Last activity: 2026-05-20 — Archived v1.3 roadmap, requirements, audit, and phase directories; prepared for the next milestone.

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
| v1.3 Competition Trust Beta | 6 | 6 | 51/51 | Shipped |

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
- The v1.3 local demo ladder is available at `/ladder/v13-demo` while the web dev server is running.
- Final v1.3 demo rerun completed 96/96 jobs with 13,162 MOVE events, 0 immediate-reversal blocks, and the sample replay `match:match-set:trial:trial-season:v13-demo:0:0:10` lasting into contraction.
- Phase 19-24 artifacts are archived under `.planning/milestones/v1.3-phases/`.

## Deferred Items

Items acknowledged and deferred after v1.3 milestone completion on 2026-05-20:

| Category | Item | Status |
| --- | --- | --- |
| product | Email verification, password reset, OAuth, organizations, and account recovery | Deferred |
| product | Durable all-time ratings, ranked prize ladders, and public tournaments | Deferred |
| runtime | Production-grade container, microVM, or WASM/WASI sandbox | Deferred |
| product-learning | Continued Starter Strategy balance tuning for weaker mobility/outlast doctrines | Deferred |

## Next Command

Run `$gsd-new-milestone` to define fresh requirements and roadmap for the next milestone.

---
*Last updated: 2026-05-20 after v1.3 milestone completion*
