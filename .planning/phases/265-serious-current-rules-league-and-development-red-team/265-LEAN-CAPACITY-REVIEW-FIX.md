---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
task: "2-lean-capacity-accounting"
fixed_at: 2026-09-22T12:03:49Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-LEAN-CAPACITY-REVIEW.md
iteration: 2
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
fix_base_commit: db3cf4a1f8c8d8af400df402fbba0fc75bc7a737
fixed_source_commit: b7f5b5d2b161651bb26dab931cecc47baf31837d
independent_re_review: pending
full_29_suite_gate: pending-main
empirical_authority: false
---

# Phase 265: Lean Capacity Accounting Fix Report

One finding fixed in one atomic commit; none skipped. This report is separate from all earlier Phase 265 review/fix artifacts. It does not complete Task 2, Phase 265, or any empirical gate.

## Fixed Issues

### CR-01: Filesystem block overhead is charged against the logical artifact pool

**Status:** fixed: requires human verification

**Commit:** `b7f5b5d2b161651bb26dab931cecc47baf31837d`

**Files modified:**

- `packages/strategy-lab/src/league/allocation.ts`
- `packages/strategy-lab/src/league/allocation.test.ts`
- `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-LEAN-AMENDMENT.md` (receipt-formula clarification only)

**Applied fix:** The first five required categories contribute logical artifact bytes and artifact records to the unchanged ordinary-pool margins: at most 120 GiB and 8,300,000 records. The sixth, filesystem, category contributes strictly positive measured/projected physical block-slack bytes and exactly zero measured/projected artifact records. All six byte projections plus the unchanged 20 GiB terminal reserve still enter the requirement to leave at least 20 GiB free filesystem space. The retained/current admission free-space formula already summed all six byte categories and remains unchanged.

The six ordered categories, exact keys, safe integers, witness/source/measurement roots, ceiling-scaled arithmetic, fixed projected units, allocation bindings, receipt freshness, process headroom, and every numerical policy bound remain enforced. Neither the live capacity guard nor any reservation/dispatch code was changed. The shared injected capacity fixture now describes filesystem overhead with zero artifact records; existing logical-overage assertions were adjusted to count the five logical categories.

## Verification

**RED:** The new representative regression failed against the prior source with `LEAGUE_ALLOCATION_CAPACITY_CATEGORIES` (1 failed, 10 skipped). It supplies only injected arithmetic, not an actual measured receipt.

**GREEN:**

- Allocation suite: **11 passed**, 10.90 seconds. Includes acceptance of approximately 114.632 GiB logical data / 7.156 million artifact records plus 12.34 GiB physical slack; the combined physical amount intentionally exceeds the 120 GiB logical threshold.
- Exact 120 GiB / 8.3 million logical limits admit. One additional logical byte, artifact record, or physical-slack byte at the host margin rejects. One-byte free-space shortfalls reject at creation and current admission.
- Filesystem measured/projected records must be exactly zero; positive/negative/fractional projected values and a nonzero measured value reject. Its physical bytes remain positive and witnesses remain mandatory. All five artifact-producing categories still require positive records.
- Prospective CLI compatibility group: **6 passed, 47 skipped**, 35.26 seconds. Covers preparation, receipt rejection, reservation crash/partial-marker refusal, charged failure retention, and read-only reopening.
- Strategy-lab project build, strict CLI/source-test types, and `git diff --check` passed. All modified sections were reread.

```sh
./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts -t 'separates logical artifact margins'
./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts
./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-serious-league.test.ts -t 'prospective CLI source-only gates'
./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts
git diff --check
```

The first command records RED; the subsequent full allocation suite records GREEN. Registered test totals include shared imported fixtures and are not counts of new tests.

## Boundaries and handoff

No actual preflight, empirical allocation/amendment/receipt, provider/container/model execution, empirical Strategy authoring, Match, formation, holdout, public/counting, or production action was performed. Temporary fixture repositories and injected values are source-only mechanics.

The full 29-suite gate remains with the main workflow after independent re-review; the earlier interrupted gate is not treated as completed evidence. Existing historical refresh work was not restarted, altered, or polled by this fixer.

This correction implements the already-approved logical-versus-physical distinction. It raises no budget, changes no final gate, and creates no new authorization, numbered plan, SUMMARY, or phase-completion claim. Existing dirty locks/cache, prior review history, and old recovery sentinels remain untouched.

The fix was committed in an isolated GSD worktree for controlled fast-forward delivery to main. This report remains uncommitted for the orchestrator.

---

_Fixer: gsd-code-fixer_
_Iteration: 2_
