---
milestone: v1.32
milestone_name: Four-Language Production Strategy Support
status: planning
current_phase: 223
progress:
  phases_total: 12
  phases_complete: 1
  requirements_total: 60
  requirements_complete: 5
---

# State: Coward's Game v1.32

## Current Position

Phase: 223 - Unified Supported Language Registry and Eligibility Model
Plan: Ready for planning
Status: Phase 222 inventory complete; Phase 223 is next
Last activity: 2026-05-31 - Phase 222 inventory completed and verified

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Four-language production Strategy support for JS/TS, Python, Rust, and Zig.

## Active Boundary Notes

- v1.32 intentionally reopens language eligibility and runtime/provider contract work, but changes must be explicit, justified, versioned or migrated where needed, tested, audited, and documented.
- Do not make Python, Rust, or Zig "supported" by labels only. Promotion requires validation, runtime, conformance, Workshop, Account, entry, results, replay, public evidence, docs, and monitor coverage.
- Strategy execution must remain behind runtime-service / Runtime Broker / language provider boundaries.
- Do not execute Strategy code in web/API/Go.
- If WASI Preview 1 stdin/stdout JSON remains the shared ABI, say so explicitly. If it changes, design and prove the migration.
- Public output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, private runtime internals, quarantine details, operator action details, or recovery payloads.

## Resume Notes

- v1.31 Public Site Spine and Discovery Reads is shipped and archived in `.planning/MILESTONES.md`, `.planning/milestones/v1.31-ROADMAP.md`, `.planning/milestones/v1.31-REQUIREMENTS.md`, `.planning/milestones/v1.31-MILESTONE-AUDIT.md`, and `.planning/artifacts/v1.31-public-site-spine-proof.md`.
- v1.32 starts from the v1.31 baseline where JS/TS is counted, Python/Rust/Zig are non-counted exhibition beta, and Preview 1 stdin/stdout JSON remains the active WASM/WASI ABI until an explicit migration decision changes it.
- Core v1.32 question: What must be true before Python, Rust, and Zig can honestly be fully supported and counted alongside JS/TS, and what monitors prevent future drift?
- Roadmap begins at Phase 222 and continues through Phase 233.
- Phase 222 completed the active language/runtime/eligibility/product/docs/monitor inventory in `.planning/artifacts/v1.32-language-surface-inventory.md`.
- Phase 223 is next: establish one supported-language/provider registry as the active product semantics source.
- Context and discussion logs have been captured for all v1.32 phases:
  - Phase 222: Language Surface Inventory
  - Phase 223: Unified Supported Language Registry and Eligibility Model
  - Phase 224: StrategyLanguageProvider Runtime Contract
  - Phase 225: Python Production Support Path
  - Phase 226: Rust Production Support Path
  - Phase 227: Zig Production Support Path
  - Phase 228: Cross-Language Golden Strategy Corpus and Parity Matrix
  - Phase 229: Workshop, Account, and Competition Entry Unification
  - Phase 230: Result, Replay, Public Evidence, and Docs Language Pass
  - Phase 231: Drift Monitors and Boundary Coverage
  - Phase 232: Live Four-Language Signed-In Proof
  - Phase 233: Audit, Archive, Commit, and Tag
- Phase 211 artifacts:
  - `.planning/artifacts/v1.31-route-link-inventory.md`
  - `.planning/phases/211-route-and-link-inventory/211-CONTEXT.md`
  - `.planning/phases/211-route-and-link-inventory/211-PLAN.md`
  - `.planning/phases/211-route-and-link-inventory/211-SUMMARY.md`
- v1.31 adds `public-discovery-v1` DTOs and app-side discovery service reads separate from `match-execution-app-v1`.
- `/` is now the public discovery hub; `/workshop` remains the canonical Workshop route.
- `/watch`, `/competitions`, `/competitions/[competitionId]`, `/competitions/[competitionId]/enter`, and `/learn` are implemented and linked through the global shell.
- Context, plans, summaries, UI specs, verification, review, and audit artifacts exist for the milestone phases:
  - Phase 212: Discovery Read Requirements and Boundary Design
  - Phase 213: Global Site Shell and Navigation
  - Phase 214: Public Home Discovery Hub
  - Phase 215: Watch Hub
  - Phase 216: Competition Hub and Competition Detail
  - Phase 217: Signed-In Entry Spine
  - Phase 218: Cross-Link Pass Across Existing Object Pages
  - Phase 219: Privacy, Boundary, and Discovery Monitor Coverage
  - Phase 220: Public and Signed-In Journey Proof
  - Phase 221: Audit, Archive, Commit, and Tag
