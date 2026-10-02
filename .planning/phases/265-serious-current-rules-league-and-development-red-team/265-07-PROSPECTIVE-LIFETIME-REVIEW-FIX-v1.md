---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
supplement: prospective-lifetime-v1
fixed_at: 2026-10-02T15:59:53Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-PROSPECTIVE-LIFETIME-REVIEW-v1.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
expected_base: 4e87dd06fe729039f468b17dd4e46b0d2290d773
fixed_source_head: bb98878ec996ec63529093a45d9e55ed89e64610
source_acceptance: pending-independent-re-review-and-final-source-gates
empirical_requirements_complete: false
---

# Phase 265 Plan 07: Prospective Lifetime Review Fix Report

Three findings fixed in three ordinary atomic commits. No source acceptance, LEAG, freeze or empirical completion is claimed. This report is uncommitted for the root workflow.

## Fixed issues

### CR-01: Prospective-v2 silently disables existing tactical adaptation

**Status:** fixed: requires human verification
**Files modified:** `scripts/lib/v1-38-league-tactical-corpus.ts`, `scripts/lib/v1-38-league-tactical-corpus.test.ts`
**Commit:** a03ddd5579595f844fcbb9a3a80be1ec83cc8250
**Applied fix:** Select admitted prospective v1/v2 through the shared predicate; preserve tactical ordinals 0/3/6, development-only role, legacy false and non-job false. Existing inert recorded-cell fixture drives the pure kernel, retained current matrix/corpus reader, actual authoring and retained authoring verification. The regression checks profiled producer, 100-row selection, profile/source/envelope identity, missing/crossed target/corpus/envelope rejection, and missing-target failure. No Strategy source is executed.

The dependency correction is the authorized transitive scope deviation, not a new plan/rule/resource decision. The existing conservative source inventory already covers this production dependency; its corrected bytes must be included in root's final current-source identity.

### CR-02: Inherited constructor override bypasses prospective empirical restriction

**Status:** fixed: requires human verification
**Files modified:** `scripts/lib/v1-38-factory-supervised-runtime.ts`, `scripts/lib/v1-38-factory-supervised-runtime.test.ts`
**Commit:** d4457a00a28fc10643752d2a9cdc9512122ae484
**Applied fix:** Reject `"createRuntime" in supplied` on the empirical prospective branch before any source/constructor access. A test-only mocked admission classification issues real WeakMap empirical handles; inherited function, undefined and accessor cases observe zero getter/default-planner/injected-constructor calls and prove factory/planner claims remain unconsumed. Existing allowed fixture nested-claim tests remain green.

### WR-01: Response regression does not exercise actual lifetime wiring

**Status:** fixed
**Files modified:** `scripts/lib/v1-38-league-response-runtime.ts`, `scripts/lib/v1-38-league-response-runtime.test.ts`
**Commit:** bb98878ec996ec63529093a45d9e55ed89e64610
**Applied fix:** The existing private injected host observes the same constructor options as the real response host (with its existing fixture-only executable identity). Through actual `produceLeagueResponse`, nine synthetic cells capture 18 mock providers after returned retained Match charges, then stop at the existing pre-dispatch seam. Both sides and score/independence-left/independence-right are covered, including equal-source independence-right self-play, distinct provider handles/seats, measured red-team start versus opposing charge attempt root, Match/container/allocation/source bindings, exact 600000 lifetime options and both once-only claims. Refused response-match-start retention yields zero providers/runs/closes. The separate 72-condition enumeration remains intact.

## Verification actually performed

Tier 1 rereads and `git diff --check` passed for all modified sections. No full test suite/source gate was run.

Commands run from `/tmp/sv-265-reviewfix-7HDF2L` using existing workspace dependency symlinks; no installation.

- Factory focused GREEN session34804, exit0: 9 tests.
  `./node_modules/.bin/vitest run --maxWorkers=1 scripts/lib/v1-38-factory-supervised-runtime.test.ts -t 'prospective lifetime'`
- Tactical final GREEN session66692, exit0: 4 focused tests, 145.22s total. This includes actual profile emission/retained joins using inert records, not a live provider or Match.
  `./node_modules/.bin/vitest run --maxWorkers=1 scripts/lib/v1-38-league-tactical-corpus.test.ts -t 'prospective lifetime'`
- Defect-restoration RED session72814, exit1: exactly 5 expected failures (v2 selector empty; three inherited constructor source touches; missing actual response lifetime options), 1 refused-retention pass. Only the old predicate/own-property check and omitted lifetime-options mutation were temporarily applied; all mutations were restored before commits.
- Restored GREEN session73198, exit0: 6 tests.
  RED/GREEN command:
  `./node_modules/.bin/vitest run --maxWorkers=1 scripts/lib/v1-38-league-tactical-corpus.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-league-response-runtime.test.ts -t 'prospective lifetime (v1/v2|empirical|actual)'`
- Final response GREEN and production strict types session44083, exit0: response 6 tests; TypeScript produced no errors. Response final source options were reread before commit.
  `./node_modules/.bin/vitest run --maxWorkers=1 scripts/lib/v1-38-league-response-runtime.test.ts -t 'prospective lifetime'`
  `./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/lib/v1-38-league-tactical-corpus.ts scripts/lib/v1-38-league-prospective-lifetime.ts scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.ts scripts/run-v1-38-serious-league.ts scripts/lib/v1-38-league-response-runtime.ts`

Earlier scaffolding failures were test-only: session59791 lacked workspace package resolution; 30639 required the factory-directory prefix; 81330/72353/27726 corrected unordered/canonically ordered solver fixture data; 44911 corrected removal of solver typed-array transport from retained canonical fixture serialization. The response assertion in31736 incorrectly passed the mock's whole identity to a narrow runtime binding; corrected before GREEN. No failed fixture was committed. Strict types94426 also passed before the final fixture-only constructor-options factoring.

The GSD CLI's queried command was unsupported; its direct commit invocation did not stage positional files. Scoped ordinary `git add` plus `git commit` succeeded without hooks disabled. Exactly three fix commits exist; no failed changes or unrelated source modifications remain.

## Handoff and remaining gates

Expected base: `4e87dd06fe729039f468b17dd4e46b0d2290d773`.
Isolated branch: `gsd-reviewfix/265-6091`.
Isolated path: `/tmp/sv-265-reviewfix-7HDF2L`.
Final source head: `bb98878ec996ec63529093a45d9e55ed89e64610`.
Only the six source/test files listed above changed. Source worktree is clean; the only intended uncommitted artifact is this report. Main's pre-existing untracked history, empty consumed v8 result and locks were preserved. No push, new allocation, real provider/Docker/model/Strategy execution, capacity observation, empirical Match or retained verifier was launched.

Root must independently re-review the exact final source, run its single full eight-command fixed-source gate with applicable scoped regressions/build, and commit this report separately. Only later independently accepted source, a fresh immutable allocation and fresh passing same-process capacity can admit a distinct private route. Existing legacy/v1/diagnostic/benchmark meanings and all other bounds, durability, cleanup, privacy, unopened holdout and freeze-before-formation gates remain unchanged.

No issues skipped.

_Fixer: gsd-code-fixer; iteration 1._

