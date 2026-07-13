---
phase: 256-counted-safety-and-canonical-authority
plan: "04"
subsystem: persistence-integrity
tags: [postgresql, exact-identity, append-only, evidence, transactions, tdd]
requires:
  - phase: 256-01
    provides: immutable six-component semantic tuple and exact resolver
  - phase: 256-02
    provides: exact executable lane identity, certificate references, and decisions
  - phase: 256-03
    provides: ordered runtime and Match evidence contracts
provides:
  - nullable-for-history exact compatibility identity schema for current MatchSets
  - normalized two-to-eight entrant evidence sets and ordered side-pair snapshots
  - verified-attestation-closed certificates and append-only evidence/governance tables
  - reusable validated SQL values, row mappers, and atomic persistence transaction
affects: [phase-256-writers, verified-attestation-import, authority-publisher, go-backend, runtime-service, historical-resolution]
tech-stack:
  added: []
  patterns: [domain-separated framed hashing, branded validated identity, composite exact-evidence foreign keys, append-only PostgreSQL triggers]
key-files:
  created:
    - packages/persistence/migrations/0012_integrity_authority.sql
    - packages/persistence/src/integrity-evidence.ts
    - packages/persistence/src/integrity-evidence.test.ts
  modified:
    - packages/persistence/src/migrations.test.ts
    - packages/persistence/src/index.ts
key-decisions:
  - "The MatchSet stores one semantic tuple and one normalized complete evidence-set hash; executable identity remains per entrant and ordered per Match side."
  - "Historical rows remain nullable and unresolved, while validated current writes are all-or-none and immutable after first persistence."
  - "Certificate and entrant foreign keys bind kind, version, record hash, registry generation, and lane identity rather than trusting certificate IDs alone."
patterns-established:
  - "Validated identity: only objects minted by createMatchSetIntegrityIdentity may produce SQL values or be persisted."
  - "Exact snapshots: UTF-8 byte ordering and domain-separated length-framed SHA-256 bind every normalized entrant field without relying on canonical JSON."
requirements-completed: [SAFE-03, AUTH-02, AUTH-03, AUTH-04]
coverage:
  - id: D1
    description: "PostgreSQL represents one semantic tuple plus complete per-entrant evidence and ordered bottom/top snapshots without backfilling historical rows"
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "packages/persistence/src/migrations.test.ts#defines exact per-entrant identity and append-only integrity authority"
        status: pass
      - kind: integration
        ref: "fresh PostgreSQL database applied migrations 0001 through 0012"
        status: pass
    human_judgment: false
  - id: D2
    description: "Shared primitives reject partial, mixed, duplicate, uncertified, wrong-revision, and swapped-side identity before SQL"
    requirement: AUTH-03
    verification:
      - kind: unit
        ref: "packages/persistence/src/integrity-evidence.test.ts#exact MatchSet integrity identity"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/persistence typecheck"
        status: pass
    human_judgment: false
  - id: D3
    description: "Verified evidence and governance authorities reject mutation and partial transactions roll back without rewriting historical source rows"
    requirement: SAFE-03
    verification:
      - kind: integration
        ref: "packages/persistence/src/integrity-evidence.test.ts#PostgreSQL integrity schema"
        status: pass
      - kind: unit
        ref: "pnpm --filter @cowards/persistence test"
        status: pass
    human_judgment: false
duration: 14min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 04: Exact Identity Persistence Summary

**PostgreSQL now preserves one exact MatchSet tuple, a normalized per-entrant evidence set, ordered side snapshots, and immutable verified authority without rewriting unresolved history.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-13T02:49:34Z
- **Completed:** 2026-07-13T03:03:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added migration 0012 with nullable historical identity columns, exact current-write all-or-none constraints, per-entrant execution evidence, ordered Match/job/Chronicle snapshots, and immutable release/evidence/governance ledgers.
- Added a runtime-branded validator that normalizes two through eight entrants by UTF-8 key bytes, binds every exact tuple/lane/certificate/decision field, and rejects partial or forged identity before SQL.
- Proved the migration on a fresh PostgreSQL database, append-only mutation rejection, direct certificate rejection, late-insert rollback, and unchanged historical source-row hashes.

