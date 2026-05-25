---
gsd_state_version: 1.0
milestone: v1.17
milestone_name: Python Strategy Runtime Pilot and Broker Contract Hardening
status: archived
stopped_at: ready for next milestone
last_updated: "2026-05-24T21:30:00.000-04:00"
last_activity: 2026-05-24 - Archived v1.17 Python runtime pilot and broker hardening
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 7
  completed_plans: 7
  percent: 100
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.17 archived

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Latest shipped milestone:** v1.17 Python Strategy Runtime Pilot and Broker Contract Hardening
**Active milestone:** None
**Requirements:** none active; archived at `.planning/milestones/v1.17-REQUIREMENTS.md`
**Roadmap:** `.planning/ROADMAP.md`

## Current Position

Phase: -
Plan: -
Status: Ready for next milestone
Last activity: 2026-05-24 - v1.17 archived after audit and verification

## Latest Milestone Result

Python is now an experimental end-to-end Strategy language through the Strategy Execution Service / Runtime Broker contract while preserving the v1.16 backend-retirement boundary. Python remains runtime-only and non-counted.

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

Start the next milestone with `$gsd-new-milestone`; `.planning/REQUIREMENTS.md` is intentionally absent after v1.17 archive.
