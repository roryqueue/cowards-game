---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "05"
subsystem: persistence
tags: [typescript, scheduling, set-conditions, arena-catalog, revision-admission, postgresql]

requires:
  - phase: 260-01
    provides: Canonical arena catalog v1.37 and explicit four-condition Set policy
  - phase: 260-02
    provides: Exact inactive runtime-v1.19 tuple and Phase-259-preserving selector
  - phase: 260-03
    provides: Successor kernel observation and explicit initiative projection
  - phase: 260-04
    provides: Immutable arena, Set scenario, condition, and revision-revalidation database substrate
  - phase: 260-17
    provides: Candidate public spec and map-config dispatch without current activation
provides:
  - Explicit runtime-v1.19 TypeScript preset and Match input dispatch beside unchanged Phase-259 defaults
  - Atomic four-condition scenario creation with frozen catalog, tuple, revisions, and exact D-04 admissions
  - Stable revision-key TypeScript competition parity matrices with Go retained as normal scheduler
affects: [260-06, 260-07, 260-08, 260-09, 260-14, competition, matchset-service]

tech-stack:
  added: []
  patterns: [explicit-version-dispatch, canonical-four-condition-scenario, revision-granular-admission, serializable-publication]

key-files:
  created: []
  modified:
    - packages/persistence/src/presets.ts
    - packages/persistence/src/match-service.ts
    - packages/persistence/src/match-service.test.ts
    - packages/persistence/src/integrity-evidence.ts
    - packages/persistence/src/matchset-service.ts
    - packages/persistence/src/matchset-service.test.ts
    - packages/persistence/src/competition.ts
    - packages/persistence/src/competition.test.ts

key-decisions:
  - "Resolve every unaddressed TypeScript scheduling call through the generated Phase-259 current selector; runtime-v1.19 exists only behind an exact explicit semantic key."
  - "Treat one canonical scenario as the atomic scheduling unit: exactly four explicit condition rows share one base seed and carry side, player, initiative, catalog, geometry, and request identity facts."
  - "Require each immutable Strategy Revision to have its own exact non-revoked real runtime-v1.19 admission before any candidate Match, job, or evidence lock can commit."
  - "Canonicalize candidate competition pairs by immutable revision key and derive stable player/pair identities, while leaving the legacy index, mirror, and seed-suffix matrix byte-exact on the current branch."

patterns-established:
  - "Candidate scheduling admission: validate complete scenario membership in memory, enter a serializable transaction, lock revisions/catalog/evidence, then publish all rows or roll back all rows."
  - "Competition parity identity: entrant order and insertion do not change an existing pair's scenario, condition, request, player, or Match identity."

requirements-completed: [STRAT-03, SET-01, SET-02, SET-03, SET-04, SET-05]

coverage:
  - id: D1
    description: "Explicit runtime-v1.19 Match inputs carry exact scenario, condition, side, initiative, catalog, semantic geometry, and signed request identity while current presets remain byte-exact."
    requirement: SET-03
    verification:
      - kind: unit
        ref: "packages/persistence/src/match-service.test.ts#candidate scheduling contracts"
        status: pass
      - kind: command
        ref: "pnpm exec vitest run packages/persistence/src/match-service.test.ts packages/persistence/src/competition.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Candidate MatchSet creation publishes exactly one scenario, four conditions, four Matches, and four jobs atomically only after exact revision-level runtime-v1.19 admission."
    requirement: SET-04
    verification:
      - kind: integration
        ref: "packages/persistence/src/matchset-service.test.ts#runtime-v1.19 candidate atomic creation"
        status: pass
      - kind: command
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm exec vitest run packages/persistence/src/matchset-service.test.ts --maxWorkers=1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Missing, revoked, cross-revision, substituted, or old-tuple evidence and faults at any write leave no candidate scheduling residue."
    requirement: STRAT-03
    verification:
      - kind: integration
        ref: "packages/persistence/src/matchset-service.test.ts#candidate revision admission and rollback"
        status: pass
    human_judgment: false
  - id: D4
    description: "The quarantined TypeScript competition path produces entrant-level side-by-initiative Cartesian coverage with stable pair identities and no seed-suffix fairness authority."
    requirement: SET-04
    verification:
      - kind: unit
        ref: "packages/persistence/src/competition.test.ts#runtime-v1.19 Cartesian candidate"
        status: pass
      - kind: command
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm exec vitest run packages/persistence/src/competition.test.ts packages/persistence/src/matchset-service.test.ts --maxWorkers=1"
        status: pass
    human_judgment: false

