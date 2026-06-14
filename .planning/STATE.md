---
gsd_state_version: 1.0
milestone: v1.35
milestone_name: Runtime, Account Ownership, Sandbox, and Package Policy Cleanup
status: planning
last_updated: "2026-06-14T18:34:37.128Z"
last_activity: 2026-06-14
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game v1.35

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-06-14 — Milestone v1.35 started

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Define v1.35 requirements and roadmap for runtime/account ownership, provider-proof, sandbox-readiness, and package-policy cleanup.

## Active Boundary Notes

- v1.35 starts from v1.34's shipped Workshop provider checker parity and v1.33's source-language artifact provenance for TypeScript/Python plus immutable WASM/WASI Preview 1 artifact-backed Rust/Zig support.
- Go production Strategy runtime work and TinyGo production support are intentionally skipped.
- TinyGo remains spike-only and hidden from production Workshop, submit/save, entry, result, replay, and public evidence surfaces.
- Runtime-service / Runtime Broker / provider boundaries remain the hostile-code boundary.
- Strategy code must not execute in web/API/Go.
- TypeScript and Python artifact provenance is provenance evidence, not equivalent to WASM isolation or production sandbox certification.
- Rust and Zig remain immutable WASM/WASI Preview 1 artifact-backed lanes; no ABI migration is in scope.
- Public/default checker output must not expose Strategy source, raw diagnostics, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, or objective payloads.
- Account-owned Strategy Revision, competition-entry, owner-debug, provider-proof, sandbox-claim, and package/dependency surfaces are the active inventory targets for this milestone.

## Resume Notes

- v1.33 shipped and is tagged as `v1.33`.
- v1.33 archives are in `.planning/milestones/v1.33-ROADMAP.md`, `.planning/milestones/v1.33-REQUIREMENTS.md`, and `.planning/milestones/v1.33-MILESTONE-AUDIT.md`.
- v1.34 archives are in `.planning/milestones/v1.34-ROADMAP.md`, `.planning/milestones/v1.34-REQUIREMENTS.md`, and `.planning/milestones/v1.34-MILESTONE-AUDIT.md`.
- v1.35 planning should continue phase numbering after Phase 242.
- Phase 238 context is captured in `.planning/phases/238-workshop-checker-path-inventory-and-public-contract/238-CONTEXT.md`.
- Phase 238 artifacts are `.planning/artifacts/v1.34-workshop-checker-inventory.md`, `.planning/artifacts/v1.34-workshop-checker-contract.md`, and `.planning/artifacts/v1.34-workshop-checker-parity-matrix.md`.
- Phase 239 made Workshop Validate source use runtime-service/provider validation for TypeScript, Python, Rust, and Zig.
- Phase 240 added public-safe checker diagnostics and calm runtime-service/toolchain unavailable states.
- Phase 241 added checker response caching/coalescing, stale-state UX, and boundary monitors.
- Phase 242 added focused tests plus `.planning/artifacts/v1.34-workshop-checker-proof.md`, proving all four checker paths returned `ready` through runtime-service on 2026-06-14.
- Code review, follow-up review, UI review, and final provenance follow-up review are recorded. Final review status is clean.
