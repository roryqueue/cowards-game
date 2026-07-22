---
phase: 256-counted-safety-and-canonical-authority
plan: "06"
subsystem: persistence-integrity
tags: [postgresql, chronicle, completion, exact-identity, rollback, tdd]
requires:
  - phase: 256-03
    provides: singular semantic tuple and ordered runtime/Match evidence contracts
  - phase: 256-04
    provides: immutable MatchSet tuple, normalized entrants, and ordered-pair persistence
  - phase: 256-05
    provides: exact identity on every current TypeScript Match and queued job
  - phase: 256-15
    provides: verified-attestation-backed certificate identity
provides:
  - current Chronicle writer requiring one branded tuple and exact ordered bottom/top evidence pair
  - locked completion recheck against Match, job, MatchSet, and runtime-response identity
  - retryable system-failure classification with no player penalty or gameplay mutation
  - configured-PostgreSQL late-failure rollback and exact Chronicle propagation proof
affects: [phase-256-claim, runtime-service, go-completion, chronicle-conformance, integrated-service-proof]
tech-stack:
  added: []
  patterns: [lock-then-compare, branded identity reconstruction, exact conflict equivalence, transaction-wide rollback]
key-files:
  created: []
  modified:
    - packages/persistence/src/chronicle-store.ts
    - packages/persistence/src/chronicle-store.test.ts
    - packages/persistence/src/complete-match.ts
    - packages/persistence/src/complete-match.test.ts
    - packages/persistence/src/integrity-evidence.ts
key-decisions:
  - "Completion reconstructs authority from locked persisted MatchSet and entrant rows; runtime-response evidence is compared but never trusted as Chronicle authority."
  - "Any tuple, lane, certificate, freshness, revocation-state, side, revision, bundle, or generation drift is a retryable system failure with playerPenalty=false."
  - "A Chronicle conflict is idempotent only when artifact bytes and every persisted ordered-identity field are exact; history is never upgraded or inferred."
patterns-established:
  - "Completion gate: lock job, Match, and MatchSet; reconstruct the branded identity; compare Match/job/response; only then write Chronicle and lifecycle state."
  - "Historical storage: tuple-less v1.4 rows remain readable and byte-immutable, while every new put requires current exact identity."
requirements-completed: [SAFE-02, AUTH-02, AUTH-03, AUTH-04]
coverage:
  - id: D1
    description: "Every current Chronicle insert requires the exact semantic tuple and ordered bottom/top entrant evidence while tuple-less v1.4 bytes remain unchanged"
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "packages/persistence/src/chronicle-store.test.ts#Chronicle storage"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/persistence exec vitest run src/chronicle-store.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Completion rejects every side's stale, revoked, mixed, swapped, certificate, or generation drift as retryable system failure without player penalty or mutation"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "packages/persistence/src/complete-match.test.ts#Match completion integrity identity"
        status: pass
      - kind: integration
        ref: "packages/persistence/src/complete-match.test.ts#keeps Chronicle, gameplay, outcome, attempt, and player state unchanged for every side's drift"
        status: pass
    human_judgment: false
  - id: D3
    description: "Configured PostgreSQL rolls back Chronicle and lifecycle writes after a late error and copies the locked pair exactly on success"
    requirement: AUTH-03
    verification:
      - kind: integration
        ref: "packages/persistence/src/complete-match.test.ts#rolls back a late write and then copies the locked pair exactly on success"
        status: pass
      - kind: other
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm --filter @cowards/persistence exec vitest run src/complete-match.test.ts -t integrity identity|system failure"
        status: pass
    human_judgment: false
duration: 13min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 06: Exact Completion and Chronicle Identity Summary

**TypeScript completion now reconstructs and locks persisted scheduling authority, rejects all response drift as non-penalizing system failure, and inserts Chronicles with the unchanged ordered identity in one rollback-safe transaction.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-07-13T04:24:35Z
- **Completed:** 2026-07-13T04:37:26Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Made the Chronicle writer accept only one validator-branded semantic tuple, authority bundle/generation, and exact bottom/top pair, with SQL joins that prove the linked MatchSet and entrant snapshots before insertion.
- Added a completion transaction that locks Match, job, and MatchSet identity, reconstructs the normalized entrant authority, compares the runtime response exactly, and uses only the locked identity for Chronicle insertion.
- Proved per-side stale/revoked/mixed/swapped/certificate/generation drift leaves Chronicle, Match outcome/stats, job, and attempt state unchanged; a forced late Match write likewise rolls the Chronicle back before exact success.

## Task Commits

Each TDD task was committed through RED and GREEN:

