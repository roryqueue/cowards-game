---
gsd_state_version: 1.0
milestone: v1.34
milestone_name: Workshop Provider Checker Parity
status: planning
last_updated: "2026-06-01T14:07:12Z"
last_activity: 2026-06-01
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 1
  completed_plans: 1
  percent: 20
---

# State: Coward's Game v1.34

## Current Position

Phase: 239 - Provider-Grade Validate Source Parity
Plan: Not started
Status: Phase 238 complete; ready to discuss Phase 239
Last activity: 2026-06-01 - Completed Phase 238 Workshop checker inventory, public contract, parity matrix, and verification

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Implement provider-grade Validate source parity for TypeScript, Python, Rust, and Zig using the Phase 238 checker contract while preserving runtime-service/provider boundaries and public-safe diagnostics.

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
- Phase 238 artifacts are `.planning/artifacts/v1.34-workshop-checker-inventory.md`, `.planning/artifacts/v1.34-workshop-checker-contract.md`, and `.planning/artifacts/v1.34-workshop-checker-parity-matrix.md`.
- Use `$gsd-discuss-phase 239` next, then plan and execute Phase 239.
- After user approval, plan and execute autonomously as far as possible with validation, audit, and verify-work before wrapping.
