---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "145"
fixed_at: 2026-08-31T21:53:16Z
review_path: independent Plan 262-145 code review
iteration: 2
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 262 Plan 145: Code Review Fix Report — Iteration 2

The iteration-2 BLOCKER was repaired without running any operational producer, live, preflight, calibration, Match, holdout, private-canonical, or public/canonical action. The four iteration-1 fixes remain in history.

## Fixed Issue

### BLOCKER-05: Persistent wrapper marker allowed producer reentry

The live wrapper no longer creates the invocation marker. After authenticating the committed review, the actual producer boundary now atomically creates the exact report/source-bound marker with `O_EXCL`, verifies it, and only then may acquire ownership or create effects. Concurrent calls admit exactly one claim; sequential calls and calls after bootstrap failure reject before ownership/effects. Commits: `873d9f3a`, `06beb256`.

## Iteration 1 history

### BLOCKER-01: Independent review could be supplied uncommitted

Resolved the exact committed Plan 146 report commit/blob, compared no-follow working bytes with that blob, required report ancestry from the reviewed source commit, and bound report identity into authentication and the durable invocation marker. Commits: `815b98a4`, `c3eb164b`, `327ed926`, `6fd67e32`.

### BLOCKER-02: Producer API bypassed review and one-invocation custody

Removed live producer bypass options. The producer now internally authenticates committed review custody and the exact invocation marker before ownership or effects. Commits: `815b98a4`, `c3eb164b`.

### BLOCKER-03: Native transaction failure did not join bounded shutdown

Invalidation and release now share one bounded shutdown promise, await close, escalate to `SIGKILL` after the grace bound, and clean only after close. Producer cleanup preserves the original transaction exception and attaches shutdown uncertainty. Commits: `9dac0a94`, `2482f420`, `c3eb164b`.

### BLOCKER-04: Post-run custody accepted arbitrary or hybrid state

Producer-terminal state now uses the strict journal/private-receipt/terminal/reproduction validator. Retired Plan 94 state and raw/retired hybrids fail closed until the exact Plan 94 committed checker exists. Commits: `815b98a4`, `c3eb164b`.

## Source-bound artifact correction

The inactive envelope and seal were resealed in `c3f575f2` after exact source commit `06beb2565c94c12b99078f3fa4eff8eeeccf1a56`. They remain non-authorizing. Plan 146 review is absent, so the committed-review gate cannot authenticate.

## Verification

- Native custody: 5/5 passed.
- Model and producer: 11/11 passed.
- Live-v15: 7/7 passed.
- Combined affected suites: 23/23 passed.
- Targeted TypeScript output: zero errors in the five affected v4/native/bootstrap source entries; unrelated legacy errors remain outside scope.
- Exact envelope/seal/source manifest recomputation and `git diff --check`: passed.

_Fixer: gsd-code-fixer_