## Task Commits

Each TDD task was committed through RED and GREEN:

1. **Task 1 RED: integrity authority migration contract** - `17f2316` (test)
2. **Task 1 GREEN: exact identity and append-only schema** - `ad08234` (feat)
3. **Task 2 RED: exact identity persistence matrix** - `906d802` (test)
4. **Task 2 GREEN: validated persistence primitives and PostgreSQL proof** - `94267f6` (feat)

## Files Created/Modified

- `packages/persistence/migrations/0012_integrity_authority.sql` - Exact tuple, normalized entrant set, ordered pair, verified certificate closure, immutable authority, and no-rewrite constraints.
- `packages/persistence/src/integrity-evidence.ts` - Complete-set validator, deterministic hashes, ordered pair selector, SQL value helpers, row mapper, and atomic persistence primitive.
- `packages/persistence/src/integrity-evidence.test.ts` - Two-to-eight entrant, mutation, row-map, fake transaction, and real PostgreSQL proof.
- `packages/persistence/src/migrations.test.ts` - Numbered migration and structural authority assertions.
- `packages/persistence/src/index.ts` - Public persistence export for later writers and verified import.

## Decisions Made

- Used a module-owned WeakSet brand so a structurally similar object cannot bypass exact validation and reach SQL.
- Sorted stable entrant keys by raw UTF-8 bytes and hashed explicit length-framed fields, avoiding locale drift and avoiding premature dependence on the Phase-258 canonical JSON profile.
- Added nullable `integrity_match_set_id` links on Match, job, and Chronicle rows so ordered entrant keys have enforceable composite foreign keys without changing historical rows.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Closed certificate and ordered-pair identity at the database boundary**
- **Found during:** Task 2 PostgreSQL threat review
- **Issue:** ID-only certificate foreign keys could not prove that stored kind, version, record hash, generation, and lane identity matched the referenced verified certificate; ordered Match evidence also needed an explicit nullable MatchSet link for exact composite FKs.
- **Fix:** Added composite certificate/attestation and entrant/certificate foreign keys plus immutable persisted-identity triggers and nullable exact MatchSet links.
- **Files modified:** `packages/persistence/migrations/0012_integrity_authority.sql`, `packages/persistence/src/integrity-evidence.ts`
- **Verification:** Fresh-database migration and configured PostgreSQL integration suite passed.
- **Committed in:** `94267f6`

---

**Total deviations:** 1 auto-fixed (1 missing critical integrity control).
**Impact on plan:** The change completes the planned anti-tampering boundary without migrating active writers or changing gameplay/history.

## Issues Encountered

- The local PostgreSQL helper inherited the host username against the already-running password-authenticated container. Supplying the documented application user/password environment allowed the normal setup/migration path to run; no repository change was needed.

## User Setup Required

None - the existing local PostgreSQL topology was sufficient.

## Verification

- Fresh database applied migrations `0001` through `0012` with no skips or errors.
- `pnpm --filter @cowards/persistence exec vitest run src/migrations.test.ts src/integrity-evidence.test.ts` - 18 passed, 2 configured-PostgreSQL tests skipped as designed.
- Configured PostgreSQL focused run - 2/2 passed.
- `pnpm --filter @cowards/persistence test` - 122 passed, 3 skipped.
- `pnpm --filter @cowards/persistence typecheck` - passed.
- `git diff --check` - passed.

## Next Phase Readiness

- Plans 256-05/06/08/12 can migrate active TypeScript and Go writers onto one exact persistence primitive without changing schema semantics.
- Plan 256-15 can implement the sole verified-attestation import against certificate rows that already require exact passing-import provenance.
- Historical resolution and governance correction remain read-only/event-derived work for their owning plans; no historical row was guessed or rewritten here.

## Self-Check: PASSED

- All three created artifacts and both modified artifacts exist.
- All four RED/GREEN commits exist in order.
- Focused, full persistence, typecheck, fresh-migration, real-PostgreSQL rollback, immutability, and historical hash checks pass.
- The dirty consolidated spec and `.planning/config.json` remained unstaged and untouched.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
