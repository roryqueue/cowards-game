---
gsd_state_version: 1.0
milestone: v1.33
milestone_name: Artifact Provenance for Source Languages + WASM Language Spikes
status: shipped
last_updated: "2026-06-01T13:23:20Z"
last_activity: 2026-06-01
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 4
  completed_plans: 4
  percent: 100
---

# State: Coward's Game v1.33

## Current Position

Phase: 237 - Documentation, UI, and Verification
Plan: Complete
Status: v1.33 implementation, validation, verification, audit, PR, and planning archive complete
Last activity: 2026-06-01 - Archived v1.33 after adding TypeScript/Python source-language artifact provenance, TinyGo spike evidence, docs/UI copy, and validation artifacts

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Ready to define v1.34; likely focus is Workshop checker parity and language-provider diagnostics while skipping Go/TinyGo production support for now.

## Active Boundary Notes

- v1.33 starts from v1.32's provider-gated support for TypeScript, Python, Rust, and Zig.
- Rust and Zig are artifact-backed through immutable WASM/WASI Preview 1 stdin/stdout JSON artifacts and must not regress.
- TypeScript and Python source-language artifacts must fail closed if stale, missing, mismatched, unverifiable, oversized, or incompatible.
- TypeScript and Python artifact provenance is evidence/provenance, not equivalent to WASM isolation or production sandbox certification.
- TinyGo remains spike-only unless a future plan explicitly proves safety and the user approves productionizing it.
- Strategy execution must remain behind runtime-service / Runtime Broker / language provider boundaries.
- Do not execute Strategy code in web/API/Go.
- Do not use Node `vm` as a security boundary.
- Public output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, private runtime internals, quarantine details, operator action details, recovery payloads, or spike-only private artifacts.

## Resume Notes

- v1.32 Four-Language Production Strategy Support is shipped and archived in `.planning/MILESTONES.md`, `.planning/milestones/v1.32-ROADMAP.md`, `.planning/milestones/v1.32-REQUIREMENTS.md`, `.planning/milestones/v1.32-MILESTONE-AUDIT.md`, and `.planning/artifacts/v1.32-four-language-signed-in-proof.md`.
- v1.32 promoted TypeScript, Python, Rust, and Zig to supported counted Strategy languages only through provider-compatible runtime evidence. Preview 1 stdin/stdout JSON remains the active Rust/Zig WASM/WASI ABI until an explicit migration decision changes it.
- v1.33 shipped TypeScript and Python source-language artifact provenance, kept Rust/Zig immutable WASM/WASI artifact behavior green, and recorded TinyGo as spike-only/deferred.
- Roadmap continues after v1.32 and begins at Phase 234.
- Phase 234 added TypeScript artifact generation, proof binding, artifact execution, fail-closed validation, privacy, and regression coverage.
- Phase 235 added Python artifact provenance with interpreter metadata while preserving constrained source/runtime policy and honest security claims.
- Phase 236 built and evaluated a minimal TinyGo WASM/WASI Strategy artifact against the existing Strategy ABI and deferred production support.
- Phase 237 updated docs/UI/evidence, preserved Rust/Zig behavior, ran monitors/browser review, and closed validation.
- Research notes are in `.planning/research/SUMMARY.md` and `.planning/research/v1.33-SUMMARY.md`.
- v1.33 archives are in `.planning/milestones/v1.33-ROADMAP.md`, `.planning/milestones/v1.33-REQUIREMENTS.md`, and `.planning/milestones/v1.33-MILESTONE-AUDIT.md`.
- Current `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` still reflect v1.33 until the next milestone is initialized.