duration: 24min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 05: TypeScript Four-Condition Scheduler Candidate Summary

**TypeScript now has an explicitly addressed runtime-v1.19 scheduling candidate that atomically publishes exact four-condition Sets with revision-level real-evidence admission, while every default call remains Phase-259 exact and Go remains the normal scheduler.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-07-17T03:56:06Z
- **Completed:** 2026-07-17T04:20:10Z
- **Tasks:** 3 TDD tasks
- **Files modified:** 8

## Accomplishments

- Added a versioned runtime-v1.19 candidate preset and self-describing Match input without changing the generated current selector, existing presets, mirror rows, seed suffixes, or historical Open Field treatment.
- Added exact four-row scenario validation plus serializable catalog, revision, tuple, request, and D-04 evidence freezing before candidate jobs become visible.
- Proved with PostgreSQL that success creates exactly one scenario, four conditions, four Matches, and four jobs, while missing/revoked/substituted evidence and late write faults roll back the complete transaction.
- Migrated only the quarantined TypeScript parity path to stable revision-key pair generation; reordered or inserted entrants cannot change existing canonical identities, and Go remains the selected normal owner.

## Task Commits

Each TDD task was committed as a RED/GREEN pair:

1. **Task 1 RED: candidate preset and Match contract expectations** - `16cb3dc` (test)
2. **Task 1 GREEN: versioned candidate scheduling contract** - `52b07bb` (feat)
3. **Task 2 RED: atomic scenario and revision-admission expectations** - `6b8f37f` (test)
4. **Task 2 GREEN: serializable four-condition creation** - `dec86d7` (feat)
5. **Task 3 RED: competition parity and stable-identity expectations** - `840213e` (test)
6. **Task 3 GREEN: quarantined candidate competition parity** - `0bf497a` (feat)

## Files Created/Modified

- `packages/persistence/src/presets.ts` - Preserves current preset bytes and exposes schedulable candidate arena IDs plus base seeds only through runtime-v1.19 dispatch.
- `packages/persistence/src/match-service.ts` - Requires and validates every explicit successor scenario, condition, side, initiative, catalog, geometry, and request identity field.
- `packages/persistence/src/match-service.test.ts` - Proves current defaults, alias exclusion, explicit initiative, and seed-independent candidate identity.
- `packages/persistence/src/integrity-evidence.ts` - Adds an explicit candidate tuple identity constructor without changing current identity resolution.
- `packages/persistence/src/matchset-service.ts` - Generates canonical scenarios and atomically freezes exact catalog/revision/admission evidence before publishing jobs.
- `packages/persistence/src/matchset-service.test.ts` - Adds fake-transaction mutation tests and real PostgreSQL atomicity, D-04, revocation, and rollback proof.
- `packages/persistence/src/competition.ts` - Adds stable revision-key runtime-v1.19 pair generation and explicitly dispatched quarantined manual creation.
- `packages/persistence/src/competition.test.ts` - Proves Cartesian coverage, ordering/insertion stability, candidate rejection of legacy fairness claims, current compatibility, and retained Go ownership.

## Decisions Made

