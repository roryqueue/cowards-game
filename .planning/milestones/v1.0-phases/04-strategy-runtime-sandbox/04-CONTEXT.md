# Phase 4: Strategy Runtime Sandbox - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase implements the first real JavaScript/TypeScript strategy runtime for Coward's Game. It should validate user-authored strategy source, build immutable Strategy Revision artifacts, expose a replaceable worker-only executable runtime entrypoint, execute `selectActivations` and `soldierBrain` through the existing `StrategyRuntime` interface, enforce source/memory/objective/output/timeout/forbidden-capability constraints, and prove runtime failure behavior with tests.

This phase does not implement durable persistence, match job orchestration, database-backed revision submission, the Monaco Workshop UX, helper libraries for strategy authors, production-grade hostile-code isolation, multi-language runtimes, or strict exhaustive strategy grammar.

</domain>

<decisions>
## Implementation Decisions

### Sandbox Boundary

- **D-01:** Phase 4 should use a replaceable worker sandbox with strict contract checks.
- **D-02:** The Phase 4 sandbox is an explicit prototype boundary. Documentation and tests must not claim production-grade hostile-code isolation.
- **D-03:** Do not use Node `vm` as the security boundary.
- **D-04:** `packages/runtime-js` should expose split entrypoints: broadly importable safe validation APIs and a worker-only executable runtime entrypoint such as `@cowards/runtime-js/worker`.
- **D-05:** `apps/web`, `packages/engine`, and non-worker code must not import the executable runtime entrypoint.
- **D-06:** Validation should statically reject obvious forbidden patterns such as `eval`, `Function`, imports, dynamic imports, worker spawning, process/env/fs/network tokens, native modules, package installation, wall-clock time, and nondeterministic randomness.
- **D-07:** Runtime execution should also guard forbidden capabilities. Static rejection is author feedback, not the only enforcement layer.
- **D-08:** The runtime boundary must remain replaceable so a later subprocess, container, WASM/WASI, or other stronger runtime can implement the same `StrategyRuntime` contract.

### Strategy Revision Artifact

- **D-09:** Phase 4 should build a versioned in-memory immutable Strategy Revision artifact, not durable storage.
- **D-10:** `packages/spec` owns canonical StrategyRevision types and schemas.
- **D-11:** `packages/runtime-js` owns Strategy Revision builder and validation behavior.
- **D-12:** A Strategy Revision stores raw source plus a deterministic source hash. Public replay/projection must continue stripping strategy source by default.
- **D-13:** Strategy Revision IDs should be content-derived from deterministic revision content and version inputs. Phase 5 persistence may add database IDs later without changing the reproducibility identity.
- **D-14:** Validation should return a structured report with `valid`, `errors`, `warnings`, source byte size, detected forbidden patterns, runtime version, engine compatibility, and hash metadata.
- **D-15:** Invalid validation results should not throw as the primary user-facing path.

### Failure Semantics

- **D-16:** If `selectActivations` fails because of invalid output, timeout, thrown exception, forbidden capability, or oversized output/memory, that player forfeits that round's selected activation orders.
- **D-17:** A failed activation selection logs a runtime violation and leaves StrategyMemory unchanged.
- **D-18:** If `soldierBrain` fails during an Activation, the runtime violation interrupts the Activation, then the existing no-advance cleanup rule applies.
- **D-19:** If the Soldier had not Advanced before the `soldierBrain` failure, it becomes STONE unless it became FALLEN. If it had already Advanced, it avoids no-advance stoning.
- **D-20:** Runtime failure categories share the same gameplay result in Phase 4. Chronicle records the exact `RuntimeViolationType` for later policy/debugging.
- **D-21:** Invalid or oversized runtime outputs are atomic: no partial StrategyMemory or SoldierMemory update applies.
- **D-22:** Runtime violation Chronicles should expose public markers with affected player/Soldier context while keeping raw exception messages, validation errors, forbidden details, source snippets, memory, and objectives in owner-only private data.

### Authoring Contract

- **D-23:** Strategy source exports a default object with `selectActivations(input)` and `soldierBrain(input)` methods.
- **D-24:** Phase 4 should support TypeScript syntax by transpiling it for execution, but should not provide full editor-grade typechecking.
- **D-25:** Runtime schemas and output validation remain the source of truth even when TypeScript syntax is accepted.
- **D-26:** Strategy source must be self-contained in Phase 4. No imports, dynamic imports, package dependencies, or relative module graphs are allowed.
- **D-27:** Phase 4 should not inject helper utilities. Strategies receive only canonical inputs and return canonical outputs.
- **D-28:** `selectActivations` and `soldierBrain` are synchronous only. Async functions, promises, timers, and await-based behavior are out of scope.

### the agent's Discretion

No areas were delegated to the agent without a user choice.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning

- `.planning/PROJECT.md` — Core value, runtime isolation constraints, deterministic autonomous strategy principles, memory/source limits, and JS/TS runtime scope.
- `.planning/REQUIREMENTS.md` — Phase 4 requirements RUN-01 through RUN-10 and TEST-04.
- `.planning/ROADMAP.md` — Phase 4 boundary, success criteria, notes, and requirement mapping.
- `.planning/STATE.md` — Current project status and workflow settings.
- `.planning/config.json` — GSD mode, granularity, parallel execution, and workflow preferences.

