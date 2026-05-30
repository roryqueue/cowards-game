---
gsd_state_version: 1.0
milestone: v1.25
milestone_name: Match Execution Interface Freeze and Parallel App/Execution Contract
status: discussion-complete
stopped_at: null
last_updated: "2026-05-30T17:10:00.000-04:00"
last_activity: 2026-05-30 - v1.25 phase discussions completed
progress:
  total_phases: 9
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.25 discussion complete; ready for phase planning

## Project Reference

See: .planning/PROJECT.md

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Latest shipped milestone:** v1.24 Runtime Abuse Lab and ABI Future-Proofing
**Active milestone:** v1.25 Match Execution Interface Freeze and Parallel App/Execution Contract
**Requirements:** .planning/REQUIREMENTS.md
**Roadmap:** .planning/ROADMAP.md

## Current Position

Phase: 174
Plan: -
Status: Phase contexts ready for planning
Last activity: 2026-05-30 - v1.25 phase discussions completed

## v1.25 Intent

Freeze app-facing Match execution lifecycle states, DTOs, public/private evidence surfaces, fixtures, adapters, and drift monitors so Match execution internals and result/replay/app UX can move in parallel without compromising deterministic engine boundaries, Go/runtime-service ownership, public-output privacy, or runtime eligibility claims.

## v1.24 Outcome

Readiness evidence only. No production sandbox certification. JS/TS remains counted. Python, Rust, and Zig remain non-counted exhibition beta. WASI Preview 1 stdin/stdout JSON remains active. Direct exports and Component Model/WIT remain proof spikes only.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| runtime | Stopped/unavailable runtime live drills for stronger sandbox claims | Deferred | v1.24 |
| runtime | Rust ranked/ladder/counted eligibility | Deferred | v1.23 |
| runtime | Zig ranked/ladder/counted eligibility | Deferred | v1.23 |
| runtime | Python ranked/ladder/counted eligibility | Deferred | v1.24 |
| runtime | WASM/WASI production sandbox certification | Deferred | v1.24 |
| runtime | Component Model/WIT Strategy ABI promotion | Deferred | v1.24 |
| runtime | Direct-export Strategy ABI promotion | Deferred | v1.24 |
| runtime | Arbitrary Cargo/Zig/PyPI/package install support | Deferred | v1.24 |

## Operator Next Steps

Start Phase 174 planning with `$gsd-plan-phase 174`. Phase discussion context is available for phases 174-182 under `.planning/phases/`.
