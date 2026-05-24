---
gsd_state_version: 1.0
milestone: v1.15
milestone_name: Go Backend Ownership Completion
status: discussing
stopped_at: Phase 97 context gathered; continuing sequential discuss-phase for v1.15
last_updated: "2026-05-24T00:00:00.000-04:00"
last_activity: 2026-05-24
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 7
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.15 phase discussion in progress

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-24)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** v1.15 Go Backend Ownership Completion.
**Latest shipped milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract
**Active milestone:** v1.15 Go Backend Ownership Completion
**Requirements:** .planning/REQUIREMENTS.md
**Roadmap:** .planning/ROADMAP.md

## Current Position

Phase: 97 complete for discussion; next Phase 98
Plan: -
Status: Gathering phase contexts sequentially
Last activity: 2026-05-24 - Phase 97 context captured for Go job lifecycle ownership, parity, failure, and rollback decisions.

Progress: [----------] 0%

## Workflow Settings

- Mode: YOLO
- Granularity: Standard
- Execution: Sequential boundary foundation first, then parallel where safe
- Git tracking: Yes
- Research before planning: Yes
- Plan check: Yes
- Verifier: Yes
- Model profile: Balanced

## Current Milestone Summary

v1.15 goal:

- Make Go the owner of normal backend orchestration, persistence-facing API behavior, Match lifecycle coordination, Chronicle persistence, MatchSet scoring completion, and public evidence delivery.
- Keep TypeScript as frontend, parity oracle where needed, and isolated JS/TS Strategy runtime worker/service behind `strategy-runtime-abi-v1.14`.
- Move normal job claiming/completion, Match state transitions, Chronicle persistence, scoring completion, and selected public evidence delivery to Go-owned contracts.
- Ensure web normal backend workflows call Go-owned contracts rather than direct persistence/service internals except explicit test/parity/rollback/runtime surfaces.
- Preserve schema validation, hostile-code isolation, deterministic engine boundaries, replay/public-output privacy, owner-source privacy, and immutable Strategy Revision/Match eligibility.
- Add local topology evidence for web frontend -> Go backend -> TypeScript runtime worker/service -> Go persistence/public evidence with no silent TypeScript backend fallback.

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
| v1.8 Production Boundary Hardening | 6 | 8 | 38/38 | Shipped |
| v1.9 Backend and Runtime Ownership Split | 7 | 7 | 28/28 | Shipped |
| v1.10 Service Boundary Completion and Go Read-Model Decision | 6 | 6 | 29/29 | Shipped |
| v1.11 Remaining Web Read Boundary Burn-Down and Live Go Readiness Evidence | 6 | 6 | 30/30 | Shipped |
| v1.12 Go Backend Promotion Readiness and Cutover Plan | 6 | 6 | 36/36 | Shipped |
| v1.13 Go Backend Ownership Cutover | 7 | 7 | 42/44 complete, 2 deferred | Shipped |
| v1.14 Generic Strategy Artifact and Runtime Boundary Contract | 7 | 7 | 48/48 complete | Shipped |
| v1.15 Go Backend Ownership Completion | 7 | 0/7 | 0/48 | Planning |

## Latest Milestone Outcomes

- v1.14 added generic Strategy Artifact and Revision schemas for source-bearing artifacts, source-safe summaries, runtime metadata, validation, lineage, and immutable match eligibility.
- Generated `strategy-artifact-manifest-v1.14` from TypeScript-owned Starter, Advanced, and template registries with checksum gates and Go data-only parsing.
- Promoted `strategy-runtime-abi-v1.14` and routed JS runtime adapter execution through an explicit ABI bridge.
- Added Go-owned Starter/Advanced fork routes that consume generated artifacts as data, preserve source hash/runtime/validation/tags/lineage, and fail closed without TypeScript fallback when selected.
- Centralized public-output privacy checks in `@cowards/spec` and extended replay realism validation before rendering, including canonical start validation for canonical arenas.
- Boundary monitors pass with `strict_offenses=0 report_only_offenses=29`.

## Next Todos

- Continue sequential discussion with Phase 98.
- Phase 96 and Phase 97 contexts are ready for downstream research/planning.

## Blockers/Concerns

- The installed `gsd-sdk` CLI does not expose the `query` subcommands referenced by the workflow, so v1.15 state/project updates were applied directly.
- Go orchestration must not execute Strategy code; the TypeScript runtime worker/service remains the hostile-code execution boundary for this milestone.
- Go and TypeScript DB-owning workers must not claim or complete the same normal queue concurrently during cutover.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| backend | 29 broad web report-only direct persistence offenses not yet migrated | Active baseline | v1.15 start |
| replay | Full owner-debug replay projection migration | Deferred | v1.15 scope |
| workshop | Workshop validation, test launch, analytics rerun, profile save, export, and runtime flows | Deferred | v1.15 scope |
| runtime | Production hostile-code sandbox promotion | Deferred | v1.15 scope |
| runtime | Final TypeScript runtime retirement | Deferred | v1.15 scope |
| runtime | Counted non-JS MatchSets, ladders, or gauntlets by default | Deferred | v1.15 scope |
| ops | Go-owned migrations/schema ownership | Deferred | v1.15 scope |
| ops | Kubernetes, service mesh, cloud deployment, or production observability stack | Deferred | v1.15 scope |

## Session Continuity

Last session: 2026-05-24T00:00:00.000-04:00
Stopped at: Phase 97 context gathered; continuing sequential discuss-phase
Resume file: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md
