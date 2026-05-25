---
gsd_state_version: 1.0
milestone: v1.18
milestone_name: Runtime Isolation and Multi-Language Exhibition Beta
status: planning
stopped_at: phase contexts materialized
last_updated: "2026-05-25T00:00:00.000-04:00"
last_activity: 2026-05-25 - Materialized v1.18 requirements, roadmap, and phase contexts
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.18 planning

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Latest shipped milestone:** v1.17 Python Strategy Runtime Pilot and Broker Contract Hardening
**Active milestone:** v1.18 Runtime Isolation and Multi-Language Exhibition Beta
**Requirements:** `.planning/REQUIREMENTS.md`
**Roadmap:** `.planning/ROADMAP.md`

## Current Position

Phase: 117 Isolation Baseline and Threat Model
Plan: -
Status: Context gathered; ready for planning
Last activity: 2026-05-25 - v1.18 planning artifacts materialized

## Latest Milestone Result

Python is now an experimental end-to-end Strategy language through the Strategy Execution Service / Runtime Broker contract while preserving the v1.16 backend-retirement boundary. Python remains runtime-only and non-counted.

## Active Milestone Goal

Strengthen the runtime isolation boundary and prove it with a signed-in non-counted multi-language exhibition beta while preserving v1.17's broker/runtime-only contract.

## Active Constraints

- Normal topology remains `web frontend -> Go backend -> isolated runtime service(s)`.
- JS/TS Strategy support remains intact through the existing isolated runtime service.
- Python is moving toward non-counted exhibition beta only, while remaining runtime-only, non-ranked, and non-counted in v1.18 planning.
- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in the web/API process or Go backend, and Node `vm` is not used as a hostile-code security boundary.
- Strategy Revisions are immutable once submitted for Match or MatchSet play.
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, package paths, or private runtime internals by default.
- `pnpm boundary:monitors` must stay synchronized with Go route manifests, runtime ABI artifacts, runtime registry artifacts, topology evidence, surface labels, fixture gates, and ownership changes.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| runtime | Production hostile-code sandbox promotion | Deferred | v1.18 |
| runtime | Python ranked/ladder counted eligibility | Deferred | v1.18 |
| runtime | Arbitrary PyPI/package install support | Deferred | v1.18 |
| runtime | WASM/WASI/component-model promotion | Deferred | v1.18 |
| product | Broad multi-language product support | Deferred | v1.18 |
| ops | Cloud deployment, Kubernetes, service mesh, or production observability stack | Deferred | v1.18 |

## Operator Next Steps

Run `$gsd-plan-phase 117` to create an executable plan for Isolation Baseline and Threat Model.
