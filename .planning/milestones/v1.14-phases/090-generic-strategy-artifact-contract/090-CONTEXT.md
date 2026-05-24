# Phase 90: Generic Strategy Artifact Contract - Context

**Gathered:** 2026-05-23  
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract  
**Status:** Context gathered; ready for planning

## Phase Boundary

Phase 90 defines spec-owned Strategy Artifact contracts that can represent source-bearing user revisions, server-native templates, Starter entries, Advanced entries, and future runtime/language variants.

This phase should be additive. It should not break existing `StrategyRevision` consumers, move Strategy execution into Go/web/API, generate manifests, promote Go fork routes, or migrate runtime execution. It should create the contract surface later phases can consume.

## Approved Decisions

### D-01 Additive Contract Family

Add a spec-owned `StrategyArtifact` contract family as a new layer rather than replacing `StrategyRevision` immediately.

Existing `StrategyRevision` schemas and consumers must remain backward-compatible while new artifact metadata becomes available.

### D-02 Artifact Kinds

Represent these v1.14 artifact kinds:

- `account-revision`
- `starter`
- `advanced`
- `template`
- Future runtime/language variants that are valid as metadata but not counted/eligible unless explicitly allowed.

The contract may use narrower names if implementation conventions require them, but it must preserve these semantic categories.

### D-03 Required Metadata

The artifact contract must represent:

- Artifact ID and kind.
- Source visibility.
- Fork eligibility.
- Source hash, byte count, and source format.
- Validation status and validation report.
- Runtime metadata.
- Language metadata.
- Package metadata.
- Engine compatibility.
- Behavior-significant compatibility.
- Public metadata such as names, tags, notes, version, level, or archetype where applicable.
- Generic lineage.
- Immutable Match/MatchSet eligibility.

### D-04 Generic Lineage With Legacy Compatibility

Add generic `derivedFrom` or equivalent lineage metadata while preserving existing `starterLineage` and `advancedLineage` behavior.

Starter and Advanced lineage should become projections or compatible specializations of the generic lineage model, not orphaned parallel concepts.

### D-05 Source-Safe Public Summaries

Public artifact summaries must be source-safe by default. Source-returning exceptions must be explicit:

- Owner-private source retrieval for authenticated owners.
- Built-in forkable source retrieval for Starter/Advanced/template artifacts classified as public/forkable.

### D-06 Eligibility Is Immutable And Explicit

Match/MatchSet eligibility snapshots must be explicit and immutable. Eligibility should capture validation status, counted runtime eligibility, source hash, runtime compatibility, and locked-at semantics so later runtime or manifest changes cannot silently mutate past eligibility.

### D-07 Unsupported Runtime/Language Examples

Unsupported or experimental runtime/language examples may be schema-valid as metadata fixtures when source-safe, but must not imply counted eligibility or public product support.

## Canonical References

- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/089-boundary-baseline-and-scope-lock/089-CONTEXT.md`
- `packages/spec/src/schemas.ts`
- `packages/spec/src/runtime.ts`
- `packages/spec/src/spec.test.ts`
- `packages/runtime-js/src/revision.ts`
- `packages/runtime-js/src/hash.ts`
- `packages/runtime-js/src/validation.ts`
- `packages/runtime-js/src/revision.test.ts`
- `apps/web/app/workshop/types.ts`
- `apps/web/app/workshop/server.ts`
- `apps/web/app/competitive/server.ts`
- `apps/go-backend/live_backend.go`

## Codebase Context

Current Strategy Revision shape:

- `StrategyRevisionSchema` contains `id`, optional `strategyId`, source, `sourceHash`, `sourceBytes`, runtime metadata, engine compatibility, validation report, and metadata.
- `StrategyRevisionMetadataSchema` already supports labels, notes, tags, `starterLineage`, and `advancedLineage`.
- `buildStrategyRevision` derives deterministic IDs from source hash, runtime version, spec version, engine version, revision version, strategy ID, and runtime compatibility.

Existing public DTO behavior:

- Public Strategy DTOs expose hash, byte count, runtime metadata, engine compatibility, validation status, and lineage.
- Public DTOs do not expose Strategy source by default.
- Owner-private source retrieval is already a separate service/API path.

Design pressure:

- v1.13 deferred Go Starter/Advanced fork ownership because Go lacks parity-safe library source access and lineage preservation.
- v1.14 needs a generic artifact model so built-ins, templates, user revisions, and future language variants can share one contract without treating TypeScript library registries as the backend contract.

## Planning Notes

Planning should cover:

- Schema names, exported TypeScript types, and compatibility with existing spec exports.
- Valid/invalid fixtures for account revision, starter, advanced, template, owner-private source, built-in forkable source, public summary, and unsupported runtime/language examples.
- Whether legacy lineage fields are embedded directly, projected from generic lineage, or both.
- Public summary schemas that cannot contain source by construction.
- Immutable eligibility snapshot schema and fixture coverage.

## Deferred To Later Phases

- Phase 91 generates Strategy artifact manifests from TypeScript-owned registries/templates.
- Phase 92 defines runtime ABI envelopes and failure taxonomy.
- Phase 93 adapts JS runtime execution to the ABI/conformance bridge.
- Phase 94 consumes generated artifacts in Go and promotes fork parity.
- Phase 95 centralizes privacy, realism, topology, and promotion gates.
