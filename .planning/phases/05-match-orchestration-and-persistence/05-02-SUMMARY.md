---
phase: 5
plan: 05-02
status: complete
requirements-completed: [MATCH-01, MATCH-02, MATCH-03, MATCH-07, DATA-01, DATA-02, DATA-04]
---

# Plan 05-02 Summary: Match and MatchSet Creation Services

## Status

Complete.

## What Changed

- Added repository primitives and StrategyRevision lock/content mutation guards.
- Added Match creation service contracts with explicit seed, side assignment, revision IDs, Arena Variant ID, and queued job creation.
- Added curated Arena Variants in `@cowards/map-configs`.
- Added MatchSet presets for `smoke-v1`, `standard-v1`, and `stress-v1`.
- Added MatchSet matrix generation with mirrored side support and canonical persisted matrix shape.
- Added focused tests for Match creation validation, retry defaults, immutability guards, preset definition, mirrored matrix generation, and custom matrix preservation.

## Verification

```bash
pnpm --filter @cowards/map-configs typecheck
pnpm --filter @cowards/persistence test -- match-service.test.ts matchset-service.test.ts
pnpm --filter @cowards/persistence typecheck
```

All checks passed.

## Key Files Created Or Modified

- `packages/persistence/src/repositories.ts`
- `packages/persistence/src/match-service.ts`
- `packages/persistence/src/matchset-service.ts`
- `packages/persistence/src/presets.ts`
- `packages/persistence/src/match-service.test.ts`
- `packages/persistence/src/matchset-service.test.ts`
- `packages/map-configs/src/index.ts`

## Deviations

- Tests use deterministic service/helper contracts rather than a live PostgreSQL instance, keeping the suite fast while preserving exact status/id/matrix assertions.
