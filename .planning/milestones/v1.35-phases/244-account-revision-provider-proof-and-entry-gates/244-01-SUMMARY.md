# Phase 244 Plan 01 Summary: TypeScript Runtime-Service Validation Parity

## Status

Complete.

## What Changed

- Go runtime-service validation now accepts `typescript` alongside Python, Rust, and Zig, using the existing `/validate-strategy` HTTP+JSON provider boundary.
- Added Go client coverage for TypeScript validation success, unsupported-format fail-closed behavior, source-format drift, incomplete success responses, and source identity mismatch.
- Added runtime-service coverage proving TypeScript `/validate-strategy` returns provider proof metadata, source artifact identity, source hash/bytes, engine compatibility, and public-safe output.
- Redacted `bytesBase64` from runtime-service validation response metadata so validation output exposes artifact identity and proof metadata without raw artifact bytes.

## Verification

- `cd apps/go-backend && go test ./... -run 'TestRuntimeServiceClient'` — passed.
- `pnpm --filter @cowards/runtime-service test -- server.test.ts` — passed.

## Deviations from Plan

**[Rule 2 - Missing critical privacy behavior] Runtime-service validation exposed artifact bytes** — Found during: Task 1 | Issue: the new TypeScript validation test showed `metadata.sourceArtifact.bytesBase64` in the `/validate-strategy` response. | Fix: added runtime-service response metadata redaction for `sourceArtifact.bytesBase64` and `compiledArtifact.bytesBase64` while keeping artifact hash/bytes and provider proof metadata. | Files modified: `apps/runtime-service/src/server.ts`, `apps/runtime-service/src/server.test.ts`. | Verification: runtime-service server test passed.

**Total deviations:** 1 auto-fixed. **Impact:** Positive; the validation envelope now better matches the Phase 244 public-safe proof boundary.

## Notes

- No Strategy execution, TypeScript transpilation, package install, filesystem access, database access, Node `vm`, or local readiness shortcut was added to Go.
- TypeScript/Python remain source-artifact provenance evidence; no WASM isolation or production sandbox certification claim was added.
