---
phase: 4
slug: strategy-runtime-sandbox
status: complete
created: 2026-05-16
---

# Phase 4 Research: Strategy Runtime Sandbox

## Implementation Findings

Phase 4 should turn the existing engine-facing `StrategyRuntime` interface into a real JS/TS runtime package without changing engine purity. The cleanest implementation path is:

- `packages/spec` owns the canonical Strategy Revision contracts and schemas, because Phase 5 persistence and Phase 6 authoring need the same artifact shape without importing executable runtime internals.
- `packages/runtime-js` owns validation, deterministic hashing, immutable artifact construction, TypeScript transpilation, forbidden-pattern scanning, and the worker-only executable adapter.
- `apps/worker` is the only app that should be allowed to import the executable runtime entrypoint. `apps/web` and `packages/engine` must remain blocked by ESLint import rules.

Official Node documentation reinforces two Phase 4 constraints:

- Node's `node:vm` documentation states that it is not a security mechanism and should not be used to run untrusted code. Phase 4 should not use it as the sandbox boundary. Source: <https://nodejs.org/api/vm.html>
- Node Worker threads support `resourceLimits`, worker termination on uncaught exceptions, controlled `env`, and separate message passing. They are useful for a replaceable worker-shaped runtime boundary, but their `resourceLimits` only affect the JS engine and do not cover all process-level memory or host access risks. Source: <https://nodejs.org/api/worker_threads.html>

TypeScript support should be transpile-only in Phase 4. The TypeScript docs describe single-file transpilation limitations around `ts.transpileModule`/isolated modules; that aligns with the Phase 4 decision to rely on schemas and runtime validation rather than editor-grade typechecking. Source: <https://www.typescriptlang.org/tsconfig/isolatedModules.html>

The runtime should avoid a misleading "secure JS sandbox" claim. The right Phase 4 posture is a prototype, replaceable boundary with strict contract tests:

- static source rejection for obvious forbidden forms
- runtime global/capability guards
- timeout handling
- source/objective/memory/output size checks
- schema validation before applying memory updates
- no imports or dynamic imports
- no async strategy methods
- public Chronicle markers plus owner-only raw details

## Recommended File Layout

| Area | Files |
|------|-------|
| Strategy Revision contracts | `packages/spec/src/types.ts`, `packages/spec/src/schemas.ts`, `packages/spec/src/spec.test.ts` |
| Runtime safe public API | `packages/runtime-js/src/index.ts`, `packages/runtime-js/src/validation.ts`, `packages/runtime-js/src/revision.ts`, `packages/runtime-js/src/hash.ts`, `packages/runtime-js/src/transpile.ts` |
| Worker executable API | `packages/runtime-js/src/worker.ts`, `packages/runtime-js/src/executor.ts`, `packages/runtime-js/src/guards.ts` |
| Runtime tests | `packages/runtime-js/src/*.test.ts` |
| Package boundaries | `packages/runtime-js/package.json`, `tsconfig.base.json`, `eslint.config.mjs` |
| Worker integration | `apps/worker/package.json`, `apps/worker/src/index.ts` |
| Runtime docs | `packages/runtime-js/README.md` |

## Strategy Revision Shape

Add a canonical spec-owned artifact with enough data for reproducibility and later persistence:

- `id: StrategyRevisionId`
- `strategyId?: StrategyId`
- `source: string`
- `sourceHash: string`
- `sourceBytes: number`
- `runtime: { name: "runtime-js"; version: string }`
- `engineCompatibility: { engine: string; spec: string }`
- `validation: StrategyRevisionValidationReport`
- `metadata: { createdBy?: string; label?: string; tags?: string[] }`

The ID should be deterministic, e.g. `strategy-revision:${sha256(normalized source + runtimeJs + engine + spec + strategyRevision version)}`. Persistence can later add database IDs without replacing the reproducibility identity.

## Runtime Execution Strategy

The executable entrypoint should implement the existing synchronous `StrategyRuntime` interface:

- `selectActivations(input: StrategyInput): RuntimeResult<StrategyResult>`
- `runSoldierBrain(input: SoldierBrainInput): RuntimeResult<SoldierBrainResult>`

Recommended execution model for Phase 4:

1. Validate/build `StrategyRevision` from source before execution.
2. Transpile TypeScript syntax to JavaScript using TypeScript's transpile-only API.
3. Reject source containing imports, dynamic imports, `eval`, `Function`, worker spawning, process/env/fs/network references, clocks, randomness, native modules, or package installation patterns.
4. Evaluate the default strategy object behind the worker-only adapter.
5. Call only synchronous methods.
6. Parse every returned value through existing Zod schemas.
7. Convert thrown exceptions, timeout, invalid output, forbidden capability, and oversized output into typed `RuntimeViolation`s.
8. Never apply partial memory updates when output validation fails.

The implementation should be explicit that this is not a final hostile-code containment story. Future hardening can replace the adapter with subprocess/container/WASM/WASI isolation while preserving `StrategyRuntime`.

## Validation Architecture

Phase 4 tests should prove contracts, validation, execution behavior, package boundaries, and engine integration:

- Spec schema tests parse valid and invalid Strategy Revision artifacts.
- Runtime validation tests cover source size, raw source/hash fields, content-derived IDs, structured validation reports, forbidden pattern detection, missing/default malformed strategy exports, no imports, no async methods, and TypeScript transpilation.
- Runtime execution tests cover valid `selectActivations`, valid `soldierBrain`, invalid output, oversized memory/objective output, thrown exception, timeout, forbidden capability attempt, and atomic memory rejection.
- Engine/replay integration tests run a match with the runtime adapter and assert runtime violations become Chronicle events with public markers and owner-only details.
- Boundary tests assert `apps/web` and `packages/engine` cannot import `@cowards/runtime-js/worker`, while `apps/worker` can.
- Full verification remains `pnpm verify`.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Sandbox docs overclaim security | Add README section "Prototype boundary" and tests named around enforced guardrails, not perfect isolation. |
| Runtime leaks into web or engine packages | Add explicit `exports` entries and ESLint `no-restricted-imports` patterns for `@cowards/runtime-js/worker`. |
| Invalid runtime output mutates memory | Parse complete output before updating any memory; add tests for oversized/invalid memory. |
| TypeScript support becomes a full editor project | Use transpile-only now; defer full typechecking and Monaco diagnostics to Phase 6. |
| Source scanning creates false confidence | Pair static rejection with runtime guards and document that stronger isolation is future work. |
| Timeout behavior is hard to prove synchronously | Use worker termination or injectable execution budget hooks in tests; convert timeout to `RuntimeViolationType: "TIMEOUT"`. |

## Non-Goals

- No durable Strategy Revision persistence.
- No match queue, job claiming, retries, or system-failure policy.
- No Monaco editor typechecking or UX surfaces.
- No helper injection or curated imports for strategy authors.
- No production-grade hostile-code isolation claim.
- No multi-language runtime implementation.
- No strict parser allowlist or exhaustive strategy grammar.
