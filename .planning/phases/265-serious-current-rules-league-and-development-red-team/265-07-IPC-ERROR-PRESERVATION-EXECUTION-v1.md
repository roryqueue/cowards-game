---
phase: 265
plan: 07
type: source-only-repair-execution-proof
status: bounded-source-proof-passed-root-full-gate-pending
date: 2026-10-02
source_head: a98b5c2b
checked_plan_raw_sha256: 994d3a68eaf63e16b2fcbc4fe0593ab160d5960622da323a71063ef1439e7a90
empirical_authority: none
---

# Plan265-07 IPC preservation — actual bounded execution proof v1

This records only the dispatched, independently plan-checked supplement. It
does not complete Plan07, Phase265 or any LEAG requirement. The unique whole
owned test run closed exit0 with152/152 tests at fixed source `a98b5c2b`.
Root's independent source review and full-gate-helper static review are clean,
recorded separately in root's `e04e92dc`. Root owns the still-pending unchanged
complete source gate and all planning-state updates. No actual retained
repository, live route or closed verifier was run.

## Scope and observed RED gates

Execution began from main `d03ece59` after root's explicit
`SOURCE_HOLD_RELEASED` and bounded execution dispatch. The plan raw hash was
checked locally against the independent PLAN-CHECK-v2 PASS. Only the four
listed source/test files changed; all other changes and pre-existing untracked
files were preserved. No worktree was created.

Before **either** production edit, these genuine synthetic regressions failed:

```sh
pnpm exec vitest run scripts/lib/v1-38-planner-supervised-runtime.test.ts -t 'preserves typed subprocess exit' --maxWorkers=1
```

Exit1, one failed/19 skipped, duration3.83s. Expected `SUBPROCESS_EXIT`, received
`MALFORMED_IPC`, with `retryable:false`. The bounded in-memory frame traversed
the real lean session, selected ABI, executor and planner. No subprocess,
Docker or Strategy was executed.

```sh
pnpm exec vitest run scripts/run-v1-38-serious-league.test.ts -t 'reopens a NEW synthetic charged incomplete' --maxWorkers=1
```

Exit1, two failed/119 skipped, duration9.42s. Both first-effect and
two-completed-effect NEW synthetic failures reached actual
`runCanonicalLabMatch` and retention, then reopening threw
`SERIOUS_LEAGUE_RETAINED_INVOCATION`. Both failures were observed before any
production change; their RED commits precede both GREEN commits.

## Minimal repair and committed source

| Commit | Actual change |
| --- | --- |
| `5c9be891` | RED: real synthetic typed-exit classification regression |
| `0f1d4fb4` | RED: canonical first-effect/completed-prefix retained regressions |
| `5bfcfbc4` | GREEN: preserve only actual typed internal failures in the existing closed subprocess-code allowlist |
| `e17671a6` | GREEN: strict final incomplete FAILURE row mirror, count/advance once without runtime resume |
| `b293ca74` | Synthetic IPC classification/fallback/privacy/no-second-charge guards and owned test typing |
| `a98b5c2b` | Coherently joined retained negative matrix and owned exact-optional fixture annotations |

The production diff contains only the safe existing-type/allowlist imports,
typed catch classification and the final-incomplete retained branch. Generic
violation text, non-retryable disposition, charge-before-dispatch, completion,
output bytes, issued provenance, poisoning and cleanup remain unchanged.
Existing completed failures are not subjected to the new serialized-result
allowlist. When replay runs, completed effects require `completed === true`:
always for empirical execution and for failure/non-all-success execution.
The pre-existing nonempirical injected completed-all-success fixture shortcut
remains unchanged; this is not a universal claim about those exempt fixtures.

