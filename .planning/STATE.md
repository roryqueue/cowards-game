---
gsd_state_version: 1.0
milestone: v1.23
milestone_name: WASM/WASI Rust/Zig Exhibition Beta and ABI Readiness
status: complete
stopped_at: v1.23 shipped, archived, committed, and tagged
last_updated: "2026-05-25T21:00:00.000-04:00"
last_activity: 2026-05-25 - Milestone v1.23 completed with Rust/Zig non-counted exhibition beta promotion
progress:
  total_phases: 8
  completed_phases: 8
  total_plans: 8
  completed_plans: 8
  percent: 100
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.23 shipped

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Latest shipped milestone:** v1.23 WASM/WASI Rust/Zig Exhibition Beta and ABI Readiness
**Active milestone:** none
**Requirements:** archived at `.planning/milestones/v1.23-REQUIREMENTS.md`
**Roadmap:** `.planning/ROADMAP.md`
**Research:** `.planning/research/SUMMARY.md` and `.planning/research/v1.23-SUMMARY.md`

## Current Position

Phase: 163 complete
Plan: 8/8 complete
Status: v1.23 archived and ready for next milestone initialization
Last activity: 2026-05-25 - Milestone v1.23 shipped

## Active Milestone Goal

v1.23 promoted Rust and Zig from non-counted exhibition alpha to non-counted exhibition beta only after real signed-in multi-compiler proof, runtime hardening evidence, Zig ergonomics, ABI evidence, privacy, replay plausibility, no-fallback behavior, and JS/TS regression safety passed.

## Active Constraints

- "Beta" means non-counted exhibition beta only.
- JS/TS remains the counted Strategy path.
- Python remains non-counted exhibition beta.
- Rust and Zig are non-counted exhibition beta only after v1.23 gates passed.
- No Rust, Zig, Python, WASM/WASI, or TypeScript counted/ranked/ladder/gauntlet promotion in this milestone.
- No production sandbox certification claim.
- Normal topology remains `web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s)`.
- Go owns orchestration, persistence-facing backend behavior, Match lifecycle, scoring, public evidence, retry policy, and promotion decisions.
- Runtime-service owns hostile Strategy execution only through schema-validated ABI envelopes and registered runtime implementations.
- Strategy code does not execute in web/API/Go.
- Match execution uses immutable Strategy artifacts and schema-validated ABI envelopes.
- Public replay and MatchSet output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw diagnostics, host paths, env values, tokens, DB DSNs, package paths, or private runtime internals by default.
- Preview 1 stdin/stdout JSON remains the active execution ABI unless a later explicit promotion decision changes it.
- Direct exports and component model/WIT are proof spikes only unless evidence supports future migration.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| runtime | Rust ranked/ladder/counted eligibility | Deferred | v1.23 |
| runtime | Zig ranked/ladder/counted eligibility | Deferred | v1.23 |
| runtime | WASM/WASI production sandbox certification | Deferred | v1.23 |
| runtime | Component-model Strategy ABI promotion | Deferred | v1.23 |
| runtime | Direct-export Strategy ABI promotion | Deferred | v1.23 |
| runtime | Arbitrary Cargo/Zig package install support | Deferred | v1.23 |
| product | Broad production multi-language marketplace | Deferred | v1.23 |

## Operator Next Steps

Start a fresh milestone with `$gsd-new-milestone`. Active `.planning/REQUIREMENTS.md` is intentionally absent after v1.23 closure.
