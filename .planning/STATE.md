---
gsd_state_version: 1.0
milestone: v1.19
milestone_name: Runtime Isolation Readiness and Exhibition Beta Trust
status: planning
stopped_at: ready to plan phase 124
last_updated: "2026-05-25T00:00:00.000-04:00"
last_activity: 2026-05-25 - Started v1.19 and created requirements and roadmap
progress:
  total_phases: 8
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.19 requirements and roadmap initialized

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Latest shipped milestone:** v1.18 Runtime Isolation and Multi-Language Exhibition Beta
**Active milestone:** v1.19 Runtime Isolation Readiness and Exhibition Beta Trust
**Requirements:** `.planning/REQUIREMENTS.md`
**Roadmap:** `.planning/ROADMAP.md`

## Current Position

Phase: 124 Isolation Readiness Baseline and Candidate Contract
Plan: —
Status: Ready to plan Phase 124
Last activity: 2026-05-25 - v1.19 requirements and roadmap created

## Latest Milestone Result

v1.18 strengthened runtime isolation evidence and promoted Python only to non-counted exhibition beta. A signed-in local proof created JS/TS and Python account-owned Strategy Revisions, ran a non-counted exhibition through Go -> runtime-service -> runtime implementation, and opened public-safe replay evidence with zero runtime violations.

## Active Milestone Goal

Strengthen runtime isolation readiness evidence while making Python non-counted exhibition beta clearer, safer, and more trustworthy for signed-in users.

## Active Constraints

- Normal topology remains `web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s)`.
- JS/TS Strategy support remains intact through the existing isolated runtime service and remains the counted Strategy path.
- Python is non-counted exhibition beta only, while remaining runtime-only, non-ranked, and non-counted.
- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in the web/API process or Go backend, and Node `vm` is not used as a hostile-code security boundary.
- Strategy Revisions are immutable once submitted for Match or MatchSet play.
- Public replay and MatchSet output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, package paths, or private runtime internals by default.
- Runtime isolation evidence must distinguish readiness evidence from production sandbox certification.
- Required candidate evidence and no-fallback drills must fail loudly on skipped candidates, stale artifacts, stopped runtime services, unavailable Python runtime, or silent substitution.
- `pnpm boundary:monitors` must stay synchronized with Go route manifests, runtime ABI artifacts, runtime registry artifacts, topology evidence, surface labels, fixture gates, runtime isolation candidate evidence, and ownership changes.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| runtime | Production hostile-code sandbox promotion | Deferred | v1.19 |
| runtime | Python ranked/ladder counted eligibility | Deferred | v1.19 |
| runtime | Arbitrary PyPI/package install support | Deferred | v1.19 |
| runtime | Broad WASM/WASI/component-model promotion | Deferred | v1.19 |
| product | Broad multi-language product support beyond Python exhibition beta | Deferred | v1.19 |
| ops | Cloud deployment, Kubernetes, service mesh, or production observability stack | Deferred | v1.19 |

## Operator Next Steps

Run `$gsd-discuss-phase 124` to clarify the isolation readiness baseline and candidate contract, or `$gsd-plan-phase 124` to plan it directly.
