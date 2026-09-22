---
phase: 265-serious-current-rules-league-and-development-red-team
fixed_at: 2026-09-22T00:27:52Z
source_base: f312f02d4db87bc10a25d11fc11e220edc302984
source_commit: 9c910d828776d9f1497493f72f6be775d09acc67
status: focused_fix_passed
---

# Phase 265 verification regression fix

The orchestrator's exact 29-suite gate on the preceding source finished with 268/269 tests and 28/29 suites passing in 1682.17 seconds. The sole failure was the existing `re-enters a measured positive response and reopens the whole loop (failure after accepted population growth: true)` case: the failed probe's durable `cell-result` had been appended, but `executedCells` was 68 rather than 69. That completed gate is the RED evidence; it was not repeated here.

`LeagueConnectedSession.execute()` evaluated success-only `normalizedGameplay(actual)` while constructing a compact return object before incrementing `executedCells`. A failed probe threw during that evaluation, after publication but before the charge count. Commit `9c910d828776d9f1497493f72f6be775d09acc67` now increments the scalar immediately after the durable `cell-result`, rejects a non-success terminal, then constructs the success-only return. The existing failure, charge, and retained-verification semantics remain in place; no expected count was lowered.

Focused GREEN verification on the committed source:

- `./node_modules/.bin/vitest run scripts/run-v1-38-serious-league.test.ts -t 'failure after accepted population growth: true' --reporter=dot`: 1 passed, 29 skipped; 134.62 seconds.
- `./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false`: exit 0.
- Strict affected script/test TypeScript check from `265-VALIDATION.md`, plus `git diff --check`: exit 0.

The test uses the existing injected fixture. No real Strategy/Match, model, private historical store, empirical allocation, rules change, or full gate was run in this repair. Independent source review and the final complete gate remain with the orchestrator.
