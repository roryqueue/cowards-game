# v1.32 Architecture Research: Four-Language Production Strategy Support

**Project:** Coward's Game
**Milestone:** v1.32 Four-Language Production Strategy Support
**Researched:** 2026-05-31

## Current Architecture

The current architecture already has several pieces of a future shared model:

- `packages/spec/src/runtime.ts` defines language ids, language registry records, runtime adapter records, runtime metadata, runtime broker registry entries, product semantics, counted eligibility evaluation, and validation messages.
- `packages/spec/src/types.ts` defines Strategy artifacts, source formats, revision metadata, compiled WASM artifacts, and public summaries.
- `packages/spec/src/runtime-execution-service.ts` defines the Strategy Execution Service / Runtime Broker boundary and the app-facing execution response/failure shape.
- `packages/runtime-js`, `packages/runtime-python`, and `packages/runtime-wasm-wasi` provide language/runtime-specific validation and execution lanes.
- `apps/runtime-service` is the execution/validation boundary used by Go and web flows for hostile Strategy behavior.
- Product surfaces currently consume a mix of shared semantics and local language switches, especially in Workshop, Account, competition entry, result/replay labels, and public discovery.
- `scripts/check-boundary-monitors.ts` currently enforces the opposite of v1.32's desired end state for many paths: Python/Rust/Zig must stay non-counted, experimental, or beta.

## Recommended Build Order

1. **Inventory and exception map:** Before changing behavior, write a concrete inventory of all hardcoded language/status/eligibility paths and mark which ones are historical proof, active code, approved provider boundary, or drift.
2. **Registry/provider contract:** Evolve `STRATEGY_LANGUAGE_REGISTRY`, `STRATEGY_RUNTIME_ADAPTER_REGISTRY`, and product semantics into a first-class supported-language/provider model. Keep compatibility with existing `StrategyRuntimeMetadata` where possible.
3. **Runtime contract:** Define `StrategyLanguageProvider` responsibilities and runtime-service API changes. Decide whether Preview 1 stdin/stdout JSON remains the active ABI for Rust/Zig and whether Python/JS/TS use the same or a provider-specific ABI behind a shared contract.
4. **Language production lanes:** Promote Python, Rust, and Zig one by one, with provider, validation/build, execution, privacy, public evidence, and signed-in tests.
5. **Conformance wall:** Build the golden corpus and pairwise matrix after at least the provider contract exists so parity tests target the new source of truth.
6. **Product unification:** Replace Workshop/Account/entry/result/replay/docs label and eligibility branching with shared provider questions.
7. **Drift monitors:** Convert old non-promotion monitors into positive parity monitors and add direct-special-case detection.
8. **Live proof and audit:** Finish with a four-language signed-in workflow and archive decision records for ABI, provider model, privacy, rollback, and promotion.

## Data Flow Target

```text
Workshop / Account / Entry / Public UI
    |
    v
Supported Strategy Language Registry
    |
    v
StrategyLanguageProvider capability/eligibility/public-label API
    |
    v
runtime-service / Runtime Broker
    |
    +--> JS/TS provider -> runtime-js adapter
    +--> Python provider -> Python runtime adapter
    +--> Rust provider -> WASM/WASI provider/adapter
    +--> Zig provider -> WASM/WASI provider/adapter
    |
    v
Pure engine + Chronicle
    |
    v
Public-safe result/replay evidence projection
```

## Contract Concerns

- `match-execution-app-v1` was intentionally frozen through v1.31. v1.32 may introduce a new version or backward-compatible additions, but the plan must state the versioning/migration route explicitly.
- Existing runtime ABI is `strategy-runtime-abi-v1.14`; execution service contract is `runtime-execution-service-v1.15`; runtime broker registry is `runtime-broker-registry-v1.17`. Promotion may require new versions or explicit compatibility decisions.
- Compiled artifacts currently hardcode `publicEvidence.nonCounted: true`. Rust/Zig promotion requires a new artifact evidence model or a versioned change.
- Product validation messages still say Python is non-counted in v1.18. These messages must be replaced with provider-derived current semantics.
- Current monitors assert Python/Rust/Zig non-promotion. They must become parity and boundary monitors rather than historical blockers.

## Architecture Risks

- The project could end up with two sources of truth: registry/provider in spec and separate UI strings in web.
- Runtime-service validation for Rust/Zig currently depends on `COWARDS_RUNTIME_SERVICE_URL` from the web route; production support needs stable service availability and failure behavior.
- Python subprocess evidence is not the same as production hostile-code sandbox certification. Promotion must not overclaim isolation.
- Rust/Zig compile/toolchain behavior can drift by local environment. Production support needs toolchain versioning, artifact compatibility, and fail-closed behavior.
- Public result/replay evidence could accidentally expose artifacts, diagnostics, source, memory, or host/runtime internals while trying to prove parity.

## Architecture Outputs to Produce

- `StrategyLanguageProvider` contract or equivalent.
- `SUPPORTED_STRATEGY_LANGUAGES` registry or evolved `STRATEGY_LANGUAGE_REGISTRY` with provider ids and product semantics.
- Provider-owned eligibility functions for counted play, competition entry, public labels, validation path, docs/templates, and privacy.
- Runtime-service/provider contract version decision.
- Golden corpus and parity matrix runner.
- Monitor allowlist for approved language-specialization boundaries.
- Public-safe four-language proof artifact.
