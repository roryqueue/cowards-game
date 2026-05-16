---
phase: 2
plan: 02-03
status: complete
commit: 7646578
---

# Summary: Actions, Movement, Collision, Push, and Backstab

## Completed

- Implemented `TURN`, `TURN_TO_STONE`, and `MOVE` resolution.
- Implemented successful Advance semantics, facing updates, `lastSuccessfulMoveDirection`, immediate reversal blocking, off-board falling, terrain/Stone blocking, head-to-head blocking, side push, blocked push, and push-off-board behavior.
- Implemented position-triggered Backstab at activation start, post-advance, and activation end boundaries.
- Implemented simultaneous Backstab snapshots, multi-victim Backstab, mutual Backstab, and pushed-Soldier Backstab behavior.
- Added movement and Backstab test coverage for canonical edge cases.

## Verification

- `pnpm --filter @cowards/engine test`
- `pnpm verify`

## Deviations

- Post-advance Backstab uses the same deterministic all-active snapshot helper as activation boundaries, keeping the rule engine simple and consistent.

## Self-Check

PASSED
