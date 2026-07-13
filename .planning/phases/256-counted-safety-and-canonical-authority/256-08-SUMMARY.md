---
phase: 256-counted-safety-and-canonical-authority
plan: "08"
subsystem: persistence-integrity
tags: [postgresql, scheduling, job-claim, evidence-authority, fail-closed]
requires:
  - phase: 256-05
    provides: exact MatchSet and ordered per-side evidence persistence
  - phase: 256-17
    provides: signed authority bundle and reference-only execution identity
  - phase: 256-18
    provides: installed publication receipt and exact source ledger
provides:
  - installed-publication-derived TypeScript ladder scheduling gate
  - exact source, generation, tuple, lane, and certificate revalidation
  - pre-claim stale/revoked/superseded/disabled evidence rejection
  - immutable semantic tuple and ordered evidence returned by successful claims
affects: [phase-256-go-parity, phase-259-conformance, ladder, workers, runtime-service]
tech-stack:
  added: []
  patterns: [installed-publication lock-before-use, exact-source receipt validation, SQL pre-claim evidence gate]
key-files:
  created: []
  modified:
    - packages/persistence/src/ladder.ts
    - packages/persistence/src/ladder.test.ts
    - packages/persistence/src/jobs.ts
    - packages/persistence/src/jobs.test.ts
key-decisions:
  - "Caller-declared resolver identity is never scheduling authority: an installed append-only publication and exact source ledger must validate first, then every returned entrant reference must be present and current in that publication."
  - "Claim takes a shared publication-event lock and publication-head lock before selecting a candidate, so installation or generation drift cannot cross the mutation boundary."
  - "An ineligible candidate is filtered by the locking SELECT itself and receives no job, Match, lease, attempt, or status mutation."
patterns-established:
  - "Resolve then bind: publication receipt and sources establish authority; resolver output only identifies exact published entrant records."
  - "Filter before mutate: all tuple, snapshot, certificate, status, freshness, revocation, supersession, and lane-control predicates live in the SKIP LOCKED candidate query."
requirements-completed: [SAFE-01, SAFE-02, AUTH-02, AUTH-03]
coverage:
  - id: D1
    description: "Ladder scheduling locks and validates one current installed publication, exact receipt, exact source set, semantic tuple, and complete entrant map before writes"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "packages/persistence/src/ladder.test.ts#ignores caller-declared production authority and requires an installed publication before scheduling"
        status: pass
      - kind: integration
        ref: "pnpm --filter @cowards/persistence exec vitest run src/ladder.test.ts src/matchset-service.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Job claim rechecks the exact installed generation, source records, ordered snapshots, containment/conformance certificates, revocations, supersessions, controls, and freshness before lifecycle mutation"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "packages/persistence/src/jobs.test.ts#binds candidates to the exact installed authority, ordered evidence, and current per-side certificates"
        status: pass
      - kind: integration
        ref: "packages/persistence/src/jobs.test.ts#PostgreSQL integrity identity before claim"
        status: pass
    human_judgment: false
  - id: D3
    description: "A valid claim carries the immutable semantic tuple and exact ordered bottom/top execution evidence while rejected candidates remain lifecycle-equivalent"
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "packages/persistence/src/jobs.test.ts#returns the locked semantic tuple and ordered entrant evidence on a valid claim"
        status: pass
      - kind: integration
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm --filter @cowards/persistence exec vitest run src/jobs.test.ts -t 'integrity identity|before claim'"
        status: pass
    human_judgment: false
duration: 16min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 08: TypeScript Scheduling and Pre-Claim Integrity Summary

**TypeScript ladder scheduling and job claim now derive execution authority from one exact installed publication and reject every stale or unbound candidate before lifecycle mutation.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-07-13T06:05:41Z
- **Completed:** 2026-07-13T06:21:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Replaced caller-declared scheduling authority with an in-transaction installed-publication gate that verifies exact payload/envelope hashes, generation, tuple manifest, installed receipt, sorted source IDs, source record hashes, and source manifest before entrant resolution or writes.
- Bound every resolved ladder entrant to the installed payload by exact lane hash, containment/conformance reference, revocation/supersession/control state, purpose, evaluation instant, freshness, and registry generation while preserving independent mixed-language identities.
- Rebuilt the real `FOR UPDATE ... SKIP LOCKED` claim query around an exact authority CTE and per-side snapshot/certificate joins; invalid candidates are skipped by the SELECT and never reach any job, Match, lease, attempt, or status update.
- Added configured PostgreSQL proof that a queued Match/job without exact current authority remains byte-for-byte lifecycle-equivalent after a targeted claim attempt.

