---
gsd_state_version: 1.0
milestone: v1.18
milestone_name: Runtime Isolation and Multi-Language Exhibition Beta
status: shipped
stopped_at: milestone archived and tagged
last_updated: "2026-05-25T00:00:00.000-04:00"
last_activity: 2026-05-25 - Shipped v1.18 runtime isolation and multi-language exhibition beta
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 7
  completed_plans: 7
  percent: 100
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.18 shipped and archived

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Latest shipped milestone:** v1.18 Runtime Isolation and Multi-Language Exhibition Beta
**Active milestone:** None
**Requirements:** Archived at `.planning/milestones/v1.18-REQUIREMENTS.md`
**Roadmap:** `.planning/ROADMAP.md`

## Current Position

Phase: 123 Final Evidence, Promotion Decision, and Archive Gate
Plan: 123-01
Status: Complete
Last activity: 2026-05-25 - v1.18 archive, audit, proof, and tag complete

## Latest Milestone Result

v1.18 strengthened runtime isolation evidence and promoted Python only to non-counted exhibition beta. A signed-in local proof created JS/TS and Python account-owned Strategy Revisions, ran a non-counted exhibition through Go -> runtime-service -> runtime implementation, and opened public-safe replay evidence with zero runtime violations.

## Active Milestone Goal

No active milestone. Start the next milestone with `$gsd-new-milestone`.

## Active Constraints

- Normal topology remains `web frontend -> Go backend -> isolated runtime service(s)`.
- JS/TS Strategy support remains intact through the existing isolated runtime service.
- Python is non-counted exhibition beta only, while remaining runtime-only, non-ranked, and non-counted.
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

Run `$gsd-new-milestone` to start the next milestone. `.planning/REQUIREMENTS.md` is intentionally absent after v1.18 closure.
