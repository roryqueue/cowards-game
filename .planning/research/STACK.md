# v1.32 Stack Research: Four-Language Production Strategy Support

**Project:** Coward's Game
**Milestone:** v1.32 Four-Language Production Strategy Support
**Researched:** 2026-05-31
**Scope:** Repo-local stack, runtime/provider contracts, validation, UI/product surfaces, public evidence, and monitor hooks for promoting JS/TS, Python, Rust, and Zig.

## Existing Stack

- Strategy language metadata already exists in `packages/spec/src/runtime.ts` through `STRATEGY_LANGUAGE_IDS`, `STRATEGY_LANGUAGE_REGISTRY`, `STRATEGY_RUNTIME_ADAPTER_REGISTRY`, `RUNTIME_BROKER_REGISTRY`, `StrategyRuntimeMetadata`, product semantics, counted eligibility, runtime limits, and validation messages.
- Current supported source formats are `javascript`, `typescript`, `python`, `rust`, and `zig` in `StrategyArtifactSourceFormat`.
- JS/TS uses `packages/runtime-js` and is currently counted through worker-thread/subprocess adapters. The container subprocess adapter is a production-candidate evidence lane but is not counted.
- Python uses `packages/runtime-python` with a subprocess adapter and Python validation hosts. It is intentionally registered as `runtime-python-subprocess-experimental`, non-counted, and evidence-only.
- Rust and Zig use `packages/runtime-wasm-wasi` through Wasmtime Preview 1 stdin/stdout JSON. They carry immutable WASM artifact metadata and are currently non-counted exhibition beta only.
- `apps/runtime-service` owns runtime execution and validation endpoints. Web/API/Go may call runtime-service, but Strategy code must not execute in those processes.
- Go owns normal backend orchestration, Match lifecycle, Match completion, Chronicle persistence handoff, MatchSet scoring/status refresh, selected public reads, and selected account/public API routes.
- Public app/result/replay consumption is shaped by `match-execution-app-v1` plus newer public discovery DTOs. v1.32 may intentionally change or version execution/runtime contracts, but every change must be justified and audited.

## Stack Additions Needed

- A canonical supported-language model that supersedes the older `NON_JS_RUNTIME_SUPPORT_POLICY` framing. The model should represent JS/TS, Python, Rust, and Zig as first-class records with shared fields for status, counted eligibility, provider/runtime adapter, source/artifact policy, compile/package policy, validation, limits, templates, docs, public labels, privacy, and monitor ownership.
- A `StrategyLanguageProvider` or equivalent provider contract that sits above language-specific adapters. It should answer product questions such as "can submit", "can count", "can enter this competition", "what validation/build path applies", "what public label is allowed", and "what evidence is required".
- Runtime-service provider plumbing for all four languages, including validation/build/execute behavior, failure taxonomy, timeout/memory/output limits, and schema validation parity.
- A conformance suite package or test namespace that can run a golden Strategy corpus across JS/TS, Python, Rust, and Zig and compare public-safe results/replay shapes.
- A monitor that rejects new direct product/UI special-casing of `typescript`, `python`, `rust`, or `zig` outside approved registry/provider boundaries.
- Public-output privacy scan coverage that treats language, adapter, artifact, and diagnostics fields as sensitive unless explicitly public-safe.

## Do Not Add

- Do not add a second ad hoc language list inside React, Go, persistence, or test fixtures.
- Do not use Node `vm` as a security boundary.
- Do not execute Strategy code in web/API/Go.
- Do not promote Python/Rust/Zig by changing labels before runtime/provider, conformance, public evidence, and monitor proof exists.
- Do not silently replace Preview 1 stdin/stdout JSON. If v1.32 keeps it, say so. If it changes, design a migration with compatibility and rollback proof.

## Integration Points

- `packages/spec/src/runtime.ts`
- `packages/spec/src/types.ts`
- `packages/spec/src/runtime-execution-service.ts`
- `packages/runtime-js/src/*`
- `packages/runtime-python/src/*`
- `packages/runtime-wasm-wasi/src/*`
- `apps/runtime-service/src/*`
- `packages/persistence/src/workshop.ts`
- `apps/web/app/workshop/*`
- `apps/web/lib/runtime-labels.ts`
- `apps/web/app/exhibitions/new/*`
- `apps/web/app/competitions/[competitionId]/enter/page.tsx`
- `apps/web/app/matchsets/*`
- `apps/web/app/matches/[matchId]/replay/*`
- `apps/web/app/account/page.tsx`
- `apps/web/app/strategies/[strategyId]/page.tsx`
- `apps/web/lib/public-discovery-service.ts`
- `scripts/check-boundary-monitors.ts`

## Sources

- `AGENTS.md`
- `.planning/PROJECT.md`
- `.planning/MILESTONES.md`
- `.planning/artifacts/v1.23-signed-in-multi-compiler-proof.md`
- `.planning/artifacts/v1.24-production-sandbox-readiness-matrix.md`
- `.planning/artifacts/v1.24-runtime-abuse-lab-evidence.md`
- `.planning/artifacts/v1.25-match-execution-boundary-inventory.md`
- `.planning/artifacts/v1.31-public-site-spine-proof.md`
- `packages/spec/src/runtime.ts`
- `packages/spec/src/types.ts`
- `packages/spec/src/runtime-execution-service.ts`
- `apps/web/lib/runtime-labels.ts`
- `packages/persistence/src/workshop.ts`
- `scripts/check-boundary-monitors.ts`
