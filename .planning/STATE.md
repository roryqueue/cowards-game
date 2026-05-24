---
gsd_state_version: 1.0
milestone: none
milestone_name: Between Milestones
status: shipped
stopped_at: v1.16 archived and tagged
last_updated: "2026-05-24T23:59:00.000Z"
last_activity: 2026-05-24 - v1.16 Runtime Isolation and TypeScript Backend Retirement shipped
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 100
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** Between milestones after v1.16 shipment

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Latest shipped milestone:** v1.16 Runtime Isolation and TypeScript Backend Retirement
**Active milestone:** None
**Requirements:** intentionally absent until the next `$gsd-new-milestone` creates fresh active requirements
**Roadmap:** `.planning/ROADMAP.md`

## Latest Milestone Outcomes

- v1.16 shipped the backend-retirement state: normal product topology is `web frontend -> Go backend -> isolated JS/TS Strategy runtime service`.
- Go owns normal backend orchestration, selected persistence-facing API behavior, Match lifecycle, Chronicle persistence handoff, MatchSet scoring/status completion, selected public evidence delivery, and no-fallback selected web/API contracts.
- TypeScript remains allowed as frontend, isolated JS/TS Strategy runtime service, runtime adapter support, parity oracle, rollback reference, fixture/test support, quarantined lifecycle support, or explicitly deferred surface only.
- The runtime boundary is named broker-ready as **Strategy Execution Service** / **Runtime Broker**, uses the public runtime ABI and schema-validated JSON envelopes, and keeps Strategy execution out of web/API/Go processes.
- Strategy Revision submission now has explicit compile/validate/package-at-submission guidance where practical; Match execution consumes immutable artifacts.
- WASM/WASI/component-model remain long-term candidate paths for future language support, not v1.16 promotions; Node `node:wasi` is not treated as an untrusted-code sandbox.
- Strict no-TypeScript-backend topology, boundary monitors, final TypeScript surface labels, public-output privacy scans, route/runtime drift checks, and representative page-smoke evidence all passed.

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
| v1.14 Generic Strategy Artifact and Runtime Boundary Contract | 7 | 7 | 48/48 | Shipped |
| v1.15 Go Backend Ownership Completion | 7 | 7 | 48/48 | Shipped |
| v1.16 Runtime Isolation and TypeScript Backend Retirement | 7 | 7 | 48/48 | Shipped |

## Current Constraints

- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in the web/API process or Go backend, and Node `vm` is not used as a hostile-code security boundary.
- Strategy Revisions are immutable once submitted for Match or MatchSet play.
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, or private runtime internals by default.
- `pnpm boundary:monitors` must stay synchronized with Go route manifests, runtime ABI artifacts, topology evidence, TypeScript surface labels, fixture gates, and ownership changes.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| runtime | True language-neutral Runtime Broker replacement | Deferred | v1.16 |
| runtime | Production hostile-code sandbox promotion | Deferred | v1.16 |
| runtime | Counted non-JS MatchSets, ladders, or gauntlets by default | Deferred | v1.16 |
| replay | Full owner-debug replay projection migration | Deferred | v1.16 |
| workshop | Workshop validation, test launch, analytics rerun, profile save, export, and runtime flows | Deferred | v1.16 |
| ladder | Broader ladder scheduling/mutation migration | Deferred | v1.16 |
| governance | Admin/governance mutation migration | Deferred | v1.16 |
| ops | Go-owned migrations/schema ownership | Deferred | v1.16 |
| ops | Kubernetes, service mesh, cloud deployment, or production observability stack | Deferred | v1.16 |

## Operator Next Steps

Start a fresh milestone with `$gsd-new-milestone`.
