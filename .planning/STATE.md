---
gsd_state_version: 1.0
milestone: v1.20
milestone_name: Runtime Sandbox Candidate and Exhibition Reliability Proof
status: planning
stopped_at: defining requirements and roadmap
last_updated: "2026-05-25T00:00:00.000-04:00"
last_activity: 2026-05-25 - Started v1.20 milestone with Docker/container candidate lane and exhibition reliability focus
progress:
  total_phases: 8
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.20 planning initialized

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Latest shipped milestone:** v1.19 Runtime Isolation Readiness and Exhibition Beta Trust
**Active milestone:** v1.20 Runtime Sandbox Candidate and Exhibition Reliability Proof
**Requirements:** `.planning/REQUIREMENTS.md`
**Roadmap:** `.planning/ROADMAP.md`

## Current Position

Phase: Not started (Phase 132 next)
Plan: -
Status: Defining requirements and roadmap
Last activity: 2026-05-25 - Milestone v1.20 started

## Current Milestone Goal

v1.20 combines two next frontiers from v1.19: make one stronger runtime isolation candidate executable and honestly testable, and make Python non-counted exhibition beta reliability, latency, timeout behavior, degraded-state UX, and proof evidence realistic enough for repeated signed-in use.

The selected primary stronger candidate lane is Docker/container subprocess because Docker is locally available and the repo already has a `container-subprocess` adapter. gVisor/runsc remains a strict fail-loud lane unless `runsc` becomes genuinely available and executable in the local environment.

## Baseline From v1.19

v1.19 completed, archived, and tagged `v1.19`. It added monitor-readable readiness lanes, a unified hostile probe taxonomy, explicit no-fallback drills, compact Python exhibition beta labels, safe tactical Python samples, public-safe MatchSet/replay Evidence panels, a signed-in proof with one JS/TS and two Python revisions, mixed and Python-vs-Python non-counted exhibition proof, and explicit promotion decisions.

The v1.19 proof also found and fixed two reliability/privacy gaps: runtime-service HTTP timeout was too low for Python subprocess exhibition Matches, and public evidence copy exposed internal private-field names.

## Active Constraints

- Normal topology remains `web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s)`.
- JS/TS Strategy support remains intact through the existing isolated runtime service and remains the counted Strategy path.
- Python is non-counted exhibition beta only, while remaining runtime-only, non-ranked, and non-counted.
- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in the web/API process or Go backend, and Node `vm` is not used as a hostile-code security boundary.
- Strategy Revisions are immutable once submitted for Match or MatchSet play.
- Public replay and MatchSet output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, package paths, or private runtime internals by default.
- Runtime isolation evidence must distinguish readiness evidence from production sandbox certification.
- Required candidate evidence and no-fallback drills must fail loudly on skipped candidates, stale artifacts, stopped runtime services, unavailable Python runtime, unavailable container/runtime candidate, unavailable runsc candidate, or silent substitution.
- Python must not own backend routes, persistence, job lifecycle, Match completion, scoring, public evidence, retry policy, or fallback behavior.
- No arbitrary PyPI/package installs are allowed.
- No unbounded local stress tests are allowed; latency and reliability proof must use bounded, repeatable workloads.
- `pnpm boundary:monitors` must stay synchronized with Go route manifests, runtime ABI artifacts, runtime registry artifacts, topology evidence, surface labels, fixture gates, runtime isolation candidate evidence, and ownership changes.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| runtime | Production hostile-code sandbox promotion | Deferred | v1.20 |
| runtime | Python ranked/ladder counted eligibility | Deferred | v1.20 |
| runtime | Arbitrary PyPI/package install support | Deferred | v1.20 |
| runtime | gVisor/runsc promotion without local executable proof | Deferred | v1.20 |
| runtime | Broad WASM/WASI/component-model promotion | Deferred | v1.20 |
| product | Broad multi-language product support beyond Python exhibition beta | Deferred | v1.20 |
| ops | Cloud deployment, Kubernetes, service mesh, or production observability stack | Deferred | v1.20 |

## Operator Next Steps

Start Phase 132 with `$gsd-discuss-phase 132` or `$gsd-plan-phase 132`.