The incomplete exception requires FAILURE, final accounting row/current
pending canonical effect, strictly true charge, strictly false completion,
zero output bytes and exact safe result/violation/systemFailure keys and
values. Its code must be a string in the existing subprocess allowlist and
retryable must be exactly false. The consumed row is counted once without
`runtime_resume`; failure remains `LAB_SUPERVISOR_FAILURE`, issuedfalse,
process_invalid, empty transitions, exact initial state and null payoff.

## Actual focused and synthetic-adjacent verification

```sh
pnpm exec vitest run scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/run-v1-38-serious-league.test.ts -t 'preserves typed subprocess exit|reopens a NEW synthetic charged incomplete' --maxWorkers=1
```

Exit0, three passed/138 skipped, duration11.52s after the minimal source repair.

```sh
pnpm exec vitest run scripts/lib/v1-38-planner-supervised-runtime.test.ts --maxWorkers=1
```

Exit0, all31 passed, duration4.29s. Guards cover exit/signal/stdio-cap/spawn,
malformed outer correlation and strict inner frames, unknown errors, forged
structural code/name and unknown typed code. Exact privacy-safe generic result,
non-retryablefalse, chargedtrue/completedfalse/outputBytes0/ordinal0, exact-object
issuance, one accounting row and second-call refusal without another transport
request/control call are checked.

The expanded retained regression command above subsequently passed two/119
skipped, duration46.12s. Coherent raw/accounting joins are explicitly reopened
and verified before safe-result negatives. Coverage includes unknown/missing/
non-string code, true/missing/nonboolean retryable, malformed/null/array/missing/
surplus failure or violation, nonfalse/missing ok, forbidden success payloads,
malformed result, strict accounting booleans and zero bytes. Additional exact
guard checks cover incomplete COMPLETED replay, requestId/method/input/ordinal,
duplicate consumed root, raw joined root mismatch, trailing accounting,
failure cause/classification, noninitial state and nonempty transitions. Every
existing allowlisted code also has a retained incomplete failure positive.

Two expanded-test runs initially failed honestly: the incomplete COMPLETED
negative lacked canonical transition records before its first pending effect
and failed incidentally at `SERIOUS_LEAGUE_CANONICAL` (durations38.10s and44.10s).
Adding a completed-shaped result alone was insufficient. The final fixture
supplies the exact pure canonical transition prefix and now reaches the intended
`RETAINED_INVOCATION` incomplete guard. No production change was made for this
fixture correction; the completed whole-suite proof follows below.

```sh
pnpm exec vitest run scripts/lib/v1-38-lean-container-match-session.test.ts -t 'private observer synthetic transport|selects the approved resources|multiplexes mixed methods|poisons on stream timeout|requires exact absence|keeps separate streams' --maxWorkers=1
pnpm exec vitest run packages/runtime-js/src/executor.test.ts -t 'runtime guard helpers|uses a supplied adapter|keeps the legacy nested Match executor|executes the selected v1.19 ABI|keeps executable runtime APIs|does not use Node vm' --maxWorkers=1
```

Exit0: lean14 passed/46 skipped, duration3.23s; executor9 passed/20 skipped,
duration2.12s. These are deliberately synthetic-only selections. Adjacent
broker/Worker/Strategy-executing cases were not run under this repair's bounds;
no whole adjacent-suite pass is claimed.

## Typecheck — initial failure and project-matching strict pass

The initial command used the CI-style script flags plus all four owned paths:

```sh
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/lib/v1-38-planner-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts
```

Exit2: existing `feasibility-protocol.ts:52` JsonValue union diagnostic;
`planner/missions.ts:52,60,66,68,69` undefined SoldierSnapshot diagnostics;
owned planner-test adapter-id widening and deliberately invalid ABI literal
typing. The same eight diagnostics were reproduced on unchanged `634b0e84`
in isolated `/tmp/cowards-ipc-baseline.UwuZ8h`, with archived scripts/packages
and existing dependency symlinks. Baseline exit2 is NOT a pass.

