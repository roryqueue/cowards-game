---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "04"
subsystem: persistence
tags: [postgresql, arena-catalog, set-conditions, revision-revalidation, immutable-evidence]

requires:
  - phase: 260-01
    provides: Canonical arena catalog v1.37 and explicit four-condition Set policy
  - phase: 260-02
    provides: Exact inactive runtime-v1.19 tuple and Phase-259-preserving selector
provides:
  - Additive immutable arena catalog, Set scenario, and condition persistence
  - Historical-safe nullable successor Match identity with exact database constraints
  - Revision-scoped real runtime-v1.19 revalidation and revocation ledger
  - Transactional insert-or-exact-match released catalog repository APIs
affects: [260-05, 260-06, 260-07, 260-14, matchset-service, go-scheduling]

tech-stack:
  added: []
  patterns: [append-only-authority, insert-or-exact-match, explicit-condition-identity, revision-scoped-admission]

key-files:
  created:
    - packages/persistence/migrations/0026_arena_catalog_and_set_conditions.sql
    - packages/persistence/src/repositories.test.ts
  modified:
    - packages/persistence/src/migrations.ts
    - packages/persistence/src/migrations.test.ts
    - packages/persistence/src/schema.ts
    - packages/persistence/src/repositories.ts
    - packages/spec/src/index.ts

key-decisions:
  - "Keep migration 0026 strictly additive: historical rows remain null for every successor field and no current selector or runtime behavior changes."
  - "Install released arena catalogs under a serializable advisory lock and accept conflicts only when every persisted field and JSON config exactly match."
  - "Treat Open Field as an explicitly readable historical alias that can never pass the schedulable catalog lookup."
  - "Admit runtime-v1.19 only from one immutable Strategy Revision's exact source, artifact, lane, candidate tuple, real service receipt, and reviewed certificate evidence."

patterns-established:
  - "Released catalog records: insert once or prove exact equality; update and delete always fail."
  - "Successor Match identity: all condition fields are present together and reference one canonical persisted condition, or all remain null for history."
  - "Revision revalidation: one row per revision/runtime-v1.19, with append-only revocation and no replacement after revocation."

requirements-completed: [STRAT-03, SET-01, SET-02, SET-03, SET-04, SET-05]

coverage:
  - id: D1
    description: "Migration 0026 stores immutable catalog, scenario, condition, successor Match, and revision-level revalidation identities without rewriting historical rows."
    requirement: SET-03
    verification:
      - kind: integration
        ref: "packages/persistence/src/migrations.test.ts#arena catalog and Set condition migration"
        status: pass
      - kind: integration
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm exec vitest run packages/persistence/src/migrations.test.ts --maxWorkers=1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Released catalog installation is transactional and immutable, while historical aliases remain explicitly readable but nonschedulable."
    requirement: SET-01
    verification:
      - kind: integration
        ref: "packages/persistence/src/repositories.test.ts#released arena catalog repositories"
        status: pass
    human_judgment: false
  - id: D3
    description: "Only exact real non-revoked evidence for one immutable Strategy Revision yields a branded runtime-v1.19 admission result."
    requirement: STRAT-03
    verification:
      - kind: integration
        ref: "packages/persistence/src/repositories.test.ts#admits only exact non-revoked revision-scoped runtime-v1.19 evidence"
        status: pass
      - kind: integration
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm --filter @cowards/persistence test"
        status: pass
    human_judgment: false

duration: 22min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 04: Immutable Arena, Set, and Revision Evidence Substrate Summary

**PostgreSQL now stores exact released arena authority, explicit four-condition Set identity, and revision-scoped runtime-v1.19 revalidation evidence without activating the successor or reinterpreting history.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-07-17T02:16:27Z
- **Completed:** 2026-07-17T02:38:39Z
- **Tasks:** 3 TDD tasks
- **Files modified:** 7

## Accomplishments

- Added migration 0026 with append-only released catalog entries, canonical Set scenarios/conditions, nullable all-or-none successor Match identity, and exact revision-level runtime-v1.19 revalidation/revocation evidence.
- Added serializable insert-or-exact-match catalog installation plus frozen active/historical lookups, ensuring Open Field remains an explicit nonschedulable alias rather than distinct arena diversity.
- Added a branded fail-closed admission API that accepts only the candidate tuple and the same immutable revision's exact source, artifact, provider/lane, real service receipt, and reviewed non-revoked evidence.
- Preserved every current Phase-259 selector and protected user file unchanged; runtime-v1.19 remains inactive and no existing scheduling path consumes the new tables.

## Task Commits

Each TDD task was committed as a RED/GREEN pair, followed by one database hardening fix:

