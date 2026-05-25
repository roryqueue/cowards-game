---
gsd_state_version: 1.0
milestone: v1.17
milestone_name: Python Strategy Runtime Pilot and Broker Contract Hardening
status: planning
stopped_at: defining requirements and roadmap
last_updated: "2026-05-24T00:00:00.000-04:00"
last_activity: 2026-05-24 - Milestone v1.17 started
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 7
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** Planning v1.17

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Latest shipped milestone:** v1.16 Runtime Isolation and TypeScript Backend Retirement
**Active milestone:** v1.17 Python Strategy Runtime Pilot and Broker Contract Hardening
**Requirements:** `.planning/REQUIREMENTS.md`
**Roadmap:** `.planning/ROADMAP.md`

## Current Position

Phase: 110 - Broker Registry Baseline and Contract Hardening
Plan: -
Status: Defining requirements and preparing Phase 110
Last activity: 2026-05-24 - Milestone v1.17 started

## Active Milestone Goal

Make Python an experimental end-to-end Strategy language through the Strategy Execution Service / Runtime Broker contract while preserving the v1.16 backend-retirement boundary.

## Active Constraints

- Normal topology remains `web frontend -> Go backend -> isolated runtime service(s)`.
- JS/TS Strategy support remains intact through the existing isolated runtime service.
- Python is experimental, runtime-only, non-counted, and non-ranked in v1.17.
- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in the web/API process or Go backend, and Node `vm` is not used as a hostile-code security boundary.
- Strategy Revisions are immutable once submitted for Match or MatchSet play.
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, package paths, or private runtime internals by default.
- `pnpm boundary:monitors` must stay synchronized with Go route manifests, runtime ABI artifacts, runtime registry artifacts, topology evidence, surface labels, fixture gates, and ownership changes.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| runtime | Production hostile-code sandbox promotion | Deferred | v1.17 |
| runtime | Python ranked/ladder counted eligibility | Deferred | v1.17 |
| runtime | Arbitrary PyPI/package install support | Deferred | v1.17 |
| runtime | WASM/WASI/component-model promotion | Deferred | v1.17 |
| product | Broad multi-language product support | Deferred | v1.17 |
| ops | Cloud deployment, Kubernetes, service mesh, or production observability stack | Deferred | v1.17 |

## Operator Next Steps

Start Phase 110 with `$gsd-discuss-phase 110` or `$gsd-plan-phase 110`.