### Prior Phase Decisions

- `.planning/phases/01-foundation-and-spec-contracts/01-CONTEXT.md` — Locked package-boundary, spec-contract, fixture, and versioning decisions.
- `.planning/phases/02-pure-rules-engine/02-CONTEXT.md` — Locked engine purity, `StrategyRuntime` interface, typed runtime violation, activation failure, and no-advance cleanup decisions.
- `.planning/phases/03-chronicle-and-replay-core/03-CONTEXT.md` — Locked Chronicle privacy, runtime violation projection, replay reconstruction, and strict grammar deferral decisions.
- `.planning/spec-amendments/02-backstab-rule.md` — Canonical Backstab clarification that runtime-driven actions must respect through the engine.

### Source Specs

- `/Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md` — Canonical gameplay rules, Strategy Runtime constraints, determinism, memory limits, and product principles.
- `/Users/roryquinlan/Downloads/CowardsGame_Technical_Architecture_Spec_V1.md` — Runtime isolation, worker execution, Strategy Revision immutability, package responsibilities, and security cautions.

### Source Code

- `packages/spec/src/types.ts` — Existing canonical runtime inputs/outputs, `RuntimeViolationType`, `RuntimeViolation`, compatibility versions, and Chronicle contracts.
- `packages/spec/src/schemas.ts` — Existing Zod schemas for runtime inputs/outputs, memory/objective limits, and runtime violation types.
- `packages/spec/src/constants.ts` — Source, StrategyMemory, SoldierMemory, objective payload, and activation cycle limits.
- `packages/spec/src/versions.ts` — Compatibility version spine including `runtimeJs` and `strategyRevision`.
- `packages/engine/src/types.ts` — Existing synchronous `StrategyRuntime` interface and `RuntimeResult`/`violation` helpers.
- `packages/engine/src/activation.ts` — Current activation-selection and SoldierBrain failure behavior that Phase 4 runtime results must feed.
- `packages/runtime-js/src/index.ts` — Current skeletal runtime package entrypoint; Phase 4 implementation target.
- `apps/worker/src/index.ts` — Current skeletal worker app; only worker-side code should call executable runtime entrypoints.
- `eslint.config.mjs` — Existing package-boundary rules; Phase 4 should extend them for worker-only runtime execution imports.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `@cowards/spec` already provides canonical runtime input/output types, Zod schemas, byte-size helpers, memory/objective/source constants, compatibility versions, and runtime violation categories.
- `@cowards/engine` already defines the engine-facing synchronous `StrategyRuntime` interface and consumes typed `RuntimeResult` values.
- `packages/engine/src/activation.ts` already logs runtime violations, applies no-advance cleanup, rejects invalid runtime output atomically through schemas, and leaves selection failure as no activation orders.
- `packages/replay` already projects runtime violations publicly as markers while preserving raw details in owner-only private data.

### Established Patterns

- `packages/spec` owns canonical cross-package contracts and must not depend on runtime, engine, replay, apps, or test-utils.
- `packages/engine` must not import `@cowards/runtime-js` or app/worker code.
- Local verification remains `pnpm verify`.
- Package boundaries are enforced with ESLint `no-restricted-imports`; Phase 4 should add executable-runtime import restrictions rather than relying on convention.
- Runtime tests should live close to `packages/runtime-js` and prove behavior through canonical schemas and the existing engine-facing interface.

### Integration Points

- Add Strategy Revision types/schemas to `packages/spec`.
- Implement validation, artifact building, static forbidden-pattern detection, transpilation, hashing, and safe public APIs in `packages/runtime-js`.
- Add a worker-only executable entrypoint in `packages/runtime-js` that adapts validated Strategy Revisions to the engine `StrategyRuntime` interface.
- Extend boundary rules so `apps/worker` can import executable runtime code, while `apps/web`, `packages/engine`, and general packages cannot.
- Feed runtime violations into the engine in the existing `RuntimeResult` shape so Chronicle construction and projection continue to work.

</code_context>

<specifics>
## Specific Ideas

- Use a default strategy object authoring shape:
  `export default { selectActivations(input) { ... }, soldierBrain(input) { ... } }`.
- Treat TypeScript support as transpilation plus schema validation in Phase 4, not full authoring/editor typechecking.
- Keep Phase 4 strategies self-contained with no imports and no helper injection.
- Keep strategy methods synchronous to match the current engine contract and avoid promise/timer/network ambiguity.
- Make the sandbox caveat explicit in docs so future hardening is not mistaken for already solved security.

</specifics>

<deferred>
## Deferred Ideas

- Durable Strategy Revision storage and database identity belong in Phase 5.
- Match job orchestration, retries, and system-failure-vs-strategy-failure policy belong in Phase 5.
- Monaco editor typechecking, templates, validation UX, and helper ergonomics belong in Phase 6.
- Stronger hostile-code isolation such as subprocess/container/WASM/WASI execution remains a future hardening path behind the same runtime boundary.
- Strict exhaustive strategy grammar or parser allowlist remains deferred until after the core runtime, persistence, Workshop, and replay loops exist.

</deferred>

---

*Phase: 4-Strategy Runtime Sandbox*
*Context gathered: 2026-05-16*
