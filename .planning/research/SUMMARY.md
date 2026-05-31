# v1.32 Research Summary

**Project:** Coward's Game
**Milestone:** v1.32 Four-Language Production Strategy Support
**Domain:** JS/TS, Python, Rust, and Zig Strategy language promotion, runtime/provider contracts, counted eligibility, conformance, product unification, public evidence, and drift monitors.
**Researched:** 2026-05-31
**Confidence:** High for current repo-local surface and milestone decomposition; medium for final runtime/ABI design until Phase 224 proves the provider contract and migration decision.

## Executive Summary

Coward's Game already contains real language/runtime lanes for JS/TS, Python, Rust, and Zig. The current product truth is still asymmetric: JS/TS is counted, Python is non-counted exhibition beta, Rust/Zig are non-counted WASM/WASI exhibition beta, and monitors actively preserve that non-promotion state.

v1.32 should promote the four languages only by replacing that asymmetric model with a shared supported-language/provider contract and a conformance wall. The milestone should not start by flipping labels. It should start with a surface inventory, then establish a canonical registry/provider source of truth, then promote Python, Rust, and Zig through runtime-service/Runtime Broker boundaries with evidence parity.

The core promotion question remains:

> What must be true before Python, Rust, and Zig can honestly be fully supported and counted alongside JS/TS, and what monitors prevent future drift?

## Stack Findings

- `packages/spec/src/runtime.ts` already has language ids, language registry, adapter registry, runtime metadata, runtime broker registry, product semantics, counted eligibility, limits, validation messages, and non-JS promotion criteria.
- Existing registry semantics currently encode JS/TS as enabled/countable and Python/Rust/Zig as disabled/non-counted/evidence-only.
- `packages/runtime-js`, `packages/runtime-python`, and `packages/runtime-wasm-wasi` provide the active runtime lanes.
- `apps/runtime-service` is the right boundary for validation/execution provider behavior.
- Go owns normal backend orchestration and public/account reads; Strategy execution must not move into Go.
- Product surfaces still hardcode labels and source formats in `apps/web/lib/runtime-labels.ts`, Workshop, Account, exhibitions, competition entry, result/replay, public discovery, and tests.
- `scripts/check-boundary-monitors.ts` currently has many negative assertions that must be deliberately converted into positive parity/boundary monitors.

## Feature Table Stakes

- Complete a language surface inventory before changing behavior.
- Define a canonical `SUPPORTED_STRATEGY_LANGUAGES` / `StrategyLanguageProvider` model.
- Make counted eligibility, source/artifact policy, build/compile/package policy, validation, runtime adapter/provider id, limits, docs/templates, public labels, privacy, and public-output rules provider-owned.
- Keep hostile Strategy execution behind runtime-service / Runtime Broker.
- Make the Preview 1 stdin/stdout JSON ABI decision explicit: preserve it deliberately or version/migrate it with rollback proof.
- Promote Python, Rust, and Zig through runtime/provider evidence, not labels.
- Build a four-language golden Strategy corpus and pairwise Match/MatchSet matrix.
- Add invalid-output, timeout, oversized-output, forbidden-capability, memory-heavy, deterministic behavior, privacy parity, result/replay shape parity, and label/eligibility consistency tests.
- Unify Workshop, Account, competition entry, Strategy cards, player pages, MatchSet results, replay, Learn/docs, and public discovery around shared provider semantics.
- Add monitors that reject direct product-language special-casing outside approved provider/registry boundaries.

## Architecture Direction

Target flow:

```text
Product/UI/API surfaces
  -> Supported language registry
  -> StrategyLanguageProvider capability and eligibility API
  -> runtime-service / Runtime Broker
  -> language-specific runtime adapter
  -> pure engine and Chronicle
  -> public-safe result/replay projection
```

The provider model should preserve internal implementation differences while making product semantics shared. JS/TS may still use runtime-js, Python may use a Python provider, and Rust/Zig may use WASM/WASI providers, but Workshop/account/entry/result/replay/public evidence should not encode four separate product truths.

## Watch Outs

- Do not execute Strategy code in web/API/Go.
- Do not use Node `vm` as a security boundary.
- Do not leak Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, private runtime internals, quarantine details, operator action details, or recovery payloads.
- Do not silently change `match-execution-app-v1`; if execution DTOs or contracts change, version or migrate them explicitly.
- Do not delete non-promotion monitors without replacing them with parity and boundary monitors.
- Do not let historical proof artifacts block promotion, but do keep them as evidence of the previous baseline.
- Do not let direct language switches reappear in product code after the provider model lands.

## Recommended Phase Structure

1. Phase 222: Language Surface Inventory.
2. Phase 223: Unified Supported Language Registry and Eligibility Model.
3. Phase 224: StrategyLanguageProvider Runtime Contract.
4. Phase 225: Python Production Support Path.
5. Phase 226: Rust Production Support Path.
6. Phase 227: Zig Production Support Path.
7. Phase 228: Cross-Language Golden Strategy Corpus and Parity Matrix.
8. Phase 229: Workshop, Account, and Competition Entry Unification.
9. Phase 230: Result, Replay, Public Evidence, and Docs Language Pass.
10. Phase 231: Drift Monitors and Boundary Coverage.
11. Phase 232: Live Four-Language Signed-In Proof.
12. Phase 233: Audit, Archive, Commit, and Tag.

## Sources Consulted

- `AGENTS.md`
- `.planning/PROJECT.md`
- `.planning/MILESTONES.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/artifacts/v1.23-signed-in-multi-compiler-proof.md`
- `.planning/artifacts/v1.24-production-sandbox-readiness-matrix.md`
- `.planning/artifacts/v1.24-runtime-abuse-lab-evidence.md`
- `.planning/artifacts/v1.24-signed-in-multi-runtime-regression-proof.md`
- `.planning/artifacts/v1.25-match-execution-boundary-inventory.md`
- `.planning/artifacts/v1.31-public-site-spine-proof.md`
- `CowardsGameSpec_Full_Consolidated_v1.md`
- `CowardsGame_Technical_Architecture_Spec_V1.md`
- `packages/spec/src/runtime.ts`
- `packages/spec/src/types.ts`
- `packages/spec/src/runtime-execution-service.ts`
- `packages/runtime-js/src/*`
- `packages/runtime-python/src/*`
- `packages/runtime-wasm-wasi/src/*`
- `apps/runtime-service/src/*`
- `packages/persistence/src/workshop.ts`
- `apps/web/lib/runtime-labels.ts`
- `apps/web/app/workshop/*`
- `apps/web/app/account/page.tsx`
- `apps/web/app/exhibitions/new/*`
- `apps/web/app/competitions/[competitionId]/enter/page.tsx`
- `apps/web/app/matchsets/*`
- `apps/web/app/matches/[matchId]/replay/*`
- `apps/web/app/strategies/[strategyId]/page.tsx`
- `apps/web/lib/public-discovery-service.ts`
- `scripts/check-boundary-monitors.ts`

---
*Research summary written: 2026-05-31*
