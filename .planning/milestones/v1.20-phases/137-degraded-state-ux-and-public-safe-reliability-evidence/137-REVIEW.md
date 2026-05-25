# Phase 137 Code Review

**Status:** Findings fixed
**Date:** 2026-05-25

## Findings

### Fixed: Running copy mentioned Python for JS/TS-only MatchSets

The running-state copy now uses runtime-neutral wording: "Running or slow; exhibition Matches remain bounded by outer MatchSet/job budgets." A JS/TS-only running test covers this.

### Fixed: Blocked Matches were treated as Strategy-caused failures

Blocked Matches now get their own public-safe retry/status explanation instead of being grouped with Strategy-caused runtime failures.

### Fixed: Invalid-result and no-result reasons fell through to completed-copy

`invalid_result` and `no_result` now have explicit terminal public evidence wording and tests.

### Fixed: Raw DTO privacy exclusions were rendered in provenance

The MatchSet page now renders an allowlisted public-safe provenance privacy cue instead of joining backend DTO exclusion labels directly.

## Follow-Up Verification

- `pnpm exec vitest run apps/web/app/matchsets/evidence-copy.test.ts` passed.
- `pnpm --filter @cowards/web typecheck` passed.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` passed.
