# Architecture Research: v1.7 Runtime and Backend Boundary Stabilization

**Date:** 2026-05-22
**Milestone:** v1.7 Runtime and Backend Boundary Stabilization

## Existing Integration Points

- `packages/spec/src/types.ts` and `packages/spec/src/schemas.ts` define canonical game, Strategy, Chronicle, analytics, competition, and privacy-facing schemas.
- `packages/runtime-js/src/adapter.ts` defines `StrategyExecutionAdapter`, metadata, runtime controls, and JS adapter readiness.
- `packages/runtime-js/src/subprocess-ipc.ts` defines current JSON IPC request/response guards and system failure taxonomy.
- `packages/runtime-js/src/revision.ts` builds immutable JS/TS Strategy Revisions and currently fixes `runtime.name` to `"runtime-js"`.
- `apps/worker/src/runtime-config.ts` selects `worker-thread`, `subprocess`, or `container-subprocess` adapters.
- `apps/worker/src/runner.ts` attaches runtime adapter metadata to worker execution.
- `apps/web/app/workshop/server.ts` and `apps/web/app/competitive/server.ts` are service-like modules but still depend directly on persistence and Next-specific concerns.
- `packages/persistence` owns real storage and high-level domain workflows.

## Recommended Architecture Direction

### Boundary Ownership

Use `@cowards/spec` as the authoritative contract package for:

- Service DTO schemas.
- Runtime ABI schemas.
- Adapter registry metadata schema.
- Compatibility keys and version constants.
- Golden fixture validation helpers.
- Public privacy assertions.

Keep `@cowards/engine` pure and unaware of API/runtime language mechanics.

### Service Boundary

Introduce a typed client/service layer between Next route handlers/pages and persistence.

Suggested shape:

- `packages/spec`: `ServiceApiContract`, endpoint DTO schemas, public/private DTO privacy guards.
- `apps/web/app/services` or a shared package: typed service client/server facade for current in-process calls.
- Next route handlers call the facade, not persistence directly.
- Persistence remains the implementation behind the facade in v1.7.
- Go spike implements a subset of the same contract and can be swapped behind a feature flag or client base URL for a read-only path.

### Runtime ABI

Introduce ABI-level envelopes separate from JS implementation types:

- `StrategyRuntimeRequestEnvelope`
- `StrategyRuntimeResponseEnvelope`
- `RuntimeViolationEnvelope`
- `RuntimeSystemFailureEnvelope`
- `RuntimeAdapterMetadata`
- `StrategyLanguageMetadata`
- `StrategyPackageMetadata`
- `RuntimeCompatibilityKey`

The envelope should wrap existing `StrategyInput`, `SoldierBrainInput`, `StrategyResult`, and `SoldierBrainResult` schemas instead of redefining game concepts.

### Golden Parity

Add golden fixture categories before the Go/Python implementation grows:

- Engine and Chronicle fixtures from `packages/test-utils`.
- Runtime ABI fixtures from current JS subprocess behavior.
- Service DTO fixtures from current persistence/web DTO outputs.
- Privacy fixtures for public replay, analytics, exports, and MatchSet pages.
- Ordering fixtures for summaries, matrices, standings, and exports.

### Spike Isolation

Keep the Go backend and non-JS runtime spike separated:

- Go backend spike proves HTTP/API/DTO parity.
- Python or Go runtime spike proves Strategy ABI parity.
- Neither spike should own the canonical contract.

## Suggested Build Order

1. Define service contract and typed facade over existing persistence behavior.
2. Define runtime ABI and adapter registry metadata.
3. Build golden parity fixtures across existing behavior.
4. Add adapter metadata to Strategy Revisions and MatchSet compatibility.
5. Add one experimental non-JS runtime using the ABI.
6. Add minimal read-only Go backend endpoint(s) using the service contract.

## Open Design Pressure

- Whether service contracts should be endpoint-first OpenAPI or schema-first TypeScript with optional OpenAPI export.
- Whether the non-JS runtime spike should be Python for user reach or Go for symmetry.
- Whether the Go backend reads PostgreSQL directly or consumes exported fixture/service snapshots for the first proof.
- How much of `apps/web/app/competitive/server.ts` should move into a shared service package in v1.7 versus just wrapping it.