- Candidate presets reuse current arena/seed content only as versioned inputs; fairness authority comes exclusively from the public four-condition policy and semantic catalog, never `mirrorSides` or seed parsing.
- Candidate condition zero establishes canonical entrant A/B for reconstruction; the complete four-ID membership set must match the public spec generator exactly.
- Revision admission is checked under row locks against the same immutable revision, source artifact, language/provider/adapter lane, candidate tuple, real service receipt, and reviewed certificate.
- Candidate competition entrant and pair order uses UTF-8 revision-key ordering and hash-derived stable IDs; current calls retain their original array-index identities and output bytes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added explicit candidate integrity identity resolution**
- **Found during:** Task 2 GREEN
- **Issue:** The existing integrity identity constructor intentionally resolves only the current Phase-259 tuple, so candidate matrices could not be validated without either weakening the current resolver or adding a separate explicit seam.
- **Fix:** Added `createCandidateMatchSetIntegrityIdentityV119` and routed it only from explicit runtime-v1.19 MatchSet/evidence dispatch; the current constructor and all unaddressed callers remain unchanged.
- **Files modified:** `packages/persistence/src/integrity-evidence.ts`, `packages/persistence/src/matchset-service.ts`
- **Verification:** Candidate/current contract tests, full persistence suite, protected baseline, typecheck, build, and lint all pass.
- **Committed in:** `dec86d7`, `0bf497a`

---

**Total deviations:** 1 auto-fixed missing-critical issue.
**Impact on plan:** The deviation supplies the required explicit candidate validation boundary and does not activate, redirect, or weaken current scheduling.

## Issues Encountered

- The first real PostgreSQL candidate proof lacked the reviewed certificate row referenced by revision admission; the fixture setup was completed with the same exact immutable certificate identity required by production foreign keys, after which all success, revocation, and rollback cases passed.

## User Setup Required

None - the established local PostgreSQL test URL was sufficient and no new variable, secret, or service is required.

## Verification

- Plan-focused candidate command: 2 files, 44 tests passed.
- Full `@cowards/persistence` suite: 21 files, 279 tests passed.
- `pnpm --filter @cowards/persistence typecheck`: passed.
- `pnpm --filter @cowards/persistence build`: passed.
- `pnpm --filter @cowards/persistence lint`: passed.
- Protected-baseline check: passed with `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Protected user files remain the only unstaged changes: `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md`.
- Stub scan: no TODO, FIXME, HACK, placeholder, or unimplemented marker in changed runtime/test files.
- Threat checks: partial membership, seed spoofing, side/initiative substitution, catalog hash substitution, evidence absence/revocation/cross-revision reuse, transaction faults, and TypeScript scheduler elevation are covered and pass.

## TDD Gate Compliance

- Task 1 RED `16cb3dc` proved versioned candidate dispatch and explicit successor Match validation did not exist; GREEN `52b07bb` passes.
- Task 2 RED `6b8f37f` proved canonical scenario generation, D-04 admission, and atomic persistence did not exist; GREEN `dec86d7` passes.
- Task 3 RED `840213e` proved explicit competition dispatch still produced the six-row Phase-259 matrix and accepted a two-row candidate; GREEN `0bf497a` passes.

## Next Phase Readiness

- Plan 260-06 can mirror the exact candidate scenario, revision-admission, and catalog-freeze contract in the generated-authority Go scheduler.
- Plans 260-07 and 260-08 can consume persisted scenario/condition identity for exact completion and scoring without deriving fairness from Match order or seed suffixes.
- Plan 260-14 remains the sole activation owner; runtime-v1.19 is inactive, TypeScript remains rollback/parity/test only, and every current Phase-259 call is unchanged.
- The pre-existing user modifications to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remain untouched and uncommitted.

## Self-Check: PASSED

- All eight modified runtime/test files exist and all six RED/GREEN commits are present in git history.
- Focused and full PostgreSQL tests, typecheck, build, lint, stub scan, threat checks, and protected-baseline verification pass.
- No current selector, preset byte, current competition output, protected user file, or Go normal-scheduler ownership changed.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
