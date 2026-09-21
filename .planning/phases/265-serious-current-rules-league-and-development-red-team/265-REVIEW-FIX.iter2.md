---
phase: 265
fixed_at: 2026-09-15T09:27:00Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
verification: focused_source_tests_passed_independent_rereview_and_combined_gate_pending
empirical_authority: false
---

# Phase 265 code review fix report

Six reviewed source defects have fixes and captured focused evidence. This is
not an empirical result, a phase-completion claim, or a substitute for independent
re-review. No finding was skipped as a manual item. The logic changes require
the orchestrator's independent verification and final combined source gate.

## Commits and integration

Base: `0b10637a0655a153d1b927736fd6945c5231bad6` on main.

Isolated fixer branch: `gsd-reviewfix/265-iteration1`.
Worktree: `/private/tmp/sv-265-reviewfix-1YBsSf`.
Source tip: `244e6a2a607f97125ccf150ece77562f100c0225`.

| Finding | Atomic commit |
|---|---|
| CR-01 ordinary journal accounting | `862bc06baf553d1c321d585fd67e1f3cf8f48438` |
| CR-02 preceding-target response history | `8820ccd2e663953c23e680b7235b6f6b265fd022` |
| CR-03 authenticated failure reopening | `e6ab566b35e4431e62bc72e9e3bcc641a606cd6d` |
| CR-04 bounded payoff/report composition | `01b11da0da67c4113e879c0cac773885aa855db6` |
| CR-05 comparison-only historical controls | `04eda8ed6183550a9a45d9507549c989a2248998` |
| Evaluation-index warning follow-up | `c76c434b7379ffcb4102d2d5a312010c183f70de` |
| CR-06 honest terminal state-machine outcome | `3c35147c459dd1b51987fd97530257e3e0cd5333` |
| CR-01/CR-03 start-publication boundary follow-up | `244e6a2a607f97125ccf150ece77562f100c0225` |

The mandatory fixer skill required isolation. Existing installed dependencies
were linked without installation; local package aliases resolve to this
worktree's source. No source edits were made while identity-bound tests ran.
Main remained at the captured base and tracked-clean at the integration check.
Only the owned Phase265 recovery sentinel may be removed during cleanup.
Unrelated worktrees, historical recovery sentinels, locks and cache are preserved.

Integration/cleanup status: report copied and byte-compared before main was
fast-forwarded from the exact clean base to the source tip. The owned worktree
and merged temporary branch were then removed successfully, followed by the
owned Phase265 recovery sentinel. All source commits are retained on main.
This report remains uncommitted for the orchestrator; no push is authorized.

## Fixed findings

### CR-01: reserve emergency retention for failure and cleanup

Files: `scripts/run-v1-38-serious-league.ts`, its test,
`packages/strategy-lab/src/league/repository.ts`,
`packages/strategy-lab/src/factory/repository.ts`.

Successful league terminals and normal Factory outcomes consume ordinary work
capacity. Only explicit failure/cleanup publications can use the emergency pool.
The minimum 24-record reserve remains unchanged; every new start still checks
ordinary and emergency headroom before dispatch, and uncertain writes retain
their charge.

The regression writes 40 successful league journals and 40 Factory outcomes in
fresh repositories. Factory outcomes cycle accepted, rejected, duplicate,
legal-but-weak and unresolved. All 160 ordinary records leave emergency usage
zero. Two pending starts are then retained, ordinary capacity is exhausted, and
five failure-head/terminal records fit in the minimum emergency reserve.
Focused initial accounting checks passed; the final three-test retention run
passed in **12.23 s**.

A late focused audit reproduced a connected boundary defect: a 30-record
allocation had room for a journal pair but not the graph start. RED failed
read-only reopening with `RETAINED_JOURNAL_COVERAGE` in **4.66 s**. The follow-up
now preflights the journal pair plus graph chunks/envelopes/descriptor before
recording a start. GREEN confirms zero provider execution, no phantom durable
start and truthful read-only process-invalid reopening. Nothing is deleted or
refunded. This narrow final patch was not followed by redundant long tests;
the final combined gate remains pending.

### CR-02: bind actual consecutive responses to preceding frozen targets

Files: `packages/strategy-lab/src/league/selection.ts`, its test,
`scripts/run-v1-38-serious-league.ts`, its test.

