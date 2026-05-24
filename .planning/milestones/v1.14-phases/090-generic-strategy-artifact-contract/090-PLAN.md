# Phase 90: Generic Strategy Artifact Contract - Plan

**Status:** Ready for execution  
**Mode:** Standard  
**Research:** Captured in `090-CONTEXT.md`

## Goal

Add spec-owned generic Strategy Artifact schemas and types without breaking existing `StrategyRevision` behavior.

## Tasks

1. Add artifact contract exports in `packages/spec`.
   - Define artifact kind, source visibility, source format, fork eligibility, generic lineage, immutable eligibility snapshots, and public summary schemas.
   - Preserve `starterLineage` and `advancedLineage` compatibility.

2. Add tests and fixtures.
   - Cover account revision, starter, advanced, template, public source-safe summary, built-in forkable source, owner-private source metadata, and unsupported runtime/language metadata.
   - Verify summaries cannot contain source by construction.

3. Preserve compatibility.
   - Ensure existing `StrategyRevisionSchema` fixtures and runtime-js revision tests still pass.
   - Export new types without forcing existing consumers to migrate.

## Verification

- Run spec tests for schema coverage.
- Run runtime-js revision tests to catch backward compatibility drift.
- Run TypeScript checks for packages importing spec exports.

## Exit Criteria

- New artifact schemas are exported.
- Existing StrategyRevision consumers still pass.
- Public summaries are source-safe by schema and tests.
