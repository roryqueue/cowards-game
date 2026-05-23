---
gsd_state_version: 1.0
milestone: none
milestone_name: None
status: ready_for_next_milestone
stopped_at: v1.9 milestone archived and tagged; ready to select the next milestone
last_updated: "2026-05-23T02:10:00.000Z"
last_activity: 2026-05-23
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** Ready for next milestone

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-23)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** No active milestone; ready to choose the next ownership or product move
**Latest shipped milestone:** v1.9 Backend and Runtime Ownership Split
**Requirements:** Active requirements cleared; v1.9 requirements archived in .planning/milestones/v1.9-REQUIREMENTS.md
**Roadmap:** .planning/ROADMAP.md

## Current Position

Phase: None
Plan: None
Status: v1.9 archived; ready for `$gsd-new-milestone`
Last activity: 2026-05-23 — Archived v1.9 milestone

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
- [Phase 55]: Local topology is now a diagnostic harness, not a process supervisor: `pnpm topology:check` validates static scripts, fixtures, TypeScript service health, runtime adapter metadata, optional live web/Go smoke, required-boundary failures, and public-safe diagnostics. — Keeps ownership boundaries loud without rewriting orchestration.
- [Phase 55]: Env-provided topology URLs are optional smoke targets unless `--require-web` or `--require-go` is passed. — Plain static checks stay repeatable on developer machines with leftover environment variables.
- [Phase 55]: Topology diagnostics redact token-like URL data and require owner analytics to reject unauthenticated requests with HTTP 401/403. — Prevents local failure output from becoming a private-data channel.
- [Phase 56]: `pnpm boundary:monitors` now composes contract generation/lint, web import boundaries, Go parity, sandbox artifact checks, topology diagnostics, and cross-boundary drift monitors. — v1.8 has one local command for boundary release confidence.
- [Phase 56]: Broad web direct persistence/runtime debt is baseline-gated with normalized import fingerprints. — Known debt stays visible, but new forbidden imports fail even on existing lines.
- [Phase 56]: Runtime adapter/product semantics and Go route manifests now drift-check against canonical spec metadata without executing Strategy code or expanding Go ownership. — Keeps monitors useful without moving the production boundary prematurely.
- [v1.9 roadmap]: Selected service-backed web read/user surfaces as the production ownership move. — Public player profile, owner account reads, and public ladder service read are active; Go read-model expansion remains future follow-up.
- [v1.9 roadmap]: Created Phases 57-63 with 28/28 active requirements mapped. — Future Go read-model requirements are tracked as BACKX items because the public ladder service read branch was selected.
- [Phase 57]: Captured v1.9 ownership matrix and baseline boundary evidence. — `pnpm boundary:imports` passed with strict_offenses=0/report_only_offenses=41, and `pnpm boundary:monitors` passed.
- [Phase 58]: Public player profile reads now flow through `@cowards/service` and the player page is strict import-gated. — Report-only broad web offenses dropped from 41 to 39.
- [Phase 59]: Account session snapshot and account Strategy Revision list reads now flow through `@cowards/service`. — Session-derived owner reads omit Strategy source and report-only broad web offenses dropped from 39 to 35.
- [Phase 60]: Public ladder season page reads now flow through `@cowards/service` and the ladder page is strict import-gated. — The public OpenAPI artifact now includes `/public/ladders/{seasonId}`, Go route manifest remains unchanged at 4 read-only routes, and report-only broad web offenses dropped from 35 to 34.
- [Phase 61]: Runtime isolation promotion-readiness is now artifacted and monitor-gated without promoting any runtime candidate. — `pnpm sandbox:evaluate:container` and `--require-runtime-container` fail loudly when live container evidence is missing, topology reports runtime isolation readiness, and boundary monitors enforce the evidence-only/no-fallback posture.
- [Phase 62]: Non-JS promotion criteria are now spec-owned and monitor-gated. — Python remains experimental, disabled for normal play, non-counted, and fail-closed for counted exhibition/ladder gates; no public language picker was added.
- [Phase 63]: v1.9 verification passed across full package tests, typecheck, boundary monitors, and browser replay smoke. — The gate caught and fixed a stale replay smoke assertion so public `ACTION_EMITTED` timeline coverage follows the accessible event instead of a fixed sequence; strict import offenses remain 0 and report-only web debt is baseline-gated at 34.
- [v1.9 audit]: Milestone audit passed after code review and audit-fix. — The review found and the audit-fix resolved one High runtime blocker: container subprocess is now evidence-only and non-counted until promotion criteria are explicitly satisfied.

### Next Todos

- Start the next milestone with `$gsd-new-milestone`.
- Recommended next direction: continue service-backed web read/user migration, shrink remaining broad web persistence debt, and prepare Go read-model expansion only after explicit route scope and TypeScript-service-backed parity fixtures.

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

Last session: 2026-05-23T02:10:00.000Z
Stopped at: v1.9 milestone archived and ready for next milestone selection
Resume file: None
