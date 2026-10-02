---
phase: 265
plan: 07
type: source-only-repair-supplement
status: corrected-awaiting-independent-plan-recheck-and-execution-dispatch
date: 2026-10-02
tdd: true
empirical_authority: none
files_modified:
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
---

# Plan265-07 — bounded IPC preservation and strict failed-prefix replay

This is a supplement to the existing Plan07, not a new numbered plan or Phase.
It repairs two source-proven defects: classification loss and rejected live
failed-prefix retention. It does not identify the
actual v7 inner transport cause, remedy that cause, predict faster Matches, or
provide LEAG credit. v7 remains terminal, consumed and process-invalid: three
charged cells, two successes and one failure; terminal09:36:53.101UTC,
head a29c0522/resultcc4521c5. All older routes remain immutable.

## Entry gate and ownership

Root's ONE retained verifier66301/PID88106 is CLOSED exit1, observed09:57:22UTC,
with `SERIOUS_LEAGUE_RETAINED_INVOCATION`. Root explicitly sent
`SOURCE_HOLD_RELEASED`; this closes the historical fixed-main hold on
634b0e84/f942c33f/ae9b47ba. Never rerun that verifier or duplicate any live route.
No passing retained verification is claimed and v7 remains consumed.

Execution additionally requires independent plan check and root's specific
execution dispatch. Until both, only this supplement/debug documentation may
change: no source edits, imports/tests or execution. Only the four source files
listed above may be edited by the
repair executor. Preserve all other changes; do not create a competing executor.
Read AGENTS.md and the five required project planning files before implementation.
Read the debug session, existing planner source/tests, and the existing lean
session/ABI/executor/failure declarations needed for the real synthetic fixture.
Read the existing retained-kernel replay and failingHost test seam; reuse root's
strict-mirror explorer evidence rather than duplicate broad discovery.
Root handles independent plan check, post-execution review, final gate and commits.

## Established evidence and narrow fix

### Typed IPC classification

Reuse the source-only explorer evidence rather than repeat broad discovery:
selected v1.19 ABI adapter.execute propagates `SubprocessSystemFailure` through
executor197–205. Lean session strict outer/inner framing201,246–254 throws known
`MALFORMED_IPC`, `STDIO_CAP_EXCEEDED`, `SUBPROCESS_EXIT` or `SUBPROCESS_SIGNAL`;
runMethod260 poisons/rethrows. Planner121–127 catches all and assigns
`MALFORMED_IPC`, losing an existing internal classification.

Use the existing `SubprocessSystemFailure` type and existing known-code
declaration through a source-safe import. In the planner catch, preserve only
actual typed internal failures whose code is in that existing closed allowlist.
Do not trust structural `{ code }`, error.name, arbitrary strings, messages or
raw thrown values. Unrecognized/adversarial thrown values retain the existing
`MALFORMED_IPC` fallback. The result remains system failure, retryable false,
with the existing generic violation text. No diagnostic schema is introduced.

Charge/completion arithmetic, outputBytes, issued provenance, poisoning/closed
state, retry policy and cleanup ordering/behavior remain untouched. Preserve
the current generic privacy-safe message: never expose error.message, stack,
stderr, guest source, objective payloads, StrategyMemory or SoldierMemory.
Throwing cleanup could mask a primary error, but it is not the default root
cause; do not silently suppress cleanup failures or broaden this repair to
cleanup behavior. Escalate a demonstrated need to root instead.

### Strict live/retained failed-prefix mirror

Live `runCanonicalLabMatch` runtime-bridge56–61 pushes accounting, then rejects
`!completed` before `runtime_resume`; catch77 returns `LAB_SUPERVISOR_FAILURE`,
empty transitions and exact unchanged initial state. `replayRetainedKernel`847
unconditionally rejects that incomplete row, including expected charged failure
prefixes. Existing failingHost fixture828–834 always uses completedtrue and
hides the mismatch. Do not change runtime-bridge.ts or live admission behavior.

Keep all existing raw-retained joins, unique roots, identity, requestId, method,
input root, provider ordinal, charge, provenance and outputBytes bounds.
For COMPLETED executions, `completed === true` remains unconditional.
For FAILURE executions only, permit ONE incomplete row if it is the FINAL
accounting row at the current canonical pending effect, `charged === true`,
`completed === false`, and `outputBytes === 0`. Explicitly validate the exact
safe serialized result here; do not assume the current replay already has
these checks. Result has exactly `ok`, `violation`, `systemFailure`, with
`ok === false`. Violation has exactly `type`, `message`, equal to
`INVALID_OUTPUT` and `Runtime system failure`. System failure has exactly
`code`, `retryable`, with a string code belonging to existing
`SUBPROCESS_SYSTEM_FAILURE_CODES` and `retryable === false`. Reuse that
existing allowlist through a source-safe import in the owned league file.
Reject null, arrays, missing/surplus fields, unknown or malformed codes,
success payloads, player violations and retryable claims. Apply this NEW strict
result guard only to the incomplete FAILURE branch, never globally to existing
completed failures or completed/success replay. Count the consumed row and
advance its provider ordinal exactly as the
existing replay does for accounting; do NOT `runtime_resume` its failure output.
Set replay failureCode to `LAB_SUPERVISOR_FAILURE` and break.

