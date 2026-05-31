# v1.32 Feature Research: Four-Language Production Strategy Support

**Project:** Coward's Game
**Milestone:** v1.32 Four-Language Production Strategy Support
**Researched:** 2026-05-31

## Table Stakes

### Language Surface Inventory

- Inventory every product, runtime, DTO, validation, persistence, starter/sample, public output, docs, proof, and monitor surface that mentions JS/TS, Python, Rust, Zig, counted eligibility, non-counted status, alpha/beta/exhibition labels, WASM/WASI, Preview 1 JSON, runtime adapters, and provider boundaries.
- Classify each surface as source of truth, consumer, stale historical proof, active blocker, or approved exception.
- Identify every place where app/product code directly branches on language ids instead of asking a shared capability/provider model.

### Supported Language Registry

- Define one supported-language registry/provider model covering id, display label, support status, counted eligibility, source/artifact policy, build/compile/package policy, runtime adapter/provider id, validation behavior, limits, deterministic restrictions, starter templates, docs, Workshop/account labels, competition eligibility, public labels, replay/result labels, privacy, and public-output rules.
- Replace old "non-JS runtime support policy" semantics with a model that can honestly represent four supported counted languages.
- Provide public-safe labels from the registry/provider, not from one-off UI helpers.

### Runtime Provider Contract

- Specify a shared `StrategyLanguageProvider` contract for validation, build/compile, artifact packaging, execution adapter selection, product eligibility, public labels, private diagnostics, and evidence requirements.
- Keep hostile code behind runtime-service / Runtime Broker / provider boundaries.
- Make the active ABI decision explicit. Preview 1 stdin/stdout JSON can remain active, but it must be stated as a deliberate shared ABI or versioned per-provider ABI, not inherited by accident.

### Python Production Path

- Move Python from non-counted exhibition beta to supported counted only after provider validation, subprocess/container/sandbox posture, deterministic restrictions, package policy, timeout/memory/output behavior, invalid-output tests, privacy scans, Workshop/account/entry/result/replay support, and signed-in proof pass.

### Rust Production Path

- Move Rust from WASM/WASI beta evidence to supported counted only after immutable artifact policy, compile/toolchain evidence, ABI compatibility, Wasmtime/runtime controls, deterministic restrictions, invalid-output/stale-artifact tests, privacy scans, product labels, and signed-in proof pass.

### Zig Production Path

- Move Zig from no-std WASI beta evidence to supported counted only after source helper policy, compile/toolchain evidence, allowed WASI import audit, ABI compatibility, deterministic restrictions, invalid-output/missing-artifact tests, privacy scans, product labels, and signed-in proof pass.

### Golden Corpus and Parity Matrix

- Implement a golden Strategy corpus in JS/TS, Python, Rust, and Zig for equivalent tactics.
- Run pairwise Match/MatchSet coverage across all four languages.
- Cover valid behavior, invalid outputs, timeout, oversized output, forbidden capabilities, memory-heavy output, deterministic behavior, runtime unavailable/malformed paths, and no silent fallback.
- Compare result/replay/public evidence shape parity and privacy parity.

### Product Unification

- Workshop editor, templates, samples, validation copy, save/submit flows, Account revision lists, competition entry, exhibition counting controls, Strategy cards, player pages, MatchSet results, replay evidence panels, Watch/discovery reads, and Learn/docs should all ask shared eligibility/provider questions.
- Public evidence must show language/provider labels without exposing source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, private runtime internals, quarantine details, operator actions, or recovery payloads.

### Drift Prevention

- Add monitors that fail when active product code special-cases language ids outside approved provider/registry boundaries.
- Add registry parity tests ensuring all four supported languages have templates, docs references, validation, provider ids, limits, privacy policy, public labels, and counted eligibility semantics.
- Add public-output privacy scans for four-language results/replays/proof artifacts.

## Differentiators

- Four-language counted support with evidence parity rather than a single counted JS/TS path plus exhibition lanes.
- Shared product semantics independent of internal runtime implementation.
- A drift wall strong enough that future UI/API additions cannot quietly reintroduce JS/TS-only counting or beta labels.
- Signed-in proof that demonstrates real player workflow: author/save revisions in all four languages, enter counted competition/MatchSet paths, execute, view results, replay, and public evidence.

## Anti-Features

- Label-only promotion.
- Public ranked/competition entry that bypasses provider eligibility.
- Runtime diagnostics or artifact internals leaking into public output.
- Language-specific UI branching that bypasses registry/provider semantics.
- ABI migration without compatibility, rollback, and replay/public evidence proof.