1. **Task 1 RED: migration substrate expectations** - `0c3ad6b` (test)
2. **Task 1 GREEN: additive immutable substrate** - `6527e53` (feat)
3. **Task 2 RED: exact catalog repository behavior** - `3757970` (test)
4. **Task 2 GREEN: transactional catalog installation** - `fcb83a0` (feat)
5. **Task 3 RED: revision revalidation substitutions** - `43f3cb8` (test)
6. **Task 3 GREEN: revision-scoped admission and revocation** - `dd0c2f9` (feat)
7. **Database exactness hardening** - `23f7e49` (fix)

## Files Created/Modified

- `packages/persistence/migrations/0026_arena_catalog_and_set_conditions.sql` - Additive immutable catalog, Set condition, successor Match, and revision revalidation schema.
- `packages/persistence/src/migrations.ts` - Pins migration 0026 as the latest migration name while retaining lexical forward-only execution.
- `packages/persistence/src/migrations.test.ts` - Static and live PostgreSQL proof for forward-only application, idempotency, history preservation, constraints, mutation rejection, and rollback.
- `packages/persistence/src/schema.ts` - Exact catalog, Set condition, and revision revalidation column groups.
- `packages/persistence/src/repositories.ts` - Transactional catalog installation/lookups and revision-level append/admission/revocation APIs.
- `packages/persistence/src/repositories.test.ts` - PostgreSQL idempotency, alias, mutation, substitution, absence, duplicate, and revocation tests.
- `packages/spec/src/index.ts` - Export-only exposure of the already-frozen Plan-01 arena and Set authorities for package consumers.

## Decisions Made

- Kept all successor Match columns nullable and added no backfill. Existing Match, MatchSet, arena, Chronicle, receipt, certificate, evidence, and Strategy Revision records remain original historical facts.
- Pinned the database layer to the exact candidate runtime-v1.19 tuple ID; a syntactically valid older or substituted tuple cannot be relabeled as current evidence.
- Required all four explicit condition semantics to agree with their canonical ordinal and stored entrant/player identities. Seeds carry no fairness meaning.
- Kept legacy `upsertArenaVariant` and generic historical reads unchanged for existing dispatch. Successor consumers receive separate immutable catalog APIs and no current caller was switched in this plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Exported the frozen Plan-01 authorities from the spec package barrel**
- **Found during:** Task 2 GREEN
- **Issue:** `arena-catalog-v1-37.ts` and `set-condition-policy-v1-37.ts` existed but were not exported by `@cowards/spec`, blocking the required repository-to-spec authority link.
- **Fix:** Added export-only barrel entries; no authority value, selector, registry, or current pointer changed.
- **Files modified:** `packages/spec/src/index.ts`
- **Verification:** Persistence typecheck, ESLint, catalog repository tests, and zero diff in current selector/tuple source files.
- **Committed in:** `fcb83a0`

---

**Total deviations:** 1 auto-fixed blocking issue.
**Impact on plan:** The deviation exposes already-frozen candidate data to the declared consumer and does not activate or alter behavior.

## Issues Encountered

None.

## User Setup Required

None - the existing PostgreSQL test URLs were used and no new environment variable, secret, or service is required.

## Verification

- Plan-focused PostgreSQL command: 2 files, 27 tests passed.
- Full `@cowards/persistence` suite: 21 files, 264 tests passed.
- `pnpm --filter @cowards/persistence typecheck`: passed.
- `pnpm --filter @cowards/persistence build`: passed.
- ESLint on every changed TypeScript file: passed.
- Protected-baseline check: passed with `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Current-selector drift check: no changes to `current-semantic-authority-source.ts`, generated current authority, versions, or integrity-authority implementation.
- Stub scan: no TODO, FIXME, placeholder, coming-soon, or unavailable implementation markers.

## TDD Gate Compliance

- Task 1 RED `0c3ad6b` precedes GREEN `6527e53`.
- Task 2 RED `3757970` precedes GREEN `fcb83a0`.
- Task 3 RED `43f3cb8` precedes GREEN `dd0c2f9`.
- Every RED failed for the absent migration or repository API, and every GREEN passes the plan's exact PostgreSQL command.

## Next Phase Readiness

- Plan 260-05 can create canonical four-condition Sets against the immutable scenario/condition substrate and lock exact catalog snapshots.
- Later scheduling activation must additionally require `getStrategyRevisionV119Admission`; this plan deliberately wires no current MatchSet caller and changes no current eligibility behavior.
- The pre-existing user modifications to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remain untouched and uncommitted.

## Self-Check: PASSED

- Both created files and all five planned persistence files exist; the single export-only deviation is documented.
- All seven implementation/test commits exist in git history with no unexpected deletion.
- Focused and full persistence tests, typecheck, build, lint, immutable-history checks, candidate inactivity checks, and protected-baseline checks pass.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
