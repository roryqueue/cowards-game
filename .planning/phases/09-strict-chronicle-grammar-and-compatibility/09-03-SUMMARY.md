# Plan 09-03 Summary: Semantic Event Grammar State Machine

**Status:** Complete
**Completed:** 2026-05-18

## Changed Files

- `packages/replay/src/grammar.ts`
- `packages/replay/src/grammar.test.ts`
- `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-03-PLAN.md`
- `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-03-SUMMARY.md`

## Requirements Satisfied

- GRAM-02: Added a pure post-Zod Chronicle grammar validator that rejects events before `MATCH_STARTED`, Round events outside an open Match, Activation/Cycle events outside open Round/Activation windows, duplicate `MATCH_ENDED`, events after `MATCH_ENDED`, and missing terminal `MATCH_ENDED`.
- GRAM-03: Enforced required context fields for Round, Activation, Cycle, Soldier, and player-scoped events with `CONTEXT_MISSING` and `CONTEXT_MISMATCH` failures.
- GRAM-03: Enforced payload/context consistency for Round numbers, self/actor Soldier payload events, Strategy evaluated player IDs, runtime owner/player fields, and cycle indices with `PAYLOAD_INCONSISTENT`.
- GRAM-08: Added corrupted negative grammar fixtures built from legal `buildChronicleFromMatch` output and verified canonical replay scenarios remain acceptable to the standalone grammar pass.

## Implementation Notes

- Added `validateChronicleGrammar(chronicle: Chronicle): ChronicleValidationError[]` in `packages/replay/src/grammar.ts`.
- Kept validation pure and bounded to Chronicle event/context/payload data; it does not execute Strategy source, query persistence, inspect hidden engine state, or integrate into `validateChronicle`.
- Preserved legal target-effect events by checking payload Soldier identity only for self/actor payload events; `SOLDIER_STONED` and `SOLDIER_FELL` can legally name affected Soldiers that differ from the acting Activation Soldier.

## Verification

- `pnpm --filter @cowards/replay test -- grammar.test.ts` - passed, 9 files / 97 tests.
- `pnpm --filter @cowards/replay typecheck` - passed.

## Blockers

- None.
