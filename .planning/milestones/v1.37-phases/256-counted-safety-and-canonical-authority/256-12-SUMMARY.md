---
phase: 256-counted-safety-and-canonical-authority
plan: "12"
subsystem: go-match-creation
tags: [go, postgres, authority-receipt, execution-evidence, transaction]
requires:
  - phase: 256-04
    provides: normalized MatchSet and ordered per-Match execution identity
  - phase: 256-10
    provides: independently verified Go runtime-evidence authority
  - phase: 256-18
    provides: append-only publication and installation receipt ledger
provides:
  - pre-Begin exact entrant evidence verification for normal Go MatchSet creation
  - in-transaction lock and equality check for the exact installed authority receipt and source set
  - receipt-bound MatchSet, entrant, Match, and job identity persistence with rollback proof
affects: [256-11, go-job-claim, go-completion, service-proof]
tech-stack:
  added: []
  patterns: [pre-transaction evidence evaluation, locked receipt provenance, normalized entrant identity, ordered side-pair propagation]
key-files:
  created:
    - apps/go-backend/integrity_creation.go
    - packages/persistence/migrations/0014_matchset_authority_install_receipts.sql
  modified:
    - apps/go-backend/live_backend.go
    - apps/go-backend/runtime_evidence_authority.go
    - apps/go-backend/integrity_creation_test.go
    - packages/persistence/src/migrations.test.ts
key-decisions:
  - "Normal Go creation independently resolves every entrant against the mounted production authority before opening a transaction; provider metadata cannot authorize work."
  - "The transaction locks the publication head, exact generation, latest terminal event, immutable installed receipt, and complete source set before its first insert."
  - "Containment-only evidence is persistable for explicit exhibition creation, while counted creation still requires conformance and remains unavailable until Phase 259."
patterns-established:
  - "Creation proof order: owned entrants, current mounted authority, exact evidence aggregate, Begin, locked installed receipt, then inserts."
  - "Every Match and job derives its ordered bottom/top pair from the same normalized MatchSet identity rather than caller-provided snapshots."
requirements-completed: [SAFE-01, SAFE-02, AUTH-02, AUTH-03]
coverage:
  - id: D1
    description: "Normal Go creation rejects missing or purpose-insufficient exact evidence before Begin"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "apps/go-backend/integrity_creation_test.go#TestCreateExhibitionMatchSetIntegrityRejectsBeforeBegin"
        status: pass
      - kind: unit
        ref: "apps/go-backend/integrity_creation_test.go#TestCreateExhibitionMatchSetIntegrityPurposeFloors"
        status: pass
    human_judgment: false
  - id: D2
    description: "Creation requires an exact successful installed-publication receipt and rejects unreconciled uncertainty with zero rows"
    requirement: AUTH-03
    verification:
      - kind: integration
        ref: "apps/go-backend/integrity_creation_test.go#TestCreateExhibitionMatchSetIntegrityPostgresReceiptReconciliationAndPropagation"
        status: pass
    human_judgment: false
  - id: D3
    description: "Accepted creation persists one tuple, receipt provenance, complete entrant evidence, and ordered Match/job pairs atomically"
    requirement: AUTH-02
    verification:
      - kind: integration
        ref: "apps/go-backend/integrity_creation_test.go#TestCreateExhibitionMatchSetIntegrityPostgresReceiptReconciliationAndPropagation"
        status: pass
      - kind: unit
        ref: "packages/persistence/src/migrations.test.ts#binds MatchSets to exact installed authority receipts"
        status: pass
    human_judgment: false
duration: 18min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 12: Receipt-Bound Go MatchSet Creation Summary

**Normal Go MatchSet creation now proves exact entrant evidence before Begin, locks the exact installed authority receipt before writing, and atomically propagates that identity through every created record.**

## Performance

- **Duration:** 18 min
- **Completed:** 2026-07-13
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Replaced provider/readiness shortcuts in normal Go creation with independent production-authority certificate resolution and exact per-entrant lane matching before the database transaction starts.
- Added an in-transaction publication-head/receipt/source lock that accepts only the latest exact installed receipt and rejects missing, failed, uncertain, stale, or mismatched provenance without exposing internal detail.
- Persisted the canonical tuple, installed receipt, source set, normalized entrant evidence, competition links, and ordered bottom/top evidence pairs on MatchSet, Match, and job rows.
- Proved against a fresh PostgreSQL schema that an uncertain post-rename state writes zero rows, exact reconciliation succeeds, identities remain aligned, and a forced final insert failure rolls the entire record family back.