1. **Task 1 RED: current Chronicle identity and history cases** - `19661cf` (test)
2. **Task 1 GREEN: exact Chronicle identity writer** - `7f47d33` (feat)
3. **Task 2 RED: completion drift and PostgreSQL rollback cases** - `bfc97a4` (test)
4. **Task 2 GREEN: locked completion recheck and propagation** - `092c2a7` (feat)
5. **Acceptance hardening: pin immutable v1.4 Chronicle hash** - `ede2cdb` (test)

## Files Created/Modified

- `packages/persistence/src/chronicle-store.ts` - Exact current insert input, MatchSet/entrant SQL proof, strict idempotent conflict equivalence, and unchanged historical reads.
- `packages/persistence/src/chronicle-store.test.ts` - Partial/swapped/singular/wrong-revision/forged pair rejection plus v1.4 byte/hash preservation.
- `packages/persistence/src/complete-match.ts` - Locked identity loader, persisted pair reconstruction, response comparison, system-failure type, Chronicle handoff, and guarded completion update.
- `packages/persistence/src/complete-match.test.ts` - Heterogeneous unit matrix and isolated configured-PostgreSQL no-mutation, rollback, and propagation proof.
- `packages/persistence/src/integrity-evidence.ts` - Canonical field-order reconstruction for JSONB-loaded tuples and semantic equality for normalized JSONB evidence.

## Decisions Made

- Runtime responses are evidence to compare, never authority to persist. Chronicle insertion receives only the identity reconstructed from locked database rows.
- Integrity drift throws `MatchCompletionIntegritySystemFailure` with stable internal code `EVIDENCE_IDENTITY_MISMATCH`, `failureCategory: system_failure`, `retryable: true`, and `playerPenalty: false`; the caller may then use the normal system-failure retry path outside the rolled-back completion transaction.
- Duplicate Chronicle insertion is accepted only when Chronicle artifact/hash plus MatchSet, side keys, snapshots, and pair hash are all exact. A historical or mismatched row cannot mask a failed current insert.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reconstructed canonical tuple field order after PostgreSQL JSONB loading**
- **Found during:** Task 2 configured-PostgreSQL exact-success proof
- **Issue:** PostgreSQL JSONB does not preserve object key order, while the canonical compatibility tuple deliberately requires fixed field order before hashing. The existing persisted-row parser therefore rejected semantically exact tuple bytes after a database round trip.
- **Fix:** Rebuilt each persisted entrant's semantic tuple in canonical field order before validation and used semantic deep equality for the normalized JSONB evidence set.
- **Files modified:** `packages/persistence/src/integrity-evidence.ts`
- **Verification:** Both configured-PostgreSQL completion tests and the full non-configured persistence suite passed.
- **Committed in:** `092c2a7`

---

**Total deviations:** 1 auto-fixed (1 correctness bug).
**Impact on plan:** The fix makes the already-planned persisted identity parser usable after a real JSONB round trip without weakening fixed-order hashing or changing any stored bytes.

## Issues Encountered

- The local PostgreSQL helper inherits the host username when a password-authenticated database is already running. Supplying the documented `PGUSER=cowards PGPASSWORD=cowards` values completed migrations and proof without a repository change.
- Package-wide typecheck still reports the known Plan-256-05 fail-closed caller migration errors in competition, ladder, Workshop, smoke, preset tests, and one prior fake-pool typing site. Plan 256-16 owns that caller inventory; Plan 256-06 introduced no remaining type errors in its files.

## User Setup Required

None - the existing local PostgreSQL topology was sufficient.

## Verification

- `pnpm --filter @cowards/persistence exec vitest run src/complete-match.test.ts src/chronicle-store.test.ts` - 8 passed, 2 configured-PostgreSQL cases skipped as designed.
- Configured PostgreSQL focused run - 10/10 passed across Chronicle and completion tests.
- Plan-targeted configured PostgreSQL run - 3 selected integrity/system-failure tests passed, 1 unrelated test skipped.
- `pnpm --filter @cowards/persistence test` - 141 passed, 10 configured-PostgreSQL tests skipped as designed.
- `git diff --check` - passed.

## Next Phase Readiness

- Plan 256-08 can return the same locked identity from claim and rely on completion to reject in-flight drift before all gameplay mutation.
- Runtime-service and Go completion parity can use the same response-vs-persisted identity rule without trusting request or response certificate bodies.
- No historical Chronicle bytes, Match state semantics, Action legality, event order, outcome rules, Strategy observations, memories, or player penalties changed.

## Self-Check: PASSED

- Both RED/GREEN commit pairs plus the fixed historical-hash acceptance commit exist in order, and all five modified artifacts exist.
- Unit, full persistence, configured-PostgreSQL drift, late rollback, exact success, Chronicle identity, historical hash, and diff checks pass.
- The user-owned dirty consolidated spec and `.planning/config.json` remained unstaged and untouched.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
