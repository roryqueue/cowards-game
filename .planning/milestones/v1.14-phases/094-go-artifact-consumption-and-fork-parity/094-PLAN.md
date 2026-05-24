# Phase 94: Go Artifact Consumption and Fork Parity - Plan

**Status:** Ready for execution  
**Mode:** Standard  
**Research:** Captured in `094-CONTEXT.md`

## Goal

Use generated Strategy Artifact manifests to make Go-owned Starter/Advanced fork routes parity-safe without Go executing Strategy code.

## Tasks

1. Add Go manifest loading.
   - Parse generated artifact manifest JSON as data.
   - Validate schema version, IDs, source hash/bytes, validation metadata, runtime metadata, and lineage.

2. Implement Go Starter/Advanced fork handlers.
   - Replace `forkUnavailable` for selected routes.
   - Save source and metadata from manifest entries.
   - Preserve labels, notes, tags, Strategy IDs, revision IDs, and Starter/Advanced lineage.

3. Add lineage-preserving account save behavior.
   - Preserve manifest-backed lineage when submitted source hash and artifact metadata match.
   - Avoid forged lineage when source does not match.

4. Add parity and fail-closed tests.
   - Compare Go outputs with TypeScript oracle fixtures.
   - Cover missing/stale manifest, unknown artifact ID, invalid metadata, unauthorized session, storage/schema/privacy/topology failures, and no-fallback behavior.

5. Update ownership artifacts and route selection gates.
   - Promote fork routes only after parity tests pass.
   - Preserve rollback/no-fallback evidence.

## Verification

- Run Go backend tests.
- Run TypeScript oracle/fixture generation tests.
- Run boundary monitors and topology checks where available.

## Exit Criteria

- Go Starter/Advanced forks match TypeScript oracle behavior.
- Go never executes Strategy code.
- Selected Go fork routes fail closed without TypeScript fallback.
