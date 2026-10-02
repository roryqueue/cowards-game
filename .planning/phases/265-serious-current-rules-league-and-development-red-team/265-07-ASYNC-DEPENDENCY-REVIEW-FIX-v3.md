---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
fixed_at: 2026-10-02T07:42:28Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-ASYNC-DEPENDENCY-REVIEW-v3.md
iteration: 3
fix_scope: critical_warning
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
base_commit: 9387f3591bb65086b03a5a5a31d8a3e72212829e
source_commit: 634b0e84896132a1a9ac5d855763b0793abfe1bc
two_file_diff_sha256: 7abcfdf1575ca2da2864951d46cdd07bfcd59388126030c2df805f54e291a410
---

# Plan 265-07 asynchronous dependency repair: fix iteration 3

## CR-04: refuse a returned failure head after incomplete response failure evidence

Finding status: **fixed: requires human verification** (logic-change classification; bounded source-only tests passed, independent root rereview remains).

Files modified: `scripts/run-v1-38-serious-league.ts` and `scripts/run-v1-38-serious-league.test.ts`.

Atomic commit: `634b0e84896132a1a9ac5d855763b0793abfe1bc`, `fix(265): CR-04 refuse heads after incomplete response failure evidence`.

Added only a call-local `failureEvidenceFault` latch before the runner try. Either development or independent job secondary failure/terminal publication catch sets it. After the existing outer settlement gate, a latched run rethrows the identical initiating error, without retrying terminalization or publishing/returning a run-failure head. Already charged work, retained prefix and failed residue remain conservative. Uninterrupted normal failure publication remains unchanged. No publisher, response-runtime, resource, lifetime, capacity cadence, ownership, gameplay, schema or authority change.

Extended the existing nine actual-public-runner cases, without adding fixtures or abstractions. Four transient development/independent cases carry explicit CR-04 names. All six response-fault cases require identical A rejection, no returned or credited run-failure, no attempted outer run-failure append, one retained charged start and no forged terminal. Existing sibling settlement/no premature effects, two actual close attempts, single guest call, dispatch refusal, retained invocation absence and no-refund assertions remain. The ordinary successful failure-head case also asserts no red-team starts/terminals and exact empty-ledger/head binding.

## Actual verification

Run in owned isolation `/tmp/sv-265-reviewfix3-6Snwb3`, branch `codex/gsd-reviewfix-265-async3`, fixed base `9387f359`. Existing root/package dependencies linked read-only; no install.

1. Genuine current-source RED, test edits only:

   `./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-serious-league.test.ts -t 'CR-03.*CR-04'`

   Exit 1: **4 assertion failures / 115 skipped**, 23.87s. Each transient response case returned a process_invalid result/head instead of rejecting with identical A. No harness timeout or setup failure.

2. Post-fix final GREEN:

   `./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-serious-league.test.ts -t 'CR-03'`

   Exit 0: **9 passed / 110 skipped**, 39.98s. No harness timeout or setup failure; existing default test timers unchanged.

3. Strict named-two-file types:

   `./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts`

   Exit 0. Affected source/test diff reread intact; `git diff --check` exit 0. Diff: 12 insertions / 6 deletions across only the two owned files.

Raw SHA-256:

| File | SHA-256 |
| --- | --- |
| scripts/run-v1-38-serious-league.ts | 5d0d11b438aa8b0109d285a35f7b9cba0a499a1f3eb430c189895d58d297f6ec |
| scripts/run-v1-38-serious-league.test.ts | 2268f4292b6206380290245ea272db6ffa87994cb238f52319987ad9bf2b559d |

Raw two-file diff hash above is from `git diff 9387f359 HEAD -- scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts | shasum -a 256`.

## Limits and handoff

The existing source-only fixtures retain controlled real filesystem writes, but prerequisite matrix/probe terminals are synthetic/inert. These checks establish the public failure handoff and conservative evidence behavior, not empirical league completion or whole-history certification. Earlier reports/reviews and historical outcomes are preserved; no broad suite, build, full gate, retained verifier, profiler, capacity observation, real provider/Strategy/Match/model/Docker execution, package install or push was performed. Root's independent exact-source rereview/source gate remains separate.

Report deliberately remains uncommitted for root. Main is fast-forwarded only after the isolated atomic commit; exact owned worktree and merged branch are removed before the recovery sentinel. No unrelated tracked or untracked work is removed.

