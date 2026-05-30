---
gsd_state_version: 1.0
milestone: v1.25
milestone_name: Match Execution Interface Freeze and Parallel App/Execution Contract
status: planning
stopped_at: null
last_updated: "2026-05-30T16:45:00.000-04:00"
last_activity: 2026-05-30 - Milestone v1.25 started
progress:
  total_phases: 9
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.25 planning active

## Project Reference

See: .planning/PROJECT.md

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Latest shipped milestone:** v1.24 Runtime Abuse Lab and ABI Future-Proofing
**Active milestone:** v1.25 Match Execution Interface Freeze and Parallel App/Execution Contract
**Requirements:** .planning/REQUIREMENTS.md
**Roadmap:** .planning/ROADMAP.md

## Current Position

Phase: Not started (defining requirements)
Plan: -
Status: Defining requirements
Last activity: 2026-05-30 - Milestone v1.25 started

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

Start Phase 174 with `$gsd-discuss-phase 174`.
