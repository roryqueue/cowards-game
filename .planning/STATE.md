---
gsd_state_version: 1.0
milestone: v1.21
milestone_name: WASM/WASI Multi-Language Runtime Candidate and Rust Exhibition Alpha
status: planning
stopped_at: milestone planning initialized
last_updated: "2026-05-25T00:00:00.000-04:00"
last_activity: 2026-05-25 - Milestone v1.21 started
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

**Initialized:** 2026-05-16
**Status:** v1.21 planning

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Latest shipped milestone:** v1.20 Runtime Sandbox Candidate and Exhibition Reliability Proof
**Active milestone:** v1.21 WASM/WASI Multi-Language Runtime Candidate and Rust Exhibition Alpha
**Requirements:** being defined at `.planning/REQUIREMENTS.md`
**Roadmap:** being defined at `.planning/ROADMAP.md`

## Current Position

Phase: Not started (defining requirements)
Plan: -
Status: Defining requirements
Last activity: 2026-05-25 - Milestone v1.21 started

## Active Milestone Goal

v1.21 makes WASM/WASI the next serious immutable multi-language Strategy runtime candidate. The milestone targets Rust as the first net-new compiled language end to end, using a WASI Preview 1 stdin/stdout JSON envelope for the first executable ABI and treating Zig as a gated stretch target if local tooling and architecture evidence pass loudly.

## Baseline From v1.20

v1.20 completed, archived, and tagged `v1.20`. It added strict executable Docker/container subprocess evidence, hostile probe/no-fallback parity, runtime reliability budgets, public-safe degraded-state evidence panels, a three-cycle signed-in reliability proof, and a final promotion decision that keeps Python non-counted and runtime isolation readiness-only.

The v1.20 proof found and fixed a practical Go job lease bug: the previous lease was shorter than the runtime-service HTTP budget, so long Python-vs-Python Matches could degrade after lease expiry.

## Active Constraints

- Normal topology remains `web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s)`.
- JS/TS Strategy support remains intact through the existing isolated runtime service and remains the counted Strategy path.
- Python remains non-counted exhibition beta only.
- Rust/WASM may become non-counted exhibition alpha/beta only if evidence passes; Rust, Zig, and WASM/WASI are not ranked, ladder, counted, gauntlet, or broad production multi-language support in v1.21.
- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in the web/API process or Go backend, and Node `vm` or Node `node:wasi` must not be treated as a hostile-code security boundary.
- Match execution must use immutable Strategy artifacts. Rust and optional Zig Matches must execute immutable WASM artifacts, not mutable source.
- Strategy Revisions are immutable once submitted for Match or MatchSet play.
- Public replay and MatchSet output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, package paths, artifact internals, or private runtime internals by default.
- Runtime service owns hostile Strategy execution only through schema-validated ABI envelopes and registered runtime implementations.
- Go remains owner of orchestration, persistence-facing behavior, Match lifecycle, scoring, public evidence, retry policy, and promotion decisions.
- WASM/WASI runtime evidence must distinguish executable candidate proof from production sandbox certification.
- Zig must fail loudly when local toolchain, compile, runtime, ABI, or proof evidence is unavailable; no silent substitution with Rust or JS/TS.
- No arbitrary package installs are allowed as a product feature.
- No unbounded local stress tests are allowed; proof must use bounded, repeatable workloads.
- `pnpm boundary:monitors` must stay synchronized with runtime ABI artifacts, runtime registry artifacts, topology evidence, language metadata, artifact evidence, privacy checks, and ownership changes.

## Deferred Items

| Category | Item | Status | Deferred At |
| --- | --- | --- | --- |
| runtime | Rust ranked/ladder/counted eligibility | Deferred | v1.21 |
| runtime | Zig ranked/ladder/counted eligibility | Deferred | v1.21 |
| runtime | WASM/WASI production sandbox certification | Deferred | v1.21 |
| runtime | Component-model Strategy ABI promotion | Deferred | v1.21 |
| runtime | Direct-export Strategy ABI promotion | Deferred | v1.21 |
| runtime | Arbitrary Cargo/Zig package install support | Deferred | v1.21 |
| product | Broad production multi-language marketplace | Deferred | v1.21 |
| ops | Cloud deployment, Kubernetes, service mesh, or production observability stack | Deferred | v1.21 |

## Operator Next Steps

Finish `$gsd-new-milestone` by creating active requirements and a roadmap. Then start the first v1.21 phase with `$gsd-discuss-phase 140` or `$gsd-plan-phase 140`.
