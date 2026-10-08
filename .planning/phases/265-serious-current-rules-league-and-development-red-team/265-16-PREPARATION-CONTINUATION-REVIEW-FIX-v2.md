---
phase: 265
plan: 16-first-preparation-continuation-source
fixed_at: 2026-10-08T21:14:28Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-PREPARATION-CONTINUATION-SOURCE-VERIFICATION-v1.md
iteration: 2
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
fix_status: "fixed: requires human verification"
source_commit: ee0851813668fddc317829b346c1843f616a4260
source_root: sha256:e7d8bf583b09828a34f5cd79d81cb0220242b093dd26e6026b30705347d5b442
source_manifest_entries: 930
phase_complete: false
empirical_admission: false
---

# First v13-1 actual-parent source fix — iteration 2

The verification-v1 BLOCKER is repaired in source. **Fixed: requires independent verification**; no new human-only product/resource decision. Prior REVIEW-v1/v2, REVIEW-FIX-v1, VERIFICATION-v1, VALIDATION-v1 and consumed authorities remain unchanged. Fresh independent SOURCE-REVIEW-v3 and SOURCE-VERIFICATION-v2 remain required; this report is not their substitute.

## Applied fix and RED/GREEN

Owned files: `scripts/run-v1-38-lean-baseline.ts`, `scripts/run-v1-38-lean-baseline.test.ts`, `scripts/run-v1-38-lean-correction.ts`, `packages/strategy-lab/src/league/lean-experiment.ts`, and this new report.

RED `ea1da98a`: actual `runLeanBoundedParent` with exact authenticated v13 allocation, controlled inert child and HOST filesystem/resource effects, real selector/exclusive reason publication, and both real strict v13 reason consumers. Without legacy opt-in, no reason was written; with opt-in, actual reason-v1 failed v2 validation. Two failures reproduced the defect; unchanged v12 control passed. No reason-v2 fixture or parent stub is used by the new regression.

GREEN `ee085181`: actual parent explicitly adds authenticated `isLeanPreparationContinuationMode` to reason-v2 selection. Strict v12 predicate, legacy opt-in reason-v1/default no-artifact behavior, parent resource/time/cleanup logic and all gameplay/runtime policies are unchanged. Both v13 flag variants now publish actual v2 bytes accepted by shared entered-custody and dedicated ordinary v13 join; actual no-opt-in v12 stays v2. Existing legacy/default negatives ran unchanged.

New-v13 documents point exactly to SOURCE-REVIEW-v3. All three downstream review versions are excluded only from functional manifest input, never physical debit. Four exact new-v13 physical report entries were added: SOURCE-REVIEW-v3, SOURCE-VERIFICATION-v2, VALIDATION-v2, REVIEW-FIX-v2. No old/default report family was broadened. The already-bound baseline test remains a functional source entry; no new executable dependency was added beyond the existing-module authenticated predicate import.

## Exact executed gates

All commands ran in isolated `/tmp/sv-265-parent-reviewfix-WHcxse` using the installed main binaries/dependency links; no install, historical suite/scan or live route.

- RED: `node /Users/roryquinlan/runtime/cowards-game/node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-baseline.test.ts -t 'actual authenticated preparation parent' --maxWorkers=1` — CLOSED1, 2 failed/1 passed/33 intentionally unselected, 5.96s.
- Selected GREEN: same command — CLOSED0, 3 passed/33 intentionally unselected, 6.07s.
- Focused complete GREEN: `node --max-old-space-size=768 /Users/roryquinlan/runtime/cowards-game/node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-baseline.test.ts scripts/run-v1-38-lean-preparation-continuation-v13.test.ts scripts/run-v1-38-lean-preparation-provenance-v12.test.ts --maxWorkers=1` — CLOSED0, **84/84, zero skips**, 3 files, 126.03s. Includes existing CR01/WR01 actual lifecycle/storage/time regressions.
- Configured lab types: `node /Users/roryquinlan/runtime/cowards-game/node_modules/typescript/bin/tsc -b packages/strategy-lab` — CLOSED0.
- Strict source check: `node /Users/roryquinlan/runtime/cowards-game/node_modules/typescript/bin/tsc --ignoreConfig --types node --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck scripts/run-v1-38-lean-baseline.ts scripts/run-v1-38-lean-baseline.test.ts scripts/run-v1-38-lean-correction.ts scripts/run-v1-38-lean-preparation-continuation-v13.test.ts scripts/lib/v1-38-lean-correction-retained.ts scripts/lib/v1-38-lean-preparation-continuation-v13.ts` — CLOSED2, **NOT PASS**: exactly six inherited diagnostics at feasibility-protocol.ts52 and planner/missions.ts52/60/66/68/69; no changed-file diagnostics. Not broadly repaired or waived.
- `sh -n scripts/run-v1-38-lean-correction.sh` and `git diff --check` — CLOSED0.
- Read-back of all changed sections confirms narrow selector, pointer/exclusions and exact physical entries.

Public manifest snapshot: CLOSED0; root above, 930 entries, already-bound baseline.test raw root `sha256:8762d38fd2071a0b5e077e6db96c13fae0f41e024dfbc9093ce9cab2c566a38a`, zero private entries and zero preparation SOURCE-REVIEW entries. All three review versions plus four exact new reports appear in the v13 physical list. No source-held review/capacity/terminal operation was executed.

Root snapshot recipe from main:

```sh
node node_modules/tsx/dist/cli.mjs -e 'import {leanCorrectionSourceManifest} from "./scripts/run-v1-38-lean-correction.ts"; import {LEAN_PREPARATION_CONTINUATION_V13_EXTENSION as extension} from "./packages/strategy-lab/src/league/lean-experiment.ts"; const m=leanCorrectionSourceManifest("v13-1",extension); console.log(JSON.stringify({root:m.root,entries:m.entries.length,privateEntries:m.entries.filter(e=>e.path.startsWith(".strategy-lab/")),downstreamReviews:m.entries.filter(e=>e.path.includes("PREPARATION-CONTINUATION-SOURCE-REVIEW"))}));'
```

## Boundaries and closure

Original cause remains UNKNOWN; historical bytes/pins/readers stay immutable. No actual private helper/request/allocation/entry/provider/Match, terminal check, capacity probe or native-cause claim. The new tests use synthetic committed-allocation and entry/terminal filesystem effects, not actual private artifacts. 0 of5 preparations remain spent per assigned frontier.

Exact approved165600000 cap/full108000000 plus ALL wall since1791455941097/deadline2026-10-09T02:39:01.097Z/1860000reserve/34charges/15GBtotal/12GBretained/300Matches/2GBscratch/768MiB and unchanged guest/host/startup/Match bounds remain. Costs of this fix and every new report carry forward, never refunded.

All owned commands are ACTUALLY CLOSED, no active child/timer/job remains. Source commits are fast-forwarded to main; own temporary worktree/branch/sentinel are cleaned transactionally, unrelated worktrees/sentinels/untracked artifacts preserved. This report is left uncommitted for root; no push or STATE change. Fresh independent review and re-verification are the remaining source gates.