## Task Commits

1. **Task 1 RED: exact creation preflight contract** - `afdf8c4` (test)
2. **Task 1 GREEN: exact evidence and installed-receipt verification** - `5483535` (feat)
3. **Task 2 RED: receipt-bound propagation and rollback contract** - `a20aaea` (test)
4. **Task 2 GREEN: complete identity persistence** - `8122546` (feat)

## Files Created/Modified

- `apps/go-backend/integrity_creation.go` - Exact lane/certificate resolution, normalized identity hashes, ordered pair derivation, and locked installed-receipt/source verification.
- `apps/go-backend/live_backend.go` - Preflight ordering and complete transactional identity propagation for normal exhibition creation.
- `apps/go-backend/runtime_evidence_authority.go` - Carries exact publication-envelope and registered tuple identity from verification into creation.
- `apps/go-backend/integrity_creation_test.go` - Begin spies plus fresh-schema PostgreSQL reconciliation, persistence, and late-rollback proof.
- `packages/persistence/migrations/0014_matchset_authority_install_receipts.sql` - Additive receipt provenance columns, immutable constraints, and status-conditioned nullable conformance.
- `packages/persistence/src/migrations.test.ts` - Migration discovery and receipt/conformance contract coverage.

## Decisions Made

- Receipt verification happens again under the creation transaction even though the mounted authority was already verified; this closes post-load publication and reconciliation drift before any write.
- Exact receipt references use prefixed SHA-256 values as published, while existing v1.37 evidence identity columns retain their established unprefixed record-hash representation.
- Historical rows remain nullable and unresolved. New normal creation always writes the complete identity, and immutable triggers prevent later substitution.

## Deviations from Plan

### Auto-fixed Issues

**1. Additive migration required for receipt persistence and valid exhibition evidence**
- **Found during:** Task 2
- **Issue:** Migration 0012 correctly made exact identity additive for historical compatibility, but required conformance on every new execution entrant and had no installed-publication receipt columns. That contradicted D-02 containment-only exhibition creation and could not satisfy the Plan-12 provenance contract.
- **Fix:** Added idempotent migration 0014 rather than rewriting committed migrations 0012/0013. It makes conformance an all-or-none optional group, requires it for counted rows, adds receipt/source identity with foreign keys and immutable checks, and preserves historical null rows.
- **Verification:** Fresh-schema migration and configured PostgreSQL creation test passed; the current database applied 0014 without a constraint failure.
- **Committed in:** `8122546`

**Total deviations:** 1 auto-fixed correctness issue.
**Impact on plan:** Required schema support only; no gameplay, runtime-boundary, public-output, or historical-evidence semantics changed.

## Issues Encountered

- The repository setup script attempted local administration as the host user and printed password errors despite an already healthy configured Cowards PostgreSQL role. Migration was run through the repository migration API with the explicit test database URL instead.
- The first fresh-schema test connection supplied `search_path` as a startup parameter and PostgreSQL reported no selected schema. An explicit per-connection `SET search_path` made schema selection deterministic; all migrations and proofs then passed.

## Verification

- `pnpm --filter @cowards/persistence exec vitest run src/migrations.test.ts` passed (7 tests).
- Configured PostgreSQL `go test ./... -run 'TestCreateExhibitionMatchSet.*Integrity' -count=1` passed, including fresh migrations, reconciliation, identity queries, and forced late rollback.
- Focused Go creation/evidence/authority suite passed.
- `git diff --check` passed.

## User Setup Required

None - the migration runs through the normal persistence migration runner.

## Next Phase Readiness

- Plan 256-11 can consume the persisted publication and receipt identity in claim, execution acceptance, and completion without relying on request echoes.
- Production counted creation remains intentionally closed because the production conformance producer set is empty until Phase 259.
- No Match state, Action legality, event order, outcome, Strategy observation, public output, or v1.4 historical evidence changed.

## Self-Check: PASSED

- Four task commits exist in RED/GREEN order.
- Normal creation cannot call Begin before exact evidence succeeds or write before the exact installed receipt is locked.
- Fresh PostgreSQL proof covers unreconciled rejection, deterministic reconciliation, full identity propagation, and complete late rollback.
- Protected user changes remain unstaged and untouched.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
