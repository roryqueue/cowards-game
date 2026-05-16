---
phase: 2
slug: pure-rules-engine
status: complete
created: 2026-05-16
---

# Phase 2 Pattern Map

## Closest Existing Analogs

| New Surface | Closest Existing Analog | Pattern to Reuse |
|-------------|-------------------------|------------------|
| Engine imports from contracts | `packages/spec/src/spec.test.ts` | Import `@cowards/spec` exports directly and assert exact canonical values. |
| Runtime boundary validation | `packages/spec/src/schemas.ts` | Use Zod schemas only at boundaries; keep inner helpers typed and pure. |
| Canonical fixtures | `packages/spec/src/fixtures/valid.ts` | Builder functions should parse through schemas and default to legal state. |
| Test utility package | `packages/test-utils/src/index.ts` | Expand the existing package; do not make engine depend on it. |
| Package exports | `packages/spec/src/index.ts` | Keep `index.ts` as a curated public export surface. |

## Data Flow

1. `@cowards/spec` provides canonical contracts, schemas, constants, and base fixtures.
2. `@cowards/engine` imports spec contracts and implements pure transition logic.
3. `@cowards/test-utils` may import spec and engine to build deterministic fake runtimes and scenario helpers.
4. Engine tests use spec fixtures plus test-utils builders.

## Constraints for Plans

- Engine must never import `@cowards/test-utils`, `@cowards/runtime-js`, `apps/*`, DB clients, filesystem modules, network APIs, or clock APIs.
- `packages/spec` remains unchanged unless a contract addition is required by engine behavior; do not move engine-only helpers into spec.
- Backstab clarification must be recorded in the canonical source spec before engine tests assert it.