New selection proof schema v5 binds two distinct accepted responses to their own
complete untouched pre-response condition blocks, strict greater-than-55%
measurements, real consecutive schedule ordinals, distinct jobs/starts/
production/terminals, and authenticated intervening population/snapshot evolution.
The later candidate must be the later accepted response; the earlier accepted
candidate must enter the later target population. Unrelated residents cannot
borrow this history. Older proof schemas are not reinterpreted.

The current-matrix pure/maximin, independent probe/validation, privacy/runtime
and diversity gates remain separate. No threshold, solver meaning or policy
root was changed, and no-finalist remains valid.

The linked-history unit regression rejects duplicate evidence, skipped ordinals,
wrong snapshots, disconnected population, unrelated candidate and exact 55%
boundary reuse; captured GREEN **2.02 s**. The connected injected test performed
two actual distinct production/measurement iterations and read-only reconstruction:
**1 test passed, 363.28 s** (test body 361.04 s). It does not execute Strategy code
or contact a provider. A subsequently added authenticated contemporaneous-
snapshot tamper assertion is typechecked but **has not yet been executed**.
The combined gate must execute that full connected case on the integrated tip.

### CR-03: reconstruct authenticated failed prefixes

Files: `packages/strategy-lab/src/league/connected-runner.ts`,
`scripts/lib/v1-38-league-response-runtime.ts`,
`scripts/run-v1-38-serious-league.ts`, its test.

Live and retained paths share the execution-to-terminal derivation. Failure
reopening validates actual charged starts, raw invocation ordinals/results,
cleanup/provider identity, exact failure kind, known/unknown full-burn accounting,
and accepted population growth without demanding a completed payoff.
Thrown response providers retain explicit invocation/execution failure records;
a supervision receipt is not fabricated for a failed execution with no
candidate invocation. Factory failure journals are read through exact known
paths, without treating legitimate authoring state files as unknown artifacts.

RED player/system reopening failed `RETAINED_EXECUTION` in **7.12 s**.
Focused player/system GREEN runs passed; the post-CR06 five-case CLI run passed
in **33.39 s**, including both charged failure classes and tampered evidence.
The separate growth/thrown-provider pair passed in **172.56 s**:
accepted-growth failure 127.84 s, thrown-provider failure 42.38 s.
Growth retained the accepted counter and expanded three-entrant matrix before
the failed cell; tampered ledger/failed-match evidence was rejected.
These two longer branches predate the final round-path/start-preflight changes
and must run in the integrated gate.

### CR-04: compose authenticated bounded payoff and report artifacts

Files: `packages/strategy-lab/src/league/{matrix,solver,repository,report}.ts`,
`{solver,integration,report}.test.ts`, and the CLI/test pair.

Shared bounded byte composition keeps every artifact at or below 256 KiB and
authenticates descriptor, chunk ordinal, completeness, sizes and byte roots.
The aggregate canonical ceiling remains 8 MiB. Matrix solver transport and
private report retention/reopening use the same composition, preserving
canonical payoff/solver roots and numeric behavior. Retained matrix v2 links
ordered authentic cell-result records rather than duplicating every execution;
the reader re-enumerates and re-reduces those records. Existing small artifacts
and older retained-matrix reading are preserved.

Preflight rejects an allocation whose declared maximum population cannot fit
the existing canonical byte/array/node capacity, before any durable charge.
The supported exact boundary tested is 83 entrants (27,224 cells; 8,248,873 payoff
bytes); 84 is rejected clearly. Approved growth is not silently shrunk.

RED 16-entrant raw transport failed before repair. Four focused tests across
three files passed in **44.28 s**: 16-entrant solver, actual supported 83-entrant
edge, chunk missing/duplicate/reordered/tampered negatives, connected
16-entrant/960-cell package matrix/solver/retention/reconstruction, and composed
report fragment negatives. This package integration is not a 960-dispatch CLI
run. Two connected CLI checks passed in **86.27 s**: the 80-cell closed workflow,
authenticated missing/duplicate/reordered/wrong-kind cell-reference denial and
84-entrant zero-charge preflight. Final integrated replay remains pending.

### CR-05: preserve authentic historical comparison-only controls

Files: `packages/strategy-lab/src/league/selection.ts`, its test,
`packages/strategy-lab/src/league/contracts.test.ts`.

