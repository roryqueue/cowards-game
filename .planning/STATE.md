---
milestone: v1.32
milestone_name: Four-Language Production Strategy Support
status: planning
current_phase: 233
progress:
  phases_total: 12
  phases_complete: 11
  requirements_total: 60
  requirements_complete: 55
---

# State: Coward's Game v1.32

## Current Position

Phase: 233 - Audit, Archive, Commit, and Tag
Plan: Ready for planning
Status: Phase 232 live four-language signed-in proof complete; Phase 233 is next
Last activity: 2026-05-31 - Phase 232 live signed-in proof passed for all six counted four-language pairings

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
- v1.32 started from the v1.31 baseline where JS/TS was counted and Python/Rust/Zig were non-counted exhibition beta; Phase 225 promoted Python, Phase 226 promoted Rust, and Phase 227 promoted Zig through provider-gated counted support. Preview 1 stdin/stdout JSON remains the active WASM/WASI ABI until an explicit migration decision changes it.
- Core v1.32 question: What must be true before Python, Rust, and Zig can honestly be fully supported and counted alongside JS/TS, and what monitors prevent future drift?
- Roadmap begins at Phase 222 and continues through Phase 233.
- Phase 222 completed the active language/runtime/eligibility/product/docs/monitor inventory in `.planning/artifacts/v1.32-language-surface-inventory.md`.
- Phase 223 added `SUPPORTED_STRATEGY_LANGUAGES` in `packages/spec/src/runtime.ts`, derived the legacy language registry from it, and moved web runtime labels onto spec-level language semantics.
- Phase 224 added a versioned provider contract and provider registry, kept WASI Preview 1 stdin/stdout JSON explicit for Rust/Zig, and made runtime-service fail closed on provider/runtime or JS adapter drift.
- Phase 225 promoted Python to counted eligible through the constrained provider path while keeping Strategy execution behind runtime-service / Runtime Broker.
- Phase 226 promoted Rust to counted eligible through immutable WASM/WASI artifact provider proof while preserving historical non-counted evidence.
- Phase 227 promoted Zig to counted eligible through provider validation, no-std/import policy, immutable artifact metadata, and provider proof.
- Phase 228 added a reusable four-language golden corpus, pairwise runtime-service matrix, conformance gate manifest, public Chronicle shape checks, and privacy marker scans.
- Phase 229 moved Workshop, account, entry, and MatchSet result labels toward provider-derived language semantics.
- Phase 230 updated public evidence and Learn/docs to explain four-language provider-gated counted support, WASI Preview 1 artifact posture, no-fallback behavior, privacy exclusions, and sandbox non-claims.
- Phase 231 converted stale non-promotion monitors into positive provider-backed counted support checks, added direct product language special-case drift detection, and extended service/public discovery runtime import boundaries to WASM/WASI.
- Phase 232 completed the live local signed-in proof for TypeScript, Python, Rust, and Zig across six counted cross-language MatchSets. Evidence is in `.planning/artifacts/v1.32-four-language-signed-in-proof.md` and `.planning/artifacts/v1.32-four-language-signed-in-proof.json`.
- Phase 233 is next: Audit, Archive, Commit, and Tag.
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
