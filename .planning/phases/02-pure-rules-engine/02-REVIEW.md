---
phase: 2
phase_name: Pure Rules Engine
status: fixed
depth: standard
files_reviewed: 27
finding_counts:
  critical: 0
  warning: 0
  info: 0
  total: 0
reviewed_at: 2026-05-16
fixed_at: 2026-05-16
---

# Code Review: Phase 2 Pure Rules Engine

## Scope

Reviewed Phase 2 source changes from implementation commit `7646578` through closeout commit `cb6ba80`.

Reviewed source/config files:

- `.prettierignore`
- `README.md`
- `eslint.config.mjs`
- `packages/engine/package.json`
- `packages/engine/src/activation.test.ts`
- `packages/engine/src/activation.ts`
- `packages/engine/src/backstab.test.ts`
- `packages/engine/src/backstab.ts`
- `packages/engine/src/contraction.test.ts`
- `packages/engine/src/contraction.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/invariants.test.ts`
- `packages/engine/src/match.test.ts`
- `packages/engine/src/match.ts`
- `packages/engine/src/movement.test.ts`
- `packages/engine/src/movement.ts`
- `packages/engine/src/purity.test.ts`
- `packages/engine/src/runtime-inputs.ts`
- `packages/engine/src/selectors.ts`
- `packages/engine/src/state.test.ts`
- `packages/engine/src/state.ts`
- `packages/engine/src/test/fake-runtime.ts`
- `packages/engine/src/types.ts`
- `packages/engine/tsconfig.json`
- `packages/test-utils/package.json`
- `packages/test-utils/src/engine-scenarios.ts`
- `packages/test-utils/src/index.ts`

## Findings

### WR-001: Post-advance Backstab can eliminate a player without ending the match immediately

**Severity:** Warning  
**Status:** Fixed
**File:** `packages/engine/src/activation.ts`  
**Lines:** 218-238  
**Requirements:** ENG-15, ENG-19

After `resolveAction` returns, the activation loop updates `current` and `advanced`, then only breaks on `terminalReason`. A successful MOVE or push can run `resolveBackstabBoundary(..., "post-advance")` inside `movement.ts`, stone all remaining enemy ACTIVE Soldiers, and return with `advanced: true` and no terminal reason. The loop can then continue to another SoldierBrain cycle before `checkAndApplyMatchEnd` runs at activation end.

That violates the source rule: "After Backstab boundary resolution, immediately check match-end conditions." It can also change outcomes incorrectly. For example, a Soldier could win by post-advance Backstab, continue acting in the same Activation, then later fall or stone itself before the delayed match-end check.

**Recommendation:** After every `resolveAction`, call `checkAndApplyMatchEnd(current)` before deciding whether to continue the activation loop. If the match ends, append the `MATCH_ENDED` event and break/return before any additional SoldierBrain cycles.

**Resolution:** `resolveActivation` now checks match-end immediately when an action emits `BACKSTAB_RESOLVED`. A regression test verifies a post-advance Backstab that eliminates a player stops before a second SoldierBrain call.

### IN-001: Off-board movement test asserts the opposite of the intended event payload

**Severity:** Info  
**Status:** Fixed
**File:** `packages/engine/src/movement.test.ts`  
**Lines:** 101-105  
**Requirements:** TEST-01

The off-board movement test confirms the Soldier becomes `FALLEN`, but the event assertion currently expects no payload string containing `MOVED_OFF_BOARD`. The implementation emits `event("SOLDIER_FELL", { soldierId, reason: "MOVED_OFF_BOARD" })`, so this assertion does not validate the documented reason and appears inverted.

**Recommendation:** Change the assertion to verify that a `SOLDIER_FELL` event exists with payload reason `MOVED_OFF_BOARD`.

**Resolution:** The test now asserts a `SOLDIER_FELL` event whose payload includes `MOVED_OFF_BOARD`.

## Positive Notes

- Engine production code remains synchronous and pure; the purity test covers filesystem, network, clock, random, process, database, and cache access patterns.
- The core state transitions use immutable replacement helpers and keep derived board lookups out of `GameState`.
- Activation, movement, Backstab, Contraction, match runner, and invariant tests give Phase 3 a useful baseline before Chronicle work begins.

## Verification Context

Latest full verification before review:

- `pnpm verify` passed.
- Engine tests: 8 files, 34 tests passed.

## Resolution Verification

- `pnpm --filter @cowards/engine test` passed with 35 tests.
- `pnpm verify` passed.
