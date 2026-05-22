---
gsd_state_version: 1.0
milestone: v1.7
milestone_name: Runtime and Backend Boundary Stabilization
status: complete
last_updated: "2026-05-22T12:55:00.000-04:00"
last_activity: 2026-05-22 — Milestone v1.7 completed, archived, audited, and verified
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 6
  completed_plans: 6
  percent: 100
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.7 Runtime and Backend Boundary Stabilization shipped and archived

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-22)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Ready for v1.8 milestone definition
**Latest shipped milestone:** v1.7 Runtime and Backend Boundary Stabilization
**Requirements:** v1.7 archived with 32/32 complete in .planning/milestones/v1.7-REQUIREMENTS.md
**Roadmap:** .planning/ROADMAP.md

## Current Position

Phase: 45-50 - v1.7 Runtime and Backend Boundary Stabilization
Plan: 6/6 implemented
Status: Complete and archived
Last activity: 2026-05-22 — v1.7 implementation, validation, audit, and archive completed

## Workflow Settings

- Mode: YOLO
- Granularity: Standard
- Execution: Sequential core contract first, then parallel where safe
- Git tracking: Yes
- Research before planning: Prefer current codebase/replay evidence first, then focused research when new product or runtime territory appears
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
| v1.4 Cycle-Interleaved Rules Correction | 5 | 5 | 33/33 | Shipped |
| v1.5 Strategy Workshop Power Tools and Advanced Strategy Library | 8 | 8 | 53/53 | Shipped |
| v1.6 Workshop Analytics and Evidence Explorer | 7 | 7 | 54/54 | Shipped |
| v1.7 Runtime and Backend Boundary Stabilization | 6 | 6 | 32/32 | Shipped |

## Accumulated Context

- v1.0 established the complete author -> execute -> replay loop.
- v1.1 hardened trust in that loop: engine-generated legal replay fixtures, strict Chronicle grammar, runtime isolation boundaries, doctrine debugging UX, and reliable Docker/no-Docker/service-backed verification.
- v1.2 added minimal username/password ownership and unranked public exhibition MatchSets with public scoring, replay evidence, provenance, and privacy-safe publication.
- v1.3 added Starter Library, resettable trial ladder seasons, deterministic scheduling, public profiles/cards, focused governance, and a containerized subprocess runtime boundary spike.
- v1.4 shipped the corrected Cycle-interleaved scheduler, Cycle-boundary Backstab, `chronicle-v1.4`, refreshed starters, a completed `/ladder/v1-4-demo`, and replay speeds up to 32x.
- v1.5 shipped Workshop power tools, a distinct Advanced Strategy Library, five example MatchSets, a completed `/ladder/v1-5-demo`, replay-reviewed Strategy retuning, and public-safe evidence pages.
- v1.6 shipped saved gauntlet analytics, compatibility-aware reruns/comparisons, Workshop heatmaps, Evidence Explorer drilldowns, replay deep links, owner-safe JSON/CSV exports, and a local analytics demo.
- v1.7 shipped frozen TypeScript service/runtime boundary contracts, Next service-client migration, golden parity fixtures, runtime adapter metadata, an experimental Python ABI spike, and a minimal read-only Go backend spike.
- Public replay output remains privacy-safe by default and does not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, owner debug, or private runtime details.
- Strategy code must continue to run only behind worker/runtime adapter boundaries, never in web/API processes.

## Deferred Items

Items acknowledged and deferred after v1.3 milestone completion on 2026-05-20:

| Category | Item | Status |
| --- | --- | --- |
| product | Email verification, password reset, OAuth, organizations, and account recovery | Deferred |
| product | Durable all-time ratings, ranked prize ladders, and public tournaments | Deferred |
| runtime | Production-grade container, microVM, or WASM/WASI sandbox | Deferred |
| product-learning | Continued Starter Strategy balance tuning for weaker mobility/outlast doctrines | Deferred |

Items acknowledged and deferred after v1.5 milestone completion on 2026-05-21:

| Category | Item | Status |
| --- | --- | --- |
| workshop | Named saved gauntlet profiles and exportable owner-only gauntlet JSON | Deferred |
| analytics | Rich public matchup heatmaps, evidence bands, and replay deep links | Deferred |
| runtime | Production-grade hostile-code isolation beyond the current worker/subprocess adapter boundary | Deferred |
| competition | Official public tournament operations and durable ratings | Deferred |

Items acknowledged and deferred after v1.6 milestone completion on 2026-05-22:

| Category | Item | Status |
| --- | --- | --- |
| replay-analysis | Full replay timeline search, event filters, overlays, and side-by-side replay comparison | Deferred |
| competition | Official scheduled tournament operations, governance/moderation flows, and durable ratings | Deferred |
| runtime | Production-grade hostile-code isolation beyond the current worker/subprocess adapter boundary | Deferred |
| authoring | Strategy snippets, lint rules, tactical helpers, and deeper no-advance/trapped-Soldier diagnostics | Deferred |

Items acknowledged and deferred after v1.7 milestone completion on 2026-05-22:

| Category | Item | Status |
| --- | --- | --- |
| backend | Full Go orchestration, mutation endpoints, job claiming, and persistent service ownership transfer | Deferred |
| runtime | Production-grade hostile-code isolation and resource enforcement beyond the prototype subprocess ABI | Deferred |
| runtime | Production UX, docs, and support policy for non-JS Strategy languages | Deferred |
| contracts | OpenAPI/client generation and broader Next route migration through the typed service layer | Deferred |
| deployment | Multi-process local topology and deployment checks for web, worker, service, runtime, and Go spike together | Deferred |

## Next Command

Run `$gsd-new-milestone v1.8` to define the next milestone from the archived v1.7 boundary foundation.

---
*Last updated: 2026-05-22 after v1.7 milestone completion and archive*
