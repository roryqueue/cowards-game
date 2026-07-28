---
phase: 256-counted-safety-and-canonical-authority
plan: "18"
subsystem: runtime-authority
tags: [postgresql, ed25519, append-only, atomic-install, fsync, provenance]
requires:
  - phase: 256-15
    provides: verified append-only runtime evidence imports and derived certificates
  - phase: 256-17
    provides: exact-byte Ed25519 authority envelope and anti-rollback contract
provides:
  - authenticated append-only lane-control, revocation, and supersession ledgers
  - deterministic serialized authority snapshots with exact source provenance
  - external-key signing and failure-safe atomic last-good installation
  - explicit post-rename uncertainty and database-receipt reconciliation
affects: [runtime-service, go-backend, scheduler, phase-259-conformance, phase-261-release]
tech-stack:
  added: []
  patterns: [serializable advisory-lock publication, external signer callback, same-directory atomic replacement, append-only reconciliation receipts]
key-files:
  created:
    - packages/persistence/migrations/0013_runtime_evidence_authority_publication.sql
    - packages/persistence/src/runtime-evidence-authority-publisher.ts
    - scripts/publish-v1-37-runtime-evidence-authority.ts
    - scripts/publish-v1-37-runtime-evidence-authority.test.ts
  modified:
    - packages/persistence/src/runtime-evidence-authority-publisher.test.ts
    - packages/persistence/src/index.ts
    - package.json
key-decisions:
  - "Publication signs one canonical snapshot inside a serializable transaction after locking both the publication authority and generation head."
  - "Authenticated controls and certificate status imports are reverified from their exact persisted signed payloads before selection; caller-supplied records, IDs, generation, or eligibility never enter authority."
  - "Install success requires verified bytes, file fsync, atomic rename, parent-directory fsync, and an exact append-only receipt; post-rename uncertainty is never reported as success."
patterns-established:
  - "Publication provenance: every prepared generation stores exact payload/envelope/source hashes plus sorted source IDs and per-source foreign-key rows."
  - "Last-good install: all pre-rename failures clean temporary files and preserve the target, while exact new target bytes are reconciled without regenerating or resigning."
requirements-completed: [SAFE-01, SAFE-02, AUTH-01, AUTH-02, AUTH-03, AUTH-05]
coverage:
  - id: D1
    description: "Authenticated lane controls, revocations, supersessions, publications, sources, and events are immutable and invalid imports write zero rows"
    requirement: AUTH-02
    verification:
      - kind: integration
        ref: "packages/persistence/src/runtime-evidence-authority-publisher.test.ts#PostgreSQL append-only runtime evidence authority schema"
        status: pass
    human_judgment: false
  - id: D2
    description: "Verified records produce deterministic externally signed snapshots with unique serialized generations and exact replayable provenance"
    requirement: AUTH-01
    verification:
      - kind: integration
        ref: "packages/persistence/src/runtime-evidence-authority-publisher.test.ts#builds and signs a deterministic locked snapshot with exact source provenance"
        status: pass
      - kind: integration
        ref: "packages/persistence/src/runtime-evidence-authority-publisher.test.ts#rolls back signer failure and serializes concurrent snapshot generations"
        status: pass
    human_judgment: false
  - id: D3
    description: "Verified publications install atomically with restrictive permissions, last-good preservation, uncertainty evidence, and exact retry reconciliation"
    requirement: SAFE-02
    verification:
      - kind: integration
        ref: "packages/persistence/src/runtime-evidence-authority-publisher.test.ts#install fsync rename last-good reconcile matrix"
        status: pass
      - kind: unit
        ref: "scripts/publish-v1-37-runtime-evidence-authority.test.ts#v1.37 runtime evidence authority publisher CLI"
        status: pass
    human_judgment: false
duration: 31min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 18: Runtime Evidence Authority Publication Summary

**Verified append-only evidence now produces provenance-complete signed generations and installs them through a failure-safe atomic last-good control plane.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-07-13T05:01:53Z
- **Completed:** 2026-07-13T05:32:26Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Added separate authenticated append-only lane-control, certificate-revocation, certificate-supersession, publication, source, and event ledgers with exact foreign keys, replay/conflict/cycle rejection, and mutation-rejection triggers.
- Added a serializable PostgreSQL publisher that locks generation allocation, reverifies signed imported records, derives canonical sorted payloads, signs exact bytes through an external callback, and persists complete source/hash provenance atomically.
- Added an independently verified, restrictive-mode, same-directory temp-write/fsync/close/rename/directory-fsync installer with deterministic failed/uncertain/installed receipts and exact recovery after durability or database-receipt uncertainty.
- Added an explicit production operator CLI that requires protected external Ed25519 key configuration and emits only a stable public-safe receipt.

## Task Commits

1. **Task 1 RED: authority ledger rejection tests** - `4d018a9` (test)
2. **Task 1 GREEN: authenticated append-only authority ledgers** - `6aa4390` (feat)
3. **Task 2 RED: deterministic publisher tests** - `149f605` (test)
4. **Task 2 GREEN: locked signed snapshot publisher** - `c524105` (feat)
5. **Task 3 RED: atomic installer and CLI tests** - `3f6dc97` (test)
6. **Task 3 GREEN: failure-safe installer and operator command** - `e2b8345` (feat)

