---
gsd_state_version: 1.0
milestone: v1.34
milestone_name: Workshop Provider Checker Parity
status: planning
last_updated: "2026-06-01T13:49:20Z"
last_activity: 2026-06-01
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game v1.34

## Current Position

Phase: 238 - Workshop Checker Path Inventory and Public Contract
Plan: Context gathered
Status: Phase 238 context captured; waiting for user approval to plan and execute
Last activity: 2026-06-01 - Captured Phase 238 Workshop checker inventory and contract decisions

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Bring Workshop Validate source checker behavior for TypeScript, Python, Rust, and Zig to provider-grade parity with submit/save/entry validation while preserving runtime-service/provider boundaries and public-safe diagnostics.

## Active Boundary Notes

- v1.34 starts from v1.33's shipped source-language artifact provenance for TypeScript/Python and immutable WASM/WASI Preview 1 artifact-backed Rust/Zig support.
- Go production Strategy runtime work and TinyGo production support are intentionally skipped.
- TinyGo remains spike-only and hidden from production Workshop, submit/save, entry, result, replay, and public evidence surfaces.
- Runtime-service / Runtime Broker / provider boundaries remain the hostile-code boundary.
- Strategy code must not execute in web/API/Go.
- TypeScript and Python artifact provenance is provenance evidence, not equivalent to WASM isolation or production sandbox certification.
- Rust and Zig remain immutable WASM/WASI Preview 1 artifact-backed lanes; no ABI migration is in scope.
- Public/default checker output must not expose Strategy source, raw diagnostics, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, or objective payloads.

## Resume Notes

- v1.33 shipped and is tagged as `v1.33`.
- v1.33 archives are in `.planning/milestones/v1.33-ROADMAP.md`, `.planning/milestones/v1.33-REQUIREMENTS.md`, and `.planning/milestones/v1.33-MILESTONE-AUDIT.md`.
- Current v1.34 files are `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md`.
- Planned phase range begins at Phase 238 and continues through Phase 242.
- Phase 238 context is captured in `.planning/phases/238-workshop-checker-path-inventory-and-public-contract/238-CONTEXT.md`.
- Use `$gsd-plan-phase 238` after user approval, then continue phases sequentially.
- After user approval, plan and execute autonomously as far as possible with validation, audit, and verify-work before wrapping.
