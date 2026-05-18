---
phase: "02-pure-rules-engine"
status: passed
verified_at: "2026-05-17T23:10:50Z"
score: "23/23 requirements verified"
requirements:
  ENG-01: verified
  ENG-02: verified
  ENG-03: verified
  ENG-04: verified
  ENG-05: verified
  ENG-06: verified
  ENG-07: verified
  ENG-08: verified
  ENG-09: verified
  ENG-10: verified
  ENG-11: verified
  ENG-12: verified
  ENG-13: verified
  ENG-14: verified
  ENG-15: verified
  ENG-16: verified
  ENG-17: verified
  ENG-18: verified
  ENG-19: verified
  ENG-20: verified
  ENG-21: verified
  TEST-01: verified
  TEST-02: verified
---

# Phase 2 Verification: Pure Rules Engine

## Verdict

Passed. The Phase 2 goal, "Implement the canonical deterministic game engine and rule test suite," is achieved in the codebase. I found substantive, wired engine implementation for initial state, round/activation flow, runtime input boundaries, movement, push, Backstab, contraction, match end, full match execution, and purity enforcement. No blocking gaps were found.

This is an initial verification; no previous `02-VERIFICATION.md` existed.

## Goal Check

| Roadmap success criterion | Status | Evidence |
| --- | --- | --- |
| Engine can run a Match from deterministic inputs using a fake in-process StrategyRuntime. | verified | `runMatch` creates initial state, loops Rounds 1-4 plus contraction, accepts synchronous `StrategyRuntime`, and returns sequenced events in `packages/engine/src/match.ts:91`; fake runtime lives in `packages/engine/src/test/fake-runtime.ts`; golden tests run twice with the same seed in `packages/engine/src/match.test.ts:22`. |
| Unit tests cover initialization, activation selection, MOVE, TURN, TURN_TO_STONE, reversal, collision, push, Backstab, Contraction, and end conditions. | verified | Coverage is split across `state.test.ts`, `activation.test.ts`, `movement.test.ts`, `backstab.test.ts`, `contraction.test.ts`, and `match.test.ts`. |
| Invariant/property tests cover occupancy uniqueness, bounds validity, status semantics, and deterministic ordering. | verified | `invariants.test.ts` checks occupancy uniqueness and repeated deterministic outputs; contraction tests cover bounds/status transitions; activation/match tests cover deterministic ordering and event sequence. |
| Engine package has no database, network, filesystem, clock, UI, or `Math.random` dependency. | verified | Production grep for forbidden APIs/imports returned no matches; automated purity test scans production source in `packages/engine/src/purity.test.ts:32`. |

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/engine/src/state.ts` | Canonical initial state creation | verified | Uses spec starting positions, 12x12 bounds, player IDs, facings, seed-derived initiative, and no randomness at `state.ts:60`. |
| `packages/engine/src/types.ts` | Pure engine state/runtime/transition types | verified | Defines `GameState`, `StrategyRuntime`, `RuntimeResult`, and transition event contracts. Runtime interface is synchronous. |
| `packages/engine/src/runtime-inputs.ts` | Runtime-facing selectors | verified | Builds schema-validated `StrategyInput`, `SoldierBrainInput`, and 5x5 awareness grid at `runtime-inputs.ts:77` and `runtime-inputs.ts:101`. |
| `packages/engine/src/activation.ts` | Activation counts, filtering, cycle loop, no-advance cleanup | verified | Implements snake order, selection filtering, runtime violation handling, 12-cycle loop, Backstab boundaries, and no-advance stoning. |
| `packages/engine/src/movement.ts` | TURN, TURN_TO_STONE, MOVE, reversal, collisions, push | verified | Implements action resolution, off-board fall, terrain/stone blocks, head-to-head block, same-direction block, side push, push-off-board, and post-advance Backstab. |
| `packages/engine/src/backstab.ts` | Backstab pair finding and simultaneous resolution | verified | Checks all ACTIVE Soldiers and stones unique victims from the snapshot at `backstab.ts:16` and `backstab.ts:38`. |
| `packages/engine/src/contraction.ts` | Contraction and final 2x2 resolution | verified | Shrinks bounds, falls out-of-bounds ACTIVE/STONE Soldiers, removes terrain stones, and resolves final 2x2 outcome. |
| `packages/engine/src/outcome.ts` | Immediate match-end checks | verified | Counts only ACTIVE Soldiers and applies WIN/DRAW at `outcome.ts:5`. |
| `packages/engine/src/match.ts` | Public full match runner | verified | Exports `runMatch`, aggregates events, uses max phase guard, and returns final state/events. |
| `packages/engine/src/*.test.ts` | Rule, invariant, golden, and purity tests | verified | Engine suite contains 8 test files and 38 passing tests. |
| `.planning/spec-amendments/02-backstab-rule.md` | Backstab clarification | verified | Records position-triggered/simultaneous Backstab and pushed-Soldier behavior. Root and Downloads copies of the consolidated spec also contain the amendment text. |

## Requirements Coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| ENG-01 | verified | `createInitialGameState` uses `BOTTOM_STARTING_POSITIONS`, `TOP_STARTING_POSITIONS`, facings UP/DOWN, 16 Soldiers, and spec bounds in `state.ts:60`; tested in `state.test.ts`. |
| ENG-02 | verified | `runMatch` iterates Rounds 1-4 then calls `resolveContraction` at `match.ts:98`; `advanceRound` wraps 4 to 1 at `match.ts:20`. |
| ENG-03 | verified | `ROUND_ACTIVATION_COUNTS` drives state initialization, `getActivationCountForRound`, `advanceRound`, and `runMatch`. |
| ENG-04 | verified | `getRoundPlayerOrder` implements interleaved snake order at `activation.ts:39`; initiative is seed-derived in `state.ts:27` and alternated in `match.ts:26`. |
| ENG-05 | verified | Selection results are schema-validated, runtime violations produce no orders, and `validOrders` skips duplicates, inactive/missing Soldiers, and excess orders at `activation.ts:55`; tested in `activation.test.ts:41`. |
| ENG-06 | verified | SoldierBrain invocation is limited to 12 cycles and receives schema-validated self, 5x5 awareness grid, cycle metadata, objective, and SoldierMemory via `runtime-inputs.ts:101` and `activation.ts:230`. |
| ENG-07 | verified | TURN updates facing, emits `TURN_RESOLVED`, and does not Advance in `movement.ts:50`; tested in `movement.test.ts:42`. |
| ENG-08 | verified | TURN_TO_STONE immediately stones and terminates activation in `movement.ts:66`; tested in `movement.test.ts:54`. |
| ENG-09 | verified | Successful MOVE updates position, facing, and `lastSuccessfulMoveDirection` in `movement.ts:217`; tested in `movement.test.ts:66`. |
| ENG-10 | verified | Immediate reversal is blocked before movement in `movement.ts:182`; tested in `movement.test.ts:78`. |
| ENG-11 | verified | Off-board MOVE makes mover FALLEN with `MOVED_OFF_BOARD` in `movement.ts:197`; tested in `movement.test.ts:91`. |
| ENG-12 | verified | TerrainStone and STONE Soldier movement blocks are implemented in `movement.ts:209` and `movement.ts:230`; tested in `movement.test.ts:111`. |
| ENG-13 | verified | Head-to-head collision blocks without push or Backstab in `movement.ts:88`; tested in `movement.test.ts:136`. |
| ENG-14 | verified | Side push, blocked push, and push-off-board are implemented in `movement.ts:121`; same-direction active collision is explicitly blocked; tests cover side push and blocked/off-board push. |
| ENG-15 | verified | Backstab runs at activation start/end and post-advance, checks all ACTIVE Soldiers, handles simultaneous/mutual/multi-victim cases, and can follow pushed movement; tested in `backstab.test.ts`. |
| ENG-16 | verified | Activation loop stones ACTIVE Soldiers that end without Advancing at `activation.ts:325`; tests cover no-advance stoning and Advance protection. |
| ENG-17 | verified | `resolveContraction` shrinks bounds and falls out-of-bounds ACTIVE/STONE Soldiers at `contraction.ts:42`; tested in `contraction.test.ts:63`. |
| ENG-18 | verified | `resolveContraction` filters terrain stones to new bounds at `contraction.ts:66`; tested in `contraction.test.ts:63`. |
| ENG-19 | verified | `checkImmediateMatchEnd` returns WIN or DRAW when ACTIVE counts reach zero at `outcome.ts:5`; tests cover win/draw and immediate activation endings. |
| ENG-20 | verified | `checkFinalTwoByTwoResolution` compares ACTIVE counts and returns WIN/DRAW at `contraction.ts:21`; tested in `contraction.test.ts:93`. |
| ENG-21 | verified | Production engine imports only spec/local modules and forbidden API grep returned no matches; `purity.test.ts` enforces the same scan. |
| TEST-01 | verified | Unit suites cover initialization, activation, runtime boundary, movement/collision/push, Backstab, contraction, match end, and full match runner. |
| TEST-02 | verified | Invariant/property-style coverage exists for occupancy uniqueness, FALLEN occupancy semantics, deterministic transition output, contraction bounds, and deterministic match ordering. |

## Integration/Data Flow

| Flow | Status | Evidence |
| --- | --- | --- |
| Spec constants -> initial engine state | verified | `state.ts` imports constants/schemas from `@cowards/spec` and does not hardcode starting positions. |
| Engine state -> StrategyRuntime selection | verified | `resolveActivationSelection` calls `runtime.selectActivations(createStrategyInput(...))`, validates `StrategyResultSchema`, updates StrategyMemory, and filters orders. |
| Engine state -> SoldierBrain cycles | verified | `resolveActivation` builds `SoldierBrainInput` every cycle, validates outputs, writes SoldierMemory, resolves emitted action, and checks match end. |
| Action resolution -> Backstab -> match end | verified | MOVE/push calls post-advance Backstab; activation start/end call Backstab boundaries; `checkAndApplyMatchEnd` runs after Backstab and actions. |
| Round loop -> contraction -> next phase/end | verified | `runMatch` drives Rounds 1-4 and `resolveContraction`; contraction applies final 2x2 resolution or increments `phaseNumber`. |
| Test/runtime utilities -> engine package boundary | verified | `packages/engine` production source does not import `@cowards/test-utils`; fake runtime is under engine test-only path. |

## Automated Checks

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm --filter @cowards/engine test` | passed | 8 test files, 38 tests passed. |
| `pnpm --filter @cowards/engine typecheck` | passed | `tsc -b` exited 0. |
| `pnpm verify` | passed | Format, lint, typecheck, and all package tests passed. Engine test log reported 8 files and 38 tests. |
| `rg "Math\\.random|Date\\.now|new Date\\(|fetch\\(|from ['\\\"]fs|from ['\\\"]node:fs|process\\.env|postgres|redis|@cowards/test-utils|@cowards/runtime|apps/|prisma|db\\." packages/engine/src packages/engine/package.json --glob '!*.test.ts' --glob '!test/**'` | passed | No production matches. |
| Anti-pattern scan for TODO/FIXME/placeholders/empty returns/console.log | passed | No blocking implementation stubs found. Matches were benign: README text, `return []` in test purity scanner, `return null` in `getBehindSquare` for non-positioned Soldiers. |

## Residual Risk

The invariant suite is table-driven rather than generative. This is consistent with Phase 2 planning, which explicitly avoided adding a property-test dependency, and it is backed by focused rule tests plus full match deterministic tests. It is not a blocking gap for Phase 2.

The Backstab rule implemented here follows the Phase 2 amendment, which supersedes the original narrower "after each successful Advance" wording. The amendment exists in `.planning/spec-amendments/02-backstab-rule.md` and in both consolidated spec copies found during verification.

## Gaps Summary

No blocking gaps found. Phase 2 has the required engine artifacts, they are wired through the public `runMatch` path, requirement coverage is present for ENG-01 through ENG-21 plus TEST-01 and TEST-02, and the automated checks pass.

---

_Verified: 2026-05-17T23:10:50Z_
_Verifier: the agent (gsd-verifier)_