For any completed prefix, retain all existing canonical pure steps and resumes
up to the pending failed effect, then stop without producing a payoff. Keep
no-trailing-accounting858, execution.failureCode859 equality, failure
classification, empty transitions and exact initial state834, and all provenance
guards before success. The verified synthetic failed result remains issuedfalse
and process_invalid. This is strict replay parity, not weaker successful
completion/admission or new failure success credit.

## TDD execution after independent plan check and root dispatch

1. RED A — add a regression in the owned planner test file using the real
   synthetic lean session → selected ABI bridge → executor → planner chain.
   Inject bounded in-memory transport output (no actual subprocess, Strategy
   execution, Docker or real Match): a valid outer response with nonzero
   subprocess status must reach the planner as `SUBPROCESS_EXIT`, not
   `MALFORMED_IPC`. Confirm the regression fails at that classification assertion
   before changing production code, and record the command/test/failure.
2. RED B — add an existing failingHost variant in the owned serious-league
   test file using real `runCanonicalLabMatch` with synthetic completedfalse
   accounting. Retain and reopen only this NEW synthetic failure; expect a
   structured issuedfalse/process_invalid failure without a throw. The old
   verifier's `SERIOUS_LEAGUE_RETAINED_INVOCATION` must make that expectation
   RED. Record the failed assertion. Cover first-effect and completed-prefix failure paths
   through the canonical pending-effect sequence, with no Strategy execution.
   Never reopen, rerun, repair or reinterpret the actual consumed v7 repositories.
3. GREEN — after both observed REDs, apply only typed allowlisted-code
   preservation in planner source and the strict final-incomplete failure-row
   mirror in serious-league source. Run both focused regressions to GREEN.
4. IPC guardrails — assert generic violation text/no payload leakage,
   `retryable: false`, unchanged first-call charge/completion/outputBytes/issued values,
   and second-call refusal with no second charge or transport request. Add
   bounded known signal/stdio-cap cases through existing synthetic seams and
   adversarial unknown/forged-error fallback cases. Preserve existing malformed
   framing rejection; a valid outer envelope must not bypass strict inner
   validation. No production injection seam or new dependency is needed.
5. Retained guardrails — rejection tests must cover incomplete accounting in
   a COMPLETED execution; incomplete oktrue/success or player_violation;
   trailing accounting; wrong requestId, method, input root, provider ordinal,
   joined/unique root, or uncharged row; wrong execution failureCode;
   noninitial failure state or nonempty failure transitions. Add coherent-join
   rejection cases for unknown/missing/non-string code;
   true/missing/non-boolean retryable; malformed/null systemFailure; nonfalse
   ok; wrong/missing/surplus violation or systemFailure fields; forbidden
   success payloads; and nonboolean charged/completed. Each case must reach
   the new explicit safe-result/incomplete guard rather than incidental schema
   or raw-join rejection. Existing completed failure fixtures retain their
   existing behavior; do not apply the new allowlist restriction globally.
   Preserve existing positive completed fixtures and all strict provenance tests. Each denial
   must reach and exercise its intended guard rather than fail incidentally at
   fixture admission. No malformed failure may create positive payoff/credit.
6. Focused verification — run both entire owned test files, adjacent
   existing synthetic lean-session/ABI/executor suites as applicable, and
   strict affected-file TypeScript checking for all four edited paths plus
   their existing import closure. Confirm a four-source-file diff only.
7. Independent review — root dispatches review of type identity/allowlist,
   privacy, charging/completion, no-retry/closed state and import boundaries;
   strict completed/failure branches, canonical pending-effect parity and raw
   retained joins. Repair findings only within the same checked scope;
   otherwise return to root.
8. Final unchanged source gate — root must run the existing complete, exact
   CI league/factory/runtime suite list with one worker, separate retained
   tactical-corpus suite, strategy-lab build, strict affected-script types,
   all three private boundary scans and service checker. Do not trim or replace
   the existing gate with focused regressions. The supplement's four-file
   strict check is additional coverage, not a replacement. Use current
   `.github/workflows/ci.yml` and the existing Plan07 source-gate procedure;
   `265-07-REPAIRED-SOURCE-GATE-v1.md` is historical proof, not a pass for this edit.

## Acceptance and stops

Acceptance requires observed RED then GREEN for both real synthetic call-chain
and canonical-kernel failed-prefix regressions, bounded known-code/fallback/
no-leak/no-second-charge and retained negative-forgery coverage, strict types,
independent review and the unchanged full source gate. Record actual outcomes
in the debug file; retain failed checks honestly. No speedup, live inner-cause
diagnosis, retained v7 repair, LEAG completion or successful league is implied.

No game rule, resource, lifetime120000ms, 2CPU/256MB, cache-off, budget, retry,
sandbox, schema, public/counting/production, formation or holdout change.
No new model/provider/Strategy/Match/live route, resource probe, capacity or
retained verifier is part of this source repair. Any later distinct fresh
same-bounds route remains root-owned and requires its own final-source identity,
applicable review/gate and fresh allocation/capacity conditions; consumed routes
cannot be reused. Never rerun closed retained verifier66301. Stop and report
if the fix requires more than these four files
or any prohibited behavior.

## Independent plan-check correction

PLAN-CHECK-v1 records one BLOCKER against original plan raw24739f7a: it correctly
found that the proposed incomplete branch assumed code/schema checks absent
from current replay. This unexecuted amendment adds the exact safe-result,
closed-code/non-retryable/strict-boolean guard and guard-reaching negatives
above. Source remains unchanged. A clean independent recheck is required
before execution. The original finding is preserved, not reinterpreted.
