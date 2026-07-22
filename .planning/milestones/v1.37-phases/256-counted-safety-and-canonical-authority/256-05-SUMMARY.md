---
phase: 256-counted-safety-and-canonical-authority
plan: "05"
subsystem: persistence-integrity
tags: [postgresql, match-creation, matchset-matrix, exact-identity, rollback, tdd]
requires:
  - phase: 256-03
    provides: ordered per-side runtime evidence and Match evidence contracts
  - phase: 256-04
    provides: exact tuple, normalized entrant, ordered-pair schema, and validated persistence primitives
  - phase: 256-15
    provides: verified-import-backed certificate authority and production fail-closed evidence posture
provides:
  - exact semantic tuple and ordered per-side evidence on every direct TypeScript Match and queued job
  - complete normalized two-to-eight entrant evidence on every matrix MatchSet
  - generic execution-entrant rows, competition-entrant links, and derived ordered Match/job evidence pairs
  - pre-SQL identity rejection and whole-transaction rollback proof
affects: [phase-256-callers, phase-256-scheduling, phase-256-completion, go-writers, competition, workshop]
tech-stack:
  added: []
  patterns: [validator-branded scheduling identity, deterministic entrant-key map, pre-SQL complete-set validation, copied ordered evidence snapshots]
key-files:
  created: []
  modified:
    - packages/persistence/src/match-service.ts
    - packages/persistence/src/match-service.test.ts
    - packages/persistence/src/matchset-service.ts
    - packages/persistence/src/matchset-service.test.ts
key-decisions:
  - "A matrix accepts one IntegritySchedulingIdentity with a deterministic entrant-key map; the writer mints one validator-branded MatchSet identity before any SQL and derives every ordered pair from it."
  - "Direct Matches and matrix members use CreateMatchRecordInput for gameplay fields, while only direct createMatch accepts a per-Match CreateMatchInput containing the required exact identity."
  - "Competition entrants link to generic execution-entrant rows by exact entrant key; no MatchSet-wide executable lane is inferred from snapshots or language labels."
patterns-established:
  - "Pre-SQL gate: complete entrant coverage, tuple certification, revision binding, side order, current freshness, and competition links are validated before repository reads or inserts."
  - "Transactional copy: MatchSet tuple/set identity, generic entrants, competition links, Matches, and queued jobs are written in one transaction with the same ordered evidence values."
requirements-completed: [SAFE-01, SAFE-02, AUTH-02, AUTH-03]
coverage:
  - id: D1
    description: "Direct TypeScript Match creation requires a validator-minted tuple and exact current bottom/top evidence pair and copies it identically to Match and job."
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "packages/persistence/src/match-service.test.ts#match creation contracts"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/persistence exec vitest run src/match-service.test.ts src/matchset-service.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Matrix MatchSet creation validates complete mixed-language two, three, and eight entrant evidence before SQL and derives every ordered Match/job pair."
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "packages/persistence/src/matchset-service.test.ts#exact MatchSet creation"
        status: pass
    human_judgment: false
  - id: D3
    description: "PostgreSQL persists exact MatchSet, entrant, Match, and job identity while rejected input leaves every record family at zero."
    requirement: AUTH-03
    verification:
      - kind: integration
        ref: "packages/persistence/src/matchset-service.test.ts#PostgreSQL MatchSet integrity identity and zero rows"
        status: pass
      - kind: integration
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm --filter @cowards/persistence exec vitest run src/matchset-service.test.ts -t integrity identity|zero rows"
        status: pass
    human_judgment: false
duration: 18min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 05: Transactional Match and MatchSet Identity Summary

**Active TypeScript Match writers now reject incomplete identity before SQL and transactionally persist one certified semantic tuple with exact per-entrant and ordered per-side execution evidence.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-13T04:00:00Z
- **Completed:** 2026-07-13T04:18:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Split gameplay-only `CreateMatchRecordInput` from exact-identity `CreateMatchInput`, requiring direct Match creation to carry a validator-minted MatchSet identity and current ordered bottom/top evidence pair.
- Added a single top-level `IntegritySchedulingIdentity` for matrix MatchSets, deterministic two-to-eight entrant coverage, generic execution-entrant persistence, exact competition-entrant links, and derived ordered Match/job snapshots.
- Proved mixed TypeScript/Python/Rust/Zig matrices, missing/extra/stale/wrong-revision/swapped evidence rejection before SQL, late-child rollback, and real PostgreSQL identity equality and zero-row rejection.

