---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "28"
subsystem: persistence
tags: [semantic-authority, postgres, two-phase-transition, crash-recovery, cas]

requires:
  - phase: 260-27
    provides: Closed exact v1.17/v1.19 semantic selections and one compact current selector
provides:
  - One exact Phase-259 singleton database selection head
  - Closed five-state forward and compensation transition protocol
  - Short serializable prepare, finalize, abort, recovery, read, and lock APIs
  - Append-only transition history and immutable MatchSet/Match/job selection roots
affects: [260-29, 260-30, 260-31, 260-32, 260-33, 260-14]

tech-stack:
  added: []
  patterns: [singleton-selection-head, short-serializable-cas, durable-pending-intent, exact-recovery-binding]

key-files:
  created:
    - packages/persistence/migrations/0028_semantic_authority_selection_head.sql
    - packages/persistence/src/semantic-authority-selection-head.ts
    - packages/persistence/src/semantic-authority-selection-head.test.ts
  modified:
    - packages/persistence/src/migrations.ts
    - packages/persistence/src/migrations.test.ts

key-decisions:
  - "The database owns one complete selection value and root, never independent tuple, certificate, corpus, trace, Workshop, arena, Set, or D-04 selectors."
  - "The only valid lifecycle shapes are bootstrap v1.17, forward pending, finalized v1.19, reverse pending, and compensated v1.17."
  - "Prepare, finalize, and abort use an advisory lock, row lock, serializable transaction, and exact revision CAS; external Git/proof work never occurs inside the transaction."
  - "Recovery revalidates parent, target, selector-manifest, proof/recovery, commit, and tree bindings under lock and never infers success."

requirements-completed: [STRAT-03, STRAT-04, SET-01, SET-02, SET-03, SET-04, SET-05]

duration: 20min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 28: Transactional Semantic Authority Selection Head Summary

**PostgreSQL now holds one complete crash-safe semantic selection: exact Phase-259 remains active, while forward activation and exact compensation can proceed only through durable pending intent and short locked transitions.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-17T10:28:00Z
- **Completed:** 2026-07-17T10:48:00Z
- **Tasks:** 2 TDD tasks plus adversarial recovery/root review
- **Files modified:** 5

## Accomplishments

- Added migration 0028 with one singleton head, exact Phase-259 bootstrap selection/root, a single nullable pending intent, closed five-state constraints, revision CAS, protected transition trigger, and append-only history.
- Bound the full selection at once: semantic tuple, rules, engine, runtime ABI, Chronicle, conformance certificate, corpus, trace, Workshop, arena catalog, Set policy, and Strategy Revision evidence policy cannot be independently mixed.
- Added nullable historical-safe frozen selection columns to MatchSets and matching roots to Matches/jobs. Exact-shape, immutability, MatchSet/Match join, and Match/job equality guards reject partial or substituted work.
- Implemented deeply frozen readers, transaction-scoped locking, forward/reverse prepare, finalization, exact abort, precommit/committed recovery, idempotent retries, counted-scheduling admission, and privacy-safe typed errors.
- Applied migration 0028 to the current development database. It remains `active-v1.17-bootstrap`, revision `0`, with no pending intent.

## Task Commits

1. **Task 1 RED: exact migration and frozen-work contract** — `6d7529c`
2. **Task 1 GREEN: singleton selection head migration** — `f61101c`
3. **Task 2 RED: crash-safe selection-head API contract** — `e214ff7`
4. **Task 2 GREEN: locked transitions, recovery, and root guards** — `01ce304`

## Decisions Made

