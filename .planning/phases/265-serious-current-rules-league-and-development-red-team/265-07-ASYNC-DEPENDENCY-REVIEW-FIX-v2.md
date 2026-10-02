---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
fixed_at: 2026-10-02T07:30:22Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-ASYNC-DEPENDENCY-REVIEW-v2.md
iteration: 2
fix_scope: critical_warning
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
base_commit: b58b8674e20d587dd6777eac410529891d27dbf7
source_commit: 0f4983bb9efa02f1e28dd281d3e064eaf625729b
two_file_diff_sha256: a18cc6d2c9be6e6484c587fd9bc4eb674cc35046b5419634bdebb5da025f9893
---

# Phase 265 Plan 07: Asynchronous dependency review fix report v2

One finding in scope, one fixed, zero skipped. Preserved review-v1/v2, fix-v1 and all earlier history. Only the runner and its test were changed; this new report is intentionally uncommitted.

## Fixed issues

### CR-03: Public runner failure publication replaces the initiating error

**Status:** fixed: requires human verification
**Commit:** `0f4983bb9efa02f1e28dd281d3e064eaf625729b`
**Files modified:** `scripts/run-v1-38-serious-league.ts`, `scripts/run-v1-38-serious-league.test.ts`

After the existing settlement gate, both development and independent response-job catches guard their secondary failure-record/terminal sequence and rethrow the original initiating object. The outer runner catch preserves its normal durable `process_invalid` result sequence; if per-start failure/terminal or final `run-failure` publication cannot complete, it rethrows that outer catch's initiating object. No head is fabricated, publication is not credited before durability, existing charges/residue are not refunded or overwritten, and no dispatch retry or new diagnostic payload was introduced.

Nine new tests call actual `runSeriousLeague`. Ordinary cases exercise persistent secondary faults, failure of the final `run-failure` write and normal successful failure-head retention. Development and independent-response cases each exercise transient failure-record faults, transient terminal faults and persistent secondary faults.

Both real dependency fsyncs are held, one rejects with A, secondary publication fault B is enabled and the sibling then settles. Assertions cover the pending gate, unchanged league/factory files, no early failure/terminal append or close, one injected guest call, both owned close attempts, conservative charges, no usable invocation, no returned forged head under failed outer retention, identical A at the public rejection and A rather than B in successfully durable failure heads.

Response prerequisites are explicitly synthetic: initial matrix/probe cell executions return inert DRAW terminals; prerequisite graph histories and probe validation are stubbed. Actual first-response authoring/admission, injected provider wrapping, graph retention and owned cleanup use the existing positive-response fixture and stop on the first retention failure. No submitted Strategy code, real runtime, Docker or model executes. These tests establish caller error handoff, not empirical matrix/probe validation or retained-history verification.

The logic-change status flag requests review of the corrected control flow, not a new operator-authorization checkpoint. Root owns independent exact-source rereview and the unchanged full source gate.

## Actual RED/GREEN and harness facts

| Check | Actual outcome |
| --- | --- |
| Ordinary public RED, `-t 'CR-03.*ordinary'` | 2 failed / 1 passed / 116 skipped, 11.55s: B replaces A; normal durable head passes |
| Reduced development transient-fault RED | 1 assertion failure / 118 skipped, 9.02s: durable failure head records B instead of A |
| Development/independent public RED, `-t 'CR-03.*(development\|independent)'` | 6 assertion failures / 113 skipped, 33.54s: four wrong durable error values and two wrong public error objects |
| First post-fix nine-case run | 6 passed / 3 default-5s fixture timeouts / 110 skipped, 40.95s; no semantic assertion failure |
| Final nine-case GREEN, `-t 'CR-03'` | 9 passed / 110 skipped, 41.58s |
| Final strict named runner/test types | exit 0 |
| Affected-source reread and whitespace check | intact; `git diff --check` exit 0 |

Initial response setup unnecessarily generated prerequisite histories and hit the unchanged default 5s test timer (11.33s command); that is a harness limitation, not RED evidence. Prerequisites were made explicitly inert, then the genuine six-response assertion RED above was obtained. The first post-fix run still crossed that timer in three cases. Fresh candidate admission was moved to a bounded `beforeEach` setup hook; no timeout or production limit was raised. The final nine-case run passes with the same 5s timers.

Final exact commands:

```sh
./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-serious-league.test.ts -t 'CR-03'
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts
git diff --check
```

Work ran in an owned temporary worktree at fixed base `b58b8674`, with existing root/package dependency directories linked and no installation. The installed GSD shim committed the complete source/test fix with its top-level `commit "<message>" --files <both paths>` command. No report commit or push occurred. Earlier iteration-1 suite/build results remain prior-source evidence; no broad suite/build, full gate, real route, capacity admission, preflight, retained verifier or profiler was rerun in this iteration.

## Exact repaired bytes

| File | Raw SHA-256 |
| --- | --- |
| `scripts/run-v1-38-serious-league.ts` | `a1c66f47e36c6b1fe88acc41b54481f1b6228b8b1f4cf8db9bceb2434ed0a786` |
| `scripts/run-v1-38-serious-league.test.ts` | `c3a3b505a0178ec2175c304d4bb8a8701081ac2e97085c1c0a39bbcc68df2fbe` |

The two-file diff hash in frontmatter is SHA-256 of raw `git diff b58b8674 HEAD --` followed by these paths in table order. Diff: 111 insertions/13 deletions. Repository publisher and response-runtime source/tests remain unchanged. No gameplay, resource, lifetime, capacity cadence, cache, ownership or authority contract changed. No completion, freeze or speedup claim follows.

_Fixer: gsd-code-fixer; iteration 2._

