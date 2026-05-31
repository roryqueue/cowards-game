---
gsd_state_version: 1.0
milestone: v1.33
milestone_name: Artifact Provenance for Source Languages + WASM Language Spikes
status: planning
last_updated: "2026-05-31T23:16:36.647Z"
last_activity: 2026-05-31
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game v1.33

## Current Position

Phase: 234 - TypeScript Artifact Provenance
Plan: Not started
Status: Roadmap ready; begin Phase 234 discussion or planning
Last activity: 2026-05-31 - Milestone v1.33 initialized from pasted brief; requirements, research summary, and roadmap created

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Artifact provenance parity for TypeScript and Python plus TinyGo/Grain WASM/WASI spike evidence.

## Active Boundary Notes

- v1.33 starts from v1.32's provider-gated support for TypeScript, Python, Rust, and Zig.
- Rust and Zig are artifact-backed through immutable WASM/WASI Preview 1 stdin/stdout JSON artifacts and must not regress.
- TypeScript and Python source-language artifacts must fail closed if stale, missing, mismatched, unverifiable, oversized, or incompatible.
- TypeScript and Python artifact provenance is evidence/provenance, not equivalent to WASM isolation or production sandbox certification.
- TinyGo and Grain remain spike-only unless a future plan explicitly proves safety and the user approves productionizing them.
- Strategy execution must remain behind runtime-service / Runtime Broker / language provider boundaries.
- Do not execute Strategy code in web/API/Go.
- Do not use Node `vm` as a security boundary.
- Public output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, private runtime internals, quarantine details, operator action details, recovery payloads, or spike-only private artifacts.

## Resume Notes

- v1.32 Four-Language Production Strategy Support is shipped and archived in `.planning/MILESTONES.md`, `.planning/milestones/v1.32-ROADMAP.md`, `.planning/milestones/v1.32-REQUIREMENTS.md`, `.planning/milestones/v1.32-MILESTONE-AUDIT.md`, and `.planning/artifacts/v1.32-four-language-signed-in-proof.md`.
- v1.32 promoted TypeScript, Python, Rust, and Zig to supported counted Strategy languages only through provider-compatible runtime evidence. Preview 1 stdin/stdout JSON remains the active Rust/Zig WASM/WASI ABI until an explicit migration decision changes it.
- v1.33 goal: add artifact provenance for TypeScript and Python source-language providers, then run contained TinyGo and Grain WASM/WASI spikes without promoting either candidate language by default.
- Roadmap continues after v1.32 and begins at Phase 234.
- Phase 234 will add TypeScript artifact generation, proof binding, artifact execution, fail-closed validation, privacy, and regression coverage.
- Phase 235 will add Python artifact provenance with interpreter metadata while preserving constrained source/runtime policy and honest security claims.
- Phase 236 will build and evaluate a minimal TinyGo WASM/WASI Strategy artifact against the existing Strategy ABI and runtime evidence model.
- Phase 237 will build and evaluate a minimal Grain WebAssembly Strategy artifact against Wasmtime/WASI compatibility and the existing Strategy ABI.
- Phase 238 will update docs/UI/evidence, preserve Rust/Zig behavior, run monitors/browser review, and close validation.
- Research notes are in `.planning/research/SUMMARY.md` and `.planning/research/v1.33-SUMMARY.md`.
- Requirements are in `.planning/REQUIREMENTS.md`.
- Roadmap is in `.planning/ROADMAP.md`.
