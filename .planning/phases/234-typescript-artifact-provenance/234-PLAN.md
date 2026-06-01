# Phase 234 Plan: TypeScript Artifact Provenance

## Tasks

1. Extend spec metadata/schema with source-language artifact provenance and public redaction.
2. Build TypeScript transpiled source artifacts during revision creation.
3. Execute TypeScript from the stored artifact path rather than re-transpiling source at runtime.
4. Add runtime-service TypeScript provider validation and proof binding.
5. Require provider validation for Workshop TypeScript submission.
6. Add stale artifact regression coverage and privacy checks.

## Verification

- `pnpm --filter @cowards/runtime-js test -- --runInBand`
- `pnpm --filter @cowards/runtime-service test -- --runInBand`
- `pnpm typecheck`