## Task Commits

1. **Task 1 RED: installed publication scheduling authority** - `5841911` (test)
2. **Task 1 GREEN: exact ladder scheduling publication gate** - `62a156e` (feat)
3. **Task 2 RED: exact pre-claim authority and no-mutation contract** - `3b1fc39` (test)
4. **Task 2 GREEN: evidence-bound claim query and locked snapshot return** - `c79c8c4` (feat)

## Files Created/Modified

- `packages/persistence/src/ladder.ts` - Publication event/head locking, receipt/source verification, and exact entrant binding before scheduling.
- `packages/persistence/src/ladder.test.ts` - Four-language caller-bypass and no-write scheduling proof.
- `packages/persistence/src/jobs.ts` - Installed-authority candidate CTE, per-side evidence joins, drift filters, and immutable claim snapshot return.
- `packages/persistence/src/jobs.test.ts` - Structural query assertions, no-mutation fake proof, successful snapshot proof, and isolated-schema PostgreSQL proof.

## Decisions Made

- Kept resolver output as a mapping mechanism only. It cannot authorize a lane because the publication is loaded and validated first and every returned identity/reference is independently required to exist in the exact installed payload.
- Used the publication payload hash without its `sha256:` transport prefix for the existing persisted `authority_bundle_hash`, matching the Plan 05 integrity contract while retaining the prefixed value in the publication ledger.
- Allowed an exhibition claim to require current containment while requiring current conformance for a `counted` scheduling snapshot; disabled lanes always reject.
- Preserved the Phase 256 quarantine: production publication still cannot contain conformance certificates until Phase 259 supplies separately reviewed executable proof, so no current lane becomes counted through this plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Locked publication events as well as the generation head**
- **Found during:** Task 2 TOCTOU review
- **Issue:** Locking only the mutable generation head would not block a concurrent installer from appending an `installed` event for an already prepared newer publication between evidence selection and mutation.
- **Fix:** Added a transaction-scoped shared lock on the append-only publication-event table before both scheduling and claim selection, then locked the generation head for the same transaction.
- **Files modified:** `packages/persistence/src/ladder.ts`, `packages/persistence/src/jobs.ts`
- **Verification:** Focused unit suite, package typecheck, and configured PostgreSQL claim proof pass.
- **Committed in:** `c79c8c4`

---

**Total deviations:** 1 auto-fixed missing-critical TOCTOU control.
**Impact on plan:** The lock closes a reachable install-race window required by D-04; it changes no gameplay, public output, or historical evidence.

## Issues Encountered

- The configured local PostgreSQL setup applied migration `0013_runtime_evidence_authority_publication.sql` before the proof run; the isolated test schema then migrated cleanly and the real claim query executed without syntax or lifecycle failures.
- Production conformance authority remains intentionally empty. This is a passing fail-closed result, not a test fixture promoted into counted authority.

## User Setup Required

None - the existing local PostgreSQL topology and repository dependencies were sufficient.

## Verification

- Focused ladder, MatchSet writer, and job suites: 56 passed, 3 configured-database tests skipped in the default run.
- Configured PostgreSQL claim proof: 1 passed, 5 unrelated tests skipped.
- `@cowards/persistence` TypeScript build passed.
- `git diff --check` passed.
- Protected dirty `.planning/config.json` and consolidated specification remained untouched and unstaged.

## Next Phase Readiness

- Go parity work can mirror one concrete TypeScript installed-publication and pre-claim contract rather than a declaration-only gate.
- Phase 259 can add production conformance records without changing scheduling ownership: newly installed exact records will flow through the existing publication/source/entrant checks.
- No Match state, Action legality, event order, outcome, Strategy observation, or immutable v1.4 Chronicle/result changed.

## Self-Check: PASSED

- All four RED/GREEN commits exist and all four planned implementation/test files are present.
- Both task acceptance gates and the plan-level configured PostgreSQL command pass.
- Rejected claims perform no lifecycle mutation and successful claims return the complete locked identity.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
