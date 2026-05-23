# v1.14 Architecture Research

**Milestone:** Generic Strategy Artifact and Runtime Boundary Contract
**Date:** 2026-05-23

## Current Boundaries

- `packages/spec` owns core types, schemas, service contracts, runtime metadata, and privacy assertions.
- `packages/runtime-js` owns JS/TS source validation, revision construction, hashing, adapter execution, and hostile runtime probes.
- `packages/persistence` owns TypeScript Starter/Advanced source registries and account revision/fork helpers.
- `apps/go-backend` owns selected live API routes but currently has 501 fork stubs and reduced revision validation/source metadata logic.
- `apps/worker` owns job claiming, runtime execution, Match completion, Chronicle generation, scoring completion, and runtime/system failure handling.

## Proposed Data Flow

1. TypeScript source registries/templates remain canonical for v1.14 generation.
2. A generation command builds Strategy Artifact manifest JSON from canonical registries.
3. Manifest output includes canonical hashes, bytes, validation, runtime metadata, public metadata, lineage, and fork eligibility.
4. TypeScript and Go both load generated manifest data.
5. Go fork routes create account revisions from manifest entries without executing Strategy code.
6. Worker runtime receives persisted revisions and executes only through runtime-owned ABI/conformance code.

## Runtime Boundary

- Deterministic server/native orchestration builds ABI request envelopes from engine inputs and immutable revision/artifact data.
- Hostile runtime adapters return ABI response envelopes or pass through one explicit conformance bridge.
- Runtime violations are player/Strategy failures; system failures are infrastructure failures and must be persisted/retried/classified separately.
- Public outputs receive only projected public messages, never private diagnostics.

## Verification Shape

- Spec tests for artifact schemas, ABI envelopes, failure taxonomy, and forbidden public fields.
- Manifest generation tests, stale-output checks, checksum checks, and TypeScript/Go parity tests.
- Runtime adapter contract tests for worker-thread, subprocess, and container-subprocess paths.
- Go tests for manifest loading, fork creation, lineage preservation, privacy, schema, and no-execution guarantees.
- Boundary monitors for import drift, ABI drift, manifest drift, adapter drift, privacy drift, topology drift, and runtime ownership creep.
- Live topology/replay evidence for Go-created MatchSets and browser-visible board realism.