Comparing `tsconfig.base.json` established the configured additional strict
flags `noUncheckedIndexedAccess:true` and `exactOptionalPropertyTypes:true`.
Using them eliminated the import-closure inference diagnostics without any
out-of-scope edits. It also exposed two existing owned league-test optional
fixture annotations; those and the owned planner-test annotations were repaired
without changing their test behavior or any dependency.

```sh
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --types node --skipLibCheck scripts/lib/v1-38-planner-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts
```

Exit0 for all four edited paths and their existing import closure. This adds
the repository's configured strictness; no flag was weakened. Root's separate
unchanged14-script CI check remains required and was not run by this executor.

## Whole owned-file run and remaining root gates

```sh
pnpm exec vitest run scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/run-v1-38-serious-league.test.ts --maxWorkers=1
```

Unique session62868 CLOSED exit0. Actual Vitest output:

```text
Test Files  2 passed (2)
     Tests  152 passed (152)
  Start at  06:26:08
  Duration  1503.99s (transform 2.16s, setup 0ms, import 5.26s, tests 1498.32s, environment 0ms)
```

The printed start is local EDT (10:26:08UTC). This was the one whole owned-file
run; no duplicate was started. The four source/test files remain byte-identical
to committed `a98b5c2b`. Root reported its independent source review and NEW
full-gate-helper static review clean and committed only its reviews/frontdocs
at `e04e92dc`; that descendant did not change these source files. The exact
unchanged full source gate remains required before acceptance and was not run
by this executor. Focused, owned whole-file and historical proof cannot replace it.

## Boundaries and self-check

`git diff --check` passes. Diff from dispatch base `d03ece59` through
`a98b5c2b`: exactly four source/test files,176 insertions/8 deletions; no tracked
file deletion. No missing implementation stub or newly introduced endpoint,
auth path, schema, filesystem/network capability or trust boundary was found
in the repair diff. This new execution record is the sole extra owned file.

No runtime-bridge, engine, production seam, dependency, schema, budget, retry,
accounting currency, 120000ms lifetime, 2CPU/256MB resource, cache-off, privacy,
public/counting, formation or holdout policy changed. No actual Strategy,
model/provider transport, Docker, Match, resource probe, capacity or retained
route ran. Pure canonical-kernel synthetic fixtures are source tests only.

V7 and retained66301 remain terminal and consumed; their historical failed
verification is not repaired or reinterpreted. The actual live v7 inner IPC
cause remains unproven. No speedup, successful league, LEAG/freeze credit,
formation/holdout opening or empirical/public/counting authority follows.

## Self-Check: PASSED

All four owned source/test files and this execution record exist. All six
listed RED/GREEN/guardrail commits resolve as commit objects. No source/test
diff exists against `a98b5c2b` after the unique whole run closed. `git diff --check`
passes; no tracked file was deleted. The preserved live bridge hash is
`b5115467be6086ef1b680aa64fb059d5ba8ed5ab3b68b512ed5bc3e018893514`.

| Fixed owned path | Raw SHA-256 |
| --- | --- |
| `scripts/lib/v1-38-planner-supervised-runtime.ts` | `021e8c5749bd0a2583208b7c8fcb9a76fb0c986557752a09845644ea88e5d5e6` |
| `scripts/lib/v1-38-planner-supervised-runtime.test.ts` | `2f913230d76202a6814f1e044fc778eee35fa1bf7ceb4d97c24d444c948f81ce` |
| `scripts/run-v1-38-serious-league.ts` | `f25d846e5ebc786e49d368a62bd60d52740a608f792061a020d8cff5856d573a` |
| `scripts/run-v1-38-serious-league.test.ts` | `4713cdbb32203c89f6ef15ec72e6d0cd1cb83d4350af3d8801866d12c0291217` |

No phase/progress counter or requirement checkbox was changed by this executor.
The source-only supplement proof is complete; Plan07/Phase265/LEAG and the
root-owned full gate are not declared complete by this record.
