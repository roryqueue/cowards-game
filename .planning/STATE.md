---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: v1.2 Competitive Alpha
status: planning
last_updated: "2026-05-19T00:00:00.000-04:00"
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16  
**Status:** v1.2 Competitive Alpha planning started

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-19)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** v1.2 Competitive Alpha
**Completed milestone:** v1.1 Trustworthy Simulation Beta
**Archived roadmap:** .planning/milestones/v1.1-ROADMAP.md
**Archived requirements:** .planning/milestones/v1.1-REQUIREMENTS.md

## Current Position

Phase: Phase 14 - Competitive Ownership and Sessions
Plan: Not started
Status: Ready for `$gsd-discuss-phase 14` or `$gsd-plan-phase 14`
Last activity: 2026-05-19 — Defined v1.2 Competitive Alpha requirements and roadmap.

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
| v1.2 Competitive Alpha | 5 | 0 | 0/33 planned | Planning |

## Accumulated Context

- v1.0 established the complete author -> execute -> replay loop.
- v1.1 hardened trust in that loop: engine-generated legal replay fixtures, strict Chronicle grammar, runtime isolation boundaries, doctrine debugging UX, and reliable Docker/no-Docker/service-backed verification.
- Phase 13 closed the v1.1 audit gap by authorizing persisted owner-debug replay requests against local Workshop Match participants.
- Public replay output remains privacy-safe by default and does not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, or private runtime details.
- v1.2 brings minimal username/password ownership into scope so competitive submissions no longer depend on `player:workshop-local`.
- v1.2 starts competition as unranked or seeded exhibition MatchSets; ranked ladders remain out of scope until scoring, abuse, replay evidence, and privacy rules have been proven.
- v1.2 intentionally allows one user to enter multiple distinct Strategy Revisions into the same exhibition MatchSet for self-play testing; one Strategy per user is deferred to ranked or more formal competition.

## Deferred Items

Items acknowledged and deferred after v1.2 milestone definition on 2026-05-19:

| Category | Item | Status |
| --- | --- | --- |
| product | Email verification, password reset, OAuth, organizations, and account recovery | Deferred |
| product | Ranked ladders, durable ratings, and public tournaments | Deferred |
| runtime | Production-grade container, microVM, or WASM/WASI sandbox | Deferred |

## Next Command

Run `$gsd-discuss-phase 14` to clarify the competitive ownership/session approach, or `$gsd-plan-phase 14` to plan directly.

---
*Last updated: 2026-05-19 after v1.2 milestone definition*
