# @cowards/runtime-js

JavaScript and TypeScript Strategy Revision authoring support for Coward's Game.

## Safe Public API

The default `@cowards/runtime-js` entrypoint is safe-only. It exports package metadata, deterministic hashing helpers, source validation, transpile-only compilation, immutable Strategy Revision construction, and revision validity checks.

It does not export executable runtime APIs, worker-thread helpers, filesystem access, network access, or engine execution hooks.

## Worker-Only Execution API

Executable APIs are available only from `@cowards/runtime-js/worker`.

That path exports `createRuntimeFromRevision`, which adapts a validated Strategy Revision to the engine's synchronous `StrategyRuntime` interface, plus `RUNTIME_TIMEOUT_MS` for the worker bridge default timeout.

## Strategy Authoring Contract

A strategy source file must use `export default` with two synchronous methods:

- `selectActivations(input)` returns activation orders and StrategyMemory.
- `soldierBrain(input)` returns exactly one Action and SoldierMemory.

The authoring API accepts TypeScript syntax, but support is transpile-only. It does not perform full typechecking or inject helper libraries.

## Prototype Boundary

Phase 4 guardrails are not production-grade hostile-code isolation. The current boundary blocks obvious forbidden capabilities, executes strategy methods in one-shot Node worker threads, validates outputs before returning success, and maps failures to typed runtime violations.

The boundary is designed to be replaced by subprocess/container/WASM/WASI isolation later without changing the engine-facing `StrategyRuntime` contract.

## Forbidden Capabilities

Validation rejects imports, dynamic imports, `eval`, `Function`, `process`, `require`, filesystem and HTTP module tokens, `fetch`, clocks, randomness, worker spawning, child processes, WebAssembly, and package installation commands.

The worker harness also shadows key globals at execution time and reports `FORBIDDEN_CAPABILITY` when blocked names are accessed through the prototype runtime boundary.

## Failure Semantics

Runtime execution returns typed violations instead of throwing into the engine:

- `INVALID_OUTPUT` for malformed or Promise-like strategy outputs.
- `OVERSIZED_OUTPUT` for memory or objective payload schema size failures.
- `THROWN_EXCEPTION` for strategy exceptions.
- `FORBIDDEN_CAPABILITY` for blocked runtime access.
- `TIMEOUT` for worker execution timeouts.

The engine remains the owner of memory updates, activation interruption, stoning, and Chronicle event emission.

## Phase 4 Non-Goals

Phase 4 does not provide persistence, match orchestration, Workshop UI, helper injection, multi-language runtimes, strict exhaustive grammar, or production-grade hostile-code isolation.
