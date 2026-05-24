---
gsd_state_version: 1.0
milestone: v1.16
milestone_name: Runtime Isolation and TypeScript Backend Retirement
status: planning
stopped_at: Phase 107 discussion complete; ready for Phase 108 discussion
last_updated: "2026-05-24T17:45:00.000Z"
last_activity: 2026-05-24 - Milestone v1.16 started
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 7
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.16 milestone planning

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-24)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Phase 108 - No-TypeScript-Backend Topology and Monitor Gate.
**Latest shipped milestone:** v1.15 Go Backend Ownership Completion
**Active milestone:** v1.16 Runtime Isolation and TypeScript Backend Retirement
**Requirements:** .planning/REQUIREMENTS.md
**Roadmap:** .planning/ROADMAP.md

## Current Position

Phase: 108 - No-TypeScript-Backend Topology and Monitor Gate
Plan: Not started
Status: Discussing phase context
Last activity: 2026-05-24 - Phase 107 discussion captured deferred surface labeling and privacy preservation decisions

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

v1.16 goal:

- Finish TypeScript backend retirement by making TypeScript's remaining role explicit and narrow: frontend plus an isolated JS/TS Strategy runtime service only.
- Treat v1.15 Go ownership behavior as the backend baseline for normal orchestration, persistence-facing API behavior, Match lifecycle, Chronicle persistence handoff, MatchSet scoring/status refresh, selected exhibition creation, public MatchSet summary, public replay metadata, and selected public replay evidence.
- Preserve JS/TS Strategy execution support only through the isolated runtime service and broker-ready Strategy Execution Service / Runtime Broker public runtime ABI; do not execute Strategy code in web/API or Go processes.
- Delete, quarantine, or explicitly relabel remaining TypeScript service/backend paths, Next.js API backend routes, direct persistence imports, `@cowards/service` fallbacks, worker/job lifecycle paths, and backend ownership switches that are no longer normal after v1.15.
- Add no-TypeScript-backend topology and monitor gates proving the normal product topology is web frontend -> Go backend -> isolated JS/TS Strategy runtime service, with no silent fallback to retired TypeScript backend paths.
- Preserve schema validation, deterministic engine boundaries, immutable Strategy Revision/Match eligibility, replay/public-output privacy, owner-source privacy, hostile-code isolation, rollback clarity, and representative page-load smoke.

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
| v1.15 Go Backend Ownership Completion | 7 | 7/7 | 48/48 | Shipped |

## Latest Milestone Outcomes

- v1.15 made Go the normal owner for job lifecycle contracts, Match completion, Chronicle persistence handoff, MatchSet scoring/status refresh, selected exhibition creation, public MatchSet summary, public replay metadata, and selected public replay evidence.
- Added `runtime-execution-service-v1.15` so Go orchestration invokes the TypeScript JS/TS Strategy runtime only through the explicit v1.14 ABI boundary; Go/web/API still do not execute Strategy code.
- Added strict v1.15 topology and boundary monitor gates covering live web -> Go -> runtime-service health, Go public evidence, no silent TypeScript fallback, rollback order, TypeScript surface labels, route manifest drift, runtime ABI drift, and public-output leaks.
- Browser replay realism passed 14/14 desktop/mobile checks, including visible board bounds and nonblank canvas rendering.
- Final DB-backed Go integration passed against temporary local Postgres and later against OrbStack Docker Postgres, including the Go orchestration runner path.
- OrbStack Docker retest also passed Compose preflight, container sandbox evaluation, strict topology, and boundary monitors after fixing container adapter stdin and output-limit IPC handling.
- Boundary monitors pass with `strict_offenses=0 report_only_offenses=29`.

## Next Todos

- Run `$gsd-discuss-phase 108` to clarify no-TypeScript-backend topology and monitor gates.
- Run `$gsd-plan-phase 103` after milestone discussion sequencing completes or when ready to plan Phase 103.

## Blockers/Concerns

- The installed `gsd-sdk query ...` interface is not available locally; continue using legacy GSD tools or direct planning-file inspection when workflows reference unavailable commands.
- The TypeScript runtime service can remain the JS/TS Strategy execution boundary, but the v1.16 contract should be broker-ready under the Strategy Execution Service / Runtime Broker abstraction and it must not become a normal backend, claim jobs, write persistence, score MatchSets, serve public evidence, or provide fallback behavior.
- WASM/WASI/component-model is a long-term candidate path for some languages, not a v1.16 promotion; Node `node:wasi` must not be treated as an untrusted-code sandbox.
- Go and TypeScript DB-owning workers must not claim or complete the same normal queue concurrently during rollback.
- `pnpm boundary:monitors` must stay synchronized with Go route manifests, fixtures, runtime contracts, topology artifacts, and surface labels.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| replay | Full owner-debug replay projection migration | Deferred unless selected | v1.16 start |
| workshop | Workshop validation, test launch, analytics rerun, profile save, export, and runtime flows | Deferred unless selected | v1.16 start |
| ladder | Broader ladder scheduling/mutation migration | Deferred unless selected | v1.16 start |
| governance | Admin/governance mutation migration | Deferred unless selected | v1.16 start |
| runtime | Production hostile-code sandbox promotion | Deferred | v1.16 start |
| runtime | Final JS/TS runtime service replacement | Deferred | v1.16 start |
| runtime | Counted non-JS MatchSets, ladders, or gauntlets by default | Deferred | v1.16 start |
| ops | Go-owned migrations/schema ownership | Deferred | v1.16 start |
| ops | Kubernetes, service mesh, cloud deployment, or production observability stack | Deferred | v1.16 start |

## Session Continuity

Last session: 2026-05-24T16:30:00.000-04:00
Stopped at: v1.16 milestone initialized; Phase 103 is ready for discussion/planning.
Resume file: .planning/STATE.md

## Operator Next Steps

- Start Phase 103 with /gsd-discuss-phase 103 or /gsd-plan-phase 103.
