---
gsd_state_version: 1.0
milestone: v1.14
milestone_name: Generic Strategy Artifact and Runtime Boundary Contract
status: planning
stopped_at: Phase 93 context gathered
last_updated: "2026-05-23T23:41:26.000Z"
last_activity: 2026-05-23
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.14 planning complete

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-23)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Phase 93 - JS Runtime Adapter Conformance.
**Latest shipped milestone:** v1.13 Go Backend Ownership Cutover
**Active milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract
**Requirements:** .planning/REQUIREMENTS.md
**Roadmap:** .planning/ROADMAP.md

## Current Position

Phase: 93 - JS Runtime Adapter Conformance
Plan: Context gathered
Status: Ready for Phase 94 discussion and Phase 93 planning
Last activity: 2026-05-23 - Phase 93 context gathered

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

v1.14 goal:

- Define generic Strategy Artifact and Revision contracts for user-submitted revisions, server-native templates, Starter and Advanced libraries, future language variants, runtime metadata, source hashes, validation, lineage, and immutable Match eligibility.
- Define `strategy-runtime-abi-v1.14` as the strict public interface between deterministic server/native orchestration and hostile Strategy runtime code.
- Keep Strategy execution out of web/API/Go processes and preserve TypeScript worker/runtime ownership unless a later milestone explicitly promotes a different boundary.
- Generate parity-safe Strategy artifact manifests so Go can consume Starter/Advanced/template source metadata without hand-maintained copies or source execution.
- Promote Go-owned Starter/Advanced forks only after manifest parity, schema validation, lineage preservation, no-fallback evidence, and privacy checks pass.
- Centralize public-output privacy rules and add repeatable replay board realism evidence for Match/replay creation changes.

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

## Latest Milestone Outcomes

- v1.13 added live PostgreSQL-backed Go route providers and selected Go backend ownership.
- Public Strategy, player, ladder, MatchSet summary, and replay metadata reads are Go-owned when the Go backend owner switch is selected.
- Auth/session read and mutation, account revision list/source/create/save, and exhibition creation are Go-owned when selected.
- TypeScript worker/runtime ownership remains explicit; Go-created exhibitions hand off to the existing worker.
- Starter/Advanced forks remain TypeScript-owned until v1.14 creates parity-safe Strategy artifact manifests.
- Boundary monitors pass with `strict_offenses=0 report_only_offenses=29`.

## Next Todos

- Start Phase 89 with `$gsd-discuss-phase 89` or `$gsd-plan-phase 89`.

## Blockers/Concerns

- The installed `gsd-sdk` CLI does not expose the `query` subcommands referenced by the workflow, so v1.14 state/project updates were applied directly.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| backend | 29 remaining broad web report-only direct persistence offenses not selected in v1.11 | Deferred | v1.11 scope |
| backend | Job claiming/completion, Match execution, Chronicle generation, and worker runtime ownership | Deferred | v1.13 scope |
| backend | Go-owned migrations/schema ownership | Deferred | v1.13 scope |
| backend | Runtime/orchestration ownership beyond exhibition creation handoff | Deferred | v1.13 scope |
| backend | Go-owned Starter/Advanced fork routes pending library source manifest access | Active in v1.14 | v1.13 audit |
| replay | Full replay projection, owner-debug replay migration, and private Chronicle assembly | Deferred | v1.11 research |
| workshop | Workshop validation, test launch, analytics rerun, profile save, export, and runtime flows | Deferred | v1.13 scope |
| runtime | Production hostile-code sandbox promotion | Deferred | v1.11 scope |
| runtime | Counted non-JS MatchSets, ladders, or gauntlets by default | Deferred | v1.11 scope |
| product | Public language picker implying support parity | Deferred | v1.11 scope |
| ops | Kubernetes, service mesh, cloud deployment, or production observability stack | Deferred | v1.11 scope |

## Session Continuity

Last session: 2026-05-23T23:41:26.000Z
Stopped at: Phase 93 context gathered
Resume file: .planning/phases/093-js-runtime-adapter-conformance/093-CONTEXT.md
