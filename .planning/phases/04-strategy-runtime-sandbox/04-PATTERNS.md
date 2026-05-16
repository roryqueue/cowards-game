---
phase: 4
slug: strategy-runtime-sandbox
status: complete
created: 2026-05-16
---

# Phase 4 Pattern Map

## Closest Existing Analogs

| New Surface | Closest Existing Analog | Pattern to Reuse |
|-------------|-------------------------|------------------|
| Strategy Revision contracts | `packages/spec/src/types.ts` and `packages/spec/src/schemas.ts` | Keep canonical type names in spec, validate with Zod at package boundaries, and export through `packages/spec/src/index.ts`. |
| Runtime result mapping | `packages/engine/src/types.ts` and `violation()` helper | Return typed `{ ok: false; violation }` results instead of throwing across the engine boundary. |
| Runtime output validation | `packages/engine/src/activation.ts` | Parse complete runtime outputs through Zod before applying memory updates. |
| Runtime violation privacy | `packages/engine/src/activation.ts` and `packages/replay/src/project.ts` | Public events carry safe category/context; private payloads hold raw details for owners only. |
| Package exports | `packages/replay/src/index.ts` and package `exports` fields | Curate public APIs and split implementation modules behind explicit exports. |
| Boundary enforcement | `eslint.config.mjs` | Extend existing `no-restricted-imports` rules for worker-only executable runtime imports. |
| Runtime package tests | `packages/replay/src/*.test.ts` and `packages/engine/src/*.test.ts` | Use focused Vitest files per behavior area and keep tests close to the package. |

## Data Flow

1. User source enters `@cowards/runtime-js` validation.
2. Validation enforces source byte limit, authoring shape, forbidden patterns, no imports, no async methods, and records structured errors/warnings.
3. Revision builder hashes deterministic source/version inputs and returns an immutable Strategy Revision artifact.
4. Worker-only runtime entrypoint adapts a validated revision to the engine `StrategyRuntime` interface.
5. Runtime methods execute synchronously and parse results through `@cowards/spec` schemas.
6. Runtime failures return typed `RuntimeViolation`s to the engine.
7. Engine emits runtime violation events that replay projection already handles as public markers plus owner-only raw details.

## Constraints for Plans

- `packages/spec` owns Strategy Revision contracts and must not import runtime, engine, replay, apps, or test-utils.
- `packages/engine` must not import `@cowards/runtime-js` or any executable runtime entrypoint.
- `apps/web` must not import `@cowards/runtime-js` or `@cowards/runtime-js/worker`.
- `apps/worker` may import the executable runtime entrypoint.
- Phase 4 docs must state that the worker sandbox is a prototype, replaceable boundary.
- Runtime source validation and runtime guards are both required; neither is sufficient alone.
- Runtime output validation must be atomic before memory mutation.
- Durable persistence, Match queues, and Workshop UI remain future-phase scope.
