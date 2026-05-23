# Phase 91: Generated Strategy Artifact Manifest - Discussion Log

**Date:** 2026-05-23  
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract  
**Phase:** 91 - Generated Strategy Artifact Manifest

## Discussion Summary

Phase 91 discussion used the approved carry-forward rule for similar v1.14 decisions. The user approved the recommended manifest defaults: TypeScript is the generation oracle, Go consumes committed JSON as data, drift gates are mandatory, and owner-private source is excluded.

## Decisions

### 1. Manifest Sources

Decision: generate from canonical TypeScript-owned Starter, Advanced, and Workshop template/static snapshot sources.

Rationale: these are the current source-of-truth registries; v1.14 should make their outputs parity-safe rather than hand-copying them into Go.

### 2. Manifest Output

Decision: emit committed JSON manifests consumed as data by TypeScript and Go.

Rationale: Go needs parity-safe source metadata for fork routes without importing TypeScript modules or executing Strategy code.

### 3. Entry Metadata

Decision: include source, hash, bytes, validation report/status, runtime metadata, engine compatibility, public metadata, versions, archetype/benchmark metadata, lineage, fork eligibility, and source visibility.

Rationale: Go fork parity and later promotion gates need all behavior-significant and public DTO facts in one generated artifact.

### 4. Drift Detection

Decision: add stale-output and checksum gates modeled on existing generated Go fixture checks.

Rationale: generated manifests become backend contract inputs; stale data must fail loudly.

### 5. Privacy Classification

Decision: classify only built-in Starter, Advanced, and template source as public/forkable. Owner-private account source must never enter this generated manifest.

Rationale: manifest generation should unlock public built-in forks without widening private source exposure.

### 6. Consumer Roles

Decision: TypeScript remains the generation oracle; Go is a non-executing manifest consumer with parity tests.

Rationale: this keeps v1.14 on the backend transition path without pretending Go owns hostile Strategy runtime behavior.

## Deferred Ideas

None.