Prior-writer-shaped mechanics-only fingerprints with null producer roots remain
valid comparison-only imported controls. Their retained fingerprint bytes/root
must still match the import. They are excluded from real-producer inventory,
qualified portfolios, independent core/family counts and promotion. Real
producer fingerprints still require exact authenticated source/producer joins.

The synthetic prior-writer import has three genuine bases plus nine controls;
nine fresh source-backed test producers grow real inventory from three to
twelve without laundering the controls. Historical bytes are unchanged and a
forged real-producer replacement fails `IMPORTED_FINGERPRINT_REWRITE`.
RED failed `FINGERPRINT_BINDING` in **9.58 s**; final selection/import run:
**12 tests passed, 18.65 s**. This uses freshly generated writer-shaped fixtures,
not the actual Phase264 private store, whose one read-only import is reserved
for main after reviews.

### CR-06: require a closed path, otherwise retain honest nonclosure

Files: `scripts/run-v1-38-serious-league.ts`, its test.

The CLI retains the actual terminal advance. Acceptance in the final allocated
response round leaves `fresh_snapshot_required`; it now returns a process-valid
`response_round_budget_exhausted` / `not_closed` head with accepted candidates,
expanded matrices, every charge, completed jobs and undispatched independent
jobs. It does not dispatch an extra round or independent evaluation, select a
finalist, freeze, publish a completed report or claim bounded completion.

The reader recomputes the full round path, exact preceding populations,
counter admissions and fresh snapshots. A locally valid but disconnected,
duplicate or counter-omitting advance cannot establish closure. Honest partial
failure prefixes remain supported. Failure heads also retain available matrix
references for independently evaluated failures.

The connected last-round RED reached the accepted response and then wrongly
dispatched an independent job: **142.72 s**. GREEN passed in **172.43 s**
(test body 170.21 s): 104 ordinary cells plus 48 response measurements,
one accepted counter, two-/three-entrant matrices, only the development job
started, independent job undispatched, honest read-only nonclosure, and
tampered closure rejection. The final narrow start-capacity patch came later;
main's combined gate covers that integrated source.

## Evaluation-index warning

The sixteen metadata rows now point to actual matcher calls through explicit
`expect(..., "league-eval:<id>")` markers inside the named test callback.
A small TypeScript AST check rejects comments, standalone marker strings,
bare expect calls and markers belonging to another test. It does not certify
that an assertion proves its prose description, is reached, or is sufficient:
executed tests and captured results remain the evidence.

Files: fixtures source/test, existing marked integration/matrix/solver/PSRO/
red-team/selection/connected-runner/report tests, and the allowed
`265-EVAL-REFERENCE.md`. No new framework, package or numbered plan.
RED index check failed without matcher markers in 1.53 s; GREEN executed
**17 tests across 9 files in 8.88 s**, including the linked behavioral assertions.

## Captured validation and remaining gate

All modified sections were re-read and `git diff --check` passed.
Package typing passed:

```sh
./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json
```

Strict CLI/affected script typing and the final serious-league AST/import
boundary scan passed; the latter scanned **1,329 files, zero violations**.
Focused Vitest runs used the installed worktree toolchain and retained terminal
outputs. There are no running tests at handoff.

Pending for main: the exact **29-suite source gate and following checks already
listed in 265-VALIDATION.md, Exact Combined Source Gate** (lines 45–79), after
independent source/security/evaluation re-review. In particular execute the full
CLI file, including the new contemporaneous-proof tamper check, both failure-
after-growth/provider branches, original successful growth and closed workflow,
and the latest last-round/budget-boundary cases. Do not count prior focused
green results as proof of the final integrated implementation root.
The old 250/250, 581.87-second result at `9394176c` is baseline only.

Planning/file-list changes needed from main: reconcile review/security/evaluation
findings and validation/plan lifecycle against these commits and the final gate;
include the allowed report/composition, Factory repository and response-runtime
dependency changes in source ownership/verification scope. This fixer did not
edit those main-owned artifacts.

No confirmed reviewed source defect remains skipped. Independent review may
find further cases; this report makes no general certification claim.
`empiricalRequirementsComplete: false` remains deliberately unchanged.
No empirical allocation exists, no Phase264 waiver is inherited, and no human
checkpoint, holdout/formation/public counting or production authority was added.
