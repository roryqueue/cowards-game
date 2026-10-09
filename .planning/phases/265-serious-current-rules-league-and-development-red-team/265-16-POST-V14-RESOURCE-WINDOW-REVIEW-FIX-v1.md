---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
fixed_at: 2026-10-09T16:13:46Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v1.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
fix_commits: [db06094b, 5efd05c6]
source_base: 4803cdcf
source_tip: 5efd05c6
fixer_agent: /root/fix_265_resource_window_v15
independent_re_review: pending_ROOT
empirical_credit: none
---

# Phase 265 Plan 16: Resource-window review fix report

Two independently reproduced source blockers were narrowly repaired in ROOT's precreated isolated worktree. This report describes fix execution, not independent clean review, source acceptance, empirical admission or Phase completion. The gsd-code-review/fix workflow guided per-finding source reads, regression checks and atomic commits. ROOT explicitly scheduled the called Match-helper seam inside existing Task2 without changing pinned plan bytes, and owns final fast-forward/review/validation/verification and transactional cleanup.

## Fixed Issues

### CR-01: Selected Match compaction still applies the legacy 2 GB memory guard

**Status:** fixed: requires human verification

**Commit:** db06094b

**Files modified:** `packages/strategy-lab/src/league/lean-experiment.ts`, `scripts/run-v1-38-lean-experiment.ts`, `scripts/lib/v1-38-lean-baseline-match.ts`, `packages/strategy-lab/src/league/lean-resource-window-v15.test.ts`, `scripts/run-v1-38-lean-resource-window-v15.test.ts`.

`compactExecution` now forwards optional authenticated allocation and projected-byte callback to `boundLeanReplayFrame`, which forwards both to existing `assertTransient`. The actual selected Match helper passes its ledger allocation and real checkpoint, widened to accept projected bytes. The existing correction checkpoint includes live parent RSS, actual/current-max child RSS plus projection, original cumulative time, physical inventory, measured buffers/TMPDIR and disk arithmetic; it was inspected but not changed. Missing selected guards still refuse. Legacy default, frame-size limit, disk limits and strict policy reconstruction remain unchanged.

Portable inert regressions exercise the actual shared compaction with above-legacy RSS; its callback observes nonzero projected bytes, exact aggregate3000000000 acceptance and+1 refusal, separate scratch2000000000 acceptance/+1 refusal, omitted selected callback refusal and unchanged legacy refusal. The package test also exercises frame policy forwarding and unchanged oversized-frame refusal. No Match/provider/Strategy/entry is invoked.

**RED:** package new frame case failed `LEAN_EXPERIMENT_BUFFER_CAP` before the fix; actual compaction case also failed that code with only the old `assertTransient(upper * 3)` seam restored, then the fix was restored. Stack explicitly pointed to this worktree's relative `packages/strategy-lab/src/league/lean-experiment.ts`, not MAIN.

**GREEN:** combined focused suites after CR01 passed19/19 with `--testTimeout 30000`. Tier1 reread confirmed all modified sections; configured package TypeScript passed after approved unchanged dependency links.

### CR-02: v15 parent emits v1 reason bytes while accepted audit requires v2

**Status:** fixed: requires human verification

**Commit:** 5efd05c6

**Files modified:** `scripts/run-v1-38-lean-baseline.ts`, `scripts/run-v1-38-lean-resource-window-v15.test.ts`.

The parent's authenticated family selector now explicitly includes `isLeanResourceWindowModeV15`. A pure exported selector/producer within the same owned parent file is used by the actual parent readiness/observation and reason-publication path. Selection reconstructs allocation caps before choosing the family; body allocation root must agree. The producer preserves v2 root/sampling provenance and strict envelope checks, while legacy reason-v1 behavior remains selected for legacy allocations. No consumer/ordinary reader was modified or broadened to accept either schema.

