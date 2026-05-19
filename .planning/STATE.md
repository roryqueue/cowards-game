---
gsd_state_version: 1.0
milestone: none
milestone_name: Planning next milestone
status: milestone_archived
last_updated: "2026-05-18T20:15:00.000-04:00"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16  
**Status:** v1.1 archived; ready for next milestone definition

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Planning next milestone
**Completed milestone:** v1.1 Trustworthy Simulation Beta
**Archived roadmap:** .planning/milestones/v1.1-ROADMAP.md
**Archived requirements:** .planning/milestones/v1.1-REQUIREMENTS.md

## Current Position

Phase: none
Plan: none
Status: Waiting for `$gsd-new-milestone` to define the next milestone's requirements and roadmap.
Last activity: 2026-05-18 — Archived v1.1 Trustworthy Simulation Beta.

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

## Accumulated Context

- v1.0 established the complete author -> execute -> replay loop.
- v1.1 hardened trust in that loop: engine-generated legal replay fixtures, strict Chronicle grammar, runtime isolation boundaries, doctrine debugging UX, and reliable Docker/no-Docker/service-backed verification.
- Phase 13 closed the v1.1 audit gap by authorizing persisted owner-debug replay requests against local Workshop Match participants.
- Public replay output remains privacy-safe by default and does not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, or private runtime details.
- Production authentication/session ownership remains deferred; local Workshop owner trust is intentionally scoped to `player:workshop-local`.
- Ranked ladders remain out of scope until replay dispute handling, sandbox abuse resistance, deterministic compatibility, privacy leakage, stale revisions, and scoring fairness are designed.

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-05-18:

| Category | Item | Status |
| --- | --- | --- |
| product | Production authentication/session ownership | Deferred |
| product | Ranked ladders and public competitive surfaces | Deferred |
| runtime | Production-grade container, microVM, or WASM/WASI sandbox | Deferred |

## Next Command

Run `$gsd-new-milestone` to define fresh requirements and roadmap phases.

---
*Last updated: 2026-05-18 after v1.1 milestone archive*