## Files Created/Modified

- `packages/persistence/migrations/0013_runtime_evidence_authority_publication.sql` - Immutable authenticated control/status ledgers, publication head, generations, source provenance, and lifecycle events.
- `packages/persistence/src/runtime-evidence-authority-publisher.ts` - Signed import verification, deterministic locked publication, external signing, atomic installation, and reconciliation.
- `packages/persistence/src/runtime-evidence-authority-publisher.test.ts` - Fake-pool rejection plus configured PostgreSQL publication, concurrency, provenance, filesystem, and receipt-failure matrix.
- `scripts/publish-v1-37-runtime-evidence-authority.ts` - Explicit protected-key PostgreSQL publication/install command with public-safe output.
- `scripts/publish-v1-37-runtime-evidence-authority.test.ts` - Key protection, independent public-key verification, safe receipt, and mismatch rejection.
- `packages/persistence/src/index.ts` and `package.json` - Public persistence export and explicit operator-only command registration.

## Decisions Made

- Kept signing outside PostgreSQL and accepted only a signer callback/private-key path at the operator boundary; private key bytes and paths are absent from rows, receipts, and output.
- Selected all verified certificates and their exact attestations, status records, and authenticated controls under one publication lock; production rejects fixture-domain records and still rejects conformance until Phase 259.
- Folded compensating lane controls by stable sequence, retained every selected control as provenance, and rendered only the latest uncompensated disable per exact lane.
- Used session advisory locking for target installation so concurrent processes serialize filesystem replacement and receipt reconciliation without storing host paths.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Concurrency] Retried PostgreSQL serialization failures**
- **Found during:** Task 2 concurrent publisher proof
- **Issue:** A waiting serializable transaction could retain a pre-lock snapshot and receive SQLSTATE `40001` when it locked the updated generation head.
- **Fix:** Added a bounded three-attempt serializable transaction retry; failed attempts roll back before a fresh snapshot and never allocate or persist a generation.
- **Files modified:** `packages/persistence/src/runtime-evidence-authority-publisher.ts`
- **Verification:** Two concurrent publishers commit unique consecutive generations and signer failure leaves the head unchanged.
- **Committed in:** `c524105`

**2. [Rule 1 - Provenance] Compared PostgreSQL JSONB receipts canonically**
- **Found during:** Task 3 installed receipt proof
- **Issue:** PostgreSQL JSONB key ordering differed from JavaScript insertion order, causing an exact semantic receipt to look conflicting.
- **Fix:** Canonically sorted receipt objects before idempotency comparison while retaining exact hash and reason checks.
- **Files modified:** `packages/persistence/src/runtime-evidence-authority-publisher.ts`
- **Verification:** Initial install, exact retry, receipt-failure recovery, and two concurrent installers all pass.
- **Committed in:** `e2b8345`

---

**Total deviations:** 2 auto-fixed bugs (1 serialization retry, 1 canonical receipt comparison).
**Impact on plan:** Both fixes are required for the planned concurrency and idempotent reconciliation guarantees; no scope or gameplay semantics changed.

## Issues Encountered

- `scripts/dev-local-postgres.sh --setup-only` detected the healthy Docker Postgres but invoked host-default `psql` without `-U`, prompting for the workstation user. All proof therefore used the explicit project Docker URL `postgresql://cowards:cowards@localhost:5432/cowards_game`, as required.
- The package-wide TypeScript build currently reports unrelated in-flight Phase 256 identity-callsite errors in `competition.ts`, `ladder.ts`, `workshop.ts`, and older tests. The four modified implementation/test files pass focused ESLint, both focused Vitest suites, and the configured PostgreSQL matrix; no Plan 18 type error remains in those results.

## User Setup Required

None for repository verification. Production use of `v1.37:runtime-authority:publish` intentionally requires explicit database, private/public key, target, signer ID, validity, and optional import-trust-root configuration; the private key file must have no group/world permissions.

## Verification

- Configured PostgreSQL publisher/install suite passed: 13/13 tests.
- External-key CLI suite passed: 2/2 tests.
- Failure proof covers forged/stale/wrong-domain imports; replay/conflict/self/cycle rejection; signer rollback; concurrent generation allocation; temp write, file fsync, close, rename, directory fsync, receipt failure, exact retry, restrictive mode, unchanged last-good bytes, and concurrent installers.
- Focused ESLint and `git diff --check` passed for every Plan 18 implementation and test file.
- No production conformance certificate was published or enabled.

## Next Phase Readiness

- Scheduling, runtime-service, and Go can consume a real installed authority generation whose exact source evidence and lifecycle are reconstructible from PostgreSQL.
- Phase 259 can add separately reviewed executable conformance imports without changing the publication/install trust boundary.
- No Match state, Action legality, event order, outcome, Strategy observation, public DTO, or historical v1.4 evidence changed.

## Self-Check: PASSED

- All six RED/GREEN task commits exist in order and all planned artifacts exist.
- Every Task 1-3 acceptance class has configured PostgreSQL or filesystem-injection proof.
- The protected dirty consolidated spec and `.planning/config.json` remain untouched and unstaged.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