- Head state is public-safe exact identity only. It contains no Strategy source, artifacts, memory, objectives, diagnostics, host data, credentials, or security internals.
- Forward prepare retains active v1.17 and persists only the exact reviewed v1.19 target plus parent/manifest/preimage bindings. Finalization alone promotes it after exact proof and Git binding.
- Reverse prepare retains finalized v1.19 and its source finalization while targeting the recorded exact v1.17 preimage. Compensation binds its own commit, tree, selector manifest, and recovery receipt.
- Read/lock are separate: ordinary readers obtain a validated frozen snapshot, while scheduling can lock the same exact row within its own short persistence transaction.
- Idempotency never weakens validation. Repeated finalize/recover calls reload the original prepared history and recheck parent, target, and selector-manifest bindings.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Database compatibility] PostgreSQL did not provide `jsonb_object_length`**
- **Found during:** Task 1 migration execution
- **Issue:** The planned exact-member checks initially used a nonexistent PostgreSQL function in the available database version.
- **Fix:** Counted `jsonb_object_keys` instead, preserving exact closed-object enforcement.
- **Files modified:** Migration and migration test.
- **Verification:** Fresh and current-database migration tests pass.
- **Committed in:** `f61101c`

**2. [Rule 2 - Missing critical recovery safeguard] Idempotent recovery needed locked original-intent revalidation**
- **Found during:** Task 2 adversarial review
- **Issue:** A completed retry could validate final metadata without rechecking the original prepared parent/target/manifest, and precommit recovery initially checked those bindings before acquiring the mutation lock.
- **Fix:** Reloaded append-only prepared intent during idempotent finalization and required abort/recovery bindings to match under the locked transaction.
- **Files modified:** Selection-head implementation and tests.
- **Verification:** Wrong-parent recovery fails both while pending and after finalization; exact retries remain idempotent.
- **Committed in:** `01ce304`

**3. [Rule 2 - Missing critical frozen-work safeguard] Root formats did not prove parent/child equality**
- **Found during:** Task 2 adversarial review
- **Issue:** Per-table format constraints alone could not prove that a MatchSet, Match, and job froze the same authority root.
- **Fix:** Added MatchSet/Match join and Match/job equality triggers, conflicting-owner rejection, immutable populated roots, and executable mismatch tests.
- **Files modified:** Migration and migration test.
- **Verification:** Exact roots persist; mismatched jobs and rewritten MatchSets fail closed.
- **Committed in:** `01ce304`

---

**Total deviations:** 3 auto-fixed: one database compatibility blocker and two missing critical integrity safeguards.
**Impact:** The changes preserve the planned architecture and strengthen exactness without activating v1.19 or expanding database/runtime ownership.

## Issues Encountered

- Full-package ESLint still reports a pre-existing `consistent-type-imports` finding in `packages/persistence/src/matchset-status.ts`, outside Plan 28. All changed files pass focused ESLint, and typecheck/tests are green.

## User Setup Required

None.

## Verification

- Focused migration and selection-head gate: 2 files, 36 tests passed.
- Fresh database migration: passed with one exact bootstrap head and one bootstrap history event.
- Current database upgrade: migration 0028 applied once; historical work remained null/original.
- Authoritative development database: exact v1.17 bootstrap, revision 0, no pending intent.
- Full `@cowards/persistence` suite: 24 files, 314 tests passed.
- Persistence typecheck: passed.
- Changed-file ESLint and Prettier: passed.
- `git diff --check`: passed.
- Protected baseline: passed at `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.

## TDD Gate Compliance

- Task 1 RED `6d7529c` failed on the absent migration before GREEN `f61101c`.
- Task 2 RED `e214ff7` failed on the absent selection-head module before GREEN `01ce304`.
- Both GREEN implementations passed focused, combined, typecheck, formatting, privacy, concurrency, crash, and database gates.

## Next Phase Readiness

- Plan 260-29 can delegate DB-backed Workshop creation to exact file/head equality while keeping runtime-service database-free.
- Plan 260-30 can read and freeze the same complete root at Go scheduling boundaries.
- Plan 260-32 can lock this row in TypeScript Match/MatchSet creation and propagate the immutable selection/root through jobs.
- v1.19 remains inactive; no current selector, default, Match, MatchSet, or job was promoted by this plan.

## Self-Check: PASSED

- All five planned files exist and all four TDD commits are present.
- The current database and repository selectors both remain exact v1.17 with zero pending intent.
- Only the two protected pre-existing user files remain dirty before this summary commit.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