## Task Commits

Each TDD task was committed atomically:

1. **Task 1 RED: direct Match exact identity tests** - `4941c22` (test)
2. **Task 1 GREEN: exact direct Match writer** - `4ea437e` (feat)
3. **Task 2 RED: complete MatchSet identity tests** - `d2e1f47` (test)
4. **Task 2 GREEN: transactional MatchSet identity writer** - `6793d66` (feat)
5. **Task 2 PostgreSQL assertion expansion** - `ec96fa2` (test)

## Files Created/Modified

- `packages/persistence/src/match-service.ts` - Direct Match record/input split, validator-brand and current-evidence checks, and identical ordered Match/job inserts.
- `packages/persistence/src/match-service.test.ts` - Direct heterogeneous identity, rejection-before-transaction, copied-snapshot, and rollback tests.
- `packages/persistence/src/matchset-service.ts` - Complete-set validation, normalized MatchSet and entrant persistence, competition links, and ordered matrix member snapshots.
- `packages/persistence/src/matchset-service.test.ts` - Two/three/eight entrant unit matrix plus configured-PostgreSQL exact persistence and zero-row proof.

## Decisions Made

- Matrix callers provide one compatibility/bundle/generation envelope and a deterministic map keyed by stable entrant identity. The writer, not the caller, derives expected coverage from Match records and mints the branded normalized identity.
- Match/job side snapshots are always derived from each record's bottom/top entrant keys and Strategy Revision bindings; executable language and lane identity remain per entrant.
- Competition rows carry an explicit `execution_entrant_key` foreign-key link to the generic evidence row rather than relying on their existing runtime or snapshot JSON.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Serialized the normalized entrant set as one JSONB value**
- **Found during:** Task 2 configured-PostgreSQL verification
- **Issue:** `node-postgres` serializes JavaScript arrays as PostgreSQL arrays, so passing the normalized entrant set directly to a JSONB column produced `invalid input syntax for type json`.
- **Fix:** Explicitly serialized only the normalized evidence-set parameter while preserving typed objects for the remaining JSONB snapshots.
- **Files modified:** `packages/persistence/src/matchset-service.ts`
- **Verification:** Configured-PostgreSQL exact persistence and zero-row tests passed.
- **Committed in:** `6793d66`

---

**Total deviations:** 1 auto-fixed (1 correctness bug).
**Impact on plan:** The fix is required for the planned PostgreSQL writer and changes no contract or gameplay behavior.

## Issues Encountered

- The local PostgreSQL setup helper inherited the host database username when PostgreSQL was already running with password authentication. Running it with the documented application `PGUSER`/`PGPASSWORD` completed all migrations; no repository change was required.
- The package-wide TypeScript build now reports the deliberately unmigrated competition, Workshop, ladder, dev, and demo callers that do not yet supply the required identity. Plan 256-16 owns those fail-closed caller migrations and the structural inventory; focused Plan 05 tests and PostgreSQL gates pass.

## User Setup Required

None - the existing local PostgreSQL topology and repository dependencies were sufficient.

## Verification

- `PGUSER=cowards PGPASSWORD=cowards scripts/dev-local-postgres.sh --setup-only` - migrations 0001 through 0012 present.
- `pnpm --filter @cowards/persistence exec vitest run src/match-service.test.ts src/matchset-service.test.ts` - 18 passed, 2 configured-PostgreSQL tests skipped as designed.
- Configured PostgreSQL focused run - 2/2 passed with exact MatchSet/entrant/Match/job snapshots and zero rows on rejection.
- `git diff --check` - passed.

## Next Phase Readiness

- Plans 256-06 and 256-08 can carry and revalidate the persisted ordered pair through completion, Chronicle insertion, scheduling, and claim.
- Plan 256-16 must migrate every existing competition, Workshop, ladder, dev, demo, and preset caller to resolve verified entrant evidence; until then, those callers fail to typecheck rather than silently create identity-free rows.
- Go creation parity remains owned by Plans 256-10 through 256-12.

## Self-Check: PASSED

- All four modified artifacts exist and all five Task 1/Task 2 commits exist in order.
- Direct Match, mixed entrant matrix, pre-SQL rejection, late rollback, PostgreSQL exact snapshot, and PostgreSQL zero-row gates pass.
- No new package, public output, gameplay rule, historical rewrite, source exposure, or alternate execution authority was introduced.
- The user-owned dirty consolidated spec and `.planning/config.json` remained unstaged and untouched.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
