# Phase 229 Summary: Workshop, Account, and Competition Entry Unification

## Accomplished

- Kept `runtime-labels.ts` as a thin web adapter over the supported-language registry.
- Added `WORKSHOP_EDITOR_SOURCE_FORMATS` so Workshop editor controls are derived from one helper.
- Changed source-format display labels to return provider public labels for TypeScript, Python, Rust, and Zig.
- Updated Workshop template chips and language controls to avoid local Rust/Zig branching.
- Updated Workshop server and Workshop API validation/submission errors to derive language labels from the provider registry.
- Updated MatchSet result runtime labels to derive language labels from runtime/provider semantics.
- Updated persistence Workshop revision summaries and account revision downgrade labels to use the provider registry.
- Added provenance-aware Workshop revision `runtimeSemantics` so saved revision rows do not show counted eligibility for invalid or stale provider revisions.

## Verification

- `pnpm --filter @cowards/persistence typecheck` passed.
- `pnpm --filter @cowards/persistence test -- workshop` passed: 12 files, 60 passed, 1 skipped.
- `pnpm --filter @cowards/web typecheck` passed.
- `pnpm --filter @cowards/web test -- runtime-labels workshop/server workshop-client evidence-copy result-view-model public-discovery-service account-service-adapter` passed: 25 files, 171 tests.
