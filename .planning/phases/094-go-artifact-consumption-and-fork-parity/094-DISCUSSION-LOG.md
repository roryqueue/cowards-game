# Phase 94: Go Artifact Consumption and Fork Parity - Discussion Log

**Date:** 2026-05-23  
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract  
**Phase:** 94 - Go Artifact Consumption and Fork Parity

## Discussion Summary

Phase 94 discussion confirmed the Go artifact consumption defaults. The user approved promoting Starter/Advanced fork parity only through generated manifest data, with TypeScript as parity oracle, strict no-execution boundaries, lineage-preserving account saves, and fail-closed selected Go ownership.

## Decisions

### 1. Go Consumption Model

Decision: Go consumes generated Strategy Artifact manifests as data and owns Starter/Advanced fork routes only through that contract.

Rationale: this resolves the v1.13 fork deferral without importing TypeScript registry logic into Go.

### 2. Runtime Boundary

Decision: Go fork routes must not execute Strategy code, import TypeScript, call Node, use Node `vm`, claim jobs, run Matches, build Chronicles, or classify runtime failures.

Rationale: Go route promotion should not blur runtime ownership or hostile-code isolation boundaries.

### 3. Fork Parity

Decision: Go Starter/Advanced forks must match the TypeScript oracle for source, hashes, bytes, validation shape, runtime metadata, engine compatibility, public metadata, lineage, IDs, and account list DTO behavior.

Rationale: users should not see behavioral differences based on selected backend ownership.

### 4. Account Save Lineage

Decision: Go saves should preserve built-in/template lineage only when submitted source hash and artifact metadata match a manifest entry; otherwise save as ordinary owner source.

Rationale: lineage must be earned by manifest proof, not forged from arbitrary request fields.

### 5. Fail-Closed Behavior

Decision: fork routes fail closed for manifest, schema, auth, storage, privacy, topology, stale-output, invalid artifact, and no-fallback failures.

Rationale: selected Go ownership cannot silently fall back to TypeScript without invalidating promotion evidence.

### 6. Promotion Gates

Decision: promotion requires ownership manifest updates, selection flags, topology checks, rollback evidence, TypeScript-oracle parity tests, and no-fallback evidence.

Rationale: Go fork promotion should follow the same evidence style as v1.13 route ownership.

### 7. Source Privacy

Decision: public and normal account-list Go responses remain source-free; only authenticated private source retrieval returns source.

Rationale: artifact/fork parity must not widen public source exposure.

## Deferred Ideas

None.
