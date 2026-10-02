# Plan265-07 IPC error-preservation supplement — bounded independent recheck v2

## VERIFICATION PASSED

Date: 2026-10-02. Verdict: **0 BLOCKER, 0 WARNING** for the corrected
four-source-file repair supplement. This is a bounded recheck of the actual
v1 finding and retained execution restrictions, not a whole-phase or milestone
review, implementation pass, empirical verification or source-gate pass.

Checked unexecuted plan:
`265-07-IPC-ERROR-PRESERVATION-PLAN-v1.md`.
Exact raw SHA-256:
`994d3a68eaf63e16b2fcbc4fe0593ab160d5960622da323a71063ef1439e7a90`.
The correction is recorded in commit
`dbd6242bf708c6516d10a3775f5eb8535d6cc907`.

Original v1 report remains unchanged at raw SHA-256
`1e69ccae514d80fb6a7c1cb1e8482c44ab092aac3c1eb076d57e0f39c226c2b1`.
Its finding was genuine; this prospective correction resolves it in the plan,
not in source and not by reinterpreting the historical failed verification.

## Actual correction checked

| Required correction | Corrected executable plan content | Result |
| --- | --- | --- |
| Do not assume absent result validation | Strict mirror now explicitly requires local safe serialized-result validation | PASS |
| Exact failed result, no success/player payload | Exact `ok`, `violation`, `systemFailure` keys; `ok === false`; reject missing/surplus/null/arrays/success/player-violation shapes | PASS |
| Exact privacy-safe violation | Exact `type`, `message` keys and `INVALID_OUTPUT` / `Runtime system failure` values | PASS |
| Closed code, non-retryable | Exact `code`, `retryable` keys; string code in existing `SUBPROCESS_SYSTEM_FAILURE_CODES`; `retryable === false` | PASS |
| Narrow accounting exception | FAILURE only, final row/current pending effect, `charged === true`, `completed === false`, `outputBytes === 0` | PASS |
| No broad historical validation change | Explicitly restrict new safe-result guard to incomplete FAILURE branch; existing completed failures and completed/success replay untouched | PASS |
| Guard-reaching negative regressions | Step5 adds coherent-join unknown/missing/non-string codes, true/missing/non-boolean retryable, malformed/null failure, nonfalse ok, wrong/missing/surplus fields, success payloads and nonboolean charge/completion | PASS |

The corrected plan requires consuming/counting the final row and advancing
the provider ordinal exactly once without `runtime_resume`; replay stops at
`LAB_SUPERVISOR_FAILURE`. Existing completed prefix resumes, raw retained joins,
identity/provenance/request/method/input/ordinal/unique-root/output-byte guards,
no-trailing-accounting check, execution failure-code equality, empty failure
transitions and exact initial failure state remain mandatory. Result must remain
`issued: false` / `process_invalid`, with no payoff or success credit.

The IPC repair remains typed `SubprocessSystemFailure` plus the existing closed
allowlist, generic no-leak text, unchanged charge/completion/outputBytes/issued
provenance, no retry and no second charge/request. No new production injection
seam, dependency, diagnostic schema or cleanup-behavior change is permitted.

## Order, verification and scope remain intact

- Root's source hold was released after retained66301/PID88106 CLOSED exit1
  with `SERIOUS_LEAGUE_RETAINED_INVOCATION`. It must NEVER be rerun.
- A clean plan recheck and specific root execution dispatch precede source work.
  This clean recheck does not itself dispatch an executor or any live route.
- Both genuine synthetic RED regressions must be observed before production
  edits: real lean-session → selected ABI → executor → planner, and real
  `runCanonicalLabMatch` → NEW synthetic retained failure reopening, including
  first-effect and completed-prefix cases. Only new synthetic fixtures may be
  retained/reopened; the consumed v7 repositories cannot be rechecked.
- GREEN, owned whole-test-file verification, adjacent existing synthetic
  suites, strict types for all four source/test paths plus their import closure,
  independent code review and root's complete unchanged exact CI source gate
  remain required. Focused tests and historical gate proofs cannot replace
  the current final-source gate.
- Only `scripts/lib/v1-38-planner-supervised-runtime.ts`, its test file,
  `scripts/run-v1-38-serious-league.ts` and its test file are source-owned.
  `packages/strategy-lab/src/runtime-bridge.ts`, canonical engine/runtime,
  limits, budgets, policies, retry/accounting, public/counting/production,
  formation and holdout remain unchanged. Expansion beyond the four-file
  repair requires stopping and returning to root.

The correction resolves the only v1 blocker without increasing implementation
scope or changing dependency order. Original bounded project/context/tier and
source-gate checks remain applicable; no whole-phase Nyquist, research-question
closure or LEAG coverage is newly certified by this recheck.

## Read-only integrity check

The four source/test files and live bridge still have their original hashes:

| Path | Raw SHA-256 |
| --- | --- |
| `scripts/lib/v1-38-planner-supervised-runtime.ts` | `d3781ae5b2d3199ff717d69fd5deb252335ae0c2540fba5d77baec1a308ba609` |
| `scripts/lib/v1-38-planner-supervised-runtime.test.ts` | `d2e9f2616563d3dfeaba01b0d61fb88e1a50b7313c9b2af30f5a866ed4e3696b` |
| `scripts/run-v1-38-serious-league.ts` | `5d0d11b438aa8b0109d285a35f7b9cba0a499a1f3eb430c189895d58d297f6ec` |
| `scripts/run-v1-38-serious-league.test.ts` | `2268f4292b6206380290245ea272db6ffa87994cb238f52319987ad9bf2b559d` |
| `packages/strategy-lab/src/runtime-bridge.ts` | `b5115467be6086ef1b680aa64fb059d5ba8ed5ab3b68b512ed5bc3e018893514` |

Only this v2 report was created by this checker. No source/plan/debug edit,
imports, test, typecheck, source gate, retained verifier, runtime/Strategy/model
execution, Docker, capacity probe, allocation or commit was performed.

```yaml
issues: []
```

## Handoff

The corrected bounded plan is ready for root's specific source-only execution
dispatch. Implementation, observed RED/GREEN, post-execution independent review
and unchanged full source gate are still pending. V7 remains consumed
process-invalid: three charged cells, two successes and one failure. The actual
live inner transport cause and any future league success remain unproven.
No LEAG/freeze/formation/holdout or empirical/public/counting/production credit
follows from this plan-check pass; never rerun closed retained66301.
