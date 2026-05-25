---
gsd_state_version: 1.0
milestone: v1.22
milestone_name: WASM/WASI Multi-Compiler Alpha and Runtime Hardening
status: complete
stopped_at: v1.22 complete; archive, commit, and tag ready
last_updated: "2026-05-25T00:00:00.000-04:00"
last_activity: 2026-05-25 - v1.22 Zig proof, WASM/WASI hardening evidence, ABI decision, promotion decision, and audit gates completed
progress:
  total_phases: 8
  completed_phases: 8
  total_plans: 8
  completed_plans: 8
  percent: 100
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.22 complete

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Latest shipped milestone:** v1.22 WASM/WASI Multi-Compiler Alpha and Runtime Hardening
**Active milestone:** None. v1.22 is archived and next milestone requirements should be created fresh.
**Requirements:** `.planning/milestones/v1.22-REQUIREMENTS.md` (archived)
**Roadmap:** `.planning/ROADMAP.md` and `.planning/milestones/v1.22-ROADMAP.md`

## Current Position

Phase: 155 - Promotion Decision, Audit, Archive, and Tag
Plan: Implemented through audit gates
Status: v1.22 implementation and proof complete; archive/tag pass in progress
Last activity: 2026-05-25 - Zig no-std compile/runtime proof, v1.22 WASM/WASI hardening probes, Workshop/account Zig alpha wiring, ABI decision, lint/typecheck/runtime tests passed

## Active Milestone Goal

v1.22 makes WASM/WASI a more serious multi-compiler Strategy runtime candidate. Zig is available only as non-counted exhibition alpha when local proof passes; Rust remains non-counted exhibition alpha; WASM/WASI hardening evidence remains candidate-readiness only.

## Active Constraints

- Normal topology remains `web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s)`.
- JS/TS remains the counted Strategy path.
- Python remains non-counted exhibition beta only.
- Rust and Zig WASM/WASI remain non-counted exhibition alpha only.
- No Rust, Zig, Python, or TypeScript backend ownership creep.
- Strategy code does not execute in web/API/Go.
- Match execution uses immutable Strategy artifacts and schema-validated ABI envelopes.
- Public replay and MatchSet output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw diagnostics, host paths, env values, tokens, DB DSNs, or private runtime internals by default.
- WASM/WASI runtime evidence is not production sandbox certification.
- Zig must fail loudly when toolchain, compile, runtime, ABI, or artifact proof is unavailable.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| runtime | Rust ranked/ladder/counted eligibility | Deferred | v1.22 |
| runtime | Zig ranked/ladder/counted eligibility | Deferred | v1.22 |
| runtime | WASM/WASI production sandbox certification | Deferred | v1.22 |
| runtime | Component-model Strategy ABI promotion | Deferred | v1.22 |
| runtime | Direct-export Strategy ABI promotion | Deferred | v1.22 |
| runtime | Ergonomic Zig std-backed Strategy bindings | Deferred | v1.22 |
| runtime | Arbitrary Cargo/Zig package install support | Deferred | v1.22 |
| product | Broad production multi-language marketplace | Deferred | v1.22 |

## Operator Next Steps

Commit and tag `v1.22`. Relevant pages after starting the local app: `/workshop`, `/exhibitions/new`, public MatchSet result pages, and replay pages.
