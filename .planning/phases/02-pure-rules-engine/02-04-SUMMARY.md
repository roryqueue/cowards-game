---
phase: 2
plan: 02-04
status: complete
commit: 7646578
requirements-completed: [ENG-17, ENG-18, ENG-19, ENG-20, ENG-21, TEST-02]
---

# Summary: Contraction, Match End, and Invariant Matrix

## Completed

- Implemented board Contraction after Round 4 by shrinking bounds inward by one square.
- Implemented out-of-bounds ACTIVE/STONE Soldier falling and TerrainStone removal after Contraction.
- Implemented immediate Match end checks for zero ACTIVE Soldiers and final 2x2 resolution by surviving ACTIVE count.
- Added invariant tests for occupancy uniqueness, bounds validity, status semantics, and deterministic ordering.
- Added contraction and end-condition tests.

## Verification

- `pnpm --filter @cowards/engine test`
- `pnpm verify`

## Deviations

- Property-style coverage is implemented as deterministic invariant matrices in Vitest rather than randomized generators, preserving the engine purity/determinism constraint.

## Self-Check

PASSED
