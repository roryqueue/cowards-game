---
gsd_state_version: 1.0
milestone: v1.8
milestone_name: Production Boundary Hardening
status: executing
stopped_at: Completed Phase 54
last_updated: "2026-05-22T22:14:00.000Z"
last_activity: 2026-05-22
progress:
  total_phases: 6
  completed_phases: 4
  total_plans: 6
  completed_plans: 6
  percent: 67
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** Phase 54 complete; ready for Phase 55 planning/execution

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-22)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Phase 55 - Cross-Process Local Deployment Harness
**Latest shipped milestone:** v1.7 Runtime and Backend Boundary Stabilization
**Requirements:** v1.8 requirements mapped 38/38 in .planning/REQUIREMENTS.md
**Roadmap:** .planning/ROADMAP.md

## Current Position

Phase: 55 of 56 (Cross-Process Local Deployment Harness)
Plan: Phase 54 complete; next is Phase 55
Status: Executing
Last activity: 2026-05-22

Progress: [███████░░░] 67%

## Workflow Settings

- Mode: YOLO
- Granularity: Standard
- Execution: Sequential boundary foundation first, then parallel where safe
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
| v1.4 Cycle-Interleaved Rules Correction | 5 | 5 | 33/33 | Shipped |
| v1.5 Strategy Workshop Power Tools and Advanced Strategy Library | 8 | 8 | 53/53 | Shipped |
| v1.6 Workshop Analytics and Evidence Explorer | 7 | 7 | 54/54 | Shipped |
| v1.7 Runtime and Backend Boundary Stabilization | 6 | 6 | 32/32 | Shipped |

## Accumulated Context

### Decisions

- v1.8 hardens operating boundaries without moving orchestration, backend writes, jobs, migrations, or Strategy execution out of the TypeScript-owned path.
- Go remains read-only and parity-focused against real fixtures or safe local data.
- Sandbox work is evaluative only; no candidate is promoted to production hostile-code isolation or counted-play eligibility by default.
- Non-JS Strategy support remains experimental and fail-closed for counted MatchSets, ladders, and gauntlets.
- Public replay, service, Go, topology, diagnostics, analytics, exports, and monitor outputs must omit private Strategy/runtime data by default.
- [Phase 51]: Kept SERVICE_API_ROUTES as the single route registry and enriched each entry with schema-backed metadata. — Phase 51 D-07/D-09 require @cowards/spec to remain authoritative.
- [Phase 51]: Generated service-api-v1.8 OpenAPI 3.1 JSON from Zod 4 schemas with deterministic key sorting. — Satisfies GEN-01 and GEN-03 without making generated artifacts canonical.
- [Phase 51]: Migrated public Strategy page and replay metadata reads through @cowards/service using canonical public DTO schemas. — Satisfies GEN-05/GEN-06 while keeping writes, orchestration, and Strategy execution TypeScript-owned.
- [Phase 51]: Enforced named migrated route/page import boundaries with broad apps/web/app direct-import debt kept report-only. — Satisfies GEN-07 and preserves D-11 until a later strict monitor phase.
- [Phase 51]: Restricted the committed OpenAPI artifact to public routes and public runtime metadata without runtime limits. — Keeps the public contract artifact free of private Strategy/runtime key strings.
- [Phase 52]: Generated committed Go parity fixtures by invoking the TypeScript service boundary over golden Match/Chronicle data and the deterministic Workshop analytics snapshot. — Avoids hand-written Go DTO examples drifting from canonical service output.
- [Phase 52]: Kept Go read-only while serving health, public MatchSet summaries, public replay metadata, and an owner-scoped analytics summary from validated fixtures. — TypeScript still owns writes, auth mutation, jobs, orchestration, persistence migrations, source retrieval, and Strategy execution.
- [Phase 52]: Owner analytics reads require a configured bearer token identity and check authorization before resource lookup. — Prevents caller-supplied owner ids and unauthenticated run-existence oracles.
- [Phase 52]: The Go fixture loader validates route allowlist, top-level DTO shape, canonical private-field denylist, generated fixture hashes, and embedded TypeScript reference hashes before serving override fixtures. — Makes fixture drift and self-blessed invalid overrides fail at startup.
- [Phase 53]: Sandbox work remains evaluation-only; worker-thread and host subprocess can be probed through `StrategyExecutionAdapter`, container subprocess is optional behind `COWARDS_RUN_CONTAINER_SANDBOX=1`, and Deno/WASI/gVisor/microVM stay tradeoff-only in v1.8. — No runtime candidate is promoted to production hostile-code isolation or counted eligibility.
- [Phase 53]: Hostile sandbox probes now require exact runtime-violation versus system-failure taxonomy and normalize successful adapter outputs through public Strategy/Soldier result schemas. — Prevents invalid Strategy outputs and system failures from being counted as equivalent evidence.
- [Phase 53]: Worker Strategy execution now blocks `console` in the injected Strategy scope and subprocess IPC carries output byte caps into the child harness. — Closes host-output and oversized-output drift found during the sandbox review.
- [Phase 54]: Runtime product semantics are now spec-owned: language/adapter labels, readiness, package policy, validation issue codes, docs/examples references, warnings, and counted eligibility come from `@cowards/spec`. — Prevents UI, persistence, and validation copy from drifting.
- [Phase 54]: Python remains experimental and not counted-play eligible; non-counted runtime metadata is a validation warning but a hard failure at exhibition and ladder counted-entry gates. — Preserves JS/TS defaults while making non-JS semantics visible.
- [Phase 54]: Account, exhibition, public Strategy card, and Workshop validation surfaces show compact runtime/eligibility labels or references without adding a public language picker. — Avoids implying support parity.

### Pending Todos

Phase 55 needs topology planning for web, TypeScript service path, worker/runtime adapter, Go read-only service, fixtures, health checks, smoke requests, and privacy-safe diagnostics.

### Blockers/Concerns

None active.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| backend | Go mutation endpoints, orchestration, persistence writes, job claiming, migrations, and Match execution | Deferred | v1.8 requirements |
| runtime | Production hostile-code sandbox promotion | Deferred | v1.8 requirements |
| runtime | Counted non-JS MatchSets, ladders, or gauntlets by default | Deferred | v1.8 requirements |
| product | Public language picker implying support parity | Deferred | v1.8 requirements |
| ops | Kubernetes, service mesh, cloud deployment, or production observability stack | Deferred | v1.8 requirements |

## Session Continuity

Last session: 2026-05-22T22:14:00.000Z
Stopped at: Completed Phase 54
Resume file: None
