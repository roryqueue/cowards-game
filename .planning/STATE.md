---
gsd_state_version: 1.0
milestone: v1.24
milestone_name: Runtime Abuse Lab and ABI Future-Proofing
status: discussed
stopped_at: Phase 164-173 context gathered
last_updated: "2026-05-30T00:00:00.000-04:00"
last_activity: 2026-05-30 - Phase 164-173 context gathered
progress:
  total_phases: 10
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.24 planning

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Latest shipped milestone:** v1.23 WASM/WASI Rust/Zig Exhibition Beta and ABI Readiness
**Active milestone:** v1.24 Runtime Abuse Lab and ABI Future-Proofing
**Requirements:** `.planning/REQUIREMENTS.md`
**Roadmap:** `.planning/ROADMAP.md`
**Research:** `.planning/research/SUMMARY.md` and `.planning/research/v1.24-SUMMARY.md`

## Current Position

Phase: 164-173 context gathered
Plan: -
Status: Ready for phase planning
Last activity: 2026-05-30 - Phase discussion context gathered for all v1.24 phases

## Active Milestone Goal

v1.24 builds a runtime abuse lab and production-sandbox readiness matrix across JS/TS, Python, Rust, Zig, and WASM/WASI lanes, while spiking direct exports and Component Model/WIT as future ABI evidence only.

## Active Constraints

- No production sandbox certification unless evidence genuinely supports it and an explicit final decision says so.
- JS/TS remains the counted Strategy path.
- Python remains non-counted exhibition beta.
- Rust and Zig remain non-counted exhibition beta only.
- No Rust, Zig, Python, WASM/WASI, or TypeScript counted/ranked/ladder/gauntlet promotion.
- Normal topology remains `web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s)`.
- Go owns orchestration, persistence-facing backend behavior, Match lifecycle, scoring, public evidence, retry policy, and promotion decisions.
- Runtime-service owns hostile Strategy execution only through schema-validated ABI envelopes and registered runtime implementations.
- Strategy code does not execute in web/API/Go.
- Match execution uses immutable Strategy artifacts and schema-validated ABI envelopes.
- Public replay and MatchSet output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw diagnostics, host paths, env values, tokens, DB DSNs, package paths, or private runtime internals by default.
- Preview 1 stdin/stdout JSON remains the active WASM/WASI execution ABI unless a later explicit promotion decision changes it.
- Direct exports and Component Model/WIT are proof spikes only unless evidence supports future migration.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| runtime | Rust ranked/ladder/counted eligibility | Deferred | v1.23 |
| runtime | Zig ranked/ladder/counted eligibility | Deferred | v1.23 |
| runtime | Python ranked/ladder/counted eligibility | Deferred | v1.24 |
| runtime | WASM/WASI production sandbox certification | Deferred | v1.23 |
| runtime | Component Model/WIT Strategy ABI promotion | Deferred | v1.23 |
| runtime | Direct-export Strategy ABI promotion | Deferred | v1.23 |
| runtime | Arbitrary Cargo/Zig/PyPI/package install support | Deferred | v1.24 |
| product | Broad production multi-language marketplace | Deferred | v1.23 |

## Operator Next Steps

Plan Phase 164 with `$gsd-plan-phase 164`, then continue sequentially through Phase 173.
