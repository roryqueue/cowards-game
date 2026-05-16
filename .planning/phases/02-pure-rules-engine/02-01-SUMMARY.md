---
phase: 2
plan: 02-01
status: complete
commit: 7646578
---

# Summary: Spec Amendment and Engine Foundation

## Completed

- Updated the source Backstab rules in `/Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md` and recorded the repo-local amendment in `.planning/spec-amendments/02-backstab-rule.md`.
- Added canonical pure engine state, transition result, runtime result, player, Backstab boundary, and match input types.
- Added deterministic initial state creation with 8 Soldiers per player, canonical positions/facings, arena bounds, terrain stones, version metadata, and seed-derived initial initiative.
- Added selector helpers for Soldier lookup, occupancy, board snapshots, behind-square detection, direction math, and immutable Soldier replacement.
- Added foundation tests for initial state, immutability, deterministic seed behavior, and derived lookups.

## Verification

- `pnpm --filter @cowards/engine test`
- `pnpm verify`
- `rg "position-triggered" /Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md`

## Deviations

- Fake runtime helpers live in `packages/engine/src/test/fake-runtime.ts` for direct engine package tests, while reusable scenario helpers were added to `packages/test-utils`.

## Self-Check

PASSED