The in-memory NON-AUTHORIZING producer-consumer test passes canonical v15 v2 bytes directly to unchanged `validateLeanSupervisorRetestReasonJoinV12`. Matching synthetic entry/terminal joins pass; altered allocation/source/request/entry bytes/HEAD/PIDs and terminal exit/signal/status refuse. Legacy canonical v1 remains valid only under its legacy validator and fails strict v2; changed unrooted allocation refuses. This is an inert reason custody contract, not authentic full accepted diagnostic/FINAL custody.

**RED:** new actual-parent producer case failed because the export did not exist before implementation.

**GREEN:** final combined focused suites passed20/20. Tier1 reread confirmed selector, producer, actual publication call and test sections intact.

## Check receipts and environment limits

- Final direct command: `node_modules/.bin/vitest run packages/strategy-lab/src/league/lean-resource-window-v15.test.ts scripts/run-v1-38-lean-resource-window-v15.test.ts --testTimeout 30000` —2files,20tests passed. One earlier existing ledger test timed out under default5000ms; the subsequent explicit30000ms test-runner limit passed without changing source/runtime limits.
- `node_modules/.bin/tsc -p packages/strategy-lab/tsconfig.json --noEmit --composite false --incremental false` —PASS, exit0.
- Strict source check: `NODE_OPTIONS=--max-old-space-size=768 node_modules/.bin/tsc --ignoreConfig --types node --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck scripts/run-v1-38-lean-baseline.ts scripts/run-v1-38-lean-experiment.ts scripts/lib/v1-38-lean-baseline-match.ts scripts/run-v1-38-lean-resource-window-v15.test.ts` —inherited six diagnostics in feasibility-protocol.ts:52 and planner/missions.ts:52,60,66,68,69. NOT strict PASS; no owned-file diagnostic after the fixture typing correction.
- `sh -n scripts/run-v1-38-lean-correction.sh` and `git diff --check` —PASS. Source modifications were reread per finding before commit.
- `pnpm exec` initially triggered dependency-status auto-install checking and aborted before install due noTTY; it is NOT a successful test receipt. Direct existing linked binaries were used thereafter. ROOT approved environment-only existing package node_modules links and unchanged engine/spec/runtime-js/replay/strategy-oracle-tactical dist links in this worktree. No install/build or changed strategy-lab/dist link occurred. Changed lab/host imports remain relative isolated source. Initial unresolved dependency/TS6305 probes are NOT PASS receipts.
- CR01 used explicit Git path staging/atomic commit; CR02 used installed `gsd-tools.cjs commit` with explicit paths. This installed CLI advertises direct `commit`, not the workflow's `query commit` namespace. The new report is committed separately only under ROOT's bounded handoff exception, so fast-forward preserves it.

## Remaining gaps and preserved boundaries

Independent fixed-source re-review, final validation and separate source verification remain ROOT-owned. Authentic full v15 accepted custody, actual own diagnostic/FINAL, real parent-disconnect/runtime sampling, native provider/RSS recovery and all36 baseline cells remain unproved. Missing private acceptance fixtures were not invented and authentication was not weakened. Inherited private-fixture-four ENOENT and monitor-five node:util findings were not rerun/repaired/cleared; they remain NOT PASS alongside strict-six.

Original all-wall accounting continues through every source/test/admin/idle millisecond to2026-10-09T18:38:33Z with unchanged31-minute reserve. No new helper/data/reviewer gate, allocation, entry, Match/provider/Strategy run, historical reader/private-history scan, budget reset, allocation/gate promotion or empirical credit occurred. No STATE/ROADMAP/pinned plan/original SUMMARY/source-summary/review rewrite, rule change, formation, holdout, public/counting/production authority or resource-feasibility assurance was added.

All agent-started commands are closed before handoff. Source worktree is committed; ROOT alone owns fast-forward, worktree removal, conditional temp-branch removal and dedicated recovery-sentinel removal. Historical worktrees/branches/sentinels remain untouched.
