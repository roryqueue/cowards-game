---
phase: 2
phase_name: Pure Rules Engine
status: clean
depth: deep
files_reviewed: 28
finding_counts:
  critical: 0
  warning: 0
  info: 0
  total: 0
reviewed_at: 2026-05-16
fixed_at: 2026-05-16
latest_review_commit: 514f784
supersedes: standard review in commit 4707c52 and fix commit c2b6420
---

# Deep Code Review: Phase 2 Pure Rules Engine

## Scope

Reviewed Phase 2 source changes through `514f784 fix(02): close deep review findings`, using a deep pass over cross-file state transitions, import/call relationships, rule ordering, and Chronicle-facing event semantics.

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
- `packages/engine/src/outcome.ts`
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

No active findings remain in the latest deep review.

## Fixed Findings

### WR-001: Push-off-board can eliminate a player but still allow extra SoldierBrain cycles

**Severity:** Warning
**Status:** Fixed
**File:** `packages/engine/src/activation.ts`
**Lines:** 218-237
**Requirements:** ENG-14, ENG-19

The previous review fix checks match-end immediately after actions that emitted `BACKSTAB_RESOLVED`. That closes the post-advance Backstab case, but another successful Advance can also eliminate a player: side-pushing the last enemy ACTIVE Soldier off-board.

Call chain:

- `resolveActivation` calls `resolveAction`.
- `resolveMove` delegates to `resolveActiveCollision`.
- `resolveActiveCollision` can mark the pushed Soldier `FALLEN` with reason `PUSHED_OFF_BOARD`, return `advanced: true`, and omit `terminalReason`.
- If no Backstab also happened, `resolveActivation` does not call `checkAndApplyMatchEnd` and continues to the next SoldierBrain cycle.

That violates the rule that the match ends immediately when one Player has zero ACTIVE Soldiers. It also allows a winning pusher to keep acting and potentially change the final outcome before the delayed activation-end check.

**Recommendation:** Run `checkAndApplyMatchEnd` after every resolved action, before continuing the activation loop. If it returns an outcome, append its events and return immediately. Pair this with idempotence for `checkAndApplyMatchEnd` so callers do not duplicate `MATCH_ENDED`.

**Resolution:** `resolveActivation` now runs an idempotent match-end check after every action-level transition. A regression test covers push-off-board victory and verifies no second SoldierBrain call occurs.

### WR-002: `MATCH_ENDED` can be emitted twice after activation-level match end

**Severity:** Warning
**Status:** Fixed
**File:** `packages/engine/src/match.ts`
**Lines:** 52-60, 151-156
**Requirements:** ENG-19, REPLAY-02 readiness

`checkAndApplyMatchEnd` does not guard `state.outcome`. If an activation already ended the match and emitted `MATCH_ENDED`, `runMatch` calls `checkAndApplyMatchEnd` again after `resolveRound`, recomputes the same zero-active outcome, and emits a second `MATCH_ENDED`.

This is especially likely after activation-start Backstab, post-advance Backstab, no-advance stoning, TURN_TO_STONE, or falling eliminates the last ACTIVE Soldier. Phase 3 Chronicle work will need a single terminal event, so this duplication would be easy to accidentally canonize in replay data.

**Recommendation:** Make `checkAndApplyMatchEnd` idempotent:

```ts
if (state.outcome) return { state, events: [] }
```

Then add a regression test asserting a full `runMatch` result has exactly one `MATCH_ENDED` event.

**Resolution:** Match-end helpers moved to `outcome.ts`, and `checkAndApplyMatchEnd` now returns no events for already-complete states. A regression test asserts `runMatch` emits exactly one terminal `MATCH_ENDED` event.

### IN-001: Match-end helpers live in a circular import chain

**Severity:** Info
**Status:** Fixed
**Files:** `packages/engine/src/activation.ts`, `packages/engine/src/match.ts`, `packages/engine/src/contraction.ts`
**Lines:** `activation.ts` 12-14, `match.ts` 6-13, `contraction.ts` 7-11

The current import graph has `activation -> match -> activation` and `match -> contraction -> match`. Tests pass today because the referenced exports are initialized before use in current execution paths, but the graph is fragile. Adding more top-level constants, derived helpers, or future Chronicle integration could turn this into a temporal-dead-zone failure or make module ownership harder to reason about.

**Recommendation:** Extract terminal match helpers into a small acyclic module, for example `outcome.ts` or `match-end.ts`, containing `checkImmediateMatchEnd`, `applyMatchOutcome`, and `checkAndApplyMatchEnd`. Then `activation`, `contraction`, and `match` can depend on that module without cycles.

**Resolution:** Added `packages/engine/src/outcome.ts` and updated `activation`, `contraction`, `match`, and tests to import terminal-state helpers from that acyclic module.

## Previously Fixed Findings

- Standard review WR-001: post-advance Backstab now checks match-end immediately.
- Standard review IN-001: off-board movement test now asserts the expected `MOVED_OFF_BOARD` fall reason.

## Positive Notes

- The state transition functions remain deterministic and side-effect free.
- Terminal match-end behavior is now centralized in `outcome.ts`, idempotent, and checked after each action transition.
- The post-advance Backstab, push-off-board victory, and single terminal event regression tests cover the lifecycle gaps found during review.
- The invariant and purity tests provide useful guardrails before the Chronicle phase.

## Resolution Verification

- `pnpm --filter @cowards/engine test` passed with 37 tests.
- `pnpm verify` passed.
