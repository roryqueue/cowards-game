---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
task: "2-lean-amendment"
fixed_at: 2026-09-22T11:52:10Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-LEAN-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
reviewed_source_commit: 3db4347b
fix_base_commit: 9739e36b6693aabeb26bc663ddcb8bb9351a869f
fixed_source_commit: 86650982b1e008a72b1a90ccb5f67ca6379f5aee
independent_re_review: pending
full_29_suite_gate: pending-main
empirical_authority: false
---

# Phase 265: Lean Amendment Code Review Fix Report

**Source review:** `265-LEAN-REVIEW.md` only. The older 47-file review and every existing review/fix artifact remain unchanged.

**Summary:** Three blockers attempted and fixed in three atomic commits; none skipped. These are source-only fixes, not an empirical result or Phase 265 completion. Logic/state-handling changes retain the fixer status **fixed: requires human verification**, with independent re-review assigned to the main workflow.

## Fixed Issues

### CR-01: Eager prospective-policy initialization crashes direct red-team imports

**Status:** fixed: requires human verification

**Commit:** `e1c805ad89447af6654a2b27e7fd87bf961442c1`

**Files modified:**

- `packages/strategy-lab/src/league/allocation.ts`
- `packages/strategy-lab/src/league/red-team.ts`
- `packages/strategy-lab/src/league/allocation.test.ts`
- `packages/strategy-lab/src/league/probes.ts` (new dependency-free shared constant module, explicitly permitted by the finding)

**Applied fix:** Moved the unchanged nine-probe tuple into a dependency-free module. Allocation imports it directly; red-team imports and re-exports the existing API. The prospective eager policy no longer reads across the red-team initialization cycle.

**Verification:** Reproduced the original native-ESM red-team import failure before editing. Fresh child-process tests now initialize red-team first and allocation first, then compare the exact probe/policy values. The focused import/root suite passed 3 tests, 7 skipped, in 4.82 seconds. The legacy V1 root construction and empirical twelve-import guard remain intact. Strategy-lab TypeScript build passed.

### CR-02: Refreshing the capacity receipt creates a new reservation for an already-consumed allocation

**Status:** fixed: requires human verification

**Commit:** `d8359de002cca1687db63f78695d1b557dfa0666`

**Files modified:**

- `scripts/run-v1-38-serious-league.ts`
- `scripts/run-v1-38-serious-league.test.ts`

**Applied fix:** The prospective exclusive reservation is a content-addressed allocation-only record, so a receipt refresh cannot alter its exclusive filename. The separately authenticated run marker binds both that reservation root and the receipt root. Retained verification validates both records. Legacy V1 still uses its original marker bytes and exclusive filename; no stored V1 schema/root is changed.

**Verification:** Actual injected run entry is interrupted immediately after the durable reservation, before any cell journal. Both a complete reservation and a partial/empty reservation reject a refreshed receipt with `EEXIST`, with zero provider calls, no second marker, and unchanged pre-existing bytes. The charged failure still reopens read-only with its receipt. The focused group, including the existing exact-small-V1-root regression, passed 4 tests, 42 skipped, in 96.00 seconds. Strict CLI/source-test types passed.

### CR-03: Response Matches start containers before the new live-capacity guard

**Status:** fixed: requires human verification

**Commit:** `86650982b1e008a72b1a90ccb5f67ca6379f5aee`

**Files modified:**

- `scripts/lib/v1-38-league-response-runtime.ts`
- `scripts/lib/v1-38-league-response-runtime.test.ts`
- `scripts/run-v1-38-serious-league.ts`
- `scripts/run-v1-38-serious-league.test.ts`

**Applied fix:** Added a required `beforeDispatch()` response-retention operation, propagated through the record graph to the live capacity guard. Every response Match calls it before incrementing `matchCount`, publishing a Match start, or constructing either provider. Both coordinator loops call it before creating a red-team attempt charge. The invocation-time check remains. A capacity stop latches the retention budget as exhausted, denies subsequent work, and preserves the separate terminal/failure reserve.

**Verification:** Injected capacity loss after authoring yields zero Match starts and zero providers; loss between Matches preserves exactly one prior start and two prior inert providers, without a second charge/provider. Producer start and system-failure terminal journals and authored failure evidence remain. Tests also cover the invocation guard, terminal-reserve propagation, and both development and independent-evaluation coordinator paths rejecting before any producer charge. The focused combined group passed 2 suites, 10 tests, 64 skipped, in 128.09 seconds. A separate admission/normal-response group passed 2 suites, 13 tests, 19 skipped, in 69.63 seconds, including the complete injected three-arm response closure and retained read-only verification.

## Commands and final checks

```sh
./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts -t 'fresh .*first process|roots a distinct amendment'
./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-serious-league.test.ts -t 'retains the receipt or consumed allocation|preserving the exact small v1 root'
./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-response-runtime.test.ts -t 'capacity-before-development|capacity-before-independent|propagates live capacity stops|preflights the journal-start|capacity after authoring|capacity between Matches|invocation-time capacity guard'
./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts scripts/lib/v1-38-league-response-runtime.test.ts -t 'approved prospective three-base admission|runs source-only three-arm production \(complete\)'
./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-response-runtime.ts scripts/lib/v1-38-league-response-runtime.test.ts
./node_modules/.bin/tsx scripts/check-v1-38-serious-league-boundaries.ts
./node_modules/.bin/tsx scripts/check-v1-38-lab-boundaries.ts
./node_modules/.bin/tsx scripts/check-v1-38-factory-boundaries.ts
./node_modules/.bin/tsx scripts/check-service-boundary-imports.ts
./node_modules/.bin/tsx scripts/run-v1-38-serious-league.ts --help
git diff --check
```

All listed checks passed. Each private boundary scan covered 1,331 source files with zero violations. Service checks reported zero strict/ownership offenses and the same 19 pre-existing report-only offenses. Test modules import shared fixture tests, so totals include repeated registrations and are not counts of unique new tests. During development, two test-harness errors (child-process working-directory depth and independent-job round placement) were corrected before successful verification; no failed syntax fix or rollback was needed.

## Boundaries and handoff

- The complete 29-suite gate was not run; the main agent owns it after independent re-review.
- No empirical allocation/amendment/receipt, actual preflight, real provider/container/model dispatch, authored empirical Strategy, Match, formation, holdout, public/counting, or production action occurred. Temporary injected repositories and inert providers are mechanics fixtures only.
- Approved prospective vectors, final population/diversity/finalist gates, canonical engine/runtime behavior, historical policies/assessments, and the Phase 266-before-formation dependency remain unchanged.
- Changes were confined to eight source/test paths across the three commits. No old review history, SUMMARY, numbered plan, STATE, ROADMAP, or empirical result was changed. Existing main-checkout locks, cache, and older recovery sentinels were preserved.
- The GSD fixer used an isolated worktree and per-finding commits; the main checkout receives those exact commits by fast-forward. This report remains uncommitted for the orchestrator.

---

_Fixed: 2026-09-22T11:52:10Z_
_Fixer: gsd-code-fixer_
_Iteration: 1_
