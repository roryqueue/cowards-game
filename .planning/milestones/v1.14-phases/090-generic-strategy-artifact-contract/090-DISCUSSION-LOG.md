# Phase 90: Generic Strategy Artifact Contract - Discussion Log

**Date:** 2026-05-23  
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract  
**Phase:** 90 - Generic Strategy Artifact Contract

## Discussion Summary

Phase 90 discussion used the carry-forward guidance from Phase 89: compactly confirm recommended defaults when they preserve privacy, schema validation, deterministic engine boundaries, hostile Strategy isolation, and TypeScript-as-oracle/Go-as-future-backend direction.

The user approved the recommended Phase 90 defaults.

## Decisions

### 1. Contract Shape

Decision: add a spec-owned `StrategyArtifact` contract family as an additive layer, while keeping existing `StrategyRevision` behavior backward-compatible.

Rationale: artifact metadata needs to grow beyond account revisions, but existing runtime, worker, service, and UI consumers already depend on `StrategyRevision`.

### 2. Artifact Coverage

Decision: cover account revisions, Starter entries, Advanced entries, server-native templates, and future runtime/language variants.

Rationale: v1.14 needs one generic model for user-submitted revisions, built-in source libraries, and future language metadata without implying execution support.

### 3. Metadata Surface

Decision: include artifact kind, source visibility, fork eligibility, source hash/bytes/format, validation status/report, runtime/language/package metadata, engine compatibility, behavior compatibility, public metadata, generic lineage, and immutable match eligibility.

Rationale: later manifest, ABI, Go fork, and promotion phases all need the same facts without re-deriving them from TypeScript-only code.

### 4. Lineage

Decision: add generic `derivedFrom` or equivalent lineage metadata while preserving `starterLineage` and `advancedLineage` compatibility.

Rationale: the project already exposes Starter/Advanced lineage publicly; generic lineage should extend that model rather than erase it.

### 5. Source Privacy

Decision: make public summaries source-safe by default, with explicit source-returning exceptions for authenticated owner-private source and built-in forkable source.

Rationale: v1.14 must preserve public-output safety while allowing Go and manifest consumers to fork public built-ins.

### 6. Eligibility

Decision: represent immutable Match/MatchSet eligibility snapshots with validation, counted runtime eligibility, source hash, runtime compatibility, and locked-at semantics.

Rationale: eligibility must not drift when runtime support, manifests, or validation rules evolve.

### 7. Unsupported Runtime/Language Fixtures

Decision: allow unsupported or experimental runtime/language examples as schema fixtures when source-safe, but keep them non-counted and non-eligible unless explicitly promoted later.

Rationale: future language metadata belongs in the contract now; product/runtime support does not.

## Deferred Ideas

None.
